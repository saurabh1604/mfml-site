/* WebGL screenshots of the cinematic Unit 5 — every section at 1440 + 390, light theme for hero + two stages, controls smoke test, overflow probe */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/unit-05'; fs.mkdirSync(OUT, { recursive: true });
const SECS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','spractice'];
const QUICK = process.argv.includes('--quick');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + e.stack)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const shot = async (pg, sel, path) => { await pg.evaluate(sel => document.querySelector(sel).scrollIntoView({ block:'center', behavior:'instant' }), sel); await pg.waitForTimeout(1300); const bx = await pg.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x:r.left, y:r.top, width:r.width, height:r.height }; }, sel); await pg.screenshot({ path, clip:bx }); };
  for (const [w, h, tag] of QUICK ? [[1440, 900, 'w1440']] : [[1440, 900, 'w1440'], [390, 844, 'w390']]) {
    const pg = await b.newPage({ viewport:{ width:w, height:h } }); pg.setDefaultTimeout(120000); hook(pg);
    await pg.goto('file://' + __dirname + '/site/unit-05.html'); await pg.waitForTimeout(2600);
    await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y); await pg.waitForTimeout(140); }
    await pg.evaluate(() => scrollTo({ top:0, behavior:'instant' })); await pg.waitForTimeout(400);
    if (!QUICK) for (const id of SECS) {
      const r = await pg.evaluate(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; }, id);
      for (let k = 0, y = 0; y < r.h && k < 8; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top:t, behavior:'instant' }), r.top + y - 40); await pg.waitForTimeout(700); await pg.screenshot({ path:`${OUT}/${tag}-${id}-${k}.png` }); }
    }
    /* stage close-ups — remount the stages first so each is shot from its opening camera */
    const reset = async () => { await pg.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); }); await pg.waitForTimeout(300); await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(2500); };
    await reset();
    await shot(pg, '#w-svd', `${OUT}/${tag}-svd-0.png`);
    await pg.locator('#sv-stages [data-s="2"]').click(); await pg.waitForTimeout(1400); await shot(pg, '#w-svd', `${OUT}/${tag}-svd-2.png`);
    await pg.locator('#sv-stages [data-s="3"]').click(); await pg.waitForTimeout(1400); await shot(pg, '#w-svd', `${OUT}/${tag}-svd-3.png`);
    await pg.locator('#sv-tabs [data-t="shear"]').click(); await pg.waitForTimeout(600); await shot(pg, '#w-svd', `${OUT}/${tag}-svd-shear.png`);
    await shot(pg, '#w-tall', `${OUT}/${tag}-tall.png`);
    await pg.locator('#tl-view-plane').click(); await pg.waitForTimeout(1200); await shot(pg, '#w-tall', `${OUT}/${tag}-tall-edge.png`);
    await shot(pg, '#w-rank', `${OUT}/${tag}-rank-3.png`);
    await pg.evaluate(() => { const r = document.getElementById('rk-k'); r.value = 12; r.dispatchEvent(new Event('input')); }); await pg.waitForTimeout(1200); await shot(pg, '#w-rank', `${OUT}/${tag}-rank-12.png`);
    await pg.locator('#rk-tabs [data-t="sigma"]').click(); await pg.waitForTimeout(1200); await shot(pg, '#w-rank', `${OUT}/${tag}-rank-sigma.png`);
    await shot(pg, '#w-amp', `${OUT}/${tag}-amp.png`);
    await pg.locator('#am-tabs [data-t="near"]').click(); await pg.waitForTimeout(1300); await shot(pg, '#w-amp', `${OUT}/${tag}-amp-near.png`);
    await shot(pg, '#w-moves', `${OUT}/${tag}-moves.png`);
    await pg.locator('#mv-stages [data-s="3"]').click(); await pg.waitForTimeout(2000); await shot(pg, '#w-moves', `${OUT}/${tag}-moves-end.png`);
    await shot(pg, '#w-dials', `${OUT}/${tag}-dials.png`);
    await shot(pg, '#w-proj', `${OUT}/${tag}-proj.png`);
    await shot(pg, '#w-diag', `${OUT}/${tag}-diag.png`);
    await pg.locator('#dg-stages [data-s="3"]').click(); await pg.waitForTimeout(1800); await shot(pg, '#w-diag', `${OUT}/${tag}-diag-end.png`);
    await shot(pg, '#w-hunt', `${OUT}/${tag}-hunt.png`);
    await shot(pg, '#w-taste', `${OUT}/${tag}-taste.png`);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no');
    /* light theme: hero + two stages */
    await pg.evaluate(() => { scrollTo(0, 0); document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(2600);
    await shot(pg, '#w-svd', `${OUT}/${tag}-svd-light.png`);
    await shot(pg, '#w-rank', `${OUT}/${tag}-rank-light.png`);
    await shot(pg, '#w-amp', `${OUT}/${tag}-amp-light.png`);
    await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(3000); await pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
    await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(800);
    await pg.close();
  }
  /* overflow at every width + every control fires */
  const pg = await b.newPage(); pg.setDefaultTimeout(120000); hook(pg);
  await pg.goto('file://' + __dirname + '/site/unit-05.html'); await pg.waitForTimeout(1200);
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await pg.setViewportSize({ width:w, height:860 }); await pg.waitForTimeout(400);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth })); console.log(w, o.s > o.c + 1 ? 'OVERFLOW ' + JSON.stringify(o) : 'ok'); }
  await pg.setViewportSize({ width:1280, height:900 });
  const n = await pg.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let n = 0;
    for (const b of document.querySelectorAll('.widget button')) { b.click(); n++; await sleep(15); }
    for (const r of document.querySelectorAll('.widget input[type=range]')) { r.value = r.max; r.dispatchEvent(new Event('input', { bubbles:true })); await sleep(10); r.value = r.min; r.dispatchEvent(new Event('input', { bubbles:true })); n++; }
    return n;
  });
  await pg.waitForTimeout(1500);
  console.log('controls fired:', n);
  /* orbit-drag every stage, and the x-grab on the amplifier */
  for (const id of ['sv-svg', 'tl-out', 'rk-3d', 'am-svg', 'hero-3d']) {
    await pg.evaluate(id => document.getElementById(id).scrollIntoView({ block:'center', behavior:'instant' }), id); await pg.waitForTimeout(400);
    const bx = await pg.locator('#' + id).boundingBox(); if (!bx) continue;
    await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await pg.mouse.move(bx.x + bx.width / 2 + 90, bx.y + bx.height / 2 - 30, { steps:6 }); await pg.mouse.up();
    await pg.mouse.move(bx.x + 20, bx.y + 20); await pg.mouse.down(); await pg.mouse.move(bx.x + 120, bx.y + 50, { steps:6 }); await pg.mouse.up();
  }
  for (let i = 0; i < 3; i++) { await pg.evaluate(() => document.getElementById('theme-btn').click()); await pg.waitForTimeout(1500); }
  await pg.emulateMedia({ reducedMotion:'reduce' }); await pg.reload(); await pg.waitForTimeout(1500);
  await pg.screenshot({ path:`${OUT}/w1280-reduced.png` });
  console.log('errors (' + errs.length + ')', errs.slice(0, 10)); await b.close();
})();
