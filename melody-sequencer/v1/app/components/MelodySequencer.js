"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import PianoRoll from "./PianoRoll";
import RandomPopup from "./RandomPopup";
import SynthPopup from "./SynthPopup";
import MIDIOutputSettings from "./MIDIOutputSettings";
import VariationPopup from "./VariationPopup";
import FavoritesPopup from "./FavoritesPopup";
import ScalesManagerPopup from "./ScalesManagerPopup";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";
import { SYNTH_PRESETS } from "../lib/synthPresets";
import { PresetStorage } from "../lib/presetStorage";
import { generateMusicalPattern, refreshScales, generateAmbiancePattern, applyHappyAccidents, morphPatterns } from "../lib/randomEngine";
import { getMIDIOutput } from "../lib/midiOutput";
import { ScalesStorage } from "../lib/scalesStorage";
import { getAllNotes, buildPattern } from "../lib/patternUtils";
import { convertPatternToMidiData, exportToMidi } from "../lib/midiUtils";
import { usePatternHistory } from "../hooks/usePatternHistory";
import { useAudioEngine } from "../hooks/useAudioEngine";
import { useTransport } from "../hooks/useTransport";
import { useMorphing } from "../hooks/useMorphing";
import { useEvolution } from "../hooks/useEvolution";
import { usePatternVariations } from "../hooks/usePatternVariations";
import { useFavorites } from "../hooks/useFavorites";
import { usePatternManipulation } from "../hooks/usePatternManipulation";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

// Architecture en hooks modulaires :
// - usePatternHistory : Historique undo/redo
// - useAudioEngine : Gestion synthétiseurs et presets
// - useTransport : Transport audio/MIDI et lecture  
// - useMorphing : Morphing temps réel
// - useEvolution : Évolution génétique
// - usePatternVariations : Variations et inspirations
// - useFavorites : Système de favoris
// - usePatternManipulation : Manipulation patterns

export default function MelodySequencer() {
  // États principaux
  const [tempo, setTempo] = useState(120); // BPM
  const [steps, setSteps] = useState(16); // Nombre de pas (16 ou 32)
  const [minOctave, setMinOctave] = useState(2);
  const [maxOctave, setMaxOctave] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [randomVisible, setRandomVisible] = useState(false);
  const [randomParams, setRandomParams] = useState(null);
  const [midiSettingsOpen, setMidiSettingsOpen] = useState(false);
  const [midiOutputEnabled, setMidiOutputEnabled] = useState(false);
  const [noteLength, setNoteLength] = useState("16n"); // Nouvelle state pour la longueur des notes (1/16, 1/32, 1/64)
  const [variationPopupOpen, setVariationPopupOpen] = useState(false);
  const [favoritesPopupOpen, setFavoritesPopupOpen] = useState(false);
  const [scalesManagerOpen, setScalesManagerOpen] = useState(false);
  const [scalesUpdateTrigger, setScalesUpdateTrigger] = useState(0);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  // Les états de morphing sont maintenant gérés par useMorphing
  // Les états d'évolution génétique sont maintenant gérés par useEvolution

  // Hook pour la gestion de l'historique des patterns
  const {
    patternHistory,
    historyIndex,
    saveToHistory,
    handleUndo: undoPattern,
    handleRedo: redoPattern,
    canUndo,
    canRedo
  } = usePatternHistory();

  // Référence pour le débogage de la popup MIDI
  const midiDebugRef = useRef(null);
  
  // Hook pour la gestion des synthétiseurs et presets
  const {
    presetKey,
    currentPreset, 
    synthPopupOpen,
    handlePresetSelect,
    handleSynthPopupOpen,
    handleSynthPopupClose,
    initializeAudioContext,
    stopAllSounds,
    setTempoBPM,
    midiToNoteName,
    getCurrentSynthInfo
  } = useAudioEngine({ tempo, midiOutputEnabled, noteLength });

  // Hook pour la gestion du transport et lecture
  const {
    synthRef,
    previousMonoNote,
    transportId,
    playStep,
    startTransport,
    stopTransport,
    createSynth,
    disposeSynth,
    updatePlayingPattern
  } = useTransport({ currentPreset, midiOutputEnabled, noteLength, tempo });

  // Effet pour créer le synthé quand le preset change
  useEffect(() => {
    createSynth(currentPreset || SYNTH_PRESETS[0]);
    return disposeSynth;
  }, [presetKey, createSynth, disposeSynth, currentPreset]);

  // Les hooks dépendant du pattern sont déclarés après la déclaration du pattern
  
  // Gestion de l'activation/désactivation MIDI
  const handleToggleMIDI = async () => {
    try {
      const newState = !midiOutputEnabled;

      
      if (newState) {
        // Initialisation du système MIDI si on l'active
        const midiOutput = getMIDIOutput();
        const success = await midiOutput.initialize();
        
        if (success) {

          setMidiOutputEnabled(true);
          setMidiSettingsOpen(true); // Ouvrir automatiquement les paramètres
        } else {
          console.error("Impossible d'initialiser MIDI");
          alert("Impossible d'initialiser MIDI. Votre navigateur supporte-t-il la Web MIDI API?");
        }
      } else {
        // Désactivation MIDI
        const midiOutput = getMIDIOutput();
        midiOutput.allNotesOff(); // All notes off avant de désactiver
        setMidiOutputEnabled(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'activation/désactivation MIDI:", error);
      alert("Erreur lors de l'activation MIDI. Consultez la console pour plus d'informations.");
    }
  };

  // Pattern management blindé
  const [pattern, setPattern] = useState(() => buildPattern(null, steps, minOctave, maxOctave));
  useEffect(() => {
    setPattern(prev => buildPattern(prev, steps, minOctave, maxOctave));
    setCurrentStep(0);
  }, [steps, minOctave, maxOctave]);

  // Hook pour le morphing temps réel
  const {
    morphingEnabled,
    targetPattern,
    morphAmount,
    morphedPattern,
    currentPlayingPattern,
    isMorphingActive,
    isMorphed,
    generateMorphTarget,
    updateMorphing,
    applyMorphTarget,
    cancelMorphing,
    getMorphPercentage
  } = useMorphing({
    pattern,
    randomParams,
    steps,
    minOctave,
    maxOctave,
    saveToHistory
  });

  // Hook pour l'évolution génétique
  const {
    evolutionHistory,
    currentGeneration,
    canEvolve,
    canRevert,
    currentGenerationInfo,
    evolveOnce,
    evolveGenerationsBoost,
    revertToGeneration,
    resetEvolution,
    getCurrentGenerationParams,
    getEvolutionStats
  } = useEvolution({
    pattern,
    setPattern,
    saveToHistory
  });

  // Hook pour les variations et inspirations
  const {
    variationsInProgress,
    variationResults,
    lastVariationOptions,
    canGenerateVariations,
    handleVariations,
    applyVariation,
    generateQuickVariations,
    generateQuickInspiration,
    clearVariations,
    getVariationStats
  } = usePatternVariations({
    pattern,
    setPattern,
    saveToHistory,
    steps,
    minOctave,
    maxOctave
  });

  // Hook pour la gestion des favoris
  const {
    favoritesLoading,
    favoritesList,
    lastLoadedFavorite,
    canSaveFavorite,
    handleLoadFavorite,
    saveFavorite,
    deleteFavorite,
    updateFavorite,
    searchFavorites,
    getFavoritesByTag,
    getAllTags,
    loadAllFavorites,
    exportFavorites,
    importFavorites,
    cleanupFavorites,
    reorderFavorites,
    getFavoritesStats,
    quickSaveFavorite
  } = useFavorites({
    pattern,
    setPattern,
    saveToHistory,
    setTempo,
    setSteps,
    setNoteLength,
    setMinOctave,
    setMaxOctave,
    setRandomParams,
    currentSequencerSettings: {
      tempo,
      steps,
      noteLength
    },
    currentPreset,
    steps,
    minOctave,
    maxOctave
  });

  // Hook pour les manipulations de patterns
  const {
    shiftOctaveUp,
    shiftOctaveDown,
    transposePattern,
    reversePattern,
    shiftPatternHorizontally,
    duplicateAndCompress,
    getActiveNotesCount,
    canManipulate
  } = usePatternManipulation({
    pattern,
    setPattern,
    saveToHistory
  });


  // Fonctions undo/redo avec le hook
  const handleUndo = () => {
    const previousPattern = undoPattern();
    if (previousPattern) {
      setPattern(previousPattern);
    }
  };

  const handleRedo = () => {
    const nextPattern = redoPattern();
    if (nextPattern) {
      setPattern(nextPattern);
    }
  };

  // La création/destruction du synthé est maintenant gérée par useAudioEngine

  // Mutations blindées
  const handleToggleStep = (note, idx) => {
    setPattern(prev => {
      const line = Array.isArray(prev[note]) ? prev[note].slice() : Array(steps).fill(0);
      // Toggle on/off (désactive si déjà on)
      line[idx] = !line[idx] || line[idx] === 0 ? { on: true, velocity: 100, accent: false, slide: false } : 0;
      const newPattern = { ...prev, [note]: line };
      // Sauvegarder dans l'historique
      saveToHistory(newPattern);
      return newPattern;
    });
  };
  
  // Gestion des accents (active/désactive l'accent sur une note)
  const handleToggleAccent = (note, idx) => {
    setPattern(prev => {
      const line = Array.isArray(prev[note]) ? prev[note].slice() : Array(steps).fill(0);
      // On ne peut modifier l'accent que si la note est active
      if (line[idx] && line[idx].on) {
        line[idx] = { ...line[idx], accent: !line[idx].accent };
      }
      return { ...prev, [note]: line };
    });
  };
  
  // Gestion des slides (active/désactive le slide sur une note)
  const handleToggleSlide = (note, idx) => {
    setPattern(prev => {
      const line = Array.isArray(prev[note]) ? prev[note].slice() : Array(steps).fill(0);
      // On ne peut modifier le slide que si la note est active
      if (line[idx] && line[idx].on) {
        line[idx] = { ...line[idx], slide: !line[idx].slide };
      }
      return { ...prev, [note]: line };
    });
  };

  function handleChangeSteps(newSteps) {
    setSteps(newSteps);
    // pattern update via useEffect
    setCurrentStep(0);
  }
  const handleChangeVelocity = (note, idx, velocity) => {
    setPattern(prev => {
      const line = Array.isArray(prev[note]) ? prev[note].slice() : Array(steps).fill(0);
      if (line[idx] && line[idx].on) {
        line[idx] = { ...line[idx], velocity };
      }
      return { ...prev, [note]: line };
    });
  };

  // Le pattern à jouer est maintenant géré par le hook useMorphing

 // Les fonctions playStep et transport sont maintenant gérées par le hook useTransport

  // Effet pour gérer le transport avec le hook
  useEffect(() => {
    console.log('🎵 Transport useEffect triggered - isPlaying:', isPlaying, 'noteLength:', noteLength, 'steps:', steps);
    if (isPlaying) {
      startTransport(steps, currentPlayingPattern, setCurrentStep, setIsPlaying);
    } else {
      stopTransport(setIsPlaying, setCurrentStep);
    }
  }, [isPlaying, startTransport, stopTransport, steps, currentPlayingPattern, noteLength]);

  // Effet pour mettre à jour le pattern pendant la lecture
  useEffect(() => {
    if (isPlaying) {
      updatePlayingPattern(currentPlayingPattern);
    }
  }, [currentPlayingPattern, isPlaying, updatePlayingPattern]);


  const handlePlay = async () => {
    try {
      // Initialiser le contexte audio via le hook
      const success = await initializeAudioContext();
      if (!success) {
        console.error("Impossible d'initialiser le contexte audio");
        return;
      }
      
      // Réinitialiser l'état
      setCurrentStep(0);
      
      // S'assurer que toutes les notes précédentes sont relâchées
      if (synthRef.current && synthRef.current.releaseAll) {
        synthRef.current.releaseAll();
      }
      
      // Activer la lecture
      setIsPlaying(true);
    } catch (err) {
      console.error("Erreur lors du démarrage de l'audio:", err);
    }
  };
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    
    // Utiliser la fonction du hook pour arrêter tous les sons
    stopAllSounds();
    
    // Libérer toutes les notes du synthé
    if (synthRef.current && synthRef.current.releaseAll) {
      synthRef.current.releaseAll();
    }
    
    // Réinitialiser les références
    previousMonoNote.current = null;
    
    // Arrêter toutes les notes MIDI en cours
    if (midiOutputEnabled) {
      const midiOutput = getMIDIOutput();
      if (midiOutput) {
        midiOutput.allNotesOff();
      }
    }
  };

  // La fonction convertPatternToMidiData est maintenant dans lib/midiUtils.js
  
  // Fonction pour gérer la validation du popup de variation
  const handleVariationValidate = async (midiData, options) => {
    // Fermer le popup d'abord
    setVariationPopupOpen(false);
    
    // Préparer les options pour le hook
    const hookOptions = {
      ...options,
      source: midiData === "current" ? "current" : "midi",
      midiFile: midiData !== "current" ? midiData : null,
      autoApply: true
    };
    
    // Appeler le hook pour gérer les variations
    const success = await handleVariations(hookOptions);
    
    if (!success) {
      alert("Aucune variation n'a été générée. Veuillez vérifier vos paramètres.");
    }
  };

  // La gestion des variations est maintenant entièrement gérée par le hook usePatternVariations

  // ========== GESTION DES FAVORIS ==========

  // La gestion du chargement des favoris est maintenant gérée par le hook useFavorites

  // Les paramètres actuels du séquenceur sont maintenant gérés par le hook useFavorites

  // Les paramètres de génération actuels sont maintenant gérés par le hook useEvolution

  // ========== GESTION DES GAMMES ==========

  // Fonction appelée quand les gammes sont mises à jour
  const handleScalesUpdated = () => {
    try {
      // Forcer le rechargement des gammes dans randomEngine
      refreshScales();
      console.log("Gammes rechargées dans le moteur de génération");
      
      // Déclencher un rechargement des composants qui utilisent les gammes
      setScalesUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erreur lors du rechargement des gammes:", error);
    }
  };

  // Fonction d'export MIDI maintenant dans lib/midiUtils.js
  const handleExportMidi = () => {
    exportToMidi(pattern, tempo, noteLength, steps);
  };

  function handleRandomValidate(params) {
    // Si le nombre de pas a changé, mettre à jour le nombre de pas du séquenceur
    if (params.steps && params.steps !== steps) {
      setSteps(params.steps);
    }
    
    // Utiliser le nombre de pas sélectionné dans le popup ou le nombre de pas actuel
    const stepsToUse = params.steps || steps;
    
    let newPattern;
    let ambianceInfo = null;
    
    // Vérifier si c'est le mode ambiance
    if (params.ambianceMode && params.ambiance) {
      try {
        const result = generateAmbiancePattern(params.ambiance, {
          steps: stepsToUse,
          seed: params.seed,
          minOct: minOctave,
          maxOct: maxOctave
        });
        
        newPattern = buildPattern(result.pattern, stepsToUse, minOctave, maxOctave);
        ambianceInfo = result.ambiance;
        
        // Appliquer automatiquement le tempo suggéré
        if (result.ambiance.suggestedTempo) {
          setTempo(result.ambiance.suggestedTempo);
        }
        
        console.log(`Ambiance "${ambianceInfo.name}" générée:`, ambianceInfo.description);
        if (ambianceInfo.suggestedTempo) {
          console.log(`Tempo suggéré: ${ambianceInfo.suggestedTempo} BPM`);
        }
        
      } catch (error) {
        console.error('Erreur lors de la génération d\'ambiance:', error);
        // Fallback vers la génération normale
        newPattern = buildPattern(generateMusicalPattern({
          ...params,
          steps: stepsToUse,
          octaves: { min: minOctave, max: maxOctave }
        }), stepsToUse, minOctave, maxOctave);
      }
    } else {
      // Mode manuel traditionnel
      newPattern = buildPattern(generateMusicalPattern({
        ...params,
        steps: stepsToUse,
        octaves: { min: minOctave, max: maxOctave }
      }), stepsToUse, minOctave, maxOctave);
    }
    
    // Appliquer les accidents heureux si activés
    if (params.happyAccidents) {
      console.log('Application des accidents heureux avec intensité:', params.accidentIntensity);
      newPattern = applyHappyAccidents(newPattern, {
        intensity: params.accidentIntensity || 0.5,
        seed: params.seed || Date.now()
      });
    }
    
    // Sauvegarder dans l'historique avant de définir le nouveau pattern
    saveToHistory(newPattern);
    setPattern(newPattern);
    
    // Enregistrer les paramètres pour réutilisation
    setRandomParams(params);
    setRandomVisible(false);
  }

  // Fonction pour regénérer un pattern aléatoire avec les derniers paramètres utilisés
  function regenerateRandomPattern() {
    if (!randomParams) return;
    
    // Utiliser le nombre de pas des derniers paramètres ou le nombre de pas actuel
    const stepsToUse = randomParams.steps || steps;
    
    // Générer un nouveau seed aléatoire si on avait un seed, sinon on garde undefined
    const newSeed = randomParams.seed !== undefined ? Math.floor(Math.random() * 100000) : undefined;
    
    let newPattern;
    
    // Vérifier si c'est le mode ambiance
    if (randomParams.ambianceMode && randomParams.ambiance) {
      try {
        const result = generateAmbiancePattern(randomParams.ambiance, {
          steps: stepsToUse,
          seed: newSeed,
          minOct: minOctave,
          maxOct: maxOctave
        });
        
        newPattern = buildPattern(result.pattern, stepsToUse, minOctave, maxOctave);
        
        // Appliquer automatiquement le tempo suggéré
        if (result.ambiance.suggestedTempo) {
          setTempo(result.ambiance.suggestedTempo);
        }
        
      } catch (error) {
        console.error('Erreur lors de la régénération d\'ambiance:', error);
        // Fallback vers la génération normale
        newPattern = buildPattern(generateMusicalPattern({
          ...randomParams,
          steps: stepsToUse,
          octaves: { min: minOctave, max: maxOctave },
          seed: newSeed
        }), stepsToUse, minOctave, maxOctave);
      }
    } else {
      // Mode manuel traditionnel
      newPattern = buildPattern(generateMusicalPattern({
        ...randomParams,
        steps: stepsToUse,
        octaves: { min: minOctave, max: maxOctave },
        seed: newSeed
      }), stepsToUse, minOctave, maxOctave);
    }
    
    // Appliquer les accidents heureux si activés
    if (randomParams.happyAccidents) {
      console.log('Régénération avec accidents heureux, intensité:', randomParams.accidentIntensity);
      newPattern = applyHappyAccidents(newPattern, {
        intensity: randomParams.accidentIntensity || 0.5,
        seed: newSeed || Date.now()
      });
    }
    
    // Sauvegarder dans l'historique avant de définir le nouveau pattern
    saveToHistory(newPattern);
    setPattern(newPattern);
    
    // Mettre à jour randomParams avec le nouveau seed pour les futurs appels
    if (newSeed !== undefined) {
      setRandomParams(prev => ({ ...prev, seed: newSeed }));
    }
  }

  // Fonctions pour le morphing temps réel
  // Les fonctions de morphing sont maintenant gérées par le hook useMorphing

  // Les fonctions d'évolution sont maintenant gérées directement par le hook useEvolution

  // Hook pour les raccourcis clavier globaux (déplacé après les déclarations de fonctions)
  
  const handleClear = () => {
    const newPattern = buildPattern(null, steps, minOctave, maxOctave);
    // Sauvegarder dans l'historique avant de vider
    saveToHistory(newPattern);
    setPattern(newPattern);
    setCurrentStep(0);
    // Arrête toute note, tout synthé, TOUT DE SUITE :
    if (synthRef.current) {
      synthRef.current.releaseAll && synthRef.current.releaseAll();
      synthRef.current.triggerRelease && synthRef.current.triggerRelease();
    }
    previousMonoNote.current = null;
    
    // Arrêter toutes les notes MIDI en cours
    if (midiOutputEnabled) {
      const midiOutput = getMIDIOutput();
      if (midiOutput) {
        midiOutput.allNotesOff();
      }
    }
  };
  
  // Gérer les paramètres MIDI
  const handleToggleMidi = () => {
    if (!midiOutputEnabled) {
      // Initialiser la sortie MIDI si ce n'est pas déjà fait
      const initMidi = async () => {
        const midiOutput = getMIDIOutput();
        try {
          const success = await midiOutput.initialize();
          setMidiOutputEnabled(success);
          if (success) {
            const ports = midiOutput.getOutputPorts();
            if (ports.length > 0) {
              setMidiSettingsOpen(true);
            }
          }
        } catch (error) {
          console.error("Erreur d'initialisation MIDI:", error);
        }
      };
      initMidi();
    } else {
      // Désactiver la sortie MIDI
      if (isPlaying) {
        const midiOutput = getMIDIOutput();
        midiOutput.allNotesOff();
      }
      setMidiOutputEnabled(false);
    }
  };

  // Hook pour les raccourcis clavier globaux (après toutes les déclarations)
  const { getShortcutsList } = useKeyboardShortcuts({
    // Actions de transport
    handlePlay,
    handleStop,
    handleClear,
    isPlaying,
    
    // Actions de pattern
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    regenerateRandomPattern,
    randomParams,
    
    // Actions de manipulation
    shiftOctaveUp,
    shiftOctaveDown,
    generateMorphTarget,
    morphingEnabled,
    
    // Actions d'interface
    setRandomVisible,
    setSynthPopupOpen: handleSynthPopupOpen,
    setVariationPopupOpen,
    setFavoritesPopupOpen,
    setScalesManagerOpen,
    setMidiSettingsOpen,
    setShortcutsHelpOpen,
    
    // Paramètres
    setTempo,
    tempo
  });

  return (
    
    <div className="sequencer">
      <div className="app-title"
      style={{
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: 1,
        margin: "14px 0 12px 0",
        color: "#00eaff",
        textShadow: "0 2px 18px #00eaff66"
          }}>
          MELODY SEQUENCER PRO
        </div>

      {/* Interface organisée par groupes fonctionnels */}
      <div className="controls-section">
        
        {/* 🎮 GROUPE CONTRÔLES DE LECTURE */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#00eaff', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            CONTRÔLES DE LECTURE
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" id="playBtn" onClick={handlePlay} disabled={isPlaying}
              style={{ backgroundColor: isPlaying ? '#4CAF50' : '', color: isPlaying ? '#000' : '' }}>
              ▶️ Play
            </button>
            <button className="btn" id="stopBtn" onClick={handleStop} disabled={!isPlaying}
              style={{ backgroundColor: '#ff4444', color: '#fff' }}>
              ⏹️ Stop
            </button>
            <button className="btn" id="clearBtn" onClick={handleClear}
              style={{ backgroundColor: '#ff6b35', color: '#fff' }}>
              🗑️ Clear
            </button>
            <button 
              className="btn" 
              id="undoBtn" 
              onClick={handleUndo} 
              disabled={historyIndex <= 0}
              title="Annuler la dernière action"
              style={{ 
                backgroundColor: historyIndex > 0 ? '#4CAF50' : '#666', 
                color: historyIndex > 0 ? '#000' : '#999' 
              }}
            >
              ↶ Retour
            </button>
            
            {/* Sélecteur de vitesse intégré */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ color: "#ccc", fontSize: "12px" }}>Vitesse:</span>
              <select 
                value={noteLength}
                onChange={(e) => {
                  const newNoteLength = e.target.value;
                  console.log('🎶 Changing noteLength from', noteLength, 'to', newNoteLength);
                  setNoteLength(newNoteLength);
                }}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
                title="Vitesse de lecture"
              >
                <option value="4n">1/4</option>
                <option value="8n">1/8</option>
                <option value="16n">1/16</option>
                <option value="32n">1/32</option>
                <option value="64n">1/64</option>
              </select>
            </div>
          </div>
        </div>

        {/* 🎲 GROUPE GÉNÉRATION CRÉATIVE */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#ff9500', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            GÉNÉRATION CRÉATIVE
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" id="randomBtn" onClick={() => setRandomVisible(true)}
              style={{ backgroundColor: '#2196F3', color: '#fff', fontWeight: 'bold' }}>
              🎲 Random
            </button>
            <button 
              className="btn" 
              id="randomAgainBtn" 
              onClick={regenerateRandomPattern} 
              disabled={!randomParams}
              title="Régénérer avec les mêmes paramètres"
              style={{ 
                backgroundColor: randomParams ? '#ff9500' : '#666', 
                color: randomParams ? '#000' : '#999',
                fontWeight: 'bold'
              }}
            >
              Again
            </button>
            <button
              className="btn"
              id="variationBtn"
              onClick={() => setVariationPopupOpen(true)}
              style={{
                backgroundColor: '#ff00ea',
                color: '#000',
                fontWeight: 'bold'
              }}
              title="Modifier la séquence existante"
            >
              🎨 Variations
            </button>
            
            {/* Boutons d'évolution génétique */}
            <button
              className="btn"
              onClick={evolveOnce}
              disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
              title="Évolution douce - Changements subtils et progressifs"
              style={{
                backgroundColor: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#4CAF50' : '#666',
                color: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#fff' : '#999',
                fontWeight: 'bold'
              }}
            >
              🧬 Evolve
            </button>
            
            <button
              className="btn"
              onClick={evolveGenerationsBoost}
              disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
              title="Évolution agressive - 5 générations avec mutations drastiques"
              style={{
                backgroundColor: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#8BC34A' : '#666',
                color: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#000' : '#999',
                fontWeight: 'bold'
              }}
            >
              🚀 Boost
            </button>
          </div>
          
          {/* Affichage de l'évolution si historique disponible */}
          {evolutionHistory.length > 0 && (
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              background: 'rgba(76, 175, 80, 0.1)', 
              borderRadius: '6px',
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#4CAF50', 
                marginBottom: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                🧬 ÉVOLUTION - Génération {currentGeneration}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#A0A0A8' }}>Fitness:</span>
                <div style={{ 
                  flex: 1, 
                  height: '4px', 
                  background: 'rgba(76, 175, 80, 0.3)', 
                  borderRadius: '2px',
                  position: 'relative'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(100, (evolutionHistory[evolutionHistory.length - 1]?.fitness || 0))}%`,
                    background: '#4CAF50',
                    borderRadius: '2px'
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: '#4CAF50', minWidth: '30px' }}>
                  {evolutionHistory[evolutionHistory.length - 1]?.fitness || 0}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {evolutionHistory.length > 1 && (
                  <button
                    className="btn"
                    onClick={() => revertToGeneration(currentGeneration - 1)}
                    title="Revenir à la génération précédente"
                    style={{
                      backgroundColor: '#FF9800',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      padding: '4px 8px'
                    }}
                  >
                    ← Gen
                  </button>
                )}
                
                {currentGeneration > 0 && (
                  <button
                    className="btn"
                    onClick={() => revertToGeneration(0)}
                    title="Revenir au pattern original"
                    style={{
                      backgroundColor: '#9E9E9E',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      padding: '4px 8px'
                    }}
                  >
                    Origin
                  </button>
                )}
                
                <button
                  className="btn"
                  onClick={resetEvolution}
                  title="Réinitialiser l'historique d'évolution"
                  style={{
                    backgroundColor: '#f44336',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    padding: '4px 8px'
                  }}
                >
                  Reset
                </button>
              </div>
              
              {evolutionHistory[evolutionHistory.length - 1]?.mutations?.length > 0 && (
                <div style={{ 
                  fontSize: '10px', 
                  color: '#A0A0A8', 
                  textAlign: 'center', 
                  marginTop: '6px' 
                }}>
                  Mutations: {evolutionHistory[evolutionHistory.length - 1].mutations.length}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ⭐ GROUPE GESTION & STOCKAGE */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#FFD700', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            GESTION & STOCKAGE
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn"
              id="favoritesBtn"
              onClick={() => setFavoritesPopupOpen(true)}
              title="Gérer les patterns favoris"
              style={{
                backgroundColor: '#FFD700',
                color: '#000',
                fontWeight: 'bold'
              }}
            >
             Favoris
            </button>
            <button
              className="btn"
              id="scalesBtn"
              onClick={() => setScalesManagerOpen(true)}
              title="Gérer les gammes musicales"
              style={{
                backgroundColor: '#9C27B0',
                color: '#fff',
                fontWeight: 'bold'
              }}
            >
              Gammes
            </button>
            <button
              className="btn"
              id="exportMidiBtn"
              onClick={handleExportMidi}
              disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
              title="Exporter en fichier MIDI"
              style={{
                backgroundColor: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#4CAF50' : '#666',
                color: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#000' : '#999',
                fontWeight: 'bold'
              }}
            >
              📤 Export MIDI
            </button>
          </div>
        </div>

        {/* 🔧 GROUPE AUDIO & MIDI */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#00ff88', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            AUDIO & MIDI
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={handleSynthPopupOpen}
              disabled={isPlaying}
              title="Paramètres du synthétiseur"
              style={{ 
                backgroundColor: '#8e24aa', 
                color: '#fff',
                fontWeight: 'bold'
              }}
            >
              🎛️ Son
            </button>
            <button
              className={`btn ${midiOutputEnabled ? 'btn-active' : ''}`}
              id="midiBtn"
              onClick={handleToggleMidi}
              title="Activer/désactiver la sortie MIDI"
              style={{ 
                backgroundColor: midiOutputEnabled ? '#00ff88' : '#666', 
                color: midiOutputEnabled ? '#000' : '#999',
                fontWeight: 'bold'
              }}
            >
              {midiOutputEnabled ? '🔗 MIDI ON' : '🔌 MIDI OFF'}
            </button>
            <button
              className="btn"
              onClick={() => setMidiSettingsOpen(true)}
              disabled={!midiOutputEnabled}
              title="Configuration MIDI"
              style={{ 
                backgroundColor: midiOutputEnabled ? '#00bcd4' : '#666', 
                color: midiOutputEnabled ? '#000' : '#999'
              }}
            >
             Config
            </button>
          </div>
        </div>

        {/* 🎵 GROUPE MANIPULATION */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#ff5722', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            MANIPULATION
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn" 
              onClick={shiftOctaveDown}
              title="Décaler toutes les notes d'une octave vers le bas"
              disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
              style={{ 
                backgroundColor: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#f44336' : '#666',
                color: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#fff' : '#999',
                fontWeight: 'bold',
                minWidth: "60px"
              }}
            >
              ⬇️ Oct
            </button>
            <button 
              className="btn" 
              onClick={shiftOctaveUp}
              title="Décaler toutes les notes d'une octave vers le haut"
              disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
              style={{ 
                backgroundColor: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#f44336' : '#666',
                color: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#fff' : '#999',
                fontWeight: 'bold',
                minWidth: "60px"
              }}
            >
              ⬆️ Oct
            </button>
            
            {/* Contrôles de Morphing */}
            {!morphingEnabled ? (
              <button 
                className="btn" 
                onClick={generateMorphTarget}
                title="Générer une cible de morphing"
                disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
                style={{ 
                  backgroundColor: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#9C27B0' : '#666',
                  color: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#fff' : '#999',
                  fontWeight: 'bold',
                  minWidth: "70px"
                }}
              >
                🌊 Morph
              </button>
            ) : (
              <>
                <button 
                  className="btn" 
                  onClick={applyMorphTarget}
                  title="Appliquer définitivement le pattern cible"
                  style={{ 
                    backgroundColor: '#4CAF50', 
                    color: '#fff',
                    fontWeight: 'bold',
                    minWidth: "60px"
                  }}
                >
                  ✓ Apply
                </button>
                <button 
                  className="btn" 
                  onClick={cancelMorphing}
                  title="Annuler le morphing"
                  style={{ 
                    backgroundColor: '#f44336', 
                    color: '#fff',
                    fontWeight: 'bold',
                    minWidth: "60px"
                  }}
                >
                  ✗ Cancel
                </button>
              </>
            )}
          </div>
          
          {/* Contrôle du morphing en temps réel */}
          {morphingEnabled && (
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              background: 'rgba(156, 39, 176, 0.1)', 
              borderRadius: '6px',
              border: '1px solid rgba(156, 39, 176, 0.3)'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#9C27B0', 
                marginBottom: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                🌊 MORPHING TEMPS RÉEL
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: '#A0A0A8', minWidth: '20px' }}>0%</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={morphAmount}
                  onChange={e => updateMorphing(parseFloat(e.target.value))}
                  style={{ 
                    flex: 1,
                    height: '6px',
                    background: 'linear-gradient(to right, #9C27B0, #E91E63)',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#A0A0A8', minWidth: '30px' }}>100%</span>
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#A0A0A8', 
                textAlign: 'center', 
                marginTop: '4px' 
              }}>
                {Math.round(morphAmount * 100)}% vers la cible
              </div>
            </div>
          )}
        </div>

        {/* ⚙️ GROUPE PARAMÈTRES */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#00D4FF', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            PARAMÈTRES
          </div>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Contrôle du tempo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#ccc', fontSize: '12px', fontWeight: 'bold' }}>TEMPO</span>
              <input 
                type="number" 
                className="input-field"
                style={{ width: "60px", textAlign: "center", backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}
                min="60"
                max="240"
                value={tempo}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 60 && value <= 240) {
                    setTempo(value);
                    if (isPlaying) {
                      Tone.Transport.bpm.value = value;
                    }
                  }
                }}
              />
              <span style={{ fontSize: "0.8rem", color: "#8af" }}>BPM</span>
            </div>
            
            {/* Contrôle des octaves */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#ccc', fontSize: '12px', fontWeight: 'bold' }}>OCTAVES</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <button 
                    className="btn" 
                    onClick={() => {
                      if (minOctave > 0) {
                        setMinOctave(minOctave - 1);
                      }
                    }}
                    style={{ 
                      width: "25px", height: "25px", padding: "0", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", backgroundColor: '#555'
                    }}
                    disabled={minOctave <= 0}
                  >
                    -
                  </button>
                  <div style={{ 
                    width: "25px", height: "25px", backgroundColor: "#00D4FF", 
                    color: "#000", borderRadius: "4px", display: "flex", 
                    alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: "bold"
                  }}>
                    {minOctave}
                  </div>
                  <button 
                    className="btn" 
                    onClick={() => {
                      if (minOctave < maxOctave - 1) {
                        setMinOctave(minOctave + 1);
                      }
                    }}
                    style={{ 
                      width: "25px", height: "25px", padding: "0", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", backgroundColor: '#555'
                    }}
                    disabled={minOctave >= maxOctave - 1}
                  >
                    +
                  </button>
                </div>
                
                <span style={{ color: '#ccc', fontSize: '12px' }}>→</span>
                
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <button 
                    className="btn" 
                    onClick={() => {
                      if (maxOctave > minOctave + 1) {
                        setMaxOctave(maxOctave - 1);
                      }
                    }}
                    style={{ 
                      width: "25px", height: "25px", padding: "0", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", backgroundColor: '#555'
                    }}
                    disabled={maxOctave <= minOctave + 1}
                  >
                    -
                  </button>
                  <div style={{ 
                    width: "25px", height: "25px", backgroundColor: "#00D4FF", 
                    color: "#000", borderRadius: "4px", display: "flex", 
                    alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: "bold"
                  }}>
                    {maxOctave}
                  </div>
                  <button 
                    className="btn" 
                    onClick={() => {
                      if (maxOctave < 8) {
                        setMaxOctave(maxOctave + 1);
                      }
                    }}
                    style={{ 
                      width: "25px", height: "25px", padding: "0", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", backgroundColor: '#555'
                    }}
                    disabled={maxOctave >= 8}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Piano Roll avec grille de notes améliorée */}
      <PianoRoll
        minOctave={minOctave}
        maxOctave={maxOctave}
        steps={steps}
        pattern={morphedPattern || pattern}
        currentStep={isPlaying ? currentStep : null}
        onToggleStep={handleToggleStep}
        onChangeVelocity={handleChangeVelocity}
        onChangeSteps={handleChangeSteps}
        onToggleAccent={handleToggleAccent}
        onToggleSlide={handleToggleSlide}
        showVelocityValues={false} /* Désactiver l'affichage des valeurs numériques (00) */
        isMorphed={!!morphedPattern}
      />
      <RandomPopup
        visible={randomVisible}
        onValidate={handleRandomValidate}
        onCancel={() => setRandomVisible(false)}
        defaultParams={{
          ...randomParams,
          octaves: { min: minOctave, max: maxOctave }
        }}
        scalesUpdateTrigger={scalesUpdateTrigger}
      />
      <SynthPopup
        visible={synthPopupOpen}
        current={presetKey}
        onSelect={handlePresetSelect}
        onCancel={handleSynthPopupClose}
      />
      {midiSettingsOpen && (
        <div className="popup-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <MIDIOutputSettings
            onClose={() => setMidiSettingsOpen(false)}
          />
        </div>
      )}
      <VariationPopup
        visible={variationPopupOpen}
        onValidate={handleVariationValidate}
        onCancel={() => setVariationPopupOpen(false)}
        currentPattern={pattern} // Passer le vrai pattern actuel au lieu de "current"
        octaves={{ min: minOctave, max: maxOctave }}
      />
      <FavoritesPopup
        visible={favoritesPopupOpen}
        onLoadFavorite={handleLoadFavorite}
        onCancel={() => setFavoritesPopupOpen(false)}
        currentPattern={pattern}
        currentGenerationParams={getCurrentGenerationParams()}
        sequencerSettings={{
          tempo,
          steps,
          voiceMode: currentPreset?.voiceMode || 'poly',
          noteLength,
          octaves: { min: minOctave, max: maxOctave }
        }}
      />
      <ScalesManagerPopup
        visible={scalesManagerOpen}
        onCancel={() => setScalesManagerOpen(false)}
        onScalesUpdated={handleScalesUpdated}
      />
      
      {/* Aide des raccourcis clavier */}
      <KeyboardShortcutsHelp />
    </div>
  );
}
