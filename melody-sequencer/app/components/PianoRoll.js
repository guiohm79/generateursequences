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
        <div className="note-label" style={{ background: "transparent", border: "none" }}></div>
        {Array(steps).fill().map((_, i) => (
          <div
            key={i}
            className={`step-header-cell${currentStep === i ? " current-step" : ""}`}
            style={currentStep === i ? {
              background: "#00eaff44",
              color: "#00eaff",
              fontWeight: 700
            } : {}}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div
        className="piano-grid"
        style={{
          maxHeight: "56vh",
          overflowY: "auto",
          overflowX: "auto",
          borderRadius: 8,
        }}
      >
{pianoNotes.map(note => (
  <div className="note-row" key={note}>
    <div className={`note-label${note.includes("#") ? " black-key" : ""}`}>{note}</div>
    {Array(steps).fill().map((_, i) => {
      const cell = pattern[note] && pattern[note][i] !== undefined ? pattern[note][i] : 0;
      const vel = cell && cell.on ? (cell.velocity || 100) : null;
      return (
        <div
          key={i}
          className={
            "step-cell" +
            (cell && cell.on ? " active" : "") +
            (currentStep === i && cell && cell.on ? " playing" : "")
          }
          style={cell && cell.on ? {
            background: `linear-gradient(to top, #00eaff ${(vel/127)*100}%, #252736 ${(vel/127)*100}%)`,
            position: "relative"
          } : { position: "relative" }}
          title={vel ? `Vel: ${vel}` : ""}
          onMouseDown={e => handleMouseDown(note, i, e)}
        >
          {/* Affiche la barre de vélocité SEULEMENT si la note est active */}

        </div>
      );
    })}
  </div>
))}

      </div>
    </div>
  );
}
