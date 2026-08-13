/* MFML hub (index.html) · UX enhancement patch — real progress, resume, a11y, print.
   Idempotent: re-running is a no-op. */
const fs = require('fs');
const F = 'src/index.html';
const MARK = 'MBM-UX-V2';

let h = fs.readFileSync(F, 'utf8');
if (h.includes(MARK)) { console.log('index.html: already patched, skipped'); process.exit(0); }
const before = h.length;
const must = (cond, msg) => { if (!cond) throw new Error('index.html: ' + msg); };

/* 1 · palette needs two more tokens the unit pages already have */
let n = h.replace(
  '  --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; --good-text:#006300;\n',
  '  --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; --good-text:#006300;\n  --good:#0ca30c; --critical:#d03b3b;\n'
);
must(n !== h, 'light palette not found'); h = n;

/* 2 · stylesheet additions */
const CSS = `/* ================= ${MARK} · progress, resume, a11y, print ================= */
a.skip{position:absolute;left:-9999px;top:0;z-index:100;background:var(--s1);color:#fff;padding:.55rem 1rem;border-radius:0 0 10px 0;font-family:var(--sans);font-size:.85rem;font-weight:650;text-decoration:none}
a.skip:focus{left:0}
:focus-visible{outline:2px solid var(--s1);outline-offset:2px;border-radius:6px}
.progress-row{display:none;flex-wrap:wrap;align-items:center;gap:.9rem;margin-top:1.5rem}
.progress-row.on{display:flex}
a.cta{display:inline-flex;align-items:center;gap:.45rem;background:var(--s1);color:#fff;border:1px solid var(--s1);border-radius:999px;
      padding:.44rem 1.05rem;font-family:var(--sans);font-size:.86rem;font-weight:650;text-decoration:none;
      box-shadow:0 12px 26px -16px rgba(42,120,214,.9)}
a.cta:hover{filter:brightness(1.08)}
.overall{display:flex;align-items:center;gap:.6rem;font-family:var(--sans);font-size:.8rem;color:var(--ink-2)}
.obar{width:9rem;height:6px;border-radius:999px;background:var(--grid);overflow:hidden}
.obar i{display:block;height:100%;width:0;background:var(--s3);transition:width .55s cubic-bezier(.2,.8,.3,1)}
.pline{display:flex;align-items:center;gap:.55rem;margin-top:.5rem}
.cprog{flex:1;height:5px;border-radius:999px;background:var(--grid);overflow:hidden;min-width:3rem}
.cprog i{display:block;height:100%;background:var(--s3)}
.cnum{font-size:.72rem;color:var(--ink-muted);white-space:nowrap;font-family:var(--sans)}
.card.complete{border-color:var(--good)}
.status.done{color:var(--good-text);background:var(--wash-good)}
button.link{background:none;border:none;color:var(--ink-muted);font-family:var(--sans);font-size:.78rem;cursor:pointer;text-decoration:underline;padding:0}
button.link:hover{color:var(--ink-2)}
button.link.arm{color:var(--critical);text-decoration:none;font-weight:650}
@media (max-width:620px){
  .topbar{flex-wrap:wrap;gap:.5rem .75rem}
  .topbar .org{flex-basis:100%;order:4}
  header.hero{padding:2.4rem 0 1.6rem}
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
}
@media print{
  .topbar,a.skip,.progress-row{display:none!important}
  body::before{display:none}
  body{background:#fff;color:#000}
  .card,a.card{break-inside:avoid;box-shadow:none;transform:none}
  a{color:#000;text-decoration:none}
}
`;
n = h.replace('</style>', CSS + '</style>');
must(n !== h, 'no </style>'); h = n;

/* 3 · skip link + a class on the org line so it can wrap on phones */
n = h.replace('<body>\n<div class="wrap">', '<body>\n<a class="skip" href="#units">Skip to the unit list</a>\n<div class="wrap">');
must(n !== h, 'body open not found'); h = n;
n = h.replace('<span style="color:var(--ink-muted)">ZC416', '<span class="org" style="color:var(--ink-muted)">ZC416');
must(n !== h, 'org line not found'); h = n;

/* 4 · swap the broken unit-1-only chip for a real progress row */
n = h.replace(
  '      <span class="chip" id="prog-chip" style="display:none">Unit 1 checks: <b id="prog-val" style="margin-left:.2rem"></b></span>\n    </div>\n  </header>',
  `    </div>
    <div class="progress-row" id="progress-row">
      <a class="cta" id="continue-link" href="unit-01.html" hidden>Continue where you left off →</a>
      <div class="overall" id="overall" hidden>
        <div class="obar"><i id="obar-fill"></i></div>
        <span id="overall-txt"></span>
      </div>
    </div>
  </header>`
);
must(n !== h, 'prog-chip not found'); h = n;

/* 5 · skip-link target */
n = h.replace('<h2 class="part">Part I · Linear Algebra</h2>', '<h2 class="part" id="units">Part I · Linear Algebra</h2>');
must(n !== h, 'Part I heading not found'); h = n;

/* 6 · tag the five live cards */
for (let u = 1; u <= 5; u++) {
  const o = `<a class="card" href="unit-0${u}.html">`;
  must(h.split(o).length === 2, `card ${u} anchor not unique`);
  h = h.replace(o, `<a class="card" href="unit-0${u}.html" data-unit="${u}">`);
}

/* 7 · Unit 1's card undercounted (page really has 11 widgets and 10 checks) */
n = h.replace('<span>10 widgets · 9 checks · 10 problems</span>', '<span>11 widgets · 10 checks · 10 problems</span>');
must(n !== h, 'unit-1 foot text not found'); h = n;

/* 8 · footer gains a privacy note + reset */
n = h.replace(
  "  <footer>Built from Prof. Saurabh's ZC416 lecture slides and companion readers · BITS Pilani Work Integrated Learning Programmes · Interactive edition</footer>",
  `  <footer>
    <p style="margin:0 0 .5rem">Built from Prof. Saurabh's ZC416 lecture slides and companion readers · BITS Pilani Work Integrated Learning Programmes · Interactive edition</p>
    <p style="margin:0">Your progress is stored only in this browser, never sent anywhere. <button class="link" id="reset-btn" type="button" hidden>Reset my progress</button></p>
  </footer>`
);
must(n !== h, 'footer not found'); h = n;

/* 9 · real progress logic replaces the hardcoded /8 */
const OLD_JS = `  const done=(store.get('mfml-u1-checks')||'').split(',').filter(Boolean).length;
  if(done>0){ document.getElementById('prog-chip').style.display='inline-flex'; document.getElementById('prog-val').textContent=done+'/8'; }
})();`;
const NEW_JS = `  /* ============ ${MARK} · real progress across every unit ============ */
  /* Fallbacks are used only until a student opens the unit itself — each unit
     page writes its true check count to mfml-uN-total when it loads. */
  const FALLBACK={1:10,2:10,3:11,4:12,5:12};
  const TITLE={1:'Systems of Linear Equations',2:'Vector Spaces',3:'Analytic Geometry',
               4:'Determinants & Eigenvalues',5:'Decompositions & SVD'};
  let done=0, total=0;

  document.querySelectorAll('a.card[data-unit]').forEach(card=>{
    const u=+card.dataset.unit;
    const t=+(store.get('mfml-u'+u+'-total')||FALLBACK[u]||0);
    const d=Math.min((store.get('mfml-u'+u+'-checks')||'').split(',').filter(Boolean).length, t);
    done+=d; total+=t;
    if(d<=0) return;
    const line=document.createElement('div');
    line.className='pline';
    line.innerHTML='<div class="cprog"><i style="width:'+(t?(d/t*100).toFixed(1):0)+'%"></i></div>'
                 + '<span class="cnum">'+d+'/'+t+' checks</span>';
    card.appendChild(line);
    if(t>0 && d>=t){
      card.classList.add('complete');
      const s=card.querySelector('.status');
      if(s){ s.className='status done'; s.textContent='✓ Complete'; }
    }
  });

  const row=document.getElementById('progress-row');
  if(done>0 && total>0){
    row.classList.add('on');
    document.getElementById('overall').hidden=false;
    document.getElementById('overall-txt').textContent=done+' of '+total+' checks passed';
    requestAnimationFrame(()=>{ document.getElementById('obar-fill').style.width=(done/total*100).toFixed(1)+'%'; });
    document.getElementById('reset-btn').hidden=false;
  }

  /* pick up exactly where the reading stopped */
  const last=(store.get('mfml-last')||'').split('|');
  if(last.length===2 && TITLE[+last[0]]){
    const u=+last[0], link=document.getElementById('continue-link');
    link.href='unit-0'+u+'.html#'+last[1];
    link.textContent='Continue · Unit '+u+' — '+TITLE[u]+' →';
    link.hidden=false;
    row.classList.add('on');
  }

  /* reset — two taps, no browser dialog, theme survives */
  const rb=document.getElementById('reset-btn');
  let armed=false;
  rb.addEventListener('click',()=>{
    if(!armed){ armed=true; rb.classList.add('arm'); rb.textContent='Tap again to erase all progress';
                setTimeout(()=>{armed=false;rb.classList.remove('arm');rb.textContent='Reset my progress';},5000); return; }
    try{ Object.keys(localStorage).filter(k=>/^mfml-/.test(k)&&k!=='mfml-theme').forEach(k=>localStorage.removeItem(k)); }catch(e){}
    location.reload();
  });
})();`;
must(h.includes(OLD_JS), 'old progress script not found');
h = h.replace(OLD_JS, NEW_JS);

fs.writeFileSync(F, h);
console.log(`index.html: patched  ${before} → ${h.length} chars`);
