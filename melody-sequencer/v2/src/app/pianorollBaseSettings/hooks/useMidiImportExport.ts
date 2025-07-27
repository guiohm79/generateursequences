/**
 * Hook pour gérer l'import/export MIDI du Piano Roll
 */

'use client';

import { useCallback } from 'react';
import { midiEngine, MidiNote } from '../../../lib/MidiEngine';
import { MidiParser } from '../../../lib/MidiParser';
import { NoteEvent } from '../types';
import { ALL_NOTES } from '../utils/constants';

export function useMidiImportExport() {
  
  // Exporter le pattern vers MIDI
  const exportToMidi = useCallback((
    pattern: NoteEvent[], 
    steps: number, 
    bpm: number = 120
  ): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      try {
        // Convertir le pattern en format MIDI
        const midiNotes: MidiNote[] = pattern
          .filter(note => note.isActive)
          .map(note => ({
            step: note.step,
            note: note.note,
            velocity: note.velocity,
            duration: note.duration,
            isActive: true
          }));

        // Exporter via le MidiEngine
        const result = midiEngine.exportToMidi(midiNotes, { tempo: bpm });
        
        if (result.success && result.data && result.filename) {
          // Télécharger le fichier
          const blob = new Blob([result.data], { type: 'audio/midi' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = result.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          resolve({
            success: true,
            message: `✅ MIDI exporté avec succès! (${midiNotes.length} notes, ${bpm} BPM)`
          });
        } else {
          resolve({
            success: false,
            message: `❌ Erreur lors de l'export MIDI: ${result.error || 'Erreur inconnue'}`
          });
        }
      } catch (error) {
        console.error('Erreur preparation export MIDI:', error);
        resolve({
          success: false,
          message: `❌ Erreur lors de la préparation de l'export: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    });
  }, []);

  // Importer un fichier MIDI
  const importFromMidi = useCallback((
    file: File, 
    maxSteps: number = 64
  ): Promise<{ success: boolean; pattern?: NoteEvent[]; message: string }> => {
    return new Promise((resolve) => {
      try {
        MidiParser.parseMidiFile(file)
          .then(result => {
            if (!result.success) {
              resolve({
                success: false,
                message: `❌ ${result.error || 'Erreur lors de l\'analyse du fichier MIDI'}`
              });
              return;
            }

            if (!result.notes || result.notes.length === 0) {
              resolve({
                success: false,
                message: '❌ Aucune note trouvée dans le fichier MIDI'
              });
              return;
            }

            // Les notes sont déjà au format NoteEvent, on les utilise directement
            const importedPattern = result.notes;
            
            // Filtrer les notes qui dépassent maxSteps si nécessaire 
            const filteredPattern = importedPattern.filter(note => note.step < maxSteps);
            const notesSkipped = importedPattern.length - filteredPattern.length;

            const message = notesSkipped > 0 
              ? `✅ MIDI importé: ${filteredPattern.length} notes (${notesSkipped} notes ignorées - hors limites ${maxSteps} steps)`
              : `✅ MIDI importé avec succès: ${filteredPattern.length} notes`;

            resolve({
              success: true,
              pattern: filteredPattern,
              message
            });
          })
          .catch(error => {
            console.error('Erreur parsing MIDI:', error);
            resolve({
              success: false,
              message: `❌ Erreur lors de l'analyse du fichier MIDI: ${error instanceof Error ? error.message : String(error)}`
            });
          });
      } catch (error) {
        console.error('Erreur import MIDI:', error);
        resolve({
          success: false,
          message: `❌ Erreur lors de l'import MIDI: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    });
  }, []);

  // Analyser un fichier MIDI sans l'importer
  const analyzeMidiFile = useCallback((file: File): Promise<{
    success: boolean;
    info?: {
      duration: number;
      noteCount: number;
      tracks: number;
      format: number;
      ticksPerQuarter: number;
    };
    message: string;
  }> => {
    return new Promise((resolve) => {
      try {
        MidiParser.parseMidiFile(file)
          .then(result => {
            if (!result.success) {
              resolve({
                success: false,
                message: `❌ ${result.error || 'Erreur lors de l\'analyse du fichier MIDI'}`
              });
              return;
            }

            resolve({
              success: true,
              info: {
                duration: 0, // MidiParser ne retourne pas cette info
                noteCount: result.notes?.length || 0,
                tracks: 1, // MidiParser simplifié
                format: 1, // Format par défaut
                ticksPerQuarter: 480 // Valeur par défaut
              },
              message: '✅ Analyse MIDI terminée'
            });
          })
          .catch(error => {
            resolve({
              success: false,
              message: `❌ Erreur analyse MIDI: ${error instanceof Error ? error.message : String(error)}`
            });
          });
      } catch (error) {
        resolve({
          success: false,
          message: `❌ Erreur: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    });
  }, []);

  return {
    exportToMidi,
    importFromMidi,
    analyzeMidiFile
  };
}