"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import PianoRoll from "./PianoRoll";

const synthTypes = [
  { value: "synth", label: "Synth Saw" },
  { value: "sine", label: "Synth Sine" },
  { value: "square", label: "Synth Square" },
  { value: "triangle", label: "Synth Triangle" },
  { value: "fm", label: "FM Synth" },
  { value: "duo", label: "Duo Synth" },
  { value: "mono", label: "Mono Bass" },
];

export default function MelodySequencer() {
  // Etats principaux
  const [tempo, setTempo] = useState(128);
  const [steps, setSteps] = useState(16);
  const [minOctave, setMinOctave] = useState(3);
  const [maxOctave, setMaxOctave] = useState(5);
  const [synthType, setSynthType] = useState("synth");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Synth unique via useRef (jamais dans le render/playStep !)
  const synthRef = useRef(null);

  // Crée le synthé selon le type, le détruit si changement
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.disconnect();
      synthRef.current = null;
    }
    switch (synthType) {
      case "sine":
      case "square":
      case "triangle":
        synthRef.current = new Tone.PolySynth(Tone.Synth, { oscillator: { type: synthType } }).toDestination();
        break;
      case "fm":
        synthRef.current = new Tone.PolySynth(Tone.FMSynth).toDestination();
        break;
      case "duo":
        synthRef.current = new Tone.PolySynth(Tone.DuoSynth).toDestination();
        break;
      case "mono":
        synthRef.current = new Tone.MonoSynth().toDestination();
        break;
      default:
        synthRef.current = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" } }).toDestination();
    }
    // Clean up à l’unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.disconnect();
        synthRef.current = null;
      }
    };
  }, [synthType]);

  // Pattern de notes (mémorisé pour chaque grille/param)
  const createPattern = useCallback(() => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const pat = {};
    for (let octave = minOctave; octave <= maxOctave; octave++) {
      notes.forEach(note => {
        pat[note + octave] = Array(steps).fill(0);
      });
    }
    return pat;
  }, [minOctave, maxOctave, steps]);

  const [pattern, setPattern] = useState(() => createPattern());

  useEffect(() => {
    setPattern(createPattern());
    setCurrentStep(0);
  }, [createPattern]);

  // Toggle step avec vélocité
  const handleToggleStep = (note, idx) => {
    setPattern(prev => ({
      ...prev,
      [note]: prev[note].map((v, i) => {
        if (i !== idx) return v;
        // Si inactif : on active avec vélocité 100
        if (!v || v === 0) return { on: true, velocity: 100 };
        // Si déjà actif, on désactive
        return 0;
      })
    }));
  };

  // Changement de vélocité
  const handleChangeVelocity = (note, idx, velocity) => {
    setPattern(prev => ({
      ...prev,
      [note]: prev[note].map((v, i) =>
        i === idx && v && v.on ? { ...v, velocity } : v
      )
    }));
  };


    function handleChangeSteps(newSteps) {
    if (newSteps === steps) return;
    setSteps(newSteps);
    setPattern(prev => {
        const next = {};
        Object.keys(prev).forEach(note => {
        let arr = prev[note] || [];
        if (arr.length < newSteps) {
            arr = arr.concat(Array(newSteps - arr.length).fill(0));
        } else if (arr.length > newSteps) {
            arr = arr.slice(0, newSteps);
        }
        next[note] = arr;
        });
        return next;
    });
    setCurrentStep(0);
    }


  // Joue les notes de la colonne courante (avec vélocité individuelle)
  const playStep = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) return;
    Object.keys(pattern).forEach(note => {
      const stepVal = pattern[note][currentStep];
      if (stepVal && stepVal.on) {
        // Tone.js attend une vélocité [0..1]
        const velocity = (stepVal.velocity || 100) / 127;
        synth.triggerAttackRelease(note, "8n", undefined, velocity);
      }
    });
  }, [pattern, currentStep]);

  // Timer unique pour le playback (clean à chaque stop/unmount !)
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      clearInterval(timerRef.current);
      return;
    }
    playStep(); // Joue le premier step direct
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps);
    }, (60000 / tempo) / 4);
    return () => clearInterval(timerRef.current);
  }, [isPlaying, steps, tempo, playStep]);

  // Joue à chaque step (évite le "décalage")
  useEffect(() => {
    if (isPlaying) playStep();
    // eslint-disable-next-line
  }, [currentStep]);

  const handlePlay = async () => {
    await Tone.start();
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    clearInterval(timerRef.current);
    if (synthRef.current && synthRef.current.releaseAll) {
      synthRef.current.releaseAll();
    }
  };

    function exportToMidi() {
    // Helpers
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

    // MIDI header
    let header = [
        0x4d, 0x54, 0x68, 0x64, // MThd
        0x00, 0x00, 0x00, 0x06, // header size
        0x00, 0x00, // format 0
        0x00, 0x01, // one track
        0x00, 0x60  // division (96 ppqn)
    ];

    // Track data
    let track = [];

    // Tempo event
    let microsecPerBeat = Math.round(60000000 / tempo);
    track.push(0x00, 0xFF, 0x51, 0x03, (microsecPerBeat >> 16) & 0xFF, (microsecPerBeat >> 8) & 0xFF, microsecPerBeat & 0xFF);

    // Pattern export
    const notesList = Object.keys(pattern);
    const ticksPerStep = 24; // 4 steps = 1 beat (1/16th), 96 ticks per beat

    for (let i = 0; i < steps; i++) {
        let delta = (i === 0) ? 0 : ticksPerStep;
        let notesOn = [];
        notesList.forEach(note => {
        let val = pattern[note][i];
        if (val && val.on) {
            // delta time for first event in this step
            track.push(...writeVarLen(delta), 0x90, noteNameToMidi(note), Math.round(val.velocity || 100));
            notesOn.push(note);
            delta = 0;
        }
        });
        // Note Off
        if (notesOn.length > 0) {
        // 24 ticks later (step length)
        notesOn.forEach(note => {
            track.push(...writeVarLen(ticksPerStep), 0x80, noteNameToMidi(note), 0x00);
        });
        }
    }

    // End of track
    track.push(0x00, 0xFF, 0x2F, 0x00);

    // Length (track chunk header)
    let trackLen = track.length;
    let trackHeader = [
        0x4d, 0x54, 0x72, 0x6b, // MTrk
        (trackLen >> 24) & 0xFF, (trackLen >> 16) & 0xFF, (trackLen >> 8) & 0xFF, trackLen & 0xFF
    ];

    // Concaténer tout
    let midi = new Uint8Array([...header, ...trackHeader, ...track]);

    // Export
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



  return (
    <div className="sequencer">
      <div className="header">
        <div className="header-titles">
          <div className="logo">MELODY SEQUENCER</div>
          <div className="subtitle">AI-POWERED ELECTRONIC MUSIC GENERATOR</div>
        </div>
        <div className={`status-indicator${isPlaying ? " active" : ""}`} id="statusIndicator"></div>
      </div>

      <div className="ai-input">
        <input
          type="text"
          className="input-field"
          id="melodyInput"
          placeholder="Describe your melody (e.g., 'trance arpeggio', ...)"
          autoComplete="off"
        />
        <button className="btn primary" id="generateBtn">Generate</button>
      </div>

      <div className="idea-buttons">
        <span className="idea-label">Quick Ideas:</span>
        <button className="btn idea-btn" data-idea="trance uplifting arpeggio">Trance Arp</button>
        <button className="btn idea-btn" data-idea="psytrance rolling bassline">Psy Bass</button>
        <button className="btn idea-btn" data-idea="ambient floating pad">Ambient Pad</button>
        <button className="btn idea-btn" data-idea="downtempo jazzy chord progression">Downtempo</button>
        <button className="btn idea-btn" data-idea="goa trance acid lead">Goa Acid</button>
        <button className="btn idea-btn" data-idea="progressive house melody">Progressive</button>
      </div>

      <div className="divider"></div>

      <div className="controls-section">
        <div className="transport-controls">
          <button className="btn" id="playBtn" onClick={handlePlay} disabled={isPlaying}>Play</button>
          <button className="btn" id="stopBtn" onClick={handleStop} disabled={!isPlaying}>Stop</button>
          <button className="btn" id="clearBtn" onClick={() => setPattern(createPattern())}>Clear</button>
          <button className="btn" id="randomBtn" disabled>Random</button>
          <button   className="btn" id="exportMidiBtn" onClick={exportToMidi} disabled={Object.values(pattern).every(row => row.every(cell => !cell || !cell.on))}
>
  Export MIDI</button>
        </div>
        <div className="control-group">
          <div className="control-group">
            <span className="control-label">Tempo</span>
            <input
              type="range"
              className="slider"
              id="tempoSlider"
              min="60"
              max="180"
              value={tempo}
              onChange={e => setTempo(Number(e.target.value))}
            />
            <span className="value-display" id="tempoValue">{tempo} BPM</span>
          </div>
          <div className="octave-controls">
            <div className="octave-block">
              <span className="control-label">Octave Min</span>
              <input
                type="range"
                id="octaveMinSlider"
                min="1"
                max="6"
                value={minOctave}
                onChange={e => setMinOctave(Number(e.target.value))}
              />
              <span id="octaveMinValue" className="value-display">{minOctave}</span>
            </div>
            <div className="octave-block">
              <span className="control-label">Octave Max</span>
              <input
                type="range"
                id="octaveMaxSlider"
                min="2"
                max="7"
                value={maxOctave}
                onChange={e => setMaxOctave(Number(e.target.value))}
              />
              <span id="octaveMaxValue" className="value-display">{maxOctave}</span>
            </div>
          </div>
        </div>
        <div className="control-group">
          <span className="control-label">Son</span>
          <select
            id="soundSelector"
            className="input-field"
            style={{ maxWidth: "120px" }}
            value={synthType}
            onChange={e => setSynthType(e.target.value)}
          >
            {synthTypes.map(opt =>
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )}
          </select>
        </div>
      </div>

      <div className="waveform-visualizer">
        <canvas className="waveform-canvas" id="waveformCanvas"></canvas>
      </div>

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

      <div className="presets">
        <button className="btn preset-btn" data-preset="trance" disabled>Trance</button>
        <button className="btn preset-btn" data-preset="psytrance" disabled>Psytrance</button>
        <button className="btn preset-btn" data-preset="ambient" disabled>Ambient</button>
        <button className="btn preset-btn" data-preset="downtempo" disabled>Downtempo</button>
        <button className="btn preset-btn" data-preset="goa" disabled>Goa</button>
        <button className="btn preset-btn" data-preset="progressive" disabled>Progressive</button>
      </div>

      <div className="status-message" id="statusMessage"></div>
    </div>
  );
}
