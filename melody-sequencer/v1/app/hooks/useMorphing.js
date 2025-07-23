// Hook personnalisé pour le morphing temps réel entre patterns
import { useState, useCallback } from 'react';
import { morphPatterns, generateMusicalPattern, generateAmbiancePattern, applyHappyAccidents } from '../lib/randomEngine';
import { buildPattern } from '../lib/patternUtils';

/**
 * Hook pour gérer le morphing temps réel entre patterns
 * @param {Object} options - Options de configuration
 * @param {Object} options.pattern - Pattern de base
 * @param {Object} options.randomParams - Paramètres de génération aléatoire
 * @param {number} options.steps - Nombre de pas
 * @param {number} options.minOctave - Octave minimum
 * @param {number} options.maxOctave - Octave maximum  
 * @param {Function} options.saveToHistory - Fonction pour sauvegarder dans l'historique
 * @returns {Object} État et fonctions pour le morphing
 */
export function useMorphing({ 
  pattern, 
  randomParams, 
  steps, 
  minOctave, 
  maxOctave, 
  saveToHistory 
}) {
  // États pour le morphing temps réel
  const [morphingEnabled, setMorphingEnabled] = useState(false);
  const [targetPattern, setTargetPattern] = useState(null);
  const [morphAmount, setMorphAmount] = useState(0);
  const [morphedPattern, setMorphedPattern] = useState(null);

  // Pattern à utiliser pour la lecture (morphé ou original)
  const currentPlayingPattern = morphedPattern || pattern;

  // Fonction pour générer un pattern cible pour le morphing
  const generateMorphTarget = useCallback(async () => {
    try {
      // Utiliser les derniers paramètres de génération aléatoire ou des paramètres par défaut
      const paramsToUse = randomParams || {
        style: 'goa',
        part: 'lead', 
        scale: 'minor',
        root: 'C',
        mood: 'uplifting',
        steps: steps,
        seed: ''
      };

      console.log('Génération cible morphing avec params:', paramsToUse);

      // Générer le pattern cible
      let targetData;
      
      if (paramsToUse.ambianceMode && paramsToUse.ambiance) {
        const result = generateAmbiancePattern(paramsToUse.ambiance, {
          steps: steps,
          seed: paramsToUse.seed + '_morph',
          minOct: minOctave,
          maxOct: maxOctave
        });
        targetData = { pattern: result.pattern };
      } else {
        const pattern = generateMusicalPattern(
          paramsToUse.style, 
          paramsToUse.part,
          paramsToUse.scale,
          paramsToUse.root,
          paramsToUse.mood,
          {
            steps: steps,
            seed: paramsToUse.seed + '_morph',
            minOct: minOctave,
            maxOct: maxOctave
          }
        );
        targetData = { pattern };
      }
      
      if (targetData && targetData.pattern) {
        let finalPattern = buildPattern(targetData.pattern, steps, minOctave, maxOctave);
        
        // Appliquer les accidents heureux si activés
        if (paramsToUse.happyAccidents) {
          finalPattern = applyHappyAccidents(finalPattern, {
            intensity: paramsToUse.accidentIntensity || 0.5,
            seed: paramsToUse.seed + '_morph'
          });
        }
        
        setTargetPattern(finalPattern);
        setMorphingEnabled(true);
        setMorphAmount(0);
        setMorphedPattern(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur génération cible morphing:', error);
      return false;
    }
  }, [randomParams, steps, minOctave, maxOctave]);

  // Fonction pour mettre à jour le morphing en temps réel
  const updateMorphing = useCallback((amount) => {
    if (!morphingEnabled || !targetPattern) return;
    
    try {
      setMorphAmount(amount);
      
      // Générer le pattern morphé
      const morphed = morphPatterns(pattern, targetPattern, amount);
      setMorphedPattern(morphed);
      
      console.log(`Morphing mis à jour: ${Math.round(amount * 100)}%`);
    } catch (error) {
      console.error('Erreur lors du morphing:', error);
    }
  }, [morphingEnabled, targetPattern, pattern]);

  // Fonction pour appliquer définitivement le pattern cible
  const applyMorphTarget = useCallback((setPattern) => {
    if (!targetPattern) return null;
    
    try {
      // Sauvegarder le pattern cible dans l'historique
      saveToHistory(targetPattern);
      
      // Appliquer le pattern cible si la fonction setPattern est fournie
      if (setPattern && typeof setPattern === 'function') {
        setPattern(targetPattern);
      }
      
      // Réinitialiser l'état de morphing
      setMorphingEnabled(false);
      setTargetPattern(null);
      setMorphAmount(0);
      setMorphedPattern(null);
      
      console.log('Pattern cible appliqué avec succès');
      return targetPattern;
    } catch (error) {
      console.error('Erreur lors de l\'application du pattern cible:', error);
      return null;
    }
  }, [targetPattern, saveToHistory]);

  // Fonction pour annuler le morphing
  const cancelMorphing = useCallback(() => {
    setMorphingEnabled(false);
    setTargetPattern(null);
    setMorphAmount(0);
    setMorphedPattern(null);
    console.log('Morphing annulé');
  }, []);

  // Fonction pour obtenir le pourcentage de morphing
  const getMorphPercentage = useCallback(() => {
    return Math.round(morphAmount * 100);
  }, [morphAmount]);

  // Vérifier si le morphing est actif
  const isMorphingActive = morphingEnabled && targetPattern !== null;

  // Vérifier si un pattern est morphé
  const isMorphed = morphedPattern !== null;

  return {
    // États
    morphingEnabled,
    targetPattern,
    morphAmount,
    morphedPattern,
    currentPlayingPattern,
    
    // État calculé
    isMorphingActive,
    isMorphed,
    
    // Fonctions
    generateMorphTarget,
    updateMorphing,
    applyMorphTarget,
    cancelMorphing,
    getMorphPercentage,
    
    // Setter pour permettre les ajustements externes si nécessaire
    setMorphAmount
  };
}