/* Assemble src/unit-08.html from the Unit 7 chrome + the Unit 8 fragments in tpl/u8-*. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const u7 = R('src/unit-07.html');
const TITLE = 'Taylor &amp; MacLaurin Series';
const DESC = 'Where the Taylor series comes from and exactly how big the lie is when you cut it short: Rolle, the mean value theorem, the remainder proved, then two variables and the Hessian — the judge that tells a bowl from a dome from a saddle.';

/* ---- 1 · head + CSS (everything up to and including </head>) ---- */
let head = u7.slice(0, u7.indexOf('</head>') + '</head>'.length);
const sub = (from, to, opt) => { if (!head.includes(from)) { if (opt) return; throw new Error('head: missing ' + from.slice(0, 70)); } head = head.split(from).join(to); };
sub('<title>Unit 7 · Backpropagation &amp; Automatic Differentiation — The Math Behind the Machine</title>', `<title>Unit 8 · ${TITLE} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 7 · Backpropagation &amp; Automatic Differentiation — The Math Behind the Machine">', `<meta property="og:title" content="Unit 8 · ${TITLE} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-07.html', 'https://linearalgebra.info/unit-08.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
sub('<style id="u7-cinema">', '<style id="u8-cinema">');
sub('CINEMA-U7', 'CINEMA-U8');
if (/Unit 7|unit-07|u7-/.test(head)) throw new Error('head still mentions unit 7: ' + head.match(/.{30}(Unit 7|unit-07|u7-).{30}/)[0]);
/* unit-8 additions */
const EXTRA = `
/* ---- unit-8 additions ---- */
.stage3d.tall{height:500px}
@media (max-width:640px){.stage3d.tall{height:320px}}
.widget .stagebar{margin:.2rem 0 .4rem}
.widget .stagebar button{font-size:.8rem}
.readout .mx{font-size:.84em}
@media (max-width:640px){ #ld-svg{min-width:540px} }
/* the sandwich widget */
.sand{display:flex;flex-wrap:wrap;align-items:center;gap:.9rem 1.1rem;font-family:var(--mono);font-size:.95rem;padding:.6rem .2rem .2rem}
.sand .piece{display:flex;flex-direction:column;align-items:center}
.sand .vec,.sand .mat{display:inline-grid;gap:5px;padding:.45rem .6rem;position:relative}
.sand .vec::before,.sand .vec::after,.sand .mat::before,.sand .mat::after{content:"";position:absolute;top:0;bottom:0;width:.45rem;border:1.6px solid var(--ink-2);opacity:.8}
.sand .vec::before,.sand .mat::before{left:0;border-right:0;border-radius:.35rem 0 0 .35rem}
.sand .vec::after,.sand .mat::after{right:0;border-left:0;border-radius:0 .35rem .35rem 0}
.sand .cell{min-width:2.7rem;padding:.32rem .5rem;border-radius:7px;text-align:center;border:1px solid var(--line);background:color-mix(in srgb,var(--surface-2) 70%,transparent);transition:all .16s var(--ease);cursor:default;font-weight:600}
.sand .cell.d{color:var(--s1);border-color:color-mix(in srgb,var(--s1) 45%,transparent)}
.sand .cell.o1{color:var(--s2);border-color:color-mix(in srgb,var(--s2) 45%,transparent)}
.sand .cell.o2{color:var(--s7);border-color:color-mix(in srgb,var(--s7) 45%,transparent)}
.sand .cell.hv{color:var(--s4);border-color:color-mix(in srgb,var(--s4) 45%,transparent)}
.sand .cell.hl{transform:scale(1.08);box-shadow:var(--glow-1);background:color-mix(in srgb,var(--ink) 12%,transparent);color:var(--ink)}
.sand .lab{font-family:var(--ui);font-size:.72rem;color:var(--ink-muted);margin-top:.35rem}
.sand .eq{font-size:1.4rem;color:var(--ink-muted);align-self:flex-start;margin-top:1.2rem}
.sand .sum{flex:1 1 100%;display:flex;flex-wrap:wrap;gap:.35rem .45rem;align-items:center;font-size:.92rem;line-height:1.6;margin-top:.2rem}
.sand .plus{color:var(--ink-muted)}
.sand .term{padding:.22rem .55rem;border-radius:7px;border:1px solid var(--line);background:color-mix(in srgb,var(--surface-2) 70%,transparent);transition:all .16s var(--ease);cursor:default}
.sand .term.d{color:var(--s1)} .sand .term.o1{color:var(--s2)} .sand .term.o2{color:var(--s7)}
.sand .term.hl{transform:scale(1.06);box-shadow:var(--glow-2);background:color-mix(in srgb,var(--ink) 12%,transparent);color:var(--ink)}
@media (max-width:640px){.sand{font-size:.84rem}.sand .cell{min-width:2.2rem;padding:.26rem .35rem}}
</style>`;
head = head.replace(/<\/style>\s*<\/head>/, EXTRA + '\n</head>');

/* ---- 2 · body top (skip link, topbar, toc) ---- */
let top = u7.slice(u7.indexOf('<body>'), u7.indexOf('<section class="hero-stage">'));
top = top.replace('/ Unit 7 · Backprop &amp; Auto-diff', '/ Unit 8 · Taylor &amp; the Hessian');
top = top.replace('<span id="score-total">16</span>', '<span id="score-total">17</span>');
if (/Unit 7/.test(top)) throw new Error('topbar still says Unit 7');

/* ---- 3 · content: sections with widgets + practice spliced in ---- */
const widgets = R('tpl/u8-widgets.html');
const W = {};
widgets.split(/<!--@(W\d)-->/).slice(1).forEach((x, i, arr) => { if (i % 2 === 0) W[x] = arr[i + 1]; });
let body = ['a', 'b', 'c', 'd'].map(k => R(`tpl/u8-sec-${k}.html`)).join('\n');
const MAT = '<!-- ================= 11 · THE HESSIAN AS JUDGE ================= -->';
if (!body.includes(MAT)) throw new Error('no judge marker');
body = body.replace(MAT, R('tpl/u8-sec-mat.html').trimEnd() + '\n\n' + MAT);
for (const k of Object.keys(W)) { const m = `<!--@${k}-->`; if (!body.includes(m)) throw new Error('no placeholder for ' + k); body = body.replace(m, W[k].trimEnd()); }
body = body.replace('<!--@PRACTICE-->', R('tpl/u8-practice.html').trimEnd());
if (/<!--@/.test(body)) throw new Error('unfilled placeholder: ' + body.match(/<!--@[^>]*-->/)[0]);

/* ---- 4 · scripts: shared runtime + widgets + UX v2 ---- */
const ux = u7.slice(u7.lastIndexOf('/* ================= MBM-UX-V2'), u7.lastIndexOf('</script>\n</body>'));
let ux8 = ux.replace('var U = 7;', 'var U = 8;')
  .replace('{"n":7,"t":"Backprop & Auto-diff"}]', '{"n":7,"t":"Backprop & Auto-diff"},{"n":8,"t":"Taylor & MacLaurin"}]');
if (!ux8.includes('var U = 8;') || !ux8.includes('"n":8')) throw new Error('ux block not patched');
const script = '<!--@cinema-js-->\n<script>\n(function(){\n"use strict";\n' + R('tpl/u8-shared.js').trimEnd() + '\n\n' + R('tpl/u8-widgets.js').trimEnd() + '\n\n})();\n' + ux8 + '</script>\n</body>\n</html>\n';

const out = head + '\n' + top + body + '\n' + script;
for (const bad of ['MFML', 'ZC416', 'BITS', 'WILP']) { const re = new RegExp(bad); const m = out.replace(/mfml-/g, '').match(re); if (m) throw new Error('brand leak: ' + bad); }
fs.writeFileSync('src/unit-08.html', out);
console.log('assembled src/unit-08.html', out.length, 'bytes;', (out.match(/class="check reveal"/g) || []).length, 'checks;', (out.match(/class="widget reveal"/g) || []).length, 'widgets;', (out.match(/class="prob reveal"/g) || []).length, 'problems;', (out.match(/class="derive reveal"/g) || []).length, 'derives');
