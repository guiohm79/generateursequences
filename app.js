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


// Synthé multi-modes selon sélection
let synthType = 'synth'; // valeur par défaut

function getSynth() {
    switch(synthType) {
        case 'sine':     return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sine" } }).toDestination();
        case 'square':   return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "square" } }).toDestination();
        case 'triangle': return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" } }).toDestination();
        case 'fm':       return new Tone.PolySynth(Tone.FMSynth).toDestination();
        case 'duo':      return new Tone.PolySynth(Tone.DuoSynth).toDestination();
        case 'mono':     return new Tone.MonoSynth().toDestination();
        default:         return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" } }).toDestination();
    }
}
let synth = getSynth();



/* ----------- UTILS ----------- */
function noteToFrequency(note) {
    let noteName = note.slice(0, -1);
    let octave = parseInt(note.slice(-1));
    let n = notes.indexOf(noteName);
    return 440 * Math.pow(2, ((octave - 4) * 12 + n - 9) / 12);
}
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

/* ----------- PIANO ROLL GRID ----------- */
// À la place de getScaleNotes :
function getFullPianoNotes(from = 3, to = 5) { // C3 à B5 par défaut
    const noteRows = [];
    for(let octave=to; octave>=from; octave--) {
        for(let n=notes.length-1; n>=0; n--) {
            let note = notes[n] + octave;
            noteRows.push({
                note: note,
                isBlack: notes[n].includes('#'),
                frequency: noteToFrequency(note)
            });
        }
    }
    return noteRows;
}

function initializePianoRoll() {
    const grid = document.getElementById('pianoGrid');
    grid.innerHTML = '';
    const pianoNotes = getFullPianoNotes(3, 5); // 3 octaves, adapte si besoin
    pianoNotes.forEach(noteData => {
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
    renderStepHeader(); // Ajoute la ligne de numérotation au dessus
}

function renderStepHeader() {
    let stepHeader = document.getElementById('stepHeader');
    stepHeader.innerHTML = '';
    let headerRow = document.createElement('div');
    headerRow.className = 'note-row';
    // Cellule vide en début pour aligner avec les notes
    let empty = document.createElement('div');
    empty.className = 'note-label';
    empty.style.background = 'transparent';
    empty.style.border = 'none';
    empty.textContent = '';
    headerRow.appendChild(empty);
    // Pas
    for (let i = 0; i < currentSteps; i++) {
        let stepCell = document.createElement('div');
        stepCell.className = 'step-header-cell';
        stepCell.textContent = (i+1);
        // Assombrir pas multiples de 4 (ou 1,5,9,13…)
        if (i % 4 === 0) stepCell.style.background = '#16161c';
        headerRow.appendChild(stepCell);
    }
    stepHeader.appendChild(headerRow);
}


function toggleStep(e) {
    const note = this.dataset.note;
    const step = parseInt(this.dataset.step);
    pattern[note][step] = pattern[note][step] ? 0 : 1;
    initializePianoRoll();
}

/* -----------tone.js ----------- */
function playStep() {
    if (!Tone.context.state || Tone.context.state !== "running") Tone.start();
        const pianoNotes = getFullPianoNotes(3, 5);
        const noteRows = Array.from(document.getElementsByClassName('note-row'));
        document.querySelectorAll('.step-cell').forEach(cell => cell.classList.remove('playing'));

        pianoNotes.forEach((noteData, idx) => {
            const noteName = noteData.note;
            // On cherche LA ligne DOM qui a le bon label (et pas juste l’index)
            const row = noteRows.find(r => r.children[0].textContent === noteName);
            if (row && pattern[noteName][currentStep]) {
                if (synth.triggerAttackRelease) {
                    synth.triggerAttackRelease(noteName, "16n");
                } else if (synth.triggerAttack) {
                    synth.triggerAttack(noteName, Tone.now(), 0.8);
                    setTimeout(() => synth.triggerRelease(noteName), 130);
                }
                row.children[currentStep + 1].classList.add('playing');
            }
        });
    currentStep = (currentStep + 1) % currentSteps;
}


/* ----------- TRANSPORT & CONTROLS ----------- */

function startSequencer() {
    if (isPlaying) return;
    if (Tone.context.state !== 'running') {
    Tone.context.resume();
    }
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
    const notesList = getFullPianoNotes(3, 5);
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
    const pianoNotes = getFullPianoNotes(3, 5); // SANS .reverse()
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
        pianoNotes.forEach(nd => {
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

document.getElementById('soundSelector').onchange = function() {
    synthType = this.value;
    synth = getSynth(); // recharge un synthé tout neuf
};


document.querySelectorAll('.idea-btn').forEach(btn => btn.onclick = function() {
    document.getElementById('melodyInput').value = this.dataset.idea;
});

/* ----------- INIT (au chargement) ----------- */
initializePianoRoll();
document.getElementById('tempoValue').textContent = document.getElementById('tempoSlider').value + ' BPM';
document.getElementById('octaveValue').textContent = notes[0] + currentOctave;
document.getElementById('scaleInfo').textContent = 'Scale: ' + currentKey + ' ' + capitalize(currentScale);