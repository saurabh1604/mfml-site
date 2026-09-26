/* Reviewer helper: element screenshots of widgets in chosen states.
   node audits/u16-wshots.js <width> <theme> <plan-name>[,<plan-name>...]    → shots/review-u16/<plan>-<width>-<theme>.png
   Plans are listed below; each scrolls to a widget, runs page actions, waits on state, and shoots the widget. */
const { chromium } = require('playwright');
const W = +(process.argv[2] || 1440), THEME = process.argv[3] || 'dark', WANT = (process.argv[4] || '').split(',').filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PLANS = {
  'nlm': { id: 'w-nlm', run: async p => {} },
  'nlm-iplay': { id: 'w-nlm', run: async p => { await p.evaluate(() => window.U16['w-nlm'].pick('I', 'play')); } },
  'cbow-6': { id: 'w-cbow', run: async p => { for (let i = 0; i < 6; i++) { await p.click('#w2c-next'); await p.waitForFunction(() => !U16W2V.cbow.state().animating, null, { timeout: 60000 }); } } },
  'cost-tree': { id: 'w-cost', run: async p => { await p.click('#w-cost [data-t="tree"]'); await sleep(800); } },
  'cost-sub': { id: 'w-cost', run: async p => { await p.click('#w-cost [data-t="sub"]'); await sleep(800); } },
  'pmi-3': { id: 'w-pmi', run: async p => { await p.click('#pm-steps [data-s="2"]'); await sleep(500); } },
  'pmi-tfidf': { id: 'w-pmi', run: async p => { await p.click('#pm-tabs [data-t="tfidf"]'); await sleep(500); } },
  'lab-end': { id: 'w-lab', run: async p => { await p.evaluate(() => { U16W2V.lab.finish(); }); await sleep(1500); } },
  'w2v-trained': { id: 'w-w2v', run: async p => { await p.evaluate(() => { window.U16['w-w2v'].train(100000); }); await sleep(6000); } },
  'poly-0': { id: 'w-polysemy', run: async p => { await p.evaluate(() => window.U16['w-polysemy'].set && window.U16['w-polysemy'].set(0)); await sleep(5000); } },
  'poly-100': { id: 'w-polysemy', run: async p => { await p.evaluate(() => window.U16['w-polysemy'].set && window.U16['w-polysemy'].set(1)); await sleep(5000); } },
  'svd-ppmi': { id: 'w-svd-words', run: async p => { await p.click('#w-svd-words [data-t="ppmi"]'); await sleep(6000); } },
  'analogy-delhi': { id: 'w-analogy', run: async p => { await p.evaluate(() => { const b = [...document.querySelectorAll('#w-analogy button')].find(x => /Delhi/.test(x.textContent)); b && b.click(); }); await sleep(6000); } },
  'analogy-female': { id: 'w-analogy', run: async p => { await p.evaluate(() => { const b = [...document.querySelectorAll('#w-analogy button')].find(x => /^female$/.test(x.textContent.trim())); b && b.click(); }); await sleep(6000); } },
  'onehot-meaning': { id: 'w-onehot', run: async p => { await p.click('#oh-play'); await sleep(7000); } },
  'cards': { id: 's17', run: async p => { await sleep(800); } },
  'hero': { id: null, run: async p => { await sleep(6000); } },
};
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: W, height: W < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 300))); page.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  await page.addInitScript(t => { try { localStorage.setItem('mfml-theme', t); } catch (e) {} }, THEME);
  await page.goto('file:///home/claude/mfml-site/dev/site/unit-16.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.U16 && window.U16W2V, null, { timeout: 120000 });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} .reveal,.reveal-stagger>*{opacity:1!important;transform:none!important;transition:none!important}' });
  for (const name of WANT) {
    const pl = PLANS[name]; if (!pl) { console.log('no plan', name); continue; }
    try {
      if (pl.id) { await page.locator('#' + pl.id).scrollIntoViewIfNeeded(); await sleep(1500); } else { await page.evaluate(() => scrollTo(0, 0)); }
      await pl.run(page);
      const out = `shots/review-u16/${name}-${W}-${THEME}.png`;
      if (pl.id) await page.locator('#' + pl.id).screenshot({ path: out }); else await page.screenshot({ path: out });
      console.log('shot', out);
    } catch (e) { console.log('FAILED', name, String(e).slice(0, 300)); }
  }
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await browser.close();
})();
