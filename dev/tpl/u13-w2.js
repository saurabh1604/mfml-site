/* ================= shared: a solved linear SVM drawn in a frame ================= */
function drawLinSVM(fr,svg,X,Y,r,o){ o=o||{}; const g=el('g',{'clip-path':fr.clip},svg);
  if(r&&r.ok&&r.w&&r.wn>1e-9){ drawStreet(fr,g,r.w,r.b,{sides:true});
    /* w as a green arrow from the point of the boundary nearest the frame's centre */
    const c=[(fr.X0+fr.X1)/2,(fr.Y0+fr.Y1)/2], wn=r.wn, u=[r.w[0]/wn,r.w[1]/wn], t=(r.w[0]*c[0]+r.w[1]*c[1]+r.b)/wn, f0=[c[0]-t*u[0],c[1]-t*u[1]];
    const d=[-u[1],u[0]], a0=[f0[0]+d[0]*(o.wOff==null?1.4:o.wOff),f0[1]+d[1]*(o.wOff==null?1.4:o.wOff)], L=o.wLen||.9;
    edge(g,fr.px(a0[0]),fr.py(a0[1]),fr.px(a0[0]+u[0]*L),fr.py(a0[1]+u[1]*L),cvar(K13.w),3,fr.glow); txt(g,fr.px(a0[0]+u[0]*(L+.22)),fr.py(a0[1]+u[1]*(L+.22))+4,'w','font:700 13px Inter,system-ui;fill:var(--s3)','middle'); }
  const top=el('g',{},svg);
  X.forEach((x,i)=>{ const Xp=fr.px(x[0]), Yp=fr.py(x[1]); if(Xp<fr.L-8||Xp>fr.W-fr.R+8||Yp<fr.T-8||Yp>fr.H-fr.B+8) return;
    const sv=r&&r.ok&&r.alpha[i]>1e-9, hot=o.hot===i;
    if(sv) svRing(top,Xp,Yp,7);
    mark(top,Xp,Yp,Y[i],{r:hot?9:7,dim:o.dimNonSV&&r&&r.ok&&!sv});
    if(sv&&o.alphaLabels!==false){ const s='α = '+frac(r.alpha[i]); txt(top,Xp+13,Yp-11,s,'font:700 11.5px Inter,system-ui;fill:var(--s4);paint-order:stroke;stroke:var(--page);stroke-width:3px'); } });
  return g; }
function nearestPt(fr,X,x,y,rad){ let bi=-1, bd=rad||22; X.forEach((p,i)=>{ const d=Math.hypot(fr.px(p[0])-x,fr.py(p[1])-y); if(d<bd){ bd=d; bi=i; } }); return bi; }
const ptName=x=>'('+x.map(v=>nm(trim(F(v,2)))).join(', ')+')';

/* ================= W6 · WHO IS PUSHING THE STREET? (twelve points, live prices) ================= */
(function(){
  const svg=document.getElementById('ps-svg'), bars=document.getElementById('ps-bars'), tbl=document.getElementById('ps-kv'), verd=document.getElementById('ps-verdict'); if(!svg) return;
  let X=D1.X.map(p=>p.slice()), fr=null, drag=-1, res=null, moved=-1;
  const Y=D1.y;
  function solve(){ res=SVM.solve(X,Y); }
  function draw(){ fr=eqFrame(svg,3.2,3.45,3.95,{xs:1,ys:1}); drawLinSVM(fr,svg,X,Y,res,{hot:drag});
    if(!res.ok){ txt(svg,fr.W/2,fr.T+22,res.msg,'font:700 13px Inter,system-ui;fill:var(--critical)','middle'); }
    const mx=Math.max(.3,...res.alpha);
    bars.innerHTML=X.map((x,i)=>{ const a=res.ok?res.alpha[i]:0; return `<div class="ab${a>1e-9?'':' zero'}"><span class="nm" style="color:var(--${classKey(Y[i])})">${ptName(x)}</span><span class="bar"><i style="width:${(100*a/mx).toFixed(1)}%;background:var(--${a>1e-9?K13.sv:'ink-muted'})"></i></span><span class="v">${a>1e-9?frac(a):'0'}</span></div>`; }).join('');
    if(!res.ok){ kv(tbl,[['status','<span class="k-crit">no street</span>']]); verd.className='verdict bad'; verd.textContent='bad — a point crossed into the other group, so no line clears every point'; return; }
    const bal=res.alpha.reduce((s,a,i)=>s+a*Y[i],0);
    const rows=[['w',vecS(res.w,3)],['b',nm(trim(F(res.b,3)))],['width 2/‖w‖','<b>'+F(res.width,3)+'</b>'],['Σ αᵢyᵢ',trim(F(Math.abs(bal)<1e-9?0:bal,4))+' ✓ balanced']];
    if(moved>=0){ const z=res.score[moved], a=res.alpha[moved]; rows.push(['moved point · score',trim(F(z,3))],['its price · α(z − 1)',frac(a)+' · '+trim(F(Math.abs(a*(z-1))<1e-9?0:a*(z-1),4))]); }
    kv(tbl,rows);
    const nsv=res.nsv;
    if(moved>=0&&res.alpha[moved]>1e-9){ verd.className='verdict good'; verd.textContent='good — this point now presses on the street, so it carries a price and the street re-solved around it'; }
    else if(moved>=0){ verd.className='verdict info'; verd.textContent='info — this point has room to spare: price 0, and the street did not move'; }
    else { verd.className='verdict info'; verd.textContent='info — '+nsv+' of '+X.length+' points carry a price; the other '+(X.length-nsv)+' push nothing'; } }
  svgDrag(svg,(x,y)=>{ if(!fr) return false; const i=nearestPt(fr,X,x,y,26); if(i<0) return false; drag=i; moved=i; pressOnly(document.getElementById('ps-reset').parentNode,null); },
    (x,y)=>{ if(drag<0) return; X[drag]=[Math.round(Math.max(fr.X0+.1,Math.min(fr.X1-.1,fr.ix(x)))*20)/20,Math.round(Math.max(fr.Y0+.1,Math.min(fr.Y1-.1,fr.iy(y)))*20)/20]; solve(); draw(); },()=>{ drag=-1; draw(); });
  document.getElementById('ps-reset').addEventListener('click',e=>{ X=D1.X.map(p=>p.slice()); moved=-1; pressOnly(e.currentTarget.parentNode,e.currentTarget); solve(); draw(); });
  solve(); draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W7 · w, ASSEMBLED FROM ITS SUPPORT VECTORS (arrows tip to tail, and a balance beam) ================= */
(function(){
  const svg=document.getElementById('bd-svg'), tbl=document.getElementById('bd-kv'), verd=document.getElementById('bd-verdict'); if(!svg) return;
  const SV=[{x:[1,3],y:1},{x:[3,5],y:1},{x:[4,2],y:-1}], A0=[.125,.125,.25];
  let A=A0.slice(), show=3, anim=null;
  function draw(){ svg.innerHTML=''; const glow=glo(svg);
    /* left: the arrows */
    const P=panel(svg,46,26,440,340,-1.35,1.05,-.66,1.2,{xs:.5,ys:.5,title:'w = Σ αᵢ yᵢ xᵢ, laid tip to tail'});
    const g=el('g',{'clip-path':P.clip},svg); let cur=[0,0]; const cols=SV.map(s=>cvar(classKey(s.y)));
    SV.forEach((s,i)=>{ if(i>=show) return; const v=[A[i]*s.y*s.x[0],A[i]*s.y*s.x[1]], nx=[cur[0]+v[0],cur[1]+v[1]];
      if(Math.hypot(...v)>1e-6) edge(g,P.px(cur[0]),P.py(cur[1]),P.px(nx[0]),P.py(nx[1]),cols[i],3,glow);
      const lbl=(s.y>0?'+':'−')+trim(F(A[i],3))+'·('+s.x.join(', ')+')', sx=P.px(nx[0])-P.px(cur[0]), sy=P.py(nx[1])-P.py(cur[1]), sl=Math.hypot(sx,sy)||1, side=[1,1,-1][i];
      const lx=(P.px(cur[0])+P.px(nx[0]))/2+side*sy/sl*16, ly=(P.py(cur[1])+P.py(nx[1]))/2-side*sx/sl*16;
      if(Math.hypot(...v)>1e-6) txt(g,lx,ly+4,lbl,'font:700 11px Inter,system-ui;fill:'+cols[i]+';paint-order:stroke;stroke:var(--page);stroke-width:3px','middle'); cur=nx; });
    const w=SV.reduce((a,s,i)=>[a[0]+A[i]*s.y*s.x[0],a[1]+A[i]*s.y*s.x[1]],[0,0]);
    /* the true w as a ghost, the built w in green */
    el('circle',{cx:P.px(-.5),cy:P.py(.5),r:9,fill:'none',stroke:cvar(K13.sv),'stroke-width':2,'stroke-dasharray':'3 3'},g);
    if(show>=3){ edge(g,P.px(0),P.py(0),P.px(w[0]),P.py(w[1]),cvar(K13.w),3.4,glow); txt(g,P.px(w[0])-10,P.py(w[1])-10,'w = '+vecS(w,3),'font:700 12px Inter,system-ui;fill:var(--s3)','end'); }
    el('circle',{cx:P.px(0),cy:P.py(0),r:3.5,fill:'var(--ink)'},g);
    /* right: the balance beam */
    const bx=690, by=200, half=150, sp=A[0]+A[1], sn=A[2], diff=sp-sn, tilt=Math.max(-.32,Math.min(.32,diff*1.6));
    txt(svg,bx,34,'the balance: Σ αᵢ yᵢ = 0','font:700 11px Inter,system-ui;fill:var(--ink-muted)','middle');
    el('path',{d:`M${bx-24},${by+120}L${bx},${by+8}L${bx+24},${by+120}Z`,fill:'var(--surface-2)',stroke:'var(--ink-2)','stroke-width':1.5},svg);
    const ca=Math.cos(tilt), sa=Math.sin(tilt), L=[bx-half*ca,by+half*sa], R=[bx+half*ca,by-half*sa];
    glowLine(svg,L[0],L[1],R[0],R[1],Math.abs(diff)<1e-9?cvar(K13.w):'var(--ink-2)',5,glow&&Math.abs(diff)<1e-9);
    el('circle',{cx:bx,cy:by,r:6,fill:'var(--ink)'},svg);
    const pan=(p,col,items,label)=>{ el('line',{x1:p[0],y1:p[1],x2:p[0],y2:p[1]+40,stroke:'var(--ink-muted)'},svg); el('path',{d:`M${p[0]-52},${p[1]+40}Q${p[0]},${p[1]+64} ${p[0]+52},${p[1]+40}Z`,fill:'color-mix(in srgb,'+col+' 22%,transparent)',stroke:col,'stroke-width':1.6},svg);
      let yy=p[1]+36; items.forEach(v=>{ const h=Math.max(3,v*90); el('rect',{x:p[0]-18,y:yy-h,width:36,height:h,rx:3,fill:col,opacity:.9},svg); yy-=h+2; });
      txt(svg,p[0],p[1]+84,label,'font:700 11px Inter,system-ui;fill:'+col,'middle'); };
    pan(L,cvar(K13.pos),[A[0],A[1]],'blue: Σα = '+trim(F(sp,3))); pan(R,cvar(K13.neg),[A[2]],'orange: Σα = '+trim(F(sn,3)));
    txt(svg,bx,by+150,Math.abs(diff)<1e-9?'level — the pushes balance':'tipped: Σαᵢyᵢ = '+nm(trim(F(diff,3))),'font:700 12px Inter,system-ui;fill:'+(Math.abs(diff)<1e-9?'var(--s3)':'var(--critical)'),'middle');
    const ok=Math.hypot(w[0]+.5,w[1]-.5)<1e-9&&Math.abs(diff)<1e-9;
    kv(tbl,[['w built from the prices',vecS(w,3)],['the solver\'s w','(−0.5, 0.5)'],['Σ αᵢyᵢ = −∂L/∂b',nm(trim(F(Math.abs(diff)<1e-12?0:diff,3)))],['½‖w‖²',trim(F(.5*(w[0]*w[0]+w[1]*w[1]),4))]]);
    if(show<3){ verd.className='verdict info'; verd.textContent='info — building w, one support vector at a time'; }
    else if(ok){ verd.className='verdict good'; verd.textContent='good — the three arrows land exactly on w = (−0.5, 0.5), and the beam is level: both stationarity conditions hold'; }
    else if(Math.abs(diff)>1e-9){ verd.className='verdict bad'; verd.textContent='bad — the classes no longer pull equally hard, so sliding b sideways could still improve things: not an answer'; }
    else { verd.className='verdict info'; verd.textContent='info — balanced, but these arrows build a different w; only the solver\'s prices give the widest street'; } }
  const ids=['bd-a1','bd-a2','bd-a3'];
  ids.forEach((id,k)=>bindCtl(id,v=>{ if(anim){ anim.stop(); anim=null; } show=3; A[k]=v; pressOnly(document.getElementById('bd-reset').parentNode,null); draw(); },v=>trim(F(v,3))));
  document.getElementById('bd-reset').addEventListener('click',e=>{ A=A0.slice(); ids.forEach((id,k)=>setCtl(id,A0[k],v=>trim(F(v,3)))); show=3; pressOnly(e.currentTarget.parentNode,e.currentTarget); draw(); });
  document.getElementById('bd-play').addEventListener('click',()=>{ if(anim) anim.stop(); A=A0.slice(); ids.forEach((id,k)=>setCtl(id,A0[k],v=>trim(F(v,3)))); if(RM){ show=3; draw(); return; }
    show=0; draw(); let k=0; const step=()=>{ show=++k; draw(); if(k<3) anim=tween(650,()=>{},step); }; anim=tween(350,()=>{},step); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W8 · THE DUAL OBJECTIVE, AND THE LINE THAT BINDS IT (a lit hill over the price floor) ================= */
(function(){
  const box=document.getElementById('du-3d'), tbl=document.getElementById('du-kv'), verd=document.getElementById('du-verdict'); if(!box) return;
  /* two points: D(a1,a2) = a1 + a2 − (a1 + a2)²; three points on the plane a2 = a1 + a3: D(a1,a3) = 2a1 + 2a3 − ½[8a1² + 18a1a3 + 11.25a3²] */
  const D2=(a,b2)=>a+b2-(a+b2)*(a+b2);
  const H=[[8,9],[9,11.25]], D3=(a1,a3)=>2*a1+2*a3-.5*(H[0][0]*a1*a1+2*H[0][1]*a1*a3+H[1][1]*a3*a3);
  let tab='two', a=.1, a1=.1, a3=.1, sc=null, anim=null;
  const ZS=2.6, SXY=4.2;                               /* heights ×2.6, prices ×4.2 on the floor */
  const Q=(u,v,h)=>[(u-.3)*SXY,h*ZS,-(v-.25)*SXY];
  function build(){ sc=null; const narrow=box.clientWidth<560, r=narrow?8.4:6.6, th=.62, ph=1.02;
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),.3+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look:[0,.3,0],fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx);
        glassFloor(ctx,5.2,{div:26,y:-.004});
        const G=new THREE.Group(); root.add(G);
        const floorLine=(A,B,col,r2,op)=>G.add(tube(ctx,A,B,col,r2||.012,op==null?.9:op));
        if(tab==='two'){
          const U=[0,.6], V=[0,.6];
          const surf=CIN.prim.surface(ctx,(x,y)=>Math.max(-.1,D2(x,y)),{x:U,y:V,res:80,zscale:ZS,ramp:[ctx.colors.s1,ctx.colors.s7,ctx.colors.s4],opacity:isLight?.8:.78}); lightenSurface(ctx,surf,ZS);
          surf.scale.set(SXY,1,SXY); surf.position.set(...Q(.3,.3,0)); G.add(surf);
          /* the balance line α1 = α2, on the floor and lifted onto the hill */
          floorLine(Q(0,0,0),Q(.6,.6,0),hx(K13.w),.01,.7);
          const pts=[]; for(let i=0;i<=60;i++){ const t=.6*i/60; pts.push(Q(t,t,Math.max(-.1,D2(t,t))+.004)); } G.add(polyTube(ctx,pts,hx(K13.w),.016,false));
          /* the ridge α1 + α2 = ½ */
          const rp=[]; for(let i=0;i<=30;i++){ const t=.5*i/30; rp.push(Q(t,.5-t,.25+.004)); } G.add(polyTube(ctx,rp,hx('ink2'),.007,false));
          const star=ring3(ctx,.1,{tube:.014}); star.position.set(...Q(.25,.25,.25+.01)); G.add(star);
          G.add(lab(ctx,'peak ¼ at α = ¼',Q(.25,.25,.25+.1),{size:15,color:cssv(K13.sv),depthTest:false,scale:.005}));
          G.add(lab(ctx,'ridge α₁ + α₂ = ½',Q(.02,.52,.3),{size:13,color:cssv('ink-2'),depthTest:false,scale:.0045}));
          G.add(lab(ctx,'α₁',Q(.66,0,0),{size:17,color:cssv('ink-muted'),bg:false,depthTest:false})); G.add(lab(ctx,'α₂',Q(0,.66,0),{size:17,color:cssv('ink-muted'),bg:false,depthTest:false}));
        } else {
          const U=[0,.6], V=[-.3,.4];
          const surf=CIN.prim.surface(ctx,(x,y)=>Math.max(-.1,D3(x,y)),{x:U,y:V,res:80,zscale:ZS,ramp:[ctx.colors.s1,ctx.colors.s7,ctx.colors.s4],opacity:isLight?.8:.78}); lightenSurface(ctx,surf,ZS);
          const vis=fadeAttr(THREE,surf); const pos=surf.userData.geo.attributes.position;
          for(let i=0;i<pos.count;i++){ const yv=-pos.getZ(i)+(V[0]+V[1])/2; vis.setX(i,yv<0?.3:1); } vis.needsUpdate=true;
          surf.scale.set(SXY,1,SXY); surf.position.set(...Q(.3,.05,0)); G.add(surf);
          /* the wall α3 = 0 */
          const wall=CIN.prim.glass(ctx,.6*SXY,1.0,critHex(),isLight?.14:.16); wall.position.set(...Q(.3,0,.2)); G.add(wall);
          floorLine(Q(0,0,0),Q(.6,0,0),critHex(),.012,.9);
          G.add(lab(ctx,'wall α₃ = 0 · prices cannot be negative',Q(.3,0,.42),{size:13,color:cssv('critical'),depthTest:false,scale:.0045}));
          const free=overlay(CIN.prim.dot(ctx,Q(.5,-2/9,D3(.5,-2/9)+.01),hx('ink2'),.045),12); G.add(free);
          G.add(lab(ctx,'free peak 0.278 · needs α₃ = −2/9',Q(.5,-2/9,D3(.5,-2/9)+.1),{size:13,color:cssv('ink-2'),depthTest:false,scale:.0045}));
          const star=ring3(ctx,.1,{tube:.014}); star.position.set(...Q(.25,0,.25+.01)); G.add(star);
          G.add(lab(ctx,'answer ¼ on the wall',Q(.25,0,.25+.12),{size:15,color:cssv(K13.sv),depthTest:false,scale:.005}));
          G.add(lab(ctx,'α₁',Q(.66,0,0),{size:17,color:cssv('ink-muted'),bg:false,depthTest:false})); G.add(lab(ctx,'α₃',Q(0,.44,0),{size:17,color:cssv('ink-muted'),bg:false,depthTest:false}));
        }
        const bead=overlay(CIN.prim.dot(ctx,[0,0,0],hx('ink'),.05),12), bh=haloSprite(ctx,hx('ink'),.4); root.add(bead,bh);
        const drop=liveTube(ctx,hx('ink2'),.004,.6); root.add(drop);
        sc={ctx,THREE,bead,bh,drop,handle:null}; hint(box,'drag to orbit'); sc.hud=hud(box); place(); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM||sc.story) return false; const o=sc.handle.ctx.orbit; o.sph.theta=.62+.16*Math.sin(t*.22); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; }); }
    return handle; }
  function place(){ if(!sc) return; let p, h;
    if(tab==='two'){ h=D2(a,a); p=Q(a,a,h); } else { h=D3(a1,a3); p=Q(a1,a3,h); }
    sc.bead.position.set(p[0],p[1]+.03,p[2]); sc.bh.position.copy(sc.bead.position); aimTube(sc.THREE,sc.drop,[p[0],0,p[2]],[p[0],p[1],p[2]]);
    sc.hud.innerHTML=tab==='two'?'α = <b>'+trim(F(a,3))+'</b> · D = <b>'+F(h,4)+'</b>':'α₁ = <b>'+trim(F(a1,3))+'</b>, α₃ = <b>'+trim(F(a3,3))+'</b> · D = <b>'+F(h,4)+'</b>'; RR(sc.ctx); }
  function draw(){ showTab(box.closest('.widget'),tab);
    if(tab==='two'){ const h=D2(a,a), w=2*a;
      kv(tbl,[['α₁ = α₂ = α',trim(F(a,3))],['dual D(α) = 2α − 4α²','<b>'+F(h,4)+'</b>'],['w built from α: α(1,1) + α(1,1)','('+trim(F(w,3))+', '+trim(F(w,3))+')'],['the two points then score','4α = '+trim(F(4*a,3))+(4*a>=1-1e-9?' ✓':' (too low: not yet a street)')],['primal minimum p* = ½‖w*‖²','0.25'],['gap p* − D(α)',F(.25-h,4)]]);
      if(Math.abs(a-.25)<1e-9){ verd.className='verdict good'; verd.textContent='good — the peak: α = ¼, w = (½, ½), b = 0, and primal = dual = ¼ (no gap)'; }
      else { verd.className='verdict info'; verd.textContent='info — any α gives a lower bound on the primal value; only the peak α = ¼ closes the gap'; } }
    else { const h=D3(a1,a3), a2=a1+a3, w=[a1*1+a2*1+a3*2,a1*1+a2*1+a3*.5];
      kv(tbl,[['α₂ = α₁ + α₃ (balance)',trim(F(a2,3))],['dual D',F(h,4)],['w = Σ αᵢyᵢxᵢ',vecS(w,3)],['free peak (not allowed)','0.2778 at α₃ = −0.2222'],['best allowed','<b>0.25</b> at α₁ = ¼, α₃ = 0']]);
      if(Math.abs(a1-.25)<1e-9&&a3<1e-9){ verd.className='verdict good'; verd.textContent='good — the answer sits on the wall: α₃ = 0, so the point (2, 0.5) pushes nothing — it is not a support vector'; }
      else { verd.className='verdict info'; verd.textContent='info — raising α₃ above 0 only lowers D here: the third point wants a negative price, and gets 0'; } }
    place(); }
  function stop(){ if(anim){ anim.stop(); anim=null; } if(sc) sc.story=false; }
  document.getElementById('du-play').addEventListener('click',()=>{ stop(); if(sc) sc.story=true;
    if(tab==='two'){ const f=a; anim=tween(RM?1:1800,u=>{ a=f+(.25-f)*u; setCtl('du-a',a,v=>trim(F(v,3))); draw(); },()=>{ a=.25; setCtl('du-a',.25,()=>'0.25'); draw(); if(sc){ sc.story=false; flare(sc.ctx,Q(.25,.25,.27),sc.ctx.colors?hxOf(sc.ctx)(K13.sv):0xffc857,900,1.2); } }); }
    else { const f1=a1, f3=a3; anim=tween(RM?1:1800,u=>{ a1=f1+(.25-f1)*u; a3=f3*(1-u); setCtl('du-a1',a1,v=>trim(F(v,3))); setCtl('du-a3',a3,v=>trim(F(v,3))); draw(); },()=>{ a1=.25; a3=0; setCtl('du-a1',.25,()=>'0.25'); setCtl('du-a3',0,()=>'0'); draw(); if(sc) sc.story=false; }); } });
  bindCtl('du-a',v=>{ stop(); a=v; draw(); },v=>trim(F(v,3)));
  bindCtl('du-a1',v=>{ stop(); a1=v; draw(); },v=>trim(F(v,3)));
  bindCtl('du-a3',v=>{ stop(); a3=v; draw(); },v=>trim(F(v,3)));
  let ST=null;
  tabs(document.getElementById('du-tabs'),t=>{ stop(); tab=t; if(ST) remount(ST); draw(); });
  draw(); ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
})();

/* ================= W9 · THE ANSWER DEPENDS ON A FEW POINTS (the flagship: a live SVM you can edit) ================= */
(function(){
  const svg=document.getElementById('sp-svg'), tbl=document.getElementById('sp-kv'), verd=document.getElementById('sp-verdict'); if(!svg) return;
  const X0=[[-1.3,1.2],[-1.5,.3],[-1.7,.2],[-1.2,2.1],[-1.7,.5],[-.9,1.3],[-1.2,.3],[-1.3,1.6],[-2.4,.6],[-2.9,0],[-.2,-1.2],[.3,-.8],[1.5,-1.1],[-.7,-1.4],[1.4,-.9],[.1,-1.4],[.6,-1.6],[2.3,-1.6],[1.4,-.3],[.9,-1.1]], Y0=[1,1,1,1,1,1,1,1,1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
  let X=X0.map(p=>p.slice()), Y=Y0.slice(), mode='move', fr=null, drag=-1, res=null, last=null, fade=null, msg='';
  function solve(){ res=SVM.solve(X,Y); }
  function draw(){ fr=eqFrame(svg,-.25,.25,3.35,{xs:1,ys:1}); drawLinSVM(fr,svg,X,Y,res,{hot:drag,wOff:1.6});
    if(fade){ fade.forEach(p=>{ const g=mark(svg,fr.px(p.x[0]),fr.py(p.x[1]),p.y,{r:7}); g.setAttribute('opacity',String(p.o)); }); }
    const n=X.length;
    if(!res.ok){ txt(svg,fr.W/2,fr.T+22,'no street: the two groups overlap','font:700 13px Inter,system-ui;fill:var(--critical)','middle');
      kv(tbl,[['points',n],['status','<span class="k-crit">no street exists</span>']]); verd.className='verdict bad'; verd.textContent='bad — '+res.msg+'. Delete or move the trespasser (§10 shows how to allow it).'; return; }
    txt(svg,fr.W-fr.R-8,fr.T+18,'the answer depends on '+res.nsv+' of '+n+' points','font:700 12.5px Inter,system-ui;fill:var(--s4)','end');
    kv(tbl,[['points',String(n)],['support vectors','<b>'+res.nsv+'</b> · α = '+res.alpha.filter(a=>a>1e-9).map(a=>trim(F(a,4))).join(', ')],['w',vecS(res.w,3)],['b',nm(trim(F(res.b,3)))],['width 2/‖w‖','<b>'+F(res.width,3)+'</b>'],['solve time',F(res.ms,1)+' ms · '+res.iter+' steps']]);
    if(msg){ verd.className=msg[0]==='g'?'verdict good':(msg[0]==='b'?'verdict bad':'verdict info'); verd.textContent=msg.slice(2); }
    else { verd.className='verdict info'; verd.textContent='info — '+(n-res.nsv)+' points have price 0: delete any of them and nothing moves'; } }
  const same=(a,b2)=>a&&b2&&Math.abs(a.w[0]-b2.w[0])<1e-9&&Math.abs(a.w[1]-b2.w[1])<1e-9&&Math.abs(a.b-b2.b)<1e-9;
  svgDrag(svg,(x,y)=>{ if(!fr) return false; msg=''; const i=nearestPt(fr,X,x,y,22);
      if(mode==='move'){ if(i<0) return false; drag=i; return; }
      if(mode==='del'){ if(i<0) return false; const was=res, sv=res.ok&&res.alpha[i]>1e-9; X.splice(i,1); Y.splice(i,1); solve();
        msg=!res.ok?'':(sv?(same(was,res)?'i an edge point with a tiny price left — the street held':'b you pulled out a support vector: the street jumped to a new answer'):'g price-0 point deleted — the street did not move'); draw(); return false; }
      const p=[Math.round(fr.ix(x)*20)/20,Math.round(fr.iy(y)*20)/20]; X.push(p); Y.push(mode==='pos'?1:-1); const was=res; solve(); msg=res.ok?(same(was,res)?'g the new point has room to spare: price 0, nothing moved':'i the new point presses on the street, so the street re-solved'):''; draw(); return false; },
    (x,y)=>{ if(drag<0) return; X[drag]=[Math.round(Math.max(fr.X0+.05,Math.min(fr.X1-.05,fr.ix(x)))*20)/20,Math.round(Math.max(fr.Y0+.05,Math.min(fr.Y1-.05,fr.iy(y)))*20)/20]; solve(); draw(); },()=>{ drag=-1; draw(); });
  document.getElementById('sp-modes').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ mode=b.dataset.m; pressOnly(b.parentNode,b); }));
  document.getElementById('sp-reset').addEventListener('click',()=>{ X=X0.map(p=>p.slice()); Y=Y0.slice(); msg=''; fade=null; solve(); draw(); });
  document.getElementById('sp-prune').addEventListener('click',()=>{ if(!res.ok) return; const was=res; const keep=[], gone=[];
    X.forEach((x,i)=>{ (res.alpha[i]>1e-9?keep:gone).push(i); }); if(!gone.length){ msg='i every remaining point is a support vector'; draw(); return; }
    fade=gone.map(i=>({x:X[i],y:Y[i],o:1})); X=keep.map(i=>X[i]); Y=keep.map(i=>Y[i]); solve();
    const ok=same(was,res); msg=ok?'g '+gone.length+' points deleted — the street is identical to the last digit: w, b and width unchanged':'b the street changed';
    if(RM){ fade=null; draw(); return; } tween(1100,u=>{ fade.forEach(p=>{ p.o=1-u; }); draw(); },()=>{ fade=null; draw(); }); });
  solve(); draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();
