import { createContext, useContext, useCallback, useMemo, useRef, useState } from 'react';

const UBLverseContext = createContext(null);

export const useUBLverse = () => {
  const ctx = useContext(UBLverseContext);
  if (!ctx) throw new Error('useUBLverse must be used within a UBLverseProvider');
  return ctx;
};

export const UBLverseProvider = ({ children }) => {
  const [mode, setMode] = useState('overview'); // 'overview' | 'house'
  const [selectedHouseId, setSelectedHouseId] = useState(null);
  const [hoveredHouseId, setHoveredHouseId] = useState(null);

  // Shared runtime refs — mutated per-frame by CameraRig, read directly by
  // House doors and the DOM content panel without triggering React renders.
  const progressRef = useRef(0);
  const doorRef = useRef(0);
  const requestExitRef = useRef(null);
  const requestEnterAnimRef = useRef(null);

  const selectHouse = useCallback((id) => {
    setSelectedHouseId(id);
    setMode('house');
  }, []);

  const exitHouse = useCallback(() => {
    requestExitRef.current?.();
  }, []);

  const registerControls = useCallback((exitFn, enterAnimFn) => {
    requestExitRef.current = exitFn;
    requestEnterAnimRef.current = enterAnimFn;
  }, []);

  const finishExit = useCallback(() => {
    setMode('overview');
    setSelectedHouseId(null);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      selectedHouseId,
      hoveredHouseId,
      setHoveredHouseId,
      selectHouse,
      exitHouse,
      finishExit,
      registerControls,
      requestEnterAnimRef,
      progressRef,
      doorRef,
    }),
    [mode, selectedHouseId, hoveredHouseId, selectHouse, exitHouse, finishExit, registerControls]
  );

  return <UBLverseContext.Provider value={value}>{children}</UBLverseContext.Provider>;
};

export default UBLverseContext;
