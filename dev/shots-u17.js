/* Unit 17 screenshots WITH WebGL: node shots-u17.js [width=1440] [theme=dark] [ids=hero,s1,w-neuron,…|all] [waitMs]
   → shots/u17/<width>-<theme>-<id>-<k>.png (tall targets are cut into viewport chunks). Prints console errors + overflow.
   id "hero@7.5" shoots the hero 7.5 s into its loop. A widget id (w-…) shoots just that widget. */
const { chromium } = require('playwright');
const fs = require('fs');
const W = +(process.argv[2] || 1440), THEME = process.argv[3] || 'dark', IDS = process.argv[4] || 'all', WAIT = +(process.argv[5] || 2400);
const OUT = __dirname + '/shots/u17/'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const VH = W < 600 ? 844 : 900;
  const page = await browser.newPage({ viewport: { width: W, height: VH }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 240)); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e.stack || e).slice(0, 400)));
  await page.addInitScript(t => { try { localStorage.setItem('mfml-theme', t); } catch (e) {} }, THEME);
  await page.goto('file:///home/claude/mfml-site/dev/site/unit-17.html');
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} .reveal,.reveal-stagger>*{opacity:1!important;transform:none!important;transition:none!important}' });
  const ids = IDS === 'all' ? await page.evaluate(() => ['hero', ...[...document.querySelectorAll('section.unit')].map(s => s.id)]) : IDS.split(',');
  for (const id0 of ids) {
    const [id, at] = id0.split('@');
    const sel = id === 'hero' ? '.hero-stage' : '#' + id;
    const loc = page.locator(sel).first();
    if (!(await loc.count())) { console.log('missing', id); continue; }
    await loc.scrollIntoViewIfNeeded();
    if (id === 'hero' && at) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.evaluate(a => { window.U17HeroAt = a; }, +at); await page.waitForTimeout(1600);
    } else await page.waitForTimeout(id === 'hero' ? 5200 : WAIT);
    const bb = await loc.boundingBox(); if (!bb) { console.log('no box for', id); continue; }
    const top = bb.y + await page.evaluate(() => scrollY);
    const CH = VH - 70; let k = 0;
    for (let y = top - (id === 'hero' ? 0 : 40); y < top + bb.height - 40; y += CH) {
      if (!(id === 'hero' && at)) { await page.evaluate(v => window.scrollTo(0, v), Math.max(0, y)); await page.waitForTimeout(900); }
      await page.screenshot({ path: `${OUT}${W}-${THEME}-${id0.replace('@', 'at')}-${k}.png` });
      k++; if (id === 'hero') break;
    }
  }
  const ov = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  const kd = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(e => e.scrollWidth > e.clientWidth + 1 && e.offsetParent).map(e => e.textContent.slice(0, 40)));
  console.log('overflow', ov.s > ov.c + 1 ? 'YES ' + JSON.stringify(ov) : 'none', '| wide katex-display:', kd.length, kd.slice(0, 4).join(' ¦ '));
  console.log(errs.length ? errs.join('\n') : 'no console errors');
  await browser.close();
})();
