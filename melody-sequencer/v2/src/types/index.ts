/**
 * Types pour l'architecture simple et robuste
 * Seuls les types réellement utilisés sont conservés
 */

// Types de base pour SimpleAudioEngine
export interface SimpleStep {
  on: boolean;
  velocity: number;
}

export interface SimplePattern {
  [noteName: string]: SimpleStep[];
}

// Types pour futures fonctionnalités
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

// Types pour système de presets
export interface NoteEvent {
  step: number;
  note: string;
  velocity: number;
  isActive: boolean;
  duration: number;
}

export interface SequencerPreset {
  id: string;
  name: string;
  timestamp: number;
  steps: number;
  notes: NoteEvent[];
  metadata?: {
    bpm?: number;
    description?: string;
    author?: string;
  };
}