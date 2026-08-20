import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { PerformanceProvider, usePerformance } from './context/PerformanceContext';
import { UBLverseProvider } from './context/UBLverseContext';
import Experience from './components/canvas/Experience';
import Preloader from './components/dom/Preloader';
import HouseContent from './components/dom/HouseContent';
import UBLverseUI from './components/ui/UBLverseUI';

function Scene() {
  const { settings, downgradeTier } = usePerformance();

  return (
    <Canvas
      camera={{ position: [0, 14, 23], fov: 45, near: 0.1, far: 160 }}
      gl={{
        antialias: settings.antialias,
        powerPreference: settings.powerPreference,
      }}
      dpr={settings.dpr}
      shadows={settings.shadows}
    >
      <PerformanceMonitor onDecline={() => downgradeTier()} flipflops={3} onFallback={() => downgradeTier()} />
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
    </Canvas>
  );
}

function AppContent() {
  return (
    <div className="app">
      <div className="canvas-wrapper">
        <Scene />
      </div>

      <UBLverseUI />
      <HouseContent />
      <Preloader />
    </div>
  );
}

export default function App() {
  return (
    <PerformanceProvider>
      <UBLverseProvider>
        <AppContent />
      </UBLverseProvider>
    </PerformanceProvider>
  );
}
