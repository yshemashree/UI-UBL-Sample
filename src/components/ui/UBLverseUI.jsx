import { useEffect, useState } from 'react';
import { useUBLverse } from '../../context/UBLverseContext';

const UBLverseUI = () => {
  const { mode } = useUBLverse();
  const [welcomeStage, setWelcomeStage] = useState('in'); // 'in' | 'hold' | 'out' | 'gone'

  useEffect(() => {
    const t1 = setTimeout(() => setWelcomeStage('hold'), 250);
    const t2 = setTimeout(() => setWelcomeStage('out'), 3400);
    const t3 = setTimeout(() => setWelcomeStage('gone'), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="ublverse-ui">
      <div className="ublverse-ui__top">
        <img src="/logos/ubl-logo-white.png" alt="United Breweries Limited" className="ublverse-ui__logo" />
        <span className="ublverse-ui__wordmark">UBLVERSE</span>
      </div>

      {welcomeStage !== 'gone' && (
        <div className={`ublverse-welcome ublverse-welcome--${welcomeStage}`}>
          <span className="ublverse-welcome__eyebrow">Welcome to</span>
          <span className="ublverse-welcome__title">The UBLverse</span>
        </div>
      )}

      {mode === 'overview' && (
        <div className="ublverse-ui__hint">
          <span>Scroll to explore the world</span>
          <span className="ublverse-ui__hint-dot">•</span>
          <span>Tap a House to step inside</span>
        </div>
      )}

      {mode === 'house' && (
        <div className="ublverse-ui__hint ublverse-ui__hint--house">
          <span>Scroll to travel through the House</span>
        </div>
      )}
    </div>
  );
};

export default UBLverseUI;
