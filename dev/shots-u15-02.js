/* Round 15 · Unit 2 — WebGL screenshots of every section (1440 + 390), stage close-ups mid-story, light theme, overflow + controls smoke test.
   node shots-u15-02.js [--only=a,b] [--sections] [--light] [--smoke] [--w=1440]   (no flags = everything) */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-u15/unit-02'; fs.mkdirSync(OUT, { recursive: true });
const ARG = k => { const a = process.argv.find(x => x.startsWith('--' + k)); return a ? (a.split('=')[1] || true) : null; };
const ALL = !ARG('only') && !ARG('sections') && !ARG('light') && !ARG('smoke');
const ONLY = ARG('only') ? String(ARG('only')).split(',') : null;
const WIDTHS = ARG('w') ? [+ARG('w')] : [1440, 390];
const SECS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','s13','spractice'];
const URL = 'file://' + __dirname + '/site/unit-02.html';
const click = (pg, sel) => pg.evaluate(s => document.querySelector(s).click(), sel);
const setRange = (pg, sel, v) => pg.evaluate(([s, v]) => { const r = document.querySelector(s); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, v]);
/* stage close-ups: [name, widget selector, actions, extra wait ms] */
const SCENES = [
  ['routes', '#w-routes', async pg => {}, 0],
  ['routes-race', '#w-routes', async pg => { await click(pg, '#routes-play'); await pg.waitForTimeout(1700); }, 0],
  ['routes-neg', '#w-routes', async pg => { await click(pg, '#routes-presets [data-l="-1"]'); await pg.waitForTimeout(900); }, 0],
  ['group-clock', '#w-group', async pg => { await click(pg, '#grp-presets .preset:nth-child(6)'); await click(pg, '#grp-clockcol .preset[data-c="9"]'); await pg.waitForTimeout(500); }, 0],
  ['sub', '#w-sub', async pg => {}, 0],
  ['sub-escape', '#w-sub', async pg => { await click(pg, '#sub-presets [data-p="square"]'); await pg.waitForTimeout(300); await click(pg, '#w-sub [data-op="2"]'); await pg.waitForTimeout(1000); }, 0],
  ['sub-curve', '#w-sub', async pg => { await click(pg, '#sub-presets [data-p="curve"]'); await pg.waitForTimeout(300); await click(pg, '#sub-play'); await pg.waitForTimeout(6200); }, 0],
  ['sub-plane', '#w-sub', async pg => { await click(pg, '#sub-presets [data-p="plane0"]'); await pg.waitForTimeout(300); await click(pg, '#w-sub [data-op="add"]'); await pg.waitForTimeout(1200); }, 0],
  ['pass', '#w-pass', async pg => {}, 0],
  ['pass-sum', '#w-pass', async pg => { await click(pg, '#w-pass [data-o="sum"]'); await pg.waitForTimeout(900); }, 0],
  ['pass-40', '#w-pass', async pg => { await click(pg, '#pass-mode [data-m="4"]'); await pg.waitForTimeout(400); await click(pg, '#w-pass [data-o="sum"]'); await pg.waitForTimeout(1200); }, 0],
  ['ns', '#fig-ns', async pg => {}, 0],
  ['span', '#w-span', async pg => {}, 0],
  ['span-sweep2', '#w-span', async pg => { await click(pg, '#span-sweep'); await pg.waitForTimeout(4400); }, 0],
  ['span-cop', '#w-span', async pg => { await click(pg, '#span-presets [data-p="cop"]'); await pg.waitForTimeout(1000); await click(pg, '#span-sweep'); await pg.waitForTimeout(5400); }, 0],
  ['span-three', '#w-span', async pg => { await click(pg, '#span-presets [data-p="three"]'); await pg.waitForTimeout(1000); await click(pg, '#span-sweep'); await pg.waitForTimeout(5400); }, 0],
  ['trip', '#w-trip', async pg => {}, 0],
  ['trip-home', '#w-trip', async pg => { await click(pg, '#trip-play'); await pg.waitForTimeout(2200); }, 0],
  ['trip-ind', '#w-trip', async pg => { await click(pg, '#trip-presets [data-p="ind"]'); await pg.waitForTimeout(300); await click(pg, '#trip-play'); await pg.waitForTimeout(5200); }, 0],
  ['ind', '#w-ind', async pg => { await click(pg, '#ind-presets [data-p="p3"]'); await pg.waitForTimeout(200); await click(pg, '#ind-play'); await pg.waitForTimeout(2600); }, 0],
  ['rec', '#w-rec', async pg => {}, 0],
  ['rec-line', '#w-rec', async pg => { await click(pg, '#rec-play'); await pg.waitForTimeout(2300); }, 0],
  ['rec-third', '#w-rec', async pg => { await setRange(pg, '#rec-a', -1); await setRange(pg, '#rec-b', 1.5); await click(pg, '#rec-third'); await pg.waitForTimeout(900); }, 0],
  ['basis', '#w-basis', async pg => {}, 0],
  ['basis-walk', '#w-basis', async pg => { await click(pg, '#bas-presets [data-p="skew"]'); await pg.waitForTimeout(1000); await click(pg, '#bas-walk'); await pg.waitForTimeout(1700); }, 0],
  ['basis-dep', '#w-basis', async pg => { await click(pg, '#bas-presets [data-p="dep"]'); await pg.waitForTimeout(1100); }, 0],
  ['dim', '#w-dim', async pg => { await click(pg, '#dim-play'); await pg.waitForTimeout(5600); }, 0],
  ['dim-room', '#w-dim', async pg => { await click(pg, '#dim-space [data-s="3"]'); await pg.waitForTimeout(300); await click(pg, '#dim-play'); await pg.waitForTimeout(5600); }, 0],
  ['sieve', '#w-sieve', async pg => { await click(pg, '#sieve-play'); await pg.waitForTimeout(4600); }, 0],
  ['sieve-room', '#w-sieve', async pg => { await click(pg, '#sieve-presets [data-p="room"]'); await pg.waitForTimeout(300); await click(pg, '#sieve-play'); await pg.waitForTimeout(7800); }, 0],
];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + (e.stack || e).toString().slice(0, 300))); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); }); };
  const open = async (w, h) => { const pg = await b.newPage({ viewport: { width: w, height: h } }); hook(pg); pg.setDefaultTimeout(240000); await pg.goto(URL); await pg.waitForTimeout(1800); return pg; };
  for (const w of WIDTHS) {
    const h = w < 700 ? 844 : 900, tag = 'w' + w;
    if (ALL || ARG('sections')) {
      const pg = await open(w, h);
      await pg.screenshot({ path: `${OUT}/${tag}-hero.png` });
      for (const id of SECS) {
        const r = await pg.evaluate(id => { const e = document.getElementById(id); const bb = e.getBoundingClientRect(); return { top: bb.top + scrollY, h: bb.height }; }, id);
        for (let k = 0, y = 0; y < r.h && k < 9; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top: t, behavior: 'instant' }), r.top + y - 40); await pg.waitForTimeout(2600); await pg.screenshot({ path: `${OUT}/${tag}-${id}-${k}.png` }); }
      }
      await pg.close();
    }
    if (ALL || ONLY) {
      for (const [name, sel, act, extra] of SCENES) {
        if (ONLY && !ONLY.includes(name) && !ONLY.includes(name.split('-')[0])) continue;
        const pg = await open(w, h);
        await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(3200);
        await act(pg); await pg.waitForTimeout(extra || 0);
        await pg.locator(sel).screenshot({ path: `${OUT}/${tag}-${name}.png` });
        await pg.close();
      }
    }
    if (ALL || ARG('light')) {
      const pg = await open(w, h);
      await pg.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await pg.waitForTimeout(2500);
      await pg.screenshot({ path: `${OUT}/${tag}-hero-light.png` });
      for (const sel of ['#w-span', '#w-pass', '#w-basis', '#w-sieve']) { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(3200); await pg.locator(sel).screenshot({ path: `${OUT}/${tag}-light-${sel.slice(3)}.png` }); }
      await pg.close();
    }
  }
  if (ALL || ARG('smoke')) {
    const pg = await open(1280, 900);
    for (const w of [360, 390, 768, 1024, 1440, 1680]) { await pg.setViewportSize({ width: w, height: 860 }); await pg.waitForTimeout(400);
      const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
      const kd = await pg.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 1).length);
      console.log(w, o.s > o.c + 1 ? 'OVERFLOW ' + JSON.stringify(o) : 'ok', '· wide katex-display:', kd); }
    await pg.setViewportSize({ width: 1300, height: 900 });
    console.log('wide katex-display @1300:', await pg.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 1).length));
    /* bring every stage to life, then fire every control */
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 600) { await pg.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await pg.waitForTimeout(250); }
    await pg.waitForTimeout(3000);
    const n = await pg.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms)); let n = 0;
      for (const b of document.querySelectorAll('.widget button')) { b.click(); n++; await sleep(40); }
      for (const r of document.querySelectorAll('.widget input[type=range]')) { r.value = r.max; r.dispatchEvent(new Event('input', { bubbles: true })); await sleep(15); r.value = r.min; r.dispatchEvent(new Event('input', { bubbles: true })); n++; }
      for (const c of document.querySelectorAll('.widget input[type=checkbox]')) { c.click(); await sleep(15); c.click(); n++; }
      for (const i of document.querySelectorAll('.widget input[type=number]')) { i.value = 1.5; i.dispatchEvent(new Event('input', { bubbles: true })); n++; }
      for (const b of document.querySelectorAll('.widget button')) { b.click(); n++; await sleep(20); }
      return n; });
    await pg.waitForTimeout(8000);
    console.log('controls fired:', n);
    for (const id of ['routes-3d', 'sub-svg', 'pass-3d', 'span-svg', 'trip-3d', 'rec-real', 'bas-svg', 'dim-3d', 'sieve-3d', 'ns-3d', 'hero-3d']) {
      await pg.locator('#' + id).scrollIntoViewIfNeeded(); await pg.waitForTimeout(400);
      const bx = await pg.locator('#' + id).boundingBox(); if (!bx) continue;
      await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await pg.mouse.move(bx.x + bx.width / 2 + 90, bx.y + bx.height / 2 - 30, { steps: 6 }); await pg.mouse.up();
    }
    for (let i = 0; i < 2; i++) { await pg.evaluate(() => document.getElementById('theme-btn').click()); await pg.waitForTimeout(2500); }
    const live = await pg.evaluate(() => document.querySelectorAll('canvas').length);
    console.log('canvases alive:', live);
    await pg.emulateMedia({ reducedMotion: 'reduce' }); await pg.reload(); await pg.waitForTimeout(1500);
    await pg.evaluate(async () => { for (const b of document.querySelectorAll('.widget .play')) { b.click(); await new Promise(r => setTimeout(r, 60)); } });
    await pg.waitForTimeout(1500);
    await pg.close();
  }
  console.log('errors (' + errs.length + ')', errs.slice(0, 12));
  await b.close();
})();
