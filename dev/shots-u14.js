/* Unit 14 screenshots WITH WebGL: node shots-u13.js [width=1440] [theme=dark] [ids=hero,s1,…|all] [mode=section|widget]
   → shots/u14/<width>-<theme>-<id>-<k>.png (tall shots are cut into ≤1400px chunks). Prints console errors. */
const { chromium } = require('playwright');
const fs = require('fs');
const W = +(process.argv[2] || 1440), THEME = process.argv[3] || 'dark', IDS = process.argv[4] || 'all', MODE = process.argv[5] || 'section';
const OUT = __dirname + '/shots/u14/'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: W, height: W < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 240)); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 300)));
  await page.addInitScript(t => { try { localStorage.setItem('mfml-theme', t); } catch (e) {} }, THEME);
  await page.goto('file:///home/claude/mfml-site/dev/site/unit-14.html');
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  const ids = IDS === 'all' ? await page.evaluate(() => ['hero', ...[...document.querySelectorAll('section.unit')].map(s => s.id)]) : IDS.split(',');
  for (const id of ids) {
    const sel = id === 'hero' ? '.hero-stage' : (MODE === 'widget' && id.startsWith('w-') ? '#' + id : '#' + id);
    const loc = page.locator(sel).first();
    await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(id === 'hero' ? 5200 : 2600);
    const bb = await loc.boundingBox(); if (!bb) { console.log('no box for', id); continue; }
    const top = bb.y + await page.evaluate(() => scrollY);
    const VH = W < 600 ? 844 : 900, CH = VH - 70; let k = 0;
    for (let y = top - 50; y < top + bb.height - 40; y += CH) {
      await page.evaluate(v => window.scrollTo(0, v), Math.max(0, y)); await page.waitForTimeout(1300);
      await page.screenshot({ path: `${OUT}${W}-${THEME}-${id}-${k}.png` });
      k++;
    }
  }
  const ov = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  console.log('overflow', ov.s > ov.c + 1 ? 'YES ' + JSON.stringify(ov) : 'none');
  console.log(errs.length ? errs.join('\n') : 'no console errors');
  await browser.close();
})();
