/**
 * SimpleAudioEngine - Version ultra-simplifiée et robuste
 * UNE SEULE responsabilité: jouer des patterns avec Tone.js
 * AUCUNE complexité, AUCUN singleton, AUCUN EventBus
 */

export interface SimpleStep {
  on: boolean;
  velocity: number;
}

export interface SimplePattern {
  [noteName: string]: SimpleStep[];
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
          type: "triangle"
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
      
      // Calcul de l'intervalle (en ms)
      const stepInterval = (60 / this.tempo / 4) * 1000; // 16th notes
      
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
          // Jouer la note avec PolySynth (supporte plusieurs notes simultanées)
          this.synth.triggerAttackRelease(noteName, '8n', undefined, step.velocity);
        }
      }
      
      // Avancer au step suivant
      const maxSteps = Math.max(...Object.values(this.pattern).map(steps => steps.length), 16);
      this.currentStep = (this.currentStep + 1) % maxSteps;
      
    } catch (error) {
      console.error('[SimpleAudioEngine] ❌ Step playback failed:', error);
      this.stop(); // Arrêter en cas d'erreur
    }
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
   * Obtenir l'état actuel
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      tempo: this.tempo
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