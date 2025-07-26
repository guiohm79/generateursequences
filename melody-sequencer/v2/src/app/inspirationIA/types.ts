/**
 * Types pour le Piano Roll Base et les modes
 */

// Pattern data structure avec support des notes longues
export interface NoteEvent {
  step: number;
  note: string;
  velocity: number;
  isActive: boolean;
  duration: number; // Longueur en steps (1 = un seul step, 2 = deux steps, etc.)
}

// Type pour identifier une note de manière unique
export type NoteId = string; // Format: "step-note" (ex: "5-C4")

// État de sélection par rectangle
export interface SelectionRectangle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isSelecting: boolean;
}

// Type pour le clipboard
export interface ClipboardData {
  notes: NoteEvent[];
  relativePositions: { stepOffset: number; noteOffset: number }[];
}

// Types pour les modes Piano Roll
export type PianoRollMode = 'edition' | 'inspiration' | 'arrangement' | 'scales' | 'test';

// Configuration des modes
export interface ModeConfig {
  id: PianoRollMode;
  title: string;
  description: string;
  icon: string;
  color: string;
  status: 'stable' | 'beta' | 'experimental' | 'planned';
}

// État partagé entre les modes
export interface SharedPianoRollState {
  pattern: NoteEvent[];
  steps: number;
  octave: number;
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
  selectedNotes: Set<string>;
  clipboard: ClipboardData | null;
  currentMode: PianoRollMode;
}

// Configuration du piano roll
export interface PianoRollConfig {
  stepOptions: number[];
  defaultSteps: number;
  allNotes: string[];
  allOctaves: number[];
}