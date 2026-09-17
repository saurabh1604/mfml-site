/* ================= UNIT 11 · local helpers (on top of the house runtime) ================= */
const SUB=n=>String(n).split('').map(c=>'₀₁₂₃₄₅₆₇₈₉'[+c]||c).join('');
const SUP=n=>String(n).replace(/-/g,'−').split('').map(c=>({'−':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'})[c]||c).join('');
const nm=s=>String(s).replace(/-/g,'−');                       /* a real minus sign in readouts */
const F=(v,d)=>nm((+v).toFixed(d==null?2:d));                  /* fixed width, minus sign */
const sci=(v,d)=>nm((+v).toExponential(d==null?2:d)).replace('e+','e');
const trim=s=>s.indexOf('.')<0?s:s.replace(/0+$/,'').replace(/\.$/,'');
const T4=v=>trim(F(v,4));
const G4=v=>{ if(!isFinite(v)) return v>0?'\u221e':'\u2212\u221e'; const a=Math.abs(v); if(a===0) return '0'; if(a>=1e5||a<1e-4) return sci(v,2); return trim(F(v,a<0.001?7:(a<1?6:4))); };
const big=(v,d)=>{ const a=Math.abs(v); return (!isFinite(v))?(v>0?'∞':'−∞'):(a>=1e5||(a>0&&a<1e-4))?sci(v,d==null?2:d):F(v,d==null?4:d); };
const RR=ctx=>{ if(ctx&&ctx.requestRender) ctx.requestRender(); };
const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue('--'+n).trim();
const angleDeg=(u,v)=>{ const nu=Math.hypot(u[0],u[1]), nv=Math.hypot(v[0],v[1]); if(nu<1e-12||nv<1e-12) return NaN; return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/(nu*nv))))*180/Math.PI; };
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
  return {px,py,glow,clip:'url(#'+cid+')',W,H,L,R,T,B,X0,X1,Y0,Y1,svg,
    cx:v=>Math.max(px(X0),Math.min(px(X1),v)), cy:v=>Math.max(py(Y1),Math.min(py(Y0),v)),
    ix:X=>X0+(X-L)/(W-L-R)*(X1-X0), iy:Y=>Y0+(H-B-Y)/(H-T-B)*(Y1-Y0)}; }
/* a framed sub-panel inside an existing SVG — never clears the SVG, so several live side by side */
let _pn=0;
function panel(svg,x,y,w,h,X0,X1,Y0,Y1,o){ o=o||{};
  const px=v=>x+(v-X0)/((X1-X0)||1)*w, py=v=>y+h-(v-Y0)/((Y1-Y0)||1)*h;
  const g=el('g',{},svg), defs=svg.querySelector('defs')||el('defs',{},svg);
  const id='pc'+(++_pn)+'-'+(svg.id||'s'); const cp=el('clipPath',{id},defs); el('rect',{x,y,width:w,height:h},cp);
  if(o.bg!==false) el('rect',{x,y,width:w,height:h,rx:8,fill:o.fill||'none',stroke:'var(--line, var(--ring))',opacity:.55},g);
  const tf='font:500 9.5px system-ui;fill:var(--ink-muted)', z=v=>Math.abs(v)<1e-9?0:v;
  if(o.xs) for(let i=Math.ceil(X0/o.xs-1e-9);i*o.xs<=X1+1e-9;i++){ const v=i*o.xs,X=px(v); el('line',{x1:X,y1:y,x2:X,y2:y+h,stroke:'var(--grid)','stroke-width':1},g); if(o.xt!==false) txt(svg,X,y+h+12,o.xf?o.xf(z(v)):nm(fmt(z(v),2)),tf,'middle'); }
  if(o.ys) for(let i=Math.ceil(Y0/o.ys-1e-9);i*o.ys<=Y1+1e-9;i++){ const v=i*o.ys,Y=py(v); el('line',{x1:x,y1:Y,x2:x+w,y2:Y,stroke:'var(--grid)','stroke-width':1},g); if(o.yt!==false) txt(svg,x-5,Y+3.5,o.yf?o.yf(z(v)):nm(fmt(z(v),2)),tf,'end'); }
  if(Y0<0&&Y1>0) el('line',{x1:x,y1:py(0),x2:x+w,y2:py(0),stroke:'var(--axis)','stroke-width':1.4},g);
  if(X0<0&&X1>0) el('line',{x1:px(0),y1:y,x2:px(0),y2:y+h,stroke:'var(--axis)','stroke-width':1.4},g);
  if(o.title) txt(svg,x,y-6,o.title,'font:700 10px system-ui;fill:var(--ink-muted)');
  return {px,py,g,clip:'url(#'+id+')',x,y,w,h,X0,X1,Y0,Y1,svg,
    cx:v=>Math.max(x,Math.min(x+w,v)), cy:v=>Math.max(y,Math.min(y+h,v)),
    ix:X=>X0+(X-x)/w*(X1-X0), iy:Y=>Y0+(y+h-Y)/h*(Y1-Y0)}; }
/* a glowing straight segment: an axis-aligned line under the glow filter vanishes — fake the halo with a wide translucent underlay */
function glowLine(parent,x1,y1,x2,y2,color,w,glow,extra){ const g=el('g',{},parent);
  if(glow) el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':w*3.2,'stroke-linecap':'round',opacity:.22},g);
  el('line',Object.assign({x1,y1,x2,y2,stroke:color,'stroke-width':w,'stroke-linecap':'round'},extra||{}),g); return g; }
/* a glowing polyline (halo underlay + crisp stroke) */
function glowPath(parent,d,color,w,glow,extra){ if(!d) return null; const g=el('g',{},parent);
  if(glow) el('path',{d,stroke:color,'stroke-width':w*3,fill:'none','stroke-linejoin':'round','stroke-linecap':'round',opacity:.2},g);
  el('path',Object.assign({d,stroke:color,'stroke-width':w,fill:'none','stroke-linejoin':'round','stroke-linecap':'round'},extra||{}),g); return g; }
/* a 45° hatch for a banned region */
function hatchPat(svg,id,color,op){ const defs=svg.querySelector('defs')||el('defs',{},svg);
  if(!defs.querySelector('#'+id)){ const pat=el('pattern',{id,width:8,height:8,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);
    el('line',{x1:0,y1:0,x2:0,y2:8,stroke:color,'stroke-width':2.2,opacity:op==null?.55:op},pat); } return 'url(#'+id+')'; }
/* pointer drag anywhere on an SVG, in viewBox coordinates */
function svgDrag(svg,onDown,onMove,onUp){ let on=false; svg.style.touchAction='none';
  const pt=e=>{ const r=svg.getBoundingClientRect(),W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height;
    return [(e.clientX-r.left)/(r.width||1)*W,(e.clientY-r.top)/(r.height||1)*H]; };
  svg.addEventListener('pointerdown',e=>{ const q=pt(e); if(onDown&&onDown(q[0],q[1])===false) return; on=true; try{svg.setPointerCapture(e.pointerId);}catch(_){} onMove(q[0],q[1]); e.preventDefault(); });
  svg.addEventListener('pointermove',e=>{ if(!on) return; const q=pt(e); onMove(q[0],q[1]); });
  const up=()=>{ if(!on) return; on=false; onUp&&onUp(); };
  svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',up); }
/* in the light theme the surface ramp is washed toward white so the landscape reads on a pale page */
function lightenSurface(ctx,surf,zs,ramp){ if(!ctx.isLight) return; const T=ctx.THREE, geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color, {zmin,zmax}=surf.userData;
  const c=ctx.colors, a=ramp||[c.s1,c.s7,c.s2], white=new T.Color(1,1,1);
  for(let i=0;i<pos.count;i++){ const t=(pos.getY(i)/zs-zmin)/((zmax-zmin)||1); const k=new T.Color(CIN.ramp(t,a[0],a[1],a[2])).lerp(white,.42).convertSRGBToLinear(); col.setXYZ(i,k.r,k.g,k.b); } col.needsUpdate=true; }
function clearGroup(g){ while(g.children.length){ const c=g.children[g.children.length-1]; g.remove(c);
  c.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ (Array.isArray(m.material)?m.material:[m.material]).forEach(x=>{ if(x.map&&x.map!==_spark) x.map.dispose(); x.dispose(); }); } }); } }
/* a soft glowing halo sprite (additive in the dark theme; plain alpha on a pale page) */
function haloSprite(ctx,color,size){ const T=ctx.THREE; const m=new T.SpriteMaterial({map:sparkTex(T),color,transparent:true,opacity:ctx.isLight?.32:.65,blending:ctx.isLight?T.NormalBlending:T.AdditiveBlending,depthWrite:false,depthTest:false}); const s=new T.Sprite(m); s.scale.set(size,size,1); s.renderOrder=14; return s; }
/* a glowing polyline through 3D points: one lit tube per segment (no smoothing — zig-zags must stay sharp) */
function polyTube(ctx,pts,color,r,beads){ const g=new ctx.THREE.Group(); for(let i=0;i+1<pts.length;i++) g.add(tube(ctx,pts[i],pts[i+1],color,r));
  if(beads!==false) pts.forEach(p=>g.add(CIN.prim.dot(ctx,p,color,r*1.8))); return g; }
/* rewrite a prim.surface in place (position + colour + normals) — the live morph primitive */
function reshape(ctx,surf,fs,zs,ramp,gamma){ const T=ctx.THREE, geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color, n=pos.count;
  const zv=surf.userData.zv||(surf.userData.zv=new Float32Array(n)); let zmin=Infinity,zmax=-Infinity;
  for(let i=0;i<n;i++){ const z=fs(pos.getX(i),-pos.getZ(i)); zv[i]=isFinite(z)?z:0; if(zv[i]<zmin) zmin=zv[i]; if(zv[i]>zmax) zmax=zv[i]; }
  const c=ctx.colors, a=ramp||[c.s1,c.s7,c.s2], key=a.join('|')+(ctx.isLight?'L':'D');
  if(!surf.userData.lut||surf.userData.lutKey!==key){ const white=new T.Color(1,1,1), lut=[]; for(let k=0;k<64;k++){ const K=new T.Color(CIN.ramp(k/63,a[0],a[1],a[2])); if(ctx.isLight) K.lerp(white,.42); lut.push(K.convertSRGBToLinear()); } surf.userData.lut=lut; surf.userData.lutKey=key; }
  const lut=surf.userData.lut, span=(zmax-zmin)||1;
  for(let i=0;i<n;i++){ pos.setY(i,zv[i]*zs); const K=lut[Math.max(0,Math.min(63,Math.round(Math.pow((zv[i]-zmin)/span,gamma||1)*63)))]; col.setXYZ(i,K.r,K.g,K.b); }
  pos.needsUpdate=true; col.needsUpdate=true; geo.computeVertexNormals(); surf.userData.zmin=zmin; surf.userData.zmax=zmax; surf.userData.mesh.frustumCulled=false; return {zmin,zmax}; }
function pressOnly(bar,btn){ if(bar) bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===btn?'true':'false')); }
function setCtl(id,v,d){ const r=document.getElementById(id), o=document.getElementById(id+'-o'); if(r) r.value=v; if(o) o.textContent=typeof d==='function'?d(v):nm(fmt(v,d==null?2:d)); }
/* show only the blocks whose data-tab matches (blocks with no data-tab are always shown) */
function showTab(root,key){ root.querySelectorAll('[data-tab]').forEach(n=>{ n.style.display=(n.dataset.tab===key)?'':'none'; }); }

/* ---- the five methods keep ONE colour each for the whole unit ---- */
const M5=[{k:'gd',n:'Gradient descent',s:'GD',c:'s1'},{k:'mom',n:'Momentum',s:'Momentum',c:'s3'},{k:'ada',n:'AdaGrad',s:'AdaGrad',c:'critical'},{k:'rms',n:'RMSProp',s:'RMSProp',c:'s2'},{k:'adam',n:'Adam',s:'Adam',c:'s4'}];
const CV=k=>'var(--'+k+')';

/* ---- the one loss the whole first act shares: J = ½w₁² + (c/2)w₂², ∇J = (w₁, c w₂) ---- */
const OPT=(function(){
  const EPS=1e-12, BIG=1e6;
  const J=(w,c)=>0.5*w[0]*w[0]+(c==null?10:c)/2*w[1]*w[1];
  const G=(w,c)=>[w[0],(c==null?10:c)*w[1]];
  const rateOf=(t,a,rF,rA)=>{ const den=1-Math.pow(rF,t); return a*Math.sqrt(Math.max(0,1-Math.pow(rA,t)))/(den>1e-12?den:1e-12); };
  function trace(kind,o){ o=o||{};
    const c=o.c==null?10:o.c, a=o.alpha==null?0.1:o.alpha, N=o.N==null?25:o.N,
          be=o.beta==null?0.9:o.beta, rho=o.rho==null?0.9:o.rho, rA=o.rhoA==null?0.999:o.rhoA, rF=o.rhoF==null?0.9:o.rhoF;
    let w=(o.w0||[1,1]).slice(), v=[0,0], A=[0,0], Fm=[0,0], dead=false, deadAt=-1;
    const out=[{t:0,w:w.slice(),J:J(w,c),g:G(w,c),step:[0,0],A:[0,0],Fm:[0,0],at:a,stride:[a,a]}];
    for(let t=1;t<=N;t++){
      if(dead){ out.push({t,w:w.slice(),J:Infinity,g:[0,0],step:[0,0],A:A.slice(),Fm:Fm.slice(),at:a,stride:[0,0],dead:true}); continue; }
      const g=G(w,c); let st=[0,0], at=a, stride=[a,a];
      if(kind==='gd'){ st=[a*g[0],a*g[1]]; }
      else if(kind==='mom'){ v=[be*v[0]-a*g[0],be*v[1]-a*g[1]]; st=[-v[0],-v[1]]; }
      else if(kind==='ada'){ A=[A[0]+g[0]*g[0],A[1]+g[1]*g[1]]; stride=[a/(Math.sqrt(A[0])+EPS),a/(Math.sqrt(A[1])+EPS)]; st=[stride[0]*g[0],stride[1]*g[1]]; }
      else if(kind==='rms'){ A=[rho*A[0]+(1-rho)*g[0]*g[0],rho*A[1]+(1-rho)*g[1]*g[1]]; stride=[a/(Math.sqrt(A[0])+EPS),a/(Math.sqrt(A[1])+EPS)]; st=[stride[0]*g[0],stride[1]*g[1]]; }
      else { Fm=[rF*Fm[0]+(1-rF)*g[0],rF*Fm[1]+(1-rF)*g[1]]; A=[rA*A[0]+(1-rA)*g[0]*g[0],rA*A[1]+(1-rA)*g[1]*g[1]];
             at=rateOf(t,a,rF,rA); stride=[at/(Math.sqrt(A[0])+EPS),at/(Math.sqrt(A[1])+EPS)]; st=[stride[0]*Fm[0],stride[1]*Fm[1]]; }
      const nw=[w[0]-st[0],w[1]-st[1]];
      if(!isFinite(nw[0])||!isFinite(nw[1])||Math.abs(nw[0])>BIG||Math.abs(nw[1])>BIG){ dead=true; deadAt=t;
        out.push({t,w:w.slice(),J:Infinity,g,step:st,A:A.slice(),Fm:Fm.slice(),at,stride,dead:true}); continue; }
      w=nw; out.push({t,w:w.slice(),J:J(w,c),g,step:st,A:A.slice(),Fm:Fm.slice(),at,stride});
    }
    out.dead=dead; out.deadAt=deadAt; return out; }
  return {J,G,trace,rateOf}; })();
/* self-check: the companion's five traces on c = 10, α = 0.1 from [1, 1] */
(function(){ const want={gd:[0.3281,0.0025769],mom:[4.3092,0.19587],ada:[3.8173,0.54743],rms:[1.3688,3.599e-13],adam:[3.5236,0.17930]}, bad=[];
  const got=M5.map(m=>{ const T=OPT.trace(m.k,{c:10,alpha:.1,N:25}); const a=T[2].J, b=T[25].J, w=want[m.k];
    if(Math.abs(a-w[0])>5e-4||Math.abs(b-w[1])>Math.max(1e-4,Math.abs(w[1])*.01)) bad.push(m.k);
    return m.s+' '+a.toFixed(4)+' → '+(b<1e-6?b.toExponential(3):b.toFixed(5)); });
  console.info('U11 five methods · J after 2 → J after 25: '+got.join(' · '));
  if(bad.length) console.warn('U11: traces differ from the companion for '+bad.join(', ')); })();

/* ================= W1 · YOUR FEET FEEL THE TILT, NOT THE TURN (three.js + profile panel) ================= */
(function(){
  const box=document.getElementById('w-feel'),stage=document.getElementById('fl-3d'),side=document.getElementById('fl-side'),read=document.getElementById('fl-read'),verd=document.getElementById('fl-verdict');
  if(!box||!stage) return;
  const U=2.4,V=1.2;                                   /* stage half-widths */
  const sg=u=>1/(1+Math.exp(-Math.max(-60,Math.min(60,u))));
  const cf=x=>1.8*sg(-6*(x+1.2))+0.05*x;
  const cfd=x=>{ const s=sg(-6*(x+1.2)); return -10.8*s*(1-s)+0.05; };
  const cfd2=x=>{ const s=sg(-6*(x+1.2)); return 64.8*s*(1-s)*(2*s-1); };
  const XC=4, YC=1.6, PROBE=0.5;                       /* the cliff domain and the confident stride */
  const toX=u=>u*XC/U, toU=x=>x*U/XC;
  const VF=(u,v)=>0.5*u*u+5*v*v, CFS=(u,v)=>cf(toX(u))+0.15*(v*YC/V)*(v*YC/V);
  let tab='valley',eta=0.10,K=12,cx=-3.0,sc=null,hudEl=null,anim=null,run=0,ST=null,shown=0,trace=null;
  const FS=(u,v)=>tab==='valley'?VF(u,v):CFS(u,v);
  const ZB=()=>tab==='valley'?0:0.19, ZS=()=>tab==='valley'?1.7/10.08:1.7/1.80;
  const P3=(u,v,z)=>[u,(z-ZB())*ZS(),-v];
  const clampW=w=>[Math.max(-U,Math.min(U,w[0])),Math.max(-V,Math.min(V,w[1]))];
  function path(){ const p=[[1,1]]; let w=[1,1];
    for(let i=0;i<K;i++){ w=[(1-eta)*w[0],(1-10*eta)*w[1]]; if(!isFinite(w[0])||!isFinite(w[1])||Math.abs(w[1])>1e4){ p.push(w.slice()); break; } p.push(w.slice()); }
    return p; }
  function levels(){ const lv=[]; const zm=tab==='valley'?10.08:1.80; for(let i=1;i<=8;i++) lv.push(ZB()+zm*Math.pow(i/9,tab==='valley'?2:1.1)); return lv; }
  function build(){ sc=null; const narrow=stage.clientWidth<560;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:narrow?[3.4,3.6,5.2]:[3.0,3.0,4.6],look:[0,.45,0],fov:36},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        const surf=CIN.prim.surface(ctx,FS,{x:[-U,U],y:[-V,V],res:76,zscale:1,ramp:[colors.s1,colors.s7,colors.s2],opacity:.95,wire:false}); root.add(surf);
        reshape(ctx,surf,(u,v)=>FS(u,v)-ZB(),ZS(),null,.7);
        const floorY=-.22; const grid=CIN.prim.grid(ctx,5.4,18,hx('grid'),{opacity:isLight?.45:.28}); grid.position.y=floorY; root.add(grid);
        const contG=new THREE.Group(); root.add(contG);
        const star=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s3'),.05)); root.add(star);
        const walker=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.075),12); root.add(walker);
        const halo=haloSprite(ctx,hx('s4'),.6); root.add(halo);
        const ghost=overlay(CIN.prim.dot(ctx,[0,0,0],hx('ink2'),.05),11); ghost.material.opacity=.55; ghost.visible=false; root.add(ghost);
        const tiltA=overlay(CIN.prim.arrow(ctx,[0,0,0],[.2,0,0],hx('s2'),{radius:.022,head:.14}),13); root.add(tiltA);
        const stepA=overlay(CIN.prim.arrow(ctx,[0,0,0],[.2,0,0],hx('s3'),{radius:.017,head:.12}),13); root.add(stepA);
        const trailG=new THREE.Group(); root.add(trailG); const lab=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,surf,contG,star,walker,halo,ghost,tiltA,stepA,trailG,lab,floorY};
        hudEl=hud(stage); hint(stage,'drag to orbit'); rebuild(); }, update(){ return false; } });
    if(handle) grab(handle,()=>false,()=>{});
    return handle; }
  function rebuild(){ if(!sc) return; const {ctx,hx}=sc;
    reshape(ctx,sc.surf,(u,v)=>FS(u,v)-ZB(),ZS(),null,.7);
    clearGroup(sc.contG); sc.contG.add(liftedContours(ctx,(u,v)=>FS(u,v)-ZB(),levels().map(l=>l-ZB()),-U,U,-V,V,ZS(),hx('ink2'),{N:70}));
    sc.star.visible=tab==='valley'; if(tab==='valley'){ const q=P3(0,0,0); sc.star.position.set(q[0],q[1]+.01,q[2]); }
    paint(); }
  function paint(cur){ if(!sc) return; const {walker,halo,ghost,tiltA,stepA,lab,ctx}=sc;
    if(tab==='valley'){ const raw=cur||(trace?trace[Math.min(shown,trace.length-1)]:[1,1]), w=clampW(raw);
      const off=Math.abs(raw[0])>U*1.001||Math.abs(raw[1])>V*1.001;
      walker.visible=!off; halo.visible=!off;
      const q=P3(w[0],w[1],VF(w[0],w[1])); walker.position.set(q[0],q[1]+.012,q[2]); halo.position.copy(walker.position);
      ghost.visible=false; tiltA.visible=false; stepA.visible=false;
      if(off) lab.hide(); else lab.set('step '+shown,[q[0],q[1]+.3,q[2]],{size:18,color:sc.colors.s4,bg:false,depthTest:false,scale:.006});
      if(hudEl) hudEl.innerHTML='η = <b>'+F(eta,3)+'</b> · step <b>'+shown+'</b> · J = <b>'+big(VF(w[0],w[1]),4)+'</b>'; }
    else { walker.visible=true; halo.visible=true; const x=cur==null?cx:cur, u=toU(x), z=cf(x), q=P3(u,0,z+0);
      walker.position.set(q[0],q[1]+.012,q[2]); halo.position.copy(walker.position);
      const d=cfd(x), dir=d>0?-1:1, xl=Math.max(-XC,Math.min(XC,x+dir*PROBE));
      const tl=Math.max(.12,Math.min(.9,Math.abs(d)*.35)); tiltA.visible=true; stepA.visible=true;
      tiltA.userData.set([q[0],q[1]+.05,q[2]],[q[0]-dir*tl,q[1]+.05,q[2]]);               /* uphill: the tilt you feel */
      stepA.userData.set([q[0],q[1]+.12,q[2]],[toU(xl),q[1]+.12,q[2]]);                    /* the step you take */
      const ql=P3(toU(xl),0,cf(xl)); ghost.visible=true; ghost.position.set(ql[0],ql[1]+.012,ql[2]);
      lab.set('|f′| = '+F(Math.abs(d),3),[q[0],q[1]+.3,q[2]],{size:18,color:sc.colors.s2,bg:false,depthTest:false,scale:.006});
      if(hudEl) hudEl.innerHTML='x = <b>'+F(x,2)+'</b> · |f′| here <b>'+F(Math.abs(d),4)+'</b> · one stride ahead <b>'+F(Math.abs(cfd(xl)),4)+'</b>'; }
    RR(ctx); }
  function paintTrail(n){ if(!sc||tab!=='cliff'&&!trace) return; clearGroup(sc.trailG);
    if(tab!=='valley'||!trace) { RR(sc.ctx); return; }
    const N=Math.max(1,(n==null?shown:n)), pts=[]; let gone=-1;
    for(let i=0;i<=Math.min(N,trace.length-1);i++){ const w=trace[i];
      if(Math.abs(w[0])>U*1.001||Math.abs(w[1])>V*1.001){ gone=i; break; }
      const q=P3(w[0],w[1],VF(w[0],w[1])); q[1]+=.014; pts.push(q); }
    if(pts.length>=2) sc.trailG.add(polyTube(sc.ctx,pts,sc.hx('s4'),.018));
    if(gone>0&&pts.length){ const q=pts[pts.length-1];
      sc.trailG.add(lab(sc.ctx,'off the map at step '+gone,[q[0],q[1]+.34,q[2]],{size:17,color:cssv('critical'),bg:false,depthTest:false,scale:.006})); }
    RR(sc.ctx); }
  /* ---- the side profile panel ---- */
  function drawSide(){ side.innerHTML=''; const glow=glo(side);
    if(tab==='valley'){
      const p=panel(side,42,26,242,152,-1.3,1.3,0,7.6,{id:'v',xs:.5,ys:2,title:'the same loss, one direction at a time'});
      const cur=trace?clampW(trace[Math.min(shown,trace.length-1)]):[1,1];
      el('rect',{x:104,y:32,width:118,height:32,rx:6,fill:'var(--surface)',opacity:.86},side);
      [[0.5,'var(--s1)','along w₁ : ½w₁²',cur[0]],[5,'var(--s2)','along w₂ : 5w₂²',cur[1]]].forEach(([a,col,name,val],i)=>{
        let d=''; for(let j=0;j<=80;j++){ const s=-1.3+2.6*j/80, y=a*s*s; d+=(j?'L':'M')+p.px(s).toFixed(1)+','+p.cy(p.py(Math.min(7.6,y))).toFixed(1); }
        glowPath(side,d,col,2.4,glow,{'clip-path':p.clip});
        const sv=Math.max(-1.3,Math.min(1.3,val)); glowDot(side,p.px(sv),p.cy(p.py(Math.min(7.6,a*sv*sv))),4.2,col,glow);
        txt(side,110,46+i*14,name,'font:700 9.5px system-ui;fill:'+col); });
      txt(side,42+121,196,'both drawn on the same axes — the right-hand bowl is 10× steeper','font:600 8.6px system-ui;fill:var(--ink-muted)','middle');
      txt(side,42+121,208,'one η must serve both','font:700 9px system-ui;fill:var(--s4)','middle');
    } else {
      const p=panel(side,40,26,244,150,-4,4,-0.05,2.1,{id:'c',xs:2,ys:.5,title:'the shelf, and the ledge'});
      let d=''; for(let j=0;j<=160;j++){ const x=-4+8*j/160; d+=(j?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(cf(x))).toFixed(1); }
      glowPath(side,d,'var(--s1)',2.4,glow,{'clip-path':p.clip});
      const dd=cfd(cx), dir=dd>0?-1:1, xl=Math.max(-4,Math.min(4,cx+dir*PROBE));
      el('rect',{x:Math.min(p.px(cx),p.px(xl)),y:p.y,width:Math.abs(p.px(xl)-p.px(cx)),height:p.h,fill:'var(--s3)',opacity:.13},side);
      glowDot(side,p.px(cx),p.cy(p.py(cf(cx))),4.5,'var(--s4)',glow);
      el('circle',{cx:p.px(xl),cy:p.cy(p.py(cf(xl))),r:4,fill:'none',stroke:'var(--ink-muted)','stroke-width':1.6},side);
      txt(side,p.px(cx),p.y-0,'','font:600 9px system-ui');
      txt(side,162,196,'the shaded band is one confident stride of '+PROBE,'font:600 8.6px system-ui;fill:var(--ink-muted)','middle');
      txt(side,162,208,'the slope at its far end is what you actually meet','font:700 9px system-ui;fill:var(--s2)','middle');
    } }
  function draw(){ const glowOK=true;
    if(tab==='valley'){ const f1=1-eta, f2=1-10*eta;
      const n1=Math.abs(f1)<1?Math.ceil(Math.log(0.01)/Math.log(Math.abs(f1))):Infinity;
      const w=trace?trace[Math.min(shown,trace.length-1)]:[1,1];
      read.innerHTML='slopes at [1, 1]:  ∂J/∂w₁ = <b>1</b> · ∂J/∂w₂ = <b>10</b>  (10 : 1)<br>'+
        'per-step factor:  w₁ × <b>1−η</b> = <b>'+F(f1,3)+'</b>  ·  w₂ × <b>1−10η</b> = <b>'+F(f2,3)+'</b><br>'+
        'steps for w₁ to get within 1 % of 0: <b>'+(isFinite(n1)?String(n1):'never')+'</b><br>'+
        'now at w = (<b>'+big(w[0],4)+'</b>, <b>'+big(w[1],4)+'</b>), J = <b>'+big(0.5*w[0]*w[0]+5*w[1]*w[1],4)+'</b> after <b>'+shown+'</b> steps';
      if(Math.abs(eta-0.2)<=0.003){ verd.className='verdict info'; verd.textContent='info — w₂ locked in a standing oscillation, factor exactly −1'; }
      else if(eta<0.2){ verd.className='verdict good'; verd.textContent='good — w₂ settles, w₁ crawls'; }
      else { verd.className='verdict bad'; verd.textContent='bad — w₂ diverges, and w₁ is still crawling'; }
    } else {
      const d0=cfd(cx), dir=d0>0?-1:1, xl=Math.max(-4,Math.min(4,cx+dir*PROBE)), d1=cfd(xl), r=Math.abs(d1)/(Math.abs(d0)||1e-12);
      read.innerHTML='|f′| here = <b>'+F(Math.abs(d0),4)+'</b>   |f′| one stride ahead (x = '+F(xl,2)+') = <b>'+F(Math.abs(d1),4)+'</b>   ratio = <b>'+(r>=1e4?sci(r,1):F(r,2))+'×</b><br>'+
        'first-order information has no word for "and it stops in 5 cm"<br>'+
        'f″ here = <b>'+F(cfd2(cx),3)+'</b> · f″ there = <b>'+F(cfd2(xl),3)+'</b><br>'+
        'the Hessian would warn you — and costs d² numbers per step';
      if(r>20){ verd.className='verdict bad'; verd.textContent='bad — the tilt you trusted lasted 0.05 units; you have stepped off a ledge'; }
      else if(Math.abs(d0)<0.08){ verd.className='verdict info'; verd.textContent='info — almost no tilt here: the shelf tells you nothing about what is ahead'; }
      else { verd.className='verdict good'; verd.textContent='good — the tilt ahead is close to the tilt here, so one step of trust is safe'; }
    }
    drawSide(); paint(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function replan(){ stop(); trace=path(); shown=trace.length-1; paintTrail(); draw(); }
  function play(){ stop(); const tok=run; trace=path(); shown=0; paintTrail(0); draw();
    if(RM){ shown=trace.length-1; paintTrail(); draw(); return; }
    let k=0; const nxt=()=>{ if(tok!==run) return; if(k>=trace.length-1){ draw(); return; }
      const a=clampW(trace[k]), b=clampW(trace[k+1]);
      anim=tween(240,u=>{ if(tok!==run) return; paint([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u]); },()=>{ if(tok!==run) return; k++; shown=k; paintTrail(); draw(); nxt(); }); };
    nxt(); }
  document.getElementById('fl-play').addEventListener('click',play);
  const preBar=document.getElementById('fl-pre');
  [['fl-p-lucky',0.10],['fl-p-edge',0.20],['fl-p-blow',0.25]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{
    pressOnly(preBar,e.currentTarget); eta=v; setCtl('fl-eta',v,3); replan(); }));
  bindCtl('fl-eta',v=>{ eta=v; pressOnly(preBar,null); replan(); },v=>fmt(v,3))();
  bindCtl('fl-k',v=>{ K=v|0; replan(); },v=>String(v|0))();
  bindCtl('fl-x',v=>{ cx=v; draw(); },v=>F(v,2))();
  tabs(document.getElementById('fl-tabs'),t=>{ stop(); tab=t; showTab(box,t); rebuild(); replan(); });
  showTab(box,'valley');
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const W=stage.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  replan();
})();

/* ================= W2 · THE LOADED TROLLEY (contour map + contribution bars) ================= */
(function(){
  const box=document.getElementById('w-trolley'),svg=document.getElementById('tr-svg'),bars=document.getElementById('tr-bars'),read=document.getElementById('tr-read'),verd=document.getElementById('tr-verdict');
  if(!box||!svg) return;
  const X=1.45,Y=1.25;
  let be=0.90,eta=0.10,K=14,shown=0,anim=null,run=0,TR=null,TP=null;
  const J=w=>0.5*w[0]*w[0]+5*w[1]*w[1];
  function plan(){ const N=Math.max(K,3); TR=OPT.trace('gd',{c:10,alpha:eta,N}); TP=OPT.trace('mom',{c:10,alpha:eta,beta:be,N}); }
  const clampW=w=>[Math.max(-X,Math.min(X,w[0])),Math.max(-Y,Math.min(Y,w[1]))];
  function drawMap(cur){ const p=frame(svg,-X,X,-Y,Y,{l:40,r:20,t:30,b:28,xs:.5,ys:.5}); const glow=p.glow;
    txt(svg,p.L,p.T-11,'top-down: J = ½w₁² + 5w₂² · plain walker (blue) vs the trolley (green)','font:600 10.5px system-ui;fill:var(--ink-muted)');
    const f=(x,y)=>0.5*x*x+5*y*y, lv=[]; for(let i=1;i<=9;i++) lv.push(J([X,Y])*Math.pow(i/10,2.1));
    const gc=el('g',{'clip-path':p.clip},svg);
    contourSegs(f,lv,-X,X,-Y,Y,72).forEach((L,i)=>L.segs.forEach(s=>el('line',{x1:p.px(s[0]),y1:p.py(s[1]),x2:p.px(s[2]),y2:p.py(s[3]),stroke:'var(--s1)','stroke-width':1.1,opacity:.14+.045*i},gc)));
    glowDot(svg,p.px(0),p.py(0),4,'var(--s3)',glow); txt(svg,p.px(0)+8,p.py(0)-6,'bottom','font:700 9.5px system-ui;fill:var(--s3)');
    const n=Math.min(shown,K);
    [[TR,'var(--s1)','plain',2.1],[TP,'var(--s3)','trolley',2.6]].forEach(([T,col,name,wd])=>{
      let d=''; for(let i=0;i<=n;i++){ const w=clampW(T[i].w); d+=(i?'L':'M')+p.px(w[0]).toFixed(1)+','+p.py(w[1]).toFixed(1); }
      glowPath(gc,d,col,wd,glow,{opacity:.95});
      for(let i=0;i<=n;i++){ const w=clampW(T[i].w); el('circle',{cx:p.px(w[0]),cy:p.py(w[1]),r:2.4,fill:col,opacity:.8},gc); } });
    const wp=clampW(cur?cur[0]:TR[n].w), wt=clampW(cur?cur[1]:TP[n].w);
    glowDot(svg,p.px(wp[0]),p.py(wp[1]),5,'var(--s1)',glow);
    glowDot(svg,p.px(wt[0]),p.py(wt[1]),6,'var(--s3)',glow);
    /* the trolley's velocity, drawn from the trolley */
    const k=Math.max(1,n), v=[TP[k].w[0]-TP[k-1].w[0],TP[k].w[1]-TP[k-1].w[1]], vn=Math.hypot(v[0],v[1]);
    if(vn>1e-4){ const s=Math.min(.55,Math.max(.12,vn*1.5))/vn;
      edge(svg,p.px(wt[0]),p.py(wt[1]),p.cx(p.px(wt[0]+v[0]*s)),p.cy(p.py(wt[1]+v[1]*s)),'var(--s4)',2.6,glow);
      txt(svg,p.cx(p.px(wt[0]+v[0]*s))+6,p.cy(p.py(wt[1]+v[1]*s))-4,'v','font:800 12px system-ui;fill:var(--s4)'); }
    el('circle',{cx:p.px(1),cy:p.py(1),r:4,fill:'none',stroke:'var(--ink-muted)','stroke-width':1.5},svg);
    txt(svg,p.px(1)-8,p.py(1)-8,'start [1, 1]','font:600 9.5px system-ui;fill:var(--ink-muted)','end');
    txt(svg,p.W-p.R,p.H-6,'w₁ →','font:600 9.5px system-ui;fill:var(--ink-muted)','end');
    txt(svg,p.L-30,p.T+4,'w₂','font:600 9.5px system-ui;fill:var(--ink-muted)'); }
  function drawBars(){ bars.innerHTML=''; const glow=glo(bars); const n=Math.min(shown,K), NB=10;
    txt(bars,10,13,'the last '+NB+' pushes, each faded by β^k','font:700 9.5px system-ui;fill:var(--ink-muted)');
    [[0,'w₁','var(--s1)',32],[1,'w₂','var(--s2)',110]].forEach(([j,name,col,y0])=>{
      const parts=[]; for(let k=0;k<NB;k++){ const i=n-k; if(i<1) break; parts.push(-eta*TP[i].g[j]*Math.pow(be,k)); }
      const mx=Math.max(1e-9,...parts.map(Math.abs)), sum=parts.reduce((s,v)=>s+v,0);
      const mid=150, H=28, SC=62;
      txt(bars,10,y0-1,'along '+name,'font:700 10px system-ui;fill:'+col);
      el('line',{x1:mid,y1:y0+2,x2:mid,y2:y0+H+2,stroke:'var(--axis)','stroke-width':1.2},bars);
      parts.forEach((v,k)=>{ const bw=Math.max(-SC,Math.min(SC,v/mx*SC)), yy=y0+4+k*2.6;
        el('rect',{x:Math.min(mid,mid+bw),y:yy,width:Math.max(1.2,Math.abs(bw)),height:2.1,rx:1,fill:col,opacity:.35+.55*Math.pow(be,k)},bars); });
      const sw=Math.max(-132,Math.min(132,sum/mx*SC)), g=el('g',glow?{filter:glow}:{},bars);
      el('rect',{x:Math.min(mid,mid+sw),y:y0+H+8,width:Math.max(2,Math.abs(sw)),height:9,rx:4,fill:col},g);
      txt(bars,10,y0+H+32,'sum = '+F(sum,4),'font:700 10px system-ui;fill:'+col);
      txt(bars,290,y0+H+32,j===0?'they stack':'they cancel',
        'font:800 10px system-ui;fill:'+(j===0?'var(--s3)':'var(--critical)'),'end'); });
    txt(bars,150,202,'agreeing pushes add up; alternating pushes annihilate','font:600 8.6px system-ui;fill:var(--ink-muted)','middle'); }
  function ringSteps(){ const T=OPT.trace('mom',{c:10,alpha:eta,beta:be,N:200});   /* the last step at which J is still above 0.4 — the settling time, not the first crossing */
    let last=null; for(let i=1;i<T.length;i++) if(!isFinite(T[i].J)||T[i].J>=0.4) last=i;
    return last==null?1:(last>=200?null:last+1); }
  function draw(cur){ const n=Math.min(shown,K);
    const t1=TP[1].w,t2=TP[2].w,t3=TP[3].w;
    read.innerHTML='t=1 [<b>'+F(t1[0],2)+'</b>, <b>'+F(t1[1],2)+'</b>] · t=2 [<b>'+F(t2[0],2)+'</b>, <b>'+F(t2[1],2)+'</b>] · t=3 [<b>'+F(t3[0],3)+'</b>, <b>'+F(t3[1],3)+'</b>]<br>'+
      'J: <b>5.5</b> → <b>'+T4(TP[1].J)+'</b> → <b>'+F(TP[2].J,4)+'</b> → <b>'+F(TP[3].J,4)+'</b><br>'+
      'steady-state speed-up on a constant pull: 1/(1−β) = <b>'+(be>=1?'∞':(1/(1-be)).toFixed(1))+'</b>×<br>'+
      'after <b>'+n+'</b> steps — plain J = <b>'+big(TR[n].J,4)+'</b> · trolley J = <b>'+big(TP[n].J,4)+'</b>';
    if(be===0){ verd.className='verdict info'; verd.textContent='info — no memory: this is exactly the plain walker'; }
    else if(be>=0.97){ const N=ringSteps(); verd.className='verdict bad';
      verd.textContent='bad — the trolley will not stop: it rings for '+(N==null?'more than 200':N)+' steps before J falls below 0.4'; }
    else if(Math.abs(be-0.9)<1e-9&&Math.abs(eta-0.1)<1e-9){ verd.className='verdict info';
      verd.textContent='info — the loss ROSE at step 2 (0.405 → 4.309). That is the overshoot being paid for, not a bug.'; }
    else if(TP[2].J>TP[1].J){ verd.className='verdict info'; verd.textContent='info — the loss ROSE at step 2 ('+F(TP[1].J,3)+' → '+F(TP[2].J,3)+'). That is the overshoot being paid for, not a bug.'; }
    else { verd.className='verdict good'; verd.textContent='good — memory without overshoot: the trolley rolls straight down the trough'; }
    drawMap(cur); drawBars(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function replan(){ stop(); plan(); shown=K; draw(); }
  function play(){ stop(); const tok=run; plan(); shown=0; draw();
    if(RM){ shown=K; draw(); return; }
    let k=0; const nxt=()=>{ if(tok!==run) return; if(k>=K){ draw(); return; }
      const a=[TR[k].w,TP[k].w], b=[TR[k+1].w,TP[k+1].w];
      anim=tween(200,u=>{ if(tok!==run) return; draw([[a[0][0]+(b[0][0]-a[0][0])*u,a[0][1]+(b[0][1]-a[0][1])*u],[a[1][0]+(b[1][0]-a[1][0])*u,a[1][1]+(b[1][1]-a[1][1])*u]]); },
        ()=>{ if(tok!==run) return; k++; shown=k; draw(); nxt(); }); };
    nxt(); }
  document.getElementById('tr-play').addEventListener('click',play);
  const preBar=document.getElementById('tr-pre');
  [['tr-p-none',0],['tr-p-std',0.9],['tr-p-heavy',0.97]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{
    pressOnly(preBar,e.currentTarget); be=v; setCtl('tr-beta',v,2); replan(); }));
  bindCtl('tr-beta',v=>{ be=v; pressOnly(preBar,null); replan(); },v=>fmt(v,2))();
  bindCtl('tr-eta',v=>{ eta=v; replan(); },v=>fmt(v,3))();
  bindCtl('tr-k',v=>{ K=v|0; replan(); },v=>String(v|0))();
  replan();
})();

/* ---- shared by W3–W5: the valley as a contour sub-panel, and a walker's trail on it ---- */
function contourPanel(svg,x,y,w,h,c,o){ o=o||{};
  const X=o.X||1.35, Y=o.Y||1.25;
  const p=panel(svg,x,y,w,h,-X,X,-Y,Y,{id:o.id,xs:o.xs||.5,ys:o.ys||.5,title:o.title,xt:o.xt,yt:o.yt});
  const f=(a,b)=>0.5*a*a+c/2*b*b, top=f(X,Y), lv=[]; for(let i=1;i<=9;i++) lv.push(top*Math.pow(i/10,2.1));
  const gc=el('g',{'clip-path':p.clip},svg);
  contourSegs(f,lv,-X,X,-Y,Y,60).forEach((L,i)=>L.segs.forEach(s=>el('line',{x1:p.px(s[0]),y1:p.py(s[1]),x2:p.px(s[2]),y2:p.py(s[3]),stroke:'var(--s1)','stroke-width':1,opacity:.13+.045*i},gc)));
  glowDot(svg,p.px(0),p.py(0),3.4,'var(--s3)',o.glow);
  el('circle',{cx:p.px(1),cy:p.py(1),r:3.6,fill:'none',stroke:'var(--ink-muted)','stroke-width':1.4},svg);
  p.gc=gc; return p; }
function trailOn(p,T,n,col,glow,wd){ const cw=w=>[Math.max(p.X0,Math.min(p.X1,w[0])),Math.max(p.Y0,Math.min(p.Y1,w[1]))];
  let d=''; const N=Math.min(n,T.length-1);
  for(let i=0;i<=N;i++){ const w=cw(T[i].w); d+=(i?'L':'M')+p.px(w[0]).toFixed(1)+','+p.py(w[1]).toFixed(1); }
  glowPath(p.gc||p.svg,d,col,wd||2.2,glow,{opacity:.95});
  for(let i=0;i<=N;i++){ const w=cw(T[i].w); el('circle',{cx:p.px(w[0]),cy:p.py(w[1]),r:2.1,fill:col,opacity:.75},p.gc||p.svg); }
  const w=cw(T[N].w); glowDot(p.svg,p.px(w[0]),p.py(w[1]),4.8,col,glow); return w; }

/* ================= W3 · THE PERMANENT RECORD (AdaGrad) ================= */
(function(){
  const box=document.getElementById('w-record'),svg=document.getElementById('rc-svg'),read=document.getElementById('rc-read'),verd=document.getElementById('rc-verdict');
  if(!box||!svg) return;
  const COL=CV('critical');
  let tab='two',K=12,al=0.10,shown=12,anim=null,run=0,T=null;
  const plan=()=>{ T=OPT.trace('ada',{c:10,alpha:al,N:Math.max(K,40)}); };
  function drawCols(glow){
    const n=Math.min(shown,K), x0=352, cw=58, gap=42, top=72, bot=250, H=bot-top;
    txt(svg,x0,58,'the permanent record: every g² ever felt, stacked','font:700 10px system-ui;fill:var(--ink-muted)');
    const tot=[T[n].A[0],T[n].A[1]], scale=H/Math.max(1e-9,Math.max(tot[0],tot[1],1e-6));
    [0,1].forEach(j=>{
      const bx=x0+j*(cw+gap);
      el('rect',{x:bx,y:top,width:cw,height:H,rx:6,fill:'var(--surface-2)',opacity:.35,stroke:'var(--line, var(--ring))'},svg);
      let acc=0;
      for(let i=1;i<=n;i++){ const g2=T[i].g[j]*T[i].g[j], hh=g2*scale; if(!(hh>0)) continue;
        el('rect',{x:bx+2,y:Math.max(top,bot-(acc+g2)*scale),width:cw-4,height:Math.max(.7,Math.min(hh,bot-top)),fill:COL,opacity:.17+.5*(i/Math.max(1,n))},svg); acc+=g2; }
      const fh=Math.min(H,tot[j]*scale);
      el('rect',{x:bx,y:bot-fh,width:cw,height:fh,rx:4,fill:'none',stroke:COL,'stroke-width':1.6,opacity:.9},svg);
      txt(svg,bx+cw/2,top-6,'w'+SUB(j+1),'font:800 11px system-ui;fill:'+COL,'middle');
      txt(svg,bx+cw/2,bot+14,'A = '+big(tot[j],tot[j]>=100?1:3),'font:700 9.5px system-ui;fill:var(--ink-2)','middle');
      /* the stride that is left, as a shrinking bar */
      const st=al/(Math.sqrt(tot[j])||1e-9), SB=al>0?st/al:0;
      el('rect',{x:bx,y:bot+22,width:cw,height:9,rx:4,fill:'var(--surface-2)',stroke:'var(--line, var(--ring))'},svg);
      const g=el('g',glow?{filter:glow}:{},svg); el('rect',{x:bx,y:bot+22,width:Math.max(1.5,cw*Math.min(1,SB)),height:9,rx:4,fill:COL},g);
      txt(svg,bx+cw/2,bot+43,'stride '+F(st,4),'font:700 9.5px system-ui;fill:'+COL,'middle'); });
    /* the w₁ column magnified, so a sliver is still readable */
    const bx=x0, mag=Math.max(1,Math.min(9999,tot[1]/Math.max(1e-9,tot[0])));
    el('rect',{x:bx-1,y:bot-Math.min(H,tot[0]*scale)-1,width:cw+2,height:Math.min(H,tot[0]*scale)+2,rx:4,fill:'none',stroke:COL,'stroke-width':1,'stroke-dasharray':'3 3',opacity:.8},svg);
    txt(svg,x0+cw/2,bot+58,'×'+Math.round(mag)+' smaller','font:700 9.5px system-ui;fill:var(--ink-muted)','middle');
    txt(svg,x0,bot+80,'the steep column fills ~100× faster','font:600 9px system-ui;fill:var(--ink-muted)');
    txt(svg,x0,bot+94,'and A never shrinks: the brake never lifts','font:700 9.5px system-ui;fill:'+COL); }
  function drawLong(glow){
    const N=40, p=panel(svg,358,72,214,212,0,N,0,Math.max(al*1.12,0.02),{id:'lg',xs:10,ys:al>=.2?.1:.05,title:'stride α/√A against step'});
    const L=OPT.trace('ada',{c:10,alpha:al,N});
    [0,1].forEach(j=>{ let d=''; for(let i=1;i<=N;i++){ const s=al/(Math.sqrt(L[i].A[j])||1e-9); d+=(i>1?'L':'M')+p.px(i).toFixed(1)+','+p.cy(p.py(s)).toFixed(1); }
      glowPath(el('g',{'clip-path':p.clip},svg),d,COL,j?2.6:1.6,glow,{opacity:j?1:.6,'stroke-dasharray':j?'':'4 3'}); });
    let d2=''; for(let i=1;i<=N;i++){ d2+=(i>1?'L':'M')+p.px(i).toFixed(1)+','+p.cy(p.py(al/Math.sqrt(i))).toFixed(1); }
    el('path',{d:d2,stroke:'var(--s7)','stroke-width':1.6,fill:'none','stroke-dasharray':'2 3',opacity:.9,'clip-path':p.clip},svg);
    el('rect',{x:376,y:80,width:104,height:40,rx:6,fill:'var(--surface)',opacity:.85},svg);
    txt(svg,382,93,'— w₂ (steep)','font:700 9.5px system-ui;fill:'+COL);
    txt(svg,382,105,'-- w₁ (gentle)','font:700 9.5px system-ui;fill:'+COL);
    txt(svg,382,117,'·· α/√t','font:700 9.5px system-ui;fill:var(--s7)');
    const nn=Math.min(shown,N); el('line',{x1:p.px(nn),y1:p.y,x2:p.px(nn),y2:p.y+p.h,stroke:'var(--s4)','stroke-width':1.2,'stroke-dasharray':'3 3'},svg);
    txt(svg,465,312,'A grows like t, so the stride dies like 1/√t','font:600 9px system-ui;fill:var(--ink-muted)','middle'); }
  function draw(){ svg.innerHTML=''; const glow=glo(svg);
    const n=Math.min(shown,K);
    const p=contourPanel(svg,44,72,258,212,10,{id:'rc',title:'the path is a perfect straight diagonal',glow});
    trailOn(p,T,n,COL,glow,2.6);
    txt(svg,44,312,'the first step is α·sign(g) in every weight:','font:600 9px system-ui;fill:var(--ink-muted)');
    txt(svg,44,326,'from [1, 1] the walker leaves at exactly 45°','font:700 9.5px system-ui;fill:'+COL);
    txt(svg,44,344,'the slope 10 and the slope 1 move the same distance','font:600 9px system-ui;fill:var(--ink-muted)');
    if(tab==='two') drawCols(glow); else drawLong(glow);
    const A1=T[1].A, A2=T[2].A, s1=[al/Math.sqrt(A1[0]),al/Math.sqrt(A1[1])], s2=[al/Math.sqrt(A2[0]),al/Math.sqrt(A2[1])];
    const st1=[s1[0]*T[1].g[0],s1[1]*T[1].g[1]], st2=[s2[0]*T[2].g[0],s2[1]*T[2].g[1]];
    let s='first step = <b>'+F(st1[0],4)+'</b> in BOTH weights — the slope 10 and the slope 1 move the same distance<br>'+
      'on step 1, α·g/√(g²) = α·sign(g): only the DIRECTION of the slope survives<br>';
    if(tab==='two') s+='A = [<b>'+F(A1[0],0)+'</b>, <b>'+F(A1[1],0)+'</b>] → √A = [<b>'+F(Math.sqrt(A1[0]),0)+'</b>, <b>'+F(Math.sqrt(A1[1]),0)+'</b>] → step = α·g/√A = [<b>'+F(st1[0],1)+'</b>, <b>'+F(st1[1],1)+'</b>]<br>'+
      'A = [<b>'+F(A2[0],2)+'</b>, <b>'+F(A2[1],0)+'</b>] → √A = [<b>'+F(Math.sqrt(A2[0]),4)+'</b>, <b>'+F(Math.sqrt(A2[1]),4)+'</b>] → step = [<b>'+F(st2[0],4)+'</b>, <b>'+F(st2[1],4)+'</b>]<br>'+
      'w: [1, 1] → [<b>'+T4(T[1].w[0])+'</b>, <b>'+T4(T[1].w[1])+'</b>] → [<b>'+T4(T[2].w[0])+'</b>, <b>'+T4(T[2].w[1])+'</b>]<br>'+
      'J: <b>5.5</b> → <b>'+T4(T[1].J)+'</b> → <b>'+F(T[2].J,4)+'</b>';
    else { const L=OPT.trace('ada',{c:10,alpha:al,N:40});
      s+='stride at t = 40: <b>'+F(al/Math.sqrt(L[40].A[1]),5)+'</b>  ·  distance still to go: <b>'+F(Math.hypot(L[40].w[0],L[40].w[1]),4)+'</b><br>'+
        'the free-running curve α/√t at t = 40 is <b>'+F(al/Math.sqrt(40),5)+'</b> — the same shape'; }
    read.innerHTML=s;
    if(tab==='long'){ verd.className='verdict bad'; verd.textContent='bad — the record never clears, so the brake never lifts'; }
    else { verd.className='verdict good'; verd.textContent='good — both weights move '+F(st1[0],4)+' on step 1: the size of the slope has cancelled, only its sign survives'; } }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run; plan(); shown=0; draw(); if(RM){ shown=K; draw(); return; }
    let k=0; const nxt=()=>{ if(tok!==run) return; if(k>=K){ draw(); return; }
      anim=tween(140,()=>{},()=>{ if(tok!==run) return; k++; shown=k; draw(); nxt(); }); }; nxt(); }
  document.getElementById('rc-play').addEventListener('click',play);
  bindCtl('rc-k',v=>{ stop(); K=v|0; shown=K; plan(); draw(); },v=>String(v|0))();
  bindCtl('rc-eta',v=>{ stop(); al=v; plan(); shown=K; draw(); },v=>fmt(v,3))();
  tabs(document.getElementById('rc-tabs'),t=>{ stop(); tab=t; shown=K; draw(); });
  plan(); draw();
})();

/* ================= W4 · FORM, NOT CAREER AVERAGE (RMSProp) ================= */
(function(){
  const box=document.getElementById('w-form'),svg=document.getElementById('fm-svg'),read=document.getElementById('fm-read'),verd=document.getElementById('fm-verdict');
  if(!box||!svg) return;
  const C2=CV('s2'), CA=CV('critical');
  let rho=0.900,al=0.10,K=12,shown=12,anim=null,run=0,T=null;
  const plan=()=>{ T=OPT.trace('rms',{c:10,alpha:al,rho,N:Math.max(K,30)}); };
  function draw(){ svg.innerHTML=''; const glow=glo(svg); const n=Math.min(shown,K);
    /* (i) the map — the walker can fly a long way at ρ → 1, so the window grows with the run */
    let mx=1.4; for(let i=0;i<=n;i++) mx=Math.max(mx,Math.abs(T[i].w[0])*1.12,Math.abs(T[i].w[1])*1.12);
    const p=contourPanel(svg,44,52,250,196,10,{id:'fm',X:Math.min(9,mx),Y:Math.min(9,mx),xs:mx>3?2:.5,ys:mx>3?2:.5,title:'RMSProp on the valley',glow});
    trailOn(p,T,n,C2,glow,2.5);
    /* (ii) the memory comb */
    const cx0=336,cy0=52,cw=236,ch=120;
    txt(svg,cx0,cy0-6,'how much a slope from k steps ago still counts: ρᵏ','font:700 10px system-ui;fill:var(--ink-muted)');
    el('rect',{x:cx0,y:cy0,width:cw,height:ch,rx:8,fill:'none',stroke:'var(--line, var(--ring))',opacity:.55},svg);
    const NB=20, bw=(cw-16)/NB;
    for(let k=0;k<NB;k++){ const hgt=Math.pow(rho,k)*(ch-16);
      el('rect',{x:cx0+8+k*bw+1,y:cy0+ch-8-hgt,width:bw-2,height:Math.max(1,hgt),rx:1.5,fill:C2,opacity:.35+.5*Math.pow(rho,k)},svg); }
    const hor=Math.min(NB,1/Math.max(1e-6,1-rho));
    el('line',{x1:cx0+8+hor*bw,y1:cy0+6,x2:cx0+8+hor*bw,y2:cy0+ch-8,stroke:'var(--s4)','stroke-width':1.6,'stroke-dasharray':'4 3'},svg);
    txt(svg,cx0+8+hor*bw+(hor>NB*.6?-5:5),cy0+16,'horizon 1/(1−ρ) = '+(1/(1-rho)>=1000?'1000':String(Math.round(1/(1-rho)))),'font:700 9.5px system-ui;fill:var(--s4)',hor>NB*.6?'end':'start');
    txt(svg,cx0,cy0+ch+14,'k = 0','font:500 9px system-ui;fill:var(--ink-muted)'); txt(svg,cx0+cw,cy0+ch+14,'k = 19','font:500 9px system-ui;fill:var(--ink-muted)','end');
    txt(svg,cx0,cy0+ch+30,'AdaGrad’s comb would be flat at 1 for ever — it never forgets','font:600 8.8px system-ui;fill:'+CA);
    /* (iii) stride against t, RMSProp vs AdaGrad */
    const N=30, A=OPT.trace('ada',{c:10,alpha:al,N});
    let top=al*1.1; for(let i=1;i<=N;i++) top=Math.max(top,al/Math.sqrt(T[i].A[1]||1e-9));
    top=Math.min(top,al*40);
    const q=panel(svg,60,286,516,88,0,N,0,top,{id:'fs',xs:5,ys:top>1?.5:(top>.4?.2:.1),title:'the brake α/√A, step by step — RMSProp (amber) eases, AdaGrad (red) never does'});
    const gq=el('g',{'clip-path':q.clip},svg);
    [[T,C2,2.6],[A,CA,2.2]].forEach(([S,col,wd])=>{ let d=''; for(let i=1;i<=N;i++){ const s=al/(Math.sqrt(S[i].A[1])||1e-9); d+=(i>1?'L':'M')+q.px(i).toFixed(1)+','+q.cy(q.py(s)).toFixed(1); } glowPath(gq,d,col,wd,glow,{}); });
    el('line',{x1:q.px(0),y1:q.cy(q.py(al)),x2:q.px(N),y2:q.cy(q.py(al)),stroke:'var(--ink-muted)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.8},svg);
    txt(svg,q.px(N)-2,q.cy(q.py(al))-4,'α = '+F(al,3),'font:700 9px system-ui;fill:var(--ink-muted)','end');
    const nn=Math.min(shown,N); el('line',{x1:q.px(nn),y1:q.y,x2:q.px(nn),y2:q.y+q.h,stroke:'var(--s4)','stroke-width':1.2,'stroke-dasharray':'3 3'},svg);
    /* readout */
    const A1=T[1].A, inf=1/Math.sqrt(Math.max(1e-9,1-rho));
    read.innerHTML='A = [<b>'+G4(A1[0])+'</b>, <b>'+G4(A1[1])+'</b>] → √A = [<b>'+F(Math.sqrt(A1[0]),4)+'</b>, <b>'+F(Math.sqrt(A1[1]),4)+'</b>] → step = [<b>'+F(T[1].step[0],4)+'</b>, <b>'+F(T[1].step[1],4)+'</b>]<br>'+
      'w: [1, 1] → [<b>'+F(T[1].w[0],4)+'</b>, <b>'+F(T[1].w[1],4)+'</b>] → [<b>'+F(T[2].w[0],4)+'</b>, <b>'+F(T[2].w[1],4)+'</b>]<br>'+
      'J: <b>5.5</b> → <b>'+F(T[1].J,4)+'</b> → <b>'+F(T[2].J,4)+'</b><br>'+
      'memory horizon ≈ 1/(1−ρ) = <b>'+Math.round(1/Math.max(1e-6,1-rho))+'</b> steps<br>'+
      'first step = <b>'+trim(inf.toPrecision(3))+' × α</b>  (inflation = 1/√(1−ρ))';
    if(rho>=0.99){ verd.className='verdict bad'; verd.textContent='bad — the zero start puffs the first step by '+trim(inf.toPrecision(3))+'×'; }
    else { verd.className='verdict good'; verd.textContent='good — the brake eases, the stride stays alive: '+F(T[1].step[1],4)+' → '+F(T[2].step[1],4)+' → …'; } }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run; plan(); shown=0; draw(); if(RM){ shown=K; draw(); return; }
    let k=0; const nxt=()=>{ if(tok!==run) return; if(k>=K){ draw(); return; }
      anim=tween(170,()=>{},()=>{ if(tok!==run) return; k++; shown=k; draw(); nxt(); }); }; nxt(); }
  document.getElementById('fm-play').addEventListener('click',play);
  const preBar=document.getElementById('fm-pre');
  [['fm-p-std',0.900],['fm-p-long',0.999]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{
    pressOnly(preBar,e.currentTarget); rho=v; setCtl('fm-rho',v,3); stop(); plan(); shown=K; draw(); play(); }));
  bindCtl('fm-rho',v=>{ stop(); rho=v; pressOnly(preBar,null); plan(); shown=K; draw(); },v=>fmt(v,3))();
  bindCtl('fm-eta',v=>{ stop(); al=v; plan(); shown=K; draw(); },v=>fmt(v,3))();
  bindCtl('fm-k',v=>{ stop(); K=v|0; shown=K; plan(); draw(); },v=>String(v|0))();
  plan(); draw();
})();

/* ================= W5 · TWO NOTEBOOKS AND A PROBATION (Adam) ================= */
(function(){
  const box=document.getElementById('w-notebooks'),svg=document.getElementById('nb-svg'),read=document.getElementById('nb-read'),chip=document.getElementById('nb-chip'),verd=document.getElementById('nb-verdict');
  if(!box||!svg) return;
  const C4=CV('s4'), C2=CV('s2');
  let t=1,rF=0.90,rA=0.9990,al=0.10,anim=null,run=0,T=null;
  const plan=()=>{ T=OPT.trace('adam',{c:10,alpha:al,rhoF:rF,rhoA:rA,N:60}); };
  function minRate(){ let mi=1,mv=Infinity; for(let k=1;k<=60;k++){ const v=OPT.rateOf(k,al,rF,rA); if(v<mv){ mv=v; mi=k; } } return [mv,mi]; }
  plan();
  function draw(){ svg.innerHTML=''; const glow=glo(svg); const S=T[Math.max(1,Math.min(60,t))];
    /* (i) the two notebooks */
    const nx=46,ny=52,nw=238,nh=158;
    txt(svg,nx,ny-6,'two notebooks at step t = '+t,'font:700 10px system-ui;fill:var(--ink-muted)');
    el('rect',{x:nx,y:ny,width:nw,height:nh,rx:8,fill:'none',stroke:'var(--line, var(--ring))',opacity:.55},svg);
    const mxF=Math.max(1e-9,Math.abs(S.Fm[0]),Math.abs(S.Fm[1])), mxA=Math.max(1e-12,S.A[0],S.A[1]);
    [0,1].forEach(j=>{ const yy=ny+26+j*68, mid=nx+108;
      txt(svg,nx+8,yy-8,'w'+SUB(j+1),'font:800 11px system-ui;fill:var(--ink-2)');
      /* F: signed direction memory */
      const fw=S.Fm[j]/mxF*82, gF=el('g',glow?{filter:glow}:{},svg);
      el('line',{x1:mid,y1:yy-4,x2:mid,y2:yy+34,stroke:'var(--axis)','stroke-width':1},svg);
      el('rect',{x:Math.min(mid,mid+fw),y:yy,width:Math.max(2,Math.abs(fw)),height:12,rx:3,fill:C4},gF);
      txt(svg,nx+nw-8,yy+10,'F = '+G4(S.Fm[j]),'font:700 9.5px system-ui;fill:'+C4,'end');
      txt(svg,nx+30,yy+10,'which way','font:600 9px system-ui;fill:var(--ink-muted)');
      /* A: unsigned loudness memory */
      const aw=S.A[j]/mxA*82, gA=el('g',glow?{filter:glow}:{},svg);
      el('rect',{x:mid,y:yy+18,width:Math.max(2,Math.abs(aw)),height:12,rx:3,fill:C2},gA);
      txt(svg,nx+nw-8,yy+28,'A = '+G4(S.A[j]),'font:700 9.5px system-ui;fill:'+C2,'end');
      txt(svg,nx+30,yy+28,'how loud','font:600 9px system-ui;fill:var(--ink-muted)'); });
    txt(svg,nx,ny+nh+15,'F/√A = ['+F(S.Fm[0]/Math.sqrt(S.A[0]||1e-12),4)+', '+F(S.Fm[1]/Math.sqrt(S.A[1]||1e-12),4)+'] — the same in both weights','font:700 9px system-ui;fill:var(--ink-2)');
    /* (ii) the effective rate α_t on a log axis */
    const [mv,mi]=minRate();
    const lo=Math.log10(Math.max(1e-6,Math.min(mv,al)*.72)), hi=Math.log10(al*1.6);
    const q=panel(svg,336,52,232,158,1,60,lo,hi,{id:'at',xs:10,ys:.5,title:'the rate on probation: αₜ against t',
      yf:v=>{ const x=Math.pow(10,v); return x>=0.1?nm(x.toFixed(2)):nm(x.toFixed(3)); }});
    let d=''; for(let k=1;k<=60;k++){ const v=Math.log10(Math.max(1e-9,OPT.rateOf(k,al,rF,rA))); d+=(k>1?'L':'M')+q.px(k).toFixed(1)+','+q.cy(q.py(v)).toFixed(1); }
    glowPath(el('g',{'clip-path':q.clip},svg),d,C4,2.6,glow,{});
    el('line',{x1:q.px(1),y1:q.cy(q.py(Math.log10(al))),x2:q.px(60),y2:q.cy(q.py(Math.log10(al))),stroke:'var(--ink-muted)','stroke-width':1.2,'stroke-dasharray':'4 3'},svg);
    txt(svg,q.px(60)-2,q.cy(q.py(Math.log10(al)))-4,'α = '+F(al,3),'font:700 9px system-ui;fill:var(--ink-muted)','end');
    const my=q.cy(q.py(Math.log10(Math.max(1e-9,mv))));
    glowDot(svg,q.px(mi),my,4,C4,glow); txt(svg,q.px(mi)+7,my+11,'min '+F(mv,6)+' at t = '+mi,'font:700 9px system-ui;fill:'+C4);
    el('line',{x1:q.px(Math.min(60,t)),y1:q.y,x2:q.px(Math.min(60,t)),y2:q.y+q.h,stroke:'var(--s3)','stroke-width':1.4,'stroke-dasharray':'3 3'},svg);
    /* (iii) the map */
    const p=contourPanel(svg,46,254,238,122,10,{id:'nb',X:1.3,Y:1.3,title:'Adam on the valley',glow,yt:false});
    trailOn(p,T,Math.min(t,60),C4,glow,2.4);
    /* (iv) how full each notebook is — the reason the probation exists */
    const bx=336,by=254,bw2=232;
    txt(svg,bx,by-6,'how full each book is after t steps','font:700 10px system-ui;fill:var(--ink-muted)');
    [[1-Math.pow(rF,t),'which-way book  1 − ρ_f ᵗ',C4],[1-Math.pow(rA,t),'how-loud book  1 − ρᵗ',C2]].forEach(([v,name,col],i)=>{
      const yy=by+18+i*44;
      txt(svg,bx,yy-4,name,'font:600 9.5px system-ui;fill:var(--ink-2)');
      el('rect',{x:bx,y:yy,width:bw2,height:12,rx:6,fill:'var(--surface-2)',stroke:'var(--line, var(--ring))'},svg);
      const g=el('g',glow?{filter:glow}:{},svg); el('rect',{x:bx,y:yy,width:Math.max(2,bw2*Math.max(0,Math.min(1,v))),height:12,rx:6,fill:col},g);
      txt(svg,bx+bw2,yy+24,(v*100).toFixed(v<0.1?2:1)+' % full','font:700 9.5px system-ui;fill:'+col,'end'); });
    txt(svg,bx,by+112,'dividing each book by how full it is, is the whole correction','font:700 9px system-ui;fill:var(--ink-muted)');
    /* readout */
    const st=S.step;
    read.innerHTML='F = [<b>'+G4(S.Fm[0])+'</b>, <b>'+G4(S.Fm[1])+'</b>] · A = [<b>'+G4(S.A[0])+'</b>, <b>'+G4(S.A[1])+'</b>]<br>'+
      'α'+SUB(t)+' = <b>'+F(S.at,6)+'</b> · F/√A = [<b>'+F(S.Fm[0]/Math.sqrt(S.A[0]||1e-12),4)+'</b>, <b>'+F(S.Fm[1]/Math.sqrt(S.A[1]||1e-12),4)+'</b>] · step = [<b>'+F(st[0],4)+'</b>, <b>'+F(st[1],4)+'</b>]<br>'+
      'w after this step = [<b>'+F(S.w[0],4)+'</b>, <b>'+F(S.w[1],4)+'</b>] · J = <b>'+big(S.J,4)+'</b>';
    chip.innerHTML='αₜ bottoms out at <b>'+F(mv,6)+'</b> at t = <b>'+mi+'</b>, then climbs back to α = '+F(al,3)+' — the correction retires itself.';
    if(1-Math.pow(rF,Math.max(1,t))<1e-6){ verd.className='verdict info'; verd.textContent='info — the which-way book is empty to machine precision; the correction is held finite on purpose'; }
    else { verd.className='verdict good'; verd.textContent='good — first step exactly α in both weights: RMSProp’s 0.3162 spike is gone'; } }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run; t=1; setCtl('nb-t',1,0); draw(); if(RM){ t=40; setCtl('nb-t',40,0); draw(); return; }
    const nxt=()=>{ if(tok!==run) return; if(t>=40){ draw(); return; }
      anim=tween(110,()=>{},()=>{ if(tok!==run) return; t++; setCtl('nb-t',t,v=>String(v|0)); draw(); nxt(); }); }; nxt(); }
  document.getElementById('nb-play').addEventListener('click',play);
  document.getElementById('nb-p-def').addEventListener('click',e=>{ pressOnly(document.getElementById('nb-pre'),e.currentTarget); stop();
    rF=0.90; rA=0.9990; t=1; setCtl('nb-rf',rF,2); setCtl('nb-rho',rA,4); setCtl('nb-t',1,v=>String(v|0)); plan(); draw(); });
  bindCtl('nb-t',v=>{ stop(); t=Math.max(1,v|0); draw(); },v=>String(v|0))();
  bindCtl('nb-rf',v=>{ stop(); rF=v; plan(); draw(); },v=>fmt(v,2))();
  bindCtl('nb-rho',v=>{ stop(); rA=v; plan(); draw(); },v=>fmt(v,4))();
  plan(); draw();
})();

/* ================= W6 · FIVE WALKERS, ONE VALLEY (three.js + loss chart + scoreboard) ================= */
(function(){
  const box=document.getElementById('w-five'),stage=document.getElementById('fv-3d'),chart=document.getElementById('fv-chart'),board=document.getElementById('fv-board'),read=document.getElementById('fv-read'),verd=document.getElementById('fv-verdict');
  if(!box||!stage) return;
  const NST=40, W1R=1.7, W2R=1.35, UX=2.3, VX=1.15;
  const niceC=s=>{ const v=Math.pow(10,s/50), e=Math.pow(10,Math.floor(Math.log10(v))); return Math.round(v/e*10)/10*e; };
  const s3=v=>{ if(!isFinite(v)) return '∞'; const a=Math.abs(v); if(a===0) return '0'; if(a<1e-4) return nm(v.toExponential(1)).replace('e-','e−'); return nm(trim((+v).toPrecision(3))); };
  let c=10,al=0.10,tCur=0,sc=null,hudEl=null,anim=null,run=0,ST=null,TR=null;
  const uOf=w=>[w[0]/W1R*UX,w[1]/W2R*VX], wOf=(u,v)=>[u*W1R/UX,v*W2R/VX];
  const FS=(u,v)=>{ const w=wOf(u,v); return 0.5*w[0]*w[0]+c/2*w[1]*w[1]; };
  const ZTOP=()=>0.5*W1R*W1R+c/2*W2R*W2R, ZS=()=>1.7/ZTOP();
  const P3=(w,z)=>{ const u=uOf(w); return [u[0],z*ZS(),-u[1]]; };
  const inside=w=>Math.abs(w[0])<=W1R*1.02&&Math.abs(w[1])<=W2R*1.02;
  function plan(){ TR={}; M5.forEach(m=>{ TR[m.k]=OPT.trace(m.k,{c,alpha:al,N:NST}); }); }
  function levels(){ const lv=[]; for(let i=1;i<=8;i++) lv.push(ZTOP()*Math.pow(i/9,2.1)); return lv; }
  function build(){ sc=null; const narrow=stage.clientWidth<560;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:narrow?[3.2,3.8,5.4]:[2.9,3.2,4.8],look:[0,.5,0],fov:36},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        const surf=CIN.prim.surface(ctx,FS,{x:[-UX,UX],y:[-VX,VX],res:72,zscale:1,ramp:[colors.s1,colors.s7,colors.s2],opacity:.9,wire:false}); root.add(surf);
        reshape(ctx,surf,FS,ZS(),null,.65);
        const floorY=-.2; const grid=CIN.prim.grid(ctx,5.2,18,hx('grid'),{opacity:isLight?.45:.28}); grid.position.y=floorY; root.add(grid);
        const contG=new THREE.Group(); root.add(contG);
        root.add(overlay(CIN.prim.dot(ctx,[0,0,0],hx('s3'),.05)));
        const W=M5.map((m,i)=>{ const col=CIN.hex(cssv(m.c));
          const dot=overlay(CIN.prim.dot(ctx,[0,0,0],col,.055),12+i); root.add(dot);
          const halo=haloSprite(ctx,col,.42); root.add(halo);
          const tg=new THREE.Group(); root.add(tg); return {m,col,dot,halo,tg}; });
        sc={THREE,ctx,root,colors,isLight,hx,surf,contG,W,floorY};
        hudEl=hud(stage); hint(stage,'drag to orbit'); reshapeAll(); }, update(){ return false; } });
    if(handle) grab(handle,()=>false,()=>{});
    return handle; }
  function reshapeAll(){ if(!sc) return; reshape(sc.ctx,sc.surf,FS,ZS(),null,.65);
    clearGroup(sc.contG); sc.contG.add(liftedContours(sc.ctx,FS,levels(),-UX,UX,-VX,VX,ZS(),sc.hx('ink2'),{N:64}));
    paint(); }
  function paint(frac){ if(!sc) return;
    sc.W.forEach((w,i)=>{ const T=TR[w.m.k], k=Math.min(tCur,NST); let pos=T[k].w;
      if(frac!=null&&k<NST&&!T[k+1].dead){ const a=T[k].w,b=T[k+1].w; pos=[a[0]+(b[0]-a[0])*frac,a[1]+(b[1]-a[1])*frac]; }
      const vis=!T[k].dead&&inside(pos)&&isFinite(pos[0])&&isFinite(pos[1]);
      w.dot.visible=vis; w.halo.visible=vis; if(!vis) return;
      const q=P3(pos,0.5*pos[0]*pos[0]+c/2*pos[1]*pos[1]); w.dot.position.set(q[0],q[1]+.014+.004*i,q[2]); w.halo.position.copy(w.dot.position); });
    if(hudEl){ const best=order()[0]; hudEl.innerHTML='step <b>'+Math.min(tCur,NST)+'</b> · c = <b>'+trim(String(c))+'</b> · leader <b>'+best.m.s+'</b> J = <b>'+s3(best.J)+'</b>'; }
    RR(sc.ctx); }
  function paintTrails(){ if(!sc) return;
    sc.W.forEach(w=>{ clearGroup(w.tg); const T=TR[w.m.k], n=Math.min(tCur,NST), pts=[];
      for(let i=0;i<=n;i++){ if(T[i].dead) break; const p=T[i].w; if(!inside(p)) break; const q=P3(p,0.5*p[0]*p[0]+c/2*p[1]*p[1]); q[1]+=.016; pts.push(q); }
      if(pts.length>=2) w.tg.add(polyTube(sc.ctx,pts,w.col,.016,false)); });
    RR(sc.ctx); }
  function order(){ const n=Math.min(tCur,NST);
    return M5.map(m=>({m,J:TR[m.k][n].dead?Infinity:TR[m.k][n].J,dead:TR[m.k].dead&&TR[m.k].deadAt<=n,deadAt:TR[m.k].deadAt})).sort((a,b)=>a.J-b.J); }
  function drawChart(){ const n=NST, lo=-14, hiV=Math.max(...M5.map(m=>TR[m.k][0].J));
    let mn=Infinity; M5.forEach(m=>TR[m.k].forEach(s=>{ if(isFinite(s.J)&&s.J>0) mn=Math.min(mn,s.J); }));
    const LO=Math.max(lo,Math.log10(Math.max(1e-14,mn))-.4), HI=Math.log10(Math.max(hiV,1))+.6;
    const p=frame(chart,0,n,LO,HI,{l:34,r:12,t:24,b:24,xs:10,ys:Math.max(1,Math.round((HI-LO)/5)),yf:v=>'10'+SUP(Math.round(v)),xf:v=>String(Math.round(v))});
    const glow=p.glow, gp=el('g',{'clip-path':p.clip},chart);
    txt(chart,p.L+2,p.T-9,'loss J against step (log scale)','font:600 9.5px system-ui;fill:var(--ink-muted)');
    M5.forEach(m=>{ const T=TR[m.k]; let d='',started=false;
      for(let i=0;i<=n;i++){ const v=T[i].J; if(!(isFinite(v)&&v>0)){ started=false; continue; } d+=(started?'L':'M')+p.px(i).toFixed(1)+','+p.cy(p.py(Math.log10(v))).toFixed(1); started=true; }
      glowPath(gp,d,CV(m.c),2,glow,{opacity:.95});
      if(T.dead&&T.deadAt>0&&T.deadAt<=n){ const X=p.px(T.deadAt); el('line',{x1:X,y1:p.T,x2:X,y2:p.H-p.B,stroke:CV(m.c),'stroke-width':1.2,'stroke-dasharray':'3 3',opacity:.8},chart);
        txt(chart,X+3,p.T+10,'✗ '+m.s,'font:700 8.5px system-ui;fill:'+CV(m.c)); } });
    const X=p.px(Math.min(tCur,n)); el('line',{x1:X,y1:p.T,x2:X,y2:p.H-p.B,stroke:'var(--ink-muted)','stroke-width':1.2,'stroke-dasharray':'2 3',opacity:.8},chart); }
  function drawBoard(){ const O=order(), n=Math.min(tCur,NST);
    board.innerHTML=O.map((o,i)=>{
      const lead=i===0&&n>0&&isFinite(o.J);
      return '<div style="flex:1 1 120px;min-width:0;padding:.34rem .5rem;border-radius:9px;font-family:var(--ui);font-size:.74rem;line-height:1.5;color:var(--ink-2);background:color-mix(in srgb,var(--surface-2) 70%,transparent);border:1px solid color-mix(in srgb,'+CV(o.m.c)+' '+(lead?85:38)+'%,transparent)">'+
        '<span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:'+CV(o.m.c)+';margin-right:.35rem"></span><b style="color:'+CV(o.m.c)+'">'+o.m.s+'</b>'+(lead?' <b style="color:var(--ink)">· leader</b>':'')+'<br>'+
        (o.dead?'<b style="color:var(--critical)">✗ diverged at step '+o.deadAt+'</b>':'J = <b style="color:var(--ink);font-family:var(--mono)">'+s3(o.J)+'</b>')+'</div>'; }).join(''); }
  function draw(fr){ const n=Math.min(tCur,NST);
    const fJ=v=>!isFinite(v)?'∞':(Math.abs(v)<1e4?F(v,4):s3(v));
    const T2=M5.map(m=>m.s+' '+fJ(TR[m.k][2].J)).join(' · ');
    const O25=M5.map(m=>({m,J:TR[m.k][25].dead?Infinity:TR[m.k][25].J})).sort((a,b)=>a.J-b.J);
    const O=order();
    let s='after 2 steps — '+T2+'<br>after 25 — '+O25.map(o=>o.m.s+' '+s3(o.J)).join(' · ')+'<br>'+
      'now at step '+n+' — '+O.map(o=>o.m.s+' '+s3(o.J)).join(' · ')+'<br>'+
      'stiffness c = <b>'+trim(String(c))+'</b> · κ = <b>'+trim(String(c))+'</b> · GD’s admissible stride: η < 2/c = <b>'+F(2/c,4)+'</b> (now α = '+F(al,3)+')';
    const gdT=TR.gd; if(gdT.dead) s+='<br><span style="color:var(--critical)">plain gradient descent left the map at step '+gdT.deadAt+' — α = '+F(al,3)+' is above 2/c = '+F(2/c,4)+'</span>';
    else { const h=Math.log(0.5)/Math.log(Math.max(1e-12,Math.abs(1-al))); s+='<br>at this α plain descent needs <b>'+(Math.abs(1-al)<1?Math.ceil(h):'∞')+'</b> steps to halve the gentle direction'; }
    read.innerHTML=s;
    if(c<=1.05){ verd.className='verdict info'; verd.textContent='info — a round bowl: every method finishes in one or two steps and the race is meaningless'; }
    else if(c>=100){ verd.className='verdict bad'; verd.textContent='bad for GD — its whole safe window is now '+F(2/c,4)+' wide, and the adaptive methods never noticed'; }
    else { verd.className='verdict good'; verd.textContent='good — four of the five shrink the loss every step; the order here is a property of this toy, not a law'; }
    drawChart(); drawBoard(); paint(fr); paintTrails(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function replan(){ stop(); plan(); draw(); }
  function play(){ stop(); const tok=run; plan(); tCur=0; draw();
    if(RM){ tCur=25; draw(); return; }
    const nxt=()=>{ if(tok!==run) return; if(tCur>=25){ draw(); return; }
      anim=tween(190,u=>{ if(tok!==run) return; paint(u); },()=>{ if(tok!==run) return; tCur++; setCtl('fv-t',tCur,v=>String(v|0)); draw(); nxt(); }); };
    nxt(); }
  document.getElementById('fv-play').addEventListener('click',play);
  const preBar=document.getElementById('fv-pre');
  [['fv-p-lecture',50,0.1],['fv-p-stiff',124,0.1],['fv-p-safe',124,0.005]].forEach(([id,sv,a])=>document.getElementById(id).addEventListener('click',e=>{
    pressOnly(preBar,e.currentTarget); c=niceC(sv); al=a; setCtl('fv-c',sv,()=>trim(String(c))); setCtl('fv-eta',a,3); reshapeAll(); replan(); play(); }));
  bindCtl('fv-c',v=>{ stop(); c=niceC(v); pressOnly(preBar,null); reshapeAll(); plan(); draw(); },v=>trim(String(niceC(v))))();
  bindCtl('fv-eta',v=>{ stop(); al=v; plan(); draw(); },v=>fmt(v,3))();
  bindCtl('fv-t',v=>{ stop(); tCur=v|0; draw(); },v=>String(v|0))();
  ST=mountStage(stage,build);
  let rw=stage.clientWidth; addEventListener('resize',()=>{ const W=stage.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  plan(); draw();
})();

/* ================= W7 · THEN SOMEONE BUILDS A WALL (parabola + 3D valley + standard form) ================= */
(function(){
  const box=document.getElementById('w-wall'),svg=document.getElementById('wl-svg'),stage=document.getElementById('wl-3d'),tap=document.getElementById('wl-tap'),conv=document.getElementById('wl-conv'),read=document.getElementById('wl-read'),verd=document.getElementById('wl-verdict');
  if(!box||!svg) return;
  let tab='knob',cc=2,c2=1,rule='r1',sc=null,hudEl=null,ST=null,anim=null,run=0,strictT=0;
  /* ---------- tab 1: one knob ---------- */
  function drawKnob(){ const p=frame(svg,-3,4,-1.2,16.5,{l:44,r:20,t:30,b:28,xs:1,ys:4});
    const glow=p.glow, hp=hatchPat(svg,'wl-h',CV('s2'),.5);
    txt(svg,p.L,p.T-11,'minimise f(x) = x² subject to x ≥ c','font:600 10.5px system-ui;fill:var(--ink-muted)');
    const xs=Math.max(-3,Math.min(4,cc));
    el('rect',{x:p.px(-3),y:p.T,width:Math.max(0,p.px(xs)-p.px(-3)),height:p.H-p.B-p.T,fill:hp,opacity:.9},svg);
    el('rect',{x:p.px(-3),y:p.T,width:Math.max(0,p.px(xs)-p.px(-3)),height:p.H-p.B-p.T,fill:CV('s2'),opacity:.07},svg);
    el('rect',{x:p.px(xs),y:p.T,width:Math.max(0,p.px(4)-p.px(xs)),height:p.H-p.B-p.T,fill:CV('s3'),opacity:.06},svg);
    let d=''; for(let i=0;i<=140;i++){ const x=-3+7*i/140; d+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(x*x)).toFixed(1); }
    glowPath(el('g',{'clip-path':p.clip},svg),d,CV('s1'),2.8,glow,{});
    glowLine(svg,p.px(xs),p.T,p.px(xs),p.H-p.B,CV('s2'),3,glow);
    txt(svg,p.px(xs)+(cc>1.5?-7:7),p.T+14,'wall at x = '+F(cc,2),'font:800 10.5px system-ui;fill:'+CV('s2'),cc>1.5?'end':'start');
    txt(svg,p.px(-3)+8,p.H-p.B-10,'banned','font:800 11px system-ui;fill:'+CV('s2'));
    txt(svg,p.px(4)-8,p.H-p.B-10,'allowed','font:800 11px system-ui;fill:'+CV('s3'),'end');
    const xstar=Math.max(0,cc), fstar=xstar*xstar, slope=2*xstar;
    el('circle',{cx:p.px(0),cy:p.cy(p.py(0)),r:5,fill:'none',stroke:'var(--ink-muted)','stroke-width':1.8},svg);
    txt(svg,p.px(0),p.cy(p.py(0))+18,'free answer','font:600 9.5px system-ui;fill:var(--ink-muted)','middle');
    glowDot(svg,p.px(xstar),p.cy(p.py(fstar)),6,CV('s4'),glow);
    txt(svg,p.px(xstar)+10,p.cy(p.py(fstar))-8,'answer x* = '+F(xstar,2),'font:800 10.5px system-ui;fill:'+CV('s4'));
    /* the tangent at the answer — flat when the wall is not in the way, tilted when it is */
    const L=1.0, y0=fstar-slope*L, y1=fstar+slope*L;
    el('line',{x1:p.cx(p.px(xstar-L)),y1:p.cy(p.py(y0)),x2:p.cx(p.px(xstar+L)),y2:p.cy(p.py(y1)),stroke:slope>1e-9?CV('critical'):CV('s3'),'stroke-width':2.2,'stroke-dasharray':'5 3'},svg);
    txt(svg,p.cx(p.px(xstar+L))+4,p.cy(p.py(y1)),'f′ = '+F(slope,2),'font:800 10.5px system-ui;fill:'+(slope>1e-9?CV('critical'):CV('s3')));
    read.innerHTML='free answer x = <b>0</b>, f = <b>0</b><br>wall at x ≥ <b>'+F(cc,2)+'</b><br>answer x* = <b>'+F(xstar,2)+'</b>, f* = <b>'+F(fstar,2)+'</b><br>slope at the answer f′ = <b>'+F(slope,2)+'</b>';
    if(cc>0){ verd.className='verdict bad'; verd.textContent='bad for the old test — f′(x*) = '+F(slope,2)+' ≠ 0, and yet there is nowhere better to go'; }
    else { verd.className='verdict good'; verd.textContent='good — the wall is not in the way; the free answer survives and f′ = 0 again'; } }
  /* ---------- tab 2: the valley, in 3D ---------- */
  const U=2.2,V=1.1, VJ=(u,v)=>0.5*u*u+5*v*v, ZTOP=0.5*U*U+5*V*V, ZSV=1.7/ZTOP;
  function build(){ sc=null; const narrow=stage.clientWidth<560;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:narrow?[3.4,3.6,5.2]:[3.1,3.1,4.7],look:[0,.45,0],fov:36},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        const surf=CIN.prim.surface(ctx,VJ,{x:[-U,U],y:[-V,V],res:72,zscale:ZSV,ramp:[colors.s1,colors.s7,colors.s2],opacity:.9,wire:false}); lightenSurface(ctx,surf,ZSV); root.add(surf);
        const floorY=-.2; const grid=CIN.prim.grid(ctx,5,18,hx('grid'),{opacity:isLight?.45:.28}); grid.position.y=floorY; root.add(grid);
        const lv=[]; for(let i=1;i<=8;i++) lv.push(ZTOP*Math.pow(i/9,2.1));
        root.add(liftedContours(ctx,VJ,lv,-U,U,-V,V,ZSV,hx('ink2'),{N:64}));
        const ghost=overlay(CIN.prim.dot(ctx,[0,0,0],hx('ink2'),.04),10); ghost.material.opacity=.6; root.add(ghost);
        const star=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.07),13); root.add(star);
        const halo=haloSprite(ctx,hx('s4'),.6); root.add(halo);
        const wall=CIN.prim.glass(ctx,2*V,1.95,hx('s2'),.22); wall.rotation.y=Math.PI/2; root.add(wall);
        const wallEdge=tube(ctx,[0,0,0],[0,1,0],hx('s2'),.014,.95); root.add(wallEdge);
        const banned=CIN.prim.glass(ctx,1,2*V,hx('s2'),.16); banned.rotation.x=-Math.PI/2; root.add(banned);
        const lab=slot(ctx,root), lab2=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,ghost,star,halo,wall,wallEdge,banned,lab,lab2,floorY};
        hudEl=hud(stage); hint(stage,'drag to orbit'); paintValley(); }, update(){ return false; } });
    if(handle) grab(handle,()=>false,()=>{});
    return handle; }
  function paintValley(cur){ if(!sc) return; const c=cur==null?c2:cur, xs=Math.max(0,c), {star,halo,ghost,wall,wallEdge,banned,lab,lab2,ctx}=sc;
    const q=[xs,VJ(xs,0)*ZSV,0]; star.position.set(q[0],q[1]+.015,q[2]); halo.position.copy(star.position);
    ghost.position.set(0,.012,0);
    wall.position.set(c,.95,0); wall.visible=Math.abs(c)<=U;
    aimTube(ctx.THREE,wallEdge,[c,0,-V],[c,0,V]); wallEdge.visible=Math.abs(c)<=U;
    const bw=Math.max(.01,Math.min(2*U,c+U)); banned.scale.x=bw; banned.position.set((-U+c)/2,sc.floorY+.006,0); banned.visible=c>-U;
    lab.set('answer w* = ('+F(xs,2)+', 0)',[q[0],q[1]+.3,q[2]],{size:19,color:sc.colors.s4,bg:false,depthTest:false,scale:.006});
    lab2.set('wall w₁ = '+F(c,2),[c,1.55,-V-.25],{size:18,color:sc.colors.s2,bg:false,depthTest:false,scale:.006});
    if(hudEl) hudEl.innerHTML='J* = <b>'+F(xs*xs/2,4)+'</b> · µ* = <b>'+F(xs,2)+'</b>';
    RR(ctx); }
  function drawValleyRead(){ const xs=Math.max(0,c2);
    read.innerHTML='w* = (<b>'+F(xs,2)+'</b>, 0), J* = <b>'+F(xs*xs/2,4)+'</b>, µ* = <b>'+F(xs,2)+'</b><br>'+
      'the price of the wall is exactly c: push it in by Δc and the bill rises by c·Δc<br>'+
      'at c = 1: w* = (1, 0), J* = 0.5, µ* = 1';
    if(c2>0){ verd.className='verdict bad'; verd.textContent='bad for the old test — ∂J/∂w₁ = '+F(xs,2)+' ≠ 0 at the answer: the wall is holding it there'; }
    else { verd.className='verdict good'; verd.textContent='good — the wall is behind the bottom: the free answer (0, 0) survives and µ* = 0'; } }
  /* ---------- tab 3: standard form ---------- */
  const RULES={
    r1:{rule:'x ≥ 2',move:'× (−1): a ≥ becomes a ≤',std:'g(x) = 2 − x ≤ 0',kind:'1d',lo:2,side:'ge',
        warn:'∇g = (−1), not (+1) — this sign is where most of the marks go'},
    r2:{rule:'x + 2y ≥ 5',move:'× (−1), then move everything left',std:'g(x, y) = −x − 2y + 5 ≤ 0',kind:'2d',a:1,b:2,cst:5,side:'ge'},
    r3:{rule:'x + y ≤ 1',move:'move everything left; nothing else to do',std:'g(x, y) = x + y − 1 ≤ 0',kind:'2d',a:1,b:1,cst:1,side:'le'},
    r4:{rule:'x + y = 1',move:'keep it as an equality (or split into ≤ and ≥)',std:'e(x, y) = x + y − 1 = 0',kind:'2d',a:1,b:1,cst:1,side:'eq'},
    r5:{rule:'y ≥ 0',move:'× (−1)',std:'g(y) = −y ≤ 0',kind:'2d',a:0,b:1,cst:0,side:'ge'},
    r6:{rule:'x > 2',move:'not allowed in standard form',std:'✗ strict inequalities are banned',kind:'strict'} };
  function drawStd(){ conv.innerHTML=''; const glow=glo(conv), R=RULES[rule];
    txt(conv,16,20,R.rule,'font:800 15px system-ui;fill:'+CV('s4'));
    txt(conv,16,40,'the move:  '+R.move,'font:600 11px system-ui;fill:var(--ink-2)');
    txt(conv,16,60,'standard form:  '+R.std,'font:800 12px system-ui;fill:'+(R.kind==='strict'?CV('critical'):CV('s3')));
    if(R.warn) txt(conv,16,80,'⚠ '+R.warn,'font:700 11px system-ui;fill:'+CV('s2'));
    const hp=hatchPat(conv,'wl-sh',CV('s2'),.5);
    if(R.kind==='1d'||R.kind==='strict'){
      const p=panel(conv,60,150,480,1,-1,5,0,1,{id:'nl',bg:false,xs:1,ys:0,xt:false});
      el('line',{x1:p.px(-1),y1:150,x2:p.px(5),y2:150,stroke:'var(--axis)','stroke-width':2},conv);
      for(let i=-1;i<=5;i++){ el('line',{x1:p.px(i),y1:145,x2:p.px(i),y2:155,stroke:'var(--ink-muted)','stroke-width':1.2},conv); txt(conv,p.px(i),170,String(i),'font:500 10px system-ui;fill:var(--ink-muted)','middle'); }
      el('rect',{x:p.px(-1),y:128,width:p.px(2)-p.px(-1),height:22,fill:hp,opacity:.9},conv);
      el('rect',{x:p.px(2),y:128,width:p.px(5)-p.px(2),height:22,fill:CV('s3'),opacity:.18},conv);
      txt(conv,p.px(0.5),124,'banned','font:700 10px system-ui;fill:'+CV('s2'),'middle');
      txt(conv,p.px(3.5),124,'allowed','font:700 10px system-ui;fill:'+CV('s3'),'middle');
      if(R.kind==='1d'){ el('circle',{cx:p.px(2),cy:150,r:6,fill:CV('s3'),stroke:CV('s3'),'stroke-width':2},conv);
        txt(conv,p.px(2),196,'x = 2 is allowed (filled) — the smallest allowed value exists','font:700 10.5px system-ui;fill:'+CV('s3'),'middle'); }
      else { el('circle',{cx:p.px(2),cy:150,r:6,fill:'var(--page)',stroke:CV('critical'),'stroke-width':2.2},conv);
        const seq=[2.1,2.01,2.001,2.0001], nsh=Math.min(seq.length,1+Math.floor(strictT));
        for(let i=0;i<nsh;i++){ const x=seq[i], X=p.px(Math.min(2.6,2+(x-2)*3)); glowDot(conv,X,150-14-i*0,4,CV('s4'),glow);
          txt(conv,X,150-24,String(x),'font:700 9.5px system-ui;fill:'+CV('s4'),'middle'); }
        txt(conv,p.px(2),196,'x = 2 is NOT allowed (hollow) — every candidate is beaten by a smaller one','font:700 10.5px system-ui;fill:'+CV('critical'),'middle'); }
    } else {
      const p=panel(conv,196,92,208,138,-1.6,2.6,-1.6,2.6,{id:'fs2',xs:1,ys:1});
      const gp=el('g',{'clip-path':p.clip},conv);
      const A=R.a,B=R.b,C=R.cst, inSet=(x,y)=>R.side==='ge'?(A*x+B*y>=C-1e-9):R.side==='le'?(A*x+B*y<=C+1e-9):Math.abs(A*x+B*y-C)<1e-9;
      if(R.side!=='eq'){ for(let i=0;i<64;i++) for(let j=0;j<64;j++){ const x=-1.6+4.2*i/63, y=-1.6+4.2*j/63; if(inSet(x,y)) el('rect',{x:p.px(x),y:p.py(y),width:4,height:4,fill:CV('s3'),opacity:.22},gp); } }
      const pts=[]; for(let i=0;i<=1;i++){ if(Math.abs(B)>1e-9){ const x=-1.6+4.2*i; pts.push([x,(C-A*x)/B]); } else { const y=-1.6+4.2*i; pts.push([C/A,y]); } }
      glowLine(gp,p.px(pts[0][0]),p.cy(p.py(pts[0][1])),p.px(pts[1][0]),p.cy(p.py(pts[1][1])),R.side==='eq'?CV('s4'):CV('s2'),2.8,glow);
      txt(conv,300,246,R.side==='eq'?'only the line itself is allowed':'the shaded half-plane is allowed','font:700 10px system-ui;fill:var(--ink-muted)','middle');
      const gn=R.side==='ge'?[-A,-B]:[A,B];
      if(R.side!=='eq') txt(conv,196,110,'∇g = ('+nm(String(gn[0]))+', '+nm(String(gn[1]))+')','font:800 11px system-ui;fill:'+CV('critical'));
    }
    read.innerHTML='rule: <b>'+R.rule+'</b><br>the move: <b>'+R.move+'</b><br>standard form: <b>'+R.std+'</b>'+(R.warn?'<br>⚠ '+R.warn:'');
    if(R.kind==='strict'){ verd.className='verdict bad'; verd.textContent='bad — no smallest allowed value exists, so the problem has no answer. That is why standard form never uses a strict <.'; }
    else { verd.className='verdict good'; verd.textContent='good — one shape: minimise f subject to g ≤ 0 and e = 0'; } }
  function strictAnim(){ run++; const tok=run; strictT=0; drawStd();
    if(RM){ strictT=4; drawStd(); return; }
    const nxt=()=>{ if(tok!==run) return; if(strictT>=3.99){ drawStd(); return; }
      anim=tween(520,()=>{},()=>{ if(tok!==run) return; strictT++; drawStd(); nxt(); }); }; nxt(); }
  function draw(){ svg.style.display=tab==='knob'?'':'none'; stage.style.display=tab==='valley'?'':'none';
    if(tap) tap.style.display=tab==='valley'?'':'none'; conv.style.display=tab==='std'?'':'none';
    showTab(box,tab);
    if(tab==='knob') drawKnob();
    else if(tab==='valley'){ if(!ST) ST=mountStage(stage,build); else paintValley(); drawValleyRead(); }
    else drawStd(); }
  bindCtl('wl-c',v=>{ cc=v; if(tab==='knob') drawKnob(); },v=>fmt(v,2))();
  bindCtl('wl-c2',v=>{ c2=v; if(tab==='valley'){ paintValley(); drawValleyRead(); } },v=>fmt(v,2))();
  const rbar=document.getElementById('wl-rules');
  ['r1','r2','r3','r4','r5','r6'].forEach(k=>document.getElementById('wl-'+k).addEventListener('click',e=>{
    pressOnly(rbar,e.currentTarget); rule=k; if(k==='r6') strictAnim(); else { run++; drawStd(); } }));
  tabs(document.getElementById('wl-tabs'),t=>{ tab=t; draw(); });
  showTab(box,'knob'); draw();
})();

/* ================= W8 · PUSHING A BOX AGAINST A WALL (the gradient, split in two) ================= */
(function(){
  const box=document.getElementById('w-arrows'),svg=document.getElementById('ar-svg'),bar=document.getElementById('ar-bar'),read=document.getElementById('ar-read'),verd=document.getElementById('ar-verdict');
  if(!box||!svg) return;
  const TAB={
    straight:{X:[-1.6,5.4],Y:[-1.6,5.4],eq:true,tStar:0.5,
      f:(x,y)=>x*x+y*y, gf:(x,y)=>[2*x,2*y],
      at:t=>{ const s=-1.5+7*t; return [s,4-s]; }, tan:()=>{ const n=Math.SQRT1_2; return [n,-n]; },
      gg:()=>[1,1], name:'f = x² + y²  ·  fence  x + y = 4', star:[2,2], mult:'λ', mv:4, fs:8,
      note:'an = path: ∇f is a multiple of ∇h, and the sign of λ is free'},
    round:{X:[-1.9,3.6],Y:[-2.2,2.2],eq:false,tStar:0.5,
      f:(x,y)=>(x-2)*(x-2)+y*y, gf:(x,y)=>[2*(x-2),2*y],
      at:t=>{ const th=Math.PI*(2*t-1); return [Math.cos(th),Math.sin(th)]; },
      tan:t=>{ const th=Math.PI*(2*t-1); return [-Math.sin(th),Math.cos(th)]; },
      gg:(x,y)=>[2*x,2*y], name:'f = (x − 2)² + y²  ·  fence  x² + y² ≤ 1', star:[1,0], mult:'µ', mv:1, fs:1,
      note:'a ≤ fence: ∇f = −µ∇g with µ ≥ 0, so the two arrows point in opposite directions'},
    ridge:{X:[-1.9,3.4],Y:[-1.9,2.6],eq:false,tStar:(Math.atan2(1.2,2.4)/Math.PI+1)/2,
      f:(x,y)=>(x-2.4)*(x-2.4)+(y-1.2)*(y-1.2), gf:(x,y)=>[2*(x-2.4),2*(y-1.2)],
      at:t=>{ const th=Math.PI*(2*t-1); return [Math.cos(th),Math.sin(th)]; },
      tan:t=>{ const th=Math.PI*(2*t-1); return [-Math.sin(th),Math.cos(th)]; },
      gg:(x,y)=>[2*x,2*y], name:'training error centred at (2.4, 1.2)  ·  budget  β₁² + β₂² ≤ 1',
      star:[2.4/Math.sqrt(7.2),1.2/Math.sqrt(7.2)], mult:'µ', mv:null, fs:null,
      note:'this picture IS ridge regression: shrink the coefficients until the budget circle is just touched'}
  };
  let tab='straight',t=0.74,anim=null,run=0;
  const Q=()=>TAB[tab];
  function drawBar(along,glow){ bar.innerHTML='';
    const x0=16,x1=284,y=46, mx=6;
    txt(bar,x0,18,'downhill still available ALONG the fence','font:700 10px system-ui;fill:var(--ink-muted)');
    el('rect',{x:x0,y:y-9,width:x1-x0,height:18,rx:9,fill:'var(--surface-2)',opacity:.5,stroke:'var(--line, var(--ring))'},bar);
    const w=Math.min(1,Math.abs(along)/mx)*(x1-x0), col=Math.abs(along)<0.02?CV('s3'):CV('s7');
    const g=el('g',glow?{filter:glow}:{},bar); el('rect',{x:x0,y:y-9,width:Math.max(3,w),height:18,rx:9,fill:col},g);
    txt(bar,x0+4,y+30,'|along| = '+F(Math.abs(along),4),'font:800 11px system-ui;fill:'+col);
    txt(bar,x1,y+30,Math.abs(along)<0.02?'nothing left to slide':'keep sliding','font:700 10px system-ui;fill:'+col,'end');
    txt(bar,x0,y+54,'at the answer this bar is empty:','font:600 8.8px system-ui;fill:var(--ink-muted)');
    txt(bar,x0,y+66,'all of ∇f then points across the fence','font:600 8.8px system-ui;fill:var(--ink-muted)'); }
  function draw(cur){ const R=Q(), tt=cur==null?t:cur;
    const p=frame(svg,R.X[0],R.X[1],R.Y[0],R.Y[1],{l:42,r:22,t:30,b:28,xs:1,ys:1}); const glow=p.glow;
    txt(svg,p.L,p.T-11,R.name,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    const gp=el('g',{'clip-path':p.clip},svg);
    /* grey level curves of f */
    const lv=[]; for(let i=1;i<=9;i++) lv.push(R.f(R.X[1],R.Y[1])*Math.pow(i/10,2.1));
    contourSegs(R.f,lv,R.X[0],R.X[1],R.Y[0],R.Y[1],70).forEach((L,i)=>L.segs.forEach(s=>el('line',{x1:p.px(s[0]),y1:p.py(s[1]),x2:p.px(s[2]),y2:p.py(s[3]),stroke:'var(--ink-muted)','stroke-width':1,opacity:.28},gp)));
    /* the fence and the allowed side */
    if(R.eq){ glowLine(gp,p.px(-1.5),p.py(5.5),p.px(5.5),p.py(-1.5),CV('s2'),3,glow);
      txt(svg,p.px(4.6),p.py(-0.9),'x + y = 4','font:800 10.5px system-ui;fill:'+CV('s2'),'middle'); }
    else { el('circle',{cx:p.px(0),cy:p.py(0),r:Math.abs(p.px(1)-p.px(0)),fill:CV('s3'),opacity:.13},gp);
      el('circle',{cx:p.px(0),cy:p.py(0),r:Math.abs(p.px(1)-p.px(0)),fill:'none',stroke:CV('s2'),'stroke-width':3,filter:glow||'none'},gp);
      txt(svg,p.px(0),p.py(0)+4,'allowed','font:700 9.5px system-ui;fill:'+CV('s3'),'middle'); }
    /* the answer, always marked */
    el('circle',{cx:p.px(R.star[0]),cy:p.py(R.star[1]),r:7,fill:'none',stroke:CV('s3'),'stroke-width':2,'stroke-dasharray':'3 3'},svg);
    /* the point on the fence, and the three arrows */
    const P=R.at(tt), gf=R.gf(P[0],P[1]), gg=R.gg(P[0],P[1]), tn=R.tan(tt);
    const along=-(gf[0]*tn[0]+gf[1]*tn[1]);                 /* downhill component along the fence */
    const acr=[-gf[0]-(-along)*tn[0],-gf[1]-(-along)*tn[1]];
    const S=Math.min(.34,1.5/Math.max(1,Math.hypot(gf[0],gf[1])));
    arrow(p,P[0],P[1],P[0]+gf[0]*S,P[1]+gf[1]*S,CV('s4'),2.8,'∇f');
    const gn=Math.hypot(gg[0],gg[1])||1, GS=Math.min(.55,1.1/gn);
    arrow(p,P[0],P[1],P[0]+gg[0]*GS,P[1]+gg[1]*GS,CV('critical'),2.4,R.eq?'∇h':'∇g');
    /* the split: along-fence (s7) and across-fence (s4) pieces of the DOWNHILL direction −∇f */
    arrow(p,P[0],P[1],P[0]+along*tn[0]*S,P[1]+along*tn[1]*S,CV('s7'),3.4,'along the fence');
    arrow(p,P[0],P[1],P[0]+acr[0]*S,P[1]+acr[1]*S,CV('s3'),2.2,'across');
    if(Math.abs(along)>0.02){ const u=along>0?1:-1;
      arrow(p,P[0]+tn[0]*u*1.15,P[1]+tn[1]*u*1.15,P[0]+tn[0]*u*1.7,P[1]+tn[1]*u*1.7,CV('s3'),2,'keep sliding'); }
    glowDot(svg,p.px(P[0]),p.py(P[1]),6,CV('s2'),glow);
    txt(svg,p.px(P[0])+9,p.py(P[1])+16,'('+F(P[0],3)+', '+F(P[1],3)+')','font:700 10px system-ui;fill:'+CV('s2'));
    txt(svg,p.L+4,p.H-p.B-8,'drag the dot along the fence','font:600 9px system-ui;fill:var(--ink-muted)');
    drawBar(along,glow);
    /* readout */
    const ang=angleDeg(gf,gg), st=Math.hypot(gf[0],gf[1])/(Math.hypot(gg[0],gg[1])||1);
    let s='angle between ∇f and '+(R.eq?'∇h':'∇g')+': <b>'+(isNaN(ang)?'—':F(ang,1)+'°')+'</b><br>'+
      'along-the-fence part of ∇f: <b>'+F(Math.abs(along),4)+'</b><br>'+
      'stretch factor: <b>'+F(st,4)+'</b>  ('+(R.eq?'∇f = λ∇h':'∇f = −µ∇g')+')';
    if(tab==='straight') s+='<br>at the answer (2, 2): ∇f = (4, 4), ∇h = (1, 1), λ = <b>4</b>, f* = <b>8</b>';
    if(tab==='round') s+='<br>at the answer (1, 0): ∇f = (−2, 0), ∇g = (2, 0), µ = <b>1</b>, f* = <b>1</b>';
    if(tab==='ridge') s+='<br>the touching point is (2.4, 1.2)/‖(2.4, 1.2)‖ = (<b>0.8944</b>, <b>0.4472</b>) — β₁ = 0.8944, β₂ = 0.4472';
    read.innerHTML=s;
    if(Math.abs(along)<0.02){ verd.className='verdict good'; verd.textContent='good — nothing left to slide: all of ∇f points across the fence'; }
    else { verd.className='verdict info'; verd.textContent='info — there is still '+F(Math.abs(along),3)+' of downhill running ALONG the fence: keep sliding that way →'; } }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run; const R=Q(), t0=(R.tStar+0.26)%1, t1=R.tStar; t=t0; setCtl('ar-t',t0,3); draw();
    if(RM){ t=t1; setCtl('ar-t',t1,3); draw(); return; }
    anim=tween(2600,u=>{ if(tok!==run) return; t=t0+(t1-t0)*u; setCtl('ar-t',t,v=>fmt(v,3)); draw(); },()=>{ if(tok!==run) return; t=t1; draw(); }); }
  document.getElementById('ar-play').addEventListener('click',play);
  bindCtl('ar-t',v=>{ stop(); t=v; draw(); },v=>fmt(v,3))();
  tabs(document.getElementById('ar-tabs'),k=>{ stop(); tab=k; t=0.74; setCtl('ar-t',t,3); draw(); });
  /* dragging the dot: project the pointer onto the fence */
  svgDrag(svg,null,(X,Y)=>{ const R=Q(), W=+svg.viewBox.baseVal.width;
    const p={L:42,R:22,T:30,B:28}, PW=600-p.L-p.R, PH=400-p.T-p.B;
    const mx=R.X[0]+(X-p.L)/PW*(R.X[1]-R.X[0]), my=R.Y[0]+(400-p.B-Y)/PH*(R.Y[1]-R.Y[0]);
    let best=t,bd=Infinity; for(let i=0;i<=600;i++){ const tt=i/600, P=R.at(tt), d=(P[0]-mx)*(P[0]-mx)+(P[1]-my)*(P[1]-my); if(d<bd){ bd=d; best=tt; } }
    if(bd>1.6) return; stop(); t=best; setCtl('ar-t',t,v=>fmt(v,3)); draw(); });
  draw();
})();

/* ================= W9 · TURN THE WALL INTO A FINE ================= */
(function(){
  const box=document.getElementById('w-fine'),wsvg=document.getElementById('fn-wall'),bsvg=document.getElementById('fn-bill'),read=document.getElementById('fn-read'),verd=document.getElementById('fn-verdict');
  if(!box||!wsvg) return;
  let mu=2,anim=null,run=0;
  const dOf=m=>2*m-m*m/4;
  function drawWall(){ const p=frame(wsvg,-2,2,-3.2,6.2,{l:40,r:20,t:26,b:26,xs:.5,ys:2});
    const glow=p.glow, hp=hatchPat(wsvg,'fn-h',CV('s2'),.5);
    txt(wsvg,p.L,p.T-9,'the infinite wall 𝟙(g), and the straight line µg trying to do its job','font:600 10.5px system-ui;fill:var(--ink-muted)');
    el('rect',{x:p.px(0),y:p.T,width:p.px(2)-p.px(0),height:p.H-p.B-p.T,fill:hp,opacity:.8},wsvg);
    txt(wsvg,p.px(1),p.T+16,'banned:  g > 0','font:800 11px system-ui;fill:'+CV('s2'),'middle');
    txt(wsvg,p.px(-1),p.T+16,'allowed:  g ≤ 0','font:800 11px system-ui;fill:'+CV('s3'),'middle');
    /* the indicator: flat at 0, then straight up */
    glowLine(wsvg,p.px(-2),p.py(0),p.px(0),p.py(0),CV('s2'),3.2,glow);
    glowLine(wsvg,p.px(0),p.py(0),p.px(0),p.T+4,CV('s2'),3.2,glow);
    el('polygon',{points:p.px(0)+','+(p.T-3)+' '+(p.px(0)-5)+','+(p.T+8)+' '+(p.px(0)+5)+','+(p.T+8),fill:CV('s2')},wsvg);
    txt(wsvg,p.px(0)+8,p.T+30,'𝟙(g) = ∞','font:800 11px system-ui;fill:'+CV('s2'));
    /* the straight line µg */
    const y0=Math.max(-3.2,Math.min(6.2,mu*-2)), y1=Math.max(-3.2,Math.min(6.2,mu*2));
    const xa=Math.abs(mu)>1e-9?Math.max(-2,Math.min(2,-3.2/mu)):-2, xb=Math.abs(mu)>1e-9?Math.max(-2,Math.min(2,6.2/mu)):2;
    glowLine(wsvg,p.cx(p.px(Math.min(xa,xb))),p.cy(p.py(mu*Math.min(xa,xb))),p.cx(p.px(Math.max(xa,xb))),p.cy(p.py(mu*Math.max(xa,xb))),mu<0?CV('critical'):CV('s3'),2.8,glow);
    txt(wsvg,p.px(1.55),p.cy(p.py(mu*1.55))-8,'µg','font:800 11.5px system-ui;fill:'+(mu<0?CV('critical'):CV('s3')),'middle');
    glowDot(wsvg,p.px(0.5),p.cy(p.py(mu*0.5)),5,mu<0?CV('critical'):CV('s3'),glow);
    if(mu<0){ /* the walker sprinting off to the right, paid to trespass */
      for(let i=0;i<4;i++){ const x=0.6+i*0.4; glowDot(wsvg,p.px(Math.min(1.95,x)),p.cy(p.py(mu*x)),3.5-i*.5,CV('critical'),glow); }
      arrow(p,1.2,mu*1.2,1.9,mu*1.9,CV('critical'),2.6,'paid to run →'); }
    txt(wsvg,p.W-p.R,p.H-6,'g →','font:600 9.5px system-ui;fill:var(--ink-muted)','end'); }
  function drawBill(){ const p=frame(bsvg,-1,6,-1.5,12,{l:42,r:20,t:28,b:26,xs:1,ys:3});
    const glow=p.glow, hp=hatchPat(bsvg,'fn-h2',CV('s2'),.5);
    txt(bsvg,p.L,p.T-10,'f(x) = (x − 3)²  ·  fence x ≤ 1  ·  L(x, µ) = f + µ(x − 1)','font:600 10.5px system-ui;fill:var(--ink-muted)');
    el('rect',{x:p.px(1),y:p.T,width:p.px(6)-p.px(1),height:p.H-p.B-p.T,fill:hp,opacity:.6},bsvg);
    const gp=el('g',{'clip-path':p.clip},bsvg);
    const F1=x=>(x-3)*(x-3), L1=x=>F1(x)+mu*(x-1);
    let d1='',d3=''; for(let i=0;i<=160;i++){ const x=-1+7*i/160;
      d1+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(F1(x))).toFixed(1);
      d3+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(L1(x))).toFixed(1); }
    glowPath(gp,d1,CV('s1'),2.4,glow,{opacity:.9});
    /* the true bill: f on the allowed side, a vertical cliff at x = 1 */
    let d2=''; for(let i=0;i<=80;i++){ const x=-1+2*i/80; d2+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(F1(x))).toFixed(1); }
    glowPath(gp,d2,CV('s2'),3.4,glow,{});
    glowLine(gp,p.px(1),p.cy(p.py(4)),p.px(1),p.T+4,CV('s2'),3.2,glow);
    txt(bsvg,p.px(1)+7,p.T+16,'the true bill  J = f + 𝟙','font:800 10.5px system-ui;fill:'+CV('s2'));
    glowPath(gp,d3,mu<0?CV('critical'):CV('s3'),2.8,glow,{});
    const xm=3-mu/2, dv=dOf(mu);
    if(xm>=-1&&xm<=6){ glowDot(bsvg,p.px(xm),p.cy(p.py(L1(xm))),6,mu<0?CV('critical'):CV('s3'),glow);
      txt(bsvg,p.px(xm),p.cy(p.py(L1(xm)))+20,'min L = d(µ) = '+F(dv,3),'font:800 10.5px system-ui;fill:'+(mu<0?CV('critical'):CV('s3')),'middle'); }
    el('line',{x1:p.px(-1),y1:p.cy(p.py(4)),x2:p.px(6),y2:p.cy(p.py(4)),stroke:CV('s4'),'stroke-width':1.4,'stroke-dasharray':'5 3'},bsvg);
    txt(bsvg,p.px(6)-4,p.cy(p.py(4))-6,'p* = 4','font:800 10.5px system-ui;fill:'+CV('s4'),'end');
    glowDot(bsvg,p.px(1),p.cy(p.py(4)),5,CV('s4'),glow);
    txt(bsvg,p.W-p.R,p.H-6,'x →','font:600 9.5px system-ui;fill:var(--ink-muted)','end'); }
  function draw(){ const dv=dOf(mu), at=mu*0.5;
    read.innerHTML='µ = <b>'+F(mu,2)+'</b>  ·  line at g = +0.5: <b>'+F(at,3)+'</b>  vs  wall: <b>∞</b><br>'+
      'max over µ ≥ 0 of µg  =  <b>0</b> if g ≤ 0,  <b>∞</b> if g > 0  — the wall, rebuilt out of straight lines<br>'+
      'min over x of L = d(µ) = <b>2µ − µ²/4</b> = <b>'+F(dv,4)+'</b>  (at x = '+F(3-mu/2,3)+')<br>'+
      'f* on the allowed side = <b>4</b>  ·  gap still open = <b>'+F(4-dv,4)+'</b>';
    if(mu<0){ verd.className='verdict bad'; verd.textContent='bad — a negative fine PAYS you to trespass. That is why µ ≥ 0.'; }
    else if(Math.abs(mu-4)<1e-9){ verd.className='verdict good'; verd.textContent='good — at µ = 4 the straight line does the wall’s whole job: d(4) = 4 = p*'; }
    else if(mu>4){ verd.className='verdict info'; verd.textContent='info — past µ = 4 the fine over-charges and d falls again: d is concave, and 4 is its peak'; }
    else { verd.className='verdict info'; verd.textContent='info — the fine is too small: the cheapest point is still on the banned side, so d(µ) = '+F(dv,3)+' < 4'; }
    drawWall(); drawBill(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run;
    if(RM){ mu=4; setCtl('fn-mu',4,1); draw(); return; }
    anim=tween(5000,u=>{ if(tok!==run) return; const v=u<.5?16*u:8-16*(u-.5); mu=Math.round(Math.max(-2,Math.min(12,v))*10)/10; setCtl('fn-mu',mu,x=>fmt(x,1)); draw(); },
      ()=>{ if(tok!==run) return; mu=0; setCtl('fn-mu',0,x=>fmt(x,1)); draw(); }); }
  document.getElementById('fn-play').addEventListener('click',play);
  const preBar=document.getElementById('fn-pre');
  [['fn-p-zero',0],['fn-p-star',4],['fn-p-neg',-1]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{
    pressOnly(preBar,e.currentTarget); stop(); mu=v; setCtl('fn-mu',v,1); draw(); }));
  bindCtl('fn-mu',v=>{ stop(); mu=v; pressOnly(preBar,null); draw(); },v=>fmt(v,1))();
  draw();
})();

/* ================= W10 · ROOM LEFT, AND THE RULE THAT FALLS OUT OF IT ================= */
(function(){
  const box=document.getElementById('w-room'),svg=document.getElementById('rm-svg'),read=document.getElementById('rm-read'),verd=document.getElementById('rm-verdict');
  if(!box||!svg) return;
  const PULL=1.8;                                   /* the score's pull at the fence: the fine that holds you there */
  let tab='one',x1=-1.2,x2=-0.4,climb=1,anim=null,run=0;
  const state=x=>{ const g=x; if(x<=-0.015) return {g,room:-g,mu:0,k:'inside'};
    if(x<=0.005) return {g:0,room:0,mu:PULL,k:'touch'};
    return {g,room:-g,mu:0,k:'out'}; };
  function gauge(p0,x,S,label,glow){ const {x:X,y:Y,w:W}=p0;
    const px=v=>X+(v+0.6)/3.2*W;                                   /* room ∈ [−0.6, 2.6] maps across the strip */
    const hp=hatchPat(svg,'rm-h',CV('s2'),.5);
    el('rect',{x:px(-0.6),y:Y,width:Math.max(0,px(0)-px(-0.6)),height:26,fill:hp,opacity:.8},svg);
    el('rect',{x:px(0),y:Y,width:Math.max(0,px(2.6)-px(0)),height:26,fill:CV('s3'),opacity:.1},svg);
    glowLine(svg,px(0),Y-8,px(0),Y+34,CV('s2'),3,glow);
    txt(svg,px(0)+6,Y-12,'the fence  g = 0','font:800 10px system-ui;fill:'+CV('s2'));
    txt(svg,px(-0.45),Y+44,'past it','font:700 9.5px system-ui;fill:'+CV('s2'),'middle');
    const col=S.k==='out'?CV('critical'):(S.k==='touch'?CV('s2'):CV('s3'));
    const w=px(Math.max(-0.6,Math.min(2.6,S.room)))-px(0);
    const g=el('g',glow?{filter:glow}:{},svg); el('rect',{x:Math.min(px(0),px(0)+w),y:Y+7,width:Math.max(2,Math.abs(w)),height:12,rx:6,fill:col,opacity:.92},g);
    glowDot(svg,px(Math.max(-0.6,Math.min(2.6,S.room))),Y+13,6,col,glow);
    txt(svg,X,Y-28,label,'font:700 10px system-ui;fill:var(--ink-muted)');
    txt(svg,X+W,Y-28,'room left −g = '+F(S.room,3),'font:800 10.5px system-ui;fill:'+col,'end'); }
  function square(X,Y,SZ,S,glow,title){
    const px=v=>X+Math.max(0,Math.min(1,v/2.6))*SZ, py=v=>Y+SZ-Math.max(0,Math.min(1,v/2.6))*SZ;
    el('rect',{x:X,y:Y,width:SZ,height:SZ,rx:6,fill:'var(--ink-muted)',opacity:.1},svg);
    el('rect',{x:X,y:Y,width:SZ,height:SZ,rx:6,fill:'none',stroke:'var(--line, var(--ring))'},svg);
    txt(svg,X+SZ/2,Y+SZ/2,'never lives here','font:800 11px system-ui;fill:var(--ink-muted)','middle');
    glowLine(svg,X,Y+SZ,X+SZ,Y+SZ,CV('s3'),3.4,glow);            /* the room axis: µ = 0 */
    glowLine(svg,X,Y,X,Y+SZ,CV('s2'),3.4,glow);                   /* the µ axis: g = 0 */
    txt(svg,X+SZ/2,Y+SZ+16,'room left  −g  →','font:700 9.5px system-ui;fill:'+CV('s3'),'middle');
    txt(svg,X-8,Y+SZ/2,'µ ↑','font:700 9.5px system-ui;fill:'+CV('s2'),'end');
    const col=S.k==='out'?CV('critical'):(S.k==='touch'?CV('s2'):CV('s3'));
    const dx=S.k==='out'?X-14:px(S.room), dy=S.k==='touch'?py(S.mu*climb):py(0);
    glowDot(svg,dx,dy,6.5,col,glow);
    if(S.k==='touch') txt(svg,X+10,py(S.mu*climb)-9,'µ = '+F(S.mu*climb,2),'font:800 10px system-ui;fill:'+CV('s2'));
    if(S.k==='inside') txt(svg,px(S.room),Y+SZ-10,'µ = 0','font:800 10px system-ui;fill:'+CV('s3'),'middle');
    if(S.k==='out') txt(svg,X-14,Y+SZ+30,'outside','font:800 10px system-ui;fill:'+CV('critical'),'middle');
    if(title) txt(svg,X,Y-8,title,'font:700 10px system-ui;fill:var(--ink-muted)'); }
  function ledger(X,Y,S,glow){
    txt(svg,X,Y-8,'the slack ledger:  g + t² = 0','font:700 10px system-ui;fill:var(--ink-muted)');
    const t=Math.sqrt(Math.max(0,S.room)), s=Math.min(104,t*62), B=Y+134;
    el('rect',{x:X,y:B-s,width:Math.max(1,s),height:Math.max(1,s),fill:CV('s4'),opacity:.2,stroke:CV('s4'),'stroke-width':1.6},svg);
    glowLine(svg,X,B,X+s,B,CV('s4'),4,glow);
    txt(svg,X+s/2,B+18,'t = √(−g) = '+F(t,3),'font:700 10.5px system-ui;fill:'+CV('s4'),'middle');
    txt(svg,X+s+12,B-s/2,'t² = −g = '+F(t*t,3),'font:700 10.5px system-ui;fill:'+CV('s4'));
    txt(svg,X,B+38,'a square is never negative, so g = −t² ≤ 0 is built in','font:600 9px system-ui;fill:var(--ink-muted)');
    if(S.k==='out') txt(svg,X,B+52,'past the fence there is no real t at all','font:800 9.5px system-ui;fill:'+CV('critical')); }
  function draw(){ svg.innerHTML=''; const glow=glo(svg);
    const S1=state(x1), S2=state(x2);
    txt(svg,40,22,tab==='one'?'one fence: either room, or a fine — never both':'two fences: four patterns, and only one of them is live','font:700 11px system-ui;fill:var(--ink-2)');
    if(tab==='one'){
      gauge({x:44,y:78,w:512},x1,S1,'how much room is left between the answer and the fence',glow);
      square(70,176,176,S1,glow,'the two worlds');
      ledger(330,168,S1,glow);
      const prod=S1.k==='out'?S1.mu*S1.g:0;
      read.innerHTML='−g = <b>'+F(S1.room,3)+'</b> · µ = <b>'+F(S1.mu,3)+'</b> · µ·g = <b>'+F(prod,3)+'</b><br>whatever you drag, this product stays 0';
      if(S1.k==='out'){ verd.className='verdict bad'; verd.textContent='bad — infeasible: you are past the fence, and no fine rate can rescue it'; }
      else if(S1.k==='touch'){ verd.className='verdict good'; verd.textContent='good — pressed against the fence (g = 0), so the fine is free to be positive: THIS fence is holding you back'; }
      else { verd.className='verdict good'; verd.textContent='good — room to spare (g < 0), so the fine is forced to zero: this fence is doing no work'; }
    } else {
      gauge({x:44,y:74,w:512},x1,S1,'fence 1',glow);
      gauge({x:44,y:152,w:512},x2,S2,'fence 2',glow);
      square(60,238,126,S1,glow,'fence 1');
      square(234,238,126,S2,glow,'fence 2');
      const pats=[['µ₁ = 0, µ₂ = 0','inside','inside'],['µ₁ = 0, g₂ = 0','inside','touch'],['g₁ = 0, µ₂ = 0','touch','inside'],['g₁ = 0, g₂ = 0','touch','touch']];
      txt(svg,400,234,'the four patterns','font:700 10px system-ui;fill:var(--ink-muted)');
      pats.forEach((q,i)=>{ const live=q[1]===S1.k&&q[2]===S2.k, yy=256+i*28;
        el('rect',{x:400,y:yy-13,width:164,height:23,rx:8,fill:live?CV('s3'):'var(--surface-2)',opacity:live?.22:.4,stroke:live?CV('s3'):'var(--line, var(--ring))','stroke-width':live?1.6:1},svg);
        txt(svg,410,yy+3,q[0],'font:'+(live?'800':'600')+' 10.5px system-ui;fill:'+(live?CV('s3'):'var(--ink-muted)')); });
      const p1=S1.k==='out'?S1.mu*S1.g:0, p2=S2.k==='out'?S2.mu*S2.g:0;
      read.innerHTML='fence 1: −g₁ = <b>'+F(S1.room,3)+'</b>, µ₁ = <b>'+F(S1.mu,3)+'</b>, µ₁·g₁ = <b>'+F(p1,3)+'</b><br>'+
        'fence 2: −g₂ = <b>'+F(S2.room,3)+'</b>, µ₂ = <b>'+F(S2.mu,3)+'</b>, µ₂·g₂ = <b>'+F(p2,3)+'</b><br>whatever you drag, both products stay 0';
      if(S1.k==='out'||S2.k==='out'){ verd.className='verdict bad'; verd.textContent='bad — infeasible: you are past the fence, and no fine rate can rescue it'; }
      else if(S1.k==='touch'||S2.k==='touch'){ verd.className='verdict good'; verd.textContent='good — pressed against the fence (g = 0), so the fine is free to be positive: THIS fence is holding you back'; }
      else { verd.className='verdict good'; verd.textContent='good — room to spare (g < 0), so the fine is forced to zero: this fence is doing no work'; }
    } }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function setX(v){ const was=state(x1).k; x1=v; const now=state(x1).k;
    if(now==='touch'&&was!=='touch'&&!RM){ stop(); const tok=run; climb=0; draw();
      anim=tween(520,u=>{ if(tok!==run) return; climb=u; draw(); },()=>{ if(tok!==run) return; climb=1; draw(); }); }
    else { climb=1; draw(); } }
  bindCtl('rm-x',v=>setX(v),v=>F(v,2))();
  bindCtl('rm-y',v=>{ x2=v; draw(); },v=>F(v,2))();
  tabs(document.getElementById('rm-tabs'),t=>{ stop(); tab=t; showTab(box,t); draw(); });
  showTab(box,'one'); draw();
})();

/* ================= W11 · FIVE CONDITIONS, A BRANCHING INTERROGATION ================= */
(function(){
  const box=document.getElementById('w-cases'),svg=document.getElementById('cs-svg'),tree=document.getElementById('cs-tree'),work=document.getElementById('cs-work'),check=document.getElementById('cs-check'),verd=document.getElementById('cs-verdict');
  if(!box||!svg) return;
  const TWO=[
    {id:'b1',lab:'µ₁ = 0, µ₂ = 0',pt:[2/3,1/3],ok:true,
     lines:['assume both fences are slack, so µ₁ = µ₂ = 0','∂L/∂x: 2x + λ = 0  ⇒  x = −λ/2','∂L/∂y: 4y + λ = 0  ⇒  y = −λ/4','path: x + y = 1  ⇒  −3λ/4 = 1  ⇒  λ = −4/3','x = 2/3, y = 1/3 — both ≥ 0, so the fences really are slack','f = (2/3)² + 2(1/3)² = 4/9 + 2/9 = 2/3'],
     v:['good','good — survives every condition']},
    {id:'b2',lab:'µ₁ = 0, y = 0',pt:[1,0],ok:false,
     lines:['assume the y ≥ 0 fence is tight: y = 0','path: x + y = 1  ⇒  x = 1','∂L/∂x: 2(1) + λ = 0  ⇒  λ = −2','∂L/∂y: 4(0) + λ − µ₂ = 0  ⇒  µ₂ = λ = −2'],
     v:['bad','bad — rejected: µ₂ = −2 < 0 breaks dual feasibility']},
    {id:'b3',lab:'x = 0, µ₂ = 0',pt:[0,1],ok:false,
     lines:['assume the x ≥ 0 fence is tight: x = 0','path: x + y = 1  ⇒  y = 1','∂L/∂y: 4(1) + λ = 0  ⇒  λ = −4','∂L/∂x: 2(0) + λ − µ₁ = 0  ⇒  µ₁ = λ = −4'],
     v:['bad','bad — rejected: µ₁ = −4 < 0']},
    {id:'b4',lab:'x = 0, y = 0',pt:[0,0],ok:false,
     lines:['assume both fences are tight: x = 0 and y = 0','path: x + y = 0 ≠ 1'],
     v:['bad','bad — rejected on the path, before any fine rate is computed']}];
  const ONE=[
    {id:'c1',lab:'µ = 0 · the fence is slack',pt:[2,2],ok:false,
     lines:['assume x ≥ 3 is not binding, so µ = 0','∂L/∂x: 2x + λ = 0 · ∂L/∂y: 2y + λ = 0  ⇒  x = y','path: x + y = 4  ⇒  x = y = 2, λ = −4','fence: g = 3 − x = 3 − 2 = 1 > 0'],
     v:['bad','bad — rejected: the answer breaks the fence']},
    {id:'c2',lab:'g = 0 · the fence is tight',pt:[3,1],ok:true,
     lines:['assume x ≥ 3 is binding: x = 3','path: x + y = 4  ⇒  y = 1','∂L/∂y: 2y + λ = 0  ⇒  λ = −2','∂L/∂x: 2x + λ − µ = 0  ⇒  6 − 2 − µ = 0  ⇒  µ = 4 ≥ 0 ✓','p* = 3² + 1² = 10'],
     v:['good','good — all five conditions hold: x* = (3, 1), λ = −2, µ = 4, p* = 10']}];
  const CHECKS=['stationarity  ∇f + λ∇h + µ∇g = 0','the path  x + y = 4','the fence  x ≥ 3','one fine charged only when touching  µ·g = 0','every fence fine  µ ≥ 0'];
  let tab='two',pick=null,m=3,ticks=0,anim=null,run=0;
  const rows=()=>tab==='two'?TWO:ONE;
  function drawMap(){ const two=tab==='two';
    const p=frame(svg,two?-0.45:-0.6,two?1.45:4.6,two?-0.45:-0.6,two?1.45:4.6,{l:44,r:20,t:30,b:28,xs:two?.5:1,ys:two?.5:1});
    const glow=p.glow, gp=el('g',{'clip-path':p.clip},svg);
    const f=two?((x,y)=>x*x+2*y*y):((x,y)=>x*x+y*y);
    txt(svg,p.L,p.T-11,two?'minimise x² + 2y²  subject to  x + y = 1,  x ≥ 0,  y ≥ 0':'minimise x² + y²  subject to  x + y = 4,  x ≥ 3','font:600 10.5px system-ui;fill:var(--ink-muted)');
    const lv=[]; for(let i=1;i<=10;i++) lv.push(f(p.X1,p.Y1)*Math.pow(i/11,2));
    contourSegs(f,lv,p.X0,p.X1,p.Y0,p.Y1,70).forEach((L,i)=>L.segs.forEach(s=>el('line',{x1:p.px(s[0]),y1:p.py(s[1]),x2:p.px(s[2]),y2:p.py(s[3]),stroke:'var(--s1)','stroke-width':1,opacity:.16+.04*i},gp)));
    const S=two?1:4;
    glowLine(gp,p.px(p.X0),p.cy(p.py(S-p.X0)),p.px(p.X1),p.cy(p.py(S-p.X1)),'var(--ink-muted)',1.6,null,{'stroke-dasharray':'4 4'});
    if(two) glowLine(gp,p.px(0),p.py(1),p.px(1),p.py(0),CV('s3'),4.4,glow);
    else { glowLine(gp,p.px(3),p.py(1),p.px(4.6),p.cy(p.py(4-4.6)),CV('s3'),4.4,glow);
      glowLine(gp,p.px(3),p.T,p.px(3),p.H-p.B,CV('s2'),2.6,glow);
      txt(svg,p.px(3)+6,p.T+14,'fence x ≥ 3','font:800 10.5px system-ui;fill:'+CV('s2')); }
    txt(svg,p.px(two?.55:3.9),p.cy(p.py(two?.55:0.3))+(two?-10:16),'allowed part of the path','font:700 9.5px system-ui;fill:'+CV('s3'),'middle');
    rows().forEach((r,i)=>{ const lit=pick===r.id, col=lit?(r.ok?CV('s3'):CV('critical')):'var(--ink-muted)';
      if(lit) glowDot(svg,p.px(r.pt[0]),p.cy(p.py(r.pt[1])),7,col,glow);
      else el('circle',{cx:p.px(r.pt[0]),cy:p.cy(p.py(r.pt[1])),r:4.6,fill:'none',stroke:col,'stroke-width':1.8,opacity:.75},svg);
      txt(svg,p.px(r.pt[0])+10,p.cy(p.py(r.pt[1]))-8,'('+trim(r.pt[0].toFixed(3))+', '+trim(r.pt[1].toFixed(3))+')','font:'+(lit?'800':'600')+' 9.5px system-ui;fill:'+col); });
    if(two) txt(svg,p.L+6,p.H-p.B-10,'λ* = −4/3 is negative — and that is allowed. Only fence multipliers must be ≥ 0.','font:700 9.5px system-ui;fill:'+CV('s4')); }
  function drawMany(){ const p=frame(svg,-1,1,0,1,{l:20,r:20,t:34,b:60,xt:false,yt:false});
    const glow=p.glow, N=Math.pow(2,m);
    txt(svg,40,24,'every fence is either doing work or not — so the guesses double, they do not square','font:700 11px system-ui;fill:var(--ink-2)');
    const top=56, bot=248, W=520, X0=40;
    for(let lvl=0;lvl<m;lvl++){ const y0=top+(bot-top)*lvl/m, y1=top+(bot-top)*(lvl+1)/m, k=Math.pow(2,lvl);
      for(let i=0;i<k;i++){ const cx0=X0+W*(i+.5)/k, cxa=X0+W*(2*i+.5)/(2*k), cxb=X0+W*(2*i+1.5)/(2*k);
        el('line',{x1:cx0,y1:y0,x2:cxa,y2:y1,stroke:CV('s1'),'stroke-width':1.2,opacity:.65},svg);
        el('line',{x1:cx0,y1:y0,x2:cxb,y2:y1,stroke:CV('s2'),'stroke-width':1.2,opacity:.65},svg); } }
    for(let lvl=0;lvl<=m;lvl++){ const y=top+(bot-top)*lvl/m, k=Math.pow(2,lvl);
      for(let i=0;i<k;i++) el('circle',{cx:X0+W*(i+.5)/k,cy:y,r:Math.max(1.4,Math.min(4,40/k)),fill:lvl===m?CV('s4'):'var(--ink-muted)',opacity:lvl===m?1:.7},svg); }
    txt(svg,X0+W/2,bot+22,N+' leaves = 2^'+m,'font:800 13px system-ui;fill:'+CV('s4'),'middle');
    txt(svg,X0,top-8,'fence 1: slack or tight?','font:600 9.5px system-ui;fill:var(--ink-muted)');
    /* the table: 2^m against the classic wrong guess m² */
    const tx=X0, ty=bot+44;
    txt(svg,tx,ty,'m','font:700 10px system-ui;fill:var(--ink-muted)');
    txt(svg,tx+60,ty,'2^m (true)','font:700 10px system-ui;fill:'+CV('s4'));
    txt(svg,tx+150,ty,'m² (the slip)','font:700 10px system-ui;fill:'+CV('critical'));
    [2,3,4].forEach((mm,i)=>{ const xx=tx+250+i*100, same=Math.pow(2,mm)===mm*mm;
      el('rect',{x:xx-6,y:ty-13,width:92,height:22,rx:7,fill:same?CV('s3'):CV('critical'),opacity:.16},svg);
      txt(svg,xx,ty+3,'m = '+mm+': '+Math.pow(2,mm)+' vs '+(mm*mm),'font:700 10px system-ui;fill:'+(same?CV('s3'):CV('critical'))); });
    txt(svg,tx,ty+30,'they agree at m = 2 and m = 4 — and nowhere else','font:600 9.5px system-ui;fill:var(--ink-muted)');
    work.innerHTML='m = 3 → <b>8</b> branches (m² would say 9 — the classic slip)<br>'+(m===3?'':'m = '+m+' → <b>'+N+'</b> branches<br>')+'m = 10 → <b>1024</b>; an SVM has one fence per training point, which is why nobody lists cases';
    check.innerHTML=''; verd.className='verdict info';
    verd.textContent=m===3?'info — 2³ = 8, not 3² = 9: each fence doubles the list':'info — '+N+' branches for '+m+' fences: the list doubles with every fence'; }
  function drawChecks(){ if(tab!=='one'){ check.innerHTML=''; return; }
    check.innerHTML=CHECKS.map((c,i)=>'<div style="color:'+(i<ticks?'var(--s3)':'var(--ink-muted)')+'">'+(i<ticks?'✓':'○')+' '+c+'</div>').join(''); }
  function drawTree(){ if(tab==='many'){ tree.innerHTML=''; return; }
    tree.innerHTML=rows().map(r=>'<button class="preset" data-b="'+r.id+'" style="text-align:left"'+(pick===r.id?' aria-pressed="true"':'')+'>'+r.lab+'</button>').join('');
    tree.querySelectorAll('[data-b]').forEach(b=>b.addEventListener('click',()=>{ pick=b.dataset.b; solve(); })); }
  function solve(){ const r=rows().find(q=>q.id===pick);
    if(!r){ work.innerHTML='pick a branch: assume which fences are doing work, then solve and check.'; verd.className='verdict info'; verd.textContent='info — each fence is either slack (µ = 0) or tight (g = 0). Guess, solve, then test.'; drawChecks(); drawTree(); drawMap(); return; }
    work.innerHTML=r.lines.map((l,i)=>'<div style="opacity:'+(0.62+0.38*(i+1)/r.lines.length)+'">'+(i+1)+'. '+l+'</div>').join('');
    verd.className='verdict '+r.v[0]; verd.textContent=r.v[1];
    if(tab==='one'&&r.ok){ run++; const tok=run; ticks=0; drawChecks();
      if(RM){ ticks=5; drawChecks(); }
      else { const nxt=()=>{ if(tok!==run) return; if(ticks>=5) return; anim=tween(260,()=>{},()=>{ if(tok!==run) return; ticks++; drawChecks(); nxt(); }); }; nxt(); } }
    else { run++; ticks=0; drawChecks(); }
    drawTree(); drawMap(); }
  function draw(){ if(tab==='many'){ drawMany(); drawTree(); return; } pick=null; solve(); }
  bindCtl('cs-m',v=>{ m=v|0; if(tab==='many') drawMany(); },v=>String(v|0))();
  tabs(document.getElementById('cs-tabs'),t=>{ run++; tab=t; showTab(box,t); draw(); });
  showTab(box,'two'); draw();
})();

/* ================= W12 · WHICH PROBLEMS ARE HONEST ================= */
(function(){
  const box=document.getElementById('w-bowl'),svg=document.getElementById('bw-svg'),read=document.getElementById('bw-read'),verd=document.getElementById('bw-verdict');
  if(!box||!svg) return;
  const FN={ sq:{f:x=>x*x,d:x=>2*x,n:'x²',cv:true,X:[-2,2],Y:[-0.6,4.4]},
    w:{f:x=>x*x*x*x-3*x*x,d:x=>4*x*x*x-6*x,n:'x⁴ − 3x²',cv:false,X:[-2,2],Y:[-2.9,4.6]},
    abs:{f:x=>Math.abs(x),d:x=>x>0?1:(x<0?-1:0),n:'|x|',cv:true,X:[-2,2],Y:[-0.5,2.4]},
    exp:{f:x=>Math.exp(x),d:x=>Math.exp(x),n:'eˣ',cv:true,X:[-2,2],Y:[-0.6,7.6]},
    cube:{f:x=>x*x*x,d:x=>3*x*x,n:'x³',cv:false,X:[-2,2],Y:[-8.4,8.4]},
    sqrt:{f:x=>Math.sqrt(Math.abs(x)),d:x=>Math.abs(x)<1e-6?0:0.5*Math.sign(x)/Math.sqrt(Math.abs(x)),n:'√|x|',cv:false,X:[-2,2],Y:[-0.4,1.7]} };
  const SETS={
    disc:{n:'a disc',inS:p=>Math.hypot(p[0],p[1])<=1.25,tour:t=>{ const a=2*Math.PI*t; return [1.05*Math.cos(a),1.05*Math.sin(a)]; },
      draw:(p,gp)=>{ el('circle',{cx:p.px(0),cy:p.py(0),r:Math.abs(p.px(1.25)-p.px(0)),fill:CV('s3'),opacity:.16,stroke:CV('s3'),'stroke-width':2},gp); },cv:true},
    poly:{n:'a polygon',inS:p=>{ for(let k=0;k<5;k++){ const a=Math.PI/2+2*Math.PI*k/5; if(p[0]*Math.cos(a)+p[1]*Math.sin(a)>1.1+1e-9) return false; } return true; },
      tour:t=>{ const a=2*Math.PI*t; return [0.82*Math.cos(a),0.82*Math.sin(a)]; },
      draw:(p,gp)=>{ const pts=[]; for(let k=0;k<5;k++){ const a=Math.PI/2+2*Math.PI*k/5, b=Math.PI/2+2*Math.PI*(k+1)/5;
          const den=Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b); pts.push([(1.1*Math.sin(b)-1.1*Math.sin(a))/den,(1.1*Math.cos(a)-1.1*Math.cos(b))/den]); }
        el('polygon',{points:pts.map(q=>p.px(q[0])+','+p.py(q[1])).join(' '),fill:CV('s3'),opacity:.16,stroke:CV('s3'),'stroke-width':2},gp); },cv:true},
    ring:{n:'an annulus',inS:p=>{ const r=Math.hypot(p[0],p[1]); return r>=0.62&&r<=1.32; },
      tour:t=>{ const a=2*Math.PI*t; return [0.97*Math.cos(a),0.97*Math.sin(a)]; },
      draw:(p,gp)=>{ el('circle',{cx:p.px(0),cy:p.py(0),r:Math.abs(p.px(1.32)-p.px(0)),fill:CV('s3'),opacity:.16,stroke:CV('s3'),'stroke-width':2},gp);
        el('circle',{cx:p.px(0),cy:p.py(0),r:Math.abs(p.px(0.62)-p.px(0)),fill:'var(--page)',stroke:CV('s3'),'stroke-width':2},gp); },cv:false},
    moon:{n:'a crescent',inS:p=>Math.hypot(p[0],p[1])<=1.25&&Math.hypot(p[0]-0.8,p[1])>=0.95,
      tour:t=>{ const a=Math.PI*(0.28+1.44*t); return [1.06*Math.cos(a),1.06*Math.sin(a)]; },
      draw:(p,gp)=>{ const id='moon-'+(svg.id||'s'), defs=svg.querySelector('defs')||el('defs',{},svg);
        const mk=el('mask',{id},defs); el('circle',{cx:p.px(0),cy:p.py(0),r:Math.abs(p.px(1.25)-p.px(0)),fill:'#fff'},mk);
        el('circle',{cx:p.px(0.8),cy:p.py(0),r:Math.abs(p.px(0.95)-p.px(0)),fill:'#000'},mk);
        el('circle',{cx:p.px(0),cy:p.py(0),r:Math.abs(p.px(1.25)-p.px(0)),fill:CV('s3'),opacity:.2,mask:'url(#'+id+')'},gp);
        el('circle',{cx:p.px(0),cy:p.py(0),r:Math.abs(p.px(1.25)-p.px(0)),fill:'none',stroke:CV('s3'),'stroke-width':2},gp);
        el('circle',{cx:p.px(0.8),cy:p.py(0),r:Math.abs(p.px(0.95)-p.px(0)),fill:'none',stroke:CV('s3'),'stroke-width':2,'stroke-dasharray':'4 3'},gp); },cv:false} };
  let tab='chord',key='sq',skey='disc',ta=0.18,tb=0.86,th=0.5,sweep=null,anim=null,run=0;
  const Q=()=>FN[key], XA=()=>Q().X[0]+(Q().X[1]-Q().X[0])*ta, XB=()=>Q().X[0]+(Q().X[1]-Q().X[0])*tb;
  function chordFails(){ const R=Q(); let bad=0; const N=200;
    for(let i=0;i<N;i++){ const a=R.X[0]+(R.X[1]-R.X[0])*((i*0.6180339887498949)%1), b=R.X[0]+(R.X[1]-R.X[0])*((i*0.2360679774997896+0.37)%1);
      for(const t of [0.35,0.5,0.65]){ const m=t*a+(1-t)*b; if(R.f(m)>t*R.f(a)+(1-t)*R.f(b)+1e-9){ bad++; break; } } }
    return bad; }
  function drawCurve(){ const R=Q(), p=frame(svg,R.X[0],R.X[1],R.Y[0],R.Y[1],{l:44,r:20,t:30,b:28,xs:.5,ys:Math.max(0.5,Math.round((R.Y[1]-R.Y[0])/6*2)/2)});
    const glow=p.glow, gp=el('g',{'clip-path':p.clip},svg);
    txt(svg,p.L,p.T-11,'f(x) = '+R.n+'  ·  '+(tab==='chord'?'does any chord dip below the curve?':'does the curve ever fall below a tangent?'),'font:600 10.5px system-ui;fill:var(--ink-muted)');
    let d=''; for(let i=0;i<=240;i++){ const x=R.X[0]+(R.X[1]-R.X[0])*i/240; d+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(R.f(x))).toFixed(1); }
    if(sweep&&sweep.shown) sweep.pairs.slice(0,sweep.shown).forEach(q=>{
      el('line',{x1:p.px(q[0]),y1:p.cy(p.py(R.f(q[0]))),x2:p.px(q[1]),y2:p.cy(p.py(R.f(q[1]))),stroke:q[2]?CV('critical'):'var(--ink-muted)','stroke-width':1,opacity:q[2]?.5:.16},gp); });
    if(tab==='chord'){
      const a=XA(), b=XB(), lo=Math.min(a,b), hi=Math.max(a,b);
      /* flood where the chord dips below the curve */
      const ya=R.f(a), yb=R.f(b), line=x=>ya+(yb-ya)*((x-a)/((b-a)||1e-9));
      let poly='',back=''; let any=false;
      for(let i=0;i<=120;i++){ const x=lo+(hi-lo)*i/120; poly+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(line(x))).toFixed(1); if(R.f(x)>line(x)+1e-9) any=true; }
      for(let i=120;i>=0;i--){ const x=lo+(hi-lo)*i/120; back+='L'+p.px(x).toFixed(1)+','+p.cy(p.py(R.f(x))).toFixed(1); }
      if(any) el('path',{d:poly+back+'Z',fill:CV('critical'),opacity:.26},gp);
      glowPath(gp,d,CV('s1'),2.8,glow,{});
      glowLine(gp,p.px(a),p.cy(p.py(ya)),p.px(b),p.cy(p.py(yb)),any?CV('critical'):CV('s3'),2.6,glow);
      glowDot(svg,p.px(a),p.cy(p.py(ya)),5.5,CV('s4'),glow); glowDot(svg,p.px(b),p.cy(p.py(yb)),5.5,CV('s4'),glow);
      const mx=th*a+(1-th)*b, lhs=R.f(mx), rhs=th*ya+(1-th)*yb;
      el('line',{x1:p.px(mx),y1:p.cy(p.py(lhs)),x2:p.px(mx),y2:p.cy(p.py(rhs)),stroke:CV('s7'),'stroke-width':2.4},gp);
      glowDot(svg,p.px(mx),p.cy(p.py(lhs)),4.4,CV('s7'),glow);
      txt(svg,p.px(mx)+7,p.cy(p.py((lhs+rhs)/2)),'gap '+F(rhs-lhs,3),'font:700 10px system-ui;fill:'+CV('s7'));
      read.innerHTML='θ = <b>'+F(th,2)+'</b>  ·  f(θx+(1−θ)y) = <b>'+F(lhs,4)+'</b>  ·  θf(x)+(1−θ)f(y) = <b>'+F(rhs,4)+'</b>  ·  <b>'+(lhs<=rhs+1e-9?'≤ holds':'FAILS')+'</b>'+
        (sweep&&sweep.done?'<br>the chord test failed at <b>'+sweep.bad+'</b> of 200 sampled pairs':'');
      if(lhs<=rhs+1e-9){ verd.className='verdict '+(R.cv?'good':'info'); verd.textContent=R.cv?'good — a bowl: no chord ever cuts into it, so a stopping point is THE answer':'info — this pair passes, but the function is not a bowl: press ▶ to find the pairs that fail'; }
      else { verd.className='verdict bad'; verd.textContent='bad — the chord dips below the curve: this is not a bowl, so a stopping point is only a candidate'; }
    } else {
      const a=XA(), ya=R.f(a), da=R.d(a), line=x=>ya+da*(x-a);
      let poly='',back='',fails=0;
      for(let i=0;i<=240;i++){ const x=R.X[0]+(R.X[1]-R.X[0])*i/240; if(R.f(x)<line(x)-1e-7) fails++; }
      for(let i=0;i<=240;i++){ const x=R.X[0]+(R.X[1]-R.X[0])*i/240; poly+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(line(x))).toFixed(1); }
      for(let i=240;i>=0;i--){ const x=R.X[0]+(R.X[1]-R.X[0])*i/240; back+='L'+p.px(x).toFixed(1)+','+p.cy(p.py(R.f(x))).toFixed(1); }
      if(fails) el('path',{d:poly+back+'Z',fill:CV('critical'),opacity:.2},gp);
      glowPath(gp,d,CV('s1'),2.8,glow,{});
      glowLine(gp,p.px(R.X[0]),p.cy(p.py(line(R.X[0]))),p.px(R.X[1]),p.cy(p.py(line(R.X[1]))),fails?CV('critical'):CV('s3'),2.4,glow);
      glowDot(svg,p.px(a),p.cy(p.py(ya)),5.5,CV('s4'),glow);
      txt(svg,p.px(a)+8,p.cy(p.py(ya))+18,'tangent at x = '+F(a,2),'font:700 10px system-ui;fill:'+CV('s4'));
      let bad=0; for(let k=0;k<200;k++){ const a=R.X[0]+(R.X[1]-R.X[0])*k/199, ya=R.f(a), da=R.d(a);
        for(let j=0;j<=60;j++){ const y=R.X[0]+(R.X[1]-R.X[0])*j/60; if(R.f(y)<ya+da*(y-a)-1e-7){ bad++; break; } } }
      read.innerHTML='f(y) ≥ f(x) + f′(x)(y−x)?  <b>'+(fails?'fails on '+F(fails/241*(R.X[1]-R.X[0]),2)+' of the '+F(R.X[1]-R.X[0],0)+' units of x':'holds everywhere')+'</b><br>'+
        'over the whole domain, <b>'+bad+'</b> of 200 tangent points fail — the chord test fails on exactly the same curves<br>'+
        'the two tests agree on every curve here: a chord that cuts in is exactly a tangent that pokes out';
      if(!fails){ verd.className='verdict '+(R.cv?'good':'info'); verd.textContent=R.cv?'good — the curve never falls below a tangent: a bowl':'info — this tangent is safe; drag it to where the curve bends the wrong way'; }
      else { verd.className='verdict bad'; verd.textContent='bad — the curve dives under its own tangent: not a bowl'; } } }
  function drawSet(){ const S=SETS[skey], p=frame(svg,-1.7,1.7,-1.55,1.55,{l:44,r:20,t:30,b:28,xs:.5,ys:.5});
    const glow=p.glow, gp=el('g',{'clip-path':p.clip},svg);
    txt(svg,p.L,p.T-11,S.n+'  ·  does the segment between two of its points ever leave it?','font:600 10.5px system-ui;fill:var(--ink-muted)');
    S.draw(p,gp);
    const A=S.tour(ta), B=S.tour(tb); let out=0;
    for(let i=0;i<=120;i++){ const u=i/120, q=[A[0]+(B[0]-A[0])*u,A[1]+(B[1]-A[1])*u];
      const inS=S.inS(q); if(!inS) out++;
      if(i<120){ const u2=(i+1)/120, q2=[A[0]+(B[0]-A[0])*u2,A[1]+(B[1]-A[1])*u2];
        el('line',{x1:p.px(q[0]),y1:p.py(q[1]),x2:p.px(q2[0]),y2:p.py(q2[1]),stroke:inS?CV('s4'):CV('critical'),'stroke-width':inS?3:4.2,'stroke-linecap':'round'},gp); } }
    glowDot(svg,p.px(A[0]),p.py(A[1]),5.5,CV('s4'),glow); glowDot(svg,p.px(B[0]),p.py(B[1]),5.5,CV('s4'),glow);
    read.innerHTML='the segment leaves the set: <b>'+(out>0?'yes':'no')+'</b>'+(out>0?' ('+F(out/121*100,0)+' % of it is outside)':'')+
      '<br>a convex set contains every segment between two of its points — no exceptions, no thin bits';
    if(out>0){ verd.className='verdict bad'; verd.textContent='bad — not a convex set: two allowed points with a banned stretch between them'; }
    else { verd.className='verdict '+(S.cv?'good':'info'); verd.textContent=S.cv?'good — a convex set: every segment stays inside':'info — this pair stays inside, but drag the points across the hole'; } }
  function draw(){ if(tab==='sets') drawSet(); else drawCurve(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run;
    if(tab==='sets'){ let k=0; const nxt=()=>{ if(tok!==run) return; if(k>=1) return; k++;
        anim=tween(2200,u=>{ if(tok!==run) return; tb=0.14+0.72*u; setCtl('bw-b',tb,3); draw(); },()=>{}); }; nxt(); return; }
    const R=Q(), pairs=[]; let bad=0;
    for(let i=0;i<200;i++){ const a=R.X[0]+(R.X[1]-R.X[0])*((i*0.6180339887498949)%1), b=R.X[0]+(R.X[1]-R.X[0])*((i*0.2360679774997896+0.37)%1);
      let f=false; for(const t of [0.35,0.5,0.65]){ const m=t*a+(1-t)*b; if(R.f(m)>t*R.f(a)+(1-t)*R.f(b)+1e-9){ f=true; break; } }
      if(f) bad++; pairs.push([a,b,f]); }
    sweep={pairs,bad,shown:0,done:false};
    if(RM){ sweep.shown=200; sweep.done=true; draw(); return; }
    anim=tween(2400,u=>{ if(tok!==run) return; sweep.shown=Math.round(u*200); draw(); },()=>{ if(tok!==run) return; sweep.shown=200; sweep.done=true; draw(); }); }
  document.getElementById('bw-play').addEventListener('click',play);
  const fbar=document.getElementById('bw-f'), sbar=document.getElementById('bw-s');
  fbar.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{ stop(); pressOnly(fbar,b); key=b.dataset.f; sweep=null; draw(); }));
  sbar.querySelectorAll('[data-s]').forEach(b=>b.addEventListener('click',()=>{ stop(); pressOnly(sbar,b); skey=b.dataset.s; draw(); }));
  bindCtl('bw-a',v=>{ stop(); ta=v; draw(); },v=>fmt(v,3))();
  bindCtl('bw-b',v=>{ stop(); tb=v; draw(); },v=>fmt(v,3))();
  bindCtl('bw-th',v=>{ th=v; draw(); },v=>fmt(v,2))();
  tabs(document.getElementById('bw-tabs'),t=>{ stop(); tab=t; sweep=null;
    fbar.style.display=t==='sets'?'none':''; sbar.style.display=t==='sets'?'':'none';
    document.getElementById('bw-b').parentNode.style.display=t==='tangent'?'none':'';
    document.getElementById('bw-th').parentNode.style.display=t==='chord'?'':'none'; draw(); });
  sbar.style.display='none'; document.getElementById('bw-th').parentNode.style.display='';
  /* dragging the two points */
  svgDrag(svg,null,(X)=>{ const R=tab==='sets'?{X:[-1.7,1.7]}:Q(), L=44, W=600-44-20;
    const u=Math.max(0,Math.min(1,(X-L)/W));
    stop(); if(tab==='tangent'){ ta=u; setCtl('bw-a',u,3); }
    else if(Math.abs(u-ta)<Math.abs(u-tb)){ ta=u; setCtl('bw-a',u,3); } else { tb=u; setCtl('bw-b',u,3); } draw(); });
  draw();
})();

/* ================= W13 · WHO MOVES FIRST (primal, dual, the bundle, and a real gap) ================= */
(function(){
  const box=document.getElementById('w-duel'),svg=document.getElementById('du-svg'),caseBar=document.getElementById('du-case'),read=document.getElementById('du-read'),verd=document.getElementById('du-verdict');
  if(!box||!svg) return;
  /* the non-convex tab's two problems. d(µ) = min over x of f + µg, by a fine grid then Newton on h' = 0. */
  const GAP={
    bands:{name:'f(x) = x   subject to  g(x) = (x² − 1)(x² − 4) ≤ 0',gtex:'x⁴ − 5x² + 4',
      f:x=>x, g:x=>(x*x-1)*(x*x-4), XR:[-7,7], N:6000, MU:0.5, pstar:-2,
      hd:(x,m)=>1+m*(4*x*x*x-10*x), hdd:(x,m)=>m*(12*x*x-10), bands:[[-2,-1],[1,2]], GX:[-2.6,2.6]},
    wells:{name:'f(x) = (x² − 1)² + 0.4x   subject to  g(x) = −x ≤ 0',gtex:'−x',
      f:x=>Math.pow(x*x-1,2)+0.4*x, g:x=>-x, XR:[-2.2,2.2], N:6000, MU:1.2, pstar:null,
      hd:(x,m)=>4*x*(x*x-1)+0.4-m, hdd:()=>0, bands:[[0,2.2]], GX:[-2.2,2.2],
      hdd2:x=>12*x*x-4},
  };
  function dOfCase(C,mu){ if(!(mu>0)&&C===GAP.bands) return {d:-Infinity,x:C.XR[0]};
    const h=x=>C.f(x)+mu*C.g(x); let bx=C.XR[0],bv=Infinity;
    for(let i=0;i<=C.N;i++){ const x=C.XR[0]+(C.XR[1]-C.XR[0])*i/C.N, v=h(x); if(v<bv){ bv=v; bx=x; } }
    let x=bx; for(let k=0;k<12;k++){ const d1=C.hd(x,mu), d2=C.hdd2?C.hdd2(x):C.hdd(x,mu); if(!isFinite(d2)||Math.abs(d2)<1e-9) break;
      const nx=x-d1/d2; if(!isFinite(nx)||nx<C.XR[0]||nx>C.XR[1]) break; x=nx; }
    const v=h(x); return v<bv?{d:v,x}:{d:bv,x:bx}; }
  function starOf(C){ let best=-Infinity,bm=0;
    for(let i=1;i<=1200;i++){ const mu=C.MU*i/1200, v=dOfCase(C,mu).d; if(v>best){ best=v; bm=mu; } }
    let lo=Math.max(0,bm-C.MU/1200), hi=Math.min(C.MU,bm+C.MU/1200);
    for(let k=0;k<80;k++){ const a=lo+(hi-lo)*.382, b=lo+(hi-lo)*.618; if(dOfCase(C,a).d<dOfCase(C,b).d) lo=a; else hi=b; }
    const mu=(lo+hi)/2; return {mu,d:dOfCase(C,mu).d}; }
  function pOf(C){ if(C.pstar!=null) return C.pstar; let b=Infinity;
    for(let i=0;i<=20000;i++){ const x=C.bands[0][0]+(C.bands[0][1]-C.bands[0][0])*i/20000; b=Math.min(b,C.f(x)); } return b; }
  const MEMO={};
  function facts(k){ if(MEMO[k]) return MEMO[k]; const C=GAP[k], s=starOf(C), p=pOf(C);
    return MEMO[k]={C,dstar:s.d,mustar:s.mu,pstar:p,gap:p-s.d}; }
  let tab='two',cs='bands',dx=1,dmu=4,dxl=3,run=0;
  const fP=x=>(x-3)*(x-3), gP=x=>x-1, dP=m=>2*m-m*m/4;
  function drawTwo(){ svg.innerHTML=''; const glow=glo(svg), hp=hatchPat(svg,'du-h',CV('s2'),.5);
    const A=panel(svg,50,52,240,250,-1,5,-1,10.5,{id:'pr',xs:1,ys:2,title:'the primal, in x'});
    el('rect',{x:A.px(1),y:A.y,width:A.px(5)-A.px(1),height:A.h,fill:hp,opacity:.6},svg);
    const ga=el('g',{'clip-path':A.clip},svg);
    let d=''; for(let i=0;i<=160;i++){ const x=-1+6*i/160; d+=(i?'L':'M')+A.px(x).toFixed(1)+','+A.cy(A.py(fP(x))).toFixed(1); }
    glowPath(ga,d,CV('s1'),2.8,glow,{});
    el('line',{x1:A.x,y1:A.py(4),x2:A.x+A.w,y2:A.py(4),stroke:CV('s4'),'stroke-width':1.6,'stroke-dasharray':'5 3'},svg);
    glowDot(svg,A.px(1),A.py(4),6,CV('s4'),glow); txt(svg,A.px(1)-8,A.py(4)-10,'p* = 4','font:800 11px system-ui;fill:'+CV('s4'),'end');
    const xv=Math.max(-1,Math.min(5,dx)); glowDot(svg,A.px(xv),A.cy(A.py(fP(xv))),5,CV('s2'),glow);
    txt(svg,A.px(xv)+8,A.cy(A.py(fP(xv)))-8,'p(x) = '+F(fP(xv),3),'font:700 10px system-ui;fill:'+CV('s2'));
    txt(svg,A.px(3.4),A.y+16,'banned  x > 1','font:700 10px system-ui;fill:'+CV('s2'),'middle');
    const B=panel(svg,330,52,230,250,0,10,-1,10.5,{id:'du',xs:2,ys:2,title:'the dual, in µ ≥ 0',yt:false});
    const gb=el('g',{'clip-path':B.clip},svg);
    let d2=''; for(let i=0;i<=160;i++){ const m=10*i/160; d2+=(i?'L':'M')+B.px(m).toFixed(1)+','+B.cy(B.py(dP(m))).toFixed(1); }
    glowPath(gb,d2,CV('s3'),2.8,glow,{});
    el('line',{x1:B.x,y1:B.py(4),x2:B.x+B.w,y2:B.py(4),stroke:CV('s4'),'stroke-width':1.6,'stroke-dasharray':'5 3'},svg);
    glowDot(svg,B.px(4),B.py(4),6,CV('s4'),glow); txt(svg,B.px(4)+8,B.py(4)-10,'d* = 4 at µ* = 4','font:800 11px system-ui;fill:'+CV('s4'));
    const mv=Math.max(0,Math.min(10,dmu)); glowDot(svg,B.px(mv),B.cy(B.py(dP(mv))),5,CV('s3'),glow);
    txt(svg,B.px(mv)+8,B.cy(B.py(dP(mv)))+16,'d(µ) = '+F(dP(mv),3),'font:700 10px system-ui;fill:'+CV('s3'));
    txt(svg,300,330,'the dashed line is one number seen from two sides','font:700 10px system-ui;fill:'+CV('s4'),'middle');
    const gapNow=fP(xv)-dP(mv);
    read.innerHTML='p(x) = <b>'+F(fP(xv),4)+'</b>   d(µ) = <b>'+F(dP(mv),4)+'</b>   gap so far = <b>'+F(gapNow,4)+'</b><br>'+
      'd(µ) = <b>2µ − µ²/4</b>, maximised at µ* = 4<br>p* = 4 = d*  →  zero duality gap (strong duality)';
    if(Math.abs(fP(xv)-4)<1e-6&&Math.abs(dP(mv)-4)<1e-6){ verd.className='verdict good'; verd.textContent='good — p* = 4 = d*: the two views meet, so the dual answer IS the primal answer'; }
    else { verd.className='verdict info'; verd.textContent='info — every allowed x is above every d(µ): weak duality is the whole left-hand column of this picture'; } }
  function drawBundle(){ svg.innerHTML=''; const glow=glo(svg);
    const p=panel(svg,58,54,500,250,0,8,-3,10.5,{id:'bd',xs:1,ys:2,title:'one straight line per x:  µ ↦ L(x, µ) = f(x) + µ g(x)'});
    const gp=el('g',{'clip-path':p.clip},svg);
    const XS=[]; for(let i=0;i<40;i++) XS.push(-1+6*i/39);
    XS.forEach(x=>{ const h=fP(x), s=gP(x);
      el('line',{x1:p.px(0),y1:p.cy(p.py(h)),x2:p.px(8),y2:p.cy(p.py(h+8*s)),stroke:CV('s1'),'stroke-width':1,opacity:.28},gp); });
    let d=''; for(let i=0;i<=200;i++){ const m=8*i/200; let lo=Infinity; XS.forEach(x=>{ lo=Math.min(lo,fP(x)+m*gP(x)); });
      d+=(i?'L':'M')+p.px(m).toFixed(1)+','+p.cy(p.py(lo)).toFixed(1); }
    glowPath(gp,d,CV('s3'),3.4,glow,{});
    const xl=Math.max(-1,Math.min(5,dxl)), h=fP(xl), s=gP(xl);
    glowLine(gp,p.px(0),p.cy(p.py(h)),p.px(8),p.cy(p.py(h+8*s)),CV('s4'),2.8,glow);
    glowDot(svg,p.px(0),p.cy(p.py(h)),5,CV('s4'),glow);
    glowDot(svg,p.px(4),p.py(4),6,CV('s3'),glow); txt(svg,p.px(4)+8,p.py(4)-10,'d* = 4','font:800 11px system-ui;fill:'+CV('s3'));
    txt(svg,p.x+8,p.y+18,'x = '+F(xl,2)+' → height f(x) = '+F(h,3)+', slope g(x) = '+F(s,3),'font:800 10.5px system-ui;fill:'+CV('s4'));
    txt(svg,308,330,'the thick curve is the lowest of all forty straight lines — and it bends downward','font:700 10.5px system-ui;fill:'+CV('s3'),'middle');
    read.innerHTML='d is the lowest of 40 straight lines. The lowest of any bundle of straight lines bends downward — so the dual is ALWAYS concave, however ugly f is.<br>'+
      'highlighted: x = <b>'+F(xl,2)+'</b> → height f(x) = <b>'+F(h,4)+'</b>, slope g(x) = <b>'+F(s,4)+'</b>';
    verd.className='verdict good'; verd.textContent='good — concavity is free: it comes from the SHAPE of the dual, not from any assumption about f or g'; }
  function drawGap(){ svg.innerHTML=''; const glow=glo(svg); const K=facts(cs), C=K.C, hp=hatchPat(svg,'du-h2',CV('s2'),.5);
    txt(svg,50,26,'minimise  '+C.name,'font:700 11px system-ui;fill:var(--ink-2)');
    /* left: g, with the allowed bands shaded */
    const A=panel(svg,50,58,240,238,C.GX[0],C.GX[1],-4.2,6.2,{id:'g1',xs:1,ys:2,title:'g(x) = '+C.gtex+'  ·  allowed where g ≤ 0'});
    const ga=el('g',{'clip-path':A.clip},svg);
    { const NS=240, W=A.w/NS; let run0=null;                       /* shade the x-intervals, not the half-plane */
      for(let i=0;i<=NS;i++){ const x=C.GX[0]+(C.GX[1]-C.GX[0])*i/NS, bad=C.g(x)>0;
        if(bad&&run0===null) run0=x;
        if((!bad||i===NS)&&run0!==null){ el('rect',{x:A.px(run0),y:A.y,width:Math.max(1,A.px(x)-A.px(run0)),height:A.h,fill:hp,opacity:.7},ga);
          el('rect',{x:A.px(run0),y:A.y,width:Math.max(1,A.px(x)-A.px(run0)),height:A.h,fill:CV('s2'),opacity:.05},ga); run0=null; } } }
    C.bands.forEach(b=>el('rect',{x:A.px(Math.max(C.GX[0],b[0])),y:A.y,width:A.px(Math.min(C.GX[1],b[1]))-A.px(Math.max(C.GX[0],b[0])),height:A.h,fill:CV('s3'),opacity:.2},ga));
    let dg=''; for(let i=0;i<=200;i++){ const x=C.GX[0]+(C.GX[1]-C.GX[0])*i/200; dg+=(i?'L':'M')+A.px(x).toFixed(1)+','+A.cy(A.py(C.g(x))).toFixed(1); }
    glowPath(ga,dg,CV('s2'),2.6,glow,{});
    let df=''; for(let i=0;i<=200;i++){ const x=C.GX[0]+(C.GX[1]-C.GX[0])*i/200; df+=(i?'L':'M')+A.px(x).toFixed(1)+','+A.cy(A.py(C.f(x))).toFixed(1); }
    glowPath(ga,df,CV('s1'),2.4,glow,{});
    el('rect',{x:A.x+4,y:A.y+5,width:150,height:40,rx:6,fill:'var(--surface)',opacity:.86},svg);
    txt(svg,A.x+10,A.y+19,'— f(x)','font:700 9.5px system-ui;fill:'+CV('s1'));
    txt(svg,A.x+10,A.y+31,'— g(x)','font:700 9.5px system-ui;fill:'+CV('s2'));
    txt(svg,A.x+10,A.y+43,'hatched = banned, green = allowed','font:600 8.6px system-ui;fill:var(--ink-muted)');
    const xp=cs==='bands'?-2:0.945650; glowDot(svg,A.px(xp),A.cy(A.py(C.f(xp))),6,CV('s4'),glow);
    txt(svg,A.px(xp)+8,A.cy(A.py(C.f(xp)))-10,'p* = '+F(K.pstar,4),'font:800 10.5px system-ui;fill:'+CV('s4'));
    /* right: d(µ) */
    let lo=Infinity,hi=-Infinity; const DS=[];
    for(let i=0;i<=120;i++){ const m=C.MU*i/120, v=dOfCase(C,m).d; DS.push([m,v]); if(isFinite(v)){ lo=Math.min(lo,v); hi=Math.max(hi,v); } }
    lo=Math.max(lo,K.dstar-Math.max(1,Math.abs(K.dstar))*1.6); const span=Math.max(.5,hi-lo);
    const B=panel(svg,330,58,230,238,0,C.MU,lo-span*.08,Math.max(hi,K.pstar)+span*.14,{id:'d1',xs:C.MU/4,ys:Math.max(.25,Math.round(span/4*4)/4),title:'d(µ) = min over x of f + µg'});
    const gb=el('g',{'clip-path':B.clip},svg);
    let dd='',started=false; DS.forEach(([m,v])=>{ if(!isFinite(v)){ started=false; return; } dd+=(started?'L':'M')+B.px(m).toFixed(1)+','+B.cy(B.py(v)).toFixed(1); started=true; });
    glowPath(gb,dd,CV('s3'),3,glow,{});
    el('line',{x1:B.x,y1:B.cy(B.py(K.pstar)),x2:B.x+B.w,y2:B.cy(B.py(K.pstar)),stroke:CV('s4'),'stroke-width':1.6,'stroke-dasharray':'5 3'},svg);
    txt(svg,B.x+B.w-4,B.cy(B.py(K.pstar))-5,'p* = '+F(K.pstar,4),'font:800 10px system-ui;fill:'+CV('s4'),'end');
    glowDot(svg,B.px(K.mustar),B.cy(B.py(K.dstar)),6,CV('s3'),glow);
    txt(svg,B.px(K.mustar)+8,B.cy(B.py(K.dstar))+16,'d* = '+F(K.dstar,4)+' at µ* = '+F(K.mustar,4),'font:800 10px system-ui;fill:'+CV('s3'));
    if(K.gap>1e-4){ const y0=B.cy(B.py(K.dstar)), y1=B.cy(B.py(K.pstar)), X=B.px(K.mustar);
      glowLine(svg,X,y0,X,y1,CV('critical'),3.2,glow);
      txt(svg,X+9,(y0+y1)/2,'gap '+F(K.gap,4),'font:800 11px system-ui;fill:'+CV('critical')); }
    txt(svg,300,330,cs==='bands'?'a non-convex problem whose gap happens to close anyway':'a non-convex problem whose gap does NOT close','font:700 10.5px system-ui;fill:'+(K.gap>1e-4?CV('critical'):CV('s3')),'middle');
    read.innerHTML='p* = <b>'+F(K.pstar,4)+'</b>  ·  d* = <b>'+F(K.dstar,4)+'</b>  ·  duality gap = <b>'+F(K.gap,4)+'</b>'+(K.gap>1e-4?' > 0':'')+'<br>'+
      'the best fine rate is µ* = <b>'+F(K.mustar,4)+'</b>'+
      (cs==='bands'?'<br>the feasible set is [−2, −1] ∪ [1, 2], so p* = −2 — and the Lagrangian’s only stationary point IS x = −2, so d* reaches it'
                   :'<br>the deeper well is banned, so the cheapest Lagrangian point jumps from one well to the other and never stops at the answer');
    verd.className='verdict info';
    verd.textContent=K.gap>1e-4?'info — weak duality still holds (d* ≤ p*); it is strong duality that needs convexity'
                               :'info — weak duality still holds (d* ≤ p*); here the gap is zero even without convexity — convexity is sufficient, not necessary'; }
  function draw(){ caseBar.style.display=tab==='gap'?'':'none'; showTab(box,tab);
    if(tab==='two') drawTwo(); else if(tab==='bundle') drawBundle(); else drawGap(); }
  bindCtl('du-x',v=>{ dx=v; if(tab==='two') drawTwo(); },v=>fmt(v,2))();
  bindCtl('du-mu',v=>{ dmu=v; if(tab==='two') drawTwo(); },v=>fmt(v,2))();
  bindCtl('du-xl',v=>{ dxl=v; if(tab==='bundle') drawBundle(); },v=>fmt(v,2))();
  caseBar.querySelectorAll('[data-c]').forEach(b=>b.addEventListener('click',()=>{ pressOnly(caseBar,b); cs=b.dataset.c; drawGap(); }));
  tabs(document.getElementById('du-tabs'),t=>{ tab=t; draw(); });
  showTab(box,'two'); draw();
  /* the two numbers this unit quotes, computed once and logged so a verify script can read them back */
  (function(){ const a=facts('bands'), b=facts('wells');
    console.info('U11 duality gaps · bands: p* = '+a.pstar.toFixed(4)+', d* = '+a.dstar.toFixed(4)+' at µ* = '+a.mustar.toFixed(4)+', gap = '+a.gap.toFixed(4)+
      ' · wells: p* = '+b.pstar.toFixed(4)+', d* = '+b.dstar.toFixed(4)+' at µ* = '+b.mustar.toFixed(4)+', gap = '+b.gap.toFixed(4)); })();
})();

/* ================= W14 · WHAT A WALL IS WORTH (the shadow price) ================= */
(function(){
  const box=document.getElementById('w-price'),svg=document.getElementById('pr-svg'),read=document.getElementById('pr-read'),verd=document.getElementById('pr-verdict');
  if(!box||!svg) return;
  let c=3.00,anim=null,run=0;
  const sol=cc=>cc<=2?{x:2,y:2,mu:0,p:8}:{x:cc,y:4-cc,mu:4*cc-8,p:cc*cc+(4-cc)*(4-cc)};
  function draw(){ svg.innerHTML=''; const glow=glo(svg), hp=hatchPat(svg,'pr-h',CV('s2'),.5), S=sol(c);
    /* (i) the level curves and the path */
    const A=panel(svg,48,50,250,250,0,4.4,0,4.4,{id:'pm',xs:1,ys:1,title:'minimise x² + y²  on  x + y = 4,  with  x ≥ c'});
    const ga=el('g',{'clip-path':A.clip},svg);
    const f=(x,y)=>x*x+y*y, lv=[]; for(let i=1;i<=10;i++) lv.push(40*Math.pow(i/10,1.8));
    contourSegs(f,lv,0,4.4,0,4.4,70).forEach((L,i)=>L.segs.forEach(s=>el('line',{x1:A.px(s[0]),y1:A.py(s[1]),x2:A.px(s[2]),y2:A.py(s[3]),stroke:CV('s1'),'stroke-width':1,opacity:.16+.04*i},ga)));
    glowLine(ga,A.px(0),A.cy(A.py(4)),A.px(4.4),A.cy(A.py(-0.4)),'var(--ink-muted)',1.6,null,{'stroke-dasharray':'4 4'});
    glowLine(ga,A.px(c),A.py(4-c),A.px(4.4),A.cy(A.py(-0.4)),CV('s3'),4.2,glow);
    el('rect',{x:A.x,y:A.y,width:Math.max(0,A.px(c)-A.x),height:A.h,fill:hp,opacity:.4},ga);
    glowLine(ga,A.px(c),A.y,A.px(c),A.y+A.h,CV('s2'),2.4,glow);
    txt(svg,A.px(c)+6,A.y+16,'wall x = '+F(c,2),'font:800 10.5px system-ui;fill:'+CV('s2'));
    el('circle',{cx:A.px(2),cy:A.py(2),r:5,fill:'none',stroke:'var(--ink-muted)','stroke-width':1.8},svg);
    txt(svg,A.px(2)-8,A.py(2)+16,'free answer (2, 2)','font:600 9px system-ui;fill:var(--ink-muted)','end');
    glowDot(svg,A.px(S.x),A.py(S.y),6.5,CV('s4'),glow);
    txt(svg,A.px(S.x)+9,A.py(S.y)-9,'('+F(S.x,2)+', '+F(S.y,2)+')','font:800 10.5px system-ui;fill:'+CV('s4'));
    /* (ii) the value curve */
    const B=panel(svg,336,50,228,250,1.4,3.8,7.4,13.2,{id:'pv',xs:.5,ys:1,title:'the value p*(c) — what the problem costs'});
    const gb=el('g',{'clip-path':B.clip},svg);
    let d=''; for(let i=0;i<=160;i++){ const cc=1.4+2.4*i/160; d+=(i?'L':'M')+B.px(cc).toFixed(1)+','+B.cy(B.py(sol(cc).p)).toFixed(1); }
    glowPath(gb,d,CV('s1'),2.8,glow,{});
    el('line',{x1:B.px(2),y1:B.y,x2:B.px(2),y2:B.y+B.h,stroke:'var(--ink-muted)','stroke-width':1.2,'stroke-dasharray':'3 3'},gb);
    txt(svg,B.px(2)+5,B.y+B.h-10,'← below 2 the wall lets go','font:600 9px system-ui;fill:var(--ink-muted)');
    const L=0.42, s0=sol(3);
    glowLine(gb,B.px(3-L),B.cy(B.py(s0.p-4*L)),B.px(3+L),B.cy(B.py(s0.p+4*L)),CV('s3'),2.8,glow);
    txt(svg,B.px(3+L)+4,B.cy(B.py(s0.p+4*L)),'slope µ* = 4','font:800 10px system-ui;fill:'+CV('s3'));
    glowDot(svg,B.px(3),B.cy(B.py(10)),5,CV('s3'),glow);
    const cv=Math.max(1.4,Math.min(3.8,c)); glowDot(svg,B.px(cv),B.cy(B.py(S.p)),6,CV('s4'),glow);
    /* the predicted point, from the price alone */
    const pred=10+4*(c-3);
    if(Math.abs(c-3)>1e-9){ el('circle',{cx:B.px(cv),cy:B.cy(B.py(pred)),r:5,fill:'none',stroke:CV('s3'),'stroke-width':2},svg);
      txt(svg,B.px(cv)+8,B.cy(B.py(pred))+14,'predicted '+F(pred,2),'font:700 9.5px system-ui;fill:'+CV('s3')); }
    txt(svg,450,330,'the multiplier is the slope of this curve','font:700 10.5px system-ui;fill:'+CV('s3'),'middle');
    read.innerHTML='c = <b>'+F(c,2)+'</b> → x* = <b>'+F(S.x,2)+'</b>, y* = <b>'+F(S.y,2)+'</b>, µ* = <b>'+F(S.mu,2)+'</b>, p* = <b>'+F(S.p,2)+'</b><br>'+
      'predicted by the price:  10 + 4·Δc = <b>'+F(pred,2)+'</b>   ·   actually: <b>'+F(S.p,2)+'</b>   ·   error <b>'+F(Math.abs(S.p-pred),2)+'</b><br>'+
      'at c = 3.00 the answer is (3, 1) with µ* = 4 and p* = 10';
    if(c<=2+1e-9){ verd.className='verdict info'; verd.textContent='info — the wall is behind the free answer: µ* = 0 and the value curve is flat. The price of a wall you are not touching is nothing.'; }
    else { verd.className='verdict good'; verd.textContent='good — the multiplier told you the change before you re-solved anything'; } }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run;
    if(RM){ c=2.9; setCtl('pr-c',2.9,2); draw(); return; }
    anim=tween(5200,u=>{ if(tok!==run) return; const v=3.0+1.0*Math.sin(u*2*Math.PI)*0.6-0.6*(u>0.5?0:0);
      c=Math.round(Math.max(2,Math.min(3.6,3.0+0.55*Math.sin(u*2*Math.PI)))*100)/100; setCtl('pr-c',c,x=>fmt(x,2)); draw(); },
      ()=>{ if(tok!==run) return; c=3.00; setCtl('pr-c',3,x=>fmt(x,2)); draw(); }); }
  document.getElementById('pr-play').addEventListener('click',play);
  const preBar=document.getElementById('pr-pre');
  [['pr-p-base',3.00],['pr-p-near',2.90],['pr-p-free',2.00]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{
    pressOnly(preBar,e.currentTarget); stop(); c=v; setCtl('pr-c',v,2); draw(); }));
  bindCtl('pr-c',v=>{ stop(); c=v; pressOnly(preBar,null); draw(); },v=>fmt(v,2))();
  draw();
})();

/* ================= W15 · TWO POINTS AND A LINE (a one-dimensional SVM) ================= */
(function(){
  const box=document.getElementById('w-svm'),svg=document.getElementById('sv-svg'),read=document.getElementById('sv-read'),verd=document.getElementById('sv-verdict');
  if(!box||!svg) return;
  let tab='ans',wv=1,av=0.5,x3=3,run=0,anim=null;
  /* hard margin with x₁ = +1 (class +1), x₂ = −1 (class −1) and a third point x₃ (class +1).
     For x₃ ≥ 1 the binding pair is (+1, −1): w = 1, b = 0, α₁ = α₂ = ½, α₃ = 0.
     For x₃ < 1 the binding pair is (x₃, −1):  w = 2/(x₃+1),  b = −w(x₃−1)/2 = (1−x₃)/(1+x₃),  α₂ = α₃ = 2/(x₃+1)², α₁ = 0. */
  function svm3(x){ if(x>=1) return {w:1,b:0,a:[0.5,0.5,0],sv:[true,true,false]};
    const w=2/(x+1), b=-w*(x-1)/2, al=2/((x+1)*(x+1));
    return {w,b,a:[0,al,al],sv:[false,true,true]}; }
  function axis(o){ o=o||{};
    const p=panel(svg,52,o.y||150,496,1,-2.6,4.6,0,1,{id:'ax'+(o.k||''),bg:false,xs:1,ys:0,xt:false});
    const Y=o.y||150;
    el('line',{x1:p.px(-2.6),y1:Y,x2:p.px(4.6),y2:Y,stroke:'var(--axis)','stroke-width':2},svg);
    for(let i=-2;i<=4;i++){ el('line',{x1:p.px(i),y1:Y-5,x2:p.px(i),y2:Y+5,stroke:'var(--ink-muted)','stroke-width':1.2},svg);
      txt(svg,p.px(i),Y+20,String(i),'font:500 10px system-ui;fill:var(--ink-muted)','middle'); }
    return {p,Y}; }
  function drawAns(){ svg.innerHTML=''; const glow=glo(svg);
    txt(svg,52,28,'two labelled points, one boundary: pick the w that clears both constraints with the widest gap','font:700 11px system-ui;fill:var(--ink-2)');
    const {p,Y}=axis({y:168});
    const b=0, w=wv, bnd=-b/w, e1=(1-b)/w, e2=(-1-b)/w;
    el('rect',{x:p.px(Math.min(e1,e2)),y:Y-62,width:Math.abs(p.px(e1)-p.px(e2)),height:124,fill:CV('s4'),opacity:.12},svg);
    [[e1,CV('s3')],[e2,CV('s2')]].forEach(([x,col])=>glowLine(svg,p.px(x),Y-62,p.px(x),Y+62,col,2.2,glow,{'stroke-dasharray':'6 4'}));
    glowLine(svg,p.px(bnd),Y-78,p.px(bnd),Y+78,CV('s4'),3.4,glow);
    txt(svg,p.px(bnd),Y-88,'boundary  w·x + b = 0','font:800 11px system-ui;fill:'+CV('s4'),'middle');
    txt(svg,p.px(e1),Y-70,'+1 edge','font:700 9.5px system-ui;fill:'+CV('s3'),'middle');
    txt(svg,p.px(e2),Y-70,'−1 edge','font:700 9.5px system-ui;fill:'+CV('s2'),'middle');
    const ok1=w*1+b>=1-1e-9, ok2=-(w*-1+b)>=1-1e-9;
    [[1,CV('s3'),'+1',ok1],[-1,CV('s2'),'−1',ok2]].forEach(([x,col,lab,ok])=>{
      glowDot(svg,p.px(x),Y,8,ok?col:CV('critical'),glow);
      txt(svg,p.px(x),Y+40,'x = '+x+'  (class '+lab+')','font:700 10px system-ui;fill:'+(ok?col:CV('critical')),'middle');
      txt(svg,p.px(x),Y+54,ok?'y(wx+b) = '+F(x>0?w*1+b:-(w*-1+b),3)+' ≥ 1 ✓':'y(wx+b) = '+F(x>0?w*1+b:-(w*-1+b),3)+' < 1 ✗','font:700 9.5px system-ui;fill:'+(ok?col:CV('critical')),'middle'); });
    const gap=2/Math.abs(w);
    edge(svg,p.px(Math.min(e1,e2)),Y+92,p.px(Math.max(e1,e2)),Y+92,CV('s4'),2,glow);
    txt(svg,p.px(0),Y+110,'margin 2/|w| = '+F(gap,3),'font:800 11px system-ui;fill:'+CV('s4'),'middle');
    read.innerHTML='margin = <b>'+F(gap,4)+'</b>  ·  constraints: <b>'+(ok1&&ok2?'satisfied':'violated')+'</b>  ·  ½w² = <b>'+F(0.5*w*w,4)+'</b><br>'+
      'at the answer: w* = <b>1</b>, b* = <b>0</b>, α₁ = α₂ = <b>0.5</b>, margin = <b>2</b>';
    if(!(ok1&&ok2)){ verd.className='verdict bad'; verd.textContent='bad — w < 1: the gap is wider, but the points are now inside the margin. Not allowed.'; }
    else if(Math.abs(w-1)<1e-9){ verd.className='verdict good'; verd.textContent='good — w = 1 is the smallest w that still clears both constraints: widest margin = smallest ½w²'; }
    else { verd.className='verdict info'; verd.textContent='info — legal, but ½w² = '+F(0.5*w*w,3)+' is bigger than it needs to be: the margin is narrower than 2'; } }
  function drawDual(){ svg.innerHTML=''; const glow=glo(svg);
    const q=a=>2*a-2*a*a;
    const p=panel(svg,64,52,310,208,0,1.2,-0.5,0.62,{id:'q',xs:.2,ys:.2,title:'q(α) = 2α − 2α²  on  α ≥ 0'});
    const gp=el('g',{'clip-path':p.clip},svg);
    let d=''; for(let i=0;i<=160;i++){ const a=1.2*i/160; d+=(i?'L':'M')+p.px(a).toFixed(1)+','+p.cy(p.py(q(a))).toFixed(1); }
    glowPath(gp,d,CV('s3'),3,glow,{});
    glowDot(svg,p.px(0.5),p.py(0.5),6,CV('s4'),glow);
    txt(svg,p.px(0.5)+8,p.py(0.5)-10,'peak: α* = 0.5, d* = 0.5','font:800 10.5px system-ui;fill:'+CV('s4'));
    const a=Math.max(0,Math.min(1.2,av)); glowDot(svg,p.px(a),p.cy(p.py(q(a))),5.5,CV('s2'),glow);
    /* the classifier being built out of the multiplier */
    const bx=410,by=60,bw=150;
    txt(svg,bx,by-8,'w = α₁ + α₂ = 2α','font:700 10px system-ui;fill:var(--ink-muted)');
    el('rect',{x:bx,y:by,width:bw,height:16,rx:8,fill:'var(--surface-2)',stroke:'var(--line, var(--ring))'},svg);
    const g2=el('g',glow?{filter:glow}:{},svg); el('rect',{x:bx,y:by,width:Math.max(2,bw*Math.min(1,2*a/2.4)),height:16,rx:8,fill:CV('s4')},g2);
    txt(svg,bx,by+34,'w = '+F(2*a,3),'font:800 12px system-ui;fill:'+CV('s4'));
    txt(svg,bx,by+54,'½w² = '+F(0.5*4*a*a,4),'font:700 10.5px system-ui;fill:var(--ink-2)');
    txt(svg,bx,by+74,'q(α) = '+F(q(a),4),'font:700 10.5px system-ui;fill:'+CV('s3'));
    txt(svg,bx,by+104,'the classifier is literally','font:600 10px system-ui;fill:var(--ink-muted)');
    txt(svg,bx,by+118,'made of the multipliers:','font:600 10px system-ui;fill:var(--ink-muted)');
    txt(svg,bx,by+136,'w = Σ αᵢ yᵢ xᵢ','font:800 12px system-ui;fill:'+CV('s4'));
    const {p:ap,Y}=axis({y:296,k:'d'});
    const w=2*a, bnd=0;
    if(w>1e-6){ glowLine(svg,ap.px(0),Y-26,ap.px(0),Y+26,CV('s4'),3,glow);
      [[1/w,CV('s3')],[-1/w,CV('s2')]].forEach(([x,col])=>glowLine(svg,ap.px(Math.max(-2.6,Math.min(4.6,x))),Y-18,ap.px(Math.max(-2.6,Math.min(4.6,x))),Y+18,col,2,glow,{'stroke-dasharray':'5 3'})); }
    glowDot(svg,ap.px(1),Y,7,CV('s3'),glow); glowDot(svg,ap.px(-1),Y,7,CV('s2'),glow);
    read.innerHTML='α = <b>'+F(a,3)+'</b> → w = <b>'+F(2*a,3)+'</b> → ½w² = <b>'+F(2*a*a,4)+'</b> · q(α) = <b>'+F(q(a),4)+'</b><br>'+
      'at the peak: α* = <b>0.5</b>, w* = <b>1</b>, d* = <b>0.5</b> = p*';
    if(Math.abs(a-0.5)<1e-9){ verd.className='verdict good'; verd.textContent='good — the dual peak α* = 0.5 builds exactly the primal answer w* = 1, and d* = 0.5 = p*'; }
    else { verd.className='verdict info'; verd.textContent='info — q(α) = '+F(q(a),4)+' is below the peak 0.5: any α gives a lower bound, only α* gives the answer'; } }
  function drawAdd(){ svg.innerHTML=''; const glow=glo(svg);
    const S=svm3(x3), {p,Y}=axis({y:176,k:'a'});
    txt(svg,52,28,'a third point, class +1 — while it stays outside the margin its multiplier is exactly zero','font:700 11px system-ui;fill:var(--ink-2)');
    const bnd=-S.b/S.w, e1=(1-S.b)/S.w, e2=(-1-S.b)/S.w;
    el('rect',{x:p.px(Math.min(e1,e2)),y:Y-62,width:Math.abs(p.px(e1)-p.px(e2)),height:124,fill:CV('s4'),opacity:.12},svg);
    [[e1,CV('s3')],[e2,CV('s2')]].forEach(([x,col])=>glowLine(svg,p.px(x),Y-62,p.px(x),Y+62,col,2.2,glow,{'stroke-dasharray':'6 4'}));
    glowLine(svg,p.px(bnd),Y-80,p.px(bnd),Y+80,CV('s4'),3.4,glow);
    txt(svg,p.px(bnd),Y-90,'boundary  x = '+F(bnd,3),'font:800 11px system-ui;fill:'+CV('s4'),'middle');
    const pts=[[1,CV('s3'),'x₁ = +1',S.a[0],S.sv[0]],[-1,CV('s2'),'x₂ = −1',S.a[1],S.sv[1]],[x3,CV('s3'),'x₃',S.a[2],S.sv[2]]];
    pts.forEach(([x,col,lab,al,sv],i)=>{ const X=p.px(Math.max(-2.6,Math.min(4.6,x)));
      if(sv) glowDot(svg,X,Y,8,col,glow); else el('circle',{cx:X,cy:Y,r:8,fill:'var(--page)',stroke:col,'stroke-width':2.4},svg);
      txt(svg,X,Y+(i===2?60:40),lab+(i===2?' = '+F(x3,2):''),'font:700 10px system-ui;fill:'+col,'middle');
      txt(svg,X,Y+(i===2?74:54),'α = '+F(al,4)+(sv?'  (support)':''),'font:700 9.5px system-ui;fill:'+(sv?col:'var(--ink-muted)'),'middle'); });
    if(!S.sv[2]) txt(svg,p.px(Math.max(-2.6,Math.min(4.6,x3))),Y-24,'α₃ = 0 — delete it and nothing changes','font:800 10px system-ui;fill:var(--ink-muted)','middle');
    const nsv=S.sv.filter(Boolean).length;
    txt(svg,300,272,x3<1?('w = '+F(S.w,4)+' = 2/(x₃+1)  ·  b = '+F(S.b,4)+' = (1−x₃)/(1+x₃)')
                      :('w = 1, b = 0 — set by the pair (+1, −1); x₃ contributes nothing'),'font:700 10.5px system-ui;fill:'+CV('s4'),'middle');
    txt(svg,300,290,x3>=1?'x₃ is outside the margin: the binding pair is still (+1, −1), so w = 1 and b = 0':'x₃ has crossed inside: the binding pair is now (x₃, −1), and the whole classifier has moved','font:600 9.6px system-ui;fill:var(--ink-muted)','middle');
    read.innerHTML='α₃ = <b>'+F(S.a[2],4)+'</b> · support vectors: <b>'+nsv+'</b> of 3 · boundary x = <b>'+F(bnd,4)+'</b> · margin = <b>'+F(2/S.w,4)+'</b><br>'+
      'w = <b>'+F(S.w,4)+'</b>, b = <b>'+F(S.b,4)+'</b>'+(x3<1?'  — once x₃ < 1: w = 2/(x₃+1), b = −w(x₃−1)/2':'  (unchanged: x₃ carries no weight)')+'<br>'+
      'at x₃ = 3: α₃ = <b>0</b> · at x₃ = 0.5: w = <b>1.3333</b>, b = <b>0.3333</b>, α₂ = α₃ = <b>0.8889</b>';
    if(S.sv[2]){ verd.className='verdict good'; verd.textContent='good — complementary slackness is why an SVM is sparse: only the points whose constraint is tight carry the answer'; }
    else { verd.className='verdict good'; verd.textContent='good — α₃ = 0: the point is outside the margin, so it pays nothing and changes nothing'; } }
  function draw(){ showTab(box,tab); if(tab==='ans') drawAns(); else if(tab==='dual') drawDual(); else drawAdd(); }
  bindCtl('sv-w',v=>{ wv=v; if(tab==='ans') drawAns(); },v=>fmt(v,2))();
  bindCtl('sv-a',v=>{ av=v; if(tab==='dual') drawDual(); },v=>fmt(v,3))();
  bindCtl('sv-x3',v=>{ x3=v; if(tab==='add') drawAdd(); },v=>fmt(v,2))();
  tabs(document.getElementById('sv-tabs'),t=>{ tab=t; draw(); });
  /* dragging the third point */
  svgDrag(svg,null,X=>{ if(tab!=='add') return; const L=52,W=496, u=(X-L)/W, x=-2.6+u*7.2;
    x3=Math.max(0,Math.min(4,Math.round(x*20)/20)); setCtl('sv-x3',x3,v=>fmt(v,2)); drawAdd(); });
  showTab(box,'ans'); draw();
  /* self-check: the shifted hard-margin solution */
  (function(){ const s=svm3(0.5); if(Math.abs(s.w-4/3)>1e-9||Math.abs(s.b-1/3)>1e-9||Math.abs(s.a[2]-8/9)>1e-9) console.warn('W15: shifted SVM solution unexpected',s);
    console.info('U11 shifted SVM at x₃ = 0.5: w = '+s.w.toFixed(4)+', b = '+s.b.toFixed(4)+', α₂ = α₃ = '+s.a[2].toFixed(4)+', boundary x = '+(-s.b/s.w).toFixed(4)+', margin = '+(2/s.w).toFixed(4)); })();
})();

/* ================= OPENING SHOT · five walkers race, then a wall drops ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced;
  const U=2.4,V=1.2, ZTOP=0.5*U*U+5*V*V, ZS=1.6/ZTOP, NST=20, STEP=.35;
  const T_RACE=9, T_WALL=5, T_PRICE=5, T_BACK=3;
  const J=w=>0.5*w[0]*w[0]+5*w[1]*w[1];
  const FS=(u,v)=>0.5*u*u+5*v*v;
  const P3=w=>[Math.max(-U,Math.min(U,w[0])),J(w)*ZS,-Math.max(-V,Math.min(V,w[1]))];
  const TR={}; M5.forEach(m=>{ TR[m.k]=OPT.trace(m.k,{c:10,alpha:.1,N:NST}); });
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:.05,autoRotateStopsOnUser:true,
      camera:{pos:wide?[2.0,4.6,6.2]:[1.0,4.4,5.4],look:wide?[-2.2,.15,.2]:[-.2,.15,.2],fov:wide?30:33},
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]), dark=!isLight;
        if(dark){ const n=520, sp=new Float32Array(n*3);
          for(let k=0;k<n;k++){ let x,y,z; do{ x=(Math.random()*2-1)*22; y=(Math.random()*2-1)*12; z=(Math.random()*2-1)*22-4; }while(Math.hypot(x,y-1,z)<6);
            sp[3*k]=x; sp[3*k+1]=y; sp[3*k+2]=z; }
          const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
          root.add(new THREE.Points(sg,new THREE.PointsMaterial({color:hx('ink2'),size:.055,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}))); }
        { const top=new THREE.DirectionalLight(0xffffff,dark?.5:.25); top.position.set(2,8,3); root.add(top); }
        const surf=CIN.prim.surface(ctx,FS,{x:[-U,U],y:[-V,V],res:78,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:isLight?.97:.93,wire:false});
        root.add(surf); lightenSurface(ctx,surf,ZS);
        { const vis=fadeAttr(THREE,surf), pos=surf.userData.geo.attributes.position;
          for(let i=0;i<pos.count;i++){ const a=Math.abs(pos.getX(i))/U, b=Math.abs(pos.getZ(i))/V, r=Math.max(a,b);
            vis.setX(i,r<.93?1:Math.max(0,1-(r-.93)/.07)); } vis.needsUpdate=true; }
        const floorY=-.26; const grid=CIN.prim.grid(ctx,6.2,20,hx('grid'),{opacity:isLight?.32:.2}); grid.position.y=floorY; root.add(grid);
        const lv=[]; for(let i=1;i<=8;i++) lv.push(ZTOP*Math.pow(i/9,2.1));
        root.add(liftedContours(ctx,FS,lv,-U,U,-V,V,ZS,hx('ink2'),{N:70}));
        const star=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s3'),.055),13); root.add(star);
        const starHalo=haloSprite(ctx,hx('s3'),.6); root.add(starHalo);
        const wall=CIN.prim.glass(ctx,2*V,1.9,hx('s2'),.24); wall.rotation.y=Math.PI/2; wall.visible=false; root.add(wall);
        const wallEdge=tube(ctx,[0,0,0],[0,1,0],hx('s2'),.014,.95); wallEdge.visible=false; root.add(wallEdge);
        const banned=CIN.prim.glass(ctx,1,2*V,hx('s2'),.28); banned.rotation.x=-Math.PI/2; banned.visible=false; root.add(banned);
        const price=tube(ctx,[0,0,0],[0,1,0],hx('s3'),.022,.95); price.visible=false; root.add(price);
        const W=M5.map((m,i)=>{ const col=CIN.hex(cssv(m.c));
          const dot=overlay(CIN.prim.dot(ctx,[0,0,0],col,.055),14+i); root.add(dot);
          const halo=haloSprite(ctx,col,.4); root.add(halo);
          const tg=new THREE.Group(); root.add(tg); return {m,col,dot,halo,tg,trail:null}; });
        const chip=slot(ctx,root), chip2=slot(ctx,root), hudEl=hud(box,'hud-b');
        const setTrails=(k,op)=>{ W.forEach(w=>{ clearGroup(w.tg); const T=TR[w.m.k], pts=[];
            for(let i=0;i<=Math.min(k,NST);i++){ if(T[i].dead) break; const q=P3(T[i].w); q[1]+=.016; pts.push(q); }
            if(pts.length>=2){ const tb=polyTube(ctx,pts,w.col,.019,false); if(op!=null) tb.traverse(m=>{ if(m.material){ m.material.transparent=true; m.material.opacity=op; } }); w.tg.add(tb); w.trail=tb; } }); };
        const fadeTrails=op=>{ W.forEach(w=>{ if(w.trail) w.trail.traverse(m=>{ if(m.material) m.material.opacity=op; }); }); };
        const placeWalkers=(kf)=>{ const k=Math.floor(kf), u=CIN.ease.out(kf-k);
          W.forEach((w,i)=>{ const T=TR[w.m.k], a=T[Math.min(k,NST)].w, b=T[Math.min(k+1,NST)].w;
            const pos=[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u], q=P3(pos);
            w.dot.position.set(q[0],q[1]+.016+.004*i,q[2]); w.halo.position.copy(w.dot.position); }); };
        const alphaW=a=>{ W.forEach(w=>{ w.dot.material.opacity=a; w.dot.material.transparent=true; w.halo.material.opacity=(dark?.65:.32)*a;
          w.dot.visible=a>.02; w.halo.visible=a>.02; }); };
        const placeStar=c=>{ const q=P3([c,0]); star.position.set(q[0],q[1]+.016,q[2]); starHalo.position.copy(star.position); };
        const showWall=(c,h,op)=>{ wall.visible=h>.02; wallEdge.visible=h>.02; banned.visible=h>.02;
          wall.position.set(c,.95*h,0); wall.scale.y=Math.max(.02,h); wall.material.opacity=.24*op;
          aimTube(ctx.THREE,wallEdge,[c,0,-V],[c,0,V]); wallEdge.material.opacity=.95*op;
          const bw=Math.max(.01,c+U); banned.scale.x=bw; banned.position.set((-U+c)/2,floorY+.006,0); banned.material.opacity=.28*op; };
        const st={phase:'race',t0:null,k:-1}; box.dataset.phase=st.phase;
        setTrails(0); placeWalkers(0); placeStar(0); star.visible=false; starHalo.visible=false;
        ctx.hero={apply(t){ if(st.t0==null) st.t0=t; const e=t-st.t0;
          if(box.dataset.phase!==st.phase) box.dataset.phase=st.phase;
          if(st.phase==='race'){
            const kf=Math.min(NST,e/STEP), k=Math.floor(kf);
            if(k!==st.k){ st.k=k; setTrails(k,1); }
            placeWalkers(kf); alphaW(1); star.visible=false; starHalo.visible=false; showWall(0,0,0); price.visible=false;
            chip.hide(); chip2.hide();
            if(hudEl) hudEl.innerHTML='Five walkers · one valley';
            if(e>=T_RACE){ st.phase='wall'; st.t0=t; st.k=-1; setTrails(NST,1); }
          } else if(st.phase==='wall'){
            const u=Math.min(1,e/T_WALL); fadeTrails(1-.75*Math.min(1,u*2.2)); alphaW(Math.max(0,1-u*2.4));
            showWall(1,Math.min(1,u*2.2),Math.min(1,u*2.2));
            const c=1, sx=u<.35?0:Math.min(1,(u-.35)/.4);
            star.visible=u>.2; starHalo.visible=u>.2; placeStar(sx*c);
            const q=P3([sx*c,0]);
            chip.set('f* : 0 → 0.5',[q[0]+.7,q[1]+.62,q[2]],{size:20,color:colors.s4,depthTest:false,scale:.0056});
            chip2.set('price of the wall  µ* = 1',[q[0]+.7,q[1]+.40,q[2]],{size:18,color:colors.s3,depthTest:false,scale:.005});
            price.visible=false;
            if(hudEl) hudEl.innerHTML='Then someone builds a wall';
            if(e>=T_WALL){ st.phase='price'; st.t0=t; }
          } else if(st.phase==='price'){
            const u=Math.min(1,e/T_PRICE), c=1-0.4*(0.5-0.5*Math.cos(2*Math.PI*u));
            fadeTrails(.25); alphaW(0); showWall(c,1,1); star.visible=true; starHalo.visible=true; placeStar(c);
            const q=P3([c,0]), fstar=c*c/2, pred=0.5+1*(c-1);
            chip.set('f* = c²/2 = '+fstar.toFixed(3),[q[0]+.7,q[1]+.62,q[2]],{size:20,color:colors.s4,depthTest:false,scale:.0056});
            chip2.set('µ*·Δc = '+nm((1*(c-1)).toFixed(3)),[q[0]+.7,q[1]+.40,q[2]],{size:18,color:colors.s3,depthTest:false,scale:.005});
            price.visible=Math.abs(c-1)>.01;
            aimTube(ctx.THREE,price,[q[0],0.5*ZS,q[2]],[q[0],Math.max(.004,pred)*ZS,q[2]]);
            if(hudEl) hudEl.innerHTML='Then someone builds a wall';
            if(e>=T_PRICE){ st.phase='back'; st.t0=t; }
          } else {
            const u=Math.min(1,e/T_BACK); showWall(1,Math.max(0,1-u*1.6),Math.max(0,1-u*1.6));
            fadeTrails(Math.max(0,.25-.25*u)); alphaW(0); price.visible=false;
            star.visible=true; starHalo.visible=true; placeStar(1-easeIO(Math.min(1,u*1.3)));
            chip.hide(); chip2.hide();
            if(hudEl) hudEl.innerHTML='Then someone builds a wall';
            if(e>=T_BACK){ st.phase='race'; st.t0=t; st.k=-1; setTrails(0,1); alphaW(1); }
          }
          return true; }};
        if(reduced){ /* the wall frame, held still */
          setTrails(NST,.25); alphaW(0); showWall(1,1,1); star.visible=true; starHalo.visible=true; placeStar(1);
          const q=P3([1,0]);
          chip.set('f* : 0 → 0.5',[q[0]+.7,q[1]+.62,q[2]],{size:20,color:colors.s4,depthTest:false,scale:.0056});
          chip2.set('price of the wall  µ* = 1',[q[0]+.7,q[1]+.40,q[2]],{size:18,color:colors.s3,depthTest:false,scale:.005});
          box.dataset.phase='wall';
          if(hudEl) hudEl.innerHTML='Then someone builds a wall';
        } else if(hudEl) hudEl.innerHTML='Five walkers · one valley';
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.apply(t); }
    });
  }
  const S=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(S); rw=innerWidth; });
})();
