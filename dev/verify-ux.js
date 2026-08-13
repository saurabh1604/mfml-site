/* MFML-UX-V2 verification — navigation drawer, resume, bulk reveal, a11y, print, hub progress */
const { chromium } = require('playwright');
const SITE = 'file:///home/claude/mfml-site/site';
const UNITS = [1, 2, 3, 4, 5];
const EXPECT_CHECKS = { 1: 10, 2: 10, 3: 11, 4: 12, 5: 12 };
const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12 };

let bad = 0;
const fail = (where, msg) => { console.log(`  ❌ ${where}: ${msg}`); bad++; };

(async () => {
  const browser = await chromium.launch();

  /* ============================= UNIT PAGES ============================= */
  for (const u of UNITS) {
    const errs = [];
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 160)); });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
    const url = `${SITE}/unit-0${u}.html`;
    await page.goto(url);
    await page.waitForTimeout(700);
    const tag = `unit-0${u}`;
    console.log(`\n— ${tag} —`);

    /* 1 · no horizontal overflow at any realistic width */
    for (const w of [360, 390, 414, 768, 1024, 1280, 1440, 1680]) {
      await page.setViewportSize({ width: w, height: 860 });
      await page.waitForTimeout(160);
      const o = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
      if (o.s > o.c + 1) fail(tag, `horizontal overflow at ${w}px (${o.s} > ${o.c})`);
    }

    /* 2 · contents button: drawer widths only */
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(150);
    if (!(await page.locator('#toc-btn').isVisible())) fail(tag, 'contents button missing at 1280px');
    const railHidden = await page.evaluate(() => getComputedStyle(document.getElementById('toc')).transform);
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.waitForTimeout(150);
    if (await page.locator('#toc-btn').isVisible()) fail(tag, 'contents button still shown at 1500px (rail width)');
    if (!(await page.locator('#toc').isVisible())) fail(tag, 'toc rail not visible at 1500px');

    /* 3 · drawer opens, traps nothing, closes three ways */
    await page.setViewportSize({ width: 1024, height: 860 });
    await page.waitForTimeout(150);
    await page.locator('#toc-btn').click();
    await page.waitForTimeout(320);
    let open = await page.evaluate(() => document.getElementById('toc').classList.contains('open'));
    let backOn = await page.evaluate(() => document.getElementById('toc-backdrop').classList.contains('on'));
    let aria = await page.locator('#toc-btn').getAttribute('aria-expanded');
    if (!open || !backOn || aria !== 'true') fail(tag, `drawer did not open (open=${open} backdrop=${backOn} aria=${aria})`);
    const drawerBox = await page.locator('#toc').boundingBox();
    if (!drawerBox || drawerBox.x + drawerBox.width > 1030) fail(tag, 'drawer sits off-screen when open');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    if (await page.evaluate(() => document.getElementById('toc').classList.contains('open'))) fail(tag, 'Escape did not close drawer');
    await page.locator('#toc-btn').click(); await page.waitForTimeout(300);
    await page.locator('#toc-backdrop').click({ force: true }); await page.waitForTimeout(300);
    if (await page.evaluate(() => document.getElementById('toc').classList.contains('open'))) fail(tag, 'backdrop click did not close drawer');
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    if (bodyOverflow === 'hidden') fail(tag, 'body scroll left locked after close');

    /* 4 · TOC contents: every section + correct unit switcher */
    const secCount = await page.locator('section.unit').count();
    const tocLinks = await page.locator('#toc a').count();
    if (tocLinks !== secCount + (u === 1 || u === 5 ? 2 : 3)) {
      fail(tag, `toc links ${tocLinks} vs ${secCount} sections + switcher`);
    }
    const navText = (await page.locator('.toc-nav').textContent()).replace(/\s+/g, ' ').trim();
    const wantPrev = u > 1 ? `Unit ${u - 1}` : null, wantNext = u < 5 ? `Unit ${u + 1}` : null;
    if (wantPrev && !navText.includes(wantPrev)) fail(tag, `switcher missing prev "${wantPrev}" (got "${navText}")`);
    if (wantNext && !navText.includes(wantNext)) fail(tag, `switcher missing next "${wantNext}" (got "${navText}")`);
    if (!navText.includes('All units')) fail(tag, 'switcher missing hub link');
    if (u === 1 && navText.includes('Unit 0')) fail(tag, 'unit 1 offers a previous unit');
    if (u === 5 && navText.includes('Unit 6')) fail(tag, 'unit 5 offers a nonexistent unit 6');

    /* 5 · unit publishes its true check total, and the count is right */
    const stored = await page.evaluate(u => localStorage.getItem('mfml-u' + u + '-total'), u);
    const realChecks = await page.locator('.check').count();
    if (realChecks !== EXPECT_CHECKS[u]) fail(tag, `check count ${realChecks} ≠ expected ${EXPECT_CHECKS[u]}`);
    if (+stored !== realChecks) fail(tag, `mfml-u${u}-total = ${stored}, should be ${realChecks}`);

    /* 6 · scrolling records a position for this unit and for the hub */
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.45));
    await page.waitForTimeout(1100);
    const pos = await page.evaluate(u => localStorage.getItem('mfml-u' + u + '-pos'), u);
    const last = await page.evaluate(() => localStorage.getItem('mfml-last'));
    if (!pos) fail(tag, 'no reading position stored after scrolling');
    if (last !== `${u}|${pos}`) fail(tag, `mfml-last "${last}" does not match "${u}|${pos}"`);
    const posIsSection = await page.evaluate(id => !!document.getElementById(id)?.classList.contains('unit'), pos);
    if (!posIsSection) fail(tag, `stored position "${pos}" is not a section`);

    /* 7 · resume pill on the next visit — offers, never hijacks */
    await page.goto(url);
    await page.waitForTimeout(900);
    if (await page.evaluate(() => scrollY) > 5) fail(tag, 'page auto-jumped on load instead of offering');
    const pill = page.locator('.resume');
    if (!(await pill.isVisible())) fail(tag, 'resume pill did not appear');
    else {
      const label = (await pill.textContent()).replace(/\s+/g, ' ').trim();
      if (!/§\d+/.test(label)) fail(tag, `resume pill has no section number ("${label}")`);
      await pill.locator('.rgo').click();
      await page.waitForTimeout(900);
      const nowTop = await page.evaluate(id => Math.abs(document.getElementById(id).getBoundingClientRect().top), pos);
      if (nowTop > 120) fail(tag, `resume jump landed ${nowTop.toFixed(0)}px off target`);
      if (await pill.count() && await pill.isVisible()) fail(tag, 'resume pill stayed after use');
    }

    /* 8 · practice arena bulk reveal */
    await page.locator('#spractice').scrollIntoViewIfNeeded();
    const sols = await page.locator('#spractice details.sol').count();
    if (sols !== EXPECT_PROBS[u]) fail(tag, `solutions ${sols} ≠ ${EXPECT_PROBS[u]}`);
    if (await page.locator('#spractice details.sol[open]').count()) fail(tag, 'solutions open before asking');
    await page.locator('.sol-bulk button[data-a="open"]').click();
    await page.waitForTimeout(250);
    if (await page.locator('#spractice details.sol[open]').count() !== sols) fail(tag, 'Open all did not open every solution');
    await page.locator('.sol-bulk button[data-a="close"]').click();
    await page.waitForTimeout(250);
    if (await page.locator('#spractice details.sol[open]').count() !== 0) fail(tag, 'Close all did not close every solution');

    /* 9 · a11y: skip link, live regions, focus ring */
    const skipHref = await page.locator('a.skip').getAttribute('href');
    if (skipHref !== '#main-content') fail(tag, `skip link points at ${skipHref}`);
    if (!(await page.locator('#main-content').count())) fail(tag, 'skip target missing');
    const lives = await page.locator('.check .why[aria-live="polite"]').count();
    if (lives !== realChecks) fail(tag, `aria-live on ${lives}/${realChecks} explanations`);

    /* 10 · passing every check turns the score chip green */
    await page.evaluate(() => {
      document.querySelectorAll('.check').forEach(c => c.querySelector('.opts button[data-correct]').click());
    });
    await page.waitForTimeout(200);
    const chipDone = await page.evaluate(() => document.getElementById('score-chip').classList.contains('done'));
    const chipText = (await page.locator('#score-chip').textContent()).replace(/\s+/g, ' ').trim();
    if (!chipDone) fail(tag, `score chip not marked complete (${chipText})`);
    if (chipText !== `Checks ${realChecks}/${realChecks}`) fail(tag, `score chip reads "${chipText}"`);

    /* 11 · printing reveals every solution, then puts them back */
    await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
    await page.waitForTimeout(150);
    const openForPrint = await page.locator('details:not([open])').count();
    if (openForPrint) fail(tag, `${openForPrint} details still closed when printing`);
    await page.evaluate(() => dispatchEvent(new Event('afterprint')));
    await page.waitForTimeout(150);
    if (await page.locator('#spractice details.sol[open]').count()) fail(tag, 'details left open after printing');

    /* 12 · reduced motion respected */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const sb = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    if (sb !== 'auto') fail(tag, `scroll-behavior "${sb}" under prefers-reduced-motion`);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    if (errs.length) { errs.forEach(e => fail(tag, e)); }
    console.log(`  ${secCount} sections · ${realChecks} checks · ${sols} problems · toc ${tocLinks} links · ${errs.length} console errors`);
    await ctx.close();
  }

  /* ================================ HUB ================================ */
  console.log('\n— index (hub) —');
  {
    const errs = [];
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 160)); });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));

    /* fresh visitor: no progress furniture at all */
    await page.goto(`${SITE}/index.html`);
    await page.waitForTimeout(500);
    if (await page.locator('#progress-row.on').count()) fail('hub', 'progress row shown to a first-time visitor');
    if (await page.locator('.pline').count()) fail('hub', 'card progress bars shown with no progress');
    if (await page.locator('#reset-btn').isVisible()) fail('hub', 'reset offered with nothing to reset');

    /* card copy matches the real pages */
    const feet = await page.locator('a.card[data-unit] .foot span:not(.status)').allTextContents();
    const want = ['11 widgets · 10 checks · 10 problems', '6 widgets · 10 checks · 18 problems',
                  '8 widgets · 11 checks · 8 problems', '8 widgets · 12 checks · 5 problems',
                  '5 widgets · 12 checks · 12 problems'];
    feet.forEach((f, i) => { if (f.trim() !== want[i]) fail('hub', `card ${i + 1} reads "${f.trim()}", should be "${want[i]}"`); });

    /* returning student: partial on 3, complete on 1, last position in unit 3 */
    await page.evaluate(() => {
      localStorage.setItem('mfml-u1-total', '10');
      localStorage.setItem('mfml-u1-checks', 'c1,c2,c3,c4,c5,c6,c7,c8,c9,c10');
      localStorage.setItem('mfml-u3-total', '11');
      localStorage.setItem('mfml-u3-checks', 'c1,c2,c3,c4');
      localStorage.setItem('mfml-last', '3|s7');
    });
    await page.reload();
    await page.waitForTimeout(700);

    if (!(await page.locator('#progress-row.on').count())) fail('hub', 'progress row hidden for a returning student');
    const overall = (await page.locator('#overall-txt').textContent()).trim();
    if (overall !== '14 of 55 checks passed') fail('hub', `overall reads "${overall}", expected "14 of 55 checks passed"`);
    const barW = await page.evaluate(() => document.getElementById('obar-fill').style.width);
    if (barW !== '25.5%') fail('hub', `overall bar width ${barW}, expected 25.5%`);
    const cont = await page.locator('#continue-link');
    if (!(await cont.isVisible())) fail('hub', 'continue button hidden despite a stored position');
    if (await cont.getAttribute('href') !== 'unit-03.html#s7') fail('hub', `continue href = ${await cont.getAttribute('href')}`);
    if (!(await cont.textContent()).includes('Unit 3')) fail('hub', 'continue button does not name the unit');
    const nums = await page.locator('.cnum').allTextContents();
    if (nums.join(' | ') !== '10/10 checks | 4/11 checks') fail('hub', `card progress "${nums.join(' | ')}"`);
    const c1 = page.locator('a.card[data-unit="1"]');
    if (!(await c1.evaluate(e => e.classList.contains('complete')))) fail('hub', 'finished unit not marked complete');
    if ((await c1.locator('.status').textContent()).trim() !== '✓ Complete') fail('hub', 'finished unit still says Ready');

    /* continue actually lands on the right section */
    await cont.click();
    await page.waitForTimeout(1200);
    const landed = await page.evaluate(() => ({ file: location.pathname.split('/').pop(), hash: location.hash,
      top: Math.abs(document.getElementById('s7').getBoundingClientRect().top) }));
    if (landed.file !== 'unit-03.html' || landed.hash !== '#s7') fail('hub', `continue landed on ${landed.file}${landed.hash}`);
    if (landed.top > 120) fail('hub', `continue landed ${landed.top.toFixed(0)}px away from §7`);
    await page.goBack(); await page.waitForTimeout(600);

    /* reset needs two taps and then really clears (but keeps the theme) */
    await page.evaluate(() => localStorage.setItem('mfml-theme', 'dark'));
    await page.locator('#reset-btn').click();
    await page.waitForTimeout(150);
    if (!(await page.locator('#reset-btn.arm').count())) fail('hub', 'reset did not ask for confirmation');
    if (await page.evaluate(() => localStorage.getItem('mfml-u1-checks')) === null) fail('hub', 'first tap already erased progress');
    await page.locator('#reset-btn').click();
    await page.waitForTimeout(800);
    const left = await page.evaluate(() => Object.keys(localStorage).filter(k => /^mfml-/.test(k)).sort());
    if (left.join(',') !== 'mfml-theme') fail('hub', `after reset localStorage holds [${left}]`);

    /* no overflow on a phone */
    for (const w of [360, 390, 768]) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.waitForTimeout(160);
      const o = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
      if (o.s > o.c + 1) fail('hub', `horizontal overflow at ${w}px`);
    }
    if (errs.length) errs.forEach(e => fail('hub', e));
    console.log(`  ${(await page.locator('a.card[data-unit]').count())} live unit cards · ${errs.length} console errors`);
    await ctx.close();
  }

  await browser.close();
  console.log(bad ? `\n❌ ${bad} problem(s) found` : '\n✓ ALL UX CHECKS PASS');
  process.exit(bad ? 1 : 0);
})();
