/**
 * ScaleEditor - Éditeur de gammes musicales
 * Interface pour créer, modifier et gérer des gammes personnalisées
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ScaleManager, CustomScale, ScaleValidation } from '../lib/ScaleManager';

interface ScaleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onScaleCreated?: (scaleId: string) => void;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function ScaleEditor({ isOpen, onClose, onScaleCreated }: ScaleEditorProps) {
  const [scaleName, setScaleName] = useState('');
  const [scaleDescription, setScaleDescription] = useState('');
  const [selectedIntervals, setSelectedIntervals] = useState<boolean[]>(() => {
    const intervals = new Array(12).fill(false);
    intervals[0] = true; // Tonique toujours sélectionnée par défaut
    return intervals;
  });
  const [validation, setValidation] = useState<ScaleValidation>({ isValid: false, errors: [], warnings: [] });
  const [customScales, setCustomScales] = useState<CustomScale[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'import'>('create');
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<string>('');

  // Charger les gammes personnalisées
  useEffect(() => {
    if (isOpen) {
      setCustomScales(ScaleManager.getCustomScales());
    }
  }, [isOpen]);

  // Validation en temps réel
  useEffect(() => {
    const intervals = selectedIntervals
      .map((selected, index) => selected ? index : -1)
      .filter(interval => interval !== -1);
    
    setValidation(ScaleManager.validateScale(intervals, scaleName));
  }, [selectedIntervals, scaleName]);

  // Gestion de la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleIntervalToggle = (interval: number) => {
    const newIntervals = [...selectedIntervals];
    
    // La tonique (0) reste toujours activée
    if (interval === 0) {
      newIntervals[0] = true;
    } else {
      newIntervals[interval] = !newIntervals[interval];
    }
    
    setSelectedIntervals(newIntervals);
  };

  const handleCreateScale = () => {
    const intervals = selectedIntervals
      .map((selected, index) => selected ? index : -1)
      .filter(interval => interval !== -1);

    const success = ScaleManager.saveCustomScale({
      name: scaleName.trim(),
      intervals,
      description: scaleDescription.trim(),
      creator: 'Utilisateur'
    });

    if (success) {
      // Reset form
      setScaleName('');
      setScaleDescription('');
      const resetIntervals = new Array(12).fill(false);
      resetIntervals[0] = true; // Tonique toujours sélectionnée
      setSelectedIntervals(resetIntervals);
      
      // Refresh list
      setCustomScales(ScaleManager.getCustomScales());
      
      // Notify parent
      const scaleId = `custom_${scaleName.toLowerCase().replace(/\s+/g, '_')}`;
      onScaleCreated?.(scaleId);
      
      alert(`✅ Gamme "${scaleName}" créée avec succès !`);
    } else {
      alert('❌ Erreur lors de la création de la gamme');
    }
  };

  const handleDeleteScale = (scaleId: string, scaleName: string) => {
    if (confirm(`Supprimer définitivement la gamme "${scaleName}" ?`)) {
      const success = ScaleManager.deleteCustomScale(scaleId);
      if (success) {
        setCustomScales(ScaleManager.getCustomScales());
        alert(`✅ Gamme "${scaleName}" supprimée`);
      } else {
        alert('❌ Erreur lors de la suppression');
      }
    }
  };

  const handleExport = () => {
    const exportData = ScaleManager.exportScales();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom-scales-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setImportResult('❌ Veuillez coller des données JSON valides');
      return;
    }

    const result = ScaleManager.importScales(importText);
    
    if (result.success) {
      setImportResult(`✅ ${result.imported} gamme(s) importée(s) avec succès !`);
      setCustomScales(ScaleManager.getCustomScales());
      setImportText('');
      
      if (result.errors.length > 0) {
        setImportResult(prev => prev + `\n⚠️ Avertissements: ${result.errors.join(', ')}`);
      }
    } else {
      setImportResult(`❌ Échec import: ${result.errors.join(', ')}`);
    }
  };

  const loadPresetScale = (intervals: number[], name: string) => {
    const newSelectedIntervals = new Array(12).fill(false);
    intervals.forEach(interval => {
      newSelectedIntervals[interval] = true;
    });
    setSelectedIntervals(newSelectedIntervals);
    setScaleName(name);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-[800px] max-w-[95vw] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-900 z-10 pb-2 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">🎼 Éditeur de Gammes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            ✨ Créer
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'manage' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            📋 Gérer ({customScales.length})
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'import' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            📥 Import/Export
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom de la gamme *
                </label>
                <input
                  type="text"
                  value={scaleName}
                  onChange={(e) => setScaleName(e.target.value)}
                  placeholder="Ma gamme personnalisée"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  value={scaleDescription}
                  onChange={(e) => setScaleDescription(e.target.value)}
                  placeholder="Une gamme mystérieuse..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Sélecteur d'intervalles */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sélectionnez les notes de votre gamme :
              </label>
              <p className="text-xs text-gray-400 mb-3">
                💡 La tonique (C/0) est automatiquement incluse dans toute gamme. Cliquez sur les autres notes pour les ajouter.
              </p>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                {NOTE_NAMES.map((note, interval) => (
                  <button
                    key={interval}
                    onClick={() => handleIntervalToggle(interval)}
                    className={`
                      py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${selectedIntervals[interval]
                        ? interval === 0
                          ? 'bg-yellow-600 text-white cursor-pointer' // Tonique - clickable mais reste active
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                      ${interval === 0 ? 'ring-2 ring-yellow-400' : ''}
                    `}
                    title={interval === 0 ? 'Tonique (note fondamentale - toujours incluse)' : `${note} (${interval} demi-tons)`}
                  >
                    {note}
                    <br />
                    <span className="text-xs opacity-75">{interval}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Presets rapides */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Presets rapides :
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadPresetScale([0,2,4,5,7,9,11], 'Majeure')}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                >
                  Majeure
                </button>
                <button
                  onClick={() => loadPresetScale([0,2,3,5,7,8,10], 'Mineure')}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                >
                  Mineure
                </button>
                <button
                  onClick={() => loadPresetScale([0,2,3,5,7,9,10], 'Dorien')}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                >
                  Dorien
                </button>
                <button
                  onClick={() => loadPresetScale([0,1,3,5,7,8,10], 'Phrygien')}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                >
                  Phrygien
                </button>
                <button
                  onClick={() => loadPresetScale([0,3,5,6,7,10], 'Blues')}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                >
                  Blues
                </button>
              </div>
            </div>

            {/* Validation */}
            {(validation.errors.length > 0 || validation.warnings.length > 0) && (
              <div className="space-y-2">
                {validation.errors.map((error, index) => (
                  <div key={index} className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
                    ❌ {error}
                  </div>
                ))}
                {validation.warnings.map((warning, index) => (
                  <div key={index} className="text-yellow-400 text-sm bg-yellow-900/20 p-2 rounded">
                    ⚠️ {warning}
                  </div>
                ))}
              </div>
            )}

            {/* Aperçu */}
            {validation.isValid && (
              <div className="bg-green-900/20 border border-green-700/50 rounded p-3">
                <p className="text-green-300 text-sm mb-2">✅ Gamme valide !</p>
                <p className="text-gray-300 text-sm">
                  <strong>Intervalles :</strong> {selectedIntervals
                    .map((selected, index) => selected ? index : null)
                    .filter(interval => interval !== null)
                    .join(', ')}
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Notes :</strong> {selectedIntervals
                    .map((selected, index) => selected ? NOTE_NAMES[index] : null)
                    .filter(note => note !== null)
                    .join(', ')}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateScale}
                disabled={!validation.isValid}
                className={`px-4 py-2 rounded transition-colors ${
                  validation.isValid
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Créer la gamme
              </button>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-4">
            {customScales.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Aucune gamme personnalisée créée</p>
                <p className="text-sm mt-2">Utilisez l'onglet "Créer" pour commencer !</p>
              </div>
            ) : (
              customScales.map((scale) => (
                <div key={scale.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{scale.name}</h3>
                      {scale.description && (
                        <p className="text-sm text-gray-400 mt-1">{scale.description}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-300">
                        <p><strong>Intervalles :</strong> {scale.intervals.join(', ')}</p>
                        <p><strong>Notes :</strong> {scale.intervals.map(i => NOTE_NAMES[i]).join(', ')}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Créée le {new Date(scale.createdAt).toLocaleDateString()} par {scale.creator}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteScale(scale.id, scale.name)}
                      className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      title="Supprimer cette gamme"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Export */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">📤 Export</h3>
              <p className="text-sm text-gray-400 mb-3">
                Exportez vos gammes personnalisées pour les sauvegarder ou les partager.
              </p>
              <button
                onClick={handleExport}
                disabled={customScales.length === 0}
                className={`px-4 py-2 rounded transition-colors ${
                  customScales.length > 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Exporter {customScales.length} gamme(s)
              </button>
            </div>

            {/* Import */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">📥 Import</h3>
              <p className="text-sm text-gray-400 mb-3">
                Importez des gammes depuis un fichier JSON exporté.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Collez ici le contenu du fichier JSON..."
                className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm resize-vertical"
              />
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className={`px-4 py-2 rounded transition-colors ${
                    importText.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Importer
                </button>
                <button
                  onClick={() => setImportText('')}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                >
                  Effacer
                </button>
              </div>
              {importResult && (
                <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-600">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">{importResult}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bouton fermer en bas */}
        <div className="pt-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}