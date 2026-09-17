/* Unit 11 · Optimization II — widget behaviour and numerical correctness (WebGL on). */
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
  const norm = s => s.replace(/\s+/g, ' ').replace(/[−–]/g, '-');

  await page.goto('file:///home/claude/mfml-site/site/unit-11.html');
  await page.waitForTimeout(3000);

  console.log('— page —');
  const counts = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length, derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length, stages: document.querySelectorAll('.stage-canvas canvas').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u11-total'), U: document.title }));
  if (counts.checks === 20 && counts.total === '20') okay('20 checks, total published'); else fail('checks ' + JSON.stringify(counts));
  if (counts.widgets === 15 && counts.derives === 23 && counts.probs === 14 && counts.drawers === 14) okay('15 widgets · 23 derivations in 14 drawers · 14 problems'); else fail('counts ' + JSON.stringify(counts));
  if (counts.stages >= 1 && counts.stages <= 4) okay(counts.stages + ' WebGL stage(s) mounted (lazy; max 4)'); else fail('stages ' + counts.stages);
  if (!counts.katex) okay('no KaTeX errors'); else fail('katex-error ×' + counts.katex);
  if (/^Unit 11 · Optimization II/.test(counts.U)) okay('title: ' + counts.U); else fail('title ' + counts.U);
  const chips = norm(await text('.hero .meta'));
  if (/15 interactive widgets/.test(chips) && /20 inline checks/.test(chips) && /23 proofs/.test(chips) && /14 solved practice problems/.test(chips)) okay('hero chips match the counts'); else fail('hero chips: ' + chips);
  const wide = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide) okay('no display equation overflows at 1300px'); else fail(wide + ' display equations overflow');
  const leak = await page.evaluate(() => (document.documentElement.innerHTML.replace(/mfml-/g, '').match(/MFML|ZC416|BITS|WILP/) || [''])[0]);
  if (!leak) okay('no brand leak in the rendered page'); else fail('brand leak: ' + leak);

  console.log('— hero · the race, then the wall —');
  const seen = new Set();
  for (let i = 0; i < 26; i++) { const p = await page.getAttribute('#hero-3d', 'data-phase'); if (p) seen.add(p); await page.waitForTimeout(1000); }
  if (seen.size >= 3) okay('hero cycles phases: ' + [...seen].join(', ')); else fail('hero phases: ' + [...seen].join(','));

  const show = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); };

  console.log('— W1 · feet feel the tilt —');
  await show('#w-feel');
  let t = norm(await text('#fl-read'));
  if (/∂J\/∂w₁ = 1/.test(t) && /∂J\/∂w₂ = 10/.test(t)) okay('slopes at [1,1] read 1 and 10'); else fail('feel readout: ' + t);
  if (/44/.test(t)) okay('44 steps for w₁ to reach 1 % at η = 0.1'); else fail('44-step line missing: ' + t);
  await setRange('fl-eta', 0.2); await page.waitForTimeout(400);
  t = norm(await text('#fl-read')) + ' ' + norm(await text('#fl-verdict'));
  if (/-1\.00/.test(t)) okay('η = 0.2 gives the steep factor exactly −1'); else fail('η = 0.2: ' + t);
  await setRange('fl-eta', 0.1);

  console.log('— W2 · the loaded trolley —');
  await show('#w-trolley');
  await page.click('#tr-play'); await page.waitForTimeout(5000);
  t = norm(await text('#tr-read'));
  if (/\[0\.72, -0\.90\]/.test(t) && /4\.3092/.test(t)) okay('momentum trace [0.72, −0.90], J = 4.3092'); else fail('trolley readout: ' + t);
  if (/10\.0×|1\/\(1-β\) = 10\.0/.test(t)) okay('steady-state speed-up 10.0×'); else fail('speed-up line: ' + t);

  console.log('— W3 · the permanent record —');
  await show('#w-record');
  t = norm(await text('#rc-read'));
  if (/\[1, 100\]/.test(t) && /\[0\.1, 0\.1\]/.test(t)) okay('A = [1,100]; first step [0.1, 0.1]'); else fail('record readout: ' + t);
  if (/0\.0669/.test(t)) okay('second step 0.0669'); else fail('second step missing: ' + t);

  console.log('— W4 · form, not career average —');
  await show('#w-form');
  t = norm(await text('#fm-read'));
  if (/\[0\.1, 10\]/.test(t) && /\[0\.3162, 0\.3162\]/.test(t)) okay('A = [0.1, 10]; first step 0.3162'); else fail('form readout: ' + t);
  if (/3\.16/.test(t)) okay('inflation 3.16× at ρ = 0.9'); else fail('inflation line: ' + t);
  await setRange('fm-rho', 0.999); await page.waitForTimeout(400);
  t = norm(await text('#fm-read')) + ' ' + norm(await text('#fm-verdict'));
  if (/31\.6/.test(t)) okay('inflation 31.6× at ρ = 0.999'); else fail('ρ = 0.999: ' + t);
  await setRange('fm-rho', 0.9);

  console.log('— W5 · two notebooks and a probation —');
  await show('#w-notebooks');
  t = norm(await text('#nb-read'));
  if (/0\.031623/.test(t) && /\[0\.1000, 0\.1000\]/.test(t)) okay('α₁ = 0.031623 and a first step of exactly 0.1'); else fail('notebooks t=1: ' + t);
  await setRange('nb-t', 2); await page.waitForTimeout(400); t = norm(await text('#nb-read'));
  if (/0\.023532/.test(t) && /0\.8004/.test(t)) okay('α₂ = 0.023532, w⁽²⁾ = [0.8004, 0.8004]'); else fail('notebooks t=2: ' + t);
  t = norm(await text('#nb-chip'));
  if (/0\.015224/.test(t) && /t = 12/.test(t)) okay('αₜ bottoms out at 0.015224 at t = 12'); else fail('alpha_t chip: ' + t);

  console.log('— W6 · five walkers, one valley —');
  await show('#w-five');
  t = norm(await text('#fv-read'));
  if (/GD 0\.3281/.test(t) && /Momentum 4\.3092/.test(t) && /AdaGrad 3\.8173/.test(t) && /RMSProp 1\.3688/.test(t) && /Adam 3\.5236/.test(t)) okay('two-step table matches all five methods'); else fail('race table: ' + t);
  if (/RMSProp 3\.6e-13/.test(t) && /GD 0\.00258/.test(t)) okay('25-step table: RMSProp 3.6e−13, GD 0.00258'); else fail('25-step table: ' + t);
  if (/2\/c = 0\.2000/.test(t)) okay("GD's admissible stride 2/c = 0.2 at c = 10"); else fail('2/c line: ' + t);
  await page.click('#fv-p-stiff'); await page.waitForTimeout(1200);
  await page.click('#fv-play'); await page.waitForTimeout(9000);
  t = norm(await text('#fv-board'));
  if (/diverged/.test(t)) okay('at c = 300 with α = 0.1 a walker is marked diverged'); else fail('stiff board: ' + t);
  await page.click('#fv-p-lecture'); await page.waitForTimeout(1500);

  console.log('— W7 · then someone builds a wall —');
  await show('#w-wall');
  t = norm(await text('#wl-read'));
  if (/x\* = 2\.00/.test(t) && /f\* = 4\.00/.test(t) && /4\.00/.test(t)) okay('c = 2: answer 2, f* = 4, slope 4 ≠ 0'); else fail('wall readout: ' + t);
  await setRange('wl-c', -1); await page.waitForTimeout(400); t = norm(await text('#wl-verdict'));
  if (/free answer|not in the way|good/i.test(t)) okay('c ≤ 0: the wall is not in the way'); else fail('wall inactive verdict: ' + t);
  await setRange('wl-c', 2);
  await page.click('#wl-tabs [data-t="valley"]'); await page.waitForTimeout(1600);
  t = norm(await text('#wl-read'));
  if (/0\.5000/.test(t) && /µ\* = 1\.00/.test(t)) okay('valley tab: J* = 0.5, µ* = 1 at c = 1'); else fail('valley tab: ' + t);

  console.log('— W8 · pushing a box against a wall —');
  await show('#w-arrows');
  t = norm(await text('#ar-read'));
  if (/λ = 4/.test(t) && /f\* = 8/.test(t)) okay('straight fence: λ = 4, f* = 8'); else fail('arrows straight: ' + t);
  await page.click('#ar-tabs [data-t="ridge"]'); await page.waitForTimeout(700);
  t = norm(await text('#ar-read'));
  if (/0\.8944/.test(t) && /0\.4472/.test(t)) okay('ridge tab: touching point (0.8944, 0.4472)'); else fail('arrows ridge: ' + t);
  await page.click('#ar-tabs [data-t="straight"]'); await page.waitForTimeout(500);

  console.log('— W9 · turn the wall into a fine —');
  await show('#w-fine');
  await page.click('#fn-p-star'); await page.waitForTimeout(700);
  t = norm(await text('#fn-read')) + ' ' + norm(await text('#fn-verdict'));
  if (/2µ - µ²\/4/.test(t)) okay('the dual function prints as 2µ − µ²/4'); else fail('fine readout: ' + t);
  if (/4\.0000|d\(4\) = 4|= 4 = p\*/.test(t)) okay('at µ = 4 the straight line does the wall\'s whole job: d = 4 = p*'); else fail('fine at µ*: ' + t);
  await page.click('#fn-p-neg'); await page.waitForTimeout(700);
  t = norm(await text('#fn-verdict'));
  if (/negative|trespass|bribe/i.test(t)) okay('µ < 0 pays you to trespass'); else fail('negative fine verdict: ' + t);
  await page.click('#fn-p-star');

  console.log('— W10 · room left —');
  await show('#w-room');
  const prods = [];
  for (const v of [-1.6, -0.6, 0, 0.6]) { await setRange('rm-x', v); await page.waitForTimeout(250); prods.push(norm(await text('#rm-read'))); }
  const legal = prods.filter(p => /µ·g = 0\.000/.test(p)).length;
  if (legal >= 3) okay('µ·g prints 0.000 in every legal state (' + legal + '/4 sampled)'); else fail('complementary slackness readouts: ' + JSON.stringify(prods));

  console.log('— W11 · the branching interrogation —');
  await show('#w-cases');
  await page.click('#cs-tree [data-b="b1"]'); await page.waitForTimeout(700);
  t = norm(await text('#cs-work')) + ' ' + norm(await text('#cs-verdict'));
  if (/2\/3/.test(t) && /1\/3/.test(t) && /good|survives/i.test(t)) okay('case 1 survives at (2/3, 1/3)'); else fail('case 1: ' + t);
  await page.click('#cs-tree [data-b="b2"]'); await page.waitForTimeout(700);
  t = norm(await text('#cs-work')) + ' ' + norm(await text('#cs-verdict'));
  if (/-2/.test(t) && /reject/i.test(t)) okay('case 2 rejected on µ₂ = −2'); else fail('case 2: ' + t);
  await page.click('#cs-tabs [data-t="many"]');
  await page.waitForTimeout(600);

  console.log('— W12 · which problems are honest —');
  await show('#w-bowl');
  t = norm(await text('#bw-read')) + ' ' + norm(await text('#bw-chip'));
  if (/convex|chord|≤|holds/i.test(t)) okay('chord test reports a verdict'); else fail('bowl readout: ' + t);

  console.log('— W13 · who moves first —');
  await show('#w-duel');
  await setRange('du-x', 1); await setRange('du-mu', 4); await page.waitForTimeout(500);
  t = norm(await text('#du-read'));
  if (/2µ - µ²\/4/.test(t) && /p\* = 4 = d\*/.test(t)) okay('p* = 4 = d*: zero duality gap'); else fail('duel readout: ' + t);
  await page.click('#du-tabs [data-t="gap"]'); await page.waitForTimeout(900);
  await page.click('#du-case [data-c="wells"]');
  await page.waitForTimeout(900);
  t = norm(await text('#du-read'));
  if (/duality gap = 0\.3894|gap = 0\.389/.test(t)) okay('the two-wells problem has a real gap of 0.3894'); else fail('gap tab: ' + t);

  console.log('— W14 · what a wall is worth —');
  await show('#w-price');
  await setRange('pr-c', 2.9); await page.waitForTimeout(500);
  t = norm(await text('#pr-read'));
  if (/9\.60/.test(t) && /9\.62/.test(t)) okay('the price predicts 9.60 against an actual 9.62'); else fail('price readout: ' + t);
  await setRange('pr-c', 1.9); await page.waitForTimeout(500);
  t = norm(await text('#pr-read')) + ' ' + norm(await text('#pr-verdict'));
  if (/µ\* = 0|0\.00/.test(t)) okay('below c = 2 the fence stops biting and the price falls to 0'); else fail('price inactive: ' + t);
  await setRange('pr-c', 3);

  console.log('— W15 · two points and a line —');
  await show('#w-svm');
  await page.click('#sv-tabs [data-t="dual"]');
  await page.waitForTimeout(600);
  await setRange('sv-a', 0.5); await page.waitForTimeout(400);
  t = norm(await text('#sv-read'));
  if (/0\.5/.test(t) && /w = 1|w\* = 1/.test(t)) okay('α* = 0.5 rebuilds w* = 1'); else fail('svm dual: ' + t);
  await page.click('#sv-tabs [data-t="add"]');
  await page.waitForTimeout(600);
  await setRange('sv-x3', 3); await page.waitForTimeout(400);
  t = norm(await text('#sv-read'));
  if (/α₃ = 0\.0000|α₃ = 0\b/.test(t)) okay('a third point at x₃ = 3 gets α₃ = 0 and may be deleted'); else fail('svm third point: ' + t);

  console.log('— console —');
  if (!errors.length) okay('no console or page errors'); else errors.slice(0, 8).forEach(fail);

  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ UNIT 11 WIDGETS PASS');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
