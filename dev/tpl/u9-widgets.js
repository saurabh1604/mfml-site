/* ================= UNIT 9 · local helpers (on top of the house runtime) ================= */
const SUB=n=>String(n).split('').map(c=>'₀₁₂₃₄₅₆₇₈₉'[+c]||c).join('');
const SUP=n=>String(n).replace(/-/g,'−').split('').map(c=>({'−':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'})[c]||c).join('');
const nm=s=>String(s).replace(/-/g,'−');                       /* a real minus sign in readouts */
const F=(v,d)=>nm((+v).toFixed(d==null?2:d));                  /* fixed width, minus sign */
const sci=(v,d)=>nm((+v).toExponential(d==null?2:d));
const errFmt=v=>Math.abs(v)<1e-3&&v!==0?sci(v,2):F(v,4);
const RR=ctx=>{ if(ctx&&ctx.requestRender) ctx.requestRender(); };   /* requestRender is attached after build() returns */
const critHex=()=>CIN.hex(getComputedStyle(document.documentElement).getPropertyValue('--critical').trim());
/* an SVG frame with independent x/y scales (the shared `plane` keeps one scale for both axes) */
function frame(svg,X0,X1,Y0,Y1,o){ o=o||{}; svg.innerHTML='';
  const W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height;
  const L=o.l==null?36:o.l,R=o.r==null?14:o.r,T=o.t==null?18:o.t,B=o.b==null?28:o.b;
  const px=x=>L+(x-X0)/(X1-X0)*(W-L-R), py=y=>H-B-(y-Y0)/(Y1-Y0)*(H-T-B);
  const glow=glo(svg); const defs=svg.querySelector('defs')||el('defs',{},svg);
  const cid='clip-'+(svg.id||'f'); const cp=el('clipPath',{id:cid},defs); el('rect',{x:L,y:T,width:W-L-R,height:H-T-B},cp);
  const g=el('g',{},svg), xs=o.xs||1, ys=o.ys||1, tf='font:500 10px system-ui;fill:var(--ink-muted)';
  const z=v=>Math.abs(v)<1e-9?0:v;
  for(let i=Math.ceil(X0/xs-1e-9);i*xs<=X1+1e-9;i++){ const x=i*xs,X=px(x); el('line',{x1:X,y1:py(Y0),x2:X,y2:py(Y1),stroke:'var(--grid)','stroke-width':1},g); if(o.xt!==false) txt(svg,X,H-B+13,o.xf?o.xf(z(x)):nm(fmt(z(x),2)),tf,'middle'); }
  for(let i=Math.ceil(Y0/ys-1e-9);i*ys<=Y1+1e-9;i++){ const y=i*ys,Y=py(y); el('line',{x1:px(X0),y1:Y,x2:px(X1),y2:Y,stroke:'var(--grid)','stroke-width':1},g); if(o.yt!==false) txt(svg,L-5,Y+3.5,o.yf?o.yf(z(y)):nm(fmt(z(y),2)),tf,'end'); }
  if(Y0<=0&&Y1>=0) el('line',{x1:px(X0),y1:py(0),x2:px(X1),y2:py(0),stroke:'var(--axis)','stroke-width':1.5},g);
  if(X0<=0&&X1>=0) el('line',{x1:px(0),y1:py(Y0),x2:px(0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.5},g);
  el('rect',{x:L,y:T,width:W-L-R,height:H-T-B,rx:6,fill:'none',stroke:'var(--line, var(--ring))',opacity:.7},g);
  const cy=v=>Math.max(py(Y1),Math.min(py(Y0),v)), cx=v=>Math.max(px(X0),Math.min(px(X1),v));
  return {px,py,cx,cy,glow,clip:'url(#'+cid+')',W,H,L,R,T,B,X0,X1,Y0,Y1,inside:(x,y)=>x>=X0&&x<=X1&&y>=Y0&&y<=Y1}; }
/* a clip rectangle for a `plane` (which has none of its own) */
function planeClip(p,X0,X1,Y0,Y1){ const defs=p.svg.querySelector('defs')||el('defs',{},p.svg); const id='pc-'+(p.svg.id||'p'); if(!defs.querySelector('#'+id)){ const cp=el('clipPath',{id},defs); el('rect',{x:p.px(X0),y:p.py(Y1),width:p.px(X1)-p.px(X0),height:p.py(Y0)-p.py(Y1)},cp); } return 'url(#'+id+')'; }
/* a glowing straight segment: an axis-aligned line under the glow filter vanishes (zero-height filter region) — fake the halo with a wide translucent underlay */
function glowLine(parent,x1,y1,x2,y2,color,w,glow,extra){ const g=el('g',{},parent);
  if(glow) el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':w*3.2,'stroke-linecap':'round',opacity:.22},g);
  const at=Object.assign({x1,y1,x2,y2,stroke:color,'stroke-width':w,'stroke-linecap':'round'},extra||{}); el('line',at,g); return g; }
/* a glowing polyline (halo underlay + crisp stroke) */
function glowPath(parent,d,color,w,glow,extra){ const g=el('g',{},parent);
  if(glow) el('path',{d,stroke:color,'stroke-width':w*3,fill:'none','stroke-linejoin':'round','stroke-linecap':'round',opacity:.2},g);
  el('path',Object.assign({d,stroke:color,'stroke-width':w,fill:'none','stroke-linejoin':'round','stroke-linecap':'round'},extra||{}),g); return g; }
/* in the light theme the surface ramp is washed toward white so the landscape reads on a pale page */
function lightenSurface(ctx,surf,zs,ramp){ if(!ctx.isLight) return; const T=ctx.THREE, geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color, {zmin,zmax}=surf.userData;
  const c=ctx.colors, a=ramp||[c.s1,c.s7,c.s2], white=new T.Color(1,1,1);
  for(let i=0;i<pos.count;i++){ const t=(pos.getY(i)/zs-zmin)/((zmax-zmin)||1); const k=new T.Color(CIN.ramp(t,a[0],a[1],a[2])).lerp(white,.42).convertSRGBToLinear(); col.setXYZ(i,k.r,k.g,k.b); } col.needsUpdate=true; }
function clearGroup(g){ while(g.children.length){ const c=g.children[g.children.length-1]; g.remove(c);
  c.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ (Array.isArray(m.material)?m.material:[m.material]).forEach(x=>{ if(x.map&&x.map!==_spark) x.map.dispose(); x.dispose(); }); } }); } }
/* a soft glowing halo sprite (additive in the dark theme; plain alpha on a pale page) */
function haloSprite(ctx,color,size){ const T=ctx.THREE; const m=new T.SpriteMaterial({map:sparkTex(T),color,transparent:true,opacity:ctx.isLight?.32:.65,blending:ctx.isLight?T.NormalBlending:T.AdditiveBlending,depthWrite:false,depthTest:false}); const s=new T.Sprite(m); s.scale.set(size,size,1); s.renderOrder=14; return s; }
/* a glowing polyline through 3D points: one lit tube per segment (no smoothing — zig-zags must stay sharp) + small beads */
function polyTube(ctx,pts,color,r,beads){ const g=new ctx.THREE.Group(); for(let i=0;i+1<pts.length;i++) g.add(tube(ctx,pts[i],pts[i+1],color,r));
  if(beads!==false) pts.forEach(p=>g.add(CIN.prim.dot(ctx,p,color,r*1.9))); return g; }
/* eigen-decomposition of the symmetric 2×2 [[a,b],[b,c]] */
function eig2(a,b,c){ const tr=a+c, disc=Math.sqrt(((a-c)/2)*((a-c)/2)+b*b); const l1=tr/2+disc, l2=tr/2-disc;
  let v1=Math.abs(b)>1e-12?[b,l1-a]:(a>=c?[1,0]:[0,1]); const n=Math.hypot(v1[0],v1[1])||1; v1=[v1[0]/n,v1[1]/n]; return {l1,l2,v1,v2:[-v1[1],v1[0]]}; }
function pressOnly(bar,btn){ bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===btn?'true':'false')); }
function selectTab(bar,key){ bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x.dataset.t===key?'true':'false')); }
function setCtl(id,v,d){ const r=document.getElementById(id), o=document.getElementById(id+'-o'); if(r) r.value=v; if(o) o.textContent=typeof d==='function'?d(v):nm(fmt(v,d==null?2:d)); }
const angleDeg=(u,v)=>{ const nu=Math.hypot(u[0],u[1]), nv=Math.hypot(v[0],v[1]); if(nu<1e-12||nv<1e-12) return NaN; return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/(nu*nv))))*180/Math.PI; };
/* find the roots of g on [lo,hi] by scanning sign changes then bisecting */
function rootsOf(g,lo,hi,N){ N=N||800; const out=[]; let x0=lo,g0=g(lo); for(let i=1;i<=N;i++){ const x1=lo+(hi-lo)*i/N,g1=g(x1); if(g0===0) out.push(x0); else if((g0<0)!==(g1<0)){ let a=x0,b=x1,ga=g0; for(let k=0;k<60;k++){ const m=(a+b)/2,gm=g(m); if((gm<0)===(ga<0)){a=m;ga=gm;} else b=m; } out.push((a+b)/2); } x0=x1; g0=g1; } return out; }

/* ================= W1 · THE FITTING BOWL (three.js + side chart) ================= */
(function(){
  const box=document.getElementById('ft-3d'),side=document.getElementById('ft-svg'),read=document.getElementById('ft-read'),verd=document.getElementById('ft-verdict');
  if(!box) return;
  const X=[1,2,3,4], Y=[3.1,4.9,7.3,9.1], N=4;
  const L=(a,b)=>{ let s=0; for(let i=0;i<N;i++){ const r=Y[i]-(a*X[i]+b); s+=r*r; } return s; };
  const grad=(a,b)=>{ let ga=0,gb=0; for(let i=0;i<N;i++){ const r=Y[i]-(a*X[i]+b); ga-=2*X[i]*r; gb-=2*r; } return [ga,gb]; };
  /* the exact answer by the normal equations, and the Hessian's eigenvalues */
  let Sx=0,Sy=0,Sxx=0,Sxy=0; for(let i=0;i<N;i++){ Sx+=X[i]; Sy+=Y[i]; Sxx+=X[i]*X[i]; Sxy+=X[i]*Y[i]; }
  const aS=(N*Sxy-Sx*Sy)/(N*Sxx-Sx*Sx), bS=(Sy-aS*Sx)/N, LS=L(aS,bS);
  const E=eig2(2*Sxx,2*Sx,2*N), LIM=2/E.l1;
  const A0=-1,A1=5,B0=-4,B1=6, ac=2,bc=1, SA=3.2/(A1-A0), SB=3.2/(B1-B0);
  let Lmax=0; [[A0,B0],[A0,B1],[A1,B0],[A1,B1]].forEach(([a,b])=>Lmax=Math.max(Lmax,L(a,b)));
  const ZS=1.5/Lmax, P3=(a,b,z)=>[(a-ac)*SA,z*ZS,-(b-bc)*SB];
  let a=0,b=0,g=0.02,K=20,path=[[0,0]],lastDL=null,diverged=false,sc=null,hudEl=null,anim=null,run=0,ST=null;
  const inDom=(a,b)=>a>=A0&&a<=A1&&b>=B0&&b<=B1, clampD=(a,b)=>[Math.max(A0,Math.min(A1,a)),Math.max(B0,Math.min(B1,b))];
  function build(){
    sc=null; const narrow=box.clientWidth<560;
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[4.0,3.4,5.0]:[3.4,2.8,4.3],look:[0,.45,0],fov:34},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        const fs=(u,v)=>L(u/SA+ac,v/SB+bc);
        const surf=CIN.prim.surface(ctx,fs,{x:[-1.6,1.6],y:[-1.6,1.6],res:72,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:.92}); lightenSurface(ctx,surf,ZS); root.add(surf);
        const floorY=-.12;
        const grid=CIN.prim.grid(ctx,3.8,16,hx('grid'),{opacity:isLight?.5:.35}); grid.position.y=floorY; root.add(grid);
        root.add(liftedContours(ctx,fs,[0.5,2,5,10,20,40,80,160],-1.6,1.6,-1.6,1.6,ZS,hx('ink2'),{N:72}));
        [['a →',[1.9,.22,1.45]],['b →',[-1.45,.22,-1.9]]].forEach(([t,p])=>root.add(CIN.prim.label(ctx,t,p,{size:24,color:colors.muted,bg:false,depthTest:false})));
        const best=overlay(CIN.prim.dot(ctx,P3(aS,bS,LS),hx('s3'),.045)); root.add(best);
        root.add(CIN.prim.label(ctx,'(2.04, 1)',[best.position.x,best.position.y+.16,best.position.z],{size:18,color:colors.s3,bg:false,depthTest:false}));
        const walker=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.055),12); root.add(walker);
        const halo=haloSprite(ctx,hx('s4'),.42); root.add(halo);
        const pole=tube(ctx,[0,0,0],[0,1,0],hx('s4'),.006,.55); root.add(pole);
        const pathG=new THREE.Group(); root.add(pathG);
        sc={THREE,ctx,root,colors,isLight,hx,walker,halo,pole,pathG,floorY};
        hudEl=hud(box); hint(box,'drag to orbit');
        paint(); paintPath();
      },
      update(){ return false; }
    });
    if(handle) grab(handle,()=>false,()=>{});
    return handle;
  }
  function paint(cur){
    if(!sc) return; const {walker,halo,pole,ctx,floorY}=sc; const [ca,cb]=cur||[a,b]; const [qa,qb]=clampD(ca,cb); const on=inDom(ca,cb);
    const p=P3(qa,qb,L(qa,qb)); walker.position.set(p[0],p[1]+.01,p[2]); halo.position.copy(walker.position);
    walker.material.opacity=on?1:.35; halo.material.opacity=(ctx.isLight?.32:.65)*(on?1:.3);
    aimTube(ctx.THREE,pole,[p[0],floorY,p[2]],[p[0],p[1],p[2]]);
    const gr=grad(ca,cb); if(hudEl) hudEl.innerHTML=`L = <b>${F(L(ca,cb),3)}</b> · ∇L = (<b>${F(gr[0],1)}</b>, <b>${F(gr[1],1)}</b>)`;
    RR(ctx);
  }
  function paintPath(){
    if(!sc) return; clearGroup(sc.pathG); const pts=path.filter(p=>inDom(p[0],p[1])).map(p=>{ const q=P3(p[0],p[1],L(p[0],p[1])); q[1]+=.008; return q; });
    if(pts.length>=2) sc.pathG.add(polyTube(sc.ctx,pts,sc.hx('s3'),.02)); RR(sc.ctx);
  }
  function drawSide(){
    const p=frame(side,0,5,0,11,{l:30,r:12,t:26,b:24,xs:1,ys:2}); const glow=p.glow;
    txt(side,p.L+4,p.T-9,`ŷ = ${F(a,2)}x ${b<0?'−':'+'} ${F(Math.abs(b),2)} · L = ${F(L(a,b),3)}`,'font:700 10.5px system-ui;fill:var(--s4)');
    el('line',{x1:p.px(0),y1:p.py(b),x2:p.px(5),y2:p.py(a*5+b),stroke:'var(--s4)','stroke-width':2.6,'stroke-linecap':'round','clip-path':p.clip,filter:glow||'none'},side);
    for(let i=0;i<N;i++){ const yh=a*X[i]+b, r=Y[i]-yh;
      el('line',{x1:p.px(X[i]),y1:p.py(Y[i]),x2:p.px(X[i]),y2:p.cy(p.py(yh)),stroke:'var(--critical)','stroke-width':4,'stroke-linecap':'round',opacity:.9},side);
      glowDot(side,p.px(X[i]),p.py(Y[i]),4.5,'var(--s1)',glow);
      const ly=Math.max(p.T+10,Math.min(p.H-p.B-4,(p.py(Y[i])+p.cy(p.py(yh)))/2+4));
      txt(side,p.px(X[i])+7,ly,'r = '+F(r,2),'font:600 9px system-ui;fill:var(--critical)'); }
    txt(side,p.W-p.R-2,p.H-p.B-6,'x','font:600 10px system-ui;fill:var(--ink-muted)','end');
  }
  function draw(){
    const gr=grad(a,b), gn=Math.hypot(gr[0],gr[1]), Lv=L(a,b);
    read.innerHTML=`a = <b>${F(a,3)}</b>, b = <b>${F(b,3)}</b><br>L(a,b) = <b>${Lv<1e-3?sci(Lv,2):F(Lv,3)}</b><br>∇L = (−2Σxᵢrᵢ, −2Σrᵢ) = (<b>${F(gr[0],2)}</b>, <b>${F(gr[1],2)}</b>)<br>best fit: a* = <b>${nm(fmt(aS,3))}</b>, b* = <b>${nm(fmt(bS,3))}</b>, L* = <b>${nm(fmt(LS,3))}</b><br>stiff direction λ₁ ≈ ${F(E.l1,1)} · flat direction λ₂ ≈ ${F(E.l2,2)} · speed limit 2/λ₁ ≈ ${F(LIM,3)}`;
    if(diverged){ verd.className='verdict bad'; verd.textContent=`✗ γ = ${fmt(g,3)} is above 2/λmax ≈ 0.030 — the steps grow instead of shrinking (diverging)`; }
    else if(gn<0.05){ verd.className='verdict info'; verd.textContent='at the bottom: ∇L ≈ 0'; }
    else if(lastDL!=null&&lastDL<0){ verd.className='verdict good'; verd.textContent='✓ L is falling — the line is tilting toward the data'; }
    else if(lastDL!=null){ verd.className='verdict bad'; verd.textContent='✗ that step raised L — the step size is too big for the stiff direction'; }
    else { verd.className='verdict info'; verd.textContent=`∇L points uphill — ▶ takes ${K} steps the other way`; }
    drawSide(); paint();
  }
  function sync(){ setCtl('ft-a',Math.max(A0,Math.min(A1,a)),2); setCtl('ft-b',Math.max(B0,Math.min(B1,b)),2); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function setPoint(na,nb){ stop(); a=na; b=nb; path=[[a,b]]; lastDL=null; diverged=false; sync(); paintPath(); draw(); }
  function play(){ stop(); const tok=run; let k=0; diverged=false; lastDL=null;
    const step=()=>{ if(tok!==run) return; if(k>=K){ draw(); return; }
      const gr=grad(a,b), na=a-g*gr[0], nb=b-g*gr[1], a0=a,b0=b,L0=L(a,b);
      if(!isFinite(na)||!isFinite(nb)||Math.abs(na)>50||Math.abs(nb)>50){ diverged=true; draw(); return; }
      anim=tween(120,u=>paint([a0+(na-a0)*u,b0+(nb-b0)*u]),()=>{ a=na; b=nb; k++; lastDL=L(a,b)-L0; path.push([a,b]); sync(); paintPath(); draw(); step(); }); };
    step(); }
  document.getElementById('ft-play').addEventListener('click',play);
  document.getElementById('ft-reset').addEventListener('click',()=>setPoint(0,0));
  bindCtl('ft-a',v=>{ stop(); a=v; path=[[a,b]]; lastDL=null; diverged=false; paintPath(); draw(); })();
  bindCtl('ft-b',v=>{ stop(); b=v; path=[[a,b]]; lastDL=null; diverged=false; paintPath(); draw(); })();
  bindCtl('ft-g',v=>{ g=v; draw(); },v=>fmt(v,3))();
  bindCtl('ft-k',v=>{ K=v|0; draw(); },v=>String(v|0))();
  const PRE={origin:[0,0],far:[4,-3],best:[aS,bS]}, bar=document.getElementById('ft-presets');
  bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ const P=PRE[btn.dataset.p]; if(!P) return; pressOnly(bar,btn); setPoint(P[0],P[1]); }));
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W2 · THE FLAT-SPOT PROBER ================= */
(function(){
  const box=document.getElementById('w-flat'),svg=document.getElementById('fp-svg'),read=document.getElementById('fp-read'),verd=document.getElementById('fp-verdict');
  if(!box||!svg) return;
  const sX=document.getElementById('fp-x');
  const FN={
    quartic:{name:'l(x) = x⁴ + 7x³ + 5x² − 17x + 3',X:[-5.6,1.7],x0:-1.3,f:x=>x*x*x*x+7*x*x*x+5*x*x-17*x+3,d:x=>4*x*x*x+21*x*x+10*x-17,d2:x=>12*x*x+42*x+10},
    cubic:{name:'f(x) = 2x³ − 9x² + 12x + 5',X:[-0.6,3.6],x0:0.3,f:x=>2*x*x*x-9*x*x+12*x+5,d:x=>6*x*x-18*x+12,d2:x=>12*x-18},
    bumpy:{name:'f(x) = sin 3x + 0.3x²',X:[-3.2,3.2],x0:2.4,f:x=>Math.sin(3*x)+0.3*x*x,d:x=>3*Math.cos(3*x)+0.6*x,d2:x=>-9*Math.sin(3*x)+0.6}};
  let tab='quartic',x=-1.3,g=0.02,anim=null,run=0,walked=false,flew=false,trail=[],P=null,probe=null;
  const T=()=>FN[tab];
  function stat(){ const t=T(); return rootsOf(t.d,t.X[0],t.X[1]).map(r=>({x:r,f:t.f(r),d2:t.d2(r),kind:t.d2(r)>0?'min':(t.d2(r)<0?'max':'flat')})); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function draw(){
    const t=T(), [X0,X1]=t.X, S=stat();
    const vals=[]; for(let i=0;i<=200;i++) vals.push(t.f(X0+(X1-X0)*i/200)); let lo=Math.min(...vals),hi=Math.max(...vals); const span=(hi-lo)||1; lo-=span*.14; hi+=span*.14;
    const ys=[1,2,5,10,20,50].find(s=>(hi-lo)/s<=8)||50;
    P=frame(svg,X0,X1,lo,hi,{l:40,r:14,t:30,b:30,xs:1,ys}); const glow=P.glow, p=P;
    let d=''; for(let i=0;i<=400;i++){ const xx=X0+(X1-X0)*i/400; d+=(i?'L':'M')+p.px(xx).toFixed(1)+','+p.py(t.f(xx)).toFixed(1); }
    el('path',{d,stroke:'var(--s1)','stroke-width':3,fill:'none','stroke-linecap':'round','stroke-linejoin':'round',filter:glow||'none'},svg);
    txt(svg,p.L+6,p.T-10,t.name,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    /* stationary points, coloured by type */
    S.forEach(s=>{ const col=s.kind==='min'?'var(--s3)':(s.kind==='max'?'var(--s2)':'var(--ink-muted)');
      el('line',{x1:p.px(s.x),y1:p.py(s.f),x2:p.px(s.x),y2:p.py(lo),stroke:col,'stroke-width':1,'stroke-dasharray':'2 3',opacity:.5},svg);
      glowDot(svg,p.px(s.x),p.py(s.f),5,col,glow);
      txt(svg,p.px(s.x),p.py(s.f)+(s.kind==='max'?-11:17),s.kind+' · x = '+F(s.x,2),`font:700 9.5px system-ui;fill:${col}`,'middle'); });
    /* the trail of a walk */
    trail.forEach(tx=>el('circle',{cx:p.px(tx),cy:p.py(t.f(tx)),r:3,fill:'var(--s4)',opacity:.35},svg));
    /* the probe: tangent + dot + uphill arrow under it */
    probe=el('g',{},svg);
    const tg=el('g',{'clip-path':p.clip},probe); const tl=el('line',{x1:0,y1:0,x2:0,y2:0,stroke:'var(--s4)','stroke-width':2.4,'stroke-linecap':'round',opacity:.9},tg);
    const dot=glowDot(probe,0,0,6,'var(--s4)',glow);
    const ag=el('g',{},probe); const lab=txt(probe,0,0,'','font:700 10px system-ui;fill:var(--s2)','middle');
    probe.place=xx=>{ const fx=t.f(xx), dx=t.d(xx), Lh=(X1-X0)*.06; xx=Math.max(X0,Math.min(X1,xx));
      tl.setAttribute('x1',p.px(xx-Lh)); tl.setAttribute('y1',p.py(fx-Lh*dx)); tl.setAttribute('x2',p.px(xx+Lh)); tl.setAttribute('y2',p.py(fx+Lh*dx));
      dot.setAttribute('transform',`translate(${p.px(xx)},${p.cy(p.py(fx))})`);
      ag.innerHTML=''; const yb=p.H-p.B-14, len=Math.min(70,14+10*Math.sqrt(Math.abs(dx))), sg=dx>=0?1:-1;
      if(Math.abs(dx)>1e-3) edge(ag,p.px(xx),yb,p.cx(p.px(xx)+sg*len),yb,'var(--s2)',2.4,glow);
      lab.setAttribute('x',p.cx(p.px(xx)+sg*(len/2))); lab.setAttribute('y',yb-7); lab.textContent=Math.abs(dx)>1e-3?'uphill · f′ = '+F(dx,2):'flat · f′ ≈ 0'; };
    probe.place(x);
    /* readout */
    const fx=t.f(x), dx=t.d(x), d2=t.d2(x);
    const hintS=Math.abs(dx)<1e-3?'flat':(dx>0?'→ downhill is to the left':'→ downhill is to the right');
    read.innerHTML=`f(x) = <b>${F(fx,3)}</b><br>f′(x) = <b>${F(dx,3)}</b> ${hintS}<br>f″(x) = <b>${F(d2,2)}</b><br>stationary points: ${S.map(s=>`x = <b>${F(s.x,3)}</b> (${s.kind}, f = ${F(s.f,2)})`).join(', ')}`;
    if(flew){ verd.className='verdict bad'; verd.textContent=`✗ the step γ·f′ was so big the probe flew out of view — γ = ${fmt(g,3)} is too large for this curvature`; }
    else if(Math.abs(dx)<1e-3){ if(tab==='bumpy'&&walked){ verd.className='verdict info'; verd.textContent='landed in the nearest valley — gradient descent finds a local minimum, not the global one'; }
      else if(d2>0){ verd.className='verdict good'; verd.textContent='✓ flat, and f″ > 0 — a valley (local minimum)'; }
      else { verd.className='verdict bad'; verd.textContent='✗ flat, but f″ < 0 — a hilltop: one nudge and descent leaves'; } }
    else { verd.className='verdict info'; verd.textContent=`slope ${F(dx,2)}: downhill is to the ${dx>0?'left':'right'}`; }
  }
  function play(){ stop(); const tok=run, t=T(), [X0,X1]=t.X; let k=0; trail=[]; walked=true; flew=false; draw();
    const step=()=>{ if(tok!==run) return; const dx=t.d(x); if(k>=40||Math.abs(dx)<1e-3){ draw(); return; }
      const x0=x, x1=x-g*dx; if(!isFinite(x1)||x1<X0||x1>X1){ flew=true; draw(); return; }
      trail.push(x0); anim=tween(160,u=>probe&&probe.place(x0+(x1-x0)*u),()=>{ x=x1; k++; setCtl('fp-x',x,2); draw(); step(); }); };
    step(); }
  document.getElementById('fp-play').addEventListener('click',play);
  bindCtl('fp-x',v=>{ stop(); x=v; trail=[]; walked=false; flew=false; draw(); })();
  bindCtl('fp-g',v=>{ g=v; draw(); },v=>fmt(v,3))();
  tabs(document.getElementById('fp-tabs'),k=>{ stop(); tab=k; const t=T(); sX.min=t.X[0]; sX.max=t.X[1]; x=t.x0; setCtl('fp-x',x,2); trail=[]; walked=false; flew=false; draw(); });
  draw();
})();

/* ================= W3 · THE DESCENT STAGE (three.js) ================= */
(function(){
  const box=document.getElementById('ds-3d'),read=document.getElementById('ds-read'),verd=document.getElementById('ds-verdict');
  if(!box) return;
  const sG=document.getElementById('ds-g'),oG=document.getElementById('ds-g-o');
  const PRE={lecture:{A:[[2,1],[1,20]],b:[-5,-3],x0:[-3,-1],X:[-4,5.5],Y:[-2.6,2.2]},round:{A:[[2,0],[0,2]],b:[-5,-3],x0:[-3,-1],X:[-4,5.5],Y:[-2.6,4]},stretch:{A:[[2,0],[0,6]],b:[0,0],x0:[2,2],X:[-2.6,2.6],Y:[-2.6,2.6]}};
  let key='lecture',mode='fixed',g=0.05,K=20,x=[-3,-1],path=[[-3,-1]],turns=[],gUsed=null,sc=null,hudEl=null,anim=null,run=0,ST=null,diverged=false;
  const Q=()=>PRE[key];
  const f=v=>{ const {A,b}=Q(); return .5*(A[0][0]*v[0]*v[0]+2*A[0][1]*v[0]*v[1]+A[1][1]*v[1]*v[1])+b[0]*v[0]+b[1]*v[1]; };
  const grad=v=>{ const {A,b}=Q(); return [A[0][0]*v[0]+A[0][1]*v[1]+b[0],A[0][1]*v[0]+A[1][1]*v[1]+b[1]]; };
  const xstar=()=>{ const {A,b}=Q(); const det=A[0][0]*A[1][1]-A[0][1]*A[0][1]; return [-( A[1][1]*b[0]-A[0][1]*b[1])/det, -(-A[0][1]*b[0]+A[0][0]*b[1])/det]; };
  const eig=()=>{ const {A}=Q(); return eig2(A[0][0],A[0][1],A[1][1]); };
  const gAg=v=>{ const {A}=Q(); return v[0]*(A[0][0]*v[0]+A[0][1]*v[1])+v[1]*(A[0][1]*v[0]+A[1][1]*v[1]); };
  const exactG=v=>{ const gg=v[0]*v[0]+v[1]*v[1], d=gAg(v); return d>1e-12?gg/d:0; };
  function geom(){ const {X,Y}=Q(); const cx=(X[0]+X[1])/2, cy=(Y[0]+Y[1])/2, SX=3.2/Math.max(X[1]-X[0],Y[1]-Y[0]); return {cx,cy,SX}; }
  function build(){
    sc=null; const narrow=box.clientWidth<560, {X,Y}=Q(), {cx,cy,SX}=geom(), xs=xstar(), fmin=f(xs);
    const fs=(u,v)=>f([u/SX+cx,v/SX+cy]), U0=(X[0]-cx)*SX,U1=(X[1]-cx)*SX,V0=(Y[0]-cy)*SX,V1=(Y[1]-cy)*SX;
    let zmax=-Infinity; for(let i=0;i<=40;i++)for(let j=0;j<=40;j++) zmax=Math.max(zmax,fs(U0+(U1-U0)*i/40,V0+(V1-V0)*j/40));
    const ZS=1.6/((zmax-fmin)||1), floorY=fmin*ZS-.16, P3=(px,py,z)=>[(px-cx)*SX,z*ZS,-(py-cy)*SX];
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[3.4,2.8,4.2]:[2.9,2.4,3.6],look:[0,.35,0],fov:34},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        const grid=CIN.prim.grid(ctx,4,16,hx('grid'),{opacity:isLight?.5:.35}); grid.position.y=floorY; root.add(grid);
        const surf=CIN.prim.surface(ctx,fs,{x:[U0,U1],y:[V0,V1],res:72,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:.9}); lightenSurface(ctx,surf,ZS); root.add(surf);
        const lv=[]; for(let i=1;i<=10;i++) lv.push(fmin+(zmax-fmin)*Math.pow(i/11,2)); root.add(liftedContours(ctx,fs,lv,U0,U1,V0,V1,ZS,hx('ink2'),{N:72}));
        [['x →',[U1+.3,floorY,-V0+.1]],['y →',[U0-.2,floorY,-V1-.3]]].forEach(([t,p])=>root.add(CIN.prim.label(ctx,t,p,{size:24,color:colors.muted,bg:false,depthTest:false})));
        const sp=P3(xs[0],xs[1],fmin); const star=overlay(CIN.prim.dot(ctx,sp,hx('s3'),.05)); root.add(star); root.add(tube(ctx,[sp[0],floorY,sp[2]],sp,hx('s3'),.007,.6));
        root.add(CIN.prim.label(ctx,'x*',[sp[0],sp[1]+.18,sp[2]],{size:20,color:colors.s3,bg:false,depthTest:false}));
        const walker=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.06),12); root.add(walker);
        const halo=haloSprite(ctx,hx('s4'),.5); root.add(halo);
        const gArr=overlay(CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s2'),{radius:.022,head:.14}),11), sArr=overlay(CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s3'),{radius:.022,head:.14}),11); root.add(gArr,sArr);
        const pathG=new THREE.Group(); root.add(pathG); const lab=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,walker,halo,gArr,sArr,pathG,lab,P3,SX,ZS,floorY};
        hudEl=hud(box); hint(box,'drag to orbit');
        paint(); paintPath();
      },
      update(){ return false; }
    });
    if(handle) grab(handle,()=>false,()=>{});
    return handle;
  }
  function paint(cur,k){
    if(!sc) return; const v=cur||x, {walker,halo,gArr,sArr,P3,SX,ctx,lab}=sc; const p=P3(v[0],v[1],f(v)); walker.position.set(p[0],p[1]+.012,p[2]); halo.position.copy(walker.position);
    const gr=grad(v), gn=Math.hypot(gr[0],gr[1]);
    if(gn>1e-4){ const L=Math.min(1,.35*Math.sqrt(gn)), d=[gr[0]/gn*L,gr[1]/gn*L]; gArr.visible=true; gArr.userData.set([p[0],p[1]+.03,p[2]],[p[0]+d[0],p[1]+.03,p[2]-d[1]]);
      const gu=mode==='exact'?exactG(gr):g; const st=[-gu*gr[0]*SX,-gu*gr[1]*SX]; const sl=Math.hypot(st[0],st[1]); const cap=sl>1.5?1.5/sl:1;
      sArr.visible=sl>.02; if(sArr.visible) sArr.userData.set([p[0],p[1]+.03,p[2]],[p[0]+st[0]*cap,p[1]+.03,p[2]-st[1]*cap]); }
    else { gArr.visible=false; sArr.visible=false; }
    const kk=k==null?path.length-1:k; lab.set(`k = ${kk}`,[p[0],p[1]+.24,p[2]],{size:18,color:sc.colors.s4,bg:false,depthTest:false});
    if(hudEl) hudEl.innerHTML=`k = <b>${kk}</b> · f = <b>${F(f(v),3)}</b> · |∇f| = <b>${F(gn,3)}</b>`;
    RR(ctx);
  }
  function paintPath(){ if(!sc) return; clearGroup(sc.pathG); const pts=path.map(p=>{ const q=sc.P3(p[0],p[1],f(p)); q[1]+=.01; return q; }); if(pts.length>=2) sc.pathG.add(polyTube(sc.ctx,pts,sc.hx('s3'),.02)); RR(sc.ctx); }
  function draw(){
    const gr=grad(x), xs=xstar(), E=eig(), fs=f(xs), gu=mode==='exact'?exactG(gr):g, k=path.length-1;
    let s=`x${SUB(k)} = (<b>${F(x[0],3)}</b>, <b>${F(x[1],3)}</b>)<br>∇f = Ax${SUB(k)} + b = (<b>${F(gr[0],3)}</b>, <b>${F(gr[1],3)}</b>)<br>`;
    if(mode==='exact'){ const gg=gr[0]*gr[0]+gr[1]*gr[1]; s+=`γ* = gᵀg/gᵀAg = ${F(gg,3)}/${F(gAg(gr),3)} = <b>${F(gu,4)}</b>`; if(turns.length) s+=` · turn = <b>${F(turns[turns.length-1],1)}°</b>`; s+='<br>'; }
    else s+=`γ used = <b>${fmt(g,3)}</b><br>`;
    s+=`f(x${SUB(k)}) = <b>${F(f(x),3)}</b><br>x* = −A⁻¹b = (<b>${F(xs[0],3)}</b>, <b>${F(xs[1],3)}</b>), f* = <b>${F(fs,3)}</b><br>λ₁ = <b>${F(E.l1,3)}</b>, λ₂ = <b>${F(E.l2,3)}</b>`;
    if(mode==='fixed') s+=` · factor per step: |1 − γλ₁| = <b>${F(Math.abs(1-g*E.l1),3)}</b>, |1 − γλ₂| = <b>${F(Math.abs(1-g*E.l2),3)}</b>`;
    read.innerHTML=s;
    const lim=2/E.l1;
    if(mode==='fixed'){
      if(g>lim+1e-9){ verd.className='verdict bad'; verd.textContent=`✗ γ > 2/λ₁ = ${F(lim,4)} — diverging`; }
      else if(1-g*E.l1<-0.3){ verd.className='verdict info'; verd.textContent='γ close to 2/λ₁: the stiff direction overshoots and bounces (zig-zag)'; }
      else if(1-g*E.l2>0.95){ verd.className='verdict info'; verd.textContent=`γλ₂ = ${F(g*E.l2,3)} is tiny: the flat direction crawls`; }
      else { verd.className='verdict good'; verd.textContent='✓ every direction shrinks: |1−γλ| < 1 for both eigenvalues'; }
    } else { verd.className='verdict good'; verd.textContent='✓ each step turns exactly 90° — the new gradient is perpendicular to the last direction'+(turns.length?` (turn = ${F(turns[turns.length-1],1)}°)`:''); }
    if(diverged){ verd.className='verdict bad'; verd.textContent=`✗ diverging: γ = ${fmt(g,3)} > 2/λ₁ = ${F(lim,4)} — |x| passed 40, run stopped`; }
    paint();
  }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function reset(){ stop(); x=Q().x0.slice(); path=[x.slice()]; turns=[]; diverged=false; paintPath(); draw(); }
  function play(){ stop(); const tok=run; let k=0; diverged=false;
    const step=()=>{ if(tok!==run) return; if(k>=K){ draw(); return; }
      const gr=grad(x), gn=Math.hypot(gr[0],gr[1]); if(gn<1e-9){ draw(); return; }
      const gu=mode==='exact'?exactG(gr):g, nx=[x[0]-gu*gr[0],x[1]-gu*gr[1]], x0=x.slice();
      if(!isFinite(nx[0])||!isFinite(nx[1])||Math.hypot(nx[0],nx[1])>40){ diverged=true; draw(); return; }
      if(path.length>=2){ const pv=path[path.length-2]; turns.push(angleDeg([x0[0]-pv[0],x0[1]-pv[1]],[nx[0]-x0[0],nx[1]-x0[1]])); }
      anim=tween(140,u=>paint([x0[0]+(nx[0]-x0[0])*u,x0[1]+(nx[1]-x0[1])*u],path.length-1),()=>{ x=nx; k++; path.push(x.slice()); paintPath(); draw(); step(); }); };
    step(); }
  document.getElementById('ds-play').addEventListener('click',play);
  document.getElementById('ds-reset').addEventListener('click',reset);
  bindCtl('ds-g',v=>{ g=v; draw(); },v=>fmt(v,3))();
  bindCtl('ds-k',v=>{ K=v|0; draw(); },v=>String(v|0))();
  tabs(document.getElementById('ds-tabs'),t=>{ mode=t; sG.disabled=mode==='exact'; oG.textContent=mode==='exact'?'auto':fmt(g,3); reset(); });
  const bar=document.getElementById('ds-presets');
  bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ if(!PRE[btn.dataset.p]) return; pressOnly(bar,btn); stop(); key=btn.dataset.p; x=Q().x0.slice(); path=[x.slice()]; turns=[]; diverged=false; remount(ST); draw(); }));
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W4 · THE STEP-SIZE DIAL ================= */
(function(){
  const box=document.getElementById('w-step'),svg=document.getElementById('st-svg'),read=document.getElementById('st-read'),verd=document.getElementById('st-verdict');
  if(!box||!svg) return;
  const sG=document.getElementById('st-g');
  let tab='one',lam=2,g=0.3,l1=20,l2=2,shown=99,anim=null,run=0;
  const X0=1.8, NS1=12, NS2=16;
  const iters1=()=>{ const f=1-g*lam, xs=[X0]; for(let k=0;k<NS1;k++) xs.push(xs[k]*f); return xs; };
  const iters2=()=>{ const f1=1-g*l1,f2=1-g*l2, ps=[[X0,X0]]; for(let k=0;k<NS2;k++) ps.push([ps[k][0]*f1,ps[k][1]*f2]); return ps; };
  function drawOne(){
    const f=x=>.5*lam*x*x, ymax=f(2.4), xs=iters1(), fac=1-g*lam;
    const ys=[0.5,1,2,5,10].find(s=>ymax*1.1/s<=7)||10;
    const p=frame(svg,-2.4,2.4,-ymax*.06,ymax*1.12,{l:40,r:14,t:30,b:28,xs:1,ys}); const glow=p.glow;
    let d=''; for(let i=0;i<=200;i++){ const x=-2.4+4.8*i/200; d+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.py(f(x)).toFixed(1); }
    el('path',{d,stroke:'var(--s1)','stroke-width':3,fill:'none','stroke-linejoin':'round',filter:glow||'none'},svg);
    txt(svg,p.L+6,p.T-10,`f(x) = ½·${nm(fmt(lam,2))}·x² · x₀ = 1.8 · ${NS1} steps`,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    txt(svg,p.W-p.R-4,p.T-10,`factor 1 − γλ = ${F(fac,3)}`,'font:700 11px system-ui;fill:var(--s4)','end');
    const gp=el('g',{'clip-path':p.clip},svg);
    for(let k=0;k+1<xs.length&&k+1<shown;k++){ const x0=xs[k],x1=xs[k+1]; if(!isFinite(x1)) break; const ok=Math.abs(x1)<Math.abs(x0)-1e-12;
      glowLine(gp,p.px(x0),p.py(f(x0)),p.px(x1),p.py(f(x1)),ok?'var(--s3)':'var(--critical)',2,glow,{opacity:.85}); }
    xs.forEach((x,k)=>{ if(k>=shown||!isFinite(x)||Math.abs(x)>2.6) return; glowDot(gp,p.px(x),p.py(f(x)),k===0?6:4.5,k===0?'var(--s4)':'var(--s3)',glow);
      if(k<6) txt(svg,p.cx(p.px(x)),Math.max(p.T+10,p.py(f(x))-11),String(k),'font:700 10px system-ui;fill:var(--ink-2)','middle'); });
    /* the drop of |x| written along the bottom */
    const last=xs[Math.min(shown-1,NS1)];
    txt(svg,p.L+6,p.H-p.B-6,`|x${SUB(Math.min(shown-1,NS1))}| = ${Math.abs(last)>=1e4||(Math.abs(last)<1e-3&&last!==0)?sci(Math.abs(last),2):F(Math.abs(last),4)}`,'font:600 10px system-ui;fill:var(--ink-2)');
  }
  function drawTwo(){
    const f=(x,y)=>.5*(l1*x*x+l2*y*y), ps=iters2(), R=2.2, RX=3.8;
    const p=plane(svg,-RX,RX,-R,R,{pad:24,tickEvery:1}); const glow=p.glow, clip=planeClip(p,-RX,RX,-R,R);
    const fmax=f(1.8,1.8)*1.35, lv=[]; for(let i=1;i<=8;i++) lv.push(fmax*Math.pow(i/8,2));
    const cg=el('g',{opacity:.4,'clip-path':clip},svg);
    contourSegs(f,lv,-RX,RX,-R,R,90).forEach(({segs})=>{ let d=''; segs.forEach(s=>{ d+=`M${p.px(s[0]).toFixed(1)},${p.py(s[1]).toFixed(1)}L${p.px(s[2]).toFixed(1)},${p.py(s[3]).toFixed(1)}`; }); el('path',{d,stroke:'var(--s1)','stroke-width':1.3,fill:'none'},cg); });
    txt(svg,30,16,`f = ½(${nm(fmt(l1,1))}x² + ${nm(fmt(l2,1))}y²) · from (1.8, 1.8) · ${NS2} steps`,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    txt(svg,570,16,`factors ${F(1-g*l1,2)} · ${F(1-g*l2,2)}`,'font:700 11px system-ui;fill:var(--s4)','end');
    const gp=el('g',{'clip-path':clip},svg);
    for(let k=0;k+1<ps.length&&k+1<shown;k++){ const a=ps[k],b=ps[k+1]; if(!isFinite(b[0])||!isFinite(b[1])||Math.abs(b[0])>1e4||Math.abs(b[1])>1e4) break;
      const ok=f(b[0],b[1])<f(a[0],a[1]); glowLine(gp,p.px(a[0]),p.py(a[1]),p.px(b[0]),p.py(b[1]),ok?'var(--s3)':'var(--critical)',2.2,glow,{opacity:.9}); }
    ps.forEach((q,k)=>{ if(k>=shown||Math.abs(q[0])>R+.5||Math.abs(q[1])>R+.5) return; glowDot(gp,p.px(q[0]),p.py(q[1]),k===0?6:3.8,k===0?'var(--s4)':'var(--s3)',glow); });
    glowDot(svg,p.px(0),p.py(0),4,'var(--ink)',null);
  }
  function draw(){
    if(tab==='one'){ drawOne(); const fac=1-g*lam, af=Math.abs(fac), xs=iters1(), ratio=Math.abs(xs[NS1])/X0, gl=g*lam;
      const steps=af<1&&af>0?Math.ceil(Math.log(100)/Math.abs(Math.log(af))):(af===0?1:null);
      read.innerHTML=`xₖ₊₁ = xₖ − γ·λxₖ = (1 − γλ)·xₖ<br>1 − γλ = 1 − ${fmt(g,3)}·${fmt(lam,2)} = <b>${F(fac,3)}</b><br>|x₁₂| / |x₀| = (1−γλ)¹² = <b>${ratio>=1e3||(ratio<1e-3&&ratio!==0)?sci(ratio,2):F(ratio,4)}</b><br>steps to shrink |x| by 100× ≈ ⌈ln 100 / |ln|1−γλ||⌉ = <b>${steps==null?'never':steps}</b>`;
      if(Math.abs(gl-1)<2e-3){ verd.className='verdict good'; verd.textContent='γλ = 1 → x₁ = 0: one perfect step'; }
      else if(Math.abs(gl-2)<2e-3){ verd.className='verdict info'; verd.textContent='γλ = 2: bounces between ±x₀ forever'; }
      else if(af>1){ verd.className='verdict bad'; verd.textContent='✗ |1−γλ| > 1: every step is bigger than the last — diverging'; }
      else if(fac>0){ verd.className='verdict good'; verd.textContent='✓ |1−γλ| < 1 and positive: smooth descent'; }
      else { verd.className='verdict good'; verd.textContent='✓ |1−γλ| < 1 but negative: overshoots the bottom each step, still shrinking'; }
    } else { drawTwo(); const f1=1-g*l1,f2=1-g*l2, lim=2/l1;
      read.innerHTML=`factor along x: 1 − γλ₁ = <b>${F(f1,3)}</b><br>factor along y: 1 − γλ₂ = <b>${F(f2,3)}</b><br>speed limit 2/λ₁ = <b>${F(lim,4)}</b><br>condition number λ₁/λ₂ = <b>${F(l1/l2,2)}</b>`;
      if(g>lim+1e-9){ verd.className='verdict bad'; verd.textContent=`✗ stiff direction diverges: γ = ${fmt(g,3)} > 2/λ₁ = ${F(lim,4)}`; }
      else if(f1<0&&f2>0.7){ verd.className='verdict info'; verd.textContent=`zig-zag: the stiff direction bounces (factor ${F(f1,2)}) while the flat one crawls (factor ${F(f2,2)})`; }
      else { verd.className='verdict good'; verd.textContent='✓ both factors inside (−1, 1): converging'; } }
  }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run, n=(tab==='one'?NS1:NS2)+1; shown=1; draw();
    const next=()=>{ if(tok!==run) return; if(shown>=n){ shown=99; return; } anim=tween(220,()=>{},()=>{ shown++; draw(); next(); }); }; next(); }
  function setG(v){ const lo=+sG.min,hi=+sG.max; g=Math.max(lo,Math.min(hi,v)); setCtl('st-g',g,v=>fmt(v,3)); }
  document.getElementById('st-play').addEventListener('click',play);
  bindCtl('st-l',v=>{ stop(); shown=99; lam=v; draw(); })();
  bindCtl('st-l1',v=>{ stop(); shown=99; l1=v; if(l2>l1){ l2=l1; setCtl('st-l2',l2,1); } draw(); },v=>fmt(v,1))();
  bindCtl('st-l2',v=>{ stop(); shown=99; l2=v; if(l2>l1){ l1=l2; setCtl('st-l1',l1,1); } draw(); },v=>fmt(v,1))();
  bindCtl('st-g',v=>{ stop(); shown=99; g=v; draw(); },v=>fmt(v,3))();
  const P1={crawl:0.1,sweet:1,bounce:1.6,edge:2,blow:2.4}, P2={safe:0.045,zigzag:0.095,over:0.12};
  const b1=document.getElementById('st-presets'), b2=document.getElementById('st-presets2');
  b1.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ if(P1[btn.dataset.p]==null) return; pressOnly(b1,btn); stop(); shown=99; setG(P1[btn.dataset.p]/lam); draw(); }));
  b2.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ if(P2[btn.dataset.p]==null) return; pressOnly(b2,btn); stop(); shown=99; setG(P2[btn.dataset.p]); draw(); }));
  tabs(document.getElementById('st-tabs'),t=>{ stop(); shown=99; tab=t;
    box.querySelectorAll('[data-tab]').forEach(e=>e.style.display=e.dataset.tab===t?'':'none');
    if(t==='one'){ sG.min=0.02; sG.max=1.3; sG.step=0.01; setG(0.3); } else { sG.min=0.005; sG.max=0.15; sG.step=0.005; setG(0.045); }
    draw(); });
  draw();
})();

/* ================= W5 · THE LINE-SEARCH LENS ================= */
(function(){
  const box=document.getElementById('w-line'),svg=document.getElementById('ls-svg'),side=document.getElementById('ls-h'),read=document.getElementById('ls-read'),verd=document.getElementById('ls-verdict');
  if(!box||!svg) return;
  const sG=document.getElementById('ls-g');
  const TB={stretch:{A:[[2,0],[0,6]],b:[0,0],x0:[2,2],X:[-4.4,4.4],Y:[-2.6,2.6]},lecture:{A:[[2,1],[1,20]],b:[-5,-3],x0:[-3,-1],X:[-4,4.5],Y:[-2,2.4]}};
  let tab='stretch',xk=[2,2],gam=0,hist=[],anim=null; const CD={};   /* contour paths cached per tab */
  const Q=()=>TB[tab];
  const f=v=>{ const {A,b}=Q(); return .5*(A[0][0]*v[0]*v[0]+2*A[0][1]*v[0]*v[1]+A[1][1]*v[1]*v[1])+b[0]*v[0]+b[1]*v[1]; };
  const grad=v=>{ const {A,b}=Q(); return [A[0][0]*v[0]+A[0][1]*v[1]+b[0],A[0][1]*v[0]+A[1][1]*v[1]+b[1]]; };
  const gAg=v=>{ const {A}=Q(); return v[0]*(A[0][0]*v[0]+A[0][1]*v[1])+v[1]*(A[0][1]*v[0]+A[1][1]*v[1]); };
  const xstar=()=>{ const {A,b}=Q(); const det=A[0][0]*A[1][1]-A[0][1]*A[0][1]; return [-(A[1][1]*b[0]-A[0][1]*b[1])/det,-(-A[0][1]*b[0]+A[0][0]*b[1])/det]; };
  function calc(){ const g=grad(xk), gg=g[0]*g[0]+g[1]*g[1], gA=gAg(g), gs=gA>1e-12?gg/gA:0, gmax=2.2*gs; const at=t=>[xk[0]-t*g[0],xk[1]-t*g[1]];
    return {g,gg,gA,gs,gmax,at,h:t=>f(at(t)),bead:at(gam),nw:at(gs)}; }
  function setSlider(v){ const C=calc(); sG.min=0; sG.max=C.gmax||1; sG.step=(C.gmax||1)/200; gam=v==null?.5*C.gs:v; setCtl('ls-g',gam,v=>fmt(v,4)); }
  function stop(){ if(anim){ anim.stop(); anim=null; } }
  function draw(){
    const C=calc(), {X,Y}=Q(), xs=xstar(), fmin=f(xs);
    const p=plane(svg,X[0],X[1],Y[0],Y[1],{pad:24,tickEvery:1}); const glow=p.glow, clip=planeClip(p,X[0],X[1],Y[0],Y[1]);
    let fmax=-Infinity; [[X[0],Y[0]],[X[0],Y[1]],[X[1],Y[0]],[X[1],Y[1]]].forEach(c=>fmax=Math.max(fmax,f(c)));
    const lv=[]; for(let i=1;i<=9;i++) lv.push(fmin+(fmax-fmin)*Math.pow(i/9.5,3));
    const cg=el('g',{opacity:.38,'clip-path':clip},svg);
    const segPath=segs=>{ let d=''; segs.forEach(s=>{ d+=`M${p.px(s[0]).toFixed(1)},${p.py(s[1]).toFixed(1)}L${p.px(s[2]).toFixed(1)},${p.py(s[3]).toFixed(1)}`; }); return d; };
    if(!CD[tab]) CD[tab]=contourSegs((x,y)=>f([x,y]),lv,X[0],X[1],Y[0],Y[1],80).map(({segs})=>segPath(segs));
    CD[tab].forEach(d=>el('path',{d,stroke:'var(--s1)','stroke-width':1.3,fill:'none'},cg));
    /* the contour through the bead — brighter */
    const fb=f(C.bead); if(fb>fmin+1e-6){ const d=segPath(contourSegs((x,y)=>f([x,y]),[fb],X[0],X[1],Y[0],Y[1],100)[0].segs); el('path',{d,stroke:'var(--s4)','stroke-width':1.8,fill:'none',opacity:.85,'clip-path':clip,filter:glow||'none'},svg); }
    /* the visited path with its square corners */
    if(hist.length){ const pts=[...hist,xk]; let d=''; pts.forEach((q,i)=>{ d+=(i?'L':'M')+p.px(q[0]).toFixed(1)+','+p.py(q[1]).toFixed(1); });
      glowPath(svg,d,'var(--s3)',2.2,glow,{opacity:.9,'clip-path':clip});
      pts.slice(1,-1).forEach(q=>el('rect',{x:p.px(q[0])-4,y:p.py(q[1])-4,width:8,height:8,fill:'none',stroke:'var(--s3)','stroke-width':1.6,transform:`rotate(45 ${p.px(q[0])} ${p.py(q[1])})`},svg));
      hist.forEach(q=>el('circle',{cx:p.px(q[0]),cy:p.py(q[1]),r:3.2,fill:'var(--s3)'},svg)); }
    /* the descent ray across the plot (dashed) */
    const gn=Math.hypot(C.g[0],C.g[1]);
    if(gn>1e-9){ let tmax=Infinity; const d=[-C.g[0],-C.g[1]]; [[d[0],X[0],X[1],xk[0]],[d[1],Y[0],Y[1],xk[1]]].forEach(([dd,lo,hi,o])=>{ if(Math.abs(dd)>1e-12) tmax=Math.min(tmax,((dd>0?hi:lo)-o)/dd); }); tmax=Math.max(tmax,C.gmax);
      const e=C.at(tmax); el('line',{x1:p.px(xk[0]),y1:p.py(xk[1]),x2:p.px(e[0]),y2:p.py(e[1]),stroke:'var(--s3)','stroke-width':2,'stroke-dasharray':'7 5',opacity:.9,'clip-path':clip},svg);
      const rp=C.at(tmax*.92); txt(svg,Math.max(60,Math.min(540,p.px(rp[0])+(C.g[0]>0?-50:50))),Math.max(26,Math.min(330,p.py(rp[1])-4)),'the ray xₖ − γ g','font:600 9.5px system-ui;fill:var(--s3)','middle'); }
    glowDot(svg,p.px(xs[0]),p.py(xs[1]),4.5,'var(--s3)',glow); txt(svg,p.px(xs[0])+8,p.py(xs[1])+4,'x*','font:700 10.5px system-ui;fill:var(--s3)');
    /* xₖ and the bead with its own gradient */
    glowDot(svg,p.px(xk[0]),p.py(xk[1]),6,'var(--s4)',glow); txt(svg,p.px(xk[0])-9,p.py(xk[1])-9,'xₖ','font:700 11px system-ui;fill:var(--s4)','end');
    const gb=grad(C.bead), gbn=Math.hypot(gb[0],gb[1]);
    if(gbn>1e-6){ const L=Math.min(1.2,.22*gbn); arrow(p,C.bead[0],C.bead[1],C.bead[0]+gb[0]/gbn*L,C.bead[1]+gb[1]/gbn*L,'var(--s2)',2.6,'∇f(bead)','font:700 10.5px system-ui;fill:var(--s2)'); }
    glowDot(svg,p.px(C.bead[0]),p.py(C.bead[1]),6.5,'var(--s4)',glow);
    txt(svg,30,16,tab==='stretch'?'f = x² + 3y²':'f = ½xᵀAx + bᵀx · A = [[2,1],[1,20]], b = (−5,−3)','font:600 10.5px system-ui;fill:var(--ink-muted)');
    txt(svg,570,16,`bead at γ = ${F(gam,4)}`,'font:700 11px system-ui;fill:var(--s4)','end');
    drawSide(C); readout(C);
  }
  function drawSide(C){
    side.innerHTML=''; const glow=glo(side); const W=300,H=160,pad=[40,12,26,10], G1=C.gmax||1;
    const vals=[]; for(let i=0;i<=60;i++) vals.push(C.h(G1*i/60)); let lo=Math.min(...vals),hi=Math.max(...vals); const span=(hi-lo)||1; lo-=span*.12; hi+=span*.14;
    const px=t=>pad[0]+t/G1*(W-pad[0]-pad[3]), py=v=>H-pad[2]-(v-lo)/(hi-lo)*(H-pad[1]-pad[2]);
    el('rect',{x:pad[0],y:pad[1],width:W-pad[0]-pad[3],height:H-pad[1]-pad[2],rx:5,fill:'none',stroke:'var(--line, var(--ring))'},side);
    [lo+span*.12,hi-span*.14].forEach(v=>txt(side,pad[0]-4,py(v)+3,F(v,1),'font:500 9px system-ui;fill:var(--ink-muted)','end'));
    txt(side,px(0),H-pad[2]+11,'0','font:500 9px system-ui;fill:var(--ink-muted)','middle'); txt(side,px(G1),H-pad[2]+11,F(G1,3),'font:500 9px system-ui;fill:var(--ink-muted)','middle');
    txt(side,W-pad[3]-2,H-3,'γ','font:600 9px system-ui;fill:var(--ink-muted)','end');
    let d=''; for(let i=0;i<=80;i++){ const t=G1*i/80; d+=(i?'L':'M')+px(t).toFixed(1)+','+py(C.h(t)).toFixed(1); }
    el('path',{d,stroke:'var(--s7)','stroke-width':2.4,fill:'none',filter:glow||'none'},side);
    el('line',{x1:px(C.gs),y1:py(C.h(C.gs)),x2:px(C.gs),y2:H-pad[2],stroke:'var(--s3)','stroke-width':1.2,'stroke-dasharray':'3 3'},side);
    el('circle',{cx:px(C.gs),cy:py(C.h(C.gs)),r:3,fill:'var(--s3)'},side);
    txt(side,px(C.gs)+4,pad[1]+12,'γ* = '+F(C.gs,4),'font:700 9.5px system-ui;fill:var(--s3)',px(C.gs)>W-90?'end':'start');
    glowDot(side,px(Math.min(G1,gam)),py(C.h(gam)),4.5,'var(--s4)',glow);
    txt(side,pad[0]+4,pad[1]+12,'h(γ) = f(xₖ − γ g)','font:600 9px system-ui;fill:var(--ink-muted)');
  }
  function readout(C){
    const gb=grad(C.bead), hp=-(C.g[0]*gb[0]+C.g[1]*gb[1]), gN=grad(C.nw), ang=angleDeg([-C.g[0],-C.g[1]],gN), angB=angleDeg([-C.g[0],-C.g[1]],gb);
    let s=`g = ∇f(xₖ) = (<b>${F(C.g[0],3)}</b>, <b>${F(C.g[1],3)}</b>)<br>h(γ) = f(xₖ − γ g)`;
    if(tab==='stretch'){ const x=xk[0],y=xk[1]; s+=` = (1−2γ)²x² + 3(1−6γ)²y²<br>γ* = (x²+9y²)/(2x²+54y²) = ${F(x*x+9*y*y,3)}/${F(2*x*x+54*y*y,3)} = <b>${F(C.gs,4)}</b>`; }
    s+=`<br>γ* = gᵀg / gᵀAg = ${F(C.gg,3)} / ${F(C.gA,3)} = <b>${F(C.gs,4)}</b><br>new point = (<b>${F(C.nw[0],3)}</b>, <b>${F(C.nw[1],3)}</b>)<br>f: ${F(f(xk),3)} → <b>${F(f(C.nw),3)}</b><br>angle(old direction, new gradient) = <b>${isNaN(ang)?'—':F(ang,1)+'°'}</b>`;
    read.innerHTML=s;
    if(C.gs>0&&Math.abs(gam-C.gs)<=0.01*C.gs){ verd.className='verdict good'; verd.textContent=`✓ at γ* the ray just kisses a contour — the new gradient is perpendicular to the ray (${isNaN(angB)?'—':F(angB,1)}°)`; }
    else if(C.gs<=0){ verd.className='verdict info'; verd.textContent='at the minimiser: g = 0, nothing to search'; }
    else { verd.className='verdict info'; verd.textContent=`not there yet: h′(γ) = −gᵀ∇f(bead) = ${F(hp,2)} ≠ 0 — ${hp<0?'negative → sliding further down the ray still helps':'positive → went too far, slide back'}`; }
  }
  document.getElementById('ls-best').addEventListener('click',()=>{ stop(); const C=calc(), g0=gam; anim=tween(700,u=>{ gam=g0+(C.gs-g0)*u; setCtl('ls-g',gam,v=>fmt(v,4)); draw(); },()=>{ gam=C.gs; setCtl('ls-g',gam,v=>fmt(v,4)); draw(); anim=null; }); });
  document.getElementById('ls-step').addEventListener('click',()=>{ stop(); const C=calc(); if(C.gs<=0) return; hist.push(xk.slice()); xk=C.nw; setSlider(); draw(); });
  document.getElementById('ls-reset').addEventListener('click',()=>{ stop(); xk=Q().x0.slice(); hist=[]; setSlider(); draw(); });
  bindCtl('ls-g',v=>{ stop(); gam=v; draw(); },v=>fmt(v,4));
  tabs(document.getElementById('ls-tabs'),t=>{ stop(); tab=t; xk=Q().x0.slice(); hist=[]; setSlider(); draw(); });
  setSlider(); draw();
})();

/* ================= W6 · THE BRACKET SQUEEZER ================= */
(function(){
  const box=document.getElementById('w-bracket'),svg=document.getElementById('br-svg'),read=document.getElementById('br-read'),verd=document.getElementById('br-verdict');
  if(!box||!svg) return;
  const HF={practice:{name:'h(α) = α² − 5α + 8',h:a=>a*a-5*a+8,d:a=>2*a-5},bumpy:{name:'h(α) = 0.4(α−1.2)² + 0.35 sin 4.2α + 1.5',h:a=>0.4*(a-1.2)*(a-1.2)+0.35*Math.sin(4.2*a)+1.5,d:a=>0.8*(a-1.2)+1.47*Math.cos(4.2*a)}};
  const PHI=(Math.sqrt(5)-1)/2, EPS=1e-6, C=0.1, AMAX=4;
  let fn='practice',m='binary',S=null,anim=null,run=0;
  const H=()=>HF[fn];
  function astar(){ const {h,d}=H(); let best=0,bv=Infinity; for(let i=0;i<=4000;i++){ const a=4*i/4000,v=h(a); if(v<bv){bv=v;best=a;} } const r=rootsOf(d,Math.max(0,best-.01),Math.min(4,best+.01),40); return r.length?r[0]:best; }
  function reset(){ S={a:0,b:4,k:0,evals:0,pts:[],g:null,alpha:AMAX,tried:[],acc:null,trace:['[0, 4]']}; if(m==='armijo') S.evals=1; }
  function iterate(){ const {h,d}=H();
    if(m==='binary'){ const mid=(S.a+S.b)/2, h0=h(mid), h1=h(mid+EPS); S.evals+=2; S.pts=[{x:mid,lab:'m'},{x:mid+EPS,lab:'m+ε',off:true}]; if(h1>h0) S.b=mid; else S.a=mid; S.k++; S.trace.push(`[${nm(fmt(S.a,4))}, ${nm(fmt(S.b,4))}]`); }
    else if(m==='golden'){ if(!S.g){ const m1=S.b-PHI*(S.b-S.a), m2=S.a+PHI*(S.b-S.a); S.g={m1,m2,h1:h(m1),h2:h(m2)}; S.evals+=2; }
      const G=S.g; if(G.h1<G.h2){ S.b=G.m2; G.m2=G.m1; G.h2=G.h1; G.m1=S.b-PHI*(S.b-S.a); G.h1=h(G.m1); } else { S.a=G.m1; G.m1=G.m2; G.h1=G.h2; G.m2=S.a+PHI*(S.b-S.a); G.h2=h(G.m2); } S.evals+=1; S.k++;
      S.pts=[{x:G.m1,lab:'m₁'},{x:G.m2,lab:'m₂'}]; S.trace.push(`[${nm(fmt(S.a,4))}, ${nm(fmt(S.b,4))}]`); }
    else { if(S.acc!=null) return; const a=S.alpha, ok=h(a)<=h(0)+C*a*d(0); S.evals+=1; S.k++; if(ok) S.acc=a; else { S.tried.push(a); S.alpha=a/2; } }
  }
  function draw(){
    const {h,d,name}=H(), as=astar();
    const vals=[]; for(let i=0;i<=200;i++) vals.push(h(4*i/200)); let lo=Math.min(...vals),hi=Math.max(...vals); if(m==='armijo') hi=Math.max(hi,h(0)); const span=(hi-lo)||1; lo-=span*.15; hi+=span*.15;
    const p=frame(svg,0,4,lo,hi,{l:40,r:14,t:30,b:30,xs:.5,ys:[0.5,1,2,5][[0.5,1,2,5].findIndex(s=>(hi-lo)/s<=8)]||5,xf:v=>nm(fmt(v,1))}); const glow=p.glow;
    txt(svg,p.L+6,p.T-10,name,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    if(m!=='armijo'){ el('rect',{x:p.px(S.a),y:p.T,width:Math.max(1,p.px(S.b)-p.px(S.a)),height:p.H-p.T-p.B,fill:'var(--s4)',opacity:.13},svg);
      [S.a,S.b].forEach((v,i)=>{ el('line',{x1:p.px(v),y1:p.T,x2:p.px(v),y2:p.H-p.B,stroke:'var(--s4)','stroke-width':1.5,opacity:.8},svg); txt(svg,p.px(v),p.T+12,(i?'b = ':'a = ')+nm(fmt(v,3)),'font:700 9.5px system-ui;fill:var(--s4)',i?'start':'end'); }); }
    let dd=''; for(let i=0;i<=200;i++){ const a=4*i/200; dd+=(i?'L':'M')+p.px(a).toFixed(1)+','+p.py(h(a)).toFixed(1); }
    el('path',{d:dd,stroke:'var(--s1)','stroke-width':3,fill:'none','stroke-linejoin':'round',filter:glow||'none'},svg);
    glowDot(svg,p.px(as),p.py(h(as)),5.5,'var(--s3)',glow); txt(svg,p.px(as),p.py(h(as))+18,'α* = '+nm(fmt(as,3)),'font:700 10px system-ui;fill:var(--s3)','middle');
    if(m!=='armijo'){ S.pts.forEach((q,i)=>{ if(q.off) return; glowDot(svg,p.px(q.x),p.py(h(q.x)),4.5,'var(--s7)',glow); txt(svg,p.px(q.x)+(i?7:-7),p.py(h(q.x))-8,q.lab+(S.pts.some(o=>o.off)?' · m+ε':''),'font:700 10px system-ui;fill:var(--s7)',i?'start':'end'); }); }
    else { const h0=h(0), s=d(0); el('line',{x1:p.px(0),y1:p.py(h0),x2:p.px(4),y2:p.cy(p.py(h0+C*4*s)),stroke:'var(--s2)','stroke-width':2,'stroke-dasharray':'6 4','clip-path':p.clip},svg);
      txt(svg,p.px(4)-4,p.cy(p.py(h0+C*4*s))-8,'h(0) + c·α·h′(0)','font:700 10px system-ui;fill:var(--s2)','end');
      glowDot(svg,p.px(0),p.py(h0),4.5,'var(--s7)',glow);
      S.tried.forEach(a=>{ el('line',{x1:p.px(a),y1:p.py(h(a)),x2:p.px(a),y2:p.cy(p.py(h0+C*a*s)),stroke:'var(--critical)','stroke-width':1.5,'stroke-dasharray':'2 2'},svg); glowDot(svg,p.px(a),p.py(h(a)),4.5,'var(--critical)',null); txt(svg,p.px(a),p.py(h(a))-9,'✗ '+nm(fmt(a,3)),'font:700 9.5px system-ui;fill:var(--critical)','middle'); });
      if(S.acc!=null){ glowDot(svg,p.px(S.acc),p.py(h(S.acc)),6,'var(--s3)',glow); txt(svg,p.px(S.acc),p.py(h(S.acc))-11,'✓ α = '+nm(fmt(S.acc,3)),'font:700 10px system-ui;fill:var(--s3)','middle'); }
      else { glowDot(svg,p.px(S.alpha),p.py(h(S.alpha)),5.5,'var(--s4)',glow); txt(svg,p.px(S.alpha),p.py(h(S.alpha))-11,'try α = '+nm(fmt(S.alpha,3)),'font:700 10px system-ui;fill:var(--s4)','middle'); } }
    /* readout */
    const nb=Math.ceil(Math.log(4/0.01)/Math.log(2)), ng=Math.ceil(Math.log(0.01/4)/Math.log(PHI));
    if(m!=='armijo'){ const w=S.b-S.a, pred=m==='binary'?4/Math.pow(2,S.k):4*Math.pow(PHI,S.k);
      read.innerHTML=`bracket [a, b] = [<b>${nm(fmt(S.a,4))}</b>, <b>${nm(fmt(S.b,4))}</b>]<br>width = <b>${nm(fmt(w,4))}</b> (after ${S.k} iteration${S.k===1?'':'s'}: ${m==='binary'?`(b−a)/2ᵏ = 4/2${SUP(S.k)}`:`(b−a)·0.618ᵏ`} = ${nm(fmt(pred,4))})<br>evaluations of h so far = <b>${S.evals}</b><br>true minimiser α* = <b>${nm(fmt(as,4))}</b><br>trace: ${(S.trace.length>5?[S.trace[0],'…',...S.trace.slice(-3)]:S.trace).join(' → ')}<br>iterations for width ≤ 0.01 from [0,4]: binary ${nb} · golden ${ng}`;
      const inside=as>=S.a-1e-9&&as<=S.b+1e-9;
      if(inside){ verd.className='verdict good'; verd.textContent='✓ the bracket still contains α*'; } else { verd.className='verdict bad'; verd.textContent='✗ the bracket lost α* — h is not unimodal here, so exact bracketing can lie'; } }
    else { const h0=h(0), s=d(0), seq=[...S.tried,S.acc!=null?S.acc:S.alpha].map(a=>nm(fmt(a,3))).join(' → ');
      read.innerHTML=`c = 0.1 · h(0) = ${nm(fmt(h0,3))}, h′(0) = ${nm(fmt(s,3))}${s>0?' (α = 0 is not downhill along this line)':''}<br>α tried: ${seq}${S.acc!=null?` → accepted α = <b>${nm(fmt(S.acc,3))}</b> (h = ${nm(fmt(h(S.acc),4))} ≤ ${nm(fmt(h0+C*S.acc*s,4))})`:` (next test: α = ${nm(fmt(S.alpha,3))})`}<br>evaluations of h so far = <b>${S.evals}</b><br>true minimiser α* = <b>${nm(fmt(as,4))}</b><br>iterations for width ≤ 0.01 from [0,4]: binary ${nb} · golden ${ng}`;
      if(S.acc!=null){ verd.className='verdict good'; verd.textContent=`✓ sufficient decrease reached after ${S.tried.length} halving${S.tried.length===1?'':'s'} — inexact, cheap, and no unimodality needed`; }
      else { verd.className='verdict info'; verd.textContent=S.k?`✗ α = ${nm(fmt(S.tried[S.tried.length-1],3))} did not drop below the line — halve it`:'accept α if h(α) ≤ h(0) + c·α·h′(0); otherwise halve α'; } }
  }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  document.getElementById('br-step').addEventListener('click',()=>{ stop(); iterate(); draw(); });
  document.getElementById('br-reset').addEventListener('click',()=>{ stop(); reset(); draw(); });
  document.getElementById('br-play').addEventListener('click',()=>{ stop(); const tok=run; reset(); draw(); let i=0; const next=()=>{ if(tok!==run||i>=8) return; anim=tween(350,()=>{},()=>{ iterate(); draw(); i++; next(); }); }; next(); });
  tabs(document.getElementById('br-fn'),t=>{ stop(); fn=t; reset(); draw(); });
  tabs(document.getElementById('br-m'),t=>{ stop(); m=t; reset(); draw(); });
  /* self-check: the practice trace the lecture prints */
  (function(){ const h=HF.practice.h; let a=0,b=4; const tr=['[0,4]']; for(let i=0;i<3;i++){ const mid=(a+b)/2; if(h(mid+EPS)>h(mid)) b=mid; else a=mid; tr.push(`[${fmt(a,2)},${fmt(b,2)}]`); } if(tr.join('→')!=='[0,4]→[2,4]→[2,3]→[2,2.5]') console.warn('binary trace unexpected', tr.join('→')); })();
  reset(); draw();
})();

/* ================= W7 · SCHEDULES AND THE BOLD DRIVER ================= */
(function(){
  const box=document.getElementById('w-decay'),svg=document.getElementById('dc-svg'),read=document.getElementById('dc-read'),verd=document.getElementById('dc-verdict');
  if(!box||!svg) return;
  const sT=document.getElementById('dc-t');
  let tab='schedules',a0=0.8,k=0.05,T=30,tt=10,shown=99,anim=null,run=0;
  const EXP=t=>a0*Math.exp(-k*t), INV=t=>a0/(1+k*t), STP=t=>a0/Math.pow(3,Math.floor(t/5));
  function boldRun(){ const l1=20,l2=2, f=v=>.5*(l1*v[0]*v[0]+l2*v[1]*v[1]); let x=[1.8,1.8], al=0.02, inc=0, hal=0; const rows=[];
    for(let t=0;t<40;t++){ const fx=f(x), nx=[x[0]-al*l1*x[0],x[1]-al*l2*x[1]], fn=f(nx);
      if(fn<fx){ rows.push({t,al,f:fn,ok:true}); x=nx; al*=1.05; inc++; } else { rows.push({t,al,f:fx,ok:false}); al*=0.5; hal++; } }
    return {rows,inc,hal,final:al}; }
  function drawSched(){
    const ymax=a0*1.1, xs=T>40?10:5, ys=[0.1,0.2,0.25,0.5][[0.1,0.2,0.25,0.5].findIndex(s=>ymax/s<=8)]||0.5;
    const p=frame(svg,0,T,0,ymax,{l:44,r:14,t:30,b:30,xs,ys}); const glow=p.glow;
    const curve=(fn,col,stair)=>{ let d=''; if(stair){ for(let t=0;t<=T;t++){ const v=fn(t); d+=(t?'L':'M')+p.px(t).toFixed(1)+','+p.py(v).toFixed(1); if(t<T) d+='L'+p.px(t+1).toFixed(1)+','+p.py(v).toFixed(1); } }
      else for(let i=0;i<=200;i++){ const t=T*i/200; d+=(i?'L':'M')+p.px(t).toFixed(1)+','+p.py(fn(t)).toFixed(1); }
      el('path',{d,stroke:col,'stroke-width':2.6,fill:'none','stroke-linejoin':'round','clip-path':p.clip,filter:glow||'none'},svg); };
    curve(STP,'var(--s2)',true); curve(INV,'var(--s7)'); curve(EXP,'var(--s1)');
    [[EXP,'var(--s1)','exponential'],[INV,'var(--s7)','inverse'],[STP,'var(--s2)','step']].forEach(([fn,col,name],i)=>{ glowDot(svg,p.px(tt),p.py(fn(tt)),5,col,glow);
      txt(svg,p.L+8+i*150,p.T-10,`${name} · ${nm(fmt(fn(tt),4))}`,`font:700 10.5px system-ui;fill:${col}`); });
    el('line',{x1:p.px(tt),y1:p.T,x2:p.px(tt),y2:p.H-p.B,stroke:'var(--s4)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.7},svg);
    txt(svg,p.px(tt)+(tt>T*.85?-4:4),p.T+12,'t = '+tt,'font:700 10px system-ui;fill:var(--s4)',tt>T*.85?'end':'start');
    txt(svg,(p.L+p.W-p.R)/2,p.H-4,'epoch t','font:600 10px system-ui;fill:var(--ink-muted)','middle'); txt(svg,10,p.T+8,'αₜ','font:600 10px system-ui;fill:var(--ink-muted)');
    read.innerHTML=`t = ${tt}: exponential <b>${nm(fmt(EXP(tt),4))}</b>, inverse <b>${nm(fmt(INV(tt),4))}</b>, step <b>${nm(fmt(STP(tt),4))}</b><br>inverse decay reaches α₀/2 at t = 1/k = <b>${nm(fmt(1/k,1))}</b><br>exponential reaches α₀/e at t = 1/k = <b>${nm(fmt(1/k,1))}</b><br>step decay divides by 3 every 5 epochs: at t = ${tt} it is α₀/3${SUP(Math.floor(tt/5))} = ${nm(fmt(STP(tt),4))}`;
    verd.className='verdict info'; verd.textContent='exponential falls fastest (geometric), inverse slowest (harmonic), step falls in cliffs';
  }
  function drawBold(){
    const R=boldRun(), rows=R.rows, n=Math.min(shown,rows.length);
    const amax=Math.max(...rows.map(r=>r.al))*1.15, lf=rows.map(r=>Math.log10(Math.max(1e-12,r.f))), lmin=Math.floor(Math.min(...lf))-0.3, lmax=Math.ceil(Math.max(...lf))+0.3;
    const p=frame(svg,0,40,0,amax,{l:44,r:44,t:30,b:30,xs:5,ys:0.05}); const glow=p.glow;
    const pyf=v=>p.py(amax*(Math.log10(Math.max(1e-12,v))-lmin)/(lmax-lmin));
    for(let e=Math.ceil(lmin);e<=lmax;e++){ const y=pyf(Math.pow(10,e)); txt(svg,p.W-p.R+5,y+3.5,'10'+SUP(e),'font:500 10px system-ui;fill:var(--s1)'); }
    txt(svg,p.W-4,p.T-10,'f (log)','font:600 10px system-ui;fill:var(--s1)','end'); txt(svg,10,p.T+8,'αₜ','font:600 10px system-ui;fill:var(--s7)');
    txt(svg,(p.L+p.W-p.R)/2,p.H-4,'step t','font:600 10px system-ui;fill:var(--ink-muted)','middle');
    el('line',{x1:p.L,y1:p.py(0.1),x2:p.W-p.R,y2:p.py(0.1),stroke:'var(--critical)','stroke-width':1.2,'stroke-dasharray':'5 4',opacity:.7},svg); txt(svg,p.L+6,p.py(0.1)-5,'speed limit 2/λ₁ = 0.1','font:700 9.5px system-ui;fill:var(--critical)');
    let df='',da=''; for(let i=0;i<n;i++){ df+=(i?'L':'M')+p.px(rows[i].t).toFixed(1)+','+pyf(rows[i].f).toFixed(1); da+=(i?'L':'M')+p.px(rows[i].t).toFixed(1)+','+p.py(rows[i].al).toFixed(1); }
    if(n>1){ el('path',{d:df,stroke:'var(--s1)','stroke-width':2.4,fill:'none','stroke-linejoin':'round',filter:glow||'none'},svg); el('path',{d:da,stroke:'var(--s7)','stroke-width':2.2,fill:'none','stroke-linejoin':'round',filter:glow||'none'},svg); }
    for(let i=0;i<n;i++){ const r=rows[i]; if(r.ok) el('circle',{cx:p.px(r.t),cy:p.py(r.al),r:3,fill:'var(--s7)'},svg);
      else { const x=p.px(r.t),y=p.py(r.al); el('path',{d:`M${x-4},${y-4}L${x+4},${y+4}M${x-4},${y+4}L${x+4},${y-4}`,stroke:'var(--critical)','stroke-width':2.2},svg); } }
    if(n){ const r=rows[n-1]; glowDot(svg,p.px(r.t),p.py(r.al),5,'var(--s7)',glow); glowDot(svg,p.px(r.t),pyf(r.f),5,'var(--s1)',glow);
      read.innerHTML=`step t = <b>${r.t}</b>: α = <b>${nm(fmt(r.al,4))}</b>, f = <b>${r.f<1e-3?sci(r.f,2):nm(fmt(r.f,4))}</b> ${r.ok?'(improved → α × 1.05)':'(worse → undone, α ÷ 2)'}<br>increases: <b>${rows.slice(0,n).filter(q=>q.ok).length}</b>, halvings: <b>${rows.slice(0,n).filter(q=>!q.ok).length}</b><br>final α ≈ <b>${nm(fmt(R.final,4))}</b> — settles near the speed limit 2/λ₁ = 0.1<br>f = ½(20x² + 2y²) from (1.8, 1.8), α₀ = 0.02, 40 steps`; }
    verd.className='verdict good'; verd.textContent='✓ the driver speeds up while it can and halves the moment it overshoots — monotone descent guaranteed';
  }
  function draw(){ if(tab==='schedules') drawSched(); else drawBold(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  document.getElementById('dc-play').addEventListener('click',()=>{ stop(); const tok=run; shown=1; draw(); const next=()=>{ if(tok!==run) return; if(shown>=40){ shown=99; return; } anim=tween(80,()=>{},()=>{ shown++; draw(); next(); }); }; next(); });
  bindCtl('dc-a0',v=>{ a0=v; draw(); })();
  bindCtl('dc-k',v=>{ k=v; draw(); },v=>fmt(v,3))();
  bindCtl('dc-T',v=>{ T=v|0; sT.max=T; if(tt>T){ tt=T; setCtl('dc-t',tt,v=>String(v)); } draw(); },v=>String(v|0))();
  bindCtl('dc-t',v=>{ tt=v|0; draw(); },v=>String(v|0))();
  tabs(document.getElementById('dc-tabs'),t=>{ stop(); shown=99; tab=t; document.getElementById('dc-ctl-s').style.display=t==='schedules'?'':'none'; document.getElementById('dc-ctl-b').style.display=t==='bold'?'':'none'; draw(); });
  draw();
})();

/* ================= W8 · THE GRADIENT AUDITOR ================= */
(function(){
  const box=document.getElementById('w-fd'),svg=document.getElementById('fd-svg'),read=document.getElementById('fd-read'),verd=document.getElementById('fd-verdict');
  if(!box||!svg) return;
  const J=(w1,w2)=>w1*w1*w1+w1*w2*w2, W=[2,1], AN=[3*W[0]*W[0]+W[1]*W[1],2*W[0]*W[1]];
  let tab='w1',ld=-1;
  const est=(i,D)=>{ const wp=W.slice(),wm=W.slice(); wp[i]+=D; wm[i]-=D; const fw=(J(wp[0],wp[1])-J(W[0],W[1]))/D, ce=(J(wp[0],wp[1])-J(wm[0],wm[1]))/(2*D); return {fw,ce,ef:Math.abs(fw-AN[i]),ec:Math.abs(ce-AN[i])}; };
  function draw(){
    const i=tab==='w1'?0:1, D=Math.pow(10,ld), E=est(i,D), lg=v=>Math.max(-12,Math.log10(Math.max(1e-300,v)));
    const p=frame(svg,-9,0,-12,1,{l:46,r:14,t:30,b:30,xs:1,ys:1,xf:v=>'10'+SUP(v),yf:v=>'10'+SUP(v)}); const glow=p.glow;
    el('rect',{x:p.px(-9),y:p.T,width:p.px(-5)-p.px(-9),height:p.H-p.T-p.B,fill:'var(--critical)',opacity:.07},svg);
    txt(svg,p.px(-7),p.H-p.B-8,'round-off takes over','font:700 10px system-ui;fill:var(--critical)','middle');
    /* reference slopes */
    const c1=Math.abs(i===0?6*W[0]:2*W[0])/2*.25, c2=i===0?.25:0;
    el('line',{x1:p.px(-6),y1:p.py(lg(c1*1e-6)),x2:p.px(0),y2:p.py(lg(c1)),stroke:'var(--s2)','stroke-width':1.2,'stroke-dasharray':'4 4',opacity:.6},svg); txt(svg,p.px(-4.4),p.py(lg(c1*Math.pow(10,-4.4)))-9,'∝ Δ','font:700 10px system-ui;fill:var(--s2)','middle');
    if(c2>0){ el('line',{x1:p.px(-5),y1:p.py(lg(c2*1e-10)),x2:p.px(0),y2:p.py(lg(c2)),stroke:'var(--s3)','stroke-width':1.2,'stroke-dasharray':'4 4',opacity:.6},svg); txt(svg,p.px(-3),p.py(lg(c2*1e-6))+14,'∝ Δ²','font:700 10px system-ui;fill:var(--s3)','middle'); }
    let df='',dc=''; for(let s=0;s<90;s++){ const l=-9+9*s/89, e=est(i,Math.pow(10,l)); df+=(s?'L':'M')+p.px(l).toFixed(1)+','+p.py(lg(e.ef)).toFixed(1); dc+=(s?'L':'M')+p.px(l).toFixed(1)+','+p.py(lg(e.ec)).toFixed(1); }
    el('path',{d:df,stroke:'var(--s2)','stroke-width':2.6,fill:'none','stroke-linejoin':'round',filter:glow||'none'},svg);
    el('path',{d:dc,stroke:'var(--s3)','stroke-width':2.6,fill:'none','stroke-linejoin':'round',filter:glow||'none'},svg);
    el('line',{x1:p.px(ld),y1:p.T,x2:p.px(ld),y2:p.H-p.B,stroke:'var(--s4)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.7},svg);
    glowDot(svg,p.px(ld),p.py(lg(E.ef)),5.5,'var(--s2)',glow); glowDot(svg,p.px(ld),p.py(lg(E.ec)),5.5,'var(--s3)',glow);
    const anc=ld>-2.5?'end':'start', dx=ld>-2.5?-9:9;
    txt(svg,p.px(ld)+dx,p.py(lg(E.ef))-6,'forward · '+errFmt(E.ef),'font:700 10px system-ui;fill:var(--s2)',anc);
    txt(svg,p.px(ld)+dx,p.py(lg(E.ec))+14,i===1&&E.ec<1e-9?'central · exact':'central · '+errFmt(E.ec),'font:700 10px system-ui;fill:var(--s3)',anc);
    txt(svg,p.L+6,p.T-10,`|estimate − ${i===0?'13':'4'}| against Δ · J = w₁³ + w₁w₂² at (2, 1)`,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    txt(svg,(p.L+p.W-p.R)/2,p.H-4,'Δ','font:600 10px system-ui;fill:var(--ink-muted)','middle');
    const Ds=D>=1e-3?nm(fmt(D,4)):sci(D,1), v=i===0?'w₁':'w₂';
    read.innerHTML=`Δ = <b>${Ds}</b><br>J(w) = <b>10</b><br>forward: (J(w+Δe${i===0?'₁':'₂'}) − J(w))/Δ = <b>${nm(fmt(E.fw,4))}</b> (error ${errFmt(E.ef)})<br>central: (J(w+Δe${i===0?'₁':'₂'}) − J(w−Δe${i===0?'₁':'₂'}))/(2Δ) = <b>${nm(fmt(E.ce,4))}</b> (error ${i===1&&E.ec<1e-9?'0 — central is exact here: J is quadratic in w₂':errFmt(E.ec)})<br>analytic ∂J/∂${v} = <b>${AN[i]}</b><br>error ratio forward/central = <b>${E.ec<1e-12?'∞':nm(fmt(E.ef/E.ec,1))}</b>`;
    if(D>=0.5){ verd.className='verdict bad'; verd.textContent=`✗ Δ = ${Ds}: the secant is nowhere near the tangent`; }
    else if(D<3e-6){ verd.className='verdict info'; verd.textContent='Δ so small that floating-point round-off dominates — the estimate gets worse, not better'; }
    else { verd.className='verdict good'; verd.textContent='✓ central error ≈ Δ² · |J‴|/6 — halve Δ and it drops 4×; forward only 2×'; }
  }
  bindCtl('fd-d',v=>{ ld=v; draw(); },v=>{ const D=Math.pow(10,v); return D>=1e-3?fmt(D,4):D.toExponential(1); })();
  tabs(document.getElementById('fd-tabs'),t=>{ tab=t; draw(); });
  draw();
})();

/* ================= W9 · THE NOISY DESCENT ================= */
(function(){
  const box=document.getElementById('w-sgd'),svg=document.getElementById('sg-svg'),side=document.getElementById('sg-loss'),read=document.getElementById('sg-read'),verd=document.getElementById('sg-verdict');
  if(!box||!svg) return;
  const N=40, XS=[], YS=[]; { let s=7; for(let i=0;i<N;i++){ s=(s*1664525+1013904223)%4294967296; const n=(s/4294967296-0.5)*1.4; XS.push(-2+4*i/39); YS.push(1.5*XS[i]+0.5+n); } }
  const L=(a,b)=>{ let s=0; for(let i=0;i<N;i++){ const r=YS[i]-a*XS[i]-b; s+=r*r; } return s/N; };
  const gradS=(a,b,S)=>{ let ga=0,gb=0; S.forEach(i=>{ const r=YS[i]-a*XS[i]-b; ga-=2*XS[i]*r; gb-=2*r; }); return [ga/S.length,gb/S.length]; };
  const ALL=[...Array(N).keys()], gradF=(a,b)=>gradS(a,b,ALL);
  let Sx=0,Sy=0,Sxx=0,Sxy=0; for(let i=0;i<N;i++){ Sx+=XS[i]; Sy+=YS[i]; Sxx+=XS[i]*XS[i]; Sxy+=XS[i]*YS[i]; }
  const aS=(N*Sxy-Sx*Sy)/(N*Sxx-Sx*Sx), bS=(Sy-aS*Sx)/N, LS=L(aS,bS);
  const SIZES=[1,2,4,8,16,40], A0=-1.5,A1=4.5,B0=-1.5,B1=2.5;
  let bi=2,g=0.1,T=80,mode='constant',start=[0,0],shown=99,anim=null,run=0,R=null,CD=null;   /* R: the cached run · CD: the cached contour paths (L never changes) */
  const rate=t=>mode==='decay'?g/(1+0.05*t):g;
  function simulate(){ const bs=SIZES[bi]; let s=12345; const draw=()=>{ const S=[]; if(bs>=N) return ALL; for(let j=0;j<bs;j++){ s=(s*1664525+1013904223)%4294967296; S.push(Math.floor(s/4294967296*N)); } return S; };
    const pts=[start.slice()], Ls=[L(start[0],start[1])], gm=[], gt=[]; let x=start.slice(), dead=false;
    for(let t=0;t<=T;t++){ const S=draw(), gS=gradS(x[0],x[1],S), gF=gradF(x[0],x[1]); gm.push(gS); gt.push(gF); if(t===T) break;
      x=[x[0]-rate(t)*gS[0],x[1]-rate(t)*gS[1]]; if(!isFinite(x[0])||!isFinite(x[1])||Math.abs(x[0])>1e6||Math.abs(x[1])>1e6){ dead=true; break; } pts.push(x.slice()); Ls.push(L(x[0],x[1])); }
    let y=start.slice(); const Lf=[L(y[0],y[1])]; for(let t=0;t<T;t++){ const gF=gradF(y[0],y[1]); y=[y[0]-rate(t)*gF[0],y[1]-rate(t)*gF[1]]; if(!isFinite(y[0])||Math.abs(y[0])>1e6) break; Lf.push(L(y[0],y[1])); }
    return {pts,Ls,gm,gt,Lf,dead,bs}; }
  function draw(){
    if(!R) R=simulate(); const n=Math.min(shown,R.pts.length), cur=R.pts[n-1], gT=R.gt[n-1], gM=R.gm[n-1];
    const p=plane(svg,A0,A1,B0,B1,{pad:24,tickEvery:1}); const glow=p.glow, clip=planeClip(p,A0,A1,B0,B1);
    if(!CD){ let Lmax=0; [[A0,B0],[A0,B1],[A1,B0],[A1,B1]].forEach(c=>Lmax=Math.max(Lmax,L(c[0],c[1]))); const lv=[]; for(let i=1;i<=9;i++) lv.push(LS+(Lmax-LS)*Math.pow(i/9.5,2));
      CD=contourSegs(L,lv,A0,A1,B0,B1,80).map(({segs})=>{ let d=''; segs.forEach(s=>{ d+=`M${p.px(s[0]).toFixed(1)},${p.py(s[1]).toFixed(1)}L${p.px(s[2]).toFixed(1)},${p.py(s[3]).toFixed(1)}`; }); return d; }); }
    const cg=el('g',{opacity:.38,'clip-path':clip},svg); CD.forEach(d=>el('path',{d,stroke:'var(--s1)','stroke-width':1.3,fill:'none'},cg));
    glowDot(svg,p.px(aS),p.py(bS),5,'var(--s3)',glow); txt(svg,p.px(aS)+9,p.py(bS)+4,'(a*, b*)','font:700 10.5px system-ui;fill:var(--s3)');
    const gp=el('g',{'clip-path':clip},svg); let d=''; for(let i=0;i<n;i++) d+=(i?'L':'M')+p.px(R.pts[i][0]).toFixed(1)+','+p.py(R.pts[i][1]).toFixed(1);
    if(n>1) glowPath(gp,d,'var(--s4)',1.8,glow,{opacity:.9});
    for(let i=0;i<n;i++) el('circle',{cx:p.px(R.pts[i][0]),cy:p.py(R.pts[i][1]),r:2,fill:'var(--s4)',opacity:.4},gp);
    glowDot(gp,p.px(start[0]),p.py(start[1]),4.5,'var(--ink)',null);
    const kk=Math.min(1.3/Math.max(Math.hypot(gT[0],gT[1]),Math.hypot(gM[0],gM[1]),1e-9),.35);
    if(Math.hypot(gM[0],gM[1])>1e-6) arrow(p,cur[0],cur[1],cur[0]+gM[0]*kk,cur[1]+gM[1]*kk,'var(--s7)',2.4,'minibatch','font:700 10px system-ui;fill:var(--s7)');
    if(Math.hypot(gT[0],gT[1])>1e-6) arrow(p,cur[0],cur[1],cur[0]+gT[0]*kk,cur[1]+gT[1]*kk,'var(--s2)',2.4,'true ∇L','font:700 10px system-ui;fill:var(--s2)');
    glowDot(gp,p.px(cur[0]),p.py(cur[1]),6,'var(--s4)',glow);
    txt(svg,30,16,`L(a, b) = (1/40) Σ (yᵢ − a xᵢ − b)² · |S| = ${R.bs} · ${mode==='decay'?'γₜ = γ/(1 + 0.05t)':'γ = '+fmt(g,3)}`,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    txt(svg,570,16,`step ${n-1} of ${T}`,'font:700 11px system-ui;fill:var(--s4)','end');
    drawSide(n); readout(n,cur,gT,gM);
  }
  function drawSide(n){
    side.innerHTML=''; const glow=glo(side); const W=300,H=150,pad=[40,12,24,10];
    const all=[...R.Ls,...R.Lf].map(v=>Math.log10(Math.max(1e-6,v))); let lo=Math.min(...all),hi=Math.max(...all); if(hi-lo<0.5){ hi=lo+0.5; } lo-=.1; hi+=.1;
    const px=t=>pad[0]+t/T*(W-pad[0]-pad[3]), py=v=>H-pad[2]-(Math.log10(Math.max(1e-6,v))-lo)/(hi-lo)*(H-pad[1]-pad[2]);
    el('rect',{x:pad[0],y:pad[1],width:W-pad[0]-pad[3],height:H-pad[1]-pad[2],rx:5,fill:'none',stroke:'var(--line, var(--ring))'},side);
    for(let e=Math.ceil(lo);e<=hi;e++){ const y=py(Math.pow(10,e)); el('line',{x1:pad[0],y1:y,x2:W-pad[3],y2:y,stroke:'var(--grid)'},side); txt(side,pad[0]-4,y+3,'10'+SUP(e),'font:500 9px system-ui;fill:var(--ink-muted)','end'); }
    txt(side,px(0),H-pad[2]+11,'0','font:500 9px system-ui;fill:var(--ink-muted)','middle'); txt(side,px(T),H-pad[2]+11,String(T),'font:500 9px system-ui;fill:var(--ink-muted)','middle');
    let d=''; R.Lf.forEach((v,t)=>{ d+=(t?'L':'M')+px(t).toFixed(1)+','+py(v).toFixed(1); }); el('path',{d,stroke:'var(--s3)','stroke-width':1.4,fill:'none',opacity:.9},side);
    d=''; for(let t=0;t<n;t++) d+=(t?'L':'M')+px(t).toFixed(1)+','+py(R.Ls[t]).toFixed(1); if(n>1) el('path',{d,stroke:'var(--s4)','stroke-width':2,fill:'none',filter:glow||'none'},side);
    el('line',{x1:pad[0],y1:py(LS),x2:W-pad[3],y2:py(LS),stroke:'var(--s3)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.7},side);
    txt(side,pad[0]+4,pad[1]+11,'L after t steps · thin green: full batch · dashed: L*','font:600 8.5px system-ui;fill:var(--ink-muted)');
  }
  function readout(n,cur,gT,gM){
    const ang=angleDeg(gT,gM), bs=R.bs, Lt=R.Ls[n-1], Lf=R.Lf[Math.min(n-1,R.Lf.length-1)];
    read.innerHTML=`batch |S| = <b>${bs}</b> of 40 → cost per step = <b>${bs}</b> residual${bs===1?'':'s'}<br>true ∇L = (<b>${F(gT[0],3)}</b>, <b>${F(gT[1],3)}</b>), minibatch estimate = (<b>${F(gM[0],3)}</b>, <b>${F(gM[1],3)}</b>), angle between them = <b>${isNaN(ang)?'—':F(ang,1)+'°'}</b><br>L after ${n-1} steps = <b>${nm(fmt(Lt,4))}</b> (full batch would give ${nm(fmt(Lf,4))})<br>best: a* = <b>${nm(fmt(aS,4))}</b>, b* = <b>${nm(fmt(bS,4))}</b>, L* = <b>${nm(fmt(LS,4))}</b><br>variance of the estimate ∝ 1/|S|: relative to |S| = 1 this batch is <b>${bs}×</b> less noisy${R.dead?'<br><span style="color:var(--critical)">run stopped: the iterate passed 10⁶ — γ is too big for this batch</span>':''}`;
    if(bs>=N){ verd.className='verdict good'; verd.textContent='✓ |S| = 40: the exact gradient — smooth, but every step costs all the data'; }
    else if(mode==='decay'){ verd.className='verdict good'; verd.textContent='✓ decaying γ: the jitter shrinks as t grows — the average of many small noisy steps is the true step'; }
    else if(bs<=2){ verd.className='verdict info'; verd.textContent=`|S| = ${bs}: each step is ${Math.round(N/bs)}× cheaper, the direction is noisy, the walk jitters around the bottom`; }
    else { verd.className='verdict info'; verd.textContent='bigger batch → less variance (∝ 1/|S|) → smoother, dearer steps'; }
  }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  document.getElementById('sg-play').addEventListener('click',()=>{ stop(); const tok=run; shown=1; draw(); const next=()=>{ if(tok!==run) return; if(shown>=R.pts.length){ shown=99999; return; } anim=tween(30,()=>{},()=>{ shown++; draw(); next(); }); }; next(); });
  document.getElementById('sg-reset').addEventListener('click',()=>{ stop(); shown=1; draw(); });
  bindCtl('sg-batch',v=>{ stop(); shown=99999; bi=v|0; R=null; draw(); },v=>String(SIZES[v|0]))();
  bindCtl('sg-g',v=>{ stop(); shown=99999; g=v; R=null; draw(); },v=>fmt(v,3))();
  bindCtl('sg-T',v=>{ stop(); shown=99999; T=v|0; R=null; draw(); },v=>String(v|0))();
  tabs(document.getElementById('sg-tabs'),t=>{ stop(); shown=99999; mode=t; R=null; draw(); });
  const bar=document.getElementById('sg-start'), PRE={origin:[0,0],far:[3.2,-1.2]};
  bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ if(!PRE[btn.dataset.p]) return; pressOnly(bar,btn); stop(); shown=99999; start=PRE[btn.dataset.p].slice(); R=null; draw(); }));
  draw();
})();

/* ================= OPENING SHOT · the descent (five starts, two basins) ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced;
  const f=(x,y)=>0.5*(x*x-1)*(x*x-1)+0.6*y*y+0.2*x, fx=x=>2*x*(x*x-1)+0.2, fy=y=>1.2*y;
  const ZS=.34, GAM=0.16, STEP=.42, HOLD=1.3, FADE=.7, X=[-2.1,2.1], Y=[-1.7,1.7];
  const STARTS=[[1.9,1.3],[-0.3,-1.5],[1.6,-1.2],[-1.9,0.9],[-0.35,1.55]];   /* two starts end in the shallow right basin, three in the deep left one */
  function descent(s){ const pts=[s.slice()]; let p=s.slice(); for(let k=0;k<34;k++){ const g=[fx(p[0]),fy(p[1])]; if(Math.hypot(g[0],g[1])<0.03) break; p=[p[0]-GAM*g[0],p[1]-GAM*g[1]]; pts.push(p.slice()); } return pts; }
  const P3=(x,y,z)=>[x,z*ZS,-y], at=p=>P3(p[0],p[1],f(p[0],p[1]));
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:.045,autoRotateStopsOnUser:true,
      camera:{pos:wide?[5.2,5.4,7.2]:[2.2,6.2,7.8],look:wide?[-0.9,.55,.2]:[0,.3,.2],fov:32},
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        if(!isLight){ const n=600, sp=new Float32Array(n*3); for(let k=0;k<n;k++){ let x,y,z; do{ x=(Math.random()*2-1)*26; y=(Math.random()*2-1)*14; z=(Math.random()*2-1)*26-6; }while(Math.hypot(x-5,y-5,z-7)<7); sp[3*k]=x; sp[3*k+1]=y; sp[3*k+2]=z; }
          const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
          root.add(new THREE.Points(sg,new THREE.PointsMaterial({color:hx('ink2'),size:.06,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}))); }
        const surf=CIN.prim.surface(ctx,f,{x:X,y:Y,res:80,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:isLight?.97:.93}); lightenSurface(ctx,surf,ZS); root.add(surf);
        { const vis=fadeAttr(THREE,surf), pos=surf.userData.geo.attributes.position; for(let i=0;i<pos.count;i++){ const u=pos.getX(i)/X[1], v=pos.getZ(i)/Y[1], r=Math.pow(Math.pow(Math.abs(u),4)+Math.pow(Math.abs(v),4),.25); vis.setX(i,r<.82?1:Math.max(0,1-(r-.82)/.18)); } vis.needsUpdate=true; }
        const floorY=surf.userData.zmin*ZS-.28;
        const grid=CIN.prim.grid(ctx,9,18,hx('grid'),{opacity:isLight?.35:.22}); grid.position.y=floorY; root.add(grid);
        const walker=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.06),12); root.add(walker);
        const halo=haloSprite(ctx,hx('s4'),.55); root.add(halo);
        const gArr=overlay(CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s2'),{radius:.028,head:.16}),11), sArr=overlay(CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s3'),{radius:.028,head:.16}),11); root.add(gArr,sArr);
        const live=tube(ctx,[0,0,0],[0,1,0],hx('s3'),.02); live.visible=false; root.add(live);
        const trailG=new THREE.Group(); root.add(trailG); const lab=slot(ctx,root);
        const dark=!isLight; let trail=null;
        const st={si:0,path:descent(STARTS[0]),k:0,phase:'step',t0:null};
        const setTrail=(pts,op)=>{ clearGroup(trailG); trail=null; if(pts.length>=2){ trail=ribbon(ctx,pts.map(p=>{ const q=at(p); q[1]+=.012; return q; }),hx('s3'),.02); trail.material.transparent=true; trail.material.opacity=op==null?1:op; trailG.add(trail); } };
        const place=(pos,k)=>{ const q=at(pos); walker.position.set(q[0],q[1]+.012,q[2]); halo.position.copy(walker.position);
          const g=[fx(pos[0]),fy(pos[1])], gn=Math.hypot(g[0],g[1]);
          if(gn>.02){ const Lg=Math.min(1.2,.5*Math.sqrt(gn)); gArr.visible=true; gArr.userData.set([q[0],q[1]+.05,q[2]],[q[0]+g[0]/gn*Lg,q[1]+.05,q[2]-g[1]/gn*Lg]);
            const s=[-GAM*g[0],-GAM*g[1]], sl=Math.hypot(s[0],s[1]), c=sl>1.2?1.2/sl:(sl<.12?.12/sl:1); sArr.visible=sl>.004; if(sArr.visible) sArr.userData.set([q[0],q[1]+.05,q[2]],[q[0]+s[0]*c,q[1]+.05,q[2]-s[1]*c]); }
          else { gArr.visible=false; sArr.visible=false; }
          lab.set(`step ${k} · f = ${nm(f(pos[0],pos[1]).toFixed(2))}`,[q[0],q[1]+.34,q[2]],{size:20,color:colors.s4,bg:false,depthTest:false,scale:.0075}); };
        ctx.hero={apply(t){ if(st.t0==null) st.t0=t; const P=st.path; let changed=true;
          if(box.dataset.phase!==st.phase) box.dataset.phase=st.phase;   /* verify hook */
          if(st.phase==='step'){ const u=Math.min(1,(t-st.t0)/STEP), e=CIN.ease.out(u), a=P[st.k], b=P[st.k+1]||a; const pos=[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e];
            place(pos,st.k); const qa=at(a), qb=at(pos); qa[1]+=.012; qb[1]+=.012; live.visible=u<1&&st.k<P.length-1; if(live.visible) aimTube(THREE,live,qa,qb);
            if(u>=1){ if(st.k<P.length-1){ st.k++; setTrail(P.slice(0,st.k+1)); place(P[st.k],st.k); } if(st.k>=P.length-1){ st.phase='hold'; walker.scale.set(1,1,1); } st.t0=t; } }
          else if(st.phase==='hold'){ const u=(t-st.t0)/HOLD, s=1+.3*Math.abs(Math.sin(Math.PI*u*2)); walker.scale.set(s,s,s); halo.material.opacity=(dark?.65:.32)*(0.8+.4*Math.abs(Math.sin(Math.PI*u*2)));
            if(u>=1){ st.phase='fade'; st.t0=t; walker.scale.set(1,1,1); } }
          else { const u=Math.min(1,(t-st.t0)/FADE); if(trail) trail.material.opacity=1-u; halo.material.opacity=(dark?.65:.32)*(1-u); walker.material.opacity=1-u; lab.hide();
            if(u>=1){ st.si=(st.si+1)%STARTS.length; st.path=descent(STARTS[st.si]); st.k=0; st.phase='step'; st.t0=t; setTrail([]); walker.material.opacity=1; halo.material.opacity=dark?.65:.32; place(st.path[0],0); } }
          return changed; }};
        if(reduced){ const P=st.path; setTrail(P); place(P[P.length-1],P.length-1); live.visible=false; }
        else { place(st.path[0],0); }
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.apply(t); }
    });
  }
  const S=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(S); rw=innerWidth; });
})();
