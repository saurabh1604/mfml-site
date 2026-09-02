/* Unit 7 · Backpropagation & Automatic Differentiation — widget behaviour and numerical correctness. */
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('  ❌  ' + m); };
const okay = m => console.log('  ok   ' + m);
(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => {
    const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input'));
  }, [id, val]);
  const text = sel => page.locator(sel).innerText();

  await page.goto('file:///home/claude/mfml-site/site/unit-07.html');
  await page.waitForTimeout(900);

  console.log('— W1 · graph machine —');
  await page.click('#gr-fwd'); await page.waitForTimeout(2300);
  let t = await text('#gr-read');
  if (/f\(1\) = 1\.09/.test(t)) okay('forward f(1) = 1.09'); else fail('forward readout: ' + t.replace(/\n/g, ' '));
  await page.click('#gr-bwd'); await page.waitForTimeout(2800);
  t = await text('#gr-read');
  if (/5\.9831/.test(t)) okay('backward x̄ = 5.9831'); else fail('backward readout: ' + t.replace(/\n/g, ' '));
  if (/nudge check: 5\.9831/.test(t)) okay('numerical nudge agrees'); else fail('nudge check missing');
  await setRange('gr-x', 2); await page.waitForTimeout(200);
  await page.click('#gr-bwd'); await page.waitForTimeout(2800);
  t = await text('#gr-read');
  if (/-182\.8/.test(t)) okay('x=2 gives df/dx = -182.87 (companion erratum corrected)'); else fail('x=2 backward: ' + t.replace(/\n/g, ' '));
  await setRange('gr-x', 1);

  console.log('— W2 · paths —');
  await page.click('#pt-tabs [data-t="2"]'); await page.waitForTimeout(150);
  t = await text('#pt-read');
  if (/∂f\/∂x = .*2/.test(t)) okay('∂f/∂x(1,1) = 2'); else fail('paths x: ' + t.replace(/\n/g, ' '));
  await page.click('#pt-tabs [data-t="3"]'); await page.waitForTimeout(150);
  t = await text('#pt-read');
  if (/∂f\/∂y = .*-2/.test(t)) okay('∂f/∂y(1,1) = -2'); else fail('paths y: ' + t.replace(/\n/g, ' '));

  console.log('— W3 · learning neuron —');
  t = await text('#nr-read');
  if (/L = 0\.1447/.test(t) && /-0\.423/.test(t)) okay('start L=0.1447, δ=-0.423 (practice C2)'); else fail('neuron start: ' + t.replace(/\n/g, ' '));
  await page.click('#nr-auto'); await page.waitForTimeout(3100);
  const Lnow = parseFloat((await text('#nr-read')).match(/L = ([\d.]+)/)[1]);
  if (Lnow < 0.01) okay('20 training steps drive L to ' + Lnow + ' < 0.01'); else fail('training did not converge: L = ' + Lnow);
  await page.click('#nr-reset'); await page.waitForTimeout(150);

  console.log('— W4 · layer —');
  await page.click('#ly-stages [data-s="3"]'); await page.waitForTimeout(200);
  t = await text('#w-layer');
  if (/0\.141/.test(t) && /-0\.018/.test(t)) okay('δ⁽ᶻ⁾ = (0.141, -0.018)'); else fail('layer δz missing');
  if (/0\.105, -0\.141/.test(t)) okay('∂L/∂x = A^Tδ = (0.105, -0.141)'); else fail('layer dx missing');

  console.log('— W5 · reuse triangle —');
  await setRange('ct-k', 8); await page.waitForTimeout(150);
  t = await text('#ct-read');
  if (/44/.test(t) && /16/.test(t)) okay('K=8: naive 44 vs backprop 16'); else fail('cost counts: ' + t.replace(/\n/g, ' '));

  console.log('— W6 · stand-in line —');
  t = await text('#ln-read');
  if (/f\(-4\) = 5/.test(t) && /-0\.8/.test(t)) okay('anchor -4: f=5, slope -0.8 (companion example)'); else fail('lin readout: ' + t.replace(/\n/g, ' '));

  console.log('— W7 · gradient checker —');
  await setRange('ck-h', -5); await page.waitForTimeout(150);
  t = await text('#ck-verdict');
  if (/sweet spot/i.test(t)) okay('h=1e-5 lands in the sweet spot'); else fail('checker sweet spot: ' + t);
  await setRange('ck-h', -11); await page.waitForTimeout(150);
  t = await text('#ck-verdict');
  if (/Rounding/i.test(t)) okay('h=1e-11 flagged as rounding zone'); else fail('checker rounding: ' + t);
  await setRange('ck-h', -1.5); await page.waitForTimeout(150);
  t = await text('#ck-verdict');
  if (/Truncation/i.test(t)) okay('h=1e-1.5 flagged as truncation zone'); else fail('checker truncation: ' + t);

  console.log('— page-level —');
  const kerr = await page.locator('.katex-error').count();
  if (kerr === 0) okay('0 KaTeX errors'); else fail(kerr + ' KaTeX errors');
  const empty = await page.evaluate(() =>
    [...document.querySelectorAll('.widget svg')].filter(s => s.children.length === 0 && s.checkVisibility()).map(s => s.id));
  if (empty.length) fail('empty widget svgs: ' + empty.join(', ')); else okay('all 7 widget svgs drew');
  const ids = await page.evaluate(() => {
    const seen = {}, dup = [];
    document.querySelectorAll('[id]').forEach(n => { if (seen[n.id]) dup.push(n.id); seen[n.id] = 1; });
    return dup; });
  if (ids.length) fail('duplicate ids: ' + ids.join(', ')); else okay('no duplicate ids');
  await page.locator('[data-check="c1"] .opts button[data-correct]').click(); await page.waitForTimeout(150);
  const score = await text('#score');
  if (score === '1') okay('check scoring works (1/16)'); else fail('score after c1: ' + score);
  const nc = await page.locator('.next-card').innerText();
  if (/Unit 8/.test(nc)) okay('next-card points at Unit 8'); else fail('next-card: ' + nc.slice(0, 60));
  const probs = await page.locator('.prob').count();
  if (probs === 11) okay('11 practice problems'); else fail(probs + ' problems');
  const derives = await page.locator('.derive').count();
  if (derives === 13) okay("13 derivation boxes render"); else fail(derives + " derive boxes");
  const stot = await text('#score-total');
  if (stot === '16') okay('score total = 16'); else fail('score-total: ' + stot);

  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : '  ok   zero console/page errors');
  if (errors.length) bad++;
  console.log(bad ? `\n${bad} problem(s)` : '\n✓ UNIT 7 FULLY VERIFIED');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
