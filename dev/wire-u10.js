/* Wire Unit 10 into the site: UNITS arrays, Unit 9's next-card, the hub (card, maps, chips, glyph), sitemap, verify suites. Idempotent. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const W = (f, s) => fs.writeFileSync(f, s);
const must = (s, from, f) => { if (!s.includes(from)) throw new Error(f + ': missing ' + from.slice(0, 70)); };
let changed = [];

/* 1 · UNITS array in every unit page */
for (let u = 1; u <= 9; u++) {
  const f = `src/unit-0${u}.html`; let s = R(f);
  const from = '{"n":9,"t":"Gradient Descent"}]';
  if (s.includes('"n":10')) continue;
  must(s, from, f);
  s = s.replace(from, '{"n":9,"t":"Gradient Descent"},{"n":10,"t":"Optimization I"}]');
  W(f, s); changed.push(f);
}

/* 2 · Unit 9's next-card */
{
  const f = 'src/unit-09.html'; let s = R(f);
  const from = '<p style="margin:.35rem 0 .6rem"><strong>Unit 10 · Optimization I — Gradients that Work</strong> <span style="color:var(--ink-muted)">— coming soon</span></p>';
  if (s.includes(from)) {
    s = s.replace(from, '<p style="margin:.35rem 0 .6rem"><strong><a href="unit-10.html">Unit 10 · Optimization I — Gradients that Work →</a></strong></p>');
    const oldBlurb = 'You can now walk downhill, choose a stride, and afford the walk on big data. Unit 10 asks why the plain walk is so slow in a trench and fixes it: momentum that remembers the last step, strides that adapt per knob, and the difference between a landscape that is a bowl and one that only looks like it.';
    must(s, oldBlurb, f);
    s = s.replace(oldBlurb, 'You can now walk downhill, choose a stride, and afford the walk on big data. Unit 10 is about the four ways that walk quietly goes wrong — a bad start, memorising instead of learning, the wrong valley or a salt flat, and a canyon that makes every step bounce — and the cheapest fix in machine learning: change the units of the data, not the model, so the canyon becomes a bowl.');
    W(f, s); changed.push(f + ' (next-card)');
  }
}

/* 3 · the hub */
{
  const f = 'src/index.html'; let s = R(f);
  if (!s.includes('data-unit="10"')) {
    const from = `    <div class="card locked">
      <canvas class="glyph" data-g="10" aria-hidden="true"></canvas>
      <div class="top"><span class="num">10</span><h3>Optimization I — Gradients that Work</h3></div>
      <p>Nonlinear optimization and the minutiae that make or break gradient methods.</p>
      <div class="foot"><span class="status soon">Coming soon</span></div>
    </div>`;
    must(s, from, f);
    s = s.replace(from, `    <a class="card" href="unit-10.html" data-unit="10">
      <canvas class="glyph" data-g="10" aria-hidden="true"></canvas>
      <div class="top"><span class="num">10</span><h3>Optimization I — Gradients that Work</h3></div>
      <p>The four ways the walk goes wrong — a bad start, memorising, the wrong valley or a salt flat, a canyon that makes every step bounce — and the cheapest fix in machine learning: change the units of the data, not the model, and watch the canyon become a bowl.</p>
      <div class="foot"><span class="status ready">✓ Ready</span><span>11 widgets · 15 checks · 12 problems</span></div>
    </a>`);
    /* maps */
    must(s, 'const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16,8:17,9:15};', f);
    s = s.replace('const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16,8:17,9:15};', 'const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16,8:17,9:15,10:15};');
    must(s, "8:'Taylor & MacLaurin',9:'Gradient Descent'};", f);
    s = s.replace("8:'Taylor & MacLaurin',9:'Gradient Descent'};", "8:'Taylor & MacLaurin',9:'Gradient Descent',10:'Optimization I'};");
    /* hero chips: running totals */
    const chips = [
      ['📐 16 units · 9 live so far', '📐 16 units · 10 live so far'],
      ['🎛 85 hands-on widgets', '🎛 96 hands-on widgets'],
      ['✅ 130 pause-and-predict checks', '✅ 145 pause-and-predict checks'],
      ['✍ 98 problems solved step by step', '✍ 110 problems solved step by step'],
      ['🧾 93 rules derived step by step, nothing on faith', '🧾 109 rules derived step by step, nothing on faith'],
    ];
    for (const [a, b] of chips) { must(s, a, f); s = s.replace(a, b); }
    /* living glyph for card 10: a canyon of contours that breathes into a round bowl, and a walker whose zig-zag straightens as it does */
    const glyphFrom = `    /* 09 · a walker zig-zagging down a trench of contours, step by step */`;
    must(s, glyphFrom, f);
    const glyph10 = `    /* 10 · the canyon becomes a bowl: the contours' stiffness breathes 9 → 1 → 9 and the walker's zig-zag straightens with it */
    10(g,w,h,t){ const cx=w/2, cy=h*.52; const u=(1-Math.cos(t/7*2*Math.PI))/2, c=1+8*Math.pow(1-u,1.6); const sx=w*.11, sy=h*.36; const gam=.9*2/(2*c);
      const P=(x,y)=>[cx+x*sx, cy-y*sy];
      g.strokeStyle=pal.s1; g.lineWidth=1; glow(g,pal.s1,6); g.globalAlpha=.55;
      for(const L of [.3,1.2,2.8,5.2]){ const rx=Math.sqrt(L), ry=Math.sqrt(L/c); g.beginPath(); g.ellipse(cx,cy,rx*sx,ry*sy,0,0,7); g.stroke(); }
      g.globalAlpha=1;
      const pts=[]; let x=-2.1, y=.95; for(let k=0;k<13;k++){ pts.push([x,y]); x-=gam*2*x; y-=gam*2*c*y; }
      g.strokeStyle=pal.s3; g.lineWidth=1.6; glow(g,pal.s3,9); g.beginPath(); pts.forEach(([X,Y],k)=>{ const q=P(X,Y); k?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]); }); g.stroke();
      const q=P(...pts[pts.length-1]); g.fillStyle=pal.s4; glow(g,pal.s4,14); g.beginPath(); g.arc(q[0],q[1],3.2,0,7); g.fill();
      noglow(g); g.fillStyle=pal.ink2; g.globalAlpha=.75; g.font='600 8px Inter,system-ui'; g.textAlign='right'; g.fillText('κ = '+c.toFixed(1),w-6,h-6); g.globalAlpha=1; g.textAlign='left'; },
`;
    s = s.replace(glyphFrom, glyph10 + glyphFrom);
    W(f, s); changed.push(f);
  }
}

/* 4 · sitemap */
{
  const f = '../sitemap.xml'; let s = R(f);
  if (!s.includes('unit-10.html')) { s = s.replace('<url><loc>https://linearalgebra.info/unit-09.html</loc></url>', '<url><loc>https://linearalgebra.info/unit-09.html</loc></url>\n<url><loc>https://linearalgebra.info/unit-10.html</loc></url>'); W(f, s); changed.push(f); }
}

/* 5 · verify suites */
{
  const f = 'verify-ux.js'; let s = R(f);
  if (!s.includes('10: 15')) {
    const subs = [
      ['[1, 2, 3, 4, 5, 6, 7, 8, 9];', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10];'],
      ['const EXPECT_CHECKS = { 1: 11, 2: 11, 3: 13, 4: 13, 5: 17, 6: 17, 7: 16, 8: 17, 9: 15 };', 'const EXPECT_CHECKS = { 1: 11, 2: 11, 3: 13, 4: 13, 5: 17, 6: 17, 7: 16, 8: 17, 9: 15, 10: 15 };'],
      ['const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12, 6: 10, 7: 11, 8: 12, 9: 12 };', 'const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12, 6: 10, 7: 11, 8: 12, 9: 12, 10: 12 };'],
      ['(u === 1 || u === 9 ? 2 : 3)', '(u === 1 || u === 10 ? 2 : 3)'],
      ['wantNext = u < 9 ? `Unit ${u + 1}` : null;', 'wantNext = u < 10 ? `Unit ${u + 1}` : null;'],
      ["if (u === 9 && navText.includes('Unit 10')) fail(tag, 'unit 9 offers a nonexistent unit 10');", "if (u === 10 && navText.includes('Unit 11')) fail(tag, 'unit 10 offers a nonexistent unit 11');"],
      ["'9 widgets · 17 checks · 12 problems', '11 widgets · 15 checks · 12 problems'];", "'9 widgets · 17 checks · 12 problems', '11 widgets · 15 checks · 12 problems', '11 widgets · 15 checks · 12 problems'];"],
      ["if (overall !== '15 of 130 checks passed') fail('hub', `overall reads \"${overall}\", expected \"15 of 130 checks passed\"`);", "if (overall !== '15 of 145 checks passed') fail('hub', `overall reads \"${overall}\", expected \"15 of 145 checks passed\"`);"],
      ["if (barW !== '11.5%') fail('hub', `overall bar width ${barW}, expected 11.5%`);", "if (barW !== '10.3%') fail('hub', `overall bar width ${barW}, expected 10.3%`);"],
    ];
    for (const [a, b] of subs) { must(s, a, f); s = s.replace(a, b); }
    W(f, s); changed.push(f);
  }
  const g = 'verify-practice.js'; let p = R(g);
  if (!p.includes("['10'")) { must(p, "['09',12,13]];", g); p = p.replace("['09',12,13]];", "['09',12,13],['10',12,13]];"); W(g, p); changed.push(g); }
}
console.log('wired:', changed.length ? changed.join(', ') : 'nothing to do');

/* 6 · two-digit unit filenames: the unit switcher and the hub's continue-link used 'unit-0'+n, which breaks at unit 10 (idempotent) */
{
  const fs2 = require('fs');
  for (const f of [...Array.from({ length: 10 }, (_, i) => `src/unit-${String(i + 1).padStart(2, '0')}.html`), 'src/index.html', 'tpl/js-uxv2.js']) {
    let s = R(f), o = s;
    s = s.replace("unit-0'+prev.n+'.html", "unit-'+String(prev.n).padStart(2,'0')+'.html").replace("unit-0'+next.n+'.html", "unit-'+String(next.n).padStart(2,'0')+'.html").replace("link.href='unit-0'+u+'.html#'", "link.href='unit-'+String(u).padStart(2,'0')+'.html#'");
    if (s !== o) { W(f, s); console.log('two-digit filenames:', f); }
  }
}
