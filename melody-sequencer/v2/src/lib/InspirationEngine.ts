/**
 * InspirationEngine.ts - Générateur de séquences musicales
 * Inspiré du randomEngine.js de V1, adapté pour TypeScript et V2
 * Génère des patterns bass/lead/pad/arpeggio avec styles goa/psy/prog/deep
 */

import { NoteEvent } from '../app/inspiration/types';

// Types pour le générateur
export interface GenerationParams {
  root?: string;
  scale?: string;
  style?: string;
  part?: string;
  mood?: string;
  density?: number;
  steps?: number;
  minOct?: number;
  maxOct?: number;
  seed?: number;
}

export interface AmbiancePreset {
  name: string;
  description: string;
  scales: string[];
  styles: string[];
  moods: string[];
  tempoRange: [number, number];
  parts: string[];
  density: number;
  synthPresets: string[];
}

export interface GenerationResult {
  pattern: NoteEvent[];
  ambiance?: {
    name: string;
    description: string;
    suggestedTempo: number;
    suggestedSynth: string;
  };
  params: GenerationParams;
}

// Constantes musicales
export const NOTE_ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// Gammes disponibles (simplifiées pour V2)
export const SCALES = {
  major:            [0,2,4,5,7,9,11],
  minor:            [0,2,3,5,7,8,10],
  harmonicMinor:    [0,2,3,5,7,8,11],
  phrygian:         [0,1,3,5,7,8,10],
  phrygianDominant: [0,1,4,5,7,8,10],
  dorian:           [0,2,3,5,7,9,10],
  hungarianMinor:   [0,2,3,6,7,8,11],
  doubleHarmonic:   [0,1,4,5,7,8,11],
  neapolitanMinor:  [0,1,3,5,7,8,11],
  enigmatic:        [0,1,4,6,8,10,11],
  wholetone:        [0,2,4,6,8,10],
  bluesScale:       [0,3,5,6,7,10],
  japanese:         [0,1,5,7,8],
  arabicMaqam:      [0,1,4,5,7,8,10],
};

// Presets d'ambiance (sélection des meilleurs de V1)
export const AMBIANCE_PRESETS: Record<string, AmbiancePreset> = {
  nostalgique: {
    name: "Nostalgique",
    description: "Mélodies douces et mélancoliques",
    scales: ["minor", "dorian", "harmonicMinor"],
    styles: ["deep", "prog"],
    moods: ["dark"],
    tempoRange: [80, 110],
    parts: ["pad", "lead"],
    density: 0.4,
    synthPresets: ["pad", "bell"]
  },
  energique: {
    name: "Énergique", 
    description: "Patterns dynamiques et percutants",
    scales: ["phrygian", "phrygianDominant", "minor"],
    styles: ["goa", "psy"],
    moods: ["uplifting"],
    tempoRange: [130, 160],
    parts: ["bassline", "lead", "arpeggio"],
    density: 0.7,
    synthPresets: ["acid", "pluck"]
  },
  mysterieux: {
    name: "Mystérieux",
    description: "Ambiances sombres et énigmatiques", 
    scales: ["phrygian", "hungarianMinor", "enigmatic"],
    styles: ["deep", "prog"],
    moods: ["dark"],
    tempoRange: [90, 120],
    parts: ["pad", "hypnoticLead"],
    density: 0.3,
    synthPresets: ["pad", "bell", "mono"]
  },
  tribal: {
    name: "Tribal",
    description: "Rythmes primitifs et envoûtants",
    scales: ["minor", "phrygian", "japanese"],
    styles: ["goa", "psy"], 
    moods: ["dense"],
    tempoRange: [120, 140],
    parts: ["bassline", "arpeggio"],
    density: 0.6,
    synthPresets: ["acid", "pluck"]
  },
  cosmique: {
    name: "Cosmique",
    description: "Sonorités spatiales et éthérées",
    scales: ["major", "wholetone", "enigmatic"],
    styles: ["deep", "prog"],
    moods: ["uplifting"],
    tempoRange: [100, 130],
    parts: ["pad", "lead"],
    density: 0.5,
    synthPresets: ["pad", "bell"]
  },
  hypnotique: {
    name: "Hypnotique",
    description: "Patterns répétitifs et envoûtants",
    scales: ["minor", "phrygian", "arabicMaqam"],
    styles: ["goa", "psy"],
    moods: ["dense"],
    tempoRange: [125, 145],
    parts: ["hypnoticLead", "arpeggio"],
    density: 0.8,
    synthPresets: ["acid", "mono"]
  }
};

/**
 * Générateur de nombres pseudoaléatoires avec seed (Mulberry32)
 */
export function mulberry32(seed: number): () => number {
  return function(): number {
    seed |= 0; 
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Utilitaires
 */
const clamp = (value: number, min: number, max: number): number => 
  Math.max(min, Math.min(max, value));

/**
 * Construit la gamme sur une plage d'octaves
 */
function buildScale(root: string, scaleType: string, minOct: number, maxOct: number): string[] {
  const rootIdx = NOTE_ORDER.indexOf(root);
  const formula = SCALES[scaleType as keyof typeof SCALES] ?? SCALES.minor;
  const notes: string[] = [];
  
  for (let oct = minOct; oct <= maxOct; oct++) {
    for (const step of formula) {
      const noteIdx = (rootIdx + step) % 12;
      const note = NOTE_ORDER[noteIdx] + oct;
      notes.push(note);
    }
  }
  
  return notes;
}

/**
 * Générateurs de patterns par type
 */

// Pattern Bassline (Goa/Psy optimisé)
function generateBassPattern(
  allNotes: string[], 
  rootNote: string, 
  steps: number, 
  style: string, 
  mood: string, 
  rng: () => number
): NoteEvent[] {
  const pattern: NoteEvent[] = [];
  
  // Trouver les notes importantes
  const roots = allNotes.reduce((acc, note, i) => {
    if (note.startsWith(rootNote)) acc.push(i);
    return acc;
  }, [] as number[]);
  
  if (roots.length === 0) return pattern;
  
  const rootIdx = roots[0];
  const fifthIdx = clamp(rootIdx + 4, 0, allNotes.length - 1);
  const minor2Idx = clamp(rootIdx + 1, 0, allNotes.length - 1);
  const octIdx = clamp(rootIdx + 12, 0, allNotes.length - 1);
  const notePool = [rootIdx, fifthIdx, minor2Idx, octIdx];
  
  switch (style) {
    case 'goa':
    case 'psy': {
      const muteProb = 0.1;
      const varyProb = 0.15;
      
      for (let i = 0; i < steps; i++) {
        // Éviter les temps de kick (0, 4, 8, 12...)
        if (i % 4 !== 0) {
          if (i === steps - 1 && rng() < muteProb) {
            continue; // Petit trou avant le drop
          }
          
          const idx = rng() < varyProb ? 
            notePool[Math.floor(rng() * notePool.length)] : 
            rootIdx;
          
          const velocity = Math.floor(90 + rng() * 30);
          
          pattern.push({
            step: i,
            note: allNotes[idx],
            velocity,
            isActive: true,
            duration: 1
          });
        }
      }
      break;
    }
    
    case 'prog': {
      for (let i = 0; i < steps; i++) {
        if (i % 4 === 2) {
          const idx = rng() < 0.2 ? fifthIdx : rootIdx;
          const velocity = mood === 'soft' ? 100 : 115;
          
          pattern.push({
            step: i,
            note: allNotes[idx],
            velocity,
            isActive: true,
            duration: 1
          });
        }
      }
      break;
    }
    
    default: // deep / downtempo
      for (let i = 0; i < steps; i++) {
        if (i % 4 === 0) {
          const velocity = Math.floor(85 + rng() * 15);
          pattern.push({
            step: i,
            note: allNotes[rootIdx],
            velocity,
            isActive: true,
            duration: 1
          });
        } else if (rng() < 0.25) {
          const idx = notePool[Math.floor(rng() * notePool.length)];
          const velocity = Math.floor(60 + rng() * 40);
          pattern.push({
            step: i,
            note: allNotes[idx],
            velocity,
            isActive: true,
            duration: 1
          });
        }
      }
  }
  
  return pattern;
}

// Pattern Lead/Melody avec pondération Phrygienne
function generateLeadPattern(
  allNotes: string[], 
  rootNote: string, 
  steps: number, 
  style: string, 
  mood: string, 
  rng: () => number
): NoteEvent[] {
  const pattern: NoteEvent[] = [];
  
  const roots = allNotes.reduce((acc, note, i) => {
    if (note.startsWith(rootNote)) acc.push(i);
    return acc;
  }, [] as number[]);
  
  if (roots.length === 0) return pattern;
  
  const midRoot = roots[Math.floor(roots.length / 2)];
  const minor2 = clamp(midRoot + 1, 0, allNotes.length - 1);
  const fifth = clamp(midRoot + 4, 0, allNotes.length - 1);
  let current = midRoot;
  
  const motifLen = style === 'goa' ? 8 : 16;
  const baseVel = style === 'goa' ? 105 : 95;
  const motif: (number | null)[] = [];
  
  // Pondération phrygienne pour Goa
  function weightedNext(): number {
    const r = rng();
    if (r < 0.4) return midRoot;          // 40% tonique
    if (r < 0.7) return minor2;           // 30% seconde mineure  
    if (r < 0.9) return fifth;            // 20% quinte
    // Autre note proche
    const offset = [-3, -2, -1, 1, 2, 3][Math.floor(rng() * 6)];
    return clamp(current + offset, 0, allNotes.length - 1);
  }
  
  // Générer le motif
  for (let i = 0; i < motifLen; i++) {
    const silenceProb = style === 'goa' ? 0.05 : 0.4;
    if (i === 0 || rng() > silenceProb) {
      if (i !== 0) {
        current = style === 'goa' ? 
          weightedNext() : 
          clamp(current + Math.floor(rng() * 5) - 2, 0, allNotes.length - 1);
      }
      motif[i] = current;
    } else {
      motif[i] = null;
    }
  }
  
  // Appliquer le motif
  const triplet = style === 'psy' && rng() < 0.25;
  for (let t = 0; t < steps; t++) {
    const pos = triplet ? Math.floor((t * 3) % steps) : t;
    const m = motif[pos % motifLen];
    if (m !== null) {
      const velocity = Math.floor(baseVel + rng() * 25);
      pattern.push({
        step: t,
        note: allNotes[m],
        velocity,
        isActive: true,
        duration: 1
      });
    }
  }
  
  // Hook fixe pour prog
  if (style === 'prog') {
    pattern.push({
      step: 0,
      note: allNotes[midRoot],
      velocity: 100,
      isActive: true,
      duration: 1
    });
    
    if (steps >= 32) {
      pattern.push({
        step: 16,
        note: allNotes[midRoot],
        velocity: 100,
        isActive: true,
        duration: 1
      });
    }
    
    pattern.push({
      step: Math.floor(steps / 2),
      note: allNotes[fifth],
      velocity: 100,  
      isActive: true,
      duration: 1
    });
  }
  
  return pattern;
}

// Pattern Pad (notes tenues)
function generatePadPattern(
  allNotes: string[], 
  steps: number, 
  style: string, 
  mood: string, 
  rng: () => number
): NoteEvent[] {
  const pattern: NoteEvent[] = [];
  const upper = allNotes.slice(Math.floor(allNotes.length / 2));
  
  const interval = style === 'prog' ? 8 : 4;
  const hold = style === 'deep' ? 7 : 3;
  
  for (let t = 0; t < steps; t += interval) {
    const noteIdx = Math.floor(rng() * upper.length);
    const note = upper[noteIdx];
    const velocity = Math.floor(60 + rng() * 25);
    
    // Créer une note longue
    const duration = Math.min(hold, steps - t);
    pattern.push({
      step: t,
      note,
      velocity,
      isActive: true,
      duration
    });
  }
  
  return pattern;
}

// Pattern Arpège
function generateArpeggioPattern(
  allNotes: string[], 
  steps: number, 
  rng: () => number
): NoteEvent[] {
  const pattern: NoteEvent[] = [];
  let idx = Math.floor(allNotes.length / 2);
  
  for (let t = 0; t < steps; t++) {
    const velocity = Math.floor(90 + rng() * 25);
    pattern.push({
      step: t,
      note: allNotes[idx],
      velocity,
      isActive: true,
      duration: 1
    });
    
    const moves = [-2, -1, 1, 2];
    const move = moves[Math.floor(rng() * moves.length)];
    idx = clamp(idx + move, 0, allNotes.length - 1);
  }
  
  return pattern;
}

// Pattern Hypnotique Lead (version améliorée de V1)
function generateHypnoticLeadPattern(
  allNotes: string[], 
  rootNote: string, 
  steps: number, 
  style: string, 
  mood: string, 
  rng: () => number
): NoteEvent[] {
  const pattern: NoteEvent[] = [];
  
  if (allNotes.length === 0) return pattern;
  
  const rootIndices = allNotes.reduce((acc, note, i) => {
    if (note.startsWith(rootNote)) acc.push(i);
    return acc;
  }, [] as number[]);
  
  if (rootIndices.length === 0) return pattern;
  
  let currentIdx = rootIndices[Math.floor(rootIndices.length / 2)];
  
  // Paramètres selon le style
  let jumpRange = 3;
  let returnToRootProb = 0.3;
  let silenceProb = 0.2;
  let stepDirection = 1;
  
  if (style === 'goa') {
    jumpRange = 4;
    returnToRootProb = 0.4;
    silenceProb = 0.15;
  } else if (style === 'prog') {
    jumpRange = 2;
    returnToRootProb = 0.5;
    silenceProb = 0.3;
  }
  
  if (mood === 'dark') {
    jumpRange = Math.max(1, jumpRange - 1);
    silenceProb += 0.1;
  } else if (mood === 'uplifting') {
    jumpRange += 1;
    silenceProb = Math.max(0.1, silenceProb - 0.1);
  }
  
  // Générer le pattern
  for (let step = 0; step < steps; step++) {
    // Changer de direction tous les 16 pas
    if (step % 16 === 0 && step > 0) {
      if (rng() < 0.3) {
        stepDirection *= -1;
      }
    }
    
    // Silence pour respirer
    if (rng() < silenceProb) {
      continue;
    }
    
    // Retour à une tonique ou exploration
    if (rng() < returnToRootProb) {
      currentIdx = rootIndices[Math.floor(rng() * rootIndices.length)];
    } else {
      // Mouvement mélodique
      if (style === 'goa') {
        const jump = Math.floor(rng() * jumpRange * 2) - jumpRange;
        currentIdx = clamp(currentIdx + jump, 0, allNotes.length - 1);
      } else {
        const possibilities: number[] = [];
        
        for (let i = 1; i <= jumpRange; i++) {
          const upIdx = currentIdx + i;
          const downIdx = currentIdx - i;
          
          if (stepDirection > 0 && upIdx < allNotes.length) {
            possibilities.push(upIdx);
          }
          if (stepDirection < 0 && downIdx >= 0) {
            possibilities.push(downIdx);
          }
          
          // Quelques possibilités dans l'autre direction
          if (rng() < 0.3) {
            if (stepDirection > 0 && downIdx >= 0) {
              possibilities.push(downIdx);
            }
            if (stepDirection < 0 && upIdx < allNotes.length) {
              possibilities.push(upIdx);
            }
          }
        }
        
        if (possibilities.length > 0) {
          currentIdx = possibilities[Math.floor(rng() * possibilities.length)];
        }
      }
    }
    
    // Vélocité avec vagues d'intensité
    const cycleLength = 32;
    const cyclePos = (step % cycleLength) / cycleLength;
    const wave1 = Math.sin(cyclePos * Math.PI * 2) * 0.2;
    const wave2 = Math.sin(cyclePos * Math.PI * 6) * 0.1;
    const waveIntensity = 0.7 + wave1 + wave2;
    
    let baseVelocity = 85;
    if (style === 'goa') baseVelocity = 100;
    if (style === 'prog') baseVelocity = 75;
    if (mood === 'dark') baseVelocity -= 15;
    if (mood === 'uplifting') baseVelocity += 20;
    
    const velocity = clamp(
      baseVelocity * waveIntensity + (rng() - 0.5) * 15,
      45, 127
    );
    
    pattern.push({
      step,
      note: allNotes[currentIdx],
      velocity: Math.floor(velocity),
      isActive: true,
      duration: 1
    });
  }
  
  return pattern;
}

/**
 * Post-traitement selon l'ambiance (mood)
 */
function applyMoodProcessing(pattern: NoteEvent[], mood: string): NoteEvent[] {
  return pattern.map(note => {
    let newVelocity = note.velocity;
    
    switch (mood) {
      case 'dark':
        newVelocity = Math.max(35, newVelocity - 30);
        break;
      case 'uplifting':
        newVelocity = Math.min(127, newVelocity + 15);
        break;
      case 'dense':
        // La densité est gérée au niveau génération
        break;
    }
    
    return { ...note, velocity: newVelocity };
  });
}

/**
 * Fonction principale de génération
 */
export function generateMusicalPattern(params: GenerationParams = {}): NoteEvent[] {
  const {
    root = 'C',
    scale = 'minor',
    style = 'psy',
    mood = 'default',
    part = 'bassline',
    steps = 16,
    minOct = 2,
    maxOct = 4,
    seed
  } = params;
  
  const rng = seed !== undefined ? mulberry32(seed) : Math.random;
  const allNotes = buildScale(root, scale, minOct, maxOct);
  
  let pattern: NoteEvent[] = [];
  
  // Générer selon le type de part
  switch (part) {
    case 'bassline':
      pattern = generateBassPattern(allNotes, root, steps, style, mood, rng);
      break;
    case 'pad':
      pattern = generatePadPattern(allNotes, steps, style, mood, rng);
      break;
    case 'arpeggio':
      pattern = generateArpeggioPattern(allNotes, steps, rng);
      break;
    case 'hypnoticLead':
      pattern = generateHypnoticLeadPattern(allNotes, root, steps, style, mood, rng);
      break;
    default: // lead
      pattern = generateLeadPattern(allNotes, root, steps, style, mood, rng);
  }
  
  // Appliquer le post-traitement d'ambiance
  pattern = applyMoodProcessing(pattern, mood);
  
  // Ajouter de la densité si nécessaire
  if (mood === 'dense') {
    const extraNotes = Math.floor(steps * 0.3);
    for (let i = 0; i < extraNotes; i++) {
      const noteIdx = Math.floor(rng() * allNotes.length);
      const step = Math.floor(rng() * steps);
      
      // Éviter les doublons
      const exists = pattern.some(n => n.step === step && n.note === allNotes[noteIdx]);
      if (!exists) {
        pattern.push({
          step,
          note: allNotes[noteIdx],
          velocity: Math.floor(80 + rng() * 45),
          isActive: true,
          duration: 1
        });
      }
    }
  }
  
  return pattern;
}

/**
 * Génération basée sur un preset d'ambiance
 */
export function generateAmbiancePattern(
  ambianceName: string, 
  overrides: Partial<GenerationParams> = {}
): GenerationResult {
  const ambiance = AMBIANCE_PRESETS[ambianceName];
  if (!ambiance) {
    throw new Error(`Ambiance "${ambianceName}" non trouvée`);
  }
  
  const rng = mulberry32(overrides.seed || Date.now());
  
  const selectedScale = ambiance.scales[Math.floor(rng() * ambiance.scales.length)];
  const selectedStyle = ambiance.styles[Math.floor(rng() * ambiance.styles.length)];
  const selectedMood = ambiance.moods[Math.floor(rng() * ambiance.moods.length)];
  const selectedPart = ambiance.parts[Math.floor(rng() * ambiance.parts.length)];
  
  const params: GenerationParams = {
    root: overrides.root || NOTE_ORDER[Math.floor(rng() * NOTE_ORDER.length)],
    scale: selectedScale,
    style: selectedStyle,
    part: selectedPart,
    mood: selectedMood,
    density: overrides.density || ambiance.density,
    steps: overrides.steps || 16,
    minOct: overrides.minOct || 2,
    maxOct: overrides.maxOct || 4,
    seed: overrides.seed || Date.now()
  };
  
  const pattern = generateMusicalPattern(params);
  
  return {
    pattern,
    ambiance: {
      name: ambiance.name,
      description: ambiance.description,
      suggestedTempo: Math.floor(ambiance.tempoRange[0] + rng() * (ambiance.tempoRange[1] - ambiance.tempoRange[0])),
      suggestedSynth: ambiance.synthPresets[Math.floor(rng() * ambiance.synthPresets.length)]
    },
    params
  };
}

/**
 * Utilitaire pour obtenir la liste des ambiances disponibles
 */
export function getAvailableAmbiances(): string[] {
  return Object.keys(AMBIANCE_PRESETS);
}

/**
 * Utilitaire pour obtenir les informations d'une ambiance
 */
export function getAmbianceInfo(ambianceName: string): AmbiancePreset | null {
  return AMBIANCE_PRESETS[ambianceName] || null;
}