/**
 * Hook pour gérer les presets du Piano Roll
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { SequencerPreset } from '../../../types';
import { PresetManager } from '../../../lib/PresetManager';
import { NoteEvent } from '../types';

export function usePresets() {
  const [presets, setPresets] = useState<SequencerPreset[]>([]);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Charger les presets au démarrage
  useEffect(() => {
    const loadedPresets = PresetManager.getAllPresets();
    setPresets(loadedPresets);
  }, []);

  // Sauvegarder un preset
  const savePreset = useCallback((
    pattern: NoteEvent[], 
    steps: number, 
    name?: string
  ) => {
    const finalName = name || presetName;
    if (!finalName.trim()) {
      alert('Veuillez entrer un nom pour le preset');
      return false;
    }

    try {
      const filteredNotes = pattern.filter(note => note.isActive);
      
      PresetManager.savePreset(
        finalName.trim(),
        steps,
        filteredNotes,
        { bpm: 120 }
      );
      
      // Recharger la liste des presets
      const updatedPresets = PresetManager.getAllPresets();
      setPresets(updatedPresets);
      
      // Fermer les dialogs et vider le nom
      setShowPresetDialog(false);
      setPresetName('');
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du preset:', error);
      alert('Erreur lors de la sauvegarde du preset');
      return false;
    }
  }, [presetName]);

  // Charger un preset
  const loadPreset = useCallback((preset: SequencerPreset): {
    pattern: NoteEvent[];
    steps: number;
  } => {
    try {
      return {
        pattern: preset.notes,
        steps: preset.steps
      };
    } catch (error) {
      console.error('Erreur lors du chargement du preset:', error);
      throw new Error('Erreur lors du chargement du preset');
    }
  }, []);

  // Supprimer un preset
  const deletePreset = useCallback((presetId: string) => {
    try {
      PresetManager.deletePreset(presetId);
      
      // Recharger la liste des presets
      const updatedPresets = PresetManager.getAllPresets();
      setPresets(updatedPresets);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du preset:', error);
      return false;
    }
  }, []);

  // Exporter tous les presets
  const exportPresets = useCallback(() => {
    try {
      PresetManager.exportAllPresets();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'export des presets:', error);
      return false;
    }
  }, []);

  // Importer des presets - Pour l'instant non implémenté
  const importPresets = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      console.warn('Import de presets non encore implémenté');
      resolve(false);
    });
  }, []);

  return {
    // État
    presets,
    showPresetDialog,
    setShowPresetDialog,
    showLoadDialog,
    setShowLoadDialog,
    presetName,
    setPresetName,
    
    // Actions
    savePreset,
    loadPreset,
    deletePreset,
    exportPresets,
    importPresets
  };
}