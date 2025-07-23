import * as Tone from 'tone';
import { 
  Pattern, 
  PlaybackConfig, 
  TransportState, 
  AudioEngineListener, 
  AudioEngineEvent,
  NoteLength,
  SynthPreset 
} from '../types';

export class AudioEngine {
  private static instance: AudioEngine;
  private synth: Tone.PolySynth | null = null;
  private pattern: Pattern = {};
  private config: PlaybackConfig = {
    tempo: 120,
    noteLength: '16n',
    midiOutputEnabled: false
  };
  private listeners: AudioEngineListener[] = [];
  private currentStep = 0;
  private totalSteps = 16;
  private sequenceId: number | null = null;

  private constructor() {
    this.initializeTone();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private async initializeTone(): Promise<void> {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    
    this.synth = new Tone.PolySynth().toDestination();
    Tone.Transport.bpm.value = this.config.tempo;
  }

  private calculateDuration(noteLength: NoteLength): string {
    return noteLength;
  }

  private calculateStepDuration(): number {
    const beatsPerMinute = this.config.tempo;
    const noteDivision = this.parseNoteLength(this.config.noteLength);
    return (60 / beatsPerMinute) * (4 / noteDivision);
  }

  private parseNoteLength(noteLength: NoteLength): number {
    const mapping: Record<NoteLength, number> = {
      '4n': 4,
      '8n': 8,
      '16n': 16,
      '32n': 32,
      '64n': 64
    };
    return mapping[noteLength] || 16;
  }

  private emit(event: AudioEngineEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  private playStep = (time: number): void => {
    const notesToPlay: string[] = [];
    
    Object.entries(this.pattern).forEach(([noteName, steps]) => {
      const step = steps[this.currentStep];
      if (step?.on && this.synth) {
        notesToPlay.push(noteName);
      }
    });

    if (notesToPlay.length > 0 && this.synth) {
      const velocity = 0.7;
      const duration = this.calculateDuration(this.config.noteLength);
      this.synth.triggerAttackRelease(notesToPlay, duration, time, velocity);
    }

    this.emit({
      type: 'stepChange',
      data: { step: this.currentStep, notesPlayed: notesToPlay }
    });

    this.currentStep = (this.currentStep + 1) % this.totalSteps;
  };

  public async start(pattern: Pattern, config: PlaybackConfig): Promise<void> {
    if (!this.synth) {
      await this.initializeTone();
    }

    this.stop();
    
    this.pattern = pattern;
    this.config = { ...config };
    this.currentStep = 0;
    
    this.totalSteps = Math.max(
      ...Object.values(pattern).map(steps => steps.length),
      16
    );

    Tone.Transport.bpm.value = config.tempo;
    
    const stepDuration = this.calculateDuration(config.noteLength);
    this.sequenceId = Tone.Transport.scheduleRepeat(this.playStep, stepDuration);
    
    Tone.Transport.start();
    
    this.emit({ type: 'transportStart', data: { config, pattern } });
  }

  public stop(): void {
    if (this.sequenceId !== null) {
      Tone.Transport.clear(this.sequenceId);
      this.sequenceId = null;
    }
    
    Tone.Transport.stop();
    this.currentStep = 0;
    
    this.emit({ type: 'transportStop' });
  }

  public changeSpeed(noteLength: NoteLength): void {
    const wasPlaying = this.isPlaying();
    const currentPattern = { ...this.pattern };
    const currentConfig = { ...this.config, noteLength };
    
    if (wasPlaying) {
      this.stop();
      this.start(currentPattern, currentConfig);
    } else {
      this.config.noteLength = noteLength;
    }
    
    this.emit({ type: 'tempoChange', data: { noteLength } });
  }

  public changeTempo(tempo: number): void {
    this.config.tempo = tempo;
    Tone.Transport.bpm.value = tempo;
    
    this.emit({ type: 'tempoChange', data: { tempo } });
  }

  public updatePattern(pattern: Pattern): void {
    this.pattern = pattern;
    this.totalSteps = Math.max(
      ...Object.values(pattern).map(steps => steps.length),
      16
    );
  }

  public setSynthPreset(preset: SynthPreset): void {
    if (!this.synth) return;
    
    this.synth.set({
      oscillator: { type: preset.oscillator.type as any },
      envelope: preset.envelope,
      filter: preset.filter
    });
  }

  public isPlaying(): boolean {
    return Tone.Transport.state === 'started';
  }

  public getState(): TransportState {
    return {
      isPlaying: this.isPlaying(),
      currentStep: this.currentStep,
      tempo: this.config.tempo,
      noteLength: this.config.noteLength
    };
  }

  public addEventListener(listener: AudioEngineListener): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public dispose(): void {
    this.stop();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    this.listeners = [];
  }
}