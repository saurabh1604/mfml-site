/* Assemble src/unit-09.html from the Unit 8 chrome + the Unit 9 fragments in tpl/u9-*. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const u8 = R('src/unit-08.html');
const TITLE = 'Gradient Descent';
const DESC = 'Walking downhill in the fog: the descent rule proved, the step-size speed limit 2/λmax and the zig-zag it causes, exact line search and why the next gradient is perpendicular, bracketing, learning-rate schedules and the bold driver, gradient checking, and stochastic gradient descent — why a random spoonful of the data points the right way.';

const ALGCSS = `details.algebra{max-width:var(--prose);margin:1.6rem auto .4rem;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--surface-2) 55%,transparent);padding:.1rem 1.1rem .4rem}
details.algebra>summary{cursor:pointer;font-family:var(--ui);font-weight:700;font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);padding:.75rem 0;list-style:none}
details.algebra>summary::-webkit-details-marker{display:none}
details.algebra>summary::before{content:"▸  ";color:var(--s4)} details.algebra[open]>summary::before{content:"▾  "}
details.algebra>summary:hover{color:var(--ink)}
details.algebra>.derive{margin:.8rem 0 1rem;max-width:none}`;
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
sub('/* ---- unit-8 additions ---- */', '/* ---- unit-8/9 additions ---- */\n' + ALGCSS);
if (/Unit 8|unit-08|u8-/.test(head)) throw new Error('head still mentions unit 8: ' + head.match(/.{30}(Unit 8|unit-08|u8-).{30}/)[0]);

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u8.slice(u8.indexOf('<body>'), u8.indexOf('<section class="hero-stage">'));
top = top.replace('/ Unit 8 · Taylor &amp; the Hessian', '/ Unit 9 · Gradient Descent');
top = top.replace('<span id="score-total">17</span>', '<span id="score-total">15</span>');
if (/Unit 8/.test(top)) throw new Error('topbar still says Unit 8');

/* ---- 3 · content: sections with widgets + practice spliced in ---- */
const widgets = R('tpl/u9-widgets.html');
const W = {};
widgets.split(/<!--@(W\d+)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) W[x] = arr[i + 1]; });
let body = ['a', 'b', 'c', 'd'].map(k => R(`tpl/u9-sec-${k}.html`)).join('\n');
for (const k of Object.keys(W)) { const m = `<!--@${k}-->`; if (!body.includes(m)) throw new Error('no placeholder for ' + k); body = body.replace(m, () => W[k].trimEnd()); }
/* proofs, folded away: <!--@ALG sid--> → a details drawer holding that section's derive boxes */
const DER = JSON.parse(R('tpl/u9-derives.json'));
body = body.replace(/<!--@ALG (\w+)-->/g, (m, sid) => { const d = DER[sid]; if (!d) throw new Error('no derives for ' + sid);
  return `  <details class="algebra reveal"><summary>If you want the algebra · ${d.length} ${d.length === 1 ? 'proof' : 'proofs'}, step by step</summary>\n` + d.map(x => x.trimEnd()).join('\n') + '\n  </details>'; });
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
