/* Wire Unit 11 into the site: UNITS arrays, Unit 10's next-card, the hub (card, maps, chips, glyph), sitemap, verify suites. Idempotent. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const W = (f, s) => fs.writeFileSync(f, s);
const must = (s, from, f) => { if (!s.includes(from)) throw new Error(f + ': missing ' + from.slice(0, 80)); };
let changed = [];

/* 1 · UNITS array in every unit page */
for (let u = 1; u <= 10; u++) {
  const f = `src/unit-${String(u).padStart(2, '0')}.html`; let s = R(f);
  const from = '{"n":10,"t":"Optimization I"}]';
  if (s.includes('"n":11')) continue;
  must(s, from, f);
  s = s.replace(from, '{"n":10,"t":"Optimization I"},{"n":11,"t":"Optimization II"}]');
  W(f, s); changed.push(f);
}

/* 2 · Unit 10's next-card */
{
  const f = 'src/unit-10.html'; let s = R(f);
  const from = '<p style="margin:.35rem 0 .6rem"><strong>Unit 11 · Optimization II — Five Ways Down One Valley</strong> <span style="color:var(--ink-muted)">— coming soon</span></p>';
  if (s.includes(from)) {
    s = s.replace(from, '<p style="margin:.35rem 0 .6rem"><strong><a href="unit-11.html">Unit 11 · Optimization II — Five Ways Down One Valley →</a></strong></p>');
    const oldBlurb = 'You can now reshape a landscape so the plain walk works. Unit 11 teaches the walker new instincts — momentum that keeps rolling, strides that adapt per knob — and then fences the landscape in: what "downhill" means when you may not leave a region, Lagrange multipliers, the KKT conditions, and the dual problem that looks at the same fence from the other side.';
    must(s, oldBlurb, f);
    s = s.replace(oldBlurb, 'You reshaped the ground; Unit 11 reshapes the walker. Memory so that agreeing pushes stack and flapping ones cancel, a private stride per knob built from its own history, and forgetting so that history never becomes a life sentence — momentum, AdaGrad, RMSProp and Adam, raced on one valley. Then someone builds a wall, the answer moves onto it with the gradient still tilted, and a whole new test has to be built: the Lagrangian as a fine, complementary slackness, the five KKT conditions, and the dual that prices the wall from the other side.');
    W(f, s); changed.push(f + ' (next-card)');
  }
}

/* 3 · the hub */
{
  const f = 'src/index.html'; let s = R(f);
  if (!s.includes('data-unit="11"')) {
    const from = `    <div class="card locked">
      <canvas class="glyph" data-g="11" aria-hidden="true"></canvas>
      <div class="top"><span class="num">11</span><h3>Optimization II — Five Ways Down One Valley</h3></div>
      <p>Momentum, AdaGrad, RMSProp, Adam — and the cliffs and valleys that defeat naive descent.</p>
      <div class="foot"><span class="status soon">Coming soon</span></div>
    </div>`;
    must(s, from, f);
    s = s.replace(from, `    <a class="card" href="unit-11.html" data-unit="11">
      <canvas class="glyph" data-g="11" aria-hidden="true"></canvas>
      <div class="top"><span class="num">11</span><h3>Optimization II — Five Ways Down One Valley</h3></div>
      <p>One stride can never suit two directions, so give the walker memory, a private stride per knob, and the ability to forget — momentum, AdaGrad, RMSProp and Adam racing the same valley. Then someone builds a wall, the answer moves onto it while the gradient is still tilted, and you need a new test: the Lagrangian as a fine, complementary slackness, the five conditions, and the price of the wall.</p>
      <div class="foot"><span class="status ready">✓ Ready</span><span>15 widgets · 20 checks · 14 problems</span></div>
    </a>`);
    /* maps */
    must(s, 'const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16,8:17,9:15,10:15};', f);
    s = s.replace('const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16,8:17,9:15,10:15};', 'const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16,8:17,9:15,10:15,11:20};');
    must(s, "9:'Gradient Descent',10:'Optimization I'};", f);
    s = s.replace("9:'Gradient Descent',10:'Optimization I'};", "9:'Gradient Descent',10:'Optimization I',11:'Optimization II'};");
    /* hero chips: running totals */
    const chips = [
      ['📐 16 units · 10 live so far', '📐 16 units · 11 live so far'],
      ['🎛 96 hands-on widgets', '🎛 111 hands-on widgets'],
      ['✅ 145 pause-and-predict checks', '✅ 165 pause-and-predict checks'],
      ['✍ 110 problems solved step by step', '✍ 124 problems solved step by step'],
      ['🧾 109 rules derived step by step, nothing on faith', '🧾 132 rules derived step by step, nothing on faith'],
    ];
    for (const [a, b] of chips) { must(s, a, f); s = s.replace(a, b); }
    /* living glyph for card 11: five coloured walkers race a squashed valley, then a wall drops and the star slides onto it */
    const glyphFrom = `    /* 10 · the canyon becomes a bowl:`;
    must(s, glyphFrom, f);
    const glyph11 = `    /* 11 · five walkers race one squashed valley, then a wall drops and the answer slides onto it */
    11(g,w,h,t){ const cx=w/2, cy=h*.54, sx=w*.15, sy=h*.30, al=.1;
      const P=(x,y)=>[cx+x*sx, cy-y*sy], gr=p=>[p[0],10*p[1]];
      g.strokeStyle=pal.s1; g.lineWidth=1; glow(g,pal.s1,6); g.globalAlpha=.45;
      for(const L of [.35,1.3,3,5.5]){ g.beginPath(); g.ellipse(cx,cy,Math.sqrt(2*L)*sx,Math.sqrt(L/5)*sy,0,0,7); g.stroke(); }
      g.globalAlpha=1;
      const N=18, cols=[pal.s1,pal.s3,pal.s6,pal.s2,pal.s4], tr=[];
      for(let m=0;m<5;m++){ let p=[1,1], q=[1,1], A=[0,0], F=[0,0], path=[[1,1]];
        for(let k=1;k<=N;k++){ const gd=gr(p), n=[0,0];
          for(let i=0;i<2;i++){
            if(m===0) n[i]=p[i]-al*gd[i];
            else if(m===1) n[i]=p[i]-al*gd[i]+(k>1?.9*(p[i]-q[i]):0);
            else if(m===2){ A[i]+=gd[i]*gd[i]; n[i]=p[i]-al*gd[i]/Math.sqrt(A[i]+1e-12); }
            else if(m===3){ A[i]=.9*A[i]+.1*gd[i]*gd[i]; n[i]=p[i]-al*gd[i]/Math.sqrt(A[i]+1e-12); }
            else { F[i]=.9*F[i]+.1*gd[i]; A[i]=.999*A[i]+.001*gd[i]*gd[i];
                   const at=al*Math.sqrt(1-Math.pow(.999,k))/(1-Math.pow(.9,k)); n[i]=p[i]-at*F[i]/Math.sqrt(A[i]+1e-16); } }
          q=p; p=n; path.push([p[0],p[1]]); }
        tr.push(path); }
      const cyc=(t/9)%1, race=Math.min(1,cyc/.62), nn=Math.max(1,Math.floor(race*N));
      g.lineWidth=1.3;
      tr.forEach((path,m)=>{ g.strokeStyle=cols[m]; glow(g,cols[m],7); g.globalAlpha=cyc>.62?.28:.9; g.beginPath();
        for(let k=0;k<=nn;k++){ const Q=P(path[k][0],path[k][1]); k?g.lineTo(Q[0],Q[1]):g.moveTo(Q[0],Q[1]); } g.stroke(); });
      g.globalAlpha=1; noglow(g);
      if(cyc>.62){ const u=Math.min(1,(cyc-.62)/.16), WX=P(1,0)[0];
        g.fillStyle=pal.s2; g.globalAlpha=.10*u; g.fillRect(cx-sx*2.6,cy-sy*1.3,WX-(cx-sx*2.6),sy*2.6); g.globalAlpha=1;
        g.strokeStyle=pal.s2; g.lineWidth=2; glow(g,pal.s2,10);
        g.beginPath(); g.moveTo(WX,cy-sy*1.25*u); g.lineTo(WX,cy+sy*1.25*u); g.stroke();
        const S=P(u,0); g.fillStyle=pal.s4; glow(g,pal.s4,14); g.beginPath(); g.arc(S[0],S[1],3.2,0,7); g.fill();
        noglow(g); g.fillStyle=pal.ink2; g.globalAlpha=.75; g.font='600 8px Inter,system-ui'; g.textAlign='right'; g.fillText('µ* = 1',w-6,h-6); g.globalAlpha=1; g.textAlign='left'; }
      else { const S=P(0,0); g.fillStyle=pal.s4; glow(g,pal.s4,12); g.beginPath(); g.arc(S[0],S[1],2.6,0,7); g.fill();
        noglow(g); g.fillStyle=pal.ink2; g.globalAlpha=.75; g.font='600 8px Inter,system-ui'; g.textAlign='right'; g.fillText('step '+nn,w-6,h-6); g.globalAlpha=1; g.textAlign='left'; } },
`;
    s = s.replace(glyphFrom, glyph11 + glyphFrom);
    W(f, s); changed.push(f);
  }
}

/* 4 · sitemap */
{
  const f = '../sitemap.xml'; let s = R(f);
  if (!s.includes('unit-11.html')) { s = s.replace('<url><loc>https://linearalgebra.info/unit-10.html</loc></url>', '<url><loc>https://linearalgebra.info/unit-10.html</loc></url>\n<url><loc>https://linearalgebra.info/unit-11.html</loc></url>'); W(f, s); changed.push(f); }
}

/* 5 · verify suites */
{
  const f = 'verify-ux.js'; let s = R(f);
  if (!s.includes('11: 20')) {
    const subs = [
      ['[1, 2, 3, 4, 5, 6, 7, 8, 9, 10];', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];'],
      ['const EXPECT_CHECKS = { 1: 11, 2: 11, 3: 13, 4: 13, 5: 17, 6: 17, 7: 16, 8: 17, 9: 15, 10: 15 };', 'const EXPECT_CHECKS = { 1: 11, 2: 11, 3: 13, 4: 13, 5: 17, 6: 17, 7: 16, 8: 17, 9: 15, 10: 15, 11: 20 };'],
      ['const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12, 6: 10, 7: 11, 8: 12, 9: 12, 10: 12 };', 'const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12, 6: 10, 7: 11, 8: 12, 9: 12, 10: 12, 11: 14 };'],
      ['(u === 1 || u === 10 ? 2 : 3)', '(u === 1 || u === 11 ? 2 : 3)'],
      ['wantNext = u < 10 ? `Unit ${u + 1}` : null;', 'wantNext = u < 11 ? `Unit ${u + 1}` : null;'],
      ["if (u === 10 && navText.includes('Unit 11')) fail(tag, 'unit 10 offers a nonexistent unit 11');", "if (u === 11 && navText.includes('Unit 12')) fail(tag, 'unit 11 offers a nonexistent unit 12');"],
      ["'11 widgets · 15 checks · 12 problems', '11 widgets · 15 checks · 12 problems'];", "'11 widgets · 15 checks · 12 problems', '11 widgets · 15 checks · 12 problems', '15 widgets · 20 checks · 14 problems'];"],
      ["if (overall !== '15 of 145 checks passed') fail('hub', `overall reads \"${overall}\", expected \"15 of 145 checks passed\"`);", "if (overall !== '15 of 165 checks passed') fail('hub', `overall reads \"${overall}\", expected \"15 of 165 checks passed\"`);"],
      ["if (barW !== '10.3%') fail('hub', `overall bar width ${barW}, expected 10.3%`);", "if (barW !== '9.1%') fail('hub', `overall bar width ${barW}, expected 9.1%`);"],
    ];
    for (const [a, b] of subs) { must(s, a, f); s = s.replace(a, b); }
    W(f, s); changed.push(f);
  }
  const g = 'verify-practice.js'; let p = R(g);
  if (!p.includes("['11'")) { must(p, "['10',12,13]];", g); p = p.replace("['10',12,13]];", "['10',12,13],['11',14,16]];"); W(g, p); changed.push(g); }
}
console.log('wired:', changed.length ? changed.join(', ') : 'nothing to do');
