/**
 * Utilitaires pour la gestion de la sélection
 */

import { NoteEvent, SelectionRectangle, ClipboardData } from '../types';
import { createNoteId } from './noteHelpers';

// Vérifier si une note est dans le rectangle de sélection
export const isNoteInSelectionRectangle = (
  step: number,
  noteIndex: number,
  rectangle: SelectionRectangle,
  cellWidth: number,
  cellHeight: number
): boolean => {
  const noteX = step * cellWidth;
  const noteY = noteIndex * cellHeight;
  
  const left = Math.min(rectangle.startX, rectangle.endX);
  const right = Math.max(rectangle.startX, rectangle.endX);
  const top = Math.min(rectangle.startY, rectangle.endY);
  const bottom = Math.max(rectangle.startY, rectangle.endY);
  
  return noteX >= left && 
         noteX + cellWidth <= right && 
         noteY >= top && 
         noteY + cellHeight <= bottom;
};

// Obtenir les notes sélectionnées à partir d'un Set d'IDs
export const getSelectedNotes = (
  pattern: NoteEvent[], 
  selectedNoteIds: Set<string>
): NoteEvent[] => {
  return pattern.filter(note => {
    const noteId = createNoteId(note.step, note.note);
    return selectedNoteIds.has(noteId) && note.isActive;
  });
};

// Créer les données du clipboard à partir des notes sélectionnées
export const createClipboardData = (
  selectedNotes: NoteEvent[],
  allNotes: string[]
): ClipboardData => {
  if (selectedNotes.length === 0) {
    return { notes: [], relativePositions: [] };
  }
  
  // Trouver les positions minimales pour les offsets relatifs
  const minStep = Math.min(...selectedNotes.map(note => note.step));
  const minNoteIndex = Math.min(...selectedNotes.map(note => 
    allNotes.findIndex(n => n === note.note)
  ));
  
  const relativePositions = selectedNotes.map(note => ({
    stepOffset: note.step - minStep,
    noteOffset: allNotes.findIndex(n => n === note.note) - minNoteIndex
  }));
  
  return {
    notes: [...selectedNotes],
    relativePositions
  };
};

// Coller les notes du clipboard à une position donnée
export const pasteNotesFromClipboard = (
  currentPattern: NoteEvent[],
  clipboardData: ClipboardData,
  targetStep: number,
  targetNoteIndex: number,
  allNotes: string[],
  maxSteps: number
): NoteEvent[] => {
  if (!clipboardData || clipboardData.notes.length === 0) {
    return currentPattern;
  }
  
  const newPattern = [...currentPattern];
  
  clipboardData.notes.forEach((note, index) => {
    const relativePos = clipboardData.relativePositions[index];
    const newStep = targetStep + relativePos.stepOffset;
    const newNoteIndex = targetNoteIndex + relativePos.noteOffset;
    
    // Vérifier les limites
    if (newStep >= 0 && newStep < maxSteps && 
        newNoteIndex >= 0 && newNoteIndex < allNotes.length) {
      
      const newNote = allNotes[newNoteIndex];
      
      // Supprimer la note existante si elle existe
      const existingIndex = newPattern.findIndex(n => 
        n.step === newStep && n.note === newNote
      );
      
      if (existingIndex >= 0) {
        newPattern.splice(existingIndex, 1);
      }
      
      // Ajouter la nouvelle note
      newPattern.push({
        ...note,
        step: newStep,
        note: newNote
      });
    }
  });
  
  return newPattern;
};

// Déplacer les notes sélectionnées
export const moveSelectedNotes = (
  pattern: NoteEvent[],
  selectedNoteIds: Set<string>,
  stepDelta: number,
  noteDelta: number,
  allNotes: string[],
  maxSteps: number
): { newPattern: NoteEvent[]; newSelection: Set<string> } => {
  const newPattern = [...pattern];
  const newSelection = new Set<string>();
  
  // Créer une map des notes à déplacer
  const notesToMove = new Map<string, NoteEvent>();
  const notesToRemove = new Set<string>();
  
  pattern.forEach(note => {
    const noteId = createNoteId(note.step, note.note);
    if (selectedNoteIds.has(noteId) && note.isActive) {
      notesToMove.set(noteId, note);
      notesToRemove.add(noteId);
    }
  });
  
  // Supprimer les anciennes positions
  const filteredPattern = newPattern.filter(note => {
    const noteId = createNoteId(note.step, note.note);
    return !notesToRemove.has(noteId);
  });
  
  // Ajouter les notes aux nouvelles positions
  notesToMove.forEach(note => {
    const currentNoteIndex = allNotes.findIndex(n => n === note.note);
    const newStep = note.step + stepDelta;
    const newNoteIndex = currentNoteIndex + noteDelta;
    
    // Vérifier les limites
    if (newStep >= 0 && newStep < maxSteps && 
        newNoteIndex >= 0 && newNoteIndex < allNotes.length) {
      
      const newNote = allNotes[newNoteIndex];
      const movedNote = {
        ...note,
        step: newStep,
        note: newNote
      };
      
      filteredPattern.push(movedNote);
      newSelection.add(createNoteId(newStep, newNote));
    }
  });
  
  return {
    newPattern: filteredPattern,
    newSelection
  };
};

// Sélectionner toutes les notes
export const selectAllNotes = (pattern: NoteEvent[]): Set<string> => {
  const allSelected = new Set<string>();
  
  pattern.forEach(note => {
    if (note.isActive) {
      allSelected.add(createNoteId(note.step, note.note));
    }
  });
  
  return allSelected;
};