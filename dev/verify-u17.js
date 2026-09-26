/* Unit 17 · Machines with Memory — widget behaviour and numerical correctness (WebGL on).
   PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u17.js */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
const near = (a, b, t) => Math.abs(a - b) < (t == null ? 1e-6 : t);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_CONNECTION|net::ERR_/.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0, 200)); if (m.type() === 'warning' && /U17|stage failed/.test(m.text())) errors.push('WARN: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const setNum = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const text = sel => page.locator(sel).innerText();
  const norm = s => s.replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  const show = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); };
  const click = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(300); };
  const data = (sel, k) => page.evaluate(([s, k]) => document.querySelector(s).dataset[k], [sel, k]);
  const json = async (sel, k) => JSON.parse(await data(sel, k));

  await page.goto('file:///home/claude/mfml-site/dev/site/unit-17.html');
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.waitForTimeout(2500);

  console.log('— page —');
  const c = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length,
    w3d: [...document.querySelectorAll('.widget')].filter(w => w.querySelector('.stage3d')).length,
    derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length,
    stages: document.querySelectorAll('.stage-canvas canvas').length, katex: document.querySelectorAll('.katex-error').length, T: document.title,
    scoreTotal: document.getElementById('score-total').textContent, crumb: document.querySelector('.topbar .crumb').textContent, kicker: document.querySelector('.hero .kicker').textContent,
    ids: [...document.querySelectorAll('section.unit')].map(s => s.id).join(',') }));
  if (c.checks === 20 && c.scoreTotal === '20') okay('20 checks, #score-total = 20'); else fail('checks ' + JSON.stringify(c));
  if (c.widgets === 14 && c.w3d === 5 && c.derives === 16 && c.drawers === 10 && c.probs === 14) okay('14 widgets (5 in 3D) · 16 derivations in 10 drawers · 14 problems'); else fail('counts ' + JSON.stringify(c));
  if (c.ids === 's1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,spractice') okay('sections s1–s12 + spractice'); else fail('section ids ' + c.ids);
  if (c.stages >= 1 && c.stages <= 4) okay(c.stages + ' WebGL stage(s) mounted at load (lazy)'); else fail('stages ' + c.stages);
  if (!c.katex) okay('no KaTeX errors'); else fail('katex-error ×' + c.katex);
  if (/^Unit 17 · Machines with Memory/.test(c.T) && /Unit 17 · Machines with Memory/.test(c.crumb) && /Unit 17 of 20 · by Prof\. Saurabh/.test(c.kicker)) okay('title, crumb and kicker say Unit 17'); else fail('title/crumb ' + JSON.stringify([c.T, c.crumb, c.kicker]));
  const chips = norm(await text('.hero .meta'));
  if (/14 interactive widgets · 5 in 3D/.test(chips) && /20 inline checks/.test(chips) && /16 proofs/.test(chips) && /14 solved practice problems/.test(chips)) okay('hero chips: 14 widgets · 5 in 3D · 20 checks · 16 proofs · 14 problems'); else fail('hero chips: ' + chips);
  const leak = await page.evaluate(() => { const h = document.documentElement.innerHTML.replace(/mfml-/g, ''); return (h.match(/MFML|ZC416|BITS|WILP/) || h.match(/exam paper|question bank|past paper|\bexams?\b/i) || [''])[0]; });
  if (!leak) okay('no brand leak, no "exam" wording'); else fail('brand leak: ' + leak);
  const nav = await page.evaluate(() => ({ prev: !!document.querySelector('.hero-prev a[href="unit-16.html"]'), next: !!document.querySelector('#spractice .next-card a[href="unit-18.html"]'), U: typeof U !== 'undefined' ? U : null,
    units: (document.documentElement.innerHTML.match(/\{"n":16,"t":"Words as Vectors"\},\{"n":17,"t":"Machines with Memory"\},\{"n":18,"t":"Attention and Transformers"\}\]/) || []).length }));
  if (nav.prev && nav.next && nav.units === 1) okay('previous-unit link to Unit 16, live next-card link to Unit 18, UNITS array ends at 18'); else fail('nav ' + JSON.stringify(nav));
  const hero = await page.evaluate(() => ({ c: !!document.querySelector('#hero-3d canvas'), r: document.getElementById('hero-3d').dataset.ready }));
  if (hero.c && hero.r === '1') okay('hero stage mounted'); else fail('hero ' + JSON.stringify(hero));
  await page.evaluate(() => { window.U17HeroAt = 10.4; }); await page.waitForTimeout(900); let t = norm(await text('#hero-3d .hud'));
  if (/halves/.test(t) && /0\.031/.test(t)) okay('hero at 10.4 s: the blame halves, 1 → 0.031'); else fail('hero hud ' + t);
  await page.evaluate(() => { window.U17HeroAt = 16; }); await page.waitForTimeout(900); t = norm(await text('#hero-3d .hud'));
  if (/explodes/.test(t) && /7\.6/.test(t)) okay('hero at 16 s: it explodes, 1 → 7.6'); else fail('hero hud 2 ' + t);
  await page.evaluate(() => { window.U17HeroAt = 21; }); await page.waitForTimeout(900); t = norm(await text('#hero-3d .hud'));
  if (/express lane/.test(t) && /0\.86/.test(t)) okay('hero at 21 s: the express lane, 1 → 0.86'); else fail('hero hud 3 ' + t);
  await page.evaluate(() => { window.U17HeroAt = null; });

  console.log('— §1 · w-order —');
  await show('#w-order');
  let ends = await json('#or-svg', 'ends'); if (JSON.stringify(ends) === '[[-2,2],[0,0]]') okay('running note: dog bites man → (−2, 2), man bites dog → (0, 0)'); else fail('order ends ' + JSON.stringify(ends));
  await setRange('or-th', 0); if ((await data('#or-svg', 'same')) === '1' && JSON.stringify(await json('#or-svg', 'ends')) === '[[2,2],[2,2]]') okay('turn 0°: both land on the plain sum (2, 2)'); else fail('order th0');
  await setRange('or-th', 90); await setRange('or-k', 0.5); if ((await data('#or-svg', 'same')) === '0') okay('keep 0.5: still different'); else fail('order k');
  await setRange('or-k', 1);
  await page.selectOption('#or-sents select[data-s="B"][data-i="0"]', 'sees'); ends = await json('#or-svg', 'ends'); if (ends[1].length === 2) okay('the sentence pickers redraw the note (B = ' + JSON.stringify(ends[1]) + ')'); else fail('picker');
  await page.selectOption('#or-sents select[data-s="B"][data-i="0"]', 'man');
  await click('#or-swap'); await click('#or-swap'); await click('#or-play'); await page.waitForTimeout(3300);
  await click('#or-mode [data-t="bag"]'); if ((await data('#or-svg', 'same')) === '1') okay('bag of words: identical bags'); else fail('bag');
  await click('#or-mode [data-t="win"]'); if ((await data('#or-svg', 'train')) === '0') okay('window of 3: "train" has dropped out before "late"'); else fail('win 3');
  await setRange('or-win', 8); if ((await data('#or-svg', 'train')) === '1') okay('window of 8: "train" still in view'); else fail('win 8');
  await click('#or-play'); await page.waitForTimeout(4500); await click('#or-mode [data-t="note"]');

  console.log('— §2 · w-rnn-step —');
  await show('#w-rnn-step');
  if ((await data('#rs-svg', 'h')) === '0.7616,0.3634,0.1797') okay('one number: 0.7616, 0.3634, 0.1797'); else fail('rnn one ' + (await data('#rs-svg', 'h')));
  await click('#rs-reset'); await click('#rs-next'); t = norm(await text('#rs-read')); if (/tanh\(0\.5 · 0 \+ 1 · 1\) = tanh\(1\) = 0\.7616/.test(t)) okay('step 1 card: tanh(0.5 · 0 + 1 · 1) = tanh(1) = 0.7616'); else fail('rnn card ' + t);
  await click('#rs-next'); await click('#rs-next'); t = norm(await text('#rs-read')); if (/0\.1797/.test(t) && /23\.6%/.test(t)) okay('step 3: 0.1797, the first word kept 23.6%'); else fail('rnn card 3 ' + t);
  await click('#rs-prev'); await setRange('rs-w', 1); if ((await data('#rs-svg', 'h')).split(',')[1] === '0.6420') okay('w = 1: h₂ = 0.6420 (check c3)'); else fail('rnn w1 ' + (await data('#rs-svg', 'h')));
  await click('#rs-mode [data-t="six"]'); let hs = (await data('#rs-svg', 'h')).split(',').map(r => r.split('|').map(Number));
  if (hs.length === 6 && hs[0].length === 6 && near(hs[1][1], Math.tanh(0.8 * Math.tanh(0.2)), 1e-4) && near(hs[5][5], Math.tanh(0.8 * Math.tanh(0.8 * Math.tanh(0.8 * Math.tanh(0.8 * Math.tanh(0.8 * Math.tanh(0.2)))))), 1e-4)) okay('six slots, slide down: "the" slides one slot per word, shrinking by w and tanh'); else fail('rnn six ' + JSON.stringify(hs.slice(0, 2)));
  await click('#rs-wm [data-m="mix"]'); await click('#rs-play'); await page.waitForTimeout(4400); if ((await data('#rs-svg', 'k')) === '6') okay('▶ read runs to word 6'); else fail('rnn play');
  await click('#rs-wm [data-m="slide"]'); await click('#rs-mode [data-t="one"]');

  console.log('— §3 · w-unroll —');
  await show('#w-unroll'); if ((await data('#un-3d', 'state')) === '5,unrolled') okay('5 twins, unrolled'); else fail('unroll ' + (await data('#un-3d', 'state')));
  await click('#un-play'); await page.waitForTimeout(1900); if ((await data('#un-3d', 'state')) === '5,folded') okay('▶ fold: one cell with a loop'); else fail('fold');
  await click('#un-share'); await page.waitForTimeout(1500); await setRange('un-T', 8); t = norm(await text('#un-read'));
  if ((await data('#un-3d', 'state')) === '8,unrolled' && /used 7 times/.test(t) && /= 32/.test(t)) okay('8 words: W used 7 times, still 32 numbers'); else fail('unroll 8 ' + t);
  await setRange('un-T', 5);

  console.log('— §4 · w-shapes —');
  await show('#w-shapes');
  const IO = { m1: '5,1', '1m': '1,5', mm: '5,5', s2s: '3,3', lm: '5,5' };
  let allio = true; for (const [k, v] of Object.entries(IO)) { await click(`#sh-tabs [data-t="${k}"]`); if ((await data('#sh-svg', 'io')) !== v) { allio = false; fail('shape ' + k + ' io ' + (await data('#sh-svg', 'io'))); } }
  if (allio) okay('inputs/read-outs: many→one 5/1, one→many 1/5, tag 5/5, translate 3/3, next word 5/5');
  if ((await data('#sh-svg', 'lm')) === '0.609,0.224,0.136,0.030') okay('next word after "the train to": 0.609, 0.224, 0.136, 0.030'); else fail('lm ' + (await data('#sh-svg', 'lm')));
  await click('#sh-play'); await page.waitForTimeout(4800); await click('#sh-tabs [data-t="m1"]'); await click('#sh-play'); await page.waitForTimeout(3500);

  console.log('— §5 · w-bptt —');
  await show('#w-bptt');
  const go = async i => { await page.evaluate(i => window.U17BPTT.go(i), i); await page.waitForTimeout(120); return norm(await text('#bp-card')); };
  t = await go(0); if (/0\.5 · 0 \+ 1 · 1 = 1/.test(t) && /0\.7616/.test(t)) okay('F1: z₁ = 1, h₁ = 0.7616'); else fail('bptt F1 ' + t);
  t = await go(3); if (/0\.0896/.test(t)) okay('F4: h₄ = 0.0896'); else fail('bptt F4 ' + t);
  t = await go(4); if (/0\.4144/.test(t) && /-0\.9104/.test(t)) okay('S: L = 0.4144, ∂L/∂h₄ = −0.9104'); else fail('bptt S ' + t);
  t = await go(5); if (/-0\.9031/.test(t) && /-0\.4515/.test(t) && /-0\.1623/.test(t)) okay('B4: ∂L/∂z₄ = −0.9031, report −0.1623, ∂L/∂h₃ = −0.4515'); else fail('bptt B4 ' + t);
  t = await go(8); if (/-0\.0398/.test(t) && /-0\.0948/.test(t) && /reports 0/.test(t)) okay('B1: ∂L/∂h₁ = −0.0948 → ∂L/∂z₁ = −0.0398; word 1 reports 0 for w'); else fail('bptt B1 ' + t);
  t = await go(9); if (/-0\.4655/.test(t) && /9\.6 times/.test(t)) okay('Σ: ∂L/∂w = −0.4655; the blame fell 9.6 times'); else fail('bptt sum ' + t);
  await click('#bp-reset'); await click('#bp-play'); await page.waitForTimeout(2900); const bst = await data('#w-bptt', 'step'); await click('#bp-play');
  if (/F2|F3|F4/.test(bst)) okay('▶ play advances (at ' + bst + ')'); else fail('bptt play ' + bst);
  await click('#bp-next'); await click('#bp-prev'); await page.locator('#bp-scrub button').nth(4).click(); if ((await data('#w-bptt', 'step')) === 'S') okay('the scrubber jumps to S'); else fail('scrub');

  console.log('— §6 · w-power, w-eigen-memory —');
  await show('#w-power'); if (near(+(await data('#pw-svg', 'v')), 0.0009765625)) okay('w = 0.5, T = 10: 0.000977'); else fail('power 0.5');
  t = norm(await text('#pw-read')); if (/t = 10\b/.test(t)) okay('first below one thousandth at t = 10'); else fail('power cross ' + t);
  await click('#w-power .preset[data-w="1.5"]'); if (near(+(await data('#pw-svg', 'v')), 57.6650390625)) okay('w = 1.5: 57.67'); else fail('power 1.5');
  await click('#pw-tanh'); const vt = +(await data('#pw-svg', 'v')); await click('#pw-tanh'); if (vt < 57.66) okay('with tanh: ' + vt.toExponential(2) + ' — the squeeze only shrinks'); else fail('power tanh ' + vt);
  await setRange('pw-T', 50); await setRange('pw-w', 1.1); if (near(+(await data('#pw-svg', 'v')), 1.1 ** 50, 1e-6)) okay('w = 1.1, T = 50: ≈ 117'); else fail('power 1.1');
  await click('#w-power .preset[data-w="0.5"]'); await setRange('pw-T', 10);
  await show('#w-eigen-memory'); let es = await json('#em-3d', 'state');
  if (es.real && near(es.l[0], 1) && near(es.l[1], 0.5) && near(es.p10[0], 0.8 + 0.2 * 0.5 ** 10) && near(es.p10[1], 0.2 - 0.2 * 0.5 ** 10)) okay('keep: eigenvalues 1, 0.5; W¹⁰v = (0.8002, 0.1998)'); else fail('eigen keep ' + JSON.stringify(es));
  await click('#em-pre [data-p="fade"]'); es = await json('#em-3d', 'state'); if (near(es.l[0], 0.6) && near(es.l[1], 0.3) && es.rho < 1) okay('fade: eigenvalues 0.6, 0.3'); else fail('eigen fade ' + JSON.stringify(es));
  await click('#em-pre [data-p="explode"]'); es = await json('#em-3d', 'state'); if (near(es.l[0], 1.2) && near(es.l[1], 0.9)) okay('explode: eigenvalues 1.2, 0.9'); else fail('eigen explode ' + JSON.stringify(es));
  await click('#em-pre [data-p="rotate"]'); es = await json('#em-3d', 'state'); if (!es.real && near(es.rho, 1) && near(es.l[0], 0.8) && near(es.l[1], 0.6)) okay('rotate: λ = 0.8 ± 0.6i, |λ| = 1 (check c12)'); else fail('eigen rotate ' + JSON.stringify(es));
  await setNum('em-a', 0.5); await setNum('em-b', 0); await setNum('em-c', 0); await setNum('em-d', 1.2); es = await json('#em-3d', 'state'); if (near(es.rho, 1.2) && near(es.l[0], 1.2) && near(es.l[1], 0.5)) okay('typed W = diag(0.5, 1.2): |λ|max = 1.2 (check c11)'); else fail('eigen typed ' + JSON.stringify(es));
  await click('#em-pre [data-p="keep"]'); await click('#em-play'); await page.waitForTimeout(3400);

  console.log('— §7 · w-clip —');
  await show('#w-clip'); let cs = (await data('#cl-3d', 'state')).split(',');
  if (cs[0] === 'off' && cs[2] === 'off' && cs[3] === '9' && cs[4] === '10.862') okay('clipping off: flung off the map at step 9 by a gradient of length 10.86'); else fail('clip off ' + cs);
  await click('#cl-on'); cs = (await data('#cl-3d', 'state')).split(','); t = norm(await text('#cl-read'));
  if (cs[0] === 'on' && cs[2] === 'in' && /Reached the valley/.test(t)) okay('clipping on (c = 2): reaches the valley'); else fail('clip on ' + cs + ' ' + t);
  await setRange('cl-c', 0.5); cs = (await data('#cl-3d', 'state')).split(','); if (cs[2] === 'in') okay('c = 0.5: shorter steps, still safe'); else fail('clip 0.5');
  await setRange('cl-c', 2); await click('#cl-play'); await page.waitForTimeout(2000); await click('#cl-reset'); await click('#cl-on');

  console.log('— §8 · w-notebook, w-lstm —');
  await show('#w-notebook'); if ((await data('#nb-svg', 'c')) === '1.000000' && (await data('#nb-svg', 'h')) === '0.761594') okay('worked example: c = 0.9 · 1 + 0.2 · 0.5 = 1.0, h = tanh 1 = 0.7616'); else fail('notebook ' + (await data('#nb-svg', 'c')));
  await setRange('nb-f', 0.5); await setRange('nb-c', 2); await setRange('nb-i', 1); await setRange('nb-g', -0.4); if ((await data('#nb-svg', 'c')) === '0.600000') okay('check c14: 0.5 · 2 + 1 · (−0.4) = 0.6'); else fail('notebook c14 ' + (await data('#nb-svg', 'c')));
  await click('#nb-hold'); if ((await data('#nb-svg', 'c')) === '2.000000') okay('hold forever (f = 1, i = 0): the level stays 2'); else fail('hold');
  await setRange('nb-o', 0); if ((await data('#nb-svg', 'h')) === '0.000000') okay('window shut: note 0, tank still full'); else fail('window');
  await click('#nb-reset'); await click('#nb-play'); await page.waitForTimeout(2500);
  await show('#w-lstm'); let ls = await json('#lb-3d', 'state');
  if (ls.T === 20 && near(ls.acc.rnn, 0.5125) && ls.acc.lstm === 1 && ls.acc.gru === 1 && ls.bl.rnn < 0.01 && ls.bl.lstm > 0.8) okay('20 words: plain cell 51.3% (a coin toss), LSTM and GRU 100%; blame to word 1 ' + ls.bl.rnn.toExponential(1) + ' vs ' + ls.bl.lstm.toFixed(3)); else fail('lab 20 ' + JSON.stringify(ls));
  let acc = await json('#lb-svg', 'acc'); if (acc.length === 10 && near(acc[0][1], 0.7975) && acc[9][2] === 1 && acc[9][3] === 1 && near(acc[9][1], 0.4575)) okay('accuracy curve: plain 79.8% at 5 words → 45.8% at 50; gated 100% (matches verify-math17)'); else fail('lab acc ' + JSON.stringify(acc));
  await click('#lb-honest'); acc = await json('#lb-svg', 'acc'); if (near(acc[9][3], 0.855) && acc[9][2] === 1) okay('honest LSTM (f = 0.9): 85.5% at 50 words, GRU still 100% (check c16)'); else fail('lab honest ' + JSON.stringify(acc[9]));
  await setRange('lb-T', 50); ls = await json('#lb-3d', 'state'); if (near(ls.bl.lstm, 0.9 ** 49, 1e-9)) okay('50 words: the LSTM lane passes f⁴⁹ = 0.9⁴⁹ ≈ 0.0057'); else fail('lab f49 ' + ls.bl.lstm);
  await click('#lb-tabs [data-t="blame"]'); await click('#lb-run'); await page.waitForTimeout(3200); await click('#lb-new'); await setRange('lb-A', 1); await setRange('lb-w', 1);
  await click('#lb-reset'); ls = await json('#lb-3d', 'state'); if (ls.T === 20 && near(ls.acc.rnn, 0.5125)) okay('reset restores the default race'); else fail('lab reset ' + JSON.stringify(ls));
  await click('#lb-tabs [data-t="acc"]');

  console.log('— §9 · w-gru, w-gates-compare —');
  await show('#w-gru'); if ((await data('#gr-svg', 'h')).split(',').map(Number).every((v, i) => near(v, [0.5, 0][i]))) okay('z = 0.25: new note (0.5, 0) — first entry 0.75 · 0.8 + 0.25 · (−0.4) = 0.5'); else fail('gru ' + (await data('#gr-svg', 'h')));
  await setRange('gr-z', 0.5); let gh = (await data('#gr-svg', 'h')).split(',').map(Number); if (near(gh[0], 0.2) && near(gh[1], 0.2)) okay('z = 0.5: halfway, (0.2, 0.2)'); else fail('gru half ' + gh);
  await setRange('gr-r', 0); await click('#gr-play'); await page.waitForTimeout(2800); await click('#gr-reset');
  await show('#w-gates-compare'); if ((await data('#gc-svg', 'p')) === '24704,74112,98816') okay('h = 128, d = 64: 24 704 · 74 112 · 98 816'); else fail('gates ' + (await data('#gc-svg', 'p')));
  await setRange('gc-h', 256); await setRange('gc-d', 104); if ((await data('#gc-svg', 'p')) === [256 * 360 + 256, 3 * (256 * 360 + 256), 4 * (256 * 360 + 256)].join()) okay('h = 256, d = 104: counts follow h(h + d) + h'); else fail('gates 256');
  await setRange('gc-h', 10); await setRange('gc-d', 5); /* ranges step 8: values snap */ await setRange('gc-h', 128); await setRange('gc-d', 64);
  await page.locator('#gc-svg [data-cell="lstm"]').click(); t = norm(await text('#gc-read')); if (/LSTM:/.test(t) && /c = f ⊙ c \+ i ⊙ g/.test(t)) okay('clicking the LSTM shows its equations'); else fail('gates click ' + t);

  console.log('— §10 · w-seq2seq —');
  await show('#w-seq2seq'); if ((await data('#sq-3d', 'state')) === '6,0.590490,own') okay('6 words: word 1 speaks at 0.9⁵ = 0.5905'); else fail('seq ' + (await data('#sq-3d', 'state')));
  await setRange('sq-n', 50); t = norm(await text('#sq-read')); if ((await data('#sq-3d', 'state')).startsWith('50,0.005726') && /400 numbers in/.test(t) && /more words than slots/.test(t)) okay('50 words: 400 numbers into 8; word 1 at 0.9⁴⁹ ≈ 0.0057'); else fail('seq 50 ' + t);
  await click('#sq-tf'); if ((await data('#sq-3d', 'state')).endsWith('tf')) okay('teacher forcing switch'); else fail('tf');
  await setRange('sq-n', 6); await click('#sq-play'); await page.waitForTimeout(5600);

  console.log('— §11 · w-beam —');
  await show('#w-beam'); if ((await data('#bm-svg', 'best')) === 'the train|0.2000') okay('greedy: "the train", 0.20'); else fail('beam 1 ' + (await data('#bm-svg', 'best')));
  await click('#bm-k [data-t="2"]'); if ((await data('#bm-svg', 'best')) === 'our train|0.3600') okay('width 2: "our train", 0.36'); else fail('beam 2');
  await click('#bm-k [data-t="3"]'); if ((await data('#bm-svg', 'best')) === 'our train|0.3600') okay('width 3: the same 0.36 (check c20)'); else fail('beam 3');
  await click('#bm-log'); t = norm(await text('#bm-read')); if (/-1\.022/.test(t)) okay('log view: ln 0.36 = −1.022'); else fail('beam log ' + t);
  await click('#bm-play'); await page.waitForTimeout(2600);

  console.log('— checks, drawers, practice —');
  const nOk = await page.evaluate(() => { let n = 0; document.querySelectorAll('.check').forEach(ch => { const b = ch.querySelector('.opts button[data-correct]'); if (b && ch.querySelectorAll('.opts button[data-correct]').length === 1) { b.click(); n++; } }); return n; });
  await page.waitForTimeout(300);
  const sc2 = await page.evaluate(() => [document.getElementById('score').textContent, document.getElementById('score-chip').classList.contains('done'), (localStorage.getItem('mfml-u17-checks') || '').split(',').filter(Boolean).length]);
  if (nOk === 20 && sc2[0] === '20' && sc2[1] && sc2[2] === 20) okay('all 20 checks answerable (one right answer each); score 20/20 stored under mfml-u17-checks'); else fail('checks ' + nOk + ' ' + JSON.stringify(sc2));
  const wrong = await page.evaluate(() => { const ch = document.querySelector('.check'); const b = ch.querySelector('.opts button:not([data-correct])'); b.click(); return ch.querySelector('.why').textContent.slice(0, 20); });
  if (/Not quite/.test(wrong)) okay('a wrong answer explains itself'); else fail('wrong answer: ' + wrong);
  const dr = await page.evaluate(() => { const ds = [...document.querySelectorAll('details.algebra')]; ds.forEach(d => d.open = true); return ds.every(d => d.querySelector('.derive') && d.querySelector('.derive').offsetHeight > 0); });
  if (dr) okay('all 10 drawers open and show their derivations'); else fail('drawers');
  const pr = await page.evaluate(() => { const ss = [...document.querySelectorAll('#spractice details.sol')]; const closed = ss.every(d => !d.open); ss.forEach(d => d.open = true); return [ss.length, closed, document.querySelectorAll('#spractice .pans').length, document.querySelectorAll('#spractice .pstep').length, !!document.querySelector('#spractice .next-card'), document.querySelector('#spractice .sec-num').textContent]; });
  if (pr[0] === 14 && pr[1] && pr[2] === 14 && pr[3] > 45 && pr[4] && pr[5] === '13') okay('practice: 14 solutions (closed at load), 14 answer lines, ' + pr[3] + ' steps, next-card inside, § 13'); else fail('practice ' + JSON.stringify(pr));
  const nc = norm(await text('#spractice .next-card')); if (/Unit 18 · Attention and Transformers/.test(nc) && !/upcoming/.test(nc)) okay('next-card: Unit 18 · Attention and Transformers (live link)'); else fail('next-card: ' + nc);
  await page.evaluate(() => document.querySelectorAll('details.lb-how').forEach(d => d.open = true));
  const wide2 = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide2) okay('with every drawer and solution open, no display equation overflows at 1300px'); else fail(wide2 + ' display equations overflow (drawers open)');

  console.log('— narrow screens —');
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(500);
    const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, [...document.querySelectorAll('.katex-display')].filter(k => k.offsetParent && k.scrollWidth > k.clientWidth + 1).map(k => k.textContent.slice(0, 30))]);
    if (o[0] <= o[1] + 1 && !o[2].length) okay(w + 'px: no horizontal overflow, every display equation fits'); else fail(w + 'px overflow ' + JSON.stringify(o)); }
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(4000);
  const small = await page.evaluate(() => [...document.querySelectorAll('.widget svg')].filter(sv => sv.getBoundingClientRect().width > 0 && sv.closest('.widget').offsetParent).map(sv => { const r = sv.getBoundingClientRect().width, W = sv.viewBox.baseVal.width; let mn = 99;
    sv.querySelectorAll('text').forEach(t => { if (!t.getClientRects().length) return; const m = (t.getAttribute('style') || '').match(/font:\s*\d+\s+([\d.]+)px/); if (m) mn = Math.min(mn, +m[1] * r / W); }); return [sv.id, +mn.toFixed(1)]; }).filter(x => x[1] < 10.9));
  if (!small.length) okay('390px: every visible SVG label renders at 11 px or more'); else fail('390px small SVG labels ' + JSON.stringify(small));
  await page.setViewportSize({ width: 1300, height: 950 });

  console.log('— theme flip —');
  await page.click('#theme-btn'); await page.waitForTimeout(1200); await page.click('#theme-btn'); await page.waitForTimeout(600);

  console.log('— console —');
  if (!errors.length) okay('no console or page errors'); else errors.slice(0, 10).forEach(fail);
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ UNIT 17 WIDGETS PASS');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
