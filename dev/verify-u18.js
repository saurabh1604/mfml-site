/* Unit 18 · Attention and Transformers — Round 22 widget suite (WebGL on).
   PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u18.js   (reads the built page in dev/site/)
   Every widget: its state() is re-computed here independently; the drawn geometry is checked against it;
   every claim of its "Try:" line is performed; extremes never give NaN; no two labels overlap (SVG and 3-D) at 1440 and 390. */
const { chromium } = require('playwright');
const URL = 'file:///home/claude/mfml-site/dev/site/unit-18.html';
let bad = 0, nok = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => { nok++; console.log('  ok   ' + m); };
const expect = (cond, msg, extra) => cond ? okay(msg) : fail(msg + (extra !== undefined ? ' · got ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 400) : ''));
/* ---- independent maths (never the page's own functions) ---- */
const softmax = r => { const f = r.filter(Number.isFinite), m = Math.max(...f), e = r.map(s => Number.isFinite(s) ? Math.exp(s - m) : 0), z = e.reduce((a, b) => a + b, 0); return e.map(x => x / z); };
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const attend = (Q, K, V, causal) => { const d = Q[0].length; const A = Q.map((q, i) => softmax(K.map((k, j) => causal && j > i ? -Infinity : dot(q, k) / Math.sqrt(d)))); return { A, O: A.map(r => V[0].map((_, c) => r.reduce((s, w, j) => s + w * V[j][c], 0))) }; };
const near = (a, b, t) => Array.isArray(a) ? a.length === b.length && a.every((x, i) => near(x, b[i], t)) : Math.abs(a - b) <= (t == null ? 1e-6 : t);
const r3 = v => Array.isArray(v) ? v.map(r3) : Math.round(v * 1000) / 1000;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } }); page.setDefaultTimeout(90000);
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/net::ERR_/.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0, 200)); if (m.type() === 'warning' && /U18|stage failed|context lost/.test(m.text())) errors.push('WARN: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const ev = (f, a) => page.evaluate(f, a);
  const st = name => ev(n => window.U18[n].state(), name);
  const setRange = (id, val) => ev(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const click = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(250); };
  const show = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(1100); };
  const text = async sel => (await page.locator(sel).innerText()).replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  /* SAT test over the text of every visible SVG inside `sel`: returns overlapping pairs */
  const overlaps = sel => ev(sel => {
    const quads = t => { const b = t.getBBox(); const m = t.getScreenCTM(); if (!m || !b.width) return null; return [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]); };
    const sep = (A, B) => { for (const P of [A, B]) for (let i = 0; i < 4; i++) { const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % 4]; const nx = y2 - y1, ny = x1 - x2, L = Math.hypot(nx, ny) || 1; const pa = A.map(([x, y]) => (x * nx + y * ny) / L), pb = B.map(([x, y]) => (x * nx + y * ny) / L); if (Math.max(...pa) < Math.min(...pb) + 0.5 || Math.max(...pb) < Math.min(...pa) + 0.5) return true; } return false; };
    const out = []; document.querySelectorAll(sel).forEach(root => root.querySelectorAll('svg').forEach(svg => { if (!svg.checkVisibility || !svg.checkVisibility()) return;
      const ts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && t.checkVisibility()); const qs = ts.map(quads);
      for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) if (qs[i] && qs[j] && !sep(qs[i], qs[j])) out.push((svg.id || svg.closest('[id]').id) + ': “' + ts[i].textContent.slice(0, 16) + '” × “' + ts[j].textContent.slice(0, 16) + '”');
      /* and no label may poke outside its own picture (it would be cut off) */
      const R = svg.getBoundingClientRect(); ts.forEach((t, i) => { const q = qs[i]; if (!q) return; const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
        if (Math.min(...xs) < R.left - 1.5 || Math.max(...xs) > R.right + 1.5 || Math.min(...ys) < R.top - 1.5 || Math.max(...ys) > R.bottom + 1.5) out.push((svg.id || svg.closest('[id]').id) + ': “' + t.textContent.slice(0, 20) + '” is cut off at the edge'); }); }));
    return out; }, sel);
  /* 3-D labels: pairwise overlap of the projected sprite boxes (shrunk by their transparent padding) */
  /* labels() also returns the HUD notes over the canvas (hud: true): a label may not hide under one, nor be cut by the stage edge */
  const nL = rects => rects.filter(r => !r.hud).length;
  const spriteOverlaps = rects => { const out = rects.filter(r => r.cut).map(r => r.t + ' is cut off by the stage edge'); const sh = rects.map(r => ({ t: r.t, x: r.x + r.w * .08, y: r.y + r.h * .2, w: r.w * .84, h: r.h * .6 }));
    for (let i = 0; i < sh.length; i++) for (let j = i + 1; j < sh.length; j++) { const a = sh[i], b = sh[j]; if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push(a.t + ' × ' + b.t); } return out; };
  const noNaN = o => !JSON.stringify(o).match(/NaN|Infinity|null,null/);
  /* animations are timed by the clock, but the sandbox shares 2 CPUs with software WebGL (and other suites): wait for the end state, up to a generous limit */
  const until = (fn, arg, ms) => page.waitForFunction(fn, arg, { timeout: ms || 20000, polling: 100 }).then(() => true, () => false);

  await page.goto(URL, { timeout: 180000 }); await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' }); await page.waitForTimeout(2500);

  console.log('— page —');
  const c = await ev(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length,
    w3d: [...document.querySelectorAll('.widget')].filter(w => w.querySelector('.stage3d')).length, derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length,
    probs: document.querySelectorAll('#spractice .prob').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u18-total'), T: document.title,
    scoreTotal: document.getElementById('score-total').textContent, crumb: document.querySelector('.topbar .crumb').textContent, kicker: document.querySelector('.hero .kicker').textContent,
    ids: [...document.querySelectorAll('section.unit')].map(s => s.id).join(','), traps: document.querySelectorAll('.callout.watch .tag').length, whys: document.querySelectorAll('.callout.aha .tag').length,
    cmps: document.querySelectorAll('table.cmp').length, rules: document.querySelectorAll('p.rule').length, onesent: document.querySelectorAll('p.onesent').length,
    dup: (() => { const s = {}, d = []; document.querySelectorAll('[id]').forEach(e => { if (s[e.id]) d.push(e.id); s[e.id] = 1; }); return d; })(),
    checkIds: [...document.querySelectorAll('.check')].map(x => x.dataset.check).join(',') }));
  expect(c.checks === 31 && c.total === '31' && c.scoreTotal === '31', '31 checks, total published, #score-total = 31', c);
  expect(c.checkIds === Array.from({ length: 31 }, (_, i) => 'c' + (i + 1)).join(','), 'check ids c1…c31 in page order', c.checkIds);
  expect(c.widgets === 18 && c.w3d === 4 && c.derives === 18 && c.drawers === 10 && c.probs === 16, '18 widgets (4 in 3-D) · 18 derivations in 10 drawers · 16 problems', c);
  expect(c.ids === 's1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13,s14,spractice', 'sections s1–s14 + spractice', c.ids);
  expect(c.traps === 13 && c.whys === 13 && c.onesent === 14, 'every teaching section (s1–s13) has a Trap and a Why-does-this-work; 14 one-sentence hooks (s1–s14)', c);
  expect(c.cmps >= 11 && c.rules >= 11, c.cmps + ' side-by-side comparison tables, ' + c.rules + ' rules of thumb', c);
  expect(!c.dup.length, 'no duplicate ids', c.dup);
  expect(!c.katex, 'no KaTeX errors', c.katex);
  expect(/^Unit 18 · Attention and Transformers/.test(c.T) && /Unit 18 · Attention and Transformers/.test(c.crumb) && /Unit 18 of 20 · by Prof. Saurabh/.test(c.kicker), 'title, crumb and kicker say Unit 18', [c.T, c.crumb, c.kicker]);
  const chips = await text('.hero .meta');
  expect(/18 interactive widgets · 4 in 3D/.test(chips) && /31 inline checks/.test(chips) && /18 proofs/.test(chips) && /16 solved practice problems/.test(chips), 'hero chips: 18 widgets · 4 in 3D · 31 checks · 18 proofs · 16 problems', chips);
  const leak = await ev(() => { const h = document.documentElement.innerHTML.replace(/mfml-/g, ''); return (h.match(/MFML|ZC416|BITS|WILP/) || h.match(/exam paper|question bank|past paper|\bexams?\b/i) || [''])[0]; });
  expect(!leak, 'no brand leak, no "exam" wording', leak);
  const esc = await ev(() => (document.querySelector('main').innerText.match(/.{0,30}\\'.{0,10}/) || [''])[0]);
  expect(!esc, 'no stray backslash-quote (\\\') in the text', esc);
  const nav = await ev(() => ({ prev: !!document.querySelector('.hero-prev a[href="unit-17.html"]'), u19: !!document.querySelector('a[href="unit-19.html"]'), nc: document.querySelector('#spractice .next-card').textContent,
    units: (document.documentElement.innerHTML.match(/\{"n":16,"t":"Words as Vectors"\},\{"n":17,"t":"Machines with Memory"\},\{"n":18,"t":"Attention and Transformers"\}\]/) || []).length, U: /var U = 18;/.test(document.documentElement.innerHTML) }));
  expect(nav.prev && !nav.u19 && /Unit 19 · The Maths Inside an LLM/.test(nav.nc) && /upcoming/.test(nav.nc) && nav.units === 1 && nav.U, 'prev → Unit 17; next-card “Unit 19 — upcoming” (no link); UNITS ends at 18; U = 18', nav);
  /* reviewer (R22): the site CSS styles .rule as a 1-px divider; every rule-of-thumb box must be as tall as its text */
  const rules = await ev(() => [...document.querySelectorAll('p.rule')].map(p => { const n = p.nextElementSibling; return [p.offsetHeight, n ? n.offsetTop - (p.offsetTop + p.offsetHeight) : 99]; }));
  expect(rules.length >= 11 && rules.every(([h, gap]) => h > 20 && gap >= 0), rules.length + ' rule-of-thumb boxes: each as tall as its text, and it ends before the next block starts', rules);
  const deva = await ev(async () => { await document.fonts.load('700 16px "U18 Deva"', 'हूँ'); await document.fonts.load('500 16px "U18 Deva"', 'हूँ');
    const svgHi = [...document.querySelectorAll('#al-svg text')].filter(t => /[\u0900-\u097F]/.test(t.textContent));
    return [document.fonts.check('700 16px "U18 Deva"', 'हूँ'), [...document.fonts].filter(f => /U18 Deva/.test(f.family) && f.status === 'loaded').length, svgHi.length, svgHi.every(t => /U18 Deva/.test(t.getAttribute('style'))), getComputedStyle(document.documentElement).getPropertyValue('--ui')]; });
  expect(deva[0] && deva[1] >= 2 && deva[2] >= 5 && deva[3] && /U18 Deva/.test(deva[4]), 'Hindi (मैं चाय पीता हूँ) is drawn with the page\'s own Devanagari face: both weights loaded, in the text font list and on every Hindi SVG label', deva);
  const cross = await ev(() => [...document.querySelectorAll('main a[href^="unit-"]')].map(a => a.getAttribute('href')).filter(h => /#/.test(h)));
  expect(cross.length > 30, cross.length + ' cross-links into other units with section anchors', cross.length);

  console.log('— §1 · w-align —');
  await show('#w-align'); let s = await st('align');
  const W = { main: [2, 0, 0], chai: [0, .5, 2], peeta: [0, 2, .5], hoon: [1, 1, 0] };
  expect(s.step === 1 && near(s.cur.w, softmax(W.chai)) && near(r3(s.cur.w), [0.1, 0.164, 0.736]), 'writing चाय: weights (0.100, 0.164, 0.736) = context', s.cur.w);
  expect(s.beams.length === 3 && s.beams.every(b => near(b.w, 1.5 + 13 * s.cur.w[b.j], 1e-3) && near(b.o, .25 + .75 * s.cur.w[b.j], 1e-3)), 'beam width = 1.5 + 13·share and opacity = 0.25 + 0.75·share (drawn = computed)', s.beams);
  expect(s.cells.filter(x => x.r <= 1).every(x => near(x.o, .08 + .92 * s.rows[x.r].w[x.c], 1e-3)) && s.cells.filter(x => x.r > 1).every(x => near(x.o, .35)), 'map: rows written so far lit with opacity 0.08 + 0.92·share; later rows empty', s.cells);
  expect(s.bars.length === 3 && s.bars.every(b => near(b.h, Math.max(1.5, s.cmax * s.cur.c[b.j]), 1e-3)), 'context bars: height = ' + s.cmax + ' × entry', s.bars);
  for (const [t, w] of [[0, 'main'], [2, 'peeta'], [3, 'hoon']]) { await click(`#al-step [data-t="${t}"]`); s = await st('align'); expect(near(s.cur.w, softmax(W[w])), 'step ' + w + ': ' + JSON.stringify(r3(s.cur.w)), s.cur.w); }
  s = await st('align'); expect(Math.abs(s.cur.w[0] - s.cur.w[1]) < 1e-12 && s.cur.w[2] < s.cur.w[0], 'हूँ splits its attention equally between “I” and “drink” (the map bends, then spreads)', s.cur.w);
  await click('#al-step [data-t="1"]'); await setRange('al-k', 2); s = await st('align');
  expect(near(r3(s.cur.w), [0.017, 0.047, 0.936]), 'Try: चाय with how sure = 2 → tea 0.936 (check c1)', s.cur.w);
  await setRange('al-k', 0); s = await st('align'); expect(s.rows.every(r => near(r.w, [1 / 3, 1 / 3, 1 / 3])) && noNaN(s), 'how sure = 0 → every row (1/3, 1/3, 1/3), no NaN', s.rows);
  await setRange('al-k', 3); s = await st('align'); expect(noNaN(s) && near(s.cur.w, softmax([0, 1.5, 6])) && s.cur.w[2] > .98, 'how sure = 3 (the slider\'s end) → tea ' + s.cur.w[2].toFixed(3) + ', nearly one-hot, no NaN', s.cur.w);
  await setRange('al-k', 1); await click('#al-play'); await until(() => { const s = window.U18.align.state(); return s.step === 3 && s.u === 1; }, null, 30000); s = await st('align');
  expect(s.step === 3 && s.u === 1 && s.cells.every(x => near(x.o, .08 + .92 * s.rows[x.r].w[x.c], 1e-3)), '▶ translate writes all four words and fills the whole map', s.cells);
  await click('#al-mode [data-t="none"]'); s = await st('align'); const alr = await text('#al-read');
  expect(s.beams.length === 0 && s.sumBeams >= 1 && s.cells.every(x => near(x.o, .35)) && /one summary/.test(alr), 'no attention (Unit 17): one summary for every word, no map', { s, alr });
  await click('#al-mode [data-t="att"]');

  console.log('— §2 · w-lookup —');
  await show('#w-lookup'); s = await st('lookup');
  const KEYS = [[1, 1], [-.5, 1.3], [1.3, -.7], [-1, -.5]], PR = [10, 20, 30, 15];
  const lw = softmax(KEYS.map(k => dot([1.5, 1], k)));
  expect(near(s.shares, lw) && near(Math.round(s.price * 100) / 100, 15.01) && near(r3(s.shares), [0.694, 0.099, 0.199, 0.008]), 'kind shopkeeper at (1.5, 1): (0.694, 0.099, 0.199, 0.008), cup ₹15.01', s);
  expect(s.bars.every(b => near(b.w, Math.max(1.5, s.BW * s.shares[b.i]), 1e-3)), 'share bars: width = ' + s.BW + ' × share', s.bars);
  await click('#lk-mode [data-t="hard"]'); s = await st('lookup'); expect(near(s.shares, [1, 0, 0, 0]) && near(s.price, 10), 'strict: exactly chai, ₹10', s);
  await click('#lk-mode [data-t="soft"]'); await setRange('lk-s', 6); s = await st('lookup'); expect(s.shares[0] > .99, 'Try: pickiness 6 → the kind shopkeeper becomes strict (' + s.shares[0].toFixed(4) + ')', s.shares);
  await setRange('lk-s', 0); s = await st('lookup'); expect(near(s.shares, [.25, .25, .25, .25]) && near(s.price, 18.75), 'Try: pickiness 0 → 0.25 each, ₹18.75', s);
  await setRange('lk-s', 1);
  { await page.locator('#lk-svg').scrollIntoViewIfNeeded(); const q2 = (await st('lookup')).q2px, bb = await page.locator('#lk-svg').boundingBox();
    await page.mouse.move(bb.x + q2[0] / 640 * bb.width, bb.y + q2[1] / 380 * bb.height); await page.mouse.down(); await page.mouse.move(bb.x + (16 + (-1 + 2.2) / 4.4 * 350) / 640 * bb.width, bb.y + (368 - (-.6 + 2.2) / 4.4 * 356) / 380 * bb.height, { steps: 6 }); await page.mouse.up();
    s = await st('lookup'); expect(Math.abs(s.q[0] + 1) < .11 && Math.abs(s.q[1] + .6) < .11 && near(s.shares, softmax(KEYS.map(k => dot(s.q, k)))), 'dragging the orange arrow moves the query and the shares follow', s.q); }
  for (const q of [[-2, -2], [2, 2], [1, 1], [-.5, 1.3], [0, 0]]) { await setRange('lk-qx', q[0]); await setRange('lk-qy', q[1]); s = await st('lookup'); if (!noNaN(s)) fail('lookup NaN at ' + q); }
  okay('query dragged to the corners, onto chai and coffee, and to 0: no NaN');
  await setRange('lk-qx', 1.5); await setRange('lk-qy', 1);

  console.log('— §3 · w-relay, w-qkv —');
  await show('#w-relay'); s = await st('relay');
  expect(s.bars.length === 8 && s.bars.every(b => near(b.h, Math.max(1.5, 46 * Math.pow(.5, b.i)), 1e-9)) && near(s.voice, Math.pow(.5, 7)), 'relay, 8 words: voice bars 46 × 0.5^i, 0.5⁷ ≈ 0.0078 reaches the end', s.bars);
  let rt = await text('#rl-read'); expect(/hand-overs from the first word to the last: 7/.test(rt) && /0\.0078/.test(rt), 'readout: 7 hand-overs, 0.0078', rt);
  await click('#rl-mode [data-t="all"]'); await setRange('rl-n', 10); s = await st('relay'); rt = await text('#rl-read');
  expect(s.pairs === 45 && /10 × 10 = 100/.test(rt) && /first word to the last: 1\b/.test(rt), 'Try: everyone at once, 10 words: 45 direct lines, 100 questions, 1 hop', { s, rt });
  await click('#rl-play'); await page.waitForTimeout(1700); await click('#rl-mode [data-t="relay"]'); rt = await text('#rl-read');
  expect(/: 9 ·/.test(rt) && /0\.002/.test(rt), 'Try: relay, 10 words: 9 hand-overs, 0.5⁹ ≈ 0.002 (check c5)', rt);
  await click('#rl-play'); await until(() => window.U18.relay.state().t === 1); s = await st('relay'); expect(s.t === 1 && s.hops === 9, '▶ send the message runs to the end', s);
  await setRange('rl-n', 8);
  await show('#w-qkv'); await until(() => { const g = window.U18.qkv.state().geo; return g && g.pillars && g.pillars.length === 3; }, null, 30000); s = await st('qkv');
  const EK = [[1, 0], [0, 1], [1, 1]], EV = [[2, 0], [0, 2], [1, 1]];
  let ex = attend([[2, 0]], EK, EV);
  expect(near(s.shares, ex.A[0]) && near(s.answer, ex.O[0]) && near(r3(s.shares), [0.446, 0.108, 0.446]) && near(r3(s.answer), [1.337, 0.663]), 'q = (2, 0): shares (0.446, 0.108, 0.446), answer (1.337, 0.663)', s);
  expect(s.geo && s.geo.pillars.every((p, i) => near(p.h, 2.2 * ex.A[0][i], 1e-6) && near(p.x, EK[i][0]) && near(p.z, -EK[i][1])), 'drawn pillars stand on the key tips, height = 2.2 × share', s.geo && s.geo.pillars);
  { const ch = s.geo.chain; expect(near(ch[2].to, ex.O[0], 1e-6) && near(s.geo.answer, ex.O[0], 1e-6), 'the chain of shrunken values ends exactly at the answer, and so does the white arrow', ch); }
  let lab3 = await ev(() => window.U18.qkv.labels()); expect(nL(lab3) >= 8 && !spriteOverlaps(lab3).length, 'w-qkv: ' + nL(lab3) + ' 3-D labels, none overlapping (default view)', spriteOverlaps(lab3));
  await setRange('qk-ang', 90); s = await st('qkv'); expect(near(r3(s.answer), [0.663, 1.337]) && s.shares[1] === Math.max(...s.shares), 'Try: angle 90° → tallest pillar over k₂, answer (0.663, 1.337)', s);
  await setRange('qk-len', 0); s = await st('qkv'); expect(near(s.shares, [1 / 3, 1 / 3, 1 / 3]) && near(s.answer, [1, 1]) && s.geo.pillars.every(p => near(p.h, 2.2 / 3, 1e-6)), 'Try: length 0 → three equal pillars (0.333), answer (1, 1) (check c6)', s);
  await setRange('qk-len', 4); await setRange('qk-ang', 225); s = await st('qkv'); expect(noNaN(s), 'length 4 at 225°: no NaN', s);
  await click('#qk-row [data-t="2"]'); s = await st('qkv'); expect(near(r3(s.shares), [0.248, 0.248, 0.503]) && near(s.answer, [1, 1]), 'q = (1, 1): (0.248, 0.248, 0.503), answer exactly (1, 1)', s);
  const mat = await text('#qk-mat'); expect(/0\.663/.test(mat) && /1\.337/.test(mat) && (await page.locator('#qk-mat .rowhot').count()) >= 6, 'matrix strip shows A and the answers, chosen row lit', mat);
  await click('#qk-row [data-t="0"]'); await click('#qk-play'); await until(() => window.U18.qkv.state().phase === 4); s = await st('qkv'); expect(s.phase === 4, '▶ run the lookup plays the four moves to the end', s.phase);

  console.log('— §4 · w-scale —');
  await show('#w-scale'); s = await st('scale');
  expect(s.d === 64 && Math.abs(s.sd - 8) < .5, 'd = 64 raw: measured spread ' + s.sd.toFixed(2) + ' ≈ √64 = 8', s.sd);
  expect(s.bars.every((h, i) => near(h, s.shares[i] * s.BHmax, 1e-3)) && near(s.meter, Math.max(3, s.meterW * s.slope / .25), 1e-3), 'share bars = share × ' + s.BHmax + '; blame meter = width × slope / 0.25', s.bars);
  expect(near(s.shares, softmax(s.row)), 'the drawn row is the softmax of its own scores', s.shares);
  await click('#sc-scaled'); s = await st('scale'); expect(Math.abs(s.sd - 1) < .08, 'divide by √d: spread ' + s.sd.toFixed(3) + ' ≈ 1', s.sd);
  await setRange('sc-d', 9); s = await st('scale'); expect(s.d === 512 && Math.abs(s.sd - 1) < .08, 'd = 512 scaled: spread still ≈ 1', s.sd);
  await click('#sc-scaled'); s = await st('scale'); expect(Math.abs(s.sd - 22.6) < 1.5 && s.top > .99, 'Try: d = 512 raw: spread ' + s.sd.toFixed(1) + ' ≈ 22.6, the row is one tall bar (' + s.top.toFixed(4) + ')', s);
  await setRange('sc-d', 0); s = await st('scale'); expect(noNaN(s) && Math.abs(s.sd - 1) < .1, 'd = 1: spread ≈ 1, no NaN', s.sd);
  await click('#sc-new'); s = await st('scale'); expect(noNaN(s), 'new random vectors: redraws', s.sd); await setRange('sc-d', 6);

  console.log('— §5 · w-context —');
  await show('#w-context'); s = await st('context');
  expect(near(s.A.out, [1.5, .5]) && near(s.B.out, [.5, 1.5]) && near(s.cos, .6) && near(s.angle, 53.130102, 1e-4), 'river bank → (1.5, 0.5), money bank → (0.5, 1.5), cosine 0.6, 53.1°', s);
  expect(near(s.tipA, [s.px[0], s.px[1], s.px[0] + 1.5 * s.px[2], s.px[1] - .5 * s.px[2]], 1e-6) && near(s.tipB, [s.px[0], s.px[1], s.px[0] + .5 * s.px[2], s.px[1] - 1.5 * s.px[2]], 1e-6), 'the thick arrows start at the origin and their tips sit exactly at the computed vectors', [s.tipA, s.tipB]);
  const ctxRun = (nb) => { const X = [nb, [1, 1]]; return attend([[1, 1]], X, X).O[0]; };
  await ev(() => window.U18.context.set('stream')); s = await st('context'); expect(near(s.A.out, ctxRun([3, 0])) && near(r3(s.A.out), [2.34, .33], .001), 'Try: stream → bank slides to (2.34, 0.33) (check c10)', s.A.out);
  await ev(() => window.U18.context.set('money', 'money')); s = await st('context'); expect(near(s.cos, 1) && s.angle < 1e-6, 'Try: money in both sentences → one vector again, cosine 1', s);
  await ev(() => window.U18.context.set('the', 'money')); s = await st('context'); expect(near(s.A.out[0], s.A.out[1]) && near(r3(s.A.w), [.271, .729]), 'Try: “the” keeps bank\'s direction (shares 0.271 / 0.729)', s.A);
  { const names = ['river', 'stream', 'the', 'money', 'loan'], found = []; for (const a of names) for (const b of names) { await ev(([a, b]) => window.U18.context.set(a, b), [a, b]); const o = await overlaps('#w-context'); if (o.length) found.push(a + '/' + b + ': ' + o[0]); }
    expect(!found.length, 'all 25 sentence pairs at 1440: no overlapping labels', found); }
  await ev(() => window.U18.context.set('river', 'money'));

  console.log('— §6 · w-attnmap (the lab) —');
  await show('#w-attnmap'); await until(() => { const g = window.U18.lab.state().geo; return g && g.beams && g.beams.length === 9; }, null, 30000); s = await st('lab');
  let t = await text('#am-read');
  expect(/“it” asks \(head 1/.test(t) && /“ball” 0\.766/.test(t) && /thing feature: 0 → 0\.816/.test(t), 'lab: “it” gives “ball” 0.766; its thing feature 0 → 0.816', t);
  expect(near(r3(s.A[0][6]), [.029, .029, .029, .029, .766, .029, .029, .029, .029]), 'row “it”: ball 0.766, every other word 0.029 (check c12)', s.A[0][6]);
  expect(s.cells.filter(x => x.r === 6).every(x => near(x.o, .06 + .94 * Math.pow(s.A[0][6][x.c], .6), 1e-3)), 'heat map: cell opacity = 0.06 + 0.94·share^0.6', s.cells.filter(x => x.r === 6));
  expect(s.geo && s.geo.beams.length === 9 && s.geo.beams.every(b => near(b.r, .01 + .055 * Math.sqrt(s.A[0][6][b.j]), 1e-9)), '3-D beams: tube radius = 0.01 + 0.055·√share', s.geo && s.geo.beams);
  lab3 = await ev(() => window.U18.lab.labels()); expect(nL(lab3) >= 18 && !spriteOverlaps(lab3).length, 'lab: ' + nL(lab3) + ' 3-D labels, none overlapping', spriteOverlaps(lab3));
  await setRange('am-temp', .3); t = await text('#am-read'); expect(/“ball” (0\.9999|1)\b/.test(t), 'Try: temperature 0.3 → ball 0.9999 (check c13)', t);
  await setRange('am-temp', 3); s = await st('lab'); expect(s.A[0][6][4] < .3 && noNaN(s.A), 'temperature 3 → the row flattens (' + s.A[0][6][4].toFixed(3) + ')', s.A[0][6]);
  await setRange('am-temp', 1);
  await click('#am-head [data-t="1"]'); t = await text('#am-read'); expect(/^“it” asks \(head 2/.test(t) && /“because” 0\.7/.test(t), 'Try: head 2 → “it” looks one word back at “because”', t);
  await click('#am-head [data-t="0"]'); await click('#am-causal');
  s = await st('lab'); expect(s.A[0].every((row, i) => row.every((w, j) => j <= i || w === 0)) && s.A[0].every(r => near(r.reduce((a, b) => a + b, 0), 1)), 'Try: no peeking → every share above the diagonal exactly 0, rows add to 1', s.A[0]);
  await click('#am-causal'); await click('#am-p2'); await page.waitForTimeout(500);
  await page.locator('#am-toks button', { hasText: 'she' }).click(); await page.waitForTimeout(300); t = await text('#am-read');
  expect(/“mother” 0\.789/.test(t), 'Try: preset 2, “she” → “mother” 0.789', t);
  lab3 = await ev(() => window.U18.lab.labels()); expect(!spriteOverlaps(lab3).length, 'preset 2: 3-D labels clear', spriteOverlaps(lab3));
  await page.fill('#am-text', 'the dog chased the kite because it was fast'); await click('#am-go'); await page.waitForTimeout(800); t = await text('#am-read');
  expect(/“kite”/.test(t) && (await page.locator('#am-toks button').count()) === 9, 'typed sentence: 9 words; “it” finds “kite”', t);
  await page.fill('#am-text', 'the zorble ate it'); await click('#am-go'); t = await text('#am-read'); expect(/not in the lab/.test(t) && (await page.locator('#am-toks button.unk').count()) === 1, 'unknown word flagged, treated as a thing', t);
  await page.fill('#am-text', 'my very long sentence has twelve words so the beads sit close together today'); await click('#am-go'); await page.waitForTimeout(900);
  await until(() => window.U18.lab.labels().filter(r => !r.hud).length >= 24, null, 20000);
  lab3 = await ev(() => window.U18.lab.labels()); s = await st('lab'); expect(s.toks.length === 12 && !spriteOverlaps(lab3).length && nL(lab3) >= 24, '12 long words: labels stagger onto two rows, none overlapping; the camera backs off so all 12 words and 12 shares are on screen (' + nL(lab3) + ')', spriteOverlaps(lab3));
  await click('#am-view [data-t="land"]'); await until(() => { const g = window.U18.lab.state().geo; return g && g.pillars && g.pillars.length === 144; }); s = await st('lab');
  expect(s.geo.pillars.length === 144 && s.geo.pillars.every(p => near(p.h, Math.max(.012, 2.4 * s.A[0][p.i][p.j]), 1e-9)), 'landscape: 144 pillars, height = max(0.012, 2.4 × share)', s.geo.pillars.length);
  await click('#am-view [data-t="beams"]'); await click('#am-p1'); await page.waitForTimeout(600);

  console.log('— §7 · w-heads, w-subspace —');
  await show('#w-heads'); s = await st('heads');
  expect(s.word === 'it' && s.A[0].indexOf(Math.max(...s.A[0])) === 4 && s.A[1].indexOf(Math.max(...s.A[1])) === 5 && near(Math.round(s.A[0][4] * 100) / 100, .77) && near(Math.round(s.A[1][5] * 100) / 100, .78), 'Try: “it” — head 1 → ball 0.77, head 2 → because 0.78', s.A);
  expect(s.arcs.every(a => near(a.w, 1 + 7 * s.A[a.h][a.j], .01) && near(a.o, .18 + .82 * s.A[a.h][a.j], .001)), 'arcs: width = 1 + 7·share, opacity = 0.18 + 0.82·share', s.arcs.slice(0, 3));
  t = await text('#hd-read'); expect(/512 \/ 8 = 64/.test(t) && /1 048 576/.test(t), 'd = 512, h = 8 → 64 each; 4d² = 1 048 576', t);
  await setRange('hd-d', 768); await setRange('hd-h', 4); let sp = await ev(() => document.getElementById('hd-split').dataset.state); expect(sp === '768,12,64,2359296', 'Try: d = 768, 12 heads → 64 each, 2 359 296 (check c14)', sp);
  await setRange('hd-d', 512); sp = await ev(() => document.getElementById('hd-split').dataset.state); t = await text('#hd-read'); expect(sp === '512,12,42.67,1048576' && /not a whole number/.test(t), 'd = 512 with 12 heads: flagged as not splitting evenly, weights still 4d²', { sp, t });
  await setRange('hd-h', 7); sp = await ev(() => document.getElementById('hd-split').dataset.state); expect(sp === '512,64,8,1048576', '64 heads of 8: same 1 048 576 weights', sp); await setRange('hd-h', 3);
  { const found = []; for (let i = 0; i < 9; i++) { await ev(i => window.U18.heads.select(i), i); const o = await overlaps('#w-heads'); if (o.length) found.push(i + ': ' + o[0]); } expect(!found.length, 'every asking word at 1440: no overlapping labels in w-heads', found); }
  await ev(() => window.U18.heads.select(6));
  await show('#w-subspace'); s = await st('sub');
  const WDS = [[1, .8, 0], [.75, 1.05, 0], [1, -.8, 0], [.1, -1.1, 0], [-.3, 1.1, .2], [-.3, .3, 1], [.25, -.3, 1], [-.5, 0, .7]];
  const subSh = (h, q) => softmax(WDS.map(x => 3 * WDS[q][h] * x[h]));
  expect(s.q === 'coffee' && s.head === 'drink' && [0, 1, 2].every(h => near(s.shares[h], subSh(h, 1))), 'coffee: the three heads\' shares match an independent computation', s.shares);
  expect(near(r3(s.shares[0][0]), .33) && near(s.shares[0][0], s.shares[0][2]) && s.shares[0][0] === Math.max(...s.shares[0]), 'Try: drink head → chai = lassi = 0.330 on top', s.shares[0]);
  expect(s.shares[2].every(v => near(v, .125)), 'Try: sport head → 0.125 each (check c15)', s.shares[2]);
  expect(s.bars.every(b => near(b.w, Math.max(1.2, s.BW * s.shares[b.h][b.i]), 1e-3)), 'bars: width = ' + s.BW + ' × share (a full column would be 1)', s.bars.slice(0, 4));
  await ev(() => window.U18.sub.set(1, 2)); s = await st('sub'); expect(s.shares[1].indexOf(Math.max(...s.shares[1])) === 3, 'Try: lassi · hot head → the ice gets the most', s.shares[1]);
  { const found = []; for (let h = 0; h < 3; h++) for (let q = 0; q < 8; q++) { await ev(([h, q]) => window.U18.sub.set(h, q), [h, q]); const o = await overlaps('#w-subspace'); if (o.length) found.push(h + '/' + q + ': ' + o[0]); } expect(!found.length, 'all 24 head × word states: no overlapping labels', found); }
  await ev(() => window.U18.sub.set(0, 1));

  console.log('— §8 · w-shuffle, w-clocks, w-rope —');
  await show('#w-shuffle'); s = await st('shuffle'); const E = { dog: [2, 0], bites: [1, 1], man: [0, 2] }, TAG = [[1, 0], [0, 0], [0, 1]];
  const shf = (order, pos) => { const X = order.map((w, p) => E[w].map((v, c) => v + (pos ? TAG[p][c] : 0))); const O = attend(X, X, X).O; return Object.fromEntries(order.map((w, p) => [w, O[p]])); };
  expect(near(s.out.dog, shf(['dog', 'bites', 'man'], false).dog) && near(r3(s.out.dog), [1.723, .277]), 'dog → (1.723, 0.277)', s.out);
  await ev(() => window.U18.shuffle.setOrder(['man', 'bites', 'dog'])); await page.waitForTimeout(900); s = await st('shuffle'); expect(near(r3(s.out.dog), [1.723, .277]), 'Try: man bites dog → dog still (1.723, 0.277): order-blind (check c17)', s.out);
  await click('#sh-pos'); s = await st('shuffle'); expect(near(s.out.dog, shf(['man', 'bites', 'dog'], true).dog) && near(r3(s.out.dog), [1.576, 1.284]), 'Try: with tags, dog last → (1.576, 1.284)', s.out);
  await click('#sh-reset'); await page.waitForTimeout(900); s = await st('shuffle'); expect(near(r3(s.out.dog), [2.967, .019]), 'dog first → (2.967, 0.019)', s.out);
  await click('#sh-shuffle'); await page.waitForTimeout(900); await click('#sh-pos');
  await show('#w-clocks'); s = await st('clocks');
  const PE = (p, om) => om.flatMap(w => [Math.sin(w * p), Math.cos(w * p)]);
  expect(s.d === 4 && near(s.pe, PE(1, [1, .01])) && s.pe.map(x => x.toFixed(4)).join(',') === '0.8415,0.5403,0.0100,1.0000' && near(s.nb, 1.5402523, 1e-6), 'd = 4, position 1: (0.8415, 0.5403, 0.0100, 1.0000); PE(1)·PE(2) = 1.5403', s);
  expect(s.hands.length === 2 && s.hands.every((h, k) => { const a = Math.atan2(h[0], h[1]), want = ([1, .01][k] * 1) % (2 * Math.PI); return near(a, want, 1e-6); }), 'each clock hand points at angle ω·p (drawn = computed)', s.hands);
  for (const p of [2, 3, 10]) { await setRange('ck-pos', p); s = await st('clocks'); if (!(near(s.pe, PE(p, [1, .01])) && near(s.nb, Math.cos(1) + Math.cos(.01), 1e-9))) fail('clocks position ' + p); }
  s = await st('clocks'); expect(s.pe.map(x => x.toFixed(4)).join(',') === PE(10, [1, .01]).map(x => x.toFixed(4)).join(',') && near(s.nb, 1.5402523, 1e-6), 'Try: positions 1, 2, 3, 10 — every neighbouring pair gives 1.5403 (check c18)', s.nb);
  await setRange('ck-pos', 3); s = await st('clocks'); expect(s.pe.map(x => x.toFixed(4)).join(',') === '0.1411,-0.9900,0.0300,0.9996', 'PE(3) = (0.1411, −0.9900, 0.0300, 0.9996)', s.pe);
  await click('#ck-d [data-t="8"]'); await setRange('ck-pos', 1); s = await st('clocks'); expect(s.pe.map(x => x.toFixed(4)).join(',') === '0.8415,0.5403,0.0998,0.9950,0.0100,1.0000,0.0010,1.0000' && s.hands.length === 4, 'd = 8: four clocks, PE(1) = (0.8415, 0.5403, 0.0998, 0.9950, 0.0100, 1.0000, 0.0010, 1.0000)', s.pe);
  let o1 = await overlaps('#w-clocks'); await setRange('ck-pos', 63); o1 = o1.concat(await overlaps('#w-clocks')); expect(!o1.length, 'clocks tab (d = 8, positions 1 and 63): no overlapping labels', o1);
  await click('#ck-d [data-t="4"]'); await setRange('ck-pos', 1);
  await ev(() => window.U18.clocks.set({ tab: 'cmp', k: 1 })); s = await st('clocks');
  expect(s.S.sin.length === 25 && s.S.sin.every(v => near(v, Math.cos(1) + Math.cos(.01), 1e-12)) && s.S.rot.every(v => near(v, Math.cos(Math.PI / 6), 1e-12)) && s.S.learned.length === 15, 'compare, k = 1: clock tags 1.5403 and turns 0.866 at every p (flat); learned rows stop at position 15', s.S.learned.length);
  expect(new Set(s.S.learned.map(v => v.toFixed(3))).size > 10, 'compare: the learned line jumps about (not flat)', s.S.learned);
  await setRange('ck-k', 3); s = await st('clocks'); expect(s.k === 3 && s.S.sin.every(v => near(v, Math.cos(3) + Math.cos(.03), 1e-12)) && s.S.rot.every(v => near(v, 0, 1e-12)) && s.S.learned.length === 13, 'Try: gap 3 — the flat lines move (cos 3 + cos 0.03; cos 90° = 0), stay flat; learned has 13 pairs', s.k);
  const swatchHits = () => ev(() => { const svg = document.getElementById('ck-svg'), T = [...svg.querySelectorAll('text')].map(t => t.getBBox());
    return [...svg.querySelectorAll('[data-role=swatch]')].filter(l => { const b = l.getBBox(), B = { x: b.x, y: b.y - 2, w: b.width, h: b.height + 4 }; return T.some(t => B.x < t.x + t.width && t.x < B.x + B.w && B.y < t.y + t.height && t.y < B.y + B.h); }).length; });
  o1 = []; let swh = 0; for (const k of [1, 2, 4, 6]) { await setRange('ck-k', k); o1 = o1.concat(await overlaps('#w-clocks')); swh += await swatchHits(); } expect(!o1.length && !swh, 'compare tab, gaps 1–6: no overlapping labels, and no legend swatch touches a legend text', { o1, swh });
  await ev(() => window.U18.clocks.set({ tab: 'clocks', k: 1 }));
  await show('#w-rope'); await until(() => { const g = window.U18.rope.state().geo; return g && g.dials && g.dials.length; }, null, 30000); s = await st('rope');
  expect(near(s.total, .5) && s.geo && near(s.geo.dials[0].aq, 3 * Math.PI / 6) && near(s.geo.dials[0].ak, Math.PI / 6), 'RoPE m = 3, n = 1, θ = 30°: arrows drawn at 90° and 30°, score 0.5', s);
  for (const [m, n, want] of [[5, 3, .5], [2, 0, .5], [7, 1, -1]]) { await setRange('rp-m', m); await setRange('rp-n', n); s = await st('rope'); if (!near(s.total, want, 1e-9)) fail('rope ' + m + ',' + n); }
  s = await st('rope'); expect(near(s.total, -1, 1e-9), 'Try: (5, 3) and (2, 0) → 0.5; m = 7, n = 1 → −1 (check c16)', s.total);
  await setRange('rp-m', 3); await setRange('rp-n', 1); await click('#rp-both'); await until(() => { const s = window.U18.rope.state(); return s.m === 4 && s.n === 2; }); s = await st('rope'); expect(s.m === 4 && s.n === 2 && near(s.total, .5, 1e-9), 'Try: ▶ move both forward → (4, 2), score unchanged 0.5', s);
  lab3 = await ev(() => window.U18.rope.labels()); expect(!spriteOverlaps(lab3).length, 'rope: 3-D label clear', spriteOverlaps(lab3));
  await click('#rp-many'); await page.waitForTimeout(400); s = await st('rope'); lab3 = await ev(() => window.U18.rope.labels());
  expect(s.many && s.scores.length === 3 && near(s.scores, [1, 1 / 3, 1 / 9].map(k => Math.cos(2 * 30 * k * Math.PI / 180))) && nL(lab3) === 3 && !spriteOverlaps(lab3).length, 'three clocks: speeds 1, 1/3, 1/9; three labels, none overlapping', { sc: s.scores, o: spriteOverlaps(lab3) });
  await click('#rp-many'); await setRange('rp-th', 90); await setRange('rp-m', 11); await setRange('rp-n', 0); s = await st('rope'); expect(noNaN(s) && near(s.total, Math.cos(11 * Math.PI / 2), 1e-9), 'extremes (θ = 90°, gap 11): no NaN', s.total); await setRange('rp-th', 30); await setRange('rp-m', 3); await setRange('rp-n', 1);

  console.log('— §9 · w-layernorm, w-block —');
  await show('#w-layernorm'); s = await st('ln');
  const LN = (x, g, b) => { const m = x.reduce((a, c) => a + c, 0) / x.length, v = x.reduce((a, c) => a + (c - m) ** 2, 0) / x.length; return x.map(c => (v > 0 ? (c - m) / Math.sqrt(v) : 0) * g + b); };
  expect(near(s.y, LN([1, 2, 3, 6], 1, 0)) && near(r3(s.y), [-1.069, -.535, 0, 1.604]) && s.mean === 3 && s.variance === 3.5, 'LN(1, 2, 3, 6): mean 3, variance 3.5 → (−1.069, −0.535, 0, 1.604)', s);
  { const vals = [s.x, s.x.map(v => v - s.mean), s.y]; expect(s.bars.every(b => near(b.h, Math.max(1.5, Math.abs(Math.max(-8, Math.min(10, vals[b.k][b.i]))) * s.panels[b.k].unit), .01)), 'every bar is |value| × the panel\'s scale (drawn = computed)', s.bars.slice(0, 4)); }
  for (const [i, v] of [[1, 2], [2, 4], [3, 4], [4, 6]]) await setRange('ln-x' + i, v); s = await st('ln'); expect(near(r3(s.y), [-1.414, 0, 0, 1.414]), 'Try: (2, 4, 4, 6) → (−1.414, 0, 0, 1.414) (check c19)', s.y);
  await setRange('ln-g', 2); await setRange('ln-b', 1); s = await st('ln'); expect(near(r3(s.y), [-1.828, 1, 1, 3.828]), 'Try: γ = 2, β = 1 → (−1.828, 1, 1, 3.828)', s.y);
  expect(s.bars.filter(b => b.k === 2).every(b => near(b.h, Math.max(1.5, Math.abs(s.y[b.i]) * s.panels[2].unit), .01)), 'γ = 2, β = 1: the result panel grows to fit, so the 3.828 bar is drawn whole (not cut at 3)', s.bars.filter(b => b.k === 2));
  for (const i of [1, 2, 3, 4]) await setRange('ln-x' + i, 5); s = await st('ln'); expect(noNaN(s) && s.y.every(v => near(v, 1)), 'all four equal: nothing to scale (0 × γ + β), no NaN', s.y);
  for (const [i, v] of [[1, 1], [2, 2], [3, 3], [4, 6]]) await setRange('ln-x' + i, v); await setRange('ln-g', 1); await setRange('ln-b', 0);
  await show('#w-block'); await until(() => { const g = window.U18.block.state().geo; return g && g.bars && g.bars.length === 4; }, null, 30000); s = await st('block');
  const BL = [-1.1659977, -.3179994, -.1059998, 1.5899968];
  expect(s.geo && near(s.geo.v, BL, 1e-5) && s.geo.bars.every((b, k) => near(b.h, Math.abs(BL[k]) * .44, 1e-5) && b.sign === Math.sign(BL[k])), 'block output (−1.166, −0.318, −0.106, 1.590); bar heights = |value| × 0.44', s.geo);
  lab3 = await ev(() => window.U18.block.labels()); expect(nL(lab3) >= 8 && !spriteOverlaps(lab3).length, 'block: ' + nL(lab3) + ' readable floor labels, none overlapping', spriteOverlaps(lab3));
  await click('#bk-reset'); await click('#bk-step'); await until(() => window.U18.block.state().lv === 1); await click('#bk-step'); await until(() => window.U18.block.state().lv === 2); s = await st('block');
  expect(s.lv === 2 && near(s.geo.v, [1, 2, 3, 6], 1e-9), 'Try: two stations up the page is (1, 2, 3, 6)', s.geo);
  await click('#bk-play'); await until(() => window.U18.block.state().lv === 6, null, 30000); s = await st('block'); expect(s.lv === 6, '▶ send the word up reaches the top', s.lv);
  t = await text('#bk-params'); expect(/3 145 728/.test(t) && /3 150 336/.test(t) && /3 152 384/.test(t), 'Try: d = 512 → 3 145 728 → 3 150 336 → 3 152 384', t);
  await click('#bk-d [data-t="256"]'); t = await text('#bk-params'); expect(/262 144/.test(t) && /789 760/.test(t), 'd = 256: 262 144 … 789 760 (problem 12)', t); await click('#bk-d [data-t="512"]');

  console.log('— §10 · w-mask —');
  await show('#w-mask'); await click('#mk-mode [data-t="dec"]'); s = await st('mask');
  ex = attend(EK.map((_, i) => [[2, 0], [0, 2], [1, 1]][i]), EK, EV, true);
  expect(near(s.A, ex.A) && near(r3(s.A[1]), [.196, .804, 0]) && near(r3(s.O[1]), [.391, 1.609]), 'decoder rows (1, 0, 0), (0.196, 0.804, 0), (0.248, 0.248, 0.503); row 2 → (0.391, 1.609)', s.A);
  expect(s.cells.every(x => x.c > x.r ? x.hatch : near(x.o, .12 + .88 * s.A[x.r][x.c], 1e-3)), 'masked cells hatched; open cells opacity 0.12 + 0.88·share', s.cells);
  await click('#mk-play'); await until(() => window.U18.mask.state().rows === 9); s = await st('mask'); expect(s.rows === 9, '▶ fill row by row ends with every row shown', s.rows);
  await click('#mk-mode [data-t="enc"]'); s = await st('mask'); expect(near(s.A, attend([[2, 0], [0, 2], [1, 1]], EK, EV).A), 'encoder: the full rows of §3', s.A);
  await click('#mk-mode [data-t="all"]'); s = await st('mask');
  expect(s.see.length === 50 && s.see.every(x => x.gold === (x.c <= x.r)) && s.graded === 8, 'every guess at once: two staircases (what each position may see), 4 graded guesses in each', s);
  await click('#mk-play'); await page.waitForTimeout(700); const mid = await st('mask'); await until(() => window.U18.mask.state().u === 1); s = await st('mask');
  expect(mid.u < 1 && s.u === 1 && s.graded === 8, 'Try: ▶ race them — the relay lights its guesses one per step, the transformer all at once', { mid: mid.u, end: s.u });
  const mr = await text('#mk-read'); expect(/relay: 4 steps/.test(mr) && /1 step per layer/.test(mr), 'readout: relay 4 steps, masked transformer 1 step', mr);
  o1 = await overlaps('#w-mask'); expect(!o1.length, 'every guess at once at 1440: no overlapping or cut-off labels (“(nothing after)” fits)', o1);
  await click('#mk-mode [data-t="enc"]');

  console.log('— §11 · w-families —');
  await show('#w-families'); s = await st('families');
  expect(s.fam === 'bert' && s.graded.join() === '3,10' && s.mask.chosen.join() === '3,10' && s.cells.every(x => x.gold), 'BERT: every cell gold; 2 of 12 words hidden (delhi, rain) and only they are graded', s.graded);
  let fr = await text('#fm-read'); expect(/76\.8/.test(fr) && /61\.44/.test(fr) && /7\.68/.test(fr) && /511/.test(fr) && /6\.7 times/.test(fr), 'text of 512: 76.8 (61.44 / 7.68 / 7.68) against 511, 6.7 times', fr);
  const seen = new Set(); for (let k = 0; k < 8; k++) { await click('#fm-mask'); s = await st('families'); seen.add(s.mask.chosen.join()); if (s.graded.length !== 2 || !s.cells.every(x => x.gold)) fail('bert masking ' + k); }
  expect(seen.size >= 5, 'Try: new masking ×8 → always 2 of 12 chosen (15% of 12 = 1.8 ≈ 2), in ' + seen.size + ' different places', [...seen]);
  await ev(() => window.U18.families.set('gpt')); s = await st('families');
  expect(s.cells.every(x => x.gold === (x.c <= x.r)) && s.graded.length === 11 && s.graded.join() === '0,1,2,3,4,5,6,7,8,9,10', 'Try: GPT — a staircase; 11 of 12 positions graded', s.graded);
  await ev(() => window.U18.families.set('t5')); s = await st('families');
  const al = [[2, 0, 0], [0, .5, 2], [0, 2, .5], [1, 1, 0]].map(softmax);
  const g = k => s.cells.filter(x => x.g === k);
  expect(g('enc').length === 9 && g('enc').every(x => x.gold) && g('dec').every(x => x.gold === (x.c <= x.r)) && g('cross').every(x => near(x.o, .12 + .88 * al[x.r][x.c], 1e-3)) && s.graded.length === 4, 'Try: encoder–decoder — encoder all gold, decoder staircase, cross-attention = §1\'s map (opacity 0.12 + 0.88·weight), 4 graded', s.graded);
  await setRange('fm-n', 10); fr = await text('#fm-read'); expect(/153\.6/.test(fr) && /1 023/.test(fr), 'text of 1 024: 153.6 against 1 023 (problem 14)', fr);
  await setRange('fm-n', 8); fr = await text('#fm-read'); expect(/38\.4/.test(fr) && /30\.72/.test(fr), 'text of 256: 38.4 chosen, 30.72 [MASK] (check c24)', fr); await setRange('fm-n', 9);
  o1 = []; for (const f of ['bert', 'gpt', 't5']) { await ev(f => window.U18.families.set(f), f); o1 = o1.concat(await overlaps('#w-families')); } expect(!o1.length, 'all three families at 1440: no overlapping labels', o1);
  await ev(() => window.U18.families.set('bert'));

  console.log('— §12 · w-cost —');
  await show('#w-cost'); s = await st('cost');
  expect(s.n === 1000 && s.scores === 1e6 && near(s.mb, 2), '1 000 words: 1 000 000 scores', s);
  await setRange('cs-h', 12); await setRange('cs-L', 12); t = await text('#cs-read'); expect(/144 000 000/.test(t) && /288 MB/.test(t), 'Try: 12 heads × 12 layers → 144 000 000 scores ≈ 288 MB', t);
  s = await st('cost'); expect(near(s.dotsY[2], await ev(() => { const s = window.U18.cost.state(); return s.py(Math.log10(12)); }), 1e-6), 'the green dot sits at 12 steps (log scale) — only the layers count', s.dotsY);
  await ev(() => { window.U18.cost.st.lg = Math.log10(2048); window.U18.cost.st.h = 16; window.U18.cost.st.L = 24; window.U18.cost.draw(); }); s = await st('cost'); expect(s.scores === 1610612736, '2 048 × 16 heads × 24 layers: 1 610 612 736 (problem 16)', s.scores);
  await setRange('cs-n', 5); await setRange('cs-h', 32); await setRange('cs-L', 48); s = await st('cost'); expect(noNaN(s.dotsY), 'extremes (100 000 words, 32 heads, 48 layers): no NaN, curves clipped to the chart', s.dotsY);
  o1 = await overlaps('#w-cost'); expect(!o1.length, 'w-cost: no overlapping tick or legend labels', o1);
  await setRange('cs-n', 3); await setRange('cs-h', 1); await setRange('cs-L', 1);

  console.log('— §13 · w-tiny —');
  await show('#w-tiny'); await ev(() => window.U18.tiny.go(3)); t = await text('#tn-card'); expect(/0\.944/.test(t) && /0\.056/.test(t), 'Try: step 4 — head 1 row 2 = (0.944, 0.056)', t);
  await click('#tn-next'); await click('#tn-next'); t = await text('#tn-card'); expect(/0\.196/.test(t) && /0\.804/.test(t), 'step 6: head 2 row 2 = (0.196, 0.804)', t);
  await click('#tn-end'); t = await text('#tn-card'); expect(/chai 0\.877/.test(t) && /loss = .*= 0\.446/.test(t), 'Try: step 12 — chai 0.877, loss 0.446', t);
  await click('#tn-sent [data-t="play"]'); t = await text('#tn-card'); expect(/cricket 0\.874/.test(t), 'Try: “I play” → cricket 0.874 (check c30)', t);
  await click('#tn-sent [data-t="drink"]'); await click('#tn-prev'); expect((await text('#tn-count')) === '11 / 12', 'back button: 11 / 12', await text('#tn-count'));
  await page.locator('#tn-scrub button').first().click();

  console.log('— carry-forward cards —');
  const cards = await ev(() => [...document.querySelectorAll('#s14 .cd')].map(c => [c.querySelector('svg.mini') ? 1 : 0, c.querySelector('h4').textContent]));
  expect(cards.length === 12 && cards.every(c => c[0]), '12 carry-forward cards, each with its own mini picture', cards);
  o1 = await overlaps('#s14'); expect(!o1.length, 'mini pictures: no overlapping labels', o1);

  console.log('— 3-D labels from every side —');
  /* the stages turn (slowly by themselves, or by a drag): walk each camera once around, 45° at a time; at every stop the labels still on screen must not touch */
  for (const [sel, name] of [['#w-qkv', 'qkv'], ['#w-attnmap', 'lab'], ['#w-rope', 'rope'], ['#w-block', 'block']]) {
    await show(sel); await until(n => window.U18[n].labels().filter(r => !r.hud).length > 0, name, 30000);
    const found = [], counts = [];
    for (let k = 0; k < 8; k++) { await ev(n => window.U18[n].turn(Math.PI / 4), name); await ev(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const l = await ev(n => window.U18[n].labels(), name); counts.push(nL(l)); const o = spriteOverlaps(l); if (o.length) found.push((k + 1) * 45 + '°: ' + o[0]); }
    expect(!found.length, name + ': 8 camera angles, labels never touch (a label that would is faded until the view frees it; ' + Math.min(...counts) + '–' + Math.max(...counts) + ' shown)', found); }

  console.log('— all SVG widgets at 1440 (default states) —');
  await ev(() => scrollTo(0, 0)); await page.waitForTimeout(300);
  o1 = await overlaps('.widget'); expect(!o1.length, 'no overlapping labels in any SVG widget', o1);

  console.log('— checks, drawers, practice —');
  const nOk = await ev(() => { let n = 0; document.querySelectorAll('.check').forEach(ch => { const b = ch.querySelector('.opts button[data-correct]'); if (b) { b.click(); n++; } }); return n; });
  await page.waitForTimeout(300);
  const sc2 = await ev(() => [document.getElementById('score').textContent, document.getElementById('score-chip').classList.contains('done'), (localStorage.getItem('mfml-u18-checks') || '').split(',').filter(Boolean).length]);
  expect(nOk === 31 && sc2[0] === '31' && sc2[1] && sc2[2] === 31, 'all 31 checks answerable; score 31/31 stored under mfml-u18-checks', [nOk, sc2]);
  const shape = await ev(() => [...document.querySelectorAll('.check')].every(ch => ch.querySelectorAll('.opts button[data-correct]').length === 1 && ch.querySelectorAll('.opts button').length === 3 && [...ch.querySelectorAll('.opts button')].every(b => (b.dataset.why || '').length > 40)));
  expect(shape, 'every check: exactly one right answer among three, and every option explains itself', shape);
  const predict = await ev(() => [...document.querySelectorAll('.check .tag')].filter(t => /predict|Try it/i.test(t.textContent)).length);
  expect(predict === 31, 'every check is a "Pause & predict" or "Try it, then answer"', predict);
  const wrong = await ev(() => { const ch = document.querySelector('.check'); const b = ch.querySelector('.opts button:not([data-correct])'); b.click(); return ch.querySelector('.why').textContent.slice(0, 20); });
  expect(/Not quite/.test(wrong), 'a wrong answer explains itself', wrong);
  const dr = await ev(() => { const ds = [...document.querySelectorAll('details.algebra')]; ds.forEach(d => d.open = true); return ds.every(d => d.querySelector('.derive') && d.querySelector('.derive').offsetHeight > 0); });
  expect(dr, 'all 10 drawers open and show their derivations', dr);
  const pr = await ev(() => { const ss = [...document.querySelectorAll('#spractice details.sol')]; const closed = ss.every(d => !d.open); ss.forEach(d => d.open = true); return [ss.length, closed, document.querySelectorAll('#spractice .pans').length, document.querySelectorAll('#spractice .pstep').length, !!document.querySelector('#spractice .next-card'), document.querySelector('#spractice .sec-num').textContent, document.querySelectorAll('#spractice .ptest').length]; });
  expect(pr[0] === 16 && pr[1] && pr[2] === 16 && pr[3] > 55 && pr[4] && pr[5] === '15' && pr[6] === 16, 'practice: 16 solutions (closed at load), 16 "what this tests", 16 answer lines, ' + pr[3] + ' steps, next-card inside, § 15', pr);
  const wide2 = await ev(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  expect(!wide2, 'with every drawer and solution open, no display equation overflows at 1440px', wide2);

  console.log('— reduced motion —');
  { const rm = await browser.newPage({ viewport: { width: 1300, height: 900 } }); rm.setDefaultTimeout(120000); await rm.emulateMedia({ reducedMotion: 'reduce' }); await rm.goto(URL, { timeout: 180000 }); await rm.waitForTimeout(1500);
    await rm.locator('#w-align').scrollIntoViewIfNeeded(); await rm.waitForTimeout(500); await rm.locator('#al-play').click(); await rm.waitForTimeout(300);
    const a = await rm.evaluate(() => window.U18.align.state()); await rm.locator('#w-block').scrollIntoViewIfNeeded(); await rm.waitForTimeout(1200); await rm.locator('#bk-play').click(); await rm.waitForTimeout(300);
    const b = await rm.evaluate(() => window.U18.block.state()); await rm.locator('#w-mask').scrollIntoViewIfNeeded(); await rm.locator('#mk-mode [data-t="all"]').click(); await rm.locator('#mk-play').click(); await rm.waitForTimeout(300);
    const m = await rm.evaluate(() => window.U18.mask.state());
    expect(a.step === 3 && a.u === 1 && b.lv === 6 && m.u === 1, 'reduced motion: ▶ buttons jump straight to the final picture', { a: [a.step, a.u], b: b.lv, m: m.u }); await rm.close(); }

  console.log('— frame timing: main-thread work per frame in steady animation —');
  /* rAF gaps on this sandbox are set by software WebGL and by whatever else shares its 2 CPUs, so the test reads the browser's own
     long-animation-frame records: for every frame, the time spent running page scripts plus style, layout and paint. */
  const frameWork = (btn, ms) => ev(([btn, ms]) => new Promise(res => { const L = []; const po = new PerformanceObserver(l => l.getEntries().forEach(e => L.push(e))); po.observe({ type: 'long-animation-frame' });
    const gaps = []; let last = performance.now(); const t0 = last; document.getElementById(btn).click();
    const f = now => { gaps.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(f); else setTimeout(() => { po.disconnect(); const E = L.filter(e => e.startTime >= t0 - 1);
      res({ gaps: gaps.slice(3).sort((a, b) => a - b), work: E.map(e => e.scripts.reduce((a, s) => a + s.duration, 0) + (e.renderStart ? e.startTime + e.duration - e.renderStart : 0)), block: E.map(e => e.blockingDuration) }); }, 200); };
    requestAnimationFrame(f); }), [btn, ms]);
  for (const [sel, btn, ms, name, prep] of [['#w-align', 'al-play', 6300, 'w-align ▶ translate (SVG)', null], ['#w-attnmap', 'am-go', 3000, 'lab beam flow (3-D)', () => ev(() => window.U18.lab.select(6))], ['#w-block', 'bk-play', 6400, 'block ▶ send the word up (3-D)', null]]) {
    await show(sel); if (prep) await prep(); await page.waitForTimeout(2200);
    const r = await frameWork(btn, ms), g = r.gaps, worst = Math.max(0, ...r.work), blocked = Math.max(0, ...r.block), q = p => g.length ? g[Math.min(g.length - 1, Math.floor(g.length * p))].toFixed(1) : '–';
    console.log('       ' + name + ': worst frame work ' + worst.toFixed(1) + ' ms (' + r.work.length + ' long frames) · longest blocking task ' + blocked.toFixed(0) + ' ms · rAF gaps median ' + q(.5) + ' ms, p95 ' + q(.95) + ' ms over ' + g.length + ' frames (load ' + require('os').loadavg()[0].toFixed(1) + ' on ' + require('os').cpus().length + ' CPUs)');
    expect(worst < 50, name + ': no frame spends 50 ms or more running the page (scripts + style/layout/paint)', { worst, blocked }); }

  console.log('— narrow screens —');
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(700);
    const o = await ev(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, [...document.querySelectorAll('.katex-display')].filter(k => k.offsetParent && k.scrollWidth > k.clientWidth + 1).length]);
    expect(o[0] <= o[1] + 1 && !o[2], w + 'px: no horizontal overflow, every display equation fits', o); }
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(2500);
  const H390 = await ev(() => document.body.scrollHeight); for (let y = 0; y < H390; y += 700) { await ev(v => scrollTo(0, v), y); await page.waitForTimeout(60); } await page.waitForTimeout(800);
  const small = await ev(() => { const out = []; document.querySelectorAll('.widget svg').forEach(svg => { if (!svg.checkVisibility || !svg.checkVisibility()) return; const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width; svg.querySelectorAll('text').forEach(t => { const fs = parseFloat(getComputedStyle(t).fontSize) * k; if (fs < 10.9 && t.textContent.trim()) out.push(svg.id + ':' + t.textContent.slice(0, 12) + ':' + fs.toFixed(1)); }); }); return out; });
  expect(!small.length, '390px: every SVG label renders at ≥ 11 px', small.slice(0, 8));
  o1 = await overlaps('.widget'); expect(!o1.length, '390px: no overlapping labels in any SVG widget (default states)', o1);
  { const found = []; await show('#w-context'); for (const a of ['river', 'stream', 'the', 'money', 'loan']) for (const b of ['river', 'money', 'loan', 'the']) { await ev(([a, b]) => window.U18.context.set(a, b), [a, b]); const o = await overlaps('#w-context'); if (o.length) found.push(a + '/' + b + ': ' + o[0]); } await ev(() => window.U18.context.set('river', 'money'));
    await show('#w-families'); for (const f of ['bert', 'gpt', 't5']) { await ev(f => window.U18.families.set(f), f); const o = await overlaps('#w-families'); if (o.length) found.push(f + ': ' + o[0]); } await ev(() => window.U18.families.set('bert'));
    await show('#w-mask'); for (const m of ['dec', 'all']) { await click(`#mk-mode [data-t="${m}"]`); const o = await overlaps('#w-mask'); if (o.length) found.push(m + ': ' + o[0]); } await click('#mk-mode [data-t="enc"]');
    await show('#w-clocks'); await ev(() => window.U18.clocks.set({ tab: 'cmp' })); let o = await overlaps('#w-clocks'); if (o.length) found.push('cmp: ' + o[0]); await ev(() => window.U18.clocks.set({ tab: 'clocks', d: 8 })); o = await overlaps('#w-clocks'); if (o.length) found.push('d8: ' + o[0]); await ev(() => window.U18.clocks.set({ d: 4 }));
    await show('#w-align'); await click('#al-mode [data-t="none"]'); o = await overlaps('#w-align'); if (o.length) found.push('align none: ' + o[0]); await click('#al-mode [data-t="att"]');
    await show('#w-heads'); for (let i = 0; i < 9; i++) { await ev(i => window.U18.heads.select(i), i); o = await overlaps('#w-heads'); if (o.length) found.push('heads ' + i + ': ' + o[0]); } await ev(() => window.U18.heads.select(6));
    expect(!found.length, '390px: other states (context pairs, families, mask, clocks, align, heads) — no overlapping labels', found); }
  { await show('#w-attnmap'); await until(() => window.U18.lab.labels().filter(r => !r.hud).length >= 9, null, 30000); await page.waitForTimeout(500); const l = await ev(() => window.U18.lab.labels()); const smallL = l.filter(r => !r.hud && r.h * .6 < 10.5);
    expect(nL(l) >= 9 && !spriteOverlaps(l).length && !smallL.length, '390px lab: ' + nL(l) + ' 3-D word labels, staggered, none overlapping, text ≥ 11 px', { o: spriteOverlaps(l), small: smallL.map(r => r.t + ':' + (r.h * .6).toFixed(1)) }); }
  for (const [id, name] of [['#w-qkv', 'qkv'], ['#w-block', 'block'], ['#w-rope', 'rope']]) { await show(id); await until(n => window.U18[n].labels().filter(r => !r.hud).length > 0, name, 30000); await page.waitForTimeout(400); const l = await ev(n => window.U18[n].labels(), name); const sm = l.filter(r => !r.hud && r.h * .6 < 10.5).map(r => r.t + ':' + (r.h * .6).toFixed(1));
    expect(!spriteOverlaps(l).length && !sm.length, '390px ' + name + ': ' + nL(l) + ' 3-D labels clear, none cut off, text ≥ 11 px', { o: spriteOverlaps(l), small: sm }); }
  await page.setViewportSize({ width: 1440, height: 950 });

  console.log('— hero keeps clear of the intro text —');
  for (const [w, h] of [[1280, 800], [1440, 900], [1568, 757], [1920, 1080]]) { const hp = await browser.newPage({ viewport: { width: w, height: h } }); hp.setDefaultTimeout(120000); await hp.goto(URL, { timeout: 180000 }); await hp.waitForTimeout(2600);
    const res = []; for (const at of [1, 5, 9, 12.5, 15.5]) { await hp.evaluate(a => { window.U18HeroAt = a; }, at); await hp.waitForTimeout(700); res.push(await hp.evaluate(() => window.U18.hero.bounds())); }
    const worst = Math.min(...res.map(r => r.lo - r.textR)); expect(worst > 16, w + '×' + h + ': the hero scene stays ' + Math.round(worst) + ' px clear of the intro text through its loop', res.map(r => [Math.round(r.textR), Math.round(r.lo), Math.round(r.hi)])); await hp.close(); }

  console.log('— theme flip —');
  await page.click('#theme-btn'); await page.waitForTimeout(1500);
  const lightOv = await overlaps('.widget'); expect(await ev(() => document.documentElement.getAttribute('data-theme')) === 'light' && !lightOv.length, 'light theme: every SVG redrawn, no overlapping labels', lightOv);
  await page.click('#theme-btn'); await page.waitForTimeout(800);

  console.log('— console —');
  expect(!errors.length, 'no console or page errors', errors.slice(0, 10));
  console.log(bad ? `\n${bad} PROBLEM(S) · ${nok} ok` : `\n✓ UNIT 18 WIDGETS PASS · ${nok} checks`);
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
