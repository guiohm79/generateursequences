/**
 * SynthEngine - Gestion dédiée des synthétiseurs et sons
 * Séparé de AudioEngine pour meilleure modularité
 */

import * as Tone from 'tone';
import { EventBus } from './EventBus';
import { SynthPreset } from '../types';

export interface SynthConfig {
  preset: SynthPreset;
  volume: number;
  effects: {
    reverb?: number;
    delay?: number;
    filter?: {
      frequency: number;
      type: string;
    };
  };
}

export class SynthEngine {
  private static instance: SynthEngine;
  private eventBus: EventBus;
  private synth: Tone.PolySynth | null = null;
  private currentPreset: SynthPreset | null = null;
  private isInitialized: boolean = false;
  private volume: Tone.Volume | null = null;
  private effects: Map<string, Tone.ToneAudioNode> = new Map();

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): SynthEngine {
    if (!SynthEngine.instance) {
      SynthEngine.instance = new SynthEngine();
    }
    return SynthEngine.instance;
  }

  /**
   * Initialisation différée pour éviter les erreurs SSR
   */
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Vérifier que nous sommes côté client
      if (typeof window === 'undefined') {
        throw new Error('SynthEngine can only be initialized client-side');
      }

      // Initialiser Tone.js si nécessaire
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Créer la chaîne audio
      this.volume = new Tone.Volume(-6).toDestination();
      this.synth = new Tone.PolySynth().connect(this.volume);

      // Appliquer preset par défaut
      await this.applyDefaultPreset();

      this.isInitialized = true;
      this.eventBus.emit('engine:ready', { module: 'SynthEngine' }, 'SynthEngine');

      console.log('[SynthEngine] Initialized successfully');
    } catch (error) {
      console.error('[SynthEngine] Initialization failed:', error);
      this.eventBus.emit('engine:error', {
        error: 'SynthEngine initialization failed',
        details: error
      }, 'SynthEngine');
      throw error;
    }
  }

  /**
   * Configuration des listeners d'événements
   */
  private setupEventListeners(): void {
    // Écouter les demandes de jeu de notes
    this.eventBus.on('synth:note', this.handleNoteEvent.bind(this), 'SynthEngine');
  }

  /**
   * Jouer une ou plusieurs notes
   */
  public async playNotes(
    notes: string[],
    duration: string = '8n',
    velocity: number = 0.7,
    time?: number
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.synth || notes.length === 0) return;

      // Normaliser la vélocité
      const normalizedVelocity = Math.max(0, Math.min(1, velocity));

      // Jouer les notes
      if (time !== undefined) {
        this.synth.triggerAttackRelease(notes, duration, time, normalizedVelocity);
      } else {
        this.synth.triggerAttackRelease(notes, duration, undefined, normalizedVelocity);
      }

      // Émettre événement de confirmation
      this.eventBus.emit('synth:note', {
        notes,
        duration,
        velocity: normalizedVelocity,
        time
      }, 'SynthEngine');

    } catch (error) {
      console.error('[SynthEngine] Error playing notes:', error);
      this.eventBus.emit('engine:error', {
        error: 'Failed to play notes',
        details: error,
        notes,
        duration,
        velocity
      }, 'SynthEngine');
    }
  }

  /**
   * Appliquer un preset de synthétiseur
   */
  public async applyPreset(preset: SynthPreset): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.synth) {
        throw new Error('Synth not initialized');
      }

      // Appliquer la configuration
      this.synth.set({
        oscillator: {
          type: preset.oscillator.type as any
        },
        envelope: preset.envelope,
        filter: preset.filter
      });

      this.currentPreset = preset;
      console.log(`[SynthEngine] Applied preset: ${preset.name}`);

    } catch (error) {
      console.error('[SynthEngine] Error applying preset:', error);
      this.eventBus.emit('engine:error', {
        error: 'Failed to apply synth preset',
        details: error,
        preset: preset.name
      }, 'SynthEngine');
    }
  }

  /**
   * Preset par défaut
   */
  private async applyDefaultPreset(): Promise<void> {
    const defaultPreset: SynthPreset = {
      id: 'default',
      name: 'Default Lead',
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.3,
        release: 0.5
      },
      filter: {
        frequency: 800,
        type: 'lowpass',
        rolloff: -12
      }
    };

    await this.applyPreset(defaultPreset);
  }

  /**
   * Gestion des événements de notes
   */
  private async handleNoteEvent(event: any): Promise<void> {
    const { notes, duration, velocity, time } = event.payload;
    await this.playNotes(notes, duration, velocity, time);
  }

  /**
   * Ajuster le volume global
   */
  public setVolume(volume: number): void {
    try {
      if (!this.volume) return;

      // Volume en dB (-60 à 0)
      const dbVolume = Math.max(-60, Math.min(0, volume));
      this.volume.volume.value = dbVolume;

    } catch (error) {
      console.error('[SynthEngine] Error setting volume:', error);
    }
  }

  /**
   * Obtenir l'état actuel
   */
  public getState(): {
    isInitialized: boolean;
    currentPreset: SynthPreset | null;
    volume: number;
  } {
    return {
      isInitialized: this.isInitialized,
      currentPreset: this.currentPreset,
      volume: this.volume?.volume.value ?? -6
    };
  }

  /**
   * Nettoyer les ressources
   */
  public dispose(): void {
    try {
      if (this.synth) {
        this.synth.dispose();
        this.synth = null;
      }

      if (this.volume) {
        this.volume.dispose();
        this.volume = null;
      }

      // Nettoyer les effets
      for (const effect of this.effects.values()) {
        effect.dispose();
      }
      this.effects.clear();

      this.isInitialized = false;
      console.log('[SynthEngine] Disposed successfully');

    } catch (error) {
      console.error('[SynthEngine] Error during disposal:', error);
    }
  }
}