/* Assemble src/unit-10.html from the Unit 9 chrome + the Unit 10 fragments in tpl/u10-*. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const u9 = R('src/unit-09.html');
const TITLE = 'Optimization I — Gradients that Work';
const TITLE_ESC = 'Optimization I — Gradients that Work';
const DESC = 'The four ways the plain walk goes wrong — a bad start, memorising instead of learning, the wrong valley or a salt flat, and a canyon that makes every step bounce — and the cheapest fix in machine learning: change the units of the data, not the model. Initialisation, overfitting as knobs versus facts, centring / standardising / min–max, watersheds and the combination lock of high dimensions, plateaus, differential curvature and the condition number, why the gradient crosses contours at right angles, and a training clinic.';

/* ---- 1 · head + CSS (everything up to and including </head>) ---- */
let head = u9.slice(0, u9.indexOf('</head>') + '</head>'.length);
const sub = (from, to, opt) => { if (!head.includes(from)) { if (opt) return; throw new Error('head: missing ' + from.slice(0, 70)); } head = head.split(from).join(to); };
sub('<title>Unit 9 · Gradient Descent — The Math Behind the Machine</title>', `<title>Unit 10 · ${TITLE_ESC} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 9 · Gradient Descent — The Math Behind the Machine">', `<meta property="og:title" content="Unit 10 · ${TITLE_ESC} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-09.html', 'https://linearalgebra.info/unit-10.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
sub('<style id="u9-cinema">', '<style id="u10-cinema">');
sub('CINEMA-U9', 'CINEMA-U10');
sub('/* ---- unit-8/9 additions ---- */', '/* ---- unit-8/9/10 additions ---- */');
if (/Unit 9|unit-09|u9-/.test(head)) throw new Error('head still mentions unit 9: ' + head.match(/.{30}(Unit 9|unit-09|u9-).{30}/)[0]);

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u9.slice(u9.indexOf('<body>'), u9.indexOf('<section class="hero-stage">'));
top = top.replace('/ Unit 9 · Gradient Descent', '/ Unit 10 · Optimization I');
top = top.replace('<span id="score-total">15</span>', '<span id="score-total">15</span>');
if (/Unit 9/.test(top)) throw new Error('topbar still says Unit 9');

/* ---- 3 · content: sections with widgets + practice spliced in ---- */
const widgets = R('tpl/u10-widgets.html');
const W = {};
widgets.split(/<!--@(W\d+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) W[x] = arr[i + 1]; });
let body = ['a', 'b', 'c', 'd'].map(k => R(`tpl/u10-sec-${k}.html`)).join('\n');
for (const k of Object.keys(W)) { const m = `<!--@${k}-->`; if (!body.includes(m)) throw new Error('no placeholder for ' + k); body = body.replace(m, () => W[k].trimEnd()); }
/* proofs, folded away: <!--@ALG sid--> → a details drawer holding that section's derive boxes (tpl/u10-derives.html, grouped by <!--@D sid--> markers) */
const DER = {};
R('tpl/u10-derives.html').split(/<!--@D (\w+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) DER[x] = arr[i + 1].split(/(?=  <div class="derive reveal">)/).map(s => s.trimEnd()).filter(s => s.includes('class="derive reveal"')); });
body = body.replace(/<!--@ALG (\w+)-->/g, (m, sid) => { const d = DER[sid]; if (!d) throw new Error('no derives for ' + sid);
  return `  <details class="algebra reveal"><summary>If you want the algebra · ${d.length} ${d.length === 1 ? 'proof' : 'proofs'}, step by step</summary>\n` + d.join('\n') + '\n  </details>'; });
body = body.replace('<!--@PRACTICE-->', () => R('tpl/u10-practice.html').trimEnd());
if (/<!--@/.test(body)) throw new Error('unfilled placeholder: ' + body.match(/<!--@[^>]*-->/)[0]);

/* ---- 4 · scripts: shared runtime + widgets + UX v2 ---- */
const ux = u9.slice(u9.lastIndexOf('/* ================= MBM-UX-V2'), u9.lastIndexOf('</script>\n</body>'));
let ux10 = ux.replace('var U = 9;', 'var U = 10;')
  .replace('{"n":9,"t":"Gradient Descent"}]', '{"n":9,"t":"Gradient Descent"},{"n":10,"t":"Optimization I"}]');
if (!ux10.includes('var U = 10;') || !ux10.includes('"n":10')) throw new Error('ux block not patched');
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + R('tpl/u10-shared.js').trimEnd() + '\n\n' + R('tpl/u10-widgets.js').trimEnd() + '\n\n})();\n' + ux10 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + body + '\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP']) { const re = new RegExp(bad); const m = out.replace(/mfml-/g, '').match(re); if (m) throw new Error('brand leak: ' + bad); }
fs.writeFileSync('src/unit-10.html', out);
console.log('assembled src/unit-10.html', out.length, 'bytes;', (out.match(/class="check reveal"/g) || []).length, 'checks;', (out.match(/class="widget reveal"/g) || []).length, 'widgets;', (out.match(/class="prob reveal"/g) || []).length, 'problems;', (out.match(/class="derive reveal"/g) || []).length, 'derives');
