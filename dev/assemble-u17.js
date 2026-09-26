/* Assemble src/unit-17.html from the Unit 15 chrome + the Unit 17 fragments in tpl/u17-*.
   node assemble-u17.js   (then: node gen-site.js && node build.js unit-17.html) */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const has = f => fs.existsSync(f);
const u15 = R('src/unit-15.html');
const TITLE_ESC = 'Machines with Memory';
const DESC = 'Reading one word at a time. A recurrent cell keeps a running note and updates it with the same weights at every word; unrolled, it is a deep network whose layers are twins. Training sends blame back through time, multiplied by the same matrix again and again, so its eigenvalues decide whether memory fades away or blows up. Then gradient clipping, the LSTM with its express lane, the GRU with its blend dial, a memory lab that races all three, and an encoder–decoder that translates English into Hindi through one summary vector — the bottleneck that attention removes.';

/* ---- 1 · head + CSS ---- */
let head = u15.slice(0, u15.indexOf('</head>'));
const sub = (from, to) => { if (!head.includes(from)) throw new Error('head: missing ' + from.slice(0, 70)); head = head.split(from).join(to); };
sub('<title>Unit 15 · The Network, Whole — The Math Behind the Machine</title>', `<title>Unit 17 · ${TITLE_ESC} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 15 · The Network, Whole — The Math Behind the Machine">', `<meta property="og:title" content="Unit 17 · ${TITLE_ESC} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-15.html', 'https://linearalgebra.info/unit-17.html');
head = head.replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, () => `<meta property="og:description" content="${DESC}">`);
sub('<style id="u15-cinema">', '<style id="u17-cinema">');
sub('CINEMA-U15', 'CINEMA-U17');
sub('/* ---- unit-8/9/10/11/13/15 additions ---- */', '/* ---- unit-8/9/10/11/13/15/17 additions ---- */');
/* drop Unit 15's own extra stylesheet (it is the last <style> of the head) */
const x0 = head.indexOf('<style id="u15-extra">'); if (x0 < 0) throw new Error('no u15-extra style');
const x1 = head.indexOf('</style>', x0); head = head.slice(0, x0) + head.slice(x1 + '</style>'.length);
if (/Unit 15|unit-15|u15-|U15|Network, Whole/.test(head)) throw new Error('head still mentions unit 15: ' + head.match(/.{30}(Unit 15|unit-15|u15-|U15|Network, Whole).{30}/)[0]);
const css = R('tpl/u17-head.css').trimEnd();
head = head.trimEnd() + '\n<style id="u17-extra">\n' + css + '\n</style>\n</head>';

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u15.slice(u15.indexOf('<body>'), u15.indexOf('<section class="hero-stage">'));
if (!top.includes('/ Unit 15 · The Network, Whole')) throw new Error('crumb not found');
top = top.replace('/ Unit 15 · The Network, Whole', '/ Unit 17 · ' + TITLE_ESC);
if (/Unit 15/.test(top)) throw new Error('topbar still says Unit 15');

/* ---- 3 · hero + sections + drawers + practice ---- */
let body = R('tpl/u17-hero.html').trimEnd() + '\n\n<main id="main-content" tabindex="-1">\n\n' +
  ['a', 'b', 'c', 'd'].map(k => R(`tpl/u17-sec-${k}.html`)).join('\n') + '\n</main>\n';
const DER = {};
R('tpl/u17-derives.html').split(/<!--@D (\w+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) DER[x] = arr[i + 1].split(/(?=  <div class="derive">)/).map(s => s.trimEnd()).filter(s => s.includes('class="derive"')); });
const usedDer = new Set();
body = body.replace(/<!--@ALG (\w+)-->/g, (m, sid) => { const d = DER[sid]; if (!d) throw new Error('no derives for ' + sid); usedDer.add(sid);
  return `  <details class="algebra reveal"><summary>If you want the algebra · ${d.length} ${d.length === 1 ? 'proof' : 'proofs'}, step by step</summary>\n` + d.join('\n') + '\n  </details>'; });
for (const k of Object.keys(DER)) if (!usedDer.has(k)) throw new Error('derive group never placed: ' + k);
body = body.replace('<!--@PRACTICE-->', () => R('tpl/u17-practice.html').trimEnd());
if (/<!--@/.test(body)) throw new Error('unfilled placeholder: ' + body.match(/<!--@[^>]*-->/)[0]);

/* true counts → hero chips and the check total */
const nChecks = (body.match(/class="check reveal"/g) || []).length, nWidgets = (body.match(/<div class="widget reveal"/g) || []).length,
  n3d = (body.match(/class="stage3d[^"]*"/g) || []).length, nProbs = (body.match(/class="prob reveal"/g) || []).length,
  nDer = (body.match(/class="derive"/g) || []).length;
const n3dW = [...body.matchAll(/<div class="widget reveal" id="(w-[^"]+)"[\s\S]*?(?=<div class="widget reveal"|<\/section>)/g)].filter(m => /class="stage3d/.test(m[0])).length;
body = body.replace('@@WIDGETS@@', nWidgets).replace('@@W3D@@', n3dW).replace('@@CHECKS@@', nChecks).replace('@@DERIVES@@', nDer).replace('@@PROBS@@', nProbs);
if (/@@\w+@@/.test(body)) throw new Error('unfilled count: ' + body.match(/@@\w+@@/)[0]);
top = top.replace(/<span id="score-total">\d+<\/span>/, `<span id="score-total">${nChecks}</span>`);
if (!top.includes(`<span id="score-total">${nChecks}</span>`)) throw new Error('score-total not patched');
/* every check id is unique */
const cids = [...body.matchAll(/data-check="(c\d+)"/g)].map(m => m[1]); if (new Set(cids).size !== cids.length) throw new Error('duplicate check id');

/* ---- 4 · scripts: house runtime (from Unit 11) + kit + widgets + UX v2 ---- */
const shared = R('tpl/u11-shared.js').split("'mfml-u11-checks'").join("'mfml-u17-checks'");
if (/u11/.test(shared.replace(/U11/g, ''))) throw new Error('shared runtime still mentions u11');
const ux = u15.slice(u15.lastIndexOf('/* ================= MBM-UX-V2'), u15.lastIndexOf('</script>\n</body>'));
const OLD_TAIL = '{"n":13,"t":"Support Vector Machines"},{"n":14,"t":"Thinking in Probabilities"},{"n":15,"t":"The Network, Whole"}]';
const NEW_TAIL = '{"n":13,"t":"Support Vector Machines"},{"n":14,"t":"Thinking in Probabilities"},{"n":15,"t":"The Network, Whole"},{"n":16,"t":"Words as Vectors"},{"n":17,"t":"Machines with Memory"},{"n":18,"t":"Attention and Transformers"}]';
if (!ux.includes('var U = 15;')) throw new Error('ux block: no var U = 15');
const ux17 = ux.replace('var U = 15;', 'var U = 17;').replace(ux.includes(NEW_TAIL) ? NEW_TAIL : OLD_TAIL, NEW_TAIL);
if (!ux17.includes('var U = 17;') || !ux17.includes(NEW_TAIL) || (ux17.match(/"n":17,/g) || []).length !== 1 || /U15|u15-/.test(ux17)) throw new Error('ux block not patched');
const JS = ['tpl/u17-kit.js', 'tpl/u17-shared.js', 'tpl/u17-hero.js', 'tpl/u17-w1.js', 'tpl/u17-w2.js', 'tpl/u17-w3.js', 'tpl/u17-w4.js'].filter(has);
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + shared.trimEnd() + '\n\n' + JS.map(f => '/* ---- ' + f.replace('tpl/', '') + ' ---- */\n' + R(f).trimEnd()).join('\n\n') + '\n\n})();\n' + ux17 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + body + '\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP']) { if (out.replace(/mfml-/g, '').includes(bad)) throw new Error('brand leak: ' + bad); }
for (const bad of [/exam paper/i, /question bank/i, /past paper/i, /\bexams?\b/i]) { const m = out.match(bad); if (m) throw new Error('forbidden phrase: ' + m[0]); }
if (/mfml-u15|u15-|U15|mfml-u13|u13-|U13/.test(out)) throw new Error('unit 15/13 leftover: ' + out.match(/.{40}(mfml-u15|u15-|U15|mfml-u13|u13-|U13).{40}/)[0]);
if (!out.includes('<a href="unit-16.html">← Unit 16 · Words as Vectors</a>')) throw new Error('previous-unit link missing');
if (!out.includes('<a href="unit-18.html">Unit 18 · Attention and Transformers →</a>')) throw new Error('next-card link missing');
fs.writeFileSync('src/unit-17.html', out);
console.log('assembled src/unit-17.html', out.length, 'bytes;', nChecks, 'checks;', nWidgets, 'widgets (' + n3dW + ' in 3D, ' + n3d + ' stages);', nProbs, 'problems;', nDer, 'derives;', 'JS:', JS.map(f => f.replace('tpl/u17-', '')).join(' '));
