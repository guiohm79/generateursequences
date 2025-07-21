// Hook personnalisé pour l'évolution génétique de patterns
import { useState, useCallback } from 'react';
import { evolvePattern, evolveGenerations } from '../lib/randomEngine';

/**
 * Hook pour gérer l'évolution génétique des patterns musicaux
 * @param {Object} options - Options de configuration
 * @param {Object} options.pattern - Pattern de base
 * @param {Function} options.setPattern - Fonction pour modifier le pattern principal
 * @param {Function} options.saveToHistory - Fonction pour sauvegarder dans l'historique
 * @returns {Object} État et fonctions pour l'évolution génétique
 */
export function useEvolution({ pattern, setPattern, saveToHistory }) {
  // États pour l'historique d'évolution
  const [evolutionHistory, setEvolutionHistory] = useState([]);
  const [currentGeneration, setCurrentGeneration] = useState(0);

  // Fonction utilitaire pour calculer une fitness simple
  const calculateSimpleFitness = useCallback((pattern) => {
    let fitness = 0;
    let totalSteps = 0;
    let activeSteps = 0;
    
    Object.values(pattern).forEach(noteArray => {
      noteArray.forEach(step => {
        totalSteps++;
        if (step && step.on) {
          activeSteps++;
          if (step.accent) fitness += 1;
          if (step.slide) fitness += 0.5;
        }
      });
    });
    
    const density = activeSteps / Math.max(totalSteps, 1);
    return Math.round((density * 100) + fitness);
  }, []);

  // Fonction pour effectuer une évolution simple (1 génération)
  const evolveOnce = useCallback(async () => {
    if (!pattern) {
      console.warn('Aucun pattern à faire évoluer');
      return false;
    }

    try {
      // Si c'est la première évolution, initialiser l'historique avec le pattern de base
      if (evolutionHistory.length === 0) {
        const baseEntry = {
          generation: 0,
          pattern: pattern,
          fitness: 50, // Fitness de base arbitraire
          mutations: [],
          timestamp: Date.now()
        };
        setEvolutionHistory([baseEntry]);
      }

      // Faire évoluer le pattern avec paramètres subtils
      const evolved = evolvePattern(pattern, {
        mutationRate: 0.08,    // 8% de chance de mutation par note
        intensity: 0.4,        // 40% d'intensité des mutations
        preserveRhythm: true,  // Préserver la structure rythmique de base
        maxChanges: 3          // Maximum 3 changements par évolution
      });

      if (evolved && typeof evolved === 'object') {
        const newGeneration = currentGeneration + 1;
        
        // Calculer une fitness simple basée sur le nombre de notes actives
        const fitness = calculateSimpleFitness(evolved);
        
        // Créer une nouvelle entrée d'historique
        const evolutionEntry = {
          generation: newGeneration,
          pattern: evolved,
          fitness: fitness,
          mutations: [], // Les mutations ne sont pas retournées par evolvePattern
          timestamp: Date.now(),
          parentGeneration: currentGeneration
        };

        // Mettre à jour les états
        setEvolutionHistory(prev => [...prev, evolutionEntry]);
        setCurrentGeneration(newGeneration);

        // Sauvegarder dans l'historique général
        saveToHistory(evolved);
        
        // Appliquer le nouveau pattern
        setPattern(evolved);

        console.log(`Évolution génération ${newGeneration} terminée (fitness: ${fitness})`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de l\'évolution:', error);
      return false;
    }
  }, [pattern, evolutionHistory, currentGeneration, setPattern, saveToHistory]);

  // Fonction pour effectuer une évolution intensive (5 générations)
  const evolveGenerationsBoost = useCallback(async () => {
    if (!pattern) {
      console.warn('Aucun pattern à faire évoluer');
      return false;
    }

    try {
      // Faire évoluer sur 5 générations avec paramètres plus agressifs
      const result = evolveGenerations(pattern, {
        generations: 5,
        mutationRate: 0.18,    // 18% de chance de mutation
        intensity: 0.8,        // 80% d'intensité des mutations
        populationSize: 3,     // Génération de 3 candidats par génération
        selectionPressure: 0.7, // Forte pression de sélection
        preserveOriginal: true  // Garder le pattern original comme référence
      });

      if (result && result.pattern && result.history) {
        const startGeneration = currentGeneration;
        
        // Ajouter toutes les générations à l'historique
        const newHistoryEntries = result.history.map((gen, index) => ({
          generation: startGeneration + index + 1,
          pattern: gen.pattern,
          fitness: gen.fitness || 50,
          mutations: [], // Les mutations ne sont pas dans l'historique
          timestamp: Date.now() + index, // Timestamps légèrement différents
          parentGeneration: startGeneration + index,
          isBoostGeneration: true
        }));

        // Mettre à jour les états
        setEvolutionHistory(prev => [...prev, ...newHistoryEntries]);
        setCurrentGeneration(startGeneration + result.finalGeneration);

        // Sauvegarder le meilleur résultat
        saveToHistory(result.pattern);
        setPattern(result.pattern);

        const bestFitness = result.history[result.history.length - 1]?.fitness || 0;
        console.log(`Boost évolution terminé: ${result.finalGeneration} générations (meilleur fitness: ${bestFitness})`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors du boost évolution:', error);
      return false;
    }
  }, [pattern, currentGeneration, setPattern, saveToHistory]);

  // Fonction pour revenir à une génération précédente
  const revertToGeneration = useCallback((targetGeneration) => {
    try {
      const targetEntry = evolutionHistory.find(entry => entry.generation === targetGeneration);
      
      if (!targetEntry) {
        console.warn(`Génération ${targetGeneration} non trouvée`);
        return false;
      }

      // Sauvegarder le pattern cible dans l'historique général
      saveToHistory(targetEntry.pattern);
      
      // Appliquer le pattern de la génération cible
      setPattern(targetEntry.pattern);
      
      // Mettre à jour la génération courante
      setCurrentGeneration(targetGeneration);

      console.log(`Retour à la génération ${targetGeneration}`);
      return true;
    } catch (error) {
      console.error('Erreur lors du retour à la génération:', error);
      return false;
    }
  }, [evolutionHistory, setPattern, saveToHistory]);

  // Fonction pour obtenir les paramètres de la génération actuelle
  const getCurrentGenerationParams = useCallback(() => {
    if (evolutionHistory.length === 0) {
      return null;
    }

    const currentEntry = evolutionHistory.find(entry => entry.generation === currentGeneration);
    return currentEntry || evolutionHistory[evolutionHistory.length - 1];
  }, [evolutionHistory, currentGeneration]);

  // Fonction pour réinitialiser l'historique d'évolution
  const resetEvolution = useCallback(() => {
    setEvolutionHistory([]);
    setCurrentGeneration(0);
    console.log('Historique d\'évolution réinitialisé');
  }, []);

  // Fonction pour obtenir les statistiques d'évolution
  const getEvolutionStats = useCallback(() => {
    if (evolutionHistory.length === 0) {
      return null;
    }

    const totalMutations = evolutionHistory.reduce((sum, entry) => sum + (entry.mutations?.length || 0), 0);
    const averageFitness = evolutionHistory.reduce((sum, entry) => sum + (entry.fitness || 0), 0) / evolutionHistory.length;
    const bestGeneration = evolutionHistory.reduce((best, entry) => 
      (entry.fitness || 0) > (best.fitness || 0) ? entry : best
    );

    return {
      totalGenerations: evolutionHistory.length,
      currentGeneration,
      totalMutations,
      averageFitness: Math.round(averageFitness),
      bestGeneration: bestGeneration.generation,
      bestFitness: bestGeneration.fitness || 0,
      hasEvolution: evolutionHistory.length > 0
    };
  }, [evolutionHistory, currentGeneration]);

  // Vérifier si une évolution est possible
  const canEvolve = pattern !== null && typeof pattern === 'object';

  // Vérifier si on peut revenir en arrière
  const canRevert = currentGeneration > 0;

  // Obtenir les informations de la génération actuelle
  const currentGenerationInfo = getCurrentGenerationParams();

  return {
    // États
    evolutionHistory,
    currentGeneration,
    
    // État calculé
    canEvolve,
    canRevert,
    currentGenerationInfo,
    
    // Fonctions d'évolution
    evolveOnce,
    evolveGenerationsBoost,
    revertToGeneration,
    resetEvolution,
    
    // Fonctions utilitaires
    getCurrentGenerationParams,
    getEvolutionStats
  };
}