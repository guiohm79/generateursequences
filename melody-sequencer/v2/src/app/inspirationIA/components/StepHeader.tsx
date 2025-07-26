'use client';

import React from 'react';

interface StepHeaderProps {
  // === STEP CONFIGURATION ===
  stepCount: number;
  accentSteps: number[];
  cellWidth: string;
  
  // === VISUAL OPTIONS ===
  showCurrentStep?: boolean;
  currentStep?: number;
  isPlaying?: boolean;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  stepCount,
  accentSteps,
  cellWidth,
  showCurrentStep = false,
  currentStep = 0,
  isPlaying = false
}) => {
  return (
    <div className="flex sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-600/30">
      {/* Piano Keys Space - Placeholder pour aligner avec les touches piano */}
      <div className="w-24 sm:w-28 flex-shrink-0 bg-gradient-to-r from-slate-700/50 to-slate-800/50 py-2"></div>
      
      {/* Steps Header */}
      <div className="flex">
        {Array.from({ length: stepCount }, (_, stepIndex) => {
          const step = stepIndex + 1;
          const isAccentStep = accentSteps.includes(step);
          const isCurrentStep = showCurrentStep && isPlaying && stepIndex === currentStep;
          
          return (
            <div
              key={stepIndex}
              className={`
                ${cellWidth} text-center text-xs sm:text-sm py-2 sm:py-3 border-r border-slate-600/30
                font-mono transition-all duration-200 flex-shrink-0 relative
                ${isAccentStep 
                  ? 'text-amber-400 font-bold bg-slate-950/60 shadow-inner' 
                  : 'text-slate-400 hover:text-slate-300'
                }
                ${isCurrentStep 
                  ? 'ring-2 ring-yellow-400 ring-opacity-60 bg-yellow-400/10' 
                  : ''
                }
              `}
              title={`Step ${step}${isAccentStep ? ' (accent)' : ''}${isCurrentStep ? ' (en cours)' : ''}`}
            >
              <span className={`${isAccentStep ? 'text-sm sm:text-lg' : ''} ${isCurrentStep ? 'animate-pulse' : ''}`}>
                {step}
              </span>
              
              {/* Indicateur de step courant */}
              {isCurrentStep && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};