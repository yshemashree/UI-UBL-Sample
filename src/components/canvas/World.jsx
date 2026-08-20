import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import House from './House';
import { HOUSES } from '../../houses/housesConfig';

const Road = ({ to }) => {
  const p = new THREE.Vector3(...to);
  const angle = Math.atan2(p.x, p.z);
  const distance = Math.sqrt(p.x * p.x + p.z * p.z);
  const length = Math.max(0.5, distance - 4.3 - 2.6);

  return (
    <group rotation={[0, angle, 0]}>
      <mesh position={[0, 0.01, length / 2 + 2.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2, length]} />
        <meshStandardMaterial color="#e7dfcd" roughness={1} />
      </mesh>
    </group>
  );
};

const HubBanner = () => {
  const texture = useTexture('/logos/ubl-logo-white.png');
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[2.8, 3, 0.7, 28]} />
        <meshStandardMaterial color="#241a4d" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[2.9, 2.9, 0.05, 28]} />
        <meshBasicMaterial color="#9d8cf0" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <planeGeometry args={[3.1, 1.55]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
      </mesh>
    </group>
  );
};

const Hill = ({ position, scale, color }) => (
  <mesh position={position} scale={scale}>
    <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
    <meshStandardMaterial color={color} roughness={1} />
  </mesh>
);

const World = ({ lowTier }) => {
  const hills = useMemo(
    () => [
      { position: [-26, -1.2, -30], scale: [16, 10, 16], color: '#2a1f66' },
      { position: [28, -1.4, -24], scale: [18, 9, 18], color: '#241a56' },
      { position: [4, -1.6, -46], scale: [22, 11, 22], color: '#211a4c' },
      { position: [-14, -1.3, 18], scale: [14, 8, 14], color: '#2a1f66' },
    ],
    []
  );

  return (
    <group>
      {/* Ground */}
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[60, 48]} />
        <meshStandardMaterial color="#3a2d7a" roughness={1} />
      </mesh>

      {/* Distant atmosphere hills (depth cueing, no post-processing needed) */}
      {!lowTier && hills.map((h, i) => <Hill key={i} {...h} />)}

      <HubBanner />

      {HOUSES.map((house) => (
        <Road key={house.id} to={house.position} />
      ))}

      {HOUSES.map((house) => (
        <House key={house.id} house={house} />
      ))}
    </group>
  );
};

export default World;
