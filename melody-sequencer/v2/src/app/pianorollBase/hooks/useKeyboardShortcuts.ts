/**
 * Hook pour gérer les raccourcis clavier du Piano Roll
 */

'use client';

import { useEffect, useCallback } from 'react';
import { NoteEvent, NoteId } from '../types';

interface KeyboardShortcutsProps {
  // Actions principales
  onPlay?: () => void;
  onStop?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  
  // Actions de sélection
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  
  // Actions de pattern
  onClearPattern?: () => void;
  onSavePreset?: () => void;
  onLoadPreset?: () => void;
  onExportMidi?: () => void;
  
  // Navigation
  onMoveSelection?: (stepDelta: number, noteDelta: number) => void;
  
  // État
  isPlaying?: boolean;
  hasSelection?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function useKeyboardShortcuts({
  onPlay,
  onStop,
  onUndo,
  onRedo,
  onSelectAll,
  onDeselectAll,
  onCopy,
  onPaste,
  onDelete,
  onClearPattern,
  onSavePreset,
  onLoadPreset,
  onExportMidi,
  onMoveSelection,
  isPlaying = false,
  hasSelection = false,
  canUndo = false,
  canRedo = false
}: KeyboardShortcutsProps) {

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, shiftKey, altKey } = event;
    
    // Ignorer si on est dans un input/textarea
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    // Combinaisons avec Ctrl
    if (ctrlKey) {
      switch (key.toLowerCase()) {
        case 'z':
          if (shiftKey && canRedo && onRedo) {
            event.preventDefault();
            onRedo();
          } else if (!shiftKey && canUndo && onUndo) {
            event.preventDefault();
            onUndo();
          }
          break;
          
        case 'y':
          if (canRedo && onRedo) {
            event.preventDefault();
            onRedo();
          }
          break;
          
        case 'a':
          if (onSelectAll) {
            event.preventDefault();
            onSelectAll();
          }
          break;
          
        case 'c':
          if (hasSelection && onCopy) {
            event.preventDefault();
            onCopy();
          }
          break;
          
        case 'v':
          if (onPaste) {
            event.preventDefault();
            onPaste();
          }
          break;
          
        case 's':
          if (onSavePreset) {
            event.preventDefault();
            onSavePreset();
          }
          break;
          
        case 'o':
          if (onLoadPreset) {
            event.preventDefault();
            onLoadPreset();
          }
          break;
          
        case 'e':
          if (onExportMidi) {
            event.preventDefault();
            onExportMidi();
          }
          break;
          
        case 'n':
          if (onClearPattern) {
            event.preventDefault();
            onClearPattern();
          }
          break;
      }
      return;
    }
    
    // Combinaisons avec Alt
    if (altKey) {
      switch (key.toLowerCase()) {
        case 'c':
          if (onDeselectAll) {
            event.preventDefault();
            onDeselectAll();
          }
          break;
      }
      return;
    }
    
    // Touches simples
    switch (key) {
      case ' ': // Espace
        event.preventDefault();
        if (isPlaying && onStop) {
          onStop();
        } else if (!isPlaying && onPlay) {
          onPlay();
        }
        break;
        
      case 'Escape':
        if (onDeselectAll) {
          event.preventDefault();
          onDeselectAll();
        }
        break;
        
      case 'Delete':
      case 'Backspace':
        if (hasSelection && onDelete) {
          event.preventDefault();
          onDelete();
        }
        break;
        
      // Navigation avec les flèches
      case 'ArrowUp':
        if (hasSelection && onMoveSelection) {
          event.preventDefault();
          onMoveSelection(0, shiftKey ? -12 : -1); // Octave si Shift
        }
        break;
        
      case 'ArrowDown':
        if (hasSelection && onMoveSelection) {
          event.preventDefault();
          onMoveSelection(0, shiftKey ? 12 : 1); // Octave si Shift
        }
        break;
        
      case 'ArrowLeft':
        if (hasSelection && onMoveSelection) {
          event.preventDefault();
          onMoveSelection(shiftKey ? -4 : -1, 0); // 4 steps si Shift
        }
        break;
        
      case 'ArrowRight':
        if (hasSelection && onMoveSelection) {
          event.preventDefault();
          onMoveSelection(shiftKey ? 4 : 1, 0); // 4 steps si Shift
        }
        break;
    }
  }, [
    onPlay, onStop, onUndo, onRedo, onSelectAll, onDeselectAll,
    onCopy, onPaste, onDelete, onClearPattern, onSavePreset,
    onLoadPreset, onExportMidi, onMoveSelection,
    isPlaying, hasSelection, canUndo, canRedo
  ]);

  // Attacher/détacher les événements
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Retourner les raccourcis disponibles pour l'aide
  const getAvailableShortcuts = useCallback(() => {
    return {
      playback: [
        { key: 'Espace', description: 'Play/Stop' }
      ],
      edition: [
        { key: 'Ctrl+Z', description: 'Annuler' },
        { key: 'Ctrl+Y / Ctrl+Shift+Z', description: 'Refaire' },
        { key: 'Delete/Backspace', description: 'Supprimer sélection' },
        { key: 'Ctrl+A', description: 'Sélectionner tout' },
        { key: 'Escape', description: 'Désélectionner' }
      ],
      clipboard: [
        { key: 'Ctrl+C', description: 'Copier' },
        { key: 'Ctrl+V', description: 'Coller' }
      ],
      navigation: [
        { key: '↑/↓', description: 'Déplacer notes (1 semitone)' },
        { key: 'Shift+↑/↓', description: 'Déplacer notes (1 octave)' },
        { key: '←/→', description: 'Déplacer notes (1 step)' },
        { key: 'Shift+←/→', description: 'Déplacer notes (4 steps)' }
      ],
      files: [
        { key: 'Ctrl+S', description: 'Sauvegarder preset' },
        { key: 'Ctrl+O', description: 'Charger preset' },
        { key: 'Ctrl+E', description: 'Exporter MIDI' },
        { key: 'Ctrl+N', description: 'Nouveau pattern' }
      ]
    };
  }, []);

  return {
    getAvailableShortcuts
  };
}