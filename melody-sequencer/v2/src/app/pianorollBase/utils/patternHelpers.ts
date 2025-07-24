/**
 * Utilitaires pour la manipulation des patterns
 */

import { NoteEvent } from '../types';
import { SimplePattern } from '../../../lib/SimpleAudioEngine';

// Trouver une note dans le pattern
export const findNoteInPattern = (
  pattern: NoteEvent[], 
  step: number, 
  note: string
): NoteEvent | undefined => {
  return pattern.find(n => n.step === step && n.note === note && n.isActive);
};

// Obtenir toutes les notes à un step donné
export const getNotesAtStep = (pattern: NoteEvent[], step: number): NoteEvent[] => {
  return pattern.filter(n => n.step === step && n.isActive);
};

// Vérifier si une note existe dans le pattern
export const noteExistsInPattern = (
  pattern: NoteEvent[], 
  step: number, 
  note: string
): boolean => {
  return pattern.some(n => n.step === step && n.note === note && n.isActive);
};

// Ajouter ou mettre à jour une note dans le pattern
export const addOrUpdateNoteInPattern = (
  pattern: NoteEvent[], 
  step: number, 
  note: string, 
  velocity: number = 64, 
  duration: number = 1
): NoteEvent[] => {
  const existingIndex = pattern.findIndex(n => n.step === step && n.note === note);
  
  if (existingIndex >= 0) {
    // Mettre à jour la note existante
    const updatedPattern = [...pattern];
    updatedPattern[existingIndex] = {
      ...updatedPattern[existingIndex],
      isActive: true,
      velocity,
      duration
    };
    return updatedPattern;
  } else {
    // Ajouter une nouvelle note
    return [
      ...pattern,
      {
        step,
        note,
        velocity,
        isActive: true,
        duration
      }
    ];
  }
};

// Supprimer une note du pattern
export const removeNoteFromPattern = (
  pattern: NoteEvent[], 
  step: number, 
  note: string
): NoteEvent[] => {
  return pattern.filter(n => !(n.step === step && n.note === note));
};

// Supprimer toutes les notes inactives du pattern
export const cleanupInactiveNotes = (pattern: NoteEvent[]): NoteEvent[] => {
  return pattern.filter(note => note.isActive);
};

// Convertir le pattern pour l'audio engine (format SimplePattern)
export const convertPatternToAudioFormat = (
  pattern: NoteEvent[], 
  steps: number
): SimplePattern => {
  const result: SimplePattern = {};
  
  // Créer des arrays de SimpleStep pour chaque note
  pattern.forEach(noteEvent => {
    if (noteEvent.isActive) {
      const noteName = noteEvent.note;
      
      if (!result[noteName]) {
        // Initialiser avec des steps vides
        result[noteName] = Array.from({ length: steps }, () => ({
          on: false,
          velocity: 100
        }));
      }
      
      // Activer le step correspondant
      if (result[noteName][noteEvent.step]) {
        result[noteName][noteEvent.step] = {
          on: true,
          velocity: noteEvent.velocity,
          duration: noteEvent.duration
        };
      }
    }
  });
  
  return result;
};

// Calculer les statistiques d'un pattern
export const getPatternStats = (pattern: NoteEvent[]) => {
  const activeNotes = pattern.filter(note => note.isActive);
  
  return {
    totalNotes: activeNotes.length,
    averageVelocity: activeNotes.length > 0 
      ? Math.round(activeNotes.reduce((sum, note) => sum + note.velocity, 0) / activeNotes.length)
      : 0,
    minVelocity: activeNotes.length > 0 
      ? Math.min(...activeNotes.map(note => note.velocity))
      : 0,
    maxVelocity: activeNotes.length > 0 
      ? Math.max(...activeNotes.map(note => note.velocity))
      : 0,
    usedSteps: Array.from(new Set(activeNotes.map(note => note.step))).length,
    usedNotes: Array.from(new Set(activeNotes.map(note => note.note))).length
  };
};