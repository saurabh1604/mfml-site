const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  const setRange = (id, val) => page.evaluate(([id, val]) => {
    const s = document.getElementById(id); s.value = String(val); s.dispatchEvent(new Event('input'));
  }, [id, val]);
  async function svgDrag(sel, x0, y0, x1, y1) {
    await page.evaluate(([sel, x0, y0, x1, y1]) => {
      const svg = document.querySelector(sel);
      const r = svg.getBoundingClientRect();
      const ev = (type, x, y) => new PointerEvent(type, { clientX: r.left + x, clientY: r.top + y, pointerId: 7, bubbles: true });
      svg.dispatchEvent(ev('pointerdown', x0, y0));
      for (let i = 1; i <= 6; i++) svg.dispatchEvent(ev('pointermove', x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6));
      svg.dispatchEvent(ev('pointerup', x1, y1));
    }, [sel, x0, y0, x1, y1]);
  }

  await page.goto('file:///home/claude/mfml-site/site/unit-05.html');
  await page.waitForTimeout(900);
  console.log('katex:', await page.locator('.katex').count());

  // ---- w-proj
  console.log('proj both:', (await page.locator('#proj-verdict').textContent()).slice(0, 60));
  await page.locator('#proj-tabs [data-t="0"]').click(); await page.waitForTimeout(120);
  console.log('proj L1:', (await page.locator('#proj-verdict').textContent()).slice(0, 60));
  await page.locator('#proj-tabs [data-t="1"]').click(); await page.waitForTimeout(120);
  console.log('proj L2:', (await page.locator('#proj-verdict').textContent()).slice(0, 50));
  await page.locator('#proj-tabs [data-t="2"]').click(); await page.waitForTimeout(120);
  await page.locator('#w-proj').screenshot({ path: 'shots/u5-proj.png' });

  // ---- w-diag
  for (const s of ['1', '2', '3']) { await page.locator(`#dg-stages [data-s="${s}"]`).click(); await page.waitForTimeout(80); }
  console.log('diag chain:', (await page.locator('#dg-co').innerText()).replace(/\n/g, ' | '));
  await setRange('dg-k', 3); await page.waitForTimeout(120);
  console.log('diag k=3:', (await page.locator('#dg-pow').innerText()).replace(/\n/g, ' | '));
  console.log('diag verdict:', (await page.locator('#dg-verdict').textContent()).slice(0, 60));
  await page.locator('#w-diag').screenshot({ path: 'shots/u5-diag.png' });

  // ---- w-svd
  console.log('svd lec: σ1 =', await page.locator('#sv-s1').textContent(), 'σ2 =', await page.locator('#sv-s2').textContent(), 'cond =', await page.locator('#sv-cond').textContent());
  await page.locator('#sv-tabs [data-t="rot"]').click(); await page.waitForTimeout(120);
  console.log('svd rot: σ =', await page.locator('#sv-s1').textContent(), ',', await page.locator('#sv-s2').textContent(), '|', (await page.locator('#sv-eig').textContent()).slice(0, 50));
  await page.locator('#sv-tabs [data-t="shear"]').click(); await page.waitForTimeout(120);
  console.log('svd shear: σ =', await page.locator('#sv-s1').textContent(), ',', await page.locator('#sv-s2').textContent());
  await page.locator('#sv-tabs [data-t="sym"]').click(); await page.waitForTimeout(120);
  console.log('svd sym: σ =', await page.locator('#sv-s1').textContent(), ',', await page.locator('#sv-s2').textContent());
  await page.locator('#sv-tabs [data-t="lec"]').click(); await page.waitForTimeout(100);
  for (const s of ['0', '1', '2', '3']) { await page.locator(`#sv-stages [data-s="${s}"]`).click(); await page.waitForTimeout(600); }
  console.log('svd stage4:', (await page.locator('#sv-verdict').textContent()).slice(0, 70));
  await page.locator('#sv-play').click(); await page.waitForTimeout(3400);
  console.log('svd after play:', (await page.locator('#sv-verdict').textContent()).slice(0, 50));
  await page.locator('#w-svd').screenshot({ path: 'shots/u5-svd.png' });

  // ---- w-tall
  console.log('tall default:', (await page.locator('#tl-verdict').textContent()).slice(0, 60));
  const tb = await page.locator('#tl-in').boundingBox();
  await svgDrag('#tl-in', tb.width / 2 + 10, tb.height / 2 - 5, tb.width / 2 + tb.width * 0.3, tb.height / 2 - tb.width * 0.3);
  await page.waitForTimeout(150);
  console.log('tall @v1:', (await page.locator('#tl-verdict').textContent()).slice(0, 60));
  console.log('tall coords:', (await page.locator('#tl-co').innerText()).split('\n').pop());
  await page.locator('#w-tall').screenshot({ path: 'shots/u5-tall.png' });

  // ---- w-rank
  console.log('rank sigma k=3:', await page.locator('#rk-store').textContent(), 'err =', await page.locator('#rk-err').textContent(), '|', (await page.locator('#rk-verdict').textContent()).slice(0, 55));
  await setRange('rk-k', 16); await page.waitForTimeout(150);
  console.log('rank k=16: err =', await page.locator('#rk-err').textContent(), 'store =', await page.locator('#rk-store').textContent());
  await setRange('rk-k', 4); await page.waitForTimeout(100);
  await page.locator('#rk-tabs [data-t="grad"]').click(); await page.waitForTimeout(120);
  await setRange('rk-k', 2); await page.waitForTimeout(120);
  console.log('rank grad k=2:', (await page.locator('#rk-verdict').textContent()).slice(0, 60));
  await page.locator('#rk-tabs [data-t="noise"]').click(); await page.waitForTimeout(150);
  console.log('rank noise:', (await page.locator('#rk-verdict').textContent()).slice(0, 60));
  await page.locator('#rk-tabs [data-t="photo"]').click(); await page.waitForTimeout(200);
  await setRange('rk-k', 8); await page.waitForTimeout(200);
  console.log('rank photo k=8:', await page.locator('#rk-en').textContent(), '|', (await page.locator('#rk-verdict').textContent()).slice(0, 60));
  await page.locator('#rk-play').click(); await page.waitForTimeout(6300);
  console.log('rank after play: k =', await page.locator('#rk-ko').textContent(), 'en =', await page.locator('#rk-en').textContent());
  await setRange('rk-k', 8); await page.waitForTimeout(200);
  await page.locator('#w-rank').screenshot({ path: 'shots/u5-rank.png' });

  // ---- w-dials (new)
  await setRange('dl-d1', 2); await setRange('dl-d2', 0.6); await setRange('dl-k', 3); await page.waitForTimeout(120);
  console.log('dials k=3:', (await page.locator('#dl-read').innerText()).split('\n')[1]);
  await setRange('dl-d2', 0); await page.waitForTimeout(100);
  console.log('dials d2=0:', (await page.locator('#dl-verdict').textContent()).slice(0, 55));
  await setRange('dl-d2', 0.6); await setRange('dl-k', 1);

  // ---- w-hunt (new)
  for (const t of ['sym', 'lean', 'shear', 'rot']) {
    await page.locator(`#ht-tabs [data-t="${t}"]`).click(); await page.waitForTimeout(120);
    console.log('hunt', t + ':', (await page.locator('#ht-read').innerText()).split('\n')[0]);
  }
  await page.locator('#ht-tabs [data-t="sym"]').click();
  await page.locator('#ht-play').click(); await page.waitForTimeout(1500);
  await page.locator('#ht-play').click(); await page.waitForTimeout(150); // stop
  console.log('hunt sweep ran, verdict:', (await page.locator('#ht-verdict').textContent()).slice(0, 45));

  // ---- w-amp (new)
  console.log('amp lec: s1 =', await page.locator('#am-s1').textContent(), 's2 =', await page.locator('#am-s2').textContent(), 'k =', await page.locator('#am-k').textContent());
  await page.locator('#am-tabs [data-t="rot"]').click(); await page.waitForTimeout(120);
  console.log('amp rot:', (await page.locator('#am-verdict').textContent()).slice(0, 55));
  await page.locator('#am-tabs [data-t="near"]').click(); await page.waitForTimeout(120);
  console.log('amp near: k =', await page.locator('#am-k').textContent());
  await page.locator('#am-tabs [data-t="lec"]').click(); await page.waitForTimeout(100);
  await page.locator('#w-amp').screenshot({ path: 'shots/u5-amp.png' });

  // ---- checks + toc + dark
  await page.locator('[data-check="c1"] .opts button[data-correct]').click(); await page.waitForTimeout(100);
  console.log('check c1 → score:', await page.locator('#score').textContent());
  console.log('toc links:', await page.locator('#toc a').count());
  await page.locator('#theme-btn').click(); await page.locator('#theme-btn').click(); await page.waitForTimeout(250);
  console.log('theme:', await page.locator('#theme-btn').textContent());
  await page.locator('#w-rank').screenshot({ path: 'shots/u5-dark.png' });
  await page.locator('#theme-btn').click();

  console.log('----');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ZERO console/page errors ✓');
  await browser.close();
})();
