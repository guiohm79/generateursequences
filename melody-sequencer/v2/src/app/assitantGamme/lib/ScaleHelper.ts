/**
 * ScaleHelper.ts - Logique musicale centrale pour l'Assistant de Gammes
 * 
 * Cette classe fournit toutes les fonctionnalités de base pour :
 * - Définition et gestion des gammes
 * - Calcul des degrés et intervalles
 * - Fonctions harmoniques
 * - Validation des notes dans une gamme
 */

// Types de base
export interface Scale {
  id: string;
  name: string;
  intervals: number[]; // Intervalles en demi-tons depuis la tonique
  description: string;
  mood: string;
}

export interface ScaleDegree {
  degree: number; // 1-7 (I, II, III, IV, V, VI, VII)
  romanNumeral: string;
  name: string;
  function: 'tonic' | 'subdominant' | 'dominant' | 'mediant' | 'submediant' | 'leading' | 'supertonic';
  quality: 'major' | 'minor' | 'diminished' | 'augmented';
}

export interface Note {
  name: string; // 'C', 'C#', 'D', etc.
  octave: number;
  midiNumber: number;
}

export interface ChordSuggestion {
  name: string;
  notes: string[];
  degree: number;
  function: string;
  quality: string;
  tension?: string; // '7', '9', 'sus4', etc.
}

// Notes chromatiques de base
export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

// Gammes prédéfinies (intervalles en demi-tons)
export const SCALES: Record<string, Scale> = {
  major: {
    id: 'major',
    name: 'Majeure',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: 'Gamme majeure classique - joyeuse et lumineuse',
    mood: 'happy'
  },
  minor: {
    id: 'minor',
    name: 'Mineure naturelle',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: 'Gamme mineure naturelle - mélancolique et expressive',
    mood: 'sad'
  },
  dorian: {
    id: 'dorian',
    name: 'Dorien',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: 'Mode dorien - mystérieux avec une 6te majeure',
    mood: 'mysterious'
  },
  phrygian: {
    id: 'phrygian',
    name: 'Phrygien',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    description: 'Mode phrygien - sombre et exotique',
    mood: 'dark'
  },
  lydian: {
    id: 'lydian',
    name: 'Lydien',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    description: 'Mode lydien - éthéré avec une 4te augmentée',
    mood: 'dreamy'
  },
  mixolydian: {
    id: 'mixolydian',
    name: 'Mixolydien',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    description: 'Mode mixolydien - blues et rock avec 7e mineure',
    mood: 'groovy'
  },
  locrian: {
    id: 'locrian',
    name: 'Locrien',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    description: 'Mode locrien - instable et dissonant',
    mood: 'unstable'
  },
  harmonicMinor: {
    id: 'harmonicMinor',
    name: 'Mineure harmonique',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: 'Mineure harmonique - dramatique avec 7e majeure',
    mood: 'dramatic'
  },
  melodicMinor: {
    id: 'melodicMinor',
    name: 'Mineure mélodique',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    description: 'Mineure mélodique - élégante et jazzy',
    mood: 'elegant'
  },
  pentatonic: {
    id: 'pentatonic',
    name: 'Pentatonique majeure',
    intervals: [0, 2, 4, 7, 9],
    description: 'Pentatonique majeure - simple et universelle',
    mood: 'simple'
  },
  pentatonicMinor: {
    id: 'pentatonicMinor',
    name: 'Pentatonique mineure',
    intervals: [0, 3, 5, 7, 10],
    description: 'Pentatonique mineure - blues et rock',
    mood: 'bluesy'
  },
  blues: {
    id: 'blues',
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    description: 'Gamme blues avec blue notes',
    mood: 'bluesy'
  }
};

export class ScaleHelper {
  private currentScale: Scale;
  private currentRoot: string;
  
  constructor(scaleId: string = 'major', root: string = 'C') {
    this.currentScale = SCALES[scaleId] || SCALES.major;
    this.currentRoot = root;
  }

  // === GESTION DES GAMMES ===
  
  /**
   * Changer la gamme courante
   */
  setScale(scaleId: string): void {
    if (SCALES[scaleId]) {
      this.currentScale = SCALES[scaleId];
    }
  }

  /**
   * Changer la tonique
   */
  setRoot(root: string): void {
    this.currentRoot = root;
  }

  /**
   * Obtenir la gamme courante
   */
  getCurrentScale(): Scale {
    return this.currentScale;
  }

  /**
   * Obtenir la tonique courante
   */
  getCurrentRoot(): string {
    return this.currentRoot;
  }

  // === CALCULS MUSICAUX ===

  /**
   * Obtenir l'index d'une note dans le cercle chromatique
   */
  private getNoteIndex(note: string): number {
    return CHROMATIC_NOTES.indexOf(note as any);
  }

  /**
   * Obtenir les notes de la gamme courante
   */
  getScaleNotes(): string[] {
    const rootIndex = this.getNoteIndex(this.currentRoot);
    if (rootIndex === -1) return [];

    return this.currentScale.intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return CHROMATIC_NOTES[noteIndex];
    });
  }

  /**
   * Vérifier si une note appartient à la gamme courante
   */
  isNoteInScale(note: string): boolean {
    const scaleNotes = this.getScaleNotes();
    return scaleNotes.includes(note);
  }

  /**
   * Obtenir le degré d'une note dans la gamme (1-7, ou -1 si pas dans la gamme)
   */
  getNoteDegree(note: string): number {
    const scaleNotes = this.getScaleNotes();
    const index = scaleNotes.indexOf(note);
    return index === -1 ? -1 : index + 1;
  }

  /**
   * Obtenir la note la plus proche dans la gamme
   */
  getClosestScaleNote(note: string): string {
    if (this.isNoteInScale(note)) return note;

    const noteIndex = this.getNoteIndex(note);
    if (noteIndex === -1) return this.currentRoot;

    const scaleNotes = this.getScaleNotes();
    const scaleIndices = scaleNotes.map(n => this.getNoteIndex(n));

    // Trouver l'index le plus proche
    let closestDistance = 12;
    let closestNote = this.currentRoot;

    for (const scaleNote of scaleNotes) {
      const scaleIndex = this.getNoteIndex(scaleNote);
      const distance = Math.min(
        Math.abs(noteIndex - scaleIndex),
        12 - Math.abs(noteIndex - scaleIndex)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestNote = scaleNote;
      }
    }

    return closestNote;
  }

  // === THÉORIE MUSICALE ===

  /**
   * Obtenir les degrés de la gamme avec leurs propriétés
   */
  getScaleDegrees(): ScaleDegree[] {
    const scaleNotes = this.getScaleNotes();
    const degrees: ScaleDegree[] = [];

    // Définir les propriétés selon le type de gamme
    const isMajor = this.currentScale.id === 'major';
    const isMinor = this.currentScale.id === 'minor';

    scaleNotes.forEach((note, index) => {
      const degree = index + 1;
      let romanNumeral: string;
      let name: string;
      let func: ScaleDegree['function'];
      let quality: ScaleDegree['quality'];

      // Définir les propriétés selon le degré
      switch (degree) {
        case 1:
          romanNumeral = isMajor ? 'I' : 'i';
          name = 'Tonique';
          func = 'tonic';
          quality = isMajor ? 'major' : 'minor';
          break;
        case 2:
          romanNumeral = isMajor ? 'ii' : 'ii°';
          name = 'Sus-tonique';
          func = 'supertonic';
          quality = isMajor ? 'minor' : 'diminished';
          break;
        case 3:
          romanNumeral = isMajor ? 'iii' : 'III';
          name = 'Médiante';
          func = 'mediant';
          quality = isMajor ? 'minor' : 'major';
          break;
        case 4:
          romanNumeral = isMajor ? 'IV' : 'iv';
          name = 'Sous-dominante';
          func = 'subdominant';
          quality = isMajor ? 'major' : 'minor';
          break;
        case 5:
          romanNumeral = isMajor ? 'V' : 'v';
          name = 'Dominante';
          func = 'dominant';
          quality = isMajor ? 'major' : 'minor';
          break;
        case 6:
          romanNumeral = isMajor ? 'vi' : 'VI';
          name = 'Sus-dominante';
          func = 'submediant';
          quality = isMajor ? 'minor' : 'major';
          break;
        case 7:
          romanNumeral = isMajor ? 'vii°' : 'VII';
          name = 'Sensible';
          func = 'leading';
          quality = isMajor ? 'diminished' : 'major';
          break;
        default:
          romanNumeral = 'I';
          name = 'Tonique';
          func = 'tonic';
          quality = 'major';
      }

      degrees.push({
        degree,
        romanNumeral,
        name,
        function: func,
        quality
      });
    });

    return degrees;
  }

  /**
   * Obtenir les suggestions d'accords pour la gamme courante
   */
  getChordSuggestions(): ChordSuggestion[] {
    const scaleNotes = this.getScaleNotes();
    const degrees = this.getScaleDegrees();
    const suggestions: ChordSuggestion[] = [];

    degrees.forEach((degree, index) => {
      // Accord triade de base (1-3-5)
      const root = scaleNotes[index];
      const third = scaleNotes[(index + 2) % scaleNotes.length];
      const fifth = scaleNotes[(index + 4) % scaleNotes.length];

      suggestions.push({
        name: `${root}${degree.quality === 'minor' ? 'm' : degree.quality === 'diminished' ? '°' : ''}`,
        notes: [root, third, fifth],
        degree: degree.degree,
        function: degree.function,
        quality: degree.quality
      });

      // Accord septième si applicable
      if (scaleNotes.length >= 7) {
        const seventh = scaleNotes[(index + 6) % scaleNotes.length];
        const seventhQuality = degree.quality === 'major' ? '7' : degree.quality === 'minor' ? 'm7' : 'dim7';
        
        suggestions.push({
          name: `${root}${degree.quality === 'minor' ? 'm' : degree.quality === 'diminished' ? '°' : ''}${seventhQuality}`,
          notes: [root, third, fifth, seventh],
          degree: degree.degree,
          function: degree.function,
          quality: degree.quality,
          tension: '7'
        });
      }
    });

    return suggestions;
  }

  /**
   * Obtenir les progressions d'accords populaires pour la gamme courante
   */
  getPopularProgressions(): Array<{name: string, degrees: number[], description: string}> {
    const isMajor = this.currentScale.id === 'major';
    
    if (isMajor) {
      return [
        { name: 'I-V-vi-IV', degrees: [1, 5, 6, 4], description: 'Progression pop classique' },
        { name: 'vi-IV-I-V', degrees: [6, 4, 1, 5], description: 'Progression alternative populaire' },
        { name: 'I-vi-IV-V', degrees: [1, 6, 4, 5], description: 'Progression des années 50' },
        { name: 'ii-V-I', degrees: [2, 5, 1], description: 'Progression jazz classique' },
        { name: 'I-IV-V', degrees: [1, 4, 5], description: 'Progression blues/rock de base' }
      ];
    } else {
      return [
        { name: 'i-VII-VI-VII', degrees: [1, 7, 6, 7], description: 'Progression mineure moderne' },
        { name: 'i-iv-V-i', degrees: [1, 4, 5, 1], description: 'Progression mineure classique' },
        { name: 'i-VI-III-VII', degrees: [1, 6, 3, 7], description: 'Progression gothique' },
        { name: 'i-v-iv-i', degrees: [1, 5, 4, 1], description: 'Progression folk mineure' }
      ];
    }
  }

  // === UTILITAIRES ===

  /**
   * Obtenir les gammes disponibles
   */
  static getAvailableScales(): Scale[] {
    return Object.values(SCALES);
  }

  /**
   * Convertir une note avec octave (ex: "C4") en nom de note seule (ex: "C")
   */
  static extractNoteName(noteWithOctave: string): string {
    return noteWithOctave.replace(/\d+$/, '');
  }

  /**
   * Convertir une note en format MIDI number
   */
  static noteToMidiNumber(note: string, octave: number): number {
    const noteIndex = CHROMATIC_NOTES.indexOf(note as any);
    if (noteIndex === -1) return 60; // C4 par défaut
    return (octave + 1) * 12 + noteIndex;
  }

  /**
   * Convertir un MIDI number en note avec octave
   */
  static midiNumberToNote(midiNumber: number): { note: string, octave: number } {
    const noteIndex = midiNumber % 12;
    const octave = Math.floor(midiNumber / 12) - 1;
    return {
      note: CHROMATIC_NOTES[noteIndex],
      octave
    };
  }
}

export default ScaleHelper;