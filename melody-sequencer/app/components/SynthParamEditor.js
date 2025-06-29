"use client";
import React, { useState, useEffect } from "react";
import { PresetStorage } from "../lib/presetStorage";

// Types de synthétiseurs supportés par Tone.js
const SYNTH_TYPES = [
  "PolySynth",
  "MonoSynth",
  "FMSynth",
  "AMSynth",
  "DuoSynth"
];

// Types d'oscillateurs
const OSC_TYPES = [
  "sine",
  "square", 
  "triangle",
  "sawtooth"
];

export default function SynthParamEditor({ preset, onChange }) {
  const [params, setParams] = useState({
    ...preset,
    options: {
      oscillator: { ...preset.options.oscillator },
      envelope: { ...preset.options.envelope },
    }
  });
  
  const [labelInput, setLabelInput] = useState(preset.label);
  const [descInput, setDescInput] = useState(preset.description);
  
  // Mettre à jour les paramètres locaux
  const updateParams = (newParams) => {
    const updatedParams = { ...params, ...newParams };
    setParams(updatedParams);
    
    if (onChange) onChange(updatedParams);
  };
  
  // Mettre à jour un paramètre imbriqué
  const updateNestedParam = (category, param, value) => {
    setParams(prev => {
      const updated = { 
        ...prev, 
        options: { 
          ...prev.options,
          [category]: {
            ...prev.options[category],
            [param]: value
          }
        }
      };
      
      if (onChange) onChange(updated);
      return updated;
    });
  };

  // Mettre à jour les métadonnées (label, description)
  const updateMetadata = () => {
    const updated = {
      ...params,
      label: labelInput,
      description: descInput
    };
    setParams(updated);
    if (onChange) onChange(updated);
  };
  
  // Gestion du changement de type de synthétiseur
  const handleSynthTypeChange = (e) => {
    updateParams({ synthType: e.target.value });
  };
  
  // Gestion du changement de type d'oscillateur
  const handleOscTypeChange = (e) => {
    updateNestedParam('oscillator', 'type', e.target.value);
  };
  
  // Exécuter updateMetadata quand les entrées changent
  useEffect(() => {
    updateMetadata();
  }, [labelInput, descInput]);

  return (
    <div className="synth-param-editor">
      <div className="editor-section">
        <h4>Information du Preset</h4>
        <div className="param-row">
          <label htmlFor="presetName">Nom:</label>
          <input 
            id="presetName"
            type="text" 
            value={labelInput} 
            onChange={e => setLabelInput(e.target.value)} 
          />
        </div>
        <div className="param-row">
          <label htmlFor="presetDesc">Description:</label>
          <input 
            id="presetDesc"
            type="text" 
            value={descInput} 
            onChange={e => setDescInput(e.target.value)} 
          />
        </div>
        <div className="param-row">
          <label htmlFor="synthType">Type:</label>
          <select 
            id="synthType"
            value={params.synthType} 
            onChange={handleSynthTypeChange}
          >
            {SYNTH_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="editor-section">
        <h4>Oscillateur</h4>
        <div className="param-row">
          <label htmlFor="oscType">Type:</label>
          <select 
            id="oscType"
            value={params.options.oscillator?.type || 'sine'} 
            onChange={handleOscTypeChange}
          >
            {OSC_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="editor-section">
        <h4>Enveloppe ADSR</h4>
        <div className="envelope-controls">
          <div className="param-slider">
            <label htmlFor="attack">Attaque</label>
            <input
              id="attack"
              type="range"
              min="0.001"
              max="2"
              step="0.001"
              value={params.options.envelope?.attack || 0.01}
              onChange={(e) => updateNestedParam('envelope', 'attack', parseFloat(e.target.value))}
            />
            <span>{(params.options.envelope?.attack || 0).toFixed(3)}s</span>
          </div>
          
          <div className="param-slider">
            <label htmlFor="decay">Decay</label>
            <input
              id="decay"
              type="range"
              min="0.001"
              max="2"
              step="0.001"
              value={params.options.envelope?.decay || 0.1}
              onChange={(e) => updateNestedParam('envelope', 'decay', parseFloat(e.target.value))}
            />
            <span>{(params.options.envelope?.decay || 0).toFixed(3)}s</span>
          </div>
          
          <div className="param-slider">
            <label htmlFor="sustain">Sustain</label>
            <input
              id="sustain"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={params.options.envelope?.sustain || 0.5}
              onChange={(e) => updateNestedParam('envelope', 'sustain', parseFloat(e.target.value))}
            />
            <span>{(params.options.envelope?.sustain || 0).toFixed(2)}</span>
          </div>
          
          <div className="param-slider">
            <label htmlFor="release">Release</label>
            <input
              id="release"
              type="range"
              min="0.001"
              max="4"
              step="0.001"
              value={params.options.envelope?.release || 0.5}
              onChange={(e) => updateNestedParam('envelope', 'release', parseFloat(e.target.value))}
            />
            <span>{(params.options.envelope?.release || 0).toFixed(3)}s</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .synth-param-editor {
          background: #1a1a2a;
          border-radius: 8px;
          padding: 20px;
          margin: 10px 0;
        }
        .editor-section {
          margin-bottom: 20px;
          border-bottom: 1px solid #333;
          padding-bottom: 15px;
        }
        .editor-section:last-child {
          border-bottom: none;
        }
        .param-row {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .param-row label {
          width: 120px;
          color: #00eaff;
        }
        .param-row input[type="text"],
        .param-row select {
          flex: 1;
          background: #2a2a3a;
          border: 1px solid #444;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
        }
        .envelope-controls {
          display: grid;
          grid-template-columns: 1fr;
          gap: 15px;
        }
        .param-slider {
          display: flex;
          align-items: center;
        }
        .param-slider label {
          width: 70px;
          color: #00eaff;
        }
        .param-slider input {
          flex: 1;
          margin: 0 10px;
        }
        .param-slider span {
          width: 50px;
          text-align: right;
          color: #aef;
        }
        h4 {
          margin: 0 0 15px 0;
          color: #4db6ff;
        }
      `}</style>
    </div>
  );
}
