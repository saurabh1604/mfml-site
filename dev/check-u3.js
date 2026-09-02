const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const errors = [];
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  pg.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  pg.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  await pg.goto('file://' + __dirname + '/site/unit-03.html');
  await pg.waitForTimeout(800);
  // fire every control
  const r = await pg.evaluate(async () => {
    const out = { ranges: 0, buttons: 0, numbers: 0, selects: 0 };
    for (const el of document.querySelectorAll('.widget input[type=range]')) {
      const v = +el.value, mn = +el.min, mx = +el.max;
      el.value = mn; el.dispatchEvent(new Event('input', { bubbles: true }));
      el.value = mx; el.dispatchEvent(new Event('input', { bubbles: true }));
      el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
      out.ranges++;
    }
    for (const el of document.querySelectorAll('.widget input[type=number]')) {
      if (el.disabled) continue;
      el.value = '1.5'; el.dispatchEvent(new Event('input', { bubbles: true }));
      el.value = '1'; el.dispatchEvent(new Event('input', { bubbles: true }));
      out.numbers++;
    }
    for (const el of document.querySelectorAll('.widget select')) { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); out.selects++; }
    for (const el of document.querySelectorAll('.widget button')) { el.click(); out.buttons++; }
    // stop any running animations by clicking play buttons again
    for (const el of document.querySelectorAll('.widget button.play')) { if (el.textContent.startsWith('■')) el.click(); }
    return out;
  });
  console.log('controls fired:', r);
  await pg.waitForTimeout(300);
  // getElementById targets: grep the script for ids and check
  const html = require('fs').readFileSync(__dirname + '/site/unit-03.html', 'utf8');
  const ids = new Set([...html.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]));
  const missing = await pg.evaluate(ids => ids.filter(i => !document.getElementById(i)), [...ids]);
  // dynamic ids (dot-y0..) are created at runtime; report only static misses
  console.log('getElementById ids:', ids.size, 'missing:', missing.filter(i => !/^dot-yo?\d$/.test(i)));
  // overflow at widths
  for (const w of [360, 390, 768, 1024, 1440, 1680]) {
    await pg.setViewportSize({ width: w, height: 900 });
    await pg.waitForTimeout(200);
    const o = await pg.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    console.log('width', w, 'scrollWidth', o[0], 'innerWidth', o[1], o[0] <= o[1] ? 'ok' : 'OVERFLOW');
    if (o[0] > o[1]) {
      const culprits = await pg.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 8).map(e => e.tagName + '#' + e.id + '.' + e.className));
      console.log('  culprits:', culprits);
    }
  }
  console.log('checks:', await pg.locator('.check').count(), 'derive:', await pg.locator('.derive').count(), 'widgets:', await pg.locator('.widget').count(), 'problems:', await pg.locator('#spractice .prob').count());
  console.log('ERRORS (' + errors.length + ')'); errors.forEach(e => console.log(' ', e));
  await b.close();
})();
