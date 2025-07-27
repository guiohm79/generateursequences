/**
 * useMidiInput - Hook pour gérer MIDI Input en temps réel
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MidiInputEngine, MidiInputDevice, MidiInputConfig, RecordedNote } from '../lib/MidiInputEngine';

export function useMidiInput() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<MidiInputDevice | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MidiInputDevice[]>([]);
  const [config, setConfig] = useState<MidiInputConfig>({
    channel: -1,
    octaveTranspose: 0,
    velocityScale: 1.0,
    recordEnabled: false,
    playthroughEnabled: false
  });
  const [activeNotesCount, setActiveNotesCount] = useState(0);
  const [recordedNotesCount, setRecordedNotesCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // Référence stable vers l'engine
  const engineRef = useRef<MidiInputEngine | null>(null);
  
  // Référence persistante pour les callbacks
  const callbacksRef = useRef<{
    onNoteRecorded?: (note: RecordedNote) => void;
    onPlaythrough?: (note: string, velocity: number, isNoteOn: boolean) => void;
  }>({});

  // Créer l'engine une seule fois
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new MidiInputEngine();
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  // Polling de l'état
  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef.current) {
        const state = engineRef.current.getState();
        
        // Éviter les re-renders infinis en ne mettant à jour que si vraiment différent
        if (state.selectedDevice?.id !== selectedDevice?.id) {
          setSelectedDevice(state.selectedDevice);
        }
        
        setIsInitialized(state.isInitialized);
        
        setAvailableDevices(state.availableDevices);
        setConfig(state.config);
        setActiveNotesCount(state.activeNotesCount);
        setRecordedNotesCount(state.recordedNotesCount);
        setIsRecording(state.isRecording);
      }
    }, 500); // Polling toutes les 500ms

    return () => clearInterval(interval);
  }, []);

  const initialize = useCallback(async () => {
    if (!engineRef.current) return false;
    return await engineRef.current.initialize();
  }, []);

  const selectDevice = useCallback((deviceId: string) => {
    if (!engineRef.current) return false;
    
    const success = engineRef.current.selectDevice(deviceId);
    
    // Réappliquer les callbacks après sélection du device
    if (success && callbacksRef.current) {
      engineRef.current.setCallbacks(callbacksRef.current);
    }
    
    return success;
  }, []);

  const updateConfig = useCallback((newConfig: Partial<MidiInputConfig>) => {
    if (!engineRef.current) return;
    
    engineRef.current.setConfig(newConfig);
    
    // Si le playthrough est activé et qu'on a des callbacks, les réappliquer
    if (newConfig.playthroughEnabled && callbacksRef.current) {
      engineRef.current.setCallbacks(callbacksRef.current);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.startRecording();
  }, []);

  const stopRecording = useCallback(() => {
    if (!engineRef.current) return [];
    return engineRef.current.stopRecording();
  }, []);

  const convertToNoteEvents = useCallback((stepCount: number, bpm: number = 120) => {
    if (!engineRef.current) return [];
    return engineRef.current.convertToNoteEvents(stepCount, bpm);
  }, []);

  const setCallbacks = useCallback((callbacks: {
    onNoteRecorded?: (note: RecordedNote) => void;
    onPlaythrough?: (note: string, velocity: number, isNoteOn: boolean) => void;
  }) => {
    // Stocker les callbacks dans la référence persistante
    callbacksRef.current = callbacks;
    
    // Appliquer immédiatement à l'engine actuel
    if (engineRef.current) {
      engineRef.current.setCallbacks(callbacks);
    }
  }, []);

  const panic = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.panic();
  }, []);

  const refreshDevices = useCallback(() => {
    if (!engineRef.current) return;
    // Force refresh en récupérant la liste des devices
    setAvailableDevices(engineRef.current.getAvailableDevices());
  }, []);

  // Helpers pour les configurations courantes
  const setChannel = useCallback((channel: number) => {
    updateConfig({ channel });
  }, [updateConfig]);

  const setOctaveTranspose = useCallback((octaveTranspose: number) => {
    updateConfig({ octaveTranspose });
  }, [updateConfig]);

  const setVelocityScale = useCallback((velocityScale: number) => {
    updateConfig({ velocityScale });
  }, [updateConfig]);

  const setRecordEnabled = useCallback((recordEnabled: boolean) => {
    updateConfig({ recordEnabled });
  }, [updateConfig]);

  const setPlaythroughEnabled = useCallback((playthroughEnabled: boolean) => {
    updateConfig({ playthroughEnabled });
  }, [updateConfig]);

  return {
    // État
    isInitialized,
    selectedDevice,
    availableDevices,
    config,
    activeNotesCount,
    recordedNotesCount,
    isRecording,

    // Actions principales
    initialize,
    selectDevice,
    updateConfig,
    startRecording,
    stopRecording,
    convertToNoteEvents,
    setCallbacks,
    panic,
    refreshDevices,

    // Helpers de configuration
    setChannel,
    setOctaveTranspose,
    setVelocityScale,
    setRecordEnabled,
    setPlaythroughEnabled
  };
}