/**
 * Hook pour gérer l'édition des notes (création, modification, suppression)
 */

'use client';

import { useCallback } from 'react';
import { NoteEvent, NoteId } from '../types';
import { 
  findNoteInPattern, 
  addOrUpdateNoteInPattern, 
  removeNoteFromPattern 
} from '../utils/patternHelpers';
import { createNoteId } from '../utils/noteHelpers';
import { DEFAULT_VELOCITY } from '../utils/constants';

export function useNoteEditing() {

  // Ajouter ou activer/désactiver une note
  const toggleNote = useCallback((
    pattern: NoteEvent[],
    step: number,
    note: string,
    velocity: number = DEFAULT_VELOCITY,
    duration: number = 1
  ): NoteEvent[] => {
    const existingNote = findNoteInPattern(pattern, step, note);
    
    if (existingNote) {
      // Si la note existe, la supprimer
      return removeNoteFromPattern(pattern, step, note);
    } else {
      // Sinon, l'ajouter
      return addOrUpdateNoteInPattern(pattern, step, note, velocity, duration);
    }
  }, []);

  // Modifier la vélocité d'une note
  const updateNoteVelocity = useCallback((
    pattern: NoteEvent[],
    step: number,
    note: string,
    newVelocity: number
  ): NoteEvent[] => {
    const existingNote = findNoteInPattern(pattern, step, note);
    
    if (existingNote) {
      const clampedVelocity = Math.max(1, Math.min(127, newVelocity));
      return addOrUpdateNoteInPattern(pattern, step, note, clampedVelocity, existingNote.duration);
    }
    
    return pattern;
  }, []);

  // Modifier la durée d'une note
  const updateNoteDuration = useCallback((
    pattern: NoteEvent[],
    step: number,
    note: string,
    newDuration: number
  ): NoteEvent[] => {
    const existingNote = findNoteInPattern(pattern, step, note);
    
    if (existingNote) {
      const clampedDuration = Math.max(1, Math.min(16, newDuration));
      return addOrUpdateNoteInPattern(pattern, step, note, existingNote.velocity, clampedDuration);
    }
    
    return pattern;
  }, []);

  // Supprimer une note spécifique
  const deleteNote = useCallback((
    pattern: NoteEvent[],
    step: number,
    note: string
  ): NoteEvent[] => {
    return removeNoteFromPattern(pattern, step, note);
  }, []);

  // Supprimer plusieurs notes
  const deleteNotes = useCallback((
    pattern: NoteEvent[],
    notesToDelete: { step: number; note: string }[]
  ): NoteEvent[] => {
    let newPattern = [...pattern];
    
    notesToDelete.forEach(({ step, note }) => {
      newPattern = removeNoteFromPattern(newPattern, step, note);
    });
    
    return newPattern;
  }, []);

  // Supprimer toutes les notes sélectionnées
  const deleteSelectedNotes = useCallback((
    pattern: NoteEvent[],
    selectedNoteIds: Set<NoteId>
  ): NoteEvent[] => {
    return pattern.filter(note => {
      const noteId = createNoteId(note.step, note.note);
      return !selectedNoteIds.has(noteId) || !note.isActive;
    });
  }, []);

  // Dupliquer une note
  const duplicateNote = useCallback((
    pattern: NoteEvent[],
    sourceStep: number,
    sourceNote: string,
    targetStep: number,
    targetNote: string
  ): NoteEvent[] => {
    const sourceNoteData = findNoteInPattern(pattern, sourceStep, sourceNote);
    
    if (sourceNoteData) {
      return addOrUpdateNoteInPattern(
        pattern, 
        targetStep, 
        targetNote, 
        sourceNoteData.velocity, 
        sourceNoteData.duration
      );
    }
    
    return pattern;
  }, []);

  // Transposer une note (changer sa hauteur)
  const transposeNote = useCallback((
    pattern: NoteEvent[],
    step: number,
    oldNote: string,
    newNote: string
  ): NoteEvent[] => {
    const existingNote = findNoteInPattern(pattern, step, oldNote);
    
    if (existingNote) {
      // Supprimer l'ancienne note
      let newPattern = removeNoteFromPattern(pattern, step, oldNote);
      
      // Ajouter la nouvelle note avec les mêmes propriétés
      newPattern = addOrUpdateNoteInPattern(
        newPattern, 
        step, 
        newNote, 
        existingNote.velocity, 
        existingNote.duration
      );
      
      return newPattern;
    }
    
    return pattern;
  }, []);

  // Nettoyer le pattern (supprimer les notes inactives)
  const cleanupPattern = useCallback((pattern: NoteEvent[]): NoteEvent[] => {
    return pattern.filter(note => note.isActive);
  }, []);

  // Vider complètement le pattern
  const clearPattern = useCallback((): NoteEvent[] => {
    return [];
  }, []);

  return {
    // Actions de base
    toggleNote,
    deleteNote,
    deleteNotes,
    deleteSelectedNotes,
    
    // Modifications
    updateNoteVelocity,
    updateNoteDuration,
    transposeNote,
    duplicateNote,
    
    // Utilitaires
    cleanupPattern,
    clearPattern
  };
}