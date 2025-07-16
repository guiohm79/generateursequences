// variationEngine.js – fabrique de variantes MIDI (2025-07-04)
// Dépendances : @tonejs/midi  &  randomEngine.js (pour mulberry32, SCALES, NOTE_ORDER)

import { Midi } from '@tonejs/midi';
import { mulberry32, SCALES, NOTE_ORDER } from './randomEngine.js';

/* ------------------------------------------------------------------ *
 *  Outils gamme : quantisation au degré le + proche
 * ------------------------------------------------------------------ */
function quantizeToScale(midi, root = 'C', scale = 'minor') {
  const rootIdx  = NOTE_ORDER.indexOf(root);
  const formula  = SCALES[scale] ?? SCALES.minor;
  const pitchRel = ((midi - rootIdx) % 12 + 12) % 12;           // 0-11

  let best = formula[0], dist = 12;
  for (const step of formula) {
    const d = Math.abs(step - pitchRel);
    if (d < dist) { dist = d; best = step; }
  }
  return midi + (best - pitchRel);
}

/* ------------------------------------------------------------------ *
 *  API : generateVariations
 * ------------------------------------------------------------------ */
/**
 * @typedef {Object} VariationOptions
 * @property {number[]} [transpositions]  Liste de ± demi-tons (ex : [-12,0,7])
 * @property {number}   [swing]           0–1  Décalage des croches impaires
 * @property {number}   [humanize]        Max ms de jitter timing / vélocité
 * @property {boolean}  [retrograde]      Inversion temporelle
 * @property {boolean}  [invert]          Miroir mélodique autour de la tonique
 * @property {number}   [seed]            Graine du PRNG (reproductible)
 * @property {string}   [root]            Racine de gamme ('C', 'F#'…)
 * @property {string}   [scale]           Nom de gamme (major, perso…)
 * @property {boolean}  [keepScale]       Quantise chaque note à la gamme
 */

/**
 * Génère n variantes d’un MIDI.
 * @param {ArrayBuffer}   midiData  Données brutes du .mid
 * @param {VariationOptions} opts   Options
 * @returns {Array<ArrayBuffer>}    Tableau d’ArrayBuffers MIDI
 */
/**
 * Génère n variantes d'un MIDI avec de meilleures transformations.
 * @param {ArrayBuffer}   midiData  Données brutes du .mid
 * @param {VariationOptions} opts   Options
 * @returns {Array<ArrayBuffer>}    Tableau d'ArrayBuffers MIDI
 */
/**
 * Analyse la structure rythmique d'une séquence pour un swing plus intelligent
 */
function analyzeRhythmicStructure(notes, ppq) {
  const grid = ppq / 4; // Division en seizièmes
  const pattern = {};
  
  notes.forEach(note => {
    const gridPosition = Math.round(note.ticks / grid);
    if (!pattern[gridPosition]) {
      pattern[gridPosition] = [];
    }
    pattern[gridPosition].push(note);
  });
  
  return pattern;
}

/**
 * Applique une humanisation plus sophistiquée basée sur la position rythmique
 */
function applyContextualHumanization(note, index, allNotes, rng, amountInTicks) {
  const result = { ...note };
  
  // Humanisation basée sur la position dans la phrase
  const phrasePosition = index / allNotes.length;
  const timingFactor = 1 - (phrasePosition * 0.3); // Les notes tardives sont plus "lâches"
  
  // Timing (amount est déjà en ticks)
  const timingVariation = (rng() - 0.5) * amountInTicks * timingFactor;
  result.ticks = Math.max(0, result.ticks + timingVariation);
  
  // Vélocité avec tendance légèrement décroissante
  const velocityBase = result.velocity * (1 - phrasePosition * 0.1);
  const velocityVariation = (rng() - 0.5) * 0.15;
  result.velocity = Math.min(1, Math.max(0.1, velocityBase + velocityVariation));
  
  // Légère humanisation de la durée
  const durationVariation = (rng() - 0.5) * 0.1;
  result.duration = Math.max(0.05, result.duration + durationVariation);
  
  return result;
}

export function generateVariations(midiData, opts = {}) {
  const {
    transpositions = [0],
    swing          = 0,
    humanize       = 0,
    retrograde     = false,
    invert         = false,
    seed           = null,
    root           = 'C',
    scale          = 'minor',
    keepScale      = false
  } = opts;

  // Validation des données d'entrée
  if (!midiData || (midiData instanceof ArrayBuffer && midiData.byteLength === 0)) {
    throw new Error('Données MIDI invalides ou vides');
  }

  const rng = seed !== null ? mulberry32(seed) : Math.random;
  let baseMidi;
  
  try {
    baseMidi = new Midi(midiData);
  } catch (error) {
    throw new Error('Impossible de parser les données MIDI: ' + error.message);
  }

  if (!baseMidi.tracks || baseMidi.tracks.length === 0) {
    throw new Error('Aucune piste trouvée dans le fichier MIDI');
  }

  const baseTrack = baseMidi.tracks[0];
  if (!baseTrack.notes || baseTrack.notes.length === 0) {
    throw new Error('Aucune note trouvée dans la piste MIDI');
  }

  const swingTicks = swing ? Math.round(baseMidi.header.ppq * swing * 0.5) : 0;
  const outputs = [];

  for (const semi of transpositions) {
    const out = new Midi();
    const trk = out.addTrack();

    // Créer une copie profonde des notes avec métadonnées
    const transformedNotes = baseTrack.notes.map((note, idx) => ({
      ...note,
      originalIndex: idx,
      originalTicks: note.ticks,
      originalMidi: note.midi
    }));

    // 1. Transposition (avant inversion pour des résultats plus musicaux)
    transformedNotes.forEach(n => {
      n.midi += semi;
    });

    // 2. Inversion mélodique (basée sur la transposition)
    if (invert) {
      const rootMidi = NOTE_ORDER.indexOf(root) + 12 * Math.floor(transformedNotes[0].midi / 12);
      transformedNotes.forEach(n => {
        n.midi = rootMidi - (n.midi - rootMidi);
      });
    }

    // 3. Quantisation à la gamme (après transposition et inversion)
    if (keepScale) {
      transformedNotes.forEach(n => {
        n.midi = quantizeToScale(n.midi, root, scale);
      });
    }

    // 4. Swing (amélioré avec une approche plus musicale)
    if (swingTicks) {
      transformedNotes.forEach((n, idx) => {
        // Applique le swing uniquement aux notes sur les temps faibles
        const beatPosition = n.ticks % (baseMidi.header.ppq * 4);
        const sixteenthPosition = beatPosition % (baseMidi.header.ppq / 4);
        
        // Swing sur les double-croches impaires
        if (Math.abs(sixteenthPosition - (baseMidi.header.ppq / 8)) < 10) {
          n.ticks += swingTicks;
        }
      });
    }

    // 5. Humanisation (avec fonction contextuelle)
    if (humanize) {
      // Convertir les millisecondes en ticks MIDI
      const ppq = baseMidi.header.ppq || 480;
      const bpmReference = 120;
      const msToTicks = (ppq * bpmReference) / (60 * 1000);
      const humanizeInTicks = humanize * msToTicks;
      
      transformedNotes.forEach((n, idx) => {
        const humanizedNote = applyContextualHumanization(n, idx, transformedNotes, rng, humanizeInTicks);
        Object.assign(n, humanizedNote);
      });
    }

    // 6. Rétrogradation (en dernier pour préserver le timing)
    if (retrograde) {
      if (transformedNotes.length > 0) {
        const lastNote = transformedNotes[transformedNotes.length - 1];
        const totalDuration = lastNote.ticks + lastNote.duration;
        
        transformedNotes.forEach(n => {
          n.ticks = totalDuration - n.ticks - n.duration;
        });
        
        transformedNotes.reverse();
      }
    }

    // Ajouter les notes transformées à la piste
    transformedNotes.forEach(n => {
      // Nettoyer les métadonnées avant d'ajouter la note
      const cleanNote = { ...n };
      delete cleanNote.originalIndex;
      delete cleanNote.originalTicks;
      delete cleanNote.originalMidi;
      
      trk.addNote(cleanNote);
    });

    outputs.push(out.toArray());
  }

  return outputs;
}