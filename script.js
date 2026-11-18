(() => {
    'use strict';

    const D = window.PT_DATA;
    const { CAT_META, CATALOG, DIFFS, TITLES, QUEST_POOL, ACHIEVEMENTS } = D;

    const SAVE_KEY = 'puppyTypistSave_v2';
    const OLD_KEY = 'puppyTypistSave_v1';
    const PASS_TIERS = 30;
    const PASS_XP = 100;
    const CATS = CAT_META.map(c => c.id);
    const WINDOW_MS = 1500;
    const CUSTOM = { label: '✏️ My sentences', mult: 0.6, unlock: 1 };
    const diffInfo = k => DIFFS[k] || CUSTOM;
    const isTough = k => k === 'medium' || k === 'hard' || k === 'expert';

    const isTouch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    const prefersReduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    const xpNeeded = lvl => 100 + (lvl - 1) * 80 + (lvl - 1) * (lvl - 1) * 10;
    const titleFor = lvl => TITLES.filter(t => lvl >= t[0]).pop()[1];
    const $ = id => document.getElementById(id);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const getItem = (cat, id) => (CATALOG[cat] || []).find(i => i.id === id);
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

    /* =====================================================
       SAVE DATA (with migration + validation)
    ===================================================== */
    function freshSave() {
        const owned = {}, equipped = {};
        CATS.forEach(c => { owned[c] = []; equipped[c] = CATALOG[c][0].id; });
        return {
            v: 2, level: 1, xp: 0, bones: 0,
            bestWpm: 0, bestAcc: 0, games: 0, perfects: 0, maxStreak: 0, totalChars: 0, hardRounds: 0,
            theme: 'auto', mode: 'classic',
            totalTime: 0, bestCombo: 0, questsDone: 0, customRounds: 0, nightRounds: 0, morningRounds: 0,
            taRounds: 0, taBest: 0, quickRound: 0, mysteryOpened: 0, dailyClaims: 0,
            diffsPlayed: [], bestTimes: {},
            dogName: 'Biscuit', difficulty: 'easy', count: 5, muted: false, musicOff: false, keySounds: true,
            fx: !prefersReduced, textSize: 2, custom: [],
            owned, equipped,
            pass: { xp: 0, claimed: [] },
            daily: { date: '', lastVisit: '', streak: 0, quests: [], reward: '' },
            ach: [], history: []
        };
    }

    // Keep only characters you can type on a normal keyboard (also fixes curly quotes from phones)
    function cleanLine(s) {
        return String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
            .replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim();
    }
    function cleanCustom(list) {
        return list.map(cleanLine).filter(s => s.length >= 3 && s.length <= 140).slice(0, 40);
    }

    function normalize(raw) {
        const s = freshSave();
        if (!raw || typeof raw !== 'object') return s;
        const nums = ['level', 'xp', 'bones', 'bestWpm', 'bestAcc', 'games', 'perfects', 'maxStreak', 'totalChars', 'hardRounds',
            'totalTime', 'bestCombo', 'questsDone', 'customRounds', 'nightRounds', 'morningRounds', 'taRounds', 'taBest', 'quickRound', 'mysteryOpened', 'dailyClaims'];
        nums.forEach(k => { if (Number.isFinite(raw[k]) && raw[k] >= 0) s[k] = Math.floor(raw[k]); });
        if (s.level < 1) s.level = 1;
        if (['auto', 'light', 'dark'].includes(raw.theme)) s.theme = raw.theme;
        if (raw.mode === 'timeattack') s.mode = 'timeattack';
        if (Array.isArray(raw.diffsPlayed)) s.diffsPlayed = raw.diffsPlayed.filter(d => DIFFS[d] || d === 'custom');
        if (raw.bestTimes && typeof raw.bestTimes === 'object') {
            Object.keys(raw.bestTimes).forEach(k => { const v = raw.bestTimes[k]; if (/^[a-z]+-\d+$/.test(k) && Number.isFinite(v) && v > 0) s.bestTimes[k] = v; });
        }
        if (typeof raw.dogName === 'string') s.dogName = raw.dogName.slice(0, 12) || 'Biscuit';
        if (DIFFS[raw.difficulty] || raw.difficulty === 'custom') s.difficulty = raw.difficulty;
        if ([3, 5, 10].includes(raw.count)) s.count = raw.count;
        s.muted = !!raw.muted;
        s.musicOff = !!raw.musicOff;
        if (typeof raw.keySounds === 'boolean') s.keySounds = raw.keySounds;
        if (typeof raw.fx === 'boolean') s.fx = raw.fx;
        if ([1, 2, 3].includes(raw.textSize)) s.textSize = raw.textSize;
        if (Array.isArray(raw.custom)) s.custom = cleanCustom(raw.custom.filter(x => typeof x === 'string'));
        CATS.forEach(c => {
            if (raw.owned && Array.isArray(raw.owned[c])) s.owned[c] = raw.owned[c].filter(id => getItem(c, id));
            if (raw.equipped && getItem(c, raw.equipped[c])) s.equipped[c] = raw.equipped[c];
        });
        if (raw.pass) {
            if (Number.isFinite(raw.pass.xp)) s.pass.xp = Math.max(0, Math.min(PASS_TIERS * PASS_XP, Math.floor(raw.pass.xp)));
            if (Array.isArray(raw.pass.claimed)) s.pass.claimed = raw.pass.claimed.filter(n => Number.isInteger(n) && n >= 1 && n <= PASS_TIERS);
        }
        if (raw.daily && typeof raw.daily === 'object') {
            s.daily.date = typeof raw.daily.date === 'string' ? raw.daily.date : '';
            s.daily.lastVisit = typeof raw.daily.lastVisit === 'string' ? raw.daily.lastVisit : '';
            s.daily.reward = typeof raw.daily.reward === 'string' ? raw.daily.reward : '';
            s.daily.streak = Number.isFinite(raw.daily.streak) ? Math.max(0, Math.floor(raw.daily.streak)) : 0;
            if (Array.isArray(raw.daily.quests)) {
                s.daily.quests = raw.daily.quests
                    .filter(q => q && Number.isInteger(q.i) && QUEST_POOL[q.i])
                    .map(q => ({ i: q.i, p: Number.isFinite(q.p) ? q.p : 0, c: !!q.c }))
                    .slice(0, 3);
            }
        }
        if (Array.isArray(raw.ach)) s.ach = raw.ach.filter(id => ACHIEVEMENTS.some(a => a.id === id));
        if (Array.isArray(raw.history)) {
            s.history = raw.history
                .filter(h => h && Number.isFinite(h.wpm) && Number.isFinite(h.acc))
                .map(h => ({ wpm: h.wpm, acc: h.acc, diff: (DIFFS[h.diff] || h.diff === 'custom') ? h.diff : 'easy' }))
                .slice(-20);
        }
        return s;
    }

    function loadSave() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) return normalize(JSON.parse(raw));
            const old = localStorage.getItem(OLD_KEY); // migrate the first version's save
            if (old) {
                const o = JSON.parse(old);
                const s = normalize(o);
                if (o && getItem('coat', o.color)) s.equipped.coat = o.color;
                return s;
            }
        } catch (e) { /* fall through */ }
        return freshSave();
    }

    let save = loadSave();
    function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }

    const darkMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    function applyPrefs() {
        const dark = save.theme === 'dark' || (save.theme === 'auto' && !!(darkMQ && darkMQ.matches));
        document.body.classList.toggle('dark', dark);
        const tc = document.querySelector('meta[name=theme-color]');
        if (tc) tc.setAttribute('content', dark ? '#0e1324' : '#eef2fb');
        const tb = document.getElementById('themeBtn');
        if (tb) tb.textContent = dark ? '☀️' : '🌙';
        document.body.classList.toggle('no-fx', !save.fx);
        document.body.style.setProperty('--ts', { 1: 0.85, 2: 1, 3: 1.3 }[save.textSize] || 1);
    }

    /* =====================================================
       UNLOCK HELPERS
    ===================================================== */
    function isUnlocked(cat, id) {
        const it = getItem(cat, id);
        if (!it) return false;
        const s = it.src;
        if (s.type === 'free') return true;
        if (s.type === 'level' && save.level >= s.level) return true;
        if (s.type === 'ach' && save.ach.includes(s.id)) return true;
        return save.owned[cat].includes(id);
    }
    function fixEquipped() {
        CATS.forEach(c => { if (!isUnlocked(c, save.equipped[c])) save.equipped[c] = CATALOG[c][0].id; });
    }
    function srcLabel(it) {
        const s = it.src;
        if (s.type === 'level') return `🔒 Reach level ${s.level}`;
        if (s.type === 'bones') return `🦴 ${s.cost} bones`;
        if (s.type === 'pass') return `🎟️ Paw Pass tier ${s.tier}`;
        if (s.type === 'ach') { const a = ACHIEVEMENTS.find(x => x.id === s.id); return `🏅 ${a ? a.name : 'Achievement'}`; }
        return 'Free';
    }
    fixEquipped();

    /* =====================================================
       DAILY QUESTS
    ===================================================== */
    function dateStr(d = new Date()) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function mulberry(seed) {
        return () => {
            seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function makeQuests(day) {
        let h = 0;
        for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) | 0;
        const rnd = mulberry(h);
        const order = QUEST_POOL.map((_, i) => i).sort(() => rnd() - 0.5);
        const usedTypes = new Set();
        const out = [];
        for (const i of order) {
            if (usedTypes.has(QUEST_POOL[i].type)) continue;
            usedTypes.add(QUEST_POOL[i].type);
            out.push({ i, p: 0, c: false });
            if (out.length === 3) break;
        }
        return out;
    }
    let newDayToast = false;
    function ensureDaily() {
        const today = dateStr();
        const d = save.daily;
        if (d.date === today && d.quests.length) return;
        const y = new Date(); y.setDate(y.getDate() - 1);
        d.streak = d.lastVisit === dateStr(y) ? d.streak + 1 : 1;
        d.date = today;
        d.lastVisit = today;
        d.quests = makeQuests(today);
        newDayToast = true;
        checkAchievements(true);
        persist();
    }
    const questDone = q => q.p >= QUEST_POOL[q.i].target;

    function updateQuests(res) {
        const finished = [];
        save.daily.quests.forEach(q => {
            if (questDone(q)) return;
            const def = QUEST_POOL[q.i];
            switch (def.type) {
                case 'rounds': q.p += 1; break;
                case 'chars': q.p += res.correct; break;
                case 'acc': q.p = Math.max(q.p, res.acc); break;
                case 'wpm': q.p = Math.max(q.p, res.wpm); break;
                case 'streak': q.p = Math.max(q.p, res.bestStreak); break;
                case 'perfect': if (res.mistakes === 0) q.p += 1; break;
                case 'tough': if (isTough(save.difficulty)) q.p += 1; break;
            }
            if (questDone(q)) finished.push(def.text);
        });
        return finished;
    }

    /* =====================================================
       ACHIEVEMENTS
    ===================================================== */
    function checkAchievements(silent) {
        const got = [];
        let ctx = null;
        const getCtx = () => ctx || (ctx = {
            owned: CATS.reduce((n, c) => n + CATALOG[c].filter(i => isUnlocked(c, i.id)).length, 0),
            passTier: passTier()
        });
        ACHIEVEMENTS.forEach(a => {
            if (!save.ach.includes(a.id) && a.check(save, getCtx())) {
                save.ach.push(a.id);
                save.bones += a.bones;
                got.push(a);
            }
        });
        if (silent) got.forEach(a => { toast(`Achievement: ${a.name} (+${a.bones} 🦴)`, 'good'); sfx.achieve(); });
        return got;
    }

    /* =====================================================
       PAW PASS
    ===================================================== */
    const passTier = () => Math.min(PASS_TIERS, Math.floor(save.pass.xp / PASS_XP));
    function passReward(t) {
        for (const cat of CATS) {
            const it = CATALOG[cat].find(i => i.src.type === 'pass' && i.src.tier === t);
            if (it) return { kind: 'item', cat, item: it };
        }
        return { kind: 'bones', amount: 30 + Math.floor(t / 5) * 15 };
    }
    const claimableTiers = () => {
        const out = [];
        for (let t = 1; t <= passTier(); t++) if (!save.pass.claimed.includes(t)) out.push(t);
        return out;
    };
    function claimPass(t) {
        if (t > passTier() || save.pass.claimed.includes(t)) return false;
        const r = passReward(t);
        save.pass.claimed.push(t);
        if (r.kind === 'bones') {
            save.bones += r.amount;
            toast(`Tier ${t}: +${r.amount} 🦴`, 'good'); sfx.claim();
        } else {
            if (!save.owned[r.cat].includes(r.item.id)) save.owned[r.cat].push(r.item.id);
            toast(`Tier ${t} unlocked: ${r.item.name}!`, 'good'); sfx.unlock();
        }
        sfx.sentence();
        return true;
    }
    function addPass(n) { save.pass.xp = Math.min(PASS_TIERS * PASS_XP, save.pass.xp + n); }

    /* =====================================================
       ART (drawn by art.js)
    ===================================================== */
    const ART = window.PT_ART;
    const dogSVG = (sel, o) => ART.dogSVG(sel, o);
    const LAYER_SPEED = { far: 0.55, mid: 1.5, props: 3.7 };   // rem per second at speed 1

    function skyAndLayers(sceneId) {
        return `<div class="sky">${ART.skyHTML(sceneId)}</div><div class="layer far"></div><div class="layer mid"></div>`;
    }

    function applyScene(node, sc) {
        const a = ART.sceneArt(sc.id);
        node.style.setProperty('--sky-top', sc.skyTop);
        node.style.setProperty('--sky-bot', sc.skyBot);
        node.style.setProperty('--ground', sc.ground);
        node.style.setProperty('--edge', sc.edge);
        node.style.setProperty('--stripe', sc.stripe);
        node.style.setProperty('--far', a.far);
        node.style.setProperty('--mid', a.mid);
        node.style.setProperty('--props', a.props);
    }

    function renderPreview(container, override, note) {
        const sel = Object.assign({}, save.equipped, override || {});
        const sc = getItem('scene', sel.scene) || CATALOG.scene[0];
        const treat = getItem('treat', sel.treat) || CATALOG.treat[0];
        container.innerHTML = `${skyAndLayers(sc.id)}<div class="pv-ground"></div><div class="layer props"></div>
      ${note ? `<div class="pv-note">${note}</div>` : ''}
      <div class="pv-treat">${treat.icon}</div>
      <div class="pv-dog">${dogSVG(sel)}</div>`;
        applyScene(container, sc);
    }

    /* =====================================================
       DOM + TOASTS
    ===================================================== */
    const el = {
        bonesChip: $('bonesChip'), levelChip: $('levelChip'), muteBtn: $('muteBtn'),
        nav: $('nav'), game: $('game'), results: $('results'), typer: $('typer'), fx: $('fx'),
        dotPass: $('dotPass'), dotQuests: $('dotQuests'),
        playPreview: $('playPreview'), playDogName: $('playDogName'),
        menuLevel: $('menuLevel'), menuTitle: $('menuTitle'), menuXpFill: $('menuXpFill'), menuXpText: $('menuXpText'),
        themeBtn: $('themeBtn'), segMode: $('segMode'), segDiff: $('segDiff'), segCount: $('segCount'), diffHint: $('diffHint'), lenField: $('lenField'),
        ctaNote: $('ctaNote'), levelRing: $('levelRing'), todayBody: $('todayBody'),
        modeSelect: $('modeSelect'), timerStat: $('timerStat'), resTime: $('resTime'), themeSelect: $('themeSelect'),
        questTimer: $('questTimer'), rewardText: $('rewardText'), rewardBtn: $('rewardBtn'), bestTimes: $('bestTimes'), mysteryBtn: $('mysteryBtn'),
        difficultySelect: $('difficultySelect'), countSelect: $('countSelect'), startBtn: $('startBtn'),
        wardPreview: $('wardPreview'), catPills: $('catPills'), itemGrid: $('itemGrid'),
        passFill: $('passFill'), passTierLabel: $('passTierLabel'), passXpText: $('passXpText'), passTrack: $('passTrack'), claimAllBtn: $('claimAllBtn'),
        dailyStreak: $('dailyStreak'), questList: $('questList'), achGrid: $('achGrid'), achCount: $('achCount'),
        statTiles: $('statTiles'), historyChart: $('historyChart'),
        dogNameInput: $('dogNameInput'), textSizeSelect: $('textSizeSelect'), soundToggle: $('soundToggle'), musicToggle: $('musicToggle'), keysToggle: $('keysToggle'), fxToggle: $('fxToggle'),
        customText: $('customText'), saveCustomBtn: $('saveCustomBtn'),
        saveCode: $('saveCode'), exportBtn: $('exportBtn'), importBtn: $('importBtn'), resetBtn: $('resetBtn'),
        wpmStat: $('wpmStat'), accStat: $('accStat'), mistakeStat: $('mistakeStat'), streakStat: $('streakStat'), comboStat: $('comboStat'), sentenceStat: $('sentenceStat'),
        progFill: $('progFill'), tapPrompt: $('tapPrompt'),
        scene: $('scene'), layFar: $('layFar'), layMid: $('layMid'), layProps: $('layProps'), sky: $('sky'), stripes: $('stripes'), dogWrap: $('dogWrap'), dogSlot: $('dogSlot'), dogNameTag: $('dogNameTag'),
        treat: $('treat'), trail: $('trail'), cheer: $('cheer'), hearts: $('hearts'), speedLabel: $('speedLabel'), sentenceBox: $('sentenceBox'),
        resTitle: $('resTitle'), resStars: $('resStars'), resMessage: $('resMessage'),
        resWpm: $('resWpm'), resAcc: $('resAcc'), resMistakes: $('resMistakes'), resStreak: $('resStreak'),
        resXp: $('resXp'), resBones: $('resBones'), resNotes: $('resNotes'), resXpFill: $('resXpFill'), resXpText: $('resXpText'), resTip: $('resTip'),
        againBtn: $('againBtn'), menuBtn: $('menuBtn'), toasts: $('toasts')
    };

    const TOAST_ICON = { on: '✅', off: '⭐', good: '🎉', warn: '🔒', info: '✨', dark: '🌙', light: '☀️', music: '🎵', sound: '🔊', mute: '🔇', paw: '🐾', bone: '🦴' };
    function toast(msg, kind) {
        const t = document.createElement('div');
        t.className = 'toast ' + (kind || 'info');
        const ic = document.createElement('span');
        ic.className = 'toast-ic';
        ic.textContent = TOAST_ICON[kind] || TOAST_ICON.info;
        const tx = document.createElement('span');
        tx.textContent = msg;
        t.append(ic, tx);
        el.toasts.appendChild(t);
        while (el.toasts.childElementCount > 3) el.toasts.firstChild.remove();
        setTimeout(() => t.remove(), 3200);
    }
    function bump(node) {
        node.classList.remove('bump');
        void node.offsetWidth;
        node.classList.add('bump');
    }
    function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } }

    /* =====================================================
       VISUAL EFFECTS (sparkles / confetti)
    ===================================================== */
    function burst(x, y, opts = {}) {
        if (!save.fx) return;
        if (el.fx.childElementCount > 90) return;
        const n = opts.n || 6;
        const icons = opts.icons || ['✨', '⭐', '🐾'];
        const spread = opts.spread || 60;
        for (let i = 0; i < n; i++) {
            const p = document.createElement('span');
            p.className = 'fx-p';
            p.textContent = pick(icons);
            const a = Math.random() * Math.PI * 2;
            const d = spread * (0.5 + Math.random() * 0.7);
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.fontSize = ((opts.size || 14) + Math.random() * 8) + 'px';
            p.style.setProperty('--dx', (Math.cos(a) * d).toFixed(0) + 'px');
            p.style.setProperty('--dy', (Math.sin(a) * d - (opts.lift || 20)).toFixed(0) + 'px');
            p.style.setProperty('--rot', ((Math.random() - 0.5) * 120).toFixed(0) + 'deg');
            p.addEventListener('animationend', () => p.remove());
            el.fx.appendChild(p);
        }
    }
    function burstAt(node, opts) {
        const r = node.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, opts);
    }

    // Click pop: every button / card / tab squishes and throws a few sparkles
    document.addEventListener('pointerdown', e => {
        if (e.target === el.typer) return;
        ensureAudio();
        const t = e.target.closest && e.target.closest('button:not(:disabled), .item, .tier.claimable, select');
        if (!t) return;
        sfx.click();
        if (!save.fx) return;
        t.classList.remove('popping');
        void t.offsetWidth;
        t.classList.add('popping');
        burst(e.clientX, e.clientY, { n: 5, size: 11, spread: 38, icons: ['✨', '🐾', '⭐'] });
    }, true);
    document.addEventListener('animationend', e => { if (e.animationName === 'popBtn') e.target.classList.remove('popping'); });

    /* =====================================================
       AUDIO
    ===================================================== */
    const AUD = window.PT_AUDIO;
    const sfx = AUD.sfx;
    function syncAudio() {
        AUD.setSfx(!save.muted);
        AUD.setKeys(save.keySounds);
        AUD.setMusic(!save.muted && !save.musicOff);
    }
    function ensureAudio() { syncAudio(); AUD.init(); }

    /* =====================================================
       TABS + RENDERERS
    ===================================================== */
    const TAB_NAMES = ['play', 'wardrobe', 'pass', 'quests', 'stats', 'settings'];
    let currentTab = 'play';
    let wardCat = 'coat';
    let tryOn = null;

    function showTab(name) {
        currentTab = name;
        tryOn = null;
        TAB_NAMES.forEach(t => $('tab-' + t).classList.toggle('hidden', t !== name));
        el.nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
        renderAll();
        moveNavInd();
        window.scrollTo(0, 0);
    }

    function renderAll() {
        renderHeader();
        ({ play: renderPlay, wardrobe: renderWardrobe, pass: renderPass, quests: renderQuests, stats: renderStats, settings: renderSettings })[currentTab]();
        renderDots();
    }

    /* numbers count up/down instead of jumping */
    function setCount(node, prefix, val) {
        const from = node._v === undefined ? val : node._v;
        node._v = val;
        cancelAnimationFrame(node._raf);
        if (from === val || !save.fx || prefersReduced) { node.textContent = prefix + val; return; }
        const t0 = performance.now(), dur = 650;
        const step = now => {
            const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
            node.textContent = prefix + Math.round(from + (val - from) * e);
            if (k < 1) node._raf = requestAnimationFrame(step);
        };
        node._raf = requestAnimationFrame(step);
        node.classList.remove('bump'); void node.offsetWidth; node.classList.add('bump');
    }

    /* sliding pill behind the active tab */
    function moveNavInd() {
        const b = el.nav.querySelector('button.active'), ind = el.nav.querySelector('.nav-ind');
        if (!b || !ind || !b.offsetWidth) return;
        ind.style.width = b.offsetWidth + 'px';
        ind.style.transform = `translateX(${b.offsetLeft}px)`;
    }
    window.addEventListener('resize', moveNavInd);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveNavInd);

    function renderHeader() {
        setCount(el.bonesChip, '🦴 ', save.bones);
        setCount(el.levelChip, 'Lv ', save.level);
        el.muteBtn.textContent = save.muted ? '🔇' : '🔊';
    }

    function renderDots() {
        el.dotPass.classList.toggle('hidden', claimableTiers().length === 0);
        el.dotQuests.classList.toggle('hidden', !(save.daily.quests.some(q => questDone(q) && !q.c) || save.daily.reward !== dateStr()));
    }

    let playSig = '';
    const DIFF_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert', custom: 'My sentences' };
    const DIFF_HINTS = {
        easy: 'Short, simple sentences. A good place to start.',
        medium: 'Longer sentences with more words.',
        hard: 'Commas, capital letters and punctuation.',
        expert: 'Double-length sentences. A real challenge.',
        custom: 'The sentences you wrote in Settings.'
    };
    const segHTML = (items, cur) => items.map(i =>
        `<button type="button" data-v="${i.v}" class="${i.v === cur ? 'on' : ''}" ${i.disabled ? 'disabled' : ''} aria-pressed="${i.v === cur}">${i.label}</button>`).join('');

    function renderToday() {
        ensureDaily();
        const qs = save.daily.quests;
        const done = qs.filter(questDone).length, ready = qs.filter(q => questDone(q) && !q.c).length;
        const canReward = save.daily.reward !== dateStr();
        el.todayBody.innerHTML = `
      <div class="today-row"><div><b>Daily quests</b><small>${done} of ${qs.length} done${ready ? ` · ${ready} ready to claim` : ''}</small></div>
        <div class="pips">${qs.map(q => `<i class="pip ${questDone(q) ? 'done' : ''}"></i>`).join('')}</div></div>
      <div class="today-row"><div><b>Daily reward</b><small>${canReward ? 'A free gift is waiting for you' : 'Claimed. See you tomorrow!'}</small></div>
        ${canReward ? '<button class="small-btn" data-act="claimDaily">Claim</button>' : '<span class="tag-eq">✓ Done</span>'}</div>
      <div class="today-timer" id="todayTimer"></div>`;
        tickTimers();
    }

    function renderPlay() {
        const sig = JSON.stringify(save.equipped) + '|' + save.dogName;
        if (sig !== playSig) { playSig = sig; renderPreview(el.playPreview); }
        el.playDogName.textContent = save.dogName;
        const need = xpNeeded(save.level);
        el.menuLevel.textContent = save.level;
        el.menuTitle.textContent = titleFor(save.level);
        el.menuXpFill.style.width = Math.min(100, (save.xp / need) * 100) + '%';
        el.menuXpText.textContent = `${save.xp} / ${need} XP to level ${save.level + 1}`;
        el.levelRing.style.setProperty('--p', Math.min(100, (save.xp / need) * 100).toFixed(1));

        let opts = Object.keys(DIFFS).map(k => {
            const locked = save.level < DIFFS[k].unlock;
            return `<option value="${k}" ${locked ? 'disabled' : ''}>${DIFFS[k].label}</option>`;
        }).join('');
        if (save.custom.length) opts += `<option value="custom">${CUSTOM.label} (${save.custom.length})</option>`;
        el.difficultySelect.innerHTML = opts;
        if (save.difficulty === 'custom' ? !save.custom.length : save.level < DIFFS[save.difficulty].unlock) save.difficulty = 'easy';
        el.difficultySelect.value = save.difficulty;
        el.countSelect.value = String(save.count);
        el.modeSelect.value = save.mode;
        el.countSelect.disabled = save.mode === 'timeattack';

        const ta = save.mode === 'timeattack';
        el.segMode.innerHTML = segHTML([{ v: 'classic', label: 'Classic' }, { v: 'timeattack', label: 'Time Attack' }], save.mode);
        const dItems = Object.keys(DIFFS).map(k => ({ v: k, label: save.level < DIFFS[k].unlock ? `🔒 ${DIFF_NAMES[k]} · Lv ${DIFFS[k].unlock}` : DIFF_NAMES[k], disabled: save.level < DIFFS[k].unlock }));
        if (save.custom.length) dItems.push({ v: 'custom', label: DIFF_NAMES.custom });
        el.segDiff.innerHTML = segHTML(dItems, save.difficulty);
        el.segCount.innerHTML = segHTML([3, 5, 10].map(n => ({ v: String(n), label: String(n) })), String(save.count));
        el.lenField.classList.toggle('hidden', ta);
        el.diffHint.textContent = (ta ? 'Time Attack: finish as many sentences as you can in 60 seconds. ' : 'Classic: finish every sentence to reach the treat. ') + (DIFF_HINTS[save.difficulty] || '');
        el.ctaNote.textContent = `${ta ? 'Time Attack · 60 seconds' : `Classic · ${save.count} sentences`} · ${DIFF_NAMES[save.difficulty]}`;
        renderToday();
    }

    /* ---------- Wardrobe ---------- */
    function thumbHTML(cat, it) {
        const eq = save.equipped;
        const base = { breed: eq.breed, coat: eq.coat, hat: 'none', neck: 'none', face: 'none' };
        const dogThumb = (sel, view) => `<div class="thumb dogthumb">${dogSVG(Object.assign({}, base, sel), { view, still: true })}</div>`;
        if (cat === 'breed') return dogThumb({ breed: it.id }, 'full');
        if (cat === 'coat') return dogThumb({ coat: it.id }, 'full');
        if (cat === 'hat' && it.id !== 'none') return dogThumb({ hat: it.id }, 'hat');
        if (cat === 'neck') return dogThumb({ neck: it.id }, 'neck');
        if (cat === 'face' && it.id !== 'none') return dogThumb({ face: it.id }, 'face');
        if (cat === 'scene') {
            const a = ART.sceneArt(it.id);
            return `<div class="thumb scenethumb" style="background:${a.mid} 0 100%/auto 46% repeat-x, ${a.far} 0 100%/auto 70% repeat-x, linear-gradient(${it.skyTop}, ${it.skyBot})"><i style="background:${it.ground};border-top-color:${it.edge}"></i></div>`;
        }
        return `<div class="thumb" style="background:#fff8ec">${it.icon}</div>`;
    }

    function renderWardrobe() {
        const ov = tryOn ? { [tryOn.cat]: tryOn.id } : null;
        const tryItem = tryOn ? getItem(tryOn.cat, tryOn.id) : null;
        renderPreview(el.wardPreview, ov, tryItem ? `Trying on: ${tryItem.name}` : '');

        el.catPills.innerHTML = CAT_META.map(c => {
            const total = CATALOG[c.id].length;
            const have = CATALOG[c.id].filter(i => isUnlocked(c.id, i.id)).length;
            return `<button class="pill ${c.id === wardCat ? 'active' : ''}" data-act="cat" data-cat="${c.id}">${c.icon} ${c.label} <small>${have}/${total}</small></button>`;
        }).join('');

        el.itemGrid.innerHTML = CATALOG[wardCat].map(it => {
            const unlocked = isUnlocked(wardCat, it.id);
            const equipped = save.equipped[wardCat] === it.id;
            const trying = tryOn && tryOn.cat === wardCat && tryOn.id === it.id;
            let sub = '', btn = '';
            if (equipped) sub = '<span class="tag-eq">✓ Equipped</span>';
            else if (unlocked) btn = `<button class="small-btn" data-act="equip" data-cat="${wardCat}" data-id="${it.id}">Equip</button>`;
            else if (it.src.type === 'bones') {
                btn = `<button class="small-btn" data-act="buy" data-cat="${wardCat}" data-id="${it.id}" ${save.bones < it.src.cost ? 'style="opacity:.55"' : ''}>Buy 🦴 ${it.src.cost}</button>`;
            } else sub = srcLabel(it);
            return `<div class="item ${equipped ? 'equipped' : ''} ${unlocked ? '' : 'locked'} ${trying ? 'trying' : ''}" data-act="select" data-cat="${wardCat}" data-id="${it.id}">
        ${thumbHTML(wardCat, it)}
        <div class="item-name">${it.name}</div>
        <div class="item-sub">${sub}</div>
        ${btn}
      </div>`;
        }).join('');
    }

    function equip(cat, id) {
        if (!isUnlocked(cat, id)) return;
        save.equipped[cat] = id;
        tryOn = null;
        persist();
        sfx.equip();
        toast(`${getItem(cat, id).name} equipped!`, 'on');
        renderAll();
    }
    function buy(cat, id) {
        const it = getItem(cat, id);
        if (!it || it.src.type !== 'bones' || isUnlocked(cat, id)) return;
        if (save.bones < it.src.cost) {
            toast(`Not enough bones: you need ${it.src.cost - save.bones} more 🦴`, 'warn'); sfx.error();
            tryOn = { cat, id }; renderWardrobe();
            return;
        }
        save.bones -= it.src.cost;
        save.owned[cat].push(id);
        save.equipped[cat] = id;
        tryOn = null;
        persist();
        sfx.buy();
        toast(`Bought ${it.name}!`, 'good');
        renderAll();
        burstAt(el.wardPreview, { n: 14, spread: 110, size: 18, icons: ['🎉', '✨', '⭐', '❤️'] });
    }
    function selectItem(cat, id) {
        if (isUnlocked(cat, id)) return equip(cat, id);
        const it = getItem(cat, id);
        tryOn = { cat, id };
        toast(`${it.name}: ${srcLabel(it)}`, 'warn');
        renderWardrobe();
    }

    /* ---------- Paw Pass ---------- */
    function renderPass() {
        const tier = passTier();
        const inTier = tier >= PASS_TIERS ? PASS_XP : save.pass.xp % PASS_XP;
        el.passTierLabel.textContent = `Tier ${tier} / ${PASS_TIERS}`;
        el.passFill.style.width = (tier >= PASS_TIERS ? 100 : (inTier / PASS_XP) * 100) + '%';
        el.passXpText.textContent = tier >= PASS_TIERS ? 'Season complete! 🎉' : `${inTier} / ${PASS_XP} Pass XP to tier ${tier + 1}`;
        const claimable = claimableTiers();
        el.claimAllBtn.disabled = claimable.length === 0;
        el.claimAllBtn.textContent = claimable.length ? `Claim all (${claimable.length})` : 'Claim all';

        let html = '';
        for (let t = 1; t <= PASS_TIERS; t++) {
            const r = passReward(t);
            const claimed = save.pass.claimed.includes(t);
            const can = !claimed && t <= tier;
            const state = claimed ? 'claimed' : can ? 'claimable' : 'locked';
            let icon, name;
            if (r.kind === 'bones') { icon = '🦴'; name = `${r.amount} bones`; }
            else if (r.cat === 'coat') { icon = '🐕'; name = r.item.name + ' coat'; }
            else if (r.cat === 'scene') { icon = '🏞️'; name = r.item.name; }
            else { icon = r.item.icon; name = r.item.name; }
            html += `<div class="tier ${state} ${r.kind === 'item' ? 'big' : ''}">
        <span class="tnum">TIER ${t}</span>
        <span class="ticon">${icon}</span>
        <span class="tname">${name}</span>
        ${claimed ? '<span class="tag-eq">✓ Claimed</span>' : can ? `<button class="small-btn" data-act="claimPass" data-tier="${t}">Claim</button>` : '<span class="muted">🔒</span>'}
      </div>`;
        }
        el.passTrack.innerHTML = html;
        const next = el.passTrack.querySelector('.claimable') || el.passTrack.querySelector('.locked');
        if (next) el.passTrack.scrollLeft = Math.max(0, next.offsetLeft - 20);
    }

    /* ---------- Quests + achievements ---------- */
    function renderQuests() {
        ensureDaily();
        el.dailyStreak.textContent = save.daily.streak;
        const canClaim = save.daily.reward !== dateStr();
        el.rewardText.innerHTML = `<b>🎁 Daily reward</b><small>${canClaim ? `Today's gift: ${dailyRewardAmount()} 🦴 + 20 Pass XP (bigger with a longer visit streak!)` : 'Claimed today. Come back tomorrow for the next one!'}</small>`;
        el.rewardBtn.classList.toggle('hidden', !canClaim);
        el.questList.innerHTML = save.daily.quests.map((q, idx) => {
            const def = QUEST_POOL[q.i];
            const done = questDone(q);
            const pct = Math.min(100, (q.p / def.target) * 100);
            const state = q.c ? 'claimed' : done ? 'done' : '';
            return `<div class="quest ${state}">
        <div>
          <div class="quest-text">${def.text}</div>
          <div class="minibar"><div style="width:${pct}%"></div></div>
          <div class="quest-reward">${Math.min(q.p, def.target)} / ${def.target} · Reward: ${def.bones} 🦴 + ${def.pxp} Pass XP</div>
        </div>
        ${q.c ? '<span class="tag-eq">✓ Claimed</span>' : done ? `<button class="small-btn" data-act="claimQuest" data-q="${idx}">Claim</button>` : '<span class="muted">…</span>'}
      </div>`;
        }).join('');

        el.achCount.textContent = `(${save.ach.length}/${ACHIEVEMENTS.length})`;
        el.achGrid.innerHTML = ACHIEVEMENTS.map(a => `<div class="ach ${save.ach.includes(a.id) ? 'got' : ''}">
      <span class="aicon">🏅</span><div><b>${a.name}</b><small>${a.desc} · +${a.bones} 🦴</small></div></div>`).join('');
        tickTimers();
        if (newDayToast) { newDayToast = false; toast('New daily quests are ready!', 'info'); }
    }
    const dailyRewardAmount = () => 25 + 10 * Math.min(Math.max(save.daily.streak - 1, 0), 9);
    function claimDaily() {
        if (save.daily.reward === dateStr()) return;
        save.daily.reward = dateStr();
        const n = dailyRewardAmount();
        save.bones += n; addPass(20); save.dailyClaims++;
        checkAchievements(true);
        persist(); sfx.sentence();
        toast(`Daily reward! +${n} 🦴 +20 Pass XP`, 'good');
        renderAll();
    }
    function msToMidnight() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n; }
    function fmtCountdown(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 3600)}h ${pad2(Math.floor(s % 3600 / 60))}m ${pad2(s % 60)}s`; }
    function tickTimers() {
        if (currentTab !== 'quests' && currentTab !== 'play') return;
        const left = fmtCountdown(msToMidnight());
        if (currentTab === 'quests') el.questTimer.textContent = '⏳ New quests & reward in ' + left;
        else { const t = document.getElementById('todayTimer'); if (t) t.textContent = '⏳ New quests in ' + left; }
        if (save.daily.date !== dateStr()) { ensureDaily(); (currentTab === 'quests' ? renderQuests : renderPlay)(); renderDots(); }
    }
    setInterval(tickTimers, 1000);

    /* ---------- Mystery box ---------- */
    const MYSTERY_COST = 150;
    function openMystery() {
        const pool = [];
        CATS.forEach(c => CATALOG[c].forEach(it => { if (it.src.type === 'bones' && !isUnlocked(c, it.id)) pool.push([c, it]); }));
        if (!pool.length) { toast('You already own every Bones item!', 'good'); return; }
        if (save.bones < MYSTERY_COST) { toast(`Mystery Box costs ${MYSTERY_COST} 🦴. Keep typing!`, 'warn'); sfx.error(); return; }
        const [c, it] = pick(pool);
        save.bones -= MYSTERY_COST;
        save.owned[c].push(it.id);
        save.mysteryOpened++;
        wardCat = c; tryOn = { cat: c, id: it.id };
        checkAchievements(true);
        persist(); sfx.levelUp();
        burst(innerWidth / 2, innerHeight / 3, { n: 24, size: 22, spread: 220, lift: 40, icons: ['🎁', '⭐', '✨', '🎉'] });
        toast(`You got: ${it.name}!`, 'good'); sfx.mystery();
        renderAll();
    }

    function claimQuest(idx) {
        const q = save.daily.quests[idx];
        if (!q || q.c || !questDone(q)) return;
        const def = QUEST_POOL[q.i];
        q.c = true;
        save.questsDone++;
        save.bones += def.bones;
        addPass(def.pxp);
        checkAchievements(true);
        persist();
        sfx.sentence();
        toast(`Quest complete! +${def.bones} 🦴 +${def.pxp} Pass XP`, 'good');
        renderAll();
    }

    /* ---------- Stats ---------- */
    function renderStats() {
        const allItems = CATS.reduce((n, c) => n + CATALOG[c].length, 0);
        const haveItems = CATS.reduce((n, c) => n + CATALOG[c].filter(i => isUnlocked(c, i.id)).length, 0);
        const avg = save.history.length ? Math.round(save.history.reduce((a, h) => a + h.wpm, 0) / save.history.length) : 0;
        const tiles = [
            ['Level', save.level], ['Rounds played', save.games], ['Best WPM', save.bestWpm], ['Average WPM', avg],
            ['Best accuracy', save.bestAcc + '%'], ['Perfect rounds', save.perfects], ['Longest streak', save.maxStreak],
            ['Letters typed', save.totalChars.toLocaleString()], ['Paw Pass tier', passTier() + '/' + PASS_TIERS],
            ['Daily streak', save.daily.streak + ' 🔥'], ['Achievements', save.ach.length + '/' + ACHIEVEMENTS.length],
            ['Items unlocked', haveItems + '/' + allItems],
            ['Time played', fmtLong(save.totalTime)], ['Best combo', 'x' + save.bestCombo],
            ['Quests done', save.questsDone], ['Time Attack best', save.taBest + ' sent.']
        ];
        el.statTiles.innerHTML = tiles.map(t => `<div class="stile"><b>${t[1]}</b><small>${t[0]}</small></div>`).join('');
        const names = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert', custom: 'My sentences' };
        const bt = Object.keys(save.bestTimes).sort();
        el.bestTimes.innerHTML = bt.length
            ? bt.map(k => { const [d, n] = k.split('-'); return `<div class="bt"><span>${names[d] || d} · ${n} sentences</span><b>${fmtTime(save.bestTimes[k])}</b></div>`; }).join('')
            : '<span class="muted">Finish a Classic round to set a best time.</span>';
        const max = Math.max(30, ...save.history.map(h => h.wpm));
        el.historyChart.innerHTML = save.history.length
            ? save.history.map(h => `<div class="hbar ${h.acc >= 95 ? 'good' : ''}" style="height:${Math.max(3, (h.wpm / max) * 100)}%" title="${h.wpm} WPM · ${h.acc}% accuracy"></div>`).join('')
            : '<span class="muted">Play a round to see your history here.</span>';
    }

    /* ---------- Settings ---------- */
    function renderSettings() {
        el.dogNameInput.value = save.dogName;
        el.textSizeSelect.value = String(save.textSize);
        el.themeSelect.value = save.theme;
        el.soundToggle.textContent = save.muted ? 'Off' : 'On';
        el.musicToggle.textContent = save.musicOff ? 'Off' : 'On';
        el.keysToggle.textContent = save.keySounds ? 'On' : 'Off';
        [el.soundToggle, el.musicToggle, el.keysToggle, el.fxToggle].forEach(b => b.classList.toggle('is-off', b.textContent === 'Off'));
        el.fxToggle.textContent = save.fx ? 'On' : 'Off';
        if (document.activeElement !== el.customText) el.customText.value = save.custom.join('\n');
    }
    function exportCode() { return btoa(unescape(encodeURIComponent(JSON.stringify(save)))); }
    function importCode(code) {
        const obj = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
        save = normalize(obj);
        fixEquipped();
        persist();
        applyPrefs();
    }

    /* =====================================================
       ROUND LOGIC
    ===================================================== */
    let g = null;
    let animOn = false;
    const L = { rem: 16, far: 0, mid: 0, props: 0 };
    function measureLayers() {
        // tile width in px = layer height * (tile aspect). Tiles are 400 units wide.
        L.rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const g = ART.sceneArt('meadow');
        const w = (node, h) => node.offsetHeight ? node.offsetHeight * g.tileW / h : 0;
        L.far = w(el.layFar, g.farH); L.mid = w(el.layMid, g.midH); L.props = w(el.layProps, g.propsH);
    }
    window.addEventListener('resize', () => { if (animOn) measureLayers(); });
    const A = { x: 0, tx: 0, spd: 0, phase: 0, farX: 0, midX: 0, propsX: 0, groundX: 0, last: 0, t: 0, hop: 0, happy: false, trailAcc: 0, statAcc: 0, label: '', maxX: 0, groundH: 40 };

    function getSentences(n = save.count) {
        if (save.difficulty === 'custom' && save.custom.length) {
            const out = [];
            let pool = [];
            while (out.length < n) {
                if (!pool.length) pool = shuffle(save.custom.slice());
                out.push(pool.pop());
            }
            return out;
        }
        return D.generateSentences(save.difficulty, n);
    }

    const TA_SECONDS = 60;
    function startGame() {
        // Focus the hidden input RIGHT HERE (inside the tap) so phones open the keyboard
        ensureAudio();
        AUD.intensity(0); AUD.mood('game');
        try { el.typer.value = ''; el.typer.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        composed = 0;
        ensureDaily();

        const ta = save.mode === 'timeattack' ? TA_SECONDS : 0;
        const sentences = getSentences(ta ? 4 : save.count);
        g = {
            ta, sentences, idx: 0, pos: 0, chars: [], words: [], charWord: [],
            correct: 0, mistakes: 0, streak: 0, bestStreak: 0, combo: 0, bestCombo: 0, wordErr: false,
            startTime: null, stamps: [], active: true, doneChars: 0,
            totalChars: sentences.reduce((n, s) => n + s.length, 0)
        };

        el.nav.classList.add('hidden');
        TAB_NAMES.forEach(t => $('tab-' + t).classList.add('hidden'));
        el.results.classList.add('hidden');
        el.game.classList.remove('hidden');
        document.body.classList.add('playing');
        el.tapPrompt.classList.add('hidden');
        el.cheer.classList.add('hidden');
        el.hearts.innerHTML = '';
        el.trail.innerHTML = '';
        el.progFill.style.width = '0%';
        el.timerStat.textContent = fmtClock(ta || 0);
        el.treat.classList.remove('eaten');

        const sc = getItem('scene', save.equipped.scene) || CATALOG.scene[0];
        applyScene(el.scene, sc);
        el.sky.innerHTML = ART.skyHTML(sc.id);
        measureLayers();
        el.treat.textContent = getItem('treat', save.equipped.treat).icon;
        el.dogSlot.innerHTML = dogSVG(save.equipped);
        el.dogNameTag.textContent = save.dogName;
        el.dogWrap.classList.remove('happy', 'running');
        el.dogWrap.style.transform = 'translateX(0)';

        Object.assign(A, { x: 0, tx: 0, spd: 0, phase: 0, farX: 0, midX: 0, propsX: 0, groundX: 0, t: 0, hop: 0, happy: false, trailAcc: 0, statAcc: 0, label: '' });
        syncViewport();
        measure();
        renderSentence();
        updateStats();
        el.speedLabel.textContent = 'Start typing to wake up your pup! 😴';

        animOn = true;
        A.last = performance.now();
        requestAnimationFrame(loop);
    }

    /* On phones the keyboard covers half the screen. Keep the game layer exactly the size of
       the visible area so the sentence at the top is never hidden. */
    function syncViewport() {
        if (el.game.classList.contains('hidden')) return;
        const vv = window.visualViewport;
        if (vv) {
            el.game.style.height = vv.height + 'px';
            el.game.style.transform = `translateY(${vv.offsetTop}px)`;
        }
        if (animOn) measure();
    }
    if (window.visualViewport) {
        visualViewport.addEventListener('resize', syncViewport);
        visualViewport.addEventListener('scroll', syncViewport);
    }
    window.addEventListener('resize', syncViewport);

    function measure() {
        const sw = el.scene.clientWidth;
        const dw = el.dogWrap.offsetWidth;
        const tw = el.treat.offsetWidth || 46;
        A.maxX = Math.max(0, sw - dw - tw - 10);
        const gr = el.scene.querySelector('.ground');
        A.groundH = gr ? gr.offsetHeight : 40;
    }

    function renderSentence() {
        const s = g.sentences[g.idx];
        el.sentenceBox.innerHTML = '';
        el.sentenceBox.style.animation = 'none'; void el.sentenceBox.offsetWidth; el.sentenceBox.style.animation = '';
        g.chars = []; g.words = []; g.charWord = [];
        g.pos = 0;
        const words = s.split(' ');
        words.forEach((w, wi) => {
            const wEl = document.createElement('span');
            wEl.className = 'word';
            const text = wi < words.length - 1 ? w + ' ' : w;
            const start = g.chars.length;
            for (const ch of text) {
                const c = document.createElement('span');
                c.className = 'char';
                c.textContent = ch;
                wEl.appendChild(c);
                g.chars.push(c);
                g.charWord.push(wi);
            }
            g.words.push({ el: wEl, start, end: g.chars.length - 1 });
            el.sentenceBox.appendChild(wEl);
        });
        g.chars[0].classList.add('current');
    }

    /* ---------- Typing input ----------
       Everything (desktop AND phone) goes through the hidden input's "input" event.
       That is the only thing phone keyboards report reliably. */
    let composed = 0;
    const normChar = ch =>
        (ch === '’' || ch === '‘' || ch === 'ʼ') ? "'" :
            (ch === '“' || ch === '”') ? '"' :
                ch === ' ' ? ' ' : ch;

    el.typer.addEventListener('input', e => {
        const val = el.typer.value;
        if (!g || !g.active) { el.typer.value = ''; composed = 0; return; }
        if (val.length < composed) composed = val.length;
        const fresh = val.slice(composed);
        composed = val.length;
        if (!e.isComposing) { el.typer.value = ''; composed = 0; }
        for (const ch of fresh) {
            if (!g || !g.active) break;
            typeChar(normChar(ch));
        }
    });
    el.typer.addEventListener('compositionend', () => { el.typer.value = ''; composed = 0; });

    el.typer.addEventListener('focus', () => el.tapPrompt.classList.add('hidden'));
    el.typer.addEventListener('blur', () => {
        if (!g || !g.active) return;
        if (isTouch) el.tapPrompt.classList.remove('hidden');      // keyboard was dismissed
        else setTimeout(() => { if (g && g.active) el.typer.focus({ preventScroll: true }); }, 0);
    });
    // Tap anywhere on the game to bring the keyboard back
    el.game.addEventListener('click', () => { if (g && g.active) el.typer.focus({ preventScroll: true }); });

    document.addEventListener('keydown', e => {
        // Enter on the results screen = play again
        if (!el.results.classList.contains('hidden') && e.key === 'Enter' && document.activeElement === document.body) { startGame(); return; }
        if (!g || !g.active) return;
        if (e.key === 'Escape') { leaveGame(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length !== 1) return;
        if (e.repeat) { e.preventDefault(); return; }               // holding a key down doesn't count
        if (document.activeElement !== el.typer) {                  // safety net if focus was lost
            e.preventDefault();
            el.typer.focus({ preventScroll: true });
            typeChar(normChar(e.key));
        }
    });

    function typeChar(ch) {
        const now = performance.now();
        if (g.startTime === null) g.startTime = now;

        const s = g.sentences[g.idx];
        const idx = g.pos;

        if (ch === s[idx]) {
            const c = g.chars[idx];
            c.classList.remove('current', 'wrong');
            c.classList.add('correct');
            g.pos++; g.correct++; g.streak++;
            g.bestStreak = Math.max(g.bestStreak, g.streak);
            g.stamps.push(now);
            sfx.key(g.streak);

            const w = g.words[g.charWord[idx]];
            if (idx === w.end) completeWord(w);

            if (g.pos >= s.length) {
                g.doneChars += s.length;
                g.idx++;
                if (g.ta && g.idx >= g.sentences.length) g.sentences.push(...getSentences(3));
                if (g.idx >= g.sentences.length) {
                    A.tx = 1;
                    el.progFill.style.width = '100%';
                    finishGame();
                    return;
                }
                sentenceFx();
                renderSentence();
            } else {
                g.chars[g.pos].classList.add('current');
            }
        } else {
            g.mistakes++;
            g.streak = 0;
            g.wordErr = true;
            const c = g.chars[idx];
            c.classList.add('wrong');
            setTimeout(() => c.classList.remove('wrong'), 250);
            el.sentenceBox.classList.remove('shake');
            void el.sentenceBox.offsetWidth;
            el.sentenceBox.classList.add('shake');
            sfx.wrong();
            vibrate(25);
            if (g.combo > 0) { g.combo = 0; AUD.intensity(0); }
        }
        if (!g.ta) {
            const p = (g.doneChars + g.pos) / g.totalChars;
            A.tx = p;                                   // only ever moves forward
            el.progFill.style.width = (p * 100).toFixed(1) + '%';
        }
        updateStats();
    }

    /* ---------- Word / sentence effects ---------- */
    function completeWord(w) {
        const perfect = !g.wordErr;
        g.wordErr = false;
        w.el.classList.add(perfect ? 'perfect' : 'done');
        if (perfect) {
            g.combo++;
            g.bestCombo = Math.max(g.bestCombo, g.combo);
            bump(el.comboStat);
        }
        sfx.word(perfect ? g.combo : 0);
        AUD.intensity(g.combo >= 8 ? 2 : g.combo >= 3 ? 1 : 0);
        A.hop = Math.max(A.hop, perfect ? 0.7 : 0.4);
        if (perfect) burstAt(w.el, { n: 5, size: 13, spread: 55, icons: ['✨', '⭐'] });
        else burstAt(w.el, { n: 3, size: 11, spread: 40, icons: ['🐾'] });
        if (perfect && g.combo > 0 && g.combo % 5 === 0) {
            if (g.combo === 10) sfx.fever();
            el.cheer.textContent = `🔥 ${g.combo >= 10 ? 'FEVER' : 'Combo'} x${g.combo}!`;
            el.cheer.classList.remove('hidden');
            el.cheer.style.animation = 'none'; void el.cheer.offsetWidth; el.cheer.style.animation = '';
            clearTimeout(g.cheerT);
            g.cheerT = setTimeout(() => el.cheer.classList.add('hidden'), 1100);
            burstAt(el.scene, { n: 12, size: 20, spread: 130, icons: ['🔥', '⭐', '✨'] });
        }
    }

    function sentenceFx() {
        sfx.sentence();
        A.hop = 1;
        burstAt(el.sentenceBox, { n: 12, size: 16, spread: 120, icons: ['⭐', '✨', '🦴', '🐾'] });
        bump(el.sentenceStat);
    }

    const pad2 = n => String(n).padStart(2, '0');
    const fmtClock = secs => { secs = Math.floor(secs); return Math.floor(secs / 60) + ':' + pad2(secs % 60); };
    const fmtTime = secs => { const m = Math.floor(secs / 60); return m + ':' + (secs - m * 60).toFixed(1).padStart(4, '0'); };
    const fmtLong = secs => { const h = Math.floor(secs / 3600), m = Math.floor(secs % 3600 / 60); return h ? `${h}h ${m}m` : `${m}m ${Math.floor(secs % 60)}s`; };
    function currentWpm() {
        if (!g.startTime) return 0;
        const secs = (performance.now() - g.startTime) / 1000;
        if (secs < 2) return 0;
        return Math.round((g.correct / 5) / (secs / 60));
    }
    function currentAcc() {
        const total = g.correct + g.mistakes;
        return total === 0 ? 100 : Math.round((g.correct / total) * 100);
    }
    function updateStats() {
        el.wpmStat.textContent = currentWpm();
        el.accStat.textContent = currentAcc() + '%';
        el.mistakeStat.textContent = g.mistakes;
        el.streakStat.textContent = g.streak;
        el.comboStat.textContent = g.combo;
        el.sentenceStat.textContent = g.ta ? `${g.idx} ✓` : `${Math.min(g.idx + 1, g.sentences.length)}/${g.sentences.length}`;
        const secs = g.startTime ? (performance.now() - g.startTime) / 1000 : 0;
        el.timerStat.textContent = fmtClock(g.ta ? Math.max(0, g.ta - secs) : secs);
        el.timerStat.classList.toggle('low', !!g.ta && g.startTime && g.ta - secs <= 10);
    }

    /* ---------- Animation loop ----------
       One requestAnimationFrame loop drives the dog's legs, position and the
       scrolling world. Speed and position are smoothed with exponential easing,
       so fast typing can never make the dog jump, restart or move backwards. */
    function loop(ts) {
        if (!animOn) return;
        const dt = Math.min(0.05, Math.max(0.001, (ts - A.last) / 1000));
        A.last = ts;
        A.t += dt;

        let target = 0;
        if (g && g.active) {
            const now = performance.now();
            while (g.stamps.length && now - g.stamps[0] > WINDOW_MS) g.stamps.shift();
            target = g.stamps.length / (WINDOW_MS / 1000); // letters per second
        }
        if (g && g.active && g.ta && g.startTime) {
            const tsec = (performance.now() - g.startTime) / 1000;
            A.tx = Math.max(A.tx, Math.min(1, tsec / g.ta));
            el.progFill.style.width = (Math.min(1, tsec / g.ta) * 100).toFixed(1) + '%';
            if (tsec >= g.ta) { finishGame(); }
        }
        A.spd += (target - A.spd) * (1 - Math.exp(-dt * 3));
        const spd = A.spd < 0.08 ? 0 : A.spd;

        // position glides toward the target and never goes back
        if (A.tx > A.x) A.x += (A.tx - A.x) * (1 - Math.exp(-dt * 5));
        if (A.tx - A.x < 0.0004) A.x = A.tx;
        el.dogWrap.style.transform = `translateX(${(A.x * A.maxX).toFixed(1)}px)`;

        // legs + bounce (+ a little hop for every finished word)
        const amp = Math.min(1, spd / 1.2);
        A.phase += dt * Math.PI * 2 * Math.min(6.5, 1.4 + 0.5 * spd);
        let leg = Math.sin(A.phase) * 38 * amp;
        let bob = -Math.abs(Math.sin(A.phase)) * 5 * amp;
        if (A.happy) { leg = 0; bob = -Math.abs(Math.sin(A.t * 9)) * 14; }
        A.hop *= Math.exp(-dt * 7);
        if (A.hop < 0.01) A.hop = 0;
        bob -= A.hop * 14;
        el.dogWrap.style.setProperty('--leg', leg.toFixed(1));
        el.dogWrap.style.setProperty('--bob', bob.toFixed(1));
        el.dogWrap.classList.toggle('running', spd > 0.5);
        el.dogWrap.classList.toggle('happy', A.happy);

        // scrolling world (units are rem so it matches the CSS tile sizes)
        A.farX -= spd * LAYER_SPEED.far * L.rem * dt;
        A.midX -= spd * LAYER_SPEED.mid * L.rem * dt;
        A.groundX -= spd * 3.7 * dt;   // ground + props share one speed (rem)
        A.propsX -= spd * LAYER_SPEED.props * L.rem * dt;
        if (L.far) el.layFar.style.backgroundPositionX = (A.farX % L.far).toFixed(1) + 'px';
        if (L.mid) el.layMid.style.backgroundPositionX = (A.midX % L.mid).toFixed(1) + 'px';
        if (L.props) el.layProps.style.backgroundPositionX = (A.propsX % L.props).toFixed(1) + 'px';
        el.stripes.style.backgroundPositionX = (A.groundX % 3.75).toFixed(2) + 'rem';

        // trail particles
        if (save.equipped.trail !== 'none' && save.fx && spd > 1) {
            A.trailAcc += dt * spd * 1.3;
            while (A.trailAcc >= 1) { A.trailAcc -= 1; spawnTrail(); }
        }

        // text updates a few times a second, not every frame
        A.statAcc += dt;
        if (A.statAcc > 0.2) {
            A.statAcc = 0;
            if (g && g.active) { updateStats(); setLabel(spd); }
        }

        requestAnimationFrame(loop);
    }

    function setLabel(spd) {
        const wpmLive = spd * 12;
        const text = !g.startTime ? 'Start typing to wake up your pup! 😴'
            : spd === 0 ? 'Keep going, your pup is waiting! 🐕'
                : wpmLive < 15 ? 'Trotting along 🐕'
                    : wpmLive < 35 ? 'Running! 🐕💨'
                        : wpmLive < 60 ? 'Sprinting!! 🐕💨💨' : 'ZOOMIES!!! 🚀🐕';
        if (text !== A.label) { A.label = text; el.speedLabel.textContent = text; }
    }

    function spawnTrail() {
        if (el.trail.childElementCount > 40) return;
        const tr = getItem('trail', save.equipped.trail);
        if (!tr || !tr.icon || tr.id === 'none') return;
        const p = document.createElement('span');
        p.className = 'trail-p';
        p.textContent = tr.icon;
        p.style.left = (A.x * A.maxX + 8 + Math.random() * 14) + 'px';
        p.style.bottom = (A.groundH + Math.random() * 36) + 'px';
        p.addEventListener('animationend', () => p.remove());
        el.trail.appendChild(p);
    }

    /* =====================================================
       FINISH + REWARDS
    ===================================================== */
    function finishGame() {
        g.active = false;
        el.typer.blur();                       // closes the phone keyboard so the results are visible
        el.tapPrompt.classList.add('hidden');
        const elapsed = g.ta ? g.ta : Math.max(1, (performance.now() - g.startTime) / 1000);
        const res = {
            time: elapsed, ta: g.ta, sentences: g.idx,
            correct: g.correct, mistakes: g.mistakes, bestStreak: g.bestStreak, bestCombo: g.bestCombo,
            wpm: Math.round((g.correct / 5) / (elapsed / 60)), acc: currentAcc()
        };
        updateStats();

        A.tx = 1;
        A.happy = true;
        el.treat.classList.add('eaten');
        el.cheer.textContent = `Good dog, ${save.dogName}! 🦴`;
        el.cheer.classList.remove('hidden');
        el.cheer.style.animation = 'none'; void el.cheer.offsetWidth; el.cheer.style.animation = '';
        el.speedLabel.textContent = 'Nom nom nom! 😋';
        spawnFloaters();
        burstAt(el.scene, { n: 36, size: 22, spread: 240, lift: 60, icons: ['🎉', '⭐', '✨', '🦴', '❤️', '💛'] });
        sfx.fanfare();
        setTimeout(() => sfx.nom(), 500);
        AUD.intensity(0);
        vibrate([40, 40, 80]);
        setTimeout(() => { if (animOn) showResults(res); }, 2300);
    }

    function spawnFloaters() {
        const icons = ['❤️', '⭐', '🦴', '✨', '💛'];
        for (let i = 0; i < 14; i++) {
            const s = document.createElement('span');
            s.className = 'float';
            s.textContent = pick(icons);
            s.style.left = (30 + Math.random() * 60) + '%';
            s.style.animationDelay = (Math.random() * 0.9) + 's';
            el.hearts.appendChild(s);
        }
    }

    function award(res) {
        const mult = diffInfo(save.difficulty).mult;
        const accMult = res.acc >= 98 ? 2 : res.acc >= 95 ? 1.6 : res.acc >= 90 ? 1.3 : res.acc >= 80 ? 1 : 0.5;
        const stars = res.acc >= 97 ? 3 : res.acc >= 90 ? 2 : 1;
        const perfect = res.mistakes === 0;
        const xpGain = Math.round((res.correct * accMult * 0.5 + res.wpm) * mult);
        const bones = Math.round(res.correct * 0.1 * mult) + stars * 5 + (perfect ? 15 : 0);
        const passGain = 20 + Math.round(res.correct * 0.2) + stars * 5 + (perfect ? 10 : 0);
        const notes = [];

        const fromLevel = save.level;
        save.xp += xpGain;
        while (save.xp >= xpNeeded(save.level)) { save.xp -= xpNeeded(save.level); save.level++; }
        save.bones += bones;

        const tierBefore = passTier();
        addPass(passGain);
        const tierAfter = passTier();

        save.games++;
        save.totalChars += res.correct;
        save.bestWpm = Math.max(save.bestWpm, res.wpm);
        save.bestAcc = Math.max(save.bestAcc, res.acc);
        save.maxStreak = Math.max(save.maxStreak, res.bestStreak);
        if (perfect) save.perfects++;
        if (isTough(save.difficulty)) save.hardRounds++;
        save.totalTime += Math.round(res.time);
        save.bestCombo = Math.max(save.bestCombo, res.bestCombo);
        if (!save.diffsPlayed.includes(save.difficulty)) save.diffsPlayed.push(save.difficulty);
        if (save.difficulty === 'custom') save.customRounds++;
        const hr = new Date().getHours();
        if (hr < 5) save.nightRounds++; else if (hr < 8) save.morningRounds++;
        let bestTime = 0, newBest = false;
        if (res.ta) {
            save.taRounds++;
            if (res.sentences > save.taBest) { save.taBest = res.sentences; if (res.sentences > 0) notes.push(`⏱️ New Time Attack record: ${res.sentences} sentences!`); }
        } else {
            const key = `${save.difficulty}-${save.count}`;
            const prev = save.bestTimes[key];
            bestTime = prev || res.time;
            if (!prev || res.time < prev) { save.bestTimes[key] = Math.round(res.time * 10) / 10; bestTime = save.bestTimes[key]; newBest = !!prev || true; notes.push('🏁 New best time for this round type!'); }
            if (save.count >= 5 && res.time <= 25 && res.acc >= 90) save.quickRound = 1;
        }
        save.history.push({ wpm: res.wpm, acc: res.acc, diff: save.difficulty });
        save.history = save.history.slice(-20);

        if (save.level > fromLevel) {
            notes.push(`🎊 LEVEL UP! Level ${save.level} – ${titleFor(save.level)}`);
            CATS.forEach(c => CATALOG[c].forEach(it => {
                if (it.src.type === 'level' && it.src.level > fromLevel && it.src.level <= save.level) notes.push(`🔓 Unlocked: ${it.name} (${CAT_META.find(m => m.id === c).label})`);
            }));
            Object.keys(DIFFS).forEach(k => { if (DIFFS[k].unlock > fromLevel && DIFFS[k].unlock <= save.level) notes.push(`🔓 New difficulty: ${k[0].toUpperCase() + k.slice(1)}`); });
        }
        if (res.bestCombo >= 5) notes.push(`🔥 Best word combo: x${res.bestCombo}`);
        if (tierAfter > tierBefore) notes.push(`🎟️ Paw Pass tier ${tierAfter} reached! Claim it in the Pass tab.`);
        updateQuests(res).forEach(t => notes.push(`📜 Quest complete: ${t}`));

        const prevAch = save.ach.length;
        checkAchievements(true); // toasts + bones
        const newAch = save.ach.slice(prevAch).map(id => ACHIEVEMENTS.find(a => a.id === id));
        newAch.forEach(a => {
            notes.push(`🏅 Achievement: ${a.name} (+${a.bones} 🦴)`);
            CATS.forEach(c => CATALOG[c].forEach(it => { if (it.src.type === 'ach' && it.src.id === a.id) notes.push(`🔓 Unlocked: ${it.name}`); }));
        });

        persist();
        return { xpGain, bones, accMult, stars, notes, bestTime, newBest, levelUp: save.level > fromLevel };
    }

    function showResults(res) {
        AUD.mood('menu');
        const a = award(res);
        el.resTitle.textContent = a.stars === 3 ? 'Perfect Pup! 🏆' : a.stars === 2 ? 'Great job! 🎉' : 'Good dog! 🐶';
        el.resStars.textContent = '⭐'.repeat(a.stars) + '☆'.repeat(3 - a.stars);
        el.resMessage.textContent = `${save.dogName} got a treat!`;
        el.resTime.textContent = res.ta
            ? `⏱️ Time Attack · ${res.sentences} sentence${res.sentences === 1 ? '' : 's'} finished in ${fmtClock(res.ta)}`
            : `⏱️ Time ${fmtTime(res.time)}` + (a.bestTime && !a.newBest ? ` · Best ${fmtTime(a.bestTime)}` : a.newBest ? ' · 🏁 New best!' : '');
        el.resWpm.textContent = res.wpm;
        el.resAcc.textContent = res.acc + '%';
        el.resMistakes.textContent = res.mistakes;
        el.resStreak.textContent = res.bestStreak;
        el.resXp.textContent = `+${a.xpGain} XP` + (a.accMult >= 1.6 ? ' ⚡' : '');
        el.resBones.textContent = `+${a.bones} 🦴`;
        el.resNotes.innerHTML = a.notes.map(n => `<li>${n}</li>`).join('');
        if (a.levelUp) {
            sfx.levelUp();
            burst(innerWidth / 2, innerHeight / 3, { n: 30, size: 22, spread: 260, lift: 40, icons: ['🎊', '⭐', '✨', '🎉'] });
        }

        const need = xpNeeded(save.level);
        el.resXpFill.style.width = '0%';
        el.resXpText.textContent = `Level ${save.level}: ${save.xp} / ${need} XP`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.resXpFill.style.width = Math.min(100, (save.xp / need) * 100) + '%';
        }));
        el.resTip.textContent =
            res.acc < 80 ? 'Tip: slow down a little. Fewer mistakes means way more XP!' :
                res.acc < 95 ? 'Tip: get 95%+ accuracy for a big XP bonus.' :
                    res.wpm < 30 ? 'Tip: your accuracy is great. Now try to speed up a bit!' :
                        'Amazing! Try a harder difficulty for even more XP.';

        renderHeader();
        renderDots();
        el.results.classList.remove('hidden');
    }

    function leaveGame(tab) {
        AUD.mood('menu'); AUD.intensity(0);
        animOn = false;
        if (g) g.active = false;
        el.typer.blur();
        el.game.classList.add('hidden');
        el.game.style.height = '';
        el.game.style.transform = '';
        el.results.classList.add('hidden');
        document.body.classList.remove('playing');
        el.nav.classList.remove('hidden');
        showTab(tab || 'play');
    }

    /* =====================================================
       EVENTS
    ===================================================== */
    document.addEventListener('click', e => {
        const t = e.target.closest('[data-act]');
        if (!t) return;
        const d = t.dataset;
        switch (d.act) {
            case 'tab': if (d.tab !== currentTab) sfx.tab(); showTab(d.tab); break;
            case 'quit': leaveGame('play'); break;
            case 'cat': wardCat = d.cat; tryOn = null; renderWardrobe(); break;
            case 'select': selectItem(d.cat, d.id); break;
            case 'equip': equip(d.cat, d.id); break;
            case 'buy': buy(d.cat, d.id); break;
            case 'claimPass':
                if (claimPass(parseInt(d.tier, 10))) { persist(); renderAll(); burst(e.clientX, e.clientY, { n: 12, size: 18, spread: 90, icons: ['🎟️', '⭐', '✨'] }); }
                break;
            case 'claimAllPass': {
                let n = 0;
                claimableTiers().forEach(tier => { if (claimPass(tier)) n++; });
                if (n) { persist(); renderAll(); burst(e.clientX, e.clientY, { n: 16, size: 18, spread: 110, icons: ['🎟️', '⭐', '✨', '🦴'] }); }
                break;
            }
            case 'claimDaily': claimDaily(); burst(e.clientX, e.clientY, { n: 12, size: 18, spread: 90, icons: ['🎁', '⭐', '✨', '🦴'] }); break;
            case 'mystery': openMystery(); break;
            case 'claimQuest': claimQuest(parseInt(d.q, 10)); burst(e.clientX, e.clientY, { n: 12, size: 18, spread: 90, icons: ['📜', '⭐', '✨', '🦴'] }); break;
        }
    });

    el.startBtn.addEventListener('click', startGame);
    el.againBtn.addEventListener('click', startGame);
    el.menuBtn.addEventListener('click', () => leaveGame('play'));
    el.tapPrompt.addEventListener('click', () => el.typer.focus({ preventScroll: true }));

    el.difficultySelect.addEventListener('change', () => { save.difficulty = el.difficultySelect.value; persist(); });
    el.modeSelect.addEventListener('change', () => { save.mode = el.modeSelect.value; persist(); el.countSelect.disabled = save.mode === 'timeattack'; });
    el.countSelect.addEventListener('change', () => { save.count = parseInt(el.countSelect.value, 10); persist(); });
    el.dogNameInput.addEventListener('change', () => {
        save.dogName = (el.dogNameInput.value.trim() || 'Biscuit').slice(0, 12);
        persist(); renderAll();
        toast(`Your pup is now called ${save.dogName}!`, 'paw'); sfx.on();
    });
    el.segMode.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return; save.mode = b.dataset.v; persist(); renderPlay(); sfx.pop(); });
    el.segDiff.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return; save.difficulty = b.dataset.v; persist(); renderPlay(); sfx.pop(); });
    el.segCount.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return; save.count = parseInt(b.dataset.v, 10); persist(); renderPlay(); sfx.pop(); });
    const themeMsg = () => document.body.classList.contains('dark') ? ['Dark mode now active!', 'dark'] : ['Light mode now active!', 'light'];
    function themeToast() { const [m, k] = themeMsg(); toast(m, k); sfx.on(); }
    el.themeBtn.addEventListener('click', () => { save.theme = document.body.classList.contains('dark') ? 'light' : 'dark'; persist(); applyPrefs(); renderSettings(); themeToast(); });
    document.addEventListener('pointerdown', e => {            // soft ripple under the finger / cursor
        const t = e.target.closest('.small-btn, .big-btn, .seg button, .chip-btn, .pill');
        if (!t || t.disabled || !save.fx) return;
        const r = t.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
        const dot = document.createElement('span');
        dot.className = 'rip';
        dot.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
        t.appendChild(dot);
        setTimeout(() => dot.remove(), 650);
    });
    el.themeSelect.addEventListener('change', () => {
        save.theme = el.themeSelect.value; persist(); applyPrefs();
        if (save.theme === 'auto') { toast('Theme now follows your device!', 'info'); sfx.on(); } else themeToast();
    });
    if (darkMQ && darkMQ.addEventListener) darkMQ.addEventListener('change', applyPrefs);
    el.textSizeSelect.addEventListener('change', () => { save.textSize = parseInt(el.textSizeSelect.value, 10); persist(); applyPrefs(); toast(`Text size set to ${['', 'small', 'medium', 'large'][save.textSize]}!`, 'info'); });

    function toggleMute() {
        save.muted = !save.muted;
        persist(); ensureAudio(); renderHeader(); renderSettings();
        if (save.muted) toast('Sound is now off', 'mute');
        else { toast('Sound is now on!', 'sound'); sfx.on(); }
    }
    el.muteBtn.addEventListener('click', toggleMute);
    el.soundToggle.addEventListener('click', toggleMute);
    el.musicToggle.addEventListener('click', () => {
        save.musicOff = !save.musicOff;
        persist(); ensureAudio(); renderSettings();
        toast(save.musicOff ? 'Music is now off' : 'Music is now on!', save.musicOff ? 'mute' : 'music');
        save.musicOff ? sfx.off() : sfx.on();
    });
    el.keysToggle.addEventListener('click', () => {
        save.keySounds = !save.keySounds;
        persist(); ensureAudio(); renderSettings();
        toast(save.keySounds ? 'Typing sounds now on!' : 'Typing sounds now off', save.keySounds ? 'on' : 'off');
        save.keySounds ? sfx.on() : sfx.off();
    });
    el.fxToggle.addEventListener('click', () => {
        save.fx = !save.fx; persist(); applyPrefs(); renderSettings();
        toast(save.fx ? 'Visual effects now on!' : 'Visual effects now off', save.fx ? 'on' : 'off');
        save.fx ? sfx.on() : sfx.off();
    });

    el.saveCustomBtn.addEventListener('click', () => {
        save.custom = cleanCustom(el.customText.value.split('\n'));
        if (!save.custom.length && save.difficulty === 'custom') save.difficulty = 'easy';
        persist();
        el.customText.value = save.custom.join('\n');
        toast(save.custom.length ? `Saved ${save.custom.length} sentence${save.custom.length === 1 ? '' : 's'}! Pick "My sentences" on the Play tab.` : 'Custom list cleared.', 'info');
    });

    el.exportBtn.addEventListener('click', () => {
        el.saveCode.value = exportCode();
        el.saveCode.select();
        toast('Save code ready. Copy it somewhere safe.', 'info');
    });
    el.importBtn.addEventListener('click', () => {
        try {
            importCode(el.saveCode.value);
            toast('Progress loaded!', 'good');
            renderAll();
        } catch (err) { toast('That save code is not valid.', 'warn'); sfx.error(); }
    });
    el.resetBtn.addEventListener('click', () => {
        if (confirm('Reset your level, XP, items and records? This cannot be undone.')) {
            save = freshSave();
            persist();
            applyPrefs(); syncAudio();
            ensureDaily();
            renderAll();
        }
    });

    /* =====================================================
       START
    ===================================================== */
    if (window.PT_ICONS) PT_ICONS.start();
    applyPrefs();
    syncAudio();
    ensureDaily();
    checkAchievements(false);
    persist();
    showTab('play');
})();