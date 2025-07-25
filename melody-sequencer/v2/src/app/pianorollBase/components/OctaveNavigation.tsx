'use client';

import React, { useEffect } from 'react';

interface OctaveNavigationProps {
  // === OCTAVE STATE ===
  visibleOctaveStart: number;
  visibleOctaveCount: number;
  visibleNotesLength: number;
  
  // === ACTIONS ===
  setVisibleOctaveStart: (octave: number) => void;
  
  // === OPTIONS ===
  maxOctave?: number;
  minOctave?: number;
  containerClassName?: string;
}

export const OctaveNavigation: React.FC<OctaveNavigationProps> = ({
  visibleOctaveStart,
  visibleOctaveCount,
  visibleNotesLength,
  setVisibleOctaveStart,
  maxOctave = 7,
  minOctave = 1,
  containerClassName = 'piano-roll-container'
}) => {
  
  // === WHEEL SCROLL HANDLER ===
  const handleWheel = (e: Event) => {
    const wheelEvent = e as WheelEvent;
    e.preventDefault();
    
    if (wheelEvent.deltaY > 0) {
      // Scroll down - monter dans les octaves
      setVisibleOctaveStart(Math.min(maxOctave - visibleOctaveCount + 1, visibleOctaveStart + 1));
    } else {
      // Scroll up - descendre dans les octaves
      setVisibleOctaveStart(Math.max(minOctave, visibleOctaveStart - 1));
    }
  };

  // === WHEEL EVENT LISTENER ===
  useEffect(() => {
    const pianoRollContainer = document.querySelector(`.${containerClassName}`);
    if (pianoRollContainer) {
      pianoRollContainer.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        pianoRollContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, [visibleOctaveStart, visibleOctaveCount, containerClassName]);

  // === NAVIGATION HANDLERS ===
  const handleOctaveDown = () => {
    setVisibleOctaveStart(Math.max(minOctave, visibleOctaveStart - 1));
  };

  const handleOctaveUp = () => {
    setVisibleOctaveStart(Math.min(maxOctave - visibleOctaveCount + 1, visibleOctaveStart + 1));
  };

  const handleOctaveJump = (octave: number) => {
    setVisibleOctaveStart(octave);
  };

  // === COMPUTED VALUES ===
  const canGoDown = visibleOctaveStart > minOctave;
  const canGoUp = visibleOctaveStart + visibleOctaveCount - 1 < maxOctave;
  const endOctave = Math.min(maxOctave, visibleOctaveStart + visibleOctaveCount - 1);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-slate-900/30 border-b border-slate-600/50 gap-3 sm:gap-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <span className="text-slate-300 font-semibold text-sm sm:text-base">🎹 Octaves:</span>
        
        {/* Octave Range Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOctaveDown}
            disabled={!canGoDown}
            className="px-4 py-2 sm:px-3 sm:py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-mono transition-colors touch-manipulation"
            title={`Descendre d'une octave ${!canGoDown ? '(limite atteinte)' : ''}`}
            aria-label="Octave précédente"
          >
            ←
          </button>
          
          <span className="px-4 py-2 sm:px-4 sm:py-1 bg-slate-800 rounded-lg text-sm font-mono border border-slate-600">
            C{visibleOctaveStart} - C{endOctave}
          </span>
          
          <button
            onClick={handleOctaveUp}
            disabled={!canGoUp}
            className="px-4 py-2 sm:px-3 sm:py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-mono transition-colors touch-manipulation"
            title={`Monter d'une octave ${!canGoUp ? '(limite atteinte)' : ''}`}
            aria-label="Octave suivante"
          >
            →
          </button>
        </div>
        
        {/* Quick Jump Buttons - Hidden on very small screens */}
        <div className="hidden xs:flex gap-1">
          {Array.from({ length: maxOctave - minOctave + 1 }, (_, index) => {
            const octave = minOctave + index;
            const isInRange = octave >= visibleOctaveStart && octave < visibleOctaveStart + visibleOctaveCount;
            const isSelectable = octave <= maxOctave - visibleOctaveCount + 1;
            
            return (
              <button
                key={octave}
                onClick={() => handleOctaveJump(octave)}
                disabled={!isSelectable}
                className={`px-3 py-2 sm:px-2 sm:py-1 rounded text-xs font-mono transition-colors touch-manipulation ${
                  isInRange
                    ? 'bg-blue-500 text-white shadow-lg'
                    : isSelectable
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
                title={
                  !isSelectable 
                    ? `Octave C${octave} non accessible avec ${visibleOctaveCount} octaves visibles`
                    : `Aller à l'octave C${octave}`
                }
              >
                C{octave}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Notes Count Info */}
      <div className="text-xs text-slate-400 text-center sm:text-right">
        <span className="font-mono">{visibleNotesLength} notes</span>
        <span className="hidden sm:inline text-slate-500 ml-2">
          (molette pour naviguer)
        </span>
      </div>
    </div>
  );
};