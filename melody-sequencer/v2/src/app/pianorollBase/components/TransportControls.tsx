'use client';

import React from 'react';

interface TransportControlsProps {
  // Transport état
  isPlaying: boolean;
  isInitialized: boolean;
  currentStep: number;
  
  // Pattern info
  stepCount: number;
  patternLength: number;
  activeNotesCount: number;
  
  // Actions
  start: () => void;
  stop: () => void;
  onStepCountChange: (newStepCount: number) => void;
  
  // Step options
  stepOptions: number[];
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  isInitialized,
  currentStep,
  stepCount,
  patternLength,
  activeNotesCount,
  start,
  stop,
  onStepCountChange,
  stepOptions
}) => {
  return (
    <div className="mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl">
      {/* Mobile Layout - Stack vertical */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 lg:gap-6">
        <button
          onClick={() => {
            if (isPlaying) {
              stop();
            } else {
              start();
            }
          }}
          disabled={!isInitialized}
          className={`w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg sm:text-base ${
            isPlaying 
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/30' 
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/30'
          }`}
        >
          {!isInitialized ? '🔄 Initializing...' : (isPlaying ? '⏹ Stop' : '▶ Play')}
        </button>
        
        {/* Stats - Grid on mobile, flex on desktop */}
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4 text-center sm:text-left w-full sm:w-auto">
          <div className="bg-slate-900/60 rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-slate-600/50">
            <div className="text-xs sm:text-sm text-slate-400 font-medium">Step</div>
            <div className="text-lg sm:text-xl font-bold text-blue-400">{currentStep + 1}/{stepCount}</div>
          </div>
          
          <div className="bg-slate-900/60 rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-slate-600/50">
            <div className="text-xs sm:text-sm text-slate-400 font-medium">Length</div>
            <div className="text-lg sm:text-xl font-bold text-amber-400">{patternLength}s</div>
          </div>
          
          <div className="bg-slate-900/60 rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-slate-600/50">
            <div className="text-xs sm:text-sm text-slate-400 font-medium">Notes</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-400">{activeNotesCount}</div>
          </div>
          
          <div className="bg-slate-900/60 rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-slate-600/50">
            <div className="text-xs sm:text-sm text-slate-400 font-medium">Steps</div>
            <select
              value={stepCount}
              onChange={(e) => onStepCountChange(parseInt(e.target.value))}
              className="text-lg sm:text-xl font-bold text-purple-400 bg-transparent border-none outline-none cursor-pointer"
            >
              {stepOptions.map(steps => (
                <option key={steps} value={steps} className="bg-slate-800 text-purple-400">
                  {steps}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};