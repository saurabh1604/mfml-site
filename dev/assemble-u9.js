/* Assemble src/unit-09.html from the Unit 8 chrome + the Unit 9 fragments in tpl/u9-*. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const u8 = R('src/unit-08.html');
const TITLE = 'Gradient Descent';
const DESC = 'Walking downhill in the fog: the descent rule proved, the step-size speed limit 2/λmax and the zig-zag it causes, exact line search and why the next gradient is perpendicular, bracketing, learning-rate schedules and the bold driver, gradient checking, and stochastic gradient descent — why a random spoonful of the data points the right way.';

/* ---- 1 · head + CSS (everything up to and including </head>) ---- */
let head = u8.slice(0, u8.indexOf('</head>') + '</head>'.length);
const sub = (from, to, opt) => { if (!head.includes(from)) { if (opt) return; throw new Error('head: missing ' + from.slice(0, 70)); } head = head.split(from).join(to); };
sub('<title>Unit 8 · Taylor &amp; MacLaurin Series — The Math Behind the Machine</title>', `<title>Unit 9 · ${TITLE} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 8 · Taylor &amp; MacLaurin Series — The Math Behind the Machine">', `<meta property="og:title" content="Unit 9 · ${TITLE} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-08.html', 'https://linearalgebra.info/unit-09.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
sub('<style id="u8-cinema">', '<style id="u9-cinema">');
sub('CINEMA-U8', 'CINEMA-U9');
sub('/* ---- unit-8 additions ---- */', '/* ---- unit-8/9 additions ---- */');
if (/Unit 8|unit-08|u8-/.test(head)) throw new Error('head still mentions unit 8: ' + head.match(/.{30}(Unit 8|unit-08|u8-).{30}/)[0]);

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u8.slice(u8.indexOf('<body>'), u8.indexOf('<section class="hero-stage">'));
top = top.replace('/ Unit 8 · Taylor &amp; the Hessian', '/ Unit 9 · Gradient Descent');
top = top.replace('<span id="score-total">17</span>', '<span id="score-total">13</span>');
if (/Unit 8/.test(top)) throw new Error('topbar still says Unit 8');

/* ---- 3 · content: sections with widgets + practice spliced in ---- */
const widgets = R('tpl/u9-widgets.html');
const W = {};
widgets.split(/<!--@(W\d)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) W[x] = arr[i + 1]; });
let body = ['a', 'b', 'c', 'd'].map(k => R(`tpl/u9-sec-${k}.html`)).join('\n');
for (const k of Object.keys(W)) { const m = `<!--@${k}-->`; if (!body.includes(m)) throw new Error('no placeholder for ' + k); body = body.replace(m, () => W[k].trimEnd()); }
body = body.replace('<!--@PRACTICE-->', () => R('tpl/u9-practice.html').trimEnd());
if (/<!--@/.test(body)) throw new Error('unfilled placeholder: ' + body.match(/<!--@[^>]*-->/)[0]);

/* ---- 4 · scripts: shared runtime + widgets + UX v2 ---- */
const ux = u8.slice(u8.lastIndexOf('/* ================= MBM-UX-V2'), u8.lastIndexOf('</script>\n</body>'));
let ux9 = ux.replace('var U = 8;', 'var U = 9;')
  .replace('{"n":8,"t":"Taylor & MacLaurin"}]', '{"n":8,"t":"Taylor & MacLaurin"},{"n":9,"t":"Gradient Descent"}]');
if (!ux9.includes('var U = 9;') || !ux9.includes('"n":9')) throw new Error('ux block not patched');
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + R('tpl/u9-shared.js').trimEnd() + '\n\n' + R('tpl/u9-widgets.js').trimEnd() + '\n\n})();\n' + ux9 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + body + '\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP']) { const re = new RegExp(bad); const m = out.replace(/mfml-/g, '').match(re); if (m) throw new Error('brand leak: ' + bad); }
fs.writeFileSync('src/unit-09.html', out);
console.log('assembled src/unit-09.html', out.length, 'bytes;', (out.match(/class="check reveal"/g) || []).length, 'checks;', (out.match(/class="widget reveal"/g) || []).length, 'widgets;', (out.match(/class="prob reveal"/g) || []).length, 'problems;', (out.match(/class="derive reveal"/g) || []).length, 'derives');
