const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));

  // ---------- hub ----------
  await page.goto('file:///home/claude/mfml-site/site/index.html');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'shots/hub.png', fullPage: true });

  // ---------- unit 1 ----------
  await page.goto('file:///home/claude/mfml-site/site/unit-01.html');
  await page.waitForTimeout(2500); // KaTeX CDN
  const katexCount = await page.locator('.katex').count();
  console.log('katex rendered elements:', katexCount);

  // full-page shot
  await page.screenshot({ path: 'shots/u1-full.png', fullPage: true });

  // hero + zoom widget
  await page.locator('#w-zoom').scrollIntoViewIfNeeded();
  await page.locator('#zoom-r').fill('1');
  await page.waitForTimeout(300);
  console.log('zoom verdict:', await page.locator('#zoom-verdict').textContent());
  await page.screenshot({ path: 'shots/u1-zoom.png', clip: await clip(page, '#w-zoom') });

  // mixer: click to solution (2,3,1)
  const plus = k => page.locator(`#w-mixer .stepper button[data-k="${k}"][data-d="1"]`);
  for (let i = 0; i < 2; i++) await plus(0).click();
  for (let i = 0; i < 3; i++) await plus(1).click();
  await plus(2).click();
  await page.waitForTimeout(250);
  console.log('mixer verdict:', await page.locator('#mix-verdict').textContent());
  await page.screenshot({ path: 'shots/u1-mixer.png', clip: await clip(page, '#w-mixer') });

  // lines: presets
  for (const p of ['none', 'inf', 'one']) {
    await page.locator(`#lines-presets [data-p="${p}"]`).click();
    await page.waitForTimeout(150);
    console.log('lines', p, '→', await page.locator('#lines-verdict').textContent());
  }
  await page.screenshot({ path: 'shots/u1-lines.png', clip: await clip(page, '#w-lines') });

  // mult widget hover
  await page.locator('#mxC span[data-i="1"][data-j="0"]').hover();
  await page.waitForTimeout(150);
  console.log('mult read:', (await page.locator('#mult-read').textContent()).trim());

  // windows: cols tab → set solution
  await page.locator('#win-tabs [data-t="cols"]').click();
  await page.locator('#cols-x1').fill('2');
  await page.locator('#cols-x2').fill('1');
  await page.waitForTimeout(200);
  console.log('cols verdict:', await page.locator('#cols-verdict').textContent());
  await page.screenshot({ path: 'shots/u1-windows-cols.png', clip: await clip(page, '#w-windows') });
  await page.locator('#win-tabs [data-t="machine"]').click();
  await page.locator('#mach-t').fill('1');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shots/u1-windows-machine.png', clip: await clip(page, '#w-windows') });

  // space machine: squash preset
  await page.locator('#mach-presets [data-p="squash"]').click();
  await page.waitForTimeout(700);
  console.log('machine det:', await page.locator('#det-val').textContent(), '| verdict:', await page.locator('#mach-verdict').textContent(), '| undo disabled:', await page.locator('#undo-btn').isDisabled());
  await page.screenshot({ path: 'shots/u1-machine-squash.png', clip: await clip(page, '#w-machine') });
  await page.locator('#mach-presets [data-p="rot"]').click();
  await page.waitForTimeout(700);
  console.log('machine rot det:', await page.locator('#det-val').textContent());

  // elimination: full example, step to end
  await page.locator('#elim-tabs [data-t="full"]').click();
  for (let i = 0; i < 4; i++) await page.locator('#elim-next').click();
  await page.waitForTimeout(200);
  console.log('elim step:', await page.locator('#elim-step').textContent(), '/', await page.locator('#elim-total').textContent());
  console.log('a=0 verdict:', (await page.locator('#a-verdict').textContent()).trim());
  await page.locator('#a-slider').fill('-1');
  await page.waitForTimeout(150);
  console.log('a=-1 verdict:', (await page.locator('#a-verdict').textContent()).trim());
  console.log('solution shown:', await page.locator('#elim-solution').isVisible());
  await page.screenshot({ path: 'shots/u1-elim.png', clip: await clip(page, '#w-elim') });

  // NEW: matrix editor typed entry on space machine
  await page.locator('#mcell-0').fill('8');
  await page.waitForTimeout(200);
  console.log('machine typed a11=8 → det:', await page.locator('#det-val').textContent());
  // NEW: det3d widget
  await page.locator('#det3-presets [data-p="shear"]').click(); await page.waitForTimeout(600);
  console.log('det3 shear → det:', await page.locator('#det3-val').textContent(), 'rank:', await page.locator('#det3-rank').textContent());
  await page.locator('#det3-presets [data-p="flat"]').click(); await page.waitForTimeout(600);
  console.log('det3 flat → det:', await page.locator('#det3-val').textContent(), 'rank:', await page.locator('#det3-rank').textContent(), '|', (await page.locator('#det3-verdict').textContent()).slice(0,60));
  await page.screenshot({ path: 'shots/u2-det3d.png', clip: await clip(page, '#w-det3') });
  await page.locator('#det3-presets [data-p="line"]').click(); await page.waitForTimeout(600);
  console.log('det3 line → rank:', await page.locator('#det3-rank').textContent());
  // drag orbit
  const box3 = await page.locator('#det3-svg').boundingBox();
  await page.mouse.move(box3.x + box3.width / 2, box3.y + box3.height / 2);
  await page.mouse.down(); await page.mouse.move(box3.x + box3.width / 2 + 80, box3.y + box3.height / 2 - 40, { steps: 5 }); await page.mouse.up();
  console.log('det3 drag-orbit ok');
  // NEW: fragility widget
  await page.locator('#frag-eps').fill('1'); await page.locator('#frag-d').fill('0.02'); await page.waitForTimeout(250);
  console.log('frag ε=0.001 δ=0.02 → amp:', await page.locator('#frag-amp').textContent(), '|', (await page.locator('#frag-verdict').textContent()).slice(0,70));
  await page.screenshot({ path: 'shots/u2-frag.png', clip: await clip(page, '#w-frag') });
  // NEW: three planes widget
  for (const t of ['unique', 'inf', 'none']) {
    await page.locator(`#pl3-tabs [data-t="${t}"]`).click(); await page.waitForTimeout(250);
    console.log('pl3', t, '→ rA:', await page.locator('#pl3-ra').textContent(), 'rAb:', await page.locator('#pl3-rab').textContent(), '|', (await page.locator('#pl3-verdict').textContent()).slice(0, 60));
  }
  await page.locator('#pl3-tabs [data-t="inf"]').click(); await page.waitForTimeout(250);
  await page.screenshot({ path: 'shots/u2-pl3-inf.png', clip: await clip(page, '#w-pl3') });
  await page.locator('#pl3-tabs [data-t="none"]').click(); await page.waitForTimeout(250);
  await page.screenshot({ path: 'shots/u2-pl3-none.png', clip: await clip(page, '#w-pl3') });
  // NEW: null-space blind-spot widget
  await page.locator('#null-l').fill('1.6');
  await page.waitForTimeout(250);
  console.log('null alg:', (await page.locator('#null-alg').textContent()).trim());
  console.log('null verdict:', await page.locator('#null-verdict').textContent());
  await page.locator('#null-l').fill('0');
  await page.waitForTimeout(150);
  console.log('null λ=0 verdict:', await page.locator('#null-verdict').textContent());
  await page.locator('#null-l').fill('-1.2');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shots/u3-null.png', clip: await clip(page, '#w-null') });
  const c10 = page.locator('[data-check="c10"]');
  await c10.locator('.opts button').nth(1).click();
  await page.waitForTimeout(120);
  console.log('c10 feedback:', await c10.locator('.why').getAttribute('class'));

  // c9 check
  const c9 = page.locator('[data-check="c9"]');
  await c9.locator('.opts button').nth(2).click(); await page.waitForTimeout(120);
  console.log('c9 correct feedback:', await c9.locator('.why').getAttribute('class'));

  // checks: wrong then right on c2
  const c2 = page.locator('[data-check="c2"]');
  await c2.locator('.opts button').nth(0).click();
  await page.waitForTimeout(120);
  console.log('c2 wrong feedback class:', await c2.locator('.why').getAttribute('class'));
  await c2.locator('.opts button').nth(1).click();
  await page.waitForTimeout(120);
  console.log('c2 right feedback class:', await c2.locator('.why').getAttribute('class'));
  console.log('score chip:', await page.locator('#score-chip').textContent());
  await page.screenshot({ path: 'shots/u1-check.png', clip: await clip(page, '[data-check="c2"]') });

  // dark mode
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(400);
  await page.locator('#s6').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'shots/u1-dark.png', fullPage: false });
  await page.emulateMedia({ colorScheme: 'light' });

  console.log('\nERRORS (' + errors.length + '):'); errors.slice(0, 12).forEach(e => console.log(' ', e));
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
