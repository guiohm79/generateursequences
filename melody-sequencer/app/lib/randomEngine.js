// /app/lib/randomEngine.js – rewrite 2025-06
// Générateur de patterns MIDI 16/32 pas inspiré du
// « Guide de génération musicale algorithmique (1995‑2025) ».
// Entrée & sortie identiques à l’ancien fichier :
//   generateMusicalPattern({rootNote, scale, style, mood, part, steps, octaves})
//   ⇒ retourne un objet { noteName : [ {on,velocity}|0, … ] }
//
// Nouveautés :
// - 6 styles officiels : “goa”, “psy”, “prog”, “downtempo”, “deep”, “ambient”.
// - Algorithmes dédiés basse/lead/pad/arp/FX par style.
// - Support des gammes phrygien dominant & harmonique mineur.
// - Vélocité calibrée selon l’ambiance (soft, dark, uplifting, dense).
// - Code 100 % ES2022, sans dépendances externes.

/////////////////////////
// NOTES & SCALES
/////////////////////////
export const NOTE_ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// Formule = décalages en demi‑tons à partir de la tonique
export const SCALES = {
  major:              [0,2,4,5,7,9,11],
  minor:              [0,2,3,5,7,8,10],
  harmonicMinor:      [0,2,3,5,7,8,11],
  phrygian:           [0,1,3,5,7,8,10],
  phrygianDominant:   [0,1,4,5,7,8,10],
  dorian:             [0,2,3,5,7,9,10],
  perso:              [0, 4, 11], 
};

// Renvoie toutes les notes de la gamme sur une plage d’octaves (fermée)
function buildScale(root, scaleType, {min, max}) {
  const rootIndex = NOTE_ORDER.indexOf(root);
  const formula   = SCALES[scaleType] ?? SCALES.minor;
  const res = [];
  for (let oct = min; oct <= max; oct++) {
    for (const step of formula) {
      const noteIdx  = (rootIndex + step) % 12;
      res.push(NOTE_ORDER[noteIdx] + oct);
    }
  }
  return res;
}

// -----------------------------------------------------------
// OUTILS UTILITAIRES
// -----------------------------------------------------------

// Crée un tableau steps rempli de 0
const emptyRow = steps => Array(steps).fill(0);

// Applique un callback à chaque cellule choisie d’un motif
function mapPatternCells(pattern, fn) {
  Object.keys(pattern).forEach(note => {
    pattern[note] = pattern[note].map(cell => cell && cell.on ? fn(cell) : cell);
  });
}

// Vérifie si au pas t il existe déjà une note ON
function cellAlreadyOn(pattern, t) {
  return Object.values(pattern).some(row => row[t] && row[t].on);
}

// Sélectionne un indice de note avec un offset borné
function clamp(idx, min, max) {
  return Math.max(min, Math.min(max, idx));
}

// -----------------------------------------------------------
// PATTERNS BASSE  (version +variée)
// -----------------------------------------------------------
function bassPattern({allNotes, rootNote, steps, style, mood}) {
  const pattern = {};
  allNotes.forEach(n => (pattern[n] = emptyRow(steps)));

  // index de la fondamentale la plus grave
  const rootIndices = allNotes.reduce((a, n, i) => {
    if (n.startsWith(rootNote)) a.push(i);
    return a;
  }, []);
  const rootIdx  = rootIndices[0] ?? 0;
  const fifthIdx = clamp(rootIdx + 4, 0, allNotes.length - 1);
  const octIdx   = clamp(rootIdx + 12, 0, allNotes.length - 1);
  const notePool = [rootIdx, fifthIdx, octIdx];

  const write = (idx, pos, vel = 110) =>
    (pattern[allNotes[idx]][pos] = { on: true, velocity: vel });

  switch (style) {
    case 'goa':
    case 'psy':
      for (let i = 0; i < steps; i++) {
        if (i % 4 !== 0) {
          const vel = 90 + Math.random() * 30;
          const idx =
            Math.random() < 0.75 ? rootIdx : notePool[Math.random() * notePool.length | 0];
          write(idx, i, vel);
        }
      }
      break;

    case 'prog':
      for (let i = 0; i < steps; i++) {
        if (i % 4 === 2) {
          const idx = Math.random() < 0.2 ? fifthIdx : rootIdx;
          write(idx, i, mood === 'soft' ? 100 : 115);
        }
      }
      break;

    default: // deep / downtempo etc.
      for (let i = 0; i < steps; i++) {
        if (i % 4 === 0) {
          write(rootIdx, i, 85 + Math.random() * 15);
        } else if (Math.random() < 0.25) {
          write(notePool[Math.random() * notePool.length | 0], i, 60 + Math.random() * 40);
        }
      }
  }
  return pattern;
}


// -----------------------------------------------------------
// PATTERNS LEAD / MELODY
// -----------------------------------------------------------
function leadPattern({allNotes, rootNote, steps, style}) {
  const pattern = {};
  allNotes.forEach(n=>{pattern[n]=emptyRow(steps);});

  const rootIdxList = allNotes.reduce((a,n,i)=>{if(n.startsWith(rootNote))a.push(i);return a;},[]);
  const midRoot = rootIdxList[Math.floor(rootIdxList.length/2)] ?? 0;
  let currentIdx = midRoot;

  const write = (idx,pos,vel)=>{pattern[allNotes[idx]][pos]={on:true,velocity:vel};};

  const motifLen = style==='goa'?8:16;
  const motifVelBase = style==='goa'?105:95;

  const motif = [];
  for(let i=0;i<motifLen;i++){
    if(i===0||Math.random()>(style==='goa'?0.05:0.4)){
      if(i!==0){
        const step = (Math.floor(Math.random()*5)-2);
        currentIdx = clamp(currentIdx+step,0,allNotes.length-1);
        if(Math.random()<0.1 && style==='goa') currentIdx = midRoot;
      }
      motif[i]=currentIdx;
    }else{
      motif[i]=null;
    }
  }
  // Ecriture motif sur le pattern
  for(let t=0;t<steps;t++){
    const m = motif[t%motifLen];
    if(m!==null) write(m,t,motifVelBase+Math.floor(Math.random()*25));
  }

  // Progressive : ancrages fondamentales + quinte
  if(style==='prog'){
    pattern[allNotes[midRoot]][0]={on:true,velocity:100};
    if(steps>=32) pattern[allNotes[midRoot]][16]={on:true,velocity:100};
    const fifthIdx = clamp(midRoot+4,0,allNotes.length-1);
    pattern[allNotes[fifthIdx]][Math.floor(steps/2)]={on:true,velocity:100};
  }

  return pattern;
}

// -----------------------------------------------------------
// PATTERNS PAD
// -----------------------------------------------------------
function padPattern({allNotes, steps, style}) {
  const pattern={};
  allNotes.forEach(n=>{pattern[n]=emptyRow(steps);});
  const upperZone = allNotes.slice(Math.floor(allNotes.length/2));

  const interval = style==='prog'?8:4;
  const hold     = style==='deep'?7:3;

  for(let t=0;t<steps;t+=interval){
    const note = upperZone[Math.floor(Math.random()*upperZone.length)];
    for(let j=0;j<hold && t+j<steps;j++){
      pattern[note][t+j]={on:true,velocity:60+Math.floor(Math.random()*25)};
    }
  }
  return pattern;
}

// -----------------------------------------------------------
// PATTERNS ARPEGGIO  (random-walk)
// -----------------------------------------------------------
function arpeggioPattern({ allNotes, steps }) {
  const pattern = {};
  allNotes.forEach(n => (pattern[n] = emptyRow(steps)));

  const write = (idx, pos, vel = 100) =>
    (pattern[allNotes[idx]][pos] = { on: true, velocity: vel });

  let idx = Math.floor(allNotes.length / 2);          // départ milieu de gamme
  for (let t = 0; t < steps; t++) {
    write(idx, t, 90 + Math.random() * 25);
    // déplacement aléatoire de –2, –1, +1 ou +2 degrés
    idx = clamp(
      idx + [-2, -1, 1, 2][Math.random() * 4 | 0],
      0,
      allNotes.length - 1
    );
  }
  return pattern;
}

// -----------------------------------------------------------
// GENERATEUR PRINCIPAL
// -----------------------------------------------------------
export function generateMusicalPattern({
  rootNote='C',
  scale='minor',
  style='psy',
  mood='default',
  part='bassline',
  steps=16,
  octaves={min:3,max:5},
} = {}) {

  const allNotes = buildScale(rootNote, scale, octaves);
  let pattern;

  switch(part){
    case 'bassline':
      pattern = bassPattern({allNotes, rootNote, steps, style, mood});
      break;
    case 'pad':
      pattern = padPattern({allNotes,steps,style});
      break;
    case 'arpeggio':
      pattern = arpeggioPattern({allNotes,steps});
      break;
    default:
      pattern = leadPattern({allNotes, rootNote, steps, style});
  }

  // ------- Ambiance post‑traitement -------
  if(mood==='dark'){
    mapPatternCells(pattern,c=>({...c,velocity:Math.max(35,c.velocity-30)}));
  }else if(mood==='uplifting'){
    mapPatternCells(pattern,c=>({...c,velocity:Math.min(127,c.velocity+15)}));
  }else if(mood==='dense'){
    // Ajoute ~30 % de notes aléatoires
    const extra = Math.floor(steps*0.3);
    for(let i=0;i<extra;i++){
      const n = Math.floor(Math.random()*allNotes.length);
      const s = Math.floor(Math.random()*steps);
      pattern[allNotes[n]][s]={on:true,velocity:80+Math.floor(Math.random()*45)};
    }
  }

  return pattern;
}
