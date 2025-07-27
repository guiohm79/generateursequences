/**
 * MusicalTheory.ts - Théorie musicale et analyse pour l'Assistant de Gammes
 * 
 * Cette classe fournit des outils d'analyse musicale avancés :
 * - Analyse harmonique des séquences
 * - Identification des modulations
 * - Suggestions pédagogiques
 * - Analyse des tensions et résolutions
 * - Détection des patterns mélodiques
 */

import { ScaleHelper, Scale, ChordSuggestion } from './ScaleHelper';
import { ChordSuggestions, ExtendedChord } from './ChordSuggestions';

export interface MusicalAnalysis {
  key: string;
  scale: string;
  confidence: number; // 0-100%
  suggestions: string[];
  warnings: string[];
  mood: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

export interface HarmonicAnalysis {
  chordProgressions: Array<{
    chords: string[];
    analysis: string;
    strength: number;
  }>;
  tonicality: number; // Force de la tonalité (0-100)
  modulations: Array<{
    fromKey: string;
    toKey: string;
    position: number;
    type: 'direct' | 'pivot' | 'chromatic';
  }>;
  tensions: Array<{
    position: number;
    type: 'leading_tone' | 'diminished' | 'augmented' | 'tritone';
    resolution: string;
  }>;
}

export interface MelodicAnalysis {
  contour: 'ascending' | 'descending' | 'arch' | 'inverted_arch' | 'static';
  range: number; // En demi-tons
  averageInterval: number;
  stepwiseMotion: number; // Pourcentage de mouvement par degrés conjoints
  leaps: Array<{
    from: string;
    to: string;
    interval: number;
    position: number;
  }>;
  sequences: Array<{
    pattern: string[];
    repetitions: number;
    transposition: number;
  }>;
  climax: {
    note: string;
    position: number;
  };
}

export interface PedagogicalTip {
  topic: string;
  explanation: string;
  example: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'harmony' | 'melody' | 'rhythm' | 'theory';
}

export interface NoteEvent {
  step: number;
  note: string;
  velocity: number;
  duration: number;
  isActive: boolean;
}

export class MusicalTheory {
  private scaleHelper: ScaleHelper;
  private chordSuggestions: ChordSuggestions;

  constructor(scaleHelper: ScaleHelper) {
    this.scaleHelper = scaleHelper;
    this.chordSuggestions = new ChordSuggestions(scaleHelper);
  }

  // === ANALYSE GÉNÉRALE ===

  /**
   * Analyser une séquence de notes complète
   */
  analyzeSequence(notes: NoteEvent[]): MusicalAnalysis {
    if (notes.length === 0) {
      return {
        key: 'C',
        scale: 'major',
        confidence: 0,
        suggestions: ['Ajoutez des notes pour commencer l\'analyse'],
        warnings: [],
        mood: 'neutral',
        complexity: 'beginner'
      };
    }

    const noteNames = notes.map(n => ScaleHelper.extractNoteName(n.note));
    const uniqueNotes = Array.from(new Set(noteNames));

    // Détecter la tonalité la plus probable
    const keyAnalysis = this.detectKey(uniqueNotes);
    
    // Analyser la complexité
    const complexity = this.analyzeComplexity(notes);
    
    // Générer des suggestions
    const suggestions = this.generateSuggestions(notes, keyAnalysis);
    
    // Détecter les avertissements
    const warnings = this.detectWarnings(notes, keyAnalysis);

    return {
      key: keyAnalysis.key,
      scale: keyAnalysis.scale,
      confidence: keyAnalysis.confidence,
      suggestions,
      warnings,
      mood: this.analyzeMood(keyAnalysis.scale, notes),
      complexity
    };
  }

  /**
   * Détecter la tonalité la plus probable
   */
  private detectKey(notes: string[]): { key: string; scale: string; confidence: number } {
    const scales = ScaleHelper.getAvailableScales();
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    let bestMatch = { key: 'C', scale: 'major', confidence: 0 };

    // Tester chaque combinaison tonalité/gamme
    for (const root of chromaticNotes) {
      for (const scale of scales) {
        const tempHelper = new ScaleHelper(scale.id, root);
        const scaleNotes = tempHelper.getScaleNotes();
        
        // Compter les notes qui correspondent
        const matches = notes.filter(note => scaleNotes.includes(note)).length;
        const confidence = (matches / notes.length) * 100;
        
        if (confidence > bestMatch.confidence) {
          bestMatch = { key: root, scale: scale.id, confidence };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Analyser la complexité musicale
   */
  private analyzeComplexity(notes: NoteEvent[]): 'beginner' | 'intermediate' | 'advanced' {
    const uniqueNotes = new Set(notes.map(n => ScaleHelper.extractNoteName(n.note))).size;
    const rhythmicComplexity = this.analyzeRhythmicComplexity(notes);
    const harmonicComplexity = uniqueNotes;

    const totalComplexity = rhythmicComplexity + harmonicComplexity;

    if (totalComplexity <= 8) return 'beginner';
    if (totalComplexity <= 15) return 'intermediate';
    return 'advanced';
  }

  /**
   * Analyser la complexité rythmique
   */
  private analyzeRhythmicComplexity(notes: NoteEvent[]): number {
    const durations = notes.map(n => n.duration);
    const uniqueDurations = new Set(durations).size;
    const syncopation = this.detectSyncopation(notes);
    
    return uniqueDurations + (syncopation ? 5 : 0);
  }

  /**
   * Détecter la syncope
   */
  private detectSyncopation(notes: NoteEvent[]): boolean {
    // Simplifié : chercher des notes qui commencent sur des temps faibles
    return notes.some(note => (note.step % 4) === 1 || (note.step % 4) === 3);
  }

  /**
   * Analyser l'humeur/mood
   */
  private analyzeMood(scaleId: string, notes: NoteEvent[]): string {
    const scale = ScaleHelper.getAvailableScales().find(s => s.id === scaleId);
    if (!scale) return 'neutral';

    // Facteurs d'humeur
    const scaleMood = scale.mood;
    const velocityAvg = notes.reduce((sum, n) => sum + n.velocity, 0) / notes.length;
    const rhythmicDensity = notes.length;

    // Combiner les facteurs
    if (scaleMood === 'happy' && velocityAvg > 100) return 'joyful';
    if (scaleMood === 'sad' && velocityAvg < 80) return 'melancholic';
    if (scaleMood === 'dark' && rhythmicDensity > 10) return 'intense';
    if (scaleMood === 'mysterious') return 'enigmatic';

    return scaleMood;
  }

  // === ANALYSE HARMONIQUE ===

  /**
   * Analyser l'harmonie d'une séquence
   */
  analyzeHarmony(notes: NoteEvent[]): HarmonicAnalysis {
    const chordProgressions = this.identifyChordProgressions(notes);
    const tonicality = this.calculateTonicality(notes);
    const modulations = this.detectModulations(notes);
    const tensions = this.analyzeTensions(notes);

    return {
      chordProgressions,
      tonicality,
      modulations,
      tensions
    };
  }

  /**
   * Identifier les progressions d'accords
   */
  private identifyChordProgressions(notes: NoteEvent[]): HarmonicAnalysis['chordProgressions'] {
    // Grouper les notes par segments temporels
    const segments = this.groupNotesByTime(notes, 4); // Groupes de 4 steps
    const progressions: HarmonicAnalysis['chordProgressions'] = [];

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const segmentNotes = segment.map(n => ScaleHelper.extractNoteName(n.note));
      
      // Identifier l'accord potentiel
      const chord = this.identifyChord(segmentNotes);
      if (chord) {
        const nextSegment = segments[i + 1];
        const nextChord = this.identifyChord(nextSegment.map(n => ScaleHelper.extractNoteName(n.note)));
        
        if (nextChord) {
          progressions.push({
            chords: [chord.name, nextChord.name],
            analysis: this.analyzeChordProgression(chord, nextChord),
            strength: this.calculateProgressionStrength(chord, nextChord)
          });
        }
      }
    }

    return progressions;
  }

  /**
   * Grouper les notes par segments temporels
   */
  private groupNotesByTime(notes: NoteEvent[], segmentSize: number): NoteEvent[][] {
    const segments: NoteEvent[][] = [];
    const maxStep = Math.max(...notes.map(n => n.step));

    for (let step = 0; step <= maxStep; step += segmentSize) {
      const segment = notes.filter(n => n.step >= step && n.step < step + segmentSize);
      if (segment.length > 0) {
        segments.push(segment);
      }
    }

    return segments;
  }

  /**
   * Identifier un accord à partir de notes
   */
  private identifyChord(noteNames: string[]): ChordSuggestion | null {
    const uniqueNotes = Array.from(new Set(noteNames));
    if (uniqueNotes.length < 2) return null;

    // Essayer de matcher avec les accords de la gamme courante
    const chords = this.scaleHelper.getChordSuggestions();
    
    for (const chord of chords) {
      const chordNotes = chord.notes.slice(0, 3); // Triade de base
      const matches = chordNotes.filter(note => uniqueNotes.includes(note)).length;
      
      if (matches >= 2) { // Au moins 2 notes correspondent
        return chord;
      }
    }

    return null;
  }

  /**
   * Analyser une progression d'accords
   */
  private analyzeChordProgression(chord1: ChordSuggestion, chord2: ChordSuggestion): string {
    const degree1 = chord1.degree;
    const degree2 = chord2.degree;

    // Progressions classiques
    if (degree1 === 1 && degree2 === 5) return 'I-V: Mouvement vers la dominante';
    if (degree1 === 5 && degree2 === 1) return 'V-I: Résolution authentique';
    if (degree1 === 4 && degree2 === 5) return 'IV-V: Préparation de la dominante';
    if (degree1 === 6 && degree2 === 4) return 'vi-IV: Progression moderne populaire';
    if (degree1 === 2 && degree2 === 5) return 'ii-V: Progression jazz classique';

    return `${degree1}-${degree2}: Progression libre`;
  }

  /**
   * Calculer la force d'une progression
   */
  private calculateProgressionStrength(chord1: ChordSuggestion, chord2: ChordSuggestion): number {
    const degree1 = chord1.degree;
    const degree2 = chord2.degree;

    // Forces relatives des progressions
    const progressionStrengths: Record<string, number> = {
      '5-1': 100, // V-I = résolution parfaite
      '4-5': 90,  // IV-V = forte préparation
      '2-5': 85,  // ii-V = classique jazz
      '1-5': 80,  // I-V = établit la dominante
      '6-4': 75,  // vi-IV = moderne
      '1-6': 70,  // I-vi = déceptif
      '5-6': 65   // V-vi = déception
    };

    const key = `${degree1}-${degree2}`;
    return progressionStrengths[key] || 50; // Force moyenne par défaut
  }

  /**
   * Calculer la force de la tonalité
   */
  private calculateTonicality(notes: NoteEvent[]): number {
    const noteNames = notes.map(n => ScaleHelper.extractNoteName(n.note));
    const scaleNotes = this.scaleHelper.getScaleNotes();
    
    // Compter les notes dans la gamme
    const inScaleCount = noteNames.filter(note => scaleNotes.includes(note)).length;
    
    return Math.round((inScaleCount / noteNames.length) * 100);
  }

  /**
   * Détecter les modulations
   */
  private detectModulations(notes: NoteEvent[]): HarmonicAnalysis['modulations'] {
    // Simplification : analyser par segments et détecter les changements de tonalité
    const segments = this.groupNotesByTime(notes, 8);
    const modulations: HarmonicAnalysis['modulations'] = [];

    for (let i = 0; i < segments.length - 1; i++) {
      const segment1Notes = segments[i].map(n => ScaleHelper.extractNoteName(n.note));
      const segment2Notes = segments[i + 1].map(n => ScaleHelper.extractNoteName(n.note));

      const key1 = this.detectKey(Array.from(new Set(segment1Notes)));
      const key2 = this.detectKey(Array.from(new Set(segment2Notes)));

      if (key1.key !== key2.key && key1.confidence > 70 && key2.confidence > 70) {
        modulations.push({
          fromKey: `${key1.key} ${key1.scale}`,
          toKey: `${key2.key} ${key2.scale}`,
          position: segments[i + 1][0].step,
          type: 'direct' // Simplification
        });
      }
    }

    return modulations;
  }

  /**
   * Analyser les tensions harmoniques
   */
  private analyzeTensions(notes: NoteEvent[]): HarmonicAnalysis['tensions'] {
    const tensions: HarmonicAnalysis['tensions'] = [];
    const scaleNotes = this.scaleHelper.getScaleNotes();

    notes.forEach(note => {
      const noteName = ScaleHelper.extractNoteName(note.note);
      
      // Chercher les tensions (notes hors gamme)
      if (!scaleNotes.includes(noteName)) {
        tensions.push({
          position: note.step,
          type: 'chromatic' as any, // Simplification
          resolution: this.scaleHelper.getClosestScaleNote(noteName)
        });
      }
    });

    return tensions;
  }

  // === ANALYSE MÉLODIQUE ===

  /**
   * Analyser la mélodie
   */
  analyzeMelody(notes: NoteEvent[]): MelodicAnalysis {
    if (notes.length < 2) {
      return {
        contour: 'static',
        range: 0,
        averageInterval: 0,
        stepwiseMotion: 0,
        leaps: [],
        sequences: [],
        climax: { note: notes[0]?.note || 'C4', position: 0 }
      };
    }

    const sortedNotes = [...notes].sort((a, b) => a.step - b.step);
    
    return {
      contour: this.analyzeContour(sortedNotes),
      range: this.calculateRange(sortedNotes),
      averageInterval: this.calculateAverageInterval(sortedNotes),
      stepwiseMotion: this.calculateStepwiseMotion(sortedNotes),
      leaps: this.identifyLeaps(sortedNotes),
      sequences: this.identifySequences(sortedNotes),
      climax: this.findClimax(sortedNotes)
    };
  }

  /**
   * Analyser le contour mélodique
   */
  private analyzeContour(notes: NoteEvent[]): MelodicAnalysis['contour'] {
    if (notes.length < 3) return 'static';

    const midiNumbers = notes.map(n => {
      const noteName = ScaleHelper.extractNoteName(n.note);
      const octave = parseInt(n.note.replace(noteName, '')) || 4;
      return ScaleHelper.noteToMidiNumber(noteName, octave);
    });

    const start = midiNumbers[0];
    const end = midiNumbers[midiNumbers.length - 1];
    const highest = Math.max(...midiNumbers);
    const lowest = Math.min(...midiNumbers);
    const highestIndex = midiNumbers.indexOf(highest);
    const lowestIndex = midiNumbers.indexOf(lowest);

    // Analyser la forme générale
    if (highestIndex < midiNumbers.length / 2 && end < start) return 'inverted_arch';
    if (highestIndex > midiNumbers.length / 2 && end > start) return 'arch';
    if (end > start + 2) return 'ascending';
    if (end < start - 2) return 'descending';

    return 'static';
  }

  /**
   * Calculer l'étendue mélodique
   */
  private calculateRange(notes: NoteEvent[]): number {
    const midiNumbers = notes.map(n => {
      const noteName = ScaleHelper.extractNoteName(n.note);
      const octave = parseInt(n.note.replace(noteName, '')) || 4;
      return ScaleHelper.noteToMidiNumber(noteName, octave);
    });

    return Math.max(...midiNumbers) - Math.min(...midiNumbers);
  }

  /**
   * Calculer l'intervalle moyen
   */
  private calculateAverageInterval(notes: NoteEvent[]): number {
    if (notes.length < 2) return 0;

    let totalInterval = 0;
    for (let i = 1; i < notes.length; i++) {
      const note1 = ScaleHelper.extractNoteName(notes[i - 1].note);
      const note2 = ScaleHelper.extractNoteName(notes[i].note);
      totalInterval += this.calculateInterval(note1, note2);
    }

    return totalInterval / (notes.length - 1);
  }

  /**
   * Calculer l'intervalle entre deux notes
   */
  private calculateInterval(note1: string, note2: string): number {
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index1 = chromaticNotes.indexOf(note1);
    const index2 = chromaticNotes.indexOf(note2);
    
    if (index1 === -1 || index2 === -1) return 0;
    
    return Math.abs(index2 - index1);
  }

  /**
   * Calculer le pourcentage de mouvement par degrés conjoints
   */
  private calculateStepwiseMotion(notes: NoteEvent[]): number {
    if (notes.length < 2) return 0;

    let stepwiseCount = 0;
    for (let i = 1; i < notes.length; i++) {
      const note1 = ScaleHelper.extractNoteName(notes[i - 1].note);
      const note2 = ScaleHelper.extractNoteName(notes[i].note);
      const interval = this.calculateInterval(note1, note2);
      
      if (interval <= 2) stepwiseCount++;
    }

    return Math.round((stepwiseCount / (notes.length - 1)) * 100);
  }

  /**
   * Identifier les sauts mélodiques
   */
  private identifyLeaps(notes: NoteEvent[]): MelodicAnalysis['leaps'] {
    const leaps: MelodicAnalysis['leaps'] = [];

    for (let i = 1; i < notes.length; i++) {
      const note1 = ScaleHelper.extractNoteName(notes[i - 1].note);
      const note2 = ScaleHelper.extractNoteName(notes[i].note);
      const interval = this.calculateInterval(note1, note2);
      
      if (interval > 2) { // Saut = plus qu'une seconde
        leaps.push({
          from: note1,
          to: note2,
          interval,
          position: notes[i].step
        });
      }
    }

    return leaps;
  }

  /**
   * Identifier les séquences mélodiques
   */
  private identifySequences(notes: NoteEvent[]): MelodicAnalysis['sequences'] {
    // Simplification : chercher des patterns répétés
    const sequences: MelodicAnalysis['sequences'] = [];
    
    // Pour l'instant, retourner un tableau vide
    // L'implémentation complète nécessiterait un algorithme plus complexe
    
    return sequences;
  }

  /**
   * Trouver le climax mélodique
   */
  private findClimax(notes: NoteEvent[]): MelodicAnalysis['climax'] {
    let highestNote = notes[0];
    let highestMidi = 0;

    notes.forEach(note => {
      const noteName = ScaleHelper.extractNoteName(note.note);
      const octave = parseInt(note.note.replace(noteName, '')) || 4;
      const midiNumber = ScaleHelper.noteToMidiNumber(noteName, octave);
      
      if (midiNumber > highestMidi) {
        highestMidi = midiNumber;
        highestNote = note;
      }
    });

    return {
      note: highestNote.note,
      position: highestNote.step
    };
  }

  // === SUGGESTIONS ET AVERTISSEMENTS ===

  /**
   * Générer des suggestions d'amélioration
   */
  private generateSuggestions(notes: NoteEvent[], keyAnalysis: any): string[] {
    const suggestions: string[] = [];

    // Suggestions basées sur la tonalité
    if (keyAnalysis.confidence < 70) {
      suggestions.push('Essayez d\'utiliser plus de notes de la gamme pour renforcer la tonalité');
    }

    // Suggestions rythmiques
    const durations = notes.map(n => n.duration);
    if (new Set(durations).size === 1) {
      suggestions.push('Variez les durées des notes pour plus d\'intérêt rythmique');
    }

    // Suggestions mélodiques
    const melodicAnalysis = this.analyzeMelody(notes);
    if (melodicAnalysis.range < 5) {
      suggestions.push('Élargissez l\'étendue mélodique pour plus d\'expressivité');
    }

    if (melodicAnalysis.stepwiseMotion > 90) {
      suggestions.push('Ajoutez quelques sauts mélodiques pour créer du relief');
    }

    return suggestions;
  }

  /**
   * Détecter les avertissements musicaux
   */
  private detectWarnings(notes: NoteEvent[], keyAnalysis: any): string[] {
    const warnings: string[] = [];

    // Avertissement pour notes hors gamme
    const scaleNotes = this.scaleHelper.getScaleNotes();
    const outOfScaleNotes = notes.filter(note => 
      !scaleNotes.includes(ScaleHelper.extractNoteName(note.note))
    );

    if (outOfScaleNotes.length > notes.length * 0.3) {
      warnings.push('Beaucoup de notes hors gamme - vérifiez la tonalité');
    }

    // Avertissement pour étendue excessive
    const melodicAnalysis = this.analyzeMelody(notes);
    if (melodicAnalysis.range > 24) { // Plus de 2 octaves
      warnings.push('Étendue mélodique très large - peut être difficile à jouer');
    }

    return warnings;
  }

  // === CONSEILS PÉDAGOGIQUES ===

  /**
   * Obtenir des conseils pédagogiques basés sur l'analyse
   */
  getPedagogicalTips(analysis: MusicalAnalysis): PedagogicalTip[] {
    const tips: PedagogicalTip[] = [];

    // Conseils basés sur la complexité
    if (analysis.complexity === 'beginner') {
      tips.push({
        topic: 'Progression d\'accords de base',
        explanation: 'Commencez par les progressions I-V-vi-IV ou I-vi-IV-V',
        example: 'En Do majeur: C-G-Am-F ou C-Am-F-G',
        difficulty: 'beginner',
        category: 'harmony'
      });
    }

    // Conseils basés sur la gamme
    const scale = ScaleHelper.getAvailableScales().find(s => s.id === analysis.scale);
    if (scale) {
      tips.push({
        topic: `Gamme ${scale.name}`,
        explanation: scale.description,
        example: `Notes de la gamme: ${this.scaleHelper.getScaleNotes().join(', ')}`,
        difficulty: analysis.complexity,
        category: 'theory'
      });
    }

    return tips;
  }
}

export default MusicalTheory;