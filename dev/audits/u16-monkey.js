/* Reviewer helper: try to break every widget of Unit 16.
   For each widget: press every button twice quickly, push every slider to min, max and back, flip every checkbox twice,
   pick every <select> option once, toggle the theme, then scan the widget's visible text and SVG for NaN / Infinity / undefined,
   and collect page errors. node audits/u16-monkey.js [width=1440] [ids] */
const { chromium } = require('playwright');
const W = +(process.argv[2] || 1440), ONLY = (process.argv[3] || '').split(',').filter(Boolean);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: W, height: W < 600 ? 844 : 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + String(e.stack || e).slice(0, 500))); page.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 300)); });
  await page.goto('file:///home/claude/mfml-site/dev/site/unit-16.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.U16 && window.U16W2V, null, { timeout: 120000 });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  const ids = ONLY.length ? ONLY : await page.evaluate(() => [...document.querySelectorAll('.widget[id^="w-"]')].map(w => w.id));
  const bad = [];
  for (const id of ids) {
    const t0 = Date.now(); const before = errs.length;
    await page.locator('#' + id).scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
    const res = await page.evaluate(async id => {
      const root = document.getElementById(id), sleep = ms => new Promise(r => setTimeout(r, ms)), log = [];
      const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
      const btns = [...root.querySelectorAll('button')].filter(b => b.offsetParent && !b.disabled);
      for (const b of btns) { try { b.click(); b.click(); } catch (e) { log.push('click ' + b.textContent.trim().slice(0, 30) + ': ' + e); } await sleep(30); }
      for (const r of root.querySelectorAll('input[type=range]')) { const v0 = r.value; for (const v of [r.min, r.max, v0]) { r.value = v; fire(r, 'input'); fire(r, 'change'); await sleep(40); } }
      for (const c of root.querySelectorAll('input[type=checkbox]')) { c.click(); await sleep(60); c.click(); await sleep(60); }
      for (const s of root.querySelectorAll('select')) { const v0 = s.value; for (const o of [...s.options].slice(0, 6)) { s.value = o.value; fire(s, 'change'); await sleep(40); } s.value = v0; fire(s, 'change'); }
      for (const t of root.querySelectorAll('input[type=text],input:not([type]),input[type=number],textarea')) { if (t.type === 'range') continue; const v0 = t.value; for (const v of ['', 'zzzz', '99999', v0]) { t.value = v; fire(t, 'input'); fire(t, 'change'); await sleep(40); } }
      await sleep(400);
      const txt = root.innerText + ' ' + [...root.querySelectorAll('svg text')].map(x => x.textContent).join(' ');
      const m = txt.match(/NaN|Infinity|undefined|\bnull\b|\[object/g);
      const attrs = [...root.querySelectorAll('svg *')].filter(e => [...e.attributes].some(a => /NaN|Infinity/.test(a.value))).length;
      return { n: btns.length, bad: m ? [...new Set(m)] : [], attrs, log };
    }, id);
    /* theme flip twice */
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^Theme/i.test(x.textContent.trim()) || x.id === 'theme-toggle'); if (b) { b.click(); } });
    await page.waitForTimeout(500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^Theme/i.test(x.textContent.trim()) || x.id === 'theme-toggle'); if (b) { b.click(); } });
    await page.waitForTimeout(300);
    const newErrs = errs.slice(before);
    const line = `${id.padEnd(14)} buttons ${String(res.n).padStart(2)} · ${((Date.now() - t0) / 1000).toFixed(1)}s · text ${res.bad.length ? 'BAD ' + res.bad.join('/') : 'ok'} · svg attrs ${res.attrs ? 'BAD ' + res.attrs : 'ok'} · errors ${newErrs.length}`;
    console.log(line); if (res.bad.length || res.attrs || newErrs.length || res.log.length) bad.push({ id, res, newErrs });
  }
  console.log('\n' + (bad.length ? JSON.stringify(bad, null, 1).slice(0, 4000) : 'no problems found'));
  await browser.close();
})();
