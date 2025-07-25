'use client';

import React, { useState, useEffect } from 'react';
import { useSimpleAudio } from '../../hooks/useSimpleAudio';
import { SimplePattern, SimpleStep } from '../../lib/SimpleAudioEngine';
import { midiEngine, MidiNote } from '../../lib/MidiEngine';
import { PresetManager } from '../../lib/PresetManager';
import { SequencerPreset } from '../../types';
import { MidiParser } from '../../lib/MidiParser';
import { UndoRedoManager } from '../../lib/UndoRedoManager';
import { 
  generateMusicalPattern, 
  generateAmbiancePattern, 
  getAvailableAmbiances, 
  getAmbianceInfo,
  GenerationParams,
  AMBIANCE_PRESETS,
  NOTE_ORDER,
  SCALES
} from '../../lib/InspirationEngine';

// Import des composants modulaires
import { TransportControls } from './components/TransportControls';
import { OctaveNavigation } from './components/OctaveNavigation';
import { PianoKeys } from './components/PianoKeys';
import { StepHeader } from './components/StepHeader';
import { PianoGridComplete } from './components/PianoGridComplete';

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

const InspirationPage: React.FC = () => {
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
  const [noteSpeed, setNoteSpeed] = useState<'8n' | '16n' | '32n'>('16n');
  const [visibleOctaveStart, setVisibleOctaveStart] = useState<number>(3);
  const [visibleOctaveCount] = useState<number>(3);

  // États des dialogs et messages
  const [exportStatus, setExportStatus] = useState<string>('');
  const [midiImportStatus, setMidiImportStatus] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<SequencerPreset[]>([]);

  // États pour la génération
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [generationParams, setGenerationParams] = useState<GenerationParams>({
    root: 'C',
    scale: 'minor',
    style: 'psy',
    part: 'bassline',
    mood: 'default',
    steps: 16,
    minOct: 2,
    maxOct: 4
  });
  const [selectedAmbiance, setSelectedAmbiance] = useState<string>('energique');

  // Audio engine
  const { 
    isPlaying, 
    isInitialized, 
    currentStep, 
    start, 
    stop, 
    setPattern: setAudioPattern, 
    setTempo: setAudioTempo,
    initialize 
  } = useSimpleAudio();

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

  // === FONCTIONS DE SÉLECTION (simplifiées pour le test) ===
  const handleGridMouseDown = (e: React.MouseEvent) => {
    console.log('Grid mouse down');
  };

  const handleGridMouseMove = (e: React.MouseEvent) => {
    console.log('Grid mouse move');
  };

  const handleGridMouseUp = (e: React.MouseEvent) => {
    console.log('Grid mouse up');
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

  // === FONCTIONS DE GÉNÉRATION ===
  const handleGeneratePattern = () => {
    try {
      const params = { ...generationParams, steps: stepCount };
      const generatedPattern = generateMusicalPattern(params);
      
      if (generatedPattern.length === 0) {
        setExportStatus('⚠️ Aucune note générée avec ces paramètres');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }
      
      setPattern(generatedPattern);
      setSelectedNotes(new Set());
      saveToHistory(`🎨 Pattern généré (${params.part}/${params.style})`);
      setExportStatus(`✨ Pattern généré! ${generatedPattern.length} notes (${params.part}/${params.style})`);
      setTimeout(() => setExportStatus(''), 4000);
      setShowGenerationDialog(false);
    } catch (error) {
      setExportStatus(`❌ Erreur génération: ${error instanceof Error ? error.message : 'Inconnue'}`);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const handleGenerateAmbiance = () => {
    try {
      const result = generateAmbiancePattern(selectedAmbiance, { steps: stepCount });
      
      if (result.pattern.length === 0) {
        setExportStatus('⚠️ Aucune note générée pour cette ambiance');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }
      
      setPattern(result.pattern);
      setSelectedNotes(new Set());
      
      // Appliquer le tempo suggéré
      if (result.ambiance?.suggestedTempo) {
        setTempo(result.ambiance.suggestedTempo);
      }
      
      saveToHistory(`🌟 Ambiance: ${result.ambiance?.name}`);
      setExportStatus(`🌟 "${result.ambiance?.name}" généré! ${result.pattern.length} notes @ ${result.ambiance?.suggestedTempo} BPM`);
      setTimeout(() => setExportStatus(''), 5000);
      setShowGenerationDialog(false);
    } catch (error) {
      setExportStatus(`❌ Erreur ambiance: ${error instanceof Error ? error.message : 'Inconnue'}`);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const handleAddGeneratedNotes = () => {
    try {
      const params = { ...generationParams, steps: stepCount };
      const generatedPattern = generateMusicalPattern(params);
      
      if (generatedPattern.length === 0) {
        setExportStatus('⚠️ Aucune note générée à ajouter');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }
      
      // Fusionner avec le pattern existant (éviter les doublons)
      const newPattern = [...pattern];
      let addedCount = 0;
      
      generatedPattern.forEach(newNote => {
        const exists = newPattern.some(n => n.step === newNote.step && n.note === newNote.note);
        if (!exists) {
          newPattern.push(newNote);
          addedCount++;
        }
      });
      
      setPattern(newPattern);
      setSelectedNotes(new Set());
      saveToHistory(`➕ Ajout pattern généré (+${addedCount})`);
      setExportStatus(`➕ ${addedCount} nouvelles notes ajoutées au pattern existant`);
      setTimeout(() => setExportStatus(''), 4000);
      setShowGenerationDialog(false);
    } catch (error) {
      setExportStatus(`❌ Erreur ajout: ${error instanceof Error ? error.message : 'Inconnue'}`);
      setTimeout(() => setExportStatus(''), 3000);
    }
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

  // Gestion globale des événements pour le drag (souris + tactile)
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
    };
    
    if (dragState?.isDragging || resizeState?.isResizing) {
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
  }, [dragState, resizeState, stepCount]);

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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎨 Inspiration - Générateur de Séquences
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">Piano Roll avec génération automatique de mélodies inspirées de la musique électronique</p>
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

        {/* Zone de génération */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-800/50 to-pink-700/50 backdrop-blur-sm rounded-2xl border border-purple-600/50">
          <h2 className="text-lg font-bold mb-3 text-purple-400">🎨 Génération Inspiration</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => setShowGenerationDialog(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              🎨 Générateur avancé
            </button>
            
            <button
              onClick={() => {
                try {
                  const result = generateAmbiancePattern('energique', { steps: stepCount });
                  setPattern(result.pattern);
                  setSelectedNotes(new Set());
                  if (result.ambiance?.suggestedTempo) setTempo(result.ambiance.suggestedTempo);
                  saveToHistory(`🌟 Ambiance: ${result.ambiance?.name}`);
                  setExportStatus(`⚡ Énergique généré! ${result.pattern.length} notes`);
                  setTimeout(() => setExportStatus(''), 3000);
                } catch (error) {
                  setExportStatus('❌ Erreur génération énergique');
                  setTimeout(() => setExportStatus(''), 2000);
                }
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              ⚡ Énergique (Goa/Psy)
            </button>

            <button
              onClick={() => {
                try {
                  const result = generateAmbiancePattern('mysterieux', { steps: stepCount });
                  setPattern(result.pattern);
                  setSelectedNotes(new Set());
                  if (result.ambiance?.suggestedTempo) setTempo(result.ambiance.suggestedTempo);
                  saveToHistory(`🌟 Ambiance: ${result.ambiance?.name}`);
                  setExportStatus(`🌙 Mystérieux généré! ${result.pattern.length} notes`);
                  setTimeout(() => setExportStatus(''), 3000);
                } catch (error) {
                  setExportStatus('❌ Erreur génération mystérieuse');
                  setTimeout(() => setExportStatus(''), 2000);
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              🌙 Mystérieux (Dark)
            </button>

            <button
              onClick={() => {
                try {
                  const params = { root: 'C', scale: 'minor', style: 'psy', part: 'hypnoticLead', steps: stepCount };
                  const generatedPattern = generateMusicalPattern(params);
                  setPattern(generatedPattern);
                  setSelectedNotes(new Set());
                  saveToHistory('🎵 Lead hypnotique généré');
                  setExportStatus(`🎵 Lead hypnotique! ${generatedPattern.length} notes`);
                  setTimeout(() => setExportStatus(''), 3000);
                } catch (error) {
                  setExportStatus('❌ Erreur génération lead');
                  setTimeout(() => setExportStatus(''), 2000);
                }
              }}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
            >
              🎵 Lead Hypnotique
            </button>
          </div>
          
          <div className="text-sm text-purple-300 space-y-1">
            <p>• <strong>Générateur avancé</strong> : Interface complète avec tous les paramètres</p>
            <p>• <strong>Ambiances rapides</strong> : Énergique (Goa/Psy), Mystérieux (Dark), Lead Hypnotique</p>
            <p>• <strong>Basé sur V1</strong> : Algorithmes de randomEngine.js adaptés pour TypeScript</p>
            <p>• <strong>Styles disponibles</strong> : Goa, Psy, Prog, Deep + Bassline, Lead, Pad, Arpège</p>
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

      {/* Dialog Génération Avancée */}
      {showGenerationDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎨 Générateur de Séquences Inspiration
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Colonne gauche : Paramètres manuels */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-purple-300 mb-4">⚙️ Paramètres Manuels</h3>
                
                {/* Root Note */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Note fondamentale</label>
                  <select
                    value={generationParams.root}
                    onChange={(e) => setGenerationParams(prev => ({...prev, root: e.target.value}))}
                    title="Sélectionner la note fondamentale"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                  >
                    {NOTE_ORDER.map(note => (
                      <option key={note} value={note}>{note}</option>
                    ))}
                  </select>
                </div>

                {/* Scale */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Gamme</label>
                  <select
                    value={generationParams.scale}
                    onChange={(e) => setGenerationParams(prev => ({...prev, scale: e.target.value}))}
                    title="Sélectionner la gamme musicale"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                  >
                    {Object.keys(SCALES).map(scale => (
                      <option key={scale} value={scale}>
                        {scale.charAt(0).toUpperCase() + scale.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Style</label>
                  <select
                    value={generationParams.style}
                    onChange={(e) => setGenerationParams(prev => ({...prev, style: e.target.value}))}
                    title="Sélectionner le style musical"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="goa">Goa (Variations subtiles)</option>
                    <option value="psy">Psy (Triplets, pondération)</option>
                    <option value="prog">Prog (Hooks fixes)</option>
                    <option value="deep">Deep (Downtempo)</option>
                  </select>
                </div>

                {/* Part */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type de pattern</label>
                  <select
                    value={generationParams.part}
                    onChange={(e) => setGenerationParams(prev => ({...prev, part: e.target.value}))}
                    title="Sélectionner le type de pattern"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="bassline">Bassline (Rythme bas)</option>
                    <option value="lead">Lead (Mélodie principale)</option>
                    <option value="hypnoticLead">Lead Hypnotique (Évolutif)</option>
                    <option value="pad">Pad (Notes tenues)</option>
                    <option value="arpeggio">Arpège (Montant/Descendant)</option>
                  </select>
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ambiance</label>
                  <select
                    value={generationParams.mood}
                    onChange={(e) => setGenerationParams(prev => ({...prev, mood: e.target.value}))}
                    title="Sélectionner l'ambiance du pattern"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="default">Par défaut</option>
                    <option value="dark">Sombre (-30 vélocité)</option>
                    <option value="uplifting">Énergique (+15 vélocité)</option>
                    <option value="dense">Dense (+30% notes)</option>
                  </select>
                </div>

                {/* Octaves */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Octave min</label>
                    <select
                      value={generationParams.minOct}
                      onChange={(e) => setGenerationParams(prev => ({...prev, minOct: parseInt(e.target.value)}))}
                      title="Sélectionner l'octave minimum"
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                    >
                      {[1,2,3,4,5].map(oct => (
                        <option key={oct} value={oct}>{oct}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Octave max</label>
                    <select
                      value={generationParams.maxOct}
                      onChange={(e) => setGenerationParams(prev => ({...prev, maxOct: parseInt(e.target.value)}))}
                      title="Sélectionner l'octave maximum"
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                    >
                      {[3,4,5,6,7].map(oct => (
                        <option key={oct} value={oct}>{oct}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Boutons génération manuelle */}
                <div className="space-y-3">
                  <button
                    onClick={handleGeneratePattern}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ✨ Générer avec ces paramètres
                  </button>
                  <button
                    onClick={handleAddGeneratedNotes}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ➕ Ajouter au pattern existant
                  </button>
                </div>
              </div>

              {/* Colonne droite : Ambiances prédéfinies */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-pink-300 mb-4">🌟 Ambiances Prédéfinies</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Choisir une ambiance</label>
                  <select
                    value={selectedAmbiance}
                    onChange={(e) => setSelectedAmbiance(e.target.value)}
                    title="Choisir une ambiance prédéfinie"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-pink-500 focus:outline-none mb-4"
                  >
                    {getAvailableAmbiances().map(ambiance => {
                      const info = getAmbianceInfo(ambiance);
                      return (
                        <option key={ambiance} value={ambiance}>
                          {info?.name} - {info?.description}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Affichage des détails de l'ambiance sélectionnée */}
                {(() => {
                  const ambianceInfo = getAmbianceInfo(selectedAmbiance);
                  if (!ambianceInfo) return null;
                  
                  return (
                    <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                      <h4 className="font-semibold text-pink-300 mb-2">{ambianceInfo.name}</h4>
                      <p className="text-slate-300 text-sm mb-3">{ambianceInfo.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div><strong>Gammes:</strong> {ambianceInfo.scales.join(', ')}</div>
                        <div><strong>Styles:</strong> {ambianceInfo.styles.join(', ')}</div>
                        <div><strong>Parties:</strong> {ambianceInfo.parts.join(', ')}</div>
                        <div><strong>Tempo:</strong> {ambianceInfo.tempoRange[0]}-{ambianceInfo.tempoRange[1]} BPM</div>
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={handleGenerateAmbiance}
                  className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  🌟 Générer cette ambiance
                </button>

                {/* Ambiances rapides */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">Génération rapide :</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {getAvailableAmbiances().slice(0, 6).map(ambiance => {
                      const info = getAmbianceInfo(ambiance);
                      const emoji = ambiance === 'energique' ? '⚡' : 
                                   ambiance === 'mysterieux' ? '🌙' : 
                                   ambiance === 'nostalgique' ? '🕯️' : 
                                   ambiance === 'tribal' ? '🥁' : 
                                   ambiance === 'cosmique' ? '🌌' : '🌀';
                      
                      return (
                        <button
                          key={ambiance}
                          onClick={() => {
                            setSelectedAmbiance(ambiance);
                            handleGenerateAmbiance();
                          }}
                          className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
                        >
                          {emoji} {info?.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons du bas */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowGenerationDialog(false)}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspirationPage;