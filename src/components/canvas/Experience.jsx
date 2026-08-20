import { Suspense } from 'react';
import { ContactShadows } from '@react-three/drei';
import World from './World';
import CameraRig from './CameraRig';
import { usePerformance, TIERS } from '../../context/PerformanceContext';

const Experience = () => {
  const { tier, settings } = usePerformance();
  const lowTier = tier === TIERS.LOW;

  return (
    <>
      <color attach="background" args={['#1c1147']} />
      <fog attach="fog" args={['#1c1147', 22, 62]} />

      <hemisphereLight args={['#c9c2ff', '#2a2060', 0.85]} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.15}
        color="#fff2df"
        castShadow={settings.shadows}
        shadow-mapSize={settings.shadows ? [1024, 1024] : undefined}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight position={[-8, 6, -10]} intensity={0.3} color="#9d8cf0" />
      <ambientLight intensity={0.25} />

      <CameraRig />

      <Suspense fallback={null}>
        <World lowTier={lowTier} />
      </Suspense>

      {!lowTier && (
        <ContactShadows position={[0, -0.56, 0]} opacity={0.4} scale={70} blur={2.2} far={10} resolution={512} color="#0d0824" />
      )}
    </>
  );
};

export default Experience;
