"use client";
import React, { useRef } from "react";

// Génère la liste des notes du piano roll
function getAllNotes(minOct, maxOct) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const all = [];
  for (let octave = minOct; octave <= maxOct; octave++) {
    notes.forEach(note => all.push(note + octave));
  }
  return all;
}

export default function PianoRoll({
  minOctave,
  maxOctave,
  steps,
  pattern,
  onToggleStep,
  onChangeVelocity,
  currentStep,
  onChangeSteps,
}) {
  const pianoNotes = getAllNotes(minOctave, maxOctave).reverse();

  // Pour le drag de vélocité
  const dragRef = useRef({ note: null, step: null, startY: null, startVelocity: null });

  function handleMouseDown(note, idx, e) {
    e.preventDefault();
    const cell = pattern[note]?.[idx];
    // Toggle on/off la note : 1 clic active, re-clic désactive (marche tout le temps)
    onToggleStep(note, idx);

    // Drag vertical pour vélocité (seulement si activée après le toggle)
    if (!cell || !cell.on) {
      // la note vient d'être activée, vélocité à 100 par défaut
      dragRef.current = {
        note, step: idx,
        startY: e.clientY,
        startVelocity: 100,
      };
    } else {
      // la note était déjà active
      dragRef.current = {
        note, step: idx,
        startY: e.clientY,
        startVelocity: cell.velocity || 100,
      };
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e) {
    const { note, step, startY, startVelocity } = dragRef.current;
    if (note === null || step === null) return;
    let delta = startY - e.clientY;
    let newVel = Math.min(127, Math.max(20, startVelocity + Math.round(delta * 0.8)));
    onChangeVelocity(note, step, newVel);
  }

  function handleMouseUp() {
    dragRef.current = { note: null, step: null, startY: null, startVelocity: null };
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  return (
    <div className="piano-roll">
      <div className="piano-roll-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div className="steps-control" style={{ display: "flex", gap: 10 }}>
          <button
            className={`btn steps-btn${steps === 16 ? " active" : ""}`}
            onClick={() => onChangeSteps(16)}
          >16 Steps</button>
          <button
            className={`btn steps-btn${steps === 32 ? " active" : ""}`}
            onClick={() => onChangeSteps(32)}
          >32 Steps</button>
        </div>
      </div>
      {/* Header steps avec surbrillance */}
      <div className="note-row step-header-row" style={{ userSelect: "none", position: "sticky", top: 0, zIndex: 2, background: "#191c23" }}>
        <div 
          className="note-label" 
          style={{ 
            background: "transparent", 
            border: "none",
            width: "60px" // Même largeur que les labels de notes (60px)
          }}
        ></div>
        {Array(steps).fill().map((_, i) => (
          <div
            key={i}
            className={`step-header-cell${currentStep === i ? " current-step" : ""}`}
            style={{
              ...(currentStep === i ? {
                background: "#00eaff44",
                color: "#00eaff",
                fontWeight: 700
              } : {}),
              width: "28px", // Même largeur que les cellules
              height: "24px",
              margin: "1px", // Même marge que les cellules
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div
        className="piano-grid"
        style={{
          maxHeight: "65vh", // Augmentation de la hauteur maximale
          overflowY: "auto",
          overflowX: "auto",
          borderRadius: 12, // Bordure plus arrondie
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Ajout d'une ombre
          padding: "4px 0", // Ajout de padding vertical
        }}
      >
{pianoNotes.map(note => (
  <div className="note-row" key={note} style={{ marginBottom: "2px" }}> {/* Espacement entre les rangées */}
    <div 
      className={`note-label${note.includes("#") ? " black-key" : ""}`}
      style={{ 
        width: "60px", // Encore plus large pour les labels de notes
        fontSize: "0.95rem", // Texte légèrement plus grand
        fontWeight: note.includes("#") ? "normal" : "bold", // Notes naturelles en gras
        borderRadius: "6px 0 0 6px", // Coins plus arrondis côté gauche
        display: "flex",
        alignItems: "center", // Centrer verticalement
        justifyContent: "flex-end", // Aligner à droite
        paddingRight: "10px", // Espace à droite
        boxShadow: note.includes("#") ? "inset 0 0 0 1px rgba(255,255,255,0.1)" : "inset 0 0 0 1px rgba(255,255,255,0.2)", // Bordure subtile
        background: note.includes("#") ? "linear-gradient(to right, #1a1c25, #252736)" : "linear-gradient(to right, #252736, #2c2e40)", // Dégradé subtil
        color: note.includes("#") ? "#8af" : "#fff", // Couleur différente pour les dièses
        letterSpacing: "0.5px", // Espacement des lettres
      }}
    >
      {/* Afficher la note de manière plus lisible */}
      <span style={{ fontWeight: "bold" }}>{note.replace(/([0-9])/g, '')}</span>
      <span style={{ opacity: 0.7, fontSize: "0.8em", marginLeft: "2px" }}>
        {note.match(/[0-9]/)?.[0]}
      </span>
    </div>
    {Array(steps).fill().map((_, i) => {
      const cell = pattern[note] && pattern[note][i] !== undefined ? pattern[note][i] : null;
      const vel = cell && cell.on ? (cell.velocity || 100) : null;
      return (
        <div
          key={i}
          className={
            "step-cell" +
            (cell && cell.on ? " active" : "") +
            (currentStep === i && cell && cell.on ? " playing" : "") +
            (currentStep === i ? " current-column" : "") // Nouvelle classe pour la colonne actuelle
          }
          style={{
            ...(cell && cell.on ? {
              background: `linear-gradient(to top, #00eaff ${(vel/127)*100}%, #252736 ${(vel/127)*100}%)`,
              boxShadow: "0 0 8px rgba(0, 234, 255, 0.4)", // Lueur pour les notes actives
            } : {}),
            position: "relative",
            width: "28px", // Cellules plus larges
            height: "28px", // Cellules plus hautes
            margin: "1px", // Marge entre les cellules
            borderRadius: "4px", // Coins arrondis pour les cellules
            transition: "all 0.1s ease", // Animation douce
          }}
          title={vel ? `Vélocité: ${vel}` : ""}
          onMouseDown={e => handleMouseDown(note, i, e)}
        >
          {/* Indicateur de vélocité plus visible */}

        </div>
      );
    })}
  </div>
))}
      </div>
    </div>
  );
}
