/**
 * UserPatternCollector - Phase 1 : Collecte des patterns aimés par l'utilisateur
 * 
 * Ce système permet de :
 * 1. Collecter les patterns que l'utilisateur apprécie 
 * 2. Les stocker avec des métadonnées (style, tempo, contexte)
 * 3. Construire un dataset personnel pour futur entraînement IA
 * 4. Analyser les préférences musicales de l'utilisateur
 */

import { NoteEvent } from '../app/inspirationIA/types';

// Types pour la collecte de données
export interface PatternTrainingData {
  id: string;
  timestamp: number;
  pattern: NoteEvent[];
  metadata: PatternMetadata;
  userRating: number; // 1-5 ou -1 pour négatif
  source: 'inspiration' | 'manual' | 'ai' | 'import';
  musicContext: MusicContext;
}

export interface PatternMetadata {
  style: 'goa' | 'psy' | 'prog' | 'deep' | 'tribal' | 'dark';
  part: 'bassline' | 'lead' | 'hypnoticLead' | 'pad' | 'arpeggio';
  tempo: number;
  stepCount: number;
  root: string;
  scale: string;
  description?: string; // Description libre de l'utilisateur
}

export interface MusicContext {
  octaveRange: { min: number; max: number };
  noteCount: number;
  averageVelocity: number;
  rhythmComplexity: number; // 0-1 basé sur la densité rythmique
  predominantNotes: string[]; // Notes les plus utilisées
  uniqueSteps: number; // Nombre de steps avec des notes
}

export interface DatasetStats {
  totalPatterns: number;
  positivePatterns: number;
  negativePatterns: number;
  preferredStyles: Record<string, number>;
  preferredParts: Record<string, number>;
  preferredScales: Record<string, number>;
  averageTempo: number;
  averageNoteCount: number;
  isReadyForTraining: boolean; // true si >= 50 patterns positifs
}

export class UserPatternCollector {
  private static readonly STORAGE_KEY = 'user-pattern-dataset';
  private static readonly MIN_TRAINING_PATTERNS = 50;

  /**
   * Génère un ID unique pour un pattern
   */
  private static generateId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Analyse musicale automatique d'un pattern
   */
  private static analyzeMusicContext(pattern: NoteEvent[]): MusicContext {
    if (pattern.length === 0) {
      return {
        octaveRange: { min: 3, max: 5 },
        noteCount: 0,
        averageVelocity: 100,
        rhythmComplexity: 0,
        predominantNotes: [],
        uniqueSteps: 0
      };
    }

    // Analyser les octaves
    const octaves = pattern.map(note => parseInt(note.note.slice(-1)));
    const minOctave = Math.min(...octaves);
    const maxOctave = Math.max(...octaves);

    // Analyser les vélocités
    const averageVelocity = pattern.reduce((sum, note) => sum + note.velocity, 0) / pattern.length;

    // Analyser la complexité rythmique (densité des notes)
    const uniqueSteps = new Set(pattern.map(note => note.step)).size;
    const maxPossibleSteps = Math.max(...pattern.map(note => note.step)) + 1 || 16;
    const rhythmComplexity = uniqueSteps / maxPossibleSteps;

    // Analyser les notes prédominantes
    const noteCounts: Record<string, number> = {};
    pattern.forEach(note => {
      const noteName = note.note.slice(0, -1); // Enlever l'octave
      noteCounts[noteName] = (noteCounts[noteName] || 0) + 1;
    });

    const predominantNotes = Object.entries(noteCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([note]) => note);

    return {
      octaveRange: { min: minOctave, max: maxOctave },
      noteCount: pattern.length,
      averageVelocity: Math.round(averageVelocity),
      rhythmComplexity: Math.round(rhythmComplexity * 100) / 100,
      predominantNotes,
      uniqueSteps
    };
  }

  /**
   * Sauvegarde un pattern aimé par l'utilisateur
   */
  static async savePatternAsTrainingData(
    pattern: NoteEvent[],
    metadata: PatternMetadata,
    userRating: number = 1,
    source: PatternTrainingData['source'] = 'manual',
    description?: string
  ): Promise<string> {
    try {
      const id = this.generateId();
      const musicContext = this.analyzeMusicContext(pattern);

      const trainingData: PatternTrainingData = {
        id,
        timestamp: Date.now(),
        pattern: [...pattern], // Copie pour éviter les mutations
        metadata: {
          ...metadata,
          description: description || `Pattern ${metadata.style} ${metadata.part}`
        },
        userRating,
        source,
        musicContext
      };

      // Récupérer le dataset existant
      const existingDataset = this.getStoredDataset();
      
      // Ajouter le nouveau pattern
      existingDataset.push(trainingData);

      // Sauvegarder
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingDataset));

      console.log(`✅ Pattern sauvegardé: ${id}`, {
        style: metadata.style,
        part: metadata.part,
        noteCount: pattern.length,
        rating: userRating
      });

      return id;
    } catch (error) {
      console.error('❌ Erreur sauvegarde pattern:', error);
      throw new Error(`Impossible de sauvegarder le pattern: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère le dataset stocké
   */
  static getStoredDataset(): PatternTrainingData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('⚠️ Erreur lecture dataset, initialisation nouveau:', error);
      return [];
    }
  }

  /**
   * Supprime un pattern du dataset
   */
  static removePattern(patternId: string): boolean {
    try {
      const dataset = this.getStoredDataset();
      const initialLength = dataset.length;
      const filteredDataset = dataset.filter(p => p.id !== patternId);
      
      if (filteredDataset.length < initialLength) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDataset));
        console.log(`🗑️ Pattern supprimé: ${patternId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erreur suppression pattern:', error);
      return false;
    }
  }

  /**
   * Calcule les statistiques du dataset
   */
  static getDatasetStats(): DatasetStats {
    const dataset = this.getStoredDataset();
    
    if (dataset.length === 0) {
      return {
        totalPatterns: 0,
        positivePatterns: 0,
        negativePatterns: 0,
        preferredStyles: {},
        preferredParts: {},
        preferredScales: {},
        averageTempo: 120,
        averageNoteCount: 0,
        isReadyForTraining: false
      };
    }

    const positivePatterns = dataset.filter(p => p.userRating > 0);
    const negativePatterns = dataset.filter(p => p.userRating < 0);

    // Analyser les préférences
    const preferredStyles: Record<string, number> = {};
    const preferredParts: Record<string, number> = {};
    const preferredScales: Record<string, number> = {};

    positivePatterns.forEach(pattern => {
      preferredStyles[pattern.metadata.style] = (preferredStyles[pattern.metadata.style] || 0) + 1;
      preferredParts[pattern.metadata.part] = (preferredParts[pattern.metadata.part] || 0) + 1;
      preferredScales[pattern.metadata.scale] = (preferredScales[pattern.metadata.scale] || 0) + 1;
    });

    // Moyennes
    const averageTempo = positivePatterns.length > 0 
      ? Math.round(positivePatterns.reduce((sum, p) => sum + p.metadata.tempo, 0) / positivePatterns.length)
      : 120;

    const averageNoteCount = positivePatterns.length > 0
      ? Math.round(positivePatterns.reduce((sum, p) => sum + p.musicContext.noteCount, 0) / positivePatterns.length)
      : 0;

    return {
      totalPatterns: dataset.length,
      positivePatterns: positivePatterns.length,
      negativePatterns: negativePatterns.length,
      preferredStyles,
      preferredParts,
      preferredScales,
      averageTempo,
      averageNoteCount,
      isReadyForTraining: positivePatterns.length >= this.MIN_TRAINING_PATTERNS
    };
  }

  /**
   * Exporte le dataset au format JSON pour backup
   */
  static exportDataset(): string {
    const dataset = this.getStoredDataset();
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userDataset: dataset,
      stats: this.getDatasetStats()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importe un dataset depuis un fichier JSON
   */
  static async importDataset(jsonData: string): Promise<number> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.userDataset || !Array.isArray(importData.userDataset)) {
        throw new Error('Format de dataset invalide');
      }

      // Validation basique des patterns
      const validPatterns = importData.userDataset.filter((pattern: any) => 
        pattern.id && pattern.pattern && pattern.metadata && typeof pattern.userRating === 'number'
      );

      if (validPatterns.length === 0) {
        throw new Error('Aucun pattern valide trouvé dans le fichier');
      }

      // Fusionner avec le dataset existant (éviter les doublons)
      const existingDataset = this.getStoredDataset();
      const existingIds = new Set(existingDataset.map(p => p.id));
      
      const newPatterns = validPatterns.filter((pattern: PatternTrainingData) => 
        !existingIds.has(pattern.id)
      );

      const mergedDataset = [...existingDataset, ...newPatterns];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedDataset));

      console.log(`📥 Dataset importé: ${newPatterns.length} nouveaux patterns`);
      return newPatterns.length;
    } catch (error) {
      console.error('❌ Erreur import dataset:', error);
      throw new Error(`Impossible d'importer le dataset: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Efface complètement le dataset (avec confirmation)
   */
  static clearDataset(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Dataset utilisateur effacé');
      return true;
    } catch (error) {
      console.error('❌ Erreur effacement dataset:', error);
      return false;
    }
  }

  /**
   * Obtient des recommandations basées sur les patterns aimés
   */
  static getPersonalizedRecommendations(): {
    suggestedStyle: string;
    suggestedPart: string;
    suggestedScale: string;
    suggestedTempo: number;
    confidence: number; // 0-1
  } | null {
    const stats = this.getDatasetStats();
    
    if (stats.positivePatterns < 10) {
      return null; // Pas assez de données pour des recommandations fiables
    }

    // Trouver les préférences dominantes
    const topStyle = Object.entries(stats.preferredStyles)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'psy';
    
    const topPart = Object.entries(stats.preferredParts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'lead';
    
    const topScale = Object.entries(stats.preferredScales)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'minor';

    // Calculer la confiance basée sur le nombre de patterns
    const confidence = Math.min(stats.positivePatterns / this.MIN_TRAINING_PATTERNS, 1);

    return {
      suggestedStyle: topStyle,
      suggestedPart: topPart,
      suggestedScale: topScale,
      suggestedTempo: stats.averageTempo,
      confidence: Math.round(confidence * 100) / 100
    };
  }
}

export default UserPatternCollector;