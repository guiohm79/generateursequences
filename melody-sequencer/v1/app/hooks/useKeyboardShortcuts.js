// Hook personnalisé pour gérer tous les raccourcis clavier du séquenceur
import { useEffect, useCallback } from 'react';

/**
 * Hook pour gérer les raccourcis clavier globaux du séquenceur
 * @param {Object} actions - Objet contenant toutes les actions disponibles
 * @returns {Object} Fonctions utilitaires pour les raccourcis
 */
export function useKeyboardShortcuts(actions = {}) {
  const {
    // Actions de transport
    handlePlay,
    handleStop,
    handleClear,
    isPlaying,
    
    // Actions de pattern
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    regenerateRandomPattern,
    randomParams,
    
    // Actions de manipulation
    shiftOctaveUp,
    shiftOctaveDown,
    generateMorphTarget,
    morphingEnabled,
    
    // Actions d'interface
    setRandomVisible,
    setSynthPopupOpen,
    setVariationPopupOpen,
    setFavoritesPopupOpen,
    setScalesManagerOpen,
    setMidiSettingsOpen,
    setShortcutsHelpOpen,
    
    // Paramètres
    setTempo,
    tempo
  } = actions;

  // Fonction pour vérifier si un élément input/textarea est actif
  const isInputActive = useCallback(() => {
    const activeElement = document.activeElement;
    const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
    return inputTypes.includes(activeElement?.tagName) || 
           activeElement?.isContentEditable;
  }, []);

  // Handler principal des raccourcis clavier
  const handleKeyDown = useCallback((event) => {
    // Ignorer les raccourcis si un input est actif
    if (isInputActive()) return;
    
    const { key, ctrlKey, shiftKey, altKey, metaKey } = event;
    const isModifierPressed = ctrlKey || shiftKey || altKey || metaKey;
    
    // Raccourcis de transport (prioritaires)
    switch (key.toLowerCase()) {
      // TRANSPORT
      case ' ': // Espace - Play/Stop
        event.preventDefault();
        if (isPlaying) {
          handleStop?.();
        } else {
          handlePlay?.();
        }
        return;
        
      case 'escape': // ESC - Stop
        event.preventDefault();
        handleStop?.();
        return;
        
      // PATTERN MANAGEMENT
      case 'z':
        if (ctrlKey && !shiftKey) {
          event.preventDefault();
          if (canUndo) handleUndo?.();
          return;
        }
        if (ctrlKey && shiftKey) {
          event.preventDefault();
          if (canRedo) handleRedo?.();
          return;
        }
        break;
        
      case 'y':
        if (ctrlKey) {
          event.preventDefault();
          if (canRedo) handleRedo?.();
          return;
        }
        break;
        
      case 'r':
        if (ctrlKey) {
          event.preventDefault();
          if (randomParams) regenerateRandomPattern?.();
          return;
        }
        if (!isModifierPressed) {
          event.preventDefault();
          setRandomVisible?.(true);
          return;
        }
        break;
        
      case 'delete':
      case 'backspace':
        if (ctrlKey) {
          event.preventDefault();
          handleClear?.();
          return;
        }
        break;
        
      // OCTAVE MANIPULATION
      case 'arrowup':
        if (ctrlKey) {
          event.preventDefault();
          shiftOctaveUp?.();
          return;
        }
        break;
        
      case 'arrowdown':
        if (ctrlKey) {
          event.preventDefault();
          shiftOctaveDown?.();
          return;
        }
        break;
        
      // MORPHING
      case 'm':
        if (!isModifierPressed) {
          event.preventDefault();
          if (!morphingEnabled) {
            generateMorphTarget?.();
          }
          return;
        }
        break;
        
      // INTERFACE POPUPS
      case 'g':
        if (!isModifierPressed) {
          event.preventDefault();
          setRandomVisible?.(true);
          return;
        }
        break;
        
      case 'i':
        if (!isModifierPressed) {
          event.preventDefault();
          setSynthPopupOpen?.(true);
          return;
        }
        break;
        
      case 'v':
        if (!isModifierPressed) {
          event.preventDefault();
          setVariationPopupOpen?.(true);
          return;
        }
        break;
        
      case 'f':
        if (!isModifierPressed) {
          event.preventDefault();
          setFavoritesPopupOpen?.(true);
          return;
        }
        break;
        
      case 'k':
        if (!isModifierPressed) {
          event.preventDefault();
          setScalesManagerOpen?.(true);
          return;
        }
        break;
        
      case 'j':
        if (!isModifierPressed) {
          event.preventDefault();
          setMidiSettingsOpen?.(true);
          return;
        }
        break;
        
      // TEMPO CONTROL
      case 'arrowleft':
        if (ctrlKey) {
          event.preventDefault();
          const newTempo = Math.max(60, tempo - 5);
          setTempo?.(newTempo);
          return;
        }
        break;
        
      case 'arrowright':
        if (ctrlKey) {
          event.preventDefault();
          const newTempo = Math.min(240, tempo + 5);
          setTempo?.(newTempo);
          return;
        }
        break;
        
      case 'h':
        if (!isModifierPressed) {
          event.preventDefault();
          setShortcutsHelpOpen?.(true);
          return;
        }
        break;
        
      // CHIFFRES pour tempo rapide
      case '1': case '2': case '3': case '4': case '5':
        if (ctrlKey) {
          event.preventDefault();
          const tempos = { '1': 80, '2': 100, '3': 120, '4': 140, '5': 160 };
          setTempo?.(tempos[key]);
          return;
        }
        break;
        
      default:
        // Pas de raccourci correspondant
        break;
    }
  }, [
    isInputActive, isPlaying, canUndo, canRedo, randomParams, morphingEnabled, tempo,
    handlePlay, handleStop, handleClear, handleUndo, handleRedo, regenerateRandomPattern,
    shiftOctaveUp, shiftOctaveDown, generateMorphTarget, setRandomVisible, setSynthPopupOpen,
    setVariationPopupOpen, setFavoritesPopupOpen, setScalesManagerOpen, setMidiSettingsOpen,
    setShortcutsHelpOpen, setTempo
  ]);

  // Attacher les event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Fonction utilitaire pour obtenir la liste des raccourcis
  const getShortcutsList = useCallback(() => {
    return {
      transport: {
        'Espace': 'Play/Stop',
        'Escape': 'Stop',
        'Ctrl+Delete': 'Clear'
      },
      pattern: {
        'Ctrl+Z': 'Undo',
        'Ctrl+Shift+Z': 'Redo',
        'Ctrl+Y': 'Redo (alternatif)',
        'Ctrl+R': 'Regénérer pattern',
        'R': 'Random popup'
      },
      manipulation: {
        'Ctrl+↑': 'Octave +',
        'Ctrl+↓': 'Octave -',
        'M': 'Morphing'
      },
      interface: {
        'G': 'Générateur aléatoire',
        'I': 'Instruments/Synthés',
        'V': 'Variations',
        'F': 'Favoris',
        'K': 'Gammes (sKales)',
        'J': 'MIDI settings',
        'H': 'Aide (Help)'
      },
      tempo: {
        'Ctrl+←': 'Tempo -5',
        'Ctrl+→': 'Tempo +5',
        'Ctrl+1-5': 'Tempo preset (80-160)'
      },
      pianoroll: {
        'A': 'Toggle accent (sur cellule survolée)',
        'S': 'Toggle slide (sur cellule survolée)'
      }
    };
  }, []);

  return {
    getShortcutsList,
    isInputActive
  };
}