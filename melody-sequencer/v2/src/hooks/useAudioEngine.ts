import { useEffect, useState, useCallback } from 'react';
import { AudioEngine } from '../lib/AudioEngine';
import { Pattern, PlaybackConfig, TransportState, SynthPreset, NoteLength } from '../types';

export function useAudioEngine() {
  const [state, setState] = useState<TransportState>({
    isPlaying: false,
    currentStep: 0,
    tempo: 120,
    noteLength: '16n' as NoteLength
  });

  const audioEngine = AudioEngine.getInstance();

  useEffect(() => {
    const removeListener = audioEngine.addEventListener((event) => {
      switch (event.type) {
        case 'stepChange':
          setState(prev => ({ ...prev, currentStep: event.data.step }));
          break;
        case 'transportStart':
          setState(prev => ({ ...prev, isPlaying: true }));
          break;
        case 'transportStop':
          setState(prev => ({ ...prev, isPlaying: false, currentStep: 0 }));
          break;
        case 'tempoChange':
          setState(prev => ({ 
            ...prev, 
            tempo: event.data.tempo || prev.tempo,
            noteLength: event.data.noteLength || prev.noteLength
          }));
          break;
      }
    });

    setState(audioEngine.getState());

    return removeListener;
  }, [audioEngine]);

  const start = useCallback(async (pattern: Pattern, config: PlaybackConfig) => {
    await audioEngine.start(pattern, config);
  }, [audioEngine]);

  const stop = useCallback(() => {
    audioEngine.stop();
  }, [audioEngine]);

  const changeSpeed = useCallback((noteLength: NoteLength) => {
    audioEngine.changeSpeed(noteLength);
  }, [audioEngine]);

  const changeTempo = useCallback((tempo: number) => {
    audioEngine.changeTempo(tempo);
  }, [audioEngine]);

  const updatePattern = useCallback((pattern: Pattern) => {
    audioEngine.updatePattern(pattern);
  }, [audioEngine]);

  const setSynthPreset = useCallback((preset: SynthPreset) => {
    audioEngine.setSynthPreset(preset);
  }, [audioEngine]);

  return {
    state,
    start,
    stop,
    changeSpeed,
    changeTempo,
    updatePattern,
    setSynthPreset,
    isPlaying: state.isPlaying,
    currentStep: state.currentStep,
    tempo: state.tempo,
    noteLength: state.noteLength
  };
}