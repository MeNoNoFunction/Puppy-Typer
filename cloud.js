/* =========================================================
   cloud.js: Google sign-in, cloud saves and usernames (Firebase).
   Loads the Firebase SDK only when firebase-config.js is filled in,
   so the game still works offline / before setup.

   Firestore layout
     users/{uid}          private: { save (JSON text), savedAt, username }
     usernames/{lower}    { uid }   (this is what makes usernames unique)
     profiles/{uid}       public:  { username, level, bestWpm }  (for a leaderboard later)
     rooms/{CODE}         private race room: { host, state, raceId, seed, diff, count, closed, createdAt, expiresAt }
     rooms/{CODE}/players/{uid}  one doc per racer: { name, equip, progress, wpm, acc, finished, finishedAt, left, seen }
========================================================= */
(function () {
    'use strict';
    const cfg = window.PT_FIREBASE_CONFIG;
    const configured = !!(cfg && cfg.apiKey && cfg.projectId && !/PASTE/.test(cfg.apiKey + cfg.projectId));
    const V = '10.12.2';
    const listeners = [];
    let auth = null, db = null, user = null, booted = false, bootErr = null;

    const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;
    const BLOCKED = ['admin', 'moderator', 'support', 'puppytyper', 'fuck', 'shit', 'bitch', 'cunt', 'nigg', 'fag', 'rape', 'nazi', 'hitler', 'porn', 'sex', 'dick', 'cock', 'pussy', 'whore', 'slut'];

    function loadScript(src) {
        return new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src));
            document.head.appendChild(s);
        });
    }
    function emit() { listeners.forEach(fn => { try { fn(user, bootErr); } catch (e) { console.error(e); } }); }

    async function boot() {
        if (!configured) { emit(); return; }
        try {
            const base = `https://www.gstatic.com/firebasejs/${V}/`;
            await loadScript(base + 'firebase-app-compat.js');
            await Promise.all([loadScript(base + 'firebase-auth-compat.js'), loadScript(base + 'firebase-firestore-compat.js')]);
            firebase.initializeApp(cfg);
            auth = firebase.auth(); db = firebase.firestore();
            booted = true;
            auth.getRedirectResult().catch(() => { });
            auth.onAuthStateChanged(u => { user = u; emit(); });
        } catch (e) { bootErr = e; console.warn('Cloud saves unavailable:', e.message); emit(); }
    }

    function usernameProblem(name) {
        if (!NAME_RE.test(name)) return 'Use 3 to 16 letters, numbers or underscores.';
        const low = name.toLowerCase();
        if (BLOCKED.some(b => low.includes(b))) return 'Please pick a different name.';
        return '';
    }

    async function signIn() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try { await auth.signInWithPopup(provider); }
        catch (e) {
            if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') return auth.signInWithRedirect(provider);
            throw e;
        }
    }
    const signOut = () => auth.signOut();
    async function getProfile() {
        const snap = await db.doc('users/' + user.uid).get();
        return snap.exists ? snap.data() : null;
    }
    // Server clock: write a server timestamp, read it back, and work out how far the device clock is off
    async function serverClock() {
        const ref = db.doc('clock/' + user.uid), t0 = Date.now();
        await ref.set({ t: firebase.firestore.FieldValue.serverTimestamp() });
        const snap = await ref.get({ source: 'server' });
        const t1 = Date.now();
        return snap.data().t.toMillis() - (t0 + t1) / 2;
    }
    // Three separate writes, so a rejected 'core' (anti-cheat limits) or profile can never stop the save itself.
    async function pushSave(json, savedAt, summary, core) {
        const out = { save: false, core: !core, profile: true };
        await db.doc('users/' + user.uid).set({ save: json, savedAt }, { merge: true });
        out.save = true;
        if (summary && summary.username) {
            try { await db.doc('profiles/' + user.uid).set({ username: summary.username, level: summary.level, bestWpm: summary.bestWpm, seasons: summary.seasons || [], badges: summary.badges || [], updatedAt: savedAt }, { merge: true }); }
            catch (e) { out.profile = false; console.warn('Profile update skipped', e); }
        }
        if (core) {
            try { await db.doc('users/' + user.uid).set({ core, coreAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); out.core = true; }
            catch (e) { out.core = false; console.warn('Core update skipped', e); }
        }
        return out;
    }
    async function claimUsername(name) {
        const bad = usernameProblem(name);
        if (bad) throw Object.assign(new Error(bad), { code: 'invalid' });
        const low = name.toLowerCase();
        const uref = db.doc('usernames/' + low);
        await db.runTransaction(async tx => {
            const snap = await tx.get(uref);
            if (snap.exists && snap.data().uid !== user.uid) throw Object.assign(new Error('That username is taken.'), { code: 'taken' });
            tx.set(uref, { uid: user.uid });
            tx.set(db.doc('users/' + user.uid), { username: name }, { merge: true });
        });
    }

    /* ---------- Private race rooms ---------- */
    const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no I, O, 0, 1 (easy to read out loud)
    const newCode = () => Array.from({ length: 5 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join('');
    const roomRef = code => db.doc('rooms/' + code);
    const playerRef = (code, uid) => db.doc('rooms/' + code + '/players/' + uid);
    const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    async function createRoom(me) {
        for (let i = 0; i < 6; i++) {
            const code = newCode(), ref = roomRef(code);
            const ok = await db.runTransaction(async tx => {
                const snap = await tx.get(ref);
                if (snap.exists) return false;
                tx.set(ref, {
                    host: user.uid, state: 'lobby', raceId: 0, seed: 0, diff: 'easy', count: 3, closed: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6)
                });
                return true;
            });
            if (ok) { await playerRef(code, user.uid).set(Object.assign({ progress: 0, finished: false, left: false, seen: Date.now() }, me)); return code; }
        }
        throw new Error('Could not make a room. Try again.');
    }
    async function joinRoom(raw, me) {
        const code = normCode(raw);
        if (code.length !== 5) throw Object.assign(new Error('Room codes have 5 letters or numbers.'), { code: 'invalid' });
        const snap = await roomRef(code).get();
        if (!snap.exists || (snap.data() || {}).closed) throw Object.assign(new Error('No room with that code. Check it and try again.'), { code: 'missing' });
        const players = await db.collection('rooms/' + code + '/players').get();
        const live = players.docs.filter(d => d.id !== user.uid && Date.now() - ((d.data() || {}).seen || 0) < 60000 && !(d.data() || {}).left);
        if (live.length >= 4 - 1) throw Object.assign(new Error('That room is full (4 players).'), { code: 'full' });
        if (snap.data().state === 'racing') throw Object.assign(new Error('That race has already started. Ask for the next one.'), { code: 'busy' });
        await playerRef(code, user.uid).set(Object.assign({ progress: 0, finished: false, left: false, seen: Date.now() }, me));
        return code;
    }
    const watchRoom = (code, cb) => roomRef(code).onSnapshot(s => cb(s.exists ? s.data() : null), () => cb(null));
    const watchPlayers = (code, cb) => db.collection('rooms/' + code + '/players').onSnapshot(
        s => cb(s.docs.map(d => Object.assign({ uid: d.id }, d.data(), { finishedAt: d.data().finishedAt && d.data().finishedAt.toMillis ? d.data().finishedAt.toMillis() : (d.data().finishedAt || 0) }))), () => { });
    const updatePlayer = (code, data) => playerRef(code, user.uid).set(data, { merge: true });
    const updateRoom = (code, data) => roomRef(code).update(data);
    // host starts a race: a new raceId tells everybody to begin
    async function startRace(code, opts) {
        await roomRef(code).update({ state: 'racing', raceId: firebase.firestore.FieldValue.increment(1), seed: opts.seed, diff: opts.diff, count: opts.count });
    }
    async function leaveRoom(code, isHost) {
        try { await playerRef(code, user.uid).set({ left: true, seen: Date.now() }, { merge: true }); } catch (e) { /* ignore */ }
        if (isHost) { try { await roomRef(code).update({ closed: true }); } catch (e) { /* ignore */ } }
    }
    const serverStamp = () => firebase.firestore.FieldValue.serverTimestamp();

    window.PT_CLOUD = {
        createRoom, joinRoom, watchRoom, watchPlayers, updatePlayer, updateRoom, startRace, leaveRoom, serverStamp,
        configured,
        onAuth(fn) { listeners.push(fn); if (booted || !configured || bootErr) fn(user, bootErr); },
        signIn, signOut, getProfile, pushSave, serverClock, claimUsername, usernameProblem,
        user: () => user
    };
    boot();
})();