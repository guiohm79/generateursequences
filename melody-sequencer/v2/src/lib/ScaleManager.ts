/**
 * ScaleManager - Gestionnaire des gammes personnalisées
 * Permet de créer, modifier, sauvegarder et charger des gammes
 */

export interface CustomScale {
  id: string;
  name: string;
  intervals: number[];
  description?: string;
  creator?: string;
  createdAt: number;
  isBuiltIn: boolean;
}

export interface ScaleValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ScaleManager {
  private static STORAGE_KEY = 'melody-sequencer-custom-scales';
  private static MAX_SCALES = 50;

  /**
   * Valider une gamme
   */
  static validateScale(intervals: number[], name: string): ScaleValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifications essentielles
    if (!name || name.trim().length === 0) {
      errors.push('Le nom de la gamme est requis');
    }

    if (name.trim().length > 30) {
      errors.push('Le nom ne peut pas dépasser 30 caractères');
    }

    if (!intervals || intervals.length === 0) {
      errors.push('Au moins une note est requise');
    }

    if (intervals.length < 2) {
      warnings.push('Les gammes avec moins de 2 notes sont inhabituelles');
    }

    if (intervals.length > 12) {
      errors.push('Maximum 12 notes par gamme');
    }

    // La première note doit être 0 (tonique)
    if (intervals.length > 0 && intervals[0] !== 0) {
      errors.push('La première note doit être la tonique (0)');
    }

    // Vérifier les intervalles
    for (let i = 0; i < intervals.length; i++) {
      const interval = intervals[i];
      
      if (!Number.isInteger(interval)) {
        errors.push(`L'intervalle ${i + 1} doit être un nombre entier`);
      }

      if (interval < 0 || interval > 11) {
        errors.push(`L'intervalle ${i + 1} doit être entre 0 et 11`);
      }
    }

    // Vérifier les doublons
    const uniqueIntervals = Array.from(new Set(intervals));
    if (uniqueIntervals.length !== intervals.length) {
      errors.push('Les intervalles ne peuvent pas être dupliqués');
    }

    // Vérifier l'ordre croissant
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i] <= intervals[i - 1]) {
        errors.push('Les intervalles doivent être en ordre croissant');
      }
    }

    // Avertissements musicaux
    if (intervals.length >= 8) {
      warnings.push('Les gammes avec plus de 7 notes peuvent être complexes à utiliser');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Charger toutes les gammes (built-in + personnalisées)
   */
  static getAllScales(): Record<string, number[]> {
    // Gammes built-in (depuis InspirationEngine)
    const builtInScales = {
      major:            [0,2,4,5,7,9,11],
      minor:            [0,2,3,5,7,8,10],
      harmonicMinor:    [0,2,3,5,7,8,11],
      phrygian:         [0,1,3,5,7,8,10],
      phrygianDominant: [0,1,4,5,7,8,10],
      dorian:           [0,2,3,5,7,9,10],
      hungarianMinor:   [0,2,3,6,7,8,11],
      doubleHarmonic:   [0,1,4,5,7,8,11],
      neapolitanMinor:  [0,1,3,5,7,8,11],
      enigmatic:        [0,1,4,6,8,10,11],
      wholetone:        [0,2,4,6,8,10],
      bluesScale:       [0,3,5,6,7,10],
      japanese:         [0,1,5,7,8],
      arabicMaqam:      [0,1,4,5,7,8,10],
    };

    // Gammes personnalisées
    const customScales = this.getCustomScales();
    const customScalesMap: Record<string, number[]> = {};
    
    customScales.forEach(scale => {
      customScalesMap[scale.id] = scale.intervals;
    });

    return { ...builtInScales, ...customScalesMap };
  }

  /**
   * Obtenir les gammes personnalisées depuis localStorage
   */
  static getCustomScales(): CustomScale[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const scales = JSON.parse(stored) as CustomScale[];
      return scales.filter(scale => this.validateScale(scale.intervals, scale.name).isValid);
    } catch (error) {
      console.error('[ScaleManager] Error loading scales:', error);
      return [];
    }
  }

  /**
   * Sauvegarder une gamme personnalisée
   */
  static saveCustomScale(scale: Omit<CustomScale, 'id' | 'createdAt' | 'isBuiltIn'>): boolean {
    try {
      const validation = this.validateScale(scale.intervals, scale.name);
      if (!validation.isValid) {
        console.error('[ScaleManager] Scale validation failed:', validation.errors);
        return false;
      }

      const existingScales = this.getCustomScales();

      // Vérifier la limite
      if (existingScales.length >= this.MAX_SCALES) {
        console.error('[ScaleManager] Maximum scales limit reached');
        return false;
      }

      // Créer la nouvelle gamme
      const newScale: CustomScale = {
        ...scale,
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        isBuiltIn: false
      };

      // Ajouter à la liste
      const updatedScales = [...existingScales, newScale];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedScales));

      console.log('[ScaleManager] Scale saved:', newScale.name);
      return true;
    } catch (error) {
      console.error('[ScaleManager] Error saving scale:', error);
      return false;
    }
  }

  /**
   * Supprimer une gamme personnalisée
   */
  static deleteCustomScale(scaleId: string): boolean {
    try {
      const existingScales = this.getCustomScales();
      const filteredScales = existingScales.filter(scale => scale.id !== scaleId);
      
      if (filteredScales.length === existingScales.length) {
        console.warn('[ScaleManager] Scale not found:', scaleId);
        return false;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredScales));
      console.log('[ScaleManager] Scale deleted:', scaleId);
      return true;
    } catch (error) {
      console.error('[ScaleManager] Error deleting scale:', error);
      return false;
    }
  }

  /**
   * Exporter les gammes personnalisées
   */
  static exportScales(): string {
    const customScales = this.getCustomScales();
    return JSON.stringify({
      version: '1.0.0',
      exported: Date.now(),
      scales: customScales
    }, null, 2);
  }

  /**
   * Importer des gammes personnalisées
   */
  static importScales(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;

      if (!data.scales || !Array.isArray(data.scales)) {
        return { success: false, imported: 0, errors: ['Format invalide - scales manquant'] };
      }

      const existingScales = this.getCustomScales();

      for (const scaleData of data.scales) {
        // Valider la structure
        if (!scaleData.name || !scaleData.intervals) {
          errors.push(`Gamme invalide: ${scaleData.name || 'Nom manquant'}`);
          continue;
        }

        // Valider la gamme
        const validation = this.validateScale(scaleData.intervals, scaleData.name);
        if (!validation.isValid) {
          errors.push(`${scaleData.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Vérifier si on atteint la limite
        if (existingScales.length + imported >= this.MAX_SCALES) {
          errors.push('Limite maximale de gammes atteinte');
          break;
        }

        // Importer la gamme
        const success = this.saveCustomScale({
          name: scaleData.name,
          intervals: scaleData.intervals,
          description: scaleData.description || '',
          creator: scaleData.creator || 'Import'
        });

        if (success) {
          imported++;
        } else {
          errors.push(`Échec import: ${scaleData.name}`);
        }
      }

      return { success: imported > 0, imported, errors };
    } catch (error) {
      return { 
        success: false, 
        imported: 0, 
        errors: [`Erreur parsing JSON: ${error instanceof Error ? error.message : 'Erreur inconnue'}`] 
      };
    }
  }

  /**
   * Obtenir les noms d'affichage des gammes
   */
  static getScaleDisplayNames(): Record<string, string> {
    const customScales = this.getCustomScales();
    const displayNames: Record<string, string> = {
      // Gammes built-in
      major: 'Majeure',
      minor: 'Mineure',
      harmonicMinor: 'Mineure harmonique',
      phrygian: 'Phrygien',
      phrygianDominant: 'Phrygien dominant',
      dorian: 'Dorien',
      hungarianMinor: 'Hongroise mineure',
      doubleHarmonic: 'Double harmonique',
      neapolitanMinor: 'Napolitaine mineure',
      enigmatic: 'Énigmatique',
      wholetone: 'Tons entiers',
      bluesScale: 'Blues',
      japanese: 'Japonaise',
      arabicMaqam: 'Maqam arabe'
    };

    // Ajouter les gammes personnalisées
    customScales.forEach(scale => {
      displayNames[scale.id] = `${scale.name} (personnalisée)`;
    });

    return displayNames;
  }
}