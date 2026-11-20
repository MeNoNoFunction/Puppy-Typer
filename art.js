/* =========================================================
   PUPPY TYPIST - ART
   Everything you SEE is drawn here as vector (SVG) art:
   dogs (one shape per breed), hats, neckwear, glasses and scenes.
   To add a new breed, copy a line in BREEDS and tweak the numbers.
   Dogs face right. The ground line is y = 126.
========================================================= */
window.PT_ART = (() => {
    'use strict';
    const D = window.PT_DATA;
    const GROUND = 126;
    const INK = '#2b1d14';            // outline colour for cosmetics
    let uid = 0;

    /* ---------------- colour helpers ---------------- */
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function parse(hex) {
        let h = String(hex).replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const toHex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
    function shade(hex, f) {            // f < 1 darker, f > 1 lighter
        const [r, g, b] = parse(hex);
        if (f <= 1) return toHex(r * f, g * f, b * f);
        const t = f - 1;
        return toHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
    }
    function rng(seed) {
        return () => { seed = (seed * 1664525 + 1013904223) | 0; return ((seed >>> 0) % 10000) / 10000; };
    }
    const star = (cx, cy, r, fill, extra = '') => {
        const pts = [];
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
            pts.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1));
        }
        return `<polygon points="${pts.join(' ')}" fill="${fill}" ${extra}/>`;
    };

    /* =====================================================
       BREEDS  (all numbers are SVG units)
       body  : x0..x1 left/right, top/bot  (the torso)
       legW  : leg thickness
       head  : centre + radius,  snout: len / half-height / drop
       ear   : style + size,     tail: style + size
    ===================================================== */
    const BREEDS = {
        pup: { body: { x0: 42, x1: 130, top: 58, bot: 97 }, legW: 17, head: { cx: 150, cy: 49, r: 27 }, snout: { len: 11, h: 11, dy: 11 }, ear: { type: 'floppy', s: 1.0 }, tail: { type: 'plume', s: 0.75 } },
        retriever: { body: { x0: 30, x1: 136, top: 50, bot: 90 }, legW: 14, head: { cx: 154, cy: 39, r: 21 }, snout: { len: 21, h: 10, dy: 9 }, ear: { type: 'floppy', s: 1.0 }, tail: { type: 'plume', s: 1.2 } },
        corgi: { body: { x0: 34, x1: 134, top: 66, bot: 108 }, legW: 15, head: { cx: 152, cy: 51, r: 22 }, snout: { len: 15, h: 9, dy: 9 }, ear: { type: 'pointy', s: 1.25 }, tail: { type: 'stub' }, socks: true, blaze: true },
        dachshund: { body: { x0: 14, x1: 138, top: 68, bot: 100 }, legW: 12, head: { cx: 160, cy: 56, r: 17 }, snout: { len: 26, h: 8, dy: 7 }, ear: { type: 'floppy', s: 1.45, w: 0.85 }, tail: { type: 'whip', s: 1 } },
        pug: { body: { x0: 44, x1: 128, top: 60, bot: 100 }, legW: 16, head: { cx: 146, cy: 53, r: 27 }, snout: { len: 4, h: 12, dy: 12 }, ear: { type: 'fold' }, tail: { type: 'curl', s: 0.8 }, mask: true, wrinkles: true },
        husky: { body: { x0: 30, x1: 136, top: 50, bot: 90 }, legW: 14, head: { cx: 154, cy: 41, r: 22 }, snout: { len: 17, h: 10, dy: 9 }, ear: { type: 'pointy', s: 1.0 }, tail: { type: 'curl', s: 1.35 }, socks: true, huskyMask: true },
        poodle: { body: { x0: 42, x1: 126, top: 52, bot: 86 }, legW: 9, head: { cx: 148, cy: 34, r: 18 }, snout: { len: 22, h: 8, dy: 8 }, ear: { type: 'curly' }, tail: { type: 'pom' }, poodle: true },
        whippet: { body: { x0: 26, x1: 138, top: 56, bot: 86 }, legW: 11, head: { cx: 158, cy: 40, r: 15 }, snout: { len: 27, h: 7, dy: 7 }, ear: { type: 'rose' }, tail: { type: 'whip', s: 1.5 } },
        mutt: { body: { x0: 32, x1: 134, top: 54, bot: 96 }, legW: 15, head: { cx: 152, cy: 43, r: 24 }, snout: { len: 15, h: 10, dy: 10 }, ear: { type: 'pointy', s: 1.15 }, tail: { type: 'plume', s: 1.35 }, fluffy: true },
        lab: { body: { x0: 30, x1: 134, top: 52, bot: 94 }, legW: 16, head: { cx: 153, cy: 41, r: 23 }, snout: { len: 19, h: 12, dy: 10 }, ear: { type: 'floppy', s: 0.85 }, tail: { type: 'whip', s: 1.2 } },
        shiba: { body: { x0: 36, x1: 130, top: 54, bot: 92 }, legW: 15, head: { cx: 150, cy: 45, r: 23 }, snout: { len: 13, h: 10, dy: 9 }, ear: { type: 'pointy', s: 0.85 }, tail: { type: 'curl', s: 1.15 }, cheeks: true }
    };

    // cartoon proportions: bigger head, shorter snout, chunkier legs
    Object.values(BREEDS).forEach(br => {
        br.head.r = Math.round(br.head.r * 1.14 * 10) / 10;
        br.head.cy += 2;
        br.snout.len = Math.round(br.snout.len * 0.78);
        br.snout.h = Math.round(br.snout.h * 1.12 * 10) / 10;
        br.legW = Math.round(br.legW * 1.28);
        br.body.bot += 3;
    });

    /* ---------------- leg + tail + ear builders ---------------- */
    const f1 = n => (Math.round(n * 10) / 10);
    // Catmull-Rom spline through points -> smooth cubic path (organic outlines instead of boxes)
    function smooth(pts, closed = true) {
        const n = pts.length, at = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
        let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
        const last = closed ? n : n - 1;
        for (let i = 0; i < last; i++) {
            const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
            d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
        }
        return d + (closed ? ' Z' : '');
    }
    // legs: origin = top of the leg, y down to the paw. front = straight pastern, hind = bent hock
    function legPath(w, h, hind) {
        const P = hind ? [
            [-0.62, 0], [0.62, 0], [0.64, 0.2], [0.42, 0.44], [0.3, 0.62], [0.3, 0.8], [0.4, 1 - 0.34 / (h / w)],
            [0.78, 1 - 0.14 / (h / w)], [0.7, 1], [-0.32, 1], [-0.46, 1 - 0.14 / (h / w)], [-0.2, 0.78], [-0.1, 0.72],
            [-0.5, 0.56], [-0.72, 0.28]
        ] : [
            [-0.58, 0], [0.58, 0], [0.54, 0.3], [0.38, 0.6], [0.34, 0.82], [0.4, 1 - 0.3 / (h / w)],
            [0.8, 1 - 0.12 / (h / w)], [0.72, 1], [-0.34, 1], [-0.5, 1 - 0.14 / (h / w)], [-0.3, 0.84], [-0.36, 0.58], [-0.52, 0.3]
        ];
        return smooth(P.map(p => [p[0] * w, p[1] * h]));
    }

    function earPath(br, hd, far) {
        const e = br.ear, r = hd.r;
        const sh = far ? -r * 0.5 : 0, sy = far ? -r * 0.1 : 0;
        if (e.type === 'floppy') {
            const L = r * 1.5 * e.s, W = r * 0.85 * (e.w || 1);
            const ax = hd.cx - r * 0.38 + sh, ay = hd.cy - r * 0.68 + sy;
            return `M${ax - W * 0.5} ${ay} C${ax - W * 0.66} ${ay + L * 0.45} ${ax - W * 0.45} ${ay + L * 0.94} ${ax} ${ay + L} ` +
                `C${ax + W * 0.62} ${ay + L * 0.95} ${ax + W * 0.74} ${ay + L * 0.4} ${ax + W * 0.5} ${ay} ` +
                `C${ax + W * 0.2} ${ay - W * 0.28} ${ax - W * 0.2} ${ay - W * 0.28} ${ax - W * 0.5} ${ay} Z`;
        }
        if (e.type === 'pointy') {
            const s = e.s;
            const bx0 = hd.cx - r * 0.85 + sh, by0 = hd.cy - r * 0.3 + sy;
            const bx1 = hd.cx + r * 0.12 + sh, by1 = hd.cy - r * 0.72 + sy;
            const tx = hd.cx - r * 0.32 + sh, ty = hd.cy - r * (0.95 + 1.0 * s) + sy;
            return `M${bx0} ${by0} Q${bx0 - r * 0.12} ${ty + r * 0.55} ${tx} ${ty} Q${bx1 + r * 0.02} ${ty + r * 0.5} ${bx1} ${by1} Z`;
        }
        if (e.type === 'fold') {
            return `M${hd.cx - r * 0.82 + sh} ${hd.cy - r * 0.42 + sy} Q${hd.cx - r * 0.86 + sh} ${hd.cy - r * 1.12 + sy} ${hd.cx - r * 0.2 + sh} ${hd.cy - r * 0.98 + sy} ` +
                `Q${hd.cx + r * 0.1 + sh} ${hd.cy - r * 0.62 + sy} ${hd.cx - r * 0.06 + sh} ${hd.cy - r * 0.2 + sy} Z`;
        }
        if (e.type === 'rose') {
            return `M${hd.cx - r * 0.5 + sh} ${hd.cy - r * 0.72 + sy} Q${hd.cx - r * 1.5 + sh} ${hd.cy - r * 1.2 + sy} ${hd.cx - r * 1.75 + sh} ${hd.cy - r * 0.35 + sy} ` +
                `Q${hd.cx - r * 1.1 + sh} ${hd.cy - r * 0.35 + sy} ${hd.cx - r * 0.2 + sh} ${hd.cy - r * 0.2 + sy} Z`;
        }
        return '';
    }

    function tailSVG(br, ctx) {
        const { b, fillMain, OL, still, light, dark } = ctx;
        const t = br.tail, s = t.s || 1;
        const px = b.x0 + 10, py = b.top + 10;
        const solid = d => `<path d="${d}" fill="${fillMain}" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>`;
        const strands = (arr, col, w = 1.3, op = .45) => `<path d="${arr}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
        let shape = '';
        if (t.type === 'plume') {            // feathered retriever / setter tail
            const d = `M${px + 12} ${py + 13} C${px - 10} ${py + 12} ${px - 28 * s} ${py - 4} ${px - 32 * s} ${py - 34 * s} ` +
                `C${px - 22 * s} ${py - 30 * s} ${px - 18 * s} ${py - 22 * s} ${px - 12 * s} ${py - 22 * s} C${px - 6} ${py - 14} ${px + 2} ${py - 7} ${px + 12} ${py - 3} Z`;
            shape = solid(d) +
                `<g clip-path="none">` + strands(`M${px - 6} ${py + 4} C${px - 16 * s} ${py} ${px - 24 * s} ${py - 14 * s} ${px - 28 * s} ${py - 28 * s}`, light, 3, .5) +
                strands(`M${px - 2} ${py + 8} C${px - 14 * s} ${py + 6} ${px - 22 * s} ${py - 6 * s} ${px - 25 * s} ${py - 18 * s}`, dark, 1.2, .5) +
                strands(`M${px - 12 * s} ${py - 6} l-4 6 M${px - 18 * s} ${py - 14 * s} l-5 5 M${px - 23 * s} ${py - 24 * s} l-4 4`, dark, 1.2, .55) + `</g>`;
        } else if (t.type === 'stub') {
            shape = `<path d="M${px + 8} ${py + 12} C${px - 6} ${py + 12} ${px - 14} ${py + 2} ${px - 12} ${py - 8} C${px - 4} ${py - 6} ${px + 6} ${py - 2} ${px + 12} ${py + 2} Z" fill="${fillMain}" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>` +
                strands(`M${px - 2} ${py + 4} l-6 -6`, dark, 1.2, .5);
        } else if (t.type === 'whip') {       // long tapered tail
            const e = [px - 34 * s, py - 22 * s];
            shape = solid(`M${px + 12} ${py + 10} C${px - 12} ${py + 14} ${px - 24 * s} ${py + 4} ${e[0]} ${e[1]} C${px - 26 * s} ${py - 6} ${px - 14} ${py - 2} ${px + 12} ${py - 3} Z`) +
                strands(`M${px - 2} ${py + 5} C${px - 16 * s} ${py + 6} ${px - 24 * s} ${py - 4} ${px - 31 * s} ${py - 18 * s}`, light, 1.8, .5);
        } else if (t.type === 'curl') {       // thick spitz curl over the back
            const w = Math.min(s, 1.2);
            shape = solid(`M${px + 8} ${py + 12} C${px - 18 * s} ${py + 12} ${px - 28 * s} ${py - 14 * s} ${px - 8} ${py - 28 * s} C${px + 8} ${py - 36 * s} ${px + 26 * s} ${py - 22 * s} ${px + 14} ${py - 8} ` +
                `C${px + 8} ${py - 14 * s} ${px - 2} ${py - 14 * s} ${px - 6} ${py - 8} C${px - 4} ${py - 2} ${px + 2} ${py - 2} ${px + 12} ${py - 2} Z`) +
                strands(`M${px - 10} ${py + 2} C${px - 20 * s} ${py - 4} ${px - 18 * s} ${py - 18 * s} ${px - 6} ${py - 24 * s}`, light, 3 * w, .5) +
                strands(`M${px - 12} ${py - 4} l-4 3 M${px - 16 * s} ${py - 14 * s} l-4 1 M${px - 4} ${py - 26 * s} l-1 -4`, dark, 1.2, .55);
        } else if (t.type === 'pom') {        // clipped poodle tail + pompon
            shape = solid(`M${px + 10} ${py + 10} C${px - 2} ${py + 12} ${px - 10} ${py + 2} ${px - 14} ${py - 8} L${px - 8} ${py - 10} C${px - 2} ${py - 4} ${px + 4} ${py - 2} ${px + 12} ${py - 2} Z`) +
                [[-20, -16, 9], [-29, -11, 7.5], [-24, -25, 8], [-14, -22, 7]].map(c => `<circle cx="${px + c[0]}" cy="${py + c[1]}" r="${c[2]}" fill="${fillMain}" stroke="${OL}" stroke-width="2.4"/>`).join('') +
                `<circle cx="${px - 22}" cy="${py - 19}" r="4" fill="#fff" opacity=".22"/>`;
        }
        const wag = still ? '' : `<animateTransform attributeName="transform" type="rotate" values="-9 ${px + 6} ${py + 10};11 ${px + 6} ${py + 10};-9 ${px + 6} ${py + 10}" keyTimes="0;.5;1" calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1" dur="0.6s" repeatCount="indefinite"/>`;
        return `<g>${shape}${wag}</g>`;
    }

    /* =====================================================
       COAT PATTERNS (laid over body + head)
    ===================================================== */
    function patternSVG(name, color, br) {
        const b = br.body, hd = br.head;
        const bw = b.x1 - b.x0, bh = b.bot - b.top;
        const P = (u, v) => [b.x0 + u * bw, b.top + v * bh];
        let out = '';
        if (name === 'spots') {
            [[.12, .35, 7], [.3, .75, 6], [.44, .25, 8], [.6, .7, 6.5], [.78, .3, 5], [.9, .62, 5], [.22, .1, 4], [.68, .08, 4.5]].forEach(s => { const [x, y] = P(s[0], s[1]); out += `<circle cx="${x}" cy="${y}" r="${s[2]}"/>`; });
            out += `<circle cx="${hd.cx - hd.r * 0.25}" cy="${hd.cy - hd.r * 0.55}" r="${hd.r * 0.2}"/><circle cx="${hd.cx + hd.r * 0.55}" cy="${hd.cy + hd.r * 0.15}" r="${hd.r * 0.11}"/>`;
            return `<g fill="${color}">${out}</g>`;
        }
        if (name === 'stripes') {
            for (let i = 0; i < 6; i++) { const x = b.x0 + 14 + i * (bw - 28) / 5; out += `<path d="M${x} ${b.top - 6} Q${x + 7} ${b.top + bh * 0.5} ${x - 4} ${b.bot + 6}"/>`; }
            out += `<path d="M${hd.cx - hd.r * 0.1} ${hd.cy - hd.r * 1.05} L${hd.cx} ${hd.cy - hd.r * 0.5}"/><path d="M${hd.cx + hd.r * 0.25} ${hd.cy - hd.r * 1.0} L${hd.cx + hd.r * 0.3} ${hd.cy - hd.r * 0.55}"/><path d="M${hd.cx + hd.r * 0.7} ${hd.cy + hd.r * 0.05} L${hd.cx + hd.r * 0.35} ${hd.cy + hd.r * 0.15}"/>`;
            return `<g stroke="${color}" stroke-width="5" stroke-linecap="round" fill="none">${out}</g>`;
        }
        if (name === 'patches') {
            const a = P(0.28, 0.5), c = P(0.72, 0.85);
            return `<g fill="${color}"><ellipse cx="${a[0]}" cy="${a[1]}" rx="${bw * 0.2}" ry="${bh * 0.42}"/><ellipse cx="${c[0]}" cy="${c[1]}" rx="${bw * 0.14}" ry="${bh * 0.3}"/><ellipse cx="${hd.cx - hd.r * 0.2}" cy="${hd.cy - hd.r * 0.35}" rx="${hd.r * 0.55}" ry="${hd.r * 0.5}"/></g>`;
        }
        if (name === 'dots') {                                    // galaxy / ghost sparkle
            const R = rng(7);
            for (let i = 0; i < 26; i++) {
                const x = b.x0 + R() * (hd.cx + hd.r - b.x0), y = b.top - 8 + R() * (bh + 24), r = 0.9 + R() * 1.7;
                out += i % 6 === 0 ? star(x, y, r * 2.2, color) : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}"/>`;
            }
            return out;
        }
        return '';
    }

    /* =====================================================
       COSMETICS (local coordinates, scaled by head size)
       hats: origin = top of the head, y negative = up
    ===================================================== */
    const sw = (w = 2) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
    const flower = (x, y, c, r = 3.4) => {
        let s = '';
        for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; s += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${(r * 0.8).toFixed(1)}" fill="${c}" stroke="${INK}" stroke-width="1"/>`; }
        return s + `<circle cx="${x}" cy="${y}" r="${(r * 0.62).toFixed(1)}" fill="#ffd54f" stroke="${INK}" stroke-width="1"/>`;
    };

    const HATS = {
        party: () => `<path d="M-15 3 L1 -38 L16 3Z" fill="#ff5ca8" ${sw()}/>
      <path d="M-9.1 -12 L10.5 -12 L13.4 -4 L-12.3 -4Z" fill="#fff176"/><path d="M-3.7 -26 L5.4 -26 L7.6 -20 L-6 -20Z" fill="#fff176"/>
      <ellipse cx="0.5" cy="3" rx="16.5" ry="3.2" fill="#d81b60" ${sw()}/><circle cx="1" cy="-39" r="5" fill="#ffd54f" ${sw(1.8)}/>`,
        beanie: () => `<path d="M-19 4 C-21 -25 21 -25 19 4 Z" fill="#e53935" ${sw()}/>
      <path d="M-10 3 L-11 -15 M-3 3 L-3 -18 M4 3 L4 -18 M11 3 L10 -15" stroke="#b71c1c" stroke-width="1.6" fill="none"/>
      <rect x="-22" y="-5" width="44" height="12" rx="5.5" fill="#c62828" ${sw()}/>
      <path d="M-14 -4 L-14 6 M-7 -4 L-7 6 M0 -4 L0 6 M7 -4 L7 6 M14 -4 L14 6" stroke="#ef5350" stroke-width="1.4"/>
      <circle cx="0" cy="-23" r="7.5" fill="#fff" ${sw(1.8)}/><circle cx="-2" cy="-25" r="1.3" fill="#ddd"/><circle cx="3" cy="-21" r="1.3" fill="#ddd"/>`,
        chef: () => `<g fill="#fff" ${sw()}><circle cx="-11" cy="-14" r="9.5"/><circle cx="11" cy="-14" r="9.5"/><circle cx="0" cy="-21" r="12"/><rect x="-16" y="-9" width="32" height="15" rx="3"/></g>
      <path d="M-6 -8 L-6 4 M0 -8 L0 4 M6 -8 L6 4" stroke="#d8d8d8" stroke-width="1.4"/>`,
        cowboy: () => `<path d="M-31 4 C-24 11 -10 9 0 7 C10 9 24 11 31 4 C27 -3 21 -2 16 -3 L-16 -3 C-21 -2 -27 -3 -31 4 Z" fill="#b87a3d" ${sw()}/>
      <path d="M-16 -2 C-19 -20 -10 -25 -4 -21 C-1 -19 1 -19 4 -21 C10 -25 19 -20 16 -2 Z" fill="#d09a55" ${sw()}/>
      <rect x="-16.4" y="-9" width="32.8" height="6.5" fill="#5b3410"/>${star(0, -6, 4.2, '#ffd54f', `stroke="${INK}" stroke-width="1"`)}`,
        tophat: () => `<rect x="-14" y="-37" width="28" height="38" rx="2.5" fill="#2e2e38" ${sw()}/>
      <rect x="-9.5" y="-34" width="4" height="30" rx="2" fill="#fff" opacity=".16"/>
      <rect x="-23" y="-2" width="46" height="8" rx="4" fill="#1d1d24" ${sw()}/>
      <rect x="-14" y="-13" width="28" height="8" fill="#c62828"/><rect x="-4.5" y="-14.5" width="9" height="11" rx="1.6" fill="none" stroke="#ffd54f" stroke-width="2.2"/>`,
        santa: () => `<path d="M-19 4 C-21 -19 1 -38 25 -21 C20 -19 17 -10 19 4 Z" fill="#e53935" ${sw()}/>
      <rect x="-23" y="-3" width="46" height="12" rx="6" fill="#fff" ${sw()}/><circle cx="25" cy="-21" r="7" fill="#fff" ${sw(1.8)}/>`,
        wizard: () => `<ellipse cx="0" cy="4" rx="28" ry="6.5" fill="#4527a0" ${sw()}/>
      <path d="M-17 4 C-12 -20 -4 -42 12 -58 C10 -42 15 -20 18 4 Z" fill="#5e35b1" ${sw()}/>
      <path d="M-16.5 -3 L17.5 -3 L18 4 L-17 4Z" fill="#ffd54f"/>
      <circle cx="-3" cy="-22" r="5.2" fill="#ffd54f"/><circle cx="-1" cy="-23" r="4.4" fill="#5e35b1"/>${star(7, -14, 3, '#ffd54f')}${star(5, -34, 2.4, '#ffd54f')}`,
        halo: () => `<ellipse cx="0" cy="-15" rx="19" ry="5.6" fill="none" stroke="#fff3a0" stroke-width="10" opacity=".35"/>
      <ellipse cx="0" cy="-15" rx="19" ry="5.6" fill="none" stroke="#e0a800" stroke-width="5"/>
      <ellipse cx="0" cy="-15" rx="19" ry="5.6" fill="none" stroke="#ffd83a" stroke-width="3.2"/>`,
        crown: () => `<path d="M-18 4 L-18 -17 L-9 -7 L0 -24 L9 -7 L18 -17 L18 4 Z" fill="#ffca28" ${sw()}/>
      <path d="M-18 -3 L18 -3 L18 4 L-18 4Z" fill="#f0a800"/>
      <circle cx="-18" cy="-18" r="2.6" fill="#ffe082" ${sw(1.4)}/><circle cx="0" cy="-25" r="3" fill="#ffe082" ${sw(1.4)}/><circle cx="18" cy="-18" r="2.6" fill="#ffe082" ${sw(1.4)}/>
      <circle cx="0" cy="-10" r="3.2" fill="#e53935" ${sw(1.2)}/><circle cx="-10" cy="0.5" r="2.2" fill="#42a5f5"/><circle cx="10" cy="0.5" r="2.2" fill="#43a047"/>`,
        elf: () => `<path d="M-17 4 L-14 -9 C-10 -22 2 -29 15 -24 C21 -21 22 -15 18 -13 C14 -13 12 -7 17 4 Z" fill="#2e9b4f" ${sw()}/>
      <path d="M-18 -3 L18 -3 L18 5 L-18 5 Z" fill="#d32f2f" ${sw(1.6)}/><circle cx="-11" cy="1" r="1.5" fill="#fff"/><circle cx="-3" cy="1" r="1.5" fill="#fff"/><circle cx="5" cy="1" r="1.5" fill="#fff"/><circle cx="13" cy="1" r="1.5" fill="#fff"/>
      <path d="M-9 -12 Q-3 -18 5 -19" stroke="#6fd18a" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>
      <circle cx="20" cy="-12" r="3.6" fill="#ffca28" ${sw(1.4)}/><path d="M17.8 -12 h4.4" stroke="#b8860b" stroke-width="1.1"/>`,
        pinkcrown: () => `<path d="M-18 4 L-18 -17 L-9 -7 L0 -24 L9 -7 L18 -17 L18 4 Z" fill="#f9b4d0" ${sw()}/>
      <path d="M-18 -3 L18 -3 L18 4 L-18 4Z" fill="#ec7fae"/><path d="M-12 -6 L-9 -13 M12 -6 L9 -13" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
      <circle cx="-18" cy="-18" r="2.6" fill="#fff" ${sw(1.4)}/><circle cx="0" cy="-25" r="3.2" fill="#fff" ${sw(1.4)}/><circle cx="18" cy="-18" r="2.6" fill="#fff" ${sw(1.4)}/>
      <path d="M0 -12.5 C-4.4 -16 -3.4 -19.6 0 -17.6 C3.4 -19.6 4.4 -16 0 -12.5Z" fill="#ff4f8b" ${sw(1.1)}/><circle cx="-10" cy="0.5" r="2.1" fill="#fff"/><circle cx="10" cy="0.5" r="2.1" fill="#fff"/>
      <path d="M-22 -22 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2z" fill="#fff" opacity=".9"/>`,
        grad: () => `<path d="M-14 -5 L-14 5 C-8 10 8 10 14 5 L14 -5 Z" fill="#34343c" ${sw()}/>
      <path d="M-29 -12 L0 -25 L29 -12 L0 1 Z" fill="#26262c" ${sw()}/><path d="M-15 -12 L0 -18 L15 -12" stroke="#fff" stroke-width="1.4" fill="none" opacity=".2"/>
      <circle cx="0" cy="-12" r="2.4" fill="#ffca28"/><path d="M0 -12 L23 -9 L23 6" stroke="#ffca28" stroke-width="2" fill="none"/>
      <rect x="20.8" y="5" width="4.4" height="10" rx="1.5" fill="#ffca28" ${sw(1.2)}/>`,
        pirate: () => `<path d="M-31 6 C-24 -18 -9 -25 0 -25 C9 -25 24 -18 31 6 C17 -2 8 -3 0 -3 C-8 -3 -17 -2 -31 6 Z" fill="#26262c" ${sw()}/>
      <path d="M-31 6 C-17 -2 -8 -3 0 -3 C8 -3 17 -2 31 6" fill="none" stroke="#ffd54f" stroke-width="2.4"/>
      <circle cx="0" cy="-14" r="5.4" fill="#fff"/><circle cx="-2" cy="-14.5" r="1.3" fill="#222"/><circle cx="2" cy="-14.5" r="1.3" fill="#222"/>
      <path d="M-9 -8 L9 -18 M9 -8 L-9 -18" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
        headphones: () => `<path d="M-9 14 C-14 -12 12 -20 22 8" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M-9 14 C-14 -12 12 -20 22 8" fill="none" stroke="#546e7a" stroke-width="4.4" stroke-linecap="round"/>
      <ellipse cx="-9" cy="16" rx="8.5" ry="10.5" fill="#e53935" ${sw()}/><ellipse cx="-9" cy="16" rx="4.6" ry="6.4" fill="#b71c1c"/><ellipse cx="-11" cy="12" rx="1.6" ry="3" fill="#fff" opacity=".4"/>`,
        bunny: () => `<g ${sw()}><path d="M-13 4 C-20 -18 -16 -42 -8 -48 C-1 -40 -3 -16 -2 4 Z" fill="#f4f4f4"/><path d="M2 3 C-1 -16 3 -38 11 -44 C19 -36 16 -14 11 4 Z" fill="#f4f4f4" transform="rotate(16 6 4)"/></g>
      <path d="M-11 0 C-15 -16 -12 -34 -8 -40 C-4 -32 -5 -14 -5 0 Z" fill="#f7b4c6"/><path d="M4 0 C1 -14 5 -32 10 -38 C15 -32 13 -14 10 0 Z" fill="#f7b4c6" transform="rotate(16 6 4)"/>`,
        flower: () => `<path d="M-20 7 C-14 -13 14 -13 20 7" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M-20 7 C-14 -13 14 -13 20 7" fill="none" stroke="#5a9c3c" stroke-width="3.4" stroke-linecap="round"/>
      ${flower(-15, 1, '#ff8fb1')}${flower(-6, -7, '#fff')}${flower(4, -9, '#c9a0ff')}${flower(13, -5, '#ffb067')}${flower(19, 3, '#ff8fb1', 3)}`,
        viking: () => `<g transform="scale(-1 1)"><path d="M-16 -4 C-35 -4 -40 -24 -33 -36 C-28 -26 -22 -18 -13 -17 Z" fill="#f4e6c3" ${sw()}/></g>
      <path d="M-16 -4 C-35 -4 -40 -24 -33 -36 C-28 -26 -22 -18 -13 -17 Z" fill="#f4e6c3" ${sw()}/>
      <path d="M-20 5 C-21 -23 21 -23 20 5 Z" fill="#a3afb8" ${sw()}/><rect x="-21" y="-3" width="42" height="9" rx="2" fill="#78878f" ${sw()}/>
      <circle cx="-12" cy="1.5" r="1.7" fill="#d8e0e5"/><circle cx="0" cy="1.5" r="1.7" fill="#d8e0e5"/><circle cx="12" cy="1.5" r="1.7" fill="#d8e0e5"/>
      <path d="M-8 -14 C-6 -19 6 -19 8 -14" fill="none" stroke="#fff" stroke-width="1.8" opacity=".4"/>`,
        propeller: (still) => `<path d="M-19 4 C-21 -24 21 -24 19 4 Z" fill="#e53935" ${sw()}/>
      <path d="M0 -19 L-3 4 M0 -19 L8 3" stroke="${INK}" stroke-width="1.2" fill="none"/>
      <path d="M0 -19 C6 -19 14 -14 19 4 L8 3 Z" fill="#1e88e5"/><path d="M0 -19 C-6 -19 -14 -14 -19 4 L-4 3 Z" fill="#fdd835"/>
      <rect x="-21" y="-3" width="42" height="9" rx="4.5" fill="#43a047" ${sw()}/><circle cx="0" cy="-23" r="3.6" fill="#ffd54f" ${sw(1.6)}/>
      <g><ellipse cx="-10" cy="-27" rx="10" ry="2.6" fill="#e53935" ${sw(1.4)}/><ellipse cx="10" cy="-27" rx="10" ry="2.6" fill="#1e88e5" ${sw(1.4)}/>
      ${still ? '' : '<animateTransform attributeName="transform" type="rotate" values="0 0 -27;360 0 -27" dur="0.5s" repeatCount="indefinite"/>'}</g>`
    };

    /* faces: origin = centre of the eye */
    const FACES = {
        nerd: () => `<path d="M-9 -1 L-27 -6" stroke="#2b2b2b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="10.5" fill="#cfe9ff" fill-opacity=".38" stroke="#2b2b2b" stroke-width="2.8"/><path d="M-5 -5 Q-1 -8 4 -6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`,
        hearts: () => `<path d="M-9 -1 L-27 -6" stroke="#b0123f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M0 6 C-14 -3 -11 -13 0 -7 C11 -13 14 -3 0 6Z" fill="#ff4d79" stroke="#b0123f" stroke-width="2.2" stroke-linejoin="round"/><path d="M-6 -3 Q-4 -6 -1 -5" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>`,
        sunglasses: () => `<path d="M-10 -2 L-28 -7" stroke="#111" stroke-width="3" stroke-linecap="round"/>
      <rect x="-11" y="-8" width="23" height="16" rx="6" fill="#16161d" stroke="#000" stroke-width="1.6"/><path d="M-6 -5 L1 -5 M-8 -1 L-3 -1" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>`,
        monocle: () => `<circle cx="0" cy="0" r="9.5" fill="#fff" fill-opacity=".25" stroke="#e0a800" stroke-width="2.8"/><path d="M-4 -5 Q0 -7 3 -5" stroke="#fff" stroke-width="1.8" fill="none"/>
      <path d="M2 9.5 Q6 22 -2 32" fill="none" stroke="#e0a800" stroke-width="1.6" stroke-dasharray="2.4 1.8"/>`,
        stars: () => `<path d="M-10 -2 L-28 -7" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>${star(0, 0, 13.5, '#ffd83a', `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`)}${star(0, 0, 6, '#fff7b0', 'opacity=".7"')}`,
        goggles: () => `<path d="M-10 -2 L-30 -8" stroke="#6d4c41" stroke-width="5" stroke-linecap="round"/><path d="M-10 -2 L-30 -8" stroke="#a1887f" stroke-width="2" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="11.5" fill="#6d4c41" stroke="${INK}" stroke-width="2"/><circle cx="0" cy="0" r="8.6" fill="#59b7ff" stroke="#3b2a1a" stroke-width="1.4"/>
      <path d="M-5 -4 Q-1 -8 4 -5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M-6 3 Q0 8 6 2" stroke="#1e6fb8" stroke-width="1.6" fill="none"/>`,
        eyepatch: () => `<path d="M-10 -5 L-30 -16 M-10 3 L-30 6" stroke="#222" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="0" cy="0" rx="10.5" ry="9" fill="#1d1d22" stroke="#000" stroke-width="1.4"/><path d="M-5 -4 Q0 -6 4 -4" stroke="#fff" stroke-width="1.4" fill="none" opacity=".25"/>`,
        hero: () => `<path d="M-15 -7 Q0 -15 16 -7 Q22 3 8 9 Q3 3 -2 9 Q-20 6 -15 -7 Z M0 0 m-4.6 0 a4.6 5.6 0 1 0 9.2 0 a4.6 5.6 0 1 0 -9.2 0 Z" fill="#1e88e5" fill-rule="evenodd" stroke="#0b3f7a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-14 -4 Q-24 -8 -30 -14" stroke="#1e88e5" stroke-width="3" fill="none" stroke-linecap="round"/>`
    };

    /* neckwear: origin on the neck, the band runs across the neck (upper-left to lower-right) */
    const NA = [-14, -13], NC = [4, -1], NE = [15, 12];
    const nb = t => [(1 - t) * (1 - t) * NA[0] + 2 * t * (1 - t) * NC[0] + t * t * NE[0], (1 - t) * (1 - t) * NA[1] + 2 * t * (1 - t) * NC[1] + t * t * NE[1]];
    const NPATH = `M${NA[0]} ${NA[1]} Q${NC[0]} ${NC[1]} ${NE[0]} ${NE[1]}`;
    const band = (c, w = 4.6) => `<path d="${NPATH}" fill="none" stroke="${INK}" stroke-width="${w + 3.6}" stroke-linecap="round"/><path d="${NPATH}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    const tag = (t, c = '#ffd54f') => { const [x, y] = nb(t); return `<circle cx="${(x - 1).toFixed(1)}" cy="${(y + 6.5).toFixed(1)}" r="4.8" fill="${c}" ${sw(1.6)}/><path d="M${(x - 2.8).toFixed(1)} ${(y + 5.5).toFixed(1)} l1.6 1.6 l2.4 -2.6" stroke="#b8860b" stroke-width="1.2" fill="none"/>`; };
    const along = (n, fn) => { let o = ''; for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); const [x, y] = nb(t); o += fn(x, y, i, t); } return o; };
    const NECKS = {
        collar_red: () => band('#e53935') + tag(0.82),
        collar_blue: () => band('#1e88e5') + tag(0.82),
        collar_green: () => band('#43a047') + tag(0.82),
        candycane: () => band('#fafafa', 11) + along(7, (x, y) => `<path d="M${(x - 2.6).toFixed(1)} ${(y - 5).toFixed(1)} L${(x + 2.6).toFixed(1)} ${(y + 5).toFixed(1)}" stroke="#e53935" stroke-width="3.6" stroke-linecap="round"/>`) +
            (() => { const [x, y] = nb(0.9); return `<path d="M${(x - 3).toFixed(1)} ${(y + 3).toFixed(1)} l-2 12 l6 0 l1 -10 Z" fill="#fafafa" ${sw(1.6)}/><path d="M${(x - 4).toFixed(1)} ${(y + 9).toFixed(1)} l6 1 M${(x - 4.5).toFixed(1)} ${(y + 13).toFixed(1)} l5.5 0" stroke="#e53935" stroke-width="2.2"/>`; })(),
        holly: () => band('#2e7d32', 7.5) + (() => { const [x, y] = nb(0.8); return `<g transform="translate(${(x - 1).toFixed(1)} ${(y + 6).toFixed(1)})"><path d="M0 0 C-9 -3 -11 5 -4 8 C-3 3 -1 2 0 0Z" fill="#43a047" ${sw(1.3)}/><path d="M0 0 C9 -3 11 5 4 8 C3 3 1 2 0 0Z" fill="#2e9b4f" ${sw(1.3)}/><circle cx="-1.6" cy="3.2" r="2.6" fill="#e53935" ${sw(1.1)}/><circle cx="2.2" cy="2.4" r="2.4" fill="#e53935" ${sw(1.1)}/><circle cx="-1.4" cy="2.4" r=".7" fill="#fff" opacity=".8"/></g>`; })() +
            along(4, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="#e53935"/>`),
        collar_babypink: () => { const [x, y] = nb(0.82); return band('#f8c9dd', 7.5) + `<g transform="translate(${(x - 1).toFixed(1)} ${(y + 7).toFixed(1)})"><path d="M0 5 C-7 -0.5 -6 -6.5 0 -3.2 C6 -6.5 7 -0.5 0 5Z" fill="#ff6fa5" ${sw(1.5)}/><circle cx="-2" cy="-2" r="1.1" fill="#fff" opacity=".8"/></g>` + along(4, (px, py) => `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1.1" fill="#fff" opacity=".9"/>`); },
        bell: () => { const [x, y] = nb(0.82); return band('#e53935') + `<circle cx="${x - 1}" cy="${y + 7.5}" r="5.6" fill="#ffca28" ${sw(1.6)}/><path d="M${x - 6} ${y + 8} L${x + 4} ${y + 8}" stroke="#b8860b" stroke-width="1.4"/><circle cx="${x - 1}" cy="${y + 10.5}" r="1.3" fill="#7a5a00"/>`; },
        bandana: () => `<path d="M-16 -15 L18 14 L1 36 Z" fill="#e53935" ${sw()}/><path d="M-16 -15 L18 14" stroke="#b71c1c" stroke-width="3.4"/>
      <circle cx="-2" cy="2" r="2" fill="#fff"/><circle cx="8" cy="12" r="2" fill="#fff"/><circle cx="0" cy="18" r="2" fill="#fff"/><circle cx="-6" cy="-4" r="1.6" fill="#fff"/><circle cx="4" cy="26" r="1.6" fill="#fff"/>`,
        bowtie: () => `<path d="M10 8 L-5 -1 L-5 17 Z M10 8 L25 -1 L25 17 Z" fill="#ec407a" ${sw()}/><rect x="5.5" y="2.5" width="9" height="11" rx="3" fill="#ad1457" ${sw(1.8)}/>`,
        tie: () => band('#fff', 7) + `<path d="M8 10 L17 10 L19 38 L12.5 44 L6 38 Z" fill="#1e5fbf" ${sw()}/><path d="M8 10 L17 10 L14.5 17 L10.5 17 Z" fill="#164a99" ${sw(1.4)}/><path d="M8 26 L18 30 M7 34 L18.5 38" stroke="#6fa3ee" stroke-width="2.2"/>`,
        chain: () => `<path d="${NPATH}" fill="none" stroke="${INK}" stroke-width="6.8" stroke-linecap="round"/><path d="${NPATH}" fill="none" stroke="#ffca28" stroke-width="4" stroke-dasharray="5 2.6" stroke-linecap="round"/>
      <path d="M12 12 L19 20 L12 29 L5 20 Z" fill="#ffca28" ${sw(1.8)}/><path d="M12 15 L15 20 L12 25" fill="none" stroke="#fff3b0" stroke-width="1.6"/>`,
        spiked: () => band('#25252b', 8) + along(5, (x, y, i, t) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#d7dde1" stroke="#555" stroke-width="1"/>`).replace(/<circle/, '<circle'),
        scarf: () => band('#e53935', 13) + along(4, (x, y, i) => `<path d="M${(x - 2.5).toFixed(1)} ${(y - 4).toFixed(1)} L${(x + 2.5).toFixed(1)} ${(y + 4).toFixed(1)}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`) +
            `<path d="M7 11 L19 12 L21 36 L10 36 Z" fill="#e53935" ${sw()}/><path d="M8 20 L20 21 M9 28 L21 29" stroke="#fff" stroke-width="3"/><path d="M10 36 L10 40 M13 36 L13 41 M16 36 L16 40 M19 36 L19 40" stroke="#b71c1c" stroke-width="2" stroke-linecap="round"/>`,
        collar_rainbow: () => `<g fill="none" stroke-linecap="round"><path d="M${NA[0] - 3} ${NA[1] + 3} Q${NC[0] - 3} ${NC[1] + 3} ${NE[0] - 3} ${NE[1] + 3}" stroke="${INK}" stroke-width="14.6"/>
      <path d="M${NA[0] - 3} ${NA[1] + 3} Q${NC[0] - 3} ${NC[1] + 3} ${NE[0] - 3} ${NE[1] + 3}" stroke="#ef5350" stroke-width="4.2"/>
      <path d="${NPATH}" stroke="#ffd54f" stroke-width="4.2"/>
      <path d="M${NA[0] + 3} ${NA[1] - 3} Q${NC[0] + 3} ${NC[1] - 3} ${NE[0] + 3} ${NE[1] - 3}" stroke="#42a5f5" stroke-width="4.2"/></g>${tag(0.84)}`,
        medal: () => `<path d="M-12 -12 L8 24 M16 11 L8 24" stroke="${INK}" stroke-width="8.6" stroke-linecap="round"/><path d="M-12 -12 L8 24" stroke="#e53935" stroke-width="5.4" stroke-linecap="round"/><path d="M16 11 L8 24" stroke="#1e88e5" stroke-width="5.4" stroke-linecap="round"/>
      <circle cx="8" cy="30" r="9" fill="#ffca28" ${sw(2)}/><circle cx="8" cy="30" r="6" fill="none" stroke="#e0a800" stroke-width="1.4"/>${star(8, 30, 4.6, '#fff3b0')}`,
        lei: () => {
            const cols = ['#ff7aa8', '#ffb347', '#fff176', '#ff7aa8', '#ffb347', '#fff176', '#ff7aa8'];
            return `<path d="${NPATH}" fill="none" stroke="#3d8f3d" stroke-width="6" stroke-linecap="round"/>` + along(7, (x, y, i) => flower(x.toFixed(1) * 1, y.toFixed(1) * 1, cols[i], 3.7));
        },
        pearls: () => along(9, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="#fbfaf5" ${sw(1.4)}/><circle cx="${(x - 1.3).toFixed(1)}" cy="${(y - 1.4).toFixed(1)}" r="1.2" fill="#fff"/>`),
        cape: () => band('#d32f2f', 6) + (() => { const [x, y] = nb(0.86); return `<circle cx="${x}" cy="${y + 1}" r="4.6" fill="#ffca28" ${sw(1.6)}/>`; })()
    };

    /* cape flows behind the whole body */
    function capeBehind(b, hd) {
        const x = hd.cx - hd.r * 0.7, y = hd.cy + hd.r * 0.55;
        return `<path d="M${x} ${y} C${x - 30} ${y - 8} ${b.x0 + 20} ${b.top - 10} ${b.x0 - 22} ${b.top + 6} C${b.x0 - 8} ${b.top + 20} ${b.x0 - 4} ${b.bot - 4} ${b.x0 - 14} ${b.bot + 10} C${b.x0 + 24} ${b.bot - 8} ${b.x1 - 30} ${b.bot - 10} ${x + 12} ${y + 24} Z" fill="#d32f2f" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M${b.x0 + 4} ${b.top + 20} C${b.x0 + 30} ${b.top + 24} ${b.x1 - 40} ${b.top + 26} ${x - 4} ${y + 10}" fill="none" stroke="#9f1d1d" stroke-width="3" opacity=".6"/>`;
    }

    /* ---------- extra cosmetics (season 2 additions) ---------- */
    const antler = (dx, m) => {
        const d = `M${dx} 3 C${dx + m * 2} -8 ${dx + m * 4} -16 ${dx + m * 2} -26 M${dx + m * 3} -13 C${dx + m * 9} -15 ${dx + m * 13} -19 ${dx + m * 14} -26 M${dx + m * 2} -22 C${dx - m * 2} -26 ${dx - m * 4} -29 ${dx - m * 4} -35`;
        return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="7.4" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#a9733d" stroke-width="4" stroke-linecap="round"/>`;
    };
    Object.assign(HATS, {
        sailor: () => `<path d="M-20 3 C-21 -17 21 -17 20 3 Z" fill="#f6f6f6" ${sw()}/><rect x="-21" y="-3" width="42" height="9" rx="4" fill="#1e3a8a" ${sw()}/><path d="M-9 1.5 L9 1.5" stroke="#fff" stroke-width="1.6"/>${star(0, -9, 3.4, '#ffd54f')}`,
        witch: () => `<ellipse cx="0" cy="4" rx="29" ry="6" fill="#2b1b3d" ${sw()}/><path d="M-16 4 C-12 -16 -6 -34 6 -46 C14 -51 21 -45 15 -40 C12 -22 15 -10 17 4 Z" fill="#3b2457" ${sw()}/><path d="M-15.4 -3 L16.8 -3 L17 4 L-16 4Z" fill="#ff8f2e"/><rect x="-3.5" y="-4.5" width="8" height="9" rx="1.4" fill="none" stroke="#ffd54f" stroke-width="2"/>${star(-3, -22, 2.6, '#ffd54f')}`,
        cap: () => `<path d="M-19 4 C-21 -21 19 -23 20 4 Z" fill="#1e88e5" ${sw()}/><path d="M13 2 C25 -2 38 1 41 6 C31 9 20 8 13 6 Z" fill="#1565c0" ${sw()}/><path d="M0 -20 L0 3" stroke="#0d47a1" stroke-width="1.4"/><circle cx="0" cy="-20" r="2.4" fill="#0d47a1"/>${star(-8, -7, 4, '#fff')}`,
        antlers: () => antler(-12, -1) + antler(10, 1) + `<path d="M-18 4 C-12 -2 12 -2 18 4" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
        tiara: () => `<path d="M-17 4 L-14 -9 L-7 -1 L0 -15 L7 -1 L14 -9 L17 4 Z" fill="#f8d96a" ${sw()}/><circle cx="0" cy="-8" r="3.4" fill="#ec407a" ${sw(1.2)}/><circle cx="-12" cy="-2" r="2" fill="#4fc3f7"/><circle cx="12" cy="-2" r="2" fill="#4fc3f7"/>${star(0, -19, 2.6, '#fff7b0')}`,
        fez: () => `<path d="M-14 4 L-11 -14 L11 -14 L14 4 Z" fill="#c62828" ${sw()}/><ellipse cx="0" cy="-14" rx="11" ry="3.4" fill="#e53935" ${sw(1.8)}/><path d="M0 -14 Q17 -11 18 5" stroke="${INK}" stroke-width="3.4" fill="none"/><path d="M0 -14 Q17 -11 18 5" stroke="#ffd54f" stroke-width="1.8" fill="none"/><circle cx="18" cy="8" r="3" fill="#ffd54f" ${sw(1.4)}/>`,
        ninja: () => `<path d="M-21 6 C-12 -4 12 -4 21 6 L21 -3 C12 -13 -12 -13 -21 -3 Z" fill="#26262c" ${sw()}/><rect x="-8" y="-9.5" width="16" height="8" rx="2" fill="#cfd8dc" ${sw(1.4)}/><path d="M-3 -7.5 a2.4 2.4 0 1 1 3 2 a1.2 1.2 0 1 0 -1 -1.4" stroke="#546e7a" stroke-width="1.2" fill="none"/><path d="M-20 -1 L-32 6 L-25 7 L-33 16 L-21 8Z" fill="#26262c" ${sw(1.8)}/>`
    });
    Object.assign(FACES, {
        round: () => `<path d="M-10 -1 L-27 -6" stroke="#b45309" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="0" cy="0" r="10.8" fill="#fff" fill-opacity=".3" stroke="#d97706" stroke-width="2.8"/><path d="M-5 -5 Q-1 -8 4 -6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`,
        threed: () => `<path d="M-11 -2 L-29 -7" stroke="#f4f1e8" stroke-width="3.4" stroke-linecap="round"/><rect x="-13" y="-9" width="26" height="18" rx="3.5" fill="#f4f1e8" stroke="${INK}" stroke-width="2"/><rect x="-9.5" y="-5.5" width="19" height="11" rx="2" fill="#ef5350"/><path d="M-6 -3 L2 -3" stroke="#fff" stroke-width="1.6" opacity=".6"/>`,
        vr: () => `<path d="M-14 -3 L-31 -8" stroke="#222" stroke-width="4.4" stroke-linecap="round"/><rect x="-15" y="-11" width="32" height="22" rx="7" fill="#2b2f3a" stroke="${INK}" stroke-width="2"/><rect x="-11" y="-7" width="24" height="14" rx="4.5" fill="#4dd0e1" opacity=".6"/><path d="M-7 -4 L2 -4" stroke="#fff" stroke-width="1.8" opacity=".7"/>`,
        bandit: () => `<path d="M-15 -7 Q0 -15 16 -7 Q22 3 8 9 Q3 3 -2 9 Q-20 6 -15 -7 Z M0 0 m-4.6 0 a4.6 5.6 0 1 0 9.2 0 a4.6 5.6 0 1 0 -9.2 0 Z" fill="#26262c" fill-rule="evenodd" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/><path d="M-14 -4 Q-24 -8 -30 -14" stroke="#26262c" stroke-width="3" fill="none" stroke-linecap="round"/>`
    });
    Object.assign(NECKS, {
        collar_pink: () => band('#ec407a') + tag(0.82),
        collar_gold: () => band('#ffb300') + tag(0.82, '#fff'),
        bandana_blue: () => NECKS.bandana().replace(/#e53935/g, '#1e88e5').replace(/#b71c1c/g, '#0d47a1'),
        ribbon: () => { const [x, y] = nb(0.82); return band('#ec407a', 6) + `<path d="M${x} ${y} L${x - 11} ${y - 7} L${x - 11} ${y + 7}Z M${x} ${y} L${x + 11} ${y - 7} L${x + 11} ${y + 7}Z" fill="#ffca28" ${sw(1.8)}/><circle cx="${x}" cy="${y}" r="3.4" fill="#f9a825" ${sw(1.4)}/>`; },
        dogtag: () => { const [x, y] = nb(0.55); return band('#6d4c41', 5) + `<rect x="${x - 6}" y="${y + 3}" width="12" height="13" rx="5" fill="#cfd8dc" ${sw(1.8)}/><circle cx="${x}" cy="${y + 9.5}" r="2.4" fill="#78909c"/>`; },
        daisies: () => `<path d="${NPATH}" fill="none" stroke="#5a9c3c" stroke-width="5" stroke-linecap="round"/>` + along(5, (x, y, i) => flower(+x.toFixed(1), +y.toFixed(1), i % 2 ? '#fff' : '#ffe0ec', 4)),
        snowflake: () => { const [x, y] = nb(0.6); return band('#64b5f6', 5) + star(x, y + 10, 8, '#e3f2fd', `stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"`); }
    });

    /* soft "studio light" for wearables: blurred alpha -> diffuse lighting, multiplied over the flat colours + a contact shadow */
    const lightFilter = id => `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b"/>
    <feDiffuseLighting in="b" surfaceScale="4.2" diffuseConstant="1.22" lighting-color="#fff" result="L"><feDistantLight azimuth="235" elevation="56"/></feDiffuseLighting>
    <feComposite in="SourceGraphic" in2="L" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="M"/>
    <feComposite in="M" in2="SourceAlpha" operator="in" result="Mo"/>
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.3" result="sb"/><feOffset in="sb" dx=".7" dy="1.5" result="so"/>
    <feColorMatrix in="so" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .28 0" result="sh"/>
    <feMerge><feMergeNode in="sh"/><feMergeNode in="Mo"/></feMerge></filter>`;

    /* =====================================================
       THE DOG
       sel  = { breed, coat, hat, neck, face }
       opts = { view: 'full' | 'hat' | 'face',  still: true (no animation) }
    ===================================================== */
    function dogSVG(sel, opts = {}) {
        const coat = D.CATALOG.coat.find(c => c.id === sel.coat) || D.CATALOG.coat[0];
        const br = BREEDS[sel.breed] || BREEDS.pup;
        const b = br.body, hd = br.head, sn = br.snout;
        const u = 'a' + (++uid);
        const fur = coat.fur, dark = coat.dark, light = coat.light;
        const OL = shade(coat.dark, 0.42);
        const k = hd.r / 21;
        const bh = b.bot - b.top, bw = b.x1 - b.x0;
        const R = rng(Math.round(bw * 7 + hd.r * 13 + b.top));
        const bx = t => b.x0 + t * bw, by = t => b.top + t * bh;

        /* paint */
        let defs = lightFilter(u + 'F'), main = fur;
        if (coat.grad) {
            const n = coat.grad.length;
            main = `url(#${u}g)`;
            defs += `<linearGradient id="${u}g" gradientUnits="userSpaceOnUse" x1="${b.x0 - 10}" y1="20" x2="${hd.cx + hd.r}" y2="110">${coat.grad.map((c, i) => `<stop offset="${Math.round(i / (n - 1) * 100)}%" stop-color="${c}"/>`).join('')}</linearGradient>`;
        }
        const legFill = br.socks ? `url(#${u}s)` : main;
        const legFar = br.socks ? `url(#${u}sd)` : dark;
        defs += `<linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset=".66" stop-color="${fur}"/><stop offset=".66" stop-color="${light}"/></linearGradient>` +
            `<linearGradient id="${u}sd" x1="0" y1="0" x2="0" y2="1"><stop offset=".66" stop-color="${dark}"/><stop offset=".66" stop-color="${shade(light, 0.85)}"/></linearGradient>` +
            `<linearGradient id="${u}v" gradientUnits="userSpaceOnUse" x1="0" y1="${by(-0.15)}" x2="0" y2="${by(1.12)}"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".38" stop-color="#fff" stop-opacity="0"/><stop offset=".68" stop-color="${OL}" stop-opacity="0"/><stop offset="1" stop-color="${OL}" stop-opacity=".34"/></linearGradient>` +
            `<linearGradient id="${u}bl" gradientUnits="userSpaceOnUse" x1="0" y1="${by(0.42)}" x2="0" y2="${by(1.1)}"><stop offset="0" stop-color="${light}" stop-opacity="0"/><stop offset=".5" stop-color="${light}" stop-opacity=".78"/><stop offset="1" stop-color="${light}" stop-opacity=".95"/></linearGradient>` +
            `<radialGradient id="${u}bib" gradientUnits="userSpaceOnUse" cx="${bx(0.97)}" cy="${by(0.58)}" r="${bh * 0.62}"><stop offset="0" stop-color="${light}" stop-opacity=".9"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>` +
            `<radialGradient id="${u}hh" gradientUnits="userSpaceOnUse" cx="${hd.cx - hd.r * 0.15}" cy="${hd.cy - hd.r * 0.55}" r="${hd.r * 1.25}"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
            `<linearGradient id="${u}hs" gradientUnits="userSpaceOnUse" x1="0" y1="${hd.cy - hd.r * 0.2}" x2="0" y2="${hd.cy + hd.r * 1.3}"><stop offset="0" stop-color="${OL}" stop-opacity="0"/><stop offset="1" stop-color="${OL}" stop-opacity=".32"/></linearGradient>`;

        /* ---- torso + neck as ONE organic outline ---- */
        const torsoPts = [
            [bx(0.00), by(0.36)], [bx(0.05), by(0.0)], [bx(0.19), by(-0.08)], [bx(0.40), by(-0.02)], [bx(0.60), by(-0.03)],
            [bx(0.80), by(-0.13)], [hd.cx - hd.r * 0.8, hd.cy - hd.r * 0.1], [hd.cx - hd.r * 0.1, hd.cy + hd.r * 0.95], [hd.cx + hd.r * 0.12, hd.cy + hd.r * 1.02],
            [b.x1 + bw * 0.05, by(0.7)], [bx(0.97), by(1.1)], [bx(0.82), by(1.1)], [bx(0.66), by(0.92)], [bx(0.5), by(0.8)], [bx(0.34), by(0.76)], [bx(0.2), by(0.96)], [bx(0.04), by(0.96)]
        ];
        let bodyEls = `<path d="${smooth(torsoPts)}"/>`;
        if (br.fluffy) {
            for (let x = b.x0 + 8; x <= b.x1 - bh * 0.9; x += 12) bodyEls += `<circle cx="${x}" cy="${b.top + 3}" r="7.5"/>`;
            for (let x = b.x0 + 14; x <= b.x1 - 10; x += 13) bodyEls += `<circle cx="${x}" cy="${b.bot - 1}" r="7"/>`;
            [[b.x1 - 2, b.top + bh * 0.42, 8], [b.x1 + 2, b.top + bh * 0.66, 8], [b.x1 - 6, b.bot - 6, 8], [b.x1 - 20, b.bot + 1, 7.5]].forEach(c => { bodyEls += `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}"/>`; });
        }
        if (br.poodle) bodyEls += [[bx(0.9), by(0.5), 9], [bx(0.82), by(0.1), 8], [bx(0.12), by(0.45), 10], [bx(0.1), by(0.9), 8]].map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}"/>`).join('');

        /* ---- head: skull, stop, muzzle, jaw ---- */
        const tipX = hd.cx + hd.r * 0.8 + sn.len;
        const sncy = hd.cy + sn.dy, snry = sn.h;
        const snx0 = hd.cx - hd.r * 0.1;
        const sncx = (tipX + snx0) / 2, snrx = (tipX - snx0) / 2;
        const mTop = sncy - snry;
        const headPts = [
            [hd.cx - hd.r * 0.9, hd.cy - hd.r * 0.05], [hd.cx - hd.r * 0.62, hd.cy - hd.r * 0.8], [hd.cx - hd.r * 0.05, hd.cy - hd.r * 1.02],
            [hd.cx + hd.r * 0.55, hd.cy - hd.r * 0.82], [hd.cx + hd.r * 0.8, Math.min(hd.cy - hd.r * 0.28, mTop - 1)],
            [(hd.cx + hd.r * 0.82 + tipX) / 2, mTop + snry * 0.05], [tipX - 0.8, mTop + snry * 0.28], [tipX + 1.6, sncy - snry * 0.18],
            [tipX + 0.4, sncy + snry * 0.55], [tipX - sn.len * 0.25 - 2, sncy + snry * 1.0], [hd.cx + hd.r * 0.42, Math.max(sncy + snry * 0.95, hd.cy + hd.r * 0.78)],
            [hd.cx - hd.r * 0.05, hd.cy + hd.r * 0.98], [hd.cx - hd.r * 0.6, hd.cy + hd.r * 0.82]
        ];
        let headEls = `<path d="${smooth(headPts)}"/>`;
        if (br.cheeks) headEls += `<ellipse cx="${hd.cx + hd.r * 0.1}" cy="${hd.cy + hd.r * 0.65}" rx="${hd.r * 0.95}" ry="${hd.r * 0.55}"/>`;
        if (br.poodle) headEls += [[-0.3, -1.05, 0.5], [0.15, -1.1, 0.46], [-0.7, -0.8, 0.4]].map(c => `<circle cx="${hd.cx + hd.r * c[0]}" cy="${hd.cy + hd.r * c[1]}" r="${hd.r * c[2]}"/>`).join('');
        if (br.fluffy) {
            headEls += [[-0.82, 0.35, 0.34], [-0.62, 0.85, 0.36], [-0.2, 1.02, 0.36], [0.3, 1.04, 0.36], [0.78, 0.9, 0.3], [-0.3, -1.0, 0.3], [0.1, -1.04, 0.3], [0.5, -0.95, 0.26]]
                .map(c => `<circle cx="${hd.cx + hd.r * c[0]}" cy="${hd.cy + hd.r * c[1]}" r="${hd.r * c[2]}"/>`).join('');
        }
        const union = els => `<g fill="${OL}" stroke="${OL}" stroke-width="3.6" stroke-linejoin="round">${els}</g><g fill="${main}">${els}</g>`;
        defs += `<clipPath id="${u}b">${bodyEls}</clipPath><clipPath id="${u}h">${headEls}</clipPath>`;

        /* ---- legs ---- */
        const legTop = b.bot - 18, legH = GROUND - legTop, lw = br.legW;
        const leg = (x, far, cls, hind) => {
            const fill = far ? legFar : legFill;
            let extra = '';
            if (br.poodle) extra = `<circle cx="0" cy="${legH * 0.66}" r="${lw * 0.95}" fill="${far ? dark : fur}" stroke="${OL}" stroke-width="2.4"/>`;
            const toes = '';
            const sh = `<path d="M${-lw * 0.5} ${legH * 0.12} C${-lw * 0.42} ${legH * 0.5} ${-lw * 0.3} ${legH * 0.66} ${-lw * 0.28} ${legH * 0.84}" fill="none" stroke="${OL}" stroke-width="${lw * 0.22}" stroke-linecap="round" opacity="${far ? 0 : .12}"/>`;
            return `<g transform="translate(${x} ${legTop})"><g class="leg ${cls}"><path d="${legPath(lw, legH, hind)}" fill="${fill}" stroke="${OL}" stroke-width="1.9" stroke-linejoin="round"/>${sh}${extra}${toes}</g></g>`;
        };
        const gap = lw * 1.75;
        const legsFar = leg(b.x0 + 16 + gap, true, 'leg-b', true) + leg(b.x1 - 20 - gap, true, 'leg-a', false);
        const legsNear = leg(b.x0 + 16, false, 'leg-a', true) + leg(b.x1 - 20, false, 'leg-b', false);

        /* ---- body shading: light from above, belly + chest bib, muscle lines, fur ---- */
        let ticks = '';
        for (let i = 0; i < 22; i++) {
            const x = b.x0 + 6 + R() * (bw - 6), y = b.top - 2 + R() * (bh + 4), l = 3 + R() * 3.5;
            ticks += `M${f1(x)} ${f1(y)} l${f1(-l)} ${f1(l * 0.55)} `;
        }
        const backLine = `M${bx(0.08)} ${by(0.1)} C${bx(0.3)} ${by(0.0)} ${bx(0.55)} ${by(0.02)} ${bx(0.8)} ${by(-0.02)}`;
        const bodyShade = `<g clip-path="url(#${u}b)">
      <rect x="${b.x0 - 12}" y="${by(-0.2)}" width="${bw + 40}" height="${bh * 1.5}" fill="url(#${u}bl)"/>
      <rect x="${b.x0 - 12}" y="${by(-0.2)}" width="${bw + 40}" height="${bh * 1.5}" fill="url(#${u}bib)"/>
      <rect x="${b.x0 - 12}" y="${by(-0.2)}" width="${bw + 40}" height="${bh * 1.5}" fill="url(#${u}v)"/>
      <path d="${backLine}" fill="none" stroke="#fff" stroke-width="${bh * 0.16}" stroke-linecap="round" opacity=".2"/>
      <ellipse cx="${bx(0.2)}" cy="${by(0.52)}" rx="${bw * 0.15}" ry="${bh * 0.42}" fill="#fff" opacity=".07"/>
      ${coat.pattern ? patternSVG(coat.pattern, coat.patColor, br) : ''}
    </g>`;

        /* ---- head details ---- */
        const eyeX = hd.cx + hd.r * 0.36, eyeY = hd.cy - hd.r * 0.12, er = Math.max(3.6, hd.r * 0.2);
        const nr = Math.max(3.2, snry * 0.44);
        const noseX = tipX - nr * 0.45, noseY = sncy - snry * 0.55;
        let headDetail = `<g clip-path="url(#${u}h)">`;
        if (br.mask) {
            headDetail += `<ellipse cx="${sncx + 3}" cy="${sncy - 1}" rx="${snrx + 4}" ry="${snry + 2}" fill="${shade(dark, 0.66)}"/><ellipse cx="${hd.cx + hd.r * 0.28}" cy="${hd.cy - hd.r * 0.12}" rx="${hd.r * 0.42}" ry="${hd.r * 0.36}" fill="${shade(dark, 0.66)}"/>`;
        } else if (br.huskyMask) {
            headDetail += `<path d="M${hd.cx - hd.r * 0.1} ${hd.cy + hd.r * 0.15} Q${hd.cx + hd.r * 0.5} ${hd.cy - hd.r * 0.2} ${tipX + 6} ${hd.cy + hd.r * 0.1} L${tipX + 6} ${hd.cy + hd.r * 2} L${hd.cx - hd.r} ${hd.cy + hd.r * 2} Z" fill="${light}"/>` +
                `<path d="M${hd.cx + hd.r * 0.1} ${hd.cy - hd.r * 1.1} L${hd.cx + hd.r * 0.35} ${hd.cy - hd.r * 0.2} L${hd.cx + hd.r * 0.55} ${hd.cy - hd.r * 1.1} Z" fill="${light}"/>`;
        } else {
            headDetail += `<ellipse cx="${sncx + 2}" cy="${sncy + snry * 0.4}" rx="${snrx}" ry="${snry * 0.74}" fill="${light}"/>`;
            if (br.cheeks) headDetail += `<ellipse cx="${hd.cx + hd.r * 0.05}" cy="${hd.cy + hd.r * 0.72}" rx="${hd.r * 0.85}" ry="${hd.r * 0.5}" fill="${light}"/>`;
            if (br.blaze) headDetail += `<path d="M${hd.cx + hd.r * 0.05} ${hd.cy - hd.r * 1.1} L${hd.cx + hd.r * 0.4} ${hd.cy - hd.r * 1.1} L${tipX + 4} ${sncy - snry * 0.6} L${tipX + 4} ${sncy + snry} L${hd.cx + hd.r * 0.3} ${sncy + snry} Z" fill="${light}"/>`;
        }
        if (coat.pattern) headDetail += patternSVG(coat.pattern, coat.patColor, br);
        headDetail += `<ellipse cx="${hd.cx}" cy="${hd.cy}" rx="${hd.r * 1.6}" ry="${hd.r * 1.5}" fill="url(#${u}hh)"/>` +
            `<rect x="${hd.cx - hd.r * 1.2}" y="${hd.cy - hd.r * 0.2}" width="${hd.r * 3 + sn.len}" height="${hd.r * 1.6}" fill="url(#${u}hs)"/>` +
            `<ellipse cx="${hd.cx + hd.r * 0.62}" cy="${mTop + snry * 0.28}" rx="${hd.r * 0.28}" ry="${snry * 0.4}" fill="#fff" opacity=".16"/>` +   // muzzle bridge highlight
            `<path d="M${hd.cx + hd.r * 0.12} ${hd.cy + hd.r * 0.52} Q${hd.cx + hd.r * 0.4} ${hd.cy + hd.r * 0.68} ${hd.cx + hd.r * 0.62} ${hd.cy + hd.r * 0.55}" fill="none" stroke="${OL}" stroke-width="1.2" opacity=".18" stroke-linecap="round"/>`;
        headDetail += `</g>`;
        if (br.wrinkles) headDetail += `<path d="M${hd.cx + hd.r * 0.1} ${hd.cy - hd.r * 0.72} q${hd.r * 0.28} -${hd.r * 0.12} ${hd.r * 0.5} 0 M${hd.cx + hd.r * 0.15} ${hd.cy - hd.r * 0.5} q${hd.r * 0.26} -${hd.r * 0.1} ${hd.r * 0.46} 0 M${hd.cx + hd.r * 0.55} ${hd.cy - hd.r * 0.1} q${hd.r * 0.2} -${hd.r * 0.1} ${hd.r * 0.36} 0" fill="none" stroke="${OL}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`;

        const brows = (br.huskyMask || br.cheeks) ? `<ellipse cx="${eyeX + 1}" cy="${eyeY - er * 2.3}" rx="${er * 0.9}" ry="${er * 0.6}" fill="${light}"/>` : '';

        /* nose, mouth, tongue, eye */
        const mouthY = sncy + snry * 0.22;
        const cornerX = Math.max(hd.cx + hd.r * 0.25, tipX - sn.len - hd.r * 0.15), cornerY = mouthY + snry * 0.5;
        const whisk = [0, 1, 2].map(i => `<circle cx="${f1(noseX - nr * 1.8 - i * nr * 0.95)}" cy="${f1(noseY + nr * 0.5 + (i % 2) * nr * 0.55)}" r="0.85" fill="${OL}" opacity=".55"/>`).join('');
        const face =
            `<path class="tongue" d="M${noseX - nr * 1.6} ${mouthY + snry * 0.3} q${-nr * 0.1} ${nr * 3} ${nr * 1.5} ${nr * 3} q${nr * 1.5} 0 ${nr * 1.3} -${nr * 2.8} Z" fill="#ff7a93" stroke="${OL}" stroke-width="1.7" stroke-linejoin="round"/>` +
            `<path class="tongue" d="M${noseX - nr * 0.2} ${mouthY + snry * 0.45} l.2 ${nr * 2}" stroke="#d8546f" stroke-width="1" fill="none" stroke-linecap="round"/>` +
            `<path d="M${noseX} ${noseY + nr * 0.75} L${noseX - 0.2} ${mouthY} Q${noseX - nr * 1.5} ${mouthY + snry * 0.72} ${f1(cornerX + nr * 1.5)} ${f1(cornerY)} Q${f1(cornerX + nr * 0.4)} ${f1(cornerY + 0.2)} ${f1(cornerX - 1)} ${f1(cornerY - 1.2)}" fill="none" stroke="${OL}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
            `<path d="M${noseX - nr * 1.1} ${noseY + nr * 0.7} Q${noseX - nr * 0.1} ${noseY + nr * 1.6} ${noseX} ${noseY + nr * 0.75}" fill="none" stroke="#fff" stroke-width=".9" opacity=".0"/>` +
            `<path d="M${noseX - nr * 1.05} ${noseY - nr * 0.15} C${noseX - nr * 1.1} ${noseY - nr * 0.95} ${noseX + nr * 0.5} ${noseY - nr * 1.05} ${noseX + nr * 1.15} ${noseY - nr * 0.3} C${noseX + nr * 1.25} ${noseY + nr * 0.5} ${noseX + nr * 0.2} ${noseY + nr * 0.95} ${noseX - nr * 0.5} ${noseY + nr * 0.8} C${noseX - nr * 1.0} ${noseY + nr * 0.6} ${noseX - nr * 1.0} ${noseY + nr * 0.2} ${noseX - nr * 1.05} ${noseY - nr * 0.15} Z" fill="#241a18" stroke="#0d0807" stroke-width=".8"/>` +
            `<path d="M${noseX - nr * 0.25} ${noseY + nr * 0.05} q${nr * 0.45} ${nr * 0.5} ${nr * 0.95} ${nr * 0.05}" stroke="#000" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/>` +
            `<ellipse cx="${noseX + nr * 0.05}" cy="${noseY - nr * 0.52}" rx="${nr * 0.5}" ry="${nr * 0.2}" fill="#fff" opacity=".55"/>` +
            `<g class="eye"><ellipse cx="${eyeX}" cy="${eyeY}" rx="${er * 1.45}" ry="${er * 1.6}" fill="#1b1210"/>` +
            `<ellipse cx="${eyeX + er * 0.2}" cy="${eyeY - er * 0.55}" rx="${er * 0.58}" ry="${er * 0.62}" fill="#fff"/>` +
            `<circle cx="${eyeX - er * 0.4}" cy="${eyeY + er * 0.55}" r="${er * 0.26}" fill="#fff" opacity=".85"/></g>`;

        /* ---- ears ---- */
        let earBack = '', earFront = '';
        const earType = br.ear.type;
        if (earType === 'curly') {
            const c = [[-0.78, 0.1, 0.5], [-0.85, 0.55, 0.46], [-0.72, 0.98, 0.4]];
            const els = c.map(p => `<circle cx="${hd.cx + hd.r * p[0]}" cy="${hd.cy + hd.r * p[1]}" r="${hd.r * p[2]}"/>`).join('');
            earFront = `<g fill="${OL}" stroke="${OL}" stroke-width="3.6" stroke-linejoin="round">${els}</g><g fill="${shade(fur, 0.92)}">${els}</g>` +
                c.map(p => `<circle cx="${hd.cx + hd.r * (p[0] - 0.12)}" cy="${hd.cy + hd.r * (p[1] - 0.1)}" r="${hd.r * p[2] * 0.45}" fill="#fff" opacity=".16"/>`).join('');
        } else if (earType !== 'none') {
            const farD = earPath(br, hd, true), nearD = earPath(br, hd, false);
            const floppy = earType === 'floppy';
            const flop = floppy ? ' ear-flop' : '';
            const earFill = br.mask ? shade(dark, 0.62) : dark;
            let inner = '';
            if (earType === 'pointy') {
                const s = br.ear.s;
                inner = `<path d="M${hd.cx - hd.r * 0.62} ${hd.cy - hd.r * 0.38} Q${hd.cx - hd.r * 0.68} ${hd.cy - hd.r * (0.95 + 0.7 * s)} ${hd.cx - hd.r * 0.32} ${hd.cy - hd.r * (0.95 + 0.62 * s)} Q${hd.cx - hd.r * 0.05} ${hd.cy - hd.r * 0.95} ${hd.cx - hd.r * 0.08} ${hd.cy - hd.r * 0.66} Z" fill="#e9a9a4" opacity=".8"/>` +
                    [0, 1, 2].map(i => `<path d="M${f1(hd.cx - hd.r * (0.5 - i * 0.12))} ${f1(hd.cy - hd.r * 0.5)} q${f1(-hd.r * 0.05)} ${f1(-hd.r * (0.3 + 0.2 * s))} ${f1(hd.r * 0.02)} ${f1(-hd.r * (0.45 + 0.3 * s))}" fill="none" stroke="${light}" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`).join('');
            } else if (floppy) {
                const L = hd.r * 1.5 * br.ear.s, ax = hd.cx - hd.r * 0.38, ay = hd.cy - hd.r * 0.68;
                inner = `<path d="M${f1(ax - 2)} ${f1(ay + 3)} C${f1(ax - 3)} ${f1(ay + L * 0.4)} ${f1(ax - 1)} ${f1(ay + L * 0.75)} ${f1(ax + 1)} ${f1(ay + L * 0.92)}" fill="none" stroke="${OL}" stroke-width="1.6" stroke-linecap="round" opacity=".3"/>` +
                    `<path d="M${f1(ax + 4)} ${f1(ay + 2)} C${f1(ax + 6)} ${f1(ay + L * 0.4)} ${f1(ax + 4)} ${f1(ay + L * 0.7)} ${f1(ax + 2)} ${f1(ay + L * 0.88)}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".16"/>`;
            } else {
                inner = `<path d="M${hd.cx - hd.r * 0.7} ${hd.cy - hd.r * 0.5} Q${hd.cx - hd.r * 0.55} ${hd.cy - hd.r * 0.85} ${hd.cx - hd.r * 0.15} ${hd.cy - hd.r * 0.6}" fill="none" stroke="${OL}" stroke-width="1.4" opacity=".35"/>`;
            }
            earBack = `<path d="${farD}" fill="${shade(earFill, 0.8)}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>`;
            earFront = `<g class="ear${flop}"><path d="${nearD}" fill="${earFill}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>${inner}</g>`;
        }

        /* ---- cosmetics (lit with the soft studio filter) ---- */
        const lit = inner => `<g filter="url(#${u}F)">${inner}</g>`;
        const cx0 = hd.cx - hd.r * 0.12, cy0 = hd.cy - hd.r * 0.93;
        const hat = sel.hat && HATS[sel.hat] ? lit(`<g transform="translate(${cx0} ${cy0}) rotate(7) scale(${k})">${HATS[sel.hat](opts.still)}</g>`) : '';
        const faceAcc = sel.face && FACES[sel.face] ? lit(`<g transform="translate(${eyeX} ${eyeY}) scale(${k})">${FACES[sel.face]()}</g>`) : '';
        const neck = sel.neck && NECKS[sel.neck] ? lit(`<g transform="translate(${hd.cx - hd.r * 0.72} ${hd.cy + hd.r * 1.18}) scale(${k})">${NECKS[sel.neck]()}</g>`) : '';
        const cape = sel.neck === 'cape' ? lit(capeBehind(b, hd)) : '';

        /* view box */
        let vb = '-4 -46 210 180';
        if (opts.view === 'hat') vb = `${hd.cx - 58} ${hd.cy - hd.r * 3.1} 116 ${hd.r * 3.1 + 62}`;
        else if (opts.view === 'face') vb = `${hd.cx - 52} ${hd.cy - 46} 104 104`;
        else if (opts.view === 'neck') vb = `${hd.cx - 56} ${hd.cy - 34} 112 112`;
        const shadow = opts.view && opts.view !== 'full' ? '' :
            `<ellipse cx="${(b.x0 + b.x1) / 2 + 8}" cy="${GROUND + 1}" rx="${bw * 0.62}" ry="5" fill="#000" opacity=".16"/>`;

        return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ${opts.view && opts.view !== 'full' ? 'style="overflow:hidden"' : ''}><defs>${defs}</defs>${shadow}
<g class="bob">
  ${cape}
  ${tailSVG(br, { b, fillMain: main, OL, light, dark, still: opts.still })}
  ${legsFar}
  ${legsNear}
  ${union(bodyEls)}
  ${bodyShade}
  ${earBack}
  ${union(headEls)}
  ${headDetail}
  ${earFront}
  ${face}
  ${neck}
  ${faceAcc}
  ${hat}
</g></svg>`;
    }


    /* =====================================================
       SCENES: three scrolling layers (far / mid / props) + a sky
       Each layer is a seamless tile, 400 units wide.
    ===================================================== */
    const TW = 400, FAR_H = 120, MID_H = 90, PROP_H = 80;
    const uri = (h, inner) => "url('data:image/svg+xml," +
        encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TW} ${h}">${inner}</svg>`).replace(/'/g, '%27') + "')";

    // seamless rolling hills: sum of sines with whole-number frequencies
    function hills(h, base, parts, fill, extra = '') {
        const pts = [];
        for (let x = 0; x <= TW; x += 8) {
            let y = base;
            parts.forEach(([a, k, ph]) => { y += a * Math.sin(2 * Math.PI * k * x / TW + ph); });
            pts.push(x + ',' + y.toFixed(1));
        }
        return `<polygon points="0,${h + 2} ${pts.join(' ')} ${TW},${h + 2}" fill="${fill}" ${extra}/>`;
    }
    // jagged mountains (first and last point share a height so the tile repeats cleanly)
    function peaks(h, pts, fill, cap) {
        const poly = `0,${h + 2} ` + pts.map(p => p.join(',')).join(' ') + ` ${TW},${h + 2}`;
        let out = `<polygon points="${poly}" fill="${fill}"/>`;
        if (cap) pts.forEach((p, i) => { if (p[1] < h * 0.5 && i > 0 && i < pts.length - 1) out += `<polygon points="${p[0]},${p[1]} ${p[0] - 13},${p[1] + 16} ${p[0] - 5},${p[1] + 13} ${p[0]},${p[1] + 19} ${p[0] + 6},${p[1] + 13} ${p[0] + 13},${p[1] + 16}" fill="${cap}"/>`; });
        return out;
    }
    const trunkRect = (x, b, w, h, c) => `<rect x="${x - w / 2}" y="${b - h}" width="${w}" height="${h}" fill="${c}"/>`;
    const treeRound = (x, b, h, leaf, hi, trunk = '#8a5a35') =>
        trunkRect(x, b, h * 0.12, h * 0.5, trunk) + `<circle cx="${x}" cy="${b - h * 0.64}" r="${h * 0.34}" fill="${leaf}"/><circle cx="${x - h * 0.2}" cy="${b - h * 0.5}" r="${h * 0.22}" fill="${leaf}"/><circle cx="${x + h * 0.21}" cy="${b - h * 0.52}" r="${h * 0.23}" fill="${leaf}"/><circle cx="${x - h * 0.1}" cy="${b - h * 0.74}" r="${h * 0.14}" fill="${hi}" opacity=".7"/>`;
    const pine = (x, b, h, col, snow) => {
        let o = trunkRect(x, b, h * 0.1, h * 0.22, '#6b4a2e');
        for (let i = 0; i < 3; i++) {
            const yb = b - h * 0.14 - i * h * 0.26, w = h * (0.36 - i * 0.07);
            o += `<polygon points="${x - w},${yb} ${x + w},${yb} ${x},${yb - h * 0.42}" fill="${col}"/>`;
            if (snow) o += `<polygon points="${x - w * 0.55},${yb - h * 0.2} ${x},${yb - h * 0.42} ${x + w * 0.55},${yb - h * 0.2} ${x + w * 0.2},${yb - h * 0.16} ${x - w * 0.1},${yb - h * 0.21} ${x - w * 0.3},${yb - h * 0.15}" fill="${snow}"/>`;
        }
        return o;
    };
    const bush = (x, b, r, c, hi) => `<circle cx="${x}" cy="${b - r * 0.8}" r="${r}" fill="${c}"/><circle cx="${x - r * 0.9}" cy="${b - r * 0.55}" r="${r * 0.7}" fill="${c}"/><circle cx="${x + r * 0.95}" cy="${b - r * 0.55}" r="${r * 0.72}" fill="${c}"/><circle cx="${x - r * 0.25}" cy="${b - r * 1.05}" r="${r * 0.35}" fill="${hi || c}" opacity=".5"/>`;
    const blossom = (x, b, h, stem, c) => `<path d="M${x} ${b} L${x} ${b - h}" stroke="${stem}" stroke-width="1.6"/>` + [0, 1, 2, 3, 4].map(i => { const a = i * 1.2566; return `<circle cx="${(x + Math.cos(a) * 2.7).toFixed(1)}" cy="${(b - h + Math.sin(a) * 2.7).toFixed(1)}" r="2.2" fill="${c}"/>`; }).join('') + `<circle cx="${x}" cy="${b - h}" r="1.6" fill="#ffd54f"/>`;
    const fence = (b, c, from, to) => { let o = ''; for (let x = from; x <= to; x += 9) o += `<rect x="${x}" y="${b - 15}" width="5" height="15" rx="1.4" fill="${c}"/><polygon points="${x},${b - 15} ${x + 2.5},${b - 19} ${x + 5},${b - 15}" fill="${c}"/>`; return o + `<rect x="${from - 1}" y="${b - 11}" width="${to - from + 8}" height="2.6" fill="${c}"/><rect x="${from - 1}" y="${b - 5}" width="${to - from + 8}" height="2.6" fill="${c}"/>`; };
    const pumpkin = (x, b, r) => `<ellipse cx="${x}" cy="${b - r * 0.8}" rx="${r}" ry="${r * 0.82}" fill="#f28a2e"/><ellipse cx="${x - r * 0.4}" cy="${b - r * 0.8}" rx="${r * 0.35}" ry="${r * 0.8}" fill="#e2701a"/><ellipse cx="${x + r * 0.4}" cy="${b - r * 0.8}" rx="${r * 0.35}" ry="${r * 0.8}" fill="#e2701a"/><rect x="${x - 1.4}" y="${b - r * 1.75}" width="2.8" height="${r * 0.4}" fill="#5a7d2a"/>`;
    const palm = (x, b, h, lean = 8) => {
        const tx = x + lean, ty = b - h;
        let o = `<path d="M${x} ${b} Q${x + lean * 0.2} ${b - h * 0.5} ${tx} ${ty}" stroke="#8a5a35" stroke-width="${h * 0.09}" fill="none" stroke-linecap="round"/>`;
        [[-1.2, 0], [-0.5, 0.2], [0.3, 0.2], [1.1, 0], [-1.7, 0.35], [1.7, 0.35]].forEach(a => {
            const ex = tx + Math.cos(Math.PI / 2 + a[0]) * -h * 0.55 * (a[0] < 0 ? 1 : 1), ey = ty - Math.sin(Math.PI / 2 + a[0]) * h * 0.18 + a[1] * h * 0.5;
            o += `<path d="M${tx} ${ty} Q${(tx + ex) / 2} ${ty - h * 0.28} ${ex} ${ey}" stroke="#2e8b3d" stroke-width="${h * 0.1}" fill="none" stroke-linecap="round"/>`;
        });
        return o + `<circle cx="${tx - 2}" cy="${ty + 3}" r="${h * 0.045}" fill="#6b4226"/><circle cx="${tx + 2.5}" cy="${ty + 3.5}" r="${h * 0.045}" fill="#6b4226"/>`;
    };
    const umbrella = (x, b, h) => `<rect x="${x - 0.9}" y="${b - h}" width="1.8" height="${h}" fill="#8a5a35"/><path d="M${x - h * 0.5} ${b - h + 2} Q${x} ${b - h * 1.45} ${x + h * 0.5} ${b - h + 2} Z" fill="#ff6b6b"/><path d="M${x - h * 0.17} ${b - h + 1} Q${x - h * 0.15} ${b - h * 1.3} ${x} ${b - h * 1.33} Q${x + h * 0.15} ${b - h * 1.3} ${x + h * 0.17} ${b - h + 1} Z" fill="#fff"/>`;
    const snowman = (x, b, r) => `<circle cx="${x}" cy="${b - r}" r="${r}" fill="#fff"/><circle cx="${x}" cy="${b - r * 2.5}" r="${r * 0.72}" fill="#fff"/><circle cx="${x - r * 0.25}" cy="${b - r * 2.62}" r="1.2" fill="#222"/><circle cx="${x + r * 0.25}" cy="${b - r * 2.62}" r="1.2" fill="#222"/><polygon points="${x},${b - r * 2.45} ${x + r * 0.8},${b - r * 2.35} ${x},${b - r * 2.28}" fill="#f28a2e"/><rect x="${x - r * 0.7}" y="${b - r * 1.85}" width="${r * 1.4}" height="${r * 0.28}" rx="1.4" fill="#e53935"/><rect x="${x - r * 0.45}" y="${b - r * 3.6}" width="${r * 0.9}" height="${r * 0.6}" fill="#333"/><rect x="${x - r * 0.65}" y="${b - r * 3.05}" width="${r * 1.3}" height="${r * 0.18}" fill="#333"/>`;
    const lolli = (x, b, h, c1, c2) => `<rect x="${x - 1}" y="${b - h * 0.62}" width="2" height="${h * 0.62}" fill="#fff"/><circle cx="${x}" cy="${b - h * 0.76}" r="${h * 0.24}" fill="${c1}"/><path d="M${x} ${b - h * 0.76} m0 -1 a2 2 0 1 1 -2 2 a4 4 0 1 1 5 -4 a7 7 0 1 1 -9 9" stroke="${c2}" stroke-width="2" fill="none" stroke-linecap="round" transform="scale(1)" opacity=".95"/>`;
    const cane = (x, b, h) => `<path d="M${x} ${b} L${x} ${b - h * 0.8} q0 ${-h * 0.22} ${h * 0.2} ${-h * 0.22} q${h * 0.2} 0 ${h * 0.2} ${h * 0.2}" stroke="#fff" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M${x} ${b} L${x} ${b - h * 0.8} q0 ${-h * 0.22} ${h * 0.2} ${-h * 0.22} q${h * 0.2} 0 ${h * 0.2} ${h * 0.2}" stroke="#e53935" stroke-width="4.4" fill="none" stroke-dasharray="4 4" stroke-linecap="butt"/>`;
    const gumdrop = (x, b, r, c) => `<path d="M${x - r} ${b} Q${x - r} ${b - r * 1.7} ${x} ${b - r * 1.7} Q${x + r} ${b - r * 1.7} ${x + r} ${b} Z" fill="${c}"/><circle cx="${x - r * 0.35}" cy="${b - r * 1.1}" r="${r * 0.14}" fill="#fff" opacity=".7"/><circle cx="${x + r * 0.2}" cy="${b - r * 0.75}" r="${r * 0.14}" fill="#fff" opacity=".7"/><circle cx="${x - r * 0.1}" cy="${b - r * 0.35}" r="${r * 0.14}" fill="#fff" opacity=".7"/>`;
    const cactus = (x, b, h, c, hi) => `<rect x="${x - h * 0.09}" y="${b - h}" width="${h * 0.18}" height="${h}" rx="${h * 0.09}" fill="${c}"/><path d="M${x - h * 0.09} ${b - h * 0.45} h${-h * 0.14} v${-h * 0.25} " stroke="${c}" stroke-width="${h * 0.15}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x + h * 0.09} ${b - h * 0.6} h${h * 0.14} v${-h * 0.22}" stroke="${c}" stroke-width="${h * 0.15}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="${x - h * 0.03}" y="${b - h * 0.92}" width="${h * 0.05}" height="${h * 0.8}" rx="1" fill="${hi}" opacity=".6"/>`;
    const rock = (x, b, r, c, hi) => `<path d="M${x - r} ${b} Q${x - r} ${b - r * 0.9} ${x - r * 0.2} ${b - r} Q${x + r * 0.7} ${b - r * 1.05} ${x + r} ${b} Z" fill="${c}"/><path d="M${x - r * 0.6} ${b - r * 0.4} Q${x - r * 0.3} ${b - r * 0.85} ${x + r * 0.1} ${b - r * 0.85}" stroke="${hi}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    const crystal = (x, b, h, c, hi) => `<polygon points="${x - h * 0.2},${b} ${x - h * 0.12},${b - h * 0.7} ${x},${b - h} ${x + h * 0.14},${b - h * 0.6} ${x + h * 0.22},${b}" fill="${c}"/><polygon points="${x},${b - h} ${x + h * 0.14},${b - h * 0.6} ${x + h * 0.05},${b}  ${x - h * 0.02},${b - h * 0.5}" fill="${hi}" opacity=".6"/>`;
    const mushroom = (x, b, r, cap, stem = '#f3e6d0') => `<rect x="${x - r * 0.3}" y="${b - r * 1.1}" width="${r * 0.6}" height="${r * 1.1}" rx="${r * 0.2}" fill="${stem}"/><path d="M${x - r} ${b - r * 1.0} Q${x - r} ${b - r * 2.1} ${x} ${b - r * 2.1} Q${x + r} ${b - r * 2.1} ${x + r} ${b - r * 1.0} Z" fill="${cap}"/><circle cx="${x - r * 0.4}" cy="${b - r * 1.55}" r="${r * 0.18}" fill="#fff" opacity=".85"/><circle cx="${x + r * 0.3}" cy="${b - r * 1.4}" r="${r * 0.15}" fill="#fff" opacity=".85"/>`;
    const firefly = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff59d" opacity=".2"/><circle cx="${x}" cy="${y}" r="2.2" fill="#fff9c4"/>`;
    const fern = (x, b, h, c) => [-1, 0, 1].map(d => `<path d="M${x} ${b} Q${x + d * h * 0.3} ${b - h * 0.7} ${x + d * h * 0.55} ${b - h * (d ? 0.75 : 1)}" stroke="${c}" stroke-width="${h * 0.12}" fill="none" stroke-linecap="round"/>`).join('');
    const bigLeaf = (x, b, h, c, hi) => `<path d="M${x} ${b} Q${x - h * 0.55} ${b - h * 0.5} ${x - h * 0.1} ${b - h} Q${x + h * 0.55} ${b - h * 0.5} ${x} ${b} Z" fill="${c}"/><path d="M${x} ${b} Q${x - h * 0.08} ${b - h * 0.5} ${x - h * 0.1} ${b - h * 0.95}" stroke="${hi}" stroke-width="1.6" fill="none"/>`;
    const jungleTree = (x, b, h, c1, c2) => trunkRect(x, b, h * 0.1, h * 0.8, '#6b4a2e') + `<ellipse cx="${x}" cy="${b - h * 0.85}" rx="${h * 0.42}" ry="${h * 0.22}" fill="${c1}"/><ellipse cx="${x - h * 0.2}" cy="${b - h * 0.7}" rx="${h * 0.3}" ry="${h * 0.15}" fill="${c2}"/><ellipse cx="${x + h * 0.22}" cy="${b - h * 0.72}" rx="${h * 0.3}" ry="${h * 0.15}" fill="${c2}"/>`;
    const planet = (x, y, r, c, ring) => `${ring ? `<ellipse cx="${x}" cy="${y}" rx="${r * 1.7}" ry="${r * 0.4}" fill="none" stroke="${ring}" stroke-width="3" transform="rotate(-18 ${x} ${y})" opacity=".8"/>` : ''}<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.5}" fill="#fff" opacity=".18"/>${ring ? `<path d="M${x - r * 1.7} ${y + r * 0.1} Q${x} ${y + r * 0.62} ${x + r * 1.7} ${y - r * 0.12}" fill="none" stroke="${ring}" stroke-width="3" transform="rotate(-18 ${x} ${y})" opacity=".8"/>` : ''}`;
    const mesa = (x, b, w, h, c, hi) => `<polygon points="${x - w / 2},${b} ${x - w * 0.4},${b - h} ${x + w * 0.4},${b - h} ${x + w / 2},${b}" fill="${c}"/><polygon points="${x - w * 0.4},${b - h} ${x + w * 0.4},${b - h} ${x + w * 0.37},${b - h + 6} ${x - w * 0.37},${b - h + 6}" fill="${hi}"/>`;

    const THEMES = {
        meadow: {
            sky: 'sun', cloud: '#ffffff',
            far: () => peaks(FAR_H, [[0, 78], [55, 44], [100, 70], [160, 30], [215, 74], [270, 48], [330, 72], [370, 52], [400, 78]], '#b5dcea', '#f4fbff') + hills(FAR_H, 98, [[8, 2, 1]], '#a4d6bd'),
            mid: () => hills(MID_H, 50, [[13, 1, 0.5], [7, 3, 2.2]], '#8fd07a') + hills(MID_H, 66, [[8, 2, 1.4], [4, 4, 0.3]], '#7cc467'),
            props: () => fence(PROP_H, '#fff', 20, 120) + treeRound(190, PROP_H, 64, '#4fa83d', '#9be07a') + bush(250, PROP_H, 10, '#58b445', '#9be07a') + blossom(278, PROP_H, 12, '#4a8f3a', '#ff8fb1') + blossom(288, PROP_H, 9, '#4a8f3a', '#fff') + blossom(298, PROP_H, 13, '#4a8f3a', '#ffb067') + treeRound(350, PROP_H, 48, '#5cb847', '#a6e688') + blossom(150, PROP_H, 10, '#4a8f3a', '#c9a0ff') + blossom(160, PROP_H, 7, '#4a8f3a', '#ff8fb1')
        },
        autumn: {
            sky: 'sunLow', cloud: '#fff1e2',
            far: () => peaks(FAR_H, [[0, 74], [60, 40], [110, 68], [170, 34], [230, 70], [290, 42], [350, 66], [400, 74]], '#e7b48b', '#fff0e0') + hills(FAR_H, 100, [[7, 2, 0.4]], '#d99a62'),
            mid: () => hills(MID_H, 48, [[12, 1, 1.4], [6, 3, 0.4]], '#d9863a') + hills(MID_H, 66, [[8, 2, 0.4], [4, 5, 2]], '#c4722b'),
            props: () => treeRound(40, PROP_H, 62, '#e5792b', '#ffc15a', '#6b4a2e') + pumpkin(100, PROP_H, 9) + pumpkin(118, PROP_H, 6) + treeRound(190, PROP_H, 70, '#c9342b', '#ff8a5c', '#6b4a2e') + bush(255, PROP_H, 9, '#e0a02b', '#ffd96b') + treeRound(320, PROP_H, 56, '#f0a22b', '#ffd96b', '#6b4a2e') + bush(375, PROP_H, 7, '#c9342b', '#ff8a5c')
        },
        beach: {
            sky: 'sun', cloud: '#ffffff',
            far: () => `<rect x="0" y="62" width="${TW}" height="60" fill="#4fb8e8"/><rect x="0" y="62" width="${TW}" height="5" fill="#8ad8f5"/>` + [30, 110, 190, 270, 350].map((x, i) => `<path d="M${x} ${74 + (i % 2) * 8} q8 -5 16 0 q8 5 16 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/>`).join('') + `<polygon points="300,61 300,36 318,61" fill="#fff"/><polygon points="296,61 322,61 316,68 300,68" fill="#e8574b"/>`,
            mid: () => hills(MID_H, 56, [[8, 1, 0.9], [4, 3, 0.2]], '#f1d792') + hills(MID_H, 72, [[5, 2, 1.7]], '#ecca7a'),
            props: () => palm(60, PROP_H, 62, 10) + umbrella(150, PROP_H, 34) + `<ellipse cx="172" cy="${PROP_H - 3}" rx="9" ry="3" fill="#ff6b6b" opacity=".0"/>` + palm(250, PROP_H, 52, -8) + `<path d="M310 ${PROP_H} q6 -12 14 -12 q8 0 14 12 Z" fill="#f4a6c0"/><path d="M324 ${PROP_H} v-11 M316 ${PROP_H} l3 -9 M332 ${PROP_H} l-3 -9" stroke="#d9789a" stroke-width="1.2"/>` + bush(372, PROP_H, 6, '#5cb86a', '#9be07a')
        },
        snow: {
            sky: 'pale', cloud: '#ffffff',
            far: () => peaks(FAR_H, [[0, 70], [50, 30], [105, 66], [165, 20], [225, 66], [285, 34], [345, 64], [400, 70]], '#a9c6df', '#ffffff') + hills(FAR_H, 100, [[6, 2, 0.4]], '#c8dcee'),
            mid: () => hills(MID_H, 46, [[12, 1, 0.2], [6, 3, 1.4]], '#e9f3fb') + hills(MID_H, 66, [[7, 2, 0.8]], '#ffffff'),
            props: () => pine(45, PROP_H, 68, '#2f7d52', '#fff') + snowman(120, PROP_H, 11) + pine(205, PROP_H, 54, '#3b8f5f', '#fff') + pine(240, PROP_H, 40, '#2f7d52', '#fff') + `<path d="M300 ${PROP_H} q0 -26 24 -26 q24 0 24 26 Z" fill="#e3f2fb"/><path d="M312 ${PROP_H} q0 -12 12 -12 q12 0 12 12 Z" fill="#7fa8c8"/>` + pine(385, PROP_H, 46, '#2f7d52', '#fff')
        },
        night: {
            sky: 'moon', cloud: null,
            far: () => peaks(FAR_H, [[0, 72], [60, 38], [112, 68], [172, 26], [232, 70], [292, 40], [350, 66], [400, 72]], '#27346b') + hills(FAR_H, 100, [[6, 2, 0.8]], '#1f2a58'),
            mid: () => hills(MID_H, 48, [[12, 1, 1], [6, 3, 0.1]], '#2b5a49') + hills(MID_H, 66, [[8, 2, 1.6]], '#234a3b'),
            props: () => pine(40, PROP_H, 62, '#1d4a3a') + firefly(78, 36) + mushroom(120, PROP_H, 8, '#7e57c2') + firefly(150, 46) + pine(210, PROP_H, 70, '#1b4335') + firefly(262, 30) + mushroom(288, PROP_H, 6, '#e0508f') + pine(345, PROP_H, 52, '#1d4a3a') + firefly(380, 42)
        },
        candy: {
            sky: 'candy', cloud: '#ffd6ec',
            far: () => hills(FAR_H, 70, [[16, 1, 0.5], [8, 3, 1.8]], '#f6c2ec') + hills(FAR_H, 92, [[8, 2, 0.2]], '#efb0e0') + [60, 150, 240, 330].map((x, i) => `<circle cx="${x}" cy="${58 + (i % 2) * 10}" r="2" fill="${['#fff', '#ffe27a', '#8fe3ff', '#fff'][i]}"/>`).join(''),
            mid: () => hills(MID_H, 50, [[12, 1, 0.9], [6, 3, 2]], '#ffb3d9') + hills(MID_H, 68, [[7, 2, 0.5]], '#ff9dcb'),
            props: () => lolli(40, PROP_H, 58, '#ff7ab8', '#fff') + gumdrop(95, PROP_H, 10, '#7ad6ff') + gumdrop(120, PROP_H, 7, '#ffe27a') + cane(180, PROP_H, 50) + lolli(250, PROP_H, 66, '#a78bfa', '#fff') + gumdrop(300, PROP_H, 12, '#8be28b') + gumdrop(330, PROP_H, 8, '#ff7ab8') + cane(372, PROP_H, 40)
        },
        space: {
            sky: 'space', cloud: null,
            far: () => planet(70, 52, 24, '#7c5cd6', '#e8d2ff') + planet(210, 36, 12, '#ff8a65') + planet(318, 58, 18, '#4fc3f7') + [30, 130, 160, 260, 380].map((x, i) => `<circle cx="${x}" cy="${20 + (i * 23) % 70}" r="1.4" fill="#fff" opacity=".8"/>`).join(''),
            mid: () => hills(MID_H, 56, [[9, 1, 0.3], [5, 3, 1.1]], '#5a3a99') + hills(MID_H, 72, [[5, 2, 1.8]], '#4b2f85'),
            props: () => crystal(40, PROP_H, 44, '#4fe0d0', '#c9fff7') + crystal(58, PROP_H, 28, '#7c8cff', '#d7dcff') + rock(120, PROP_H, 12, '#7a6aa8', '#a99bd6') + mushroom(185, PROP_H, 8, '#ff7ab8', '#e8d2ff') + crystal(250, PROP_H, 56, '#ff7ab8', '#ffd0e8') + rock(310, PROP_H, 9, '#7a6aa8', '#a99bd6') + crystal(360, PROP_H, 36, '#4fe0d0', '#c9fff7')
        },
        desert: {
            sky: 'sun', cloud: '#fff6e5',
            far: () => mesa(70, FAR_H, 90, 56, '#d98a5a', '#f0a977') + mesa(190, FAR_H, 60, 38, '#cf7e50', '#e99b6a') + mesa(300, FAR_H, 110, 66, '#d98a5a', '#f0a977') + hills(FAR_H, 104, [[5, 2, 0.5]], '#e3a86a'),
            mid: () => hills(MID_H, 52, [[12, 1, 0.6], [5, 3, 1.4]], '#f0c27a') + hills(MID_H, 68, [[7, 2, 0.2]], '#e8b565'),
            props: () => cactus(45, PROP_H, 50, '#3f9a52', '#7bd18a') + rock(110, PROP_H, 10, '#b9835b', '#d9a87c') + cactus(190, PROP_H, 34, '#3f9a52', '#7bd18a') + `<path d="M240 ${PROP_H} q4 -10 14 -8 q8 -8 16 0 q6 2 4 8 Z" fill="#c9a06a"/>` + rock(320, PROP_H, 13, '#b9835b', '#d9a87c') + cactus(370, PROP_H, 42, '#3f9a52', '#7bd18a')
        },
        jungle: {
            sky: 'sun', cloud: '#f0ffe8',
            far: () => hills(FAR_H, 62, [[14, 2, 0.5], [7, 5, 1.2]], '#4aa86a') + hills(FAR_H, 86, [[9, 3, 2]], '#3b9459'),
            mid: () => hills(MID_H, 44, [[10, 2, 1], [6, 5, 0.3]], '#2f8a4b') + hills(MID_H, 64, [[8, 3, 1.4]], '#287a40'),
            props: () => jungleTree(40, PROP_H, 70, '#2f9d4f', '#58c46f') + fern(95, PROP_H, 26, '#2f9d4f') + bigLeaf(130, PROP_H, 34, '#38b05a', '#1f7a3a') + blossom(165, PROP_H, 20, '#2a7d3f', '#ff5f8a') + jungleTree(235, PROP_H, 60, '#2f9d4f', '#58c46f') + bigLeaf(285, PROP_H, 30, '#38b05a', '#1f7a3a') + fern(330, PROP_H, 22, '#2f9d4f') + blossom(360, PROP_H, 16, '#2a7d3f', '#ffd54f')
        },
        sakura: {
            sky: 'pale', cloud: '#fff0f6',
            far: () => peaks(FAR_H, [[0, 76], [70, 46], [120, 72], [190, 36], [250, 72], [310, 50], [360, 70], [400, 76]], '#f3c5d8', '#fff') + hills(FAR_H, 100, [[6, 2, 0.4]], '#e9b3cb'),
            mid: () => hills(MID_H, 48, [[12, 1, 0.3], [6, 3, 1.1]], '#b8e2a0') + hills(MID_H, 66, [[7, 2, 1.7]], '#a4d68b'),
            props: () => treeRound(45, PROP_H, 68, '#f7a8c4', '#ffd6e5', '#7a5236') + rock(105, PROP_H, 8, '#b9b3c4', '#dcd7e6') + treeRound(185, PROP_H, 56, '#f48fb1', '#ffd0e0', '#7a5236') + blossom(235, PROP_H, 12, '#6fb05a', '#ffb7d0') + blossom(246, PROP_H, 9, '#6fb05a', '#fff') + treeRound(318, PROP_H, 72, '#f7a8c4', '#ffd6e5', '#7a5236') + bush(378, PROP_H, 7, '#f48fb1', '#ffd0e0')
        },
        spooky: {
            sky: 'moon', cloud: null,
            far: () => peaks(FAR_H, [[0, 70], [60, 36], [112, 66], [172, 30], [232, 68], [292, 40], [350, 64], [400, 70]], '#3b2160') + hills(FAR_H, 100, [[6, 2, 0.8]], '#2e1a4e'),
            mid: () => hills(MID_H, 48, [[12, 1, 1], [6, 3, 0.1]], '#3d2b57') + hills(MID_H, 66, [[8, 2, 1.6]], '#32224a'),
            props: () => pumpkin(40, PROP_H, 11) + pine(95, PROP_H, 60, '#241638') + firefly(130, 40) + pumpkin(160, PROP_H, 8) + `<path d="M205 ${PROP_H} v-34 M205 ${PROP_H - 20} l-14 -12 M205 ${PROP_H - 26} l12 -10 M205 ${PROP_H - 12} l-10 -8" stroke="#1a0f2b" stroke-width="4" stroke-linecap="round" fill="none"/>` + firefly(250, 34) + mushroom(280, PROP_H, 8, '#ff8f2e') + pine(335, PROP_H, 66, '#241638') + pumpkin(385, PROP_H, 9)
        }
    };

    const SKY_STARS = (n, seed) => { const R = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = R() * 400, y = R() * 120, r = 0.6 + R() * 1.4; o += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" opacity="${(0.5 + R() * 0.5).toFixed(2)}"/>`; } return o; };
    const cloudSVG = (cls, col) => `<svg class="cloud ${cls}" viewBox="0 0 64 34"><path d="M10 30 a8 8 0 0 1 1 -16 a12 12 0 0 1 23 -3 a10 10 0 0 1 17 6 a9 9 0 0 1 4 13 Z" fill="${col}"/></svg>`;

    function skyHTML(id) {
        const t = THEMES[id] || THEMES.meadow;
        let art = '';
        if (t.sky === 'sun') art = `<circle cx="340" cy="42" r="34" fill="#fff7b0" opacity=".35"/><circle cx="340" cy="42" r="22" fill="#ffe45e"/><circle cx="333" cy="35" r="7" fill="#fff" opacity=".5"/>`;
        if (t.sky === 'sunLow') art = `<circle cx="330" cy="86" r="40" fill="#ffd0a0" opacity=".45"/><circle cx="330" cy="86" r="26" fill="#ff9a4a"/>`;
        if (t.sky === 'pale') art = `<circle cx="330" cy="44" r="20" fill="#fff" opacity=".85"/>`;
        if (t.sky === 'candy') art = `<circle cx="336" cy="44" r="24" fill="#fff0a8"/><circle cx="336" cy="44" r="34" fill="none" stroke="#fff" stroke-width="3" opacity=".6" stroke-dasharray="6 6"/>`;
        if (t.sky === 'moon') art = SKY_STARS(46, 11) + `<circle cx="332" cy="46" r="26" fill="#fff9d6" opacity=".18"/><circle cx="332" cy="46" r="17" fill="#fff6c4"/><circle cx="326" cy="42" r="3.4" fill="#ecdc9a"/><circle cx="338" cy="52" r="2.4" fill="#ecdc9a"/><circle cx="337" cy="39" r="1.8" fill="#ecdc9a"/>`;
        if (t.sky === 'space') art = SKY_STARS(70, 5) + planet(330, 52, 18, '#e57373') + `<circle cx="318" cy="46" r="4" fill="#fff" opacity=".2"/>`;
        const svg = `<svg class="sky-art" viewBox="0 0 400 200" preserveAspectRatio="xMidYMin slice">${art}</svg>`;
        const clouds = t.cloud ? cloudSVG('c1', t.cloud) + cloudSVG('c2', t.cloud) + cloudSVG('c3', t.cloud) : '';
        return svg + clouds;
    }

    const sceneCache = {};
    function sceneArt(id) {
        const t = THEMES[id] || THEMES.meadow;
        if (!sceneCache[id]) sceneCache[id] = { far: uri(FAR_H, t.far()), mid: uri(MID_H, t.mid()), props: uri(PROP_H, t.props()) };
        return Object.assign({ farH: FAR_H, midH: MID_H, propsH: PROP_H, tileW: TW }, sceneCache[id]);
    }

    return { dogSVG, BREEDS, shade, GROUND, sceneArt, skyHTML };
})();