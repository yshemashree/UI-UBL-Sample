import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useUBLverse } from '../../context/UBLverseContext';
import { smoothstep } from '../../utils/mathUtils';

const BUILDING_W = 5.6;
const BUILDING_H = 4.2;
const BUILDING_D = 6.5;
const DOOR_W = 1.7;
const DOOR_H = 2.7;
const DOOR_Z = BUILDING_D / 2 - 0.15;
const TRIM = '#f4efe6';

// Deterministic small offsets so decorative trees differ per House without
// randomness (stable across renders / SSR-free but still non-uniform).
const hashOffsets = (id) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  const a = (h % 100) / 100;
  const b = ((h * 7) % 100) / 100;
  return { a, b };
};

const Tree = ({ position, color }) => (
  <group position={position}>
    <mesh position={[0, 0.4, 0]} castShadow>
      <cylinderGeometry args={[0.08, 0.1, 0.8, 6]} />
      <meshStandardMaterial color="#5b4630" roughness={1} />
    </mesh>
    <mesh position={[0, 1.15, 0]} castShadow>
      <coneGeometry args={[0.55, 1.3, 7]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  </group>
);

// A small window strip flanking the door, giving the facade some life.
const Windows = ({ accent }) => (
  <>
    {[-1, 1].map((side) => (
      <mesh key={side} position={[side * 1.55, BUILDING_H * 0.62, DOOR_Z + 0.03]}>
        <planeGeometry args={[0.75, 1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.55} roughness={0.4} />
      </mesh>
    ))}
  </>
);

// Every House gets a distinct, small hand-built prop beside the building so
// the six Houses read as different places rather than six identical boxes
// with different paint. Kept to primitives so it stays cheap and reusable.
const HouseAccessory = ({ id, accent }) => {
  switch (id) {
    case 'brewery':
      return (
        <group position={[-3.9, 0, -1.4]}>
          {[0, 1].map((i) => (
            <group key={i} position={[i * 1.1, 0, 0]}>
              <mesh position={[0, 1.3, 0]} castShadow>
                <cylinderGeometry args={[0.55, 0.55, 2.6, 16]} />
                <meshStandardMaterial color="#cfd6de" roughness={0.35} metalness={0.75} />
              </mesh>
              <mesh position={[0, 2.65, 0]}>
                <coneGeometry args={[0.58, 0.5, 16]} />
                <meshStandardMaterial color={accent} roughness={0.4} metalness={0.6} />
              </mesh>
            </group>
          ))}
          <mesh position={[0.55, 2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 1.1, 8]} />
            <meshStandardMaterial color="#8a8fa3" roughness={0.4} metalness={0.7} />
          </mesh>
        </group>
      );
    case 'brands':
      return (
        <group position={[3.7, 0, -1.6]}>
          <mesh position={[0, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 2.8, 8]} />
            <meshStandardMaterial color="#e7dfcd" roughness={0.6} />
          </mesh>
          <mesh position={[0.42, 2.35, 0]} rotation={[0, 0, -0.15]}>
            <planeGeometry args={[0.85, 0.55]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    case 'people':
      return (
        <group position={[3.6, 0, 1.6]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[1.3, 0.12, 0.45]} />
            <meshStandardMaterial color="#c9a869" roughness={0.7} />
          </mesh>
          <mesh position={[-0.5, 0.2, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.4]} />
            <meshStandardMaterial color="#5b4630" roughness={0.8} />
          </mesh>
          <mesh position={[0.5, 0.2, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.4]} />
            <meshStandardMaterial color="#5b4630" roughness={0.8} />
          </mesh>
          <mesh position={[0.9, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 2, 8]} />
            <meshStandardMaterial color="#3a2d1f" roughness={0.6} />
          </mesh>
          <mesh position={[0.9, 2.35, 0]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} />
          </mesh>
        </group>
      );
    case 'innovation':
      return (
        <group position={[0, BUILDING_H + 1.9, 0.5]}>
          <mesh rotation={[Math.PI / 2.6, 0, 0]} castShadow>
            <torusGeometry args={[0.7, 0.06, 10, 24, Math.PI * 1.4]} />
            <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial color="#e7dfcd" roughness={0.4} metalness={0.5} />
          </mesh>
        </group>
      );
    case 'sustainability':
      return (
        <group position={[-3.7, 1.1, 1.6]} rotation={[0, 0.3, -0.35]}>
          <mesh castShadow>
            <boxGeometry args={[1.6, 0.06, 1]} />
            <meshStandardMaterial color="#1c2b4a" roughness={0.25} metalness={0.4} />
          </mesh>
          {[-0.5, 0, 0.5].map((x) => (
            <mesh key={x} position={[x, 0.031, 0]}>
              <boxGeometry args={[0.02, 0.08, 1]} />
              <meshStandardMaterial color="#0d1830" roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'distribution':
      return (
        <group position={[-3.6, 0, -1.5]}>
          {[
            [0, 0.25, 0],
            [0.55, 0.25, 0.1],
            [0.25, 0.75, 0.05],
          ].map((pos, i) => (
            <mesh key={i} position={pos} rotation={[0, i * 0.4, 0]} castShadow>
              <boxGeometry args={[0.55, 0.5, 0.55]} />
              <meshStandardMaterial color={i % 2 ? accent : '#8a5a2c'} roughness={0.8} />
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
};

const House = ({ house }) => {
  const { mode, selectedHouseId, hoveredHouseId, setHoveredHouseId, selectHouse, doorRef } = useUBLverse();

  const buildingMat = useRef();
  const roofMat = useRef();
  const doorPivot = useRef();
  const glowMat = useRef();
  const doorLocalOpen = useRef(0);

  const isSelected = selectedHouseId === house.id;
  const isHovered = hoveredHouseId === house.id;
  const isDimmed = mode === 'house' && !isSelected;

  const p = useMemo(() => new THREE.Vector3(...house.position), [house.position]);
  const yaw = useMemo(() => {
    const dir = new THREE.Vector3(-p.x, 0, -p.z);
    if (dir.lengthSq() < 0.0001) return 0;
    dir.normalize();
    return Math.atan2(dir.x, dir.z);
  }, [p]);

  const { a, b } = useMemo(() => hashOffsets(house.id), [house.id]);
  const baseColor = useMemo(() => new THREE.Color(house.theme), [house.theme]);
  const dimColor = useMemo(() => baseColor.clone().multiplyScalar(0.45), [baseColor]);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (mode !== 'overview') return;
      selectHouse(house.id);
    },
    [mode, selectHouse, house.id]
  );

  const handleOver = useCallback(
    (e) => {
      e.stopPropagation();
      if (mode !== 'overview') return;
      setHoveredHouseId(house.id);
      document.body.style.cursor = 'pointer';
    },
    [mode, setHoveredHouseId, house.id]
  );

  const handleOut = useCallback(
    (e) => {
      e.stopPropagation();
      setHoveredHouseId((current) => (current === house.id ? null : current));
      document.body.style.cursor = 'auto';
    },
    [setHoveredHouseId, house.id]
  );

  useFrame(() => {
    // Door: only the selected House opens, driven by the shared progress-derived doorRef.
    const targetOpen = isSelected ? doorRef.current : isHovered ? 0.08 : 0;
    doorLocalOpen.current += (targetOpen - doorLocalOpen.current) * 0.12;
    if (doorPivot.current) {
      doorPivot.current.rotation.y = -doorLocalOpen.current * Math.PI * 0.58;
    }

    // Emphasis / dimming so the world recedes visually while one House is targeted.
    const targetColor = isDimmed ? dimColor : baseColor;
    if (buildingMat.current) {
      buildingMat.current.color.lerp(targetColor, 0.08);
      const targetEmissive = isSelected ? 0.35 : isHovered ? 0.18 : 0.0;
      buildingMat.current.emissiveIntensity += (targetEmissive - buildingMat.current.emissiveIntensity) * 0.1;
    }
    if (glowMat.current) {
      const targetGlow = isSelected ? 1 : isHovered ? 0.55 : 0.12;
      glowMat.current.opacity += (targetGlow - glowMat.current.opacity) * 0.1;
    }
  });

  const showLabel = mode === 'overview' || (isSelected && mode === 'house');
  const labelFade = mode === 'house' ? smoothstep(0, 0.12, 0) : 1;

  const cornerX = BUILDING_W / 2 - 0.08;
  const cornerZ = BUILDING_D / 2 - 0.08;

  return (
    <group position={[p.x, p.y, p.z]} rotation={[0, yaw, 0]}>
      {/* Podium — two-tier for a bit more structure/grounding */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <cylinderGeometry args={[4.1, 4.3, 0.5, 24]} />
        <meshStandardMaterial color="#f4efe6" roughness={1} />
      </mesh>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[3.85, 3.95, 0.12, 24]} />
        <meshStandardMaterial color={house.accent} roughness={0.9} />
      </mesh>

      {/* Building mass */}
      <group
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <RoundedBox args={[BUILDING_W, BUILDING_H, BUILDING_D]} radius={0.18} smoothness={2} position={[0, BUILDING_H / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial ref={buildingMat} color={house.theme} emissive={house.theme} emissiveIntensity={0} roughness={0.5} metalness={0.08} />
        </RoundedBox>

        {/* Plinth skirt — grounds the building, breaks the flat color block */}
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[BUILDING_W + 0.16, 0.55, BUILDING_D + 0.16]} />
          <meshStandardMaterial color={TRIM} roughness={0.75} />
        </mesh>

        {/* Corner trim strips for structural definition */}
        {[
          [cornerX, cornerZ],
          [-cornerX, cornerZ],
          [cornerX, -cornerZ],
          [-cornerX, -cornerZ],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, BUILDING_H / 2 + 0.3, z]}>
            <boxGeometry args={[0.16, BUILDING_H - 0.6, 0.16]} />
            <meshStandardMaterial color={TRIM} roughness={0.7} />
          </mesh>
        ))}

        <Windows accent={house.accent} />

        {/* Roof cap — shared bronze tone across all Houses ties the world
            together as one family while walls carry each brand's color */}
        <mesh position={[0, BUILDING_H + 0.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[4.35, 1.7, 4]} />
          <meshStandardMaterial ref={roofMat} color="#caa668" roughness={0.5} metalness={0.25} />
        </mesh>
        <mesh position={[0, BUILDING_H + 0.02, 0]}>
          <boxGeometry args={[BUILDING_W + 0.14, 0.14, BUILDING_D + 0.14]} />
          <meshStandardMaterial color={TRIM} roughness={0.6} />
        </mesh>

        {/* Accent band */}
        <mesh position={[0, BUILDING_H * 0.42, BUILDING_D / 2 + 0.01]}>
          <planeGeometry args={[BUILDING_W - 1, 0.5]} />
          <meshStandardMaterial color={house.accent} emissive={house.accent} emissiveIntensity={0.25} roughness={0.4} />
        </mesh>
      </group>

      {/* Door threshold glow ring */}
      <mesh position={[0, 1.35, DOOR_Z + 0.02]}>
        <ringGeometry args={[1.05, 1.28, 32]} />
        <meshBasicMaterial ref={glowMat} color={house.accent} transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* Door */}
      <group position={[-DOOR_W / 2, 0.05, DOOR_Z]}>
        <group ref={doorPivot}>
          <mesh position={[DOOR_W / 2, DOOR_H / 2, 0]} castShadow>
            <boxGeometry args={[DOOR_W, DOOR_H, 0.12]} />
            <meshStandardMaterial color="#241a4d" roughness={0.5} metalness={0.15} />
          </mesh>
          <mesh position={[DOOR_W - 0.18, DOOR_H / 2, 0.08]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color={house.accent} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Per-House signature prop so the six Houses read as distinct places */}
      <HouseAccessory id={house.id} accent={house.accent} />

      {/* Decorative trees for parallax depth during approach */}
      <Tree position={[-(3.6 + a * 1.4), 0, 2.6 + b * 1.2]} color={house.accent} />
      <Tree position={[3.4 + b * 1.4, 0, 2.4 - a * 1.2]} color={house.accent} />

      {showLabel && (
        <Html position={[0, BUILDING_H + 2.4, 0]} center distanceFactor={16} style={{ pointerEvents: 'none', opacity: labelFade }}>
          <div className={`house-label ${isHovered || isSelected ? 'house-label--active' : ''}`}>
            <span className="house-label__name">{house.name}</span>
            {isHovered && mode === 'overview' && (
              <>
                <span className="house-label__tagline">{house.tagline}</span>
                <span className="house-label__cta">EXPLORE</span>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default House;
