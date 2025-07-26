/**
 * scaleColoring.ts - Utilitaire pour la coloration des notes selon la gamme
 * 
 * Ce module gère la coloration intelligente du piano roll selon la gamme sélectionnée
 * dans l'Assistant de Gammes (Scale Helper)
 */

import { ScaleHelper } from '../lib/ScaleHelper';

export type ColoringMode = 'standard' | 'scale' | 'degrees';

export interface NoteColorInfo {
  // Couleurs CSS
  bgColor: string;
  borderColor: string;
  textColor: string;
  
  // Informations musicales
  isInScale: boolean;
  isTonic: boolean;
  isDominant: boolean;
  scaledegree?: number;
  scaleName?: string;
  
  // États visuels
  isBlackKey: boolean;
  intensity: 'strong' | 'medium' | 'light' | 'neutral';
}

export class ScaleColoringHelper {
  private static instance: ScaleColoringHelper;
  private currentMode: ColoringMode = 'standard';
  private scaleHelper: ScaleHelper | null = null;
  private chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  private constructor() {}

  static getInstance(): ScaleColoringHelper {
    if (!ScaleColoringHelper.instance) {
      ScaleColoringHelper.instance = new ScaleColoringHelper();
    }
    return ScaleColoringHelper.instance;
  }

  /**
   * Configurer le helper avec les paramètres de gamme
   */
  configure(scaleHelper: ScaleHelper, mode: ColoringMode = 'scale'): void {
    this.scaleHelper = scaleHelper;
    this.currentMode = mode;
  }

  /**
   * Changer le mode de coloration
   */
  setMode(mode: ColoringMode): void {
    this.currentMode = mode;
  }

  /**
   * Obtenir le mode actuel
   */
  getMode(): ColoringMode {
    return this.currentMode;
  }

  /**
   * Obtenir les informations de couleur pour une note
   */
  getNoteColorInfo(noteName: string): NoteColorInfo {
    // Extraire le nom de la note sans octave
    const cleanNoteName = ScaleHelper.extractNoteName(noteName);
    const isBlackKey = this.isBlackKey(cleanNoteName);

    // Mode standard : couleurs classiques piano
    if (this.currentMode === 'standard' || !this.scaleHelper) {
      return this.getStandardColors(cleanNoteName, isBlackKey);
    }

    // Mode gamme : coloration selon la gamme sélectionnée
    if (this.currentMode === 'scale') {
      return this.getScaleColors(cleanNoteName, isBlackKey);
    }

    // Mode degrés : coloration selon les fonctions harmoniques
    if (this.currentMode === 'degrees') {
      return this.getDegreeColors(cleanNoteName, isBlackKey);
    }

    // Fallback
    return this.getStandardColors(cleanNoteName, isBlackKey);
  }

  /**
   * Couleurs standard (piano classique)
   */
  private getStandardColors(noteName: string, isBlackKey: boolean): NoteColorInfo {
    return {
      bgColor: isBlackKey ? 'bg-slate-800' : 'bg-white',
      borderColor: 'border-slate-600',
      textColor: isBlackKey ? 'text-white' : 'text-slate-900',
      isInScale: false,
      isTonic: false,
      isDominant: false,
      isBlackKey,
      intensity: 'neutral'
    };
  }

  /**
   * Couleurs selon la gamme (mode principal)
   */
  private getScaleColors(noteName: string, isBlackKey: boolean): NoteColorInfo {
    if (!this.scaleHelper) {
      return this.getStandardColors(noteName, isBlackKey);
    }

    const scaleNotes = this.scaleHelper.getScaleNotes();
    const isInScale = scaleNotes.includes(noteName);
    const scaleDegrees = this.scaleHelper.getScaleDegrees();
    
    // Trouver le degré de la note
    const noteIndex = scaleNotes.indexOf(noteName);
    const scaleInfo = noteIndex >= 0 ? scaleDegrees[noteIndex] : null;
    
    // Déterminer si c'est la tonique ou la dominante
    const isTonic = noteIndex === 0; // Premier degré
    const isDominant = scaleInfo?.degree === 5; // Cinquième degré

    if (!isInScale) {
      // Notes hors gamme : gris neutre
      return {
        bgColor: isBlackKey ? 'bg-slate-700' : 'bg-slate-200',
        borderColor: 'border-slate-500',
        textColor: 'text-slate-500',
        isInScale: false,
        isTonic: false,
        isDominant: false,
        isBlackKey,
        intensity: 'neutral'
      };
    }

    if (isTonic) {
      // Tonique : vert emerald fort
      return {
        bgColor: 'bg-emerald-500',
        borderColor: 'border-emerald-600',
        textColor: 'text-white',
        isInScale: true,
        isTonic: true,
        isDominant: false,
        scaledegree: 1,
        scaleName: scaleInfo?.name,
        isBlackKey,
        intensity: 'strong'
      };
    }

    if (isDominant) {
      // Dominante : bleu fort
      return {
        bgColor: 'bg-blue-500',
        borderColor: 'border-blue-600',
        textColor: 'text-white',
        isInScale: true,
        isTonic: false,
        isDominant: true,
        scaledegree: scaleInfo?.degree,
        scaleName: scaleInfo?.name,
        isBlackKey,
        intensity: 'strong'
      };
    }

    // Autres notes de la gamme : vert pâle
    return {
      bgColor: 'bg-emerald-100',
      borderColor: 'border-emerald-300',
      textColor: 'text-emerald-800',
      isInScale: true,
      isTonic: false,
      isDominant: false,
      scaledegree: scaleInfo?.degree,
      scaleName: scaleInfo?.name,
      isBlackKey,
      intensity: 'light'
    };
  }

  /**
   * Couleurs selon les degrés harmoniques (mode avancé)
   */
  private getDegreeColors(noteName: string, isBlackKey: boolean): NoteColorInfo {
    if (!this.scaleHelper) {
      return this.getStandardColors(noteName, isBlackKey);
    }

    const scaleNotes = this.scaleHelper.getScaleNotes();
    const isInScale = scaleNotes.includes(noteName);
    
    if (!isInScale) {
      return this.getScaleColors(noteName, isBlackKey); // Fallback vers mode gamme
    }

    const scaleDegrees = this.scaleHelper.getScaleDegrees();
    const noteIndex = scaleNotes.indexOf(noteName);
    const scaleInfo = scaleDegrees[noteIndex];
    
    if (!scaleInfo) {
      return this.getScaleColors(noteName, isBlackKey);
    }

    // Couleurs par fonction harmonique
    const degreeColors = {
      1: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-white', name: 'Tonique' }, // I
      2: { bg: 'bg-orange-400', border: 'border-orange-500', text: 'text-white', name: 'Sus-tonique' }, // ii
      3: { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-slate-900', name: 'Médiante' }, // iii
      4: { bg: 'bg-purple-400', border: 'border-purple-500', text: 'text-white', name: 'Sous-dominante' }, // IV
      5: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white', name: 'Dominante' }, // V
      6: { bg: 'bg-pink-400', border: 'border-pink-500', text: 'text-white', name: 'Sus-dominante' }, // vi
      7: { bg: 'bg-red-400', border: 'border-red-500', text: 'text-white', name: 'Sensible' } // vii
    };

    const colorInfo = degreeColors[scaleInfo.degree as keyof typeof degreeColors];
    
    if (!colorInfo) {
      return this.getScaleColors(noteName, isBlackKey);
    }

    return {
      bgColor: colorInfo.bg,
      borderColor: colorInfo.border,
      textColor: colorInfo.text,
      isInScale: true,
      isTonic: scaleInfo.degree === 1,
      isDominant: scaleInfo.degree === 5,
      scaledegree: scaleInfo.degree,
      scaleName: colorInfo.name,
      isBlackKey,
      intensity: 'medium'
    };
  }

  /**
   * Vérifier si une note est une touche noire
   */
  private isBlackKey(noteName: string): boolean {
    return ['C#', 'D#', 'F#', 'G#', 'A#'].includes(noteName);
  }

  /**
   * Obtenir un tooltip descriptif pour une note
   */
  getNoteTooltip(noteName: string): string {
    const colorInfo = this.getNoteColorInfo(noteName);
    const cleanNoteName = ScaleHelper.extractNoteName(noteName);
    
    if (this.currentMode === 'standard') {
      return `${cleanNoteName}${colorInfo.isBlackKey ? ' (touche noire)' : ' (touche blanche)'}`;
    }

    if (!colorInfo.isInScale) {
      return `${cleanNoteName} - Hors gamme`;
    }

    if (colorInfo.isTonic) {
      return `${cleanNoteName} - Tonique (I)`;
    }

    if (colorInfo.isDominant) {
      return `${cleanNoteName} - Dominante (V)`;
    }

    if (colorInfo.scaledegree && colorInfo.scaleName) {
      return `${cleanNoteName} - ${colorInfo.scaleName} (${colorInfo.scaledegree})`;
    }

    return `${cleanNoteName} - Note de la gamme`;
  }

  /**
   * Obtenir les classes CSS combinées pour une note
   */
  getNoteClasses(noteName: string, additionalClasses: string = ''): string {
    const colorInfo = this.getNoteColorInfo(noteName);
    
    const baseClasses = [
      colorInfo.bgColor,
      colorInfo.borderColor,
      colorInfo.textColor,
      'transition-colors',
      'duration-200'
    ];

    if (additionalClasses) {
      baseClasses.push(additionalClasses);
    }

    return baseClasses.join(' ');
  }
}

// Export de l'instance singleton
export const scaleColoringHelper = ScaleColoringHelper.getInstance();

// Export des types et utilitaires
export default scaleColoringHelper;