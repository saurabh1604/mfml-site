/* Unit 10 · Optimization I — widget behaviour and numerical correctness (WebGL on). */
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

  await page.goto('file:///home/claude/mfml-site/site/unit-10.html');
  await page.waitForTimeout(2500);

  console.log('— page —');
  const counts = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length, derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length, stages: document.querySelectorAll('.stage-canvas canvas').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u10-total'), U: document.title }));
  if (counts.checks === 15 && counts.total === '15') okay('15 checks, total published'); else fail('checks ' + JSON.stringify(counts));
  if (counts.widgets === 11 && counts.derives === 16 && counts.probs === 12 && counts.drawers === 10) okay('11 widgets · 16 derivations in 10 drawers · 12 problems'); else fail('counts ' + JSON.stringify(counts));
  if (counts.stages === 4) okay('4 WebGL stages alive (hero + 3)'); else fail('stages ' + counts.stages);
  if (!counts.katex) okay('no KaTeX errors'); else fail('katex-error ×' + counts.katex);
  if (/^Unit 10 · Optimization I/.test(counts.U)) okay('title: ' + counts.U); else fail('title ' + counts.U);
  const chips = norm(await text('.hero .meta'));
  if (/11 interactive widgets/.test(chips) && /15 inline checks/.test(chips) && /16 proofs/.test(chips) && /12 solved practice problems/.test(chips)) okay('hero chips match the counts'); else fail('hero chips: ' + chips);
  const wide = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide) okay('no display equation overflows at 1300px'); else fail(wide + ' display equations overflow');

  console.log('— hero · the canyon becomes a bowl —');
  const ph0 = await page.getAttribute('#hero-3d', 'data-phase');
  await page.waitForTimeout(9000);
  const ph1 = await page.getAttribute('#hero-3d', 'data-phase');
  if (ph0 && ph1 && ph0 !== ph1) okay(`hero advances through phases (${ph0} → ${ph1})`); else fail('hero phases: ' + ph0 + ' → ' + ph1);

  console.log('— W1 · the tailor\'s bill —');
  let t = norm(await text('#bl-read'));
  if (/w\* = 33\/14 = 2\.357, J\* = 3\/14 = 0\.214/.test(t)) okay('w* = 33/14, J* = 3/14'); else fail('bill readout: ' + t);
  await page.click('#bl-play'); await page.waitForTimeout(4500);
  t = norm(await text('#bl-read'));
  if (/0\.000 → 1\.320 → 1\.901 → 2\.156/.test(t) && /78\.00 → 15\.27 → 3\.13 → 0\.78/.test(t)) okay('η = 0.02 trace: w 0 → 1.320 → 1.901 → 2.156; J 78 → 15.27 → 3.13'); else fail('bill trace: ' + t);
  await setRange('bl-eta', 0.075); await page.click('#bl-play'); await page.waitForTimeout(4500);
  t = norm(await text('#bl-verdict'));
  if (/1\/14/.test(t) && /grow/.test(t)) okay('η = 0.075 ≥ 1/14: the squares grow'); else fail('bill divergence: ' + t);
  await page.click('#bl-reset'); await setRange('bl-eta', 0.02);

  console.log('— W2 · the parachute drop —');
  t = norm(await text('#dp-read'));
  if (/factor per step 1 - 2ηx² = -79/.test(t) && /safe zone: η < 1\/x² = 2\.5 × 10⁻⁵/.test(t) && /overflow: 163/.test(t)) okay('factor −79, overflow at 163, safe zone 2.5e−5'); else fail('drop readout: ' + t);
  await setRange('dp-w0', -1); await page.waitForTimeout(200); t = norm(await text('#dp-read'));
  if (/overflow: 16[23]/.test(t)) okay('changing w₀ does not change the factor (overflow still ≈163)'); else fail('drop w0: ' + t);
  await setRange('dp-eta', -5); await page.waitForTimeout(200); t = norm(await text('#dp-verdict'));
  if (/start is forgiven/.test(t)) okay('η = 1e−5 converges'); else fail('drop safe verdict: ' + t);
  await setRange('dp-eta', -3); await setRange('dp-w0', 0);
  await page.click('#dp-tabs [data-t="clones"]'); await page.waitForTimeout(300);
  await page.click('#w-drop [data-p="same"]'); await page.waitForTimeout(300); t = norm(await text('#dp-verdict'));
  if (/start equal, stay equal/.test(t)) okay('clones: identical starts stay identical'); else fail('clones verdict: ' + t);
  await page.click('#w-drop [data-p="nudged"]'); await page.click('#dp-play'); await page.waitForTimeout(5000); t = norm(await text('#dp-verdict'));
  if (/breaks the tie/.test(t)) okay('clones: a nudge breaks the tie'); else fail('clones nudged: ' + t);
  await page.click('#dp-tabs [data-t="overflow"]');

  console.log('— W3 · full marks by memorising —');
  t = norm(await text('#mm-read'));
  if (/→ w₃ = 5, w₅ = 20, w₂ = 12/.test(t) && /w₂ = 7 gives ŷ₁ = 49 ≠ 59/.test(t) && /J = 8/.test(t)) okay('memoriser solved (12, 5, 20); slide slip flagged; honest J = 8'); else fail('memo readout: ' + t);
  await page.click('#mm-tabs [data-t="memoriser"]'); await setRange('mm-x1', 50); await page.waitForTimeout(200); t = norm(await text('#mm-read'));
  if (/J = 0/.test(t) && /ŷ = 62\.0, error = 12\.0/.test(t)) okay('memoriser: J = 0 on training, error 12 on the unseen row'); else fail('memo memoriser: ' + t);
  await setRange('mm-x1', 70); await page.waitForTimeout(200); t = norm(await text('#mm-read'));
  if (/ŷ = 62\.0/.test(t)) okay('memoriser ignores x₁ (still 62 at x₁ = 70)'); else fail('memo x1=70: ' + t);
  await page.click('#mm-tabs [data-t="honest"]'); await setRange('mm-x1', 50);

  console.log('— W4 · hair-trigger and stiff knob —');
  t = norm(await text('#kn-read'));
  if (/x₁² = 2500, ∂y\/∂w₂ = x₂² = 16, ratio = 156/.test(t)) okay('2500, 16, ratio 156'); else fail('knobs readout: ' + t);
  await page.click('#w-knobs [data-p="serve"]'); await page.waitForTimeout(200); t = norm(await text('#kn-verdict'));
  if (/hair-trigger overshoots/.test(t)) okay('serve the stiff knob → hair-trigger overshoots'); else fail('knobs serve: ' + t);
  await page.click('#w-knobs [data-p="protect"]'); await page.waitForTimeout(200); t = norm(await text('#kn-verdict'));
  if (/stiff knob crawls/.test(t)) okay('protect the hair-trigger → stiff knob crawls'); else fail('knobs protect: ' + t);
  await page.click('#w-knobs [data-p="default"]');

  console.log('— W5 · three repairs —');
  t = norm(await text('#rs-read'));
  if (/μ = 0\.433, σ = 0\.287/.test(t) && /μ = 15\.000, σ = 7\.071/.test(t)) okay('lecture columns: μ = 0.433/15, σ = 0.287/7.071'); else fail('rescale readout: ' + t);
  const ztab = norm(await text('#rs-table'));
  if (/-1\.16[23]/.test(ztab) && /1\.279/.test(ztab) && /1\.414/.test(ztab) && /-0\.707/.test(ztab)) okay('z-values (−1.163, 1.279, −0.116) / (1.414, −0.707, −0.707) in the table'); else fail('rescale table: ' + ztab.slice(0, 300));
  await page.click('#rs-tabs [data-t="standardise"]'); await page.waitForTimeout(1000); t = norm(await text('#rs-verdict'));
  if (/standardised: both features have spread 1/.test(t)) okay('standardise verdict'); else fail('rescale std: ' + t);
  await page.click('#w-rescale [data-p="outlier"]'); await page.click('#rs-tabs [data-t="minmax"]'); await page.waitForTimeout(1000); t = norm(await text('#rs-verdict'));
  if (/outlier/.test(t) && /crushed/.test(t)) okay('min–max + outlier: crushed into a corner'); else fail('rescale outlier: ' + t);
  await page.click('#w-rescale [data-p="lecture"]'); await page.click('#rs-tabs [data-t="raw"]');

  console.log('— W6 · marble rain + lock —');
  t = norm(await text('#vl-read'));
  if (/watershed at x = 1\.634/.test(t) && /F = -4\.848/.test(t) && /P\(global\) = 0\.5915/.test(t) && /k = ⌈ln 0\.01 \/ ln\(1 - p\)⌉ = 6/.test(t)) okay('watershed 1.634, F = −4.848, P = 0.5915, k = 6'); else fail('valleys readout: ' + t);
  await page.click('#vl-play'); await page.waitForTimeout(30000); t = norm(await text('#vl-read'));
  const mm = t.match(/marbles: (\d+) global · (\d+) local/);
  if (mm && +mm[1] > 0 && +mm[2] > 0 && +mm[1] + +mm[2] === 24) okay(`24 marbles split ${mm[1]} global / ${mm[2]} local`); else fail('marbles: ' + t);
  await page.click('#vl-tabs [data-t="lock"]'); await setRange('vl-d', 10); await page.waitForTimeout(300); t = norm(await text('#vl-read'));
  if (/k¹⁰ = 59049/.test(t) && /p¹⁰ = 0\.006/.test(t)) okay('lock: 3¹⁰ = 59049, 0.6¹⁰ = 0.006'); else fail('lock readout: ' + t);
  await page.click('#vl-tabs [data-t="rain"]');

  console.log('— W7 · the salt flat —');
  t = norm(await text('#sf-verdict'));
  if (/cliff is fast/.test(t) || /flat/.test(t)) okay('salt flat: initial verdict'); else fail('salt verdict: ' + t);
  await page.click('#sf-play'); await page.waitForTimeout(45000); t = norm(await text('#sf-read'));
  const sf = t.match(/steps spent with \|∇f\| < 0\.05 so far: (\d+) of (\d+)/);
  if (sf && +sf[1] > 0.5 * +sf[2]) okay(`most steps spent on the flat (${sf[1]} of ${sf[2]})`); else fail('salt steps: ' + t);
  if (/200 000 steps/.test(t)) okay('plateau arithmetic: 200 000 steps'); else fail('salt 200000: ' + t);
  await page.click('#sf-reset');

  console.log('— W8 · the canyon —');
  t = norm(await text('#cn-read'));
  if (/κ = 4/.test(t) && /= 0\.520 x/.test(t) && /= -0\.920 y/.test(t) && /1\/c = 0\.250/.test(t)) okay('c = 4, η = 0.24: factors 0.52 / −0.92, limit 0.25, κ = 4'); else fail('canyon readout: ' + t);
  await page.click('#cn-play'); await page.waitForTimeout(6000); t = norm(await text('#cn-read'));
  if (/x₈ = \(0\.053, 5\.132\), L = 105\.4/.test(t)) okay('8 steps: (0.053, 5.132), L = 105.4 (companion trace continued)'); else fail('canyon run: ' + t);
  t = norm(await text('#cn-verdict'));
  if (/y-direction bounces/.test(t)) okay('zig-zag verdict'); else fail('canyon verdict: ' + t);
  await setRange('cn-c', 1); await setRange('cn-eta', 0.5); await page.waitForTimeout(300); t = norm(await text('#cn-verdict'));
  if (/finishes in one step/.test(t)) okay('c = 1, η = 0.5: one-step finish'); else fail('canyon c=1: ' + t);
  await setRange('cn-c', 4); await setRange('cn-eta', 0.3); await page.waitForTimeout(300); t = norm(await text('#cn-verdict'));
  if (/diverging/.test(t)) okay('η = 0.3 > 1/4: diverging'); else fail('canyon diverge: ' + t);
  await setRange('cn-eta', 0.24); await page.click('#cn-reset');

  console.log('— W9 · the compass —');
  t = norm(await text('#cp-read'));
  if (/∇F = \(4\.400, 8\.800\)/.test(t) && /angle = 90\.0°/.test(t) && /minimum = 36\.9°/.test(t)) okay('(2.2, 1.1): ∇F = (4.4, 8.8), 90° to the contour, 36.9° off the centre line'); else fail('compass readout: ' + t);
  await page.click('#cp-tabs [data-t="circle"]'); await page.waitForTimeout(300); t = norm(await text('#cp-read'));
  if (/minimum = 0\.0°/.test(t)) okay('circle: 0° — the gradient points at the centre'); else fail('compass circle: ' + t);
  await page.click('#cp-tabs [data-t="tilted"]'); await page.waitForTimeout(300); t = norm(await text('#cp-read'));
  if (/angle = 90\.0°/.test(t)) okay('tilted: still 90° to the contour'); else fail('compass tilted: ' + t);
  await page.click('#cp-tabs [data-t="ellipse"]');

  console.log('— W10 · change the units —');
  t = norm(await text('#un-read'));
  if (/H\(t\) = \[\[1\.62, 29\.00\],\[29\.00, 1650\.00\]\]/.test(t) && /λ_max = 1650\.5, λ_min = 1\.11, κ = 1487/.test(t) && /2\/λ_max = 1\.21e-3/.test(t)) okay('t = 0: H = [[1.62, 29],[29, 1650]], κ = 1487, limit 1.21e−3'); else fail('units t0: ' + t);
  await setRange('un-t', 1); await page.waitForTimeout(800); t = norm(await text('#un-read'));
  if (/H\(t\) = \[\[6\.00, -4\.93\],\[-4\.93, 6\.00\]\]/.test(t) && /λ_max = 10\.93, λ_min = 1\.07, κ = 10\.2/.test(t) && /2\/λ_max = 0\.183/.test(t)) okay('t = 1: H = [[6, −4.93],[−4.93, 6]], κ = 10.2, limit 0.183'); else fail('units t1: ' + t);
  await page.click('#un-play'); await page.waitForTimeout(22000); t = norm(await text('#un-read'));
  const j1 = +(t.match(/after 30 steps: J = ([\d.e-]+)/) || [])[1];
  if (j1 < 0.01) okay('standardised: 30 steps reach J = ' + j1); else fail('units std run: ' + t);
  await page.click('#w-units [data-p="whiten"]'); await setRange('un-t', 1); await page.waitForTimeout(800); t = norm(await text('#un-read'));
  if (/κ = 1\.00/.test(t)) okay('whiten: κ = 1'); else fail('units whiten: ' + t);
  await page.click('#w-units [data-p="minmax"]'); await setRange('un-t', 1); await page.waitForTimeout(800); t = norm(await text('#un-read'));
  if (/κ = 1\.18/.test(t)) okay('min–max: κ = 1.18'); else fail('units minmax: ' + t);
  await page.click('#w-units [data-p="standardise"]'); await setRange('un-t', 0); await page.click('#un-reset');

  console.log('— W11 · the clinic —');
  for (let c = 1; c <= 6; c++) {
    await page.click(`#cl-cases [data-c="${c}"]`); await page.waitForTimeout(200);
    await page.click('#cl-panel [data-d][data-ok="1"]'); await page.waitForTimeout(200);
    t = norm(await text('#cl-verdict'));
    if (/^✓/.test(t) && /fix:/.test(t)) okay(`case ${c}: ${t.slice(0, 70)}`); else fail(`clinic case ${c}: ` + t);
  }
  t = norm(await text('#cl-panel'));
  if (/6 of 6 diagnosed/.test(t)) okay('6 of 6 diagnosed'); else fail('clinic score: ' + t);

  console.log('— checks & score —');
  await page.evaluate(() => document.querySelectorAll('.check').forEach(c => c.querySelector('.opts button[data-correct]').click()));
  await page.waitForTimeout(200);
  const chip = norm(await text('#score-chip'));
  if (/15\s*\/\s*15/.test(chip)) okay('all 15 checks pass → 15/15'); else fail('score chip: ' + chip);

  console.log('— theme flip rebuilds stages —');
  await page.click('#theme-btn'); await page.waitForTimeout(9000);
  const light = await page.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), stages: document.querySelectorAll('.stage-canvas canvas').length }));
  if (light.theme === 'light' && light.stages === 4) okay('light theme: 4 stages rebuilt'); else fail('light theme: ' + JSON.stringify(light));
  await page.click('#theme-btn'); await page.waitForTimeout(2000);

  if (errors.length) { errors.forEach(e => fail(e)); } else okay('zero console / page errors');
  console.log(bad ? `\n${bad} FAILURE(S)` : '\nUNIT 10 PASSES ✓');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
