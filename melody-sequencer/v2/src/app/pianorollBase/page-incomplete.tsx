'use client';

import React, { useState, useEffect } from 'react';
import { useSimpleAudio } from '../../hooks/useSimpleAudio';
import { SimplePattern, SimpleStep } from '../../lib/SimpleAudioEngine';
import { midiEngine, MidiNote } from '../../lib/MidiEngine';
import { PresetManager } from '../../lib/PresetManager';
import { SequencerPreset } from '../../types';
import { MidiParser } from '../../lib/MidiParser';
import { UndoRedoManager } from '../../lib/UndoRedoManager';

// Import des types locaux
import { NoteEvent, NoteId, SelectionRectangle, ClipboardData } from './types';

// Import des composants modulaires
import { TransportControls } from './components/TransportControls';
import { PianoGrid } from './components/PianoGrid';
import { ModeSelector } from './components/ModeSelector';

// Import des utilitaires
import { 
  STEP_OPTIONS, 
  DEFAULT_STEPS, 
  ALL_NOTES, 
  ALL_OCTAVES,
  CELL_WIDTH,
  CELL_HEIGHT,
  PIANO_WIDTH,
  DEFAULT_VELOCITY
} from './utils/constants';

import {
  isBlackKey,
  getNoteDisplayName,
  getOctaveNumber,
  generateNotesForOctave,
  getVelocityColorClass,
  createNoteId
} from './utils/noteHelpers';

import {
  findNoteInPattern,
  getNotesAtStep,
  noteExistsInPattern,
  addOrUpdateNoteInPattern,
  removeNoteFromPattern,
  cleanupInactiveNotes,
  convertPatternToAudioFormat
} from './utils/patternHelpers';

import {
  isNoteInSelectionRectangle,
  getSelectedNotes,
  createClipboardData,
  pasteNotesFromClipboard,
  moveSelectedNotes,
  selectAllNotes
} from './utils/selectionHelpers';

const PianoRollModularPage: React.FC = () => {
  const [pattern, setPattern] = useState<NoteEvent[]>([]);
  
  // État pour l'édition de vélocité par drag
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    step: number;
    note: string;
    startY: number;
    startVelocity: number;
    currentVelocity: number;
  } | null>(null);
  
  // État pour le redimensionnement des notes par drag horizontal
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    step: number;
    note: string;
    startX: number;
    startDuration: number;
    currentDuration: number;
  } | null>(null);
  
  // État de sélection multiple
  const [selectedNotes, setSelectedNotes] = useState<Set<NoteId>>(new Set());
  const [selectionRect, setSelectionRect] = useState<SelectionRectangle | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [mousePosition, setMousePosition] = useState<{ step: number; note: string } | null>(null);
  
  // État des octaves visibles
  const [visibleOctaveStart, setVisibleOctaveStart] = useState(3);
  const [visibleOctaveCount, setVisibleOctaveCount] = useState(2);
  
  // État du séquenceur
  const [stepCount, setStepCount] = useState(DEFAULT_STEPS);
  const [isDragOver, setIsDragOver] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  
  // État Undo/Redo
  const [undoRedoManager] = useState(() => new UndoRedoManager());
  
  // Audio engine
  const { isPlaying, isInitialized, currentStep, start, stop } = useSimpleAudio();

  // Helper pour créer un ID unique de note
  const createNoteId = (step: number, note: string): NoteId => `${step}-${note}`;
  
  // Helper pour parser un ID de note
  const parseNoteId = (noteId: NoteId): { step: number; note: string } => {
    const [stepStr, note] = noteId.split('-');
    return { step: parseInt(stepStr), note };
  };
  
  // Vérifier si une note est sélectionnée
  const isNoteSelected = (step: number, note: string): boolean => {
    return selectedNotes.has(createNoteId(step, note));
  };

  // Logique métier - Toggle note
  const toggleNote = (step: number, note: string, isCtrlClick: boolean = false) => {
    if (dragState?.isDragging) return;
    
    const existingNote = pattern.find(n => n.step === step && n.note === note);
    
    if (existingNote) {
      // Supprimer la note existante
      const newPattern = pattern.filter(n => !(n.step === step && n.note === note));
      
      // Gérer la sélection
      if (isCtrlClick) {
        const noteId = createNoteId(step, note);
        setSelectedNotes(prev => {
          const newSelection = new Set(prev);
          newSelection.delete(noteId);
          return newSelection;
        });
      } else {
        setSelectedNotes(new Set());
      }
      
      // Sauvegarder pour l'undo
      undoRedoManager.saveState(
        pattern,
        stepCount,
        `Supprimer note ${note} au step ${step + 1}`
      );
      
      setPattern(newPattern);
    } else {
      // Ajouter nouvelle note
      const newNote: NoteEvent = {
        step,
        note,
        velocity: DEFAULT_VELOCITY,
        duration: 1,
        isActive: true
      };
      
      const newPattern = [...pattern, newNote];
      
      // Gérer la sélection
      if (isCtrlClick) {
        const noteId = createNoteId(step, note);
        setSelectedNotes(prev => {
          const newSelection = new Set(prev);
          newSelection.add(noteId);
          return newSelection;
        });
      } else {
        setSelectedNotes(new Set([createNoteId(step, note)]));
      }
      
      // Sauvegarder pour l'undo
      undoRedoManager.saveState(
        pattern,
        stepCount,
        `Ajouter note ${note} au step ${step + 1}`
      );
      
      setPattern(newPattern);
    }
  };

  // Vérifier si un step fait partie d'une note longue
  const isPartOfNote = (step: number, note: string): { isStart: boolean; isMiddle: boolean; isEnd: boolean; noteEvent: NoteEvent | null } => {
    // Chercher une note qui commence à ce step
    const directNote = pattern.find(n => n.step === step && n.note === note);
    if (directNote) {
      return {
        isStart: true,
        isMiddle: false,
        isEnd: directNote.duration === 1,
        noteEvent: directNote
      };
    }
    
    // Chercher une note qui s'étend sur ce step
    const parentNote = pattern.find(n => 
      n.note === note && 
      n.step < step && 
      n.step + n.duration > step
    );
    
    if (parentNote) {
      const isLastStep = step === parentNote.step + parentNote.duration - 1;
      return {
        isStart: false,
        isMiddle: !isLastStep,
        isEnd: isLastStep,
        noteEvent: parentNote
      };
    }
    
    return { isStart: false, isMiddle: false, isEnd: false, noteEvent: null };
  };

  // Récupérer la vélocité d'une note (avec drag en cours)
  const getNoteVelocity = (step: number, note: string): number => {
    const noteInfo = isPartOfNote(step, note);
    
    if (!noteInfo.noteEvent) return 100;
    
    // Si on est en train de dragger cette note, utiliser la vélocité temporaire
    if (dragState?.isDragging && dragState.step === noteInfo.noteEvent.step && dragState.note === note) {
      return dragState.currentVelocity;
    }
    
    return noteInfo.noteEvent.velocity;
  };

  // Gestion du drag pour éditer la vélocité (souris)
  const handleMouseDown = (step: number, note: string, e: React.MouseEvent) => {
    const noteInfo = isPartOfNote(step, note);
    if (noteInfo.noteEvent) {
      e.preventDefault();
      e.stopPropagation();
      
      setDragState({
        isDragging: true,
        step: noteInfo.noteEvent.step,
        note,
        startY: e.clientY,
        startVelocity: noteInfo.noteEvent.velocity,
        currentVelocity: noteInfo.noteEvent.velocity
      });
    }
  };

  // Gestion du drag pour éditer la vélocité (tactile)
  const handleTouchStart = (step: number, note: string, e: React.TouchEvent) => {
    const noteInfo = isPartOfNote(step, note);
    if (noteInfo.noteEvent) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      setDragState({
        isDragging: true,
        step: noteInfo.noteEvent.step,
        note,
        startY: touch.clientY,
        startVelocity: noteInfo.noteEvent.velocity,
        currentVelocity: noteInfo.noteEvent.velocity
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState?.isDragging) {
      e.preventDefault();
      const deltaY = dragState.startY - e.clientY;
      const sensitivity = 2;
      const newVelocity = Math.max(1, Math.min(127, dragState.startVelocity + Math.round(deltaY / sensitivity)));
      
      setDragState(prev => prev ? { ...prev, currentVelocity: newVelocity } : null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragState?.isDragging) {
      e.preventDefault();
      const finalVelocity = dragState.currentVelocity;
      
      const newPattern = pattern.map(note => 
        note.step === dragState.step && note.note === dragState.note
          ? { ...note, velocity: finalVelocity }
          : note
      );
      
      undoRedoManager.saveState(
        pattern,
        stepCount,
        `Modifier vélocité de ${dragState.note} au step ${dragState.step + 1} : ${finalVelocity}`
      );
      
      setPattern(newPattern);
      setDragState(null);
    }
  };

  const handleCellMouseEnter = (stepIndex: number, note: string) => {
    setMousePosition({ step: stepIndex, note });
  };

  // Calcul des notes visibles selon l'octave sélectionnée
  const getVisibleNotes = (): string[] => {
    const visibleOctaves = [];
    for (let i = 0; i < visibleOctaveCount; i++) {
      const octave = visibleOctaveStart + visibleOctaveCount - 1 - i;
      if (octave >= 1 && octave <= 7) {
        visibleOctaves.push(octave);
      }
    }
    return visibleOctaves.flatMap(octave => generateNotesForOctave(octave));
  };

  const visibleNotes = getVisibleNotes();

  // Calcul de la largeur des cellules basé sur le nombre de steps
  const getCellWidth = (steps: number): string => {
    if (steps <= 16) return 'w-12 sm:w-14';
    if (steps <= 32) return 'w-8 sm:w-10';
    return 'w-6 sm:w-8';
  };

  const cellWidth = getCellWidth(stepCount);

  // Calcul des steps d'accents
  const getAccentSteps = (totalSteps: number): number[] => {
    if (totalSteps <= 16) {
      return [1, 5, 9, 13].filter(step => step <= totalSteps);
    } else if (totalSteps <= 32) {
      return [1, 5, 9, 13, 17, 21, 25, 29].filter(step => step <= totalSteps);
    } else {
      const accents = [];
      for (let i = 1; i <= totalSteps; i += 4) {
        accents.push(i);
      }
      return accents;
    }
  };

  const accentSteps = getAccentSteps(stepCount);

  // Convert pattern pour l'audio
  const convertToAudioPattern = (visualPattern: NoteEvent[]): SimplePattern => {
    const audioPattern: SimplePattern = {};
    
    // Créer un tableau de steps vide pour chaque note
    const maxStep = Math.max(...visualPattern.map(n => n.step), -1) + 1;
    
    // Pour chaque note visuelle active, créer les SimpleSteps appropriés
    visualPattern.forEach(note => {
      if (note.isActive) {
        const noteName = note.note;
        if (!audioPattern[noteName]) {
          // Initialiser avec des steps vides
          audioPattern[noteName] = Array.from({ length: maxStep }, () => ({
            on: false,
            velocity: 100
          }));
        }
        
        // Activer le step correspondant
        if (audioPattern[noteName][note.step]) {
          audioPattern[noteName][note.step] = {
            on: true,
            velocity: note.velocity,
            duration: note.duration || 1
          };
        }
      }
    });
    
    return audioPattern;
  };

  // Sync pattern avec audio engine
  useEffect(() => {
    const audioPattern = convertToAudioPattern(pattern);
    // Sync avec l'engine audio si nécessaire
  }, [pattern]);

  // Stats calculées
  const activeNotesCount = pattern.filter(note => note.isActive).length;
  const patternLength = Math.round((stepCount * 0.125) * 100) / 100; // En secondes

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎹 Piano Roll Modulaire
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
            Éditeur de patterns modulaire - {stepCount} pas, gamme en C
          </p>
        </div>

        {/* Transport Controls - Composant modulaire */}
        <TransportControls
          isPlaying={isPlaying}
          isInitialized={isInitialized}
          currentStep={currentStep}
          stepCount={stepCount}
          patternLength={patternLength}
          activeNotesCount={activeNotesCount}
          start={start}
          stop={stop}
          onStepCountChange={setStepCount}
          stepOptions={STEP_OPTIONS}
        />

        {/* Status Export */}
        {exportStatus && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg text-blue-200 text-center font-medium">
            {exportStatus}
          </div>
        )}

        {/* Piano Grid - Composant modulaire */}
        <div className="piano-roll-container">
          <PianoGrid
            visibleNotes={visibleNotes}
            stepCount={stepCount}
            accentSteps={accentSteps}
            pattern={pattern}
            isPlaying={isPlaying}
            currentStep={currentStep}
            isPartOfNote={isPartOfNote}
            getNoteVelocity={getNoteVelocity}
            isNoteSelected={isNoteSelected}
            dragState={dragState}
            cellWidth={cellWidth}
            onToggleNote={toggleNote}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onCellMouseEnter={handleCellMouseEnter}
          />
        </div>

        {/* Controls et informations additionnelles */}
        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>🎵 Version modulaire avec composants extraits</p>
          <p>Notes actives: {activeNotesCount} | Durée: {patternLength}s | Steps: {stepCount}</p>
        </div>

      </div>
    </div>
  );
};

export default PianoRollModularPage;