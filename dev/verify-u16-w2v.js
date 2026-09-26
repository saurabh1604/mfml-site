/* Verify the Unit 16 word2vec widgets (w-window, w-cbow, w-skipgram, w-lab) — owned by 16-w2v.
   node verify-u16-w2v.js [harness|page] [--quick] [--verbose]
     harness (default): dev/w2v-harness.html over http (starts `python3 -m http.server` on W2V_PORT=8791 in /home/claude/mfml-site if needed)
     page: the built dev/site/unit-16.html (file://) — run after `node assemble-u16.js && node gen-site.js && node build.js unit-16.html`
   Checks: the toy machines against an independent implementation (1e-9) · every number of s8–s10 on the page ·
   drawn geometry equals the numbers (arrow tips, bar heights, map positions = the PCA shadow) · every control fires, reset restores ·
   no NaN at extreme settings · the lab's negative-sampling step against an independent implementation (1e-12) · determinism ·
   the lab claims over 20 seeds · slow motion · no overlapping text (1440 + 390) · text ≥ 11 px at 390 · no horizontal overflow ·
   light/dark re-render · reduced motion · frame time · pause off-screen · zero console errors. */
const { chromium } = require('playwright');
const http = require('http'), { spawn } = require('child_process');
const SRC = (process.argv[2] && !process.argv[2].startsWith('--')) ? process.argv[2] : 'harness';
const QUICK = process.argv.includes('--quick');
const PORT = +(process.env.W2V_PORT || 8791);
let fails = 0, passes = 0; const failed = [];
const VERBOSE = process.argv.includes('--verbose');
const ok = (c, m) => { if (c) { passes++; if (VERBOSE) console.log('  ok  ', m); } else { fails++; failed.push(m); console.log('  FAIL', m); } };
const near = (a, b, t) => Math.abs(a - b) <= (t == null ? 1e-9 : t);
const vnear = (a, b, t) => Array.isArray(a) && a.length === b.length && a.every((x, i) => Array.isArray(x) ? vnear(x, b[i], t) : near(x, b[i], t));
const r4 = v => Math.round(v * 1e4) / 1e4;
const MI = '−', fmt4 = v => { let s = (Math.round(v * 1e4) / 1e4).toFixed(4).replace(/0+$/, '').replace(/\.$/, ''); if (s === '-0') s = '0'; return s.replace('-', MI); };

/* ================= an independent implementation of the two toy machines (written separately from the widget) ================= */
function smax(z) { const m = Math.max(...z); const e = z.map(x => Math.exp(x - m)); const s = e.reduce((a, b) => a + b, 0); return e.map(x => x / s); }
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
function indCbow(vin, vout, ctx, t, eta) {
  const n = ctx.length, h = [0, 0]; for (const i of ctx) { h[0] += vin[i][0]; h[1] += vin[i][1]; } h[0] /= n; h[1] /= n;
  const sc = vout.map(u => dot2(u, h)), p = smax(sc), e = p.map((x, i) => i === t ? x - 1 : x);
  let EH = [0, 0]; vout.forEach((u, i) => { EH = [EH[0] + e[i] * u[0], EH[1] + e[i] * u[1]]; });
  const vout2 = vout.map((u, i) => [u[0] - eta * e[i] * h[0], u[1] - eta * e[i] * h[1]]);
  const vin2 = vin.map(v => [v[0], v[1]]); for (const i of ctx) { vin2[i][0] -= eta * EH[0] / n; vin2[i][1] -= eta * EH[1] / n; }
  const h2 = [0, 0]; for (const i of ctx) { h2[0] += vin2[i][0] / n; h2[1] += vin2[i][1] / n; }
  const p2 = smax(vout2.map(u => dot2(u, h2)));
  return { h, sc, p, loss: -Math.log(p[t]), e, EH, vin2, vout2, h2, p2, loss2: -Math.log(p2[t]) }; }
function indSg(vin, vout, c, targets, eta) {
  const h = vin[c].slice(), sc = vout.map(u => dot2(u, h)), p = smax(sc);
  const E = p.map((x, i) => targets.length * x - targets.filter(t => t === i).length);
  let EH = [0, 0]; vout.forEach((u, i) => { EH = [EH[0] + E[i] * u[0], EH[1] + E[i] * u[1]]; });
  const vout2 = vout.map((u, i) => [u[0] - eta * E[i] * h[0], u[1] - eta * E[i] * h[1]]);
  const vin2 = vin.map(v => v.slice()); vin2[c] = [h[0] - eta * EH[0], h[1] - eta * EH[1]];
  const p2 = smax(vout2.map(u => dot2(u, vin2[c])));
  return { h, sc, p, loss: targets.reduce((a, t) => a - Math.log(p[t]), 0), E, EH, vin2, vout2, p2, loss2: targets.reduce((a, t) => a - Math.log(p2[t]), 0) }; }
/* the unit's toy model, typed in again here (not read from the widget) */
const V5 = ['we', 'drink', 'chai', 'daily', 'cricket'];
const VIN = [[0, 1], [1, 0], [1, 1], [0, 1], [-1, 0]], VOUT = [[0, 0], [1, 0], [1, 1], [0, 1], [-1, -1]];
/* negative sampling, one prediction at a time, independently */
const sgm = z => 1 / (1 + Math.exp(-z));
function indNS(vout, d, h, list, alpha) { const eh = new Array(d).fill(0);
  for (const [w, label] of list) { let f = 0; for (let j = 0; j < d; j++) f += h[j] * vout[w * d + j]; const g = alpha * (label - sgm(f));
    for (let j = 0; j < d; j++) { eh[j] += g * vout[w * d + j]; vout[w * d + j] += g * h[j]; } } return eh; }

/* ================= boxes ================= */
const overl = (a, b, tol) => { tol = tol == null ? 0.6 : tol; return a.x + tol < b.x + b.w && b.x + tol < a.x + a.w && a.y + tol < b.y + b.h && b.y + tol < a.y + a.h; };
function pairOverlaps(boxes, tol) { const out = []; for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (overl(boxes[i], boxes[j], tol)) out.push([boxes[i].t, boxes[j].t]); return out; }

function up(url) { return new Promise(res => { const r = http.get(url, x => { x.resume(); res(x.statusCode === 200); }); r.on('error', () => res(false)); r.setTimeout(1500, () => { r.destroy(); res(false); }); }); }

(async () => {
  let server = null;
  const HURL = `http://127.0.0.1:${PORT}/dev/w2v-harness.html`;
  if (SRC === 'harness' && !(await up(HURL))) { server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: '/home/claude/mfml-site', stdio: 'ignore' });
    for (let i = 0; i < 40 && !(await up(HURL)); i++) await new Promise(r => setTimeout(r, 150)); }
  /* the word2vec widgets draw with SVG and 2-D canvas only. The SwiftShader GL flags make this sandbox composite the page in software at
     1–5 frames a second, so the harness runs with Chromium's default (fast) compositing; the real page keeps the flags because
     other widgets of Unit 16 need WebGL. Every animated check waits for the widget's own state, never for wall-clock time. */
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: SRC === 'page' ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [] });
  const settle = (pg, w) => pg.waitForFunction(w => !U16W2V[w].state().animating, w, { timeout: 15000 });
  const errs = [];
  async function open(w, opts) { opts = opts || {};
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, reducedMotion: opts.rm ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push(w + (opts.rm ? ' rm' : '') + ' console: ' + m.text().slice(0, 300)); });
    page.on('pageerror', e => errs.push(w + ' PAGEERROR: ' + String(e).slice(0, 400)));
    if (opts.theme) await page.addInitScript(t => { try { localStorage.setItem('mfml-theme', t); } catch (e) {} }, opts.theme);
    await page.goto(SRC === 'page' ? 'file:///home/claude/mfml-site/dev/site/unit-16.html' : HURL + (opts.theme ? '?theme=' + opts.theme : ''), { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction(() => window.U16W2V && window.U16W2V.lab, null, { timeout: 120000 });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} .hbar{display:none!important}' });
    await page.evaluate(() => document.querySelectorAll('#w-window,#w-cbow,#w-skipgram,#w-lab').forEach(n => n.classList.add('in')));
    await page.waitForTimeout(500);
    return page; }
  const page = await open(1440);
  const U = (f, a) => page.evaluate(f, a);

  /* ======================================================================================= */
  console.log('· mount + contract');
  const mount = await U(() => ({ api: Object.keys(window.U16W2V).sort().join(','), ids: ['w-window', 'w-cbow', 'w-skipgram', 'w-lab'].map(id => { const e = document.getElementById(id); return e ? { id, cls: e.className, title: !!e.querySelector('.w-title'), sub: !!e.querySelector('.w-sub'), tr: !!e.querySelector('.try'), leg: !!e.querySelector('.w2-legend,.w2w-trays') } : null; }) }));
  ok(mount.api === 'cbow,engine,lab,skipgram,window', 'U16W2V exposes {engine, window, cbow, skipgram, lab}: ' + mount.api);
  mount.ids.forEach((m, i) => { ok(m && /\bwidget\b/.test(m.cls) && /\breveal\b/.test(m.cls), 'widget ' + ['w-window', 'w-cbow', 'w-skipgram', 'w-lab'][i] + ' present as .widget.reveal'); if (m) ok(m.title && m.sub && m.tr && m.leg, m.id + ' has title, caption, Try line and legend'); });

  /* ======================================================================================= */
  console.log('· the toy machines vs an independent implementation');
  for (const eta of [1, 0.3, 1.7]) {
    const w = await U(eta => { const E = U16W2V.engine; const c = E.cbowRound(E.TOY, [1, 3], 2, eta), s = E.sgRound(E.TOY, 2, [1, 3], eta); return { c, s }; }, eta);
    const ic = indCbow(VIN, VOUT, [1, 3], 2, eta), is = indSg(VIN, VOUT, 2, [1, 3], eta);
    ok(vnear(w.c.h, ic.h) && vnear(w.c.scores, ic.sc) && vnear(w.c.p, ic.p) && near(w.c.loss, ic.loss) && vnear(w.c.e, ic.e) && vnear(w.c.EH, ic.EH), 'CBOW forward, error, EH match (η = ' + eta + ')');
    ok(vnear(w.c.next.vin, ic.vin2) && vnear(w.c.next.vout, ic.vout2) && vnear(w.c.after.p, ic.p2) && near(w.c.after.loss, ic.loss2), 'CBOW update + re-score match to 1e-9 (η = ' + eta + ')');
    ok(vnear(w.s.h, is.h) && vnear(w.s.scores, is.sc) && vnear(w.s.p, is.p) && near(w.s.loss, is.loss) && vnear(w.s.E, is.E) && vnear(w.s.EH, is.EH), 'skip-gram forward, summed error, EH match (η = ' + eta + ')');
    ok(vnear(w.s.next.vin, is.vin2) && vnear(w.s.next.vout, is.vout2) && vnear(w.s.after.p, is.p2) && near(w.s.after.loss, is.loss2), 'skip-gram update + re-score match to 1e-9 (η = ' + eta + ')');
    ok(near(w.c.p.reduce((a, b) => a + b, 0), 1, 1e-12) && near(w.s.p.reduce((a, b) => a + b, 0), 1, 1e-12) && near(w.c.after.p.reduce((a, b) => a + b, 0), 1, 1e-12), 'softmax sums to 1 (η = ' + eta + ')');
  }
  { /* five rounds in a row, and the window-2 committee */
    const w = await U(() => { const E = U16W2V.engine; let M = E.TOY, out = []; for (let r = 0; r < 5; r++) { const c = E.cbowRound(M, [1, 3], 2, 1); out.push({ vin: c.next.vin, vout: c.next.vout, loss: c.after.loss }); M = c.next; }
      const T2 = E.TOY2, c2 = E.cbowRound(T2, [1, 2, 4, 5], 3, 1); return { out, T2: { vocab: T2.vocab, vin: T2.vin, vout: T2.vout, sentence: T2.sentence }, c2 }; });
    let vin = VIN.map(v => v.slice()), vout = VOUT.map(v => v.slice()), good = true; for (let r = 0; r < 5; r++) { const ic = indCbow(vin, vout, [1, 3], 2, 1); good = good && vnear(w.out[r].vin, ic.vin2) && vnear(w.out[r].vout, ic.vout2) && near(w.out[r].loss, ic.loss2); vin = ic.vin2; vout = ic.vout2; }
    ok(good, 'CBOW: five chained rounds match the independent implementation');
    ok(w.out.every((o, i) => i === 0 || o.loss < w.out[i - 1].loss), 'CBOW: the loss falls round after round (η = 1): ' + w.out.map(o => o.loss.toFixed(4)).join(' → '));
    const T2 = w.T2, ctx = ['all', 'drink', 'daily', 'after'].map(x => T2.vocab.indexOf(x)), ic2 = indCbow(T2.vin, T2.vout, ctx, T2.vocab.indexOf('chai'), 1);
    ok(JSON.stringify(ctx) === JSON.stringify([1, 2, 4, 5]) && T2.sentence.join(' ') === 'we all drink chai daily after cricket', 'window 2: the committee of chai in "we all drink chai daily after cricket" is all, drink, daily, after');
    ok(vnear(w.c2.h, [0.5, 0.5]) && vnear(w.c2.next.vin, ic2.vin2) && vnear(w.c2.next.vout, ic2.vout2), 'window 2: h = (0.5, 0.5) and the update matches');
    ok(near(w.c2.share, 0.25) && vnear(w.c2.dv, [-w.c2.EH[0] / 4, -w.c2.EH[1] / 4]), 'window 2: each of the four members moves by −η·EH/4');
  }
  { /* the numbers of s9 and s10, as printed in the brief */
    const ic = indCbow(VIN, VOUT, [1, 3], 2, 1), is = indSg(VIN, VOUT, 2, [1, 3], 1);
    ok(vnear(ic.p.map(r4), [0.1354, 0.2233, 0.3682, 0.2233, 0.0498]) && r4(ic.loss) === 0.9993 && vnear(ic.EH.map(r4), [-0.4584, -0.4584]), 's9 numbers: p, loss 0.9993, EH (−0.4584, −0.4584)');
    ok(vnear(ic.vout2[2].map(r4), [1.3159, 1.3159]) && vnear(ic.vin2[1].map(r4), [1.2292, 0.2292]) && vnear(ic.vin2[3].map(r4), [0.2292, 1.2292]) && r4(ic.p2[2]) === 0.5942 && r4(ic.loss2) === 0.5205, 's9 numbers after one step: u_chai, v_drink, v_daily, 0.5942, 0.5205');
    ok(vnear(is.p.map(r4), [0.0716, 0.1947, 0.5293, 0.1947, 0.0097]) && r4(is.loss) === 3.2725 && vnear(is.E.map(r4), [0.1433, -0.6106, 1.0585, -0.6106, 0.0194]) && vnear(is.EH.map(r4), [0.4286, 0.4286]), 's10 numbers: p, loss 3.2725, E, EH');
    ok(vnear(is.vin2[2].map(r4), [0.5714, 0.5714]) && vnear(is.vout2[1].map(r4), [1.6106, 0.6106]) && vnear(is.vout2[3].map(r4), [0.6106, 1.6106]) && vnear(is.vout2[2].map(r4), [-0.0585, -0.0585]) && vnear(is.p2.map(r4), [0.0922, 0.3862, 0.1015, 0.3862, 0.0339]) && r4(is.loss2) === 1.9026, 's10 numbers after one step');
  }

  /* ======================================================================================= */
  console.log('· w-cbow: every move, on the page');
  const cbText = () => U(() => { const r = document.getElementById('w-cbow'); return (r.querySelector('#w2c-hud').textContent + ' || ' + [...r.querySelectorAll('svg text')].map(t => t.textContent).join(' | ')).replace(/\s+/g, ' '); });
  const expectCB = { 1: ['drink → (1, 0)', 'daily → (0, 1)'], 2: ['(0.5, 0.5)'], 3: ['we 0 · drink 0.5 · chai 1 · daily 0.5 · cricket ' + MI + '1'],
    4: ['we 0.1354 · drink 0.2233 · chai 0.3682 · daily 0.2233 · cricket 0.0498', MI + 'ln 0.3682 = 0.9993'],
    5: ['(0.1354, 0.2233, ' + MI + '0.6318, 0.2233, 0.0498)', '(' + MI + '0.4584, ' + MI + '0.4584)'],
    6: ['(1, 1) → (1.3159, 1.3159)', '(0.2292, 0.2292)', 'drink → (1.2292, 0.2292)', 'daily → (0.2292, 1.2292)'],
    7: ['0.3682 → 0.5942', '0.9993 → 0.5205', 'h = (0.7292, 0.7292)'] };
  await page.click('#w2c-reset');
  for (let m = 1; m <= 7; m++) { await page.click('#w2c-next'); await settle(page, 'cbow'); const t = await cbText(); for (const x of expectCB[m]) ok(t.includes(x), 'CBOW move ' + m + ' shows "' + x + '"'); }
  { const t = await cbText(); ok(t.includes('loss 0.9993 → 0.5205'), 'CBOW panel 3 shows loss 0.9993 → 0.5205'); ok(/loss by round\s*0\.9993\s*→\s*0\.5205/i.test(await page.locator('#w2c-hist').textContent()), 'CBOW loss history 0.9993 → 0.5205'); }
  const cbS = () => U(() => U16W2V.cbow.state());
  { /* geometry: the picture tells the truth */
    let s = await cbS(); const Fi = s.geo.in.F, Fo = s.geo.out.F, P = (F, v) => [F.L + (v[0] - F.X0) * F.sc, F.T + (F.Y1 - v[1]) * F.sc];
    ok(s.move === 7 && s.round === 1, 'CBOW at move 7 of round 1');
    const inTips = s.geo.in.arrows; ok(inTips.length === 2 && inTips.every(a => vnear(a.vec, s.R.next.vin[V5.indexOf(a.w)], 1e-12) && vnear([a.x2, a.y2], P(Fi, a.vec), 1e-9)), 'panel 1: the blue arrow tips sit exactly at the new input vectors of drink and daily');
    ok(vnear(s.geo.in.h.vec, s.R.after.h, 1e-12) && vnear([s.geo.in.h.x, s.geo.in.h.y], P(Fi, s.R.after.h), 1e-9), 'panel 1: the gold point is h = the average of the committee');
    ok(s.geo.out.arrows.length === 5 && s.geo.out.arrows.every((a, i) => vnear(a.vec, s.R.next.vout[i], 1e-12) && vnear([a.x2, a.y2], P(Fo, a.vec), 1e-9)), 'panel 2: every green arrow tip sits at its output vector');
    const heads = await U(() => [...document.querySelectorAll('#w2c-out path')].map(p => p.getAttribute('d')).filter(d => /^M/.test(d)).map(d => d.match(/^M([-\d.]+),([-\d.]+)/).slice(1).map(Number)));
    ok(s.geo.out.arrows.every(a => heads.some(h => Math.abs(h[0] - a.x2) < 0.02 && Math.abs(h[1] - a.y2) < 0.02) || Math.hypot(a.vec[0], a.vec[1]) < 0.02), 'panel 2: an arrowhead is drawn at every tip (SVG geometry)');
    const sc = s.geo.prob.scale, bars = s.geo.prob.bars; ok(bars.length === 5 && bars.every((b, i) => near(b.h, s.R.after.p[i] * (sc.yBase - sc.yTop), 1e-9)), 'panel 3: bar heights ∝ the new probabilities');
    const rects = await U(() => [...document.querySelectorAll('#w2c-prob rect.w2-bar')].map(r => +r.getAttribute('height')));
    ok(rects.length === 5 && rects.every((h, i) => Math.abs(h - Math.max(.6, bars[i].h)) < 0.02), 'panel 3: the SVG rects have those heights');
    ok(s.geo.prob.err.every((b, i) => near(b.h, Math.min(Math.abs(s.R.e[i]), 1.25) * sc.eS, 1e-9) && (s.R.e[i] >= 0 ? near(b.y + b.h, sc.yE0, 1e-9) : near(b.y, sc.yE0, 1e-9))), 'panel 3: error bars ∝ |e|, up for push (e > 0), down for pull (e < 0)');
    const inside = (F, a) => a.x2 >= F.L - 1e-9 && a.x2 <= F.W - 10 + 1e-9 && a.y2 >= F.T - 1e-9 && a.y2 <= F.H - 26 + 1e-9;
    ok(s.geo.in.arrows.every(a => inside(Fi, a)) && s.geo.out.arrows.every(a => inside(Fo, a)), 'every arrow tip lies inside its plot (the planes zoom to fit)');
    await U(() => U16W2V.cbow.go(6)); s = await cbS();
    const mv = s.geo.in.moves; ok(mv.length === 2 && vnear(mv[0].d, mv[1].d, 1e-12) && vnear(mv[0].d, [-s.R.EH[0] / 2, -s.R.EH[1] / 2], 1e-12) && vnear(mv[0].d.map(r4), [0.2292, 0.2292]), 'Try: at move 6 both neighbours move by the same arrow, −η·EH/2 = (0.2292, 0.2292)');
    ok(s.geo.out.moves.filter(m => m.pull).map(m => m.w).join() === 'chai' && s.geo.out.moves.every(m => m.pull ? m.d[0] > 0 && m.d[1] > 0 : (Math.hypot(...m.d) < 1e-12 || m.d[0] < 0)), 'move 6: chai pulled along h, every other output vector pushed the other way');
    await U(() => U16W2V.cbow.go(5)); s = await cbS(); ok(s.geo.in.eh && vnear(s.geo.in.eh.vec, s.R.EH, 1e-12), 'move 5: the red "blame EH" arrow is EH itself');
  }
  { /* another round keeps training; η changes the step; window 2 splits four ways */
    await page.click('#w2c-reset'); await U(() => U16W2V.cbow.go(7));
    const L = []; for (let k = 0; k < 4; k++) { await U(() => U16W2V.cbow.another()); L.push((await cbS()).R.after.loss); }
    ok(L.every((x, i) => i === 0 || x < L[i - 1]) && L[0] < 0.5205, 'Try: ↻ another round keeps lowering the loss: 0.5205 → ' + L.map(x => x.toFixed(4)).join(' → '));
    const h = await page.locator('#w2c-hist').textContent(); ok((h.match(/→/g) || []).length === 5, 'the loss-by-round strip grows with each round: ' + h.replace(/\s+/g, ' '));
    await page.click('#w2c-reset'); await U(() => U16W2V.cbow.setEta(0.5)); await U(() => U16W2V.cbow.go(7)); let s = await cbS();
    const ic = indCbow(VIN, VOUT, [1, 3], 2, 0.5); ok(near(s.eta, 0.5) && near(s.R.after.loss, ic.loss2, 1e-12), 'η slider: η = 0.5 gives the independent loss ' + ic.loss2.toFixed(4));
    await page.click('#w2c-reset'); await U(() => U16W2V.cbow.setWin2(true)); await U(() => U16W2V.cbow.go(6)); s = await cbS();
    ok(s.win2 && s.geo.in.arrows.length === 4 && s.geo.in.moves.every(m => vnear(m.d, [-s.R.EH[0] / 4, -s.R.EH[1] / 4], 1e-12)), 'Try: window 2 — four neighbours, each moves −η·EH/4 (a quarter)');
    const t = await cbText(); ok(t.includes('shared equally by the 4 neighbours') && t.includes('−η·EH/4'.replace('-', MI)), 'window 2 HUD says the blame is shared by 4');
    const sent = await page.locator('#w2c-sent').innerText(); ok(/all/.test(sent) && /after/.test(sent) && /4 neighbours/.test(sent), 'window 2 sentence strip: ' + sent.replace(/\s+/g, ' '));
    await page.click('#w2c-reset'); s = await cbS(); ok(s.move === 0 && s.round === 1 && s.eta === 1 && !s.win2, 'CBOW reset returns to move 0, η = 1, window 1');
  }

  /* ======================================================================================= */
  console.log('· w-skipgram: every move, on the page');
  const sgText = () => U(() => { const r = document.getElementById('w-skipgram'); return (r.querySelector('#w2s-hud').textContent + ' || ' + [...r.querySelectorAll('svg text')].map(t => t.textContent).join(' | ')).replace(/\s+/g, ' '); });
  const expectSG = { 1: ['h = v(chai) = (1, 1)'], 2: ['we 0 · drink 1 · chai 2 · daily 1 · cricket ' + MI + '2'], 3: ['we 0.0716 · drink 0.1947 · chai 0.5293 · daily 0.1947 · cricket 0.0097'],
    4: ['1.6363 + 1.6363 = 3.2725', 'p = 0.1947'], 5: ['(0.1433, ' + MI + '0.6106, 1.0585, ' + MI + '0.6106, 0.0194)', '(0.4286, 0.4286)'],
    6: ['drink → (1.6106, 0.6106)', 'daily → (0.6106, 1.6106)', '(' + MI + '0.0585, ' + MI + '0.0585)', 'v(chai) → (0.5714, 0.5714)'], 7: ['0.3862', '3.2725 → 1.9026', 'p = 0.3862'] };
  await page.click('#w2s-reset');
  for (let m = 1; m <= 7; m++) { await page.click('#w2s-next'); await settle(page, 'skipgram'); const t = await sgText(); for (const x of expectSG[m]) ok(t.includes(x), 'skip-gram move ' + m + ' shows "' + x + '"'); }
  { const s = await U(() => U16W2V.skipgram.state()), F = s.geo.in.F, P = v => [F.L + (v[0] - F.X0) * F.sc, F.T + (F.Y1 - v[1]) * F.sc];
    ok(s.geo.in.arrows.length === 1 && vnear(s.geo.in.arrows[0].vec.map(r4), [0.5714, 0.5714]) && vnear([s.geo.in.arrows[0].x2, s.geo.in.arrows[0].y2], P(s.geo.in.arrows[0].vec), 1e-9), 'Try: chai’s input vector is drawn at (0.5714, 0.5714)');
    const uc = s.R.next.vout[2]; ok(uc[0] < 0 && uc[1] < 0 && s.model.vout[2][0] > 0, 'Try: chai’s own output vector swings through the origin: (1, 1) → ' + uc.map(r4).join(', '));
    ok(s.geo.prob.slots.length === 2 && s.geo.prob.slots.every(x => r4(x.p) === 0.3862), 'both slots show the same new probability 0.3862');
    const sc = s.geo.prob.scale; ok(s.geo.prob.bars.every((b, i) => near(b.h, s.R.after.p[i] * (sc.yBase - sc.yTop), 1e-9)), 'the one shared guess: bar heights ∝ p');
    ok(s.geo.prob.err.every((b, i) => near(b.h, Math.min(1.25, Math.abs(s.R.E[i])) * sc.eS, 1e-9)), 'summed error bars ∝ |E|');
    /* Try: round after round the loss creeps toward 2 ln 2 — never lower; CBOW's heads to 0 */
    await page.click('#w2s-reset'); await U(() => U16W2V.skipgram.go(7)); const Ls = [];
    for (let k = 0; k < 14; k++) { await U(() => U16W2V.skipgram.another()); const x = await U(() => U16W2V.skipgram.state()); Ls.push([x.R.after.loss, x.R.after.p[1], x.R.after.p[3]]); }
    const fl = 2 * Math.log(2); ok(Ls.every((x, i) => x[0] > fl && (i === 0 || x[0] < Ls[i - 1][0])) && Ls[13][0] < 1.40 && Math.abs(Ls[13][1] - 0.5) < 0.005 && near(Ls[13][1], Ls[13][2], 1e-9), 'Try: skip-gram’s loss creeps down toward 2 ln 2 ≈ 1.386 and never below it (after 15 rounds ' + Ls[13][0].toFixed(4) + ', each slot ' + Ls[13][1].toFixed(4) + ')');
    ok(/floor 2 ln 2 ≈ 1\.386/.test(await page.locator('#w2s-hist').textContent()) && /never go below it/.test(await page.locator('#w2s-hud').textContent()), 'the loss strip and the narration name the floor 2 ln 2');
    await page.click('#w2c-reset'); await U(() => U16W2V.cbow.go(7)); for (let k = 0; k < 10; k++) await U(() => U16W2V.cbow.another()); const lc = (await U(() => U16W2V.cbow.state())).R.after.loss;
    ok(lc < 0.015, 'Try: CBOW’s loss heads toward 0 (after 11 rounds ' + lc.toFixed(4) + ')'); await page.click('#w2c-reset');
    await page.click('#w2s-reset'); const s0 = await U(() => U16W2V.skipgram.state()); ok(s0.move === 0 && s0.round === 1, 'skip-gram reset'); }

  /* ======================================================================================= */
  console.log('· w-window: counting examples');
  const wS = () => U(() => U16W2V.window.state());
  { let s = await wS(); ok(s.sentence === 'we drink hot chai every morning' && s.C === 2 && s.counts.cbow === 6 && s.counts.sg === 18, 'at rest: 6-word sentence, window 2 → CBOW 6, skip-gram 18');
    ok(JSON.stringify(s.perStop) === '[2,3,4,4,3,2]', 'neighbours per stop 2, 3, 4, 4, 3, 2 (edges have fewer)');
    const sums = [await page.locator('#w2w-scb').innerText(), await page.locator('#w2w-ssg').innerText()];
    ok(sums[0].replace(/\s+/g, ' ') === '1 + 1 + 1 + 1 + 1 + 1 = 6' && sums[1].replace(/\s+/g, ' ') === '2 + 3 + 4 + 4 + 3 + 2 = 18', 'the running sums read 1+…+1 = 6 and 2 + 3 + 4 + 4 + 3 + 2 = 18');
    /* play: the counters build up stop by stop */
    await page.click('#w2w-play'); await page.waitForTimeout(250); s = await wS(); ok(s.playing && s.counts.cbow === 1 && s.counts.sg === 2, '▶ slide starts again at stop 1 (CBOW 1, skip-gram 2)');
    await page.waitForTimeout(2100); s = await wS(); ok(s.counts.cbow === 3 && s.counts.sg === 9, 'after three stops: 3 and 2 + 3 + 4 = 9 (got ' + s.counts.cbow + ', ' + s.counts.sg + ')');
    await page.waitForTimeout(3300); s = await wS(); ok(!s.playing && s.counts.cbow === 6 && s.counts.sg === 18 && s.cur === 5, 'Try: the slide ends at 6 examples vs 18 pairs');
    for (const [C, sg] of [[1, 10], [3, 24], [4, 28]]) { await U(C => { const r = document.getElementById('w2w-c'); r.value = C; r.dispatchEvent(new Event('input')); }, C); s = await wS(); ok(s.counts.cbow === 6 && s.counts.sg === sg, 'window ' + C + ': CBOW 6, skip-gram ' + sg); }
    await U(() => { const r = document.getElementById('w2w-c'); r.value = 2; r.dispatchEvent(new Event('input')); });
    /* the arrows turn round */
    s = await wS(); const inward = s.geo.arcs.every(a => a.to === s.cur); await page.click('#w2w-mode button[data-v="sg"]'); const s2 = await wS();
    ok(inward && s2.mode === 'sg' && s2.geo.arcs.every(a => a.from === s2.cur) && s2.geo.arcs.length === s.geo.arcs.length, 'Try: CBOW arrows point into the middle word, skip-gram arrows point out of it');
    const sq = s2.geo.squares; ok(sq.filter(q => q.k === 'cbow').length === 6 && sq.filter(q => q.k === 'sg').length === 18, 'the tally draws 6 CBOW squares and 18 skip-gram squares');
    ok(s2.geo.tiles.length === 6 && s2.geo.frame.lo === Math.max(0, s2.cur - 2) && s2.geo.frame.hi === Math.min(5, s2.cur + 2), 'the window frame covers exactly the middle word ± C (clipped at the edges)');
    /* the edge stops */
    await page.click('#w2w-step'); s = await wS(); ok(s.cur === 0 && s.counts.sg === 2 && /2 missing at the edge/i.test(await page.locator('#w2w-now').textContent()), 'step ▸ from rest starts at stop 1: only 2 neighbours, 2 missing at the edge');
    for (const [i, n] of [[1, 8], [2, 10]]) { await page.click('#w2w-sents button[data-v="' + i + '"]'); s = await wS(); ok(s.tokens.length === n && s.counts.cbow === n && s.counts.sg === (n === 8 ? 26 : 34), 'sentence ' + (i + 1) + ' (' + n + ' words): CBOW ' + n + ', skip-gram ' + s.counts.sg); }
    await page.click('#w2w-reset'); s = await wS(); ok(s.C === 2 && s.mode === 'cbow' && s.counts.sg === 18 && s.sentence.startsWith('we drink'), 'window reset'); }

  /* ======================================================================================= */
  console.log('· the lab engine: one negative-sampling step vs an independent implementation');
  { const r = await U(() => { const E = U16W2V.engine; const out = [];
      for (const [seed, opts, n] of [[7, {}, 1234], [3, { C: 4, k: 10 }, 20000], [11, { sub: true, C: 1, k: 1 }, 7000]]) {
        const L = E.makeLab(Object.assign({ seed }, opts)); E.runPositions(L, n); const cp = m => ({ vin: Array.from(m.vin), vout: Array.from(m.vout) });
        let before = null, rec = null; for (let t = 0; t < 20 && !(rec && rec.ctx.length >= 2); t++) { before = { cbow: cp(L.cbow), sg: cp(L.sg) }; rec = E.stepPosition(L, true); }
        const after = { cbow: cp(L.cbow), sg: cp(L.sg) };
        out.push({ d: L.d, before, after, rec, k: L.o.k, seed, opts }); }
      return out; });
    for (const x of r) { const { d, rec } = x;
      const b = x.before; const vinC = b.cbow.vin.slice(), voutC = b.cbow.vout.slice(), vinS = b.sg.vin.slice(), voutS = b.sg.vout.slice();
      const ctx = rec.ctx, n = ctx.length, h = new Array(d).fill(0); ctx.forEach(c => { for (let j = 0; j < d; j++) h[j] += vinC[c * d + j] / n; });
      const eh = indNS(voutC, d, h, [[rec.centre, 1]].concat(rec.cbow.negs.map(w => [w, 0])), rec.alpha); ctx.forEach(c => { for (let j = 0; j < d; j++) vinC[c * d + j] += eh[j] / n; });
      rec.sg.forEach((pr, q) => { const hh = vinS.slice(rec.centre * d, rec.centre * d + d); const e2 = indNS(voutS, d, hh, [[pr.target, 1]].concat(pr.negs.map(w => [w, 0])), rec.alpha); for (let j = 0; j < d; j++) vinS[rec.centre * d + j] += e2[j]; });
      const md = (a, b2) => a.reduce((m, v, i) => Math.max(m, Math.abs(v - b2[i])), 0);
      const dev = Math.max(md(vinC, x.after.cbow.vin), md(voutC, x.after.cbow.vout), md(vinS, x.after.sg.vin), md(voutS, x.after.sg.vout));
      ok(dev < 1e-12, 'seed ' + x.seed + ' ' + JSON.stringify(x.opts) + ': CBOW (blame split 1/' + n + ') and skip-gram (full blame per neighbour) updates match to 1e-12 (max dev ' + dev.toExponential(1) + ')');
      ok(rec.cbow.negs.length + rec.cbow.skipped === x.k && rec.sg.every(p => p.negs.length + p.skipped === x.k) && rec.sg.length === n, 'one CBOW guess and ' + n + ' skip-gram guesses, each with k = ' + x.k + ' noise draws');
    }
    const nz = await U(() => { const E = U16W2V.engine, C = E.CORP; const i = C.idx; return { sum: C.noise.reduce((a, b) => a + b, 0), r: C.noise[i.the] / C.noise[i.chai], c: [C.count[i.the], C.count[i.chai], C.count[i.kadak], C.count[i.googly]], N: C.N, S: C.sents.length, V: C.vocab.length,
      keep: [E.keepProb(i.the), E.keepProb(i.kadak), E.keepProb(i.chai)], topics: E.TOPICS, labelled: C.labelled.length }; });
    ok(near(nz.sum, 1, 1e-12) && near(nz.r, Math.pow(nz.c[0] / nz.c[1], 0.75), 1e-12), 'noise words: probability ∝ count^0.75 (the : chai = (' + nz.c[0] + '/' + nz.c[1] + ')^0.75)');
    ok(nz.S >= 80 && nz.S <= 150 && nz.c[2] === 3 && nz.c[3] === 3, 'the text: ' + nz.S + ' sentences, ' + nz.N + ' words, ' + nz.V + ' word types; kadak and googly 3 times each');
    ok(near(nz.keep[0], Math.sqrt(0.02 / (nz.c[0] / nz.N)), 1e-12) && nz.keep[1] === 1, 'subsampling keeps "the" with √(t/f) = ' + nz.keep[0].toFixed(3) + ', always keeps kadak');
    ok(nz.topics.drinks.join() === 'chai,coffee,lassi,tea,milk' && nz.topics.cricket.join() === 'bat,ball,wicket,over,six' && nz.topics.travel.join() === 'train,bus,ticket,station,platform' && nz.topics.food.join() === 'roti,dal,rice,sabzi', 'topic groups as specified');
  }
  { const d = await U(() => { const E = U16W2V.engine; const a = E.finish(E.makeLab({ seed: 4 })), b = E.makeLab({ seed: 4 }); while (!b.done) E.runPositions(b, 7);
      const same = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
      return { det: same(a.cbow.vin, b.cbow.vin) && same(a.sg.vin, b.sg.vin) && same(a.sg.vout, b.sg.vout) && a.cbow.dots === b.cbow.dots, pos: a.positions, other: !same(a.sg.vin, E.finish(E.makeLab({ seed: 5 })).sg.vin) }; });
    ok(d.det, 'determinism: same seed → identical vectors, however the training is cut into frames'); ok(d.other, 'a different seed gives a different run'); ok(d.pos === 582 * 40, 'a race reads 40 passes × 582 words = 23 280 positions'); }

  /* ======================================================================================= */
  console.log('· the lab claims, over 20 seeds (defaults: window 2, k = 5, d = 8, η 0.1 → 0, 40 passes)');
  const claims = await U(() => { const E = U16W2V.engine, out = [];
    for (let seed = 1; seed <= 20; seed++) { const L = E.makeLab({ seed }), at = {};
      while (!L.done) { E.runPositions(L, 97); if ((L.pass === 5 || L.pass === 10 || L.pass === 20) && !at[L.pass]) at[L.pass] = [E.topicScore(L, L.cbow).score, E.topicScore(L, L.sg).score]; }
      const fit = w => [E.wordFit(L, L.cbow, w).fit, E.wordFit(L, L.sg, w).fit], same = (m, w, n) => E.neighbours(L, m, w, n).filter(([x]) => E.CORP.topicOf[x] === E.CORP.topicOf[w]).length;
      out.push({ seed, at, end: [E.topicScore(L, L.cbow).score, E.topicScore(L, L.sg).score], preds: [L.cbow.preds, L.sg.preds], dots: [L.cbow.dots, L.sg.dots],
        chai: fit('chai'), kadak: fit('kadak'), googly: fit('googly'), nk: [same(L.cbow, 'kadak', 4), same(L.sg, 'kadak', 4)], nc: [same(L.cbow, 'chai', 4), same(L.sg, 'chai', 4)] }); }
    return out; });
  { const all = f => claims.every(f), cnt = f => claims.filter(f).length, rng = a => '[' + Math.min(...a).toFixed(3) + ', ' + Math.max(...a).toFixed(3) + ']', mean = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(3);
    ok(all(c => c.preds[0] === 23280 && c.preds[1] === 68640), 'cost: CBOW makes 23 280 guesses, skip-gram 68 640 (exactly 2.948× — window 2 on short sentences)');
    const dr = claims.map(c => c.dots[1] / c.dots[0]); ok(Math.min(...dr) > 2.9 && Math.max(...dr) < 3.0, 'cost: dot products ratio ' + rng(dr) + ' ≈ 2.95 (Try: “about 3 times less work”)');
    for (const p of [5, 10, 20]) ok(all(c => c.at[p][1] > c.at[p][0]), 'pass ' + p + ': skip-gram’s topic score beats CBOW’s in 20/20 seeds (sg ' + rng(claims.map(c => c.at[p][1])) + ', cbow ' + rng(claims.map(c => c.at[p][0])) + ')');
    ok(all(c => c.at[10][1] > 0.35 && c.at[10][0] < 0.2), 'Try: by pass 10 skip-gram’s groups have formed (score > 0.35) while CBOW’s have not (< 0.2), 20/20 seeds');
    ok(all(c => c.end[1] > c.end[0] && c.end[0] > 0.2), 'end: both models find the topics (CBOW ' + rng(claims.map(c => c.end[0])) + ', mean ' + mean(claims.map(c => c.end[0])) + '), skip-gram tighter (' + rng(claims.map(c => c.end[1])) + ', mean ' + mean(claims.map(c => c.end[1])) + ') in 20/20');
    const dk = claims.map(c => c.kadak[1] - c.kadak[0]), dg = claims.map(c => c.googly[1] - c.googly[0]), dc = claims.map(c => c.chai[1] - c.chai[0]);
    ok(Math.min(...dk) > 0.08, 'Try: kadak fits the drinks better in skip-gram in 20/20 seeds (fit sg ' + rng(claims.map(c => c.kadak[1])) + ' vs cbow ' + rng(claims.map(c => c.kadak[0])) + '; gap ≥ ' + Math.min(...dk).toFixed(3) + ')');
    ok(Math.min(...dg) > 0.08, 'googly fits cricket better in skip-gram in 20/20 seeds (fit sg ' + rng(claims.map(c => c.googly[1])) + ' vs cbow ' + rng(claims.map(c => c.googly[0])) + '; gap ≥ ' + Math.min(...dg).toFixed(3) + ')');
    const mdc = dc.reduce((a, b) => a + b, 0) / 20, mdk = dk.reduce((a, b) => a + b, 0) / 20;
    ok(mdc < 0.25 * mdk && Math.max(...dc.map(Math.abs)) < 0.16, 'Try: for the everyday word chai the two models are close (skip-gram ahead by ' + mdc.toFixed(3) + ' on average, in ' + cnt(c => c.chai[1] > c.chai[0]) + '/20 seeds; gap ' + rng(dc) + ') — for kadak by ' + mdk.toFixed(3) + ', in 20/20');
    ok(cnt(c => c.nk[1] >= 3) === 20, 'skip-gram’s kadak: ≥ 3 of its 4 nearest words are drinks in 20/20 seeds (all 4 in ' + cnt(c => c.nk[1] === 4) + '); CBOW’s: ≥ 3 in ' + cnt(c => c.nk[0] >= 3) + '/20');
    ok(cnt(c => c.nc[1] >= 3) === 20 && cnt(c => c.nc[0] >= 2) === 20, 'chai: skip-gram ≥ 3 drinks among its 4 nearest in 20/20; CBOW ≥ 3 in ' + cnt(c => c.nc[0] >= 3) + '/20 (it sometimes mixes chai with food)');
    console.log('   per-seed (seed: topic@10 cbow/sg · end cbow/sg · kadak fit cbow/sg · googly fit cbow/sg)');
    claims.forEach(c => console.log('   ' + String(c.seed).padStart(2) + ': ' + c.at[10].map(x => x.toFixed(2)).join('/') + ' · ' + c.end.map(x => x.toFixed(3)).join('/') + ' · ' + c.kadak.map(x => x.toFixed(2)).join('/') + ' · ' + c.googly.map(x => x.toFixed(2)).join('/')));
  }
  if (!QUICK) { /* the same claims with other settings, 10 seeds each (reported for the prose; no Try-line claim depends on them) */
    const v = await U(() => { const E = U16W2V.engine, res = {};
      for (const [name, o] of [['C1', { C: 1 }], ['C4', { C: 4 }], ['sub', { sub: true }], ['k1', { k: 1 }]]) { const rows = [];
        for (let seed = 1; seed <= 10; seed++) { const L = E.finish(E.makeLab(Object.assign({ seed }, o))); rows.push({ r: L.sg.dots / L.cbow.dots, pos: L.positions, cb: E.topicScore(L, L.cbow).score, sg: E.topicScore(L, L.sg).score, kc: E.wordFit(L, L.cbow, 'kadak').fit, ks: E.wordFit(L, L.sg, 'kadak').fit }); }
        res[name] = rows; } return res; });
    const s = (rows, f) => rows.filter(f).length;
    console.log('   window 1: ratio ' + v.C1[0].r.toFixed(3) + ', sg topic > cbow in ' + s(v.C1, x => x.sg > x.cb) + '/10, kadak sg > cbow in ' + s(v.C1, x => x.ks > x.kc) + '/10');
    console.log('   window 4: ratio ' + v.C4[0].r.toFixed(3) + ', sg topic > cbow in ' + s(v.C4, x => x.sg > x.cb) + '/10, kadak sg > cbow in ' + s(v.C4, x => x.ks > x.kc) + '/10');
    console.log('   subsampling: positions ' + Math.min(...v.sub.map(x => x.pos)) + '…' + Math.max(...v.sub.map(x => x.pos)) + ' (vs 23 280), cbow end topic ' + (v.sub.reduce((a, x) => a + x.cb, 0) / 10).toFixed(3) + ', sg ' + (v.sub.reduce((a, x) => a + x.sg, 0) / 10).toFixed(3) + ', kadak sg > cbow ' + s(v.sub, x => x.ks > x.kc) + '/10');
    console.log('   k = 1: sg topic > cbow in ' + s(v.k1, x => x.sg > x.cb) + '/10 (no claim is made about k = 1)');
    ok(v.C1[0].r > 1.6 && v.C1[0].r < 1.7 && v.C4[0].r > 4.4 && v.C4[0].r < 4.6, 'cost ratio grows with the window: window 1 → ' + v.C1[0].r.toFixed(2) + '×, window 4 → ' + v.C4[0].r.toFixed(2) + '× (at most 2C)');
    ok(v.sub.every(x => x.pos < 23280 * 0.9), 'subsampling reads fewer words (it drops most copies of "the")');
  }

  /* ======================================================================================= */
  console.log('· the lab on the page');
  const lS = () => U(() => U16W2V.lab.state());
  { await page.locator('#w-lab').scrollIntoViewIfNeeded(); await page.click('#w2l-reset');
    let s = await lS(); ok(s.positions === 0 && s.seed === 1 && s.C === 2 && s.k === 5 && near(s.eta, 0.1) && !s.sub, 'lab starts at the defaults, nothing read yet');
    const P0 = s.cbow.map.pts, P1 = s.sg.map.pts; ok(vnear(P0, P1, 1e-9), 'both maps start from the same random picture (same start for both models)');
    /* in page mode the sandbox's software GL (the page's 3-D stages) gives only a frame every few seconds, so ask for fewer frames there */
    const NEED = SRC === 'page' ? { pos: 30, fr: 3, t: 90000 } : { pos: 582, fr: 12, t: 30000 };
    const t0 = Date.now(); await page.click('#w2l-play'); await page.waitForFunction(n => U16W2V.lab.state().positions > n.pos && (U16W2V.lab.st.frames || []).length >= n.fr, NEED, { timeout: NEED.t }); s = await lS();
    ok(s.playing && s.positions > NEED.pos, '▶ race trains (' + s.positions + ' positions after ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s at 2×; ' + (SRC === 'page' ? 'software GL, whole page' : 'default compositing') + ')');
    const fr = await U(() => (U16W2V.lab.st.frames || []).slice(1)); const mx = Math.max(...fr), av = fr.reduce((a, b) => a + b, 0) / fr.length; ok(fr.length >= NEED.fr - 1 && mx < 50, 'the widget’s own work per frame stays under 50 ms (max ' + mx.toFixed(1) + ' ms, mean ' + av.toFixed(1) + ' ms over ' + fr.length + ' frames)');
    await page.click('#w2l-play'); s = await lS(); const p1 = s.positions; await page.waitForTimeout(400); ok(!(await lS()).playing && (await lS()).positions === p1, '❚❚ pauses');
    /* off-screen pause */
    /* state-based: scroll far away (to the practice arena on the page — no 3-D stage there, so software GL keeps painting),
       then wait until the lab has noticed it is off-screen AND its frame loop has stopped; only then compare two readings */
    await page.click('#w2l-play');
    await page.evaluate(() => { const far = document.getElementById('spractice'); if (far) far.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); });
    await page.waitForFunction(() => !U16W2V.lab.st.visible && !U16W2V.lab.looping, null, { timeout: SRC === 'page' ? 120000 : 15000 });
    const q1 = (await lS()).positions; await page.waitForTimeout(1200); const q2 = (await lS()).positions;
    ok(q1 === q2, 'the race pauses while the lab is off-screen (' + q1 + ' → ' + q2 + ')');
    await page.locator('#w-lab').scrollIntoViewIfNeeded(); await page.waitForFunction(q2 => U16W2V.lab.state().positions > q2, q2, { timeout: SRC === 'page' ? 90000 : 30000 }).catch(() => {}); ok((await lS()).positions > q2, 'and goes on when it is back on screen');
    await page.click('#w2l-play');
    /* finish, then check that every number shown comes from the engine */
    await U(() => U16W2V.lab.finish()); s = await lS(); ok(s.done && s.positions === 23280, 'finish: 40 passes read');
    const stats = await U(() => ['cbow', 'sg'].map(k => [...document.querySelectorAll('#w2l-st-' + k + ' .v')].map(x => x.textContent)));
    const c = x => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    ok(stats[0][0] === c(s.cbow.preds) && stats[1][0] === c(s.sg.preds) && stats[0][1] === c(s.cbow.dots) && stats[1][1] === c(s.sg.dots), 'stat chips show the engine’s guesses and dot products');
    ok(stats[0][3] === s.cbow.score.toFixed(3).replace('-', MI).replace(/0+$/, '').replace(/\.$/, '') || Math.abs(parseFloat(stats[0][3].replace(MI, '-')) - s.cbow.score) < 6e-4, 'topic-score chip = the engine’s score');
    const nb = await U(() => [...document.querySelectorAll('#w2l-nb-sg .w2l-nb')].map(b => ({ w: b.dataset.w, fit: b.querySelector('.fit').textContent, items: [...b.querySelectorAll('li')].map(li => li.textContent) })));
    ok(nb.length === 2 && nb[0].w === 'chai' && nb[1].w === 'kadak' && nb[1].items.length === 5 && nb[1].items[0].startsWith(s.sg.nb.rare[0][0]), 'neighbour lists for chai and kadak, in the engine’s order');
    ok(nb[1].fit.includes((s.sg.fit.kadak >= 0 ? '+' : '') + s.sg.fit.kadak.toFixed(2).replace('-', MI).replace(/0$/, '')) || Math.abs(parseFloat(nb[1].fit.replace(/[^\d.\-−+]/g, '').replace(MI, '-')) - s.sg.fit.kadak) < 0.006, '“fits drinks” = the engine’s fit for kadak (' + nb[1].fit + ')');
    /* the map tells the truth: every dot is the PCA shadow of its length-1 vector, turned and scaled as recorded */
    const mp = await U(() => { const L = U16W2V.lab.L, st = U16W2V.lab.state(); return { d: L.d, vin: { cbow: Array.from(L.cbow.vin), sg: Array.from(L.sg.vin) }, map: { cbow: st.cbow.map, sg: st.sg.map }, labelled: U16W2V.engine.CORP.labelled.map(w => U16W2V.engine.CORP.idx[w]) }; });
    for (const k of ['cbow', 'sg']) { const M = mp.map[k], d = mp.d, V = mp.vin[k].length / d; let dev = 0;
      for (let i = 0; i < V; i++) { const v = mp.vin[k].slice(i * d, i * d + d), n = Math.hypot(...v), u = v.map((x, j) => x / n - M.ax.mu[j]); let x = u.reduce((a, t, j) => a + t * M.ax.e1[j], 0), y = u.reduce((a, t, j) => a + t * M.ax.e2[j], 0);
        if (M.rot.flip) y = -y; const X = x * M.rot.c - y * M.rot.s, Y = x * M.rot.s + y * M.rot.c; const px = M.W / 2 + (X - M.cx) * M.sc, py = M.H / 2 - (Y - M.cy) * M.sc; dev = Math.max(dev, Math.abs(px - M.pts[i][0]), Math.abs(py - M.pts[i][1])); }
      ok(dev < 1e-6, k + ' map: all ' + V + ' dots are the recorded PCA shadow (max dev ' + dev.toExponential(1) + ' px)');
      /* the two directions are the top two of the covariance (independent Jacobi) */
      const rows = mp.labelled.map(i => { const v = mp.vin[k].slice(i * d, i * d + d), n = Math.hypot(...v); return v.map(x => x / n); }), mu = new Array(d).fill(0); rows.forEach(r => r.forEach((x, j) => mu[j] += x / rows.length));
      const Cv = Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => rows.reduce((a, r) => a + (r[i] - mu[i]) * (r[j] - mu[j]), 0) / rows.length));
      const ev = jacobi(Cv), top = ev.vecs.slice(0, 2), Pt = (a, b) => Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => a[i] * a[j] + b[i] * b[j]));
      const A = Pt(top[0], top[1]), B = Pt(M.ax.e1, M.ax.e2); let pd = 0; for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) pd = Math.max(pd, Math.abs(A[i][j] - B[i][j]));
      ok(pd < 1e-8, k + ' map: its two directions span the top two principal directions (projector dev ' + pd.toExponential(1) + '); keeps ' + Math.round((ev.vals[0] + ev.vals[1]) / ev.vals.reduce((a, b) => a + Math.max(0, b), 0) * 100) + '% of the spread');
      const lb = M.labels.map(b => ({ x: b.x, y: b.y, w: b.w_, h: b.h, t: b.w })); ok(pairOverlaps(lb, 0.01).length === 0 && lb.every(b => b.x >= 0 && b.y >= 0 && b.x + b.w <= M.W && b.y + b.h <= M.H), k + ' map: ' + lb.length + ' labels, none overlapping, all inside');
      ok(M.labels.some(b => b.w === 'kadak') && M.labels.some(b => b.w === 'chai'), k + ' map: kadak and chai are labelled'); }
    const ch = s.charts; ok(ch.score && ch.score.ends.length === 2 && near(ch.score.ends.find(e => e.k === 'sg').v, s.sg.score, 1e-9) && near(ch.work.ends.find(e => e.k === 'cbow').v, s.cbow.dots, 1e-9), 'charts end at the current topic scores and dot products');
  }
  { /* every control fires; settings start a new race */
    const h = () => U(() => JSON.stringify((({ seed, C, k, eta, sub, speed, slow, rare, playing, positions }) => ({ seed, C, k, eta, sub, speed, slow, rare, playing, positions }))(U16W2V.lab.state())));
    await page.click('#w2l-reset'); const h0 = await h();
    const acts = [['step', () => page.click('#w2l-step')], ['seed', () => page.click('#w2l-seed')], ['slow', () => page.click('#w2l-slow')], ['speed', () => page.click('#w2l-speed button[data-v="8"]')], ['rare', () => page.click('#w2l-rare button[data-v="googly"]')],
      ['window', () => U(() => { const r = document.getElementById('w2l-c'); r.value = 3; r.dispatchEvent(new Event('input')); })], ['k', () => U(() => { const r = document.getElementById('w2l-k'); r.value = 2; r.dispatchEvent(new Event('input')); })],
      ['eta', () => U(() => { const r = document.getElementById('w2l-eta'); r.value = 0.3; r.dispatchEvent(new Event('input')); })], ['sub', () => page.click('#w2l-sub')]];
    let prev = h0; for (const [n, f] of acts) { await f(); await page.waitForTimeout(80); const hn = await h(); ok(hn !== prev, 'lab control fires: ' + n); prev = hn; }
    const s = await lS(); ok(s.C === 3 && s.k === 2 && near(s.eta, 0.3) && s.sub && s.positions === 0, 'changing a setting starts a new race');
    await U(() => U16W2V.lab.finish()); const s2 = await lS(); const fin = v => Number.isFinite(v);
    ok(s2.done && fin(s2.cbow.score) && fin(s2.sg.score) && s2.sg.map.pts.every(p => fin(p[0]) && fin(p[1])), 'window 3, k = 2, η 0.3, subsampling: finishes with finite numbers');
    for (const [C, k, eta] of [[4, 10, 0.4], [1, 1, 0.02]]) { await U(([C, k, eta]) => { for (const [id, v] of [['w2l-c', C], ['w2l-k', k], ['w2l-eta', eta]]) { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input')); } U16W2V.lab.finish(); }, [C, k, eta]);
      const x = await lS(); ok(x.done && fin(x.cbow.score) && fin(x.sg.score) && x.cbow.map.pts.every(p => fin(p[0]) && fin(p[1])) && x.cbow.map.pts.every(p => p[0] >= -1 && p[0] <= x.cbow.map.W + 1 && p[1] >= -1 && p[1] <= x.cbow.map.H + 1), 'extreme settings C ' + C + ', k ' + k + ', η ' + eta + ': finite, every dot on the canvas'); }
    /* back to the defaults, then slow motion */
    await U(() => { for (const [id, v] of [['w2l-c', 2], ['w2l-k', 5], ['w2l-eta', 0.1]]) { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input')); } });
    if ((await lS()).sub) await page.click('#w2l-sub'); if (!(await lS()).slow) await page.click('#w2l-slow');
    await page.click('#w2l-reset'); for (let i = 0; i < 4; i++) await page.click('#w2l-step');
    const sm = await lS(), box = (await page.locator('#w2l-slowbox').textContent()).replace(/\s+/g, ' ');
    ok(sm.slow && sm.rec && sm.positions === 4, 'slow motion: step ▸ reads one word at a time (' + sm.positions + ')');
    const nctx = sm.rec.ctx.length; ok(sm.rec.cbow && sm.rec.sg.length === nctx && /CBOW · 1 guess/.test(box) && new RegExp('skip-gram · ' + nctx + ' guess').test(box), 'slow motion shows 1 CBOW guess and ' + nctx + ' skip-gram guesses for this word');
    ok(new RegExp((sm.rec.cbow.negs.length + 1) + ' dot products').test(box), 'slow motion counts the dot products (k + 1 per guess)');
    await page.click('#w2l-slow'); await page.click('#w2l-reset'); if ((await lS()).rare !== 'kadak') await page.click('#w2l-rare button[data-v="kadak"]'); await page.click('#w2l-speed button[data-v="2"]');
    const hr = await h(); ok(JSON.parse(hr).positions === 0 && JSON.parse(hr).rare === 'kadak', 'lab reset'); }
  { /* controls of the machines and the window fire */
    const hc = w => U(w => JSON.stringify((({ move, round, eta, win2 }) => ({ move, round, eta, win2 }))(U16W2V[w].state())), w);
    for (const [w, P] of [['cbow', 'w2c'], ['skipgram', 'w2s']]) { await page.click('#' + P + '-reset'); let prev = await hc(w);
      for (const id of ['next', 'next', 'back', 'all', 'more']) { await page.click('#' + P + '-' + id); await page.waitForTimeout(60); await settle(page, w); const x = await hc(w); ok(x !== prev, w + ' control fires: ' + id); prev = x; }
      ok(JSON.parse(prev).move === 7 && JSON.parse(prev).round === 2, w + ': ⏭ all moves then ↻ another round end on move 7 of round 2');
      await page.click('#' + P + '-rail li[data-m="3"]'); ok(JSON.parse(await hc(w)).move === 3, w + ': clicking move ③ on the rail jumps there');
      await U(P => { const r = document.getElementById(P + '-eta'); r.value = 2; r.dispatchEvent(new Event('input')); }, P); for (let k = 0; k < 25; k++) await U(w => U16W2V[w].another(), w);
      const s = await U(w => U16W2V[w].state(), w), fin = v => Number.isFinite(v); ok(s.R.p.every(fin) && fin(s.R.after.loss) && s.geo.out.arrows.every(a => fin(a.x2) && fin(a.y2) && a.x2 >= 0 && a.x2 <= s.geo.out.F.W && a.y2 >= 0 && a.y2 <= s.geo.out.F.H), w + ': η = 2 for 25 rounds stays finite and on the canvas (loss ' + s.R.after.loss.toFixed(4) + ')');
      await page.click('#' + P + '-reset'); }
    const hw = () => U(() => JSON.stringify((({ sentence, C, mode, cur, counts }) => ({ sentence, C, mode, cur, counts }))(U16W2V.window.state())));
    let prev = await hw(); for (const [n, f] of [['tile', () => page.click('#w2w-svg .w2w-tile[data-i="1"]')], ['mode', () => page.click('#w2w-mode button[data-v="sg"]')], ['step', () => page.click('#w2w-step')], ['C', () => U(() => { const r = document.getElementById('w2w-c'); r.value = 4; r.dispatchEvent(new Event('input')); })], ['sentence', () => page.click('#w2w-sents button[data-v="1"]')]]) {
      await f(); const x = await hw(); ok(x !== prev, 'window control fires: ' + n); prev = x; }
    await page.click('#w2w-reset'); }

  /* ======================================================================================= */
  console.log('· no overlapping text · text size · overflow (1440 and 390)');
  async function textBoxes(pg, sel) { return pg.evaluate(sel => [...document.querySelectorAll(sel)].map(svg => { const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect(), k = vb && vb.width ? r.width / vb.width : 1;
      return { id: svg.id, k, boxes: [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && getComputedStyle(t).display !== 'none' && +(t.getAttribute('opacity') || 1) > 0.05).map(t => { const b = t.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height, t: t.textContent.slice(0, 24), fs: parseFloat(getComputedStyle(t).fontSize) }; }) }; }), sel); }
  async function overlapSweep(pg, W) { let bad = [], small = [];
    const check = async tag => { for (const s of await textBoxes(pg, '#w-window svg,#w-cbow svg,#w-skipgram svg')) { const o = pairOverlaps(s.boxes, 0.8); if (o.length) bad.push(tag + ' ' + s.id + ': ' + o.slice(0, 3).map(p => p.join(' ⟂ ')).join('; ')); s.boxes.forEach(b => { if (b.fs * s.k < 10.95) small.push(tag + ' ' + s.id + ' "' + b.t + '" ' + (b.fs * s.k).toFixed(1) + 'px'); }); } };
    for (const w2 of [false, true]) { await pg.evaluate(w2 => U16W2V.cbow.setWin2(w2), w2); for (let m = 0; m <= 7; m++) { await pg.evaluate(m => { U16W2V.cbow.go(m); U16W2V.skipgram.go(m); }, m); await check('move ' + m + (w2 ? ' (window 2)' : '')); } }
    await pg.evaluate(() => { U16W2V.cbow.setEta(2); for (let k = 0; k < 6; k++) { U16W2V.cbow.another(); U16W2V.skipgram.another(); } }); await check('η 2, round 7');
    await pg.evaluate(() => { U16W2V.cbow.reset(); U16W2V.skipgram.reset(); });
    for (let si = 0; si < 3; si++) for (const C of [1, 2, 3, 4]) for (const mode of ['cbow', 'sg']) { await pg.evaluate(([si, C, mode]) => { document.querySelector('#w2w-sents button[data-v="' + si + '"]').click(); const r = document.getElementById('w2w-c'); r.value = C; r.dispatchEvent(new Event('input')); document.querySelector('#w2w-mode button[data-v="' + mode + '"]').click(); }, [si, C, mode]);
      for (const i of [0, 2, 5]) { await pg.evaluate(i => { const t = document.querySelector('#w2w-svg .w2w-tile[data-i="' + i + '"]'); if (t) t.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, i); await check('window s' + si + ' C' + C + ' ' + mode + ' stop ' + i); } }
    await pg.evaluate(() => document.getElementById('w2w-reset').click());
    ok(bad.length === 0, W + ': no overlapping SVG text in any state' + (bad.length ? ' — ' + bad.slice(0, 4).join(' | ') : ''));
    /* no label had to be squeezed in on top of the drawing, in any normal state (η = 1, both committees, every move, five rounds) */
    const forced = await pg.evaluate(() => { const out = []; for (const w2 of [false, true]) { U16W2V.cbow.setWin2(w2); for (let r = 0; r < 5; r++) for (let m = 0; m <= 7; m++) { if (r && m < 7) continue; U16W2V.cbow.go(m); U16W2V.skipgram.go(m);
        for (const [n, st] of [['cbow', U16W2V.cbow.state()], ['skipgram', U16W2V.skipgram.state()]]) for (const k of ['in', 'out']) (st.geo[k].labels || []).forEach(l => { if (l.forced) out.push(n + ' ' + k + ' round ' + (r + 1) + ' move ' + m + (w2 ? ' w2' : '') + ': ' + l.name); });
        if (m === 7 && r < 4) { U16W2V.cbow.another(); U16W2V.skipgram.another(); } } U16W2V.cbow.reset(); U16W2V.skipgram.reset(); } return out; });
    ok(forced.length === 0, W + ': every plane label found a free spot (no forced placements) in every normal state' + (forced.length ? ' — ' + forced.slice(0, 5).join(' | ') : ''));
    ok(small.length === 0, W + ': every SVG label is ≥ 11 px on screen' + (small.length ? ' — ' + small.slice(0, 5).join(' | ') : ''));
    const html = await pg.evaluate(() => { const out = []; document.querySelectorAll('#w-window *,#w-cbow *,#w-skipgram *,#w-lab *').forEach(n => { if (n.closest('svg')) return; const own = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!own) return; const cs = getComputedStyle(n); if (cs.display === 'none' || n.offsetParent === null) return; const f = parseFloat(cs.fontSize); if (f < 10.95) out.push(n.tagName + '.' + n.className + ' "' + n.textContent.trim().slice(0, 20) + '" ' + f.toFixed(1)); }); return out; });
    ok(html.length === 0, W + ': every HTML text in the widgets is ≥ 11 px' + (html.length ? ' — ' + html.slice(0, 5).join(' | ') : ''));
    const ov = await pg.evaluate(() => ({ doc: document.documentElement.scrollWidth - innerWidth, w: ['w-window', 'w-cbow', 'w-skipgram', 'w-lab'].map(id => { const e = document.getElementById(id); return e.scrollWidth - e.clientWidth; }) }));
    ok(ov.doc <= 0 && ov.w.every(x => x <= 1), W + ': no horizontal overflow (page ' + ov.doc + ', widgets ' + ov.w.join('/') + ')'); }
  await overlapSweep(page, 1440);
  const mob = await open(390);
  await overlapSweep(mob, 390);
  { const L = await mob.evaluate(() => { U16W2V.lab.finish(); const s = U16W2V.lab.state(); return ['cbow', 'sg'].map(k => ({ n: s[k].map.labels.length, W: s[k].map.W, H: s[k].map.H, hidden: s[k].map.hidden })); });
    ok(L.every(m => m.W >= 300 && m.W <= 370 && m.n >= 12), '390: the maps fill the column (' + L.map(m => m.W + '×' + m.H + ', ' + m.n + ' labels').join('; ') + ')');
    const lay = await mob.evaluate(() => { const a = document.querySelector('#w-lab .w2l-side[data-k="cbow"]').getBoundingClientRect(), b = document.querySelector('#w-lab .w2l-side[data-k="sg"]').getBoundingClientRect(); return { stacked: b.top >= a.bottom - 1, w: a.width }; });
    ok(lay.stacked, '390: the two lab panels stack'); const wl = await mob.evaluate(() => U16W2V.window.state().geo.layout); ok(wl === 'col', '390: the sliding window turns into a column'); }
  await mob.context().close();

  /* ======================================================================================= */
  console.log('· themes');
  { const hashCv = pg => pg.evaluate(() => { const c = document.getElementById('w2l-map-sg'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < x.length; i += 97) h = (h * 31 + x[i]) >>> 0; return h; });
    await page.evaluate(() => { U16W2V.lab.finish(); document.documentElement.setAttribute('data-theme', 'dark'); }); await page.waitForTimeout(150); const hd = await hashCv(page);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await page.waitForTimeout(250); const hl = await hashCv(page);
    ok(hd !== hl, 'the canvas maps re-render when the theme flips');
    const fill = await page.evaluate(() => getComputedStyle(document.querySelector('#w2c-out .w2-vout line:last-of-type') || document.body).stroke); ok(/rgb/.test(fill), 'SVG strokes follow the theme variables (' + fill + ')');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark')); }
  const lightPage = await open(1440, { theme: 'light' });
  { const t = await lightPage.evaluate(() => { U16W2V.cbow.go(7); U16W2V.skipgram.go(7); U16W2V.lab.finish(); return document.documentElement.getAttribute('data-theme'); }); ok(t === 'light', 'light theme page renders every widget'); }
  await lightPage.context().close();

  /* ======================================================================================= */
  console.log('· reduced motion');
  { const rm = await open(1440, { rm: true });
    await rm.click('#w2l-play'); const s = await rm.evaluate(() => U16W2V.lab.state()); ok(s.done && !s.playing, 'reduced motion: ▶ race shows the finished race at once');
    await rm.click('#w2w-step'); await rm.click('#w2w-play'); const w = await rm.evaluate(() => U16W2V.window.state()); ok(w.counts.cbow === 6 && w.counts.sg === 18 && !w.playing, 'reduced motion: ▶ slide shows the final counts at once');
    for (let m = 0; m < 6; m++) await rm.click('#w2c-next'); const c = await rm.evaluate(() => U16W2V.cbow.state()); ok(c.move === 6 && !c.animating && vnear(c.geo.in.arrows[0].vec, c.R.next.vin[c.R.ctx[0]], 1e-12), 'reduced motion: move 6 shows the moved vectors at once, no tween'); }

  if (errs.length) errs.forEach(e => console.log('  ERR', e));
  ok(errs.length === 0, 'zero console errors (' + errs.length + ')');
  console.log(`\n${passes} passed, ${fails} failed` + (fails ? '\n  ' + failed.slice(0, 12).join('\n  ') : ''));
  await browser.close(); if (server) server.kill();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });

/* an independent symmetric eigen-solver (classic Jacobi with the largest off-diagonal pivot) */
function jacobi(A0) { const n = A0.length, A = A0.map(r => r.slice()), V = A.map((_, i) => A.map((_, j) => i === j ? 1 : 0));
  for (let it = 0; it < 2000; it++) { let p = 0, q = 1, m = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(A[i][j]) > m) { m = Math.abs(A[i][j]); p = i; q = j; } if (m < 1e-15) break;
    const phi = 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]), c = Math.cos(phi), s = Math.sin(phi);
    for (let k = 0; k < n; k++) { const a = A[k][p], b = A[k][q]; A[k][p] = c * a - s * b; A[k][q] = s * a + c * b; }
    for (let k = 0; k < n; k++) { const a = A[p][k], b = A[q][k]; A[p][k] = c * a - s * b; A[q][k] = s * a + c * b; }
    for (let k = 0; k < n; k++) { const a = V[k][p], b = V[k][q]; V[k][p] = c * a - s * b; V[k][q] = s * a + c * b; } }
  const idx = A.map((_, i) => i).sort((i, j) => A[j][j] - A[i][i]); return { vals: idx.map(i => A[i][i]), vecs: idx.map(i => V.map(r => r[i])) }; }
