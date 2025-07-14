// /app/lib/randomEngine.js – seedable rev 2025-07-13 (enhanced)
// Améliorations inspirées de la « Synthèse algorithmique – Goa/Psy/Prog/Deep »
// ---------------------------------------------------------------
// * Bassline Goa/Psy : variations subtiles (mute, glide, quinte/seconde mineure),
//   drop fantôme & slide final pour effet "wow".
// * Lead Goa : pondération Phrygienne (tonique, 2m, quinte) + gimmicks triplets.
// * Nouvelle propriété optionnelle "slide" sur les cellules pour portamento.
// * Aucune signature publique changée => ré‑intégration plug‑and‑play.
// ---------------------------------------------------------------

/////////////////////////
// NOTES & SCALES
/////////////////////////
export const NOTE_ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export const SCALES = {
  major:            [0,2,4,5,7,9,11],
  minor:            [0,2,3,5,7,8,10],
  harmonicMinor:    [0,2,3,5,7,8,11],    // Le classique qui tue
  phrygian:         [0,1,3,5,7,8,10],    // Ton phrygien de base
  phrygianDominant: [0,1,4,5,7,8,10],    // Plus oriental
  dorian:           [0,2,3,5,7,9,10],    // Cool pour la prog
  
  // Nouvelles gammes trance qui claquent :
  hungarianMinor:   [0,2,3,6,7,8,11],    // Super sombre, parfait pour dark psy
  doubleHarmonic:   [0,1,4,5,7,8,11],    // Exotique de ouf
  neapolitanMinor:  [0,1,3,5,7,8,11],    // Tension de malade
  enigmatic:        [0,1,4,6,8,10,11],   // Vraiment bizarre mais hypnotique
  wholetone:        [0,2,4,6,8,10],      // Complètement barré mais ça peut le faire
  
  perso:            [0,4,10,11],         // Ta gamme corrigée avec le 8ème ?
  perso2:           [0,3,7,8,10],
  minimalDark:      [0,1,7],             // Ultra minimal pour dark techno
  acidTriad:        [0,3,7],             // Basique mais efficace pour acid
  bluesScale:       [0,3,5,6,7,10],      // Pour du groove
  japanese:         [0,1,5,7,8],         // Pentatonique japonaise
  arabicMaqam:      [0,1,4,5,7,8,10],    // Couleur orientale
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
  const minor2Idx= clamp(rootIdx+1,0,allNotes.length-1);
  const octIdx  = clamp(rootIdx+12,0,allNotes.length-1);
  const notePool= [rootIdx,fifthIdx,minor2Idx,octIdx];

  const write = (idx,pos,vel=110,extra={})=>{pattern[allNotes[idx]][pos]={on:true,velocity:vel,...extra};};

  switch(style){
    case 'goa':
    case 'psy':{
      const muteProb=0.1;        // mini‑silence dramatique
      const varyProb=0.15;       // quinte / 2m occasionnelle
      const glideProb=0.25;      // slide sur dernière note
      for(let i=0;i<steps;i++){
        // Kick supposé sur pas 0,4,8,12 (i%4===0) => on remplit le reste
        if(i%4!==0){
          if(i===steps-1 && rng()<muteProb){
            continue; // petit trou avant le drop
          }
          const idx = (rng()<varyProb)? notePool[rng()*notePool.length|0] : rootIdx;
          const vel = 90 + rng()*30;
          const extra = (i===steps-1 && rng()<glideProb)? {slide:true} : {};
          write(idx,i,vel,extra);
        }
      }
      break;}

    case 'prog':{
      for(let i=0;i<steps;i++){
        if(i%4===2){
          const idx = rng()<0.2?fifthIdx:rootIdx;
          write(idx,i,mood==='soft'?100:115);
        }
      }
      break;}

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
function padPattern({allNotes, steps, style, mood, rng}){
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
  const minor2 = clamp(midRoot+1,0,allNotes.length-1);
  const fifth  = clamp(midRoot+4,0,allNotes.length-1);
  let current=midRoot;

  const write=(i,p,v)=>{pattern[allNotes[i]][p]={on:true,velocity:v};};

  const motifLen = style==='goa'?8:16;
  const baseVel  = style==='goa'?105:95;
  const motif=[];

  // pondération phrygienne pour Goa : tonique > 2m > quinte > reste
  function weightedNext(){
    const r=rng();
    if(r<0.4) return midRoot;          // 40% tonique
    if(r<0.7) return minor2;           // 30% seconde mineure
    if(r<0.9) return fifth;            // 20% quinte
    // autre note aléatoire proche
    return clamp(current+([-3,-2,-1,1,2,3][rng()*6|0]),0,allNotes.length-1);
  }

  for(let i=0;i<motifLen;i++){
    const silenceProb = style==='goa'?0.05:0.4;
    if(i===0 || rng()>silenceProb){
      if(i!==0){
        current = (style==='goa')? weightedNext() : clamp(current+(rng()*5|0)-2,0,allNotes.length-1);
      }
      motif[i]=current;
    }else motif[i]=null;
  }

  // Écriture + petite option triolets (psy triplet riff)
  const triplet = (style==='psy' && rng()<0.25);
  for(let t=0;t<steps;t++){
    const pos = triplet? Math.floor((t*3)%steps) : t;
    const m=motif[pos%motifLen];
    if(m!==null) write(m,t,baseVel+rng()*25|0);
  }

  // hook fixe pour prog
  if(style==='prog'){
    write(midRoot,0,100);
    if(steps>=32) write(midRoot,16,100);
    write(fifth,steps/2|0,100);
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
  octaves={min:2,max:4},
  seed=null
} = {}){

  const rng = seed!==null ? mulberry32(seed) : Math.random;

  const allNotes = buildScale(rootNote, scale, octaves);
  const common   = {allNotes, rootNote, steps, style, mood, scale, rng};
  let pattern;

  switch(part){
    case 'bassline':  pattern=bassPattern(common);            break;
    case 'pad':       pattern=padPattern(common);             break;
    case 'arpeggio':  pattern=arpeggioPattern(common);        break;
    case 'hypnoticLead': pattern = hypnoticLeadPattern(common);    break;  
    default:          pattern=leadPattern(common);
  }

  // -------- Ambiance post‑traitement --------
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

/////////////////////////
// PATTERN : HYPNOTIQUE LEAD (Version qui bouge vraiment !)
/////////////////////////
function hypnoticLeadPattern({allNotes, rootNote, steps, style, mood, scale, rng}){
  const pattern = {};
  allNotes.forEach(n => pattern[n] = emptyRow(steps));

  if(allNotes.length === 0) return pattern;

  // Au lieu de se limiter à une octave, on utilise TOUTE la gamme disponible
  const noteIndices = allNotes.map((_, i) => i);
  
  // On trouve toutes les toniques dans toutes les octaves
  const rootIndices = allNotes.reduce((acc, note, i) => {
    if(note.startsWith(rootNote)) acc.push(i);
    return acc;
  }, []);

  if(rootIndices.length === 0) return pattern;

  const write = (idx, pos, vel = 100, extra = {}) => {
    if(idx >= 0 && idx < allNotes.length) {
      pattern[allNotes[idx]][pos] = {on: true, velocity: vel, ...extra};
    }
  };

  // Génère une séquence hypnotique qui évolue vraiment
  let currentIdx = rootIndices[Math.floor(rootIndices.length / 2)]; // Start au milieu
  
  // Paramètres selon le style
  let jumpRange = 3; // Combien de notes on peut sauter d'un coup
  let returnToRootProb = 0.3; // Probabilité de retour à une tonique
  let silenceProb = 0.2; // Probabilité de silence
  let stepDirection = 1; // Direction générale (1 = montant, -1 = descendant)
  
  if(style === 'goa') {
    jumpRange = 4;
    returnToRootProb = 0.4;
    silenceProb = 0.15;
  } else if(style === 'prog') {
    jumpRange = 2;
    returnToRootProb = 0.5;
    silenceProb = 0.3;
  }

  if(mood === 'dark') {
    jumpRange = Math.max(1, jumpRange - 1);
    silenceProb += 0.1;
  } else if(mood === 'uplifting') {
    jumpRange += 1;
    silenceProb = Math.max(0.1, silenceProb - 0.1);
  }

  // Génère le pattern avec une logique d'évolution
  for(let step = 0; step < steps; step++) {
    // Tous les 16 pas, on change potentiellement de direction
    if(step % 16 === 0 && step > 0) {
      if(rng() < 0.3) {
        stepDirection *= -1; // Change de direction
      }
    }

    // Décision : jouer une note ou faire silence
    if(rng() < silenceProb) {
      continue; // Silence pour que ça respire
    }

    // Décision : retourner à une tonique ou continuer l'exploration
    if(rng() < returnToRootProb) {
      // Retour à une tonique (peut être dans une autre octave)
      currentIdx = rootIndices[Math.floor(rng() * rootIndices.length)];
    } else {
      // Mouvement mélodique
      let nextIdx = currentIdx;
      
      // Choix du prochain pas selon le style
      if(style === 'goa') {
        // Mouvement plus libre pour la goa
        const jump = Math.floor(rng() * jumpRange * 2) - jumpRange; // -jumpRange à +jumpRange
        nextIdx = clamp(currentIdx + jump, 0, allNotes.length - 1);
      } else {
        // Mouvement plus contrôlé pour les autres styles
        const possibilities = [];
        
        // Ajoute les notes proches dans la direction courante
        for(let i = 1; i <= jumpRange; i++) {
          const upIdx = currentIdx + i;
          const downIdx = currentIdx - i;
          
          if(stepDirection > 0 && upIdx < allNotes.length) {
            possibilities.push(upIdx);
          }
          if(stepDirection < 0 && downIdx >= 0) {
            possibilities.push(downIdx);
          }
          
          // Ajoute aussi quelques possibilités dans l'autre direction (moins probable)
          if(rng() < 0.3) {
            if(stepDirection > 0 && downIdx >= 0) {
              possibilities.push(downIdx);
            }
            if(stepDirection < 0 && upIdx < allNotes.length) {
              possibilities.push(upIdx);
            }
          }
        }
        
        if(possibilities.length > 0) {
          nextIdx = possibilities[Math.floor(rng() * possibilities.length)];
        }
      }
      
      currentIdx = nextIdx;
    }

    // Calcule la vélocité avec des vagues d'intensité
    const cycleLength = 32; // Cycle plus long pour plus de subtilité
    const cyclePos = (step % cycleLength) / cycleLength;
    const wave1 = Math.sin(cyclePos * Math.PI * 2) * 0.2; // Vague principale
    const wave2 = Math.sin(cyclePos * Math.PI * 6) * 0.1; // Vague secondaire plus rapide
    const waveIntensity = 0.7 + wave1 + wave2; // Oscille entre ~0.4 et ~1.0

    let baseVelocity = 85;
    if(style === 'goa') baseVelocity = 100;
    if(style === 'prog') baseVelocity = 75;
    if(mood === 'dark') baseVelocity -= 15;
    if(mood === 'uplifting') baseVelocity += 20;

    const velocity = clamp(
      baseVelocity * waveIntensity + (rng() - 0.5) * 15,
      45, 127
    );

    // Effets spéciaux
    const extra = {};
    
    // Slide plus fréquent en fin de phrase
    if(step > 0 && (step % 16 === 15 || step % 8 === 7) && rng() < 0.4) {
      extra.slide = true;
    }
    
    // Accent sur les temps forts
    if(step % 8 === 0 && rng() < 0.3) {
      extra.accent = true;
    }

    write(currentIdx, step, velocity, extra);
  }

  // Ajoute quelques "événements" pour casser la monotonie
  if(steps >= 32) {
    for(let i = 0; i < 3; i++) {
      const eventStep = Math.floor(rng() * steps);
      const eventNote = rootIndices[Math.floor(rng() * rootIndices.length)];
      
      // Petite explosion de notes autour de l'événement
      for(let j = -1; j <= 1; j++) {
        const step = eventStep + j;
        if(step >= 0 && step < steps && rng() < 0.6) {
          const noteIdx = clamp(eventNote + j * 2, 0, allNotes.length - 1);
          write(noteIdx, step, 110 + rng() * 17);
        }
      }
    }
  }

  return pattern;
}