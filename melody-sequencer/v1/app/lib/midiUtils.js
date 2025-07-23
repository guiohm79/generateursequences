// Utilitaires pour l'export et la conversion MIDI
import { Midi } from "@tonejs/midi";
import * as Tone from "tone";

/**
 * Convertit le pattern actuel en données MIDI compatibles avec @tonejs/midi
 * @param {Object} pattern - Pattern du séquenceur
 * @returns {Array} Données MIDI sous forme de tableau d'octets
 */
export function convertPatternToMidiData(pattern) {
  // Créer un nouvel objet MIDI - avec le PPQ par défaut (480)
  const midi = new Midi();
  const track = midi.addTrack();
  
  // Note: PPQ is read-only in @tonejs/midi, it's already set to 480 by default
  // We'll use the default PPQ value for timing calculations
  const ppq = 480;
  
  // Parcourir le pattern pour ajouter les notes
  Object.entries(pattern).forEach(([note, steps]) => {
    if (Array.isArray(steps)) {
      steps.forEach((cell, stepIndex) => {
        if (cell && cell.on) {
          // Calcul de la durée et du timing en ticks
          const startTicks = stepIndex * (ppq / (steps.length / 4)); // 4 noires par mesure
          const durationTicks = ppq / (steps.length / 4); // Durée en ticks (une double-croche par défaut)
          
          // Convertir la note en numéro MIDI
          const midiNote = Tone.Frequency(note).toMidi();
          
          // Ajouter la note au track avec ticks au lieu de time
          track.addNote({
            midi: midiNote,
            ticks: startTicks,
            durationTicks: durationTicks,
            velocity: (cell.velocity || 100) / 127
          });
        }
      });
    }
  });
  
  return midi.toArray();
}

/**
 * Convertit un nom de note en numéro MIDI
 * @param {string} note - Nom de la note (ex: "C4", "F#3")
 * @returns {number} Numéro MIDI correspondant
 */
function noteNameToMidi(note) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let noteName = note.slice(0, -1);
  let octave = parseInt(note.slice(-1));
  let n = notes.indexOf(noteName);
  return (octave + 1) * 12 + n;
}

/**
 * Encode une valeur en longueur variable MIDI
 * @param {number} value - Valeur à encoder
 * @returns {Array} Octets encodés
 */
function writeVarLen(value) {
  let buffer = [];
  let bufferVal = value & 0x7F;
  while ((value >>= 7)) {
    bufferVal <<= 8;
    bufferVal |= ((value & 0x7F) | 0x80);
  }
  while (true) {
    buffer.push(bufferVal & 0xFF);
    if (bufferVal & 0x80) bufferVal >>= 8;
    else break;
  }
  return buffer;
}

/**
 * Exporte le pattern vers un fichier MIDI avec contrôles avancés
 * @param {Object} pattern - Pattern du séquenceur
 * @param {number} tempo - Tempo en BPM
 * @param {string} noteLength - Longueur des notes ("4n", "8n", "16n", "32n", "64n")
 * @param {number} steps - Nombre de pas dans le pattern
 */
export function exportToMidi(pattern, tempo, noteLength, steps) {
  // Résolution MIDI standard
  const ppq = 480;
  
  // Header MIDI
  let header = [
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00,
    0x00, 0x01,
    (ppq >> 8) & 0xFF, ppq & 0xFF
  ];
  
  let track = [];
  
  // Tempo
  let microsecPerBeat = Math.round(60000000 / tempo);
  track.push(0x00, 0xFF, 0x51, 0x03, 
    (microsecPerBeat >> 16) & 0xFF, 
    (microsecPerBeat >> 8) & 0xFF, 
    microsecPerBeat & 0xFF
  );
  
  // Définition des contrôleurs MIDI
  const CC_ACCENT = 16;
  const CC_SLIDE = 17;
  
  // NOUVELLE LOGIQUE : Calculer l'espacement temporel basé sur noteLength
  // noteLength détermine l'intervalle entre chaque step dans le séquenceur
  const stepIntervalMap = {
    "4n": ppq,        // 1 noire = 480 ticks (très lent)
    "8n": ppq / 2,    // 1 croche = 240 ticks (lent) 
    "16n": ppq / 4,   // 1 double-croche = 120 ticks (normal)
    "32n": ppq / 8,   // 1 triple-croche = 60 ticks (rapide)
    "64n": ppq / 16   // 1 quadruple-croche = 30 ticks (très rapide)
  };
  
  const ticksPerStep = stepIntervalMap[noteLength] || ppq / 4;
  
  // La durée de chaque note : légèrement plus courte que l'intervalle pour éviter les chevauchements
  const noteDurationTicks = Math.round(ticksPerStep * 0.8);
  
  console.log(`Export MIDI: noteLength=${noteLength}, ticksPerStep=${ticksPerStep}, noteDuration=${noteDurationTicks}, steps=${steps}`);
  
  // Collecter toutes les notes avec leur timing
  const midiEvents = [];
  
  // Parcourir chaque step
  for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
    const stepStartTime = stepIndex * ticksPerStep;
    const noteEndTime = stepStartTime + noteDurationTicks;
    
    // Collecter toutes les notes actives à ce step
    const activeNotes = [];
    Object.entries(pattern).forEach(([note, stepArray]) => {
      const cell = stepArray[stepIndex];
      if (cell && cell.on) {
        activeNotes.push({
          note,
          midiNote: noteNameToMidi(note),
          velocity: Math.round(cell.velocity || 100),
          accent: cell.accent || false,
          slide: cell.slide || false
        });
      }
    });
    
    // Ajouter les événements MIDI pour toutes les notes de ce step
    activeNotes.forEach((noteData) => {
      // Note On
      midiEvents.push({
        time: stepStartTime,
        type: 'noteOn',
        note: noteData.midiNote,
        velocity: noteData.accent ? Math.min(127, Math.round(noteData.velocity * 1.2)) : noteData.velocity,
        accent: noteData.accent,
        slide: noteData.slide
      });
      
      // Note Off
      midiEvents.push({
        time: noteEndTime,
        type: 'noteOff',
        note: noteData.midiNote,
        accent: noteData.accent,
        slide: noteData.slide
      });
    });
  }
  
  // Trier tous les événements par temps
  midiEvents.sort((a, b) => a.time - b.time);
  
  // Convertir les événements en données MIDI
  let currentTime = 0;
  
  midiEvents.forEach(event => {
    const deltaTime = event.time - currentTime;
    currentTime = event.time;
    
    if (event.type === 'noteOn') {
      // Control Changes pour accent et slide
      if (event.accent) {
        track.push(...writeVarLen(deltaTime), 0xB0, CC_ACCENT, 127);
        track.push(...writeVarLen(0), 0x90, event.note, event.velocity);
      } else if (event.slide) {
        track.push(...writeVarLen(deltaTime), 0xB0, CC_SLIDE, 127);
        track.push(...writeVarLen(0), 0x90, event.note, event.velocity);
      } else {
        track.push(...writeVarLen(deltaTime), 0x90, event.note, event.velocity);
      }
    } else if (event.type === 'noteOff') {
      track.push(...writeVarLen(deltaTime), 0x80, event.note, 0);
      
      // Reset des contrôleurs
      if (event.accent) {
        track.push(...writeVarLen(0), 0xB0, CC_ACCENT, 0);
      }
      if (event.slide) {
        track.push(...writeVarLen(0), 0xB0, CC_SLIDE, 0);
      }
    }
  });
  
  // End of track
  track.push(0x00, 0xFF, 0x2F, 0x00);
  
  // Calcul de la longueur du track
  let trackLen = track.length;
  let trackHeader = [
    0x4d, 0x54, 0x72, 0x6b,
    (trackLen >> 24) & 0xFF, 
    (trackLen >> 16) & 0xFF, 
    (trackLen >> 8) & 0xFF, 
    trackLen & 0xFF
  ];
  
  // Assemblage final
  let midi = new Uint8Array([...header, ...trackHeader, ...track]);
  let blob = new Blob([midi], { type: 'audio/midi' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = `melody_${tempo}bpm_${noteLength.replace('/', '')}_${steps}steps.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}