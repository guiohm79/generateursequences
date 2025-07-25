/**
 * useMidiOutput - Hook pour gérer MIDI Output en temps réel
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MidiOutputEngine, MidiOutputDevice } from '../lib/MidiOutputEngine';

export function useMidiOutput() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<MidiOutputDevice | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MidiOutputDevice[]>([]);
  const [activeNotesCount, setActiveNotesCount] = useState(0);

  // Référence stable vers l'engine
  const engineRef = useRef<MidiOutputEngine | null>(null);

  // Créer l'engine une seule fois
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new MidiOutputEngine();
      console.log('[useMidiOutput] Engine created');
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
        console.log('[useMidiOutput] Engine disposed');
      }
    };
  }, []);

  // Polling de l'état
  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef.current) {
        const state = engineRef.current.getState();
        setIsInitialized(state.isInitialized);
        setIsEnabled(state.isEnabled);
        setSelectedDevice(state.selectedDevice);
        setAvailableDevices(state.availableDevices);
        setActiveNotesCount(state.activeNotesCount);
      }
    }, 500); // Moins fréquent que l'audio (2Hz)

    return () => clearInterval(interval);
  }, []);

  const initialize = useCallback(async () => {
    if (!engineRef.current) return false;
    return await engineRef.current.initialize();
  }, []);

  const selectDevice = useCallback((deviceId: string) => {
    if (!engineRef.current) return false;
    return engineRef.current.selectDevice(deviceId);
  }, []);

  const setMidiEnabled = useCallback((enabled: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.setEnabled(enabled);
  }, []);

  const sendNoteOn = useCallback((note: string, velocity: number = 127, channel: number = 0) => {
    if (!engineRef.current) return;
    engineRef.current.sendNoteOn(note, velocity, channel);
  }, []);

  const sendNoteOff = useCallback((note: string, channel: number = 0) => {
    if (!engineRef.current) return;
    engineRef.current.sendNoteOff(note, channel);
  }, []);

  const stopAllNotes = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stopAllNotes();
  }, []);

  const refreshDevices = useCallback(() => {
    if (!engineRef.current) return;
    setAvailableDevices(engineRef.current.getAvailableDevices());
  }, []);

  return {
    // État
    isInitialized,
    isEnabled,
    selectedDevice,
    availableDevices,
    activeNotesCount,

    // Actions
    initialize,
    selectDevice,
    setEnabled: setMidiEnabled,
    sendNoteOn,
    sendNoteOff,
    stopAllNotes,
    refreshDevices
  };
}