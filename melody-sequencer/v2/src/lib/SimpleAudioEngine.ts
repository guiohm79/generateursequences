/**
 * SimpleAudioEngine - Version ultra-simplifiée et robuste
 * UNE SEULE responsabilité: jouer des patterns avec Tone.js
 * AUCUNE complexité, AUCUN singleton, AUCUN EventBus
 */

export interface SimpleStep {
  on: boolean;
  velocity: number;
  duration?: number; // Durée en steps (optionnel, pour compatibilité)
}

export interface SimplePattern {
  [noteName: string]: SimpleStep[];
}

export interface MidiOutputCallback {
  onNoteOn: (note: string, velocity: number) => void;
  onNoteOff: (note: string) => void;
}

export class SimpleAudioEngine {
  private Tone: any = null;
  private synth: any = null;
  private isInitialized = false;
  private isPlaying = false;
  private intervalId: NodeJS.Timeout | null = null;
  private currentStep = 0;
  private pattern: SimplePattern = {};
  private tempo = 120;
  private noteSpeed: '8n' | '16n' | '32n' = '16n'; // Vitesse de lecture
  private midiCallback: MidiOutputCallback | null = null; // Callback pour MIDI Output
  private isAudioEnabled = true; // Contrôle si l'audio interne joue
  
  /**
   * Initialisation simple et claire
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('[SimpleAudioEngine] Initializing...');
      
      // Vérification côté client
      if (typeof window === 'undefined') {
        throw new Error('Must run on client side');
      }
      
      // Chargement dynamique de Tone.js
      this.Tone = await import('tone');
      console.log('[SimpleAudioEngine] Tone.js loaded');
      
      // Initialisation du contexte audio
      if (this.Tone.context.state === 'suspended') {
        await this.Tone.start();
        console.log('[SimpleAudioEngine] Audio context started');
      }
      
      // Création du synthétiseur polyphonique avec meilleur son
      this.synth = new this.Tone.PolySynth(this.Tone.Synth, {
        oscillator: {
          type: "sawtooth"
        },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 1
        }
      }).toDestination();
      
      // Ajout d'un peu de reverb pour un son plus riche
      const reverb = new this.Tone.Reverb(0.4).toDestination();
      this.synth.connect(reverb);
      
      console.log('[SimpleAudioEngine] PolySynth with reverb created');
      
      this.isInitialized = true;
      console.log('[SimpleAudioEngine] ✅ Initialization complete');
      return true;
      
    } catch (error) {
      console.error('[SimpleAudioEngine] ❌ Initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }
  
  /**
   * Définir le pattern à jouer
   */
  setPattern(pattern: SimplePattern): void {
    this.pattern = { ...pattern };
    console.log('[SimpleAudioEngine] Pattern set:', Object.keys(pattern));
  }
  
  /**
   * Démarrer la lecture
   */
  async start(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const success = await this.initialize();
        if (!success) return false;
      }
      
      if (this.isPlaying) {
        console.warn('[SimpleAudioEngine] Already playing');
        return true;
      }
      
      if (Object.keys(this.pattern).length === 0) {
        console.warn('[SimpleAudioEngine] No pattern to play');
        return false;
      }
      
      console.log('[SimpleAudioEngine] Starting playback...');
      this.isPlaying = true;
      this.currentStep = 0;
      
      // Calcul de l'intervalle basé sur la vitesse de lecture
      const stepInterval = this.calculateStepInterval();
      
      // Démarrage de la boucle de lecture
      this.intervalId = setInterval(() => {
        this.playCurrentStep();
      }, stepInterval);
      
      console.log('[SimpleAudioEngine] ✅ Playback started');
      return true;
      
    } catch (error) {
      console.error('[SimpleAudioEngine] ❌ Start failed:', error);
      this.isPlaying = false;
      return false;
    }
  }
  
  /**
   * Arrêter la lecture
   */
  stop(): void {
    try {
      if (!this.isPlaying) return;
      
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      
      // Arrêter toutes les notes MIDI actives
      if (this.midiCallback) {
        // Envoyer Note OFF pour toutes les notes possibles
        const allNotes = Object.keys(this.pattern);
        for (const note of allNotes) {
          this.midiCallback.onNoteOff(note);
        }
      }
      
      this.isPlaying = false;
      this.currentStep = 0;
      
      console.log('[SimpleAudioEngine] ✅ Playback stopped');
      
    } catch (error) {
      console.error('[SimpleAudioEngine] ❌ Stop failed:', error);
    }
  }
  
  /**
   * Jouer le step actuel
   */
  private playCurrentStep(): void {
    try {
      if (!this.synth || !this.pattern) return;
      
      // Parcourir toutes les notes du pattern
      for (const [noteName, steps] of Object.entries(this.pattern)) {
        const step = steps[this.currentStep];
        
        if (step && step.on) {
          // Jouer la note avec PolySynth SEULEMENT si audio interne activé
          if (this.isAudioEnabled) {
            this.synth.triggerAttackRelease(noteName, '8n', undefined, step.velocity);
          }
          
          // Envoyer MIDI Note ON si callback configuré
          if (this.midiCallback) {
            this.midiCallback.onNoteOn(noteName, Math.round(step.velocity * 127));
            
            // Programmer le MIDI Note OFF après la durée de la note
            const noteDuration = this.calculateNoteDuration();
            setTimeout(() => {
              if (this.midiCallback) {
                this.midiCallback.onNoteOff(noteName);
              }
            }, noteDuration);
          }
        }
      }
      
      // Avancer au step suivant
      const patternLengths = Object.values(this.pattern).map(steps => steps.length);
      const maxSteps = patternLengths.length > 0 ? Math.max(...patternLengths) : 16;
      this.currentStep = (this.currentStep + 1) % maxSteps;
      
    } catch (error) {
      console.error('[SimpleAudioEngine] ❌ Step playback failed:', error);
      this.stop(); // Arrêter en cas d'erreur
    }
  }

  /**
   * Calculer la durée d'une note en millisecondes
   */
  private calculateNoteDuration(): number {
    const stepInterval = this.calculateStepInterval();
    return Math.max(100, stepInterval * 0.8); // 80% de la durée du step, min 100ms
  }
  
  /**
   * Changer le tempo
   */
  setTempo(tempo: number): void {
    this.tempo = Math.max(60, Math.min(200, tempo));
    
    // Si en cours de lecture, redémarrer avec le nouveau tempo
    if (this.isPlaying) {
      this.stop();
      setTimeout(() => this.start(), 50);
    }
  }

  /**
   * Changer la vitesse de lecture (seulement pour l'audio, pas l'export MIDI)
   */
  setNoteSpeed(speed: '8n' | '16n' | '32n'): void {
    this.noteSpeed = speed;
    
    // Si en cours de lecture, redémarrer avec la nouvelle vitesse
    if (this.isPlaying) {
      this.stop();
      setTimeout(() => this.start(), 50);
    }
  }

  /**
   * Configurer le callback MIDI Output
   */
  setMidiCallback(callback: MidiOutputCallback | null): void {
    this.midiCallback = callback;
    // Désactiver l'audio interne si MIDI Output est activé
    this.isAudioEnabled = !callback;
  }

  /**
   * Activer/désactiver l'audio interne (indépendamment du MIDI)
   */
  setAudioEnabled(enabled: boolean): void {
    this.isAudioEnabled = enabled;
  }

  /**
   * Calculer l'intervalle entre les steps selon la vitesse de lecture
   */
  private calculateStepInterval(): number {
    const baseInterval = (60 / this.tempo / 4) * 1000; // 16th note de base
    
    switch (this.noteSpeed) {
      case '8n':  return baseInterval * 2;    // 2x plus lent (8th notes)
      case '16n': return baseInterval;        // Normal (16th notes)
      case '32n': return baseInterval / 2;    // 2x plus rapide (32nd notes)
      default:    return baseInterval;
    }
  }
  
  /**
   * Obtenir l'état actuel
   */
  getState(): {
    isInitialized: boolean;
    isPlaying: boolean;
    currentStep: number;
    tempo: number;
    noteSpeed: '8n' | '16n' | '32n';
    isAudioEnabled: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      tempo: this.tempo,
      noteSpeed: this.noteSpeed,
      isAudioEnabled: this.isAudioEnabled
    };
  }
  
  /**
   * Nettoyage des ressources
   */
  dispose(): void {
    try {
      this.stop();
      
      if (this.synth) {
        this.synth.dispose();
        this.synth = null;
      }
      
      this.isInitialized = false;
      console.log('[SimpleAudioEngine] ✅ Disposed');
      
    } catch (error) {
      console.error('[SimpleAudioEngine] ❌ Dispose failed:', error);
    }
  }
}