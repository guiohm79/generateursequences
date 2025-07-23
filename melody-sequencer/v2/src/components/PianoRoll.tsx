'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pattern, Step } from '../types';

interface PianoRollProps {
  pattern: Pattern;
  currentStep: number;
  isPlaying: boolean;
  onPatternChange: (pattern: Pattern) => void;
  width?: number;
  height?: number;
}

interface NoteInfo {
  name: string;
  midi: number;
  octave: number;
  isBlackKey: boolean;
}

const NOTES_PER_OCTAVE = 12;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEYS = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

export function PianoRoll({ 
  pattern, 
  currentStep, 
  isPlaying, 
  onPatternChange,
  width = 800,
  height = 400
}: PianoRollProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');

  // Generate note range (C2 to C6 for now)
  const generateNoteRange = useCallback((): NoteInfo[] => {
    const notes: NoteInfo[] = [];
    for (let octave = 6; octave >= 2; octave--) { // Reverse for visual order
      for (let note = 11; note >= 0; note--) {
        const midi = octave * 12 + note;
        const noteName = `${NOTE_NAMES[note]}${octave}`;
        notes.push({
          name: noteName,
          midi,
          octave,
          isBlackKey: BLACK_KEYS.includes(note)
        });
      }
    }
    return notes;
  }, []);

  const noteRange = generateNoteRange();
  const stepCount = Math.max(...Object.values(pattern).map(steps => steps.length), 16);

  // Layout calculations
  const pianoWidth = 80;
  const gridWidth = width - pianoWidth;
  const stepWidth = gridWidth / stepCount;
  const noteHeight = height / noteRange.length;

  // Initialize pattern for missing notes
  const getStep = useCallback((noteName: string, stepIndex: number): Step => {
    if (!pattern[noteName] || !pattern[noteName][stepIndex]) {
      return { on: false, velocity: 0.7 };
    }
    return pattern[noteName][stepIndex];
  }, [pattern]);

  const toggleStep = useCallback((noteName: string, stepIndex: number) => {
    const currentStep = getStep(noteName, stepIndex);
    const newStep: Step = {
      ...currentStep,
      on: !currentStep.on,
      velocity: currentStep.on ? 0 : 0.7
    };

    const newPattern = { ...pattern };
    if (!newPattern[noteName]) {
      newPattern[noteName] = Array(stepCount).fill(null).map(() => ({ on: false, velocity: 0 }));
    }
    
    newPattern[noteName] = [...newPattern[noteName]];
    newPattern[noteName][stepIndex] = newStep;
    
    onPatternChange(newPattern);
  }, [pattern, stepCount, onPatternChange, getStep]);

  const handleMouseDown = useCallback((noteName: string, stepIndex: number, event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    
    const currentStep = getStep(noteName, stepIndex);
    setDragMode(currentStep.on ? 'remove' : 'add');
    toggleStep(noteName, stepIndex);
  }, [getStep, toggleStep]);

  const handleMouseEnter = useCallback((noteName: string, stepIndex: number) => {
    if (isDragging) {
      const currentStep = getStep(noteName, stepIndex);
      if ((dragMode === 'add' && !currentStep.on) || (dragMode === 'remove' && currentStep.on)) {
        toggleStep(noteName, stepIndex);
      }
    }
  }, [isDragging, dragMode, getStep, toggleStep]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  return (
    <div className="piano-roll-container bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="piano-roll-svg"
        style={{ userSelect: 'none' }}
      >
        {/* Background */}
        <rect width={width} height={height} fill="#1f2937" />
        
        {/* Piano keys background */}
        <rect x={0} y={0} width={pianoWidth} height={height} fill="#374151" />
        
        {/* Grid lines - vertical (steps) */}
        {Array.from({ length: stepCount + 1 }).map((_, i) => (
          <line
            key={`vline-${i}`}
            x1={pianoWidth + i * stepWidth}
            y1={0}
            x2={pianoWidth + i * stepWidth}
            y2={height}
            stroke="#4b5563"
            strokeWidth={i % 4 === 0 ? 2 : 1}
            opacity={i % 4 === 0 ? 0.6 : 0.3}
          />
        ))}
        
        {/* Grid lines - horizontal (notes) */}
        {noteRange.map((note, i) => (
          <line
            key={`hline-${note.name}`}
            x1={pianoWidth}
            y1={i * noteHeight}
            x2={width}
            y2={i * noteHeight}
            stroke="#4b5563"
            strokeWidth={note.name.includes('C') ? 2 : 1}
            opacity={note.name.includes('C') ? 0.6 : 0.2}
          />
        ))}

        {/* Piano keys */}
        {noteRange.map((note, i) => (
          <g key={`piano-${note.name}`}>
            <rect
              x={0}
              y={i * noteHeight}
              width={pianoWidth}
              height={noteHeight}
              fill={note.isBlackKey ? '#1f2937' : '#f9fafb'}
              stroke="#6b7280"
              strokeWidth={0.5}
            />
            <text
              x={pianoWidth - 5}
              y={i * noteHeight + noteHeight / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill={note.isBlackKey ? '#f9fafb' : '#1f2937'}
              fontFamily="monospace"
            >
              {note.name}
            </text>
          </g>
        ))}

        {/* Current step indicator */}
        {isPlaying && (
          <rect
            x={pianoWidth + currentStep * stepWidth}
            y={0}
            width={stepWidth}
            height={height}
            fill="#fbbf24"
            opacity={0.3}
            pointerEvents="none"
          />
        )}

        {/* Note steps */}
        {noteRange.map((note, noteIndex) => (
          Array.from({ length: stepCount }).map((_, stepIndex) => {
            const step = getStep(note.name, stepIndex);
            const isCurrentStep = isPlaying && stepIndex === currentStep;
            
            return (
              <rect
                key={`step-${note.name}-${stepIndex}`}
                x={pianoWidth + stepIndex * stepWidth + 1}
                y={noteIndex * noteHeight + 1}
                width={stepWidth - 2}
                height={noteHeight - 2}
                fill={step.on ? `hsl(${240 - step.velocity * 60}, 70%, ${50 + step.velocity * 20}%)` : 'transparent'}
                stroke={isCurrentStep ? '#fbbf24' : (step.on ? '#60a5fa' : '#6b7280')}
                strokeWidth={isCurrentStep ? 2 : (step.on ? 1 : 0.5)}
                opacity={step.on ? 0.8 : 0.1}
                className="cursor-pointer transition-all duration-75 hover:opacity-100"
                style={{
                  '--midi-velocity': step.velocity.toString()
                } as React.CSSProperties}
                onMouseDown={(e) => handleMouseDown(note.name, stepIndex, e)}
                onMouseEnter={() => handleMouseEnter(note.name, stepIndex)}
              />
            );
          })
        ))}

        {/* Step numbers */}
        {Array.from({ length: stepCount }).map((_, i) => (
          <text
            key={`step-num-${i}`}
            x={pianoWidth + i * stepWidth + stepWidth / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="10"
            fill="#9ca3af"
            fontFamily="monospace"
            pointerEvents="none"
          >
            {i + 1}
          </text>
        ))}
      </svg>

      {/* Controls */}
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Steps: {stepCount}</span>
            <span className="text-gray-300">Notes: {Object.keys(pattern).length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newPattern: Pattern = {};
                onPatternChange(newPattern);
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}