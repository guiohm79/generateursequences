// inspirationEngine.js – générateur Markov + Euclide (2025-07-05)
import { Midi } from '@tonejs/midi';
import { mulberry32, SCALES, NOTE_ORDER } from './randomEngine.js';

// inspirationEngine.js  (2025-07-05)
// Besoin : npm i @tonejs/midi
import { Midi } from '@tonejs/midi';
import { mulberry32, SCALES, NOTE_ORDER } from './randomEngine.js';

/* -------- helpers gamme -------- */
function quantizeToScale(midi, root='C', scale='minor'){
  const rootIdx  = NOTE_ORDER.indexOf(root);
  const formula  = SCALES[scale] ?? SCALES.minor;
  const rel      = ((midi-rootIdx)%12+12)%12;
  let best=formula[0], dist=12;
  for(const s of formula){
    const d=Math.abs(s-rel); if(d<dist){dist=d; best=s;}
  }
  return midi + (best-rel);
}

/* -------- helpers Markov -------- */
function buildMarkov(arr, order=2){
  const table={};
  for(let i=0;i<arr.length-order;i++){
    const key=arr.slice(i,i+order).join(',');
    (table[key]=table[key]||[]).push(arr[i+order]);
  }
  return table;
}
function nextMarkov(table, key, rng, fallback){
  const bucket=table[key];
  return bucket ? bucket[rng()*bucket.length|0] : fallback[rng()*fallback.length|0];
}

/* -------- Euclid -------- */
function euclid(steps,pulses){
  const out=Array(steps).fill(0); let bucket=0;
  for(let i=0;i<steps;i++){ bucket+=pulses;
    if(bucket>=steps){bucket-=steps; out[i]=1;}
  } return out;
}

/* ------------------------------------------------------------------ *
 *  generateInspiration
 * ------------------------------------------------------------------ */
/**
 * @typedef {Object} InspoOptions
 * @prop {number}   [lenBars=4]     Longueur cible en mesures 4/4
 * @prop {number}   [seed]          Graine PRNG
 * @prop {string}   [root='C']      Tonique
 * @prop {string}   [scale='minor'] Gamme (perso ok)
 * @prop {boolean}  [keepScale=true]Forcer les notes à la gamme
 * @prop {number}   [density=0.6]   0-1 proportion de steps joués
 */

/**
 * Génère une ou plusieurs séquences nouvelles “à la manière de”.
 * @param {ArrayBuffer} midiData
 * @param {InspoOptions} opts
 * @returns {ArrayBuffer}  Nouveau fichier MIDI
 */
export function generateInspiration(midiData, opts={}){
  const {
    lenBars   = 4,
    seed      = null,
    root      = 'C',
    scale     = 'minor',
    keepScale = true,
    density   = 0.6
  } = opts;
  const rng = seed!==null ? mulberry32(seed) : Math.random;

  /* ---- 1) lecture & extraction ---- */
  const srcMidi  = new Midi(midiData);
  const notes    = srcMidi.tracks[0].notes;
  if(notes.length<4) throw new Error('Phrase trop courte pour Markov !');

  const intervals = notes.slice(1).map((n,i)=> n.midi - notes[i].midi);
  const durs      = notes.map(n=>n.durationTicks);
  const order=2;
  const markovInt = buildMarkov(intervals,order);
  const markovDur = buildMarkov(durs,order);

  /* ---- 2) génération ---- */
  const totalSteps = lenBars*16;
  const rhythmMask = euclid(totalSteps, Math.round(totalSteps*density));

  const out = new Midi(); out.header.ppq = srcMidi.header.ppq;
  const trk = out.addTrack();

  // point de départ : deux premières notes de la source
  let lastPitches=[notes[0].midi, notes[1].midi];
  let lastDurs   =[durs[0], durs[1]];
  let cursor=0;                           // position actuelle en ticks
  const barLen = srcMidi.header.ppq*4;

  // Pose les deux premières
  [[...lastPitches][0],[...lastPitches][1]].forEach((p,i)=>{
    trk.addNote({midi:p,velocity:notes[i].velocity,startTicks:cursor,durationTicks:lastDurs[i]});
    cursor += lastDurs[i];
  });

  while(cursor < lenBars*barLen){
    // pitch via Markov sur intervalle
    const intKey = lastPitches.slice(-order).map((v,i,a)=>a[i+1]-a[i]||0).join(',');
    const nextInt= nextMarkov(markovInt,intKey,rng,intervals);
    const nextPitch = lastPitches.at(-1)+nextInt;

    // duration via Markov
    const durKey = lastDurs.slice(-order).join(',');
    const nextDur = nextMarkov(markovDur,durKey,rng,durs);

    // rhythmic mask (optionnel)
    const stepIdx = Math.floor((cursor/srcMidi.header.ppq)*4);
    if(rhythmMask[stepIdx%rhythmMask.length]){
      let pitchFixed = keepScale ? quantizeToScale(nextPitch,root,scale) : nextPitch;
      trk.addNote({
        midi: pitchFixed,
        velocity: 0.8,
        startTicks: cursor,
        durationTicks: nextDur
      });
    }
    // shift
    lastPitches.push(nextPitch); lastDurs.push(nextDur);
    cursor += nextDur;
  }

  return out.toArray();
}

export function generateInspiration(midiData, opts={ /* root, scale… */ }) { /* … */ }
