// /app/lib/randomEngine.js – seedable rev 2025-07-03
// Inspiré du « Guide de génération musicale algorithmique (1995-2025) »

/////////////////////////
// NOTES & SCALES
/////////////////////////
export const NOTE_ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export const SCALES = {
  major:            [0,2,4,5,7,9,11],
  minor:            [0,2,3,5,7,8,10],
  harmonicMinor:    [0,2,3,5,7,8,11],
  phrygian:         [0,1,3,5,7,8,10],
  phrygianDominant: [0,1,4,5,7,8,10],
  dorian:           [0,2,3,5,7,9,10],
  perso:            [0,4,11]        // ta gamme 1-3-7-8
};

// Renvoie toutes les notes de la gamme sur une plage d’octaves
function buildScale(root, scaleType, {min, max}) {
  const rootIdx = NOTE_ORDER.indexOf(root);
  const formula = SCALES[scaleType] ?? SCALES.minor;
  const out = [];
  for (let oct=min; oct<=max; oct++){
    for (const step of formula){
      const n = NOTE_ORDER[(rootIdx+step)%12] + oct;
      out.push(n);
    }
  }
  return out;
}

/////////////////////////
// OUTILS
/////////////////////////
export function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const emptyRow = s => Array(s).fill(0);
const clamp    = (i,min,max)=>Math.max(min,Math.min(max,i));

function mapPatternCells(pattern, fn){
  Object.keys(pattern).forEach(note=>{
    pattern[note]=pattern[note].map(c=>c&&c.on?fn(c):c);
  });
}

/////////////////////////
// PATTERN : BASSE
/////////////////////////
function bassPattern({allNotes, rootNote, steps, style, mood, rng}){
  const pattern={}; allNotes.forEach(n=>pattern[n]=emptyRow(steps));

  const roots = allNotes.reduce((a,n,i)=>{if(n.startsWith(rootNote))a.push(i);return a;},[]);
  const rootIdx = roots[0]??0;
  const fifthIdx= clamp(rootIdx+4,0,allNotes.length-1);
  const octIdx  = clamp(rootIdx+12,0,allNotes.length-1);
  const notePool= [rootIdx,fifthIdx,octIdx];

  const write = (idx,pos,vel=110)=>{pattern[allNotes[idx]][pos]={on:true,velocity:vel};};

  switch(style){
    case 'goa':
    case 'psy':
      for(let i=0;i<steps;i++){
        if(i%4!==0){
          const vel = 90 + rng()*30;
          const idx = rng()<0.75 ? rootIdx : notePool[rng()*notePool.length|0];
          write(idx,i,vel);
        }
      }
      break;

    case 'prog':
      for(let i=0;i<steps;i++){
        if(i%4===2){
          const idx = rng()<0.2?fifthIdx:rootIdx;
          write(idx,i,mood==='soft'?100:115);
        }
      }
      break;

    default: // deep / downtempo
      for(let i=0;i<steps;i++){
        if(i%4===0){
          write(rootIdx,i,85+rng()*15);
        }else if(rng()<0.25){
          write(notePool[rng()*notePool.length|0],i,60+rng()*40);
        }
      }
  }
  return pattern;
}

/////////////////////////
// PATTERN : PAD
/////////////////////////
function padPattern({allNotes, steps, style, rng}){
  const pattern={}; allNotes.forEach(n=>pattern[n]=emptyRow(steps));
  const upper = allNotes.slice(allNotes.length/2);

  const interval = style==='prog'?8:4;
  const hold     = style==='deep'?7:3;

  for(let t=0;t<steps;t+=interval){
    const note = upper[rng()*upper.length|0];
    for(let j=0;j<hold && t+j<steps;j++){
      pattern[note][t+j]={on:true,velocity:60+rng()*25};
    }
  }
  return pattern;
}

/////////////////////////
// PATTERN : ARPÈGE
/////////////////////////
function arpeggioPattern({allNotes, steps, rng}){
  const pattern={}; allNotes.forEach(n=>pattern[n]=emptyRow(steps));
  const write=(i,p,v=100)=>{pattern[allNotes[i]][p]={on:true,velocity:v};};

  let idx=Math.floor(allNotes.length/2);
  for(let t=0;t<steps;t++){
    write(idx,t,90+rng()*25);
    idx=clamp(idx+[-2,-1,1,2][rng()*4|0],0,allNotes.length-1);
  }
  return pattern;
}

/////////////////////////
// PATTERN : LEAD / MELODY
/////////////////////////
function leadPattern({allNotes, rootNote, steps, style, rng}){
  const pattern={}; allNotes.forEach(n=>pattern[n]=emptyRow(steps));

  const roots=allNotes.reduce((a,n,i)=>{if(n.startsWith(rootNote))a.push(i);return a;},[]);
  const midRoot=roots[Math.floor(roots.length/2)]??0;
  let current=midRoot;

  const write=(i,p,v)=>{pattern[allNotes[i]][p]={on:true,velocity:v};};

  const motifLen = style==='goa'?8:16;
  const baseVel  = style==='goa'?105:95;
  const motif=[];

  for(let i=0;i<motifLen;i++){
    if(i===0 || rng()>(style==='goa'?0.05:0.4)){
      if(i!==0){
        current=clamp(current+(rng()*5|0)-2,0,allNotes.length-1);
        if(rng()<0.1 && style==='goa') current=midRoot;
      }
      motif[i]=current;
    }else motif[i]=null;
  }

  for(let t=0;t<steps;t++){
    const m=motif[t%motifLen];
    if(m!==null) write(m,t,baseVel+rng()*25|0);
  }

  if(style==='prog'){
    pattern[allNotes[midRoot]][0]={on:true,velocity:100};
    if(steps>=32) pattern[allNotes[midRoot]][16]={on:true,velocity:100};
    const fifth=clamp(midRoot+4,0,allNotes.length-1);
    pattern[allNotes[fifth]][steps/2|0]={on:true,velocity:100};
  }
  return pattern;
}

/////////////////////////
// GÉNÉRATEUR PRINCIPAL
/////////////////////////
export function generateMusicalPattern({
  rootNote='C',
  scale='minor',
  style='psy',
  mood='default',
  part='bassline',
  steps=16,
  octaves={min:3,max:5},
  seed=null          // ← nouveau
} = {}){

  const rng = seed!==null ? mulberry32(seed) : Math.random;

  const allNotes = buildScale(rootNote, scale, octaves);
  const common   = {allNotes, rootNote, steps, style, mood, rng};
  let pattern;

  switch(part){
    case 'bassline':  pattern=bassPattern(common);            break;
    case 'pad':       pattern=padPattern(common);             break;
    case 'arpeggio':  pattern=arpeggioPattern(common);        break;
    default:          pattern=leadPattern(common);
  }

  // -------- Ambiance post-traitement --------
  if(mood==='dark'){
    mapPatternCells(pattern,c=>({...c,velocity:Math.max(35,c.velocity-30)}));
  }else if(mood==='uplifting'){
    mapPatternCells(pattern,c=>({...c,velocity:Math.min(127,c.velocity+15)}));
  }else if(mood==='dense'){
    const extra=Math.floor(steps*0.3);
    for(let i=0;i<extra;i++){
      const n=rng()*allNotes.length|0;
      const s=rng()*steps|0;
      pattern[allNotes[n]][s]={on:true,velocity:80+rng()*45|0};
    }
  }

  return pattern;
}
