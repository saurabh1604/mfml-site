/* Round 15 · cross-unit layer generator.
   Reads every src/unit-NN.html and writes
     tpl/site-index.json  — units, sections, widgets, realizations (search + threads data; injected by build.js)
     src/ideas.html       — "Big ideas": the whole course as one page of realizations + threads
   Run before build.js:  node gen-site.js && node build.js            */
const fs = require('fs'), path = require('path');
const ROOT = __dirname, SRC = path.join(ROOT, 'src');

const PARTS = { 1: 'Linear Algebra', 2: 'Calculus & Differentiation', 3: 'Optimization', 4: 'Applications', 5: 'Models that Read', 6: 'Models that Create' };
const PART_OF = u => u <= 5 ? 1 : u <= 8 ? 2 : u <= 11 ? 3 : u <= 13 ? 4 : u <= 18 ? 5 : 6;
const UPCOMING = [
  [12, 'Principal Component Analysis'], [13, 'Support Vector Machines'],
  [14, 'Thinking in Probabilities'], [15, 'The Network, Whole'], [16, 'Words as Vectors'], [17, 'Machines with Memory'],
  [18, 'Attention and Transformers'], [19, 'The Maths Inside an LLM'], [20, 'From Noise to Pictures: VAEs and Diffusion']];

/* ---- threads: one idea followed across the course. [unit, sectionId, label] ; sectionId null = upcoming ---- */
const THREADS = [
  { id: 'dot', name: 'Agreement', lede: 'One number that says how much two lists agree — it measures angles, casts shadows, points the gradient, and finally decides what a transformer pays attention to.',
    stops: [[1, 's6', 'rows as dot products'], [3, 's2d', 'the dot product'], [3, 's6', 'angles'], [3, 's10', 'projection'], [6, 's6', 'the gradient compass'], [11, 's14', 'the widest street'], [13, 's12', 'the classifier as a vote'], [18, null, 'attention scores']] },
  { id: 'eig', name: 'Directions a matrix leaves alone', lede: 'Eigenvectors keep turning up: they unpack a matrix, judge a landscape, explain why a valley is slow, and name the directions that matter in data.',
    stops: [[4, 's5', 'eigenvectors'], [4, 's7', 'spectral theorem'], [5, 's7', 'the SVD'], [8, 's10', 'the Hessian judge'], [10, 's8', 'the canyon'], [11, 's6', 'the stiffness dial'], [12, 's5', 'principal components'], [14, 's5', 'the Gaussian ellipse'], [17, null, 'memory that fades']] },
  { id: 'null', name: 'What the machine cannot see', lede: 'Some inputs vanish without a trace. The blind spot of a matrix explains missing solutions, redundant features and why a model can memorise.',
    stops: [[1, 's10', 'the null space'], [1, 's13', 'rank'], [2, 's5', 'a subspace'], [2, 's11', 'dimension'], [5, 's10', 'low rank'], [10, 's3', 'knobs versus facts'], [12, 's13', 'the Gram trick']] },
  { id: 'chain', name: 'Blame flowing backwards', lede: 'The chain rule, promoted step by step: a product of slopes, a product of Jacobians, a sweep backwards through a graph — and later, through time.',
    stops: [[6, 's10', 'chain rule as matrices'], [7, 's3', 'two rules'], [7, 's6', 'a whole layer'], [7, 's8', 'one sweep'], [15, 's8', 'the whole network'], [15, 's10', 'blame that fades or explodes'], [17, null, 'backprop through time']] },
  { id: 'curve', name: 'Bowls, domes and saddles', lede: 'Curvature decides everything near a flat spot — how good an approximation is, whether you found a minimum, and how big a step you can dare.',
    stops: [[6, 's4', 'Taylor, first look'], [8, 's5', 'Taylor built by hand'], [8, 's10', 'the Hessian'], [9, 's3', 'three kinds of flat'], [9, 's5', 'the step-size limit'], [10, 's8', 'the canyon']] },
  { id: 'down', name: 'Follow the slope down', lede: 'One rule — step against the gradient — then every refinement of it: how far, how often, with how much memory.',
    stops: [[6, 's11', 'walking down'], [9, 's4', 'the rule'], [9, 'svar', 'batch vs stochastic'], [10, 's10', 'fix the units'], [11, 's2', 'momentum'], [11, 's5', 'Adam'], [15, 's9', 'one training step'], [20, null, 'walking back from noise']] },
  { id: 'pd', name: 'Always uphill', lede: 'Positive definite matrices are the “honest bowls” of the course: they define rulers, have a square root, certify a minimum and make a problem safe to solve.',
    stops: [[3, 's4', 'the engine room'], [4, 's7', 'spectral theorem'], [4, 's10', 'Cholesky'], [8, 's10', 'the Hessian test'], [11, 's12', 'problems you can trust'], [13, 's8', 'the SVM dual'], [14, 's6', 'a covariance square root']] },
];

/* ---------------- parsing ---------------- */
const strip = h => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
/* balanced <div …>…</div> starting at index i (which points at "<div") → [start, end) */
function divSpan(s, i) {
  const re = /<div\b|<\/div>/g; re.lastIndex = i; let depth = 0, m;
  while ((m = re.exec(s))) { if (m[0] === '</div>') { depth--; if (!depth) return [i, re.lastIndex]; } else depth++; }
  return [i, s.length];
}
const TEXMAP = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', varepsilon: 'ε', eta: 'η', theta: 'θ', lambda: 'λ', Lambda: 'Λ', mu: 'µ', nu: 'ν', rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ', omega: 'ω', pi: 'π', nabla: '∇', partial: '∂', infty: '∞', cdot: '·', times: '×', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', to: '→', rightarrow: '→', Rightarrow: '⇒', sum: 'Σ', in: '∈', perp: '⊥', sqrt: '√', pm: '±', langle: '⟨', rangle: '⟩', ldots: '…', dots: '…', cdots: '⋯', top: 'ᵀ' };
function tex2txt(t) {
  return t.replace(/\\[()\[\]]/g, '')
    .replace(/\\([A-Za-z]+)/g, (m, c) => TEXMAP[c] !== undefined ? TEXMAP[c] : m)
    .replace(/\\(?:mathbf|mathrm|text|operatorname|boldsymbol|mathit|mathcal|textbf)\{([^{}]*)\}/g, '$1')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\^\{?T\}?/g, 'ᵀ').replace(/\^\{-1\}/g, '⁻¹').replace(/\^2/g, '²').replace(/\^\{2\}/g, '²').replace(/\^3/g, '³')
    .replace(/\\([A-Za-z]+)/g, (m, c) => TEXMAP[c] !== undefined ? TEXMAP[c] : '')
    .replace(/[{}]/g, '').replace(/\\[,;!: ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseUnit(n) {
  const f = path.join(SRC, 'unit-' + String(n).padStart(2, '0') + '.html');
  const s = fs.readFileSync(f, 'utf8');
  const title = strip((s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]);
  const secRe = /<section class="unit" id="([^"]+)"/g; const starts = []; let m;
  while ((m = secRe.exec(s))) starts.push([m[1], m.index]);
  const sections = [], widgets = [];
  starts.forEach(([id, a], k) => {
    const b = k + 1 < starts.length ? starts[k + 1][1] : s.indexOf('</main>', a) > 0 ? s.indexOf('</main>', a) : s.length;
    const body = s.slice(a, b);
    const h2 = strip((body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [, ''])[1]);
    const num = (body.match(/<span class="sec-num">([^<]*)<\/span>/) || [, ''])[1];
    let real = '';
    const ri = body.search(/<div class="callout remember[^"]*"><span class="tag">The realization<\/span>/);
    if (ri >= 0) { const [x, y] = divSpan(body, ri); real = body.slice(x, y).replace(/^<div[^>]*><span class="tag">The realization<\/span>/, '').replace(/<\/div>$/, '').trim(); }
    const om = body.match(/<(p|div) class="onesent[^"]*"><b>In one sentence:<\/b>([\s\S]*?)<\/\1>/);
    const one = om ? om[2].trim() : "";
    const wr = /<div class="widget[^"]*"[^>]*id="(w-[^"]+)"[^>]*>[\s\S]*?<span class="w-title">([\s\S]*?)<\/span>/g; let w;
    while ((w = wr.exec(body))) widgets.push({ id: w[1], s: id, t: strip(w[2]) });
    sections.push({ id, num, t: h2, real, one });
  });
  return { n, title, sections, widgets };
}

const units = [];
for (let n = 1; n <= 16; n++) { if (fs.existsSync(path.join(SRC, 'unit-' + String(n).padStart(2, '0') + '.html'))) units.push(parseUnit(n)); }
const LIVE = new Set(units.map(u => u.n));

/* ---------------- search index (compact) ---------------- */
const idx = {
  units: units.map(u => ({ n: u.n, t: u.title, p: PART_OF(u.n) })).concat(UPCOMING.filter(([n]) => !LIVE.has(n)).map(([n, t]) => ({ n, t, p: PART_OF(n), soon: 1 }))),
  secs: [], wids: [],
  threads: THREADS.map(th => ({ id: th.id, name: th.name, stops: th.stops.map(([u, s, l]) => [u, s, l]) })),
};
units.forEach(u => {
  u.sections.forEach(sc => { if (sc.id === 'spractice') { idx.secs.push([u.n, sc.id, 'Practice arena — solved problems', '']); return; }
    idx.secs.push([u.n, sc.id, sc.t, tex2txt(strip(sc.one || sc.real)).slice(0, 190)]); });
  u.widgets.forEach(w => idx.wids.push([u.n, w.s, w.id, w.t]));
});
/* validate thread stops */
let bad = 0;
THREADS.forEach(th => th.stops.forEach(([u, s]) => { if (!s) return; const U = units.find(x => x.n === u); if (!U || !U.sections.some(x => x.id === s)) { console.error('THREAD STOP MISSING', th.id, u, s); bad++; } }));
if (bad) process.exit(1);
fs.writeFileSync(path.join(ROOT, 'tpl/site-index.json'), JSON.stringify(idx));

/* ---------------- ideas.html ---------------- */
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad = n => String(n).padStart(2, '0');
const secLabel = (u, s) => { const U = units.find(x => x.n === u); const S = U && U.sections.find(x => x.id === s); return S ? S.t : ''; };
const PCV = { 1: 'var(--s1)', 2: 'var(--s3)', 3: 'var(--s2)', 4: 'var(--s7)', 5: 'var(--s6)', 6: 'var(--s5)' };

let threadsHtml = THREADS.map(th => {
  const stops = th.stops.map(([u, s, l], i) => {
    const pc = PCV[PART_OF(u)];
    if (!s) return `<li class="stop soon" style="--pc:${pc}"><span class="dot"></span><span class="su">Unit ${u} · soon</span><span class="sl">${esc(l)}</span></li>`;
    return `<li class="stop" style="--pc:${pc}"><a href="unit-${pad(u)}.html#${s}" title="${esc(secLabel(u, s))}"><span class="dot"></span><span class="su">Unit ${u}</span><span class="sl">${esc(l)}</span></a></li>`;
  }).join('');
  return `<article class="thread reveal" id="thread-${th.id}"><h3>${esc(th.name)}</h3><p>${esc(th.lede)}</p><ol class="stops">${stops}</ol></article>`;
}).join('\n');

let unitsHtml = '';
let lastPart = 0;
units.forEach(u => {
  const p = PART_OF(u.n);
  if (p !== lastPart) { unitsHtml += `<h2 class="part-h" data-p="${p}" id="part-${p}"><span class="roman">${['', 'I', 'II', 'III', 'IV', 'V', 'VI'][p]}</span>Part ${['', 'I', 'II', 'III', 'IV', 'V', 'VI'][p]} · ${esc(PARTS[p])}</h2>\n`; lastPart = p; }
  const items = u.sections.filter(sc => sc.id !== 'spractice' && (sc.real || sc.one)).map(sc => `
    <li class="idea reveal" id="u${u.n}-${sc.id}">
      <a class="i-head" href="unit-${pad(u.n)}.html#${sc.id}"><span class="i-num">${esc(sc.num || '')}</span><span class="i-t">${esc(sc.t)}</span><span class="i-go" aria-hidden="true">→</span></a>
      ${sc.real ? `<div class="i-real">${sc.real}</div>` : ''}
      ${sc.one ? `<p class="i-one"><b>In one sentence:</b> ${sc.one}</p>` : ''}
    </li>`).join('');
  unitsHtml += `<section class="u-block" data-p="${p}" id="unit-${u.n}">
  <div class="u-head"><span class="u-num">${pad(u.n)}</span><h3><a href="unit-${pad(u.n)}.html">${esc(u.title)}</a></h3><a class="u-open" href="unit-${pad(u.n)}.html">Open the unit →</a></div>
  <ol class="ideas">${items}
  </ol>
</section>\n`;
});
UPCOMING.filter(([n]) => !LIVE.has(n)).forEach(([n, t]) => {
  const p = PART_OF(n);
  if (p !== lastPart) { unitsHtml += `<h2 class="part-h" data-p="${p}" id="part-${p}"><span class="roman">${['', 'I', 'II', 'III', 'IV', 'V', 'VI'][p]}</span>Part ${['', 'I', 'II', 'III', 'IV', 'V', 'VI'][p]} · ${esc(PARTS[p])}<span class="soon-tag">Upcoming</span></h2>\n`; lastPart = p; }
  unitsHtml += `<section class="u-block soon" data-p="${p}" id="unit-${n}"><div class="u-head"><span class="u-num">${pad(n)}</span><h3>${esc(t)}</h3><span class="u-open">Upcoming</span></div></section>\n`;
});

const nIdeas = units.reduce((a, u) => a + u.sections.filter(sc => sc.id !== 'spractice' && (sc.real || sc.one)).length, 0);
const tocHtml = units.map(u => `<a href="#unit-${u.n}" style="--pc:${PCV[PART_OF(u.n)]}"><b>${pad(u.n)}</b>${esc(u.title)}</a>`).join('');

const tpl = fs.readFileSync(path.join(ROOT, 'tpl/ideas-shell.html'), 'utf8');
const out = tpl.replace('<!--@THREADS-->', threadsHtml).replace('<!--@UNITS-->', unitsHtml).replace('<!--@TOC-->', tocHtml)
  .replace(/@NIDEAS/g, String(nIdeas)).replace(/@NUNITS/g, String(units.length)).replace(/@NTHREADS/g, String(THREADS.length));
fs.writeFileSync(path.join(SRC, 'ideas.html'), out);
console.log(`gen-site: ${units.length} units · ${idx.secs.length} sections · ${idx.wids.length} widgets · ${nIdeas} ideas · ${THREADS.length} threads · index ${(JSON.stringify(idx).length / 1024).toFixed(1)} KB`);
units.forEach(u => { const miss = u.sections.filter(sc => sc.id !== 'spractice' && !sc.one).map(sc => sc.id); if (miss.length) console.log(`  unit ${u.n}: no one-sentence in ${miss.join(',')}`); });
