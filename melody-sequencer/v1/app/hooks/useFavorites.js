// Hook personnalisé pour la gestion des favoris
import { useState, useCallback } from 'react';
import { FavoritesStorage } from '../lib/favoritesStorage';
import { buildPattern } from '../lib/patternUtils';

/**
 * Hook pour gérer les favoris de patterns musicaux
 * @param {Object} options - Options de configuration
 * @param {Object} options.pattern - Pattern actuel
 * @param {Function} options.setPattern - Fonction pour modifier le pattern
 * @param {Function} options.saveToHistory - Fonction pour sauvegarder dans l'historique
 * @param {Function} options.setTempo - Fonction pour modifier le tempo
 * @param {Function} options.setSteps - Fonction pour modifier les steps
 * @param {Function} options.setNoteLength - Fonction pour modifier la longueur des notes
 * @param {Function} options.setMinOctave - Fonction pour modifier l'octave min
 * @param {Function} options.setMaxOctave - Fonction pour modifier l'octave max
 * @param {Function} options.setRandomParams - Fonction pour modifier les paramètres aléatoires
 * @param {Object} options.currentSequencerSettings - Paramètres actuels du séquenceur
 * @param {Object} options.currentPreset - Preset actuel
 * @param {number} options.steps - Nombre de pas
 * @param {number} options.minOctave - Octave minimum
 * @param {number} options.maxOctave - Octave maximum
 * @returns {Object} État et fonctions pour la gestion des favoris
 */
export function useFavorites({ 
  pattern, 
  setPattern,
  saveToHistory,
  setTempo,
  setSteps, 
  setNoteLength,
  setMinOctave,
  setMaxOctave,
  setRandomParams,
  currentSequencerSettings,
  currentPreset,
  steps,
  minOctave,
  maxOctave
}) {
  // États pour les favoris
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesList, setFavoritesList] = useState([]);
  const [lastLoadedFavorite, setLastLoadedFavorite] = useState(null);

  // Fonction pour charger un favori
  const handleLoadFavorite = useCallback((favorite) => {
    try {
      console.log("Chargement du favori:", favorite.name);
      setFavoritesLoading(true);
      
      // Charger le pattern
      if (favorite.pattern) {
        // Adapter le pattern aux octaves actuelles si nécessaire
        const adaptedPattern = buildPattern(favorite.pattern, steps, minOctave, maxOctave);
        
        // Sauvegarder dans l'historique avant de changer
        saveToHistory(adaptedPattern);
        setPattern(adaptedPattern);
      }
      
      // Charger les paramètres du séquenceur si disponibles
      if (favorite.sequencerSettings) {
        const settings = favorite.sequencerSettings;
        
        // Appliquer les réglages si ils diffèrent des actuels
        if (settings.tempo && settings.tempo !== currentSequencerSettings.tempo) {
          setTempo(settings.tempo);
        }
        if (settings.steps && settings.steps !== currentSequencerSettings.steps) {
          setSteps(settings.steps);
        }
        if (settings.noteLength && settings.noteLength !== currentSequencerSettings.noteLength) {
          setNoteLength(settings.noteLength);
        }
        if (settings.octaves) {
          if (settings.octaves.min !== minOctave) {
            setMinOctave(settings.octaves.min);
          }
          if (settings.octaves.max !== maxOctave) {
            setMaxOctave(settings.octaves.max);
          }
        }
      }
      
      // Si le favori a des paramètres de génération, les sauvegarder pour "Random Again"
      if (favorite.generationParams) {
        setRandomParams(favorite.generationParams);
      }
      
      setLastLoadedFavorite(favorite);
      console.log(`Favori "${favorite.name}" chargé avec succès`);
      setFavoritesLoading(false);
      return true;
      
    } catch (error) {
      console.error("Erreur lors du chargement du favori:", error);
      setFavoritesLoading(false);
      return false;
    }
  }, [
    pattern, 
    saveToHistory, 
    setPattern, 
    setTempo, 
    setSteps, 
    setNoteLength, 
    setMinOctave, 
    setMaxOctave,
    setRandomParams,
    currentSequencerSettings,
    steps,
    minOctave,
    maxOctave
  ]);

  // Fonction pour sauvegarder le pattern actuel comme favori
  const saveFavorite = useCallback((favoriteData) => {
    try {
      if (!pattern || !currentSequencerSettings) {
        console.warn('Aucun pattern ou paramètres à sauvegarder');
        return null;
      }

      const favoriteToSave = {
        ...favoriteData,
        pattern: pattern,
        sequencerSettings: {
          tempo: currentSequencerSettings.tempo,
          steps: currentSequencerSettings.steps,
          voiceMode: currentPreset?.voiceMode || 'poly',
          noteLength: currentSequencerSettings.noteLength,
          octaves: { 
            min: minOctave, 
            max: maxOctave 
          }
        }
      };

      const savedId = FavoritesStorage.saveFavorite(favoriteToSave);
      console.log(`Favori sauvegardé avec ID: ${savedId}`);
      
      // Recharger la liste des favoris
      loadAllFavorites();
      
      return savedId;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du favori:", error);
      return null;
    }
  }, [pattern, currentSequencerSettings, currentPreset, minOctave, maxOctave]);

  // Fonction pour charger tous les favoris
  const loadAllFavorites = useCallback(() => {
    try {
      const favorites = FavoritesStorage.getAllFavorites();
      setFavoritesList(favorites);
      return favorites;
    } catch (error) {
      console.error("Erreur lors du chargement des favoris:", error);
      return [];
    }
  }, []);

  // Fonction pour supprimer un favori
  const deleteFavorite = useCallback((favoriteId) => {
    try {
      const success = FavoritesStorage.deleteFavorite(favoriteId);
      if (success) {
        // Recharger la liste
        loadAllFavorites();
        
        // Si c'était le dernier favori chargé, le réinitialiser
        if (lastLoadedFavorite && lastLoadedFavorite.id === favoriteId) {
          setLastLoadedFavorite(null);
        }
      }
      return success;
    } catch (error) {
      console.error("Erreur lors de la suppression du favori:", error);
      return false;
    }
  }, [lastLoadedFavorite, loadAllFavorites]);

  // Fonction pour mettre à jour un favori
  const updateFavorite = useCallback((favoriteId, updates) => {
    try {
      const success = FavoritesStorage.updateFavorite(favoriteId, updates);
      if (success) {
        // Recharger la liste
        loadAllFavorites();
        
        // Mettre à jour le dernier favori chargé si c'est le même
        if (lastLoadedFavorite && lastLoadedFavorite.id === favoriteId) {
          const updatedFavorite = FavoritesStorage.getFavoriteById(favoriteId);
          setLastLoadedFavorite(updatedFavorite);
        }
      }
      return success;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du favori:", error);
      return false;
    }
  }, [lastLoadedFavorite, loadAllFavorites]);

  // Fonction pour rechercher dans les favoris
  const searchFavorites = useCallback((query) => {
    try {
      return FavoritesStorage.searchFavorites(query);
    } catch (error) {
      console.error("Erreur lors de la recherche de favoris:", error);
      return [];
    }
  }, []);

  // Fonction pour obtenir les favoris par tag
  const getFavoritesByTag = useCallback((tag) => {
    try {
      return FavoritesStorage.getFavoritesByTag(tag);
    } catch (error) {
      console.error("Erreur lors de la récupération des favoris par tag:", error);
      return [];
    }
  }, []);

  // Fonction pour obtenir tous les tags
  const getAllTags = useCallback(() => {
    try {
      return FavoritesStorage.getAllTags();
    } catch (error) {
      console.error("Erreur lors de la récupération des tags:", error);
      return [];
    }
  }, []);

  // Fonction pour exporter les favoris
  const exportFavorites = useCallback(() => {
    try {
      return FavoritesStorage.exportFavorites();
    } catch (error) {
      console.error("Erreur lors de l'export des favoris:", error);
      return null;
    }
  }, []);

  // Fonction pour importer des favoris
  const importFavorites = useCallback((jsonData, merge = true) => {
    try {
      const success = FavoritesStorage.importFavorites(jsonData, merge);
      if (success) {
        // Recharger la liste après import
        loadAllFavorites();
      }
      return success;
    } catch (error) {
      console.error("Erreur lors de l'import des favoris:", error);
      return false;
    }
  }, [loadAllFavorites]);

  // Fonction pour nettoyer le stockage
  const cleanupFavorites = useCallback(() => {
    try {
      const removedCount = FavoritesStorage.cleanupStorage();
      if (removedCount > 0) {
        // Recharger la liste après nettoyage
        loadAllFavorites();
      }
      return removedCount;
    } catch (error) {
      console.error("Erreur lors du nettoyage des favoris:", error);
      return 0;
    }
  }, [loadAllFavorites]);

  // Fonction pour obtenir les statistiques
  const getFavoritesStats = useCallback(() => {
    try {
      return FavoritesStorage.getStats();
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return null;
    }
  }, []);

  // Fonction pour réorganiser les favoris
  const reorderFavorites = useCallback((newOrder) => {
    try {
      const success = FavoritesStorage.reorderFavorites(newOrder);
      if (success) {
        loadAllFavorites();
      }
      return success;
    } catch (error) {
      console.error("Erreur lors de la réorganisation des favoris:", error);
      return false;
    }
  }, [loadAllFavorites]);

  // Fonction pour sauvegarder rapidement le pattern actuel
  const quickSaveFavorite = useCallback((name) => {
    const quickFavoriteData = {
      name: name || `Pattern ${new Date().toLocaleTimeString()}`,
      tags: ['quick-save'],
      notes: 'Sauvegarde rapide'
    };
    
    return saveFavorite(quickFavoriteData);
  }, [saveFavorite]);

  // Vérifier si le pattern actuel peut être sauvegardé
  const canSaveFavorite = pattern !== null && 
    typeof pattern === 'object' && 
    Object.values(pattern).some(row => 
      Array.isArray(row) && row.some(cell => cell && cell.on)
    );

  return {
    // États
    favoritesLoading,
    favoritesList,
    lastLoadedFavorite,
    
    // État calculé
    canSaveFavorite,
    
    // Fonctions principales
    handleLoadFavorite,
    saveFavorite,
    deleteFavorite,
    updateFavorite,
    
    // Fonctions de recherche et filtrage
    searchFavorites,
    getFavoritesByTag,
    getAllTags,
    
    // Fonctions utilitaires
    loadAllFavorites,
    exportFavorites,
    importFavorites,
    cleanupFavorites,
    reorderFavorites,
    getFavoritesStats,
    
    // Raccourcis
    quickSaveFavorite
  };
}