const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const p = 'unit-05';
  fs.mkdirSync(`shots-after/${p}`, { recursive: true });
  // --- widths: no horizontal overflow ---
  for (const w of [360, 390, 768, 1024, 1440, 1680]) {
    const pg = await b.newPage({ viewport: { width: w, height: 900 } });
    await pg.goto('file://' + __dirname + `/site/${p}.html`); await pg.waitForTimeout(600);
    const sw = await pg.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    console.log('width', w, 'scrollWidth', sw[0], sw[0] <= sw[1] ? 'ok' : 'OVERFLOW');
    await pg.close();
  }
  // --- controls + ids + console ---
  const errors = [];
  const pg0 = await b.newPage({ viewport: { width: 1300, height: 900 } });
  pg0.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  pg0.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  await pg0.goto('file://' + __dirname + `/site/${p}.html`); await pg0.waitForTimeout(600);
  const res = await pg0.evaluate(async () => {
    const out = { missing: [], fired: 0 };
    const src = [...document.scripts].map(s => s.textContent).join('\n');
    const ids = new Set(); let m; const re = /getElementById\('([^']+)'\)/g;
    while ((m = re.exec(src))) ids.add(m[1]);
    ids.forEach(id => { if (!document.getElementById(id)) out.missing.push(id); });
    for (const r of document.querySelectorAll('.widget input[type=range]')) {
      const v = r.value; r.value = r.max; r.dispatchEvent(new Event('input')); r.value = r.min; r.dispatchEvent(new Event('input')); r.value = v; r.dispatchEvent(new Event('input')); out.fired++;
    }
    for (const s of document.querySelectorAll('.widget select')) { s.dispatchEvent(new Event('input')); s.dispatchEvent(new Event('change')); out.fired++; }
    for (const bt of document.querySelectorAll('.widget button')) { bt.click(); out.fired++; await new Promise(r => setTimeout(r, 15)); }
    out.checks = document.querySelectorAll('.check').length;
    out.widgets = document.querySelectorAll('.widget').length;
    out.derive = document.querySelectorAll('.derive').length;
    out.probs = document.querySelectorAll('#spractice .prob').length;
    out.katexErr = document.querySelectorAll('.katex-error').length;
    out.ids = [...document.querySelectorAll('.check')].map(c => c.dataset.check).join(',');
    return out;
  });
  await pg0.waitForTimeout(2500);
  console.log(JSON.stringify(res));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ZERO console/page errors');
  await pg0.close();
  // --- screenshots ---
  for (const [tag, w, h] of [['d', 1440, 900], ['m', 390, 844]]) {
    const pg = await b.newPage({ viewport: { width: w, height: h } });
    await pg.goto('file://' + __dirname + `/site/${p}.html`); await pg.waitForTimeout(800);
    const secs = await pg.$$('main section, header.hero');
    let i = 0;
    for (const s of secs) {
      const box = await s.boundingBox(); if (!box || box.height < 40) continue;
      await s.scrollIntoViewIfNeeded(); await pg.waitForTimeout(200);
      const id = (await s.getAttribute('id')) || `sec${i}`;
      try { await s.screenshot({ path: `shots-after/${p}/${tag}-${String(i).padStart(2, '0')}-${id}.png` }); } catch (e) { console.log(id, e.message.slice(0, 80)); }
      i++;
    }
    console.log(tag, i, 'sections');
    await pg.close();
  }
  await b.close();
})();
