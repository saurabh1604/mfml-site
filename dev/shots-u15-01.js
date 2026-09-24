/* Round 15 · Unit 1 WebGL screenshots: every section at 1440 + 390, light theme for hero + two stages, overflow + katex-display probes, control smoke test.
   usage: PW_CHROMIUM=/opt/pw-browsers/chromium node shots-u15-01.js [outdir] [widths=1440,390] [only=s1,s4] */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2] || __dirname + '/shots-u15/unit-01'; fs.mkdirSync(OUT, { recursive: true });
const WIDTHS = (process.argv[3] || '1440,390').split(',').map(Number);
const ONLY = process.argv[4] ? process.argv[4].split(',') : null;
const SECS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','s13','s14','spractice'].filter(s => !ONLY || ONLY.includes(s));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + e.stack)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  for (const w of WIDTHS) {
    const h = w < 700 ? 844 : 900, tag = 'w' + w;
    const pg = await b.newPage({ viewport:{ width:w, height:h } }); hook(pg);
    await pg.goto('file://' + __dirname + '/site/unit-01.html', { timeout: 120000 }); await pg.waitForTimeout(2200);
    await pg.addStyleTag({ content: '.reveal,.reveal-stagger>*{opacity:1!important;transform:none!important;transition:none!important}' });
    if (!ONLY) await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y); await pg.waitForTimeout(90); }
    for (const id of SECS) {
      const r = await pg.evaluate(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; }, id);
      const maxK = id === 'spractice' ? 2 : 9;
      for (let k = 0, y = 0; y < r.h && k < maxK; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top:t, behavior:'instant' }), r.top + y - 40); await pg.waitForTimeout(650); await pg.screenshot({ path:`${OUT}/${tag}-${id}-${k}.png` }); }
    }
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    const kd = await pg.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(e => e.scrollWidth > e.clientWidth + 1 && e.offsetParent).map(e => e.textContent.slice(0, 40)));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no', '| wide katex-display:', kd.length, kd.slice(0,4));
    if (!ONLY) {
      await pg.evaluate(() => { scrollTo(0, 0); document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(2400);
      await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
      for (const id of ['w-lines', 'w-det3', 'w-pl3', 'w-null']) { await pg.locator('#' + id).scrollIntoViewIfNeeded(); await pg.waitForTimeout(1100); await pg.locator('#' + id).screenshot({ path:`${OUT}/${tag}-${id}-light.png` }); }
      await pg.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    }
    await pg.close();
  }
  if (!ONLY) {
    const pg = await b.newPage(); hook(pg);
    await pg.goto('file://' + __dirname + '/site/unit-01.html', { timeout: 120000 }); await pg.waitForTimeout(1200);
    for (const w of [360, 390, 768, 1024, 1300, 1440, 1680]) { await pg.setViewportSize({ width:w, height:860 }); await pg.waitForTimeout(350);
      const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth, kd: [...document.querySelectorAll('.katex-display')].filter(e => e.scrollWidth > e.clientWidth + 1 && e.offsetParent).length }));
      console.log(w, o.s > o.c + 1 ? 'OVERFLOW ' + JSON.stringify(o) : 'ok', 'wide katex-display', o.kd); }
    await pg.setViewportSize({ width:1280, height:900 });
    const n = await pg.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms)); let n = 0;
      for (const b of document.querySelectorAll('.widget button')) { b.click(); n++; await sleep(20); }
      for (const r of document.querySelectorAll('.widget input[type=range]')) { r.value = r.max; r.dispatchEvent(new Event('input', { bubbles:true })); await sleep(10); r.value = r.min; r.dispatchEvent(new Event('input', { bubbles:true })); n++; }
      for (const i of document.querySelectorAll('.widget input[type=number]')) { i.value = '2'; i.dispatchEvent(new Event('input', { bubbles:true })); i.dispatchEvent(new Event('change', { bubbles:true })); n++; }
      return n; });
    await pg.waitForTimeout(4500); console.log('controls fired:', n);
    for (const id of await pg.evaluate(() => [...document.querySelectorAll('.stage3d,#hero-3d')].map(e => e.id))) {
      await pg.locator('#' + id).scrollIntoViewIfNeeded().catch(()=>{}); await pg.waitForTimeout(150);
      const bx = await pg.locator('#' + id).boundingBox(); if (!bx) continue;
      await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await pg.mouse.move(bx.x + bx.width / 2 + 90, bx.y + bx.height / 2 - 30, { steps:6 }); await pg.mouse.up();
    }
    await pg.click('#theme-btn'); await pg.waitForTimeout(900); await pg.click('#theme-btn'); await pg.waitForTimeout(900);
    await pg.emulateMedia({ reducedMotion:'reduce' }); await pg.reload(); await pg.waitForTimeout(1500);
    await pg.screenshot({ path:`${OUT}/w1280-reduced.png` });
  }
  console.log('errors (' + errs.length + ')', errs.slice(0, 10)); await b.close();
})();
