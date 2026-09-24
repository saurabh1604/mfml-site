/* ================= UNIT 12 · widgets, part A: the opening shot, §1–§3 ================= */

/* ================= OPENING SHOT · a flattened cigar, a searching rod, two locks, one flattening ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced;
  /* the cloud: spreads 3 : 1.2 : 0.45 along three hidden axes (math units), drawn at scale K */
  const LAM=[9,1.44,0.2025], K=.36;
  /* the thin axis leans mostly up, so the flattening is seen from the side, like a table top */
  const a3=unit([.18,1,.3]), a1=unit((()=>{ const t=[1,-.05,-.42]; const d=dot(t,a3); return t.map((v,i)=>v-d*a3[i]); })());
  const a2=[a3[1]*a1[2]-a3[2]*a1[1],a3[2]*a1[0]-a3[0]*a1[2],a3[0]*a1[1]-a3[1]*a1[0]];
  const AX=[a1,a2,a3], C3=fromEig(LAM,AX), TOT=LAM[0]+LAM[1]+LAM[2];
  const PTS=cloudExact(400,C3,1212);                    /* three.js coords directly (x, y-up, z) */
  const P=PTS.map(p=>p.map(v=>v*K));
  const spreadAlong=d=>{ const u=unit(d); return dot(u,matVec(C3,u)); };
  const T_SWEEP=6.5,T_LOCK=2.4,T_PC2=3.6,T_FLAT=3.2,T_HOLD=3.4,T_BACK=1.6;
  /* the searching rod: a slow precession on the sphere that never quite finds a1 */
  const sweepDir=t=>{ const u=t/T_SWEEP, th=1.9+u*Math.PI*1.55, ph=1.1+.55*Math.sin(u*Math.PI*2.2); return [Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th)]; };
  const slerp=(a,b,u)=>{ let d=dot(a,b); if(d<0){ b=b.map(v=>-v); d=-d; } const om=Math.acos(Math.min(1,d)); if(om<1e-4) return b; const s=Math.sin(om); return unit(a.map((v,i)=>v*Math.sin((1-u)*om)/s+b[i]*Math.sin(u*om)/s)); };
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    const R0=wide?10.2:7.6, th0=.8, ph0=1.14, look=wide?[0,-.1,0]:[0,-.35,0];
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:0,
      camera:{pos:[R0*Math.sin(ph0)*Math.sin(th0),R0*Math.cos(ph0),R0*Math.sin(ph0)*Math.cos(th0)],look,fov:wide?30:36},
      build(ctx){
        const {THREE,root,camera,colors,isLight}=ctx, hx=hxOf(ctx), dark=!isLight;
        let offW=0; const applyOffset=()=>{ const w=ctx.size.w,h=ctx.size.h; if(!wide||!w||w===offW) return; offW=w; camera.setViewOffset(w,h,-Math.round(w*.2),0,w,h); };
        applyOffset();
        starField(ctx,420,24);
        const cloud=glowCloud(ctx,P,hx('s1'),dark?.17:.15,dark?.9:.85); root.add(cloud);
        const shadow=glowCloud(ctx,P,hx('s2'),dark?.11:.09,dark?.85:.75); root.add(shadow);
        const threads=segs(ctx,P.length,hx('ink2'),dark?.10:.05); root.add(threads);
        const r1=rod(ctx,hx('s2'),.028), r2=rod(ctx,hx('s3'),.024); root.add(r1,r2); r2.visible=false;
        const halo1=haloSprite(ctx,hx('s2'),.7), halo2=haloSprite(ctx,hx('s3'),.6); root.add(halo1,halo2); halo1.visible=halo2.visible=false;
        const glass=glassPlane(ctx,hx('s7'),[6.8,2.6],0); glass.userData.orient(a1,a2); root.add(glass);
        const chip=slot(ctx,root), chip2=slot(ctx,root);
        const meter=hud(box,wide?'hud-r':''); meter.style.cssText+=';min-width:13.5rem;max-width:calc(100% - 1.4rem)';
        hint(box,'drag to orbit');
        const KP=[a1[0]*1.55-a3[0]*1.25,a1[1]*1.55-a3[1]*1.25,a1[2]*1.55-a3[2]*1.25];
        const proj=(d,Q)=>Q.map(p=>{ const s=dot(p,d); return [d[0]*s,d[1]*s,d[2]*s]; });
        const setMeter=(label,v,col,peak)=>{ const w=Math.max(2,Math.min(100,v/LAM[0]*100));
          meter.innerHTML='<div style="display:flex;justify-content:space-between;gap:.8rem"><span>'+label+'</span><b style="color:'+col+'">'+F(v,2)+'</b></div>'+
            '<div style="height:6px;border-radius:4px;background:color-mix(in srgb,var(--ink) 12%,transparent);margin-top:.3rem;overflow:hidden"><i style="display:block;height:100%;width:'+w.toFixed(1)+'%;background:'+col+';box-shadow:0 0 10px '+col+'"></i></div>'+
            (peak?'<div style="margin-top:.3rem;font-size:.7rem;opacity:.85">'+peak+'</div>':''); };
        let cur=P.map(p=>p.slice());                     /* the cloud as currently drawn (it flattens in phase 4) */
        const flatten=u=>{ cur=P.map(p=>{ const s=dot(p,a3)*u; return [p[0]-a3[0]*s,p[1]-a3[1]*s,p[2]-a3[2]*s]; }); cloud.userData.set(cur); };
        /* the rod's length is the spread along it (±2.6 standard deviations): it grows where the shadows spread out */
        const hOf=d=>2.3*Math.sqrt(spreadAlong(d))*K+.22;
        const showRod=(r,d,op,halo)=>{ const h=hOf(d); r.userData.set(d,h,op); if(halo){ halo.visible=op>.05; halo.position.set(d[0]*h,d[1]*h,d[2]*h); halo.material.opacity=(dark?.6:.3)*op; } };
        const shadowOn=(d,col,op)=>{ const S=proj(d,cur); shadow.userData.set(S); shadow.material.opacity=(dark?.85:.75)*op; threads.userData.set(cur,S); threads.material.opacity=(dark?.10:.05)*op; if(col) shadow.userData.tintAll(col); };
        const st={ph:'sweep',t0:null,flare:false};
        const enter=(ph,t)=>{ st.ph=ph; st.t0=t; st.flare=false; box.dataset.phase=ph; };
        box.dataset.phase='sweep';
        const kept=((LAM[0]+LAM[1])/TOT*100);
        function finalStill(){ flatten(1); showRod(r1,a1,1,halo1); r2.visible=true; showRod(r2,a2,1,halo2); shadowOn(a1,hx('s2'),.0); threads.material.opacity=0; shadow.material.opacity=0;
          glass.userData.setOp(1); chip.set('kept '+kept.toFixed(1)+'% of the spread',KP,{size:16,color:colors.s4,depthTest:false,scale:.0062});
          chip2.set('λ₁ = 9.00  ·  λ₂ = 1.44',[KP[0],KP[1]-.38,KP[2]],{size:14,color:colors.ink2,depthTest:false,scale:.0056});
          setMeter('spread kept by the plane',LAM[0]+LAM[1],colors.s4,'PC1 + PC2 · '+kept.toFixed(1)+'% of '+F(TOT,2)); box.dataset.phase='flat'; }
        ctx.hero={tick(t){ applyOffset(); if(st.t0==null) st.t0=t; const e=t-st.t0;
          if(ctx.orbit&&!ctx.orbit.held){ ctx.orbit.sph.theta+=.0009; ctx.orbit.place(); }
          if(st.ph==='sweep'){ const d=sweepDir(e); showRod(r1,d,Math.min(1,e/.6),null); halo1.visible=false; shadowOn(d,null,Math.min(1,e/.8)); const v=spreadAlong(d);
            setMeter('spread along the rod',v,colors.s2,'searching every direction…'); chip.hide(); chip2.hide();
            if(e>=T_SWEEP){ st.from=d; enter('lock',t); } }
          else if(st.ph==='lock'){ const u=easeIO(Math.min(1,e/1.6)), d=slerp(st.from,a1,u); showRod(r1,d,1,u>.98?halo1:null); shadowOn(d,null,1); const v=spreadAlong(d);
            setMeter('spread along the rod',v,colors.s2,u>.98?'the peak · PC1 · λ₁ = '+F(LAM[0],2):'closing in…');
            if(u>.98){ if(!st.flare){ st.flare=true; } chip.set('PC1 · λ₁ = '+F(LAM[0],2),[a1[0]*hOf(a1)*.8,a1[1]*hOf(a1)*.8+.42,a1[2]*hOf(a1)*.8],{size:16,color:colors.s2,depthTest:false,scale:.0062}); }
            if(e>=T_LOCK){ enter('pc2',t); } }
          else if(st.ph==='pc2'){ r2.visible=true; const spin=Math.max(0,1-e/2.4); const ang=spin*2.4; const d=unit(a2.map((v,i)=>v*Math.cos(ang)+a3[i]*Math.sin(ang)));
            showRod(r2,d,Math.min(1,e/.5),spin<.02?halo2:null); shadowOn(d,hx('s3'),1); const v=spreadAlong(d);
            setMeter('spread at right angles to PC1',v,colors.s3,spin<.02?'PC2 · λ₂ = '+F(LAM[1],2)+' — the best of what is left':'turning inside the leftover plane…');
            if(spin<.02) chip2.set('PC2 · λ₂ = '+F(LAM[1],2),[a2[0]*hOf(a2)+.1,a2[1]*hOf(a2)+.4,a2[2]*hOf(a2)],{size:15,color:colors.s3,depthTest:false,scale:.0058});
            if(e>=T_PC2){ enter('flat',t); } }
          else if(st.ph==='flat'){ const u=easeIO(Math.min(1,e/2.2)); flatten(u); shadowOn(a2,null,Math.max(0,1-e/.6)); glass.userData.setOp(u);
            setMeter('spread kept by the PC1–PC2 plane',LAM[0]+LAM[1]+LAM[2]*(1-u),colors.s4,'3-D → 2-D · kept '+kept.toFixed(1)+'% of the spread');
            if(u>.6) chip.set('kept '+kept.toFixed(1)+'% of the spread',KP,{size:16,color:colors.s4,depthTest:false,scale:.0062});
            if(e>=T_FLAT) enter('hold',t); }
          else if(st.ph==='hold'){ if(e>=T_HOLD) enter('back',t); }
          else { const u=easeIO(Math.min(1,e/T_BACK)); flatten(1-u); glass.userData.setOp(1-u); showRod(r2,a2,1-u,null); halo2.visible=false; showRod(r1,a1,1-u,null); halo1.visible=false; chip.hide(); chip2.hide();
            if(e>=T_BACK){ r2.visible=false; enter('sweep',t); } }
          return true; }};
        renderer_hold(ctx);
        if(reduced) finalStill(); else { showRod(r1,sweepDir(0),0,null); shadowOn(sweepDir(0),null,0); setMeter('spread along the rod',spreadAlong(sweepDir(0)),colors.s2,'searching every direction…'); }
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.tick(t); }
    });
  }
  /* the user grabbing the hero pauses the camera drift (not the story) */
  function renderer_hold(ctx){ const el=ctx.renderer.domElement; el.addEventListener('pointerdown',()=>{ if(ctx.orbit) ctx.orbit.held=true; }); }
  const S=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(S); rw=innerWidth; });
})();

/* ================= W1 · PHOTOGRAPH THE CLOUD (a cricket bat made of points) ================= */
(function(){
  const box=document.getElementById('w-photo'), stage=document.getElementById('ph-3d'); if(!box||!stage) return;
  const read=document.getElementById('ph-read'), verd=document.getElementById('ph-verdict'), photo=document.getElementById('ph-photo');
  /* the bat, in three.js coords: length along x, width along y, thickness (and the spine) along z */
  const r=rng(1983), RAW=[];
  for(let i=0;i<330;i++){ const x=-1.3+2.15*r(), y=(r()*2-1)*.34, yy=y/.34, z=-.045+(.09+.15*(1-yy*yy)*(1-.45*((x+.25)/1.1)**2))*r(); RAW.push([x,y,z]); }
  for(let i=0;i<70;i++){ const x=.85+.95*r(), a=r()*2*Math.PI, q=.075*Math.sqrt(r()); RAW.push([x,Math.cos(a)*q,.05+Math.sin(a)*q]); }
  const {mu,C}=covOf(RAW), P=RAW.map(p=>p.map((v,k)=>(v-mu[k])*1.25)), CC=C.map(r=>r.map(v=>v*1.5625));
  const ES=eigSym(CC), TOT=ES.vals.reduce((a,b)=>a+b,0);
  let turn=90, tilt=0, anim=null, sc=null;
  const viewDir=()=>{ const a=turn*DEG, b=tilt*DEG; return unit([Math.cos(b)*Math.cos(a),Math.sin(b),Math.cos(b)*Math.sin(a)]); };
  const kept=v=>TOT-dot(v,matVec(CC,v));
  const basis=v=>{ let up=[0,1,0]; if(Math.abs(v[1])>.97) up=[1,0,0]; let rt=unit([up[1]*v[2]-up[2]*v[1],up[2]*v[0]-up[0]*v[2],up[0]*v[1]-up[1]*v[0]]); const u=[v[1]*rt[2]-v[2]*rt[1],v[2]*rt[0]-v[0]*rt[2],v[0]*rt[1]-v[1]*rt[0]]; return [rt,u]; };
  const angOf=v=>({turn:((Math.atan2(v[2],v[0])/DEG)%180+180)%180, tilt:Math.asin(Math.max(-1,Math.min(1,v[1])))/DEG*(Math.atan2(v[2],v[0])<0?-1:1)});
  function build(){ sc=null;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:[2.9,3.3,3.1],look:[-.15,.15,-.75],fov:38},autoRotate:0,
      build(ctx){ const {root,colors,isLight}=ctx, hx=hxOf(ctx);
        const cloud=glowCloud(ctx,P,hx('s1'),isLight?.1:.13); root.add(cloud);
        const shadow=glowCloud(ctx,P,hx('s6'),isLight?.075:.085,isLight?.75:.9); root.add(shadow);
        const screen=glassPlane(ctx,hx('s6'),[3.4,2.4],isLight?.12:.08); root.add(screen);
        const beams=segs(ctx,4,hx('s4'),isLight?.35:.28); root.add(beams);
        const eye=CIN.prim.dot(ctx,[0,0,0],hx('s4'),.075); root.add(eye); const eyeHalo=haloSprite(ctx,hx('s4'),.55); root.add(eyeHalo);
        const lab=slot(ctx,root);
        sc={ctx,shadow,screen,beams,eye,eyeHalo,lab,colors};
        hint(stage,'drag to orbit'); draw(); },
      update(){ return false; } });
    if(handle&&sc) sc.handle=handle; return handle; }
  function draw(){ const v=viewDir(), k=kept(v), pct=k/TOT*100, [rt,u]=basis(v);
    if(sc){ const {shadow,screen,beams,eye,eyeHalo,lab,ctx,colors}=sc, D=1.45;
      const c=v.map(x=>-x*D); screen.position.set(...c); screen.userData.orient(rt,u);
      shadow.userData.set(P.map(p=>{ const q=dot(p,v)+D; return [p[0]-v[0]*q,p[1]-v[1]*q,p[2]-v[2]*q]; }));
      const E=v.map(x=>x*2.6); eye.position.set(...E); eyeHalo.position.set(...E);
      const cr=[[1,1],[1,-1],[-1,1],[-1,-1]].map(([a,b])=>[c[0]+rt[0]*a*.9+u[0]*b*.55,c[1]+rt[1]*a*.9+u[1]*b*.55,c[2]+rt[2]*a*.9+u[2]*b*.55]);
      beams.userData.set([E,E,E,E],cr);
      lab.set('photo keeps '+pct.toFixed(1)+'%',[c[0]+u[0]*1.45,c[1]+u[1]*1.45,c[2]+u[2]*1.45],{size:17,color:colors.s4,depthTest:false,scale:.0072});
      RR(ctx); }
    /* the flat photo */
    photo.innerHTML=''; const W=300,H=200,s=62;
    el('rect',{x:8,y:8,width:W-16,height:H-16,rx:10,fill:'color-mix(in srgb,var(--s6) 7%,transparent)',stroke:'color-mix(in srgb,var(--s6) 45%,transparent)'},photo);
    const g=el('g',{},photo), gl=glo(photo,1.4);
    P.forEach(p=>{ const X=W/2+dot(p,rt)*s, Y=H/2-dot(p,u)*s; if(X>10&&X<W-10&&Y>10&&Y<H-10) el('circle',{cx:X.toFixed(1),cy:Y.toFixed(1),r:1.6,fill:'var(--s1)',opacity:.75},g); });
    if(gl) g.setAttribute('filter',gl);
    txt(photo,16,26,'the photo','font:700 11px system-ui;fill:var(--ink-muted)'); txt(photo,W-16,H-16,pct.toFixed(1)+'% of the spread','font:700 12px system-ui;fill:var(--s4)','end');
    read.innerHTML='camera: turn <b>'+Math.round(turn)+'°</b>, tilt <b>'+Math.round(tilt)+'°</b><br>spread hidden along your line of sight: <b>'+F(TOT-k,3)+'</b><br>spread kept in the photo: <b>'+F(k,3)+'</b> of <b>'+F(TOT,3)+'</b> = <b>'+pct.toFixed(1)+'%</b>';
    if(pct>95){ verd.className='verdict good'; verd.textContent='good — you are looking along the thinnest direction, so the photo keeps the length and the width'; }
    else if(pct<30){ verd.className='verdict bad'; verd.textContent='bad — you are looking straight down the handle: the whole length hides in the depth of the photo'; }
    else { verd.className='verdict info'; verd.textContent='in between — part of the spread is hiding along your line of sight'; } }
  bindCtl('ph-turn',v=>{ turn=v; setPressed(['ph-side','ph-edge','ph-end'],null); draw(); },v=>v+'°'); bindCtl('ph-tilt',v=>{ tilt=v; setPressed(['ph-side','ph-edge','ph-end'],null); draw(); },v=>v+'°');
  const go=(d,id)=>{ if(anim){ anim.stop(); anim=null; } setPressed(['ph-side','ph-edge','ph-end'],id); const A=angOf(d), t0=turn,b0=tilt; let t=A.turn; while(t-t0>90) t-=180; while(t0-t>90) t+=180;
    anim=tween(900,e=>{ turn=t0+(t-t0)*e; tilt=b0+(A.tilt-b0)*e; setRange('ph-turn',Math.round(((turn%180)+180)%180),v=>v+'°'); setRange('ph-tilt',Math.round(tilt),v=>v+'°'); draw(); },()=>{ anim=null; turn=((turn%180)+180)%180; }); };
  document.getElementById('ph-side').addEventListener('click',()=>go(ES.vecs[2],'ph-side'));
  document.getElementById('ph-edge').addEventListener('click',()=>go(ES.vecs[1],'ph-edge'));
  document.getElementById('ph-end').addEventListener('click',()=>go(ES.vecs[0],'ph-end'));
  document.getElementById('ph-play').addEventListener('click',()=>{ if(anim){ anim.stop(); anim=null; } setPressed(['ph-side','ph-edge','ph-end'],null);
    if(RM){ go(ES.vecs[2],'ph-side'); return; }
    let dead=false; const t00=performance.now(), t0=turn; anim={stop(){dead=true;}};
    (function fr(now){ if(dead) return; const e=Math.min(1,(now-t00)/8000); turn=((t0+e*360)%180+180)%180; tilt=30*Math.sin(e*Math.PI*2);
      setRange('ph-turn',Math.round(turn),v=>v+'°'); setRange('ph-tilt',Math.round(tilt),v=>v+'°'); draw(); if(e<1) requestAnimationFrame(fr); else anim=null; })(t00); });
  box.dataset.keptSide=(kept(ES.vecs[2])/TOT*100).toFixed(1); box.dataset.keptEnd=(kept(ES.vecs[0])/TOT*100).toFixed(1);
  mountStage(stage,build); draw();
})();

/* ================= W2 · PICK THE BETTER LINE (90 points / the five points) ================= */
(function(){
  const box=document.getElementById('w-line'); if(!box) return;
  const svg=document.getElementById('ln-svg'), hump=document.getElementById('ln-hump'), read=document.getElementById('ln-read');
  /* 90 points with covariance exactly λ = 5.45 (at 32°) and 0.41 */
  const th1=32*DEG, u1=[Math.cos(th1),Math.sin(th1)], u2=[-Math.sin(th1),Math.cos(th1)];
  const CLOUD=cloudExact(90,fromEig([5.45,0.41],[u1,u2]),2024);
  const FIVE=[[1,2],[4,5],[7,8],[8,4],[10,6]];
  let mode='cloud', ang=120, anim=null;
  const data=()=>{ if(mode==='cloud') return {pts:CLOUD,mu:[0,0],R:6.2,lab:'90 points'}; return {pts:FIVE,mu:[6,5],R:6.6,lab:'five points'}; };
  const covNow=()=>{ const {pts}=data(); return covOf(pts).C; };
  let P=null;
  function draw(){ const {pts,mu,R}=data(), C=covNow(), E=eig2(C[0][0],C[0][1],C[1][1]);
    const th=ang*DEG, d=[Math.cos(th),Math.sin(th)], sp=qf2(C,th);
    const NAR=respVB(svg,'0 0 560 440','0 0 400 430');
    P=eqFrame(svg,R,{top:NAR?54:40,step:1}); const {px,py}=P, gl=P.glow, Ly=P.layer;
    const X=v=>px(v[0]-mu[0]), Y=v=>py(v[1]-mu[1]);
    /* PC1 and PC2 as faint guides, then the line */
    const L=R*2.2; glowLine(Ly,px(-d[0]*L),py(-d[1]*L),px(d[0]*L),py(d[1]*L),'var(--s2)',2,gl);
    /* threads + landing dots */
    const gT=el('g',{},Ly), gP=el('g',{},Ly), gD=el('g',{},Ly), big=mode==='five';
    pts.forEach(p=>{ const q=[p[0]-mu[0],p[1]-mu[1]], s=q[0]*d[0]+q[1]*d[1], f=[d[0]*s,d[1]*s];
      el('line',{x1:px(q[0]),y1:py(q[1]),x2:px(f[0]),y2:py(f[1]),stroke:'var(--ink-muted)','stroke-width':big?1.2:.8,opacity:big?.7:.45,'stroke-dasharray':big?'3 3':null},gT);
      el('circle',{cx:X(p),cy:Y(p),r:big?7:3.6,fill:'var(--s1)',opacity:.92},gP);
      el('circle',{cx:px(f[0]),cy:py(f[1]),r:big?5.5:2.9,fill:'var(--s4)',stroke:'var(--page)','stroke-width':big?1.4:.7},gD); });
    if(gl){ gD.setAttribute('filter',gl); gP.setAttribute('filter',gl); }
    if(big) pts.forEach(p=>txt(Ly,X(p)+10,Y(p)-8,'('+p[0]+', '+p[1]+')','font:600 11px system-ui;fill:var(--ink-2)'));
    /* the tip handle */
    const tip=[d[0]*R*.86,d[1]*R*.86]; const g=el('g',{},svg); el('circle',{cx:px(tip[0]),cy:py(tip[1]),r:14,fill:'var(--s2)',opacity:.2},g); el('circle',{cx:px(tip[0]),cy:py(tip[1]),r:7.5,fill:'var(--s2)',stroke:'var(--page)','stroke-width':2},g);
    /* the spread meter */
    const lmax=E.l1*1.05, mw=NAR?240:250, mx=16, my=12;
    el('rect',{x:mx,y:my,width:mw,height:10,rx:5,fill:'color-mix(in srgb,var(--ink) 10%,transparent)'},svg);
    el('rect',{x:mx,y:my,width:Math.max(3,mw*sp/lmax),height:10,rx:5,fill:'var(--s2)',filter:gl||null},svg);
    el('line',{x1:mx+mw*E.l1/lmax,y1:my-4,x2:mx+mw*E.l1/lmax,y2:my+14,stroke:'var(--s4)','stroke-width':1.6},svg);
    if(NAR) txt(svg,mx,my+32,'spread on the line = '+F(sp,2),'font:800 15px system-ui;fill:var(--ink)'); else txt(svg,mx+mw+12,my+9,'spread on the line = '+F(sp,2),'font:700 12.5px system-ui;fill:var(--ink)');
    txt(svg,mx+mw*E.l1/lmax,my-7,'λ₁','font:700 10px system-ui;fill:var(--s4)','middle');
    drawHump(C,E,sp);
    const a1=((E.th/DEG)%180+180)%180, a2=(a1+90)%180;
    read.innerHTML=(mode==='five'?'five points, mean (6, 5) · ':'')+'angle <b>'+F(ang,1)+'°</b> · spread <b>'+F(sp,2)+'</b><br>best <b>λ₁ = '+F(E.l1,2)+'</b> at '+F(a1,1)+'° · worst <b>λ₂ = '+F(E.l2,2)+'</b> at '+F(a2,1)+'°'+
      '<br><span style="color:var(--ink-muted)">'+(sp>E.l1-.02*E.l1?'this is line A: the dots are as spread out as they can be':sp<E.l2+.03*(E.l1-E.l2)?'this is line B: the dots bunch up, far-apart points land together':'the dots are partly bunched: turn toward the peak')+'</span>'; }
  function drawHump(C,E,sp){ const f=frame(hump,0,180,0,E.l1*1.12,{l:34,r:10,t:14,b:26,xs:45,ys:E.l1>8?3:1,xf:v=>v+'°'});
    let d=''; for(let a=0;a<=180;a+=1.5){ const v=qf2(C,a*DEG); d+=(a?'L':'M')+f.px(a).toFixed(1)+' '+f.py(v).toFixed(1); }
    glowPath(hump,d,'var(--s1)',2,f.glow);
    const a1=((E.th/DEG)%180+180)%180, a2=(a1+90)%180;
    [[a1,E.l1,'λ₁ = '+F(E.l1,2),'var(--s2)'],[a2,E.l2,'λ₂ = '+F(E.l2,2),'var(--s3)']].forEach(([a,v,s,c])=>{ el('circle',{cx:f.px(a),cy:f.py(v),r:4,fill:c},hump); txt(hump,f.px(a)+(a>150?-6:6),f.py(v)+(v>E.l1*.5?-7:-7),s,'font:700 10px system-ui;fill:'+c,a>150?'end':'start'); });
    const m=el('g',{},hump); el('line',{x1:f.px(ang),y1:f.py(0),x2:f.px(ang),y2:f.py(sp),stroke:'var(--s4)','stroke-width':1.2,'stroke-dasharray':'3 3'},m); glowDot(hump,f.px(ang),f.py(sp),5,'var(--s4)',f.glow);
    txt(hump,f.px(90),12,'spread of the landing dots vs angle','font:600 10px system-ui;fill:var(--ink-muted)','middle'); }
  const ctl=bindCtl('ln-ang',v=>{ ang=v; draw(); },v=>F(v,1)+'°');
  const setAng=v=>{ ang=((v%180)+180)%180; setRange('ln-ang',ang,v=>F(v,1)+'°'); draw(); };
  const goTo=a=>{ if(anim){ anim.stop(); anim=null; } const a0=ang; let t=a; while(t-a0>90) t-=180; while(a0-t>90) t+=180; anim=tween(800,e=>setAng(a0+(t-a0)*e),()=>{ anim=null; }); };
  svgDrag(svg,(x,y)=>{ if(!P) return false; if(anim){ anim.stop(); anim=null; } },(x,y)=>{ const X=(x-P.px(0))/P.s, Y=(P.py(0)-y)/P.s; if(Math.hypot(X,Y)<.3) return; setAng(Math.atan2(Y,X)/DEG); });
  tabs(document.getElementById('ln-tabs'),t=>{ mode=t; draw(); }); onWidth(draw);
  document.getElementById('ln-a').addEventListener('click',()=>{ const C=covNow(); goTo(eig2(C[0][0],C[0][1],C[1][1]).th/DEG); });
  document.getElementById('ln-b').addEventListener('click',()=>{ const C=covNow(); goTo(eig2(C[0][0],C[0][1],C[1][1]).th/DEG+90); });
  document.getElementById('ln-sweep').addEventListener('click',()=>{ if(anim){ anim.stop(); anim=null; } const a0=ang; if(RM){ setAng(a0+90); return; }
    let dead=false; const t0=performance.now(); anim={stop(){ dead=true; }};
    (function fr(now){ if(dead) return; const e=Math.min(1,(now-t0)/5200); setAng(a0+180*easeIO(e)); if(e<1) requestAnimationFrame(fr); else anim=null; })(t0); });
  draw();
})();

/* ================= W3 · WHICH COLUMNS CAN EXPLAIN ANYTHING? (the salary table and the twins) ================= */
(function(){
  const box=document.getElementById('w-change'); if(!box) return;
  const bars=document.getElementById('ch-bars'), scat=document.getElementById('ch-scatter'), read=document.getElementById('ch-read');
  const COLS=[['age',64],['experience',41],['certifications',0.09],['trainings',0.04]];
  const CT=[[64,48],[48,41]];                                   /* the twins: age and experience, correlation 0.94 */
  const E=eig2(64,48,41);
  const EMP=cloudExact(40,CT,1).map(p=>[p[0]+38,p[1]+15]);
  let logS=false, twins=0, anim=null;
  function drawBars(){ const max=70; const f=logS?frame(bars,-.5,3.5,-2,2,{l:44,r:10,t:22,b:40,ys:1,yf:v=>v===0?'1':'10'+(v<0?'⁻':'')+String(Math.abs(v)).replace('1','¹').replace('2','²'),axes:false}):frame(bars,-.5,3.5,0,max,{l:40,r:10,t:22,b:40,ys:10,axes:false});
    const gl=f.glow, bw=(f.px(1)-f.px(0))*.56;
    COLS.forEach(([n,v],i)=>{ const top=logS?Math.log10(v):v, base=logS?-2:0; const y0=f.py(base), y1=f.py(top); const small=v<1;
      const r=el('rect',{x:f.px(i)-bw/2,y:Math.min(y0,y1),width:bw,height:Math.max(1.2,Math.abs(y0-y1)),rx:5,fill:small?'var(--ink-muted)':'var(--s1)',opacity:small?.75:.95},bars); if(gl&&!small) r.setAttribute('filter',gl);
      txt(bars,f.px(i),Math.min(y0,y1)-6,String(v),'font:700 12px system-ui;fill:'+(small?'var(--ink-2)':'var(--ink)'),'middle');
      txt(bars,f.px(i),f.H-f.B+15,n,'font:600 10.5px system-ui;fill:var(--ink-2)','middle'); });
    txt(bars,f.L,14,'variance of each column'+(logS?' · log scale':''),'font:700 11px system-ui;fill:var(--ink-muted)');
    if(!logS) txt(bars,f.px(2.5),f.py(9),'almost no change ↓','font:600 10.5px system-ui;fill:var(--ink-muted)','middle'); }
  function drawScatter(){ const f=frame(scat,14,62,-4,34,{l:36,r:12,t:22,b:34,xs:10,ys:10}); const gl=f.glow;
    const g=el('g',{},scat); EMP.forEach(p=>el('circle',{cx:f.px(p[0]),cy:f.py(p[1]),r:3.8,fill:'var(--s1)',opacity:.9},g)); if(gl) g.setAttribute('filter',gl);
    txt(scat,f.px(38),f.H-6,'age (years)','font:600 10.5px system-ui;fill:var(--ink-2)','middle');
    const yl=txt(scat,12,f.py(15),'experience (years)','font:600 10.5px system-ui;fill:var(--ink-2)','middle'); yl.setAttribute('transform','rotate(-90 12 '+f.py(15)+')');
    txt(scat,f.L,14,'age against experience — the twins','font:700 11px system-ui;fill:var(--ink-muted)');
    if(twins>0){ const c=[38,15], d=[Math.cos(E.th),Math.sin(E.th)], n=[-d[1],d[0]], s1=Math.sqrt(E.l1)*2.2*twins, s2=Math.sqrt(E.l2)*2.2*twins;
      /* the scatter has unequal axis scales: draw the arrows in data units so they lie along the cloud */
      svgArrow(scat,f.px(c[0]),f.py(c[1]),f.px(c[0]+d[0]*s1),f.py(c[1]+d[1]*s1),'var(--s2)',3,gl);
      svgArrow(scat,f.px(c[0]),f.py(c[1]),f.px(c[0]-d[0]*s1),f.py(c[1]-d[1]*s1),'var(--s2)',3,gl,.5);
      svgArrow(scat,f.px(c[0]),f.py(c[1]),f.px(c[0]+n[0]*s2),f.py(c[1]+n[1]*s2),'var(--s3)',2.6,gl);
      if(twins>.95){ txt(scat,f.px(c[0]+d[0]*s1)+6,f.py(c[1]+d[1]*s1)-4,'new column 1','font:700 11px system-ui;fill:var(--s2)','end');
        txt(scat,f.px(c[0]+n[0]*s2)-6,f.py(c[1]+n[1]*s2)+14,'new column 2','font:700 10.5px system-ui;fill:var(--s3)','end'); } } }
  function draw(){ drawBars(); drawScatter();
    const r=CT[0][1]/Math.sqrt(CT[0][0]*CT[1][1]), sh=E.l1/(E.l1+E.l2)*100;
    read.innerHTML='age and experience: variances <b>64</b> and <b>41</b>, covariance <b>48</b>, correlation <b>'+F(r,2)+'</b> — they mostly say the same thing'+
      (twins>.95?'<br>the new direction carries spread <b>λ₁ = '+F(E.l1,2)+'</b> of the twins’ total <b>105</b>, that is <b>'+F(sh,1)+'%</b>; the direction at right angles keeps only <b>'+F(E.l2,2)+'</b>':'<br>press ▶ to combine them into one new direction'); }
  document.getElementById('ch-log').addEventListener('click',e=>{ logS=!logS; e.currentTarget.setAttribute('aria-pressed',logS?'true':'false'); draw(); });
  document.getElementById('ch-twins').addEventListener('click',()=>{ if(anim) anim.stop(); twins=0; anim=tween(1100,u=>{ twins=u; draw(); },()=>{ anim=null; twins=1; draw(); }); });
  draw();
})();

/* ================= W4 · BUILD C BY HAND ================= */
(function(){
  const box=document.getElementById('w-cov'); if(!box) return;
  const svg=document.getElementById('cv-svg'), tab=document.getElementById('cv-table'), cm=document.getElementById('cv-C'), read=document.getElementById('cv-read');
  const START=[[1,2],[4,5],[7,8],[8,4],[10,6]];
  let pts=START.map(p=>p.slice()), div='N', raw=false, drag=-1, P=null, hl=null;
  const snap=v=>Math.round(v*2)/2;
  function stats(){ const N=pts.length, mu=[0,0]; pts.forEach(p=>{ mu[0]+=p[0]/N; mu[1]+=p[1]/N; });
    const X=pts.map(p=>raw?[p[0],p[1]]:[p[0]-mu[0],p[1]-mu[1]]); const S=[[0,0],[0,0]]; X.forEach(x=>{ S[0][0]+=x[0]*x[0]; S[0][1]+=x[0]*x[1]; S[1][1]+=x[1]*x[1]; }); S[1][0]=S[0][1];
    const n=div==='N'?N:N-1; const C=S.map(r=>r.map(v=>v/n)); return {N,mu,X,S,C,n}; }
  function draw(){ const {N,mu,X,S,C,n}=stats();
    P=frame(svg,-1,13,-1,11,{l:30,r:14,t:14,b:26,xs:1,ys:1,xf:v=>v%2?'':String(v),yf:v=>v%2?'':String(v)}); const gl=P.glow;
    /* covariance ellipse (2σ) around the mean */
    const E=eig2(C[0][0],C[0][1],C[1][1]); const ctr=raw?[0,0]:mu;
    if(E.l1>1e-9){ let d=''; for(let k=0;k<=72;k++){ const t=k/72*2*Math.PI, a=Math.sqrt(Math.max(E.l1,0))*Math.cos(t)*1.6, b=Math.sqrt(Math.max(E.l2,0))*Math.sin(t)*1.6;
        const x=ctr[0]+a*Math.cos(E.th)-b*Math.sin(E.th), y=ctr[1]+a*Math.sin(E.th)+b*Math.cos(E.th); d+=(k?'L':'M')+P.px(x).toFixed(1)+' '+P.py(y).toFixed(1); }
      el('path',{d:d+'Z',fill:'color-mix(in srgb,var(--s1) 9%,transparent)',stroke:'var(--s1)','stroke-width':1.2,opacity:.8},svg);
      const L=Math.sqrt(E.l1)*1.6, L2=Math.sqrt(Math.max(E.l2,0))*1.6, c2=Math.cos(E.th+Math.PI/2), s2=Math.sin(E.th+Math.PI/2);
      glowLine(svg,P.px(ctr[0]-L2*c2),P.py(ctr[1]-L2*s2),P.px(ctr[0]+L2*c2),P.py(ctr[1]+L2*s2),'var(--s3)',1.8,gl);
      glowLine(svg,P.px(ctr[0]-L*Math.cos(E.th)),P.py(ctr[1]-L*Math.sin(E.th)),P.px(ctr[0]+L*Math.cos(E.th)),P.py(ctr[1]+L*Math.sin(E.th)),'var(--s2)',2.2,gl); }
    /* spokes from the mean (or from the origin if not centred) */
    pts.forEach(p=>el('line',{x1:P.px(ctr[0]),y1:P.py(ctr[1]),x2:P.px(p[0]),y2:P.py(p[1]),stroke:raw?'var(--critical)':'var(--s4)','stroke-width':1,opacity:.45,'stroke-dasharray':'3 3'},svg));
    /* the mean cross */
    const m=el('g',{},svg); el('line',{x1:P.px(mu[0])-8,y1:P.py(mu[1]),x2:P.px(mu[0])+8,y2:P.py(mu[1]),stroke:'var(--s4)','stroke-width':2.4},m); el('line',{x1:P.px(mu[0]),y1:P.py(mu[1])-8,x2:P.px(mu[0]),y2:P.py(mu[1])+8,stroke:'var(--s4)','stroke-width':2.4},m); if(gl) m.setAttribute('filter',gl);
    txt(svg,P.px(mu[0])+10,P.py(mu[1])+16,'mean ('+T(mu[0],2)+', '+T(mu[1],2)+')','font:700 10.5px system-ui;fill:var(--s4)');
    pts.forEach((p,i)=>{ const g=el('g',{},svg); el('circle',{cx:P.px(p[0]),cy:P.py(p[1]),r:13,fill:'var(--s1)',opacity:drag===i?.25:.12},g); el('circle',{cx:P.px(p[0]),cy:P.py(p[1]),r:6.5,fill:'var(--s1)',stroke:'var(--page)','stroke-width':1.5},g); if(gl) g.setAttribute('filter',gl);
      txt(svg,P.px(p[0])+9,P.py(p[1])-9,'('+T(p[0],1)+', '+T(p[1],1)+')','font:600 10px system-ui;fill:var(--ink-2)'); });
    /* the centred table */
    let h='<table class="plain cvt"><thead><tr><th>point</th><th data-col="0">'+(raw?'x₁ (raw)':'x₁ − '+T(mu[0],2))+'</th><th data-col="1">'+(raw?'x₂ (raw)':'x₂ − '+T(mu[1],2))+'</th></tr></thead><tbody>';
    X.forEach((x,i)=>{ h+='<tr><td>'+(i+1)+'</td><td data-col="0">'+F(x[0],2)+'</td><td data-col="1">'+F(x[1],2)+'</td></tr>'; });
    h+='<tr class="sum"><td>sum</td><td>'+F(X.reduce((s,x)=>s+x[0],0),2)+'</td><td>'+F(X.reduce((s,x)=>s+x[1],0),2)+'</td></tr></tbody></table>'; tab.innerHTML=h;
    /* the matrix with hoverable cells (built once per draw; hovering only repaints classes) */
    const cell=(j,k)=>'<span class="cvc'+(j===k?' d':' o')+'" tabindex="0" data-j="'+j+'" data-k="'+k+'" title="'+(j===k?'column '+(j+1)+' with itself: its spread':'column 1 with column 2: how they move together')+'">'+F(C[j][k],2)+'</span>';
    cm.innerHTML='<div class="cvm-lab">'+(raw?'<b style="color:var(--critical)">not centred</b> · ':'')+'C = (1/'+(div==='N'?'N':'(N − 1)')+') XᵀX, with '+(div==='N'?'N':'N − 1')+' = '+n+'</div><div class="cvm">'+cell(0,0)+cell(0,1)+cell(1,0)+cell(1,1)+'</div>';
    cm.querySelectorAll('.cvc').forEach(c=>{ const on=()=>{ hl=[+c.dataset.j,+c.dataset.k]; paintHL(); }, off=()=>{ hl=null; paintHL(); };
      c.addEventListener('mouseenter',on); c.addEventListener('mouseleave',off); c.addEventListener('focus',on); c.addEventListener('blur',off); });
    last={X,S,C,n,mu}; paintHL(); }
  let last=null;
  function paintHL(){ if(!last) return; const {X,S,C,n,mu}=last;
    tab.querySelectorAll('[data-col]').forEach(t=>t.classList.toggle('hl',!!hl&&(hl[0]===+t.dataset.col||hl[1]===+t.dataset.col)));
    cm.querySelectorAll('.cvc').forEach(c=>c.classList.toggle('hl',!!hl&&+c.dataset.j===hl[0]&&+c.dataset.k===hl[1]));
    if(hl){ const [j,k]=hl; const terms=X.map(x=>'('+F(x[j],1)+')('+F(x[k],1)+')').join(' + '); read.innerHTML='C'+SUB(j+1)+SUB(k+1)+' = ['+terms+'] / '+n+' = '+F(S[j][k],2)+' / '+n+' = <b>'+F(C[j][k],3)+'</b>'; }
    else read.innerHTML='sums: Σx₁² = <b>'+F(S[0][0],2)+'</b>, Σx₂² = <b>'+F(S[1][1],2)+'</b>, Σx₁x₂ = <b>'+F(S[0][1],2)+'</b> · divide by <b>'+n+'</b><br>top direction of this matrix: <b>'+F(((eig2(C[0][0],C[0][1],C[1][1]).th/DEG)%180+180)%180,1)+'°</b>'+(raw?' — swung toward the mean at '+F(Math.atan2(mu[1],mu[0])/DEG,1)+'°':''); }
  svgDrag(svg,(x,y)=>{ if(!P) return false; let best=-1,bd=1e9; pts.forEach((p,i)=>{ const d=Math.hypot(P.px(p[0])-x,P.py(p[1])-y); if(d<bd){ bd=d; best=i; } }); if(bd>26) return false; drag=best; },
    (x,y)=>{ if(drag<0) return; pts[drag]=[Math.max(-.5,Math.min(12.5,snap(P.ix(x)))),Math.max(-.5,Math.min(10.5,snap(P.iy(y))))]; draw(); },()=>{ drag=-1; draw(); });
  const setDiv=d=>{ div=d; setPressed(['cv-n','cv-n1'],d==='N'?'cv-n':'cv-n1'); draw(); };
  document.getElementById('cv-n').addEventListener('click',()=>setDiv('N'));
  document.getElementById('cv-n1').addEventListener('click',()=>setDiv('N1'));
  document.getElementById('cv-raw').addEventListener('click',e=>{ raw=!raw; e.currentTarget.setAttribute('aria-pressed',raw?'true':'false'); draw(); });
  document.getElementById('cv-reset').addEventListener('click',()=>{ pts=START.map(p=>p.slice()); draw(); });
  draw();
})();
