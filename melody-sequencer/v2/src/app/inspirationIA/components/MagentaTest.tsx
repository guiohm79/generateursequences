'use client';

import React, { useState, useEffect } from 'react';
import { 
  convertMagentaSequenceToNoteEvents, 
  createConversionOptions,
  debugConversion,
  MagentaNote,
  MagentaSequence
} from '../utils/magentaConverter';
import { NoteEvent } from '../types';

interface MagentaModel {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  sample?(numSamples: number, temperature?: number): Promise<MagentaSequence[]>;
}

// Props du composant
interface MagentaTestProps {
  stepCount: number;
  tempo: number;
  noteSpeed: string;
  onNotesGenerated: (notes: NoteEvent[]) => void;
}

// État du composant
interface MagentaTestState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  generatedNotes: MagentaNote[];
  convertedNotes: NoteEvent[];
  status: string;
}

const MagentaTest: React.FC<MagentaTestProps> = ({ 
  stepCount, 
  tempo, 
  noteSpeed,
  onNotesGenerated 
}) => {
  const [state, setState] = useState<MagentaTestState>({
    isLoading: false,
    isInitialized: false,
    error: null,
    generatedNotes: [],
    convertedNotes: [],
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
          
          // Créer les options de conversion basées sur le contexte du séquenceur
          const conversionOptions = createConversionOptions(stepCount, tempo, noteSpeed);
          
          // Debug de la conversion
          console.log('🔍 Séquence Magenta brute:', generatedSequence);
          console.log('⚙️ Options de conversion:', conversionOptions);
          debugConversion(generatedSequence, conversionOptions);
          
          // Convertir les notes Magenta en NoteEvent
          const convertedNotes = convertMagentaSequenceToNoteEvents(generatedSequence, conversionOptions);
          console.log('🎵 Notes converties:', convertedNotes);
          
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            generatedNotes: generatedSequence.notes,
            convertedNotes,
            status: `Génération réussie ! ${generatedSequence.notes.length} notes IA → ${convertedNotes.length} notes converties ✅` 
          }));
          
          // Envoyer les notes converties au piano roll
          if (convertedNotes.length > 0) {
            onNotesGenerated(convertedNotes);
          }
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
          🎵 Générer et Ajouter
        </button>
      </div>

      {/* Résultats de génération */}
      {state.generatedNotes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Notes IA brutes */}
          <div className="p-4 bg-green-900/30 border border-green-600/50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-300 mb-3">🤖 Notes brutes de l'IA :</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {state.generatedNotes.slice(0, 8).map((note, index) => (
                <div key={index} className="text-sm text-green-200 font-mono">
                  Pitch={note.pitch}, Start={note.startTime.toFixed(2)}s, 
                  Duration={((note.endTime - note.startTime)).toFixed(2)}s
                  {note.velocity && `, Vel=${note.velocity.toFixed(2)}`}
                </div>
              ))}
              {state.generatedNotes.length > 8 && (
                <div className="text-sm text-green-400">... et {state.generatedNotes.length - 8} autres</div>
              )}
            </div>
          </div>

          {/* Notes converties */}
          {state.convertedNotes.length > 0 && (
            <div className="p-4 bg-blue-900/30 border border-blue-600/50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">🎹 Notes converties pour le piano roll :</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {state.convertedNotes.map((note, index) => (
                  <div key={index} className="text-sm text-blue-200 font-mono">
                    Step {note.step}: {note.note}, Vel={note.velocity}, Dur={note.duration}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-blue-400">
                ✅ {state.convertedNotes.length} notes prêtes pour le piano roll (Tempo: {tempo} BPM, Steps: {stepCount})
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
        <h4 className="text-sm font-medium text-slate-300 mb-2">📋 Instructions Phase 2 :</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>1. Le test d'import s'exécute automatiquement ✅</li>
          <li>2. Cliquez "Init Modèle" pour initialiser MusicVAE</li>
          <li>3. Cliquez "Générer et Ajouter" pour créer et injecter des notes IA</li>
          <li>4. Les notes apparaissent automatiquement dans le piano roll !</li>
          <li>5. Vous pouvez les éditer, jouer et exporter normalement</li>
        </ul>
        <div className="mt-3 text-xs text-emerald-400 bg-emerald-900/20 p-2 rounded">
          ✨ <strong>Workflow optimisé</strong> : Une seule action génère et ajoute les notes IA !
        </div>
      </div>
    </div>
  );
};

export default MagentaTest;