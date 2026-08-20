import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useWorldProgress from '../../hooks/useWorldProgress';
import { useUBLverse } from '../../context/UBLverseContext';
import { getHouseById } from '../../houses/housesConfig';
import { easeInOutCubic, easeOutCubic, smoothstep } from '../../utils/mathUtils';

// The world's opening establishing shot — also waypoint 0 of the tour below.
const OVERVIEW = {
  position: new THREE.Vector3(0, 16, 27),
  lookAt: new THREE.Vector3(0, 1, -9),
  fov: 44,
};

// Camera starts pulled back/high and glides down into OVERVIEW on first
// load — a deliberate "arrival" beat instead of an instant static frame.
const INTRO_START = {
  position: new THREE.Vector3(0, 30, 44),
  lookAt: new THREE.Vector3(0, 2, -8),
  fov: 40,
};
const INTRO_DURATION = 2.6;

// A fixed cinematic sweep across the whole map — scroll on the world
// overview drives progress along this spline, the same lerp-toward-target
// + spline-traversal mechanism used for House entry, just applied to a
// "tour" instead of a single building.
const TOUR_WAYPOINTS = [
  { position: OVERVIEW.position.clone(), lookAt: OVERVIEW.lookAt.clone(), fov: 44 },
  { position: new THREE.Vector3(-12, 10, 15), lookAt: new THREE.Vector3(-8, 1, -4), fov: 40 },
  { position: new THREE.Vector3(0, 5.2, 3.5), lookAt: new THREE.Vector3(0, 1, -18), fov: 37 },
  { position: new THREE.Vector3(12, 9.5, -8), lookAt: new THREE.Vector3(9, 1, -20), fov: 40 },
  { position: new THREE.Vector3(2, 19, 19), lookAt: new THREE.Vector3(-1, 1.2, -15), fov: 45 },
];

function buildSplineFromWaypoints(waypoints) {
  const posCurve = new THREE.CatmullRomCurve3(waypoints.map((w) => w.position), false, 'catmullrom', 0.5);
  const lookCurve = new THREE.CatmullRomCurve3(waypoints.map((w) => w.lookAt), false, 'catmullrom', 0.5);
  const fovs = waypoints.map((w) => w.fov ?? 44);
  const fovAt = (t) => {
    const segments = fovs.length - 1;
    const scaled = Math.min(1, Math.max(0, t)) * segments;
    const i = Math.min(segments - 1, Math.floor(scaled));
    const localT = scaled - i;
    return THREE.MathUtils.lerp(fovs[i], fovs[i + 1], localT);
  };
  return { posCurve, lookCurve, fovAt };
}

// Builds a 4-waypoint spline (world overview -> approach -> threshold -> interior)
// purely from a House's `position` in housesConfig — this is what makes the
// House entry engine reusable across every House without hand-authored camera
// rigs per building.
function buildHouseWaypoints(house, startPos, startLook) {
  const p = new THREE.Vector3(...house.position);
  const doorFacing = new THREE.Vector3(-p.x, 0, -p.z);
  if (doorFacing.lengthSq() < 0.0001) doorFacing.set(0, 0, 1);
  doorFacing.normalize();

  const approachPos = p.clone().addScaledVector(doorFacing, 8.5).add(new THREE.Vector3(0, 4.4, 0));
  const approachLook = p.clone().add(new THREE.Vector3(0, 1.6, 0));

  const thresholdPos = p.clone().addScaledVector(doorFacing, 3.6).add(new THREE.Vector3(0, 1.75, 0));
  const thresholdLook = p.clone().addScaledVector(doorFacing, -1.2).add(new THREE.Vector3(0, 1.5, 0));

  const interiorPos = p.clone().addScaledVector(doorFacing, -1.8).add(new THREE.Vector3(0, 1.55, 0));
  const interiorLook = p.clone().addScaledVector(doorFacing, -7).add(new THREE.Vector3(0, 1.45, 0));

  return buildSplineFromWaypoints([
    { position: startPos.clone(), lookAt: startLook.clone() },
    { position: approachPos, lookAt: approachLook },
    { position: thresholdPos, lookAt: thresholdLook },
    { position: interiorPos, lookAt: interiorLook },
  ]);
}

const CameraRig = () => {
  const { camera } = useThree();
  const { mode, selectedHouseId, registerControls, finishExit, progressRef, doorRef } = useUBLverse();

  const mouse = useRef({ x: 0, y: 0 });
  const idleTime = useRef(0);
  const introState = useRef({ active: true, t: 0 });
  const blendFromCamera = useRef(null); // set on return-to-overview, blended out over ~1s

  const waypointsRef = useRef(null);
  const exitNowRef = useRef(() => {});
  const lastAutoTriggerRef = useRef(null);

  const tourSpline = useMemo(() => buildSplineFromWaypoints(TOUR_WAYPOINTS), []);

  useEffect(() => {
    const handleMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const onOverscrollExit = useCallback(() => exitNowRef.current(), []);
  const { progress: houseProgress, animateTo } = useWorldProgress({
    enabled: mode === 'house',
    onOverscrollExit,
  });
  const { progress: tourProgress } = useWorldProgress({
    enabled: mode === 'overview',
    resetOnDisable: false,
    speed: 0.00085,
    smoothing: 0.055,
  });

  useFrame(() => {
    progressRef.current = mode === 'house' ? houseProgress.current : 0;
    doorRef.current = mode === 'house' ? smoothstep(0.52, 0.82, houseProgress.current) : 0;
  });

  useEffect(() => {
    exitNowRef.current = () => {
      animateTo(0, 1.3, () => {
        blendFromCamera.current = {
          position: camera.position.clone(),
          fov: camera.fov,
          t: 0,
        };
        finishExit();
      });
    };
    registerControls(exitNowRef.current, () => animateTo(1, 5.2));
  }, [animateTo, camera, finishExit, registerControls]);

  // Build the spline the moment a House is selected, snapshotting the live
  // camera pose as the path's start point so there is zero pop/snap.
  useEffect(() => {
    if (mode === 'house' && selectedHouseId) {
      const house = getHouseById(selectedHouseId);
      if (!house) return;
      waypointsRef.current = buildHouseWaypoints(house, camera.position, currentLookTarget(camera));

      if (lastAutoTriggerRef.current !== selectedHouseId) {
        lastAutoTriggerRef.current = selectedHouseId;
        animateTo(1, 5.2);
      }
    } else {
      lastAutoTriggerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedHouseId]);

  useFrame((_, delta) => {
    if (mode === 'house' && waypointsRef.current) {
      const t = easeInOutCubic(Math.min(1, Math.max(0, houseProgress.current)));
      const { posCurve, lookCurve } = waypointsRef.current;
      const pos = posCurve.getPointAt(Math.min(1, t));
      const look = lookCurve.getPointAt(Math.min(1, t));
      camera.position.copy(pos);
      camera.lookAt(look);
      const targetFov = THREE.MathUtils.lerp(OVERVIEW.fov, 38, t);
      if (Math.abs(camera.fov - targetFov) > 0.01) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
      return;
    }

    // --- Overview mode ---
    idleTime.current += delta;

    // One-time arrival glide from a pulled-back establishing pose into the
    // tour's starting frame.
    if (introState.current.active) {
      introState.current.t = Math.min(1, introState.current.t + delta / INTRO_DURATION);
      const e = easeOutCubic(introState.current.t);
      camera.position.lerpVectors(INTRO_START.position, TOUR_WAYPOINTS[0].position, e);
      const look = new THREE.Vector3().lerpVectors(INTRO_START.lookAt, TOUR_WAYPOINTS[0].lookAt, e);
      camera.lookAt(look);
      const fov = THREE.MathUtils.lerp(INTRO_START.fov, TOUR_WAYPOINTS[0].fov, e);
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      if (introState.current.t >= 1) introState.current.active = false;
      return;
    }

    const t = easeInOutCubic(Math.min(1, Math.max(0, tourProgress.current)));
    const tourPos = tourSpline.posCurve.getPointAt(t);
    const tourLook = tourSpline.lookCurve.getPointAt(t);
    const tourFov = tourSpline.fovAt(t);

    const parallaxX = mouse.current.x * 0.9;
    const parallaxY = -mouse.current.y * 0.4;
    const bob = Math.sin(idleTime.current * 0.3) * 0.12;

    const finalPos = tourPos.clone().add(new THREE.Vector3(parallaxX, bob + parallaxY * 0.4, 0));
    const finalLook = tourLook.clone().add(new THREE.Vector3(parallaxX * 0.35, parallaxY * 0.2, 0));

    // Blend out of wherever the House-exit animation left the camera, back
    // onto the tour path, instead of snapping onto it.
    if (blendFromCamera.current) {
      const b = blendFromCamera.current;
      b.t = Math.min(1, b.t + delta * 0.85);
      const e = easeOutCubic(b.t);
      camera.position.lerpVectors(b.position, finalPos, e);
      camera.lookAt(finalLook);
      const fov = THREE.MathUtils.lerp(b.fov, tourFov, e);
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      if (b.t >= 1) blendFromCamera.current = null;
      return;
    }

    camera.position.lerp(finalPos, 0.09);
    camera.lookAt(finalLook);
    if (Math.abs(camera.fov - tourFov) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, tourFov, 0.08);
      camera.updateProjectionMatrix();
    }
  });

  return null;
};

// Approximate current look-at point from camera orientation, used only as a
// snapshot to seed the spline's start waypoint.
function currentLookTarget(camera) {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  return camera.position.clone().addScaledVector(dir, 10);
}

export default CameraRig;
export { OVERVIEW };
