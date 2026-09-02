const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  async function clip(page, sel) {
    const b = await page.locator(sel).boundingBox();
    return { x: Math.max(0, b.x - 6), y: Math.max(0, b.y - 6), width: Math.min(1300, b.width + 12), height: b.height + 12 };
  }
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

  await page.goto('file:///home/claude/mfml-site/site/unit-04.html');
  await page.waitForTimeout(900);
  console.log('katex:', await page.locator('.katex').count());

  // ---- w-det
  console.log('det default:', await page.locator('#det-val').textContent(), '|', (await page.locator('#det-verdict').textContent()).slice(0, 50));
  await page.locator('#det-presets [data-p="ones"]').click(); await page.waitForTimeout(600); // presets tween (420ms)
  console.log('det ones:', await page.locator('#det-val').textContent(), '|', (await page.locator('#det-verdict').textContent()).slice(0, 60));
  await page.locator('#det-presets [data-p="mirror"]').click(); await page.waitForTimeout(600);
  console.log('det mirror:', await page.locator('#det-val').textContent(), '|', (await page.locator('#det-verdict').textContent()).slice(0, 60));
  await page.locator('#det-presets [data-p="double"]').click(); await page.waitForTimeout(600);
  await page.locator('#w-det').screenshot({ path: 'shots/u4-det.png' });

  // ---- w-cof
  console.log('cof r1 sum:', await page.locator('#cof-sum').textContent());
  for (const t of ['r2', 'r3', 'c1', 'c2', 'c3']) {
    await page.locator(`#cof-tabs [data-t="${t}"]`).click(); await page.waitForTimeout(80);
    const sum = await page.locator('#cof-sum').textContent();
    if (sum.trim() !== '−1' && sum.trim() !== '-1') console.log('cof MISMATCH at', t, '→', sum);
  }
  console.log('cof c3 verdict:', await page.locator('#cof-verdict').textContent());
  await page.locator('#w-cof').screenshot({ path: 'shots/u4-cof.png' });

  // ---- w-eig : drive the probe to the 45° eigendirection of [[2,1],[1,2]]
  const eb = await page.locator('#eig-svg').boundingBox();
  const ew = eb.width, eh = eb.height;
  await svgDrag('#eig-svg', ew / 2 + 10, eh / 2 - 5, ew / 2 + ew * 0.14, eh / 2 - ew * 0.14);
  await page.waitForTimeout(150);
  console.log('eig @45°:', await page.locator('#eig-align').textContent(), 'λ =', await page.locator('#eig-lam').textContent(), '|', (await page.locator('#eig-verdict').textContent()).slice(0, 60));
  await page.locator('#w-eig').screenshot({ path: 'shots/u4-eig.png' });
  await page.locator('#eig-tabs [data-t="rot"]').click(); await page.waitForTimeout(150);
  console.log('eig rot:', (await page.locator('#eig-verdict').textContent()).slice(0, 90));
  await page.locator('#eig-tabs [data-t="data"]').click(); await page.waitForTimeout(100);
  // drive to (1,1) direction → λ=7
  await svgDrag('#eig-svg', ew / 2 + 10, eh / 2 - 5, ew / 2 + ew * 0.1, eh / 2 - ew * 0.1);
  await page.waitForTimeout(120);
  console.log('eig data @45°: λ =', await page.locator('#eig-lam').textContent());
  await page.locator('#eig-tabs [data-t="sym"]').click(); await page.waitForTimeout(100);

  // ---- w-char
  console.log('char default:', (await page.locator('#ch-verdict').textContent()).slice(0, 70), '| Σ', await page.locator('#ch-sum').textContent(), 'Π', await page.locator('#ch-prod').textContent());
  await page.locator('#ch-presets [data-p="rot"]').click(); await page.waitForTimeout(120);
  console.log('char rot90:', (await page.locator('#ch-verdict').textContent()).slice(0, 80));
  await page.locator('#ch-presets [data-p="shear"]').click(); await page.waitForTimeout(120);
  console.log('char shear:', (await page.locator('#ch-verdict').textContent()).slice(0, 80));
  await page.locator('#ch-presets [data-p="ones"]').click(); await page.waitForTimeout(120);
  console.log('char ones:', (await page.locator('#ch-verdict').textContent()).slice(0, 70));
  await page.locator('#ch-presets [data-p="data"]').click(); await page.waitForTimeout(120);
  await page.locator('#w-char').screenshot({ path: 'shots/u4-char.png' });

  // ---- w-spec
  for (const s of ['1', '2', '3']) { await page.locator(`#spec-stages [data-s="${s}"]`).click(); await page.waitForTimeout(90); }
  console.log('spec chain:', (await page.locator('#spec-co').innerText()).replace(/\n/g, ' | '));
  console.log('spec verdict:', await page.locator('#spec-verdict').textContent());
  await page.locator('#w-spec').screenshot({ path: 'shots/u4-spec.png' });

  // ---- w-e3
  await setRange('e3-l3', 0); await page.waitForTimeout(150);
  console.log('e3 λ3=0:', (await page.locator('#e3-verdict').textContent()).slice(0, 70), '| det =', await page.locator('#e3-det').textContent());
  await setRange('e3-l3', -1); await page.waitForTimeout(150);
  console.log('e3 λ3=−1:', (await page.locator('#e3-verdict').textContent()).slice(0, 70));
  await setRange('e3-l3', 0.6); await page.waitForTimeout(150);
  console.log('e3 default det:', await page.locator('#e3-det').textContent());
  await page.locator('#w-e3').screenshot({ path: 'shots/u4-e3.png' });

  // ---- w-rot
  await setRange('rot-th', 90); await page.waitForTimeout(120);
  console.log('rot 90°: λ =', await page.locator('#rot-lam').textContent(), '| tr coeff =', await page.locator('#rot-tr').textContent());
  await setRange('rot-th', 0); await page.waitForTimeout(120);
  console.log('rot 0°:', (await page.locator('#rot-verdict').textContent()).slice(0, 60));
  await setRange('rot-th', 35); await page.waitForTimeout(120);

  // ---- w-chol
  console.log('chol lec L:', await page.locator('#chl-l').textContent(), '|', (await page.locator('#chl-verdict').textContent()).slice(0, 60));
  await page.locator('#chl-presets [data-p="broken"]').click(); await page.waitForTimeout(150);
  console.log('chol broken:', (await page.locator('#chl-verdict').textContent()).slice(0, 90));
  await page.locator('#chl-presets [data-p="lec"]').click(); await page.waitForTimeout(120);
  await page.locator('#chl-mode [data-m="z"]').click(); await page.waitForTimeout(120);
  console.log('chol z-mode:', (await page.locator('#chl-verdict').textContent()).slice(0, 60));
  await page.locator('#chl-mode [data-m="x"]').click(); await page.waitForTimeout(120);
  await page.locator('#w-chol').screenshot({ path: 'shots/u4-chol.png' });

  // ---- checks wiring: answer c1 correctly
  await page.locator('[data-check="c1"] .opts button[data-correct]').click(); await page.waitForTimeout(100);
  console.log('check c1:', (await page.locator('[data-check="c1"] .why').textContent()).slice(0, 40), '| score:', await page.locator('#score').textContent());

  // ---- toc + dark mode
  console.log('toc links:', await page.locator('#toc a').count());
  await page.locator('#theme-btn').click(); await page.locator('#theme-btn').click(); await page.waitForTimeout(250);
  console.log('theme now:', await page.locator('#theme-btn').textContent());
  await page.locator('#w-spec').screenshot({ path: 'shots/u4-dark.png' });
  await page.locator('#theme-btn').click(); await page.waitForTimeout(150);

  await page.screenshot({ path: 'shots/u4-full.png', fullPage: false });
  console.log('----');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ZERO console/page errors ✓');
  await browser.close();
})();
