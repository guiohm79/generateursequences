"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import PianoRoll from "./PianoRoll";
import RandomPopup from "./RandomPopup";
import SynthPopup from "./SynthPopup";
import MIDIOutputSettings from "./MIDIOutputSettings";
import VariationPopup from "./VariationPopup";
import { SYNTH_PRESETS } from "../lib/synthPresets";
import { PresetStorage } from "../lib/presetStorage";
import { generateMusicalPattern } from "../lib/randomEngine";
import { getMIDIOutput } from "../lib/midiOutput";
import { generateVariations } from "../lib/variationEngine";
import { generateInspiration } from "../lib/inspirationEngine";

// Helpers pattern robustes
function getAllNotes(minOct, maxOct) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const all = [];
  for (let octave = minOct; octave <= maxOct; octave++) {
    notes.forEach(note => all.push(note + octave));
  }
  return all;
}

function buildPattern(pattern, steps, minOct, maxOct) {
  const allNotes = getAllNotes(minOct, maxOct);
  const next = {};
  allNotes.forEach(note => {
    let arr = Array.isArray(pattern?.[note]) ? pattern[note].slice(0, steps) : [];
    if (arr.length < steps) arr = arr.concat(Array(steps - arr.length).fill(0));
    next[note] = arr;
  });
  return next;
}

export default function MelodySequencer() {
  // États principaux
  const [tempo, setTempo] = useState(120); // BPM
  const [steps, setSteps] = useState(16); // Nombre de pas (16 ou 32)
  const [minOctave, setMinOctave] = useState(3);
  const [maxOctave, setMaxOctave] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [presetKey, setPresetKey] = useState(SYNTH_PRESETS[0].key);
  const [currentPreset, setCurrentPreset] = useState(SYNTH_PRESETS[0]); // Stocker l'objet preset complet
  const [synthPopupOpen, setSynthPopupOpen] = useState(false);
  const [randomVisible, setRandomVisible] = useState(false);
  const [randomParams, setRandomParams] = useState(null);
  const [midiSettingsOpen, setMidiSettingsOpen] = useState(false);
  const [midiOutputEnabled, setMidiOutputEnabled] = useState(false);
  const [noteLength, setNoteLength] = useState("1/32"); // Nouvelle state pour la longueur des notes (1/16, 1/32, 1/64)
  const [variationPopupOpen, setVariationPopupOpen] = useState(false);

  // Référence pour le débogage de la popup MIDI
  const midiDebugRef = useRef(null);
  
  // Gestion de l'activation/désactivation MIDI
  const handleToggleMIDI = async () => {
    try {
      const newState = !midiOutputEnabled;
      console.log("Toggle MIDI:", newState);
      
      if (newState) {
        // Initialisation du système MIDI si on l'active
        const midiOutput = getMIDIOutput();
        const success = await midiOutput.initialize();
        
        if (success) {
          console.log("MIDI initialisé avec succès");
          setMidiOutputEnabled(true);
          setMidiSettingsOpen(true); // Ouvrir automatiquement les paramètres
        } else {
          console.error("Impossible d'initialiser MIDI");
          alert("Impossible d'initialiser MIDI. Votre navigateur supporte-t-il la Web MIDI API?");
        }
      } else {
        // Désactivation MIDI
        const midiOutput = getMIDIOutput();
        midiOutput.allNotesOff(); // All notes off avant de désactiver
        setMidiOutputEnabled(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'activation/désactivation MIDI:", error);
      alert("Erreur lors de l'activation MIDI. Consultez la console pour plus d'informations.");
    }
  };

  // Pattern management blindé
  const [pattern, setPattern] = useState(() => buildPattern(null, steps, minOctave, maxOctave));
  useEffect(() => {
    setPattern(prev => buildPattern(prev, steps, minOctave, maxOctave));
    setCurrentStep(0);
  }, [steps, minOctave, maxOctave]);

  // Synthé et playback
  const synthRef = useRef(null);
  const previousMonoNote = useRef(null);
  const transportId = useRef(null);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.releaseAll && synthRef.current.releaseAll();
      synthRef.current.disconnect();
      synthRef.current = null;
    }
    const preset = currentPreset || SYNTH_PRESETS[0];
    let options = preset.options || {};
    switch (preset.synthType) {
      case "MonoSynth":
        synthRef.current = new Tone.MonoSynth(options).toDestination();
        break;
      case "FMSynth":
        synthRef.current = new Tone.PolySynth(Tone.FMSynth, options).toDestination();
        break;
      case "PolySynth":
      default:
        synthRef.current = new Tone.PolySynth(Tone.Synth, options).toDestination();
        break;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.releaseAll && synthRef.current.releaseAll();
        synthRef.current.disconnect();
        synthRef.current = null;
      }
      previousMonoNote.current = null;
    };
    // eslint-disable-next-line
  }, [presetKey]);

  // Mutations blindées
  const handleToggleStep = (note, idx) => {
    setPattern(prev => {
      const line = Array.isArray(prev[note]) ? prev[note].slice() : Array(steps).fill(0);
      // Toggle on/off (désactive si déjà on)
      line[idx] = !line[idx] || line[idx] === 0 ? { on: true, velocity: 100, accent: false, slide: false } : 0;
      return { ...prev, [note]: line };
    });
  };
  
  // Gestion des accents (active/désactive l'accent sur une note)
  const handleToggleAccent = (note, idx) => {
    setPattern(prev => {
      const line = Array.isArray(prev[note]) ? prev[note].slice() : Array(steps).fill(0);
      // On ne peut modifier l'accent que si la note est active
      if (line[idx] && line[idx].on) {
        line[idx] = { ...line[idx], accent: !line[idx].accent };
      }
      return { ...prev, [note]: line };
    });
  };
  
  // Gestion des slides (active/désactive le slide sur une note)
  const handleToggleSlide = (note, idx) => {
    setPattern(prev => {
      const line = Array.isArray(prev[note]) ? prev[note].slice() : Array(steps).fill(0);
      // On ne peut modifier le slide que si la note est active
      if (line[idx] && line[idx].on) {
        line[idx] = { ...line[idx], slide: !line[idx].slide };
      }
      return { ...prev, [note]: line };
    });
  };

  function handleChangeSteps(newSteps) {
    setSteps(newSteps);
    // pattern update via useEffect
    setCurrentStep(0);
  }
  const handleChangeVelocity = (note, idx, velocity) => {
    setPattern(prev => {
      const line = Array.isArray(prev[note]) ? prev[note].slice() : Array(steps).fill(0);
      if (line[idx] && line[idx].on) {
        line[idx] = { ...line[idx], velocity };
      }
      return { ...prev, [note]: line };
    });
  };
  // Playback via Tone.Transport - Optimisé pour réduire la latence et support MIDI output
  const playStep = useCallback((step, time) => {
    // Déterminer la durée de la note en fonction de la longueur sélectionnée
    const noteDurationMap = {
      "1/16": "16n", // Durée standard
      "1/32": "32n", // Durée plus courte
      "1/64": "64n"  // Durée très courte
    };
    const noteDuration = noteDurationMap[noteLength] || "16n";
    
    // Calcul de la durée en millisecondes pour MIDI
    const durationMs = {
      "1/16": (60000 / tempo) / 4,    // Durée standard d'une double-croche
      "1/32": (60000 / tempo) / 8,    // Moitié d'une double-croche
      "1/64": (60000 / tempo) / 16    // Quart d'une double-croche
    }[noteLength] || (60000 / tempo) / 4;
    
    const synth = synthRef.current;
    const midiOutput = getMIDIOutput();
    
    // Mode Mono (une seule note à la fois)
    if (currentPreset.voiceMode === "mono") {
      // Trouver la note la plus haute à ce pas
      let highestNote = null;
      let highestMidiNote = -1;
      let velocity = 100;
      let stepVal = null;
      
      Object.entries(pattern).forEach(([note, steps]) => {
        const val = steps[step];
        if (val && val.on) {
          // Calculer le numéro de note MIDI pour comparer la hauteur
          const noteParts = note.match(/([A-G]#?)([0-9])/);
          if (noteParts) {
            const noteName = noteParts[1];
            const octave = parseInt(noteParts[2]);
            const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            const midiNote = (octave + 1) * 12 + noteNames.indexOf(noteName);
            
            // Si c'est la note la plus haute trouvée jusqu'à présent
            if (midiNote > highestMidiNote) {
              highestMidiNote = midiNote;
              highestNote = note;
              velocity = val.velocity || 100;
              stepVal = val;
            }
          }
        }
      });
      
      // Si une note est active à ce pas
      if (highestNote) {
        // Jouer avec le synthétiseur interne
        if (synth && !midiOutputEnabled) {
          // Récupérer les propriétés accent et slide
          const hasAccent = stepVal.accent || false;
          const hasSlide = stepVal.slide || false;
          
          // Ajuster la vélocité pour l'accent (augmentation de 20%)
          let adjustedVelocity = velocity;
          if (hasAccent) {
            adjustedVelocity = Math.min(127, Math.round(velocity * 1.2));
          }
          
          // Avec slide, on utilise portamento
          if (hasSlide && previousMonoNote.current) {
            // Augmenter le temps de portamento pour le slide
            synth.portamento = 0.15; // 150ms de glissement
          } else {
            synth.portamento = 0.01; // valeur par défaut très faible
          }
          
          // Appliquer l'enveloppe attack plus courte pour l'accent
          if (hasAccent && synth.envelope) {
            const origAttack = synth.envelope.attack;
            synth.envelope.attack = Math.max(0.01, origAttack * 0.7); // Réduire l'attaque de 30%
            
            synth.triggerAttackRelease(highestNote, noteDuration, time, adjustedVelocity / 127);
            
            // Rétablir l'attaque d'origine après un court délai
            setTimeout(() => {
              synth.envelope.attack = origAttack;
            }, 50);
          } else {
            synth.triggerAttackRelease(highestNote, noteDuration, time, adjustedVelocity / 127);
          }
        }
        
        // Envoyer en MIDI si activé
        if (midiOutputEnabled && midiOutput && midiOutput.isConnected) {
          // Gérer accent et slide en temps réel pour MIDI
          const hasAccent = stepVal.accent || false;
          const hasSlide = stepVal.slide || false;
          
          // Ajuster la vélocité pour l'accent
          let adjustedVelocity = velocity;
          if (hasAccent) {
            adjustedVelocity = Math.min(127, Math.round(velocity * 1.2));
          }
          
          if (hasAccent) {
            midiOutput.sendControlChange(16, 127); // CC#16 pour accent
          }
          if (hasSlide) {
            midiOutput.sendControlChange(17, 127); // CC#17 pour slide
          }
          
          midiOutput.sendNoteOn(highestNote, adjustedVelocity);
          
          // Programmer la note off et reset des contrôleurs
          setTimeout(() => {
            if (hasAccent) {
              midiOutput.sendControlChange(16, 0); // Reset accent
            }
            if (hasSlide) {
              midiOutput.sendControlChange(17, 0); // Reset slide
            }
            midiOutput.sendNoteOff(highestNote);
          }, durationMs); // Utiliser la durée adaptée à la longueur sélectionnée
        }
        
        previousMonoNote.current = highestNote;
      } else {
        previousMonoNote.current = null;
      }
    } 
    // Mode Poly: toutes les notes sont jouées
    else {
      const activeNotes = [];
      
      // Trouver toutes les notes actives à ce pas
      Object.entries(pattern).forEach(([note, steps]) => {
        const val = steps[step];
        if (val && val.on) {
          activeNotes.push({
            note,
            velocity: val.velocity || 100,
            accent: val.accent || false,
            slide: val.slide || false
          });
        }
      });
      
      // Jouer les notes uniquement si elles existent
      if (activeNotes.length > 0) {
        activeNotes.forEach(noteData => {
          // Jouer avec Tone.js seulement si MIDI n'est pas activé
          if (synth && !midiOutputEnabled) {
            // Ajuster la vélocité pour l'accent
            let velocity = noteData.velocity / 127;
            if (noteData.accent) {
              velocity = Math.min(1, velocity * 1.2);
            }
            
            // Pour les synthés qui supportent le voice.portamento individuel par note
            if (noteData.slide && synth.get) {
              try {
                // Activer le portamento pour cette note spécifique si possible
                synth.set({ portamento: 0.15 });
                setTimeout(() => {
                  synth.set({ portamento: 0.01 }); // Revenir au réglage normal
                }, 100);
              } catch (e) {
                console.log("Portamento par voice non supporté", e);
              }
            }
            
            // Appliquer une attaque plus courte pour l'accent si possible
            if (noteData.accent && synth.set) {
              try {
                const origAttack = synth.get().attack || 0.1;
                synth.set({ attack: Math.max(0.01, origAttack * 0.7) });
                
                synth.triggerAttackRelease(noteData.note, noteDuration, time, velocity);
                
                // Rétablir l'attaque d'origine
                setTimeout(() => {
                  synth.set({ attack: origAttack });
                }, 50);
              } catch (e) {
                // Fallback si synth.set n'est pas supporté
                synth.triggerAttackRelease(noteData.note, noteDuration, time, velocity);
              }
            } else {
              synth.triggerAttackRelease(noteData.note, noteDuration, time, velocity);
            }
          }
          
          // Sortie MIDI externe
          else if (midiOutputEnabled && midiOutput && midiOutput.isConnected) {
            // Ajuster la vélocité pour l'accent
            let adjustedVelocity = noteData.velocity;
            if (noteData.accent) {
              adjustedVelocity = Math.min(127, Math.round(adjustedVelocity * 1.2));
            }
            
            // Envoyer les contrôleurs d'abord
            if (noteData.accent) {
              midiOutput.sendControlChange(16, 127); // CC#16 pour accent
            }
            if (noteData.slide) {
              midiOutput.sendControlChange(17, 127); // CC#17 pour slide
            }
            
            // Attendre un petit moment avant d'envoyer la note
            setTimeout(() => {
              midiOutput.sendNoteOn(noteData.note, adjustedVelocity);
              
              // Programmer la note off et reset des contrôleurs
              setTimeout(() => {
                if (noteData.accent) {
                  midiOutput.sendControlChange(16, 0); // Reset accent
                }
                if (noteData.slide) {
                  midiOutput.sendControlChange(17, 0); // Reset slide
                }
                midiOutput.sendNoteOff(noteData.note);
              }, durationMs); // Utiliser la durée en ms adaptée à la longueur sélectionnée
            }, 10); // Délai de 10ms entre CC et Note
          }
        });
      }
    }
  }, [pattern, currentPreset, steps, tempo, midiOutputEnabled, noteLength]);


  useEffect(() => {
    if (transportId.current) {
      Tone.Transport.clear(transportId.current);
      transportId.current = null;
    }
    if (!isPlaying) {
      Tone.Transport.stop();
      previousMonoNote.current = null;
      return;
    }
    
    // Configuration précise du transport
    Tone.Transport.bpm.value = tempo;
    Tone.Transport.cancel(); // Annuler tous les événements précédents
    
    // Initialiser currentStep à 0 au début
    setCurrentStep(0);
    let step = 0;
    
    // Jouer le premier pas immédiatement
    const scheduleFirstStep = () => {
      // Utiliser l'API précise de Tone.js avec contexte AudioContext
      const startTime = Tone.immediate();
      playStep(0, startTime);
    };
    
    // Planifier les pas suivants avec précision - toujours avec un intervalle 16n fixe
    transportId.current = Tone.Transport.scheduleRepeat((time) => {
      // Incrémenter le pas après avoir joué le pas actuel
      step = (step + 1) % steps;
      setCurrentStep(step);
      playStep(step, time);
    }, "16n"); // Toujours 16n pour la séquence de pas
    
    // Démarrer le transport avec le minimum de latence
    Tone.context.resume().then(() => {
      Tone.Transport.start();
      scheduleFirstStep();
    });
    
    return () => {
      if (transportId.current) {
        Tone.Transport.clear(transportId.current);
        transportId.current = null;
      }
      Tone.Transport.stop();
    };
    // eslint-disable-next-line
  }, [isPlaying, steps, tempo, playStep]);

  const handlePlay = async () => {
    try {
      // S'assurer que le contexte audio est démarré correctement
      await Tone.context.resume();
      await Tone.start();
      
      // Réinitialiser l'état
      setCurrentStep(0);
      
      // S'assurer que toutes les notes précédentes sont relâchées
      if (synthRef.current && synthRef.current.releaseAll) {
        synthRef.current.releaseAll();
      }
      
      // Activer la lecture
      setIsPlaying(true);
    } catch (err) {
      console.error("Erreur lors du démarrage de l'audio:", err);
    }
  };
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    if (synthRef.current && synthRef.current.releaseAll) {
      synthRef.current.releaseAll();
    }
    previousMonoNote.current = null;
    Tone.Transport.stop();
    if (transportId.current) {
      Tone.Transport.clear(transportId.current);
      transportId.current = null;
    }
    
    // Arrêter toutes les notes MIDI en cours
    if (midiOutputEnabled) {
      const midiOutput = getMIDIOutput();
      if (midiOutput) {
        midiOutput.allNotesOff();
      }
    }
  };

  // Convertir le pattern actuel en données MIDI
  const convertPatternToMidiData = () => {
    // Créer un nouvel objet MIDI - avec le PPQ par défaut (480)
    const midi = new Midi();
    const track = midi.addTrack();
    
    // Note: PPQ is read-only in @tonejs/midi, it's already set to 480 by default
    // We'll use the default PPQ value for timing calculations
    const ppq = 480;
    
    // Parcourir le pattern pour ajouter les notes
    Object.entries(pattern).forEach(([note, steps]) => {
      if (Array.isArray(steps)) {
        steps.forEach((cell, stepIndex) => {
          if (cell && cell.on) {
            // Calcul de la durée et du timing
            const startTime = stepIndex * (ppq / (steps.length / 4)); // 4 noires par mesure
            const duration = ppq / (steps.length / 4); // Durée en ticks (une double-croche par défaut)
            
            // Convertir la note en numéro MIDI
            const midiNote = Tone.Frequency(note).toMidi();
            
            // Ajouter la note au track
            track.addNote({
              midi: midiNote,
              time: startTime / 480,
              duration: duration / 480,
              velocity: (cell.velocity || 100) / 127
            });
          }
        });
      }
    });
    
    return midi.toArray();
  };
  
  // Fonction pour gérer la validation du popup de variation
  const handleVariationValidate = async (midiData, options) => {
    try {
      // Si on utilise le pattern actuel, le convertir en MIDI
      const sourceData = midiData === "current" ? convertPatternToMidiData() : midiData;
      
      // Générer les variations
      const variations = options.useInspiration
      ? [ generateInspiration(sourceData, options) ]   // mode « Inspiration »
      : generateVariations(sourceData, options);       // mode « Variations »
      
      // Si aucune variation n'a été générée
      if (!variations || variations.length === 0) {
        alert("Aucune variation n'a été générée. Veuillez vérifier vos paramètres.");
        return;
      }
      
      // Utiliser la première variation (pour l'instant)
      const variationData = variations[0];
      
      // Convertir les données MIDI en pattern pour le séquenceur
      const newMidi = new Midi(variationData);
      const newTrack = newMidi.tracks[0];
      
      // Créer un nouveau pattern vide
      const newPattern = buildPattern(null, steps, minOctave, maxOctave);
      
      // Analyser le MIDI pour détecter la résolution et la longueur
      if (newTrack && newTrack.notes && newTrack.notes.length > 0) {
        // Analyser le fichier MIDI pour déterminer la résolution réelle et la longueur
        let midiDuration = 0;
        
        // Trier les notes par temps
        const sortedNotes = [...newTrack.notes].sort((a, b) => a.time - b.time);
        
        // 1. Trouver la durée totale du MIDI et la note la plus tardive
        sortedNotes.forEach(note => {
          midiDuration = Math.max(midiDuration, note.time + note.duration);
        });
        
        // 2. Analyser la structure temporelle du MIDI pour une meilleure détection de résolution
        let timePoints = [];
        sortedNotes.forEach(note => timePoints.push(note.time));
        
        // Trier et dédupliquer les points temporels
        timePoints = [...new Set(timePoints)].sort((a, b) => a - b);
        
        // Calculer les écarts temporels entre tous les points
        const timeDiffs = [];
        for (let i = 1; i < timePoints.length; i++) {
          const diff = timePoints[i] - timePoints[i - 1];
          if (diff > 0.001) timeDiffs.push(diff); // Éviter les écarts nuls ou très petits
        }
        
        // Afficher les différences temporelles détectées pour le débogage
        console.log("Différences temporelles détectées:", timeDiffs);
        
        // 3. Trouver le plus petit commun diviseur approximatif des écarts temporels
        // pour déduire la "granularité" du MIDI
        let smallestGap = Math.min(...timeDiffs, 0.25); // Valeur par défaut si pas d'écarts détectés
        
        console.log(`Détection MIDI - Durée totale: ${midiDuration}, Plus petit écart: ${smallestGap}`);
        
        // 4. Déterminer la résolution effective pour le mapping
        // Si smallestGap est très petit, nous avons probablement un MIDI à haute résolution
        const isVeryHighResolution = smallestGap < 0.05; // ~1/64 et plus fin
        const isHighResolution = smallestGap < 0.2 && !isVeryHighResolution; // ~1/32
        
        // 5. Estimer le nombre total de pas nécessaires
        const stepsPerBeat = isVeryHighResolution ? 16 : (isHighResolution ? 8 : 4); // 16=1/64, 8=1/32, 4=1/16
        const totalBeats = midiDuration * 4; // 4 temps par mesure
        const estimatedSteps = Math.ceil(totalBeats * stepsPerBeat / 4); // Convertir en nombre de pas
        
        // Afficher un avertissement si le MIDI pourrait être tronqué
        let truncationWarning = false;
        if (estimatedSteps > steps) {
          console.log(`Le MIDI importé pourrait nécessiter ~${estimatedSteps} pas mais sera adapté à ${steps} pas`);
          truncationWarning = true;
        }

        // 6. Calculer le facteur de scaling pour préserver l'espacement relatif des notes
        // tout en rentrant dans le nombre de pas disponibles
        const scalingFactor = Math.min(steps / estimatedSteps, 1);
        
        console.log(`Résolution détectée: ${isVeryHighResolution ? 'très haute' : isHighResolution ? 'haute' : 'standard'}, Facteur d'échelle: ${scalingFactor}`);

        // 7. Ajouter les notes du MIDI au pattern avec le bon espacement
        sortedNotes.forEach(note => {
          // Convertir le numéro MIDI en note + octave
          const noteName = Tone.Frequency(note.midi, "midi").toNote();
          
          // Vérifier si la note est dans notre range d'octaves
          if (newPattern[noteName]) {
            // Calculer l'index du step en préservant l'espacement relatif
            let stepIndex;
            
            if (isVeryHighResolution) {
              // Pour MIDI à très haute résolution (1/64 ou plus fin)
              // Multiplier par un facteur plus grand pour capturer toute la précision
              stepIndex = Math.floor(note.time * 16 * scalingFactor);
            } else if (isHighResolution) {
              // Pour MIDI haute résolution (~1/32)
              stepIndex = Math.floor(note.time * 8 * scalingFactor);
            } else {
              // Pour résolution standard (1/16 ou inférieure)
              stepIndex = Math.floor(note.time * 4 * scalingFactor);
            }
            
            // Si le step est dans notre range
            if (stepIndex >= 0 && stepIndex < steps) {
              // Ajouter la note au pattern
              newPattern[noteName][stepIndex] = { 
                on: true, 
                velocity: Math.round(note.velocity * 127),
                accent: false,
                slide: false
              };
            }
          }
        });
        
        // Afficher un message d'information adapté
        if (truncationWarning) {
          setTimeout(() => {
            alert(`Le fichier MIDI importé a été adapté pour tenir dans les ${steps} pas du séquenceur. La structure rythmique a été préservée mais comprimée.`);
          }, 100);
        }
      }
      
      // Mettre à jour le pattern et fermer le popup
      setPattern(newPattern);
      setVariationPopupOpen(false);
      
    } catch (error) {
      console.error("Erreur lors de la génération des variations:", error);
      alert("Une erreur s'est produite lors de la génération des variations.");
    }
  };
  
  function exportToMidi() {
    function noteNameToMidi(note) {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      let noteName = note.slice(0, -1);
      let octave = parseInt(note.slice(-1));
      let n = notes.indexOf(noteName);
      return (octave + 1) * 12 + n;
    }
    function writeVarLen(value) {
      let buffer = [];
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
    let header = [
      0x4d, 0x54, 0x68, 0x64,
      0x00, 0x00, 0x00, 0x06,
      0x00, 0x00,
      0x00, 0x01,
      0x00, 0x60
    ];
    let track = [];
    let microsecPerBeat = Math.round(60000000 / tempo);
    track.push(0x00, 0xFF, 0x51, 0x03, (microsecPerBeat >> 16) & 0xFF, (microsecPerBeat >> 8) & 0xFF, microsecPerBeat & 0xFF);
    
    // Définition des contrôleurs MIDI pour accent et slide
    const CC_ACCENT = 16; // CC#16 pour l'accent
    const CC_SLIDE = 17;  // CC#17 pour le slide (portamento)
    
    const notesList = Object.keys(pattern);
    
    // Définir les ticks par pas selon la longueur de note sélectionnée
    const ticksPerStepMap = {
      "1/16": 24,   // Valeur standard (96 PPQ / 4 = 24 ticks par 1/16)
      "1/32": 12,   // 96 PPQ / 8 = 12 ticks par 1/32
      "1/64": 6     // 96 PPQ / 16 = 6 ticks par 1/64
    };
    const ticksPerStep = ticksPerStepMap[noteLength] || 24;
    
    // Pour chaque pas de la séquence
    for (let i = 0; i < steps; i++) {
      let delta = (i === 0) ? 0 : ticksPerStep;
      let notesOn = [];
      
      // Pour chaque note à ce pas
      notesList.forEach(note => {
        let val = pattern[note][i];
        if (val && val.on) {
          // Générer les messages Control Change pour accent et slide si activés
          if (val.accent) {
            // Accent: CC#16, valeur 127 (max)
            track.push(...writeVarLen(delta), 0xB0, CC_ACCENT, 127);
            delta = 0; // Réinitialiser delta après le premier événement
          }
          
          if (val.slide) {
            // Slide/portamento: CC#17, valeur 127 (max)
            track.push(...writeVarLen(delta), 0xB0, CC_SLIDE, 127);
            delta = 0; // Réinitialiser delta après le premier événement
          }
          
          // Note On avec vélocité
          // Si un accent est présent, augmenter la vélocité (mais ne pas dépasser 127)
          let velocity = Math.round(val.velocity || 100);
          if (val.accent) {
            // Augmenter la vélocité de 20% pour les notes accentuées, max 127
            velocity = Math.min(127, Math.round(velocity * 1.2));
          }
          
          track.push(...writeVarLen(delta), 0x90, noteNameToMidi(note), velocity);
          notesOn.push({
            note,
            hasSlide: val.slide || false,
            hasAccent: val.accent || false
          });
          delta = 0;
        }
      });
      
      // Note Off pour toutes les notes actives
      if (notesOn.length > 0) {
        notesOn.forEach(noteInfo => {
          track.push(...writeVarLen(ticksPerStep), 0x80, noteNameToMidi(noteInfo.note), 0x00);
          
          // Réinitialiser les contrôleurs après la note
          if (noteInfo.hasAccent) {
            track.push(...writeVarLen(0), 0xB0, CC_ACCENT, 0);
          }
          
          if (noteInfo.hasSlide) {
            track.push(...writeVarLen(0), 0xB0, CC_SLIDE, 0);
          }
        });
      }
    }
    track.push(0x00, 0xFF, 0x2F, 0x00);
    let trackLen = track.length;
    let trackHeader = [
      0x4d, 0x54, 0x72, 0x6b,
      (trackLen >> 24) & 0xFF, (trackLen >> 16) & 0xFF, (trackLen >> 8) & 0xFF, trackLen & 0xFF
    ];
    let midi = new Uint8Array([...header, ...trackHeader, ...track]);
    let blob = new Blob([midi], { type: 'audio/midi' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'melody-sequencer.mid';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function handleRandomValidate(params) {
    // Si le nombre de pas a changé, mettre à jour le nombre de pas du séquenceur
    if (params.steps && params.steps !== steps) {
      setSteps(params.steps);
    }
    
    // Utiliser le nombre de pas sélectionné dans le popup ou le nombre de pas actuel
    const stepsToUse = params.steps || steps;
    
    // Générer le pattern avec les paramètres sélectionnés
    // Inclut maintenant le seed si présent dans params
    setPattern(pat => buildPattern(generateMusicalPattern({
      ...params,
      steps: stepsToUse,
      octaves: { min: minOctave, max: maxOctave }
      // Le seed est passé automatiquement via ...params s'il est présent
    }), stepsToUse, minOctave, maxOctave));
    
    // Enregistrer les paramètres pour réutilisation
    setRandomParams(params);
    setRandomVisible(false);
  }

  // Fonction pour regénérer un pattern aléatoire avec les derniers paramètres utilisés
  function regenerateRandomPattern() {
    if (!randomParams) return;
    
    // Utiliser le nombre de pas des derniers paramètres ou le nombre de pas actuel
    const stepsToUse = randomParams.steps || steps;
    
    // Générer un nouveau seed aléatoire si on avait un seed, sinon on garde undefined
    const newSeed = randomParams.seed !== undefined ? Math.floor(Math.random() * 100000) : undefined;
    
    // Générer un nouveau pattern avec les mêmes paramètres que précédemment
    setPattern(pat => buildPattern(generateMusicalPattern({
      ...randomParams,
      steps: stepsToUse,
      octaves: { min: minOctave, max: maxOctave },
      seed: newSeed
    }), stepsToUse, minOctave, maxOctave));
    
    // Mettre à jour randomParams avec le nouveau seed pour les futurs appels
    if (newSeed !== undefined) {
      setRandomParams(prev => ({ ...prev, seed: newSeed }));
    }
  }

  const handleClear = () => {
    setPattern(buildPattern(null, steps, minOctave, maxOctave));
    setCurrentStep(0);
    // Arrête toute note, tout synthé, TOUT DE SUITE :
    if (synthRef.current) {
      synthRef.current.releaseAll && synthRef.current.releaseAll();
      synthRef.current.triggerRelease && synthRef.current.triggerRelease();
    }
    previousMonoNote.current = null;
    
    // Arrêter toutes les notes MIDI en cours
    if (midiOutputEnabled) {
      const midiOutput = getMIDIOutput();
      if (midiOutput) {
        midiOutput.allNotesOff();
      }
    }
  };
  
  // Gérer les paramètres MIDI
  const handleToggleMidi = () => {
    if (!midiOutputEnabled) {
      // Initialiser la sortie MIDI si ce n'est pas déjà fait
      const initMidi = async () => {
        const midiOutput = getMIDIOutput();
        try {
          const success = await midiOutput.initialize();
          setMidiOutputEnabled(success);
          if (success) {
            const ports = midiOutput.getOutputPorts();
            if (ports.length > 0) {
              setMidiSettingsOpen(true);
            }
          }
        } catch (error) {
          console.error("Erreur d'initialisation MIDI:", error);
        }
      };
      initMidi();
    } else {
      // Désactiver la sortie MIDI
      if (isPlaying) {
        const midiOutput = getMIDIOutput();
        midiOutput.allNotesOff();
      }
      setMidiOutputEnabled(false);
    }
  };

  // Fonction pour monter toutes les notes actives d'une octave
  const shiftOctaveUp = () => {
    // Récupérer toutes les notes actives avec leur position et vélocité
    const activeNotes = [];
    Object.keys(pattern).forEach(note => {
      // Pour chaque note, vérifier les steps actifs
      if (Array.isArray(pattern[note])) {
        pattern[note].forEach((cell, stepIndex) => {
          if (cell && cell.on) {
            // Décomposer la note en nom et octave (ex: "C4" => "C" et 4)
            const noteName = note.replace(/[0-9]/g, '');
            const octave = parseInt(note.replace(/[^0-9]/g, ''));
            
            // Ajouter à notre liste de notes actives
            activeNotes.push({
              originalNote: note,
              noteName,
              octave,
              stepIndex,
              velocity: cell.velocity || 100
            });
          }
        });
      }
    });
    
    // Nettoyer d'abord le pattern actuel (supprimer toutes les notes actives)
    const newPattern = {};
    Object.keys(pattern).forEach(note => {
      if (Array.isArray(pattern[note])) {
        newPattern[note] = pattern[note].map(cell => 
          cell && cell.on ? 0 : cell
        );
      } else {
        newPattern[note] = pattern[note];
      }
    });
    
    // Placer les notes à leur nouvelle position (octave supérieure)
    activeNotes.forEach(({ noteName, octave, stepIndex, velocity }) => {
      const newOctave = Math.min(9, octave + 1); // Limite supérieure à l'octave 9
      const newNote = `${noteName}${newOctave}`;
      
      // Vérifier que la nouvelle note existe dans notre pattern
      if (newPattern[newNote] && Array.isArray(newPattern[newNote])) {
        newPattern[newNote][stepIndex] = { on: true, velocity };
      }
    });
    
    // Mettre à jour le pattern
    setPattern(newPattern);
  };
  
  // Fonction pour descendre toutes les notes actives d'une octave
  const shiftOctaveDown = () => {
    // Récupérer toutes les notes actives avec leur position et vélocité
    const activeNotes = [];
    Object.keys(pattern).forEach(note => {
      // Pour chaque note, vérifier les steps actifs
      if (Array.isArray(pattern[note])) {
        pattern[note].forEach((cell, stepIndex) => {
          if (cell && cell.on) {
            // Décomposer la note en nom et octave (ex: "C4" => "C" et 4)
            const noteName = note.replace(/[0-9]/g, '');
            const octave = parseInt(note.replace(/[^0-9]/g, ''));
            
            // Ajouter à notre liste de notes actives
            activeNotes.push({
              originalNote: note,
              noteName,
              octave,
              stepIndex,
              velocity: cell.velocity || 100
            });
          }
        });
      }
    });
    
    // Nettoyer d'abord le pattern actuel (supprimer toutes les notes actives)
    const newPattern = {};
    Object.keys(pattern).forEach(note => {
      if (Array.isArray(pattern[note])) {
        newPattern[note] = pattern[note].map(cell => 
          cell && cell.on ? 0 : cell
        );
      } else {
        newPattern[note] = pattern[note];
      }
    });
    
    // Placer les notes à leur nouvelle position (octave inférieure)
    activeNotes.forEach(({ noteName, octave, stepIndex, velocity }) => {
      const newOctave = Math.max(0, octave - 1); // Limite inférieure à l'octave 0
      const newNote = `${noteName}${newOctave}`;
      
      // Vérifier que la nouvelle note existe dans notre pattern
      if (newPattern[newNote] && Array.isArray(newPattern[newNote])) {
        newPattern[newNote][stepIndex] = { on: true, velocity };
      }
    });
    
    // Mettre à jour le pattern
    setPattern(newPattern);
  };


  return (
    
    <div className="sequencer">
      <div className="app-title"
      style={{
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: 1,
        margin: "14px 0 12px 0",
        color: "#00eaff",
        textShadow: "0 2px 18px #00eaff66"
          }}>
          MELODY SEQUENCER PRO
        </div>

      {/* ... HEADER, CONTROLS, etc ... */}
      <div className="controls-section">
        <div className="transport-controls">
          <button className="btn" id="playBtn" onClick={handlePlay} disabled={isPlaying}>Play</button>
          <button className="btn" id="stopBtn" onClick={handleStop} disabled={!isPlaying}>Stop</button>
          <button className="btn" id="clearBtn" onClick={handleClear}>Clear</button>
          <button className="btn" id="randomBtn" onClick={() => setRandomVisible(true)}>Random</button>
          <button 
            className="btn" 
            id="randomAgainBtn" 
            onClick={regenerateRandomPattern} 
            disabled={!randomParams}
            title="Régénérer un pattern aléatoire avec les mêmes paramètres"
            style={{ 
              backgroundColor: randomParams ? '#ff9500' : '', 
              color: randomParams ? '#000' : '' 
            }}
          >
            Random Again
          </button>
          <button
            className="btn"
            id="exportMidiBtn"
            onClick={exportToMidi}
            disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
            title="Exporter la séquence en fichier MIDI"
          >Export MIDI</button>

          <button
            className="btn"
            id="variationBtn"
            onClick={() => setVariationPopupOpen(true)}
            //disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
            style={{
              backgroundColor: '#ff00ea',
              color: '#000'
            }}
          >
            Modification séquence
          </button>

          <button
            className={`btn ${midiOutputEnabled ? 'btn-active' : ''}`}
            id="midiBtn"
            onClick={handleToggleMidi}
            title="Activer/désactiver la sortie MIDI vers un VSTi externe"
            style={{ 
              backgroundColor: midiOutputEnabled ? '#0c9' : '', 
              color: midiOutputEnabled ? '#000' : ''
            }}
          >
            {midiOutputEnabled ? 'MIDI ON' : 'MIDI OFF'}
          </button>

          {/* Sélecteur de longueur de note */}
          <div style={{ display: "inline-block", marginLeft: "10px" }}>
            <label style={{
              color: "#ccc",
              fontSize: "12px",
              marginRight: "5px",
              display: "block",
              textAlign: "center"
            }}>Longueur note</label>
            <select 
              value={noteLength}
              onChange={(e) => setNoteLength(e.target.value)}
              className="note-length-selector"
              style={{
                padding: "5px",
                backgroundColor: "#222",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
              title="Sélectionner la durée de maintien des notes (gate time)"
            >
              <option value="1/16">1/16</option>
              <option value="1/32">1/32</option>
              <option value="1/64">1/64</option>
            </select>
          </div>
          
          {/* Boutons pour décaler les octaves */}
          <div style={{ display: "flex", gap: "5px", marginLeft: "10px" }}>
            <button 
              className="btn" 
              onClick={shiftOctaveDown}
              title="Décaler toutes les notes actives d'une octave vers le bas"
              disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
              style={{ minWidth: "40px", padding: "0 8px" }}
            >
              <span style={{ fontSize: "16px" }}>↓ Oct</span>
            </button>
            <button 
              className="btn" 
              onClick={shiftOctaveUp}
              title="Décaler toutes les notes actives d'une octave vers le haut"
              disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
              style={{ minWidth: "40px", padding: "0 8px" }}
            >
              <span style={{ fontSize: "16px" }}>↑ Oct</span>
            </button>
          </div>
          <div className="steps-control">

</div>

        </div>
        
        {/* Contrôles principaux */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", margin: "10px 0" }}>
          {/* Contrôle du tempo */}
          <div className="control-group">
            <span className="control-label">Tempo</span>
            <input 
              type="number" 
              className="input-field"
              style={{ width: "60px", textAlign: "center" }}
              min="60"
              max="240"
              value={tempo}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 60 && value <= 240) {
                  setTempo(value);
                  if (isPlaying) {
                    // Mise à jour du tempo en temps réel
                    Tone.Transport.bpm.value = value;
                  }
                }
              }}
            />
            <span style={{ marginLeft: "5px", fontSize: "0.9rem", color: "#8af" }}>BPM</span>
            <div style={{ display: "flex", marginTop: "5px" }}>
              <input
                type="range"
                min="60"
                max="240"
                step="1"
                value={tempo}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setTempo(value);
                  if (isPlaying) {
                    // Mise à jour du tempo en temps réel
                    Tone.Transport.bpm.value = value;
                  }
                }}
                style={{ width: "120px" }}
              />
            </div>
          </div>
          
          {/* Contrôle du son */}
          <div className="control-group">
            <span className="control-label">Son</span>
            <button
              className="btn"
              style={{ minWidth: 80 }}
              onClick={() => setSynthPopupOpen(true)}
              disabled={isPlaying}
            >
              Éditer son
            </button>
            <button
              className="btn"
              style={{ marginLeft: 10, minWidth: 80, backgroundColor: midiOutputEnabled ? '#0c9' : '#999', color: '#000' }}
              onClick={() => {
                console.log('Ouverture des paramètres MIDI');
                setMidiSettingsOpen(true);
              }}
              disabled={!midiOutputEnabled}
            >
              Config MIDI
            </button>
          </div>
          
          {/* Contrôle des octaves */}
          <div className="control-group">
            <span className="control-label">PLAGE D'OCTAVES</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button 
                  className="btn" 
                  onClick={() => {
                    if (minOctave > 0) {
                      setMinOctave(minOctave - 1);
                    }
                  }}
                  style={{ 
                    width: "30px", 
                    height: "30px", 
                    padding: "0", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "16px",
                    marginRight: "5px"
                  }}
                  disabled={minOctave <= 0}
                >
                  -
                </button>
                <div 
                  style={{ 
                    width: "30px", 
                    height: "30px", 
                    backgroundColor: "#00D4FF", 
                    color: "#000000", 
                    borderRadius: "8px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "bold"
                  }}
                >
                  {minOctave}
                </div>
                <button 
                  className="btn" 
                  onClick={() => {
                    if (minOctave < maxOctave - 1) {
                      setMinOctave(minOctave + 1);
                    }
                  }}
                  style={{ 
                    width: "30px", 
                    height: "30px", 
                    padding: "0", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "16px",
                    marginLeft: "5px"
                  }}
                  disabled={minOctave >= maxOctave - 1}
                >
                  +
                </button>
              </div>
              
              <span style={{ margin: "0 5px" }}>à</span>
              
              <div style={{ display: "flex", alignItems: "center" }}>
                <button 
                  className="btn" 
                  onClick={() => {
                    if (maxOctave > minOctave + 1) {
                      setMaxOctave(maxOctave - 1);
                    }
                  }}
                  style={{ 
                    width: "30px", 
                    height: "30px", 
                    padding: "0", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "16px",
                    marginRight: "5px"
                  }}
                  disabled={maxOctave <= minOctave + 1}
                >
                  -
                </button>
                <div 
                  style={{ 
                    width: "30px", 
                    height: "30px", 
                    backgroundColor: "#00D4FF", 
                    color: "#000000", 
                    borderRadius: "8px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "bold"
                  }}
                >
                  {maxOctave}
                </div>
                <button 
                  className="btn" 
                  onClick={() => {
                    if (maxOctave < 8) {
                      setMaxOctave(maxOctave + 1);
                    }
                  }}
                  style={{ 
                    width: "30px", 
                    height: "30px", 
                    padding: "0", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "16px",
                    marginLeft: "5px"
                  }}
                  disabled={maxOctave >= 8}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Piano Roll avec grille de notes améliorée */}
      <PianoRoll
        minOctave={minOctave}
        maxOctave={maxOctave}
        steps={steps}
        pattern={pattern}
        currentStep={isPlaying ? currentStep : null}
        onToggleStep={handleToggleStep}
        onChangeVelocity={handleChangeVelocity}
        onChangeSteps={handleChangeSteps}
        onToggleAccent={handleToggleAccent}
        onToggleSlide={handleToggleSlide}
        showVelocityValues={false} /* Désactiver l'affichage des valeurs numériques (00) */
      />
      <RandomPopup
        visible={randomVisible}
        onValidate={handleRandomValidate}
        onCancel={() => setRandomVisible(false)}
        defaultParams={{
          ...randomParams,
          octaves: { min: minOctave, max: maxOctave }
        }}
      />
      <SynthPopup
        visible={synthPopupOpen}
        current={presetKey}
        onSelect={preset => {
          // Si on reçoit un objet preset complet
          if (typeof preset === 'object' && preset !== null) {
            console.log('Reçu preset complet:', preset);
            setPresetKey(preset.key); // Garder la clé pour compatibilité
            setCurrentPreset(preset); // Stocker l'objet preset complet
          } 
          // Si on reçoit juste une clé (ancien comportement)
          else if (typeof preset === 'string') {
            console.log('Reçu preset key:', preset);
            setPresetKey(preset);
            // Rechercher parmi tous les presets (par défaut + personnalisés)
            const allPresets = PresetStorage.getAllPresets();
            const foundPreset = allPresets.find(p => p.key === preset);
            if (foundPreset) setCurrentPreset(foundPreset);
          }
          setSynthPopupOpen(false);
        }}
        onCancel={() => setSynthPopupOpen(false)}
      />
      {midiSettingsOpen && (
        <div className="popup-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <MIDIOutputSettings
            onClose={() => setMidiSettingsOpen(false)}
          />
        </div>
      )}
      <VariationPopup
        visible={variationPopupOpen}
        onValidate={handleVariationValidate}
        onCancel={() => setVariationPopupOpen(false)}
        currentPattern={pattern} // Passer le vrai pattern actuel au lieu de "current"
        octaves={{ min: minOctave, max: maxOctave }}
      />
    </div>
  );
}
