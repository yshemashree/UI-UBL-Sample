import { useEffect, useRef } from 'react';
import { useUBLverse } from '../../context/UBLverseContext';
import { getHouseById } from '../../houses/housesConfig';
import { smoothstep } from '../../utils/mathUtils';

const HouseContent = () => {
  const { mode, selectedHouseId, exitHouse, progressRef } = useUBLverse();
  const panelRef = useRef(null);
  const rafRef = useRef(null);

  const house = selectedHouseId ? getHouseById(selectedHouseId) : null;

  useEffect(() => {
    if (mode !== 'house' || !house) return undefined;

    const tick = () => {
      const t = smoothstep(0.8, 0.98, progressRef.current);
      if (panelRef.current) {
        panelRef.current.style.opacity = String(t);
        panelRef.current.style.transform = `translateY(${(1 - t) * 28}px)`;
        panelRef.current.style.pointerEvents = t > 0.6 ? 'auto' : 'none';
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode, house, progressRef]);

  if (mode !== 'house' || !house) return null;

  return (
    <div className="house-content" ref={panelRef} style={{ opacity: 0 }}>
      <div className="house-content__inner">
        <span className="house-content__kicker" style={{ color: house.accent }}>{house.content.kicker}</span>
        <h2 className="house-content__heading">{house.content.heading}</h2>
        <p className="house-content__tagline">{house.tagline}</p>

        <div className="house-content__body">
          {house.content.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {house.content.stats.length > 0 && (
          <div className="house-content__stats">
            {house.content.stats.map((stat) => (
              <div key={stat.label} className="house-content__stat">
                <span className="house-content__stat-value" style={{ color: house.accent }}>{stat.value}</span>
                <span className="house-content__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="house-content__back" onClick={exitHouse}>
          ← Back to UBLverse
        </button>
      </div>
    </div>
  );
};

export default HouseContent;
