"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import PianoRoll from "./PianoRoll";
import RandomPopup from "./RandomPopup";
import SynthPopup from "./SynthPopup";
import MIDIOutputSettings from "./MIDIOutputSettings";
import VariationPopup from "./VariationPopup";
import FavoritesPopup from "./FavoritesPopup";
import ScalesManagerPopup from "./ScalesManagerPopup";
import { SYNTH_PRESETS } from "../lib/synthPresets";
import { PresetStorage } from "../lib/presetStorage";
import { generateMusicalPattern, refreshScales, generateAmbiancePattern, applyHappyAccidents, morphPatterns } from "../lib/randomEngine";
import { getMIDIOutput } from "../lib/midiOutput";
import { generateVariations } from "../lib/variationEngine";
import { generateInspiration } from "../lib/inspirationEngine";
import { FavoritesStorage } from "../lib/favoritesStorage";
import { ScalesStorage } from "../lib/scalesStorage";

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
  const [minOctave, setMinOctave] = useState(2);
  const [maxOctave, setMaxOctave] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [presetKey, setPresetKey] = useState(SYNTH_PRESETS[0].key);
  const [currentPreset, setCurrentPreset] = useState(SYNTH_PRESETS[0]); // Stocker l'objet preset complet
  const [synthPopupOpen, setSynthPopupOpen] = useState(false);
  const [randomVisible, setRandomVisible] = useState(false);
  const [randomParams, setRandomParams] = useState(null);
  const [midiSettingsOpen, setMidiSettingsOpen] = useState(false);
  const [midiOutputEnabled, setMidiOutputEnabled] = useState(false);
  const [noteLength, setNoteLength] = useState("16n"); // Nouvelle state pour la longueur des notes (1/16, 1/32, 1/64)
  const [variationPopupOpen, setVariationPopupOpen] = useState(false);
  const [favoritesPopupOpen, setFavoritesPopupOpen] = useState(false);
  const [scalesManagerOpen, setScalesManagerOpen] = useState(false);
  const [scalesUpdateTrigger, setScalesUpdateTrigger] = useState(0);

  // États pour le morphing temps réel
  const [morphingEnabled, setMorphingEnabled] = useState(false);
  const [targetPattern, setTargetPattern] = useState(null);
  const [morphAmount, setMorphAmount] = useState(0); // 0 = pattern original, 1 = pattern cible
  const [morphedPattern, setMorphedPattern] = useState(null);

  // Historique des patterns pour le bouton retour arrière
  const [patternHistory, setPatternHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Référence pour le débogage de la popup MIDI
  const midiDebugRef = useRef(null);
  
  // Gestion de l'activation/désactivation MIDI
  const handleToggleMIDI = async () => {
    try {
      const newState = !midiOutputEnabled;

      
      if (newState) {
        // Initialisation du système MIDI si on l'active
        const midiOutput = getMIDIOutput();
        const success = await midiOutput.initialize();
        
        if (success) {

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

  // Fonction pour sauvegarder le pattern actuel dans l'historique
  const saveToHistory = (newPattern) => {
    setPatternHistory(prev => {
      const newHistory = [...prev];
      // Supprimer les éléments après l'index actuel si on n'est pas à la fin
      if (historyIndex >= 0 && historyIndex < newHistory.length - 1) {
        newHistory.splice(historyIndex + 1);
      }
      // Ajouter le nouveau pattern
      newHistory.push(JSON.parse(JSON.stringify(newPattern)));
      // Limiter l'historique à 50 éléments
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };

  // Fonction pour revenir en arrière dans l'historique
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPattern(JSON.parse(JSON.stringify(patternHistory[newIndex])));
    }
  };

  // Fonction pour aller vers l'avant dans l'historique
  const handleRedo = () => {
    if (historyIndex < patternHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPattern(JSON.parse(JSON.stringify(patternHistory[newIndex])));
    }
  };

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
      const newPattern = { ...prev, [note]: line };
      // Sauvegarder dans l'historique
      saveToHistory(newPattern);
      return newPattern;
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

  // Récupérer le pattern à jouer (morphé ou original)
  const currentPlayingPattern = morphedPattern || pattern;

 // Fonction playStep définie avec useCallback
  const playStep = useCallback((stepIndex, time) => {
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
            synth.portamento = 0.15;
          } else {
            synth.portamento = 0.01;
          }
          
          synth.triggerAttackRelease(highestNote, noteDuration, time, adjustedVelocity / 127);
        }
        
        if (midiOutputEnabled && midiOutput && midiOutput.isConnected) {
                  const hasAccent = stepVal.accent || false;
                  const hasSlide = stepVal.slide || false;
                  
                  let adjustedVelocity = velocity;
                  if (hasAccent) {
                    adjustedVelocity = Math.min(127, Math.round(velocity * 1.2));
                  }
                  
                  // Envoyer les Control Changes avant la note (sans délai)
                  if (hasAccent) {
                    midiOutput.sendControlChange(16, 127);
                  }
                  if (hasSlide) {
                    midiOutput.sendControlChange(17, 127);
                  }
                  
                  // Envoyer la note immédiatement
                  midiOutput.sendNoteOn(highestNote, adjustedVelocity);
                  
                  // Programmer le Note Off avec une durée plus courte et optimisée
                  const optimizedDuration = Math.max(50, Math.min(durationMs * 0.8, 200)); // Entre 50ms et 200ms max
                  
                  setTimeout(() => {
                    midiOutput.sendNoteOff(highestNote);
                    // Reset des contrôleurs après la note off
                    if (hasAccent) {
                      midiOutput.sendControlChange(16, 0);
                    }
                    if (hasSlide) {
                      midiOutput.sendControlChange(17, 0);
                    }
                  }, optimizedDuration);
                }

        previousMonoNote.current = highestNote;
      } else {
        previousMonoNote.current = null;
      }
    } else {
      // Mode Poly
      const activeNotes = [];
      
      Object.entries(currentPlayingPattern).forEach(([note, steps]) => {
        const val = steps[stepIndex];
        if (val && val.on) {
          activeNotes.push({
            note,
            velocity: val.velocity || 100,
            accent: val.accent || false,
            slide: val.slide || false
          });
        }
      });
      
      if (activeNotes.length > 0) {
        activeNotes.forEach(noteData => {
          if (synth && !midiOutputEnabled) {
            let velocity = noteData.velocity / 127;
            if (noteData.accent) {
              velocity = Math.min(1, velocity * 1.2);
            }
            synth.triggerAttackRelease(noteData.note, noteDuration, time, velocity);
          }
          

      else if (midiOutputEnabled && midiOutput && midiOutput.isConnected) {
                  let adjustedVelocity = noteData.velocity;
                  if (noteData.accent) {
                    adjustedVelocity = Math.min(127, Math.round(adjustedVelocity * 1.2));
                  }
                  
                  // Envoyer les Control Changes et la note immédiatement
                  if (noteData.accent) {
                    midiOutput.sendControlChange(16, 127);
                  }
                  if (noteData.slide) {
                    midiOutput.sendControlChange(17, 127);
                  }
                  
                  midiOutput.sendNoteOn(noteData.note, adjustedVelocity);
                  
                  // Durée optimisée pour réduire la latence
                  const optimizedDuration = Math.max(50, Math.min(durationMs * 0.8, 200));
                  
                  setTimeout(() => {
                    midiOutput.sendNoteOff(noteData.note);
                    if (noteData.accent) {
                      midiOutput.sendControlChange(16, 0);
                    }
                    if (noteData.slide) {
                      midiOutput.sendControlChange(17, 0);
                    }
                  }, optimizedDuration);
                }


        });
      }
    }
  }, [currentPlayingPattern, currentPreset, steps, tempo, midiOutputEnabled, noteLength]);

  // useEffect pour gérer le transport
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
    Tone.Transport.cancel();
    
    setCurrentStep(0);
    let step = 0;
    
    // Calculer l'intervalle de répétition selon noteLength
    const intervalMap = {
      "4n": "4n",
      "8n": "8n",
      "16n": "16n", 
      "32n": "32n",
      "64n": "64n"
    };
    const interval = intervalMap[noteLength] || "16n";

    transportId.current = Tone.Transport.scheduleRepeat((time) => {
      step = (step + 1) % steps;
      setCurrentStep(step);
      playStep(step, time);
    }, interval);
    
    Tone.context.resume().then(() => {
      Tone.Transport.start();
    });
    
    return () => {
      if (transportId.current) {
        Tone.Transport.clear(transportId.current);
        transportId.current = null;
      }
      Tone.Transport.stop();
    };
  }, [isPlaying, steps, tempo, noteLength, playStep, currentPlayingPattern]);


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
            // Calcul de la durée et du timing en ticks
            const startTicks = stepIndex * (ppq / (steps.length / 4)); // 4 noires par mesure
            const durationTicks = ppq / (steps.length / 4); // Durée en ticks (une double-croche par défaut)
            
            // Convertir la note en numéro MIDI
            const midiNote = Tone.Frequency(note).toMidi();
            
            // Ajouter la note au track avec ticks au lieu de time
            track.addNote({
              midi: midiNote,
              ticks: startTicks,
              durationTicks: durationTicks,
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
        

        
        // 3. Trouver le plus petit commun diviseur approximatif des écarts temporels
        // pour déduire la "granularité" du MIDI
        let smallestGap = Math.min(...timeDiffs, 0.25); // Valeur par défaut si pas d'écarts détectés
        
        
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

          truncationWarning = true;
        }

        // 6. Calculer le facteur de scaling pour préserver l'espacement relatif des notes
        // tout en rentrant dans le nombre de pas disponibles
        const scalingFactor = Math.min(steps / estimatedSteps, 1);
        
        // 7. Ajouter les notes du MIDI au pattern avec le bon espacement
        sortedNotes.forEach((note, i) => {
          
          // Convertir le numéro MIDI en note + octave
          const noteName = Tone.Frequency(note.midi, "midi").toNote();
          
          // Vérifier si la note est dans notre range d'octaves
          if (newPattern[noteName]) {
            // Calculer l'index du step en se basant sur le temps
            // Diviser par la durée d'un step (midiDuration / steps)
            const stepDuration = midiDuration / steps;
            let stepIndex = Math.round(note.time / stepDuration);
            
            // Alternative : utiliser la grille des 16èmes
            // let stepIndex = Math.round(note.time * 16); // 16 sixteenths per 4 beats
            
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
      
      // Sauvegarder dans l'historique avant de mettre à jour le pattern
      saveToHistory(newPattern);
      setPattern(newPattern);
      setVariationPopupOpen(false);
      
    } catch (error) {
      console.error("Erreur lors de la génération des variations:", error);
      alert("Une erreur s'est produite lors de la génération des variations.");
    }
  };

  // ========== GESTION DES FAVORIS ==========

  // Fonction pour charger un favori
  const handleLoadFavorite = (favorite) => {
    try {
      console.log("Chargement du favori:", favorite.name);
      
      // Charger le pattern
      if (favorite.pattern) {
        // Adapter le pattern aux octaves actuelles si nécessaire
        const adaptedPattern = buildPattern(favorite.pattern, steps, minOctave, maxOctave);
        
        // Sauvegarder dans l'historique avant de changer
        saveToHistory(adaptedPattern);
        setPattern(adaptedPattern);
      }
      
      // Charger les paramètres du séquenceur si disponibles
      if (favorite.sequencerSettings) {
        const settings = favorite.sequencerSettings;
        
        // Appliquer les réglages si ils diffèrent des actuels
        if (settings.tempo && settings.tempo !== tempo) {
          setTempo(settings.tempo);
        }
        if (settings.steps && settings.steps !== steps) {
          setSteps(settings.steps);
        }
        if (settings.noteLength && settings.noteLength !== noteLength) {
          setNoteLength(settings.noteLength);
        }
        if (settings.octaves) {
          if (settings.octaves.min !== minOctave) {
            setMinOctave(settings.octaves.min);
          }
          if (settings.octaves.max !== maxOctave) {
            setMaxOctave(settings.octaves.max);
          }
        }
      }
      
      // Si le favori a des paramètres de génération, les sauvegarder pour "Random Again"
      if (favorite.generationParams) {
        setRandomParams(favorite.generationParams);
      }
      
      console.log(`Favori "${favorite.name}" chargé avec succès`);
      
    } catch (error) {
      console.error("Erreur lors du chargement du favori:", error);
      alert("Erreur lors du chargement du favori");
    }
  };

  // Fonction pour récupérer les paramètres actuels du séquenceur pour la sauvegarde
  const getCurrentSequencerSettings = () => {
    return {
      tempo,
      steps,
      voiceMode: currentPreset?.voiceMode || 'poly',
      noteLength,
      octaves: { min: minOctave, max: maxOctave }
    };
  };

  // Fonction pour récupérer les paramètres de génération actuels
  const getCurrentGenerationParams = () => {
    // Retourner les derniers paramètres utilisés pour la génération aléatoire
    return randomParams || null;
  };

  // ========== GESTION DES GAMMES ==========

  // Fonction appelée quand les gammes sont mises à jour
  const handleScalesUpdated = () => {
    try {
      // Forcer le rechargement des gammes dans randomEngine
      refreshScales();
      console.log("Gammes rechargées dans le moteur de génération");
      
      // Déclencher un rechargement des composants qui utilisent les gammes
      setScalesUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erreur lors du rechargement des gammes:", error);
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
    
    // Résolution MIDI standard
    const ppq = 480;
    
    // Header MIDI
    let header = [
      0x4d, 0x54, 0x68, 0x64,
      0x00, 0x00, 0x00, 0x06,
      0x00, 0x00,
      0x00, 0x01,
      (ppq >> 8) & 0xFF, ppq & 0xFF
    ];
    
    let track = [];
    
    // Tempo
    let microsecPerBeat = Math.round(60000000 / tempo);
    track.push(0x00, 0xFF, 0x51, 0x03, 
      (microsecPerBeat >> 16) & 0xFF, 
      (microsecPerBeat >> 8) & 0xFF, 
      microsecPerBeat & 0xFF
    );
    
    // Définition des contrôleurs MIDI
    const CC_ACCENT = 16;
    const CC_SLIDE = 17;
    
    // NOUVELLE LOGIQUE : Calculer l'espacement temporel basé sur noteLength
    // noteLength détermine l'intervalle entre chaque step dans le séquenceur
    const stepIntervalMap = {
      "4n": ppq,        // 1 noire = 480 ticks (très lent)
      "8n": ppq / 2,    // 1 croche = 240 ticks (lent) 
      "16n": ppq / 4,   // 1 double-croche = 120 ticks (normal)
      "32n": ppq / 8,   // 1 triple-croche = 60 ticks (rapide)
      "64n": ppq / 16   // 1 quadruple-croche = 30 ticks (très rapide)
    };
    
    const ticksPerStep = stepIntervalMap[noteLength] || ppq / 4;
    
    // La durée de chaque note : légèrement plus courte que l'intervalle pour éviter les chevauchements
    const noteDurationTicks = Math.round(ticksPerStep * 0.8);
    
    console.log(`Export MIDI: noteLength=${noteLength}, ticksPerStep=${ticksPerStep}, noteDuration=${noteDurationTicks}, steps=${steps}`);
    
    // Collecter toutes les notes avec leur timing
    const midiEvents = [];
    
    // Parcourir chaque step
    for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
      const stepStartTime = stepIndex * ticksPerStep;
      const noteEndTime = stepStartTime + noteDurationTicks;
      
      // Collecter toutes les notes actives à ce step
      const activeNotes = [];
      Object.entries(pattern).forEach(([note, stepArray]) => {
        const cell = stepArray[stepIndex];
        if (cell && cell.on) {
          activeNotes.push({
            note,
            midiNote: noteNameToMidi(note),
            velocity: Math.round(cell.velocity || 100),
            accent: cell.accent || false,
            slide: cell.slide || false
          });
        }
      });
      
      // Ajouter les événements MIDI pour toutes les notes de ce step
      activeNotes.forEach((noteData) => {
        // Note On
        midiEvents.push({
          time: stepStartTime,
          type: 'noteOn',
          note: noteData.midiNote,
          velocity: noteData.accent ? Math.min(127, Math.round(noteData.velocity * 1.2)) : noteData.velocity,
          accent: noteData.accent,
          slide: noteData.slide
        });
        
        // Note Off
        midiEvents.push({
          time: noteEndTime,
          type: 'noteOff',
          note: noteData.midiNote,
          accent: noteData.accent,
          slide: noteData.slide
        });
      });
    }
    
    // Trier tous les événements par temps
    midiEvents.sort((a, b) => a.time - b.time);
    
    // Convertir les événements en données MIDI
    let currentTime = 0;
    
    midiEvents.forEach(event => {
      const deltaTime = event.time - currentTime;
      currentTime = event.time;
      
      if (event.type === 'noteOn') {
        // Control Changes pour accent et slide
        if (event.accent) {
          track.push(...writeVarLen(deltaTime), 0xB0, CC_ACCENT, 127);
          track.push(...writeVarLen(0), 0x90, event.note, event.velocity);
        } else if (event.slide) {
          track.push(...writeVarLen(deltaTime), 0xB0, CC_SLIDE, 127);
          track.push(...writeVarLen(0), 0x90, event.note, event.velocity);
        } else {
          track.push(...writeVarLen(deltaTime), 0x90, event.note, event.velocity);
        }
      } else if (event.type === 'noteOff') {
        track.push(...writeVarLen(deltaTime), 0x80, event.note, 0);
        
        // Reset des contrôleurs
        if (event.accent) {
          track.push(...writeVarLen(0), 0xB0, CC_ACCENT, 0);
        }
        if (event.slide) {
          track.push(...writeVarLen(0), 0xB0, CC_SLIDE, 0);
        }
      }
    });
    
    // End of track
    track.push(0x00, 0xFF, 0x2F, 0x00);
    
    // Calcul de la longueur du track
    let trackLen = track.length;
    let trackHeader = [
      0x4d, 0x54, 0x72, 0x6b,
      (trackLen >> 24) & 0xFF, 
      (trackLen >> 16) & 0xFF, 
      (trackLen >> 8) & 0xFF, 
      trackLen & 0xFF
    ];
    
    // Assemblage final
    let midi = new Uint8Array([...header, ...trackHeader, ...track]);
    let blob = new Blob([midi], { type: 'audio/midi' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `melody_${tempo}bpm_${noteLength.replace('/', '')}_${steps}steps.mid`;
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
    
    let newPattern;
    let ambianceInfo = null;
    
    // Vérifier si c'est le mode ambiance
    if (params.ambianceMode && params.ambiance) {
      try {
        const result = generateAmbiancePattern(params.ambiance, {
          steps: stepsToUse,
          seed: params.seed,
          minOct: minOctave,
          maxOct: maxOctave
        });
        
        newPattern = buildPattern(result.pattern, stepsToUse, minOctave, maxOctave);
        ambianceInfo = result.ambiance;
        
        // Appliquer automatiquement le tempo suggéré
        if (result.ambiance.suggestedTempo) {
          setTempo(result.ambiance.suggestedTempo);
        }
        
        console.log(`Ambiance "${ambianceInfo.name}" générée:`, ambianceInfo.description);
        if (ambianceInfo.suggestedTempo) {
          console.log(`Tempo suggéré: ${ambianceInfo.suggestedTempo} BPM`);
        }
        
      } catch (error) {
        console.error('Erreur lors de la génération d\'ambiance:', error);
        // Fallback vers la génération normale
        newPattern = buildPattern(generateMusicalPattern({
          ...params,
          steps: stepsToUse,
          octaves: { min: minOctave, max: maxOctave }
        }), stepsToUse, minOctave, maxOctave);
      }
    } else {
      // Mode manuel traditionnel
      newPattern = buildPattern(generateMusicalPattern({
        ...params,
        steps: stepsToUse,
        octaves: { min: minOctave, max: maxOctave }
      }), stepsToUse, minOctave, maxOctave);
    }
    
    // Appliquer les accidents heureux si activés
    if (params.happyAccidents) {
      console.log('Application des accidents heureux avec intensité:', params.accidentIntensity);
      newPattern = applyHappyAccidents(newPattern, {
        intensity: params.accidentIntensity || 0.5,
        seed: params.seed || Date.now()
      });
    }
    
    // Sauvegarder dans l'historique avant de définir le nouveau pattern
    saveToHistory(newPattern);
    setPattern(newPattern);
    
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
    
    let newPattern;
    
    // Vérifier si c'est le mode ambiance
    if (randomParams.ambianceMode && randomParams.ambiance) {
      try {
        const result = generateAmbiancePattern(randomParams.ambiance, {
          steps: stepsToUse,
          seed: newSeed,
          minOct: minOctave,
          maxOct: maxOctave
        });
        
        newPattern = buildPattern(result.pattern, stepsToUse, minOctave, maxOctave);
        
        // Appliquer automatiquement le tempo suggéré
        if (result.ambiance.suggestedTempo) {
          setTempo(result.ambiance.suggestedTempo);
        }
        
      } catch (error) {
        console.error('Erreur lors de la régénération d\'ambiance:', error);
        // Fallback vers la génération normale
        newPattern = buildPattern(generateMusicalPattern({
          ...randomParams,
          steps: stepsToUse,
          octaves: { min: minOctave, max: maxOctave },
          seed: newSeed
        }), stepsToUse, minOctave, maxOctave);
      }
    } else {
      // Mode manuel traditionnel
      newPattern = buildPattern(generateMusicalPattern({
        ...randomParams,
        steps: stepsToUse,
        octaves: { min: minOctave, max: maxOctave },
        seed: newSeed
      }), stepsToUse, minOctave, maxOctave);
    }
    
    // Appliquer les accidents heureux si activés
    if (randomParams.happyAccidents) {
      console.log('Régénération avec accidents heureux, intensité:', randomParams.accidentIntensity);
      newPattern = applyHappyAccidents(newPattern, {
        intensity: randomParams.accidentIntensity || 0.5,
        seed: newSeed || Date.now()
      });
    }
    
    // Sauvegarder dans l'historique avant de définir le nouveau pattern
    saveToHistory(newPattern);
    setPattern(newPattern);
    
    // Mettre à jour randomParams avec le nouveau seed pour les futurs appels
    if (newSeed !== undefined) {
      setRandomParams(prev => ({ ...prev, seed: newSeed }));
    }
  }

  // Fonctions pour le morphing temps réel
  function generateMorphTarget() {
    if (!randomParams) {
      // Si pas de paramètres précédents, générer un pattern aléatoire simple
      const newTarget = buildPattern(generateMusicalPattern({
        root: "C",
        scale: "minor", 
        style: "psy",
        part: "lead",
        steps,
        octaves: { min: minOctave, max: maxOctave }
      }), steps, minOctave, maxOctave);
      
      setTargetPattern(newTarget);
      setMorphingEnabled(true);
      setMorphAmount(0);
      console.log('Cible de morphing générée (mode simple)');
    } else {
      // Utiliser les derniers paramètres mais avec un nouveau seed
      const morphSeed = Date.now();
      let newTarget;
      
      if (randomParams.ambianceMode && randomParams.ambiance) {
        const result = generateAmbiancePattern(randomParams.ambiance, {
          steps,
          seed: morphSeed,
          minOct: minOctave,
          maxOct: maxOctave
        });
        newTarget = buildPattern(result.pattern, steps, minOctave, maxOctave);
      } else {
        newTarget = buildPattern(generateMusicalPattern({
          ...randomParams,
          steps,
          octaves: { min: minOctave, max: maxOctave },
          seed: morphSeed
        }), steps, minOctave, maxOctave);
      }
      
      // Appliquer les accidents heureux si activés
      if (randomParams.happyAccidents) {
        newTarget = applyHappyAccidents(newTarget, {
          intensity: randomParams.accidentIntensity || 0.5,
          seed: morphSeed
        });
      }
      
      setTargetPattern(newTarget);
      setMorphingEnabled(true);
      setMorphAmount(0);
      console.log('Cible de morphing générée avec les derniers paramètres');
    }
  }

  function updateMorphing(amount) {
    if (!morphingEnabled || !targetPattern) return;
    
    setMorphAmount(amount);
    
    if (amount === 0) {
      setMorphedPattern(null);
    } else if (amount === 1) {
      setMorphedPattern(targetPattern);
    } else {
      const morphed = morphPatterns(pattern, targetPattern, amount);
      setMorphedPattern(morphed);
    }
  }

  function applyMorphTarget() {
    if (!targetPattern) return;
    
    // Remplacer le pattern actuel par la cible
    saveToHistory(targetPattern);
    setPattern(targetPattern);
    
    // Réinitialiser le morphing
    setMorphingEnabled(false);
    setTargetPattern(null);
    setMorphAmount(0);
    setMorphedPattern(null);
    
    console.log('Pattern cible appliqué définitivement');
  }

  function cancelMorphing() {
    setMorphingEnabled(false);
    setTargetPattern(null);
    setMorphAmount(0);
    setMorphedPattern(null);
    console.log('Morphing annulé');
  }

  const handleClear = () => {
    const newPattern = buildPattern(null, steps, minOctave, maxOctave);
    // Sauvegarder dans l'historique avant de vider
    saveToHistory(newPattern);
    setPattern(newPattern);
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
    
    // Sauvegarder dans l'historique et mettre à jour le pattern
    saveToHistory(newPattern);
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
    
    // Sauvegarder dans l'historique et mettre à jour le pattern
    saveToHistory(newPattern);
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

      {/* Interface organisée par groupes fonctionnels */}
      <div className="controls-section">
        
        {/* 🎮 GROUPE CONTRÔLES DE LECTURE */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#00eaff', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            CONTRÔLES DE LECTURE
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" id="playBtn" onClick={handlePlay} disabled={isPlaying}
              style={{ backgroundColor: isPlaying ? '#4CAF50' : '', color: isPlaying ? '#000' : '' }}>
              ▶️ Play
            </button>
            <button className="btn" id="stopBtn" onClick={handleStop} disabled={!isPlaying}
              style={{ backgroundColor: '#ff4444', color: '#fff' }}>
              ⏹️ Stop
            </button>
            <button className="btn" id="clearBtn" onClick={handleClear}
              style={{ backgroundColor: '#ff6b35', color: '#fff' }}>
              🗑️ Clear
            </button>
            <button 
              className="btn" 
              id="undoBtn" 
              onClick={handleUndo} 
              disabled={historyIndex <= 0}
              title="Annuler la dernière action"
              style={{ 
                backgroundColor: historyIndex > 0 ? '#4CAF50' : '#666', 
                color: historyIndex > 0 ? '#000' : '#999' 
              }}
            >
              ↶ Retour
            </button>
            
            {/* Sélecteur de vitesse intégré */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ color: "#ccc", fontSize: "12px" }}>Vitesse:</span>
              <select 
                value={noteLength}
                onChange={(e) => setNoteLength(e.target.value)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
                title="Vitesse de lecture"
              >
                <option value="4n">1/4</option>
                <option value="8n">1/8</option>
                <option value="16n">1/16</option>
                <option value="32n">1/32</option>
                <option value="64n">1/64</option>
              </select>
            </div>
          </div>
        </div>

        {/* 🎲 GROUPE GÉNÉRATION CRÉATIVE */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#ff9500', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            GÉNÉRATION CRÉATIVE
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" id="randomBtn" onClick={() => setRandomVisible(true)}
              style={{ backgroundColor: '#2196F3', color: '#fff', fontWeight: 'bold' }}>
              🎲 Random
            </button>
            <button 
              className="btn" 
              id="randomAgainBtn" 
              onClick={regenerateRandomPattern} 
              disabled={!randomParams}
              title="Régénérer avec les mêmes paramètres"
              style={{ 
                backgroundColor: randomParams ? '#ff9500' : '#666', 
                color: randomParams ? '#000' : '#999',
                fontWeight: 'bold'
              }}
            >
              Again
            </button>
            <button
              className="btn"
              id="variationBtn"
              onClick={() => setVariationPopupOpen(true)}
              style={{
                backgroundColor: '#ff00ea',
                color: '#000',
                fontWeight: 'bold'
              }}
              title="Modifier la séquence existante"
            >
              🎨 Variations
            </button>
          </div>
        </div>

        {/* ⭐ GROUPE GESTION & STOCKAGE */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#FFD700', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            GESTION & STOCKAGE
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn"
              id="favoritesBtn"
              onClick={() => setFavoritesPopupOpen(true)}
              title="Gérer les patterns favoris"
              style={{
                backgroundColor: '#FFD700',
                color: '#000',
                fontWeight: 'bold'
              }}
            >
             Favoris
            </button>
            <button
              className="btn"
              id="scalesBtn"
              onClick={() => setScalesManagerOpen(true)}
              title="Gérer les gammes musicales"
              style={{
                backgroundColor: '#9C27B0',
                color: '#fff',
                fontWeight: 'bold'
              }}
            >
              Gammes
            </button>
            <button
              className="btn"
              id="exportMidiBtn"
              onClick={exportToMidi}
              disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
              title="Exporter en fichier MIDI"
              style={{
                backgroundColor: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#4CAF50' : '#666',
                color: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#000' : '#999',
                fontWeight: 'bold'
              }}
            >
              📤 Export MIDI
            </button>
          </div>
        </div>

        {/* 🔧 GROUPE AUDIO & MIDI */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#00ff88', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            AUDIO & MIDI
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={() => setSynthPopupOpen(true)}
              disabled={isPlaying}
              title="Paramètres du synthétiseur"
              style={{ 
                backgroundColor: '#8e24aa', 
                color: '#fff',
                fontWeight: 'bold'
              }}
            >
              🎛️ Son
            </button>
            <button
              className={`btn ${midiOutputEnabled ? 'btn-active' : ''}`}
              id="midiBtn"
              onClick={handleToggleMidi}
              title="Activer/désactiver la sortie MIDI"
              style={{ 
                backgroundColor: midiOutputEnabled ? '#00ff88' : '#666', 
                color: midiOutputEnabled ? '#000' : '#999',
                fontWeight: 'bold'
              }}
            >
              {midiOutputEnabled ? '🔗 MIDI ON' : '🔌 MIDI OFF'}
            </button>
            <button
              className="btn"
              onClick={() => setMidiSettingsOpen(true)}
              disabled={!midiOutputEnabled}
              title="Configuration MIDI"
              style={{ 
                backgroundColor: midiOutputEnabled ? '#00bcd4' : '#666', 
                color: midiOutputEnabled ? '#000' : '#999'
              }}
            >
             Config
            </button>
          </div>
        </div>

        {/* 🎵 GROUPE MANIPULATION */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#ff5722', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            MANIPULATION
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn" 
              onClick={shiftOctaveDown}
              title="Décaler toutes les notes d'une octave vers le bas"
              disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
              style={{ 
                backgroundColor: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#f44336' : '#666',
                color: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#fff' : '#999',
                fontWeight: 'bold',
                minWidth: "60px"
              }}
            >
              ⬇️ Oct
            </button>
            <button 
              className="btn" 
              onClick={shiftOctaveUp}
              title="Décaler toutes les notes d'une octave vers le haut"
              disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
              style={{ 
                backgroundColor: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#f44336' : '#666',
                color: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#fff' : '#999',
                fontWeight: 'bold',
                minWidth: "60px"
              }}
            >
              ⬆️ Oct
            </button>
            
            {/* Contrôles de Morphing */}
            {!morphingEnabled ? (
              <button 
                className="btn" 
                onClick={generateMorphTarget}
                title="Générer une cible de morphing"
                disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
                style={{ 
                  backgroundColor: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#9C27B0' : '#666',
                  color: Object.values(pattern).some(row => row.some(cell => cell && cell.on)) ? '#fff' : '#999',
                  fontWeight: 'bold',
                  minWidth: "70px"
                }}
              >
                🌊 Morph
              </button>
            ) : (
              <>
                <button 
                  className="btn" 
                  onClick={applyMorphTarget}
                  title="Appliquer définitivement le pattern cible"
                  style={{ 
                    backgroundColor: '#4CAF50', 
                    color: '#fff',
                    fontWeight: 'bold',
                    minWidth: "60px"
                  }}
                >
                  ✓ Apply
                </button>
                <button 
                  className="btn" 
                  onClick={cancelMorphing}
                  title="Annuler le morphing"
                  style={{ 
                    backgroundColor: '#f44336', 
                    color: '#fff',
                    fontWeight: 'bold',
                    minWidth: "60px"
                  }}
                >
                  ✗ Cancel
                </button>
              </>
            )}
          </div>
          
          {/* Contrôle du morphing en temps réel */}
          {morphingEnabled && (
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              background: 'rgba(156, 39, 176, 0.1)', 
              borderRadius: '6px',
              border: '1px solid rgba(156, 39, 176, 0.3)'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#9C27B0', 
                marginBottom: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                🌊 MORPHING TEMPS RÉEL
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: '#A0A0A8', minWidth: '20px' }}>0%</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={morphAmount}
                  onChange={e => updateMorphing(parseFloat(e.target.value))}
                  style={{ 
                    flex: 1,
                    height: '6px',
                    background: 'linear-gradient(to right, #9C27B0, #E91E63)',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#A0A0A8', minWidth: '30px' }}>100%</span>
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#A0A0A8', 
                textAlign: 'center', 
                marginTop: '4px' 
              }}>
                {Math.round(morphAmount * 100)}% vers la cible
              </div>
            </div>
          )}
        </div>

        {/* ⚙️ GROUPE PARAMÈTRES */}
        <div className="control-group-container" style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            color: '#00D4FF', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            PARAMÈTRES
          </div>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Contrôle du tempo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#ccc', fontSize: '12px', fontWeight: 'bold' }}>TEMPO</span>
              <input 
                type="number" 
                className="input-field"
                style={{ width: "60px", textAlign: "center", backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}
                min="60"
                max="240"
                value={tempo}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 60 && value <= 240) {
                    setTempo(value);
                    if (isPlaying) {
                      Tone.Transport.bpm.value = value;
                    }
                  }
                }}
              />
              <span style={{ fontSize: "0.8rem", color: "#8af" }}>BPM</span>
            </div>
            
            {/* Contrôle des octaves */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#ccc', fontSize: '12px', fontWeight: 'bold' }}>OCTAVES</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <button 
                    className="btn" 
                    onClick={() => {
                      if (minOctave > 0) {
                        setMinOctave(minOctave - 1);
                      }
                    }}
                    style={{ 
                      width: "25px", height: "25px", padding: "0", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", backgroundColor: '#555'
                    }}
                    disabled={minOctave <= 0}
                  >
                    -
                  </button>
                  <div style={{ 
                    width: "25px", height: "25px", backgroundColor: "#00D4FF", 
                    color: "#000", borderRadius: "4px", display: "flex", 
                    alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: "bold"
                  }}>
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
                      width: "25px", height: "25px", padding: "0", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", backgroundColor: '#555'
                    }}
                    disabled={minOctave >= maxOctave - 1}
                  >
                    +
                  </button>
                </div>
                
                <span style={{ color: '#ccc', fontSize: '12px' }}>→</span>
                
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <button 
                    className="btn" 
                    onClick={() => {
                      if (maxOctave > minOctave + 1) {
                        setMaxOctave(maxOctave - 1);
                      }
                    }}
                    style={{ 
                      width: "25px", height: "25px", padding: "0", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", backgroundColor: '#555'
                    }}
                    disabled={maxOctave <= minOctave + 1}
                  >
                    -
                  </button>
                  <div style={{ 
                    width: "25px", height: "25px", backgroundColor: "#00D4FF", 
                    color: "#000", borderRadius: "4px", display: "flex", 
                    alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: "bold"
                  }}>
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
                      width: "25px", height: "25px", padding: "0", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", backgroundColor: '#555'
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
      </div>
      {/* Piano Roll avec grille de notes améliorée */}
      <PianoRoll
        minOctave={minOctave}
        maxOctave={maxOctave}
        steps={steps}
        pattern={morphedPattern || pattern}
        currentStep={isPlaying ? currentStep : null}
        onToggleStep={handleToggleStep}
        onChangeVelocity={handleChangeVelocity}
        onChangeSteps={handleChangeSteps}
        onToggleAccent={handleToggleAccent}
        onToggleSlide={handleToggleSlide}
        showVelocityValues={false} /* Désactiver l'affichage des valeurs numériques (00) */
        isMorphed={!!morphedPattern}
      />
      <RandomPopup
        visible={randomVisible}
        onValidate={handleRandomValidate}
        onCancel={() => setRandomVisible(false)}
        defaultParams={{
          ...randomParams,
          octaves: { min: minOctave, max: maxOctave }
        }}
        scalesUpdateTrigger={scalesUpdateTrigger}
      />
      <SynthPopup
        visible={synthPopupOpen}
        current={presetKey}
        onSelect={preset => {
          // Si on reçoit un objet preset complet
          if (typeof preset === 'object' && preset !== null) {
            setPresetKey(preset.key); // Garder la clé pour compatibilité
            setCurrentPreset(preset); // Stocker l'objet preset complet
          } 
          // Si on reçoit juste une clé (ancien comportement)
          else if (typeof preset === 'string') {
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
      <FavoritesPopup
        visible={favoritesPopupOpen}
        onLoadFavorite={handleLoadFavorite}
        onCancel={() => setFavoritesPopupOpen(false)}
        currentPattern={pattern}
        currentGenerationParams={getCurrentGenerationParams()}
        sequencerSettings={getCurrentSequencerSettings()}
      />
      <ScalesManagerPopup
        visible={scalesManagerOpen}
        onCancel={() => setScalesManagerOpen(false)}
        onScalesUpdated={handleScalesUpdated}
      />
    </div>
  );
}
