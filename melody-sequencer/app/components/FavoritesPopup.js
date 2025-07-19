"use client";
import React, { useState, useEffect } from "react";
import { FavoritesStorage } from "../lib/favoritesStorage";

export default function FavoritesPopup({ 
  visible, 
  onLoadFavorite, 
  onCancel,
  currentPattern,
  currentGenerationParams,
  sequencerSettings 
}) {
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFavoriteName, setNewFavoriteName] = useState("");
  const [newFavoriteTags, setNewFavoriteTags] = useState("");
  const [newFavoriteNotes, setNewFavoriteNotes] = useState("");
  const [selectedFavorite, setSelectedFavorite] = useState(null);
  const [sortBy, setSortBy] = useState("date"); // date, name, tags

  // Charger les favoris et tags au montage et quand visible change
  useEffect(() => {
    if (visible) {
      loadFavorites();
      loadTags();
    }
  }, [visible]);

  const loadFavorites = () => {
    try {
      const allFavorites = FavoritesStorage.getAllFavorites();
      setFavorites(allFavorites);
    } catch (error) {
      console.error("Erreur lors du chargement des favoris:", error);
      alert("Erreur lors du chargement des favoris");
    }
  };

  const loadTags = () => {
    try {
      const tags = FavoritesStorage.getAllTags();
      setAllTags(tags);
    } catch (error) {
      console.error("Erreur lors du chargement des tags:", error);
    }
  };

  // Filtrer et trier les favoris
  const getFilteredFavorites = () => {
    let filtered = favorites;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = FavoritesStorage.searchFavorites(searchTerm);
    }

    // Filtrage par tag
    if (selectedTag) {
      filtered = filtered.filter(fav => fav.tags.includes(selectedTag));
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "tags":
          return (a.tags[0] || "").localeCompare(b.tags[0] || "");
        case "date":
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;
  };

  const handleSaveFavorite = () => {
    if (!newFavoriteName.trim()) {
      alert("Veuillez entrer un nom pour le favori");
      return;
    }

    if (!currentPattern || Object.keys(currentPattern).length === 0) {
      alert("Aucun pattern à sauvegarder");
      return;
    }

    const tags = newFavoriteTags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const favoriteData = {
      name: newFavoriteName.trim(),
      pattern: currentPattern,
      generationParams: currentGenerationParams,
      sequencerSettings: sequencerSettings,
      tags: tags,
      notes: newFavoriteNotes.trim()
    };

    try {
      const id = FavoritesStorage.saveFavorite(favoriteData);
      console.log(`Favori sauvegardé avec l'ID: ${id}`);
      
      // Réinitialiser le formulaire
      setNewFavoriteName("");
      setNewFavoriteTags("");
      setNewFavoriteNotes("");
      setShowSaveDialog(false);
      
      // Recharger la liste
      loadFavorites();
      loadTags();
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde du favori");
    }
  };

  const handleLoadFavorite = (favorite) => {
    setSelectedFavorite(favorite);
    
    // Confirmer le chargement
    if (window.confirm(`Charger le favori "${favorite.name}" ?\nCela remplacera le pattern actuel.`)) {
      onLoadFavorite(favorite);
      onCancel(); // Fermer la popup après chargement
    }
  };

  const handleDeleteFavorite = (favoriteId, favoriteName) => {
    if (window.confirm(`Supprimer définitivement le favori "${favoriteName}" ?`)) {
      try {
        FavoritesStorage.deleteFavorite(favoriteId);
        loadFavorites();
        loadTags();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression du favori");
      }
    }
  };

  const handleExportFavorites = () => {
    try {
      const exportData = FavoritesStorage.exportFavorites();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `melody_sequencer_favorites_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export des favoris");
    }
  };

  const handleImportFavorites = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target.result;
        const success = FavoritesStorage.importFavorites(jsonData, true);
        if (success) {
          loadFavorites();
          loadTags();
          alert("Favoris importés avec succès !");
        } else {
          alert("Erreur lors de l'import des favoris");
        }
      } catch (error) {
        console.error("Erreur lors de l'import:", error);
        alert("Fichier invalide");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPatternInfo = (pattern) => {
    let noteCount = 0;
    Object.values(pattern).forEach(steps => {
      if (Array.isArray(steps)) {
        noteCount += steps.filter(step => step && step.on).length;
      }
    });
    return { noteCount };
  };

  if (!visible) return null;

  const filteredFavorites = getFilteredFavorites();

  return (
    <div className="popup-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="popup-content" style={{
        backgroundColor: '#1a1a1a',
        border: '2px solid #444',
        borderRadius: '12px',
        padding: '20px',
        minWidth: '600px',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#00eaff' }}>Favoris</h2>
          <button 
            onClick={onCancel}
            style={{
              background: '#ff4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Barre d'actions */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setShowSaveDialog(true)}
            style={{
              background: '#4CAF50',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ⭐ Ajouter aux favoris
          </button>

          <button
            onClick={handleExportFavorites}
            disabled={favorites.length === 0}
            style={{
              background: favorites.length > 0 ? '#2196F3' : '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: favorites.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            📤 Exporter
          </button>

          <label style={{
            background: '#FF9800',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            📥 Importer
            <input
              type="file"
              accept=".json"
              onChange={handleImportFavorites}
              style={{ display: 'none' }}
            />
          </label>

          <span style={{ color: '#888', fontSize: '14px' }}>
            {favorites.length} favori{favorites.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filtres et recherche */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '6px',
              minWidth: '200px'
            }}
          />

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '6px'
            }}
          >
            <option value="">Tous les tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '6px'
            }}
          >
            <option value="date">Trier par date</option>
            <option value="name">Trier par nom</option>
            <option value="tags">Trier par tags</option>
          </select>
        </div>

        {/* Liste des favoris */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredFavorites.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#888', 
              padding: '40px',
              fontSize: '16px'
            }}>
              {favorites.length === 0 ? 
                "Aucun favori sauvegardé" : 
                "Aucun favori ne correspond aux critères"
              }
            </div>
          ) : (
            filteredFavorites.map(favorite => {
              const patternInfo = getPatternInfo(favorite.pattern);
              return (
                <div key={favorite.id} style={{
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: '#00eaff',
                        fontSize: '16px'
                      }}>
                        {favorite.name}
                      </h3>
                      {favorite.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {favorite.tags.map(tag => (
                            <span key={tag} style={{
                              backgroundColor: '#444',
                              color: '#fff',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '11px'
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                      {formatDate(favorite.date)} • {patternInfo.noteCount} notes
                      {favorite.sequencerSettings && (
                        <> • {favorite.sequencerSettings.tempo} BPM • {favorite.sequencerSettings.steps} pas</>
                      )}
                    </div>
                    
                    {favorite.generationParams && (
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                        Style: {favorite.generationParams.style} • 
                        Gamme: {favorite.generationParams.scale} • 
                        Root: {favorite.generationParams.rootNote}
                        {favorite.generationParams.seed && (
                          <> • Seed: {favorite.generationParams.seed}</>
                        )}
                      </div>
                    )}
                    
                    {favorite.notes && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#ccc',
                        fontStyle: 'italic',
                        marginTop: '8px',
                        maxWidth: '400px'
                      }}>
                        &ldquo;{favorite.notes}&rdquo;
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
                    <button
                      onClick={() => handleLoadFavorite(favorite)}
                      style={{
                        background: '#4CAF50',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      Charger
                    </button>
                    <button
                      onClick={() => handleDeleteFavorite(favorite.id, favorite.name)}
                      style={{
                        background: '#ff4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Suppr.
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dialog de sauvegarde */}
        {showSaveDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1001
          }}>
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '2px solid #444',
              borderRadius: '12px',
              padding: '20px',
              minWidth: '400px',
              color: '#fff'
            }}>
              <h3 style={{ marginTop: 0, color: '#00eaff' }}>Sauvegarder comme favori</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Nom du favori *
                </label>
                <input
                  type="text"
                  value={newFavoriteName}
                  onChange={(e) => setNewFavoriteName(e.target.value)}
                  placeholder="Nom du pattern"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={newFavoriteTags}
                  onChange={(e) => setNewFavoriteTags(e.target.value)}
                  placeholder="bassline, goa, dark"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Notes (optionnel)
                </label>
                <textarea
                  value={newFavoriteNotes}
                  onChange={(e) => setNewFavoriteNotes(e.target.value)}
                  placeholder="Commentaires sur ce pattern..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '6px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  style={{
                    background: '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveFavorite}
                  style={{
                    background: '#4CAF50',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}