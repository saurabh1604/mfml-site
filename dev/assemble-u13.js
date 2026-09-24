/* Assemble src/unit-13.html from the Unit 11 chrome + the Unit 13 fragments in tpl/u13-*.
   node assemble-u13.js   (then: node gen-site.js && node build.js unit-13.html) */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const u11 = R('src/unit-11.html');
const TITLE_ESC = 'Support Vector Machines';
const DESC = 'Many straight lines split two groups of points with no mistakes; the support vector machine picks the one with the widest empty street around it. The street is 2/‖w‖ wide, so widening it means shrinking w — a convex quadratic problem with exactly one answer. Its prices turn out to be zero for almost every point: only the few that touch the street hold it up. Then the messy world: a fine for trespassers, the hinge loss, and the kernel trick — similarity measured in a bigger space you never visit, so a straight cut up there becomes a curved rule down here.';

/* ---- 1 · head + CSS ---- */
let head = u11.slice(0, u11.indexOf('</head>'));
const sub = (from, to) => { if (!head.includes(from)) throw new Error('head: missing ' + from.slice(0, 70)); head = head.split(from).join(to); };
sub('<title>Unit 11 · Optimization II — Five Ways Down One Valley — The Math Behind the Machine</title>', `<title>Unit 13 · ${TITLE_ESC} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 11 · Optimization II — Five Ways Down One Valley — The Math Behind the Machine">', `<meta property="og:title" content="Unit 13 · ${TITLE_ESC} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-11.html', 'https://linearalgebra.info/unit-13.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
sub('<style id="u11-cinema">', '<style id="u13-cinema">');
sub('CINEMA-U11', 'CINEMA-U13');
sub('/* ---- unit-8/9/10/11 additions ---- */', '/* ---- unit-8/9/10/11/13 additions ---- */');
if (/Unit 11|unit-11|u11-/.test(head)) throw new Error('head still mentions unit 11: ' + head.match(/.{30}(Unit 11|unit-11|u11-).{30}/)[0]);
head += '<style id="u13-extra">\n' + R('tpl/u13-head.css').trimEnd() + '\n</style>\n</head>';

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u11.slice(u11.indexOf('<body>'), u11.indexOf('<section class="hero-stage">'));
top = top.replace('/ Unit 11 · Optimization II', '/ Unit 13 · Support Vector Machines');
if (/Unit 11/.test(top)) throw new Error('topbar still says Unit 11');

/* ---- 3 · hero + sections + drawers + practice ---- */
let body = R('tpl/u13-hero.html').trimEnd() + '\n\n<main id="main-content" tabindex="-1">\n\n' +
  ['a', 'b', 'c', 'd'].map(k => R(`tpl/u13-sec-${k}.html`)).join('\n') + '\n</main>\n';
const DER = {};
R('tpl/u13-derives.html').split(/<!--@D (\w+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) DER[x] = arr[i + 1].split(/(?=  <div class="derive">)/).map(s => s.trimEnd()).filter(s => s.includes('class="derive"')); });
const usedDer = new Set();
body = body.replace(/<!--@ALG (\w+)-->/g, (m, sid) => { const d = DER[sid]; if (!d) throw new Error('no derives for ' + sid); usedDer.add(sid);
  return `  <details class="algebra reveal"><summary>If you want the algebra · ${d.length} ${d.length === 1 ? 'proof' : 'proofs'}, step by step</summary>\n` + d.join('\n') + '\n  </details>'; });
for (const k of Object.keys(DER)) if (!usedDer.has(k)) throw new Error('derive group never placed: ' + k);
body = body.replace('<!--@PRACTICE-->', () => R('tpl/u13-practice.html').trimEnd());
if (/<!--@/.test(body)) throw new Error('unfilled placeholder: ' + body.match(/<!--@[^>]*-->/)[0]);

/* true counts → hero chips and the check total */
const nChecks = (body.match(/class="check reveal"/g) || []).length, nWidgets = (body.match(/<div class="widget reveal"/g) || []).length,
  n3d = (body.match(/class="stage3d[^"]*"/g) || []).length, nProbs = (body.match(/class="prob reveal"/g) || []).length,
  nDer = (body.match(/class="derive"/g) || []).length;
const n3dW = [...body.matchAll(/<div class="widget reveal" id="(w-[^"]+)"[\s\S]*?(?=<div class="widget reveal"|<\/section>)/g)].filter(m => /class="stage3d/.test(m[0])).length;
body = body.replace('@@WIDGETS@@', nWidgets).replace('@@W3D@@', n3dW).replace('@@CHECKS@@', nChecks).replace('@@DERIVES@@', nDer).replace('@@PROBS@@', nProbs).replace('@@PROBS2@@', nProbs);
top = top.replace('<span id="score-total">20</span>', `<span id="score-total">${nChecks}</span>`);
if (!top.includes(`<span id="score-total">${nChecks}</span>`)) throw new Error('score-total not patched');

/* ---- 4 · scripts: house runtime (from Unit 11) + solver + kit + widgets + UX v2 ---- */
const shared = R('tpl/u11-shared.js').split("'mfml-u11-checks'").join("'mfml-u13-checks'");
if (/u11/.test(shared.replace(/U11/g, ''))) throw new Error('shared runtime still mentions u11');
const ux = u11.slice(u11.lastIndexOf('/* ================= MBM-UX-V2'), u11.lastIndexOf('</script>\n</body>'));
const ux13 = ux.replace('var U = 11;', 'var U = 13;')
  .replace('{"n":11,"t":"Optimization II"}]', '{"n":11,"t":"Optimization II"},{"n":12,"t":"Principal Component Analysis"},{"n":13,"t":"Support Vector Machines"}]');
if (!ux13.includes('var U = 13;') || !ux13.includes('"n":13')) throw new Error('ux block not patched');
const JS = ['tpl/u13-svm.js', 'tpl/u13-kit.js', 'tpl/u13-shared.js', 'tpl/u13-hero.js', 'tpl/u13-w1.js', 'tpl/u13-w2.js', 'tpl/u13-w3.js', 'tpl/u13-w4.js'].filter(f => fs.existsSync(f));
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + shared.trimEnd() + '\n\n' + JS.map(f => R(f).trimEnd()).join('\n\n') + '\n\n})();\n' + ux13 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + body + '\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP']) { if (out.replace(/mfml-/g, '').includes(bad)) throw new Error('brand leak: ' + bad); }
for (const bad of [/exam paper/i, /question bank/i, /past paper/i, /\bexams?\b/i]) { const m = out.match(bad); if (m) throw new Error('forbidden phrase: ' + m[0]); }
fs.writeFileSync('src/unit-13.html', out);
console.log('assembled src/unit-13.html', out.length, 'bytes;', nChecks, 'checks;', nWidgets, 'widgets (' + n3dW + ' in 3D, ' + n3d + ' stages);', nProbs, 'problems;', nDer, 'derives');
