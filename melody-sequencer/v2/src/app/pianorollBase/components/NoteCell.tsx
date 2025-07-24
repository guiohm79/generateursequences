'use client';

import React from 'react';
import { getVelocityColorClass } from '../utils/noteHelpers';
import { NoteEvent } from '../types';

interface NoteCellProps {
  stepIndex: number;
  note: string;
  stepCount: number;
  
  // État de la cellule
  hasNote: boolean;
  noteInfo: {
    isStart: boolean;
    isMiddle: boolean; 
    isEnd: boolean;
    noteEvent: NoteEvent | null;
  };
  noteVelocity: number;
  
  // État UI
  isPlaying: boolean;
  currentStep: number;
  isAccentStep: boolean;
  isBlackKey: boolean;
  cellWidth: string;
  
  // État de drag/sélection
  showDragFeedback: boolean;
  isSelected: boolean;
  
  // Actions
  onToggleNote: (stepIndex: number, note: string, isCtrlClick: boolean) => void;
  onMouseDown: (stepIndex: number, note: string, e: React.MouseEvent) => void;
  onTouchStart: (stepIndex: number, note: string, e: React.TouchEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseEnter: (stepIndex: number, note: string) => void;
}

export const NoteCell: React.FC<NoteCellProps> = ({
  stepIndex,
  note,
  stepCount,
  hasNote,
  noteInfo,
  noteVelocity,
  isPlaying,
  currentStep,
  isAccentStep,
  isBlackKey,
  cellWidth,
  showDragFeedback,
  isSelected,
  onToggleNote,
  onMouseDown,
  onTouchStart,
  onMouseMove,
  onMouseUp,
  onMouseEnter
}) => {
  const step = stepIndex + 1;

  return (
    <div
      className={`
        ${cellWidth} h-full border-r border-slate-600/30 cursor-pointer
        flex items-center justify-center text-xs relative flex-shrink-0
        transition-all duration-200 touch-manipulation
        ${stepIndex === currentStep && isPlaying ? 'ring-2 ring-yellow-400 ring-opacity-60' : ''}
        ${isAccentStep 
          ? 'bg-slate-950/60 hover:bg-slate-900/80 active:bg-slate-800/90 border-r-2 border-amber-500/50' 
          : (isBlackKey 
            ? 'bg-slate-900/40 hover:bg-slate-800/70 active:bg-slate-700/80' 
            : 'bg-slate-800/40 hover:bg-slate-700/70 active:bg-slate-600/80'
          )
        }
        ${showDragFeedback ? 'ring-2 ring-blue-400 cursor-ns-resize' : ''}
        ${noteInfo.isMiddle ? 'border-r-0' : ''}
        ${isSelected ? 'ring-2 ring-yellow-400 ring-opacity-80' : ''}
      `}
      onClick={(e) => {
        const isCtrlClick = e.ctrlKey || e.metaKey;
        onToggleNote(stepIndex, note, isCtrlClick);
      }}
      onMouseDown={(e) => hasNote && onMouseDown(stepIndex, note, e)}
      onTouchStart={(e) => hasNote && onTouchStart(stepIndex, note, e)}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseEnter={() => onMouseEnter(stepIndex, note)}
      title={`Step ${step}, Note ${note}${hasNote ? ` (Velocity: ${noteVelocity})` : ''}`}
    >
      {hasNote && (
        <div className={`
          ${noteInfo.isStart 
            ? (stepCount <= 16 
              ? 'w-8 h-4 sm:w-10 sm:h-5' 
              : stepCount <= 32 
              ? 'w-6 h-3 sm:w-8 sm:h-4' 
              : 'w-4 h-2 sm:w-6 sm:h-3'
            )
            : 'w-full h-4 sm:h-5'
          }
          ${noteInfo.isStart ? 'rounded-l-lg' : ''}
          ${noteInfo.isEnd ? 'rounded-r-lg' : ''}
          ${noteInfo.isMiddle ? 'rounded-none' : ''}
          ${noteInfo.isStart && noteInfo.isEnd ? 'rounded-lg' : ''}
          shadow-lg
          ${getVelocityColorClass(noteVelocity)}
          ${stepIndex === currentStep && isPlaying ? 'animate-pulse ring-1 ring-yellow-300' : ''}
          ${showDragFeedback ? 'ring-2 ring-white ring-opacity-80 scale-110' : ''}
          transition-all duration-200
        `}>
          {/* Affichage de la vélocité sur les notes de début */}
          {noteInfo.isStart && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white/90 drop-shadow-md">
                {Math.round(noteVelocity)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};