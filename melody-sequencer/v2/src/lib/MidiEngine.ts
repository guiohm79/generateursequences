/**
 * MidiEngine - Module réutilisable pour l'export/import MIDI
 * Architecture modulaire pour être utilisé par différentes fonctionnalités
 */

import MidiWriter from 'midi-writer-js';

// Interface pour une note avec toutes les propriétés nécessaires
export interface MidiNote {
  step: number;
  note: string;          // Format: "C4", "D#5", etc.
  velocity: number;      // 0-127
  duration: number;      // Durée en steps
  isActive: boolean;
}

// Configuration MIDI par défaut
export interface MidiConfig {
  ticksPerQuarter: number;
  tempo: number;
  timeSignature: [number, number];
  stepsPerBeat: number;  // Combien de steps = 1 beat (généralement 4 pour 16th notes)
}

// Résultat d'un export MIDI
export interface MidiExportResult {
  success: boolean;
  data?: Uint8Array;
  filename?: string;
  error?: string;
}

// Résultat d'un import MIDI
export interface MidiImportResult {
  success: boolean;
  notes?: MidiNote[];
  config?: Partial<MidiConfig>;
  error?: string;
}

export class MidiEngine {
  private defaultConfig: MidiConfig = {
    ticksPerQuarter: 480,
    tempo: 120,
    timeSignature: [4, 4],
    stepsPerBeat: 4  // 16th notes
  };

  /**
   * Exporter un pattern de notes vers MIDI (basé sur l'approche V1 qui fonctionnait)
   */
  exportToMidi(
    notes: MidiNote[],
    config: Partial<MidiConfig> = {}
  ): MidiExportResult {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      // Filtrer seulement les notes actives
      const activeNotes = notes.filter(note => note.isActive);
      
      if (activeNotes.length === 0) {
        return {
          success: false,
          error: 'Aucune note active à exporter'
        };
      }

      // Utiliser l'approche V1 : construction MIDI manuelle avec delta times
      const midiData = this.buildMidiDataV1Style(activeNotes, finalConfig);
      
      // Générer un nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `melody-pattern-${timestamp}.mid`;

      return {
        success: true,
        data: new Uint8Array(midiData),
        filename
      };

    } catch (error) {
      console.error('[MidiEngine] Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'export';
      console.error('[MidiEngine] Stack trace:', error instanceof Error ? error.stack : 'No stack');
      return {
        success: false,
        error: `Export MIDI échoué: ${errorMessage}`
      };
    }
  }

  /**
   * Importer un fichier MIDI (pour future implémentation)
   */
  async importFromMidi(midiData: ArrayBuffer): Promise<MidiImportResult> {
    try {
      // TODO: Implémenter l'import MIDI
      // Pour l'instant, retourner une erreur explicite
      return {
        success: false,
        error: 'Import MIDI pas encore implémenté - sera ajouté dans une prochaine version'
      };
    } catch (error) {
      console.error('[MidiEngine] Import failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'import'
      };
    }
  }

  /**
   * Télécharger le fichier MIDI généré
   */
  downloadMidiFile(exportResult: MidiExportResult): void {
    if (!exportResult.success || !exportResult.data || !exportResult.filename) {
      throw new Error('Données MIDI invalides pour le téléchargement');
    }

    try {
      // Créer un blob avec les données MIDI
      const blob = new Blob([exportResult.data], { type: 'audio/midi' });
      
      // Créer un lien de téléchargement temporaire
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportResult.filename;
      
      // Déclencher le téléchargement
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[MidiEngine] ✅ Fichier téléchargé:', exportResult.filename);
      
    } catch (error) {
      console.error('[MidiEngine] Erreur de téléchargement:', error);
      throw new Error('Impossible de télécharger le fichier MIDI');
    }
  }


  /**
   * Construction MIDI manuelle basée sur l'approche V1 qui fonctionnait
   */
  private buildMidiDataV1Style(notes: MidiNote[], config: MidiConfig): number[] {
    const ppq = config.ticksPerQuarter;
    
    // Header MIDI
    const header = [
      0x4d, 0x54, 0x68, 0x64,
      0x00, 0x00, 0x00, 0x06,
      0x00, 0x00,
      0x00, 0x01,
      (ppq >> 8) & 0xFF, ppq & 0xFF
    ];
    
    let track: number[] = [];
    
    // Tempo
    const microsecPerBeat = Math.round(60000000 / config.tempo);
    track.push(0x00, 0xFF, 0x51, 0x03, 
      (microsecPerBeat >> 16) & 0xFF, 
      (microsecPerBeat >> 8) & 0xFF, 
      microsecPerBeat & 0xFF
    );
    
    // Calculer l'espacement temporel pour les steps
    const ticksPerStep = ppq / config.stepsPerBeat; // 16th notes
    
    // Collecter tous les événements MIDI
    const midiEvents: Array<{
      time: number;
      type: 'noteOn' | 'noteOff';
      note: number;
      velocity: number;
    }> = [];
    
    // Générer les événements pour chaque note
    notes.forEach(note => {
      const midiNote = this.noteNameToMidi(note.note);
      const velocity = Math.max(1, Math.min(127, Math.round(note.velocity)));
      const startTime = note.step * ticksPerStep;
      const endTime = startTime + (note.duration * ticksPerStep); // Durée exacte selon les steps définis
      
      // Note On
      midiEvents.push({
        time: startTime,
        type: 'noteOn',
        note: midiNote,
        velocity: velocity
      });
      
      // Note Off
      midiEvents.push({
        time: endTime,
        type: 'noteOff',
        note: midiNote,
        velocity: 0
      });
    });
    
    // Trier les événements par temps
    midiEvents.sort((a, b) => a.time - b.time);
    
    // Convertir en données MIDI avec delta times
    let currentTime = 0;
    
    midiEvents.forEach(event => {
      const deltaTime = Math.round(event.time - currentTime);
      currentTime = event.time;
      
      if (event.type === 'noteOn') {
        track.push(...this.writeVarLen(deltaTime), 0x90, event.note, event.velocity);
      } else if (event.type === 'noteOff') {
        track.push(...this.writeVarLen(deltaTime), 0x80, event.note, 0);
      }
    });
    
    // End of track
    track.push(0x00, 0xFF, 0x2F, 0x00);
    
    // Calculer la longueur du track
    const trackLen = track.length;
    const trackHeader = [
      0x4d, 0x54, 0x72, 0x6b,
      (trackLen >> 24) & 0xFF, 
      (trackLen >> 16) & 0xFF, 
      (trackLen >> 8) & 0xFF, 
      trackLen & 0xFF
    ];
    
    // Assemblage final
    return [...header, ...trackHeader, ...track];
  }

  /**
   * Encode une valeur en longueur variable MIDI (basé sur V1)
   */
  private writeVarLen(value: number): number[] {
    const buffer: number[] = [];
    let bufferVal = value & 0x7F;
    while ((value >>= 7)) {
      bufferVal <<= 8;
      bufferVal |= ((value & 0x7F) | 0x80);
    }
    while (true) {
      buffer.push(bufferVal & 0xFF);
      if (bufferVal & 0x80) bufferVal >>= 8;
      else break;
    }
    return buffer;
  }

  /**
   * Convertit un nom de note en numéro MIDI (basé sur V1)
   */
  private noteNameToMidi(note: string): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = note.slice(0, -1);
    const octave = parseInt(note.slice(-1));
    const noteIndex = notes.indexOf(noteName);
    return (octave + 1) * 12 + noteIndex;
  }

  /**
   * Valider une structure de notes avant export
   */
  validateNotes(notes: MidiNote[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    notes.forEach((note, index) => {
      // Vérifier le format de la note
      if (!note.note || !note.note.match(/^[A-G]#?[0-9]$/)) {
        errors.push(`Note ${index}: Format de note invalide "${note.note}"`);
      }
      
      // Vérifier la vélocité
      if (note.velocity < 0 || note.velocity > 127) {
        errors.push(`Note ${index}: Vélocité hors limites (${note.velocity})`);
      }
      
      // Vérifier la durée
      if (note.duration < 1) {
        errors.push(`Note ${index}: Durée invalide (${note.duration})`);
      }
      
      // Vérifier le step
      if (note.step < 0) {
        errors.push(`Note ${index}: Position step invalide (${note.step})`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtenir des informations sur un export MIDI
   */
  getMidiInfo(notes: MidiNote[], config: Partial<MidiConfig> = {}): {
    totalNotes: number;
    activeNotes: number;
    duration: number; // en steps
    tempo: number;
  } {
    const finalConfig = { ...this.defaultConfig, ...config };
    const activeNotes = notes.filter(note => note.isActive);
    
    // Calculer la durée totale en trouvant la note qui finit le plus tard
    const maxEndStep = Math.max(
      0,
      ...activeNotes.map(note => note.step + note.duration)
    );

    return {
      totalNotes: notes.length,
      activeNotes: activeNotes.length,
      duration: maxEndStep,
      tempo: finalConfig.tempo
    };
  }
}

// Export d'une instance singleton pour simplicité d'usage
export const midiEngine = new MidiEngine();