/* Unit 9 · Gradient Descent — widget behaviour and numerical correctness (WebGL on). */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const text = sel => page.locator(sel).innerText();
  const norm = s => s.replace(/\s+/g, ' ').replace(/−/g, '-');

  await page.goto('file:///home/claude/mfml-site/site/unit-09.html');
  await page.waitForTimeout(1800);

  console.log('— page —');
  const counts = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length, derives: document.querySelectorAll('.derive').length, probs: document.querySelectorAll('#spractice .prob').length, stages: document.querySelectorAll('.stage-canvas canvas').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u9-total') }));
  if (counts.checks === 15 && counts.total === '15') okay('15 checks, total published'); else fail('checks ' + JSON.stringify(counts));
  if (counts.widgets === 11 && counts.derives === 16 && counts.probs === 12) okay('11 widgets · 16 derivations · 12 problems'); else fail('counts ' + JSON.stringify(counts));
  if (counts.stages === 5) okay('5 WebGL stages alive (hero + 4)'); else fail('stages ' + counts.stages);
  if (!counts.katex) okay('no KaTeX errors'); else fail('katex-error ×' + counts.katex);
  const chips = norm(await text('.hero .meta'));
  if (/11 interactive widgets/.test(chips) && /15 inline checks/.test(chips) && /16 proofs/.test(chips) && /12 solved practice problems/.test(chips)) okay('hero chips match the counts'); else fail('hero chips: ' + chips);

  console.log('— W1 · fitting bowl —');
  let t = norm(await text('#ft-read'));
  if (/a\* = 2\.04, b\* = 1, L\* = 0\.072/.test(t)) okay('best fit a*=2.04, b*=1, L*=0.072'); else fail('fit readout: ' + t);
  if (/66\.8/.test(t) && /1\.20?\b/.test(t) && /0\.030/.test(t)) okay('λ ≈ 66.8, 1.20; limit 0.030'); else fail('fit eigen: ' + t);
  await page.click('#ft-play'); await page.waitForTimeout(4000);
  t = norm(await text('#ft-read'));
  const L = +(t.match(/L\(a,b\) = ([\d.]+)/) || [])[1];
  if (L < 20) okay('descent from the origin lowers L to ' + L); else fail('descent did not lower L: ' + t);
  await setRange('ft-g', 0.034); await page.click('#ft-play'); await page.waitForTimeout(5000);
  t = norm(await text('#ft-verdict'));
  if (/diverg|raised L/.test(t)) okay('γ = 0.034 > 0.030 diverges: ' + t.slice(0, 60)); else fail('fit divergence verdict: ' + t);
  await page.click('#ft-reset'); await setRange('ft-g', 0.02);

  console.log('— W2 · flat-spot prober —');
  t = norm(await text('#fp-read'));
  if (/-4\.480 \(min, f = -47\.07\)/.test(t) && /-1\.432 \(max, f = 21\.25\)/.test(t) && /0\.662 \(min, f = -3\.84\)/.test(t)) okay('quartic stationary points −4.480 min · −1.432 max · 0.662 min'); else fail('quartic readout: ' + t);
  await setRange('fp-x', 0); await page.click('#fp-play'); await page.waitForTimeout(7500);
  t = norm(await text('#fp-verdict'));
  if (/valley|local minimum/.test(t)) okay('walk from 0 ends in a valley: ' + t.slice(0, 60)); else fail('walk verdict: ' + t);
  const xe = await page.evaluate(() => +document.getElementById('fp-x').value);
  if (Math.abs(xe - 0.662) < 0.02) okay('…at x ≈ 0.662 (the shallow valley)'); else fail('walk ended at x = ' + xe);

  console.log('— W3 · descent stage —');
  t = norm(await text('#ds-read'));
  if (/x\* = -A⁻¹b = \(2\.487, 0\.026\), f\* = -6\.256/.test(t)) okay('x* = (2.487, 0.026), f* = −6.256'); else fail('desc readout: ' + t);
  if (/λ₁ = 20\.055, λ₂ = 1\.945/.test(t)) okay('λ = 20.055, 1.945'); else fail('desc eigen: ' + t);
  await setRange('ds-g', 0.1); await page.waitForTimeout(200);
  t = norm(await text('#ds-verdict'));
  if (/γ > 2\/λ₁ = 0\.0997/.test(t) && /diverging/.test(t)) okay('γ = 0.1: diverging verdict'); else fail('desc 0.1 verdict: ' + t);
  await setRange('ds-g', 0.05); await page.waitForTimeout(200);
  t = norm(await text('#ds-verdict'));
  if (/every direction shrinks/.test(t)) okay('γ = 0.05: converging verdict'); else fail('desc 0.05 verdict: ' + t);
  await page.click('#ds-play'); await page.waitForTimeout(18000);
  t = norm(await text('#ds-read'));
  const f20 = +(t.match(/f\(x[₀-₉0-9]*\) = (-?[\d.]+)/) || [])[1];
  if (f20 < -5.5) okay('20 steps at γ=0.05 reach f = ' + f20); else fail('desc run: ' + t);
  await page.click('#ds-tabs [data-t="exact"]'); await page.click('#ds-reset'); await page.click('#ds-play'); await page.waitForTimeout(18000);
  t = norm(await text('#ds-verdict'));
  if (/90°/.test(t)) okay('exact line search: 90° turns'); else fail('desc exact verdict: ' + t);
  await page.click('#ds-tabs [data-t="fixed"]'); await page.click('#ds-reset');

  console.log('— W4 · step-size dial —');
  await page.click('#st-presets [data-p="sweet"]'); await page.waitForTimeout(200);
  t = norm(await text('#st-verdict'));
  if (/one perfect step/.test(t)) okay('γλ = 1: one perfect step'); else fail('sweet verdict: ' + t);
  await page.click('#st-presets [data-p="blow"]'); await page.waitForTimeout(200);
  t = norm(await text('#st-verdict'));
  if (/diverging/.test(t)) okay('γλ = 2.4: diverging'); else fail('blow verdict: ' + t);
  await page.click('#st-tabs [data-t="two"]'); await page.waitForTimeout(300);
  await page.click('#w-step [data-p="zigzag"]'); await page.waitForTimeout(300);
  t = norm(await text('#st-read'));
  if (/1 - γλ₁ = -0\.900/.test(t) && /1 - γλ₂ = 0\.810/.test(t) && /2\/λ₁ = 0\.1000/.test(t)) okay('two directions: factors −0.900 / 0.810, limit 0.1'); else fail('two-dir readout: ' + t);
  t = norm(await text('#st-verdict'));
  if (/zig-zag/.test(t)) okay('zig-zag verdict'); else fail('two-dir verdict: ' + t);

  console.log('— W5 · line-search lens —');
  await page.click('#ls-reset'); await page.click('#ls-best'); await page.waitForTimeout(2000);
  t = norm(await text('#ls-read'));
  if (/γ\* = gᵀg \/ gᵀAg = 160\.000 \/ 896\.000 = 0\.1786/.test(t)) okay('γ* = 160/896 = 0.1786 at (2,2)'); else fail('ls readout: ' + t);
  if (/new point = \(1\.286, -0\.143\)/.test(t) && /f: 16\.000 → 1\.714/.test(t) && /= 90\.0°/.test(t)) okay('new point (1.286, −0.143), f 16 → 1.714, 90.0°'); else fail('ls numbers: ' + t);
  t = norm(await text('#ls-verdict'));
  if (/perpendicular/.test(t)) okay('at γ*: perpendicular verdict'); else fail('ls verdict: ' + t);
  await page.click('#ls-step'); await page.waitForTimeout(400); await page.click('#ls-best'); await page.waitForTimeout(2000);
  t = norm(await text('#ls-read'));
  if (/0\.4167/.test(t) && /new point = \(0\.214, 0\.214\)/.test(t)) okay('second step: γ* = 5/12, point (3/14, 3/14)'); else fail('ls second step: ' + t);

  console.log('— W6 · bracket squeezer —');
  await page.click('#br-reset'); for (let i = 0; i < 3; i++) { await page.click('#br-step'); await page.waitForTimeout(120); }
  t = norm(await text('#br-read'));
  if (/\[0, 4\] → \[2, 4\] → \[2, 3\] → \[2, 2\.5\]/.test(t)) okay('binary trace [0,4]→[2,4]→[2,3]→[2,2.5]'); else fail('bracket trace: ' + t);
  if (/binary 9 · golden 13/.test(t)) okay('iterations for 0.01: binary 9 · golden 13'); else fail('bracket counts: ' + t);
  await page.click('#br-m [data-t="armijo"]'); await page.click('#br-reset'); await page.click('#br-step'); await page.waitForTimeout(200);
  t = norm(await text('#br-verdict'));
  if (/sufficient decrease/.test(t)) okay('armijo: sufficient decrease verdict'); else fail('armijo verdict: ' + t);
  await page.click('#br-m [data-t="binary"]'); await page.click('#br-fn [data-t="bumpy"]'); await page.click('#br-reset'); for (let i = 0; i < 6; i++) { await page.click('#br-step'); await page.waitForTimeout(80); }
  t = norm(await text('#br-verdict'));
  if (/lost α\*|not unimodal|still contains/.test(t)) okay('bumpy verdict: ' + t.slice(0, 70)); else fail('bumpy verdict: ' + t);
  await page.click('#br-fn [data-t="practice"]');

  console.log('— W7 · schedules —');
  t = norm(await text('#dc-read'));
  if (/t = 10: exponential 0\.4852, inverse 0\.5333, step 0\.0889/.test(t)) okay('t=10: 0.4852 / 0.5333 / 0.0889'); else fail('decay readout: ' + t);
  if (/t = 1\/k = 20/.test(t)) okay('inverse half-life t = 1/k = 20'); else fail('decay half-life: ' + t);
  await setRange('dc-t', 20); await page.waitForTimeout(150);
  t = norm(await text('#dc-read'));
  if (/exponential 0\.2943, inverse 0\.4\b/.test(t)) okay('t=20: 0.2943 / 0.4'); else fail('decay t=20: ' + t);
  await page.click('#dc-tabs [data-t="bold"]'); await page.waitForTimeout(300);
  t = norm(await text('#dc-read'));
  if (/halvings/.test(t) && /2\/λ₁ = 0\.1/.test(t)) okay('bold driver: settles near 2/λ₁ = 0.1'); else fail('bold readout: ' + t);
  await page.click('#dc-tabs [data-t="schedules"]');

  console.log('— W8 · gradient auditor —');
  t = norm(await text('#fd-read'));
  if (/= 13\.61 \(error 0\.6100\)/.test(t) && /= 13\.01 \(error 0\.0100\)/.test(t)) okay('Δ=0.1: forward 13.61 (0.61), central 13.01 (0.01)'); else fail('fd readout: ' + t);
  await page.click('#fd-tabs [data-t="w2"]'); await page.waitForTimeout(150);
  t = norm(await text('#fd-read'));
  if (/= 4\.2\b/.test(t) && /central is exact here/.test(t)) okay('w₂: forward 4.20, central exact'); else fail('fd w2: ' + t);
  await page.click('#fd-tabs [data-t="w1"]'); await setRange('fd-d', -8); await page.waitForTimeout(150);
  t = norm(await text('#fd-verdict'));
  if (/round-off/.test(t)) okay('Δ = 1e−8: round-off verdict'); else fail('fd roundoff: ' + t);
  await setRange('fd-d', -1);

  console.log('— W9 · noisy descent —');
  await page.click('#sg-play'); await page.waitForTimeout(4000);
  t = norm(await text('#sg-read'));
  if (/best: a\* = 1\.4603, b\* = 0\.5222, L\* = 0\.1743/.test(t)) okay('best fit a*=1.4603, b*=0.5222, L*=0.1743'); else fail('sgd readout: ' + t);
  const Ls = +(t.match(/L after \d+ steps = ([\d.]+)/) || [])[1];
  if (Ls < 0.3) okay('80 minibatch steps reach L = ' + Ls); else fail('sgd run: ' + t);
  await page.click('#sg-tabs [data-t="decay"]'); await page.waitForTimeout(200);
  t = norm(await text('#sg-verdict'));
  if (/decaying γ/.test(t)) okay('decay verdict'); else fail('sgd decay verdict: ' + t);

  console.log('— W10 · fog —');
  await page.click('#w-fog [data-p="ridge"]'); await page.click('#fg-play'); await page.waitForTimeout(32000);
  t = norm(await text('#fg-read'));
  if (/steps taken = 28 · height fallen = 2\.018/.test(t) && /position \(x, y\) = \(-0\.95, -0\.66\)/.test(t)) okay('ridge walk: 28 steps to (−0.95, −0.66), fell 2.018'); else fail('fog readout: ' + t);
  t = norm(await text('#fg-verdict'));
  if (/flat ground — the walk is over/.test(t)) okay('fog verdict: valley bottom'); else fail('fog verdict: ' + t);
  await page.click('#fg-lift'); await page.waitForTimeout(2000);
  t = norm(await text('#fg-verdict'));
  if (/two valleys/.test(t)) okay('lift the fog: two valleys verdict'); else fail('fog lift verdict: ' + t);
  const drawers = await page.evaluate(() => ({ n: document.querySelectorAll('details.algebra').length, open: document.querySelectorAll('details.algebra[open]').length, inside: document.querySelectorAll('details.algebra .derive').length }));
  if (drawers.n === 9 && drawers.open === 0 && drawers.inside === 16) okay('9 algebra drawers, closed, holding all 16 proofs'); else fail('drawers ' + JSON.stringify(drawers));

  console.log('— W11 · race —');
  await page.click('#w-race [data-p="fair-cost"]'); await page.waitForTimeout(30000);
  t = norm(await text('#rc-read'));
  if (/after 1200 data units: batch took 30 steps, minibatch 150, stochastic 1200/.test(t)) okay('fair-cost: 30 / 150 / 1200 steps'); else fail('race readout: ' + t);
  const hud = norm(await page.locator('#rc-3d .hud').first().innerText());
  const m = hud.match(/batch L = ([\d.]+) · mini L = ([\d.]+) · sgd L = ([\d.]+)/);
  if (m && +m[2] < +m[1] && +m[3] < +m[1]) okay('per data read, mini and sgd beat batch: ' + hud); else fail('race hud: ' + hud);
  t = norm(await text('#rc-verdict'));
  if (/noisy walkers get to the bottom first/.test(t)) okay('race verdict (budget)'); else fail('race verdict: ' + t);
  await page.click('#w-race [data-p="cost-decay"]'); await page.waitForTimeout(20000);
  t = norm(await text('#rc-verdict'));
  if (/jitter dies/.test(t)) okay('cost-decay verdict appended'); else fail('race decay verdict: ' + t);

  console.log('— checks & score —');
  await page.evaluate(() => document.querySelectorAll('.check').forEach(c => c.querySelector('.opts button[data-correct]').click()));
  await page.waitForTimeout(200);
  const chip = norm(await text('#score-chip'));
  if (/15\s*\/\s*15/.test(chip)) okay('all 15 checks pass → 15/15'); else fail('score chip: ' + chip);

  console.log('— theme flip rebuilds stages —');
  await page.click('#theme-btn'); await page.waitForTimeout(9000);
  const light = await page.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), stages: document.querySelectorAll('.stage-canvas canvas').length }));
  if (light.theme === 'light' && light.stages === 5) okay('light theme: 5 stages rebuilt'); else fail('light theme: ' + JSON.stringify(light));
  await page.click('#theme-btn'); await page.waitForTimeout(2000);

  if (errors.length) { errors.forEach(e => fail(e)); } else okay('zero console / page errors');
  console.log(bad ? `\n${bad} FAILURE(S)` : '\nUNIT 9 PASSES ✓');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
