"use client";
import React, { useState, useEffect } from "react";
import { ScalesStorage } from "../lib/scalesStorage";

export default function ScalesManagerPopup({ 
  visible, 
  onCancel,
  onScalesUpdated // Callback pour notifier les changements
}) {
  const [scales, setScales] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingScale, setEditingScale] = useState(null);
  
  // États pour le formulaire de création/édition
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    category: '',
    intervals: []
  });
  const [intervalsInput, setIntervalsInput] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  // Charger les données au montage
  useEffect(() => {
    if (visible) {
      loadScales();
      loadCategories();
    }
  }, [visible]);

  const loadScales = () => {
    try {
      const allScales = ScalesStorage.getAllScales();
      setScales(allScales);
    } catch (error) {
      console.error("Erreur lors du chargement des gammes:", error);
      alert("Erreur lors du chargement des gammes");
    }
  };

  const loadCategories = () => {
    try {
      const cats = ScalesStorage.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
    }
  };

  // Filtrer les gammes selon les critères
  const getFilteredScales = () => {
    let filtered = scales;

    if (searchTerm) {
      filtered = ScalesStorage.searchScales(searchTerm);
    }

    if (selectedCategory) {
      filtered = ScalesStorage.getScalesByCategory(selectedCategory);
    }

    // Si les deux filtres sont actifs, appliquer la recherche sur la catégorie
    if (searchTerm && selectedCategory) {
      const categoryScales = ScalesStorage.getScalesByCategory(selectedCategory);
      filtered = {};
      Object.entries(categoryScales).forEach(([key, scale]) => {
        const lowercaseQuery = searchTerm.toLowerCase();
        if (
          scale.name.toLowerCase().includes(lowercaseQuery) ||
          scale.description.toLowerCase().includes(lowercaseQuery) ||
          key.toLowerCase().includes(lowercaseQuery)
        ) {
          filtered[key] = scale;
        }
      });
    }

    return filtered;
  };

  // Valider les intervalles en temps réel
  const validateIntervals = (inputValue) => {
    try {
      const intervals = inputValue
        .split(/[,\s]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => parseInt(s, 10));

      const result = ScalesStorage.validateIntervals(intervals);
      setValidationResult(result);
      
      if (result.isValid) {
        setFormData(prev => ({ ...prev, intervals }));
      }
      
      return result;
    } catch (error) {
      const result = { isValid: false, errors: ['Format invalide'], warnings: [] };
      setValidationResult(result);
      return result;
    }
  };

  const handleIntervalsChange = (value) => {
    setIntervalsInput(value);
    validateIntervals(value);
  };

  const handleCreateScale = () => {
    setShowCreateForm(true);
    setEditingScale(null);
    setFormData({
      key: '',
      name: '',
      description: '',
      category: 'Personnel',
      intervals: []
    });
    setIntervalsInput('');
    setValidationResult(null);
  };

  const handleEditScale = (key, scale) => {
    if (scale.isDefault) {
      alert("Impossible de modifier une gamme par défaut");
      return;
    }
    
    setShowCreateForm(true);
    setEditingScale(key);
    setFormData({
      key,
      name: scale.name,
      description: scale.description,
      category: scale.category,
      intervals: scale.intervals
    });
    setIntervalsInput(scale.intervals.join(', '));
    validateIntervals(scale.intervals.join(', '));
  };

  const handleDeleteScale = (key, scale) => {
    if (scale.isDefault) {
      alert("Impossible de supprimer une gamme par défaut");
      return;
    }

    if (window.confirm(`Supprimer définitivement la gamme "${scale.name}" ?`)) {
      try {
        ScalesStorage.deleteScale(key);
        loadScales();
        loadCategories();
        onScalesUpdated && onScalesUpdated();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert(`Erreur lors de la suppression: ${error.message}`);
      }
    }
  };

  const handleSaveScale = () => {
    if (!formData.name.trim()) {
      alert("Veuillez entrer un nom pour la gamme");
      return;
    }

    if (!validationResult || !validationResult.isValid) {
      alert("Veuillez corriger les erreurs dans les intervalles");
      return;
    }

    try {
      const key = editingScale || ScalesStorage.generateUniqueKey(formData.name);
      
      const scaleData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category || 'Personnel',
        intervals: formData.intervals
      };

      if (editingScale) {
        ScalesStorage.updateScale(key, scaleData);
      } else {
        ScalesStorage.saveScale(key, scaleData);
      }

      setShowCreateForm(false);
      setEditingScale(null);
      loadScales();
      loadCategories();
      onScalesUpdated && onScalesUpdated();
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  };

  const handleExportScales = () => {
    try {
      const exportData = ScalesStorage.exportScales();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `melody_sequencer_scales_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export des gammes");
    }
  };

  const handleImportScales = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target.result;
        const success = ScalesStorage.importScales(jsonData, true);
        if (success) {
          loadScales();
          loadCategories();
          onScalesUpdated && onScalesUpdated();
          alert("Gammes importées avec succès !");
        } else {
          alert("Erreur lors de l'import des gammes");
        }
      } catch (error) {
        console.error("Erreur lors de l'import:", error);
        alert(`Erreur lors de l'import: ${error.message}`);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  // Rendre les intervalles sous forme de notes
  const renderIntervals = (intervals) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return intervals.map(interval => noteNames[interval % 12]).join(' - ');
  };

  if (!visible) return null;

  const filteredScales = getFilteredScales();
  const scaleEntries = Object.entries(filteredScales);

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
        minWidth: '700px',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#00eaff' }}>🎵 Gestionnaire de gammes</h2>
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

        {!showCreateForm ? (
          <>
            {/* Barre d'actions */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginBottom: '20px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <button
                onClick={handleCreateScale}
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
                ➕ Nouvelle gamme
              </button>

              <button
                onClick={handleExportScales}
                style={{
                  background: '#2196F3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
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
                  onChange={handleImportScales}
                  style={{ display: 'none' }}
                />
              </label>

              <span style={{ color: '#888', fontSize: '14px' }}>
                {scaleEntries.length} gamme{scaleEntries.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Filtres */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginBottom: '20px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Rechercher une gamme..."
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
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '6px'
                }}
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Liste des gammes */}
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {scaleEntries.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#888', 
                  padding: '40px',
                  fontSize: '16px'
                }}>
                  Aucune gamme ne correspond aux critères
                </div>
              ) : (
                scaleEntries.map(([key, scale]) => (
                  <div key={key} style={{
                    backgroundColor: '#2a2a2a',
                    border: `1px solid ${scale.isDefault ? '#666' : '#444'}`,
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
                          color: scale.isDefault ? '#888' : '#00eaff',
                          fontSize: '16px'
                        }}>
                          {scale.name}
                          {scale.isDefault && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#666',
                              marginLeft: '8px',
                              fontWeight: 'normal'
                            }}>
                              (par défaut)
                            </span>
                          )}
                        </h3>
                        <span style={{
                          backgroundColor: '#444',
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '11px'
                        }}>
                          {scale.category}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                        Intervalles: {scale.intervals.join(', ')} ({scale.intervals.length} notes)
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '8px' }}>
                        Notes (en C): {renderIntervals(scale.intervals)}
                      </div>
                      
                      {scale.description && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#bbb',
                          fontStyle: 'italic',
                          marginTop: '8px'
                        }}>
                          {scale.description}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
                      {!scale.isDefault && (
                        <>
                          <button
                            onClick={() => handleEditScale(key, scale)}
                            style={{
                              background: '#2196F3',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Éditer
                          </button>
                          <button
                            onClick={() => handleDeleteScale(key, scale)}
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
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Formulaire de création/édition */
          <div>
            <h3 style={{ color: '#00eaff', marginBottom: '20px' }}>
              {editingScale ? 'Modifier la gamme' : 'Créer une nouvelle gamme'}
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Nom de la gamme *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ma gamme personnalisée"
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
                Catégorie
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Personnel"
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
                Intervalles (demi-tons depuis la fondamentale) *
              </label>
              <input
                type="text"
                value={intervalsInput}
                onChange={(e) => handleIntervalsChange(e.target.value)}
                placeholder="0, 2, 4, 5, 7, 9, 11"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: `1px solid ${validationResult?.isValid === false ? '#ff4444' : '#555'}`,
                  borderRadius: '6px'
                }}
              />
              <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>
                Séparez les intervalles par des virgules ou des espaces (0-11)
              </div>
              
              {validationResult && (
                <div style={{ marginTop: '8px' }}>
                  {validationResult.errors.map((error, i) => (
                    <div key={i} style={{ color: '#ff4444', fontSize: '12px' }}>
                      ❌ {error}
                    </div>
                  ))}
                  {validationResult.warnings.map((warning, i) => (
                    <div key={i} style={{ color: '#ffaa00', fontSize: '12px' }}>
                      ⚠️ {warning}
                    </div>
                  ))}
                  {validationResult.isValid && formData.intervals.length > 0 && (
                    <div style={{ color: '#4CAF50', fontSize: '12px' }}>
                      ✅ Aperçu (en C): {renderIntervals(formData.intervals)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Description (optionnel)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de cette gamme..."
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
                onClick={() => setShowCreateForm(false)}
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
                onClick={handleSaveScale}
                disabled={!validationResult?.isValid || !formData.name.trim()}
                style={{
                  background: (validationResult?.isValid && formData.name.trim()) ? '#4CAF50' : '#666',
                  color: (validationResult?.isValid && formData.name.trim()) ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: (validationResult?.isValid && formData.name.trim()) ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {editingScale ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}