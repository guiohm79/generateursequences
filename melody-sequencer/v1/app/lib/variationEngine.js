// variationEngine.js – fabrique de variantes MIDI (2025-07-04)
// Dépendances : @tonejs/midi  &  randomEngine.js (pour mulberry32, SCALES, NOTE_ORDER)

import { Midi } from '@tonejs/midi';
import { mulberry32, getAvailableScales, NOTE_ORDER } from './randomEngine.js';

/* ------------------------------------------------------------------ *
 *  Outils gamme : quantisation au degré le + proche
 * ------------------------------------------------------------------ */
function quantizeToScale(midi, root = 'C', scale = 'minor') {
  const rootIdx  = NOTE_ORDER.indexOf(root);
  const scales = getAvailableScales();
  const formula  = scales[scale] ?? scales.minor ?? [0,2,3,5,7,8,10]; // fallback to minor scale
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
  
  // Timing : modifier directement TIME au lieu de ticks
  const ppq = 480;
  const timingVariationTicks = (rng() - 0.5) * amountInTicks * timingFactor;
  const timingVariationTime = timingVariationTicks / ppq;
  
  result.time = Math.max(0, result.time + timingVariationTime);
  
  console.log(`Note ${index}: time ${note.time} -> ${result.time} (variation: ${timingVariationTime}s)`);
  
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

    // Créer une copie profonde des notes avec métadonnées et validation
    const transformedNotes = baseTrack.notes.map((note, idx) => {
      // Validation et normalisation des propriétés de note
      const normalizedNote = {
        ...note,
        originalIndex: idx,
        originalTicks: note.ticks || 0,
        originalMidi: note.midi || 60,
        // S'assurer que les propriétés critiques existent
        ticks: typeof note.ticks === 'number' && !isNaN(note.ticks) ? note.ticks : idx * 120,
        time: typeof note.time === 'number' && !isNaN(note.time) ? note.time : (note.ticks || idx * 120) / (baseMidi.header.ppq || 480),
        duration: typeof note.duration === 'number' && !isNaN(note.duration) && note.duration > 0 ? note.duration : 0.25,
        midi: typeof note.midi === 'number' && !isNaN(note.midi) ? note.midi : 60,
        velocity: typeof note.velocity === 'number' && !isNaN(note.velocity) ? Math.min(1, Math.max(0, note.velocity)) : 0.8
      };
      
      return normalizedNote;
    });

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

    // 5. Humanisation (timing et vélocité)
    if (humanize) {
      transformedNotes.forEach((n, idx) => {
        // S'assurer qu'on a une valeur time valide
        if (n.time === undefined || n.time === null || isNaN(n.time)) {
          // Calculer time à partir de ticks si nécessaire
          const ppq = 480;
          n.time = n.ticks / ppq;
        }
        
        // Humanisation du timing
        const timingVariationMs = (rng() - 0.5) * humanize;
        const timingVariationSec = timingVariationMs / 1000;
        n.time = Math.max(0, n.time + timingVariationSec);
        
        // Humanisation de la vélocité
        const velocityVariation = (rng() - 0.5) * 0.15;
        n.velocity = Math.min(1, Math.max(0.1, n.velocity + velocityVariation));
      });
    }

    // 6. Rétrogradation (en dernier pour préserver le timing)
    if (retrograde) {
      if (transformedNotes.length > 0) {
        try {
          // S'assurer que toutes les notes ont des propriétés valides
          transformedNotes.forEach(note => {
            if (typeof note.ticks !== 'number' || isNaN(note.ticks)) {
              note.ticks = 0;
            }
            if (typeof note.time !== 'number' || isNaN(note.time)) {
              note.time = note.ticks / (baseMidi.header.ppq || 480);
            }
            if (typeof note.duration !== 'number' || isNaN(note.duration)) {
              note.duration = 0.25; // Durée par défaut d'une double-croche
            }
          });

          // Trier les notes par temps pour être sûr de l'ordre
          transformedNotes.sort((a, b) => a.time - b.time);
          
          // Trouver la fin de la séquence (dernière note + sa durée)
          const lastNote = transformedNotes[transformedNotes.length - 1];
          const sequenceEnd = lastNote.time + lastNote.duration;
          
          // Validation de sequenceEnd
          if (!isFinite(sequenceEnd) || sequenceEnd <= 0) {
            console.warn('Séquence invalide pour rétrograde, utilisation de durée par défaut');
            throw new Error('Durée de séquence invalide');
          }

          // Inverser temporellement chaque note
          transformedNotes.forEach((note, index) => {
            const originalTime = note.time;
            const newTime = sequenceEnd - note.time - note.duration;
            
            // Log de débogage pour identifier les problèmes
            if (newTime < 0) {
              console.warn(`Note ${index}: temps négatif calculé (${newTime}), ajusté à 0. Original: ${originalTime}, SeqEnd: ${sequenceEnd}, Duration: ${note.duration}`);
            }
            
            // Validation et correction des valeurs négatives
            note.time = Math.max(0, newTime);
            
            // Recalculer ticks à partir du nouveau temps
            const newTicks = Math.round(note.time * (baseMidi.header.ppq || 480));
            note.ticks = Math.max(0, newTicks);
            
            // Log de débogage pour le débogage
            if (index < 3) { // Afficher seulement les 3 premières notes pour éviter le spam
              console.log(`Rétrograde note ${index}: ${originalTime}s -> ${note.time}s (ticks: ${note.ticks})`);
            }
          });
          
          // Trier à nouveau par le nouveau temps
          transformedNotes.sort((a, b) => a.time - b.time);
          
        } catch (error) {
          console.error('Erreur lors du rétrograde:', error);
          // En cas d'erreur, on annule le rétrograde plutôt que de planter
          console.warn('Rétrograde annulé à cause d\'une erreur, séquence conservée telle quelle');
        }
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