/**
 * Gestionnaire de presets pour le séquenceur
 * Sauvegarde/chargement en localStorage + export/import JSON
 */

import { SequencerPreset, NoteEvent } from '../types';

const STORAGE_KEY = 'melody-sequencer-presets';
const MAX_PRESETS = 50; // Limite pour éviter de surcharger localStorage

export class PresetManager {
  
  /**
   * Sauvegarde un preset en localStorage
   */
  static savePreset(name: string, steps: number, notes: NoteEvent[], metadata?: SequencerPreset['metadata']): SequencerPreset {
    const preset: SequencerPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim() || `Preset ${new Date().toLocaleDateString()}`,
      timestamp: Date.now(),
      steps,
      notes: notes.filter(note => note.isActive), // Seulement les notes actives
      metadata
    };

    const presets = this.getAllPresets();
    presets.push(preset);

    // Limiter le nombre de presets (garder les plus récents)
    if (presets.length > MAX_PRESETS) {
      presets.sort((a, b) => b.timestamp - a.timestamp);
      presets.splice(MAX_PRESETS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return preset;
  }

  /**
   * Charge tous les presets depuis localStorage
   */
  static getAllPresets(): SequencerPreset[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const presets = JSON.parse(stored);
      return Array.isArray(presets) ? presets : [];
    } catch (error) {
      console.warn('Erreur lors du chargement des presets:', error);
      return [];
    }
  }

  /**
   * Charge un preset par ID
   */
  static loadPreset(id: string): SequencerPreset | null {
    const presets = this.getAllPresets();
    return presets.find(p => p.id === id) || null;
  }

  /**
   * Supprime un preset
   */
  static deletePreset(id: string): boolean {
    const presets = this.getAllPresets();
    const index = presets.findIndex(p => p.id === id);
    
    if (index === -1) return false;
    
    presets.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return true;
  }

  /**
   * Exporte un preset au format JSON (téléchargement)
   */
  static exportPreset(preset: SequencerPreset): void {
    const dataStr = JSON.stringify(preset, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${preset.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }

  /**
   * Exporte tous les presets
   */
  static exportAllPresets(): void {
    const presets = this.getAllPresets();
    if (presets.length === 0) {
      alert('Aucun preset à exporter');
      return;
    }

    const dataStr = JSON.stringify(presets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `melody-sequencer-presets-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }

  /**
   * Importe un preset depuis un fichier JSON
   */
  static async importPreset(file: File): Promise<SequencerPreset | null> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validation du format
      if (!this.isValidPreset(data)) {
        throw new Error('Format de preset invalide');
      }

      // Générer un nouvel ID pour éviter les conflits
      const preset: SequencerPreset = {
        ...data,
        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };

      // Sauvegarder le preset importé
      const presets = this.getAllPresets();
      presets.push(preset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));

      return preset;
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      return null;
    }
  }

  /**
   * Importe plusieurs presets depuis un fichier JSON
   */
  static async importMultiplePresets(file: File): Promise<SequencerPreset[]> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        // Fichier contient un seul preset
        const preset = await this.importPreset(file);
        return preset ? [preset] : [];
      }

      // Fichier contient plusieurs presets
      const validPresets: SequencerPreset[] = [];
      const currentPresets = this.getAllPresets();

      for (const item of data) {
        if (this.isValidPreset(item)) {
          const preset: SequencerPreset = {
            ...item,
            id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
          };
          validPresets.push(preset);
          currentPresets.push(preset);
        }
      }

      if (validPresets.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPresets));
      }

      return validPresets;
      
    } catch (error) {
      console.error('Erreur lors de l\'import multiple:', error);
      return [];
    }
  }

  /**
   * Valide la structure d'un preset
   */
  private static isValidPreset(data: any): data is SequencerPreset {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.name === 'string' &&
      typeof data.steps === 'number' &&
      Array.isArray(data.notes) &&
      data.notes.every((note: any) => 
        typeof note.step === 'number' &&
        typeof note.note === 'string' &&
        typeof note.velocity === 'number' &&
        typeof note.isActive === 'boolean' &&
        typeof note.duration === 'number'
      )
    );
  }

  /**
   * Nettoie le localStorage (utile pour debug)
   */
  static clearAllPresets(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Convertit les notes du piano roll vers le format preset
   */
  static convertNotesToPresetFormat(notes: Map<string, NoteEvent>): NoteEvent[] {
    return Array.from(notes.values()).filter(note => note.isActive);
  }

  /**
   * Convertit un preset vers le format du piano roll
   */
  static convertPresetToNotesMap(preset: SequencerPreset): Map<string, NoteEvent> {
    const notesMap = new Map<string, NoteEvent>();
    
    preset.notes.forEach(note => {
      const noteId = `${note.step}-${note.note}`;
      notesMap.set(noteId, { ...note });
    });
    
    return notesMap;
  }
}