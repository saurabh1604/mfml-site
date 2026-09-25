/* ================= W9 · WHICH COIN EXPLAINS THE TOSSES? (likelihood and log-likelihood side by side) ================= */
(function(){
  const svg=document.getElementById('co-svg'); if(!svg) return;
  const tbl=document.getElementById('co-kv'), verd=document.getElementById('co-verdict'), pre=document.getElementById('co-pre');
  let n=10, h=7, pm=.5, P1=null, P2=null, drag=false, rnd=seeded(77);
  const ll=p=>(h?h*Math.log(p):0)+(n-h?(n-h)*Math.log(1-p):0);
  const sup='⁰¹²³⁴⁵⁶⁷⁸⁹';
  const supN=k=>(k<0?'⁻':'')+String(Math.abs(k)).split('').map(c=>sup[+c]).join('');
  function draw(){ svg.innerHTML=''; const hat=h/n, pc=Math.min(1-1e-9,Math.max(1e-9,hat)), lmax=ll(pc), Lmax=Math.exp(lmax);
    const e=Math.floor(Math.log10(Lmax)), sc=Math.pow(10,-e), top=Lmax*sc*1.18;
    const narrow=(svg.parentNode.clientWidth||640)<520; svg.setAttribute('viewBox',narrow?'0 0 380 620':'0 0 640 330');
    const W=640, pw=narrow?300:W/2-64, ph=narrow?235:250, x1=50, y1=30, x2=narrow?50:W/2+46, y2=narrow?340:30;
    P1=panel(svg,x1,y1,pw,ph,0,1,0,top,{xs:.25,ys:top>4?2:(top>2?.5:.25),yf:v=>trim(F(v,2)),xf:v=>trim(F(v,2)),title:'likelihood L(p)'+(e?'   (×10'+supN(e)+')':'')});
    const lo=lmax-12;
    P2=panel(svg,x2,y2,pw,ph,0,1,lo,lmax+1,{xs:.25,ys:Math.max(1,Math.round((13)/5)),yf:v=>trim(F(v,1)),xf:v=>trim(F(v,2)),title:'log-likelihood log L(p)'});
    const g1=el('g',{'clip-path':P1.clip},svg), g2=el('g',{'clip-path':P2.clip},svg);
    let d1='', d2='', f1='M'+P1.px(0)+','+P1.py(0);
    for(let i=0;i<=300;i++){ const p=Math.min(1-1e-9,Math.max(1e-9,i/300)), l=ll(p), L=Math.exp(l)*sc;
      d1+=(i?'L':'M')+P1.px(p).toFixed(1)+','+P1.py(L).toFixed(1); f1+='L'+P1.px(p).toFixed(1)+','+P1.py(L).toFixed(1); d2+=(i?'L':'M')+P2.px(p).toFixed(1)+','+P2.py(Math.max(lo-2,l)).toFixed(1); }
    f1+='L'+P1.px(1)+','+P1.py(0)+'Z'; el('path',{d:f1,fill:cvar(K14.mass),opacity:isLight()?.22:.2},g1);
    glowPath(g1,d1,cvar(K14.mass),2.6,!isLight()); glowPath(g2,d2,cvar(K14.mass),2.6,!isLight());
    [[P1,Lmax*sc],[P2,lmax]].forEach(([P,v])=>{ const X=P.px(hat); glowLine(svg,X,P.py(P.Y0),X,P.py(v),cvar(K14.mean),1.4,false,{'stroke-dasharray':'5 4'}); el('circle',{cx:X,cy:P.py(v),r:5.5,fill:cvar(K14.mean)},svg); });
    txt(svg,P1.px(hat),P1.y+P1.h+26,'p̂ = '+trim(F(hat,3)),'font:800 11px Inter,system-ui;fill:var(--s4)','middle'); txt(svg,P2.px(hat),P2.y+P2.h+26,'p̂ = '+trim(F(hat,3)),'font:800 11px Inter,system-ui;fill:var(--s4)','middle');
    /* the marker */
    const lm=ll(Math.min(1-1e-9,Math.max(1e-9,pm)));
    [[P1,Math.exp(lm)*sc],[P2,Math.max(lo,lm)]].forEach(([P,v])=>{ const X=P.px(pm); el('line',{x1:X,y1:P.y,x2:X,y2:P.y+P.h,stroke:'var(--ink)','stroke-width':1.4,opacity:.7},svg);
      el('circle',{cx:X,cy:P.py(v),r:12,fill:'var(--ink)',opacity:.12},svg); el('circle',{cx:X,cy:P.py(v),r:6,fill:'var(--ink)',stroke:cvar(K14.mean),'stroke-width':2},svg); });
    kv(tbl,[['tosses n · heads h',n+' · '+h],['best coin p̂ = h/n','<b>'+trim(F(hat,3))+'</b>'],['marker coin p',trim(F(pm,3))],['L(p)',sci(Math.exp(lm),3)],['log L(p) (nats)',F(lm,3)],['L(p̂) · log L(p̂)',sci(Lmax,3)+' · '+F(lmax,3)],['L(p) ÷ L(p̂)','<b>'+F(Math.exp(lm-lmax),3)+'</b>']]);
    const r=Math.exp(lm-lmax);
    if(Math.abs(pm-hat)<.006){ verd.className='verdict good'; verd.textContent='good — p = '+trim(F(hat,3))+' = h/n explains the tosses best; both curves peak here'; }
    else { verd.className='verdict info'; verd.textContent='info — a coin with p = '+trim(F(pm,2))+' explains the tosses only '+(r>=.01?Math.round(100*r)+'%':'less than 1%')+' as well as the best coin, p̂ = '+trim(F(hat,3)); } }
  svgDrag(svg,(x,y)=>{ if(!P1) return false; const inP1=x>=P1.x-8&&x<=P1.x+P1.w+8, inP2=x>=P2.x-8&&x<=P2.x+P2.w+8; if(!inP1&&!inP2) return false; drag=inP1?P1:P2; },
    x=>{ if(!drag) return; pm=Math.max(.005,Math.min(.995,Math.round(drag.ix(x)*200)/200)); draw(); },()=>{ drag=false; });
  const hSl=document.getElementById('co-h');
  function setNH(N,H){ n=N; h=Math.min(H,N); hSl.max=String(n); setCtl('co-n',n,v=>String(v)); setCtl('co-h',h,v=>String(v)); draw(); }
  bindCtl('co-n',v=>{ n=v; hSl.max=String(n); if(h>n){ h=n; setCtl('co-h',h,x=>String(x)); } pressOnly(pre,null); draw(); },v=>String(v));
  bindCtl('co-h',v=>{ h=Math.min(v,n); pressOnly(pre,null); draw(); },v=>String(v));
  document.getElementById('co-p7').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); pm=.5; setNH(10,7); });
  document.getElementById('co-p70').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); pm=.6; setNH(100,70); });
  document.getElementById('co-toss').addEventListener('click',()=>{ pressOnly(pre,null); if(n>=200){ n=0; h=0; } let hh=h; for(let i=0;i<10;i++) if(rnd()<.7) hh++; setNH(Math.min(200,n+10),hh); });
  window.U14C={get:()=>({n,h,pm})};
  let cw=0; addEventListener('resize',()=>{ const w=svg.parentNode.clientWidth; if((w<520)!==(cw<520)) draw(); cw=w; });
  draw(); cw=svg.parentNode.clientWidth; new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W10 · THE LIKELIHOOD LANDSCAPE OVER EVERY POSSIBLE BELL (3-D) ================= */
(function(){
  const box=document.getElementById('ml-3d'); if(!box) return;
  const svg=document.getElementById('ml-svg'), tbl=document.getElementById('ml-kv'), verd=document.getElementById('ml-verdict'), pre=document.getElementById('ml-pre');
  const X=[2,4,4,4,5,5,7,9], N=8, M0=2, M1=8, S0=1, S1=5, DROP=13;
  const ell=(m,s)=>{ let q=0; X.forEach(x=>{ q+=(x-m)*(x-m); }); return -N*Math.log(s)-q/(2*s*s)-N/2*Math.log(2*Math.PI); };
  const LMAX=ell(5,2), LMIN=LMAX-DROP;   /* heights: the log-likelihood itself, cut off at a floor 13 below the peak */
  const hgt=l=>Math.max(0,(l-LMIN)/(LMAX-LMIN));
  const H=2.5, SX=.78, SZ=1.05, CM=5, CS=3;       /* scene: μ → x, σ → depth */
  const toS=(m,s,l)=>[(m-CM)*SX,hgt(l)*H,-(s-CS)*SZ];
  let mu=3, sg=4, sc=null, anim=null, trail=[];
  function build(){ sc=null; const narrow=box.clientWidth<520, r=narrow?11.5:9.4, th=Math.PI-.55, ph=1.0, look=[0,.8,0];
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),look[1]+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look,fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx), c=ctx.colors;
        starfield(ctx,240,16); glassFloor(ctx,6.4,{div:24,y:-.02});
        const surf=CIN.prim.surface(ctx,(x,y)=>0,{x:[(M0-CM)*SX,(M1-CM)*SX],y:[(S0-CS)*SZ,(S1-CS)*SZ],res:80,ramp:[c.s7,c.s6,c.s4],opacity:isLight?.92:.9}); root.add(surf);
        reshape(ctx,surf,(x,y)=>ell(x/SX+CM,y/SZ+CS),1,[c.s7,c.s6,c.s4],1.6);
        const pos=surf.userData.geo.attributes.position; for(let i=0;i<pos.count;i++){ const l=ell(pos.getX(i)/SX+CM,-pos.getZ(i)/SZ+CS); pos.setY(i,hgt(l)*H); } pos.needsUpdate=true; surf.userData.geo.computeVertexNormals();
        { const col=surf.userData.geo.attributes.color, white=new THREE.Color(1,1,1); for(let i=0;i<pos.count;i++){ const u=Math.pow(pos.getY(i)/H,1.35); const K=new THREE.Color(CIN.ramp(u,c.s7,c.s6,c.s4)); if(isLight) K.lerp(white,.3); K.convertSRGBToLinear(); col.setXYZ(i,K.r,K.g,K.b); } col.needsUpdate=true; }
        if(surf.children[1]) surf.children[1].material.opacity=isLight?.06:.05;
        /* contour rings of equal log-likelihood, lifted onto the surface */
        const lv=[]; for(let k=1;k<=7;k++) lv.push(LMAX-k*k*.25);
        const segs=contourSegs((a,b)=>ell(a,b),lv,M0,M1,S0,S1,90), flat=[]; segs.forEach(({L,segs:ss})=>ss.forEach(([a,b,cc,d])=>{ const p=toS(a,b,L), q=toS(cc,d,L); flat.push(p[0],p[1]+.01,p[2],q[0],q[1]+.01,q[2]); }));
        root.add(segs3(ctx,flat,isLight?hx('ink'):0xffffff,isLight?.3:.35));
        /* axes labels */
        root.add(lab(ctx,'← middle μ',[(M0-CM)*SX-.1,.02,-(S1-CS)*SZ-.45],{size:20,bg:false,color:c.muted,scale:.0068}));
        root.add(lab(ctx,'spread σ →',[(M0-CM)*SX-.55,.02,0],{size:20,bg:false,color:c.muted,scale:.0068}));
        [2,3,4,5,6,7,8].forEach(m=>root.add(lab(ctx,String(m),[(m-CM)*SX,.02,-(S1-CS)*SZ-.2],{size:16,bg:false,color:c.muted,scale:.0058})));
        [1,2,3,4,5].forEach(s=>root.add(lab(ctx,String(s),[(M0-CM)*SX-.22,.02,-(s-CS)*SZ],{size:16,bg:false,color:c.muted,scale:.0058})));
        /* the peak */
        const pk=toS(5,2,LMAX); const star=bead(ctx,[pk[0],pk[1]+.06,pk[2]],K14.mean,.07); root.add(star); overlay(star,11);
        root.add(lab(ctx,'peak (5, 2)',[pk[0]+.1,pk[1]+.42,pk[2]],{size:18,color:c.s4,scale:.0064,depthTest:false}));
        const ball=bead(ctx,[0,0,0],'ink',.075); ball.userData.h.scale.setScalar(ctx.isLight?.26:.34); overlay(ball,13); root.add(ball); const stem=liveTube(ctx,hx('ink'),.008,.6); root.add(stem);
        const trailG=new THREE.Group(); root.add(trailG);
        sc={ctx,THREE,hx,surf,ball,stem,trailG,handle:null}; sc.hud=hud(box); hint(box,'drag the ball · drag elsewhere to orbit'); paint(); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM||anim) return false; const o=sc.handle.ctx.orbit; o.sph.theta=Math.PI-.55+.2*Math.sin(t*.2); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; });
      const pick=picker(handle,()=>sc&&sc.surf.userData.mesh);
      grab(handle,e=>{ const p=pick(e); if(!p) return false; const m=p.x/SX+CM, s=-p.z/SZ+CS; if(Math.hypot((m-mu)*SX,(s-sg)*SZ)>.55) return false; stop(); pressOnly(pre,null); return true; },
        e=>{ const p=pick(e); if(!p) return; mu=Math.max(M0,Math.min(M1,Math.round((p.x/SX+CM)*20)/20)); sg=Math.max(S0,Math.min(S1,Math.round((-p.z/SZ+CS)*20)/20)); trail=[]; all(); },()=>{}); }
    return handle; }
  function paint(){ if(!sc) return; const {ctx,THREE,hx}=sc, p=toS(mu,sg,ell(mu,sg));
    sc.ball.position.set(p[0],p[1]+.1,p[2]); aimTube(THREE,sc.stem,[p[0],-.01,p[2]],[p[0],p[1],p[2]]);
    clearGroup(sc.trailG); if(trail.length>1) sc.trailG.add(overlay(tubeLine(ctx,trail.map(([m,s])=>{ const q=toS(m,s,ell(m,s)); return [q[0],q[1]+.04,q[2]]; }),hx(K14.mean),.02),9));
    sc.hud.innerHTML='bell (μ, σ) = ('+F(mu,2)+', '+F(sg,2)+') · log-likelihood <b>'+F(ell(mu,sg),2)+'</b>'; RR(ctx); }
  function side(){ const fr=frame(svg,0,11,0,.42,{l:34,r:10,t:14,b:26,xs:1,ys:.1,yf:v=>trim(F(v,2)),xf:v=>v%2?'':String(v)}), g=el('g',{'clip-path':fr.clip},svg);
    let d=''; for(let i=0;i<=220;i++){ const x=11*i/220; d+=(i?'L':'M')+fr.px(x).toFixed(1)+','+fr.py(Math.min(.42,npdf(x,mu,sg))).toFixed(1); } glowPath(g,d,'var(--ink)',2.2,!isLight());
    const seen={}; X.forEach(x=>{ const k=seen[x]=(seen[x]||0)+1, hgt=npdf(x,mu,sg), Xp=fr.px(x);
      if(k===1) el('line',{x1:Xp,y1:fr.py(0),x2:Xp,y2:fr.py(Math.min(.42,hgt)),stroke:cvar(K14.mean),'stroke-width':2.2},g);
      el('circle',{cx:Xp,cy:fr.py(0)-5-(k-1)*10,r:4.6,fill:cvar(K14.data),stroke:'var(--page)','stroke-width':1.2},svg); });
    txt(svg,fr.W-fr.R-4,fr.T+12,'minutes','font:600 10px Inter,system-ui;fill:var(--ink-muted)','end'); }
  function readout(){ const l=ell(mu,sg), prod=Math.exp(l);
    kv(tbl,[['bell (μ, σ)','('+F(mu,2)+', '+F(sg,2)+')'],['product of the 8 heights',sci(prod,3)],['log-likelihood ℓ(μ, σ)','<b>'+F(l,3)+'</b>'],['the peak ℓ(5, 2)',F(LMAX,3)]]);
    let msg; const near=Math.abs(mu-5)<.03&&Math.abs(sg-2)<.03;
    if(near){ verd.className='verdict good'; msg='good — the top: μ̂ = 5 (the average), σ̂ = 2 (from σ̂² = 32/8 = 4)'; }
    else { verd.className='verdict info'; const why=sg<1.6&&Math.abs(mu-5)<1?'too narrow: 2 and 9 sit far out on the tails, their heights almost 0':(sg>2.8&&Math.abs(mu-5)<1?'too wide: every point is covered, but every height is low':(Math.abs(mu-5)>=1?'off-centre: the points on the far side are pushed onto a tail':'close — keep climbing')); msg='info — '+why; }
    verd.textContent=msg; }
  function all(){ paint(); side(); readout(); }
  function stop(){ if(anim){ anim.stop(); anim=null; } }
  function goTo(m,s,btn){ stop(); pressOnly(pre,btn); trail=[]; const a=mu, b=sg; anim=tween(RM?1:800,u=>{ mu=a+(m-a)*u; sg=b+(s-b)*u; setCtl('ml-mu',+mu.toFixed(2),v=>trim(F(v,2))); setCtl('ml-sig',+sg.toFixed(2),v=>trim(F(v,2))); all(); },()=>{ anim=null; mu=m; sg=s; all(); }); }
  function climb(){ stop(); pressOnly(pre,null); trail=[[mu,sg]]; const path=[[mu,sg]]; let m=mu, s=sg;
    for(let k=0;k<400;k++){ let q=0; X.forEach(x=>{ q+=(x-m)*(x-m); }); const gm=X.reduce((a,x)=>a+(x-m),0)/(s*s), gs=-N/s+q/(s*s*s);
      m+=.1*s*s/N*gm; s+=.1*s*s/(2*N)*gs; s=Math.max(S0,Math.min(S1,s)); path.push([m,s]); if(Math.abs(gm)+Math.abs(gs)<1e-4) break; }
    path.push([5,2]);
    if(RM){ mu=5; sg=2; trail=path; all(); return; }
    anim=tween(3200,u=>{ const i=Math.min(path.length-1,Math.floor(u*(path.length-1))); mu=path[i][0]; sg=path[i][1]; trail=path.slice(0,i+1); setCtl('ml-mu',+mu.toFixed(2),v=>trim(F(v,2))); setCtl('ml-sig',+sg.toFixed(2),v=>trim(F(v,2))); all(); },()=>{ anim=null; mu=5; sg=2; setCtl('ml-mu',5,()=>'5'); setCtl('ml-sig',2,()=>'2'); all(); }); }
  bindCtl('ml-mu',v=>{ stop(); mu=v; trail=[]; pressOnly(pre,null); all(); },v=>trim(F(v,2)));
  bindCtl('ml-sig',v=>{ stop(); sg=v; trail=[]; pressOnly(pre,null); all(); },v=>trim(F(v,2)));
  document.getElementById('ml-climb').addEventListener('click',climb);
  document.getElementById('ml-p-narrow').addEventListener('click',e=>goTo(5,1,e.currentTarget));
  document.getElementById('ml-p-wide').addEventListener('click',e=>goTo(5,4.5,e.currentTarget));
  document.getElementById('ml-p-off').addEventListener('click',e=>goTo(3,2,e.currentTarget));
  document.getElementById('ml-p-best').addEventListener('click',e=>goTo(5,2,e.currentTarget));
  window.U14M={get:()=>({mu,sg,l:ell(mu,sg),LMAX})};
  side(); readout();
  new MutationObserver(side).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<520)!==(rw<520)) remount(ST); rw=W; });
})();

/* ================= W11 · EVERY POINT STANDS ON ITS OWN BELL (least squares = Gaussian likelihood) ================= */
(function(){
  const box=document.getElementById('ls-3d'); if(!box) return;
  const tbl=document.getElementById('ls-kv'), verd=document.getElementById('ls-verdict'), pre=document.getElementById('ls-pre');
  const BASE=[[0,1],[1,3],[2,2],[3,5]], OUT=[1,8];
  let w=.5, b=2, noise='gauss', out=false, sc=null, anim=null;
  const pts=()=>out?BASE.concat([OUT]):BASE;
  const dens=(r)=>noise==='gauss'?npdf(r,0,1):.5*Math.exp(-Math.abs(r));
  function lsFit(P){ const n=P.length, mx=P.reduce((a,p)=>a+p[0],0)/n, my=P.reduce((a,p)=>a+p[1],0)/n; let sxy=0,sxx=0; P.forEach(p=>{ sxy+=(p[0]-mx)*(p[1]-my); sxx+=(p[0]-mx)*(p[0]-mx); }); const W=sxy/sxx; return [W,my-W*mx]; }
  function ladFit(P){ let best=null; for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++){ if(P[i][0]===P[j][0]) continue; const W=(P[j][1]-P[i][1])/(P[j][0]-P[i][0]), B=P[i][1]-W*P[i][0]; const s=P.reduce((a,p)=>a+Math.abs(p[1]-W*p[0]-B),0); if(!best||s<best[2]-1e-12) best=[W,B,s]; } return [best[0],best[1]]; }
  const sse=(W,B)=>pts().reduce((a,p)=>a+(p[1]-W*p[0]-B)**2,0), sae=(W,B)=>pts().reduce((a,p)=>a+Math.abs(p[1]-W*p[0]-B),0);
  const loglik=(W,B)=>noise==='gauss'?-sse(W,B)/2-pts().length/2*Math.log(2*Math.PI):-sae(W,B)-pts().length*Math.log(2);
  const SX=1.25, SY=.52, CX=1.6, CY=4, HZ=3.2;
  const P3=(x,y,h)=>[(x-CX)*SX,h||0,-(y-CY)*SY];
  function build(){ sc=null; const narrow=box.clientWidth<520, r=narrow?11:8.8, th=-.42, ph=1.0, look=[0,.7,0];
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),look[1]+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look,fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx), c=ctx.colors;
        starfield(ctx,240,16); glassFloor(ctx,7,{div:28});
        [0,1,2,3].forEach(x=>root.add(lab(ctx,'x = '+x,P3(x,-1.2,.02),{size:16,bg:false,color:c.muted,scale:.0058})));
        [0,2,4,6,8].forEach(y=>root.add(lab(ctx,'y = '+y,P3(-.75,y,.02),{size:16,bg:false,color:c.muted,scale:.0058})));
        const dyn=new THREE.Group(), ghost=new THREE.Group(); root.add(ghost,dyn);
        sc={ctx,THREE,hx,dyn,ghost,handle:null}; sc.hud=hud(box); hint(box,'drag to orbit'); paint(); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM||anim) return false; const o=sc.handle.ctx.orbit; o.sph.theta=-.42+.2*Math.sin(t*.2); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; }); }
    return handle; }
  function paint(){ if(!sc) return; const {ctx,THREE,hx,dyn,ghost}=sc; clearGroup(dyn); clearGroup(ghost);
    const line=(W,B,col,rad,op)=>tubeLine(ctx,[P3(-.4,W*-.4+B,.02),P3(3.6,W*3.6+B,.02)],col,rad,op);
    dyn.add(line(w,b,ctx.isLight?hx('ink'):0xffffff,.02));
    const other=noise==='gauss'?ladFit(pts()):lsFit(pts()); ghost.add(line(other[0],other[1],hx(noise==='gauss'?K14.q:K14.axis),.012,.55));
    pts().forEach((p,i)=>{ const yh=w*p[0]+b, isOut=out&&i===pts().length-1;
      /* the bell at this x, centred on the line's prediction */
      const bell=[]; for(let k=0;k<=90;k++){ const y=yh-4+8*k/90; if(y<-1.6||y>9.8) continue; bell.push(P3(p[0],y,dens(y-yh)*HZ+.01)); }
      if(bell.length>1){ dyn.add(tubeLine(ctx,bell,hx(K14.mass),.016));
        /* a translucent fill under the bell */
        const shape=[]; bell.forEach(q=>shape.push(q)); const geo=new THREE.BufferGeometry(), pos=[];
        for(let k=0;k+1<shape.length;k++){ const a=shape[k], c2=shape[k+1]; pos.push(a[0],0,a[2], a[0],a[1],a[2], c2[0],c2[1],c2[2], a[0],0,a[2], c2[0],c2[1],c2[2], c2[0],0,c2[2]); }
        geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); dyn.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:hx(K14.mass),transparent:true,opacity:ctx.isLight?.16:.13,side:THREE.DoubleSide,depthWrite:false}))); }
      /* the point, its error stick, its bead on the bell */
      dyn.add(bead(ctx,P3(p[0],p[1],.05),isOut?'critical':K14.data,.075));
      dyn.add(overlay(tubeLine(ctx,[P3(p[0],p[1],.03),P3(p[0],yh,.03)],hx('critical'),.02),8));
      const hgt=dens(p[1]-yh)*HZ; dyn.add(overlay(bead(ctx,P3(p[0],p[1],hgt+.01),K14.mean,.06),11));
      dyn.add(tubeLine(ctx,[P3(p[0],p[1],.02),P3(p[0],p[1],Math.max(.03,hgt))],hx(K14.mean),.006,.7)); });
    sc.hud.innerHTML=(noise==='gauss'?'bell noise':'Laplace noise')+' · log-likelihood <b>'+F(loglik(w,b),3)+'</b>'; RR(ctx); }
  function readout(){ const l=loglik(w,b), fit=noise==='gauss'?lsFit(pts()):ladFit(pts()), at=Math.abs(w-fit[0])<.006&&Math.abs(b-fit[1])<.006;
    kv(tbl,[['line','y = '+F(w,3)+'x + '+F(b,3)],['squared error Σr²',noise==='gauss'?'<b>'+F(sse(w,b),3)+'</b>':F(sse(w,b),3)],['absolute error Σ|r|',noise==='laplace'?'<b>'+F(sae(w,b),3)+'</b>':F(sae(w,b),3)],['log-likelihood ('+(noise==='gauss'?'bell, σ = 1':'Laplace, s = 1')+')','<b>'+F(l,3)+'</b>'],['product of the heights',sci(Math.exp(l),3)],['best line for this noise','y = '+F(fit[0],3)+'x + '+F(fit[1],3)]]);
    if(at){ verd.className='verdict good'; verd.textContent=noise==='gauss'?('good — the most likely line under bell noise is the least-squares line, w = '+F(fit[0],3)+', b = '+F(fit[1],3)+(out?' — dragged by the outlier (the orange ghost is the Laplace fit)':'')):('good — under Laplace noise the most likely line minimises the absolute error: w = '+F(fit[0],3)+', b = '+F(fit[1],3)+(out?' — the outlier barely matters':'')); }
    else { verd.className='verdict info'; verd.textContent='info — move the line: each bead slides down its bell as its point drifts from the line, and the log-likelihood falls with it'; } }
  function all(){ paint(); readout(); }
  function stop(){ if(anim){ anim.stop(); anim=null; } }
  const fmtC=v=>trim(F(v,2));
  bindCtl('ls-w',v=>{ stop(); w=v; all(); },fmtC); bindCtl('ls-b',v=>{ stop(); b=v; all(); },fmtC);
  document.getElementById('ls-fit').addEventListener('click',()=>{ stop(); const f=noise==='gauss'?lsFit(pts()):ladFit(pts()), a=[w,b]; anim=tween(RM?1:1400,u=>{ w=a[0]+(f[0]-a[0])*u; b=a[1]+(f[1]-a[1])*u; setCtl('ls-w',+w.toFixed(2),fmtC); setCtl('ls-b',+b.toFixed(2),fmtC); all(); },()=>{ anim=null; w=f[0]; b=f[1]; all(); }); });
  document.getElementById('ls-out').addEventListener('click',e=>{ stop(); out=!out; e.currentTarget.setAttribute('aria-pressed',out?'true':'false'); e.currentTarget.textContent=out?'remove the outlier':'add the outlier (1, 8)'; all(); });
  tabs(document.getElementById('ls-tabs'),t=>{ stop(); noise=t; all(); });
  window.U14L={get:()=>({w,b,noise,out,sse:sse(w,b),sae:sae(w,b),ll:loglik(w,b),ls:lsFit(pts()),lad:ladFit(pts())})};
  readout();
  const ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<520)!==(rw<520)) remount(ST); rw=W; });
})();
