/* ================= W6 · FIVE WALKERS, ONE VALLEY — the race, followed by a camera ================= */
(function(){
  const box=document.getElementById('w-five'),stage=document.getElementById('fv-3d'),board=document.getElementById('fv-board'),read=document.getElementById('fv-read'),verd=document.getElementById('fv-verdict');
  if(!box||!stage) return;
  const NST=40, RACE=25, X=[-2.4,2.4], Y=[-1.3,1.3];
  const niceC=s=>{ const v=Math.pow(10,s/50), e=Math.pow(10,Math.floor(Math.log10(v))); return Math.round(v/e*10)/10*e; };
  const s3=v=>{ if(!isFinite(v)) return '∞'; const a=Math.abs(v); if(a===0) return '0'; if(a<1e-4||a>=1e4) return nm(v.toExponential(1)).replace('e+','e'); return nm(trim((+v).toPrecision(3))); };
  let c=10,al=0.10,tCur=0,TR=null,sc=null,H=null,ST=null,run=0,anim=null,camA=null,lookA=null,morphT=null,booted=false;
  const camN=(h,to,dur,done)=>{ if(to.theta!=null){ const s=h.ctx.orbit.sph; s.theta=to.theta+Math.atan2(Math.sin(s.theta-to.theta),Math.cos(s.theta-to.theta)); } return camTo(h,to,dur,done); };
  /* ---- the numbers: five traces from OPT, plus where each walker leaves the map or arrives ---- */
  function plan(){ TR={}; M5.forEach(m=>{ const T=OPT.trace(m.k,{c,alpha:al,N:NST}); T.outAt=-1; T.arriveAt=-1;
      for(let t=1;t<=NST;t++){ const w=T[t].w; if(T[t].dead||((Math.abs(w[0])>X[1]*1.2||Math.abs(w[1])>Y[1]*1.2)&&T[t].J>2*T[0].J)){ T.outAt=t; break; } }
      for(let t=1;t<=NST;t++){ if(T.outAt>0&&t>=T.outAt) break; if(T[t].J<1e-3){ T.arriveAt=t; break; } }
      TR[m.k]=T; }); }
  const alive=(T,k)=>!(T.outAt>0&&k>=T.outAt);
  const wAt=(T,k,fr)=>{ const a=T[k].w; if(!fr||fr<=0||k>=NST||!alive(T,k+1)) return a; const b=T[k+1].w; return [a[0]+(b[0]-a[0])*fr,a[1]+(b[1]-a[1])*fr]; };
  /* five walkers leave one point: a small ring offset, gone by step 3, keeps five colours readable instead of one white blob */
  const ringOff=(i,k)=>{ const d=Math.max(0,1-k/3); const a=i*2*Math.PI/5+.4; return [Math.cos(a)*.075*d,Math.sin(a)*.05*d]; };
  const posOf=(T,k,fr,i)=>{ const w=wAt(T,k,fr), o=ringOff(i,k+(fr||0)); return [w[0]+o[0],w[1]+o[1]]; };
  const order=k=>M5.map(m=>{ const T=TR[m.k], out=!alive(T,k); return {m,J:out?Infinity:T[k].J,out,outAt:T.outAt}; }).sort((a,b)=>a.J-b.J);
  /* ---- the scene ---- */
  function build(){ run++; if(anim){ anim.stop(); anim=null; } sc=null; const narrow=stage.clientWidth<560;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:narrow?[3.8,5.1,5.3]:[3.2,4.4,4.5],look:[0,.5,0],fov:36},autoRotate:.08,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const V=valleyScene(ctx,{c});
        const panel=glassPanel(ctx,{w:2.6,h:1.0,pos:[0,1.62,-1.85]});
        const cursor=tube(ctx,[0,-.5,.016],[0,.5,.016],hx('s4'),.006,.85); panel.g.add(cursor);
        const W=M5.map(m=>{ const col=hx(m.c); const ch=walkerChar(ctx,col,.064); ch.glow(.7); return {m,col,ch,trail:trailRibbon(ctx,col,.02),tail:cometTail(ctx,col),flying:false}; });
        sc={ctx,THREE,root,colors,isLight,hx,V,panel,cursor,W,handle:null,home:null};
        H=hudPair(stage); H.top.style.cssText='max-width:calc(100% - 1.4rem);white-space:normal;line-height:1.55'; if(narrow){ H.top.style.fontSize=H.bot.style.fontSize='.66rem'; H.bot.style.maxWidth='calc(100% - 6rem)'; } hint(stage,'drag to orbit');
        drawPanel(); paint(); paintTrails(); restCap(); },
      update(){ return false; } });
    if(handle&&sc){ sc.handle=handle; const s=handle.ctx.orbit.sph, L=handle.ctx.look; sc.home={theta:s.theta,phi:s.phi,radius:s.radius,look:[L.x,L.y,L.z]}; grab(handle,()=>false,()=>{}); }
    return handle; }
  function drawPanel(){ if(!sc) return; const {panel,hx}=sc; panel.clear();
    let mn=Infinity,mx=0; M5.forEach(m=>{ const T=TR[m.k]; for(let t=0;t<=NST;t++){ if(!alive(T,t)) break; const J=T[t].J; if(J>0&&isFinite(J)){ mn=Math.min(mn,J); mx=Math.max(mx,J); } } });
    const LO=Math.log10(Math.max(1e-14,mn))-.3, HI=Math.log10(Math.max(mx,1e-2))+.3;
    const u=t=>t/NST, v=J=>Math.max(0,Math.min(1,(Math.log10(Math.max(1e-14,J))-LO)/(HI-LO)));
    panel.text('loss J · log scale · step 0 → 40',.5,.07,{size:15});
    [0,-4,-8,-12].forEach(e=>{ if(e>LO+.2&&e<HI-.2) panel.hline(v(Math.pow(10,e)),hx('ink2'),true); });
    M5.forEach(m=>{ const T=TR[m.k], pts=[]; for(let t=0;t<=NST;t++){ if(!alive(T,t)) break; if(t<=20||t%2===0||t===NST) pts.push([u(t),v(T[t].J)]); }
      if(pts.length>=2) panel.curve(pts,hx(m.c),.011);
      if(T.outAt>0) panel.bead(u(T.outAt),.985,hx('critical'),.026); });
    RR(sc.ctx); }
  function paint(fr){ if(!sc) return; const {V,W,cursor,panel}=sc, k=Math.min(tCur,NST);
    W.forEach((w,i)=>{ if(w.flying) return; const T=TR[w.m.k]; if(!alive(T,k)){ w.ch.show(false); w.tail.show(false); return; }
      const p=posOf(T,k,fr,i), q=V.at(p,.012+.004*i); w.ch.show(true); w.ch.setPos(q);
      const from=(fr&&fr>0)?posOf(T,k,0,i):(k>=1?posOf(T,k-1,0,i):null);
      if(from&&V.inside(from)){ w.tail.show(true); w.tail.set(V.at(from,.012+.004*i),q); } else w.tail.show(false); });
    cursor.position.x=(k/NST-.5)*panel.W;
    lanes(k); RR(sc.ctx); }
  function paintTrails(){ if(!sc) return; const {V,W}=sc, k=Math.min(tCur,NST);
    W.forEach((w,i)=>{ const T=TR[w.m.k]; w.trail.reset(); for(let t=0;t<=k;t++){ if(!alive(T,t)) break; const p=T[t].w; if(!V.inside(p)) break; w.trail.push(V.at(posOf(T,t,0,i),.03)); } });
    RR(sc.ctx); }
  const laneOf=o=>'<span style="color:'+CV(o.m.c)+'">●</span> '+o.m.s+' '+(o.out?'<b style="color:var(--critical)">✗ diverged at step '+o.outAt+'</b>':'<b style="color:var(--ink)">'+s3(o.J)+'</b>');
  function lanes(k){ const O=order(k);
    if(H) H.top.innerHTML=O.map(laneOf).join(' <span style="opacity:.45">·</span> ');
    board.innerHTML=O.map(o=>'<span style="white-space:nowrap">'+laneOf(o)+'</span>').join(''); }
  function cap(html){ if(!H) return; H.bot.innerHTML=html||''; H.bot.style.display=html?'':'none'; }
  function restCap(){ cap('step <b>'+Math.min(tCur,NST)+'</b> · c = <b>'+trim(String(c))+'</b> · α = <b>'+F(al,3)+'</b>'); }
  /* ---- readout, verdict ---- */
  function draw(){ const fJ=v=>!isFinite(v)?'∞':(Math.abs(v)<1e4?F(v,4):s3(v));
    const l1=M5.map(m=>m.s+' '+fJ(TR[m.k][2].J)).join(' · ');
    const O25=M5.map(m=>({m,J:alive(TR[m.k],25)?TR[m.k][25].J:Infinity})).sort((a,b)=>a.J-b.J);
    read.innerHTML='after 2 steps — '+l1+'<br>after 25 — '+O25.map(o=>o.m.s+' '+(isFinite(o.J)?s3(o.J):'✗')).join(' · ')+
      '<br>stiffness c = <b>'+trim(String(c))+'</b> · κ = <b>'+trim(String(c))+'</b> · GD’s admissible stride: η < 2/c = <b>'+F(2/c,4)+'</b>';
    if(c<=1.05){ verd.className='verdict info'; verd.textContent='info — a round bowl: every method finishes in one or two steps and the race is meaningless'; }
    else if(c>=100){ verd.className='verdict bad'; verd.textContent='bad for GD — its whole safe window is now '+F(2/c,4)+' wide, and the adaptive methods never noticed'; }
    else { verd.className='verdict good'; verd.textContent='good — four of the five shrink the loss every step; the order here is a property of this toy, not a law'; }
    paint(); }
  /* ---- the valley morphs under the stiffness dial ---- */
  function morphTo(target){ if(!sc) return; if(morphT){ morphT.stop(); morphT=null; } const V=sc.V, c0=V.c; if(Math.abs(c0-target)<1e-9){ paintTrails(); return; }
    morphT=tween(600,u=>{ if(!sc) return; V.reshapeTo(c0*Math.pow(target/c0,u)); paint(); },()=>{ morphT=null; if(!sc) return; V.reshapeTo(target); paint(); paintTrails(); }); }
  /* ---- the story: low behind the start, follow the leader, pull back to the map ---- */
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(camA){ camA.stop(); camA=null; } if(lookA){ lookA.stop(); lookA=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.08); if(sc) sc.W.forEach(w=>{ w.flying=false; }); }
  function lookTo(target,dur,tok){ if(!sc) return null; const L=sc.ctx.look, from=[L.x,L.y,L.z], o=sc.ctx.orbit;
    return tween(dur,u=>{ if(tok!==run) return; L.set(from[0]+(target[0]-from[0])*u,from[1]+(target[1]-from[1])*u,from[2]+(target[2]-from[2])*u); o.place(); }); }
  function flyOut(w,k,tok){ const {V,ctx,hx}=sc, T=TR[w.m.k], p0=T[k-1].w, p1=T[k].w; const d=[p1[0]-p0[0],p1[1]-p0[1]], L=Math.hypot(d[0],d[1])||1, dir=[d[0]/L,d[1]/L];
    const a=V.at(p0,.02), b=[a[0]+dir[0]*1.8,a[1]+1.2,a[2]-dir[1]*1.8]; const tail=cometTail(ctx,hx('critical')); sparks(ctx,a,hx('critical'),9,700);
    w.flying=true; w.ch.show(true); w.ch.glow(1.5); w.tail.show(false);
    tween(700,u=>{ if(tok!==run){ return; } const p=[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u*(2-u),a[2]+(b[2]-a[2])*u]; w.ch.setPos(p); tail.set(a,p); RR(ctx); },
      ()=>{ tail.clear(); ctx.root.remove(tail.g); w.flying=false; if(sc){ w.ch.glow(.7); paint(); } }); }
  function afterStep(k,tok){ const {V,W,hx}=sc; let said=false;
    W.forEach(w=>{ const T=TR[w.m.k];
      if(T.outAt===k){ flyOut(w,k,tok); cap('<span style="color:'+CV(w.m.c)+'">●</span> '+w.m.s+' ✗ diverged at step '+k); said=true; return; }
      if(!alive(T,k)) return; w.trail.push(V.at(posOf(T,k,0,W.indexOf(w)),.03));
      if(T.arriveAt===k){ flare(sc.ctx,V.at([0,0],.04),w.col,1000,1.5); cap('<span style="color:'+CV(w.m.c)+'">●</span> '+w.m.s+' arrives · step '+k); said=true; } });
    if(!said&&(k%5===0)) restCap(); }
  function play(){ stop(); const tok=run; plan(); tCur=0; setCtl('fv-t',0,v=>String(v|0)); draw(); paintTrails(); drawPanel();
    if(RM||!sc){ tCur=RACE; setCtl('fv-t',RACE,v=>String(v|0)); draw(); paintTrails(); restCap(); return; }
    const h=sc.handle, V=sc.V, home=sc.home; h.setAutoRotate(0);
    lookA=lookTo(V.at([1,1],0),700,tok); camA=camN(h,{theta:1.45,phi:c>60?.95:1.2,radius:3.5},700); cap('five walkers leave [1, 1] together');
    let k=0;
    const follow=()=>{ const best=order(k)[0]; if(!isFinite(best.J)) return; const T=TR[best.m.k]; lookA=lookTo(V.at(T[k].w,0),800,tok); camA=camN(h,{radius:3.6+1.2*(k/RACE),phi:(c>60?.95:1.18)-.12*(k/RACE)},800); };
    const finish=()=>{ camA=camN(h,{theta:home.theta,phi:home.phi,radius:home.radius},1500,()=>{ if(tok===run) h.setAutoRotate(.08); }); lookA=lookTo(home.look,1500,tok);
      const best=order(RACE)[0]; cap('after 25 — leader <span style="color:'+CV(best.m.c)+'">●</span> '+best.m.s+' · J = <b>'+s3(best.J)+'</b>'); paint(); };
    /* the race runs on the wall clock (25 steps in ≈ 5.4 s): a slow frame skips ahead instead of stretching the story */
    const DUR=215*RACE; let t0=null;
    const advance=()=>{ const el=Math.max(0,performance.now()-t0), kf=Math.min(RACE,el/DUR*RACE), kk=Math.floor(kf);
      while(k<kk){ tCur=++k; setCtl('fv-t',tCur,v=>String(v|0)); afterStep(k,tok); if(k%5===0&&k<RACE) follow(); }
      paint(k<RACE?kf-k:0); };
    anim=tween(520,()=>{},()=>{ if(tok!==run) return; t0=performance.now();
      anim=tween(DUR,()=>{ if(tok!==run) return; advance(); },()=>{ if(tok!==run) return; while(k<RACE){ tCur=++k; setCtl('fv-t',tCur,v=>String(v|0)); afterStep(k,tok); } paint(); finish(); }); }); }
  document.getElementById('fv-play').addEventListener('click',play);
  const preBar=document.getElementById('fv-pre');
  [['fv-p-lecture',50,0.1],['fv-p-stiff',124,0.1],['fv-p-safe',124,0.005]].forEach(([id,sv,a])=>document.getElementById(id).addEventListener('click',e=>{
    pressOnly(preBar,e.currentTarget); stop(); c=niceC(sv); al=a; setCtl('fv-c',sv,()=>trim(String(c))); setCtl('fv-eta',a,3); plan(); draw(); morphTo(c); play(); }));
  bindCtl('fv-c',v=>{ stop(); if(booted) pressOnly(preBar,null); c=niceC(v); plan(); draw(); restCap(); drawPanel(); morphTo(c); },v=>trim(String(niceC(v))))();
  bindCtl('fv-eta',v=>{ stop(); al=v; plan(); draw(); restCap(); drawPanel(); paintTrails(); },v=>fmt(v,3))();
  bindCtl('fv-t',v=>{ stop(); tCur=v|0; paint(); paintTrails(); restCap(); },v=>String(v|0))();
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const Wd=stage.clientWidth; if((Wd<560)!==(rw<560)) remount(ST); rw=Wd; });
  plan(); draw(); restCap(); booted=true;
})();

/* ================= W7 · THEN SOMEONE BUILDS A WALL — one stage, three scenes ================= */
(function(){
  const box=document.getElementById('w-wall'),stage=document.getElementById('wl-3d'),read=document.getElementById('wl-read'),verd=document.getElementById('wl-verdict');
  if(!box||!stage) return;
  let tab='knob',cc=2,c2=1,rule='r1',sc=null,H=null,ST=null,run=0,anim=null,camA=null,lookA=null,lastSpark=0;
  const camN=(h,to,dur,done)=>{ if(to.theta!=null){ const s=h.ctx.orbit.sph; s.theta=to.theta+Math.atan2(Math.sin(s.theta-to.theta),Math.cos(s.theta-to.theta)); } return camTo(h,to,dur,done); };
  const FLOOR=-.12, ZS=.18, XR=[-2.6,3.2], F1=x=>x*x;
  const RULES={
    r1:{rule:'x ≥ 2',move:'× (−1): a ≥ becomes a ≤',std:'g(x) = 2 − x ≤ 0',kind:'1d',a:1,b:0,cst:2,cx:2,cy:.5,side:'ge',warn:'∇g = (−1), not (+1) — this sign is where most of the marks go'},
    r2:{rule:'x + 2y ≥ 5',move:'× (−1), then move everything left',std:'g(x, y) = −x − 2y + 5 ≤ 0',kind:'2d',a:1,b:2,cst:5,cx:1,cy:2,side:'ge'},
    r3:{rule:'x + y ≤ 1',move:'move everything left; nothing else to do',std:'g(x, y) = x + y − 1 ≤ 0',kind:'2d',a:1,b:1,cst:1,cx:.5,cy:.5,side:'le'},
    r4:{rule:'x + y = 1',move:'keep it as an equality (or split into ≤ and ≥)',std:'e(x, y) = x + y − 1 = 0',kind:'2d',a:1,b:1,cst:1,cx:.5,cy:.5,side:'eq'},
    r5:{rule:'y ≥ 0',move:'× (−1)',std:'g(y) = −y ≤ 0',kind:'2d',a:0,b:1,cst:0,cx:.5,cy:0,side:'ge'},
    r6:{rule:'x > 2',move:'not allowed in standard form',std:'✗ strict inequalities are banned',kind:'strict',a:1,b:0,cst:2,cx:2,cy:.5,side:'gt'} };
  /* ---------- scene 1 · one knob: the parabola stands up as a lit ribbon, the wall slides along the number line ---------- */
  function buildKnob(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
    const grid=CIN.prim.grid(ctx,7,28,hx('grid'),{opacity:isLight?.45:.28}); grid.position.y=FLOOR; root.add(grid);
    const pts=[]; for(let i=0;i<=58;i++){ const x=XR[0]+(XR[1]-XR[0])*i/58; pts.push([x,F1(x)*ZS,0]); }
    root.add(polyTube(ctx,pts,hx('s1'),.026,false));
    { const n=pts.length, pos=new Float32Array(n*2*3), idx=[]; for(let i=0;i<n;i++){ pos.set([pts[i][0],pts[i][1],0],i*6); pos.set([pts[i][0],FLOOR,0],i*6+3); if(i<n-1){ const a=2*i; idx.push(a,a+1,a+2,a+1,a+3,a+2); } }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
      const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:hx('s1'),transparent:true,opacity:isLight?.12:.16,side:THREE.DoubleSide,depthWrite:false})); root.add(m); }
    const allowed=CIN.prim.glass(ctx,1,2.4,hx('s3'),isLight?.10:.09); allowed.rotation.x=-Math.PI/2; allowed.position.y=FLOOR+.004; root.add(allowed);
    const wall=wallPanel(ctx,{h:2.05,w:2.4}); [-1.2,1.2].forEach(z=>wall.g.add(tube(ctx,[0,-.12,z],[0,1.93,z],hx('s2'),.012,.9))); const ban=bannedFloor(ctx,{w:6,d:2.4});
    const ghost=overlay(CIN.prim.dot(ctx,[0,.05,0],hx('ink2'),.035),10); ghost.material.opacity=.55; root.add(ghost);
    root.add(tube(ctx,[0,FLOOR,0],[0,.03,0],hx('ink2'),.005,.5));
    const walker=walkerChar(ctx,hx('s4'),.062);
    const arrow=overlay(CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s2'),{radius:.026,head:.16}),11); root.add(arrow);
    root.add(CIN.prim.label(ctx,'free answer',[0,-.05,.4],{size:17,color:colors.muted,bg:false,depthTest:false}));
    root.add(CIN.prim.label(ctx,'f = x²',[XR[0]+.1,F1(XR[0])*ZS+.28,0],{size:19,color:colors.s1,bg:false,depthTest:false}));
    const lab=slot(ctx,root), lab2=slot(ctx,root);
    sc={tab:'knob',ctx,THREE,root,colors,isLight,hx,wall,ban,allowed,walker,arrow,ghost,lab,lab2,handle:null,home:null,wallH:1,walkX:null};
    H=hudPair(stage); if(stage.clientWidth<560){ H.top.style.fontSize=H.bot.style.fontSize='.66rem'; H.bot.style.maxWidth='calc(100% - 6rem)'; } hint(stage,'drag to orbit'); paintKnob(); }
  function paintKnob(o){ o=o||{}; if(!sc||sc.tab!=='knob') return; const c=o.c==null?cc:o.c, xs=o.x==null?Math.max(0,c):o.x, k=o.wallH==null?sc.wallH:o.wallH, {wall,ban,allowed,walker,arrow,lab,lab2,ctx,hx}=sc;
    wall.setX(c); wall.setH(k); wall.show(k>.001&&c>=XR[0]-.05&&c<=XR[1]+.05);
    const b1=Math.max(XR[0]-.1,Math.min(XR[1]+.1,c)); ban.setX(XR[0]-.1,b1); ban.show(k>.3); ban.m.material.opacity=(ctx.isLight?.10:.45)*Math.min(1,k);
    allowed.scale.x=Math.max(.001,XR[1]+.1-b1); allowed.position.x=(b1+XR[1]+.1)/2; allowed.visible=k>.3;
    const pressed=c>0&&k>.5&&xs>=c-1e-9, off=c>0&&k>.5?.07*Math.max(0,Math.min(1,xs/c)):0, q=[xs+off,F1(xs)*ZS+.088,0]; walker.setPos(q);
    const slope=2*xs;
    if(slope>1e-6&&o.arrow!==false){ const d=[-1,-slope*ZS], L=Math.hypot(d[0],d[1]), len=Math.min(1.15,.2+.15*slope); arrow.visible=true; arrow.userData.set([q[0],q[1],q[2]],[q[0]+d[0]/L*len,q[1]+d[1]/L*len,q[2]]);
      if(pressed&&o.spark!==false){ const now=performance.now(); if(now-lastSpark>260){ lastSpark=now; const hit=[c,q[1]-slope*ZS*.07,0]; sparks(ctx,hit,hx('s2'),6,520); } } }
    else arrow.visible=false;
    lab.set((o.x!=null&&xs<Math.max(0,c)-1e-6?'x = ':'x* = ')+F(xs,2)+' · f'+(o.x!=null&&xs<Math.max(0,c)-1e-6?'':'*')+' = '+F(xs*xs,2),[q[0]+.12,q[1]+.36,q[2]+.1],{size:18,color:sc.colors.s4,bg:false,depthTest:false});
    if(k>.3&&c>=XR[0]-.05&&c<=XR[1]+.05) lab2.set('wall · x ≥ '+F(c,2),[c,FLOOR+2.05*k+.22,0],{size:18,color:sc.colors.s2,bg:false,depthTest:false}); else lab2.hide();
    if(H){ if(c>0&&k>.5&&pressed) H.set('answer pressed against the wall · f′(x*) = <b>'+F(2*xs,2)+'</b> ≠ 0','x* = <b>'+F(xs,2)+'</b> · f* = <b>'+F(xs*xs,2)+'</b> · slope f′ = <b>'+F(2*xs,2)+'</b>');
      else if(c>0&&k>.5) H.set('the wall is up · the bottom is banned now — the walker is pushed to x = c','x = <b>'+F(xs,2)+'</b> · f = <b>'+F(xs*xs,2)+'</b> · slope f′ = <b>'+F(2*xs,2)+'</b>');
      else if(k<=.5) H.set('no wall yet · the free answer sits at the bottom','press ▶ to build the wall at x = '+F(c,2));
      else H.set('free answer survives · f′ = <b>0</b>','the wall at x = '+F(c,2)+' is behind the bottom — nothing is holding the walker'); }
    RR(ctx); }
  /* ---------- scene 2 · the valley: the hero's glass wall, the answer slides to its foot ---------- */
  function buildValley(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
    const V=valleyScene(ctx,{c:10});
    const wall=wallPanel(ctx,{h:1.9,w:2.8}); [-1.4,1.4].forEach(z=>wall.g.add(tube(ctx,[0,-.12,z],[0,1.78,z],hx('s2'),.012,.9))); const ban=bannedFloor(ctx,{w:5.2,d:2.8});
    const bead=walkerChar(ctx,hx('s4'),.062); const tail=cometTail(ctx,hx('s4'));
    const lab=slot(ctx,root), lab2=slot(ctx,root);
    sc={tab:'valley',ctx,THREE,root,colors,isLight,hx,V,wall,ban,bead,tail,lab,lab2,handle:null,home:null,wallH:1,beadX:null};
    H=hudPair(stage); if(stage.clientWidth<560){ H.top.style.fontSize=H.bot.style.fontSize='.66rem'; H.bot.style.maxWidth='calc(100% - 6rem)'; } hint(stage,'drag to orbit'); paintValley(); }
  function paintValley(o){ o=o||{}; if(!sc||sc.tab!=='valley') return; const c=o.c==null?c2:o.c, k=o.wallH==null?sc.wallH:o.wallH, xs=o.x==null?Math.max(0,c):o.x, {V,wall,ban,bead,tail,lab,lab2,ctx,hx}=sc;
    wall.setX(c); wall.setH(k); wall.show(k>.001&&Math.abs(c)<=2.5);
    ban.setX(-2.6,Math.max(-2.6,Math.min(2.6,c))); ban.show(k>.3); ban.m.material.opacity=(ctx.isLight?.10:.45)*Math.min(1,k);
    const q=V.at([xs,0],.03); bead.setPos(q); if(xs>.02){ tail.show(true); tail.set(V.at([0,0],.03),q); } else tail.show(false);
    lab.set('w* = ('+F(xs,2)+', 0)',[q[0],q[1]+.3,q[2]],{size:18,color:sc.colors.s4,bg:false,depthTest:false});
    if(k>.3) lab2.set('wall · w₁ ≥ '+F(c,2),[c,1.9*k+.02,-1.5],{size:18,color:sc.colors.s2,bg:false,depthTest:false}); else lab2.hide();
    if(H){ if(k<=.5) H.set('no wall yet · the free bottom is the answer','press ▶ to build the wall at w₁ = '+F(c,2));
      else H.set('w* = (<b>'+F(xs,2)+'</b>, 0) · J* = c²/2 = <b>'+F(xs*xs/2,4)+'</b> · µ* = c = <b>'+F(xs,2)+'</b>',c>0?'the price of the wall is exactly c: push it in by Δc and the bill rises by c·Δc':'the wall is behind the bottom — it costs nothing, µ* = 0'); }
    RR(ctx); }
  /* ---------- scene 3 · standard form: a floor lit on the allowed side, a tilted sheet that flips when a ≥ is multiplied by −1 ---------- */
  const worldOf=(x,y)=>[x-.5,0,-(y-.5)];
  function buildStd(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
    const grid=CIN.prim.grid(ctx,7,28,hx('grid'),{opacity:isLight?.45:.28}); grid.position.y=FLOOR; root.add(grid);
    const hs=new THREE.Group(); root.add(hs);                                          /* the half-space frame: local z runs along the fence, local +x is where a·x + b·y grows */
    const lit=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.MeshBasicMaterial({color:hx('s3'),transparent:true,opacity:isLight?.16:.14,depthWrite:false})); lit.rotation.x=-Math.PI/2; lit.position.y=FLOOR+.004; hs.add(lit);
    const dark=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.MeshBasicMaterial({color:isLight?hx('s2'):0x000000,transparent:true,opacity:isLight?.10:.45,depthWrite:false})); dark.rotation.x=-Math.PI/2; dark.position.y=FLOOR+.003; hs.add(dark);
    const fence=tube(ctx,[0,FLOOR+.01,-3.5],[0,FLOOR+.01,3.5],hx('s2'),.022,.95); hs.add(fence);
    const wall=CIN.prim.glass(ctx,7,.9,hx('s2'),isLight?.14:.16); wall.rotation.y=Math.PI/2; wall.position.y=FLOOR+.45; hs.add(wall);
    const hinge=new THREE.Group(); hs.add(hinge); hinge.position.y=FLOOR+.012;
    const sheet=CIN.prim.glass(ctx,4.2,5,hx('s7'),isLight?.2:.22); sheet.rotation.x=-Math.PI/2; hinge.add(sheet);                                  /* the sign sheet: the graph of the expression, hinged on the fence */
    const sheetEdge=tube(ctx,[-2.1,0,0],[2.1,0,0],hx('s7'),.012,.8); hinge.add(sheetEdge);
    const gArr=overlay(CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('critical'),{radius:.026,head:.18}),11); root.add(gArr);
    const eqLine=tube(ctx,[0,FLOOR+.02,-3.5],[0,FLOOR+.02,3.5],hx('s4'),.03,1); hs.add(eqLine);
    const eqWall=CIN.prim.glass(ctx,7,.32,hx('s4'),isLight?.14:.16); eqWall.rotation.y=Math.PI/2; eqWall.position.y=FLOOR+.16; hs.add(eqWall);
    const dark2=new THREE.Mesh(new THREE.PlaneGeometry(7,7),dark.material); dark2.rotation.x=-Math.PI/2; dark2.position.y=FLOOR+.003; hs.add(dark2);
    const onLine=walkerChar(ctx,hx('s4'),.055); hs.add(onLine.g);
    const ghost=new THREE.Mesh(new THREE.TorusGeometry(.075,.014,10,32),new THREE.MeshStandardMaterial({color:hx('critical'),emissive:hx('critical'),emissiveIntensity:isLight?.2:.8})); ghost.rotation.x=Math.PI/2; root.add(ghost);
    const marchers=[0,1,2,3].map(()=>walkerChar(ctx,hx('s4'),.05));
    const chip=slot(ctx,root), sign=slot(ctx,root), gLab=slot(ctx,root), sideLab=slot(ctx,root), banLab=slot(ctx,root), mLab=[slot(ctx,root),slot(ctx,root),slot(ctx,root)];
    sc={tab:'std',ctx,THREE,root,colors,isLight,hx,hs,lit,dark,dark2,eqWall,onLine,fence,wall,hinge,sheet,sheetEdge,gArr,eqLine,ghost,marchers,chip,sign,gLab,sideLab,banLab,mLab,handle:null,home:null,pitch:null,marchK:4};
    H=hudPair(stage); if(stage.clientWidth<560){ H.top.style.fontSize=H.bot.style.fontSize='.66rem'; H.bot.style.maxWidth='calc(100% - 6rem)'; } hint(stage,'drag to orbit'); paintStd(); }
  function paintStd(o){ o=o||{}; if(!sc||sc.tab!=='std') return; const R=RULES[rule], {hs,lit,dark,dark2,eqWall,onLine,fence,wall,hinge,sheet,sheetEdge,gArr,eqLine,ghost,marchers,chip,sign,gLab,sideLab,banLab,mLab,ctx,hx,colors}=sc;
    const a=R.a,b=R.b, n=Math.hypot(a,b)||1, cw=R.cst-R.cx*a-R.cy*b;                 /* the map is centred on a point of the fence: a·X − b·Z = cw = 0 */
    const P0=[a*cw/(n*n),-b*cw/(n*n)]; hs.position.set(P0[0],0,P0[1]); hs.rotation.y=Math.atan2(b,a);
    const inward=R.side==='le'?-1:1;                                                    /* which local-x side is allowed */
    lit.position.x=inward*3.5; dark.position.x=-inward*3.5; lit.visible=R.side!=='eq'; dark.visible=R.side!=='eq';
    const flip=R.side==='ge', restPitch=-inward*.3, pitch=o.pitch==null?(sc.pitch==null?restPitch:sc.pitch):o.pitch; sc.pitch=pitch;   /* the sheet rises where the expression is positive: in standard form, on the banned side */
    hinge.rotation.z=pitch; hinge.visible=R.side!=='eq'&&R.kind!=='strict';
    const sheetOp=(ctx.isLight?.18:.2)*(o.pulse==null?1:o.pulse); sheet.material.opacity=sheetOp;
    eqLine.visible=R.side==='eq'; eqWall.visible=R.side==='eq'; wall.visible=R.kind==='1d'||R.kind==='strict'; fence.visible=R.side!=='eq';
    dark2.visible=R.side==='eq'; dark2.position.x=3.5; if(R.side==='eq'){ dark.visible=true; dark.position.x=-3.5; } onLine.show(R.side==='eq'); onLine.setPos([0,FLOOR+.07,.6]);
    /* the gradient of the standard-form expression points where g grows: after the flip, into the banned side */
    const gdir=[Math.cos(hs.rotation.y),-Math.sin(hs.rotation.y)];                     /* world direction of local +x */
    const s=pitch>=0?1:-1, standard=pitch*restPitch>0;                                   /* the gradient points where the sheet rises */
    if(R.side==='ge'||R.side==='le'){ gArr.visible=true; const mid=[P0[0],FLOOR+.06,P0[1]]; gArr.userData.set(mid,[mid[0]+gdir[0]*s*.9,mid[1],mid[2]+gdir[1]*s*.9]);
      gLab.set(standard?'∇g · into the banned side':'∇h · not yet standard',[mid[0]+gdir[0]*s*1.0,FLOOR+.34,mid[2]+gdir[1]*s*1.0],{size:17,color:cssv('critical'),bg:false,depthTest:false}); }
    else { gArr.visible=false; gLab.hide(); }
    chip.hide();
    if(o.flipping) sign.set('× (−1)',[P0[0],1.05,P0[1]],{size:26,color:colors.s7,bg:false,depthTest:false}); else sign.hide();
    const fd=[Math.sin(hs.rotation.y),Math.cos(hs.rotation.y)];                          /* world direction along the fence */
    if(R.side!=='eq'){ const s=inward; sideLab.set(R.kind==='strict'?'allowed · but never at 2':'allowed · g ≤ 0',[P0[0]+gdir[0]*s*1.5-fd[0]*1.3,FLOOR+.05,P0[1]+gdir[1]*s*1.5-fd[1]*1.3],{size:17,color:colors.s3,bg:false,depthTest:false}); }
    else sideLab.set('only the line itself is allowed',[P0[0]+fd[0]*1.6,FLOOR+.3,P0[1]+fd[1]*1.6],{size:17,color:colors.s4,bg:false,depthTest:false});
    if(R.side==='ge'||R.side==='le'){ const s2=-inward; banLab.set('banned · g > 0',[P0[0]+gdir[0]*s2*1.5-fd[0]*1.3,FLOOR+.05,P0[1]+gdir[1]*s2*1.5-fd[1]*1.3],{size:17,color:colors.s2,bg:false,depthTest:false}); } else banLab.hide();
    /* the strict beat: a hollow ghost at 2 and a walker hopping 2.1 → 2.01 → 2.001 → 2.0001 toward the wall, leaving dim ghosts */
    ghost.visible=R.kind==='strict'; ghost.position.set(P0[0],FLOOR+.02,P0[1]);
    const seq=['2.1','2.01','2.001','2.0001'], dk=[1.3,.7,.38,.2], K=R.kind==='strict'?(o.marchK==null?sc.marchK:o.marchK):-1;
    marchers.forEach((m,i)=>{ const on=R.kind==='strict'&&i<=K; m.show(on); if(!on) return; m.setPos([P0[0]+dk[i],FLOOR+.06,P0[1]]); m.glow(i===K?1.25:.45); m.dot.material.opacity=i===K?1:.45; m.halo.material.opacity=(ctx.isLight?.32:.65)*(i===K?1:.35); });
    mLab.forEach((l,i)=>{ if(R.kind==='strict'&&i<=Math.min(K,1)) l.set('x = '+seq[i],[P0[0]+dk[i],FLOOR+.3,P0[1]],{size:16,color:colors.s4,bg:false,depthTest:false}); else l.hide(); });
    if(R.kind==='strict') gLab.set('2 · not allowed (hollow)',[P0[0]-.2,FLOOR+.32,P0[1]-.3],{size:16,color:cssv('critical'),bg:false,depthTest:false});
    if(H){ if(R.kind==='strict') H.set('<b>x > 2</b> · no smallest allowed value — no answer','every candidate 2.1, 2.01, 2.001 … is beaten by a smaller one, and 2 itself is banned');
      else if(R.side==='eq') H.set('<b>'+R.rule+'</b> → kept as it is → <b>'+R.std+'</b>','an equality is already standard form');
      else H.set('<b>'+R.rule+'</b> → '+(flip?'× (−1)':'move left')+' → <b>'+R.std+'</b>',R.warn||(flip?'the sheet is the expression: after × (−1) it is ≤ 0 exactly on the lit side':'a ≤ needs no flip: the expression is already ≤ 0 on the lit side')); }
    RR(ctx); }
  /* ---------- build, tabs, stories ---------- */
  function build(){ run++; if(anim){ anim.stop(); anim=null; } sc=null; const narrow=stage.clientWidth<560;
    const cam=tab==='knob'?{pos:narrow?[2.55,3.43,6.94]:[2.22,2.99,5.88],look:[.4,.6,0],fov:36}:tab==='valley'?{pos:narrow?[3.7,4.9,5.2]:[3.2,4.2,4.5],look:[0,.4,0],fov:36}:{pos:narrow?[3.0,5.3,7.1]:[2.5,4.5,6.0],look:[0,0,0],fov:36};
    const handle=CIN.stage3d(stage,{fill:true,camera:cam,autoRotate:.08,autoRotateStopsOnUser:true,
      build(ctx){ if(tab==='knob') buildKnob(ctx); else if(tab==='valley') buildValley(ctx); else buildStd(ctx); },
      update(){ return false; } });
    if(handle&&sc){ sc.handle=handle; const s=handle.ctx.orbit.sph, L=handle.ctx.look; sc.home={theta:s.theta,phi:s.phi,radius:s.radius,look:[L.x,L.y,L.z]}; grab(handle,()=>false,()=>{}); }
    return handle; }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(camA){ camA.stop(); camA=null; } if(lookA){ lookA.stop(); lookA=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.08); }
  function drawRead(){
    if(tab==='knob'){ const xs=Math.max(0,cc), fs=xs*xs, slope=2*xs;
      read.innerHTML='free answer x = <b>0</b>, f = <b>0</b><br>wall at x ≥ <b>'+F(cc,2)+'</b> · answer x* = <b>'+F(xs,2)+'</b>, f* = <b>'+F(fs,2)+'</b><br>slope at the answer f′ = <b>'+F(slope,2)+'</b>';
      if(cc>0){ verd.className='verdict bad'; verd.textContent='bad for the old test — f′(x*) = '+F(slope,2)+' ≠ 0, and yet there is nowhere better to go'; }
      else { verd.className='verdict good'; verd.textContent='good — the wall is not in the way; the free answer survives and f′ = 0 again'; } }
    else if(tab==='valley'){ const xs=Math.max(0,c2);
      read.innerHTML='w* = (<b>'+F(xs,2)+'</b>, 0), J* = <b>'+F(xs*xs/2,4)+'</b>, µ* = <b>'+F(xs,2)+'</b><br>the price of the wall is exactly c: push it in by Δc and the bill rises by c·Δc<br>at c = 1: w* = (1, 0), J* = 0.5, µ* = 1';
      if(c2>0){ verd.className='verdict bad'; verd.textContent='bad for the old test — ∂J/∂w₁ = '+F(xs,2)+' ≠ 0 at the answer: the wall is holding it there'; }
      else { verd.className='verdict good'; verd.textContent='good — the wall is behind the bottom: the free answer (0, 0) survives and µ* = 0'; } }
    else { const R=RULES[rule];
      read.innerHTML='rule: <b>'+R.rule+'</b><br>the move: <b>'+R.move+'</b><br>standard form: <b>'+R.std+'</b>';
      if(R.kind==='strict'){ verd.className='verdict bad'; verd.textContent='bad — no smallest allowed value exists, so the problem has no answer. That is why standard form never uses a strict <.'; }
      else { verd.className='verdict good'; verd.textContent='good — one shape: minimise f subject to g ≤ 0 and e = 0'; } } }
  /* ▶ knob / valley: the wall rises out of the floor, the walker is scraped off the bottom and pressed against it */
  function playWall(){ stop(); const tok=run; if(!sc||sc.tab==='std') return; const h=sc.handle, home=sc.home, knob=sc.tab==='knob', c=knob?cc:c2, {ctx,hx}=sc;
    const P=knob?paintKnob:paintValley; sc.wallH=0;
    if(RM){ sc.wallH=1; P(); return; }
    h.setAutoRotate(0); P({wallH:0,x:0,arrow:false});
    camA=camN(h,{theta:home.theta+.55,phi:Math.min(1.35,home.phi+.1),radius:home.radius*.88},900);
    const foot=knob?[c,FLOOR,0]:[c,FLOOR,0];
    anim=tween(700,()=>{},()=>{ if(tok!==run) return;
      flare(ctx,foot,hx('s2'),900,2.2); sparks(ctx,foot,hx('s2'),8,700);
      anim=tween(850,u=>{ if(tok!==run) return; sc.wallH=u; P({wallH:u,x:0,arrow:false,spark:false}); },()=>{ if(tok!==run) return; sc.wallH=1;
        if(c<=0){ P({x:0}); flare(ctx,knob?[0,.1,0]:sc.V.at([0,0],.06),hx('s3'),900,1.6); finish(); return; }
        anim=tween(800,u=>{ if(tok!==run) return; P({x:c*u,spark:false}); },()=>{ if(tok!==run) return; P(); const q=knob?[c,F1(c)*ZS+.09,0]:sc.V.at([c,0],.05); sparks(ctx,q,hx('s2'),9,650); flare(ctx,q,hx('s4'),800,1.3); finish(); }); }); });
    const finish=()=>{ camA=camN(h,{theta:home.theta,phi:home.phi,radius:home.radius},1200,()=>{ if(tok===run) h.setAutoRotate(.08); }); }; }
  /* ▶ std: replay the current rule's move */
  function playRule(){ stop(); const tok=run; if(!sc||sc.tab!=='std') return; const R=RULES[rule], h=sc.handle, home=sc.home;
    if(R.kind==='strict'){ sc.marchK=0; paintStd({marchK:0}); if(RM){ sc.marchK=3; paintStd(); return; }
      h.setAutoRotate(0); camA=camN(h,{radius:home.radius*.62,phi:Math.min(1.1,home.phi+.12)},800);
      let k=0; const hop=()=>{ if(tok!==run) return; if(k>=3){ paintStd(); camA=camN(h,{radius:home.radius,phi:home.phi},900,()=>{ if(tok===run) h.setAutoRotate(.08); }); return; } anim=tween(650,()=>{},()=>{ if(tok!==run) return; k++; sc.marchK=k; paintStd({marchK:k}); sparks(sc.ctx,[sc.hs.position.x+[1.3,.7,.38,.2][k],FLOOR+.06,sc.hs.position.z],sc.hx('s4'),5,450); hop(); }); }; hop(); return; }
    if(R.side==='eq'){ paintStd({pulse:1}); flare(sc.ctx,[0,FLOOR+.05,0],sc.hx('s4'),900,2.4); return; }
    if(R.side==='le'){ sc.pitch=null; paintStd({pulse:1}); anim=tween(900,u=>{ if(tok!==run) return; paintStd({pulse:1+.9*Math.sin(Math.PI*u)}); }); return; }
    /* a ≥: the sheet starts risen on the allowed side (h ≥ 0), swings through flat, and ends risen on the banned side (g ≤ 0 where allowed) */
    if(RM){ sc.pitch=-.3; paintStd(); return; }
    h.setAutoRotate(0); sc.pitch=.3; paintStd({pitch:.3});
    camA=camN(h,{phi:Math.max(.75,home.phi-.2),radius:home.radius*.92},700);
    anim=tween(700,()=>{},()=>{ if(tok!==run) return;
      anim=tween(1600,u=>{ if(tok!==run) return; paintStd({pitch:.3-.6*u,flipping:true}); },()=>{ if(tok!==run) return; sc.pitch=-.3; paintStd(); flare(sc.ctx,[sc.hs.position.x,FLOOR+.1,sc.hs.position.z],sc.hx('s7'),900,2.2);
        camA=camN(h,{phi:home.phi,radius:home.radius},900,()=>{ if(tok===run) h.setAutoRotate(.08); }); }); }); }
  document.getElementById('wl-play').addEventListener('click',()=>{ if(tab==='std') playRule(); else playWall(); });
  bindCtl('wl-c',v=>{ stop(); cc=v; if(sc&&sc.tab==='knob'){ sc.wallH=1; paintKnob(); } drawRead(); },v=>fmt(v,2))();
  bindCtl('wl-c2',v=>{ stop(); c2=v; if(sc&&sc.tab==='valley'){ sc.wallH=1; paintValley(); } drawRead(); },v=>fmt(v,2))();
  const rbar=document.getElementById('wl-rules');
  ['r1','r2','r3','r4','r5','r6'].forEach(k=>document.getElementById('wl-'+k).addEventListener('click',e=>{ pressOnly(rbar,e.currentTarget); rule=k; if(sc&&sc.tab==='std'){ sc.pitch=null; sc.marchK=4; } drawRead(); playRule(); }));
  tabs(document.getElementById('wl-tabs'),t=>{ stop(); tab=t; showTab(box,t); if(ST&&ST.handle) remount(ST); drawRead(); if(t==='std') setTimeout(()=>{ if(tab==='std') playRule(); },350); });
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const Wd=stage.clientWidth; if((Wd<560)!==(rw<560)) remount(ST); rw=Wd; });
  showTab(box,'knob'); drawRead();
})();

/* ================= W8 · PUSHING A BOX AGAINST A WALL — a corridor, a real box, the push split in two ================= */
(function(){
  const box=document.getElementById('w-arrows'),stage=document.getElementById('ar-3d'),read=document.getElementById('ar-read'),verd=document.getElementById('ar-verdict');
  if(!box||!stage) return;
  const FLOOR=-.12, GAP=.1;
  const ring={at:t=>{ const th=Math.PI*(2*t-1); return [Math.cos(th),Math.sin(th)]; },tan:t=>{ const th=Math.PI*(2*t-1); return [-Math.sin(th),Math.cos(th)]; },gg:(x,y)=>[2*x,2*y],out:(x,y)=>[x,y]};
  const TAB={
    straight:{X:[-1.6,5.4],Y:[-1.6,5.4],eq:true,tStar:0.5,bs:1,f:(x,y)=>x*x+y*y,gf:(x,y)=>[2*x,2*y],at:t=>{ const s=-1.5+7*t; return [s,4-s]; },tan:()=>[Math.SQRT1_2,-Math.SQRT1_2],gg:()=>[1,1],out:()=>[Math.SQRT1_2,Math.SQRT1_2],star:[2,2],mult:'λ',
      view:{theta:Math.PI/4,phi:1.32,radius:4.0},home:{theta:-.55,phi:1.1,radius:5.6}},
    round:Object.assign({X:[-1.9,3.6],Y:[-2.2,2.2],eq:false,tStar:0.5,bs:-1,f:(x,y)=>(x-2)*(x-2)+y*y,gf:(x,y)=>[2*(x-2),2*y],star:[1,0],mult:'µ',view:{theta:0,phi:1.32,radius:3.8},home:{theta:.5,phi:1.1,radius:5.4}},ring),
    ridge:Object.assign({X:[-1.9,3.4],Y:[-1.9,2.6],eq:false,tStar:(Math.atan2(1.2,2.4)/Math.PI+1)/2,bs:-1,f:(x,y)=>(x-2.4)*(x-2.4)+(y-1.2)*(y-1.2),gf:(x,y)=>[2*(x-2.4),2*(y-1.2)],star:[2.4/Math.sqrt(7.2),1.2/Math.sqrt(7.2)],mult:'µ',view:{theta:.464,phi:1.32,radius:3.8},home:{theta:.5,phi:1.1,radius:5.4}},ring) };
  let tab='straight',t=0.74,sc=null,H=null,ST=null,run=0,anim=null,camA=null,wasThere=false;
  const camN=(h,to,dur,done)=>{ if(to.theta!=null){ const s=h.ctx.orbit.sph; s.theta=to.theta+Math.atan2(Math.sin(s.theta-to.theta),Math.cos(s.theta-to.theta)); } return camTo(h,to,dur,done); };
  function geom(R){ const S=Math.min(4.4/(R.X[1]-R.X[0]),4.4/(R.Y[1]-R.Y[0])), CX=(R.X[0]+R.X[1])/2, CY=(R.Y[0]+R.Y[1])/2;
    let mx=0; [[R.X[0],R.Y[0]],[R.X[0],R.Y[1]],[R.X[1],R.Y[0]],[R.X[1],R.Y[1]]].forEach(p=>{ mx=Math.max(mx,R.f(p[0],p[1])); }); const ZS=.5/(mx||1);
    const fs=(u,v)=>R.f(u/S+CX,v/S+CY), U=[(R.X[0]-CX)*S,(R.X[1]-CX)*S], V=[(R.Y[0]-CY)*S,(R.Y[1]-CY)*S];
    return {S,CX,CY,ZS,fs,U,V,mx,at:(x,y)=>[(x-CX)*S,R.f(x,y)*ZS,-(y-CY)*S],toMath:p=>[p.x/S+CX,-p.z/S+CY]}; }
  const wv=(v,s)=>[v[0]*s,0,-v[1]*s];
  /* a glass wall whose foot follows the landscape: a vertical ribbon over a polyline, with lit foot and top edges */
  function wallRibbon(ctx,pts,h,color){ const {THREE,isLight}=ctx, n=pts.length, pos=new Float32Array(n*6), idx=[];
    for(let i=0;i<n;i++){ pos.set([pts[i][0],pts[i][1],pts[i][2]],i*6); pos.set([pts[i][0],pts[i][1]+h,pts[i][2]],i*6+3); if(i<n-1){ const a=2*i; idx.push(a,a+1,a+2,a+1,a+3,a+2); } }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); const grp=new THREE.Group();
    grp.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:isLight?.12:.4,transparent:true,opacity:isLight?.26:.36,side:THREE.DoubleSide,roughness:.2,metalness:.1,depthWrite:false})));
    grp.add(polyTube(ctx,pts,color,.016,false)); grp.add(polyTube(ctx,pts.map(p=>[p[0],p[1]+h,p[2]]),color,.009,false)); return grp; }
  function build(){ run++; if(anim){ anim.stop(); anim=null; } sc=null; const narrow=stage.clientWidth<560, R=TAB[tab], G=geom(R), hm=R.home;
    const lk=[0,.15,0], rad=hm.radius*(narrow?1.2:1), pos=[lk[0]+rad*Math.sin(hm.phi)*Math.sin(hm.theta),lk[1]+rad*Math.cos(hm.phi),lk[2]+rad*Math.sin(hm.phi)*Math.cos(hm.theta)];
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos,look:lk,fov:36},autoRotate:.08,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const surf=CIN.prim.surface(ctx,G.fs,{x:G.U,y:G.V,res:66,zscale:G.ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:.92,wire:false}); lightenSurface(ctx,surf,G.ZS); root.add(surf);
        if(isLight){ const col=surf.userData.geo.attributes.color; for(let i=0;i<col.count;i++) col.setXYZ(i,col.getX(i)+(1-col.getX(i))*.3,col.getY(i)+(1-col.getY(i))*.3,col.getZ(i)+(1-col.getZ(i))*.3); col.needsUpdate=true; }
        const grid=CIN.prim.grid(ctx,7,28,hx('grid'),{opacity:isLight?.45:.28}); grid.position.y=FLOOR; root.add(grid);
        const lv=[]; for(let i=1;i<=9;i++) lv.push(G.mx*Math.pow(i/10,2.1)); root.add(liftedContours(ctx,G.fs,lv,G.U[0],G.U[1],G.V[0],G.V[1],G.ZS,hx('ink2'),{N:70,opacity:isLight?.5:.6}));
        let wall; if(R.eq){ const pts=[]; for(let i=0;i<=40;i++){ const P=R.at(i/40), q=G.at(P[0],P[1]); q[1]+=.012; pts.push(q); } wall=wallRibbon(ctx,pts,.78,hx('s2')); root.add(wall); }
        else { const pts=[]; for(let i=0;i<=72;i++){ const P=R.at(i/72), q=G.at(P[0],P[1]); q[1]+=.012; pts.push(q); } wall=wallRibbon(ctx,pts,.7,hx('s2')); root.add(wall); const m=G.at(0,0);
          const disc=new THREE.Mesh(new THREE.CircleGeometry(G.S,64),new THREE.MeshBasicMaterial({color:hx('s3'),transparent:true,opacity:isLight?.14:.13,depthWrite:false})); disc.rotation.x=-Math.PI/2; disc.position.set(m[0],FLOOR+.006,m[2]); root.add(disc);
          if(tab!=='ridge') root.add(CIN.prim.label(ctx,'allowed',[m[0],FLOOR+.02,m[2]+.35],{size:17,color:colors.s3,bg:false,depthTest:false})); }
        const star=overlay(CIN.prim.dot(ctx,G.at(R.star[0],R.star[1]).map((v,i)=>i===1?v+.02:v),hx('s3'),.04),9); root.add(star);
        const bx=new THREE.Group(); root.add(bx);
        const cube=new THREE.Mesh(new THREE.BoxGeometry(.16,.16,.16),new THREE.MeshStandardMaterial({color:hx('s4'),emissive:hx('s4'),emissiveIntensity:isLight?.18:.55,roughness:.35,metalness:.15})); bx.add(cube);
        const edges=new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry),new THREE.LineBasicMaterial({color:isLight?0x3a2a00:0xfff2c8,transparent:true,opacity:.7})); bx.add(edges);
        const halo=haloSprite(ctx,hx('s4'),.6); bx.add(halo);
        const sh=new THREE.Mesh(new THREE.CircleGeometry(.13,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:isLight?.12:.35,depthWrite:false})); sh.rotation.x=-Math.PI/2; sh.position.y=-.085; bx.add(sh);
        const mk=(col,r,hd)=>{ const a=overlay(CIN.prim.arrow(ctx,[0,0,0],[1,0,0],col,{radius:r,head:hd}),11); root.add(a); return a; };
        const push=mk(hx('s2'),.028,.18), along=mk(hx('s7'),.024,.15), into=mk(hx('s4'),.022,.14), grad=mk(hx('s1'),.022,.15);
        const hit=haloSprite(ctx,hx('s4'),.42); root.add(hit);
        const scuff=trailRibbon(ctx,hx('s7'),.012);
        const plane=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})); plane.rotation.x=-Math.PI/2; plane.position.y=FLOOR+.06; root.add(plane);
        const lPush=slot(ctx,root), lAlong=slot(ctx,root), lGrad=slot(ctx,root);
        if(tab==='ridge') root.add(CIN.prim.label(ctx,'ridge regression · shrink until the budget circle is just touched',[0,1.0,-2.3],{size:19,bg:true,depthTest:false}));
        sc={ctx,THREE,root,colors,isLight,hx,R,G,wall,bx,cube,push,along,into,grad,hit,scuff,plane,lPush,lAlong,lGrad,handle:null,home:null,tabKey:tab};
        H=hudPair(stage); if(narrow){ H.top.style.fontSize=H.bot.style.fontSize='.66rem'; H.bot.style.maxWidth='calc(100% - 6rem)'; } hint(stage,'drag to orbit · drag the box'); paint(); cap('slide t = <b>'+F(t,3)+'</b> · drag the box along the wall, or press ▶'); },
      update(ctx){ if(sc&&sc.tabKey===tab) markBox(); return false; } });
    if(handle&&sc){ sc.handle=handle; const s=handle.ctx.orbit.sph, L=handle.ctx.look; sc.home={theta:s.theta,phi:s.phi,radius:s.radius,look:[L.x,L.y,L.z]};
      const pick=picker(handle,()=>sc&&sc.plane);
      grab(handle,e=>{ if(!sc) return false; const p=pick(e); if(!p) return false; const B=sc.bx.position; if(Math.hypot(p.x-B.x,p.z-B.z)>.55) return false; stop(); cap('sliding the box along the wall…'); return true; },
        e=>{ if(!sc) return; const p=pick(e); if(!p) return; t=nearestT(sc.G.toMath(p)); setCtl('ar-t',t,v=>fmt(v,3)); draw(); scuffPush(); },()=>{ draw(); }); }
    return handle; }
  function markBox(){ const {bx,ctx}=sc, v=new sc.THREE.Vector3(bx.position.x,bx.position.y,bx.position.z).project(ctx.camera); stage.dataset.box=((v.x+1)/2*ctx.size.w).toFixed(0)+','+((1-v.y)/2*ctx.size.h).toFixed(0); }   /* verify hook: where the box is on screen */
  function nearestT(m){ const R=TAB[tab]; let best=t,bd=Infinity; for(let i=0;i<=600;i++){ const tt=i/600, P=R.at(tt), d=(P[0]-m[0])*(P[0]-m[0])+(P[1]-m[1])*(P[1]-m[1]); if(d<bd){ bd=d; best=tt; } } return best; }
  function scuffPush(){ if(!sc) return; const B=sc.bx.position; sc.scuff.push([B.x,B.y-.06,B.z]); sc.scuff.fade(.4); }
  function parts(tt){ const R=TAB[tab], P=R.at(tt), gf=R.gf(P[0],P[1]), gg=R.gg(P[0],P[1]), tn=R.tan(tt);
    const along=-(gf[0]*tn[0]+gf[1]*tn[1]), acr=[-gf[0]-along*tn[0],-gf[1]-along*tn[1]];
    return {P,gf,gg,tn,along,acr,out:R.out(P[0],P[1]),ang:angleDeg(gf,gg),st:Math.hypot(gf[0],gf[1])/(Math.hypot(gg[0],gg[1])||1)}; }
  function paint(cur){ if(!sc||sc.tabKey!==tab) return; const R=sc.R, G=sc.G, tt=cur==null?t:cur, {bx,push,along,into,grad,hit,lPush,lAlong,lGrad,ctx,colors}=sc, Q=parts(tt);
    const gap=GAP/G.S, bp=[Q.P[0]+R.bs*Q.out[0]*gap,Q.P[1]+R.bs*Q.out[1]*gap], B=G.at(bp[0],bp[1]); B[1]+=.1; bx.position.set(B[0],B[1],B[2]);
    bx.rotation.y=Math.atan2(Q.out[1],Q.out[0]);                                       /* a face flush with the wall */
    const gn=Math.hypot(Q.gf[0],Q.gf[1])||1e-9, sc1=Math.min(1.3,.35+.11*gn)/gn, A=[B[0],B[1],B[2]];
    const tip=(v,s)=>{ const w=wv(v,s); return [A[0]+w[0],A[1],A[2]+w[2]]; };
    push.userData.set(A,tip([-Q.gf[0],-Q.gf[1]],sc1));
    const al=Math.abs(Q.along); along.visible=al>.02; if(al>.02) along.userData.set(A,tip([Q.along*Q.tn[0],Q.along*Q.tn[1]],sc1));
    const an=Math.hypot(Q.acr[0],Q.acr[1]); into.visible=an>.02; if(an>.02) into.userData.set(A,tip(Q.acr,sc1));
    const gg=Math.hypot(Q.gg[0],Q.gg[1])||1e-9, sc2=Math.min(.95,.4+.06*gg)/gg, A2=[A[0],A[1]+.085,A[2]]; grad.userData.set(A2,tip(Q.gg,sc2).map((v,i)=>i===1?v+.085:v));   /* ∇g rides a little above the push so the two stay readable when they line up */
    const W0=G.at(Q.P[0],Q.P[1]); hit.position.set(W0[0],W0[1]+.1,W0[2]); hit.visible=an>.02; hit.material.opacity=(ctx.isLight?.3:.6)*Math.min(1,an/4);
    const beyond=(v,s,d)=>{ const w=wv(v,s), L=Math.hypot(w[0],w[2])||1; return [A[0]+w[0]+w[0]/L*d,A[1]+.16,A[2]+w[2]+w[2]/L*d]; };
    lPush.set('−∇f · the push',beyond([-Q.gf[0],-Q.gf[1]],sc1,.42),{size:16,color:colors.s2,bg:false,depthTest:false});
    if(al>.02) lAlong.set('along the wall · '+F(al,2),beyond([Q.along*Q.tn[0],Q.along*Q.tn[1]],sc1,.5),{size:16,color:colors.s7,bg:false,depthTest:false}); else lAlong.hide();
    lGrad.set(R.eq?'∇h':'∇g',beyond(Q.gg,sc2,.22).map((v,i)=>i===1?v+.14:v),{size:16,color:colors.s1,bg:false,depthTest:false});
    if(H){ const gname=R.eq?'∇h':'∇g';
      if(al<.02) H.top.innerHTML='nothing left to slide · ∇f = '+(R.eq?'λ∇h':'−µ∇g')+' · stretch '+R.mult+' = <b>'+F(Q.st,4)+'</b>';
      else H.top.innerHTML='angle(∇f, '+gname+') = <b>'+(isNaN(Q.ang)?'—':F(Q.ang,1)+'°')+'</b> · along the wall = <b>'+F(al,4)+'</b> · stretch = <b>'+F(Q.st,4)+'</b>'; }
    RR(ctx); }
  function cap(html){ if(!H) return; H.bot.innerHTML=html||''; H.bot.style.display=html?'':'none'; }
  function draw(){ const R=TAB[tab], Q=parts(t), gname=R.eq?'∇h':'∇g', al=Math.abs(Q.along);
    let s='angle between ∇f and '+gname+': <b>'+(isNaN(Q.ang)?'—':F(Q.ang,1)+'°')+'</b><br>along-the-fence part of ∇f: <b>'+F(al,4)+'</b> · stretch factor: <b>'+F(Q.st,4)+'</b> ('+(R.eq?'∇f = λ∇h':'∇f = −µ∇g')+')<br>';
    if(tab==='straight') s+='at the answer (2, 2): ∇f = (4, 4), ∇h = (1, 1), λ = <b>4</b>, f* = <b>8</b>';
    else if(tab==='round') s+='at the answer (1, 0): ∇f = (−2, 0), ∇g = (2, 0), µ = <b>1</b>, f* = <b>1</b>';
    else s+='touching point (2.4, 1.2)/‖(2.4, 1.2)‖ = (<b>0.8944</b>, <b>0.4472</b>) — β₁ = 0.8944, β₂ = 0.4472';
    read.innerHTML=s;
    if(al<.02&&!wasThere&&sc&&!anim){ const B=sc.bx.position; flare(sc.ctx,[B.x,B.y,B.z],sc.hx('s4'),800,1.5); } wasThere=al<.02;
    if(al<.02){ verd.className='verdict good'; verd.textContent='good — nothing left to slide: all of ∇f points across the fence'; }
    else { verd.className='verdict info'; verd.textContent='info — there is still '+F(al,3)+' of downhill running ALONG the fence: keep sliding that way →'; }
    paint(); if(H&&!anim) cap('slide t = <b>'+F(t,3)+'</b> · drag the box along the wall, or press ▶'); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(camA){ camA.stop(); camA=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.08); }
  function play(){ stop(); const tok=run, R=TAB[tab], t0=(R.tStar+0.26)%1, t1=R.tStar; t=t0; setCtl('ar-t',t0,v=>fmt(v,3)); if(sc) sc.scuff.reset(); draw();
    if(RM||!sc){ t=t1; setCtl('ar-t',t1,v=>fmt(v,3)); draw(); return; }
    const h=sc.handle, home=sc.home; h.setAutoRotate(0); cap('the push still has an along-the-wall part — the box slides');
    camA=camN(h,Object.assign({},R.view),900);
    anim=tween(800,()=>{},()=>{ if(tok!==run) return; let fr=0;
      anim=tween(3000,u=>{ if(tok!==run) return; t=t0+(t1-t0)*u; setCtl('ar-t',t,v=>fmt(v,3)); paint(); if((fr++)%3===0) scuffPush(); },()=>{ if(tok!==run) return; t=t1; paint(); const B=sc.bx.position; flare(sc.ctx,[B.x,B.y,B.z],sc.hx('s4'),900,1.7);
        cap('nothing left to slide · the push and '+(R.eq?'∇h':'∇g')+' lie on one line · '+R.mult+' = <b>'+F(parts(t1).st,4)+'</b>');
        anim=tween(600,()=>{},()=>{ if(tok!==run) return; camA=camN(h,{theta:home.theta,phi:home.phi,radius:home.radius},1200,()=>{ if(tok===run){ h.setAutoRotate(.08); anim=null; draw(); } }); }); }); }); }
  document.getElementById('ar-play').addEventListener('click',play);
  bindCtl('ar-t',v=>{ stop(); t=v; draw(); scuffPush(); },v=>fmt(v,3))();
  tabs(document.getElementById('ar-tabs'),k=>{ stop(); tab=k; t=0.74; setCtl('ar-t',t,3); draw(); if(ST&&ST.handle) remount(ST); });
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const Wd=stage.clientWidth; if((Wd<560)!==(rw<560)) remount(ST); rw=Wd; });
  draw();
})();

/* ================= W9 · TURN THE WALL INTO A FINE — the two panels, lifted: light columns, lasers, a climbing bead, a burst ================= */
(function(){
  const box=document.getElementById('w-fine'),svg=document.getElementById('fn-svg'),read=document.getElementById('fn-read'),verd=document.getElementById('fn-verdict');
  if(!box||!svg) return;
  let mu=2,anim=null,run=0,burst=null,sprint=0,sprintA=null,wasNeg=false,lastBurst=-1;
  const hist=[];                                                   /* the bead's recent positions → its trailing glow */
  const dOf=m=>2*m-m*m/4, F1=x=>(x-3)*(x-3);
  /* a glowing vertical light column: a wide translucent band + a crisp line under the glow */
  function column(parent,x,y0,y1,color,w,glow){ const g=el('g',{},parent);
    el('rect',{x:x-w*2.4,y:Math.min(y0,y1),width:w*4.8,height:Math.abs(y1-y0),fill:color,opacity:.14},g);
    el('rect',{x:x-w,y:Math.min(y0,y1),width:w*2,height:Math.abs(y1-y0),fill:color,opacity:.3},g);
    el('line',Object.assign({x1:x,y1:y0,x2:x,y2:y1,stroke:color,'stroke-width':w*.7,'stroke-linecap':'round'},glow?{filter:glow}:{}),g); return g; }
  function drawWall(glow){ const p=panel(svg,46,24,536,150,-2,2,-3.2,6.2,{xs:.5,ys:2,xt:true,yt:true});
    const gp=el('g',{'clip-path':p.clip},svg), hp=hatchPat(svg,'fn-h',CV('s2'),.5);
    txt(svg,p.x,p.y-8,'the infinite wall 𝟙(g), and the straight line µg trying to do its job','font:600 10.5px system-ui;fill:var(--ink-muted)');
    el('rect',{x:p.px(0),y:p.y,width:p.px(2)-p.px(0),height:p.h,fill:'var(--ink)',opacity:.12},gp);
    el('rect',{x:p.px(0),y:p.y,width:p.px(2)-p.px(0),height:p.h,fill:hp,opacity:.7},gp);
    el('rect',{x:p.px(-2),y:p.y,width:p.px(0)-p.px(-2),height:p.h,fill:CV('s3'),opacity:.05},gp);
    txt(svg,p.px(1),p.y+16,'banned:  g > 0','font:800 11px system-ui;fill:'+CV('s2'),'middle');
    txt(svg,p.px(-1),p.y+16,'allowed:  g ≤ 0','font:800 11px system-ui;fill:'+CV('s3'),'middle');
    glowLine(gp,p.px(-2),p.py(0),p.px(0),p.py(0),CV('s2'),3.4,glow);
    column(gp,p.px(0),p.py(0),p.y+2,CV('s2'),5,glow);
    el('polygon',{points:p.px(0)+','+(p.y-2)+' '+(p.px(0)-6)+','+(p.y+10)+' '+(p.px(0)+6)+','+(p.y+10),fill:CV('s2')},svg);
    txt(svg,p.px(0)+10,p.y+34,'𝟙(g) = ∞','font:800 11px system-ui;fill:'+CV('s2'));
    const col=mu<0?CV('critical'):CV('s3');
    const xa=Math.abs(mu)>1e-9?Math.max(-2,Math.min(2,-3.2/mu)):-2, xb=Math.abs(mu)>1e-9?Math.max(-2,Math.min(2,6.2/mu)):2, x0=Math.min(xa,xb), x1=Math.max(xa,xb);
    glowPath(gp,'M'+p.px(x0).toFixed(1)+','+p.py(mu*x0).toFixed(1)+'L'+p.px(x1).toFixed(1)+','+p.py(mu*x1).toFixed(1),col,3,glow,{});
    txt(svg,p.px(1.6),p.cy(p.py(mu*1.6))-9,'µg','font:800 12px system-ui;fill:'+col,'middle');
    glowDot(svg,p.px(0.5),p.cy(p.py(mu*0.5)),5,col,glow);
    if(mu<0){ /* the amber walker, paid to run: a motion streak of fading circles and the walker sprinting off the right edge */
      const xw=0.55+1.5*sprint, yw=x=>p.cy(p.py(mu*x)-10);
      for(let i=1;i<=8;i++){ const x=xw-i*.15; if(x<0.5) break; el('circle',{cx:p.px(x),cy:yw(x),r:6-i*.55,fill:CV('s4'),opacity:.5-i*.055},gp); }
      const g=el('g',glow?{filter:glow}:{},gp); el('circle',{cx:p.px(xw),cy:yw(xw),r:8,fill:CV('s4')},g); el('circle',{cx:p.px(xw),cy:yw(xw),r:14,fill:CV('s4'),opacity:.25},g);
      txt(svg,p.px(1.0),p.y+p.h-12,'paid to run →','font:800 11px system-ui;fill:'+CV('critical'),'middle'); }
    txt(svg,p.x+p.w,p.y+p.h+26,'g →','font:600 9.5px system-ui;fill:var(--ink-muted)','end'); }
  function drawBill(glow){ const p=panel(svg,46,222,536,170,-1,6,-1.5,12,{xs:1,ys:3,xt:true,yt:true});
    const gp=el('g',{'clip-path':p.clip},svg), hp=hatchPat(svg,'fn-h2',CV('s2'),.5);
    txt(svg,p.x,p.y-8,'f(x) = (x − 3)²  ·  fence x ≤ 1  ·  L(x, µ) = f + µ(x − 1)','font:600 10.5px system-ui;fill:var(--ink-muted)');
    el('rect',{x:p.px(1),y:p.y,width:p.px(6)-p.px(1),height:p.h,fill:'var(--ink)',opacity:.10},gp);
    el('rect',{x:p.px(1),y:p.y,width:p.px(6)-p.px(1),height:p.h,fill:hp,opacity:.5},gp);
    const L1=x=>F1(x)+mu*(x-1); let d1='',d2='',d3='';
    for(let i=0;i<=160;i++){ const x=-1+7*i/160; d1+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(F1(x))).toFixed(1); d3+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(L1(x))).toFixed(1); }
    for(let i=0;i<=80;i++){ const x=-1+2*i/80; d2+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(F1(x))).toFixed(1); }
    glowPath(gp,d1,CV('s1'),2.4,glow,{opacity:.85});
    glowPath(gp,d2,CV('s2'),3.6,glow,{});
    column(gp,p.px(1),p.cy(p.py(4)),p.y+2,CV('s2'),5,glow);
    txt(svg,p.px(1)+9,p.y+16,'the true bill  J = f + 𝟙','font:800 10.5px system-ui;fill:'+CV('s2'));
    const col=mu<0?CV('critical'):CV('s3');
    glowPath(gp,d3,col,3,glow,{});
    el('line',{x1:p.px(-1),y1:p.cy(p.py(4)),x2:p.px(6),y2:p.cy(p.py(4)),stroke:CV('s4'),'stroke-width':1.5,'stroke-dasharray':'6 4'},svg);
    txt(svg,p.px(6)-4,p.cy(p.py(4))-6,'p* = 4','font:800 10.5px system-ui;fill:'+CV('s4'),'end');
    glowDot(svg,p.px(1),p.cy(p.py(4)),5,CV('s4'),glow);
    const xm=3-mu/2, dv=dOf(mu), bx=p.px(Math.max(-1,Math.min(6,xm))), by=p.cy(p.py(L1(Math.max(-1,Math.min(6,xm)))));
    hist.forEach((h,i)=>{ const k=(i+1)/(hist.length+1); el('circle',{cx:h[0],cy:h[1],r:3+4*k,fill:col,opacity:.05+.22*k},gp); });
    glowDot(svg,bx,by,6.5,col,glow);
    txt(svg,bx,by+(mu<4?-14:20),'min L = d(µ) = '+F(dv,3),'font:800 10.5px system-ui;fill:'+col,'middle');
    if(burst){ const u=burst.u; el('circle',{cx:p.px(1),cy:p.cy(p.py(4)),r:8+46*u,fill:'none',stroke:CV('s4'),'stroke-width':3.5*(1-u)+.5,opacity:(1-u)*.9},svg);
      el('circle',{cx:p.px(1),cy:p.cy(p.py(4)),r:6+26*u,fill:CV('s4'),opacity:(1-u)*.45},svg); }
    txt(svg,p.x+p.w,p.y+p.h+26,'x →','font:600 9.5px system-ui;fill:var(--ink-muted)','end');
    return [bx,by]; }
  function draw(){ svg.innerHTML=''; const glow=glo(svg); drawWall(glow); const b=drawBill(glow);
    if(!hist.length||Math.hypot(hist[hist.length-1][0]-b[0],hist[hist.length-1][1]-b[1])>1.5) hist.push(b); if(hist.length>7) hist.shift();
    const dv=dOf(mu), at=mu*0.5;
    read.innerHTML='µ = <b>'+F(mu,2)+'</b>  ·  line at g = +0.5: <b>'+F(at,3)+'</b>  vs  wall: <b>∞</b><br>'+
      'min over x of L = d(µ) = <b>2µ − µ²/4</b> = <b>'+F(dv,4)+'</b>  (at x = '+F(3-mu/2,3)+')<br>'+
      'f* on the allowed side = <b>4</b>  ·  gap still open = <b>'+F(4-dv,4)+'</b>';
    if(mu<0){ verd.className='verdict bad'; verd.textContent='bad — a negative fine PAYS you to trespass. That is why µ ≥ 0.'; }
    else if(Math.abs(mu-4)<1e-9){ verd.className='verdict good'; verd.textContent='good — at µ = 4 the straight line does the wall’s whole job: d(4) = 4 = p*'; }
    else if(mu>4){ verd.className='verdict info'; verd.textContent='info — past µ = 4 the fine over-charges and d falls again: d is concave, and 4 is its peak'; }
    else { verd.className='verdict info'; verd.textContent='info — the fine is too small: the cheapest point is still on the banned side, so d(µ) = '+F(dv,3)+' < 4'; } }
  function fx(){ /* the burst when µ touches 4, the sprint when µ goes negative — both survive redraws because draw() reads their state */
    if(Math.abs(mu-4)<.06&&performance.now()-lastBurst>600){ lastBurst=performance.now(); const b={u:0}; burst=b;
      if(!RM) tween(750,u=>{ b.u=u; if(burst===b) draw(); },()=>{ if(burst===b){ burst=null; draw(); } }); else burst=null; }
    if(mu<0&&!wasNeg){ if(sprintA) sprintA.stop(); sprint=0; sprintA=tween(700,u=>{ sprint=u; draw(); }); }
    wasNeg=mu<0; }
  function setMu(v){ mu=v; if(!anim) hist.length=0; fx(); draw(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run; hist.length=0;
    if(RM){ setMu(4); setCtl('fn-mu',4,1); return; }
    anim=tween(5000,u=>{ if(tok!==run) return; const v=u<.5?16*u:8-16*(u-.5); const m=Math.round(Math.max(-2,Math.min(12,v))*10)/10; setCtl('fn-mu',m,x=>fmt(x,1)); setMu(m); },
      ()=>{ if(tok!==run) return; setCtl('fn-mu',0,x=>fmt(x,1)); setMu(0); }); }
  document.getElementById('fn-play').addEventListener('click',play);
  const preBar=document.getElementById('fn-pre');
  [['fn-p-zero',0],['fn-p-star',4],['fn-p-neg',-1]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{ pressOnly(preBar,e.currentTarget); stop(); setCtl('fn-mu',v,1); setMu(v); }));
  let booted=false; bindCtl('fn-mu',v=>{ stop(); if(booted) pressOnly(preBar,null); setMu(v); },v=>fmt(v,1))(); booted=true;
})();

/* ================= W10 · ROOM LEFT — a corridor, a wall, a bead on two rails over a chasm, a slack ledger ================= */
(function(){
  const box=document.getElementById('w-room'),stage=document.getElementById('rm-3d'),read=document.getElementById('rm-read'),verd=document.getElementById('rm-verdict');
  if(!box||!stage) return;
  const PULL=1.8, FLOOR=-.12, TILE=1.2, KR=TILE/2.6, KM=TILE/2.4;               /* room ∈ [0, 2.6] and µ ∈ [0, 2.4] map across the tile */
  let tab='one',x1=-1.2,x2=-0.4,climb=1,sc=null,H=null,ST=null,run=0,anim=null,camA=null,lookA=null,lastSpark=0;
  const camN=(h,to,dur,done)=>{ if(to.theta!=null){ const s=h.ctx.orbit.sph; s.theta=to.theta+Math.atan2(Math.sin(s.theta-to.theta),Math.cos(s.theta-to.theta)); } return camTo(h,to,dur,done); };
  const state=x=>{ const g=x; if(x<=-0.015) return {g,room:-g,mu:0,k:'inside'}; if(x<=0.005) return {g:0,room:0,mu:PULL,k:'touch'}; return {g,room:-g,mu:0,k:'out'}; };
  /* a corridor along x at depth z: a lit strip, its edges, a glass wall at x = 0, a dark floor beyond it, a walker and the room-left segment */
  function corridor(ctx,z,w,col){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx); const g=new THREE.Group(); root.add(g); g.position.z=z;
    const strip=new THREE.Mesh(new THREE.PlaneGeometry(3.4,w),new THREE.MeshBasicMaterial({color:hx('s3'),transparent:true,opacity:isLight?.12:.11,depthWrite:false})); strip.rotation.x=-Math.PI/2; strip.position.set(-1.0,FLOOR+.004,0); g.add(strip);
    [-w/2,w/2].forEach(zz=>g.add(tube(ctx,[-2.7,FLOOR+.006,zz],[.7,FLOOR+.006,zz],hx('s3'),.008,.45)));
    const room=new THREE.Mesh(new THREE.PlaneGeometry(1,w*.86),new THREE.MeshBasicMaterial({color:hx('s3'),transparent:true,opacity:isLight?.28:.3,depthWrite:false})); room.rotation.x=-Math.PI/2; room.position.y=FLOOR+.008; g.add(room);
    const wall=wallPanel(ctx,{h:1.0,w:w+.25}); g.add(wall.g); const ban=bannedFloor(ctx,{w:1,d:w+.25}); g.add(ban.m); ban.setX(0,.75);
    const walker=walkerChar(ctx,col,.062); g.add(walker.g);
    return {g,strip,room,wall,ban,walker,col,z}; }
  function paintCorridor(C,x,S,ctx){ const hx=hxOf(ctx); C.walker.setPos([x,FLOOR+.07,0]);
    const wc=S.k==='out'?hx('critical'):hx('s2'); if(C.wallCol!==wc){ C.wallCol=wc; C.wall.g.traverse(m=>{ if(m.material&&m.material.color){ m.material.color.set(wc); if(m.material.emissive) m.material.emissive.set(wc); } }); }
    const r=Math.max(0,Math.min(2.7,S.room)); C.room.scale.x=Math.max(.001,r); C.room.position.x=-r/2; C.room.visible=S.k!=='out';
    const out=S.k==='out'; C.ban.m.material.color.set(out?hx('critical'):(ctx.isLight?hx('s2'):0x000000)); C.ban.m.material.opacity=out?(ctx.isLight?.28:.42):(ctx.isLight?.10:.45);
    C.strip.material.color.set(out?hx('critical'):hx('s3')); C.strip.material.opacity=out?(ctx.isLight?.16:.14):(ctx.isLight?.12:.11);
    C.walker.glow(out?1.3:(S.k==='touch'?1.15:1)); }
  /* the two-worlds tile: two lit rails meeting at a corner, a dark pit between them, a bead that rides the rails */
  function tile(ctx,pos,size,cols){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx); const g=new THREE.Group(); root.add(g); g.position.set(pos[0],FLOOR,pos[2]);
    const wallM=new THREE.MeshStandardMaterial({color:isLight?0x3a4058:0x1a2136,roughness:.95,side:THREE.BackSide}), botM=new THREE.MeshBasicMaterial({color:isLight?0x0d1020:0x000000,side:THREE.BackSide}), none=new THREE.MeshBasicMaterial({visible:false});
    const pit=new THREE.Mesh(new THREE.BoxGeometry(size,size*.5,size),[wallM,wallM,none,botM,wallM,wallM]); pit.position.set(-size/2,-size*.25,size/2); g.add(pit);   /* open at the top: the inside walls and the floor of the chasm */
    const cap=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({colorWrite:false})); cap.rotation.x=-Math.PI/2; cap.position.set(-size/2,.001,size/2); cap.renderOrder=1; g.add(cap);   /* writes depth only: the floor grid stops at the rim */
    [[[-size,0,0],[-size,0,size]],[[-size,0,size],[0,0,size]]].forEach(([a,b])=>g.add(tube(ctx,[a[0],.006,a[2]],[b[0],.006,b[2]],hx('ink2'),.006,.5)));
    g.add(tube(ctx,[0,.012,0],[-size,.012,0],hx('s3'),.02,1));                     /* the room rail: µ = 0 */
    g.add(tube(ctx,[0,.012,0],[0,.012,size],hx('s2'),.02,1));                      /* the µ rail: g = 0 */
    const beads=cols.map(c=>{ const d=overlay(CIN.prim.dot(ctx,[0,.05,0],c,size>1?.05:.03),12); g.add(d); const h=haloSprite(ctx,c,size>1?.5:.3); g.add(h); return {d,h,c}; });
    return {g,pit,beads,size}; }
  function placeBead(T,i,S,cl,ctx){ const b=T.beads[i], s=T.size/1.2, hx=hxOf(ctx); let p;
    if(S.k==='inside') p=[-Math.min(2.6,S.room)*KR*s,.05,0]; else if(S.k==='touch') p=[0,.05,S.mu*(cl==null?1:cl)*KM*s]; else p=[Math.min(.6,S.room<0?-S.room:0)*KR*s+.12*s,.05,0];
    b.d.position.set(...p); b.h.position.set(...p); b.d.material.color.set(S.k==='out'?hx('critical'):b.c); b.d.material.emissive.set(S.k==='out'?hx('critical'):b.c); b.h.material.color.set(S.k==='out'?hx('critical'):b.c); }
  function build(){ run++; if(anim){ anim.stop(); anim=null; } sc=null; const narrow=stage.clientWidth<560;
    const cam={pos:narrow?[1.9,3.6,5.7]:[1.42,3.05,4.89],look:[-1.0,.15,.5],fov:36};
    const handle=CIN.stage3d(stage,{fill:true,camera:cam,autoRotate:.08,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const grid=CIN.prim.grid(ctx,7,28,hx('grid'),{opacity:isLight?.45:.28}); grid.position.y=FLOOR; grid.renderOrder=2; root.add(grid);
        if(tab==='one'){
          const C=corridor(ctx,0,.9,hx('s4'));
          const T=tile(ctx,[0,0,.85],TILE,[hx('s4')]);
          root.add(CIN.prim.label(ctx,'never lives here',[-TILE/2,FLOOR-.05,.85+TILE/2],{size:17,color:colors.muted,bg:false,depthTest:false}));
          root.add(CIN.prim.label(ctx,'← room left −g   ·   µ ↓',[.05,FLOOR+.05,.85-.22],{size:15,color:colors.s3,bg:false,depthTest:false}));
          const ledger=glassPanel(ctx,{w:1.25,h:1.25,pos:[-1.55,.55,-1.15],color:'s4'}); ledger.g.rotation.y=.35;
          const sq=new THREE.Mesh(new THREE.BoxGeometry(1,1,.02),new THREE.MeshStandardMaterial({color:hx('s4'),emissive:hx('s4'),emissiveIntensity:isLight?.15:.5,transparent:true,opacity:.42,roughness:.4})); ledger.g.add(sq);
          const sqEdge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1,1)),new THREE.LineBasicMaterial({color:hx('s4'),transparent:true,opacity:.95})); ledger.g.add(sqEdge);
          ledger.text('g + t² = 0',.5,.9,{size:17,color:colors.s4});
          const roomLab=slot(ctx,root);
          sc={ctx,THREE,root,colors,isLight,hx,C:[C],T:[T],ledger,sq,sqEdge,roomLab,handle:null,home:null,tabKey:tab}; }
        else {
          const C1=corridor(ctx,-.62,.8,hx('s4')), C2=corridor(ctx,.62,.8,hx('s7'));
          const pats=[['µ₁ = 0, µ₂ = 0','inside','inside'],['µ₁ = 0, g₂ = 0','inside','touch'],['g₁ = 0, µ₂ = 0','touch','inside'],['g₁ = 0, g₂ = 0','touch','touch']];
          const tiles=pats.map((q,i)=>{ const T=tile(ctx,[-1.9+i*.72,0,1.45],.55,[hx('s4'),hx('s7')]); T.pat=q;
            root.add(CIN.prim.label(ctx,q[0],[-1.9+i*.72-.275,FLOOR+.02,1.45+.55+.18],{size:13,color:colors.muted,bg:false,depthTest:false}));
            const lit=new THREE.Mesh(new THREE.PlaneGeometry(.7,.7),new THREE.MeshBasicMaterial({color:hx('s3'),transparent:true,opacity:0,depthWrite:false})); lit.rotation.x=-Math.PI/2; lit.position.set(-1.9+i*.72-.275,FLOOR+.002,1.45+.275); root.add(lit); T.lit=lit; return T; });
          sc={ctx,THREE,root,colors,isLight,hx,C:[C1,C2],T:tiles,handle:null,home:null,tabKey:tab}; }
        H=hudPair(stage); if(narrow){ H.top.style.fontSize=H.bot.style.fontSize='.66rem'; H.bot.style.maxWidth='calc(100% - 6rem)'; } hint(stage,'drag to orbit'); paint(); },
      update(){ return false; } });
    if(handle&&sc){ sc.handle=handle; const s=handle.ctx.orbit.sph, L=handle.ctx.look; sc.home={theta:s.theta,phi:s.phi,radius:s.radius,look:[L.x,L.y,L.z]}; grab(handle,()=>false,()=>{}); }
    return handle; }
  function paint(o){ o=o||{}; if(!sc||sc.tabKey!==tab) return; const {ctx,hx,colors}=sc, xa=o.x==null?x1:o.x, cl=o.climb==null?climb:o.climb, S1=state(xa), S2=state(x2);
    if(tab==='one'){ const C=sc.C[0], T=sc.T[0]; paintCorridor(C,xa,S1,ctx); placeBead(T,0,S1,cl,ctx);
      if(S1.k==='inside') sc.roomLab.set('room left −g = '+F(S1.room,3),[xa/2,FLOOR+.42,0],{size:17,color:colors.s3,bg:false,depthTest:false});
      else if(S1.k==='touch') sc.roomLab.set('touching · µ = '+F(S1.mu*cl,2),[0,FLOOR+.42,0],{size:17,color:colors.s2,bg:false,depthTest:false});
      else sc.roomLab.set('past the fence · infeasible',[xa,FLOOR+.42,0],{size:17,color:cssv('critical'),bg:false,depthTest:false});
      const t=Math.sqrt(Math.max(0,S1.room)), side=Math.max(.02,t*.5); sc.sq.scale.set(side,side,1); sc.sq.position.set(-.55+side/2,-.55+side/2,.02); sc.sqEdge.scale.set(side,side,1); sc.sqEdge.position.copy(sc.sq.position); sc.sq.visible=S1.k!=='out'; sc.sqEdge.visible=S1.k!=='out';
      if(S1.k==='out'&&performance.now()-lastSpark>700&&o.quiet!==true){ lastSpark=performance.now(); sparks(ctx,[0,FLOOR+.5,0],hx('critical'),7,600); flare(ctx,[0,FLOOR+.45,0],hx('critical'),650,2.2); }
      if(H){ const prod=S1.k==='out'?S1.mu*S1.g:0; H.set('−g = <b>'+F(S1.room,3)+'</b> · µ = <b>'+F(S1.mu*cl,3)+'</b> · µ·g = <b>'+F(prod,3)+'</b> · slack t = √(−g) = <b>'+(S1.k==='out'?'none':F(t,3))+'</b>',
          S1.k==='out'?'<b style="color:var(--critical)">infeasible</b> — past the fence, and no fine rate can rescue it':S1.k==='touch'?'touching (g = 0): the fine is free to be positive — this fence is holding you back':'room to spare (g < 0): the fine is forced to zero — this fence is doing no work'); } }
    else { const [C1,C2]=sc.C; paintCorridor(C1,xa,S1,ctx); paintCorridor(C2,x2,S2,ctx);
      sc.T.forEach(T=>{ const live=T.pat[1]===S1.k&&T.pat[2]===S2.k; T.lit.material.opacity=live?(ctx.isLight?.3:.28):0;
        placeBead(T,0,live?S1:{k:T.pat[1],room:T.pat[1]==='inside'?1.3:0,mu:T.pat[1]==='touch'?PULL:0},1,ctx); placeBead(T,1,live?S2:{k:T.pat[2],room:T.pat[2]==='inside'?1.3:0,mu:T.pat[2]==='touch'?PULL:0},1,ctx);
        T.beads.forEach(b=>{ b.h.material.opacity=(ctx.isLight?.32:.65)*(live?1:.3); b.d.material.opacity=live?1:.4; b.d.material.transparent=true; }); });
      if(H){ const p1=S1.k==='out'?S1.mu*S1.g:0, p2=S2.k==='out'?S2.mu*S2.g:0; H.set('fence 1: −g₁ = <b>'+F(S1.room,3)+'</b>, µ₁ = <b>'+F(S1.mu,3)+'</b> · fence 2: −g₂ = <b>'+F(S2.room,3)+'</b>, µ₂ = <b>'+F(S2.mu,3)+'</b>',
          (S1.k==='out'||S2.k==='out')?'<b style="color:var(--critical)">infeasible</b> — past a fence':'live pattern: <b>'+(sc.T.find(T=>T.pat[1]===S1.k&&T.pat[2]===S2.k)||{pat:['—']}).pat[0]+'</b> · µ₁·g₁ = '+F(p1,3)+' · µ₂·g₂ = '+F(p2,3)); } }
    RR(ctx); }
  function drawRead(){ const S1=state(x1), S2=state(x2);
    if(tab==='one'){ const prod=S1.k==='out'?S1.mu*S1.g:0;
      read.innerHTML='−g = <b>'+F(S1.room,3)+'</b> · µ = <b>'+F(S1.mu,3)+'</b> · µ·g = <b>'+F(prod,3)+'</b><br>whatever you drag, this product stays 0';
      if(S1.k==='out'){ verd.className='verdict bad'; verd.textContent='bad — infeasible: you are past the fence, and no fine rate can rescue it'; }
      else if(S1.k==='touch'){ verd.className='verdict good'; verd.textContent='good — pressed against the fence (g = 0), so the fine is free to be positive: THIS fence is holding you back'; }
      else { verd.className='verdict good'; verd.textContent='good — room to spare (g < 0), so the fine is forced to zero: this fence is doing no work'; } }
    else { const p1=S1.k==='out'?S1.mu*S1.g:0, p2=S2.k==='out'?S2.mu*S2.g:0;
      read.innerHTML='fence 1: −g₁ = <b>'+F(S1.room,3)+'</b>, µ₁ = <b>'+F(S1.mu,3)+'</b>, µ₁·g₁ = <b>'+F(p1,3)+'</b><br>fence 2: −g₂ = <b>'+F(S2.room,3)+'</b>, µ₂ = <b>'+F(S2.mu,3)+'</b>, µ₂·g₂ = <b>'+F(p2,3)+'</b><br>whatever you drag, both products stay 0';
      if(S1.k==='out'||S2.k==='out'){ verd.className='verdict bad'; verd.textContent='bad — infeasible: you are past the fence, and no fine rate can rescue it'; }
      else if(S1.k==='touch'||S2.k==='touch'){ verd.className='verdict good'; verd.textContent='good — pressed against the fence (g = 0), so the fine is free to be positive: THIS fence is holding you back'; }
      else { verd.className='verdict good'; verd.textContent='good — room to spare (g < 0), so the fine is forced to zero: this fence is doing no work'; } }
    paint(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(camA){ camA.stop(); camA=null; } if(lookA){ lookA.stop(); lookA=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.08); }
  function lookTo(target,dur,tok){ if(!sc) return null; const L=sc.ctx.look, from=[L.x,L.y,L.z], o=sc.ctx.orbit;
    return tween(dur,u=>{ if(tok!==run) return; L.set(from[0]+(target[0]-from[0])*u,from[1]+(target[1]-from[1])*u,from[2]+(target[2]-from[2])*u); o.place(); }); }
  function setX(v){ const was=state(x1).k; x1=v; const now=state(x1).k;
    if(now==='touch'&&was!=='touch'&&!RM&&sc){ stop(); const tok=run; climb=0; drawRead(); if(sc) sparks(sc.ctx,[0,FLOOR+.1,0],sc.hx('s2'),8,600);
      anim=tween(520,u=>{ if(tok!==run) return; climb=u; paint({climb:u}); },()=>{ if(tok!==run) return; climb=1; paint(); if(sc){ const b=sc.T[0].beads[0].d.position; flare(sc.ctx,[b.x,FLOOR+b.y,.85+b.z],sc.hx('s4'),800,1.2); } }); }
    else { climb=1; drawRead(); } }
  /* ▶ one fence: camera low in the corridor behind the walker, the walk to the glass, the touch, the bead's climb, then up to the map */
  function play(){ stop(); const tok=run; if(!sc||tab!=='one'){ if(tab!=='one'){ x1=-0.01; setCtl('rm-x',x1,v=>F(v,2)); drawRead(); } return; }
    const h=sc.handle, home=sc.home, x0=-2.2; x1=x0; climb=1; setCtl('rm-x',x0,v=>F(v,2)); drawRead();
    if(RM){ x1=-0.01; setCtl('rm-x',x1,v=>F(v,2)); drawRead(); return; }
    h.setAutoRotate(0); lookA=lookTo([-1.0,.15,0],800,tok); camA=camN(h,{theta:-1.25,phi:1.32,radius:2.9},800);
    anim=tween(700,()=>{},()=>{ if(tok!==run) return;
      anim=tween(2600,u=>{ if(tok!==run) return; x1=x0+(-0.01-x0)*u; setCtl('rm-x',x1,v=>F(v,2)); paint({x:x1}); },()=>{ if(tok!==run) return; x1=-0.01; climb=0; paint({climb:0}); sparks(sc.ctx,[0,FLOOR+.1,0],sc.hx('s2'),9,650);
        anim=tween(600,u=>{ if(tok!==run) return; climb=u; paint({climb:u}); },()=>{ if(tok!==run) return; climb=1; drawRead(); const b=sc.T[0].beads[0].d.position; flare(sc.ctx,[b.x,FLOOR+b.y,.85+b.z],sc.hx('s4'),900,1.4);
          anim=tween(500,()=>{},()=>{ if(tok!==run) return; camA=camN(h,{theta:home.theta,phi:home.phi,radius:home.radius},1300,()=>{ if(tok===run) h.setAutoRotate(.08); }); lookA=lookTo(home.look,1300,tok); }); }); }); }); }
  document.getElementById('rm-play').addEventListener('click',play);
  bindCtl('rm-x',v=>{ stop(); setX(v); },v=>F(v,2))();
  bindCtl('rm-y',v=>{ stop(); x2=v; drawRead(); },v=>F(v,2))();
  tabs(document.getElementById('rm-tabs'),t=>{ stop(); tab=t; showTab(box,t); drawRead(); if(ST&&ST.handle) remount(ST); });
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const Wd=stage.clientWidth; if((Wd<560)!==(rw<560)) remount(ST); rw=Wd; });
  showTab(box,'one'); drawRead();
})();
