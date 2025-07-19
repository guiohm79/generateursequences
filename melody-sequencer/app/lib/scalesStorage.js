// /app/lib/scalesStorage.js
// Module de gestion des gammes musicales personnalisées

const SCALES_STORAGE_KEY = 'melodySequencer_scales';

// Gammes par défaut (celles qui étaient dans randomEngine.js)
const DEFAULT_SCALES = {
  major: {
    intervals: [0, 2, 4, 5, 7, 9, 11],
    name: 'Majeure',
    description: 'Gamme majeure classique - joyeuse et lumineuse',
    category: 'Classique',
    isDefault: true
  },
  minor: {
    intervals: [0, 2, 3, 5, 7, 8, 10],
    name: 'Mineure naturelle',
    description: 'Gamme mineure naturelle - mélancolique',
    category: 'Classique',
    isDefault: true
  },
  harmonicMinor: {
    intervals: [0, 2, 3, 5, 7, 8, 11],
    name: 'Mineure harmonique',
    description: 'Le classique qui tue - tension dramatique',
    category: 'Classique',
    isDefault: true
  },
  phrygian: {
    intervals: [0, 1, 3, 5, 7, 8, 10],
    name: 'Phrygien',
    description: 'Mode phrygien de base - couleur espagnole',
    category: 'Modes',
    isDefault: true
  },
  phrygianDominant: {
    intervals: [0, 1, 4, 5, 7, 8, 10],
    name: 'Phrygien dominant',
    description: 'Plus oriental - tension exotique',
    category: 'Modes',
    isDefault: true
  },
  dorian: {
    intervals: [0, 2, 3, 5, 7, 9, 10],
    name: 'Dorien',
    description: 'Cool pour la prog - equilibré',
    category: 'Modes',
    isDefault: true
  },
  hungarianMinor: {
    intervals: [0, 2, 3, 6, 7, 8, 11],
    name: 'Mineure hongroise',
    description: 'Super sombre, parfait pour dark psy',
    category: 'Exotique',
    isDefault: true
  },
  doubleHarmonic: {
    intervals: [0, 1, 4, 5, 7, 8, 11],
    name: 'Double harmonique',
    description: 'Exotique de ouf - couleur orientale',
    category: 'Exotique',
    isDefault: true
  },
  neapolitanMinor: {
    intervals: [0, 1, 3, 5, 7, 8, 11],
    name: 'Mineure napolitaine',
    description: 'Tension de malade - dramatique',
    category: 'Exotique',
    isDefault: true
  },
  enigmatic: {
    intervals: [0, 1, 4, 6, 8, 10, 11],
    name: 'Énigmatique',
    description: 'Vraiment bizarre mais hypnotique',
    category: 'Expérimental',
    isDefault: true
  },
  wholetone: {
    intervals: [0, 2, 4, 6, 8, 10],
    name: 'Tons entiers',
    description: 'Complètement barré mais ça peut le faire',
    category: 'Expérimental',
    isDefault: true
  },
  perso: {
    intervals: [0, 3, 10, 12],
    name: 'Perso 1',
    description: 'Gamme personnalisée 1',
    category: 'Personnel',
    isDefault: true
  },
  perso2: {
    intervals: [0, 3, 7, 8, 10],
    name: 'Perso 2',
    description: 'Gamme personnalisée 2',
    category: 'Personnel',
    isDefault: true
  },
  perso3: {
    intervals: [0, 4, 7, 11, 12],
    name: 'Perso 3',
    description: 'Autres variantes perso',
    category: 'Personnel',
    isDefault: true
  },
  minimalDark: {
    intervals: [0, 1, 7],
    name: 'Dark minimal',
    description: 'Ultra minimal pour dark techno',
    category: 'Minimal',
    isDefault: true
  },
  acidTriad: {
    intervals: [0, 3, 7],
    name: 'Triad acid',
    description: 'Basique mais efficace pour acid',
    category: 'Minimal',
    isDefault: true
  },
  bluesScale: {
    intervals: [0, 3, 5, 6, 7, 10],
    name: 'Blues',
    description: 'Pour du groove - pentatonique + blue note',
    category: 'Blues/Jazz',
    isDefault: true
  },
  japanese: {
    intervals: [0, 1, 5, 7, 8],
    name: 'Japonaise',
    description: 'Pentatonique japonaise - atmosphère zen',
    category: 'Ethnique',
    isDefault: true
  },
  arabicMaqam: {
    intervals: [0, 1, 4, 5, 7, 8, 10],
    name: 'Maqam arabe',
    description: 'Couleur orientale - mystique',
    category: 'Ethnique',
    isDefault: true
  }
};

/**
 * Classe pour gérer le stockage des gammes musicales
 */
export class ScalesStorage {
  
  /**
   * Récupère toutes les gammes (par défaut + personnalisées)
   * @returns {Object} Objet avec toutes les gammes disponibles
   */
  static getAllScales() {
    try {
      const customScales = this.getCustomScales();
      // Combiner les gammes par défaut avec les personnalisées
      return { ...DEFAULT_SCALES, ...customScales };
    } catch (error) {
      console.error('Erreur lors de la lecture des gammes:', error);
      return DEFAULT_SCALES;
    }
  }

  /**
   * Récupère uniquement les gammes personnalisées
   * @returns {Object} Gammes personnalisées depuis localStorage
   */
  static getCustomScales() {
    try {
      const stored = localStorage.getItem(SCALES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Erreur lors de la lecture des gammes personnalisées:', error);
      return {};
    }
  }

  /**
   * Sauvegarde une nouvelle gamme personnalisée
   * @param {string} key - Clé unique pour la gamme
   * @param {Object} scaleData - Données de la gamme
   * @returns {boolean} Succès de la sauvegarde
   */
  static saveScale(key, scaleData) {
    try {
      // Validation des données
      if (!key || !scaleData.intervals || !Array.isArray(scaleData.intervals)) {
        throw new Error('Données de gamme invalides');
      }

      // Vérifier que les intervalles sont valides (0-11)
      const validIntervals = scaleData.intervals.every(interval => 
        Number.isInteger(interval) && interval >= 0 && interval <= 11
      );
      
      if (!validIntervals) {
        throw new Error('Les intervalles doivent être des entiers entre 0 et 11');
      }

      // S'assurer que la gamme commence par 0 (fondamentale)
      if (!scaleData.intervals.includes(0)) {
        scaleData.intervals = [0, ...scaleData.intervals].sort((a, b) => a - b);
      }

      // Supprimer les doublons et trier
      scaleData.intervals = [...new Set(scaleData.intervals)].sort((a, b) => a - b);

      const customScales = this.getCustomScales();
      
      const newScale = {
        intervals: scaleData.intervals,
        name: scaleData.name || `Gamme ${Object.keys(customScales).length + 1}`,
        description: scaleData.description || '',
        category: scaleData.category || 'Personnel',
        isDefault: false,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      customScales[key] = newScale;
      
      localStorage.setItem(SCALES_STORAGE_KEY, JSON.stringify(customScales));
      console.log(`Gamme sauvegardée: ${key} (${newScale.name})`);
      return true;
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la gamme:', error);
      throw error;
    }
  }

  /**
   * Met à jour une gamme existante
   * @param {string} key - Clé de la gamme à modifier
   * @param {Object} updates - Modifications à apporter
   * @returns {boolean} Succès de la modification
   */
  static updateScale(key, updates) {
    try {
      // Ne permet de modifier que les gammes personnalisées
      if (DEFAULT_SCALES[key]) {
        throw new Error('Impossible de modifier une gamme par défaut');
      }

      const customScales = this.getCustomScales();
      
      if (!customScales[key]) {
        throw new Error(`Gamme ${key} non trouvée`);
      }

      // Validation des intervalles si mis à jour
      if (updates.intervals) {
        const validIntervals = updates.intervals.every(interval => 
          Number.isInteger(interval) && interval >= 0 && interval <= 11
        );
        
        if (!validIntervals) {
          throw new Error('Les intervalles doivent être des entiers entre 0 et 11');
        }

        // S'assurer que la gamme commence par 0
        if (!updates.intervals.includes(0)) {
          updates.intervals = [0, ...updates.intervals];
        }

        // Supprimer les doublons et trier
        updates.intervals = [...new Set(updates.intervals)].sort((a, b) => a - b);
      }

      customScales[key] = {
        ...customScales[key],
        ...updates,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem(SCALES_STORAGE_KEY, JSON.stringify(customScales));
      console.log(`Gamme mise à jour: ${key}`);
      return true;
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la gamme:', error);
      throw error;
    }
  }

  /**
   * Supprime une gamme personnalisée
   * @param {string} key - Clé de la gamme à supprimer
   * @returns {boolean} Succès de la suppression
   */
  static deleteScale(key) {
    try {
      // Ne permet de supprimer que les gammes personnalisées
      if (DEFAULT_SCALES[key]) {
        throw new Error('Impossible de supprimer une gamme par défaut');
      }

      const customScales = this.getCustomScales();
      
      if (!customScales[key]) {
        console.warn(`Gamme ${key} non trouvée pour suppression`);
        return false;
      }

      delete customScales[key];
      
      localStorage.setItem(SCALES_STORAGE_KEY, JSON.stringify(customScales));
      console.log(`Gamme supprimée: ${key}`);
      return true;
      
    } catch (error) {
      console.error('Erreur lors de la suppression de la gamme:', error);
      throw error;
    }
  }

  /**
   * Récupère une gamme par sa clé
   * @param {string} key - Clé de la gamme
   * @returns {Object|null} Gamme trouvée ou null
   */
  static getScale(key) {
    const allScales = this.getAllScales();
    return allScales[key] || null;
  }

  /**
   * Récupère toutes les catégories de gammes
   * @returns {Array} Liste des catégories uniques
   */
  static getCategories() {
    const allScales = this.getAllScales();
    const categories = new Set();
    
    Object.values(allScales).forEach(scale => {
      if (scale.category) {
        categories.add(scale.category);
      }
    });
    
    return Array.from(categories).sort();
  }

  /**
   * Filtre les gammes par catégorie
   * @param {string} category - Catégorie à filtrer
   * @returns {Object} Gammes de la catégorie
   */
  static getScalesByCategory(category) {
    const allScales = this.getAllScales();
    const filtered = {};
    
    Object.entries(allScales).forEach(([key, scale]) => {
      if (scale.category === category) {
        filtered[key] = scale;
      }
    });
    
    return filtered;
  }

  /**
   * Recherche dans les gammes
   * @param {string} query - Terme de recherche
   * @returns {Object} Gammes correspondantes
   */
  static searchScales(query) {
    const allScales = this.getAllScales();
    const lowercaseQuery = query.toLowerCase();
    const results = {};
    
    Object.entries(allScales).forEach(([key, scale]) => {
      if (
        scale.name.toLowerCase().includes(lowercaseQuery) ||
        scale.description.toLowerCase().includes(lowercaseQuery) ||
        scale.category.toLowerCase().includes(lowercaseQuery) ||
        key.toLowerCase().includes(lowercaseQuery)
      ) {
        results[key] = scale;
      }
    });
    
    return results;
  }

  /**
   * Valide les intervalles d'une gamme
   * @param {Array} intervals - Intervalles à valider
   * @returns {Object} Résultat de validation
   */
  static validateIntervals(intervals) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!Array.isArray(intervals)) {
      result.isValid = false;
      result.errors.push('Les intervalles doivent être un tableau');
      return result;
    }

    if (intervals.length === 0) {
      result.isValid = false;
      result.errors.push('La gamme doit contenir au moins un intervalle');
      return result;
    }

    // Vérifier que tous les intervalles sont des entiers valides
    const invalidIntervals = intervals.filter(interval => 
      !Number.isInteger(interval) || interval < 0 || interval > 11
    );
    
    if (invalidIntervals.length > 0) {
      result.isValid = false;
      result.errors.push(`Intervalles invalides: ${invalidIntervals.join(', ')}`);
    }

    // Vérifier la présence de la fondamentale (0)
    if (!intervals.includes(0)) {
      result.warnings.push('La fondamentale (0) sera ajoutée automatiquement');
    }

    // Vérifier les doublons
    const uniqueIntervals = [...new Set(intervals)];
    if (uniqueIntervals.length !== intervals.length) {
      result.warnings.push('Les doublons seront supprimés automatiquement');
    }

    // Avertissement pour les gammes très courtes
    if (uniqueIntervals.length < 3) {
      result.warnings.push('Gamme très courte (moins de 3 notes)');
    }

    // Avertissement pour les gammes très longues
    if (uniqueIntervals.length > 8) {
      result.warnings.push('Gamme très longue (plus de 8 notes)');
    }

    return result;
  }

  /**
   * Génère un nom de clé unique pour une nouvelle gamme
   * @param {string} baseName - Nom de base
   * @returns {string} Clé unique
   */
  static generateUniqueKey(baseName) {
    const allScales = this.getAllScales();
    let key = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let counter = 1;
    
    while (allScales[key]) {
      key = `${baseName.toLowerCase().replace(/[^a-z0-9]/g, '')}${counter}`;
      counter++;
    }
    
    return key;
  }

  /**
   * Exporte toutes les gammes personnalisées en JSON
   * @returns {string} JSON des gammes
   */
  static exportScales() {
    try {
      const customScales = this.getCustomScales();
      return JSON.stringify({
        exportDate: new Date().toISOString(),
        version: '1.0',
        scales: customScales
      }, null, 2);
    } catch (error) {
      console.error('Erreur lors de l\'export des gammes:', error);
      throw error;
    }
  }

  /**
   * Importe des gammes depuis un JSON
   * @param {string} jsonData - Données JSON à importer
   * @param {boolean} merge - Si true, fusionne avec les gammes existantes
   * @returns {boolean} Succès de l'import
   */
  static importScales(jsonData, merge = true) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.scales || typeof importData.scales !== 'object') {
        throw new Error('Format de données invalide');
      }
      
      let customScales = merge ? this.getCustomScales() : {};
      let importedCount = 0;
      
      Object.entries(importData.scales).forEach(([key, scale]) => {
        try {
          // Valider la gamme avant import
          const validation = this.validateIntervals(scale.intervals);
          if (validation.isValid) {
            // Générer une nouvelle clé si elle existe déjà
            let finalKey = key;
            if (customScales[key]) {
              finalKey = this.generateUniqueKey(scale.name || key);
            }
            
            customScales[finalKey] = {
              ...scale,
              isDefault: false,
              importDate: new Date().toISOString()
            };
            importedCount++;
          } else {
            console.warn(`Gamme ${key} ignorée: ${validation.errors.join(', ')}`);
          }
        } catch (error) {
          console.warn(`Erreur lors de l'import de la gamme ${key}:`, error);
        }
      });
      
      localStorage.setItem(SCALES_STORAGE_KEY, JSON.stringify(customScales));
      console.log(`${importedCount} gammes importées`);
      return true;
      
    } catch (error) {
      console.error('Erreur lors de l\'import des gammes:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des gammes
   * @returns {Object} Statistiques
   */
  static getStats() {
    const allScales = this.getAllScales();
    const customScales = this.getCustomScales();
    const categories = this.getCategories();
    
    return {
      totalScales: Object.keys(allScales).length,
      defaultScales: Object.keys(DEFAULT_SCALES).length,
      customScales: Object.keys(customScales).length,
      categories: categories.length,
      averageIntervals: Object.values(allScales)
        .reduce((sum, scale) => sum + scale.intervals.length, 0) / Object.keys(allScales).length
    };
  }
}