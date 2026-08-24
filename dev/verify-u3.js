const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));

  await page.goto('file:///home/claude/mfml-site/site/unit-03.html');
  await page.waitForTimeout(900);
  console.log('katex:', await page.locator('.katex').count());

  // dot product / agreement meter
  console.log('dot default:', await page.locator('#dot-sum').textContent(), '|', (await page.locator('#dot-verdict').textContent()).slice(0,50));
  await page.locator('#dot-presets [data-p="twin"]').click(); await page.waitForTimeout(120);
  console.log('dot twin:', await page.locator('#dot-sum').textContent(), 'cos =', await page.locator('#dot-cos').textContent());
  await page.locator('#dot-presets [data-p="opp"]').click(); await page.waitForTimeout(120);
  console.log('dot opp:', await page.locator('#dot-sum').textContent(), 'cos =', await page.locator('#dot-cos').textContent());
  await page.locator('#dot-presets [data-p="perp"]').click(); await page.waitForTimeout(120);
  console.log('dot perp:', await page.locator('#dot-sum').textContent(), '|', (await page.locator('#dot-verdict').textContent()).slice(0,70));
  await page.locator('#w-dot').screenshot({ path: 'shots/u3-dot.png' });
  await page.locator('#dot-presets [data-p="mix"]').click(); await page.waitForTimeout(100);

  // norms
  await page.locator('#norm-x').fill('3'); await page.locator('#norm-y').fill('0'); await page.waitForTimeout(150);
  console.log('norm axis:', await page.locator('#norm-verdict').textContent());
  await page.locator('#norm-y').fill('4'); await page.waitForTimeout(150);
  console.log('norm 3,4 → l2:', await page.locator('#norm-l2').textContent(), 'l1:', await page.locator('#norm-l1').textContent());

  // engine lens
  await page.locator('#eng-presets [data-p="c21"]').click(); await page.waitForTimeout(200);
  console.log('eng diag(2,1):', (await page.locator('#eng-verdict').textContent()).slice(0, 70), '|', (await page.locator('#eng-xy').textContent()).replace(/\s+/g, ' '));
  await page.locator('#eng-presets [data-p="broken"]').click(); await page.waitForTimeout(200);
  console.log('eng broken:', (await page.locator('#eng-verdict').textContent()).slice(0, 80));
  await page.screenshot({ path: 'shots/u3-eng.png', clip: await clip(page, '#w-eng') });
  await page.locator('#eng-presets [data-p="c41"]').click(); await page.waitForTimeout(150);

  // similarity dial
  await page.locator('#ang-presets [data-p="slide"]').click(); await page.waitForTimeout(200);
  console.log('ang slide pair: ip =', await page.locator('#ang-ip').textContent(), 'ω =', await page.locator('#ang-om').textContent());
  await page.screenshot({ path: 'shots/u3-ang.png', clip: await clip(page, '#w-ang') });

  // high-dim
  await page.evaluate(() => { const s = document.getElementById('hd-n'); s.value = '3'; s.dispatchEvent(new Event('input')); });
  await page.waitForTimeout(600);
  console.log('hd n=1000: mean|cos| =', await page.locator('#hd-mean').textContent(), '|', (await page.locator('#hd-verdict').textContent()).slice(0, 60));
  await page.screenshot({ path: 'shots/u3-hd.png', clip: await clip(page, '#w-hd') });

  // rigid motions
  console.log('rig rot:', await page.locator('#rig-ata').textContent(), '|', (await page.locator('#rig-verdict').textContent()).slice(0, 50));
  await page.locator('#rig-tabs [data-t="shear"]').click(); await page.waitForTimeout(200);
  console.log('rig shear:', await page.locator('#rig-ata').textContent(), '|', (await page.locator('#rig-l1').textContent()).replace(/\s+/g, ' '));

  // shadow
  await page.locator('#sh-ta').fill('160'); await page.waitForTimeout(150);
  console.log('shadow α(160°):', await page.locator('#sh-al').textContent(), '| perp:', await page.locator('#sh-perp').textContent());
  await page.screenshot({ path: 'shots/u3-sh.png', clip: await clip(page, '#w-sh') });

  // gram-schmidt stepper
  for (let i = 0; i < 4; i++) await page.locator('#gs-next').click();
  await page.waitForTimeout(250);
  console.log('gs step:', await page.locator('#gs-step').textContent(), '|', (await page.locator('#gs-verdict').textContent()).slice(0, 50));
  await page.screenshot({ path: 'shots/u3-gs.png', clip: await clip(page, '#w-gs') });
  const gb = await page.locator('#gs-svg').boundingBox();
  await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await page.mouse.down(); await page.mouse.move(gb.x + gb.width / 2 + 60, gb.y + gb.height / 2 - 30, { steps: 4 }); await page.mouse.up();
  console.log('gs orbit ok');

  // checks
  const c6 = page.locator('[data-check="c6"]');
  await c6.locator('.opts button').nth(1).click(); await page.waitForTimeout(120);
  console.log('c6:', await c6.locator('.why').getAttribute('class'), '| score:', await page.locator('#score-chip').textContent());
  console.log('toc links:', await page.locator('#toc a').count());

  await page.screenshot({ path: 'shots/u3-full.png', fullPage: true });
  console.log('\nERRORS (' + errors.length + '):'); errors.slice(0, 10).forEach(e => console.log(' ', e));
  await browser.close();

  async function clip(pg, sel) {
    await pg.locator(sel).scrollIntoViewIfNeeded();
    await pg.waitForTimeout(150);
    const b2 = await pg.locator(sel).boundingBox();
    const vs = pg.viewportSize();
    const x = Math.min(Math.max(0, b2.x - 4), vs.width - 20), y = Math.min(Math.max(0, b2.y - 4), vs.height - 20);
    return { x, y, width: Math.max(20, Math.min(vs.width - x, b2.width + 8)), height: Math.max(20, Math.min(vs.height - y, b2.height + 8)) };
  }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
// (appended) — dot-product widget tests run in a second pass
