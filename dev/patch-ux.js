/* MFML site · UX enhancement patch (v2 navigation / resume / revision / a11y / print)
   Patches src/unit-0N.html in place. Idempotent: re-running is a no-op. */
const fs = require('fs');
const MARK = 'MBM-UX-V2';

const UNITS = [
  { n: 1, t: 'Systems of Linear Equations' },
  { n: 2, t: 'Vector Spaces' },
  { n: 3, t: 'Analytic Geometry' },
  { n: 4, t: 'Determinants & Eigenvalues' },
  { n: 5, t: 'Decompositions & SVD' },
];

/* ------------------------------------------------------------------ CSS */
const CSS = `
/* ================= ${MARK} · navigation, resume, revision, a11y, print ================= */
a.skip{position:absolute;left:-9999px;top:0;z-index:100;background:var(--s1);color:#fff;padding:.55rem 1rem;border-radius:0 0 10px 0;font-family:var(--sans);font-size:.85rem;font-weight:650;text-decoration:none}
a.skip:focus{left:0}
:focus-visible{outline:2px solid var(--s1);outline-offset:2px;border-radius:4px}
main:focus{outline:none}
/* --- topbar fits every screen --- */
.topbar-in{flex-wrap:nowrap}
.topbar a.home{white-space:nowrap;text-decoration:none}
.topbar .crumb{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
#score-chip.done{border-color:var(--good);background:var(--wash-good);color:var(--good-text)}
#score-chip.done b{color:var(--good-text)}
.hero .meta .chip{white-space:normal}
/* long display equations scroll inside their own box instead of stretching the page */
.katex-display{overflow-x:auto;overflow-y:hidden;padding-top:2px;padding-bottom:2px}
.katex-display::-webkit-scrollbar{height:5px}
.katex-display::-webkit-scrollbar-thumb{background:var(--grid);border-radius:999px}
/* wide comparison tables scroll in place rather than stretching the page */
@media (max-width:760px){
  table.plain{display:block;max-width:100%;overflow-x:auto}
}
#toc-btn{display:none;align-items:center;gap:.35rem;white-space:nowrap}
@media (max-width:1419px){#toc-btn{display:inline-flex}}
@media (max-width:899px){
  .topbar .crumb{display:none}
  .topbar-in{gap:.55rem;padding:.5rem .95rem}
}
@media (max-width:599px){
  .tw{display:none}
  button.ghost{padding:.28rem .6rem}
}
@media (max-width:430px){
  .txs{display:none}
  .topbar-in{gap:.4rem;padding:.5rem .75rem}
}
/* --- table of contents: fixed rail wide, slide-in drawer narrow --- */
.toc-close{display:none;position:absolute;top:.55rem;right:.6rem;width:1.9rem;height:1.9rem;line-height:1;border-radius:9px;border:1px solid var(--ring);background:var(--page);color:var(--ink-2);font-size:1.15rem;cursor:pointer;font-family:var(--sans)}
.toc-nav{display:flex;align-items:center;justify-content:space-between;gap:.4rem;margin-top:.9rem;padding-top:.7rem;border-top:1px solid var(--ring)}
.toc-nav a{border-left:none;padding:.3rem .35rem;color:var(--ink-2);font-weight:650;font-size:.74rem}
.toc-nav a:hover{color:var(--s1)}
.toc-nav a.hub{color:var(--ink-muted);font-weight:600}
.toc-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.38);opacity:0;pointer-events:none;transition:opacity .22s ease;z-index:60}
.toc-backdrop.on{opacity:1;pointer-events:auto}
@media (max-width:1419px){
  /* off-canvas: visibility keeps the closed drawer out of the page's scroll width */
  .toc{display:block;position:fixed;top:0;right:0;bottom:0;left:auto;width:min(21rem,86vw);max-height:none;
       background:var(--surface);border-left:1px solid var(--ring);box-shadow:-24px 0 60px -34px rgba(0,0,0,.65);
       padding:1.15rem .75rem 2rem;font-size:.82rem;overflow-y:auto;overscroll-behavior:contain;
       visibility:hidden;transform:translateX(103%);transition:transform .24s ease,visibility 0s linear .24s;z-index:70}
  .toc.open{visibility:visible;transform:none;transition:transform .24s ease}
  .toc .toc-t{margin-bottom:.7rem}
  .toc a{padding:.42rem .7rem}
  .toc-close{display:block}
}
@media (min-width:1420px){.toc-backdrop{display:none}}
/* --- resume pill --- */
.resume{position:fixed;left:50%;bottom:1.1rem;transform:translate(-50%,140%);z-index:65;display:flex;align-items:center;gap:.6rem;
        background:var(--surface);border:1px solid var(--ring);border-radius:999px;padding:.4rem .5rem .4rem 1rem;
        box-shadow:0 18px 44px -22px rgba(11,11,11,.55);font-family:var(--sans);font-size:.82rem;max-width:min(34rem,92vw);
        transition:transform .3s cubic-bezier(.2,.8,.3,1),opacity .3s;opacity:0}
.resume.on{transform:translate(-50%,0);opacity:1}
.resume .rl{color:var(--ink-muted);white-space:nowrap}
.resume .rgo{font-family:var(--sans);font-size:.82rem;font-weight:650;border:1px solid var(--s1);background:var(--wash-1);color:var(--s1);
             border-radius:999px;padding:.26rem .8rem;cursor:pointer;max-width:16rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.resume .rx{border:none;background:transparent;color:var(--ink-muted);font-size:1.1rem;line-height:1;cursor:pointer;padding:.1rem .35rem}
@media (max-width:600px){.resume .rl{display:none}}
/* --- practice arena: bulk reveal --- */
.sol-bulk{max-width:var(--prose);margin:.9rem auto 0;display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;
          font-family:var(--sans);font-size:.8rem;color:var(--ink-muted)}
.sol-bulk .sb-l{flex:1;min-width:12rem}
.sol-bulk .sb-b{display:flex;gap:.4rem}
/* --- motion & print --- */
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
@media print{
  .topbar,.toc,.toc-backdrop,.resume,.sol-bulk,a.skip,.progress-rail,.drag-hint{display:none!important}
  .controls,.tabs,.stepper,.preset,.mx-edit input{display:none!important}
  body::before{display:none}
  body{background:#fff;color:#000;font-size:10.5pt;line-height:1.5}
  main{max-width:none;padding:0}
  .prose,.callout,.check,.prob,.sec-head,.next-card{max-width:none}
  .widget{box-shadow:none;border-color:#ccc}
  .widget,.prob,.check,.callout,figure,table,svg{break-inside:avoid}
  h1,h2,h3{break-after:avoid}
  section.unit{break-before:auto}
  a{color:#000;text-decoration:none}
  details.sol{border-color:#bbb}
  .pans{background:#eee;color:#000}
}
`;

/* ------------------------------------------------------------------ JS */
const JS = (n) => `
/* ================= ${MARK} · navigation, resume, revision, print ================= */
(function(){
  var U = ${n};
  var UNITS = ${JSON.stringify(UNITS)};
  var st = {get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},
            set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var secs = [].slice.call(document.querySelectorAll('section.unit'));

  /* publish this unit's real check total so the hub never hardcodes a denominator */
  st.set('mfml-u'+U+'-total', document.querySelectorAll('.check').length);

  /* ---- contents drawer (below 1420px) + unit switcher ---- */
  var toc = document.getElementById('toc'),
      btn = document.getElementById('toc-btn'),
      back = document.getElementById('toc-backdrop');
  if (toc && btn && back) {
    var prev = UNITS.filter(function(u){return u.n===U-1})[0],
        next = UNITS.filter(function(u){return u.n===U+1})[0];
    var nav = document.createElement('div');
    nav.className = 'toc-nav';
    nav.innerHTML = (prev ? '<a href="unit-0'+prev.n+'.html" title="'+prev.t+'">\\u2190 Unit '+prev.n+'</a>' : '<span></span>')
                  + '<a class="hub" href="index.html">All units</a>'
                  + (next ? '<a href="unit-0'+next.n+'.html" title="'+next.t+'">Unit '+next.n+' \\u2192</a>' : '<span></span>');
    toc.appendChild(nav);

    var close = document.createElement('button');
    close.className = 'toc-close'; close.type = 'button';
    close.setAttribute('aria-label','Close contents'); close.innerHTML = '\\u00d7';
    toc.insertBefore(close, toc.firstChild);

    var open = false;
    function setOpen(v){
      open = v;
      toc.classList.toggle('open', v);
      back.classList.toggle('on', v);
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
      document.body.style.overflow = (v && innerWidth < 1420) ? 'hidden' : '';
      try { (v ? close : btn).focus(); } catch(e){}
    }
    btn.addEventListener('click', function(){ setOpen(!open); });
    close.addEventListener('click', function(){ setOpen(false); });
    back.addEventListener('click', function(){ setOpen(false); });
    addEventListener('keydown', function(e){ if (e.key === 'Escape' && open) setOpen(false); });
    toc.addEventListener('click', function(e){
      if (e.target.tagName === 'A' && innerWidth < 1420) setOpen(false);
    });
    addEventListener('resize', function(){ if (open && innerWidth >= 1420) setOpen(false); });
  }

  /* ---- remember the reading position (this unit + across the site) ---- */
  function currentIndex(){
    var i = 0;
    secs.forEach(function(s,j){ if (s.getBoundingClientRect().top < 150) i = j; });
    return i;
  }
  var tick = null;
  addEventListener('scroll', function(){
    if (tick) return;
    tick = setTimeout(function(){
      tick = null;
      var s = secs[currentIndex()];
      if (!s) return;
      st.set('mfml-u'+U+'-pos', s.id);
      st.set('mfml-last', U + '|' + s.id);
    }, 700);
  }, {passive:true});

  /* ---- offer to resume (never jump without asking) ---- */
  var savedId = st.get('mfml-u'+U+'-pos');
  if (!location.hash && savedId && secs.length && savedId !== secs[0].id) {
    var target = document.getElementById(savedId);
    if (target && scrollY < 200) {
      var h2 = target.querySelector('h2'), num = target.querySelector('.sec-num');
      var label = (h2 ? h2.textContent.replace(/\\s+\\u2014.*$/,'') : 'where you left off');
      if (label.length > 34) label = label.slice(0,33) + '\\u2026';
      var pill = document.createElement('div');
      pill.className = 'resume';
      pill.innerHTML = '<span class="rl">Pick up where you left off</span>'
        + '<button class="rgo" type="button">' + (num ? '\\u00a7' + num.textContent + ' ' : '') + label + ' \\u2192</button>'
        + '<button class="rx" type="button" aria-label="Dismiss">\\u00d7</button>';
      document.body.appendChild(pill);
      requestAnimationFrame(function(){ pill.classList.add('on'); });
      var hide = function(){ pill.classList.remove('on'); setTimeout(function(){ pill.remove(); }, 320); };
      pill.querySelector('.rgo').addEventListener('click', function(){
        target.scrollIntoView({behavior:'smooth', block:'start'});
        hide();
      });
      pill.querySelector('.rx').addEventListener('click', hide);
      setTimeout(hide, 14000);
    }
  }

  /* ---- practice arena: open / close every solution at once ---- */
  var arena = document.getElementById('spractice');
  if (arena) {
    var sols = [].slice.call(arena.querySelectorAll('details.sol'));
    var prose = arena.querySelector('.prose');
    if (sols.length && prose) {
      var bar = document.createElement('div');
      bar.className = 'sol-bulk';
      bar.innerHTML = '<span class="sb-l">' + sols.length + ' problems \\u00b7 solutions stay hidden until you ask</span>'
        + '<span class="sb-b"><button class="ghost" type="button" data-a="open">Open all solutions</button>'
        + '<button class="ghost" type="button" data-a="close">Close all</button></span>';
      prose.parentNode.insertBefore(bar, prose.nextSibling);
      bar.addEventListener('click', function(e){
        var b = e.target.closest('button');
        if (!b) return;
        var want = b.dataset.a === 'open';
        sols.forEach(function(d){ d.open = want; });
      });
    }
  }

  /* ---- screen readers hear the verdict ---- */
  document.querySelectorAll('.check .why').forEach(function(w){
    w.setAttribute('role','status'); w.setAttribute('aria-live','polite');
  });

  /* ---- printing a unit prints the solutions too ---- */
  var reopened = [];
  addEventListener('beforeprint', function(){
    reopened = [].slice.call(document.querySelectorAll('details:not([open])'));
    reopened.forEach(function(d){ d.open = true; });
  });
  addEventListener('afterprint', function(){
    reopened.forEach(function(d){ d.open = false; });
    reopened = [];
  });
})();
`;

/* ------------------------------------------------------------------ patch */
let changed = 0;
for (const u of UNITS) {
  const f = `src/unit-0${u.n}.html`;
  let h = fs.readFileSync(f, 'utf8');
  if (h.includes(MARK)) { console.log(`unit-0${u.n}: already patched, skipped`); continue; }
  const before = h.length;

  // 1 · CSS before the closing </style> of the page stylesheet
  const styleEnd = h.indexOf('</style>');
  if (styleEnd === -1) throw new Error(f + ': no </style>');
  h = h.slice(0, styleEnd) + CSS + h.slice(styleEnd);

  // 2 · skip link
  if (!h.includes('class="skip"')) {
    h = h.replace('<body>\n', '<body>\n<a class="skip" href="#main-content">Skip to content</a>\n');
  }

  // 3 · contents button in the topbar, ahead of the theme toggle
  h = h.replace(
    '<button class="ghost" id="theme-btn"',
    '<button class="ghost" id="toc-btn" type="button" aria-expanded="false" aria-controls="toc" title="Sections in this unit">\u2630 <span class="tw">Contents</span></button>\n  <button class="ghost" id="theme-btn"'
  );

  // 4 · drawer backdrop right after the toc nav
  h = h.replace(
    '<div class="toc-t">On this page</div></nav>',
    '<div class="toc-t">On this page</div></nav>\n<div class="toc-backdrop" id="toc-backdrop"></div>'
  );

  // 5 · anchor for the skip link
  h = h.replace('\n<main>\n', '\n<main id="main-content" tabindex="-1">\n');

  // 5b · brand and score label shorten on very small phones
  h = h.replace(
    '<a class="home" href="index.html">MFML Interactive</a>',
    '<a class="home" href="index.html">MFML<span class="txs"> Interactive</span></a>'
  );
  h = h.replace(
    /(<span class="chip" id="score-chip">)Checks (<b id="score">)/,
    '$1<span class="txs">Checks </span>$2'
  );

  // 6 · theme label collapses to just the mode on small screens
  h = h.replace(
    /themeBtn\.textContent\s*=\s*'Theme: '\s*\+\s*mode;/,
    "themeBtn.innerHTML = '<span class=\"tw\">Theme: </span>' + mode;"
  );

  // 7 · score chip turns green when every check is passed
  h = h.replace(
    /function updScore\(\)\{\s*scoreEl\.textContent\s*=\s*solved\.size;\s*\}/,
    "function updScore(){ scoreEl.textContent=solved.size;\n  var _c=document.getElementById('score-chip');\n  if(_c) _c.classList.toggle('done', solved.size >= document.querySelectorAll('.check').length); }"
  );

  // 8 · behaviour, appended to the page script
  const lastScript = h.lastIndexOf('</script>');
  if (lastScript === -1) throw new Error(f + ': no </script>');
  h = h.slice(0, lastScript) + JS(u.n) + h.slice(lastScript);

  fs.writeFileSync(f, h);
  changed++;
  console.log(`unit-0${u.n}: patched  ${before} → ${h.length} chars`);
}
console.log(changed + ' unit file(s) patched');
