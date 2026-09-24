/* ================= W12 · THE CLASSIFIER AS A VOTE (drag a star; each support vector votes) ================= */
(function(){
  const svg=document.getElementById('vt-svg'), bars=document.getElementById('vt-bars'), verd=document.getElementById('vt-verdict'), note=document.getElementById('vt-note'); if(!svg) return;
  const MODELS={
    lin:{X:D1.X,Y:D1.y,kernel:{type:'lin'},c:[3.2,3.4],half:3.9,star:[2,4]},
    ker:{X:[[1,2],[-1,-2],[1,-2],[-1,2]],Y:[1,1,-1,-1],kernel:{type:'poly',d:2},c:[0,0],half:3.4,star:[2,1]}};
  let tab='lin', fr=null, drag=false; const R={}; Object.keys(MODELS).forEach(k=>{ const m=MODELS[k]; R[k]=SVM.solve(m.X,m.Y,{kernel:m.kernel}); m.s=m.star.slice(); });
  function draw(){ const m=MODELS[tab], r=R[tab], K=SVM.kfun(m.kernel), x=m.s;
    fr=eqFrame(svg,m.c[0],m.c[1],m.half,{xs:1,ys:1}); const g=el('g',{'clip-path':fr.clip},svg);
    regionImage(g,fr,r.f,{nx:100}); contours(g,fr,r.f,[-1,0,1],{N:80});
    const votes=[]; m.X.forEach((p,i)=>{ if(r.alpha[i]>1e-9){ const sim=K(p,x), v=r.alpha[i]*m.Y[i]*sim; votes.push({i,p,sim,v}); } });
    const vmax=Math.max(.5,...votes.map(v=>Math.abs(v.v)));
    votes.forEach(v=>{ el('line',{x1:fr.px(v.p[0]),y1:fr.py(v.p[1]),x2:fr.px(x[0]),y2:fr.py(x[1]),stroke:cvar(v.v>=0?K13.pos:K13.neg),'stroke-width':1+5*Math.abs(v.v)/vmax,opacity:.55,'stroke-linecap':'round'},g); });
    const top=el('g',{},svg); m.X.forEach((p,i)=>{ if(r.alpha[i]>1e-9) svRing(top,fr.px(p[0]),fr.py(p[1]),7); mark(top,fr.px(p[0]),fr.py(p[1]),m.Y[i],{r:7,dim:r.alpha[i]<=1e-9}); });
    const f=r.f(x), X=fr.px(x[0]), Y=fr.py(x[1]);
    el('circle',{cx:X,cy:Y,r:18,fill:cvar(K13.sv),opacity:.15},svg);
    el('path',{d:starPath(X,Y,11,5),fill:cvar(K13.sv),stroke:'var(--page)','stroke-width':1.4},svg);
    txt(svg,X+14,Y-12,'f = '+nm(trim(F(f,3))),'font:700 12px Inter,system-ui;fill:var(--s4);paint-order:stroke;stroke:var(--page);stroke-width:3px');
    const simName=tab==='lin'?'xᵢ·x':'(xᵢ·x)²';
    const rows=votes.map(v=>{ const w=Math.min(50,50*Math.abs(v.v)/vmax); return `<div class="vt"><span style="color:var(--${classKey(m.Y[v.i])})">${ptName(v.p)}</span><span class="track"><i style="${v.v>=0?'left:50%':'right:50%'};width:${w.toFixed(1)}%;background:var(--${classKey(m.Y[v.i])})"></i></span><span class="v">${nm(trim(F(v.v,3)))}</span></div>`; });
    rows.push(`<div class="vt"><span style="color:var(--ink-2)">offset b</span><span class="track"><i style="${r.b>=0?'left:50%':'right:50%'};width:${Math.min(50,50*Math.abs(r.b)/vmax).toFixed(1)}%;background:var(--ink-2)"></i></span><span class="v">${nm(trim(F(r.b,3)))}</span></div>`);
    rows.push(`<div class="vt total"><span>f(x)</span><span class="track"><i style="${f>=0?'left:50%':'right:50%'};width:${Math.min(50,50*Math.abs(f)/vmax).toFixed(1)}%;background:var(--${f>=0?K13.pos:K13.neg})"></i></span><span class="v">${nm(trim(F(f,3)))}</span></div>`);
    bars.innerHTML=`<div class="vt" style="color:var(--ink-muted)"><span>voter</span><span style="text-align:center">α · y · ${simName}</span><span class="v">vote</span></div>`+rows.join('');
    note.innerHTML='star at '+ptName(x)+' · each vote = αᵢ · yᵢ · '+simName+' · voters: '+votes.map(v=>ptName(v.p)+' α = '+frac(r.alpha[v.i])).join(', ');
    verd.className='verdict info'; verd.style.color=Math.abs(f)<1e-9?'':(f>0?'var(--s1)':'var(--s2)');
    verd.textContent=(Math.abs(f)<1e-9?'on the boundary — the votes cancel exactly':(f>0?'class +1 (blue)':'class −1 (orange)')+(Math.abs(f)>=1-1e-9?' — outside the street':' — inside the street'))+' · f = '+nm(trim(F(f,3))); }
  function starPath(x,y,R,r){ let d=''; for(let k=0;k<10;k++){ const a=-Math.PI/2+k*Math.PI/5, rr=k%2?r:R; d+=(k?'L':'M')+(x+rr*Math.cos(a)).toFixed(1)+','+(y+rr*Math.sin(a)).toFixed(1); } return d+'Z'; }
  svgDrag(svg,(x,y)=>{ if(!fr) return false; const s=MODELS[tab].s; if(Math.hypot(x-fr.px(s[0]),y-fr.py(s[1]))>30) return false; drag=true; },
    (x,y)=>{ if(!drag) return; MODELS[tab].s=[Math.round(Math.max(fr.X0+.05,Math.min(fr.X1-.05,fr.ix(x)))*20)/20,Math.round(Math.max(fr.Y0+.05,Math.min(fr.Y1-.05,fr.iy(y)))*20)/20]; draw(); },()=>{ drag=false; });
  tabs(document.getElementById('vt-tabs'),t=>{ tab=t; draw(); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W13 · LIFT, CUT, LOOK DOWN (three data sets rise into 3-D) ================= */
(function(){
  const box=document.getElementById('lf-3d'), read=document.getElementById('lf-read'), verd=document.getElementById('lf-verdict'); if(!box) return;
  const RINGS=(function(){ const rnd=seeded(31), pts=[]; for(let i=0;i<12;i++){ const t=i/12*2*Math.PI+.2, r=.62+(rnd()-.5)*.1; pts.push({p:[r*Math.cos(t),r*Math.sin(t)],y:1}); }
    for(let i=0;i<18;i++){ const t=i/18*2*Math.PI, r=1.35+(rnd()-.5)*.12; pts.push({p:[r*Math.cos(t),r*Math.sin(t)],y:-1}); } return pts; })();
  const SETS={
    line:{pts:[{p:[-1,0],y:1},{p:[1,0],y:1},{p:[-2,0],y:-1},{p:[2,0],y:-1}],S:.62,KZ:.25,h:p=>p[0]*p[0],cut:2.5},
    xor:{pts:[{p:[1,1],y:1},{p:[-1,-1],y:1},{p:[1,-1],y:-1},{p:[-1,1],y:-1}],S:.8,KZ:.55,h:p=>p[0]*p[1],cut:0},
    rings:{pts:RINGS,S:1,KZ:.55,h:p=>p[0]*p[0]+p[1]*p[1],cut:1.02*1.02}};
  let tab='line', u=1, cut=1, sc=null, anim=null;
  function build(){ sc=null; const T=SETS[tab], narrow=box.clientWidth<560, r=(narrow?8.6:6.8)*(tab==='line'?.9:1), th=tab==='line'?.12:.55, ph=tab==='xor'?1.15:1.05;
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),.35+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look:[0,.35,0],fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx), S=T.S, KZ=T.KZ;
        const fl=glassFloor(ctx,6,{div:24}); if(tab==='xor'){ fl.slab.material.opacity=isLight?.18:.28; }
        const beads=T.pts.map(q=>{ const b=bead3(ctx,M3(q.p[0]*S,q.p[1]*S,.07),q.y,{r:.075}); root.add(b); return b; });
        const G=new THREE.Group(); root.add(G);
        /* the lifted sheet */
        if(tab==='line'){ const pts=[]; for(let i=0;i<=80;i++){ const x=-2.4+4.8*i/80; pts.push(M3(x*S,0,x*x*KZ)); } const cv=ribbon(ctx,pts,hx(K13.edge),.012); cv.material.transparent=true; G.add(cv); G.userData.sheet=cv;
          root.add(tube(ctx,M3(-2.6*S,0,.004),M3(2.6*S,0,.004),hx('axis'),.008,.9)); }
        else { const f=tab==='xor'?(a,b)=>a*b:(a,b)=>a*a+b*b, R0=tab==='xor'?1.5:1.65;
          const surf=CIN.prim.surface(ctx,(a,b)=>f(a/S,b/S),{x:[-R0*S,R0*S],y:[-R0*S,R0*S],res:70,zscale:KZ,ramp:[ctx.colors.s1,ctx.colors.s7,ctx.colors.s2],opacity:isLight?.4:.32,wire:true});
          if(tab==='rings'){ const vis=fadeAttr(THREE,surf), pos=surf.userData.geo.attributes.position; for(let i=0;i<pos.count;i++){ const rr=Math.hypot(pos.getX(i),pos.getZ(i)); vis.setX(i,rr<=R0*S*1.0?1:0); } vis.needsUpdate=true; }
          surf.traverse(m=>{ if(m.material) m.material.depthWrite=false; }); G.add(surf); G.userData.sheet=surf; }
        /* the cut and its shadow */
        const plane=tab==='line'?CIN.prim.glass(ctx,5.4*S,1.1,hx('ink2'),0):CIN.prim.glass(ctx,4.4,4.4,hx('ink2'),0); plane.rotation.x=-Math.PI/2; root.add(plane);
        if(tab==='line'){ const cl=liveTube(ctx,hx('ink'),.016,1); cl.material.depthWrite=false; aimTube(THREE,cl,[-2.7*S,0,0],[2.7*S,0,0]); plane.add(cl); }
        const shadow=new THREE.Group(), lifted=new THREE.Group(); root.add(shadow,lifted);
        const ink=hx('ink'), mk=(A,B,op)=>{ const m=liveTube(ctx,ink,.02,op); m.material.depthWrite=false; aimTube(THREE,m,A,B); return m; };
        if(tab==='line'){ const t=Math.sqrt(T.cut); [-t,t].forEach(x=>{ shadow.add(mk(M3(x*S,-.6,.01),M3(x*S,.6,.01),1)); lifted.add(mk(M3(x*S,0,.01),M3(x*S,0,T.cut*KZ),.5)); }); }
        else if(tab==='xor'){ shadow.add(mk(M3(-1.6*S,0,.012),M3(1.6*S,0,.012),1)); shadow.add(mk(M3(0,-1.6*S,.012),M3(0,1.6*S,.012),1)); }
        else { const R0=Math.sqrt(T.cut); const ring=new THREE.Mesh(new THREE.TorusGeometry(R0*S,.022,10,96),new THREE.MeshStandardMaterial({color:ink,emissive:ink,emissiveIntensity:isLight?.25:1,transparent:true,depthWrite:false})); ring.rotation.x=Math.PI/2; ring.position.y=.012; shadow.add(ring);
          const up=ring.clone(); up.material=ring.material.clone(); up.position.y=T.cut*KZ; lifted.add(up);
          for(let j=0;j<24;j++){ const a=j/24*2*Math.PI; lifted.add(mk([R0*S*Math.cos(a),.012,-R0*S*Math.sin(a)],[R0*S*Math.cos(a),T.cut*KZ,-R0*S*Math.sin(a)],.3)); } }
        const labs=[slot(ctx,root),slot(ctx,root)];
        sc={ctx,THREE,T,beads,G,plane,shadow,lifted,labs,handle:null}; hint(box,'drag to orbit'); sc.hud=hud(box); paint(); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM||sc.story) return false; const o=sc.handle.ctx.orbit; o.sph.theta=(tab==='line'?.12:.55)+.14*Math.sin(t*.22); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; }); }
    return handle; }
  function paint(){ if(!sc) return; const {T,beads,G,plane,shadow,lifted,labs,ctx}=sc, S=T.S, KZ=T.KZ;
    T.pts.forEach((q,i)=>{ beads[i].position.y=.07+T.h(q.p)*KZ*u; });
    const sh=G.userData.sheet; if(sh){ sh.visible=u>.02; sh.scale.y=Math.max(.001,u); sh.traverse(m=>{ if(m.material){ if(m.userData.op0==null) m.userData.op0=m.material.opacity; m.material.opacity=m.userData.op0*Math.min(1,u*1.4); } }); }
    plane.visible=cut>.01; plane.position.y=T.cut*KZ+(1-easeIO(cut))*1.2; plane.material.opacity=(ctx.isLight?.14:.16)*Math.min(1,cut*2);
    const cv=Math.max(0,(cut-.6)/.4); shadow.visible=lifted.visible=cv>.001; [shadow,lifted].forEach(g=>g.traverse(m=>{ if(m.material){ if(m.userData.op1==null) m.userData.op1=m.material.opacity; m.material.opacity=m.userData.op1*cv; } }));
    const txts={line:['cut up there: x² = 2.5','down here: x = ±1.58'],xor:['cut up there: x₁x₂ = 0','down here: the two axes'],rings:['cut up there: x₁² + x₂² = 1.04','down here: a circle of radius 1.02']}[tab];
    if(cv>.5){ labs[0].set(txts[0],[1.2*S+.6,T.cut*KZ+.25,0],{size:15,color:cssv('ink'),depthTest:false,scale:.0048}); labs[1].set(txts[1],[1.2*S+.6,.2,.9],{size:15,color:cssv(K13.edge),depthTest:false,scale:.0048}); } else { labs[0].hide(); labs[1].hide(); }
    sc.hud.innerHTML={line:'new feature <b>x²</b>',xor:'new feature <b>x₁x₂</b>',rings:'new feature <b>x₁² + x₂²</b>'}[tab]+' · lift <b>'+Math.round(u*100)+'%</b>'; RR(ctx); }
  function draw(){ const info={line:['Blue at ±1, orange at ±2: no single threshold works.','Add x²: blue rises to 1, orange to 4.','The flat line x² = 2.5 separates them.','Down on the line: two thresholds, x = ±√2.5 ≈ ±1.58.'],
      xor:['Blue at (1,1) and (−1,−1), orange at (1,−1) and (−1,1).','Add x₁x₂: blue rises to +1, orange sinks to −1.','The flat plane x₁x₂ = 0 separates them.','Down on the floor: x₁x₂ = 0, the two axes.'],
      rings:['A blue ring inside an orange ring.','Add x₁² + x₂²: every point rises by its squared distance.','A flat plane at height 1.04 slices between the rings.','Down on the floor: the circle x₁² + x₂² = 1.04.']}[tab];
    read.innerHTML=info.map((s,i)=>'<b>'+(i+1)+'.</b> '+s).join('<br>');
    if(u>=.999&&cut>=.999){ verd.className='verdict good'; verd.textContent='good — a straight cut up there, a curved rule down here: the SVM is still linear, in the lifted space'; }
    else { verd.className='verdict info'; verd.textContent='info — on the floor no straight line splits these points; lift them to find one'; }
    paint(); }
  function stop(){ if(anim){ anim.stop(); anim=null; } if(sc) sc.story=false; }
  bindCtl('lf-u',v=>{ stop(); u=v; cut=v>=.999?1:0; draw(); },v=>Math.round(v*100)+'%');
  document.getElementById('lf-play').addEventListener('click',()=>{ stop(); if(sc) sc.story=true; if(RM){ u=1; cut=1; setCtl('lf-u',1,()=>'100%'); draw(); return; }
    u=0; cut=0; anim=tween(2200,t=>{ u=t; setCtl('lf-u',u,v=>Math.round(v*100)+'%'); draw(); },()=>{ anim=tween(1800,t=>{ cut=t; draw(); },()=>{ cut=1; draw(); if(sc){ sc.story=false; flare(sc.ctx,[0,.05,0],hxOf(sc.ctx)('ink'),900,1.4); } }); }); });
  let ST=null;
  tabs(document.getElementById('lf-tabs'),t=>{ stop(); tab=t; u=1; cut=1; setCtl('lf-u',1,()=>'100%'); if(ST) remount(ST); draw(); });
  setCtl('lf-u',1,()=>'100%'); draw(); ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
})();

/* ================= W14 · TWO ROUTES TO ONE NUMBER (the kernel calculator and the feature counter) ================= */
(function(){
  const $=id=>document.getElementById(id); if(!$('w-kernel')) return;
  let ker='poly'; const G=.5;
  const R2='√2';
  const n4=v=>nm(trim(F(v,4)));
  const binom=(n,k)=>{ if(k<0||k>n) return 0; let r=1; for(let i=1;i<=k;i++) r=r*(n-k+i)/i; return Math.round(r); };
  function calc(){ const x=[+$('kc-x1').value||0,+$('kc-x2').value||0], z=[+$('kc-z1').value||0,+$('kc-z2').value||0], d=x[0]*z[0]+x[1]*z[1];
    let aBody='', aRes=NaN, bBody='', bRes=NaN;
    const vec=(v,names)=>'('+v.map((c,i)=>names&&names[i]?names[i]:n4(c)).join(', ')+')';
    if(ker==='lin'){ aBody='no lift: φ(x) = x<br>φ(x)·φ(z) = '+n4(x[0])+'·'+n4(z[0])+' + '+n4(x[1])+'·'+n4(z[1]); aRes=d; bBody='x·z = '+n4(x[0]*z[0])+' + '+n4(x[1]*z[1])+' = '+n4(d)+'<br>K = x·z'; bRes=d; }
    else if(ker==='poly'){ const px=[x[0]*x[0],Math.SQRT2*x[0]*x[1],x[1]*x[1]], pz=[z[0]*z[0],Math.SQRT2*z[0]*z[1],z[1]*z[1]], pr=px.map((v,i)=>v*pz[i]);
      const s2=(a,b)=>{ const p=a*b; return Math.abs(p)<1e-12?'0':n4(p)+R2; };
      aBody='φ(x) = (x₁², √2x₁x₂, x₂²) = ('+n4(px[0])+', '+s2(x[0],x[1])+', '+n4(px[2])+')<br>φ(z) = ('+n4(pz[0])+', '+s2(z[0],z[1])+', '+n4(pz[2])+')<br>products: '+pr.map(n4).join(' + ');
      aRes=pr.reduce((p,q)=>p+q,0); bBody='x·z = '+n4(x[0]*z[0])+' + '+n4(x[1]*z[1])+' = <b>'+n4(d)+'</b><br>K = (x·z)² = '+n4(d)+'²'; bRes=d*d; }
    else if(ker==='polyc'){ const f=v=>[v[0]*v[0],v[1]*v[1],Math.SQRT2*v[0]*v[1],Math.SQRT2*v[0],Math.SQRT2*v[1],1], px=f(x), pz=f(z), pr=px.map((v,i)=>v*pz[i]);
      aBody='φ(v) = (v₁², v₂², √2v₁v₂, √2v₁, √2v₂, 1) — six features<br>products: '+pr.map(n4).join(' + '); aRes=pr.reduce((p,q)=>p+q,0);
      bBody='x·z = <b>'+n4(d)+'</b><br>K = (x·z + 1)² = '+n4(d+1)+'²'; bRes=(d+1)*(d+1); }
    else { const dd=(x[0]-z[0])**2+(x[1]-z[1])**2; aBody='φ has <b>infinitely many</b> coordinates:<br>e<sup>−γ‖x−z‖²</sup> expands into every power (x·z)ᵏ.<br>There is nothing finite to build.'; aRes=NaN;
      bBody='‖x − z‖² = '+n4(dd)+'<br>K = e<sup>−0.5 · '+n4(dd)+'</sup>'; bRes=Math.exp(-G*dd); }
    $('kc-a-body').innerHTML=aBody; $('kc-b-body').innerHTML=bBody;
    $('kc-a-res').textContent=isNaN(aRes)?'—':'= '+n4(aRes); $('kc-b-res').textContent='= '+n4(bRes);
    const match=!isNaN(aRes)&&Math.abs(aRes-bRes)<1e-9*Math.max(1,Math.abs(bRes)); $('kc-a').classList.toggle('match',match); $('kc-b').classList.toggle('match',match||isNaN(aRes)); }
  function counts(){ const n=+$('kc-n').value, d=+$('kc-d').value, h=binom(n+d-1,d), c=binom(n+d,d), kc=n+2;
    const L=v=>Math.log10(Math.max(1,v)), mx=L(Math.max(c,1e6));
    const row=(nmv,v,col,sub)=>`<div class="cb"><span>${nmv}</span><span class="bar"><i style="width:${(100*L(v)/mx).toFixed(1)}%;background:var(--${col})"></i></span><span class="v">${v.toLocaleString('en-IN')}</span></div>`+(sub?`<div style="font-size:.72rem;color:var(--ink-muted);margin:-.2rem 0 .1rem">${sub}</div>`:'');
    $('kc-cost').innerHTML=row('(x·z)ᵈ features',h,K13.edge,'C(n+d−1, d) = C('+(n+d-1)+', '+d+')')+row('(x·z+1)ᵈ features',c,K13.neg,'C(n+d, d) = C('+(n+d)+', '+d+')')+row('kernel cost',kc,K13.w,n+' multiplications, 1 addition, 1 power — whatever d is')+'<div style="font-size:.72rem;color:var(--ink-muted)">bars on a log scale</div>'; }
  ['kc-x1','kc-x2','kc-z1','kc-z2'].forEach(id=>$(id).addEventListener('input',calc));
  tabs($('kc-tabs'),t=>{ ker=t; calc(); });
  bindCtl('kc-n',counts,v=>String(v)); bindCtl('kc-d',counts,v=>String(v));
  calc(); counts();
})();

/* ================= W15 · FOUR POINTS BECOME TWO (the XNOR set lifted by φ) ================= */
(function(){
  const box=document.getElementById('up-3d'), tbl=document.getElementById('up-kv'); if(!box) return;
  const X=[[1,2],[-1,-2],[1,-2],[-1,2]], Y=[1,1,-1,-1], PH=x=>[x[0]*x[0],Math.SQRT2*x[0]*x[1],x[1]*x[1]];
  const S=.36, C0=[1,0,2.5];
  const Qf=p=>[(p[0]-C0[0])*S*1.6,(p[2]-C0[2])*S+.9,-(p[1]-C0[1])*S];          /* feature space: φ1 across, φ3 up, φ2 depth */
  const Qo=x=>[x[0]*S*1.1,0,-x[1]*S*1.1];                                          /* the floor: the original plane */
  let u=1, sc=null, anim=null;
  function build(){ sc=null; const narrow=box.clientWidth<560, r=narrow?9.4:7.4, th=1.2, ph=1.12;
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),.6+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look:[0,.6,0],fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx);
        glassFloor(ctx,5.4,{div:24});
        /* the floor's own boundary: the pair of axes */
        const axG=new THREE.Group(); root.add(axG); axG.add(tube(ctx,Qo([-2.4,0]),Qo([2.4,0]),hx('ink'),.014,.95)); axG.add(tube(ctx,Qo([0,-2.4]),Qo([0,2.4]),hx('ink'),.014,.95));
        axG.add(lab(ctx,'floor: f = x₁x₂/2 · boundary = the two axes',Qo([0,-2.9]),{size:15,color:cssv('ink-2'),depthTest:false,scale:.0052}));
        const beads=X.map((x,i)=>{ const b=bead3(ctx,Qo(x),Y[i],{r:.08}); b.position.y=.08; root.add(b); return b; });
        /* feature space: axes, the separating plane φ2 = 0 and the margin planes φ2 = ±2√2 */
        const up=new THREE.Group(); root.add(up);
        [[[ -.2,0,2.5],[2.6,0,2.5],'φ₁ = x₁²'],[[1,-3.6,2.5],[1,3.6,2.5],'φ₂ = √2·x₁x₂'],[[1,0,.9],[1,0,5.2],'φ₃ = x₂²']].forEach(([A,B,t])=>{ up.add(tube(ctx,Qf(A),Qf(B),hx('axis'),.007,.9)); up.add(lab(ctx,t,Qf(B).map((v,i)=>i===1?v+.12:v),{size:15,color:cssv('ink-muted'),bg:false,depthTest:false,scale:.005})); });
        const pl=(v,col,op,edgeOp)=>{ const g=CIN.prim.glass(ctx,1.9,1.5,col,op); g.position.set(...Qf([1,v,3.2])); up.add(g);
          const fe=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.9,1.5)),new THREE.LineBasicMaterial({color:col,transparent:true,opacity:edgeOp})); fe.position.copy(g.position); up.add(fe); return g; };
        pl(0,hx('ink'),isLight?.12:.12,.9); pl(2*Math.SQRT2,hx(K13.edge),isLight?.12:.14,.8); pl(-2*Math.SQRT2,hx(K13.edge),isLight?.12:.14,.8);
        const wA=CIN.prim.arrow(ctx,Qf([1,0,4]),Qf([1,1.7,4]),hx(K13.w),{radius:.022,head:.15}); up.add(wA);
        up.add(lab(ctx,'w',Qf([1,1.9,4.25]),{size:17,color:cssv(K13.w),bg:false,depthTest:false,scale:.0055}));
        const P1=Qf(PH(X[0])), P2=Qf(PH(X[2])); up.add(tube(ctx,P1,P2,hx(K13.sv),.012,.9));
        up.add(lab(ctx,'width 4√2 ≈ 5.66',[(P1[0]+P2[0])/2,(P1[1]+P2[1])/2+.2,(P1[2]+P2[2])/2],{size:16,color:cssv(K13.sv),depthTest:false,scale:.0055}));
        up.add(lab(ctx,'φ(1,2) = φ(−1,−2)',[P1[0],P1[1]+.36,P1[2]],{size:15,color:cssv(K13.pos),depthTest:false,scale:.005}));
        up.add(lab(ctx,'φ(1,−2) = φ(−1,2)',[P2[0],P2[1]+.36,P2[2]],{size:15,color:cssv(K13.neg),depthTest:false,scale:.005}));
        up.add(lab(ctx,'boundary φ₂ = 0',Qf([1,0,4.55]),{size:15,color:cssv('ink'),depthTest:false,scale:.005}));
        const rings=[0,1].map(()=>{ const m=ring3(ctx,.16,{tube:.014}); m.rotation.x=0; up.add(m); return m; });
        sc={ctx,THREE,beads,up,rings,axG,handle:null}; hint(box,'drag to orbit'); sc.hud=hud(box); paint(); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM||sc.story) return false; const o=sc.handle.ctx.orbit; o.sph.theta=1.2+.15*Math.sin(t*.2); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; }); }
    return handle; }
  function paint(){ if(!sc) return; const e=easeIO(u);
    X.forEach((x,i)=>{ const A=Qo(x), B=Qf(PH(x)); sc.beads[i].position.set(A[0]+(B[0]-A[0])*e,.08+(B[1]-.08)*e,A[2]+(B[2]-A[2])*e); });
    sc.up.visible=u>.02; sc.up.traverse(m=>{ if(m.material){ if(m.userData.o0==null) m.userData.o0=m.material.opacity; m.material.transparent=true; m.material.opacity=m.userData.o0*Math.min(1,u*1.3); } });
    sc.rings[0].position.set(...Qf(PH(X[0]))); sc.rings[1].position.set(...Qf(PH(X[2]))); sc.rings.forEach(r=>{ r.visible=u>.95; });
    sc.axG.traverse(m=>{ if(m.material){ if(m.userData.o0==null) m.userData.o0=m.material.opacity; m.material.transparent=true; m.material.opacity=m.userData.o0*(1-.6*u); } });
    sc.hud.innerHTML=u<.98?'the floor: four points, x₁ and x₂':'upstairs: <b>two</b> points · margin <b>4√2 ≈ 5.657</b>'; RR(sc.ctx); }
  function draw(){ kv(tbl,[['φ(1, 2) = φ(−1, −2)','(1, 2√2, 4)'],['φ(1, −2) = φ(−1, 2)','(1, −2√2, 4)'],['w = Σ αᵢyᵢφ(xᵢ), α = 1/32','(0, √2/4, 0)'],['‖w‖','√2/4 ≈ 0.354'],['margin 2/‖w‖','<b>4√2 ≈ 5.657</b>'],['distance between the two points','2 · 2√2 = 4√2 ✓']]); paint(); }
  bindCtl('up-u',v=>{ if(anim) anim.stop(); u=v; draw(); },v=>Math.round(v*100)+'%');
  document.getElementById('up-play').addEventListener('click',()=>{ if(anim) anim.stop(); if(sc) sc.story=true; anim=tween(RM?1:2600,x=>{ u=x; setCtl('up-u',u,v=>Math.round(v*100)+'%'); draw(); },()=>{ if(sc) sc.story=false; }); });
  setCtl('up-u',1,()=>'100%'); draw();
  const ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
})();

/* ================= W16 · THE KERNEL PLAYGROUND (five data sets, four kernels, a fine, a live solver, the recipe) ================= */
(function(){
  const svg=document.getElementById('pg-svg'), box=document.getElementById('pg-3d'), tbl=document.getElementById('pg-kv'), verd=document.getElementById('pg-verdict'); if(!svg) return;
  const rnd0=seed=>seeded(seed);
  const SETS={
    xnor:()=>({X:[[1,2],[-1,-2],[1,-2],[-1,2]],Y:[1,1,-1,-1],k:'poly',C:3.5}),
    rings:()=>{ const r=rnd0(5), X=[], Y=[]; for(let i=0;i<13;i++){ const t=i/13*2*Math.PI+.3, q=1+(r()-.5)*.35; X.push([q*Math.cos(t),q*Math.sin(t)]); Y.push(1); } for(let i=0;i<17;i++){ const t=i/17*2*Math.PI, q=2.2+(r()-.5)*.35; X.push([q*Math.cos(t),q*Math.sin(t)]); Y.push(-1); } return {X:X.map(p=>p.map(v=>Math.round(v*100)/100)),Y,k:'polyc',C:3.5}; },
    moons:()=>{ const r=rnd0(9), X=[], Y=[]; for(let i=0;i<14;i++){ const t=Math.PI*i/13; X.push([1.8*Math.cos(t)-.9+(r()-.5)*.3,1.8*Math.sin(t)-.55+(r()-.5)*.3]); Y.push(1); } for(let i=0;i<14;i++){ const t=Math.PI*i/13; X.push([1.8*(1-Math.cos(t))-.9+(r()-.5)*.3,1.8*(.5-Math.sin(t))-.55+(r()-.5)*.3]); Y.push(-1); } return {X:X.map(p=>p.map(v=>Math.round(v*100)/100)),Y,k:'rbf',C:3.5}; },
    blobs:()=>{ const r=rnd0(21), X=[], Y=[]; for(let i=0;i<14;i++){ X.push([-.8+.8*gauss2(r),.6+.8*gauss2(r)]); Y.push(1); } for(let i=0;i<14;i++){ X.push([.8+.8*gauss2(r),-.6+.8*gauss2(r)]); Y.push(-1); } return {X:X.map(p=>p.map(v=>Math.round(Math.max(-3,Math.min(3,v))*100)/100)),Y,k:'lin',C:0}; },
    line:()=>({X:[[-1,0],[1,0],[-2,0],[2,0]],Y:[1,1,-1,-1],k:'poly',C:3.5})};
  let set='xnor', D=SETS.xnor(), ker='poly', lc=3.5, lg=0, addY=1, tab='map', res=null, fr=null, drag=-1, pristine=true, ST=null, raf=0;
  const Cval=()=>lc>=3.49?null:Math.pow(10,lc), Gval=()=>Math.pow(10,lg);
  const kspec=()=>ker==='lin'?{type:'lin'}:ker==='poly'?{type:'poly',d:2}:ker==='polyc'?{type:'polyc',d:2}:{type:'rbf',gamma:Gval()};
  const KNAME={lin:'x·z',poly:'(x·z)²',polyc:'(x·z + 1)²',rbf:'e^(−γ‖x−z‖²)'};
  function solve(){ res=SVM.solve(D.X,D.Y,{kernel:kspec(),C:Cval()}); }
  function draw(){ fr=eqFrame(svg,0,0,3.3,{xs:1,ys:1}); const g=el('g',{'clip-path':fr.clip},svg);
    if(res.ok){ regionImage(g,fr,res.f,{nx:110}); contours(g,fr,res.f,[-1,0,1],{N:84}); }
    const top=el('g',{},svg);
    D.X.forEach((p,i)=>{ const X=fr.px(p[0]),Y=fr.py(p[1]); const sv=res.ok&&res.alpha[i]>1e-9, bnd=res.ok&&res.bounded[i];
      if(sv) svRing(top,X,Y,7,{color:bnd?K13.crit:K13.sv}); mark(top,X,Y,D.Y[i],{r:drag===i?9:7});
      if(sv&&D.X.length<=6) txt(top,X+12,Y-10,'α = '+frac(res.alpha[i],256),'font:700 11px Inter,system-ui;fill:var(--s4);paint-order:stroke;stroke:var(--page);stroke-width:3px'); });
    if(!res.ok) txt(svg,fr.W/2,fr.T+24,res.infeasible?'no street: nothing clears every point with this kernel — lower C, or change the kernel':res.msg,'font:700 12.5px Inter,system-ui;fill:var(--critical)','middle');
    const acc=res.ok?D.X.filter((p,i)=>D.Y[i]*res.f(p)>0).length:0;
    kv(tbl,[['kernel',KNAME[ker]+(ker==='rbf'?', γ = '+trim(F(Gval(),2)):'')],['fine C',Cval()==null?'∞ (hard margin)':trim(F(Cval(),Cval()<1?3:1))],['support vectors',res.ok?'<b>'+res.nsv+'</b> of '+D.X.length+(res.bounded.some(Boolean)?' ('+res.bounded.filter(Boolean).length+' at the ceiling)':''):'—'],['b',res.ok?nm(trim(F(res.b,4))):'—'],['training points on the right side',res.ok?acc+' of '+D.X.length:'—'],['solve',F(res.ms,1)+' ms · '+res.iter+' steps']]);
    if(!res.ok){ verd.className='verdict bad'; verd.textContent='bad — '+(res.infeasible?'the hard margin has no answer here: the lifted points still overlap':res.msg); }
    else if(acc===D.X.length){ verd.className='verdict good'; verd.textContent='good — every training point on its own side; '+res.nsv+' support vectors hold the boundary'; }
    else { verd.className='verdict info'; verd.textContent='info — '+(D.X.length-acc)+' point(s) on the wrong side, fined at C = '+trim(F(Cval(),2)); }
    recipe(); if(tab==='land'&&ST) { cancelAnimationFrame(raf); raf=requestAnimationFrame(()=>remount(ST)); } }
  const refresh=()=>{ solve(); draw(); };
  /* ---- the recipe panel ---- */
  const rnav=document.getElementById('pg-rnav'), rsteps=document.getElementById('pg-rsteps'); let rstep=0;
  function recipe(){ const on=set==='xnor'&&ker==='poly'&&Cval()==null;
    if(!on){ rnav.innerHTML=''; rsteps.innerHTML='<div class="rs on" style="color:var(--ink-muted)">The recipe panel follows the <b>four points</b> with <b>(x·z)²</b> and no fine (C = ∞). Choose them above to walk the eight steps with live numbers.</div>'; return; }
    if(!res.ok){ rnav.innerHTML=''; rsteps.innerHTML='<div class="rs on">—</div>'; return; }
    const X=D.X, Y=D.Y, n=X.length, dots=X.map(a=>X.map(b=>a[0]*b[0]+a[1]*b[1])), K=dots.map(r=>r.map(v=>v*v)), Q=K.map((r,i)=>r.map((v,j)=>Y[i]*Y[j]*v));
    const mtx=(M,hl)=>'<div class="sc"><span class="mtx" style="grid-template-columns:repeat('+M.length+',auto)">'+M.map((r,i)=>r.map((v,j)=>'<span'+(hl&&hl(i,j)?' class="hl"':'')+'>'+nm(trim(F(v,3)))+'</span>').join('')).join('')+'</span></div>';
    const a=res.alpha, sym=pristine;
    const rowsum=Q.map(r=>r.reduce((p,q)=>p+q,0));
    const s=[];
    s.push(['1 · kernel table','Dot products first:'+mtx(dots)+'then square each one:'+mtx(K,(i,j)=>i===j)+'The diagonal is ‖xᵢ‖⁴; the table is symmetric.']);
    s.push(['2 · symmetry',sym?'Rows 1–2 are identical and share the label +1; rows 3–4 are identical and share −1. So take α₁ = α₂ = a and α₃ = α₄ = c.':'You moved a point, so the rows no longer pair up. The solver still finds the prices; the shortcut is gone.']);
    s.push(['3 · balance',sym?'Σ αᵢyᵢ = a + a − c − c = 0, so c = a: all four prices are equal.':'Σ αᵢyᵢ = '+a.map((v,i)=>(Y[i]>0?'+':'−')+trim(F(v,4))).join(' ')+' = 0 ✓']);
    s.push(['4 · the dual with numbers','The table of yᵢyⱼKᵢⱼ:'+mtx(Q)+(sym?'Every row sums to '+rowsum[0]+', so the double sum is 4 × '+rowsum[0]+' a² = '+4*rowsum[0]+'a². D(a) = 4a − ½·'+4*rowsum[0]+'a² = 4a − '+2*rowsum[0]+'a². D′(a) = 4 − '+4*rowsum[0]+'a = 0 ⇒ a = <b>'+frac(4/(4*rowsum[0]),512)+'</b>.':'The solver maximises Σαᵢ − ½ΣΣαᵢαⱼQᵢⱼ directly.')]);
    s.push(['5 · check α ≥ 0','α = ('+a.map(v=>frac(v,512)).join(', ')+') — '+(a.every(v=>v>1e-9)?'all positive: every point is a support vector.':res.nsv+' support vectors.')]);
    const sv=a.findIndex(v=>v>1e-9), col=K.map(r=>r[sv]); const part=col.reduce((p,v,i)=>p+a[i]*Y[i]*v,0);
    s.push(['6 · b from a support vector','From x'+SUB(sv+1)+' (y = '+(Y[sv]>0?'+1':'−1')+'): Σ αᵢyᵢKᵢ'+SUB(sv+1)+' + b = '+(Y[sv]>0?'1':'−1')+'. The sum is '+nm(trim(F(part,4)))+', so b = <b>'+nm(trim(F(res.b,4)))+'</b>.']);
    const t=[2,1], kt=X.map(p=>(p[0]*t[0]+p[1]*t[1])**2), ft=res.f(t);
    s.push(['7 · classify (2, 1)','Dots with the four points: '+X.map(p=>nm(String(p[0]*2+p[1]))).join(', ')+'; squared: '+kt.join(', ')+'.<br>f(2, 1) = '+kt.map((v,i)=>(i?(Y[i]>0?' + ':' − '):'')+frac(a[i],512)+'·'+v).join('')+' + '+nm(trim(F(res.b,3)))+' = <b>'+nm(trim(F(ft,4)))+'</b> ⇒ class '+(ft>=0?'+1':'−1')+(Math.abs(Math.abs(ft)-1)<1e-9?', exactly on the edge.':'.')]);
    s.push(['8 · see the curve',sym?'f(x) = (1/32)[2(x₁ + 2x₂)² − 2(x₁ − 2x₂)²] = <b>x₁x₂ / 2</b>. The boundary x₁x₂ = 0 is the pair of axes; f = ±1 are the curves x₁x₂ = ±2, through all four points.':'With moved points f no longer simplifies so neatly — but the white curve on the map is f = 0.']);
    rnav.innerHTML=s.map((x,i)=>'<button type="button" aria-pressed="'+(i===rstep)+'" data-i="'+i+'">'+(i+1)+'</button>').join('');
    rsteps.innerHTML=s.map((x,i)=>'<div class="rs'+(i===rstep?' on':'')+'"><h4>'+x[0]+'</h4>'+x[1]+'</div>').join('');
    rnav.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ rstep=+b.dataset.i; recipe(); })); }
  /* ---- the landscape ---- */
  function build(){ const narrow=box.clientWidth<560, r=narrow?8.8:7.2, th=.5, ph=.95;
    return CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),.3+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look:[0,.3,0],fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx); const S=.62, ZS=.32, CL=v=>Math.max(-2.6,Math.min(2.6,v));
        glassFloor(ctx,5.4,{div:24,y:-.9});
        if(!res||!res.ok){ root.add(lab(ctx,'no answer to draw',[0,.3,0],{size:18,color:cssv('critical'),depthTest:false})); return; }
        const f=(a,b)=>CL(res.f([a/S,b/S]));
        const surf=CIN.prim.surface(ctx,f,{x:[-3.3*S,3.3*S],y:[-2.6*S,2.6*S],res:84,zscale:ZS,ramp:[ctx.colors.s2,ctx.colors.s7,ctx.colors.s1],opacity:isLight?.9:.86,wire:false}); lightenSurface(ctx,surf,ZS,[ctx.colors.s2,ctx.colors.s7,ctx.colors.s1]); root.add(surf);
        root.add(liftedContours(ctx,f,[-1,1],-3.3*S,3.3*S,-2.6*S,2.6*S,ZS,hx(K13.edge),{N:90,opacity:.95}));
        root.add(liftedContours(ctx,f,[0],-3.3*S,3.3*S,-2.6*S,2.6*S,ZS,hx('ink'),{N:90,opacity:1}));
        const sea=CIN.prim.glass(ctx,3.3*S*2,2.6*S*2,hx('s6'),isLight?.16:.18); sea.rotation.x=-Math.PI/2; sea.position.y=.004; root.add(sea);
        D.X.forEach((p,i)=>{ const h=CL(res.f(p))*ZS; const b=bead3(ctx,[p[0]*S,h+.06,-p[1]*S],D.Y[i],{r:.07}); root.add(b); if(res.alpha[i]>1e-9){ const rg=ring3(ctx,.13,{tube:.013,color:res.bounded[i]?K13.crit:K13.sv}); rg.position.set(p[0]*S,h+.01,-p[1]*S); root.add(rg); } });
        hint(box,'drag to orbit'); const hd=hud(box); hd.innerHTML='f as a landscape · the glass sea is f = 0 · violet rings are f = ±1'; } }); }
  /* ---- interaction ---- */
  svgDrag(svg,(x,y)=>{ if(!fr) return false; const i=nearestPt(fr,D.X,x,y,20); if(i>=0){ drag=i; return; }
      D.X.push([Math.round(fr.ix(x)*20)/20,Math.round(fr.iy(y)*20)/20]); D.Y.push(addY); pristine=false; refresh(); return false; },
    (x,y)=>{ if(drag<0) return; D.X[drag]=[Math.round(Math.max(fr.X0+.05,Math.min(fr.X1-.05,fr.ix(x)))*20)/20,Math.round(Math.max(fr.Y0+.05,Math.min(fr.Y1-.05,fr.iy(y)))*20)/20]; pristine=false; refresh(); },()=>{ drag=-1; draw(); });
  const setsBar=document.getElementById('pg-sets'), kersBar=document.getElementById('pg-kers');
  function setKer(k){ ker=k; pressOnly(kersBar,kersBar.querySelector('[data-k="'+k+'"]')); document.getElementById('pg-gctl').style.opacity=k==='rbf'?1:.45; }
  setsBar.querySelectorAll('[data-s]').forEach(b=>b.addEventListener('click',()=>{ set=b.dataset.s; D=SETS[set](); pristine=true; rstep=0; pressOnly(setsBar,b); setKer(D.k); lc=D.C; setCtl('pg-c',lc,fmtC); refresh(); }));
  kersBar.querySelectorAll('[data-k]').forEach(b=>b.addEventListener('click',()=>{ setKer(b.dataset.k); refresh(); }));
  document.getElementById('pg-add').querySelectorAll('[data-y]').forEach(b=>b.addEventListener('click',()=>{ addY=+b.dataset.y; document.getElementById('pg-add').querySelectorAll('[data-y]').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false')); }));
  document.getElementById('pg-reset').addEventListener('click',()=>{ D=SETS[set](); pristine=true; refresh(); });
  function fmtC(v){ return v>=3.49?'∞':trim(F(Math.pow(10,v),Math.pow(10,v)<1?2:0)); }
  bindCtl('pg-c',v=>{ lc=v; refresh(); },fmtC);
  bindCtl('pg-g',v=>{ lg=v; if(ker==='rbf') refresh(); },v=>trim(F(Math.pow(10,v),2)));
  tabs(document.getElementById('pg-tabs'),t=>{ tab=t; showTab(document.getElementById('w-playground'),t); if(t==='land'){ if(!ST) ST=mountStage(box,build); else remount(ST); } });
  showTab(document.getElementById('w-playground'),'map'); setKer('poly'); setCtl('pg-c',lc,fmtC); setCtl('pg-g',lg,v=>trim(F(Math.pow(10,v),2)));
  refresh(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  /* self-check: the recipe numbers */
  (function(){ const r=SVM.solve([[1,2],[-1,-2],[1,-2],[-1,2]],[1,1,-1,-1],{kernel:{type:'poly',d:2}}); if(r.alpha.some(a=>Math.abs(a-1/32)>1e-12)||Math.abs(r.b)>1e-12||Math.abs(r.f([2,1])-1)>1e-12) console.warn('U13 recipe: unexpected',r.alpha,r.b);
    console.info('U13 recipe · XNOR with (x·z)²: α = '+r.alpha.map(a=>frac(a)).join(', ')+' · b = '+r.b+' · f(2,1) = '+r.f([2,1])+' · f(−1,3) = '+r.f([-1,3])); })();
})();
