import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useWorldProgress from '../../hooks/useWorldProgress';
import { useUBLverse } from '../../context/UBLverseContext';
import { getHouseById } from '../../houses/housesConfig';
import { easeInOutCubic, smoothstep } from '../../utils/mathUtils';

// Canonical overview camera pose — the world's "establishing shot".
// Elevated 3/4 view so the whole UBLverse map reads at a glance, like the
// isometric reference, but framed cinematically rather than flat/top-down.
const OVERVIEW = {
  position: new THREE.Vector3(0, 14, 23),
  lookAt: new THREE.Vector3(0, 0.6, -11),
  fov: 45,
};

const UP = new THREE.Vector3(0, 1, 0);

// Builds a 4-waypoint spline (world overview -> approach -> threshold -> interior)
// purely from a House's `position` in housesConfig — this is what makes the
// House entry engine reusable across every House without hand-authored camera
// rigs per building.
function buildWaypoints(house, startPos, startLook) {
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

  const posCurve = new THREE.CatmullRomCurve3(
    [startPos.clone(), approachPos, thresholdPos, interiorPos],
    false,
    'catmullrom',
    0.4
  );
  const lookCurve = new THREE.CatmullRomCurve3(
    [startLook.clone(), approachLook, thresholdLook, interiorLook],
    false,
    'catmullrom',
    0.4
  );

  return { posCurve, lookCurve, doorFacing, housePos: p };
}

const CameraRig = () => {
  const { camera } = useThree();
  const { mode, selectedHouseId, registerControls, finishExit, progressRef, doorRef } = useUBLverse();

  const idleTime = useRef(0);
  const idleBase = useRef(OVERVIEW.position.clone());
  const idleBaseLook = useRef(OVERVIEW.lookAt.clone());
  const idleBlend = useRef(1); // 1 = fully settled on canonical overview pose
  const mouse = useRef({ x: 0, y: 0 });

  const waypointsRef = useRef(null);
  const exitNowRef = useRef(() => {});
  const lastAutoTriggerRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const onOverscrollExit = useCallback(() => exitNowRef.current(), []);
  const { progress, animateTo } = useWorldProgress({ enabled: mode === 'house', onOverscrollExit });

  // keep the shared context progress ref in sync so DOM/door consumers can read it
  useFrame(() => {
    progressRef.current = mode === 'house' ? progress.current : 0;
    doorRef.current = mode === 'house' ? smoothstep(0.52, 0.82, progress.current) : 0;
  });

  useEffect(() => {
    exitNowRef.current = () => {
      animateTo(0, 1.3, () => {
        idleBase.current.copy(camera.position);
        idleBaseLook.current.copy(OVERVIEW.lookAt);
        idleBlend.current = 0;
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
      waypointsRef.current = buildWaypoints(house, camera.position, currentLookTarget(camera));

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
      const t = easeInOutCubic(Math.min(1, Math.max(0, progress.current)));
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

    // Overview idle: gentle auto-drift + mouse parallax, blended in smoothly
    // after returning from a House (mirrors the source engine's blend-in
    // technique that prevents a snap when hooks re-enable).
    idleTime.current += delta;
    idleBlend.current = Math.min(1, idleBlend.current + delta * 0.6);

    const sway = Math.sin(idleTime.current * 0.18) * 0.5;
    const bob = Math.sin(idleTime.current * 0.27) * 0.18;
    const parallaxX = mouse.current.x * 1.1;
    const parallaxY = -mouse.current.y * 0.5;

    const targetPos = OVERVIEW.position.clone().add(new THREE.Vector3(sway + parallaxX, bob + parallaxY * 0.4, 0));
    const targetLook = OVERVIEW.lookAt.clone().add(new THREE.Vector3(parallaxX * 0.4, parallaxY * 0.2, 0));

    const blended = idleBase.current.clone().lerp(targetPos, idleBlend.current);
    const blendedLook = idleBaseLook.current.clone().lerp(targetLook, idleBlend.current);

    camera.position.lerp(blended, 0.06);
    camera.lookAt(blendedLook);

    if (Math.abs(camera.fov - OVERVIEW.fov) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, OVERVIEW.fov, 0.08);
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
export { OVERVIEW, UP };
