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
  const [generationMode, setGenerationMode] = useState('manual'); // 'manual' ou 'ambiance'
  const [selectedAmbiance, setSelectedAmbiance] = useState('nostalgique');
  const [root, setRoot] = useState(defaultParams?.rootNote || "C");
  const [scale, setScale] = useState(defaultParams?.scale || "phrygian");
  const [style, setStyle] = useState(defaultParams?.style || "psy");
  const [mood, setMood] = useState(defaultParams?.mood || "default");
  const [part, setPart] = useState(defaultParams?.part || "lead");
  const [steps, setSteps] = useState(defaultParams?.steps || 16);
  const [useSeed, setUseSeed] = useState(defaultParams?.seed !== undefined);
  const [seed, setSeed] = useState(defaultParams?.seed || Math.floor(Math.random() * 100000));
  const [availableScales, setAvailableScales] = useState([]);
  const [happyAccidents, setHappyAccidents] = useState(false);
  const [accidentIntensity, setAccidentIntensity] = useState(0.5);

  // Liste des ambiances disponibles
  const AMBIANCES = [
    { key: 'nostalgique', name: 'Nostalgique', emoji: '🌙', description: 'Mélodies douces et mélancoliques' },
    { key: 'energique', name: 'Énergique', emoji: '⚡', description: 'Patterns dynamiques et percutants' },
    { key: 'mysterieux', name: 'Mystérieux', emoji: '🔮', description: 'Ambiances sombres et énigmatiques' },
    { key: 'tribal', name: 'Tribal', emoji: '🥁', description: 'Rythmes primitifs et envoûtants' },
    { key: 'cosmique', name: 'Cosmique', emoji: '🌌', description: 'Sonorités spatiales et éthérées' },
    { key: 'hypnotique', name: 'Hypnotique', emoji: '🌀', description: 'Patterns répétitifs et envoûtants' }
  ];

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
        
        {/* Sélecteur de mode de génération */}
        <div className="generation-mode-tabs">
          <button 
            className={`mode-tab ${generationMode === 'ambiance' ? 'active' : ''}`}
            onClick={() => setGenerationMode('ambiance')}
          >
            🎨 Ambiances
          </button>
          <button 
            className={`mode-tab ${generationMode === 'manual' ? 'active' : ''}`}
            onClick={() => setGenerationMode('manual')}
          >
            ⚙️ Manuel
          </button>
        </div>

        {/* Mode Ambiance */}
        {generationMode === 'ambiance' && (
          <div className="ambiance-section">
            <div className="ambiance-grid">
              {AMBIANCES.map(ambiance => (
                <div 
                  key={ambiance.key}
                  className={`ambiance-card ${selectedAmbiance === ambiance.key ? 'selected' : ''}`}
                  onClick={() => setSelectedAmbiance(ambiance.key)}
                >
                  <div className="ambiance-emoji">{ambiance.emoji}</div>
                  <div className="ambiance-name">{ambiance.name}</div>
                  <div className="ambiance-description">{ambiance.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode Manuel (existant) */}
        {generationMode === 'manual' && (
          <div className="manual-section">
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
          </div>
        )}

        {/* Paramètres communs */}
        <div className="common-params">
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
          
          {/* Section Accidents Heureux */}
          <div className="happy-accidents-section">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={happyAccidents}
                  onChange={e => setHappyAccidents(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontWeight: '600', color: '#FF6B6B' }}>
                  🎲 Accidents Heureux
                </span>
              </label>
            </div>
            
            {happyAccidents && (
              <div className="accident-controls">
                <div style={{ fontSize: '11px', color: '#A0A0A8', marginBottom: '8px' }}>
                  Ajoute des "erreurs" créatives : notes hors gamme, rythmes décalés, accents inattendus...
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '12px', color: '#A0A0A8' }}>Intensité:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={accidentIntensity}
                    onChange={e => setAccidentIntensity(parseFloat(e.target.value))}
                    style={{ flex: 1, maxWidth: '100px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#A0A0A8', minWidth: '30px' }}>
                    {Math.round(accidentIntensity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="random-popup-actions">
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button
            className="btn primary"
            onClick={() => {
              if (generationMode === 'ambiance') {
                onValidate({ 
                  ambianceMode: true,
                  ambiance: selectedAmbiance,
                  steps,
                  seed: useSeed ? seed : undefined,
                  happyAccidents,
                  accidentIntensity
                });
              } else {
                onValidate({ 
                  rootNote: root, 
                  scale, 
                  style, 
                  mood, 
                  part, 
                  steps,
                  seed: useSeed ? seed : undefined,
                  happyAccidents,
                  accidentIntensity
                });
              }
            }}
          >Générer</button>
        </div>
      </div>
    </div>
  );
}