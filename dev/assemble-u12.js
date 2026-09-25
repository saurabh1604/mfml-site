/* Assemble src/unit-12.html from the Unit 11 chrome (src/unit-11.html) + the Unit 12 fragments in tpl/u12-*. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const u11 = R('src/unit-11.html');
const TITLE = 'Principal Component Analysis';
const DESC = 'A cloud of data looks spread out from some directions and flat from others. Find the directions of greatest spread: centre the data, build the covariance matrix, score every direction by wᵀCw, put the direction on a leash of length one and watch the Lagrange multiplier turn into an eigenvalue. Then the same answer three more ways — the smallest rebuild error, uncorrelated new columns, and the truncated SVD — and PCA in practice: power iteration, the Gram trick for wide data, the recipe, the traps and a full worked example.';

/* ---- 1 · head + CSS ---- */
let head = u11.slice(0, u11.indexOf('</head>') + '</head>'.length);
const sub = (from, to, opt) => { if (!head.includes(from)) { if (opt) return; throw new Error('head: missing ' + from.slice(0, 70)); } head = head.split(from).join(to); };
sub('<title>Unit 11 · Optimization II — Five Ways Down One Valley — The Math Behind the Machine</title>', `<title>Unit 12 · ${TITLE} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 11 · Optimization II — Five Ways Down One Valley — The Math Behind the Machine">', `<meta property="og:title" content="Unit 12 · ${TITLE} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-11.html', 'https://linearalgebra.info/unit-12.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
sub('<style id="u11-cinema">', '<style id="u12-cinema">');
sub('CINEMA-U11', 'CINEMA-U12');
sub('/* ---- unit-8/9/10/11 additions ---- */', '/* ---- unit-8/9/10/11/12 additions ---- */');
/* the unit's own CSS goes at the end of the cinema block */
const cinEnd = head.lastIndexOf('</style>\n</head>');
if (cinEnd < 0) throw new Error('head: cannot find the end of the cinema style block');
head = head.slice(0, cinEnd) + R('tpl/u12-extra.css') + head.slice(cinEnd);
if (/Unit 11|unit-11|u11-/.test(head)) throw new Error('head still mentions unit 11: ' + head.match(/.{30}(Unit 11|unit-11|u11-).{30}/)[0]);

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u11.slice(u11.indexOf('<body>'), u11.indexOf('<section class="hero-stage">'));
top = top.replace('/ Unit 11 · Optimization II', '/ Unit 12 · ' + TITLE);

/* ---- 3 · content ---- */
const widgets = R('tpl/u12-widgets.html');
const W = {};
widgets.split(/<!--@(W\d+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) W[x] = arr[i + 1]; });
let body = ['a', 'b', 'c', 'd'].map(k => R(`tpl/u12-sec-${k}.html`)).join('\n');
for (const k of Object.keys(W)) { const m = `<!--@${k}-->`; if (!body.includes(m)) throw new Error('no placeholder for ' + k); body = body.replace(m, () => W[k].trimEnd()); }
const DER = {};
R('tpl/u12-derives.html').split(/<!--@D (\w+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) DER[x] = arr[i + 1].split(/(?=  <div class="derive reveal">)/).map(s => s.trimEnd()).filter(s => s.includes('class="derive reveal"')); });
body = body.replace(/<!--@ALG (\w+)-->/g, (m, sid) => { const d = DER[sid]; if (!d) throw new Error('no derives for ' + sid);
  return `  <details class="algebra reveal"><summary>If you want the algebra · ${d.length} ${d.length === 1 ? 'proof' : 'proofs'}, step by step</summary>\n` + d.join('\n') + '\n  </details>'; });
body = body.replace('<!--@PRACTICE-->', () => R('tpl/u12-practice.html').trimEnd());
if (/<!--@/.test(body)) throw new Error('unfilled placeholder: ' + body.match(/<!--@[^>]*-->/)[0]);

/* ---- 4 · counts → hero chips + score total ---- */
const count = (s, re) => (s.match(re) || []).length;
const NC = count(body, /class="check reveal"/g), NW = count(body, /class="widget reveal"/g), NP = count(body, /class="prob reveal"/g), ND = count(body, /class="derive reveal"/g);
/* a widget is "in 3D" when it holds a WebGL stage */
const N3D = body.split(/(?=<div class="widget reveal")/).filter(w => /class="stage3d/.test(w.split(/<!-- =====/)[0])).length;
let hero = R('tpl/u12-hero.html').replace('@MIN', '125').replace('@NW', NW).replace('@N3D', N3D).replace('@NC', NC).replace('@ND', ND).replace('@NP', NP);
top = top.replace('<span id="score-total">20</span>', `<span id="score-total">${NC}</span>`);
if (/Unit 11/.test(top)) throw new Error('topbar still says Unit 11');

/* ---- 5 · scripts: shared runtime + widgets + UX v2 ---- */
const ux = u11.slice(u11.lastIndexOf('/* ================= MBM-UX-V2'), u11.lastIndexOf('</script>\n</body>'));
const ux12 = ux.replace('var U = 11;', 'var U = 12;')
  .replace('{"n":11,"t":"Optimization II"}]', '{"n":11,"t":"Optimization II"},{"n":12,"t":"Principal Component Analysis"}]');
if (!ux12.includes('var U = 12;') || !ux12.includes('"n":12') || (ux12.match(/"n":12,/g) || []).length !== 1) throw new Error('ux block not patched');
const js = ['u12-shared.js', 'u12-w-a.js', 'u12-w-b.js', 'u12-w-c.js', 'u12-w-d.js'].filter(f => fs.existsSync('tpl/' + f)).map(f => R('tpl/' + f).trimEnd()).join('\n\n');
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + js + '\n\n})();\n' + ux12 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + hero + '\n\n<main id="main-content" tabindex="-1">\n\n' + body + '\n\n</main>\n\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP', 'exam paper', 'question bank', 'Exam paper']) { const m = out.replace(/mfml-/g, '').match(new RegExp(bad)); if (m) throw new Error('brand leak: ' + bad); }
fs.writeFileSync('src/unit-12.html', out);
console.log('assembled src/unit-12.html', out.length, 'bytes;', NC, 'checks;', NW, 'widgets (' + N3D + ' in 3D);', NP, 'problems;', ND, 'derives');
