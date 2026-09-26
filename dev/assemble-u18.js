/* Assemble src/unit-18.html from the Unit 15 chrome + the Unit 18 fragments in tpl/u18-*.
   node assemble-u18.js   (then: node gen-site.js && node build.js unit-18.html) */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const has = f => fs.existsSync(f);
const u15 = R('src/unit-15.html');
const TITLE_ESC = 'Attention and Transformers';
const DESC = 'Every word asks every other word a question. Attention as a soft lookup: queries, keys and values worked by hand, why we divide by the square root of d, an attention lab where you type a sentence and watch “it” find “ball”, many heads as many subspaces, positions as clock hands and rotations, the transformer block with residual paths and layer norm, the causal mask, the n² price, and a tiny transformer walked end to end with every number visible.';

/* ---- 1 · head + CSS ---- */
let head = u15.slice(0, u15.indexOf('</head>'));
const sub = (from, to) => { if (!head.includes(from)) throw new Error('head: missing ' + from.slice(0, 70)); head = head.split(from).join(to); };
sub('<title>Unit 15 · The Network, Whole — The Math Behind the Machine</title>', `<title>Unit 18 · ${TITLE_ESC} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 15 · The Network, Whole — The Math Behind the Machine">', `<meta property="og:title" content="Unit 18 · ${TITLE_ESC} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-15.html', 'https://linearalgebra.info/unit-18.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
sub('<style id="u15-cinema">', '<style id="u18-cinema">');
sub('CINEMA-U15', 'CINEMA-U18');
sub('/* ---- unit-8/9/10/11/13/15 additions ---- */', '/* ---- unit-8/9/10/11/13/15/18 additions ---- */');
/* drop Unit 15's own extra stylesheet (the unit CSS + its playground CSS) */
const x0 = head.indexOf('<style id="u15-extra">'); if (x0 < 0) throw new Error('no u15-extra style');
const x1 = head.indexOf('</style>', x0); head = head.slice(0, x0) + head.slice(x1 + '</style>'.length);
if (/Unit 15|unit-15|u15-|U15/.test(head)) throw new Error('head still mentions unit 15: ' + head.match(/.{30}(Unit 15|unit-15|u15-|U15).{30}/)[0]);
const css = R('tpl/u18-head.css').trimEnd();
head = head.trimEnd() + '\n<style id="u18-extra">\n' + css + '\n</style>\n</head>';

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u15.slice(u15.indexOf('<body>'), u15.indexOf('<section class="hero-stage">'));
top = top.replace('/ Unit 15 · The Network, Whole', '/ Unit 18 · Attention and Transformers');
if (/Unit 15/.test(top)) throw new Error('topbar still says Unit 15');

/* ---- 3 · hero + sections + drawers + practice ---- */
let body = R('tpl/u18-hero.html').trimEnd() + '\n\n<main id="main-content" tabindex="-1">\n\n' +
  ['a', 'b', 'c', 'd'].map(k => R(`tpl/u18-sec-${k}.html`)).join('\n') + '\n</main>\n';
const DER = {};
R('tpl/u18-derives.html').split(/<!--@D (\w+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) DER[x] = arr[i + 1].split(/(?=  <div class="derive">)/).map(s => s.trimEnd()).filter(s => s.includes('class="derive"')); });
const usedDer = new Set();
body = body.replace(/<!--@ALG (\w+)-->/g, (m, sid) => { const d = DER[sid]; if (!d) throw new Error('no derives for ' + sid); usedDer.add(sid);
  return `  <details class="algebra reveal"><summary>If you want the algebra · ${d.length} ${d.length === 1 ? 'proof' : 'proofs'}, step by step</summary>\n` + d.join('\n') + '\n  </details>'; });
for (const k of Object.keys(DER)) if (!usedDer.has(k)) throw new Error('derive group never placed: ' + k);
body = body.replace('<!--@PRACTICE-->', () => R('tpl/u18-practice.html').trimEnd());
if (/<!--@/.test(body)) throw new Error('unfilled placeholder: ' + body.match(/<!--@[^>]*-->/)[0]);

/* true counts → hero chips and the check total */
const nChecks = (body.match(/class="check reveal"/g) || []).length, nWidgets = (body.match(/<div class="widget reveal"/g) || []).length,
  n3d = (body.match(/class="stage3d[^"]*"/g) || []).length, nProbs = (body.match(/class="prob reveal"/g) || []).length,
  nDer = (body.match(/class="derive"/g) || []).length;
const n3dW = [...body.matchAll(/<div class="widget reveal" id="(w-[^"]+)"[\s\S]*?(?=<div class="widget reveal"|<\/section>)/g)].filter(m => /class="stage3d/.test(m[0])).length;
body = body.replace('@@WIDGETS@@', nWidgets).replace('@@W3D@@', n3dW).replace('@@CHECKS@@', nChecks).replace('@@DERIVES@@', nDer).replace('@@PROBS@@', nProbs);
if (/@@\w+@@/.test(body)) throw new Error('unfilled count: ' + body.match(/@@\w+@@/)[0]);
const ids = [...body.matchAll(/data-check="(c\d+)"/g)].map(m => m[1]); if (new Set(ids).size !== ids.length) throw new Error('duplicate check ids');
top = top.replace(/<span id="score-total">\d+<\/span>/, `<span id="score-total">${nChecks}</span>`);
if (!top.includes(`<span id="score-total">${nChecks}</span>`)) throw new Error('score-total not patched');

/* ---- 4 · scripts: house runtime (from Unit 11) + kit + widgets + UX v2 ---- */
const shared = R('tpl/u11-shared.js').split("'mfml-u11-checks'").join("'mfml-u18-checks'");
if (/u11/.test(shared.replace(/U11/g, ''))) throw new Error('shared runtime still mentions u11');
const ux = u15.slice(u15.lastIndexOf('/* ================= MBM-UX-V2'), u15.lastIndexOf('</script>\n</body>'));
const OLD = '{"n":15,"t":"The Network, Whole"}]', NEW = '{"n":15,"t":"The Network, Whole"},{"n":16,"t":"Words as Vectors"},{"n":17,"t":"Machines with Memory"},{"n":18,"t":"Attention and Transformers"}]';
/* Unit 15's chrome ends at 15, or at 18 once Units 16-18 are wired in */
if (!ux.includes('var U = 15;') || !(ux.includes(OLD) || ux.includes(NEW))) throw new Error('ux block: anchors missing');
const ux18 = ux.replace('var U = 15;', 'var U = 18;').replace(ux.includes(NEW) ? NEW : OLD, NEW);
if (!ux18.includes('var U = 18;') || !ux18.includes(NEW) || (ux18.match(/"n":18,/g) || []).length !== 1) throw new Error('ux block not patched');
const JS = ['tpl/u18-kit.js', 'tpl/u18-shared.js', 'tpl/u18-hero.js', 'tpl/u18-w1.js', 'tpl/u18-w2.js', 'tpl/u18-w3.js', 'tpl/u18-w4.js'].filter(has);
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + shared.trimEnd() + '\n\n' + JS.map(f => '/* ---- ' + f.replace('tpl/', '') + ' ---- */\n' + R(f).trimEnd()).join('\n\n') + '\n\n})();\n' + ux18 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + body + '\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP']) { if (out.replace(/mfml-/g, '').includes(bad)) throw new Error('brand leak: ' + bad); }
for (const bad of [/exam paper/i, /question bank/i, /past paper/i, /\bexams?\b/i]) { const m = out.match(bad); if (m) throw new Error('forbidden phrase: ' + m[0]); }
if (/mfml-u15|u15-|U15/.test(out)) throw new Error('unit 15 leftover: ' + out.match(/.{40}(mfml-u15|u15-|U15).{40}/)[0]);
if (/Unit 15 of 20|\/ Unit 15|var U = 15/.test(out)) throw new Error('unit 15 chrome leftover');
fs.writeFileSync('src/unit-18.html', out);
console.log('assembled src/unit-18.html', out.length, 'bytes;', nChecks, 'checks;', nWidgets, 'widgets (' + n3dW + ' in 3D, ' + n3d + ' stages);', nProbs, 'problems;', nDer, 'derives;', 'JS:', JS.map(f => f.replace('tpl/u18-', '')).join(' '));
