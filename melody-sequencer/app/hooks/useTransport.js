// Hook personnalisé pour la gestion du transport audio/MIDI et de la lecture des patterns
import { useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { getMIDIOutput } from '../lib/midiOutput';

/**
 * Hook pour gérer le transport audio et la lecture des patterns
 * @param {Object} options - Options de configuration
 * @param {Object} options.currentPreset - Preset de synthé actuel
 * @param {boolean} options.midiOutputEnabled - État de sortie MIDI
 * @param {string} options.noteLength - Longueur des notes
 * @param {number} options.tempo - Tempo en BPM
 * @returns {Object} Fonctions et références pour le transport
 */
export function useTransport({ currentPreset, midiOutputEnabled, noteLength, tempo }) {
  const synthRef = useRef(null);
  const previousMonoNote = useRef(null);
  const transportId = useRef(null);
  const currentPatternRef = useRef(null);

  // Fonction principale pour jouer un step donné
  const playStep = useCallback((stepIndex, time, currentPlayingPattern) => {
    // Mapping pour les durées de notes en fonction du noteLength
    const noteDurationMap = {
      "4n": "4n",     // Noire
      "8n": "8n",     // Croche  
      "16n": "16n",   // Double-croche (standard)
      "32n": "32n",   // Triple-croche
      "64n": "64n"    // Quadruple-croche
    };
    const noteDuration = noteDurationMap[noteLength] || "16n";
    
    // Calcul de la durée en millisecondes pour MIDI
    const durationMs = {
      "4n": (60000 / tempo),       // Durée d'une noire
      "8n": (60000 / tempo) / 2,   // Durée d'une croche
      "16n": (60000 / tempo) / 4,  // Durée standard d'une double-croche
      "32n": (60000 / tempo) / 8,  // Durée d'une triple-croche
      "64n": (60000 / tempo) / 16  // Durée d'une quadruple-croche
    }[noteLength] || (60000 / tempo) / 4;
        
    const synth = synthRef.current;
    const midiOutput = getMIDIOutput();
    
    // Mode Mono (une seule note à la fois)
    if (currentPreset.voiceMode === "mono") {
      let highestNote = null;
      let highestMidiNote = -1;
      let velocity = 100;
      let stepVal = null;
      
      Object.entries(currentPlayingPattern).forEach(([note, steps]) => {
        const val = steps[stepIndex];
        if (val && val.on) {
          const noteParts = note.match(/([A-G]#?)([0-9])/);
          if (noteParts) {
            const noteName = noteParts[1];
            const octave = parseInt(noteParts[2]);
            const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            const midiNote = (octave + 1) * 12 + noteNames.indexOf(noteName);
            
            if (midiNote > highestMidiNote) {
              highestMidiNote = midiNote;
              highestNote = note;
              velocity = val.velocity || 100;
              stepVal = val;
            }
          }
        }
      });
      
      if (highestNote) {
        if (synth && !midiOutputEnabled) {
          const hasAccent = stepVal.accent || false;
          const hasSlide = stepVal.slide || false;
          
          let adjustedVelocity = velocity;
          if (hasAccent) {
            adjustedVelocity = Math.min(127, Math.round(velocity * 1.2));
          }
          
          if (hasSlide && previousMonoNote.current) {
            synth.setNote(highestNote, time);
          } else {
            synth.triggerAttackRelease(highestNote, noteDuration, time, adjustedVelocity / 127);
          }
        }
        
        if (midiOutputEnabled) {
          const hasAccent = stepVal.accent || false;
          const hasSlide = stepVal.slide || false;
          
          let adjustedVelocity = velocity;
          if (hasAccent) {
            adjustedVelocity = Math.min(127, Math.round(velocity * 1.2));
          }
          
          if (hasAccent) {
            midiOutput.sendControlChange(16, 127);
          }
          if (hasSlide) {
            midiOutput.sendControlChange(17, 127);
          }
          
          midiOutput.playNote(highestMidiNote, adjustedVelocity, durationMs);
        }
        
        previousMonoNote.current = highestNote;
      } else {
        previousMonoNote.current = null;
      }
    } 
    // Mode Poly (plusieurs notes simultanées)
    else {
      const activeNotes = [];
      Object.entries(currentPlayingPattern).forEach(([note, steps]) => {
        const val = steps[stepIndex];
        if (val && val.on) {
          activeNotes.push({ note, stepVal: val });
        }
      });
      
      if (activeNotes.length > 0) {
        if (synth && !midiOutputEnabled) {
          activeNotes.forEach(({ note, stepVal }) => {
            const hasAccent = stepVal.accent || false;
            const velocity = stepVal.velocity || 100;
            
            let adjustedVelocity = velocity;
            if (hasAccent) {
              adjustedVelocity = Math.min(127, Math.round(velocity * 1.2));
            }
            
            synth.triggerAttackRelease(note, noteDuration, time, adjustedVelocity / 127);
          });
        }
        
        if (midiOutputEnabled) {
          activeNotes.forEach(({ note, stepVal }) => {
            const hasAccent = stepVal.accent || false;
            const hasSlide = stepVal.slide || false;
            const velocity = stepVal.velocity || 100;
            
            let adjustedVelocity = velocity;
            if (hasAccent) {
              adjustedVelocity = Math.min(127, Math.round(velocity * 1.2));
            }
            
            const noteParts = note.match(/([A-G]#?)([0-9])/);
            if (noteParts) {
              const noteName = noteParts[1];
              const octave = parseInt(noteParts[2]);
              const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
              const midiNote = (octave + 1) * 12 + noteNames.indexOf(noteName);
              
              if (hasAccent) {
                midiOutput.sendControlChange(16, 127);
              }
              if (hasSlide) {
                midiOutput.sendControlChange(17, 127);
              }
              
              midiOutput.playNote(midiNote, adjustedVelocity, durationMs);
            }
          });
        }
      }
    }
  }, [currentPreset, midiOutputEnabled, noteLength, tempo]);

  // Fonction pour démarrer le transport
  const startTransport = useCallback(async (steps, pattern, onStepChange, setIsPlaying) => {
    // Mettre à jour la référence du pattern actuel
    currentPatternRef.current = pattern;
    
    // Arrêter complètement le transport existant
    await stopTransportCleanly();
    
    let currentStepIndex = 0;
    
    const sequence = (time) => {
      Tone.Draw.schedule(() => {
        onStepChange(currentStepIndex);
      }, time);
      
      // Utiliser la référence du pattern qui sera toujours à jour
      playStep(currentStepIndex, time, currentPatternRef.current);
      
      currentStepIndex = (currentStepIndex + 1) % steps;
    };
    
    // Attendre une petite pause pour s'assurer que tout est nettoyé
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Programmer la séquence avec un timing sûr
    const startTime = Tone.now() + 0.1; // Délai plus important
    transportId.current = Tone.Transport.scheduleRepeat(sequence, noteLength, startTime);
    
    Tone.Transport.start(startTime);
    setIsPlaying(true);
  }, [playStep, noteLength, stopTransportCleanly]);
  
  // Fonction auxiliaire pour arrêter complètement le transport
  const stopTransportCleanly = useCallback(async () => {
    return new Promise((resolve) => {
      // Arrêter le transport immédiatement si actif
      if (Tone.Transport.state === "started") {
        Tone.Transport.stop();
      }
      
      // Nettoyer la séquence programmée
      if (transportId.current) {
        Tone.Transport.clear(transportId.current);
        transportId.current = null;
      }
      
      // Attendre que le transport soit complètement arrêté
      const checkStopped = () => {
        if (Tone.Transport.state === "stopped") {
          resolve();
        } else {
          setTimeout(checkStopped, 10);
        }
      };
      
      checkStopped();
    });
  }, []);

  // Fonction pour arrêter le transport
  const stopTransport = useCallback(async (setIsPlaying, setCurrentStep) => {
    // Utiliser la fonction de nettoyage complète
    await stopTransportCleanly();
    
    // Arrêter toutes les notes en cours
    if (synthRef.current) {
      if (synthRef.current.releaseAll) {
        synthRef.current.releaseAll();
      }
      if (synthRef.current.triggerRelease) {
        synthRef.current.triggerRelease();
      }
    }
    
    // Réinitialiser la note mono précédente
    previousMonoNote.current = null;
    
    setIsPlaying(false);
    setCurrentStep(-1);
    
    // Arrêter toutes les notes MIDI en cours
    if (midiOutputEnabled) {
      const midiOutput = getMIDIOutput();
      midiOutput.allNotesOff();
    }
  }, [stopTransportCleanly, midiOutputEnabled]);

  // Fonction pour créer le synthé selon le preset
  const createSynth = useCallback((preset) => {
    if (synthRef.current) {
      synthRef.current.dispose();
    }

    let newSynth;
    switch (preset.synthType) {
      case 'MonoSynth':
        newSynth = new Tone.MonoSynth(preset.options).toDestination();
        break;
      case 'PolySynth':
        newSynth = new Tone.PolySynth(Tone.MonoSynth, preset.options).toDestination();
        break;
      case 'FMSynth':
        newSynth = new Tone.FMSynth(preset.options).toDestination();
        break;
      default:
        newSynth = new Tone.MonoSynth().toDestination();
    }

    synthRef.current = newSynth;
    return newSynth;
  }, []);

  // Fonction pour nettoyer le synthé
  const disposeSynth = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
  }, []);

  // Fonction pour mettre à jour le pattern pendant la lecture
  const updatePlayingPattern = useCallback((newPattern) => {
    currentPatternRef.current = newPattern;
  }, []);

  return {
    synthRef,
    previousMonoNote,
    transportId,
    playStep,
    startTransport,
    stopTransport,
    stopTransportCleanly,
    createSynth,
    disposeSynth,
    updatePlayingPattern
  };
}