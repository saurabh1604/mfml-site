/* Assemble src/unit-11.html from the Unit 10 chrome + the Unit 11 fragments in tpl/u11-*. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const u10 = R('src/unit-10.html');
const TITLE_ESC = 'Optimization II — Five Ways Down One Valley';
const DESC = 'One stride can never suit two directions, so give the walker new instincts: memory, so pushes that agree stack up and pushes that flip cancel; a private stride per knob, learned from its own history; and forgetting, so that history never becomes a life sentence. Momentum, AdaGrad, RMSProp and Adam raced on one valley — and then a wall, where the answer sits on the boundary with a non-zero gradient: standard form, the Lagrangian as a fine, slack variables, complementary slackness, the five KKT conditions, convexity, the primal-dual pair, the price of a wall, and a two-point classifier built from its multipliers.';

/* ---- 1 · head + CSS (everything up to and including </head>) ---- */
let head = u10.slice(0, u10.indexOf('</head>') + '</head>'.length);
const sub = (from, to, opt) => { if (!head.includes(from)) { if (opt) return; throw new Error('head: missing ' + from.slice(0, 70)); } head = head.split(from).join(to); };
sub('<title>Unit 10 · Optimization I — Gradients that Work — The Math Behind the Machine</title>', `<title>Unit 11 · ${TITLE_ESC} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 10 · Optimization I — Gradients that Work — The Math Behind the Machine">', `<meta property="og:title" content="Unit 11 · ${TITLE_ESC} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-10.html', 'https://linearalgebra.info/unit-11.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
sub('<style id="u10-cinema">', '<style id="u11-cinema">');
sub('CINEMA-U10', 'CINEMA-U11');
sub('/* ---- unit-8/9/10 additions ---- */', '/* ---- unit-8/9/10/11 additions ---- */');
sub('/* ---- new in Unit 10 ---- */', '/* ---- new in Unit 10/11 ---- */', true);
if (/Unit 10|unit-10|u10-/.test(head)) throw new Error('head still mentions unit 10: ' + head.match(/.{30}(Unit 10|unit-10|u10-).{30}/)[0]);

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u10.slice(u10.indexOf('<body>'), u10.indexOf('<section class="hero-stage">'));
top = top.replace('/ Unit 10 · Optimization I', '/ Unit 11 · Optimization II');
top = top.replace('<span id="score-total">15</span>', '<span id="score-total">20</span>');
if (/Unit 10/.test(top)) throw new Error('topbar still says Unit 10');

/* ---- 3 · content: sections with widgets + practice spliced in ---- */
const widgets = R('tpl/u11-widgets.html');
const W = {};
widgets.split(/<!--@(W\d+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) W[x] = arr[i + 1]; });
let body = ['a', 'b', 'c', 'd'].map(k => R(`tpl/u11-sec-${k}.html`)).join('\n');
for (const k of Object.keys(W)) { const m = `<!--@${k}-->`; if (!body.includes(m)) throw new Error('no placeholder for ' + k); body = body.replace(m, () => W[k].trimEnd()); }
/* proofs, folded away: <!--@ALG sid--> → a details drawer holding that section's derive boxes (tpl/u11-derives.html, grouped by <!--@D sid--> markers) */
const DER = {};
R('tpl/u11-derives.html').split(/<!--@D (\w+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) DER[x] = arr[i + 1].split(/(?=  <div class="derive reveal">)/).map(s => s.trimEnd()).filter(s => s.includes('class="derive reveal"')); });
body = body.replace(/<!--@ALG (\w+)-->/g, (m, sid) => { const d = DER[sid]; if (!d) throw new Error('no derives for ' + sid);
  return `  <details class="algebra reveal"><summary>If you want the algebra · ${d.length} ${d.length === 1 ? 'proof' : 'proofs'}, step by step</summary>\n` + d.join('\n') + '\n  </details>'; });
body = body.replace('<!--@PRACTICE-->', () => R('tpl/u11-practice.html').trimEnd());
if (/<!--@/.test(body)) throw new Error('unfilled placeholder: ' + body.match(/<!--@[^>]*-->/)[0]);

/* ---- 4 · scripts: shared runtime + widgets + UX v2 ---- */
const ux = u10.slice(u10.lastIndexOf('/* ================= MBM-UX-V2'), u10.lastIndexOf('</script>\n</body>'));
let ux11 = ux.replace('var U = 10;', 'var U = 11;')
  .replace('{"n":10,"t":"Optimization I"}]', '{"n":10,"t":"Optimization I"},{"n":11,"t":"Optimization II"}]');
if (!ux11.includes('var U = 11;') || !ux11.includes('"n":11')) throw new Error('ux block not patched');
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + R('tpl/u11-shared.js').trimEnd() + '\n\n' + R('tpl/u11-widgets.js').trimEnd() + '\n\n})();\n' + ux11 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + body + '\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP']) { const re = new RegExp(bad); const m = out.replace(/mfml-/g, '').match(re); if (m) throw new Error('brand leak: ' + bad); }
fs.writeFileSync('src/unit-11.html', out);
console.log('assembled src/unit-11.html', out.length, 'bytes;', (out.match(/class="check reveal"/g) || []).length, 'checks;', (out.match(/class="widget reveal"/g) || []).length, 'widgets;', (out.match(/class="prob reveal"/g) || []).length, 'problems;', (out.match(/class="derive reveal"/g) || []).length, 'derives');
