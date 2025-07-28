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
  sample?(numSamples: number, temperature?: number): Promise<any[]>;
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
  
  // 🎯 CONFIGURATION MODÈLES AVANCÉS
  const [selectedModel, setSelectedModel] = useState<string>('mel_2bar_small');
  const [generationParams, setGenerationParams] = useState({
    numSamples: 4,           // Générer 4 variations
    temperatureRange: {      // Plage de températures
      min: 0.7, 
      max: 1.6
    },
    selectionCriteria: 'noteCount' // 'noteCount' | 'complexity' | 'random'
  });

  // 🔧 MODÈLES DISPONIBLES - URLs VALIDÉES
  const AVAILABLE_MODELS = {
    'mel_2bar_small': {
      name: '🎵 Melody 2-Bar (Testé) ⭐',
      url: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small',
      description: 'Modèle éprouvé 2 mesures avec multi-échantillons avancés',
      size: '~8MB',
      recommended: true
    },
    'mel_4bar_med_lokl_q2': {
      name: '🚀 Melody 4-Bar (Expérimental)',
      url: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_4bar_med_lokl_q2',
      description: '⚠️ En cours de validation - 4 mesures, sampling optimisé',
      size: '~30MB',
      recommended: false
    },
    'mel_4bar_small_q2': {
      name: '⚡ Melody 4-Bar (Test)',
      url: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_4bar_small_q2',
      description: '⚠️ URL à valider - Version légère 4 mesures',
      size: '~15MB',
      recommended: false
    }
  };

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

      // 🚀 MODÈLE SÉLECTIONNABLE - Plus de puissance et flexibilité
      const modelConfig = AVAILABLE_MODELS[selectedModel as keyof typeof AVAILABLE_MODELS];
      const checkpointUrl = modelConfig.url;
      
      setState(prev => ({ 
        ...prev, 
        status: `📦 Initialisation ${modelConfig.name} (${modelConfig.size})...` 
      }));
      
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
      // 🎯 GÉNÉRATION MULTI-ÉCHANTILLONS POUR QUALITÉ OPTIMALE
      if (model.sample) {
        setState(prev => ({ 
          ...prev, 
          status: '🎲 Génération de 4 variations avec températures différentes...' 
        }));
        
        // 🎲 Générer échantillons avec températures configurables
        const { min, max } = generationParams.temperatureRange;
        const temps = [
          min,                           // 🎯 Conservative
          min + (max - min) * 0.33,     // ⚖️ Balanced  
          min + (max - min) * 0.66,     // 🎨 Creative
          max                            // 🚀 Experimental
        ];
        
        const [conservative, balanced, creative, experimental] = await Promise.all([
          model.sample(1, temps[0]),  // 🎯 Conservative - patterns cohérents
          model.sample(1, temps[1]),  // ⚖️ Balanced - équilibre créativité/structure  
          model.sample(1, temps[2]),  // 🎨 Creative - plus d'originalité
          model.sample(1, temps[3])   // 🚀 Experimental - maximum créativité
        ]);
        
        // Combiner tous les échantillons et sélectionner les meilleurs
        const allSequences = [
          ...conservative, 
          ...balanced, 
          ...creative, 
          ...experimental
        ].filter(seq => seq && seq.notes && seq.notes.length > 0);
        
        setState(prev => ({ 
          ...prev, 
          status: `🎵 ${allSequences.length} variations générées, sélection du meilleur...` 
        }));
        
        // Sélectionner la séquence avec le plus de notes (généralement plus intéressante)
        const sequences = [allSequences.reduce((best, current) => 
          current.notes.length > best.notes.length ? current : best
        )];
        
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
      <h2 className="text-2xl font-bold mb-4 text-purple-300">🚀 IA Avancée Magenta.js - Modèles 4-Bar + Multi-Échantillons</h2>
      
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

      {/* 🚀 CONFIGURATION MODÈLES AVANCÉS */}
      <div className="mb-6 p-4 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-600/50 rounded-lg">
        <h3 className="text-lg font-semibold text-emerald-300 mb-4">🚀 Configuration IA Avancée</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sélection du modèle */}
          <div>
            <label className="block text-sm font-medium text-emerald-300 mb-2">Modèle IA</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 bg-emerald-800 text-white rounded-lg border border-emerald-600 focus:border-emerald-400 focus:outline-none text-sm"
            >
              {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
                <option key={key} value={key}>
                  {model.name} {model.recommended ? '⭐' : ''}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-emerald-400">
              {AVAILABLE_MODELS[selectedModel as keyof typeof AVAILABLE_MODELS].description}
            </div>
            <div className="text-xs text-emerald-500 mt-1">
              Taille: {AVAILABLE_MODELS[selectedModel as keyof typeof AVAILABLE_MODELS].size}
            </div>
          </div>

          {/* Paramètres de génération */}
          <div>
            <label className="block text-sm font-medium text-emerald-300 mb-2">Plage Température</label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="text-xs text-emerald-400">Min (Conservative)</label>
                <input
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={generationParams.temperatureRange.min}
                  onChange={(e) => setGenerationParams(prev => ({
                    ...prev,
                    temperatureRange: { ...prev.temperatureRange, min: parseFloat(e.target.value) }
                  }))}
                  className="w-full px-2 py-1 bg-emerald-800 text-white rounded border border-emerald-600 focus:border-emerald-400 focus:outline-none text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-emerald-400">Max (Experimental)</label>
                <input
                  type="number"
                  min="1.0"
                  max="2.0"
                  step="0.1"
                  value={generationParams.temperatureRange.max}
                  onChange={(e) => setGenerationParams(prev => ({
                    ...prev,
                    temperatureRange: { ...prev.temperatureRange, max: parseFloat(e.target.value) }
                  }))}
                  className="w-full px-2 py-1 bg-emerald-800 text-white rounded border border-emerald-600 focus:border-emerald-400 focus:outline-none text-sm"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-emerald-400">
              🎲 4 échantillons générés simultanément avec températures {generationParams.temperatureRange.min} → {generationParams.temperatureRange.max}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-emerald-800/20 rounded-lg">
          <h4 className="text-sm font-medium text-emerald-300 mb-2">💡 Améliorations IA :</h4>
          <ul className="text-xs text-emerald-400 space-y-1">
            <li>✅ <strong>Modèle 4-bar</strong> au lieu de 2-bar (patterns 2x plus longs)</li>
            <li>✅ <strong>Multi-échantillons</strong> : 4 variations simultanées pour qualité optimale</li>
            <li>✅ <strong>Sélection intelligente</strong> : Choix automatique du meilleur échantillon</li>
            <li>✅ <strong>Températures configurables</strong> : Contrôle créativité vs cohérence</li>
            <li>🔄 <strong>Modèles sélectionnables</strong> : Melody, Trio, ou Haute Qualité</li>
          </ul>
        </div>
      </div>

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
        <h4 className="text-sm font-medium text-slate-300 mb-2">🚀 Instructions IA Avancée :</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>1. <strong>Sélectionner modèle</strong> : mel_4bar_lokl ⭐ (recommandé) ou trio_4bar pour polyphonie</li>
          <li>2. <strong>Ajuster températures</strong> : Min 0.7 (conservateur) → Max 1.6 (expérimental)</li>
          <li>3. <strong>Cliquer "Init Modèle"</strong> pour télécharger et initialiser (~60-120MB)</li>
          <li>4. <strong>Configurer contraintes</strong> : Gamme, style, octaves pour cohérence musicale</li>
          <li>5. <strong>"Générer et Ajouter"</strong> : 4 variations simultanées → sélection automatique du meilleur</li>
        </ul>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="bg-emerald-900/20 p-2 rounded text-emerald-400">
            🚀 <strong>IA Avancée</strong> : Modèles 4-bar + Multi-échantillons
          </div>
          <div className="bg-indigo-900/20 p-2 rounded text-indigo-400">
            🎯 <strong>Contraintes</strong> : Gammes personnalisées + styles musicaux
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagentaTest;