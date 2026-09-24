/* Unit 12 · screenshots of widget states (tabs, played stories) and hero phases, WebGL on.
   node shots-u12-states.js [--w=1440] [--light] [names…] */
const { chromium } = require('playwright');
const fs = require('fs');
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith('--' + k)); return a ? (a.split('=')[1] || true) : null; };
const only = args.filter(a => !a.startsWith('--'));
const W = +(opt('w') || 1440), light = !!opt('light');
const OUT = 'shots/u12'; fs.mkdirSync(OUT, { recursive: true });
const tag = (light ? 'light-' : '') + W;
const STATES = [
  ['hero-sweep', null, [], 4000], ['hero-lock', null, [], 9500], ['hero-pc2', null, [], 13000], ['hero-flat', null, [], 17500],
  ['photo-end', 'w-photo', ['#ph-end'], 2500], ['photo-edge', 'w-photo', ['#ph-edge'], 2500],
  ['bowl-b', 'w-bowl', ['#bw-b'], 2500],
  ['leash-top', 'w-leash', ['#ls-climb'], 3500],
  ['three-pc1', 'w-three', ['#th-snap'], 2500],
  ['peel-1', 'w-peel', ['#pl-find', 800, '#pl-peel'], 3500], ['peel-3', 'w-peel', ['#pl-find', 900, '#pl-peel', 2400, '#pl-find'], 2500],
  ['scree-noisy', 'w-scree', ['#sc-noisy'], 800],
  ['rebuild-plane', 'w-rebuild', ['#rb-tabs [data-t="plane"]', 1500], 2500],
  ['decor-three', 'w-decor', ['#dc-tabs [data-t="three"]'], 3000], ['decor-rot', 'w-decor', ['#dc-play'], 3500],
  ['eckart-cloud', 'w-eckart', ['#ek-tabs [data-t="cloud"]', 1200, '#ek-r1'], 2500], ['eckart-20', 'w-eckart', [['ek-k', 20]], 1200],
  ['power-run', 'w-power', ['#pw-play'], 4000], ['power-3d', 'w-power', ['#pw-tabs [data-t="three"]', 1200, '#pw3-play'], 7000],
  ['wide-roll', 'w-wide', ['#wd-roll'], 800],
  ['recipe-d', 'w-recipe', ['#rc-steps [data-s="3"]'], 2500], ['recipe-e', 'w-recipe', ['#rc-steps [data-s="4"]'], 2500], ['recipe-f', 'w-recipe', ['#rc-steps [data-s="5"]'], 2500],
  ['recipe-units', 'w-recipe', ['#rc-tabs [data-t="units"]'], 1000], ['recipe-units-std', 'w-recipe', ['#rc-tabs [data-t="units"]', 300, '#rc-std'], 1000], ['recipe-blind', 'w-recipe', ['#rc-tabs [data-t="blind"]'], 1000],
  ['worked-nine', 'w-worked', ['#wk-nine'], 1000],
];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  for (const [name, wid, acts, wait] of STATES) {
    if (only.length && !only.some(o => name.startsWith(o))) continue;
    const p = await b.newPage({ viewport: { width: W, height: W < 600 ? 844 : 900 } });
    p.on('pageerror', e => errs.push(name + ': ' + String(e).slice(0, 200)));
    if (light) await p.addInitScript(() => { try { localStorage.setItem('mfml-theme', 'light'); } catch (e) {} });
    await p.goto('file:///home/claude/mfml-site/site/unit-12.html'); await p.waitForTimeout(1500);
    if (wid) { await p.evaluate(id => document.getElementById(id).scrollIntoView({ block: 'start', behavior: 'instant' }), wid); await p.waitForTimeout(1800); }
    for (const a of acts) {
      if (typeof a === 'number') { await p.waitForTimeout(a); continue; }
      if (Array.isArray(a)) { await p.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('input')); }, a); continue; }
      await p.evaluate(sel => document.querySelector(sel).click(), a); await p.waitForTimeout(150);
    }
    await p.waitForTimeout(wait);
    if (wid) { const el = await p.$('#' + wid); await el.screenshot({ path: `${OUT}/${tag}-${name}.png` }); }
    else await p.screenshot({ path: `${OUT}/${tag}-${name}.png` });
    await p.close();
  }
  if (errs.length) console.log('ERRORS\n' + errs.join('\n'));
  await b.close();
})();
