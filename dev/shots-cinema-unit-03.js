/* WebGL screenshots of the cinematic Unit 3 — every section at 1440 + 390, light theme for hero + stages, controls smoke test, overflow probe */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/unit-03'; fs.mkdirSync(OUT, { recursive: true });
const SECS = ['s1','s2','s2d','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','spractice'];
const QUICK = process.argv.includes('--quick');
const VIEWS = process.argv.includes('--only390') ? [[390, 844, 'w390']] : process.argv.includes('--only1440') ? [[1440, 900, 'w1440']] : [[1440, 900, 'w1440'], [390, 844, 'w390']];
const SKIPTAIL = process.argv.includes('--notail');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + e.stack)); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type().toUpperCase() + ' ' + m.text()); }); };
  const shot = async (pg, sel, path) => { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(1000); await pg.locator(sel).screenshot({ path }); };
  for (const [w, h, tag] of VIEWS) { try {
    const pg = await b.newPage({ viewport:{ width:w, height:h } }); hook(pg);
    await pg.goto('file://' + __dirname + '/site/unit-03.html', { waitUntil:'domcontentloaded', timeout:180000 }); await pg.waitForTimeout(2600);
    await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y); await pg.waitForTimeout(140); }
    await pg.evaluate(() => scrollTo({ top:0, behavior:'instant' })); await pg.waitForTimeout(400);
    if (!QUICK) for (const id of SECS) {
      const r = await pg.evaluate(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; }, id);
      for (let k = 0, y = 0; y < r.h && k < 8; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top:t, behavior:'instant' }), r.top + y - 40); await pg.waitForTimeout(700); await pg.screenshot({ path:`${OUT}/${tag}-${id}-${k}.png` }); }
    }
    /* stage close-ups */
    await shot(pg, '#w-norm', `${OUT}/${tag}-norm.png`);
    await pg.locator('#norm-zoom').click(); await pg.waitForTimeout(900); await shot(pg, '#w-norm', `${OUT}/${tag}-norm-zoom.png`); await pg.locator('#norm-zoom').click();
    await pg.locator('#eng-presets [data-p="tilt"]').click(); await pg.waitForTimeout(900); await shot(pg, '#w-eng', `${OUT}/${tag}-eng-tilt.png`);
    await pg.locator('#eng-presets [data-p="broken"]').click(); await pg.waitForTimeout(900); await shot(pg, '#w-eng', `${OUT}/${tag}-eng-broken.png`);
    await pg.locator('#eng-presets [data-p="c21"]').click();
    await shot(pg, '#w-dot', `${OUT}/${tag}-dot.png`);
    await shot(pg, '#w-ang', `${OUT}/${tag}-ang.png`);
    await shot(pg, '#w-hd', `${OUT}/${tag}-hd.png`);
    await pg.locator('#rig-tabs [data-t="shear"]').click(); await shot(pg, '#w-rig', `${OUT}/${tag}-rig-shear.png`);
    await pg.locator('#rig-tabs [data-t="rot"]').click();
    await shot(pg, '#w-sh', `${OUT}/${tag}-sh.png`);
    await pg.locator('#sh-ta').fill('150'); await shot(pg, '#w-sh', `${OUT}/${tag}-sh-neg.png`); await pg.locator('#sh-ta').fill('64');
    for (let i = 0; i < 3; i++) { await pg.locator('#gs-next').click(); await pg.waitForTimeout(1100); }
    await shot(pg, '#w-gs', `${OUT}/${tag}-gs-3.png`);
    await pg.locator('#gs-next').click(); await pg.waitForTimeout(1100); await shot(pg, '#w-gs', `${OUT}/${tag}-gs-4.png`);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no');
    /* light theme: hero + stages */
    await pg.evaluate(() => { scrollTo(0, 0); document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(2600);
    await pg.waitForTimeout(2000); await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
    await pg.locator('#eng-presets [data-p="c41"]').click(); await shot(pg, '#w-eng', `${OUT}/${tag}-eng-light.png`);
    await shot(pg, '#w-gs', `${OUT}/${tag}-gs-light.png`);
    await shot(pg, '#w-ang', `${OUT}/${tag}-ang-light.png`);
    await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(800);
    await pg.close();
    } catch (e) { console.log('VIEW FAILED', tag, e.message.slice(0, 300)); }
  }
  if (SKIPTAIL) { console.log('errors (' + errs.length + ')', errs.slice(0, 12)); await b.close(); return; }
  /* overflow at every width + every control fires */
  const pg = await b.newPage(); hook(pg);
  await pg.goto('file://' + __dirname + '/site/unit-03.html', { waitUntil:'domcontentloaded', timeout:180000 }); await pg.waitForTimeout(1200);
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
  await pg.waitForTimeout(9000);
  console.log('controls fired:', n);
  for (const id of ['norm-svg', 'eng-svg', 'sh-svg', 'gs-svg', 'hero-3d']) {
    await pg.locator('#' + id).scrollIntoViewIfNeeded(); await pg.waitForTimeout(200);
    const bx = await pg.locator('#' + id).boundingBox(); if (!bx) continue;
    await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await pg.mouse.move(bx.x + bx.width / 2 + 90, bx.y + bx.height / 2 - 30, { steps:6 }); await pg.mouse.up();
  }
  for (let i = 0; i < 3; i++) { await pg.click('#theme-btn', { timeout: 90000 }); await pg.waitForTimeout(2500); }
  await pg.emulateMedia({ reducedMotion:'reduce' }); await pg.reload(); await pg.waitForTimeout(1500);
  await pg.screenshot({ path:`${OUT}/w1280-reduced.png` });
  console.log('errors (' + errs.length + ')', errs.slice(0, 12)); await b.close();
})();
