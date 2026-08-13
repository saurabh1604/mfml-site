const { chromium } = require('playwright');
const UNITS = [['01',10,15],['02',18,14],['03',8,14],['04',5,13],['05',12,13]];
(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const [u, nprob, secnum] of UNITS) {
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });
    page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 160)); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));
    await page.goto(`file:///home/claude/mfml-site/site/unit-${u}.html`);
    await page.waitForTimeout(800);

    const probs = await page.locator('#spractice .prob').count();
    const sols = await page.locator('#spractice details.sol').count();
    const anss = await page.locator('#spractice .pans').count();
    const katexErr = await page.locator('.katex-error').count();
    const secLabel = await page.locator('#spractice .sec-num').textContent();
    // solutions must start closed
    const openAtLoad = await page.locator('#spractice details.sol[open]').count();
    // open the first one and confirm content becomes visible
    await page.locator('#spractice details.sol').first().click();
    await page.waitForTimeout(150);
    const firstStepVisible = await page.locator('#spractice details.sol .pstep').first().isVisible();
    // practice section must be the LAST section, and next-card inside it
    const lastSecId = await page.locator('section.unit').last().getAttribute('id');
    const nextCardInPractice = await page.locator('#spractice .next-card').count();
    // TOC picked it up
    const tocLast = (await page.locator('#toc a').last().textContent()) || '';
    // no id collisions introduced
    const dupIds = await page.evaluate(() => {
      const seen = {}, dups = [];
      document.querySelectorAll('[id]').forEach(e => { if (seen[e.id]) dups.push(e.id); seen[e.id] = 1; });
      return dups;
    });
    // widgets still alive (spot-check: every widget svg has children)
    const emptySvgs = await page.evaluate(() =>
      [...document.querySelectorAll('.widget svg')].filter(s => s.children.length === 0 && s.checkVisibility()).length);

    const fails = [];
    if (probs !== nprob) fails.push(`problems ${probs}≠${nprob}`);
    if (sols !== nprob || anss !== nprob) fails.push(`sols ${sols}/ans ${anss}`);
    if (katexErr) fails.push(`katex-error ×${katexErr}`);
    if (secLabel.trim() !== String(secnum)) fails.push(`sec-num ${secLabel}≠${secnum}`);
    if (openAtLoad) fails.push(`${openAtLoad} solutions open at load`);
    if (!firstStepVisible) fails.push('solution did not reveal on click');
    if (lastSecId !== 'spractice') fails.push(`last section is ${lastSecId}`);
    if (nextCardInPractice !== 1) fails.push('next-card not inside practice');
    if (dupIds.length) fails.push('dup ids: ' + dupIds.join(','));
    if (emptySvgs) fails.push(`${emptySvgs} empty widget svgs`);
    if (errors.length) fails.push(...errors);

    console.log(`unit-${u}: ${probs} problems · §${secLabel} · toc "${tocLast.slice(0, 24)}" · ${fails.length ? '❌ ' + fails.join(' | ') : '✓ all checks pass'}`);
    if (fails.length) bad++;
    if (u === '01') await page.locator('#spractice .prob').first().screenshot({ path: 'shots/practice-card.png' });
    if (u === '04') {
      await page.locator('#spractice details.sol').first().click();
      await page.waitForTimeout(200);
      await page.locator('#spractice .prob').first().screenshot({ path: 'shots/practice-open.png' });
      await page.locator('#theme-btn').click(); await page.locator('#theme-btn').click(); await page.waitForTimeout(250);
      await page.locator('#spractice .prob').first().screenshot({ path: 'shots/practice-dark.png' });
    }
    await page.close();
  }
  console.log(bad ? `\n${bad} unit(s) with problems` : '\nALL 5 UNITS PASS ✓');
  await browser.close();
})();
