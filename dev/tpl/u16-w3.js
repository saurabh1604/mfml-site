/* ================= UNIT 16 · widgets of §7–§9: w-cost, w-lookup, w-nlm, w-para ================= */

/* ---------- §7 · w-cost: light every word, or just k + 1 ---------- */
(function(){
  const svg=document.getElementById('cs-svg'); if(!svg) return;
  const read=document.getElementById('cs-read'), st={V:50000,k:5,anim:1};
  const snapV=l=>{ const e=Math.floor(l), m=Math.pow(10,l-e); return Math.round(m*10)/10*Math.pow(10,e); };
  function field(x,y,w,h,nDots,lit,picks,title,sub,k,glow,colLit){
    el('rect',{x,y,width:w,height:h,rx:12,fill:'var(--surface)',opacity:.55,stroke:'var(--line)'},svg);
    txt(svg,x+12,y+20*Math.min(k,1.3),title,FT(700,11,Math.min(k,1.4),'var(--ink)')); txt(svg,x+12,y+36*Math.min(k,1.3),sub,FT(600,9.5,Math.min(k,1.3),'var(--ink-muted)'));
    const top=y+46*Math.min(k,1.3), H=h-(top-y)-10, cols=Math.ceil(Math.sqrt(nDots*w/H)), rows=Math.ceil(nDots/cols), gx=(w-24)/cols, gy=H/rows, r=Math.max(.9,Math.min(4,Math.min(gx,gy)*.33));
    const g=el('g',{},svg); let pi=0; const pset=new Set(picks);
    for(let i=0;i<nDots;i++){ const cx=x+12+(i%cols+.5)*gx, cy=top+(Math.floor(i/cols)+.5)*gy, on=i<lit, pk=pset.has(i);
      el('circle',{cx,cy,r:pk?r*2.3:r,fill:pk?(i===picks[0]?cv(K16.gold):'var(--critical)'):on?colLit:'var(--ink-muted)',opacity:pk?1:on?.85:.22},g); }
    return g; }
  function draw(){ const narrow=vbFor(svg,'0 0 760 300','0 0 340 560'); svg.innerHTML=''; const k=svgK(svg,9.5), glow=glo(svg);
    const V=st.V, K=st.k, nd=Math.min(V,narrow?600:900), per=V/nd, litF=Math.round(nd*Math.min(1,st.anim)), r=rng16(5+K);
    const picks=[]; while(picks.length<Math.min(K+1,nd)){ const i=Math.floor(r()*nd); if(!picks.includes(i)) picks.push(i); }
    const W1=narrow?{x:6,y:6,w:328,h:200}:{x:8,y:8,w:366,h:212}, W2=narrow?{x:6,y:214,w:328,h:200}:{x:386,y:8,w:366,h:212};
    const each=per>1.0001?' · each dot ≈ '+commas(per)+' words':' · one dot per word';
    field(W1.x,W1.y,W1.w,W1.h,nd,litF,[],'full softmax: score every word',commas(V)+' dot products'+each,k,glow,cv(K16.prob));
    field(W2.x,W2.y,W2.w,W2.h,nd,0,st.anim>=1?picks:picks.slice(0,Math.max(0,Math.floor(st.anim*(K+1)))),'negative sampling: 1 real + '+K+' random',(K+1)+' dot products'+each,k,glow,cv(K16.prob));
    /* log bars */
    const by=narrow?430:236, bx=narrow?70:150, bw=narrow?250:560, lg=v=>bx+bw*Math.log10(Math.max(1,v))/6;
    [0,1,2,3,4,5,6].forEach(e=>{ el('line',{x1:lg(10**e),x2:lg(10**e),y1:by-4,y2:by+50,stroke:'var(--grid)','stroke-width':1},svg); txt(svg,lg(10**e),by+64*Math.min(k,1.15),e?'10'+SUP(e):'1',FT(500,9,Math.min(k,1.3),'var(--ink-muted)'),'middle'); });
    const bar=(y,v,col,lab)=>{ el('rect',{x:bx,y,width:Math.max(2,lg(v)-bx),height:16,rx:4,fill:col,opacity:.85},svg); txt(svg,bx-8,y+12,lab,FT(700,9.5,Math.min(k,1.3),'var(--ink-2)'),'end'); txt(svg,Math.min(lg(v)+6,bx+bw-40),y+12,commas(v),FT(700,9.5,Math.min(k,1.3),'var(--ink)')); };
    bar(by,V,cv(K16.prob),'softmax'); bar(by+24,K+1,cv(K16.gold),'k + 1');
    read.innerHTML=`full softmax: <b>${commas(V)}</b> dot products per training pair · negative sampling: <b>${K+1}</b> · about <b>${commas(V/(K+1))}</b> times less work`;
    svg.dataset.ratio=(V/(K+1)).toFixed(3); svg.dataset.v=V; }
  bindCtl('cs-v',v=>{ st.V=snapV(v); draw(); },v=>commas(snapV(v)).replace(/−/g,'-'));
  bindCtl('cs-k',v=>{ st.k=v; draw(); },v=>String(v));
  document.getElementById('cs-play').addEventListener('click',()=>{ tween(2200,u=>{ st.anim=u; draw(); },()=>{ st.anim=1; draw(); }); });
  draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  window.U16Cost={st,draw,setV(v){ st.V=v; draw(); }};
})();

/* ---------- §8 · w-lookup: one-hot × table = fetch a row ---------- */
(function(){
  const eq=document.getElementById('lk-eq'); if(!eq) return;
  const W=['chai','coffee','bat','ball','train'], E=[[.9,.2,.1],[.8,.3,.1],[.1,.9,.2],[.2,.8,.3],[.1,.2,.9]];
  const read=document.getElementById('lk-read'), host=document.getElementById('lk-words'); let sel=0, busy=false;
  function render(gone,showRes){ const oh=W.map((_,i)=>i===sel?1:0), res=E[sel];
    eq.innerHTML=`<div class="lk-vec" style="grid-template-columns:repeat(5,auto)">${oh.map(v=>`<span class="lk-c ${v?'one':'zero'}">${v}</span>`).join('')}</div><span class="lk-op">×</span>`+
      `<div style="display:grid;grid-template-columns:auto auto;gap:4px;align-items:center"><div style="display:grid;gap:4px">${W.map((w,i)=>`<span class="lk-rl${i===sel?' on':''}" style="height:2.05rem;line-height:2.05rem">${w}</span>`).join('')}</div>`+
      `<div class="lk-mat" style="grid-template-columns:repeat(3,auto)">${E.map((r,i)=>r.map(v=>`<span class="lk-c ${i===sel?'row':''}${gone&&i!==sel?' gone':''}">${N(v,1)}</span>`).join('')).join('')}</div></div>`+
      `<span class="lk-op">=</span><div class="lk-vec" style="grid-template-columns:repeat(3,auto)">${res.map(v=>`<span class="lk-c ${showRes?'row':'zero'}">${showRes?N(v,1):'?'}</span>`).join('')}</div>`;
    read.innerHTML=`one-hot "${W[sel]}" = (${W.map((_,i)=>i===sel?1:0).join(', ')}) → the 1 in slot ${sel+1} keeps row ${sel+1} and multiplies every other row by 0 → <b>${vecN(E[sel],1)}</b>`;
    eq.dataset.row=sel; }
  chipRow(host,W,'',w=>{ sel=W.indexOf(w); pressChip(host,w); render(true,true); }); pressChip(host,W[0]);
  document.getElementById('lk-play').addEventListener('click',()=>{ if(busy) return; busy=true; render(false,false); setTimeout(()=>{ render(true,false); setTimeout(()=>{ render(true,true); busy=false; },RM?0:900); },RM?0:900); });
  render(true,true); window.U16Lookup={pick(i){ sel=i; pressChip(host,W[i]); render(true,true); }};
})();

/* ---------- §8 · w-nlm: the tiny neural language model, every number visible ---------- */
(function(){
  const svg=document.getElementById('nl-svg'); if(!svg) return;
  const map=document.getElementById('nl-map'), read=document.getElementById('nl-read'), h1=document.getElementById('nl-w1'), h2=document.getElementById('nl-w2');
  const st={a:NLM_V.indexOf('drink'),b:NLM_V.indexOf('hot')};
  const col=v=>v>=0?cv(K16.ctx):'var(--critical)';
  function drawNet(){ const narrow=vbFor(svg,'0 0 640 330','0 0 340 600'); svg.innerHTML=''; const k=svgK(svg,9.5), glow=glo(svg), f=nlmForward(st.a,st.b);
    const K=Math.min(k,1.35), mono=(px,fill)=>'font:600 '+(px*K).toFixed(1)+'px ui-monospace,Menlo,monospace;fill:'+fill;
    const box=(x,y,w,h,v,labelTop)=>{ const g=el('g',{},svg); el('rect',{x,y,width:w,height:h,rx:6,fill:'color-mix(in srgb,'+col(v)+' '+Math.round(12+40*Math.min(1,Math.abs(v)))+'%,transparent)',stroke:col(v),'stroke-width':1.2},g);
      txt(svg,x+w/2,y+h/2+4*K,N(v,2),mono(9.5,'var(--ink)'),'middle'); if(labelTop) txt(svg,x+w/2,y-5,labelTop,FT(600,8.5,K,'var(--ink-muted)'),'middle'); return g; };
    const link=(x1,y1,x2,y2,w,op,c)=>el('line',{x1,y1,x2,y2,stroke:c||'var(--ink-muted)','stroke-width':w,opacity:op},svg);
    if(!narrow){
      /* column 1: the two words */
      const wy=[110,210]; [st.a,st.b].forEach((wi,i)=>{ el('rect',{x:14,y:wy[i]-16,width:78,height:32,rx:16,fill:'color-mix(in srgb,var(--s1) 22%,transparent)',stroke:cv(K16.word)},svg); txt(svg,53,wy[i]+5,NLM_V[wi],FT(700,11.5,K,'var(--ink)'),'middle'); });
      txt(svg,53,40,'2 words',FT(700,10,K,'var(--ink-muted)'),'middle'); txt(svg,149,40,'look up',FT(700,10,K,'var(--ink-muted)'),'middle'); txt(svg,257,40,'glue: 4',FT(700,10,K,'var(--ink-muted)'),'middle');
      txt(svg,370,40,'8 hidden · tanh',FT(700,10,K,'var(--ink-muted)'),'middle'); txt(svg,545,40,'softmax → next word',FT(700,10,K,'var(--ink-muted)'),'middle');
      /* column 2: looked-up rows */
      [st.a,st.b].forEach((wi,i)=>{ const y=wy[i]-15; link(92,wy[i],108,wy[i],1.5,.6,cv(K16.word)); NLM.E[wi].forEach((v,j)=>box(110+j*40,y,38,30,v)); });
      /* column 3: glued */
      const gy=j=>70+j*50; f.x.forEach((v,j)=>{ const src=j<2?[188,wy[0]]:[188,wy[1]]; link(src[0],src[1],232,gy(j)+15,1,.35); box(234,gy(j),46,30,v); });
      /* column 4: hidden */
      const hy=j=>58+j*32; f.h.forEach((v,j)=>{ f.x.forEach((_,i)=>link(280,gy(i)+15,338,hy(j)+12,.6+.9*Math.min(1,Math.abs(NLM.W[j][i])/2),.18+.25*Math.min(1,Math.abs(NLM.W[j][i])/2),NLM.W[j][i]>=0?cv(K16.ctx):'var(--critical)')); box(340,hy(j),56,24,v); });
      /* column 5: output bars */
      const oy=j=>56+j*26, ox=486, ow=108; const top=f.q.indexOf(Math.max(...f.q));
      f.q.forEach((q,j)=>{ f.h.forEach((_,i)=>{ if(j===top) link(396,hy(i)+12,ox-44,oy(j)+9,.7,.25,cv(K16.prob)); });
        txt(svg,ox-6,oy(j)+13,NLM_V[j],FT(j===top?800:600,10,K,j===top?cv(K16.gold):'var(--ink-2)'),'end');
        el('rect',{x:ox,y:oy(j)+2,width:ow,height:16,rx:4,fill:'var(--grid)',opacity:.5},svg);
        el('rect',{x:ox,y:oy(j)+2,width:Math.max(1,ow*q),height:16,rx:4,fill:j===top?cv(K16.gold):cv(K16.prob),opacity:.9},svg);
        txt(svg,ox+ow+4,oy(j)+14,N(q,3),mono(9,'var(--ink)')); });
    } else {
      const K2=K; txt(svg,12,22,'2 words → look up → glue',FT(700,10,K2,'var(--ink-muted)'));
      [st.a,st.b].forEach((wi,i)=>{ const y=36+i*44; el('rect',{x:12,y,width:92,height:34,rx:17,fill:'color-mix(in srgb,var(--s1) 22%,transparent)',stroke:cv(K16.word)},svg); txt(svg,58,y+22,NLM_V[wi],FT(700,11,K2,'var(--ink)'),'middle');
        link(104,y+17,122,y+17,1.5,.6,cv(K16.word)); NLM.E[wi].forEach((v,j)=>box(124+j*52,y+2,48,30,v)); });
      txt(svg,12,146,'the glued list of 4',FT(700,10,K2,'var(--ink-muted)')); f.x.forEach((v,j)=>box(12+j*80,156,74,30,v));
      txt(svg,12,216,'8 hidden neurons (tanh)',FT(700,10,K2,'var(--ink-muted)')); f.h.forEach((v,j)=>box(12+(j%4)*80,226+Math.floor(j/4)*38,74,30,v));
      txt(svg,12,322,'softmax → the next word',FT(700,10,K2,'var(--ink-muted)'));
      const top=f.q.indexOf(Math.max(...f.q)), ox=110, ow=170;
      f.q.forEach((q,j)=>{ const y=334+j*26; txt(svg,ox-8,y+14,NLM_V[j],FT(j===top?800:600,10.5,K2,j===top?cv(K16.gold):'var(--ink-2)'),'end');
        el('rect',{x:ox,y:y+2,width:ow,height:18,rx:4,fill:'var(--grid)',opacity:.5},svg); el('rect',{x:ox,y:y+2,width:Math.max(1,ow*q),height:18,rx:4,fill:j===top?cv(K16.gold):cv(K16.prob),opacity:.9},svg);
        txt(svg,ox+ow+4,y+16,N(q,3),mono(9.5,'var(--ink)')); });
    }
    svg.dataset.q=f.q.map(x=>x.toFixed(4)).join(','); svg.dataset.pair=NLM_V[st.a]+' '+NLM_V[st.b];
    const order=f.q.map((q,i)=>[q,i]).sort((a,b)=>b[0]-a[0]).slice(0,3);
    read.innerHTML=`after "<b>${NLM_V[st.a]} ${NLM_V[st.b]}</b>":<br>`+order.map(([q,i])=>`${NLM_V[i]} <b>${N(q,3)}</b>`).join(' · ')+
      (NLM_V[st.a]==='I'&&NLM_V[st.b]==='play'?'<br><span style="color:var(--ink-muted)">never saw "I play football", yet football gets '+N(f.q[NLM_V.indexOf('football')],3)+'</span>':''); }
  function drawMap(){ const m=map; m.innerHTML=''; const k=svgK(m,10), K=Math.min(k,1.5), glow=glo(m); const xs=NLM.E.map(e=>e[0]), ys=NLM.E.map(e=>e[1]);
    const X0=Math.min(...xs)-.35,X1=Math.max(...xs)+.35,Y0=Math.min(...ys)-.3,Y1=Math.max(...ys)+.3, S=Math.min(236/(X1-X0),220/(Y1-Y0)), px=x=>12+(x-X0)*S, py=y=>248-(y-Y0)*S;
    el('line',{x1:px(X0),x2:px(X1),y1:py(0),y2:py(0),stroke:'var(--axis)','stroke-width':1},m); el('line',{x1:px(0),x2:px(0),y1:py(Y0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1},m);
    txt(m,10,16,'the learned table: every word\'s 2 numbers',FT(700,9,K,'var(--ink-muted)'));
    const placed=[]; NLM_V.forEach((w,i)=>{ const x=px(NLM.E[i][0]), y=py(NLM.E[i][1]), on=i===st.a||i===st.b; let ly=y-4;
      while(placed.some(p=>Math.abs(p[0]-x)<34*K&&Math.abs(p[1]-ly)<11*K)) ly+=12*K; placed.push([x,ly]);
      glowDot(m,x,y,on?5:3.6,on?cv(K16.gold):cv(K16.word),glow); txt(m,x+7,ly,w,FT(on?800:600,9.5,K,on?cv(K16.gold):'var(--ink-2)')); }); }

  const pickA=w=>{ st.a=NLM_V.indexOf(w); pressChip(h1,w); drawNet(); drawMap(); }, pickB=w=>{ st.b=NLM_V.indexOf(w); pressChip(h2,w); drawNet(); drawMap(); };
  chipRow(h1,NLM_V,'',pickA); chipRow(h2,NLM_V,'c2',pickB); pressChip(h1,NLM_V[st.a]); pressChip(h2,NLM_V[st.b]);
  drawNet(); drawMap(); onTheme(()=>{ drawNet(); drawMap(); }); onResizeW(svg.parentNode,()=>{ drawNet(); drawMap(); });
  window.U16Nlm={pick(a,b){ pickA(a); pickB(b); },st};
})();

/* ---------- §9 · w-para: the parallelogram by hand ---------- */
(function(){
  const svg=document.getElementById('pa2-svg'); if(!svg) return;
  const read=document.getElementById('pa2-read');
  const P0={king:[3,2],man:[1,2],woman:[1,-2]}, FIX={queen:[3,-2],prince:[2.2,3.3],princess:[2.4,-3.3],boy:[.5,2.8],girl:[.4,-2.9]};
  const st={P:JSON.parse(JSON.stringify(P0)),inc:false,drag:null};
  let geo=null;
  function res(){ return vsub(vadd(st.P.king,st.P.woman),st.P.man); }
  function ranked(){ const q=res(), all=Object.assign({},FIX,st.P); return Object.keys(all).filter(w=>st.inc||!(w in st.P)).map(w=>({w,c:cosSim(q,all[w])})).sort((a,b)=>b.c-a.c); }
  function draw(){ const narrow=vbFor(svg,'0 0 520 380','0 0 340 340'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg);
    const W=narrow?340:520, H=narrow?340:380, X0=-1,X1=5,Y0=-4.2,Y1=4.2, s=Math.min((W-30)/(X1-X0),(H-24)/(Y1-Y0)), ox=(W-s*(X1-X0))/2, oy=(H-s*(Y1-Y0))/2;
    const px=x=>ox+(x-X0)*s, py=y=>oy+(Y1-y)*s; geo={px,py,ix:X=>X0+(X-ox)/s,iy:Y=>Y1-(Y-oy)/s};
    for(let x=Math.ceil(X0);x<=X1;x++) el('line',{x1:px(x),x2:px(x),y1:py(Y0),y2:py(Y1),stroke:'var(--grid)','stroke-width':1},svg);
    for(let y=Math.ceil(Y0);y<=Y1;y++) el('line',{x1:px(X0),x2:px(X1),y1:py(y),y2:py(y),stroke:'var(--grid)','stroke-width':1},svg);
    el('line',{x1:px(X0),x2:px(X1),y1:py(0),y2:py(0),stroke:'var(--axis)','stroke-width':1.4},svg); el('line',{x1:px(0),x2:px(0),y1:py(Y0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.4},svg);
    const K=st.P.king, M=st.P.man, Wo=st.P.woman, D=res(), R=ranked(), best=R[0];
    /* the parallelogram */
    el('polygon',{points:[M,K,D,Wo].map(p=>px(p[0])+','+py(p[1])).join(' '),fill:cv(K16.gold),opacity:.1,stroke:cv(K16.gold),'stroke-width':1,'stroke-dasharray':'4 4'},svg);
    garrow(svg,px(M[0]),py(M[1]),px(Wo[0]),py(Wo[1]),cv('s5'),3,!!glow); garrow(svg,px(K[0]),py(K[1]),px(D[0]),py(D[1]),cv('s5'),3,!!glow);
    /* the cosine ray to the best word */
    const all=Object.assign({},FIX,st.P), bp=all[best.w];
    el('line',{x1:px(0),y1:py(0),x2:px(D[0]),y2:py(D[1]),stroke:cv(K16.gold),'stroke-width':1.2,'stroke-dasharray':'2 4',opacity:.8},svg);
    Object.entries(FIX).forEach(([w,p])=>{ const on=w===best.w; glowDot(svg,px(p[0]),py(p[1]),on?7:5,on?cv(K16.gold):'var(--ink-2)',on&&glow); txt(svg,px(p[0])+9,py(p[1])+4,w,FT(on?800:600,10.5,k,on?cv(K16.gold):'var(--ink-2)')); });
    Object.entries(st.P).forEach(([w,p])=>{ const on=w===best.w; el('circle',{cx:px(p[0]),cy:py(p[1]),r:12,fill:cv(K16.people),opacity:.18},svg); glowDot(svg,px(p[0]),py(p[1]),7,on?cv(K16.gold):cv(K16.people),glow);
      txt(svg,px(p[0])-10,py(p[1])-10,w,FT(800,11,k,on?cv(K16.gold):cv(K16.people)),'end'); });
    el('circle',{cx:px(D[0]),cy:py(D[1]),r:11,fill:'none',stroke:cv(K16.gold),'stroke-width':2.2},svg);
    txt(svg,px(D[0])+12,py(D[1])+18,'king − man + woman',FT(700,9.5,k,cv(K16.gold)));
    read.innerHTML=`king − man + woman = ${vecN(st.P.king,2)} − ${vecN(st.P.man,2)} + ${vecN(st.P.woman,2)} = <b>${vecN(D,2)}</b><br>nearest by cosine${st.inc?' (inputs allowed)':' (skipping king, man, woman)'}:<br>`+
      R.slice(0,4).map((o,i)=>`${i?'':'<b>'}${o.w} ${N(o.c,3)}${i?'':'</b>'}`).join(' · ');
    svg.dataset.best=best.w; svg.dataset.d=D.map(x=>x.toFixed(3)).join(','); }
  svgDrag(svg,(x,y)=>{ if(!geo) return false; let bestW=null,bd=24*(+svg.viewBox.baseVal.width/(svg.getBoundingClientRect().width||1))*1.2;
      Object.entries(st.P).forEach(([w,p])=>{ const d=Math.hypot(geo.px(p[0])-x,geo.py(p[1])-y); if(d<bd){ bd=d; bestW=w; } }); st.drag=bestW; return !!bestW; },
    (x,y)=>{ if(!st.drag) return; st.P[st.drag]=[Math.round(geo.ix(x)*10)/10,Math.round(geo.iy(y)*10)/10].map((v,i)=>Math.max(i?-4:-1,Math.min(i?4:5,v))); draw(); },()=>{ st.drag=null; });
  document.getElementById('pa2-inc').addEventListener('click',e=>{ st.inc=!st.inc; e.currentTarget.setAttribute('aria-pressed',st.inc); draw(); });
  document.getElementById('pa2-reset').addEventListener('click',()=>{ st.P=JSON.parse(JSON.stringify(P0)); draw(); });
  draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  window.U16Para={st,draw,set(w,p){ st.P[w]=p; draw(); }};
})();
