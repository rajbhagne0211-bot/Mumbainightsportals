/* Generative house beat (Web Audio, no audio files) + audio-reactive state.
   window.BN_AUDIO = { on, level (0-1 smoothed energy), beat (0-1 kick pulse), bins }  */
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  var state = window.BN_AUDIO = { on: false, level: 0, beat: 0, bins: new Uint8Array(32), supported: !!AC };
  var ctx, master, analyser, delay, noiseBuf, timer, nextTime = 0, step = 0, bar = 0, data;
  var BPM = 122, SPS = 60 / BPM / 4; // seconds per 16th
  var CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  var ROOTS = [33, 29, 36, 31];
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function init() {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    var comp = ctx.createDynamicsCompressor();
    analyser = ctx.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.78;
    delay = ctx.createDelay(1); delay.delayTime.value = SPS * 3;
    var fb = ctx.createGain(); fb.gain.value = 0.32; var dl = ctx.createGain(); dl.gain.value = 0.28;
    delay.connect(fb); fb.connect(delay); delay.connect(dl); dl.connect(master);
    master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
    data = new Uint8Array(analyser.frequencyBinCount);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var ch = noiseBuf.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }

  function kick(t) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.4);
  }
  function noise(t, dur, type, freq, vol, send) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    var g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); if (send) g.connect(delay);
    s.start(t); s.stop(t + dur + 0.02);
  }
  function tone(t, midi, dur, type, vol, cutoff, send) {
    var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = type; o.frequency.value = mtof(midi);
    f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff, t); f.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.25), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f); f.connect(g); g.connect(master); if (send) g.connect(delay);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function schedule(t, s, b) {
    var chord = CHORDS[b % 4], root = ROOTS[b % 4];
    if (s % 4 === 0) kick(t);
    if (s === 4 || s === 12) { noise(t, 0.2, 'bandpass', 1700, 0.35, true); }
    if (s % 4 === 2) noise(t, 0.16, 'highpass', 7500, 0.16);
    else if (s % 2 === 1) noise(t, 0.04, 'highpass', 9000, 0.06);
    if (s % 4 === 2) tone(t, root + 12, SPS * 3, 'sawtooth', 0.2, 900);
    var arp = [0, 3, 6, 9, 12, 14];
    if (arp.indexOf(s) > -1) tone(t, chord[(arp.indexOf(s) + b) % 3] + 12 + (s > 8 ? 12 : 0), SPS * 2.2, 'square', 0.06, 2600, true);
    if (s === 0) { chord.forEach(function (n) { tone(t, n, SPS * 15, 'sawtooth', 0.035, 700); }); }
  }

  function pump() {
    while (nextTime < ctx.currentTime + 0.14) {
      schedule(nextTime, step, bar);
      if (step % 4 === 0) { var delayMs = Math.max(0, (nextTime - ctx.currentTime) * 1000); setTimeout(function () { state.beat = 1; }, delayMs); }
      nextTime += SPS; step++; if (step === 16) { step = 0; bar++; }
    }
  }

  function setUI(on) {
    document.documentElement.classList.toggle('music-on', on);
    document.querySelectorAll('[data-sound]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? 'Turn music off' : 'Turn music on');
      var l = b.querySelector('.lbl'); if (l) l.textContent = b.classList.contains('vb-btn') ? (on ? 'Pause the vibe' : 'Play the vibe') : (on ? 'Sound on' : 'Sound');
    });
  }

  function start() {
    if (!AC) return;
    if (!ctx) init();
    ctx.resume();
    nextTime = ctx.currentTime + 0.08; step = 0;
    clearInterval(timer); timer = setInterval(pump, 25);
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.25);
    state.on = true; setUI(true);
  }
  function stop() {
    if (!ctx) return;
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
    clearInterval(timer);
    setTimeout(function () { if (!state.on) ctx.suspend(); }, 500);
    state.on = false; setUI(false);
  }
  state.toggle = function () { state.on ? stop() : start(); };

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sound]'); if (b) state.toggle();
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && state.on) stop(); });

  /* Analysis loop: real audio when on, gentle idle motion when off */
  var t0 = performance.now();
  function loop(now) {
    var t = (now - t0) / 1000;
    if (state.on && analyser) {
      analyser.getByteFrequencyData(data);
      for (var i = 0; i < 32; i++) state.bins[i] = data[Math.min(data.length - 1, i + 1)];
      var low = 0; for (var k = 1; k < 6; k++) low += data[k]; low = low / 5 / 255;
      state.level += (low - state.level) * 0.35;
      state.beat *= 0.9;
    } else {
      for (var j = 0; j < 32; j++) state.bins[j] = 40 + 30 * (Math.sin(t * 1.3 + j * 0.45) + Math.sin(t * 0.7 + j * 0.9)) * 0.5 + 20;
      state.level += (0.18 + 0.08 * Math.sin(t * 1.4) - state.level) * 0.05;
      state.beat *= 0.92;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
