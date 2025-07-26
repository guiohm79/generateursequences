/**
 * useChordPreview.ts - Hook pour l'aperçu audio des accords
 * 
 * Ce hook fournit une interface simple pour jouer des accords
 * en utilisant l'audio engine existant du projet.
 */

import { useCallback, useRef } from 'react';

interface ChordPreviewHook {
  playChord: (notes: string[], duration?: number) => void;
  stopAll: () => void;
}

interface AudioEngine {
  initialize: () => Promise<void>;
  playNote: (note: string, velocity?: number, duration?: string) => void;
  stopNote: (note: string) => void;
  stopAll: () => void;
  isInitialized: boolean;
}

export const useChordPreview = (audioEngine?: AudioEngine): ChordPreviewHook => {
  const activeNotesRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopAll = useCallback(() => {
    // Arrêter toutes les notes actives
    activeNotesRef.current.forEach(note => {
      if (audioEngine && audioEngine.isInitialized) {
        audioEngine.stopNote(note);
      }
    });
    activeNotesRef.current.clear();

    // Nettoyer le timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [audioEngine]);

  const playChord = useCallback((notes: string[], duration: number = 1000) => {
    if (!audioEngine || !audioEngine.isInitialized) {
      console.warn('Audio engine not available for chord preview');
      return;
    }

    // Arrêter les notes précédentes
    stopAll();

    // Jouer les nouvelles notes
    notes.forEach(note => {
      audioEngine.playNote(note, 0.7, '8n'); // Vélocité modérée, durée 8n
      activeNotesRef.current.add(note);
    });

    // Programmer l'arrêt automatique
    timeoutRef.current = setTimeout(() => {
      stopAll();
    }, duration);

  }, [audioEngine, stopAll]);

  return {
    playChord,
    stopAll
  };
};

export default useChordPreview;