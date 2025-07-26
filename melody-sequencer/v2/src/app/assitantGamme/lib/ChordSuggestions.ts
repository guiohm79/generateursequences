/**
 * ChordSuggestions.ts - Suggestions d'accords avancées pour l'Assistant de Gammes
 * 
 * Cette classe fournit des suggestions d'accords intelligentes basées sur :
 * - Le contexte musical (accords précédents)
 * - Les progressions harmoniques classiques
 * - Les substitutions d'accords
 * - Les accords de tension et extensions
 */

import { ScaleHelper, ChordSuggestion, Scale } from './ScaleHelper';

export interface ExtendedChord extends ChordSuggestion {
  bassNote?: string; // Note de basse pour les inversions
  extensions: string[]; // 7, 9, 11, 13, sus2, sus4, add9, etc.
  substitutions: string[]; // Accords de substitution possibles
  voicing: 'close' | 'open' | 'drop2' | 'drop3'; // Type de voicing
  complexity: 'basic' | 'intermediate' | 'advanced';
  genre: string[]; // Genres musicaux appropriés
}

export interface ChordProgression {
  name: string;
  chords: number[]; // Degrés
  description: string;
  genre: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  emotionalContext: string;
}

export interface VoiceLeading {
  from: string[];
  to: string[];
  movement: 'smooth' | 'contrary' | 'parallel' | 'oblique';
  quality: number; // Score de qualité (0-100)
}

export class ChordSuggestions {
  private scaleHelper: ScaleHelper;
  private lastChord: ExtendedChord | null = null;
  private chordHistory: ExtendedChord[] = [];

  constructor(scaleHelper: ScaleHelper) {
    this.scaleHelper = scaleHelper;
  }

  // === EXTENSIONS D'ACCORDS ===

  /**
   * Générer des extensions pour un accord de base
   */
  generateChordExtensions(baseChord: ChordSuggestion): ExtendedChord[] {
    const extensions: ExtendedChord[] = [];
    const scaleNotes = this.scaleHelper.getScaleNotes();

    // Accord de base
    extensions.push({
      ...baseChord,
      extensions: [],
      substitutions: [],
      voicing: 'close',
      complexity: 'basic',
      genre: ['pop', 'rock', 'folk']
    });

    // Septième
    if (scaleNotes.length >= 7) {
      extensions.push({
        ...baseChord,
        name: baseChord.name + '7',
        notes: [...baseChord.notes, this.getSeventhNote(baseChord)],
        extensions: ['7'],
        substitutions: [],
        voicing: 'close',
        complexity: 'intermediate',
        genre: ['jazz', 'blues', 'pop']
      });
    }

    // Neuvième
    if (scaleNotes.length >= 7) {
      const ninthNote = this.getNinthNote(baseChord);
      if (ninthNote) {
        extensions.push({
          ...baseChord,
          name: baseChord.name + '9',
          notes: [...baseChord.notes, this.getSeventhNote(baseChord), ninthNote],
          extensions: ['7', '9'],
          substitutions: [],
          voicing: 'open',
          complexity: 'advanced',
          genre: ['jazz', 'neo-soul', 'R&B']
        });
      }
    }

    // Sus2 et Sus4
    extensions.push(
      ...this.generateSuspendedChords(baseChord)
    );

    // Add9, Add11, etc.
    extensions.push(
      ...this.generateAddChords(baseChord)
    );

    return extensions;
  }

  /**
   * Obtenir la septième d'un accord
   */
  private getSeventhNote(chord: ChordSuggestion): string {
    const scaleNotes = this.scaleHelper.getScaleNotes();
    const rootIndex = scaleNotes.indexOf(chord.notes[0]);
    return scaleNotes[(rootIndex + 6) % scaleNotes.length];
  }

  /**
   * Obtenir la neuvième d'un accord
   */
  private getNinthNote(chord: ChordSuggestion): string | null {
    const scaleNotes = this.scaleHelper.getScaleNotes();
    const rootIndex = scaleNotes.indexOf(chord.notes[0]);
    if (scaleNotes.length < 7) return null;
    
    // La neuvième correspond à la seconde à l'octave
    const secondDegree = (rootIndex + 1) % scaleNotes.length;
    return scaleNotes[secondDegree];
  }

  /**
   * Générer les accords suspendus (sus2, sus4)
   */
  private generateSuspendedChords(baseChord: ChordSuggestion): ExtendedChord[] {
    const scaleNotes = this.scaleHelper.getScaleNotes();
    const rootIndex = scaleNotes.indexOf(baseChord.notes[0]);
    const suspended: ExtendedChord[] = [];

    // Sus2 (remplace la tierce par la seconde)
    const secondNote = scaleNotes[(rootIndex + 1) % scaleNotes.length];
    suspended.push({
      ...baseChord,
      name: baseChord.notes[0] + 'sus2',
      notes: [baseChord.notes[0], secondNote, baseChord.notes[2]], // Root, 2nd, 5th
      extensions: ['sus2'],
      substitutions: [baseChord.name],
      voicing: 'close',
      complexity: 'intermediate',
      genre: ['rock', 'pop', 'ambient']
    });

    // Sus4 (remplace la tierce par la quarte)
    const fourthNote = scaleNotes[(rootIndex + 3) % scaleNotes.length];
    suspended.push({
      ...baseChord,
      name: baseChord.notes[0] + 'sus4',
      notes: [baseChord.notes[0], fourthNote, baseChord.notes[2]], // Root, 4th, 5th
      extensions: ['sus4'],
      substitutions: [baseChord.name],
      voicing: 'close',
      complexity: 'intermediate',
      genre: ['rock', 'pop', 'ambient']
    });

    return suspended;
  }

  /**
   * Générer les accords add (add9, add11, etc.)
   */
  private generateAddChords(baseChord: ChordSuggestion): ExtendedChord[] {
    const scaleNotes = this.scaleHelper.getScaleNotes();
    const rootIndex = scaleNotes.indexOf(baseChord.notes[0]);
    const addChords: ExtendedChord[] = [];

    // Add9
    const ninthNote = this.getNinthNote(baseChord);
    if (ninthNote) {
      addChords.push({
        ...baseChord,
        name: baseChord.name + 'add9',
        notes: [...baseChord.notes, ninthNote],
        extensions: ['add9'],
        substitutions: [],
        voicing: 'open',
        complexity: 'intermediate',
        genre: ['pop', 'indie', 'alternative']
      });
    }

    return addChords;
  }

  // === PROGRESSIONS CONTEXTUELLES ===

  /**
   * Suggérer le prochain accord basé sur l'historique
   */
  suggestNextChord(): ExtendedChord[] {
    if (this.chordHistory.length === 0) {
      return this.getTonicChords();
    }

    const lastChord = this.chordHistory[this.chordHistory.length - 1];
    const suggestions: ExtendedChord[] = [];

    // Basé sur la fonction harmonique du dernier accord
    switch (lastChord.function) {
      case 'tonic':
        suggestions.push(...this.getFromTonicSuggestions());
        break;
      case 'subdominant':
        suggestions.push(...this.getFromSubdominantSuggestions());
        break;
      case 'dominant':
        suggestions.push(...this.getFromDominantSuggestions());
        break;
      default:
        suggestions.push(...this.getGeneralSuggestions());
    }

    return this.filterByVoiceLeading(suggestions, lastChord);
  }

  /**
   * Accords de tonique pour commencer
   */
  private getTonicChords(): ExtendedChord[] {
    const baseChords = this.scaleHelper.getChordSuggestions();
    const tonicChord = baseChords.find(c => c.function === 'tonic');
    
    if (!tonicChord) return [];
    
    return this.generateChordExtensions(tonicChord).filter(c => 
      c.complexity === 'basic' || c.complexity === 'intermediate'
    );
  }

  /**
   * Suggestions depuis la tonique
   */
  private getFromTonicSuggestions(): ExtendedChord[] {
    const baseChords = this.scaleHelper.getChordSuggestions();
    const suggestions: ExtendedChord[] = [];

    // I → vi (relative minor)
    const submediant = baseChords.find(c => c.function === 'submediant');
    if (submediant) {
      suggestions.push(...this.generateChordExtensions(submediant));
    }

    // I → IV (subdominant)
    const subdominant = baseChords.find(c => c.function === 'subdominant');
    if (subdominant) {
      suggestions.push(...this.generateChordExtensions(subdominant));
    }

    // I → V (dominant)
    const dominant = baseChords.find(c => c.function === 'dominant');
    if (dominant) {
      suggestions.push(...this.generateChordExtensions(dominant));
    }

    return suggestions;
  }

  /**
   * Suggestions depuis la sous-dominante
   */
  private getFromSubdominantSuggestions(): ExtendedChord[] {
    const baseChords = this.scaleHelper.getChordSuggestions();
    const suggestions: ExtendedChord[] = [];

    // IV → V (très commun)
    const dominant = baseChords.find(c => c.function === 'dominant');
    if (dominant) {
      suggestions.push(...this.generateChordExtensions(dominant));
    }

    // IV → I (résolution)
    const tonic = baseChords.find(c => c.function === 'tonic');
    if (tonic) {
      suggestions.push(...this.generateChordExtensions(tonic));
    }

    // IV → vi
    const submediant = baseChords.find(c => c.function === 'submediant');
    if (submediant) {
      suggestions.push(...this.generateChordExtensions(submediant));
    }

    return suggestions;
  }

  /**
   * Suggestions depuis la dominante
   */
  private getFromDominantSuggestions(): ExtendedChord[] {
    const baseChords = this.scaleHelper.getChordSuggestions();
    const suggestions: ExtendedChord[] = [];

    // V → I (résolution classique)
    const tonic = baseChords.find(c => c.function === 'tonic');
    if (tonic) {
      suggestions.push(...this.generateChordExtensions(tonic));
    }

    // V → vi (déception)
    const submediant = baseChords.find(c => c.function === 'submediant');
    if (submediant) {
      suggestions.push(...this.generateChordExtensions(submediant));
    }

    return suggestions;
  }

  /**
   * Suggestions générales
   */
  private getGeneralSuggestions(): ExtendedChord[] {
    const baseChords = this.scaleHelper.getChordSuggestions();
    return baseChords.flatMap(chord => this.generateChordExtensions(chord));
  }

  // === VOICE LEADING ===

  /**
   * Filtrer les suggestions par voice leading
   */
  private filterByVoiceLeading(suggestions: ExtendedChord[], fromChord: ExtendedChord): ExtendedChord[] {
    return suggestions
      .map(suggestion => ({
        chord: suggestion,
        voiceLeading: this.analyzeVoiceLeading(fromChord, suggestion)
      }))
      .filter(item => item.voiceLeading.quality >= 60) // Seuil de qualité
      .sort((a, b) => b.voiceLeading.quality - a.voiceLeading.quality)
      .map(item => item.chord);
  }

  /**
   * Analyser le voice leading entre deux accords
   */
  private analyzeVoiceLeading(from: ExtendedChord, to: ExtendedChord): VoiceLeading {
    const fromNotes = from.notes;
    const toNotes = to.notes;
    
    // Calculer les mouvements de voix
    let smoothMovements = 0;
    let totalMovement = 0;

    for (let i = 0; i < Math.min(fromNotes.length, toNotes.length); i++) {
      const fromNote = fromNotes[i];
      const toNote = toNotes[i];
      
      if (fromNote === toNote) {
        smoothMovements += 2; // Note commune = excellent
      } else {
        const movement = this.calculateInterval(fromNote, toNote);
        if (movement <= 2) {
          smoothMovements += 1; // Mouvement par degrés conjoints = bon
        }
        totalMovement += movement;
      }
    }

    // Score de qualité (0-100)
    const quality = Math.min(100, (smoothMovements / fromNotes.length) * 50 + 
                            Math.max(0, 50 - totalMovement * 5));

    return {
      from: fromNotes,
      to: toNotes,
      movement: this.classifyMovement(fromNotes, toNotes),
      quality: Math.round(quality)
    };
  }

  /**
   * Calculer l'intervalle entre deux notes
   */
  private calculateInterval(note1: string, note2: string): number {
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index1 = chromaticNotes.indexOf(note1);
    const index2 = chromaticNotes.indexOf(note2);
    
    if (index1 === -1 || index2 === -1) return 12; // Pénalité pour notes inconnues
    
    return Math.min(
      Math.abs(index2 - index1),
      12 - Math.abs(index2 - index1)
    );
  }

  /**
   * Classifier le type de mouvement
   */
  private classifyMovement(from: string[], to: string[]): VoiceLeading['movement'] {
    // Simplification : on regarde juste la tendance générale
    let upward = 0;
    let downward = 0;
    let same = 0;

    for (let i = 0; i < Math.min(from.length, to.length); i++) {
      const interval = this.calculateInterval(from[i], to[i]);
      if (interval === 0) same++;
      else if (interval > 0) upward++;
      else downward++;
    }

    if (same > upward && same > downward) return 'oblique';
    if (upward > downward) return 'parallel';
    if (downward > upward) return 'contrary';
    return 'smooth';
  }

  // === PROGRESSIONS PRÉDÉFINIES ===

  /**
   * Obtenir les progressions classiques pour différents genres
   */
  getClassicProgressions(): ChordProgression[] {
    const currentScale = this.scaleHelper.getCurrentScale();
    const isMajor = currentScale.id === 'major';

    if (isMajor) {
      return [
        {
          name: 'Pop Progression',
          chords: [1, 5, 6, 4],
          description: 'I-V-vi-IV - La progression pop ultime',
          genre: ['pop', 'rock', 'country'],
          difficulty: 'beginner',
          emotionalContext: 'Optimiste et accrocheur'
        },
        {
          name: 'Jazz II-V-I',
          chords: [2, 5, 1],
          description: 'ii-V-I - La progression jazz fondamentale',
          genre: ['jazz', 'latin', 'bossa nova'],
          difficulty: 'intermediate',
          emotionalContext: 'Sophistiqué et résolutif'
        },
        {
          name: 'Circle of Fifths',
          chords: [3, 6, 2, 5, 1],
          description: 'iii-vi-ii-V-I - Progression harmoniquement riche',
          genre: ['jazz', 'classical'],
          difficulty: 'advanced',
          emotionalContext: 'Fluide et élégant'
        },
        {
          name: 'Axis Progression',
          chords: [6, 4, 1, 5],
          description: 'vi-IV-I-V - Alternative moderne au I-V-vi-IV',
          genre: ['indie', 'alternative', 'pop'],
          difficulty: 'beginner',
          emotionalContext: 'Mélancolique mais résolutif'
        }
      ];
    } else {
      return [
        {
          name: 'Minor Epic',
          chords: [1, 7, 6, 7],
          description: 'i-VII-VI-VII - Progression épique moderne',
          genre: ['rock', 'metal', 'cinematic'],
          difficulty: 'beginner',
          emotionalContext: 'Puissant et dramatique'
        },
        {
          name: 'Andalusian Cadence',
          chords: [1, 7, 6, 5],
          description: 'i-VII-VI-V - Cadence espagnole classique',
          genre: ['flamenco', 'classical', 'metal'],
          difficulty: 'intermediate',
          emotionalContext: 'Exotique et passionné'
        },
        {
          name: 'Minor Jazz',
          chords: [1, 4, 5, 1],
          description: 'i-iv-V-i - Progression jazz mineure',
          genre: ['jazz', 'blues', 'latin'],
          difficulty: 'intermediate',
          emotionalContext: 'Sombre mais résolutif'
        }
      ];
    }
  }

  // === GESTION DE L'HISTORIQUE ===

  /**
   * Ajouter un accord à l'historique
   */
  addChordToHistory(chord: ExtendedChord): void {
    this.chordHistory.push(chord);
    this.lastChord = chord;
    
    // Garder seulement les 8 derniers accords
    if (this.chordHistory.length > 8) {
      this.chordHistory.shift();
    }
  }

  /**
   * Effacer l'historique
   */
  clearHistory(): void {
    this.chordHistory = [];
    this.lastChord = null;
  }

  /**
   * Obtenir l'historique des accords
   */
  getChordHistory(): ExtendedChord[] {
    return [...this.chordHistory];
  }
}

export default ChordSuggestions;