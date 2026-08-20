import { useUBLverse } from '../../context/UBLverseContext';

const UBLverseUI = () => {
  const { mode } = useUBLverse();

  return (
    <div className="ublverse-ui">
      <div className="ublverse-ui__top">
        <img src="/logos/ubl-logo-white.png" alt="United Breweries Limited" className="ublverse-ui__logo" />
        <span className="ublverse-ui__wordmark">UBLVERSE</span>
      </div>

      {mode === 'overview' && (
        <div className="ublverse-ui__hint">
          <span>Scroll or drag to look around</span>
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
