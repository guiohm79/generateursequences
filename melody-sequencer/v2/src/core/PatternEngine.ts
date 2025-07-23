/**
 * PatternEngine - Gestion dédiée des patterns musicaux
 * Validation, transformation et logique métier des patterns
 */

import { EventBus } from './EventBus';
import { Pattern, Step } from '../types';

export interface PatternValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PatternStats {
  totalNotes: number;
  activeSteps: number;
  noteRange: {
    min: string;
    max: string;
  };
  averageVelocity: number;
  totalSteps: number;
}

export class PatternEngine {
  private static instance: PatternEngine;
  private eventBus: EventBus;
  private currentPattern: Pattern = {};
  private patternHistory: Pattern[] = [];
  private maxHistorySize: number = 50;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): PatternEngine {
    if (!PatternEngine.instance) {
      PatternEngine.instance = new PatternEngine();
    }
    return PatternEngine.instance;
  }

  /**
   * Configuration des listeners d'événements
   */
  private setupEventListeners(): void {
    this.eventBus.on('pattern:change', this.handlePatternChange.bind(this), 'PatternEngine');
    this.eventBus.on('pattern:clear', this.handlePatternClear.bind(this), 'PatternEngine');
  }

  /**
   * Valider un pattern
   */
  public validatePattern(pattern: Pattern): PatternValidationResult {
    const result: PatternValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Validation de base
      if (!pattern || typeof pattern !== 'object') {
        result.errors.push('Pattern must be a valid object');
        result.isValid = false;
        return result;
      }

      // Vérifier chaque note
      for (const [noteName, steps] of Object.entries(pattern)) {
        // Valider le nom de note
        if (!this.isValidNoteName(noteName)) {
          result.errors.push(`Invalid note name: ${noteName}`);
          result.isValid = false;
        }

        // Valider les steps
        if (!Array.isArray(steps)) {
          result.errors.push(`Steps for ${noteName} must be an array`);
          result.isValid = false;
          continue;
        }

        // Vérifier la cohérence des steps
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const stepValidation = this.validateStep(step, `${noteName}[${i}]`);
          
          if (!stepValidation.isValid) {
            result.errors.push(...stepValidation.errors);
            result.isValid = false;
          }
          
          result.warnings.push(...stepValidation.warnings);
        }

        // Avertissements sur la longueur
        if (steps.length > 64) {
          result.warnings.push(`${noteName} has ${steps.length} steps (>64 may impact performance)`);
        }
      }

      // Avertissements généraux
      const totalNotes = Object.keys(pattern).length;
      if (totalNotes > 20) {
        result.warnings.push(`Pattern has ${totalNotes} notes (>20 may impact performance)`);
      }

      if (totalNotes === 0) {
        result.warnings.push('Pattern is empty');
      }

    } catch (error) {
      result.errors.push(`Validation error: ${error}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Valider un step individuel
   */
  private validateStep(step: Step, context: string): PatternValidationResult {
    const result: PatternValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!step || typeof step !== 'object') {
      result.errors.push(`${context}: Step must be a valid object`);
      result.isValid = false;
      return result;
    }

    // Valider 'on'
    if (typeof step.on !== 'boolean') {
      result.errors.push(`${context}: 'on' must be boolean`);
      result.isValid = false;
    }

    // Valider 'velocity'
    if (typeof step.velocity !== 'number') {
      result.errors.push(`${context}: 'velocity' must be number`);
      result.isValid = false;
    } else {
      if (step.velocity < 0 || step.velocity > 1) {
        result.warnings.push(`${context}: velocity ${step.velocity} outside range [0,1]`);
      }
    }

    // Valider propriétés optionnelles
    if (step.accent !== undefined && typeof step.accent !== 'boolean') {
      result.warnings.push(`${context}: 'accent' should be boolean`);
    }

    if (step.slide !== undefined && typeof step.slide !== 'boolean') {
      result.warnings.push(`${context}: 'slide' should be boolean`);
    }

    return result;
  }

  /**
   * Valider un nom de note
   */
  private isValidNoteName(noteName: string): boolean {
    // Pattern: Note + Octave (ex: C4, F#3, Bb5)
    const notePattern = /^[A-G][#b]?[0-9]$/;
    return notePattern.test(noteName);
  }

  /**
   * Définir le pattern actuel
   */
  public setPattern(pattern: Pattern, addToHistory: boolean = true): boolean {
    try {
      // Valider le pattern
      const validation = this.validatePattern(pattern);
      
      if (!validation.isValid) {
        console.error('[PatternEngine] Invalid pattern:', validation.errors);
        this.eventBus.emit('engine:error', {
          error: 'Invalid pattern',
          details: validation.errors
        }, 'PatternEngine');
        return false;
      }

      // Ajouter à l'historique si demandé
      if (addToHistory && Object.keys(this.currentPattern).length > 0) {
        this.addToHistory(this.currentPattern);
      }

      // Copie profonde pour éviter les mutations
      this.currentPattern = this.deepClonePattern(pattern);

      // Émettre l'événement
      this.eventBus.emit('pattern:change', {
        pattern: this.currentPattern,
        validation
      }, 'PatternEngine');

      // Afficher les warnings s'il y en a
      if (validation.warnings.length > 0) {
        console.warn('[PatternEngine] Pattern warnings:', validation.warnings);
      }

      return true;
    } catch (error) {
      console.error('[PatternEngine] Error setting pattern:', error);
      this.eventBus.emit('engine:error', {
        error: 'Failed to set pattern',
        details: error
      }, 'PatternEngine');
      return false;
    }
  }

  /**
   * Obtenir le pattern actuel (copie)
   */
  public getPattern(): Pattern {
    return this.deepClonePattern(this.currentPattern);
  }

  /**
   * Obtenir les statistiques du pattern
   */
  public getPatternStats(pattern?: Pattern): PatternStats {
    const targetPattern = pattern || this.currentPattern;
    
    let totalNotes = 0;
    let activeSteps = 0;
    let totalVelocity = 0;
    let velocityCount = 0;
    let totalSteps = 0;
    const noteNames = Object.keys(targetPattern);

    // Calculer les statistiques
    for (const [noteName, steps] of Object.entries(targetPattern)) {
      totalSteps = Math.max(totalSteps, steps.length);
      
      for (const step of steps) {
        if (step.on) {
          totalNotes++;
          activeSteps++;
          totalVelocity += step.velocity;
          velocityCount++;
        }
      }
    }

    // Déterminer la plage de notes
    const sortedNotes = noteNames.sort();
    
    return {
      totalNotes,
      activeSteps,
      noteRange: {
        min: sortedNotes[0] || '',
        max: sortedNotes[sortedNotes.length - 1] || ''
      },
      averageVelocity: velocityCount > 0 ? totalVelocity / velocityCount : 0,
      totalSteps
    };
  }

  /**
   * Nettoyer le pattern
   */
  public clearPattern(): void {
    try {
      this.addToHistory(this.currentPattern);
      this.currentPattern = {};
      
      this.eventBus.emit('pattern:clear', {
        timestamp: Date.now()
      }, 'PatternEngine');
      
    } catch (error) {
      console.error('[PatternEngine] Error clearing pattern:', error);
    }
  }

  /**
   * Ajouter un pattern à l'historique
   */
  private addToHistory(pattern: Pattern): void {
    try {
      if (Object.keys(pattern).length === 0) return;

      this.patternHistory.push(this.deepClonePattern(pattern));
      
      // Limiter la taille de l'historique
      if (this.patternHistory.length > this.maxHistorySize) {
        this.patternHistory.shift();
      }
    } catch (error) {
      console.error('[PatternEngine] Error adding to history:', error);
    }
  }

  /**
   * Revenir au pattern précédent
   */
  public undo(): boolean {
    try {
      if (this.patternHistory.length === 0) return false;

      const previousPattern = this.patternHistory.pop()!;
      this.currentPattern = this.deepClonePattern(previousPattern);
      
      this.eventBus.emit('pattern:change', {
        pattern: this.currentPattern,
        isUndo: true
      }, 'PatternEngine');
      
      return true;
    } catch (error) {
      console.error('[PatternEngine] Error during undo:', error);
      return false;
    }
  }

  /**
   * Clone profond d'un pattern
   */
  private deepClonePattern(pattern: Pattern): Pattern {
    try {
      return JSON.parse(JSON.stringify(pattern));
    } catch (error) {
      console.error('[PatternEngine] Error cloning pattern:', error);
      return {};
    }
  }

  /**
   * Gestionnaires d'événements
   */
  private handlePatternChange(event: any): void {
    // Déjà géré dans setPattern
  }

  private handlePatternClear(event: any): void {
    // Déjà géré dans clearPattern
  }

  /**
   * Obtenir l'historique
   */
  public getHistory(): Pattern[] {
    return this.patternHistory.map(p => this.deepClonePattern(p));
  }

  /**
   * Nettoyer les ressources
   */
  public dispose(): void {
    try {
      this.currentPattern = {};
      this.patternHistory = [];
      console.log('[PatternEngine] Disposed successfully');
    } catch (error) {
      console.error('[PatternEngine] Error during disposal:', error);
    }
  }
}