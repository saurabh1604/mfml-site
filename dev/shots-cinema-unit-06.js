/* WebGL screenshots of the cinematic Unit 6 — every section at 1440 + 390, light theme for hero + two stages, controls smoke test, overflow probe */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/unit-06'; fs.mkdirSync(OUT, { recursive: true });
const SECS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','s13','spractice'];
const QUICK = process.argv.includes('--quick');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + e.stack)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const shot = async (pg, sel, path) => { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(900); await pg.locator(sel).screenshot({ path }); };
  for (const [w, h, tag] of QUICK ? [[1440, 900, 'w1440']] : [[1440, 900, 'w1440'], [390, 844, 'w390']]) {
    const pg = await b.newPage({ viewport:{ width:w, height:h } }); hook(pg);
    await pg.goto('file://' + __dirname + '/site/unit-06.html'); await pg.waitForTimeout(2200);
    await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y); await pg.waitForTimeout(140); }
    await pg.evaluate(() => scrollTo({ top:0, behavior:'instant' })); await pg.waitForTimeout(400);
    if (!QUICK) for (const id of SECS) {
      const r = await pg.evaluate(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; }, id);
      for (let k = 0, y = 0; y < r.h && k < 8; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top:t, behavior:'instant' }), r.top + y - 40); await pg.waitForTimeout(700); await pg.screenshot({ path:`${OUT}/${tag}-${id}-${k}.png` }); }
    }
    /* stage close-ups — remount the stages first so each is shot from its opening camera, not wherever the slow auto-orbit has drifted */
    const reset = async () => { await pg.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); }); await pg.waitForTimeout(300); await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(2500); };
    await reset();
    await shot(pg, '#w-val', `${OUT}/${tag}-val.png`);
    await pg.locator('#val-play').click(); await pg.waitForTimeout(3400); await shot(pg, '#w-val', `${OUT}/${tag}-val-walked.png`);
    await pg.evaluate(() => { const r = document.getElementById('val-fog'); r.value = 0; r.dispatchEvent(new Event('input')); }); await shot(pg, '#w-val', `${OUT}/${tag}-val-nofog.png`);
    await shot(pg, '#w-ps', `${OUT}/${tag}-ps.png`);
    await pg.locator('#ps-tabs [data-t="0"]').click(); await shot(pg, '#w-ps', `${OUT}/${tag}-ps-x.png`);
    await shot(pg, '#w-dd', `${OUT}/${tag}-dd.png`);
    await shot(pg, '#w-gc', `${OUT}/${tag}-gc.png`);
    await pg.locator('#gc-tabs [data-t="2"]').click(); await pg.locator('#gc-perp').click(); await shot(pg, '#w-gc', `${OUT}/${tag}-gc-saddle.png`);
    await shot(pg, '#w-gd', `${OUT}/${tag}-gd.png`);
    await pg.locator('#gd-presets [data-eta="0.95"]').click(); await pg.waitForTimeout(4200); await shot(pg, '#w-gd', `${OUT}/${tag}-gd-zigzag.png`);
    await pg.locator('#gd-presets [data-eta="1.05"]').click(); await pg.waitForTimeout(4200); await shot(pg, '#w-gd', `${OUT}/${tag}-gd-blow.png`);
    await shot(pg, '#w-zoom', `${OUT}/${tag}-zoom.png`);
    await shot(pg, '#w-sec', `${OUT}/${tag}-sec.png`);
    await shot(pg, '#w-ch', `${OUT}/${tag}-ch.png`);
    await shot(pg, '#w-tay', `${OUT}/${tag}-tay.png`);
    await shot(pg, '#w-sh', `${OUT}/${tag}-sh.png`);
    await shot(pg, '#w-jm', `${OUT}/${tag}-jm.png`);
    for (let i = 0; i < 4; i++) await pg.locator('#bp-step').click(); await shot(pg, '#w-bp', `${OUT}/${tag}-bp.png`);
    await shot(pg, '#w-kink', `${OUT}/${tag}-kink.png`);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no');
    /* light theme: hero + two stages */
    await pg.evaluate(() => { scrollTo(0, 0); document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(2600);
    await shot(pg, '#w-ps', `${OUT}/${tag}-ps-light.png`);
    await shot(pg, '#w-gd', `${OUT}/${tag}-gd-light.png`);
    await shot(pg, '#w-val', `${OUT}/${tag}-val-light.png`);
    /* the hero last: under SwiftShader the six context recreations stall painting for seconds */
    await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(3000); await pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
    await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(800);
    await pg.close();
  }
  /* overflow at every width + every control fires */
  const pg = await b.newPage(); hook(pg);
  await pg.goto('file://' + __dirname + '/site/unit-06.html'); await pg.waitForTimeout(1200);
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
  /* orbit-drag every stage, and drag on the surfaces */
  for (const id of ['val-svg', 'ps-svg', 'dd-svg', 'gc-svg', 'gd-svg', 'hero-3d']) {
    await pg.locator('#' + id).scrollIntoViewIfNeeded(); await pg.waitForTimeout(200);
    const bx = await pg.locator('#' + id).boundingBox(); if (!bx) continue;
    await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await pg.mouse.move(bx.x + bx.width / 2 + 90, bx.y + bx.height / 2 - 30, { steps:6 }); await pg.mouse.up();
    await pg.mouse.move(bx.x + 20, bx.y + 20); await pg.mouse.down(); await pg.mouse.move(bx.x + 120, bx.y + 50, { steps:6 }); await pg.mouse.up();
  }
  for (let i = 0; i < 3; i++) { await pg.evaluate(() => document.getElementById('theme-btn').click()); await pg.waitForTimeout(1500); }  /* evaluate: SwiftShader context recreation makes page.click's stability wait time out */
  await pg.emulateMedia({ reducedMotion:'reduce' }); await pg.reload(); await pg.waitForTimeout(1500);
  await pg.screenshot({ path:`${OUT}/w1280-reduced.png` });
  console.log('errors (' + errs.length + ')', errs.slice(0, 10)); await b.close();
})();
