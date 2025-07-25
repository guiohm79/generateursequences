/**
 * Sélecteur de modes pour le Piano Roll Base
 */

'use client';

import React from 'react';
import { PianoRollMode, ModeConfig } from '../types';

interface ModeSelectorProps {
  currentMode: PianoRollMode;
  availableModes: ModeConfig[];
  onModeChange: (mode: PianoRollMode) => void;
}

export function ModeSelector({ currentMode, availableModes, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="w-full text-lg font-bold text-white mb-2">🎛️ Sélecteur de Modes</h3>
      
      {availableModes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${currentMode === mode.id 
              ? `${mode.color} text-white shadow-lg scale-105` 
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }
            ${mode.status === 'planned' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          disabled={mode.status === 'planned'}
          title={mode.description}
        >
          <span className="mr-2">{mode.icon}</span>
          {mode.title}
          {mode.status === 'experimental' && (
            <span className="ml-1 text-xs opacity-75">BETA</span>
          )}
          {mode.status === 'planned' && (
            <span className="ml-1 text-xs opacity-75">BIENTÔT</span>
          )}
        </button>
      ))}
    </div>
  );
}