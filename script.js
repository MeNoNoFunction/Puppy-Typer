(() => {
    'use strict';

    const D = window.PT_DATA;
    const { CAT_META, CATALOG, DIFFS, TITLES, QUEST_POOL, ACHIEVEMENTS } = D;

    const SAVE_KEY = 'puppyTypistSave_v2';
    const OLD_KEY = 'puppyTypistSave_v1';
    const PASS_TIERS = 25;   // Season Level cap
    const PASS_XP = 100;
    // Paw Pass seasons. To start Season 1: change CURRENT_SEASON to 's1', add its name, and give the pass new rewards.
    // Players' pass progress then resets automatically, but owned cosmetics and the 'seasons' tag list stay.
    const CURRENT_SEASON = 's0';
    const SEASON_NAMES = { s0: 'Season 0: Backyard Bash', s1: 'Season 1: Frostbite' };
    const seasonName = id => SEASON_NAMES[id] || ('Season ' + String(id).replace(/\D/g, ''));
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
            fx: !prefersReduced, stage: true, textSize: 2, custom: [],
            owned, equipped,
            topic: 'mixed', twist: 'off', endlessBest: 0, dailyWins: 0, goldTotal: 0, twistRounds: 0, topicsPlayed: [], mythicBought: false, challenge: { date: '' },
            pass: { xp: 0, claimed: [] }, passSeason: CURRENT_SEASON, seasons: [], seasonTier: {}, badges: [], badgesSeen: [], tokens: { xp2: 0, bones2: 0, pass2: 0 }, boosts: {}, redeemed: [], shopBuys: 0, weekly: { week: '', quests: [], bonus: false },
            daily: { date: '', lastVisit: '', streak: 0, quests: [], reward: '' }, giftDate: '',
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
            'totalTime', 'bestCombo', 'questsDone', 'customRounds', 'nightRounds', 'morningRounds', 'taRounds', 'taBest', 'shopBuys', 'endlessBest', 'dailyWins', 'goldTotal', 'twistRounds', 'quickRound', 'mysteryOpened', 'dailyClaims', 'savedAt'];
        nums.forEach(k => { if (Number.isFinite(raw[k]) && raw[k] >= 0) s[k] = Math.floor(raw[k]); });
        if (s.level < 1) s.level = 1;
        if (['auto', 'light', 'dark'].includes(raw.theme)) s.theme = raw.theme;
        if (['timeattack', 'endless', 'daily'].includes(raw.mode)) s.mode = raw.mode;
        if (TOPICS[raw.topic]) s.topic = raw.topic;
        if (typeof raw.giftDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.giftDate)) s.giftDate = raw.giftDate;
        if (raw.twist === 'random') s.twist = 'random';
        if (Array.isArray(raw.topicsPlayed)) s.topicsPlayed = raw.topicsPlayed.filter(t => TOPICS[t]);
        s.mythicBought = raw.mythicBought === true;
        if (raw.challenge && typeof raw.challenge.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.challenge.date)) s.challenge.date = raw.challenge.date;
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
        if (typeof raw.stage === 'boolean') s.stage = raw.stage;
        if ([1, 2, 3].includes(raw.textSize)) s.textSize = raw.textSize;
        if (Array.isArray(raw.custom)) s.custom = cleanCustom(raw.custom.filter(x => typeof x === 'string'));
        CATS.forEach(c => {
            if (raw.owned && Array.isArray(raw.owned[c])) s.owned[c] = raw.owned[c].filter(id => getItem(c, id));
            if (raw.equipped && getItem(c, raw.equipped[c])) s.equipped[c] = raw.equipped[c];
        });
        // the pre-season used to be called Season 1 (s1): rename it to Season 0 (s0)
        if (raw.passSeason === 's1') raw.passSeason = 's0';
        if (Array.isArray(raw.seasons)) raw.seasons = raw.seasons.map(v => v === 's1' ? 's0' : v);
        if (raw.seasonTier && raw.seasonTier.s1 !== undefined) { raw.seasonTier.s0 = Math.max(raw.seasonTier.s0 || 0, raw.seasonTier.s1); delete raw.seasonTier.s1; }
        if (raw.pass) {
            if (Number.isFinite(raw.pass.xp)) s.pass.xp = Math.max(0, Math.min(PASS_TIERS * PASS_XP, Math.floor(raw.pass.xp)));
            if (Array.isArray(raw.pass.claimed)) s.pass.claimed = raw.pass.claimed.filter(n => Number.isInteger(n) && n >= 1 && n <= PASS_TIERS);
        }
        // seasons: which seasons this player took part in (permanent tags) + best pass tier reached in each
        const sid = v => typeof v === 'string' && /^s\d{1,3}$/.test(v);
        if (sid(raw.passSeason)) s.passSeason = raw.passSeason;
        if (Array.isArray(raw.seasons)) s.seasons = [...new Set(raw.seasons.filter(sid))];
        if (raw.seasonTier && typeof raw.seasonTier === 'object') Object.keys(raw.seasonTier).forEach(k => { const v = raw.seasonTier[k]; if (sid(k) && Number.isInteger(v) && v >= 0) s.seasonTier[k] = Math.min(v, PASS_TIERS); });
        if (s.passSeason !== CURRENT_SEASON) {      // a new season started: the pass starts over, everything else stays
            s.pass = { xp: 0, claimed: [] }; s.passSeason = CURRENT_SEASON;
        }
        if (s.pass.xp > 0 && !s.seasons.includes(s.passSeason)) s.seasons.push(s.passSeason);   // players who already earned pass XP get the tag too
        if (s.pass.xp > 0) s.seasonTier[s.passSeason] = Math.max(s.seasonTier[s.passSeason] || 0, Math.min(PASS_TIERS, Math.floor(s.pass.xp / PASS_XP)));
        if (raw.tokens && typeof raw.tokens === 'object') Object.keys(TOKENS).forEach(k => { const v = raw.tokens[k]; if (Number.isInteger(v) && v > 0) s.tokens[k] = Math.min(v, 999); });
        if (raw.boosts && typeof raw.boosts === 'object') Object.keys(TOKENS).forEach(k => { const v = raw.boosts[k]; if (Number.isFinite(v) && v > Date.now()) s.boosts[k] = Math.min(v, Date.now() + 1000 * 60 * 60 * 24); });
        if (Array.isArray(raw.redeemed)) s.redeemed = [...new Set(raw.redeemed.filter(x => typeof x === 'string' && x.length < 40))];
        const bid = v => typeof v === 'string' && /^[a-z0-9_]{2,40}$/.test(v);
        if (Array.isArray(raw.badges)) s.badges = [...new Set(raw.badges.filter(bid))];
        if (Array.isArray(raw.badgesSeen)) s.badgesSeen = [...new Set(raw.badgesSeen.filter(bid))];
        syncBadges(s);
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
        if (raw.weekly && typeof raw.weekly === 'object') {
            s.weekly.week = typeof raw.weekly.week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.weekly.week) ? raw.weekly.week : '';
            s.weekly.bonus = !!raw.weekly.bonus;
            if (Array.isArray(raw.weekly.quests)) s.weekly.quests = raw.weekly.quests
                .filter(q => q && Number.isInteger(q.i) && WEEKLY_POOL[q.i]).map(q => ({ i: q.i, p: Number.isFinite(q.p) ? q.p : 0, c: !!q.c })).slice(0, 3);
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
    // quiet = true: write without counting it as a change (used at startup and when loading from the cloud)
    const acct = { state: 'off', user: null, username: '', synced: false, timer: null, failed: false };
    function persist(quiet) {
        if (!quiet) save.savedAt = tnow();
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
        if (!quiet && acct.synced) scheduleCloudPush();
    }

    const darkMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    function applyPrefs() {
        const dark = save.theme === 'dark' || (save.theme === 'auto' && !!(darkMQ && darkMQ.matches)) || (save.stage && document.body.classList.contains('playing'));
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
        if (s.type === 'level') return `🔒 Reach Pup level ${s.level}`;
        if (s.type === 'bones') return '🛍️ Sold in the Shop';
        if (s.type === 'event') { const ev = EVENTS.find(e => e.id === s.event); return ev ? `${ev.icon} ${ev.name.replace(' Shop', '')} event only` : 'Event only'; }
        if (s.type === 'pass') return `🎟️ Paw Pass tier ${s.tier}`;
        if (s.type === 'code') return '🔒 Exclusive: secret code';
        if (s.type === 'ach') { const a = ACHIEVEMENTS.find(x => x.id === s.id); return `🏅 ${a ? a.name : 'Achievement'}`; }
        return 'Free';
    }
    fixEquipped();

    /* =====================================================
       DAILY QUESTS
    ===================================================== */
    // Quests, the daily reward and the Shop all reset at 7:00 AM Denver time for everyone (weekly quests: Monday 7:00 AM).
    const RESET_HOUR = 7;
    // EVERYTHING timed (shop, quests, events, countdowns) runs on ONE fixed clock for all players: Denver time.
    // To use another zone, change GAME_TZ (an IANA name, e.g. 'America/New_York').
    const GAME_TZ = 'America/Denver';
    const tzFmt = new Intl.DateTimeFormat('en-US', { timeZone: GAME_TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    // Trusted time: the device clock corrected by the Firebase server clock (signed-in players), so changing
    // the device clock does not move shop resets, events, daily rewards or boost timers.
    let clockOff = 0;
    const tnow = () => Date.now() + clockOff;
    async function syncClock() {
        const C = window.PT_CLOUD;
        if (!C || !C.serverClock || !C.user || !C.user()) return;
        try { const off = await C.serverClock(); if (Number.isFinite(off)) { const moved = Math.abs(off - clockOff) > 2000; clockOff = off; if (moved) { ensureDaily(); renderAll(); } } } catch (e) { /* keep the device clock */ }
    }
    setInterval(syncClock, 10 * 60 * 1000);
    function tzParts(ms) { const o = {}; tzFmt.formatToParts(new Date(ms)).forEach(p => { o[p.type] = +p.value; }); return o; }
    // "game now": a Date whose fields (getHours, getDate ...) read as the current Denver wall-clock time
    function gnow() { const p = tzParts(tnow()); return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second); }
    // turn a game-clock Date (fields = Denver wall time) back into a real timestamp
    function frameToMs(f) {
        const asUTC = Date.UTC(f.getFullYear(), f.getMonth(), f.getDate(), f.getHours(), f.getMinutes(), f.getSeconds());
        let ms = asUTC;
        for (let i = 0; i < 2; i++) { const p = tzParts(ms); ms = asUTC - (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms); }
        return ms;
    }
    const fmtDay = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    function gameDate(d = gnow()) { const g = new Date(d.getFullYear(), d.getMonth(), d.getDate()); if (d.getHours() < RESET_HOUR) g.setDate(g.getDate() - 1); return g; }
    function dateStr(d) { return fmtDay(gameDate(d)); }
    function weekStr(d) { const g = gameDate(d); g.setDate(g.getDate() - ((g.getDay() + 6) % 7)); return fmtDay(g); }
    function msToReset() { const n = gnow(), t = new Date(n.getFullYear(), n.getMonth(), n.getDate(), RESET_HOUR); if (t <= n) t.setDate(t.getDate() + 1); return frameToMs(t) - tnow(); }
    function msToWeekReset() { const n = gnow(), g = gameDate(n); return frameToMs(new Date(g.getFullYear(), g.getMonth(), g.getDate() + 7 - ((g.getDay() + 6) % 7), RESET_HOUR)) - tnow(); }
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
        ensureWeekly();
        const today = dateStr();
        const d = save.daily;
        if (d.date === today && d.quests.length) return;
        const y = gnow(); y.setDate(y.getDate() - 1);
        d.streak = d.lastVisit === dateStr(y) ? d.streak + 1 : 1;
        d.date = today;
        d.lastVisit = today;
        d.quests = makeQuests(today);
        newDayToast = true;
        checkAchievements(true);
        persist(true);   // a new day alone should not count as a newer save (see account sync)
    }
    const questDone = q => q.p >= QUEST_POOL[q.i].target;

    /* ---------- Weekly quests ---------- */
    function makeWeekly(week) {
        let h = 7;
        for (const ch of week) h = (h * 31 + ch.charCodeAt(0)) | 0;
        const rnd = mulberry(h);
        const order = WEEKLY_POOL.map((_, i) => i).sort(() => rnd() - 0.5);
        const used = new Set(), out = [];
        for (const i of order) { if (used.has(WEEKLY_POOL[i].type)) continue; used.add(WEEKLY_POOL[i].type); out.push({ i, p: 0, c: false }); if (out.length === 3) break; }
        return out;
    }
    function ensureWeekly() {
        const w = weekStr();
        if (save.weekly.week === w && save.weekly.quests.length) return;
        save.weekly = { week: w, quests: makeWeekly(w), bonus: false };
        persist(true);
    }
    const wDone = q => q.p >= WEEKLY_POOL[q.i].target;
    function progressQuest(q, def, res) {
        switch (def.type) {
            case 'rounds': q.p += 1; break;
            case 'chars': q.p += res.correct; break;
            case 'acc': q.p = Math.max(q.p, res.acc); break;
            case 'wpm': q.p = Math.max(q.p, res.wpm); break;
            case 'streak': q.p = Math.max(q.p, res.bestStreak); break;
            case 'perfect': if (res.mistakes === 0) q.p += 1; break;
            case 'tough': if (isTough(save.difficulty)) q.p += 1; break;
            case 'combo': q.p = Math.max(q.p, res.bestCombo || 0); break;
        }
    }
    function updateWeekly(res) {
        ensureWeekly();
        const finished = [];
        save.weekly.quests.forEach(q => {
            if (wDone(q)) return;
            const def = WEEKLY_POOL[q.i];
            progressQuest(q, def, res);
            if (wDone(q)) finished.push(def.text);
        });
        return finished;
    }
    function claimWeekly(idx) {
        const q = save.weekly.quests[idx];
        if (!q || q.c || !wDone(q)) return;
        const def = WEEKLY_POOL[q.i];
        q.c = true; save.questsDone++;
        save.bones += def.bones; addPass(def.pxp);
        let msg = `Weekly quest complete! +${def.bones} 🦴 +${def.pxp} Pass XP`;
        if (save.weekly.quests.every(x => x.c) && !save.weekly.bonus) {
            save.weekly.bonus = true; save.tokens[WEEKLY_BONUS_TOKEN] += 1;
            msg = `All weekly quests done! Bonus: ${TOKENS[WEEKLY_BONUS_TOKEN].name}`;
            sfx.unlock();
        }
        checkAchievements(true);
        persist(); sfx.sentence();
        toast(msg, 'good');
        renderAll();
    }

    function updateQuests(res) {
        const finished = [];
        save.daily.quests.forEach(q => {
            if (questDone(q)) return;
            const def = QUEST_POOL[q.i];
            progressQuest(q, def, res);
            if (questDone(q)) finished.push(def.text);
        });
        updateWeekly(res).forEach(t => finished.push(t + ' (weekly)'));
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
        syncBadges(save);
        return got;
    }

    /* ---------- Token art (same style as the profile badges) ---------- */
    const tokenSVG = id => `<svg viewBox="0 0 64 64" aria-hidden="true">${TOKEN_ART[id] || ''}${TOKEN_X2}</svg>`;

    /* ---------- Rarity ---------- */
    const rarLabel = k => k.charAt(0).toUpperCase() + k.slice(1);
    const rarColor = it => (RARITIES[it.rarity] || RARITIES.common).color;
    const rarTag = it => `<span class="rar" style="--rc:${rarColor(it)}">${rarLabel(it.rarity || 'common')}</span>`;

    /* =====================================================
       PAW PASS
    ===================================================== */
    const careerLevel = () => careerOf(save);
    const passTier = () => Math.min(PASS_TIERS, Math.floor(save.pass.xp / PASS_XP));
    function passReward(t) {
        for (const cat of CATS) {
            const it = CATALOG[cat].find(i => i.src.type === 'pass' && i.src.tier === t);
            if (it) return { kind: 'item', cat, item: it };
        }
        if (TOKEN_TIERS[t] && TOKENS[TOKEN_TIERS[t]]) return { kind: 'token', token: TOKEN_TIERS[t], amount: 1 };
        if (t === PASS_TIERS) return { kind: 'bones', amount: 1000 };
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
            toast(`Season Level ${t}: +${r.amount} 🦴`, 'good'); sfx.claim();
        } else if (r.kind === 'token') {
            save.tokens[r.token] += r.amount;
            toast(`Season Level ${t}: ${TOKENS[r.token].name}! Activate it in Boosts.`, 'good'); sfx.unlock();
        } else {
            if (!save.owned[r.cat].includes(r.item.id)) save.owned[r.cat].push(r.item.id);
            toast(`Season Level ${t} unlocked: ${r.item.name}!`, 'good'); sfx.unlock();
        }
        sfx.sentence();
        return true;
    }
    // Season badges come from the seasons a player took part in
    function syncBadges(s) {
        const ctx = Object.assign({}, s, {
            itemCount: CATS.reduce((n, c) => n + (s.owned[c] ? s.owned[c].length : 0), 0),
            eventOwned: CATS.reduce((n, c) => n + CATALOG[c].filter(i => i.src.type === 'event' && s.owned[c] && s.owned[c].includes(i.id)).length, 0)
        });
        BADGES.forEach(b => { if (b.check && !s.badges.includes(b.id) && b.check(ctx)) s.badges.push(b.id); });
        s.seasons.forEach(id => {
            const b = 'season_' + id;
            if (!s.badges.includes(b)) s.badges.push(b);
            const mx = b + '_max';
            if ((s.seasonTier[id] || 0) >= PASS_TIERS && BADGES.some(x => x.id === mx) && !s.badges.includes(mx)) s.badges.push(mx);
        });
    }
    function announceBadges() {
        if (document.body.classList.contains('playing')) return;      // toasts are hidden mid-round; try again after
        const fresh = save.badges.filter(b => !save.badgesSeen.includes(b));
        if (!fresh.length) return;
        fresh.forEach((b, i) => {
            const def = BADGES.find(x => x.id === b);
            save.badgesSeen.push(b);
            if (def) setTimeout(() => { toast(`New badge: ${def.name}!`, 'good'); sfx.achieve(); }, 900 + i * 1200);
        });
        persist();
    }
    function addPass(n) {
        if (n > 0 && boostActive('pass2')) n *= 2;
        save.pass.xp = Math.min(PASS_TIERS * PASS_XP, save.pass.xp + n);
        if (n > 0) {
            if (!save.seasons.includes(CURRENT_SEASON)) save.seasons.push(CURRENT_SEASON);
            save.seasonTier[CURRENT_SEASON] = Math.max(save.seasonTier[CURRENT_SEASON] || 0, passTier());
            syncBadges(save);
        }
    }

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
        bonesChip: $('bonesChip'), levelChip: $('levelChip'), seasonChip: $('seasonChip'), settingsBtn: $('settingsBtn'), muteBtn: $('muteBtn'),
        nav: $('nav'), game: $('game'), results: $('results'), typer: $('typer'), fx: $('fx'),
        dotPass: $('dotPass'), dotQuests: $('dotQuests'),
        playPreview: $('playPreview'), playDogName: $('playDogName'),
        menuLevel: $('menuLevel'), menuTitle: $('menuTitle'), menuXpFill: $('menuXpFill'), menuXpText: $('menuXpText'),
        themeBtn: $('themeBtn'), segMode: $('segMode'), segDiff: $('segDiff'), segCount: $('segCount'), diffHint: $('diffHint'), lenField: $('lenField'),
        ctaNote: $('ctaNote'), levelRing: $('levelRing'), todayBody: $('todayBody'),
        modeSelect: $('modeSelect'), timerStat: $('timerStat'), resTime: $('resTime'), themeSelect: $('themeSelect'),
        questTimer: $('questTimer'), segTopic: $('segTopic'), segTwist: $('segTwist'), topicField: $('topicField'), twistField: $('twistField'), gameTag: $('gameTag'), chaser: $('chaser'), weeklyList: $('weeklyList'), weeklyBonus: $('weeklyBonus'), weeklyTimer: $('weeklyTimer'), shopEvents: $('shopEvents'), shopGrid: $('shopGrid'), shopTimer: $('shopTimer'), shopSoon: $('shopSoon'), rewardText: $('rewardText'), rewardBtn: $('rewardBtn'), bestTimes: $('bestTimes'),
        difficultySelect: $('difficultySelect'), countSelect: $('countSelect'), startBtn: $('startBtn'),
        wardPreview: $('wardPreview'), catPills: $('catPills'), itemGrid: $('itemGrid'),
        passFill: $('passFill'), passTierLabel: $('passTierLabel'), passXpText: $('passXpText'), passTrack: $('passTrack'), claimAllBtn: $('claimAllBtn'),
        dailyStreak: $('dailyStreak'), questList: $('questList'), achGrid: $('achGrid'), achCount: $('achCount'),
        statTiles: $('statTiles'), historyChart: $('historyChart'),
        dogNameInput: $('dogNameInput'), textSizeSelect: $('textSizeSelect'), soundToggle: $('soundToggle'), stageToggle: $('stageToggle'), musicToggle: $('musicToggle'), keysToggle: $('keysToggle'), fxToggle: $('fxToggle'),
        customText: $('customText'), saveCustomBtn: $('saveCustomBtn'),
        saveNowBtn: $('saveNowBtn'), resetBtn: $('resetBtn'),
        wpmStat: $('wpmStat'), accStat: $('accStat'), mistakeStat: $('mistakeStat'), streakStat: $('streakStat'), comboStat: $('comboStat'), sentenceStat: $('sentenceStat'),
        progFill: $('progFill'), raceTrack: $('raceTrack'), raceCount: $('raceCount'), tapPrompt: $('tapPrompt'),
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
    const TAB_NAMES = ['play', 'news', 'wardrobe', 'shop', 'pass', 'boosts', 'quests', 'stats', 'settings'];
    let currentTab = 'play';
    let wardCat = 'coat';
    let tryOn = null;

    function showTab(name) {
        currentTab = name;
        tryOn = null; closeShopDlg();
        TAB_NAMES.forEach(t => $('tab-' + t).classList.toggle('hidden', t !== name));
        el.nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
        renderAll();
        el.settingsBtn.classList.toggle('active', name === 'settings');
        document.body.classList.toggle('wide-shop', name === 'shop');
        moveNavInd();
        window.scrollTo(0, 0);
    }

    function renderAll() {
        renderHeader();
        ({ play: renderPlay, news: renderNews, wardrobe: renderWardrobe, shop: renderShop, pass: renderPass, boosts: renderBoosts, quests: renderQuests, stats: renderStats, settings: renderSettings })[currentTab]();
        renderBoostBar();
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
        if (ind) ind.style.opacity = b ? '' : '0';
        if (!b || !ind || !b.offsetWidth) return;
        ind.style.width = b.offsetWidth + 'px';
        ind.style.transform = `translateX(${b.offsetLeft}px)`;
    }
    window.addEventListener('resize', moveNavInd);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveNavInd);

    function renderHeader() {
        setCount(el.bonesChip, '🦴 ', save.bones);
        setCount(el.levelChip, '', careerLevel());
        setCount(el.seasonChip, '', passTier());
        el.seasonChip.parentElement.classList.toggle('maxed', passTier() >= PASS_TIERS);
        el.settingsBtn.classList.toggle('active', currentTab === 'settings');
        el.muteBtn.textContent = save.muted ? '🔇' : '🔊';
    }

    function renderDots() {
        el.dotPass.classList.toggle('hidden', claimableTiers().length === 0);
        el.dotQuests.classList.toggle('hidden', !(save.daily.quests.some(q => questDone(q) && !q.c) || save.daily.reward !== dateStr() || save.weekly.quests.some(q => wDone(q) && !q.c)));
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
      <button type="button" class="strip-item" data-act="tab" data-tab="quests"><span>📜 Daily quests</span><b>${done}/${qs.length}${ready ? ' · claim!' : ''}</b></button>
      ${activeEvents().some(e => e.id === 'christmas') && save.giftDate !== dateStr() ? '<button type="button" class="strip-item hot" data-act="claimGift"><span>🎄 Christmas gift</span><b>Claim</b></button>' : ''}
      ${canReward
                ? '<button type="button" class="strip-item hot" data-act="claimDaily"><span>🎁 Daily reward</span><b>Claim</b></button>'
                : '<div class="strip-item off"><span>🎁 Daily reward</span><b>✓ Claimed</b></div>'}`;
    }

    function renderPlay() {
        const sig = JSON.stringify(save.equipped) + '|' + save.dogName;
        if (sig !== playSig) { playSig = sig; renderPreview(el.playPreview); }
        el.playDogName.textContent = save.dogName;
        const need = xpNeeded(save.level);
        el.menuLevel.textContent = save.level;
        el.levelRing.setAttribute('aria-label', 'Pup level ' + save.level);
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
        const mode = save.mode, ta = mode === 'timeattack', dailyDone = save.challenge.date === dateStr();
        el.countSelect.disabled = mode !== 'classic';
        el.segMode.innerHTML = segHTML([
            { v: 'classic', label: 'Classic' }, { v: 'timeattack', label: 'Time Attack' },
            { v: 'endless', label: '🐈 Endless Run' }, { v: 'daily', label: dailyDone ? '📅 Daily ✓' : '📅 Daily Challenge' }], mode);
        const dItems = Object.keys(DIFFS).map(k => ({ v: k, label: save.level < DIFFS[k].unlock ? `🔒 ${DIFF_NAMES[k]} · Lv ${DIFFS[k].unlock}` : DIFF_NAMES[k], disabled: save.level < DIFFS[k].unlock }));
        if (save.custom.length) dItems.push({ v: 'custom', label: DIFF_NAMES.custom });
        el.segDiff.innerHTML = segHTML(dItems, save.difficulty);
        el.segCount.innerHTML = segHTML([3, 5, 10].map(n => ({ v: String(n), label: String(n) })), String(save.count));
        if (!TOPICS[save.topic] || save.level < TOPICS[save.topic].unlock) save.topic = 'mixed';
        const nextLock = Object.keys(TOPICS).find(k => save.level < TOPICS[k].unlock);
        el.segTopic.innerHTML = segHTML(Object.keys(TOPICS).filter(k => save.level >= TOPICS[k].unlock || k === nextLock).map(k => {
            const lock = save.level < TOPICS[k].unlock;
            return { v: k, label: lock ? `🔒 ${TOPICS[k].name} · Lv ${TOPICS[k].unlock}` : `${TOPICS[k].icon} ${TOPICS[k].name}`, disabled: lock };
        }), save.topic);
        el.segTwist.innerHTML = segHTML([{ v: 'off', label: 'Off' }, { v: 'random', label: '🎲 Random twist' }], save.twist);
        el.lenField.classList.toggle('hidden', mode !== 'classic');
        el.topicField.classList.toggle('hidden', mode === 'daily');
        el.twistField.classList.toggle('hidden', mode === 'daily');
        const MODE_HINT = {
            classic: 'Classic: finish every sentence to reach the treat. ',
            timeattack: 'Time Attack: finish as many sentences as you can in 60 seconds. ',
            endless: 'Endless Run: a cat is chasing you! Keep typing to stay ahead. Mistakes let it catch up. How long can you last? ',
            daily: dailyDone ? 'Daily Challenge: you finished today\'s. Replay for fun (no reward). New one at 7:00 AM Mountain Time. ' : 'Daily Challenge: same sentences for everyone today, with a special twist. First finish today = big reward! '
        };
        const twNote = save.twist === 'random' && mode !== 'daily' ? ' · 🎲 Twist' : '';
        el.diffHint.textContent = MODE_HINT[mode] + (mode === 'daily' ? '' : (DIFF_HINTS[save.difficulty] || '')) + (save.twist === 'random' && mode !== 'daily' ? ' Twists change the rules a little for bigger rewards.' : '');
        const MODE_NAME = { classic: `Classic · ${save.count} sentences`, timeattack: 'Time Attack · 60 seconds', endless: 'Endless Run', daily: 'Daily Challenge' };
        el.ctaNote.textContent = `${MODE_NAME[mode]}${mode === 'daily' ? '' : ' · ' + (save.topic === 'mixed' ? DIFF_NAMES[save.difficulty] : TOPICS[save.topic].name)}${twNote}`;
        renderToday();
        renderNewsBox();
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

    // exclusive (code) and event cosmetics only count towards your collection once you own them
    const countable = cat => i => (i.src.type !== 'code' && i.src.type !== 'event') || isUnlocked(cat, i.id);

    function renderWardrobe() {
        const ov = tryOn ? { [tryOn.cat]: tryOn.id } : null;
        const tryItem = tryOn ? getItem(tryOn.cat, tryOn.id) : null;
        renderPreview(el.wardPreview, ov, tryItem ? `Trying on: ${tryItem.name}` : '');

        el.catPills.innerHTML = CAT_META.map(c => {
            const total = CATALOG[c.id].filter(countable(c.id)).length;
            const have = CATALOG[c.id].filter(i => isUnlocked(c.id, i.id)).length;
            return `<button class="pill ${c.id === wardCat ? 'active' : ''}" data-act="cat" data-cat="${c.id}">${c.icon} ${c.label} <small>${have}/${total}</small></button>`;
        }).join('');

        let lastRar = null;
        const wardList = CATALOG[wardCat]
            .map((it, i) => ({ it, i }))
            .filter(x => x.it.src.type !== 'event' || isUnlocked(wardCat, x.it.id) || (activeEvents().some(ev => ev.id === x.it.src.event) && itemDropped(x.it)))
            .sort((p, q) => (RARITIES[q.it.rarity].rank - RARITIES[p.it.rarity].rank) || (p.i - q.i))
            .map(x => x.it);
        el.itemGrid.innerHTML = wardList.map(it => {
            const hdr = it.rarity !== lastRar ? `<div class="rar-head" style="--rc:${rarColor(it)}"><span></span>${rarLabel(it.rarity)}</div>` : '';
            lastRar = it.rarity;
            const unlocked = isUnlocked(wardCat, it.id);
            const equipped = save.equipped[wardCat] === it.id;
            const trying = tryOn && tryOn.cat === wardCat && tryOn.id === it.id;
            let sub = '', btn = '';
            if (equipped) sub = '<span class="tag-eq">✓ Equipped</span>';
            else if (unlocked) btn = `<button class="small-btn" data-act="equip" data-cat="${wardCat}" data-id="${it.id}">Equip</button>`;
            else sub = srcLabel(it);
            return hdr + `<div class="item ${equipped ? 'equipped' : ''} ${unlocked ? '' : 'locked'} ${trying ? 'trying' : ''}" style="--rc:${rarColor(it)}" data-act="select" data-cat="${wardCat}" data-id="${it.id}">
        ${thumbHTML(wardCat, it)}
        <div class="item-name">${it.name}</div>
        <div class="item-sub">${sub}</div>
        ${btn}
      </div>`;
        }).join('');
    }

    function equip(cat, id) {
        if (!isUnlocked(cat, id)) return;
        closeShopDlg();
        save.equipped[cat] = id;
        tryOn = null;
        persist();
        sfx.equip();
        toast(`${getItem(cat, id).name} equipped!`, 'on');
        renderAll();
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
        el.passTierLabel.textContent = `Season Level ${tier} / ${PASS_TIERS}`;
        el.passTierLabel.classList.toggle('maxed', tier >= PASS_TIERS);
        el.passFill.style.width = (tier >= PASS_TIERS ? 100 : (inTier / PASS_XP) * 100) + '%';
        el.passXpText.textContent = tier >= PASS_TIERS ? 'Season complete! 🎉' : `${inTier} / ${PASS_XP} Pass XP to level ${tier + 1}`;
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
            else if (r.kind === 'token') { icon = tokenSVG(r.token); name = TOKENS[r.token].name; }
            else if (r.cat === 'coat') { icon = '🐕'; name = r.item.name + ' coat'; }
            else if (r.cat === 'scene') { icon = '🏞️'; name = r.item.name; }
            else { icon = r.item.icon; name = r.item.name; }
            html += `<div class="tier ${state} ${r.kind === 'item' || r.kind === 'token' ? 'big' : ''}">
        <span class="tnum">Level ${t}</span>
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
        el.rewardText.innerHTML = `<b>🎁 Daily reward</b><small>${canClaim ? `${dailyRewardAmount()} 🦴 + 20 Pass XP` : 'Claimed. Next one at 7:00 AM Mountain Time.'}</small>`;
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

        const wq = save.weekly.quests;
        el.weeklyList.innerHTML = wq.map((q, idx) => {
            const def = WEEKLY_POOL[q.i];
            const done = wDone(q);
            const pct = Math.min(100, (q.p / def.target) * 100);
            return `<div class="quest weekly ${q.c ? 'claimed' : done ? 'done' : ''}">
        <div>
          <div class="quest-text">${def.text}</div>
          <div class="minibar"><div style="width:${pct}%"></div></div>
          <div class="quest-reward">${Math.min(q.p, def.target).toLocaleString()} / ${def.target.toLocaleString()} · Reward: ${def.bones} 🦴 + ${def.pxp} Pass XP</div>
        </div>
        ${q.c ? '<span class="tag-eq">✓ Claimed</span>' : done ? `<button class="small-btn" data-act="claimWeekly" data-q="${idx}">Claim</button>` : '<span class="muted">…</span>'}
      </div>`;
        }).join('');
        el.weeklyBonus.innerHTML = save.weekly.bonus
            ? `<span class="tag-eq">✓ Bonus claimed</span> You got a ${TOKENS[WEEKLY_BONUS_TOKEN].name} this week.`
            : `<span class="wb-ic">${tokenSVG(WEEKLY_BONUS_TOKEN)}</span> Finish all 3 for a bonus ${TOKENS[WEEKLY_BONUS_TOKEN].name}`;

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
    function claimGift() {
        if (save.giftDate === dateStr() || !activeEvents().some(e => e.id === 'christmas')) return;
        save.giftDate = dateStr();
        const tok = pick(['xp2', 'bones2', 'pass2']);
        save.bones += 150; save.tokens[tok] += 1; addPass(30);
        checkAchievements(true);
        persist(); sfx.unlock && sfx.unlock();
        toast(`Christmas gift! +150 🦴 +30 Pass XP + ${TOKENS[tok].name}`, 'good');
        renderAll();
    }
    function fmtCountdown(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 3600)}h ${pad2(Math.floor(s % 3600 / 60))}m ${pad2(s % 60)}s`; }
    function fmtLong2(ms) {
        const s = Math.max(0, Math.ceil(ms / 1000)), d = Math.floor(s / 86400);
        return d ? `${d}d ${Math.floor(s % 86400 / 3600)}h ${pad2(Math.floor(s % 3600 / 60))}m` : fmtCountdown(ms);
    }
    let shopSig = '';
    function tickTimers() {
        document.querySelectorAll('.cd[data-cd]').forEach(n => { n.textContent = fmtDHMS(+n.dataset.cd - tnow()); });
        if (!['quests', 'play', 'shop'].includes(currentTab)) return;
        const left = fmtCountdown(msToReset());
        if (currentTab === 'quests') {
            el.questTimer.textContent = '⏳ New quests & reward in ' + left;
            el.weeklyTimer.textContent = '⏳ New weekly quests in ' + fmtLong2(msToWeekReset());
        } else if (currentTab === 'shop') {
            el.shopTimer.textContent = '⏳ Shop refreshes in ' + left;
            document.querySelectorAll('[data-evleft]').forEach(n => { const ev = EVENTS.find(e => e.id === n.dataset.evleft); if (ev) n.textContent = 'Leaves in ' + fmtLong2(frameToMs(eventWindow(ev).end) - tnow()); });
            if (shopSig !== shopSignature()) renderShop();
        } else { const t = document.getElementById('todayTimer'); if (t) t.textContent = '⏳ New quests in ' + left; }
        if (save.daily.date !== dateStr() || save.weekly.week !== weekStr()) { ensureDaily(); ({ quests: renderQuests, play: renderPlay, shop: renderShop })[currentTab](); renderDots(); }
    }
    setInterval(tickTimers, 1000);

    /* =====================================================
       NEWS: Fortnite-style story carousel (lobby box + News tab)
    ===================================================== */
    function xmasTarget() {
        const ev = EVENTS.find(e => e.id === 'christmas'), now = gnow(), w = eventWindow(ev, now);
        if (now < w.start) return { state: 'soon', at: w.start };
        if (now < w.end) return { state: 'live', at: w.end };
        return { state: 'next', at: eventWindow(ev, new Date(now.getFullYear() + 1, 0, 1)).start };
    }
    const fmtDHMS = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 86400)}d ${pad2(Math.floor(s % 86400 / 3600))}h ${pad2(Math.floor(s % 3600 / 60))}m ${pad2(s % 60)}s`; };
    function newsItems() {
        const x = xmasTarget(), live = x.state === 'live';
        return [
            {
                id: 'xmas', icon: '🎄', c1: '#d32f2f', c2: '#1b6b3a', cd: frameToMs(x.at),
                tag: live ? 'LIVE NOW' : 'COMING SOON', title: 'Christmas Update',
                cdLabel: live ? 'Christmas leaves in' : x.state === 'soon' ? 'Starts in' : 'Back next year in',
                sub: live ? 'The holiday event is here!' : 'Starts November 28, 12:00 AM Mountain Time',
                bullets: live
                    ? ['🎅 A free gift every day you log in', '🛍️ Christmas Pup Shop is open', '🎫 Paw Pass Season 1: Frostbite']
                    : ['🎫 Paw Pass Season 1: Frostbite', '🛍️ New Christmas items every few days', '🎅 Free rewards when you log in during Christmas']
            },
            {
                id: 's0', icon: '🏡', c1: '#2f7ae5', c2: '#7c4dff', tag: 'SEASON 0', title: 'Backyard Bash',
                sub: 'The pre-season: 25 levels of bones and boosts', cdLabel: '',
                bullets: ['🦴 15 bone levels', '⚡ 10 boost levels', '🔥 Reach level 25 for a fire effect']
            },
            {
                id: 'play', icon: '🐈', c1: '#ff7a1a', c2: '#e8430f', tag: 'NEW', title: 'New ways to play',
                sub: 'Endless Run, Daily Challenge and more', cdLabel: '',
                bullets: ['🐈 Endless Run: outrun the cat', '📅 Daily Challenge with a twist', '🌟 Golden words and 8 topic packs']
            },
            {
                id: 'shop', icon: '🛍️', c1: '#a05cff', c2: '#ff4fa3', tag: 'UPDATED', title: 'Pup Shop',
                sub: 'New items every day at 7:00 AM Mountain Time', cdLabel: '',
                bullets: ['🛍️ 8 fresh items daily', '💎 Rarer items cost more', '🎉 Rarity reveal when you buy']
            }
        ];
    }
    let newsIdx = 0, newsTick = Date.now(), newsHover = false;
    const NEWS_MS = 7000;
    function renderNewsBox() {
        const box = document.getElementById('newsBox'); if (!box) return;
        const items = newsItems(), n = items[newsIdx % items.length];
        box.style.setProperty('--c1', n.c1); box.style.setProperty('--c2', n.c2);
        box.dataset.n = newsIdx % items.length;
        box.innerHTML = `<div class="nb-ic">${n.icon}</div>
      <div class="nb-main"><span class="nb-tag">${n.tag}</span><b>${n.title}</b><span class="nb-sub">${n.sub}</span>
        <div class="nb-chips">${n.bullets.map(b => `<span>${b}</span>`).join('')}</div></div>
      ${n.cd ? `<div class="nb-count"><small>${n.cdLabel}</small><b class="cd" data-cd="${n.cd}">${fmtDHMS(n.cd - tnow())}</b></div>` : ''}
      <div class="nb-dots">${items.map((_, i) => `<i class="${i === newsIdx % items.length ? 'on' : ''}"></i>`).join('')}</div>`;
    }
    function renderNews() {
        const items = newsItems(), i = newsIdx % items.length, n = items[i];
        document.getElementById('newsHero').style.cssText = `--c1:${n.c1};--c2:${n.c2}`;
        document.getElementById('newsHero').innerHTML = `
      <div class="nh-art">${n.icon}</div>
      <div class="nh-body"><span class="nb-tag">${n.tag}</span><h2>${n.title}</h2><p>${n.sub}</p>
        <ul>${n.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
        ${n.cd ? `<div class="nh-count"><small>${n.cdLabel}</small><b class="cd" data-cd="${n.cd}">${fmtDHMS(n.cd - tnow())}</b></div>` : ''}
      </div>`;
        document.getElementById('newsList').innerHTML = items.map((it, k) => `
      <button type="button" class="news-item ${k === i ? 'on' : ''}" style="--c1:${it.c1};--c2:${it.c2}" data-act="newsPick" data-n="${k}" role="tab" aria-selected="${k === i}">
        <span class="ni-ic">${it.icon}</span><span class="ni-t"><b>${it.title}</b><small>${it.sub}</small></span>
        <span class="ni-bar"><i style="animation-duration:${NEWS_MS}ms"></i></span>
      </button>`).join('');
    }
    setInterval(() => {
        if (newsHover || document.hidden || !['play', 'news'].includes(currentTab)) return;
        if (Date.now() - newsTick < NEWS_MS - 200) return;
        newsTick = Date.now(); newsIdx = (newsIdx + 1) % newsItems().length;
        renderNewsBox(); if (currentTab === 'news') renderNews();
    }, 500);
    document.addEventListener('mouseover', e => { newsHover = !!e.target.closest('#newsBox, #newsHero, #newsList'); });

    /* =====================================================
       SHOP: daily rotation (7:00 AM) + event shops
    ===================================================== */
    const SHOP_SLOTS = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'rare', 'epic', 'legendary'];
    const allItems = () => CATS.flatMap(cat => CATALOG[cat].map(it => ({ cat, it })));
    function eventWindow(ev, now = gnow()) {
        const y = now.getFullYear();
        return { start: new Date(y, ev.start[0] - 1, ev.start[1]), end: new Date(y, ev.end[0] - 1, ev.end[1] + 1) };   // end = midnight after the last day (11:59 PM that day)
    }
    const activeEvents = (now = gnow()) => EVENTS.filter(ev => { const w = eventWindow(ev, now); return now >= w.start && now < w.end; });
    function nextEvent(now = gnow()) {
        let best = null;
        EVENTS.forEach(ev => {
            [0, 1].forEach(add => {
                const w = eventWindow(ev, new Date(now.getFullYear() + add, 0, 1));
                if (w.start > now && (!best || w.start < best.start)) best = { ev, start: w.start };
            });
        });
        return best;
    }
    function dailyShop() {
        const day = dateStr();
        let h = 11;
        for (const ch of day) h = (h * 33 + ch.charCodeAt(0)) | 0;
        const rnd = mulberry(h);
        const base = allItems().filter(x => x.it.src.type === 'bones');
        const used = new Set(), out = [];
        SHOP_SLOTS.forEach(rar => {
            let pool = base.filter(x => x.it.rarity === rar && !used.has(x.it.id + x.cat));
            if (!pool.length) pool = base.filter(x => !used.has(x.it.id + x.cat));
            if (!pool.length) return;
            const x = pool[Math.floor(rnd() * pool.length)];
            used.add(x.it.id + x.cat); out.push(x);
        });
        // Mythic spotlight: the Labrador shows up as an extra card about 1 day in 3 (change MYTHIC_CHANCE to tune)
        const MYTHIC_CHANCE = 1 / 3;
        if (rnd() < MYTHIC_CHANCE) { const m = base.find(x => x.it.rarity === 'mythic'); if (m) out.push(m); }
        return out;
    }
    // Christmas cosmetics are released one by one (see CHRISTMAS_DROPS in data.js)
    function itemDropped(it) {
        if (it.event !== 'christmas') return true;
        if (!it.drop) return false;
        const now = gnow(), ev = EVENTS.find(e => e.id === 'christmas'), w = eventWindow(ev, now);
        return now >= new Date(w.start.getFullYear(), it.drop[0] - 1, it.drop[1]);
    }
    const eventStock = ev => allItems().filter(x => x.it.src.type === 'event' && x.it.src.event === ev.id && itemDropped(x.it));
    const shopSignature = () => dateStr() + '|' + activeEvents().map(e => e.id).join(',');
    function inShop(cat, id) {
        if (dailyShop().some(x => x.cat === cat && x.it.id === id)) return true;
        return activeEvents().some(ev => eventStock(ev).some(x => x.cat === cat && x.it.id === id));
    }
    function shopCard(x, allowBig) {
        const { cat, it } = x, own = isUnlocked(cat, it.id), price = shopPrice(it);
        const big = allowBig && (it.rarity === 'epic' || it.rarity === 'legendary' || it.rarity === 'mythic');
        return `<button type="button" class="scard ${big ? 'big' : ''} ${own ? 'owned' : ''}" style="--rc:${rarColor(it)}" data-act="shopSelect" data-cat="${cat}" data-id="${it.id}">
      <span class="sart">${thumbHTML(cat, it)}</span>
      <span class="sname"><b>${it.name}</b><small>${rarLabel(it.rarity)} · ${CAT_META.find(c => c.id === cat).label}</small></span>
      <span class="sprice">${own ? '✓ Owned' : '🦴 ' + price}</span>
    </button>`;
    }
    function renderShop() {
        ensureDaily();
        shopSig = shopSignature();
        const act = activeEvents();
        el.shopEvents.innerHTML = act.map(ev => `
      <div class="shop-sec event-sec" style="--e1:${ev.colors[0]};--e2:${ev.colors[1]}">
        <div class="shop-bar event-bar"><h2><span class="event-ic">${ev.icon}</span> ${ev.name.replace(' Shop', '')}</h2><span class="timer-chip" data-evleft="${ev.id}"></span></div>
        <div class="shop-grid">${eventStock(ev).map(x => shopCard(x, false)).join('')}</div>
      </div>`).join('');
        el.shopGrid.innerHTML = dailyShop().sort((p, q) => RARITIES[q.it.rarity].rank - RARITIES[p.it.rarity].rank).map(x => shopCard(x, true)).join('');
        const nx = nextEvent();
        el.shopSoon.innerHTML = nx && !act.length
            ? `<div class="soon-card"><span class="event-ic">${nx.ev.icon}</span><div><b>${nx.ev.name.replace(' Shop', '')} is coming</b><small>Opens ${nx.start.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} · in <span class="cd" data-cd="${frameToMs(nx.start)}">${fmtDHMS(frameToMs(nx.start) - tnow())}</span></small></div></div>`
            : '';
        tickTimers();
    }
    /* purchase window: try the item on, then buy it */
    function closeShopDlg() { const d = document.getElementById('shopDlg'); if (d) d.remove(); }
    function shopSelect(cat, id) {
        const it = getItem(cat, id);
        if (!it) return;
        closeShopDlg();
        const own = isUnlocked(cat, id), price = shopPrice(it);
        const dlg = document.createElement('div');
        dlg.className = 'dlg'; dlg.id = 'shopDlg';
        dlg.innerHTML = `<div class="dlg-card shop-dlg" style="--rc:${rarColor(it)}" role="dialog" aria-label="${it.name}">
      <div id="shopDlgPrev" class="preview-stage"></div>
      <div class="sd-info"><h2>${it.name}</h2>${rarTag(it)}</div>
      <div class="row">
        ${own ? (save.equipped[cat] === id ? '<span class="tag-eq">✓ Equipped</span>' : `<button class="big-btn" data-act="equip" data-cat="${cat}" data-id="${id}">Equip</button>`)
                : `<button class="big-btn ${save.bones < price ? 'poor' : ''}" data-act="shopBuy" data-cat="${cat}" data-id="${id}">Buy for 🦴 ${price}</button>`}
        <button class="small-btn ghost" data-act="shopClose">Close</button>
      </div>
    </div>`;
        dlg.addEventListener('click', e => { if (e.target === dlg) closeShopDlg(); });
        document.body.appendChild(dlg);
        renderPreview(document.getElementById('shopDlgPrev'), { [cat]: id });
        sfx.pop();
    }
    function showReveal(cat, it) {
        closeShopDlg();
        const dlg = document.createElement('div');
        dlg.className = 'dlg reveal'; dlg.id = 'shopDlg';
        dlg.innerHTML = `<div class="reveal-card" style="--rc:${rarColor(it)}">
      <div class="reveal-rays"></div>
      <div class="reveal-tag">${rarLabel(it.rarity)}</div>
      <div class="reveal-art">${thumbHTML(cat, it)}</div>
      <h2>${it.name}</h2>
      <p>Added to your Wardrobe and equipped!</p>
      <button class="big-btn" data-act="shopClose">Nice!</button>
    </div>`;
        dlg.addEventListener('click', e => { if (e.target === dlg) closeShopDlg(); });
        document.body.appendChild(dlg);
        sfx.fanfare && sfx.fanfare();
        burst(innerWidth / 2, innerHeight / 2, { n: 28, spread: 260, size: 22, lift: 40, icons: ['✨', '⭐', '🦴', '🎉'] });
    }
    function shopBuy(cat, id) {
        const it = getItem(cat, id);
        if (!it || isUnlocked(cat, id)) return;
        if (!inShop(cat, id)) { toast('That item has left the Shop.', 'warn'); renderShop(); return; }
        const price = shopPrice(it);
        if (save.bones < price) {
            toast(`Not enough bones: you need ${price - save.bones} more 🦴`, 'warn'); sfx.error();
            return;
        }
        save.bones -= price;
        save.owned[cat].push(id);
        save.equipped[cat] = id;
        save.shopBuys++;

        closeShopDlg();
        checkAchievements(true);
        persist();
        sfx.buy();
        toast(`Bought ${it.name}!`, 'good');
        renderAll();
        showReveal(cat, it);
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
    function renderProfile() {
        const box = document.getElementById('profileCard');
        if (!box) return;
        const name = acct.username || (acct.user ? (acct.user.email || 'Player').split('@')[0] : 'Guest');
        const earned = BADGES.filter(b => save.badges.includes(b.id));
        const showcase = earned.length
            ? earned.slice(0, 8).map(b => `<button class="badge-big" data-act="badge" data-id="${b.id}" title="${b.name}">${badgeSVG(b.id)}</button>`).join('')
            : '';
        const cats = BADGE_CATEGORIES.map(c => {
            const list = BADGES.filter(b => b.cat === c.id);
            const have = list.filter(b => save.badges.includes(b.id)).length;
            return `<div class="badge-cat"><div class="badge-cat-h"><h3 class="sub-h">${c.label}</h3><small>${have}/${list.length}</small></div>
        <div class="badge-grid">${list.map(b => {
                const got = save.badges.includes(b.id);
                return `<button class="badge-tile ${got ? 'got' : 'locked'}" data-act="badge" data-id="${b.id}">
            <span class="badge-art">${badgeSVG(b.id)}</span><b>${b.name}</b><small>${got ? b.desc : b.how}</small></button>`;
            }).join('')}</div></div>`;
        }).join('');
        box.innerHTML = `<div class="prof-head"><span class="prof-av">${name.charAt(0).toUpperCase()}</span>
        <div><h2>${name}</h2><small class="muted">Career ${careerLevel()} · Pup level ${save.level} · ${earned.length} badge${earned.length === 1 ? '' : 's'}</small></div></div>
      ${showcase ? `<div class="badge-show">${showcase}</div>` : ''}${cats}`;
    }
    function renderStats() {
        renderProfile();
        const allItems = CATS.reduce((n, c) => n + CATALOG[c].filter(countable(c)).length, 0);
        const haveItems = CATS.reduce((n, c) => n + CATALOG[c].filter(i => isUnlocked(c, i.id)).length, 0);
        const avg = save.history.length ? Math.round(save.history.reduce((a, h) => a + h.wpm, 0) / save.history.length) : 0;
        const tiles = [
            ['Best WPM', save.bestWpm], ['Average WPM', avg], ['Best accuracy', save.bestAcc + '%'],
            ['Rounds played', save.games], ['Perfect rounds', save.perfects], ['Longest streak', save.maxStreak],
            ['Items unlocked', haveItems + '/' + allItems], ['Time played', fmtLong(save.totalTime)]
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
        el.stageToggle.textContent = save.stage ? 'On' : 'Off';
        el.keysToggle.textContent = save.keySounds ? 'On' : 'Off';
        [el.soundToggle, el.musicToggle, el.keysToggle, el.fxToggle, el.stageToggle].forEach(b => b.classList.toggle('is-off', b.textContent === 'Off'));
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

    function withSeed(seed, fn) {
        const orig = Math.random, r = mulberry(seed);
        Math.random = r;
        try { return fn(); } finally { Math.random = orig; }
    }
    const seedOf = str => { let h = 7; for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; };
    function topicSentences(topic, n) {
        const out = [];
        let pool = [];
        while (out.length < n) {
            if (!pool.length) pool = shuffle(TOPIC_TEXT[topic].slice());
            out.push(pool.pop());
        }
        return out;
    }
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
        if (save.topic !== 'mixed' && TOPIC_TEXT[save.topic]) return topicSentences(save.topic, n);
        return D.generateSentences(save.difficulty, n);
    }

    const TA_SECONDS = 60;
    function startGame(opts) {
        const raceOpts = opts && opts.race ? opts.race : null;
        // Focus the hidden input RIGHT HERE (inside the tap) so phones open the keyboard
        ensureAudio();
        AUD.intensity(0); AUD.mood('game');
        try { el.typer.value = ''; el.typer.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        composed = 0;
        ensureDaily();

        const mode = raceOpts ? 'race' : save.mode;
        const ta = mode === 'timeattack' ? TA_SECONDS : 0;
        const day = dateStr();
        let sentences, twist = 'off';
        if (raceOpts) {
            sentences = raceOpts.sentences;
        } else if (mode === 'daily') {
            const seed = seedOf('daily' + day);
            sentences = withSeed(seed, () => D.generateSentences('hard', 5));
            twist = TWIST_IDS[Math.abs(seed) % TWIST_IDS.length];
        } else {
            sentences = getSentences(ta ? 4 : mode === 'endless' ? 3 : save.count);
            if (save.twist === 'random') twist = pick(TWIST_IDS);
        }
        g = {
            mode, endless: mode === 'endless', daily: mode === 'daily', dailyReward: mode === 'daily' && save.challenge.date !== day,
            race: !!raceOpts, locked: !!raceOpts, raceDiff: raceOpts ? raceOpts.diff : '',
            twist, golds: 0, gap: 1, caught: false,
            ta, sentences, idx: 0, pos: 0, chars: [], words: [], charWord: [],
            correct: 0, mistakes: 0, streak: 0, bestStreak: 0, combo: 0, bestCombo: 0, wordErr: false,
            startTime: null, stamps: [], active: true, doneChars: 0,
            totalChars: sentences.reduce((n, s) => n + s.length, 0)
        };

        el.raceTrack.classList.add('hidden'); el.raceCount.classList.add('hidden');
        el.nav.classList.add('hidden');
        TAB_NAMES.forEach(t => $('tab-' + t).classList.add('hidden'));
        el.results.classList.add('hidden');
        el.game.classList.remove('hidden');
        document.body.classList.add('playing');
        applyPrefs();
        el.game.classList.remove('fever');
        el.tapPrompt.classList.add('hidden');
        el.cheer.classList.add('hidden');
        el.hearts.innerHTML = '';
        el.trail.innerHTML = '';
        el.progFill.style.width = '0%';
        el.timerStat.textContent = fmtClock(ta || 0);
        el.treat.classList.remove('eaten');
        ['tw-fog', 'tw-ghost', 'tw-nomercy', 'tw-goldrush', 'danger'].forEach(c => el.game.classList.remove(c));
        if (twist !== 'off') el.game.classList.add('tw-' + twist);
        const tags = [];
        if (g.endless) tags.push('🐈 Endless Run');
        if (g.daily) tags.push('📅 Daily');
        if (g.race) tags.push('🏁 Race');
        if (twist !== 'off') tags.push(`${TWISTS[twist].icon} ${TWISTS[twist].name}`);
        el.gameTag.classList.toggle('hidden', !tags.length);
        el.gameTag.textContent = tags.join(' · ');
        el.gameTag.title = twist !== 'off' ? TWISTS[twist].desc : g.endless ? 'Stay ahead of the cat!' : '';
        el.chaser.classList.toggle('hidden', !g.endless);
        el.chaser.style.transform = 'translateX(-200px)';
        if (g.endless) el.progFill.style.width = '100%';

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
        el.speedLabel.textContent = g.endless ? 'Start typing! A cat is coming... 🐈' : 'Start typing to wake up your pup! 😴';
        if (twist !== 'off') toast(`${TWISTS[twist].icon} ${TWISTS[twist].name}: ${TWISTS[twist].desc}`, 'info');

        animOn = true;
        A.last = performance.now();
        requestAnimationFrame(loop);
        if (g.race) raceCountdown();
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
        let goldCount = 0;
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
            const gold = wi > 0 && w.replace(/[^a-z]/gi, '').length >= 4 && goldCount < 2 && Math.random() < (g.twist === 'goldrush' ? 0.5 : 0.12);
            if (gold) { goldCount++; wEl.classList.add('golden'); }
            g.words.push({ el: wEl, start, end: g.chars.length - 1, gold });
            el.sentenceBox.appendChild(wEl);
        });
        g.chars[0].classList.add('current');
        markWord();
    }
    function markWord() {
        const w = g.words[g.charWord[Math.min(g.pos, g.chars.length - 1)]];
        if (g.curW === w) return;
        if (g.curW) g.curW.el.classList.remove('curw');
        g.curW = w; if (w) w.el.classList.add('curw');
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
        if (!g || !g.active || g.locked) { el.typer.value = ''; composed = 0; return; }
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
        if (g.locked) return;
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
        if (g.locked) return;
        const now = performance.now();
        if (g.startTime === null) g.startTime = now;

        const s = g.sentences[g.idx];
        const idx = g.pos;

        if (ch === s[idx]) {
            const c = g.chars[idx];
            c.classList.remove('current', 'wrong');
            c.classList.add('correct');
            g.pos++; g.correct++; g.streak++;
            if (g.endless) g.gap = Math.min(1, g.gap + 0.02);
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
                if (g.endless) { g.gap = Math.min(1, g.gap + 0.12); if (g.idx >= g.sentences.length - 1) g.sentences.push(...getSentences(3)); }
                sentenceFx();
                renderSentence();
            } else {
                g.chars[g.pos].classList.add('current');
                markWord();
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
            if (g.combo > 0) { g.combo = 0; AUD.intensity(0); el.game.classList.remove('fever'); }
            if (g.endless) g.gap -= 0.07;
            if (g.twist === 'nomercy') { g.wordErr = false; setTimeout(() => { if (g && g.active && g.sentences[g.idx] === s && g.pos === idx) renderSentence(); }, 260); }
        }
        if (g.endless) { A.tx = 0.55; } else if (!g.ta) {
            const p = (g.doneChars + g.pos) / g.totalChars;
            A.tx = p;                                   // only ever moves forward
            el.progFill.style.width = (p * 100).toFixed(1) + '%';
            if (g.race) raceProgress(p);
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
        el.game.classList.toggle('fever', g.combo >= 10);
        AUD.intensity(g.combo >= 8 ? 2 : g.combo >= 3 ? 1 : 0);
        A.hop = Math.max(A.hop, perfect ? 0.7 : 0.4);
        if (w.gold) {
            if (perfect) {
                g.golds++; g.combo += 2; g.bestCombo = Math.max(g.bestCombo, g.combo);
                sfx.unlock && sfx.unlock();
                burstAt(w.el, { n: 14, size: 20, spread: 110, lift: 30, icons: ['🌟', '🦴', '✨'] });
                el.cheer.textContent = '🌟 Golden word! +4 🦴';
                el.cheer.classList.remove('hidden');
                el.cheer.style.animation = 'none'; void el.cheer.offsetWidth; el.cheer.style.animation = '';
                clearTimeout(g.cheerT);
                g.cheerT = setTimeout(() => el.cheer.classList.add('hidden'), 1000);
            } else w.el.classList.add('gold-missed');
        }
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
        el.sentenceStat.textContent = (g.ta || g.endless) ? `${g.idx} ✓` : `${Math.min(g.idx + 1, g.sentences.length)}/${g.sentences.length}`;
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
        if (g && g.active && g.endless && g.startTime) {
            const tsec = (performance.now() - g.startTime) / 1000;
            g.gap -= (0.05 + 0.07 * Math.min(1, g.idx / 25) + Math.min(0.03, tsec / 3000)) * dt;
            if (g.gap <= 0) { g.gap = 0; g.caught = true; finishGame('caught'); }
            el.progFill.style.width = (Math.max(0, g.gap) * 100).toFixed(1) + '%';
            el.progFill.classList.toggle('low', g.gap < 0.35);
            el.game.classList.toggle('danger', g.gap < 0.3 && !g.caught);
            const sw = el.scene.clientWidth;
            el.chaser.style.transform = `translateX(${(A.x * A.maxX - 40 - g.gap * sw * 0.7).toFixed(1)}px)`;
            el.chaser.style.setProperty('--run', Math.sin(A.t * 14).toFixed(2));
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
    function finishGame(reason) {
        g.active = false;
        el.game.classList.remove('danger');
        el.typer.blur();                       // closes the phone keyboard so the results are visible
        el.tapPrompt.classList.add('hidden');
        const elapsed = g.ta ? g.ta : Math.max(1, (performance.now() - g.startTime) / 1000);
        const res = {
            time: elapsed, ta: g.ta, sentences: g.idx, mode: g.mode, endless: g.endless, daily: g.daily, dailyReward: g.dailyReward, caught: !!g.caught,
            twist: g.twist, golds: g.golds, topic: g.race ? 'mixed' : save.topic, race: g.race, diff: g.raceDiff,
            correct: g.correct, mistakes: g.mistakes, bestStreak: g.bestStreak, bestCombo: g.bestCombo,
            wpm: Math.round((g.correct / 5) / (elapsed / 60)), acc: currentAcc()
        };
        updateStats();
        if (g.race) raceFinish(res);

        if (reason === 'caught') {
            A.happy = false;
            el.cheer.textContent = `The cat got ${save.dogName}! 🐈`;
            el.speedLabel.textContent = `Caught after ${g.idx} sentence${g.idx === 1 ? '' : 's'}!`;
            sfx.wrong();
        } else {
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
        }
        el.cheer.classList.remove('hidden');
        AUD.intensity(0);
        vibrate([40, 40, 80]);
        setTimeout(() => { if (animOn) { if (res.race) raceShowResults(res); else showResults(res); } }, 2300);
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
        const DK = res.race ? res.diff : save.difficulty;   // multiplayer rounds use the room's difficulty
        let mult = diffInfo(DK).mult;
        if (res.twist && res.twist !== 'off') mult *= TWISTS[res.twist].mult;
        const accMult = res.acc >= 98 ? 2 : res.acc >= 95 ? 1.6 : res.acc >= 90 ? 1.3 : res.acc >= 80 ? 1 : 0.5;
        const stars = res.acc >= 97 ? 3 : res.acc >= 90 ? 2 : 1;
        const perfect = res.mistakes === 0;
        let xpGain = Math.round((res.correct * accMult * 0.5 + res.wpm) * mult);
        let bones = Math.round(res.correct * 0.1 * mult) + stars * 5 + (perfect ? 15 : 0);
        const passGain = 20 + Math.round(res.correct * 0.2) + stars * 5 + (perfect ? 10 : 0) + (res.daily && res.dailyReward ? 80 : 0);
        const notes = [];
        if (res.twist && res.twist !== 'off') notes.push(`${TWISTS[res.twist].icon} ${TWISTS[res.twist].name} twist: x${TWISTS[res.twist].mult} rewards`);
        if (res.golds) { bones += res.golds * 4; notes.push(`🌟 ${res.golds} golden word${res.golds === 1 ? '' : 's'}: +${res.golds * 4} 🦴`); }
        if (res.endless) { bones += res.sentences * 4; notes.push(`🐈 Survived ${res.sentences} sentence${res.sentences === 1 ? '' : 's'}: +${res.sentences * 4} 🦴`); }
        if (res.daily && res.dailyReward && !res.caught) { bones += 100; notes.push('📅 Daily Challenge complete: +100 🦴 +80 Pass XP'); }
        if (boostActive('xp2')) { xpGain *= 2; notes.push('⚡ 2x XP boost: your XP was doubled!'); }
        if (boostActive('bones2')) { bones *= 2; notes.push('🦴 2x Bones boost: your bones were doubled!'); }
        if (boostActive('pass2')) notes.push('🎟️ 2x Pass XP boost: your Paw Pass XP was doubled!');

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
        if (isTough(DK)) save.hardRounds++;
        save.totalTime += Math.round(res.time);
        save.bestCombo = Math.max(save.bestCombo, res.bestCombo);
        if (!save.diffsPlayed.includes(DK)) save.diffsPlayed.push(DK);
        if (DK === 'custom') save.customRounds++;
        const hr = new Date().getHours();
        if (hr < 5) save.nightRounds++; else if (hr < 8) save.morningRounds++;
        if (res.twist && res.twist !== 'off') save.twistRounds++;
        save.goldTotal += res.golds || 0;
        if (!res.daily && !save.topicsPlayed.includes(res.topic)) save.topicsPlayed.push(res.topic);
        if (res.daily && res.dailyReward) { save.challenge.date = dateStr(); save.dailyWins++; }
        let bestTime = 0, newBest = false;
        if (res.endless) {
            if (res.sentences > save.endlessBest) { save.endlessBest = res.sentences; if (res.sentences > 0) notes.push(`🏃 New Endless Run record: ${res.sentences} sentences!`); }
        } else if (res.ta) {
            save.taRounds++;
            if (res.sentences > save.taBest) { save.taBest = res.sentences; if (res.sentences > 0) notes.push(`⏱️ New Time Attack record: ${res.sentences} sentences!`); }
        } else if (!res.daily && !res.race) {
            const key = `${save.difficulty}-${save.count}`;
            const prev = save.bestTimes[key];
            bestTime = prev || res.time;
            if (!prev || res.time < prev) { save.bestTimes[key] = Math.round(res.time * 10) / 10; bestTime = save.bestTimes[key]; newBest = !!prev || true; notes.push('🏁 New best time for this round type!'); }
            if (save.count >= 5 && res.time <= 25 && res.acc >= 90) save.quickRound = 1;
        }
        save.history.push({ wpm: res.wpm, acc: res.acc, diff: DK });
        save.history = save.history.slice(-20);

        if (save.level > fromLevel) {
            notes.push(`🎊 PUP LEVEL UP! Level ${save.level} – ${titleFor(save.level)}`);
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
        el.resTitle.textContent = res.endless ? `Survived ${res.sentences}! 🐈` : a.stars === 3 ? 'Perfect Pup! 🏆' : a.stars === 2 ? 'Great job! 🎉' : 'Good dog! 🐶';
        el.resStars.textContent = '⭐'.repeat(a.stars) + '☆'.repeat(3 - a.stars);
        el.resMessage.textContent = res.endless ? `The cat caught ${save.dogName} this time. Go again!` : res.daily ? (res.dailyReward ? 'Daily Challenge done!' : 'Daily Challenge replay (no reward).') : `${save.dogName} got a treat!`;
        el.resTime.textContent = res.endless ? `🏃 Endless Run · ${fmtTime(res.time)} · best ${save.endlessBest} sentences` : res.ta
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
        el.resXpText.textContent = `Pup level ${save.level}: ${save.xp} / ${need} XP`;
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
        const wasRace = !!(g && g.race && race.inRace);
        AUD.mood('menu'); AUD.intensity(0);
        animOn = false;
        if (g) g.active = false;
        el.typer.blur();
        el.game.classList.add('hidden');
        el.game.style.height = '';
        el.game.style.transform = '';
        el.results.classList.add('hidden');
        document.body.classList.remove('playing');
        el.game.classList.remove('fever');
        applyPrefs();
        el.nav.classList.remove('hidden');
        showTab(tab || 'play');
        announceBadges();
        if (wasRace) raceQuit();
    }

    /* =====================================================
       EVENTS
    ===================================================== */
    document.addEventListener('click', e => {
        const t = e.target.closest('[data-act]');
        if (!t) return;
        const d = t.dataset;
        switch (d.act) {
            case 'signIn': doSignIn(); break;
            case 'signOut': doSignOut(); break;
            case 'pickName': askUsername(); break;
            case 'goSettings': showTab('settings'); break;
            case 'useToken': activateToken(d.id); break;
            case 'equipCode': equipRedeemed(); break;
            case 'badge': { const b = BADGES.find(x => x.id === d.id); if (b) { const got = save.badges.includes(b.id); toast(got ? `${b.name}: ${b.desc}` : `${b.name}: ${b.how}`, got ? 'good' : 'info'); sfx.pop(); } break; }
            case 'tab': if (d.tab !== currentTab) sfx.tab(); showTab(d.tab); break;
            case 'quit': leaveGame('play'); break;
            case 'openRace': openRace(); break;
            case 'roomCreate': roomCreate(); break;
            case 'roomLeave': roomLeave(); break;
            case 'roomCode': roomCodeClick(); break;
            case 'roomDiff': roomSetting('diff', d.v); break;
            case 'roomCount': roomSetting('count', +d.v); break;
            case 'roomStart': roomStart(); break;
            case 'raceBack': raceBack(); break;
            case 'raceSignIn': closeRaceGate(); doSignIn(); break;
            case 'raceGateClose': closeRaceGate(); break;
            case 'cat': wardCat = d.cat; tryOn = null; renderWardrobe(); break;
            case 'select': selectItem(d.cat, d.id); break;
            case 'equip': equip(d.cat, d.id); break;
            case 'claimPass':
                if (claimPass(parseInt(d.tier, 10))) { persist(); renderAll(); burst(e.clientX, e.clientY, { n: 12, size: 18, spread: 90, icons: ['🎟️', '⭐', '✨'] }); }
                break;
            case 'claimAllPass': {
                let n = 0;
                claimableTiers().forEach(tier => { if (claimPass(tier)) n++; });
                if (n) { persist(); renderAll(); burst(e.clientX, e.clientY, { n: 16, size: 18, spread: 110, icons: ['🎟️', '⭐', '✨', '🦴'] }); }
                break;
            }
            case 'claimGift': claimGift(); burst(e.clientX, e.clientY, { n: 16, size: 18, spread: 110, icons: ['🎄', '🎁', '⭐', '✨'] }); break;
            case 'openNews': { const sl = e.target.closest('[data-n]'); if (sl) newsIdx = +sl.dataset.n; showTab('news'); break; }
            case 'newsPick': newsIdx = +d.n; newsTick = Date.now(); renderNews(); renderNewsBox(); break;
            case 'claimDaily': claimDaily(); burst(e.clientX, e.clientY, { n: 12, size: 18, spread: 90, icons: ['🎁', '⭐', '✨', '🦴'] }); break;
            case 'toggleSetup': { const p = document.getElementById('setupPanel'); const open = p.classList.toggle('hidden') === false; t.setAttribute('aria-expanded', open); t.textContent = open ? 'Done ▴' : 'Game modes ▾'; sfx.pop(); break; }
            case 'openRedeem': openRedeem(); break;
            case 'redeemClose': closeRedeemDlg(); break;
            case 'shopSelect': shopSelect(d.cat, d.id); break;
            case 'shopClose': closeShopDlg(); break;
            case 'shopBuy': e.stopPropagation(); shopBuy(d.cat, d.id); break;
            case 'claimWeekly': claimWeekly(parseInt(d.q, 10)); burst(e.clientX, e.clientY, { n: 14, size: 18, spread: 100, icons: ['🗓️', '⭐', '✨', '🦴'] }); break;
            case 'claimQuest': claimQuest(parseInt(d.q, 10)); burst(e.clientX, e.clientY, { n: 12, size: 18, spread: 90, icons: ['📜', '⭐', '✨', '🦴'] }); break;
        }
    });

    el.startBtn.addEventListener('click', startGame);
    el.againBtn.addEventListener('click', startGame);
    el.menuBtn.addEventListener('click', () => leaveGame('play'));
    el.tapPrompt.addEventListener('click', () => el.typer.focus({ preventScroll: true }));

    el.difficultySelect.addEventListener('change', () => { save.difficulty = el.difficultySelect.value; persist(); });
    el.modeSelect.addEventListener('change', () => { save.mode = el.modeSelect.value; persist(); renderPlay(); });
    el.countSelect.addEventListener('change', () => { save.count = parseInt(el.countSelect.value, 10); persist(); });
    el.dogNameInput.addEventListener('change', () => {
        save.dogName = (el.dogNameInput.value.trim() || 'Biscuit').slice(0, 12);
        persist(); renderAll();
        toast(`Your pup is now called ${save.dogName}!`, 'paw'); sfx.on();
    });
    el.segMode.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return; save.mode = b.dataset.v; persist(); renderPlay(); sfx.pop(); });
    el.segDiff.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return; save.difficulty = b.dataset.v; persist(); renderPlay(); sfx.pop(); });
    el.segTopic.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return; save.topic = b.dataset.v; persist(); renderPlay(); sfx.pop(); });
    el.segTwist.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return; save.twist = b.dataset.v; persist(); renderPlay(); sfx.pop(); });
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
    el.stageToggle.addEventListener('click', () => {
        save.stage = !save.stage; persist(); renderSettings();
        toast(save.stage ? 'Dark stage now on while typing!' : 'Dark stage now off', save.stage ? 'dark' : 'off');
        save.stage ? sfx.on() : sfx.off();
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

    el.saveNowBtn.addEventListener('click', saveNow);
    el.resetBtn.addEventListener('click', () => {
        if (confirm('Reset your level, XP, items and records? This cannot be undone.' + (acct.user ? ' Your account save will be reset too.' : ''))) {
            save = freshSave();
            persist();
            applyPrefs(); syncAudio();
            ensureDaily();
            renderAll();
        }
    });

    /* =====================================================
       BOOSTS (XP tokens) + REDEEM CODES
    ===================================================== */
    const BOOST_MS = BOOST_MINUTES * 60 * 1000;
    const boostLeft = id => Math.max(0, (save.boosts[id] || 0) - tnow());
    const boostActive = id => boostLeft(id) > 0;
    const fmtLeft = ms => { const t = Math.ceil(ms / 1000), m = Math.floor(t / 60), sec = t % 60; return m + ':' + String(sec).padStart(2, '0'); };
    function cyrb53(str) {
        let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    }

    function activateToken(id) {
        if (!TOKENS[id] || save.tokens[id] <= 0) return;
        save.tokens[id]--;
        save.boosts[id] = Math.max(tnow(), save.boosts[id] || 0) + BOOST_MS;
        persist(); sfx.unlock();
        toast(`${TOKENS[id].short} boost active for ${BOOST_MINUTES} minutes!`, 'good');
        wasActive[id] = true;
        renderAll();
    }
    const wasActive = {};

    function boostChips() {
        return Object.keys(TOKENS).filter(boostActive).map(id => `<span class="boost-chip" style="--c:${TOKENS[id].color}"><span class="bc-ic">${tokenSVG(id)}</span>${TOKENS[id].short}<b data-bleft="${id}">${fmtLeft(boostLeft(id))}</b></span>`).join('');
    }
    function renderBoostBar() {
        const html = boostChips();
        ['boostBar', 'gameBoosts'].forEach(id => {
            const n = document.getElementById(id);
            if (!n) return;
            if (n.dataset.h !== html) { n.innerHTML = html; n.dataset.h = html; }
            n.classList.toggle('hidden', !html);
        });
    }
    setInterval(() => {
        let ended = false;
        Object.keys(TOKENS).forEach(id => {
            const act = boostActive(id);
            if (wasActive[id] && !act) { ended = true; toast(`${TOKENS[id].short} boost ended`, 'off'); }
            wasActive[id] = act;
        });
        if (ended) { persist(); renderAll(); return; }
        document.querySelectorAll('[data-bleft]').forEach(n => { n.textContent = fmtLeft(boostLeft(n.dataset.bleft)); });
    }, 1000);

    let lastRedeemItems = [];
    function renderBoosts() {
        const grid = document.getElementById('tokenGrid');
        if (!grid) return;
        const act = Object.keys(TOKENS).filter(boostActive);
        document.getElementById('activeBoosts').innerHTML = act.length
            ? `<h3 class="sub-h">Active now</h3><div class="boost-row">${boostChips()}</div>`
            : '<p class="muted">No boosts running. Activate a token below to start one.</p>';
        grid.innerHTML = Object.keys(TOKENS).map(id => {
            const t = TOKENS[id], n = save.tokens[id];
            return `<div class="token ${n ? '' : 'empty'}" style="--c:${t.color}">
        <div class="token-ic">${tokenSVG(id)}</div>
        <div class="token-info"><b>${t.name}</b><small>${t.desc}</small><small class="token-len">Lasts ${BOOST_MINUTES} minutes${boostActive(id) ? '. Using another adds more time' : ''}</small></div>
        <div class="token-act"><span class="token-count">x${n}</span><button class="small-btn" data-act="useToken" data-id="${id}" ${n ? '' : 'disabled'}>${boostActive(id) ? 'Add time' : 'Activate'}</button></div>
      </div>`;
        }).join('');
        document.getElementById('redeemCount').textContent = save.redeemed.length ? `Codes redeemed: ${save.redeemed.length}` : '';
    }

    function setCodeMsg(html, kind) {
        const m = document.getElementById('codeMsg');
        m.className = 'code-msg ' + (kind || '');
        m.innerHTML = html;
        const pm = document.getElementById('popCodeMsg');   // the Shop's redeem pop-up, if open
        if (pm) { pm.className = 'code-msg ' + (kind || ''); pm.innerHTML = html; }
    }
    function closeRedeemDlg() { const d = document.getElementById('redeemDlg'); if (d) d.remove(); }
    function openRedeem() {
        closeRedeemDlg();
        const dlg = document.createElement('div');
        dlg.className = 'dlg'; dlg.id = 'redeemDlg';
        dlg.innerHTML = `<div class="dlg-card redeem-dlg" role="dialog" aria-label="Redeem a code">
      <h2>🎁 Redeem a code</h2>
      <p class="muted">Type your code to unlock rewards. Each code works once per player.</p>
      <form id="popCodeForm" class="code-form" autocomplete="off">
        <input id="popCodeInput" placeholder="Enter code" maxlength="24" spellcheck="false" autocapitalize="characters" aria-label="Redeem code">
        <button class="big-btn" type="submit">Redeem</button>
      </form>
      <p id="popCodeMsg" class="code-msg"></p>
      <div class="row"><button class="small-btn ghost" data-act="redeemClose">Close</button></div>
    </div>`;
        dlg.addEventListener('click', e => { if (e.target === dlg) closeRedeemDlg(); });
        document.body.appendChild(dlg);
        dlg.querySelector('#popCodeForm').addEventListener('submit', e => { e.preventDefault(); redeemCode(document.getElementById('popCodeInput').value); });
        document.getElementById('popCodeInput').focus();
        sfx.pop();
    }
    let lastTry = 0;
    function redeemCode(raw) {
        const now = Date.now();
        if (now - lastTry < 700) return;
        lastTry = now;
        const norm = raw.replace(/\s+/g, '').toUpperCase();
        if (!norm) { setCodeMsg('Type your code first.', 'bad'); return; }
        const def = CODES[cyrb53(norm)];
        if (!def) { setCodeMsg('That code is not valid. Check the spelling and try again.', 'bad'); sfx.error(); return; }
        if (save.redeemed.includes(def.id)) { setCodeMsg('You already used this code.', 'bad'); sfx.error(); return; }
        const got = [];
        Object.keys(def.tokens || {}).forEach(k => { if (TOKENS[k]) { save.tokens[k] += def.tokens[k]; got.push(`${def.tokens[k]}x ${TOKENS[k].name}`); } });
        lastRedeemItems = [];
        (def.items || []).forEach(x => {
            const it = getItem(x.cat, x.id);
            if (!it) return;
            if (!save.owned[x.cat].includes(x.id)) save.owned[x.cat].push(x.id);
            lastRedeemItems.push(x); got.push(it.name);
        });
        save.redeemed.push(def.id);
        checkAchievements(true);
        persist(); sfx.mystery();
        const equipBtn = lastRedeemItems.length ? ` <button class="small-btn" data-act="equipCode">Equip them now</button>` : '';
        setCodeMsg(`Code redeemed! You got: <b>${got.join(', ')}</b>.${equipBtn}`, 'good');
        toast('Code redeemed!', 'good');
        document.getElementById('codeInput').value = '';
        const pi = document.getElementById('popCodeInput'); if (pi) pi.value = '';
        renderAll();
    }
    function equipRedeemed() {
        lastRedeemItems.forEach(x => { save.equipped[x.cat] = x.id; });
        lastRedeemItems = [];
        persist(); sfx.equip(); toast('Equipped!', 'on'); setCodeMsg('Equipped! Check it out on the Play tab.', 'good'); renderAll();
    }
    document.getElementById('codeForm').addEventListener('submit', e => { e.preventDefault(); redeemCode(document.getElementById('codeInput').value); });


    /* =====================================================
       PRIVATE RACE ROOMS (multiplayer)
       One friend makes a room and shares the 5-letter code (up to 4 racers). Everybody types the same
       sentences; each racer's dog runs along a shared track in real time. Needs a signed-in account.
    ===================================================== */
    const ROOM_MAX = 4;
    const RACE_DIFFS = ['easy', 'medium', 'hard'];
    const RACE_COUNTS = [3, 5, 10];
    const STALE_MS = 60000;
    const race = {
        code: '', host: false, room: null, players: [], rid: null, shown: false, view: 'entry',
        inRace: false, finished: false, quit: false, part: [], lastSend: 0, sendT: null, myProg: 0, moved: {},
        unsubs: [], hb: null, moveT: null, res: null, award: null, busy: false
    };
    const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const cleanEquip = e => {
        const o = {};
        ['breed', 'coat', 'hat', 'neck', 'face'].forEach(c => { o[c] = e && getItem(c, e[c]) ? e[c] : CATALOG[c][0].id; });
        return o;
    };
    const myRaceName = () => acct.username || 'Player';
    const meDoc = () => ({ name: myRaceName(), equip: cleanEquip(save.equipped), joinedAt: Date.now() });
    const liveRacers = () => race.players.filter(p => !p.left && Date.now() - (p.seen || 0) < STALE_MS)
        .sort((a, b) => (a.uid === (race.room && race.room.host) ? -1 : b.uid === (race.room && race.room.host) ? 1 : (a.joinedAt || 0) - (b.joinedAt || 0)));
    const raceEl = () => document.getElementById('roomView');
    const myUid = () => (acct.user && acct.user.uid) || '';

    function closeRaceGate() { const d = document.getElementById('raceGate'); if (d) d.remove(); }
    function raceGate(title, text, signIn) {
        closeRaceGate();
        const dlg = document.createElement('div');
        dlg.className = 'dlg'; dlg.id = 'raceGate';
        dlg.innerHTML = `<div class="dlg-card" role="dialog" aria-label="${esc(title)}">
      <h2>${esc(title)}</h2><p class="muted">${esc(text)}</p>
      <div class="row">${signIn ? '<button class="big-btn" data-act="raceSignIn">Sign in with Google</button>' : ''}<button class="small-btn ghost" data-act="raceGateClose">Close</button></div></div>`;
        dlg.addEventListener('click', e => { if (e.target === dlg) closeRaceGate(); });
        document.body.appendChild(dlg);
    }

    function openRace() {
        const C = window.PT_CLOUD;
        if (!C || !C.configured) { raceGate('Multiplayer is not set up', 'Online features are not connected yet, so rooms are not available.', false); return; }
        if (!acct.user) { raceGate('Sign in to race', "Multiplayer is for signed-in players. Guests can't join a room. Sign in with Google and pick a username to race your friends.", true); return; }
        if (!acct.username) { askUsername(); return; }
        if (race.code) { race.view = 'lobby'; showRoomView(); return; }
        race.view = 'entry'; showRoomView();
    }
    function showRoomView() {
        ensureAudio();
        const v = raceEl();
        v.classList.remove('hidden');
        document.body.classList.add('in-room');
        renderRoom(true);
    }
    function hideRoomView() { raceEl().classList.add('hidden'); document.body.classList.remove('in-room'); }

    /* ----- lobby drawing ----- */
    function slotHTML(p, i) {
        if (!p) return `<div class="slot empty"><div class="slot-art"><span>🐾</span></div><b>Waiting for a friend</b><small>Share the room code</small></div>`;
        const isHost = race.room && p.uid === race.room.host, me = p.uid === myUid();
        return `<div class="slot ${me ? 'me' : ''}"><div class="slot-art"><div class="slot-dog">${dogSVG(cleanEquip(p.equip))}</div></div>
      <b>${esc(p.name || 'Player')}</b><small>${isHost ? '👑 Host' : 'Racer'}${me ? ' · You' : ''}</small></div>`;
    }
    function renderRoom(force) {
        const v = raceEl();
        if (v.classList.contains('hidden')) return;
        if (race.view === 'entry') {
            if (!force && v.dataset.view === 'entry') return;     // keep what the player is typing
            v.dataset.view = 'entry';
            v.innerHTML = `<div class="room-inner">
        <div class="room-top"><button class="small-btn ghost" data-act="roomLeave">← Back</button><h1>Race your friends</h1><span></span></div>
        <p class="room-sub">Make a private room, or type a friend's code. Up to 4 racers.</p>
        <div class="room-entry">
          <div class="room-card"><span class="rc-ic">🏁</span><h2>Create a room</h2><p class="muted">You get a secret code. Send it to up to 3 friends.</p>
            <button class="big-btn" data-act="roomCreate">Create room</button></div>
          <div class="room-card"><span class="rc-ic">🔑</span><h2>Join a room</h2><p class="muted">Got a code from a friend? Enter it here.</p>
            <form id="roomJoinForm" class="code-form" autocomplete="off">
              <input id="roomCodeInput" placeholder="ABCDE" maxlength="5" spellcheck="false" autocapitalize="characters" aria-label="Room code">
              <button class="big-btn" type="submit">Join</button></form>
            <p id="roomMsg" class="dlg-err" role="alert"></p></div>
        </div></div>`;
            document.getElementById('roomJoinForm').addEventListener('submit', e => { e.preventDefault(); roomJoin(document.getElementById('roomCodeInput').value); });
            return;
        }
        v.dataset.view = 'lobby';
        const room = race.room || {}, racers = liveRacers();
        const diff = RACE_DIFFS.includes(room.diff) ? room.diff : 'easy', count = RACE_COUNTS.includes(room.count) ? room.count : 3;
        const slots = Array.from({ length: ROOM_MAX }, (_, i) => slotHTML(racers[i], i)).join('');
        const seg = (act, list, cur, label) => `<div class="seg" role="group">${list.map(x => `<button type="button" class="${x === cur ? 'on' : ''}" data-act="${act}" data-v="${x}" ${race.host ? '' : 'disabled'}>${label(x)}</button>`).join('')}</div>`;
        const canStart = race.host && racers.length >= 2 && !race.busy;
        v.innerHTML = `<div class="room-inner">
      <div class="room-top"><button class="small-btn ghost" data-act="roomLeave">← Leave</button><h1>Race lobby</h1><span class="muted room-n">${racers.length}/${ROOM_MAX}</span></div>
      <button type="button" class="room-code ${race.shown ? 'shown' : ''}" data-act="roomCode" aria-label="${race.shown ? 'Room code ' + race.code + '. Tap to copy again' : 'Show and copy the room code'}">
        ${race.shown ? `<span class="rc-label">Room code · copied</span><b class="rc-val">${esc(race.code)}</b>` : `<span class="rc-label">Room code</span><b class="rc-val hid">••••••</b><span class="rc-tap">Tap to show and copy</span>`}
      </button>
      <div class="room-slots">${slots}</div>
      <div class="room-ctl">
        <div class="rc-row"><span class="field-label">Difficulty</span>${seg('roomDiff', RACE_DIFFS, diff, x => x[0].toUpperCase() + x.slice(1))}</div>
        <div class="rc-row"><span class="field-label">Sentences</span>${seg('roomCount', RACE_COUNTS, count, x => x)}</div>
        ${race.host
                ? `<button class="play-btn room-go" data-act="roomStart" ${canStart ? '' : 'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg><span>${racers.length < 2 ? 'Waiting for a friend' : 'Start race'}</span></button>`
                : '<p class="room-wait">⏳ Waiting for the host to start the race…</p>'}
      </div></div>`;
    }

    /* ----- room lifecycle ----- */
    function attachRoom(code, host) {
        const C = window.PT_CLOUD;
        race.code = code; race.host = host; race.room = null; race.players = []; race.rid = null; race.shown = false; race.view = 'lobby'; race.busy = false;
        race.unsubs.forEach(u => { try { u(); } catch (e) { /* ignore */ } });
        race.unsubs = [C.watchRoom(code, onRoomSnap), C.watchPlayers(code, onPlayersSnap)];
        clearInterval(race.hb);
        race.hb = setInterval(() => { if (race.code) C.updatePlayer(race.code, { seen: Date.now() }).catch(() => { }); }, 12000);
        showRoomView();
    }
    function detachRoom() {
        race.unsubs.forEach(u => { try { u(); } catch (e) { /* ignore */ } });
        race.unsubs = []; clearInterval(race.hb); clearInterval(race.moveT); clearTimeout(race.sendT);
        race.code = ''; race.host = false; race.room = null; race.players = []; race.rid = null; race.shown = false; race.view = 'entry'; race.inRace = false;
    }
    async function roomCreate() {
        if (race.busy) return; race.busy = true;
        try { const code = await window.PT_CLOUD.createRoom(meDoc()); race.busy = false; attachRoom(code, true); sfx.pop(); }
        catch (e) { race.busy = false; toast(e.message || 'Could not create a room.', 'warn'); sfx.error(); }
    }
    async function roomJoin(raw) {
        if (race.busy) return;
        const msg = document.getElementById('roomMsg');
        race.busy = true; if (msg) msg.textContent = '';
        try { const code = await window.PT_CLOUD.joinRoom(raw, meDoc()); race.busy = false; attachRoom(code, false); sfx.pop(); }
        catch (e) { race.busy = false; if (msg) msg.textContent = e.message || 'Could not join that room.'; sfx.error(); }
    }
    function roomLeave() {
        const C = window.PT_CLOUD;
        if (race.code && C) C.leaveRoom(race.code, race.host);
        detachRoom(); hideRoomView();
    }
    function roomExitClosed() { toast('The host closed the room.', 'warn'); closeRaceResults(); if (race.inRace && g && g.race) { race.inRace = false; leaveGame('play'); } detachRoom(); hideRoomView(); }
    function onRoomSnap(r) {
        if (!race.code) return;
        if (!r || r.closed) { roomExitClosed(); return; }
        race.room = r;
        if (race.rid === null) race.rid = r.raceId || 0;
        if (r.state === 'racing' && (r.raceId || 0) > race.rid) { race.rid = r.raceId; beginRace(r); return; }
        if (!race.inRace) renderRoom();
    }
    function onPlayersSnap(list) {
        race.players = list;
        if (race.inRace) { updateTrack(); raceResultsRefresh(); } else renderRoom();
    }
    function roomCodeClick() {
        race.shown = true;
        const txt = race.code;
        const done = () => toast('Room code copied: ' + txt, 'good');
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => { fallbackCopy(txt); done(); });
            else { fallbackCopy(txt); done(); }
        } catch (e) { fallbackCopy(txt); done(); }
        sfx.pop(); renderRoom(true);
    }
    function fallbackCopy(txt) {
        try { const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); } catch (e) { /* ignore */ }
    }
    function roomSetting(key, val) {
        if (!race.host || !race.code) return;
        if (key === 'diff' && !RACE_DIFFS.includes(val)) return;
        if (key === 'count' && !RACE_COUNTS.includes(val)) return;
        race.room = Object.assign({}, race.room, { [key]: val });
        window.PT_CLOUD.updateRoom(race.code, { [key]: val }).catch(() => { });
        sfx.pop(); renderRoom(true);
    }
    async function roomStart() {
        if (!race.host || race.busy || liveRacers().length < 2) return;
        race.busy = true;
        const room = race.room || {};
        try {
            await window.PT_CLOUD.startRace(race.code, {
                seed: Math.floor(Math.random() * 2147483000) + 1,
                diff: RACE_DIFFS.includes(room.diff) ? room.diff : 'easy',
                count: RACE_COUNTS.includes(room.count) ? room.count : 3
            });
        } catch (e) { toast('Could not start the race. Try again.', 'warn'); sfx.error(); }
        race.busy = false;
    }

    /* ----- the race itself ----- */
    function beginRace(r) {
        closeRaceResults(); closeRaceGate();
        const diff = RACE_DIFFS.includes(r.diff) ? r.diff : 'easy', n = RACE_COUNTS.includes(r.count) ? r.count : 3;
        const sentences = withSeed(r.seed | 0, () => D.generateSentences(diff, n));
        race.part = liveRacers().map(p => p.uid);
        if (!race.part.includes(myUid())) race.part.push(myUid());
        race.inRace = true; race.finished = false; race.quit = false; race.myProg = 0; race.moved = {}; race.res = null; race.award = null; race.lastSend = 0;
        window.PT_CLOUD.updatePlayer(race.code, { progress: 0, wpm: 0, acc: 100, finished: false, finishedAt: null, quit: false, left: false, rid: race.rid, seen: Date.now() }).catch(() => { });
        hideRoomView();
        startGame({ race: { sentences, diff } });
        buildTrack();
        clearInterval(race.moveT);
        race.moveT = setInterval(trackTick, 300);
    }
    function raceCountdown() {
        const box = el.raceCount, myG = g;
        const steps = ['3', '2', '1', 'GO!'];
        box.classList.remove('hidden');
        let i = 0;
        const tick = () => {
            if (g !== myG || !g.active) { box.classList.add('hidden'); return; }
            box.textContent = steps[i];
            box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
            if (i < 3) sfx.pop(); else { sfx.fanfare && sfx.fanfare(); g.locked = false; g.startTime = performance.now(); try { el.typer.focus({ preventScroll: true }); } catch (e) { /* ignore */ } el.speedLabel.textContent = 'GO GO GO! 🏁'; setTimeout(() => box.classList.add('hidden'), 700); return; }
            i++; setTimeout(tick, 850);
        };
        tick();
    }
    function raceProgress(p) {
        race.myProg = p;
        updateTrack();
        const now = Date.now();
        const send = () => { race.lastSend = Date.now(); window.PT_CLOUD.updatePlayer(race.code, { progress: Math.min(1, race.myProg), wpm: currentWpm(), acc: currentAcc(), rid: race.rid, seen: Date.now() }).catch(() => { }); };
        clearTimeout(race.sendT);
        if (now - race.lastSend >= 400) send(); else race.sendT = setTimeout(() => { if (race.inRace && !race.finished) send(); }, 400 - (now - race.lastSend));
    }
    function raceFinish(res) {
        race.finished = true; race.myProg = 1; race.res = res;
        clearTimeout(race.sendT);
        updateTrack();
        window.PT_CLOUD.updatePlayer(race.code, { progress: 1, wpm: res.wpm, acc: res.acc, time: Math.round(res.time * 10) / 10, finished: true, finishedAt: window.PT_CLOUD.serverStamp(), rid: race.rid, seen: Date.now() }).catch(() => { });
    }
    function raceQuit() {
        race.inRace = false; clearInterval(race.moveT); clearTimeout(race.sendT); closeRaceResults();
        if (race.code) {
            window.PT_CLOUD.updatePlayer(race.code, { quit: true, rid: race.rid, seen: Date.now() }).catch(() => { });
            race.view = 'lobby'; showRoomView();
        }
    }
    function raceBack() {
        closeRaceResults();
        race.inRace = false; clearInterval(race.moveT);
        leaveGame('play');         // resets the game screen (race.inRace is already false, so no quit is sent)
        if (race.code) {
            if (race.host) window.PT_CLOUD.updateRoom(race.code, { state: 'lobby' }).catch(() => { });
            window.PT_CLOUD.updatePlayer(race.code, { progress: 0, finished: false, quit: false, seen: Date.now() }).catch(() => { });
            race.view = 'lobby'; showRoomView();
        }
    }

    /* track: one lane per racer, dogs run left to right */
    function buildTrack() {
        const box = el.raceTrack;
        const byUid = Object.fromEntries(race.players.map(p => [p.uid, p]));
        box.innerHTML = race.part.map(uid => {
            const p = byUid[uid] || {};
            const me = uid === myUid();
            return `<div class="lane ${me ? 'me' : ''}" data-uid="${esc(uid)}">
        <span class="lane-name">${esc(me ? 'You' : (p.name || 'Player'))}</span>
        <div class="lane-road"><div class="lane-dog" style="--p:0"><div class="lane-svg">${dogSVG(cleanEquip(me ? save.equipped : p.equip))}</div></div><span class="lane-flag">🏁</span></div>
        <span class="lane-rank"></span></div>`;
        }).join('');
        box.classList.remove('hidden');
    }
    function racerState(uid) {
        if (uid === myUid()) return { progress: race.myProg, finished: race.finished, quit: race.quit };
        const p = race.players.find(x => x.uid === uid);
        if (!p || p.rid !== race.rid) return { progress: 0, finished: false, quit: false, name: p && p.name };
        return { progress: +p.progress || 0, finished: !!p.finished, quit: !!p.quit || !!p.left, p };
    }
    function updateTrack() {
        if (!race.inRace) return;
        const now = Date.now();
        const order = raceOrder();
        el.raceTrack.querySelectorAll('.lane').forEach(lane => {
            const uid = lane.dataset.uid, st = racerState(uid);
            const dog = lane.querySelector('.lane-dog');
            const prev = +dog.style.getPropertyValue('--p') || 0;
            dog.style.setProperty('--p', Math.max(0, Math.min(1, st.progress)).toFixed(3));
            if (st.progress > prev + 0.0005) race.moved[uid] = now;
            lane.classList.toggle('done', st.finished);
            lane.classList.toggle('quit', st.quit);
            const r = lane.querySelector('.lane-rank'), idx = order.indexOf(uid);
            r.textContent = st.quit ? 'out' : st.finished ? ['🥇', '🥈', '🥉', '4th'][idx] || '' : '';
        });
    }
    function trackTick() {
        if (!race.inRace) { clearInterval(race.moveT); return; }
        const now = Date.now();
        el.raceTrack.querySelectorAll('.lane').forEach(lane => {
            const uid = lane.dataset.uid, st = racerState(uid);
            lane.querySelector('.lane-dog').classList.toggle('running', !st.finished && !st.quit && now - (race.moved[uid] || 0) < 900);
        });
    }
    // finishing order: finished racers by server finish time, then the rest by progress
    function raceOrder() {
        const rows = race.part.map(uid => {
            const st = racerState(uid), p = uid === myUid() ? null : st.p;
            const mine = race.players.find(x => x.uid === uid);
            return { uid, st, at: (mine && mine.finishedAt) || (uid === myUid() && race.finished ? Date.now() : 0) };
        });
        rows.sort((a, b) => {
            if (a.st.quit !== b.st.quit) return a.st.quit ? 1 : -1;
            if (a.st.finished !== b.st.finished) return a.st.finished ? -1 : 1;
            if (a.st.finished) return (a.at || 1e15) - (b.at || 1e15);
            return b.st.progress - a.st.progress;
        });
        return rows.map(r => r.uid);
    }

    /* race results (shown after you finish; fills in as friends finish) */
    function closeRaceResults() { const d = document.getElementById('raceRes'); if (d) d.remove(); }
    const allDone = () => race.part.every(uid => { const st = racerState(uid); return st.finished || st.quit || (uid !== myUid() && !liveRacers().some(p => p.uid === uid)); });
    function raceShowResults(res) {
        if (!race.award) {
            race.award = award(res); persist(); renderHeader(); renderDots(); announceBadges();
        }
        raceResultsRefresh(true);
    }
    function raceResultsRefresh(open) {
        if (!race.finished || !race.award) return;
        let dlg = document.getElementById('raceRes');
        if (!dlg) {
            if (!open) return;
            dlg = document.createElement('div'); dlg.className = 'dlg'; dlg.id = 'raceRes';
            document.body.appendChild(dlg);
        }
        const order = raceOrder(), done = allDone();
        const medals = ['🥇', '🥈', '🥉', '4th'];
        const rows = order.map((uid, i) => {
            const st = racerState(uid), p = race.players.find(x => x.uid === uid) || {};
            const me = uid === myUid(), r = me ? race.res : p;
            const status = st.quit ? 'Left the race' : st.finished ? `${Math.round(r.wpm || 0)} WPM · ${Math.round(r.acc || 0)}%${r.time ? ' · ' + fmtTime(r.time) : ''}` : `Racing… ${Math.round(st.progress * 100)}%`;
            return `<li class="${me ? 'me' : ''} ${st.quit ? 'out' : ''}"><span class="rr-pos">${st.quit ? '–' : st.finished ? medals[i] : '…'}</span><span class="rr-dog">${dogSVG(cleanEquip(me ? save.equipped : p.equip))}</span><span class="rr-name"><b>${esc(me ? (myRaceName() + ' (you)') : (p.name || 'Player'))}</b><small>${esc(status)}</small></span></li>`;
        }).join('');
        const myPos = order.indexOf(myUid());
        const a = race.award;
        dlg.innerHTML = `<div class="dlg-card race-res" role="dialog" aria-label="Race results">
      <h2>${done ? (myPos === 0 ? 'You won! 🏆' : 'Race finished!') : 'You finished! 🏁'}</h2>
      <p class="muted">${done ? 'Final results' : 'Waiting for your friends to finish…'}</p>
      <ol class="rr-list">${rows}</ol>
      <p class="rr-reward">+${a.xpGain} XP · +${a.bones} 🦴</p>
      <div class="row"><button class="big-btn" data-act="raceBack">Back to room</button></div></div>`;
    }

    /* =====================================================
       ACCOUNT: Google sign-in, cloud save, username
    ===================================================== */
    const CLOUD = window.PT_CLOUD;
    const UID_KEY = 'puppyTyperCloudUid';
    const progressScore = s => s.totalChars + s.games * 50;

    function scheduleCloudPush(now) {
        clearTimeout(acct.timer);
        acct.state = 'saving'; renderAccount();
        acct.timer = setTimeout(pushCloud, now ? 0 : 3000);
    }
    /* The 'core' is the part of your save that matters to other people (bones, levels, cosmetics, badges).
       It is stored as plain fields so Firestore's rules can check how fast it grows. */
    const validBadges = () => save.badges.filter(id => BADGES.some(b => b.id === id));
    function coreOf(s0 = save) {
        return {
            bones: Math.max(0, Math.floor(s0.bones)), level: Math.max(1, s0.level | 0), passXp: Math.max(0, Math.floor(s0.pass.xp)), games: Math.max(0, s0.games | 0),
            ownedIds: CATS.flatMap(c => s0.owned[c].map(id => c + ':' + id)), badges: s0.badges.filter(id => BADGES.some(b => b.id === id)), at: Math.max(0, Math.floor(s0.savedAt || 0))
        };
    }
    const coreKey = c => JSON.stringify(Object.assign({}, c, { at: 0 }));
    // the same "believable growth" limits that firestore.rules enforces (d = seconds)
    const growthOk = (o, c, d) => c.bones <= o.bones + 800 + 6 * d && c.level <= o.level + 1 + d / 20 && c.ownedIds.length <= o.ownedIds.length + 3 + d / 60
        && c.badges.length <= o.badges.length + 3 && c.passXp <= o.passXp + 300 + 5 * d && c.games <= o.games + 1 + d / 4;
    // Put the checked values from the account over the save blob
    function overlayCore(obj, core) {
        if (!core || !Array.isArray(core.ownedIds) || !Array.isArray(core.badges)) return obj;
        const o = JSON.parse(JSON.stringify(obj));
        o.bones = core.bones; o.level = Math.max(1, core.level); o.games = core.games;
        o.pass = Object.assign({}, o.pass, { xp: core.passXp });
        o.owned = {}; CATS.forEach(c => { o.owned[c] = []; });
        core.ownedIds.forEach(k => { const i = String(k).indexOf(':'); const c = k.slice(0, i), id = k.slice(i + 1); if (o.owned[c]) o.owned[c].push(id); });
        o.badges = core.badges.slice();
        return o;
    }
    // What the account holds: the full save, unless it has been edited in a way the checked core says is not believable
    function cloudFromProfile(prof) {
        if (!prof || !prof.save) return null;
        const raw = JSON.parse(prof.save), blob = normalize(raw), core = prof.core;
        if (!core || !Array.isArray(core.ownedIds) || !Array.isArray(core.badges)) return blob;
        const cAt = core.at || (prof.coreAt && prof.coreAt.toMillis ? prof.coreAt.toMillis() : 0);
        if (!cAt || (blob.savedAt || 0) > cAt + 1500) {
            if (!cAt || growthOk(core, coreOf(blob), ((blob.savedAt || 0) - cAt) / 1000)) return blob;     // newer than the last checkpoint, and believable
        }
        return normalize(overlayCore(raw, core));
    }
    // Combine two saves (this device + the account) so nothing is ever lost
    const MAX_FIELDS = ['bestWpm', 'bestAcc', 'games', 'perfects', 'maxStreak', 'totalChars', 'hardRounds', 'totalTime', 'bestCombo', 'questsDone', 'customRounds', 'nightRounds', 'morningRounds', 'taRounds', 'taBest', 'shopBuys', 'endlessBest', 'dailyWins', 'goldTotal', 'twistRounds', 'quickRound', 'mysteryOpened', 'dailyClaims'];
    const uniq = (...lists) => [...new Set([].concat(...lists.map(l => l || [])))];
    function mergeSaves(a, b) {
        const newer = (a.savedAt || 0) >= (b.savedAt || 0) ? a : b;
        const m = JSON.parse(JSON.stringify(newer));
        MAX_FIELDS.forEach(k => { m[k] = Math.max(a[k] || 0, b[k] || 0); });
        const hi = (a.level > b.level || (a.level === b.level && a.xp >= b.xp)) ? a : b;
        m.level = hi.level; m.xp = hi.xp;
        CATS.forEach(c => { m.owned[c] = uniq(a.owned[c], b.owned[c]); });
        ['ach', 'badges', 'badgesSeen', 'seasons', 'topicsPlayed', 'diffsPlayed', 'redeemed'].forEach(k => { m[k] = uniq(a[k], b[k]); });
        Object.keys(Object.assign({}, a.seasonTier, b.seasonTier)).forEach(k => { m.seasonTier[k] = Math.max((a.seasonTier || {})[k] || 0, (b.seasonTier || {})[k] || 0); });
        if (a.passSeason === b.passSeason) m.pass = { xp: Math.max(a.pass.xp, b.pass.xp), claimed: uniq(a.pass.claimed, b.pass.claimed) };
        Object.keys(Object.assign({}, a.bestTimes, b.bestTimes)).forEach(k => { const x = (a.bestTimes || {})[k], y = (b.bestTimes || {})[k]; m.bestTimes[k] = x && y ? Math.min(x, y) : (x || y); });
        Object.keys(Object.assign({}, a.boosts, b.boosts)).forEach(k => { m.boosts[k] = Math.max((a.boosts || {})[k] || 0, (b.boosts || {})[k] || 0); });
        Object.keys(Object.assign({}, a.tokens, b.tokens)).forEach(k => { m.tokens[k] = newer.tokens[k] || 0; });
        m.savedAt = Math.max(a.savedAt || 0, b.savedAt || 0);
        return m;
    }
    async function pushCloud() {
        clearTimeout(acct.timer); acct.timer = null;
        if (!acct.synced || !CLOUD.user()) return;
        try {
            // 'core' changes may be sent once every 25s (the server enforces 20s); the whole save goes every time
            const core = coreOf(), ck = coreKey(core);
            const want = ck !== acct.coreSent;
            const send = want && tnow() - (acct.coreAt || 0) >= 25000;
            const out = await CLOUD.pushSave(JSON.stringify(save), save.savedAt || tnow(), { username: acct.username, level: careerLevel(), bestWpm: Math.min(300, save.bestWpm), seasons: save.seasons, badges: validBadges() }, send ? core : null);
            const coreDone = send && out && out.core !== false;
            if (coreDone) { acct.coreSent = ck; acct.coreAt = tnow(); }
            clearTimeout(acct.coreT);
            if (want && !coreDone) acct.coreT = setTimeout(pushCloud, send ? 45000 : Math.max(2000, 26000 - (tnow() - (acct.coreAt || 0))));
            acct.failed = false; acct.state = 'ok'; acct.lastSaved = Date.now();
        } catch (e) { console.warn('Cloud save failed', e); acct.failed = true; acct.state = 'error'; clearTimeout(acct.coreT); acct.coreT = setTimeout(pushCloud, 20000); }
        renderAccount();
    }
    // Pick up changes made on another device (on focus, and every 45 seconds while the game is open)
    async function syncDown() {
        if (!acct.user || !acct.synced || acct.pulling || (g && g.active) || acct.timer) return;
        const ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) return;
        acct.pulling = true;
        try {
            const prof = await CLOUD.getProfile(), cloud = cloudFromProfile(prof);
            if (cloud && (cloud.savedAt || 0) > (save.savedAt || 0) + 500 && !acct.timer) {
                applyCloudSave(mergeSaves(save, cloud));
                toast('Updated from your other device', 'info');
            }
        } catch (e) { /* try again next time */ }
        acct.pulling = false;
    }
    setInterval(() => { if (!document.hidden) syncDown(); }, 45000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) syncDown(); });
    async function saveNow() {
        sfx.pop();
        if (!acct.user || !CLOUD || !CLOUD.configured) { persist(); toast('Saved on this device. Sign in with Google to keep it on every device.', 'info'); return; }
        if (!acct.synced) { toast('Still connecting to your account...', 'warn'); return; }
        persist(); acct.state = 'saving'; renderAccount();
        await pushCloud();
        toast(acct.failed ? 'Could not reach your account. Will keep trying.' : 'Saved to your account ✓', acct.failed ? 'warn' : 'good');
    }
    window.addEventListener('online', () => { if (acct.failed) scheduleCloudPush(true); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && acct.timer) pushCloud(); });

    function askUsername() {
        if (document.getElementById('nameDlg')) return;
        const dlg = document.createElement('div');
        dlg.className = 'dlg'; dlg.id = 'nameDlg';
        dlg.innerHTML = `<form class="dlg-card" autocomplete="off">
      <h2>Pick your username</h2>
      <p class="muted">This is the name other players will see on the leaderboard. You can use letters, numbers and underscores (3 to 16 characters).</p>
      <input id="nameIn" maxlength="16" placeholder="e.g. FastPaws" spellcheck="false" autocapitalize="off">
      <p id="nameErr" class="dlg-err"></p>
      <div class="row"><button class="big-btn" type="submit">Save username</button><button class="small-btn ghost" type="button" id="nameLater">Later</button></div>
    </form>`;
        document.body.appendChild(dlg);
        const inp = dlg.querySelector('#nameIn'), err = dlg.querySelector('#nameErr');
        setTimeout(() => inp.focus(), 50);
        dlg.querySelector('#nameLater').onclick = () => dlg.remove();
        dlg.querySelector('form').onsubmit = async ev => {
            ev.preventDefault();
            const name = inp.value.trim();
            const bad = CLOUD.usernameProblem(name);
            if (bad) { err.textContent = bad; return; }
            err.textContent = 'Checking...';
            try {
                await CLOUD.claimUsername(name);
                acct.username = name; dlg.remove();
                toast(`Welcome, ${name}!`, 'good'); sfx.claim();
                scheduleCloudPush(true); renderAccount();
            } catch (e) {
                err.textContent = e.code === 'taken' || e.code === 'invalid' ? e.message : 'Could not save that name. Check your connection and try again.';
            }
        };
    }

    function applyCloudSave(obj) {
        save = normalize(obj);
        persist(true);
        applyPrefs(); syncAudio(); ensureDaily(); renderAll();
    }

    async function onSignedIn(user) {
        acct.user = user; acct.state = 'syncing'; acct.synced = false; renderAccount();
        if (g && g.active) { setTimeout(() => onSignedIn(user), 3000); return; }
        try {
            const prof = await CLOUD.getProfile();
            acct.username = (prof && prof.username) || '';
            let cloud = null;
            try { cloud = cloudFromProfile(prof); } catch (e) { console.warn('cloud parse', e); cloud = null; }
            await syncClock();
            acct.coreAt = prof && prof.coreAt && prof.coreAt.toMillis ? prof.coreAt.toMillis() : 0;
            acct.coreSent = prof && prof.core ? coreKey(prof.core) : '';
            const first = localStorage.getItem(UID_KEY) !== user.uid;
            try { localStorage.setItem(UID_KEY, user.uid); } catch (e) { /* ignore */ }
            acct.synced = true;
            try { localStorage.removeItem(GUEST_KEY); } catch (e) { /* ignore */ }
            hideLanding();
            if (cloud) {
                // merge this device with the account: nothing is lost from either side
                const merged = mergeSaves(save, cloud);
                const differsLocal = JSON.stringify(merged) !== JSON.stringify(save), differsCloud = JSON.stringify(merged) !== JSON.stringify(cloud);
                if (differsLocal) applyCloudSave(merged);
                acct.state = 'saving';
                if (differsCloud) await pushCloud(); else acct.state = 'ok';
                acct.lastSaved = Date.now();
                if (first) toast('Your progress was loaded from your account!', 'good');
            } else { acct.state = 'saving'; await pushCloud(); if (first) toast('Your progress is now saved to your account!', 'good'); }
            renderAccount();
            if (!acct.username) askUsername(); else if (first) toast(`Signed in as ${acct.username}`, 'on');
        } catch (e) {
            console.warn('Sync failed', e);
            acct.state = 'error'; acct.failed = true; acct.synced = false; renderAccount();
            toast('Could not reach your account. Progress is still saved on this device.', 'warn');
        }
    }

    const G_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
    const ACCT_STATUS = { syncing: 'Syncing...', saving: 'Saving...', ok: 'Saved to your account', error: 'Could not save. Will retry' };
    const badgeSVG = id => `<svg viewBox="0 0 64 64" aria-hidden="true">${BADGE_ART[id] || '<circle cx="32" cy="32" r="26" fill="#ffd54f" stroke="#2b2b2b" stroke-width="3.5"/>'}</svg>`;
    const seasonTags = () => {
        const mine = BADGES.filter(b => save.badges.includes(b.id));
        return mine.length ? `<span class="badge-row">${mine.map(b => `<span class="badge-ic" title="${b.name}">${badgeSVG(b.id)}</span>`).join('')}</span>` : '';
    };
    function closeAcctMenu() {
        const m = document.getElementById('acctMenu'), b = document.getElementById('acctBtn');
        if (m) m.classList.add('hidden');
        if (b) b.setAttribute('aria-expanded', 'false');
    }
    function renderTopAccount() {
        const wrap = document.getElementById('acctWrap'), btn = document.getElementById('acctBtn'), menu = document.getElementById('acctMenu');
        if (!wrap) return;
        if (!CLOUD || !CLOUD.configured || acct.state === 'loading' || acct.state === 'off') { wrap.classList.add('hidden'); return; }
        wrap.classList.remove('hidden');
        if (!acct.user) {
            closeAcctMenu();
            if (btn.dataset.mode !== 'login') {
                btn.dataset.mode = 'login'; btn.className = 'acct-btn login';
                btn.removeAttribute('aria-haspopup'); btn.setAttribute('aria-label', 'Log in with Google');
                btn.innerHTML = G_ICON + '<span class="acct-label">Log in</span>';
            }
            return;
        }
        const name = acct.username || (acct.user.email || 'Player').split('@')[0];
        const sig = name + '|' + (acct.user.email || '') + '|' + (acct.username ? 1 : 0) + '|' + save.badges.join();
        if (btn.dataset.mode !== 'user' || btn.dataset.sig !== sig) {
            btn.dataset.mode = 'user'; btn.dataset.sig = sig; btn.className = 'acct-btn user';
            btn.setAttribute('aria-haspopup', 'menu'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Account: ' + name);
            btn.innerHTML = `<span class="acct-av">${name.charAt(0).toUpperCase()}</span><span class="acct-label">${name}</span>`;
            menu.innerHTML = `<div class="am-head"><b>${acct.username || 'No username yet'}</b><small>${acct.user.email || 'Google account'}</small>${seasonTags()}
          <span class="acct-status ${acct.state}" id="amStatus">${ACCT_STATUS[acct.state] || ACCT_STATUS.ok}</span></div>
        ${acct.username ? '' : '<button class="am-item" data-act="pickName" role="menuitem">Choose username</button>'}
        <button class="am-item" data-act="goSettings" role="menuitem">Account settings</button>
        <button class="am-item danger" data-act="signOut" role="menuitem">Sign out</button>`;
        } else {
            const st = document.getElementById('amStatus');
            if (st) { st.textContent = ACCT_STATUS[acct.state] || ACCT_STATUS.ok; st.className = 'acct-status ' + acct.state; }
        }
    }
    document.getElementById('acctBtn').addEventListener('click', e => {
        e.stopPropagation();
        if (!acct.user) { doSignIn(); return; }
        const m = document.getElementById('acctMenu');
        const open = m.classList.toggle('hidden') === false;
        e.currentTarget.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', e => { if (!e.target.closest('#acctWrap') || e.target.closest('#acctMenu [data-act]')) closeAcctMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAcctMenu(); });
    window.addEventListener('pagehide', () => { if (race.code && window.PT_CLOUD) window.PT_CLOUD.leaveRoom(race.code, race.host); });

    function renderAccount() {
        renderTopAccount();
        updateSaveInfo();
        const box = document.getElementById('accountBody');
        if (!box) return;
        if (!CLOUD || !CLOUD.configured) {
            box.innerHTML = '<p class="muted">Cloud saves are not set up yet. Your progress is saved on <strong>this device and browser only</strong>. Sign-in is needed to keep it on other devices.</p>';
            return;
        }
        if (acct.state === 'loading') { box.innerHTML = '<p class="muted">Checking your account...</p>'; return; }
        if (!acct.user) {
            box.dataset.sig = '';
            box.innerHTML = `<p class="muted">Sign in with Google to save your progress to your account and pick it back up on any device.</p>
        <button class="small-btn" data-act="signIn">Sign in with Google</button>`;
            return;
        }
        const sig = (acct.username || '') + '|' + (acct.user.email || '') + '|' + save.badges.join();
        const stEl = box.querySelector('.acct-status');
        const status0 = { syncing: 'Syncing...', saving: 'Saving...', ok: 'Saved to your account', error: 'Could not save. Will retry' }[acct.state] || 'Saved to your account';
        updateSaveInfo();
        if (stEl && box.dataset.sig === sig) { stEl.textContent = status0; stEl.className = 'acct-status ' + acct.state; return; }   // don't rebuild buttons mid-click
        box.dataset.sig = sig;
        const status = { syncing: 'Syncing...', saving: 'Saving...', ok: 'Saved to your account', error: 'Could not save. Will retry' }[acct.state] || 'Saved to your account';
        box.innerHTML = `<div class="acct-row">
        <div class="acct-name">${acct.username ? `<b>${acct.username}</b>` : '<b class="muted">No username yet</b>'}<small>${acct.user.email || 'Google account'}</small>${seasonTags()}</div>
        <span class="acct-status ${acct.state}">${status}</span>
      </div>
      <div class="row">
        ${acct.username ? '' : '<button class="small-btn" data-act="pickName">Choose username</button>'}
        <button class="small-btn ghost" data-act="signOut">Sign out</button>
      </div>`;
    }

    function updateSaveInfo() {
        const n = document.getElementById('saveInfo'); if (!n) return;
        const t = acct.lastSaved ? new Date(acct.lastSaved).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
        n.textContent = acct.user && CLOUD && CLOUD.configured
            ? 'Everything saves to your account automatically: bones, levels, cosmetics, badges and settings. Sign in on any device to pick up where you left off.' + (t ? ` Last saved at ${t}.` : '')
            : 'Your progress is saved on this device only. Sign in with Google to keep it on every device.';
    }
    /* ---------- Launch screen: Google or guest ---------- */
    const GUEST_KEY = 'puppyTyperGuest';
    const hasFlag = k => { try { return !!localStorage.getItem(k); } catch (e) { return false; } };
    function hideLanding() {
        const L = document.getElementById('landing');
        if (!L) return;
        L.classList.add('leaving');
        document.body.classList.remove('landing-on');
        setTimeout(() => L.remove(), 350);
    }
    function showLanding() {
        if (document.getElementById('landing') || !CLOUD || !CLOUD.configured) return;
        document.body.classList.add('landing-on');
        const L = document.createElement('div');
        L.id = 'landing'; L.className = 'landing';
        L.innerHTML = `<div class="land-card">
      <div class="land-dog">${dogSVG(save.equipped)}</div>
      <h1>Puppy Typer</h1>
      <p class="land-tag">Type fast. Your pup runs faster.</p>
      <button class="google-btn" id="landGoogle" type="button">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
        Continue with Google
      </button>
      <p class="land-note"><b>Saves to your account</b> and follows you to any device.</p>
      <div class="land-or"><span>or</span></div>
      <button class="guest-btn" id="landGuest" type="button">Play as guest</button>
      <p class="land-note warn">Guest progress is saved <b>only on this device and browser</b>. Clearing your browser data can erase it.</p>
    </div>`;
        document.body.appendChild(L);
        const gbtn = L.querySelector('#landGoogle');
        gbtn.onclick = async () => {
            gbtn.disabled = true; gbtn.classList.add('busy');
            await doSignIn();
            gbtn.disabled = false; gbtn.classList.remove('busy');
        };
        L.querySelector('#landGuest').onclick = () => {
            try { localStorage.setItem(GUEST_KEY, '1'); } catch (e) { /* ignore */ }
            toast('Playing as guest. Progress saves on this device only.', 'info');
            hideLanding();
        };
    }

    async function doSignIn() {
        try { await CLOUD.signIn(); }
        catch (e) {
            if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
            toast(e.code === 'auth/unauthorized-domain' ? 'This website address is not allowed yet. Add it in Firebase (see SETUP.md).' : 'Sign-in did not work. Please try again.', 'warn');
            sfx.error();
        }
    }
    async function doSignOut() {
        if (!confirm('Sign out? Your progress stays safe in your account. This device will start fresh until you sign in again.')) return;
        if (acct.timer) await pushCloud();
        if (acct.failed) { if (!confirm('Your latest progress has not been saved to your account yet. Sign out anyway?')) return; }
        const keep = { theme: save.theme, muted: save.muted, musicOff: save.musicOff, keySounds: save.keySounds, fx: save.fx, textSize: save.textSize };
        await CLOUD.signOut();
        try { localStorage.removeItem(UID_KEY); } catch (e) { /* ignore */ }
        acct.user = null; acct.username = ''; acct.synced = false; acct.state = 'out';
        save = freshSave(); Object.assign(save, keep);
        persist(true); ensureDaily(); applyPrefs(); renderAll();
        toast('Signed out', 'off');
        showLanding();
    }

    if (CLOUD) {
        acct.state = CLOUD.configured ? 'loading' : 'off';
        if (CLOUD.configured && !hasFlag(GUEST_KEY) && !hasFlag(UID_KEY)) showLanding();   // new visitors see it straight away
        CLOUD.onAuth((user, err) => {
            if (err) { acct.state = 'off'; renderAccount(); hideLanding(); return; }
            if (user) onSignedIn(user);
            else { acct.user = null; acct.synced = false; acct.state = 'out'; renderAccount(); if (!hasFlag(GUEST_KEY)) showLanding(); }
        });
    }

    /* =====================================================
       START
    ===================================================== */
    if (window.PT_ICONS) PT_ICONS.start();
    applyPrefs();
    syncAudio();
    ensureDaily();
    checkAchievements(false);
    persist(true);
    renderAccount();
    showTab('play');
    announceBadges();
})();