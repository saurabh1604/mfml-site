/* Unit 16 · Words as Vectors — widget behaviour, numerical correctness and visual correctness (WebGL on).
   Every widget of 16-main registers window.U16['w-…'] = {state(), …setters}; this suite drives the setters and checks the
   numbers the picture was drawn from against independent maths, the Try-line claims, the controls, no NaN, no overlapping or
   clipped labels (SVG text boxes and 3-D sprite labels), 360–1680 px layouts, 390 px label sizes, both themes and the console.
   The four word2vec widgets of 16-w2v (w-window, w-cbow, w-skipgram, w-lab) are checked for presence here and in depth by
   verify-u16-w2v.js.   PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u16.js */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
const near = (a, b, t) => Math.abs(+a - b) < (t || 1e-4);
const test = (cond, good, badMsg) => cond ? okay(good) : fail(badMsg || good);
const f3 = x => (+x).toFixed(3);
const sig = z => 1 / (1 + Math.exp(-z));
const softmax = z => { const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0), nrm = a => Math.sqrt(dot(a, a)), cos = (a, b) => dot(a, b) / nrm(a) / nrm(b);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  const glNotes = [];   /* software GL in this sandbox can refuse a new WebGL context now and then: noted, not failed */
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_CONNECTION|net::ERR_/.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0, 200)); if (m.type() === 'warning' && /U16|stage failed/.test(m.text())) errors.push('WARN: ' + m.text().slice(0, 200));
    if (m.type() === 'warning' && /stage3d/.test(m.text())) glNotes.push(m.text().slice(0, 120)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const text = sel => page.locator(sel).innerText();
  const norm = s => s.replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  /* headless software GL can stall the page's rendering (no animation frames, so no IntersectionObserver news either);
     make sure frames are flowing after every scroll, poking the page if they are not */
  let stalls = 0;
  const ensureFrames = async () => { for (let i = 0; i < 5; i++) {
      const ok = await page.evaluate(() => new Promise(r => { let done = false; requestAnimationFrame(() => { done = true; r(true); }); setTimeout(() => { if (!done) r(false); }, 2500); }));
      if (ok) return true; stalls++; await page.bringToFront(); await page.mouse.move(12 + i, 12); await page.evaluate(() => { scrollBy(0, 1); scrollBy(0, -1); dispatchEvent(new Event('resize')); }); }
    return false; };
  const show = async (sel, ms) => { await page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await ensureFrames(); await page.waitForTimeout(ms == null ? 900 : ms); };
  /* a real click when the button is steady on screen; under software GL frames can be too slow for Playwright's stability wait, so fall back to a DOM click */
  const click = async (sel, ms) => { try { await page.locator(sel).first().click({ timeout: 6000 }); } catch (e) { await page.evaluate(s => document.querySelector(s).click(), sel); }
    await page.waitForTimeout(ms == null ? 300 : ms); };
  const st = id => page.evaluate(id => window.U16[id].state(), id);
  const call = (id, fn, ...args) => page.evaluate(([id, fn, args]) => window.U16[id][fn](...args), [id, fn, args]);

  await page.goto('file:///home/claude/mfml-site/site/unit-16.html');
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.waitForTimeout(2500);
  /* in-page helpers: visible SVG text boxes (overlaps and clipping), 3-D label rectangles, NaN hunting */
  await page.evaluate(() => {
    const vis = el => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .05) return false; if (e.tagName.toLowerCase() === 'svg') break; }
      const op = el.getAttribute('opacity'); return !(op != null && +op < .05); };
    window.__svgCheck = sel => { const svg = typeof sel === 'string' ? document.querySelector(sel) : sel; const R = svg.getBoundingClientRect(); if (!R.width) return { skipped: true, overlaps: [], outside: [], n: 0 };
      const T = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && vis(t)).map(t => ({ el: t, t: t.textContent.trim().slice(0, 24), r: t.getBoundingClientRect(), rot: /rotate/.test(t.getAttribute('transform') || '') })).filter(o => o.r.width > 0);
      /* rotated labels: compare the turned boxes themselves (separating-axis test), not their upright bounding boxes */
      const poly = t => { const b = t.getBBox(); let p = [[b.x, b.y + b.height * .15], [b.x + b.width, b.y + b.height * .15], [b.x + b.width, b.y + b.height * .85], [b.x, b.y + b.height * .85]];
        const m = (t.getAttribute('transform') || '').match(/rotate\(([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)\)/); if (m) { const a = +m[1] * Math.PI / 180, cx = +m[2], cy = +m[3]; p = p.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]); } return p; };
      const sat = (A, B) => { for (const P of [A, B]) for (let i = 0; i < 4; i++) { const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % 4], nx = y2 - y1, ny = x1 - x2, L = Math.hypot(nx, ny) || 1;
          const pa = A.map(([x, y]) => (x * nx + y * ny) / L), pb = B.map(([x, y]) => (x * nx + y * ny) / L); if (Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb)) < 1) return false; } return true; };
      const overlaps = [], outside = [];
      for (let i = 0; i < T.length; i++) { const a = T[i].r;
        if (a.left < R.left - 1.5 || a.right > R.right + 1.5 || a.top < R.top - 1.5 || a.bottom > R.bottom + 1.5) outside.push(T[i].t);
        for (let j = i + 1; j < T.length; j++) { const b = T[j].r;
          if (T[i].rot || T[j].rot) { if (sat(poly(T[i].el), poly(T[j].el))) overlaps.push(T[i].t + ' × ' + T[j].t); continue; }
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox > 2 && oy > .3 * Math.min(a.height, b.height)) overlaps.push(T[i].t + ' × ' + T[j].t); } }
      return { overlaps, outside, n: T.length }; };
    window.__lab3 = (labels, box) => { if (!labels) return { none: true }; const el = document.querySelector(box + ' canvas'), W = el ? el.clientWidth : 0, H = el ? el.clientHeight : 0;
      const L = labels.filter(l => l.front && l.w > 0), overlaps = [], outside = [];
      for (let i = 0; i < L.length; i++) { const a = L[i]; if (a.x < -2 || a.y < -2 || a.x + a.w > W + 2 || a.y + a.h > H + 2) outside.push(a.t);
        for (let j = i + 1; j < L.length; j++) { const b = L[j], ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ox > 3 && oy > .35 * Math.min(a.h, b.h)) overlaps.push(a.t + ' × ' + b.t); } }
      return { n: L.length, overlaps, outside, texts: L.map(l => l.t) }; };
    window.__nan = sel => { const root = document.querySelector(sel); const bad = []; root.querySelectorAll('*').forEach(e => { for (const a of e.attributes || []) if (/NaN|Infinity/.test(a.value) && !/^data-/.test(a.name)) bad.push(e.tagName + '@' + a.name); });
      if (/NaN|undefined/.test(root.innerText)) bad.push('text: ' + (root.innerText.match(/.{0,30}(NaN|undefined).{0,20}/) || [''])[0]); return bad; };
  });
  const svgOK = async (sel, what) => { const r = await page.evaluate(s => window.__svgCheck(s), sel);
    if (r.skipped) return fail(what + ': ' + sel + ' not visible');
    test(!r.overlaps.length && !r.outside.length, `${what}: ${r.n} labels, none overlapping or clipped`, `${what}: overlaps ${JSON.stringify(r.overlaps.slice(0, 6))} clipped ${JSON.stringify(r.outside.slice(0, 6))}`); };
  /* 3-D labels are laid out once per frame; under software GL a frame can take a second, so read until the layout has caught up
     with the last change (expect: a test on the label texts) and give a moving camera a few frames to settle */
  const lab3OK = async (id, box, what, min, expect) => { let s = await st(id), r = null;
    for (let i = 0; i < 24; i++) { const ready = s.labels && s.labels.filter(l => l.front && l.w > 0).length && (!expect || expect(s.labels.map(l => l.t)));
      if (ready) { r = await page.evaluate(([l, b]) => window.__lab3(l, b), [s.labels, box]); if (!r.overlaps.length && !r.outside.length && i >= 1) break; }
      await page.waitForTimeout(500); if (i % 4 === 3) await ensureFrames(); s = await st(id); }
    if (!r) r = await page.evaluate(([l, b]) => window.__lab3(l, b), [s.labels, box]);
    if (r.none) { const why = await page.evaluate(b => { const e = document.querySelector(b); return { canvas: !!e.querySelector('canvas'), parked: e.dataset.parked || '', msg: (e.innerText || '').slice(0, 60) }; }, box); return fail(what + ': stage not mounted, labels unreadable ' + JSON.stringify(why)); }
    test(r.n >= (min || 1) && !r.overlaps.length && !r.outside.length && (!expect || expect(r.texts || [])), `${what}: ${r.n} 3-D labels (${r.texts.slice(0, 8).join(', ')}${r.n > 8 ? ', …' : ''}), none overlapping or off the stage`,
      `${what}: 3-D labels ${r.n} overlaps ${JSON.stringify(r.overlaps.slice(0, 6))} outside ${JSON.stringify(r.outside)} · texts ${JSON.stringify(r.texts)} · expect ${expect ? !!expect(r.texts || []) : '-'}${s.dbg ? ' · dbg ' + JSON.stringify(s.dbg) : ''}`); };
  const nanOK = async (sel, what) => { const r = await page.evaluate(s => window.__nan(s), sel); test(!r.length, what + ': no NaN / undefined anywhere', what + ': ' + r.slice(0, 5).join(' | ')); };

  console.log('— page —');
  const c = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length,
    w3d: [...document.querySelectorAll('.widget')].filter(w => w.querySelector('.stage3d')).length,
    derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length,
    katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u16-total'), T: document.title,
    scoreTotal: document.getElementById('score-total').textContent, crumb: document.querySelector('.topbar .crumb').textContent, kicker: document.querySelector('.hero .kicker').textContent,
    ids: [...document.querySelectorAll('section.unit')].map(s => s.id).join(','), nums: [...document.querySelectorAll('section.unit .sec-num')].map(s => s.textContent).join(','),
    stub: /Being built/.test(document.body.innerText), w2v: ['w-window', 'w-cbow', 'w-skipgram', 'w-lab'].filter(id => document.getElementById(id)).length }));
  test(c.checks === 43 && c.total === '43' && c.scoreTotal === '43', '43 checks, total published, #score-total = 43', 'checks ' + JSON.stringify(c));
  test(c.widgets === 23 && c.w3d === 5 && c.derives === 30 && c.drawers === 15 && c.probs === 16, '23 widgets (5 in 3D) · 30 derivations in 15 drawers · 16 problems', 'counts ' + JSON.stringify(c));
  test(c.ids === 's1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13,s14,s15,s16,s17,spractice' && c.nums === '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18', 'sections s1–s17 + spractice, numbered § 1–18', 'section ids ' + c.ids + ' / ' + c.nums);
  test(c.w2v === 4 && !c.stub, 'the four word2vec widgets of 16-w2v are in place (no stub)', 'w2v widgets ' + c.w2v + ' stub ' + c.stub);
  test(!c.katex, 'no KaTeX errors', 'katex-error ×' + c.katex);
  test(/^Unit 16 · Words as Vectors/.test(c.T) && /Unit 16 · Words as Vectors/.test(c.crumb) && /Unit 16 of 20/.test(c.kicker), 'title, crumb and kicker say Unit 16', 'title/crumb ' + JSON.stringify([c.T, c.crumb, c.kicker]));
  const chips = norm(await text('.hero .meta'));
  test(/23 interactive widgets · 5 in 3D/.test(chips) && /43 inline checks/.test(chips) && /30 proofs/.test(chips) && /16 solved practice problems/.test(chips) && /five acts/.test(chips), 'hero chips: 23 widgets · 5 in 3D · 43 checks · 30 proofs · 16 problems · five acts', 'hero chips: ' + chips);
  const leak = await page.evaluate(() => { const h = document.documentElement.innerHTML.replace(/mfml-/g, ''); return (h.match(/MFML|ZC416|BITS|WILP/) || h.match(/exam paper|question bank|past paper/i) || document.body.innerText.match(/\bexams?\b/i) || [''])[0]; });
  test(!leak, 'no brand leak, no "exam" wording', 'brand leak: ' + leak);
  const nav = await page.evaluate(() => ({ prev: !!document.querySelector('.hero-prev a[href="unit-15.html"]'), toc: document.querySelector('.toc-nav') && document.querySelector('.toc-nav').textContent,
    next: !!document.querySelector('#spractice .next-card a[href="unit-17.html"]'), units: (document.documentElement.innerHTML.match(/\{"n":16,"t":"Words as Vectors"\},\{"n":17,"t":"Machines with Memory"\},\{"n":18,"t":"Attention and Transformers"\}\]/) || []).length,
    s18: !!document.querySelector('a[href="unit-18.html"]'), u5: !!document.querySelector('a[href="unit-05.html#s7"]'), u14: !!document.querySelector('a[href="unit-14.html#s7"]') }));
  test(nav.prev && /Unit 15/.test(nav.toc || '') && /Unit 17/.test(nav.toc || '') && nav.next && nav.units === 1 && nav.s18 && nav.u5 && nav.u14, 'previous → Unit 15, next-card → Unit 17, links back (Units 5, 14) and forward (Unit 18), UNITS ends 16 · 17 · 18', 'nav ' + JSON.stringify(nav));
  const hero = await page.evaluate(() => ({ c: !!document.querySelector('#hero-3d canvas'), r: document.getElementById('hero-3d').dataset.ready }));
  test(hero.c && hero.r === '1', 'hero stage mounted', 'hero ' + JSON.stringify(hero));
  const tries = await page.evaluate(() => [...document.querySelectorAll('.widget')].filter(w => !w.querySelector('.try')).map(w => w.id));
  test(!tries.length, 'every widget has a Try line', 'widgets without a Try line: ' + tries);
  const onesent = await page.evaluate(() => [...document.querySelectorAll('section.unit')].filter(s => s.id !== 'spractice' && !s.querySelector('.onesent')).map(s => s.id));
  test(!onesent.length, 'every section ends with "In one sentence"', 'no one-sentence hook: ' + onesent);
  const traps = await page.evaluate(() => [...document.querySelectorAll('section.unit')].filter(s => /^s([1-9]|1[0-6])$/.test(s.id) && ![...s.querySelectorAll('.callout.watch .tag')].some(t => /Trap/.test(t.textContent))).map(s => s.id));
  test(!traps.length, 'sections §1–§16 each carry a Trap', 'no Trap in ' + traps);
  const qopen = await page.evaluate(() => [...document.querySelectorAll('section.unit')].filter(s => /^s([1-9]|1[0-6])$/.test(s.id) && !s.querySelector('.qopen')).map(s => s.id));
  test(!qopen.length, 'sections §1–§16 each open with a real question', 'no opening question in ' + qopen);

  /* ================================================================ §1 */
  console.log('— §1 · w-onehot —');
  await show('#w-onehot', 1400);
  let s = await st('w-onehot');
  test(s.m === 0 && Object.values(s.cos).every(x => near(x, 0)) && Object.values(s.dist).every(x => near(x, Math.SQRT2)), 'one-hot: every pair cos 0, distance 1.414');
  await lab3OK('w-onehot', '#oh-3d', 'one-hot labels', 6);
  const settleM = async (want) => { for (let i = 0; i < 40; i++) { s = await st('w-onehot'); if (s.m === want) break; await page.waitForTimeout(250); } return s; };
  await click('#oh-mode [data-t="meaning"]', 300); s = await settleM(1);
  test(s.m === 1 && near(s.cos['chai·coffee'], .9131, 5e-4) && s.cos['chai·cricket'] < .4 && s.cos['coffee·cricket'] < .4, 'meaning tab: chai·coffee lean together (cos ' + f3(s.cos['chai·coffee']) + ' → Try "0.91"), cricket apart', 'onehot meaning ' + JSON.stringify(s.cos));
  await lab3OK('w-onehot', '#oh-3d', 'meaning labels', 6);
  await click('#oh-play', 200); s = await st('w-onehot'); const mMid = s.m; s = await settleM(1);
  test(mMid < 1 && s.m === 1, '▶ let meaning pull: starts from one-hot and ends in meaning land', 'oh-play ' + mMid + ' → ' + s.m);
  await click('#oh-mode [data-t="onehot"]', 300); s = await settleM(0); test(s.m === 0, 'back to one-hot');
  await nanOK('#w-onehot', 'w-onehot');

  /* ================================================================ §2 */
  console.log('— §2 · w-bigram —');
  await show('#w-bigram');
  s = await st('w-bigram');
  test(s.mem === 1 && s.prev === 'drink' && near(s.row.chai, 2 / 3) && near(s.row.coffee, 1 / 3) && near(s.rowSum, 1), 'after "drink": chai 2/3, coffee 1/3, the row adds up to 1', 'bigram ' + JSON.stringify(s.row));
  const barOK = s.bars.filter(b => b.p > 0).every(b => near(b.h / s.bars.find(x => x.w === 'chai').h, b.p / (2 / 3), 1e-3));
  test(barOK, 'bar heights are proportional to the chances');
  test(s.rows.includes('<s>') && s.next.includes('</s>') && s.counts['<s>'].I === 4 && s.counts.chai['</s>'] === 2, 'the table has the <s> row and the </s> column (<s> → I ×4, chai → </s> ×2)');
  await call('w-bigram', 'score', 'I drink chai'); s = await st('w-bigram');
  test(near(s.product, .5) && s.chain.map(o => o.p).every((p, i) => near(p, [1, .75, 2 / 3, 1][i])) && s.chain.length === 4 && s.chain[3].w === '</s>', '"<s> I drink chai </s>" = 1 · ¾ · ⅔ · 1 = 0.5 (four guesses, the last one is </s>)', 'chain ' + JSON.stringify(s.chain));
  await call('w-bigram', 'score', 'I drink cricket'); s = await st('w-bigram'); test(s.product === 0, '"I drink cricket" scores 0 — one unseen pair');
  await call('w-bigram', 'score', 'I play cricket'); s = await st('w-bigram'); test(near(s.product, .25), 'c3: "<s> I play cricket </s>" = 1/4');
  await call('w-bigram', 'score', 'I drink chai');
  await click('#bg-play', 950); s = await st('w-bigram'); const lit1 = s.pathCells;
  test(s.step >= 0 && s.step <= 1 && lit1 >= 1, '▶ play the chain: one lit cell at a time (step ' + s.step + ', ' + lit1 + ' lit)');
  await page.waitForTimeout(3900); s = await st('w-bigram'); test(s.step === -1 && s.pathCells === 4 && near(s.product, .5), 'the chain finishes: 4 cells lit, product 0.5', 'play end ' + JSON.stringify([s.step, s.pathCells, s.product]));
  await click('#bg-add', 500); s = await st('w-bigram');
  test(near(s.row.chai, .5) && near(s.row.coffee, .5), 'Try: + "we drink coffee" → "drink" splits ½ · ½', 'add ' + JSON.stringify(s.row));
  await call('w-bigram', 'setMem', 2); await page.waitForTimeout(300); s = await st('w-bigram');
  test(s.mem === 2 && s.prev === 'I drink' && near(s.row.chai, 2 / 3) && near(s.row.coffee, 1 / 3), 'trigram: "I drink" still prefers chai (⅔)', 'trigram ' + JSON.stringify([s.prev, s.row]));
  await call('w-bigram', 'pick', 'we drink'); s = await st('w-bigram'); test(near(s.row.coffee, 1), 'trigram: "we drink" is sure of coffee');
  await call('w-bigram', 'setMem', 1); await page.waitForTimeout(200); await click('#bg-reset', 400);
  const gens = []; for (let i = 0; i < 6; i++) gens.push(await call('w-bigram', 'generate', 11 + i));
  test(gens.every(g => /^<s> I (drink (chai|coffee)|play cricket) <\/s>$/.test(g)), '✎ writes sentences of the corpus kind: ' + gens.slice(0, 3).join(' | '), 'generate ' + gens.join(' | '));
  await svgOK('#bg-bars', 'bigram bars');
  await nanOK('#w-bigram', 'w-bigram');

  /* ================================================================ §3 */
  console.log('— §3 · w-smooth —');
  await show('#w-smooth');
  s = await st('w-smooth'); test(s.mode === 'mle' && near(s.p.chai, 2 / 3) && s.p.cricket === 0 && near(s.sum, 1), 'count ÷ total: chai 0.667, cricket 0 (zeros!)');
  await call('w-smooth', 'set', { mode: 'add1', t: 0 }); s = await st('w-smooth');
  test(s.V === 7 && near(s.p.chai, .3) && near(s.p.cricket, .1) && near(s.p.coffee, .2) && near(s.sum, 1), 'add-one, V = 7: chai 0.3, coffee 0.2, cricket 0.1, row sums to 1', 'add1 ' + JSON.stringify(s.p));
  await call('w-smooth', 'set', { t: 1 }); s = await st('w-smooth');
  test(s.V === 50000 && near(s.p.chai, 3 / 50003, 1e-9) && near(s.sum, 1) && s.moved > .999, 'Try: V = 50 000 → chai 3/50 003 ≈ 0.00006 and the meter floods (moved ' + f3(s.moved) + ')', 'add1 big ' + JSON.stringify([s.V, s.p.chai, s.sum]));
  await svgOK('#sm-svg', 'smoothing at V = 50 000');
  await call('w-smooth', 'set', { mode: 'addk', lk: -2 }); s = await st('w-smooth');
  test(near(s.k, .01) && near(s.p.chai, 2.01 / (3 + .01 * 50000), 1e-9) && near(s.sum, 1), 'add-k, k = 0.01: rows still add up to 1 (chai ' + s.p.chai.toFixed(4) + ')');
  await call('w-smooth', 'set', { mode: 'interp', lam: .8 }); s = await st('w-smooth');
  test(near(s.p.chai, .558333, 1e-6) && near(s.p.cricket, .0125) && near(s.sum, 1) && Object.values(s.p).every(x => x > 0), 'Try: interpolation λ = 0.8: chai 0.558, cricket 0.0125, nothing is zero, sum 1', 'interp ' + JSON.stringify(s.p));
  const bh = s.bars.filter(b => b.v > 0), chaiB = bh.find(b => b.w === 'chai');
  test(bh.every(b => near(b.h / chaiB.h, b.v / chaiB.v, 2e-3)), 'bar heights proportional to the chances');
  await call('w-smooth', 'set', { mode: 'interp', lam: 0 }); s = await st('w-smooth'); test(near(s.p.chai, .125), 'c7: λ = 0 → chai 2/16 = 0.125');
  await svgOK('#sm-svg', 'smoothing (interpolation)');
  await call('w-smooth', 'set', { mode: 'mle', t: 0, lk: -1, lam: .8 });
  await nanOK('#w-smooth', 'w-smooth');

  /* ================================================================ §4 */
  console.log('— §4 · w-perplexity —');
  await show('#w-perplexity');
  s = await st('w-perplexity'); test(near(s.PP, 3.363586) && near(s.H, 1.75) && s.slices === 4, '0.5 · 0.25 · 0.5 · 0.125: 1.75 bits, perplexity 3.364, spinner of 4 slices (the last partial)', 'pp ' + JSON.stringify([s.PP, s.H, s.slices]));
  await click('#pp-ours'); s = await st('w-perplexity'); test(near(s.PP, Math.pow(2, .25)) && s.slices === 2, 'our sentence (1, ¾, ⅔, 1): 1.189', 'ours ' + s.PP);
  await click('#pp-six'); s = await st('w-perplexity'); test(near(s.PP, 6) && s.slices === 6, 'no idea: perplexity 6, six equal slices');
  await click('#pp-perfect'); s = await st('w-perplexity'); test(near(s.PP, 1), 'perfect: 1');
  await click('#pp-miss'); s = await st('w-perplexity'); test(near(s.PP, Math.pow(2, (1 + 2 + 1 + Math.log2(100)) / 4)) && s.PP > 6, 'one bad miss (0.01) drags it to ' + f3(s.PP));
  await svgOK('#pp-svg', 'perplexity');
  await setRange('pp-p1', .9); s = await st('w-perplexity'); test(near(s.p[0], .9), 'the sliders drive the numbers');
  await click('#pp-spec'); await nanOK('#w-perplexity', 'w-perplexity');

  /* ================================================================ §5 */
  console.log('— §5 · w-cooc —');
  await show('#w-cooc');
  s = await st('w-cooc');
  const CO4 = [[5, 4, 0, 1], [4, 5, 0, 0], [0, 0, 5, 4], [0, 1, 4, 5]];
  test(JSON.stringify(s.M) === JSON.stringify(CO4) && near(s.cos, 40 / Math.sqrt(1722)), 'window 2: exactly the hand table; cos(chai, coffee) = 0.964');
  test(near(s.geo.th, Math.acos(s.cos), 1e-9) && near(Math.atan2(s.geo.oy - s.geo.tipB[1], s.geo.tipB[0] - s.geo.ox), s.geo.th, 1e-6) && near(s.geo.la / s.geo.lb, s.geo.na / s.geo.nb, 1e-9), 'the drawn angle is acos(cos), arrow lengths follow the row lengths');
  await svgOK('#co-svg', 'company angle');
  await setRange('co-win', 1); s = await st('w-cooc'); test(s.M[0][0] === 0 && dot(s.M[0], s.M[2]) === 0, 'Try: window 1 — chai loses "drink", chai·cricket = 0', 'win1 ' + JSON.stringify(s.M));
  await setRange('co-win', 2); await call('w-cooc', 'setPair', 'cricket', 'football'); s = await st('w-cooc'); test(near(s.cos, 40 / Math.sqrt(1722)), 'cricket · football: 0.964');
  await call('w-cooc', 'setPair', 'chai', 'cricket'); s = await st('w-cooc'); test(near(s.cos, 4 / Math.sqrt(1722)), 'chai · cricket: 0.096');
  await svgOK('#co-svg', 'company angle, wide angle');
  await call('w-cooc', 'setPair', 'coffee', 'football'); s = await st('w-cooc'); test(near(s.cos, 5 / Math.sqrt(1722)), 'c11: coffee · football 0.120');
  await click('#co-pick [data-w="chai"]'); await click('#co-pick [data-w="coffee"]'); s = await st('w-cooc'); test(s.pair.join() === 'chai,coffee', 'chips pick the pair');
  await call('w-cooc', 'setTab', 'wd'); await page.waitForTimeout(300); s = await st('w-cooc');
  const nb = Object.fromEntries(s.doc.nb.map(o => [o.w, o.c])), td = Object.fromEntries(s.doc.td.map(o => [o.w, o.c]));
  test(s.tab === 'wd' && near(nb.coffee, .972, 5e-4) && Math.max(...Object.values(nb)) === nb.coffee && near(td.kettle, .8, 5e-4) && td.coffee === 0 && Math.max(...Object.values(td)) === td.kettle,
    'Try: word × document — by neighbours coffee (0.972), by documents kettle (0.8), coffee 0', 'doc ' + JSON.stringify([nb, td]));
  test(s.doc.bars.every(b => near(b.width / s.doc.bars.filter(x => x.set === b.set && x.c > 0)[0].width, b.c / s.doc.bars.filter(x => x.set === b.set && x.c > 0)[0].c, 2e-3) || b.c <= 0), 'similarity bars proportional to the cosines');
  await svgOK('#cd-svg', 'who is most like chai');
  await call('w-cooc', 'setTab', 'ww'); await nanOK('#w-cooc', 'w-cooc');

  /* ================================================================ §6 */
  console.log('— §6 · w-pmi —');
  await show('#w-pmi');
  const shownAt = async k => { await call('w-pmi', 'step', k); return (await st('w-pmi')).shown; };
  let sh = await shownAt(1); test(near(sh[0], 5) && near(sh[1], 10) && near(sh[2], 5), '② if strangers: chai–hot 5, chai–the 10, chai–match 5', 'E ' + sh);
  sh = await shownAt(2); test(near(sh[0], 1.6) && near(sh[1], 1) && near(sh[2], .4), '③ ratio: 1.6, 1, 0.4');
  sh = await shownAt(3); test(near(sh[0], Math.log2(1.6)) && near(sh[1], 0) && near(sh[2], Math.log2(.4)) && near(sh[3], Math.log2(.4)), '④ PMI: chai–hot 0.678, chai–the 0, chai–match −1.322, cricket–hot −1.322');
  sh = await shownAt(4); test(near(sh[0], Math.log2(1.6)) && near(sh[2], 0) && sh.every(v => +v >= 0), '⑤ PPMI: only the positive part is kept; the "the" column is 0');
  await call('w-pmi', 'setCount', 0, 1, 14); s = await st('w-pmi'); test(s.P[0][1] > 0 && near(s.P[0][1], Math.log2(14 * 44 / (24 * 24))), 'Try: chai–the 10 → 14 turns PMI(chai, the) positive (' + f3(s.P[0][1]) + ')');
  await call('w-pmi', 'reset'); s = await st('w-pmi'); test(JSON.stringify(s.M) === '[[8,10,2],[2,10,8]]', 'reset counts');
  await call('w-pmi', 'setCount', 0, 2, 0); s = await st('w-pmi'); test(s.P[0][2] === null || s.P[0][2] === -Infinity || !isFinite(s.P[0][2]), 'a zero count gives PMI −∞ (shown as −∞, PPMI 0) without breaking the table');
  await call('w-pmi', 'reset'); await call('w-pmi', 'step', 0);
  await call('w-pmi', 'setTab', 'tfidf'); await page.waitForTimeout(250); s = await st('w-pmi');
  test(near(s.tfidf.idf[0], 0) && near(s.tfidf.idf[1], Math.log10(1.5)) && near(s.tfidf.idf[2], Math.log10(3)) && near(s.tfidf.W[1][0], 2 * Math.log10(1.5)) && near(s.tfidf.W[3][1], 3 * Math.log10(1.5)) && s.tfidf.W[0].every(x => x === 0),
    'TF-IDF: idf 0 / 0.176 / 0.477; chai in D1 0.352, cricket in D2 0.528, "the" 0 everywhere');
  await call('w-pmi', 'setTab', 'pmi'); await nanOK('#w-pmi', 'w-pmi');

  /* ================================================================ §7 */
  console.log('— §7 · w-svd-words, w-friends —');
  await show('#w-svd-words', 1400);
  await call('w-svd-words', 'set', { k: 1, mode: 'raw' }); s = await st('w-svd-words');
  test(s.target.every(p => near(p[0], s.target[0][0], 1e-9)), 'Try: raw, k = 1 — every word points the same way');
  await call('w-svd-words', 'set', { k: 3 }); s = await st('w-svd-words');
  test(near(s.cos.chai_cricket, .5247, 5e-4) && s.bars.filter((b, i) => i < 3).length === 3, 'raw, k = 3: cos(chai, cricket) = 0.525 (the loud "the" column)', 'raw ' + s.cos.chai_cricket);
  await page.waitForTimeout(700); await lab3OK('w-svd-words', '#sv-3d', 'svd raw labels', 3);
  await call('w-svd-words', 'set', { mode: 'ppmi' }); s = await st('w-svd-words');
  test(Math.abs(s.cos.chai_cricket) < .01 && s.cos.chai_coffee > .9 && s.cos.train_bus > .9, 'PPMI, k = 3: cos(chai, cricket) ≈ 0 (' + s.cos.chai_cricket.toFixed(4) + '), chai·coffee and train·bus high');
  const S2 = s.S.reduce((a, x) => a + x * x, 0); test(near(s.energy, (s.S[0] ** 2 + s.S[1] ** 2 + s.S[2] ** 2) / S2, 1e-9) && s.target.every(p => near(nrm(p), 2.2, 1e-9)), 'energy readout = Σσ² kept ÷ Σσ²; every dot drawn at the same radius (direction only)');
  await page.waitForTimeout(700); await lab3OK('w-svd-words', '#sv-3d', 'svd PPMI labels', 3);
  await call('w-svd-words', 'set', { k: 2 }); await page.waitForTimeout(500); await lab3OK('w-svd-words', '#sv-3d', 'svd PPMI k = 2 labels', 3);
  await click('#sv-play', 300); s = await st('w-svd-words'); test(s.k === 1, '▶ squeeze starts at k = 1'); await page.waitForTimeout(4400); s = await st('w-svd-words'); test(s.k === 3, '… and ends at k = 3');
  const hov = await page.evaluate(async () => { const cv = document.querySelector('#sv-3d canvas'); const R = cv.getBoundingClientRect(); const ctxOK = !!cv; return ctxOK; });
  test(hov, 'svd stage has a canvas for the hover tips');
  await call('w-svd-words', 'set', { k: 3, mode: 'raw' }); await nanOK('#w-svd-words', 'w-svd-words');
  await show('#w-friends');
  const fr = {};
  for (const k of [2, 3, 4]) { await call('w-friends', 'set', k); fr[k] = await st('w-friends'); }
  test(near(fr[2].cos.chai_tea, 1) && near(fr[3].cos.chai_tea, 0) && near(fr[4].cos.chai_tea, 0), 'Try: chai·tea cosine 1 at k = 2, 0 at k = 3 and 4');
  test(near(fr[2].rebuilt[0][2], 2) && near(fr[2].rebuilt[0][3], 2) && fr[2].filled === 6 && fr[3].filled === 2 && fr[4].filled === 0, 'k = 2 fills chai–cup and chai–kettle with 2 (6 gold blanks); k = 3 keeps 2, k = 4 none', 'filled ' + [fr[2].filled, fr[3].filled, fr[4].filled]);
  test(near(fr[3].cos.cricket_football, 1) && fr[4].cos.cricket_football < .99, 'k = 4 only separates cricket from football');
  test(near(fr[2].energy, 116 / 164) && near(fr[3].energy, 148 / 164), 'energies 70.7% and 90.2%');
  const g3 = fr[3].geo, ang3 = Math.abs(Math.atan2(g3.oy - g3.tips.chai[1], g3.tips.chai[0] - g3.ox) - Math.atan2(g3.oy - g3.tips.tea[1], g3.tips.tea[0] - g3.ox));
  test(near(ang3, Math.PI / 2, 1e-6) && near(g3.tips.coffee[1], g3.oy, 1e-9), 'k = 3 plane: chai and tea drawn at exactly 90°, coffee on direction 1');
  await call('w-friends', 'set', 3); await svgOK('#fr-svg', 'friends plane k = 3'); await call('w-friends', 'set', 2); await svgOK('#fr-svg', 'friends plane k = 2');
  await nanOK('#w-friends', 'w-friends');

  /* ================================================================ §8–§11 */
  console.log('— §8 · the network figure —');
  await show('#fig-net');
  s = await page.evaluate(() => window.U16['fig-net'].state());
  const toyP = softmax([0, 1, 2, 1, -2]);
  test(JSON.stringify(s.h) === '[1,1]' && s.p.every((x, i) => near(x, toyP[i], 1e-9)) && s.bars.every((b, i) => near(b.w, Math.max(1.5, 120 * toyP[i]), 1e-6)), 'figure: h = v(chai) = (1, 1), chances 0.072 · 0.195 · 0.529 · 0.195 · 0.010, bars to scale');
  await svgOK('#nf-svg', 'network figure');
  console.log('— §9–§11 · the word2vec widgets (16-w2v) —');
  const w2 = await page.evaluate(() => ['w-window', 'w-cbow', 'w-skipgram', 'w-lab'].map(id => { const w = document.getElementById(id); return id + ':' + (w ? w.querySelectorAll('.try').length : 0) + ':' + (w ? w.closest('section').id : ''); }));
  test(w2.join() === 'w-window:1:s8,w-cbow:1:s9,w-skipgram:1:s10,w-lab:1:s11', 'w-window in §8, w-cbow in §9, w-skipgram in §10, w-lab in §11 (checked in depth by verify-u16-w2v.js)', 'w2v placement ' + w2);

  /* ================================================================ §12 */
  console.log('— §12 · w-sgstep, w-cost —');
  await show('#w-sgstep');
  await call('w-sgstep', 'reset'); await call('w-sgstep', 'setEta', 1); s = await st('w-sgstep');
  test(near(s.loss, .948154) && s.steps === 0, 'start: loss 0.948');
  await svgOK('#sg-svg', 'sgstep at the start');
  await call('w-sgstep', 'stepNow'); s = await st('w-sgstep');
  test(near(s.loss, .504632) && near(s.S.v[0], 1.3775, 1e-4) && near(s.S.v[1], -.1888, 1e-4) && near(s.S.up[0], .8775, 1e-4) && near(s.S.un[0], -.8775, 1e-4), 'one step: loss 0.505, v = (1.378, −0.189), u_hot (0.878, 0.5), u_football (−0.878, 1)', 'step ' + JSON.stringify(s.S));
  test(near(Math.hypot(s.geo.tips.v[0] - s.geo.ox, s.geo.tips.v[1] - s.geo.oy) / s.geo.sc, nrm(s.S.v), 1e-6), 'arrows are drawn to scale');
  const stepsTo = async (eta) => { await call('w-sgstep', 'reset'); await call('w-sgstep', 'setEta', eta); let n = 0; while (n < 60) { await call('w-sgstep', 'stepNow'); n++; if ((await st('w-sgstep')).loss < .1) break; } return n; };
  const n1 = await stepsTo(1), n5 = await stepsTo(.5);
  test(n1 === 4 && n5 === 8, 'Try: loss below 0.1 after 4 steps at η = 1 and 8 at η = 0.5', 'steps ' + n1 + ' / ' + n5);
  await call('w-sgstep', 'reset'); await call('w-sgstep', 'setEta', 1); for (let i = 0; i < 10; i++) await call('w-sgstep', 'stepNow'); s = await st('w-sgstep');
  test(cos(s.S.up, s.S.v) > .93 && cos(s.S.un, s.S.v) < -.9 && s.losses.every((l, i) => !i || l < s.losses[i - 1]), 'Try: hot swings toward chai (cos ' + f3(cos(s.S.up, s.S.v)) + '), football to the other side (' + f3(cos(s.S.un, s.S.v)) + '), the loss falls every step');
  await svgOK('#sg-svg', 'sgstep after 10 steps');
  await call('w-sgstep', 'reset'); await click('#sg-step', 700); s = await st('w-sgstep'); test(s.steps === 1 && near(s.loss, .504632), 'the "one step" button animates one step');
  await click('#sg-run', 200); for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); s = await st('w-sgstep'); if (s.steps >= 11) break; } test(s.steps === 11 && s.loss < .02, '▶ ten steps: 11 steps in all, loss ' + s.loss.toFixed(4), 'run ' + s.steps);
  await click('#sg-reset'); s = await st('w-sgstep'); test(s.steps === 0, 'reset');
  await nanOK('#w-sgstep', 'w-sgstep');
  await show('#w-cost');
  s = await st('w-cost'); test(s.V === 50000 && s.k === 5 && near(s.ratio, 50000 / 6, 1e-6) && s.depth === 16, '50 000 words, k = 5: 8 333× less work; tree 16 deep', 'cost ' + JSON.stringify([s.V, s.k, s.ratio]));
  const lgW = b => Math.log10(b.v); const bars0 = s.bars;
  test(near(bars0[0].w / bars0[2].w, lgW(bars0[0]) / lgW(bars0[2]), 2e-3), 'bars are on a true log scale');
  await svgOK('#cs-svg', 'cost fields');
  await call('w-cost', 'setV', 5); await call('w-cost', 'setK', 10); s = await st('w-cost'); test(s.V === 100000 && near(s.ratio, 100000 / 11, 1e-6), 'c29: 100 000 words, k = 10 → 9 091×');
  await call('w-cost', 'setK', 5); await call('w-cost', 'setV', 6); s = await st('w-cost');
  test(s.V === 1000000 && s.bars[1].v === 6 && s.depth === 20, 'Try: a million words — softmax 1 000 000, negative sampling still 6, the tree only 20');
  await svgOK('#cs-svg', 'cost fields at a million');
  await call('w-cost', 'setV', 4.699); s = await st('w-cost'); test(s.V === 50000, 'the slider snaps back to 50 000');
  await click('#cs-play', 2600);
  await call('w-cost', 'setTab', 'tree'); await page.waitForTimeout(250); s = await st('w-cost');
  const hsExp = [sig(1) * sig(-.5), sig(1) * sig(.5), sig(-1) * sig(-1), sig(-1) * sig(1)];
  test(s.leaves.map(l => l.w).join() === 'chai,coffee,cricket,football' && s.leaves.every((l, i) => near(l.p, hsExp[i], 1e-9)) && near(s.leaves.reduce((a, l) => a + l.p, 0), 1, 1e-12), 'tree: chai 0.2760, coffee 0.4551, cricket 0.0723, football 0.1966 — add up to 1');
  for (let i = 0; i < 4; i++) { await call('w-cost', 'pickLeaf', i); }
  await page.evaluate(() => document.querySelector('#ht-svg g.leaf[data-i="1"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); s = await st('w-cost'); test(s.leaf === 1, 'clicking a leaf lights its path');
  await svgOK('#ht-svg', 'tree');
  await call('w-cost', 'setTab', 'sub'); await page.waitForTimeout(250); s = await st('w-cost');
  test(s.sub.every(o => near(o.p, Math.min(1, Math.sqrt(1e-5 / { the: .05, kettle: 2e-5, is: .01, on: .008, stove: 1e-5, and: .03, chai: 4e-5, kadak: 5e-6, hot: 1.2e-4 }[o.w])), 1e-9)), 'subsampling: every bar is √(t/f) (kadak and stove 1, chai 0.5, "the" 0.014)');
  const draws = await call('w-cost', 'sampleKeep', 400), W13 = ['the', 'kettle', 'is', 'on', 'the', 'stove', 'and', 'the', 'chai', 'is', 'kadak', 'and', 'hot'];
  const rate = w => { let k = 0, n = 0; draws.forEach(d => d.forEach((x, i) => { if (W13[i] === w) { n++; k += x; } })); return k / n; };
  test(rate('the') < .04 && rate('and') < .06 && rate('kadak') === 1 && rate('stove') === 1 && Math.abs(rate('chai') - .5) < .08, 'Try: over 400 draws "the" survives ' + (100 * rate('the')).toFixed(1) + '%, "and" ' + (100 * rate('and')).toFixed(1) + '%, rare words always, chai about half (' + (100 * rate('chai')).toFixed(0) + '%)');
  await click('#ss-draw', 200); s = await st('w-cost'); test(s.draw === 2, '↻ draw again');
  await svgOK('#ss-svg', 'subsampling bars');
  await call('w-cost', 'setTab', 'ns'); await nanOK('#w-cost', 'w-cost');

  /* ================================================================ §13 */
  console.log('— §13 · w-w2v, w-ratio —');
  await show('#w-w2v', 1400);
  await call('w-w2v', 'setRun', false); await call('w-w2v', 'reseed', 118); s = await st('w-w2v');
  test(s.together === 0 && s.pairs === 0 && s.cc < -.8, 'default start (seed 118): chai and coffee never share a sentence and start almost opposite (cos ' + f3(s.cc) + ')');
  await lab3OK('w-w2v', '#wv-3d', 'w2v labels at the start', 3);
  await call('w-w2v', 'train', 400); s = await st('w-w2v');
  const loss0 = s.hist.length > 2 ? null : null;
  test(s.pairs >= 120000 && s.cc > .99 && s.cw < .6 && s.hist[s.hist.length - 1].cc > s.hist[0].cc, 'Try: trained to the end — chai·coffee ' + f3(s.cc) + ' (above 0.99), chai·wicket stays apart (' + f3(s.cw) + ')', 'w2v ' + JSON.stringify([s.pairs, s.cc, s.cw]));
  await page.waitForTimeout(500); await lab3OK('w-w2v', '#wv-3d', 'w2v labels after training', 3);
  await svgOK('#wv-chart', 'w2v chart');
  let seed = 118; const ends = [];
  for (let i = 0; i < 4; i++) { seed = (seed * 48271) % 2147483647; await call('w-w2v', 'reseed', seed); await call('w-w2v', 'train', 400); const t = await st('w-w2v'); ends.push([t.cc, t.cw]); }
  test(ends.every(([a, b]) => a > .99 && b < .7), 'Try: the next four "new start"s also end together: ' + ends.map(e => f3(e[0])).join(', ') + ' (chai·wicket ' + ends.map(e => f3(e[1])).join(', ') + ')', 'new starts ' + JSON.stringify(ends));
  for (const k of [1, 10]) { await setRange('wv-neg', k); await call('w-w2v', 'reseed', 118); await call('w-w2v', 'train', 400); const t = await st('w-w2v'); test(t.neg === k && isFinite(t.cc) && isFinite(t.loss) && t.cc > .9, `Try: ${k} negative${k > 1 ? 's' : ''} per pair also brings chai and coffee together (cos ${f3(t.cc)})`, 'neg ' + k + ' ' + JSON.stringify([t.cc, t.loss])); }
  await setRange('wv-neg', 5); await call('w-w2v', 'reseed', 118);
  await click('#wv-play', 300); let live = 0; for (let i = 0; i < 20 && !live; i++) { await page.waitForTimeout(250); live = (await st('w-w2v')).pairs; }
  test(live > 0 && (await page.locator('#wv-play').innerText()).includes('pause'), '▶ train runs live (' + live + ' pairs) and the button offers ❚❚ pause', 'live training ' + live); await click('#wv-play', 200);
  await click('#wv-seed', 200); s = await st('w-w2v'); test(s.pairs === 0 && s.seed !== 118, 'new start resets the training with a new seed'); await call('w-w2v', 'reseed', 118);
  await nanOK('#w-w2v', 'w-w2v');
  await show('#w-ratio');
  const RAT = { hot: 20, cold: .05, drink: 1, cricket: 1 };
  for (const w of ['hot', 'cold', 'drink', 'cricket']) { await call('w-ratio', 'pick', w); s = await st('w-ratio');
    test(near(s.ratio, RAT[w], 1e-12) && near(s.dot, Math.log(RAT[w]), 1e-9) && near(s.bars[0].h / (s.bars[0].h + s.bars[1].h), s.pc / (s.pc + s.pl), 1e-9), `${w}: ratio ${RAT[w]}, (chai − lassi)·${w} = ln ratio = ${f3(Math.log(RAT[w]))}, bars to scale`);
    await svgOK('#gr-bars', 'ratio bars (' + w + ')'); await svgOK('#gr-vec', 'GloVe vectors (' + w + ')'); }
  await call('w-ratio', 'pick', 'hot'); const mh = (await st('w-ratio')).mark; await call('w-ratio', 'pick', 'drink'); const md = (await st('w-ratio')).mark; await call('w-ratio', 'pick', 'cold'); const mc = (await st('w-ratio')).mark;
  test(near(mh - md, md - mc, 1e-6) && mh < md, 'the ratio marker sits on a true log scale (20 and 0.05 equally far from 1)');
  await call('w-ratio', 'pick', 'hot'); await nanOK('#w-ratio', 'w-ratio');

  /* ================================================================ §14 */
  console.log('— §14 · w-lookup, w-nlm —');
  await show('#w-lookup');
  let lkOK = true; for (let i = 0; i < 5; i++) { await call('w-lookup', 'pick', i); s = await st('w-lookup'); if (!s.product.every((x, j) => near(x, s.row[j], 1e-12)) || norm(s.shown).replace(/\s/g, '') !== s.row.map(v => String(v)).join('')) lkOK = false; }
  test(lkOK, 'every word: one-hot × table = its row, and the result shows that row');
  await click('#lk-words [data-w="bat"]'); test(/\(0\.1, 0\.9, 0\.2\)/.test(norm(await text('#lk-read'))), 'clicking "bat" picks row 3 = (0.1, 0.9, 0.2)');
  await click('#lk-play', 2200); await nanOK('#w-lookup', 'w-lookup');
  await show('#w-nlm');
  s = await st('w-nlm'); let q = s.q; const V = ['I', 'we', 'drink', 'play', 'hot', 'chai', 'coffee', 'cricket', 'football', '.'];
  test(s.pair === 'drink hot' && Math.abs(q[5] - q[6]) < .02 && [...q].sort((a, b) => b - a).slice(0, 2).includes(q[5]) && [...q].sort((a, b) => b - a).slice(0, 2).includes(q[6]), 'Try: "drink hot": chai ' + f3(q[5]) + ' and coffee ' + f3(q[6]) + ' share the top');
  test(near(q.reduce((a, b) => a + b, 0), 1, 1e-9) && s.bars.every((b, i) => near(b.q, q[i], 1e-6)), 'the ten chances add up to 1 and the bars show them');
  await call('w-nlm', 'pick', 'I', 'play'); s = await st('w-nlm'); q = s.q;
  test(near(q[8], .256, 6e-4) && q.indexOf(Math.max(...q)) === 7, 'Try: "I play": cricket first, football 0.256 though never seen');
  await svgOK('#nl-svg', 'nlm relay'); await svgOK('#nl-map', 'nlm map');
  await call('w-nlm', 'pick', 'we', 'play'); s = await st('w-nlm'); test(near(s.q[8], .258, 6e-4), '"we play": football 0.258');
  await click('#nl-w1 [data-w="drink"]'); await click('#nl-w2 [data-w="hot"]'); s = await st('w-nlm'); test(s.pair === 'drink hot', 'the chips pick the two words');
  await nanOK('#w-nlm', 'w-nlm');

  /* ================================================================ §15 */
  console.log('— §15 · w-cosine, w-para, w-analogy —');
  await show('#w-cosine');
  await click('#cz-shop'); s = await st('w-cosine');
  test(near(s.cos, 1) && near(s.dist, Math.sqrt(5)) && near(s.dot, 10), 'Try: the two shoppers — dot 10, cos 1, distance 2.236');
  await svgOK('#cz-svg', 'cosine (shoppers)');
  await call('w-cosine', 'set', [2, 1], [4.8, 2.4]); s = await st('w-cosine'); test(near(s.cos, 1) && s.dist > Math.sqrt(5), 'b further along the same line: cos stays 1, the distance grows (' + f3(s.dist) + ')');
  await click('#cz-right'); s = await st('w-cosine'); test(near(s.cos, 0), 'right angle: cos 0');
  await call('w-cosine', 'set', [2, 0], [1, Math.sqrt(3)]); await call('w-cosine', 'setNorm', true); s = await st('w-cosine');
  test(near(nrm(s.a), 1) && near(nrm(s.b), 1) && near(s.dist, 1) && near(s.dist, Math.sqrt(2 - 2 * s.cos)), 'normalise at 60°: both length 1, distance √(2 − 2·0.5) = 1');
  await svgOK('#cz-svg', 'cosine (normalised)');
  await call('w-cosine', 'setNorm', false); await click('#cz-shop'); await nanOK('#w-cosine', 'w-cosine');
  await show('#w-para');
  await call('w-para', 'reset'); s = await st('w-para');
  test(s.best === 'queen' && near(s.D[0], 3) && near(s.D[1], -2) && near(s.ranked[0].c, 1), 'king − man + woman = (3, −2): the corner lands on queen (cos 1)');
  const pg = s.poly; test(pg.length === 4 && near(pg[0][0] - pg[1][0], pg[3][0] - pg[2][0], 1e-6) && near(pg[0][1] - pg[1][1], pg[3][1] - pg[2][1], 1e-6), 'the drawn shape is a true parallelogram');
  await svgOK('#pa2-svg', 'parallelogram');
  await call('w-para', 'set', 'woman', [1.3, -2.3]); s = await st('w-para'); test(s.best === 'queen', 'Try: drag woman a little — still queen');
  await call('w-para', 'setInc', true); await call('w-para', 'set', 'man', [2.9, 2]); s = await st('w-para'); test(['woman', 'king', 'man'].includes(s.best), 'Try: with the inputs allowed and man near king, an input wins (' + s.best + ')');
  await call('w-para', 'setInc', false); await call('w-para', 'reset'); await nanOK('#w-para', 'w-para');
  await show('#w-analogy', 1400);
  const want = [['king', 'man', 'woman', 'queen'], ['prince', 'boy', 'girl', 'princess'], ['Delhi', 'India', 'Japan', 'Tokyo'], ['puppy', 'dog', 'cat', 'kitten'], ['king', 'man', 'boy', 'prince'], ['Paris', 'France', 'Italy', 'Rome']];
  let allok = true; for (const [a, b, cc, w] of want) { await click(`#ex-pre [data-q="${a},${b},${cc}"]`, 900); s = await st('w-analogy'); if (s.answer !== w) { allok = false; fail(`explorer ${a} − ${b} + ${cc} → ${s.answer}`); }
    await lab3OK('w-analogy', '#ex-3d', `explorer labels (${a} − ${b} + ${cc})`, 4, T => T.includes(w + ' ✓')); }
  test(allok, 'explorer presets: queen · princess · Tokyo · kitten · prince · Rome');
  await page.selectOption('#ex-a', 'actor'); await page.selectOption('#ex-b', 'man'); await page.selectOption('#ex-c', 'woman'); await page.waitForTimeout(500);
  s = await st('w-analogy'); test(s.answer === 'actress', 'typed query: actor − man + woman ≈ actress');
  await click('#ex-dirs [data-d="female"]', 700); s = await st('w-analogy'); test(s.dirs.includes('female'), 'Try: the female arrows switch on');
  await lab3OK('w-analogy', '#ex-3d', 'explorer labels with arrows', 4); await click('#ex-dirs [data-d="female"]');
  await call('w-analogy', 'focus', 'chai'); await page.waitForTimeout(900); s = await st('w-analogy');
  test(s.focus === 'chai' && /chai/.test(await text('#ex-read')), 'Try: find "chai" flies to it and lists its neighbours');
  await lab3OK('w-analogy', '#ex-3d', 'explorer labels with a focus word', 4);
  await click('#ex-inc', 400); s = await st('w-analogy'); test(s.nn.some(o => [s.a, s.b, s.c].includes(o.w)), 'include A, B, C: the inputs enter the ranking'); await click('#ex-inc', 300);
  await click('#ex-names', 700); s = await st('w-analogy'); test(s.names === true, 'name every dot switches on'); await click('#ex-names', 400);
  await click('#ex-pre [data-q="king,man,woman"]', 700); await nanOK('#w-analogy', 'w-analogy');

  /* ================================================================ §16–§17 */
  console.log('— §16 · w-polysemy, w-pieces · §17 cards —');
  await show('#w-polysemy', 1400);
  const CR = ['ball', 'wicket', 'over', 'six', 'run', 'bowler', 'batsman', 'stumps'], AN = ['dog', 'puppy', 'cat', 'kitten', 'cow', 'calf', 'lion', 'cub', 'horse', 'foal', 'tiger'];
  await call('w-polysemy', 'set', 1); s = await st('w-polysemy'); test(s.nn.every(o => CR.includes(o.w)) && s.cosC > .99, 'Try: 100% — bat sits with the cricket words (' + s.nn.map(o => o.w).join(', ') + ')');
  await page.waitForTimeout(400); await lab3OK('w-polysemy', '#po-3d', 'polysemy labels at 100%', 3);
  await call('w-polysemy', 'set', 0); s = await st('w-polysemy'); test(s.nn.every(o => AN.includes(o.w)), 'Try: 0% — among the animals (' + s.nn.map(o => o.w).join(', ') + ')');
  await page.waitForTimeout(400); await lab3OK('w-polysemy', '#po-3d', 'polysemy labels at 0%', 3);
  await call('w-polysemy', 'set', .5); s = await st('w-polysemy'); test(near(s.nn[0].c, .693, 1e-3), 'Try: 50% — best neighbour only ' + f3(s.nn[0].c) + ' ("about 0.69")');
  await page.waitForTimeout(400); await lab3OK('w-polysemy', '#po-3d', 'polysemy labels at 50%', 3);
  const settle = async (pred) => { for (let i = 0; i < 30; i++) { await page.waitForTimeout(200); s = await st('w-polysemy'); if (pred(s.s)) break; } return s.s; };
  await click('#po-cric', 200); test(await settle(x => x > .9) > .9, '"He hit a six with his bat" pulls bat to cricket');
  await click('#po-anim', 200); test(await settle(x => x < .1) < .1, '"A bat flew out of the fort" pulls it to the animals');
  await call('w-polysemy', 'set', .5); await nanOK('#w-polysemy', 'w-polysemy');
  await show('#w-pieces');
  const sharedOf = st_ => Object.fromEntries(st_.shared.map(o => [o.k, o.n]));
  await call('w-pieces', 'setWord', 'chaiwala'); s = await st('w-pieces'); let so = sharedOf(s);
  test(s.grams.length === 8 && so.chai === 3 && so.dudhwala === 3 && so.sabziwala === 4, 'Try: chaiwala — 8 pieces, 3 shared with chai, 3 with dudhwala, 4 with sabziwala');
  await click('#pc-pre [data-w="kadakchai"]'); s = await st('w-pieces'); so = sharedOf(s); test(s.word === 'kadakchai' && so.kadak === 4 && so.chai === 3 && so.chain === 2, 'Try: kadakchai — 4 from kadak, 3 from chai', 'kadakchai ' + JSON.stringify(so));
  await call('w-pieces', 'setWord', 'chai'); s = await st('w-pieces'); so = sharedOf(s); test(so.chain === 3, 'Try: chain shares 3 pieces with chai');
  await call('w-pieces', 'setWord', 'chais'); s = await st('w-pieces'); so = sharedOf(s); test(so.chai === 3, 'c42: chais shares 3 with chai');
  await call('w-pieces', 'setWord', 'chaiwala'); await call('w-pieces', 'setTab', 'bpe'); await page.waitForTimeout(250); await call('w-pieces', 'reset');
  await click('#bp-next'); await click('#bp-next'); await click('#bp-next'); await click('#bp-next'); s = await st('w-pieces');
  test(JSON.stringify(s.merges) === JSON.stringify([['u', 'g', 20], ['u', 'n', 16], ['h', 'ug', 15], ['p', 'un', 12]]), 'Try: four merges — u+g (20), u+n (16), h+ug (15), p+un (12)', 'merges ' + JSON.stringify(s.merges));
  test(JSON.stringify(await call('w-pieces', 'cutWord', 'hugs')) === '["hug","s"]' && JSON.stringify(await call('w-pieces', 'cutWord', 'bug')) === '["b","ug"]', 'Try / c43: hugs → hug · s, bug → b · ug');
  test(s.corpus.join('|') === 'hug|p ug|pun|b un|hug s', 'the corpus after four merges: hug · p ug · pun · b un · hug s', 'corpus ' + s.corpus.join('|'));
  await click('#bp-reset'); s = await st('w-pieces'); test(!s.merges.length, 'reset'); await call('w-pieces', 'setTab', 'ft'); await nanOK('#w-pieces', 'w-pieces');
  await show('#s17 .cards', 800);
  const cards = await page.evaluate(() => window.U16.cards.state());
  test(cards.length === 14 && cards.every(o => o.n > 0), 'the 14 carry-forward cards each carry a mini-picture', 'cards ' + JSON.stringify(cards));
  const miniOK = await page.evaluate(() => [...document.querySelectorAll('svg.mini')].map(s => window.__svgCheck(s)).filter(r => r.overlaps.length || r.outside.length).length);
  test(!miniOK, 'no card picture has overlapping or clipped text');

  /* ================================================================ checks, drawers, practice */
  console.log('— checks, drawers, practice —');
  const nOk = await page.evaluate(() => { let n = 0; document.querySelectorAll('.check').forEach(ch => { const b = ch.querySelector('.opts button[data-correct]'); if (b && ch.querySelectorAll('.opts button[data-correct]').length === 1 && ch.querySelectorAll('.opts button').length === 3) { b.click(); n++; } }); return n; });
  await page.waitForTimeout(300);
  const sc2 = await page.evaluate(() => [document.getElementById('score').textContent, document.getElementById('score-chip').classList.contains('done'), (localStorage.getItem('mfml-u16-checks') || '').split(',').filter(Boolean).length]);
  test(nOk === 43 && sc2[0] === '43' && sc2[1] && sc2[2] === 43, 'all 43 checks answerable (three options, one right); score 43/43 stored under mfml-u16-checks', 'checks ' + nOk + ' ' + JSON.stringify(sc2));
  const whys = await page.evaluate(() => [...document.querySelectorAll('.check .opts button')].filter(b => (b.dataset.why || '').trim().length < 25).length);
  test(!whys, 'every option explains itself (data-why on all 129 buttons)', whys + ' options without an explanation');
  const kinds = await page.evaluate(() => [...document.querySelectorAll('.check .tag')].map(t => t.textContent));
  test(kinds.every(t => /Pause/.test(t)), 'every check is a "pause & predict"');
  const wrong = await page.evaluate(() => { const ch = document.querySelector('.check'); const b = ch.querySelector('.opts button:not([data-correct])'); b.click(); return ch.querySelector('.why').textContent.slice(0, 20); });
  test(/Not quite/.test(wrong), 'a wrong answer explains itself', 'wrong answer: ' + wrong);
  const markers = await page.evaluate(() => [...document.querySelectorAll('.check .opts button')].map(b => { b.click(); return b.closest('.check').querySelector('.why').innerHTML; }).filter(h => /&lt;s|<\/?s>/.test(h) && !/&lt;\/?s&gt;/.test(h)).length);
  test(!markers, 'the <s> and </s> markers print as text inside the explanations');
  const dr = await page.evaluate(() => { const ds = [...document.querySelectorAll('details.algebra')]; ds.forEach(d => d.open = true); return ds.every(d => d.querySelector('.derive') && d.querySelector('.derive').offsetHeight > 0); });
  test(dr, 'all 15 drawers open and show their derivations');
  const pr = await page.evaluate(() => { const ss = [...document.querySelectorAll('#spractice details.sol')]; const closed = ss.every(d => !d.open); ss.forEach(d => d.open = true); return [ss.length, closed, document.querySelectorAll('#spractice .pans').length, document.querySelectorAll('#spractice .pstep').length, !!document.querySelector('#spractice .next-card'), document.querySelector('#spractice .sec-num').textContent, [...document.querySelectorAll('#spractice .pdiff')].map(d => d.textContent).join(',')]; });
  test(pr[0] === 16 && pr[1] && pr[2] === 16 && pr[3] >= 64 && pr[4] && pr[5] === '18', 'practice: 16 solutions (closed at load), 16 answer lines, ' + pr[3] + ' steps, next-card inside, § 18', 'practice ' + JSON.stringify(pr));
  test(/easy/.test(pr[6]) && /medium/.test(pr[6]) && /hard/.test(pr[6]), 'practice runs easy → medium → hard (' + pr[6].split(',').filter(x => x === 'hard').length + ' hard)');
  const nc = norm(await text('#spractice .next-card')); test(/Unit 17 · Machines with Memory/.test(nc) && !/upcoming/.test(nc), 'next-card: Unit 17 · Machines with Memory (live)', 'next-card: ' + nc);
  const wide2 = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  test(!wide2, 'with every drawer and solution open, no display equation overflows at 1300 px', wide2 + ' display equations overflow (drawers open)');

  /* ================================================================ layout */
  console.log('— narrow and wide screens —');
  const SV = ['#bg-bars', '#sm-svg', '#pp-svg', '#co-svg', '#fr-svg', '#nf-svg', '#sg-svg', '#cs-svg', '#gr-bars', '#gr-vec', '#nl-svg', '#nl-map', '#cz-svg', '#pa2-svg', '#wv-chart', '#sv-bars'];
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(700);
    const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, [...document.querySelectorAll('.katex-display')].filter(k => k.offsetParent && k.scrollWidth > k.clientWidth + 1).length]);
    test(o[0] <= o[1] + 1 && !o[2], w + 'px: no horizontal overflow, every display equation fits (drawers open)', w + 'px overflow ' + JSON.stringify(o));
    if (w === 390 || w === 1440) { const bads = [];
      for (const sel of SV) { const r = await page.evaluate(s => { const e = document.querySelector(s); e.scrollIntoView({ block: 'center' }); return window.__svgCheck(e); }, sel); if (!r.skipped && (r.overlaps.length || r.outside.length)) bads.push(sel + ' ' + JSON.stringify(r.overlaps.concat(r.outside).slice(0, 3))); }
      for (const [id, tab, sel] of [['w-cooc', 'wd', '#cd-svg'], ['w-cost', 'tree', '#ht-svg'], ['w-cost', 'sub', '#ss-svg']]) { await call(id, 'setTab', tab); await page.waitForTimeout(250);
        const r = await page.evaluate(s => { const e = document.querySelector(s); e.scrollIntoView({ block: 'center' }); return window.__svgCheck(e); }, sel); if (r.skipped || r.overlaps.length || r.outside.length) bads.push(sel + ' ' + JSON.stringify(r.overlaps.concat(r.outside).slice(0, 3)) + (r.skipped ? ' hidden' : '')); }
      await call('w-cooc', 'setTab', 'ww'); await call('w-cost', 'setTab', 'ns');
      test(!bads.length, w + 'px: no overlapping or clipped SVG labels in ' + (SV.length + 3) + ' pictures (tabs included)', w + 'px label problems: ' + bads.join(' | ')); }
    if (w === 390) { await page.waitForTimeout(400);
      const smallNow = () => page.evaluate(() => { const out = []; document.querySelectorAll('.svgstage svg').forEach(s => { const r = s.getBoundingClientRect(); if (!r.width) return; const k = r.width / s.viewBox.baseVal.width;
        s.querySelectorAll('text').forEach(t => { if (!t.textContent.trim()) return; const fs = parseFloat(getComputedStyle(t).fontSize) * k; if (fs < 10.5) out.push(s.id + ':' + t.textContent.slice(0, 12) + ':' + fs.toFixed(1)); }); }); return out; });
      let small = await smallNow();
      for (const [id, tab, back] of [['w-cooc', 'wd', 'ww'], ['w-cost', 'tree', 'ns'], ['w-cost', 'sub', 'ns']]) { await call(id, 'setTab', tab); await page.waitForTimeout(250); small = small.concat(await smallNow()); await call(id, 'setTab', back); }
      small = [...new Set(small)];
      test(!small.length, '390px: every SVG label renders at ≥ 10.5 px (hidden tabs included)', '390px small SVG labels (' + small.length + '): ' + small.slice(0, 8).join(' | '));
      for (const [id, box] of [['w-svd-words', '#sv-3d'], ['w-analogy', '#ex-3d'], ['w-polysemy', '#po-3d'], ['w-w2v', '#wv-3d'], ['w-onehot', '#oh-3d']]) { await show(box, 1300); await lab3OK(id, box, '390px ' + id); } } }
  await page.setViewportSize({ width: 1300, height: 950 });

  console.log('— theme flip —');
  await page.click('#theme-btn'); await page.waitForTimeout(1200);
  const th = await page.evaluate(() => document.documentElement.dataset.theme || getComputedStyle(document.body).backgroundColor);
  await show('#w-analogy', 1200); await lab3OK('w-analogy', '#ex-3d', 'light theme: explorer labels', 4);
  await svgOK('#co-svg', 'light theme: company angle');
  await page.click('#theme-btn'); await page.waitForTimeout(600);
  okay('theme flipped to ' + th + ' and back');

  console.log('— reduced motion —');
  { const ctx2 = await browser.newContext({ viewport: { width: 1300, height: 900 }, reducedMotion: 'reduce' }); const p2 = await ctx2.newPage(); const e2 = [];
    p2.on('pageerror', e => e2.push(String(e))); p2.on('console', m => { if (m.type() === 'error') e2.push(m.text()); });
    await p2.goto('file:///home/claude/mfml-site/site/unit-16.html'); await p2.waitForTimeout(2000);
    const r = await p2.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)), U = window.U16, o = {};
      document.getElementById('w-bigram').scrollIntoView(); await sleep(400); document.getElementById('bg-play').click(); await sleep(300); const b = U['w-bigram'].state(); o.bigram = b.step === -1 && b.pathCells === 4 && Math.abs(b.product - .5) < 1e-9;
      document.getElementById('w-sgstep').scrollIntoView(); await sleep(300); document.getElementById('sg-step').click(); await sleep(300); o.sg = U['w-sgstep'].state().steps === 1;
      document.getElementById('w-lookup').scrollIntoView(); await sleep(300); document.getElementById('lk-play').click(); await sleep(300); o.lookup = !/\?/.test(U['w-lookup'].state().shown);
      o.hero = document.getElementById('hero-3d').dataset.ready === '1'; return o; });
    test(r.bigram && r.sg && r.lookup && r.hero && !e2.length, 'reduced motion: the chain shows at once, steps and lookups land without animation, hero mounts, no errors', 'reduced motion ' + JSON.stringify(r) + ' ' + e2.join(' | '));
    await ctx2.close(); }

  console.log('— console —');
  if (glNotes.length) console.log('  note ' + glNotes.length + ' WebGL warning(s) from the sandbox: ' + [...new Set(glNotes)].join(' | '));
  if (stalls) console.log('  note the page stopped painting ' + stalls + ' time(s) under software GL and was poked awake');
  if (!errors.length) okay('no console or page errors'); else errors.slice(0, 10).forEach(fail);
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ UNIT 16 WIDGETS PASS');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
