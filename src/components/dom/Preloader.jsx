import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

const Preloader = () => {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);
  const [everStarted, setEverStarted] = useState(false);

  useEffect(() => {
    if (active) setEverStarted(true);
  }, [active]);

  useEffect(() => {
    if (everStarted && !active && progress >= 100) {
      const t = setTimeout(() => setVisible(false), 260);
      return () => clearTimeout(t);
    }
    if (!everStarted) {
      // Nothing to preload / instant — still give the world one frame to paint.
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [active, progress, everStarted]);

  if (!visible) return null;

  return (
    <div className={`preloader ${!active && everStarted ? 'preloader--done' : ''}`}>
      <img src="/logos/ubl-logo-white.png" alt="" className="preloader__mark" />
    </div>
  );
};

export default Preloader;
