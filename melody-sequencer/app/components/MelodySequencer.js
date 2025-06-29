"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import PianoRoll from "./PianoRoll";
import RandomPopup from "./RandomPopup";
import SynthPopup from "./SynthPopup";
import { SYNTH_PRESETS } from "../lib/synthPresets";
import { generateMusicalPattern } from "../lib/randomEngine";

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
  const [tempo, setTempo] = useState(128);
  const [steps, setSteps] = useState(16);
  const [minOctave, setMinOctave] = useState(3);
  const [maxOctave, setMaxOctave] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [presetKey, setPresetKey] = useState(SYNTH_PRESETS[0].key);
  const [synthPopupOpen, setSynthPopupOpen] = useState(false);
  const currentPreset = SYNTH_PRESETS.find(p => p.key === presetKey);
  const [randomVisible, setRandomVisible] = useState(false);
  const [randomParams, setRandomParams] = useState(null);

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
      line[idx] = !line[idx] || line[idx] === 0 ? { on: true, velocity: 100 } : 0;
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
  // Playback via Tone.Transport - Optimisé pour réduire la latence
  const playStep = useCallback((stepIdx, time) => {
    const synth = synthRef.current;
    if (!synth) return;
    
    // S'assurer que stepIdx est un nombre valide
    if (stepIdx === undefined || stepIdx < 0 || stepIdx >= steps) return;
    
    const isMono = currentPreset?.synthType === "MonoSynth";
    if (isMono) {
      const activeNotes = Object.keys(pattern).filter(note => 
        pattern[note] && 
        Array.isArray(pattern[note]) && 
        pattern[note][stepIdx] && 
        pattern[note][stepIdx].on
      );
      
      if (activeNotes.length) {
        const note = activeNotes.sort((a, b) => Tone.Frequency(a).toMidi() - Tone.Frequency(b).toMidi())[0];
        const stepVal = pattern[note][stepIdx];
        const velocity = (stepVal.velocity || 100) / 127;
        synth.triggerAttackRelease(note, "8n", time, velocity);
        previousMonoNote.current = note;
      } else {
        previousMonoNote.current = null;
      }
    } else {
      // Pour le Poly mode, utiliser un ensemble de notes pour éviter les doublons
      const notesToPlay = new Set();
      
      Object.keys(pattern).forEach(note => {
        if (!pattern[note] || !Array.isArray(pattern[note])) return;
        
        const stepVal = pattern[note][stepIdx];
        if (stepVal && stepVal.on) {
          notesToPlay.add({
            note,
            velocity: (stepVal.velocity || 100) / 127
          });
        }
      });
      
      // Jouer les notes uniquement si elles existent
      if (notesToPlay.size > 0) {
        notesToPlay.forEach(noteData => {
          synth.triggerAttackRelease(noteData.note, "8n", time, noteData.velocity);
        });
      }
    }
  }, [pattern, currentPreset, steps]);

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
    
    // Planifier les pas suivants avec précision
    transportId.current = Tone.Transport.scheduleRepeat((time) => {
      // Incrémenter le pas après avoir joué le pas actuel
      step = (step + 1) % steps;
      setCurrentStep(step);
      playStep(step, time);
    }, "16n");
    
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
    const notesList = Object.keys(pattern);
    const ticksPerStep = 24;
    for (let i = 0; i < steps; i++) {
      let delta = (i === 0) ? 0 : ticksPerStep;
      let notesOn = [];
      notesList.forEach(note => {
        let val = pattern[note][i];
        if (val && val.on) {
          track.push(...writeVarLen(delta), 0x90, noteNameToMidi(note), Math.round(val.velocity || 100));
          notesOn.push(note);
          delta = 0;
        }
      });
      if (notesOn.length > 0) {
        notesOn.forEach(note => {
          track.push(...writeVarLen(ticksPerStep), 0x80, noteNameToMidi(note), 0x00);
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
    // TOUJOURS rebuild le pattern pour la grille courante
    setPattern(pat => buildPattern(generateMusicalPattern({
      ...params,
      steps,
      octaves: { min: minOctave, max: maxOctave }
    }), steps, minOctave, maxOctave));
    setRandomParams(params);
    setRandomVisible(false);
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
            id="exportMidiBtn"
            onClick={exportToMidi}
            disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
          >Export MIDI</button>
          <div className="steps-control">

</div>

        </div>
        {/* ... autres contrôles (octaves, tempo, preset) ... */}
        <div className="control-group">
          <span className="control-label">Son</span>
          <select
            id="soundSelector"
            className="input-field"
            style={{ maxWidth: "120px" }}
            value={presetKey}
            onChange={e => setPresetKey(e.target.value)}
            disabled={isPlaying}
          >
            {SYNTH_PRESETS.map(opt =>
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            )}
          </select>
          <button
            className="btn"
            style={{ marginLeft: 10, minWidth: 80 }}
            onClick={() => setSynthPopupOpen(true)}
            disabled={isPlaying}
          >
            Éditer son
          </button>
        </div>
      </div>
      {/* ... */}


      <PianoRoll
        minOctave={minOctave}
        maxOctave={maxOctave}
        steps={steps}
        pattern={pattern}
        onToggleStep={handleToggleStep}
        onChangeVelocity={handleChangeVelocity}
        currentStep={isPlaying ? currentStep : null}
        onChangeSteps={handleChangeSteps}
      />
      <RandomPopup
        visible={randomVisible}
        onValidate={handleRandomValidate}
        onCancel={() => setRandomVisible(false)}
        defaultParams={randomParams}
      />
      <SynthPopup
        visible={synthPopupOpen}
        current={presetKey}
        onSelect={key => {
          setPresetKey(key);
          setSynthPopupOpen(false);
        }}
        onCancel={() => setSynthPopupOpen(false)}
      />
    </div>
  );
}
