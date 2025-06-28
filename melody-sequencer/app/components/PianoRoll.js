"use client";
import React, { useRef, useCallback } from "react";

// Génère toutes les notes de minOctave à maxOctave
function getFullPianoNotes(minOctave = 3, maxOctave = 5) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteRows = [];
  for (let octave = maxOctave; octave >= minOctave; octave--) {
    for (let i = notes.length - 1; i >= 0; i--) {
      noteRows.push({
        note: notes[i] + octave,
        isBlack: notes[i].includes("#"),
      });
    }
  }
  return noteRows;
}

export default function PianoRoll({
  minOctave,
  maxOctave,
  steps,
  pattern,
  onToggleStep,
  onChangeVelocity,
  currentStep,
  onChangeSteps // <- callback reçu ici !
}) {
  const pianoNotes = getFullPianoNotes(minOctave, maxOctave);
  const dragInfo = useRef({});

  function handleMouseDown(note, stepIdx, e) {
  e.preventDefault();
  const value = pattern[note][stepIdx];
  let velocity = 100;
  if (value && value.on) {
    velocity = value.velocity || 100;
  }
  dragInfo.current = {
    note,
    stepIdx,
    startY: e.clientY,
    startVelocity: velocity,
    dragged: false, // Pour suivre si on a bougé ou non
    wasActive: !!(value && value.on)
  };
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
}
  // Handlers pour vélocité (inchangés)
    const handleMouseMove = useCallback((e) => {
    const { note, stepIdx, startY, startVelocity } = dragInfo.current;
    if (!note) return;
    let diff = Math.abs(startY - e.clientY);
    if (diff > 2) { // 2 pixels : seuil pour détecter un vrai drag
        dragInfo.current.dragged = true;
        let newVelocity = Math.max(10, Math.min(127, startVelocity + Math.round((startY - e.clientY) / 2)));
        onChangeVelocity(note, stepIdx, newVelocity);
    }
    }, [onChangeVelocity]);

    const handleMouseUp = useCallback((e) => {
    const { note, stepIdx, dragged, wasActive } = dragInfo.current;
    if (note) {
        // Si on n'a pas vraiment bougé, toggle (active/désactive)
        if (!dragged) {
        if (wasActive) {
            // Désactive la note
            onToggleStep(note, stepIdx);
        } else {
            // Active la note avec vélocité 100
            onToggleStep(note, stepIdx);
        }
        }
    }
    dragInfo.current = {};
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    }, [onToggleStep, handleMouseMove]);

  // --- Rendu ---
  return (
    <div className="piano-roll">
      <div className="piano-roll-header">
        <div className="steps-control">
          <button
            className={"btn steps-btn" + (steps === 16 ? " active" : "")}
            onClick={() => onChangeSteps && onChangeSteps(16)}
            disabled={steps === 16}
          >16 Steps</button>
          <button
            className={"btn steps-btn" + (steps === 32 ? " active" : "")}
            onClick={() => onChangeSteps && onChangeSteps(32)}
            disabled={steps === 32}
          >32 Steps</button>
        </div>
        <div className="scale-info" style={{ textAlign: "right" }}>Scale: C Major</div>
      </div>
      {/* Step numbers header */}
      <div className="note-row">
        <div className="note-label" style={{ background: "transparent", border: "none" }}></div>
        {Array(steps).fill().map((_, i) => (
          <div key={i} className="step-header-cell">{i + 1}</div>
        ))}
      </div>
      {/* Piano grid */}
      <div className="piano-grid">
        {pianoNotes.map(row => (
          <div className="note-row" key={row.note}>
            <div className={`note-label${row.isBlack ? " black-key" : ""}`}>{row.note}</div>
            {Array(steps).fill().map((_, i) => {
              const val = pattern[row.note] && pattern[row.note][i];
              const isActive = val && val.on;
              const velocity = isActive ? (val.velocity || 100) : 100;
              const colorIntensity = Math.round((velocity - 10) / 117 * 80 + 20); // 20% à 100%
              return (
                <div
                  key={i}
                  className={
                    "step-cell" +
                    (isActive ? " active" : "") +
                    (currentStep === i && isActive ? " playing" : "")
                  }
                  onMouseDown={e => handleMouseDown(row.note, i, e)}
                  style={{
                    background: isActive
                      ? `rgba(0, 212, 255, ${colorIntensity / 100})`
                      : undefined,
                    cursor: "ns-resize"
                  }}
                  title={isActive ? `Velocity: ${velocity}` : "Click to activate"}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
