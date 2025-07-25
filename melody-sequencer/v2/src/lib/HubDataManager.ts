/**
 * Gestionnaire de données interactives du Hub
 * Persistance LocalStorage + Export/Import JSON
 */

import { MenuItem, MenuCheckbox, MenuNote, MenuStatus } from '../types/menu';

const STORAGE_KEY = 'melody-sequencer-hub-data';
const STORAGE_VERSION = '1.0.0';

// Structure des données sauvegardées
interface HubData {
  version: string;
  lastUpdated: number;
  items: {
    [itemId: string]: {
      status?: MenuStatus;
      checkboxes?: MenuCheckbox[];
      notes?: MenuNote[];
      lastUpdated?: number;
      estimatedTime?: string;
    };
  };
  globalNotes?: MenuNote[];
  settings?: {
    autoSave: boolean;
    showCompletedCheckboxes: boolean;
  };
}

class HubDataManager {
  private data: HubData;

  constructor() {
    this.data = this.loadFromStorage();
  }

  // === CHARGEMENT ET SAUVEGARDE ===
  
  private loadFromStorage(): HubData {
    // Vérifier si on est côté client
    if (typeof window === 'undefined') {
      return this.getDefaultData();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Vérifier la version et migrer si nécessaire
        if (parsed.version === STORAGE_VERSION) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Erreur chargement données Hub:', error);
    }

    return this.getDefaultData();
  }

  private getDefaultData(): HubData {
    return {
      version: STORAGE_VERSION,
      lastUpdated: Date.now(),
      items: {},
      globalNotes: [],
      settings: {
        autoSave: true,
        showCompletedCheckboxes: true
      }
    };
  }

  private saveToStorage(): void {
    // Vérifier si on est côté client
    if (typeof window === 'undefined') {
      return;
    }

    try {
      this.data.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Erreur sauvegarde données Hub:', error);
    }
  }

  // === GESTION DES STATUTS ===
  
  getItemStatus(itemId: string): MenuStatus | undefined {
    return this.data.items[itemId]?.status;
  }

  setItemStatus(itemId: string, status: MenuStatus): void {
    if (!this.data.items[itemId]) {
      this.data.items[itemId] = {};
    }
    this.data.items[itemId].status = status;
    this.data.items[itemId].lastUpdated = Date.now();
    
    if (this.data.settings?.autoSave) {
      this.saveToStorage();
    }
  }

  // === GESTION DES CHECKBOXES ===
  
  getItemCheckboxes(itemId: string): MenuCheckbox[] {
    return this.data.items[itemId]?.checkboxes || [];
  }

  addCheckbox(itemId: string, checkbox: Omit<MenuCheckbox, 'id' | 'createdAt' | 'updatedAt'>): MenuCheckbox {
    const newCheckbox: MenuCheckbox = {
      ...checkbox,
      id: `checkbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!this.data.items[itemId]) {
      this.data.items[itemId] = {};
    }
    if (!this.data.items[itemId].checkboxes) {
      this.data.items[itemId].checkboxes = [];
    }

    this.data.items[itemId].checkboxes!.push(newCheckbox);
    this.data.items[itemId].lastUpdated = Date.now();
    
    if (this.data.settings?.autoSave) {
      this.saveToStorage();
    }

    return newCheckbox;
  }

  toggleCheckbox(itemId: string, checkboxId: string): boolean {
    const checkboxes = this.data.items[itemId]?.checkboxes;
    if (!checkboxes) return false;

    const checkbox = checkboxes.find(cb => cb.id === checkboxId);
    if (!checkbox) return false;

    checkbox.checked = !checkbox.checked;
    checkbox.updatedAt = Date.now();
    this.data.items[itemId].lastUpdated = Date.now();
    
    if (this.data.settings?.autoSave) {
      this.saveToStorage();
    }

    return checkbox.checked;
  }

  removeCheckbox(itemId: string, checkboxId: string): boolean {
    const checkboxes = this.data.items[itemId]?.checkboxes;
    if (!checkboxes) return false;

    const index = checkboxes.findIndex(cb => cb.id === checkboxId);
    if (index === -1) return false;

    checkboxes.splice(index, 1);
    this.data.items[itemId].lastUpdated = Date.now();
    
    if (this.data.settings?.autoSave) {
      this.saveToStorage();
    }

    return true;
  }

  // === GESTION DES NOTES ===
  
  getItemNotes(itemId: string): MenuNote[] {
    return this.data.items[itemId]?.notes || [];
  }

  addNote(itemId: string, note: Omit<MenuNote, 'id' | 'createdAt' | 'updatedAt'>): MenuNote {
    const newNote: MenuNote = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!this.data.items[itemId]) {
      this.data.items[itemId] = {};
    }
    if (!this.data.items[itemId].notes) {
      this.data.items[itemId].notes = [];
    }

    this.data.items[itemId].notes!.push(newNote);
    this.data.items[itemId].lastUpdated = Date.now();
    
    if (this.data.settings?.autoSave) {
      this.saveToStorage();
    }

    return newNote;
  }

  updateNote(itemId: string, noteId: string, content: string): boolean {
    const notes = this.data.items[itemId]?.notes;
    if (!notes) return false;

    const note = notes.find(n => n.id === noteId);
    if (!note) return false;

    note.content = content;
    note.updatedAt = Date.now();
    this.data.items[itemId].lastUpdated = Date.now();
    
    if (this.data.settings?.autoSave) {
      this.saveToStorage();
    }

    return true;
  }

  removeNote(itemId: string, noteId: string): boolean {
    const notes = this.data.items[itemId]?.notes;
    if (!notes) return false;

    const index = notes.findIndex(n => n.id === noteId);
    if (index === -1) return false;

    notes.splice(index, 1);
    this.data.items[itemId].lastUpdated = Date.now();
    
    if (this.data.settings?.autoSave) {
      this.saveToStorage();
    }

    return true;
  }

  // === GESTION DES MÉTADONNÉES ===
  
  setItemEstimatedTime(itemId: string, time: string): void {
    if (!this.data.items[itemId]) {
      this.data.items[itemId] = {};
    }
    this.data.items[itemId].estimatedTime = time;
    this.data.items[itemId].lastUpdated = Date.now();
    
    if (this.data.settings?.autoSave) {
      this.saveToStorage();
    }
  }

  getItemEstimatedTime(itemId: string): string | undefined {
    return this.data.items[itemId]?.estimatedTime;
  }

  // === NOTES GLOBALES ===
  
  getGlobalNotes(): MenuNote[] {
    return this.data.globalNotes || [];
  }

  addGlobalNote(note: Omit<MenuNote, 'id' | 'createdAt' | 'updatedAt'>): MenuNote {
    const newNote: MenuNote = {
      ...note,
      id: `global-note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!this.data.globalNotes) {
      this.data.globalNotes = [];
    }

    this.data.globalNotes.push(newNote);
    
    if (this.data.settings?.autoSave) {
      this.saveToStorage();
    }

    return newNote;
  }

  // === STATISTIQUES ===
  
  getStats() {
    const items = Object.values(this.data.items);
    const totalCheckboxes = items.reduce((acc, item) => acc + (item.checkboxes?.length || 0), 0);
    const completedCheckboxes = items.reduce((acc, item) => 
      acc + (item.checkboxes?.filter(cb => cb.checked).length || 0), 0);
    const totalNotes = items.reduce((acc, item) => acc + (item.notes?.length || 0), 0);

    return {
      totalItems: Object.keys(this.data.items).length,
      totalCheckboxes,
      completedCheckboxes,
      totalNotes,
      globalNotes: this.data.globalNotes?.length || 0,
      lastUpdated: this.data.lastUpdated
    };
  }

  // === EXPORT/IMPORT ===
  
  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData);
      
      // Validation basique
      if (!importedData.version || !importedData.items) {
        throw new Error('Format de données invalide');
      }

      this.data = importedData;
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Erreur import données Hub:', error);
      return false;
    }
  }

  // === NETTOYAGE ===
  
  clearAllData(): void {
    this.data = {
      version: STORAGE_VERSION,
      lastUpdated: Date.now(),
      items: {},
      globalNotes: [],
      settings: {
        autoSave: true,
        showCompletedCheckboxes: true
      }
    };
    this.saveToStorage();
  }

  // === SAUVEGARDE MANUELLE ===
  
  forceSave(): void {
    this.saveToStorage();
  }

  // === RECHARGEMENT CÔTÉ CLIENT ===
  
  reloadFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.data = this.loadFromStorage();
    }
  }
}

// Instance singleton
export const hubDataManager = new HubDataManager();