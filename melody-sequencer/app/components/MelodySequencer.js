"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import PianoRoll from "./PianoRoll";

// Les types de synthés
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

  // Initialisation du pattern : un objet {note: [0,0,0, ...]}
  const createPattern = React.useCallback(() => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const pat = {};
    for (let octave = minOctave; octave <= maxOctave; octave++) {
      notes.forEach(note => {
        pat[note + octave] = Array(steps).fill(0);
      });
    }
    return pat;
  }, [minOctave, maxOctave, steps]);

  // Pattern : recréé si le nombre de steps ou octaves change
  const [pattern, setPattern] = useState(() => createPattern());
  useEffect(() => { setPattern(createPattern()); }, [createPattern]);

  // Toggle d'une case
  const handleToggleStep = (note, idx) => {
    setPattern(prev => ({
      ...prev,
      [note]: prev[note].map((v, i) => (i === idx ? (v ? 0 : 1) : v))
    }));
  };

    // --- Gestion du séquenceur step-by-step ---
  const timerRef = useRef(null);

    const getSynth = () => {
    switch (synthType) {
      case "sine":
      case "square":
      case "triangle":
        return new Tone.PolySynth(Tone.Synth, { oscillator: { type: synthType } }).toDestination();
      case "fm":
        return new Tone.PolySynth(Tone.FMSynth).toDestination();
      case "duo":
        return new Tone.PolySynth(Tone.DuoSynth).toDestination();
      case "mono":
        return new Tone.MonoSynth().toDestination();
      default:
        return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" } }).toDestination();
    }
  };

// Joue la colonne active
  const playStep = useCallback(() => {
    const synth = getSynth();
    const notesToPlay = Object.keys(pattern).filter(note => pattern[note][currentStep]);
    if (notesToPlay.length) {
      synth.triggerAttackRelease(notesToPlay, "8n");
    }
  }, [pattern, currentStep, synthType]);

  // Démarrage du playback
  const handlePlay = async () => {
    await Tone.start();
    setIsPlaying(true);
  };

  // Stop du playback
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    clearInterval(timerRef.current);
  };

  // Timer du séquenceur
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(timerRef.current);
      return;
    }
    playStep();
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps);
    }, (60000 / tempo) / 4); // 1/16th note (16 steps = 1 mesure)
    return () => clearInterval(timerRef.current);
  }, [isPlaying, steps, tempo, playStep]);

  // À chaque step, joue la nouvelle colonne (évite le lag au premier step)
  useEffect(() => {
    if (isPlaying) playStep();
    // eslint-disable-next-line
  }, [currentStep]);


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
          <button className="btn" id="exportMidiBtn" disabled>Export MIDI</button>
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

      {/* Le Piano Roll réactif */}
      <PianoRoll
        minOctave={minOctave}
        maxOctave={maxOctave}
        steps={steps}
        pattern={pattern}
        onToggleStep={handleToggleStep}
        currentStep={isPlaying ? currentStep : null}
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
