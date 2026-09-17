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


const critHex=()=>CIN.hex(getComputedStyle(document.documentElement).getPropertyValue('--critical').trim());
/* ================= CINEMA SCENE KIT · one visual system for every Unit 11 stage =================
   Coordinates: math (w1, w2, height z) → three.js [w1, z*zs, -w2]. Every helper returns THREE objects already added to ctx.root
   unless it says otherwise. Colours are hex ints from ctx.colors via hx(k). Nothing here touches the DOM except hud/chips. */
const hxOf=ctx=>k=>k==='critical'?critHex():CIN.hex(ctx.colors[k]);
const P3=(x,y,z,zs)=>[x,z*zs,-y];

/* --- the valley: a lit surface J = ½w1² + (c/2)w2² with lifted contours, a soft floor grid and the star at the bottom --- */
function valleyScene(ctx,o){ o=o||{}; const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
  const X=o.x||[-2.4,2.4], Y=o.y||[-1.3,1.3]; let c=o.c==null?10:o.c;
  const J=(u,v)=>0.5*u*u+c/2*v*v;
  const zsFor=cc=>(o.height||1.55)/(0.5*X[1]*X[1]+cc/2*Y[1]*Y[1]);
  let zs=zsFor(c);
  const surf=CIN.prim.surface(ctx,J,{x:X,y:Y,res:o.res||84,zscale:zs,ramp:o.ramp||[colors.s1,colors.s7,colors.s2],opacity:o.opacity==null?.93:o.opacity}); lightenSurface(ctx,surf,zs,o.ramp); root.add(surf);
  const floorY=-.12; const grid=CIN.prim.grid(ctx,7,28,hx('grid'),{opacity:isLight?.45:.28}); grid.position.y=floorY; root.add(grid);
  const contG=new THREE.Group(); root.add(contG);
  const levels=()=>{ const top=J(X[1],Y[1]), lv=[]; for(let i=1;i<=9;i++) lv.push(top*Math.pow(i/10,2.2)); return lv; };
  const drawCont=()=>{ clearGroup(contG); contG.add(liftedContours(ctx,J,levels(),X[0],X[1],Y[0],Y[1],zs,hx('ink2'),{N:76})); };
  drawCont();
  let star=null; if(o.star!==false){ star=overlay(CIN.prim.dot(ctx,[0,.012,0],hx('s3'),.05),9); root.add(star); root.add(tube(ctx,[0,floorY,0],[0,0,0],hx('s3'),.006,.5)); }
  if(o.labels!==false){ [['w₁ →',[X[1]+.25,floorY,-Y[0]+.1]],['w₂ →',[X[0]-.1,floorY,Y[0]-.35]]].forEach(([t,p])=>root.add(CIN.prim.label(ctx,t,p,{size:22,color:colors.muted,bg:false,depthTest:false}))); }
  const S={surf,contG,grid,star,floorY,X,Y,J:(w)=>J(w[0],w[1]),get zs(){return zs;},get c(){return c;},
    at(w,lift){ const h=J(w[0],w[1]); return P3(w[0],w[1],h,zs).map((v,i)=>i===1?v+(lift||.012):v); },
    inside(w){ return w[0]>=X[0]&&w[0]<=X[1]&&w[1]>=Y[0]&&w[1]<=Y[1]; },
    /* morph the valley's stiffness live (tween c from outside; call reshapeTo each frame) */
    reshapeTo(cc){ c=cc; zs=zsFor(c); reshape(ctx,surf,(u,v)=>J(u,v),zs,o.ramp,o.gamma||.85); drawCont(); if(star) star.position.y=.012; } };
  return S; }

/* --- a character: glowing sphere + halo + a soft contact shadow --- */
function walkerChar(ctx,color,r){ const {THREE,root,isLight}=ctx; r=r||.062; const g=new THREE.Group(); root.add(g);
  const dot=overlay(CIN.prim.dot(ctx,[0,0,0],color,r),12); g.add(dot);
  const halo=haloSprite(ctx,color,r*9); g.add(halo);
  const sh=new THREE.Mesh(new THREE.CircleGeometry(r*1.6,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:isLight?.12:.35,depthWrite:false})); sh.rotation.x=-Math.PI/2; sh.position.y=-r*.9; g.add(sh);
  return {g,dot,halo,setPos(p){ g.position.set(p[0],p[1],p[2]); },glow(k){ halo.scale.setScalar(r*9*(k==null?1:k)); dot.material.emissiveIntensity=(isLight?.2:.9)*(k==null?1:Math.max(.2,k)); },show(v){ g.visible=v!==false; }}; }

/* --- the loaded trolley: a rounded body on four wheels, a lamp, and a comet tail for its velocity --- */
function trolleyChar(ctx,color){ const {THREE,root,isLight}=ctx; const g=new THREE.Group(); root.add(g);
  const mat=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:isLight?.15:.5,roughness:.35,metalness:.25});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.27,.13,.19),mat); body.position.y=.12; g.add(body);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(.29,.02,.21),new THREE.MeshStandardMaterial({color:0x1a2030,roughness:.5})); rim.position.y=.19; g.add(rim);
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.2,8),new THREE.MeshStandardMaterial({color:0x9aa4b8,roughness:.4,metalness:.6})); handle.position.set(-.13,.25,0); handle.rotation.z=.35; g.add(handle);
  const wm=new THREE.MeshStandardMaterial({color:0x1b2130,roughness:.7}); [[-.09,.1],[.09,.1],[-.09,-.1],[.09,-.1]].forEach(([x,z])=>{ const w=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.025,18),wm); w.rotation.x=Math.PI/2; w.position.set(x,.04,z); g.add(w); });
  const lamp=overlay(CIN.prim.dot(ctx,[.1,.24,0],color,.03),12); g.add(lamp); const halo=haloSprite(ctx,color,.7); halo.position.y=.14; g.add(halo);
  const tail=cometTail(ctx,color);
  return {g,body,halo,tail,setPos(p){ g.position.set(p[0],p[1],p[2]); },face(dx,dz){ if(Math.abs(dx)+Math.abs(dz)>1e-6) g.rotation.y=Math.atan2(dx,dz)-Math.PI/2; },show(v){ g.visible=v!==false; tail.show(v); }}; }

/* --- a comet tail: a tapered, fading tube from `from` to `to` (the velocity / the memory of the last move) --- */
function cometTail(ctx,color){ const {THREE,root,isLight}=ctx; const g=new THREE.Group(); root.add(g); let cur=null;
  return {g,set(from,to){ if(cur){ g.remove(cur); cur.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material) m.material.dispose(); }); cur=null; }
      const A=new THREE.Vector3(...from), B=new THREE.Vector3(...to), L=A.distanceTo(B); if(L<1e-3) return;
      const geo=new THREE.CylinderGeometry(.004,.05,L,12,1,true); const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:isLight?.55:.75,blending:isLight?THREE.NormalBlending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize()); g.add(m); cur=m; },
    show(v){ g.visible=v!==false; },clear(){ if(cur){ g.remove(cur); cur=null; } }}; }

/* --- a trail that grows as the character walks: push points, it draws lit tubes (sharp corners kept) --- */
function trailRibbon(ctx,color,r){ const {THREE,root}=ctx; const g=new THREE.Group(); root.add(g); const pts=[];
  return {g,pts,push(p){ pts.push(p.slice()); if(pts.length>=2) g.add(tube(ctx,pts[pts.length-2],pts[pts.length-1],color,r||.018)); },
    reset(){ pts.length=0; clearGroup(g); },fade(k){ g.traverse(m=>{ if(m.material){ m.material.transparent=true; m.material.opacity=k; } }); }}; }

/* --- a translucent panel standing at the back of the scene, with lit curves drawn on it (the cinema replacement for a side chart) --- */
function glassPanel(ctx,o){ o=o||{}; const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx); const g=new THREE.Group(); root.add(g);
  const W=o.w||2.6, H=o.h||1.3; const pane=CIN.prim.glass(ctx,W,H,hx(o.color||'s1'),isLight?.10:.12); g.add(pane);
  const frame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(W,H)),new THREE.LineBasicMaterial({color:hx('ink2'),transparent:true,opacity:.35})); g.add(frame);
  g.position.set(...(o.pos||[0,.9,-1.9])); if(o.yaw) g.rotation.y=o.yaw;
  const curves=new THREE.Group(); g.add(curves);
  const toLocal=(u,v)=>[(u-.5)*W,(v-.5)*H,.012];   /* u,v in [0,1] across the panel */
  return {g,pane,W,H,toLocal,
    curve(pts01,color,r){ let prev=null; pts01.forEach(([u,v])=>{ const p=toLocal(u,v); if(prev) curves.add(tube(ctx,prev,p,color,r||.012)); prev=p; }); },
    bead(u,v,color,r){ const d=overlay(CIN.prim.dot(ctx,toLocal(u,v),color,r||.03),12); curves.add(d); return d; },
    text(t,u,v,o2){ const s=CIN.prim.label(ctx,t,toLocal(u,v).map((x,i)=>i===2?.03:x),Object.assign({size:18,color:colors.muted,bg:false,depthTest:false},o2||{})); curves.add(s); return s; },
    hline(v,color,dash){ const p0=toLocal(0,v),p1=toLocal(1,v); curves.add(tube(ctx,p0,p1,color,.006,dash?.5:.9)); },
    clear(){ clearGroup(curves); },show(vis){ g.visible=vis!==false; }}; }

/* --- a tower of glowing blocks (the permanent record): push(h) drops a block; fadeOld(rho) makes old blocks evaporate --- */
function blockTower(ctx,color,o){ o=o||{}; const {THREE,root,isLight}=ctx; const g=new THREE.Group(); root.add(g); g.position.set(...(o.pos||[0,0,0]));
  const W=o.w||.22, blocks=[]; let top=0;
  return {g,blocks,get height(){return top;},
    push(h,tag){ h=Math.max(.012,h); const m=new THREE.Mesh(new THREE.BoxGeometry(W,h,W),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:isLight?.12:.5,roughness:.4,transparent:true,opacity:.92}));
      m.position.y=top+h/2; g.add(m); blocks.push({m,h,age:0}); top+=h; return m; },
    /* RMSProp's forgetting: every block ages one step; a block from k steps ago keeps rho^k of its height and opacity, and the tower re-stacks */
    fadeOld(rho){ let y=0; blocks.forEach(b=>{ b.age++; const k=Math.pow(rho,b.age); const hh=Math.max(.004,b.h*k); b.m.scale.y=hh/b.h; b.m.position.y=y+hh/2; b.m.material.opacity=.25+.7*k; y+=hh; }); top=y; },
    reset(){ clearGroup(g); blocks.length=0; top=0; }}; }

/* --- a light pulse at a point: the finale flare / the click when two arrows snap onto one line --- */
function flare(ctx,pos,color,dur,size){ const {THREE,root,isLight}=ctx; const h=haloSprite(ctx,color,.1); h.position.set(...pos); root.add(h);
  const L=new THREE.PointLight(color,isLight?0:2.2,3.5); L.position.set(pos[0],pos[1]+.15,pos[2]); root.add(L);
  tween(dur||900,t=>{ const s=(size||1.6)*Math.sin(Math.PI*Math.min(1,t)); h.scale.setScalar(Math.max(.05,s)); h.material.opacity=(isLight?.35:.8)*(1-t); L.intensity=(isLight?0:2.2)*(1-t); RR(ctx); },()=>{ root.remove(h); root.remove(L); RR(ctx); }); }

/* --- camera choreography: tween the orbit (theta, phi, radius) --- */
function camTo(handle,to,dur,done){ if(!handle||!handle.ctx.orbit) { done&&done(); return; } const o=handle.ctx.orbit, s=o.sph, from={theta:s.theta,phi:s.phi,radius:s.radius};
  return tween(dur||1600,t=>{ const e=easeIO(t); ['theta','phi','radius'].forEach(k=>{ if(to[k]!=null) s[k]=from[k]+(to[k]-from[k])*e; }); o.place(); },done); }

/* --- a glass wall standing on the floor: along w1 = x (spans the whole w2 range) or a ring of radius R --- */
function wallPanel(ctx,o){ o=o||{}; const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx); const g=new THREE.Group(); root.add(g);
  const H=o.h||1.4, color=hx(o.color||'s2');
  if(o.ring){ const geo=new THREE.CylinderGeometry(o.ring,o.ring,H,64,1,true); const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:isLight?.1:.35,transparent:true,opacity:isLight?.16:.2,side:THREE.DoubleSide,depthWrite:false})); m.position.y=H/2-.12; g.add(m); }
  else { const W=o.w||2.8; const pane=CIN.prim.glass(ctx,W,H,color,isLight?.16:.2); pane.rotation.y=Math.PI/2; pane.position.y=H/2-.12; g.add(pane);
    const edge=tube(ctx,[0,-.12,-W/2],[0,-.12,W/2],color,.012,.95); g.add(edge); const top=tube(ctx,[0,H-.12,-W/2],[0,H-.12,W/2],color,.008,.6); g.add(top); }
  return {g,setX(x){ g.position.x=x; },setH(k){ g.scale.y=Math.max(.001,k); },show(v){ g.visible=v!==false; }}; }

/* --- the banned half of the floor: a dark translucent slab that darkens the region a wall forbids --- */
function bannedFloor(ctx,o){ o=o||{}; const {THREE,root,isLight}=ctx, hx=hxOf(ctx); const W=o.w||3, D=o.d||3;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshBasicMaterial({color:isLight?hx('s2'):0x000000,transparent:true,opacity:isLight?.10:.45,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=(o.y==null?-.11:o.y); root.add(m);
  return {m,setX(x0,x1){ m.position.x=(x0+x1)/2; m.scale.x=Math.max(.001,(x1-x0))/W; },show(v){ m.visible=v!==false; }}; }

/* --- a hanging lamp whose brightness is a number the student should feel (Adam's probation rate) --- */
function lampChar(ctx,color,pos){ const {THREE,root,isLight}=ctx; const g=new THREE.Group(); root.add(g); g.position.set(...pos);
  const bulb=overlay(CIN.prim.dot(ctx,[0,0,0],color,.045),12); g.add(bulb); const halo=haloSprite(ctx,color,.7); g.add(halo);
  const L=new THREE.PointLight(color,isLight?0:1.6,4); g.add(L); g.add(tube(ctx,[0,0,0],[0,1.2,0],0x99a3b8,.004,.5));
  return {g,set(k){ k=Math.max(.05,Math.min(1,k)); L.intensity=(isLight?0:1.8)*k; halo.scale.setScalar(.7*(.35+.9*k)); halo.material.opacity=(isLight?.3:.7)*(.3+.7*k); bulb.material.emissiveIntensity=(isLight?.2:1)*(.25+.75*k); }}; }

/* --- a few sparks flying from a point (a wonky wheel's jerk, a box hitting a wall) --- */
function sparks(ctx,pos,color,n,dur){ const {THREE,root,isLight}=ctx; const g=new THREE.Group(); root.add(g); const ps=[];
  for(let i=0;i<(n||7);i++){ const s=haloSprite(ctx,color,.07); s.position.set(...pos); g.add(s); ps.push({s,v:[(Math.random()-.5)*.9,Math.random()*.9+.2,(Math.random()-.5)*.9]}); }
  tween(dur||600,t=>{ ps.forEach(p=>{ p.s.position.set(pos[0]+p.v[0]*t,pos[1]+p.v[1]*t-.6*t*t,pos[2]+p.v[2]*t); p.s.material.opacity=(isLight?.5:.9)*(1-t); }); RR(ctx); },()=>{ root.remove(g); RR(ctx); }); }

/* --- HUD chips: one line of live numbers inside the stage (top) and an optional caption (bottom) --- */
function hudPair(box){ const top=hud(box), bot=hud(box,'hud-b'); return {top,bot,set(a,b){ top.innerHTML=a||''; bot.innerHTML=b||''; bot.style.display=b?'':'none'; }}; }

/* --- a simple lit 3D text-free "rule" chip in-scene --- */
function sceneChip(ctx,text,pos,o){ return CIN.prim.label(ctx,text,pos,Object.assign({size:20,bg:true,depthTest:false},o||{})); }
