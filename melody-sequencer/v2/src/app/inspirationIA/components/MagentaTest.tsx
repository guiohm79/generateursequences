'use client';

import React, { useState, useEffect } from 'react';
import { 
  convertMagentaSequenceToNoteEvents, 
  createConversionOptions,
  debugConversion,
  MagentaNote,
  MagentaSequence
} from '../utils/magentaConverter';
import { 
  applyMusicalConstraints,
  createConstraintsFromParams,
  applyConstraintPreset,
  CONSTRAINT_PRESETS,
  AIConstraints
} from '../utils/aiConstraints';
import { NoteEvent } from '../types';
import { GenerationParams, getAvailableScales, NOTE_ORDER } from '../../../lib/InspirationEngine';

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
  constrainedNotes: NoteEvent[];
  status: string;
  constraintsEnabled: boolean;
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
    constrainedNotes: [],
    status: 'Prêt à tester Magenta.js',
    constraintsEnabled: true
  });

  const [model, setModel] = useState<MagentaModel | null>(null);
  
  // États pour les contraintes musicales
  const [constraints, setConstraints] = useState<AIConstraints>({
    root: 'C',
    scale: 'minor',
    style: 'psy',
    octaveRange: { min: 2, max: 4 },
    velocityProfile: 'default',
    quantization: 'strict'
  });
  
  const [selectedPreset, setSelectedPreset] = useState<string>('psyTrance');
  const [availableScales, setAvailableScales] = useState<{ value: string; label: string }[]>([]);

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
          
          // Appliquer les contraintes musicales si activées
          let finalNotes = convertedNotes;
          let constraintResult = null;
          
          if (state.constraintsEnabled && convertedNotes.length > 0) {
            setState(prev => ({ 
              ...prev, 
              status: 'Application des contraintes musicales...' 
            }));
            
            constraintResult = applyMusicalConstraints(convertedNotes, constraints);
            finalNotes = constraintResult.constrainedNotes;
            
            console.log('🎯 Contraintes appliquées:', constraintResult);
          }
          
          const statusMessage = state.constraintsEnabled 
            ? `Génération réussie ! ${generatedSequence.notes.length} IA → ${convertedNotes.length} converties → ${finalNotes.length} contraintes ✅`
            : `Génération réussie ! ${generatedSequence.notes.length} notes IA → ${convertedNotes.length} notes converties ✅`;
          
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            generatedNotes: generatedSequence.notes,
            convertedNotes,
            constrainedNotes: finalNotes,
            status: statusMessage
          }));
          
          // Envoyer les notes finales au piano roll
          if (finalNotes.length > 0) {
            onNotesGenerated(finalNotes);
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

  // Charger les gammes disponibles
  useEffect(() => {
    setAvailableScales(getAvailableScales());
  }, []);

  // Auto-test au montage
  useEffect(() => {
    // Test automatique de l'importation au montage
    testMagentaImport();
  }, []);

  return (
    <div className="p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl border border-purple-600/50">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">🤖 Test Magenta.js - Phase 3 : Contraintes Musicales</h2>
      
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

      {/* Contraintes musicales */}
      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-600/50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-indigo-300">🎯 Contraintes Musicales - Phase 3</h3>
          <label className="flex items-center space-x-2">
            <span className="text-sm text-indigo-300">Activer contraintes :</span>
            <input
              type="checkbox"
              checked={state.constraintsEnabled}
              onChange={(e) => setState(prev => ({ ...prev, constraintsEnabled: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </label>
        </div>

        {state.constraintsEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Preset rapide */}
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-2">Preset Style</label>
              <select
                value={selectedPreset}
                onChange={(e) => {
                  setSelectedPreset(e.target.value);
                  const preset = CONSTRAINT_PRESETS[e.target.value];
                  if (preset) {
                    setConstraints(prev => ({ ...prev, ...preset }));
                  }
                }}
                className="w-full px-3 py-2 bg-indigo-800 text-white rounded-lg border border-indigo-600 focus:border-indigo-400 focus:outline-none text-sm"
              >
                {Object.keys(CONSTRAINT_PRESETS).map(presetName => (
                  <option key={presetName} value={presetName}>
                    {presetName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Note fondamentale */}
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-2">Note fondamentale</label>
              <select
                value={constraints.root}
                onChange={(e) => setConstraints(prev => ({ ...prev, root: e.target.value }))}
                className="w-full px-3 py-2 bg-indigo-800 text-white rounded-lg border border-indigo-600 focus:border-indigo-400 focus:outline-none text-sm"
              >
                {NOTE_ORDER.map(note => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
            </div>

            {/* Gamme */}
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-2">Gamme</label>
              <select
                value={constraints.scale}
                onChange={(e) => setConstraints(prev => ({ ...prev, scale: e.target.value }))}
                className="w-full px-3 py-2 bg-indigo-800 text-white rounded-lg border border-indigo-600 focus:border-indigo-400 focus:outline-none text-sm"
              >
                {availableScales.map(scale => (
                  <option key={scale.value} value={scale.value}>{scale.label}</option>
                ))}
              </select>
            </div>

            {/* Range d'octaves */}
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-2">Octave Min-Max</label>
              <div className="flex space-x-2">
                <select
                  value={constraints.octaveRange.min}
                  onChange={(e) => setConstraints(prev => ({ 
                    ...prev, 
                    octaveRange: { ...prev.octaveRange, min: parseInt(e.target.value) }
                  }))}
                  className="w-full px-2 py-2 bg-indigo-800 text-white rounded-lg border border-indigo-600 focus:border-indigo-400 focus:outline-none text-sm"
                >
                  {[1,2,3,4,5].map(oct => (
                    <option key={oct} value={oct}>{oct}</option>
                  ))}
                </select>
                <select
                  value={constraints.octaveRange.max}
                  onChange={(e) => setConstraints(prev => ({ 
                    ...prev, 
                    octaveRange: { ...prev.octaveRange, max: parseInt(e.target.value) }
                  }))}
                  className="w-full px-2 py-2 bg-indigo-800 text-white rounded-lg border border-indigo-600 focus:border-indigo-400 focus:outline-none text-sm"
                >
                  {[3,4,5,6,7].map(oct => (
                    <option key={oct} value={oct}>{oct}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Profil vélocité */}
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-2">Profil Vélocité</label>
              <select
                value={constraints.velocityProfile}
                onChange={(e) => setConstraints(prev => ({ 
                  ...prev, 
                  velocityProfile: e.target.value as AIConstraints['velocityProfile']
                }))}
                className="w-full px-3 py-2 bg-indigo-800 text-white rounded-lg border border-indigo-600 focus:border-indigo-400 focus:outline-none text-sm"
              >
                <option value="default">Par défaut</option>
                <option value="dark">Sombre (-30)</option>
                <option value="uplifting">Énergique (+15)</option>
                <option value="dense">Dense (+20)</option>
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-2">Style Musical</label>
              <select
                value={constraints.style}
                onChange={(e) => setConstraints(prev => ({ ...prev, style: e.target.value }))}
                className="w-full px-3 py-2 bg-indigo-800 text-white rounded-lg border border-indigo-600 focus:border-indigo-400 focus:outline-none text-sm"
              >
                <option value="goa">Goa (Variations subtiles)</option>
                <option value="psy">Psy (Accents contretemps)</option>
                <option value="prog">Prog (Build-ups)</option>
                <option value="deep">Deep (Douceur)</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-indigo-400">
          {state.constraintsEnabled 
            ? `✅ Les notes IA seront contraintes à la gamme ${constraints.root} ${constraints.scale} (octaves ${constraints.octaveRange.min}-${constraints.octaveRange.max})`
            : '⚠️ Contraintes désactivées - Notes IA brutes utilisées'
          }
        </div>
      </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Notes IA brutes */}
          <div className="p-4 bg-green-900/30 border border-green-600/50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-300 mb-3">🤖 Notes IA brutes :</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {state.generatedNotes.slice(0, 6).map((note, index) => (
                <div key={index} className="text-xs text-green-200 font-mono">
                  P={note.pitch}, T={note.startTime.toFixed(1)}s
                  {note.velocity && `, V=${note.velocity.toFixed(2)}`}
                </div>
              ))}
              {state.generatedNotes.length > 6 && (
                <div className="text-xs text-green-400">... +{state.generatedNotes.length - 6}</div>
              )}
            </div>
          </div>

          {/* Notes converties */}
          <div className="p-4 bg-blue-900/30 border border-blue-600/50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">🎹 Notes converties :</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {state.convertedNotes.slice(0, 6).map((note, index) => (
                <div key={index} className="text-xs text-blue-200 font-mono">
                  S{note.step}: {note.note}, V={note.velocity}
                </div>
              ))}
              {state.convertedNotes.length > 6 && (
                <div className="text-xs text-blue-400">... +{state.convertedNotes.length - 6}</div>
              )}
            </div>
          </div>

          {/* Notes contraintes */}
          {state.constraintsEnabled && state.constrainedNotes.length > 0 && (
            <div className="p-4 bg-indigo-900/30 border border-indigo-600/50 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-300 mb-3">🎯 Notes contraintes :</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {state.constrainedNotes.slice(0, 6).map((note, index) => (
                  <div key={index} className="text-xs text-indigo-200 font-mono">
                    S{note.step}: {note.note}, V={note.velocity}
                  </div>
                ))}
                {state.constrainedNotes.length > 6 && (
                  <div className="text-xs text-indigo-400">... +{state.constrainedNotes.length - 6}</div>
                )}
              </div>
              <div className="mt-2 text-xs text-indigo-400">
                🎯 {constraints.root} {constraints.scale} (Oct {constraints.octaveRange.min}-{constraints.octaveRange.max})
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
        <h4 className="text-sm font-medium text-slate-300 mb-2">📋 Instructions Phase 3 :</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>1. Le test d'import s'exécute automatiquement ✅</li>
          <li>2. Cliquez "Init Modèle" pour initialiser MusicVAE</li>
          <li>3. Configurez les contraintes musicales (gamme, style, octaves)</li>
          <li>4. Cliquez "Générer et Ajouter" pour créer des notes IA contraintes</li>
          <li>5. Les notes respectent automatiquement vos paramètres musicaux !</li>
        </ul>
        <div className="mt-3 text-xs text-indigo-400 bg-indigo-900/20 p-2 rounded">
          🎯 <strong>Nouveauté Phase 3</strong> : L'IA respecte vos choix musicaux (gammes, styles, octaves) !
        </div>
      </div>
    </div>
  );
};

export default MagentaTest;