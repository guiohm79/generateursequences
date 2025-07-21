// Hook personnalisé pour les manipulations et transformations de patterns
import { useCallback } from 'react';

/**
 * Hook pour gérer les manipulations de patterns musicaux (shift octave, transpose, etc.)
 * @param {Object} options - Options de configuration
 * @param {Object} options.pattern - Pattern actuel
 * @param {Function} options.setPattern - Fonction pour modifier le pattern
 * @param {Function} options.saveToHistory - Fonction pour sauvegarder dans l'historique
 * @returns {Object} Fonctions pour les manipulations de patterns
 */
export function usePatternManipulation({ pattern, setPattern, saveToHistory }) {
  
  // Fonction pour monter toutes les notes actives d'une octave
  const shiftOctaveUp = useCallback(() => {
    if (!pattern) return false;

    try {
      // Récupérer toutes les notes actives avec leur position et vélocité
      const activeNotes = [];
      Object.keys(pattern).forEach(note => {
        // Pour chaque note, vérifier les steps actifs
        if (Array.isArray(pattern[note])) {
          pattern[note].forEach((cell, stepIndex) => {
            if (cell && cell.on) {
              // Décomposer la note en nom et octave (ex: "C4" => "C" et 4)
              const noteName = note.replace(/[0-9]/g, '');
              const octave = parseInt(note.replace(/[^0-9]/g, ''));
              
              // Ajouter à notre liste de notes actives
              activeNotes.push({
                originalNote: note,
                noteName,
                octave,
                stepIndex,
                velocity: cell.velocity || 100,
                accent: cell.accent || false,
                slide: cell.slide || false
              });
            }
          });
        }
      });
      
      if (activeNotes.length === 0) {
        console.log('Aucune note active à déplacer');
        return false;
      }
      
      // Nettoyer d'abord le pattern actuel (supprimer toutes les notes actives)
      const newPattern = {};
      Object.keys(pattern).forEach(note => {
        if (Array.isArray(pattern[note])) {
          newPattern[note] = pattern[note].map(cell => 
            cell && cell.on ? 0 : cell
          );
        } else {
          newPattern[note] = pattern[note];
        }
      });
      
      // Placer les notes à leur nouvelle position (octave supérieure)
      let movedCount = 0;
      activeNotes.forEach(({ noteName, octave, stepIndex, velocity, accent, slide }) => {
        const newOctave = Math.min(9, octave + 1); // Limite supérieure à l'octave 9
        const newNote = `${noteName}${newOctave}`;
        
        // Vérifier que la nouvelle note existe dans notre pattern
        if (newPattern[newNote] && Array.isArray(newPattern[newNote])) {
          newPattern[newNote][stepIndex] = { 
            on: true, 
            velocity,
            accent,
            slide
          };
          movedCount++;
        }
      });
      
      if (movedCount > 0) {
        // Sauvegarder dans l'historique et mettre à jour le pattern
        saveToHistory(newPattern);
        setPattern(newPattern);
        console.log(`${movedCount} notes déplacées vers l'octave supérieure`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors du shift octave up:', error);
      return false;
    }
  }, [pattern, setPattern, saveToHistory]);
  
  // Fonction pour descendre toutes les notes actives d'une octave
  const shiftOctaveDown = useCallback(() => {
    if (!pattern) return false;

    try {
      // Récupérer toutes les notes actives avec leur position et vélocité
      const activeNotes = [];
      Object.keys(pattern).forEach(note => {
        // Pour chaque note, vérifier les steps actifs
        if (Array.isArray(pattern[note])) {
          pattern[note].forEach((cell, stepIndex) => {
            if (cell && cell.on) {
              // Décomposer la note en nom et octave (ex: "C4" => "C" et 4)
              const noteName = note.replace(/[0-9]/g, '');
              const octave = parseInt(note.replace(/[^0-9]/g, ''));
              
              // Ajouter à notre liste de notes actives
              activeNotes.push({
                originalNote: note,
                noteName,
                octave,
                stepIndex,
                velocity: cell.velocity || 100,
                accent: cell.accent || false,
                slide: cell.slide || false
              });
            }
          });
        }
      });
      
      if (activeNotes.length === 0) {
        console.log('Aucune note active à déplacer');
        return false;
      }
      
      // Nettoyer d'abord le pattern actuel (supprimer toutes les notes actives)
      const newPattern = {};
      Object.keys(pattern).forEach(note => {
        if (Array.isArray(pattern[note])) {
          newPattern[note] = pattern[note].map(cell => 
            cell && cell.on ? 0 : cell
          );
        } else {
          newPattern[note] = pattern[note];
        }
      });
      
      // Placer les notes à leur nouvelle position (octave inférieure)
      let movedCount = 0;
      activeNotes.forEach(({ noteName, octave, stepIndex, velocity, accent, slide }) => {
        const newOctave = Math.max(0, octave - 1); // Limite inférieure à l'octave 0
        const newNote = `${noteName}${newOctave}`;
        
        // Vérifier que la nouvelle note existe dans notre pattern
        if (newPattern[newNote] && Array.isArray(newPattern[newNote])) {
          newPattern[newNote][stepIndex] = { 
            on: true, 
            velocity,
            accent,
            slide
          };
          movedCount++;
        }
      });
      
      if (movedCount > 0) {
        // Sauvegarder dans l'historique et mettre à jour le pattern
        saveToHistory(newPattern);
        setPattern(newPattern);
        console.log(`${movedCount} notes déplacées vers l'octave inférieure`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors du shift octave down:', error);
      return false;
    }
  }, [pattern, setPattern, saveToHistory]);

  // Fonction pour transposer le pattern d'un nombre de demi-tons
  const transposePattern = useCallback((semitones) => {
    if (!pattern || semitones === 0) return false;

    try {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const activeNotes = [];
      
      // Récupérer toutes les notes actives
      Object.keys(pattern).forEach(note => {
        if (Array.isArray(pattern[note])) {
          pattern[note].forEach((cell, stepIndex) => {
            if (cell && cell.on) {
              const noteName = note.replace(/[0-9]/g, '');
              const octave = parseInt(note.replace(/[^0-9]/g, ''));
              const noteIndex = noteNames.indexOf(noteName);
              
              if (noteIndex !== -1) {
                activeNotes.push({
                  originalNote: note,
                  noteIndex,
                  octave,
                  stepIndex,
                  velocity: cell.velocity || 100,
                  accent: cell.accent || false,
                  slide: cell.slide || false
                });
              }
            }
          });
        }
      });

      if (activeNotes.length === 0) return false;

      // Nettoyer le pattern
      const newPattern = {};
      Object.keys(pattern).forEach(note => {
        if (Array.isArray(pattern[note])) {
          newPattern[note] = pattern[note].map(cell => 
            cell && cell.on ? 0 : cell
          );
        } else {
          newPattern[note] = pattern[note];
        }
      });

      // Transposer et placer les notes
      let movedCount = 0;
      activeNotes.forEach(({ noteIndex, octave, stepIndex, velocity, accent, slide }) => {
        let newNoteIndex = noteIndex + semitones;
        let newOctave = octave;
        
        // Gérer le wrap-around des octaves
        while (newNoteIndex >= 12) {
          newNoteIndex -= 12;
          newOctave++;
        }
        while (newNoteIndex < 0) {
          newNoteIndex += 12;
          newOctave--;
        }
        
        // Limiter aux octaves valides
        if (newOctave >= 0 && newOctave <= 9) {
          const newNote = `${noteNames[newNoteIndex]}${newOctave}`;
          
          if (newPattern[newNote] && Array.isArray(newPattern[newNote])) {
            newPattern[newNote][stepIndex] = {
              on: true,
              velocity,
              accent,
              slide
            };
            movedCount++;
          }
        }
      });

      if (movedCount > 0) {
        saveToHistory(newPattern);
        setPattern(newPattern);
        console.log(`Pattern transposé de ${semitones} demi-tons (${movedCount} notes)`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de la transposition:', error);
      return false;
    }
  }, [pattern, setPattern, saveToHistory]);

  // Fonction pour inverser le pattern (miroir horizontal)
  const reversePattern = useCallback(() => {
    if (!pattern) return false;

    try {
      const newPattern = {};
      let hasChanges = false;

      Object.keys(pattern).forEach(note => {
        if (Array.isArray(pattern[note])) {
          newPattern[note] = [...pattern[note]].reverse();
          hasChanges = true;
        } else {
          newPattern[note] = pattern[note];
        }
      });

      if (hasChanges) {
        saveToHistory(newPattern);
        setPattern(newPattern);
        console.log('Pattern inversé (miroir horizontal)');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de l\'inversion:', error);
      return false;
    }
  }, [pattern, setPattern, saveToHistory]);

  // Fonction pour décaler le pattern horizontalement
  const shiftPatternHorizontally = useCallback((steps) => {
    if (!pattern || steps === 0) return false;

    try {
      const newPattern = {};
      let hasChanges = false;

      Object.keys(pattern).forEach(note => {
        if (Array.isArray(pattern[note])) {
          const noteArray = pattern[note];
          const length = noteArray.length;
          const newNoteArray = new Array(length).fill(0);
          
          // Décaler chaque élément
          noteArray.forEach((cell, index) => {
            const newIndex = (index + steps + length) % length;
            newNoteArray[newIndex] = cell;
          });
          
          newPattern[note] = newNoteArray;
          hasChanges = true;
        } else {
          newPattern[note] = pattern[note];
        }
      });

      if (hasChanges) {
        saveToHistory(newPattern);
        setPattern(newPattern);
        console.log(`Pattern décalé de ${steps} pas`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors du décalage horizontal:', error);
      return false;
    }
  }, [pattern, setPattern, saveToHistory]);

  // Fonction pour dupliquer et compresser le pattern
  const duplicateAndCompress = useCallback(() => {
    if (!pattern) return false;

    try {
      const newPattern = {};
      let hasChanges = false;

      Object.keys(pattern).forEach(note => {
        if (Array.isArray(pattern[note])) {
          const noteArray = pattern[note];
          const halfLength = Math.floor(noteArray.length / 2);
          const newNoteArray = [];
          
          // Prendre la première moitié et la dupliquer
          for (let i = 0; i < halfLength; i++) {
            newNoteArray.push(noteArray[i]);
          }
          for (let i = 0; i < halfLength; i++) {
            newNoteArray.push(noteArray[i]);
          }
          
          // Compléter avec des zéros si nécessaire
          while (newNoteArray.length < noteArray.length) {
            newNoteArray.push(0);
          }
          
          newPattern[note] = newNoteArray;
          hasChanges = true;
        } else {
          newPattern[note] = pattern[note];
        }
      });

      if (hasChanges) {
        saveToHistory(newPattern);
        setPattern(newPattern);
        console.log('Pattern dupliqué et compressé');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
      return false;
    }
  }, [pattern, setPattern, saveToHistory]);

  // Fonction pour obtenir le nombre de notes actives
  const getActiveNotesCount = useCallback(() => {
    if (!pattern) return 0;
    
    let count = 0;
    Object.values(pattern).forEach(noteArray => {
      if (Array.isArray(noteArray)) {
        noteArray.forEach(cell => {
          if (cell && cell.on) count++;
        });
      }
    });
    return count;
  }, [pattern]);

  // Vérifier si des manipulations sont possibles
  const canManipulate = pattern !== null && getActiveNotesCount() > 0;

  return {
    // Fonctions de manipulation principales
    shiftOctaveUp,
    shiftOctaveDown,
    transposePattern,
    reversePattern,
    shiftPatternHorizontally,
    duplicateAndCompress,
    
    // Fonctions utilitaires
    getActiveNotesCount,
    
    // État calculé
    canManipulate
  };
}