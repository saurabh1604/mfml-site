/* WebGL screenshots of the cinematic Unit 7 — every section at 1440 + 390, light theme for hero + two stages, controls smoke test, overflow probe */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/unit-07'; fs.mkdirSync(OUT, { recursive: true });
const SECS = ['s1','s2','s3','sproof','s4','s5','s6','s7','s8','s9','s10','s11','spractice'];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const shot = async (pg, sel, path) => { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(900); await pg.locator(sel).screenshot({ path }); };
  for (const [w, h, tag] of [[1440, 900, 'w1440'], [390, 844, 'w390']]) {
    const pg = await b.newPage({ viewport:{ width:w, height:h } }); hook(pg);
    await pg.goto('file://' + __dirname + '/site/unit-07.html'); await pg.waitForTimeout(2400);
    await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    /* scroll through once so every reveal fires */
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y); await pg.waitForTimeout(140); }
    await pg.evaluate(() => scrollTo({ top:0, behavior:'instant' })); await pg.waitForTimeout(400);
    for (const id of SECS) {
      const r = await pg.evaluate(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; }, id);
      for (let k = 0, y = 0; y < r.h && k < 8; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top:t, behavior:'instant' }), r.top + y - 40); await pg.waitForTimeout(700); await pg.screenshot({ path:`${OUT}/${tag}-${id}-${k}.png` }); }
    }
    /* stage close-ups */
    await pg.locator('#gr-fwd').click(); await pg.waitForTimeout(2300); await shot(pg, '#w-graph', `${OUT}/${tag}-graph-fwd.png`);
    await pg.locator('#gr-bwd').click(); await pg.waitForTimeout(1100); await pg.locator('#w-graph').screenshot({ path:`${OUT}/${tag}-graph-bwd-mid.png` });
    await pg.waitForTimeout(1800); await shot(pg, '#w-graph', `${OUT}/${tag}-graph-bwd.png`);
    await pg.locator('#pt-tabs [data-t="0"]').click(); await shot(pg, '#w-paths', `${OUT}/${tag}-paths-u.png`);
    await pg.locator('#nr-auto').click(); await pg.waitForTimeout(3000); await shot(pg, '#w-neuron', `${OUT}/${tag}-neuron-trained.png`);
    await pg.locator('#nr-reset').click(); await pg.evaluate(() => { const s = document.getElementById('nr-y'); s.value = '-1'; s.dispatchEvent(new Event('input')); }); await shot(pg, '#w-neuron', `${OUT}/${tag}-neuron-ym1.png`);
    await pg.locator('#ly-stages [data-s="3"]').click(); await shot(pg, '#w-layer', `${OUT}/${tag}-layer-4.png`);
    await pg.evaluate(() => { const s = document.getElementById('ct-k'); s.value = '8'; s.dispatchEvent(new Event('input')); }); await shot(pg, '#w-cost', `${OUT}/${tag}-cost-8.png`);
    await pg.evaluate(() => { for (const [id, v] of [['ln-ax', '0.5'], ['ln-ay', '-0.5'], ['ln-r', '0.6']]) { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('input')); } }); await shot(pg, '#ln-3d', `${OUT}/${tag}-lin-plane-moved.png`);
    await pg.evaluate(() => { const s = document.getElementById('ck-h'); s.value = '-9'; s.dispatchEvent(new Event('input')); }); await shot(pg, '#w-check', `${OUT}/${tag}-check-9.png`);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no');
    /* light theme: hero + two stages */
    await pg.evaluate(() => { scrollTo(0, 0); document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(3200); await pg.evaluate(() => scrollTo(0, 1)); await pg.waitForTimeout(600); await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(800);
    await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
    await pg.locator('#gr-bwd').click(); await pg.waitForTimeout(2800); await shot(pg, '#w-graph', `${OUT}/${tag}-graph-light.png`);
    await pg.locator('#nr-auto').click(); await pg.waitForTimeout(3000); await shot(pg, '#w-neuron', `${OUT}/${tag}-neuron-light.png`);
    await shot(pg, '#w-lin', `${OUT}/${tag}-lin-light.png`);
    await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(800);
    await pg.close();
  }
  /* overflow at every width + every control fires */
  const pg = await b.newPage(); hook(pg);
  await pg.goto('file://' + __dirname + '/site/unit-07.html'); await pg.waitForTimeout(1200);
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
  /* orbit-drag every stage */
  for (const id of ['gr-svg', 'nr-svg', 'ln-3d', 'hero-3d']) {
    await pg.locator('#' + id).scrollIntoViewIfNeeded(); await pg.waitForTimeout(200);
    const bx = await pg.locator('#' + id).boundingBox(); if (!bx) continue;
    await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await pg.mouse.move(bx.x + bx.width / 2 + 90, bx.y + bx.height / 2 - 30, { steps:6 }); await pg.mouse.up();
  }
  await pg.click('#theme-btn'); await pg.waitForTimeout(900); await pg.click('#theme-btn'); await pg.waitForTimeout(900); await pg.click('#theme-btn'); await pg.waitForTimeout(900);
  await pg.emulateMedia({ reducedMotion:'reduce' }); await pg.reload(); await pg.waitForTimeout(1500);
  await pg.screenshot({ path:`${OUT}/w1280-reduced.png` });
  console.log('errors (' + errs.length + ')', errs.slice(0, 10)); await b.close();
})();
