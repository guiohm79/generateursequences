/* ---------- VARIABLES DE BASE ---------- */
let currentSteps = 16;
let currentOctave = 4;
let isPlaying = false;
let currentStep = 0;
let intervalId = null;
let audioContext;
let oscillators = [];

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const scales = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10]
};
let currentScale = 'major';
let currentKey = 'C';
let pattern = {};

const presets = {
    trance: {scale: 'minor', key: 'A', notes: ['A3', 'C4', 'E4', 'A4', 'C5', 'E5', 'A5'], pattern: {'A3': [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],'C4': [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],'E4': [0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0],'A4': [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1]}},
    psytrance: {scale: 'phrygian', key: 'D', notes: ['D3', 'Eb3', 'G3', 'A3', 'D4', 'Eb4', 'G4'], pattern: {'D3': [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],'G3': [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],'A3': [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]}},
    ambient: {scale: 'major', key: 'C', notes: ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5'], pattern: {'C3': [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],'E3': [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],'G3': [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],'C4': [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0]}},
    downtempo: {scale: 'dorian', key: 'E', notes: ['E3', 'F#3', 'G3', 'A3', 'B3', 'C#4', 'D4'], pattern: {'E3': [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],'G3': [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],'B3': [0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0]}},
    goa: {scale: 'mixolydian', key: 'G', notes: ['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4'], pattern: {'G3': [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],'C4': [0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0],'D4': [0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0]}},
    progressive: {scale: 'minor', key: 'F', notes: ['F3', 'G3', 'Ab3', 'Bb3', 'C4', 'Db4', 'Eb4'], pattern: {'F3': [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],'Ab3': [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],'C4': [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]}}
};

/* ----------- UTILS ----------- */
function noteToFrequency(note) {
    let noteName = note.slice(0, -1);
    let octave = parseInt(note.slice(-1));
    let n = notes.indexOf(noteName);
    return 440 * Math.pow(2, ((octave - 4) * 12 + n - 9) / 12);
}
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

/* ----------- PIANO ROLL GRID ----------- */
function getScaleNotes() {
    const scaleIntervals = scales[currentScale];
    const baseNote = notes.indexOf(currentKey);
    const scaleNotes = [];
    for (let octave = currentOctave - 1; octave <= currentOctave + 1; octave++) {
        scaleIntervals.forEach(interval => {
            const noteIndex = (baseNote + interval) % 12;
            const noteName = notes[noteIndex];
            const fullNote = noteName + octave;
            const isBlack = noteName.includes('#');
            scaleNotes.push({
                note: fullNote,
                isBlack: isBlack,
                frequency: noteToFrequency(fullNote)
            });
        });
    }
    return scaleNotes;
}
function initializePianoRoll() {
    const grid = document.getElementById('pianoGrid');
    grid.innerHTML = '';
    const scaleNotes = getScaleNotes();
    scaleNotes.slice().reverse().forEach(noteData => {
        const row = document.createElement('div');
        row.className = 'note-row';
        // Label
        const label = document.createElement('div');
        label.className = `note-label ${noteData.isBlack ? 'black-key' : ''}`;
        label.textContent = noteData.note;
        row.appendChild(label);
        // Steps
        if (!pattern[noteData.note]) pattern[noteData.note] = new Array(currentSteps).fill(0);
        for (let i = 0; i < currentSteps; i++) {
            const cell = document.createElement('div');
            cell.className = 'step-cell';
            cell.dataset.note = noteData.note;
            cell.dataset.step = i;
            cell.addEventListener('click', toggleStep);
            if (pattern[noteData.note][i]) cell.classList.add('active');
            row.appendChild(cell);
        }
        grid.appendChild(row);
    });
}
function toggleStep(e) {
    const note = this.dataset.note;
    const step = parseInt(this.dataset.step);
    pattern[note][step] = pattern[note][step] ? 0 : 1;
    initializePianoRoll();
}

/* ----------- TRANSPORT & CONTROLS ----------- */
function playStep() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const scaleNotes = getScaleNotes().slice().reverse();
    // Visuel: highlight le step en cours
    document.querySelectorAll('.step-cell').forEach(cell => cell.classList.remove('playing'));
    scaleNotes.forEach((noteData, rowIdx) => {
        const row = document.getElementsByClassName('note-row')[rowIdx];
        if (pattern[noteData.note][currentStep]) {
            // Audio
            const osc = audioContext.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.value = noteData.frequency;
            const gain = audioContext.createGain();
            gain.gain.value = 0.12;
            osc.connect(gain).connect(audioContext.destination);
            osc.start();
            osc.stop(audioContext.currentTime + 0.22);
            // Visuel
            row.children[currentStep+1].classList.add('playing');
        }
    });
    currentStep = (currentStep + 1) % currentSteps;
}
function startSequencer() {
    if (isPlaying) return;
    isPlaying = true;
    document.getElementById('statusIndicator').classList.add('active');
    const tempo = parseInt(document.getElementById('tempoSlider').value);
    playStep();
    intervalId = setInterval(playStep, 60000/tempo/4); // 1/16th note
}
function stopSequencer() {
    isPlaying = false;
    document.getElementById('statusIndicator').classList.remove('active');
    clearInterval(intervalId);
    document.querySelectorAll('.step-cell').forEach(cell => cell.classList.remove('playing'));
}
function clearPattern() {
    Object.keys(pattern).forEach(note => pattern[note] = Array(currentSteps).fill(0));
    initializePianoRoll();
}

/* ----------- RANDOMIZER ----------- */
function randomizePattern() {
    Object.keys(pattern).forEach(note => pattern[note] = Array(currentSteps).fill(0));
    const notesList = getScaleNotes();
    for (let i = 0; i < currentSteps; i++) {
        if (Math.random() < 0.6) continue;
        let candidates = notesList.filter(() => Math.random() < 0.45);
        if (candidates.length === 0) candidates = [notesList[Math.floor(Math.random()*notesList.length)]];
        const howMany = Math.random() < 0.7 ? 1 : 2;
        for(let j=0;j<howMany && j<candidates.length;j++) {
            pattern[candidates[j].note][i] = 1;
        }
    }
    initializePianoRoll();
}

/* ----------- MIDI EXPORT ----------- */
function exportPatternToMidi() {
    const scaleNotes = getScaleNotes().reverse();
    function noteNameToMidi(note) {
        let noteName = note.slice(0,-1);
        let octave = parseInt(note.slice(-1));
        let n = notes.indexOf(noteName);
        return (octave+1)*12 + n;
    }
    let midi = [
        0x4d,0x54,0x68,0x64,0x00,0x00,0x00,0x06,0x00,0x00,0x00,0x01,0x00,0x60,
        0x4d,0x54,0x72,0x6b
    ];
    let track = [];
    let tempo = 60000000/parseInt(document.getElementById('tempoSlider').value);
    track.push(0x00, 0xff, 0x51, 0x03, (tempo>>16)&0xFF, (tempo>>8)&0xFF, tempo&0xFF);
    const ticksPerBeat = 96;
    for (let i=0; i<currentSteps; i++) {
        let notesOn = [];
        scaleNotes.forEach(nd => {
            if (pattern[nd.note][i]) {
                track.push(0x00, 0x90, noteNameToMidi(nd.note), 100);
                notesOn.push(nd.note);
            }
        });
        if (notesOn.length > 0) {
            track.push(0x18, ...notesOn.map(n=>[0x80, noteNameToMidi(n), 0]).flat());
        }
    }
    track.push(0x00,0xff,0x2f,0x00);
    let trackLen = track.length;
    midi.push((trackLen>>24)&0xFF, (trackLen>>16)&0xFF, (trackLen>>8)&0xFF, trackLen&0xFF);
    midi.push(...track);
    let blob = new Blob([new Uint8Array(midi)], {type:'audio/midi'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'melody.mid';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },100);
}

/* ----------- HANDLERS (UI, PRESETS, ETC) ----------- */
document.getElementById('playBtn').onclick = startSequencer;
document.getElementById('stopBtn').onclick = stopSequencer;
document.getElementById('clearBtn').onclick = clearPattern;
document.getElementById('randomBtn').onclick = randomizePattern;
document.getElementById('exportMidiBtn').onclick = exportPatternToMidi;
document.querySelectorAll('.steps-btn').forEach(btn => btn.onclick = function() {
    currentSteps = parseInt(this.dataset.steps);
    document.querySelectorAll('.steps-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    Object.keys(pattern).forEach(note => {
        let arr = pattern[note];
        if (arr.length < currentSteps) pattern[note] = arr.concat(new Array(currentSteps-arr.length).fill(0));
        else if (arr.length > currentSteps) pattern[note] = arr.slice(0, currentSteps);
    });
    initializePianoRoll();
});
document.getElementById('tempoSlider').oninput = function() {
    document.getElementById('tempoValue').textContent = this.value + ' BPM';
    if (isPlaying) { stopSequencer(); startSequencer(); }
};
document.getElementById('octaveSlider').oninput = function() {
    currentOctave = parseInt(this.value);
    document.getElementById('octaveValue').textContent = notes[0] + currentOctave;
    initializePianoRoll();
};
document.querySelectorAll('.preset-btn').forEach(btn => btn.onclick = function() {
    let pr = presets[this.dataset.preset];
    currentScale = pr.scale;
    currentKey = pr.key;
    pattern = {};
    Object.keys(pr.pattern).forEach(n => pattern[n] = pr.pattern[n].slice());
    document.getElementById('scaleInfo').textContent = 'Scale: ' + currentKey + ' ' + capitalize(currentScale);
    initializePianoRoll();
});
document.querySelectorAll('.idea-btn').forEach(btn => btn.onclick = function() {
    document.getElementById('melodyInput').value = this.dataset.idea;
});

/* ----------- INIT (au chargement) ----------- */
initializePianoRoll();
document.getElementById('tempoValue').textContent = document.getElementById('tempoSlider').value + ' BPM';
document.getElementById('octaveValue').textContent = notes[0] + currentOctave;
document.getElementById('scaleInfo').textContent = 'Scale: ' + currentKey + ' ' + capitalize(currentScale);