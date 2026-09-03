/* WebGL screenshots of the cinematic Unit 1 — every section at 1440 + 390, light theme for hero + two stages, controls smoke test, overflow probe */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/unit-01'; fs.mkdirSync(OUT, { recursive: true });
const SECS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','s13','s14','spractice'];
/* note: 390 shots use fewer frames per section; close-ups are element shots (never taller than ~1300px) */
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + e.stack)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const shot = async (pg, sel, path) => { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(900); await pg.locator(sel).screenshot({ path }); };
  for (const [w, h, tag] of [[1440, 900, 'w1440'], [390, 844, 'w390']]) {
    const pg = await b.newPage({ viewport:{ width:w, height:h } }); hook(pg);
    await pg.goto('file://' + __dirname + '/site/unit-01.html'); await pg.waitForTimeout(2200);
    await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    /* scroll through once so every reveal fires */
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y); await pg.waitForTimeout(140); }
    await pg.evaluate(() => scrollTo({ top:0, behavior:'instant' })); await pg.waitForTimeout(400);
    /* open the hidden panes so their stages get built and shot */
    for (const id of SECS) {
      if (id === 's6') { await pg.locator('#win-tabs [data-t="cols"]').click(); await pg.waitForTimeout(300); }
      if (id === 's13') { await pg.locator('#pl3-tabs [data-t="inf"]').click(); }
      /* viewport-sized frames down the section (beyond-viewport captures wreck SwiftShader canvases) */
      const r = await pg.evaluate(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; }, id);
      for (let k = 0, y = 0; y < r.h && k < 8; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top:t, behavior:'instant' }), r.top + y - 40); await pg.waitForTimeout(700); await pg.screenshot({ path:`${OUT}/${tag}-${id}-${k}.png` }); }
    }
    /* stage close-ups */
    await pg.locator('#det3-presets [data-p="shear"]').click(); await shot(pg, '#w-det3', `${OUT}/${tag}-det3-shear.png`);
    await pg.locator('#det3-presets [data-p="flat"]').click(); await shot(pg, '#w-det3', `${OUT}/${tag}-det3-flat.png`);
    await pg.locator('#pl3-tabs [data-t="unique"]').click(); await shot(pg, '#w-pl3', `${OUT}/${tag}-pl3-unique.png`);
    await pg.locator('#pl3-tabs [data-t="none"]').click(); await shot(pg, '#w-pl3', `${OUT}/${tag}-pl3-none.png`);
    await pg.locator('#cols-lift').click(); await shot(pg, '#w-windows', `${OUT}/${tag}-cols-lifted.png`);
    await pg.locator('#cols-lift').click();
    await pg.locator('#win-tabs [data-t="machine"]').click(); await pg.locator('#mach-t').fill('1'); await shot(pg, '#w-windows', `${OUT}/${tag}-win-machine.png`);
    await pg.locator('#mach-presets [data-p="squash"]').click(); await shot(pg, '#w-machine', `${OUT}/${tag}-machine-squash.png`);
    await pg.locator('#elim-tabs [data-t="full"]').click(); for (let i = 0; i < 4; i++) await pg.locator('#elim-next').click(); await shot(pg, '#w-elim', `${OUT}/${tag}-elim-end.png`);
    await pg.locator('#null-l').fill('-1.6'); await shot(pg, '#w-null', `${OUT}/${tag}-null-left.png`);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no');
    /* light theme: hero + two stages */
    await pg.evaluate(() => { scrollTo(0, 0); document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(2600);
    await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
    await pg.locator('#det3-presets [data-p="rot"]').click(); await shot(pg, '#w-det3', `${OUT}/${tag}-det3-light.png`);
    await pg.locator('#pl3-tabs [data-t="inf"]').click(); await shot(pg, '#w-pl3', `${OUT}/${tag}-pl3-light.png`);
    await shot(pg, '#w-lines', `${OUT}/${tag}-lines-light.png`);
    await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(800);
    await pg.close();
  }
  /* overflow at every width + every control fires */
  const pg = await b.newPage(); hook(pg);
  await pg.goto('file://' + __dirname + '/site/unit-01.html'); await pg.waitForTimeout(1200);
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await pg.setViewportSize({ width:w, height:860 }); await pg.waitForTimeout(400);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth })); console.log(w, o.s > o.c + 1 ? 'OVERFLOW ' + JSON.stringify(o) : 'ok'); }
  await pg.setViewportSize({ width:1280, height:900 });
  const n = await pg.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let n = 0;
    for (const b of document.querySelectorAll('.widget button')) { b.click(); n++; await sleep(15); }
    for (const r of document.querySelectorAll('.widget input[type=range]')) { r.value = r.max; r.dispatchEvent(new Event('input', { bubbles:true })); await sleep(10); r.value = r.min; r.dispatchEvent(new Event('input', { bubbles:true })); n++; }
    for (const i of document.querySelectorAll('.widget input[type=number]')) { i.value = '2'; i.dispatchEvent(new Event('input', { bubbles:true })); i.dispatchEvent(new Event('change', { bubbles:true })); n++; }
    return n;
  });
  await pg.waitForTimeout(1500);
  console.log('controls fired:', n);
  /* orbit-drag every stage */
  for (const id of ['det3-svg', 'pl3-svg', 'null-3d', 'hero-3d']) {
    await pg.locator('#' + id).scrollIntoViewIfNeeded(); await pg.waitForTimeout(200);
    const bx = await pg.locator('#' + id).boundingBox(); if (!bx) continue;
    await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await pg.mouse.move(bx.x + bx.width / 2 + 90, bx.y + bx.height / 2 - 30, { steps:6 }); await pg.mouse.up();
  }
  await pg.click('#theme-btn'); await pg.waitForTimeout(900); await pg.click('#theme-btn'); await pg.waitForTimeout(900); await pg.click('#theme-btn'); await pg.waitForTimeout(900);
  await pg.emulateMedia({ reducedMotion:'reduce' }); await pg.reload(); await pg.waitForTimeout(1500);
  await pg.screenshot({ path:`${OUT}/w1280-reduced.png` });
  console.log('errors (' + errs.length + ')', errs.slice(0, 10)); await b.close();
})();
