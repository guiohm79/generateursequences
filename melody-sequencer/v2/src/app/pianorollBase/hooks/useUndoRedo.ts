/**
 * Hook pour gérer l'undo/redo du Piano Roll
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { UndoRedoManager } from '../../../lib/UndoRedoManager';
import { NoteEvent } from '../types';

interface HistoryInfo {
  canUndo: boolean;
  canRedo: boolean;
  currentIndex: number;
  historySize: number;
  undoAction?: string;
  redoAction?: string;
}

export function useUndoRedo() {
  const undoRedoManagerRef = useRef(new UndoRedoManager());
  const [historyInfo, setHistoryInfo] = useState<HistoryInfo>(
    undoRedoManagerRef.current.getHistoryInfo()
  );

  // Mettre à jour les informations d'historique
  const updateHistoryInfo = useCallback(() => {
    const newInfo = undoRedoManagerRef.current.getHistoryInfo();
    setHistoryInfo(newInfo);
  }, []);

  // Sauvegarder l'état actuel
  const saveState = useCallback((
    pattern: NoteEvent[], 
    stepCount: number,
    action: string = 'Modification'
  ) => {
    undoRedoManagerRef.current.saveState(pattern, stepCount, action);
    updateHistoryInfo();
  }, [updateHistoryInfo]);

  // Annuler la dernière action
  const undo = useCallback((): NoteEvent[] | null => {
    const restoredState = undoRedoManagerRef.current.undo();
    updateHistoryInfo();
    return restoredState?.pattern || null;
  }, [updateHistoryInfo]);

  // Refaire la dernière action annulée
  const redo = useCallback((): NoteEvent[] | null => {
    const restoredState = undoRedoManagerRef.current.redo();
    updateHistoryInfo();
    return restoredState?.pattern || null;
  }, [updateHistoryInfo]);

  // Vider l'historique
  const clearHistory = useCallback(() => {
    undoRedoManagerRef.current.clear();
    updateHistoryInfo();
  }, [updateHistoryInfo]);

  // Obtenir l'état actuel pour le debug
  const getCurrentState = useCallback(() => {
    return undoRedoManagerRef.current.getCurrentState();
  }, []);

  // Obtenir les statistiques d'utilisation
  const getUsageStats = useCallback(() => {
    return {
      totalActions: historyInfo.historySize,
      currentIndex: historyInfo.currentIndex,
      historySize: historyInfo.historySize,
      undoAction: historyInfo.undoAction,
      redoAction: historyInfo.redoAction
    };
  }, [historyInfo]);

  return {
    // État
    historyInfo,
    
    // Actions principales
    saveState,
    undo,
    redo,
    
    // Actions utilitaires
    clearHistory,
    getCurrentState,
    getUsageStats,
    updateHistoryInfo,
    
    // Accès direct au manager si nécessaire
    undoRedoManager: undoRedoManagerRef.current
  };
}