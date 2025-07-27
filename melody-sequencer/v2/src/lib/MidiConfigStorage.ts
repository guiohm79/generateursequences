/**
 * MidiConfigStorage - Persistance localStorage pour configuration MIDI
 */

export interface MidiConfigData {
  // MIDI Input
  midiInput: {
    selectedDeviceId: string | null;
    deviceName: string | null;
    playthroughEnabled: boolean;
    recordEnabled: boolean;
    channel: number; // -1 = tous les canaux
    octaveTranspose: number; // -3 à +3
    velocityScale: number; // 0.1 à 2.0
  };
  
  // MIDI Output
  midiOutput: {
    selectedDeviceId: string | null;
    deviceName: string | null;
  };
  
  // Audio
  audio: {
    enabled: boolean;
    volume: number; // 0.0 à 1.0
  };
  
  // Timestamp de dernière modification
  lastModified: number;
}

const STORAGE_KEY = 'melody-sequencer-midi-config';

export class MidiConfigStorage {
  /**
   * Sauvegarder la configuration MIDI
   */
  static saveConfig(config: MidiConfigData): void {
    try {
      const configWithTimestamp = {
        ...config,
        lastModified: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configWithTimestamp));
      console.log('[MidiConfigStorage] ✅ Configuration sauvegardée', configWithTimestamp);
    } catch (error) {
      console.error('[MidiConfigStorage] ❌ Erreur sauvegarde:', error);
    }
  }

  /**
   * Charger la configuration MIDI
   */
  static loadConfig(): MidiConfigData | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        console.log('[MidiConfigStorage] ℹ️ Aucune configuration trouvée');
        return null;
      }

      const config = JSON.parse(stored) as MidiConfigData;
      console.log('[MidiConfigStorage] ✅ Configuration chargée', config);
      return config;
    } catch (error) {
      console.error('[MidiConfigStorage] ❌ Erreur chargement:', error);
      return null;
    }
  }

  /**
   * Configuration par défaut
   */
  static getDefaultConfig(): MidiConfigData {
    return {
      midiInput: {
        selectedDeviceId: null,
        deviceName: null,
        playthroughEnabled: false,
        recordEnabled: false, // Toujours false par défaut
        channel: -1, // Tous les canaux
        octaveTranspose: 0,
        velocityScale: 1.0
      },
      midiOutput: {
        selectedDeviceId: null,
        deviceName: null
      },
      audio: {
        enabled: true,
        volume: 0.7
      },
      lastModified: Date.now()
    };
  }

  /**
   * Mettre à jour partiellement la configuration
   */
  static updateConfig(updates: Partial<MidiConfigData>): void {
    const currentConfig = this.loadConfig() || this.getDefaultConfig();
    const newConfig = {
      ...currentConfig,
      ...updates,
      lastModified: Date.now()
    };
    this.saveConfig(newConfig);
  }

  /**
   * Mettre à jour seulement MIDI Input
   */
  static updateMidiInput(updates: Partial<MidiConfigData['midiInput']>): void {
    const currentConfig = this.loadConfig() || this.getDefaultConfig();
    this.updateConfig({
      midiInput: {
        ...currentConfig.midiInput,
        ...updates
      }
    });
  }

  /**
   * Mettre à jour seulement MIDI Output
   */
  static updateMidiOutput(updates: Partial<MidiConfigData['midiOutput']>): void {
    const currentConfig = this.loadConfig() || this.getDefaultConfig();
    this.updateConfig({
      midiOutput: {
        ...currentConfig.midiOutput,
        ...updates
      }
    });
  }

  /**
   * Mettre à jour seulement Audio
   */
  static updateAudio(updates: Partial<MidiConfigData['audio']>): void {
    const currentConfig = this.loadConfig() || this.getDefaultConfig();
    this.updateConfig({
      audio: {
        ...currentConfig.audio,
        ...updates
      }
    });
  }

  /**
   * Effacer la configuration
   */
  static clearConfig(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[MidiConfigStorage] ✅ Configuration effacée');
    } catch (error) {
      console.error('[MidiConfigStorage] ❌ Erreur effacement:', error);
    }
  }
}