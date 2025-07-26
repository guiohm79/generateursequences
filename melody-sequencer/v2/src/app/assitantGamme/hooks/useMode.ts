/**
 * Hook pour la gestion des modes Piano Roll
 */

'use client';

import { useState, useCallback } from 'react';
import { PianoRollMode } from '../types';
import { MODE_CONFIGS } from '../utils/constants';

export function useMode(initialMode: PianoRollMode = 'edition') {
  const [currentMode, setCurrentMode] = useState<PianoRollMode>(initialMode);
  
  const switchMode = useCallback((mode: PianoRollMode) => {
    console.log(`🔄 Switching mode from ${currentMode} to ${mode}`);
    setCurrentMode(mode);
  }, [currentMode]);
  
  const getCurrentModeConfig = useCallback(() => {
    return MODE_CONFIGS[currentMode];
  }, [currentMode]);
  
  const getAvailableModes = useCallback(() => {
    return Object.values(MODE_CONFIGS);
  }, []);
  
  return {
    currentMode,
    switchMode,
    getCurrentModeConfig,
    getAvailableModes,
    modeConfig: MODE_CONFIGS[currentMode]
  };
}