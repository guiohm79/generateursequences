/**
 * Utilitaires pour la manipulation des notes
 */

// Vérifier si une note est une touche noire (dièse)
export const isBlackKey = (note: string): boolean => {
  return note.includes('#');
};

// Obtenir le nom d'affichage d'une note
export const getNoteDisplayName = (note: string): string => {
  return note; // Keep full note name with octave
};

// Extraire le numéro d'octave d'une note
export const getOctaveNumber = (note: string): string => {
  const match = note.match(/[0-9]/);
  return match ? match[0] : '';
};

// Génération des notes par octave
export const generateNotesForOctave = (octave: number): string[] => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return noteNames.reverse().map(note => `${note}${octave}`); // Inversé pour affichage top-to-bottom
};

// Vélocité vers couleurs avec classes CSS prédéfinies (vert faible → rouge fort)
export const getVelocityColorClass = (velocity: number): string => {
  const normalized = Math.max(0, Math.min(127, velocity)) / 127;
  
  if (normalized < 0.25) {
    return 'bg-gradient-to-br from-green-400 to-green-500 shadow-green-400/50';
  } else if (normalized < 0.5) {
    return 'bg-gradient-to-br from-green-500 to-yellow-400 shadow-green-500/50';
  } else if (normalized < 0.75) {
    return 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-400/50';
  } else {
    return 'bg-gradient-to-br from-orange-500 to-red-500 shadow-red-500/50';
  }
};

// Créer un identifiant unique pour une note
export const createNoteId = (step: number, note: string): string => {
  return `${step}-${note}`;
};

// Parser un identifiant de note
export const parseNoteId = (noteId: string): { step: number; note: string } | null => {
  const parts = noteId.split('-');
  if (parts.length < 2) return null;
  
  const step = parseInt(parts[0], 10);
  const note = parts.slice(1).join('-'); // Rejoindre au cas où la note contient des tirets
  
  if (isNaN(step)) return null;
  
  return { step, note };
};