/* =========================================================
   cloud.js: Google sign-in, cloud saves and usernames (Firebase).
   Loads the Firebase SDK only when firebase-config.js is filled in,
   so the game still works offline / before setup.

   Firestore layout
     users/{uid}          private: { save (JSON text), savedAt, username }
     usernames/{lower}    { uid }   (this is what makes usernames unique)
     profiles/{uid}       public:  { username, level, bestWpm }  (for a leaderboard later)
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
    function pushSave(json, savedAt, summary) {
        const batch = db.batch();
        batch.set(db.doc('users/' + user.uid), { save: json, savedAt }, { merge: true });
        if (summary && summary.username) {
            batch.set(db.doc('profiles/' + user.uid), { username: summary.username, level: summary.level, bestWpm: summary.bestWpm, updatedAt: savedAt }, { merge: true });
        }
        return batch.commit();
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

    window.PT_CLOUD = {
        configured,
        onAuth(fn) { listeners.push(fn); if (booted || !configured || bootErr) fn(user, bootErr); },
        signIn, signOut, getProfile, pushSave, claimUsername, usernameProblem,
        user: () => user
    };
    boot();
})();