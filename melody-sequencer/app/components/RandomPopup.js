"use client";
import React, { useState } from "react";

const STYLES = [
  { key: "arp", label: "Arpège (ascendant/descendant)" },
  { key: "bass", label: "Bassline trance/psy" },
  { key: "lead", label: "Lead simple (oscillant)" },
  { key: "pads", label: "Pad doux" },
  { key: "random", label: "Aléatoire classique" }
];

export default function RandomPopup({ visible, onValidate, onCancel }) {
  const [selected, setSelected] = useState(STYLES[0].key);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100
      }}
    >
      <div
        style={{
          background: "#23232a",
          border: "2px solid #00d4ff",
          borderRadius: 20,
          boxShadow: "0 6px 40px #000a",
          minWidth: 340,
          padding: 32
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 18, fontSize: 22, color: "#00d4ff" }}>
          Générer un pattern aléatoire
        </h3>
        <div style={{ marginBottom: 24 }}>
          {STYLES.map(style => (
            <label key={style.key} style={{ display: "block", margin: "10px 0", cursor: "pointer" }}>
              <input
                type="radio"
                name="randomType"
                value={style.key}
                checked={selected === style.key}
                onChange={() => setSelected(style.key)}
                style={{ marginRight: 8 }}
              />
              {style.label}
            </label>
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <button className="btn" style={{ marginRight: 10 }} onClick={onCancel}>Annuler</button>
          <button className="btn primary" onClick={() => onValidate(selected)}>Générer</button>
        </div>
      </div>
    </div>
  );
}
