"use client";
import React from "react";

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
  currentStep
}) {
  const pianoNotes = getFullPianoNotes(minOctave, maxOctave);

  return (
    <div className="piano-roll">
      <div className="piano-roll-header">
        <div className="steps-control" style={{ opacity: 0.6 }}>
          <button className="btn steps-btn active" data-steps={steps}>{steps} Steps</button>
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
            {Array(steps).fill().map((_, i) => (
              <div
                key={i}
                className={
                  "step-cell" +
                    (pattern[row.note] && pattern[row.note][i] ? " active" : "") +
                    (currentStep === i && pattern[row.note] && pattern[row.note][i] ? " playing" : "")
                }
                onClick={() => onToggleStep(row.note, i)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
