/* ================= W5 · THE BELL, MEASURED IN σ'S ================= */
(function(){
  const svg=document.getElementById('bl-svg'); if(!svg) return;
  const tbl=document.getElementById('bl-kv'), verd=document.getElementById('bl-verdict');
  let mu=160, s=8, kk=2, x=172, fr=null, drag=false;
  const AREA={1:.6826894921370859,2:.9544997361036416,3:.9973002039367398};
  function draw(){ const pk=npdf(mu,mu,s), top=pk*1.32; fr=frame(svg,120,200,0,top,{l:48,r:14,t:18,b:34,xs:10,ys:top>.1?.02:.01,yf:v=>trim(F(v,2))});
    const g=el('g',{'clip-path':fr.clip},svg), glow=fr.glow;
    /* the shaded band */
    const a=mu-kk*s, b=mu+kk*s; let d='M'+fr.px(a)+','+fr.py(0); for(let i=0;i<=160;i++){ const t=a+(b-a)*i/160; d+='L'+fr.px(t).toFixed(1)+','+fr.py(npdf(t,mu,s)).toFixed(1); } d+='L'+fr.px(b)+','+fr.py(0)+'Z';
    el('path',{d,fill:cvar(K14.mass),opacity:isLight()?.3:.34},g);
    /* σ ticks */
    for(let j=-3;j<=3;j++){ const t=mu+j*s; if(t<120||t>200) continue; const X=fr.px(t); el('line',{x1:X,y1:fr.py(0),x2:X,y2:fr.py(npdf(t,mu,s)),stroke:j?'var(--ink-muted)':cvar(K14.mean),'stroke-width':j?1:2,'stroke-dasharray':j?'3 4':'6 4',opacity:j?.7:1},g);
      txt(svg,X,fr.py(0)-6,j?(j>0?'+':'−')+Math.abs(j)+'σ':'μ',`font:700 11px Inter,system-ui;fill:${j?'var(--ink-2)':'var(--s4)'}`,'middle'); }
    /* the curve */
    let c=''; for(let i=0;i<=400;i++){ const t=120+80*i/400; c+=(i?'L':'M')+fr.px(t).toFixed(1)+','+fr.py(npdf(t,mu,s)).toFixed(1); }
    glowPath(g,c,'var(--ink)',2.6,!isLight());
    txt(svg,fr.px(mu),fr.py(pk*.3),PCT(AREA[kk],1)+' of the area','font:800 14px Inter,system-ui;fill:'+(isLight()?'var(--ink)':'#fff'),'middle');
    /* probe */
    const X=fr.px(x), Y=fr.py(npdf(x,mu,s)); el('line',{x1:X,y1:fr.py(0),x2:X,y2:Y,stroke:'var(--ink)','stroke-width':1.6},svg);
    el('circle',{cx:X,cy:Y,r:15,fill:'var(--ink)',opacity:.12},svg); el('circle',{cx:X,cy:Y,r:7,fill:'var(--ink)',stroke:cvar(K14.mean),'stroke-width':2.4},svg);
    const z=(x-mu)/s; txt(svg,X+(x>185?-12:12),Math.max(fr.T+12,Y-12),'z = '+F(z,2),'font:800 13px Inter,system-ui;fill:var(--s4)',x>185?'end':'start');
    txt(svg,fr.px(200),fr.H-4,'height (cm) →','font:600 11px Inter,system-ui;fill:var(--ink-muted)','end');
    kv(tbl,[['middle μ · spread σ',trim(F(mu,1))+' cm · '+trim(F(s,1))+' cm'],['shaded band','μ ± '+kk+'σ = '+trim(F(mu-kk*s,1))+' to '+trim(F(mu+kk*s,1))],['area of the band','<b>'+PCT(AREA[kk],1)+'</b>'],['probe height x',trim(F(x,1))+' cm'],['z-score (x − μ)/σ','<b>'+F(z,2)+'</b>'],['density at x',F(npdf(x,mu,s),4)]]);
    verd.className='verdict '+(Math.abs(z-1.5)<.01?'good':'info');
    verd.textContent=Math.abs(z-1.5)<.01?'good — '+trim(F(x,1))+' cm is 1.5 spreads above the middle: z = 1.5, whatever the units':'info — '+trim(F(x,1))+' cm is '+F(Math.abs(z),2)+' spreads '+(z>=0?'above':'below')+' the middle. The band always holds '+PCT(AREA[kk],1)+', for every μ and σ.'; }
  svgDrag(svg,(X,Y)=>{ if(!fr) return false; if(Math.abs(X-fr.px(x))>34) return false; drag=true; },X=>{ if(!drag) return; x=Math.max(121,Math.min(199,Math.round(fr.ix(X)*2)/2)); draw(); },()=>{ drag=false; });
  bindCtl('bl-mu',v=>{ mu=v; draw(); },v=>String(v));
  bindCtl('bl-sig',v=>{ s=v; draw(); },v=>trim(F(v,1)));
  const bar=document.getElementById('bl-k'); [1,2,3].forEach(k=>document.getElementById('bl-k'+k).addEventListener('click',e=>{ kk=k; pressOnly(bar,e.currentTarget); draw(); }));
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W6 · A LOPSIDED DIE BECOMES A BELL (the exact distribution of an average) ================= */
(function(){
  const svg=document.getElementById('ct-svg'); if(!svg) return;
  const tbl=document.getElementById('ct-kv'), verd=document.getElementById('ct-verdict');
  const PD=[.4,.1,.05,.05,.1,.3], MU=3.25, V=4.7875, SD=Math.sqrt(V);
  let n=1, anim=null;
  const CONV=[null,[0,...PD]];  /* CONV[n][s] = P(sum of n rolls = s) */
  for(let k=2;k<=30;k++){ const a=CONV[k-1], b=new Array(6*k+1).fill(0); a.forEach((p,s)=>{ if(p) for(let f=1;f<=6;f++) b[s+f]+=p*PD[f-1]; }); CONV[k]=b; }
  function draw(){ const d=CONV[n], sd=SD/Math.sqrt(n), gp=1/(sd*SQ2PI);
    let top=0; for(let s=n;s<=6*n;s++) top=Math.max(top,d[s]*n); top=Math.max(top,gp)*1.15;
    const fr=frame(svg,.5,6.5,0,top,{l:44,r:14,t:18,b:34,xs:.5,ys:top>2?.5:(top>.8?.2:.1),xf:v=>Number.isInteger(v)?String(v):'',yf:v=>trim(F(v,2))});
    const g=el('g',{'clip-path':fr.clip},svg), w=Math.max(1.2,(fr.px(1/n)-fr.px(0))*.8);
    for(let s=n;s<=6*n;s++){ const a=s/n, h=d[s]*n; if(h<=0) continue; el('rect',{x:fr.px(a)-w/2,y:fr.py(h),width:w,height:fr.py(0)-fr.py(h),rx:Math.min(3,w/3),fill:cvar(K14.mass),opacity:isLight()?.7:.8,filter:(fr.glow&&n<=6)?fr.glow:null},g); }
    let c=''; for(let i=0;i<=400;i++){ const t=.5+6*i/400; c+=(i?'L':'M')+fr.px(t).toFixed(1)+','+fr.py(npdf(t,MU,sd)).toFixed(1); }
    glowPath(g,c,'var(--ink)',2.4,!isLight());
    glowLine(g,fr.px(MU),fr.py(0),fr.px(MU),fr.py(top),cvar(K14.mean),1.6,false,{'stroke-dasharray':'6 5'});
    txt(svg,fr.px(MU)+6,fr.T+14,'mean 3.25','font:700 11px Inter,system-ui;fill:var(--s4)');
    /* inset: the die itself */
    const ix=fr.W-fr.R-150, iy=fr.T+10; el('rect',{x:ix-10,y:iy-4,width:156,height:88,rx:8,fill:'var(--page)',opacity:.55,stroke:'var(--line)'},svg);
    txt(svg,ix,iy+10,'one roll of the die','font:700 10.5px Inter,system-ui;fill:var(--ink-muted)');
    PD.forEach((p,i)=>{ const X=ix+8+i*22, h=p*140; el('rect',{x:X,y:iy+74-h,width:14,height:h,rx:2,fill:cvar(K14.q),opacity:.9},svg); txt(svg,X+7,iy+86-.5,String(i+1),'font:600 9px Inter,system-ui;fill:var(--ink-muted)','middle'); });
    txt(svg,fr.px(6.5),fr.H-4,'average of n rolls →','font:600 11px Inter,system-ui;fill:var(--ink-muted)','end');
    let tv=0; for(let s=n;s<=6*n;s++) tv+=Math.abs(d[s]-npdf(s/n,MU,sd)/n); tv/=2;
    kv(tbl,[['rolls averaged n','<b>'+n+'</b>'],['mean of the average',F(MU,2)],['spread of one roll σ',F(SD,3)],['spread of the average σ/√n','<b>'+F(sd,3)+'</b>'],['gap to the bell (half the total difference)',F(tv,3)]]);
    if(n===1){ verd.className='verdict info'; verd.textContent='info — one roll: a U shape, nothing like a bell'; }
    else if(n<8){ verd.className='verdict info'; verd.textContent='info — '+n+' rolls: the U is filling in; the bell is on its way'; }
    else { verd.className='verdict good'; verd.textContent='good — '+n+' rolls: a bell around 3.25 with spread '+F(sd,3)+' = '+F(SD,3)+'/√'+n; } }
  function setN(v){ n=Math.max(1,Math.min(30,Math.round(v))); setCtl('ct-n',n,x=>String(x)); draw(); }
  bindCtl('ct-n',v=>{ if(anim){ anim.stop(); anim=null; } n=v; draw(); },v=>String(v));
  document.getElementById('ct-play').addEventListener('click',()=>{ if(anim) anim.stop(); if(RM){ setN(30); return; } let last=0; anim=tween(6500,u=>{ const v=1+Math.floor(29*u+1e-9); if(v!==last){ last=v; setN(v); } },()=>{ anim=null; setN(30); }); });
  [['ct-p1',1],['ct-p10',10],['ct-p30',30]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',()=>{ if(anim){ anim.stop(); anim=null; } setN(v); }));
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W7 · THE PROBABILITY MOUNTAIN AND ITS ELLIPSE (3-D flagship) ================= */
(function(){
  const box=document.getElementById('g2-3d'); if(!box) return;
  const tbl=document.getElementById('g2-kv'), verd=document.getElementById('g2-verdict'), pre=document.getElementById('g2-pre');
  const B=4.2;                                     /* the floor runs from −B to B in both directions */
  let s1=Math.SQRT2, s2=Math.SQRT2, rho=.5, mu=[0,0], pr=[1,-1], slice=false, sc=null;
  const Sig=()=>[[s1*s1,rho*s1*s2],[rho*s1*s2,s2*s2]];
  const det=()=>s1*s1*s2*s2*(1-rho*rho);
  const inv=()=>{ const S=Sig(), D=det(); return [[S[1][1]/D,-S[0][1]/D],[-S[0][1]/D,S[0][0]/D]]; };
  const mah2=p=>{ const I=inv(), a=p[0]-mu[0], b=p[1]-mu[1]; return I[0][0]*a*a+2*I[0][1]*a*b+I[1][1]*b*b; };
  const dens=(x,y)=>Math.exp(-.5*mah2([x,y]))/(2*Math.PI*Math.sqrt(det()));
  const peak=()=>1/(2*Math.PI*Math.sqrt(det()));
  const ZS=()=>2.7/peak();
  function build(){ sc=null; const narrow=box.clientWidth<560, r=narrow?14.5:11.2, th=.62, ph=.9, look=[0,.55,0];
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),look[1]+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look,fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx), c=ctx.colors;
        starfield(ctx,260,18); glassFloor(ctx,2*B+.4,{div:34});
        const surf=CIN.prim.surface(ctx,(x,y)=>0,{x:[-B,B],y:[-B,B],res:96,ramp:[c.s1,c.s6,c.s4],opacity:isLight?.9:.88}); root.add(surf);
        const vis=fadeAttr(THREE,surf); if(surf.children[1]) surf.children[1].visible=false;
        const floorLines=new THREE.Group(), liftLines=new THREE.Group(), axes=new THREE.Group(), probeG=new THREE.Group(), sliceG=new THREE.Group(); root.add(floorLines,liftLines,axes,probeG,sliceG);
        const muBead=bead(ctx,[0,.05,0],K14.mean,.085); root.add(muBead); const muStem=liveTube(ctx,hx(K14.mean),.01,.8); root.add(muStem);
        const pBead=bead(ctx,[0,.05,0],'ink',.075); root.add(pBead); const pStem=liveTube(ctx,hx('ink'),.008,.75); root.add(pStem); const pTop=CIN.prim.dot(ctx,[0,0,0],hx('ink'),.045); overlay(pTop,12); root.add(pTop);
        const hit=new THREE.Mesh(new THREE.PlaneGeometry(2*B+.4,2*B+.4),new THREE.MeshBasicMaterial({visible:false})); hit.rotation.x=-Math.PI/2; root.add(hit);
        [['x₁',[B+.4,.02,0]],['x₂',[0,.02,-B-.4]]].forEach(([t,p])=>root.add(lab(ctx,t,p,{size:22,bg:false,color:c.muted,scale:.0075})));
        const labs=[slot(ctx,root),slot(ctx,root),slot(ctx,root)];
        sc={ctx,THREE,hx,surf,vis,floorLines,liftLines,axes,probeG,sliceG,muBead,muStem,pBead,pStem,pTop,hit,labs,handle:null};
        hint(box,'drag the probe or the gold mean · drag elsewhere to orbit'); sc.hud=hud(box); paint(true); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM) return false; const o=sc.handle.ctx.orbit; o.sph.theta=.62+.22*Math.sin(t*.18); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; const cvs=handle.ctx.renderer.domElement; cvs.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; });
      const pick=picker(handle,()=>sc&&sc.hit); let what=null;
      grab(handle,e=>{ const p=pick(e); if(!p) return false; const m=[p.x,-p.z]; const dp=Math.hypot(m[0]-pr[0],m[1]-pr[1]), dm=Math.hypot(m[0]-mu[0],m[1]-mu[1]); if(Math.min(dp,dm)>.45) return false; what=dp<=dm?'p':'m'; pressOnly(pre,null); return true; },
        e=>{ const p=pick(e); if(!p) return; const m=[Math.max(-B+.1,Math.min(B-.1,Math.round(p.x*20)/20)),Math.max(-B+.1,Math.min(B-.1,Math.round(-p.z*20)/20))]; if(what==='p') pr=m; else mu=m; paint(what==='m'); readout(); },()=>{ what=null; }); }
    return handle; }
  function ringPts(k,h){ const S=Sig(); return ellipsePts(mu[0],mu[1],S[0][0],S[0][1],S[1][1],k,110).map(p=>M3(p[0],p[1],h)); }
  function paint(reshapeToo){ if(!sc) return; const {THREE,ctx,hx,surf,vis}=sc, zs=ZS();
    if(reshapeToo!==false){ const c=ctx.colors; reshape(ctx,surf,(x,y)=>dens(x,y),zs,[c.s1,c.s6,c.s4],.9);
      const pos=surf.userData.geo.attributes.position, pk=peak(); for(let i=0;i<pos.count;i++){ const z=pos.getY(i)/zs; const u=Math.max(0,Math.min(1,(z/pk-.012)/.16)); vis.setX(i,u*u*(3-2*u)); } vis.needsUpdate=true;
      /* floor contours (1σ, 2σ, 3σ ellipses) + the same rings lifted onto the mountain */
      clearGroup(sc.floorLines); clearGroup(sc.liftLines); clearGroup(sc.axes);
      [1,2].forEach((k,i)=>{ sc.floorLines.add(overlay(tubeLine(ctx,ringPts(k,.012),hx(K14.mass),.018-.005*i,1-.25*i),6));
        const h=pk*Math.exp(-.5*k*k)*zs; sc.liftLines.add(tubeLine(ctx,ringPts(k,h+.006),ctx.isLight?hx('ink'):0xffffff,.007,.55)); });
      const S=Sig(), E=eig2(S[0][0],S[0][1],S[1][1]);
      E.forEach((e,j)=>{ const L=2*Math.sqrt(e.l), A=M3(mu[0]-e.v[0]*L,mu[1]-e.v[1]*L,.03), Bq=M3(mu[0]+e.v[0]*L,mu[1]+e.v[1]*L,.03);
        const ar=CIN.prim.arrow(ctx,A,Bq,hx(K14.axis),{radius:.017,head:.16}); overlay(ar,8); sc.axes.add(ar);
        const ar2=CIN.prim.arrow(ctx,Bq,A,hx(K14.axis),{radius:.017,head:.16}); overlay(ar2,8); sc.axes.add(ar2);
        sc.labs[j].set('λ = '+TT(e.l,2),M3(mu[0]+e.v[0]*(L+.42),mu[1]+e.v[1]*(L+.42),.18),{size:19,color:cssv(K14.axis),scale:.0075,depthTest:false}); });
      sc.muBead.position.set(...M3(mu[0],mu[1],.05)); aimTube(THREE,sc.muStem,M3(mu[0],mu[1],.02),M3(mu[0],mu[1],pk*zs)); }
    /* the probe */
    const hz=dens(pr[0],pr[1])*zs; sc.pBead.position.set(...M3(pr[0],pr[1],.05)); aimTube(THREE,sc.pStem,M3(pr[0],pr[1],.02),M3(pr[0],pr[1],Math.max(.03,hz))); sc.pTop.position.set(...M3(pr[0],pr[1],hz));
    clearGroup(sc.probeG); const d=Math.sqrt(mah2(pr)); if(d>.05){ sc.probeG.add(overlay(tubeLine(ctx,ringPts(d,.016),ctx.isLight?hx('ink'):0xffffff,.006,.8),7)); }
    sc.labs[2].set('d = '+F(d,2),M3(pr[0],pr[1],Math.max(hz,.2)+.28),{size:19,color:cssv('ink'),scale:.0075,depthTest:false});
    /* the slice: a vertical glass pane through the probe, parallel to x₁, and the 1-D bell it cuts */
    clearGroup(sc.sliceG); if(slice){ const pk=peak(); const pane=CIN.prim.glass(ctx,2*B,pk*zs*1.12,hx('ink2'),ctx.isLight?.1:.09); pane.position.set(0,pk*zs*.56,-pr[1]); sc.sliceG.add(pane);
      const pts=[]; for(let i=0;i<=120;i++){ const x=-B+2*B*i/120; pts.push(M3(x,pr[1],dens(x,pr[1])*zs+.01)); } sc.sliceG.add(overlay(tubeLine(ctx,pts,hx(K14.mean),.02),9)); }
    const S=Sig(); sc.hud.innerHTML='Σ = [['+TT(S[0][0],2)+', '+TT(S[0][1],2)+'], ['+TT(S[1][0],2)+', '+TT(S[1][1],2)+']] · peak <b>'+F(peak(),4)+'</b>';
    RR(ctx); }
  function readout(){ const S=Sig(), E=eig2(S[0][0],S[0][1],S[1][1]), d=Math.sqrt(mah2(pr)), eu=Math.hypot(pr[0]-mu[0],pr[1]-mu[1]);
    kv(tbl,[['covariance Σ',mx2(S,2)],['eigenvalues λ₁, λ₂',TT(E[0].l,3)+', '+TT(E[1].l,3)],['long axis along',vecS2(E[0].v)],['det Σ · peak density',TT(det(),3)+' · <b>'+F(peak(),4)+'</b>'],['probe',vecS2(pr)],['plain distance','<b>'+F(eu,3)+'</b>'],['Mahalanobis distance d','<b>'+F(d,3)+'</b>']]);
    const worked=Math.abs(s1-Math.SQRT2)<.006&&Math.abs(s2-Math.SQRT2)<.006&&Math.abs(rho-.5)<1e-9&&!mu[0]&&!mu[1];
    if(worked&&Math.abs(pr[0]-1)<1e-9&&Math.abs(pr[1]+1)<1e-9){ verd.className='verdict good'; verd.textContent='good — (1, −1) cuts across the short axis: plain distance 1.414, Mahalanobis 1.414. Now try (1, 1): the same plain distance, Mahalanobis only 0.816.'; }
    else if(worked&&Math.abs(pr[0]-1)<1e-9&&Math.abs(pr[1]-1)<1e-9){ verd.className='verdict good'; verd.textContent='good — (1, 1) lies along the long axis: plain distance 1.414, Mahalanobis only 0.816 — an ordinary point'; }
    else if(Math.abs(rho)<1e-9){ verd.className='verdict info'; verd.textContent='info — ρ = 0: the ellipse lines up with the axes'+(Math.abs(s1-s2)<1e-9?' and is a circle':'')+'. The mountain is a bell in x₁ times a bell in x₂.'; }
    else { verd.className='verdict info'; verd.textContent='info — plain distance '+F(eu,3)+', Mahalanobis '+F(d,3)+(d>eu?': the probe is further than it looks, across the grain of the cloud':': the probe is along the grain of the cloud, closer than it looks'); } }
  const vecS2=v=>'('+v.map(x=>TT(Math.abs(x)<5e-4?0:x,3)).join(', ')+')';
  function all(){ paint(true); readout(); }
  bindCtl('g2-s1',v=>{ s1=v; pressOnly(pre,null); all(); },v=>trim(F(v,2)));
  bindCtl('g2-s2',v=>{ s2=v; pressOnly(pre,null); all(); },v=>trim(F(v,2)));
  bindCtl('g2-rho',v=>{ rho=v; pressOnly(pre,null); all(); },v=>trim(F(v,2)));
  function preset(btn,a,b,r){ const f=[s1,s2,rho]; pressOnly(pre,btn); mu=[0,0];
    tween(RM?1:700,u=>{ s1=f[0]+(a-f[0])*u; s2=f[1]+(b-f[1])*u; rho=f[2]+(r-f[2])*u; all(); },()=>{ s1=a; s2=b; rho=r; setCtl('g2-s1',+a.toFixed(2),v=>trim(F(v,2))); setCtl('g2-s2',+b.toFixed(2),v=>trim(F(v,2))); setCtl('g2-rho',r,v=>trim(F(v,2))); all(); }); }
  document.getElementById('g2-p-worked').addEventListener('click',e=>{ pr=[1,-1]; preset(e.currentTarget,Math.SQRT2,Math.SQRT2,.5); });
  document.getElementById('g2-p-round').addEventListener('click',e=>preset(e.currentTarget,1,1,0));
  document.getElementById('g2-p-long').addEventListener('click',e=>preset(e.currentTarget,1.6,1.1,.9));
  document.getElementById('g2-slice').addEventListener('click',e=>{ slice=!slice; e.currentTarget.textContent='slice: '+(slice?'on':'off'); e.currentTarget.setAttribute('aria-pressed',slice?'true':'false'); paint(false); });
  window.U14N={set:(p,m)=>{ if(p) pr=p; if(m) mu=m; all(); },get:()=>({s1,s2,rho,mu:mu.slice(),pr:pr.slice(),d:Math.sqrt(mah2(pr)),peak:peak()})};
  readout();
  const ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
})();

/* ================= W8 · STRETCH A ROUND CLOUD INTO ANY ELLIPSE ================= */
(function(){
  const svg=document.getElementById('st-svg'); if(!svg) return;
  const tbl=document.getElementById('st-kv'), verd=document.getElementById('st-verdict'), pre=document.getElementById('st-pre');
  const rnd=seeded(2024), Z=[]; for(let i=0;i<400;i++) Z.push([gauss2(rnd),gauss2(rnd)]);
  let L=[[2,0],[1,1]], t=1, tab='L', anim=null;
  const S=()=>[[L[0][0]*L[0][0],L[0][0]*L[1][0]],[L[0][0]*L[1][0],L[1][0]*L[1][0]+L[1][1]*L[1][1]]];
  function cov(P){ const n=P.length; let mx=0,my=0; P.forEach(p=>{ mx+=p[0]; my+=p[1]; }); mx/=n; my/=n; let a=0,b=0,c=0; P.forEach(p=>{ const u=p[0]-mx, v=p[1]-my; a+=u*u; b+=u*v; c+=v*v; }); return [[a/n,b/n],[b/n,c/n]]; }
  function draw(){ const M=[[1+(L[0][0]-1)*t,0],[L[1][0]*t,1+(L[1][1]-1)*t]], X=Z.map(z=>[M[0][0]*z[0],M[1][0]*z[0]+M[1][1]*z[1]]);
    const fr=eqFrame(svg,0,0,7.2,{l:30,r:12,t:12,b:26,xs:2,ys:2}); const g=el('g',{'clip-path':fr.clip},svg), dark=!isLight();
    /* the target ellipses (1σ, 2σ) of Σ = LLᵀ, and its eigen-axes */
    const Sg=S(); [2,1].forEach(k=>el('path',{d:ellD(fr,[0,0],Sg,k),fill:k===2?cvar(K14.mass):'none','fill-opacity':k===2?(dark?.06:.07):0,stroke:cvar(K14.mass),'stroke-width':k===2?2.2:1.4,'stroke-dasharray':'7 5',opacity:.95},g));
    eig2(Sg[0][0],Sg[0][1],Sg[1][1]).forEach(e=>{ const r=2*Math.sqrt(e.l); glowLine(g,fr.px(-e.v[0]*r),fr.py(-e.v[1]*r),fr.px(e.v[0]*r),fr.py(e.v[1]*r),cvar(K14.axis),1.8,dark,{opacity:.85}); });
    /* the cloud */
    const col=cvar(K14.data); X.forEach(p=>{ el('circle',{cx:fr.px(p[0]).toFixed(1),cy:fr.py(p[1]).toFixed(1),r:2.6,fill:col,opacity:dark?.85:.75},g); });
    /* L's columns (where e₁ and e₂ are sent) */
    edge(g,fr.px(0),fr.py(0),fr.px(M[0][0]),fr.py(M[1][0]),'var(--ink)',2.6,fr.glow); edge(g,fr.px(0),fr.py(0),fr.px(0),fr.py(M[1][1]),'var(--ink)',2.6,fr.glow);
    txt(svg,fr.px(M[0][0])+8,fr.py(M[1][0])-6,'Le₁','font:700 12px Inter,system-ui;fill:var(--ink)'); txt(svg,fr.px(0)+8,fr.py(M[1][1])-6,'Le₂','font:700 12px Inter,system-ui;fill:var(--ink)');
    txt(svg,fr.L+8,fr.T+16,t<1?'stretching… '+Math.round(100*t)+'%':'x = Lz','font:700 12px Inter,system-ui;fill:var(--ink-2)');
    const C=cov(X), Cz=cov(Z);
    kv(tbl,[['L',mx2(L,2)],['Σ = LLᵀ',mx2(Sg,2)],['the cloud\'s own covariance',mx2(C,2)],['round cloud\'s covariance',mx2(Cz,2)]]);
    const close=Math.abs(C[0][0]-Sg[0][0])/Sg[0][0]<.15&&Math.abs(C[1][1]-Sg[1][1])/Sg[1][1]<.15;
    if(t<1){ verd.className='verdict info'; verd.textContent='info — every point is being pushed by the same matrix: shear and stretch, nothing added'; }
    else if(Math.abs(L[1][0])<1e-9){ verd.className='verdict info'; verd.textContent='info — ℓ₂₁ = 0: no lean, so the ellipse stands straight along the axes (ρ = 0)'; }
    else { verd.className=close?'verdict good':'verdict info'; verd.textContent=(close?'good — ':'info — ')+'400 stretched points have covariance close to Σ = LLᵀ; the small gap is sampling wobble (the round cloud itself is not exactly I)'; } }
  function setL(n){ L=n; ['l11','l21','l22'].forEach((k,i)=>setCtl('st-'+k,[L[0][0],L[1][0],L[1][1]][i],v=>trim(F(v,2)))); const Sg=S(); setCtl('st-s11',Sg[0][0],v=>trim(F(v,2))); setCtl('st-s12',Sg[0][1],v=>trim(F(v,2))); setCtl('st-s22',Sg[1][1],v=>trim(F(v,2))); }
  const fromL=()=>{ const a=+document.getElementById('st-l11').value, b=+document.getElementById('st-l21').value, c=+document.getElementById('st-l22').value; L=[[a,0],[b,c]]; const Sg=S(); setCtl('st-s11',+Sg[0][0].toFixed(2),v=>trim(F(v,2))); setCtl('st-s12',+Sg[0][1].toFixed(2),v=>trim(F(v,2))); setCtl('st-s22',+Sg[1][1].toFixed(2),v=>trim(F(v,2))); };
  const fromS=()=>{ const a=+document.getElementById('st-s11').value, b=+document.getElementById('st-s12').value, c=+document.getElementById('st-s22').value; const l11=Math.sqrt(a), l21=b/l11, r=c-l21*l21;
    if(r<=1e-6){ verd.className='verdict bad'; verd.textContent='bad — Σ₁₂² ≥ Σ₁₁Σ₂₂: this Σ is not positive definite, so it has no real square root L (no cloud has this covariance)'; return false; }
    L=[[l11,0],[l21,Math.sqrt(r)]]; ['l11','l21','l22'].forEach((k,i)=>setCtl('st-'+k,+[L[0][0],L[1][0],L[1][1]][i].toFixed(2),v=>trim(F(v,2)))); return true; };
  ['l11','l21','l22'].forEach(k=>bindCtl('st-'+k,()=>{ if(anim){ anim.stop(); anim=null; } t=1; pressOnly(pre,null); fromL(); draw(); },v=>trim(F(v,2))));
  ['s11','s12','s22'].forEach(k=>bindCtl('st-'+k,()=>{ if(anim){ anim.stop(); anim=null; } t=1; pressOnly(pre,null); if(fromS()) draw(); },v=>trim(F(v,2))));
  tabs(document.getElementById('st-tabs'),k=>{ tab=k; showTab(svg.closest('.widget'),k); });
  document.getElementById('st-play').addEventListener('click',()=>{ if(anim) anim.stop(); if(RM){ t=1; draw(); return; } anim=tween(2600,u=>{ t=u; draw(); },()=>{ anim=null; t=1; draw(); }); t=0; draw(); });
  document.getElementById('st-p-worked').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); setL([[2,0],[1,1]]); t=1; draw(); });
  document.getElementById('st-p-round').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); setL([[1,0],[0,1]]); t=1; draw(); });
  window.U14S={get:()=>({L:L.map(r=>r.slice()),S:S(),C:cov(Z.map(z=>[L[0][0]*z[0],L[1][0]*z[0]+L[1][1]*z[1]]))})};
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();
