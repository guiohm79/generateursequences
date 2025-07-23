export type NoteLength = '4n' | '8n' | '16n' | '32n' | '64n';

export interface Step {
  on: boolean;
  velocity: number;
  accent?: boolean;
  slide?: boolean;
}

export interface Pattern {
  [noteName: string]: Step[];
}

export interface PlaybackConfig {
  tempo: number;
  noteLength: NoteLength;
  midiOutputEnabled: boolean;
  swing?: number;
}

export interface SynthPreset {
  id: string;
  name: string;
  oscillator: {
    type: string;
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  filter?: {
    frequency: number;
    type: string;
    rolloff: number;
  };
}

export interface TransportState {
  isPlaying: boolean;
  currentStep: number;
  tempo: number;
  noteLength: NoteLength;
}

export type AudioEngineEventType = 'stepChange' | 'transportStart' | 'transportStop' | 'tempoChange';

export interface AudioEngineEvent {
  type: AudioEngineEventType;
  data?: any;
}

export type AudioEngineListener = (event: AudioEngineEvent) => void;