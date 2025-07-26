'use client';

import React, { useState, useEffect } from 'react';

// Types pour Magenta.js
interface MagentaNote {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity?: number;
}

interface MagentaSequence {
  notes: MagentaNote[];
  totalTime: number;
}

interface MagentaModel {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  sample?(numSamples: number, temperature?: number): Promise<MagentaSequence[]>;
}

// État du composant
interface MagentaTestState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  generatedNotes: MagentaNote[];
  status: string;
}

const MagentaTest: React.FC = () => {
  const [state, setState] = useState<MagentaTestState>({
    isLoading: false,
    isInitialized: false,
    error: null,
    generatedNotes: [],
    status: 'Prêt à tester Magenta.js'
  });

  const [model, setModel] = useState<MagentaModel | null>(null);

  // Test d'importation de Magenta.js
  const testMagentaImport = async () => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      status: 'Test d\'importation Magenta.js...' 
    }));

    try {
      // Tentative d'importation dynamique
      const magenta = await import('@magenta/music');
      
      setState(prev => ({ 
        ...prev, 
        status: 'Magenta.js importé avec succès ✅' 
      }));

      console.log('Magenta.js modules disponibles:', Object.keys(magenta));
      
      // Vérifier les modèles disponibles
      if (magenta.MusicVAE) {
        setState(prev => ({ 
          ...prev, 
          status: 'MusicVAE disponible ✅' 
        }));
      }
      
      if (magenta.MusicRNN) {
        setState(prev => ({ 
          ...prev, 
          status: 'MusicRNN disponible ✅' 
        }));
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        status: 'Import Magenta.js réussi ! Modèles détectés.' 
      }));

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: `Erreur import: ${error instanceof Error ? error.message : 'Inconnue'}`,
        status: 'Échec de l\'importation ❌' 
      }));
      console.error('Erreur importation Magenta.js:', error);
    }
  };

  // Test d'initialisation d'un modèle basique
  const testModelInitialization = async () => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      status: 'Initialisation d\'un modèle de test...' 
    }));

    try {
      // Importation des modules Magenta
      const magenta = await import('@magenta/music');
      
      setState(prev => ({ 
        ...prev, 
        status: 'Création d\'une instance MusicVAE...' 
      }));

      // URL de checkpoint pour un modèle pré-entraîné (exemple)
      // Note: Il faudra trouver les vraies URLs des checkpoints
      const checkpointUrl = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small';
      
      // Créer une instance du modèle
      const musicVAE = new magenta.MusicVAE(checkpointUrl);
      
      setState(prev => ({ 
        ...prev, 
        status: 'Instance créée, initialisation en cours...' 
      }));

      // Initialiser le modèle
      await musicVAE.initialize();
      
      setModel(musicVAE);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        isInitialized: true,
        status: 'Modèle MusicVAE initialisé avec succès ✅' 
      }));

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: `Erreur initialisation: ${error instanceof Error ? error.message : 'Inconnue'}`,
        status: 'Échec de l\'initialisation ❌' 
      }));
      console.error('Erreur initialisation modèle:', error);
    }
  };

  // Test de génération basique
  const testGeneration = async () => {
    if (!model || !state.isInitialized) {
      setState(prev => ({ 
        ...prev, 
        error: 'Modèle non initialisé',
        status: 'Veuillez d\'abord initialiser un modèle ⚠️' 
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      status: 'Génération d\'une séquence de test...' 
    }));

    try {
      // Tentative de génération
      if (model.sample) {
        const sequences = await model.sample(1, 0.8); // 1 sample, température 0.8
        
        if (sequences && sequences.length > 0) {
          const generatedSequence = sequences[0];
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            generatedNotes: generatedSequence.notes,
            status: `Génération réussie ! ${generatedSequence.notes.length} notes créées ✅` 
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            status: 'Génération vide (pas de notes) ⚠️' 
          }));
        }
      }

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: `Erreur génération: ${error instanceof Error ? error.message : 'Inconnue'}`,
        status: 'Échec de la génération ❌' 
      }));
      console.error('Erreur génération:', error);
    }
  };

  // Auto-test au montage
  useEffect(() => {
    // Test automatique de l'importation au montage
    testMagentaImport();
  }, []);

  return (
    <div className="p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl border border-purple-600/50">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">🤖 Test Magenta.js - Phase 1</h2>
      
      {/* Status */}
      <div className="mb-6 p-3 bg-slate-800/50 rounded-lg">
        <div className="text-sm text-slate-300 mb-2">Status :</div>
        <div className="text-white font-medium">{state.status}</div>
        {state.isLoading && (
          <div className="mt-2 text-blue-400 text-sm animate-pulse">⏳ Chargement...</div>
        )}
      </div>

      {/* Erreurs */}
      {state.error && (
        <div className="mb-6 p-3 bg-red-900/50 border border-red-600/50 rounded-lg">
          <div className="text-red-300 text-sm font-medium">❌ Erreur :</div>
          <div className="text-red-200 text-sm mt-1">{state.error}</div>
        </div>
      )}

      {/* Boutons de test */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testMagentaImport}
          disabled={state.isLoading}
          className={`px-4 py-3 rounded-lg font-medium transition-colors ${
            state.isLoading 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          📦 Test Import
        </button>

        <button
          onClick={testModelInitialization}
          disabled={state.isLoading}
          className={`px-4 py-3 rounded-lg font-medium transition-colors ${
            state.isLoading 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          🔧 Init Modèle
        </button>

        <button
          onClick={testGeneration}
          disabled={state.isLoading || !state.isInitialized}
          className={`px-4 py-3 rounded-lg font-medium transition-colors ${
            state.isLoading || !state.isInitialized
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          🎵 Générer
        </button>
      </div>

      {/* Résultats de génération */}
      {state.generatedNotes.length > 0 && (
        <div className="p-4 bg-green-900/30 border border-green-600/50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-300 mb-3">🎼 Notes générées par l'IA :</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {state.generatedNotes.slice(0, 10).map((note, index) => (
              <div key={index} className="text-sm text-green-200 font-mono">
                Note {index + 1}: Pitch={note.pitch}, Start={note.startTime.toFixed(2)}s, 
                Duration={((note.endTime - note.startTime)).toFixed(2)}s
                {note.velocity && `, Velocity=${note.velocity}`}
              </div>
            ))}
            {state.generatedNotes.length > 10 && (
              <div className="text-sm text-green-400">... et {state.generatedNotes.length - 10} autres notes</div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
        <h4 className="text-sm font-medium text-slate-300 mb-2">📋 Instructions :</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>1. Le test d'import s'exécute automatiquement</li>
          <li>2. Cliquez "Init Modèle" pour initialiser MusicVAE</li>
          <li>3. Cliquez "Générer" pour tester la génération IA</li>
          <li>4. Les notes générées apparaîtront dans la section verte</li>
        </ul>
      </div>
    </div>
  );
};

export default MagentaTest;