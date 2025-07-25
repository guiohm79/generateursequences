'use client';

import React, { useState, useEffect } from 'react';
import { getMenuCategories } from '../data/menuItems';
import { MenuSection } from '../components/MenuSection';
import { hubDataManager } from '../lib/HubDataManager';

export default function Home() {
  const categories = getMenuCategories();
  const [refreshKey, setRefreshKey] = useState(0);
  const [hubStats, setHubStats] = useState(hubDataManager.getStats());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');

  // Rafraîchir les stats quand les données changent
  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
    setHubStats(hubDataManager.getStats());
  };

  // Charger les stats au montage
  useEffect(() => {
    setHubStats(hubDataManager.getStats());
  }, [refreshKey]);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* En-tête interactif */}
        <div className="text-center mb-12">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                🎹 Melody Sequencer V2
              </h1>
              <p className="text-xl text-gray-300">
                HUB INTERACTIF - Développement Collaboratif
              </p>
            </div>
            
            {/* Actions Hub */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  setExportData(hubDataManager.exportData());
                  setShowExportDialog(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                📤 Export Hub
              </button>
              <button
                onClick={() => setShowImportDialog(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              >
                📥 Import Hub
              </button>
              <button
                onClick={() => {
                  if (confirm('Effacer toutes les données du Hub ?')) {
                    hubDataManager.clearAllData();
                    handleUpdate();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                🗑️ Reset
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-600/50 p-6 rounded-xl max-w-6xl mx-auto backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">🎯 État du Projet - Vue d'Ensemble</h2>
            
            {/* Statistiques Hub */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">{hubStats.totalItems}</div>
                <div className="text-sm text-gray-400">Items trackés</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{hubStats.totalCheckboxes}</div>
                <div className="text-sm text-gray-400">Tâches totales</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{hubStats.completedCheckboxes}</div>
                <div className="text-sm text-gray-400">Terminées</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-amber-400">{hubStats.totalNotes}</div>
                <div className="text-sm text-gray-400">Notes ajoutées</div>
              </div>
            </div>

            {/* Progression globale */}
            {hubStats.totalCheckboxes > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Progression Globale du Projet</span>
                  <span>{Math.round((hubStats.completedCheckboxes / hubStats.totalCheckboxes) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(hubStats.completedCheckboxes / hubStats.totalCheckboxes) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-200 mb-2">✅ <strong>Architecture Modulaire V2 :</strong></p>
                <ul className="text-green-100 space-y-1 ml-4">
                  <li>• Piano Roll modulaire (8 composants)</li>
                  <li>• 8 hooks spécialisés + 4 utilitaires</li>
                  <li>• Export/Import MIDI complet</li>
                  <li>• Presets + Undo/Redo + raccourcis</li>
                </ul>
              </div>
              <div>
                <p className="text-blue-200 mb-2">🔄 <strong>Hub Interactif Nouveau :</strong></p>
                <ul className="text-blue-100 space-y-1 ml-4">
                  <li>• Statuts modifiables en temps réel</li>
                  <li>• Checkboxes de tâches par fonctionnalité</li>
                  <li>• Notes collaboratives développeur</li>
                  <li>• Sauvegarde automatique LocalStorage</li>
                </ul>
              </div>
            </div>
            
            <p className="text-center text-purple-200 mt-4 font-medium">
              🚀 Cliquez sur "▼ Détails" de chaque carte pour interagir !
            </p>
          </div>
        </div>
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">
              {categories.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'stable').length, 0)}
            </div>
            <div className="text-sm text-gray-400">Stable</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {categories.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'testing').length, 0)}
            </div>
            <div className="text-sm text-gray-400">En test</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">
              {categories.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'new').length, 0)}
            </div>
            <div className="text-sm text-gray-400">Nouveau</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">
              {categories.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'planned').length, 0)}
            </div>
            <div className="text-sm text-gray-400">Planifié</div>
          </div>
        </div>
        
        {/* Sections du menu avec composants interactifs */}
        {categories.map(category => (
          <MenuSection 
            key={`${category.id}-${refreshKey}`}
            category={category}
            onUpdate={handleUpdate}
            useInteractiveCards={true}
          />
        ))}
        
        {/* Footer */}
        <div className="mt-16 text-center border-t border-gray-700 pt-8">
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-2">
              🎹 Melody Sequencer V2 - HUB INTERACTIF
            </p>
            <p className="text-gray-500 text-xs mb-1">
              Session 2025-07-25 : Hub interactif avec notes, checkboxes et persistance
            </p>
            <p className="text-gray-500 text-xs">
              Dernière mise à jour : {new Date(hubStats.lastUpdated).toLocaleString()}
            </p>
          </div>
          
          {/* Raccourcis rapides */}
          <div className="flex justify-center space-x-4 text-xs">
            <button
              onClick={() => handleUpdate()}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              🔄 Actualiser
            </button>
            <button
              onClick={() => hubDataManager.forceSave()}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              💾 Sauvegarder
            </button>
          </div>
        </div>
      </div>

      {/* Modal Export */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">📤 Export Données Hub</h2>
            <div className="flex-1 overflow-hidden">
              <textarea
                value={exportData}
                readOnly
                className="w-full h-full bg-gray-900 text-white text-sm p-4 rounded border border-gray-600 font-mono resize-none"
                placeholder="Données d'export..."
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-400">
                {exportData.length} caractères • {Object.keys(JSON.parse(exportData || '{"items":{}}')).length} items
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportData);
                    alert('Données copiées dans le presse-papiers !');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  📋 Copier
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([exportData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `melody-sequencer-hub-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  💾 Télécharger
                </button>
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">📥 Import Données Hub</h2>
            <div className="flex-1 overflow-hidden">
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full h-full bg-gray-900 text-white text-sm p-4 rounded border border-gray-600 font-mono resize-none"
                placeholder="Collez ici les données JSON à importer..."
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-400">
                Collez les données JSON ou utilisez le sélecteur de fichier
              </div>
              <div className="flex space-x-3">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setImportData(event.target?.result as string);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  📁 Fichier
                </label>
                <button
                  onClick={() => {
                    if (hubDataManager.importData(importData)) {
                      handleUpdate();
                      setShowImportDialog(false);
                      setImportData('');
                      alert('Import réussi !');
                    } else {
                      alert('Erreur lors de l\'import. Vérifiez le format JSON.');
                    }
                  }}
                  disabled={!importData.trim()}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    importData.trim()
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ✅ Importer
                </button>
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportData('');
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}