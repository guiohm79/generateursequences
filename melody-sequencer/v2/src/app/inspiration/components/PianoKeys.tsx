'use client';

import React from 'react';
import { isBlackKey, getOctaveNumber } from '../utils/noteHelpers';

interface PianoKeysProps {
  visibleNotes: string[];
}

export const PianoKeys: React.FC<PianoKeysProps> = ({
  visibleNotes
}) => {
  return (
    <div className="flex-shrink-0 w-24 sm:w-28 bg-gradient-to-r from-slate-700/80 to-slate-800/80 border-r border-slate-600 sticky left-0 z-10">
      {visibleNotes.map((note, noteIndex) => {
        const isBlack = isBlackKey(note);
        const octave = getOctaveNumber(note);
        const noteName = note.replace(/[0-9]/g, '');
        const isOctaveStart = noteName === 'C'; // C marque le début d'une octave
        
        return (
          <div
            key={note}
            className={`
              h-10 sm:h-8 border-b flex items-center justify-between px-2 sm:px-3 text-xs sm:text-sm font-medium
              transition-all duration-200 hover:scale-[1.02] cursor-pointer touch-manipulation
              ${isOctaveStart 
                ? 'border-amber-500/50 border-b-2' 
                : 'border-slate-600/50'
              }
              ${isBlack 
                ? 'bg-gradient-to-r from-slate-900/90 to-slate-800/90 text-slate-300 shadow-inner' 
                : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 shadow-sm'
              }
            `}
          >
            <span className={`font-bold tracking-wide ${isOctaveStart ? 'text-amber-400' : ''}`}>
              {noteName}
            </span>
            <span className={`text-xs font-mono ${
              isOctaveStart 
                ? 'text-amber-500 font-bold' 
                : (isBlack ? 'text-slate-500' : 'text-slate-600')
            }`}>
              {octave}
            </span>
          </div>
        );
      })}
    </div>
  );
};