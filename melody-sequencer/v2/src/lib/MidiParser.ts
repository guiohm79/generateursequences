/**
 * Parser MIDI pour importer des fichiers .mid vers le format NoteEvent
 * Avec limitation automatique à 64 steps max
 */

import { NoteEvent } from '../types';

const MAX_STEPS = 64;

// Structure simplifiée d'un événement MIDI
interface MidiEventRaw {
  deltaTime: number;
  type: string;
  noteNumber?: number;
  velocity?: number;
  channel?: number;
}

interface MidiTrackRaw {
  events: MidiEventRaw[];
}

interface MidiFileRaw {
  tracks: MidiTrackRaw[];
  ticksPerQuarter: number;
  format: number;
}

interface MidiImportResult {
  success: boolean;
  notes: NoteEvent[];
  originalLength?: number;
  truncated?: boolean;
  stepsUsed?: number;
  totalNotes?: number;
  error?: string;
  warnings?: string[];
}

export class MidiParser {
  
  /**
   * Parse un fichier MIDI binaire et le convertit en NoteEvent[]
   */
  static async parseMidiFile(file: File): Promise<MidiImportResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const midiData = this.parseMidiBinary(arrayBuffer);
      
      if (!midiData.success || !midiData.data) {
        return {
          success: false,
          notes: [],
          error: midiData.error || 'Erreur lors du parsing MIDI'
        };
      }

      return this.convertMidiToNotes(midiData.data);
      
    } catch (error) {
      return {
        success: false,
        notes: [],
        error: `Erreur de lecture: ${error instanceof Error ? error.message : 'Inconnue'}`
      };
    }
  }

  /**
   * Parse les données binaires MIDI (format standard)
   */
  private static parseMidiBinary(buffer: ArrayBuffer): { success: boolean; data?: MidiFileRaw; error?: string } {
    try {
      const view = new DataView(buffer);
      let offset = 0;

      // Vérifier l'en-tête MIDI
      const header = String.fromCharCode(
        view.getUint8(offset), view.getUint8(offset + 1),
        view.getUint8(offset + 2), view.getUint8(offset + 3)
      );
      
      if (header !== 'MThd') {
        return { success: false, error: 'Format MIDI invalide (pas d\'en-tête MThd)' };
      }

      offset += 4;
      const headerLength = view.getUint32(offset);
      offset += 4;

      const format = view.getUint16(offset);
      offset += 2;
      const trackCount = view.getUint16(offset);
      offset += 2;
      const ticksPerQuarter = view.getUint16(offset);
      offset += 2;

      const tracks: MidiTrackRaw[] = [];

      // Parser chaque track
      for (let i = 0; i < trackCount; i++) {
        const trackResult = this.parseTrack(view, offset);
        if (trackResult.success && trackResult.track) {
          tracks.push(trackResult.track);
          offset = trackResult.nextOffset;
        } else {
          // Continuer même si une track échoue
          console.warn(`Track ${i} non parsée:`, trackResult.error);
          break;
        }
      }

      return {
        success: true,
        data: {
          format,
          ticksPerQuarter,
          tracks
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Erreur parsing binaire: ${error instanceof Error ? error.message : 'Inconnue'}`
      };
    }
  }

  /**
   * Parse une track MIDI individuelle
   */
  private static parseTrack(view: DataView, startOffset: number): {
    success: boolean;
    track?: MidiTrackRaw;
    nextOffset: number;
    error?: string;
  } {
    try {
      let offset = startOffset;

      // Vérifier l'en-tête de track
      const trackHeader = String.fromCharCode(
        view.getUint8(offset), view.getUint8(offset + 1),
        view.getUint8(offset + 2), view.getUint8(offset + 3)
      );

      if (trackHeader !== 'MTrk') {
        return {
          success: false,
          nextOffset: offset,
          error: 'En-tête de track invalide'
        };
      }

      offset += 4;
      const trackLength = view.getUint32(offset);
      offset += 4;
      const trackEndOffset = offset + trackLength;

      const events: MidiEventRaw[] = [];
      let runningStatus = 0;

      while (offset < trackEndOffset) {
        // Lire variable-length quantity (delta time)
        const deltaTimeResult = this.readVariableLength(view, offset);
        const deltaTime = deltaTimeResult.value;
        offset = deltaTimeResult.nextOffset;

        if (offset >= trackEndOffset) break;

        // Lire le statut de l'événement
        let status = view.getUint8(offset);
        
        if (status < 0x80) {
          // Running status
          status = runningStatus;
        } else {
          offset++;
          runningStatus = status;
        }

        const eventType = status & 0xF0;
        const channel = status & 0x0F;

        if (eventType === 0x90 || eventType === 0x80) {
          // Note On/Off
          if (offset + 1 >= trackEndOffset) break;
          
          const noteNumber = view.getUint8(offset);
          const velocity = view.getUint8(offset + 1);
          offset += 2;

          events.push({
            deltaTime,
            type: eventType === 0x90 && velocity > 0 ? 'noteOn' : 'noteOff',
            noteNumber,
            velocity,
            channel
          });
        } else if (eventType >= 0x80 && eventType <= 0xE0) {
          // Autres événements MIDI (2 bytes)
          offset += 2;
        } else if (eventType === 0xF0) {
          // System events
          if (status === 0xFF) {
            // Meta event
            if (offset >= trackEndOffset) break;
            const metaType = view.getUint8(offset);
            offset++;
            const lengthResult = this.readVariableLength(view, offset);
            offset = lengthResult.nextOffset + lengthResult.value;
          } else {
            // Autres system events
            offset++;
          }
        }
      }

      return {
        success: true,
        track: { events },
        nextOffset: trackEndOffset
      };

    } catch (error) {
      return {
        success: false,
        nextOffset: startOffset,
        error: `Erreur parsing track: ${error instanceof Error ? error.message : 'Inconnue'}`
      };
    }
  }

  /**
   * Lit une variable-length quantity MIDI
   */
  private static readVariableLength(view: DataView, offset: number): { value: number; nextOffset: number } {
    let value = 0;
    let currentOffset = offset;

    while (currentOffset < view.byteLength) {
      const byte = view.getUint8(currentOffset);
      value = (value << 7) | (byte & 0x7F);
      currentOffset++;

      if ((byte & 0x80) === 0) {
        break;
      }
    }

    return { value, nextOffset: currentOffset };
  }

  /**
   * Convertit les données MIDI parsées en NoteEvent[] avec limitation 64 steps
   */
  private static convertMidiToNotes(midiData: MidiFileRaw): MidiImportResult {
    const noteEvents: NoteEvent[] = [];
    const noteStates = new Map<number, { startTime: number; velocity: number }>();
    const warnings: string[] = [];
    
    let currentTime = 0;
    let maxTime = 0;
    
    // Traiter tous les événements de toutes les tracks
    const allEvents: Array<MidiEventRaw & { absoluteTime: number }> = [];
    
    for (const track of midiData.tracks) {
      let trackTime = 0;
      
      for (const event of track.events) {
        trackTime += event.deltaTime;
        allEvents.push({
          ...event,
          absoluteTime: trackTime
        });
      }
    }
    
    // Trier par temps absolu
    allEvents.sort((a, b) => a.absoluteTime - b.absoluteTime);
    
    // Convertir le temps MIDI en steps (assuming 4/4 time, 16th notes)
    const ticksPerStep = midiData.ticksPerQuarter / 4; // 16th notes
    
    for (const event of allEvents) {
      if (event.type === 'noteOn' && event.noteNumber !== undefined && event.velocity !== undefined) {
        noteStates.set(event.noteNumber, {
          startTime: event.absoluteTime,
          velocity: event.velocity
        });
      } else if (event.type === 'noteOff' && event.noteNumber !== undefined) {
        const noteState = noteStates.get(event.noteNumber);
        if (noteState) {
          const startStep = Math.floor(noteState.startTime / ticksPerStep);
          const endStep = Math.floor(event.absoluteTime / ticksPerStep);
          const duration = Math.max(1, endStep - startStep);
          
          maxTime = Math.max(maxTime, endStep);
          
          // Convertir note MIDI en nom de note
          const noteName = this.midiNoteToName(event.noteNumber);
          
          if (startStep < MAX_STEPS) {
            // Limiter la durée si nécessaire
            const limitedDuration = Math.min(duration, MAX_STEPS - startStep);
            
            noteEvents.push({
              step: startStep,
              note: noteName,
              velocity: noteState.velocity,
              isActive: true,
              duration: limitedDuration
            });
            
            if (limitedDuration < duration) {
              warnings.push(`Note ${noteName} à step ${startStep} tronquée`);
            }
          }
          
          noteStates.delete(event.noteNumber);
        }
      }
    }
    
    // Traiter les notes qui n'ont pas de noteOff
    noteStates.forEach((noteState, noteNumber) => {
      const startStep = Math.floor(noteState.startTime / ticksPerStep);
      const noteName = this.midiNoteToName(noteNumber);
      
      if (startStep < MAX_STEPS) {
        noteEvents.push({
          step: startStep,
          note: noteName,
          velocity: noteState.velocity,
          isActive: true,
          duration: 1
        });
        
        warnings.push(`Note ${noteName} à step ${startStep} sans fin définie`);
      }
    });
    
    const originalSteps = Math.ceil(maxTime);
    const truncated = originalSteps > MAX_STEPS;
    
    if (truncated) {
      warnings.push(`MIDI original: ${originalSteps} steps, limité à ${MAX_STEPS} steps`);
    }
    
    return {
      success: true,
      notes: noteEvents,
      originalLength: originalSteps,
      truncated,
      stepsUsed: Math.min(originalSteps, MAX_STEPS),
      totalNotes: noteEvents.length,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Convertit un numéro de note MIDI en nom de note
   */
  private static midiNoteToName(midiNote: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = notes[midiNote % 12];
    return `${note}${octave}`;
  }

  /**
   * Valide qu'un fichier est bien un fichier MIDI
   */
  static validateMidiFile(file: File): { valid: boolean; error?: string } {
    if (!file.name.toLowerCase().endsWith('.mid') && !file.name.toLowerCase().endsWith('.midi')) {
      return { valid: false, error: 'Le fichier doit avoir l\'extension .mid ou .midi' };
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB max
      return { valid: false, error: 'Fichier trop volumineux (max 10MB)' };
    }
    
    if (file.size < 14) { // Taille minimale d'un fichier MIDI
      return { valid: false, error: 'Fichier trop petit pour être un MIDI valide' };
    }
    
    return { valid: true };
  }
}