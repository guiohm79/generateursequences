// /app/lib/randomEngine.js

// Génère une gamme à partir de la fondamentale et du type
function getScale(rootNote, scaleType, octaves) {
  // Gammes simples, tu peux en ajouter (phrygian, harmonic minor, etc.)
  const SCALES = {
    major:    [0, 2, 4, 5, 7, 9, 11],
    minor:    [0, 2, 3, 5, 7, 8, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
  };
  const NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let rootIdx = NOTE_ORDER.indexOf(rootNote);
  let scaleFormula = SCALES[scaleType] || SCALES["major"];
  let allNotes = [];
  for (let octave = octaves.min; octave <= octaves.max; octave++) {
    for (let i = 0; i < scaleFormula.length; i++) {
      let noteIdx = (rootIdx + scaleFormula[i]) % 12;
      let noteName = NOTE_ORDER[noteIdx] + octave;
      allNotes.push(noteName);
    }
  }
  return allNotes;
}

// Générateur principal
export function generateMusicalPattern({ 
  rootNote = "C", 
  scale = "major", 
  style = "psy-oldschool", 
  mood = "default", 
  part = "music", 
  steps = 16, 
  octaves = { min: 3, max: 5 } 
}) {
  // Génère toutes les notes possibles dans la grille (pour le piano roll)
  const allNotes = getScale(rootNote, scale, octaves);
  // Création du pattern vide
  let pattern = {};
  allNotes.forEach(n => { pattern[n] = Array(steps).fill(0); });

  // --- Styles (exemples, à enrichir selon tes envies) ---
  if (part === "bassline" && style.startsWith("psy")) {
    // Bassline typique : fondamentale sur chaque step pair, ghost note possible
    // Cherche la note correspondant à rootNote et l'octave le plus grave
    let idx = allNotes.findIndex(n => n.startsWith(rootNote));
    if (idx === -1) idx = 0; // fallback si la fondamentale est absente (très rare)

for (let i = 0; i < steps; i++) {
  if (i % 2 === 0) {
    pattern[allNotes[idx]][i] = { on: true, velocity: mood === "punchy" ? 120 : 110 };
  } else if (Math.random() < 0.22 && mood !== "soft") {
    pattern[allNotes[idx]][i] = { on: true, velocity: 60 + Math.floor(Math.random() * 40) };
  }
}

  }
  else if (part === "music" || part === "melody") {
    // Motif oscillant, répétitif, style psy/goa
    let motifLength = style === "goa" ? 8 : 4;
    let motifNotes = [];
    for (let i = 0; i < motifLength; i++) {
      let idx = Math.floor(Math.random() * allNotes.length);
      motifNotes.push(idx);
    }
    for (let i = 0; i < steps; i++) {
      if (Math.random() > (mood === "dense" ? 0.2 : 0.6)) {
        let idx = motifNotes[i % motifLength];
        pattern[allNotes[idx]][i] = { on: true, velocity: 80 + Math.floor(Math.random() * 40) };
      }
    }
  }
  else if (part === "pad") {
    // Pads : notes longues et douces sur plusieurs steps
    let zone = allNotes.slice(Math.floor(allNotes.length / 2));
    for (let i = 0; i < steps; i += 4) {
      let idx = Math.floor(Math.random() * zone.length);
      for (let j = 0; j < 3; j++) {
        if (i + j < steps) pattern[zone[idx]][i + j] = { on: true, velocity: 60 + Math.floor(Math.random() * 30) };
      }
    }
  }
  // Ajoute d’autres styles/ambiances ici…

  // Optionnel : variation mood
  if (mood === "dark") {
    Object.keys(pattern).forEach(note =>
      pattern[note] = pattern[note].map(cell =>
        cell && cell.on ? { ...cell, velocity: Math.max(40, cell.velocity - 30) } : cell
      )
    );
  }
  if (mood === "uplifting") {
    Object.keys(pattern).forEach(note =>
      pattern[note] = pattern[note].map(cell =>
        cell && cell.on ? { ...cell, velocity: Math.min(127, cell.velocity + 10) } : cell
      )
    );
  }

  // Retourne le pattern complet (prêt à setPattern)
  return pattern;
}
