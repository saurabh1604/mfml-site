const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const p = 'unit-02';
  fs.mkdirSync(`shots-after/${p}`, { recursive: true });
  // 1) console errors + control smoke test + overflow
  const pg0 = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  pg0.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  pg0.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 300)));
  await pg0.goto('file://' + __dirname + `/site/${p}.html`); await pg0.waitForTimeout(700);
  const res = await pg0.evaluate(async () => {
    const out = { fired: 0, thrown: [] };
    const ws = document.querySelectorAll('.widget input[type=range], .widget select, .widget input[type=number], .widget input[type=checkbox]');
    for (const c of ws) { try { c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); out.fired++; } catch (e) { out.thrown.push(c.id + ': ' + e.message); } }
    for (const bt of document.querySelectorAll('.widget button')) { try { bt.click(); out.fired++; } catch (e) { out.thrown.push((bt.id || bt.textContent) + ': ' + e.message); } }
    // getElementById targets in scripts
    const src = [...document.scripts].map(s => s.textContent).join('\n');
    const ids = [...src.matchAll(/getElementById\('([\w-]+)'\)/g)].map(m => m[1]);
    out.missing = [...new Set(ids)].filter(id => !document.getElementById(id) && !/^span-(c|l|lo|lr)\d$/.test(id));
    out.checks = document.querySelectorAll('.check').length;
    out.derive = document.querySelectorAll('.derive').length;
    out.widgets = document.querySelectorAll('.widget').length;
    out.probs = document.querySelectorAll('#spractice .prob').length;
    out.figs = document.querySelectorAll('figure.fig').length;
    out.ids = [...document.querySelectorAll('.check')].map(c => c.dataset.check).join(',');
    return out;
  });
  await pg0.waitForTimeout(1500);
  console.log(JSON.stringify(res));
  for (const w of [360, 390, 768, 1024, 1440, 1680]) {
    await pg0.setViewportSize({ width: w, height: 900 }); await pg0.waitForTimeout(250);
    const o = await pg0.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    console.log('overflow', w, o[0] <= o[1] ? 'ok' : 'OVERFLOW ' + o.join('/'));
  }
  console.log('ERRORS', errs.length, errs.slice(0, 8));
  await pg0.close();
  // 2) section screenshots
  for (const [tag, w, h] of [['d', 1440, 900], ['m', 390, 844]]) {
    const pg = await b.newPage({ viewport: { width: w, height: h } });
    await pg.goto('file://' + __dirname + `/site/${p}.html`);
    await pg.waitForTimeout(800);
    // stop auto-spin for deterministic shots; show detector at a mid step
    await pg.evaluate(() => { const s = document.getElementById('span-spin'); if (s && s.getAttribute('aria-pressed') === 'true') s.click(); });
    const secs = await pg.$$('main section, header.hero');
    let i = 0;
    for (const s of secs) {
      const box = await s.boundingBox(); if (!box || box.height < 40) continue;
      await s.scrollIntoViewIfNeeded(); await pg.waitForTimeout(250);
      const id = (await s.getAttribute('id')) || `sec${i}`;
      try { await s.screenshot({ path: `shots-after/${p}/${tag}-${String(i).padStart(2, '0')}-${id}.png` }); } catch (e) { console.log(p, id, e.message.slice(0, 80)); }
      i++;
    }
    console.log(p, tag, i, 'sections');
    await pg.close();
  }
  await b.close();
})();
