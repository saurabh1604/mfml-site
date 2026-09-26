/* ================= UNIT 18 · widgets for §8–§11: w-layernorm, w-block, w-mask, w-cost, w-tiny ================= */

/* ---------- §8 · w-layernorm: centre, then shrink to spread 1 ---------- */
(function(){
  const svg=document.getElementById('ln-svg'); if(!svg) return;
  const read=document.getElementById('ln-read');
  const st={x:[1,2,3,6],g:1,b:0};
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 640':'0 0 760 290');
    const glow=glo(svg), F=fz(svg,11.5), Fs=fz(svg,10);
    const x=st.x, m=x.reduce((a,c)=>a+c,0)/4, v=x.reduce((a,c)=>a+(c-m)**2,0)/4, sd=Math.sqrt(v), c=x.map(t=>t-m), y=layerNorm(x,st.g,st.b);
    const PAN=narrow?[[40,40],[40,250],[40,460]].map(([a,b])=>({x:a,y:b,w:340,h:150})):[[36,44],[292,44],[548,44]].map(([a,b])=>({x:a,y:b,w:196,h:200}));
    const specs=[{t:'input x',v:x,Y:[-6,10],col:K18.tok,line:m,lab:'mean '+N(m,3)},{t:'centred: x − mean',v:c,Y:[-8,8],col:'s7',line:0,lab:'mean 0'},{t:'÷ spread, then ×γ + β',v:y,Y:[-3,3],col:K18.v,line:null}];
    specs.forEach((S,k)=>{ const P=PAN[k], pn=panel(svg,P.x,P.y,P.w,P.h,0,4,S.Y[0],S.Y[1],{ys:k===2?1:2,xt:false,title:S.t}); const bw=P.w/4;
      S.v.forEach((val,i)=>{ const x0=P.x+i*bw+bw*.2, y0=pn.py(0), y1=pn.py(Math.max(S.Y[0],Math.min(S.Y[1],val)));
        el('rect',{x:x0,y:Math.min(y0,y1),width:bw*.6,height:Math.max(1.5,Math.abs(y1-y0)),rx:3,fill:cv(S.col),opacity:.9,filter:glow&&k===2?glow:'none'},svg);
        txt(svg,x0+bw*.3,(val>=0?Math.min(y0,y1)-5:Math.max(y0,y1)+F),N(val,3),`font:700 ${Fs}px system-ui;fill:var(--ink)`,'middle'); });
      if(S.line!=null){ el('line',{x1:P.x,y1:pn.py(S.line),x2:P.x+P.w,y2:pn.py(S.line),stroke:cv(K18.w),'stroke-width':1.6,'stroke-dasharray':'6 4'},svg); txt(svg,P.x+P.w-4,pn.py(S.line)-5,S.lab,`font:700 ${Fs}px system-ui;fill:var(--s4)`,'end'); }
      if(k===2) [1,-1].forEach(u=>el('line',{x1:P.x,y1:pn.py(u*st.g+st.b),x2:P.x+P.w,y2:pn.py(u*st.g+st.b),stroke:cv(K18.v),'stroke-width':1,'stroke-dasharray':'3 4',opacity:.7},svg));
      if(k<2) edge(svg,narrow?210:P.x+P.w+8,narrow?P.y+P.h+26:P.y+P.h/2,narrow?210:P.x+P.w+48,narrow?P.y+P.h+50:P.y+P.h/2,'var(--ink-muted)',1.6,null); });
    read.innerHTML='mean <b>'+N(m,3)+'</b> · variance <b>'+N(v,3)+'</b> · spread √'+N(v,3)+' = <b>'+N(sd,3)+'</b><br>result <b>'+vecN(y,3)+'</b>'+(sd<1e-9?' (all equal: nothing to scale)':'');
    svg.dataset.state=[x.join(' '),st.g,st.b,y.map(t=>t.toFixed(3)).join(' ')].join('|'); }
  [1,2,3,4].forEach(i=>bindCtl('ln-x'+i,v=>{ st.x[i-1]=v; draw(); },v=>N(v,1)));
  bindCtl('ln-g',v=>{ st.g=v; draw(); },v=>N(v,1)); bindCtl('ln-b',v=>{ st.b=v; draw(); },v=>N(v,1));
  relayout(svg,draw);
  window.U18LN={st,draw};
})();

/* ---------- §8 · w-block: one word's ride through one block (3-D) ---------- */
const BLOCK=(function(){
  const x=[1,0,1,2], a=[0,2,2,4], s2=x.map((v,i)=>v+a[i]), s3=layerNorm(s2);
  const relu=v=>Math.max(0,v), pos=s3.map(relu), neg=s3.map(v=>relu(-v)), f=[0,1,2,3].map(i=>.5*(pos[i]+(i>0?neg[i-1]:0))), s5=s3.map((v,i)=>v+f[i]), s6=layerNorm(s5);
  return {S:[{n:'input word x',v:x,k:'tok'},{n:'attention hands back',v:a,k:'v'},{n:'add: x + attention',v:s2,k:'tok'},{n:'layer norm',v:s3,k:'tok'},{n:'small network adds',v:f,k:'v'},{n:'add',v:s5,k:'tok'},{n:'layer norm → out',v:s6,k:'tok'}]};
})();
(function(){
  const box=document.getElementById('bk-3d'); if(!box||!CIN) return;
  const read=document.getElementById('bk-read'), tbl=document.getElementById('bk-params');
  const S=BLOCK.S, H=.95, st={lv:6,d:512};
  function readout(){ read.innerHTML=S.map((s,i)=>`<span style="opacity:${i<=Math.ceil(st.lv-1e-9)?1:.35}">${i===Math.round(st.lv)?'▶ ':''}${s.n}: <b style="color:${cv(K18[s.k])}">${vecN(s.v,3)}</b></span>`).join('<br>');
    box.dataset.state=Math.round(st.lv)+'|'+vecN(S[Math.round(st.lv)].v,3);
    const d=st.d, ff=4*d, rows=[['attention 4d²',4*d*d],['feed-forward 2·d·4d',2*d*ff],['weights only',4*d*d+2*d*ff],['+ biases (4d + 4d + d)',4*d*d+2*d*ff+4*d+ff+d],['+ two layer norms (4d)',4*d*d+2*d*ff+4*d+ff+d+4*d]];
    kv(tbl,rows.map(([k,v])=>[k+(k.startsWith('attention')?' · d = '+d:''),grp(v)])); }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[7.8,6.0,8.8],look:[0,3.1,0],fov:40},orbit:true,autoRotate:.08,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx), dark=!isLight, LS=box.clientWidth<560?.0135:.0092;
      starfield(ctx,260,16); glassFloor(ctx,7,{div:28});
      const floors=S.map((s,i)=>{ const g=new THREE.Group(); g.position.y=i*H; root.add(g);
        const slab=CIN.prim.glass(ctx,2.6,1.3,hx(i===1||i===4?'s3':i===3||i===6?'s6':'s1'),dark?.08:.16); slab.rotation.x=-Math.PI/2; g.add(slab);
        const fr=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.6,1.3)),new THREE.LineBasicMaterial({color:hx('ink2'),transparent:true,opacity:.3})); fr.rotation.x=-Math.PI/2; g.add(fr);
        g.add(lab(ctx,s.n,[-2.35,.08,0],{size:19,scale:LS,color:i===1||i===4?colors.s3:colors.ink2,bg:!dark})); return g; });
      /* the residual lane: a copy jumps past attention (0 → 2) and past the small network (3 → 5) */
      const LX=1.75, lane=[[0,2],[3,5]].map(([a,b])=>{ const pts=[[.95,a*H+.05,0],[LX,a*H+.35,0],[LX,b*H-.35,0],[.95,b*H+.05,0]]; const g=polyTube(ctx,pts,hx(K18.w),.018,false); root.add(g); return {a,b,pts}; });
      root.add(lab(ctx,'residual lane',[LX+.25,1.2*H,0],{size:19,scale:LS,color:colors.s4,bg:!dark}));
      /* the travelling vector: 4 bars */
      const bars=[0,1,2,3].map(i=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(.22,1,.22),new THREE.MeshStandardMaterial({color:hx('s1'),emissive:hx('s1'),emissiveIntensity:dark?.6:.2,roughness:.3})); root.add(m); return m; });
      const ghost=[0,1,2,3].map(()=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(.1,1,.1),new THREE.MeshStandardMaterial({color:hx(K18.w),emissive:hx(K18.w),emissiveIntensity:dark?.8:.25,transparent:true,opacity:.85})); root.add(m); return m; });
      const vals=slot(ctx,root);
      const hudEl=hud(box); hint(box,'drag to orbit');
      const HS=.2;   /* bar height per unit */
      ctx.redraw=()=>{ const lv=st.lv, i0=Math.floor(Math.min(5.999,lv)), u=easeIO(lv-i0), A=S[i0].v, B=S[Math.min(6,i0+1)].v, y=lv*H;
        const v=A.map((a,k)=>a+(B[k]-a)*u), kk=S[Math.round(lv)].k;
        bars.forEach((m,k)=>{ const h=Math.max(.01,Math.abs(v[k])*HS*2.2); m.scale.y=h; m.position.set(-.6+k*.4,y+.02+(v[k]>=0?h/2:-h/2),0); const col=hx(K18[kk]); m.material.color.setHex(col); m.material.emissive.setHex(col); });
        vals.set(vecN(v.map(t=>Math.round(t*1000)/1000),2),[0,y+1.35,0],{size:20,scale:LS*1.03,color:colors.ink,bg:true});
        /* the copy on the lane */
        let gl=null; lane.forEach(L=>{ if(lv>L.a+.02&&lv<L.b-.02) gl={L,t:(lv-L.a)/(L.b-L.a)}; });
        ghost.forEach((m,k)=>{ if(!gl){ m.visible=false; return; } m.visible=true; const P=gl.L.pts, seg=Math.min(2.999,gl.t*3), j=Math.floor(seg), f=seg-j, p=P[j].map((c,q)=>c+(P[j+1][q]-c)*f), val=S[gl.L.a].v[k], h=Math.max(.01,Math.abs(val)*HS*1.4);
          m.scale.y=h; m.position.set(p[0]+(k-1.5)*.12,p[1]+(val>=0?h/2:-h/2),p[2]); });
        floors.forEach((g,i)=>{ const on=Math.abs(i-lv)<.5; g.children[0].material.opacity=(dark?.08:.16)*(on?2.6:1); });
        hudEl.innerHTML='station '+(Math.round(lv)+1)+' of 7 · <b>'+S[Math.round(lv)].n+'</b>';
        RR(ctx); };
      ctx.redraw();
    }}); }
  S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  let tw=null; const stop=()=>{ if(tw){ tw.stop(); tw=null; } };
  document.getElementById('bk-play').addEventListener('click',()=>{ stop(); st.lv=0; tgt=6; redraw(); tw=tween(6200,u=>{ st.lv=u*6; redraw(); },()=>{ st.lv=6; redraw(); }); });
  let tgt=6; document.getElementById('bk-step').addEventListener('click',()=>{ stop(); tgt=tgt>=6?0:tgt+1; const from=st.lv, to=tgt; if(to===0){ st.lv=0; redraw(); return; } tw=tween(700,u=>{ st.lv=from+(to-from)*u; redraw(); },()=>{ st.lv=to; redraw(); }); });
  document.getElementById('bk-reset').addEventListener('click',()=>{ stop(); st.lv=0; tgt=0; redraw(); });
  tabs(document.getElementById('bk-d'),t=>{ st.d=+t; readout(); });
  readout();
  window.U18Block={st,redraw,S};
})();

/* ---------- §9 · w-mask: no peeking ---------- */
(function(){
  const svg=document.getElementById('mk-svg'); if(!svg) return;
  const read=document.getElementById('mk-read');
  const HQ=['main','chai','peeta','hoon'], EK=['I','drink','chai'];
  const CQ=[[3,0,0],[0,0,3],[0,3,0],[1.5,1.5,0]], CK=[[1,0,0],[0,1,0],[0,0,1]];
  const st={mode:'enc',rows:9};
  function calc(){ if(st.mode==='cross'){ const r=attend(CQ,CK,CK); return {rowsL:HQ,colsL:EK,...r}; }
    const r=attend(EX.Q,EX.K,EX.V,{causal:st.mode==='dec'}); return {rowsL:['word 1','word 2','word 3'],colsL:['1','2','3'],...r}; }
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); const r=calc(), nr=r.S.length, nc=r.S[0].length;
    svg.setAttribute('viewBox',narrow?`0 0 400 ${st.mode==='cross'?780:640}`:`0 0 760 ${st.mode==='cross'?310:260}`);
    const glow=glo(svg), F=fz(svg,11.5), Fs=fz(svg,10), hatch=hatchPat(svg,'mk-h','var(--ink-muted)',.45);
    const cs=narrow?Math.min(64,280/nc):Math.min(58,200/nc), chh=narrow?40:Math.min(46,230/nr);
    const grid=(x0,y0,M,title,fmtr,kind,labels)=>{ txt(svg,x0,y0-30,title,`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
      r.colsL.forEach((c,j)=>{ if(kind!=='out') txt(svg,x0+j*cs+cs/2,y0-8,c,`font:700 ${Fs}px system-ui;fill:var(--s1)`,'middle'); });
      M.forEach((row,i)=>{ if(labels) txt(svg,x0-6,y0+i*chh+chh/2+F*.35,r.rowsL[i],`font:700 ${Fs}px system-ui;fill:var(--s2)`,'end');
        row.forEach((val,j)=>{ const shown=i<st.rows, masked=!isFinite(val)||(kind==='A'&&st.mode==='dec'&&j>i);
          const X=x0+j*cs, Y=y0+i*chh; el('rect',{x:X+1,y:Y+1,width:cs-2,height:chh-2,rx:5,fill:masked?hatch:(kind==='A'?cv(K18.w):'color-mix(in srgb,var(--surface-2) 70%,transparent)'),opacity:masked?1:(kind==='A'?(shown?(.12+.88*val).toFixed(3):.05):1),stroke:'var(--line)'},svg);
          if(shown) txt(svg,X+cs/2,Y+chh/2+F*.36,masked&&kind==='S'?'−∞':fmtr(val),`font:700 ${F}px system-ui;fill:${kind==='A'&&val>.55?'#1a1206':'var(--ink)'}`,'middle'); }); }); };
    const f3=v=>N(v,3);
    const G1=narrow?[80,60]:[90,70], G2=narrow?[80,60+nr*chh+70]:[90+nc*cs+60,70];
    grid(G1[0],G1[1],r.S,'scores q·k/√d'+(st.mode==='dec'?' + mask':''),f3,'S',true);
    grid(G2[0],G2[1],r.A,'shares (softmax of each row)',f3,'A',!!narrow);
    if(st.mode!=='cross'){ const G3=narrow?[80,60+2*(nr*chh+70)]:[G2[0]+nc*cs+70,70]; txt(svg,G3[0],G3[1]-30,'answers (shares · V)',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
      r.O.forEach((o,i)=>{ if(i>=st.rows) return; txt(svg,G3[0],G3[1]+i*chh+chh/2+F*.36,vecN(o,3),`font:700 ${F}px system-ui;fill:var(--s3)`); }); }
    else { const G3=narrow?[20,60+2*(nr*chh+70)]:[G2[0]+nc*cs+50,70], W3=narrow?360:760-G3[0]-20;
      txt(svg,G3[0],G3[1]-30,'who looks at whom',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
      const ex=j=>G3[0]+W3*(j+.5)/3, hx_=i=>G3[0]+W3*(i+.5)/4, yT=G3[1]+10, yB=G3[1]+(narrow?150:190);
      r.A.forEach((row,i)=>row.forEach((w,j)=>{ if(i<st.rows&&w>.02) el('line',{x1:hx_(i),y1:yB-14,x2:ex(j),y2:yT+10,stroke:cv(K18.w),'stroke-width':(1+7*w).toFixed(2),opacity:(.15+.85*w).toFixed(3),'stroke-linecap':'round'},svg); }));
      EK.forEach((w,j)=>txt(svg,ex(j),yT,w,`font:800 ${F}px system-ui;fill:var(--s1)`,'middle')); HQ.forEach((w,i)=>txt(svg,hx_(i),yB+F*.4,w,`font:800 ${F}px system-ui;fill:var(--s2)`,'middle'));
      txt(svg,G3[0]+W3/2,yB+F*2,'Hindi being written (queries) → English read (keys)',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'middle'); }
    const k=Math.min(st.rows,nr)-1;
    read.innerHTML=(st.mode==='enc'?'Encoder · every word may look both ways.':st.mode==='dec'?'Decoder · above the diagonal the score is −∞, so the share is exactly 0.':'Cross-attention · Hindi words ask; English words answer (toy vectors).')+'<br>'+
      (st.mode==='cross'?HQ.map((w,i)=>w+' → '+EK[r.A[i].indexOf(Math.max(...r.A[i]))]+' <b>'+N(Math.max(...r.A[i]),3)+'</b>').join(' · '):r.A.map((row,i)=>'row '+(i+1)+': <b>'+vecN(row,3)+'</b> → '+vecN(r.O[i],3)).join('<br>'));
    svg.dataset.state=st.mode+'|'+r.A.map(row=>row.map(v=>v.toFixed(3)).join(' ')).join(';'); }
  tabs(document.getElementById('mk-mode'),t=>{ st.mode=t; st.rows=9; draw(); });
  let tw=null; document.getElementById('mk-play').addEventListener('click',()=>{ if(tw) tw.stop(); const n=st.mode==='cross'?4:3; st.rows=0; draw(); tw=tween(n*650,u=>{ const r=Math.floor(u*n+1e-9); if(r!==st.rows){ st.rows=r; draw(); } },()=>{ st.rows=9; draw(); }); });
  relayout(svg,draw);
  window.U18Mask={st,draw,calc};
})();

/* ---------- §10 · w-cost: handshakes against the relay ---------- */
(function(){
  const svg=document.getElementById('cs-svg'); if(!svg) return;
  const read=document.getElementById('cs-read');
  const st={lg:3,h:1,L:1};
  const nOf=()=>Math.round(Math.pow(10,st.lg));
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 420':'0 0 760 330');
    const glow=glo(svg), F=fz(svg,11.5), Fs=fz(svg,10);
    const P=narrow?{x:56,y:24,w:320,h:300}:{x:70,y:20,w:640,h:260}, Y1=13;
    const pn=panel(svg,P.x,P.y,P.w,P.h,1,5,0,Y1,{xs:1,ys:2,xf:v=>'10'+SUP(v),yf:v=>'10'+SUP(v)});
    txt(svg,P.x+P.w,P.y+P.h+F*2.4,'words n (log scale)',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'end');
    const curve=(f,col,label,dash)=>{ let d=''; for(let t=0;t<=100;t++){ const lg=1+4*t/100, v=Math.log10(Math.max(1,f(Math.pow(10,lg)))); d+=(t?'L':'M')+pn.px(lg).toFixed(1)+','+pn.cy(pn.py(Math.min(Y1,v))).toFixed(1); }
      glowPath(svg,d,col,2.6,!!glow,dash?{'stroke-dasharray':dash}:null); };
    const att=n=>n*n*st.h*st.L, rel=n=>n, par=()=>st.L;
    curve(att,cv(K18.w),'',null); curve(rel,cv(K18.k),'',null); curve(par,cv(K18.v),'','6 5');
    const n=nOf(), X=pn.px(st.lg);
    el('line',{x1:X,y1:P.y,x2:X,y2:P.y+P.h,stroke:'var(--ink-2)','stroke-width':1.2,'stroke-dasharray':'3 4'},svg);
    [[att(n),K18.w],[rel(n),K18.k],[par(),K18.v]].forEach(([v,k])=>glowDot(svg,X,pn.py(Math.min(Y1,Math.log10(Math.max(1,v)))),5,cv(k),glow));
    const L=[['attention scores n²·h·L',K18.w],['relay: steps in a row n',K18.k],['attention: steps in a row = layers',K18.v]];
    L.forEach(([t,k],i)=>{ const lx=P.x+12, ly=P.y+16+i*(F*1.35); el('rect',{x:lx,y:ly-F*.7,width:16,height:4,rx:2,fill:cv(k)},svg); txt(svg,lx+22,ly-F*.25,t,`font:700 ${Fs}px system-ui;fill:var(--ink-2)`); });
    const mb=att(n)*2/1e6;
    read.innerHTML='n = <b>'+grp(n)+'</b> words · '+st.h+' head'+(st.h>1?'s':'')+' · '+st.L+' layer'+(st.L>1?'s':'')+'<br>attention scores: '+grp(n)+'² × '+st.h+' × '+st.L+' = <b style="color:var(--s4)">'+grp(att(n))+'</b> (≈ '+(mb>=1000?N(mb/1000,2)+' GB':N(mb,2)+' MB')+' at 2 bytes each)<br>steps that must wait in a row: relay <b style="color:var(--s1)">'+grp(n)+'</b> · attention <b style="color:var(--s3)">'+st.L+'</b>';
    svg.dataset.state=[n,st.h,st.L,att(n)].join(','); }
  bindCtl('cs-n',v=>{ st.lg=v; draw(); },v=>grp(Math.round(Math.pow(10,v))));
  bindCtl('cs-h',v=>{ st.h=v; draw(); },v=>String(v)); bindCtl('cs-L',v=>{ st.L=v; draw(); },v=>String(v));
  relayout(svg,draw);
  window.U18Cost={st,draw};
})();

/* ---------- §11 · w-tiny: a tiny transformer, step by step ---------- */
(function(){
  const card=document.getElementById('tn-card'); if(!card) return;
  const svg=document.getElementById('tn-svg'), scrub=document.getElementById('tn-scrub'), count=document.getElementById('tn-count');
  const st={sent:'drink',k:0};
  const TGT={drink:['drink','chai'],play:['play','cricket']};
  const R=()=>TINY.run(['I',st.sent]);
  const rowsL=()=>['“I”','“'+st.sent+'”'];
  const M=(A,tone,o)=>matHTML(A,Object.assign({tone},o||{}));
  const row=(nm,html)=>`<div class="tn-row"><span class="nm">${nm}</span>${html}</div>`;
  const STEPS=[
    {s:'look up',t:'1 · Look up each word',sub:'Each word\'s row of the embedding table (Unit 16).',b:r=>row('E(I)',M([r.E[0]],'par'))+row('E('+st.sent+')',M([r.E[1]],'par')),note:'The four numbers are hand-made features: who, drink, play, and a last one that the positions will use.'},
    {s:'+ position',t:'2 · Add the position vectors',sub:'X = E + P. The table P is learned in real models; here p₀ = (0, 0, 0, 1) and p₁ = (0, 0, 0, −1).',b:r=>row('P',M(r.P,'par'))+row('X',M(r.X,'k')),note:'Now the last number says "I come first" (+1) or "I come second" (−1).'},
    {s:'head 1 · scores',t:'3 · Head 1: queries, keys, scores',sub:'Head 1 is set up to look at the word before. Masked: a word may not look ahead.',b:r=>row('Q₁ = XW_Q',M(r.q1,'q'))+row('K₁ = XW_K',M(r.k1,'k'))+row('scores',M(r.h1.S,'gold')),note:'Row 2: q = (2, 0) meets k₁ = (1, 0) and k₂ = (−1, 0): scores 2/√2 = 1.414 and −1.414.'},
    {s:'head 1 · blend',t:'4 · Head 1: shares and blend',sub:'Softmax each row, then blend the values.',b:r=>row('shares',M(r.h1.A,'gold',{cell:(i,j)=>i===1?'hot':''}))+row('V₁',M(r.v1,'v'))+row('answer',M(r.h1.O,'v')),note:'Row 2 gives 0.944 to “I” and 0.056 to itself: the second word pulls in the first word’s meaning.'},
    {s:'head 2 · scores',t:'5 · Head 2: queries, keys, scores',sub:'Head 2 is set up to look for action words (drink, play).',b:r=>row('Q₂',M(r.q2,'q'))+row('K₂',M(r.k2,'k'))+row('scores',M(r.h2.S,'gold')),note:'Only the action word has a non-zero key, so row 2 scores it 1.414.'},
    {s:'head 2 · blend',t:'6 · Head 2: shares and blend',sub:'The same softmax-and-blend, with head 2\'s own values.',b:r=>row('shares',M(r.h2.A,'gold'))+row('V₂',M(r.v2,'v'))+row('answer',M(r.h2.O,'v')),note:'Row 2: shares (0.196, 0.804) — the same numbers as the masked example of §9.'},
    {s:'glue · W_O',t:'7 · Glue the heads, mix with W_O',sub:'[head 1 | head 2] is 2 × 4; W_O maps it back to d = 4.',b:r=>row('[h₁ | h₂]',M(r.H,'par'))+row('× W_O',M(r.att,'v')),note:'Head 2\'s "drink" lands in the drink column; its "play" lands in the play column.'},
    {s:'add · norm',t:'8 · Add the shortcut, then layer norm',sub:'R = X + attention; each row to mean 0 and spread 1.',b:r=>row('X + att',M(r.R1,'k'))+row('LN',M(r.L1,'k')),note:'The residual keeps each word\'s own numbers; layer norm only rescales.'},
    {s:'small network',t:'9 · The small network, word by word',sub:'hidden = ReLU(L W₁), out = hidden W₂.',b:r=>row('ReLU(L W₁)',M(r.hid,'par'))+row('× W₂',M(r.F,'v')),note:'Its first neuron fires for "drink more than play"; its second for "play more than drink".'},
    {s:'add · norm',t:'10 · Add and layer norm again',sub:'The block\'s output: one new vector per word.',b:r=>row('L + FFN',M(r.R2,'k'))+row('LN',M(r.L2,'k')),note:'This is what a second block would receive. We stop after one.'},
    {s:'vocab scores',t:'11 · Score every word of the vocabulary',sub:'logits = output × W_U (columns: I, drink, play, chai, cricket).',b:r=>row('logits',M(r.logits,'gold')),note:'Row 1 favours drink and play; row 2 favours '+(st.sent==='drink'?'chai':'cricket')+'.'},
    {s:'softmax · loss',t:'12 · Softmax, and the loss',sub:'Probabilities for the next word at every position; the loss is the average −ln p(true next word).',b:r=>{ const T=TGT[st.sent], p0=r.probs[0][TINY.VOC.indexOf(T[0])], p1=r.probs[1][TINY.VOC.indexOf(T[1])], L=(-Math.log(p0)-Math.log(p1))/2;
      const bars=pr=>{ const mx=Math.max(...pr); return '<div class="tn-probs">'+pr.map((p,i)=>`<span>${TINY.VOC[i]}</span><span class="bar${p===mx?' win':''}" style="width:${(p*100).toFixed(1)}%"></span><span class="pv">${N(p,3)}</span>`).join('')+'</div>'; };
      return row('after “I”',bars(r.probs[0]))+row('after “I '+st.sent+'”',bars(r.probs[1]))+`<div class="st-win">loss = ½(−ln ${N(p0,3)} − ln ${N(p1,3)}) = <b>${N(L,3)}</b> for “I ${st.sent} ${T[1]}”</div>`; },note:'Backprop (Unit 15) would now send the blame back through every matrix on this tower.'}];
  function drawTower(){ svg.innerHTML=""; const glow=glo(svg), F=Math.max(14,fz(svg,12)), n=STEPS.length, H=460, top=18, h=(H-2*top)/n;
    STEPS.forEach((s,i)=>{ const y=H-top-(i+1)*h, on=i===st.k, done=i<st.k;
      const cat=i<2?K18.tok:i<7?K18.w:i<10?K18.v:K18.prob; el('rect',{x:24,y:y+6,width:8,height:h-12,rx:3,fill:cv(cat),opacity:on||done?1:.45},svg);
      el('rect',{x:40,y:y+3,width:300,height:h-6,rx:9,fill:on?'color-mix(in srgb,var(--s4) 22%,transparent)':done?'color-mix(in srgb,var(--s1) 12%,transparent)':'color-mix(in srgb,var(--surface-2) 60%,transparent)',stroke:on?cv(K18.w):'var(--line)','stroke-width':on?2:1,filter:on&&glow?glow:'none',style:'cursor:pointer'},svg).addEventListener('click',()=>go(i));
      txt(svg,58,y+h/2+F*.36,(i+1)+' · '+s.s,`font:${on?800:600} ${F}px system-ui;fill:${on?'var(--ink)':'var(--ink-2)'}`);
      if(i<n-1) el('line',{x1:190,y1:y+3,x2:190,y2:y-3,stroke:'var(--ink-muted)','stroke-width':1.4},svg); }); }
  function draw(){ const r=R(), s=STEPS[st.k];
    card.innerHTML=`<div class="st-head"><span class="st-badge ${st.k>=10?'a':'f'}">STEP ${st.k+1}</span><span class="st-rule">${rowsL().join(' · ')}</span></div><h4 class="st-title">${s.t}</h4><p class="st-sub">${s.sub}</p><div class="tn-rows">${s.b(r)}</div><p class="st-info">${s.note}</p>`;
    scrub.querySelectorAll('button').forEach((b,i)=>{ b.setAttribute('aria-selected',i===st.k); b.classList.toggle('done',i<st.k); });
    count.textContent=(st.k+1)+' / '+STEPS.length; drawTower();
    card.dataset.state=st.sent+'|'+st.k+'|'+r.probs[1].map(p=>p.toFixed(3)).join(' '); }
  scrub.innerHTML=STEPS.map((s,i)=>`<button type="button" role="tab" class="${i>=10?'a':'f'}" aria-selected="${i===0}">${i+1}</button>`).join('');
  scrub.querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>go(i)));
  function go(k){ st.k=Math.max(0,Math.min(STEPS.length-1,k)); draw(); }
  document.getElementById('tn-next').addEventListener('click',()=>go(st.k+1));
  document.getElementById('tn-prev').addEventListener('click',()=>go(st.k-1));
  document.getElementById('tn-end').addEventListener('click',()=>go(STEPS.length-1));
  tabs(document.getElementById('tn-sent'),t=>{ st.sent=t; draw(); });
  draw(); new MutationObserver(drawTower).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if('ResizeObserver' in window){ let lw=0; new ResizeObserver(()=>{ const w=svg.getBoundingClientRect().width; if(Math.abs(w-lw)>4){ lw=w; drawTower(); } }).observe(svg.parentNode); }
  window.U18Tiny={st,go,R};
})();
