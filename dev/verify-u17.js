/* Unit 17 · Machines with Memory — widget behaviour and numerical correctness (WebGL on). Round 22.
   PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u17.js
   Every widget exposes window.U17W['w-…'].state(): the numbers its picture was drawn from. This file checks
   (1) those numbers against independent re-computations written here, (2) the drawn geometry against those numbers,
   (3) every claim of every Try line, (4) every control (changes something, no NaN, reset restores),
   (5) no overlapping or clipped text in any SVG at 1300 and 390 px, and no overlapping labels in the 3-D stages,
   (6) themes, reduced motion, narrow screens, checks, drawers, practice, console. */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
const near = (a, b, t) => Math.abs(a - b) < (t == null ? 1e-6 : t);
const URL = 'file:///home/claude/mfml-site/dev/site/unit-17.html';
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

/* ---------- independent re-computations (not the page's code) ---------- */
const rnn = (w, u, xs) => { const h = [0]; xs.forEach(x => h.push(Math.tanh(w * h[h.length - 1] + u * x))); return h; };
const sm = (s, T) => { const m = Math.max(...s), e = s.map(v => Math.exp((v - m) / (T || 1))), z = e.reduce((a, b) => a + b, 0); return e.map(v => v / z); };
const sig = z => 1 / (1 + Math.exp(-z));
function bptt(w, u, xs, y) { const h = rnn(w, u, xs), T = xs.length, dh = Array(T + 1).fill(0), dz = Array(T + 1).fill(0), cw = Array(T + 1).fill(0); dh[T] = h[T] - y;
  for (let t = T; t >= 1; t--) { dz[t] = dh[t] * (1 - h[t] ** 2); cw[t] = dz[t] * h[t - 1]; dh[t - 1] = w * dz[t]; } return { h, dh, dz, cw, dw: cw.reduce((a, b) => a + b, 0) }; }
function eigs(M) { const [[a, b], [c, d]] = M, tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
  if (disc < 0) return { real: false, re: tr / 2, im: Math.sqrt(-disc), rho: Math.sqrt(det) }; const s = Math.sqrt(disc), l = [tr / 2 + s, tr / 2 - s].sort((x, y) => Math.abs(y) - Math.abs(x)); return { real: true, l, rho: Math.abs(l[0]) }; }
const mv = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
const orbit = (M, v, n) => { const P = [v]; for (let t = 0; t < n; t++) P.push(mv(M, P[P.length - 1])); return P; };
function bleu2(cand, ref) { const c = cand.toLowerCase().split(/\s+/).filter(Boolean), r = ref.split(' '); const g2 = w => w.slice(0, -1).map((x, i) => x + ' ' + w[i + 1]);
  const clip = (cg, rg) => { const left = {}; rg.forEach(g => left[g] = (left[g] || 0) + 1); let k = 0; cg.forEach(g => { if (left[g] > 0) { left[g]--; k++; } }); return k; };
  const k1 = clip(c, r), k2 = clip(g2(c), g2(r)), p1 = c.length ? k1 / c.length : 0, p2 = c.length > 1 ? k2 / (c.length - 1) : 0, BP = !c.length ? 0 : c.length >= r.length ? 1 : Math.exp(1 - r.length / c.length);
  return { p1, p2, BP, score: p1 > 0 && p2 > 0 ? BP * Math.sqrt(p1 * p2) : 0, k1, k2 }; }
function talkModel(M) { const C = M.chars, H = M.H, IX = {}; for (let i = 0; i < C.length; i++) IX[C[i]] = i;
  const step = (h, ch) => M.W.map((row, i) => Math.tanh(M.b[i] + M.U[i][IX[ch]] + row.reduce((a, w, j) => a + w * h[j], 0)));
  const scores = h => M.V.map((row, i) => M.c[i] + row.reduce((a, w, j) => a + w * h[j], 0));
  const park = seed => { let a = (Math.imul(seed, 0x9E3779B1) + 4) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };   /* mulberry32 from a hash of the dice number (as the page) */
  function talk(seed, how, T, dice) { let h = Array(H).fill(0); for (const ch of ' ' + seed) h = step(h, ch); const rnd = park(dice || 1); let out = '';
    while (out.split('.').length - 1 < 2 && out.length < 110) { const p = sm(scores(h), how === 'greedy' ? 1 : T); let k;
      if (how === 'greedy') k = p.indexOf(Math.max(...p)); else { const r = rnd(); let acc = 0; k = p.length - 1; for (let i = 0; i < p.length; i++) { acc += p[i]; if (r < acc) { k = i; break; } } }
      out += C[k]; h = step(h, C[k]); } return out; }
  function teach(s) { let h = Array(H).fill(0), prev = ' ', tot = 0; const rows = []; for (const ch of s) { h = step(h, prev); const p = sm(scores(h), 1); rows.push({ ch, p: p[IX[ch]] }); tot -= Math.log(p[IX[ch]]); prev = ch; } return { tot, rows }; }
  function next(seed, T) { let h = Array(H).fill(0); for (const ch of ' ' + seed) h = step(h, ch); return { p: sm(scores(h), T || 1), h }; }
  return { talk, teach, next, C }; }

/* ---------- in-page sweep: overlapping / clipped text and NaN, for every SVG of the unit, over many states ---------- */
const SWEEP = async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)), set = (id, v) => { const s = document.getElementById(id); s.value = String(v); s.dispatchEvent(new Event('input')); }, clk = sel => document.querySelector(sel).click();
  const ov = svg => { const out = []; if (!svg || !svg.getBoundingClientRect().width) return out;
    const vis = t => { for (let n = t; n && n.nodeType === 1; n = n.parentNode) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } return true; };
    const op = t => { let o = 1; for (let n = t; n && n !== svg.parentNode; n = n.parentNode) o *= +getComputedStyle(n).opacity; return o; };
    const ts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && vis(t) && op(t) > .15).map(t => ({ t: t.textContent.trim(), r: t.getBoundingClientRect() })), sr = svg.getBoundingClientRect();
    ts.forEach(a => { if (a.r.left < sr.left - 1 || a.r.right > sr.right + 1 || a.r.top < sr.top - 1 || a.r.bottom > sr.bottom + 1) out.push('clipped "' + a.t + '"'); });
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) { const a = ts[i].r, c = ts[j].r, ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (ix > 1.5 && iy > 1.5) out.push('"' + ts[i].t + '" × "' + ts[j].t + '"'); }
    return out; };
  const nan = w => /NaN|Infinity|undefined/.test(w.textContent) || [...w.querySelectorAll('svg *')].some(e => [...e.attributes].some(a => /NaN|Infinity/.test(a.value)));
  const R = {}; let n = 0; const chk = (tag, svgId, wid) => { n++; const o = ov(document.getElementById(svgId)); if (o.length) R[tag] = o; if (nan(document.getElementById(wid))) R[tag + ' · NaN'] = true; };
  chk('order note', 'or-svg', 'w-order'); for (const th of [0, 45, 135, 180]) { set('or-th', th); chk('order ' + th + '°', 'or-svg', 'w-order'); } set('or-th', 90); set('or-k', .3); chk('order keep .3', 'or-svg', 'w-order'); set('or-k', 1);
  clk('#or-mode [data-t=bag]'); chk('order bag', 'or-svg', 'w-order'); clk('#or-mode [data-t=win]'); for (const k of [1, 3, 8]) { set('or-win', k); chk('order window ' + k, 'or-svg', 'w-order'); } clk('#or-reset');
  for (let k = 0; k <= 3; k++) { U17W['w-rnn-step'].st.k = k; U17W['w-rnn-step'].draw(); chk('rnn-step k' + k, 'rs-svg', 'w-rnn-step'); }
  set('rs-w', 1.5); set('rs-u', 2); chk('rnn-step max', 'rs-svg', 'w-rnn-step'); set('rs-w', 0); set('rs-u', 0); chk('rnn-step min', 'rs-svg', 'w-rnn-step');
  clk('#rs-mode [data-t=six]'); chk('rnn-step six', 'rs-svg', 'w-rnn-step'); clk('#rs-wm [data-m=mix]'); chk('rnn-step mix', 'rs-svg', 'w-rnn-step'); clk('#rs-wm [data-m=slide]'); clk('#rs-mode [data-t=one]'); set('rs-w', .5); set('rs-u', 1);
  for (const t of ['m1', '1m', 'mm', 's2s', 'lm']) { clk('#sh-tabs [data-t="' + t + '"]'); chk('shapes ' + t, 'sh-svg', 'w-shapes'); }
  for (let k = 0; k <= 3; k++) { U17W['w-shapes'].st.k = k; U17W['w-shapes'].draw(); chk('shapes lm k' + k, 'sh-svg', 'w-shapes'); } clk('#sh-tabs [data-t=m1]');
  chk('talk bars', 'tk-bars', 'w-talk'); chk('talk note', 'tk-note', 'w-talk'); set('tk-T', 2); U17W['w-talk'].talk('sample'); await sleep(7000); chk('talk T2', 'tk-bars', 'w-talk'); set('tk-T', .2); chk('talk T.2', 'tk-bars', 'w-talk');
  clk('#tk-mode [data-t=train]'); clk('#tk-step'); chk('talk train 1', 'tk-bars', 'w-talk'); clk('#tk-sample'); await sleep(2200); chk('talk train end', 'tk-bars', 'w-talk'); clk('#tk-reset');
  for (let i = 0; i < 10; i++) { U17W['w-bptt'].go(i); chk('bptt ' + i, 'bp-svg', 'w-bptt'); } U17W['w-bptt'].setTrunc(true); for (let i = 5; i < 10; i++) { U17W['w-bptt'].go(i); chk('bptt cut ' + i, 'bp-svg', 'w-bptt'); } U17W['w-bptt'].setTrunc(false); U17W['w-bptt'].go(0);
  for (const w of [.5, .95, 1, 1.05, 1.5]) for (const T of [1, 10, 50]) { set('pw-w', w); set('pw-T', T); chk('power ' + w + '/' + T, 'pw-svg', 'w-power'); } clk('#pw-tanh'); chk('power tanh', 'pw-svg', 'w-power'); clk('#pw-reset');
  for (const pr of ['fade', 'keep', 'explode', 'rotate']) { clk('#em-pre [data-p=' + pr + ']'); for (const k of [0, 1, 5, 30]) { set('em-t', k); chk('eigen ' + pr + ' ' + k + ' plane', 'em-plane', 'w-eigen-memory'); chk('eigen ' + pr + ' ' + k + ' chart', 'em-bars', 'w-eigen-memory'); } }
  set('em-a', 3); set('em-b', 3); set('em-c', -3); set('em-d', -3); chk('eigen extreme plane', 'em-plane', 'w-eigen-memory'); chk('eigen extreme chart', 'em-bars', 'w-eigen-memory'); clk('#em-reset');
  chk('tank', 'nb-svg', 'w-notebook'); clk('#nb-hold'); chk('tank hold', 'nb-svg', 'w-notebook'); set('nb-o', 0); chk('tank window shut', 'nb-svg', 'w-notebook');
  set('nb-c', -2); set('nb-f', 1); set('nb-i', 1); set('nb-g', -1); chk('tank min', 'nb-svg', 'w-notebook'); set('nb-c', 2); set('nb-g', 1); chk('tank max', 'nb-svg', 'w-notebook'); clk('#nb-reset');
  clk('#nb-mode [data-t=scores]'); chk('tank scores', 'nb-svg', 'w-notebook'); ['nb-zf', 'nb-zi', 'nb-zg', 'nb-zo'].forEach(i => set(i, 4)); chk('tank scores max', 'nb-svg', 'w-notebook'); ['nb-zf', 'nb-zg'].forEach(i => set(i, -4)); chk('tank scores min', 'nb-svg', 'w-notebook'); clk('#nb-reset'); clk('#nb-mode [data-t=gates]');
  chk('lab accuracy', 'lb-svg', 'w-lstm'); for (const T of [5, 50]) { set('lb-T', T); chk('lab accuracy ' + T, 'lb-svg', 'w-lstm'); } clk('#lb-tabs [data-t=blame]'); for (const T of [5, 20, 50]) { set('lb-T', T); chk('lab blame ' + T, 'lb-svg', 'w-lstm'); } clk('#lb-honest'); chk('lab honest', 'lb-svg', 'w-lstm'); clk('#lb-reset'); clk('#lb-tabs [data-t=acc]');
  for (const z of [0, .25, .5, 1]) for (const r of [0, 1]) { set('gr-z', z); set('gr-r', r); chk('gru z' + z + ' r' + r, 'gr-svg', 'w-gru'); } clk('#gr-reset');
  for (const [h, d] of [[8, 8], [128, 64], [512, 512], [512, 8]]) { set('gc-h', h); set('gc-d', d); chk('gates ' + h + '/' + d, 'gc-svg', 'w-gates-compare'); } set('gc-h', 128); set('gc-d', 64);
  for (const m of ['one', 'two', 'stack']) for (const s of ['toy', 'bears', 'pres']) { clk('#bd-mode [data-t=' + m + ']'); clk('#bd-sent [data-s=' + s + ']'); chk('bidir ' + m + ' ' + s, 'bd-svg', 'w-bidir'); }
  set('bd-w', 1.5); chk('bidir w 1.5', 'bd-svg', 'w-bidir'); set('bd-w', 0); chk('bidir w 0', 'bd-svg', 'w-bidir'); clk('#bd-reset');
  for (const k of ['1', '2', '3']) { clk('#bm-k [data-t="' + k + '"]'); chk('beam ' + k, 'bm-svg', 'w-beam'); } clk('#bm-log'); chk('beam log', 'bm-svg', 'w-beam'); clk('#bm-log');
  for (const c of ['the train is late', 'the train is running late', 'late is the train', 'the train', 'the the the the', 'the train is delayed', '', 'train', 'the quick brown fox jumps over the lazy dog today']) { const i = document.getElementById('bl-cand'); i.value = c; i.dispatchEvent(new Event('input')); chk('bleu "' + c + '"', 'bl-svg', 'w-bleu'); }
  clk('#bl-reset');
  return { R, n }; };

/* overlapping 3-D labels (screen rectangles of the sprite labels; a pair counts when it overlaps > 12% of the smaller one) */
const RECTS = id => { const r = U17W[id].rects(); const out = []; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { const a = r[i], b = r[j], ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  if (ix > 0 && iy > 0) { const ar = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0)); if (ix * iy > .12 * ar) out.push(a.text + ' × ' + b.text); } } return { n: r.length, out }; };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ARGS });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  const watch = p => { p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_CONNECTION|net::ERR_/.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0, 200)); if (m.type() === 'warning' && /U17|stage failed/.test(m.text())) errors.push('WARN: ' + m.text().slice(0, 200)); });
    p.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300))); };
  watch(page);
  const S = id => page.evaluate(id => U17W[id].state(), id);
  const set = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const clk = sel => page.evaluate(sel => document.querySelector(sel).click(), sel);
  const text = sel => page.locator(sel).innerText();
  const norm = s => s.replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  const show = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); };
  const data = (sel, k) => page.evaluate(([s, k]) => document.querySelector(s).dataset[k], [sel, k]);
  const wait = ms => page.waitForTimeout(ms);

  await page.goto(URL);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await wait(2500);

  console.log('— page —');
  const c = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length,
    w3d: [...document.querySelectorAll('.widget')].filter(w => w.querySelector('.stage3d')).length, reg: Object.keys(U17W).length,
    derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length,
    katex: document.querySelectorAll('.katex-error').length, T: document.title, scoreTotal: document.getElementById('score-total').textContent, crumb: document.querySelector('.topbar .crumb').textContent,
    kicker: document.querySelector('.hero .kicker').textContent, ids: [...document.querySelectorAll('section.unit')].map(s => s.id).join(','),
    missingReg: [...document.querySelectorAll('.widget')].map(w => w.id).filter(id => !U17W[id]),
    q: document.querySelectorAll('.bigq').length, traps: document.querySelectorAll('.callout.watch').length, why: document.querySelectorAll('.callout.aha').length, one: document.querySelectorAll('.onesent').length }));
  if (c.checks === 37 && c.scoreTotal === '37') okay('37 checks, #score-total = 37'); else fail('checks ' + JSON.stringify(c));
  if (c.widgets === 17 && c.w3d === 4 && c.derives === 23 && c.drawers === 12 && c.probs === 16) okay('17 widgets (4 in 3D) · 23 derivations in 12 drawers · 16 problems'); else fail('counts ' + JSON.stringify(c));
  if (!c.missingReg.length && c.reg >= 17) okay('every widget registers a state() reader (' + c.reg + ')'); else fail('widgets without a state reader: ' + c.missingReg);
  if (c.ids === 's1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13,s14,spractice') okay('sections s1–s14 + spractice'); else fail('section ids ' + c.ids);
  if (c.q === 13 && c.traps === 13 && c.why >= 13 && c.one === 14) okay('every teaching section opens with a question and has a Trap and a "why" (13 each); 14 one-sentence hooks'); else fail('rhythm ' + JSON.stringify([c.q, c.traps, c.why, c.one]));
  if (!c.katex) okay('no KaTeX errors'); else fail('katex-error ×' + c.katex);
  if (/^Unit 17 · Machines with Memory/.test(c.T) && /Unit 17 · Machines with Memory/.test(c.crumb) && /Unit 17 of 20 · by Prof\. Saurabh/.test(c.kicker)) okay('title, crumb and kicker say Unit 17'); else fail('title/crumb ' + JSON.stringify([c.T, c.crumb, c.kicker]));
  const chips = norm(await text('.hero .meta'));
  if (/17 interactive widgets · 4 in 3D/.test(chips) && /37 inline checks/.test(chips) && /23 proofs/.test(chips) && /16 solved practice problems/.test(chips)) okay('hero chips: 17 widgets · 4 in 3D · 37 checks · 23 proofs · 16 problems'); else fail('hero chips: ' + chips);
  const leak = await page.evaluate(() => { const h = document.documentElement.innerHTML.replace(/mfml-/g, ''); return (h.match(/MFML|ZC416|BITS|WILP/) || h.match(/exam paper|question bank|past paper|\bexams?\b/i) || [''])[0]; });
  if (!leak) okay('no brand leak, no "exam" wording'); else fail('brand leak: ' + leak);
  const nav = await page.evaluate(() => ({ prev: !!document.querySelector('.hero-prev a[href="unit-16.html"]'), next: !!document.querySelector('#spractice .next-card a[href="unit-18.html"]'),
    units: (document.documentElement.innerHTML.match(/\{"n":16,"t":"Words as Vectors"\},\{"n":17,"t":"Machines with Memory"\},\{"n":18,"t":"Attention and Transformers"\}\]/) || []).length }));
  if (nav.prev && nav.next && nav.units === 1) okay('previous-unit link to Unit 16, next-card link to Unit 18, UNITS array ends at 18'); else fail('nav ' + JSON.stringify(nav));

  console.log('— hero —');
  const hero = await page.evaluate(() => ({ c: !!document.querySelector('#hero-3d canvas'), r: document.getElementById('hero-3d').dataset.ready }));
  if (hero.c && hero.r === '1') okay('hero stage mounted'); else fail('hero ' + JSON.stringify(hero));
  for (const [at, re, what] of [[10.4, /halves.*0\.031/, 'the blame halves, 1 → 0.031'], [16, /explodes.*7\.6|7\.6.*explodes/, 'it explodes, 1 → 7.6'], [21, /express lane.*0\.86/, 'the express lane, 1 → 0.86']]) {
    await page.evaluate(a => { window.U17HeroAt = a; }, at); await page.waitForFunction(src => new RegExp(src).test(document.querySelector('#hero-3d .hud').textContent.replace(/\s+/g, ' ').replace(/[−–]/g, '-')), re.source, { timeout: 15000 }).catch(() => {});
    const t = norm(await text('#hero-3d .hud')); if (re.test(t)) okay('hero at ' + at + ' s: ' + what); else fail('hero hud at ' + at + ': ' + t); }
  /* the belt must sit clear of the intro text, and clear of the contents list when the page shows one (≥ 1520 px) */
  for (const [w, h] of [[1300, 950], [1600, 900], [1920, 1080]]) { await page.setViewportSize({ width: w, height: h }); await page.evaluate(() => { window.U17HeroAt = 15.1; scrollTo(0, 0); });   /* 15.1 s: the exploding run, with its "× 1.5 each step" tag */
    await page.waitForFunction(() => { const b = document.getElementById('hero-3d'); return +b.dataset.fitW === Math.round(b.getBoundingClientRect().width); }, null, { timeout: 15000 }).catch(() => {}); await wait(300);
    await page.waitForFunction(() => U17W.hero.rects().some(q => /each step/.test(q.text)), null, { timeout: 15000 }).catch(() => {});   /* the backward run's "× 1.5 each step" tag is on screen */
    const hf = await page.evaluate(() => { const br = document.getElementById('hero-3d').getBoundingClientRect(), all = U17W.hero.rects(), r = all.filter(q => /^(the|train|to|Delhi|is|late|loss)$/.test(q.text)), toc = document.getElementById('toc'), tocOn = getComputedStyle(toc).display !== 'none' && toc.getBoundingClientRect().left < br.right - 1;
      const right = tocOn ? toc.getBoundingClientRect().left - br.left : br.width, tag = all.find(q => /each step/.test(q.text));
      return { n: r.length, x0: Math.min(...r.map(q => q.x0)), x1: Math.max(...r.map(q => q.x1)), lede: document.querySelector('.hero .lede').getBoundingClientRect().right - br.left, right, tocOn, fit: U17W.hero.fit(), tag: tag ? [tag.text, Math.round(tag.x0), Math.round(tag.x1)] : null, tagIn: !!tag && tag.x1 <= right - 2 }; });
    if (hf.tagIn) okay(w + 'px hero: the "' + hf.tag[0] + '" tag stays on screen and clear of the contents list (' + hf.tag[1] + '–' + hf.tag[2] + ' ≤ ' + Math.round(hf.right) + ')'); else fail('hero tag ' + JSON.stringify(hf.tag) + ' right ' + hf.right);
    if (hf.n === 7 && hf.x0 >= hf.lede + 20 && hf.x1 <= hf.right - 4) okay(w + 'px hero: the six words and the loss sit between the text (' + Math.round(hf.lede) + ') and ' + (hf.tocOn ? 'the contents list' : 'the edge') + ' (' + Math.round(hf.right) + '): ' + Math.round(hf.x0) + '–' + Math.round(hf.x1)); else fail('hero fit ' + JSON.stringify(hf)); }
  await page.setViewportSize({ width: 1300, height: 950 }); await wait(600);
  await page.evaluate(() => { window.U17HeroAt = null; });

  console.log('— §1 · w-order —');
  await show('#w-order'); let s = await S('w-order');
  if (JSON.stringify(s.ends) === '[[-2,2],[0,0]]' && !s.same) okay('running note: dog bites man → (−2, 2), man bites dog → (0, 0)'); else fail('order ends ' + JSON.stringify(s.ends));
  const dots = await page.evaluate(() => ['A', 'B'].map(K => { const c = document.querySelector('#or-svg [data-role=end' + K + '] circle:last-child'); return [+c.getAttribute('cx'), +c.getAttribute('cy')]; }));
  if (dots.every((d, i) => near(d[0], s.map.ox + s.map.sx * s.ends[i][0], .05) && near(d[1], s.map.oy + s.map.sy * s.ends[i][1], .05))) okay('the two end dots are drawn exactly at (−2, 2) and (0, 0)'); else fail('order dot geometry ' + JSON.stringify([dots, s.map]));
  await set('or-th', 0); s = await S('w-order'); if (s.same && JSON.stringify(s.ends) === '[[2,2],[2,2]]') okay('Try: turn 0° → both land on the plain sum (2, 2)'); else fail('order 0° ' + JSON.stringify(s.ends));
  await set('or-th', 180); s = await S('w-order'); if (s.same && JSON.stringify(s.ends) === '[[0,0],[0,0]]') okay('Try / check c21: a half turn → both land together at (0, 0)'); else fail('order 180° ' + JSON.stringify(s.ends));
  await set('or-th', 90); await set('or-k', .5); s = await S('w-order'); if (!s.same) okay('keep 0.5: still different'); else fail('order keep');
  await set('or-k', 1); await page.selectOption('#or-sents select[data-s="B"][data-i="0"]', 'sees'); s = await S('w-order'); if (s.B[0] === 'sees' && s.ends[1].length === 2) okay('the sentence pickers redraw the note'); else fail('picker');
  await clk('#or-mode [data-t=bag]'); s = await S('w-order'); if (s.mode === 'bag' && s.same === false) okay('bag with a different word: different bags'); else fail('bag diff');
  await clk('#or-reset'); await clk('#or-mode [data-t=bag]'); s = await S('w-order');
  const bars = await page.evaluate(() => [...document.querySelectorAll('#or-svg rect[data-role^=bar]')].map(r => [+r.dataset.v, +r.getAttribute('height')]));
  if (s.same && bars.length === 8 && bars.every(([v, h]) => near(h, Math.max(1, v * 80), 1e-6))) okay('bag of words: identical bags; bar heights = count × 80'); else fail('bag ' + JSON.stringify([s.same, bars]));
  await clk('#or-mode [data-t=win]'); s = await S('w-order'); const hid = await page.evaluate(() => [getComputedStyle(document.getElementById('or-sents')).display, getComputedStyle(document.getElementById('or-swap')).display]);
  if (!s.train && s.atLate.join(' ') === 'four is late' && hid.every(d => d === 'none')) okay('Try: window of 3 → "four is late", "train" has dropped out; sentence pickers hidden in this tab'); else fail('win 3 ' + JSON.stringify([s, hid]));
  await set('or-win', 8); s = await S('w-order'); if (s.train) okay('window of 8: "train" still in view'); else fail('win 8');
  await clk('#or-reset'); s = await S('w-order'); if (s.mode === 'note' && s.th === 90 && s.prog === 3 && JSON.stringify(s.ends) === '[[-2,2],[0,0]]') okay('reset restores the running note at 90°'); else fail('order reset ' + JSON.stringify(s));
  const orders = new Set(); let allApart = true; const turnQ = v => [-v[1], v[0]], V2 = { dog: [1, 0], man: [0, 1], bites: [1, 1] };
  for (let i = 0; i < 5; i++) { await clk('#or-swap'); s = await S('w-order'); orders.add(s.B.join(' ')); let h = [0, 0]; for (const w of s.B) { const r = turnQ(h); h = [r[0] + V2[w][0], r[1] + V2[w][1]]; }
    if (s.same || s.B.join(' ') === 'dog bites man' || [...s.B].sort().join() !== 'bites,dog,man' || !near(s.ends[1][0], h[0], 1e-9) || !near(s.ends[1][1], h[1], 1e-9)) allApart = false; }
  if (orders.size === 5 && allApart) okay('Try: ↻ another order for B visits the other 5 orders of the same words; at 90° none lands on A\'s note (independent quarter-turn run)'); else fail('order reorder ' + JSON.stringify([...orders]));
  if (s.B.join(' ') === 'man bites dog') okay('the fifth press comes back round to "man bites dog"'); else fail('order wrap ' + s.B);
  await clk('#or-reset');

  console.log('— §2 · w-rnn-step —');
  await show('#w-rnn-step'); s = await S('w-rnn-step'); let ind = rnn(.5, 1, [1, 0, 0]);
  if (s.h.slice(1).every((v, i) => near(v[0], ind[i + 1], 1e-12))) okay('one number: 0.7616, 0.3634, 0.1797 (independent tanh chain)'); else fail('rnn one ' + JSON.stringify(s.h));
  const rb = await page.evaluate(() => [...document.querySelectorAll('#rs-svg rect[data-role=bar]')].map(r => [+r.dataset.v, +r.dataset.y0, +r.dataset.unit, +r.getAttribute('y'), +r.getAttribute('height')]));
  if (rb.length === 4 && rb.every(([v, y0, u, y, h]) => near(h, Math.max(1.5, Math.abs(v) * u), 1e-6) && near(y, v >= 0 ? y0 - v * u : y0, 1e-6))) okay('each note bar is drawn to size: height = |h| × 66, standing on its zero line'); else fail('rnn bars ' + JSON.stringify(rb));
  await clk('#rs-reset'); await clk('#rs-next'); let t = norm(await text('#rs-read')); if (/tanh\(0\.5 · 0 \+ 1 · 1\) = tanh\(1\) = 0\.7616/.test(t)) okay('step 1: tanh(0.5 · 0 + 1 · 1) = tanh(1) = 0.7616'); else fail('rnn card ' + t);
  await clk('#rs-next'); await clk('#rs-next'); t = norm(await text('#rs-read')); if (/0\.1797/.test(t) && /23\.6%/.test(t)) okay('step 3: 0.1797, the first word kept 23.6%'); else fail('rnn card 3 ' + t);
  await set('rs-w', 1); s = await S('w-rnn-step'); ind = rnn(1, 1, [1, 0, 0]); if (near(s.h[2][0], ind[2], 1e-12) && near(ind[2], .642, 5e-4)) okay('Try / c3: keep old w = 1 → 0.7616, 0.6420 (the first word lasts much longer)'); else fail('rnn w1');
  await clk('#rs-mode [data-t=six]'); s = await S('w-rnn-step'); const sixOk = s.h.length === 7 && near(s.h[2][1], Math.tanh(.8 * Math.tanh(.2)), 1e-9) && near(s.h[6][5], [1, 2, 3, 4, 5].reduce(v => Math.tanh(.8 * v), Math.tanh(.2)), 1e-9);
  if (sixOk) okay('Try: six slots, slide down → "the" slides one slot per word and shrinks (a diagonal streak)'); else fail('rnn six');
  await clk('#rs-wm [data-m=mix]'); s = await S('w-rnn-step'); if (s.wm === 'mix' && s.h[6].some(v => Math.abs(v) > 1e-3)) okay('mix: the words are smeared across every slot'); else fail('mix');
  await clk('#rs-wm [data-m=slide]'); await clk('#rs-mode [data-t=one]'); await set('rs-w', .5); await set('rs-u', 1);

  console.log('— §3 · w-unroll —');
  await show('#w-unroll'); await wait(1200); s = await S('w-unroll'); if (s.T === 5 && s.unrolled && s.count === 32) okay('5 twins, unrolled, 32 numbers'); else fail('unroll ' + JSON.stringify(s));
  let r3 = await page.evaluate(RECTS.toString().replace(/^id =>/, 'function(id)').replace(/^/, '(') + ')("w-unroll")'); if (r3.n >= 5 && !r3.out.length) okay('3-D labels do not overlap (' + r3.n + ' labels)'); else fail('unroll labels ' + JSON.stringify(r3));
  /* 3-D frames can take a second each on this software renderer, so wait for the state rather than a fixed time */
  await clk('#un-play'); s = await S('w-unroll'); const toNow = s.to; await page.waitForFunction(() => !U17W['w-unroll'].state().unrolled, null, { timeout: 15000 }).catch(() => {}); s = await S('w-unroll');
  if (toNow === 0 && !s.unrolled) okay('▶ fold: the target flips at once and the chain folds into one cell with a loop'); else fail('fold ' + JSON.stringify(s));
  await clk('#un-share'); s = await S('w-unroll'); if (s.to === 1 && s.unrolled) okay('light up W unrolls at once (it cannot flash arrows that are folded away)'); else fail('share ' + JSON.stringify(s));
  await wait(1500); await set('un-T', 8); s = await S('w-unroll'); t = norm(await text('#un-read')); if (s.T === 8 && s.unrolled && s.uses === 8 && /used 8 times/.test(t) && /= 32/.test(t)) okay('Try: 8 words → W used 8 times (once in every copy, h₀ → h₁ included), still 32 numbers'); else fail('unroll 8 ' + t);
  r3 = await page.evaluate(RECTS.toString().replace(/^id =>/, 'function(id)').replace(/^/, '(') + ')("w-unroll")'); if (!r3.out.length) okay('8 twins: no overlapping 3-D labels'); else fail('unroll 8 labels ' + r3.out);
  await set('un-T', 5);

  console.log('— §4 · w-shapes —');
  await show('#w-shapes'); const IO = { m1: [5, 1], '1m': [1, 5], mm: [5, 5], s2s: [3, 3], lm: [5, 5] }; let allio = true;
  for (const [k, v] of Object.entries(IO)) { await clk(`#sh-tabs [data-t="${k}"]`); s = await S('w-shapes'); if (JSON.stringify(s.io) !== JSON.stringify(v)) { allio = false; fail('shape ' + k + ' ' + s.io); } }
  if (allio) okay('inputs/read-outs: many→one 5/1, one→many 1/5, tag 5/5, translate 3/3, next word 5/5');
  s = await S('w-shapes'); const q = sm([2, 1, .5, -1]);
  if (s.bars.length === 4 && s.bars.every((b, i) => near(b.p, q[i], 1e-12) && near(b.width, Math.max(2, b.scale * b.p), 1e-9))) okay('Try: after "the train to" the bars are softmax(2, 1, 0.5, −1) = 0.609, 0.224, 0.136, 0.030, each drawn to size'); else fail('shapes lm ' + JSON.stringify(s.bars));
  await clk('#sh-tabs [data-t=m1]');

  console.log('— §5 · w-talk (the tiny language model) —');
  await show('#w-talk'); const M = await page.evaluate(() => U17W['w-talk'].model); const TM = talkModel(M);
  if (M.H === 48 && M.chars.length === 28 && M.corpus.length === 300 && M.W.length === 48 && M.V.length === 28) okay('model: 48-number note, 28 characters, 300 training sentences (5 068 numbers)'); else fail('talk model shape');
  s = await S('w-talk'); const nx = TM.next('the train to ', 1), top = nx.p.map((p, i) => [TM.C[i], p]).sort((a, b) => b[1] - a[1]);
  if (s.seed === 'the train to ' && top[0][0] === 'p' && near(top[0][1], .171, 5e-4) && s.bars.rows[0].ch === 'p' && near(s.bars.rows[0].p, top[0][1], 1e-9) && s.dist.every((p, i) => near(p, nx.p[i], 1e-9)))
    okay('Try: after "the train to " the top guess is "p" 0.171 (independent re-run of the weights)'); else fail('talk first ' + JSON.stringify([s.seed, top.slice(0, 3), s.bars.rows[0]]));
  if (s.bars.rows.every(r => near(r.w, Math.max(1.5, r.p * s.bars.scale), 1e-9)) && s.cells.every((o, i) => near(o, +(.1 + .85 * Math.min(1, Math.abs(s.h[i]))).toFixed(3), 1e-9)) && s.h.every((v, i) => near(v, nx.h[i], 1e-9)))
    okay('bars are drawn to size (width = p × scale) and every one of the 48 note cells shows its own number'); else fail('talk geometry');
  const pageRM = await browser.newPage({ viewport: { width: 1300, height: 950 }, reducedMotion: 'reduce' }); watch(pageRM); await pageRM.goto(URL); await pageRM.waitForTimeout(1800);
  const talkRM = (seed, how, T, dice) => pageRM.evaluate(([seed, how, T, dice]) => { const i = document.getElementById('tk-seed'); i.value = seed; i.dispatchEvent(new Event('input')); const s = document.getElementById('tk-T'); s.value = String(T); s.dispatchEvent(new Event('input'));
    const W = U17W['w-talk']; W.st.dice = dice; W.talk(how); return W.state(); }, [seed, how, T, dice]);
  let st5 = await talkRM('the train to ', 'greedy', 1, 1);
  if (st5.gen === 'patna will arrive on platform three. the train to patna will arrive on platform three.' && st5.gen === TM.talk('the train to ', 'greedy')) okay('Try: greedy writes its favourite line and repeats it (page = independent re-run)'); else fail('talk greedy ' + st5.gen);
  const claims = [[.2, s5 => s5 === 'patna will arrive on platform three. the train to patna will arrive on platform three.', 'T = 0.2: the greedy line again'], [.5, s5 => s5 === 'patna will leave from platform one. the train to agra will leave from platform three.', 'T = 0.5: a clean announcement'], [1, s5 => s5 === 'patna is cancelled today. the train to surat is cancelled today.', 'T = 1: "patna is cancelled today. the train to surat is cancelled today."'], [2, s5 => s5.startsWith('pendy mare tom frimn '), 'T = 2 babbles: "pendy mare tom frimn …"']];
  for (const [T, test, what] of claims) { st5 = await talkRM('the train to ', 'sample', T, 1); if (test(st5.gen) && st5.gen === TM.talk('the train to ', 'sample', T, 1)) okay('Try: dice #1, ' + what); else fail('talk T=' + T + ' ' + st5.gen); }
  st5 = await talkRM('the trian to ', 'greedy', 1, 1); if (st5.gen.startsWith('buny misun.')) okay('Try / Trap: the typo seed "the trian to " snowballs into "buny misun"'); else fail('talk typo ' + st5.gen);
  const tf = await pageRM.evaluate(() => { document.querySelector('#tk-mode [data-t=train]').click(); document.getElementById('tk-sample').click(); return U17W['w-talk'].state(); }); const TT = TM.teach('the train to pune is late.');
  if (tf.mode === 'train' && tf.k === 26 && near(tf.total, TT.tot, 1e-9) && tf.total.toFixed(3) === '6.507' && tf.rows.filter(r => r.ch === r.guess).length === 23) okay('Try: training feeds the true sentence; 26 surprises add up to 6.507 (23 top guesses right)'); else fail('talk teacher ' + JSON.stringify([tf.k, tf.total]));
  const tb = await pageRM.evaluate(() => { const W = U17W['w-talk']; document.getElementById('tk-dice').click(); const d = W.st.dice; document.getElementById('tk-reset').click(); return [d, W.st.dice, W.st.seed, W.st.T, W.st.mode, document.getElementById('tk-seed').value]; });
  if (tb[0] === 2 && tb[1] === 1 && tb[2] === 'the train to ' && tb[3] === 1 && tb[4] === 'talk' && tb[5] === 'the train to ') okay('new dice → #2; reset → talking, seed "the train to ", T = 1, dice #1'); else fail('talk reset ' + JSON.stringify(tb));
  await clk('#tk-step'); await wait(200); s = await S('w-talk'); if (s.gen.length === 1 && s.picked === s.gen) okay('one step writes one character and shows the guess it came from'); else fail('talk one step ' + JSON.stringify(s.gen));
  await clk('#tk-reset');

  console.log('— §6 · w-bptt —');
  await show('#w-bptt'); const G = bptt(.5, 1, [1, 0, 0, 0], 1);
  const go = async i => { await page.evaluate(i => U17W['w-bptt'].go(i), i); await wait(100); return norm(await text('#bp-card')); };
  t = await go(0); if (/0\.5 · 0 \+ 1 · 1 = 1/.test(t) && /0\.7616/.test(t)) okay('F1: z₁ = 1, h₁ = 0.7616'); else fail('bptt F1 ' + t);
  t = await go(3); if (/0\.0896/.test(t)) okay('F4: h₄ = 0.0896'); else fail('bptt F4 ' + t);
  t = await go(4); if (/0\.4144/.test(t) && /-0\.9104/.test(t)) okay('S: L = 0.4144, ∂L/∂h₄ = −0.9104'); else fail('bptt S ' + t);
  t = await go(5); if (/-0\.9031/.test(t) && /-0\.4515/.test(t) && /-0\.1623/.test(t)) okay('B4: −0.9031, report −0.1623, ∂L/∂h₃ = −0.4515'); else fail('bptt B4 ' + t);
  t = await go(9); s = await S('w-bptt'); if (/-0\.4655/.test(t) && /9\.6 times/.test(t) && near(s.dw, G.dw, 1e-12)) okay('Σ: ∂L/∂w = −0.4655 (independent BPTT); the blame fell 9.6 times'); else fail('bptt sum ' + t);
  const R0 = Math.abs(G.dh[4]); if (s.discs.length === 4 && s.discs.every(d => near(d.v, G.dh[d.t], 1e-12) && near(d.r, Math.max(2.5, 40 * Math.sqrt(Math.abs(d.v) / R0)), 1e-9))) okay('each red disc has area ∝ |blame| (radius 40 √(|b|/|b₄|))'); else fail('bptt discs ' + JSON.stringify(s.discs));
  await page.evaluate(() => U17W['w-bptt'].setTrunc(true)); t = await go(9); s = await S('w-bptt');
  if (near(s.dw, G.cw[4] + G.cw[3], 1e-12) && /-0\.3211/.test(t) && s.discs.length === 2) okay('Try: cut the blame after 2 steps → only words 4 and 3 report: −0.3211'); else fail('bptt cut ' + t);
  t = await go(7); if (/never arrives/.test(t)) okay('B2 card under the cut: "the blame never arrives"'); else fail('bptt cut card ' + t);
  await clk('#bp-reset'); s = await S('w-bptt'); if (!s.trunc && s.step === 'F1') okay('start again: back to F1, cut switched off'); else fail('bptt reset');
  await clk('#bp-play'); await wait(2900); s = await S('w-bptt'); await clk('#bp-play'); if (/F2|F3|F4/.test(s.step)) okay('▶ play advances (at ' + s.step + ')'); else fail('bptt play ' + s.step);

  console.log('— §7 · w-power, w-eigen-memory —');
  await show('#w-power'); s = await S('w-power');
  const pyP = v => s.map.Tp + (s.map.HI - Math.log10(v)) / (s.map.HI - s.map.LO) * (s.map.H - s.map.Tp - s.map.B);
  if (near(s.vals[9], .5 ** 10, 1e-15) && s.bars.every(b => !b.clipped && near(b.top, Math.min(pyP(b.v), s.map.y1), 1e-6) && near(b.h, Math.abs(pyP(b.v) - s.map.y1), 1e-6))) okay('Try: w = 0.5, t = 10 → 0.000977; every bar is drawn at log₁₀(wᵗ) with none clipped'); else fail('power geometry');
  t = norm(await text('#pw-read')); if (/t = 10\b/.test(t)) okay('first below one thousandth at t = 10'); else fail('power cross ' + t);
  await clk('#w-power .preset[data-w="1.5"]'); s = await S('w-power'); if (near(s.vals[9], 57.6650390625, 1e-9) && s.bars.every(b => !b.clipped)) okay('Try: explode 1.5 → 57.67, still no clipped bar (1.5⁵⁰ ≈ 6.4 × 10⁸ fits)'); else fail('power 1.5');
  await set('pw-w', .99); const down = (await S('w-power')).vals[49] < 1; await set('pw-w', 1.01); const up = (await S('w-power')).vals[49] > 1; if (down && up) okay('Try: sliding w across 1 tips the bars from falling to rising'); else fail('power tip');
  await set('pw-w', .5); await clk('#pw-tanh'); s = await S('w-power'); if (s.tanh && s.vals.every((v, i) => v < .5 ** (i + 1)) && s.bars.every(b => !b.clipped)) okay('Try: with tanh, every bar is shorter than wᵗ'); else fail('power tanh');
  await clk('#pw-reset'); s = await S('w-power'); if (!s.tanh && s.w === .5 && s.T === 10) okay('reset: w = 0.5, t = 10, tanh off'); else fail('power reset');
  await show('#w-eigen-memory'); s = await S('w-eigen-memory'); let e = eigs([[.9, .4], [.1, .6]]), P = orbit([[.9, .4], [.1, .6]], [1, 0], 30);
  if (s.real && near(s.l[0], 1, 1e-9) && near(s.l[1], .5, 1e-9) && s.P.every((p, i) => near(p[0], P[i][0], 1e-12) && near(p[1], P[i][1], 1e-12)) && near(s.norms[30], Math.hypot(.8, .2), 1e-6)) okay('keep: eigenvalues 1 and 0.5; Wᵗv matches; the length settles at 0.8246'); else fail('eigen keep ' + JSON.stringify([s.l, s.norms[30]]));
  const ch = s.chart, pyE = v => ch.Tp + (ch.hi - Math.max(ch.lo, Math.min(ch.hi, Math.log10(v)))) / (ch.hi - ch.lo) * (ch.H - ch.Tp - ch.B);
  const ebars = await page.evaluate(() => [...document.querySelectorAll('#em-bars rect[data-t]')].map(r => [+r.dataset.t, +r.dataset.v, +r.getAttribute('y'), +r.getAttribute('height')]));
  if (ebars.length === 31 && ebars.every(([tt, v, y, h]) => near(v, s.norms[tt], 1e-12) && near(y, pyE(v), 1e-6) && near(y + h, Math.max(y + 1, ch.floorY), 1e-6) && h > 5)) okay('the promised bars exist: 31 bars, each top at log₁₀‖Wᵗv‖, all clearly visible'); else fail('eigen bars ' + JSON.stringify(ebars.slice(0, 3)));
  const pdots = await page.evaluate(() => [...document.querySelectorAll('#em-plane circle[data-t]')].map(c => [+c.dataset.t, +c.getAttribute('cx'), +c.getAttribute('cy')]));
  if (pdots.length && pdots.every(([tt, x, y]) => near(x, s.plane.map.ox + s.plane.map.s * P[tt][0], .01) && near(y, s.plane.map.oy - s.plane.map.s * P[tt][1], .01))) okay('every dot on the plane sits at Wᵗv (' + pdots.length + ' dots)'); else fail('eigen dots');
  for (const [pr, M2, want] of [['fade', [[.5, .2], [.1, .4]], [.6, .3]], ['explode', [[1.1, .2], [.1, 1]], [1.2, .9]]]) { await clk('#em-pre [data-p=' + pr + ']'); s = await S('w-eigen-memory'); e = eigs(M2);
    if (near(s.l[0], want[0], 1e-9) && near(s.l[1], want[1], 1e-9) && near(e.l[0], want[0], 1e-9)) okay(pr + ': eigenvalues ' + want.join(', ') + (pr === 'fade' ? ', the bars fall' : '')); else fail('eigen ' + pr); }
  s = await S('w-eigen-memory'); if (s.plane.off === 8 && s.norms[30] > 100 && s.norms.every((v, i) => !i || v > s.norms[i - 1])) okay('Try: explode → the bars climb past 1 and the dots run off the map from t = 8'); else fail('eigen explode off ' + s.plane.off);
  await clk('#em-pre [data-p=rotate]'); s = await S('w-eigen-memory'); if (!s.real && near(s.rho, 1, 1e-12) && s.norms.every(v => near(v, 1, 1e-12)) && s.evec === null) okay('Try / c12: rotate → λ = 0.8 ± 0.6i, no eigen-lines, every bar exactly 1'); else fail('eigen rotate');
  await set('em-a', .5); await set('em-b', 0); await set('em-c', 0); await set('em-d', 1.2); s = await S('w-eigen-memory'); if (near(s.rho, 1.2, 1e-12) && s.pre === '') okay('typed W = diag(0.5, 1.2): |λ|max = 1.2 (check c11)'); else fail('eigen typed');
  await set('em-a', 3); await set('em-b', 3); await set('em-c', -3); await set('em-d', -3); s = await S('w-eigen-memory'); const eNaN = await page.evaluate(() => /NaN|Infinity/.test(document.getElementById('w-eigen-memory').innerHTML)); if (!eNaN) okay('a defective typed matrix (both eigenvalues 0) draws without NaN'); else fail('eigen NaN');
  await set('em-t', 4); s = await S('w-eigen-memory'); if (s.n === 4) okay('the steps slider shows 4 dots'); else fail('eigen slider');
  await clk('#em-reset'); s = await S('w-eigen-memory'); if (s.pre === 'keep' && s.n === 30 && near(s.l[0], 1, 1e-9)) okay('reset: keep, 30 steps'); else fail('eigen reset');

  console.log('— §8 · w-clip —');
  await show('#w-clip'); await wait(1200);
  const roll = cc => { const Hc = 3, Kc = 14, A0 = .4, eta = .35, sg = z => 1 / (1 + Math.exp(-z)); let p = [2.2, 1.5]; const P = [p]; let big = 0;
    for (let i = 0; i < 40; i++) { const s0 = sg(Kc * (p[0] - A0)), g = [.18 * (p[0] + 1.8) + Hc * Kc * s0 * (1 - s0), .252 * p[1]], n = Math.hypot(...g); big = Math.max(big, n); const k = cc && n > cc ? cc / n : 1; p = [p[0] - eta * k * g[0], p[1] - eta * k * g[1]]; P.push(p); if (Math.abs(p[0]) > 3.2 || Math.abs(p[1]) > 3.2) return { P, off: true, big }; } return { P, off: false, big }; };
  s = await S('w-clip'); let ro = roll(0); if (s.off && s.steps === 9 && ro.off && ro.P.length - 1 === 9 && near(Math.max(...s.P.map(q => q.gn)), ro.big, 1e-9) && ro.big.toFixed(2) === '10.86') okay('Try: clipping off → a gradient of length 10.86 flings the ball off the map at step 9'); else fail('clip off ' + JSON.stringify([s.off, s.steps]));
  await clk('#cl-on'); s = await S('w-clip'); ro = roll(2); t = norm(await text('#cl-read')); if (s.clip && !s.off && !ro.off && /Reached the valley/.test(t)) okay('Try: clipping on (c = 2) → reaches the valley'); else fail('clip on');
  const stepLens = s => s.P.slice(1).map((q, i) => [Math.hypot(q.p[0] - s.P[i].p[0], q.p[1] - s.P[i].p[1]), q.gn, q.clipped]);
  const long2 = Math.max(...stepLens(s).map(x => x[0]));
  await set('cl-c', .5); s = await S('w-clip'); const sl = stepLens(s), long5 = Math.max(...sl.map(x => x[0]));
  if (!s.off && s.c === .5 && sl.every(([L, gn, c]) => near(L, .35 * Math.min(gn, .5), 1e-9) && c === (gn > .5)) && sl.some(x => x[2]) && near(long5, .175, 1e-9) && near(long2, .7, 1e-9) && s.P[s.P.length - 1].L < .02)
    okay('Try: lower the limit to c = 0.5 → no step is longer than 0.35 × 0.5 = 0.175 (at c = 2: 0.7), clipped steps are exactly that long, and the ball still reaches the valley'); else fail('clip 0.5 ' + JSON.stringify([s.off, long5, long2, s.P[s.P.length - 1].L]));
  r3 = await page.evaluate(RECTS.toString().replace(/^id =>/, 'function(id)').replace(/^/, '(') + ')("w-clip")'); if (!r3.out.length) okay('3-D labels do not overlap'); else fail('clip labels ' + r3.out);
  await set('cl-c', 1); await clk('#cl-play'); await wait(2000); await clk('#cl-reset'); s = await S('w-clip');
  if (!s.clip && s.c === 2 && s.n === 40 && s.off && (await page.evaluate(() => document.getElementById('cl-c').value)) === '2') okay('reset: clipping off, c = 2, the whole walk drawn again'); else fail('clip reset ' + JSON.stringify([s.clip, s.c, s.n]));
  await clk('#cl-on');

  console.log('— §9 · w-notebook, w-lstm —');
  await show('#w-notebook'); s = await S('w-notebook'); if (near(s.c, 1, 1e-12) && near(s.h, Math.tanh(1), 1e-12)) okay('Try: worked example c = 0.9 · 1 + 0.2 · 0.5 = 1.0, h = tanh 1 = 0.7616'); else fail('notebook ' + JSON.stringify(s));
  if (near(s.level.yl, s.level.y0 - s.level.shown * s.level.sc, 1e-9) && near(s.noteBar.hy, s.noteBar.WY - s.h * 50, 1e-9)) okay('the tank level and the note bar are drawn to size'); else fail('tank geometry');
  await set('nb-f', .5); await set('nb-c', 2); await set('nb-i', 1); await set('nb-g', -.4); s = await S('w-notebook'); if (near(s.c, .6, 1e-9)) okay('check c14: 0.5 · 2 + 1 · (−0.4) = 0.6'); else fail('notebook c14');
  await clk('#nb-hold'); s = await S('w-notebook'); if (near(s.c, 2, 1e-12)) okay('Try: hold forever (f = 1, i = 0) → the level stays exactly 2'); else fail('hold');
  await set('nb-o', 0); s = await S('w-notebook'); if (s.h === 0 && near(s.c, 2, 1e-12)) okay('Try: window shut → the note shows 0, the tank is still full'); else fail('window');
  await clk('#nb-reset'); await clk('#nb-mode [data-t=scores]'); s = await S('w-notebook'); const cL = sig(2) * 1 + .5 * Math.tanh(1), hL = sig(1) * Math.tanh(cL);
  if (s.mode === 'scores' && near(s.f, sig(2), 1e-12) && near(s.o, sig(1), 1e-12) && near(s.c, cL, 1e-12) && near(s.h, hL, 1e-12) && cL.toFixed(4) === '1.2616' && hL.toFixed(4) === '0.6225') okay('Try: from scores 2, 0, 1, 1 → f 0.8808, i 0.5, o 0.7311, g 0.7616; tank 1.2616, note 0.6225'); else fail('notebook scores ' + JSON.stringify(s));
  const hold = await page.evaluate(() => getComputedStyle(document.getElementById('nb-hold')).display); if (hold === 'none') okay('"hold forever" is hidden in the scores tab'); else fail('hold visible in scores');
  await set('nb-zf', -4); await clk('#nb-reset'); s = await S('w-notebook'); if (near(s.c, cL, 1e-12)) okay('worked example (scores tab) restores 2, 0, 1, 1'); else fail('scores reset'); await clk('#nb-mode [data-t=gates]');
  await show('#w-lstm'); await wait(1200); s = await S('w-lstm');
  if (s.T === 20 && near(s.accNow.rnn, .5125) && s.accNow.lstm === 1 && s.accNow.gru === 1) okay('20 words: plain cell 51.3% (a coin toss), LSTM and GRU 100%'); else fail('lab 20 ' + JSON.stringify(s.accNow));
  const acc = s.chart.pts; if (acc.rnn.length === 10 && near(acc.rnn[0].acc, .7975) && acc.lstm[9].acc === 1 && near(acc.rnn[9].acc, .4575)) okay('accuracy curve: plain 79.8% at 5 words → 45.8% at 50; gated 100% (verify-math17 agrees)'); else fail('lab acc');
  const m = s.chart.map, pyA = v => m.Tp + (1 - v) / .7 * (m.H - m.Tp - m.B); if (['rnn', 'gru', 'lstm'].every(k => acc[k].every(p => near(p.y, pyA(p.acc), 1e-9)))) okay('every accuracy point is drawn at its height'); else fail('lab points');
  await clk('#lb-honest'); s = await S('w-lstm'); if (near(s.chart.pts.lstm[9].acc, .855) && s.chart.pts.gru[9].acc === 1) okay('Try / c16: honest LSTM (f = 0.9) → 85.5% at 50 words, GRU still 100%'); else fail('lab honest');
  await set('lb-T', 50); await clk('#lb-tabs [data-t=blame]'); s = await S('w-lstm'); if (near(s.chart.bl.lstm[1], .9 ** 49, 1e-12) && s.chart.bl.rnn[1] < 1e-6 && s.chart.bl.gru[1] > .5) okay('Try: blame tab at 50 words — the plain cell collapses, the lanes stay high (LSTM f⁴⁹ = 0.9⁴⁹)'); else fail('lab blame');
  r3 = await page.evaluate(RECTS.toString().replace(/^id =>/, 'function(id)').replace(/^/, '(') + ')("w-lstm")'); if (!r3.out.length) okay('3-D labels do not overlap'); else fail('lab labels ' + r3.out);
  await clk('#lb-run'); await wait(2800); await clk('#lb-new'); await clk('#lb-reset'); s = await S('w-lstm'); if (s.T === 20 && near(s.accNow.rnn, .5125) && s.f === .99) okay('reset restores the default race'); else fail('lab reset'); await clk('#lb-tabs [data-t=acc]');

  console.log('— §10 · w-gru, w-gates-compare —');
  await show('#w-gru'); s = await S('w-gru'); if (near(s.hn[0], .5, 1e-12) && near(s.hn[1], 0, 1e-12) && near(s.cand[0], -.4, 1e-12) && near(s.cand[1], .6, 1e-12)) okay('z = 0.25: new note (0.5, 0) = 0.75 · (0.8, −0.2) + 0.25 · (−0.4, 0.6)'); else fail('gru ' + JSON.stringify(s));
  const gd = await page.evaluate(() => { const c = document.querySelector('#gr-svg [data-role=newdot] circle:last-child'); return [+c.getAttribute('cx'), +c.getAttribute('cy')]; });
  if (near(gd[0], s.map.ox + s.map.sx * s.hn[0], .01) && near(gd[1], s.map.oy + s.map.sy * s.hn[1], .01)) okay('the gold dot is drawn exactly at the new note'); else fail('gru dot');
  await set('gr-z', .5); s = await S('w-gru'); if (near(s.hn[0], .2) && near(s.hn[1], .2)) okay('Try: z = 0.5 → halfway, (0.2, 0.2)'); else fail('gru half');
  const onSeg = []; for (const z of [0, .3, .7, 1]) { await set('gr-z', z); s = await S('w-gru'); onSeg.push(near(s.hn[0], (1 - z) * s.old[0] + z * s.cand[0], 1e-12) && near(s.hn[1], (1 - z) * s.old[1] + z * s.cand[1], 1e-12)); }
  if (onSeg.every(Boolean)) okay('Try: for every z the new note lies on the straight line from the old note to the candidate'); else fail('gru segment');
  await set('gr-r', 0); s = await S('w-gru'); if (Math.abs(s.cand[0] - (-.4)) > 1e-3) okay('Try: lowering r changes the candidate (it stops consulting the old note)'); else fail('gru reset gate');
  await set('gr-z', .1); await set('gr-r', 1); await clk('#gr-play'); await page.waitForFunction(() => { const t = U17W['w-gru'].state().trail; return t && t.length === 11; }, null, { timeout: 15000 }).catch(() => {}); s = await S('w-gru'); const tr = s.trail; if (tr && tr.length === 11 && Math.hypot(tr[10][0] - tr[0][0], tr[10][1] - tr[0][1]) < Math.hypot(s.cand[0] - s.old[0], s.cand[1] - s.old[1])) okay('Try: ▶ ten steps at z = 0.1 → the note drifts only part of the way'); else fail('gru ten');
  await clk('#gr-reset'); s = await S('w-gru'); if (s.z === .25 && s.r === 1 && !s.trail) okay('worked example restores z = 0.25, r = 1'); else fail('gru reset');
  await show('#w-gates-compare'); s = await S('w-gates-compare'); if (s.counts.rnn === 24704 && s.counts.gru === 74112 && s.counts.lstm === 98816 && s.bars.every(b => near(b.w, Math.max(4, 190 * s.counts[b.cell] / s.counts.lstm), 1e-9))) okay('Try: 24 704 · 74 112 · 98 816, bars drawn to size'); else fail('gates ' + JSON.stringify(s));
  await set('gc-h', 256); s = await S('w-gates-compare'); if (s.counts.rnn === 256 * 320 + 256 && s.counts.rnn / 24704 > 3.3) okay('Try: doubling h almost quadruples the count (h·h dominates)'); else fail('gates 256');
  await set('gc-h', 128); await page.locator('#gc-svg [data-cell="lstm"]').click(); t = norm(await text('#gc-read')); if (/LSTM:/.test(t) && /c = f ⊙ c \+ i ⊙ g/.test(t)) okay('clicking the LSTM shows its equations'); else fail('gates click ' + t);

  console.log('— §11 · w-bidir —');
  await show('#w-bidir'); s = await S('w-bidir'); const F = rnn(.5, 1, [0, 0, 1]).slice(1), Bk = rnn(.5, 1, [1, 0, 0]).slice(1).reverse();
  if (s.mode === 'two' && s.fwd.every((v, i) => near(v, F[i], 1e-12)) && s.bwd.every((v, i) => near(v, Bk[i], 1e-12)) && near(s.bwd[0], .1797, 5e-5)) okay('toy x = (0, 0, 1): forward (0, 0, 0.7616), backward (0.1797, 0.3634, 0.7616)'); else fail('bidir toy ' + JSON.stringify(s));
  const chipsOk = await page.evaluate(() => [...document.querySelectorAll('#bd-svg rect[data-role=nf], #bd-svg rect[data-role=nb]')].every(r => r.dataset.v === '' || Math.abs(+r.getAttribute('fill-opacity') - (+(.12 + .8 * Math.min(1, Math.abs(+r.dataset.v))).toFixed(3))) < 1e-9));
  if (chipsOk) okay('each note chip is as strong as its number'); else fail('bidir chips');
  await clk('#bd-mode [data-t=one]'); s = await S('w-bidir'); t = norm(await text('#bd-read')); if (s.bwd === null && /word 1's note: \(0\)/.test(t)) okay('Try: one-way → word 1\'s note is (0)'); else fail('bidir one ' + t);
  await clk('#bd-mode [data-t=two]'); t = norm(await text('#bd-read')); if (/word 1's note: \(0, 0\.1797\)/.test(t)) okay('Try: two-way → (0, 0.1797)'); else fail('bidir two ' + t);
  await page.evaluate(() => document.querySelector('#bd-svg g[data-i="0"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); s = await S('w-bidir'); if (JSON.stringify(s.influence) === '[0,1,2]') okay('Try: clicking word 1 lights up every word (two-way)'); else fail('bidir influence ' + s.influence);
  await clk('#bd-mode [data-t=one]'); s = await S('w-bidir'); if (JSON.stringify(s.influence) === '[0]') okay('one-way: only word 1 can reach word 1'); else fail('bidir influence one');
  await clk('#bd-sent [data-s=bears]'); s = await S('w-bidir'); const fb = rnn(.5, 1, [.2, -.3, .5, .9, -.4, .1, .8]).slice(1), fp = rnn(.5, 1, [.2, -.3, .5, -.9, .3, -.1, -.8]).slice(1);
  if (near(s.teddy.bears[0], s.teddy.pres[0], 1e-15) && near(s.teddy.bears[0], fb[2], 1e-12) && near(fb[2], fp[2], 1e-15)) okay('Try: one-way, the note at "Teddy" is the same in both sentences (' + fb[2].toFixed(4) + ')'); else fail('bidir teddy one');
  await clk('#bd-mode [data-t=two]'); s = await S('w-bidir'); if (Math.abs(s.teddy.bears[1] - s.teddy.pres[1]) > .3 && near(s.teddy.bears[1], .682, 5e-4) && near(s.teddy.pres[1], .1528, 5e-5)) okay('Try: two-way, it differs: (0.3805, 0.682) against (0.3805, 0.1528)'); else fail('bidir teddy two ' + JSON.stringify(s.teddy));
  await clk('#bd-mode [data-t=stack]'); s = await S('w-bidir'); if (s.count === 57600 && s.floor2.every((v, i) => near(v, rnn(.5, 1, s.fwd).slice(1)[i], 1e-12))) okay('Try: two floors → floor 2 reads floor 1\'s notes; 57 600 numbers'); else fail('bidir stack');
  await clk('#bd-reset'); s = await S('w-bidir'); if (s.mode === 'two' && s.sent === 'toy' && s.w === .5 && s.sel === null) okay('reset: two-way, toy numbers, w = 0.5'); else fail('bidir reset');

  console.log('— §12 · w-seq2seq —');
  await show('#w-seq2seq'); await wait(1200); s = await S('w-seq2seq'); if (s.n === 6 && near(s.word1, .9 ** 5, 1e-12) && s.numbersIn === 48) okay('6 words: 48 numbers in, word 1 at 0.9⁵ = 0.5905'); else fail('seq ' + JSON.stringify(s));
  await clk('#sq-50'); s = await S('w-seq2seq'); t = norm(await text('#sq-read')); const sqHud = norm(await text('#sq-3d .hud'));
  if (s.n === 50 && s.numbersIn === 400 && s.numbersOut === 8 && s.word1.toFixed(4) === '0.0057' && /400 numbers in/.test(t) && /400/.test(sqHud) && /crowded/.test(sqHud)) okay('Try: 50 words → 400 numbers into 8 slots, word 1 at 0.0057 (HUD says crowded)'); else fail('seq 50 ' + t + ' | ' + sqHud);
  r3 = await page.evaluate(RECTS.toString().replace(/^id =>/, 'function(id)').replace(/^/, '(') + ')("w-seq2seq")'); if (!r3.out.length) okay('50 words: no overlapping 3-D labels'); else fail('seq labels ' + r3.out);
  await clk('#sq-5'); s = await S('w-seq2seq'); if (s.numbersIn === 40 && s.word1.toFixed(4) === '0.6561') okay('Try: 5 words → 40 numbers, word 1 at 0.6561'); else fail('seq 5');
  await clk('#sq-tf'); s = await S('w-seq2seq'); if (s.tf) okay('teacher forcing switch'); else fail('tf');
  await set('sq-n', 6); await clk('#sq-play'); await wait(5600);

  console.log('— §13 · w-beam, w-bleu —');
  await show('#w-beam'); s = await S('w-beam'); if (s.best === 'the train' && near(s.p, .2)) okay('Try: greedy → "the train", 0.20'); else fail('beam 1 ' + JSON.stringify(s));
  await clk('#bm-k [data-t="2"]'); s = await S('w-beam'); if (s.best === 'our train' && near(s.p, .36)) okay('Try: width 2 → "our train", 0.36'); else fail('beam 2');
  await clk('#bm-k [data-t="3"]'); s = await S('w-beam'); if (s.best === 'our train' && near(s.p, .36)) okay('Try / c20: width 3 → the same 0.36'); else fail('beam 3');
  await clk('#bm-log'); t = norm(await text('#bm-read')); if (/-1\.022/.test(t)) okay('log view: ln 0.36 = −1.022'); else fail('beam log ' + t); await clk('#bm-log');
  await show('#w-bleu'); const REF = 'the train is running late';
  for (const [cand, want] of [['the train is late', '0.636'], ['late is the train', '0.450'], ['the train', '0.2231'], ['the the the the', '0'], ['the train is running late', '1'], ['the train is delayed', '0.55']]) {
    await page.evaluate(c => { const i = document.getElementById('bl-cand'); i.value = c; i.dispatchEvent(new Event('input')); }, cand); s = await S('w-bleu'); const B = bleu2(cand, REF);
    const geo = s.bars.every(b => near(b.w, Math.max(0, b.v) * s.scale, 1e-9)); const rounded = want.includes('.') ? s.bleu.toFixed(want.split('.')[1].length) : String(Math.round(s.bleu));
    if (near(s.bleu, B.score, 1e-12) && near(s.BP, B.BP, 1e-12) && s.p1[0] === B.k1 && s.p2[0] === B.k2 && rounded === want && geo) okay('Try: "' + cand + '" → BLEU-2 ' + want + (cand === 'the the the the' ? ' (only one "the" counts: p₁ = 1/4)' : '') + ', bars to size'); else fail('bleu ' + cand + ' ' + JSON.stringify(s)); }
  await page.evaluate(() => { const i = document.getElementById('bl-cand'); i.value = ''; i.dispatchEvent(new Event('input')); }); s = await S('w-bleu'); t = norm(await text('#bl-read')); if (s.bleu === 0 && /Type a candidate/.test(t)) okay('an empty candidate scores 0 without NaN'); else fail('bleu empty');
  await clk('#bl-reset'); s = await S('w-bleu'); if (s.cand === 'the train is late') okay('reset restores "the train is late"'); else fail('bleu reset');

  console.log('— every control moves its widget; ranges at min/max never give NaN —');
  const ctl = await page.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const bad = []; let n = 0;
    const hash = w => { try { return JSON.stringify(U17W[w.id].state()) + w.querySelector('.readout, [id$=-read]')?.textContent; } catch (e) { return 'ERR ' + e; } };
    for (const w of document.querySelectorAll('.widget')) { const ranges = [...w.querySelectorAll('input[type=range]')];
      for (const r of ranges) { if (r.offsetParent === null) continue; const v0 = r.value; for (const v of [r.min, r.max]) { const before = hash(w); r.value = v; r.dispatchEvent(new Event('input')); await sleep(30); n++;
          if (/NaN|Infinity/.test(w.textContent) || /NaN/.test(w.innerHTML)) bad.push(w.id + ' ' + r.id + '=' + v + ' NaN'); if (hash(w) === before && v !== v0) bad.push(w.id + ' ' + r.id + '=' + v + ' changed nothing'); }
        r.value = v0; r.dispatchEvent(new Event('input')); await sleep(20); } }
    return { n, bad }; });
  if (!ctl.bad.length) okay(ctl.n + ' slider moves: every one changes its widget, none gives NaN'); else ctl.bad.slice(0, 12).forEach(fail);
  const btn = await page.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const bad = []; let n = 0;
    const hash = w => JSON.stringify(U17W[w.id].state());
    const resetLike = b => /reset|worked example|start again/i.test(b.textContent);
    const press = async b => { b.click(); await sleep(b.classList.contains('play') ? 400 : 40); };
    for (const w of document.querySelectorAll('.widget')) { const all = () => [...w.querySelectorAll('.tabs button, .presets button')].filter(b => b.offsetParent !== null);
      for (const b of all()) { if (b.offsetParent === null) continue; const wasSel = b.getAttribute('aria-selected') === 'true', before = hash(w); await press(b); n++;
        if (/NaN|Infinity/.test(w.textContent)) bad.push(w.id + ' "' + b.textContent.trim() + '" NaN');
        if (hash(w) !== before || resetLike(b) || wasSel) continue;
        let moved = false; for (const o of all().filter(o => o !== b && !resetLike(o))) { await press(o); if (b.offsetParent === null) continue; const mid = hash(w); await press(b); if (hash(w) !== mid) { moved = true; break; } }
        if (!moved) bad.push(w.id + ' "' + b.textContent.trim() + '" changed nothing, even after another button'); } }
    await sleep(6500); return { n, bad }; });
  if (!btn.bad.length) okay(btn.n + ' buttons and tabs: each one changes its widget\'s state'); else btn.bad.slice(0, 12).forEach(fail);
  await page.goto(URL); await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} .reveal,.reveal-stagger>*{opacity:1!important;transform:none!important;transition:none!important}' }); await wait(2500);

  console.log('— no overlapping or clipped text in any SVG, over ~150 widget states —');
  for (const [W, H] of [[1300, 950], [390, 844]]) { await page.setViewportSize({ width: W, height: H }); await wait(900);
    const r = await page.evaluate(SWEEP); const keys = Object.keys(r.R);
    if (!keys.length) okay(W + 'px: ' + r.n + ' drawings checked — no text overlaps, nothing clipped, no NaN'); else keys.slice(0, 10).forEach(k => fail(W + 'px ' + k + ': ' + JSON.stringify(r.R[k]).slice(0, 160))); }

  console.log('— 3-D labels at 390 —');
  for (const id of ['w-unroll', 'w-clip', 'w-lstm', 'w-seq2seq']) { await show('#' + id); await wait(1500); const rr = await page.evaluate(RECTS.toString().replace(/^id =>/, 'function(id)').replace(/^/, '(') + ')("' + id + '")');
    if (rr.n && !rr.out.length) okay('390px ' + id + ': ' + rr.n + ' labels, none overlapping'); else fail('390px ' + id + ' ' + JSON.stringify(rr)); }
  await page.setViewportSize({ width: 1300, height: 950 }); await wait(600);

  console.log('— light theme —');
  await page.click('#theme-btn'); await wait(1500);
  const lt = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); const rl = await page.evaluate(SWEEP);
  if (lt === 'light' && !Object.keys(rl.R).length) okay('light theme: every SVG re-drawn, still no overlaps (' + rl.n + ' drawings)'); else fail('light ' + JSON.stringify(Object.keys(rl.R).slice(0, 5)));
  for (const id of ['w-unroll', 'w-lstm']) { await show('#' + id); await wait(1500); const cv = await page.evaluate(id => !!document.querySelector('#' + id + ' canvas') && U17W[id].rects().length > 0, id); if (cv) okay('light theme: ' + id + ' stage re-mounted with its labels'); else fail('light stage ' + id); }
  await page.click('#theme-btn'); await wait(900);

  console.log('— reduced motion: every ▶ shows its final state at once —');
  const rm = await pageRM.evaluate(() => { const out = {}; const W = id => U17W[id].state();
    document.getElementById('rs-reset').click(); document.getElementById('rs-play').click(); out.rnn = W('w-rnn-step').k === 3;
    document.getElementById('em-t').value = '0'; document.getElementById('em-t').dispatchEvent(new Event('input')); document.getElementById('em-play').click(); out.eigen = W('w-eigen-memory').n === 30;
    document.getElementById('bd-play').click(); out.bidir = W('w-bidir').prog === 1;
    document.getElementById('bm-play').click(); out.beam = W('w-beam').stage === 2;
    document.getElementById('or-play').click(); out.order = W('w-order').ends.length === 2;
    document.getElementById('nb-play').click(); out.tank = W('w-notebook').ph === 1;
    return out; });
  if (Object.values(rm).every(Boolean)) okay('reduced motion: rnn-step, eigen-memory, bidir, beam, order, tank all land on their final states'); else fail('reduced motion ' + JSON.stringify(rm));
  await pageRM.close();

  console.log('— checks, drawers, practice —');
  const nOk = await page.evaluate(() => { let n = 0; document.querySelectorAll('.check').forEach(ch => { const b = ch.querySelector('.opts button[data-correct]'); if (b && ch.querySelectorAll('.opts button[data-correct]').length === 1 && ch.querySelectorAll('.opts button').length === 3) { b.click(); n++; } }); return n; });
  await wait(300);
  const sc2 = await page.evaluate(() => [document.getElementById('score').textContent, document.getElementById('score-chip').classList.contains('done'), (localStorage.getItem('mfml-u17-checks') || '').split(',').filter(Boolean).length]);
  if (nOk === 37 && sc2[0] === '37' && sc2[1] && sc2[2] === 37) okay('all 37 checks answerable (three options, one right answer each); score 37/37 stored under mfml-u17-checks'); else fail('checks ' + nOk + ' ' + JSON.stringify(sc2));
  const whys = await page.evaluate(() => [...document.querySelectorAll('.check .opts button')].filter(b => (b.dataset.why || '').length < 40).length); if (!whys) okay('every option of every check explains itself'); else fail(whys + ' options without a proper explanation');
  const wrong = await page.evaluate(() => { const ch = document.querySelector('.check'); const b = ch.querySelector('.opts button:not([data-correct])'); b.click(); return ch.querySelector('.why').textContent.slice(0, 20); });
  if (/Not quite/.test(wrong)) okay('a wrong answer explains itself'); else fail('wrong answer: ' + wrong);
  const dr = await page.evaluate(() => { const ds = [...document.querySelectorAll('details.algebra')]; ds.forEach(d => d.open = true); return ds.every(d => d.querySelector('.derive') && d.querySelector('.derive').offsetHeight > 0); });
  if (dr) okay('all 12 drawers open and show their derivations'); else fail('drawers');
  const pr = await page.evaluate(() => { const ss = [...document.querySelectorAll('#spractice details.sol')]; const closed = ss.every(d => !d.open); ss.forEach(d => d.open = true); return [ss.length, closed, document.querySelectorAll('#spractice .pans').length, document.querySelectorAll('#spractice .pstep').length, !!document.querySelector('#spractice .next-card'), document.querySelector('#spractice .sec-num').textContent, document.querySelectorAll('#spractice .ptest').length]; });
  if (pr[0] === 16 && pr[1] && pr[2] === 16 && pr[3] > 60 && pr[4] && pr[5] === '15' && pr[6] === 16) okay('practice: 16 solutions (closed at load), 16 answer lines, each with what-it-tests and a plan, ' + pr[3] + ' steps, § 15'); else fail('practice ' + JSON.stringify(pr));
  const nc = norm(await text('#spractice .next-card')); if (/Unit 18 · Attention and Transformers/.test(nc) && !/upcoming/.test(nc)) okay('next-card: Unit 18 · Attention and Transformers (live link)'); else fail('next-card: ' + nc);
  await page.evaluate(() => document.querySelectorAll('details.lb-how').forEach(d => d.open = true));
  const wide2 = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide2) okay('with every drawer and solution open, no display equation overflows at 1300px'); else fail(wide2 + ' display equations overflow (drawers open)');

  console.log('— narrow screens —');
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await page.setViewportSize({ width: w, height: 900 }); await wait(500);
    const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, [...document.querySelectorAll('.katex-display')].filter(k => k.offsetParent && k.scrollWidth > k.clientWidth + 1).map(k => k.textContent.slice(0, 30)), [...document.querySelectorAll('table.cmp')].filter(t => t.offsetParent && t.scrollWidth > t.clientWidth + 1 && getComputedStyle(t).overflowX !== 'auto').length]);
    if (o[0] <= o[1] + 1 && !o[2].length && !o[3]) okay(w + 'px: no horizontal overflow, every display equation and comparison table fits'); else fail(w + 'px overflow ' + JSON.stringify(o)); }
  await page.setViewportSize({ width: 390, height: 844 }); await wait(3500);
  const small = await page.evaluate(() => [...document.querySelectorAll('.widget svg')].filter(sv => sv.getBoundingClientRect().width > 0 && sv.closest('.widget').offsetParent).map(sv => { const r = sv.getBoundingClientRect().width, W = sv.viewBox.baseVal.width; let mn = 99;
    sv.querySelectorAll('text').forEach(t => { if (!t.getClientRects().length) return; const m = (t.getAttribute('style') || '').match(/font:\s*\d+\s+([\d.]+)px/); if (m) mn = Math.min(mn, +m[1] * r / W); }); return [sv.id, +mn.toFixed(1)]; }).filter(x => x[1] < 10.9));
  if (!small.length) okay('390px: every visible SVG label renders at 11 px or more'); else fail('390px small SVG labels ' + JSON.stringify(small));
  await page.setViewportSize({ width: 1300, height: 950 });

  console.log('— console —');
  if (!errors.length) okay('no console or page errors'); else errors.slice(0, 10).forEach(fail);
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ UNIT 17 WIDGETS PASS');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
