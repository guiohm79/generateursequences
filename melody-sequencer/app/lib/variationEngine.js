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

  const rng        = seed !== null ? mulberry32(seed) : Math.random;
  const baseMidi   = new Midi(midiData);
  const baseTrack  = baseMidi.tracks[0];
  const swingTicks = swing ? Math.round(baseMidi.header.ppq * swing * 0.5) : 0;

  const outputs = [];

  for (const semi of transpositions) {
    const out   = new Midi();
    // Note: ppq est une propriété en lecture seule, pas besoin de la définir
    // out.header.ppq est déjà initialisé à 480 par défaut
    const trk   = out.addTrack();

    /* --------- Copie + transformation note par note --------- */
    baseTrack.notes.forEach((note, idx) => {
      const n = { ...note };                         // clone plat

      /* a) transposition */
      n.midi += semi;

      /* b) inversion mélodique éventuelle (miroir autour de root) */
      if (invert) {
        const rootMidi = NOTE_ORDER.indexOf(root) + 12 * Math.floor(n.midi / 12);
        n.midi = rootMidi - (n.midi - rootMidi);
      }

      /* c) swing : croches impaires décalées */
      if (swingTicks && (idx % 2 === 1)) n.ticks += swingTicks;

      trk.addNote(n);
    });

    /* d) rétrogradation (fin → début) */
    if (retrograde) {
      const total = trk.notes[trk.notes.length - 1].ticks;
      trk.notes.forEach(n => { n.ticks = total - n.ticks; });
      trk.notes.reverse();
    }

    /* e) humanisation & quantisation gamme */
    trk.notes.forEach(n => {
      if (humanize) {
        // Éviter les valeurs négatives pour les ticks
        const humanizeAmount = Math.floor((rng() * 2 - 1) * humanize);
        n.ticks = Math.max(0, n.ticks + humanizeAmount); // Assurer que ticks reste positif
        n.velocity = Math.min(1, Math.max(0, n.velocity + (rng() * 0.2 - 0.1)));
      }
      if (keepScale) n.midi = quantizeToScale(n.midi, root, scale);
    });

    outputs.push(out.toArray());
  }

  return outputs;
}
