/**
 * useSimpleAudio - Hook ultra-simple pour l'audio
 * AUCUNE complexité, AUCUN EventBus, JUSTE ce qui marche
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SimpleAudioEngine, SimplePattern, MidiOutputCallback } from '../lib/SimpleAudioEngine';

export function useSimpleAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tempo, setTempoState] = useState(120);
  const [noteSpeed, setNoteSpeedState] = useState<'8n' | '16n' | '32n'>('16n');
  const [isAudioEnabled, setIsAudioEnabledState] = useState(true);
  
  // Référence stable vers l'engine
  const engineRef = useRef<SimpleAudioEngine | null>(null);
  
  // Créer l'engine une seule fois
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SimpleAudioEngine();
      console.log('[useSimpleAudio] Engine created');
    }
    
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
        console.log('[useSimpleAudio] Engine disposed');
      }
    };
  }, []);
  
  // Polling de l'état (simple et fiable)
  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef.current) {
        const state = engineRef.current.getState();
        setIsPlaying(state.isPlaying);
        setIsInitialized(state.isInitialized);
        setCurrentStep(state.currentStep);
        setTempoState(state.tempo);
        setNoteSpeedState(state.noteSpeed);
        setIsAudioEnabledState(state.isAudioEnabled);
      }
    }, 100); // 10fps suffisant
    
    return () => clearInterval(interval);
  }, []);
  
  const initialize = useCallback(async () => {
    if (!engineRef.current) return false;
    return await engineRef.current.initialize();
  }, []);
  
  const start = useCallback(async (pattern?: SimplePattern) => {
    if (!engineRef.current) return false;
    
    if (pattern) {
      engineRef.current.setPattern(pattern);
    }
    
    return await engineRef.current.start();
  }, []);
  
  const stop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stop();
  }, []);
  
  const setPattern = useCallback((pattern: SimplePattern) => {
    if (!engineRef.current) return;
    engineRef.current.setPattern(pattern);
  }, []);
  
  const setTempo = useCallback((newTempo: number) => {
    if (!engineRef.current) return;
    engineRef.current.setTempo(newTempo);
  }, []);

  const setNoteSpeed = useCallback((speed: '8n' | '16n' | '32n') => {
    if (!engineRef.current) return;
    engineRef.current.setNoteSpeed(speed);
  }, []);

  const setMidiCallback = useCallback((callback: MidiOutputCallback | null) => {
    if (!engineRef.current) return;
    engineRef.current.setMidiCallback(callback);
  }, []);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.setAudioEnabled(enabled);
  }, []);
  
  return {
    // État
    isPlaying,
    isInitialized,
    currentStep,
    tempo,
    noteSpeed,
    isAudioEnabled,
    
    // Actions
    initialize,
    start,
    stop,
    setPattern,
    setTempo,
    setNoteSpeed,
    setMidiCallback,
    setAudioEnabled
  };
}