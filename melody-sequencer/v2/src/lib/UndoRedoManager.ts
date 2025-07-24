/**
 * Système Undo/Redo pour le piano roll
 * Gère l'historique des états du pattern avec optimisation mémoire
 */

import { NoteEvent } from '../types';

const MAX_HISTORY_SIZE = 50; // Limite de l'historique

interface HistoryState {
  pattern: NoteEvent[];
  stepCount: number;
  timestamp: number;
  action?: string; // Description de l'action pour debug
}

export class UndoRedoManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private isUndoRedoOperation: boolean = false;

  /**
   * Sauvegarde l'état actuel dans l'historique
   */
  saveState(pattern: NoteEvent[], stepCount: number, action?: string): void {
    // Éviter de sauvegarder pendant une opération undo/redo
    if (this.isUndoRedoOperation) return;

    // Créer une copie profonde du pattern
    const stateCopy: HistoryState = {
      pattern: pattern.map(note => ({ ...note })),
      stepCount,
      timestamp: Date.now(),
      action
    };

    // Si on n'est pas à la fin de l'historique, supprimer les états suivants
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Ajouter le nouvel état
    this.history.push(stateCopy);
    this.currentIndex = this.history.length - 1;

    // Limiter la taille de l'historique
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history.shift();
      this.currentIndex--;
    }

    console.log(`UndoRedo: Saved state "${action}" (${this.currentIndex + 1}/${this.history.length})`);
  }

  /**
   * Annule la dernière action (Undo)
   */
  undo(): HistoryState | null {
    if (!this.canUndo()) return null;

    this.isUndoRedoOperation = true;
    this.currentIndex--;
    const state = this.history[this.currentIndex];
    
    console.log(`UndoRedo: Undo to "${state.action}" (${this.currentIndex + 1}/${this.history.length})`);
    
    // Reset flag après un délai pour permettre les re-renders
    setTimeout(() => {
      this.isUndoRedoOperation = false;
    }, 10);

    return {
      pattern: state.pattern.map(note => ({ ...note })),
      stepCount: state.stepCount,
      timestamp: state.timestamp,
      action: state.action
    };
  }

  /**
   * Refait la dernière action annulée (Redo)
   */
  redo(): HistoryState | null {
    if (!this.canRedo()) return null;

    this.isUndoRedoOperation = true;
    this.currentIndex++;
    const state = this.history[this.currentIndex];
    
    console.log(`UndoRedo: Redo to "${state.action}" (${this.currentIndex + 1}/${this.history.length})`);
    
    // Reset flag après un délai
    setTimeout(() => {
      this.isUndoRedoOperation = false;
    }, 10);

    return {
      pattern: state.pattern.map(note => ({ ...note })),
      stepCount: state.stepCount,
      timestamp: state.timestamp,
      action: state.action
    };
  }

  /**
   * Vérifie si Undo est possible
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Vérifie si Redo est possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Obtient des informations sur l'historique
   */
  getHistoryInfo(): {
    canUndo: boolean;
    canRedo: boolean;
    currentIndex: number;
    historySize: number;
    undoAction?: string;
    redoAction?: string;
  } {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.currentIndex,
      historySize: this.history.length,
      undoAction: this.canUndo() ? this.history[this.currentIndex - 1]?.action : undefined,
      redoAction: this.canRedo() ? this.history[this.currentIndex + 1]?.action : undefined
    };
  }

  /**
   * Vide l'historique
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.isUndoRedoOperation = false;
    console.log('UndoRedo: History cleared');
  }

  /**
   * Optimise l'historique en supprimant les anciens états
   */
  optimize(): void {
    if (this.history.length <= MAX_HISTORY_SIZE / 2) return;

    // Garder seulement la moitié des états les plus récents
    const keepCount = Math.floor(MAX_HISTORY_SIZE / 2);
    const removeCount = this.history.length - keepCount;
    
    this.history = this.history.slice(removeCount);
    this.currentIndex = Math.max(0, this.currentIndex - removeCount);
    
    console.log(`UndoRedo: Optimized history, removed ${removeCount} old states`);
  }

  /**
   * Obtient l'état actuel sans changer l'index
   */
  getCurrentState(): HistoryState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      const state = this.history[this.currentIndex];
      return {
        pattern: state.pattern.map(note => ({ ...note })),
        stepCount: state.stepCount,
        timestamp: state.timestamp,
        action: state.action
      };
    }
    return null;
  }

  /**
   * Vérifie si les patterns sont identiques (pour éviter les doublons)
   */
  static arePatternsSame(pattern1: NoteEvent[], pattern2: NoteEvent[]): boolean {
    if (pattern1.length !== pattern2.length) return false;
    
    for (let i = 0; i < pattern1.length; i++) {
      const note1 = pattern1[i];
      const note2 = pattern2[i];
      
      if (note1.step !== note2.step ||
          note1.note !== note2.note ||
          note1.velocity !== note2.velocity ||
          note1.isActive !== note2.isActive ||
          note1.duration !== note2.duration) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Sauvegarde conditionnelle (seulement si différent du dernier état)
   */
  saveStateIfDifferent(pattern: NoteEvent[], stepCount: number, action?: string): boolean {
    const lastState = this.getCurrentState();
    
    if (lastState && 
        lastState.stepCount === stepCount &&
        UndoRedoManager.arePatternsSame(lastState.pattern, pattern)) {
      return false; // Pas de changement
    }
    
    this.saveState(pattern, stepCount, action);
    return true;
  }
}