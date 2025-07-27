/**
 * Hook principal qui orchestre tous les autres hooks du Piano Roll
 */

'use client';

import { useCallback } from 'react';
import { useSimpleAudio } from '../../../hooks/useSimpleAudio';

// Import des hooks spécialisés
import { usePianoRollState } from './usePianoRollState';
import { usePresets } from './usePresets';
import { useUndoRedo } from './useUndoRedo';
import { useMidiImportExport } from './useMidiImportExport';
import { useNoteEditing } from './useNoteEditing';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useMode } from './useMode';

// Import des utilitaires
import { convertPatternToAudioFormat } from '../utils/patternHelpers';
import { 
  getSelectedNotes, 
  createClipboardData, 
  pasteNotesFromClipboard, 
  moveSelectedNotes,
  selectAllNotes as selectAllNotesUtil
} from '../utils/selectionHelpers';
import { ALL_NOTES } from '../utils/constants';
import { createNoteId } from '../utils/noteHelpers';

export function usePianoRoll() {
  // Hooks spécialisés
  const state = usePianoRollState();
  const audio = useSimpleAudio();
  const presets = usePresets();
  const undoRedo = useUndoRedo();
  const midiImportExport = useMidiImportExport();
  const noteEditing = useNoteEditing();
  const mode = useMode('edition');

  // Actions principales combinées
  const playPattern = useCallback(async () => {
    const audioPattern = convertPatternToAudioFormat(state.pattern, state.stepCount);
    audio.setPattern(audioPattern);
    await audio.start();
  }, [state.pattern, state.stepCount, audio]);

  const stopPattern = useCallback(() => {
    audio.stop();
  }, [audio]);

  // Actions d'édition avec undo/redo
  const toggleNoteWithHistory = useCallback((step: number, note: string, velocity?: number) => {
    undoRedo.saveState(state.pattern, state.stepCount, `Toggle note ${note} at step ${step}`);
    const newPattern = noteEditing.toggleNote(state.pattern, step, note, velocity);
    state.setPattern(newPattern);
  }, [state.pattern, state.stepCount, state.setPattern, noteEditing, undoRedo]);

  const updateNoteVelocityWithHistory = useCallback((step: number, note: string, velocity: number) => {
    undoRedo.saveState(state.pattern, state.stepCount, `Update velocity ${note} at step ${step}`);
    const newPattern = noteEditing.updateNoteVelocity(state.pattern, step, note, velocity);
    state.setPattern(newPattern);
  }, [state.pattern, state.stepCount, state.setPattern, noteEditing, undoRedo]);

  const updateNoteDurationWithHistory = useCallback((step: number, note: string, duration: number) => {
    undoRedo.saveState(state.pattern, state.stepCount, `Update duration ${note} at step ${step}`);
    const newPattern = noteEditing.updateNoteDuration(state.pattern, step, note, duration);
    state.setPattern(newPattern);
  }, [state.pattern, state.stepCount, state.setPattern, noteEditing, undoRedo]);

  // Actions de sélection
  const selectAllNotes = useCallback(() => {
    const allSelected = selectAllNotesUtil(state.pattern);
    state.setSelectedNotes(allSelected);
  }, [state.pattern, state.setSelectedNotes]);

  const deselectAllNotes = useCallback(() => {
    state.setSelectedNotes(new Set());
    state.setSelectionRect(null);
  }, [state]);

  const copySelectedNotes = useCallback(() => {
    const selectedNotesData = getSelectedNotes(state.pattern, state.selectedNotes);
    const clipboardData = createClipboardData(selectedNotesData, ALL_NOTES);
    state.setClipboard(clipboardData);
  }, [state.pattern, state.selectedNotes, state.setClipboard]);

  const pasteNotes = useCallback(() => {
    if (!state.clipboard || !state.mousePosition) return;
    
    const targetNoteIndex = ALL_NOTES.findIndex(note => note === state.mousePosition!.note);
    if (targetNoteIndex === -1) return;

    undoRedo.saveState(state.pattern, state.stepCount, 'Paste notes');
    const newPattern = pasteNotesFromClipboard(
      state.pattern,
      state.clipboard,
      state.mousePosition.step,
      targetNoteIndex,
      ALL_NOTES,
      state.stepCount
    );
    state.setPattern(newPattern);
  }, [state, undoRedo]);

  const moveSelection = useCallback((stepDelta: number, noteDelta: number) => {
    if (state.selectedNotes.size === 0) return;

    undoRedo.saveState(state.pattern, state.stepCount, `Move ${state.selectedNotes.size} notes`);
    const { newPattern, newSelection } = moveSelectedNotes(
      state.pattern,
      state.selectedNotes,
      stepDelta,
      noteDelta,
      ALL_NOTES,
      state.stepCount
    );
    
    state.setPattern(newPattern);
    state.setSelectedNotes(newSelection);
  }, [state, undoRedo]);

  const deleteSelectedNotes = useCallback(() => {
    if (state.selectedNotes.size === 0) return;

    undoRedo.saveState(state.pattern, state.stepCount, `Delete ${state.selectedNotes.size} notes`);
    const newPattern = noteEditing.deleteSelectedNotes(state.pattern, state.selectedNotes);
    state.setPattern(newPattern);
    state.setSelectedNotes(new Set());
  }, [state, noteEditing, undoRedo]);

  // Actions d'undo/redo
  const performUndo = useCallback(() => {
    const restoredPattern = undoRedo.undo();
    if (restoredPattern) {
      state.setPattern(restoredPattern);
      state.setSelectedNotes(new Set()); // Vider la sélection après undo
    }
  }, [undoRedo, state]);

  const performRedo = useCallback(() => {
    const restoredPattern = undoRedo.redo();
    if (restoredPattern) {
      state.setPattern(restoredPattern);
      state.setSelectedNotes(new Set()); // Vider la sélection après redo
    }
  }, [undoRedo, state]);

  // Actions de presets
  const saveCurrentPreset = useCallback((name?: string) => {
    return presets.savePreset(state.pattern, state.stepCount, name);
  }, [presets, state.pattern, state.stepCount]);

  const loadPresetData = useCallback((presetId: string) => {
    const preset = presets.presets.find(p => p.id === presetId);
    if (preset) {
      undoRedo.saveState(state.pattern, state.stepCount, `Load preset: ${preset.name}`);
      const { pattern, steps } = presets.loadPreset(preset);
      state.setPattern(pattern);
      state.setStepCount(steps);
      state.setSelectedNotes(new Set());
    }
  }, [presets, state, undoRedo]);

  // Actions MIDI
  const exportToMidi = useCallback(() => {
    return midiImportExport.exportToMidi(state.pattern, state.stepCount, 120);
  }, [midiImportExport, state.pattern, state.stepCount]);

  const importFromMidi = useCallback((file: File) => {
    return midiImportExport.importFromMidi(file, state.stepCount).then(result => {
      if (result.success && result.pattern) {
        undoRedo.saveState(state.pattern, state.stepCount, 'Import MIDI');
        state.setPattern(result.pattern);
        state.setSelectedNotes(new Set());
      }
      return result;
    });
  }, [midiImportExport, state, undoRedo]);

  // Configuration des raccourcis clavier
  useKeyboardShortcuts({
    onPlay: playPattern,
    onStop: stopPattern,
    onUndo: performUndo,
    onRedo: performRedo,
    onSelectAll: selectAllNotes,
    onDeselectAll: deselectAllNotes,
    onCopy: copySelectedNotes,
    onPaste: pasteNotes,
    onDelete: deleteSelectedNotes,
    onClearPattern: () => {
      undoRedo.saveState(state.pattern, state.stepCount, 'Clear pattern');
      state.setPattern([]);
      state.setSelectedNotes(new Set());
    },
    onSavePreset: () => presets.setShowPresetDialog(true),
    onLoadPreset: () => presets.setShowLoadDialog(true),
    onExportMidi: () => exportToMidi().then(result => state.setExportStatus(result.message)),
    onMoveSelection: moveSelection,
    isPlaying: audio.isPlaying,
    hasSelection: state.selectedNotes.size > 0,
    canUndo: undoRedo.historyInfo.canUndo,
    canRedo: undoRedo.historyInfo.canRedo
  });

  return {
    // État
    ...state,
    
    // Audio
    audio,
    
    // Mode
    mode,
    
    // Presets
    presets,
    
    // Undo/Redo
    undoRedo,
    
    // Actions principales
    playPattern,
    stopPattern,
    
    // Actions d'édition
    toggleNote: toggleNoteWithHistory,
    updateNoteVelocity: updateNoteVelocityWithHistory,
    updateNoteDuration: updateNoteDurationWithHistory,
    
    // Actions de sélection
    selectAllNotes,
    deselectAllNotes,
    copySelectedNotes,
    pasteNotes,
    moveSelection,
    deleteSelectedNotes,
    
    // Actions d'historique
    performUndo,
    performRedo,
    
    // Actions de presets
    saveCurrentPreset,
    loadPresetData,
    
    // Actions MIDI
    exportToMidi,
    importFromMidi,
    
    // Utilitaires
    noteEditing,
    midiImportExport
  };
}