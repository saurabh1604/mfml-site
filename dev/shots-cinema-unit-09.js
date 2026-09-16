/* WebGL screenshots of the cinematic Unit 8 — every section at 1440 + 390, light theme for hero + two stages, controls smoke test, overflow probe */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/unit-09'; fs.mkdirSync(OUT, { recursive: true });
const SECS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','svar','s10','s11','spractice'];
const ONLY = process.argv[2];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const shot = async (pg, sel, path) => { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(900); await pg.locator(sel).screenshot({ path, timeout: 120000 }); };
  for (const [w, h, tag] of [[1440, 900, 'w1440'], [390, 844, 'w390']]) {
    if (ONLY && ONLY !== tag) continue;
    const pg = await b.newPage({ viewport:{ width:w, height:h } }); hook(pg);
    await pg.goto('file://' + __dirname + '/site/unit-09.html'); await pg.waitForTimeout(2600);
    await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y); await pg.waitForTimeout(140); }
    await pg.evaluate(() => scrollTo({ top:0, behavior:'instant' })); await pg.waitForTimeout(400);
    for (const id of SECS) {
      const r = await pg.evaluate(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; }, id);
      for (let k = 0, y = 0; y < r.h && k < 9; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top:t, behavior:'instant' }), r.top + y - 40); await pg.waitForTimeout(650); await pg.screenshot({ path:`${OUT}/${tag}-${id}-${k}.png` }); }
    }
    /* stage close-ups */
    await pg.locator('#ft-play').click(); await pg.waitForTimeout(3500); await shot(pg, '#w-fit', `${OUT}/${tag}-fit-play.png`);
    await pg.locator('#fp-tabs [data-t="bumpy"]').click(); await pg.locator('#fp-play').click(); await pg.waitForTimeout(3000); await shot(pg, '#w-flat', `${OUT}/${tag}-flat-bumpy.png`);
    await pg.evaluate(() => { const s = document.getElementById('ds-g'); s.value = '0.09'; s.dispatchEvent(new Event('input')); }); await pg.locator('#ds-play').click(); await pg.waitForTimeout(6000); await shot(pg, '#w-desc', `${OUT}/${tag}-desc-zigzag.png`);
    await pg.locator('#st-presets [data-p="bounce"]').click(); await shot(pg, '#w-step', `${OUT}/${tag}-step-bounce.png`);
    await pg.locator('#ls-best').click(); await pg.waitForTimeout(1800); await shot(pg, '#w-line', `${OUT}/${tag}-line-best.png`);
    await pg.locator('#br-m [data-t="golden"]').click(); for (let i = 0; i < 4; i++) await pg.locator('#br-step').click(); await shot(pg, '#w-bracket', `${OUT}/${tag}-bracket-golden.png`);
    await pg.locator('#dc-tabs [data-t="bold"]').click(); await pg.waitForTimeout(400); await shot(pg, '#w-decay', `${OUT}/${tag}-decay-bold.png`);
    await shot(pg, '#w-fd', `${OUT}/${tag}-fd.png`);
    await pg.locator('#sg-play').click(); await pg.waitForTimeout(3500); await shot(pg, '#w-sgd', `${OUT}/${tag}-sgd.png`);
    await pg.locator('#fg-play').click(); await pg.waitForTimeout(9000); await shot(pg, '#w-fog', `${OUT}/${tag}-fog-walk.png`);
    await pg.locator('#w-race [data-p="fair-cost"]').click(); await pg.waitForTimeout(12000); await shot(pg, '#w-race', `${OUT}/${tag}-race-cost.png`);
    await pg.evaluate(() => document.querySelector('#s5 details.algebra').open = true); await shot(pg, '#s5 details.algebra', `${OUT}/${tag}-drawer-open.png`);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no');
    /* light theme: hero + two stages */
    await pg.evaluate(() => { scrollTo(0, 0); document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(12000); await pg.evaluate(() => scrollTo(0, 1)); await pg.waitForTimeout(600); await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(800);
    await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
    await shot(pg, '#w-desc', `${OUT}/${tag}-desc-light.png`);
    await shot(pg, '#w-line', `${OUT}/${tag}-line-light.png`);
    await pg.evaluate(() => document.querySelector('#s6 details.algebra').open = true); await shot(pg, '#s6 details.algebra', `${OUT}/${tag}-derive-light.png`);
    await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(800);
    await pg.close();
  }
  console.log('errors:', errs.length); errs.slice(0, 8).forEach(e => console.log(' ', e));
  await b.close();
})();
