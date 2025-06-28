"use client";
import React, { useState } from "react";
import { SYNTH_PRESETS } from "../lib/synthPresets";

export default function SynthPopup({ visible, current, onSelect, onCancel }) {
  const [selected, setSelected] = useState(current || SYNTH_PRESETS[0].key);

  if (!visible) return null;

  const preset = SYNTH_PRESETS.find(p => p.key === selected);

  return (
    <div className="random-popup-overlay">
      <div className="random-popup-modal" style={{ minWidth: 400, maxWidth: 550 }}>
        <h3>Choix du son / Edit Synthé</h3>
        <div>
          <label style={{ color: "#00eaff", fontWeight: 500 }}>Preset :</label>
          <select
            value={selected}
            style={{ width: 200, marginLeft: 12 }}
            onChange={e => setSelected(e.target.value)}
          >
            {SYNTH_PRESETS.map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
        <div style={{ margin: "18px 0", color: "#aef" }}>
          {preset?.description}
        </div>
        {/* Plus tard, tu peux ajouter ici des sliders pour modifier les paramètres */}
        <div className="random-popup-actions">
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button className="btn primary" onClick={() => onSelect(selected)}>
            Appliquer ce son
          </button>
        </div>
      </div>
    </div>
  );
}
