'use client';

import React from 'react';
import { PianoKeys } from './PianoKeys';
import { NoteCell } from './NoteCell';
import { isBlackKey } from '../utils/noteHelpers';
import { NoteEvent } from '../types';

interface PianoGridProps {
  // Notes et steps
  visibleNotes: string[];
  stepCount: number;
  accentSteps: number[];
  
  // Pattern et état
  pattern: NoteEvent[];
  isPlaying: boolean;
  currentStep: number;
  
  // Fonctions de helpers
  isPartOfNote: (step: number, note: string) => {
    isStart: boolean;
    isMiddle: boolean;
    isEnd: boolean;
    noteEvent: NoteEvent | null;
  };
  getNoteVelocity: (step: number, note: string) => number;
  isNoteSelected: (step: number, note: string) => boolean;
  
  // État de drag
  dragState: {
    isDragging: boolean;
    step: number;
    note: string;
    startY: number;
    startVelocity: number;
    currentVelocity: number;
  } | null;
  
  // Style
  cellWidth: string;
  
  // Actions
  onToggleNote: (stepIndex: number, note: string, isCtrlClick: boolean) => void;
  onMouseDown: (stepIndex: number, note: string, e: React.MouseEvent) => void;
  onTouchStart: (stepIndex: number, note: string, e: React.TouchEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onCellMouseEnter: (stepIndex: number, note: string) => void;
}

export const PianoGrid: React.FC<PianoGridProps> = ({
  visibleNotes,
  stepCount,
  accentSteps,
  pattern,
  isPlaying,
  currentStep,
  isPartOfNote,
  getNoteVelocity,
  isNoteSelected,
  dragState,
  cellWidth,
  onToggleNote,
  onMouseDown,
  onTouchStart,
  onMouseMove,
  onMouseUp,
  onCellMouseEnter
}) => {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-600/50 overflow-hidden shadow-2xl">
      {/* Header avec numéros de steps */}
      <div className="bg-slate-800/80 border-b border-slate-600/50 sticky top-0 z-20">
        <div className="flex">
          {/* Espace pour les touches piano */}
          <div className="flex-shrink-0 w-24 sm:w-28 bg-slate-700/50 border-r border-slate-600"></div>
          
          {/* Numéros de steps */}
          <div className="flex flex-shrink-0">
            {Array.from({ length: stepCount }, (_, stepIndex) => {
              const step = stepIndex + 1;
              const isAccentStep = accentSteps.includes(step);
              
              return (
                <div
                  key={stepIndex}
                  className={`
                    ${cellWidth} text-center text-xs sm:text-sm py-2 sm:py-3 border-r border-slate-600/30
                    font-mono transition-all duration-200 flex-shrink-0
                    ${isAccentStep 
                      ? 'text-amber-400 font-bold bg-slate-950/60 shadow-inner' 
                      : 'text-slate-400 hover:text-slate-300'
                    }
                  `}
                >
                  <span className={isAccentStep ? 'text-sm sm:text-lg' : ''}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Piano Roll Grid */}
      <div className="flex">
        {/* Piano Keys (Left Side) */}
        <PianoKeys visibleNotes={visibleNotes} />

        {/* Grid (Right Side) */}
        <div className="flex-shrink-0">
          {visibleNotes.map((note, noteIndex) => {
            const isBlack = isBlackKey(note);
            return (
              <div
                key={note}
                className={`
                  h-10 sm:h-8 border-b border-slate-600/30 flex
                  ${isBlack ? 'bg-slate-900/30' : 'bg-slate-800/30'}
                `}
              >
                {Array.from({ length: stepCount }, (_, stepIndex) => {
                  const step = stepIndex + 1;
                  const isAccentStep = accentSteps.includes(step);
                  
                  const noteInfo = isPartOfNote(stepIndex, note);
                  const hasNote = noteInfo.noteEvent !== null;
                  const noteVelocity = getNoteVelocity(stepIndex, note);
                  const isDraggingThis = dragState?.isDragging && dragState.step === stepIndex && dragState.note === note;
                  const isDraggingThisLongNote = dragState?.isDragging && noteInfo.noteEvent && dragState.step === noteInfo.noteEvent.step && dragState.note === note;
                  const showDragFeedback = Boolean(isDraggingThis || isDraggingThisLongNote);
                  const isSelected = Boolean(hasNote && noteInfo.noteEvent && isNoteSelected(noteInfo.noteEvent.step, note));
                  
                  return (
                    <NoteCell
                      key={stepIndex}
                      stepIndex={stepIndex}
                      note={note}
                      stepCount={stepCount}
                      hasNote={hasNote}
                      noteInfo={noteInfo}
                      noteVelocity={noteVelocity}
                      isPlaying={isPlaying}
                      currentStep={currentStep}
                      isAccentStep={isAccentStep}
                      isBlackKey={isBlack}
                      cellWidth={cellWidth}
                      showDragFeedback={showDragFeedback}
                      isSelected={isSelected}
                      onToggleNote={onToggleNote}
                      onMouseDown={onMouseDown}
                      onTouchStart={onTouchStart}
                      onMouseMove={onMouseMove}
                      onMouseUp={onMouseUp}
                      onMouseEnter={onCellMouseEnter}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};