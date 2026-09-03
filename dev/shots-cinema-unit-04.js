/* WebGL screenshots of the cinematic Unit 4 — every section at 1440 + 390, light theme for hero + two stages, controls smoke test, overflow probe */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/unit-04'; fs.mkdirSync(OUT, { recursive: true });
const SECS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','spractice'];
const ONLY = process.argv[2];   /* optional: 'closeups' to skip the section sweep */
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + e.stack)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const shot = async (pg, sel, path) => { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(1400); await pg.locator(sel).screenshot({ path }); };
  for (const [w, h, tag] of [[1440, 900, 'w1440'], [390, 844, 'w390']].filter(v => !process.env.VP || String(v[0]) === process.env.VP)) {
    const pg = await b.newPage({ viewport:{ width:w, height:h } }); hook(pg);
    await pg.goto('file://' + __dirname + '/site/unit-04.html'); await pg.waitForTimeout(2200);
    await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y); await pg.waitForTimeout(140); }
    await pg.evaluate(() => scrollTo({ top:0, behavior:'instant' })); await pg.waitForTimeout(400);
    /* under SwiftShader load the reveal observers lag; settle every reveal before shooting (a reader who scrolled sees the same) */
    await pg.evaluate(() => document.querySelectorAll('.reveal,.reveal-stagger').forEach(e => e.classList.add('in'))); await pg.waitForTimeout(1200);
    if (ONLY !== 'closeups') for (const id of SECS) {
      const r = await pg.evaluate(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; }, id);
      for (let k = 0, y = 0; y < r.h && k < 8; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top:t, behavior:'instant' }), r.top + y - 40); await pg.waitForTimeout(700); await pg.screenshot({ path:`${OUT}/${tag}-${id}-${k}.png` }); }
    }
    /* stage close-ups */
    await pg.locator('#rowop-presets [data-p="swap"]').click(); await shot(pg, '#fig-rowop', `${OUT}/${tag}-rowop-swap.png`);
    await pg.locator('#rowop-presets [data-p="shear"]').click(); await shot(pg, '#fig-rowop', `${OUT}/${tag}-rowop-shear.png`);
    await pg.evaluate(() => document.getElementById('eig-svg').u4probe([1, 1])); await shot(pg, '#w-eig', `${OUT}/${tag}-eig-hot.png`);
    await pg.locator('#eig-reveal').click(); await pg.locator('#eig-tabs [data-t="data"]').click(); await shot(pg, '#w-eig', `${OUT}/${tag}-eig-data-reveal.png`);
    await pg.locator('#eig-tabs [data-t="rot"]').click(); await shot(pg, '#w-eig', `${OUT}/${tag}-eig-rot.png`);
    await pg.locator('#eig-reveal').click(); await pg.locator('#eig-tabs [data-t="sym"]').click();
    await pg.locator('#spec-stages [data-s="2"]').click(); await shot(pg, '#w-spec', `${OUT}/${tag}-spec-stretch.png`);
    await pg.evaluate(() => { const s = document.getElementById('e3-l3'); s.value = '0'; s.dispatchEvent(new Event('input')); }); await shot(pg, '#w-e3', `${OUT}/${tag}-e3-flat.png`);
    await pg.evaluate(() => { const s = document.getElementById('e3-l3'); s.value = '-1.5'; s.dispatchEvent(new Event('input')); }); await shot(pg, '#w-e3', `${OUT}/${tag}-e3-neg.png`);
    await pg.evaluate(() => { const s = document.getElementById('e3-l3'); s.value = '0.6'; s.dispatchEvent(new Event('input')); });
    await pg.locator('#chl-mode [data-m="z"]').click(); await shot(pg, '#w-chol', `${OUT}/${tag}-chol-z.png`);
    await pg.locator('#chl-mode [data-m="x"]').click(); await pg.locator('#chl-presets [data-p="tight"]').click(); await shot(pg, '#w-chol', `${OUT}/${tag}-chol-tight.png`);
    await pg.locator('#chl-presets [data-p="broken"]').click(); await shot(pg, '#w-chol', `${OUT}/${tag}-chol-broken.png`);
    await pg.locator('#chl-presets [data-p="lec"]').click();
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no');
    /* light theme: hero + two stages */
    await pg.evaluate(() => { scrollTo(0, 0); document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(2600);
    await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
    await shot(pg, '#w-e3', `${OUT}/${tag}-e3-light.png`);
    await pg.evaluate(() => document.getElementById('eig-svg').u4probe([1, 1])); await shot(pg, '#w-eig', `${OUT}/${tag}-eig-light.png`);
    await shot(pg, '#w-chol', `${OUT}/${tag}-chol-light.png`);
    await shot(pg, '#w-det', `${OUT}/${tag}-det-light.png`);
    await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(800);
    await pg.close();
  }
  /* overflow at every width + every control fires */
  if (process.env.VP) { console.log('errors (' + errs.length + ')', errs.slice(0, 10)); await b.close(); return; }
  const pg = await b.newPage(); hook(pg);
  await pg.goto('file://' + __dirname + '/site/unit-04.html'); await pg.waitForTimeout(1200);
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await pg.setViewportSize({ width:w, height:860 }); await pg.waitForTimeout(400);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth })); console.log(w, o.s > o.c + 1 ? 'OVERFLOW ' + JSON.stringify(o) : 'ok'); }
  await pg.setViewportSize({ width:1280, height:900 });
  const n = await pg.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let n = 0;
    for (const b of document.querySelectorAll('.widget button, .fig-stage button, .term-card')) { b.click(); n++; await sleep(15); }
    for (const r of document.querySelectorAll('.widget input[type=range]')) { r.value = r.max; r.dispatchEvent(new Event('input', { bubbles:true })); await sleep(10); r.value = r.min; r.dispatchEvent(new Event('input', { bubbles:true })); n++; }
    for (const i of document.querySelectorAll('.widget input[type=number]')) { i.value = '2'; i.dispatchEvent(new Event('input', { bubbles:true })); i.dispatchEvent(new Event('change', { bubbles:true })); n++; }
    return n;
  });
  await pg.waitForTimeout(1500);
  console.log('controls fired:', n);
  for (const id of ['rowop-3d', 'eig-svg', 'e3-svg', 'chol-svg', 'hero-3d']) {
    await pg.locator('#' + id).scrollIntoViewIfNeeded(); await pg.waitForTimeout(200);
    const bx = await pg.locator('#' + id).boundingBox(); if (!bx) continue;
    await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await pg.mouse.move(bx.x + bx.width / 2 + 90, bx.y + bx.height / 2 - 30, { steps:6 }); await pg.mouse.up();
  }
  await pg.click('#theme-btn'); await pg.waitForTimeout(900); await pg.click('#theme-btn'); await pg.waitForTimeout(900); await pg.click('#theme-btn'); await pg.waitForTimeout(900);
  await pg.emulateMedia({ reducedMotion:'reduce' }); await pg.reload(); await pg.waitForTimeout(1500);
  await pg.screenshot({ path:`${OUT}/w1280-reduced.png` });
  console.log('errors (' + errs.length + ')', errs.slice(0, 10)); await b.close();
})();
