/* WebGL screenshots of the cinematic Unit 8 — every section at 1440 + 390, light theme for hero + two stages, controls smoke test, overflow probe */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/unit-08'; fs.mkdirSync(OUT, { recursive: true });
const SECS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','smat','s10','s11','s12','s13','spractice'];
const ONLY = process.argv[2];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const hook = pg => { pg.on('pageerror', e => errs.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const shot = async (pg, sel, path) => { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(900); await pg.locator(sel).screenshot({ path }); };
  for (const [w, h, tag] of [[1440, 900, 'w1440'], [390, 844, 'w390']]) {
    if (ONLY && ONLY !== tag) continue;
    const pg = await b.newPage({ viewport:{ width:w, height:h } }); hook(pg);
    await pg.goto('file://' + __dirname + '/site/unit-08.html'); await pg.waitForTimeout(2600);
    await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y); await pg.waitForTimeout(140); }
    await pg.evaluate(() => scrollTo({ top:0, behavior:'instant' })); await pg.waitForTimeout(400);
    for (const id of SECS) {
      const r = await pg.evaluate(id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; }, id);
      for (let k = 0, y = 0; y < r.h && k < 9; y += h - 60, k++) { await pg.evaluate(t => scrollTo({ top:t, behavior:'instant' }), r.top + y - 40); await pg.waitForTimeout(650); await pg.screenshot({ path:`${OUT}/${tag}-${id}-${k}.png` }); }
    }
    /* stage close-ups */
    await pg.locator('#fl-tabs [data-t="mvt"]').click(); await pg.locator('#fl-play').click(); await pg.waitForTimeout(1500); await shot(pg, '#w-flat', `${OUT}/${tag}-flat-play.png`);
    await pg.locator('#fl-tabs [data-t="broken"]').click(); await shot(pg, '#w-flat', `${OUT}/${tag}-flat-broken.png`);
    await pg.locator('#ld-play').click(); await pg.waitForTimeout(3200); await shot(pg, '#w-ladder', `${OUT}/${tag}-ladder.png`);
    await pg.locator('#w-rem [data-p="a3"]').click(); await shot(pg, '#w-rem', `${OUT}/${tag}-rem-a3.png`);
    await pg.locator('#w-walk [data-p="a2"]').click(); await pg.locator('#wk-tabs [data-t="both"]').click(); await shot(pg, '#w-walk', `${OUT}/${tag}-walk-a2.png`);
    await pg.locator('#jd-presets [data-p="saddle"]').click(); await pg.locator('#jd-tabs [data-t="eig"]').click(); await shot(pg, '#w-judge', `${OUT}/${tag}-judge-saddle.png`);
    await pg.locator('#rs-presets [data-p="twist"]').click(); await shot(pg, '#w-rose', `${OUT}/${tag}-rose-twist.png`);
    await pg.locator('#ht-presets [data-p="p2"]').click(); await pg.waitForTimeout(800); await shot(pg, '#w-hunt', `${OUT}/${tag}-hunt-p2.png`);
    await pg.locator('#fc-tabs [data-t="ln"]').click(); await pg.evaluate(() => { const s = document.getElementById('fc-x'); s.value = '3'; s.dispatchEvent(new Event('input')); }); await shot(pg, '#w-fact', `${OUT}/${tag}-fact-ln3.png`);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no');
    /* light theme: hero + two stages */
    await pg.evaluate(() => { scrollTo(0, 0); document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(3600); await pg.evaluate(() => scrollTo(0, 1)); await pg.waitForTimeout(600); await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(800);
    await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
    await shot(pg, '#w-judge', `${OUT}/${tag}-judge-light.png`);
    await shot(pg, '#w-rem', `${OUT}/${tag}-rem-light.png`);
    await shot(pg, '#s10 .derive >> nth=0', `${OUT}/${tag}-derive-light.png`);
    await pg.evaluate(() => document.documentElement.removeAttribute('data-theme')); await pg.waitForTimeout(800);
    await pg.close();
  }
  console.log('errors:', errs.length); errs.slice(0, 8).forEach(e => console.log(' ', e));
  await b.close();
})();
