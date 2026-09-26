/* Unit 18 · Attention and Transformers — widget behaviour and numerical correctness (WebGL on).
   PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u18.js   (reads the built page in dev/site/) */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_CONNECTION|net::ERR_/.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0, 200)); if (m.type() === 'warning' && /U18|stage failed|context lost/.test(m.text())) errors.push('WARN: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const text = sel => page.locator(sel).innerText();
  const norm = s => s.replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  const show = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); };
  const click = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(300); };
  const data = (sel, k) => page.evaluate(([s, k]) => document.querySelector(s).dataset[k], [sel, k]);

  await page.goto('file:///home/claude/mfml-site/dev/site/unit-18.html');
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.waitForTimeout(2500);

  console.log('— page —');
  const c = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length,
    w3d: [...document.querySelectorAll('.widget')].filter(w => w.querySelector('.stage3d')).length,
    derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length,
    stages: document.querySelectorAll('.stage-canvas canvas').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u18-total'), T: document.title,
    scoreTotal: document.getElementById('score-total').textContent, crumb: document.querySelector('.topbar .crumb').textContent, kicker: document.querySelector('.hero .kicker').textContent,
    ids: [...document.querySelectorAll('section.unit')].map(s => s.id).join(','), dup: (() => { const s = {}, d = []; document.querySelectorAll('[id]').forEach(e => { if (s[e.id]) d.push(e.id); s[e.id] = 1; }); return d; })() }));
  if (c.checks === 20 && c.total === '20' && c.scoreTotal === '20') okay('20 checks, total published, #score-total = 20'); else fail('checks ' + JSON.stringify(c));
  if (c.widgets === 15 && c.w3d === 5 && c.derives === 14 && c.drawers === 7 && c.probs === 14) okay('15 widgets (5 in 3D) · 14 derivations in 7 drawers · 14 problems'); else fail('counts ' + JSON.stringify(c));
  if (c.ids === 's1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,spractice') okay('sections s1–s12 + spractice'); else fail('section ids ' + c.ids);
  if (!c.dup.length) okay('no duplicate ids'); else fail('duplicate ids ' + c.dup.join(','));
  if (c.stages >= 1 && c.stages <= 4) okay(c.stages + ' WebGL stage(s) mounted at load (lazy)'); else fail('stages ' + c.stages);
  if (!c.katex) okay('no KaTeX errors'); else fail('katex-error ×' + c.katex);
  if (/^Unit 18 · Attention and Transformers/.test(c.T) && /Unit 18 · Attention and Transformers/.test(c.crumb) && /Unit 18 of 20 · by Prof. Saurabh/.test(c.kicker)) okay('title, crumb and kicker say Unit 18'); else fail('title/crumb ' + JSON.stringify([c.T, c.crumb, c.kicker]));
  const chips = norm(await text('.hero .meta'));
  if (/15 interactive widgets · 5 in 3D/.test(chips) && /20 inline checks/.test(chips) && /14 proofs/.test(chips) && /14 solved practice problems/.test(chips)) okay('hero chips: 15 widgets · 5 in 3D · 20 checks · 14 proofs · 14 problems'); else fail('hero chips: ' + chips);
  const leak = await page.evaluate(() => { const h = document.documentElement.innerHTML.replace(/mfml-/g, ''); return (h.match(/MFML|ZC416|BITS|WILP/) || h.match(/exam paper|question bank|past paper/i) || [''])[0]; });
  if (!leak) okay('no brand leak, no "exam paper" wording'); else fail('brand leak: ' + leak);
  const nav = await page.evaluate(() => ({ prev: !!document.querySelector('.hero-prev a[href="unit-17.html"]'), u19: !!document.querySelector('a[href="unit-19.html"]'), nc: document.querySelector('#spractice .next-card').textContent,
    units: (document.documentElement.innerHTML.match(/\{"n":16,"t":"Words as Vectors"\},\{"n":17,"t":"Machines with Memory"\},\{"n":18,"t":"Attention and Transformers"\}\]/) || []).length, U: /var U = 18;/.test(document.documentElement.innerHTML) }));
  if (nav.prev && !nav.u19 && /Unit 19 · The Maths Inside an LLM/.test(nav.nc) && /upcoming/.test(nav.nc) && nav.units === 1 && nav.U) okay('prev link → Unit 17; next-card “Unit 19 — upcoming” (no link); UNITS array ends at 18; U = 18'); else fail('nav ' + JSON.stringify(nav).slice(0, 300));
  const hero = await page.evaluate(() => ({ c: !!document.querySelector('#hero-3d canvas'), r: document.getElementById('hero-3d').dataset.ready }));
  if (hero.c && hero.r === '1') okay('hero stage mounted'); else fail('hero ' + JSON.stringify(hero));

  console.log('— §1 · w-relay —');
  await show('#w-relay'); let t = norm(await text('#rl-read'));
  if (/hand-overs from the first word to the last: 7/.test(t) && /0\.0078/.test(t)) okay('relay, 8 words: 7 hand-overs, voice 0.5⁷ ≈ 0.0078'); else fail('relay ' + t);
  await click('#rl-mode [data-t="all"]'); await setRange('rl-n', 10); t = norm(await text('#rl-read'));
  if (/10 × 10 = 100/.test(t) && /from the first word to the last: 1\b/.test(t)) okay('attention, 10 words: 100 questions, 1 hop (check c1)'); else fail('relay all ' + t);
  await click('#rl-play'); await page.waitForTimeout(1600); await click('#rl-mode [data-t="relay"]'); await click('#rl-play'); await page.waitForTimeout(3500);
  const arcs = await page.evaluate(() => document.querySelectorAll('#rl-svg path').length); if (arcs >= 9) okay('relay play runs; ' + arcs + ' hop arcs drawn'); else fail('relay arcs ' + arcs);
  await setRange('rl-n', 8);

  console.log('— §2 · w-lookup —');
  await show('#w-lookup'); t = norm(await text('#lk-read'));
  if (/masala chai 0\.694/.test(t) && /₹15\.01/.test(t)) okay('kind shopkeeper at wish (1.5, 1): chai 0.694, cup ₹15.01'); else fail('lookup ' + t);
  await click('#lk-mode [data-t="hard"]'); t = norm(await text('#lk-read')); if (/masala chai 1\b/.test(t) && /₹10\b/.test(t)) okay('strict: exactly chai, ₹10'); else fail('lookup hard ' + t);
  await click('#lk-mode [data-t="soft"]'); await setRange('lk-s', 6); t = norm(await text('#lk-read')); if (/masala chai 1\b|masala chai 0\.99/.test(t)) okay('pickiness 6: the kind shopkeeper becomes strict'); else fail('lookup picky ' + t);
  await setRange('lk-s', 0); t = norm(await text('#lk-read')); if (/masala chai 0\.25\b/.test(t) && /₹18\.75/.test(t)) okay('pickiness 0: equal shares, plain average ₹18.75'); else fail('lookup flat ' + t);
  await setRange('lk-s', 1);
  await page.locator('#lk-svg').scrollIntoViewIfNeeded(); await page.waitForTimeout(300); const bb = await page.locator('#lk-svg').boundingBox(); await page.mouse.move(bb.x + bb.width * .77 * 0 + (16 + (1.5 + 2.2) / 4.4 * 350) / 640 * bb.width, bb.y + (368 - (1 + 2.2) / 4.4 * 356) / 380 * bb.height); await page.mouse.down(); await page.mouse.move(bb.x + (16 + (-1 + 2.2) / 4.4 * 350) / 640 * bb.width, bb.y + (368 - (-.6 + 2.2) / 4.4 * 356) / 380 * bb.height, { steps: 6 }); await page.mouse.up();
  const dq = await data('#lk-svg', 'state'); const dqv = dq.replace(/−/g, '-').split(',').map(Number); if (Math.abs(dqv[1] + 1) < .11 && Math.abs(dqv[2] + .6) < .11) okay('dragging the wish arrow moves the query (' + dq + ')'); else fail('lookup drag ' + dq);
  await setRange('lk-qx', 1.5); await setRange('lk-qy', 1);

  console.log('— §3 · w-qkv (3-D) —');
  await show('#w-qkv'); t = norm(await text('#qk-read'));
  if (/\(1\.414, 0, 1\.414\)/.test(t) && /\(0\.446, 0\.108, 0\.446\)/.test(t) && /\(1\.337, 0\.663\)/.test(t)) okay('q = (2, 0): scores (1.414, 0, 1.414), shares (0.446, 0.108, 0.446), answer (1.337, 0.663)'); else fail('qkv ' + t);
  await click('#qk-row [data-t="2"]'); t = norm(await text('#qk-read')); if (/\(0\.248, 0\.248, 0\.503\)/.test(t) && /answer = \(1, 1\)/.test(t)) okay('q = (1, 1): shares (0.248, 0.248, 0.503), answer exactly (1, 1)'); else fail('qkv row3 ' + t);
  const mat = norm(await text('#qk-mat')); if (/0\.663/.test(mat) && /1\.337/.test(mat) && (await page.locator('#qk-mat .rowhot').count()) >= 6) okay('matrix strip shows A and the answers, with the chosen row lit'); else fail('qkv mat ' + mat);
  await setRange('qk-len', 0); t = norm(await text('#qk-read')); if (/answer = \(1, 1\)/.test(t) && /\(0\.333, 0\.333, 0\.333\)/.test(t)) okay('q = (0, 0): equal shares, average (1, 1) (check c4)'); else fail('qkv zero ' + t);
  await click('#qk-row [data-t="0"]'); await click('#qk-play'); await page.waitForTimeout(4800);
  const qk3 = await page.evaluate(() => !!document.querySelector('#qk-3d canvas') && document.querySelector('#qk-3d .hud').textContent); if (qk3 && /answer/.test(qk3)) okay('▶ run the lookup plays all four moves: ' + qk3.slice(0, 40)); else fail('qkv play ' + qk3);

  console.log('— §4 · w-scale —');
  await show('#w-scale'); let s = (await data('#sc-svg', 'state')).split(',');
  if (s[0] === '64' && Math.abs(+s[2] - 8) < 0.5) okay('d = 64, raw: measured spread ' + s[2] + ' ≈ √64 = 8'); else fail('scale ' + s);
  await click('#sc-scaled'); s = (await data('#sc-svg', 'state')).split(','); if (Math.abs(+s[2] - 1) < .08) okay('divide by √d: spread ' + s[2] + ' ≈ 1'); else fail('scale scaled ' + s);
  await setRange('sc-d', 9); s = (await data('#sc-svg', 'state')).split(','); if (s[0] === '512' && Math.abs(+s[2] - 1) < .08) okay('d = 512 scaled: spread still ≈ 1 (' + s[2] + ')'); else fail('scale 512 ' + s);
  await click('#sc-scaled'); s = (await data('#sc-svg', 'state')).split(','); if (Math.abs(+s[2] - 22.6) < 1.5 && +s[3] > .99) okay('d = 512 raw: spread ' + s[2] + ' ≈ 22.6, the row is one-hot (' + s[3] + ')'); else fail('scale 512 raw ' + s);
  await click('#sc-new'); await setRange('sc-d', 6);

  console.log('— §5 · w-attnmap (the lab) —');
  await show('#w-attnmap'); t = norm(await text('#am-read'));
  if (/“it” asks \(head 1/.test(t) && /“ball” 0\.766/.test(t) && /thing feature: 0 → 0\.816/.test(t)) okay('lab: “it” gives “ball” 0.766; its thing feature 0 → 0.816'); else fail('lab ' + t);
  const chipW = norm(await text('#am-toks')); if (/ball 0\.766/.test(chipW) && (chipW.match(/0\.029/g) || []).length === 8) okay('word chips show row “it”: 0.766 and eight × 0.029'); else fail('lab chips ' + chipW);
  await setRange('am-temp', 0.3); t = norm(await text('#am-read')); if (/“ball” (0\.9999|1)\b/.test(t)) okay('temperature 0.3: ball ≈ 0.9999 (check c9)'); else fail('lab temp ' + t);
  await setRange('am-temp', 1);
  await click('#am-head [data-t="1"]'); t = norm(await text('#am-read')); if (/^“it” asks \(head 2/.test(t) && /“because” 0\.7/.test(t)) okay('head 2: “it” looks one word back at “because”'); else fail('lab head2 ' + t);
  await click('#am-head [data-t="0"]'); await click('#am-causal');
  const causal = await page.evaluate(() => { const r = window.U18Lab.st.R.A[0]; return r.every((row, i) => row.every((w, j) => j <= i || w === 0)); }); if (causal) okay('no peeking: every share above the diagonal is exactly 0'); else fail('lab causal');
  await click('#am-causal'); await click('#am-p2'); await page.waitForTimeout(400);
  await page.locator('#am-toks button', { hasText: 'she' }).click(); await page.waitForTimeout(300); t = norm(await text('#am-read'));
  if (/“mother” 0\.789/.test(t)) okay('preset 2: “she” → “mother” 0.789'); else fail('lab she ' + t);
  await page.fill('#am-text', 'the dog chased the kite because it was fast'); await click('#am-go'); await page.waitForTimeout(700); t = norm(await text('#am-read'));
  if (/“kite”/.test(t) && (await page.locator('#am-toks button').count()) === 9) okay('typed sentence: 9 words; “it” finds “kite”'); else fail('lab typed ' + t);
  await page.fill('#am-text', 'the zorble ate it'); await click('#am-go'); t = norm(await text('#am-read')); if (/not in the lab/.test(t) && (await page.locator('#am-toks button.unk').count()) === 1) okay('unknown word flagged and treated as a thing'); else fail('lab unknown ' + t);
  await click('#am-view [data-t="land"]'); await page.waitForTimeout(1200); await click('#am-view [data-t="beams"]'); await click('#am-p1'); await page.waitForTimeout(500);
  const heat = await page.locator('#am-heat rect').count(); if (heat >= 81) okay('heat map: ' + heat + ' cells for 9 × 9'); else fail('heat ' + heat);

  console.log('— §6 · w-heads, w-subspace (3-D) —');
  await show('#w-heads'); s = await data('#hd-svg', 'state'); if (s === 'it,4,5') okay('“it”: head 1 → “ball” (4), head 2 → “because” (5)'); else fail('heads ' + s);
  t = norm(await text('#hd-read')); if (/d k = 512 \/ 8 = 64|dk = 512 \/ 8 = 64/.test(t.replace(/<[^>]+>/g, '')) && /1 048 576/.test(t)) okay('d = 512, h = 8 → 64 each; 4d² = 1 048 576'); else fail('heads read ' + t);
  await setRange('hd-d', 768); await setRange('hd-h', 4); s = await data('#hd-split', 'state'); if (s === '768,16,48,2359296') okay('d = 768, h = 16 → 48 each; 4d² = 2 359 296 (check c10’s total)'); else fail('split ' + s);
  await setRange('hd-d', 512); await setRange('hd-h', 3);
  await show('#w-subspace'); s = await data('#ss-3d', 'state'); let sp = s.split('|');
  if (sp[0] === 'coffee' && sp[1] === 'drink') { const w = sp[2].split(' ').map(Number); if (w[0] === w[2] && w[0] > w[1]) okay('coffee · drink head: chai = lassi on top'); else fail('sub drink ' + s); } else fail('sub state ' + s);
  await click('#ss-head [data-t="2"]'); sp = (await data('#ss-3d', 'state')).split('|'); if (sp[2].split(' ').every(v => v === '0.125')) okay('coffee · sport head: 1/8 each (check c11)'); else fail('sub sport ' + sp);
  await click('#ss-head [data-t="1"]'); await click('#ss-q [data-t="2"]'); sp = (await data('#ss-3d', 'state')).split('|'); { const w = sp[2].split(' ').map(Number); if (w.indexOf(Math.max(...w)) === 3) okay('lassi · hot head: ice gets the most'); else fail('sub lassi ' + sp); }

  console.log('— §7 · w-shuffle, w-clocks, w-rope (3-D) —');
  await show('#w-shuffle'); s = await data('#sh-svg', 'state'); if (s === 'dog bites man|0|1.723,0.277') okay('dog → (1.723, 0.277)'); else fail('shuffle ' + s);
  await page.evaluate(() => window.U18Shuffle.setOrder(['man', 'bites', 'dog'])); await page.waitForTimeout(900); s = await data('#sh-svg', 'state'); if (s === 'man bites dog|0|1.723,0.277') okay('man bites dog: dog still (1.723, 0.277) — order-blind'); else fail('shuffle 2 ' + s);
  await click('#sh-pos'); s = await data('#sh-svg', 'state'); if (s === 'man bites dog|1|1.576,1.284') okay('with position tags, dog last → (1.576, 1.284)'); else fail('shuffle pos ' + s);
  await click('#sh-reset'); await page.waitForTimeout(900); s = await data('#sh-svg', 'state'); if (s === 'dog bites man|1|2.967,0.019') okay('dog first → (2.967, 0.019)'); else fail('shuffle pos2 ' + s);
  await click('#sh-shuffle'); await page.waitForTimeout(900); await click('#sh-pos');
  await show('#w-clocks'); s = await data('#ck-svg', 'state'); if (s === '1|0.8415,0.5403,0.0998,0.9950,0.0100,1.0000,0.0010,1.0000') okay('position 1 tag = (0.841, 0.540, 0.0998, 0.995, 0.0100, 1.000, 0.0010, 1.000)'); else fail('clocks ' + s);
  await setRange('ck-pos', 2); s = await data('#ck-svg', 'state'); if (/^2\|0\.9093,-0\.4161/.test(s)) okay('position 2: sin 2 = 0.909, cos 2 = −0.416 (problem 8)'); else fail('clocks 2 ' + s);
  await show('#w-rope'); s = await data('#rp-3d', 'state'); if (s === '3,1,30,0,0.5000') okay('RoPE m = 3, n = 1, θ = 30°: score 0.5'); else fail('rope ' + s);
  await setRange('rp-m', 5); await setRange('rp-n', 3); s = await data('#rp-3d', 'state'); if (s === '5,3,30,0,0.5000') okay('m = 5, n = 3: still 0.5'); else fail('rope 53 ' + s);
  await setRange('rp-m', 7); await setRange('rp-n', 1); s = await data('#rp-3d', 'state'); if (s === '7,1,30,0,-1.0000') okay('m = 7, n = 1: −1 (check c12)'); else fail('rope 71 ' + s);
  await setRange('rp-m', 3); await setRange('rp-n', 1); await click('#rp-both'); await page.waitForTimeout(1900); s = await data('#rp-3d', 'state'); if (s === '4,2,30,0,0.5000') okay('▶ move both forward: (4, 2), score unchanged 0.5'); else fail('rope both ' + s);
  await click('#rp-many'); s = await data('#rp-3d', 'state'); if (/^4,2,30,1,/.test(s)) okay('three clocks on: ' + s); else fail('rope many ' + s); await click('#rp-many');

  console.log('— §8 · w-layernorm, w-block (3-D) —');
  await show('#w-layernorm'); s = await data('#ln-svg', 'state'); if (s === '1 2 3 6|1|0|-1.069 -0.535 0.000 1.604') okay('LN(1, 2, 3, 6) = (−1.069, −0.535, 0, 1.604)'); else fail('ln ' + s);
  for (const [i, v] of [[1, 2], [2, 4], [3, 4], [4, 6]]) await setRange('ln-x' + i, v); s = await data('#ln-svg', 'state'); if (/\|-1\.414 0\.000 0\.000 1\.414$/.test(s)) okay('LN(2, 4, 4, 6) = (−1.414, 0, 0, 1.414) (check c14)'); else fail('ln c14 ' + s);
  await setRange('ln-g', 2); await setRange('ln-b', 1); s = await data('#ln-svg', 'state'); if (/\|-1\.828 1\.000 1\.000 3\.828$/.test(s)) okay('γ = 2, β = 1: (−1.828, 1, 1, 3.828) (problem 9)'); else fail('ln gb ' + s);
  await show('#w-block'); s = await data('#bk-3d', 'state'); if (/^6\|\(-1\.166, -0\.318, -0\.106, 1\.59\)$/.test(s.replace(/−/g, '-'))) okay('block output (−1.166, −0.318, −0.106, 1.59)'); else fail('block ' + s);
  await click('#bk-reset'); await click('#bk-step'); await page.waitForTimeout(900); await click('#bk-step'); await page.waitForTimeout(900); s = await data('#bk-3d', 'state'); if (/^2\|\(1, 2, 3, 6\)$/.test(s)) okay('two stations up: x + attention = (1, 2, 3, 6)'); else fail('block step ' + s);
  await click('#bk-play'); await page.waitForTimeout(6800); s = await data('#bk-3d', 'state'); if (/^6\|/.test(s)) okay('▶ send the word up reaches the top'); else fail('block play ' + s);
  t = norm(await text('#bk-params')); if (/3 145 728/.test(t) && /3 150 336/.test(t) && /3 152 384/.test(t)) okay('d = 512: 3 145 728 → 3 150 336 → 3 152 384'); else fail('params ' + t);
  await click('#bk-d [data-t="256"]'); t = norm(await text('#bk-params')); if (/262 144/.test(t) && /789 760/.test(t)) okay('d = 256: 262 144 attention … 789 760 in all (problem 10)'); else fail('params 256 ' + t);

  console.log('— §9 · w-mask —');
  await show('#w-mask'); await click('#mk-mode [data-t="dec"]'); s = await data('#mk-svg', 'state');
  if (s === 'dec|1.000 0.000 0.000;0.196 0.804 0.000;0.248 0.248 0.503') okay('decoder rows (1, 0, 0), (0.196, 0.804, 0), (0.248, 0.248, 0.503)'); else fail('mask ' + s);
  t = norm(await text('#mk-read')); if (/\(0\.391, 1\.609\)/.test(t) && /\(2, 0\)/.test(t)) okay('answers (2, 0) and (0.391, 1.609)'); else fail('mask answers ' + t);
  await click('#mk-play'); await page.waitForTimeout(2300); await click('#mk-mode [data-t="cross"]'); t = norm(await text('#mk-read'));
  if (/main → I/.test(t) && /chai → chai/.test(t) && /peeta → drink/.test(t)) okay('cross-attention: main → I, chai → chai, peeta → drink'); else fail('cross ' + t);
  await click('#mk-mode [data-t="enc"]');

  console.log('— §10 · w-cost —');
  await show('#w-cost'); s = await data('#cs-svg', 'state'); if (s === '1000,1,1,1000000') okay('1 000 words: 1 000 000 scores'); else fail('cost ' + s);
  await setRange('cs-h', 12); await setRange('cs-L', 12); t = norm(await text('#cs-read')); if (/144 000 000/.test(t) && /288 MB/.test(t)) okay('12 heads × 12 layers: 144 000 000 scores ≈ 288 MB'); else fail('cost 12 ' + t);
  await setRange('cs-h', 16); await setRange('cs-L', 24); await page.evaluate(() => { window.U18Cost.st.lg = Math.log10(2048); window.U18Cost.draw(); }); s = await data('#cs-svg', 'state'); if (s === '2048,16,24,1610612736') okay('2 048 × 16 × 24: 1 610 612 736 (problem 11)'); else fail('cost p11 ' + s);
  await setRange('cs-n', 3); await setRange('cs-h', 1); await setRange('cs-L', 1);

  console.log('— §11 · w-tiny —');
  await show('#w-tiny'); await page.evaluate(() => window.U18Tiny.go(3)); t = norm(await text('#tn-card')); if (/0\.944/.test(t) && /0\.056/.test(t)) okay('step 4: head 1 row 2 = (0.944, 0.056)'); else fail('tiny step4 ' + t);
  await click('#tn-next'); await click('#tn-next'); t = norm(await text('#tn-card')); if (/0\.196/.test(t) && /0\.804/.test(t)) okay('step 6: head 2 row 2 = (0.196, 0.804)'); else fail('tiny step6 ' + t);
  await click('#tn-end'); t = norm(await text('#tn-card')); if (/chai 0\.877/.test(t) && /loss = .*= 0\.446/.test(t)) okay('step 12: chai 0.877, loss 0.446'); else fail('tiny end ' + t);
  await click('#tn-sent [data-t="play"]'); t = norm(await text('#tn-card')); if (/cricket 0\.874/.test(t)) okay('“I play” → cricket 0.874 (check c20)'); else fail('tiny play ' + t);
  await click('#tn-sent [data-t="drink"]'); await click('#tn-prev'); const cnt = norm(await text('#tn-count')); if (cnt === '11 / 12') okay('back button: 11 / 12'); else fail('tiny back ' + cnt);
  await page.locator('#tn-scrub button').first().click(); await page.waitForTimeout(200);

  console.log('— checks, drawers, practice —');
  const nOk = await page.evaluate(() => { let n = 0; document.querySelectorAll('.check').forEach(ch => { const b = ch.querySelector('.opts button[data-correct]'); if (b) { b.click(); n++; } }); return n; });
  await page.waitForTimeout(300);
  const sc2 = await page.evaluate(() => [document.getElementById('score').textContent, document.getElementById('score-chip').classList.contains('done'), (localStorage.getItem('mfml-u18-checks') || '').split(',').filter(Boolean).length]);
  if (nOk === 20 && sc2[0] === '20' && sc2[1] && sc2[2] === 20) okay('all 20 checks answerable; score 20/20 stored under mfml-u18-checks'); else fail('checks ' + nOk + ' ' + JSON.stringify(sc2));
  const oneRight = await page.evaluate(() => [...document.querySelectorAll('.check')].every(ch => ch.querySelectorAll('.opts button[data-correct]').length === 1 && ch.querySelectorAll('.opts button').length === 3));
  if (oneRight) okay('every check has exactly one right answer among three'); else fail('check options');
  const wrong = await page.evaluate(() => { const ch = document.querySelector('.check'); const b = ch.querySelector('.opts button:not([data-correct])'); b.click(); return ch.querySelector('.why').textContent.slice(0, 20); });
  if (/Not quite/.test(wrong)) okay('a wrong answer explains itself'); else fail('wrong answer: ' + wrong);
  const dr = await page.evaluate(() => { const ds = [...document.querySelectorAll('details.algebra')]; ds.forEach(d => d.open = true); return ds.every(d => d.querySelector('.derive') && d.querySelector('.derive').offsetHeight > 0); });
  if (dr) okay('all 7 drawers open and show their derivations'); else fail('drawers');
  const pr = await page.evaluate(() => { const ss = [...document.querySelectorAll('#spractice details.sol')]; const closed = ss.every(d => !d.open); ss.forEach(d => d.open = true); return [ss.length, closed, document.querySelectorAll('#spractice .pans').length, document.querySelectorAll('#spractice .pstep').length, !!document.querySelector('#spractice .next-card'), document.querySelector('#spractice .sec-num').textContent]; });
  if (pr[0] === 14 && pr[1] && pr[2] === 14 && pr[3] > 45 && pr[4] && pr[5] === '13') okay('practice: 14 solutions (closed at load), 14 answer lines, ' + pr[3] + ' steps, next-card inside, § 13'); else fail('practice ' + JSON.stringify(pr));
  const wide2 = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide2) okay('with every drawer and solution open, no display equation overflows at 1300px'); else fail(wide2 + ' display equations overflow (drawers open)');

  console.log('— narrow screens —');
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(600);
    const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, [...document.querySelectorAll('.katex-display')].filter(k => k.offsetParent && k.scrollWidth > k.clientWidth + 1).length]);
    if (o[0] <= o[1] + 1 && !o[2]) okay(w + 'px: no horizontal overflow, every display equation fits'); else fail(w + 'px overflow ' + JSON.stringify(o)); }
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(3000);
  const small = await page.evaluate(() => { const out = []; document.querySelectorAll('.widget svg').forEach(svg => { if (!svg.checkVisibility || !svg.checkVisibility()) return; const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width; svg.querySelectorAll('text').forEach(t => { const fs = parseFloat(getComputedStyle(t).fontSize) * k; if (fs < 10.9 && t.textContent.trim()) out.push(svg.id + ':' + t.textContent.slice(0, 12) + ':' + fs.toFixed(1)); }); }); return out; });
  if (!small.length) okay('390px: every SVG label renders at ≥ 11 px'); else fail('small labels at 390: ' + small.length + ' e.g. ' + small.slice(0, 6).join(' | '));
  await page.setViewportSize({ width: 1300, height: 950 });

  console.log('— theme flip —');
  await page.click('#theme-btn'); await page.waitForTimeout(1200); await page.click('#theme-btn'); await page.waitForTimeout(600);

  console.log('— console —');
  if (!errors.length) okay('no console or page errors'); else errors.slice(0, 10).forEach(fail);
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ UNIT 18 WIDGETS PASS');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
