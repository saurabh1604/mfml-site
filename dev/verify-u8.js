/* Unit 8 · Taylor & MacLaurin Series (and the Hessian) — widget behaviour and numerical correctness. */
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
  const norm = s => s.replace(/\s+/g, ' ');

  await page.goto('file:///home/claude/mfml-site/site/unit-08.html');
  await page.waitForTimeout(1500);

  console.log('— page —');
  const counts = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length, derives: document.querySelectorAll('.derive').length, probs: document.querySelectorAll('#spractice .prob').length, stages: document.querySelectorAll('.stage-canvas canvas').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u8-total') }));
  if (counts.checks === 17 && counts.total === '17') okay('17 checks, total published'); else fail('checks ' + JSON.stringify(counts));
  if (counts.widgets === 9 && counts.derives === 17 && counts.probs === 12) okay('9 widgets · 17 derivations · 12 problems'); else fail('counts ' + JSON.stringify(counts));
  if (counts.stages === 4) okay('4 WebGL stages alive (hero + 3)'); else fail('stages ' + counts.stages);
  if (!counts.katex) okay('no KaTeX errors'); else fail('katex-error ×' + counts.katex);
  const chips = norm(await text('.hero .meta'));
  if (/9 interactive widgets/.test(chips) && /17 inline checks/.test(chips) && /17 proofs/.test(chips) && /12 solved practice problems/.test(chips)) okay('hero chips match the counts'); else fail('hero chips: ' + chips);

  console.log('— W1 · flat-spot hunter —');
  let t = norm(await text('#fl-read'));
  if (/c = /.test(t) && /f′\(c\) = 0/.test(t)) okay('rolle: flat spot found · ' + t.slice(0, 60)); else fail('rolle readout: ' + t);
  await page.click('#fl-tabs [data-t="mvt"]'); await page.waitForTimeout(200);
  t = norm(await text('#fl-read'));
  if (/0\.025/.test(t) && /-0\.641/.test(t) && /1\.261/.test(t)) okay('mvt a=−1.6, b=1.8: slope 0.025, c = −0.641 and 1.261'); else fail('mvt readout: ' + t);
  await page.click('#fl-tabs [data-t="broken"]'); await page.waitForTimeout(200);
  t = norm(await text('#fl-verdict'));
  if (/no flat spot/.test(t) && /kink/.test(t)) okay('broken: no c, kink named'); else fail('broken verdict: ' + t);
  await page.click('#fl-tabs [data-t="rolle"]');

  console.log('— W2 · Rolle ladder —');
  t = norm(await text('#ld-read'));
  if (/1\.5401/.test(t) && /1\.0716/.test(t) && /0\.5832/.test(t)) okay('c₁ = 1.5401, c₂ = 1.0716, c₃ = 0.5832 (eˣ, b=2, n=3)'); else fail('ladder readout: ' + t);
  if (/1\.7918/.test(t)) okay('f‴(c₃) = 3!·a₃ = 1.7918'); else fail('ladder remainder identity missing: ' + t);
  t = norm(await text('#ld-verdict'));
  if (/a < c₃ < c₂ < c₁ < b/.test(t)) okay('nesting verdict'); else fail('ladder verdict: ' + t);

  console.log('— W3 · remainder detective —');
  await page.click('#w-rem [data-p="a3"]'); await page.waitForTimeout(200);
  t = norm(await text('#rm-read'));
  if (/2\.049375/.test(t) && /1\.515e-5/.test(t) && /c = 4\.0494/.test(t)) okay('A3: P₂(4.2)=2.049375, error 1.515e−5, c=4.0494'); else fail('A3 readout: ' + t);
  t = norm(await text('#rm-verdict'));
  if (/\|error\| ≤ bound/.test(t)) okay('A3 verdict: bound holds, c inside'); else fail('A3 verdict: ' + t);
  await page.click('#w-rem [data-p="cos05"]'); await page.waitForTimeout(200);
  t = norm(await text('#rm-read'));
  if (/0\.875/.test(t) && /2\.58\d?e-3|0\.00258/.test(t)) okay('cos 0.5: P₃ = 0.875, error ≈ 2.58e−3'); else fail('cos05 readout: ' + t);

  console.log('— W4 · line trick —');
  await page.click('#w-walk [data-p="a2"]'); await page.waitForTimeout(400);
  t = norm(await text('#wk-read'));
  if (/Q\(S\) = 0\.22/.test(t) && /0\.21956/.test(t) && /-4\.36e-4/.test(t)) okay('A2: Q(S)=0.22, f(S)=0.21956, gap −4.36e−4'); else fail('A2 readout: ' + t);
  await page.click('#w-walk [data-p="a2x2"]'); await page.waitForTimeout(400);
  t = norm(await text('#wk-read'));
  if (/-4\.3\d?e-3/.test(t)) okay('double step: gap −4.36e−3 (≈10×)'); else fail('a2x2 readout: ' + t);

  console.log('— W5 · judge —');
  await page.click('#jd-presets [data-p="b2"]'); await page.click('#jd-tabs [data-t="eig"]'); await page.waitForTimeout(300);
  t = norm(await text('#jd-read'));
  if (/λ₁ = 7\.24/.test(t) && /λ₂ = 2\.76/.test(t) && /det 20/.test(t)) okay('B2: λ = 7.24, 2.76, det 20'); else fail('judge eig readout: ' + t);
  t = norm(await text('#jd-verdict'));
  if (/D > 0 and fxx > 0/.test(t) && /minimum/.test(t)) okay('B2 verdict: bowl'); else fail('judge verdict: ' + t);
  await page.click('#jd-presets [data-p="saddle"]'); await page.click('#jd-tabs [data-t="disc"]'); await page.waitForTimeout(300);
  t = norm(await text('#jd-verdict'));
  if (/saddle/.test(t)) okay('saddle preset → saddle'); else fail('saddle verdict: ' + t);
  await page.click('#jd-presets [data-p="trough"]'); await page.waitForTimeout(300);
  t = norm(await text('#jd-verdict'));
  if (/D = 0/.test(t)) okay('trough → D = 0 silent'); else fail('trough verdict: ' + t);
  await page.click('#jd-presets [data-p="twist"]'); await page.click('#jd-tabs [data-t="eig"]'); await page.waitForTimeout(300);
  t = norm(await text('#jd-read'));
  if (/λ₁ = 1\b/.test(t) && /λ₂ = -1\b/.test(t)) okay('twist (A2 Hessian): λ = ±1'); else fail('twist readout: ' + t);

  console.log('— W6 · compass —');
  await page.click('#rs-presets [data-p="saddle"]'); await page.waitForTimeout(200);
  t = norm(await text('#rs-read'));
  if (/λ₁ = 2\b/.test(t) && /λ₂ = -2\b/.test(t) && /zero crossings per turn: 4/.test(t)) okay('saddle rose: λ = ±2, 4 zero crossings'); else fail('rose readout: ' + t);
  await page.click('#rs-presets [data-p="bowl"]'); await page.waitForTimeout(200);
  t = norm(await text('#rs-read'));
  if (/zero crossings per turn: 0/.test(t)) okay('bowl rose: 0 crossings'); else fail('rose bowl: ' + t);

  console.log('— W7 · hunter —');
  t = norm(await text('#ht-read'));
  if (/f\(-2, -2\) = 8/.test(t) && /D = 3/.test(t)) okay('p1: f(−2,−2)=8, D=3'); else fail('p1 readout: ' + t);
  t = norm(await text('#ht-verdict'));
  if (/maximum/.test(t)) okay('p1 verdict: maximum'); else fail('p1 verdict: ' + t);
  await page.click('#ht-presets [data-p="b1"]'); await page.waitForTimeout(900);
  const pts = await page.locator('#ht-points button').count();
  if (pts === 2) okay('b1: two critical points listed'); else fail('b1 points: ' + pts);
  await page.locator('#ht-points button').nth(1).click(); await page.waitForTimeout(400);
  t = norm(await text('#ht-read'));
  if (/-0\.0625/.test(t) && /D = 9/.test(t)) okay('b1 #2: f = −0.0625, D = 9'); else fail('b1 #2 readout: ' + t);
  await page.click('#ht-presets [data-p="p2"]'); await page.waitForTimeout(900);
  t = norm(await text('#ht-verdict'));
  if (/saddle/.test(t)) okay('p2 first point (0,0): saddle'); else fail('p2 verdict: ' + t);
  await page.click('#ht-presets [data-p="h"]'); await page.waitForTimeout(900);
  t = norm(await text('#ht-read'));
  if (/D = 0/.test(t) && /saddle the Hessian cannot see/.test(t)) okay('x⁴ − y⁴: D = 0, truth line'); else fail('h readout: ' + t);
  await page.click('#ht-presets [data-p="p1"]'); await page.waitForTimeout(600);

  console.log('— W8 · factorial —');
  await setRange('fc-x', 5); await page.waitForTimeout(200);
  t = norm(await text('#fc-read'));
  if (/largest term: n = [45]/.test(t)) okay('eˣ at x=5: hump at n=4–5'); else fail('fact readout: ' + t);
  await page.click('#fc-tabs [data-t="ln"]'); await page.waitForTimeout(200);
  t = norm(await text('#fc-verdict'));
  if (/diverges/.test(t)) okay('ln(1+x) at x=5: diverges'); else fail('fact ln verdict: ' + t);
  await setRange('fc-x', 0.8); await page.waitForTimeout(200);
  t = norm(await text('#fc-verdict'));
  if (/radius of trust/.test(t)) okay('ln(1+x) at x=0.8: within radius'); else fail('fact ln 0.8: ' + t);

  console.log('— checks & score —');
  await page.evaluate(() => document.querySelectorAll('.check').forEach(c => c.querySelector('.opts button[data-correct]').click()));
  await page.waitForTimeout(200);
  const chip = norm(await text('#score-chip'));
  if (/17\s*\/\s*17/.test(chip)) okay('all 17 checks pass → 17/17'); else fail('score chip: ' + chip);

  console.log('— theme flip rebuilds stages —');
  await page.click('#theme-btn'); await page.waitForTimeout(9000);
  const light = await page.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), stages: document.querySelectorAll('.stage-canvas canvas').length }));
  if (light.theme === 'light' && light.stages === 4) okay('light theme: 4 stages rebuilt'); else fail('light theme: ' + JSON.stringify(light));
  await page.click('#theme-btn'); await page.waitForTimeout(2000);

  if (errors.length) { errors.forEach(e => fail(e)); } else okay('zero console / page errors');
  console.log(bad ? `\n${bad} FAILURE(S)` : '\nUNIT 8 PASSES ✓');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
