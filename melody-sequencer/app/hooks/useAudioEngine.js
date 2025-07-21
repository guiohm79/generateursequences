// Hook personnalisé pour la gestion complète du moteur audio et des synthétiseurs
import { useState, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { SYNTH_PRESETS } from '../lib/synthPresets';
import { PresetStorage } from '../lib/presetStorage';
import { useTransport } from './useTransport';

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

  // Intégration du système de transport audio/MIDI
  const transport = useTransport({ currentPreset, midiOutputEnabled, noteLength, tempo });

  // Effet pour créer le synthé quand le preset change
  useEffect(() => {
    transport.createSynth(currentPreset || SYNTH_PRESETS[0]);
    return transport.disposeSynth;
  }, [presetKey, transport.createSynth, transport.disposeSynth]);

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
    // Arrêter le transport
    transport.stopTransport(() => {}, () => {});
    
    // Libérer toutes les notes du synthé
    if (transport.synthRef.current && transport.synthRef.current.releaseAll) {
      transport.synthRef.current.releaseAll();
    }
    
    // Réinitialiser les références
    transport.previousMonoNote.current = null;
    
    // Arrêter le transport Tone.js
    Tone.Transport.stop();
    if (transport.transportId.current) {
      Tone.Transport.clear(transport.transportId.current);
      transport.transportId.current = null;
    }
  }, [transport]);

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
      isReady: transport.synthRef.current !== null,
      synthType: currentPreset?.synthType || 'PolySynth',
      voiceMode: currentPreset?.voiceMode || 'poly'
    };
  }, [currentPreset, presetKey, transport.synthRef]);

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
    
    // Réexporter toutes les fonctions du transport
    synthRef: transport.synthRef,
    previousMonoNote: transport.previousMonoNote,
    transportId: transport.transportId,
    playStep: transport.playStep,
    startTransport: transport.startTransport,
    stopTransport: transport.stopTransport,
    createSynth: transport.createSynth,
    disposeSynth: transport.disposeSynth,
    updatePlayingPattern: transport.updatePlayingPattern
  };
}