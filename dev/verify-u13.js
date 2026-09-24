/* Unit 13 · Support Vector Machines — widget behaviour, the live solver, and numerical correctness (WebGL on).
   PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u13.js */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && /U13/.test(m.text()))) errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const text = sel => page.locator(sel).innerText();
  const norm = s => s.replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  const show = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); };
  const click = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(350); };

  await page.goto('file:///home/claude/mfml-site/site/unit-13.html');
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.waitForTimeout(2500);

  console.log('— page —');
  const c = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length, w3d: document.querySelectorAll('.widget .stage3d').length,
    derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length,
    stages: document.querySelectorAll('.stage-canvas canvas').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u13-total'), T: document.title,
    scoreTotal: document.getElementById('score-total').textContent, crumb: document.querySelector('.topbar .crumb').textContent, kicker: document.querySelector('.hero .kicker').textContent }));
  if (c.checks === 20 && c.total === '20' && c.scoreTotal === '20') okay('20 checks, total published, #score-total = 20'); else fail('checks ' + JSON.stringify(c));
  if (c.widgets === 16 && c.w3d === 8 && c.derives === 21 && c.probs === 16 && c.drawers === 12) okay('16 widgets (8 in 3D) · 21 derivations in 12 drawers · 16 problems'); else fail('counts ' + JSON.stringify(c));
  if (c.stages >= 1 && c.stages <= 4) okay(c.stages + ' WebGL stage(s) mounted at load (lazy)'); else fail('stages ' + c.stages);
  if (!c.katex) okay('no KaTeX errors'); else fail('katex-error ×' + c.katex);
  if (/^Unit 13 · Support Vector Machines/.test(c.T) && /Unit 13 · Support Vector Machines/.test(c.crumb) && /Unit 13 of 20/.test(c.kicker)) okay('title, crumb and kicker say Unit 13'); else fail('title/crumb ' + JSON.stringify([c.T, c.crumb, c.kicker]));
  const chips = norm(await text('.hero .meta'));
  if (/16 interactive widgets · 8 in 3D/.test(chips) && /20 inline checks/.test(chips) && /21 proofs/.test(chips) && /16 solved practice problems/.test(chips)) okay('hero chips match the counts'); else fail('hero chips: ' + chips);
  const wide = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide) okay('no display equation overflows at 1300px'); else fail(wide + ' display equations overflow');
  const leak = await page.evaluate(() => { const h = document.documentElement.innerHTML.replace(/mfml-/g, ''); return (h.match(/MFML|ZC416|BITS|WILP/) || h.match(/exam paper|question bank|past paper/i) || [''])[0]; });
  if (!leak) okay('no brand leak, no "exam paper" wording'); else fail('brand leak: ' + leak);
  const nav = await page.evaluate(() => ({ prev: !!document.querySelector('a[href="unit-12.html"]'), toc: document.querySelector('.toc-nav') && document.querySelector('.toc-nav').textContent }));
  if (nav.prev && /Unit 12/.test(nav.toc || '')) okay('previous-unit links to Unit 12 (hero, next-card, contents switcher)'); else fail('prev links ' + JSON.stringify(nav));

  console.log('— the solver (window.U13SVM) —');
  const sv = await page.evaluate(() => { const S = window.U13SVM, r = {};
    const a = S.solve([[1, 1], [-1, -1]], [1, -1]); r.two = [a.alpha, a.w, a.b];
    const x = S.solve([[1, 2], [-1, -2], [1, -2], [-1, 2]], [1, 1, -1, -1], { kernel: { type: 'poly', d: 2 } }); r.xnor = [x.alpha, x.b, x.f([2, 1]), x.f([-1, 3])];
    const q2 = S.solve([[0, 0], [2, 0], [0, -2]], [1, -1, -1], { kernel: { type: 'polyc', d: 2 } }); r.q2 = [q2.alpha, q2.b];
    const q3 = S.solve([[1, 1], [-1, -1], [2, 0], [-2, 0]], [1, 1, -1, -1], { kernel: { type: 'poly', d: 2 } }); r.q3 = [q3.alpha, q3.b];
    const q4 = S.solve([[0, 0], [1, 1], [1, -1], [3, 0]], [1, -1, -1, -1], { kernel: { type: 'polyc', d: 2 } }); r.q4 = [q4.alpha, q4.b];
    const q5 = S.solve([[1], [-1], [3], [-3]], [1, 1, -1, -1], { kernel: { type: 'polyc', d: 2 } }); r.q5 = [q5.alpha, q5.b];
    const q6 = S.solve([[4], [7], [1], [-3]], [1, 1, -1, -1]); r.q6 = [q6.alpha, q6.w, q6.b];
    const q7 = S.solve([[0, 3], [-2, 2], [2, 1], [3, 0]], [1, 1, -1, -1]); r.q7 = [q7.alpha, q7.w, q7.b];
    const q8 = S.solve([[1, 1], [4, 5]], [1, -1]); r.q8 = [q8.alpha, q8.w, q8.b];
    const q10 = S.solve([[1, 1], [2, 0], [0, 0]], [1, 1, -1]); r.q10 = [q10.alpha, q10.w, q10.b];
    const q11 = S.solve([[1, 1], [3, 3], [2, 0], [0, 2], [2, 2]], [1, 1, -1, -1, -1], { C: 1 }); r.q11 = [q11.w, q11.b, q11.primal];
    const ov = S.solve([[1, 2], [2.5, 0], [-1, -1], [-1, 1], [-1, 0]], [1, 1, -1, -1, 1]); r.over = [ov.ok, ov.infeasible];
    /* speed: forty RBF points */
    let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const X = [], Y = [];
    for (let i = 0; i < 40; i++) { const rr = i < 20 ? 1 : 2.2, t = rnd() * 6.283; X.push([rr * Math.cos(t), rr * Math.sin(t)]); Y.push(i < 20 ? 1 : -1); }
    S.solve(X, Y, { kernel: { type: 'rbf', gamma: 1 }, C: 10 }); r.ms = 1e9; for (let k = 0; k < 10; k++) { const t0 = performance.now(); S.solve(X, Y, { kernel: { type: 'rbf', gamma: 1 }, C: 10 }); r.ms = Math.min(r.ms, performance.now() - t0); }
    return r; });
  const near = (a, b, t = 1e-9) => Array.isArray(a) ? a.length === b.length && a.every((v, i) => near(v, b[i], t)) : Math.abs(a - b) < t;
  if (near(sv.two[0], [.25, .25]) && near(sv.two[1], [.5, .5]) && near(sv.two[2], 0)) okay('two points (1,1)/(−1,−1): α = ¼, w = (½,½), b = 0'); else fail('two points ' + JSON.stringify(sv.two));
  if (near(sv.xnor[0], [1 / 32, 1 / 32, 1 / 32, 1 / 32]) && near(sv.xnor[1], 0) && near(sv.xnor[2], 1) && near(sv.xnor[3], -1.5)) okay('XNOR with (xᵀz)²: α = 1/32 each, b = 0, f(2,1) = 1, f(−1,3) = −1.5'); else fail('xnor ' + JSON.stringify(sv.xnor));
  if (near(sv.q2[0], [1 / 6, 1 / 12, 1 / 12]) && near(sv.q2[1], 1)) okay('inner/outer with (xᵀz+1)²: α = (1/6, 1/12, 1/12), b = 1'); else fail('q2 ' + JSON.stringify(sv.q2));
  if (near(sv.q3[0], [1 / 12, 1 / 12, 1 / 12, 1 / 12]) && near(sv.q3[1], 1)) okay('diamond vs axis: α = 1/12 each, b = 1'); else fail('q3 ' + JSON.stringify(sv.q3));
  if (near(sv.q4[0], [.5, .25, .25, 0]) && near(sv.q4[1], 1)) okay('one idle point: α = (½, ¼, ¼, 0), b = 1'); else fail('q4 ' + JSON.stringify(sv.q4));
  if (near(sv.q5[0], [1 / 64, 1 / 64, 1 / 64, 1 / 64]) && near(sv.q5[1], 1.25)) okay('1-D kernel: α = 1/64 each (the smallest-norm choice), b = 5/4'); else fail('q5 ' + JSON.stringify(sv.q5));
  if (near(sv.q6[0], [2 / 9, 0, 2 / 9, 0]) && near(sv.q6[1], [2 / 3]) && near(sv.q6[2], -5 / 3)) okay('1-D hard margin: α = (2/9, 0, 2/9, 0), w = 2/3, b = −5/3'); else fail('q6 ' + JSON.stringify(sv.q6));
  if (near(sv.q7[0], [.25, 0, .25, 0]) && near(sv.q7[1], [-.5, .5]) && near(sv.q7[2], -.5)) okay('2-D KKT: α = (¼, 0, ¼, 0), w = (−½, ½), b = −½'); else fail('q7 ' + JSON.stringify(sv.q7));
  if (near(sv.q8[0], [.08, .08]) && near(sv.q8[1], [-.24, -.32]) && near(sv.q8[2], 1.56)) okay('two points (1,1)/(4,5): α = 0.08, w = (−0.24, −0.32), b = 1.56'); else fail('q8 ' + JSON.stringify(sv.q8));
  if (near(sv.q10[0], [1, 0, 1]) && near(sv.q10[1], [1, 1]) && near(sv.q10[2], -1)) okay('the trap: α = (1, 0, 1) — (2,0) on the edge with a zero price'); else fail('q10 ' + JSON.stringify(sv.q10));
  if (near(sv.q11[0], [.5, .5], 1e-7) && near(sv.q11[1], -2, 1e-7) && near(sv.q11[2], 3.25, 1e-7)) okay('soft margin C = 1: w = (½,½), b = −2, objective 3.25'); else fail('q11 ' + JSON.stringify(sv.q11));
  if (!sv.over[0] && sv.over[1]) okay('an overlapping point is reported as "no street exists"'); else fail('overlap ' + JSON.stringify(sv.over));
  if (sv.ms < 20) okay('40 RBF points solve in ' + sv.ms.toFixed(2) + ' ms (best of 10, < 20 ms)'); else fail('slow solve ' + sv.ms);

  console.log('— §1 · w-tilt —');
  await show('#w-tilt');
  let t = norm(await text('#tl-read'));
  if (/0\.839/.test(t)) okay('tilt 20°: width 0.839'); else fail('tilt read: ' + t);
  await click('#tl-p-c'); await page.waitForTimeout(1200); t = norm(await text('#tl-read')) + ' ' + norm(await text('#tl-verdict'));
  if (/2\.828/.test(t) && /widest/.test(t)) okay('tilt C (45°): width 2.828, the widest'); else fail('tilt 45: ' + t);
  await setRange('tl-t', 95); await page.waitForTimeout(300); t = norm(await text('#tl-verdict'));
  if (/no line splits|bad/.test(t)) okay('95°: no street'); else fail('tilt 95: ' + t);
  await click('#tl-play'); await page.waitForTimeout(9000); t = norm(await text('#tl-read'));
  if (/2\.828/.test(t)) okay('▶ find the widest ends at 2.828'); else fail('tilt play: ' + t);

  console.log('— §2 · w-probe —');
  await show('#w-probe');
  t = norm(await text('#pb-kv'));
  if (/8\.8/.test(t) && /2\.236/.test(t) && /3\.935/.test(t) && /right angles/.test(t)) okay('probe (4.4,5.2): f = 8.8, ‖w‖ = 2.236, distance 3.935, w·(p−q) = 0'); else fail('probe: ' + t);
  await setRange('pb-b', -10); await page.waitForTimeout(200); t = norm(await text('#pb-kv'));
  if (/4\.8\b/.test(t)) okay('b = −10 slides the line: f(4.4, 5.2) = 4.8'); else fail('probe b: ' + t);
  await setRange('pb-ang', 20); await click('#pb-on'); await page.waitForTimeout(6000); t = norm(await text('#pb-verdict'));
  if (/exactly 0/.test(t)) okay('"probe on the line" drops the probe onto the line (f = 0)'); else fail('probe on line: ' + t);
  await click('#pb-reset');

  console.log('— §3 · w-gap —');
  await show('#w-gap'); await click('#gp-p-face'); await page.waitForTimeout(2600); t = norm(await text('#gp-kv')) + ' ' + norm(await text('#gp-verdict'));
  if (/2\.828/.test(t) && /difference 0(\.000)?\b/.test(t) && /face to face/.test(t)) okay('face to face: ‖x⁺ − x⁻‖ = the width 2.828'); else fail('gap face: ' + t);
  await click('#gp-play'); await page.waitForTimeout(3200); t = norm(await text('#gp-kv'));
  if (/2 = 2c/.test(t)) okay('w·(x⁺ − x⁻) = 2 = 2c after sliding'); else fail('gap slide: ' + t);

  console.log('— §4 · w-scale —');
  await show('#w-scale'); t = norm(await text('#sc-kv'));
  if (/0\.866/.test(t) && /2\.309/.test(t) && /yes/.test(t)) okay('k = 1: ‖w‖ = 0.866, thickness 2.309, canonical'); else fail('scale k=1: ' + t);
  await setRange('sc-k', 3); await page.waitForTimeout(300); t = norm(await text('#sc-kv'));
  if (/2\.598/.test(t) && /2\.309/.test(t) && /no/.test(t) && /-6/.test(t)) okay('k = 3: ‖w‖ = 2.598, b = −6, thickness still 2.309, not canonical'); else fail('scale k=3: ' + t);
  await click('#sc-edge'); await page.waitForTimeout(400); await click('#sc-edge');

  console.log('— §5 · w-qp —');
  await show('#w-qp'); await click('#qp-play'); await page.waitForTimeout(6000); t = norm(await text('#qp-read')) + ' ' + norm(await text('#qp-verdict'));
  if (/\(0\.8, 0\.4\)/.test(t) && /0\.4\b/.test(t) && /2\.236/.test(t) && /corner/.test(t)) okay('the ball rests at w = (0.8, 0.4), ½‖w‖² = 0.4'); else fail('qp: ' + t);
  await click('#qp-over'); t = norm(await text('#qp-verdict'));
  if (/empty/.test(t)) okay('an overlapping point empties the allowed region'); else fail('qp overlap: ' + t);
  await click('#qp-over'); await setRange('qp-wmin', 1.5);

  console.log('— §6 · w-push —');
  await show('#w-push'); t = norm(await text('#ps-bars')) + ' ' + norm(await text('#ps-kv'));
  if (/1\/8/.test(t) && /1\/4/.test(t) && /\(-0\.5, 0\.5\)/.test(t)) okay('prices ⅛, ⅛, ¼ and w = (−0.5, 0.5)'); else fail('push: ' + t);
  const box6 = await page.locator('#ps-svg').boundingBox();
  const pt6 = await page.evaluate(() => { const s = document.getElementById('ps-svg'), r = s.getBoundingClientRect(), vb = s.viewBox.baseVal; const g = [...s.querySelectorAll('.pt')][4]; const c = g.querySelector('circle:last-child') || g.querySelector('rect'); const cx = +(c.getAttribute('cx') || 0), cy = +(c.getAttribute('cy') || 0); return [r.left + cx / vb.width * r.width, r.top + cy / vb.height * r.height]; });
  await page.mouse.move(pt6[0], pt6[1]); await page.mouse.down(); await page.mouse.move(pt6[0] + 30, pt6[1] - 10, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(300);
  t = norm(await text('#ps-verdict'));
  if (/room to spare|price 0|presses/.test(t)) okay('dragging a point re-solves live: "' + t.slice(0, 60) + '…"'); else fail('push drag: ' + t + ' ' + JSON.stringify(box6));
  await click('#ps-reset');

  console.log('— §7 · w-build —');
  await show('#w-build'); await click('#bd-play'); await page.waitForTimeout(5500); t = norm(await text('#bd-kv')) + ' ' + norm(await text('#bd-verdict'));
  if (/\(-0\.5, 0\.5\).*\(-0\.5, 0\.5\)/.test(t) && /level|good/.test(t)) okay('▶ build w lands on (−0.5, 0.5), beam level'); else fail('build: ' + t);
  await setRange('bd-a3', .35); await page.waitForTimeout(200); t = norm(await text('#bd-verdict'));
  if (/no longer pull equally|bad/.test(t)) okay('α₃ = 0.35 tips the beam'); else fail('build tip: ' + t);
  await click('#bd-reset');

  console.log('— §8 · w-dual —');
  await show('#w-dual'); await click('#du-play'); await page.waitForTimeout(4000); t = norm(await text('#du-kv')) + ' ' + norm(await text('#du-verdict'));
  if (/0\.2500/.test(t) && /no gap/.test(t)) okay('two points: the peak D = 0.25 at α = ¼'); else fail('dual two: ' + t);
  await click('#du-tabs [data-t="three"]'); await page.waitForTimeout(900); await click('#du-play'); await page.waitForTimeout(2400);
  t = norm(await text('#du-kv')) + ' ' + norm(await text('#du-verdict'));
  if (/0\.2778/.test(t) && /on the wall/.test(t)) okay('three points: free peak 0.2778 needs α₃ < 0; answer on the wall α₃ = 0'); else fail('dual three: ' + t);

  console.log('— §9 · w-sparse —');
  await show('#w-sparse'); t = norm(await text('#sp-kv'));
  if (/support vectors 3/.test(t) && /\(-0\.6, 1\)/.test(t) && /1\.715/.test(t)) okay('20 points: 3 support vectors, w = (−0.6, 1), width 1.715'); else fail('sparse: ' + t);
  await click('#sp-prune'); await page.waitForTimeout(1500); t = norm(await text('#sp-kv')) + ' ' + norm(await text('#sp-verdict'));
  if (/points 3/.test(t) && /identical/.test(t) && /1\.715/.test(t)) okay('deleting the 17 price-0 points leaves the street identical'); else fail('sparse prune: ' + t);
  await click('#sp-reset'); await click('#sp-modes [data-m="pos"]');
  const sp = await page.locator('#sp-svg').boundingBox(); await page.mouse.click(sp.x + sp.width * .82, sp.y + sp.height * .82); await page.waitForTimeout(300);
  t = norm(await text('#sp-kv')) + ' ' + norm(await text('#sp-verdict'));
  if (/points 21/.test(t) && /no street|overlap|bad/i.test(t)) okay('adding a blue point deep in the orange group: "no street exists"'); else fail('sparse add: ' + t);
  await click('#sp-reset'); await click('#sp-modes [data-m="move"]');

  console.log('— §10 · w-slack —');
  await show('#w-slack'); t = norm(await text('#sl-kv'));
  if (/5\.295/.test(t) && /3\.721/.test(t) && /1\.137/.test(t)) okay('C = 0.02: width 5.295, total slack 3.721, rogue ξ = 1.137'); else fail('slack lo: ' + t);
  await click('#sl-p-hi'); await page.waitForTimeout(3000); t = norm(await text('#sl-kv')) + ' ' + norm(await text('#sl-verdict'));
  if (/1\.001/.test(t) && /hard-margin/.test(t)) okay('C = 1000: width 1.001 — the hard margin'); else fail('slack hi: ' + t);
  t = norm(await text('#sl-cap-lo')) + ' | ' + norm(await text('#sl-cap-hi'));
  if (/5\.29/.test(t) && /3\.72/.test(t) && /1\.00/.test(t)) okay('snapshots: 5.29 / 3.72 and 1.00 / 0.00'); else fail('snapshots: ' + t);
  await click('#sl-play'); await page.waitForTimeout(600);

  console.log('— §11 · w-hinge —');
  await show('#w-hinge');
  for (const [z, h] of [['2', '0'], ['0.5', '0.5'], ['0', '1'], ['-2', '3']]) { await page.locator(`#hg-pre [data-z="${z}"]`).click(); await page.waitForTimeout(2400); t = norm(await text('#hg-kv'));
    if (new RegExp('score z ' + z.replace('-', '-') + '(\\.0+)? ').test(t + ' ') && new RegExp('max\\(0, 1 - z\\) ' + h + '\\b').test(t)) okay(`z = ${z} → hinge ${h}`); else fail(`hinge z=${z}: ` + t); }
  await click('#hg-flip');

  console.log('— §12 · w-vote —');
  await show('#w-vote'); t = norm(await text('#vt-bars')) + ' ' + norm(await text('#vt-verdict'));
  if (/1\.75/.test(t) && /3\.25/.test(t) && /-4\b/.test(t) && /f = 1\b/.test(t)) okay('star (2,4): votes 1.75, 3.25, −4 → f = 1'); else fail('vote: ' + t);
  await click('#vt-tabs [data-t="ker"]'); t = norm(await text('#vt-verdict'));
  if (/f = 1\b/.test(t)) okay('kernel tab: star (2,1) → f = 1'); else fail('vote ker: ' + t);

  console.log('— §13 · w-lift —');
  await show('#w-lift');
  for (const tb of ['line', 'xor', 'rings']) { await click(`#lf-tabs [data-t="${tb}"]`); await click('#lf-play'); await page.waitForTimeout(9000); t = norm(await text('#lf-verdict'));
    if (/straight cut up there/.test(t)) okay(tb + ': lift and cut complete'); else fail('lift ' + tb + ': ' + t); }
  t = norm(await text('#lf-read')); if (/1\.04/.test(t)) okay('rings: cut at height 1.04'); else fail('lift read: ' + t);

  console.log('— §14 · w-kernel —');
  await show('#w-kernel');
  const kres = async () => [norm(await text('#kc-a-res')), norm(await text('#kc-b-res'))];
  let r = await kres(); if (r[0] === '= 25' && r[1] === '= 25') okay('(x·z)²: both routes 25'); else fail('kernel poly ' + r);
  await click('#kc-tabs [data-t="polyc"]'); r = await kres(); if (r[0] === '= 36' && r[1] === '= 36') okay('(x·z+1)²: both routes 36'); else fail('kernel polyc ' + r);
  await click('#kc-tabs [data-t="lin"]'); r = await kres(); if (r[0] === '= 5' && r[1] === '= 5') okay('linear: both routes 5'); else fail('kernel lin ' + r);
  await click('#kc-tabs [data-t="rbf"]'); r = await kres(); if (r[1] === '= 0.0821') okay('RBF γ = 0.5: 0.0821, no finite route A'); else fail('kernel rbf ' + r);
  t = norm(await text('#kc-cost')); if (/715/.test(t) && /1,001/.test(t)) okay('n = 10, d = 4: 715 and 1 001 features'); else fail('counts ' + t);
  await setRange('kc-n', 100); await setRange('kc-d', 5); t = norm(await text('#kc-cost')); if (/9,65,60,646|96,560,646/.test(t) && /91,962,520|9,19,62,520/.test(t)) okay('n = 100, d = 5: 91 962 520 and 96 560 646'); else fail('counts big ' + t);
  await page.fill('#kc-x1', '2'); await page.dispatchEvent('#kc-x1', 'input'); await click('#kc-tabs [data-t="poly"]'); r = await kres(); if (r[0] === r[1]) okay('changing x keeps the routes equal (' + r[0] + ')'); else fail('kernel edit ' + r);

  console.log('— §15 · w-upstairs + w-playground —');
  await show('#w-upstairs'); t = norm(await text('#up-kv')); if (/5\.657/.test(t)) okay('upstairs: margin 4√2 ≈ 5.657'); else fail('upstairs ' + t);
  await click('#up-play'); await page.waitForTimeout(600);
  await show('#w-playground'); t = norm(await text('#pg-kv')) + ' ' + norm(await text('#pg-recipe'));
  if (/4 of 4/.test(t) && /b 0\b/.test(t) && /Dot products first/.test(t)) okay('four points with (x·z)²: 4 support vectors, b = 0, recipe shown'); else fail('playground: ' + t);
  for (let i = 3; i < 8; i++) { await page.locator('#pg-rnav button').nth(i).click(); await page.waitForTimeout(150); }
  t = norm(await text('#pg-recipe')); if (/x₁x₂ \/ 2/.test(t)) okay('recipe step 8: f = x₁x₂/2'); else fail('recipe 8: ' + t);
  await page.locator('#pg-rnav button').nth(6).click(); t = norm(await text('#pg-recipe')); if (/= 1 ⇒ class \+1, exactly on the edge/.test(t)) okay('recipe step 7: f(2,1) = 1'); else fail('recipe 7: ' + t);
  await page.locator('#pg-rnav button').nth(3).click(); t = norm(await text('#pg-recipe')); if (/a = 1\/32/.test(t)) okay('recipe step 4: a = 1/32'); else fail('recipe 4: ' + t);
  await click('#pg-sets [data-s="rings"]'); await click('#pg-kers [data-k="lin"]'); t = norm(await text('#pg-verdict'));
  if (/no answer|bad/.test(t)) okay('rings + linear (hard): no street'); else fail('rings lin: ' + t);
  await click('#pg-kers [data-k="polyc"]'); t = norm(await text('#pg-verdict')); if (/good/.test(t)) okay('rings + (x·z+1)²: every point on its side'); else fail('rings polyc: ' + t);
  await click('#pg-kers [data-k="rbf"]'); await setRange('pg-g', 1); t = norm(await text('#pg-kv')); if (/γ = 10/.test(t)) okay('RBF γ slider fires (γ = 10)'); else fail('rbf gamma: ' + t);
  await click('#pg-sets [data-s="moons"]'); await click('#pg-sets [data-s="blobs"]'); t = norm(await text('#pg-kv')); if (/fine C 1\b/.test(t)) okay('blobs load with a soft margin (C = 1)'); else fail('blobs: ' + t);
  await setRange('pg-c', 2); await click('#pg-sets [data-s="line"]'); t = norm(await text('#pg-kv')); if (/b 1\.6667/.test(t)) okay('1-D preset with (x·z)²: b = 5/3'); else fail('line preset: ' + t);
  await click('#pg-tabs [data-t="land"]'); await page.waitForTimeout(1800);
  const land = await page.evaluate(() => !!document.querySelector('#pg-3d canvas')); if (land) okay('landscape tab mounts a 3-D stage'); else fail('landscape did not mount');
  await click('#pg-tabs [data-t="map"]');

  console.log('— checks, drawers, practice —');
  const nOk = await page.evaluate(() => { let n = 0; document.querySelectorAll('.check').forEach(ch => { const b = ch.querySelector('.opts button[data-correct]'); if (b) { b.click(); n++; } }); return n; });
  await page.waitForTimeout(300);
  const sc = await page.evaluate(() => [document.getElementById('score').textContent, document.getElementById('score-chip').classList.contains('done'), (localStorage.getItem('mfml-u13-checks') || '').split(',').filter(Boolean).length]);
  if (nOk === 20 && sc[0] === '20' && sc[1] && sc[2] === 20) okay('all 20 checks answerable; score 20/20 stored under mfml-u13-checks'); else fail('checks ' + nOk + ' ' + JSON.stringify(sc));
  const wrong = await page.evaluate(() => { const ch = document.querySelector('.check'); const b = ch.querySelector('.opts button:not([data-correct])'); b.click(); return ch.querySelector('.why').textContent.slice(0, 20); });
  if (/Not quite/.test(wrong)) okay('a wrong answer explains itself'); else fail('wrong answer: ' + wrong);
  const dr = await page.evaluate(() => { const ds = [...document.querySelectorAll('details.algebra')]; ds.forEach(d => d.open = true); return ds.every(d => d.querySelector('.derive') && d.querySelector('.derive').offsetHeight > 0); });
  if (dr) okay('all 12 drawers open and show their derivations'); else fail('drawers');
  const pr = await page.evaluate(() => { const ss = [...document.querySelectorAll('#spractice details.sol')]; const closed = ss.every(d => !d.open); ss.forEach(d => d.open = true); return [ss.length, closed, document.querySelectorAll('#spractice .pans').length, document.querySelectorAll('#spractice .pstep').length, !!document.querySelector('#spractice .next-card'), document.querySelector('#spractice .sec-num').textContent]; });
  if (pr[0] === 16 && pr[1] && pr[2] === 16 && pr[3] > 60 && pr[4] && pr[5] === '17') okay('practice: 16 solutions (closed at load), 16 answer lines, ' + pr[3] + ' steps, next-card inside, § 17'); else fail('practice ' + JSON.stringify(pr));
  const nc = norm(await text('#spractice .next-card')); if (/Unit 14 · Encoder-Decoder Maths & RNNs/.test(nc) && /upcoming/.test(nc)) okay('next-card: Unit 14 · Encoder–Decoder Maths & RNNs — upcoming'); else fail('next-card: ' + nc);
  const wide2 = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide2) okay('with every drawer and solution open, no display equation overflows at 1300px'); else fail(wide2 + ' display equations overflow (drawers open)');

  console.log('— theme flip —');
  await page.click('#theme-btn'); await page.waitForTimeout(1200); await page.click('#theme-btn'); await page.waitForTimeout(600);

  console.log('— console —');
  if (!errors.length) okay('no console or page errors'); else errors.slice(0, 10).forEach(fail);
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ UNIT 13 WIDGETS PASS');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
