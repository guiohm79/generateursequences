// Hook personnalisé pour la gestion des variations et inspirations de patterns
import { useState, useCallback } from 'react';
import { generateVariations } from '../lib/variationEngine';
import { generateInspiration } from '../lib/inspirationEngine';
import { buildPattern } from '../lib/patternUtils';
import { convertPatternToMidiData } from '../lib/midiUtils';
import { Midi } from '@tonejs/midi';
import * as Tone from 'tone';

/**
 * Hook pour gérer les variations et inspirations de patterns musicaux
 * @param {Object} options - Options de configuration
 * @param {Object} options.pattern - Pattern de base
 * @param {Function} options.setPattern - Fonction pour modifier le pattern principal
 * @param {Function} options.saveToHistory - Fonction pour sauvegarder dans l'historique
 * @param {number} options.steps - Nombre de pas
 * @param {number} options.minOctave - Octave minimum
 * @param {number} options.maxOctave - Octave maximum
 * @returns {Object} État et fonctions pour les variations
 */
export function usePatternVariations({ 
  pattern, 
  setPattern, 
  saveToHistory,
  steps,
  minOctave,
  maxOctave 
}) {
  // États pour les variations
  const [variationsInProgress, setVariationsInProgress] = useState(false);
  const [lastVariationOptions, setLastVariationOptions] = useState(null);
  const [variationResults, setVariationResults] = useState([]);

  // Fonction principale pour gérer les variations
  const handleVariations = useCallback(async (options) => {
    setVariationsInProgress(true);
    setLastVariationOptions(options);
    
    try {
      console.log('Génération de variations avec options:', options);

      let sourceData;
      
      // Déterminer la source des données selon les options
      if (options.source === 'current' && pattern) {
        // Convertir le pattern actuel en données MIDI
        sourceData = convertPatternToMidiData(pattern);
        console.log('Utilisation du pattern actuel comme source (converti en MIDI)');
      } else if (options.source === 'midi' && options.midiFile) {
        // Si un fichier MIDI est fourni, l'utiliser comme source
        sourceData = options.midiFile;
        console.log('Utilisation du fichier MIDI comme source');
      } else {
        console.warn('Aucune source valide trouvée pour les variations');
        setVariationsInProgress(false);
        return false;
      }
      
      // Générer les variations ou inspiration selon l'option
      const variations = options.useInspiration
        ? [generateInspiration(sourceData, options)]   // Mode « Inspiration »
        : generateVariations(sourceData, options);     // Mode « Variations »
      
      // Si aucune variation n'a été générée
      if (!variations || variations.length === 0) {
        console.warn('Aucune variation générée');
        setVariationsInProgress(false);
        return false;
      }

      // Construire et traiter les patterns finaux
      const processedVariations = variations.map((variation, index) => {
        if (!variation) {
          console.warn(`Variation ${index} est nulle`);
          return null;
        }

        // Convertir les données MIDI en pattern pour le séquenceur
        let finalPattern;
        try {
          // Les variations retournent des données MIDI, il faut les convertir en pattern
          const newMidi = new Midi(variation);
          const newTrack = newMidi.tracks[0];
          
          // Créer un nouveau pattern vide
          finalPattern = buildPattern(null, steps, minOctave, maxOctave);
          
          // Mapper les notes MIDI sur le pattern du séquenceur
          if (newTrack && newTrack.notes && newTrack.notes.length > 0) {
            // Trier les notes par temps
            const sortedNotes = [...newTrack.notes].sort((a, b) => a.time - b.time);
            
            sortedNotes.forEach(note => {
              try {
                // Convertir le numéro MIDI en nom de note
                const noteName = Tone.Frequency(note.midi, "midi").toNote();
                
                // Calculer l'index du step en se basant sur le temps
                // Estimer que chaque step = 1/16 de mesure
                const stepIndex = Math.round(note.time * 4) % steps; // 4 = 16ème par mesure
                
                // Vérifier que la note existe dans notre pattern et que l'index est valide
                if (finalPattern[noteName] && stepIndex >= 0 && stepIndex < steps) {
                  // Convertir la vélocité (0-1 → 0-127)
                  const velocity = Math.round(note.velocity * 127);
                  
                  // Créer l'objet step avec les propriétés
                  finalPattern[noteName][stepIndex] = {
                    on: true,
                    velocity: velocity,
                    accent: velocity > 100, // Accent si vélocité élevée
                    slide: false // Par défaut
                  };
                }
              } catch (error) {
                console.warn(`Erreur lors du traitement de la note MIDI ${note.midi}:`, error);
              }
            });
          }
        } catch (error) {
          console.error(`Erreur lors de la construction du pattern ${index}:`, error);
          return null;
        }

        return {
          id: `variation_${Date.now()}_${index}`,
          pattern: finalPattern,
          source: options.source,
          useInspiration: options.useInspiration,
          timestamp: Date.now(),
          options: { ...options }
        };
      }).filter(v => v !== null);

      if (processedVariations.length === 0) {
        console.warn('Aucune variation valide après traitement');
        setVariationsInProgress(false);
        return false;
      }

      // Sauvegarder les résultats
      setVariationResults(processedVariations);

      // Appliquer automatiquement la première variation si demandé
      if (options.autoApply && processedVariations.length > 0) {
        const firstVariation = processedVariations[0];
        saveToHistory(firstVariation.pattern);
        setPattern(firstVariation.pattern);
        console.log('Première variation appliquée automatiquement');
      }

      console.log(`${processedVariations.length} variation(s) générée(s) avec succès`);
      setVariationsInProgress(false);
      return true;

    } catch (error) {
      console.error('Erreur lors de la génération des variations:', error);
      setVariationsInProgress(false);
      return false;
    }
  }, [pattern, setPattern, saveToHistory, steps, minOctave, maxOctave]);

  // Fonction pour appliquer une variation spécifique
  const applyVariation = useCallback((variationId) => {
    const variation = variationResults.find(v => v.id === variationId);
    
    if (!variation) {
      console.warn(`Variation ${variationId} non trouvée`);
      return false;
    }

    try {
      // Sauvegarder dans l'historique avant d'appliquer
      saveToHistory(variation.pattern);
      
      // Appliquer le pattern de variation
      setPattern(variation.pattern);
      
      console.log(`Variation ${variationId} appliquée`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'application de la variation:', error);
      return false;
    }
  }, [variationResults, setPattern, saveToHistory]);

  // Fonction pour générer des variations rapides (raccourci)
  const generateQuickVariations = useCallback(async (type = 'rhythm') => {
    const defaultOptions = {
      source: 'current',
      useInspiration: false,
      autoApply: true,
      variationType: type,
      intensity: 0.5,
      preserveStructure: true
    };

    return await handleVariations(defaultOptions);
  }, [handleVariations]);

  // Fonction pour générer une inspiration rapide
  const generateQuickInspiration = useCallback(async (sourceOptions = {}) => {
    const defaultOptions = {
      source: 'current',
      useInspiration: true,
      autoApply: true,
      creativity: 0.7,
      preserveRhythm: false,
      ...sourceOptions
    };

    return await handleVariations(defaultOptions);
  }, [handleVariations]);

  // Fonction pour effacer les résultats de variations
  const clearVariations = useCallback(() => {
    setVariationResults([]);
    setLastVariationOptions(null);
    console.log('Résultats de variations effacés');
  }, []);

  // Fonction pour obtenir les statistiques des variations
  const getVariationStats = useCallback(() => {
    return {
      totalVariations: variationResults.length,
      hasResults: variationResults.length > 0,
      inProgress: variationsInProgress,
      lastOptions: lastVariationOptions,
      sources: [...new Set(variationResults.map(v => v.source))],
      inspirationCount: variationResults.filter(v => v.useInspiration).length,
      variationCount: variationResults.filter(v => !v.useInspiration).length
    };
  }, [variationResults, variationsInProgress, lastVariationOptions]);

  // Vérifier si des variations peuvent être générées
  const canGenerateVariations = pattern !== null && typeof pattern === 'object';

  return {
    // États
    variationsInProgress,
    variationResults,
    lastVariationOptions,
    
    // État calculé
    canGenerateVariations,
    
    // Fonctions principales
    handleVariations,
    applyVariation,
    
    // Fonctions de raccourci
    generateQuickVariations,
    generateQuickInspiration,
    
    // Utilitaires
    clearVariations,
    getVariationStats
  };
}