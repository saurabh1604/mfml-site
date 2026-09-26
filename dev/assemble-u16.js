/* Assemble src/unit-16.html from the Unit 15 chrome + the Unit 16 fragments in tpl/u16-*.
   node assemble-u16.js   (then: node gen-site.js && node build.js unit-16.html) */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const u15 = R('src/unit-15.html');
const has = f => fs.existsSync(f);
const TITLE = 'Words as Vectors';
const DESC = 'How a machine learns what words mean from nothing but text. Guess the next word by counting and score the guesser by its perplexity; know a word by the company it keeps, weigh that company with TF-IDF and PMI, and squeeze it with the SVD; then stop counting and start predicting with word2vec\'s two games, CBOW and skip-gram, made cheap by negative sampling; see why counting and predicting meet (GloVe); and find that meaning is a direction: king − man + woman lands next to queen.';
const UNITS_OLD = '{"n":13,"t":"Support Vector Machines"},{"n":14,"t":"Thinking in Probabilities"},{"n":15,"t":"The Network, Whole"}]';
const UNITS_NEW = '{"n":13,"t":"Support Vector Machines"},{"n":14,"t":"Thinking in Probabilities"},{"n":15,"t":"The Network, Whole"},{"n":16,"t":"Words as Vectors"},{"n":17,"t":"Machines with Memory"},{"n":18,"t":"Attention and Transformers"}]';

/* ---- 1 · head + CSS ---- */
let head = u15.slice(0, u15.indexOf('</head>'));
const sub = (from, to) => { if (!head.includes(from)) throw new Error('head: missing ' + from.slice(0, 70)); head = head.split(from).join(to); };
sub('<title>Unit 15 · The Network, Whole — The Math Behind the Machine</title>', `<title>Unit 16 · ${TITLE} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 15 · The Network, Whole — The Math Behind the Machine">', `<meta property="og:title" content="Unit 16 · ${TITLE} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-15.html', 'https://linearalgebra.info/unit-16.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
sub('<style id="u15-cinema">', '<style id="u16-cinema">');
sub('CINEMA-U15', 'CINEMA-U16');
sub('/* ---- unit-8/9/10/11/13/15 additions ---- */', '/* ---- unit-8/9/10/11/13/15/16 additions ---- */');
/* drop Unit 15's own extra stylesheet (the last <style> of the head) */
const x0 = head.indexOf('<style id="u15-extra">'); if (x0 < 0) throw new Error('no u15-extra style');
const x1 = head.indexOf('</style>', x0); head = head.slice(0, x0) + head.slice(x1 + '</style>'.length);
if (/Unit 15|unit-15|u15-|U15|The Network, Whole/.test(head)) throw new Error('head still mentions unit 15: ' + head.match(/.{30}(Unit 15|unit-15|u15-|U15|The Network, Whole).{30}/)[0]);
/* word2vec widgets (16-w2v): tpl/u16-w2v.css follows u16-head.css, only if it exists */
let css16 = R('tpl/u16-head.css').trimEnd();
if (has('tpl/u16-w2v.css')) css16 += '\n/* ---- the word2vec widgets (tpl/u16-w2v.css) ---- */\n' + R('tpl/u16-w2v.css').trimEnd();
head = head.trimEnd() + '\n<style id="u16-extra">\n' + css16 + '\n</style>\n</head>';

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u15.slice(u15.indexOf('<body>'), u15.indexOf('<section class="hero-stage">'));
if (!top.includes('/ Unit 15 · The Network, Whole')) throw new Error('crumb not found');
top = top.replace('/ Unit 15 · The Network, Whole', '/ Unit 16 · ' + TITLE);
if (/Unit 15|unit-15|u15/.test(top)) throw new Error('topbar still says Unit 15');

/* ---- 3 · hero + sections + drawers + practice ---- */
const SECS = ['a', 'b', 'c', 'd', 'e'].map(k => `tpl/u16-sec-${k}.html`).filter(has);
let body = R('tpl/u16-hero.html').trimEnd() + '\n\n<main id="main-content" tabindex="-1">\n\n' +
  SECS.map(R).join('\n') + '\n</main>\n';
/* ---- assembler contract with 16-w2v: every <!--@W2V name--> becomes the fragment of tpl/u16-w2v.html that starts with
   <!--@W2VFRAG name--> (fragments are separated by these markers). Missing file/fragment → a visible stub + a warning. ---- */
const W2V_NAMES = ['window', 'cbow', 'skipgram', 'lab'], FRAG = {};
if (has('tpl/u16-w2v.html')) R('tpl/u16-w2v.html').split(/<!--@W2VFRAG (\w+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) FRAG[x] = arr[i + 1].trim(); });
const stubs = [];
for (const n of W2V_NAMES) { const k = (body.match(new RegExp('<!--@W2V ' + n + '-->', 'g')) || []).length; if (k > 1 || (k === 0 && body.includes('<!--@W2V '))) throw new Error('W2V slot "' + n + '" appears ' + k + ' times (want exactly 1)'); }
body = body.replace(/<!--@W2V (\w+)-->/g, (m, name) => {
  if (!W2V_NAMES.includes(name)) throw new Error('unknown W2V slot: ' + name);
  if (FRAG[name]) return FRAG[name];
  stubs.push(name);
  return `  <div class="widget reveal" id="w-${name}"><div class="widget-head"><span class="w-title">The ${name} widget</span><span class="w-sub">Being built in this round.</span></div><p class="try"><b>Try:</b> come back soon.</p></div>`; });
for (const k of Object.keys(FRAG)) if (!W2V_NAMES.includes(k)) throw new Error('tpl/u16-w2v.html has an unknown fragment: ' + k);
const DER = {};
R('tpl/u16-derives.html').split(/<!--@D (\w+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) DER[x] = arr[i + 1].split(/(?=  <div class="derive">)/).map(s => s.trimEnd()).filter(s => s.includes('class="derive"')); });
const usedDer = new Set();
body = body.replace(/<!--@ALG (\w+)-->/g, (m, sid) => { const d = DER[sid]; if (!d) throw new Error('no derives for ' + sid); usedDer.add(sid);
  return `  <details class="algebra reveal"><summary>If you want the algebra · ${d.length} ${d.length === 1 ? 'proof' : 'proofs'}, step by step</summary>\n` + d.join('\n') + '\n  </details>'; });
for (const k of Object.keys(DER)) if (!usedDer.has(k)) throw new Error('derive group never placed: ' + k);
body = body.replace('<!--@PRACTICE-->', () => R('tpl/u16-practice.html').trimEnd());
if (/<!--@/.test(body)) throw new Error('unfilled placeholder: ' + body.match(/<!--@[^>]*-->/)[0]);

/* true counts → hero chips and the check total */
const nChecks = (body.match(/class="check reveal"/g) || []).length, nWidgets = (body.match(/<div class="widget reveal[^"]*"/g) || []).length,
  n3d = (body.match(/class="stage3d[^"]*"/g) || []).length, nProbs = (body.match(/class="prob reveal"/g) || []).length,
  nDer = (body.match(/class="derive"/g) || []).length;
const n3dW = [...body.matchAll(/<div class="widget reveal[^"]*" id="(w-[^"]+)"[\s\S]*?(?=<div class="widget reveal|<\/section>)/g)].filter(m => /class="stage3d/.test(m[0])).length;
body = body.replace('@@WIDGETS@@', nWidgets).replace('@@W3D@@', n3dW).replace('@@CHECKS@@', nChecks).replace('@@DERIVES@@', nDer).replace('@@PROBS@@', nProbs);
if (/@@\w+@@/.test(body)) throw new Error('unfilled count: ' + body.match(/@@\w+@@/)[0]);
const ids = [...body.matchAll(/data-check="(c\d+)"/g)].map(m => m[1]); if (new Set(ids).size !== ids.length) throw new Error('duplicate check id');
top = top.replace(/<span id="score-total">\d+<\/span>/, `<span id="score-total">${nChecks}</span>`);
if (!top.includes(`<span id="score-total">${nChecks}</span>`)) throw new Error('score-total not patched');

/* ---- 4 · scripts: house runtime (from Unit 11) + kit + shared + hero + widgets + UX v2 ---- */
const shared = R('tpl/u11-shared.js').split("'mfml-u11-checks'").join("'mfml-u16-checks'");
if (/u11/.test(shared.replace(/U11/g, ''))) throw new Error('shared runtime still mentions u11');
const ux = u15.slice(u15.lastIndexOf('/* ================= MBM-UX-V2'), u15.lastIndexOf('</script>\n</body>'));
/* Unit 15's chrome lists 13-15, or 13-18 once Units 16-18 are wired in */
if (!ux.includes('var U = 15;') || !(ux.includes(UNITS_OLD) || ux.includes(UNITS_NEW))) throw new Error('ux block of unit 15 has changed shape');
const ux16 = ux.replace('var U = 15;', 'var U = 16;').replace(ux.includes(UNITS_NEW) ? UNITS_NEW : UNITS_OLD, UNITS_NEW);
if (!ux16.includes('var U = 16;') || !ux16.includes(UNITS_NEW) || (ux16.match(/"n":16,/g) || []).length !== 1) throw new Error('ux block not patched');
/* tpl/u16-w2v.js (16-w2v) comes last; it wraps itself and must not depend on the files before it */
const JS = ['tpl/u16-kit.js', 'tpl/u16-shared.js', 'tpl/u16-hero.js', 'tpl/u16-w1.js', 'tpl/u16-w2.js', 'tpl/u16-w3.js', 'tpl/u16-w4.js', 'tpl/u16-w2v.js'].filter(has);
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + shared.trimEnd() + '\n\n' + JS.map(f => '/* ---- ' + f.replace('tpl/', '') + ' ---- */\n' + R(f).trimEnd()).join('\n\n') + '\n\n})();\n' + ux16 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + body + '\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP']) { if (out.replace(/mfml-/g, '').includes(bad)) throw new Error('brand leak: ' + bad); }
for (const bad of [/exam paper/i, /question bank/i, /past paper/i, /\bexams?\b/i]) { const m = out.match(bad); if (m) throw new Error('forbidden phrase: ' + m[0]); }
if (/mfml-u15|u15-|U15|unit-15\.html#|Unit 15 of 20/.test(out.replace('<a href="unit-15.html">← Unit 15 · The Network, Whole</a>', ''))) {
  const m = out.match(/.{40}(mfml-u15|u15-|U15|Unit 15 of 20).{40}/); if (m) throw new Error('unit 15 leftover: ' + m[0]); }
fs.writeFileSync('src/unit-16.html', out);
if (stubs.length) console.log('WARNING: word2vec widget stub(s) used for: ' + stubs.join(', ') + ' (tpl/u16-w2v.html missing or incomplete)');
console.log('assembled src/unit-16.html', out.length, 'bytes;', nChecks, 'checks;', nWidgets, 'widgets (' + n3dW + ' in 3D, ' + n3d + ' stages);', nProbs, 'problems;', nDer, 'derives;', 'sections:', SECS.map(f => f.replace('tpl/u16-sec-', '').replace('.html', '')).join(''), '· JS:', JS.map(f => f.replace('tpl/u16-', '')).join(' '));
