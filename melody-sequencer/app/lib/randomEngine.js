// /app/lib/randomEngine.js

// NOTES ET GAMMES
const NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = {
  major:    [0, 2, 4, 5, 7, 9, 11],
  minor:    [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  // Ajoute tes gammes ici...
};

// Génère la gamme complète sur la plage d'octaves
function getScale(rootNote, scaleType, octaves) {
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

// ===== ALGORITHMES PAR STYLE/PART =====

// BASSLINE = toujours sur la fondamentale !
function basslinePattern({ allNotes, rootNote, steps, mood }) {
  // Prend la fondamentale la plus grave de la gamme
  let idx = allNotes.findIndex(n => n.startsWith(rootNote));
  if (idx === -1) idx = 0;
  let arr = Array(steps).fill(0);
  for (let i = 0; i < steps; i++) {
    if (i % 2 === 0) {
      arr[i] = { on: true, velocity: mood === "punchy" ? 120 : 110 };
    } else if (Math.random() < 0.20 && mood !== "soft") {
      arr[i] = { on: true, velocity: 60 + Math.floor(Math.random() * 40) };
    }
  }
  let pattern = {};
  allNotes.forEach((note, n) => {
    pattern[note] = n === idx ? arr : Array(steps).fill(0);
  });
  return pattern;
}

// MELODY = peut démarrer sur la fondamentale, utilise toute la gamme
function melodyPattern({ allNotes, rootNote, steps, mood, style }) {
  let pattern = {};
  allNotes.forEach(n => { pattern[n] = Array(steps).fill(0); });
  let rootIdx = allNotes.findIndex(n => n.startsWith(rootNote));
  for (let i = 0; i < steps; i++) {
    if (Math.random() > 0.6) continue;
    // Démarre parfois sur la fondamentale, sinon note au hasard dans la gamme
    let idx = (i % 4 === 0 && rootIdx !== -1) ? rootIdx : Math.floor(Math.random() * allNotes.length);
    pattern[allNotes[idx]][i] = { on: true, velocity: 90 + Math.floor(Math.random() * 30) };
  }
  return pattern;
}

// PAD = notes longues, colorées, sur tout le clavier
function padPattern({ allNotes, steps, mood }) {
  let pattern = {};
  allNotes.forEach(n => { pattern[n] = Array(steps).fill(0); });
  let zone = allNotes.slice(Math.floor(allNotes.length / 2));
  for (let i = 0; i < steps; i += 4) {
    let idx = Math.floor(Math.random() * zone.length);
    for (let j = 0; j < 3; j++) {
      if (i + j < steps)
        pattern[zone[idx]][i + j] = { on: true, velocity: 60 + Math.floor(Math.random() * 30) };
    }
  }
  return pattern;
}

// ARPEGGIO = utilise toute la gamme dans l’ordre, monte puis descend
function arpeggioPattern({ allNotes, steps, mood }) {
  let pattern = {};
  allNotes.forEach(n => { pattern[n] = Array(steps).fill(0); });
  let motif = [...allNotes, ...allNotes.slice().reverse()];
  for (let i = 0; i < steps; i++) {
    let idx = i % motif.length;
    pattern[motif[idx]][i] = { on: true, velocity: 95 + Math.floor(Math.random() * 20) };
  }
  return pattern;
}

// Ajoute ici d’autres styles, patterns, etc...

// ===== GENERATEUR PRINCIPAL =====
export function generateMusicalPattern({
  rootNote = "C",
  scale = "major",
  style = "psy-oldschool",
  mood = "default",
  part = "music",
  steps = 16,
  octaves = { min: 3, max: 5 }
}) {
  const allNotes = getScale(rootNote, scale, octaves);

  let pattern = {};
  // Sélectionne l'algo selon le "part" ou "style"
  if (part === "bassline") {
    pattern = basslinePattern({ allNotes, rootNote, steps, mood, style });
  } else if (part === "pad") {
    pattern = padPattern({ allNotes, steps, mood, style });
  } else if (part === "arpeggio" || style.includes("arp")) {
    pattern = arpeggioPattern({ allNotes, steps, mood, style });
  } else {
    // par défaut : melody/music
    pattern = melodyPattern({ allNotes, rootNote, steps, mood, style });
  }

  // Optionnel : variation selon ambiance/mood
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
  if (mood === "dense") {
    // Ajoute des notes aléatoires
    let toAdd = Math.floor(steps * 0.4);
    for (let t = 0; t < toAdd; t++) {
      let n = Math.floor(Math.random() * allNotes.length);
      let s = Math.floor(Math.random() * steps);
      pattern[allNotes[n]][s] = { on: true, velocity: 80 + Math.floor(Math.random() * 47) };
    }
  }

  return pattern;
}
