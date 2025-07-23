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