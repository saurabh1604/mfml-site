/* Reviewer helper: list display maths that does not fit at given widths, with drawers and solutions open.
   It measures the right edge of every glyph box, because a clipped .katex-display can still report scrollWidth == clientWidth.
   Hits of +6000 px and more are KaTeX's hidden 400em SVG strips (\sqrt, \underbrace …), not visible overflow.
   node audits/u16-katex-wide.js 390,360,1300 [unit-17.html] */
const { chromium } = require('playwright');
const WS = (process.argv[2] || '390').split(',').map(Number), FILE = process.argv[3] || 'unit-16.html';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const W of WS) {
    const page = await browser.newPage({ viewport: { width: W, height: 844 } });
    await page.goto('file:///home/claude/mfml-site/dev/site/' + FILE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const res = await page.evaluate(() => {
      document.querySelectorAll('details').forEach(d => d.open = true);
      document.querySelectorAll('.reveal').forEach(n => n.classList.add('in'));
      const out = [];
      document.querySelectorAll('.katex-display').forEach(e => {
        if (!e.offsetParent) return;
        const cr = e.getBoundingClientRect(); let mr = cr.right;
        e.querySelectorAll('.katex-html *').forEach(x => { const r = x.getBoundingClientRect(); if (r.width > 0 && r.right > mr) mr = r.right; });
        if (e.scrollWidth > e.clientWidth + 1 || mr > cr.right + 1) {
          const sec = e.closest('section'); const ann = e.querySelector('annotation');
          out.push({ sec: sec ? sec.id : '?', over: Math.round(Math.max(e.scrollWidth - e.clientWidth, mr - cr.right)), tex: ann ? ann.textContent.slice(0, 160) : e.textContent.slice(0, 80) });
        }
      });
      const tables = [...document.querySelectorAll('.scroll-x, .tblwrap, .table-wrap')].filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 1)
        .map(e => ({ sec: (e.closest('section') || {}).id, over: e.scrollWidth - e.clientWidth, id: (e.querySelector('[id]') || {}).id || e.className }));
      const opts = [...document.querySelectorAll('.check .opts button')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent.slice(0, 60));
      return { out, tables, opts, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    console.log(`== ${W}px: ${res.out.length} wide display maths; page overflow ${res.doc}px`);
    res.out.forEach(o => console.log(`  ${o.sec}  +${o.over}px  ${o.tex}`));
    console.log(`  scroll containers wider than their box: ${res.tables.length}`); res.tables.forEach(t => console.log(`    ${t.sec} +${t.over}px ${t.id}`));
    if (res.opts.length) console.log('  check options overflowing:', res.opts);
    await page.close();
  }
  await browser.close();
})();
