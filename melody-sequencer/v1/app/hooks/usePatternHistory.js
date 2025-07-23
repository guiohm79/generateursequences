// Hook personnalisé pour la gestion de l'historique des patterns avec undo/redo
import { useState, useCallback } from 'react';

/**
 * Hook pour gérer l'historique des patterns avec fonctionnalité undo/redo
 * @returns {Object} Objet contenant les états et fonctions de gestion d'historique
 */
export function usePatternHistory() {
  const [patternHistory, setPatternHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Fonction pour sauvegarder le pattern actuel dans l'historique
  const saveToHistory = useCallback((newPattern) => {
    setPatternHistory(prev => {
      const newHistory = [...prev];
      // Supprimer les éléments après l'index actuel si on n'est pas à la fin
      if (historyIndex >= 0 && historyIndex < newHistory.length - 1) {
        newHistory.splice(historyIndex + 1);
      }
      // Ajouter le nouveau pattern
      newHistory.push(JSON.parse(JSON.stringify(newPattern)));
      // Limiter l'historique à 50 éléments
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Fonction pour revenir en arrière dans l'historique
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return JSON.parse(JSON.stringify(patternHistory[newIndex]));
    }
    return null;
  }, [historyIndex, patternHistory]);

  // Fonction pour aller vers l'avant dans l'historique
  const handleRedo = useCallback(() => {
    if (historyIndex < patternHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return JSON.parse(JSON.stringify(patternHistory[newIndex]));
    }
    return null;
  }, [historyIndex, patternHistory]);

  // Indicateurs d'état
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < patternHistory.length - 1;

  return {
    patternHistory,
    historyIndex,
    saveToHistory,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo
  };
}