'use client';

import React, { useState, useEffect } from 'react';
import { PresetManager } from '../../lib/PresetManager';
import { SequencerPreset } from '../../types';

export default function PresetsPage() {
  const [presets, setPresets] = useState<SequencerPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<SequencerPreset | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les presets au montage
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    const allPresets = PresetManager.getAllPresets();
    setPresets(allPresets.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Veuillez entrer un nom pour le preset');
      return;
    }

    // Exemple de données - en vrai il faudrait récupérer du piano roll
    const exampleNotes = [
      { step: 0, note: 'C4', velocity: 80, isActive: true, duration: 1 },
      { step: 4, note: 'E4', velocity: 100, isActive: true, duration: 1 },
      { step: 8, note: 'G4', velocity: 90, isActive: true, duration: 2 },
    ];

    const preset = PresetManager.savePreset(
      presetName,
      16,
      exampleNotes,
      { description: 'Preset créé depuis l\'interface' }
    );

    setPresets(prev => [preset, ...prev]);
    setPresetName('');
    setShowSaveDialog(false);
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce preset ?')) {
      if (PresetManager.deletePreset(id)) {
        setPresets(prev => prev.filter(p => p.id !== id));
        if (selectedPreset?.id === id) {
          setSelectedPreset(null);
        }
      }
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const importedPresets = await PresetManager.importMultiplePresets(file);
    if (importedPresets.length > 0) {
      loadPresets();
      alert(`${importedPresets.length} preset(s) importé(s) avec succès`);
    } else {
      alert('Erreur lors de l\'import du fichier');
    }

    // Reset input
    event.target.value = '';
  };

  const filteredPresets = presets.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎵 Gestionnaire de Presets
          </h1>
          <p className="text-slate-300">
            Sauvegardez, chargez et partagez vos séquences
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            💾 Sauvegarder Preset
          </button>
          
          <label className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer">
            📁 Importer Preset
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => PresetManager.exportAllPresets()}
            disabled={presets.length === 0}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            📤 Exporter Tous
          </button>
        </div>

        {/* Recherche */}
        <div className="mb-6 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Rechercher un preset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Liste des presets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredPresets.map(preset => (
            <div
              key={preset.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedPreset?.id === preset.id
                  ? 'border-purple-500 bg-slate-800/80'
                  : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
              }`}
              onClick={() => setSelectedPreset(preset)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-medium truncate">{preset.name}</h3>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      PresetManager.exportPreset(preset);
                    }}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    📤
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(preset.id);
                    }}
                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-slate-400 space-y-1">
                <div>📅 {new Date(preset.timestamp).toLocaleDateString()}</div>
                <div>🎵 {preset.notes.length} notes</div>
                <div>📏 {preset.steps} steps</div>
                {preset.metadata?.description && (
                  <div className="text-xs italic">{preset.metadata.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPresets.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            {searchTerm ? 'Aucun preset trouvé' : 'Aucun preset sauvegardé'}
          </div>
        )}

        {/* Détails du preset sélectionné */}
        {selectedPreset && (
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600">
            <h2 className="text-2xl font-bold text-white mb-4">
              {selectedPreset.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Informations</h3>
                <div className="space-y-2 text-slate-300">
                  <div>📅 Créé le: {new Date(selectedPreset.timestamp).toLocaleString()}</div>
                  <div>🎵 Notes: {selectedPreset.notes.length}</div>
                  <div>📏 Steps: {selectedPreset.steps}</div>
                  {selectedPreset.metadata?.bpm && (
                    <div>🎼 BPM: {selectedPreset.metadata.bpm}</div>
                  )}
                  {selectedPreset.metadata?.author && (
                    <div>👤 Auteur: {selectedPreset.metadata.author}</div>
                  )}
                  {selectedPreset.metadata?.description && (
                    <div>📝 Description: {selectedPreset.metadata.description}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Aperçu des Notes</h3>
                <div className="max-h-40 overflow-y-auto bg-slate-900 rounded p-3 text-sm">
                  {selectedPreset.notes.map((note, index) => (
                    <div key={index} className="text-slate-300 font-mono">
                      Step {note.step}: {note.note} (vel: {note.velocity}, dur: {note.duration})
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <button
                onClick={() => {
                  // TODO: Charger dans le piano roll
                  alert('Chargement dans le piano roll à implémenter');
                }}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                🎹 Charger dans Piano Roll
              </button>
              
              <button
                onClick={() => setSelectedPreset(null)}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Dialog de sauvegarde */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-white mb-4">
                Sauvegarder un nouveau preset
              </h2>
              
              <input
                type="text"
                placeholder="Nom du preset"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none mb-4"
                autoFocus
              />
              
              <div className="flex gap-4">
                <button
                  onClick={handleSavePreset}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setPresetName('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}