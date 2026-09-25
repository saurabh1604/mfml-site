/* Unit 14 · Thinking in Probabilities — widget behaviour and the numbers the page shows (WebGL on).
   PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u14.js */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && /U14|stage failed|context lost/.test(m.text()))) errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const text = sel => page.locator(sel).innerText();
  const norm = s => s.replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  const show = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); };
  const click = async (sel, w) => { await page.locator(sel).first().click(); await page.waitForTimeout(w || 350); };
  const until = async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn)) return true; await page.waitForTimeout(250); } return false; };

  await page.goto('file:///home/claude/mfml-site/site/unit-14.html');
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.waitForTimeout(2500);

  console.log('— page —');
  const c = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length, w3d: [...document.querySelectorAll('.widget')].filter(w => w.querySelector('.stage3d')).length,
    derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length,
    stages: document.querySelectorAll('.stage-canvas canvas').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u14-total'), T: document.title,
    scoreTotal: document.getElementById('score-total').textContent, crumb: document.querySelector('.topbar .crumb').textContent, kicker: document.querySelector('.hero .kicker').textContent,
    secs: [...document.querySelectorAll('section.unit')].map(s => s.id).join(',') }));
  if (c.checks === 20 && c.total === '20' && c.scoreTotal === '20') okay('20 checks, total published, #score-total = 20'); else fail('checks ' + JSON.stringify(c));
  if (c.widgets === 16 && c.w3d === 5 && c.derives === 18 && c.probs === 14 && c.drawers === 10) okay('16 widgets (5 in 3D) · 18 derivations in 10 drawers · 14 problems'); else fail('counts ' + JSON.stringify(c));
  if (c.secs === 's1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13,s14,spractice') okay('sections s1…s14 + spractice'); else fail('sections ' + c.secs);
  if (c.stages >= 1 && c.stages <= 4) okay(c.stages + ' WebGL stage(s) mounted at load (lazy)'); else fail('stages ' + c.stages);
  if (!c.katex) okay('no KaTeX errors'); else fail('katex-error ×' + c.katex);
  if (/^Unit 14 · Thinking in Probabilities/.test(c.T) && /Unit 14 · Thinking in Probabilities/.test(c.crumb) && /Unit 14 of 20/.test(c.kicker)) okay('title, crumb and kicker say Unit 14 (of 20)'); else fail('title/crumb ' + JSON.stringify([c.T, c.crumb, c.kicker]));
  const chips = norm(await text('.hero .meta'));
  if (/16 interactive widgets · 5 in 3D/.test(chips) && /20 inline checks/.test(chips) && /18 proofs/.test(chips) && /14 solved practice problems/.test(chips)) okay('hero chips match the counts'); else fail('hero chips: ' + chips);
  const wide = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide) okay('no display equation overflows at 1300px'); else fail(wide + ' display equations overflow');
  const leak = await page.evaluate(() => { const h = document.documentElement.innerHTML.replace(/mfml-/g, ''); return (h.match(/MFML|ZC416|BITS|WILP/) || h.match(/exam paper|question bank|past paper|\bexams?\b/i) || [''])[0]; });
  if (!leak) okay('no brand leak, no "exam" wording'); else fail('brand leak: ' + leak);
  const nav = await page.evaluate(() => ({ prev: !!document.querySelector('a[href="unit-13.html"]'), next: !!document.querySelector('#spractice .next-card a[href="unit-15.html"]'), toc: document.querySelector('.toc-nav') && document.querySelector('.toc-nav').textContent }));
  if (nav.prev && nav.next && /Unit 13/.test(nav.toc || '') && /Unit 15/.test(nav.toc || '')) okay('Unit 13 ← → Unit 15 in the hero, next-card and contents switcher'); else fail('nav ' + JSON.stringify(nav));
  const hero = await page.evaluate(() => ({ canvas: !!document.querySelector('#hero-3d canvas'), phase: document.getElementById('hero-3d').dataset.phase }));
  if (hero.canvas && hero.phase) okay('hero stage running (phase: ' + hero.phase + ')'); else fail('hero ' + JSON.stringify(hero));

  console.log('— §1 · w-galton —');
  await show('#w-galton'); await click('#gl-reset'); await click('#gl-2000');
  const galDone = await until(() => { const g = U14G.get(); return g.N === 2000 && !g.flying && !g.queue; }, 60000);
  let g = await page.evaluate(() => U14G.get()); let t = norm(await text('#gl-kv')) + ' ' + norm(await text('#gl-verdict'));
  if (galDone && Math.abs(g.mean - 6) < .15 && /2000/.test(t) && /the shape is the knowledge/i.test(t)) okay('drop 2000: every bead lands, pile centre ' + g.mean.toFixed(2) + ' ≈ n·p = 6'); else fail('galton ' + JSON.stringify(g) + ' ' + t);
  await setRange('gl-bias', .75); t = norm(await text('#gl-kv')); if (/beads dropped 0/.test(t) && /\b9\b/.test(t)) okay('bias 0.75 empties the board and predicts centre n·p = 9'); else fail('bias ' + t);
  await click('#gl-1'); await until(() => { const g = U14G.get(); return g.N === 1 && !g.flying; }, 45000); g = await page.evaluate(() => U14G.get()); if (g.N === 1) okay('drop 1: one bead lands'); else fail('drop1 ' + JSON.stringify(g));
  await setRange('gl-rows', 12); await setRange('gl-bias', .5);

  console.log('— §2 · w-dice, w-density —');
  await show('#w-dice'); await click('#dc-level'); await until(() => U14D.state().level, 8000); t = norm(await text('#dc-verdict')) + ' ' + norm(await text('#dc-kv'));
  if (/level at 7/.test(t) && /5\.833/.test(t) && /2\.415/.test(t)) okay('2 dice: the plank levels at 7; Var 5.833, σ 2.415'); else fail('dice ' + t);
  await click('#dc-tabs [data-t="3"]'); await click('#dc-level'); await until(() => U14D.state().level, 8000); t = norm(await text('#dc-verdict')) + ' ' + norm(await text('#dc-kv'));
  if (/10\.5/.test(t) && /8\.750/.test(t)) okay('3 dice: mean 10.5, Var 8.750'); else fail('3 dice ' + t);
  await click('#dc-tabs [data-t="2"]'); await click('#dc-roll'); await until(() => U14D.state().nR === 600, 12000); t = norm(await text('#dc-kv')); if (/600 · average 7\.\d/.test(t) || /600 · average 6\.9/.test(t)) okay('▶ roll: 600 rolls, average ≈ 7'); else fail('roll ' + t);
  await show('#w-density'); t = norm(await text('#dn-kv')); if (/0\.399/.test(t) && /0\.683/.test(t) && /1\.000/.test(t)) okay('σ = 1: peak 0.399, P(4..6) = 0.683, total area 1.000'); else fail('density ' + t);
  await click('#dn-p-narrow'); await until(() => /3\.989/.test(document.getElementById('dn-kv').textContent), 10000); t = norm(await text('#dn-kv')) + ' ' + norm(await text('#dn-verdict')); if (/3\.989/.test(t) && /above 1/.test(t) && /total area under the curve 1\.000/.test(t)) okay('σ = 0.1: peak 3.989 above 1, total area still 1.000'); else fail('narrow ' + t);
  await click('#dn-p-exact'); t = norm(await text('#dn-kv')); if (/area 0\.000/.test(t)) okay('exactly 5: zero width, zero probability'); else fail('exact ' + t);

  console.log('— §3 · w-bayes —');
  await show('#w-bayes'); await click('#by-reset'); t = norm(await text('#by-kv'));
  if (/100 · 99/.test(t) && /9,900 · 495/.test(t) && /594/.test(t) && /0\.167/.test(t)) okay('the clinic: 99 + 495 = 594 positives, P(sick | +) = 0.167 = 1/6'); else fail('bayes ' + t);
  await click('#by-again'); await until(() => Math.abs(U14B.prev - 1 / 6) < 1e-9, 10000); t = norm(await text('#by-kv')); if (/0\.798/.test(t) && /16\.7%/.test(t)) okay('test again: prior 16.7% → posterior 0.798'); else fail('bayes 2 ' + t);
  await click('#by-reset'); await setRange('by-fpr', 1); t = norm(await text('#by-kv')); if (/0\.500/.test(t)) okay('false alarms 1%: posterior 0.500'); else fail('fpr ' + t);
  await click('#by-reset');

  console.log('— §4 · w-bell, w-clt —');
  await show('#w-bell'); t = norm(await text('#bl-kv')) + ' ' + norm(await text('#bl-verdict'));
  if (/95\.4%/.test(t) && /z-score \(x - μ\)\/σ 1\.50/.test(t) && /0\.0162/.test(t)) okay('±2σ = 95.4%; 172 cm has z = 1.50, density 0.0162'); else fail('bell ' + t);
  await click('#bl-k1'); await setRange('bl-sig', 12); t = norm(await text('#bl-kv')); if (/68\.3%/.test(t)) okay('±1σ = 68.3%, whatever σ'); else fail('bell k1 ' + t);
  await click('#bl-k3'); t = norm(await text('#bl-kv')); if (/99\.7%/.test(t)) okay('±3σ = 99.7%'); else fail('bell k3 ' + t);
  await setRange('bl-sig', 8);
  await show('#w-clt'); await click('#ct-p10'); t = norm(await text('#ct-kv')); if (/0\.692/.test(t) && /2\.188/.test(t)) okay('n = 10: spread 2.188/√10 = 0.692'); else fail('clt ' + t);
  await click('#ct-play'); await until(() => /rolls averaged n30|rolls averaged n 30/.test(document.getElementById('ct-kv').textContent.replace(/\s+/g,' ')), 25000); t = norm(await text('#ct-kv')); if (/rolls averaged n 30/.test(t)) okay('▶ add rolls runs to n = 30'); else fail('clt play ' + t);

  console.log('— §5 · w-gauss2d —');
  await show('#w-gauss2d'); await page.waitForTimeout(1500);
  t = norm(await text('#g2-kv')); if (/3, 1/.test(t) && /\(0\.707, 0\.707\)/.test(t) && /3 · 0\.0919/.test(t) && /plain distance 1\.414/.test(t) && /Mahalanobis distance d 1\.414/.test(t)) okay('Σ = [[2,1],[1,2]]: λ = 3, 1; axis (1,1)/√2; det 3, peak 0.0919; probe (1,−1): 1.414 both'); else fail('g2 ' + t);
  await page.evaluate(() => U14N.set([1, 1])); t = norm(await text('#g2-kv')) + ' ' + norm(await text('#g2-verdict')); if (/Mahalanobis distance d 0\.816/.test(t) && /long axis/.test(t)) okay('probe (1, 1): Mahalanobis 0.816, along the long axis'); else fail('g2 (1,1) ' + t);
  await click('#g2-p-round'); await until(() => { const g = U14N.get(); return g.rho === 0 && g.s1 === 1; }, 10000); t = norm(await text('#g2-verdict')); if (/ρ = 0/.test(t) && /circle/.test(t)) okay('round preset: ρ = 0, a circle'); else fail('g2 round ' + t);
  await click('#g2-slice'); t = await text('#g2-slice'); if (/on/.test(t)) okay('slice toggles on'); else fail('slice ' + t);
  const g2c = await page.evaluate(() => !!document.querySelector('#g2-3d canvas')); if (g2c) okay('the mountain stage mounted'); else fail('g2 stage');
  const box = await page.locator('#g2-3d').boundingBox(); await page.mouse.move(box.x + box.width * .3, box.y + box.height * .5); await page.mouse.down(); await page.mouse.move(box.x + box.width * .45, box.y + box.height * .45, { steps: 5 }); await page.mouse.up(); okay('drag on the stage (orbit or probe) raises no error');
  await click('#g2-p-worked', 1300); await click('#g2-slice');

  console.log('— §6 · w-stretch —');
  await show('#w-stretch'); t = norm(await text('#st-kv')); if (/L 2 0 1 1/.test(t) && /Σ = LLᵀ 4 2 2 2/.test(t)) okay('L = [[2,0],[1,1]] → Σ = [[4,2],[2,2]]'); else fail('stretch ' + t);
  const sc6 = await page.evaluate(() => U14S.get()); if (Math.abs(sc6.C[0][0] - 4) < .6 && Math.abs(sc6.C[0][1] - 2) < .4 && Math.abs(sc6.C[1][1] - 2) < .35) okay('400 stretched points have covariance ≈ Σ (' + sc6.C.flat().map(v => v.toFixed(2)).join(', ') + ')'); else fail('cov ' + JSON.stringify(sc6));
  await click('#st-play', 3000); await setRange('st-l21', 0); t = norm(await text('#st-verdict')); if (/no lean/.test(t)) okay('ℓ₂₁ = 0: the ellipse stands straight'); else fail('lean ' + t);
  await click('#st-tabs [data-t="S"]'); await setRange('st-s12', 3); t = norm(await text('#st-verdict')); if (/not positive definite/.test(t)) okay('Σ₁₂ = 3 with Σ₁₁ = 4, Σ₂₂ = 1: rejected, no real L'); else fail('pd ' + t);
  await click('#st-tabs [data-t="L"]'); await click('#st-p-worked');

  console.log('— §7 · w-coin —');
  await show('#w-coin'); await click('#co-p7'); t = norm(await text('#co-kv')); if (/best coin p̂ = h\/n 0\.7/.test(t) && /2\.224e-3 · -6\.109/.test(t) && /0\.439/.test(t)) okay('7 of 10: p̂ = 0.7, L(p̂) = 2.224e−3, log L = −6.109; the fair coin 0.439 as well'); else fail('coin ' + t);
  await click('#co-p70'); t = norm(await text('#co-kv')); if (/100 · 70/.test(t) && /p̂ = h\/n 0\.7/.test(t)) okay('70 of 100: same peak'); else fail('coin70 ' + t);
  await click('#co-toss'); t = norm(await text('#co-kv')); if (/110 ·/.test(t)) okay('▶ toss 10 more: 110 tosses'); else fail('toss ' + t);

  console.log('— §8 · w-mle —');
  await show('#w-mle'); await click('#ml-p-narrow'); await until(() => U14M.get().sg === 1, 8000); t = norm(await text('#ml-verdict')); if (/too narrow/.test(t)) okay('too narrow explains itself'); else fail('narrow ' + t);
  await click('#ml-p-wide'); await until(() => U14M.get().sg === 4.5, 8000); t = norm(await text('#ml-verdict')); if (/too wide/.test(t)) okay('too wide explains itself'); else fail('wide ' + t);
  await click('#ml-p-off'); await until(() => U14M.get().mu === 3, 8000); t = norm(await text('#ml-verdict')); if (/off-centre/.test(t)) okay('off-centre explains itself'); else fail('off ' + t);
  await click('#ml-climb'); await until(() => { const m = U14M.get(); return m.mu === 5 && m.sg === 2; }, 20000); t = norm(await text('#ml-kv')) + ' ' + norm(await text('#ml-verdict'));
  if (/\(5\.00, 2\.00\)/.test(t) && /-16\.897/.test(t) && /μ̂ = 5/.test(t)) okay('▶ climb stops at the peak (5, 2), ℓ = −16.897'); else fail('climb ' + t);

  console.log('— §9 · w-lsq —');
  await show('#w-lsq'); await click('#ls-fit'); await until(() => Math.abs(U14L.get().w - 1.1) < 1e-9, 12000); t = norm(await text('#ls-kv')) + ' ' + norm(await text('#ls-verdict'));
  if (/y = 1\.100x \+ 1\.100/.test(t) && /squared error Σr² 2\.700/.test(t) && /-5\.026/.test(t)) okay('best fit under bell noise: w = b = 1.1, squared error 2.700, ℓ = −5.026'); else fail('lsq ' + t);
  await click('#ls-out'); await click('#ls-fit'); await until(() => Math.abs(U14L.get().w - U14L.get().ls[0]) < 1e-9, 12000); t = norm(await text('#ls-kv')); if (/y = 0\.654x \+ 2\.885/.test(t)) okay('with the outlier, least squares tilts to 0.654x + 2.885'); else fail('lsq out ' + t);
  await click('#ls-tabs [data-t="laplace"]'); await click('#ls-fit'); await until(() => Math.abs(U14L.get().w - 4 / 3) < 1e-9, 12000); t = norm(await text('#ls-kv')) + ' ' + norm(await text('#ls-verdict'));
  if (/y = 1\.333x \+ 1\.000/.test(t) && /absolute error Σ\|r\| 8\.000/.test(t) && /barely matters/.test(t)) okay('Laplace noise: 1.333x + 1.000, the outlier barely matters'); else fail('lad ' + t);
  await click('#ls-out'); await click('#ls-tabs [data-t="gauss"]');

  console.log('— §10 · w-softmax, w-simplex —');
  await show('#w-softmax'); await click('#sm-p-base'); t = norm(await text('#sm-bars')) + ' ' + norm(await text('#sm-kv'));
  if (/cat 0\.665/.test(t) && /dog 0\.245/.test(t) && /rabbit 0\.090/.test(t) && /11\.107/.test(t) && /1\.000/.test(t)) okay('scores 2, 1, 0 → 0.665, 0.245, 0.090 (total 11.107, sum 1.000)'); else fail('softmax ' + t);
  await click('#sm-shift'); t = norm(await text('#sm-bars')) + ' ' + norm(await text('#sm-verdict')); if (/0\.665/.test(t) && /not one probability changed/.test(t)) okay('subtract the max: nothing moves'); else fail('shift ' + t);
  await click('#sm-shift'); await setRange('sm-T', Math.log10(.5)); t = norm(await text('#sm-bars')); if (/0\.867/.test(t) && /0\.117/.test(t) && /0\.016/.test(t)) okay('T = 0.5 → 0.867, 0.117, 0.016'); else fail('T .5 ' + t);
  await setRange('sm-T', Math.log10(2)); t = norm(await text('#sm-bars')); if (/0\.506/.test(t) && /0\.307/.test(t) && /0\.186/.test(t)) okay('T = 2 → 0.506, 0.307, 0.186'); else fail('T 2 ' + t);
  await setRange('sm-T', 0);
  await show('#w-simplex'); t = norm(await text('#sx-kv')); if (/0\.665, 0\.245, 0\.090/.test(t) && /0\.421/.test(t)) okay('the triangle shows the same point, 0.421 from the centre'); else fail('simplex ' + t);
  await click('#sx-play'); await until(() => U14X.get().T === 20, 20000); t = norm(await text('#sx-kv')); if (/temperature T 20/.test(t)) okay('▶ sweep T ends at T = 20'); else fail('sweep ' + t);
  const sx3 = await page.evaluate(() => !!document.querySelector('#sx-3d canvas')); if (sx3) okay('the triangle stage mounted'); else fail('simplex stage');

  console.log('— §11 · w-entropy —');
  await show('#w-entropy'); await click('#en-p-9010'); t = norm(await text('#en-kv')); if (/0\.469 bits/.test(t) && /0\.325 nats/.test(t)) okay('90/10 coin: 0.469 bits = 0.325 nats'); else fail('entropy ' + t);
  await click('#en-p-uni3'); t = norm(await text('#en-kv')) + ' ' + norm(await text('#en-verdict')); if (/1\.585 bits/.test(t) && /top of the dome/.test(t)) okay('three equal: 1.585 bits, the top of the dome'); else fail('uni3 ' + t);
  await click('#en-p-sure'); t = norm(await text('#en-verdict')); if (/zero entropy/.test(t)) okay('certain: zero entropy'); else fail('sure ' + t);
  await click('#en-p-fair'); t = norm(await text('#en-kv')); if (/0\.5 · 1\.000 bits/.test(t)) okay('fair coin: 1 bit'); else fail('fair ' + t);

  console.log('— §12 · w-kl —');
  await show('#w-kl'); await click('#kl-p-mumbai'); t = norm(await text('#kl-kv'));
  if (/1\.000 bits/.test(t) && /1\.737 bits/.test(t) && /0\.737 bits/.test(t) && /0\.531 bits/.test(t)) okay('Mumbai in July: H(p) 1, H(p,q) 1.737, KL(p‖q) 0.737, KL(q‖p) 0.531'); else fail('kl ' + t);
  await click('#kl-swap'); t = norm(await text('#kl-kv')); if (/KL\(p‖q\) — the price 0\.531/.test(t)) okay('swap p and q: the price becomes 0.531 — not symmetric'); else fail('swap ' + t);
  await click('#kl-p-match'); t = norm(await text('#kl-kv')); if (/KL\(p‖q\) — the price 0\.000/.test(t)) okay('belief = truth: KL = 0'); else fail('match ' + t);
  await setRange('kl-k', 4); t = norm(await text('#kl-stack')); if (/H\(p\)/.test(t)) okay('4 outcomes redraw'); else fail('k4 ' + t);
  await click('#kl-tabs [data-t="fit"]'); await click('#kl-fwd'); await until(() => Math.abs(U14K.get().fsg - 2.0880615) < 1e-5, 20000); t = norm(await text('#kl-kv')) + ' ' + norm(await text('#kl-verdict'));
  if (/0\.00, 2\.09/.test(t) && /mass-covering/.test(t)) okay('fit by KL(p‖q): middle 0.00, spread 2.09 — covers both humps'); else fail('fwd ' + t);
  await click('#kl-rev'); await until(() => Math.abs(U14K.get().fsg - .6048553) < 1e-5, 20000); t = norm(await text('#kl-kv')) + ' ' + norm(await text('#kl-verdict'));
  if (/2\.00, 0\.60/.test(t) && /mode-seeking/.test(t) && /0\.692/.test(t)) okay('fit by KL(q‖p): middle 2.00, spread 0.60 — locks onto one hump'); else fail('rev ' + t);
  await click('#kl-tabs [data-t="bars"]'); await setRange('kl-k', 2); await click('#kl-p-mumbai');

  console.log('— §13 · w-train —');
  await show('#w-train'); await click('#tr-reset'); t = norm(await text('#tr-kv')); if (/1\.099/.test(t) && /steps 0/.test(t)) okay('untrained: loss ln 3 = 1.099'); else fail('train0 ' + t);
  await click('#tr-step'); t = norm(await text('#tr-kv')); if (/steps 1\b/.test(t)) okay('one step'); else fail('step ' + t);
  await click('#tr-run'); await until(() => U14T.get().step === 201, 30000); const tr = await page.evaluate(() => U14T.get());
  if (tr.step === 201 && tr.loss < .3 && tr.acc > .85) okay('▶ train: 201 steps, loss ' + tr.loss.toFixed(3) + ', ' + Math.round(tr.acc * 75) + ' of 75 right'); else fail('train ' + JSON.stringify(tr));
  await setRange('tr-T', .3); const tr2 = await page.evaluate(() => U14T.get()); if (Math.max(...tr2.probe) > Math.max(...tr.probe)) okay('temperature 0.3: the same model is more sure at the probe'); else fail('temp ' + JSON.stringify([tr.probe, tr2.probe]));
  await setRange('tr-T', 1);

  console.log('— checks, drawers, practice —');
  const nOk = await page.evaluate(() => { let n = 0; document.querySelectorAll('.check').forEach(ch => { const b = ch.querySelector('.opts button[data-correct]'); if (b) { b.click(); n++; } }); return n; });
  await page.waitForTimeout(300);
  const sc = await page.evaluate(() => [document.getElementById('score').textContent, document.getElementById('score-chip').classList.contains('done'), (localStorage.getItem('mfml-u14-checks') || '').split(',').filter(Boolean).length]);
  if (nOk === 20 && sc[0] === '20' && sc[1] && sc[2] === 20) okay('all 20 checks answerable; score 20/20 stored under mfml-u14-checks'); else fail('checks ' + nOk + ' ' + JSON.stringify(sc));
  const oneRight = await page.evaluate(() => [...document.querySelectorAll('.check')].every(ch => ch.querySelectorAll('.opts button[data-correct]').length === 1 && ch.querySelectorAll('.opts button').length === 3));
  if (oneRight) okay('every check has exactly one right answer among three'); else fail('check options');
  const wrong = await page.evaluate(() => { const ch = document.querySelector('.check'); const b = ch.querySelector('.opts button:not([data-correct])'); b.click(); return ch.querySelector('.why').textContent.slice(0, 20); });
  if (/Not quite/.test(wrong)) okay('a wrong answer explains itself'); else fail('wrong answer: ' + wrong);
  const dr = await page.evaluate(() => { const ds = [...document.querySelectorAll('details.algebra')]; ds.forEach(d => d.open = true); return ds.every(d => d.querySelector('.derive') && d.querySelector('.derive').offsetHeight > 0); });
  if (dr) okay('all 10 drawers open and show their derivations'); else fail('drawers');
  const pr = await page.evaluate(() => { const ss = [...document.querySelectorAll('#spractice details.sol')]; const closed = ss.every(d => !d.open); ss.forEach(d => d.open = true); return [ss.length, closed, document.querySelectorAll('#spractice .pans').length, document.querySelectorAll('#spractice .pstep').length, !!document.querySelector('#spractice .next-card'), document.querySelector('#spractice .sec-num').textContent]; });
  if (pr[0] === 14 && pr[1] && pr[2] === 14 && pr[3] > 50 && pr[4] && pr[5] === '15') okay('practice: 14 solutions (closed at load), 14 answer lines, ' + pr[3] + ' steps, next-card inside, § 15'); else fail('practice ' + JSON.stringify(pr));
  const nc = norm(await text('#spractice .next-card')); if (/Unit 15 · The Network, Whole/.test(nc) && !/upcoming/.test(nc)) okay('next-card: a live link to Unit 15 · The Network, Whole'); else fail('next-card: ' + nc);
  const wide2 = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide2) okay('with every drawer and solution open, no display equation overflows at 1300px'); else fail(wide2 + ' display equations overflow (drawers open)');

  console.log('— phone width —');
  for (const W of [360, 390]) {
    const ph = await browser.newPage({ viewport: { width: W, height: 844 } });
    ph.on('pageerror', e => errors.push('PAGEERROR (' + W + '): ' + String(e).slice(0, 200)));
    await ph.goto('file:///home/claude/mfml-site/site/unit-14.html'); await ph.waitForTimeout(1200);
    const m = await ph.evaluate(() => { document.querySelectorAll('details').forEach(d => d.open = true);
      const wideK = [...document.querySelectorAll('.katex-display')].filter(k => { const h = k.querySelector('.katex-html'); return k.scrollWidth > k.clientWidth + 2 || (h && h.scrollWidth > h.clientWidth + 2); }).length;
      return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth, wideK }; });
    if (m.page <= 0 && (W === 360 || m.wideK === 0)) okay(W + 'px: no horizontal page overflow' + (W === 390 ? ', every display equation fits' : '')); else fail(W + 'px: ' + JSON.stringify(m));
    await ph.close();
  }

  console.log('— theme flip —');
  await page.click('#theme-btn'); await page.waitForTimeout(1200); await page.click('#theme-btn'); await page.waitForTimeout(600);

  console.log('— console —');
  if (!errors.length) okay('no console or page errors'); else errors.slice(0, 10).forEach(fail);
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ UNIT 14 WIDGETS PASS');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
