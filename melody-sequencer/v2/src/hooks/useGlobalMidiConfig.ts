/**
 * useGlobalMidiConfig - Configuration MIDI globale partagée
 * Ce hook permet d'accéder aux paramètres MIDI depuis n'importe quel mode
 */

import React from 'react';
import { useMidiInput } from './useMidiInput';
import { useMidiOutput } from './useMidiOutput';
import { useSimpleAudio } from './useSimpleAudio';

export interface GlobalMidiState {
  // MIDI Input
  midiInput: {
    isInitialized: boolean;
    selectedDevice: any;
    availableDevices: any[];
    config: any;
    activeNotesCount: number;
    isRecording: boolean;
    recordedNotesCount: number;
    // Actions
    initialize: () => Promise<boolean>;
    selectDevice: (deviceId: string) => boolean;
    setPlaythroughEnabled: (enabled: boolean) => void;
    setRecordEnabled: (enabled: boolean) => void;
    startRecording: () => void;
    stopRecording: () => any[];
    convertToNoteEvents: (stepCount: number, bpm?: number) => any[];
    setCallbacks: (callbacks: any) => void;
    panic: () => void;
  };
  
  // MIDI Output
  midiOutput: {
    isInitialized: boolean;
    selectedDevice: any;
    availableDevices: any[];
    isConnected: boolean;
    // Actions
    initialize: () => Promise<boolean>;
    selectDevice: (deviceId: string) => boolean;
    sendNote: (note: number, velocity: number, duration?: number) => void;
    stopNote: (note: number) => void;
    panic: () => void;
  };

  // Audio
  audio: {
    isInitialized: boolean;
    isEnabled: boolean;
    volume: number;
    // Actions
    initialize: () => Promise<boolean>;
    setEnabled: (enabled: boolean) => void;
    setVolume: (volume: number) => void;
    playNote: (note: string | number, velocity?: number) => void;
    stopNote: (note: string | number) => void;
    stopAllNotes: () => void;
  };
}

/**
 * Hook global pour accéder à la configuration MIDI depuis n'importe quel mode
 */
export function useGlobalMidiConfig(): GlobalMidiState {
  // MIDI Input hooks
  const {
    isInitialized: midiInputInitialized,
    selectedDevice: selectedInputDevice,
    availableDevices: inputDevices,
    config: midiInputConfig,
    activeNotesCount,
    recordedNotesCount,
    isRecording,
    initialize: initializeMidiInput,
    selectDevice: selectInputDevice,
    updateConfig: updateMidiInputConfig,
    startRecording,
    stopRecording,
    convertToNoteEvents,
    setCallbacks: setMidiInputCallbacks,
    panic: midiInputPanic,
    setPlaythroughEnabled,
    setRecordEnabled,
  } = useMidiInput();

  // MIDI Output hooks
  const {
    isInitialized: midiOutputInitialized,
    selectedDevice: selectedOutputDevice,
    availableDevices: outputDevices,
    isConnected: midiOutputConnected,
    initialize: initializeMidiOutput,
    selectDevice: selectOutputDevice,
    sendNote,
    stopNote: stopMidiNote,
    panic: midiOutputPanic,
  } = useMidiOutput();

  // Audio hooks
  const {
    isInitialized: audioInitialized,
    isAudioEnabled,
    volume,
    initialize: initializeAudio,
    setAudioEnabled,
    setVolume,
    playNote: playAudioNote,
    stopNote: stopAudioNote,
    stopAllNotes,
  } = useSimpleAudio();

  return {
    midiInput: {
      isInitialized: midiInputInitialized,
      selectedDevice: selectedInputDevice,
      availableDevices: inputDevices,
      config: midiInputConfig,
      activeNotesCount,
      isRecording,
      recordedNotesCount,
      // Actions
      initialize: initializeMidiInput,
      selectDevice: selectInputDevice,
      setPlaythroughEnabled,
      setRecordEnabled,
      startRecording,
      stopRecording,
      convertToNoteEvents,
      setCallbacks: setMidiInputCallbacks,
      panic: midiInputPanic,
    },
    
    midiOutput: {
      isInitialized: midiOutputInitialized,
      selectedDevice: selectedOutputDevice,
      availableDevices: outputDevices,
      isConnected: midiOutputConnected,
      // Actions
      initialize: initializeMidiOutput,
      selectDevice: selectOutputDevice,
      sendNote,
      stopNote: stopMidiNote,
      panic: midiOutputPanic,
    },

    audio: {
      isInitialized: audioInitialized,
      isEnabled: isAudioEnabled,
      volume,
      // Actions
      initialize: initializeAudio,
      setEnabled: setAudioEnabled,
      setVolume,
      playNote: playAudioNote,
      stopNote: stopAudioNote,
      stopAllNotes,
    },
  };
}

/**
 * Hook simplifié pour les modes qui ont juste besoin du MIDI Input
 */
export function useMidiInputForMode() {
  const { midiInput, audio } = useGlobalMidiConfig();
  
  // Auto-initialisation
  React.useEffect(() => {
    if (!midiInput.isInitialized) {
      midiInput.initialize();
    }
    if (!audio.isInitialized) {
      audio.initialize();
    }
  }, []);

  // Configuration automatique des callbacks pour playthrough
  React.useEffect(() => {
    if (midiInput.selectedDevice && midiInput.config.playthroughEnabled) {
      const callbacks = {
        onNoteRecorded: (note: any) => {
          // Note enregistrée - peut être géré par le mode si nécessaire
        },
        onPlaythrough: (note: string, velocity: number, isNoteOn: boolean) => {
          if (audio.isEnabled && midiInput.config.playthroughEnabled) {
            if (isNoteOn) {
              audio.playNote(note, velocity / 127);
            } else {
              audio.stopNote(note);
            }
          }
        }
      };
      
      midiInput.setCallbacks(callbacks);
    }
  }, [midiInput.selectedDevice, midiInput.config.playthroughEnabled, audio.isEnabled]);

  return {
    // Status
    isConnected: !!(midiInput.selectedDevice && midiInput.config.playthroughEnabled),
    deviceName: midiInput.selectedDevice?.name || 'Aucun',
    isRecording: midiInput.isRecording,
    activeNotesCount: midiInput.activeNotesCount,
    
    // Actions pour le mode
    startRecording: midiInput.startRecording,
    stopRecording: midiInput.stopRecording,
    convertToNoteEvents: midiInput.convertToNoteEvents,
    panic: midiInput.panic,
    
    // Config quick access
    playthroughEnabled: midiInput.config.playthroughEnabled,
    recordEnabled: midiInput.config.recordEnabled,
  };
}

