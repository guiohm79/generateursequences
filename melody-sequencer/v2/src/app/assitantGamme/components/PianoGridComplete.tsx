'use client';

import React from 'react';
import { NoteEvent, NoteId, SelectionRectangle } from '../types';
import { isBlackKey, getVelocityColorClass } from '../utils/noteHelpers';
import { scaleColoringHelper, ColoringMode } from '../utils/scaleColoring';

interface PianoGridCompleteProps {
  // === PATTERN DATA ===
  pattern: NoteEvent[];
  visibleNotes: string[];
  stepCount: number;
  accentSteps: number[];
  cellWidth: string;
  
  // === SCALE COLORING ===
  coloringMode?: ColoringMode;
  
  // === PLAYBACK STATE ===
  currentStep: number;
  isPlaying: boolean;
  
  // === INTERACTION STATES ===
  dragState: {
    isDragging: boolean;
    step: number;
    note: string;
    startY: number;
    startVelocity: number;
    currentVelocity: number;
  } | null;
  
  resizeState: {
    isResizing: boolean;
    step: number;
    note: string;
    startX: number;
    startDuration: number;
    currentDuration: number;
  } | null;
  
  selectedNotes: Set<NoteId>;
  selectionRect: SelectionRectangle | null;
  
  // === HELPER FUNCTIONS ===
  isPartOfNote: (step: number, note: string) => {
    isStart: boolean;
    isMiddle: boolean;
    isEnd: boolean;
    noteEvent: NoteEvent | null;
  };
  getNoteVelocity: (step: number, note: string) => number;
  isNoteSelected: (step: number, note: string) => boolean;
  createNoteId: (step: number, note: string) => NoteId;
  
  // === EVENT HANDLERS ===
  toggleNote: (step: number, note: string, isCtrlClick?: boolean) => void;
  handleMouseDown: (step: number, note: string, e: React.MouseEvent) => void;
  handleTouchStart: (step: number, note: string, e: React.TouchEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  handleCellMouseEnter: (step: number, note: string) => void;
  handleResizeMouseDown: (step: number, note: string, e: React.MouseEvent) => void;
  
  // === SELECTION HANDLERS ===
  handleGridMouseDown: (e: React.MouseEvent) => void;
  handleGridMouseMove: (e: React.MouseEvent) => void;
  handleGridMouseUp: (e: React.MouseEvent) => void;
}

export const PianoGridComplete: React.FC<PianoGridCompleteProps> = ({
  // Pattern data
  pattern,
  visibleNotes,
  stepCount,
  accentSteps,
  cellWidth,
  coloringMode = 'standard',
  
  // Playback state
  currentStep,
  isPlaying,
  
  // Interaction states
  dragState,
  resizeState,
  selectedNotes,
  selectionRect,
  
  // Helper functions
  isPartOfNote,
  getNoteVelocity,
  isNoteSelected,
  createNoteId,
  
  // Event handlers
  toggleNote,
  handleMouseDown,
  handleTouchStart,
  handleMouseMove,
  handleMouseUp,
  handleCellMouseEnter,
  handleResizeMouseDown,
  
  // Selection handlers
  handleGridMouseDown,
  handleGridMouseMove,
  handleGridMouseUp
}) => {
  return (
    <div 
      className="flex-shrink-0 relative"
      onMouseDown={handleGridMouseDown}
      onMouseMove={handleGridMouseMove}
      onMouseUp={handleGridMouseUp}
    >
      {visibleNotes.map((note, noteIndex) => {
        const isBlack = isBlackKey(note);
        
        // Obtenir les informations de couleur pour cette rangée de note
        const colorInfo = scaleColoringHelper.getNoteColorInfo(note);
        
        // Couleur de fond de la rangée selon le mode
        let rowBgColor = '';
        if (coloringMode === 'standard') {
          rowBgColor = isBlack ? 'bg-slate-900/30' : 'bg-slate-800/30';
        } else {
          // Mode gamme : teinter légèrement le fond selon la note
          if (colorInfo.isInScale) {
            if (colorInfo.isTonic) {
              rowBgColor = 'bg-emerald-900/20';
            } else if (colorInfo.isDominant) {
              rowBgColor = 'bg-blue-900/20';
            } else {
              rowBgColor = 'bg-emerald-900/10';
            }
          } else {
            rowBgColor = 'bg-slate-900/20'; // Notes hors gamme plus neutres
          }
        }
        
        return (
          <div
            key={note}
            className={`h-10 sm:h-8 border-b border-slate-600/30 flex ${rowBgColor}`}
          >
            {Array.from({ length: stepCount }, (_, stepIndex) => {
              const step = stepIndex + 1;
              const isAccentStep = accentSteps.includes(step);
              
              const noteInfo = isPartOfNote(stepIndex, note);
              const hasNote = noteInfo.noteEvent !== null;
              const noteVelocity = getNoteVelocity(stepIndex, note);
              const isDraggingThis = dragState?.isDragging && dragState.step === stepIndex && dragState.note === note;
              // Ou si on drag n'importe quelle partie de cette note longue
              const isDraggingThisLongNote = dragState?.isDragging && noteInfo.noteEvent && dragState.step === noteInfo.noteEvent.step && dragState.note === note;
              const showDragFeedback = isDraggingThis || isDraggingThisLongNote;
              const isSelected = hasNote && noteInfo.noteEvent && isNoteSelected(noteInfo.noteEvent.step, note);
              
              // Couleurs de cellule selon le mode
              let cellBgClasses = '';
              let hoverClasses = '';
              
              if (coloringMode === 'standard') {
                // Mode standard : couleurs classiques
                if (isAccentStep) {
                  cellBgClasses = 'bg-slate-950/60 border-r-2 border-amber-500/50';
                  hoverClasses = 'hover:bg-slate-900/80 active:bg-slate-800/90';
                } else {
                  cellBgClasses = isBlack ? 'bg-slate-900/40' : 'bg-slate-800/40';
                  hoverClasses = isBlack ? 'hover:bg-slate-800/70 active:bg-slate-700/80' : 'hover:bg-slate-700/70 active:bg-slate-600/80';
                }
              } else {
                // Mode gamme : couleurs intelligentes
                if (colorInfo.isInScale) {
                  if (colorInfo.isTonic) {
                    cellBgClasses = 'bg-emerald-800/30';
                    hoverClasses = 'hover:bg-emerald-700/50 active:bg-emerald-600/60';
                  } else if (colorInfo.isDominant) {
                    cellBgClasses = 'bg-blue-800/30';
                    hoverClasses = 'hover:bg-blue-700/50 active:bg-blue-600/60';
                  } else {
                    cellBgClasses = 'bg-emerald-800/20';
                    hoverClasses = 'hover:bg-emerald-700/40 active:bg-emerald-600/50';
                  }
                } else {
                  // Notes hors gamme : plus discrètes
                  cellBgClasses = 'bg-slate-900/30';
                  hoverClasses = 'hover:bg-slate-800/50 active:bg-slate-700/60';
                }
                
                // Accents toujours visibles même en mode gamme
                if (isAccentStep) {
                  cellBgClasses += ' border-r-2 border-amber-500/50';
                }
              }
              
              return (
                <div
                  key={stepIndex}
                  className={`
                    ${cellWidth} h-full border-r border-slate-600/30 cursor-pointer
                    flex items-center justify-center text-xs relative flex-shrink-0
                    transition-all duration-200 touch-manipulation
                    ${cellBgClasses} ${hoverClasses}
                    ${stepIndex === currentStep && isPlaying ? 'ring-2 ring-yellow-400 ring-opacity-60' : ''}
                    ${showDragFeedback ? 'ring-2 ring-blue-400 cursor-ns-resize' : ''}
                    ${noteInfo.isMiddle ? 'border-r-0' : ''}
                    ${isSelected ? 'ring-2 ring-yellow-400 ring-opacity-80' : ''}
                    ${!hasNote ? 'grid-cell-empty' : ''}
                  `}
                  onClick={(e) => {
                    if (!dragState?.isDragging) {
                      const isCtrlClick = e.ctrlKey || e.metaKey;
                      toggleNote(stepIndex, note, isCtrlClick);
                    }
                  }}
                  onMouseDown={(e) => hasNote && handleMouseDown(stepIndex, note, e)}
                  onTouchStart={(e) => hasNote && handleTouchStart(stepIndex, note, e)}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseEnter={() => handleCellMouseEnter(stepIndex, note)}
                  title={`Step ${step}, Note ${note}${hasNote ? ` (Velocity: ${noteVelocity})` : ''}${isDraggingThis ? ' - Drag vertical pour ajuster' : ''}`}
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
                      ${noteInfo.isMiddle ? 'opacity-80' : ''}
                      ${isSelected ? 'ring-2 ring-yellow-300 ring-opacity-90 scale-105' : ''}
                      flex items-center justify-center
                    `}
                    >
                      {/* Indicateur de début de note */}
                      {noteInfo.isStart && noteInfo.noteEvent && noteInfo.noteEvent.duration > 1 && (
                        <div className="text-white text-xs font-bold opacity-70">
                          {noteInfo.noteEvent.duration}
                        </div>
                      )}
                      
                      {/* Poignée de redimensionnement à droite */}
                      {noteInfo.isEnd && (
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 hover:bg-white/40 cursor-ew-resize transition-colors"
                          onMouseDown={(e) => handleResizeMouseDown(noteInfo.noteEvent!.step, note, e)}
                          title="Drag pour redimensionner"
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Indicateur de vélocité pendant le drag */}
                  {showDragFeedback && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 border border-slate-600 px-2 py-1 rounded text-xs font-mono text-white shadow-xl">
                      {noteVelocity}
                    </div>
                  )}
                  
                  {/* Grid dots for empty cells */}
                  {!hasNote && (
                    <div className={`
                      w-1 h-1 rounded-full opacity-20
                      ${isAccentStep ? 'bg-amber-400' : 'bg-slate-500'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      
      {/* Rectangle de sélection */}
      {selectionRect?.isSelecting && (
        <div 
          className="absolute border-2 border-yellow-400 bg-yellow-400/20 pointer-events-none z-30 rounded-sm shadow-lg"
          style={{
            left: `${Math.min(selectionRect.startX, selectionRect.endX)}px`,
            top: `${Math.min(selectionRect.startY, selectionRect.endY)}px`,
            width: `${Math.abs(selectionRect.endX - selectionRect.startX)}px`,
            height: `${Math.abs(selectionRect.endY - selectionRect.startY)}px`,
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Bordure intérieure pour plus de visibilité */}
          <div className="absolute inset-0 border border-yellow-300/50 rounded-sm" />
        </div>
      )}
    </div>
  );
};