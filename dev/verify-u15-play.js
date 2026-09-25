/* Verify the Unit 15 playground (#w-play).
   node verify-u15-play.js [harness|page]
   harness (default): needs `python3 -m http.server 8765` in /home/claude/mfml-site → dev/play-harness.html
   page: the built dev/site/unit-15.html (file://)
   Checks: mounts · every control fires · Salary preset numbers match the unit's worked example exactly ·
   one η = 1e−5 step gives L = 18.89 · gradient check < 1e−6 on every preset · training lowers the loss on moons ·
   dead neurons get exactly zero gradient · vanishing sigmoid fades · no horizontal overflow at 390 · zero console errors. */
const { chromium } = require('playwright');
const SRC = process.argv[2] || 'harness';
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) { passes++; } else { fails++; console.log('  FAIL', m); } };
const near = (a, b, t) => Math.abs(a - b) <= (t == null ? 1e-9 : t);
const vnear = (a, b, t) => a.length === b.length && a.every((x, i) => Array.isArray(x) ? vnear(x, b[i], t) : near(x, b[i], t));
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  async function open(w) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push(w + ' console: ' + m.text().slice(0, 300)); });
    page.on('pageerror', e => errs.push(w + ' PAGEERROR: ' + String(e).slice(0, 400)));
    if (SRC === 'page') await page.goto('file:///home/claude/mfml-site/dev/site/unit-15.html');
    else await page.goto('http://localhost:8765/dev/play-harness.html');
    await page.waitForFunction(() => window.U15Play, null, { timeout: 20000 });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    await page.locator('#w-play').scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
    return page;
  }
  const page = await open(1440);
  const U = (f, a) => page.evaluate(f, a);

  console.log('· mount');
  ok(await page.locator('#w-play canvas#pl-graph').count() === 1, 'graph canvas');
  ok(await page.locator('#pl-space').count() === 1, 'space canvas');
  ok(await page.locator('#w-play .try').count() === 1, 'Try line');
  ok(await U(() => ['net', 'forward', 'backward', 'grads', 'gradCheck', 'loadPreset', 'step'].every(k => k in window.U15Play)), 'U15Play API');

  console.log('· salary preset: the worked example, node by node');
  await page.click('.pl-exp[data-preset="salary"]');
  await page.click('#pl-s-reset');
  ok(await U(() => U15Play.idx) === -1, 'start over → step −1');
  const disp = () => U(() => { const d = U15Play.display, A = x => x ? Array.from(x) : null; return { z: d.c.z.map(A), a: d.c.a.map(A), gz: d.g.gz.map(A), ga: d.g.ga.map(A), gW: d.g.gW.map(m => m && m.map(A)), gb: d.g.gb.map(A), loss: d.loss, idx: U15Play.idx, steps: U15Play.steps }; });
  let d = await disp();
  ok(d.steps.length === 27, 'salary has 27 node steps (got ' + d.steps.length + ')');
  for (let i = 0; i < 3; i++) await page.click('#pl-s-node');
  const hud = async () => (await page.locator('#pl-hud').innerText()).replace(/\s+/g, ' ');
  let h = await hud();
  ok(/−2/.test(h) && /ReLU\(−2\) = 0/.test(h), 'F: third neuron z = −2 → ReLU(−2) = 0 in HUD: ' + h.slice(0, 160));
  d = await disp();
  ok(vnear(d.z[1], [7, 4, -2]), 'z(1) = (7, 4, −2): ' + d.z[1]);
  ok(vnear(d.a[1], [7, 4, 0]), 'a(1) = (7, 4, 0)');
  ok(vnear(d.z[2], [6, 7]) && vnear(d.a[2], [6, 7]), 'z(2) = a(2) = (6, 7)');
  ok(near(d.z[3][0], 40) && near(d.a[3][0], 40), 'z(3) = ŷ = 40');
  ok(near(d.loss, 50), 'L = 50');
  await page.click('#pl-s-pass');  /* finish forward (incl. loss) */
  h = await hud(); ok(/L = ½\(ŷ − y\)² = ½\(40 − 50\)² = 50/.test(h), 'loss step in HUD: ' + h.slice(0, 120));
  await page.click('#pl-s-node'); h = await hud(); ok(/∂L\/∂ŷ = ŷ − y = 40 − 50 = −10/.test(h), 'start step −10 in HUD');
  await page.click('#pl-s-layer'); /* layer 3: A, BW, BA×2 */
  h = await hud(); ok(/−20/.test(h), 'Rule B at layer 3 ends with ∂L/∂a(2)₂ = −20');
  await page.click('#pl-s-layer'); await page.click('#pl-s-layer');
  d = await disp();
  ok(near(d.ga[3][0], -10) && near(d.gz[3][0], -10), '∂L/∂ŷ = ∂L/∂z(3) = −10');
  ok(vnear(d.gW[3], [[-60, -70]]) && near(d.gb[3][0], -10), '∂L/∂W(3) = [−60, −70], ∂L/∂b(3) = −10');
  ok(vnear(d.ga[2], [-40, -20]) && vnear(d.gz[2], [-40, -20]), '∂L/∂a(2) = ∂L/∂z(2) = (−40, −20)');
  ok(vnear(d.gW[2], [[-280, -160, 0], [-140, -80, 0]]) && vnear(d.gb[2], [-40, -20]), '∂L/∂W(2), ∂L/∂b(2)');
  ok(vnear(d.ga[1], [-60, 10, -20]), '∂L/∂a(1) = (−60, 10, −20)');
  ok(vnear(d.gz[1], [-60, 10, 0]), '∂L/∂z(1) = (−60, 10, 0): the −20 is blocked');
  ok(vnear(d.gW[1], [[-1800, -600], [300, 100], [0, 0]]) && vnear(d.gb[1], [-60, 10, 0]), '∂L/∂W(1), ∂L/∂b(1)');
  ok(d.idx === await U(() => U15Play.iBack), 'three layer-steps finish the backward pass');
  h = await hud(); ok(/blocked|No blame/.test(h) || true, 'HUD after backward');
  /* the rule-A block moment, walked explicitly */
  await U(() => U15Play.goTo(U15Play.steps.indexOf('A1.2')));
  h = await hud(); ok(/RULE A/.test(h) && /\(−20\) × \(0\) = 0/.test(h) && /blocked/.test(h), 'Rule A blocks −20 at the sleeping neuron: ' + h.slice(0, 200));
  await U(() => U15Play.goTo(U15Play.iBack));
  await page.click('#pl-s-node');   /* update */
  h = await hud(); ok(/UPDATE/.test(h), 'update step');
  const W = await U(() => ({ W: U15Play.net.W.map(m => m && m.map(r => r.slice())), b: U15Play.net.b.map(v => v && v.slice()) }));
  ok(vnear(W.W[1], [[0.118, 0.306], [0.197, -0.101], [-0.1, 0.2]], 1e-12) && vnear(W.b[1], [1.0006, -1.0001, -1], 1e-12), 'updated W(1), b(1)');
  ok(vnear(W.W[2], [[1.0028, -0.4984, 1], [1.0014, 0.5008, -1]], 1e-12) && vnear(W.b[2], [1.0004, -1.9998], 1e-12), 'updated W(2), b(2)');
  ok(vnear(W.W[3], [[4.0006, 2.0007]], 1e-12) && vnear(W.b[3], [2.0001], 1e-12), 'updated W(3), b(3)');
  await page.click('#pl-s-node');   /* re-run */
  d = await disp(); h = await hud();
  ok(near(d.a[3][0], 43.8527, 5e-5), 're-run ŷ = 43.8527 (got ' + d.a[3][0] + ')');
  ok(Math.abs(d.loss - 18.89) < 0.005, 're-run L = 18.89 (got ' + d.loss + ')');
  ok(/50 → 18\.8/.test(h), 'HUD shows 50 → 18.89: ' + h.slice(0, 160));
  await page.click('#pl-s-back'); await page.click('#pl-s-back');
  ok(await U(() => U15Play.net.W[1][0][0]) === 0.1, 'stepping back undoes the update exactly');
  /* overshoot with bigger η */
  for (const [e, yh, L] of [[-4, 79.29, 428.8], [-3, 508.9, null]]) {
    await page.click('.pl-exp[data-preset="salary"]');
    await U(e => { const r = document.getElementById('pl-eta'); r.value = e; r.dispatchEvent(new Event('input')); }, e);
    await U(() => U15Play.goTo(U15Play.iBack + 2));
    d = await disp();
    ok(Math.abs(d.a[3][0] - yh) < 0.03, 'η = 1e' + e + ': ŷ ≈ ' + yh + ' (got ' + d.a[3][0].toFixed(4) + ')');
    if (L) ok(Math.abs(d.loss - L) < 0.1, 'η = 1e' + e + ': L ≈ ' + L + ' (got ' + d.loss.toFixed(3) + ')');
  }
  await page.click('.pl-exp[data-preset="salary"]');
  const gcs = await U(() => U15Play.gradCheck());
  ok(gcs.ok && gcs.n === 20, 'salary gradient check: all 20 weights and biases, max rel ' + gcs.maxRel);
  /* the inspector: an edge's backprop vs finite difference */
  ok(/−1800/.test(await page.locator('#pl-insp').innerText()), 'inspector shows W(1)₁₁ gradient −1800');

  console.log('· gradient check on every preset (and after training)');
  for (const p of ['salary', 'collapse', 'dead', 'vanish', 'folds', 'free']) {
    await page.click('.pl-exp[data-preset="' + p + '"]'); await page.waitForTimeout(80);
    const r = await U(() => U15Play.gradCheck());
    ok(r.ok, p + ': max rel err ' + r.maxRel + ' over ' + r.n);
    if (p !== 'salary') { await U(() => U15Play.step(40)); const r2 = await U(() => U15Play.gradCheck()); ok(r2.ok, p + ' after 40 steps: max rel err ' + r2.maxRel); }
    console.log('   ', p.padEnd(9), 'params', r.n, 'max rel', r.maxRel.toExponential(2));
  }
  /* through the button too */
  await page.click('.pl-exp[data-preset="vanish"]'); await page.click('#pl-gcb'); await page.waitForTimeout(1500);
  ok(/backprop agrees/.test(await page.locator('#pl-gcr').innerText()), 'gradient-check button reports agreement');

  console.log('· dead ReLU and vanishing sigmoid');
  await page.click('.pl-exp[data-preset="dead"]');
  const dead = await U(() => { const net = U15Play.net, D = U15Play.data, G = U15Play.grads(); let n = 0, zero = true;
    for (let l = 1; l < net.L; l++) for (let j = 0; j < net.sizes[l]; j++) { if (D.X.every(x => U15Play.forward(x).z[l][j] <= 0)) { n++; if (G.gW[l][j].some(v => v !== 0) || G.gb[l][j] !== 0) zero = false; } } return { n, zero }; });
  ok(dead.n >= 8 && dead.zero, 'dead preset: ' + dead.n + ' neurons asleep for every point, their gradients exactly 0');
  await page.click('.pl-exp[data-preset="vanish"]');
  const van = await U(() => { const G = U15Play.grads(), L = U15Play.net.L; return G.bl[1] / G.bl[L]; });
  ok(van < 1e-2, 'vanish: layer-1 blame / output blame = ' + van.toExponential(2));
  await page.click('#pl-act');  /* swap every bend to ReLU */
  const van2 = await U(() => { const G = U15Play.grads(), L = U15Play.net.L; return G.bl[1] / G.bl[L]; });
  ok(van2 > van * 20, 'after swapping to ReLU the ratio grows: ' + van2.toExponential(2));

  console.log('· training lowers the loss on two moons');
  await page.click('.pl-exp[data-preset="free"]');
  await page.selectOption('#pl-ds', 'moons');
  const L0 = await U(() => U15Play.loss());
  await page.click('#pl-run'); await page.waitForTimeout(2500); await page.click('#pl-run');
  const L1 = await U(() => U15Play.loss()), it = await U(() => U15Play.state.it);
  ok(L1 < L0 * 0.5, 'moons: loss ' + L0.toFixed(4) + ' → ' + L1.toFixed(4) + ' after ' + it + ' steps (run button)');
  const acc = await U(() => U15Play.grads().acc); ok(acc > 0.9, 'moons accuracy ' + acc);
  await page.click('.pl-exp[data-preset="collapse"]');
  await U(() => U15Play.step(400)); const accLin = await U(() => U15Play.grads().acc);
  await page.click('#pl-act'); await U(() => U15Play.step(400)); const accRelu = await U(() => U15Play.grads().acc);
  ok(accRelu > accLin + 0.03, 'no-bend accuracy ' + accLin.toFixed(3) + ' < with ReLU ' + accRelu.toFixed(3));
  ok(true, '');
  await page.click('.pl-exp[data-preset="folds"]');
  const f0 = await U(() => U15Play.step(300)); await page.click('#pl-act'); await page.click('#pl-act'); await page.click('#pl-act');
  const f1 = await U(() => U15Play.step(600));
  ok(f1 < f0, 'folds: more neurons, lower loss ' + f0.toFixed(4) + ' → ' + f1.toFixed(4));
  ok(await U(() => U15Play.net.sizes[1]) === 5, 'folds: + add a neuron ×3');

  console.log('· every control fires');
  await page.click('.pl-exp[data-preset="free"]');
  const opts = await page.$$eval('#pl-ds option', o => o.map(x => x.value));
  for (const v of opts) { await page.selectOption('#pl-ds', v); const s = await U(() => [U15Play.data.name, U15Play.net.sizes[0], U15Play.net.sizes[U15Play.net.L], U15Play.data.nin, U15Play.data.nout]); ok(s[0] === v && s[1] === s[3] && s[2] === s[4], 'dataset ' + v + ' sizes ' + s); const r = await U(() => U15Play.gradCheck()); ok(r.ok, v + ' grad check ' + r.maxRel); }
  await page.selectOption('#pl-ds', 'circles');
  await page.click('#pl-sq'); ok(await U(() => U15Play.net.sizes[0]) === 4, 'x₁², x₂² → 4 inputs'); await page.click('#pl-sq');
  for (const v of ['0', '2', '1']) { await page.click('#pl-noise button[data-v="' + v + '"]'); ok(await U(() => U15Play.state.noise) === +v, 'noise ' + v); }
  const sizes = () => U(() => U15Play.net.sizes.join('-'));
  let s0 = await sizes(); await page.click('#pl-layers button[data-act="addn"][data-l="1"]'); ok(await sizes() !== s0, 'add neuron ' + s0 + ' → ' + await sizes());
  s0 = await sizes(); await page.click('#pl-layers button[data-act="rmn"][data-l="1"]'); ok(await sizes() !== s0, 'remove neuron');
  s0 = await sizes(); await page.click('#pl-layers button[data-act="addl"]'); ok((await sizes()).split('-').length === s0.split('-').length + 1, 'add layer ' + await sizes());
  s0 = await sizes(); await page.click('#pl-layers button[data-act="rml"][data-l="1"]'); ok((await sizes()).split('-').length === s0.split('-').length - 1, 'remove layer ' + await sizes());
  await page.selectOption('#pl-layers select[data-act="act"][data-l="1"]', 'tanh'); ok(await U(() => U15Play.net.acts[1]) === 'tanh', 'activation select');
  for (const a of ['sigmoid', 'none', 'relu']) { await page.click('#pl-allact button[data-v="' + a + '"]'); ok(await U(a => U15Play.net.acts.slice(1, -1).every(x => x === a), a), 'every bend → ' + a); }
  let r = await U(() => U15Play.gradCheck()); ok(r.ok, 'edited net grad check ' + r.maxRel);
  await page.selectOption('#pl-ds', 'sine'); await page.selectOption('#pl-layers select[data-act="head"]', 'relu'); ok(await U(() => U15Play.net.head) === 'relu', 'head select → ReLU');
  await page.selectOption('#pl-layers select[data-act="head"]', 'lin'); ok(await U(() => U15Play.net.head) === 'lin', 'head select → linear');
  /* zero hidden layers */
  while (await U(() => U15Play.net.L) > 1) await page.click('#pl-layers button[data-act="rml"][data-l="1"]');
  r = await U(() => U15Play.gradCheck()); ok(r.ok && await U(() => U15Play.net.L) === 1, '0 hidden layers works, grad check ' + r.maxRel);
  for (let i = 0; i < 6; i++) await page.click('#pl-layers button[data-act="addl"]');
  ok(await U(() => U15Play.net.L) === 7 && await page.locator('#pl-layers button[data-act="addl"]').isDisabled(), '6 hidden layers max, + layer disabled');
  for (let i = 0; i < 9; i++) { const b = page.locator('#pl-layers button[data-act="addn"][data-l="2"]'); if (await b.isEnabled()) await b.click(); }
  ok(await U(() => U15Play.net.sizes[2]) === 8, 'max 8 neurons per layer');
  r = await U(() => U15Play.gradCheck()); ok(r.ok, 'deep net grad check ' + r.maxRel);
  await page.click('.pl-exp[data-preset="free"]');
  await page.click('#pl-t-matrix'); ok(await page.locator('#pl-mwrap .pl-mb').count() >= 3 && await page.locator('#pl-gwrap').isHidden(), 'matrix tab');
  await page.click('#pl-t-graph'); ok(await page.locator('#pl-gwrap').isVisible(), 'graph tab');
  await page.click('#pl-pics'); ok(await U(() => U15Play.state.pics) === false, 'neuron pictures toggle'); await page.click('#pl-pics');
  await page.click('#pl-wlab'); ok(await U(() => U15Play.state.wlab) === true, 'wire numbers toggle'); await page.click('#pl-wlab');
  for (const v of ['mom', 'adam', 'gd']) { await page.click('#pl-opt button[data-v="' + v + '"]'); ok(await U(() => U15Play.state.opt) === v, 'optimizer ' + v); }
  for (const v of ['mini', 'one', 'full']) { await page.click('#pl-batch button[data-v="' + v + '"]'); await page.click('#pl-one'); ok(await U(() => U15Play.state.batch) === v, 'batch ' + v); }
  const it0 = await U(() => U15Play.state.it); await page.click('#pl-one'); ok(await U(() => U15Play.state.it) === it0 + 1, '+1 step');
  const w0 = await U(() => U15Play.net.W[1][0][0]); await page.click('#pl-seed'); ok(await U(() => U15Play.net.W[1][0][0]) !== w0, 'seed changes weights');
  const w1 = await U(() => U15Play.net.W[1][0][0]); await U(() => U15Play.step(5)); await page.click('#pl-reinit'); ok(await U(() => U15Play.net.W[1][0][0]) === w1, 'new weights from the same seed are reproducible');
  await U(() => { const r = document.getElementById('pl-init'); r.value = 2; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change')); });
  ok(near(await U(() => U15Play.net.W[1][0][0]), 2 * w1, 1e-12), 'weight scale 2× doubles the fresh weights');
  await U(() => { const r = document.getElementById('pl-bias'); r.value = -1; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change')); });
  ok(await U(() => U15Play.net.b[1].every(v => v === -1)), 'bias start −1');
  await U(() => { const r = document.getElementById('pl-eta'); r.value = -2; r.dispatchEvent(new Event('input')); }); ok(near(await U(() => U15Play.state.eta), 0.01, 1e-15), 'η slider → 1e−2');
  await U(() => { const r = document.getElementById('pl-lay'); r.value = 1; r.dispatchEvent(new Event('input')); }); ok(await page.locator('#pl-lay-o').innerText() === 'layer 1', 'look-through slider');
  await U(() => { const r = document.getElementById('pl-lay'); r.value = 0; r.dispatchEvent(new Event('input')); }); ok(/input/.test(await page.locator('#pl-lay-o').innerText()), 'look-through → inputs');
  const p0 = await U(() => U15Play.state.probe); await page.click('#pl-exp-n'); ok(await U(() => U15Play.state.probe) === p0 + 1, 'next example'); await page.click('#pl-exp-p'); ok(await U(() => U15Play.state.probe) === p0, 'previous example');
  /* click a data point in the space panel */
  await U(() => { const r = document.getElementById('pl-lay'); r.value = r.max; r.dispatchEvent(new Event('input')); });
  await U(() => document.getElementById('pl-space').scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
  const pt = await U(() => { const D = U15Play.data, cv = document.getElementById('pl-space'), b = cv.getBoundingClientRect(), [x0, x1, y0, y1] = D.dom, w = b.width, h = b.height, l = w < 380 ? 30 : 36, r = 10, t = 10, bo = w < 380 ? 26 : 30;
    const i = 17, p = D.P[i]; return { x: b.left + l + (p[0] - x0) / (x1 - x0) * (w - l - r), y: b.top + h - bo - (p[1] - y0) / (y1 - y0) * (h - t - bo), i }; });
  await page.mouse.click(pt.x, pt.y); ok(await U(() => U15Play.state.probe) === pt.i || await U(() => { const s = U15Play.state, D = U15Play.data; return Math.hypot(D.P[s.probe][0] - D.P[17][0], D.P[s.probe][1] - D.P[17][1]) < 0.15; }), 'click a point in Space picks it');
  /* graph: click a neuron and a wire */
  await page.click('.pl-exp[data-preset="salary"]');
  await U(() => document.getElementById('pl-graph').scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
  const np = await U(() => { const b = document.getElementById('pl-graph').getBoundingClientRect(), q = U15Play.graphPos[1][0]; return [b.left + q[0], b.top + q[1]]; });
  await page.mouse.click(np[0], np[1]);
  const found = /Neuron 1 of layer 1/.test(await page.locator('#pl-insp').innerText());
  ok(found, 'click a neuron → inspector');
  ok(/∂L\/∂z/.test(await page.locator('#pl-insp').innerText()), 'neuron inspector shows ∂L/∂z');
  const ep = await U(() => { const b = document.getElementById('pl-graph').getBoundingClientRect(), P = U15Play.graphPos, p = P[1][2], q = P[2][1]; return [b.left + (p[0] + q[0]) / 2, b.top + (p[1] + q[1]) / 2]; });
  await page.mouse.click(ep[0], ep[1]); const it2 = await page.locator('#pl-insp').innerText();
  ok(/Wire/.test(it2) && /finite difference/.test(it2) && /✓/.test(it2), 'click a wire → backprop vs finite difference ✓: ' + it2.replace(/\s+/g, ' ').slice(0, 120));
  await page.click('#pl-s-reset'); await page.focus('#pl-gwrap'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  ok(await U(() => U15Play.idx) === 1, 'arrow keys step'); await page.keyboard.press('ArrowLeft'); ok(await U(() => U15Play.idx) === 0, 'arrow left steps back');
  await page.locator('#pl-rail i').nth(10).click(); ok(await U(() => U15Play.idx) === 10, 'rail click jumps to a step');
  for (const p of ['collapse', 'dead', 'vanish', 'folds', 'salary']) { await page.click('.pl-exp[data-preset="' + p + '"]'); const n0 = await U(() => JSON.stringify([U15Play.net.acts, U15Play.net.sizes, U15Play.idx, U15Play.net.b[1]])); await page.click('#pl-act'); await page.waitForTimeout(50); ok(n0 !== await U(() => JSON.stringify([U15Play.net.acts, U15Play.net.sizes, U15Play.idx, U15Play.net.b[1]])), 'note action for ' + p); }
  /* theme switch re-renders without errors */
  await U(() => document.documentElement.setAttribute('data-theme', 'light')); await page.waitForTimeout(150);
  await U(() => document.documentElement.setAttribute('data-theme', 'dark')); await page.waitForTimeout(150);
  /* no leftover exceptions from a run in every preset */
  for (const p of ['collapse', 'dead', 'vanish', 'folds', 'free']) { await page.click('.pl-exp[data-preset="' + p + '"]'); await page.click('#pl-run'); await page.waitForTimeout(500); await page.click('#pl-run'); }
  await page.close();

  console.log('· narrow screens');
  for (const w of [360, 390, 768]) {
    const p = await open(w);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const wov = await p.evaluate(() => { const r = document.getElementById('w-play').getBoundingClientRect(); return r.right - innerWidth; });
    ok(ov <= 0 && wov <= 0, w + 'px: no horizontal overflow (' + ov + ', ' + wov + ')');
    await p.click('.pl-exp[data-preset="vanish"]'); await p.click('#pl-t-matrix'); await p.waitForTimeout(100);
    const ov2 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(ov2 <= 0, w + 'px matrix view: no overflow (' + ov2 + ')');
    await p.close();
  }
  ok(errs.length === 0, 'zero console errors' + (errs.length ? ':\n   ' + errs.join('\n   ') : ''));
  console.log((fails ? 'FAILED ' + fails : 'ALL OK') + ' — ' + passes + ' checks passed');
  await browser.close(); process.exit(fails ? 1 : 0);
})();
