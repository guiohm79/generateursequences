"use client";
import React, { useState } from "react";

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = [
  { key: "major", label: "Majeur" },
  { key: "minor", label: "Mineur" },
  { key: "harmonicMinor", label: "Mineur Harmonique" },
  { key: "phrygian", label: "Phrygien" },
  { key: "phrygianDominant", label: "Phrygien Dominant" },
  { key: "dorian", label: "Dorien" },
];
const STYLES = [
  { key: "psy", label: "Psytrance" },
  { key: "goa", label: "Goa" },
  { key: "prog", label: "Progressive" },
  { key: "downtempo", label: "Downtempo" },
  { key: "deep", label: "Deep" },
  { key: "ambient", label: "Ambient" },
];
const MOODS = [
  { key: "default", label: "Standard" },
  { key: "uplifting", label: "Uplifting" },
  { key: "dark", label: "Sombre" },
  { key: "punchy", label: "Punchy" },
  { key: "soft", label: "Soft" },
  { key: "dense", label: "Dense" }
];
const PARTS = [
  { key: "lead", label: "Mélodie/Lead" },
  { key: "bassline", label: "Bassline" },
  { key: "pad", label: "Pad" },
  { key: "arpeggio", label: "Arpège" },
];
const STEPS_OPTIONS = [
  { value: 16, label: "16 pas" },
  { value: 32, label: "32 pas" }
];

export default function RandomPopup({ visible, onValidate, onCancel, defaultParams }) {
  const [root, setRoot] = useState(defaultParams?.rootNote || "C");
  const [scale, setScale] = useState(defaultParams?.scale || "major");
  const [style, setStyle] = useState(defaultParams?.style || "psy");
  const [mood, setMood] = useState(defaultParams?.mood || "default");
  const [part, setPart] = useState(defaultParams?.part || "lead");
  const [steps, setSteps] = useState(defaultParams?.steps || 16);

  if (!visible) return null;

  return (
    <div className="random-popup-overlay">
      <div className="random-popup-modal">
        <h3>Générer un pattern aléatoire</h3>
        <label>
          Fondamentale :
          <select value={root} onChange={e => setRoot(e.target.value)}>
            {ROOT_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label>
          Gamme&nbsp;:
          <select value={scale} onChange={e => setScale(e.target.value)}>
            {SCALES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
        <label>
          Style&nbsp;:
          <select value={style} onChange={e => setStyle(e.target.value)}>
            {STYLES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
        <label>
          Ambiance&nbsp;:
          <select value={mood} onChange={e => setMood(e.target.value)}>
            {MOODS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </label>
        <label>
          Partie à générer&nbsp;:
          <select value={part} onChange={e => setPart(e.target.value)}>
            {PARTS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
        <label>
          Nombre de pas&nbsp;:
          <select value={steps} onChange={e => setSteps(parseInt(e.target.value))}>
            <option value="16">16 pas</option>
            <option value="32">32 pas</option>
          </select>
        </label>
        <div className="random-popup-actions">
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button
            className="btn primary"
            onClick={() => onValidate({ rootNote: root, scale, style, mood, part, steps })}
          >Générer</button>
        </div>
      </div>
    </div>
  );
}