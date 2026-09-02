/* Unit 6 only: controls smoke test, overflow check, and per-section screenshots at 1440 / 390. */
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const url = 'file://' + __dirname + '/site/unit-06.html';
  let bad = 0;
  // ---- console / controls / ids
  {
    const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = [];
    pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
    pg.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 200)));
    await pg.goto(url); await pg.waitForTimeout(1200);
    const missing = await pg.evaluate(() => {
      const src = [...document.scripts].map(s => s.textContent).join('\n');
      const ids = [...src.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]);
      return [...new Set(ids)].filter(id => !document.getElementById(id));
    });
    if (missing.length) { console.log('missing ids:', missing); bad++; } else console.log('ok  every getElementById target exists');
    const n = await pg.evaluate(async () => {
      let c = 0;
      for (const r of document.querySelectorAll('.widget input[type=range]')) {
        const v = +r.value; r.value = (+r.min + +r.max) / 2; r.dispatchEvent(new Event('input', { bubbles: true })); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); c++;
      }
      for (const s of document.querySelectorAll('.widget select')) { s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); c++; }
      for (const btn of document.querySelectorAll('.widget button')) { btn.click(); c++; }
      await new Promise(r => setTimeout(r, 3500));
      // stop any running plays by clicking play buttons again if they read ⏸
      for (const btn of document.querySelectorAll('.widget button')) if (/⏸/.test(btn.textContent)) btn.click();
      return c;
    });
    await pg.waitForTimeout(600);
    console.log('ok  fired', n, 'widget controls');
    if (errs.length) { console.log(errs); bad += errs.length; } else console.log('ok  zero console errors');
    await pg.close();
  }
  // ---- overflow at widths
  for (const w of [360, 390, 768, 1024, 1440, 1680]) {
    const pg = await b.newPage({ viewport: { width: w, height: 900 } });
    await pg.goto(url); await pg.waitForTimeout(700);
    const [sw, iw] = await pg.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    if (sw > iw) { console.log('OVERFLOW at', w, sw, '>', iw); bad++;
      const culprits = await pg.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(e => e.tagName + '#' + e.id + '.' + e.className));
      console.log(culprits);
    } else console.log('ok  no overflow at', w);
    await pg.close();
  }
  // ---- screenshots
  fs.mkdirSync('shots-after/unit-06', { recursive: true });
  for (const [tag, w, h] of [['d', 1440, 900], ['m', 390, 844]]) {
    const pg = await b.newPage({ viewport: { width: w, height: h } });
    await pg.goto(url); await pg.waitForTimeout(800);
    const secs = await pg.$$('main section, header.hero');
    let i = 0;
    for (const s of secs) {
      const box = await s.boundingBox(); if (!box || box.height < 40) continue;
      await s.scrollIntoViewIfNeeded(); await pg.waitForTimeout(200);
      const id = (await s.getAttribute('id')) || `sec${i}`;
      try { await s.screenshot({ path: `shots-after/unit-06/${tag}-${String(i).padStart(2, '0')}-${id}.png` }); } catch (e) { console.log(id, e.message.slice(0, 80)); }
      i++;
    }
    console.log(tag, i, 'sections shot');
    await pg.close();
  }
  await b.close();
  console.log(bad ? `❌ ${bad} problem(s)` : '✓ u6 runtime checks clean');
})();
