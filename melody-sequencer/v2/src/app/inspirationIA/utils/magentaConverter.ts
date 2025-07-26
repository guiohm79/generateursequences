/**
 * Convertisseur Magenta.js → NoteEvent
 * Transforme les sorties de l'IA en format utilisable par notre piano roll
 */

import { NoteEvent } from '../types';

// Types Magenta (répétés ici pour clarté)
export interface MagentaNote {
  pitch: number;        // Note MIDI (60 = C4)
  startTime: number;    // Temps de début en secondes
  endTime: number;      // Temps de fin en secondes
  velocity?: number;    // Vélocité (0-1 dans Magenta)
}

export interface MagentaSequence {
  notes: MagentaNote[];
  totalTime: number;
}

// Conversion pitch MIDI → nom de note
const MIDI_TO_NOTE_MAP: { [key: number]: string } = {
  // Octave 1
  24: 'C1', 25: 'C#1', 26: 'D1', 27: 'D#1', 28: 'E1', 29: 'F1', 30: 'F#1', 31: 'G1', 32: 'G#1', 33: 'A1', 34: 'A#1', 35: 'B1',
  // Octave 2  
  36: 'C2', 37: 'C#2', 38: 'D2', 39: 'D#2', 40: 'E2', 41: 'F2', 42: 'F#2', 43: 'G2', 44: 'G#2', 45: 'A2', 46: 'A#2', 47: 'B2',
  // Octave 3
  48: 'C3', 49: 'C#3', 50: 'D3', 51: 'D#3', 52: 'E3', 53: 'F3', 54: 'F#3', 55: 'G3', 56: 'G#3', 57: 'A3', 58: 'A#3', 59: 'B3',
  // Octave 4 (C4 = 60)
  60: 'C4', 61: 'C#4', 62: 'D4', 63: 'D#4', 64: 'E4', 65: 'F4', 66: 'F#4', 67: 'G4', 68: 'G#4', 69: 'A4', 70: 'A#4', 71: 'B4',
  // Octave 5
  72: 'C5', 73: 'C#5', 74: 'D5', 75: 'D#5', 76: 'E5', 77: 'F5', 78: 'F#5', 79: 'G5', 80: 'G#5', 81: 'A5', 82: 'A#5', 83: 'B5',
  // Octave 6
  84: 'C6', 85: 'C#6', 86: 'D6', 87: 'D#6', 88: 'E6', 89: 'F6', 90: 'F#6', 91: 'G6', 92: 'G#6', 93: 'A6', 94: 'A#6', 95: 'B6',
  // Octave 7
  96: 'C7', 97: 'C#7', 98: 'D7', 99: 'D#7', 100: 'E7', 101: 'F7', 102: 'F#7', 103: 'G7', 104: 'G#7', 105: 'A7', 106: 'A#7', 107: 'B7'
};

export interface ConversionOptions {
  stepCount: number;           // Nombre total de steps dans la grille
  stepDurationMs: number;      // Durée d'un step en millisecondes
  quantizeToGrid: boolean;     // Quantifier sur la grille
  defaultVelocity: number;     // Vélocité par défaut si absente
  maxDuration: number;         // Durée maximum en steps
}

export const DEFAULT_CONVERSION_OPTIONS: ConversionOptions = {
  stepCount: 16,
  stepDurationMs: 250,         // 250ms = 60 BPM avec 1/16 notes
  quantizeToGrid: true,
  defaultVelocity: 100,        // Vélocité audible par défaut
  maxDuration: 4
};

/**
 * Convertit une note MIDI en nom de note (ex: 60 → "C4")
 */
export function midiPitchToNoteName(pitch: number): string {
  if (pitch in MIDI_TO_NOTE_MAP) {
    return MIDI_TO_NOTE_MAP[pitch];
  }
  
  // Fallback: calcul manuel
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const noteIndex = pitch % 12;
  
  return `${noteNames[noteIndex]}${octave}`;
}

/**
 * Convertit un temps en secondes en step (quantifié ou non)
 */
export function timeToStep(timeSeconds: number, options: ConversionOptions): number {
  const stepDurationSeconds = options.stepDurationMs / 1000;
  const rawStep = timeSeconds / stepDurationSeconds;
  
  console.log(`🕐 Conversion temps: ${timeSeconds}s → ${rawStep} (raw) → step duration: ${stepDurationSeconds}s`);
  
  if (options.quantizeToGrid) {
    const quantizedStep = Math.round(rawStep);
    console.log(`📐 Quantifié: ${rawStep} → ${quantizedStep}`);
    return quantizedStep;
  }
  
  return Math.floor(rawStep);
}

/**
 * Convertit une vélocité Magenta (0-1) en vélocité MIDI (1-127)
 */
export function convertVelocity(magentaVelocity: number | undefined, defaultVelocity: number): number {
  console.log(`🔊 Conversion vélocité: ${magentaVelocity} (Magenta) → MIDI`);
  
  if (magentaVelocity === undefined || magentaVelocity === null) {
    console.log(`⚠️ Vélocité undefined/null, utilisation par défaut: ${defaultVelocity}`);
    return defaultVelocity;
  }
  
  // Magenta peut utiliser différents ranges selon le modèle
  let velocity;
  
  if (magentaVelocity <= 1.0) {
    // Range 0-1 (typique MusicVAE)
    velocity = Math.max(1, Math.min(127, Math.round(magentaVelocity * 127)));
  } else if (magentaVelocity <= 127) {
    // Déjà en format MIDI
    velocity = Math.max(1, Math.min(127, Math.round(magentaVelocity)));
  } else {
    // Valeur étrange, utiliser par défaut
    console.warn(`⚠️ Vélocité hors range: ${magentaVelocity}, utilisation par défaut`);
    velocity = defaultVelocity;
  }
  
  console.log(`🎹 Vélocité finale: ${velocity}`);
  return velocity;
}

/**
 * Calcule la durée en steps d'une note
 */
export function calculateDuration(startTime: number, endTime: number, options: ConversionOptions): number {
  const startStep = timeToStep(startTime, options);
  const endStep = timeToStep(endTime, options);
  const duration = Math.max(1, endStep - startStep);
  
  return Math.min(duration, options.maxDuration);
}

/**
 * Convertit une séquence Magenta complète en tableau de NoteEvent
 */
export function convertMagentaSequenceToNoteEvents(
  sequence: MagentaSequence, 
  options: ConversionOptions = DEFAULT_CONVERSION_OPTIONS
): NoteEvent[] {
  const noteEvents: NoteEvent[] = [];
  
  console.log(`🎵 Conversion de ${sequence.notes.length} notes Magenta...`);
  console.log(`⚙️ Options:`, options);
  console.log(`📊 Séquence totalTime: ${sequence.totalTime}s`);
  
  // Fallback : si toutes les notes ont le même startTime, les distribuer
  const allSameTime = sequence.notes.every(note => note.startTime === sequence.notes[0].startTime);
  if (allSameTime && sequence.notes.length > 1) {
    console.warn(`⚠️ Toutes les notes ont le même startTime (${sequence.notes[0].startTime}), distribution automatique`);
  }
  
  sequence.notes.forEach((magentaNote, index) => {
    try {
      console.log(`🔍 Note ${index}:`, magentaNote);
      
      // Convertir la pitch en nom de note
      const noteName = midiPitchToNoteName(magentaNote.pitch);
      
      // Calculer le step de début avec fallback
      let step;
      if (allSameTime && sequence.notes.length > 1) {
        // Distribuer les notes sur la grille si toutes ont le même timing
        step = Math.floor((index / sequence.notes.length) * options.stepCount);
      } else {
        step = timeToStep(magentaNote.startTime, options);
      }
      
      // Vérifier que le step est dans la grille
      if (step < 0 || step >= options.stepCount) {
        console.warn(`⚠️ Note ${index} hors grille (step ${step}), ajustement...`);
        step = Math.max(0, Math.min(step, options.stepCount - 1));
      }
      
      // Calculer la durée avec fallback
      let duration;
      if (magentaNote.endTime <= magentaNote.startTime) {
        console.warn(`⚠️ Note ${index} durée invalide, utilisation durée par défaut`);
        duration = 1;
      } else {
        duration = calculateDuration(magentaNote.startTime, magentaNote.endTime, options);
      }
      
      // Convertir la vélocité avec fallback amélioré
      let velocity = convertVelocity(magentaNote.velocity, options.defaultVelocity);
      
      // Si la vélocité est trop faible, l'augmenter
      if (velocity < 50) {
        console.warn(`⚠️ Vélocité très faible (${velocity}), augmentation à 80`);
        velocity = 80;
      }
      
      // Créer l'événement note
      const noteEvent: NoteEvent = {
        step,
        note: noteName,
        velocity,
        isActive: true,
        duration
      };
      
      noteEvents.push(noteEvent);
      
      console.log(`✅ Note ${index}: ${magentaNote.pitch} → ${noteName} @ step ${step}, durée ${duration}, vélocité ${velocity}`);
      
    } catch (error) {
      console.error(`❌ Erreur conversion note ${index}:`, error);
    }
  });
  
  console.log(`🎯 Conversion terminée: ${noteEvents.length} notes créées`);
  return noteEvents;
}

/**
 * Convertit une note individuelle Magenta en NoteEvent
 */
export function convertMagentaNoteToNoteEvent(
  magentaNote: MagentaNote,
  options: ConversionOptions = DEFAULT_CONVERSION_OPTIONS
): NoteEvent | null {
  try {
    const noteName = midiPitchToNoteName(magentaNote.pitch);
    const step = timeToStep(magentaNote.startTime, options);
    
    if (step < 0 || step >= options.stepCount) {
      return null;
    }
    
    const duration = calculateDuration(magentaNote.startTime, magentaNote.endTime, options);
    const velocity = convertVelocity(magentaNote.velocity, options.defaultVelocity);
    
    return {
      step,
      note: noteName,
      velocity,
      isActive: true,
      duration
    };
    
  } catch (error) {
    console.error('Erreur conversion note individuelle:', error);
    return null;
  }
}

/**
 * Utilitaire pour créer les options de conversion basées sur le contexte du séquenceur
 */
export function createConversionOptions(
  stepCount: number,
  tempo: number,
  noteSpeed: string = '1/16'
): ConversionOptions {
  // Calculer la durée d'un step en fonction du tempo et de la subdivision
  const beatsPerMinute = tempo;
  const millisecondsPerBeat = (60 * 1000) / beatsPerMinute;
  
  let subdivision = 4; // Par défaut 1/16 = 4 subdivisions par beat
  switch (noteSpeed) {
    case '1/8': subdivision = 2; break;
    case '1/16': subdivision = 4; break;
    case '1/32': subdivision = 8; break;
  }
  
  const stepDurationMs = millisecondsPerBeat / subdivision;
  
  console.log(`⚙️ Création options conversion:`);
  console.log(`  - Tempo: ${tempo} BPM`);
  console.log(`  - Note Speed: ${noteSpeed} (subdivision: ${subdivision})`);
  console.log(`  - Ms par beat: ${millisecondsPerBeat}`);
  console.log(`  - Ms par step: ${stepDurationMs}`);
  console.log(`  - Steps total: ${stepCount}`);
  
  const options = {
    stepCount,
    stepDurationMs,
    quantizeToGrid: true,
    defaultVelocity: 100, // Augmenté de 100 pour être plus audible
    maxDuration: Math.min(8, Math.floor(stepCount / 4)) // Max 1/4 de la grille
  };
  
  console.log(`  - Options finales:`, options);
  return options;
}

/**
 * Debug: affiche les informations détaillées d'une conversion
 */
export function debugConversion(sequence: MagentaSequence, options: ConversionOptions): void {
  console.group('🔍 Debug Conversion Magenta → NoteEvent');
  console.log('📊 Séquence Magenta:', {
    totalNotes: sequence.notes.length,
    totalTime: sequence.totalTime,
    firstNote: sequence.notes[0],
    lastNote: sequence.notes[sequence.notes.length - 1]
  });
  console.log('⚙️ Options de conversion:', options);
  console.log('🎵 Mapping des notes:');
  sequence.notes.forEach((note, i) => {
    const noteName = midiPitchToNoteName(note.pitch);
    const step = timeToStep(note.startTime, options);
    console.log(`  ${i}: Pitch ${note.pitch} → ${noteName}, Time ${note.startTime}s → Step ${step}`);
  });
  console.groupEnd();
}