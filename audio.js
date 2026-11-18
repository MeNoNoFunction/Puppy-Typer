/* =========================================================
   audio.js: sound effects + a generated music loop.
   Everything is synthesised with the Web Audio API, so there are
   no audio files to download. Music has two moods (menu, game) and
   gets busier as your combo grows.
========================================================= */
(function () {
    'use strict';
    let ac = null, master, sfxBus, musicBus, comp;
    const state = { sfx: true, music: true, keys: true, mood: 'off', intensity: 0, want: 'menu' };

    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    const PENT = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];   // C major pentatonic, two octaves

    function init() {
        if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
        try {
            ac = new (window.AudioContext || window.webkitAudioContext)();
            comp = ac.createDynamicsCompressor();
            comp.threshold.value = -14; comp.ratio.value = 6;
            master = ac.createGain(); master.gain.value = 0.9;
            sfxBus = ac.createGain(); sfxBus.gain.value = 1;
            musicBus = ac.createGain(); musicBus.gain.value = 0;
            sfxBus.connect(master); musicBus.connect(master); master.connect(comp); comp.connect(ac.destination);
            document.addEventListener('visibilitychange', () => {
                if (!ac) return;
                if (document.hidden) ac.suspend(); else ac.resume();
            });
            applyMusic();
            return true;
        } catch (e) { ac = null; return false; }
    }

    /* ---------- building blocks ---------- */
    function blip(freq, dur, type, vol, delay, slideTo, bus) {
        if (!ac) return;
        const t = ac.currentTime + (delay || 0);
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type || 'triangle';
        o.frequency.setValueAtTime(freq, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(bus || sfxBus);
        o.start(t); o.stop(t + dur + 0.02);
    }
    let noiseBuf = null;
    function ensureNoise() {
        if (noiseBuf) return;
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    function noise(dur, vol, freq, type, delay, bus) {
        if (!ac) return;
        ensureNoise();
        const t = ac.currentTime + (delay || 0);
        const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
        const f = ac.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq || 2000;
        const g = ac.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(f); f.connect(g); g.connect(bus || sfxBus);
        s.start(t); s.stop(t + dur + 0.02);
    }
    const go = fn => { if (ac && state.sfx) fn(); };

    /* ---------- sound effects ---------- */
    const sfx = {
        click: () => go(() => { blip(520, 0.05, 'triangle', 0.07); blip(780, 0.07, 'triangle', 0.05, 0.04); }),
        tab: () => go(() => { noise(0.12, 0.05, 1800, 'bandpass'); blip(440, 0.1, 'sine', 0.05, 0, 660); }),
        pop: () => go(() => blip(300, 0.09, 'sine', 0.09, 0, 700)),
        on: () => go(() => { blip(520, 0.08, 'triangle', 0.07); blip(784, 0.12, 'triangle', 0.07, 0.07); }),
        off: () => go(() => { blip(660, 0.08, 'triangle', 0.06); blip(392, 0.12, 'triangle', 0.06, 0.07); }),
        equip: () => go(() => { blip(392, 0.07, 'square', 0.04); blip(587, 0.09, 'square', 0.04, 0.06); blip(784, 0.14, 'triangle', 0.06, 0.12); }),
        buy: () => go(() => { blip(988, 0.07, 'square', 0.04); blip(1319, 0.22, 'square', 0.04, 0.07); noise(0.05, 0.03, 6000, 'highpass'); }),
        claim: () => go(() => [659, 784, 988, 1319].forEach((f, i) => blip(f, 0.14, 'triangle', 0.07, i * 0.07))),
        error: () => go(() => { blip(180, 0.12, 'square', 0.05); blip(140, 0.18, 'square', 0.05, 0.1); }),
        key: streak => go(() => { if (!state.keys) return; blip(mtof(PENT[(streak || 0) % PENT.length] + 12), 0.07, 'triangle', 0.028); }),
        wrong: () => go(() => { blip(150, 0.16, 'sawtooth', 0.05, 0, 90); noise(0.08, 0.03, 300, 'lowpass'); }),
        word: combo => go(() => { const f = 880 + Math.min(combo, 14) * 40; blip(f, 0.09, 'triangle', 0.06); blip(f * 1.5, 0.14, 'triangle', 0.04, 0.05); }),
        sentence: () => go(() => { blip(784, 0.1, 'triangle', 0.07); blip(988, 0.16, 'triangle', 0.07, 0.09); blip(1175, 0.2, 'triangle', 0.05, 0.18); }),
        count: () => go(() => blip(440, 0.12, 'square', 0.05)),
        goBeep: () => go(() => { blip(880, 0.35, 'square', 0.06); blip(1320, 0.35, 'triangle', 0.05); }),
        fever: () => go(() => { [392, 523, 659, 784, 1047].forEach((f, i) => blip(f, 0.12, 'square', 0.04, i * 0.05)); noise(0.35, 0.04, 3000, 'bandpass', 0, null); }),
        nom: () => go(() => { blip(260, 0.07, 'sine', 0.1, 0, 120); blip(300, 0.07, 'sine', 0.1, 0.1, 140); blip(340, 0.09, 'sine', 0.1, 0.2, 150); }),
        fanfare: () => go(() => { [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.28, 'triangle', 0.08, i * 0.12)); blip(1047, 0.6, 'square', 0.04, 0.5); blip(1319, 0.6, 'triangle', 0.06, 0.5); }),
        levelUp: () => go(() => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => { blip(f, 0.28, 'square', 0.04, i * 0.09); blip(f * 2, 0.2, 'triangle', 0.03, i * 0.09); }); }),
        achieve: () => go(() => { blip(659, 0.1, 'triangle', 0.07); blip(880, 0.1, 'triangle', 0.07, 0.1); blip(1319, 0.3, 'triangle', 0.08, 0.2); noise(0.2, 0.025, 7000, 'highpass', 0.2); }),
        unlock: () => go(() => { noise(0.25, 0.05, 1200, 'bandpass'); blip(330, 0.3, 'sine', 0.07, 0, 990); blip(1047, 0.2, 'triangle', 0.06, 0.25); }),
        mystery: () => go(() => { for (let i = 0; i < 8; i++) blip(300 + i * 90, 0.06, 'square', 0.035, i * 0.05); blip(1319, 0.4, 'triangle', 0.08, 0.45); blip(1760, 0.4, 'triangle', 0.05, 0.45); })
    };

    /* ---------- music ---------- */
    // 4-bar loop in C major: C  Am  F  G. Notes are written on an 8th-note grid.
    const CHORDS = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]];
    const MOODS = {
        menu: {
            bpm: 88,
            mel: [[7, null, 5, null, 7, null, 8, 7], [7, null, 5, null, 4, null, 5, null], [6, null, 7, null, 8, null, 7, 5], [5, null, 4, null, 2, null, null, null]],
            wave: 'triangle', melVol: 0.05
        },
        game: {
            bpm: 126,
            mel: [[7, 8, 7, 5, 6, null, 5, 3], [5, 6, 5, 3, 4, null, 3, 1], [3, 5, 7, 5, 3, null, 5, 6], [6, 5, 3, 5, 6, 8, 6, null]],
            wave: 'square', melVol: 0.028
        }
    };
    let step = 0, nextTime = 0, timer = null;

    function note(m, t, dur, type, vol, cutoff) {
        const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
        o.type = type; o.frequency.value = mtof(m);
        f.type = 'lowpass'; f.frequency.value = cutoff || 2400;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(f); f.connect(g); g.connect(musicBus);
        o.start(t); o.stop(t + dur + 0.05);
    }
    function drum(kind, t) {
        if (kind === 'kick') {
            const o = ac.createOscillator(), g = ac.createGain();
            o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
            g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
            o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.2);
        } else {
            const s = ac.createBufferSource();
            ensureNoise();
            s.buffer = noiseBuf; s.loop = true;
            const f = ac.createBiquadFilter(); f.type = kind === 'snare' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 'snare' ? 1800 : 7000;
            const g = ac.createGain();
            const len = kind === 'snare' ? 0.13 : 0.04;
            g.gain.setValueAtTime(kind === 'snare' ? 0.07 : 0.03, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
            s.connect(f); f.connect(g); g.connect(musicBus); s.start(t); s.stop(t + len + 0.02);
        }
    }

    function scheduleStep(s, t) {
        const mood = MOODS[state.mood];
        if (!mood) return;
        const eighth = 60 / mood.bpm / 2;
        const bar = Math.floor(s / 8) % 4, pos = s % 8;
        const chord = CHORDS[bar];
        const inten = state.mood === 'game' ? state.intensity : 0;
        // pad: one soft chord per bar
        if (pos === 0) chord.forEach(m => note(m + 12, t, eighth * 8, 'sine', state.mood === 'menu' ? 0.03 : 0.018, 900));
        // bass
        if (pos === 0 || pos === 4 || (inten > 0 && pos === 6)) note(chord[0] - 12 + 12, t, eighth * 1.8, 'triangle', 0.09, 700);
        // melody
        const mi = mood.mel[bar][pos];
        if (mi !== null && mi !== undefined) note(PENT[mi] + (state.mood === 'menu' ? 0 : 0), t, eighth * 1.7, mood.wave, mood.melVol, 3200);
        // drums + arpeggio get busier with intensity
        if (inten >= 1) {
            if (pos % 4 === 0) drum('kick', t);
            if (pos % 2 === 1) drum('hat', t);
        }
        if (inten >= 2) {
            if (pos === 2 || pos === 6) drum('snare', t);
            note(chord[pos % 3] + 24, t, eighth * 0.9, 'square', 0.012, 3800);
        }
    }
    function tick() {
        if (!ac || state.mood === 'off') return;
        const mood = MOODS[state.mood];
        const eighth = 60 / mood.bpm / 2;
        if (nextTime < ac.currentTime) nextTime = ac.currentTime + 0.05;
        while (nextTime < ac.currentTime + 0.2) {
            scheduleStep(step, nextTime);
            nextTime += eighth; step++;
        }
    }
    function applyMusic() {
        if (!ac) return;
        const on = state.music && state.want !== 'off';
        const mood = on ? state.want : 'off';
        const t = ac.currentTime;
        musicBus.gain.cancelScheduledValues(t);
        musicBus.gain.setTargetAtTime(on ? (mood === 'game' ? 0.85 : 0.7) : 0, t, 0.25);
        if (mood !== state.mood) {
            if (mood !== 'off' && state.mood !== mood) { step = 0; nextTime = ac.currentTime + 0.05; }
            state.mood = mood;
        }
        if (mood !== 'off' && !timer) timer = setInterval(tick, 40);
        if (mood === 'off' && timer) { setTimeout(() => { if (state.mood === 'off' && timer) { clearInterval(timer); timer = null; } }, 900); }
    }

    window.PT_AUDIO = {
        init, sfx,
        setSfx: on => { state.sfx = !!on; },
        setKeys: on => { state.keys = !!on; },
        setMusic: on => { state.music = !!on; applyMusic(); },
        mood: m => { state.want = m; applyMusic(); },          // 'menu' | 'game' | 'off'
        intensity: n => { state.intensity = n; },
        ready: () => !!ac
    };
})();