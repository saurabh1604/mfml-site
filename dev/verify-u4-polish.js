const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const errors = [];
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  await page.goto('file:///home/claude/mfml-site/site/unit-04.html');
  await page.waitForTimeout(800);
  // ids referenced by getElementById exist
  const src = fs.readFileSync('/root/mfml-site/dev/src/unit-04.html', 'utf8');
  const ids = [...src.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]);
  const dyn = [...src.matchAll(/getElementById\('e3-'\+k\+'o'\)/g)];
  const missing = await page.evaluate(ids => ids.filter(i => !document.getElementById(i)), [...new Set(ids)]);
  console.log('missing ids:', missing);
  // fire every control
  const r = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.widget input[type=range], .widget select').forEach(el => { try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { out.push(el.id + ': ' + e.message); } });
    document.querySelectorAll('.widget input[type=number]').forEach(el => { try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { out.push(el.id + ': ' + e.message); } });
    document.querySelectorAll('.widget button, .term-card').forEach(el => { try { el.click(); } catch (e) { out.push((el.id || el.textContent) + ': ' + e.message); } });
    return out;
  });
  console.log('control throws:', r);
  await page.waitForTimeout(4000); // let tweens finish
  console.log('checks:', await page.locator('.check').count(), 'widgets:', await page.locator('.widget').count(), 'derive:', await page.locator('.derive').count(), 'probs:', await page.locator('.prob').count());
  console.log('katex errors:', await page.locator('.katex-error').count());
  console.log('toc links:', await page.locator('#toc a').count());
  for (const w of [360, 390, 768, 1024, 1440, 1680]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(200);
    const ov = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    console.log('overflow', w, ov[0] <= ov[1] ? 'ok' : 'OVERFLOW ' + ov);
  }
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ZERO console/page errors');
  // screenshots
  for (const [tag, w, h] of [['d', 1440, 900], ['m', 390, 844]]) {
    const pg = await b.newPage({ viewport: { width: w, height: h } });
    await pg.goto('file:///home/claude/mfml-site/site/unit-04.html');
    await pg.waitForTimeout(800);
    fs.mkdirSync('shots-after/unit-04', { recursive: true });
    const secs = await pg.$$('main section, header.hero');
    let i = 0;
    for (const s of secs) {
      const box = await s.boundingBox(); if (!box || box.height < 40) continue;
      await s.scrollIntoViewIfNeeded(); await pg.waitForTimeout(200);
      const id = (await s.getAttribute('id')) || `sec${i}`;
      try { await s.screenshot({ path: `shots-after/unit-04/${tag}-${String(i).padStart(2, '0')}-${id}.png` }); } catch (e) { console.log(id, e.message.slice(0, 80)); }
      i++;
    }
    await pg.close();
  }
  await b.close();
})();
