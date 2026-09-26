/* Unit 16 · Words as Vectors — widget behaviour and numerical correctness (WebGL on).
   PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u16.js */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
const near = (a, b, t) => Math.abs(+a - b) < (t || 1e-4);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_CONNECTION|net::ERR_/.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0, 200)); if (m.type() === 'warning' && /U16|stage failed/.test(m.text())) errors.push('WARN: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => { const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input')); }, [id, val]);
  const text = sel => page.locator(sel).innerText();
  const norm = s => s.replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  const show = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); };
  const click = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(300); };
  const data = (sel, k) => page.evaluate(([s, k]) => document.querySelector(s).dataset[k], [sel, k]);

  await page.goto('file:///home/claude/mfml-site/site/unit-16.html');
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.waitForTimeout(2500);

  console.log('— page —');
  const c = await page.evaluate(() => ({ checks: document.querySelectorAll('.check').length, widgets: document.querySelectorAll('.widget').length,
    w3d: [...document.querySelectorAll('.widget')].filter(w => w.querySelector('.stage3d')).length,
    derives: document.querySelectorAll('.derive').length, drawers: document.querySelectorAll('details.algebra').length, probs: document.querySelectorAll('#spractice .prob').length,
    stages: document.querySelectorAll('.stage-canvas canvas').length, katex: document.querySelectorAll('.katex-error').length, total: localStorage.getItem('mfml-u16-total'), T: document.title,
    scoreTotal: document.getElementById('score-total').textContent, crumb: document.querySelector('.topbar .crumb').textContent, kicker: document.querySelector('.hero .kicker').textContent,
    ids: [...document.querySelectorAll('section.unit')].map(s => s.id).join(',') }));
  if (c.checks === 20 && c.total === '20' && c.scoreTotal === '20') okay('20 checks, total published, #score-total = 20'); else fail('checks ' + JSON.stringify(c));
  if (c.widgets === 14 && c.w3d === 5 && c.derives === 16 && c.drawers === 10 && c.probs === 14) okay('14 widgets (5 in 3D) · 16 derivations in 10 drawers · 14 problems'); else fail('counts ' + JSON.stringify(c));
  if (c.ids === 's1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,spractice') okay('sections s1–s12 + spractice'); else fail('section ids ' + c.ids);
  if (c.stages >= 1 && c.stages <= 4) okay(c.stages + ' WebGL stage(s) mounted at load (lazy)'); else fail('stages ' + c.stages);
  if (!c.katex) okay('no KaTeX errors'); else fail('katex-error ×' + c.katex);
  if (/^Unit 16 · Words as Vectors/.test(c.T) && /Unit 16 · Words as Vectors/.test(c.crumb) && /Unit 16 of 20/.test(c.kicker)) okay('title, crumb and kicker say Unit 16'); else fail('title/crumb ' + JSON.stringify([c.T, c.crumb, c.kicker]));
  const chips = norm(await text('.hero .meta'));
  if (/14 interactive widgets · 5 in 3D/.test(chips) && /20 inline checks/.test(chips) && /16 proofs/.test(chips) && /14 solved practice problems/.test(chips)) okay('hero chips: 14 widgets · 5 in 3D · 20 checks · 16 proofs · 14 problems'); else fail('hero chips: ' + chips);
  const leak = await page.evaluate(() => { const h = document.documentElement.innerHTML.replace(/mfml-/g, ''); return (h.match(/MFML|ZC416|BITS|WILP/) || h.match(/exam paper|question bank|past paper/i) || [''])[0]; });
  if (!leak) okay('no brand leak, no "exam paper" wording'); else fail('brand leak: ' + leak);
  const nav = await page.evaluate(() => ({ prev: !!document.querySelector('.hero-prev a[href="unit-15.html"]'), toc: document.querySelector('.toc-nav') && document.querySelector('.toc-nav').textContent,
    next: !!document.querySelector('#spractice .next-card a[href="unit-17.html"]'), units: (document.documentElement.innerHTML.match(/\{"n":16,"t":"Words as Vectors"\},\{"n":17,"t":"Machines with Memory"\},\{"n":18,"t":"Attention and Transformers"\}\]/) || []).length }));
  if (nav.prev && /Unit 15/.test(nav.toc || '') && /Unit 17/.test(nav.toc || '') && nav.next && nav.units === 1) okay('previous link → Unit 15, live next-card → Unit 17, UNITS ends 16 · 17 · 18'); else fail('nav ' + JSON.stringify(nav));
  const hero = await page.evaluate(() => ({ c: !!document.querySelector('#hero-3d canvas'), r: document.getElementById('hero-3d').dataset.ready }));
  if (hero.c && hero.r === '1') okay('hero stage mounted'); else fail('hero ' + JSON.stringify(hero));

  console.log('— §1 · w-onehot —');
  await show('#w-onehot');
  if (near(await data('#oh-3d', 'cos01'), 0) && near(await data('#oh-3d', 'd02'), Math.SQRT2)) okay('one-hot: cos 0, distance 1.414 for every pair'); else fail('onehot start');
  await click('#oh-mode [data-t="meaning"]'); await page.waitForTimeout(1700);
  const oc = +(await data('#oh-3d', 'cos01')); if (oc > .9) okay('meaning: chai and coffee lean together (cos ' + oc.toFixed(3) + ')'); else fail('onehot meaning ' + oc);
  await click('#oh-play'); await page.waitForTimeout(3200); await click('#oh-mode [data-t="onehot"]');

  console.log('— §2 · w-bigram —');
  await show('#w-bigram');
  let p = (await data('#bg-bars', 'p')).split(',').map(Number);
  if (near(p[2], 2 / 3) && near(p[4], 1 / 3) && (await data('#bg-bars', 'prev')) === 'drink') okay('after "drink": chai 2/3, coffee 1/3'); else fail('bigram ' + p);
  await click('#bg-smooth'); p = (await data('#bg-bars', 'p')).split(',').map(Number);
  if (near(p[2], .3) && near(p[6], .1) && near(p[4], .2)) okay('add-one: chai 0.3, coffee 0.2, cricket 0.1'); else fail('bigram smooth ' + p);
  await click('#bg-smooth');
  await page.fill('#bg-score', 'I drink cricket .'); await page.waitForTimeout(200); if (+(await data('#bg-chain', 'p')) === 0) okay('"I drink cricket ." scores 0 — one unseen pair'); else fail('score zero');
  await page.fill('#bg-score', 'I drink chai .'); await page.waitForTimeout(200); if (near(await data('#bg-chain', 'p'), .5)) okay('"I drink chai ." scores 3/4 · 2/3 · 1 = 0.5'); else fail('score half');
  await page.fill('#bg-text', 'I drink chai .\nI drink coffee .\nI drink chai .\nI play cricket .\nI play football .'); await page.waitForTimeout(400);
  await page.evaluate(() => window.U16Bigram.pick('play')); p = (await data('#bg-bars', 'p')).split(',').map(Number);
  if (p.filter(x => near(x, .5)).length === 2) okay('adding "I play football ." splits the "play" row 1/2 · 1/2'); else fail('bigram edit ' + p);
  await click('#bg-reset'); await click('#bg-gen'); const gen = await data('#bg-out', 'words'); if (/^I (drink|play) \S+ \.$/.test(gen)) okay('✎ writes a sentence: "' + gen + '"'); else fail('generate ' + gen);

  console.log('— §3 · w-perplexity —');
  await show('#w-perplexity');
  if (near(await data('#pp-svg', 'pp'), 3.363586) && near(await data('#pp-svg', 'h'), 1.75)) okay('0.5 · 0.25 · 0.5 · 0.125: 1.75 bits, perplexity 3.364'); else fail('pp default');
  await click('#pp-six'); if (near(await data('#pp-svg', 'pp'), 6)) okay('1/6 each → perplexity 6'); else fail('pp six');
  await click('#pp-perfect'); if (near(await data('#pp-svg', 'pp'), 1)) okay('perfect → 1'); else fail('pp perfect');
  await click('#pp-miss'); const miss = +(await data('#pp-svg', 'pp')); if (miss > 6) okay('one bad miss (0.01) → ' + miss.toFixed(3)); else fail('pp miss ' + miss);
  await setRange('pp-p1', .9); await click('#pp-spec');

  console.log('— §4 · w-cooc —');
  await show('#w-cooc');
  if (near(await data('#co-svg', 'cos'), 40 / Math.sqrt(1722))) okay('window 2: exactly the hand table; cos(chai, coffee) = 0.964'); else fail('cooc default');
  await setRange('co-win', 1); let m = JSON.parse(await data('#co-mat', 'm')); if (JSON.stringify(m[0]) === '[0,4,0,0]') okay('window 1: chai row (0, 4, 0, 0)'); else fail('cooc win1 ' + JSON.stringify(m));
  await setRange('co-win', 3); m = JSON.parse(await data('#co-mat', 'm')); if (JSON.stringify(m[0]) === '[5,4,0,2]') okay('window 3: chai row (5, 4, 0, 2)'); else fail('cooc win3 ' + JSON.stringify(m));
  await setRange('co-win', 2); await click('#co-pick [data-w="cricket"]'); await click('#co-pick [data-w="football"]');
  if (near(await data('#co-svg', 'cos'), 40 / Math.sqrt(1722))) okay('chips: cricket · football, cos 0.964'); else fail('cooc pick');
  await page.evaluate(() => window.U16Cooc.setPair('chai', 'cricket')); if (near(await data('#co-svg', 'cos'), 4 / Math.sqrt(1722))) okay('chai · cricket: cos 0.096'); else fail('cooc chai cricket');

  console.log('— §5 · w-svd-words —');
  await show('#w-svd-words');
  let sv = (await data('#sv-3d', 'state')).split(','); if (sv[0] === 'raw' && sv[1] === '3' && near(sv[2], .9488, 1e-3)) okay('raw, k = 3: energy 94.9%'); else fail('svd ' + sv);
  await setRange('sv-k', 1); sv = (await data('#sv-3d', 'state')).split(','); if (near(sv[2], .6813, 1e-3)) okay('raw, k = 1: 68.1% on the "how common" direction'); else fail('svd k1 ' + sv);
  await setRange('sv-k', 3); let kc = await page.evaluate(() => window.U16Svd.kcos(0, 5)); if (near(kc, .525, 1e-3)) okay('raw, k = 3: cos(chai, cricket) = 0.525'); else fail('svd raw cos ' + kc);
  await click('#sv-mode [data-t="ppmi"]'); kc = await page.evaluate(() => window.U16Svd.kcos(0, 5)); if (Math.abs(kc) < .01) okay('PPMI, k = 3: cos(chai, cricket) ≈ 0 (' + kc.toFixed(4) + ')'); else fail('svd ppmi ' + kc);
  await click('#sv-play'); await page.waitForTimeout(4200); if ((await data('#sv-3d', 'state')).split(',')[1] === '3') okay('▶ squeeze runs k = 1 → 3'); else fail('svd play'); await click('#sv-mode [data-t="raw"]');

  console.log('— §6 · w-sgstep, w-w2v —');
  await show('#w-sgstep');
  if (near(await data('#sg-svg', 'loss'), .948154)) okay('start: loss 0.948'); else fail('sg start');
  await click('#sg-step'); await page.waitForTimeout(700);
  if (near(await data('#sg-svg', 'loss'), .504632) && (await data('#sg-svg', 'v')) === '1.3775,-0.1888') okay('one step: loss 0.505, v = (1.378, −0.189)'); else fail('sg step ' + (await data('#sg-svg', 'loss')) + ' ' + (await data('#sg-svg', 'v')));
  await click('#sg-run'); await page.waitForTimeout(7500); const sgl = +(await data('#sg-svg', 'loss')); if (+(await data('#sg-svg', 'steps')) >= 10 && sgl < .03) okay('▶ ten steps: 11 steps, loss ' + sgl.toFixed(4)); else fail('sg run ' + sgl);
  await click('#sg-reset'); await setRange('sg-eta', .5);
  await show('#w-w2v');
  const w0 = await page.evaluate(() => window.U16W2v.groupCos());
  await page.evaluate(() => window.U16W2v.train(160));
  const w1 = await page.evaluate(() => window.U16W2v.groupCos());
  if (w1.within > .6 && w1.within - w1.between > .6) okay('word2vec trains: same-topic cos ' + w0.within.toFixed(2) + ' → ' + w1.within.toFixed(2) + ', different topics ' + w1.between.toFixed(2)); else fail('w2v ' + JSON.stringify([w0, w1]));
  await setRange('wv-neg', 1); await setRange('wv-win', 3); await click('#wv-play'); await page.waitForTimeout(1500); await click('#wv-play'); await click('#wv-seed');
  if (+(await data('#wv-3d', 'pairs')) === 0) okay('new start resets the training'); else fail('w2v seed');

  console.log('— §7 · w-cost —');
  await show('#w-cost');
  if (near(await data('#cs-svg', 'ratio'), 50000 / 6, 1e-3)) okay('50 000 words, k = 5: 8 333× less work'); else fail('cost ' + (await data('#cs-svg', 'ratio')));
  await setRange('cs-v', 5); await setRange('cs-k', 10); if (near(await data('#cs-svg', 'ratio'), 100000 / 11, 1e-3)) okay('100 000 words, k = 10: 9 091×'); else fail('cost 2');
  await setRange('cs-v', 6); if ((await data('#cs-svg', 'v')) === '1000000') okay('a million words'); else fail('cost M');
  await click('#cs-play'); await page.waitForTimeout(2500); await setRange('cs-v', 4.699); await setRange('cs-k', 5);

  console.log('— §8 · w-lookup, w-nlm —');
  await show('#w-lookup'); await click('#lk-words [data-w="bat"]'); if ((await data('#lk-eq', 'row')) === '2' && /\(0\.1, 0\.9, 0\.2\)/.test(norm(await text('#lk-read')))) okay('one-hot "bat" picks row 3 = (0.1, 0.9, 0.2)'); else fail('lookup');
  await click('#lk-play'); await page.waitForTimeout(2000);
  await show('#w-nlm'); let q = (await data('#nl-svg', 'q')).split(',').map(Number);
  if (Math.abs(q[5] - q[6]) < .02 && q[5] > .4) okay('"drink hot": chai ' + q[5] + ' and coffee ' + q[6] + ' share the top'); else fail('nlm drink hot ' + q);
  await click('#nl-w1 [data-w="I"]'); await click('#nl-w2 [data-w="play"]'); q = (await data('#nl-svg', 'q')).split(',').map(Number);
  if (near(q[8], .256, 6e-4) && q[7] > q[8]) okay('"I play": football 0.256 though never seen; cricket first'); else fail('nlm I play ' + q);
  await click('#nl-w1 [data-w="we"]'); q = (await data('#nl-svg', 'q')).split(',').map(Number); if (near(q[8], .258, 6e-4)) okay('"we play": football 0.258'); else fail('nlm we play ' + q);

  console.log('— §9 · w-para, w-analogy —');
  await show('#w-para');
  if ((await data('#pa2-svg', 'best')) === 'queen' && (await data('#pa2-svg', 'd')) === '3.000,-2.000') okay('king − man + woman = (3, −2) → queen'); else fail('para');
  await click('#pa2-inc'); await page.evaluate(() => window.U16Para.set('man', [2.9, 2])); if ((await data('#pa2-svg', 'best')) === 'woman') okay('inputs allowed, man dragged near king: the input "woman" wins'); else fail('para inc ' + (await data('#pa2-svg', 'best')));
  await click('#pa2-inc'); await click('#pa2-reset');
  await show('#w-analogy'); await page.waitForTimeout(800);
  if ((await data('#ex-3d', 'answer')) === 'queen') okay('explorer: king − man + woman ≈ queen'); else fail('explorer default');
  const want = { 'prince,boy,girl': 'princess', 'Delhi,India,Japan': 'Tokyo', 'puppy,dog,cat': 'kitten', 'king,man,boy': 'prince', 'Paris,France,Italy': 'Rome' };
  let allok = true; for (const k of Object.keys(want)) { await click(`#ex-pre [data-q="${k}"]`); const a = await data('#ex-3d', 'answer'); if (a !== want[k]) { allok = false; fail('explorer ' + k + ' → ' + a); } }
  if (allok) okay('explorer presets: princess · Tokyo · kitten · prince · Rome');
  await page.selectOption('#ex-a', 'actor'); await page.selectOption('#ex-b', 'man'); await page.selectOption('#ex-c', 'woman'); await page.waitForTimeout(300);
  if ((await data('#ex-3d', 'answer')) === 'actress') okay('typed query: actor − man + woman ≈ actress'); else fail('explorer select ' + (await data('#ex-3d', 'answer')));
  for (const d of ['female', 'royal', 'young', 'capital', 'topic']) await click(`#ex-dirs [data-d="${d}"]`);
  await click('#ex-inc'); await click('#ex-inc'); await click('#ex-names'); await click('#ex-names');
  await page.fill('#ex-find', 'chai'); await page.waitForTimeout(300); if (/chai's nearest words/.test(await text('#ex-read'))) okay('find "chai": its neighbours are listed'); else fail('explorer find');
  for (const d of ['female', 'royal', 'young', 'capital', 'topic']) await click(`#ex-dirs [data-d="${d}"]`);

  console.log('— §10 · w-polysemy —');
  await show('#w-polysemy');
  await page.evaluate(() => window.U16Poly.set(1)); const n1 = (await data('#po-3d', 'nn')).split(',');
  await page.evaluate(() => window.U16Poly.set(0)); const n0 = (await data('#po-3d', 'nn')).split(',');
  const CR = ['ball', 'wicket', 'over', 'six', 'bowler', 'batsman', 'stumps', 'run'], AN = ['dog', 'puppy', 'cat', 'kitten', 'cow', 'calf', 'lion', 'cub', 'horse', 'foal', 'tiger'];
  if (n1.every(w => CR.includes(w)) && n0.every(w => AN.includes(w))) okay('100%: nearest are cricket words; 0%: animals'); else fail('polysemy ' + n1 + ' | ' + n0);
  await click('#po-cric'); await page.waitForTimeout(1500); if (+(await data('#po-3d', 's')) > .9) okay('"He hit a six with his bat" pulls bat to cricket'); else fail('polysemy button');
  await click('#po-anim'); await page.waitForTimeout(1500); await setRange('po-s', .5);

  console.log('— §11 · w-cosine —');
  await show('#w-cosine');
  if (near(await data('#cz-svg', 'cos'), 1) && near(await data('#cz-svg', 'dist'), Math.sqrt(5)) && near(await data('#cz-svg', 'dot'), 10)) okay('shoppers (2,1), (4,2): dot 10, cos 1, distance 2.236'); else fail('cosine default');
  await click('#cz-right'); if (near(await data('#cz-svg', 'cos'), 0)) okay('right angle: cos 0'); else fail('cosine right');
  await page.evaluate(() => window.U16Cos.set([1, 0], [1.5, Math.sqrt(3) / 2 * 3])); await click('#cz-norm');
  if (near(await data('#cz-svg', 'dist'), 1)) okay('normalised at 60°: distance √(2 − 2·0.5) = 1'); else fail('cosine norm ' + (await data('#cz-svg', 'dist')));
  await click('#cz-norm'); await click('#cz-shop');

  console.log('— checks, drawers, practice —');
  const nOk = await page.evaluate(() => { let n = 0; document.querySelectorAll('.check').forEach(ch => { const b = ch.querySelector('.opts button[data-correct]'); if (b && ch.querySelectorAll('.opts button[data-correct]').length === 1) { b.click(); n++; } }); return n; });
  await page.waitForTimeout(300);
  const sc2 = await page.evaluate(() => [document.getElementById('score').textContent, document.getElementById('score-chip').classList.contains('done'), (localStorage.getItem('mfml-u16-checks') || '').split(',').filter(Boolean).length]);
  if (nOk === 20 && sc2[0] === '20' && sc2[1] && sc2[2] === 20) okay('all 20 checks answerable (one right answer each); score 20/20 stored under mfml-u16-checks'); else fail('checks ' + nOk + ' ' + JSON.stringify(sc2));
  const wrong = await page.evaluate(() => { const ch = document.querySelector('.check'); const b = ch.querySelector('.opts button:not([data-correct])'); b.click(); return ch.querySelector('.why').textContent.slice(0, 20); });
  if (/Not quite/.test(wrong)) okay('a wrong answer explains itself'); else fail('wrong answer: ' + wrong);
  const dr = await page.evaluate(() => { const ds = [...document.querySelectorAll('details.algebra')]; ds.forEach(d => d.open = true); return ds.every(d => d.querySelector('.derive') && d.querySelector('.derive').offsetHeight > 0); });
  if (dr) okay('all 10 drawers open and show their derivations'); else fail('drawers');
  const pr = await page.evaluate(() => { const ss = [...document.querySelectorAll('#spractice details.sol')]; const closed = ss.every(d => !d.open); ss.forEach(d => d.open = true); return [ss.length, closed, document.querySelectorAll('#spractice .pans').length, document.querySelectorAll('#spractice .pstep').length, !!document.querySelector('#spractice .next-card'), document.querySelector('#spractice .sec-num').textContent]; });
  if (pr[0] === 14 && pr[1] && pr[2] === 14 && pr[3] > 45 && pr[4] && pr[5] === '13') okay('practice: 14 solutions (closed at load), 14 answer lines, ' + pr[3] + ' steps, next-card inside, § 13'); else fail('practice ' + JSON.stringify(pr));
  const nc = norm(await text('#spractice .next-card')); if (/Unit 17 · Machines with Memory/.test(nc) && !/upcoming/.test(nc)) okay('next-card: Unit 17 · Machines with Memory (live)'); else fail('next-card: ' + nc);
  const wide2 = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 2).length);
  if (!wide2) okay('with every drawer and solution open, no display equation overflows at 1300px'); else fail(wide2 + ' display equations overflow (drawers open)');

  console.log('— narrow screens —');
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(600);
    const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, [...document.querySelectorAll('.katex-display')].filter(k => k.offsetParent && k.scrollWidth > k.clientWidth + 1).length]);
    if (o[0] <= o[1] + 1 && !o[2]) okay(w + 'px: no horizontal overflow, every display equation fits'); else fail(w + 'px overflow ' + JSON.stringify(o));
    if (w === 390) { await page.waitForTimeout(600);
      const small = await page.evaluate(() => { const out = []; document.querySelectorAll('.svgstage svg').forEach(s => { const r = s.getBoundingClientRect(); if (!r.width) return; const k = r.width / s.viewBox.baseVal.width;
        s.querySelectorAll('text').forEach(t => { if (!t.textContent.trim()) return; const fs = parseFloat(getComputedStyle(t).fontSize) * k; if (fs < 10.5) out.push(s.id + ':' + t.textContent.slice(0, 12) + ':' + fs.toFixed(1)); }); }); return out; });
      if (!small.length) okay('390px: every SVG label renders at ≥ 10.5 px'); else fail('390px small SVG labels (' + small.length + '): ' + small.slice(0, 8).join(' | ')); } }
  await page.setViewportSize({ width: 1300, height: 950 });

  console.log('— theme flip —');
  await page.click('#theme-btn'); await page.waitForTimeout(1200); await page.click('#theme-btn'); await page.waitForTimeout(600);

  console.log('— console —');
  if (!errors.length) okay('no console or page errors'); else errors.slice(0, 10).forEach(fail);
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ UNIT 16 WIDGETS PASS');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
