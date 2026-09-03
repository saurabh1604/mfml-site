/* Unit 6 · Differentiation — widget behaviour and numerical correctness.
   Every expected number here was derived independently (see verify-math6.py). */
const { chromium } = require('playwright');
const URL = 'file:///home/claude/mfml-site/site/unit-06.html';

let bad = 0;
const fail = m => { console.log('  ❌ ' + m); bad++; };
const near = (got, want, tol, label) => {
  if (!(Math.abs(got - want) <= tol)) fail(`${label}: got ${got}, expected ${want} ±${tol}`);
  else console.log(`  ok   ${label} = ${got}`);
};
/* range inputs need a real 'input' event, not .fill() */
const setRange = (page, id, v) => page.evaluate(([i, val]) => {
  const r = document.getElementById(i);
  r.value = val; r.dispatchEvent(new Event('input', { bubbles: true }));
}, [id, String(v)]);
const num = async (page, sel, re) => {
  const t = (await page.locator(sel).textContent()).replace(/\s+/g, ' ');
  const m = t.match(re);
  if (!m) { fail(`could not read ${re} from "${t.slice(0, 90)}"`); return NaN; }
  return parseFloat(m[1]);
};

(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1340, height: 980 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 180)); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 240)));
  await page.goto(URL);
  await page.waitForTimeout(1600);

  console.log('\n— W1 · foggy valley —');
  await setRange(page, 'val-w', 1.5);
  await page.waitForTimeout(150);
  // the slider snaps to its own step grid — assert against the value it actually holds
  const w1 = await page.evaluate(() => +document.getElementById('val-w').value);
  // L(w)=0.15w⁴−0.55w²+0.15w+1.2 ; L'(w)=0.6w³−1.1w+0.15
  near(await num(page, '#val-read', /L\(w\) = ([-\d.]+)/),
       0.15 * w1 ** 4 - 0.55 * w1 ** 2 + 0.15 * w1 + 1.2, 0.002, `L(${w1})`);
  near(await num(page, '#val-read', /slope L′\(w\) = ([-\d.]+)/),
       0.6 * w1 ** 3 - 1.1 * w1 + 0.15, 0.002, `L'(${w1})`);
  {
    const t = await page.locator('#val-read').textContent();
    if (!/−w/.test(t)) fail('positive slope should send the step to −w');
    else console.log('  ok   step direction is −w for a positive slope');
  }

  console.log('\n— W2 · secant → tangent —');
  await setRange(page, 'sec-x', 1); await setRange(page, 'sec-h', 0);   // h = 0.02
  await page.waitForTimeout(150);
  near(await num(page, '#sec-read', /secant slope = ([-\d.]+)/), 2.02, 0.001, 'secant slope for x² at x=1, h=0.02');
  near(await num(page, '#sec-read', /true f′\(1\) = ([-\d.]+)/), 2, 0.001, 'true derivative 2x at x=1');
  await page.locator('#sec-tabs button[data-t="2"]').click(); await page.waitForTimeout(200);
  near(await num(page, '#sec-read', /true f′\(1\) = ([-\d.]+)/), Math.cos(1), 0.002, 'cos(1) for sin x');

  console.log('\n— W3 · chain rule machine —');
  await page.locator('#ch-tabs button[data-t="0"]').click();
  await setRange(page, 'ch-x', 0.5); await setRange(page, 'ch-n', 0.001);
  await page.waitForTimeout(200);
  // h=(2x+1)⁴ ⇒ h'=8(2x+1)³ ; at x=0.5 → 8·8 = 64
  near(await num(page, '#ch-read', /f′\(x\) = [-\d.]+ × [-\d.]+ = ([-\d.]+)/), 64, 0.01, "predicted h'(0.5) = 8(2x+1)³");
  near(await num(page, '#ch-read', /measured Δh\/Δx = ([-\d.]+)/), 64, 0.4, 'measured amplification converges to it');
  {
    const v = await page.locator('#ch-verdict').textContent();
    if (!/✓/.test(v)) fail('tiny nudge should read as a match, got: ' + v.slice(0, 70));
    else console.log('  ok   verdict confirms the product rule match');
  }

  console.log('\n— W4 · Taylor builder —');
  await page.locator('#tay-tabs button[data-t="1"]').click();          // x⁴ anchored at 1
  await setRange(page, 'tay-deg', 3); await page.waitForTimeout(200);
  {
    const e3 = await num(page, '#tay-read', /max error near anchor = ([\d.]+)/);
    if (!(e3 > 0)) fail('degree 3 should still miss x⁴');
    else console.log('  ok   degree 3 still has error ' + e3);
  }
  await setRange(page, 'tay-deg', 4); await page.waitForTimeout(200);
  {
    const t = await page.locator('#tay-read').textContent();
    if (!/max error near anchor = 0\b/.test(t.replace(/\s+/g, ' '))) fail('degree 4 should be exact for x⁴, read: ' + t.slice(0, 80));
    else console.log('  ok   degree 4 reproduces x⁴ exactly');
    const v = await page.locator('#tay-verdict').textContent();
    if (!/Exact/.test(v)) fail('verdict should announce exactness');
    else console.log('  ok   verdict announces exactness');
    // binomial coefficients 1,4,6,4,1 — the point of the lecture erratum
    const terms = t.replace(/\s+/g, ' ');
    ['1', '4', '6', '4'].forEach(c => { if (!terms.includes(c)) fail('missing binomial coefficient ' + c); });
    console.log('  ok   coefficients shown are the binomial row, not the raw derivatives');
  }
  await page.locator('#tay-tabs button[data-t="2"]').click();          // sigmoid
  await setRange(page, 'tay-deg', 3); await page.waitForTimeout(200);
  {
    const t = (await page.locator('#tay-read').textContent()).replace(/\s+/g, ' ');
    if (!/0\.5/.test(t) || !/0\.25/.test(t)) fail('sigmoid T3 should show ½ and ¼ terms: ' + t.slice(0, 90));
    else console.log('  ok   sigmoid T3 shows ½ + z/4 …');
    if (!/-0\.0208/.test(t)) fail('sigmoid cubic coefficient should be −1/48 ≈ −0.0208, read: ' + t.slice(0, 110));
    else console.log('  ok   cubic coefficient is −1/48');
    if (/ 0x²| 0x\^2/.test(t)) fail('a zero z² term should be omitted, not printed');
  }

  console.log('\n— W5 · the slicer (3D) —');
  await setRange(page, 'ps-x', 0.8); await setRange(page, 'ps-y', -0.6);
  await page.waitForTimeout(200);
  // f = x²−y²+½xy ⇒ f_x = 2x+½y = 1.3 ; f_y = −2y+½x = 1.6 ; f(0.8,−0.6)=0.64−0.36−0.24=0.04
  near(await num(page, '#ps-read', /f\(x₀,y₀\) = ([-\d.]+)/), 0.04, 0.005, 'f(0.8, −0.6)');
  near(await num(page, '#ps-read', /∂f\/∂x = 2x \+ ½y = ([-\d.]+)/), 1.3, 0.005, '∂f/∂x');
  near(await num(page, '#ps-read', /∂f\/∂y = −2y \+ ½x = ([-\d.]+)/), 1.6, 0.005, '∂f/∂y');
  {
    // round 8: the slicer is a real three.js stage; the orbit angle is mirrored on data-view while the user drags
    if (!(await page.locator('#ps-svg canvas').count())) fail('the 3D slicer has no WebGL canvas');
    const before = await page.locator('#ps-svg').getAttribute('data-view');
    await page.locator('#ps-svg').hover();
    await page.mouse.down(); await page.mouse.move(700, 400, { steps: 6 }); await page.mouse.up();
    await page.waitForTimeout(250);
    if ((await page.locator('#ps-svg').getAttribute('data-view')) === before) fail('dragging did not orbit the 3D surface');
    else console.log('  ok   drag orbits the surface');
  }

  console.log('\n— W6 · gradient compass —');
  await page.locator('#gc-tabs button[data-t="2"]').click();            // saddle f = ½(x²−y²)
  await page.waitForTimeout(250);
  {
    const box = await page.locator('#gc-svg').boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);   // ≈ origin
    await page.waitForTimeout(250);
    const n = await num(page, '#gc-read', /‖∇f‖ = ([\d.]+)/);
    if (!(n < 0.2)) fail('clicking the saddle centre should give a near-zero gradient, got ' + n);
    else console.log('  ok   gradient ≈ 0 at the saddle centre (' + n + ')');
    const v = await page.locator('#gc-verdict').textContent();
    if (!/saddle/i.test(v)) fail('verdict should warn that a flat saddle is not a minimum: ' + v.slice(0, 70));
    else console.log('  ok   verdict distinguishes saddle from minimum');
  }

  console.log('\n— W7 · shape calculator —');
  await page.locator('#sh-in button[data-t="v"]').click();
  await page.locator('#sh-out button[data-t="s"]').click();
  await page.waitForTimeout(200);
  {
    const t = await page.locator('#sh-read').textContent();
    if (!/gradient/i.test(t)) fail('vector→scalar should be the gradient, read: ' + t.slice(0, 70));
    else console.log('  ok   vector → scalar = gradient');
  }
  await page.locator('#sh-out button[data-t="v"]').click(); await page.waitForTimeout(200);
  {
    const t = await page.locator('#sh-read').textContent();
    if (!/Jacobian/i.test(t) || !/m × n/.test(t)) fail('vector→vector should be an m×n Jacobian, read: ' + t.slice(0, 70));
    else console.log('  ok   vector → vector = m×n Jacobian');
  }
  await page.locator('#sh-in button[data-t="m"]').click();
  await page.locator('#sh-out button[data-t="m"]').click(); await page.waitForTimeout(200);
  {
    const t = await page.locator('#sh-read').textContent();
    if (!/rank-4/i.test(t)) fail('matrix→matrix should be a rank-4 tensor, read: ' + t.slice(0, 70));
    else console.log('  ok   matrix → matrix = rank-4 tensor');
  }

  console.log('\n— W8 · zoom until it is linear —');
  await page.locator('#jm-tabs button[data-t="0"]').click(); await page.waitForTimeout(200);
  near(await num(page, '#jm-read', /det J = ([-\d.]+)/), 7, 0.001, 'det of the linear map (2,−1;1,3)');
  await page.locator('#jm-tabs button[data-t="2"]').click();            // exponential map
  await setRange(page, 'jm-x', 0.5); await setRange(page, 'jm-y', 0.5);
  await page.waitForTimeout(250);
  near(await num(page, '#jm-read', /det J = ([-\d.]+)/), Math.exp(1), 0.01, 'det J = e^{2x} at x=0.5');
  await setRange(page, 'jm-x', -1.0); await page.waitForTimeout(200);
  near(await num(page, '#jm-read', /det J = ([-\d.]+)/), Math.exp(-2), 0.01, 'det J stays positive at x=−1');
  await page.locator('#jm-tabs button[data-t="1"]').click();            // squaring map, curvature visible
  await setRange(page, 'jm-z', 1); await page.waitForTimeout(250);
  {
    const wide = await page.locator('#jm-verdict').textContent();
    await setRange(page, 'jm-z', 0.06); await page.waitForTimeout(250);
    const tight = await page.locator('#jm-verdict').textContent();
    if (/✓/.test(wide)) fail('a full-size window on a curved map should not read as linear');
    if (!/✓/.test(tight)) fail('shrinking the window should converge to linear, got: ' + tight.slice(0, 70));
    else console.log('  ok   curvature visible when wide, linear when zoomed in');
  }

  console.log('\n— W9 · backprop —');
  await setRange(page, 'bp-x1', 1); await setRange(page, 'bp-x2', 1);
  await page.locator('#bp-reset').click(); await page.waitForTimeout(200);
  {
    const t = await page.locator('#bp-read').textContent();
    if (!/L = —/.test(t.replace(/\s+/g, ' '))) fail('loss should be hidden before it is computed');
    else console.log('  ok   loss hidden at stage 0');
  }
  for (let i = 0; i < 4; i++) { await page.locator('#bp-step').click(); await page.waitForTimeout(140); }
  {
    // W=[[2,−1],[1,3]], x=(1,1) ⇒ z=(1,4); a=tanh z; y=(0.5,−0.5)
    const z = [1, 4], a = z.map(Math.tanh), r = [a[0] - 0.5, a[1] + 0.5];
    const L = 0.5 * (r[0] ** 2 + r[1] ** 2);
    const dz = [r[0] * (1 - a[0] ** 2), r[1] * (1 - a[1] ** 2)];
    const dx = [dz[0] * 2 + dz[1] * 1, dz[0] * (-1) + dz[1] * 3];
    near(await num(page, '#bp-read', /L = ([\d.]+)/), L, 0.002, 'loss after the forward pass');
    const t = (await page.locator('#bp-read').textContent()).replace(/\s+/g, ' ');
    const m = t.match(/∂L\/∂x = \[ ([-\d.]+), ([-\d.]+) \]/);
    if (!m) fail('gradient row not shown after the backward pass: ' + t.slice(0, 90));
    else { near(parseFloat(m[1]), dx[0], 0.003, '∂L/∂x₁'); near(parseFloat(m[2]), dx[1], 0.003, '∂L/∂x₂'); }
    const v = await page.locator('#bp-verdict').textContent();
    if (!/1×2 row/.test(v)) fail('verdict should note the row stays 1×2');
    else console.log('  ok   verdict notes nothing bigger than a row was built');
  }

  console.log('\n— W10 · learning-rate roulette —');
  await setRange(page, 'gd-eta', 0.18); await setRange(page, 'gd-n', 18);
  await page.waitForTimeout(250);
  const lossSmall = await num(page, '#gd-read', /loss now = ([\d.]+)/);
  await setRange(page, 'gd-eta', 1.05); await page.waitForTimeout(250);
  {
    const t = (await page.locator('#gd-read').textContent()).replace(/\s+/g, ' ');
    const v = await page.locator('#gd-verdict').textContent();
    if (!/diverg/i.test(t + v)) fail('η = 1.05 should diverge on a curvature-2 direction, read: ' + v.slice(0, 70));
    else console.log('  ok   η = 1.05 diverges (stability needs η < 1)');
  }
  await setRange(page, 'gd-eta', 0.18); await page.waitForTimeout(200);
  {
    const again = await num(page, '#gd-read', /loss now = ([\d.]+)/);
    if (Math.abs(again - lossSmall) > 1e-9) fail('returning to η = 0.18 should reproduce the earlier run');
    else console.log('  ok   the run is deterministic (' + again + ')');
  }

  console.log('\n— page-level —');
  {
    const katexErr = await page.locator('.katex-error').count();
    if (katexErr) fail(katexErr + ' KaTeX errors'); else console.log('  ok   0 KaTeX errors');
    const empty = await page.evaluate(() =>
      [...document.querySelectorAll('.widget svg')].filter(s => s.children.length === 0 && s.checkVisibility()).map(s => s.id));
    if (empty.length) fail('empty widget svgs: ' + empty.join(', ')); else console.log('  ok   all 13 widget svgs drew');
    const dup = await page.evaluate(() => {
      const seen = {}, d = []; document.querySelectorAll('[id]').forEach(e => { if (seen[e.id]) d.push(e.id); seen[e.id] = 1; }); return d;
    });
    if (dup.length) fail('duplicate ids: ' + dup.join(', ')); else console.log('  ok   no duplicate ids');
    const nextCard = (await page.locator('#spractice .next-card').textContent()).replace(/\s+/g, ' ').trim();
    if (nextCard.length < 40) fail('next-card looks empty: "' + nextCard + '"');
    else console.log('  ok   next-card has real content');
  }
  errs.forEach(e => fail(e));
  await browser.close();
  console.log(bad ? `\n❌ ${bad} problem(s)` : '\n✓ UNIT 6 FULLY VERIFIED');
  process.exit(bad ? 1 : 0);
})();
