/* ================= W1 · YOUR FEET FEEL THE TILT, NOT THE TURN (a walker, a tilt disc, a ghost stride, a ledge) ================= */
(function(){
  const box=document.getElementById('w-feel'),stage=document.getElementById('fl-3d'),read=document.getElementById('fl-read'),verd=document.getElementById('fl-verdict'),playBtn=document.getElementById('fl-play');
  if(!box||!stage) return;
  const U=2.4,V2=1.3;                                                 /* the valley footprint (world constants) */
  const sg=u=>1/(1+Math.exp(-Math.max(-60,Math.min(60,u))));
  const cf=x=>1.8*sg(-6*(x+1.2))+0.05*x;                              /* the ledge: a high shelf on the left, a drop at x = −1.2 */
  const cfd=x=>{ const s=sg(-6*(x+1.2)); return -10.8*s*(1-s)+0.05; };
  const cfd2=x=>{ const s=sg(-6*(x+1.2)); return 64.8*s*(1-s)*(2*s-1); };
  const XC=4,YC=1.6,PROBE=0.5;                                         /* the cliff domain and the confident stride */
  const toX=u=>u*XC/U, toU=x=>x*U/XC;
  const CF=(u,v)=>cf(toX(u))+0.15*Math.pow(v*YC/V2,2);                 /* the cliff drawn on the valley's footprint */
  const ZSC=1.55/2.0;
  const VJ=w=>0.5*w[0]*w[0]+5*w[1]*w[1];
  let tab='valley',eta=0.10,K=12,cx=-2.0,trace=null,shown=0,sc=null,anim=null,run=0,ST=null;
  const inside=w=>Math.abs(w[0])<=U*1.001&&Math.abs(w[1])<=V2*1.001;
  const clampW=w=>[Math.max(-U,Math.min(U,w[0])),Math.max(-V2,Math.min(V2,w[1]))];
  const edgeMode=()=>Math.abs(eta-0.2)<=0.003;
  function path(N){ const p=[[1,1]]; let w=[1,1]; for(let i=0;i<N;i++){ w=[(1-eta)*w[0],(1-10*eta)*w[1]]; p.push(w.slice()); if(!isFinite(w[1])||Math.abs(w[1])>1e4) break; } return p; }
  const camHome=()=>({theta:.62,phi:1.05,radius:stage.clientWidth<560?8.2:6.95});
  /* --- positions --- */
  const cliffAt=(x,lift)=>[toU(x),ZSC*cf(x)+(lift==null?.02:lift),0];
  const posOf=(w,lift)=>sc.V.at(clampW(w),lift);
  function normalAt(w){ const T=sc.ctx.THREE; let hx,hz; const x=w[0], z=-w[1];
    if(tab==='valley'){ const zs=sc.V.zs; hx=zs*x; hz=zs*10*z; } else { hx=ZSC*cfd(toX(x))*XC/U; hz=ZSC*0.3*z*Math.pow(YC/V2,2); }
    return new T.Vector3(-hx,1,-hz).normalize(); }
  function build(){ sc=null; const narrow=stage.clientWidth<560;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:narrow?[4.1,4.5,5.8]:[3.5,3.9,4.9],look:[0,.45,0],fov:36},autoRotate:.08,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors}=ctx, hx=hxOf(ctx);
        const V=valleyScene(ctx,{c:10});
        const walker=walkerChar(ctx,hx('s4'),.07);
        /* the tilt disc: what the feet feel — a translucent disc tilted to the local gradient */
        const disc=new THREE.Mesh(new THREE.CircleGeometry(.2,36),new THREE.MeshStandardMaterial({color:hx('s4'),emissive:hx('s4'),emissiveIntensity:ctx.isLight?.2:.6,transparent:true,opacity:ctx.isLight?.4:.42,side:THREE.DoubleSide,depthWrite:false}));
        overlay(disc,11); root.add(disc);
        const rim=overlay(new THREE.Mesh(new THREE.TorusGeometry(.2,.008,8,48),new THREE.MeshBasicMaterial({color:hx('s4'),transparent:true,opacity:.9})),11); root.add(rim);
        /* the ghost stride: where a stride of η would land, and a hollow dot there */
        const ghostA=overlay(CIN.prim.arrow(ctx,[0,0,0],[.3,0,0],hx('s2'),{radius:.014,head:.09}),11); ghostA.traverse(m=>{ if(m.material) m.material.opacity=.8; }); root.add(ghostA);
        const ghostR=overlay(new THREE.Mesh(new THREE.TorusGeometry(.055,.01,8,32),new THREE.MeshBasicMaterial({color:hx('s2'),transparent:true,opacity:.85})),11); root.add(ghostR);
        const trail=trailRibbon(ctx,hx('s4'),.018);
        const tail=cometTail(ctx,critHex());
        /* two landing pads for the standing oscillation */
        const pads=[0,1].map(()=>{ const m=new THREE.Mesh(new THREE.CircleGeometry(.16,32),new THREE.MeshBasicMaterial({color:hx('s2'),transparent:true,opacity:ctx.isLight?.35:.45,depthWrite:false,side:THREE.DoubleSide})); m.renderOrder=10; m.visible=false; root.add(m); return m; });
        /* the back panel: the same loss, one direction at a time (valley) · the true profile (cliff) */
        const panel=glassPanel(ctx,{pos:[0,1.55,-1.95],w:2.6,h:1.0});
        const mkBead=(c,r)=>{ const d=overlay(CIN.prim.dot(ctx,[0,0,0],c,r),12); panel.g.add(d); return d; };
        const beads=[mkBead(hx('s1'),.03),mkBead(hx('s2'),.03)];
        const tan=[tube(ctx,[0,0,0],[0,1,0],hx('s2'),.01,.95),tube(ctx,[0,0,0],[0,1,0],hx('s2'),.01,.95)]; tan.forEach(t=>{ t.visible=false; panel.g.add(t); });
        const lab=slot(ctx,root), gone=slot(ctx,root);
        const H=hudPair(stage); H.top.style.maxWidth=H.bot.style.maxWidth='calc(100% - 1.4rem)'; hint(stage,'drag to orbit');
        sc={ctx,root,colors,hx,V,walker,disc,rim,ghostA,ghostR,trail,tail,pads,panel,beads,tan,lab,gone,H,handle:null};
        buildShape(); paintTrail(); paint(); },
      update(){ return false; } });
    if(handle){ grab(handle,()=>false,()=>{}); if(sc) sc.handle=handle; }
    return handle; }
  /* the surface for the current tab, and the panel's static curves */
  function buildShape(){ if(!sc) return; const {ctx,V,panel,hx,colors}=sc;
    panel.clear();
    if(tab==='valley'){ V.reshapeTo(10); V.star.visible=true;
      const pts=(a)=>{ const p=[]; for(let j=0;j<=40;j++){ const s=-1.3+2.6*j/40; p.push([j/40,Math.min(.97,a*s*s/8.5)]); } return p; };
      panel.curve(pts(0.5),hx('s1'),.011); panel.curve(pts(5),hx('s2'),.011);
      panel.text('the same J, one direction at a time',.5,.9,{size:16});
      panel.text('across · 5w₂²',.83,.62,{size:15,color:colors.s2}); panel.text('along · ½w₁²',.83,.2,{size:15,color:colors.s1});
    } else { reshape(ctx,V.surf,CF,ZSC,null,.8); clearGroup(V.contG); const lv=[]; for(let i=1;i<=9;i++) lv.push(0.02+1.95*i/10);
      V.contG.add(liftedContours(ctx,CF,lv,-U,U,-V2,V2,ZSC,hx('ink2'),{N:76})); V.star.visible=false;
      const p=[]; for(let j=0;j<=120;j++){ const x=-4+8*j/120; p.push([j/120,(cf(x)+.05)/2.1]); } panel.curve(p,hx('s1'),.011);
      panel.text('the shelf, then the ledge',.5,.9,{size:16}); }
    sc.beads.forEach(b=>{ b.visible=false; });
    RR(ctx); }
  function setDisc(p,n){ const {disc,rim}=sc, T=sc.ctx.THREE; disc.position.set(p[0],p[1]+.01,p[2]); rim.position.copy(disc.position); const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),n); disc.quaternion.copy(q); rim.quaternion.copy(q); }
  function setTan(i,x){ const {panel,tan}=sc; const u=(x+4)/8, v=(cf(x)+.05)/2.1, s=cfd(x)*8/2.1, du=.05, dv=Math.max(-.3,Math.min(.3,s*du));
    aimTube(sc.ctx.THREE,tan[i],panel.toLocal(u-du,v-dv),panel.toLocal(u+du,v+dv)); tan[i].visible=true; }
  /* paint from state (or from an in-flight position during a story) */
  function paint(cur,k){ if(!sc) return; const {walker,disc,rim,ghostA,ghostR,V,lab,beads,panel,H,tan}=sc;
    if(tab==='valley'){ const raw=cur||(trace?trace[Math.min(shown,trace.length-1)]:[1,1]), off=!inside(raw), w=clampW(raw), kk=k==null?shown:k;
      walker.show(!off); disc.visible=!off; rim.visible=!off; tan.forEach(t=>{ t.visible=false; });
      const p=posOf(w,.07); walker.setPos(p);
      if(!off){ setDisc(posOf(w,.012),normalAt(w)); lab.set('step '+kk,[p[0],p[1]+.3,p[2]],{size:17,color:sc.colors.s4,bg:false,depthTest:false,scale:.006}); } else lab.hide();
      const wn=[(1-eta)*w[0],(1-10*eta)*w[1]], tgt=posOf(wn,.04), from=posOf(w,.04), far=Math.hypot(tgt[0]-from[0],tgt[2]-from[2]);
      ghostA.visible=!off&&far>.03; ghostR.visible=!off&&inside(wn)&&far>.03;
      if(ghostA.visible) ghostA.userData.set(from,tgt); if(ghostR.visible){ ghostR.position.set(tgt[0],tgt[1],tgt[2]); ghostR.quaternion.copy(disc.quaternion); }
      beads[0].visible=true; beads[1].visible=true; const s1=Math.max(-1.3,Math.min(1.3,w[0])), s2=Math.max(-1.3,Math.min(1.3,w[1]));
      beads[0].position.set(...panel.toLocal((s1+1.3)/2.6,Math.min(.97,0.5*s1*s1/8.5))); beads[1].position.set(...panel.toLocal((s2+1.3)/2.6,Math.min(.97,5*s2*s2/8.5)));
      if(!cur) H.set('η = <b>'+F(eta,3)+'</b> · step <b>'+kk+'</b> · w = [<b>'+big(w[0],3)+'</b>, <b>'+big(raw[1],3)+'</b>] · J = <b>'+big(VJ(raw),4)+'</b>',
        'each step: w₁ × '+F(1-eta,3)+' · w₂ × '+F(1-10*eta,3));
    } else { const x=cur==null?cx:cur, p=cliffAt(x,.07); walker.show(true); disc.visible=true; rim.visible=true;
      walker.setPos(p); setDisc(cliffAt(x,.012),normalAt([toU(x),0]));
      const d=cfd(x), dir=d>0?-1:1, xl=Math.max(-XC,Math.min(XC,x+dir*PROBE)), pl=cliffAt(xl,.04), from=cliffAt(x,.04);
      ghostA.visible=Math.abs(xl-x)>.02; ghostR.visible=ghostA.visible; if(ghostA.visible){ ghostA.userData.set(from,pl); ghostR.position.set(pl[0],pl[1],pl[2]); ghostR.quaternion.copy(disc.quaternion); }
      lab.set('tilt here '+F(Math.abs(d),3),[p[0],p[1]+.3,p[2]],{size:16,color:sc.colors.s2,bg:true,depthTest:false,scale:.006});
      beads[0].visible=true; beads[0].position.set(...panel.toLocal((x+4)/8,(cf(x)+.05)/2.1)); beads[1].visible=true; beads[1].position.set(...panel.toLocal((xl+4)/8,(cf(xl)+.05)/2.1));
      setTan(0,x); setTan(1,xl);
      if(cur==null) H.set('x = <b>'+F(x,2)+'</b> · |f′| here <b>'+F(Math.abs(d),4)+'</b> · one stride ahead <b>'+F(Math.abs(cfd(xl)),4)+'</b>','the disc is tilted by '+F(Math.abs(d),3)+' — a stride of 0.5 is what the feet propose'); }
    RR(sc.ctx); }
  function paintTrail(n){ if(!sc) return; const {trail,V}=sc; trail.reset();
    if(tab!=='valley'||!trace) { RR(sc.ctx); return; }
    const N=Math.min(n==null?shown:n,trace.length-1);
    for(let i=0;i<=N;i++){ if(!inside(trace[i])) break; trail.push(V.at(clampW(trace[i]),.02)); }
    RR(sc.ctx); }
  function draw(){
    if(tab==='valley'){ const f1=1-eta, f2=1-10*eta, n1=Math.abs(f1)<1?Math.ceil(Math.log(0.01)/Math.log(Math.abs(f1))):Infinity;
      read.innerHTML='slopes at [1, 1]: ∂J/∂w₁ = <b>1</b> · ∂J/∂w₂ = <b>10</b> (10 : 1)<br>'+
        'per-step factor: w₁ × <b>1−η</b> = <b>'+F(f1,3)+'</b> · w₂ × <b>1−10η</b> = <b>'+F(f2,3)+'</b><br>'+
        'steps for w₁ to get within 1 % of 0: <b>'+(isFinite(n1)?String(n1):'never')+'</b>';
      if(edgeMode()){ verd.className='verdict info'; verd.textContent='info — w₂ locked in a standing oscillation, factor exactly −1'; }
      else if(eta<0.2){ verd.className='verdict good'; verd.textContent='good — w₂ settles, w₁ crawls'; }
      else { verd.className='verdict bad'; verd.textContent='bad — w₂ diverges, and w₁ is still crawling'; }
    } else { const d0=cfd(cx), dir=d0>0?-1:1, xl=Math.max(-XC,Math.min(XC,cx+dir*PROBE)), d1=cfd(xl), r=Math.abs(d1)/(Math.abs(d0)||1e-12);
      read.innerHTML='|f′| here = <b>'+F(Math.abs(d0),4)+'</b> · one stride ahead (x = '+F(xl,2)+') = <b>'+F(Math.abs(d1),4)+'</b> · ratio <b>'+(r>=1e4?sci(r,1):F(r,1))+'×</b><br>'+
        'f″ here = <b>'+F(cfd2(cx),3)+'</b> · f″ there = <b>'+F(cfd2(xl),3)+'</b> — the Hessian would warn you, at d² numbers a step<br>'+
        'first-order information has no word for "and it stops in 5 cm"';
      if(r>20){ verd.className='verdict bad'; verd.textContent='bad — the tilt you trusted lasted 0.05 units; you have stepped off a ledge'; }
      else if(Math.abs(d0)<0.08){ verd.className='verdict info'; verd.textContent='info — almost no tilt here: the shelf tells you nothing about what is ahead'; }
      else { verd.className='verdict good'; verd.textContent='good — the tilt ahead is close to the tilt here, so one step of trust is safe'; } }
    paint(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.08); }
  function replan(){ stop(); trace=path(K); shown=trace.length-1; if(sc){ sc.pads.forEach(m=>{ m.visible=false; }); sc.tail.clear(); sc.gone.hide(); } paintTrail(); draw(); }
  const home=(tok)=>{ if(tok!==run||!sc||!sc.handle) return; anim=camTo(sc.handle,camHome(),1500,()=>{ if(tok===run&&sc&&sc.handle) sc.handle.setAutoRotate(.08); }); };
  function playValley(tok){ const narrow=stage.clientWidth<560, edge=edgeMode(), N=edge?Math.max(K,28):K; trace=path(N); shown=0; paintTrail(0); draw();
    const H={set(a,b){ if(sc) sc.H.set(a,b); }}; let floored=false, hops=0;
    sc.pads.forEach(m=>{ m.visible=false; }); sc.tail.clear(); sc.gone.hide();
    H.set('the feet feel <b>1</b> along w₁ and <b>10</b> along w₂','one stride η = '+F(eta,3)+' must serve both');
    const finale=()=>{ if(tok!==run) return; draw(); if(edge) H.set('factor 1−10η = <b>−1.000</b> · a standing oscillation','w₂ hops +1, −1, +1, −1 for ever while w₁ crawls');
      else { const f2=Math.abs(1-10*eta), n2=f2<1e-9?1:(f2<1?Math.ceil(Math.log(0.01)/Math.log(f2)):Infinity), f1=1-eta, n1=Math.ceil(Math.log(0.01)/Math.log(Math.abs(f1)));
        H.set('w₂ done in <b>'+(isFinite(n2)?n2:'∞')+'</b> step'+(n2===1?'':'s')+' · w₁ needs <b>'+n1+'</b>','the steep direction is finished; the gentle one is still walking'); }
      home(tok); };
    const flyOff=(k)=>{ const a=trace[k-1], b=trace[k], p0=posOf(a,.07), exit=[p0[0],3.4,-Math.sign(b[1]||1)*2.6];
      H.set('step <b>'+k+'</b> · |w₂| = <b>'+big(Math.abs(b[1]),2)+'</b> · off the map','factor 1−10η = '+F(1-10*eta,3)+' — every step is ×'+F(Math.abs(1-10*eta),2)+' bigger');
      anim=tween(800,u=>{ if(tok!==run||!sc) return; const p=[p0[0]+(exit[0]-p0[0])*u,p0[1]+(exit[1]-p0[1])*u*u,p0[2]+(exit[2]-p0[2])*u]; sc.walker.setPos(p); sc.disc.visible=false; sc.rim.visible=false; sc.ghostA.visible=false; sc.ghostR.visible=false; sc.tail.set(p0,p); RR(sc.ctx); },
        ()=>{ if(tok!==run||!sc) return; flare(sc.ctx,exit,critHex(),1000,2.4); shown=k; draw(); sc.walker.show(false); sc.disc.visible=false; sc.rim.visible=false; sc.ghostA.visible=false; sc.ghostR.visible=false; sc.lab.hide(); sc.gone.set('diverged at step '+k,[p0[0]-.2,.6,p0[2]+1.1],{size:18,color:cssv('critical'),bg:true,depthTest:false,scale:.006});
          H.set('<b>diverged</b> at step '+k+' · factor 1−10η = <b>'+F(1-10*eta,3)+'</b>','w₂ grows ×'+F(Math.abs(1-10*eta),2)+' every step — no stride this long survives the steep direction'); RR(sc.ctx); home(tok); }); };
    const nxt=k=>{ if(tok!==run) return; if(k>=trace.length-1){ finale(); return; }
      const a=trace[k], b=trace[k+1]; if(!inside(b)){ flyOff(k+1); return; }
      const dur=edge?(k<K?230:190):260;
      anim=tween(dur,u=>{ if(tok!==run) return; paint([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u],k); },()=>{ if(tok!==run||!sc) return; k++; shown=k; paintTrail();
        const p=posOf(b,.012);
        if(edge){ hops++; const {pads,V}=sc; pads[0].visible=true; pads[1].visible=true; [1,-1].forEach((s,i)=>{ const q=V.at([b[0],s],.014); pads[i].position.set(q[0],q[1],q[2]); pads[i].quaternion.copy(sc.disc.quaternion); }); sparks(sc.ctx,p,sc.hx('s2'),7,550);
          sc.H.set('step <b>'+k+'</b> · w₂ = <b>'+F(b[1],2)+'</b> · factor 1−10η = <b>−1.000</b>','landing pad '+(b[1]>0?'+1':'−1')+' · w₁ = '+F(b[0],3)); }
        else { if(!floored&&Math.abs(b[1])<0.02){ floored=true; flare(sc.ctx,p,sc.hx('s3'),900,1.6); sc.H.set('step <b>'+k+'</b> · w₂ hit the floor: <b>'+F(b[1],3)+'</b> · w₁ = <b>'+F(b[0],3)+'</b>','the steep direction is done in '+k+' step'+(k===1?'':'s')+'; the gentle one creeps'); anim=tween(600,()=>{},()=>nxt(k)); return; }
          else sc.H.set('step <b>'+k+'</b> · w = [<b>'+big(b[0],3)+'</b>, <b>'+big(b[1],3)+'</b>] · J = <b>'+big(VJ(b),4)+'</b>',floored?'w₁ × '+F(1-eta,3)+' a step — 44 of them to reach 1 %':'w₂ × '+F(1-10*eta,3)+' · w₁ × '+F(1-eta,3)); }
        nxt(k); }); };
    anim=camTo(sc.handle,{theta:1.95,phi:1.24,radius:narrow?4.6:3.9},1300,()=>{ if(tok!==run) return; nxt(0); }); }
  function playCliff(tok){ const narrow=stage.clientWidth<560, H={set(a,b){ if(sc) sc.H.set(a,b); }}, trail=sc.trail; trail.reset(); sc.gone.hide();
    let x=cx, strides=0, fell=false, met=0; const d0=cfd(x); paint();
    H.set('the tilt here is <b>'+F(Math.abs(d0),4)+'</b> · the feet propose a stride of 0.5','beat 1 · the disc is all the walker knows');
    trail.push(cliffAt(x,.02));
    const stride=()=>{ if(tok!==run||!sc) return; if(strides>=5||fell){ finish(); return; }
      const d=cfd(x), dir=d>0?-1:1, x1=Math.max(-XC,Math.min(XC,x+dir*PROBE)); if(Math.abs(x1-x)<1e-6){ finish(); return; }
      const drop=cf(x)-cf(x1), x0=x; strides++;
      H.set('stride <b>'+strides+'</b> · from x = '+F(x0,2)+' to '+F(x1,2)+' · tilt felt <b>'+F(Math.abs(d),3)+'</b>',drop>.25?'the ground is not where the tilt said it would be':'the shelf holds');
      anim=tween(drop>.25?1100:600,u=>{ if(tok!==run||!sc) return; const xx=x0+(x1-x0)*u; met=Math.max(met,Math.abs(cfd(xx))); sc.walker.setPos(cliffAt(xx,.07)); setDisc(cliffAt(xx,.012),normalAt([toU(xx),0])); sc.lab.set('tilt here '+F(Math.abs(cfd(xx)),3),[toU(xx),ZSC*cf(xx)+.37,0],{size:16,color:sc.colors.s2,bg:true,depthTest:false,scale:.006}); if(u>.3) sc.ghostA.visible=false, sc.ghostR.visible=false; RR(sc.ctx); },
        ()=>{ if(tok!==run||!sc) return; x=x1; sc.trail.push(cliffAt(x,.02)); const p=cliffAt(x,.02);
          if(drop>.25){ fell=true; sparks(sc.ctx,p,critHex(),10,750); flare(sc.ctx,p,critHex(),900,1.8);
            H.set('<b>the tilt you trusted lasted 5 cm</b>','at x = '+F(cx,2)+' the feet felt '+F(Math.abs(d0),3)+'; the face was '+F(met,2)+' — the ledge was never in the first derivative'); }
          stride(); }); };
    const finish=()=>{ if(tok!==run) return; if(!fell) H.set('no ledge met from x = '+F(cx,2)+' · the tilt led away from it','stand between x = −2.1 and −1.2 and press ▶ again'); home(tok); };
    anim=camTo(sc.handle,{theta:-1.25,phi:1.28,radius:narrow?4.4:3.7},1300,()=>{ if(tok!==run||!sc) return;
      anim=camTo(sc.handle,{theta:.35,phi:1.12,radius:narrow?4.2:3.4},2600); stride(); }); }
  function play(){ stop(); const tok=run; if(!sc||!sc.handle){ replan(); return; }
    if(RM){ replan(); return; }
    sc.handle.setAutoRotate(0);
    if(tab==='valley') playValley(tok); else playCliff(tok); }
  playBtn.addEventListener('click',play);
  const preBar=document.getElementById('fl-pre');
  [['fl-p-lucky',0.10],['fl-p-edge',0.20],['fl-p-blow',0.25]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{
    pressOnly(preBar,e.currentTarget); eta=v; setCtl('fl-eta',v,3); replan(); }));
  bindCtl('fl-eta',v=>{ eta=v; pressOnly(preBar,null); replan(); },v=>fmt(v,3))();
  bindCtl('fl-k',v=>{ K=v|0; replan(); },v=>String(v|0))();
  bindCtl('fl-x',v=>{ cx=v; stop(); if(sc){ sc.trail.reset(); sc.gone.hide(); } draw(); },v=>F(v,2))();
  tabs(document.getElementById('fl-tabs'),t=>{ stop(); tab=t; showTab(box,t); playBtn.textContent=t==='valley'?'▶ walk':'▶ take the stride'; if(sc){ buildShape(); sc.pads.forEach(m=>{ m.visible=false; }); sc.tail.clear(); } replan(); });
  showTab(box,'valley');
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const W=stage.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  replan();
})();

/* ================= W2 · THE LOADED TROLLEY (a walker, a trolley with a comet tail, two chains on the floor) ================= */
(function(){
  const box=document.getElementById('w-trolley'),stage=document.getElementById('tr-3d'),read=document.getElementById('tr-read'),verd=document.getElementById('tr-verdict');
  if(!box||!stage) return;
  let be=0.90,eta=0.10,K=14,shown=14,anim=null,run=0,TR=null,TP=null,sc=null,ST=null;
  const U=2.4,V2=1.3, clampW=w=>[Math.max(-U,Math.min(U,w[0])),Math.max(-V2,Math.min(V2,w[1]))];
  function plan(){ const N=Math.max(K,3); TR=OPT.trace('gd',{c:10,alpha:eta,N}); TP=OPT.trace('mom',{c:10,alpha:eta,beta:be,N}); }
  const camHome=()=>({theta:.63,phi:.98,radius:stage.clientWidth<560?8.2:6.95});
  function build(){ sc=null; const narrow=stage.clientWidth<560;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:narrow?[3.7,4.8,5.7]:[3.4,4.1,4.7],look:narrow?[-.3,.25,0]:[0,.25,0],fov:36},autoRotate:.08,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors}=ctx, hx=hxOf(ctx);
        const V=valleyScene(ctx,{c:10});
        const walker=walkerChar(ctx,hx('s1'),.06);
        const trolley=trolleyChar(ctx,hx('s3')); trolley.g.scale.setScalar(1.3);
        const push=overlay(CIN.prim.arrow(ctx,[0,0,0],[.3,0,0],hx('s2'),{radius:.016,head:.1}),13); root.add(push);
        const trW=trailRibbon(ctx,hx('s1'),.014), trT=trailRibbon(ctx,hx('s3'),.02);
        const chainG=new THREE.Group(); root.add(chainG);
        const beads=[overlay(CIN.prim.dot(ctx,[0,0,0],hx('s3'),.04),12),overlay(CIN.prim.dot(ctx,[0,0,0],hx('s2'),.04),12)]; beads.forEach(b=>root.add(b));
        root.add(sceneChip(ctx,'w₁ pushes · they stack',[-2.1,V.floorY+.06,1.45],{size:15,color:colors.s3,bg:true}));
        root.add(sceneChip(ctx,'w₂ pushes · they cancel',[-2.1,V.floorY+.06,1.74],{size:15,color:colors.s2,bg:true}));
        /* the back panel: both losses against step */
        const panel=glassPanel(ctx,{pos:[0,1.55,-1.95],w:2.6,h:1.0});
        const mkBead=(c,r)=>{ const d=overlay(CIN.prim.dot(ctx,[0,0,0],c,r),12); panel.g.add(d); return d; };
        const pb=[mkBead(hx('s1'),.028),mkBead(hx('s3'),.034)];
        const H=hudPair(stage); H.top.style.maxWidth=H.bot.style.maxWidth='calc(100% - 1.4rem)'; hint(stage,'drag to orbit');
        sc={ctx,root,colors,hx,V,walker,trolley,push,trW,trT,chainG,beads,panel,pb,H,handle:null};
        paintPanel(); paintTrails(); paint(); },
      update(){ return false; } });
    if(handle){ grab(handle,()=>false,()=>{}); if(sc) sc.handle=handle; }
    return handle; }
  const lgv=J=>Math.max(0,Math.min(1,(Math.log10(Math.max(1e-3,J))+3)/4));
  function paintPanel(){ if(!sc) return; const {panel,hx,colors}=sc; panel.clear();
    const N=Math.max(K,3); [[TR,'s1',.01],[TP,'s3',.013]].forEach(([T,c,r])=>{ const pts=[]; for(let i=0;i<=N;i++) pts.push([i/N,lgv(T[i].J)]); panel.curve(pts,hx(c),r); });
    panel.hline(lgv(0.4),hx('s7'),true);
    panel.text('loss J against step (log)',.5,.9,{size:16}); panel.text('J = 0.4',.93,lgv(0.4)+.07,{size:13,color:colors.s7});
    RR(sc.ctx); }
  function paintTrails(n){ if(!sc) return; const {trW,trT,V}=sc, N=Math.min(n==null?shown:n,K); trW.reset(); trT.reset();
    for(let i=0;i<=N;i++){ trW.push(V.at(clampW(TR[i].w),.02)); trT.push(V.at(clampW(TP[i].w),.02)); } RR(sc.ctx); }
  function paintChains(n){ if(!sc) return; const {ctx,hx,chainG,beads,V}=sc; clearGroup(chainG);
    const NB=10, Z=[1.45,1.74], COL=[hx('s3'),hx('s2')], X0=-.2, LMAX=.24, y=V.floorY+.035;
    [0,1].forEach(j=>{ const parts=[]; for(let k=0;k<NB;k++){ const i=n-k; if(i<1) break; parts.push(-eta*TP[i].g[j]*Math.pow(be,k)); }
      const mx=Math.max(1e-9,...parts.map(Math.abs)); let x=X0, sum=0;
      parts.forEach((p,k)=>{ const L=Math.max(.025,Math.abs(p)/mx*LMAX), dir=p<0?-1:1, zz=Z[j]+(j===1?(k%2?.06:-.06):0), yy=y+k*.007;
        chainG.add(tube(ctx,[x,yy,zz],[x+dir*L,yy,zz],COL[j],.03,.5+.5*Math.pow(Math.max(be,.3),k))); x+=dir*L; sum+=p; });
      const bx=X0+sum/mx*LMAX; beads[j].position.set(bx,y+.05,Z[j]); beads[j].visible=parts.length>0; });
    RR(ctx); }
  function paint(cur,k){ if(!sc) return; const {walker,trolley,push,V,pb,panel,H}=sc; const n=Math.min(shown,K), kk=k==null?n:k;
    const wp=clampW(cur?cur[0]:TR[n].w), wt=clampW(cur?cur[1]:TP[n].w);
    walker.setPos(V.at(wp,.06)); trolley.setPos(V.at(wt,0));
    const prev=TP[Math.max(0,kk-1)].w, dx=wt[0]-prev[0], dz=-(wt[1]-prev[1]); trolley.face(dx,dz);
    if(kk>=1&&Math.hypot(dx,dz)>1e-3) trolley.tail.set(V.at(clampW(prev),.08),V.at(wt,.08)); else trolley.tail.clear();
    /* the fresh push −η∇J at the trolley's position */
    const g=[wt[0],10*wt[1]], p=[-eta*g[0],-eta*g[1]], pn=Math.hypot(p[0],p[1]); if(pn>1e-3){ const L=Math.min(.55,.1+.4*Math.min(1,pn)); const a=V.at(wt,.14); push.visible=true; push.userData.set(a,[a[0]+p[0]/pn*L,a[1],a[2]-p[1]/pn*L]); } else push.visible=false;
    pb[0].position.set(...panel.toLocal(n/Math.max(K,3),lgv(TR[n].J))); pb[1].position.set(...panel.toLocal(n/Math.max(K,3),lgv(TP[n].J)));
    if(!cur){ paintChains(n);
      H.set('step <b>'+n+'</b> · trolley J = <b>'+big(TP[n].J,4)+'</b> · walker J = <b>'+big(TR[n].J,4)+'</b>','β = '+F(be,2)+' · the comet tail is v · the orange arrow is the fresh push'); }
    RR(sc.ctx); }
  function ringSteps(){ const T=OPT.trace('mom',{c:10,alpha:eta,beta:be,N:200}); let last=null; for(let i=1;i<T.length;i++) if(!isFinite(T[i].J)||T[i].J>=0.4) last=i; return last==null?1:(last>=200?null:last+1); }
  function crossings(n){ let c=0; for(let i=2;i<=n;i++){ const a=TP[i-1].w[1], b=TP[i].w[1]; if(a*b<0) c++; } return c; }
  function draw(){ const n=Math.min(shown,K), t1=TP[1].w,t2=TP[2].w,t3=TP[3].w;
    read.innerHTML='t=1 [<b>'+F(t1[0],2)+'</b>, <b>'+F(t1[1],2)+'</b>] · t=2 [<b>'+F(t2[0],2)+'</b>, <b>'+F(t2[1],2)+'</b>] · t=3 [<b>'+F(t3[0],3)+'</b>, <b>'+F(t3[1],3)+'</b>]<br>'+
      'J: <b>5.5</b> → <b>'+T4(TP[1].J)+'</b> → <b>'+F(TP[2].J,4)+'</b> → <b>'+F(TP[3].J,4)+'</b><br>'+
      'steady-state speed-up on a constant pull: 1/(1−β) = <b>'+(be>=1?'∞':(1/(1-be)).toFixed(1))+'</b>×';
    if(be===0){ verd.className='verdict info'; verd.textContent='info — no memory: this is exactly the plain walker'; }
    else if(be>=0.97){ const N=ringSteps(); verd.className='verdict bad'; verd.textContent='bad — the trolley will not stop: it rings for '+(N==null?'more than 200':N)+' steps before J falls below 0.4'; }
    else if(Math.abs(be-0.9)<1e-9&&Math.abs(eta-0.1)<1e-9){ verd.className='verdict info'; verd.textContent='info — the loss ROSE at step 2 (0.405 → 4.309). That is the overshoot being paid for, not a bug.'; }
    else if(TP[2].J>TP[1].J){ verd.className='verdict info'; verd.textContent='info — the loss ROSE at step 2 ('+F(TP[1].J,3)+' → '+F(TP[2].J,3)+'). That is the overshoot being paid for, not a bug.'; }
    else { verd.className='verdict good'; verd.textContent='good — memory without overshoot: the trolley rolls straight down the trough'; }
    paint(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.08); }
  function replan(){ stop(); plan(); shown=K; paintPanel(); paintTrails(); draw(); }
  function play(){ stop(); const tok=run; plan(); shown=0; paintPanel(); paintTrails(); draw();
    if(!sc||!sc.handle||RM){ shown=K; paintTrails(); draw(); return; }
    const narrow=stage.clientWidth<560, H={set(a,b){ if(sc) sc.H.set(a,b); }}; sc.handle.setAutoRotate(0); let arrived=false;
    const home=()=>{ if(tok!==run||!sc||!sc.handle) return; anim=camTo(sc.handle,camHome(),1500,()=>{ if(tok===run&&sc&&sc.handle) sc.handle.setAutoRotate(.08); }); };
    H.set('both leave [1, 1] · β = <b>'+F(be,2)+'</b>','beat 1 · the trolley starts with no velocity at all');
    const after=k=>{ const J=TP[k].J, hud=sc.H;
      if(!arrived&&J<0.4&&(k===1||TP[k-1].J>=0.4)){ arrived=true; flare(sc.ctx,sc.V.at(clampW(TP[k].w),.08),sc.hx('s3'),900,1.7);
        hud.set('speed-up along the trough: 1/(1−β) = <b>'+(1/(1-be)).toFixed(1)+'</b>×','step '+k+' · J = '+big(J,4)+' — under 0.4 and staying near the floor'+(be>=0.97?' for now':'')); }
      else if(be===0) hud.set('β = 0 · <b>the trolley IS the plain walker</b> · step '+k,'no memory: every push is the whole velocity — the two characters coincide');
      else if(k===2) hud.set('J rose: <b>'+T4(TP[1].J)+'</b> → <b>'+F(TP[2].J,3)+'</b> — the overshoot being paid for','the velocity carried it through the floor and up the far wall');
      else if(be>=0.97) hud.set('step <b>'+k+'</b> · crossed the trough <b>'+crossings(k)+'×</b> so far · J = <b>'+big(J,3)+'</b>','heavy: the swings shrink slowly');
      else hud.set('step <b>'+k+'</b> · trolley J = <b>'+big(J,4)+'</b> · walker J = <b>'+big(TR[k].J,4)+'</b>',k===1?'the same first step: v was 0':'ringing up and down with shrinking swings while the walker crawls'); };
    const nxt=k=>{ if(tok!==run||!sc) return; if(k>=K){ draw(); if(arrived) sc.H.set('speed-up along the trough: 1/(1−β) = <b>'+(1/(1-be)).toFixed(1)+'</b>×','after '+K+' steps · trolley J = '+big(TP[K].J,4)+' · walker J = '+big(TR[K].J,4)+(be>=0.97?' · crossed the trough '+crossings(K)+'×':'')); else sc.H.set('after <b>'+K+'</b> steps · trolley J = <b>'+big(TP[K].J,4)+'</b> · walker J = <b>'+big(TR[K].J,4)+'</b>','still above 0.4 — give it more steps'); home(); return; }
      const a=[TR[k].w,TP[k].w], b=[TR[k+1].w,TP[k+1].w], dur=k===0?700:(k===1?900:300);
      /* the wonky wheel: the fresh push fights the velocity across the trough */
      if(k>=2){ const v=TP[k].w[1]-TP[k-1].w[1], pu=-eta*TP[k+1].g[1]; if(v*pu<0) sparks(sc.ctx,sc.V.at(clampW(TP[k].w),.16),sc.hx('s2'),7,600); }
      if(k===1) camTo(sc.handle,{theta:1.45,phi:1.2,radius:narrow?4.9:4.2},900);
      anim=tween(dur,u=>{ if(tok!==run) return; paint([[a[0][0]+(b[0][0]-a[0][0])*u,a[0][1]+(b[0][1]-a[0][1])*u],[a[1][0]+(b[1][0]-a[1][0])*u,a[1][1]+(b[1][1]-a[1][1])*u]],k+1); },
        ()=>{ if(tok!==run) return; k++; shown=k; paintTrails(); draw(); const wasArr=arrived; after(k); if(k===2||(arrived&&!wasArr)) anim=tween(600,()=>{},()=>nxt(k)); else nxt(k); }); };
    anim=camTo(sc.handle,{theta:1.95,phi:1.25,radius:narrow?4.4:3.7},1200,()=>{ if(tok!==run) return; nxt(0); }); }
  document.getElementById('tr-play').addEventListener('click',play);
  const preBar=document.getElementById('tr-pre');
  [['tr-p-none',0],['tr-p-std',0.9],['tr-p-heavy',0.97]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{
    pressOnly(preBar,e.currentTarget); be=v; setCtl('tr-beta',v,2); replan(); }));
  bindCtl('tr-beta',v=>{ be=v; pressOnly(preBar,null); replan(); },v=>fmt(v,2))();
  bindCtl('tr-eta',v=>{ eta=v; replan(); },v=>fmt(v,3))();
  bindCtl('tr-k',v=>{ K=v|0; replan(); },v=>String(v|0))();
  plan();
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const W=stage.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  replan();
})();

/* ================= W3 · THE PERMANENT RECORD (AdaGrad: two block towers that never shrink) ================= */
(function(){
  const box=document.getElementById('w-record'),stage=document.getElementById('rc-3d'),read=document.getElementById('rc-read'),verd=document.getElementById('rc-verdict');
  if(!box||!stage) return;
  let tab='two',K=12,al=0.10,shown=12,anim=null,run=0,T=null,sc=null,ST=null;
  const HB=.04, hOf=g=>HB*Math.log10(1+g*g);                            /* block height: log-compressed g² */
  const plan=()=>{ T=OPT.trace('ada',{c:10,alpha:al,N:40}); };
  const camHome=()=>({theta:.62,phi:1.05,radius:stage.clientWidth<560?8.2:6.95});
  const camFar=()=>({theta:.75,phi:.98,radius:stage.clientWidth<560?9.6:8.3});
  function build(){ sc=null; const narrow=stage.clientWidth<560;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:narrow?[3.7,4.7,5.9]:[3.3,3.9,4.9],look:narrow?[-.5,.4,0]:[-.2,.45,0],fov:36},autoRotate:.08,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors}=ctx, hx=hxOf(ctx), CR=critHex();
        const V=valleyScene(ctx,{c:10});
        const walker=walkerChar(ctx,CR,.065);
        const ghost=overlay(CIN.prim.arrow(ctx,[0,0,0],[.3,0,0],hx('s2'),{radius:.014,head:.09}),11); root.add(ghost);
        const trail=trailRibbon(ctx,CR,.018);
        const towers=[blockTower(ctx,CR,{pos:[-1.45,V.floorY,1.66],w:.24}),blockTower(ctx,CR,{pos:[-2.3,V.floorY,1.66],w:.24})];
        const tl=[slot(ctx,root),slot(ctx,root)];
        const ringG=new THREE.Group(); root.add(ringG); const rlab=slot(ctx,root);
        const panel=glassPanel(ctx,{pos:[0,1.55,-1.95],w:2.6,h:1.0});
        const bead=overlay(CIN.prim.dot(ctx,[0,0,0],CR,.03),12); panel.g.add(bead);
        const H=hudPair(stage); H.top.style.maxWidth=H.bot.style.maxWidth='calc(100% - 1.4rem)'; hint(stage,'drag to orbit');
        sc={ctx,root,colors,hx,CR,V,walker,ghost,trail,towers,tl,ringG,rlab,panel,bead,H,handle:null};
        paintPanel(); paintAll(); },
      update(){ return false; } });
    if(handle){ grab(handle,()=>false,()=>{}); if(sc) sc.handle=handle; }
    return handle; }
  const lgs=s=>Math.max(0,Math.min(1,(Math.log10(Math.max(1e-4,s/al))+2)/2.2));   /* stride/α on a log axis: 10⁻² … 10^.2 */
  function paintPanel(){ if(!sc) return; const {panel,hx,CR,colors}=sc; panel.clear();
    [0,1].forEach(j=>{ const pts=[]; for(let i=1;i<=40;i++) pts.push([i/40,lgs(T[i].stride[j])]); panel.curve(pts,CR,j?.013:.009); });
    const ref=[]; for(let i=1;i<=40;i++) ref.push([i/40,lgs(al/Math.sqrt(i))]); panel.curve(ref,hx('s7'),.006);
    panel.text('stride α/√A against step (log)',.5,.9,{size:16}); panel.text('α/√t',.94,lgs(al/Math.sqrt(40))+.08,{size:13,color:colors.s7});
    RR(sc.ctx); }
  function paintTowers(n){ if(!sc) return; const {towers,tl}=sc; towers.forEach((t,j)=>{ t.reset(); for(let i=1;i<=n;i++) t.push(hOf(T[i].g[j])); const A=T[n].A[j];
    tl[j].set('A'+SUB(j+1)+' = '+(A>=100?A.toFixed(0):(A>=10?A.toFixed(1):T4(A))),[t.g.position.x,t.g.position.y+t.height+.22,t.g.position.z],{size:16,color:cssv('critical'),bg:false,depthTest:false,scale:.006}); }); }
  function paintRing(n){ if(!sc) return; const {ringG,rlab,V}=sc; clearGroup(ringG); if(tab!=='long'||n<1){ rlab.hide(); RR(sc.ctx); return; }
    const w=T[n].w, L=V.J(w), pts=[]; for(let i=0;i<=56;i++){ const th=i/56*2*Math.PI; pts.push(V.at([Math.sqrt(2*L)*Math.cos(th),Math.sqrt(L/5)*Math.sin(th)],.02)); }
    const ring=polyTube(sc.ctx,pts,0x000000,.026,false); ring.traverse(m=>{ if(m.material){ m.material.transparent=true; m.material.opacity=sc.ctx.isLight?.35:.55; m.material.emissiveIntensity=0; } }); ringG.add(ring);
    rlab.hide(); }
  function paint(cur,k){ if(!sc) return; const {walker,ghost,V,bead,panel,H}=sc; const n=Math.min(shown,K), kk=k==null?n:k, w=cur||T[n].w;
    walker.setPos(V.at(w,.065)); walker.glow(Math.max(.25,Math.min(1,kk>=1?1/Math.sqrt(T[kk].A[0]):1)));
    const nx=T[Math.min(40,kk+1)].w, a=V.at(w,.04), b=V.at(nx,.04); const far=Math.hypot(b[0]-a[0],b[2]-a[2]); ghost.visible=far>.015&&kk<40; if(ghost.visible) ghost.userData.set(a,b);
    bead.position.set(...panel.toLocal(Math.max(1,kk)/40,lgs(T[Math.max(1,kk)].stride[1])));
    if(!cur){ const s=T[Math.max(1,n)];
      if(tab==='two') H.set('step <b>'+n+'</b> · A = [<b>'+T4(T[n].A[0])+'</b>, <b>'+(T[n].A[1]>=100?T[n].A[1].toFixed(0):T4(T[n].A[1]))+'</b>] · stride α/√A = [<b>'+F(s.stride[0],4)+'</b>, <b>'+F(s.stride[1],4)+'</b>]',n>=1?'step = stride × g = ['+F(s.step[0],4)+', '+F(s.step[1],4)+'] — the same distance in both weights':'press ▶ · every step drops a block on both towers');
      else H.set('step <b>'+n+'</b> · |w| = <b>'+F(Math.hypot(w[0],w[1]),4)+'</b> · stride now [<b>'+F(s.stride[0],4)+'</b>, <b>'+F(s.stride[1],4)+'</b>]','the towers never shrink, so the brake never lifts'); }
    RR(sc.ctx); }
  function paintAll(){ if(!sc) return; const n=Math.min(shown,K); sc.trail.reset(); for(let i=0;i<=n;i++) sc.trail.push(sc.V.at(T[i].w,.02)); paintTowers(n); paintRing(n); paint(); }
  function draw(){ const A1=T[1].A, A2=T[2].A, st1=T[1].step, st2=T[2].step;
    read.innerHTML='first step = <b>'+F(st1[0],4)+'</b> in BOTH weights — the slope 10 and the slope 1 move the same distance<br>'+
      'A = [<b>'+A1[0].toFixed(0)+'</b>, <b>'+A1[1].toFixed(0)+'</b>] → √A = [<b>'+Math.sqrt(A1[0]).toFixed(0)+'</b>, <b>'+Math.sqrt(A1[1]).toFixed(0)+'</b>] → step = α·g/√A = [<b>'+T4(st1[0])+'</b>, <b>'+T4(st1[1])+'</b>]<br>'+
      'A = [<b>'+T4(A2[0])+'</b>, <b>'+T4(A2[1])+'</b>] → step = [<b>'+F(st2[0],4)+'</b>, <b>'+F(st2[1],4)+'</b>] · w: [1,1] → [<b>'+T4(T[1].w[0])+'</b>, <b>'+T4(T[1].w[1])+'</b>] → [<b>'+F(T[2].w[0],4)+'</b>, <b>'+F(T[2].w[1],4)+'</b>]';
    if(tab==='long'){ verd.className='verdict bad'; verd.textContent='bad — the record never clears, so the brake never lifts: stalled at |w| = '+F(Math.hypot(T[40].w[0],T[40].w[1]),4)+' after 40 steps'; }
    else { verd.className='verdict good'; verd.textContent='good — both weights move '+F(st1[0],4)+' on step 1: the size of the slope has cancelled, only its sign survives'; }
    paintAll(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.08); }
  function play(){ stop(); const tok=run; plan(); shown=0; draw();
    if(!sc||!sc.handle||RM){ shown=K; draw(); return; }
    const narrow=stage.clientWidth<560, H={set(a,b){ if(sc) sc.H.set(a,b); }}; sc.handle.setAutoRotate(0);
    const home=(to)=>{ if(tok!==run||!sc||!sc.handle) return; anim=camTo(sc.handle,to,1600,()=>{ if(tok===run&&sc&&sc.handle) sc.handle.setAutoRotate(.08); }); };
    H.set('from [1, 1] the walker leaves at exactly <b>45°</b>','beat 1 · looking straight down the diagonal');
    const nxt=k=>{ if(tok!==run||!sc) return; if(k>=K){ finale(); return; }
      const a=T[k].w, b=T[k+1].w, dur=tab==='two'?280:130;
      anim=tween(dur,u=>{ if(tok!==run) return; paint([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u],k); },()=>{ if(tok!==run||!sc) return; k++; shown=k; sc.trail.push(sc.V.at(b,.02));
        sc.towers.forEach((t,j)=>t.push(hOf(T[k].g[j]))); paintTowers(k); if(tab==='long'&&(k%4===0||k===K)) paintRing(k); paint();
        if(k===1) flare(sc.ctx,sc.V.at(b,.06),sc.hx('s3'),900,1.5);
        if(tab==='two') sc.H.set('step <b>'+k+'</b> · A = [<b>'+T4(T[k].A[0])+'</b>, <b>'+(T[k].A[1]>=100?T[k].A[1].toFixed(0):T4(T[k].A[1]))+'</b>] · step = [<b>'+F(T[k].step[0],4)+'</b>, <b>'+F(T[k].step[1],4)+'</b>]',k===1?'√A = ['+T4(Math.sqrt(T[1].A[0]))+', '+T4(Math.sqrt(T[1].A[1]))+'] — the slope cancels, only its sign survives':'the w₂ tower is already '+(T[k].A[1]/T[k].A[0]).toFixed(0)+'× the w₁ tower');
        else sc.H.set('step <b>'+k+'</b> · |w| = <b>'+F(Math.hypot(b[0],b[1]),4)+'</b> · stride = [<b>'+F(T[k].stride[0],4)+'</b>, <b>'+F(T[k].stride[1],4)+'</b>]','the towers never shrink — the stride only falls');
        nxt(k); }); };
    const finale=()=>{ if(tok!==run||!sc) return; const w=T[K].w; draw();
      if(tab==='long'){ paintRing(K); flare(sc.ctx,sc.V.at(w,.06),critHex(),1000,1.8); H.set('stalled at |w| = <b>'+F(Math.hypot(w[0],w[1]),4)+'</b> after <b>'+K+'</b> steps · stride now <b>'+F(T[K].stride[1],4)+'</b>','the record never clears — the brake never lifts'); home(camFar()); }
      else { H.set('after <b>'+K+'</b> steps: w = [<b>'+F(w[0],4)+'</b>, <b>'+F(w[1],4)+'</b>] · A = [<b>'+T4(T[K].A[0])+'</b>, <b>'+T[K].A[1].toFixed(0)+'</b>]','a perfectly straight diagonal — and a stride that only shrinks'); home(camHome()); } };
    anim=camTo(sc.handle,{theta:-.785,phi:1.18,radius:narrow?4.8:4.1},1300,()=>{ if(tok!==run||!sc) return; if(tab==='long') camTo(sc.handle,camFar(),K*130+400); nxt(0); }); }
  document.getElementById('rc-play').addEventListener('click',play);
  bindCtl('rc-k',v=>{ stop(); K=v|0; shown=K; plan(); draw(); },v=>String(v|0))();
  bindCtl('rc-eta',v=>{ stop(); al=v; plan(); shown=K; paintPanel(); draw(); },v=>fmt(v,3))();
  tabs(document.getElementById('rc-tabs'),t=>{ stop(); tab=t; K=t==='long'?40:12; setCtl('rc-k',K,v=>String(v|0)); shown=K; plan(); draw();
    if(sc&&sc.handle) camTo(sc.handle,t==='long'?camFar():camHome(),1400); });
  plan();
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const W=stage.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W4 · FORM, NOT CAREER AVERAGE (RMSProp: the towers evaporate, the ghost stalls) ================= */
(function(){
  const box=document.getElementById('w-form'),stage=document.getElementById('fm-3d'),read=document.getElementById('fm-read'),verd=document.getElementById('fm-verdict');
  if(!box||!stage) return;
  let rho=0.900,al=0.10,K=12,shown=12,anim=null,run=0,T=null,TA=null,sc=null,ST=null;
  const HB=.04, hOf=g=>HB*Math.log10(1+g*g);
  const U=2.4,V2=1.3;
  const plan=()=>{ T=OPT.trace('rms',{c:10,alpha:al,rho,N:Math.max(K,30)}); TA=OPT.trace('ada',{c:10,alpha:al,N:Math.max(K,30)}); };
  const camHome=()=>({theta:.62,phi:1.05,radius:stage.clientWidth<560?8.2:6.95});
  const inside=w=>Math.abs(w[0])<=U*1.001&&Math.abs(w[1])<=V2*1.001;
  /* a position for any w: on the surface inside the footprint, hovering over the floor beyond it */
  function pos3(w,lift){ const V=sc.V; if(inside(w)) return V.at(w,lift); const x=Math.max(-3.2,Math.min(3.2,w[0])), z=-Math.max(-2.3,Math.min(2.3,w[1])); return [x,V.floorY+.3+(lift||0),z]; }
  function build(){ sc=null; const narrow=stage.clientWidth<560;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:narrow?[3.7,4.7,5.9]:[3.3,3.9,4.9],look:narrow?[-.5,.4,0]:[-.2,.45,0],fov:36},autoRotate:.08,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx), CR=critHex();
        const V=valleyScene(ctx,{c:10});
        const walker=walkerChar(ctx,hx('s2'),.07);
        const ghost=walkerChar(ctx,CR,.06); ghost.dot.material.opacity=.8; ghost.halo.material.opacity=(isLight?.32:.65)*.55;
        const trail=trailRibbon(ctx,hx('s2'),.022), gtrail=trailRibbon(ctx,CR,.012);
        const tail=cometTail(ctx,hx('s2'));
        const towers=[blockTower(ctx,hx('s2'),{pos:[-1.45,V.floorY,1.66],w:.24}),blockTower(ctx,hx('s2'),{pos:[-2.3,V.floorY,1.66],w:.24})];
        const tl=[slot(ctx,root),slot(ctx,root)];
        const panel=glassPanel(ctx,{pos:[0,1.55,-1.95],w:2.6,h:1.0});
        const bead=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s2'),.03),12); panel.g.add(bead); const gbead=overlay(CIN.prim.dot(ctx,[0,0,0],CR,.024),12); panel.g.add(gbead);
        const H=hudPair(stage); H.top.style.maxWidth=H.bot.style.maxWidth='calc(100% - 1.4rem)'; hint(stage,'drag to orbit');
        sc={ctx,root,colors,hx,CR,V,walker,ghost,trail,gtrail,tail,towers,tl,panel,bead,gbead,H,handle:null};
        paintPanel(); paintAll(); },
      update(){ return false; } });
    if(handle){ grab(handle,()=>false,()=>{}); if(sc) sc.handle=handle; }
    return handle; }
  const lgs=s=>Math.max(0,Math.min(1,(Math.log10(Math.max(1e-4,s/al))+2)/3.6));   /* stride/α on a log axis: 10⁻² … 10^1.6 */
  function paintPanel(){ if(!sc) return; const {panel,hx,CR,colors}=sc; panel.clear(); const N=30;
    const pts=[]; for(let i=1;i<=N;i++) pts.push([i/N,lgs(T[i].stride[1])]); panel.curve(pts,hx('s2'),.013);
    const pa=[]; for(let i=1;i<=N;i++) pa.push([i/N,lgs(TA[i].stride[1])]); panel.curve(pa,CR,.009);
    panel.hline(lgs(al),hx('s7'),true);
    panel.text('the stride α/√A against step (log)',.5,.9,{size:16}); panel.text('α',.95,lgs(al)+.07,{size:13,color:colors.s7});
    RR(sc.ctx); }
  function paintTowers(n){ if(!sc) return; const {towers,tl}=sc; towers.forEach((t,j)=>{ t.reset(); for(let i=1;i<=n;i++){ t.push(hOf(T[i].g[j])); t.fadeOld(rho); } const A=T[n].A[j];
    tl[j].set('A'+SUB(j+1)+' = '+G4(A),[t.g.position.x,t.g.position.y+t.height+.22,t.g.position.z],{size:16,color:sc.colors.s2,bg:false,depthTest:false,scale:.006}); }); }
  function paint(cur,k){ if(!sc) return; const {walker,ghost,V,bead,gbead,panel,H}=sc; const n=Math.min(shown,K), kk=k==null?n:k, w=cur?cur[0]:T[n].w, wa=cur?cur[1]:TA[n].w;
    walker.setPos(pos3(w,.07)); ghost.setPos(pos3(wa,.055));
    walker.glow(Math.max(.4,Math.min(2.2,kk>=1?T[kk].stride[0]/al:1))); ghost.glow(Math.max(.25,Math.min(1,kk>=1?1/Math.sqrt(TA[kk].A[0]):1))*.5);
    bead.position.set(...panel.toLocal(Math.max(1,Math.min(30,kk))/30,lgs(T[Math.max(1,Math.min(30,kk))].stride[1]))); gbead.position.set(...panel.toLocal(Math.max(1,Math.min(30,kk))/30,lgs(TA[Math.max(1,Math.min(30,kk))].stride[1])));
    if(!cur){ const s=T[Math.max(1,n)];
      H.set('step <b>'+n+'</b> · stride α/√A = [<b>'+F(s.stride[0],4)+'</b>, <b>'+F(s.stride[1],4)+'</b>] · J = <b>'+big(T[n].J,4)+'</b>','ρ = '+F(rho,3)+' · memory ≈ '+Math.round(1/Math.max(1e-6,1-rho))+' steps · the red ghost is AdaGrad, J = '+big(TA[n].J,4)); }
    RR(sc.ctx); }
  function paintAll(){ if(!sc) return; const n=Math.min(shown,K); sc.trail.reset(); sc.gtrail.reset(); sc.tail.clear();
    for(let i=0;i<=n;i++){ sc.trail.push(pos3(T[i].w,.035)); sc.gtrail.push(sc.V.at(TA[i].w,.02)); } sc.gtrail.fade(.4);
    paintTowers(n); paint(); }
  function draw(){ const A1=T[1].A, inf=1/Math.sqrt(Math.max(1e-9,1-rho));
    read.innerHTML='A = [<b>'+G4(A1[0])+'</b>, <b>'+G4(A1[1])+'</b>] → √A = [<b>'+F(Math.sqrt(A1[0]),4)+'</b>, <b>'+F(Math.sqrt(A1[1]),4)+'</b>] → step = [<b>'+F(T[1].step[0],4)+'</b>, <b>'+F(T[1].step[1],4)+'</b>]<br>'+
      'w: [1,1] → [<b>'+F(T[1].w[0],4)+'</b>, <b>'+F(T[1].w[1],4)+'</b>] → [<b>'+F(T[2].w[0],4)+'</b>, <b>'+F(T[2].w[1],4)+'</b>] · J: <b>5.5</b> → <b>'+F(T[1].J,4)+'</b> → <b>'+F(T[2].J,4)+'</b><br>'+
      'memory horizon ≈ 1/(1−ρ) = <b>'+Math.round(1/Math.max(1e-6,1-rho))+'</b> steps · first step = <b>'+trim(inf.toPrecision(3))+' × α</b> (inflation = 1/√(1−ρ))';
    if(rho>=0.99){ verd.className='verdict bad'; verd.textContent='bad — the zero start puffs the first step by '+trim(inf.toPrecision(3))+'×'; }
    else { verd.className='verdict good'; verd.textContent='good — the brake eases, the stride stays alive: '+F(T[1].step[1],4)+' → '+F(T[2].step[1],4)+' → …'; }
    paintAll(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.08); }
  function play(){ stop(); const tok=run; plan(); shown=0; draw();
    if(!sc||!sc.handle||RM){ shown=K; draw(); return; }
    const narrow=stage.clientWidth<560, H={set(a,b){ if(sc) sc.H.set(a,b); }}, inf=1/Math.sqrt(Math.max(1e-9,1-rho)); sc.handle.setAutoRotate(0); let arrived=false;
    const home=()=>{ if(tok!==run||!sc||!sc.handle) return; anim=camTo(sc.handle,camHome(),1500,()=>{ if(tok===run&&sc&&sc.handle) sc.handle.setAutoRotate(.08); }); };
    H.set('ρ = <b>'+F(rho,3)+'</b> · memory ≈ <b>'+Math.round(1/Math.max(1e-6,1-rho))+'</b> steps · first stride = <b>'+trim(inf.toPrecision(3))+' × α</b>','beat 1 · the amber walker forgets, the red ghost never does');
    const nxt=k=>{ if(tok!==run||!sc) return; if(k>=K){ finale(); return; }
      const a=T[k].w, b=T[k+1].w, ga=TA[k].w, gb=TA[k+1].w, launch=k===0&&!inside(b), dur=launch?1300:(k===0?420:280);
      const p0=pos3(a,.07);
      anim=tween(dur,u=>{ if(tok!==run||!sc) return; const w=[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u], wa=[ga[0]+(gb[0]-ga[0])*u,ga[1]+(gb[1]-ga[1])*u]; paint([w,wa],k+1);
          if(launch||(k===1&&!inside(a))){ const p=sc.walker.g.position; sc.tail.set(p0,[p.x,p.y,p.z]); } },
        ()=>{ if(tok!==run||!sc) return; k++; shown=k; sc.trail.push(pos3(b,.035)); sc.gtrail.push(sc.V.at(gb,.02)); sc.gtrail.fade(.4);
          sc.towers.forEach((t,j)=>{ t.push(hOf(T[k].g[j])); t.fadeOld(rho); }); paintTowers(k); paint();
          const p=pos3(b,.06);
          if(launch){ sparks(sc.ctx,p,sc.hx('s2'),10,750); flare(sc.ctx,p,critHex(),1000,2.2); sc.H.set('first step = <b>'+trim(inf.toPrecision(3))+' × α</b> — the zero start puffed it up','w = ['+F(b[0],3)+', '+F(b[1],3)+'] — off the map; the trace does come back'); }
          else if(k===2&&!inside(a)) sc.H.set('step <b>2</b> · back on the map at w = [<b>'+F(b[0],3)+'</b>, <b>'+F(b[1],3)+'</b>]','A now remembers the huge first slope, so the stride has calmed down');
          else if(!arrived&&T[k].J<1e-3){ arrived=true; flare(sc.ctx,p,sc.hx('s2'),1000,1.8); sc.H.set('RMSProp reaches J < 10⁻³ at step <b>'+k+'</b>','the ghost is still at |w| = '+F(Math.hypot(gb[0],gb[1]),3)+' — its brake never lifted'); }
          else if(!arrived) sc.H.set('step <b>'+k+'</b> · stride = [<b>'+F(T[k].stride[0],4)+'</b>, <b>'+F(T[k].stride[1],4)+'</b>] · J = <b>'+big(T[k].J,4)+'</b>','old blocks sink and fade at rate ρ — the tower stays short · ghost J = '+big(TA[k].J,4));
          if(launch||(k===2&&!inside(a))||arrived&&T[k].J<1e-3&&T[k-1].J>=1e-3) anim=tween(650,()=>{},()=>nxt(k)); else nxt(k); }); };
    const finale=()=>{ if(tok!==run||!sc) return; draw(); if(!arrived) sc.H.set('after <b>'+K+'</b> steps · J = <b>'+big(T[K].J,4)+'</b> · the ghost J = <b>'+big(TA[K].J,4)+'</b>','the stride is still alive: '+F(T[K].stride[1],4)+' against the ghost\'s '+F(TA[K].stride[1],4)); else sc.H.set('RMSProp reached J < 10⁻³ · after <b>'+K+'</b> steps J = <b>'+big(T[K].J,4)+'</b> · the ghost J = <b>'+big(TA[K].J,4)+'</b>','the stride is still alive: '+F(T[K].stride[1],4)+' against the ghost\'s '+F(TA[K].stride[1],4)); home(); };
    anim=camTo(sc.handle,{theta:.95,phi:1.15,radius:narrow?5.4:4.6},1100,()=>{ if(tok!==run) return; nxt(0); }); }
  document.getElementById('fm-play').addEventListener('click',play);
  const preBar=document.getElementById('fm-pre');
  [['fm-p-std',0.900],['fm-p-long',0.999]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{
    pressOnly(preBar,e.currentTarget); rho=v; setCtl('fm-rho',v,3); stop(); plan(); shown=K; paintPanel(); draw(); play(); }));
  bindCtl('fm-rho',v=>{ stop(); rho=v; pressOnly(preBar,null); plan(); shown=K; paintPanel(); draw(); },v=>fmt(v,3))();
  bindCtl('fm-eta',v=>{ stop(); al=v; plan(); shown=K; paintPanel(); draw(); },v=>fmt(v,3))();
  bindCtl('fm-k',v=>{ stop(); K=v|0; shown=K; plan(); paintPanel(); draw(); },v=>String(v|0))();
  plan();
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const W=stage.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W5 · TWO NOTEBOOKS AND A PROBATION (Adam: two glass books filling with ink, a lamp on probation) ================= */
(function(){
  const box=document.getElementById('w-notebooks'),stage=document.getElementById('nb-3d'),read=document.getElementById('nb-read'),chip=document.getElementById('nb-chip'),verd=document.getElementById('nb-verdict');
  if(!box||!stage) return;
  let t=1,rF=0.90,rA=0.9990,al=0.10,anim=null,run=0,T=null,sc=null,ST=null;
  const plan=()=>{ T=OPT.trace('adam',{c:10,alpha:al,rhoF:rF,rhoA:rA,N:60}); };
  function minRate(){ let mi=1,mv=Infinity; for(let k=1;k<=60;k++){ const v=OPT.rateOf(k,al,rF,rA); if(v<mv){ mv=v; mi=k; } } return [mv,mi]; }
  const camHome=()=>({theta:.62,phi:1.05,radius:stage.clientWidth<560?8.2:6.95});
  const BH=1.0;
  function build(){ sc=null; const narrow=stage.clientWidth<560;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:narrow?[3.7,4.7,5.9]:[3.3,3.9,4.9],look:narrow?[-.5,.4,0]:[-.2,.45,0],fov:36},autoRotate:.08,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const V=valleyScene(ctx,{c:10});
        const walker=walkerChar(ctx,hx('s4'),.07);
        const trail=trailRibbon(ctx,hx('s4'),.018);
        const lamp=lampChar(ctx,hx('s4'),[1,1.6,-1]); lamp.g.scale.setScalar(1.25);
        /* two notebooks: glass slabs standing at the front corners, an ink block inside each */
        const books=[['s4',-2.4],['s2',-1.6]].map(([c,x])=>{ const g=new THREE.Group(); root.add(g); g.position.set(x,V.floorY,1.7);
          const pane=CIN.prim.glass(ctx,.5,BH+.1,hx(c),isLight?.12:.14); pane.position.y=(BH+.1)/2; g.add(pane);
          const frame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.5,BH+.1,.14)),new THREE.LineBasicMaterial({color:hx('ink2'),transparent:true,opacity:.4})); frame.position.y=(BH+.1)/2; g.add(frame);
          const ink=new THREE.Mesh(new THREE.BoxGeometry(.44,1,.1),new THREE.MeshStandardMaterial({color:hx(c),emissive:hx(c),emissiveIntensity:isLight?.15:.55,roughness:.35,transparent:true,opacity:.9})); g.add(ink);
          return {g,ink,c}; });
        const bl=[slot(ctx,root),slot(ctx,root)];
        const panel=glassPanel(ctx,{pos:[0,1.55,-1.95],w:2.6,h:1.0});
        const bead=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.032),12); panel.g.add(bead);
        const H=hudPair(stage); H.top.style.maxWidth=H.bot.style.maxWidth='calc(100% - 1.4rem)'; hint(stage,'drag to orbit');
        sc={ctx,root,colors,hx,V,walker,trail,lamp,books,bl,panel,bead,H,handle:null};
        paintPanel(); paintAll(); },
      update(){ return false; } });
    if(handle){ grab(handle,()=>false,()=>{}); if(sc) sc.handle=handle; }
    return handle; }
  let LO=-2.2, HI=-.7;
  const lga=v=>Math.max(0,Math.min(1,(Math.log10(Math.max(1e-9,v))-LO)/(HI-LO)));
  function paintPanel(){ if(!sc) return; const {panel,hx,colors}=sc; panel.clear(); const [mv,mi]=minRate();
    LO=Math.log10(Math.max(1e-6,Math.min(mv,al)*.6)); HI=Math.log10(al*1.8);
    const pts=[]; for(let k=1;k<=40;k++) pts.push([k/40,lga(OPT.rateOf(k,al,rF,rA))]); panel.curve(pts,hx('s4'),.013);
    panel.hline(lga(al),hx('s7'),true);
    panel.text('the rate on probation: αₜ against t (log)',.5,.9,{size:16}); panel.text('α = '+T4(al),.93,lga(al)+.07,{size:13,color:colors.s7});
    RR(sc.ctx); }
  function paint(cur){ if(!sc) return; const {walker,V,lamp,books,bl,bead,panel,H}=sc; const tt=cur==null?t:cur, S=T[Math.max(1,Math.min(60,Math.round(tt)))];
    const w=cur==null?S.w:(()=>{ const a=T[Math.max(1,Math.floor(tt))].w, b=T[Math.max(1,Math.min(60,Math.ceil(tt)))].w, u=tt-Math.floor(tt); return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u]; })();
    const p=V.at(w,.07); walker.setPos(p); lamp.g.position.set(p[0],p[1]+.62,p[2]); const k=S.at/al; lamp.set(k); walker.glow(.6+.6*k);
    const fills=[1-Math.pow(rF,Math.round(tt)),1-Math.pow(rA,Math.round(tt))];
    books.forEach((b,j)=>{ const f=Math.max(.004,Math.min(1,fills[j]))*BH; b.ink.scale.y=f; b.ink.position.y=.05+f/2;
      bl[j].set((j?'how loud · ':'which way · ')+(fills[j]*100).toFixed(fills[j]<.1?2:1)+' % full',[b.g.position.x+(j?.25:-.15),b.g.position.y+BH+(j?.2:.44),b.g.position.z],{size:15,color:sc.colors[b.c],bg:true,depthTest:false,scale:.006}); });
    bead.position.set(...panel.toLocal(Math.min(40,tt)/40,lga(S.at)));
    if(cur==null) H.set('t = <b>'+t+'</b> · αₜ = <b>'+F(S.at,6)+'</b> · lamp at <b>'+(k*100).toFixed(0)+' %</b> of α','the books are '+(fills[0]*100).toFixed(1)+' % and '+(fills[1]*100).toFixed(fills[1]<.1?2:1)+' % full — the lamp is the correction, retiring itself');
    RR(sc.ctx); }
  function paintAll(){ if(!sc) return; sc.trail.reset(); for(let i=0;i<=Math.min(t,60);i++) sc.trail.push(sc.V.at(T[i].w,.02)); paint(); }
  function draw(){ const S=T[Math.max(1,Math.min(60,t))], st=S.step, [mv,mi]=minRate();
    read.innerHTML='F = [<b>'+G4(S.Fm[0])+'</b>, <b>'+G4(S.Fm[1])+'</b>] · A = [<b>'+G4(S.A[0])+'</b>, <b>'+G4(S.A[1])+'</b>]<br>'+
      'α'+SUB(t)+' = <b>'+F(S.at,6)+'</b> · F/√A = [<b>'+F(S.Fm[0]/Math.sqrt(S.A[0]||1e-12),4)+'</b>, <b>'+F(S.Fm[1]/Math.sqrt(S.A[1]||1e-12),4)+'</b>] · step = [<b>'+F(st[0],4)+'</b>, <b>'+F(st[1],4)+'</b>]<br>'+
      '→ w = [<b>'+F(S.w[0],4)+'</b>, <b>'+F(S.w[1],4)+'</b>] · J = <b>'+big(S.J,4)+'</b>';
    chip.innerHTML='αₜ bottoms out at <b>'+F(mv,6)+'</b> at t = <b>'+mi+'</b>, then climbs back to α = '+T4(al)+' — the correction retires itself.';
    if(1-Math.pow(rF,Math.max(1,t))<1e-6){ verd.className='verdict info'; verd.textContent='info — the which-way book is empty to machine precision; the correction is held finite on purpose'; }
    else { verd.className='verdict good'; verd.textContent='good — first step exactly α in both weights: RMSProp’s 0.3162 spike is gone'; }
    paintAll(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.08); }
  function play(){ stop(); const tok=run; t=1; setCtl('nb-t',1,v=>String(v|0)); draw();
    if(!sc||!sc.handle||RM){ t=40; setCtl('nb-t',40,v=>String(v|0)); draw(); return; }
    const narrow=stage.clientWidth<560, [mv,mi]=minRate(); sc.handle.setAutoRotate(0);
    sc.H.set('t = <b>1</b> · both books nearly empty · αₜ = <b>'+F(T[1].at,6)+'</b>','the lamp is dim: the rate is on probation');
    camTo(sc.handle,{theta:.15,phi:1.0,radius:narrow?8.8:7.5},5200);
    const nxt=()=>{ if(tok!==run||!sc) return; if(t>=40){ sc.H.set('t = <b>40</b> · αₜ = <b>'+F(T[40].at,6)+'</b> · the lamp is back to <b>'+(T[40].at/al*100).toFixed(0)+' %</b>','the which-way book is '+((1-Math.pow(rF,40))*100).toFixed(1)+' % full — the probation is over'); if(sc.handle) sc.handle.setAutoRotate(.08); return; }
      const a=t; anim=tween(125,u=>{ if(tok!==run) return; paint(a+u); },()=>{ if(tok!==run||!sc) return; t=a+1; setCtl('nb-t',t,v=>String(v|0)); draw();
        if(t===mi){ flare(sc.ctx,sc.lamp.g.position.toArray(),sc.hx('s4'),1000,1.7); sc.H.set('αₜ bottoms out here: <b>'+F(mv,6)+'</b>','t = '+mi+' · the lamp is at its dimmest — from here the books fill faster than the rate shrinks'); }
        nxt(); }); };
    nxt(); }
  plan();
  document.getElementById('nb-play').addEventListener('click',play);
  document.getElementById('nb-p-def').addEventListener('click',e=>{ pressOnly(document.getElementById('nb-pre'),e.currentTarget); stop();
    rF=0.90; rA=0.9990; t=1; setCtl('nb-rf',rF,2); setCtl('nb-rho',rA,4); setCtl('nb-t',1,v=>String(v|0)); plan(); paintPanel(); draw(); });
  bindCtl('nb-t',v=>{ stop(); t=Math.max(1,v|0); draw(); },v=>String(v|0))();
  bindCtl('nb-rf',v=>{ stop(); rF=v; plan(); paintPanel(); draw(); },v=>fmt(v,2))();
  bindCtl('nb-rho',v=>{ stop(); rA=v; plan(); paintPanel(); draw(); },v=>fmt(v,4))();
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const W=stage.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= OPENING SHOT · five walkers race, then someone builds a wall (written last: wires the existing #hero-3d) ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced, NST=20, STEP=.38, T_RACE=10, T_WALL=5, T_PRICE=6, T_BACK=3;
  const TR={}; M5.forEach(m=>{ TR[m.k]=OPT.trace(m.k,{c:10,alpha:.1,N:NST}); });
  let ARR=-1; for(let i=1;i<=NST;i++) if(TR.rms[i].J<1e-3){ ARR=i; break; }
  const CAMS={race0:{theta:-.55,phi:1.24,radius:4.8},race1:{theta:.75,phi:.95,radius:7.8},wall:{theta:.9,phi:1.0,radius:7.6},price:{theta:1.6,phi:1.05,radius:7.2},back:{theta:.9,phi:1.0,radius:7.6}};
  const lerpC=(a,b,u)=>({theta:a.theta+(b.theta-a.theta)*u,phi:a.phi+(b.phi-a.phi)*u,radius:a.radius+(b.radius-a.radius)*u});
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches, narrow=!wide;
    const K=narrow?{race0:{theta:-.55,phi:1.22,radius:5.0},race1:{theta:.75,phi:.98,radius:7.2},wall:{theta:.9,phi:1.02,radius:7.0},price:{theta:1.6,phi:1.05,radius:6.8},back:{theta:.9,phi:1.02,radius:7.0}}:CAMS;
    const c0=reduced?K.wall:K.race0, look=[0,.3,0], pos=[look[0]+c0.radius*Math.sin(c0.phi)*Math.sin(c0.theta),look[1]+c0.radius*Math.cos(c0.phi),look[2]+c0.radius*Math.sin(c0.phi)*Math.cos(c0.theta)];
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:0,
      camera:{pos,look,fov:wide?30:34},
      build(ctx){
        const {THREE,root,colors,isLight,camera,renderer}=ctx, hx=hxOf(ctx), dark=!isLight;
        let offW=0; const applyOffset=()=>{ const w=ctx.size.w, h=ctx.size.h; if(!wide||!w||w===offW) return; offW=w; camera.setViewOffset(w,h,-Math.round(w*.2),0,w,h); };
        applyOffset();
        if(dark){ const n=520, sp=new Float32Array(n*3);
          for(let k=0;k<n;k++){ let x,y,z; do{ x=(Math.random()*2-1)*22; y=(Math.random()*2-1)*12; z=(Math.random()*2-1)*22-4; }while(Math.hypot(x,y-1,z)<6); sp[3*k]=x; sp[3*k+1]=y; sp[3*k+2]=z; }
          const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
          root.add(new THREE.Points(sg,new THREE.PointsMaterial({color:hx('ink2'),size:.055,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}))); }
        { const top=new THREE.DirectionalLight(0xffffff,dark?.5:.25); top.position.set(2,8,3); root.add(top); }
        const V=valleyScene(ctx,{c:10,labels:false,res:80,opacity:isLight?.97:.93});
        { const vis=fadeAttr(THREE,V.surf), pos=V.surf.userData.geo.attributes.position;
          for(let i=0;i<pos.count;i++){ const r=Math.max(Math.abs(pos.getX(i))/2.4,Math.abs(pos.getZ(i))/1.3); vis.setX(i,r<.93?1:Math.max(0,1-(r-.93)/.07)); } vis.needsUpdate=true; }
        /* the banned half darkens the surface itself (the floor slab alone hides under the surface) */
        const colA=V.surf.userData.geo.attributes.color, posA=V.surf.userData.geo.attributes.position, base=colA.array.slice(), tint=new THREE.Color(hx('s2')).convertSRGBToLinear();
        let shadeKey=''; const shade=(c,k)=>{ const key=c.toFixed(3)+'|'+k.toFixed(3); if(key===shadeKey) return; shadeKey=key;
          for(let i=0;i<posA.count;i++){ const x=posA.getX(i); const f=x<c?k:0; if(dark){ const m=1-.72*f; colA.setXYZ(i,base[3*i]*m,base[3*i+1]*m,base[3*i+2]*m); } else colA.setXYZ(i,base[3*i]*(1-.45*f)+tint.r*.45*f,base[3*i+1]*(1-.45*f)+tint.g*.45*f,base[3*i+2]*(1-.45*f)+tint.b*.45*f); }
          colA.needsUpdate=true; };
        const W=M5.map((m,i)=>{ const col=CIN.hex(cssv(m.c)); const ch=walkerChar(ctx,col,.07); ch.dot.material.transparent=true; const tr=trailRibbon(ctx,col,.02); const tail=cometTail(ctx,col); return {m,col,ch,tr,tail,i}; });
        const starHalo=haloSprite(ctx,hx('s3'),.55); root.add(starHalo);
        const wall=wallPanel(ctx,{w:2.8,h:1.5}); wall.setX(1); wall.setH(.001); wall.show(false); wall.g.children[0].material.opacity=isLight?.3:.36; wall.g.children[0].material.emissiveIntensity=isLight?.2:.5;
        /* the wall's foot: a lit seam where the glass meets the valley */
        const footG=new THREE.Group(); root.add(footG); { const pts=[]; for(let j=0;j<=24;j++) pts.push(V.at([1,-1.3+2.6*j/24],.02)); footG.add(polyTube(ctx,pts,hx('s2'),.022,false)); footG.visible=false; }
        const foot=c=>{ footG.position.set(c-1,(c*c/2-.5)*V.zs,0); };   /* the seam at c is the seam at 1, shifted */
        const banned=bannedFloor(ctx,{w:3.2,d:3}); banned.setX(-2.6,1); banned.show(false); const bOp=banned.m.material.opacity;
        const panel=glassPanel(ctx,{pos:[-2.9,1.2,0],w:2.4,h:1.0,yaw:Math.PI/2}); panel.show(false);
        const fv=c=>.08+c*c/2/1.05; const pts=[]; for(let j=0;j<=36;j++){ const c=1.4*j/36; pts.push([c/1.4,fv(c)]); } panel.curve(pts,hx('s1'),.012);
        panel.curve([[.7/1.4,fv(1)-.3],[1.3/1.4,fv(1)+.3]],hx('s3'),.008);
        panel.text('f* = c²/2 · the wall’s price',.5,.9,{size:16}); panel.text('slope at c = 1 is µ* = 1',.32,.62,{size:13,color:colors.s3});
        const pbead=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.032),12); panel.g.add(pbead);
        const chip=slot(ctx,root), chip2=slot(ctx,root), hudEl=hud(box,wide?'hud-r':''); hudEl.style.maxWidth='calc(100% - 1.4rem)'; hint(box,'drag to orbit');
        const placeStar=c=>{ const q=V.at([c,0],.012); V.star.position.set(q[0],q[1],q[2]); starHalo.position.set(q[0],q[1]+.02,q[2]); };
        const placeW=(kf)=>{ const k=Math.floor(kf), u=CIN.ease.out(kf-k);
          W.forEach(w=>{ const T=TR[w.m.k], a=T[Math.min(k,NST)].w, b=T[Math.min(k+1,NST)].w, pos=[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
            w.ch.setPos(V.at(pos,.07+.006*w.i)); if(k>=1||u>0){ w.tail.set(V.at(a,.09),V.at(pos,.09)); } else w.tail.clear(); }); };
        const alphaW=a=>{ W.forEach(w=>{ w.ch.dot.material.opacity=a; w.ch.halo.material.opacity=(dark?.65:.32)*a; w.ch.show(a>.02); w.tail.show(a>.02); }); };
        const fadeTrails=k=>{ W.forEach(w=>w.tr.fade(k)); };
        const resetTrails=()=>{ W.forEach(w=>{ w.tr.reset(); w.tr.push(V.at(TR[w.m.k][0].w,.02)); }); };
        /* the orbit is attached to ctx only after build() returns, so the camera is driven from tick() */
        let held=false; renderer.domElement.addEventListener('pointerdown',()=>{ held=true; });
        const cur=()=>{ const s=ctx.orbit.sph; return {theta:s.theta,phi:s.phi,radius:s.radius}; };
        const st={phase:'race',t0:null,k:-1,from:null,arrived:false,lit:false,relit:false};
        const enter=(ph,t)=>{ st.phase=ph; st.t0=t; st.k=-1; st.from=cur(); box.dataset.phase=ph; if(ph==='race') held=false; };
        const drive=(target,e,blend)=>{ if(held||!ctx.orbit) return; const u=easeIO(Math.min(1,e/blend)), c=lerpC(st.from,target,u), s=ctx.orbit.sph; s.theta=c.theta; s.phi=c.phi; s.radius=c.radius; ctx.orbit.place(); };
        box.dataset.phase='race';
        resetTrails(); placeW(0); alphaW(1); placeStar(0); shade(1,0);
        const setChips=(c,fs)=>{ const q=V.at([c,0],.012);
          chip.set('f* : 0 → '+fs,[q[0]+.55,q[1]+.62,q[2]],{size:17,color:colors.s4,depthTest:false,scale:.005});
          chip2.set('the wall’s price  µ* = 1',[q[0]+.55,q[1]+.40,q[2]],{size:15,color:colors.s3,depthTest:false,scale:.0046}); };
        ctx.hero={tick(t){ applyOffset(); if(!ctx.orbit) return true; if(st.t0==null){ st.t0=t; st.from=cur(); } const e=t-st.t0;
          if(box.dataset.phase!==st.phase) box.dataset.phase=st.phase;
          if(st.phase==='race'){
            const kf=Math.min(NST,e/STEP), k=Math.floor(kf);
            if(k!==st.k){ for(let j=Math.max(1,st.k+1);j<=k;j++) W.forEach(w=>w.tr.push(V.at(TR[w.m.k][j].w,.02))); st.k=k;
              if(!st.arrived&&ARR>0&&k>=ARR){ st.arrived=true; flare(ctx,V.at([0,0],.06),hx('s2'),1000,2.0); } }
            placeW(kf);
            drive(lerpC(K.race0,K.race1,easeIO(Math.min(1,e/T_RACE))),e,2.2);
            hudEl.innerHTML=st.arrived?'RMSProp arrives · step <b>'+ARR+'</b>':'Five walkers · one valley';
            if(e>=T_RACE){ enter('wall',t); } }
          else if(st.phase==='wall'){
            const u=Math.min(1,e/T_WALL); wall.show(true); banned.show(true);
            const h=Math.min(1,e/.8); wall.setH(Math.max(.001,h)); banned.m.material.opacity=bOp*h; shade(1,h); foot(1); footG.visible=true; footG.traverse(m=>{ if(m.material) m.material.opacity=Math.min(1,e/.5); });
            if(!st.lit&&e>.05){ st.lit=true; [-.9,0,.9].forEach(z=>flare(ctx,[1,.02,z],hx('s2'),900,1.3)); }
            fadeTrails(1-.75*Math.min(1,e/1.2)); alphaW(Math.max(0,1-e/1.0));
            const sx=easeIO(Math.max(0,Math.min(1,(e-1)/1.2))); placeStar(sx);
            if(sx>=1&&!st.relit){ st.relit=true; flare(ctx,V.at([1,0],.06),hx('s3'),900,1.6); }
            setChips(sx,(sx*sx/2).toFixed(sx>=1?1:2));
            drive(K.wall,e,1.8);
            hudEl.innerHTML='Then someone builds a wall · f* : 0 → <b>0.5</b> · the wall’s price µ* = <b>1</b>';
            if(e>=T_WALL){ enter('price',t); panel.show(true); } }
          else if(st.phase==='price'){
            const c=1-.4*(.5-.5*Math.cos(2*Math.PI*Math.min(1,e/T_PRICE)));
            wall.setX(c); banned.setX(-2.6,c); shade(c,1); foot(c); placeStar(c); fadeTrails(.25); alphaW(0);
            pbead.position.set(...panel.toLocal(c/1.4,fv(c)));
            const q=V.at([c,0],.012);
            chip.set('c = '+c.toFixed(2)+' · f* = '+(c*c/2).toFixed(3),[q[0]+.55,q[1]+.62,q[2]],{size:17,color:colors.s4,depthTest:false,scale:.005});
            chip2.set('price says 0.5 + 1·(c − 1) = '+nm((0.5+(c-1)).toFixed(3)),[q[0]+.55,q[1]+.40,q[2]],{size:15,color:colors.s3,depthTest:false,scale:.0046});
            drive(K.price,e,2.2);
            hudEl.innerHTML='Then someone builds a wall · c = <b>'+c.toFixed(2)+'</b> · f* = <b>'+(c*c/2).toFixed(3)+'</b>';
            if(e>=T_PRICE){ enter('back',t); } }
          else {
            const u=Math.min(1,e/T_BACK); const h=Math.max(0,1-e/1.0); wall.setH(Math.max(.001,h)); wall.show(h>.002); banned.m.material.opacity=bOp*h; banned.show(h>.002); shade(1,h); footG.visible=h>.002; footG.traverse(m=>{ if(m.material) m.material.opacity=h; });
            const sx=1-easeIO(Math.max(0,Math.min(1,(e-.4)/1.4))); placeStar(sx); if(e>1.2) panel.show(false);
            fadeTrails(Math.max(0,.25-.25*u*1.4)); if(e<1.4) setChips(sx,(sx*sx/2).toFixed(2)); else { chip.hide(); chip2.hide(); }
            if(u>.75){ resetTrails(); placeW(0); alphaW((u-.75)/.25); } else alphaW(0);
            drive(K.back,e,1.5);
            hudEl.innerHTML='Then someone builds a wall';
            if(e>=T_BACK){ enter('race',t); st.arrived=false; st.lit=false; st.relit=false; resetTrails(); placeW(0); alphaW(1); shade(1,0); } }
          return true; }};
        if(reduced){ /* the wall frame, held still */
          W.forEach(w=>{ w.tr.reset(); for(let j=0;j<=NST;j++) w.tr.push(V.at(TR[w.m.k][j].w,.02)); }); fadeTrails(.25); placeW(NST); alphaW(0);
          wall.show(true); wall.setH(1); banned.show(true); shade(1,1); foot(1); footG.visible=true; placeStar(1); setChips(1,'0.5');
          box.dataset.phase='wall'; hudEl.innerHTML='Then someone builds a wall · f* : 0 → <b>0.5</b> · the wall’s price µ* = <b>1</b>'; }
        else hudEl.innerHTML='Five walkers · one valley';
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.tick(t); }
    });
  }
  const S=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(S); rw=innerWidth; });
})();
