/* Assemble src/unit-14.html from the Unit 13 chrome + the Unit 14 fragments in tpl/u14-*.
   node assemble-u14.js   (then: node gen-site.js && node build.js unit-14.html) */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const u13 = R('src/unit-13.html');
const TITLE_ESC = 'Thinking in Probabilities';
const DESC = 'Every unit so far gave crisp answers; the world gives maybes. This unit teaches the language of uncertainty: distributions and their balance point, Bayes’ rule for turning evidence around, the bell curve and why it keeps appearing, the many-dimensional Gaussian whose contour is the covariance ellipse of Unit 12, likelihood and maximum-likelihood fitting — under which least squares falls out — and then softmax, entropy, cross-entropy and KL: how a machine turns scores into honest probabilities and learns with the gradient “prediction minus truth”.';

/* ---- 1 · head + CSS ---- */
let head = u13.slice(0, u13.indexOf('<style id="u13-extra">'));
const sub = (from, to) => { if (!head.includes(from)) throw new Error('head: missing ' + from.slice(0, 70)); head = head.split(from).join(to); };
sub('<title>Unit 13 · Support Vector Machines — The Math Behind the Machine</title>', `<title>Unit 14 · ${TITLE_ESC} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 13 · Support Vector Machines — The Math Behind the Machine">', `<meta property="og:title" content="Unit 14 · ${TITLE_ESC} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-13.html', 'https://linearalgebra.info/unit-14.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
sub('<style id="u13-cinema">', '<style id="u14-cinema">');
sub('CINEMA-U13', 'CINEMA-U14');
sub('/* ---- unit-8/9/10/11/13 additions ---- */', '/* ---- unit-8/9/10/11/13/14 additions ---- */');
if (/Unit 13|unit-13|u13-|U13/.test(head)) throw new Error('head still mentions unit 13: ' + head.match(/.{30}(Unit 13|unit-13|u13-|U13).{30}/)[0]);
head = head.trimEnd() + '\n<style id="u14-extra">\n' + R('tpl/u14-head.css').trimEnd() + '\n</style>\n</head>';

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u13.slice(u13.indexOf('<body>'), u13.indexOf('<section class="hero-stage">'));
if (!top.includes('/ Unit 13 · Support Vector Machines')) throw new Error('topbar crumb not found');
top = top.replace('/ Unit 13 · Support Vector Machines', '/ Unit 14 · Thinking in Probabilities');
if (/Unit 13|unit-13/.test(top)) throw new Error('topbar still says Unit 13');

/* ---- 3 · hero + sections + drawers + practice ---- */
let body = R('tpl/u14-hero.html').trimEnd() + '\n\n<main id="main-content" tabindex="-1">\n\n' +
  ['a', 'b', 'c', 'd'].map(k => R(`tpl/u14-sec-${k}.html`)).join('\n') + '\n</main>\n';
const DER = {};
R('tpl/u14-derives.html').split(/<!--@D (\w+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) DER[x] = arr[i + 1].split(/(?=  <div class="derive">)/).map(s => s.trimEnd()).filter(s => s.includes('class="derive"')); });
const usedDer = new Set();
body = body.replace(/<!--@ALG (\w+)-->/g, (m, sid) => { const d = DER[sid]; if (!d) throw new Error('no derives for ' + sid); usedDer.add(sid);
  return `  <details class="algebra reveal"><summary>If you want the algebra · ${d.length} ${d.length === 1 ? 'proof' : 'proofs'}, step by step</summary>\n` + d.join('\n') + '\n  </details>'; });
for (const k of Object.keys(DER)) if (!usedDer.has(k)) throw new Error('derive group never placed: ' + k);
body = body.replace('<!--@PRACTICE-->', () => R('tpl/u14-practice.html').trimEnd());
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

/* ---- 4 · scripts: house runtime (from Unit 11) + kit + widgets + UX v2 (from Unit 13) ---- */
const shared = R('tpl/u11-shared.js').split("'mfml-u11-checks'").join("'mfml-u14-checks'");
if (/u11/.test(shared.replace(/U11/g, ''))) throw new Error('shared runtime still mentions u11');
const ux = u13.slice(u13.lastIndexOf('/* ================= MBM-UX-V2'), u13.lastIndexOf('</script>\n</body>'));
const OLD_TAIL = '{"n":12,"t":"Principal Component Analysis"},{"n":13,"t":"Support Vector Machines"}]';
const NEW_TAIL = '{"n":12,"t":"Principal Component Analysis"},{"n":13,"t":"Support Vector Machines"},{"n":14,"t":"Thinking in Probabilities"},{"n":15,"t":"The Network, Whole"}]';
/* Unit 13's chrome already lists Units 14-15 once they are live; older chrome ends at 13 */
if (!ux.includes('var U = 13;') || !(ux.includes(OLD_TAIL) || ux.includes(NEW_TAIL))) throw new Error('ux block: anchors missing');
const ux14 = ux.replace('var U = 13;', 'var U = 14;')
  .replace(ux.includes(NEW_TAIL) ? NEW_TAIL : OLD_TAIL, '{"n":12,"t":"Principal Component Analysis"},{"n":13,"t":"Support Vector Machines"},{"n":14,"t":"Thinking in Probabilities"},{"n":15,"t":"The Network, Whole"}]');
if (!ux14.includes('var U = 14;') || !ux14.includes('{"n":15,"t":"The Network, Whole"}]') || (ux14.match(/"n":14,/g) || []).length !== 1) throw new Error('ux block not patched');
const JS = ['tpl/u14-kit.js', 'tpl/u14-shared.js', 'tpl/u14-hero.js', 'tpl/u14-w1.js', 'tpl/u14-w2.js', 'tpl/u14-w3.js', 'tpl/u14-w4.js'].filter(f => fs.existsSync(f));
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + shared.trimEnd() + '\n\n' + JS.map(f => R(f).trimEnd()).join('\n\n') + '\n\n})();\n' + ux14 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + body + '\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP']) { if (out.replace(/mfml-/g, '').includes(bad)) throw new Error('brand leak: ' + bad); }
for (const bad of [/exam paper/i, /question bank/i, /past paper/i, /\bexams?\b/i]) { const m = out.match(bad); if (m) throw new Error('forbidden phrase: ' + m[0]); }
if (/Unit 13 of|unit-13\.html#/.test(body.replace('<a href="unit-13.html">', ''))) { /* links back to Unit 13 are fine; nothing else should say "Unit 13 of" */ if (/Unit 13 of/.test(body)) throw new Error('body says Unit 13 of'); }
fs.writeFileSync('src/unit-14.html', out);
console.log('assembled src/unit-14.html', out.length, 'bytes;', nChecks, 'checks;', nWidgets, 'widgets (' + n3dW + ' in 3D, ' + n3d + ' stages);', nProbs, 'problems;', nDer, 'derives');
