/**
 * MidiConfigContext - Context React pour l'état MIDI global partagé
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useMidiInput } from '../hooks/useMidiInput';
import { useMidiOutput } from '../hooks/useMidiOutput';
import { useSimpleAudio } from '../hooks/useSimpleAudio';

interface MidiConfigState {
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
    refreshDevices: () => void;
    setChannel: (channel: number) => void;
    setOctaveTranspose: (transpose: number) => void;
    setVelocityScale: (scale: number) => void;
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
    refreshDevices: () => void;
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

  // État de synchronisation
  lastUpdate: number;
  refresh: () => void;
}

const MidiConfigContext = createContext<MidiConfigState | null>(null);

export function MidiConfigProvider({ children }: { children: React.ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Tous les hooks principaux centralisés ici
  const midiInputHook = useMidiInput();
  const midiOutputHook = useMidiOutput();
  const audioHook = useSimpleAudio();

  // Fonction pour forcer la mise à jour
  const refresh = useCallback(() => {
    setLastUpdate(Date.now());
  }, []);

  // Auto-initialisation
  useEffect(() => {
    if (!midiInputHook.isInitialized) {
      midiInputHook.initialize();
    }
    if (!midiOutputHook.isInitialized) {
      midiOutputHook.initialize();
    }
    if (!audioHook.isInitialized) {
      audioHook.initialize();
    }
  }, []);

  // Forcer le refresh quand les devices changent
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 1000); // Refresh périodique pour synchroniser

    return () => clearInterval(interval);
  }, [refresh]);

  const contextValue: MidiConfigState = {
    midiInput: {
      isInitialized: midiInputHook.isInitialized,
      selectedDevice: midiInputHook.selectedDevice,
      availableDevices: midiInputHook.availableDevices,
      config: midiInputHook.config,
      activeNotesCount: midiInputHook.activeNotesCount,
      isRecording: midiInputHook.isRecording,
      recordedNotesCount: midiInputHook.recordedNotesCount,
      // Actions
      initialize: midiInputHook.initialize,
      selectDevice: (deviceId: string) => {
        const result = midiInputHook.selectDevice(deviceId);
        // Auto-activation du playthrough quand on sélectionne un device
        if (deviceId && result) {
          midiInputHook.setPlaythroughEnabled(true);
        }
        refresh(); // Force la mise à jour
        return result;
      },
      setPlaythroughEnabled: (enabled: boolean) => {
        midiInputHook.setPlaythroughEnabled(enabled);
        refresh();
      },
      setRecordEnabled: (enabled: boolean) => {
        midiInputHook.setRecordEnabled(enabled);
        refresh();
      },
      startRecording: () => {
        midiInputHook.startRecording();
        refresh();
      },
      stopRecording: () => {
        const result = midiInputHook.stopRecording();
        refresh();
        return result;
      },
      convertToNoteEvents: midiInputHook.convertToNoteEvents,
      setCallbacks: midiInputHook.setCallbacks,
      panic: () => {
        midiInputHook.panic();
        refresh();
      },
      refreshDevices: () => {
        midiInputHook.refreshDevices();
        refresh();
      },
      setChannel: (channel: number) => {
        midiInputHook.setChannel(channel);
        refresh();
      },
      setOctaveTranspose: (transpose: number) => {
        midiInputHook.setOctaveTranspose(transpose);
        refresh();
      },
      setVelocityScale: (scale: number) => {
        midiInputHook.setVelocityScale(scale);
        refresh();
      },
    },
    
    midiOutput: {
      isInitialized: midiOutputHook.isInitialized,
      selectedDevice: midiOutputHook.selectedDevice,
      availableDevices: midiOutputHook.availableDevices,
      isConnected: midiOutputHook.isConnected,
      // Actions
      initialize: midiOutputHook.initialize,
      selectDevice: (deviceId: string) => {
        const result = midiOutputHook.selectDevice(deviceId);
        refresh();
        return result;
      },
      sendNote: midiOutputHook.sendNote,
      stopNote: midiOutputHook.stopNote,
      panic: () => {
        midiOutputHook.panic();
        refresh();
      },
      refreshDevices: () => {
        midiOutputHook.refreshDevices();
        refresh();
      },
    },

    audio: {
      isInitialized: audioHook.isInitialized,
      isEnabled: audioHook.isAudioEnabled,
      volume: audioHook.volume,
      // Actions
      initialize: audioHook.initialize,
      setEnabled: (enabled: boolean) => {
        audioHook.setAudioEnabled(enabled);
        refresh();
      },
      setVolume: (volume: number) => {
        audioHook.setVolume(volume);
        refresh();
      },
      playNote: audioHook.playNote,
      stopNote: audioHook.stopNote,
      stopAllNotes: audioHook.stopAllNotes,
    },

    lastUpdate,
    refresh,
  };

  return (
    <MidiConfigContext.Provider value={contextValue}>
      {children}
    </MidiConfigContext.Provider>
  );
}

export function useMidiConfig() {
  const context = useContext(MidiConfigContext);
  if (!context) {
    throw new Error('useMidiConfig must be used within a MidiConfigProvider');
  }
  return context;
}

/**
 * Hook simplifié pour les modes qui ont juste besoin du MIDI Input
 */
export function useMidiInputForMode() {
  const { midiInput, audio, lastUpdate } = useMidiConfig();
  
  // Configuration automatique des callbacks pour playthrough
  useEffect(() => {
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
  }, [midiInput.selectedDevice?.id, midiInput.config.playthroughEnabled, audio.isEnabled, lastUpdate]);

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