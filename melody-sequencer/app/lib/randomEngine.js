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
// ... (définitions des constantes NOTE_ORDER, SCALES, et fonction getScale inchangées) ...

// ===== ALGORITHMES DE PATTERN SELON STYLE/PART =====

// BASSLINE – Patterns de basse en fonction du style
function basslinePattern({ allNotes, rootNote, steps, mood, style }) {
  // Index de la fondamentale dans allNotes (première occurrence, plus grave)
  let rootIdx = allNotes.findIndex(n => n.startsWith(rootNote));
  if (rootIdx === -1) rootIdx = 0;
  // Tableau initial de la ligne de basse (tous pas à off = 0)
  let bassArray = Array(steps).fill(0);

  if (style === "psy-oldschool" || style === "goa") {
    // Pattern psytrance/goa : basse roulante sur toutes les doubles-croches sauf le kick
    for (let i = 0; i < steps; i++) {
      if (i % 4 === 0) {
        // Silence sur chaque temps fort (kick)
        bassArray[i] = 0;
      } else {
        // Note de basse sur les 3 autres pas
        let velocity = (i % 4 === 1) 
          ? (mood === "punchy" ? 127 : 120)   // accent sur la première note après le kick
          : 100;
        // En mode "soft", on peut omettre la troisième note de chaque groupe de 3 pour adoucir
        if (mood === "soft" && i % 4 === 3) {
          bassArray[i] = 0;
        } else {
          bassArray[i] = { on: true, velocity };
        }
      }
    }
  } else if (style === "prog") {
    // Pattern progressive : basse sur les contretemps (off-beat 1/8)
    for (let i = 0; i < steps; i++) {
      if (i % 4 === 2) {
        // Note sur le "et" du temps (2ème double-croche de chaque temps)
        let velocity = (mood === "punchy" ? 127 : 110);
        bassArray[i] = { on: true, velocity };
      }
    }
  } else {
    // Pattern par défaut : notes sur chaque temps 1/8, avec quelques variations aléatoires
    for (let i = 0; i < steps; i++) {
      if (i % 2 === 0) {
        // Note sur chaque temps pair (0,2,4...): pulse régulière
        bassArray[i] = { on: true, velocity: mood === "punchy" ? 120 : 110 };
      } else if (Math.random() < 0.2 && mood !== "soft") {
        // 20% de chances de placer une note faible sur un off-beat impair
        bassArray[i] = { on: true, velocity: 60 + Math.floor(Math.random() * 40) };
      }
    }
  }

  // Construction de l'objet pattern : seule la note fondamentale reçoit le motif de basse
  let pattern = {};
  allNotes.forEach((note, idx) => {
    pattern[note] = (idx === rootIdx) ? bassArray : Array(steps).fill(0);
  });
  return pattern;
}

// MELODY/LEAD – Pattern psytrance oldschool
function psyOldschoolPattern({ allNotes, rootNote, steps, mood }) {
  // Trouver la fondamentale dans plusieurs octaves pour ancrer la mélodie
  let rootIndices = [];
  allNotes.forEach((n, i) => { if (n.startsWith(rootNote)) rootIndices.push(i); });
  // Choisir la fondamentale à l'octave médiane si possible (sinon la plus grave)
  let baseRootIdx = rootIndices.length > 1 ? rootIndices[1] : rootIndices[0];
  // Préparer le pattern vide (toutes notes off)
  let pattern = {};
  allNotes.forEach(n => { pattern[n] = Array(steps).fill(0); });

  // Longueur du motif mélodique : une mesure (16) ; si 32 pas, on répétera ce motif
  let motifLength = (steps >= 32 ? 16 : steps);
  let motifNotes = [];  // stocker les indices de note utilisés dans le motif
  let currentIdx = baseRootIdx;  // position courante dans allNotes

  for (let i = 0; i < motifLength; i++) {
    // Décider si une note est jouée à ce pas
    if (i === 0 || Math.random() > 0.4) {
      // Toujours jouer au début, puis ~60% de chances de jouer aux autres pas
      if (i === 0) {
        currentIdx = baseRootIdx;  // démarrer sur la fondamentale
      } else {
        // Marche aléatoire restreinte : déplacement de -2 à +2 degrés par rapport à la note précédente
        let stepOptions = [-2, -1, 0, 1, 2];
        let step = stepOptions[Math.floor(Math.random() * stepOptions.length)];
        let newIdx = currentIdx + step;
        // Clamping aux bornes de l'échelle
        if (newIdx < 0) newIdx = 0;
        if (newIdx >= allNotes.length) newIdx = allNotes.length - 1;
        currentIdx = newIdx;
        // Parfois, effectuer un saut aléatoire vers la fondamentale pour varier
        if (Math.random() < 0.1) {
          currentIdx = baseRootIdx;
        }
      }
      // Activer la note dans le pattern avec vélocité aléatoire (90–119)
      pattern[allNotes[currentIdx]][i] = { on: true, velocity: 90 + Math.floor(Math.random() * 30) };
      motifNotes.push(currentIdx);
    } else {
      motifNotes.push(null);  // pas de note (silence)
    }
  }

  // Si on a généré un motif plus court que le total des pas, répéter le motif sur la suite
  if (motifLength < steps) {
    for (let i = motifLength; i < steps; i++) {
      let m = motifNotes[i % motifLength];
      if (m !== null) {
        pattern[allNotes[m]][i] = { on: true, velocity: 90 + Math.floor(Math.random() * 30) };
      }
    }
  }
  return pattern;
}

// MELODY/LEAD – Pattern Goa trance
function goaPattern({ allNotes, rootNote, steps, mood }) {
  // Similaire à psyOldschoolPattern mais avec motif plus court et densité plus élevée
  let rootIndices = [];
  allNotes.forEach((n, i) => { if (n.startsWith(rootNote)) rootIndices.push(i); });
  let baseRootIdx = rootIndices.length > 1 ? rootIndices[1] : rootIndices[0];
  let pattern = {};
  allNotes.forEach(n => { pattern[n] = Array(steps).fill(0); });

  // Motif court (8 pas si possible) pour répétition rapide
  let motifLength = (steps >= 16 ? 8 : steps);
  let motifNotes = [];
  let currentIdx = baseRootIdx;

  for (let i = 0; i < motifLength; i++) {
    if (i === 0 || Math.random() > 0.1) {
      // ~90% de chances de jouer une note (presque continu)
      if (i === 0) {
        currentIdx = baseRootIdx;
      } else {
        // Marche aléatoire avec pas -2 à +2
        let step = Math.floor(Math.random() * 5) - 2;
        let newIdx = currentIdx + step;
        if (newIdx < 0) newIdx = 0;
        if (newIdx >= allNotes.length) newIdx = allNotes.length - 1;
        currentIdx = newIdx;
        // À 15% de chances, saut abrupt vers une note aléatoire (variation forte)
        if (Math.random() < 0.15) {
          currentIdx = Math.floor(Math.random() * allNotes.length);
        }
      }
      // Activer la note (vélocité un peu plus élevée 95–126 pour un son perçant)
      pattern[allNotes[currentIdx]][i] = { on: true, velocity: 95 + Math.floor(Math.random() * 32) };
      motifNotes.push(currentIdx);
    } else {
      motifNotes.push(null);
    }
  }

  // Répéter le motif sur toute la durée
  for (let i = motifLength; i < steps; i++) {
    let m = motifNotes[i % motifLength];
    if (m !== null) {
      pattern[allNotes[m]][i] = { on: true, velocity: 95 + Math.floor(Math.random() * 32) };
    }
  }
  return pattern;
}

// MELODY/LEAD – Pattern Progressive/Deep
function progressivePattern({ allNotes, rootNote, steps, mood }) {
  let pattern = {};
  allNotes.forEach(n => { pattern[n] = Array(steps).fill(0); });
  // Trouver la fondamentale et la quinte (5ème) dans l'octave moyenne
  let rootIndices = [];
  allNotes.forEach((n, i) => { if (n.startsWith(rootNote)) rootIndices.push(i); });
  let midRootIdx = rootIndices.length > 1 ? rootIndices[1] : rootIndices[0];
  let fifthIdx = (midRootIdx + 4 < allNotes.length) ? midRootIdx + 4 : midRootIdx;
  
  // Placer la fondamentale sur les débuts de mesure (0, et 16 si 32 pas)
  pattern[allNotes[midRootIdx]][0] = { on: true, velocity: 100 };
  if (steps >= 32) {
    pattern[allNotes[midRootIdx]][16] = { on: true, velocity: 100 };
  }
  // Placer la quinte sur le milieu de chaque mesure (ex: 8, et 24 si 32)
  let midPoint = Math.floor(steps / 2);
  if (midPoint > 0 && midPoint < steps) {
    pattern[allNotes[fifthIdx]][midPoint] = { on: true, velocity: 100 };
  }

  // Notes d'approche avant les anchors : 
  if (steps >= 16) {
    if (steps >= 32) {
      // Note de lead-in à la fin de la 1ère mesure (pas 15) et 2ème mesure (pas 31)
      let leadIdx = (midRootIdx > 0) ? midRootIdx - 1 : midRootIdx;
      pattern[allNotes[leadIdx]][15] = { on: true, velocity: 90 };
      pattern[allNotes[leadIdx]][31] = { on: true, velocity: 90 };
    } else {
      // Sur 16 pas, note d'approche à la fin de la demi-mesure (pas 7) avant la quinte du pas 8
      let leadIdx = (fifthIdx > 0) ? fifthIdx - 1 : fifthIdx;
      pattern[allNotes[leadIdx]][7] = { on: true, velocity: 90 };
    }
  }

  // Ajouter quelques notes de passage aléatoires dans les espaces vides (environ 20% des cases vides)
  for (let i = 0; i < steps; i++) {
    // Vérifier si aucune note n'est active à ce pas
    let anyOn = Object.values(pattern).some(row => row[i] && row[i].on);
    if (!anyOn && Math.random() < 0.2) {
      // Choisir une note près de la fondamentale (±2 degrés) pour la note de passage
      let offset = (Math.random() < 0.5 ? 2 : -2);
      let noteIdx = midRootIdx + offset;
      if (noteIdx < 0) noteIdx = 0;
      if (noteIdx >= allNotes.length) noteIdx = allNotes.length - 1;
      pattern[allNotes[noteIdx]][i] = { on: true, velocity: 80 + Math.floor(Math.random() * 20) };
    }
  }
  return pattern;
}

// PAD – Pattern de pad (notes longues colorées)
function padPattern({ allNotes, steps, mood, style }) {
  let pattern = {};
  allNotes.forEach(n => { pattern[n] = Array(steps).fill(0); });
  // Déterminer la zone d'octave supérieure (on prend la moitié haute des notes disponibles)
  let halfIndex = Math.floor(allNotes.length / 2);
  let zone = allNotes.slice(halfIndex);
  // Pas de base pour le pad selon style : par défaut 4, en progressive on allonge à 8 (géré plus bas)
  let stepInterval = 4;
  let holdDuration = 3;
  // (On gèrera le cas style==="prog" différemment via generateMusicalPattern pour plus de contrôle)
  for (let i = 0; i < steps; i += stepInterval) {
    let note = zone[Math.floor(Math.random() * zone.length)];
    for (let j = 0; j < holdDuration && (i + j) < steps; j++) {
      pattern[note][i + j] = { on: true, velocity: 60 + Math.floor(Math.random() * 30) };
    }
  }
  return pattern;
}

// ARPEGGIO – Pattern arpège montant puis descendant sur la gamme
function arpeggioPattern({ allNotes, steps, mood, style }) {
  let pattern = {};
  allNotes.forEach(n => { pattern[n] = Array(steps).fill(0); });
  // Construire le motif: notes de la gamme ascendantes + descendantes
  let motif = [...allNotes, ...allNotes.slice().reverse()];
  for (let i = 0; i < steps; i++) {
    let idx = i % motif.length;
    pattern[motif[idx]][i] = { on: true, velocity: 95 + Math.floor(Math.random() * 20) };
  }
  return pattern;
}

// ===== GÉNÉRATEUR PRINCIPAL =====
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

  // Sélection de l'algo en fonction de la partie et du style
  if (part === "bassline") {
    pattern = basslinePattern({ allNotes, rootNote, steps, mood, style });
  } else if (part === "pad") {
    if (style === "prog") {
      // Pattern pad spécial pour progressive : notes plus longues (changent toutes les 8 doubles-croches)
      pattern = {};
      allNotes.forEach(n => { pattern[n] = Array(steps).fill(0); });
      for (let i = 0; i < steps; i += 8) {
        // Choisir une note dans la zone haute
        let halfIndex = Math.floor(allNotes.length / 2);
        let note = allNotes[Math.floor(Math.random() * (allNotes.length - halfIndex)) + halfIndex];
        for (let j = 0; j < 7 && (i + j) < steps; j++) {
          pattern[note][i + j] = { on: true, velocity: 60 + Math.floor(Math.random() * 30) };
        }
      }
    } else {
      pattern = padPattern({ allNotes, steps, mood, style });
    }
  } else if (part === "arpeggio" || style.includes("arp")) {
    pattern = arpeggioPattern({ allNotes, steps, mood, style });
  } else {
    // Mélodie/Lead par style
    if (style === "psy-oldschool") {
      pattern = psyOldschoolPattern({ allNotes, rootNote, steps, mood });
    } else if (style === "goa") {
      pattern = goaPattern({ allNotes, rootNote, steps, mood });
    } else if (style === "prog") {
      pattern = progressivePattern({ allNotes, rootNote, steps, mood });
    } else {
      // Style non spécifique : pattern mélodique par défaut
      pattern = melodyPattern({ allNotes, rootNote, steps, mood, style });
    }
  }

  // Post-traitement selon l'ambiance (mood)
  if (mood === "dark") {
    // Réduire les vélocités pour un rendu plus sombre
    Object.keys(pattern).forEach(note => {
      pattern[note] = pattern[note].map(cell =>
        cell && cell.on ? { ...cell, velocity: Math.max(40, cell.velocity - 30) } : cell
      );
    });
  }
  if (mood === "uplifting") {
    // Augmenter légèrement les vélocités pour plus de brillance
    Object.keys(pattern).forEach(note => {
      pattern[note] = pattern[note].map(cell =>
        cell && cell.on ? { ...cell, velocity: Math.min(127, cell.velocity + 10) } : cell
      );
    });
  }
  if (mood === "dense") {
    // Ajouter aléatoirement ~40% de notes en plus pour densifier le pattern
    let toAdd = Math.floor(steps * 0.4);
    for (let t = 0; t < toAdd; t++) {
      let n = Math.floor(Math.random() * allNotes.length);
      let s = Math.floor(Math.random() * steps);
      pattern[allNotes[n]][s] = { on: true, velocity: 80 + Math.floor(Math.random() * 47) };
    }
  }

  return pattern;
}
