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

/* -------- helpers harmonique -------- */
function analyzeChords(notes, ppq) {
  const chords = [];
  const chordWindow = ppq; // 1 beat window
  
  for (let time = 0; time < notes[notes.length-1].ticks + notes[notes.length-1].durationTicks; time += chordWindow) {
    const activeNotes = notes.filter(n => 
      n.ticks <= time && n.ticks + n.durationTicks > time
    ).map(n => n.midi % 12);
    
    if (activeNotes.length > 0) {
      const chord = detectChord(activeNotes);
      chords.push({ time, chord, notes: activeNotes });
    }
  }
  return chords;
}

function detectChord(pitches) {
  const unique = [...new Set(pitches)].sort((a,b) => a-b);
  if (unique.length < 2) return { root: unique[0], type: 'single' };
  
  const intervals = unique.map((p, i) => i > 0 ? (p - unique[0] + 12) % 12 : 0);
  
  const chordTypes = {
    'major': [0, 4, 7],
    'minor': [0, 3, 7],
    'dim': [0, 3, 6],
    'aug': [0, 4, 8],
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7],
    'maj7': [0, 4, 7, 11],
    'min7': [0, 3, 7, 10],
    'dom7': [0, 4, 7, 10]
  };
  
  for (const [type, pattern] of Object.entries(chordTypes)) {
    if (pattern.every(p => intervals.includes(p))) {
      return { root: unique[0], type, intervals };
    }
  }
  
  return { root: unique[0], type: 'unknown', intervals };
}

function analyzeRhythmicPatterns(notes, ppq) {
  const patterns = [];
  const sixteenthNote = ppq / 4;
  
  for (let i = 0; i < notes.length - 1; i++) {
    const gap = notes[i + 1].ticks - (notes[i].ticks + notes[i].durationTicks);
    const duration = notes[i].durationTicks;
    const onset = notes[i].ticks % (ppq * 4); // position dans la mesure
    
    patterns.push({
      onset: Math.round(onset / sixteenthNote),
      duration: Math.round(duration / sixteenthNote),
      gap: Math.round(gap / sixteenthNote)
    });
  }
  return patterns;
}

/* -------- helpers Markov amélioré -------- */
function buildMultivarMarkov(notes, chords, rhythmPatterns, order=2) {
  const table = {};
  
  for (let i = 0; i < notes.length - order; i++) {
    const context = [];
    
    for (let j = 0; j < order; j++) {
      const note = notes[i + j];
      const chordAtTime = chords.find(c => c.time <= note.ticks && c.time + 480 > note.ticks);
      const rhythmPattern = rhythmPatterns[i + j];
      
      context.push({
        pitchClass: note.midi % 12,
        octave: Math.floor(note.midi / 12),
        duration: rhythmPattern?.duration || 1,
        chordRoot: chordAtTime?.chord.root || 0,
        chordType: chordAtTime?.chord.type || 'unknown',
        beatPosition: rhythmPattern?.onset || 0
      });
    }
    
    const key = context.map(c => 
      `${c.pitchClass}-${c.octave}-${c.duration}-${c.chordRoot}-${c.chordType}-${c.beatPosition}`
    ).join('|');
    
    const nextNote = notes[i + order];
    const nextChord = chords.find(c => c.time <= nextNote.ticks && c.time + 480 > nextNote.ticks);
    const nextRhythm = rhythmPatterns[i + order];
    
    const nextState = {
      pitchClass: nextNote.midi % 12,
      octave: Math.floor(nextNote.midi / 12),
      duration: nextRhythm?.duration || 1,
      chordRoot: nextChord?.chord.root || 0,
      chordType: nextChord?.chord.type || 'unknown',
      beatPosition: nextRhythm?.onset || 0,
      weight: 1
    };
    
    if (!table[key]) table[key] = [];
    
    const existing = table[key].find(s => 
      s.pitchClass === nextState.pitchClass && 
      s.octave === nextState.octave &&
      s.duration === nextState.duration
    );
    
    if (existing) {
      existing.weight++;
    } else {
      table[key].push(nextState);
    }
  }
  
  return table;
}

function nextWeightedMarkov(table, key, rng, fallback) {
  const bucket = table[key];
  if (!bucket || bucket.length === 0) {
    return fallback[Math.floor(rng() * fallback.length)];
  }
  
  const totalWeight = bucket.reduce((sum, item) => sum + item.weight, 0);
  let random = rng() * totalWeight;
  
  for (const item of bucket) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  
  return bucket[bucket.length - 1];
}

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
    lenBars   = 2,
    seed      = null,
    root      = 'C',
    scale     = 'minor',
    keepScale = true,
    density   = 0.6,
    useAdvanced = true
  } = opts;
  const rng = seed!==null ? mulberry32(seed) : Math.random;

  /* ---- 1) lecture & extraction ---- */
  const srcMidi  = new Midi(midiData);
  const notes    = srcMidi.tracks[0].notes;
  if(notes.length<4) throw new Error('Phrase trop courte pour Markov !');

  const out = new Midi();
  const trk = out.addTrack();
  const barLen = srcMidi.header.ppq * 4;

  if (useAdvanced) {
    /* ---- MÉTHODE AVANCÉE ---- */
    const chords = analyzeChords(notes, srcMidi.header.ppq);
    const rhythmPatterns = analyzeRhythmicPatterns(notes, srcMidi.header.ppq);
    const markovTable = buildMultivarMarkov(notes, chords, rhythmPatterns, 2);
    
    // Créer les fallbacks pour les cas où Markov échoue
    const fallbackStates = notes.map((note, i) => ({
      pitchClass: note.midi % 12,
      octave: Math.floor(note.midi / 12),
      duration: rhythmPatterns[i]?.duration || 1,
      chordRoot: 0,
      chordType: 'unknown',
      beatPosition: rhythmPatterns[i]?.onset || 0,
      weight: 1
    }));

    // Initialiser avec les deux premières notes
    let context = [];
    for (let i = 0; i < 2 && i < notes.length; i++) {
      const note = notes[i];
      const chordAtTime = chords.find(c => c.time <= note.ticks && c.time + 480 > note.ticks);
      const rhythmPattern = rhythmPatterns[i];
      
      context.push({
        pitchClass: note.midi % 12,
        octave: Math.floor(note.midi / 12),
        duration: rhythmPattern?.duration || 1,
        chordRoot: chordAtTime?.chord.root || 0,
        chordType: chordAtTime?.chord.type || 'unknown',
        beatPosition: rhythmPattern?.onset || 0
      });
      
      trk.addNote({
        midi: note.midi,
        velocity: note.velocity,
        ticks: i * (srcMidi.header.ppq / 2),
        durationTicks: note.durationTicks
      });
    }

    let cursor = 2 * (srcMidi.header.ppq / 2);
    
    while (cursor < lenBars * barLen) {
      const key = context.map(c => 
        `${c.pitchClass}-${c.octave}-${c.duration}-${c.chordRoot}-${c.chordType}-${c.beatPosition}`
      ).join('|');
      
      const nextState = nextWeightedMarkov(markovTable, key, rng, fallbackStates);
      
      // Construire la note finale
      const midi = nextState.octave * 12 + nextState.pitchClass;
      const finalPitch = keepScale ? quantizeToScale(midi, root, scale) : midi;
      const duration = nextState.duration * (srcMidi.header.ppq / 4);
      
      // Déterminer si on doit jouer cette note (basé sur les patterns rythmiques)
      const beatInMeasure = (cursor % barLen) / (srcMidi.header.ppq / 4);
      const shouldPlay = rhythmPatterns.some(p => 
        Math.abs(p.onset - Math.round(beatInMeasure)) <= 1
      ) || rng() < density;
      
      if (shouldPlay) {
        trk.addNote({
          midi: finalPitch,
          velocity: 0.8,
          ticks: cursor,
          durationTicks: duration
        });
      }
      
      // Mettre à jour le contexte
      context.shift();
      context.push(nextState);
      cursor += duration;
    }

  } else {
    /* ---- MÉTHODE CLASSIQUE (fallback) ---- */
    const intervals = notes.slice(1).map((n,i)=> n.midi - notes[i].midi);
    const durs      = notes.map(n=>n.durationTicks);
    const order=2;
    const markovInt = buildMarkov(intervals,order);
    const markovDur = buildMarkov(durs,order);

    const totalSteps = lenBars*16;
    const rhythmMask = euclid(totalSteps, Math.round(totalSteps*density));

    let lastPitches=[notes[0].midi, notes[1].midi];
    let lastDurs   =[durs[0], durs[1]];
    let cursor=0;

    [[...lastPitches][0],[...lastPitches][1]].forEach((p,i)=>{
      trk.addNote({midi:p,velocity:notes[i].velocity,ticks:cursor,durationTicks:lastDurs[i]});
      cursor += lastDurs[i];
    });

    while(cursor < lenBars*barLen){
      const intKey = lastPitches.slice(-order).map((v,i,a)=>a[i+1]-a[i]||0).join(',');
      const nextInt= nextMarkov(markovInt,intKey,rng,intervals);
      const nextPitch = lastPitches.at(-1)+nextInt;

      const durKey = lastDurs.slice(-order).join(',');
      const nextDur = nextMarkov(markovDur,durKey,rng,durs);

      const stepIdx = Math.floor((cursor/srcMidi.header.ppq)*4);
      if(rhythmMask[stepIdx%rhythmMask.length]){
        let pitchFixed = keepScale ? quantizeToScale(nextPitch,root,scale) : nextPitch;
        trk.addNote({
          midi: pitchFixed,
          velocity: 0.8,
          ticks: cursor,
          durationTicks: nextDur
        });
      }
      lastPitches.push(nextPitch); lastDurs.push(nextDur);
      cursor += nextDur;
    }
  }

  return out.toArray();
}

//export function generateInspiration(midiData, opts={ /* root, scale… */ }) { /* … */ }
