/* Screenshots of the Unit 16 word2vec widgets (w-window, w-cbow, w-skipgram, w-lab), every Try-line state.
   node shots-u16-w2v.js [harness|page] [width=1440] [theme=dark] [filter]
     harness: dev/w2v-harness.html over http (starts `python3 -m http.server` on W2V_PORT=8791 in /home/claude/mfml-site if needed)
     page:    the built dev/site/unit-16.html (file://)
   → shots/u16-w2v/<width>-<theme>-<state>-<k>.png (viewport-sized chunks of the widget). Prints console errors.
   WebGL flags as the site's other shot scripts use them. `filter` = a substring of the state names to shoot only some. */
const { chromium } = require('playwright');
const fs = require('fs'), http = require('http'), { spawn } = require('child_process');
const SRC = process.argv[2] || 'harness', W = +(process.argv[3] || 1440), THEME = process.argv[4] || 'dark', ONLY = process.argv[5] || '';
const PORT = +(process.env.W2V_PORT || 8791), OUT = __dirname + '/shots/u16-w2v/'; fs.mkdirSync(OUT, { recursive: true });
const STATES = [
  ['window-rest', 'w-window', 'U16W2V.window.render()'],
  ['window-stop3-cbow', 'w-window', "document.getElementById('w2w-step').click(); document.getElementById('w2w-step').click(); document.getElementById('w2w-step').click()"],
  ['window-skipgram', 'w-window', "document.querySelector('#w2w-mode button[data-v=sg]').click()"],
  ['window-C4-10words', 'w-window', "document.querySelector('#w2w-sents button[data-v=\"2\"]').click(); const r=document.getElementById('w2w-c'); r.value=4; r.dispatchEvent(new Event('input')); document.querySelector('#w2w-mode button[data-v=sg]').click()"],
  ['cbow-m0', 'w-cbow', 'U16W2V.cbow.reset()'], ['cbow-m2', 'w-cbow', 'U16W2V.cbow.go(2)'], ['cbow-m4', 'w-cbow', 'U16W2V.cbow.go(4)'], ['cbow-m5', 'w-cbow', 'U16W2V.cbow.go(5)'],
  ['cbow-m6', 'w-cbow', 'U16W2V.cbow.go(6)'], ['cbow-m7', 'w-cbow', 'U16W2V.cbow.go(7)'], ['cbow-round5', 'w-cbow', 'U16W2V.cbow.go(7); for(let i=0;i<4;i++) U16W2V.cbow.another()'],
  ['cbow-window2-m6', 'w-cbow', 'U16W2V.cbow.setWin2(true); U16W2V.cbow.go(6)'],
  ['sg-m0', 'w-skipgram', 'U16W2V.skipgram.reset()'], ['sg-m3', 'w-skipgram', 'U16W2V.skipgram.go(3)'], ['sg-m4', 'w-skipgram', 'U16W2V.skipgram.go(4)'], ['sg-m5', 'w-skipgram', 'U16W2V.skipgram.go(5)'],
  ['sg-m6', 'w-skipgram', 'U16W2V.skipgram.go(6)'], ['sg-m7', 'w-skipgram', 'U16W2V.skipgram.go(7)'],
  ['lab-start', 'w-lab', 'U16W2V.lab.redraw()'], ['lab-pass5', 'w-lab', 'U16W2V.lab.runPasses(5)'], ['lab-pass10', 'w-lab', 'U16W2V.lab.runPasses(10)'], ['lab-end', 'w-lab', 'U16W2V.lab.finish()'],
  ['lab-end-googly', 'w-lab', "U16W2V.lab.finish(); document.querySelector('#w2l-rare button[data-v=googly]').click()"],
  ['lab-slow', 'w-lab', "document.getElementById('w2l-slow').click(); U16W2V.lab.runPasses(3); for(let i=0;i<4;i++) document.getElementById('w2l-step').click()"],
  ['lab-sub-end', 'w-lab', "document.getElementById('w2l-sub').click(); U16W2V.lab.finish()"],
];
function up(url) { return new Promise(res => { const r = http.get(url, x => { x.resume(); res(x.statusCode === 200); }); r.on('error', () => res(false)); r.setTimeout(1500, () => { r.destroy(); res(false); }); }); }
(async () => {
  let server = null; const HURL = `http://127.0.0.1:${PORT}/dev/w2v-harness.html`;
  if (SRC === 'harness' && !(await up(HURL))) { server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: '/home/claude/mfml-site', stdio: 'ignore' }); for (let i = 0; i < 40 && !(await up(HURL)); i++) await new Promise(r => setTimeout(r, 150)); }
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const VH = W < 600 ? 844 : 900, errs = []; let n = 0;
  for (const [name, id, js] of STATES) { if (ONLY && !name.includes(ONLY)) continue;
    const page = await browser.newPage({ viewport: { width: W, height: VH }, deviceScaleFactor: 1 });
    page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/favicon|Failed to load resource|GPU stall|WebGL|GL_/.test(m.text())) errs.push(name + ' ' + m.type() + ': ' + m.text().slice(0, 240)); });
    page.on('pageerror', e => errs.push(name + ' PAGEERROR: ' + String(e).slice(0, 300)));
    await page.addInitScript(t => { try { localStorage.setItem('mfml-theme', t); } catch (e) {} }, THEME);
    await page.goto(SRC === 'page' ? 'file:///home/claude/mfml-site/dev/site/unit-16.html' : HURL + '?theme=' + THEME);
    await page.waitForFunction(() => window.U16W2V && window.U16W2V.lab, null, { timeout: 30000 });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} .hbar{display:none!important}' });
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), THEME);
    await page.evaluate(() => document.querySelectorAll('#w-window,#w-cbow,#w-skipgram,#w-lab').forEach(x => x.classList.add('in')));
    await page.waitForTimeout(300);
    await page.evaluate(js); await page.waitForTimeout(400);
    const loc = page.locator('#' + id); await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    const bb = await loc.boundingBox(), top = bb.y + await page.evaluate(() => scrollY), CH = VH - 40; let k = 0;
    for (let y = top - 12; y < top + bb.height - 20; y += CH) { await page.evaluate(v => window.scrollTo(0, v), Math.max(0, y)); await page.waitForTimeout(350);
      await page.screenshot({ path: `${OUT}${W}-${THEME}-${name}-${k}.png` }); k++; n++; }
    await page.close(); }
  console.log('shots:', n, 'in', OUT, errs.length ? '\n' + errs.join('\n') : '· no console errors');
  await browser.close(); if (server) server.kill();
})();
