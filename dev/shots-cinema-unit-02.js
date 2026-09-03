/* WebGL screenshots of the cinematic Unit 2 — every section at 1440 + 390, light theme for hero + two stages, controls smoke test, overflow probe */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/unit-02'; fs.mkdirSync(OUT, { recursive: true });
const SECS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','s13','spractice'];
const QUICK = process.argv.includes('--quick');
const STAGES_ONLY = process.argv.includes('--stages');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + e.stack)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const shot = async (pg, sel, path) => { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(2600); await pg.locator(sel).screenshot({ path }); };
  for (const [w, h, tag] of QUICK ? [[1440, 900, 'w1440']] : [[1440, 900, 'w1440'], [390, 844, 'w390']]) {
    const pg = await b.newPage({ viewport:{ width:w, height:h } }); hook(pg); pg.setDefaultTimeout(180000); pg.setDefaultNavigationTimeout(180000);
    await pg.goto('file://' + __dirname + '/site/unit-02.html'); await pg.waitForTimeout(2200);
    await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y); await pg.waitForTimeout(140); }
    await pg.evaluate(() => scrollTo({ top:0, behavior:'instant' })); await pg.waitForTimeout(400);
    if (!QUICK && !STAGES_ONLY) for (const id of SECS) {
      const r = await pg.evaluate(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; }, id);
      for (let k = 0, y = 0; y < r.h && k < 8; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top:t, behavior:'instant' }), r.top + y - 40); await pg.waitForTimeout(700); await pg.screenshot({ path:`${OUT}/${tag}-${id}-${k}.png` }); }
    }
    /* stage close-ups — remount the stages first so each is shot from its opening camera */
    const reset = async () => { await pg.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); }); await pg.waitForTimeout(300); await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(2500); };
    await reset();
    await shot(pg, '#w-group', `${OUT}/${tag}-group.png`);
    await pg.locator('#grp-presets .preset').nth(5).click(); await pg.waitForTimeout(200); await pg.locator('#grp-clockcol .preset[data-c="9"]').click(); await pg.waitForTimeout(400); await shot(pg, '#w-group', `${OUT}/${tag}-group-clock.png`);
    await shot(pg, '#w-sub', `${OUT}/${tag}-sub.png`);
    await pg.locator('#sub-presets [data-p="square"]').click(); await pg.waitForTimeout(300); await pg.locator('#w-sub .presets [data-op="2"]').click(); await pg.waitForTimeout(1100); await shot(pg, '#w-sub', `${OUT}/${tag}-sub-escape.png`);
    await pg.locator('#sub-presets [data-p="plane0"]').click(); await pg.waitForTimeout(300); await pg.locator('#w-sub .presets [data-op="add"]').click(); await pg.waitForTimeout(1100); await shot(pg, '#w-sub', `${OUT}/${tag}-sub-plane.png`);
    await pg.locator('#sub-presets [data-p="plane1"]').click(); await pg.waitForTimeout(300); await pg.locator('#w-sub .presets [data-op="0"]').click(); await pg.waitForTimeout(1100); await shot(pg, '#w-sub', `${OUT}/${tag}-sub-plane1.png`);
    await shot(pg, '#fig-ns', `${OUT}/${tag}-ns.png`);
    await shot(pg, '#w-span', `${OUT}/${tag}-span.png`);
    await pg.locator('#span-presets [data-p="cop"]').click(); await pg.waitForTimeout(1200); await pg.locator('#span-dice').click(); await pg.waitForTimeout(1200); await shot(pg, '#w-span', `${OUT}/${tag}-span-cop.png`);
    await pg.locator('#span-presets [data-p="three"]').click(); await pg.waitForTimeout(1200); await shot(pg, '#w-span', `${OUT}/${tag}-span-three.png`);
    await pg.locator('#span-presets [data-p="coll"]').click(); await pg.waitForTimeout(1200); await shot(pg, '#w-span', `${OUT}/${tag}-span-line.png`);
    await shot(pg, '#w-ind', `${OUT}/${tag}-ind.png`);
    await pg.locator('#ind-presets [data-p="p3"]').click(); await pg.locator('#ind-play').click(); await pg.waitForTimeout(1500); await shot(pg, '#w-ind', `${OUT}/${tag}-ind-play.png`);
    await shot(pg, '#w-rec', `${OUT}/${tag}-rec.png`);
    await pg.evaluate(() => { const a = document.getElementById('rec-a'), b = document.getElementById('rec-b'); a.value = 2; b.value = 1; a.dispatchEvent(new Event('input')); b.dispatchEvent(new Event('input')); }); await pg.waitForTimeout(500); await shot(pg, '#w-rec', `${OUT}/${tag}-rec-aligned.png`);
    await pg.evaluate(() => { const a = document.getElementById('rec-a'), b = document.getElementById('rec-b'); a.value = -1; b.value = 1.5; a.dispatchEvent(new Event('input')); b.dispatchEvent(new Event('input')); }); await pg.locator('#rec-third').click(); await pg.waitForTimeout(900); await shot(pg, '#w-rec', `${OUT}/${tag}-rec-third.png`);
    await shot(pg, '#w-basis', `${OUT}/${tag}-basis.png`);
    await pg.locator('#bas-presets [data-p="rot"]').click(); await pg.waitForTimeout(1000); await shot(pg, '#w-basis', `${OUT}/${tag}-basis-rot.png`);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no');
    /* light theme: hero + two stages */
    await pg.evaluate(() => { scrollTo(0, 0); document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(2600);
    await shot(pg, '#w-span', `${OUT}/${tag}-span-light.png`);
    await shot(pg, '#w-sub', `${OUT}/${tag}-sub-light.png`);
    await shot(pg, '#w-rec', `${OUT}/${tag}-rec-light.png`);
    await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(3000); await pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
    await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(800);
    await pg.close();
  }
  /* overflow at every width + every control fires */
  const pg = await b.newPage(); hook(pg); pg.setDefaultTimeout(180000); pg.setDefaultNavigationTimeout(180000);
  await pg.goto('file://' + __dirname + '/site/unit-02.html'); await pg.waitForTimeout(1200);
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await pg.setViewportSize({ width:w, height:860 }); await pg.waitForTimeout(400);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth })); console.log(w, o.s > o.c + 1 ? 'OVERFLOW ' + JSON.stringify(o) : 'ok'); }
  await pg.setViewportSize({ width:1280, height:900 });
  const n = await pg.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let n = 0;
    for (const b of document.querySelectorAll('.widget button')) { b.click(); n++; await sleep(15); }
    for (const r of document.querySelectorAll('.widget input[type=range]')) { r.value = r.max; r.dispatchEvent(new Event('input', { bubbles:true })); await sleep(10); r.value = r.min; r.dispatchEvent(new Event('input', { bubbles:true })); n++; }
    for (const c of document.querySelectorAll('.widget input[type=checkbox]')) { c.click(); await sleep(10); c.click(); n++; }
    for (const i of document.querySelectorAll('.widget input[type=number]')) { i.value = 1.5; i.dispatchEvent(new Event('input', { bubbles:true })); n++; }
    return n;
  });
  await pg.waitForTimeout(1500);
  console.log('controls fired:', n);
  for (const id of ['sub-svg', 'span-svg', 'rec-real', 'ns-3d', 'hero-3d']) {
    await pg.locator('#' + id).scrollIntoViewIfNeeded(); await pg.waitForTimeout(200);
    const bx = await pg.locator('#' + id).boundingBox(); if (!bx) continue;
    await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await pg.mouse.move(bx.x + bx.width / 2 + 90, bx.y + bx.height / 2 - 30, { steps:6 }); await pg.mouse.up();
  }
  for (let i = 0; i < 3; i++) { await pg.evaluate(() => document.getElementById('theme-btn').click()); await pg.waitForTimeout(1500); }
  await pg.emulateMedia({ reducedMotion:'reduce' }); await pg.reload(); await pg.waitForTimeout(1500);
  await pg.screenshot({ path:`${OUT}/w1280-reduced.png` });
  console.log('errors (' + errs.length + ')', errs.slice(0, 10)); await b.close();
})();
