/* ================= UNIT 17 · Act II–III widgets: w-clip, w-notebook, w-lstm (the memory lab), w-gru, w-gates-compare ================= */

/* ---------- §8 · w-clip: a loss cliff, with and without the speed governor (3-D) ---------- */
(function(){
  const box=document.getElementById('cl-3d'); if(!box||!CIN) return;
  const read=document.getElementById('cl-read');
  const CL={H:3,K:14,A0:.4,eta:.35,start:[2.2,1.5],R:3.2,steps:40};
  const Lf=(a,b)=>.09*((a+1.8)**2+1.4*b*b)+CL.H*sig(CL.K*(a-CL.A0));
  const gf=(a,b)=>{ const s=sig(CL.K*(a-CL.A0)); return [.18*(a+1.8)+CL.H*CL.K*s*(1-s),.252*b]; };
  const st={clip:false,c:2,n:CL.steps};
  function run(){ let p=CL.start.slice(); const P=[{p:p.slice(),g:null,gn:0,clipped:false,L:Lf(...p)}]; let off=false;
    for(let i=0;i<CL.steps;i++){ const g=gf(...p), gn=Math.hypot(...g); const gc=st.clip?clipVec(g,st.c):g; p=[p[0]-CL.eta*gc[0],p[1]-CL.eta*gc[1]];
      P.push({p:p.slice(),g,gn,clipped:st.clip&&gn>st.c,L:Lf(...p)}); if(Math.abs(p[0])>CL.R||Math.abs(p[1])>CL.R){ off=true; break; } }
    return {P,off}; }
  const ZS=.55;
  function readout(){ const {P,off}=run(), big=P.reduce((m,s,i)=>s.gn>P[m].gn?i:m,1), last=P[P.length-1], n=Math.min(st.n,P.length-1), cur=P[n];
    read.innerHTML='Step '+n+' of '+(P.length-1)+' · loss <b>'+N(cur.L,3)+'</b>'+(n>0?' · gradient length <b class="'+(cur.gn>st.c?'r':'m')+'">'+N(cur.gn,2)+'</b>'+(cur.clipped?' → clipped to <b class="g">'+N(st.c,2)+'</b>':''):'')+
      '<br>Biggest gradient: <b class="r">'+N(P[big].gn,2)+'</b> at step '+big+', the cliff edge. '+(st.clip?'Clipped, that step is only '+N(CL.eta*Math.min(P[big].gn,st.c),2)+' long.':'Unclipped, that step is '+N(CL.eta*P[big].gn,2)+' long.')+
      '<br>'+(off?'<b class="r">Flung off the map</b> — one giant step threw the ball far past the valley, out of the region it was exploring.':'<b class="m">Reached the valley</b>: loss '+N(last.L,4)+' after '+(P.length-1)+' steps.');
    box.dataset.state=[st.clip?'on':'off',st.c,off?'off':'in',P.length-1,N(P[big].gn,3)].join(','); }
  function build(){ return CIN.stage3d(box,{camera:cam3({pos:[-4.5,5.0,8.3],look:[.2,.75,0],fov:38},{pos:[-6.2,6.4,11.2],look:[.1,.7,0],fov:40}),orbit:true,autoRotate:.08,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,isLight,colors}=ctx, hx=hxOf(ctx), c=colors, LS=PHONE()?.0155:.0095;   /* phones see the stage from further back: bigger labels */
      starfield(ctx,240,16);
      const surf=CIN.prim.surface(ctx,(x,y)=>Lf(x,y),{x:[-CL.R,CL.R],y:[-CL.R,CL.R],res:90,zscale:ZS,ramp:[c.s3,c.s7,c.s6],opacity:.9}); root.add(surf); lightenSurface(ctx,surf,ZS,[c.s3,c.s7,c.s6]);
      root.add(lab(ctx,'the cliff',M3(CL.A0-.05,-1.7,CL.H*ZS*.5+.35),{size:24,weight:700,scale:LS,color:c.ink2,bg:true,depthTest:false}));
      root.add(lab(ctx,'valley',M3(-1.8,-2.4,.7),{size:22,weight:700,scale:LS,color:c.ink2,bg:true,depthTest:false}));
      root.add(lab(ctx,'start',M3(CL.start[0],CL.start[1],Lf(...CL.start)*ZS+.45),{size:20,weight:700,scale:LS,color:c.s1,bg:true,depthTest:false}));
      const dyn=new THREE.Group(); root.add(dyn);
      const ball=CIN.prim.dot(ctx,[0,0,0],hx(K17.word),.13); const bh=haloSprite(ctx,hx(K17.word),.8); root.add(overlay(ball,12),bh);
      ctx.redraw=()=>{ clearGroup(dyn); const {P}=run(), n=Math.min(st.n,P.length-1);
        const at=s=>{ const [a,b]=s.p, cl=[Math.max(-CL.R,Math.min(CL.R,a)),Math.max(-CL.R,Math.min(CL.R,b))]; return M3(cl[0],cl[1],Lf(...cl)*ZS+.06); };
        for(let i=1;i<=n;i++){ const A=at(P[i-1]), B=at(P[i]), s=P[i], big=s.gn>1.5; const col=s.clipped?hx(K17.gate):big?critHex():hx(K17.word);
          const d=Math.hypot(B[0]-A[0],B[1]-A[1],B[2]-A[2]), mid=[(A[0]+B[0])/2,Math.max(A[1],B[1])+(big&&!s.clipped?.9:Math.min(.15,.25*d)),(A[2]+B[2])/2];   /* a small step is a low hop, not a loop */
          const arc=[]; for(let k=0;k<=12;k++){ const u=k/12, q=(1-u)*(1-u), r=2*u*(1-u), w=u*u; arc.push([q*A[0]+r*mid[0]+w*B[0],q*A[1]+r*mid[1]+w*B[1],q*A[2]+r*mid[2]+w*B[2]]); }
          dyn.add(overlay(ribbon(ctx,arc,col,big&&!s.clipped?.03:.018),11));
          dyn.add(overlay(CIN.prim.dot(ctx,B,col,.045),11)); }
        const tip=at(P[n]); ball.position.set(...tip); ball.position.y+=.07; bh.position.copy(ball.position);
        if(Math.abs(P[n].p[0])>CL.R||Math.abs(P[n].p[1])>CL.R){ dyn.add(lab(ctx,'flung off the map!',[tip[0]+(PHONE()?1.5:-.2),tip[1]+1.0,tip[2]+.4],{size:26,weight:800,scale:LS,color:cssv('critical'),bg:true})); }
        RR(ctx); };
      ctx.redraw();
    }}); }
  const S3=mountStage(box,build); flipRemount(S3);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  bindCtl('cl-c',v=>{ st.c=v; redraw(); },v=>N(v,2));
  const onB=document.getElementById('cl-on');
  onB.addEventListener('click',()=>{ st.clip=!st.clip; onB.setAttribute('aria-pressed',st.clip); onB.textContent=st.clip?'clipping on':'clipping off'; redraw(); });
  let timer=null; document.getElementById('cl-play').addEventListener('click',()=>{ clearInterval(timer); const tot=run().P.length-1; st.n=0; redraw(); if(RM){ st.n=tot; redraw(); return; }
    timer=setInterval(()=>{ st.n++; redraw(); if(st.n>=tot) clearInterval(timer); },140); });
  document.getElementById('cl-reset').addEventListener('click',()=>{ clearInterval(timer); st.clip=false; st.c=2; st.n=CL.steps; onB.setAttribute('aria-pressed','false'); onB.textContent='clipping off'; setCtl('cl-c',2,v=>N(v,2)); redraw(); });
  readout(); window.U17Clip={st,run,redraw,Lf,gf,CL};
  reg('w-clip',{state:()=>{ const R=run(); return {clip:st.clip,c:st.c,n:st.n,off:R.off,steps:R.P.length-1,P:R.P.map(q=>({p:q.p,gn:q.gn,clipped:q.clipped,L:q.L}))}; },st,run,redraw,Lf,gf,CL,rects:stageRects(S3)});
})();

/* ---------- §9 · w-notebook: the cell state as a tank with three valves ---------- */
(function(){
  const svg=document.getElementById('nb-svg'); if(!svg) return;
  const read=document.getElementById('nb-read');
  const W0={c:1,f:.9,i:.2,g:.5,o:1}, Z0={zf:2,zi:0,zo:1,zg:1};
  const st=Object.assign({ph:1,mode:'gates'},W0,Z0);          /* ph: 0 = old level shown, ½ = after the eraser, 1 = after the pen */
  const gates=()=>st.mode==='scores'?{f:sig(st.zf),i:sig(st.zi),o:sig(st.zo),g:tanh(st.zg)}:{f:st.f,i:st.i,o:st.o,g:st.g};
  let S={};
  function draw(){ svg.innerHTML=''; const G5=gates(), V=narrowSVG(svg,560,340,440,430), ph=V.n, glow=glo(svg), keep=G5.f*st.c, add=G5.i*G5.g, c=keep+add, h=G5.o*tanh(c);
    const sv={f:st.f,i:st.i,g:st.g,o:st.o}; Object.assign(st,G5);          /* draw with the gates in force */
    const TX=ph?150:180, TW=ph?120:150, TY=ph?118:70, TH=ph?220:230, y0=TY+TH/2, sc=TH/2/2.2, ly=v=>y0-v*sc;           /* tank: level 0 in the middle, ±2.2 at the rims */
    const shown=st.ph<.5?st.c+(keep-st.c)*(st.ph*2):keep+add*((st.ph-.5)*2);
    /* tank glass */
    el('rect',{x:TX,y:TY,width:TW,height:TH,rx:14,fill:'color-mix(in srgb,var(--s3) 5%,transparent)',stroke:'var(--ink-2)','stroke-width':1.6,opacity:.9},svg);
    for(let v=-2;v<=2;v++){ const y=ly(v); el('line',{x1:TX,y1:y,x2:TX+10,y2:y,stroke:'var(--ink-muted)'},svg); txt(svg,TX-6,y+4,nm(String(v)),'font:500 10px system-ui;fill:var(--ink-muted)','end').classList.add('tick'); }
    el('line',{x1:TX,y1:y0,x2:TX+TW,y2:y0,stroke:'var(--axis)','stroke-width':1.2,'stroke-dasharray':'4 3'},svg);
    const lg=el('g',glow?{filter:glow}:{},svg); const yl=ly(Math.max(-2.2,Math.min(2.2,shown)));
    el('rect',{x:TX+4,y:Math.min(yl,y0),width:TW-8,height:Math.max(1.5,Math.abs(yl-y0)),rx:8,fill:shown>=0?cv(K17.mem):cv(K17.edge),opacity:.72},lg);
    el('line',{x1:TX-4,y1:ly(st.c),x2:TX+TW+4,y2:ly(st.c),stroke:'var(--ink-2)','stroke-width':1.3,'stroke-dasharray':'2 3'},svg);
    if(!ph){ const ol=txt(svg,TX+TW+8,ly(st.c)+4,'old '+N(st.c,2),'font:600 10.5px system-ui;fill:var(--ink-2)'); ol.dataset.alt='0,-18;0,18;0,-34'; }   /* phones: the dashed line alone marks the old level (the readout has the number) */
    txt(svg,TX+TW/2,Math.max(TY+20,Math.min(TY+TH-8,yl+(shown>=0?(yl<TY+26?20:-8):18))),'c = '+N(shown,3),'font:800 13px system-ui;fill:var(--ink)','middle');
    if(!ph) txt(svg,TX+TW/2,TY-10,'cell state (the tank)','font:700 11px system-ui;fill:var(--ink-2)','middle');
    else txt(svg,TX+TW/2,TY+TH+22,'cell state','font:700 11px system-ui;fill:var(--ink-2)','middle');
    /* a valve: a disc with a gold arc for how open it is */
    const valve=(x,y,v,name,sub)=>{ const g=el('g',{},svg); el('circle',{cx:x,cy:y,r:17,fill:'var(--surface-2, var(--surface))',stroke:'var(--ink-muted)','stroke-width':1.4},g);
      const a=Math.max(.001,v)*Math.PI*2, x1=x+17*Math.sin(a), y1=y-17*Math.cos(a); const gg=el('g',glow?{filter:glow}:{},svg);
      if(v>=.999) el('circle',{cx:x,cy:y,r:17,fill:'none',stroke:cv(K17.gate),'stroke-width':5},gg); else if(v>.001) el('path',{d:`M${x},${y-17} A17,17 0 ${a>Math.PI?1:0},1 ${x1},${y1}`,fill:'none',stroke:cv(K17.gate),'stroke-width':5,'stroke-linecap':'round'},gg);
      txt(svg,x,y+4,N(v,2),'font:800 10.5px system-ui;fill:var(--ink)','middle'); if(name) txt(svg,x,y+36,name,'font:700 11px system-ui;fill:'+cv(K17.gate),'middle'); if(sub) txt(svg,x,y+(ph?56:50),sub,'font:500 10px system-ui;fill:var(--ink-muted)','middle'); };
    /* the pen: candidate cup → input valve → tank */
    const CX=ph?64:TX+TW/2, CY=ph?40:19, IX=ph?170:TX+TW+80, IY=CY;
    el('rect',{x:CX-34,y:CY-13,width:68,height:26,rx:7,fill:'color-mix(in srgb,var(--s1) 18%,transparent)',stroke:cv(K17.word)},svg); txt(svg,CX,CY+5,'g = '+N(st.g,2),'font:700 11px system-ui;fill:var(--ink)','middle');
    edge(svg,CX+34,CY,IX-20,CY,cv(K17.word),1.6,null,.8); valve(IX,IY,st.i,'','');
    txt(svg,IX+24,IY-4,ph?'input i':'input i · the pen','font:700 11px system-ui;fill:'+cv(K17.gate)); txt(svg,IX+24,IY+(ph?16:11),'writes i·g = '+N(add,3),'font:600 10.5px system-ui;fill:var(--ink-2)');
    const pour=st.ph>.5&&st.ph<1; el('path',{d:ph?`M${IX},${IY+17} L${IX},${TY+6}`:`M${IX},${IY+17} L${IX},${IY+33} L${TX+TW-20},${IY+33} L${TX+TW-20},${TY+6}`,fill:'none',stroke:pour?cv(K17.word):'var(--ink-muted)','stroke-width':pour?3:1.6,opacity:.8},svg);
    /* the eraser: the drain valve */
    const FX=ph?64:TX-78, FY=TY+TH-70;
    valve(FX,FY,st.f,'forget f','the eraser'); el('path',{d:`M${TX},${FY} L${FX+17},${FY}`,stroke:'var(--ink-muted)','stroke-width':1.6},svg);
    txt(svg,FX,FY+(ph?78:64),'keeps '+N(keep,3),'font:600 10.5px system-ui;fill:var(--ink-2)','middle');
    /* the window: output valve → note */
    const WX=ph?322:TX+TW+90, WY=TY+TH-60; el('path',{d:`M${TX+TW},${WY} L${WX-17},${WY}`,stroke:'var(--ink-muted)','stroke-width':1.6},svg); valve(WX,WY,st.o,'output o','the window');
    const NX=ph?WX+74:WX+72; edge(svg,WX+17,WY,NX-20,WY,cv(K17.mem),1.8,null,.9);
    el('rect',{x:NX-18,y:WY-50,width:36,height:100,rx:6,fill:'none',stroke:'var(--line)','stroke-dasharray':'3 3'},svg); el('line',{x1:NX-22,y1:WY,x2:NX+22,y2:WY,stroke:'var(--axis)'},svg);
    const hy=WY-h*50; const hg=el('g',glow?{filter:glow}:{},svg); el('rect',{x:NX-13,y:Math.min(hy,WY),width:26,height:Math.max(1.5,Math.abs(hy-WY)),rx:4,fill:h>=0?cv(K17.mem):cv(K17.edge)},hg);
    txt(svg,NX,WY-62,'note h','font:700 11px system-ui;fill:var(--ink-2)','middle'); const hv=txt(svg,NX,WY+70,N(h,4),'font:800 12px system-ui;fill:'+cv(K17.mem),'middle'); hv.dataset.alt='0,18;0,32';
    const d=st.mode==='scores'?4:2;
    read.innerHTML=(st.mode==='scores'?'f = σ('+N(st.zf,2)+') = '+N(G5.f,4)+' · i = σ('+N(st.zi,2)+') = '+N(G5.i,4)+' · o = σ('+N(st.zo,2)+') = '+N(G5.o,4)+' · g = tanh('+N(st.zg,2)+') = '+N(G5.g,4)+'<br>':'')+
      'c = f·c<sub>old</sub> + i·g = '+N(G5.f,d)+' · '+N(st.c,2)+' + '+N(G5.i,d)+' · '+N(G5.g,d)+' = '+N(keep,4)+' + '+N(add,4)+' = <b class="m">'+N(c,4)+'</b><br>h = o·tanh(c) = '+N(G5.o,d)+' · tanh('+N(c,4)+') = '+N(G5.o,d)+' · '+N(tanh(c),4)+' = <b class="m">'+N(h,4)+'</b>'+
      (st.mode==='gates'&&st.f===1&&st.i===0?'<br><b class="g">Hold:</b> nothing erased, nothing written — the level is exactly the old one.':'');
    svg.dataset.c=c.toFixed(6); svg.dataset.h=h.toFixed(6);
    S={mode:st.mode,cPrev:st.c,f:G5.f,i:G5.i,g:G5.g,o:G5.o,z:{f:st.zf,i:st.zi,o:st.zo,g:st.zg},c,h,ph:st.ph,level:{y0,sc,shown,yl:ly(Math.max(-2.2,Math.min(2.2,shown)))},noteBar:{WY,h,hy:WY-h*50}};
    Object.assign(st,sv); mfont(svg); declutter(svg); }
  ['c','f','i','g','o','zf','zi','zo','zg'].forEach(k=>bindCtl('nb-'+k,v=>{ st[k]=v; st.ph=1; draw(); },v=>N(v,2)));
  const setAll=o=>{ Object.assign(st,o); ['c','f','i','g','o','zf','zi','zo','zg'].forEach(k=>setCtl('nb-'+k,st[k],v=>N(v,2))); };
  const syncMode=()=>{ document.getElementById('nb-ctl-gates').style.display=st.mode==='gates'?'':'none'; document.getElementById('nb-ctl-scores').style.display=st.mode==='scores'?'':'none'; document.getElementById('nb-hold').style.display=st.mode==='gates'?'':'none';
    document.getElementById('nb-mode').querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===st.mode?'true':'false')); };
  tabs(document.getElementById('nb-mode'),t=>{ st.mode=t; st.ph=1; syncMode(); draw(); });
  let tw=null; document.getElementById('nb-play').addEventListener('click',()=>{ if(tw) tw.stop(); tw=tween(2200,u=>{ st.ph=u; draw(); },()=>{ st.ph=1; draw(); }); });
  document.getElementById('nb-hold').addEventListener('click',()=>{ setAll({f:1,i:0}); st.ph=1; draw(); });
  document.getElementById('nb-reset').addEventListener('click',()=>{ setAll(st.mode==='scores'?Object.assign({c:1},Z0):W0); st.ph=1; draw(); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17Notebook={st,draw}; reg('w-notebook',{state:()=>JSON.parse(JSON.stringify(S)),st,draw});
})();

/* ---------- §9 · w-lstm: THE MEMORY LAB — race a plain cell, a GRU and an LSTM (3-D + charts) ---------- */
(function(){
  const box=document.getElementById('lb-3d'); if(!box) return;
  const read=document.getElementById('lb-read'), svg=document.getElementById('lb-svg');
  const st={T:LAB.T,A:LAB.A,w:LAB.w,f:LAB.f,seed:7,k:LAB.T,tab:'acc'};
  const CELLS=[{id:'rnn',name:'plain cell',col:K17.alt},{id:'gru',name:'GRU',col:K17.edge},{id:'lstm',name:'LSTM',col:K17.mem}];
  let accCache={key:'',acc:null};
  const opts=()=>({w:st.w,f:st.f,A:st.A,T:st.T,trials:LAB.trials,lengths:LAB.lengths});
  function acc(){ const key=[st.w,st.f,st.A].join(); if(accCache.key!==key){ accCache={key,acc:labAccuracy(opts())}; } return accCache.acc; }
  const sentence=()=>labSentence(st.T,st.A,seeded(st.seed));
  const run=()=>labCells(sentence(),opts());
  const pct=v=>N(v*100,1)+'%';
  /* accuracy at the current length (not only at the 5-step grid) */
  function accAt(T){ const rnd=seeded(1000+T); let a={rnn:0,lstm:0,gru:0}; for(let k=0;k<LAB.trials;k++){ const R=labCells(labSentence(T,st.A,rnd),opts()); ['rnn','lstm','gru'].forEach(c=>{ if(R.ok[c]) a[c]++; }); } return {rnn:a.rnn/LAB.trials,lstm:a.lstm/LAB.trials,gru:a.gru/LAB.trials}; }
  function readout(){ const R=run(), T=st.T, A=accAt(T), done=st.k>=T, first=R.first>0?'chai':'coffee';
    read.innerHTML='<p class="lb-cap" style="margin:0 0 .35rem">This sentence: <b style="color:var(--s1)">'+first+'</b> + '+(T-1)+' filler words</p><table><thead><tr><th>cell</th><th>memory</th><th>answer</th><th>blame → word 1</th><th>right of 400</th></tr></thead><tbody>'+
      CELLS.map(C=>{ const m=R[C.id][T], ok=R.ok[C.id]; return `<tr><th style="color:${cv(C.col)}">${C.name}</th><td>${done?N(m,3):'…'}</td><td class="${done?(ok?'ok':'bad'):''}">${done?(ok?'✓ ':'✗ ')+(m>0?'chai':'coffee'):'…'}</td><td>${E(R.bl[C.id][1],2)}</td><td>${pct(A[C.id])}</td></tr>`; }).join('')+'</tbody></table>'+
      '<p class="lb-cap">At '+T+' words the plain cell passes back '+E(R.bl.rnn[1],2)+' of the blame to word 1; the LSTM\'s lane passes f'+SUP(T-1)+' = '+E(R.bl.lstm[1],2)+'.</p>';
    box.dataset.state=JSON.stringify({T,acc:{rnn:+A.rnn.toFixed(4),gru:+A.gru.toFixed(4),lstm:+A.lstm.toFixed(4)},bl:{rnn:R.bl.rnn[1],gru:R.bl.gru[1],lstm:R.bl.lstm[1]},first:R.first,ok:R.ok}); }
  let CS={};
  function chart(){ svg.innerHTML=''; const VB=narrowSVG(svg,760,284,440,350), ph=VB.n, glow=glo(svg), W=VB.W,H=VB.H,L=ph?50:56,Rr=ph?14:150,Tp=ph?68:22,B=ph?50:40, R=run();   /* B leaves a clear row for the ticks and one for the axis title, so no tick is ever hidden */
    const legend=(C,j,val)=>{ if(ph) txt(svg,8+j*146,20+(j===2?0:0),(C.id==='rnn'?'plain':C.name)+' '+val,'font:700 11px system-ui;fill:'+cv(C.col)); };
    if(st.tab==='acc'){ const D=acc(), px=T=>L+(T-5)/45*(W-L-Rr), py=v=>Tp+(1-v)/(1-.3)*(H-Tp-B);
      for(let v=.3;v<=1.001;v+=.1){ const y=py(v); el('line',{x1:L,y1:y,x2:W-Rr,y2:y,stroke:'var(--grid)'},svg); txt(svg,L-6,y+3.5,Math.round(v*100)+'%','font:500 10px system-ui;fill:var(--ink-muted)','end').classList.add('tick'); }
      const yh=py(.5); el('line',{x1:L,y1:yh,x2:W-Rr,y2:yh,stroke:'var(--ink-muted)','stroke-dasharray':'5 4'},svg);
      LAB.lengths.filter(T=>!ph||T%10===0||T===5).forEach(T=>txt(svg,px(T)+(ph&&T===5?5:0),H-B+(ph?17:15),String(T),'font:500 10px system-ui;fill:var(--ink-muted)','middle').classList.add('tick')); txt(svg,(L+W-Rr)/2,H-4,'sentence length (words)','font:600 10.5px system-ui;fill:var(--ink-muted)','middle');
      el('line',{x1:px(st.T),y1:Tp,x2:px(st.T),y2:H-B,stroke:cv(K17.gate),'stroke-width':1.4,'stroke-dasharray':'3 3'},svg);
      CS={tab:'acc',pts:{},map:{L,Tp,B,H,W,Rr}};
      CELLS.forEach((C,j)=>{ const pts=D.map(d=>[px(d.T),py(d[C.id])]); CS.pts[C.id]=D.map((d,i)=>({T:d.T,acc:d[C.id],x:pts[i][0],y:pts[i][1]})); const g=el('g',glow?{filter:glow}:{},svg);
        glowPath(g,'M'+pts.map(p=>p.map(v=>v.toFixed(1)).join(',')).join('L'),cv(C.col),2.6,false); pts.forEach(p=>el('circle',{cx:p[0],cy:p[1],r:3.2,fill:cv(C.col)},g));
        const last=D[D.length-1][C.id]; legend(C,j,pct(last)); if(!ph) txt(svg,W-Rr+10,py(last)+4+(C.id==='gru'?-8:C.id==='lstm'?8:0),C.name+' '+pct(last),'font:700 11px system-ui;fill:'+cv(C.col)); });
      txt(svg,ph?8:L,ph?42:14,ph?'right answers of 400 · top row: at 50 words':'share of 400 random sentences answered right','font:600 10.5px system-ui;fill:var(--ink-muted)');
      /* "coin toss" goes where no curve (and not the gold marker) passes: try spots along the dashed line, above and below it */
      { const lt=txt(svg,0,0,'coin toss','font:600 10px system-ui;fill:var(--ink-muted)','start'); mfont(svg); const bb=tbb(lt), lw=bb?bb.x1-bb.x0:52, lh=bb?bb.y1-bb.y0:12;
        const yAt=(P,x)=>{ for(let i=1;i<P.length;i++) if(x<=P[i].x){ const a=P[i-1], b=P[i], u=(x-a.x)/((b.x-a.x)||1); return a.y+(b.y-a.y)*Math.max(0,Math.min(1,u)); } return P[P.length-1].y; };
        let best=null; for(let x0=L+4;x0<=W-Rr-lw-4;x0+=6) for(const up of [true,false]){ const ya=up?yh-3-lh:yh+3, yb=ya+lh; let cl=1e9;
            if(Math.abs(px(st.T)-(x0+lw/2))<lw/2+4) cl=0;
            for(const id in CS.pts){ const P=CS.pts[id]; for(let x=x0-2;x<=x0+lw+2;x+=3){ const y=yAt(P,x); cl=Math.min(cl,y>=ya-2&&y<=yb+2?0:Math.min(Math.abs(y-ya),Math.abs(y-yb))); } }
            if(!best||cl>best.cl+.5) best={x0,up,cl,ya}; }
        lt.setAttribute('x',best.x0); lt.setAttribute('y',best.ya+lh*.78); CS.coin={x:best.x0,y:best.ya,w:lw,h:lh,clear:best.cl}; }
      svg.dataset.acc=JSON.stringify(D.map(d=>[d.T,d.rnn,d.gru,d.lstm])); }
    else { const T=st.T, LO=-10, px=s=>L+s/(Math.max(T-1,1))*(W-L-Rr), py=v=>{ const l=Math.max(LO,Math.min(0,Math.log10(Math.max(1e-300,v)))); return Tp+(-l)/(-LO)*(H-Tp-B); };
      for(let e=0;e>=LO;e-=2){ const y=py(10**e); el('line',{x1:L,y1:y,x2:W-Rr,y2:y,stroke:'var(--grid)'},svg); txt(svg,L-6,y+3.5,e===0?'1':'10'+SUP(e),'font:500 10px system-ui;fill:var(--ink-muted)','end').classList.add('tick'); }
      for(let s=0;s<T;s+=Math.max(1,Math.round((T-1)/(ph?5:10)))) txt(svg,px(s),H-B+15,String(s),'font:500 10px system-ui;fill:var(--ink-muted)','middle').classList.add('tick');
      txt(svg,(L+W-Rr)/2,H-4,'steps back from the end','font:600 10.5px system-ui;fill:var(--ink-muted)','middle');
      CS={tab:'blame',bl:{rnn:R.bl.rnn.slice(),gru:R.bl.gru.slice(),lstm:R.bl.lstm.slice()},T};
      CELLS.forEach((C,j)=>{ const bl=R.bl[C.id]; const pts=[]; for(let t=T;t>=1;t--) pts.push([px(T-t),py(bl[t])]); const g=el('g',glow?{filter:glow}:{},svg);
        glowPath(g,'M'+pts.map(p=>p.map(v=>v.toFixed(1)).join(',')).join('L'),cv(C.col),2.6,false);
        const v1=bl[1]; legend(C,j,E(v1,2)); if(!ph){ const t=txt(svg,W-Rr+10,py(v1)+4,C.name+' '+E(v1,2),'font:700 11px system-ui;fill:'+cv(C.col)); t.dataset.alt='0,14;0,-14;0,28;0,-28'; } });
      txt(svg,ph?8:L,ph?42:14,ph?'blame reaching each word (log scale)':'how much blame from the end reaches each earlier word (log scale)','font:600 10.5px system-ui;fill:var(--ink-muted)'); }
    mfont(svg); declutter(svg); }
  /* ---- the 3-D race: three lanes along time ---- */
  const LX=4.1, LANE={rnn:[3.25,-.7],gru:[1.95,0],lstm:[.65,.7]}, HS=.52;       /* each lane: [height of its middle line, depth] */
  function build(){ if(!CIN) return null; return CIN.stage3d(box,{camera:cam3({pos:[-2.4,3.3,9.6],look:[.35,1.85,0],fov:38},{pos:[3.2,3.6,11.8],look:[0,1.95,0],fov:46}),orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,isLight,colors}=ctx, hx=hxOf(ctx), dark=!isLight;
      starfield(ctx,260,18); glassFloor(ctx,12,{div:40,y:-.05});
      const stat=new THREE.Group(), dyn=new THREE.Group(); root.add(stat,dyn);
      CELLS.forEach(C=>{ const [y,z]=LANE[C.id], col=hx(C.col);
        const rail=liveTube(ctx,col,.01,.4); aimTube(THREE,rail,[-LX-.2,y,z],[LX+.2,y,z]); stat.add(rail);
        const pane=CIN.prim.glass(ctx,2*LX+.6,2*HS+.2,col,isLight?.07:.06); pane.position.set(0,y,z); stat.add(pane);
        const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2*LX+.6,2*HS+.2)),new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.35})); edge.position.set(0,y,z); stat.add(edge);
        stat.add(lab(ctx,C.name,PHONE()?[-LX+.9,y+HS+.32,z]:[-LX-1,y,z],{size:28,weight:800,scale:PHONE()?.0135:.0095,color:colors[C.col],bg:true})); });
      stat.add(lab(ctx,'time →',[LX-.4,-.02,1.4],{size:22,scale:.0095,color:colors.muted,bg:false}));
      ctx.redraw=()=>{ clearGroup(dyn); const R=run(), T=st.T, k=Math.min(st.k,T), xs=t=>-LX+(t-1)/Math.max(1,T-1)*2*LX, dx=2*LX/Math.max(1,T-1);
        const first=R.first>0?'chai':'coffee';
        CELLS.forEach(C=>{ const [y,z]=LANE[C.id], col=hx(C.col), vals=R[C.id], sc=C.id==='lstm'?1.25:1;
          const pts=[]; for(let t=1;t<=k;t++) pts.push([xs(t),y+Math.max(-1.05,Math.min(1.05,vals[t]*sc))*HS,z]);
          if(pts.length>1) dyn.add(polyTube(ctx,pts,col,.024,false));
          pts.forEach((p,i)=>{ const d=CIN.prim.dot(ctx,p,col,i===0?.08:.038); dyn.add(d); });
          /* the blame sleeve: a red glow around the lane, as thick as the blame from the end that reaches each word (log scale) */
          if(k>=T){ for(let t=1;t<T;t++){ const b=R.bl[C.id][t], w=Math.pow(Math.max(0,b),.4); if(w<=.02) continue;
              const m=liveTube(ctx,critHex(),.02+.16*w,(dark?.28:.22)); m.material.depthWrite=false; aimTube(THREE,m,[xs(t),y,z],[xs(t)+dx*.94,y,z]); dyn.add(m); } }
          /* gate rings: input gate (LSTM) and update gate (GRU) */
          if(C.id!=='rnn'){ const G=C.id==='lstm'?R.iG:R.zG; for(let t=1;t<=k;t++){ const o=G[t]; const r=new THREE.Mesh(new THREE.TorusGeometry(.2,.016,8,32),new THREE.MeshStandardMaterial({color:hx(K17.gate),emissive:hx(K17.gate),emissiveIntensity:(dark?.3:.1)+(dark?2:.6)*o,transparent:true,opacity:.2+.8*o}));
              r.position.set(xs(t),y,z); r.rotation.y=Math.PI/2; dyn.add(r); } }
          if(k>=T){ const ok=R.ok[C.id], m=vals[T]; dyn.add(lab(ctx,(ok?'✓ ':'✗ ')+(m>0?'chai':'coffee'),PHONE()?[LX-.7,y+HS+.32,z]:[LX+.95,y,z],{size:28,weight:800,scale:PHONE()?.0135:.0095,color:ok?colors.s3:cssv('critical'),bg:true})); } });
        dyn.add(lab(ctx,'first word: '+first,PHONE()?[0,LANE.rnn[0]+HS+1.05,LANE.rnn[1]]:[xs(1)+.4,LANE.rnn[0]+HS+.45,LANE.rnn[1]],{size:26,weight:800,scale:PHONE()?.0135:.0095,color:colors.s1,bg:true}));
        if(k>=1&&k<T) dyn.add(lab(ctx,'word '+k,[xs(k),LANE.rnn[0]+HS+.45,LANE.rnn[1]],{size:22,scale:.0095,color:colors.muted,bg:false}));
        RR(ctx); };
      ctx.redraw();
      const h=hud(box); h.innerHTML=PHONE()?'up = chai · gold = gates · red = blame':'up = chai, down = coffee · gold rings = gates opening · red glow = blame reaching back to each word';
    }}); }
  const S3=CIN?mountStage(box,build):null; flipRemount(S3);
  const redraw=()=>{ readout(); chart(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  bindCtl('lb-T',v=>{ st.T=v; st.k=v; redraw(); },v=>String(v));
  bindCtl('lb-A',v=>{ st.A=v; redraw(); },v=>N(v,2));
  bindCtl('lb-w',v=>{ st.w=v; redraw(); },v=>N(v,2));
  bindCtl('lb-f',v=>{ st.f=v; redraw(); },v=>N(v,3));
  tabs(document.getElementById('lb-tabs'),t=>{ st.tab=t; chart(); });
  let timer=null; document.getElementById('lb-run').addEventListener('click',()=>{ clearInterval(timer); st.k=1; redraw(); if(RM){ st.k=st.T; redraw(); return; }
    timer=setInterval(()=>{ st.k++; redraw(); if(st.k>=st.T) clearInterval(timer); },Math.max(45,2600/st.T)); });
  document.getElementById('lb-new').addEventListener('click',()=>{ clearInterval(timer); st.seed++; st.k=st.T; redraw(); });
  document.getElementById('lb-honest').addEventListener('click',()=>{ st.f=.9; setCtl('lb-f',.9,v=>N(v,3)); redraw(); });
  document.getElementById('lb-reset').addEventListener('click',()=>{ clearInterval(timer); Object.assign(st,{T:LAB.T,A:LAB.A,w:LAB.w,f:LAB.f,seed:7,k:LAB.T}); setCtl('lb-T',st.T,v=>String(v)); setCtl('lb-A',st.A,v=>N(v,2)); setCtl('lb-w',st.w,v=>N(v,2)); setCtl('lb-f',st.f,v=>N(v,3)); redraw(); });
  readout(); chart(); new MutationObserver(chart).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(chart);
  window.U17Lab={st,run,acc,accAt,redraw};
  reg('w-lstm',{state:()=>JSON.parse(JSON.stringify(Object.assign({T:st.T,A:st.A,w:st.w,f:st.f,seed:st.seed,k:st.k,tab:st.tab,accNow:accAt(st.T)},{chart:CS}))),st,run,acc,accAt,redraw,rects:stageRects(S3)});
})();

/* ---------- §10 · w-gru: the blend dial ---------- */
(function(){
  const svg=document.getElementById('gr-svg'); if(!svg) return;
  const read=document.getElementById('gr-read');
  const H0=[.8,-.2], A=[-.5,.4], C=[Math.atanh(-.4)-(-.5*.8),Math.atanh(.6)-(.4*-.2)];   /* candidate h̃(r) = tanh(A ⊙ (r·h) + c); at r = 1 it is (−0.4, 0.6) */
  const st={z:.25,r:1,trail:null};
  const cand=(h,r)=>[tanh(A[0]*r*h[0]+C[0]),tanh(A[1]*r*h[1]+C[1])];
  const blend=(h,hc,z)=>[(1-z)*h[0]+z*hc[0],(1-z)*h[1]+z*hc[1]];
  function draw(){ svg.innerHTML=''; narrowSVG(svg,560,360,440,400); const p=plane(svg,-1.25,1.25,-1.1,1.1,{pad:20,step:.5,noticks:true}), glow=p.glow;
    [-1,-.5,.5,1].forEach(v=>{ txt(svg,p.px(v),p.py(0)+14,nm(String(v)),'font:500 10px system-ui;fill:var(--ink-muted)','middle').classList.add('tick'); txt(svg,p.px(0)-6,p.py(v)+3.5,nm(String(v)),'font:500 10px system-ui;fill:var(--ink-muted)','end').classList.add('tick'); });
    el('rect',{x:p.px(-1),y:p.py(1),width:p.px(1)-p.px(-1),height:p.py(-1)-p.py(1),fill:'none',stroke:'var(--ink-muted)','stroke-dasharray':'3 4',opacity:.6},svg);
    const hc=cand(H0,st.r), hn=blend(H0,hc,st.z);
    el('line',{x1:p.px(H0[0]),y1:p.py(H0[1]),x2:p.px(hc[0]),y2:p.py(hc[1]),stroke:'var(--ink-2)','stroke-width':1.4,'stroke-dasharray':'5 4'},svg);
    if(st.trail){ let d=''; st.trail.forEach((q,i)=>{ d+=(i?'L':'M')+p.px(q[0]).toFixed(1)+','+p.py(q[1]).toFixed(1); }); el('path',{d,fill:'none',stroke:cv(K17.gate),'stroke-width':1.6,opacity:.8},svg); st.trail.forEach(q=>glowDot(svg,p.px(q[0]),p.py(q[1]),3,cv(K17.gate),null)); }
    /* the dial first, so every arrow label steps aside from it */
    const DX=svg.viewBox.baseVal.width-(PHONE()?76:62), DY=PHONE()?50:60, Rd=PHONE()?28:34;   /* phones: "old" and "new" sit beside the dial (with room for "new" before the edge), "z = …" under it */ el('circle',{cx:DX,cy:DY,r:Rd,fill:'var(--surface-2, var(--surface))',stroke:'var(--line)'},svg);
    const a=Math.PI*(.75+1.5*st.z), a0=Math.PI*.75, pa=(ang,r)=>[DX+r*Math.cos(ang),DY+r*Math.sin(ang)];
    const [sx,sy]=pa(a0,Rd-5),[ex,ey]=pa(a,Rd-5); const dg=el('g',glow?{filter:glow}:{},svg);
    if(st.z>.001) el('path',{d:`M${sx},${sy} A${Rd-5},${Rd-5} 0 ${1.5*st.z>1?1:0},1 ${ex},${ey}`,fill:'none',stroke:cv(K17.gate),'stroke-width':6,'stroke-linecap':'round'},dg);
    const [nx,ny]=pa(a,Rd-14); el('line',{x1:DX,y1:DY,x2:nx,y2:ny,stroke:'var(--ink)','stroke-width':2.4,'stroke-linecap':'round'},svg);
    if(PHONE()){ txt(svg,DX,DY+Rd+15,'z = '+N(st.z,2),'font:800 12px system-ui;fill:'+cv(K17.gate),'middle'); txt(svg,DX-Rd-3,DY+4,'old','font:600 9.5px system-ui;fill:var(--ink-muted)','end'); txt(svg,DX+Rd+3,DY+4,'new','font:600 9.5px system-ui;fill:var(--ink-muted)'); }
    else { txt(svg,DX,DY+Rd+16,'z = '+N(st.z,2),'font:800 12px system-ui;fill:'+cv(K17.gate),'middle'); txt(svg,DX-Rd-2,DY+Rd+2,'old','font:600 9.5px system-ui;fill:var(--ink-muted)','end'); txt(svg,DX+Rd+2,DY+Rd+2,'new','font:600 9.5px system-ui;fill:var(--ink-muted)'); }
    const tipLab=(v,t,style,tag)=>{ const X=p.px(v[0]),Y=p.py(v[1]),L=Math.hypot(X-p.px(0),Y-p.py(0))||1,ux=(X-p.px(0))/L,uy=(Y-p.py(0))/L;
      const e=txt(svg,X+ux*12,Y+uy*12+4,t,style,ux>=0?'start':'end'); e.dataset.role=tag; e.dataset.alt=[[0,18],[0,-18],[ux>=0?-40:40,22],[ux>=0?-40:40,-22]].map(q=>q.join(',')).join(';'); return e; };
    const ah=arrow(p,0,0,H0[0],H0[1],cv(K17.mem),2.8); ah.dataset.role='old'; const ac=arrow(p,0,0,hc[0],hc[1],cv(K17.word),2.8); ac.dataset.role='cand'; const an=arrow(p,0,0,hn[0],hn[1],cv(K17.gate),3.2); an.dataset.role='new';
    tipLab(H0,'old note h','font:700 12px system-ui;fill:'+cv(K17.mem),'lab-old'); tipLab(hc,'candidate h̃','font:700 12px system-ui;fill:'+cv(K17.word),'lab-cand');
    tipLab(hn,'new note','font:800 12px system-ui;fill:'+cv(K17.gate),'lab-new');
    const gd=glowDot(svg,p.px(hn[0]),p.py(hn[1]),5,cv(K17.gate),glow); gd.dataset.role='newdot';
    read.innerHTML='h̃ = '+vecN(hc,3)+(st.r<1?' (reset r = '+N(st.r,2)+': the candidate looks at only '+N(st.r*100,0)+'% of the old note)':'')+
      '<br>new = (1 − z)·h + z·h̃ = '+N(1-st.z,2)+' · '+vecN(H0,2)+' + '+N(st.z,2)+' · '+vecN(hc,3)+' = <b class="g">'+vecN(hn,4)+'</b>'+
      '<br>first entry: '+N(1-st.z,2)+' · 0.8 + '+N(st.z,2)+' · '+N(hc[0],3)+' = <b>'+N(hn[0],4)+'</b>'+(st.trail?'<br>after '+(st.trail.length-1)+' steps: '+vecN(st.trail[st.trail.length-1],3):'');
    svg.dataset.h=hn.map(v=>v.toFixed(6)).join(','); mfont(svg); declutter(svg);
    const seg=v=>[p.px(0),p.py(0),p.px(v[0]),p.py(v[1]),2]; hideTicksOn(svg,[seg(H0),seg(hc),seg(hn),[p.px(hn[0]),p.py(hn[1]),p.px(hn[0]),p.py(hn[1]),6],...(st.trail||[]).map(q=>[p.px(q[0]),p.py(q[1]),p.px(q[0]),p.py(q[1]),4])]);
    S={z:st.z,r:st.r,old:H0.slice(),cand:hc.slice(),hn:hn.slice(),trail:st.trail?st.trail.map(q=>q.slice()):null,map:{ox:p.px(0),oy:p.py(0),sx:p.px(1)-p.px(0),sy:p.py(1)-p.py(0)}}; }
  let S={};
  bindCtl('gr-z',v=>{ st.z=v; st.trail=null; draw(); },v=>N(v,2)); bindCtl('gr-r',v=>{ st.r=v; st.trail=null; draw(); },v=>N(v,2));
  let tw=null; document.getElementById('gr-play').addEventListener('click',()=>{ if(tw) tw.stop(); if(st.z>.3){ st.z=.1; setCtl('gr-z',.1,v=>N(v,2)); }
    const tr=[H0.slice()]; for(let i=0;i<10;i++){ const h=tr[tr.length-1]; tr.push(blend(h,cand(h,st.r),st.z)); }
    tw=tween(2400,u=>{ st.trail=tr.slice(0,1+Math.round(u*10)); draw(); },()=>{ st.trail=tr; draw(); }); });
  document.getElementById('gr-reset').addEventListener('click',()=>{ st.z=.25; st.r=1; st.trail=null; setCtl('gr-z',.25,v=>N(v,2)); setCtl('gr-r',1,v=>N(v,2)); draw(); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17GRU={st,draw,cand,blend}; reg('w-gru',{state:()=>JSON.parse(JSON.stringify(S)),st,draw,cand,blend});
})();

/* ---------- §10 · w-gates-compare: three cells side by side ---------- */
(function(){
  const svg=document.getElementById('gc-svg'); if(!svg) return;
  const read=document.getElementById('gc-read');
  const CELL=[{id:'rnn',name:'plain cell',blocks:['h · tanh'],k:1,eq:'h = tanh(W h + U x + b)'},
    {id:'gru',name:'GRU',blocks:['z · σ','r · σ','h̃ · tanh'],k:3,eq:'z, r = σ(…) · h̃ = tanh(W(r ⊙ h) + U x + b) · h = (1 − z) ⊙ h + z ⊙ h̃'},
    {id:'lstm',name:'LSTM',blocks:['f · σ','i · σ','o · σ','g · tanh'],k:4,eq:'f, i, o = σ(…) · g = tanh(…) · c = f ⊙ c + i ⊙ g · h = o ⊙ tanh(c)'}];
  const st={h:128,d:64,sel:null};
  const fmtI=v=>String(v).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  function draw(){ svg.innerHTML=''; const VB=narrowSVG(svg,760,300,440,590), ph=VB.n, glow=glo(svg), P=PARAMS(st.h,st.d), max=P.lstm;
    CELL.forEach((C,j)=>{ const x0=4, sel=st.sel===C.id; const g=el('g',{style:'cursor:pointer','data-cell':C.id,transform:ph?`translate(${[0,220,110][j]},${[0,0,296][j]})`:`translate(${26+j*250},0)`},svg);
      el('rect',{x:x0,y:14,width:220,height:272,rx:14,fill:sel?'color-mix(in srgb,var(--s4) 8%,transparent)':'none',stroke:sel?cv(K17.gate):'var(--line)','stroke-width':sel?2:1},g);
      txt(g,x0+110,38,C.name,'font:800 13px system-ui;fill:var(--ink)','middle');
      C.blocks.forEach((b,i)=>{ const bw=44, gap=6, tot=C.k*bw+(C.k-1)*gap, bx=x0+110-tot/2+i*(bw+gap); const bg=el('g',glow?{filter:glow}:{},g);
        el('rect',{x:bx,y:60,width:bw,height:78,rx:8,fill:'color-mix(in srgb,var(--s4) 22%,transparent)',stroke:cv(K17.gate),'stroke-width':1.5},bg);
        txt(g,bx+bw/2,104,ph?b.split(' · ')[0]:b,'font:700 10.5px system-ui;fill:var(--ink)','middle'); });
      txt(g,x0+110,160,ph?C.k+' block'+(C.k>1?'s':''):C.k+' block'+(C.k>1?'s':'')+' × h(h + d) + h','font:600 11px system-ui;fill:var(--ink-2)','middle');
      const v=P[C.id], bw=Math.max(4,190*v/max); const bg=el('g',glow?{filter:glow}:{},g);
      el('rect',{x:x0+15,y:180,width:190,height:22,rx:6,fill:'none',stroke:'var(--line)'},g); el('rect',{x:x0+15,y:180,width:bw,height:22,rx:6,fill:cv(K17.gate),opacity:.85,'data-bar':C.id},bg);
      txt(g,x0+110,232,fmtI(v),'font:800 17px system-ui;fill:'+cv(K17.gate),'middle'); txt(g,x0+110,252,'numbers to learn','font:500 10.5px system-ui;fill:var(--ink-muted)','middle');
      g.addEventListener('click',()=>{ st.sel=st.sel===C.id?null:C.id; draw(); }); });
    const one=P.one;
    read.innerHTML='one block = h(h + d) + h = '+st.h+' · '+(st.h+st.d)+' + '+st.h+' = <b class="g">'+fmtI(one)+'</b><br>plain <b>'+fmtI(P.rnn)+'</b> · GRU <b>'+fmtI(P.gru)+'</b> · LSTM <b>'+fmtI(P.lstm)+'</b>'+
      (st.sel?'<br><b>'+CELL.find(c=>c.id===st.sel).name+':</b> '+CELL.find(c=>c.id===st.sel).eq:'');
    svg.dataset.p=[P.rnn,P.gru,P.lstm].join(','); mfont(svg); declutter(svg);
    S={h:st.h,d:st.d,sel:st.sel,counts:{rnn:P.rnn,gru:P.gru,lstm:P.lstm,one:P.one},bars:[...svg.querySelectorAll('rect[data-bar]')].map(r=>({cell:r.dataset.bar,w:+r.getAttribute('width')})),full:190}; }
  let S={};
  bindCtl('gc-h',v=>{ st.h=v; draw(); },v=>String(v)); bindCtl('gc-d',v=>{ st.d=v; draw(); },v=>String(v));
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17Gates={st,draw}; reg('w-gates-compare',{state:()=>JSON.parse(JSON.stringify(S)),st,draw});
})();
