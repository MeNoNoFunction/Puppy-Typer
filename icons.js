/* =========================================================
   icons.js: a small hand-drawn icon set that replaces emoji everywhere.
   Any emoji in the page that has a drawing here is swapped for an
   inline SVG automatically (text nodes are watched, so text that the
   game adds later is swapped too). Emoji without a drawing stay as text.
========================================================= */
(function () {
    'use strict';
    const INK = '#2a2140';
    const S = `stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"`;
    const wrap = inner => `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">${inner}</svg>`;
    // outlined shape: draw the shapes twice (thick outline, then fill) so touching parts merge
    const uni = (shapes, fill, w = 3.6) => `<g fill="${INK}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round">${shapes}</g><g fill="${fill}">${shapes}</g>`;
    const P = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra} ${S}/>`;
    const C = (x, y, r, fill, st = true) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${st ? S : ''}/>`;
    const R = (x, y, w, h, rx, fill, st = true) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${st ? S : ''}/>`;
    const mono = inner => `<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;

    const heart = c => P('M16 27C5 19 3 12 8 7.5c3.5-3 7-1 8 2 1-3 4.5-5 8-2 5 4.500 3 11.500-8 19.500z', c);
    const dogFace = () =>
        P('M8 5C3.500 8 3 17 7 21c3-2 4.500-9 4-14z', '#9a6330') + P('M24 5c4.500 3 5 12 1 16-3-2-4.500-9-4-14z', '#9a6330') +
        C(16, 18, 10, '#f4b968') + `<ellipse cx="16" cy="22.500" rx="5.500" ry="4.200" fill="#fff3dd" ${S}/>` +
        C(12, 15.500, 1.700, INK, false) + C(20, 15.500, 1.700, INK, false) + `<ellipse cx="16" cy="20.500" rx="2.300" ry="1.600" fill="${INK}"/>`;
    const face = (fill, inner) => C(16, 16, 12, fill) + inner;

    /* treats */
    const cookie = () => C(16, 16, 12, '#dda05a') + [[11, 11], [20, 12], [14, 20], [21, 21], [9, 18]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="1.900" fill="#5a3a22"/>`).join('');
    const cheese = () => P('M3 22 L29 22 L29 12 Q16 6 3 12Z', '#ffcf3f') + `<path d="M3 22L29 22L29 27L3 27Z" fill="#f0b320" ${S}/>` + C(10, 17, 2.200, '#f0b320') + C(18, 15, 1.800, '#f0b320') + C(23, 19, 2, '#f0b320');
    const donut = () => C(16, 16, 12, '#e8a85a') + C(16, 16, 10, '#ff8fc0', false) + `<circle cx="16" cy="16" r="3.600" fill="#fff" ${S}/>` + [[9, 13, '#fff'], [22, 12, '#5ee0ff'], [12, 22, '#ffe45e'], [21, 21, '#fff']].map(p => `<rect x="${p[0]}" y="${p[1]}" width="3.500" height="1.600" rx=".8" fill="${p[2]}" transform="rotate(${p[0] * 9} ${p[0]} ${p[1]})"/>`).join('');
    const burger = () => P('M4 14C4 6 28 6 28 14Z', '#e9a64f') + P('M3 17h26', 'none') + P('M4 17 Q8 20 12 17 Q16 20 20 17 Q24 20 28 17 L28 18.500 H4Z', '#6fcf54') + R(4, 18.500, 24, 4, 2, '#7a4528') + P('M4 23.500 H28 V25 Q28 28 25 28 H7 Q4 28 4 25Z', '#e9a64f') + [[11, 10], [16, 9], [21, 10]].map(p => `<ellipse cx="${p[0]}" cy="${p[1]}" rx="1.200" ry=".7" fill="#fff3d6"/>`).join('');
    const pizza = () => P('M16 29 L4 8 Q16 2 28 8Z', '#ffcf3f') + P('M4 8 Q16 2 28 8', 'none', 'stroke-width="3.500"') + C(13, 12, 2.200, '#e5483f') + C(19, 14, 2.200, '#e5483f') + C(16, 20, 2, '#e5483f');
    const steak = () => P('M6 13 C6 6 16 4 23 7 C29 10 29 19 24 24 C19 29 9 28 6 22 C4 19 5 16 6 13Z', '#e0574f') + P('M10 14 C12 10 18 9 21 12', 'none', 'stroke="#ffb3a8" stroke-width="2"') + C(21, 19, 3, '#fff3dd');
    const cake = () => P('M4 24 H28 V28 H4Z', '#ffd9e6') + P('M6 14 H26 V24 H6Z', '#ffb3cf') + P('M6 14 Q9 18 12 14 Q15 18 18 14 Q21 18 24 14 L26 14 L26 11 H6Z', '#fff') + R(15, 5, 2, 6, 1, '#ffd23f') + `<path d="M16 2.500 q2 2 0 3.500 q-2-1.500 0-3.500z" fill="#ff7a2f"/>`;
    const fries = () => [8, 12, 16, 20].map((x, i) => R(x, 5 + (i % 2) * 2, 3.600, 14, 1.200, '#ffd23f')).join('') + P('M6 14 H26 L24 28 H8Z', '#e5483f') + P('M12 17 L13 25 M20 17 L19 25', 'none', 'stroke="#fff" stroke-width="1.800"');
    const icecream = () => P('M10 17 L16 30 L22 17Z', '#e8a85a') + C(16, 13, 7, '#ff9fc4') + C(10.500, 15.500, 4.500, '#8fe3ff') + C(21.500, 15.500, 4.500, '#fff0a8') + C(16, 8, 2.200, '#e5483f');
    const taco = () => P('M3 24 C3 11 29 11 29 24Z', '#ffcf3f') + P('M7 20 C8 15 24 15 25 20', 'none', 'stroke="#6fcf54" stroke-width="3.500"') + C(12, 18, 1.700, '#e5483f', false) + C(19, 17.500, 1.700, '#e5483f', false);
    const melon = () => P('M3 12 H29 C29 22 23 28 16 28 C9 28 3 22 3 12Z', '#6fcf54') + P('M5.500 12 H26.500 C26.500 20 22 25.500 16 25.500 C10 25.500 5.500 20 5.500 12Z', '#ff5d73') + [[11, 16], [16, 19], [21, 16]].map(p => `<ellipse cx="${p[0]}" cy="${p[1]}" rx="1" ry="1.600" fill="${INK}"/>`).join('');
    const cupcake = () => P('M8 17 H24 L22 28 H10Z', '#6cc5ff') + P('M7 17 C4 11 11 11 11 8 C11 3 21 3 21 8 C21 11 28 11 25 17Z', '#ff9fc4') + C(16, 5, 2.200, '#e5483f');
    const pancakes = () => `<ellipse cx="16" cy="24" rx="12" ry="4" fill="#e8a85a" ${S}/><ellipse cx="16" cy="18.500" rx="12" ry="4" fill="#f4bf74" ${S}/><ellipse cx="16" cy="13" rx="12" ry="4" fill="#e8a85a" ${S}/><ellipse cx="16" cy="9.500" rx="10" ry="3.500" fill="#f4bf74" ${S}/><rect x="13" y="6.500" width="6" height="4" rx="1" fill="#ffe45e" ${S}/><path d="M23 11 Q24 17 22 21" stroke="#b5651d" stroke-width="2.500" fill="none" stroke-linecap="round"/>`;
    const popcorn = () => [[10, 8], [16, 6], [22, 8], [13, 11], [19, 11]].map(p => C(p[0], p[1], 4, '#fff3d0')).join('') + P('M7 13 H25 L23 29 H9Z', '#fff') + P('M11 13 L12 29 M16 13 V29 M21 13 L20 29', 'none', 'stroke="#e5483f" stroke-width="3"');
    const sushi = () => `<ellipse cx="16" cy="19" rx="12" ry="7.500" fill="#fff" ${S}/>` + P('M7 16 Q16 8 25 16 Q16 23 7 16Z', '#ff8a6b') + P('M13 11 L19 20', 'none', 'stroke="#ffd0c4" stroke-width="1.800"') + R(14, 11, 4, 14, 1, '#2f4a3a');
    /* trails */
    const leaves = () => P('M5 25 C5 12 14 6 26 6 C26 18 20 26 5 25Z', '#6fcf54') + P('M5 25 L19 12', 'none') + P('M19 28 C17 22 20 17 27 15 C28 21 25 27 19 28Z', '#9be07a');
    const bubbles = () => `<g fill="#bfe9ff" fill-opacity=".6" ${S}><circle cx="12" cy="20" r="8"/><circle cx="23" cy="10" r="5"/><circle cx="24" cy="23" r="3"/></g><path d="M8 18 Q9 14 12 13" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    const note = () => P('M12 22 V6 L25 4 V19', 'none', 'stroke-width="2.600"') + C(9.500, 22.500, 4, '#8b5cf6') + C(22.500, 19.500, 4, '#8b5cf6') + P('M12 9 L25 7', 'none', 'stroke-width="3.500"');
    const rainbow = () => ['#ff5d73', '#ffb81f', '#52d273', '#4cc2ff', '#8b5cf6'].map((c, i) => `<path d="M${3 + i * 2.500} 26 A${13 - i * 2.500} ${13 - i * 2.500} 0 0 1 ${29 - i * 2.500} 26" fill="none" stroke="${c}" stroke-width="2.600" stroke-linecap="round"/>`).join('');
    const snow = () => `<g stroke="#5bb8ff" stroke-width="2.600" stroke-linecap="round" fill="none">${[0, 60, 120].map(a => `<path d="M16 3V29" transform="rotate(${a} 16 16)"/>`).join('')}${[0, 60, 120, 180, 240, 300].map(a => `<path d="M16 7 L13.500 4.500 M16 7 L18.500 4.500" transform="rotate(${a} 16 16)"/>`).join('')}</g>`;
    const lolli = () => R(15, 16, 2.600, 14, 1.200, '#fff') + C(16, 12, 9, '#ff7ab8') + `<path d="M16 12 m0 -1 a1.500 1.500 0 1 1 -1.500 1.500 a3.500 3.500 0 1 1 4.500 -3.500 a6 6 0 1 1 -7.500 7" fill="none" stroke="#fff" stroke-width="1.800" stroke-linecap="round"/>`;

    /* emoji -> drawing */
    const ICONS = {
        '👥': C(21.500, 10, 5, '#ff8a6b') + P('M12 28c0-6 4-9.500 9.500-9.500S31 22 31 28Z', '#ff8a6b') + C(11, 10.500, 5.500, '#4f8dff') + P('M0.500 28.500c0-6.500 4.500-10 10.500-10s10.500 3.500 10.500 10Z', '#4f8dff'),
        '🦴': C(16, 16, 14, '#f2a900') + C(16, 16, 10.6, '#ffd84a', false) + `<path d="M7.500 12.500 A9.500 9.500 0 0 1 16 6.500" fill="none" stroke="#fff6c2" stroke-width="2" stroke-linecap="round" opacity=".85"/>` + `<g transform="rotate(-40 16 16)" fill="#8a4b00"><rect x="10.500" y="14" width="11" height="4" rx="1.500"/><circle cx="10.500" cy="13.700" r="2.300"/><circle cx="10.500" cy="18.300" r="2.300"/><circle cx="21.500" cy="13.700" r="2.300"/><circle cx="21.500" cy="18.300" r="2.300"/></g>`,
        '🐾': uni('<ellipse cx="7" cy="14" rx="3" ry="3.800" transform="rotate(-18 7 14)"/><ellipse cx="13" cy="8.500" rx="3" ry="3.800"/><ellipse cx="20" cy="8.500" rx="3" ry="3.800"/><ellipse cx="26" cy="14" rx="3" ry="3.800" transform="rotate(18 26 14)"/><path d="M16 14c4.500 0 8.500 4.500 8.500 8.500 0 3-2.500 4.500-5 4.500-1.500 0-2.300-.7-3.500-.7s-2 .7-3.500.7c-2.500 0-5-1.500-5-4.500 0-4 4-8.500 8.500-8.500z"/>', '#e39a4d', 3.200),
        '⭐': P('M16 3.500l3.700 8 8.700 1-6.500 5.900 1.800 8.600L16 22.600 8.300 27l1.800-8.600-6.500-5.900 8.700-1z', '#ffc933'),
        '✨': P('M16 3L19.500 12.500 29 16 19.500 19.500 16 29 12.500 19.500 3 16 12.500 12.500Z', '#ffe66b') + P('M26 3 L27 6 L30 7 L27 8 L26 11 L25 8 L22 7 L25 6Z', '#fff7b0', 'stroke-width="1.200"'),
        '❤️': heart('#ff5d73'), '💛': heart('#ffc933'), '🩷': heart('#ff8fc0'), '🤍': heart('#ffffff'),
        '🔥': P('M16 3C18 9 25 12 25 20C25 26 21 29 16 29C11 29 7 26 7 20C7 16 9.500 14 11 12C11.500 14.500 13 15.500 14 15.500C14 11 13 7 16 3Z', '#ff7a2f') + '<path d="M16 17C18 20 20 21 20 24.500C20 27 18 28 16 28C14 28 12 27 12 24.500C12 21 15 20 16 17Z" fill="#ffd23f"/>',
        '⚡': P('M18 3L7 18H14L12 29L25 12H17.500Z', '#ffd23f'),
        '🎁': R(5, 13, 22, 15, 2, '#ff5d73') + R(4, 9, 24, 6, 2, '#ff8095') + R(14, 9, 4, 19, 0, '#ffd23f') + P('M16 9C10 2 5 8 12 9Z', '#ffd23f') + P('M16 9C22 2 27 8 20 9Z', '#ffd23f'),
        '🎮': R(3, 9, 26, 15, 7, '#6c7bff') + '<path d="M10 13v7M6.500 16.500h7" stroke="#fff" stroke-width="2.400" stroke-linecap="round"/>' + C(21, 15, 1.900, '#ffd23f', false) + C(24.500, 18.500, 1.900, '#ff5d73', false),
        '👕': P('M11 4 L4 8 L7.500 14 L10.500 12.500 V27 H21.500 V12.500 L24.500 14 L28 8 L21 4C20 7 12 7 11 4Z', '#4cc2ff'),
        '🎟️': P('M3 9H29V13.500A2.700 2.700 0 0 0 29 18.500V23H3V18.500A2.700 2.700 0 0 0 3 13.500Z', '#ff9f43') + '<path d="M21 10V22" stroke="#fff" stroke-width="1.800" stroke-dasharray="2 2.500"/>' + '<path d="M12 12.500l1.200 2.600 2.800.3-2.100 1.900.6 2.800-2.500-1.400-2.500 1.400.6-2.800-2.100-1.900 2.800-.3z" fill="#fff"/>',
        '📜': P('M8 5H25V23A4 4 0 0 1 21 27H8A3 3 0 0 0 11 24V8A3 3 0 0 0 8 5Z', '#fff1c9') + '<path d="M14 11h8M14 15h8M14 19h5" stroke="#b9873a" stroke-width="1.800" stroke-linecap="round"/>',
        '📊': R(5, 17, 6, 11, 1.500, '#4cc2ff') + R(13, 10, 6, 18, 1.500, '#52d273') + R(21, 4, 6, 24, 1.500, '#ff9f43'),
        '⚙️': uni([0, 45, 90, 135].map(a => `<rect x="14" y="3" width="4" height="26" rx="1.500" transform="rotate(${a} 16 16)"/>`).join('') + '<circle cx="16" cy="16" r="9"/>', '#a9b4d0') + C(16, 16, 3.800, '#fff'),
        '🔊': P('M5 12H10L17 6V26L10 20H5Z', '#4cc2ff') + '<path d="M21 12a6 6 0 0 1 0 8M24.500 8.500a11 11 0 0 1 0 15" stroke="currentColor" stroke-width="2.400" fill="none" stroke-linecap="round"/>',
        '🔇': P('M5 12H10L17 6V26L10 20H5Z', '#9aa5c0') + '<path d="M21 12l7 8M28 12l-7 8" stroke="#ff5d73" stroke-width="2.600" stroke-linecap="round"/>',
        '🎵': note(), '🎶': note(),
        '🌙': P('M22 4A12 12 0 1 0 28 24A10 10 0 0 1 22 4Z', '#ffd86b'),
        '☀️': C(16, 16, 6.500, '#ffcf33') + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M16 3.500V7" transform="rotate(${a} 16 16)" stroke="#ffb81f" stroke-width="2.600" stroke-linecap="round"/>`).join(''),
        '🏅': P('M9 3L14.500 14M23 3L17.500 14', 'none', 'stroke="#ff5d73" stroke-width="4"') + C(16, 20, 8.500, '#ffcf33') + '<path d="M16 15l1.600 3.300 3.600.5-2.600 2.500.6 3.600-3.200-1.700-3.200 1.700.6-3.600-2.600-2.500 3.600-.5z" fill="#fff3b0"/>',
        '🥇': P('M9 3L14.500 14M23 3L17.500 14', 'none', 'stroke="#4cc2ff" stroke-width="4"') + C(16, 20, 8.500, '#ffcf33') + '<path d="M16 15l1.600 3.300 3.600.5-2.600 2.500.6 3.600-3.200-1.700-3.200 1.700.6-3.600-2.600-2.500 3.600-.5z" fill="#fff3b0"/>',
        '🏆': P('M9 5H23V13A7 7 0 0 1 9 13Z', '#ffcf33') + P('M9 7H4Q4 13 9 14M23 7H28Q28 13 23 14', 'none', 'stroke-width="2.200"') + R(14, 19, 4, 5, 0, '#e8a912') + R(9, 24, 14, 4, 1.500, '#e8a912'),
        '🏁': R(6, 4, 2.600, 25, 1.200, '#8a8fa8') + P('M8.600 5H27L22.500 11L27 17H8.600Z', '#fff') + '<g fill="' + INK + '"><rect x="8.600" y="5" width="4.600" height="4"/><rect x="17.800" y="5" width="4.600" height="4"/><rect x="13.200" y="9" width="4.600" height="4"/><rect x="22.400" y="9" width="2" height="2"/><rect x="8.600" y="13" width="4.600" height="4"/><rect x="17.800" y="13" width="4.600" height="4"/></g>',
        '✏️': P('M5 27L7 20L21 6L26 11L12 25Z', '#ffd23f') + P('M5 27L7 20L12 25Z', '#ffe9c0') + P('M21 6L24 3L29 8L26 11Z', '#ff8095'),
        '👤': C(16, 11, 6, '#9aa5ff') + P('M5 28C5 20 10 17 16 17S27 20 27 28Z', '#9aa5ff'),
        '💾': P('M5 5H24L27 8V27H5Z', '#4cc2ff') + R(9, 5, 13, 8, 1, '#fff') + R(9, 18, 14, 9, 1.500, '#e6f4ff'),
        '🔁': mono('<path d="M26 16A10 10 0 1 1 23 9"/><path d="M25 4V10H19"/>'),
        '🏠': mono('<path d="M4 16L16 5L28 16"/><path d="M7 14V27H25V14"/><path d="M13.500 27V19H18.500V27"/>'),
        '🔒': `<path d="M10 14V10A6 6 0 0 1 22 10V14" fill="none" stroke-width="2.600" ${S}/>` + R(6, 14, 20, 14, 3, '#ffb81f') + C(16, 21, 2.300, INK, false),
        '🔓': `<path d="M10 14V10A6 6 0 0 1 21 7" fill="none" stroke-width="2.600" ${S}/>` + R(6, 14, 20, 14, 3, '#52d273') + C(16, 21, 2.300, INK, false),
        '⏱️': R(13, 2.500, 6, 3, 1, '#8a8fa8') + C(16, 18, 11, '#fff') + '<circle cx="16" cy="18" r="8" fill="none" stroke="#4cc2ff" stroke-width="2"/><path d="M16 18V12M16 18L20 20" stroke="' + INK + '" stroke-width="2.400" stroke-linecap="round"/>',
        '⏳': P('M8 3H24V9L18 16L24 23V29H8V23L14 16L8 9Z', '#e8f4ff') + '<path d="M12 8H20L16 13Z" fill="#ff9f43"/><path d="M10.500 27 L16 21 L21.500 27Z" fill="#ff9f43"/>',
        '🐶': dogFace(), '🐕': dogFace(), '🐕💨': dogFace(), '🚀🐕': dogFace(), '🦮': dogFace(),
        '💨': mono('<path d="M4 10H20A3 3 0 1 0 17 7"/><path d="M4 16H25A3 3 0 1 1 22 19"/><path d="M4 22H15"/>'),
        '😴': face('#ffd45e', '<path d="M8 14q2.500 2 5 0M19 14q2.500 2 5 0" fill="none" stroke="' + INK + '" stroke-width="1.800" stroke-linecap="round"/><ellipse cx="16" cy="22" rx="2.200" ry="1.600" fill="' + INK + '"/>'),
        '😋': face('#ffd45e', C(11.500, 13.500, 1.800, INK, false) + C(20.500, 13.500, 1.800, INK, false) + '<path d="M9 18Q16 25 23 18Z" fill="#fff" ' + S + '/><path d="M13 21.500Q16 28 19 21.500Z" fill="#ff7a8f"/>'),
        '🏞️': R(3, 5, 26, 22, 4, '#8fd3ff') + C(22, 11, 3.500, '#ffe45e', false) + '<path d="M3 24Q10 14 17 22Q22 17 29 23V24A3 3 0 0 1 26 27H6A3 3 0 0 1 3 24Z" fill="#6fcf54"/>',
        '☁️': uni('<circle cx="11" cy="19" r="6"/><circle cx="19" cy="14" r="7"/><circle cx="24" cy="20" r="5"/><rect x="9" y="19" width="18" height="6" rx="3"/>', '#fff'),
        '🎉': P('M4 28L10 8L24 22Z', '#ffb347') + '<path d="M13 14L18 19" stroke="#fff" stroke-width="1.800"/>' + C(22, 8, 1.800, '#ff5d73', false) + C(27, 14, 1.800, '#4cc2ff', false) + C(16, 5, 1.800, '#52d273', false) + C(27, 6, 1.400, '#ffd23f', false) + '<path d="M20 11q4-1 5 3" stroke="#8b5cf6" stroke-width="1.800" fill="none" stroke-linecap="round"/>',
        '🎊': C(16, 16, 11, '#ff7ab8') + C(16, 16, 11, 'none') + '<path d="M9 12L14 8M12 22L22 12M20 25L25 20" stroke="#fff" stroke-width="2.200" stroke-linecap="round"/>',
        '🍪': cookie(), '🧀': cheese(), '🍩': donut(), '🍔': burger(), '🍕': pizza(), '🥩': steak(), '🍰': cake(), '🍟': fries(),
        '🍦': icecream(), '🌮': taco(), '🍉': melon(), '🧁': cupcake(), '🥞': pancakes(), '🍿': popcorn(), '🍣': sushi(),
        '🍃': leaves(), '🫧': bubbles(), '🌈': rainbow(), '❄️': snow(), '🍭': lolli()
    };

    const keys = Object.keys(ICONS).sort((a, b) => b.length - a.length);
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // a drawing can be requested with or without the invisible "variation selector"
    const variants = [];
    keys.forEach(k => { variants.push(k); const base = k.replace(/️/g, ''); if (base !== k) variants.push(base); });
    const lookup = {};
    keys.forEach(k => { lookup[k] = ICONS[k]; lookup[k.replace(/️/g, '')] = ICONS[k]; });
    const RE = new RegExp(variants.sort((a, b) => b.length - a.length).map(esc).join('|'), 'g');

    const svg = emoji => (lookup[emoji] ? wrap(lookup[emoji]) : null);
    const html = emoji => { const s = svg(emoji); return s ? `<span class="ei">${s}</span>` : emoji; };

    function swapText(node) {
        const text = node.nodeValue;
        RE.lastIndex = 0;
        if (!RE.test(text)) return;
        RE.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0, m;
        while ((m = RE.exec(text))) {
            if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
            const span = document.createElement('span');
            span.className = 'ei'; span.innerHTML = wrap(lookup[m[0]]); span.setAttribute('role', 'img');
            frag.appendChild(span);
            last = m.index + m[0].length;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
    }
    const SKIP = { TEXTAREA: 1, SCRIPT: 1, STYLE: 1, OPTION: 1, SELECT: 1, INPUT: 1, TITLE: 1 };
    function walk(root) {
        if (root.nodeType === 3) { if (root.parentNode && !SKIP[root.parentNode.tagName]) swapText(root); return; }
        if (root.nodeType !== 1 || SKIP[root.tagName] || root.classList.contains('ei')) return;
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (SKIP[n.parentNode.tagName] || n.parentNode.classList.contains('ei')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
        const list = []; while (w.nextNode()) list.push(w.currentNode);
        list.forEach(swapText);
    }

    let obs = null;
    function start() {
        walk(document.body);
        obs = new MutationObserver(muts => {
            obs.disconnect();
            muts.forEach(m => {
                if (m.type === 'characterData') { if (m.target.parentNode && !SKIP[m.target.parentNode.tagName]) swapText(m.target); }
                else m.addedNodes.forEach(n => walk(n));
            });
            obs.observe(document.body, { childList: true, subtree: true, characterData: true });
        });
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    window.PT_ICONS = { svg, html, walk, start, has: e => !!lookup[e] };
})();