import { createContext, useContext, useState, useEffect } from 'react';

export const TIERS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

const SETTINGS = {
  [TIERS.HIGH]: {
    dpr: [1, 2],
    shadows: true,
    antialias: true,
    powerPreference: 'high-performance',
  },
  [TIERS.MEDIUM]: {
    dpr: [1, 1.5],
    shadows: false,
    antialias: true,
    powerPreference: 'default',
  },
  [TIERS.LOW]: {
    dpr: [0.8, 1],
    shadows: false,
    antialias: false,
    powerPreference: 'low-power',
  },
};

const PerformanceContext = createContext(null);

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

export const PerformanceProvider = ({ children }) => {
  const [tier, setTier] = useState(TIERS.HIGH);

  useEffect(() => {
    let detectedTier = TIERS.HIGH;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) detectedTier = TIERS.MEDIUM;

    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      detectedTier = isMobile ? TIERS.LOW : TIERS.MEDIUM;
    }
    if (navigator.deviceMemory && navigator.deviceMemory <= 4) {
      detectedTier = TIERS.LOW;
    }

    setTier(detectedTier);
  }, []);

  const downgradeTier = () => {
    setTier((current) => {
      if (current === TIERS.HIGH) return TIERS.MEDIUM;
      if (current === TIERS.MEDIUM) return TIERS.LOW;
      return TIERS.LOW;
    });
  };

  const value = { tier, settings: SETTINGS[tier], downgradeTier };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};
