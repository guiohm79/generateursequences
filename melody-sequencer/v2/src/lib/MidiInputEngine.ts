/**
 * MidiInputEngine - MIDI Input en temps réel depuis devices externes
 * Gère l'écoute des messages MIDI et la conversion en notes pour le piano roll
 */

import { NoteEvent } from '../app/pianorollBase/types';

export interface MidiInputDevice {
  id: string;
  name: string;
  port: MIDIInput;
}

export interface MidiInputConfig {
  channel: number; // Canal MIDI à écouter (0-15, ou -1 pour tous)
  octaveTranspose: number; // Transposition d'octave (-3 à +3)
  velocityScale: number; // Multiplicateur de vélocité (0.1 à 2.0)
  recordEnabled: boolean; // Enregistrement vers piano roll activé
  playthroughEnabled: boolean; // Playthrough audio activé
}

export interface RecordedNote {
  note: string;
  velocity: number;
  timestamp: number;
  step?: number; // Step calculé selon le timing
}

export class MidiInputEngine {
  private midiAccess: MIDIAccess | null = null;
  private selectedDevice: MidiInputDevice | null = null;
  private config: MidiInputConfig = {
    channel: -1, // Tous les canaux par défaut
    octaveTranspose: 0,
    velocityScale: 1.0,
    recordEnabled: false,
    playthroughEnabled: false
  };

  private recordedNotes: RecordedNote[] = [];
  private activeNotes = new Set<string>(); // Notes actuellement pressées
  private recordStartTime: number = 0;
  private isCurrentlyRecording: boolean = false; // État séparé pour l'enregistrement

  // Callbacks pour intégration externe
  private onNoteRecorded?: (note: RecordedNote) => void;
  private onPlaythrough?: (note: string, velocity: number, isNoteOn: boolean) => void;

  /**
   * Initialiser l'accès MIDI
   */
  async initialize(): Promise<boolean> {
    try {
      if (!navigator.requestMIDIAccess) {
        console.warn('[MidiInputEngine] Web MIDI API not supported');
        return false;
      }

      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      console.log('[MidiInputEngine] ✅ MIDI Access initialized');
      
      // Écouter les changements de devices
      this.midiAccess.onstatechange = () => {
        console.log('[MidiInputEngine] MIDI devices changed');
      };

      return true;
    } catch (error) {
      console.error('[MidiInputEngine] ❌ Failed to initialize MIDI Access:', error);
      return false;
    }
  }

  /**
   * Obtenir la liste des devices MIDI Input disponibles
   */
  getAvailableDevices(): MidiInputDevice[] {
    if (!this.midiAccess) return [];

    const devices: MidiInputDevice[] = [];
    
    this.midiAccess.inputs.forEach((port, id) => {
      devices.push({
        id,
        name: port.name || `Input Device ${id}`,
        port
      });
    });

    return devices;
  }

  /**
   * Sélectionner un device MIDI Input
   */
  selectDevice(deviceId: string): boolean {
    if (!this.midiAccess) return false;

    // Déconnecter l'ancien device
    if (this.selectedDevice) {
      this.selectedDevice.port.onmidimessage = null;
    }

    const port = this.midiAccess.inputs.get(deviceId);
    if (!port) return false;

    this.selectedDevice = {
      id: deviceId,
      name: port.name || `Input Device ${deviceId}`,
      port
    };

    // Connecter le nouveau device
    this.selectedDevice.port.onmidimessage = (event) => {
      this.handleMidiMessage(event);
    };

    return true;
  }

  /**
   * Configurer les paramètres MIDI Input
   */
  setConfig(newConfig: Partial<MidiInputConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Démarrer l'enregistrement
   */
  startRecording(): void {
    this.recordedNotes = [];
    this.recordStartTime = performance.now();
    this.isCurrentlyRecording = true;
  }

  /**
   * Arrêter l'enregistrement
   */
  stopRecording(): RecordedNote[] {
    this.isCurrentlyRecording = false;
    return [...this.recordedNotes];
  }

  /**
   * Gérer les messages MIDI entrants
   */
  private handleMidiMessage(event: MIDIMessageEvent): void {
    if (!event.data || event.data.length < 3) return;
    const [status, note, velocity] = Array.from(event.data);
    
    // Extraire le type de message et le canal
    const messageType = status & 0xF0;
    const channel = status & 0x0F;

    // Filtrer par canal si spécifié
    if (this.config.channel !== -1 && channel !== this.config.channel) {
      return;
    }

    // Traiter NOTE ON et NOTE OFF
    if (messageType === 0x90 && velocity > 0) {
      // NOTE ON
      this.handleNoteOn(note, velocity, event.timeStamp);
    } else if (messageType === 0x80 || (messageType === 0x90 && velocity === 0)) {
      // NOTE OFF
      this.handleNoteOff(note, event.timeStamp);
    }
  }

  /**
   * Traiter une note ON
   */
  private handleNoteOn(midiNote: number, velocity: number, timestamp: number): void {
    const noteString = this.midiNumberToNote(midiNote);
    if (!noteString) return;

    // Appliquer la transposition d'octave
    const transposedNote = this.transposeNote(noteString, this.config.octaveTranspose);
    
    // Appliquer le scaling de vélocité
    const scaledVelocity = Math.min(127, Math.max(1, Math.round(velocity * this.config.velocityScale)));

    this.activeNotes.add(transposedNote);

    // Playthrough audio si activé
    if (this.config.playthroughEnabled && this.onPlaythrough) {
      this.onPlaythrough(transposedNote, scaledVelocity, true);
    }

    // Enregistrement si activé ET en cours
    if (this.config.recordEnabled && this.isCurrentlyRecording) {
      const recordedNote: RecordedNote = {
        note: transposedNote,
        velocity: scaledVelocity,
        timestamp: timestamp - this.recordStartTime
      };

      this.recordedNotes.push(recordedNote);

      if (this.onNoteRecorded) {
        this.onNoteRecorded(recordedNote);
      }
    }

  }

  /**
   * Traiter une note OFF
   */
  private handleNoteOff(midiNote: number, timestamp: number): void {
    const noteString = this.midiNumberToNote(midiNote);
    if (!noteString) return;

    const transposedNote = this.transposeNote(noteString, this.config.octaveTranspose);
    this.activeNotes.delete(transposedNote);

    // Playthrough audio si activé
    if (this.config.playthroughEnabled && this.onPlaythrough) {
      this.onPlaythrough(transposedNote, 0, false);
    }

  }

  /**
   * Convertir un numéro MIDI en note string (ex: 60 -> "C4")
   */
  private midiNumberToNote(midiNumber: number): string | null {
    if (midiNumber < 0 || midiNumber > 127) return null;

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteIndex = midiNumber % 12;

    return `${noteNames[noteIndex]}${octave}`;
  }

  /**
   * Transposer une note d'un certain nombre d'octaves
   */
  private transposeNote(note: string, octaveTranspose: number): string {
    if (octaveTranspose === 0) return note;

    const match = note.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!match) return note;

    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr) + octaveTranspose;

    // Limiter aux octaves valides (0-9)
    const clampedOctave = Math.max(0, Math.min(9, octave));
    
    return `${noteName}${clampedOctave}`;
  }

  /**
   * Convertir les notes enregistrées en NoteEvents pour le piano roll
   */
  convertToNoteEvents(stepCount: number, bpm: number = 120): NoteEvent[] {
    if (this.recordedNotes.length === 0) return [];

    // Calculer la durée d'un step en ms
    const stepDurationMs = (60000 / bpm / 4); // Assume 16th notes
    
    const noteEvents: NoteEvent[] = [];

    this.recordedNotes.forEach(recordedNote => {
      // Calculer le step basé sur le timing
      const step = Math.round(recordedNote.timestamp / stepDurationMs) % stepCount;
      
      // Extraire la note MIDI number pour la grille
      const noteMatch = recordedNote.note.match(/^([A-G][#b]?)(-?\d+)$/);
      if (!noteMatch) return;

      const [, noteName, octaveStr] = noteMatch;
      const octave = parseInt(octaveStr);
      
      // Convertir en index de grille (C1 = 0, C#1 = 1, etc.)
      const noteMap: { [key: string]: number } = {
        'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
        'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
      };
      
      if (!(noteName in noteMap)) return;
      
      const noteIndex = octave * 12 + noteMap[noteName];

      noteEvents.push({
        step,
        note: recordedNote.note, // Utilise directement la note string (ex: "C4")
        velocity: recordedNote.velocity,
        duration: 1, // Durée par défaut
        isActive: true
      });
    });

    return noteEvents;
  }

  /**
   * Définir les callbacks
   */
  setCallbacks(callbacks: {
    onNoteRecorded?: (note: RecordedNote) => void;
    onPlaythrough?: (note: string, velocity: number, isNoteOn: boolean) => void;
  }): void {
    this.onNoteRecorded = callbacks.onNoteRecorded;
    this.onPlaythrough = callbacks.onPlaythrough;
  }

  /**
   * Obtenir l'état actuel
   */
  getState(): {
    isInitialized: boolean;
    selectedDevice: MidiInputDevice | null;
    availableDevices: MidiInputDevice[];
    config: MidiInputConfig;
    activeNotesCount: number;
    recordedNotesCount: number;
    isRecording: boolean;
  } {
    return {
      isInitialized: !!this.midiAccess,
      selectedDevice: this.selectedDevice,
      availableDevices: this.getAvailableDevices(),
      config: { ...this.config },
      activeNotesCount: this.activeNotes.size,
      recordedNotesCount: this.recordedNotes.length,
      isRecording: this.isCurrentlyRecording
    };
  }

  /**
   * Panic - arrêter toutes les notes actives
   */
  panic(): void {
    this.activeNotes.clear();
  }

  /**
   * Nettoyage
   */
  dispose(): void {
    if (this.selectedDevice) {
      this.selectedDevice.port.onmidimessage = null;
    }
    this.selectedDevice = null;
    this.midiAccess = null;
    this.recordedNotes = [];
    this.activeNotes.clear();
  }
}