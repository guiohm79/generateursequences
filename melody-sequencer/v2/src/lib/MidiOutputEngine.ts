/**
 * MidiOutputEngine - MIDI Output en temps réel vers devices externes
 * Envoie des messages MIDI NOTE ON/OFF pendant la lecture
 */

export interface MidiOutputDevice {
  id: string;
  name: string;
  port: MIDIOutput;
}

export class MidiOutputEngine {
  private midiAccess: MIDIAccess | null = null;
  private selectedDevice: MidiOutputDevice | null = null;
  private isEnabled = false;
  private activeNotes = new Set<string>(); // Tracking des notes actives pour NOTE OFF

  /**
   * Initialiser l'accès MIDI
   */
  async initialize(): Promise<boolean> {
    try {
      if (!navigator.requestMIDIAccess) {
        console.warn('[MidiOutputEngine] Web MIDI API not supported');
        return false;
      }

      this.midiAccess = await navigator.requestMIDIAccess();
      console.log('[MidiOutputEngine] ✅ MIDI Access initialized');
      return true;
    } catch (error) {
      console.error('[MidiOutputEngine] ❌ Failed to initialize MIDI Access:', error);
      return false;
    }
  }

  /**
   * Obtenir la liste des devices MIDI disponibles
   */
  getAvailableDevices(): MidiOutputDevice[] {
    if (!this.midiAccess) return [];

    const devices: MidiOutputDevice[] = [];
    
    this.midiAccess.outputs.forEach((port, id) => {
      devices.push({
        id,
        name: port.name || `Device ${id}`,
        port
      });
    });

    return devices;
  }

  /**
   * Sélectionner un device MIDI
   */
  selectDevice(deviceId: string): boolean {
    if (!this.midiAccess) return false;

    const port = this.midiAccess.outputs.get(deviceId);
    if (!port) return false;

    this.selectedDevice = {
      id: deviceId,
      name: port.name || `Device ${deviceId}`,
      port
    };

    console.log('[MidiOutputEngine] Device selected:', this.selectedDevice.name);
    return true;
  }

  /**
   * Activer/désactiver l'output MIDI
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    // Si on désactive, arrêter toutes les notes actives
    if (!enabled) {
      this.stopAllNotes();
    }
  }

  /**
   * Envoyer une note ON
   */
  sendNoteOn(note: string, velocity: number = 127, channel: number = 0): void {
    if (!this.isEnabled || !this.selectedDevice) return;

    try {
      const midiNote = this.noteToMidiNumber(note);
      if (midiNote === -1) return;

      // NOTE ON message: [144 + channel, note, velocity]
      const message = [144 + channel, midiNote, Math.min(127, Math.max(0, velocity))];
      this.selectedDevice.port.send(message);

      // Tracker la note active
      this.activeNotes.add(`${note}-${channel}`);
      
      console.log(`[MidiOutputEngine] NOTE ON: ${note} (${midiNote}) vel:${velocity}`);
    } catch (error) {
      console.error('[MidiOutputEngine] Failed to send NOTE ON:', error);
    }
  }

  /**
   * Envoyer une note OFF
   */
  sendNoteOff(note: string, channel: number = 0): void {
    if (!this.selectedDevice) return;

    try {
      const midiNote = this.noteToMidiNumber(note);
      if (midiNote === -1) return;

      // NOTE OFF message: [128 + channel, note, 0]
      const message = [128 + channel, midiNote, 0];
      this.selectedDevice.port.send(message);

      // Retirer de la tracking list
      this.activeNotes.delete(`${note}-${channel}`);
      
      console.log(`[MidiOutputEngine] NOTE OFF: ${note} (${midiNote})`);
    } catch (error) {
      console.error('[MidiOutputEngine] Failed to send NOTE OFF:', error);
    }
  }

  /**
   * Arrêter toutes les notes actives (panic)
   */
  stopAllNotes(): void {
    if (!this.selectedDevice) return;

    try {
      // Envoyer NOTE OFF pour toutes les notes actives
      this.activeNotes.forEach(noteKey => {
        const [note, channelStr] = noteKey.split('-');
        const channel = parseInt(channelStr);
        this.sendNoteOff(note, channel);
      });

      // Envoyer All Notes Off (CC 123) sur tous les canaux
      for (let channel = 0; channel < 16; channel++) {
        const message = [176 + channel, 123, 0]; // Control Change: All Notes Off
        this.selectedDevice.port.send(message);
      }

      this.activeNotes.clear();
      console.log('[MidiOutputEngine] All notes stopped');
    } catch (error) {
      console.error('[MidiOutputEngine] Failed to stop all notes:', error);
    }
  }

  /**
   * Convertir une note (ex: "C4") en numéro MIDI (ex: 60)
   */
  private noteToMidiNumber(note: string): number {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    // Extraire la note et l'octave (ex: "C4" -> "C" et "4")
    const match = note.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!match) return -1;

    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr);
    
    if (!(noteName in noteMap)) return -1;

    // MIDI note number = (octave + 1) * 12 + note offset
    // C4 = 60, C3 = 48, etc.
    return (octave + 1) * 12 + noteMap[noteName];
  }

  /**
   * Obtenir l'état actuel
   */
  getState(): {
    isInitialized: boolean;
    isEnabled: boolean;
    selectedDevice: MidiOutputDevice | null;
    availableDevices: MidiOutputDevice[];
    activeNotesCount: number;
  } {
    return {
      isInitialized: !!this.midiAccess,
      isEnabled: this.isEnabled,
      selectedDevice: this.selectedDevice,
      availableDevices: this.getAvailableDevices(),
      activeNotesCount: this.activeNotes.size
    };
  }

  /**
   * Nettoyage
   */
  dispose(): void {
    this.stopAllNotes();
    this.selectedDevice = null;
    this.midiAccess = null;
    this.isEnabled = false;
  }
}