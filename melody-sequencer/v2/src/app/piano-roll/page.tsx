'use client';

import React, { useState, useEffect } from 'react';
import { useSimpleAudio } from '../../hooks/useSimpleAudio';
import { SimplePattern, SimpleStep } from '../../lib/SimpleAudioEngine';

// Configuration du piano roll - dynamique
const STEP_OPTIONS = [8, 16, 32, 64];
const DEFAULT_STEPS = 16;

// Génération des notes par octave
const generateNotesForOctave = (octave: number): string[] => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return noteNames.reverse().map(note => `${note}${octave}`); // Inversé pour affichage top-to-bottom
};

// Gamme étendue C1 à C7
const ALL_OCTAVES = [7, 6, 5, 4, 3, 2, 1];
const ALL_NOTES = ALL_OCTAVES.flatMap(octave => generateNotesForOctave(octave));

// Pattern data structure avec support des notes longues
interface NoteEvent {
  step: number;
  note: string;
  velocity: number;
  isActive: boolean;
  duration: number; // Longueur en steps (1 = un seul step, 2 = deux steps, etc.)
}

// Helper functions
const isBlackKey = (note: string) => {
  return note.includes('#');
};

// Vélocité vers couleurs avec classes CSS prédéfinies (vert faible → rouge fort)
const getVelocityColorClass = (velocity: number): string => {
  const normalized = Math.max(0, Math.min(127, velocity)) / 127;
  
  if (normalized < 0.25) {
    return 'bg-gradient-to-br from-green-400 to-green-500 shadow-green-400/50';
  } else if (normalized < 0.5) {
    return 'bg-gradient-to-br from-green-500 to-yellow-400 shadow-green-500/50';
  } else if (normalized < 0.75) {
    return 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-400/50';
  } else {
    return 'bg-gradient-to-br from-orange-500 to-red-500 shadow-red-500/50';
  }
};

const getNoteDisplayName = (note: string) => {
  return note; // Keep full note name with octave
};

const getOctaveNumber = (note: string) => {
  const match = note.match(/[0-9]/);
  return match ? match[0] : '';
};

const PianoRollPage: React.FC = () => {
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
  
  // Navigation octaves
  const [visibleOctaveStart, setVisibleOctaveStart] = useState(2); // Commence à C2
  const [visibleOctaveCount, setVisibleOctaveCount] = useState(3); // Affiche 3 octaves
  
  // Configuration des steps
  const [stepCount, setStepCount] = useState(DEFAULT_STEPS);
  
  // Audio engine hook
  const { 
    isPlaying, 
    isInitialized, 
    currentStep, 
    tempo,
    initialize, 
    start, 
    stop, 
    setPattern: setAudioPattern,
    setTempo 
  } = useSimpleAudio();
  
  // Auto-initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Gestion du scroll de la molette pour naviguer dans les octaves
  const handleWheel = (e: Event) => {
    const wheelEvent = e as WheelEvent;
    e.preventDefault();
    
    if (wheelEvent.deltaY > 0) {
      // Scroll down - monter dans les octaves
      setVisibleOctaveStart(Math.min(7 - visibleOctaveCount + 1, visibleOctaveStart + 1));
    } else {
      // Scroll up - descendre dans les octaves
      setVisibleOctaveStart(Math.max(1, visibleOctaveStart - 1));
    }
  };
  
  // Effet pour gérer l'événement wheel avec passive: false
  useEffect(() => {
    const pianoRollContainer = document.querySelector('.piano-roll-container');
    if (pianoRollContainer) {
      pianoRollContainer.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        pianoRollContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, [visibleOctaveStart, visibleOctaveCount]);
  
  // Calcul des notes visibles selon l'octave sélectionnée
  const getVisibleNotes = (): string[] => {
    const visibleOctaves = [];
    for (let i = 0; i < visibleOctaveCount; i++) {
      const octave = visibleOctaveStart + visibleOctaveCount - 1 - i; // Top to bottom
      if (octave >= 1 && octave <= 7) {
        visibleOctaves.push(octave);
      }
    }
    return visibleOctaves.flatMap(octave => generateNotesForOctave(octave));
  };
  
  const visibleNotes = getVisibleNotes();
  
  // Calcul de la largeur des cellules basé sur le nombre de steps et l'écran
  const getCellWidth = (steps: number): string => {
    // Mobile (xs/sm) - cellules plus petites
    if (steps <= 16) return 'w-12 sm:w-14'; // Large pour peu de steps
    if (steps <= 32) return 'w-8 sm:w-10'; // Moyen pour 32 steps
    return 'w-6 sm:w-8'; // Petit pour 64 steps
  };
  
  const cellWidth = getCellWidth(stepCount);
  
  // Calcul des steps d'accents basé sur le nombre de steps
  const getAccentSteps = (totalSteps: number): number[] => {
    if (totalSteps <= 16) {
      return [1, 5, 9, 13].filter(step => step <= totalSteps);
    } else if (totalSteps <= 32) {
      return [1, 5, 9, 13, 17, 21, 25, 29].filter(step => step <= totalSteps);
    } else {
      // Pour 64 steps, accent tous les 4 steps
      const accents = [];
      for (let i = 1; i <= totalSteps; i += 4) {
        accents.push(i);
      }
      return accents;
    }
  };
  
  const accentSteps = getAccentSteps(stepCount);

  // Convert visual pattern to audio pattern
  const convertToAudioPattern = (visualPattern: NoteEvent[]): SimplePattern => {
    const audioPattern: SimplePattern = {};
    
    // Initialize all notes with empty steps (use current stepCount)
    ALL_NOTES.forEach(note => {
      audioPattern[note] = Array(stepCount).fill(null).map(() => ({ on: false, velocity: 0 }));
    });
    
    // Fill in the active notes with duration support
    visualPattern.forEach(noteEvent => {
      if (audioPattern[noteEvent.note]) {
        // Note de début avec durée
        if (audioPattern[noteEvent.note][noteEvent.step]) {
          audioPattern[noteEvent.note][noteEvent.step] = {
            on: true,
            velocity: noteEvent.velocity / 127, // Normalize to 0-1
            duration: noteEvent.duration
          };
        }
        
        // Marquer les steps intermédiaires comme "sustain"
        for (let i = 1; i < noteEvent.duration; i++) {
          const sustainStep = noteEvent.step + i;
          if (sustainStep < stepCount && audioPattern[noteEvent.note][sustainStep]) {
            audioPattern[noteEvent.note][sustainStep] = {
              on: false, // Pas de nouveau déclenchement
              velocity: 0,
              duration: 0 // Marquer comme sustain
            };
          }
        }
      }
    });
    
    return audioPattern;
  };
  
  // Update audio pattern when visual pattern changes
  useEffect(() => {
    const audioPattern = convertToAudioPattern(pattern);
    setAudioPattern(audioPattern);
  }, [pattern, setAudioPattern]);

  const toggleNote = (step: number, note: string) => {
    setPattern(prev => {
      const existingNote = prev.find(n => n.step === step && n.note === note);
      
      if (existingNote) {
        // Remove note
        return prev.filter(n => !(n.step === step && n.note === note));
      } else {
        // Add note (seulement si dans la gamme de steps actuelle)
        if (step < stepCount) {
          return [...prev, {
            step,
            note,
            velocity: 100, // Vélocité par défaut
            isActive: true,
            duration: 1 // Durée par défaut: 1 step
          }];
        }
        return prev;
      }
    });
  };
  
  // Gestion du drag pour éditer la vélocité (souris) - fonctionne sur toute la note longue
  const handleMouseDown = (step: number, note: string, e: React.MouseEvent) => {
    const noteInfo = isPartOfNote(step, note);
    if (noteInfo.noteEvent && e.button === 0) { // Clic gauche seulement
      e.preventDefault();
      e.stopPropagation();
      
      // Utiliser les données de la note principale, pas du step clique
      setDragState({
        isDragging: true,
        step: noteInfo.noteEvent.step, // Step de la note principale
        note,
        startY: e.clientY,
        startVelocity: noteInfo.noteEvent.velocity,
        currentVelocity: noteInfo.noteEvent.velocity
      });
    }
  };
  
  // Gestion du drag pour éditer la vélocité (tactile) - fonctionne sur toute la note longue
  const handleTouchStart = (step: number, note: string, e: React.TouchEvent) => {
    const noteInfo = isPartOfNote(step, note);
    if (noteInfo.noteEvent) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      // Utiliser les données de la note principale
      setDragState({
        isDragging: true,
        step: noteInfo.noteEvent.step, // Step de la note principale
        note,
        startY: touch.clientY,
        startVelocity: noteInfo.noteEvent.velocity,
        currentVelocity: noteInfo.noteEvent.velocity
      });
    }
  };
  
  // Gestion du drag pour redimensionner les notes (souris)
  const handleResizeMouseDown = (step: number, note: string, e: React.MouseEvent) => {
    const existingNote = pattern.find(n => n.step === step && n.note === note);
    if (existingNote) {
      e.preventDefault();
      e.stopPropagation();
      
      setResizeState({
        isResizing: true,
        step,
        note,
        startX: e.clientX,
        startDuration: existingNote.duration,
        currentDuration: existingNote.duration
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState?.isDragging) {
      e.preventDefault();
      const deltaY = dragState.startY - e.clientY; // Inversé: haut = plus fort
      const sensitivity = 2; // Pixels par unité de vélocité
      const newVelocity = Math.max(1, Math.min(127, dragState.startVelocity + Math.round(deltaY / sensitivity)));
      
      setDragState(prev => prev ? { ...prev, currentVelocity: newVelocity } : null);
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragState?.isDragging) {
      e.preventDefault();
      e.stopPropagation();
      
      // Sauvegarder la nouvelle vélocité
      setPattern(prev => prev.map(n => 
        n.step === dragState.step && n.note === dragState.note
          ? { ...n, velocity: dragState.currentVelocity }
          : n
      ));
      
      setDragState(null);
    }
  };
  
  // Gestion globale des événements pour le drag (souris + tactile)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragState?.isDragging) {
        const deltaY = dragState.startY - e.clientY;
        const sensitivity = 2;
        const newVelocity = Math.max(1, Math.min(127, dragState.startVelocity + Math.round(deltaY / sensitivity)));
        
        setDragState(prev => prev ? { ...prev, currentVelocity: newVelocity } : null);
      }
    };
    
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (dragState?.isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        const deltaY = dragState.startY - touch.clientY;
        const sensitivity = 2;
        const newVelocity = Math.max(1, Math.min(127, dragState.startVelocity + Math.round(deltaY / sensitivity)));
        
        setDragState(prev => prev ? { ...prev, currentVelocity: newVelocity } : null);
      }
    };
    
    const handleGlobalEnd = () => {
      if (dragState?.isDragging) {
        // Sauvegarder la vélocité
        setPattern(prev => prev.map(n => 
          n.step === dragState.step && n.note === dragState.note
            ? { ...n, velocity: dragState.currentVelocity }
            : n
        ));
        setDragState(null);
      }
      
      if (resizeState?.isResizing) {
        // Sauvegarder la durée
        setPattern(prev => prev.map(n => 
          n.step === resizeState.step && n.note === resizeState.note
            ? { ...n, duration: resizeState.currentDuration }
            : n
        ));
        setResizeState(null);
      }
    };
    
    const handleGlobalMouseMoveResize = (e: MouseEvent) => {
      if (resizeState?.isResizing) {
        const deltaX = e.clientX - resizeState.startX;
        const cellWidthPx = stepCount <= 16 ? 56 : stepCount <= 32 ? 40 : 32; // Approximation
        const stepsDelta = Math.round(deltaX / cellWidthPx);
        const newDuration = Math.max(1, Math.min(stepCount - resizeState.step, resizeState.startDuration + stepsDelta));
        
        setResizeState(prev => prev ? { ...prev, currentDuration: newDuration } : null);
      }
    };
    
    if (dragState?.isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalEnd);
      
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
    }
    
    if (resizeState?.isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMoveResize);
      document.addEventListener('mouseup', handleGlobalEnd);
      
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mousemove', handleGlobalMouseMoveResize);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalEnd);
      
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };
  }, [dragState, resizeState, pattern]);
  
  // Nettoyer le pattern quand on change le nombre de steps
  useEffect(() => {
    setPattern(prev => prev.filter(note => note.step < stepCount));
  }, [stepCount]);

  const isNoteActive = (step: number, note: string) => {
    const noteInfo = isPartOfNote(step, note);
    return noteInfo.noteEvent !== null;
  };
  
  // Récupérer la vélocité d'une note (avec drag en cours) - fonctionne pour les notes longues
  const getNoteVelocity = (step: number, note: string): number => {
    const noteInfo = isPartOfNote(step, note);
    
    if (!noteInfo.noteEvent) return 100;
    
    // Si on est en train de dragger cette note (n'importe quelle partie), utiliser la vélocité temporaire
    if (dragState?.isDragging && dragState.step === noteInfo.noteEvent.step && dragState.note === note) {
      return dragState.currentVelocity;
    }
    
    // Retourner la vélocité de la note principale (celle qui contient les données)
    return noteInfo.noteEvent.velocity;
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
    
    // Chercher une note longue qui englobe ce step
    const longNote = pattern.find(n => {
      const currentDuration = resizeState?.isResizing && resizeState.step === n.step && resizeState.note === n.note 
        ? resizeState.currentDuration 
        : n.duration;
      
      return n.note === note && 
             n.step < step && 
             n.step + currentDuration > step;
    });
    
    if (longNote) {
      const currentDuration = resizeState?.isResizing && resizeState.step === longNote.step && resizeState.note === longNote.note 
        ? resizeState.currentDuration 
        : longNote.duration;
      const isLastStep = step === longNote.step + currentDuration - 1;
      return {
        isStart: false,
        isMiddle: !isLastStep,
        isEnd: isLastStep,
        noteEvent: longNote
      };
    }
    
    return {
      isStart: false,
      isMiddle: false,
      isEnd: false,
      noteEvent: null
    };
  };
  
  // Récupérer la durée d'une note (avec resize en cours)
  const getNoteDuration = (step: number, note: string): number => {
    // Si on est en train de redimensionner cette note, utiliser la durée temporaire
    if (resizeState?.isResizing && resizeState.step === step && resizeState.note === note) {
      return resizeState.currentDuration;
    }
    
    const noteEvent = pattern.find(n => n.step === step && n.note === note);
    return noteEvent ? noteEvent.duration : 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎹 Piano Roll
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">Éditeur de patterns - {stepCount} pas, gamme en C</p>
        </div>

        {/* Transport Controls */}
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
            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="px-3 sm:px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600 text-center sm:text-left">
                <span className="text-slate-300 text-xs sm:text-sm block sm:inline">Step:</span>
                <span className={`text-white font-mono ml-0 sm:ml-2 block sm:inline text-sm sm:text-base ${isPlaying ? 'animate-pulse' : ''}`}>
                  {currentStep + 1} / {stepCount}
                </span>
              </div>
              
              <div className="px-3 sm:px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600 text-center sm:text-left">
                <span className="text-slate-300 text-xs sm:text-sm block sm:inline">Notes:</span>
                <span className="text-blue-400 font-mono ml-0 sm:ml-2 block sm:inline text-sm sm:text-base">{pattern.length}</span>
              </div>
              
              {/* Tempo - Full width on mobile */}
              <div className="col-span-2 sm:col-span-1 px-3 sm:px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600">
                <div className="flex items-center justify-between sm:justify-start">
                  <span className="text-slate-300 text-xs sm:text-sm">Tempo:</span>
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="range"
                      min="60"
                      max="180"
                      value={tempo}
                      onChange={(e) => setTempo(parseInt(e.target.value))}
                      className="w-16 sm:w-20 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      aria-label="Tempo control"
                      title={`Tempo: ${tempo} BPM`}
                    />
                    <span className="text-emerald-400 font-mono text-sm">{tempo}</span>
                  </div>
                </div>
              </div>
              
              <div className={`col-span-2 sm:col-span-1 px-3 py-2 rounded-lg text-xs font-semibold text-center ${
                isInitialized 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isInitialized ? '🟢 Ready' : '🟡 Loading'}
              </div>
            </div>
          </div>
        </div>

        {/* Piano Roll Interface */}
        <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl overflow-hidden">
          {/* Configuration Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-3 bg-slate-900/50 border-b border-slate-600/50 gap-3 sm:gap-0">
            {/* Steps Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <span className="text-slate-300 font-semibold text-sm sm:text-base">📏 Steps:</span>
              <div className="flex gap-2 flex-wrap">
                {STEP_OPTIONS.map(option => (
                  <button
                    key={option}
                    onClick={() => setStepCount(option)}
                    className={`px-4 py-2 sm:px-3 sm:py-1 rounded-lg text-sm font-mono transition-all touch-manipulation ${
                      stepCount === option
                        ? 'bg-blue-500 text-white shadow-blue-500/30'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400">
                {accentSteps.length} accents
              </span>
            </div>
            
            <div className="text-xs text-slate-400 text-center sm:text-right">
              Pattern: {stepCount} steps
            </div>
          </div>
          
          {/* Octave Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-slate-900/30 border-b border-slate-600/50 gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <span className="text-slate-300 font-semibold text-sm sm:text-base">🎹 Octaves:</span>
              
              {/* Octave Range Selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisibleOctaveStart(Math.max(1, visibleOctaveStart - 1))}
                  disabled={visibleOctaveStart <= 1}
                  className="px-4 py-2 sm:px-3 sm:py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-mono transition-colors touch-manipulation"
                >
                  ←
                </button>
                
                <span className="px-4 py-2 sm:px-4 sm:py-1 bg-slate-800 rounded-lg text-sm font-mono border border-slate-600">
                  C{visibleOctaveStart} - C{Math.min(7, visibleOctaveStart + visibleOctaveCount - 1)}
                </span>
                
                <button
                  onClick={() => setVisibleOctaveStart(Math.min(7 - visibleOctaveCount + 1, visibleOctaveStart + 1))}
                  disabled={visibleOctaveStart + visibleOctaveCount - 1 >= 7}
                  className="px-4 py-2 sm:px-3 sm:py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-mono transition-colors touch-manipulation"
                >
                  →
                </button>
              </div>
              
              {/* Quick Jump Buttons - Hidden on very small screens */}
              <div className="hidden xs:flex gap-1">
                {[1, 2, 3, 4, 5].map(octave => (
                  <button
                    key={octave}
                    onClick={() => setVisibleOctaveStart(octave)}
                    className={`px-3 py-2 sm:px-2 sm:py-1 rounded text-xs font-mono transition-colors touch-manipulation ${
                      octave >= visibleOctaveStart && octave < visibleOctaveStart + visibleOctaveCount
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    C{octave}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-slate-400 text-center sm:text-right">
              {visibleNotes.length} notes
            </div>
          </div>
          
          {/* Container avec scroll unique */}
          <div className="flex flex-col overflow-x-auto piano-roll-container">
            {/* Header des steps - fixé en haut */}
            <div className="flex sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-600/30">
              <div className="w-24 sm:w-28 flex-shrink-0 bg-gradient-to-r from-slate-700/50 to-slate-800/50 py-2"></div>
              <div className="flex">
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
            
            {/* Piano Roll Grid */}
            <div className="flex">
              {/* Piano Keys (Left Side) - fixé à gauche, adaptatif mobile */}
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

              {/* Grid (Right Side) - scrollable horizontalement */}
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
                        // Ou si on drag n'importe quelle partie de cette note longue
                        const isDraggingThisLongNote = dragState?.isDragging && noteInfo.noteEvent && dragState.step === noteInfo.noteEvent.step && dragState.note === note;
                        const showDragFeedback = isDraggingThis || isDraggingThisLongNote;
                        
                        return (
                          <div
                            key={stepIndex}
                            className={`
                              ${cellWidth} h-full border-r border-slate-600/30 cursor-pointer
                              flex items-center justify-center text-xs relative flex-shrink-0
                              transition-all duration-200 touch-manipulation
                              ${stepIndex === currentStep && isPlaying ? 'ring-2 ring-yellow-400 ring-opacity-60' : ''}
                              ${isAccentStep 
                                ? 'bg-slate-950/60 hover:bg-slate-900/80 active:bg-slate-800/90 border-r-2 border-amber-500/50' 
                                : (isBlack 
                                  ? 'bg-slate-900/40 hover:bg-slate-800/70 active:bg-slate-700/80' 
                                  : 'bg-slate-800/40 hover:bg-slate-700/70 active:bg-slate-600/80'
                                )
                              }
                              ${showDragFeedback ? 'ring-2 ring-blue-400 cursor-ns-resize' : ''}
                              ${noteInfo.isMiddle ? 'border-r-0' : ''}
                            `}
                            onClick={() => !dragState?.isDragging && toggleNote(stepIndex, note)}
                            onMouseDown={(e) => hasNote && handleMouseDown(stepIndex, note, e)}
                            onTouchStart={(e) => hasNote && handleTouchStart(stepIndex, note, e)}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
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
              </div>
            </div>
          </div>
        </div>

        {/* Pattern Info */}
        <div className="mt-4 sm:mt-6 lg:mt-8 p-4 sm:p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-slate-200">🎵 Pattern Info</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="text-center p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <div className="text-2xl font-bold text-blue-400">{stepCount}</div>
              <div className="text-sm text-slate-400">Steps</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <div className="text-2xl font-bold text-emerald-400">{pattern.length}</div>
              <div className="text-sm text-slate-400">Notes actives</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <div className="text-2xl font-bold text-purple-400">C</div>
              <div className="text-sm text-slate-400">Gamme</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <div className="text-2xl font-bold text-amber-400">{accentSteps.length}</div>
              <div className="text-sm text-slate-400">Accents</div>
            </div>
          </div>
          
          {pattern.length > 0 && (
            <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-600/30">
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                🎼 Notes dans le pattern:
              </h4>
              <div className="flex flex-wrap gap-2">
                {pattern
                  .sort((a, b) => a.step - b.step)
                  .map((note, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-mono border border-blue-500/30"
                    >
                      Step {note.step + 1}: {note.note}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 sm:mt-6 lg:mt-8 p-4 sm:p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-slate-200">📚 Instructions</h3>
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-blue-400 mb-2 sm:mb-3">🎮 Contrôles</h4>
              <ul className="space-y-2 text-sm sm:text-base text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
                  <strong>Tap/Clic</strong> sur une case pour ajouter/supprimer une note
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0"></span>
                  <strong>Drag vertical</strong> sur une note pour ajuster sa vélocité
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></span>
                  <strong>Drag horizontal</strong> sur le bord droit pour étendre la note
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></span>
                  <strong>Play/Stop</strong> pour contrôler la lecture
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></span>
                  <strong>Molette/Swipe</strong> pour changer d'octave
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-amber-400 mb-2 sm:mb-3">🎨 Interface</h4>
              <ul className="space-y-2 text-sm sm:text-base text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0"></span>
                  <strong>Colonnes sombres</strong> = temps forts (1, 5, 9, 13...)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></span>
                  <strong>Touches piano</strong> noires/blanches avec octaves
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></span>
                  <strong>Couleurs notes</strong> vert (faible) → rouge (forte vélocité)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0"></span>
                  <strong>Notes longues</strong> s'étendent sur plusieurs steps avec durée
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRollPage;