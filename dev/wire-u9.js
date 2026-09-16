/* Wire Unit 9 into the site: UNITS arrays, Unit 8's next-card, the hub (card, maps, chips, glyph), sitemap, verify suites. Idempotent. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const W = (f, s) => fs.writeFileSync(f, s);
const must = (s, from, f) => { if (!s.includes(from)) throw new Error(f + ': missing ' + from.slice(0, 70)); };
let changed = [];

/* 1 · UNITS array in every unit page */
for (let u = 1; u <= 8; u++) {
  const f = `src/unit-0${u}.html`; let s = R(f);
  const from = '{"n":8,"t":"Taylor & MacLaurin"}]';
  if (s.includes('"n":9')) continue;
  must(s, from, f);
  s = s.replace(from, '{"n":8,"t":"Taylor & MacLaurin"},{"n":9,"t":"Gradient Descent"}]');
  W(f, s); changed.push(f);
}

/* 2 · Unit 8's next-card */
{
  const f = 'src/unit-08.html'; let s = R(f);
  const from = '<p style="margin:.35rem 0 .6rem"><strong>Unit 9 · Gradient Descent</strong> <span style="color:var(--ink-muted)">— coming soon</span></p>';
  if (s.includes(from)) {
    s = s.replace(from, '<p style="margin:.35rem 0 .6rem"><strong><a href="unit-09.html">Unit 9 · Gradient Descent →</a></strong></p>');
    s = s.replace("You now know what a landscape looks like near a flat point and how to tell a bowl from a saddle. Unit 9 starts walking: step sizes, why the mean value theorem guarantees a descent step, how the Hessian's eigenvalues set the speed limit, and what happens in the fog of a million dimensions.",
      "You now know what a landscape looks like near a flat point and how to tell a bowl from a saddle. Unit 9 starts walking: the descent rule proved, the step-size speed limit the Hessian's eigenvalues set and the zig-zag it causes, exact line search, learning-rate schedules, gradient checking — and stochastic gradient descent, why a random spoonful of the data points the right way.");
    W(f, s); changed.push(f + ' (next-card)');
  }
}

/* 3 · the hub */
{
  const f = 'src/index.html'; let s = R(f);
  if (!s.includes('data-unit="9"')) {
    const from = `    <div class="card locked">
      <canvas class="glyph" data-g="9" aria-hidden="true"></canvas>
      <div class="top"><span class="num">09</span><h3>Gradient Descent</h3></div>
      <p>Walk downhill in thick fog: steps, step sizes, and why a little noise helps you scale.</p>
      <div class="foot"><span class="status soon">Coming soon</span></div>
    </div>`;
    must(s, from, f);
    s = s.replace(from, `    <a class="card" href="unit-09.html" data-unit="9">
      <canvas class="glyph" data-g="9" aria-hidden="true"></canvas>
      <div class="top"><span class="num">09</span><h3>Gradient Descent</h3></div>
      <p>Walk downhill in thick fog: the descent rule proved, the step-size speed limit and the zig-zag, exact line search, schedules, gradient checking — and why a random spoonful of the data (stochastic gradient descent) points the right way.</p>
      <div class="foot"><span class="status ready">✓ Ready</span><span>9 widgets · 13 checks · 12 problems</span></div>
    </a>`);
    /* maps */
    must(s, 'const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16,8:17};', f);
    s = s.replace('const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16,8:17};', 'const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16,8:17,9:13};');
    must(s, "7:'Backprop & Auto-diff',8:'Taylor & MacLaurin'};", f);
    s = s.replace("7:'Backprop & Auto-diff',8:'Taylor & MacLaurin'};", "7:'Backprop & Auto-diff',8:'Taylor & MacLaurin',9:'Gradient Descent'};");
    /* hero chips: running totals */
    const chips = [
      ['📐 16 units · 8 live so far', '📐 16 units · 9 live so far'],
      ['🎛 74 hands-on widgets', '🎛 83 hands-on widgets'],
      ['✅ 115 pause-and-predict checks', '✅ 128 pause-and-predict checks'],
      ['✍ 86 problems solved step by step', '✍ 98 problems solved step by step'],
      ['🧾 77 rules derived step by step, nothing on faith', '🧾 93 rules derived step by step, nothing on faith'],
    ];
    for (const [a, b] of chips) { must(s, a, f); s = s.replace(a, b); }
    /* living glyph for card 09: a walker zig-zagging down a trench of contours */
    const glyphFrom = `    /* 08 · a curve and its Taylor impostor, growing one degree at a time */`;
    must(s, glyphFrom, f);
    const glyph9 = `    /* 09 · a walker zig-zagging down a trench of contours, step by step */
    9(g,w,h,t){ const cx=w/2, cy=h*.52, L1=9, L2=1.2, gam=.16; const sx=w*.11, sy=h*.36;
      const f=(x,y)=>.5*(L1*x*x+L2*y*y); const P=(x,y)=>[cx+x*sx, cy-y*sy];
      g.strokeStyle=pal.s1; g.lineWidth=1; glow(g,pal.s1,6); g.globalAlpha=.55;
      for(const c of [.25,1,2.4,4.6]){ const rx=Math.sqrt(2*c/L1), ry=Math.sqrt(2*c/L2); g.beginPath(); g.ellipse(cx,cy,rx*sx,ry*sy,0,0,7); g.stroke(); }
      g.globalAlpha=1;
      /* the walk: 14 fixed-step iterates from (−0.95, 1.05), revealed one per 0.28 s, looping every ~5.5 s */
      const pts=[]; let x=-.95, y=1.05; for(let k=0;k<15;k++){ pts.push([x,y]); x-=gam*L1*x; y-=gam*L2*y; }
      const cyc=(t/5.5)%1, n=Math.min(14,Math.floor(cyc*19.6)), fr=Math.min(1,cyc*19.6-n);
      g.strokeStyle=pal.s3; g.lineWidth=1.6; glow(g,pal.s3,9); g.beginPath();
      for(let k=0;k<=n;k++){ const [X,Y]=P(...pts[k]); k?g.lineTo(X,Y):g.moveTo(X,Y); }
      let hx,hy; if(n<14){ const a=pts[n], b=pts[n+1]; const e=C.ease.out(fr); hx=a[0]+(b[0]-a[0])*e; hy=a[1]+(b[1]-a[1])*e; g.lineTo(...P(hx,hy)); } else { [hx,hy]=pts[14]; }
      g.stroke();
      g.fillStyle=pal.s4; glow(g,pal.s4,14); g.beginPath(); const [HX,HY]=P(hx,hy); g.arc(HX,HY,3.2,0,7); g.fill();
      noglow(g); g.fillStyle=pal.ink2; g.globalAlpha=.75; g.font='600 8px Inter,system-ui'; g.textAlign='right'; g.fillText('step '+Math.min(n,14),w-6,h-6); g.globalAlpha=1; g.textAlign='left'; },
`;
    s = s.replace(glyphFrom, glyph9 + glyphFrom);
    W(f, s); changed.push(f);
  }
}

/* 4 · sitemap */
{
  const f = '../sitemap.xml'; let s = R(f);
  if (!s.includes('unit-09.html')) { s = s.replace('<url><loc>https://linearalgebra.info/unit-08.html</loc></url>', '<url><loc>https://linearalgebra.info/unit-08.html</loc></url>\n<url><loc>https://linearalgebra.info/unit-09.html</loc></url>'); W(f, s); changed.push(f); }
}

/* 5 · verify suites */
{
  const f = 'verify-ux.js'; let s = R(f);
  if (!s.includes('9: 13')) {
    const subs = [
      ['[1, 2, 3, 4, 5, 6, 7, 8];', '[1, 2, 3, 4, 5, 6, 7, 8, 9];'],
      ['const EXPECT_CHECKS = { 1: 11, 2: 11, 3: 13, 4: 13, 5: 17, 6: 17, 7: 16, 8: 17 };', 'const EXPECT_CHECKS = { 1: 11, 2: 11, 3: 13, 4: 13, 5: 17, 6: 17, 7: 16, 8: 17, 9: 13 };'],
      ['const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12, 6: 10, 7: 11, 8: 12 };', 'const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12, 6: 10, 7: 11, 8: 12, 9: 12 };'],
      ['(u === 1 || u === 8 ? 2 : 3)', '(u === 1 || u === 9 ? 2 : 3)'],
      ['wantNext = u < 8 ? `Unit ${u + 1}` : null;', 'wantNext = u < 9 ? `Unit ${u + 1}` : null;'],
      ["if (u === 8 && navText.includes('Unit 9')) fail(tag, 'unit 8 offers a nonexistent unit 9');", "if (u === 9 && navText.includes('Unit 10')) fail(tag, 'unit 9 offers a nonexistent unit 10');"],
      ["'7 widgets · 16 checks · 11 problems', '9 widgets · 17 checks · 12 problems'];", "'7 widgets · 16 checks · 11 problems', '9 widgets · 17 checks · 12 problems', '9 widgets · 13 checks · 12 problems'];"],
      ["if (overall !== '15 of 115 checks passed') fail('hub', `overall reads \"${overall}\", expected \"15 of 115 checks passed\"`);", "if (overall !== '15 of 128 checks passed') fail('hub', `overall reads \"${overall}\", expected \"15 of 128 checks passed\"`);"],
      ["if (barW !== '13%') fail('hub', `overall bar width ${barW}, expected 13% (13.04 → toFixed(1) → 13.0 → serialised 13%)`);", "if (barW !== '11.7%') fail('hub', `overall bar width ${barW}, expected 11.7%`);"],
    ];
    for (const [a, b] of subs) { must(s, a, f); s = s.replace(a, b); }
    W(f, s); changed.push(f);
  }
  const g = 'verify-practice.js'; let p = R(g);
  if (!p.includes("['09'")) { must(p, "['08',12,15]];", g); p = p.replace("['08',12,15]];", "['08',12,15],['09',12,12]];"); W(g, p); changed.push(g); }
}
console.log('wired:', changed.length ? changed.join(', ') : 'nothing to do');
