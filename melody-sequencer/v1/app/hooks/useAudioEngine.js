// Hook personnalisé pour la gestion complète du moteur audio et des synthétiseurs
import { useState, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { SYNTH_PRESETS } from '../lib/synthPresets';
import { PresetStorage } from '../lib/presetStorage';

/**
 * Hook pour gérer tout le système audio : synthétiseurs, presets, transport et effets
 * @param {Object} options - Options de configuration
 * @param {number} options.tempo - Tempo en BPM
 * @param {boolean} options.midiOutputEnabled - État de sortie MIDI
 * @param {string} options.noteLength - Longueur des notes
 * @returns {Object} État et fonctions pour la gestion audio complète
 */
export function useAudioEngine({ tempo, midiOutputEnabled, noteLength }) {
  // États pour les synthétiseurs et presets
  const [presetKey, setPresetKey] = useState(SYNTH_PRESETS[0].key);
  const [currentPreset, setCurrentPreset] = useState(SYNTH_PRESETS[0]);
  const [synthPopupOpen, setSynthPopupOpen] = useState(false);



  // Fonction pour initialiser le contexte audio Tone.js
  const initializeAudioContext = useCallback(async () => {
    try {
      await Tone.context.resume();
      await Tone.start();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du contexte audio:', error);
      return false;
    }
  }, []);

  // Fonction pour arrêter tous les sons et nettoyer
  const stopAllSounds = useCallback(() => {
    // Arrêter le transport Tone.js
    Tone.Transport.stop();
  }, []);

  // Fonction pour définir le tempo global
  const setTempoBPM = useCallback((bpm) => {
    Tone.Transport.bpm.value = bpm;
  }, []);

  // Fonction pour gérer la sélection d'un preset
  const handlePresetSelect = useCallback((preset) => {
    if (typeof preset === 'object' && preset !== null) {
      setPresetKey(preset.key);
      setCurrentPreset(preset);
    } else if (typeof preset === 'string') {
      setPresetKey(preset);
      const allPresets = PresetStorage.getAllPresets();
      const foundPreset = allPresets.find(p => p.key === preset);
      if (foundPreset) {
        setCurrentPreset(foundPreset);
      }
    }
    setSynthPopupOpen(false);
  }, []);

  // Fonctions pour gérer le popup de synthétiseur
  const handleSynthPopupOpen = useCallback(() => {
    setSynthPopupOpen(true);
  }, []);

  const handleSynthPopupClose = useCallback(() => {
    setSynthPopupOpen(false);
  }, []);

  // Fonction pour convertir une note MIDI en nom de note
  const midiToNoteName = useCallback((midiNumber) => {
    try {
      return Tone.Frequency(midiNumber, "midi").toNote();
    } catch (error) {
      console.error('Erreur conversion MIDI vers note:', error);
      return 'C4';
    }
  }, []);

  // Fonction pour obtenir des informations sur le synthé actuel
  const getCurrentSynthInfo = useCallback(() => {
    return {
      preset: currentPreset,
      key: presetKey,
      synthType: currentPreset?.synthType || 'PolySynth',
      voiceMode: currentPreset?.voiceMode || 'poly'
    };
  }, [currentPreset, presetKey]);

  return {
    // États des presets et popup
    presetKey,
    currentPreset,
    synthPopupOpen,
    
    // Fonctions de gestion des presets
    handlePresetSelect,
    handleSynthPopupOpen, 
    handleSynthPopupClose,
    
    // Fonctions utilitaires audio
    initializeAudioContext,
    stopAllSounds,
    setTempoBPM,
    midiToNoteName,
    getCurrentSynthInfo,
    
  };
}