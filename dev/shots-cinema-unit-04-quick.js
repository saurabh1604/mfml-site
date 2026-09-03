/* quick WebGL check: errors + a few close-ups at one width (arg: width, default 1440) */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/unit-04'; fs.mkdirSync(OUT, { recursive: true });
const W = +process.argv[2] || 1440, tag = 'w' + W, which = (process.argv[3] || 'hero,rowop,eig,e3,chol,spec').split(',');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  const pg = await b.newPage({ viewport:{ width:W, height:W < 500 ? 844 : 900 } });
  pg.on('pageerror', e => errs.push('PAGE ' + e.stack)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const shot = async (sel, path) => { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(1400); await pg.locator(sel).screenshot({ path }); };
  await pg.goto('file://' + __dirname + '/site/unit-04.html', { timeout: 90000 }); await pg.waitForTimeout(2000);
  if (which.includes('hero')) await pg.screenshot({ path:`${OUT}/${tag}-hero.png` });
  if (which.includes('rowop')) { await pg.locator('#rowop-presets [data-p="shear"]').click(); await shot('#fig-rowop', `${OUT}/${tag}-rowop-shear.png`); await pg.locator('#rowop-presets [data-p="swap"]').click(); await shot('#fig-rowop', `${OUT}/${tag}-rowop-swap.png`); }
  if (which.includes('eig')) { await pg.evaluate(() => document.getElementById('eig-svg').u4probe([1, 1])); await shot('#w-eig', `${OUT}/${tag}-eig-hot.png`); }
  if (which.includes('e3')) { await shot('#w-e3', `${OUT}/${tag}-e3-default.png`); }
  if (which.includes('chol')) { await shot('#w-chol', `${OUT}/${tag}-chol-lec.png`); }
  if (which.includes('spec')) { await shot('#w-spec', `${OUT}/${tag}-spec-0.png`); }
  if (which.includes('det')) { await shot('#w-det', `${OUT}/${tag}-det.png`); await shot('#w-char', `${OUT}/${tag}-char.png`); await shot('#w-rot', `${OUT}/${tag}-rot.png`); await shot('#w-cof', `${OUT}/${tag}-cof.png`); }
  if (which.includes('light')) { await pg.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await pg.waitForTimeout(2500); await pg.evaluate(() => scrollTo({top:0,behavior:'instant'})); await pg.waitForTimeout(1500); await pg.screenshot({ path:`${OUT}/${tag}-hero-light.png` }); await shot('#w-e3', `${OUT}/${tag}-e3-light.png`); await shot('#w-eig', `${OUT}/${tag}-eig-light.png`); }
  console.log('errors (' + errs.length + ')', errs.slice(0, 10)); await b.close();
})();
