/* Unit 17 screenshots WITH WebGL.
   node shots-u17.js [width=1440] [theme=dark] [ids=hero,s1,…|all] [waitMs]
     → shots/u17/<width>-<theme>-<id>-<k>.png (tall targets are cut into viewport chunks). "hero@7.5" shoots the hero 7.5 s into its loop.
   node shots-u17.js [width] [theme] try [w-order,w-talk,…|all|3d]
     → shots/u17/try-<width>-<theme>-<widget>-<k>-<state>.png : every widget in its initial state and in each Try-line state.
   Prints console errors and any horizontal overflow. */
const { chromium } = require('playwright');
const fs = require('fs');
const W = +(process.argv[2] || 1440), THEME = process.argv[3] || 'dark', IDS = process.argv[4] || 'all', ARG5 = process.argv[5];
const OUT = __dirname + '/shots/u17/'; fs.mkdirSync(OUT, { recursive: true });

/* [widget, state name, page script (runs before the shot), extra wait ms] — the Try lines, in order */
const S = (id, v) => `__set('${id}',${JSON.stringify(v)});`, C = sel => `__clk('${sel}');`;
const TRY = [
  ['w-order', 'initial', '', 0], ['w-order', 'turn-0', S('or-th', 0), 0], ['w-order', 'turn-180', S('or-th', 180), 0], ['w-order', 'another-order', S('or-th', 90) + C('#or-swap'), 0],
  ['w-order', 'bag', C('#or-mode [data-t=bag]'), 0], ['w-order', 'window-3', C('#or-mode [data-t=win]'), 0],
  ['w-rnn-step', 'initial', '', 0], ['w-rnn-step', 'three-words', C('#rs-reset') + C('#rs-next') + C('#rs-next') + C('#rs-next'), 0], ['w-rnn-step', 'w-1', S('rs-w', 1), 0],
  ['w-rnn-step', 'six-slots', S('rs-w', .5) + C('#rs-mode [data-t=six]'), 0], ['w-rnn-step', 'six-mix', C('#rs-wm [data-m=mix]'), 0],
  ['w-unroll', 'initial', '', 1500], ['w-unroll', 'folded', C('#un-play'), 2200], ['w-unroll', 'eight-words', C('#un-share') + S('un-T', 8), 2200],
  ['w-shapes', 'many-to-one', '', 0], ['w-shapes', 'translate', C('#sh-tabs [data-t=s2s]'), 0], ['w-shapes', 'next-word', C('#sh-tabs [data-t=lm]') + C('#sh-play'), 3600],
  ['w-talk', 'initial', '', 0], ['w-talk', 'greedy', C('#tk-greedy'), 5000], ['w-talk', 'T0.5-dice1', C('#tk-reset') + S('tk-T', .5) + C('#tk-sample'), 5000], ['w-talk', 'T2-dice1', C('#tk-reset') + S('tk-T', 2) + C('#tk-sample'), 5000],
  ['w-talk', 'typo', C('#tk-reset') + `(()=>{const i=document.getElementById('tk-seed'); i.value='the trian to '; i.dispatchEvent(new Event('input'));})();` + C('#tk-greedy'), 5000],
  ['w-talk', 'training', C('#tk-reset') + C('#tk-mode [data-t=train]') + C('#tk-sample'), 3500],
  ['w-bptt', 'F1', '', 0], ['w-bptt', 'B4', `U17W['w-bptt'].go(5);`, 300], ['w-bptt', 'sum', `U17W['w-bptt'].go(9);`, 300], ['w-bptt', 'cut', `U17W['w-bptt'].setTrunc(true);U17W['w-bptt'].go(9);`, 300],
  ['w-power', 'initial', '', 0], ['w-power', 'explode-1.5', C('#w-power .preset[data-w="1.5"]'), 0], ['w-power', 'tanh', S('pw-w', .5) + C('#pw-tanh'), 0], ['w-power', 'tanh-1.5', C('#w-power .preset[data-w="1.5"]'), 0],
  ['w-eigen-memory', 'keep', '', 0], ['w-eigen-memory', 'fade', C('#em-pre [data-p=fade]'), 0], ['w-eigen-memory', 'explode', C('#em-pre [data-p=explode]'), 0], ['w-eigen-memory', 'rotate', C('#em-pre [data-p=rotate]'), 0],
  ['w-clip', 'off-flung', `U17W['w-clip'].st.n=40;U17W['w-clip'].redraw();`, 1500], ['w-clip', 'on-c2', C('#cl-on') + `U17W['w-clip'].st.n=40;U17W['w-clip'].redraw();`, 1500],
  ['w-clip', 'on-c0.5', S('cl-c', .5) + `U17W['w-clip'].st.n=40;U17W['w-clip'].redraw();`, 1500],
  ['w-notebook', 'initial', '', 0], ['w-notebook', 'hold', C('#nb-hold'), 0], ['w-notebook', 'window-shut', S('nb-o', 0), 0], ['w-notebook', 'scores', C('#nb-reset') + C('#nb-mode [data-t=scores]'), 0],
  ['w-lstm', 'accuracy-20', '', 1500], ['w-lstm', 'honest', C('#lb-honest'), 1500], ['w-lstm', 'blame-50', S('lb-T', 50) + C('#lb-tabs [data-t=blame]'), 1500],
  ['w-gru', 'initial', '', 0], ['w-gru', 'z-0.5', S('gr-z', .5), 0], ['w-gru', 'r-0', S('gr-r', 0), 0], ['w-gru', 'z-1', S('gr-r', 1) + S('gr-z', 1), 0], ['w-gru', 'z-0', S('gr-z', 0), 0], ['w-gru', 'ten-steps', S('gr-r', 1) + S('gr-z', .1) + C('#gr-play'), 3200],
  ['w-gates-compare', 'initial', '', 0], ['w-gates-compare', 'lstm-open', `document.querySelector('#gc-svg [data-cell="lstm"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));`, 0],
  ['w-bidir', 'two-way', '', 0], ['w-bidir', 'one-way', C('#bd-mode [data-t=one]'), 0], ['w-bidir', 'teddy-two', C('#bd-mode [data-t=two]') + C('#bd-sent [data-s=pres]'), 0],
  ['w-bidir', 'stack', C('#bd-mode [data-t=stack]') + C('#bd-sent [data-s=toy]'), 0],
  ['w-seq2seq', 'initial', '', 1800], ['w-seq2seq', 'fifty', C('#sq-50'), 1800],
  ['w-beam', 'greedy', '', 0], ['w-beam', 'width-2', C('#bm-k [data-t="2"]'), 0], ['w-beam', 'log', C('#bm-log'), 0],
  ['w-bleu', 'initial', '', 0], ['w-bleu', 'the-the', `(()=>{const i=document.getElementById('bl-cand'); i.value='the the the the'; i.dispatchEvent(new Event('input'));})();`, 0],
  ['w-bleu', 'reordered', `(()=>{const i=document.getElementById('bl-cand'); i.value='late is the train'; i.dispatchEvent(new Event('input'));})();`, 0],
];
const THREE = ['w-unroll', 'w-clip', 'w-lstm', 'w-seq2seq'];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const VH = W < 600 ? 844 : 900;
  const page = await browser.newPage({ viewport: { width: W, height: VH }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 240)); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e.stack || e).slice(0, 400)));
  await page.addInitScript(t => { try { localStorage.setItem('mfml-theme', t); } catch (e) {} }, THEME);
  await page.goto('file:///home/claude/mfml-site/dev/site/unit-17.html');
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} .reveal,.reveal-stagger>*{opacity:1!important;transform:none!important;transition:none!important}' });

  if (IDS === 'try') {
    await page.evaluate(() => { window.__set = (id, v) => { const s = document.getElementById(id); s.value = String(v); s.dispatchEvent(new Event('input')); }; window.__clk = sel => document.querySelector(sel).click(); });
    const want = !ARG5 || ARG5 === 'all' ? null : ARG5 === '3d' ? THREE : ARG5.split(',');
    const k = {};
    for (const [id, name, js, extra] of TRY) {
      if (want && !want.includes(id)) continue;
      const loc = page.locator('#' + id).first(); await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(THREE.includes(id) ? 1200 : 500);
      if (THREE.includes(id)) { await page.locator('#' + id + ' .stage3d').first().scrollIntoViewIfNeeded(); await page.waitForTimeout(1800); }   /* 3-D stages mount only when they are on screen */
      if (js) await page.evaluate(js); await page.waitForTimeout(700 + extra);
      k[id] = (k[id] || 0) + 1;
      await loc.screenshot({ path: `${OUT}try-${W}-${THEME}-${id}-${k[id]}-${name}.png`, timeout: 120000 });
    }
  } else {
    const WAIT = +(ARG5 || 2400);
    const ids = IDS === 'all' ? await page.evaluate(() => ['hero', ...[...document.querySelectorAll('section.unit')].map(s => s.id)]) : IDS.split(',');
    for (const id0 of ids) {
      const [id, at] = id0.split('@');
      const sel = id === 'hero' ? '.hero-stage' : '#' + id;
      const loc = page.locator(sel).first();
      if (!(await loc.count())) { console.log('missing', id); continue; }
      await loc.scrollIntoViewIfNeeded();
      if (id === 'hero' && at) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.evaluate(a => { window.U17HeroAt = a; }, +at); await page.waitForTimeout(1600);
      } else await page.waitForTimeout(id === 'hero' ? 5200 : WAIT);
      const bb = await loc.boundingBox(); if (!bb) { console.log('no box for', id); continue; }
      const top = bb.y + await page.evaluate(() => scrollY);
      const CH = VH - 70; let k = 0;
      for (let y = top - (id === 'hero' ? 0 : 40); y < top + bb.height - 40; y += CH) {
        if (!(id === 'hero' && at)) { await page.evaluate(v => window.scrollTo(0, v), Math.max(0, y)); await page.waitForTimeout(900); }
        await page.screenshot({ path: `${OUT}${W}-${THEME}-${id0.replace('@', 'at')}-${k}.png` });
        k++; if (id === 'hero') break;
      }
    }
  }
  const ov = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  const kd = await page.evaluate(() => [...document.querySelectorAll('.katex-display')].filter(e => e.scrollWidth > e.clientWidth + 1 && e.offsetParent).map(e => e.textContent.slice(0, 40)));
  console.log('overflow', ov.s > ov.c + 1 ? 'YES ' + JSON.stringify(ov) : 'none', '| wide katex-display:', kd.length, kd.slice(0, 4).join(' ¦ '));
  console.log(errs.length ? errs.join('\n') : 'no console errors');
  await browser.close();
})();
