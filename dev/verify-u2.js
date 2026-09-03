const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));

  await page.goto('file:///home/claude/mfml-site/site/unit-02.html');
  await page.waitForTimeout(900);
  console.log('katex:', await page.locator('.katex').count());

  // W1 groups
  await page.locator('#grp-presets .preset').nth(1).click(); await page.waitForTimeout(150);
  console.log('grp N0:', await page.locator('#grp-verdict').textContent());
  await page.locator('#grp-presets .preset').nth(5).click(); await page.waitForTimeout(200);
  await page.locator('#grp-clockcol .preset[data-c="9"]').click(); await page.waitForTimeout(450);
  await page.locator('#grp-clockcol .preset[data-c="5"]').click(); await page.waitForTimeout(450);
  console.log('clock 9+5:', await page.locator('#clock-read').textContent());
  await page.screenshot({ path: 'shots/v2-group.png', clip: await clip(page, '#w-group') });

  // W2 subspace
  await page.locator('#sub-presets [data-p="square"]').click(); await page.waitForTimeout(150);
  await page.locator('#w-sub .presets [data-op="2"]').click(); await page.waitForTimeout(750); // scale tween is 520ms
  console.log('square ×2:', await page.locator('#sub-verdict').textContent());
  await page.screenshot({ path: 'shots/v2-sub.png', clip: await clip(page, '#w-sub') });
  await page.locator('#sub-presets [data-p="x1"]').click();
  await page.locator('#w-sub .presets [data-op="0"]').click(); await page.waitForTimeout(750);
  console.log('x1 ×0:', await page.locator('#sub-verdict').textContent());
  await page.locator('#sub-presets [data-p="diag"]').click();
  await page.locator('#w-sub .presets [data-op="add"]').click(); await page.waitForTimeout(750);
  console.log('diag u+v:', await page.locator('#sub-verdict').textContent());

  // W3 span
  // round 8: presets glide the vectors into place over 700ms (the span re-shapes as they move) — read the verdict after the morph
  for (const p of ['one', 'coll', 'three', 'cop']) {
    await page.locator(`#span-presets [data-p="${p}"]`).click(); await page.waitForTimeout(1000);
    console.log('span', p, '→ k:', await page.locator('#span-k').textContent(), 'dim:', await page.locator('#span-dim').textContent(), '|', (await page.locator('#span-verdict').textContent()).slice(0, 62));
  }
  await page.locator('#span-presets [data-p="cop"]').click(); await page.waitForTimeout(1000);
  await page.screenshot({ path: 'shots/v2-span.png', clip: await clip(page, '#w-span') });
  const sb = await page.locator('#span-svg').boundingBox();
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
  await page.mouse.down(); await page.mouse.move(sb.x + sb.width / 2 + 70, sb.y + sb.height / 2 - 30, { steps: 4 }); await page.mouse.up();
  console.log('span orbit ok');

  // W4 detector
  for (const p of ['p1', 'p3', 'p4', 'p5']) {
    await page.locator(`#ind-presets [data-p="${p}"]`).click(); await page.waitForTimeout(200);
    console.log('ind', p, '→ rank:', await page.locator('#ind-rank').textContent(), '|', (await page.locator('#ind-verdict').textContent()).slice(0, 48), '|', (await page.locator('#ind-recipes').textContent()).slice(0, 110));
  }
  await page.locator('#ind-presets [data-p="p4"]').click(); await page.waitForTimeout(200);
  await page.screenshot({ path: 'shots/v2-ind.png', clip: await clip(page, '#w-ind') });

  // W5 mirror
  await page.locator('#rec-a').fill('2'); await page.locator('#rec-b').fill('1'); await page.waitForTimeout(200);
  console.log('mirror aligned:', (await page.locator('#rec-verdict').textContent()).slice(0, 60));
  await page.locator('#rec-a').fill('-1'); await page.locator('#rec-b').fill('1.5'); await page.waitForTimeout(150);
  await page.locator('#rec-third').click(); await page.waitForTimeout(200);
  console.log('mirror 3rd:', (await page.locator('#rec-verdict').textContent()).slice(0, 130));
  await page.screenshot({ path: 'shots/v2-mirror.png', clip: await clip(page, '#w-rec') });
  await page.locator('#rec-third').click();

  // W6 basis
  // round 8: the basis grid morphs over 750ms — read coordinates after the glide
  await page.locator('#bas-presets [data-p="skew"]').click(); await page.waitForTimeout(1000);
  console.log('basis skew coords:', (await page.locator('#bas-coords').textContent()).replace(/\s+/g, ' '));
  await page.locator('#bas-presets [data-p="dep"]').click(); await page.waitForTimeout(1000);
  console.log('basis dep:', await page.locator('#bas-verdict').textContent());
  await page.locator('#bas-presets [data-p="tri"]').click(); await page.waitForTimeout(1000);
  await page.screenshot({ path: 'shots/v2-basis.png', clip: await clip(page, '#w-basis') });

  // checks
  const c8 = page.locator('[data-check="c8"]');
  await c8.locator('.opts button').nth(1).click(); await page.waitForTimeout(120);
  console.log('c8:', await c8.locator('.why').getAttribute('class'), '| score:', await page.locator('#score-chip').textContent());

  // full page + dark
  await page.screenshot({ path: 'shots/v2-full.png', fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.locator('#w-span').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/v2-dark.png' });

  // hub link check
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('file:///home/claude/mfml-site/site/index.html'); await page.waitForTimeout(400);
  console.log('hub unit2 link:', await page.locator('a.card[href="unit-02.html"]').count());
  await page.screenshot({ path: 'shots/v2-hub.png', fullPage: true });

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
