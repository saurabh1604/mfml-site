/* Rebrand: "MFML Interactive · ZC416 · BITS Pilani WILP" → "The Math Behind the Machine · by Prof. Saurabh"
   + landing-page copy rewrite and visual polish. Runs AFTER patch-ux.js and patch-hub.js.
   Idempotent via MARK. */
const fs = require('fs');
const MARK = 'BRAND-V1';
const BRAND = 'The Math Behind the Machine';

const must = (f, cond, msg) => { if (!cond) throw new Error(f + ': ' + msg); };
function sub(f, h, from, to, times = 1) {
  const n = h.split(from).length - 1;
  must(f, n === times, `expected ${times}× "${String(from).slice(0, 60)}…", found ${n}`);
  return h.split(from).join(to);
}

/* ============================== UNIT PAGES ============================== */
const UNIT_TITLES = { 1: 'Systems of Linear Equations', 2: 'Vector Spaces', 3: 'Analytic Geometry',
  4: 'Determinants, Eigenvalues & the Spectral Theorem', 5: 'Matrix Decompositions & SVD' };

for (let u = 1; u <= 5; u++) {
  const f = `src/unit-0${u}.html`;
  let h = fs.readFileSync(f, 'utf8');
  if (h.includes(MARK)) { console.log(`unit-0${u}: already branded, skipped`); continue; }

  // titles + og
  h = sub(f, h, `— MFML Interactive</title>`, `— ${BRAND}</title>`);
  h = sub(f, h, `<meta property="og:site_name" content="MFML Interactive">`,
               `<meta property="og:site_name" content="${BRAND}">`);
  h = sub(f, h, `— MFML Interactive">`, `— ${BRAND}">`); // og:title

  // topbar wordmark (patch-ux has already wrapped the long half in .txs)
  h = sub(f, h, `<a class="home" href="index.html">MFML<span class="txs"> Interactive</span></a>`,
               `<a class="home" href="index.html">The Math<span class="txs"> Behind the Machine</span></a>`);

  // hero kicker
  h = sub(f, h, `<div class="kicker">Unit ${u} · Covers Session ${u} · ZC416 MFML · Prof. Saurabh</div>`,
               `<div class="kicker">Unit ${u} of 16 · by Prof. Saurabh</div>`);

  // practice arena heading: course "session" language → unit language
  h = sub(f, h, `<h2>Practice arena — the session's problem set, solved in full</h2>`,
               `<h2>Practice arena — the unit's problem set, solved in full</h2>`);

  // practice intros
  if (u === 1) h = sub(f, h, `ten practice problems for Session 1 —`, `ten practice problems for this unit —`);
  if (u === 2) {
    h = sub(f, h, `practice set for Session 2 (Vector Spaces)`, `practice set for this unit (Vector Spaces)`);
    h = sub(f, h, `Six pieces; the rest of MFML is mostly geometry played with them.`,
                 `Six pieces; the rest of the course is mostly geometry played with them.`);
  }
  if (u === 3) h = sub(f, h, `practice set for Session 3 — Analytic Geometry`, `practice set for this unit — Analytic Geometry`);
  if (u === 4) {
    h = sub(f, h, `his single "Matrix Decompositions" file covers Sessions 4 and 5 together, so we've split it:`,
                 `his single "Matrix Decompositions" set spans this unit and the next, so we've split it:`);
    h = sub(f, h, `wait in Session 5's arena`, `wait in Unit 5's arena`);
  }
  if (u === 5) {
    h = sub(f, h, `his single "Matrix Decompositions" file covers Sessions 4 and 5 together, so we've split it:`,
                 `his single "Matrix Decompositions" set spans this unit and the previous one, so we've split it:`);
    h = sub(f, h, `sit in Session 4's arena`, `sit in Unit 4's arena`);
  }

  h += `<!-- ${MARK} -->\n`;
  fs.writeFileSync(f, h);
  console.log(`unit-0${u}: rebranded`);
}

/* ================================= HUB ================================= */
{
  const f = 'src/index.html';
  let h = fs.readFileSync(f, 'utf8');
  if (h.includes(MARK)) { console.log('index.html: already branded, skipped'); }
  else {
    // ---- head / SEO ----
    h = sub(f, h, `<title>MFML Interactive — Mathematical Foundations for Machine Learning</title>`,
                 `<title>${BRAND} — interactive math for machine learning &amp; AI</title>`);
    h = sub(f, h, `<meta name="description" content="Interactive lectures for the Mathematical Foundations of Machine Learning: 3D visualizations, story-first explanations, and inline checks. By Prof. Saurabh · ZC416 · BITS Pilani WILP.">`,
                 `<meta name="description" content="All the math you need to truly understand modern machine learning and AI — interactive lessons with 3D visualizations, story-first explanations, inline checks, and practice problems solved in full. By Prof. Saurabh.">`);
    h = sub(f, h, `<meta property="og:site_name" content="MFML Interactive">`,
                 `<meta property="og:site_name" content="${BRAND}">`);
    h = sub(f, h, `<meta property="og:title" content="MFML Interactive — Learn the math under the machine">`,
                 `<meta property="og:title" content="${BRAND} — learn the math under modern AI by touching it">`);
    h = sub(f, h, `<meta property="og:description" content="Interactive lectures for the Mathematical Foundations of Machine Learning: 3D visualizations, story-first explanations, and inline checks. By Prof. Saurabh · ZC416 · BITS Pilani WILP.">`,
                 `<meta property="og:description" content="All the math you need to truly understand modern machine learning and AI — stories you can touch: 3D widgets, inline checks, and every practice problem solved step by step.">`);

    // ---- topbar: new wordmark, institution line gone ----
    h = sub(f, h, `    <span class="brand">MFML Interactive</span>
    <span class="org" style="color:var(--ink-muted)">ZC416 · Prof. Saurabh · BITS Pilani WILP</span>`,
`    <span class="brand">${BRAND}</span>`);

    // ---- hero copy ----
    h = sub(f, h, `<div class="kicker">Mathematical Foundations for Machine Learning</div>`,
                 `<div class="kicker">The mathematics of machine learning &amp; AI</div>`);
    h = sub(f, h, `<h1>Learn the math under the machine — by touching it.</h1>`,
                 `<h1>Learn the math under the machine — by <span class="hl">touching</span> it.</h1>`);
    h = sub(f, h, `<p style="font-family:var(--sans);font-weight:650;color:var(--ink-2);margin:.2rem 0 .6rem">by <strong>Prof. Saurabh</strong> · ZC416 · BITS Pilani WILP</p>`,
                 `<p style="font-family:var(--sans);font-weight:650;color:var(--ink-2);margin:.2rem 0 .6rem">by <strong>Prof. Saurabh</strong></p>`);
    h = sub(f, h, `<p class="lede">All 16 sessions of MFML, rebuilt as interactive lessons: every idea told as a story first, every slide example worked in full, every concept something you can drag, zoom, and break. Read the intuition, play the widget, then pass the inline checks.</p>`,
                 `<p class="lede">All the math you need to truly understand modern machine learning and AI — told simply, built to be touched. Every idea opens as a story, every concept is something you can drag, spin, and break, and every unit ends with its full problem set solved step by step. Curiosity is the only prerequisite.</p>`);

    // ---- chips: real course-wide numbers ----
    h = sub(f, h, `      <span class="chip">📐 15 topic units + finale</span>
      <span class="chip">🎛 Interactive widgets in every unit</span>
      <span class="chip">✅ Pause-and-predict checks</span>
      <span class="chip">✍ 53 solved practice problems</span>`,
`      <span class="chip">📐 16 units · 5 live so far</span>
      <span class="chip">🎛 38 hands-on widgets</span>
      <span class="chip">✅ 55 pause-and-predict checks</span>
      <span class="chip">✍ 53 problems solved step by step</span>`);

    // ---- part accents: tag headings and grids ----
    h = sub(f, h, `<h2 class="part" id="units">Part I · Linear Algebra</h2>\n  <div class="grid">`,
                 `<h2 class="part" id="units" data-p="1">Part I · Linear Algebra</h2>\n  <div class="grid" data-p="1">`);
    h = sub(f, h, `<h2 class="part">Part II · Calculus &amp; Differentiation</h2>\n  <div class="grid">`,
                 `<h2 class="part" data-p="2">Part II · Calculus &amp; Differentiation</h2>\n  <div class="grid" data-p="2">`);
    h = sub(f, h, `<h2 class="part">Part III · Optimization</h2>\n  <div class="grid">`,
                 `<h2 class="part" data-p="3">Part III · Optimization</h2>\n  <div class="grid" data-p="3">`);
    h = sub(f, h, `<h2 class="part">Part IV · Applications</h2>\n  <div class="grid">`,
                 `<h2 class="part" data-p="4">Part IV · Applications</h2>\n  <div class="grid" data-p="4">`);

    // ---- card 16: internal build note must not face students ----
    h = sub(f, h, `<div class="top"><span class="num">16</span><h3>Session 16 · Finale</h3></div>
      <p>Awaiting slides — drop Lecture_16.pdf into the MFML folder and this unit joins the queue.</p>
      <div class="foot"><span class="status soon">Awaiting slides</span></div>`,
`<div class="top"><span class="num">16</span><h3>The Finale</h3></div>
      <p>Where every thread ties together — the last stop on the route from lines to learning machines.</p>
      <div class="foot"><span class="status soon">Coming soon</span></div>`);

    // ---- footer ----
    h = sub(f, h, `<p style="margin:0 0 .5rem">Built from Prof. Saurabh's ZC416 lecture slides and companion readers · BITS Pilani Work Integrated Learning Programmes · Interactive edition</p>`,
                 `<p style="margin:0 0 .5rem">Handcrafted by Prof. Saurabh · every idea a story, every example worked in full · free to learn from</p>`);

    // ---- visual polish CSS ----
    const CSS = `/* ================= ${MARK} · landing polish ================= */
:root{--s7:#4a3aa7;--wash-2:rgba(235,104,52,.14)}
:root[data-theme="dark"]{--s7:#9085e9;--wash-2:rgba(217,89,38,.20)}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--s7:#9085e9;--wash-2:rgba(217,89,38,.20)}}
body::after{content:"";position:fixed;top:0;left:0;right:0;height:3px;z-index:60;
  background:linear-gradient(90deg,var(--s1),var(--s7) 34%,var(--s2) 67%,var(--s3));pointer-events:none}
.hl{background:linear-gradient(transparent 58%,var(--wash-2) 0);border-radius:3px;padding:0 .06em}
.wrap{position:relative}
.hero-art{position:absolute;top:6.4rem;right:.5rem;width:min(24rem,26vw);display:none;pointer-events:none;user-select:none}
@media (min-width:1150px){.hero-art{display:block}}
h2.part{display:flex;align-items:center;gap:.55rem}
h2.part::before{content:"";width:.62rem;height:.62rem;border-radius:4px;background:var(--pc,var(--ink-muted));flex:none}
[data-p="1"]{--pc:var(--s1)} [data-p="2"]{--pc:var(--s3)} [data-p="3"]{--pc:var(--s2)} [data-p="4"]{--pc:var(--s7)}
.grid .card .num{color:var(--pc,var(--ink-muted))}
a.card:hover{border-color:var(--pc,var(--s1))}
a.card::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:0 3px 3px 0;
  background:var(--pc,var(--s1));opacity:0;transition:opacity .12s}
a.card:hover::before{opacity:1}
.status.ready{letter-spacing:.02em}
footer a{color:var(--ink-2)}
`;
    h = sub(f, h, `/* ================= MBM-UX-V2`, CSS + `/* ================= MBM-UX-V2`);

    // ---- hero decorative sketch: warped grid, eigen-ellipse, v → Av ----
    const ART = `
  <svg class="hero-art" viewBox="0 0 360 300" aria-hidden="true">
    <g stroke="var(--grid)" stroke-width="1" fill="none" opacity=".9">
      <path d="M30 42 C 120 30 240 30 330 54"/><path d="M26 92 C 120 78 244 80 334 104"/>
      <path d="M22 142 C 120 128 248 132 336 152"/><path d="M24 192 C 124 180 248 184 334 198"/>
      <path d="M30 242 C 128 234 244 236 330 240"/>
      <path d="M60 24 C 52 100 50 190 58 268"/><path d="M124 18 C 118 100 116 194 122 272"/>
      <path d="M188 16 C 184 102 184 196 188 274"/><path d="M252 18 C 250 102 252 196 256 270"/>
      <path d="M316 26 C 318 104 322 192 318 264"/>
    </g>
    <ellipse cx="188" cy="146" rx="118" ry="64" transform="rotate(-18 188 146)" fill="none" stroke="var(--s3)" stroke-width="2" stroke-dasharray="5 6" opacity=".8"/>
    <g stroke-linecap="round">
      <line x1="188" y1="146" x2="262" y2="76" stroke="var(--s2)" stroke-width="3"/>
      <path d="M262 76 l-13 2 6 12 z" fill="var(--s2)" stroke="none"/>
      <line x1="188" y1="146" x2="298" y2="122" stroke="var(--s1)" stroke-width="3"/>
      <path d="M298 122 l-12 -6 1 13 z" fill="var(--s1)" stroke="none"/>
    </g>
    <text x="268" y="64" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="var(--s2)">x</text>
    <text x="304" y="118" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="var(--s1)">Ax</text>
  </svg>`;
    h = sub(f, h, `  <header class="hero">`, ART + `\n  <header class="hero">`);

    h += `<!-- ${MARK} -->\n`;
    fs.writeFileSync(f, h);
    console.log('index.html: rebranded + polished');
  }
}
console.log('brand patch done');
