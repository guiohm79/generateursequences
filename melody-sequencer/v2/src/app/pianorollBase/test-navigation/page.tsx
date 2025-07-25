'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSimpleAudio } from '../../../hooks/useSimpleAudio';

// Import des nouveaux composants
import { OctaveNavigation } from '../components/OctaveNavigation';
import { PianoKeys } from '../components/PianoKeys';
import { StepHeader } from '../components/StepHeader';

// Import des hooks
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Import des types
import { NoteEvent, NoteId } from '../types';

// Import des utilitaires
import { 
  STEP_OPTIONS, 
  DEFAULT_STEPS, 
  ALL_NOTES, 
  ALL_OCTAVES,
  DEFAULT_VELOCITY
} from '../utils/constants';

import {
  isBlackKey,
  getNoteDisplayName,
  getOctaveNumber,
  generateNotesForOctave,
  getVelocityColorClass,
  createNoteId
} from '../utils/noteHelpers';

import {
  moveNoteInPattern,
  validateNotePosition
} from '../utils/patternHelpers';

const PianoRollTestNavigationPage: React.FC = () => {
  // === ÉTATS POUR LES COMPOSANTS DE NAVIGATION ===
  const [stepCount, setStepCount] = useState<number>(DEFAULT_STEPS);
  const [visibleOctaveStart, setVisibleOctaveStart] = useState<number>(3);
  const [visibleOctaveCount] = useState<number>(3);

  // === ÉTATS POUR LE PIANO ROLL ===
  const [pattern, setPattern] = useState<{ [key: NoteId]: NoteEvent }>({});
  const [selectedNotes, setSelectedNotes] = useState<Set<NoteId>>(new Set());
  // Type pour le clipboard
  interface ClipboardData {
    notes: NoteEvent[];
    relativePositions: { stepOffset: number; noteOffset: number }[];
  }
  
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [mousePosition, setMousePosition] = useState<{ step: number; note: string } | null>(null);

  // Audio engine pour le test
  const { 
    isPlaying, 
    isInitialized, 
    currentStep, 
    start, 
    stop 
  } = useSimpleAudio();

  // === PATTERN D'EXEMPLE POUR LES TESTS ===
  useEffect(() => {
    // Créer quelques notes d'exemple pour tester les raccourcis
    const examplePattern: { [key: NoteId]: NoteEvent } = {
      '0-C4': { step: 0, note: 'C4', velocity: 100, isActive: true, duration: 1 },
      '4-E4': { step: 4, note: 'E4', velocity: 80, isActive: true, duration: 1 },
      '8-G4': { step: 8, note: 'G4', velocity: 120, isActive: true, duration: 2 },
      '12-C5': { step: 12, note: 'C5', velocity: 90, isActive: true, duration: 1 },
    };
    setPattern(examplePattern);
  }, []);

  // === CALCUL DES NOTES VISIBLES ===
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

  // === CALCUL DE LA LARGEUR DES CELLULES ===
  const getCellWidth = (steps: number): string => {
    if (steps <= 16) return 'w-12 sm:w-14';
    if (steps <= 32) return 'w-8 sm:w-10';
    return 'w-6 sm:w-8';
  };

  const cellWidth = getCellWidth(stepCount);

  // === CALCUL DES STEPS D'ACCENTS ===
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

  // === FONCTIONS DE MANIPULATION DES NOTES ===
  const addNote = useCallback((step: number, note: string) => {
    const noteId = createNoteId(step, note);
    if (pattern[noteId]) return; // Ne pas ajouter si déjà présente
    
    const newNote: NoteEvent = {
      step,
      note,
      velocity: DEFAULT_VELOCITY,
      isActive: true,
      duration: 1
    };
    
    setPattern(prev => ({ ...prev, [noteId]: newNote }));
  }, [pattern]);

  const removeNote = useCallback((noteId: NoteId) => {
    setPattern(prev => {
      const newPattern = { ...prev };
      delete newPattern[noteId];
      return newPattern;
    });
    setSelectedNotes(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(noteId);
      return newSelected;
    });
  }, []);

  const selectAllNotes = useCallback(() => {
    setSelectedNotes(new Set(Object.keys(pattern)));
  }, [pattern]);

  const deselectAllNotes = useCallback(() => {
    setSelectedNotes(new Set());
  }, []);

  const copySelectedNotes = useCallback(() => {
    if (selectedNotes.size === 0) return;
    
    const selectedNotesArray = Array.from(selectedNotes)
      .map(noteId => pattern[noteId])
      .filter(Boolean);
    
    if (selectedNotesArray.length === 0) return;
    
    // Calculer la position de référence (note la plus haute et step le plus à gauche)
    const minStep = Math.min(...selectedNotesArray.map(note => note.step));
    const minNoteIndex = Math.min(...selectedNotesArray.map(note => visibleNotes.indexOf(note.note)));
    
    // Créer les positions relatives par rapport à cette référence
    const relativePositions = selectedNotesArray.map(note => ({
      stepOffset: note.step - minStep,
      noteOffset: visibleNotes.indexOf(note.note) - minNoteIndex
    }));
    
    setClipboard({
      notes: [...selectedNotesArray],
      relativePositions
    });
  }, [selectedNotes, pattern, visibleNotes]);

  const pasteNotes = useCallback((targetStep?: number, targetNote?: string) => {
    if (!clipboard) return;
    
    // Utiliser la position de la souris ou une position par défaut
    const pasteStep = targetStep ?? (mousePosition?.step ?? 0);
    const pasteNote = targetNote ?? (mousePosition?.note ?? visibleNotes[Math.floor(visibleNotes.length / 2)]);
    
    const targetNoteIndex = visibleNotes.indexOf(pasteNote);
    if (targetNoteIndex === -1) return;
    
    const newPattern = { ...pattern };
    
    clipboard.notes.forEach((originalNote, index) => {
      const relativePos = clipboard.relativePositions[index];
      const newStep = pasteStep + relativePos.stepOffset;
      const newNoteIndex = targetNoteIndex + relativePos.noteOffset;
      
      // Vérifier que la nouvelle position est valide
      if (newStep >= 0 && newStep < stepCount && 
          newNoteIndex >= 0 && newNoteIndex < visibleNotes.length) {
        
        const newNote = visibleNotes[newNoteIndex];
        const noteId = createNoteId(newStep, newNote);
        
        newPattern[noteId] = {
          ...originalNote,
          step: newStep,
          note: newNote
        };
      }
    });
    
    setPattern(newPattern);
  }, [clipboard, pattern, stepCount, mousePosition, visibleNotes]);

  const deleteSelectedNotes = useCallback(() => {
    setPattern(prev => {
      const newPattern = { ...prev };
      selectedNotes.forEach(noteId => {
        delete newPattern[noteId];
      });
      return newPattern;
    });
    setSelectedNotes(new Set());
  }, [selectedNotes]);

  const moveSelectedNotes = useCallback((stepDelta: number, noteDelta: number) => {
    if (selectedNotes.size === 0) return;
    
    const newPattern = { ...pattern };
    const notesToMove = Array.from(selectedNotes).map(noteId => ({
      noteId,
      note: pattern[noteId]
    })).filter(item => item.note);
    
    // Supprimer les anciennes positions
    notesToMove.forEach(({ noteId }) => {
      delete newPattern[noteId];
    });
    
    const newSelectedNotes = new Set<NoteId>();
    
    // Ajouter aux nouvelles positions
    notesToMove.forEach(({ note }) => {
      const newStep = Math.max(0, Math.min(stepCount - 1, note.step + stepDelta));
      
      // Calculer la nouvelle note (pour les déplacements verticaux)
      let newNote = note.note;
      if (noteDelta !== 0) {
        const currentNoteIndex = ALL_NOTES.indexOf(note.note);
        if (currentNoteIndex !== -1) {
          const newNoteIndex = Math.max(0, Math.min(ALL_NOTES.length - 1, currentNoteIndex + noteDelta));
          newNote = ALL_NOTES[newNoteIndex];
        }
      }
      
      const newNoteId = createNoteId(newStep, newNote);
      newPattern[newNoteId] = {
        ...note,
        step: newStep,
        note: newNote
      };
      newSelectedNotes.add(newNoteId);
    });
    
    setPattern(newPattern);
    setSelectedNotes(newSelectedNotes);
  }, [selectedNotes, pattern, stepCount]);

  const clearPattern = useCallback(() => {
    setPattern({});
    setSelectedNotes(new Set());
  }, []);

  // === INTÉGRATION RACCOURCIS CLAVIER ===
  const { getAvailableShortcuts } = useKeyboardShortcuts({
    onPlay: start,
    onStop: stop,
    onSelectAll: selectAllNotes,
    onDeselectAll: deselectAllNotes,
    onCopy: copySelectedNotes,
    onPaste: pasteNotes,
    onDelete: deleteSelectedNotes,
    onClearPattern: clearPattern,
    onMoveSelection: moveSelectedNotes,
    isPlaying,
    hasSelection: selectedNotes.size > 0,
    canUndo: false, // Pas d'undo/redo dans ce test
    canRedo: false
  });

  // === GESTION DES CLICS SUR LES CELLULES ===
  const handleCellClick = useCallback((step: number, note: string, event: React.MouseEvent) => {
    const noteId = createNoteId(step, note);
    
    // Mettre à jour la position de la souris pour le coller
    setMousePosition({ step, note });
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+clic : ajouter/retirer de la sélection
      if (selectedNotes.has(noteId)) {
        setSelectedNotes(prev => {
          const newSelected = new Set(prev);
          newSelected.delete(noteId);
          return newSelected;
        });
      } else {
        setSelectedNotes(prev => new Set([...Array.from(prev), noteId]));
      }
    } else if (pattern[noteId]) {
      // Clic sur une note existante : la sélectionner uniquement
      setSelectedNotes(new Set([noteId]));
    } else {
      // Clic sur case vide : ajouter une note
      addNote(step, note);
      setSelectedNotes(new Set([noteId]));
    }
  }, [pattern, selectedNotes, addNote]);

  // === GESTION DU SURVOL POUR LA POSITION DE LA SOURIS ===
  const handleCellMouseEnter = useCallback((step: number, note: string) => {
    setMousePosition({ step, note });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎹 Piano Roll - Test Navigation + Raccourcis
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">Test complet des composants + raccourcis clavier + déplacement flèches</p>
        </div>

        {/* Contrôles de test */}
        <div className="mb-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => {
                if (isPlaying) {
                  stop();
                } else {
                  start();
                }
              }}
              disabled={!isInitialized}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isPlaying 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
              }`}
            >
              {!isInitialized ? '🔄 Initializing...' : (isPlaying ? '⏹ Stop' : '▶ Play')}
            </button>

            <div className="flex items-center gap-4">
              <label className="text-slate-300 font-semibold">Steps:</label>
              <select
                value={stepCount}
                onChange={(e) => setStepCount(parseInt(e.target.value))}
                aria-label="Choisir le nombre de steps"
                className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                {STEP_OPTIONS.map(steps => (
                  <option key={steps} value={steps}>
                    {steps}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Step:</span>
              <span className={`font-mono ${isPlaying ? 'animate-pulse text-yellow-400' : ''}`}>
                {currentStep + 1} / {stepCount}
              </span>
            </div>
          </div>
        </div>

        {/* Message de test */}
        <div className="mb-6 p-4 bg-gradient-to-r from-green-800/50 to-green-700/50 backdrop-blur-sm rounded-2xl border border-green-600/50">
          <h2 className="text-lg font-bold mb-3 text-green-400">✅ Test Navigation + Raccourcis Clavier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm text-green-300">
              <p className="font-semibold text-green-200">Composants :</p>
              <p>• <strong>OctaveNavigation</strong> : Boutons +/- et navigation molette</p>
              <p>• <strong>PianoKeys</strong> : Affichage touches noires/blanches responsive</p>
              <p>• <strong>StepHeader</strong> : Numérotation avec accents et step courant</p>
              <p>• <strong>Scroll wheel</strong> : Utilisez la molette sur la zone piano roll pour naviguer</p>
            </div>
            <div className="space-y-2 text-sm text-green-300">
              <p className="font-semibold text-green-200">Raccourcis Clavier :</p>
              <p>• <strong>Espace</strong> : Play/Stop</p>
              <p>• <strong>Ctrl+A</strong> : Sélectionner toutes les notes</p>
              <p>• <strong>Ctrl+C/V</strong> : Copier/Coller</p>
              <p>• <strong>Delete</strong> : Supprimer sélection</p>
              <p>• <strong>Flèches</strong> : Déplacer notes sélectionnées</p>
              <p>• <strong>Escape</strong> : Désélectionner</p>
            </div>
          </div>
        </div>

        {/* Statistiques en temps réel */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-800/50 to-blue-700/50 backdrop-blur-sm rounded-2xl border border-blue-600/50">
          <h3 className="text-lg font-bold mb-3 text-blue-400">📊 État Actuel</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-blue-900/30 rounded-xl">
              <div className="font-semibold text-blue-300">Notes Total</div>
              <div className="font-mono text-xl text-white">{Object.keys(pattern).length}</div>
            </div>
            <div className="p-3 bg-blue-900/30 rounded-xl">
              <div className="font-semibold text-blue-300">Sélectionnées</div>
              <div className="font-mono text-xl text-yellow-400">{selectedNotes.size}</div>
            </div>
            <div className="p-3 bg-blue-900/30 rounded-xl">
              <div className="font-semibold text-blue-300">Clipboard</div>
              <div className="font-mono text-xl text-green-400">{clipboard?.notes.length || 0}</div>
            </div>
            <div className="p-3 bg-blue-900/30 rounded-xl">
              <div className="font-semibold text-blue-300">Audio</div>
              <div className="font-mono text-xl text-emerald-400">{isPlaying ? 'ON' : 'OFF'}</div>
            </div>
          </div>
        </div>

        {/* COMPOSANTS TESTÉS */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-xl overflow-hidden">
          
          {/* COMPOSANT OCTAVE NAVIGATION */}
          <OctaveNavigation
            visibleOctaveStart={visibleOctaveStart}
            visibleOctaveCount={visibleOctaveCount}
            visibleNotesLength={visibleNotes.length}
            setVisibleOctaveStart={setVisibleOctaveStart}
            maxOctave={7}
            minOctave={1}
            containerClassName="piano-roll-container"
          />
          
          {/* Container avec scroll unique */}
          <div className="flex flex-col overflow-x-auto piano-roll-container">
            
            {/* COMPOSANT STEP HEADER */}
            <StepHeader
              stepCount={stepCount}
              accentSteps={accentSteps}
              cellWidth={cellWidth}
              showCurrentStep={true}
              currentStep={currentStep}
              isPlaying={isPlaying}
            />
            
            {/* Piano Roll Grid */}
            <div className="flex">
              
              {/* COMPOSANT PIANO KEYS */}
              <PianoKeys visibleNotes={visibleNotes} />

              {/* Grid interactive avec notes */}
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
                        const step = stepIndex;
                        const stepDisplay = stepIndex + 1;
                        const isAccentStep = accentSteps.includes(stepDisplay);
                        const isCurrentStep = isPlaying && stepIndex === currentStep;
                        const noteId = createNoteId(step, note);
                        const hasNote = pattern[noteId];
                        const isSelected = selectedNotes.has(noteId);
                        
                        return (
                          <div
                            key={stepIndex}
                            onClick={(e) => handleCellClick(step, note, e)}
                            onMouseEnter={() => handleCellMouseEnter(step, note)}
                            className={`
                              ${cellWidth} h-full border-r border-slate-600/30 cursor-pointer
                              flex items-center justify-center text-xs relative flex-shrink-0
                              transition-all duration-200 touch-manipulation
                              ${isCurrentStep ? 'ring-2 ring-yellow-400 ring-opacity-60' : ''}
                              ${isSelected ? 'ring-2 ring-yellow-400/80' : ''}
                              ${hasNote 
                                ? (isSelected 
                                  ? getVelocityColorClass(hasNote.velocity) + ' ring-2 ring-yellow-400/80'
                                  : getVelocityColorClass(hasNote.velocity)
                                ) 
                                : (isAccentStep 
                                  ? 'bg-slate-950/60 hover:bg-slate-900/80 active:bg-slate-800/90 border-r-2 border-amber-500/50' 
                                  : (isBlack 
                                    ? 'bg-slate-900/40 hover:bg-slate-800/70 active:bg-slate-700/80' 
                                    : 'bg-slate-800/40 hover:bg-slate-700/70 active:bg-slate-600/80'
                                  )
                                )
                              }
                            `}
                            title={`Step ${stepDisplay}, Note ${note}${hasNote ? ` (vel: ${hasNote.velocity})` : ''}${isAccentStep ? ' (accent)' : ''}${isCurrentStep ? ' (en cours)' : ''}${isSelected ? ' (sélectionnée)' : ''}`}
                          >
                            {hasNote ? (
                              // Note existante avec indicateur de vélocité
                              <div className="w-full h-full flex items-center justify-center">
                                <div className={`w-2 h-2 rounded-full bg-white/80 ${isCurrentStep ? 'animate-pulse' : ''}`} />
                                {hasNote.duration > 1 && (
                                  <div className="absolute inset-0 border-r-2 border-white/30" />
                                )}
                              </div>
                            ) : (
                              // Cellule vide avec dot pour la grille
                              <div className={`
                                w-1 h-1 rounded-full opacity-20
                                ${isAccentStep ? 'bg-amber-400' : 'bg-slate-500'}
                                ${isCurrentStep ? 'animate-pulse bg-yellow-400 opacity-80' : ''}
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

        {/* Informations de debug */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
          <h3 className="text-lg font-bold mb-4 text-slate-200">🔍 Debug Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-slate-700/50 rounded-xl">
              <div className="font-semibold text-blue-400">Octave Range</div>
              <div className="font-mono">C{visibleOctaveStart} - C{Math.min(7, visibleOctaveStart + visibleOctaveCount - 1)}</div>
            </div>
            <div className="p-3 bg-slate-700/50 rounded-xl">
              <div className="font-semibold text-emerald-400">Visible Notes</div>
              <div className="font-mono">{visibleNotes.length} notes</div>
            </div>
            <div className="p-3 bg-slate-700/50 rounded-xl">
              <div className="font-semibold text-purple-400">Steps Count</div>
              <div className="font-mono">{stepCount} steps</div>
            </div>
            <div className="p-3 bg-slate-700/50 rounded-xl">
              <div className="font-semibold text-amber-400">Accent Steps</div>
              <div className="font-mono">{accentSteps.length} accents</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-slate-900/50 rounded-xl">
            <div className="font-semibold text-slate-300 mb-2">📋 Instructions de Test Complet:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-slate-300 mb-1">Navigation :</div>
                <ul className="space-y-1 text-xs text-slate-400">
                  <li>• <strong>Boutons ←/→</strong> : Navigation octaves avec limites</li>
                  <li>• <strong>Boutons C1-C7</strong> : Saut direct à une octave</li>
                  <li>• <strong>Molette souris</strong> : Scroll sur la zone piano roll</li>
                  <li>• <strong>Play/Stop</strong> : Voir le step courant highlighted</li>
                  <li>• <strong>Steps selector</strong> : Changer 8/16/32/64 steps</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-slate-300 mb-1">Interactions :</div>
                <ul className="space-y-1 text-xs text-slate-400">
                  <li>• <strong>Clic simple</strong> : Ajouter/sélectionner note</li>
                  <li>• <strong>Ctrl+Clic</strong> : Sélection multiple</li>
                  <li>• <strong>Flèches</strong> : Déplacer notes sélectionnées</li>
                  <li>• <strong>Shift+Flèches</strong> : Déplacement rapide</li>
                  <li>• <strong>Ctrl+A/C/V</strong> : Sélectionner/Copier/Coller</li>
                  <li>• <strong>Delete</strong> : Supprimer sélection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRollTestNavigationPage;