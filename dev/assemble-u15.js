/* Assemble src/unit-15.html from the Unit 13 chrome + the Unit 15 fragments in tpl/u15-*.
   The playground (#w-play, Agent B) is pulled in from tpl/u15-play.{css,html,js} when those files exist.
   node assemble-u15.js   (then: node gen-site.js && node build.js unit-15.html) */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const has = f => fs.existsSync(f);
const u13 = R('src/unit-13.html');
const TITLE_ESC = 'The Network, Whole';
const DESC = 'A real neural network with every number visible. A layer is a matrix, a shift and a bend; without the bend every stack of layers collapses into one matrix, and with it enough folds can trace any shape. Then the full forward pass and the full backward pass of a 2-3-2-1 network, worked by hand: at the output the whole gradient is just prediction minus truth, and everything before it is local slope times incoming blame, done with matrices. Finish in a playground where you build a network and watch values flow forward and blame flow back.';

/* ---- 1 · head + CSS ---- */
let head = u13.slice(0, u13.indexOf('</head>'));
const sub = (from, to) => { if (!head.includes(from)) throw new Error('head: missing ' + from.slice(0, 70)); head = head.split(from).join(to); };
sub('<title>Unit 13 · Support Vector Machines — The Math Behind the Machine</title>', `<title>Unit 15 · ${TITLE_ESC} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 13 · Support Vector Machines — The Math Behind the Machine">', `<meta property="og:title" content="Unit 15 · ${TITLE_ESC} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-13.html', 'https://linearalgebra.info/unit-15.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
sub('<style id="u13-cinema">', '<style id="u15-cinema">');
sub('CINEMA-U13', 'CINEMA-U15');
sub('/* ---- unit-8/9/10/11/13 additions ---- */', '/* ---- unit-8/9/10/11/13/15 additions ---- */');
/* drop Unit 13's own extra stylesheet (it is the last <style> of the head) */
const x0 = head.indexOf('<style id="u13-extra">'); if (x0 < 0) throw new Error('no u13-extra style');
const x1 = head.indexOf('</style>', x0); head = head.slice(0, x0) + head.slice(x1 + '</style>'.length);
if (/Unit 13|unit-13|u13-|U13/.test(head)) throw new Error('head still mentions unit 13: ' + head.match(/.{30}(Unit 13|unit-13|u13-|U13).{30}/)[0]);
let css = R('tpl/u15-head.css').trimEnd();
if (has('tpl/u15-play.css')) css += '\n/* ---- the playground (#w-play) ---- */\n' + R('tpl/u15-play.css').trimEnd();
head = head.trimEnd() + '\n<style id="u15-extra">\n' + css + '\n</style>\n</head>';

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u13.slice(u13.indexOf('<body>'), u13.indexOf('<section class="hero-stage">'));
top = top.replace('/ Unit 13 · Support Vector Machines', '/ Unit 15 · The Network, Whole');
if (/Unit 13/.test(top)) throw new Error('topbar still says Unit 13');

/* ---- 3 · hero + sections + drawers + practice ---- */
let body = R('tpl/u15-hero.html').trimEnd() + '\n\n<main id="main-content" tabindex="-1">\n\n' +
  ['a', 'b', 'c', 'd'].map(k => R(`tpl/u15-sec-${k}.html`)).join('\n') + '\n</main>\n';
const DER = {};
R('tpl/u15-derives.html').split(/<!--@D (\w+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) DER[x] = arr[i + 1].split(/(?=  <div class="derive">)/).map(s => s.trimEnd()).filter(s => s.includes('class="derive"')); });
const usedDer = new Set();
body = body.replace(/<!--@ALG (\w+)-->/g, (m, sid) => { const d = DER[sid]; if (!d) throw new Error('no derives for ' + sid); usedDer.add(sid);
  return `  <details class="algebra reveal"><summary>If you want the algebra · ${d.length} ${d.length === 1 ? 'proof' : 'proofs'}, step by step</summary>\n` + d.join('\n') + '\n  </details>'; });
for (const k of Object.keys(DER)) if (!usedDer.has(k)) throw new Error('derive group never placed: ' + k);
body = body.replace('<!--@PRACTICE-->', () => R('tpl/u15-practice.html').trimEnd());
if (!body.includes('<!--@PLAY-->')) throw new Error('no <!--@PLAY--> slot in s11');
body = body.replace('<!--@PLAY-->', () => has('tpl/u15-play.html') ? R('tpl/u15-play.html').trimEnd()
  : '  <div class="widget reveal" id="w-play"><div class="widget-head"><span class="w-title">The playground</span><span class="w-sub">Being built — coming in this round.</span></div><p class="try"><b>Try:</b> come back soon.</p></div>');
if (/<!--@/.test(body)) throw new Error('unfilled placeholder: ' + body.match(/<!--@[^>]*-->/)[0]);

/* true counts → hero chips and the check total */
const nChecks = (body.match(/class="check reveal"/g) || []).length, nWidgets = (body.match(/<div class="widget reveal"/g) || []).length,
  n3d = (body.match(/class="stage3d[^"]*"/g) || []).length, nProbs = (body.match(/class="prob reveal"/g) || []).length,
  nDer = (body.match(/class="derive"/g) || []).length;
const n3dW = [...body.matchAll(/<div class="widget reveal" id="(w-[^"]+)"[\s\S]*?(?=<div class="widget reveal"|<\/section>)/g)].filter(m => /class="stage3d/.test(m[0])).length;
body = body.replace('@@WIDGETS@@', nWidgets).replace('@@W3D@@', n3dW).replace('@@CHECKS@@', nChecks).replace('@@DERIVES@@', nDer).replace('@@PROBS@@', nProbs).replace('@@PROBS2@@', nProbs);
if (/@@\w+@@/.test(body)) throw new Error('unfilled count: ' + body.match(/@@\w+@@/)[0]);
top = top.replace('<span id="score-total">20</span>', `<span id="score-total">${nChecks}</span>`);
if (!top.includes(`<span id="score-total">${nChecks}</span>`)) throw new Error('score-total not patched');

/* ---- 4 · scripts: house runtime (from Unit 11) + kit + widgets + playground + UX v2 ---- */
const shared = R('tpl/u11-shared.js').split("'mfml-u11-checks'").join("'mfml-u15-checks'");
if (/u11/.test(shared.replace(/U11/g, ''))) throw new Error('shared runtime still mentions u11');
const ux = u13.slice(u13.lastIndexOf('/* ================= MBM-UX-V2'), u13.lastIndexOf('</script>\n</body>'));
const ux15 = ux.replace('var U = 13;', 'var U = 15;')
  .replace(ux.includes('{"n":13,"t":"Support Vector Machines"},{"n":14,"t":"Thinking in Probabilities"},{"n":15,"t":"The Network, Whole"}]') ? '{"n":13,"t":"Support Vector Machines"},{"n":14,"t":"Thinking in Probabilities"},{"n":15,"t":"The Network, Whole"}]' : '{"n":13,"t":"Support Vector Machines"}]', '{"n":13,"t":"Support Vector Machines"},{"n":14,"t":"Thinking in Probabilities"},{"n":15,"t":"The Network, Whole"}]');
if (!ux15.includes('var U = 15;') || !ux15.includes('{"n":14,"t":"Thinking in Probabilities"},{"n":15,"t":"The Network, Whole"}]') || (ux15.match(/"n":15,/g) || []).length !== 1) throw new Error('ux block not patched');
const JS = ['tpl/u15-kit.js', 'tpl/u15-shared.js', 'tpl/u15-hero.js', 'tpl/u15-w1.js', 'tpl/u15-w2.js', 'tpl/u15-w3.js', 'tpl/u15-w4.js', 'tpl/u15-play.js'].filter(has);
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + shared.trimEnd() + '\n\n' + JS.map(f => '/* ---- ' + f.replace('tpl/', '') + ' ---- */\n' + R(f).trimEnd()).join('\n\n') + '\n\n})();\n' + ux15 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + body + '\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP']) { if (out.replace(/mfml-/g, '').includes(bad)) throw new Error('brand leak: ' + bad); }
for (const bad of [/exam paper/i, /question bank/i, /past paper/i, /\bexams?\b/i]) { const m = out.match(bad); if (m) throw new Error('forbidden phrase: ' + m[0]); }
if (/mfml-u13|u13-|U13/.test(out)) throw new Error('unit 13 leftover: ' + out.match(/.{40}(mfml-u13|u13-|U13).{40}/)[0]);
fs.writeFileSync('src/unit-15.html', out);
console.log('assembled src/unit-15.html', out.length, 'bytes;', nChecks, 'checks;', nWidgets, 'widgets (' + n3dW + ' in 3D, ' + n3d + ' stages);', nProbs, 'problems;', nDer, 'derives;', 'JS:', JS.map(f => f.replace('tpl/u15-', '')).join(' '));
