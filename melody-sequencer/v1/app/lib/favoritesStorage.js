// /app/lib/favoritesStorage.js
// Module de gestion des patterns favoris

const FAVORITES_STORAGE_KEY = 'melodySequencer_favorites';

/**
 * Classe pour gérer le stockage des patterns favoris
 */
export class FavoritesStorage {
  
  /**
   * Récupère tous les favoris depuis le localStorage
   * @returns {Array} Liste des favoris
   */
  static getAllFavorites() {
    try {
      // Vérifier qu'on est côté client
      if (typeof window === 'undefined') return [];
      
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture des favoris:', error);
      return [];
    }
  }

  /**
   * Sauvegarde un nouveau favori
   * @param {Object} favoriteData - Données du favori à sauvegarder
   * @returns {string} ID du favori créé
   */
  static saveFavorite(favoriteData) {
    const favorites = this.getAllFavorites();
    
    const newFavorite = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: favoriteData.name || `Pattern ${favorites.length + 1}`,
      date: new Date().toISOString(),
      
      // Paramètres de génération (si disponibles)
      generationParams: favoriteData.generationParams || null,
      
      // Pattern final complet
      pattern: JSON.parse(JSON.stringify(favoriteData.pattern)), // Deep copy
      
      // Métadonnées du séquenceur
      sequencerSettings: {
        tempo: favoriteData.tempo || 120,
        steps: favoriteData.steps || 16,
        voiceMode: favoriteData.voiceMode || 'poly',
        noteLength: favoriteData.noteLength || '16n',
        octaves: favoriteData.octaves || { min: 2, max: 4 }
      },
      
      // Tags optionnels pour catégorisation
      tags: favoriteData.tags || [],
      
      // Notes utilisateur
      notes: favoriteData.notes || ''
    };
    
    favorites.push(newFavorite);
    
    try {
      // Vérifier qu'on est côté client
      if (typeof window !== 'undefined') {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      }
      console.log(`Favori sauvegardé: ${newFavorite.name} (${newFavorite.id})`);
      return newFavorite.id;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du favori:', error);
      throw new Error('Impossible de sauvegarder le favori');
    }
  }

  /**
   * Récupère un favori par son ID
   * @param {string} id - ID du favori
   * @returns {Object|null} Favori trouvé ou null
   */
  static getFavoriteById(id) {
    const favorites = this.getAllFavorites();
    return favorites.find(fav => fav.id === id) || null;
  }

  /**
   * Met à jour un favori existant
   * @param {string} id - ID du favori à modifier
   * @param {Object} updates - Modifications à apporter
   * @returns {boolean} Succès de la modification
   */
  static updateFavorite(id, updates) {
    const favorites = this.getAllFavorites();
    const index = favorites.findIndex(fav => fav.id === id);
    
    if (index === -1) {
      console.warn(`Favori ${id} non trouvé pour mise à jour`);
      return false;
    }
    
    // Mise à jour avec conservation de l'ID et de la date de création
    favorites[index] = {
      ...favorites[index],
      ...updates,
      id: favorites[index].id, // Conserve l'ID original
      date: favorites[index].date, // Conserve la date de création
      lastModified: new Date().toISOString() // Ajoute la date de modification
    };
    
    try {
      // Vérifier qu'on est côté client
      if (typeof window !== 'undefined') {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      }
      console.log(`Favori mis à jour: ${id}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du favori:', error);
      return false;
    }
  }

  /**
   * Supprime un favori
   * @param {string} id - ID du favori à supprimer
   * @returns {boolean} Succès de la suppression
   */
  static deleteFavorite(id) {
    const favorites = this.getAllFavorites();
    const filteredFavorites = favorites.filter(fav => fav.id !== id);
    
    if (filteredFavorites.length === favorites.length) {
      console.warn(`Favori ${id} non trouvé pour suppression`);
      return false;
    }
    
    try {
      // Vérifier qu'on est côté client
      if (typeof window !== 'undefined') {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filteredFavorites));
      }
      console.log(`Favori supprimé: ${id}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
      return false;
    }
  }

  /**
   * Réorganise l'ordre des favoris
   * @param {Array} newOrder - Tableau d'IDs dans le nouvel ordre
   * @returns {boolean} Succès de la réorganisation
   */
  static reorderFavorites(newOrder) {
    const favorites = this.getAllFavorites();
    const reorderedFavorites = [];
    
    // Réorganise selon le nouvel ordre
    newOrder.forEach(id => {
      const favorite = favorites.find(fav => fav.id === id);
      if (favorite) {
        reorderedFavorites.push(favorite);
      }
    });
    
    // Ajoute les favoris non mentionnés à la fin
    favorites.forEach(fav => {
      if (!newOrder.includes(fav.id)) {
        reorderedFavorites.push(fav);
      }
    });
    
    try {
      // Vérifier qu'on est côté client
      if (typeof window !== 'undefined') {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(reorderedFavorites));
      }
      console.log('Favoris réorganisés');
      return true;
    } catch (error) {
      console.error('Erreur lors de la réorganisation des favoris:', error);
      return false;
    }
  }

  /**
   * Recherche dans les favoris
   * @param {string} query - Terme de recherche
   * @returns {Array} Favoris correspondants
   */
  static searchFavorites(query) {
    const favorites = this.getAllFavorites();
    const lowercaseQuery = query.toLowerCase();
    
    return favorites.filter(fav => 
      fav.name.toLowerCase().includes(lowercaseQuery) ||
      fav.notes.toLowerCase().includes(lowercaseQuery) ||
      fav.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      (fav.generationParams && fav.generationParams.style && 
       fav.generationParams.style.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Filtre les favoris par tag
   * @param {string} tag - Tag à filtrer
   * @returns {Array} Favoris avec ce tag
   */
  static getFavoritesByTag(tag) {
    const favorites = this.getAllFavorites();
    return favorites.filter(fav => fav.tags.includes(tag));
  }

  /**
   * Récupère tous les tags utilisés
   * @returns {Array} Liste des tags uniques
   */
  static getAllTags() {
    const favorites = this.getAllFavorites();
    const allTags = favorites.flatMap(fav => fav.tags);
    return [...new Set(allTags)].sort();
  }

  /**
   * Exporte tous les favoris en JSON
   * @returns {string} JSON des favoris
   */
  static exportFavorites() {
    const favorites = this.getAllFavorites();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      version: '1.0',
      favorites: favorites
    }, null, 2);
  }

  /**
   * Importe des favoris depuis un JSON
   * @param {string} jsonData - Données JSON à importer
   * @param {boolean} merge - Si true, fusionne avec les favoris existants
   * @returns {boolean} Succès de l'import
   */
  static importFavorites(jsonData, merge = true) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.favorites || !Array.isArray(importData.favorites)) {
        throw new Error('Format de données invalide');
      }
      
      let favorites = merge ? this.getAllFavorites() : [];
      
      // Ajoute les favoris importés avec de nouveaux IDs pour éviter les conflits
      importData.favorites.forEach(importedFav => {
        const newFavorite = {
          ...importedFav,
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          importDate: new Date().toISOString()
        };
        favorites.push(newFavorite);
      });
      
      // Vérifier qu'on est côté client
      if (typeof window !== 'undefined') {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      }
      console.log(`${importData.favorites.length} favoris importés`);
      return true;
      
    } catch (error) {
      console.error('Erreur lors de l\'import des favoris:', error);
      return false;
    }
  }

  /**
   * Nettoie le stockage (supprime les favoris corrompus)
   * @returns {number} Nombre de favoris supprimés
   */
  static cleanupStorage() {
    const favorites = this.getAllFavorites();
    const validFavorites = favorites.filter(fav => {
      return fav.id && fav.pattern && typeof fav.pattern === 'object';
    });
    
    const removedCount = favorites.length - validFavorites.length;
    
    if (removedCount > 0) {
      try {
        // Vérifier qu'on est côté client
        if (typeof window !== 'undefined') {
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(validFavorites));
        }
        console.log(`${removedCount} favoris corrompus supprimés`);
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
      }
    }
    
    return removedCount;
  }

  /**
   * Récupère les statistiques des favoris
   * @returns {Object} Statistiques
   */
  static getStats() {
    const favorites = this.getAllFavorites();
    const tags = this.getAllTags();
    
    return {
      totalFavorites: favorites.length,
      totalTags: tags.length,
      mostUsedTag: tags.length > 0 ? tags.reduce((a, b) => 
        this.getFavoritesByTag(a).length > this.getFavoritesByTag(b).length ? a : b
      ) : null,
      oldestFavorite: favorites.length > 0 ? 
        favorites.reduce((oldest, fav) => 
          new Date(fav.date) < new Date(oldest.date) ? fav : oldest
        ) : null,
      newestFavorite: favorites.length > 0 ? 
        favorites.reduce((newest, fav) => 
          new Date(fav.date) > new Date(newest.date) ? fav : newest
        ) : null
    };
  }
}