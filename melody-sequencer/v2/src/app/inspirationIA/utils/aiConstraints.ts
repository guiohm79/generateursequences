/**
 * aiConstraints.ts - Système de contraintes musicales pour l'IA
 * Applique vos paramètres musicaux (gammes, styles, octaves) aux sorties Magenta.js
 */

import { NoteEvent } from '../types';
import { GenerationParams, SCALES, NOTE_ORDER } from '../../../lib/InspirationEngine';
import { ScaleManager } from '../../../lib/ScaleManager';

// Interface pour les contraintes IA
export interface AIConstraints {
  root: string;
  scale: string;
  style: string;
  octaveRange: {
    min: number;
    max: number;
  };
  velocityProfile: 'default' | 'dark' | 'uplifting' | 'dense';
  quantization: 'strict' | 'loose' | 'none';
}

// Interface pour les résultats d'application de contraintes
export interface ConstraintResult {
  originalNotes: NoteEvent[];
  constrainedNotes: NoteEvent[];
  modifications: {
    pitchCorrections: number;
    octaveTranspositions: number;
    velocityAdjustments: number;
    removedNotes: number;
  };
}

/**
 * Convertit pitch MIDI en composants note + octave
 */
function midiToNoteComponents(midiPitch: number): { note: string; octave: number } {
  const octave = Math.floor(midiPitch / 12) - 1;
  const noteIndex = midiPitch % 12;
  const note = NOTE_ORDER[noteIndex];
  return { note, octave };
}

/**
 * Convertit note + octave en pitch MIDI
 */
function noteComponentsToMidi(note: string, octave: number): number {
  const noteIndex = NOTE_ORDER.indexOf(note);
  if (noteIndex === -1) return 60; // Fallback C4
  return (octave + 1) * 12 + noteIndex;
}

/**
 * Obtient les notes de la gamme dans une octave donnée
 */
function getScaleNotes(root: string, scaleType: string, octave: number): string[] {
  // Obtenir la gamme depuis le ScaleManager ou SCALES
  let scaleIntervals: number[];
  
  const allScales = ScaleManager.getAllScales();
  if (allScales[scaleType]) {
    scaleIntervals = allScales[scaleType];
  } else if (SCALES[scaleType as keyof typeof SCALES]) {
    scaleIntervals = SCALES[scaleType as keyof typeof SCALES];
  } else {
    console.warn(`Gamme inconnue: ${scaleType}, utilisation de minor par défaut`);
    scaleIntervals = SCALES.minor;
  }
  
  const rootIndex = NOTE_ORDER.indexOf(root);
  if (rootIndex === -1) {
    console.warn(`Note fondamentale inconnue: ${root}, utilisation de C par défaut`);
    return getScaleNotes('C', scaleType, octave);
  }
  
  return scaleIntervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return `${NOTE_ORDER[noteIndex]}${octave}`;
  });
}

/**
 * Trouve la note la plus proche dans la gamme
 */
function findClosestScaleNote(
  targetNote: string, 
  targetOctave: number, 
  constraints: AIConstraints
): { note: string; octave: number } {
  const targetMidi = noteComponentsToMidi(targetNote, targetOctave);
  
  // Générer toutes les notes possibles dans la range d'octaves
  const possibleNotes: Array<{ note: string; octave: number; midi: number }> = [];
  
  for (let oct = constraints.octaveRange.min; oct <= constraints.octaveRange.max; oct++) {
    const scaleNotes = getScaleNotes(constraints.root, constraints.scale, oct);
    scaleNotes.forEach(noteStr => {
      const match = noteStr.match(/^([A-G]#?)(\d+)$/);
      if (match) {
        const note = match[1];
        const octave = parseInt(match[2]);
        const midi = noteComponentsToMidi(note, octave);
        possibleNotes.push({ note, octave, midi });
      }
    });
  }
  
  // Trouver la note la plus proche
  if (possibleNotes.length === 0) {
    console.warn('Aucune note trouvée dans la gamme, fallback vers note originale');
    return { note: targetNote, octave: targetOctave };
  }
  
  let closest = possibleNotes[0];
  let minDistance = Math.abs(closest.midi - targetMidi);
  
  possibleNotes.forEach(candidate => {
    const distance = Math.abs(candidate.midi - targetMidi);
    if (distance < minDistance) {
      minDistance = distance;
      closest = candidate;
    }
  });
  
  return { note: closest.note, octave: closest.octave };
}

/**
 * Applique le profil de vélocité selon le style
 */
function applyVelocityProfile(
  velocity: number, 
  step: number, 
  profile: string,
  style: string
): number {
  let newVelocity = velocity;
  
  // Profils de vélocité
  switch (profile) {
    case 'dark':
      newVelocity = Math.max(1, velocity - 30);
      break;
    case 'uplifting':
      newVelocity = Math.min(127, velocity + 15);
      break;
    case 'dense':
      newVelocity = Math.min(127, velocity + 20);
      break;
  }
  
  // Ajustements selon le style musical
  switch (style) {
    case 'psy':
      // Accents sur contretemps
      if (step % 4 === 1 || step % 4 === 3) {
        newVelocity = Math.min(127, newVelocity + 10);
      }
      break;
    case 'goa':
      // Variations subtiles
      const variation = (step % 8) < 4 ? 5 : -5;
      newVelocity = Math.max(1, Math.min(127, newVelocity + variation));
      break;
    case 'prog':
      // Build-ups progressifs
      const progression = Math.floor(step / 4) * 3;
      newVelocity = Math.min(127, newVelocity + progression);
      break;
    case 'deep':
      // Vélocités plus douces
      newVelocity = Math.max(1, Math.min(100, newVelocity - 10));
      break;
  }
  
  return Math.max(1, Math.min(127, Math.round(newVelocity)));
}

/**
 * Applique les contraintes musicales aux notes générées par l'IA
 */
export function applyMusicalConstraints(
  aiNotes: NoteEvent[], 
  constraints: AIConstraints
): ConstraintResult {
  const result: ConstraintResult = {
    originalNotes: [...aiNotes],
    constrainedNotes: [],
    modifications: {
      pitchCorrections: 0,
      octaveTranspositions: 0,
      velocityAdjustments: 0,
      removedNotes: 0
    }
  };
  
  console.log(`🎯 Application contraintes IA:`, constraints);
  console.log(`📊 Notes d'entrée: ${aiNotes.length}`);
  
  aiNotes.forEach((note, index) => {
    try {
      // Parser la note originale
      const noteMatch = note.note.match(/^([A-G]#?)(\d+)$/);
      if (!noteMatch) {
        console.warn(`Note mal formatée ignorée: ${note.note}`);
        result.modifications.removedNotes++;
        return;
      }
      
      const originalNote = noteMatch[1];
      const originalOctave = parseInt(noteMatch[2]);
      
      console.log(`🎵 Traitement note ${index}: ${note.note} (step ${note.step})`);
      
      // Contrainte de gamme et octave
      const correctedNote = findClosestScaleNote(originalNote, originalOctave, constraints);
      const newNoteName = `${correctedNote.note}${correctedNote.octave}`;
      
      // Compter les modifications
      if (correctedNote.note !== originalNote) {
        result.modifications.pitchCorrections++;
        console.log(`  🎼 Correction pitch: ${originalNote} → ${correctedNote.note}`);
      }
      
      if (correctedNote.octave !== originalOctave) {
        result.modifications.octaveTranspositions++;
        console.log(`  🎚️ Transposition octave: ${originalOctave} → ${correctedNote.octave}`);
      }
      
      // Contrainte de vélocité
      const newVelocity = applyVelocityProfile(
        note.velocity, 
        note.step, 
        constraints.velocityProfile,
        constraints.style
      );
      
      if (newVelocity !== note.velocity) {
        result.modifications.velocityAdjustments++;
        console.log(`  🔊 Ajustement vélocité: ${note.velocity} → ${newVelocity}`);
      }
      
      // Créer la note contrainte
      const constrainedNote: NoteEvent = {
        ...note,
        note: newNoteName,
        velocity: newVelocity
      };
      
      result.constrainedNotes.push(constrainedNote);
      
      console.log(`  ✅ Note finale: ${constrainedNote.note}, vélocité ${constrainedNote.velocity}`);
      
    } catch (error) {
      console.error(`❌ Erreur traitement note ${index}:`, error);
      result.modifications.removedNotes++;
    }
  });
  
  console.log(`🎯 Contraintes appliquées:`, result.modifications);
  console.log(`📊 Notes de sortie: ${result.constrainedNotes.length}`);
  
  return result;
}

/**
 * Crée des contraintes à partir des paramètres de génération
 */
export function createConstraintsFromParams(params: GenerationParams): AIConstraints {
  return {
    root: params.root || 'C',
    scale: params.scale || 'minor',
    style: params.style || 'psy',
    octaveRange: {
      min: params.minOct || 2,
      max: params.maxOct || 4
    },
    velocityProfile: (params.mood as AIConstraints['velocityProfile']) || 'default',
    quantization: 'strict'
  };
}

/**
 * Présets de contraintes pour différents styles musicaux
 */
export const CONSTRAINT_PRESETS: Record<string, Partial<AIConstraints>> = {
  goaTrance: {
    style: 'goa',
    velocityProfile: 'uplifting',
    octaveRange: { min: 3, max: 5 },
    quantization: 'strict'
  },
  psyTrance: {
    style: 'psy',
    velocityProfile: 'dense', 
    octaveRange: { min: 2, max: 4 },
    quantization: 'strict'
  },
  darkPsy: {
    style: 'psy',
    velocityProfile: 'dark',
    octaveRange: { min: 1, max: 3 },
    quantization: 'strict'
  },
  progressive: {
    style: 'prog',
    velocityProfile: 'uplifting',
    octaveRange: { min: 3, max: 6 },
    quantization: 'loose'
  },
  deepHouse: {
    style: 'deep',
    velocityProfile: 'default',
    octaveRange: { min: 2, max: 4 },
    quantization: 'loose'
  }
};

/**
 * Applique un preset de contraintes
 */
export function applyConstraintPreset(
  aiNotes: NoteEvent[],
  presetName: string,
  root: string = 'C',
  scale: string = 'minor'
): ConstraintResult {
  const preset = CONSTRAINT_PRESETS[presetName];
  if (!preset) {
    console.warn(`Preset inconnu: ${presetName}, utilisation des contraintes par défaut`);
    return applyMusicalConstraints(aiNotes, createConstraintsFromParams({}));
  }
  
  const constraints: AIConstraints = {
    root,
    scale,
    style: preset.style || 'psy',
    octaveRange: preset.octaveRange || { min: 2, max: 4 },
    velocityProfile: preset.velocityProfile || 'default',
    quantization: preset.quantization || 'strict'
  };
  
  console.log(`🎨 Application preset "${presetName}":`, constraints);
  return applyMusicalConstraints(aiNotes, constraints);
}