// /app/lib/synthPresets.js

export const SYNTH_PRESETS = [
  {
    key: "classicSaw",
    label: "Classic Saw",
    description: "Osc Saw, decay court, son trance/acid.",
    synthType: "PolySynth",
    voiceMode: "poly",
    options: {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.12 },
      filter: { frequency: 1200, Q: 1 }
    }
  },
  {
    key: "fatSquare",
    label: "Fat Square",
    description: "Square + unison, bassline puissante.",
    synthType: "PolySynth",
    voiceMode: "poly",
    options: {
      oscillator: { type: "square" },
      envelope: { attack: 0.005, decay: 0.12, sustain: 0.5, release: 0.17 },
      filter: { frequency: 800, Q: 2 }
    }
  },
  {
    key: "acid303",
    label: "Acid 303 Mono",
    description: "Mono Synth acid, glisse rapide.",
    synthType: "MonoSynth",
    voiceMode: "mono",
    options: {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.02, decay: 0.14, sustain: 0.3, release: 0.1 },
      filter: { frequency: 600, Q: 8, rolloff: -24 },
      filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.05, baseFrequency: 300, octaves: 4 }
    }
  },
  {
    key: "fmTrance",
    label: "FM Trance",
    description: "FM, brillance, pads et leads modernes.",
    synthType: "FMSynth",
    voiceMode: "poly",
    options: {
      envelope: { attack: 0.05, decay: 0.22, sustain: 0.8, release: 0.5 },
      modulation: { type: "sine" },
      modulationIndex: 3,
      harmonicity: 1.5
    }
  },
  // ... Ajoute-en autant que tu veux !
];
