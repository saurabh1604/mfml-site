/* Unit 12 · Principal Component Analysis — widget behaviour and numerical correctness (WebGL on).
   PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u12.js */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const text = async sel => (await page.locator(sel).innerText()).replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  const show = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); };
  /* scroll the control into view, then fire a real DOM click (software-WebGL frames are too slow for Playwright's stability wait) */
  const click = async sel => { await page.evaluate(sel => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center', behavior: 'instant' }); e.click(); }, sel); await page.waitForTimeout(60); };
  const expect = (cond, good, badMsg) => cond ? okay(good) : fail(badMsg);
  /* animations run on the wall clock, but software-WebGL frames are slow: poll a readout until it settles */
  const until = async (sel, re, ms = 8000) => { const t0 = Date.now(); let t = ''; while (Date.now() - t0 < ms) { t = await text(sel); if (re.test(t)) return t; await page.waitForTimeout(250); } return t; };

  await page.goto('file:///home/claude/mfml-site/site/unit-12.html');
  await page.waitForTimeout(2500);

  console.log('— page —');
  const c = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length, derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u12-total'), title: document.title, scoreTotal: document.getElementById('score-total').textContent, secs: document.querySelectorAll('section.unit').length }));
  expect(c.checks === 22 && c.total === '22' && c.scoreTotal === '22', '22 checks, total published, score chip denominator 22', 'checks ' + JSON.stringify(c));
  expect(c.widgets === 16 && c.derives === 15 && c.drawers === 11 && c.probs === 12, '16 widgets · 15 derivations in 11 drawers · 12 problems', 'counts ' + JSON.stringify(c));
  expect(c.secs === 17, '17 sections (16 + practice)', 'sections ' + c.secs);
  expect(!c.katex, 'no KaTeX errors', 'katex-error ×' + c.katex);
  expect(/^Unit 12 · Principal Component Analysis/.test(c.title), 'title: ' + c.title, 'title ' + c.title);
  const chips = await text('.hero .meta');
  expect(/16 interactive widgets · 7 in 3D/.test(chips) && /22 inline checks/.test(chips) && /15 proofs/.test(chips) && /12 solved practice problems/.test(chips), 'hero chips match the counts', 'hero chips: ' + chips);
  const kick = await text('.hero .kicker'); expect(/Unit 12 of 20 · by Prof\. Saurabh/i.test(kick), 'kicker: ' + kick, 'kicker ' + kick);
  const crumb = await text('.topbar .crumb'); expect(crumb === '/ Unit 12 · Principal Component Analysis', 'crumb: ' + crumb, 'crumb ' + crumb);
  const leak = await page.evaluate(() => { const t = document.body.innerText + ' ' + [...document.querySelectorAll('[aria-label],[title],[data-why]')].map(e => (e.getAttribute('aria-label') || '') + (e.getAttribute('title') || '') + (e.getAttribute('data-why') || '')).join(' ') + document.title;
    return ((t.match(/MFML|ZC416|BITS|WILP/) || t.match(/exam paper|question bank/i)) || [''])[0]; });
  expect(!leak, 'no brand leak in the rendered page', 'brand leak: ' + leak);
  const nav = await page.evaluate(() => [...document.querySelectorAll('.toc-nav a')].map(a => a.textContent).join(' | '));
  expect(/Unit 11/.test(nav) && /All units/.test(nav), 'unit switcher: ' + nav, 'switcher ' + nav);
  const next = await page.evaluate(() => { const a = document.querySelector('#spractice .next-card a'); return a ? a.getAttribute('href') + ' ' + a.textContent : ''; });
  expect(/unit-13\.html Unit 13 · Support Vector Machines/.test(next), 'next-card links Unit 13', 'next-card: ' + next);
  const prevLink = await page.evaluate(() => typeof document.querySelector('.toc-nav a[href="unit-11.html"]') === 'object' && !!document.querySelector('.toc-nav a[href="unit-11.html"]'));
  expect(prevLink, 'previous-unit link to unit-11.html', 'no prev link');
  for (const w of [1300, 390]) {
    await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(500);
    const o = await page.evaluate(() => ({ wide: [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 1).map(k => k.textContent.slice(0, 40)), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(!o.wide.length, `no display equation wider than its box at ${w}px`, `${o.wide.length} display equations overflow at ${w}px: ` + o.wide.slice(0, 4).join(' | '));
    expect(o.sw <= o.cw + 1, `no horizontal page scroll at ${w}px`, `horizontal overflow at ${w}px (${o.sw} > ${o.cw})`);
  }
  await page.setViewportSize({ width: 1300, height: 950 }); await page.waitForTimeout(400);

  console.log('— hero · sweep, lock, PC2, flatten —');
  await page.evaluate(() => scrollTo(0, 0));
  const seen = new Set();
  for (let i = 0; i < 24; i++) { const p = await page.getAttribute('#hero-3d', 'data-phase'); if (p) seen.add(p); await page.waitForTimeout(1000); }
  expect(['sweep', 'lock', 'pc2', 'flat'].every(p => seen.has(p)), 'hero cycles: ' + [...seen].join(', '), 'hero phases: ' + [...seen].join(','));

  console.log('— W1 · photograph the cloud —');
  await show('#w-photo');
  await click('#ph-end');
  let t = await until('#ph-read', /turn (0|180)°/); await page.waitForTimeout(1500); t = await text('#ph-read'); const endPct = +(t.match(/= ([\d.]+)%/) || [])[1];
  const ds = await page.evaluate(() => ({ side: document.getElementById('w-photo').dataset.keptSide, end: document.getElementById('w-photo').dataset.keptEnd }));
  expect(Math.abs(endPct - +ds.end) < .15 && endPct < 30, `end-on keeps ${endPct}% (bad verdict)`, 'end-on: ' + t);
  await click('#ph-side'); await page.waitForTimeout(2500);
  t = await text('#ph-read'); const sidePct = +(t.match(/= ([\d.]+)%/) || [])[1];
  expect(Math.abs(sidePct - +ds.side) < .15 && sidePct > 95, `side-on keeps ${sidePct}%`, 'side-on: ' + t);
  const tryPhoto = await text('#w-photo .try');
  expect(tryPhoto.includes('about ' + Math.round(+ds.end) + '%') && tryPhoto.includes('over ' + Math.floor(+ds.side) + '%'), 'the Try line quotes about ' + Math.round(+ds.end) + '% and over ' + Math.floor(+ds.side) + '%', 'Try line numbers: ' + tryPhoto + ' vs ' + JSON.stringify(ds));
  await setRange('ph-tilt', 40); await page.waitForTimeout(300); t = await text('#ph-read');
  expect(/tilt 40°/.test(t), 'tilt slider drives the camera', 'tilt: ' + t);

  console.log('— W2 · pick the better line —');
  await show('#w-line');
  await click('#ln-a'); t = await until('#ln-read', /angle 32\.0°/);
  expect(/spread 5\.45/.test(t) && /λ₁ = 5\.45/.test(t) && /λ₂ = 0\.41/.test(t), 'line A: spread 5.45 = λ₁; λ₂ = 0.41', 'line A: ' + t);
  await click('#ln-b'); t = await until('#ln-read', /angle 122\.0°/);
  expect(/spread 0\.41/.test(t), 'line B: spread 0.41', 'line B: ' + t);
  await click('#ln-tabs [data-t="five"]'); await page.waitForTimeout(300); await setRange('ln-ang', 26.5); await page.waitForTimeout(300); t = await text('#ln-read');
  expect(/spread 12\.00/.test(t) && /λ₂ = 2\.00/.test(t) && /at 26\.6°/.test(t), 'five points: 12.00 at 26.6°, λ₂ = 2', 'five: ' + t);
  await setRange('ln-ang', 0); await page.waitForTimeout(200); t = await text('#ln-read'); expect(/spread 10\.00/.test(t), 'five points at 0°: spread 10', '0°: ' + t);
  await setRange('ln-ang', 90); await page.waitForTimeout(200); t = await text('#ln-read'); expect(/spread 4\.00/.test(t), 'five points at 90°: spread 4', '90°: ' + t);
  await click('#ln-sweep'); await page.waitForTimeout(600);

  console.log('— W3 · which columns explain anything —');
  await show('#w-change');
  await click('#ch-log'); await click('#ch-twins'); t = await until('#ch-read', /97\.0%/);
  expect(/correlation 0\.94/.test(t) && /101\.86/.test(t) && /97\.0%/.test(t) && /3\.14/.test(t), 'twins: corr 0.94; one direction carries 101.86 of 105 (97.0 %)', 'twins: ' + t);

  console.log('— W4 · build C by hand —');
  await show('#w-cov');
  t = await text('#cv-read') + ' ' + await text('#cv-C');
  expect(/Σx₁² = 50\.00/.test(t) && /Σx₂² = 20\.00/.test(t) && /Σx₁x₂ = 20\.00/.test(t) && /10\.00 4\.00 4\.00 4\.00/.test(t) && /26\.6°/.test(t), 'C = [[10,4],[4,4]] from sums 50, 20, 20; top direction 26.6°', 'cov: ' + t);
  await click('#cv-n1'); await page.waitForTimeout(200); t = await text('#cv-C'); expect(/12\.50 5\.00 5\.00 5\.00/.test(t), 'divide by N − 1 → [[12.5,5],[5,5]]', 'N-1: ' + t);
  await click('#cv-n'); await click('#cv-raw'); await page.waitForTimeout(200); t = await text('#cv-C') + ' ' + await text('#cv-read');
  expect(/46\.00 34\.00 34\.00 29\.00/.test(t) && /swung toward the mean at 39\.8°/.test(t), 'forgot to centre → [[46,34],[34,29]], swung toward 39.8°', 'raw: ' + t);
  await click('#cv-raw');
  await page.hover('#cv-C .cvc[data-j="0"][data-k="1"]'); await page.waitForTimeout(200); t = await text('#cv-read');
  expect(/C₁₂ = .* = 20\.00 \/ 5 = 4\.000/.test(t), 'hovering C₁₂ spells out the sum', 'hover: ' + t);
  const tbl = await text('#cv-table'); expect(/sum 0\.00 0\.00/.test(tbl), 'centred columns sum to 0', 'table: ' + tbl);

  console.log('— W5 · the score bowl —');
  await show('#w-bowl'); await page.waitForTimeout(800);
  await setRange('bw-ang', 26.5); await page.waitForTimeout(300); t = await text('#bw-read');
  expect(/score wᵀCw = 12\.000/.test(t) && /λ₁ = 12/.test(t) && /λ₂ = 2/.test(t), 'top of the ring: 12.000 at 26.5°', 'bowl: ' + t);
  await setRange('bw-ang', 45); await page.waitForTimeout(200); t = await text('#bw-read'); expect(/11\.000/.test(t), '45°: wᵀCw = 11 (check c6)', '45: ' + t);
  await click('#bw-b'); await page.waitForTimeout(900); t = await text('#bw-read'); expect(/λ₁ = 9 at 45\.0°/.test(t) && /λ₂ = 1/.test(t), '[[5,4],[4,5]]: 9 at 45°, 1', 'bowl b: ' + t);
  await click('#bw-a'); await click('#bw-play'); await page.waitForTimeout(700);
  const bwCanvas = await page.locator('#bw-3d canvas').count(); expect(bwCanvas === 1, 'bowl WebGL stage mounted', 'bowl canvas ' + bwCanvas);

  console.log('— W6 · the leash —');
  await show('#w-leash');
  await click('#ls-climb'); t = await until('#ls-read', /parallel/);
  expect(/parallel/.test(t) && /Cw = 12\.00 w/.test(t), 'climbing ends where ∇f ∥ ∇g, with λ = 12', 'leash: ' + t);
  await click('#ls-tabs [data-c="c"]'); await setRange('ls-ang', 63.43); await page.waitForTimeout(300); t = await text('#ls-read');
  expect(/parallel/.test(t) && /Cw = 9\.00 w/.test(t), '[[5,2],[2,8]] at 63.43°: parallel, λ = 9', 'leash c: ' + t);

  console.log('— W7 · one number, three readings —');
  await show('#w-three');
  await click('#th-snap'); t = await until('#th-read', /agree — 9\.00/);
  expect(/all three readings agree — 9\.00/.test(t), '[[5,4],[4,5]] snapped to PC1: all three read 9.00', 'three: ' + t);
  await click('#th-snap2'); t = await until('#th-read', /agree — 1\.00/); expect(/agree — 1\.00/.test(t), 'PC2: all three read 1.00', 'three pc2: ' + t);
  await click('#th-b'); await click('#th-snap'); t = await until('#th-read', /agree — 12\.00/); expect(/agree — 12\.00/.test(t), '[[10,4],[4,4]]: 12.00', 'three b: ' + t);
  await setRange('th-ang', 0); await page.waitForTimeout(300); t = await text('#th-read'); expect(/not an eigenvector/.test(t) && /spread wᵀCw = 10\.000/.test(t), 'at 0°: spread 10, not an eigenvector', 'three 0: ' + t);

  console.log('— W8 · find it, peel it —');
  await show('#w-peel');
  await click('#pl-find'); await until('#pl-read', /step 1 of 5/); await page.waitForTimeout(1500); await click('#pl-peel'); t = await until('#pl-read', /4\.00, 1\.00, 0\.00/);
  expect(/step 2 of 5/.test(t) && /4\.00, 1\.00, 0\.00/.test(t), 'after one peel: eigenvalues 4, 1, 0', 'peel: ' + t);
  await click('#pl-play'); t = await until('#pl-read', /step 5 of 5/, 25000); await page.waitForTimeout(1500); t = await text('#pl-read');
  expect(/step 5 of 5/.test(t) && /1\.00, 0\.00, 0\.00/.test(t), 'the whole story ends with only λ₃ = 1 left', 'peel play: ' + t);

  console.log('— W9 · scree and three rules —');
  await show('#w-scree');
  t = await text('#sc-rules'); expect(/M = 3/.test(t) && /M = 2/.test(t) && /\(2\)/.test(t) && /93\.75%/.test(t), 'practice set: target 90 % → 3, elbow → 2, Kaiser (2) flagged', 'scree: ' + t);
  await click('#sc-svd'); await page.waitForTimeout(200); t = await text('#sc-rules') + ' ' + await text('#sc-read'); expect(/M = 2/.test(t) && /5\.26/.test(t) && /95\.06%/.test(t), 'σ = 20,10,5,1: total 5.26, 95.06 % with 2', 'svd: ' + t);
  await click('#sc-noisy'); await page.waitForTimeout(200); t = await text('#sc-rules'); expect(/M = 7/.test(t) && /M = 2/.test(t), 'noisy tail: target → 7, elbow → 2 (they disagree)', 'noisy: ' + t);
  await click('#sc-std'); await page.waitForTimeout(200); t = await text('#sc-rules'); expect(/M = 4/.test(t) && /M = 2[^0-9]/.test(t) && !/\(2\)/.test(t), 'standardised: Kaiser counts (M = 2)', 'std: ' + t);
  await setRange('sc-target', 95); await click('#sc-log'); await page.waitForTimeout(200);

  console.log('— W10 · kept against lost —');
  await show('#w-rebuild');
  await click('#rb-best'); t = await until('#rb-read', /you are on it/);
  expect(/kept .*4\.200 \+ lost .*0\.800 = .*5\.000/.test(t) && /you are on it/.test(t), 'best line keeps 4.2, loses 0.8, total 5', 'rebuild: ' + t);
  await setRange('rb-ang', 125); await page.waitForTimeout(200); t = await text('#rb-read'); expect(/0\.800 \+ lost .*4\.200/.test(t), 'at right angles the split reverses (0.8 kept, 4.2 lost)', 'rebuild 125: ' + t);
  await click('#rb-tabs [data-t="plane"]'); await page.waitForTimeout(1200); await click('#rb-best3'); t = await until('#rb-read', /you are on it/);
  expect(/kept .*8\.500 \+ lost .*0\.500/.test(t) && /you are on it/.test(t), '3-D: the PC1–PC2 plane keeps 8.5 and loses 0.5', 'plane: ' + t);
  await setRange('rb-pitch', 10); await page.waitForTimeout(200);

  console.log('— W11 · twins no more —');
  await show('#w-decor');
  t = await text('#dc-read'); expect(/correlation of the two columns: 0\.78/.test(t), 'before: correlation 0.78', 'decor: ' + t);
  await click('#dc-play'); t = await until('#dc-read', /diag\(/);
  expect(/: 0\.00/.test(t) && /diag\(7\.12, 0\.88\)/.test(t), 'after rotating: correlation 0.00, covariance diag(7.12, 0.88)', 'decor after: ' + t);
  await click('#dc-tabs [data-t="three"]'); await page.waitForTimeout(1200); t = await text('#dc-read3');
  expect(/z₁ = 0\.86·age \+ 0\.43·experience \+ 0\.29·certifications/.test(t) && /\|w₁\|² = 1\.000/.test(t) && /w₁·w₂ = 0\.000/.test(t), 'loadings (6,3,2)/7 and (-1,2,0)/√5 pass both checks', 'loadings: ' + t);
  await click('#dc-flip'); await page.waitForTimeout(300); t = await text('#dc-read3'); expect(/z₁ = -0\.86·age/.test(t) && /signs flipped/.test(t), 'flip: every loading changes sign', 'flip: ' + t);

  console.log('— W12 · keep the biggest layers —');
  await show('#w-eckart'); await page.waitForTimeout(800);
  for (const k of [1, 6, 20]) { await setRange('ek-k', k); await page.waitForTimeout(250); t = await text('#ek-read');
    const m = t.match(/= ([\d.]+) \(measured pixel by pixel: ([\d.]+)\)/); expect(m && m[1] === m[2], `k = ${k}: Frobenius formula ${m && m[1]} = measured ${m && m[2]}`, 'eckart: ' + t); }
  await click('#ek-tabs [data-t="cloud"]'); await page.waitForTimeout(1200);
  for (const [id, r] of [['#ek-r1', 1], ['#ek-r3', 3], ['#ek-r2', 2]]) { await click(id); await page.waitForTimeout(250); t = await text('#ek-read2');
    const m = t.match(/Frobenius error ([\d.]+) \(measured ([\d.]+)\)/); expect(m && m[1] === m[2] && new RegExp('rank ' + r).test(t), `cloud rank ${r}: error ${m && m[1]} = measured`, 'cloud: ' + t); }

  console.log('— W13 · power iteration —');
  await show('#w-power');
  await click('#pw-step'); await page.waitForTimeout(250); t = await text('#pw-read');
  expect(/x₁ = \(0\.7809, 0\.6247\)/.test(t) && /6\.340°/.test(t), 'one pass from (1,0): (0.7809, 0.6247), 6.340° from w₁', 'power: ' + t);
  await click('#pw-step'); await page.waitForTimeout(250); t = await text('#pw-read'); expect(/x₂ = \(0\.7158, 0\.6983\)/.test(t) && /0\.707°/.test(t), 'two passes: (0.7158, 0.6983), 0.707°', 'power 2: ' + t);
  await setRange('pw-ratio', 0.98); await click('#pw-play'); await page.waitForTimeout(1500);
  await click('#pw-tabs [data-t="three"]'); await page.waitForTimeout(1200); await click('#pw3-step'); await click('#pw3-step'); await page.waitForTimeout(400); t = await text('#pw-read');
  expect(/pass 2/.test(t) && /eigenvalues 6, 3, 1/.test(t), '3-D loop steps on the sphere', '3d power: ' + t);

  console.log('— W14 · long data, wide data —');
  await show('#w-wide');
  t = await text('#wd-read'); expect(/C: 1\.152 GB/.test(t) && /K: 12\.8 KB/.test(t) && /at most 39/.test(t), 'gene study: C 1.152 GB, K 12.8 KB, at most 39 non-zero', 'wide: ' + t);
  await setRange('wd-d', 5); await page.waitForTimeout(200); t = await text('#wd-read'); expect(/80 GB/.test(t) && /does not fit/.test(t), 'D = 100,000: 80 GB does not fit', 'wide D: ' + t);
  for (let i = 0; i < 4; i++) { await click('#wd-roll'); await page.waitForTimeout(150); const m = await page.getAttribute('#w-wide', 'data-match'); if (m !== '1') { fail('random wide data: eigenvalues or direction disagree'); break; } if (i === 3) okay('4 random wide datasets: C and K agree, recovered w matches'); }
  await click('#wd-cust'); await page.waitForTimeout(200); t = await text('#wd-read'); expect(/long/.test(t) && /12\.8 KB/.test(t), 'customers: long data, C = 12.8 KB', 'cust: ' + t);

  console.log('— W15 · the recipe —');
  await show('#w-recipe');
  for (const s of [1, 2, 3, 4, 5]) { await click(`#rc-steps button[data-s="${s}"]`); await page.waitForTimeout(1000); }
  t = await text('#rc-read'); expect(/\(f\) undo/.test(t), 'recipe steps (a) → (f) all fire', 'recipe: ' + t);
  await click('#rc-steps button[data-s="2"]'); await page.waitForTimeout(1000); t = await text('#rc-read'); expect(/spreads now 1\.000 and 1\.000/.test(t), 'after standardising both spreads are 1', 'std: ' + t);
  await click('#rc-tabs [data-t="units"]'); await page.waitForTimeout(300); t = await text('#rc-read');
  expect(/height 0\.01, weight 1\.00/.test(t), 'raw units: PC1 loadings 0.01 and 1.00', 'units raw: ' + t);
  await click('#rc-std'); await page.waitForTimeout(300); t = await text('#rc-read'); expect(/height 0\.71, weight 0\.71/.test(t), 'standardised: 0.71 and 0.71', 'units std: ' + t);
  await click('#rc-tabs [data-t="blind"]'); await page.waitForTimeout(300); t = await text('#rc-read');
  const cr = t.match(/PC1 score: (-?[\d.]+) · with the PC2 score: (-?[\d.]+)/); expect(cr && Math.abs(+cr[1]) < .1 && Math.abs(+cr[2]) > .99, `blind to y: r(y, PC1) = ${cr && cr[1]}, r(y, PC2) = ${cr && cr[2]}`, 'blind: ' + t);
  await click('#rc-tabs [data-t="steps"]'); await click('#rc-play'); await page.waitForTimeout(500);

  console.log('— W16 · the calculator —');
  await show('#w-worked');
  t = await text('#wk-cards');
  expect(/λ₁ = 12\.0000, λ₂ = 2\.0000/.test(t) && /w₁ = \(0\.8944, 0\.4472\)/.test(t) && /-5\.814, -1\.789, 2\.236, 1\.342, 4\.025/.test(t) && /85\.71%/.test(t) && !/✗/.test(t), 'five points: every card and every check as in §15', 'worked: ' + t);
  await click('#wk-four'); await page.waitForTimeout(200); t = await text('#wk-cards'); expect(/λ₁ = 9\.0000, λ₂ = 1\.0000/.test(t) && /90\.00%/.test(t), 'Problem 1 points: λ = 9, 1; 90 %', 'four: ' + t);
  await click('#wk-nine'); await page.waitForTimeout(200); const d9 = await page.evaluate(() => ({ l1: document.getElementById('w-worked').dataset.l1, w1: document.getElementById('w-worked').dataset.w1 }));
  expect(d9.l1 === '10.1034' && d9.w1 === '0.0883,0.9961', 'slides’ nine points: λ₁ = 10.1034, w₁ = (0.0883, 0.9961)', 'nine: ' + JSON.stringify(d9));
  await page.fill('#wk-input', '(0,0) (2,2) (4,4) (1,3)'); await click('#wk-apply'); await page.waitForTimeout(200); t = await text('#wk-cards');
  expect(/from 4 points/.test(t) && !/✗/.test(t), 'typed points are used, and every check still passes', 'typed: ' + t);

  console.log('— checks, drawers, practice —');
  await page.evaluate(() => document.querySelectorAll('.check').forEach(c => c.querySelector('.opts button[data-correct]').click()));
  await page.waitForTimeout(300);
  const score = await text('#score-chip'); expect(/22\s*\/\s*22/.test(score), 'every check answerable: ' + score, 'score ' + score);
  const wrongOK = await page.evaluate(() => { const c = document.querySelector('.check'); const b = c.querySelector('.opts button:not([data-correct])'); b.click(); return c.querySelector('.why').className.includes('bad'); });
  expect(wrongOK, 'a wrong answer shows the "not quite" explanation', 'wrong answer did not explain');
  const dr = await page.evaluate(() => { const d = [...document.querySelectorAll('details.algebra')]; d.forEach(x => x.open = true); return d.every(x => x.querySelector('.derive') && x.querySelector('.derive').getBoundingClientRect().height > 50); });
  expect(dr, 'every drawer opens onto its derivations', 'a drawer is empty');
  await page.locator('#spractice').scrollIntoViewIfNeeded();
  await page.click('.sol-bulk button[data-a="open"]'); await page.waitForTimeout(300);
  const open = await page.locator('#spractice details.sol[open]').count(); expect(open === 12, 'Open all opens 12 solutions', 'opened ' + open);
  const pans = await page.locator('#spractice .pans').count(); expect(pans === 12, '12 answer lines', 'pans ' + pans);
  const sec = await text('#spractice .sec-num'); expect(sec === '17', 'practice is §17', 'practice sec-num ' + sec);

  console.log('— theme flip rebuilds the stages —');
  const t0 = Date.now(); await click('#theme-btn'); await page.waitForTimeout(1500);
  const light = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); await show('#w-bowl'); await page.waitForTimeout(1500);
  const bowlCv = await page.locator('#bw-3d canvas').count(); await click('#theme-btn'); await page.waitForTimeout(1000);
  expect(light === 'light' && bowlCv === 1, `theme flips to light and the bowl stage rebuilds (${((Date.now() - t0) / 1000).toFixed(1)} s)`, 'theme flip: ' + light + ' canvases ' + bowlCv);

  console.log('— console —');
  if (!errors.length) okay('no console or page errors'); else errors.slice(0, 10).forEach(fail);
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ UNIT 12 WIDGETS PASS');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
