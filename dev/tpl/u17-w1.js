/* ================= UNIT 17 · Act I widgets: w-order, w-rnn-step, w-unroll ================= */

/* ---------- §1 · w-order: a bag, a window, a running note ---------- */
(function(){
  const svg=document.getElementById('or-svg'); if(!svg) return;
  const read=document.getElementById('or-read'), sents=document.getElementById('or-sents');
  const VEC={dog:[1,0],man:[0,1],bites:[1,1],sees:[-1,1]}, VOC=Object.keys(VEC);
  const D0={mode:'note',th:90,k:1,win:3,A:['dog','bites','man'],B:['man','bites','dog'],prog:3};
  const st=JSON.parse(JSON.stringify(D0));
  const LONG=['The','train','to','Delhi','from','platform','four','is','late'];
  const turn=(v,th,k)=>{ const c=Math.cos(th*Math.PI/180), s=Math.sin(th*Math.PI/180); return [k*(c*v[0]-s*v[1]),k*(s*v[0]+c*v[1])]; };
  function notes(words){ const P=[[0,0]], T=[null]; words.forEach(w=>{ const h=P[P.length-1], r=turn(h,st.th,st.k), x=VEC[w]; T.push(r); P.push([r[0]+x[0],r[1]+x[1]]); }); return {P,T}; }
  const z6=v=>Math.abs(v)<1e-9?0:+v.toFixed(6);
  const fmtV=v=>'('+v.map(x=>N(Math.abs(x)<1e-9?0:x,2)).join(', ')+')';
  let S={};
  function drawSent(){ const opt=w=>VOC.map(v=>`<option${v===w?' selected':''}>${v}</option>`).join('');
    sents.innerHTML=['A','B'].map(K=>`<div class="or-row"><span class="or-tag" style="background:${K==='A'?cv(K17.word):cv(K17.alt)}">${K}</span>`+st[K].map((w,i)=>`<select data-s="${K}" data-i="${i}" aria-label="sentence ${K} word ${i+1}">${opt(w)}</select>`).join('')+'</div>').join('');
    sents.querySelectorAll('select').forEach(s=>s.addEventListener('change',()=>{ st[s.dataset.s][+s.dataset.i]=s.value; st.prog=3; draw(); })); }
  function draw(){ svg.innerHTML=''; const V=narrowSVG(svg,560,360,400,430), W=V.W, H=V.H, ph=V.n; const glow=glo(svg);
    const winMode=st.mode==='win'; sents.style.display=winMode?'none':''; document.getElementById('or-swap').style.display=winMode?'none':''; document.getElementById('or-play').style.display=st.mode==='bag'?'none':'';
    document.getElementById('or-play').textContent=winMode?'▶ read the announcement':'▶ read both';
    if(st.mode==='note'){ const cols={A:cv(K17.word),B:cv(K17.alt)}, NA=notes(st.A), NB=notes(st.B);
      const pts=[...NA.P,...NA.T.slice(1),...NB.P,...NB.T.slice(1)]; let x0=Math.min(...pts.map(q=>q[0])),x1=Math.max(...pts.map(q=>q[0])),y0=Math.min(...pts.map(q=>q[1])),y1=Math.max(...pts.map(q=>q[1]));
      const cxm=(x0+x1)/2, cym=(y0+y1)/2, half=Math.max(1.6,(x1-x0)/2+.7,((y1-y0)/2+.6)*W/H);
      const p=plane(svg,cxm-half,cxm+half,cym-half*H/W,cym+half*H/W,{pad:22}); tickify(svg);
      txt(svg,12,18,ph?'dashed: turn · arrow: add':'dashed: turn the old note · arrow: add the new word','font:600 11px system-ui;fill:var(--ink-muted)');
      const ends={}, segs=[];
      ['A','B'].forEach(K=>{ const {P,T}=K==='A'?NA:NB, col=cols[K], n=Math.min(3,st.prog);
        for(let t=1;t<=3;t++){ const on=t<=Math.ceil(n), part=t<n?1:Math.max(0,n-(t-1)); if(!on) break;
          const h=P[t-1], r=T[t];
          if(Math.hypot(...h)>1e-9&&(st.th>0||st.k<1)){ let d='', zp=null; for(let q=0;q<=24;q++){ const u=q/24, z=turn(h,st.th*u,1+(st.k-1)*u); d+=(q?'L':'M')+p.px(z[0]).toFixed(1)+','+p.py(z[1]).toFixed(1); if(zp) segs.push([p.px(zp[0]),p.py(zp[1]),p.px(z[0]),p.py(z[1]),0]); zp=z; } el('path',{d,fill:'none',stroke:col,'stroke-width':1.4,'stroke-dasharray':'3 4',opacity:.7},svg); }
          const x=VEC[st[K][t-1]], tip=[r[0]+x[0]*part,r[1]+x[1]*part];
          if(part>.02){ const a=arrow(p,r[0],r[1],tip[0],tip[1],col,2.6); a.dataset.role='add'+K+t; a.dataset.from=[z6(r[0]),z6(r[1])].join(','); a.dataset.to=[z6(tip[0]),z6(tip[1])].join(','); segs.push([p.px(r[0]),p.py(r[1]),p.px(tip[0]),p.py(tip[1]),1.5]); }
          if(part>.95){ const X0=p.px(r[0]),Y0=p.py(r[1]),X1=p.px(tip[0]),Y1=p.py(tip[1]), L=Math.hypot(X1-X0,Y1-Y0)||1, nx=-(Y1-Y0)/L, ny=(X1-X0)/L, sg=K==='A'?1:-1;
            const lt=txt(svg,(X0+X1)/2+nx*13*sg,(Y0+Y1)/2+ny*13*sg+4,st[K][t-1],'font:700 11px system-ui;fill:'+col,'middle');
            lt.dataset.alt=[[-26*nx*sg,-26*ny*sg],[(X1-X0)*.3,(Y1-Y0)*.3],[-(X1-X0)*.3,-(Y1-Y0)*.3]].map(v=>v.map(q=>q.toFixed(1)).join(',')).join(';'); } }
        ends[K]=P[3];
        if(n>=3){ const e=P[3]; const g=glowDot(svg,p.px(e[0]),p.py(e[1]),7,col,glow); g.dataset.role='end'+K; segs.push([p.px(e[0]),p.py(e[1]),p.px(e[0]),p.py(e[1]),7]); } });
      glowDot(svg,p.px(0),p.py(0),3.5,'var(--ink-2)',null);
      const same=st.prog>=3&&Math.hypot(ends.A[0]-ends.B[0],ends.A[1]-ends.B[1])<1e-9;
      if(st.prog>=3){
        ['A','B'].forEach((K,i)=>{ const e=ends[K], X=p.px(e[0])+(same?(i?-16:16):0), Y=p.py(e[1]); el('circle',{cx:X,cy:Y-17,r:9,fill:K==='A'?cv(K17.word):cv(K17.alt)},svg); txt(svg,X,Y-13,K,'font:800 10.5px system-ui;fill:#fff','middle'); });
        read.innerHTML='A · '+st.A.join(' ')+' → note <b class="w">'+fmtV(ends.A)+'</b><br>B · '+st.B.join(' ')+' → note <b style="color:var(--s2)">'+fmtV(ends.B)+'</b><br>'+(same?'<b>Same note</b> — this reader cannot tell A from B.':'<b class="m">Different notes</b> — the order left its mark.')+(st.th===0&&st.k===1?' (A turn of 0° is a plain running total: order is lost.)':st.th===180&&st.k===1&&same?' (A half turn just flips the sign: word 1 − word 2 + word 3.)':''); }
      S={mode:'note',segs,th:st.th,k:st.k,A:st.A.slice(),B:st.B.slice(),pathA:NA.P.map(v=>v.map(z6)),pathB:NB.P.map(v=>v.map(z6)),ends:[ends.A.map(z6),ends.B.map(z6)],same,
        map:{ox:p.px(0),oy:p.py(0),sx:p.px(1)-p.px(0),sy:p.py(1)-p.py(0)}};
      svg.dataset.ends=JSON.stringify(S.ends); svg.dataset.same=same?'1':'0'; }
    else if(st.mode==='bag'){ const cnt=K=>{ const c={}; VOC.forEach(v=>c[v]=0); st[K].forEach(w=>c[w]++); return c; }; const cA=cnt('A'), cB=cnt('B');
      const sum=K=>st[K].reduce((s,w)=>[s[0]+VEC[w][0],s[1]+VEC[w][1]],[0,0]);
      txt(svg,W/2,26,ph?'a bag keeps only the counts':'what a bag of words keeps: how many of each word','font:700 12px system-ui;fill:var(--ink-2)','middle');
      const bars=[];
      VOC.forEach((v,i)=>{ const x=(ph?28:80)+i*(ph?92:112); txt(svg,x+30,H-40,v,'font:700 12px system-ui;fill:var(--ink-2)','middle');
        [['A',cA[v],cv(K17.word),0],['B',cB[v],cv(K17.alt),32]].forEach(([K,n,col,dx])=>{ const h=n*80; const g=el('g',glow?{filter:glow}:{},svg);
          const r=el('rect',{x:x+dx,y:H-60-h,width:26,height:Math.max(1,h),rx:5,fill:col,opacity:.85},g); r.dataset.role='bar'+K; r.dataset.word=v; r.dataset.v=n; bars.push({K,word:v,n,h}); if(n) txt(svg,x+dx+13,H-66-h,String(n),'font:700 11px system-ui;fill:'+col,'middle'); }); });
      el('line',{x1:ph?16:50,y1:H-60,x2:W-(ph?16:40),y2:H-60,stroke:'var(--axis)','stroke-width':1.5},svg);
      const same=VOC.every(v=>cA[v]===cB[v]), sA=sum('A'), sB=sum('B');
      txt(svg,ph?20:60,60,'A','font:800 12px system-ui;fill:'+cv(K17.word)); txt(svg,ph?44:80,60,(ph?'sum ':'sum of word vectors ')+fmtV(sA),'font:600 11.5px system-ui;fill:var(--ink-2)');
      txt(svg,ph?20:60,84,'B','font:800 12px system-ui;fill:'+cv(K17.alt)); txt(svg,ph?44:80,84,(ph?'sum ':'sum of word vectors ')+fmtV(sB),'font:600 11.5px system-ui;fill:var(--ink-2)');
      read.innerHTML=same?'<b>Identical bags.</b> A and B have the same words the same number of times, so every count and every sum agrees: '+fmtV(sA)+'. The order is invisible.':'<b class="m">Different bags</b> — but only because the <em>words</em> differ, not their order.';
      S={mode:'bag',countsA:cA,countsB:cB,sumA:sA,sumB:sB,same,bars,unit:80}; svg.dataset.same=same?'1':'0'; }
    else { const k=st.win, n=LONG.length, prog=Math.min(n,Math.max(1,Math.round(st.prog*3))), last=prog-1, lo=Math.max(0,last-k+1);
      txt(svg,W/2,30,ph?'a window of the last '+k+' word'+(k>1?'s':''):'a window of the last '+k+' word'+(k>1?'s':'')+' — everything older is forgotten','font:700 12px system-ui;fill:var(--ink-2)','middle');
      const TW=LONG.map(w=>ph?112:Math.max(38,7.2*w.length+18)), GAP=8, tot=TW.reduce((a,b)=>a+b,0)+GAP*(n-1), X0=(W-tot)/2;
      const xs=i=>ph?72+(i%3)*128:X0+TW.slice(0,i).reduce((a,b)=>a+b,0)+GAP*i+TW[i]/2, ys=i=>ph?110+Math.floor(i/3)*62:150, y=150;
      LONG.forEach((w,i)=>{ const on=i>=lo&&i<=last, seen=i<=last, isTrain=i===1; const x=xs(i);
        const g=el('g',{opacity:!seen?.25:on?1:.4},svg), y=ys(i), tw=TW[i];
        const r=el('rect',{x:x-tw/2,y:y-16,width:tw,height:30,rx:8,fill:on?'color-mix(in srgb,var(--s1) 22%,transparent)':'none',stroke:isTrain?cv(K17.gate):on?cv(K17.word):'var(--ink-muted)','stroke-width':isTrain?2.2:1.3,'stroke-dasharray':on?'':'3 3'},g); r.dataset.on=on?'1':'0';
        txt(g,x,y+4,w,'font:700 11px system-ui;fill:'+(on?'var(--ink)':'var(--ink-muted)'),'middle'); });
      const x0=xs(lo)-TW[lo]/2-5, x1=xs(last)+TW[last]/2+5; const br=el('g',glow&&!ph?{filter:glow}:{style:ph?'display:none':''},svg);
      el('path',{d:`M${x0},${y-26} L${x0},${y-34} L${x1},${y-34} L${x1},${y-26}`,fill:'none',stroke:cv(K17.word),'stroke-width':2.2},br);
      el('path',{d:`M${x0},${y+24} L${x0},${y+32} L${x1},${y+32} L${x1},${y+24}`,fill:'none',stroke:cv(K17.word),'stroke-width':2.2},br);
      if(!ph) txt(svg,(x0+x1)/2,y-42,'window','font:700 11px system-ui;fill:'+cv(K17.word),'middle');
      const hasTrain=lo<=1&&last>=1, atLate=last===n-1;
      txt(svg,W/2,ph?330:250,atLate?(hasTrain?(ph?'"train" is still in view':'"late" arrives and "train" is still in view: the window knows what is late.'):(ph?'"train" has dropped out':'"late" arrives, but "train" has dropped out: what is late?')):'reading … word '+(last+1)+' of '+n,'font:700 12.5px system-ui;fill:'+(atLate?(hasTrain?cv(K17.mem):'var(--critical)'):'var(--ink-2)'),'middle');
      txt(svg,W/2,ph?360:275,ph?'the window must hold 8 words':'"train" is word 2 and "late" is word 9, so the window must hold at least 8 words','font:500 11px system-ui;fill:var(--ink-muted)','middle');
      const view=LONG.slice(Math.max(0,n-k));
      read.innerHTML='Window of <b>'+k+'</b> · at "late" it holds: <b class="w">'+view.join(' ')+'</b><br>'+(k>=8?'"train" is still inside — but a bigger window means more to learn, and any fixed size is too small for some sentence.':'"train" is outside the window. A fixed window forgets everything older.');
      S={mode:'win',k,atLate:view,train:Math.max(0,n-k)<=1,shown:LONG.slice(lo,last+1)}; svg.dataset.train=S.train?'1':'0'; }
    S.prog=+(+st.prog).toFixed(3);
    mfont(svg); declutter(svg); if(S.segs){ hideTicksOn(svg,S.segs); delete S.segs; }
  }
  const syncCtl=()=>{ setCtl('or-th',st.th,v=>v+'°'); setCtl('or-k',st.k,v=>N(v,2)); setCtl('or-win',st.win,v=>String(v));
    document.getElementById('or-mode').querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===st.mode?'true':'false'));
    document.getElementById('or-ctl-note').style.display=st.mode==='note'?'':'none'; document.getElementById('or-ctl-win').style.display=st.mode==='win'?'':'none'; };
  tabs(document.getElementById('or-mode'),t=>{ st.mode=t; st.prog=3; syncCtl(); draw(); });
  bindCtl('or-th',v=>{ st.th=v; st.prog=3; draw(); },v=>v+'°');
  bindCtl('or-k',v=>{ st.k=v; st.prog=3; draw(); },v=>N(v,2));
  bindCtl('or-win',v=>{ st.win=v; st.prog=3; draw(); },v=>String(v));
  const perms=a=>a.length<=1?[a]:a.flatMap((x,i)=>perms([...a.slice(0,i),...a.slice(i+1)]).map(q=>[x,...q]));
  function otherOrders(){ const seen=new Set([st.A.join()]), out=[]; perms(st.A).forEach(q=>{ const k=q.join(); if(!seen.has(k)){ seen.add(k); out.push(q); } }); return out; }
  document.getElementById('or-swap').addEventListener('click',()=>{ const P=otherOrders(); if(!P.length) st.B=st.A.slice(); else { const i=P.findIndex(q=>q.join()===st.B.join()); st.B=P[(i+1)%P.length].slice(); } drawSent(); st.prog=3; draw(); });
  let tw=null; document.getElementById('or-play').addEventListener('click',()=>{ if(tw) tw.stop(); tw=tween(st.mode==='win'?4200:3000,u=>{ st.prog=.34+u*2.66; draw(); },()=>{ st.prog=3; draw(); }); });
  document.getElementById('or-reset').addEventListener('click',()=>{ if(tw) tw.stop(); Object.assign(st,JSON.parse(JSON.stringify(D0))); syncCtl(); drawSent(); draw(); });
  drawSent(); draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  reg('w-order',{state:()=>JSON.parse(JSON.stringify(S)),st,draw,turn,VEC,otherOrders});
})();

/* ---------- §2 · w-rnn-step: step a recurrent cell through a sentence ---------- */
(function(){
  const svg=document.getElementById('rs-svg'); if(!svg) return;
  const read=document.getElementById('rs-read');
  const SENT=['the','train','to','Delhi','is','late'], CODE=[.2,.9,-.3,.7,-.4,1];      /* toy one-number word codes (hand-made) */
  const rnd=seeded(17), MIX=Array.from({length:6},()=>Array.from({length:6},()=>(rnd()*2-1)*.55)), UMIX=Array.from({length:6},()=>(rnd()*2-1)*.9); UMIX[0]=1;
  const st={mode:'one',w:.5,u:1,wm:'slide',k:3};
  function run(){ if(st.mode==='one'){ const r=rnn1(st.w,st.u,0,EX.x,0); return {words:['word 1','blank','blank'],x:EX.x,h:r.h.map(v=>[v]),z:r.z}; }
    const h=[new Array(6).fill(0)];
    CODE.forEach(x=>{ const p=h[h.length-1], n=new Array(6).fill(0);
      for(let i=0;i<6;i++){ let z=0; if(st.wm==='slide'){ z=(i===0?st.u*x:st.w*p[i-1]); } else { for(let j=0;j<6;j++) z+=st.w*MIX[i][j]*p[j]; z+=st.u*UMIX[i]*x; } n[i]=tanh(z); }
      h.push(n); }); return {words:SENT,x:CODE,h}; }
  const heat=v=>{ const a=Math.min(1,Math.abs(v)); return {fill:v>=0?cv(K17.mem):cv(K17.edge),op:.12+.8*a}; };
  function draw(){ svg.innerHTML=''; const V=narrowSVG(svg,760,330,440,340), W=V.W, ph=V.n, glow=glo(svg), R=run(), T=R.words.length;
    const x0=ph?(st.mode==='one'?46:34):(st.mode==='one'?150:84), colW=ph?(W-x0-(st.mode==='one'?54:34))/T:(st.mode==='one'?150:106), cx=t=>x0+t*colW;   /* t = 1…T */
    /* h0 */
    const one=st.mode==='one';
    const bar=(x,v,on,lab)=>{ if(one){ const y0=222, hh=66; el('line',{x1:x-26,y1:y0,x2:x+26,y2:y0,stroke:'var(--axis)','stroke-width':1.2},svg);
        el('rect',{x:x-18,y:y0-hh,width:36,height:hh*2,rx:6,fill:'none',stroke:'var(--line)','stroke-dasharray':'3 3'},svg);
        const h=v[0]*hh, g=el('g',{opacity:on?1:.25},svg); if(glow&&on) g.setAttribute('filter',glow);
        const r=el('rect',{x:x-14,y:h>=0?y0-h:y0,width:28,height:Math.max(1.5,Math.abs(h)),rx:5,fill:h>=0?cv(K17.mem):cv(K17.edge)},g); r.dataset.role='bar'; r.dataset.v=v[0]; r.dataset.y0=y0; r.dataset.unit=hh;
        txt(svg,x,y0+hh+18,on?N(v[0],4):'?','font:700 12.5px system-ui;fill:'+(on?cv(K17.mem):'var(--ink-muted)'),'middle'); }
      else { const s=26, y0=138; v.forEach((q,i)=>{ const hc=heat(q), g=el('g',{opacity:on?1:.22},svg);
          el('rect',{x:x-s/2-6,y:y0+i*(s+4),width:s+12,height:s,rx:5,fill:hc.fill,opacity:hc.op},g);
          el('rect',{x:x-s/2-6,y:y0+i*(s+4),width:s+12,height:s,rx:5,fill:'none',stroke:'var(--line)'},g);
          if(on&&!ph) txt(svg,x,y0+i*(s+4)+s/2+4,N(q,2),'font:600 10px system-ui;fill:var(--ink)','middle'); }); }
      txt(svg,x,one?134:128,lab,'font:700 12px system-ui;fill:var(--ink-2)','middle'); };
    if(!one&&!ph) txt(svg,22,138+13,'slot 1','font:600 10px system-ui;fill:var(--ink-muted)'), txt(svg,22,138+5*30+13,'slot 6','font:600 10px system-ui;fill:var(--ink-muted)');
    bar(cx(0),R.h[0],true,'h₀');
    for(let t=1;t<=T;t++){ const x=cx(t), on=t<=st.k, cur=t===st.k;
      /* word tile */
      const g=el('g',{opacity:on?1:.4},svg); const tw=ph?(one?96:58):(one?80:68); el('rect',{x:x-tw/2,y:14,width:tw,height:28,rx:8,fill:'color-mix(in srgb,var(--s1) 18%,transparent)',stroke:cv(K17.word),'stroke-width':cur?2.2:1.2},g);
      txt(g,x,33,R.words[t-1],'font:700 12px system-ui;fill:var(--ink)','middle');
      txt(svg,x+6,60,(ph&&!one?'':'x = ')+N(R.x[t-1],2),'font:600 10.5px system-ui;fill:'+cv(K17.word),'start');
      /* the cell */
      const cg=el('g',{opacity:on?1:.35},svg);
      const cr=el('rect',{x:x-26,y:70,width:52,height:36,rx:9,fill:'color-mix(in srgb,var(--s3) 10%,transparent)',stroke:cv(K17.mem),'stroke-width':cur?2.2:1.2},cg); if(cur&&glow) cr.setAttribute('filter',glow);
      txt(cg,x,93,'cell','font:700 11px system-ui;fill:var(--ink-2)','middle');
      edge(svg,x,44,x,68,cv(K17.word),1.4,null,on?.9:.3);
      /* the note arrow from the previous column */
      const px=cx(t-1); edge(svg,px+(t===1?20:26),88,x-28,88,cv(K17.mem),on?2.4:1.2,on?glow:null,on?1:.3);
      if((t===1||one)&&(x-28)-(px+26)>=22) txt(svg,(px+x)/2,82,one?'× w':'W','font:700 10.5px system-ui;fill:'+cv(K17.mem),'middle');
      bar(x,R.h[t],on,'h'+SUB(t)); }
    const k=st.k;
    if(one){ if(k===0) read.innerHTML='The note starts at <b class="m">h₀ = 0</b>. Press <em>next</em> to read the first input.';
      else { const hp=R.h[k-1][0], x=R.x[k-1], z=st.w*hp+st.u*x;
        read.innerHTML='h'+SUB(k)+' = tanh(w·h'+SUB(k-1)+' + u·x'+SUB(k)+') = tanh('+N(st.w,2)+' · '+N(hp,4)+' + '+N(st.u,2)+' · '+N(x,2)+') = tanh('+N(z,4)+') = <b class="m">'+N(R.h[k][0],4)+'</b>'+
          (k===3?'<br>The first input kept <b>'+N(R.h[3][0]/Math.max(1e-12,R.h[1][0])*100,1)+'%</b> of its size after two more steps.':''); } }
    else { if(k===0) read.innerHTML='Six empty slots. With <em>slide down</em>, W copies slot 1 into slot 2, slot 2 into slot 3 … each times w, and U writes the new word into slot 1.';
      else { const h=R.h[k]; read.innerHTML='After <b class="w">'+SENT[k-1]+'</b>: note = <b class="m">('+h.map(v=>N(v,2)).join(', ')+')</b><br>'+(st.wm==='slide'?(k===1?'Slot 1 holds what <b class="w">"the"</b> just wrote.':'Slot '+Math.min(6,k)+' now holds what <b class="w">"the"</b> wrote, shrunk by w and tanh '+(k-1)+' time'+(k===2?'':'s')+'.'):'A mixing W blends all slots at every step: the words are smeared across the whole note.'); } }
    svg.dataset.h=R.h.slice(1).map(v=>v.map(q=>q.toFixed(4)).join('|')).join(','); svg.dataset.k=k; mfont(svg); declutter(svg);
    S={mode:st.mode,w:st.w,u:st.u,wm:st.wm,k,x:R.x.slice(),h:R.h.map(v=>v.slice())}; }
  let S={};
  const Tn=()=>st.mode==='one'?3:6; let timer=null;
  const upd=()=>draw();
  bindCtl('rs-w',v=>{ st.w=v; upd(); },v=>N(v,2)); bindCtl('rs-u',v=>{ st.u=v; upd(); },v=>N(v,2));
  tabs(document.getElementById('rs-mode'),t=>{ st.mode=t; st.k=t==='one'?3:6; const w0=t==='one'?.5:.8; st.w=w0; st.u=1; setCtl('rs-w',w0,v=>N(v,2)); setCtl('rs-u',1,v=>N(v,2)); document.getElementById('rs-wm').style.display=t==='six'?'':'none'; draw(); });
  document.getElementById('rs-wm').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ st.wm=b.dataset.m; pressOnly(document.getElementById('rs-wm'),b); draw(); }));
  document.getElementById('rs-next').addEventListener('click',()=>{ st.k=Math.min(Tn(),st.k+1); draw(); });
  document.getElementById('rs-prev').addEventListener('click',()=>{ st.k=Math.max(0,st.k-1); draw(); });
  document.getElementById('rs-reset').addEventListener('click',()=>{ clearInterval(timer); st.k=0; draw(); });
  document.getElementById('rs-play').addEventListener('click',()=>{ clearInterval(timer); st.k=0; draw(); if(RM){ st.k=Tn(); draw(); return; } timer=setInterval(()=>{ st.k++; draw(); if(st.k>=Tn()) clearInterval(timer); },650); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17Step={st,draw,run}; reg('w-rnn-step',{state:()=>JSON.parse(JSON.stringify(S)),st,draw,run});
})();

/* ---------- §3 · w-unroll: the loop unfolded into a chain of twins (3-D) ---------- */
(function(){
  const box=document.getElementById('un-3d'); if(!box||!CIN) return;
  const read=document.getElementById('un-read');
  const st={T:5,u:0,to:1,flash:-1};
  const SP=1.7;
  function readout(){ const uses=st.T; read.innerHTML=(st.u>.5?'<b>'+st.T+'</b> copies of the cell, one per word · <b class="g">W</b> is used <b>'+uses+'</b> times, once in every copy — always the same W':'Folded: one cell, and the gold loop feeds its note back in.')+
    '<br>numbers to learn (h = 4, d = 3): W 16 + U 12 + b 4 = <b class="m">32</b> — the same for '+st.T+' words or for 3000';
    box.dataset.state=[st.T,st.u>.5?'unrolled':'folded'].join(','); }
  function build(){ return CIN.stage3d(box,{camera:cam3({pos:[1.2,3.7,8.6],look:[0,.9,0],fov:38},{pos:[7.2,5.0,9.6],look:[0,.8,0],fov:44}),orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,isLight,colors}=ctx, hx=hxOf(ctx), dark=!isLight;
      starfield(ctx,300,16); glassFloor(ctx,15,{div:40,y:-.2});
      const C={mem:hx(K17.mem),word:hx(K17.word),gate:hx(K17.gate),prob:hx(K17.prob)};
      const chain=new THREE.Group(); root.add(chain);   /* everything that grows with the sentence; shrunk to fit when it gets long */
      const LS=PHONE()?.0135:.0085, labs=[]; const L=(t,p,o)=>{ const sp=lab(ctx,t,p,Object.assign({scale:LS},o)); sp.userData.base=sp.scale.clone(); labs.push(sp); return sp; };   /* labels keep a readable size when the chain shrinks */
      const copies=[]; for(let i=0;i<8;i++){ const g=new THREE.Group(); chain.add(g);
        const glass=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:dark?0xcfe0ff:0xffffff,transparent:true,opacity:dark?.12:.3,roughness:.05,metalness:.3,depthWrite:false}));
        const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:C.mem,transparent:true,opacity:.75}));
        const orb=CIN.prim.dot(ctx,[0,0,0],C.mem,.16); const halo=haloSprite(ctx,C.mem,.8);
        const tile=new THREE.Mesh(new THREE.BoxGeometry(.62,.1,.42),new THREE.MeshStandardMaterial({color:C.word,emissive:C.word,emissiveIntensity:dark?.6:.2,roughness:.3})); tile.position.set(0,-1.05,0);
        const up=liveTube(ctx,C.word,.018,.8); aimTube(THREE,up,[0,-.98,0],[0,-.52,0]);
        g.add(glass,edges,orb,halo,tile,up); g.position.y=1;
        const xl=L('x'+SUB(i+1),[0,-1.42,.25],{size:30,weight:700,color:colors.s1,bg:false}); g.add(xl);
        const hl=L('h'+SUB(i+1),[0,.82,0],{size:30,weight:700,color:colors.s3,bg:false}); g.add(hl);
        const c={g,edges,orb,halo,xl,hl};
        if(i===0){ c.xt=L('xₜ',[0,-1.42,.25],{size:30,weight:700,color:colors.s1,bg:false}); c.ht=L('hₜ',[-.72,.82,0],{size:30,weight:700,color:colors.s3,bg:false}); g.add(c.xt,c.ht); }   /* folded: the one cell reads x_t and holds h_t */
        copies.push(c); }
      /* the gold W arrows between neighbours, and the loop for the folded cell */
      const a0=CIN.prim.arrow(ctx,[0,1,0],[1,1,0],C.gate,{radius:.035,head:.22}); chain.add(a0); const w0=L('W',[0,1.35,0],{size:30,weight:800,color:colors.s4,bg:!dark}); chain.add(w0);   /* h₀ → the first copy: W is used in every copy */
      const arrows=[]; for(let i=0;i<7;i++){ const a=CIN.prim.arrow(ctx,[0,1,0],[1,1,0],C.gate,{radius:.035,head:.22}); chain.add(a); const wl=L('W',[0,1.35,0],{size:30,weight:800,color:colors.s4,bg:!dark}); chain.add(wl); arrows.push({a,wl}); }
      const loop=new THREE.Mesh(new THREE.TorusGeometry(.62,.035,12,60,Math.PI*1.45),new THREE.MeshStandardMaterial({color:C.gate,emissive:C.gate,emissiveIntensity:dark?.8:.3,transparent:true}));
      loop.position.set(.52,1.45,0); loop.rotation.z=-Math.PI*.22; chain.add(loop);
      const loopHead=new THREE.Mesh(new THREE.ConeGeometry(.1,.22,16),loop.material); chain.add(loopHead);
      const loopLab=L('W',[1.35,2.15,0],{size:30,weight:800,color:colors.s4,bg:!dark}); chain.add(loopLab);
      const h0=CIN.prim.dot(ctx,[0,1,0],C.mem,.11); chain.add(h0); const h0l=L('h₀',[0,1.4,0],{size:26,weight:700,color:colors.s3,bg:false}); chain.add(h0l);
      const hudEl=hud(box);
      ctx.redraw=()=>{ const T=st.T, u=easeIO(clamp01(st.u)), xs=i=>(i-(T-1)/2)*SP*u;
        const span=(T-1)*SP*u+1.8; let fit=Math.min(1,10.4/span); chain.scale.setScalar(fit); chain.position.set(0,1-fit,0);   /* keep the row on its line as it shrinks */
        copies.forEach((c,i)=>{ c.g.visible=i<T&&(u>.02||i===0); c.g.position.x=xs(i); const on=i<T; c.g.scale.setScalar(on?1:0.001);
          if(u<.02&&i>0) c.g.visible=false; });
        arrows.forEach((A,i)=>{ const vis=i<T-1&&u>.15; A.a.visible=A.wl.visible=vis; if(!vis) return;
          const x0=xs(i)+.52, x1=xs(i+1)-.52; if(x1-x0<.05){ A.a.visible=A.wl.visible=false; return; }
          A.a.userData.set(new THREE.Vector3(x0,1,0),new THREE.Vector3(x1,1,0)); A.wl.position.set((x0+x1)/2,1.32,0); });
        const lv=u<.5; loop.visible=loopHead.visible=loopLab.visible=lv; const lo=1-u*2; loop.material.opacity=Math.max(0,lo); loopLab.material.opacity=Math.max(0,lo);
        loopHead.position.set(.52+.62*Math.cos(-Math.PI*.22+Math.PI*1.45)+.0,1.45+.62*Math.sin(-Math.PI*.22+Math.PI*1.45),0); loopHead.rotation.z=Math.PI*1.23+Math.PI*.5;
        const x00=xs(0)-.52; h0.position.set(x00-.55*Math.max(u,.001)-.2,1,0); h0l.position.set(h0.position.x-.05,.66,0);   /* under the dot: the W of the first arrow sits above */
        const unr=u>.5; h0.visible=h0l.visible=unr; copies[0].xl.visible=copies[0].hl.visible=unr; copies[0].xt.visible=copies[0].ht.visible=!unr;
        { const v0=u>.15, x0=h0.position.x+.14, x1=x00; a0.visible=w0.visible=v0&&x1-x0>.05; if(a0.visible){ a0.userData.set(new THREE.Vector3(x0,1,0),new THREE.Vector3(x1,1,0)); w0.position.set((x0+x1)/2,1.32,0); } }
        if(PHONE()){ w0.visible=false; if(T>=6) arrows.forEach(A=>{ A.wl.visible=false; }); }   /* phones: the far end of a long chain is small — the gold arrows speak for themselves there */
        const fl=st.flash>=0?Math.sin(Math.PI*clamp01(st.flash)):0;
        arrows.concat([{a:a0}]).forEach(A=>{ A.a.traverse(m=>{ if(m.material){ m.material.emissiveIntensity=(dark?.55:.15)+2.2*fl; } }); A.a.scale.setScalar(1+.5*fl); });
        loop.material.emissiveIntensity=(dark?.8:.3)+2*fl;
        hudEl.innerHTML=fl>0?'one <b>W</b>, used on every gold arrow at once':(u>.5?'unrolled · '+T+' twins, one per word':'folded · one cell with a loop');
        /* seen from the side (phones) the near end of a long chain can leave the stage: measure both ends on screen, then slide and shrink to fit */
        const cam=ctx.camera, Wp=ctx.size.w, ends=[[xs(0)-1.3,1,0],[xs(T-1)+.7,1,.5],[xs(T-1)+.7,1.6,.5]];
        const scr=()=>{ chain.updateMatrixWorld(true); cam.updateMatrixWorld(); return ends.map(q=>(new THREE.Vector3(q[0],q[1],q[2]).applyMatrix4(chain.matrixWorld).project(cam).x+1)/2*Wp); };
        if(Wp&&cam) for(let it=0;it<4;it++){ const P=scr(), x0=Math.min(...P), x1=Math.max(...P), room=Wp-36;
          if(x1-x0>room){ fit*=room/(x1-x0); chain.scale.setScalar(fit); chain.position.y=1-fit; continue; }
          if(PHONE()&&T>2&&x1-x0<room*.8&&fit<1.3){ fit=Math.min(1.3,fit*room*.9/(x1-x0)); chain.scale.setScalar(fit); chain.position.y=1-fit; continue; }   /* phones: use the width */
          const off=(x0+x1)/2-Wp/2; if(Math.abs(off)<3) break; chain.position.x+=1; const d=(scr().reduce((a,b)=>a+b,0)-P.reduce((a,b)=>a+b,0))/P.length; chain.position.x-=1; if(Math.abs(d)<1e-6) break; chain.position.x-=off/d; }
        const k=Math.pow(1/Math.max(fit,.2),.6); labs.forEach(sp=>sp.scale.copy(sp.userData.base).multiplyScalar(k));
        RR(ctx); };
      ctx.redraw();
    },
    update(ctx,t,dt){ if(ctx.dead) return false; ctx.copiesSpin=(ctx.copiesSpin||0)+dt; return false; }}); }
  const S3=mountStage(box,build); flipRemount(S3);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  bindCtl('un-T',v=>{ st.T=v; redraw(); },v=>String(v));
  /* st.to is where the chain is heading (1 = unrolled, 0 = folded): pressing ▶ flips it, even in the middle of a move */
  let tw=null; const play=document.getElementById('un-play');
  play.addEventListener('click',()=>{ if(tw) tw.stop(); st.to=st.to?0:1; const from=st.u, to=st.to; play.textContent=to?'▶ fold':'▶ unroll';
    tw=tween(1600,u=>{ st.u=from+(to-from)*u; redraw(); },()=>{ st.u=to; redraw(); }); });
  let tf=null; document.getElementById('un-share').addEventListener('click',()=>{ if(st.to!==1||st.u<1){ if(tw) tw.stop(); st.to=1; st.u=1; play.textContent='▶ fold'; } if(tf) tf.stop(); tf=tween(1300,u=>{ st.flash=u; redraw(); },()=>{ st.flash=-1; redraw(); }); });
  st.u=1; play.textContent='▶ fold';
  readout(); window.U17Unroll={st,redraw}; reg('w-unroll',{state:()=>({T:st.T,unrolled:st.u>.5,to:st.to,uses:st.T,count:4*4+4*3+4,flash:st.flash}),st,redraw,rects:stageRects(S3)});
})();
