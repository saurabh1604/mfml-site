/* WebGL screenshots of the cinematic hub — dark + light, 1440 + 390 */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/index'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  for (const [w, h, tag] of [[1440, 900, 'w1440'], [390, 844, 'w390']]) {
    const pg = await b.newPage({ viewport:{ width:w, height:h } });
    pg.on('pageerror', e => errs.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
    await pg.goto('file://' + __dirname + '/site/index.html'); await pg.waitForTimeout(2200);
    await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
    /* scroll through so every reveal + glyph fires */
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += h * .7) { await pg.evaluate(y => scrollTo(0, y), y); await pg.waitForTimeout(250); }
    await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(600);
    await pg.screenshot({ path:`${OUT}/${tag}-full.png`, fullPage:true });
    /* hover a card for the fast glyph */
    await pg.locator('#units').scrollIntoViewIfNeeded(); await pg.hover('a.card[data-unit="1"]'); await pg.waitForTimeout(500);
    await pg.screenshot({ path:`${OUT}/${tag}-cards.png` });
    /* overflow probe */
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    console.log(tag, 'overflow', o.s > o.c + 1 ? 'YES ' + JSON.stringify(o) : 'no');
    /* light theme */
    await pg.evaluate(() => scrollTo(0, 0)); await pg.evaluate(() => document.documentElement.setAttribute('data-theme','light')); await pg.waitForTimeout(1600);
    await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` });
    await pg.locator('#units').scrollIntoViewIfNeeded(); await pg.waitForTimeout(500);
    await pg.screenshot({ path:`${OUT}/${tag}-cards-light.png` });
    /* returning-student furniture */
    await pg.evaluate(() => { localStorage.setItem('mfml-u1-total','11'); localStorage.setItem('mfml-u1-checks','c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11'); localStorage.setItem('mfml-u3-total','13'); localStorage.setItem('mfml-u3-checks','c1,c2,c3,c4'); localStorage.setItem('mfml-last','3|s7'); localStorage.removeItem('mfml-theme'); });
    await pg.reload(); await pg.waitForTimeout(1800);
    await pg.screenshot({ path:`${OUT}/${tag}-returning.png` });
    await pg.locator('#units').scrollIntoViewIfNeeded(); await pg.waitForTimeout(500);
    await pg.screenshot({ path:`${OUT}/${tag}-returning-cards.png` });
    await pg.evaluate(() => localStorage.clear());
    await pg.close();
  }
  /* overflow at every width */
  const pg = await b.newPage();
  pg.on('pageerror', e => errs.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await pg.goto('file://' + __dirname + '/site/index.html'); await pg.waitForTimeout(800);
  for (const w of [360, 390, 768, 1024, 1440, 1680]) { await pg.setViewportSize({ width:w, height:860 }); await pg.waitForTimeout(400);
    const o = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth })); console.log(w, o.s > o.c + 1 ? 'OVERFLOW ' + JSON.stringify(o) : 'ok'); }
  /* every control fires */
  await pg.setViewportSize({ width:1280, height:900 });
  await pg.click('#theme-btn'); await pg.waitForTimeout(600); await pg.click('#theme-btn'); await pg.waitForTimeout(600); await pg.click('#theme-btn'); await pg.waitForTimeout(600);
  await pg.mouse.move(700, 400); await pg.mouse.down(); await pg.mouse.move(800, 420, { steps:5 }); await pg.mouse.up(); await pg.waitForTimeout(300);
  console.log('errors', errs); await b.close();
})();
