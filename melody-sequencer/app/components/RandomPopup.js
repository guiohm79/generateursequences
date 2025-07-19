"use client";
import React, { useState, useEffect } from "react";
import { ScalesStorage } from "../lib/scalesStorage";

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
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
   { key: "hypnoticLead", label: "Hypnotique Lead" }, 
];
const STEPS_OPTIONS = [
  { value: 16, label: "16 pas" },
  { value: 32, label: "32 pas" },
    { value: 64, label: "64 pas" }
];

export default function RandomPopup({ visible, onValidate, onCancel, defaultParams, scalesUpdateTrigger }) {
  const [root, setRoot] = useState(defaultParams?.rootNote || "C");
  const [scale, setScale] = useState(defaultParams?.scale || "phrygian");
  const [style, setStyle] = useState(defaultParams?.style || "psy");
  const [mood, setMood] = useState(defaultParams?.mood || "default");
  const [part, setPart] = useState(defaultParams?.part || "lead");
  const [steps, setSteps] = useState(defaultParams?.steps || 16);
  const [useSeed, setUseSeed] = useState(defaultParams?.seed !== undefined);
  const [seed, setSeed] = useState(defaultParams?.seed || Math.floor(Math.random() * 100000));
  const [availableScales, setAvailableScales] = useState([]);

  // Fonction pour charger les gammes disponibles
  const loadAvailableScales = () => {
    try {
      const allScales = ScalesStorage.getAllScales();
      const scaleOptions = Object.entries(allScales).map(([key, scale]) => ({
        key,
        label: scale.name || key,
        category: scale.category || 'Autre'
      }));
      setAvailableScales(scaleOptions);
      console.log(`${scaleOptions.length} gammes chargées dans RandomPopup`);
    } catch (error) {
      console.error('Erreur lors du chargement des gammes:', error);
      // Fallback vers une liste basique en cas d'erreur
      setAvailableScales([
        { key: "major", label: "Majeure", category: "Classique" },
        { key: "minor", label: "Mineure", category: "Classique" },
        { key: "phrygian", label: "Phrygien", category: "Modes" }
      ]);
    }
  };

  // Charger les gammes disponibles au montage du composant et quand elles sont mises à jour
  useEffect(() => {
    if (visible) {
      loadAvailableScales();
    }
  }, [visible, scalesUpdateTrigger]);

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
            {(() => {
              // Grouper les gammes par catégorie
              const groupedScales = availableScales.reduce((groups, scale) => {
                const category = scale.category || 'Autre';
                if (!groups[category]) groups[category] = [];
                groups[category].push(scale);
                return groups;
              }, {});
              
              // Trier les catégories et créer les options
              return Object.keys(groupedScales).sort().map(category => (
                <optgroup key={category} label={category}>
                  {groupedScales[category].map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </optgroup>
              ));
            })()}
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
            <option value="64">64 pas</option>
          </select>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={useSeed}
              onChange={e => setUseSeed(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Utiliser une graine (seed)
          </label>
          {useSeed && (
            <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(parseInt(e.target.value) || 0)}
                style={{ width: '100px', marginRight: '5px' }}
                min="0"
                max="999999"
              />
              <button 
                className="btn"
                onClick={() => setSeed(Math.floor(Math.random() * 100000))}
                style={{ padding: '3px 8px' }}
                title="Générer une nouvelle graine aléatoire"
              >
                🎲
              </button>
            </div>
          )}
        </div>
        <div className="random-popup-actions">
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button
            className="btn primary"
            onClick={() => onValidate({ 
              rootNote: root, 
              scale, 
              style, 
              mood, 
              part, 
              steps,
              seed: useSeed ? seed : undefined
            })}
          >Générer</button>
        </div>
      </div>
    </div>
  );
}