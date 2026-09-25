/* Screenshots of the Unit 15 playground (#w-play).
   node shots-u15-play.js [width=1440] [theme=dark] [preset=salary] [src=harness|page] [tag=]
   harness: needs `python3 -m http.server 8765` in /home/claude/mfml-site (serves dev/play-harness.html)
   page:    uses the built dev/site/unit-15.html (file://)
   → shots/u15-play/<width>-<theme>-<preset><tag>-<k>.png, cut into viewport-sized chunks. Prints console errors. */
const { chromium } = require('playwright');
const fs = require('fs');
const W = +(process.argv[2] || 1440), THEME = process.argv[3] || 'dark', PRESET = process.argv[4] || 'salary', SRC = process.argv[5] || 'harness', TAG = process.argv[6] || '';
const OUT = __dirname + '/shots/u15-play/'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const VH = W < 600 ? 844 : 900;
  const page = await browser.newPage({ viewport: { width: W, height: VH }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 240)); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 300)));
  await page.addInitScript(t => { try { localStorage.setItem('mfml-theme', t); } catch (e) {} }, THEME);
  if (SRC === 'page') await page.goto('file:///home/claude/mfml-site/dev/site/unit-15.html');
  else { await page.goto('http://localhost:8765/dev/play-harness.html?theme=' + THEME); await page.waitForFunction(() => window.U15Play); }
  await page.waitForTimeout(800);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), THEME);
  const steps = PRESET.split('+');   /* e.g. "vanish+train200" or "salary+reset+node5" */
  await page.evaluate(p => window.U15Play.loadPreset(p), steps[0]);
  for (const s of steps.slice(1)) {
    if (s.startsWith('train')) await page.evaluate(n => window.U15Play.step(n), +s.slice(5) || 100);
    else if (s === 'reset') await page.click('#pl-s-reset');
    else if (s.startsWith('node')) { for (let i = 0; i < (+s.slice(4) || 1); i++) await page.click('#pl-s-node'); }
    else if (s === 'matrix') await page.click('#pl-t-matrix');
    else if (s.startsWith('ds-')) await page.selectOption('#pl-ds', s.slice(3));
    else if (s === 'addn') await page.click('#pl-act');
    else if (s === 'gc') { await page.click('#pl-gcb'); await page.waitForTimeout(1200); }
    else if (s.startsWith('lay')) await page.evaluate(k => { const r = document.getElementById('pl-lay'); r.value = k; r.dispatchEvent(new Event('input')); }, +s.slice(3));
    else if (s.startsWith('sel')) { const [l, j] = s.slice(3).split('.').map(Number); await page.evaluate(([l, j]) => { window.U15Play.state.sel = { l, j }; }, [l, j]); await page.click('#pl-t-graph'); }
  }
  await page.waitForTimeout(900);
  const loc = page.locator('#w-play');
  await loc.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelectorAll('#w-play.reveal,#w-play .reveal').forEach(n => n.classList.add('in'))); await page.waitForTimeout(1000);
  const bb = await loc.boundingBox();
  const top = bb.y + await page.evaluate(() => scrollY);
  const CH = VH - 60; let k = 0;
  for (let y = top - 20; y < top + bb.height - 30; y += CH) {
    await page.evaluate(v => window.scrollTo(0, v), Math.max(0, y)); await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}${W}-${THEME}-${PRESET}${TAG}-${k}.png` }); k++;
  }
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('shots:', k, 'overflow px:', ov, errs.length ? '\n' + errs.join('\n') : 'no console errors');
  await browser.close();
})();
