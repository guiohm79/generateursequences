// main-ui.js — Synth1 Ultimate Pro

const MAX_POLY = 6; // nombre de voix de polyphonie

window.addEventListener('click', async () => {
  await Tone.start();
  console.log('🔊 Audio démarré');
  setupSynthUI();
}, { once: true });

// --- Stockage des voix actives pour la polyphonie ---
let activeVoices = {};

function setupSynthUI() {
  // --- LFO unique, assignable ---
  let lfo = new Tone.LFO(4, -50, 50).start();
  let lfoGain = new Tone.Gain(0);

  // --- Paramètres globaux pour l'enveloppe filtre ---
  let envAmount = 0.5;

  // --- Fonctions pour appliquer tous les params à une voix (utile au random/au preset/reset) ---
  function applyAllParams(voice) {
    voice.setWave1(wave1.value);
    voice.setWave2(wave2.value);
    voice.setVol1(Number(vol1.value));
    voice.setVol2(Number(vol2.value));
    voice.setSub(Number(sub.value));
    voice.setDetune(Number(detune.value));
    voice.setBalance(Number(balance.value));
    voice.setPWM(Number(pwm2.value));
    voice.setFilter(Number(cutoff.value));
    voice.setRes(Number(res.value));
    voice.setEnvAmt(Number(envAmt.value));
    voice.setAtk(Number(atk.value));
    voice.setDecay(Number(decay.value));
    voice.setSustain(Number(sustain.value));
    voice.setRel(Number(rel.value));
    voice.setDelay(Number(delayCtrl.value));
    voice.setChorus(Number(chorusCtrl.value));
    voice.setReverb(Number(reverb.value));
    voice.setDisto(Number(disto.value));
  }

  // --- Génération de chaque "voix" (note jouée) ---
  function createVoice(note) {
    // --- Oscillateurs ---
    let osc1 = new Tone.Oscillator(note, "sawtooth").start();
    let osc2 = new Tone.Oscillator(note, "square").start();
    let subOsc = new Tone.Oscillator(Tone.Frequency(note).transpose(-12), "sine").start();
    let osc1Gain = new Tone.Gain(0.5);
    let osc2Gain = new Tone.Gain(0.5);
    let subGain = new Tone.Gain(0.3);

    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    subOsc.connect(subGain);

    // --- PWM sur osc2 (pour forme carrée uniquement) ---
    let pwmOsc = null, pwmGain = null;
    function setPWM(val) {
      if (osc2.type !== "square") return;
      if (!pwmOsc) {
        pwmOsc = new Tone.Oscillator(note, "sine").start();
        pwmGain = new Tone.Gain(0);
        pwmOsc.connect(pwmGain);
        pwmGain.connect(osc2.frequency);
      }
      pwmGain.gain.value = val * 20;
    }
    function removePWM() {
      if (pwmOsc) { pwmOsc.stop(); pwmOsc.disconnect(); pwmGain.disconnect(); pwmOsc = null; }
    }

    // --- Mixer les oscillateurs ---
    let oscMix = new Tone.Gain(1);
    osc1Gain.connect(oscMix);
    osc2Gain.connect(oscMix);
    subGain.connect(oscMix);

    // --- Filtre ---
    let filter = new Tone.Filter(1000, "lowpass");

    // --- Envelope globale ---
    let envelope = new Tone.AmplitudeEnvelope({ attack: 0.1, decay: 0.2, sustain: 0.7, release: 1.5 });

    // --- FX chain ---
    let fxChain = new Tone.Gain(1);
    let delay = new Tone.FeedbackDelay("8n", 0.2);
    let chorus = new Tone.Chorus(4, 2.5, 0.3).start();
    let reverb = new Tone.Reverb({ decay: 2, wet: 0.2 });
    let disto = new Tone.Distortion(0);

    oscMix.connect(envelope);
    envelope.connect(filter);
    filter.chain(delay, chorus, reverb, disto, fxChain, Tone.Destination);

    // --- Fonctions de réglage des params en temps réel ---
    return {
      note,
      osc1, osc2, subOsc,
      osc1Gain, osc2Gain, subGain,
      oscMix, filter, envelope,
      delay, chorus, reverb, disto,
      setWave1: type => osc1.type = type,
      setWave2: type => {
        osc2.type = type;
        if (type === "square") setPWM(Number(document.getElementById('pwm2').value));
        else removePWM();
      },
      setVol1: v => osc1Gain.gain.value = v,
      setVol2: v => osc2Gain.gain.value = v,
      setSub: v => subGain.gain.value = v,
      setDetune: v => osc2.detune.value = v,
      setBalance: v => {
        osc1Gain.gain.value = 1 - v;
        osc2Gain.gain.value = v;
      },
      setPWM: setPWM,
      setFilter: v => filter.frequency.value = v,
      setRes: v => filter.Q.value = v,
      setEnvAmt: v => envAmount = v,
      setAtk: v => envelope.attack = v,
      setDecay: v => envelope.decay = v,
      setSustain: v => envelope.sustain = v,
      setRel: v => envelope.release = v,
      setDelay: v => delay.delayTime.value = v,
      setChorus: v => chorus.depth = v,
      setReverb: v => reverb.wet.value = v,
      setDisto: v => disto.wet.value = v,
      trigger: (velocity=1) => {
        // Modulation cutoff par l’enveloppe
        let base = Number(document.getElementById('cutoff').value);
        let amt = envAmount * 4000;
        filter.frequency.setValueAtTime(base + amt, "+0.01");
        envelope.triggerAttack();
      },
      release: () => {
        envelope.triggerRelease();
      },
      glide: 0,
      setGlide: v => { this.glide = v; },
      destroy: () => {
        osc1.stop(); osc2.stop(); subOsc.stop();
        osc1.disconnect(); osc2.disconnect(); subOsc.disconnect();
        envelope.disconnect(); filter.disconnect(); delay.disconnect(); chorus.disconnect(); reverb.disconnect(); disto.disconnect(); fxChain.disconnect();
        removePWM();
      }
    };
  }

  // --- Gestion du clavier et des voix ---
  const keyboard = document.getElementById("keyboard");
  keyboard.innerHTML = '';
  const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  notes.forEach(note => {
    const btn = document.createElement('button');
    btn.textContent = note;
    btn.onmousedown = () => playNote(note);
    btn.onmouseup = () => releaseNote(note);
    btn.onmouseleave = () => releaseNote(note);
    keyboard.appendChild(btn);
  });

  function playNote(note) {
    if (Object.keys(activeVoices).length >= MAX_POLY) return;
    if (activeVoices[note]) return;
    let voice = createVoice(note);
    applyAllParams(voice);
    activeVoices[note] = voice;
    voice.trigger();
  }

  function releaseNote(note) {
    if (!activeVoices[note]) return;
    activeVoices[note].release();
    setTimeout(() => {
      if (activeVoices[note]) {
        activeVoices[note].destroy();
        delete activeVoices[note];
      }
    }, 1000);
  }

  // --- Mappage contrôles UI <-> synthé ---
  const wave1 = document.getElementById("wave1");
  const wave2 = document.getElementById("wave2");
  const vol1 = document.getElementById("vol1");
  const vol1Val = document.getElementById("vol1Val");
  const vol2 = document.getElementById("vol2");
  const vol2Val = document.getElementById("vol2Val");
  const detune = document.getElementById("detune");
  const detuneVal = document.getElementById("detuneVal");
  const pwm2 = document.getElementById("pwm2");
  const pwm2Val = document.getElementById("pwm2Val");
  const sub = document.getElementById("sub");
  const subVal = document.getElementById("subVal");
  const balance = document.getElementById("balance");
  const balanceVal = document.getElementById("balanceVal");
  const glide = document.getElementById("glide");
  const glideVal = document.getElementById("glideVal");
  const cutoff = document.getElementById("cutoff");
  const cutoffVal = document.getElementById("cutoffVal");
  const res = document.getElementById("res");
  const resVal = document.getElementById("resVal");
  const envAmt = document.getElementById("envAmt");
  const envAmtVal = document.getElementById("envAmtVal");
  const atk = document.getElementById("atk");
  const atkVal = document.getElementById("atkVal");
  const decay = document.getElementById("decay");
  const decayVal = document.getElementById("decayVal");
  const sustain = document.getElementById("sustain");
  const sustainVal = document.getElementById("sustainVal");
  const rel = document.getElementById("rel");
  const relVal = document.getElementById("relVal");
  const lfoRate = document.getElementById("lfoRate");
  const lfoRateVal = document.getElementById("lfoRateVal");
  const lfoDepth = document.getElementById("lfoDepth");
  const lfoDepthVal = document.getElementById("lfoDepthVal");
  const lfoDest = document.getElementById("lfoDest");
  const delayCtrl = document.getElementById("delay");
  const delayVal = document.getElementById("delayVal");
  const chorusCtrl = document.getElementById("chorus");
  const chorusVal = document.getElementById("chorusVal");
  const reverb = document.getElementById("reverb");
  const reverbVal = document.getElementById("reverbVal");
  const disto = document.getElementById("disto");
  const distoVal = document.getElementById("distoVal");

  [
    [vol1, vol1Val], [vol2, vol2Val], [detune, detuneVal], [pwm2, pwm2Val], [sub, subVal],
    [balance, balanceVal], [glide, glideVal], [cutoff, cutoffVal], [res, resVal],
    [envAmt, envAmtVal], [atk, atkVal], [decay, decayVal], [sustain, sustainVal], [rel, relVal],
    [lfoRate, lfoRateVal], [lfoDepth, lfoDepthVal], [delayCtrl, delayVal],
    [chorusCtrl, chorusVal], [reverb, reverbVal], [disto, distoVal]
  ].forEach(([input, span]) => input.addEventListener('input', () => span.textContent = input.value)
  );
  [
    [wave1, v => Object.values(activeVoices).forEach(voice => voice.setWave1(v.target.value))],
    [wave2, v => Object.values(activeVoices).forEach(voice => voice.setWave2(v.target.value))],
    [vol1, v => Object.values(activeVoices).forEach(voice => voice.setVol1(Number(v.target.value)))],
    [vol2, v => Object.values(activeVoices).forEach(voice => voice.setVol2(Number(v.target.value)))],
    [sub, v => Object.values(activeVoices).forEach(voice => voice.setSub(Number(v.target.value)))],
    [detune, v => Object.values(activeVoices).forEach(voice => voice.setDetune(Number(v.target.value)))],
    [balance, v => Object.values(activeVoices).forEach(voice => voice.setBalance(Number(v.target.value)))],
    [pwm2, v => Object.values(activeVoices).forEach(voice => voice.setPWM(Number(v.target.value)))],
    [cutoff, v => Object.values(activeVoices).forEach(voice => voice.setFilter(Number(v.target.value)))],
    [res, v => Object.values(activeVoices).forEach(voice => voice.setRes(Number(v.target.value)))],
    [envAmt, v => Object.values(activeVoices).forEach(voice => voice.setEnvAmt(Number(v.target.value)))],
    [atk, v => Object.values(activeVoices).forEach(voice => voice.setAtk(Number(v.target.value)))],
    [decay, v => Object.values(activeVoices).forEach(voice => voice.setDecay(Number(v.target.value)))],
    [sustain, v => Object.values(activeVoices).forEach(voice => voice.setSustain(Number(v.target.value)))],
    [rel, v => Object.values(activeVoices).forEach(voice => voice.setRel(Number(v.target.value)))],
    [delayCtrl, v => Object.values(activeVoices).forEach(voice => voice.setDelay(Number(v.target.value)))],
    [chorusCtrl, v => Object.values(activeVoices).forEach(voice => voice.setChorus(Number(v.target.value)))],
    [reverb, v => Object.values(activeVoices).forEach(voice => voice.setReverb(Number(v.target.value)))],
    [disto, v => Object.values(activeVoices).forEach(voice => voice.setDisto(Number(v.target.value)))]
  ].forEach(([input, fn]) =>
    input.addEventListener('input', fn)
  );

  // --- LFO assignable ---
  lfoRate.oninput = e => lfo.frequency.value = Number(e.target.value);
  lfoDepth.oninput = e => lfoGain.gain.value = Number(e.target.value);

  lfo.connect(lfoGain);

  lfoDest.onchange = () => updateLFODestination();
  function updateLFODestination() {
    lfoGain.disconnect();
    let dest = lfoDest.value;
    if (dest === "pitch") {
      Object.values(activeVoices).forEach(voice => lfoGain.connect(voice.osc1.frequency));
    } else if (dest === "cutoff") {
      Object.values(activeVoices).forEach(voice => lfoGain.connect(voice.filter.frequency));
    } else if (dest === "amp") {
      Object.values(activeVoices).forEach(voice => lfoGain.connect(voice.envelope));
    }
  }

  glide.oninput = e => {
    // Portamento non implémenté ici, cf. note dans version précédente
  };

  document.getElementById("randomize").onclick = () => randomizeSynth();
  document.getElementById("reset").onclick = () => resetSynth();

  function randomizeSynth() {
    function r(min, max, step = 1) {
      const val = Math.floor(Math.random() * ((max - min) / step + 1)) * step + min;
      return Number(val.toFixed(2));
    }
    wave1.value = ["sine", "square", "sawtooth", "triangle"][r(0,3)];
    wave2.value = ["sine", "square", "sawtooth", "triangle"][r(0,3)];
    vol1.value = r(0.2,1,0.01);
    vol2.value = r(0.2,1,0.01);
    detune.value = r(-50,50,1);
    pwm2.value = r(0,1,0.01);
    sub.value = r(0,1,0.01);
    balance.value = r(0,1,0.01);
    glide.value = r(0,0.3,0.01);
    cutoff.value = r(400,4000,1);
    res.value = r(0,20,1);
    envAmt.value = r(0,1,0.01);
    atk.value = r(0,2,0.01);
    decay.value = r(0,2,0.01);
    sustain.value = r(0.2,1,0.01);
    rel.value = r(0.2,3,0.01);
    lfoRate.value = r(0.2,8,0.1);
    lfoDepth.value = r(0,100,1);
    lfoDest.value = ["pitch","cutoff","amp"][r(0,2)];
    delayCtrl.value = r(0,1,0.01);
    chorusCtrl.value = r(0,1,0.01);
    reverb.value = r(0,1,0.01);
    disto.value = r(0,1,0.01);
    document.querySelectorAll('input[type=range]').forEach(el => el.dispatchEvent(new Event('input')));
    Object.values(activeVoices).forEach(applyAllParams);
  }

  function resetSynth() {
    wave1.value = "sawtooth";
    wave2.value = "square";
    vol1.value = 0.5;
    vol2.value = 0.5;
    detune.value = 0;
    pwm2.value = 0.5;
    sub.value = 0.3;
    balance.value = 0.5;
    glide.value = 0;
    cutoff.value = 1000;
    res.value = 0;
    envAmt.value = 0.5;
    atk.value = 0.1;
    decay.value = 0.2;
    sustain.value = 0.7;
    rel.value = 1.5;
    lfoRate.value = 4;
    lfoDepth.value = 0;
    lfoDest.value = "pitch";
    delayCtrl.value = 0.2;
    chorusCtrl.value = 0.3;
    reverb.value = 0.2;
    disto.value = 0;
    document.querySelectorAll('input[type=range]').forEach(el => el.dispatchEvent(new Event('input')));
    Object.values(activeVoices).forEach(applyAllParams);
  }
  // Force la mise à jour de tous les spans valeurs à l'ouverture
document.querySelectorAll('input[type=range]').forEach(el => el.dispatchEvent(new Event('input')));

}
