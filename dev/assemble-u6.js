/* Assemble src/unit-06.html from the shared unit-05 chrome + the new Unit 6 content. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');

const TITLE = 'Differentiation';
const DESC = 'Which way is down? From the limit definition and the chain rule to Taylor polynomials, partial derivatives, the gradient, Jacobians, and the matrix multiplication that powers backpropagation.';

/* ---- 1 · head: retitle the unit-05 chrome ---- */
let head = R('tpl/head.html');
const sub = (from, to) => {
  if (!head.includes(from)) throw new Error('head: missing ' + from.slice(0, 60));
  head = head.split(from).join(to);
};
sub('<title>Unit 5 · Matrix Decompositions &amp; SVD — The Math Behind the Machine</title>',
    `<title>Unit 6 · ${TITLE} — The Math Behind the Machine</title>`);
sub('<meta property="og:title" content="Unit 5 · Matrix Decompositions &amp; SVD — The Math Behind the Machine">',
    `<meta property="og:title" content="Unit 6 · ${TITLE} — The Math Behind the Machine">`);
sub('https://linearalgebra.info/unit-05.html', 'https://linearalgebra.info/unit-06.html');
head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`);
head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`);
if (head.includes('Unit 5')) throw new Error('head still mentions Unit 5');

/* Unit 6 needs a couple of extra utility classes on top of the shared sheet. */
const EXTRA_CSS = `
/* ---- unit-6 additions ---- */
.presets{display:flex;flex-wrap:wrap;gap:.4rem}
button.preset{font-family:var(--sans);font-size:.8rem;font-weight:650;border:1px solid var(--ring);background:var(--page);color:var(--ink-2);border-radius:10px;padding:.34rem .8rem;cursor:pointer}
button.preset:hover{border-color:var(--s1);color:var(--s1)}
.stagebar{font-family:var(--sans)}
.prob-head{flex-wrap:wrap;row-gap:.35rem}
.prob-head .chip{white-space:normal}
/* wide inline math (matrices in a sentence or an option) scrolls instead of stretching the page */
@media (max-width:700px){
  .pq .katex,.check .opts button .katex,.prose .katex,.pstep .katex{
    max-width:100%;overflow-x:auto;overflow-y:hidden;display:inline-block;vertical-align:middle}
}
`;
head = head.replace('</style>', EXTRA_CSS + '</style>');

/* ---- 2 · body top: retitle the breadcrumb + score total ---- */
let bodytop = R('tpl/bodytop.html')
  .replace('/ Unit 5 · Decompositions &amp; SVD', `/ Unit 6 · ${TITLE}`)
  .replace('<span id="score-total">12</span>', '<span id="score-total">12</span>');

/* ---- 3 · content ---- */
const content = R('tpl/u6-sections-a.html') + '\n' + R('tpl/u6-sections-b.html') + '\n' + R('tpl/u6-practice.html');

/* ---- 4 · script: shared runtime, checks/toc rewired to u6, widgets, UX v2 ---- */
const shared = R('tpl/js-shared.js');                       // opens with <script>
const checksToc = R('tpl/js-checks-toc.js').split('mfml-u5-checks').join('mfml-u6-checks');
if (checksToc.includes('u5')) throw new Error('checks block still references u5');
const widgets = R('tpl/u6-widgets.js');

/* UX v2 block: same code, but this unit is number 6 and the switcher knows 6 units */
let ux = R('tpl/js-uxv2.js');
ux = ux.replace('var U = 5;', 'var U = 6;');
if (!ux.includes('var U = 6;')) throw new Error('UX block: unit number not set');
const UNITS6 = [
  { n: 1, t: 'Systems of Linear Equations' }, { n: 2, t: 'Vector Spaces' },
  { n: 3, t: 'Analytic Geometry' }, { n: 4, t: 'Determinants & Eigenvalues' },
  { n: 5, t: 'Decompositions & SVD' }, { n: 6, t: 'Differentiation' },
];
ux = ux.replace(/var UNITS = \[[^\]]*\];/, 'var UNITS = ' + JSON.stringify(UNITS6) + ';');
if (!ux.includes('"Differentiation"')) throw new Error('UX block: UNITS list not replaced');

/* js-shared.js opens the page-wide IIFE; it is closed after the widgets,
   exactly as in unit-05, so the UX v2 block sits at top level. */
const out = head + '\n</head>\n' + bodytop + '\n' + content + '\n'
          + shared + '\n' + checksToc + '\n' + widgets + '\n})();\n' + ux;

/* fail loudly rather than shipping a broken script */
{
  const i = out.lastIndexOf('<script>'), j = out.lastIndexOf('</script>');
  const js = out.slice(i + 8, j);
  let d = 0, k = 0, inS = 0, q = '', inC = 0, inB = 0;
  while (k < js.length) {
    const c = js[k], n = js[k + 1];
    if (inC) { if (c === '\n') inC = 0; k++; continue; }
    if (inB) { if (c === '*' && n === '/') { inB = 0; k += 2; continue; } k++; continue; }
    if (inS) { if (c === '\\') { k += 2; continue; } if (c === q) inS = 0; k++; continue; }
    if (c === '/' && n === '/') { inC = 1; k += 2; continue; }
    if (c === '/' && n === '*') { inB = 1; k += 2; continue; }
    if (c === '"' || c === "'" || c === '`') { inS = 1; q = c; k++; continue; }
    if (c === '{') d++;
    if (c === '}') d--;
    k++;
  }
  if (d !== 0) throw new Error('assembled script is unbalanced (brace depth ' + d + ')');
}

fs.writeFileSync('src/unit-06.html', out);
console.log('src/unit-06.html written —', out.length, 'chars');
const count = (re) => (out.match(re) || []).length;
console.log('  sections :', count(/<section class="unit"/g));
console.log('  widgets  :', count(/class="widget"/g));
console.log('  checks   :', count(/<div class="check"/g));
console.log('  problems :', count(/<div class="prob"/g));
console.log('  solutions:', count(/<details class="sol"/g));
console.log('  answers  :', count(/class="pans"/g));
