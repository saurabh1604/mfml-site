/* ================= UNIT 16 · widgets of Act IV: the network figure, w-sgstep, w-cost, w-w2v, w-ratio, w-lookup, w-nlm ================= */

/* ---------- §8 · the network figure (static, drawn from the toy numbers so it can never disagree with them) ---------- */
(function(){
  const svg=document.getElementById('nf-svg'); if(!svg) return;
  const h=TOY_IN[2], sc=TOY_OUT.map(u=>dot(u,h)), p=softmax(sc);
  function box(x,y,w,hh,t,o){ o=o||{}; const g=el('g',{},svg); el('rect',{x,y,width:w,height:hh,rx:5,fill:o.fill||'color-mix(in srgb,var(--surface-2) 75%,transparent)',stroke:o.stroke||'var(--line)','stroke-width':o.sw||1,opacity:o.op==null?1:o.op},g);
    if(t!=null) txt(svg,x+w/2,y+hh/2+4*(o.k||1),t,'font:'+(o.w||600)+' '+(10*(o.k||1)).toFixed(1)+'px ui-monospace,Menlo,monospace;fill:'+(o.ink||'var(--ink)'),'middle'); return g; }
  function arrowR(x1,y1,x2,y2,lab,k){ garrow(svg,x1,y1,x2,y2,'var(--ink-2)',1.6,false); if(lab) txt(svg,(x1+x2)/2,Math.min(y1,y2)-7,lab,FT(700,10,k,'var(--ink-2)'),'middle'); }
  const IN=cv('s1'), OUT=cv('s3'), GOLD=cv(K16.gold), PROB=cv(K16.prob);
  const tint=(c,a)=>`color-mix(in srgb,${c} ${a}%,transparent)`;
  function draw(){ const narrow=vbFor(svg,'0 0 820 330','0 0 340 690'); svg.innerHTML=''; const k=Math.min(svgK(svg,10),1.35), T=(t,x,y,a,f)=>txt(svg,x,y,t,FT(700,10,k,f||'var(--ink-muted)'),a||'middle');
    if(!narrow){
      const rowY=i=>62+i*30, CW=34, CH=24;
      T('one-hot word',78,34); T('input table W_in',184,34,'middle',IN); T('h',290,34,'middle',GOLD); T('output table W_out',456,34,'middle',OUT); T('scores',618,34); T('chances',722,34,'middle',PROB);
      TOY_V.forEach((w,i)=>{ const on=i===2; txt(svg,60,rowY(i)+16,w,FT(on?800:600,10,k,on?GOLD:'var(--ink-2)'),'end');
        box(64,rowY(i),CW,CH,on?'1':'0',{fill:on?tint(GOLD,30):undefined,stroke:on?GOLD:undefined,ink:on?'var(--ink)':'var(--ink-muted)',k});
        TOY_IN[i].forEach((v,j)=>box(142+j*(CW+4),rowY(i),CW,CH,nm(String(v)),{fill:on?tint(IN,34):tint(IN,8),stroke:on?IN:'var(--line)',op:on?1:.55,k}));
        const s=sc[i]; box(600,rowY(i),CW,CH,nm(String(s)),{fill:s>0?tint(PROB,10+12*s):'color-mix(in srgb,var(--surface-2) 75%,transparent)',k});
        const bw=Math.max(1.5,120*p[i]); el('rect',{class:'nfbar','data-p':p[i].toFixed(6),x:660,y:rowY(i)+4,width:bw,height:CH-8,rx:3,fill:i===2?GOLD:PROB,opacity:.9},svg);
        txt(svg,664+bw,rowY(i)+16,trim(F(p[i],3)),FT(700,9.5,k,'var(--ink)')); });
      arrowR(104,rowY(2)+12,138,rowY(2)+12,'× W_in',k);
      [0,1].forEach(j=>box(272,104+j*30,CW,CH,nm(String(h[j])),{fill:tint(GOLD,26),stroke:GOLD,k}));
      arrowR(222,rowY(2)+12,268,122,'',k);
      TOY_V.forEach((w,i)=>{ txt(svg,372+i*(CW+4)+CW/2,96,w,FT(600,9.5,k,'var(--ink-2)'),'middle'); [0,1].forEach(j=>box(372+i*(CW+4),104+j*30,CW,CH,nm(String(TOY_OUT[i][j])),{fill:tint(OUT,18),stroke:OUT,op:.9,k})); });
      arrowR(310,128,368,128,'· W_out',k); arrowR(560,128,596,128,'',k); arrowR(640,128,656,128,'',k);
      txt(svg,410,262,'V  →  d  →  V',FT(800,17,Math.min(k,1.2),'var(--ink)'),'middle');
      txt(svg,410,286,'here 5 → 2 → 5 · in real models about 50 000 → 300 → 50 000',FT(600,10,k,'var(--ink-muted)'),'middle');
      txt(svg,289,176,'skip-gram: h = v(chai)',FT(600,9.5,k,GOLD),'middle'); txt(svg,289,190,'CBOW: average of rows',FT(600,9.5,k,'var(--ink-muted)'),'middle');
    } else {
      const CW=46, CH=26, x0=(340-5*(CW+4))/2;
      T('one-hot word',170,18); TOY_V.forEach((w,i)=>{ const on=i===2; txt(svg,x0+i*(CW+4)+CW/2,36,w,FT(on?800:600,10,k,on?GOLD:'var(--ink-2)'),'middle'); box(x0+i*(CW+4),42,CW,CH,on?'1':'0',{fill:on?tint(GOLD,30):undefined,stroke:on?GOLD:undefined,ink:on?'var(--ink)':'var(--ink-muted)',k}); });
      garrow(svg,170,74,170,98,'var(--ink-2)',1.6,false); txt(svg,180,90,'× W_in',FT(700,10,k,'var(--ink-2)'));
      T('input table W_in (5 × 2)',170,114,'middle',IN);
      TOY_V.forEach((w,i)=>{ const on=i===2, y=122+i*30; txt(svg,118,y+17,w,FT(on?800:600,10,k,on?GOLD:'var(--ink-2)'),'end'); TOY_IN[i].forEach((v,j)=>box(124+j*(CW+4),y,CW,CH,nm(String(v)),{fill:on?tint(IN,34):tint(IN,8),stroke:on?IN:'var(--line)',op:on?1:.55,k})); });
      garrow(svg,170,276,170,300,'var(--ink-2)',1.6,false);
      T('h = v(chai) (d = 2)',170,316,'middle',GOLD); [0,1].forEach(j=>box(124+j*(CW+4),324,CW,CH,nm(String(h[j])),{fill:tint(GOLD,26),stroke:GOLD,k}));
      garrow(svg,170,356,170,380,'var(--ink-2)',1.6,false); txt(svg,180,372,'· W_out',FT(700,10,k,'var(--ink-2)'));
      T('output table W_out (2 × 5)',170,396,'middle',OUT);
      TOY_V.forEach((w,i)=>{ [0,1].forEach(j=>box(x0+i*(CW+4),404+j*30,CW,CH,nm(String(TOY_OUT[i][j])),{fill:tint(OUT,18),stroke:OUT,op:.9,k})); });
      garrow(svg,170,466,170,490,'var(--ink-2)',1.6,false);
      T('scores and chances',170,506);
      TOY_V.forEach((w,i)=>{ const y=516+i*26; txt(svg,70,y+15,w,FT(600,10,k,i===2?GOLD:'var(--ink-2)'),'end'); box(76,y,40,20,nm(String(sc[i])),{k});
        const bw=Math.max(1.5,150*p[i]); el('rect',{class:'nfbar','data-p':p[i].toFixed(6),x:124,y:y+3,width:bw,height:14,rx:3,fill:i===2?GOLD:PROB,opacity:.9},svg); txt(svg,128+bw,y+15,trim(F(p[i],3)),FT(700,9.5,k,'var(--ink)')); });
      txt(svg,170,676,'V → d → V · here 5 → 2 → 5',FT(800,12,Math.min(k,1.2),'var(--ink)'),'middle');
    }
  }
  draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  U16['fig-net']={state(){ return {h,scores:sc,p,bars:[...svg.querySelectorAll('rect.nfbar')].map(r=>({p:+r.dataset.p,w:+r.getAttribute('width')})),texts:textBoxes(svg)}; }};
})();

/* ---------- §12 · w-sgstep: one round of the yes/no game, as arrows ---------- */
(function(){
  const svg=document.getElementById('sg-svg'); if(!svg) return;
  const read=document.getElementById('sg-read');
  let S={v:SG0.v.slice(),up:SG0.up.slice(),un:SG0.un.slice()}, hist=[S], eta=1, busy=false, shown=S;
  const COL={v:K16.word,up:K16.ctx,un:'s2'}, LAB={v:'v chai',up:'u hot',un:'u football'};
  function draw(){ const narrow=vbFor(svg,'0 0 560 300','0 0 340 330'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg);
    const X0=-2.1,X1=3.1,Y0=-.9,Y1=1.6, box0=narrow?{x:8,y:8,w:324,h:190}:{x:10,y:10,w:540,h:280};
    const sc=Math.min(box0.w/(X1-X0),box0.h/(Y1-Y0)), ox=box0.x+(box0.w-sc*(X1-X0))/2, oy=box0.y+(box0.h-sc*(Y1-Y0))/2;
    const px=x=>ox+(x-X0)*sc, py=y=>oy+(Y1-y)*sc;
    for(let x=Math.ceil(X0);x<=X1;x++) el('line',{x1:px(x),x2:px(x),y1:py(Y0),y2:py(Y1),stroke:'var(--grid)','stroke-width':1},svg);
    for(let y=Math.ceil(Y0);y<=Y1;y++) el('line',{x1:px(X0),x2:px(X1),y1:py(y),y2:py(y),stroke:'var(--grid)','stroke-width':1},svg);
    el('line',{x1:px(X0),x2:px(X1),y1:py(0),y2:py(0),stroke:'var(--axis)','stroke-width':1.4},svg); el('line',{x1:px(0),x2:px(0),y1:py(Y0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.4},svg);
    const hs=hist.slice(-12);
    ['v','up','un'].forEach(key=>{ const c=cv(COL[key]), pts=hs.map(s=>s[key]);
      if(pts.length>1) el('polyline',{points:pts.map(q=>px(q[0])+','+py(q[1])).join(' '),fill:'none',stroke:c,'stroke-width':1.4,'stroke-dasharray':'3 4',opacity:.55},svg);
      pts.slice(0,-1).forEach(q=>el('circle',{cx:px(q[0]),cy:py(q[1]),r:2.4,fill:c,opacity:.4},svg)); });
    const tips={};
    ['un','up','v'].forEach(key=>{ const q=shown[key], c=cv(COL[key]); garrow(svg,px(0),py(0),px(q[0]),py(q[1]),c,3.2,!!glow); tips[key]=[px(q[0]),py(q[1])];
      const d=Math.hypot(q[0],q[1])||1; txt(svg,px(q[0])+q[0]/d*12,py(q[1])-q[1]/d*12+4,LAB[key],FT(700,11.5,k,c),q[0]>=0?'start':'end'); });
    /* loss mini-chart with a scale */
    const L=hist.map(sgLoss), cb=narrow?{x:44,y:230,w:266,h:62}:{x:px(1.95)+8,y:py(1.5)+14,w:px(3.05)-px(1.95)-8,h:py(.62)-py(1.5)-14};
    el('rect',{x:cb.x-34,y:cb.y-24,width:cb.w+44,height:cb.h+36,rx:10,fill:'var(--surface)',opacity:.8,stroke:'var(--line)'},svg);
    txt(svg,cb.x-26,cb.y-9,'loss per step',FT(700,9.5,k,'var(--ink-muted)'));
    const n=Math.max(8,L.length), lx=i=>cb.x+i*cb.w/(n-1), ly=v=>cb.y+cb.h-(Math.min(1,v))*cb.h;
    [0,.5,1].forEach(v=>{ el('line',{x1:cb.x,x2:cb.x+cb.w,y1:ly(v),y2:ly(v),stroke:v?'var(--grid)':'var(--axis)','stroke-width':1},svg); txt(svg,cb.x-5,ly(v)+3.5,N(v,1),FT(500,9.5,k,'var(--ink-muted)'),'end'); });
    glowPath(svg,L.map((v,i)=>(i?'L':'M')+lx(i).toFixed(1)+','+ly(v).toFixed(1)).join(''),cv(K16.loss),2,!!glow);
    L.forEach((v,i)=>el('circle',{cx:lx(i),cy:ly(v),r:2.6,fill:cv(K16.loss)},svg));
    txt(svg,cb.x+cb.w,cb.y-9,N(L[L.length-1],3),FT(800,11,k,cv(K16.loss)),'end');
    const s=shown, zp=dot(s.up,s.v), zn=dot(s.un,s.v);
    read.innerHTML=`step <b>${hist.length-1}</b> · η = ${N(eta,1)}<br>${tone(K16.ctx,'hot')}: u·v = <b>${N(zp,3)}</b>, "real" <b>${N(sigm(zp),3)}</b><br>${tone('s2','football')}: u·v = <b>${N(zn,3)}</b>, "random" <b>${N(sigm(-zn),3)}</b><br>loss <b>${N(sgLoss(s),3)}</b><br><span style="color:var(--ink-muted)">v = ${vecN(s.v,3)} · u<sub>hot</sub> = ${vecN(s.up,3)} · u<sub>football</sub> = ${vecN(s.un,3)}</span>`;
    fitIn(svg); geo={ox:px(0),oy:py(0),sc,tips}; }
  let geo=null;
  function step(done){ if(busy) return; busy=true; const a=hist[hist.length-1], b=sgStep(a,eta); hist.push(b);
    const lerpS=u=>({v:a.v.map((x,i)=>x+(b.v[i]-x)*u),up:a.up.map((x,i)=>x+(b.up[i]-x)*u),un:a.un.map((x,i)=>x+(b.un[i]-x)*u)});
    tween(RM?1:420,u=>{ shown=lerpS(u); draw(); },()=>{ shown=b; busy=false; draw(); done&&done(); }); }
  document.getElementById('sg-step').addEventListener('click',()=>step());
  document.getElementById('sg-run').addEventListener('click',()=>{ let n=0; const go=()=>{ if(n++<10) step(()=>setTimeout(go,40)); }; go(); });
  document.getElementById('sg-reset').addEventListener('click',()=>{ hist=[{v:SG0.v.slice(),up:SG0.up.slice(),un:SG0.un.slice()}]; shown=hist[0]; draw(); });
  bindCtl('sg-eta',v=>{ eta=v; draw(); },v=>N(v,1));
  draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  U16['w-sgstep']={state(){ const last=hist[hist.length-1]; return {steps:hist.length-1,eta,S:JSON.parse(JSON.stringify(last)),loss:sgLoss(last),losses:hist.map(sgLoss),geo,texts:textBoxes(svg)}; },
    stepNow(){ const a=hist[hist.length-1]; hist.push(sgStep(a,eta)); shown=hist[hist.length-1]; draw(); }, reset(){ hist=[{v:SG0.v.slice(),up:SG0.up.slice(),un:SG0.un.slice()}]; shown=hist[0]; draw(); }, setEta(e){ eta=e; setCtl('sg-eta',e,v=>N(v,1)); draw(); }};
})();

/* ---------- §12 · w-cost: three ways to make it cheap (softmax vs negative sampling · the tree · subsampling) ---------- */
(function(){
  const svg=document.getElementById('cs-svg'); if(!svg) return;
  const root=document.getElementById('w-cost'), read=document.getElementById('cs-read'), tsvg=document.getElementById('ht-svg'), ssvg=document.getElementById('ss-svg'), stream=document.getElementById('ss-stream');
  const st={tab:'ns',V:50000,k:5,anim:1,leaf:0,draw:1};
  const snapV=l=>{ const e=Math.floor(l), m=Math.pow(10,l-e); return Math.round(Math.round(m*10)/10*Math.pow(10,e)); };
  const depth=V=>Math.ceil(Math.log2(V)-1e-12);
  function field(x,y,w,h,nDots,lit,picks,title,sub,k,colLit){
    el('rect',{x,y,width:w,height:h,rx:12,fill:'var(--surface)',opacity:.55,stroke:'var(--line)'},svg);
    txt(svg,x+12,y+20*Math.min(k,1.3),title,FT(700,11,Math.min(k,1.4),'var(--ink)')); txt(svg,x+12,y+36*Math.min(k,1.3),sub,FT(600,9.5,Math.min(k,1.3),'var(--ink-muted)'));
    const top=y+46*Math.min(k,1.3), H=h-(top-y)-10, cols=Math.ceil(Math.sqrt(nDots*w/H)), rows=Math.ceil(nDots/cols), gx=(w-24)/cols, gy=H/rows, r=Math.max(.9,Math.min(4,Math.min(gx,gy)*.33));
    const g=el('g',{},svg), pset=new Set(picks);
    for(let i=0;i<nDots;i++){ const cx=x+12+(i%cols+.5)*gx, cy=top+(Math.floor(i/cols)+.5)*gy, on=i<lit, pk=pset.has(i);
      el('circle',{cx,cy,r:pk?r*2.3:r,fill:pk?(i===picks[0]?cv(K16.gold):cv('s2')):on?colLit:'var(--ink-muted)',opacity:pk?1:on?.85:.22},g); } }
  function drawNS(){ const narrow=vbFor(svg,'0 0 760 330','0 0 340 600'); svg.innerHTML=''; const k=svgK(svg,9.5);
    const V=st.V, K=st.k, nd=Math.min(V,narrow?600:900), per=V/nd, litF=Math.round(nd*Math.min(1,st.anim)), r=rng16(5+K);
    const picks=[]; while(picks.length<Math.min(K+1,nd)){ const i=Math.floor(r()*nd); if(!picks.includes(i)) picks.push(i); }
    const W1=narrow?{x:6,y:6,w:328,h:200}:{x:8,y:8,w:366,h:212}, W2=narrow?{x:6,y:214,w:328,h:200}:{x:386,y:8,w:366,h:212};
    const each=per>1.0001?' · each dot ≈ '+commas(per)+' words':' · one dot per word';
    field(W1.x,W1.y,W1.w,W1.h,nd,litF,[],'full softmax: score every word',commas(V)+' dot products'+each,k,cv(K16.prob));
    field(W2.x,W2.y,W2.w,W2.h,nd,0,st.anim>=1?picks:picks.slice(0,Math.max(0,Math.floor(st.anim*(K+1)))),'negative sampling: 1 real + '+K+' random',(K+1)+' dot products'+each,k,cv(K16.prob));
    const by=narrow?430:234, bx=narrow?14:170, bw=narrow?296:520, lg=v=>bx+bw*Math.log10(Math.max(1,v))/6, rowH=narrow?34:20;
    [0,1,2,3,4,5,6].forEach(e=>{ el('line',{x1:lg(10**e),x2:lg(10**e),y1:by-4,y2:by+3*rowH,stroke:'var(--grid)','stroke-width':1},svg); txt(svg,lg(10**e),by+3*rowH+14*Math.min(k,1.15),e?'10'+SUP(e):'1',FT(500,9,Math.min(k,1.3),'var(--ink-muted)'),'middle'); });
    /* wide: the name left of each bar; narrow: the name above it */
    const bar=(y,v,col,lab)=>{ const yb=narrow?y+13:y, hb=narrow?15:rowH-6; el('rect',{class:'cbar','data-v':v,x:bx,y:yb,width:Math.max(2,lg(v)-bx),height:hb,rx:4,fill:col,opacity:.85},svg);
      if(narrow) txt(svg,bx,y+9,lab,FT(700,9.5,Math.min(k,1.3),'var(--ink-2)')); else txt(svg,bx-8,y+rowH*.55,lab,FT(700,9.5,Math.min(k,1.3),'var(--ink-2)'),'end');
      txt(svg,Math.min(lg(v)+6,bx+bw-30),yb+hb*.78,commas(v),FT(700,9.5,Math.min(k,1.3),'var(--ink)')); };
    bar(by,V,cv(K16.prob),'softmax · V'); bar(by+rowH,K+1,cv(K16.gold),'negatives · k + 1'); bar(by+2*rowH,depth(V),cv('s7'),'tree · log₂ V');
    fitIn(svg); read.innerHTML=`full softmax: <b>${commas(V)}</b> dot products per guess · negative sampling: <b>${K+1}</b> (about <b>${commas(V/(K+1))}</b> times less work) · tree: <b>${depth(V)}</b> decisions`; }
  function drawTree(){ const narrow=vbFor(tsvg,'0 0 640 300','0 0 340 372'); tsvg.innerHTML=''; const k=Math.min(svgK(tsvg,10),1.5), glow=glo(tsvg);
    /* wide: one row of four leaves; narrow: the same tree squeezed, with shorter edge labels and a two-line note */
    const node=narrow?[[170,40],[88,146],[252,146]]:[[320,44],[170,134],[470,134]], leafXY=narrow?[[44,262],[127,262],[213,262],[296,262]]:[[95,236],[245,236],[395,236],[545,236]];
    const NW=narrow?[150,140,140]:[150,150,150], LW=narrow?78:116, z=HS.nodes.map(n=>dot(n.th,HS.h));
    const onPath=new Set(HS.leaves[st.leaf].path.map(([n,l])=>n+':'+l));
    const edge=(a,b,pl,lit,lab)=>{ const c=lit?cv(K16.gold):'var(--ink-muted)'; el('line',{x1:a[0],y1:a[1]+17,x2:b[0],y2:b[1]-(narrow?19:16),stroke:c,'stroke-width':lit?3.2:1.4,opacity:lit?1:.55},tsvg);
      const left=b[0]<a[0], mx=(a[0]+b[0])/2+(left?-(narrow?9:16):(narrow?9:16)), my=(a[1]+b[1])/2+(narrow?4:0);
      txt(tsvg,mx,my,narrow?trim(F(pl,3)):lab+' '+trim(F(pl,3)),FT(lit?800:600,9.5,k,lit?cv(K16.gold):'var(--ink-2)'),left?'end':'start'); };
    edge(node[0],node[1],sigm(z[0]),onPath.has('0:1'),'left'); edge(node[0],node[2],sigm(-z[0]),onPath.has('0:0'),'right');
    edge(node[1],leafXY[0],sigm(z[1]),onPath.has('1:1'),'left'); edge(node[1],leafXY[1],sigm(-z[1]),onPath.has('1:0'),'right');
    edge(node[2],leafXY[2],sigm(z[2]),onPath.has('2:1'),'left'); edge(node[2],leafXY[3],sigm(-z[2]),onPath.has('2:0'),'right');
    HS.nodes.forEach((n,i)=>{ const [x,y]=node[i], w=NW[i]; el('rect',{x:x-w/2,y:y-17,width:w,height:34,rx:10,fill:'var(--surface)',stroke:'var(--line)'},tsvg);
      txt(tsvg,x,y-2,n.q,FT(700,narrow?9.5:10,k,'var(--ink)'),'middle'); txt(tsvg,x,y+12,'θ·h = '+N(z[i],2),FT(600,9.5,k,'var(--ink-muted)'),'middle'); });
    HS.leaves.forEach((lf,i)=>{ const [x,y]=leafXY[i], on=i===st.leaf, p=hsLeaf(i), g=el('g',{class:'leaf','data-i':i,style:'cursor:pointer'},tsvg);
      el('rect',{x:x-LW/2,y:y-18,width:LW,height:narrow?44:40,rx:12,fill:on?'color-mix(in srgb,var(--s4) 22%,transparent)':'var(--surface)',stroke:on?cv(K16.gold):'var(--line)','stroke-width':on?2:1},g);
      txt(g,x,y,lf.w,FT(800,10.5,k,on?cv(K16.gold):'var(--ink)'),'middle'); txt(g,x,y+(narrow?17:15),narrow?F(p,4):'P = '+F(p,4),FT(700,9.5,k,'var(--ink-2)'),'middle');
      g.addEventListener('click',()=>{ st.leaf=i; drawTree(); readTree(); }); });
    const tot=trim(F(HS.leaves.reduce((s,_,i)=>s+hsLeaf(i),0),6));
    if(narrow){ txt(tsvg,170,334,'the four chances add up to '+tot,FT(600,9.5,k,'var(--ink-muted)'),'middle'); txt(tsvg,170,354,'— nobody added up the vocabulary',FT(600,9.5,k,'var(--ink-muted)'),'middle'); }
    else txt(tsvg,20,290,'the four chances add up to '+tot+' — nobody added up the vocabulary',FT(600,9.5,k,'var(--ink-muted)'));
    fitIn(tsvg); }
  function readTree(){ const lf=HS.leaves[st.leaf], parts=lf.path.map(([n,l])=>{ const z=dot(HS.nodes[n].th,HS.h); return l?sigm(z):sigm(-z); });
    read.innerHTML=`P(${lf.w}) = ${parts.map(x=>F(x,4)).join(' × ')} = <b>${F(hsLeaf(st.leaf),4)}</b><br>at every fork: left σ(θ·h), right σ(−θ·h) — the two always add up to 1<br>a vocabulary of ${commas(st.V)} words needs a tree only <b>${depth(st.V)}</b> forks deep`; }
  function sample(){ const r=rng16(9000+st.draw*7919); return SS_TEXT.map(([w,f])=>({w,f,p:ssKeep(f),kept:r()<ssKeep(f)})); }
  let SS=null;
  function drawSub(){ SS=sample(); const ci=SS.findIndex(o=>o.w==='chai');
    const win=new Set(); if(SS[ci].kept){ let n=0; for(let j=ci-1;j>=0&&n<2;j--) if(SS[j].kept){ win.add(j); n++; } n=0; for(let j=ci+1;j<SS.length&&n<2;j++) if(SS[j].kept){ win.add(j); n++; } }
    stream.innerHTML=SS.map((o,i)=>`<span class="ssw${o.kept?'':' drop'}${i===ci?' ctr':''}${win.has(i)?' win':''}" title="keep with chance ${pf(o.p)}">${esc(o.w)}</span>`).join(' ');
    const narrow=vbFor(ssvg,'0 0 640 210','0 0 340 300'); ssvg.innerHTML=''; const k=svgK(ssvg,10), n=SS.length, L=narrow?30:40, R=10, T=24, B=narrow?80:62, W=narrow?340:640, H=narrow?300:210, bw=(W-L-R)/n, py=v=>T+(H-T-B)*(1-v);
    [0,.5,1].forEach(v=>{ el('line',{x1:L,x2:W-R,y1:py(v),y2:py(v),stroke:'var(--grid)','stroke-width':1},ssvg); txt(ssvg,L-5,py(v)+3.5,N(v,1),FT(500,9.5,k,'var(--ink-muted)'),'end'); });
    txt(ssvg,L,14,'chance each copy is kept: √(t/f), t = 10⁻⁵',FT(700,10,Math.min(k,1.25),'var(--ink-muted)'));
    SS.forEach((o,i)=>{ const x=L+i*bw+bw*.18, w=bw*.64, y=py(o.p); el('rect',{class:'ssbar','data-p':o.p.toFixed(6),x,y,width:w,height:py(0)-y,rx:3,fill:o.p>=1?cv(K16.ctx):o.p<.05?cv('s2'):cv(K16.prob),opacity:o.kept?.95:.45},ssvg);
      const lab=txt(ssvg,x+w/2,py(0)+12*k,o.w,FT(i===ci?800:600,9.5,k,i===ci?cv(K16.gold):'var(--ink-2)'),'end'); lab.setAttribute('transform',`rotate(-50 ${x+w/2} ${py(0)+8})`); });
    const kept=SS.filter(o=>o.kept).map(o=>o.w), wi=[...win].sort((a,b)=>a-b).map(j=>SS[j].w);
    read.innerHTML=`draw ${st.draw}: kept <b>${kept.length}</b> of ${n} words · "the" kept ${SS.filter(o=>o.w==='the'&&o.kept).length} of 3 times · rare words (f ≤ t) are always kept<br>`+
      (SS[ci].kept?`chai's window of ±2 now reaches: <b>${wi.join(', ')||'—'}</b>`:'chai itself was dropped this time (it is kept with chance 0.5)')+
      `<br><span style="color:var(--ink-muted)">the word frequencies are made up, but typical of real text</span>`; }
  function all(){ if(st.tab==='ns') drawNS(); else if(st.tab==='tree'){ drawTree(); readTree(); } else drawSub(); }
  bindCtl('cs-v',v=>{ st.V=snapV(v); all(); },v=>commas(snapV(v)));
  bindCtl('cs-k',v=>{ st.k=v; all(); },v=>String(v));
  document.getElementById('cs-play').addEventListener('click',()=>{ tween(2200,u=>{ st.anim=u; drawNS(); },()=>{ st.anim=1; drawNS(); }); });
  document.getElementById('ss-draw').addEventListener('click',()=>{ st.draw++; drawSub(); });
  tabs(document.getElementById('cs-tabs'),t=>{ st.tab=t; showTab(root,t); all(); });
  all(); onTheme(all); onResizeW(root,all);
  U16['w-cost']={state(){ return {tab:st.tab,V:st.V,k:st.k,ratio:st.V/(st.k+1),depth:depth(st.V),bars:[...svg.querySelectorAll('rect.cbar')].map(r=>({v:+r.dataset.v,w:+r.getAttribute('width')})),
      leaves:HS.leaves.map((l,i)=>({w:l.w,p:hsLeaf(i)})),leaf:st.leaf,sub:SS&&SS.map(o=>({w:o.w,p:o.p,kept:o.kept})),draw:st.draw,texts:textBoxes(st.tab==='ns'?svg:st.tab==='tree'?tsvg:ssvg)}; },
    setTab(t){ document.querySelector(`#cs-tabs [data-t="${t}"]`).click(); }, setV(l){ setCtl('cs-v',l,v=>commas(snapV(v))); st.V=snapV(l); all(); }, setK(k){ setCtl('cs-k',k,v=>String(v)); st.k=k; all(); },
    pickLeaf(i){ st.leaf=i; drawTree(); readTree(); }, redraw(n){ st.draw=n; drawSub(); }, sampleKeep(n){ const out=[]; for(let d=1;d<=n;d++){ const r=rng16(9000+d*7919); out.push(SS_TEXT.map(([w,f])=>r()<ssKeep(f))); } return out; }};
})();

/* ---------- §13 · w-w2v: strangers who shop at the same stores — chai and coffee never meet, yet converge (3-D) ---------- */
(function(){
  const box=document.getElementById('wv-3d'); if(!box||!CIN) return;
  const TOP=Object.keys(WV_TOP), VOC=[...TOP.flatMap(t=>WV_TOP[t]),'chai','coffee','wicket',...WV_SH], IDX={}; VOC.forEach((w,i)=>{ IDX[w]=i; });
  const GRP=VOC.map(w=>w==='chai'||w==='coffee'?'tea':w==='wicket'?'cricket':(TOP.find(t=>WV_TOP[t].includes(w))||'shared'));
  const HI={chai:K16.gold,coffee:K16.tea,wicket:K16.cricket}, D=3, WIN=2, lr=.05, MAXP=120000;
  const st={neg:5,run:false,seed:118,pairs:0,ema:null,hist:[]};   /* seed 118: chai and coffee start almost opposite (cos −0.93), wicket starts close to chai (0.74) */
  const corpus=wvCorpus(2016,480).map(s=>s.map(w=>IDX[w]));
  const counts=VOC.map(()=>0); corpus.forEach(s=>s.forEach(i=>counts[i]++));
  const table=[]; counts.forEach((c,i)=>{ const m=Math.max(1,Math.round(Math.pow(c,.75))); for(let k=0;k<m;k++) table.push(i); });
  let V,U,R;
  const cosW=(a,b)=>cosSim(V[IDX[a]],V[IDX[b]]);
  function snap(){ st.hist.push({pairs:st.pairs,cc:cosW('chai','coffee'),cw:cosW('chai','wicket')}); }
  function init(){ R=rng16(st.seed); V=VOC.map(()=>[0,0,0].map(()=>(R()-.5))); U=VOC.map(()=>[0,0,0]); st.pairs=0; st.ema=null; st.hist=[]; snap(); }
  init();
  function trainPairs(n){ let Lsum=0, cnt=0;
    for(let t=0;t<n;t++){ const s=corpus[Math.floor(R()*corpus.length)], i=Math.floor(R()*s.length), off=1+Math.floor(R()*WIN), j=i+(R()<.5?-off:off);
      if(j<0||j>=s.length) continue; const c=s[i], o=s[j], v=V[c], gv=[0,0,0];
      const upd=(w,label)=>{ const u=U[w], z=dot(u,v), sg=sigm(z), g=label?sg-1:sg; Lsum+=label?-Math.log(Math.max(1e-12,sg)):-Math.log(Math.max(1e-12,1-sg));
        for(let d=0;d<D;d++){ gv[d]+=g*u[d]; u[d]-=lr*g*v[d]; } };
      upd(o,1); for(let k=0;k<st.neg;k++){ const w=table[Math.floor(R()*table.length)]; if(w!==o) upd(w,0); }
      for(let d=0;d<D;d++) v[d]-=lr*gv[d]; cnt++; }
    st.pairs+=cnt; return cnt?Lsum/cnt:0; }
  function tick(){ const L=trainPairs(600); st.ema=st.ema==null?L:st.ema*.85+L*.15; if(st.pairs-(st.hist.length?st.hist[st.hist.length-1].pairs:0)>=2400) snap(); if(st.pairs>=MAXP){ snap(); setRun(false); } }
  const read=document.getElementById('wv-read'), csvg=document.getElementById('wv-chart');
  function readout(){ const cc=cosW('chai','coffee'), cw=cosW('chai','wicket');
    read.innerHTML=`pairs played <b>${commas(st.pairs)}</b> · loss <b>${st.ema==null?'—':N(st.ema,3)}</b><br>${tone(K16.gold,'chai')} · ${tone(K16.tea,'coffee')}: cos <b>${N(cc,3)}</b> <span style="color:var(--ink-muted)">(never in one sentence)</span><br>${tone(K16.gold,'chai')} · ${tone(K16.cricket,'wicket')}: cos <b>${N(cw,3)}</b>`; }
  function drawChart(){ const b=csvg; b.innerHTML=''; const k=svgK(b,8.5), W=300, H=170, L=30, T=16, B=26, glow=glo(b), hs=st.hist;
    const px=p=>L+(W-L-10)*p/MAXP, py=v=>T+(H-T-B)*(1-(v+1)/2);
    [-1,0,1].forEach(v=>{ el('line',{x1:L,x2:W-10,y1:py(v),y2:py(v),stroke:v?'var(--grid)':'var(--axis)','stroke-width':1},b); txt(b,L-5,py(v)+3,nm(String(v)),FT(500,8.5,k,'var(--ink-muted)'),'end'); });
    txt(b,L,H-7,'cosine while training →',FT(600,9,k,'var(--ink-muted)'));
    [['cc',K16.gold],['cw',K16.cricket]].forEach(([key,c])=>{ if(hs.length>1) glowPath(b,hs.map((h,i)=>(i?'L':'M')+px(h.pairs).toFixed(1)+','+py(h[key]).toFixed(1)).join(''),cv(c),2,!!glow); });
    const last=hs[hs.length-1]; if(last){ txt(b,W-10,py(last.cc)-6,'chai·coffee',FT(700,9,k,cv(K16.gold)),'end'); txt(b,W-10,py(last.cw)+(last.cw<last.cc-.25?14:-6),'chai·wicket',FT(700,9,k,cv(K16.cricket)),'end'); } }
  let S3=null, ctxRef=null; const RG=1.75;
  function build(){ return CIN.stage3d(box,{camera:{pos:camFit(box,[3.6,2.6,5.2],[0,0,0],1.22),look:[0,0,0],fov:40},orbit:true,autoRotate:.12,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx); ctxRef=ctx;
      starfield(ctx,380,16);
      const globe=new THREE.Mesh(new THREE.SphereGeometry(RG,48,32),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x9fb6ff,transparent:true,opacity:isLight?.16:.06,roughness:.1,metalness:.2,depthWrite:false})); root.add(globe);
      const wire=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(RG,18,12)),new THREE.LineBasicMaterial({color:hx('grid'),transparent:true,opacity:isLight?.3:.18})); root.add(wire);
      const C={tea:hx(K16.tea),cricket:hx(K16.cricket),travel:hx(K16.travel),shared:hx('muted')};
      const pts=VOC.map((w,i)=>{ const hi=HI[w], c=hi?hx(hi):C[GRP[i]]; const d=CIN.prim.dot(ctx,[0,0,0],c,hi?.095:GRP[i]==='shared'?.035:.05), h=haloSprite(ctx,c,hi?.62:.26); root.add(d,h);
        let ray=null, lab=null; if(hi){ ray=liveTube(ctx,c,.009,.75); ray.material.depthWrite=false; root.add(ray); lab=tslot(ctx,root); } return {d,h,ray,lab}; });
      hoverTips(ctx,box,()=>VOC.map((w,i)=>{ const v=V[i], n=norm(v)||1; return {p:[v[0]/n*RG,v[2]/n*RG,v[1]/n*RG],t:w,c:'var(--'+(HI[w]||K16[GRP[i]]||'ink-muted')+')'}; }));
      const posOf=i=>{ const v=V[i], n=norm(v)||1; return [v[0]/n*RG,v[2]/n*RG,v[1]/n*RG]; };
      /* the three story words are named; their labels are laid out on the screen so they never collide (chai and coffee end up on the same spot) */
      let lastCam='';
      ctx.relabel=()=>{ const items=[]; pts.forEach((o,i)=>{ if(o.lab) items.push({slot:o.lab,anchor:posOf(i),text:VOC[i],prio:0,opts:{size:22,scale:.0092*LSc(box),color:colors[HI[VOC[i]]],bg:true,weight:800}}); });
        layoutLabels(ctx,items,{avoid:VOC.map((_,i)=>posOf(i))}); };
      ctx.redraw=()=>{ pts.forEach((o,i)=>{ const p=posOf(i); o.d.position.set(...p); o.h.position.copy(o.d.position); if(o.ray) aimTube(THREE,o.ray,[0,0,0],p); }); ctx.relabel(); lastCam=''; RR(ctx); };
      ctx.tick=()=>{ const q=ctx.camera.position, k=q.x.toFixed(3)+','+q.y.toFixed(3)+','+q.z.toFixed(3)+','+ctx.size.w; if(k!==lastCam){ lastCam=k; ctx.relabel(); return true; } return false; };
      ctx.redraw(); if(matchMedia('(hover:hover) and (pointer:fine)').matches) hint(box,'drag to orbit');
    },
    update(ctx){ st.frame=performance.now(); if(!st.run) return ctx.tick?ctx.tick():false; tick(); ctx.redraw(); if(st.pairs%4800<600){ readout(); drawChart(); } return true; } }); }
  function setRun(on){ st.run=on; const b=document.getElementById('wv-play'); b.textContent=on?'❚❚ pause':(st.pairs>=MAXP?'▶ train again':'▶ train'); if(on&&S3&&S3.handle) S3.handle.requestRender(); readout(); drawChart(); }
  S3=mountStage(box,build);
  document.getElementById('wv-play').addEventListener('click',()=>{ if(!st.run&&st.pairs>=MAXP) init(); setRun(!st.run); });
  document.getElementById('wv-seed').addEventListener('click',()=>{ st.seed=(st.seed*48271)%2147483647; init(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); setRun(st.run); });
  bindCtl('wv-neg',v=>{ st.neg=v; },v=>String(v));
  /* without WebGL (or off-screen) training still runs, so the numbers never depend on the picture */
  setInterval(()=>{ if(st.run&&(!(S3&&S3.handle&&!S3.handle.ctx.dead&&S3.near)||performance.now()-(st.frame||0)>250)){ tick(); if(st.pairs%4800<600){ readout(); drawChart(); } if(S3&&S3.handle&&S3.handle.ctx.redraw&&S3.near) S3.handle.ctx.redraw(); } },40);
  readout(); drawChart(); onTheme(drawChart); onResizeW(csvg.parentNode,drawChart);
  U16['w-w2v']={state(){ return {pairs:st.pairs,neg:st.neg,seed:st.seed,loss:st.ema,cc:cosW('chai','coffee'),cw:cosW('chai','wicket'),hist:st.hist.slice(),
      together:corpus.filter(s=>s.includes(IDX.chai)&&s.includes(IDX.coffee)).length,labels:S3&&S3.handle&&ctxRef&&!ctxRef.dead?labelRects(ctxRef):null}; },
    train(nTicks){ for(let i=0;i<nTicks&&st.pairs<MAXP;i++) tick(); readout(); drawChart(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); },
    reseed(seed){ st.seed=seed; init(); setRun(st.run); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); }, setRun, init};
})();

/* ---------- §13 · w-ratio: meaning lives in ratios (GloVe) ---------- */
(function(){
  const bsvg=document.getElementById('gr-bars'); if(!bsvg) return;
  const vsvg=document.getElementById('gr-vec'), read=document.getElementById('gr-read'), pick=document.getElementById('gr-pick'); const st={probe:'hot'};
  const PC={hot:cv('s2'),cold:cv('s1'),drink:cv('s6'),cricket:cv('s3')};
  let geo=null;
  function draw(){ const w=st.probe, pc=GR_CHAI[w]/GR_N, pl=GR_LASSI[w]/GR_N, ratio=pc/pl, ln=Math.log(ratio);
    /* left: the two probabilities (bars) and the ratio on a log ruler */
    bsvg.setAttribute('viewBox','0 0 420 260'); bsvg.innerHTML=''; let k=Math.min(svgK(bsvg,10),1.8); const glow=glo(bsvg);
    const top=.07, bx=[58,178], by=30, bh=120, pyb=v=>by+bh*(1-v/top);
    [0,.02,.04,.06].forEach(v=>{ el('line',{x1:40,x2:250,y1:pyb(v),y2:pyb(v),stroke:'var(--grid)','stroke-width':1},bsvg); txt(bsvg,36,pyb(v)+3.5,trim(F(v,2)),FT(500,9.5,k,'var(--ink-muted)'),'end'); });
    [[pc,'chai',cv(K16.gold)],[pl,'lassi',cv('s5')]].forEach(([v,lab,c],i)=>{ el('rect',{class:'pbar','data-v':v,x:bx[i],y:pyb(v),width:60,height:pyb(0)-pyb(v),rx:5,fill:c,opacity:.9},bsvg);
      txt(bsvg,bx[i]+30,pyb(v)-6,GR_CHAI[w]===undefined?'':(i?GR_LASSI[w]:GR_CHAI[w])+'/1000',FT(700,9.5,k,'var(--ink)'),'middle'); txt(bsvg,bx[i]+30,pyb(0)+15,'P('+w+' | '+lab+')',FT(700,9.5,k,c),'middle'); });
    const rx0=270, rx1=410, ry0=24, ry1=200, ly=r=>ry1-(ry1-ry0)*(Math.log10(r)+2)/4;
    el('line',{x1:rx0+40,x2:rx0+40,y1:ry0,y2:ry1,stroke:'var(--axis)','stroke-width':1.4},bsvg);
    [.01,.1,1,10,100].forEach(r=>{ el('line',{x1:rx0+34,x2:rx0+46,y1:ly(r),y2:ly(r),stroke:'var(--ink-muted)','stroke-width':1},bsvg); txt(bsvg,rx0+30,ly(r)+3.5,String(r),FT(500,9.5,k,r===1?'var(--ink)':'var(--ink-muted)'),'end'); });
    txt(bsvg,rx0+40,ry1+18,'ratio (log scale)',FT(700,9.5,k,'var(--ink-muted)'),'middle');
    el('circle',{class:'rmark','data-r':ratio,cx:rx0+40,cy:ly(ratio),r:8,fill:PC[w],stroke:'var(--page)','stroke-width':2},bsvg);
    txt(bsvg,rx0+54,ly(ratio)+4,trim(F(ratio,3)),FT(800,11,k,PC[w]));
    txt(bsvg,20,248,'ratio = '+trim(F(pc,3))+' ÷ '+trim(F(pl,3))+' = '+trim(F(ratio,3))+' · ln ratio = '+trim(F(ln,3)),FT(700,10,k,'var(--ink-2)'));
    /* right: the hand-made GloVe vectors */
    vsvg.setAttribute('viewBox','0 0 300 260'); vsvg.innerHTML=''; k=Math.min(svgK(vsvg,10),1.5); const g2=glo(vsvg);
    const ox=130, oy=130, sc=42, px=x=>ox+x*sc, py=y=>oy-y*sc;
    for(let x=-3;x<=3;x++) el('line',{x1:px(x),x2:px(x),y1:py(-2.6),y2:py(2.6),stroke:'var(--grid)','stroke-width':1},vsvg);
    for(let y=-2;y<=2;y++) el('line',{x1:px(-3),x2:px(3.6),y1:py(y),y2:py(y),stroke:'var(--grid)','stroke-width':1},vsvg);
    el('line',{x1:px(-3),x2:px(3.6),y1:oy,y2:oy,stroke:'var(--axis)','stroke-width':1.2},vsvg); el('line',{x1:ox,x2:ox,y1:py(-2.6),y2:py(2.6),stroke:'var(--axis)','stroke-width':1.2},vsvg);
    const tips={};
    GR_P.forEach(p=>{ const v=GR_VEC[p], on=p===w, c=PC[p]; garrow(vsvg,ox,oy,px(v[0]),py(v[1]),c,on?3.4:1.8,on&&!!g2); tips[p]=[px(v[0]),py(v[1])];
      const d=Math.hypot(...v); txt(vsvg,px(v[0])+v[0]/d*10+(v[0]===0?8:0),py(v[1])-v[1]/d*10+4,p,FT(on?800:600,10.5,k,on?c:'var(--ink-2)'),v[0]<0?'end':'start'); });
    garrow(vsvg,ox,oy,px(GR_DIFF[0]),py(GR_DIFF[1]),cv(K16.gold),3.6,!!g2); tips.diff=[px(GR_DIFF[0]),py(GR_DIFF[1])];
    txt(vsvg,px(GR_DIFF[0]),py(0)+18,'chai − lassi',FT(800,10.5,k,cv(K16.gold)),'end');
    const dp=dot(GR_DIFF,GR_VEC[w]); geo={ox,oy,sc,tips};
    read.innerHTML=`P(${w} | chai) = <b>${trim(F(pc,3))}</b> · P(${w} | lassi) = <b>${trim(F(pl,3))}</b> · ratio <b>${trim(F(ratio,3))}</b><br>(chai − lassi) · ${w} = <b>${trim(F(dp,3))}</b> = ln ${trim(F(ratio,3))}`+
      (Math.abs(ratio-1)<1e-9?'<br><span style="color:var(--ink-muted)">ratio 1: this word cannot tell chai from lassi, so its arrow is at right angles to the difference</span>':'')+
      `<br><span style="color:var(--ink-muted)">weights f(x) = (x/100)^¾: f(40) = ${trim(F(gloveF(40),3))}, f(2) = ${trim(F(gloveF(2),3))} · vectors hand-made to satisfy GloVe's rule</span>`; }
  chipRow(pick,GR_P,'',w=>{ st.probe=w; pressChip(pick,w); draw(); }); pressChip(pick,st.probe);
  draw(); onTheme(draw); onResizeW(bsvg.parentNode,draw);
  U16['w-ratio']={state(){ const w=st.probe; return {probe:w,pc:GR_CHAI[w]/GR_N,pl:GR_LASSI[w]/GR_N,ratio:GR_CHAI[w]/GR_LASSI[w],dot:dot(GR_DIFF,GR_VEC[w]),geo,
      bars:[...bsvg.querySelectorAll('rect.pbar')].map(r=>({v:+r.dataset.v,h:+r.getAttribute('height')})),mark:+bsvg.querySelector('circle.rmark').getAttribute('cy'),texts:textBoxes(bsvg).concat(textBoxes(vsvg).map(t=>Object.assign(t,{panel:'vec'})))}; },
    pick(w){ st.probe=w; pressChip(pick,w); draw(); }};
})();

/* ---------- §14 · w-lookup: one-hot × table = fetch a row ---------- */
(function(){
  const eq=document.getElementById('lk-eq'); if(!eq) return;
  const W=['chai','coffee','bat','ball','train'], E=[[.9,.2,.1],[.8,.3,.1],[.1,.9,.2],[.2,.8,.3],[.1,.2,.9]];
  const read=document.getElementById('lk-read'), host=document.getElementById('lk-words'); let sel=0, busy=false;
  function render(gone,showRes){ const oh=W.map((_,i)=>i===sel?1:0), res=E[sel];
    eq.innerHTML=`<div class="lk-vec" style="grid-template-columns:repeat(5,auto)">${oh.map(v=>`<span class="lk-c ${v?'one':'zero'}">${v}</span>`).join('')}</div><span class="lk-op">×</span>`+
      `<div style="display:grid;grid-template-columns:auto auto;gap:4px;align-items:center"><div style="display:grid;gap:4px">${W.map((w,i)=>`<span class="lk-rl${i===sel?' on':''}" style="height:2.05rem;line-height:2.05rem">${w}</span>`).join('')}</div>`+
      `<div class="lk-mat" style="grid-template-columns:repeat(3,auto)">${E.map((r,i)=>r.map(v=>`<span class="lk-c ${i===sel?'row':''}${gone&&i!==sel?' gone':''}">${N(v,1)}</span>`).join('')).join('')}</div></div>`+
      `<span class="lk-op">=</span><div class="lk-vec" style="grid-template-columns:repeat(3,auto)">${res.map(v=>`<span class="lk-c ${showRes?'row':'zero'}">${showRes?N(v,1):'?'}</span>`).join('')}</div>`;
    read.innerHTML=`one-hot "${W[sel]}" = (${W.map((_,i)=>i===sel?1:0).join(', ')}) → the 1 in slot ${sel+1} keeps row ${sel+1} and multiplies every other row by 0 → <b>${vecN(E[sel],1)}</b>`; }
  chipRow(host,W,'',w=>{ sel=W.indexOf(w); pressChip(host,w); render(true,true); }); pressChip(host,W[0]);
  document.getElementById('lk-play').addEventListener('click',()=>{ if(busy) return; busy=true; render(false,false); setTimeout(()=>{ render(true,false); setTimeout(()=>{ render(true,true); busy=false; },RM?0:900); },RM?0:900); });
  render(true,true);
  U16['w-lookup']={state(){ return {sel,word:W[sel],row:E[sel].slice(),product:W.map((_,i)=>i===sel?1:0).reduce((acc,x,i)=>acc.map((a,j)=>a+x*E[i][j]),[0,0,0]),shown:[...eq.querySelectorAll('.lk-vec')].pop().textContent}; },
    pick(i){ sel=i; pressChip(host,W[i]); render(true,true); }};
})();

/* ---------- §14 · w-nlm: the tiny neural language model, every number visible ---------- */
(function(){
  const svg=document.getElementById('nl-svg'); if(!svg) return;
  const map=document.getElementById('nl-map'), read=document.getElementById('nl-read'), h1=document.getElementById('nl-w1'), h2=document.getElementById('nl-w2');
  const st={a:NLM_V.indexOf('drink'),b:NLM_V.indexOf('hot')};
  const col=v=>v>=0?cv(K16.ctx):'var(--critical)';
  function drawNet(){ const narrow=vbFor(svg,'0 0 640 330','0 0 340 600'); svg.innerHTML=''; const k=svgK(svg,9.5), f=nlmForward(st.a,st.b);
    const K=Math.min(k,1.35), mono=(px,fill)=>'font:600 '+(px*K).toFixed(1)+'px ui-monospace,Menlo,monospace;fill:'+fill;
    const box=(x,y,w,h,v)=>{ const g=el('g',{},svg); el('rect',{x,y,width:w,height:h,rx:6,fill:'color-mix(in srgb,'+col(v)+' '+Math.round(12+40*Math.min(1,Math.abs(v)))+'%,transparent)',stroke:col(v),'stroke-width':1.2},g);
      txt(svg,x+w/2,y+h/2+4*K,N(v,2),mono(9.5,'var(--ink)'),'middle'); return g; };
    const link=(x1,y1,x2,y2,w,op,c)=>el('line',{x1,y1,x2,y2,stroke:c||'var(--ink-muted)','stroke-width':w,opacity:op},svg);
    if(!narrow){
      const wy=[110,210]; [st.a,st.b].forEach((wi,i)=>{ el('rect',{x:14,y:wy[i]-16,width:78,height:32,rx:16,fill:'color-mix(in srgb,var(--s1) 22%,transparent)',stroke:cv(K16.word)},svg); txt(svg,53,wy[i]+5,NLM_V[wi],FT(700,11.5,K,'var(--ink)'),'middle'); });
      txt(svg,53,40,'2 words',FT(700,10,K,'var(--ink-muted)'),'middle'); txt(svg,149,40,'look up',FT(700,10,K,'var(--ink-muted)'),'middle'); txt(svg,257,40,'glue: 4',FT(700,10,K,'var(--ink-muted)'),'middle');
      txt(svg,370,40,'8 hidden · tanh',FT(700,10,K,'var(--ink-muted)'),'middle'); txt(svg,545,40,'softmax → next word',FT(700,10,K,'var(--ink-muted)'),'middle');
      [st.a,st.b].forEach((wi,i)=>{ const y=wy[i]-15; link(92,wy[i],108,wy[i],1.5,.6,cv(K16.word)); NLM.E[wi].forEach((v,j)=>box(110+j*40,y,38,30,v)); });
      const gy=j=>70+j*50; f.x.forEach((v,j)=>{ const src=j<2?[188,wy[0]]:[188,wy[1]]; link(src[0],src[1],232,gy(j)+15,1,.35); box(234,gy(j),46,30,v); });
      const hy=j=>58+j*32; f.h.forEach((v,j)=>{ f.x.forEach((_,i)=>link(280,gy(i)+15,338,hy(j)+12,.6+.9*Math.min(1,Math.abs(NLM.W[j][i])/2),.18+.25*Math.min(1,Math.abs(NLM.W[j][i])/2),NLM.W[j][i]>=0?cv(K16.ctx):'var(--critical)')); box(340,hy(j),56,24,v); });
      const oy=j=>56+j*26, ox=486, ow=108; const top=f.q.indexOf(Math.max(...f.q));
      f.q.forEach((q,j)=>{ f.h.forEach((_,i)=>{ if(j===top) link(396,hy(i)+12,ox-44,oy(j)+9,.7,.25,cv(K16.prob)); });
        txt(svg,ox-6,oy(j)+13,NLM_V[j],FT(j===top?800:600,10,K,j===top?cv(K16.gold):'var(--ink-2)'),'end');
        el('rect',{x:ox,y:oy(j)+2,width:ow,height:16,rx:4,fill:'var(--grid)',opacity:.5},svg);
        el('rect',{class:'qbar','data-q':q.toFixed(6),x:ox,y:oy(j)+2,width:Math.max(1,ow*q),height:16,rx:4,fill:j===top?cv(K16.gold):cv(K16.prob),opacity:.9},svg);
        txt(svg,ox+ow+4,oy(j)+14,N(q,3),mono(9,'var(--ink)')); });
    } else {
      txt(svg,12,22,'2 words → look up → glue',FT(700,10,K,'var(--ink-muted)'));
      [st.a,st.b].forEach((wi,i)=>{ const y=36+i*44; el('rect',{x:12,y,width:92,height:34,rx:17,fill:'color-mix(in srgb,var(--s1) 22%,transparent)',stroke:cv(K16.word)},svg); txt(svg,58,y+22,NLM_V[wi],FT(700,11,K,'var(--ink)'),'middle');
        link(104,y+17,122,y+17,1.5,.6,cv(K16.word)); NLM.E[wi].forEach((v,j)=>box(124+j*52,y+2,48,30,v)); });
      txt(svg,12,146,'the glued list of 4',FT(700,10,K,'var(--ink-muted)')); f.x.forEach((v,j)=>box(12+j*80,156,74,30,v));
      txt(svg,12,216,'8 hidden neurons (tanh)',FT(700,10,K,'var(--ink-muted)')); f.h.forEach((v,j)=>box(12+(j%4)*80,226+Math.floor(j/4)*38,74,30,v));
      txt(svg,12,322,'softmax → the next word',FT(700,10,K,'var(--ink-muted)'));
      const top=f.q.indexOf(Math.max(...f.q)), ox=110, ow=170;
      f.q.forEach((q,j)=>{ const y=334+j*26; txt(svg,ox-8,y+14,NLM_V[j],FT(j===top?800:600,10.5,K,j===top?cv(K16.gold):'var(--ink-2)'),'end');
        el('rect',{x:ox,y:y+2,width:ow,height:18,rx:4,fill:'var(--grid)',opacity:.5},svg); el('rect',{class:'qbar','data-q':q.toFixed(6),x:ox,y:y+2,width:Math.max(1,ow*q),height:18,rx:4,fill:j===top?cv(K16.gold):cv(K16.prob),opacity:.9},svg);
        txt(svg,ox+ow+4,y+16,N(q,3),mono(9.5,'var(--ink)')); });
    }
    const order=f.q.map((q,i)=>[q,i]).sort((a,b)=>b[0]-a[0]).slice(0,3);
    read.innerHTML=`after "<b>${NLM_V[st.a]} ${NLM_V[st.b]}</b>":<br>`+order.map(([q,i])=>`${NLM_V[i]} <b>${N(q,3)}</b>`).join(' · ')+
      (NLM_V[st.a]==='I'&&NLM_V[st.b]==='play'?'<br><span style="color:var(--ink-muted)">never saw "I play football", yet football gets '+N(f.q[NLM_V.indexOf('football')],3)+'</span>':''); }
  function drawMap(){ const m=map; m.innerHTML=''; const k=svgK(m,10), K=Math.min(k,1.5), glow=glo(m); const xs=NLM.E.map(e=>e[0]), ys=NLM.E.map(e=>e[1]);
    const X0=Math.min(...xs)-.35,X1=Math.max(...xs)+.35,Y0=Math.min(...ys)-.3,Y1=Math.max(...ys)+.3, S=Math.min(236/(X1-X0),220/(Y1-Y0)), px=x=>12+(x-X0)*S, py=y=>248-(y-Y0)*S;
    el('line',{x1:px(X0),x2:px(X1),y1:py(0),y2:py(0),stroke:'var(--axis)','stroke-width':1},m); el('line',{x1:px(0),x2:px(0),y1:py(Y0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1},m);
    txt(m,10,16,'the learned table: every word\'s 2 numbers',FT(700,9,K,'var(--ink-muted)'));
    /* R22 review: several words sit almost on one spot (chai = coffee; cricket, football and "." by the origin), so every label
       looks for a free place around its own dot, and a label that has to sit further out gets a thin leader line back to its dot */
    const P=NLM_V.map((w,i)=>({w,i,x:px(NLM.E[i][0]),y:py(NLM.E[i][1]),on:i===st.a||i===st.b}));
    P.forEach(p=>glowDot(m,p.x,p.y,p.on?5:3.6,p.on?cv(K16.gold):cv(K16.word),glow));
    const fs=9.5*K, lh=fs+2, boxes=[], hit=(b,pad)=>boxes.some(o=>b.x<o.x+o.w+pad&&b.x+b.w+pad>o.x&&b.y<o.y+o.h+pad&&b.y+b.h+pad>o.y);
    const inside=b=>b.x>=2&&b.y>=22&&b.x+b.w<=258&&b.y+b.h<=258;
    const dotHit=(b,self)=>P.some(q=>q!==self&&q.x>b.x-4&&q.x<b.x+b.w+4&&q.y>b.y-4&&q.y<b.y+b.h+4);
    const order=P.slice().sort((a,b)=>(b.on-a.on)||(a.i-b.i)), ANG=[0,180,-90,90,-35,35,-145,145,-60,60,-120,120];
    order.forEach(p=>{ const label=p.w==='.'?'“.”':p.w, t=txt(m,0,0,label,FT(p.on?800:600,9.5,K,p.on?cv(K16.gold):'var(--ink-2)'));
      let tw=0; try{ tw=t.getBBox().width; }catch(e){} if(!(tw>0)) tw=label.length*fs*.6;
      let best=null;
      for(const r of [7,16,26,38,52]){ for(const a of ANG){ const c=Math.cos(a*Math.PI/180), s=Math.sin(a*Math.PI/180);
          const ax=p.x+r*c, ay=p.y+r*s, bx=c>.3?ax:c<-.3?ax-tw:ax-tw/2, by=s>.3?ay:s<-.3?ay-lh:ay-lh/2, b={x:bx,y:by,w:tw,h:lh};
          if(inside(b)&&!hit(b,2)&&!dotHit(b,p)){ best={b,r,ax,ay}; break; } }
        if(best) break; }
      if(!best){ const b={x:Math.min(258-tw,p.x+7),y:p.y-lh/2,w:tw,h:lh}; best={b,r:7,ax:b.x,ay:p.y}; }
      boxes.push(best.b); t.setAttribute('x',best.b.x.toFixed(1)); t.setAttribute('y',(best.b.y+lh-3).toFixed(1));
      if(best.r>7){ const L=el('line',{x1:p.x,y1:p.y,x2:best.ax,y2:best.ay,stroke:p.on?cv(K16.gold):'var(--ink-muted)','stroke-width':.8,opacity:.75},m); m.insertBefore(L,m.firstChild.nextSibling); } }); }
  const pickA=w=>{ st.a=NLM_V.indexOf(w); pressChip(h1,w); drawNet(); drawMap(); }, pickB=w=>{ st.b=NLM_V.indexOf(w); pressChip(h2,w); drawNet(); drawMap(); };
  chipRow(h1,NLM_V,'',pickA); chipRow(h2,NLM_V,'c2',pickB); pressChip(h1,NLM_V[st.a]); pressChip(h2,NLM_V[st.b]);
  drawNet(); drawMap(); onTheme(()=>{ drawNet(); drawMap(); }); onResizeW(svg.parentNode,()=>{ drawNet(); drawMap(); });
  U16['w-nlm']={state(){ const f=nlmForward(st.a,st.b); return {pair:NLM_V[st.a]+' '+NLM_V[st.b],x:f.x,h:f.h,q:f.q,bars:[...svg.querySelectorAll('rect.qbar')].map(r=>({q:+r.dataset.q,w:+r.getAttribute('width')})),mapTexts:textBoxes(map)}; },
    pick(a,b){ pickA(a); pickB(b); }};
})();
