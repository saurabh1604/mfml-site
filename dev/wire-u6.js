/* Wire Unit 6 into the rest of the site, and repair the empty "Next up" cards
   that units 1–5 have been shipping since the practice arenas were added.
   Idempotent. */
const fs = require('fs');
const must = (cond, msg) => { if (!cond) throw new Error(msg); };

/* ---------------- 1 · restore the next-card on units 1–5 ---------------- */
const NEXT = {
  '01': ['unit-02.html', 'Unit 2 · Vector Spaces',
    'You can now solve \\(A\\mathbf{x}=\\mathbf{b}\\) and read off its three fates. Unit 2 asks the question underneath: what kind of space are these solutions living in? Groups, subspaces, span, independence, basis, dimension — the architecture every later unit is built on.'],
  '02': ['unit-03.html', 'Unit 3 · Analytic Geometry',
    'Vector spaces gave you a board to play on, but nothing on it has a size or an angle yet. Unit 3 installs the ruler and the protractor — norms, inner products, orthogonality — and shows that choosing how to measure similarity is half of machine learning.'],
  '03': ['unit-04.html', 'Unit 4 · Determinants, Eigenvalues &amp; the Spectral Theorem',
    'With lengths and angles in hand, Unit 4 goes looking for a matrix\'s fingerprints: the determinant as a volume dial, the directions a matrix cannot turn, and the theorem that lets a symmetric matrix be rebuilt as turn · stretch · turn back.'],
  '04': ['unit-05.html', 'Unit 5 · Matrix Decompositions &amp; SVD',
    'Eigenvalues work beautifully — right up until a matrix is not square, or lacks enough eigenvectors. Unit 5 climbs the ladder from the spectral theorem to the SVD, the decomposition that never fails, and ends by compressing an image with it live.'],
  '05': ['unit-06.html', 'Unit 6 · Differentiation',
    'Part I is complete: you can move, measure, and decompose space. Part II asks how things <em>change</em>. Unit 6 builds the derivative from a shrinking secant up to the Jacobian matrices behind backpropagation — and answers the question every model is really asking: which way is down?'],
};
for (const [u, [href, title, blurb]] of Object.entries(NEXT)) {
  const f = `src/unit-${u}.html`;
  let h = fs.readFileSync(f, 'utf8');
  const stub = '<div class="next-card">\n    <div class="kicker" style="color:var(--ink-muted)">Next up</div>\n';
  if (!h.includes(stub)) { console.log(`unit-${u}: next-card already filled, skipped`); continue; }
  must(h.split(stub).length === 2, `unit-${u}: next-card stub not unique`);
  h = h.replace(stub,
`<div class="next-card">
    <div class="kicker" style="color:var(--ink-muted)">Next up</div>
    <p style="margin:.35rem 0 .6rem"><strong><a href="${href}">${title} →</a></strong></p>
    <p style="margin:0 0 .6rem;font-family:var(--serif)">${blurb}</p>
    <p style="margin:0;font-size:.85rem"><a href="index.html">← All units</a></p>
  </div>
`);
  fs.writeFileSync(f, h);
  console.log(`unit-${u}: next-card restored → ${title.replace(/&amp;/g, '&')}`);
}

/* ---------------- 2 · teach units 1–5 that unit 6 exists ---------------- */
const UNITS6 = [
  { n: 1, t: 'Systems of Linear Equations' }, { n: 2, t: 'Vector Spaces' },
  { n: 3, t: 'Analytic Geometry' }, { n: 4, t: 'Determinants & Eigenvalues' },
  { n: 5, t: 'Decompositions & SVD' }, { n: 6, t: 'Differentiation' },
];
for (const u of ['01', '02', '03', '04', '05']) {
  const f = `src/unit-${u}.html`;
  let h = fs.readFileSync(f, 'utf8');
  if (h.includes('"Differentiation"')) { console.log(`unit-${u}: switcher already knows unit 6`); continue; }
  const before = h;
  h = h.replace(/var UNITS = \[[^\]]*\];/, 'var UNITS = ' + JSON.stringify(UNITS6) + ';');
  must(h !== before, `unit-${u}: UNITS array not found`);
  fs.writeFileSync(f, h);
  console.log(`unit-${u}: drawer switcher now offers Unit 6`);
}

/* ---------------- 3 · the hub ---------------- */
{
  const f = 'src/index.html';
  let h = fs.readFileSync(f, 'utf8');
  if (h.includes('data-unit="6"')) console.log('index.html: unit 6 already live, skipped');
  else {
    const locked = `    <div class="card locked">
      <div class="top"><span class="num">06</span><h3>Differentiation</h3></div>
      <p>Derivatives from scalars to tensors — the language of "which way is down?"</p>
      <div class="foot"><span class="status soon">Coming soon</span></div>
    </div>`;
    must(h.includes(locked), 'index.html: locked unit-6 card not found');
    h = h.replace(locked,
`    <a class="card" href="unit-06.html" data-unit="6">
      <div class="top"><span class="num">06</span><h3>Differentiation</h3></div>
      <p>Which way is down? From a shrinking secant to the Jacobian matrices behind backpropagation — the language every learning machine speaks.</p>
      <div class="foot"><span class="status ready">✓ Ready</span><span>10 widgets · 12 checks · 10 problems</span></div>
    </a>`);

    /* progress maps */
    h = h.replace('const FALLBACK={1:10,2:10,3:11,4:12,5:12};',
                  'const FALLBACK={1:10,2:10,3:11,4:12,5:12,6:12};');
    must(h.includes('6:12}'), 'index.html: FALLBACK not updated');
    h = h.replace("5:'Decompositions & SVD'};", "5:'Decompositions & SVD',6:'Differentiation'};");
    must(h.includes("6:'Differentiation'"), 'index.html: TITLE map not updated');

    /* hero chips — recount from the live units */
    h = h.replace('<span class="chip">📐 16 units · 5 live so far</span>', '<span class="chip">📐 16 units · 6 live so far</span>');
    h = h.replace('<span class="chip">🎛 38 hands-on widgets</span>', '<span class="chip">🎛 48 hands-on widgets</span>');
    h = h.replace('<span class="chip">✅ 55 pause-and-predict checks</span>', '<span class="chip">✅ 67 pause-and-predict checks</span>');
    h = h.replace('<span class="chip">✍ 53 problems solved step by step</span>', '<span class="chip">✍ 63 problems solved step by step</span>');
    must(h.includes('6 live so far') && h.includes('48 hands-on') && h.includes('67 pause') && h.includes('63 problems'),
         'index.html: hero chips not fully updated');

    /* Part II heading no longer starts with a locked unit */
    fs.writeFileSync(f, h);
    console.log('index.html: unit 6 unlocked, maps + chips updated');
  }
}

/* ---------------- 4 · sitemap ---------------- */
{
  const f = '../../mfml-site/sitemap.xml';
  const p = fs.existsSync(f) ? f : null;
  if (!p) console.log('sitemap: not found here, skipped (handled at publish time)');
  else {
    let s = fs.readFileSync(p, 'utf8');
    if (s.includes('unit-06.html')) console.log('sitemap: already lists unit 6');
    else {
      s = s.replace(/(\s*)<url>\s*<loc>https:\/\/linearalgebra\.info\/unit-05\.html<\/loc>([\s\S]*?)<\/url>/,
        (m) => m + m.replace('unit-05', 'unit-06'));
      fs.writeFileSync(p, s);
      console.log('sitemap: unit 6 added');
    }
  }
}

/* ---------------- 5 · verification suites ---------------- */
{
  let s = fs.readFileSync('verify-practice.js', 'utf8');
  if (s.includes("['06'")) console.log('verify-practice: already covers unit 6');
  else {
    s = s.replace("['05',12,13]];", "['05',12,13],['06',10,14]];");
    must(s.includes("['06',10,14]"), 'verify-practice: UNITS list not updated');
    s = s.replace('ALL 5 UNITS PASS', 'ALL 6 UNITS PASS');
    fs.writeFileSync('verify-practice.js', s);
    console.log('verify-practice: unit 6 added');
  }
}
{
  let s = fs.readFileSync('verify-ux.js', 'utf8');
  if (s.includes('6: 12')) console.log('verify-ux: already covers unit 6');
  else {
    s = s.replace('const UNITS = [1, 2, 3, 4, 5];', 'const UNITS = [1, 2, 3, 4, 5, 6];');
    s = s.replace('const EXPECT_CHECKS = { 1: 10, 2: 10, 3: 11, 4: 12, 5: 12 };',
                  'const EXPECT_CHECKS = { 1: 10, 2: 10, 3: 11, 4: 12, 5: 12, 6: 12 };');
    s = s.replace('const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12 };',
                  'const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12, 6: 10 };');
    /* the switcher has 2 links on the first and last unit, 3 in between */
    s = s.replace('if (tocLinks !== secCount + (u === 1 || u === 5 ? 2 : 3)) {',
                  'if (tocLinks !== secCount + (u === 1 || u === 6 ? 2 : 3)) {');
    s = s.replace('const wantPrev = u > 1 ? `Unit ${u - 1}` : null, wantNext = u < 5 ? `Unit ${u + 1}` : null;',
                  'const wantPrev = u > 1 ? `Unit ${u - 1}` : null, wantNext = u < 6 ? `Unit ${u + 1}` : null;');
    s = s.replace("if (u === 5 && navText.includes('Unit 6')) fail(tag, 'unit 5 offers a nonexistent unit 6');",
                  "if (u === 6 && navText.includes('Unit 7')) fail(tag, 'unit 6 offers a nonexistent unit 7');");
    /* hub expectations */
    s = s.replace(`                  '5 widgets · 12 checks · 12 problems'];`,
                  `                  '5 widgets · 12 checks · 12 problems', '10 widgets · 12 checks · 10 problems'];`);
    s = s.replace("if (overall !== '14 of 55 checks passed') fail('hub', `overall reads \"${overall}\", expected \"14 of 55 checks passed\"`);",
                  "if (overall !== '14 of 67 checks passed') fail('hub', `overall reads \"${overall}\", expected \"14 of 67 checks passed\"`);");
    s = s.replace("if (barW !== '25.5%') fail('hub', `overall bar width ${barW}, expected 25.5%`);",
                  "if (barW !== '20.9%') fail('hub', `overall bar width ${barW}, expected 20.9%`);");
    must(s.includes('6: 12') && s.includes('6: 10') && s.includes('14 of 67'), 'verify-ux: not fully updated');
    fs.writeFileSync('verify-ux.js', s);
    console.log('verify-ux: unit 6 added (totals now 67 checks)');
  }
}
console.log('\nwiring complete');
