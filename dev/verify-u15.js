/* Unit 15 · The Network, Whole — widget behaviour and numerical correctness (WebGL on).
   PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u15.js
   (The playground #w-play has its own suite, verify-u15-play.js; here we only check that it is mounted.) */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_CONNECTION|net::ERR_/.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0, 200)); if (m.type() === 'warning' && /U15/.test(m.text())) errors.push('WARN: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const text = sel => page.locator(sel).innerText();
  const norm = s => s.replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  const show = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); };
  const click = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(300); };
  const data = (sel, k) => page.evaluate(([s, k]) => document.querySelector(s).dataset[k], [sel, k]);

  await page.goto('file:///home/claude/mfml-site/site/unit-15.html');
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.waitForTimeout(2500);

  console.log('— page —');
  const c = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length, mine: document.querySelectorAll('.widget:not(#w-play)').length,
    w3d: [...document.querySelectorAll('.widget:not(#w-play)')].filter(w => w.querySelector('.stage3d')).length,
    derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length,
    stages: document.querySelectorAll('.stage-canvas canvas').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u15-total'), T: document.title,
    scoreTotal: document.getElementById('score-total').textContent, crumb: document.querySelector('.topbar .crumb').textContent, kicker: document.querySelector('.hero .kicker').textContent,
    play: !!document.getElementById('w-play'), ids: [...document.querySelectorAll('section.unit')].map(s => s.id).join(',') }));
  if (c.checks === 20 && c.total === '20' && c.scoreTotal === '20') okay('20 checks, total published, #score-total = 20'); else fail('checks ' + JSON.stringify(c));
  if (c.mine === 13 && c.w3d === 5 && c.derives === 15 && c.drawers === 8 && c.probs === 14) okay('13 widgets of this unit (5 in 3D) + the playground · 15 derivations in 8 drawers · 14 problems'); else fail('counts ' + JSON.stringify(c));
  if (c.play && c.widgets === 14) okay('the playground #w-play is mounted in §11'); else fail('playground slot ' + JSON.stringify([c.play, c.widgets]));
  if (c.ids === 's1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,spractice') okay('sections s1–s12 + spractice'); else fail('section ids ' + c.ids);
  if (c.stages >= 1 && c.stages <= 4) okay(c.stages + ' WebGL stage(s) mounted at load (lazy)'); else fail('stages ' + c.stages);
  if (!c.katex) okay('no KaTeX errors'); else fail('katex-error ×' + c.katex);
  if (/^Unit 15 · The Network, Whole/.test(c.T) && /Unit 15 · The Network, Whole/.test(c.crumb) && /Unit 15 of 20/.test(c.kicker)) okay('title, crumb and kicker say Unit 15'); else fail('title/crumb ' + JSON.stringify([c.T, c.crumb, c.kicker]));
  const chips = norm(await text('.hero .meta'));
  if (/14 interactive widgets · 6 in 3D/.test(chips) || /14 interactive widgets · 5 in 3D/.test(chips)) okay('hero chips carry the widget count (' + chips.match(/\d+ interactive widgets · \d+ in 3D/)[0] + ')'); else fail('hero chips: ' + chips);
  if (/20 inline checks/.test(chips) && /15 proofs/.test(chips) && /14 solved practice problems/.test(chips)) okay('hero chips: 20 checks · 15 proofs · 14 problems'); else fail('hero chips: ' + chips);
  const leak = await page.evaluate(() => { const h = document.documentElement.innerHTML.replace(/mfml-/g, ''); return (h.match(/MFML|ZC416|BITS|WILP/) || h.match(/exam paper|question bank|past paper/i) || [''])[0]; });
  if (!leak) okay('no brand leak, no "exam paper" wording'); else fail('brand leak: ' + leak);
  const nav = await page.evaluate(() => ({ prev: !!document.querySelector('.hero-prev a[href="unit-14.html"]'), toc: document.querySelector('.toc-nav') && document.querySelector('.toc-nav').textContent, u16: !!document.querySelector('a[href="unit-16.html"]') }));
  if (nav.prev && /Unit 14/.test(nav.toc || '') && !nav.u16) okay('previous-unit link to Unit 14; no link to the upcoming Unit 16'); else fail('nav ' + JSON.stringify(nav));
  const hero = await page.evaluate(() => ({ c: !!document.querySelector('#hero-3d canvas'), r: document.getElementById('hero-3d').dataset.ready }));
  if (hero.c && hero.r === '1') okay('hero stage mounted'); else fail('hero ' + JSON.stringify(hero));

  console.log('— the shared network code (the page computes, never types, its numbers) —');
  const m = await page.evaluate(() => { const r = {}; const S = window.U15Stepper; r.L2 = S.L2; return r; });
  if (Math.abs(m.L2 - 18.894588) < 1e-5) okay('one η = 10⁻⁵ step: L = ' + m.L2.toFixed(6) + ' (18.89)'); else fail('L2 ' + m.L2);

  console.log('— §1 · w-anatomy —');
  await show('#w-anatomy');
  await page.evaluate(() => window.U15Anatomy.light(['W2']));
  let t = norm(await text('#an-read')); const hl = await page.evaluate(() => document.querySelectorAll('#w-anatomy .an-hl').length);
  if (/2 × 3/.test(t) && hl >= 7) okay('pointing at W⁽²⁾ lights its 6 wires + its matrix (' + hl + ' twins), readout "2 × 3"'); else fail('anatomy light ' + hl + ' ' + t);
  await page.locator('#an-graph line[data-obj="W1"]').first().hover(); await page.waitForTimeout(200); t = norm(await text('#an-read'));
  if (/3 × 2/.test(t)) okay('hovering a first-layer wire names W⁽¹⁾ · 3 × 2'); else fail('hover ' + t);
  await click('#an-t-chain'); const chainVis = await page.evaluate(() => document.getElementById('an-chain-box').style.display !== 'none' && document.querySelectorAll('#an-chain [data-obj]').length);
  if (chainVis >= 15) okay('chain view: 8 boxes + 7 arrows'); else fail('chain ' + chainVis);
  await click('#an-quiz'); await page.evaluate(() => window.U15Anatomy.solve()); t = norm(await text('#an-read'));
  if (/7 of 7 right/.test(t)) okay('shape quiz solvable: 7 of 7'); else fail('quiz ' + t);
  await click('#an-reset'); await click('#an-quiz');

  console.log('— §2 · w-neuron, w-acts —');
  await show('#w-neuron'); t = norm(await text('#nr-read'));
  if (/z = 2 → a = 2, slope 1/.test(t) && /crease: 1x₁ \+ 1x₂ = 2/.test(t)) okay('ReLU at (3, 1): z = 2, a = 2, slope 1; crease x₁ + x₂ = 2'); else fail('neuron ' + t);
  await click('#nr-act [data-t="sigmoid"]'); t = norm(await text('#nr-read')); if (/a = 0\.881, slope 0\.105/.test(t)) okay('sigmoid at z = 2: 0.881, slope 0.105'); else fail('sigmoid ' + t);
  await click('#nr-act [data-t="relu"]'); await setRange('nr-w2', -2); t = norm(await text('#nr-read')); if (/z = -1 → a = 0, slope 0/.test(t)) okay('w₂ = −2: (3, 1) falls asleep, slope 0'); else fail('neuron b ' + t);
  await setRange('nr-w2', 1); await click('#nr-slope'); await click('#nr-slope'); await click('#nr-play'); await page.waitForTimeout(6000);
  const nstate = await data('#nr-3d', 'state'); if (/relu,1,1,-2/.test(nstate || '')) okay('▶ sweep the crease returns b to −2'); else fail('neuron play ' + nstate);
  await show('#w-acts'); await setRange('ac-z', 0); t = norm(await text('#ac-read'));
  if (/sigmoid slope 0\.25\b/.test(t) && /tanh slope 1\b/.test(t)) okay('z = 0: sigmoid slope 0.25, tanh slope 1'); else fail('acts ' + t);
  await setRange('ac-z', -3); t = norm(await text('#ac-read')); if (/ReLU slope 0\b/.test(t)) okay('z = −3: ReLU slope exactly 0'); else fail('acts −3 ' + t);

  console.log('— §3 · w-collapse —');
  await show('#w-collapse');
  const om = await page.evaluate(() => window.U15Collapse.oneMatrix()); if (JSON.stringify(om) === JSON.stringify({ W: [[1, 1], [2, 5]], b: [1, 3] })) okay('one matrix: W₂W₁ = [[1,1],[2,5]], W₂b₁ + b₂ = (1, 3)'); else fail('one matrix ' + JSON.stringify(om));
  t = norm(await text('#co-verdict')); if (/match exactly/.test(t)) okay('none: the last page and the ghost page match'); else fail('collapse none ' + t);
  await click('#co-p-xor'); t = norm(await text('#co-verdict')); let sc = await data('#co-3d', 'state');
  if (/tangled/.test(t) && !/,40$/.test(sc)) okay('XOR with no bend: ' + t.match(/gets (\d+) of 40/)[1] + ' of 40 — tangled'); else fail('xor none ' + t + ' ' + sc);
  await click('#co-act [data-t="relu"]'); t = norm(await text('#co-verdict')); if (/40 of 40/.test(t)) okay('XOR with ReLU: 40 of 40 — the fold untangles it'); else fail('xor relu ' + t);
  await click('#co-act [data-t="tanh"]'); await click('#co-play'); await page.waitForTimeout(3600); await click('#co-p-ex'); await click('#co-act [data-t="none"]');

  console.log('— §4 · w-folds, w-paper —');
  await show('#w-folds'); let rms = +(await data('#fo-svg', 'rms'));
  if (Math.abs(rms - 0.129288) < 5e-6) okay('sine, N = 3: rms error 0.1293 (matches verify-math15)'); else fail('folds N=3 ' + rms);
  await setRange('fo-n', 24); rms = +(await data('#fo-svg', 'rms')); if (Math.abs(rms - 0.001887) < 5e-6) okay('sine, N = 24: rms error 0.0019'); else fail('folds N=24 ' + rms);
  for (const f of ['step', 'abs', 'bump', 'draw', 'sin']) await click(`#fo-pre [data-f="${f}"]`);
  await click('#fo-hinges'); await click('#fo-hinges'); await click('#fo-play'); await page.waitForTimeout(8000);
  if ((await data('#fo-svg', 'n')) === '24') okay('▶ add neurons runs 1 → 24'); else fail('folds play');
  await show('#w-paper'); await setRange('pa-k', 4); if ((await data('#pa-3d', 'pieces')) === '16') okay('4 folds: 16 pieces'); else fail('paper k4');
  await click('#pa-play'); await page.waitForTimeout(2000); if ((await data('#pa-3d', 'pieces')) === '32') okay('▶ fold again: 5 folds, 32 pieces'); else fail('paper play ' + (await data('#pa-3d', 'pieces')));

  console.log('— §5 · w-forward —');
  await show('#w-forward');
  if ((await data('#w-forward', 'z1')) === '7,4,-2' && (await data('#w-forward', 'yhat')) === '40' && (await data('#w-forward', 'loss')) === '50') okay('z⁽¹⁾ = (7, 4, −2), ŷ = 40, L = 50'); else fail('forward default');
  t = norm(await text('#fw-stage')); if (/\(0\.1\)\(30\) \+ \(0\.3\)\(10\) \+ 1 = 3 \+ 3 \+ 1 = 7/.test(t)) okay('F1 row 1: (0.1)(30) + (0.3)(10) + 1 = 3 + 3 + 1 = 7'); else fail('F1 rows ' + t.slice(0, 200));
  await setRange('fw-exp', 25); t = norm(await text('#fw-neurons')); if (/h¹₃ awake 1/.test(t)) okay('experience 25 wakes the third neuron (z = 1)'); else fail('wake ' + t);
  await setRange('fw-age', 18); await setRange('fw-exp', 30); t = norm(await text('#fw-neurons')); if (/h¹₂ asleep -0\.4/.test(t)) okay('age 18, experience 30: the second neuron sleeps (z = −0.4)'); else fail('sleep ' + t);
  await click('#fw-reset'); await click('#fw-steps [data-s="6"]'); t = norm(await text('#fw-stage')); if (/= 50/.test(t) && /-10/.test(t)) okay('F7: L = 50, error −10'); else fail('F7 ' + t);
  await click('#fw-play'); await page.waitForTimeout(2500); await click('#fw-next'); await click('#fw-prev');

  console.log('— §6 · w-heads —');
  await show('#w-heads'); t = norm(await text('#hd-read'));
  if (/ŷ - y = -10, L = 50/.test(t) && /q = \(0\.665, 0\.245, 0\.09\), L = 0\.408, q - y = \(-0\.335, 0\.245, 0\.09\)/.test(t)) okay('regression −10 / 50; softmax (0.665, 0.245, 0.09), L 0.408, q − y (−0.335, 0.245, 0.09)'); else fail('heads ' + t);
  await setRange('hd-y', 60); t = norm(await text('#hd-read')); if (/ŷ - y = 10, L = 50/.test(t)) okay('ŷ = 60: the arrow flips to +10'); else fail('heads 60 ' + t);
  await setRange('hd-z1', 6); t = norm(await text('#hd-read')); if (/q - y = \(-0\.00\d/.test(t)) okay('z₁ = 6: the blame nearly vanishes'); else fail('heads z1 ' + t);
  await click('#hd-same'); await click('#hd-same'); await click('#hd-reset');

  console.log('— §7 · w-rules —');
  await show('#w-rules'); if ((await data('#ra-svg', 'out')) === '-60,10,0') okay('Rule A: (−60, 10, −20) ⊙ (1, 1, 0) = (−60, 10, 0)'); else fail('rule A');
  await page.locator('#ra-svg .ra-z').nth(2).click(); await page.waitForTimeout(150); if ((await data('#ra-svg', 'out')) === '-60,10,-20') okay('flipping z₃ opens its switch: (−60, 10, −20)'); else fail('rule A flip');
  await click('#ra-reset');
  await click('#rb-outer'); await page.waitForTimeout(4500); t = norm(await text('#rb-mats'));
  if ((await data('#rb-svg', 'cells')) === '6' && /-280/.test(t) && /-160/.test(t) && /-140/.test(t) && /-80/.test(t)) okay('Rule B outer product: [[−280, −160, 0], [−140, −80, 0]]'); else fail('rule B outer ' + t);
  await click('#rb-back'); await page.waitForTimeout(3300); t = norm(await text('#rb-mats'));
  if ((await data('#rb-svg', 'back')) === '3' && /-60/.test(t) && /\b10\b/.test(t)) okay('Wᵀ·blame = (−60, 10, −20)'); else fail('rule B back ' + t);
  await click('#rb-layer'); await click('#rb-outer'); await page.waitForTimeout(1600); t = norm(await text('#rb-mats')); if (/-60/.test(t) && /-70/.test(t)) okay('layer 3: ∂L/∂W⁽³⁾ = (−60, −70)'); else fail('rule B layer 3 ' + t); await click('#rb-layer');

  console.log('— §8 · w-stepper —');
  await show('#w-stepper');
  const go = async i => { await page.evaluate(i => window.U15Stepper.go(i), i); await page.waitForTimeout(120); return norm(await text('#st-card')); };
  t = await go(0); if (/row 1 \(0\.1\)\(30\) \+ \(0\.3\)\(10\) \+ 1 = 7/.test(t)) okay('F1 card: row 1 = 7'); else fail('stepper F1 ' + t.slice(0, 160));
  t = await go(4); if (/= 40/.test(t)) okay('F5: z⁽³⁾ = 40'); else fail('stepper F5 ' + t);
  t = await go(10); if (/-60 -70/.test(t) && /-40 -20/.test(t) && /twice the blame/.test(t)) okay('B3: ∂L/∂W⁽³⁾ = (−60, −70), ∂L/∂a⁽²⁾ = (−40, −20)'); else fail('stepper B3 ' + t);
  t = await go(12); if (/-280 -160 0 -140 -80 0/.test(t) && /-60/.test(t)) okay('B5: ∂L/∂W⁽²⁾ and Wᵀ rows (−60, 10, −20)'); else fail('stepper B5 ' + t);
  t = await go(13); if (/blocked/.test(t) && /-60 10 0/.test(t)) okay('B6: the −20 is blocked → (−60, 10, 0)'); else fail('stepper B6 ' + t);
  const cache = norm(await text('#st-cache')); if (/read now/.test(cache)) okay('B6 reads z⁽¹⁾ from the cache'); else fail('cache ' + cache);
  t = await go(14); if (/-1800 -600 300 100 0 0/.test(t)) okay('B7: ∂L/∂W⁽¹⁾ = [[−1800, −600], [300, 100], [0, 0]]'); else fail('stepper B7 ' + t);
  t = await go(15); if (/0\.118/.test(t) && /0\.306/.test(t) && /1\.0006/.test(t) && /4\.0006/.test(t) && /2\.0007/.test(t)) okay('U: W⁽¹⁾₁₁ = 0.118 … W⁽³⁾ = (4.0006, 2.0007)'); else fail('stepper U ' + t);
  t = await go(16); if (/50 → 18\.89/.test(t) && /43\.85/.test(t) && /7\.6006/.test(t)) okay('V: ŷ = 43.85, loss 50 → 18.89'); else fail('stepper V ' + t);
  await page.evaluate(() => window.U15Stepper.select('z1')); t = norm(await text('#st-info')); if (/\(1, 1, 0\)/.test(t) && /\(-60, 10, 0\)/.test(t)) okay('clicking z⁽¹⁾: slope (1, 1, 0), blame (−60, 10, 0)'); else fail('info ' + t);
  await page.locator('#st-chain [data-node="L"]').click(); await page.waitForTimeout(100);
  await click('#st-reset'); await click('#st-play'); await page.waitForTimeout(2900); const stp = await data('#w-stepper', 'step'); await click('#st-play');
  if (stp === 'F2' || stp === 'F3') okay('▶ play advances (at ' + stp + ')'); else fail('play ' + stp);
  await click('#st-next'); await click('#st-prev'); await page.locator('#st-scrub button').nth(7).click(); if ((await data('#w-stepper', 'step')) === 'S') okay('the scrubber jumps to S'); else fail('scrub');

  console.log('— §9 · w-train1, w-canyon —');
  await show('#w-train1');
  await click('#tr-step'); let L = +(await data('#tr-svg', 'loss')); if (Math.abs(L - 18.894588) < 1e-5) okay('one step at 10⁻⁵: L = 18.89'); else fail('train step ' + L);
  await click('#tr-reset'); await setRange('tr-eta', -4); await click('#tr-step'); L = +(await data('#tr-svg', 'loss')); t = norm(await text('#tr-read'));
  if (Math.abs(L - 428.81) < .01 && /overshoot/.test(t) && /79\.285/.test(t)) okay('η = 10⁻⁴: overshoot to ŷ = 79.29, L = 428.81'); else fail('train 1e-4 ' + L + ' ' + t);
  await click('#tr-reset'); await setRange('tr-eta', Math.log10(2e-3)); await click('#tr-step'); await click('#tr-step'); t = norm(await text('#tr-read')); L = +(await data('#tr-svg', 'loss'));
  if (/dead/.test(t) && Math.abs(L - 1250) < 1e-6) okay('η = 2×10⁻³: dead after 2 steps, ŷ = 0, L = 1250'); else fail('train dead ' + t);
  await click('#tr-scale'); await setRange('tr-eta', Math.log10(5e-4)); await click('#tr-run'); for (let k = 0; k < 40 && +(await data('#tr-svg', 'step')) < 80; k++) await page.waitForTimeout(400); await click('#tr-run'); L = +(await data('#tr-svg', 'loss'));
  if (L < 1e-6) okay('scaled inputs, η = 5×10⁻⁴: converges (L = ' + L.toExponential(1) + ')'); else fail('train scaled ' + L);
  const worst = await page.evaluate(() => window.U15Train.check()); if (worst < 1e-6) okay('gradient check on all 20 numbers: worst relative gap ' + worst.toExponential(1)); else fail('grad check ' + worst);
  await click('#tr-scale'); const w0 = await page.evaluate(() => window.U15Train.check()); const rows = await page.evaluate(() => document.querySelectorAll('#tr-gc tr').length);
  if (w0 < 1e-6 && rows === 22) okay('at the start: 20 rows, worst gap ' + w0.toExponential(1)); else fail('grad check start ' + w0 + ' ' + rows);
  await setRange('tr-eta', -5);
  await show('#w-canyon'); let cs = (await data('#cy-3d', 'state')).split(','); if (cs[0] === 'raw' && +cs[3] < 1e-6) okay('raw, η = 10⁻⁵: the ball reaches the canyon floor (L ' + (+cs[3]).toExponential(1) + ')'); else fail('canyon ' + cs);
  await click('#cy-eta [data-eta="0.2"]'); t = norm(await text('#cy-read')); if (/flew out/.test(t)) okay('raw, η = 0.2: the ball flies out'); else fail('canyon 0.2 raw ' + t);
  await click('#cy-scale'); cs = (await data('#cy-3d', 'state')).split(','); if (cs[0] === 'scaled' && +cs[3] < 1e-6) okay('scaled, η = 0.2: rolls to the floor (L ' + (+cs[3]).toExponential(1) + ')'); else fail('canyon scaled ' + cs);
  await click('#cy-eta [data-eta="6e-5"]'); await click('#cy-scale'); await click('#cy-play'); await page.waitForTimeout(3300);
  const ly = await page.evaluate(() => [window.U15Canyon.lossAt(0, 0), window.U15Canyon.st.path.length]); if (Math.abs(ly[0] - 50) < 1e-9 && ly[1] === 41) okay('η = 6×10⁻⁵ raw: 40 bouncing steps from L = 50'); else fail('canyon path ' + ly);
  await click('#cy-eta [data-eta="1e-5"]');

  console.log('— §10 · w-depth —');
  await show('#w-depth'); let r0 = +(await data('#dp-3d', 'ratio'));
  if (r0 < 1e-4) okay('sigmoid, 12 layers: the first layer gets ' + r0.toExponential(1) + ' of the top blame'); else fail('depth sigmoid ' + r0);
  await click('#dp-act [data-t="relu"]'); let r1 = +(await data('#dp-3d', 'ratio')); if (r1 > r0 * 100) okay('ReLU: ' + r1.toExponential(1) + ' — far less fading'); else fail('depth relu ' + r1);
  await click('#dp-scale [data-s="2"]'); let r2 = +(await data('#dp-3d', 'ratio')); if (r2 > r1) okay('weights × 2: ' + r2.toExponential(1) + ' — the blame grows on the way down'); else fail('depth x2 ' + r2);
  await click('#dp-scale [data-s="1"]'); await setRange('dp-bias', -3); const asl = +(await data('#dp-3d', 'asleep')), bot = +(await data('#dp-3d', 'bottom'));
  if (asl > 24 && bot === 0) okay('bias −3: ' + asl + ' neurons asleep, no blame reaches the first layer'); else fail('depth bias ' + asl + ' ' + bot);
  await setRange('dp-bias', 0); await click('#dp-act [data-t="tanh"]'); await setRange('dp-n', 20); await click('#dp-seed'); await click('#dp-play'); await page.waitForTimeout(3000); await click('#dp-scale [data-s="0.5"]');

  console.log('— checks, drawers, practice —');
  const nOk = await page.evaluate(() => { let n = 0; document.querySelectorAll('.check').forEach(ch => { const b = ch.querySelector('.opts button[data-correct]'); if (b) { b.click(); n++; } }); return n; });
  await page.waitForTimeout(300);
  const sc2 = await page.evaluate(() => [document.getElementById('score').textContent, document.getElementById('score-chip').classList.contains('done'), (localStorage.getItem('mfml-u15-checks') || '').split(',').filter(Boolean).length]);
  if (nOk === 20 && sc2[0] === '20' && sc2[1] && sc2[2] === 20) okay('all 20 checks answerable; score 20/20 stored under mfml-u15-checks'); else fail('checks ' + nOk + ' ' + JSON.stringify(sc2));
  const wrong = await page.evaluate(() => { const ch = document.querySelector('.check'); const b = ch.querySelector('.opts button:not([data-correct])'); b.click(); return ch.querySelector('.why').textContent.slice(0, 20); });
  if (/Not quite/.test(wrong)) okay('a wrong answer explains itself'); else fail('wrong answer: ' + wrong);
  const dr = await page.evaluate(() => { const ds = [...document.querySelectorAll('details.algebra')]; ds.forEach(d => d.open = true); return ds.every(d => d.querySelector('.derive') && d.querySelector('.derive').offsetHeight > 0); });
  if (dr) okay('all 8 drawers open and show their derivations'); else fail('drawers');
  const pr = await page.evaluate(() => { const ss = [...document.querySelectorAll('#spractice details.sol')]; const closed = ss.every(d => !d.open); ss.forEach(d => d.open = true); return [ss.length, closed, document.querySelectorAll('#spractice .pans').length, document.querySelectorAll('#spractice .pstep').length, !!document.querySelector('#spractice .next-card'), document.querySelector('#spractice .sec-num').textContent]; });
  if (pr[0] === 14 && pr[1] && pr[2] === 14 && pr[3] > 45 && pr[4] && pr[5] === '13') okay('practice: 14 solutions (closed at load), 14 answer lines, ' + pr[3] + ' steps, next-card inside, § 13'); else fail('practice ' + JSON.stringify(pr));
  const nc = norm(await text('#spractice .next-card')); if (/Unit 16 · Words as Vectors/.test(nc) && /upcoming/.test(nc)) okay('next-card: Unit 16 · Words as Vectors — upcoming'); else fail('next-card: ' + nc);
  const wide2 = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide2) okay('with every drawer and solution open, no display equation overflows at 1300px'); else fail(wide2 + ' display equations overflow (drawers open)');

  console.log('— narrow screens —');
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(500);
    const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, [...document.querySelectorAll('.katex-display')].filter(k => k.offsetParent && k.scrollWidth > k.clientWidth + 1).length]);
    if (o[0] <= o[1] + 1 && !o[2]) okay(w + 'px: no horizontal overflow, every display equation fits'); else fail(w + 'px overflow ' + JSON.stringify(o)); }
  await page.setViewportSize({ width: 1300, height: 950 });

  console.log('— theme flip —');
  await page.click('#theme-btn'); await page.waitForTimeout(1200); await page.click('#theme-btn'); await page.waitForTimeout(600);

  console.log('— console —');
  if (!errors.length) okay('no console or page errors'); else errors.slice(0, 10).forEach(fail);
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ UNIT 15 WIDGETS PASS');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
