/* Unit 11 cinema pass · agent C (W11–W15): drive every control, tab, preset, drag and ▶ on the c test page under WebGL,
   in both themes and at 1440/390, screenshot before / mid-story / after into shots-cinema/u11cin-c/, and check the quoted strings.
   usage: node shots-cinema-u11cin-c.js [dark|light] [1440|390]   (no args = all four combinations) */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots-cinema/u11cin-c/'; fs.mkdirSync(OUT, { recursive: true });
const THEMES = process.argv[2] && process.argv[2] !== 'all' ? [process.argv[2]] : ['dark', 'light'], WIDTHS = process.argv[3] ? [+process.argv[3]] : [1440, 390];
let bad = 0; const fail = m => { bad++; console.log('  ❌  ' + m); }, okay = m => console.log('  ok   ' + m);
const norm = s => s.replace(/\s+/g, ' ').replace(/[−–]/g, '-');
(async () => {
  for (const theme of THEMES) for (const width of WIDTHS) {
    const full = theme === 'dark' && width === 1440;         /* the full sequence with every shot; the other runs shoot before / mid / after per stage */
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-component-update', '--no-first-run', '--disable-sync', '--disable-default-apps'] });
    const page = await browser.newPage({ viewport: { width, height: width < 600 ? 860 : 900 } });
    const errors = [], warns = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); if (m.type() === 'warning') warns.push(m.text().slice(0, 300)); });
    page.on('pageerror', e => errors.push('PAGEERROR ' + String(e).slice(0, 400)));
    await page.goto('file:///home/claude/mfml-site/dev/site/_cin-c.html'); await page.waitForTimeout(1500);
    if (theme === 'light') { await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; }); await page.waitForTimeout(2500); }
    console.log(`\n=== ${theme} · ${width} ===`);
    const tag = theme[0] + width;
    const wait = ms => page.waitForTimeout(ms);
    const setRange = (id, v) => page.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = String(v); s.dispatchEvent(new Event('input')); }, [id, v]);
    const minmax = async id => { const [mn, mx] = await page.evaluate(id => { const s = document.getElementById(id); return [s.min, s.max]; }, id); await setRange(id, mn); await wait(350); await setRange(id, mx); await wait(350); };
    const text = async sel => norm(await page.locator(sel).innerText());
    const until = async (sel, re, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 9000)) { if (re.test(await text(sel))) return true; await wait(300); } return false; };
    const show = async sel => { await page.evaluate(sel => { const el = document.querySelector(sel); window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 16); }, sel); await wait(2600); };
    let wid = '';
    const shot = async name => { await page.locator('#' + wid).screenshot({ path: OUT + `${wid}-${tag}-${name}.png` }); };
    const drag = async (attr, k, dx, dy) => { const b = await page.locator('#' + wid + ' .stage3d').boundingBox(); let pins = JSON.parse(await page.getAttribute('#' + wid + ' .stage3d', attr)); if (!Array.isArray(pins[0])) pins = [pins]; const p = pins[k];
      if (!p || p[0] < 0 || p[0] > 1 || p[1] < 0 || p[1] > 1) { console.log('  (pin off-frame, drag skipped)', p); return; }
      await page.mouse.move(b.x + b.width * p[0], b.y + b.height * p[1]); await page.mouse.down();
      for (let i = 1; i <= 10; i++) { await page.mouse.move(b.x + b.width * (p[0] + dx * i / 10), b.y + b.height * (p[1] + dy * i / 10)); await wait(40); } await page.mouse.up(); await wait(400); };
    const stageOK = async () => page.evaluate(w => { const c = document.querySelector('#' + w + ' .stage3d canvas'); return !!c && c.width > 0; }, wid);

    /* ---------- W11 ---------- */
    wid = 'w-cases'; await show('#' + wid); if (!(await stageOK())) fail('W11 stage has no canvas'); await shot('a-before');
    await page.click('#cs-tree [data-b="b1"]'); await wait(1500); await until('#cs-verdict', /good|bad/); await wait(600); let t = (await text('#cs-work')) + ' ' + (await text('#cs-verdict'));
    if (/2\/3/.test(t) && /1\/3/.test(t) && /good/.test(t)) okay('W11 b1: 2/3, 1/3, good'); else fail('W11 b1: ' + t);
    if (full) await shot('b1');
    await page.click('#cs-tree [data-b="b2"]'); await wait(1200); await until('#cs-verdict', /good|bad/); await wait(600); t = (await text('#cs-work')) + ' ' + (await text('#cs-verdict'));
    if (/-2/.test(t) && /reject/i.test(t)) okay('W11 b2: −2, rejected'); else fail('W11 b2: ' + t);
    await page.click('#cs-tree [data-b="b3"]'); await wait(1200); await until('#cs-verdict', /good|bad/); await page.click('#cs-tree [data-b="b4"]'); await wait(1200); await until('#cs-verdict', /good|bad/); await wait(800); if (full) await shot('b4-all');
    await page.click('#cs-tabs [data-t="one"]'); await wait(1200); if (full) await shot('one');
    await page.click('#cs-tree [data-b="c1"]'); await wait(1200); await until('#cs-verdict', /good|bad/); await page.click('#cs-tree [data-b="c2"]'); await wait(1200); await until('#cs-verdict', /good|bad/); await until('#cs-check', /✓[^○]*✓[^○]*✓[^○]*✓[^○]*✓/, 6000); await wait(400);
    t = await text('#cs-check'); if ((t.match(/✓/g) || []).length === 5) okay('W11 one: five ticks'); else fail('W11 one checklist: ' + t);
    if (full) await shot('one-c2');
    await page.click('#cs-tabs [data-t="many"]'); await wait(1500); t = await text('#cs-work'); if (/m = 3 → 8/.test(t)) okay('W11 many: m = 3 → 8'); else fail('W11 many: ' + t);
    await shot('many'); await minmax('cs-m'); await wait(600); if (full) await shot('many-8'); await setRange('cs-m', 3);
    await page.click('#cs-tabs [data-t="two"]'); await wait(1200);
    await page.click('#cs-play'); await wait(1500); await shot('b-mid'); await wait(6000); await until('#cs-verdict', /rejected on the path/, 12000); await wait(1500); await shot('c-after');
    t = await text('#cs-verdict'); if (/rejected/.test(t)) okay('W11 ▶ ends on the last branch'); else fail('W11 ▶ end: ' + t);

    /* ---------- W12 ---------- */
    wid = 'w-bowl'; await show('#' + wid); if (!(await stageOK())) fail('W12 stage has no canvas'); await shot('a-before');
    t = (await text('#bw-read')) + ' ' + (await text('#bw-chip')); if (/convex|chord|≤|holds/i.test(t)) okay('W12 chord verdict'); else fail('W12 read: ' + t);
    for (const k of ['w', 'abs', 'exp', 'cube', 'sqrt', 'sq']) { await page.click('#bw-f [data-f="' + k + '"]'); await wait(900); if (full && (k === 'cube' || k === 'sqrt')) await shot('preset-' + k); }
    await minmax('bw-a'); await minmax('bw-b'); await minmax('bw-th'); await setRange('bw-a', .18); await setRange('bw-b', .86); await setRange('bw-th', .5); await wait(400);
    await page.click('#bw-play'); await wait(3500); await until('#bw-read', /failed at \d+ of 200/); t = await text('#bw-read'); if (/failed at 0 of 200/.test(t)) okay('W12 bowl sweep: 0 of 200'); else fail('W12 bowl sweep: ' + t);
    await page.click('#bw-f [data-f="w"]'); await wait(1000); await drag('data-pins', 1, -.1, .08); await drag('data-pins', 0, .06, -.05); if (full) await shot('wavy-drag');
    await page.click('#bw-play'); await wait(700); await shot('b-mid'); await wait(3000); await until('#bw-read', /failed at \d+ of 200 sampled/); await wait(500); await shot('c-after');
    t = await text('#bw-read'); if (/failed at 119 of 200/.test(t)) okay('W12 wavy sweep: 119 of 200'); else fail('W12 wavy sweep: ' + t);
    await page.click('#bw-tabs [data-t="tangent"]'); await wait(1300); await minmax('bw-a'); await setRange('bw-a', .5); await wait(600); await shot('tangent');
    t = await text('#bw-read'); if (/f\(y\) ≥ f\(x\)/.test(t) && /holds everywhere|fails/.test(t)) okay('W12 tangent readout'); else fail('W12 tangent: ' + t);
    await drag('data-pins', 0, .08, .05); if (full) { await page.click('#bw-play'); await wait(700); await shot('tangent-mid'); await wait(4200); }
    await page.click('#bw-tabs [data-t="sets"]'); await wait(1300);
    for (const k of ['poly', 'ring', 'moon', 'disc']) { await page.click('#bw-s [data-s="' + k + '"]'); await wait(900); if (full && k !== 'disc') await shot('set-' + k); }
    await page.click('#bw-s [data-s="ring"]'); await wait(900); await minmax('bw-a'); await minmax('bw-b'); await setRange('bw-a', .18); await setRange('bw-b', .86); await wait(400); await drag('data-pins', 1, -.1, .1);
    await page.click('#bw-play'); await wait(700); if (full) await shot('sets-mid'); await wait(3600); await shot('sets-after');
    await page.click('#bw-tabs [data-t="chord"]'); await wait(800); await page.click('#bw-f [data-f="sq"]'); await wait(600);

    /* ---------- W13 ---------- */
    wid = 'w-duel'; await show('#' + wid); if (!(await stageOK())) fail('W13 stage has no canvas'); await shot('a-before');
    await minmax('du-x'); await minmax('du-mu'); await setRange('du-x', 1); await setRange('du-mu', 4); await wait(600);
    t = await text('#du-read'); if (/2µ - µ²\/4/.test(t) && /p\* = 4 = d\*/.test(t)) okay('W13 two: 2µ − µ²/4, p* = 4 = d*'); else fail('W13 two: ' + t);
    await setRange('du-x', 3); await setRange('du-mu', 1); await wait(500); if (full) await shot('two-apart');
    await page.click('#du-play'); await wait(1100); await shot('b-mid'); await wait(4200); await shot('c-after');
    await page.click('#du-tabs [data-t="bundle"]'); await wait(1600); await minmax('du-xl'); await setRange('du-xl', 3); await wait(500); await shot('bundle');
    await page.click('#du-play'); await wait(1400); await shot('bundle-mid'); await wait(5600); await shot('bundle-after');
    await page.click('#du-tabs [data-t="gap"]'); await wait(1600); await page.click('#du-case [data-c="bands"]'); await wait(1200); if (full) await shot('gap-bands');
    await page.click('#du-case [data-c="wells"]'); await wait(1400); t = await text('#du-read'); if (/duality gap = 0\.3894/.test(t) && /p\* = 0\.3894/.test(t) && /d\* = 0\.0000/.test(t)) okay('W13 wells: p* 0.3894, d* 0.0000, gap 0.3894'); else fail('W13 wells: ' + t);
    await shot('gap-wells'); await page.click('#du-play'); await wait(1600); await shot('gap-mid'); await wait(4200); await shot('gap-after');
    if (full) { await page.click('#du-case [data-c="bands"]'); await wait(1200); await page.click('#du-play'); await wait(4800); await shot('gap-bands-after'); }
    await page.click('#du-tabs [data-t="two"]'); await wait(800);

    /* ---------- W14 ---------- */
    wid = 'w-price'; await show('#' + wid); if (!(await stageOK())) fail('W14 stage has no canvas'); await shot('a-before');
    await minmax('pr-c'); await page.click('#pr-p-near'); await wait(700); t = await text('#pr-read'); if (/9\.60/.test(t) && /9\.62/.test(t)) okay('W14 c = 2.9: 9.60 vs 9.62'); else fail('W14 near: ' + t);
    if (full) await shot('near');
    await page.click('#pr-p-free'); await wait(700); t = (await text('#pr-read')) + ' ' + (await text('#pr-verdict')); if (/µ\* = 0\.00/.test(t)) okay('W14 c = 2: µ* = 0.00'); else fail('W14 free: ' + t);
    await setRange('pr-c', 1.9).catch(() => {}); await wait(300); await shot('free');
    await page.click('#pr-p-base'); await wait(700); await page.click('#pr-play'); await wait(1300); await shot('b-mid'); await wait(5500); await until('#pr-read', /c = 3\.00/); await wait(800); await shot('c-after');
    t = await text('#pr-read'); if (/c = 3\.00/.test(t) && /p\* = 10\.00/.test(t)) okay('W14 ▶ returns to c = 3'); else fail('W14 after ▶: ' + t);

    /* ---------- W15 ---------- */
    wid = 'w-svm'; await show('#' + wid); if (!(await stageOK())) fail('W15 stage has no canvas'); await shot('a-before');
    await minmax('sv-w'); await setRange('sv-w', .6); await wait(600); if (full) await shot('w-violated'); await setRange('sv-w', 1); await wait(400);
    t = await text('#sv-read'); if (/margin = 2\.0000/.test(t)) okay('W15 margin = 2.0000'); else fail('W15 ans: ' + t);
    await page.click('#sv-play'); await wait(1100); await shot('b-mid'); await wait(6000); await shot('c-after');
    await page.click('#sv-tabs [data-t="dual"]'); await wait(1300); await minmax('sv-a'); await setRange('sv-a', .5); await wait(600);
    t = await text('#sv-read'); if (/0\.5/.test(t) && /w = 1|w\* = 1/.test(t)) okay('W15 dual α = 0.5 → w = 1'); else fail('W15 dual: ' + t);
    await shot('dual'); await page.click('#sv-play'); await wait(1300); if (full) await shot('dual-mid'); await wait(5200); if (full) await shot('dual-after');
    await page.click('#sv-tabs [data-t="add"]'); await wait(1300); await minmax('sv-x3'); await setRange('sv-x3', 3); await wait(600);
    t = await text('#sv-read'); if (/α₃ = 0\.0000/.test(t) && /margin = 2\.0000/.test(t)) okay('W15 add x₃ = 3: α₃ = 0.0000, margin = 2.0000'); else fail('W15 add: ' + t);
    await shot('add-3'); await drag('data-x3', 0, -.28, 0); t = await text('#sv-read'); if (/support vectors: 2 of 3/.test(t)) okay('W15 dragged x₃ = ' + (await text('#sv-x3-o'))); else fail('W15 drag: ' + t);
    await shot('add-drag'); await page.click('#sv-play'); await wait(1500); await shot('add-mid'); await wait(5500); await shot('add-after');

    /* ---------- console ---------- */
    const stageFail = warns.filter(w => /stage failed/i.test(w));
    if (!errors.length) okay('no console errors'); else errors.slice(0, 8).forEach(e => fail('console: ' + e));
    if (!stageFail.length) okay('no "stage failed" warnings'); else stageFail.forEach(w => fail(w));
    const other = warns.filter(w => !/stage failed|THREE\.Color|deprecated/i.test(w)); if (other.length) console.log('  (other warnings) ' + other.slice(0, 5).join(' | '));
    await browser.close();
  }
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\n✓ CINEMA C PASS');
  process.exit(bad ? 1 : 0);
})();
