'use client';

import React, { useState, useEffect } from 'react';
import { useSimpleAudio } from '../../hooks/useSimpleAudio';
import { SimplePattern, SimpleStep } from '../../lib/SimpleAudioEngine';
import { midiEngine, MidiNote } from '../../lib/MidiEngine';
import { PresetManager } from '../../lib/PresetManager';
import { SequencerPreset } from '../../types';
import { MidiParser } from '../../lib/MidiParser';
import { UndoRedoManager } from '../../lib/UndoRedoManager';

// Import des composants modulaires
import { TransportControls } from './components/TransportControls';
import { OctaveNavigation } from './components/OctaveNavigation';
import { PianoKeys } from './components/PianoKeys';
import { StepHeader } from './components/StepHeader';
import { PianoGridComplete } from './components/PianoGridComplete';
import { MidiOutputPanel } from '../../components/MidiOutputPanel';
import { MidiStatusBar } from '../../components/MidiStatusBar';
import { useMidiInputForMode, useMidiConfig } from '../../contexts/MidiConfigContext';
import { useMidiConfigLoader } from '../../hooks/useMidiConfigLoader';

// Import des types locaux
import { NoteEvent, NoteId, SelectionRectangle, ClipboardData } from './types';

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

const PianoRollCompleteTestPage: React.FC = () => {
  // === ÉTATS COMPLETS (identiques à la version monolithique) ===
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

  // Transport et paramètres
  const [stepCount, setStepCount] = useState<number>(DEFAULT_STEPS);
  const [tempo, setTempo] = useState<number>(120);
  const [visibleOctaveStart, setVisibleOctaveStart] = useState<number>(3);
  const [visibleOctaveCount] = useState<number>(3);

  // États des dialogs et messages
  const [exportStatus, setExportStatus] = useState<string>('');
  const [midiImportStatus, setMidiImportStatus] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showMidiOutputDialog, setShowMidiOutputDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<SequencerPreset[]>([]);

  // Audio engine
  const { 
    isPlaying, 
    isInitialized, 
    currentStep, 
    noteSpeed,
    isAudioEnabled,
    start, 
    stop, 
    setPattern: setAudioPattern, 
    setTempo: setAudioTempo,
    setNoteSpeed,
    setMidiCallback,
    setAudioEnabled,
    initialize 
  } = useSimpleAudio();

  // MIDI Input simplifié
  const midiInput = useMidiInputForMode();
  
  // Contexte global pour accéder aux fonctions de configuration
  const { midiInput: globalMidiInput } = useMidiConfig();
  
  // Chargeur de configuration MIDI
  const { reloadConfig } = useMidiConfigLoader();

  // Debug MIDI state (réduit pour production)
  useEffect(() => {
    if (midiInput.isConnected) {
      console.log('[pianorollBase] ✅ MIDI connecté:', midiInput.deviceName);
    }
  }, [midiInput.isConnected, midiInput.deviceName]);

  // Setup pour l'enregistrement en temps réel en boucle
  useEffect(() => {
    if (midiInput.isConnected) {
      // Configuration d'un callback pour recevoir les notes MIDI en temps réel
      const callbacks = {
        onNoteRecorded: (note: any) => {
          // Si on est en train d'enregistrer ET que la lecture est active
          if (midiInput.isRecording && isPlaying) {
            // Calculer la position actuelle dans la boucle
            const loopPosition = currentStep % stepCount;
            
            // Créer la note event immédiatement
            const noteEvent: NoteEvent = {
              step: loopPosition,
              note: note.note,
              velocity: note.velocity,
              duration: 1, // Durée par défaut
              isActive: true
            };

            // Ajouter directement au pattern sans attendre
            setPattern(prevPattern => {
              const newPattern = [...prevPattern];
              const existingIndex = newPattern.findIndex(
                n => n.step === loopPosition && n.note === note.note && n.isActive
              );

              if (existingIndex >= 0) {
                // Remplacer la note existante
                newPattern[existingIndex] = noteEvent;
              } else {
                // Ajouter la nouvelle note
                newPattern.push(noteEvent);
              }
              
              console.log(`[Piano Roll Base - Enregistrement temps réel] Note ${note.note} ajoutée au step ${loopPosition}`);
              return newPattern;
            });
          }
        },
        onPlaythrough: (note: string, velocity: number, isNoteOn: boolean) => {
          if (midiInput.playthroughEnabled) {
            // Playthrough audio normal - déjà géré par le hook
          }
        }
      };
      
      // Appliquer les callbacks via le contexte global
      globalMidiInput.setCallbacks(callbacks);
    }
  }, [midiInput.isConnected, midiInput.isRecording, isPlaying, currentStep, stepCount, globalMidiInput]);

  // Undo/Redo manager
  const [undoRedoManager] = useState(() => new UndoRedoManager());
  const [historyInfo, setHistoryInfo] = useState<{
    canUndo: boolean;
    canRedo: boolean;
    currentIndex: number;
    historySize: number;
    undoAction?: string;
    redoAction?: string;
  }>({
    canUndo: false,
    canRedo: false,
    currentIndex: 0,
    historySize: 1,
    undoAction: undefined,
    redoAction: undefined
  });

  // === HELPER FUNCTIONS (identiques à la version complète) ===
  const parseNoteId = (noteId: NoteId): { step: number; note: string } => {
    const [stepStr, note] = noteId.split('-');
    return { step: parseInt(stepStr), note };
  };

  const isNoteSelected = (step: number, note: string): boolean => {
    return selectedNotes.has(createNoteId(step, note));
  };

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
    if (steps <= 16) return 'w-12 sm:w-14';
    if (steps <= 32) return 'w-8 sm:w-10';
    return 'w-6 sm:w-8';
  };

  const cellWidth = getCellWidth(stepCount);

  // Calcul des steps d'accents basé sur le nombre de steps
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

  // Convert visual pattern to audio pattern
  const convertToAudioPattern = (visualPattern: NoteEvent[]): SimplePattern => {
    const audioPattern: SimplePattern = {};
    
    ALL_NOTES.forEach(note => {
      audioPattern[note] = Array(stepCount).fill(null).map(() => ({ on: false, velocity: 0 }));
    });
    
    visualPattern.forEach(noteEvent => {
      if (audioPattern[noteEvent.note]) {
        if (audioPattern[noteEvent.note][noteEvent.step]) {
          audioPattern[noteEvent.note][noteEvent.step] = {
            on: true,
            velocity: noteEvent.velocity / 127,
            duration: noteEvent.duration
          };
        }
        
        // Marquer les steps intermédiaires comme "sustain"
        for (let i = 1; i < noteEvent.duration; i++) {
          const sustainStep = noteEvent.step + i;
          if (sustainStep < stepCount && audioPattern[noteEvent.note][sustainStep]) {
            audioPattern[noteEvent.note][sustainStep] = {
              on: false,
              velocity: 0,
              duration: 0
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

  // === FONCTIONS DE BASE POUR PIANO ROLL ===
  const toggleNote = (step: number, note: string, isCtrlClick: boolean = false) => {
    const noteId = createNoteId(step, note);
    
    if (isCtrlClick) {
      setSelectedNotes(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(noteId)) {
          newSelection.delete(noteId);
        } else {
          newSelection.add(noteId);
        }
        return newSelection;
      });
      return;
    }
    
    setPattern(prev => {
      const existingNote = prev.find(n => n.step === step && n.note === note);
      
      let newPattern;
      let action;
      
      if (existingNote) {
        setSelectedNotes(prev => {
          const newSelection = new Set(prev);
          newSelection.delete(noteId);
          return newSelection;
        });
        newPattern = prev.filter(n => !(n.step === step && n.note === note));
        action = `Supprimer note ${note}`;
      } else {
        if (step < stepCount) {
          newPattern = [...prev, {
            step,
            note,
            velocity: 100,
            isActive: true,
            duration: 1
          }];
          action = `Ajouter note ${note}`;
        } else {
          return prev;
        }
      }
      
      setTimeout(() => saveToHistory(action), 0);
      return newPattern;
    });
  };

  // Vérifier si un step fait partie d'une note longue
  const isPartOfNote = (step: number, note: string): { isStart: boolean; isMiddle: boolean; isEnd: boolean; noteEvent: NoteEvent | null } => {
    const directNote = pattern.find(n => n.step === step && n.note === note);
    if (directNote) {
      return {
        isStart: true,
        isMiddle: false,
        isEnd: directNote.duration === 1,
        noteEvent: directNote
      };
    }
    
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

  // Récupérer la vélocité d'une note
  const getNoteVelocity = (step: number, note: string): number => {
    const noteInfo = isPartOfNote(step, note);
    
    if (!noteInfo.noteEvent) return 100;
    
    if (dragState?.isDragging && dragState.step === noteInfo.noteEvent.step && dragState.note === note) {
      return dragState.currentVelocity;
    }
    
    return noteInfo.noteEvent.velocity;
  };

  // === FONCTIONS DRAG & DROP (implémentation complète) ===
  // Gestion du drag pour éditer la vélocité (souris) - fonctionne sur toute la note longue
  const handleMouseDown = (step: number, note: string, e: React.MouseEvent) => {
    const noteInfo = isPartOfNote(step, note);
    if (noteInfo.noteEvent) {
      e.preventDefault();
      e.stopPropagation();
      
      // Utiliser les données de la note principale
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
      
      saveToHistory(`Vélocité ${dragState.note} ajustée à ${dragState.currentVelocity}`);
      setDragState(null);
    }
  };

  const handleCellMouseEnter = (step: number, note: string) => {
    setMousePosition({ step, note });
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

  // === FONCTIONS DE SÉLECTION MULTIPLE PAR RECTANGLE ===
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartPos, setSelectionStartPos] = useState<{ x: number; y: number } | null>(null);

  const handleGridMouseDown = (e: React.MouseEvent) => {
    // Ignorer si on est déjà en train de drag ou resize
    if (dragState?.isDragging || resizeState?.isResizing) return;
    
    // Seulement pour les clics gauches et sans Ctrl (Ctrl est pour la sélection individuelle)
    if (e.button !== 0 || e.ctrlKey || e.metaKey) return;
    
    // Empêcher la sélection seulement si on clique directement sur une note active
    const target = e.target as HTMLElement;
    const isOnActiveNote = target.closest('[class*="bg-green-"], [class*="bg-red-"], [class*="bg-orange-"], [class*="bg-yellow-"]');
    
    if (!isOnActiveNote) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      console.log('🖱️ Début sélection rectangle à:', { x, y });
      
      setIsSelecting(true);
      setSelectionStartPos({ x, y });
      setSelectionRect({
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        isSelecting: true
      });
      
      // Désélectionner toutes les notes si on commence une nouvelle sélection
      if (!e.shiftKey) {
        setSelectedNotes(new Set());
      }
      
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleGridMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStartPos || !selectionRect) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelectionRect(prev => prev ? {
      ...prev,
      endX: x,
      endY: y
    } : null);
    
    // Debug - voir le rectangle en temps réel
    console.log('🖱️ Sélection en cours:', {
      startX: selectionRect.startX,
      startY: selectionRect.startY,
      endX: x,
      endY: y,
      width: Math.abs(x - selectionRect.startX),
      height: Math.abs(y - selectionRect.startY)
    });
  };

  const handleGridMouseUp = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionRect) return;
    
    setIsSelecting(false);
    setSelectionStartPos(null);
    
    // Calculer les notes dans le rectangle de sélection
    const left = Math.min(selectionRect.startX, selectionRect.endX);
    const right = Math.max(selectionRect.startX, selectionRect.endX);
    const top = Math.min(selectionRect.startY, selectionRect.endY);
    const bottom = Math.max(selectionRect.startY, selectionRect.endY);
    
    // Dimensions approximatives des cellules
    const cellWidthPx = stepCount <= 16 ? 56 : stepCount <= 32 ? 40 : 32;
    const cellHeightPx = 32;
    
    // Trouver les notes dans le rectangle
    const selectedIds = new Set<string>();
    const newSelection = e.shiftKey ? new Set(selectedNotes) : new Set<string>();
    
    pattern.forEach(note => {
      if (!note.isActive) return;
      
      const noteIndex = visibleNotes.indexOf(note.note);
      if (noteIndex === -1) return;
      
      const noteX = note.step * cellWidthPx;
      const noteY = noteIndex * cellHeightPx;
      
      // Vérifier si la note chevauche avec le rectangle (intersection)
      // La note est sélectionnée si elle touche le rectangle, même partiellement
      const noteRight = noteX + cellWidthPx;
      const noteBottom = noteY + cellHeightPx;
      
      const hasIntersection = !(noteRight < left || noteX > right || noteBottom < top || noteY > bottom);
      
      if (hasIntersection) {
        const noteId = createNoteId(note.step, note.note);
        selectedIds.add(noteId);
        newSelection.add(noteId);
      }
    });
    
    setSelectedNotes(newSelection);
    setSelectionRect(null);
    
    console.log('🖱️ Fin sélection rectangle:', {
      selectedCount: selectedIds.size,
      rectangle: { left, right, top, bottom },
      cellDimensions: { cellWidthPx, cellHeightPx }
    });
    
    if (selectedIds.size > 0) {
      setExportStatus(`⚈ ${selectedIds.size} note(s) sélectionnée(s) par rectangle`);
      setTimeout(() => setExportStatus(''), 2000);
    }
  };

  // === FONCTIONS TRANSPORT ===
  const handleClearPattern = () => {
    if (confirm('Effacer tout le pattern ?')) {
      saveToHistory('Clear pattern');
      setPattern([]);
      setSelectedNotes(new Set());
      setExportStatus('✅ Pattern effacé');
      setTimeout(() => setExportStatus(''), 2000);
    }
  };

  // Gestion du recording MIDI avec synchronisation lecture
  const handleMidiRecordingStart = () => {
    if (midiInput.recordEnabled && !midiInput.isRecording) {
      // Démarrer l'enregistrement ET la lecture simultanément
      midiInput.startRecording();
      if (isInitialized && !isPlaying) {
        start();
        setExportStatus('🔴 Enregistrement + lecture démarrés');
      }
    }
  };

  const handleMidiRecordingStop = () => {
    if (midiInput.isRecording) {
      // Arrêter la lecture ET l'enregistrement
      stop();
      
      // Vider le buffer des notes enregistrées (pour éviter le doublement)
      midiInput.stopRecording();
      
      // Les notes ont déjà été ajoutées en temps réel via le callback onNoteRecorded
      // Donc on ne fait que sauvegarder l'historique
      saveToHistory('MIDI Recording temps réel');
      setExportStatus('⏹️ Enregistrement arrêté - notes ajoutées en temps réel');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const convertToMidiNotes = (): MidiNote[] => {
    return pattern.filter(note => note.isActive).map(note => ({
      step: note.step,
      note: note.note,
      velocity: note.velocity,
      duration: note.duration,
      isActive: note.isActive
    }));
  };

  const handleExportMidi = async () => {
    try {
      setExportStatus('Export en cours...');
      
      const midiNotes = convertToMidiNotes();
      
      if (midiNotes.length === 0) {
        setExportStatus('❌ Aucune note active à exporter');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }

      const result = midiEngine.exportToMidi(midiNotes, {
        tempo: tempo,
        timeSignature: [4, 4]
      });

      if (result.success && result.data && result.filename) {
        midiEngine.downloadMidiFile(result);
        const info = midiEngine.getMidiInfo(midiNotes);
        setExportStatus(
          `✅ Export réussi! ${info.activeNotes} notes → ${result.filename}`
        );
        setTimeout(() => setExportStatus(''), 5000);
      } else {
        setExportStatus(`❌ Erreur: ${result.error}`);
        setTimeout(() => setExportStatus(''), 3000);
      }
    } catch (error) {
      setExportStatus(`❌ Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const handleMidiFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setMidiImportStatus('Import en cours...');
      
      const result = await MidiParser.parseMidiFile(file);
      
      if (result.success && result.notes) {
        // Valider le nombre de notes
        if (result.notes.length > 64) {
          const confirmed = confirm(`Le fichier contient ${result.notes.length} notes. Voulez-vous continuer avec les 64 premières notes ?`);
          if (!confirmed) {
            setMidiImportStatus('');
            event.target.value = '';
            return;
          }
        }
        
        // Convertir et charger les notes
        const importedNotes: NoteEvent[] = result.notes.slice(0, 64).map(note => ({
          step: note.step,
          note: note.note,
          velocity: note.velocity,
          isActive: true,
          duration: note.duration || 1
        }));
        
        setPattern(importedNotes);
        setSelectedNotes(new Set());
        saveToHistory(`Import MIDI: ${importedNotes.length} notes`);
        
        setMidiImportStatus(`✅ Import réussi! ${importedNotes.length} notes chargées`);
        setTimeout(() => setMidiImportStatus(''), 5000);
      } else {
        setMidiImportStatus(`❌ Erreur: ${result.error}`);
        setTimeout(() => setMidiImportStatus(''), 3000);
      }
    } catch (error) {
      setMidiImportStatus(`❌ Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`);
      setTimeout(() => setMidiImportStatus(''), 3000);
    }

    event.target.value = '';
  };

  // === FONCTIONS PRESETS (simplifiées) ===
  const loadPresets = () => {
    const allPresets = PresetManager.getAllPresets();
    setPresets(allPresets.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Veuillez entrer un nom pour le preset');
      return;
    }

    const activeNotes = pattern.filter(note => note.isActive);
    if (activeNotes.length === 0) {
      alert('Créez d\'abord des notes avant de sauvegarder');
      return;
    }

    const preset = PresetManager.savePreset(
      presetName,
      stepCount,
      activeNotes,
      { 
        bpm: tempo,
        description: `Preset avec ${activeNotes.length} notes`
      }
    );

    setPresets(prev => [preset, ...prev]);
    setPresetName('');
    setShowPresetDialog(false);
    setExportStatus(`✅ Preset "${preset.name}" sauvegardé`);
    setTimeout(() => setExportStatus(''), 3000);
  };

  const handleImportPresetFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const importedPresets = await PresetManager.importMultiplePresets(file);
    if (importedPresets.length > 0) {
      loadPresets();
      setExportStatus(`✅ ${importedPresets.length} preset(s) importé(s)`);
      setTimeout(() => setExportStatus(''), 3000);
    } else {
      setExportStatus('❌ Erreur lors de l\'import du fichier');
      setTimeout(() => setExportStatus(''), 3000);
    }

    event.target.value = '';
  };

  // === FONCTIONS UNDO/REDO ===
  const updateHistoryInfo = () => {
    setHistoryInfo(undoRedoManager.getHistoryInfo());
  };

  const saveToHistory = (action: string) => {
    undoRedoManager.saveStateIfDifferent(pattern, stepCount, action);
    updateHistoryInfo();
  };

  const handleUndo = () => {
    const previousState = undoRedoManager.undo();
    if (previousState) {
      setPattern(previousState.pattern);
      setStepCount(previousState.stepCount);
      setSelectedNotes(new Set());
      updateHistoryInfo();
      setExportStatus(`↶ Undo: ${previousState.action || 'Action précédente'}`);
      setTimeout(() => setExportStatus(''), 2000);
    }
  };

  const handleRedo = () => {
    const nextState = undoRedoManager.redo();
    if (nextState) {
      setPattern(nextState.pattern);
      setStepCount(nextState.stepCount);
      setSelectedNotes(new Set());
      updateHistoryInfo();
      setExportStatus(`↷ Redo: ${nextState.action || 'Action suivante'}`);
      setTimeout(() => setExportStatus(''), 2000);
    }
  };

  // === FONCTIONS COPIER/COLLER ===
  const handleCopySelectedNotes = () => {
    const selectedNotesArray = getSelectedNotes(pattern, selectedNotes);
    if (selectedNotesArray.length === 0) return;
    
    const clipboardData = createClipboardData(selectedNotesArray, visibleNotes);
    setClipboard(clipboardData);
    setExportStatus(`📋 ${selectedNotesArray.length} note(s) copiée(s)`);
    setTimeout(() => setExportStatus(''), 2000);
  };

  const handlePasteNotes = () => {
    if (!clipboard || clipboard.notes.length === 0) return;
    
    // Utiliser la position de la souris si disponible, sinon le centre
    const targetStep = mousePosition?.step ?? Math.floor(stepCount / 2);
    const targetNote = mousePosition?.note ?? visibleNotes[Math.floor(visibleNotes.length / 2)];
    const targetNoteIndex = visibleNotes.indexOf(targetNote);
    
    if (targetNoteIndex === -1) return;
    
    const newPattern = pasteNotesFromClipboard(
      pattern,
      clipboard,
      targetStep,
      targetNoteIndex,
      visibleNotes,
      stepCount
    );
    
    setPattern(newPattern);
    saveToHistory(`↲ Coller ${clipboard.notes.length} note(s)`);
    setExportStatus(`↲ ${clipboard.notes.length} note(s) collée(s)`);
    setTimeout(() => setExportStatus(''), 2000);
  };

  const handleSelectAllNotes = () => {
    const allSelected = selectAllNotes(pattern);
    setSelectedNotes(allSelected);
    setExportStatus(`⚈ ${allSelected.size} note(s) sélectionnée(s)`);
    setTimeout(() => setExportStatus(''), 2000);
  };

  const handleDeselectAllNotes = () => {
    setSelectedNotes(new Set());
    setExportStatus(`○ Désélection`);
    setTimeout(() => setExportStatus(''), 1000);
  };

  const handleDeleteSelectedNotes = () => {
    if (selectedNotes.size === 0) return;
    
    const newPattern = pattern.filter(note => {
      const noteId = createNoteId(note.step, note.note);
      return !selectedNotes.has(noteId);
    });
    
    const deletedCount = selectedNotes.size;
    setPattern(newPattern);
    setSelectedNotes(new Set());
    saveToHistory(`🗑 Supprimer ${deletedCount} note(s)`);
    setExportStatus(`🗑 ${deletedCount} note(s) supprimée(s)`);
    setTimeout(() => setExportStatus(''), 2000);
  };

  const handleMoveSelectedNotes = (stepDelta: number, noteDelta: number) => {
    if (selectedNotes.size === 0) return;
    
    const result = moveSelectedNotes(
      pattern,
      selectedNotes,
      stepDelta,
      noteDelta,
      visibleNotes,
      stepCount
    );
    
    setPattern(result.newPattern);
    setSelectedNotes(result.newSelection);
    
    const direction = stepDelta > 0 ? '→' : stepDelta < 0 ? '←' : (noteDelta > 0 ? '↓' : '↑');
    saveToHistory(`${direction} Déplacer ${selectedNotes.size} note(s)`);
  };

  // === EFFECTS ===
  useEffect(() => {
    loadPresets();
    // Initialiser l'audio engine automatiquement
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (pattern.length === 0) {
      undoRedoManager.saveState([], stepCount, 'État initial');
      updateHistoryInfo();
    }
  }, []);

  useEffect(() => {
    setAudioTempo(tempo);
  }, [tempo, setAudioTempo]);

  // Nettoyer le pattern quand on change le nombre de steps
  useEffect(() => {
    setPattern(prev => prev.filter(note => note.step < stepCount));
  }, [stepCount]);

  // Gestion globale des événements pour le drag (souris + tactile) + sélection
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragState?.isDragging) {
        const deltaY = dragState.startY - e.clientY;
        const sensitivity = 2;
        const newVelocity = Math.max(1, Math.min(127, dragState.startVelocity + Math.round(deltaY / sensitivity)));
        
        setDragState(prev => prev ? { ...prev, currentVelocity: newVelocity } : null);
      }
      
      if (resizeState?.isResizing) {
        const deltaX = e.clientX - resizeState.startX;
        const cellWidthPx = stepCount <= 16 ? 56 : stepCount <= 32 ? 40 : 32; // Approximation
        const stepDelta = Math.round(deltaX / cellWidthPx);
        const newDuration = Math.max(1, Math.min(stepCount - resizeState.step, resizeState.startDuration + stepDelta));
        
        setResizeState(prev => prev ? { ...prev, currentDuration: newDuration } : null);
      }

      // Gestion du rectangle de sélection global
      if (isSelecting && selectionRect) {
        // Note: Pour la sélection globale, on garde la logique dans handleGridMouseMove
        // car on a besoin de la position relative au conteneur de grille
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
        
        saveToHistory(`Vélocité ${dragState.note} ajustée à ${dragState.currentVelocity}`);
        setDragState(null);
      }
      
      if (resizeState?.isResizing) {
        // Sauvegarder la nouvelle durée
        setPattern(prev => prev.map(n => 
          n.step === resizeState.step && n.note === resizeState.note
            ? { ...n, duration: resizeState.currentDuration }
            : n
        ));
        
        saveToHistory(`Durée ${resizeState.note} ajustée à ${resizeState.currentDuration}`);
        setResizeState(null);
      }

      // Terminer la sélection si elle est en cours
      if (isSelecting) {
        setIsSelecting(false);
        setSelectionStartPos(null);
        setSelectionRect(null);
      }
    };
    
    if (dragState?.isDragging || resizeState?.isResizing || isSelecting) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchend', handleGlobalEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('mouseup', handleGlobalEnd);
        document.removeEventListener('touchend', handleGlobalEnd);
      };
    }
  }, [dragState, resizeState, stepCount, isSelecting, selectionRect]);

  // === RACCOURCIS CLAVIER ===
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input/textarea
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Combinaisons avec Ctrl
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey && historyInfo.canRedo) {
              e.preventDefault();
              handleRedo();
            } else if (!e.shiftKey && historyInfo.canUndo) {
              e.preventDefault();
              handleUndo();
            }
            break;
            
          case 'y':
            if (historyInfo.canRedo) {
              e.preventDefault();
              handleRedo();
            }
            break;
            
          case 'a':
            e.preventDefault();
            handleSelectAllNotes();
            break;
            
          case 'c':
            if (selectedNotes.size > 0) {
              e.preventDefault();
              handleCopySelectedNotes();
            }
            break;
            
          case 'v':
            e.preventDefault();
            handlePasteNotes();
            break;
            
          case 'n':
            e.preventDefault();
            handleClearPattern();
            break;
        }
        return;
      }
      
      // Touches simples
      switch (e.key) {
        case ' ': // Espace
          e.preventDefault();
          if (isPlaying) {
            stop();
          } else if (isInitialized) {
            start();
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          handleDeselectAllNotes();
          break;
          
        case 'Delete':
        case 'Backspace':
          if (selectedNotes.size > 0) {
            e.preventDefault();
            handleDeleteSelectedNotes();
          }
          break;
          
        // Navigation avec les flèches
        case 'ArrowUp':
          if (selectedNotes.size > 0) {
            e.preventDefault();
            handleMoveSelectedNotes(0, e.shiftKey ? -12 : -1); // Octave si Shift
          }
          break;
          
        case 'ArrowDown':
          if (selectedNotes.size > 0) {
            e.preventDefault();
            handleMoveSelectedNotes(0, e.shiftKey ? 12 : 1); // Octave si Shift
          }
          break;
          
        case 'ArrowLeft':
          if (selectedNotes.size > 0) {
            e.preventDefault();
            handleMoveSelectedNotes(e.shiftKey ? -4 : -1, 0); // 4 steps si Shift
          }
          break;
          
        case 'ArrowRight':
          if (selectedNotes.size > 0) {
            e.preventDefault();
            handleMoveSelectedNotes(e.shiftKey ? 4 : 1, 0); // 4 steps si Shift
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNotes, clipboard, stepCount, pattern, isPlaying, isInitialized, historyInfo]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎹 Piano Roll Base - Mode Principal + MIDI Recording
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">Mode principal avec architecture modulaire + enregistrement MIDI temps réel</p>
        </div>

        {/* Barre de status MIDI avec recording personnalisé */}
        <div className="bg-gray-900 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            {/* Status MIDI */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  midiInput.isConnected ? 'bg-green-500' : 'bg-gray-500'
                }`} />
                <span className="text-gray-300">MIDI Input:</span>
                <span className={midiInput.isConnected ? 'text-green-400' : 'text-gray-400'}>
                  {midiInput.isConnected ? midiInput.deviceName : 'Déconnecté'}
                </span>
              </div>

              {midiInput.isConnected && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">Playthrough:</span>
                    <span className={midiInput.playthroughEnabled ? 'text-green-400' : 'text-gray-400'}>
                      {midiInput.playthroughEnabled ? '🔊' : '🔇'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">Recording:</span>
                    <span className={midiInput.recordEnabled ? 'text-orange-400' : 'text-gray-400'}>
                      {midiInput.recordEnabled ? (midiInput.isRecording ? '🔴' : '⚪') : '⭕'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Contrôles */}
            <div className="flex items-center gap-2">
              {/* Toggle Recording - TOUJOURS visible quand MIDI connecté */}
              {midiInput.isConnected && (
                <button
                  onClick={() => {
                    globalMidiInput.setRecordEnabled(!midiInput.recordEnabled);
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    midiInput.recordEnabled
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                  }`}
                  title={`${midiInput.recordEnabled ? 'Désactiver' : 'Activer'} l'enregistrement MIDI`}
                >
                  {midiInput.recordEnabled ? '⏺️ ARM' : '⭕ ARM'}
                </button>
              )}

              {/* Bouton Record/Stop - visible seulement si ARM activé */}
              {midiInput.isConnected && midiInput.recordEnabled && (
                <button
                  onClick={midiInput.isRecording ? handleMidiRecordingStop : handleMidiRecordingStart}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    midiInput.isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title={midiInput.isRecording ? 'Arrêter enregistrement + lecture' : 'Démarrer enregistrement + lecture'}
                >
                  {midiInput.isRecording ? '⏹️ Stop' : '⏺️ Rec'}
                </button>
              )}

              {/* Panic */}
              {midiInput.isConnected && (
                <button
                  onClick={midiInput.panic}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                >
                  🛑 panic
                </button>
              )}

              {/* Config */}
              <button
                onClick={() => window.open('/configuration', '_blank')}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
              >
                ⚙️ Config
              </button>
            </div>
          </div>
        </div>

        {/* COMPOSANT TRANSPORT CONTROLS */}
        <TransportControls
          // Transport state
          isPlaying={isPlaying}
          isInitialized={isInitialized}
          currentStep={currentStep}
          
          // Pattern info
          stepCount={stepCount}
          patternLength={0}
          activeNotesCount={pattern.filter(n => n.isActive).length}
          selectedNotesCount={selectedNotes.size}
          
          // Audio settings
          tempo={tempo}
          noteSpeed={noteSpeed}
          
          // Status messages
          exportStatus={exportStatus}
          midiImportStatus={midiImportStatus}
          isDragOver={isDragOver}
          
          // Presets state
          presets={presets}
          showPresetDialog={showPresetDialog}
          showLoadDialog={showLoadDialog}
          presetName={presetName}
          
          // Undo/Redo state
          historyInfo={historyInfo}
          
          // Actions
          start={start}
          stop={stop}
          onStepCountChange={setStepCount}
          setTempo={setTempo}
          setNoteSpeed={setNoteSpeed}
          handleExportMidi={handleExportMidi}
          handleMidiFileSelect={handleMidiFileSelect}
          showMidiOutputDialog={showMidiOutputDialog}
          setShowMidiOutputDialog={setShowMidiOutputDialog}
          onMidiCallback={setMidiCallback}
          isAudioEnabled={isAudioEnabled}
          onAudioEnabledChange={setAudioEnabled}
          setShowPresetDialog={setShowPresetDialog}
          setShowLoadDialog={setShowLoadDialog}
          setPresetName={setPresetName}
          handleSavePreset={handleSavePreset}
          handleImportPresetFile={handleImportPresetFile}
          handleClearPattern={handleClearPattern}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          handleCopySelectedNotes={handleCopySelectedNotes}
          handlePasteNotes={handlePasteNotes}
          handleSelectAllNotes={handleSelectAllNotes}
          handleDeselectAllNotes={handleDeselectAllNotes}
          handleDeleteSelectedNotes={handleDeleteSelectedNotes}
          stepOptions={STEP_OPTIONS}
        />

        {/* Piano Roll Container */}
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

              {/* COMPOSANT PIANO GRID COMPLETE */}
              <PianoGridComplete
                // Pattern data
                pattern={pattern}
                visibleNotes={visibleNotes}
                stepCount={stepCount}
                accentSteps={accentSteps}
                cellWidth={cellWidth}
                
                // Playback state
                currentStep={currentStep}
                isPlaying={isPlaying}
                
                // Interaction states
                dragState={dragState}
                resizeState={resizeState}
                selectedNotes={selectedNotes}
                selectionRect={selectionRect}
                
                // Helper functions
                isPartOfNote={isPartOfNote}
                getNoteVelocity={getNoteVelocity}
                isNoteSelected={isNoteSelected}
                createNoteId={createNoteId}
                
                // Event handlers
                toggleNote={toggleNote}
                handleMouseDown={handleMouseDown}
                handleTouchStart={handleTouchStart}
                handleMouseMove={handleMouseMove}
                handleMouseUp={handleMouseUp}
                handleCellMouseEnter={handleCellMouseEnter}
                handleResizeMouseDown={handleResizeMouseDown}
                
                // Selection handlers
                handleGridMouseDown={handleGridMouseDown}
                handleGridMouseMove={handleGridMouseMove}
                handleGridMouseUp={handleGridMouseUp}
              />
            </div>
          </div>
        </div>

        {/* Zone de test */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-800/50 to-green-700/50 backdrop-blur-sm rounded-2xl border border-green-600/50">
          <h2 className="text-lg font-bold mb-3 text-green-400">✅ Test Modulaire Complet</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button
              onClick={() => {
                const testNote: NoteEvent = {
                  step: 0,
                  note: 'C4',
                  velocity: 100,
                  isActive: true,
                  duration: 1
                };
                setPattern([testNote]);
                saveToHistory('Test note ajoutée');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              🎵 Ajouter note test
            </button>
            
            <button
              onClick={() => {
                const testNotes: NoteEvent[] = [
                  { step: 0, note: 'C4', velocity: 100, isActive: true, duration: 2 },
                  { step: 4, note: 'E4', velocity: 80, isActive: true, duration: 1 },
                  { step: 8, note: 'G4', velocity: 90, isActive: true, duration: 3 },
                ];
                setPattern(testNotes);
                saveToHistory('Pattern avec notes longues créé');
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              🎼 Pattern avec notes longues
            </button>

            <button
              onClick={() => {
                setPattern([]);
                setSelectedNotes(new Set());
                saveToHistory('Pattern vidé');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              🗑️ Vider pattern
            </button>
          </div>
          
          <div className="text-sm text-green-300 space-y-1">
            <p>• <strong>Composants modulaires</strong> : TransportControls + OctaveNavigation + StepHeader + PianoKeys + PianoGridComplete</p>
            <p>• <strong>Interactions</strong> : Click pour ajouter/supprimer notes, Ctrl+click pour sélection</p>
            <p>• <strong>Audio</strong> : Play/Stop, tempo, vitesses (l'initialisation se fera dans l'intégration finale)</p>
            <p>• <strong>Export/Import</strong> : MIDI + Presets + Undo/Redo complets</p>
          </div>
        </div>

        {/* Pattern Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
          <h3 className="text-lg font-bold mb-4 text-slate-200">📊 Pattern Info</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-700/50 rounded-xl">
              <div className="text-2xl font-bold text-blue-400">{stepCount}</div>
              <div className="text-sm text-slate-400">Steps</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-xl">
              <div className="text-2xl font-bold text-emerald-400">{pattern.length}</div>
              <div className="text-sm text-slate-400">Notes</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-xl">
              <div className="text-2xl font-bold text-purple-400">{tempo}</div>
              <div className="text-sm text-slate-400">BPM</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-xl">
              <div className="text-2xl font-bold text-amber-400">{accentSteps.length}</div>
              <div className="text-sm text-slate-400">Accents</div>
            </div>
            {selectedNotes.size > 0 && (
              <div className="text-center p-3 bg-slate-700/50 rounded-xl border border-yellow-500/50">
                <div className="text-2xl font-bold text-yellow-400">{selectedNotes.size}</div>
                <div className="text-sm text-slate-400">Sélectionnées</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs presets (simplifiés pour le test) */}
      {showPresetDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">💾 Sauvegarder Preset</h2>
            <input
              type="text"
              placeholder="Nom du preset..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-4">
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  presetName.trim()
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Sauvegarder
              </button>
              <button
                onClick={() => {
                  setShowPresetDialog(false);
                  setPresetName('');
                }}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">📁 Charger Preset</h2>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {presets.length === 0 ? (
                <div className="text-center text-slate-400 py-8">Aucun preset sauvegardé</div>
              ) : (
                presets.map(preset => (
                  <div
                    key={preset.id}
                    className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">{preset.name}</h3>
                      <div className="text-sm text-slate-300">
                        {preset.notes.length} notes
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPattern(preset.notes);
                          setStepCount(preset.steps);
                          setSelectedNotes(new Set());
                          setShowLoadDialog(false);
                          setExportStatus(`✅ Preset "${preset.name}" chargé`);
                          setTimeout(() => setExportStatus(''), 3000);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        📁 Charger
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer définitivement le preset "${preset.name}" ?`)) {
                            PresetManager.deletePreset(preset.id);
                            loadPresets(); // Recharger la liste
                            setExportStatus(`✅ Preset "${preset.name}" supprimé`);
                            setTimeout(() => setExportStatus(''), 3000);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                        title={`Supprimer le preset "${preset.name}"`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MIDI Output Panel - Rendu au niveau racine pour éviter conflits z-index */}
      <MidiOutputPanel
        isOpen={showMidiOutputDialog}
        onClose={() => setShowMidiOutputDialog(false)}
        onMidiCallback={setMidiCallback}
        isAudioEnabled={isAudioEnabled}
        onAudioEnabledChange={setAudioEnabled}
      />
    </div>
  );
};

export default PianoRollCompleteTestPage;