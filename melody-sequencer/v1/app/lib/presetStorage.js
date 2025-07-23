// /app/lib/presetStorage.js

import { SYNTH_PRESETS } from './synthPresets';

const LOCAL_STORAGE_KEY = 'synth_custom_presets';

// Fonction utilitaire pour vérifier si localStorage est disponible
function isLocalStorageAvailable() {
  if (typeof window === 'undefined') return false;
  
  try {
    const test = '__test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.error('LocalStorage indisponible:', e);
    return false;
  }
}

/**
 * Utilitaire pour gérer le stockage local des presets de synthétiseur
 */
export const PresetStorage = {
  /**
   * Récupère tous les presets (par défaut + personnalisés)
   */
  getAllPresets: () => {
    try {
      // Récupérer les presets personnalisés du localStorage
      const customPresets = PresetStorage.getCustomPresets();
      
      // Combiner avec les presets par défaut
      return [...SYNTH_PRESETS, ...customPresets];
    } catch (err) {
      console.error('Erreur lors de la récupération des presets:', err);
      return [...SYNTH_PRESETS]; // Retourner seulement les presets par défaut en cas d'erreur
    }
  },

  /**
   * Récupère uniquement les presets personnalisés
   */
  getCustomPresets: () => {
    if (!isLocalStorageAvailable()) return []; // Vérifie si localStorage est disponible
    
    try {
      const storedPresets = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!storedPresets) return [];
      
      const parsedPresets = JSON.parse(storedPresets);
      if (!Array.isArray(parsedPresets)) {
        console.error('Format de presets invalide:', parsedPresets);
        return [];
      }
      
      return parsedPresets;
    } catch (err) {
      console.error('Erreur lors de la lecture des presets:', err);
      return [];
    }
  },

  /**
   * Sauvegarde un preset personnalisé
   */
  saveCustomPreset: (preset) => {
    if (!isLocalStorageAvailable()) {
      console.error('LocalStorage non disponible pour la sauvegarde');
      return false;
    }
    
    try {
      // Vérifier que le preset a une clé valide
      if (!preset.key) {
        console.error('Tentative de sauvegarde d\'un preset sans clé', preset);
        return false;
      }

      // Vérifier si le preset est complet
      if (!preset.options || !preset.synthType || !preset.label) {
        console.error('Preset incomplet:', preset);
        return false;
      }
      
      const customPresets = PresetStorage.getCustomPresets();
      
      // Vérifier si un preset avec cette clé existe déjà
      const existingIndex = customPresets.findIndex(p => p.key === preset.key);
      
      // Copier l'objet pour éviter les références partagées
      const presetCopy = JSON.parse(JSON.stringify(preset));
      
      if (existingIndex >= 0) {
        // Mettre à jour le preset existant
        customPresets[existingIndex] = presetCopy;
      } else {
        // Ajouter un nouveau preset
        customPresets.push(presetCopy);
      }
      
      // Sauvegarder dans localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customPresets));
      console.log('Preset sauvegardé avec succès:', preset.label);
      return true;
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du preset:', err);
      return false;
    }
  },

  /**
   * Supprime un preset personnalisé
   */
  deleteCustomPreset: (presetKey) => {
    if (typeof window === 'undefined') return false; // Server-side safety
    
    const customPresets = PresetStorage.getCustomPresets();
    const filteredPresets = customPresets.filter(p => p.key !== presetKey);
    
    // Si rien n'a été supprimé, retourner false
    if (filteredPresets.length === customPresets.length) return false;
    
    // Sauvegarder la nouvelle liste
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredPresets));
    return true;
  },

  /**
   * Vérifie si un preset est un preset personnalisé
   */
  isCustomPreset: (presetKey) => {
    const customPresets = PresetStorage.getCustomPresets();
    return customPresets.some(p => p.key === presetKey);
  },

  /**
   * Génère une clé unique pour un nouveau preset
   */
  generateUniqueKey: (baseName) => {
    const timestamp = new Date().getTime();
    return `custom_${baseName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`;
  }
};
