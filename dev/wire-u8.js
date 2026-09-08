/* Wire Unit 8 into the site: UNITS arrays, Unit 7's next-card, the hub (card, maps, chips, glyph), sitemap, verify suites. Idempotent. */
const fs = require('fs');
const R = f => fs.readFileSync(f, 'utf8');
const W = (f, s) => fs.writeFileSync(f, s);
const must = (s, from, f) => { if (!s.includes(from)) throw new Error(f + ': missing ' + from.slice(0, 70)); };
let changed = [];

/* 1 · UNITS array in every unit page */
for (let u = 1; u <= 7; u++) {
  const f = `src/unit-0${u}.html`; let s = R(f);
  const from = '{"n":7,"t":"Backprop & Auto-diff"}]';
  if (s.includes('"n":8')) continue;
  must(s, from, f);
  s = s.replace(from, '{"n":7,"t":"Backprop & Auto-diff"},{"n":8,"t":"Taylor & MacLaurin"}]');
  W(f, s); changed.push(f);
}

/* 2 · Unit 7's next-card */
{
  const f = 'src/unit-07.html'; let s = R(f);
  const from = '<p style="margin:.35rem 0 .6rem"><strong>Unit 8 · Taylor &amp; MacLaurin Series</strong> <span style="color:var(--ink-muted)">— coming soon</span></p>';
  if (s.includes(from)) {
    s = s.replace(from, '<p style="margin:.35rem 0 .6rem"><strong><a href="unit-08.html">Unit 8 · Taylor &amp; MacLaurin Series →</a></strong></p>');
    s = s.replace('Linearization kept one derivative and got a line. Unit 8 keeps them all: rebuilding functions from their derivatives at a point, with the error terms that say exactly how far each cut can be trusted — the mathematics behind every "local approximation" the rest of the course will make.',
      'Linearization kept one derivative and got a line. Unit 8 keeps them all — and proves, from a single flat spot on a hiking trail, exactly how far each cut of the series can be trusted. Then it takes the second-order term into two variables, where it becomes the Hessian: the judge that tells a bowl from a dome from a saddle at the bottom of every loss valley.');
    W(f, s); changed.push(f + ' (next-card)');
  }
}

/* 3 · the hub */
{
  const f = 'src/index.html'; let s = R(f);
  if (!s.includes('data-unit="8"')) {
    const from = `    <div class="card locked">
      <canvas class="glyph" data-g="8" aria-hidden="true"></canvas>
      <div class="top"><span class="num">08</span><h3>Taylor &amp; MacLaurin Series</h3></div>
      <p>Polynomial impostors: approximating any function — and knowing exactly how big the lie (the remainder) is.</p>
      <div class="foot"><span class="status soon">Coming soon</span></div>
    </div>`;
    must(s, from, f);
    s = s.replace(from, `    <a class="card" href="unit-08.html" data-unit="8">
      <canvas class="glyph" data-g="8" aria-hidden="true"></canvas>
      <div class="top"><span class="num">08</span><h3>Taylor &amp; MacLaurin Series</h3></div>
      <p>Polynomial impostors: where Taylor's formula comes from, exactly how big the lie (the remainder) is — and the Hessian, the judge that tells a bowl from a dome from a saddle.</p>
      <div class="foot"><span class="status ready">✓ Ready</span><span>8 widgets · 16 checks · 12 problems</span></div>
    </a>`);
    /* maps */
    must(s, 'const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16};', f);
    s = s.replace('const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16};', 'const FALLBACK={1:11,2:11,3:13,4:13,5:17,6:17,7:16,8:16};');
    must(s, "6:'Differentiation',7:'Backprop & Auto-diff'};", f);
    s = s.replace("6:'Differentiation',7:'Backprop & Auto-diff'};", "6:'Differentiation',7:'Backprop & Auto-diff',8:'Taylor & MacLaurin'};");
    /* hero chips: running totals */
    const chips = [
      ['📐 16 units · 7 live so far', '📐 16 units · 8 live so far'],
      ['🎛 65 hands-on widgets', '🎛 73 hands-on widgets'],
      ['✅ 98 pause-and-predict checks', '✅ 114 pause-and-predict checks'],
      ['✍ 74 problems solved step by step', '✍ 86 problems solved step by step'],
      ['🧾 60 rules derived step by step, nothing on faith', '🧾 76 rules derived step by step, nothing on faith'],
    ];
    for (const [a, b] of chips) { must(s, a, f); s = s.replace(a, b); }
    /* living glyph for card 08: a curve and its polynomial impostor of growing degree */
    const glyphFrom = `    /* 07 · blame flowing backwards through a small graph */`;
    must(s, glyphFrom, f);
    const glyph8 = `    /* 08 · a curve and its Taylor impostor, growing one degree at a time */
    8(g,w,h,t){ const cx=w/2, cy=h*.55, X=w*.42, S=15; const f=x=>Math.sin(x), df=[Math.sin,Math.cos,x=>-Math.sin(x),x=>-Math.cos(x)];
      const a=.55*Math.sin(t*.35); const cyc=(t*.5)%4, deg=Math.floor(cyc), grow=C.ease.out(Math.min(1,(cyc-deg)*1.6));
      const P=x=>{ let s=0, p=1, fac=1; for(let k=0;k<=deg;k++){ if(k){ p*=(x-a); fac*=k; } const term=df[k%4](a)/fac*p; s+= (k===deg? grow*term : term); } return s; };
      g.strokeStyle=pal.s1; g.lineWidth=1.8; glow(g,pal.s1,9); g.beginPath();
      for(let i=0;i<=60;i++){ const x=-2.6+5.2*i/60; const y=f(x); i?g.lineTo(cx+x*X/2.6,cy-y*S):g.moveTo(cx+x*X/2.6,cy-y*S); } g.stroke();
      g.strokeStyle=pal.s2; g.lineWidth=2.2; glow(g,pal.s2,11); g.beginPath(); let on=false;
      for(let i=0;i<=80;i++){ const x=-2.6+5.2*i/80; const y=Math.max(-2.4,Math.min(2.4,P(x))); if(Math.abs(P(x))>2.4){ on=false; continue; } on?g.lineTo(cx+x*X/2.6,cy-y*S):g.moveTo(cx+x*X/2.6,cy-y*S); on=true; } g.stroke();
      g.fillStyle=pal.s4; glow(g,pal.s4,14); g.beginPath(); g.arc(cx+a*X/2.6,cy-f(a)*S,3.4,0,7); g.fill();
      noglow(g); g.fillStyle=pal.ink2; g.globalAlpha=.75; g.font='600 8px Inter,system-ui'; g.textAlign='right'; g.fillText('degree '+deg,w-6,h-6); g.globalAlpha=1; g.textAlign='left'; },
`;
    s = s.replace(glyphFrom, glyph8 + glyphFrom);
    W(f, s); changed.push(f);
  }
}

/* 4 · sitemap */
{
  const f = '../sitemap.xml'; let s = R(f);
  if (!s.includes('unit-08.html')) { s = s.replace('<url><loc>https://linearalgebra.info/unit-07.html</loc></url>', '<url><loc>https://linearalgebra.info/unit-07.html</loc></url>\n<url><loc>https://linearalgebra.info/unit-08.html</loc></url>'); W(f, s); changed.push(f); }
}

/* 5 · verify suites */
{
  const f = 'verify-ux.js'; let s = R(f);
  if (!s.includes('8: 16')) {
    const subs = [
      ['const UNITS = [1, 2, 3, 4, 5, 6, 7];', 'const UNITS = [1, 2, 3, 4, 5, 6, 7, 8];'],
      ['const EXPECT_CHECKS = { 1: 11, 2: 11, 3: 13, 4: 13, 5: 17, 6: 17, 7: 16 };', 'const EXPECT_CHECKS = { 1: 11, 2: 11, 3: 13, 4: 13, 5: 17, 6: 17, 7: 16, 8: 16 };'],
      ['const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12, 6: 10, 7: 11 };', 'const EXPECT_PROBS = { 1: 10, 2: 18, 3: 8, 4: 5, 5: 12, 6: 10, 7: 11, 8: 12 };'],
      ['(u === 1 || u === 7 ? 2 : 3)', '(u === 1 || u === 8 ? 2 : 3)'],
      ['wantNext = u < 7 ? `Unit ${u + 1}` : null;', 'wantNext = u < 8 ? `Unit ${u + 1}` : null;'],
      ["if (u === 7 && navText.includes('Unit 8')) fail(tag, 'unit 7 offers a nonexistent unit 8');", "if (u === 8 && navText.includes('Unit 9')) fail(tag, 'unit 8 offers a nonexistent unit 9');"],
      ["'7 widgets · 16 checks · 11 problems'];", "'7 widgets · 16 checks · 11 problems', '8 widgets · 16 checks · 12 problems'];"],
      ["if (overall !== '15 of 98 checks passed') fail('hub', `overall reads \"${overall}\", expected \"15 of 98 checks passed\"`);", "if (overall !== '15 of 114 checks passed') fail('hub', `overall reads \"${overall}\", expected \"15 of 114 checks passed\"`);"],
      ["if (barW !== '15.3%') fail('hub', `overall bar width ${barW}, expected 15.3%`);", "if (barW !== '13.2%') fail('hub', `overall bar width ${barW}, expected 13.2%`);"],
    ];
    for (const [a, b] of subs) { must(s, a, f); s = s.replace(a, b); }
    W(f, s); changed.push(f);
  }
  const g = 'verify-practice.js'; let p = R(g);
  if (!p.includes("['08'")) { must(p, "['07',11,13]];", g); p = p.replace("['07',11,13]];", "['07',11,13],['08',12,14]];"); W(g, p); changed.push(g); }
}
console.log('wired:', changed.length ? changed.join(', ') : 'nothing to do');
