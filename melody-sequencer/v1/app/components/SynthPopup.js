"use client";
import React, { useState, useEffect } from "react";
import { SYNTH_PRESETS } from "../lib/synthPresets";
import { PresetStorage } from "../lib/presetStorage";
import SynthParamEditor from "./SynthParamEditor";

export default function SynthPopup({ visible, current, onSelect, onCancel }) {
  // État pour le preset sélectionné et le mode d'édition
  const [selected, setSelected] = useState(current || SYNTH_PRESETS[0].key);
  const [editMode, setEditMode] = useState(false);
  const [editedPreset, setEditedPreset] = useState(null);
  const [allPresets, setAllPresets] = useState([]);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Charger tous les presets (par défaut + personnalisés) au démarrage
  useEffect(() => {
    if (visible) {
      try {
        const presets = PresetStorage.getAllPresets();
        console.log('Presets chargés:', presets.length);
        setAllPresets(presets);
      } catch (err) {
        console.error('Erreur lors du chargement des presets:', err);
        // Utiliser les presets par défaut en cas d'erreur
        setAllPresets([...SYNTH_PRESETS]);
      }
    }
  }, [visible]);

  if (!visible) return null;

  // Trouver le preset actuel
  const preset = allPresets.find(p => p.key === selected) || SYNTH_PRESETS[0];
  const isCustomPreset = PresetStorage.isCustomPreset(selected);

  // Entrer en mode édition avec un preset
  const startEditMode = () => {
    // Faire une copie profonde pour éviter les modifications accidentelles
    const presetCopy = JSON.parse(JSON.stringify(preset));
    console.log('Édition du preset:', presetCopy);
    setEditedPreset(presetCopy);
    setEditMode(true);
  };

  // Quitter le mode édition
  const exitEditMode = () => {
    setEditedPreset(null);
    setEditMode(false);
    setShowSaveDialog(false);
  };

  // Gérer les changements dans l'éditeur de paramètres
  const handleParamChange = (updatedParams) => {
    console.log('Paramètres mis à jour:', updatedParams);
    setEditedPreset(updatedParams);
  };

  // Créer un nouveau preset
  const createNewPreset = () => {
    // Commencer avec une copie du preset actuel
    const newPreset = {
      ...JSON.parse(JSON.stringify(preset)), // Copie profonde pour éviter les références partagées
      key: "",
      label: "Nouveau Preset",
      description: "Mon preset personnalisé"
    };
    console.log('Création d\'un nouveau preset basé sur:', preset.key);
    setEditedPreset(newPreset);
    setEditMode(true);
  };

  // Sauvegarder le preset personnalisé
  const saveCustomPreset = () => {
    // Ouvrir la boîte de dialogue pour nommer le preset
    setShowSaveDialog(true);
    // Initialiser le nom suggéré
    setPresetNameInput(editedPreset.label);
  };

  // Finaliser la sauvegarde avec le nom choisi
  const confirmSavePreset = () => {
    try {
      // S'assurer que toutes les propriétés requises sont présentes
      const newPreset = {
        ...editedPreset,
        key: editedPreset.key || PresetStorage.generateUniqueKey(presetNameInput),
        label: presetNameInput,
        // S'assurer que ces propriétés essentielles sont définies
        synthType: editedPreset.synthType || 'PolySynth',
        description: editedPreset.description || ''
      };
      
      // S'assurer que les options sont complètes
      if (!newPreset.options) newPreset.options = {};
      if (!newPreset.options.oscillator) newPreset.options.oscillator = { type: 'sine' };
      if (!newPreset.options.envelope) newPreset.options.envelope = { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 };
      
      // Afficher dans la console pour débogage
      console.log('Sauvegarde du preset:', JSON.stringify(newPreset));
      
      // Sauvegarder dans le stockage local
      const saved = PresetStorage.saveCustomPreset(newPreset);
      
      if (!saved) {
        console.error('Échec de la sauvegarde du preset');
        alert('Impossible de sauvegarder le preset. Vérifiez la console pour plus de détails.');
        return;
      }
      
      // Mettre à jour la liste des presets
      const updatedPresets = PresetStorage.getAllPresets();
      setAllPresets(updatedPresets);
      
      // Sélectionner le nouveau preset
      setSelected(newPreset.key);
      
      // Fermer la boîte de dialogue et quitter le mode édition
      setShowSaveDialog(false);
      exitEditMode();
      
      // Confirmation à l'utilisateur
      console.log('Preset sauvegardé avec succès');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du preset:', err);
      alert('Une erreur est survenue lors de la sauvegarde du preset.');
    }
  };

  // Supprimer un preset personnalisé
  const deleteCustomPreset = () => {
    if (!isCustomPreset) return;
    
    if (confirm("Êtes-vous sûr de vouloir supprimer ce preset ?")) {
      PresetStorage.deleteCustomPreset(selected);
      
      // Mettre à jour la liste et sélectionner le premier preset
      const updatedPresets = PresetStorage.getAllPresets();
      setAllPresets(updatedPresets);
      setSelected(updatedPresets[0].key);
    }
  };

  return (
    <div className="random-popup-overlay">
      <div className="random-popup-modal" style={{ width: 650, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto" }}>
        <h3>{editMode ? "Édition du Synthétiseur" : "Choix du son / Edit Synthé"}</h3>
        
        {!editMode ? (
          // Mode sélection de preset
          <div className="preset-selector">
            <div className="preset-header">
              <div className="preset-select-wrapper">
                <label>Preset :</label>
                <select
                  value={selected}
                  onChange={e => setSelected(e.target.value)}
                >
                  <optgroup label="Presets par défaut">
                    {SYNTH_PRESETS.map(p => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </optgroup>
                  
                  {PresetStorage.getCustomPresets().length > 0 && (
                    <optgroup label="Mes presets personnalisés">
                      {PresetStorage.getCustomPresets().map(p => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              
              <div className="preset-actions">
                <button 
                  className="btn secondary" 
                  onClick={createNewPreset}
                >
                  Nouveau
                </button>
                
                <button 
                  className="btn edit"
                  onClick={startEditMode}
                >
                  Éditer
                </button>
                
                {isCustomPreset && (
                  <button 
                    className="btn delete"
                    onClick={deleteCustomPreset}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
            
            <div className="preset-description">
              {preset?.description}
            </div>
            
            <div className="preset-details">
              <div>Type: <span>{preset?.synthType}</span></div>
              <div>Oscillateur: <span>{preset?.options?.oscillator?.type || "sine"}</span></div>
              <div>
                ADSR: <span>
                  A:{(preset?.options?.envelope?.attack || 0).toFixed(2)}s, 
                  D:{(preset?.options?.envelope?.decay || 0).toFixed(2)}s, 
                  S:{(preset?.options?.envelope?.sustain || 0).toFixed(2)}, 
                  R:{(preset?.options?.envelope?.release || 0).toFixed(2)}s
                </span>
              </div>
            </div>
            
            <div className="random-popup-actions">
              <button className="btn" onClick={onCancel}>
                Annuler
              </button>
              <button className="btn primary" onClick={() => {
                // Envoyer l'objet preset complet au lieu de juste la clé
                // Ceci permet au composant parent de recevoir toutes les données du preset
                console.log('Preset sélectionné pour application:', preset);
                onSelect(preset);
              }}>
                Appliquer ce son
              </button>
            </div>
          </div>
        ) : (
          // Mode édition de preset
          <div className="preset-editor">
            <SynthParamEditor 
              preset={editedPreset}
              onChange={handleParamChange}
            />
            
            {/* Dialogue de sauvegarde */}
            {showSaveDialog && (
              <div className="save-dialog">
                <h4>Sauvegarder le preset</h4>
                <div className="param-row">
                  <label htmlFor="presetName">Nom du preset :</label>
                  <input
                    id="presetName"
                    type="text"
                    value={presetNameInput}
                    onChange={e => setPresetNameInput(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="save-dialog-actions">
                  <button className="btn" onClick={() => setShowSaveDialog(false)}>
                    Annuler
                  </button>
                  <button 
                    className="btn primary"
                    onClick={confirmSavePreset}
                    disabled={!presetNameInput.trim()}
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            )}
            
            <div className="random-popup-actions">
              <button className="btn" onClick={exitEditMode}>
                Annuler
              </button>
              <button className="btn primary" onClick={saveCustomPreset}>
                Sauvegarder
              </button>
            </div>
          </div>
        )}
        
        <style jsx>{`
          .preset-selector {
            display: flex;
            flex-direction: column;
          }
          .preset-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .preset-select-wrapper {
            display: flex;
            align-items: center;
          }
          .preset-select-wrapper label {
            color: #00eaff;
            font-weight: 500;
            margin-right: 12px;
          }
          .preset-select-wrapper select {
            width: 200px;
            background: #2a2a3a;
            border: 1px solid #444;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
          }
          .preset-actions {
            display: flex;
            gap: 10px;
          }
          .preset-description {
            margin: 18px 0;
            color: #aef;
            font-style: italic;
          }
          .preset-details {
            background: #1a1a2a;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .preset-details div {
            display: flex;
            gap: 8px;
            color: #00eaff;
          }
          .preset-details span {
            color: white;
          }
          .random-popup-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
          }
          .btn {
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            background: #333;
            color: white;
            font-weight: 500;
          }
          .btn.primary {
            background: #00eaff;
            color: #111;
          }
          .btn.secondary {
            background: #4d4d73;
          }
          .btn.edit {
            background: #4a7;
          }
          .btn.delete {
            background: #a44;
          }
          .save-dialog {
            background: rgba(20, 20, 35, 0.95);
            border: 1px solid #555;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
          }
          .save-dialog h4 {
            margin: 0 0 15px 0;
            color: #00eaff;
          }
          .param-row {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
          }
          .param-row label {
            width: 120px;
            color: #00eaff;
          }
          .param-row input {
            flex: 1;
            background: #2a2a3a;
            border: 1px solid #444;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
          }
          .save-dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }
        `}</style>
      </div>
    </div>
  );
}
