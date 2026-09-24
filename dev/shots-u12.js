/* Unit 12 · WebGL screenshots. Usage: node shots-u12.js [ids…] [--w=1440,390] [--light] [--full]
   Default: the hero and every section at 1440 and 390, into shots/u12/. */
const { chromium } = require('playwright');
const fs = require('fs');
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith('--' + k)); return a ? (a.split('=')[1] || true) : null; };
const ids = args.filter(a => !a.startsWith('--'));
const widths = (opt('w') || '1440,390').split(',').map(Number);
const light = !!opt('light');
const OUT = 'shots/u12'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const w of widths) {
    const p = await b.newPage({ viewport: { width: w, height: w < 600 ? 844 : 900 } });
    const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    p.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 300)));
    if (light) await p.addInitScript(() => { try { localStorage.setItem('mfml-theme', 'light'); } catch (e) {} });
    await p.goto('file:///home/claude/mfml-site/site/unit-12.html'); await p.waitForTimeout(2500);
    const tag = (light ? 'light-' : '') + w;
    const list = ids.length ? ids : ['hero', ...await p.evaluate(() => [...document.querySelectorAll('section.unit')].map(s => s.id))];
    for (const id of list) {
      if (id === 'hero') { await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(opt_wait(id)); await p.screenshot({ path: `${OUT}/${tag}-hero.png` }); continue; }
      if (id.startsWith('w-')) {
        await p.evaluate(id => document.getElementById(id).scrollIntoView({ block: 'start', behavior: 'instant' }), id);
        await p.waitForTimeout(2200);
        const el = await p.$('#' + id); await el.screenshot({ path: `${OUT}/${tag}-${id}.png` }); continue;
      }
      await p.evaluate(id => document.getElementById(id).scrollIntoView({ behavior: 'instant' }), id);
      await p.waitForTimeout(1800);
      if (opt('full')) { const el = await p.$('#' + id); await el.screenshot({ path: `${OUT}/${tag}-${id}.png` }); }
      else await p.screenshot({ path: `${OUT}/${tag}-${id}.png` });
    }
    if (errs.length) console.log(w, 'ERRORS:\n  ' + errs.join('\n  '));
    await p.close();
  }
  await b.close();
  function opt_wait() { return +(opt('wait') || 1500); }
})();
