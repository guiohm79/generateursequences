/**
 * AudioEngine V2 - Transport uniquement (refactorisé)
 * Focus sur la synchronisation et le timing
 */

import * as Tone from 'tone';
import { EventBus } from './EventBus';
import { SynthEngine } from './SynthEngine';
import { PatternEngine } from './PatternEngine';
import { PlaybackConfig, NoteLength, TransportState } from '../types';

export interface AudioEngineConfig {
  tempo: number;
  noteLength: NoteLength;
  swing: number;
  lookAhead: number;
}

export class AudioEngineV2 {
  private static instance: AudioEngineV2;
  private eventBus: EventBus;
  private synthEngine: SynthEngine;
  private patternEngine: PatternEngine;
  
  // État du transport
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private totalSteps: number = 16;
  private sequenceId: number | null = null;
  
  // Configuration
  private config: AudioEngineConfig = {
    tempo: 120,
    noteLength: '16n',
    swing: 0,
    lookAhead: 0.1
  };

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.synthEngine = SynthEngine.getInstance();
    this.patternEngine = PatternEngine.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): AudioEngineV2 {
    if (!AudioEngineV2.instance) {
      AudioEngineV2.instance = new AudioEngineV2();
    }
    return AudioEngineV2.instance;
  }

  /**
   * Initialisation différée et sécurisée
   */
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Vérifier environnement client
      if (typeof window === 'undefined') {
        throw new Error('AudioEngine can only be initialized client-side');
      }

      // Initialiser Tone.js
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Initialiser les modules dépendants
      await this.synthEngine.initialize();

      // Configuration du transport
      Tone.Transport.bpm.value = this.config.tempo;
      Tone.Transport.swing = this.config.swing;
      Tone.Transport.lookAhead = this.config.lookAhead;

      this.isInitialized = true;
      this.eventBus.emit('engine:ready', { module: 'AudioEngine' }, 'AudioEngine');
      
      console.log('[AudioEngine] Initialized successfully');
    } catch (error) {
      console.error('[AudioEngine] Initialization failed:', error);
      this.eventBus.emit('engine:error', {
        error: 'AudioEngine initialization failed',
        details: error
      }, 'AudioEngine');
      throw error;
    }
  }

  /**
   * Configuration des listeners
   */
  private setupEventListeners(): void {
    // Écouter les changements de pattern
    this.eventBus.on('pattern:change', this.handlePatternChange.bind(this), 'AudioEngine');
    this.eventBus.on('pattern:clear', this.handlePatternClear.bind(this), 'AudioEngine');
  }

  /**
   * Démarrer la lecture
   */
  public async start(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.isPlaying) {
        console.warn('[AudioEngine] Already playing');
        return;
      }

      // Obtenir le pattern actuel
      const currentPattern = this.patternEngine.getPattern();
      
      if (Object.keys(currentPattern).length === 0) {
        console.warn('[AudioEngine] No pattern to play');
        return;
      }

      // Calculer le nombre total de steps
      this.totalSteps = Math.max(
        ...Object.values(currentPattern).map(steps => steps.length),
        16
      );

      // Reset position
      this.currentStep = 0;

      // Programmer la séquence
      const stepDuration = this.config.noteLength;
      this.sequenceId = Tone.Transport.scheduleRepeat(
        this.playStep.bind(this),
        stepDuration
      );

      // Démarrer le transport
      Tone.Transport.start();
      this.isPlaying = true;

      // Émettre événement
      this.eventBus.emit('transport:start', {
        pattern: currentPattern,
        config: this.config,
        totalSteps: this.totalSteps
      }, 'AudioEngine');

      console.log('[AudioEngine] Playback started');

    } catch (error) {
      console.error('[AudioEngine] Error starting playback:', error);
      this.eventBus.emit('engine:error', {
        error: 'Failed to start playback',
        details: error
      }, 'AudioEngine');
      throw error;
    }
  }

  /**
   * Arrêter la lecture
   */
  public stop(): void {
    try {
      if (!this.isPlaying) return;

      // Arrêter la séquence
      if (this.sequenceId !== null) {
        Tone.Transport.clear(this.sequenceId);
        this.sequenceId = null;
      }

      // Arrêter le transport
      Tone.Transport.stop();
      this.isPlaying = false;
      this.currentStep = 0;

      // Émettre événement
      this.eventBus.emit('transport:stop', {
        timestamp: Date.now()
      }, 'AudioEngine');

      console.log('[AudioEngine] Playbook stopped');

    } catch (error) {
      console.error('[AudioEngine] Error stopping playback:', error);
      this.eventBus.emit('engine:error', {
        error: 'Failed to stop playback',
        details: error
      }, 'AudioEngine');
    }
  }

  /**
   * Exécution d'un step (callback du transport)
   */
  private playStep = (time: number): void => {
    try {
      const currentPattern = this.patternEngine.getPattern();
      const notesToPlay: string[] = [];
      const velocities: number[] = [];

      // Parcourir toutes les notes du pattern
      for (const [noteName, steps] of Object.entries(currentPattern)) {
        const step = steps[this.currentStep];
        
        if (step?.on) {
          notesToPlay.push(noteName);
          velocities.push(step.velocity);
        }
      }

      // Jouer les notes via SynthEngine
      if (notesToPlay.length > 0) {
        const averageVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        this.synthEngine.playNotes(
          notesToPlay,
          this.config.noteLength,
          averageVelocity,
          time
        );
      }

      // Émettre événement de step
      this.eventBus.emit('transport:step', {
        step: this.currentStep,
        notes: notesToPlay,
        velocities,
        time
      }, 'AudioEngine');

      // Avancer au step suivant
      this.currentStep = (this.currentStep + 1) % this.totalSteps;

    } catch (error) {
      console.error('[AudioEngine] Error in playStep:', error);
      this.eventBus.emit('engine:error', {
        error: 'Error during step playback',
        details: error,
        step: this.currentStep
      }, 'AudioEngine');
    }
  };

  /**
   * Changer le tempo
   */
  public setTempo(tempo: number): void {
    try {
      const clampedTempo = Math.max(60, Math.min(200, tempo));
      this.config.tempo = clampedTempo;
      
      if (this.isInitialized) {
        Tone.Transport.bpm.value = clampedTempo;
      }

      this.eventBus.emit('transport:tempo', {
        tempo: clampedTempo
      }, 'AudioEngine');

    } catch (error) {
      console.error('[AudioEngine] Error setting tempo:', error);
    }
  }

  /**
   * Changer la longueur de note
   */
  public setNoteLength(noteLength: NoteLength): void {
    try {
      const wasPlaying = this.isPlaying;
      
      if (wasPlaying) {
        this.stop();
      }

      this.config.noteLength = noteLength;

      if (wasPlaying) {
        // Redémarrer avec la nouvelle longueur
        setTimeout(() => this.start(), 50);
      }

      this.eventBus.emit('transport:tempo', {
        noteLength
      }, 'AudioEngine');

    } catch (error) {
      console.error('[AudioEngine] Error setting note length:', error);
    }
  }

  /**
   * Obtenir l'état du transport
   */
  public getState(): TransportState {
    return {
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      tempo: this.config.tempo,
      noteLength: this.config.noteLength
    };
  }

  /**
   * Obtenir la configuration complète
   */
  public getConfig(): AudioEngineConfig {
    return { ...this.config };
  }

  /**
   * Gestionnaires d'événements
   */
  private handlePatternChange(event: any): void {
    try {
      const { pattern } = event.payload;
      
      // Recalculer totalSteps si on joue
      if (this.isPlaying) {
        this.totalSteps = Math.max(
          ...Object.values(pattern).map((steps: any) => steps.length),
          16
        );
      }
    } catch (error) {
      console.error('[AudioEngine] Error handling pattern change:', error);
    }
  }

  private handlePatternClear(event: any): void {
    try {
      // Arrêter la lecture si pattern vide
      if (this.isPlaying) {
        this.stop();
      }
    } catch (error) {
      console.error('[AudioEngine] Error handling pattern clear:', error);
    }
  }

  /**
   * Nettoyer les ressources
   */
  public dispose(): void {
    try {
      this.stop();
      this.isInitialized = false;
      
      console.log('[AudioEngine] Disposed successfully');
    } catch (error) {
      console.error('[AudioEngine] Error during disposal:', error);
    }
  }
}