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

/* ================= W11 · FIVE CONDITIONS, A BRANCHING INTERROGATION (a lit case tree over the map) ================= */
(function(){
  const box=document.getElementById('cs-3d'),tree=document.getElementById('cs-tree'),work=document.getElementById('cs-work'),check=document.getElementById('cs-check'),verd=document.getElementById('cs-verdict'),playBtn=document.getElementById('cs-play'),playBar=document.getElementById('cs-playbar');
  if(!box) return;
  const TWO=[
    {id:'b1',lab:'µ₁ = 0, µ₂ = 0',pt:[2/3,1/3],ok:true,why:'survives · x* = (2/3, 1/3) · f* = 2/3',
     lines:['assume both fences are slack, so µ₁ = µ₂ = 0','∂L/∂x: 2x + λ = 0  ⇒  x = −λ/2','∂L/∂y: 4y + λ = 0  ⇒  y = −λ/4','path: x + y = 1  ⇒  −3λ/4 = 1  ⇒  λ = −4/3','x = 2/3, y = 1/3 — both ≥ 0, so the fences really are slack','f = (2/3)² + 2(1/3)² = 4/9 + 2/9 = 2/3'],
     v:['good','good — survives every condition']},
    {id:'b2',lab:'µ₁ = 0, y = 0',pt:[1,0],ok:false,why:'burns out · µ₂ = −2 < 0',
     lines:['assume the y ≥ 0 fence is tight: y = 0','path: x + y = 1  ⇒  x = 1','∂L/∂x: 2(1) + λ = 0  ⇒  λ = −2','∂L/∂y: 4(0) + λ − µ₂ = 0  ⇒  µ₂ = λ = −2'],
     v:['bad','bad — rejected: µ₂ = −2 < 0 breaks dual feasibility']},
    {id:'b3',lab:'x = 0, µ₂ = 0',pt:[0,1],ok:false,why:'burns out · µ₁ = −4 < 0',
     lines:['assume the x ≥ 0 fence is tight: x = 0','path: x + y = 1  ⇒  y = 1','∂L/∂y: 4(1) + λ = 0  ⇒  λ = −4','∂L/∂x: 2(0) + λ − µ₁ = 0  ⇒  µ₁ = λ = −4'],
     v:['bad','bad — rejected: µ₁ = −4 < 0']},
    {id:'b4',lab:'x = 0, y = 0',pt:[0,0],ok:false,why:'burns out · x + y = 0 ≠ 1',
     lines:['assume both fences are tight: x = 0 and y = 0','path: x + y = 0 ≠ 1'],
     v:['bad','bad — rejected on the path, before any fine rate is computed']}];
  const ONE=[
    {id:'c1',lab:'µ = 0 · the fence is slack',pt:[2,2],ok:false,why:'burns out · g = 3 − 2 = 1 > 0 · outside the fence',
     lines:['assume x ≥ 3 is not binding, so µ = 0','∂L/∂x: 2x + λ = 0 · ∂L/∂y: 2y + λ = 0  ⇒  x = y','path: x + y = 4  ⇒  x = y = 2, λ = −4','fence: g = 3 − x = 3 − 2 = 1 > 0'],
     v:['bad','bad — rejected: the answer breaks the fence']},
    {id:'c2',lab:'g = 0 · the fence is tight',pt:[3,1],ok:true,why:'survives · µ = 4 ≥ 0 · x* = (3, 1), p* = 10',
     lines:['assume x ≥ 3 is binding: x = 3','path: x + y = 4  ⇒  y = 1','∂L/∂y: 2y + λ = 0  ⇒  λ = −2','∂L/∂x: 2x + λ − µ = 0  ⇒  6 − 2 − µ = 0  ⇒  µ = 4 ≥ 0 ✓','p* = 3² + 1² = 10'],
     v:['good','good — all five conditions hold: x* = (3, 1), λ = −2, µ = 4, p* = 10']}];
  const CHECKS=['stationarity  ∇f + λ∇h + µ∇g = 0','the path  x + y = 4','the fence  x ≥ 3','one fine charged only when touching  µ·g = 0','every fence fine  µ ≥ 0'];
  const PROB={two:{f:(x,y)=>x*x+2*y*y,X:[-0.45,1.45],Y:[-0.45,1.45],c:[0.5,0.5],S:1.75,seg:[[0,1],[1,0]],path:[[-0.45,1.45],[1.45,-0.45]],mid:[0.5,0.5],title:'minimise x² + 2y² on x + y = 1, x ≥ 0, y ≥ 0'},
              one:{f:(x,y)=>x*x+y*y,X:[-0.6,4.6],Y:[-0.6,4.6],c:[2,2],S:0.64,seg:[[3,1],[4.6,-0.6]],path:[[-0.6,4.6],[4.6,-0.6]],fence:3,mid:[2.5,1.5],title:'minimise x² + y² on x + y = 4, x ≥ 3'}};
  const H=1.35, NF=()=>box.clientWidth<560?1.3:1;
  let tab='two',pick=null,m=3,ticks=0,anim=null,run=0,sc=null,ST=null,chips=null,status={},active=null,playing=false;
  const rows=()=>tab==='two'?TWO:ONE;
  const P=()=>PROB[tab==='one'?'one':'two'];
  const mp=(x,y,h)=>{ const q=P(); return [(x-q.c[0])*q.S,h||0,-(y-q.c[1])*q.S]; };
  const lerp3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  function bez(P0,P1,P2,P3,n){ const out=[]; for(let i=0;i<=n;i++){ const t=i/n,u=1-t; out.push([0,1,2].map(k=>u*u*u*P0[k]+3*u*u*t*P1[k]+3*u*t*t*P2[k]+t*t*t*P3[k])); } return out; }
  function along(pts,u){ let L=0; const cum=[0]; for(let i=1;i<pts.length;i++){ L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]); cum.push(L); }
    const s=u*L; let i=1; while(i<cum.length-1&&cum[i]<s) i++; const t=(s-cum[i-1])/((cum[i]-cum[i-1])||1); return lerp3(pts[i-1],pts[i],Math.max(0,Math.min(1,t))); }
  function build(){
    sc=null; const narrow=box.clientWidth<560;
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[-3.5,3.2,4.1]:[-3.05,2.75,3.6],look:[0,.5,0],fov:36},autoRotate:.06,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const sceneG=new THREE.Group(); root.add(sceneG);
        sc={THREE,ctx,root,colors,isLight,hx,sceneG,edges:null,cases:null,star:null,walker:null,lab:[],handle:null};
        chips=hudPair(box); hint(box,'drag to orbit');
        buildScene(); paintTree();
      },
      update(){ return false; }
    });
    if(handle){ grab(handle,()=>false,()=>{}); if(sc) sc.handle=handle; }
    return handle;
  }
  /* the floor map: a dark slab, a fading grid, the level curves lying flat, the path and its allowed part */
  function floorMap(){ const {THREE,ctx,sceneG,hx,isLight,colors}=sc, q=P();
    const slab=new THREE.Mesh(new THREE.PlaneGeometry(3.6,3.6),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.35:.45})); slab.rotation.x=-Math.PI/2; slab.position.y=-.004; sceneG.add(slab);
    const grid=CIN.prim.grid(ctx,3.4,17,hx('grid'),{opacity:isLight?.45:.36}); grid.position.y=.001; sceneG.add(grid);
    const fs=(u,v)=>q.f(q.c[0]+u/q.S,q.c[1]+v/q.S); const top=q.f(q.X[1],q.Y[1]), lv=[]; for(let i=1;i<=10;i++) lv.push(top*Math.pow(i/11,2));
    const R=(q.X[1]-q.X[0])/2*q.S; sceneG.add(liftedContours(ctx,fs,lv,-R,R,-R,R,0,hx('s1'),{N:72,opacity:isLight?.55:.75}));
    const a=mp(q.path[0][0],q.path[0][1],.012), b=mp(q.path[1][0],q.path[1][1],.012); sceneG.add(tube(ctx,a,b,hx('ink2'),.008,.45));
    const s0=mp(q.seg[0][0],q.seg[0][1],.02), s1=mp(q.seg[1][0],q.seg[1][1],.02); sceneG.add(tube(ctx,s0,s1,hx('s3'),.03));
    [s0,s1].forEach(p=>sceneG.add(CIN.prim.dot(ctx,p,hx('s3'),.045)));
    if(q.fence!=null){ const wall=wallPanel(ctx,{w:3.4,h:.85,color:'s2'}); wall.g.position.y=.12; wall.setX(mp(q.fence,0)[0]); sceneG.add(wall.g);
      const bf=bannedFloor(ctx,{w:3.4,d:3.4,y:.006}); bf.setX(-1.7,mp(q.fence,0)[0]); sceneG.add(bf.m);
      sceneG.add(CIN.prim.label(ctx,'fence x ≥ 3',[mp(q.fence,0)[0],.95,1.35],{size:18,color:colors.s2,bg:false,depthTest:false})); }
    }
  /* an edge of the tree: a chain of lit tubes that can be re-lit or dissolved */
  function mkEdge(pts,cases){ const {ctx,hx,sceneG}=sc; const g=new sc.THREE.Group(); sceneG.add(g); const tubes=[];
    for(let i=0;i+1<pts.length;i++){ const t=tube(ctx,pts[i],pts[i+1],hx('s1'),.02,.6); g.add(t); tubes.push(t); } return {g,tubes,cases,pts}; }
  function setEdge(e,color,op,k){ e.tubes.forEach(t=>{ t.visible=op>0; t.material.color.setHex(color); t.material.emissive.setHex(color); t.material.opacity=op; t.scale.x=t.scale.z=k||1; }); }
  function buildScene(){ if(!sc) return; const {THREE,ctx,sceneG,hx,colors}=sc; clearGroup(sceneG); sc.edges=[]; sc.cases={}; sc.star=null; sc.walker=null; sc.lab=[];
    if(tab==='many'){ buildMany(); return; }
    floorMap(); const q=P(), rs=rows();
    const base=mp(q.mid[0],q.mid[1],.02), rootP=[base[0],H,base[2]]; sc.rootP=rootP;
    sc.edges.push(mkEdge([base,rootP],rs.map(r=>r.id)));
    const sh=[]; const cand=r=>mp(r.pt[0],r.pt[1],.03);
    if(tab==='two'){ const A=[rootP[0]+.7,H-.42,rootP[2]], B=[rootP[0]-.7,H-.42,rootP[2]];
      const EA=bez(rootP,[rootP[0]+.1,H-.1,rootP[2]],[A[0]-.1,A[1]+.2,A[2]],A,8), EB=bez(rootP,[rootP[0]-.1,H-.1,rootP[2]],[B[0]+.1,B[1]+.2,B[2]],B,8);
      sc.edges.push(mkEdge(EA,['b1','b2'])); sc.edges.push(mkEdge(EB,['b3','b4']));
      rs.forEach(r=>{ const left=(r.id==='b1'||r.id==='b2'), par=left?A:B, c=cand(r); const d=[c[0]-par[0],c[2]-par[2]], L=Math.hypot(d[0],d[1])||1;
        const S=[par[0]+d[0]/L*.5,H-.78,par[2]+d[1]/L*.5]; sh.push({r,par,S,c,head:left?EA:EB}); }); }
    else rs.forEach((r,i)=>{ const c=cand(r); const S=[rootP[0]+(i?.7:-.7),H-.45,rootP[2]]; sh.push({r,par:rootP,S,c,head:[rootP]}); });
    sh.forEach(({r,par,S,c,head})=>{ const stem=bez(par,[par[0],par[1]-.15,par[2]],[S[0],S[1]+.15,S[2]],S,6), arc=bez(S,[S[0],S[1]-.3,S[2]],[c[0],c[1]+.5,c[2]],c,12);
      sc.edges.push(mkEdge(stem,[r.id])); sc.edges.push(mkEdge(arc,[r.id]));
      const path=head.concat(stem.slice(1),arc.slice(1));
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.075,.012,10,32),new THREE.MeshStandardMaterial({color:hx('ink2'),emissive:hx('ink2'),emissiveIntensity:sc.isLight?.1:.5,transparent:true,opacity:.8})); ring.rotation.x=-Math.PI/2; ring.position.set(c[0],.02,c[2]); sceneG.add(ring);
      const scar=new THREE.Mesh(new THREE.CircleGeometry(.17,32),new THREE.MeshBasicMaterial({color:critHex(),transparent:true,opacity:sc.isLight?.3:.4,depthWrite:false})); scar.rotation.x=-Math.PI/2; scar.position.set(c[0],.016,c[2]); scar.visible=false; sceneG.add(scar);
      const lab=CIN.prim.label(ctx,r.lab,[S[0],S[1]+(sh.indexOf(sh.find(x=>x.r===r))%2?.36:.2),S[2]],{size:17,color:colors.ink,bg:true,depthTest:false}); sceneG.add(lab); sc.lab.push(lab);
      sc.cases[r.id]={r,path,c,ring,lab,scar}; });
    /* the star that lands on the survivor, and the bead that walks each branch */
    const star=new THREE.Group(); star.add(overlay(CIN.prim.dot(ctx,[0,0,0],hx('s3'),.065),12)); star.add(haloSprite(ctx,hx('s3'),.5)); star.visible=false; sceneG.add(star); sc.star=star;
    const w=walkerChar(ctx,hx('s4'),.06); w.show(false); sceneG.add(w.g); sc.walker=w;
    if(chips) chips.set(`<b>${rs.length}</b> branches · click one, or ▶`,q.title); }
  function paintTree(){ if(!sc||tab==='many') return; const {hx}=sc;
    sc.edges.forEach(e=>{ const cs=e.cases; if(active&&cs.indexOf(active)>=0) setEdge(e,hx('s4'),1,1.6);
      else if(cs.some(c=>status[c]==='good')) setEdge(e,hx('s3'),1,1.4);
      else if(cs.every(c=>status[c]==='dead')) setEdge(e,critHex(),.12,1);
      else setEdge(e,hx('s1'),.6,1); });
    Object.keys(sc.cases).forEach(id=>{ const C=sc.cases[id]; C.ring.visible=status[id]!=='good'&&status[id]!=='dead'; C.scar.visible=status[id]==='dead'; const col=id===active?hx('s4'):hx('ink2'); C.ring.material.color.setHex(col); C.ring.material.emissive.setHex(col);
      C.lab.material.opacity=status[id]==='dead'?.35:1; });
    const g=Object.keys(sc.cases).find(id=>status[id]==='good'); sc.star.visible=!!g; if(g){ const c=sc.cases[g].c; if(!sc.starLanding) sc.star.position.set(c[0],c[1]+.03,c[2]); }
    RR(sc.ctx); }
  /* the counting tab: a real binary tree whose 2^m leaves are lights on a row, and behind it the ghost fan with m² leaves */
  function buildMany(){ const {THREE,ctx,sceneG,hx,colors,isLight}=sc;
    const slab=new THREE.Mesh(new THREE.PlaneGeometry(4.2,3.6),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.35:.55})); slab.rotation.x=-Math.PI/2; slab.position.y=-.004; sceneG.add(slab);
    const grid=CIN.prim.grid(ctx,4,20,hx('grid'),{opacity:isLight?.45:.3}); grid.position.y=.001; sceneG.add(grid);
    const N=Math.pow(2,m), TOP=1.5, rootP=[0,TOP,-.35];
    const node=(l,i)=>{ const k=Math.pow(2,l), t=l/m; return [-1.7*t+3.4*t*(i+.5)/k,TOP*(1-t)+.02,-.35+1.05*t]; };
    sceneG.add(tube(ctx,[0,0,-.35],rootP,hx('s1'),.03,.9));
    const lines=[]; for(let l=1;l<=m;l++){ const k=Math.pow(2,l); for(let i=0;i<k;i++){ const a=node(l-1,i>>1), b=node(l,i); if(l<=4) sceneG.add(tube(ctx,a,b,hx('s1'),Math.max(.008,.026-l*.004),.75)); else lines.push(a[0],a[1],a[2],b[0],b[1],b[2]); } }
    if(lines.length){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(lines),3)); sceneG.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:hx('s1'),transparent:true,opacity:isLight?.55:.5}))); }
    for(let l=0;l<m&&l<=3;l++){ const k=Math.pow(2,l); for(let i=0;i<k;i++) sceneG.add(CIN.prim.dot(ctx,node(l,i),hx('s1'),.03)); }
    const lp=new Float32Array(N*3); for(let i=0;i<N;i++){ const p=node(m,i); lp[3*i]=p[0]; lp[3*i+1]=p[1]+.02; lp[3*i+2]=p[2]; }
    const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.BufferAttribute(lp,3));
    if(N<=64) for(let i=0;i<N;i++) sceneG.add(CIN.prim.dot(ctx,node(m,i),hx('s4'),N<=16?.04:.028));
    const leaves=new THREE.Points(lg,new THREE.PointsMaterial({color:hx('s4'),size:Math.max(.12,.5-.045*m),map:sparkTex(THREE),transparent:true,opacity:isLight?.85:.95,blending:isLight?THREE.NormalBlending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true})); leaves.frustumCulled=false; sceneG.add(leaves);
    sceneG.add(tube(ctx,[-1.75,.012,.7],[1.75,.012,.7],hx('s4'),.008,.6));
    /* the slip: m² leaves on a fan behind */
    const M2=m*m, gp=[1.0,TOP*.72,-1.35]; const gl=[]; const gpts=new Float32Array(M2*3);
    for(let i=0;i<M2;i++){ const x=-.3+2.6*(i+.5)/M2; gl.push(gp[0],gp[1],gp[2],x,.02,-1.35); gpts[3*i]=x; gpts[3*i+1]=.04; gpts[3*i+2]=-1.35; }
    const gg=new THREE.BufferGeometry(); gg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(gl),3)); sceneG.add(new THREE.LineSegments(gg,new THREE.LineBasicMaterial({color:critHex(),transparent:true,opacity:.28})));
    const g2=new THREE.BufferGeometry(); g2.setAttribute('position',new THREE.BufferAttribute(gpts,3)); const gpt=new THREE.Points(g2,new THREE.PointsMaterial({color:critHex(),size:.14,map:sparkTex(THREE),transparent:true,opacity:.5,blending:isLight?THREE.NormalBlending:THREE.AdditiveBlending,depthWrite:false})); gpt.frustumCulled=false; sceneG.add(gpt);
    sceneG.add(tube(ctx,[gp[0],0,gp[2]],gp,critHex(),.012,.3));
    sceneG.add(CIN.prim.label(ctx,'2^'+m+' = '+N+' branches',[0,.16,1.4],{size:20,color:colors.s4,bg:true,depthTest:false}));
    sceneG.add(CIN.prim.label(ctx,'m² = '+M2+' · the slip',[1.9,.5,-1.5],{size:17,color:cssv('critical'),bg:true,depthTest:false}));
    sceneG.add(CIN.prim.label(ctx,'fence 1: slack or tight?',[rootP[0]+.08,TOP-.02,rootP[2]-.35],{size:16,color:colors.muted,bg:true,depthTest:false}));
    if(chips) chips.set(`m = <b>${m}</b> → <b>${N}</b> branches (m² would say ${M2})`,'every fence is either doing work or not — the list doubles, it does not square');
    RR(ctx); }
  function drawMany(){ if(sc) buildScene(); const N=Math.pow(2,m);
    work.innerHTML='m = 3 → <b>8</b> branches (m² would say 9 — the classic slip)<br>'+(m===3?'':'m = '+m+' → <b>'+N+'</b> branches<br>')+'m = 10 → <b>1024</b>; an SVM has one fence per training point, which is why nobody lists cases';
    check.innerHTML=''; verd.className='verdict info';
    verd.textContent=m===3?'info — 2³ = 8, not 3² = 9: each fence doubles the list':'info — '+N+' branches for '+m+' fences: the list doubles with every fence'; }
  function drawChecks(){ if(tab!=='one'){ check.innerHTML=''; return; }
    check.innerHTML=CHECKS.map((c,i)=>'<div style="color:'+(i<ticks?'var(--s3)':'var(--ink-muted)')+'">'+(i<ticks?'✓':'○')+' '+c+'</div>').join(''); }
  function drawTree(){ if(tab==='many'){ tree.innerHTML=''; return; }
    tree.innerHTML=rows().map(r=>'<button class="preset" data-b="'+r.id+'" style="text-align:left"'+(pick===r.id?' aria-pressed="true"':'')+'>'+(status[r.id]==='good'?'✓ ':status[r.id]==='dead'?'✗ ':'')+r.lab+'</button>').join('');
    tree.querySelectorAll('[data-b]').forEach(b=>b.addEventListener('click',()=>{ stop(); interrogate(b.dataset.b,run,null,true); })); }
  function idle(){ work.innerHTML='pick a branch: assume which fences are doing work, then solve and check.'; verd.className='verdict info'; verd.textContent='info — each fence is either slack (µ = 0) or tight (g = 0). Guess, solve, then test.'; drawChecks(); drawTree(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.walker){ sc.walker.show(false); } active=null; playing=false; if(sc&&sc.handle) sc.handle.setAutoRotate(.06); }
  /* one branch on trial: the bead walks down it while the algebra types; then it survives (green, a star lands) or burns out (red, dissolves, the bead falls through the map) */
  function interrogate(id,tok,done,solo){ const r=rows().find(q=>q.id===id); if(!r) return; pick=id; active=id; status[id]=null; drawTree();
    const n=r.lines.length, dur=RM?0:Math.max(1000,120*n+420); if(sc&&sc.handle) sc.handle.setAutoRotate(0);
    work.innerHTML=''; verd.className='verdict info'; verd.textContent='info — solving branch '+r.lab+' …'; ticks=0; drawChecks();
    if(chips) chips.set(`branch <b>${r.lab}</b> · solving…`,P().title);
    const typed=k=>{ work.innerHTML=r.lines.slice(0,k).map((l,i)=>'<div style="opacity:'+(0.62+0.38*(i+1)/n)+'">'+(i+1)+'. '+l+'</div>').join(''); };
    const finish=()=>{ if(tok!==run) return; typed(n); verd.className='verdict '+r.v[0]; verd.textContent=r.v[1]; status[id]=r.ok?'good':'dead'; active=null; drawTree();
      if(chips) chips.set(`<b>${r.ok?'survives':'burns out'}</b> · ${r.why.replace(/^(survives|burns out) · /,'')}`,P().title);
      if(sc){ const {ctx,hx,walker,cases}=sc, C=cases[id];
        if(r.ok){ walker.show(false); sc.starLanding=true; paintTree(); sc.star.visible=true;
          anim=tween(600,u=>{ sc.star.position.set(C.c[0],C.c[1]+.03+.9*(1-u),C.c[2]); RR(ctx); },()=>{ sc.starLanding=false; if(tok!==run) return; flare(ctx,[C.c[0],C.c[1]+.05,C.c[2]],hx('s3'),900,1.8); paintTree(); }); }
        else { sc.edges.filter(e=>e.cases.length===1&&e.cases[0]===id).forEach(e=>setEdge(e,critHex(),1,1.6)); C.ring.visible=false; RR(ctx);
          sparks(ctx,[C.c[0],C.c[1]+.05,C.c[2]],critHex(),8,700);
          anim=tween(700,u=>{ sc.edges.filter(e=>e.cases.length===1&&e.cases[0]===id).forEach(e=>e.tubes.forEach(t=>{ t.material.opacity=1-u; }));
              const p=along(C.path,1); walker.setPos([p[0],p[1]-.8*u*u,p[2]]); walker.dot.material.opacity=1-u; walker.halo.material.opacity=(sc.isLight?.32:.65)*(1-u); RR(ctx); },
            ()=>{ walker.show(false); walker.dot.material.opacity=1; walker.halo.material.opacity=sc.isLight?.32:.65; paintTree(); }); } }
      if(tab==='one'&&r.ok){ if(RM){ ticks=5; drawChecks(); } else { const nxt=()=>{ if(tok!==run) return; if(ticks>=5) return; setTimeout(()=>{ if(tok!==run) return; ticks++; drawChecks(); nxt(); },260); }; nxt(); } }
      if(done) setTimeout(()=>{ if(tok===run) done(); },RM?0:420); else if(sc&&sc.handle&&!playing) sc.handle.setAutoRotate(.06); };
    if(sc){ const {walker,cases,ctx}=sc, C=cases[id]; paintTree(); walker.show(true); walker.setPos(C.path[0]);
      if(RM){ finish(); return; }
      let shown=0; anim=tween(dur,u=>{ if(tok!==run) return; const k=Math.min(n,Math.floor((u*dur-150)/120)+1); if(k>shown){ shown=k; typed(k); } walker.setPos(along(C.path,u)); RR(ctx); },finish); }
    else { if(RM){ finish(); return; } let k=0; const nxt=()=>{ if(tok!==run) return; if(k>=n){ finish(); return; } k++; typed(k); setTimeout(nxt,120); }; nxt(); } }
  function playAll(){ stop(); const tok=run; playing=true; const rs=rows(); rs.forEach(r=>{ status[r.id]=null; }); pick=null; if(sc){ sc.star.visible=false; paintTree(); } drawTree();
    const h=sc&&sc.handle, s=h?h.ctx.orbit.sph:null, base=s?{theta:s.theta,phi:s.phi,radius:s.radius}:null;
    if(h){ h.setAutoRotate(0); camTo(h,{phi:1.22,radius:4.3*NF(),theta:base.theta+.3},900); }
    let i=0; const nxt=()=>{ if(tok!==run) return; if(i>=rs.length){ playing=false; if(h){ camTo(h,base,1200,()=>{ if(tok===run) h.setAutoRotate(.06); }); } return; }
      const r=rs[i++]; if(h) camTo(h,{theta:base.theta+(i%2?.3:-.25),phi:1.05+.1*(i%2)},900); interrogate(r.id,tok,nxt,false); };
    setTimeout(()=>{ if(tok===run) nxt(); },RM?0:500); }
  function draw(){ if(tab==='many'){ drawMany(); drawTree(); return; } pick=null; active=null; status={}; if(sc) buildScene(); idle(); paintTree(); }
  playBtn.addEventListener('click',playAll);
  bindCtl('cs-m',v=>{ m=v|0; if(tab==='many') drawMany(); },v=>String(v|0))();
  tabs(document.getElementById('cs-tabs'),t=>{ stop(); tab=t; showTab(box.closest('.widget'),t); playBar.style.display=t==='many'?'none':''; draw(); });
  showTab(box.closest('.widget'),'two');
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W12 · WHICH PROBLEMS ARE HONEST (a string between two pins, a glass tangent plane, a lit set) ================= */
(function(){
  const box=document.getElementById('bw-3d'),read=document.getElementById('bw-read'),verd=document.getElementById('bw-verdict');
  if(!box) return;
  const X=[-2,2], Y=[-1.5,1.5];
  const FN={ sq:{f:(x,y)=>x*x+y*y,g:(x,y)=>[2*x,2*y],n:'x² + y²',cv:true,sw:'alt'},
    w:{f:(x,y)=>x*x*x*x-3*x*x+y*y,g:(x,y)=>[4*x*x*x-6*x,2*y],n:'x⁴ − 3x² + y²',cv:false,sw:'x'},
    abs:{f:(x,y)=>Math.abs(x)+Math.abs(y),g:(x,y)=>[Math.sign(x),Math.sign(y)],n:'|x| + |y|',cv:true,sw:'alt'},
    exp:{f:(x,y)=>Math.exp(x)+y*y,g:(x,y)=>[Math.exp(x),2*y],n:'eˣ + y²',cv:true,sw:'alt'},
    cube:{f:(x,y)=>x*x-y*y,g:(x,y)=>[2*x,-2*y],n:'x² − y²',cv:false,sw:'alt'},
    sqrt:{f:(x,y)=>4-x*x-y*y,g:(x,y)=>[-2*x,-2*y],n:'4 − x² − y²',cv:false,sw:'alt'} };
  const a1=Math.atan2(0.95,0.8125), b1=Math.atan2(0.95,0.0125), NF=()=>box.clientWidth<560?1.25:1;
  const SETS={
    disc:{n:'a disc',cv:true,inS:p=>Math.hypot(p[0],p[1])<=1.25,tour:t=>{ const a=2*Math.PI*t; return [1.05*Math.cos(a),1.05*Math.sin(a)]; },
      shape:T=>{ const s=new T.Shape(); s.absarc(0,0,1.25,0,2*Math.PI,false); return s; }},
    poly:{n:'a polygon',cv:true,inS:p=>{ for(let k=0;k<5;k++){ const a=Math.PI/2+2*Math.PI*k/5; if(p[0]*Math.cos(a)+p[1]*Math.sin(a)>1.1+1e-9) return false; } return true; },
      tour:t=>{ const a=2*Math.PI*t; return [0.82*Math.cos(a),0.82*Math.sin(a)]; },
      shape:T=>{ const s=new T.Shape(); for(let k=0;k<5;k++){ const a=Math.PI/2+2*Math.PI*k/5, b=Math.PI/2+2*Math.PI*(k+1)/5, den=Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b);
          const q=[(1.1*Math.sin(b)-1.1*Math.sin(a))/den,(1.1*Math.cos(a)-1.1*Math.cos(b))/den]; if(k) s.lineTo(q[0],q[1]); else s.moveTo(q[0],q[1]); } s.closePath(); return s; }},
    ring:{n:'an annulus',cv:false,inS:p=>{ const r=Math.hypot(p[0],p[1]); return r>=0.62&&r<=1.32; },tour:t=>{ const a=2*Math.PI*t; return [0.97*Math.cos(a),0.97*Math.sin(a)]; },
      shape:T=>{ const s=new T.Shape(); s.absarc(0,0,1.32,0,2*Math.PI,false); const h=new T.Path(); h.absarc(0,0,0.62,0,2*Math.PI,true); s.holes.push(h); return s; }},
    moon:{n:'a crescent',cv:false,inS:p=>Math.hypot(p[0],p[1])<=1.25&&Math.hypot(p[0]-0.8,p[1])>=0.95,tour:t=>{ const a=Math.PI*(0.28+1.44*t); return [1.06*Math.cos(a),1.06*Math.sin(a)]; },
      shape:T=>{ const s=new T.Shape(); s.absarc(0,0,1.25,a1,2*Math.PI-a1,false); s.absarc(0.8,0,0.95,2*Math.PI-b1,b1,true); s.closePath(); return s; }} };
  let tab='chord',key='sq',skey='disc',pin=[{u:.18,y:-.55},{u:.86,y:.45}],th=0.5,sweep=null,anim=null,run=0,sc=null,ST=null,chips=null,drag=-1;
  const Q=()=>FN[key], xOf=u=>X[0]+(X[1]-X[0])*u;
  const pinXY=k=>tab==='sets'?SETS[skey].tour(pin[k].u):[xOf(pin[k].u),pin[k].y];
  const range=R=>{ let lo=Infinity,hi=-Infinity; for(let i=0;i<=40;i++) for(let j=0;j<=30;j++){ const v=R.f(X[0]+4*i/40,Y[0]+3*j/30); if(v<lo) lo=v; if(v>hi) hi=v; } return [lo,hi]; };
  const chordFail=(R,A,B)=>{ for(const t of [0.35,0.5,0.65]){ const m=[t*A[0]+(1-t)*B[0],t*A[1]+(1-t)*B[1]]; if(R.f(m[0],m[1])>t*R.f(A[0],A[1])+(1-t)*R.f(B[0],B[1])+1e-9) return true; } return false; };
  function pairs(R){ const out=[]; for(let i=0;i<200;i++){ const a=xOf((i*0.6180339887498949)%1), b=xOf((i*0.2360679774997896+0.37)%1), y=Y[0]+3*((i*0.7548776662466927+0.11)%1);
      if(R.sw==='x'||i%2===0) out.push([[a,y],[b,y]]); else { const x=xOf((i*0.6180339887498949)%1), ya=Y[0]+3*((i*0.2360679774997896+0.37)%1), yb=Y[0]+3*((i*0.7548776662466927+0.11)%1); out.push([[x,ya],[x,yb]]); } } return out; }
  const tanFail=(R,p)=>{ const f0=R.f(p[0],p[1]), g=R.g(p[0],p[1]); for(let i=0;i<=20;i++) for(let j=0;j<=14;j++){ const x=X[0]+4*i/20, y=Y[0]+3*j/14; if(R.f(x,y)<f0+g[0]*(x-p[0])+g[1]*(y-p[1])-1e-6) return true; } return false; };
  const tanTour=t=>{ const a=2*Math.PI*t; return [1.75*Math.cos(a),1.25*Math.sin(2*a)]; };
  function build(){
    sc=null; const narrow=box.clientWidth<560;
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[4.0,3.3,5.3]:[3.4,2.7,4.4],look:[0,.45,0],fov:36},autoRotate:.05,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const sceneG=new THREE.Group(); root.add(sceneG);
        const matOK=new THREE.MeshStandardMaterial({color:hx('s3'),emissive:hx('s3'),emissiveIntensity:isLight?.15:.8,roughness:.3});
        const matBad=new THREE.MeshStandardMaterial({color:critHex(),emissive:critHex(),emissiveIntensity:isLight?.2:.9,roughness:.3});
        [matOK,matBad].forEach(mm=>{ mm.depthTest=false; mm.depthWrite=false; mm.transparent=true; });
        const str=new THREE.Group(); root.add(str); const segs=[]; for(let i=0;i<40;i++){ const t=tube(ctx,[0,0,0],[0,1,0],hx('s3'),.02); t.material.dispose(); t.material=matOK; t.renderOrder=11; str.add(t); segs.push(t); }
        const pins=[walkerChar(ctx,hx('s4'),.055),walkerChar(ctx,hx('s4'),.055)];
        const bead=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s7'),.03),12); root.add(bead); const tick=tube(ctx,[0,0,0],[0,1,0],hx('s7'),.012); root.add(tick);
        const lab=slot(ctx,root); const lab2=slot(ctx,root); const flab=slot(ctx,root);
        const scarG=new THREE.Group(); root.add(scarG);
        const dragPlane=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})); dragPlane.rotation.x=-Math.PI/2; root.add(dragPlane);
        sc={THREE,ctx,root,colors,isLight,hx,sceneG,str,segs,matOK,matBad,pins,bead,tick,lab,lab2,flab,scarG,dragPlane,surf:null,contG:null,zs:1,zmin:0,plane:null,floor:null,base:null,handle:null,pick:null};
        chips=hudPair(box); hint(box,'drag to orbit · drag a pin');
        buildScene(); paint();
      },
      update(){ if(sc) mirror(); return false; }
    });
    if(handle&&sc){ sc.handle=handle; sc.pick=picker(handle,()=>sc.dragPlane);
      /* a pin is grabbed by its screen position (it may sit in a well the surface hides), then dragged on a level plane at its own height */
      grab(handle,e=>{ if(!sc) return false; const want=tab==='tangent'?[0]:[0,1]; const k=nearPin(e,want); if(k<0) return false; stop(); drag=k; sc.dragPlane.position.y=sc.pins[k].g.position.y; return true; },
        e=>{ if(!sc||drag<0) return; const h=sc.pick(e); if(!h) return; const x=Math.max(X[0],Math.min(X[1],h.x)), y=Math.max(Y[0],Math.min(Y[1],-h.z));
          if(tab==='sets'){ const S=SETS[skey]; let bt=0,bd=Infinity; for(let i=0;i<=160;i++){ const q=S.tour(i/160), d=Math.hypot(q[0]-x,q[1]-y); if(d<bd){ bd=d; bt=i/160; } } pin[drag].u=bt; }
          else { pin[drag].u=(x-X[0])/(X[1]-X[0]); pin[drag].y=y; }
          setCtl(drag?'bw-b':'bw-a',pin[drag].u,3); draw(); },
        ()=>{ drag=-1; }); }
    return handle;
  }
  const at=(x,y)=>[x,(Q().f(x,y)-sc.zmin)*sc.zs,-y];
  function nearPin(e,want){ const {THREE,ctx,pins}=sc, r=ctx.renderer.domElement.getBoundingClientRect(), v=new THREE.Vector3(); let best=-1,bd=42;
    want.forEach(k=>{ v.copy(pins[k].g.position).project(ctx.camera); const d=Math.hypot((v.x+1)/2*r.width-(e.clientX-r.left),(1-v.y)/2*r.height-(e.clientY-r.top)); if(d<bd){ bd=d; best=k; } }); return best; }
  function levels(){ const [lo,hi]=[sc.zmin,sc.zmax]; const lv=[]; for(let i=1;i<=9;i++) lv.push(lo+(hi-lo)*i/10); return lv; }
  /* the scene for a tab: the lit surface (string / tangent) or the floor with the lit shape (sets) */
  function buildScene(){ if(!sc) return; const {THREE,ctx,sceneG,hx,colors,isLight}=sc; clearGroup(sceneG); sc.surf=null; sc.plane=null; sc.floor=null; sc.contG=null; sc.base=null; clearGroup(sc.scarG);
    const grid=CIN.prim.grid(ctx,5.2,20,hx('grid'),{opacity:isLight?.45:.3}); grid.position.y=-.14; sceneG.add(grid);
    if(tab==='sets'){ const S=SETS[skey];
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(5.2,4.2),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.3:.5})); floor.rotation.x=-Math.PI/2; floor.position.y=-.01; sceneG.add(floor); sc.floor=floor;
      const geo=new THREE.ExtrudeGeometry(S.shape(THREE),{depth:.07,bevelEnabled:false,curveSegments:48});
      const shape=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:hx('s3'),emissive:hx('s3'),emissiveIntensity:isLight?.12:.35,roughness:.4,transparent:true,opacity:isLight?.55:.62})); shape.rotation.x=-Math.PI/2; shape.position.y=-.07; sceneG.add(shape);
      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo,20),new THREE.LineBasicMaterial({color:hx('s3'),transparent:true,opacity:.9})); edges.rotation.x=-Math.PI/2; edges.position.y=-.068; sceneG.add(edges);
      sceneG.add(CIN.prim.label(ctx,S.n,[0,.02,1.75],{size:20,color:colors.s3,bg:false,depthTest:false}));
      sc.str.visible=true; sc.bead.visible=false; sc.tick.visible=false; sc.pins[1].show(true); return; }
    const R=Q(), [lo,hi]=range(R), zs=1.35/((hi-lo)||1); sc.zs=zs; sc.zmin=lo; sc.zmax=hi;
    const surf=CIN.prim.surface(ctx,R.f,{x:X,y:Y,res:70,zscale:zs,ramp:[colors.s1,colors.s7,colors.s2],opacity:.94}); lightenSurface(ctx,surf,zs); surf.position.y=-lo*zs; sceneG.add(surf); sc.surf=surf;
    sc.base=new Float32Array(surf.userData.geo.attributes.color.array);
    const contG=new THREE.Group(); contG.position.y=-lo*zs; sceneG.add(contG); contG.add(liftedContours(ctx,R.f,levels(),X[0],X[1],Y[0],Y[1],zs,hx('ink2'),{N:64})); sc.contG=contG;
    if(tab==='tangent'){ const g=new THREE.Group(); const pane=overlay(CIN.prim.glass(ctx,1.7,1.7,hx('s3'),isLight?.22:.26),8); pane.material.opacity=isLight?.22:.26; g.add(pane);
      const fr=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.7,1.7)),new THREE.LineBasicMaterial({color:hx('s3'),transparent:true,opacity:.85,depthTest:false})); fr.renderOrder=9; g.add(fr); sceneG.add(g); sc.plane={g,pane,fr}; }
    sc.str.visible=tab==='chord'; sc.bead.visible=tab==='chord'; sc.tick.visible=tab==='chord'; sc.pins[1].show(tab!=='tangent'); }
  function reshapeSurf(){ if(!sc||!sc.surf) return; const R=Q(), [lo,hi]=range(R), zs=1.35/((hi-lo)||1); sc.zs=zs; sc.zmin=lo; sc.zmax=hi;
    reshape(sc.ctx,sc.surf,R.f,zs,null,1); sc.surf.position.y=-lo*zs; sc.base=new Float32Array(sc.surf.userData.geo.attributes.color.array);
    clearGroup(sc.contG); sc.contG.position.y=-lo*zs; sc.contG.add(liftedContours(sc.ctx,R.f,levels(),X[0],X[1],Y[0],Y[1],zs,sc.hx('ink2'),{N:64})); clearGroup(sc.scarG); }
  /* the string: forty short tubes, each coloured by whether it hangs below the surface */
  function paintString(A,B,below){ const {segs,matOK,matBad,THREE}=sc; let bad=0; const pa=at(A[0],A[1]), pb=at(B[0],B[1]);
    for(let i=0;i<40;i++){ const t0=i/40, t1=(i+1)/40, p0=[pa[0]+(pb[0]-pa[0])*t0,pa[1]+(pb[1]-pa[1])*t0+.012,pa[2]+(pb[2]-pa[2])*t0], p1=[pa[0]+(pb[0]-pa[0])*t1,pa[1]+(pb[1]-pa[1])*t1+.012,pa[2]+(pb[2]-pa[2])*t1];
      const tm=(t0+t1)/2, m=[A[0]+(B[0]-A[0])*tm,A[1]+(B[1]-A[1])*tm], chord=Q().f(A[0],A[1])+(Q().f(B[0],B[1])-Q().f(A[0],A[1]))*tm, isBad=below(m,chord); if(isBad) bad++;
      aimTube(THREE,segs[i],p0,p1); segs[i].material=isBad?matBad:matOK; segs[i].visible=true; } return bad; }
  function paintSeg(A,B,inS){ const {segs,matOK,matBad,THREE}=sc; let bad=0;
    for(let i=0;i<40;i++){ const t0=i/40, t1=(i+1)/40, tm=(t0+t1)/2, m=[A[0]+(B[0]-A[0])*tm,A[1]+(B[1]-A[1])*tm], isBad=!inS(m); if(isBad) bad++;
      aimTube(THREE,segs[i],[A[0]+(B[0]-A[0])*t0,.05,-(A[1]+(B[1]-A[1])*t0)],[A[0]+(B[0]-A[0])*t1,.05,-(A[1]+(B[1]-A[1])*t1)]); segs[i].material=isBad?matBad:matOK; } return bad; }
  function paintPlane(A){ const {plane,surf,base,THREE,hx}=sc; if(!plane||!surf) return 0; const R=Q(), f0=R.f(A[0],A[1]), g=R.g(A[0],A[1]), zs=sc.zs, p=at(A[0],A[1]);
    plane.g.position.set(p[0],p[1]+.006,p[2]); const n=new THREE.Vector3(-g[0]*zs,1,g[1]*zs).normalize(); plane.g.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);
    const geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color, crit=new THREE.Color(critHex()).convertSRGBToLinear(); let fails=0, tot=0;
    for(let i=0;i<pos.count;i++){ const x=pos.getX(i), y=-pos.getZ(i), d=R.f(x,y)-(f0+g[0]*(x-A[0])+g[1]*(y-A[1])); tot++;
      if(d<-1e-4){ fails++; const k=Math.min(1,-d*2/((sc.zmax-sc.zmin)||1)+.55); col.setXYZ(i,base[3*i]+(crit.r-base[3*i])*k,base[3*i+1]+(crit.g-base[3*i+1])*k,base[3*i+2]+(crit.b-base[3*i+2])*k); }
      else col.setXYZ(i,base[3*i],base[3*i+1],base[3*i+2]); }
    col.needsUpdate=true; const c=fails?critHex():hx('s3'); plane.pane.material.color.setHex(c); plane.pane.material.emissive.setHex(c); plane.fr.material.color.setHex(c); return fails/tot; }
  function mirror(){ const {pins,ctx,THREE}=sc, v=new THREE.Vector3(); box.dataset.pins=JSON.stringify(pins.map(p=>{ v.copy(p.g.position).project(ctx.camera); return [+((v.x+1)/2).toFixed(3),+((1-v.y)/2).toFixed(3)]; })); }
  function paint(){ if(!sc) return; paintCore(); mirror(); }
  function paintCore(){ const {pins,bead,tick,lab,lab2,flab,ctx,hx,THREE}=sc; const A=pinXY(0), B=pinXY(1), R=Q(); if(tab!=='sets') flab.set('f = '+R.n,[0,-.1,1.85],{size:20,color:sc.colors.ink2,bg:false,depthTest:false}); else flab.hide();
    if(tab==='sets'){ const S=SETS[skey]; pins[0].setPos([A[0],.05,-A[1]]); pins[1].setPos([B[0],.05,-B[1]]); const bad=paintSeg(A,B,S.inS);
      lab.set('x',[A[0],.3,-A[1]],{size:18,color:sc.colors.s4,bg:false,depthTest:false}); lab2.set('y',[B[0],.3,-B[1]],{size:18,color:sc.colors.s4,bg:false,depthTest:false});
      if(chips) chips.set(`${S.n} · the segment <b>${bad?'leaves the set':'stays inside'}</b>`,sweep&&sweep.done?`the segment left the set at <b>${sweep.bad}</b> of 200 positions`:'drag a pin around the rim'); RR(ctx); return; }
    const pa=at(A[0],A[1]); pins[0].setPos([pa[0],pa[1]+.012,pa[2]]);
    if(tab==='tangent'){ const frac=paintPlane(A); lab.set('tangent plane at ('+F(A[0],2)+', '+F(A[1],2)+')',[pa[0],pa[1]+.42,pa[2]],{size:17,color:sc.colors.s4,bg:true,depthTest:false}); lab2.hide();
      if(chips) chips.set(`f = ${R.n} · the plane <b>${frac>0?'pokes out of the surface':'stays under the surface'}</b>`,sweep&&sweep.done?`the tangent test failed at <b>${sweep.bad}</b> of 200 points`:'drag the pin'); RR(ctx); return; }
    const pb=at(B[0],B[1]); pins[1].setPos([pb[0],pb[1]+.012,pb[2]]);
    const fa=R.f(A[0],A[1]), fb=R.f(B[0],B[1]); const bad=paintString(A,B,(m,chord)=>R.f(m[0],m[1])>chord+1e-9);
    const mx=[th*A[0]+(1-th)*B[0],th*A[1]+(1-th)*B[1]], lhs=R.f(mx[0],mx[1]), rhs=th*fa+(1-th)*fb, pm=at(mx[0],mx[1]), pc=[pm[0],(rhs-sc.zmin)*sc.zs+.012,pm[2]];
    bead.position.set(pc[0],pc[1],pc[2]); aimTube(THREE,tick,[pm[0],pm[1]+.012,pm[2]],pc); const tc=lhs<=rhs+1e-9?hx('s7'):critHex(); tick.material.color.setHex(tc); tick.material.emissive.setHex(tc); bead.material.color.setHex(tc); bead.material.emissive.setHex(tc);
    lab.set('x',[pa[0],pa[1]+.3,pa[2]],{size:18,color:sc.colors.s4,bg:false,depthTest:false}); lab2.set('y',[pb[0],pb[1]+.3,pb[2]],{size:18,color:sc.colors.s4,bg:false,depthTest:false});
    if(chips) chips.set(`f = ${R.n} · the string <b>${bad?'passes under the surface':'stays clear'}</b>`,sweep&&sweep.done?`the chord test failed at <b>${sweep.bad}</b> of 200`:(sweep?`the chord test failed at <b>${sweep.bad}</b> of ${sweep.shown}`:'drag a pin · the red part hangs below the surface'));
    RR(ctx); }
  function scars(){ if(!sc) return; clearGroup(sc.scarG); if(!sweep||tab!=='chord') return; const {THREE,hx}=sc; const good=[],bad=[];
    sweep.pairs.slice(0,sweep.shown).forEach(([A,B,f])=>{ const a=at(A[0],A[1]), b=at(B[0],B[1]); (f?bad:good).push(a[0],a[1]+.02,a[2],b[0],b[1]+.02,b[2]); });
    [[good,hx('s3'),.18],[bad,critHex(),.75]].forEach(([arr,c,op])=>{ if(!arr.length) return; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(arr),3)); const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:op})); l.frustumCulled=false; sc.scarG.add(l); }); }
  function draw(){ const R=Q();
    if(tab==='sets'){ const S=SETS[skey], A=S.tour(pin[0].u), B=S.tour(pin[1].u); let out=0; for(let i=0;i<=120;i++){ const u=i/120; if(!S.inS([A[0]+(B[0]-A[0])*u,A[1]+(B[1]-A[1])*u])) out++; }
      read.innerHTML='the segment leaves the set: <b>'+(out>0?'yes':'no')+'</b>'+(out>0?' ('+F(out/121*100,0)+' % of it is outside)':'')+'<br>a convex set contains every segment between two of its points — no exceptions, no thin bits';
      if(out>0){ verd.className='verdict bad'; verd.textContent='bad — not a convex set: two allowed points with a banned stretch between them'; }
      else { verd.className='verdict '+(S.cv?'good':'info'); verd.textContent=S.cv?'good — a convex set: every segment stays inside':'info — this pair stays inside, but drag the points across the hole'; } paint(); return; }
    const A=pinXY(0), B=pinXY(1);
    if(tab==='tangent'){ const f0=R.f(A[0],A[1]), g=R.g(A[0],A[1]); let fails=0,tot=0; for(let i=0;i<=40;i++) for(let j=0;j<=30;j++){ const x=X[0]+4*i/40, y=Y[0]+3*j/30; tot++; if(R.f(x,y)<f0+g[0]*(x-A[0])+g[1]*(y-A[1])-1e-6) fails++; }
      let bad=0; for(let k=0;k<200;k++){ if(tanFail(R,tanTour(k/200))) bad++; }
      read.innerHTML='f(y) ≥ f(x) + ∇f(x)ᵀ(y−x)?  <b>'+(fails?'fails on '+F(fails/tot*100,0)+' % of the surface':'holds everywhere')+'</b><br>'+
        'over the whole surface, <b>'+bad+'</b> of 200 tangent points fail — the chord test fails on exactly the same surfaces<br>'+
        'the two tests agree on every surface here: a string that passes under is exactly a plane that pokes out';
      if(!fails){ verd.className='verdict '+(R.cv?'good':'info'); verd.textContent=R.cv?'good — the surface never falls below a tangent plane: a bowl':'info — this tangent is safe; drag the pin to where the surface bends the wrong way'; }
      else { verd.className='verdict bad'; verd.textContent='bad — the surface dives under its own tangent plane: not a bowl'; } paint(); return; }
    const fa=R.f(A[0],A[1]), fb=R.f(B[0],B[1]), mx=[th*A[0]+(1-th)*B[0],th*A[1]+(1-th)*B[1]], lhs=R.f(mx[0],mx[1]), rhs=th*fa+(1-th)*fb;
    read.innerHTML='θ = <b>'+F(th,2)+'</b>  ·  f(θx+(1−θ)y) = <b>'+F(lhs,4)+'</b>  ·  θf(x)+(1−θ)f(y) = <b>'+F(rhs,4)+'</b>  ·  <b>'+(lhs<=rhs+1e-9?'≤ holds':'FAILS')+'</b>'+
      (sweep&&sweep.done?'<br>the chord test failed at <b>'+sweep.bad+'</b> of 200 sampled pairs':'')+
      '<br>x = (<b>'+F(A[0],2)+'</b>, <b>'+F(A[1],2)+'</b>) · y = (<b>'+F(B[0],2)+'</b>, <b>'+F(B[1],2)+'</b>) · f(x) = '+F(fa,3)+', f(y) = '+F(fb,3);
    if(lhs<=rhs+1e-9){ verd.className='verdict '+(R.cv?'good':'info'); verd.textContent=R.cv?'good — a bowl: no chord ever cuts into it, so a stopping point is THE answer':'info — this pair passes, but the function is not a bowl: press ▶ to find the pairs that fail'; }
    else { verd.className='verdict bad'; verd.textContent='bad — the chord dips below the curve: this is not a bowl, so a stopping point is only a candidate'; }
    paint(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.05); }
  /* ▶: the string tries 200 pairs, every failed pair leaving a red scar on the surface; on the other tabs the pin tours the surface / the rim */
  function play(){ stop(); const tok=run; const R=Q(); const keep=pin.map(p=>({u:p.u,y:p.y}));
    if(sc&&sc.handle){ sc.handle.setAutoRotate(0); const s=sc.handle.ctx.orbit.sph; camTo(sc.handle,{phi:Math.min(s.phi,1.0),radius:Math.max(s.radius,5.2*NF())},1200); }
    const restore=()=>{ pin=keep; setCtl('bw-a',pin[0].u,3); setCtl('bw-b',pin[1].u,3); draw(); if(sc&&sc.handle) sc.handle.setAutoRotate(.05); };
    if(tab==='sets'){ const S=SETS[skey]; const N=200; let bad=0; const test=t=>{ const A=S.tour(pin[0].u), B=S.tour(t); for(let i=0;i<=40;i++){ const u=i/40; if(!S.inS([A[0]+(B[0]-A[0])*u,A[1]+(B[1]-A[1])*u])) return true; } return false; };
      for(let k=0;k<N;k++) if(test(0.02+0.96*k/(N-1))) bad++; sweep={bad,done:false,shown:0};
      if(RM){ sweep.done=true; restore(); return; }
      anim=tween(3000,u=>{ if(tok!==run) return; pin[1].u=0.02+0.96*u; sweep.shown=Math.round(u*N); setCtl('bw-b',pin[1].u,3); draw(); },()=>{ if(tok!==run) return; sweep.done=true; restore(); }); return; }
    if(tab==='tangent'){ const N=200; let bad=0; for(let k=0;k<N;k++) if(tanFail(R,tanTour(k/N))) bad++; sweep={bad,done:false,shown:0};
      if(RM){ sweep.done=true; restore(); return; }
      anim=tween(3000,u=>{ if(tok!==run) return; const p=tanTour(u); pin[0].u=(p[0]-X[0])/4; pin[0].y=p[1]; sweep.shown=Math.round(u*N); setCtl('bw-a',pin[0].u,3); draw(); },()=>{ if(tok!==run) return; sweep.done=true; restore(); }); return; }
    const PR=pairs(R).map(([A,B])=>[A,B,chordFail(R,A,B)]); const bad=PR.filter(p=>p[2]).length; sweep={pairs:PR,bad:0,shown:0,done:false};
    if(RM){ sweep.shown=200; sweep.bad=bad; sweep.done=true; scars(); restore(); return; }
    anim=tween(3000,u=>{ if(tok!==run) return; const k=Math.max(1,Math.round(u*200)); if(k!==sweep.shown){ sweep.shown=k; sweep.bad=PR.slice(0,k).filter(p=>p[2]).length; const [A,B]=PR[k-1]; pin[0].u=(A[0]-X[0])/4; pin[0].y=A[1]; pin[1].u=(B[0]-X[0])/4; pin[1].y=B[1]; scars(); draw(); } },
      ()=>{ if(tok!==run) return; sweep.shown=200; sweep.bad=bad; sweep.done=true; scars(); restore(); if(sc&&bad) flare(sc.ctx,[0,.9,0],critHex(),800,1.4); }); }
  document.getElementById('bw-play').addEventListener('click',play);
  const fbar=document.getElementById('bw-f'), sbar=document.getElementById('bw-s');
  fbar.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{ stop(); pressOnly(fbar,b); key=b.dataset.f; sweep=null; reshapeSurf(); draw(); }));
  sbar.querySelectorAll('[data-s]').forEach(b=>b.addEventListener('click',()=>{ stop(); pressOnly(sbar,b); skey=b.dataset.s; sweep=null; if(sc) buildScene(); draw(); }));
  bindCtl('bw-a',v=>{ stop(); pin[0].u=v; draw(); },v=>fmt(v,3))();
  bindCtl('bw-b',v=>{ stop(); pin[1].u=v; draw(); },v=>fmt(v,3))();
  bindCtl('bw-th',v=>{ th=v; draw(); },v=>fmt(v,2))();
  tabs(document.getElementById('bw-tabs'),t=>{ stop(); tab=t; sweep=null;
    fbar.style.display=t==='sets'?'none':''; sbar.style.display=t==='sets'?'':'none';
    document.getElementById('bw-b').parentNode.style.display=t==='tangent'?'none':'';
    document.getElementById('bw-th').parentNode.style.display=t==='chord'?'':'none'; if(sc) buildScene(); if(sc&&sc.handle){ sc.handle.ctx.look.y=t==='sets'?0:.45; camTo(sc.handle,t==='sets'?{phi:1.0,radius:4.6*NF()}:{phi:1.2,radius:6.0*NF()},900); } draw(); });
  sbar.style.display='none'; document.getElementById('bw-th').parentNode.style.display='';
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
  /* self-check: the two sweep counts this unit quotes */
  (function(){ const a=pairs(FN.sq).filter(([A,B])=>chordFail(FN.sq,A,B)).length, b=pairs(FN.w).filter(([A,B])=>chordFail(FN.w,A,B)).length;
    console.info('U11 chord sweep · bowl fails '+a+' of 200 · wavy fails '+b+' of 200'); if(a!==0||b!==119) console.warn('W12 sweep counts unexpected',a,b); })();
})();

/* ================= W13 · WHO MOVES FIRST (two facing panels and a beam · a sheaf of forty rods and the ridge under them · the gap as a ruler) ================= */
(function(){
  const box=document.getElementById('du-3d'),caseBar=document.getElementById('du-case'),read=document.getElementById('du-read'),verd=document.getElementById('du-verdict');
  if(!box) return;
  const NF=()=>box.clientWidth<560?1.25:1;   /* a phone stage is narrow: every camera radius is scaled up */
  /* the non-convex tab's two problems. d(µ) = min over x of f + µg, by a fine grid then Newton on h' = 0. */
  const GAP={
    bands:{name:'f(x) = x   subject to  g(x) = (x² − 1)(x² − 4) ≤ 0',
      f:x=>x, g:x=>(x*x-1)*(x*x-4), XR:[-7,7], N:6000, MU:0.5, pstar:-2, xp:-2,
      hd:(x,m)=>1+m*(4*x*x*x-10*x), hdd:(x,m)=>m*(12*x*x-10), bands:[[-2,-1],[1,2]], GX:[-2.6,2.6], V:[-3.2,3.0]},
    wells:{name:'f(x) = (x² − 1)² + 0.4x   subject to  g(x) = −x ≤ 0',
      f:x=>Math.pow(x*x-1,2)+0.4*x, g:x=>-x, XR:[-2.2,2.2], N:6000, MU:1.2, pstar:null, xp:0.945650,
      hd:(x,m)=>4*x*(x*x-1)+0.4-m, hdd:()=>0, bands:[[0,2.2]], GX:[-1.4,1.35], V:[-0.9,1.05], hdd2:x=>12*x*x-4},
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
    const DS=[]; for(let i=0;i<=72;i++){ const m=C.MU*i/72; DS.push([m,dOfCase(C,m).d]); }
    return MEMO[k]={C,dstar:s.d,mustar:s.mu,pstar:p,gap:p-s.d,DS}; }
  const fP=x=>(x-3)*(x-3), gP=x=>x-1, dP=m=>2*m-m*m/4;
  const XS=[]; for(let i=0;i<40;i++) XS.push(-1+6*i/39);
  const dB=m=>{ let lo=Infinity; XS.forEach(x=>{ lo=Math.min(lo,fP(x)+m*gP(x)); }); return lo; };
  let tab='two',cs='bands',dx=1,dmu=4,dxl=3,run=0,anim=null,sc=null,ST=null,chips=null,met=false;
  /* the bundle's world: µ → x, L → height, x → depth */
  const BX=m=>(m-4)*.45, BY=L=>(L+3)*(1.6/13.5), BZ=x=>(x-2)/3*.6, LCLIP=[-3,9.5];
  const VIEWS={two:{theta:.12,phi:1.22,radius:6.0},gap:{theta:.12,phi:1.22,radius:6.0},bundle:{theta:.22,phi:1.2,radius:5.5}};
  const VW=t=>({theta:VIEWS[t].theta,phi:VIEWS[t].phi,radius:VIEWS[t].radius*NF()});
  function build(){
    sc=null; const narrow=box.clientWidth<560; const v=VIEWS[tab], r=v.radius*NF(), look=[0,.75,0];
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:[look[0]+r*Math.sin(v.theta)*Math.sin(v.phi),look[1]+r*Math.cos(v.phi),look[2]+r*Math.cos(v.theta)*Math.sin(v.phi)],look,fov:36},autoRotate:0,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const sceneG=new THREE.Group(); root.add(sceneG);
        const grid=CIN.prim.grid(ctx,6,24,hx('grid'),{opacity:isLight?.45:.3}); grid.position.y=-.12; root.add(grid);
        const wP=walkerChar(ctx,hx('s2'),.05), wD=walkerChar(ctx,hx('s3'),.05); const wX=walkerChar(ctx,hx('s4'),.05);
        const lab=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,sceneG,wP,wD,wX,lab,L:null,R:null,beam:null,ruler:null,hl:null,handle:null,theta0:v.theta,story:false,user:false};
        chips=hudPair(box); hint(box,'drag to orbit');
        buildScene(); paint();
      },
      /* the slow swing: the camera rocks ±0.2 rad so the panels' and rods' depth reads; it yields to a story and to the user's own drag */
      update(ctx,t){ if(!sc||!sc.handle||sc.story||sc.user||RM) return false; const o=sc.handle.ctx.orbit; o.sph.theta=sc.theta0+.2*Math.sin(t*.4); o.place(); return true; }
    });
    if(handle){ grab(handle,()=>{ if(sc) sc.user=true; return false; },()=>{}); if(sc) sc.handle=handle; }
    return handle;
  }
  const resume=()=>{ if(!sc||!sc.handle) return; sc.theta0=sc.handle.ctx.orbit.sph.theta-.2*Math.sin(performance.now()/1000*.4); sc.story=false; };
  const world=(P,u,v,lift)=>{ const {THREE}=sc; P.g.updateMatrixWorld(true); const q=P.g.localToWorld(new THREE.Vector3(...P.toLocal(u,v))); return [q.x,q.y+(lift||0),q.z]; };
  /* a dark strip on a panel (the banned part) or a lit one (the feasible set) */
  function strip(P,u0,u1,color,op,h){ const {THREE}=sc; const w=Math.max(.001,(u1-u0))*P.W, m=new THREE.Mesh(new THREE.PlaneGeometry(w,(h||1)*P.H),new THREE.MeshBasicMaterial({color,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide}));
    m.position.set(((u0+u1)/2-.5)*P.W,((h||1)/2-.5)*P.H,.006); P.g.add(m); return m; }
  function twoPanels(){ const {THREE,ctx,sceneG,hx,colors,isLight}=sc;
    const L=glassPanel(ctx,{w:2.1,h:1.5,pos:[-1.2,.85,0],yaw:.5,color:'s1'}), R=glassPanel(ctx,{w:2.1,h:1.5,pos:[1.2,.85,0],yaw:-.5,color:'s3'}); sceneG.add(L.g); sceneG.add(R.g); sc.L=L; sc.R=R;
    if(tab==='two'){ const X0=-1,X1=5,V0=-1,V1=10.5,M0=0,M1=10; const ux=x=>(x-X0)/(X1-X0), vv=y=>(y-V0)/(V1-V0), um=m=>(m-M0)/(M1-M0); sc.map={ux,vv,um};
      strip(L,ux(1),1,isLight?hx('s2'):0x000000,isLight?.12:.42); const fence=tube(ctx,L.toLocal(ux(1),0),L.toLocal(ux(1),1),hx('s2'),.008,.9); L.g.add(fence);
      const pts=[]; for(let i=0;i<=80;i++){ const x=X0+(X1-X0)*i/80; pts.push([ux(x),Math.max(0,Math.min(1,vv(fP(x))))]); } L.curve(pts,hx('s1'),.012);
      const pd=[]; for(let i=0;i<=80;i++){ const m=M0+(M1-M0)*i/80, y=vv(dP(m)); if(y>=-.01) pd.push([um(m),Math.max(0,Math.min(1,y))]); } R.curve(pd,hx('s3'),.012);
      L.hline(vv(4),hx('s4'),true); R.hline(vv(4),hx('s4'),true);
      L.bead(ux(1),vv(4),hx('s4'),.035); R.bead(um(4),vv(4),hx('s4'),.035);
      L.text('the primal, in x',.5,.93,{size:18,color:colors.ink2}); R.text('the dual, in µ ≥ 0',.5,.93,{size:18,color:colors.ink2});
      L.text('banned x > 1',ux(3.4),.62,{size:16,color:colors.s2}); R.text('d* = 4 at µ* = 4',um(4)+.24,vv(4)+.1,{size:16,color:isLight?colors.ink2:colors.s4});
      const a=world(L,ux(1),vv(4)), b=world(R,um(4),vv(4)); const beam=tube(ctx,a,b,hx('s4'),.009,.75); overlay(beam,9); sceneG.add(beam); sc.beam=beam;
      sc.wX.show(false); }
    else { const K=facts(cs), C=K.C, X0=C.GX[0],X1=C.GX[1],V0=C.V[0],V1=C.V[1]; const ux=x=>(x-X0)/(X1-X0), vv=y=>(y-V0)/(V1-V0), um=m=>m/C.MU; sc.map={ux,vv,um};
      strip(L,0,1,isLight?hx('s2'):0x000000,isLight?.10:.38); C.bands.forEach(b=>{ const s=strip(L,ux(Math.max(X0,b[0])),ux(Math.min(X1,b[1])),hx('s3'),isLight?.22:.28); s.position.z=.008; });
      const pts=[]; for(let i=0;i<=100;i++){ const x=X0+(X1-X0)*i/100, y=vv(C.f(x)); if(y>=-.02&&y<=1.02) pts.push([ux(x),Math.max(0,Math.min(1,y))]); } L.curve(pts,hx('s1'),.012);
      let pd=[]; K.DS.forEach(([m,d])=>{ if(!isFinite(d)) return; const y=vv(d); if(y>=-.02&&y<=1.02) pd.push([um(m),Math.max(0,Math.min(1,y))]); }); R.curve(pd,hx('s3'),.012);
      L.hline(vv(K.pstar),hx('s4'),true); R.hline(vv(K.pstar),hx('s4'),true);
      L.bead(ux(C.xp),vv(K.pstar),hx('s4'),.035); R.bead(um(K.mustar),vv(K.dstar),hx('s3'),.035);
      L.text('the primal · lit where g ≤ 0',.5,.93,{size:18,color:colors.ink2}); R.text('the dual d(µ)',.5,.93,{size:18,color:colors.ink2});
      L.text('p* = '+F(K.pstar,4),ux(C.xp)+(cs==='bands'?.2:-.22),vv(K.pstar)+.1,{size:16,color:isLight?colors.ink2:colors.s4});
      const a=world(L,ux(C.xp),vv(K.pstar)), b=world(R,um(K.mustar),vv(K.pstar)); const beam=tube(ctx,a,b,hx('s4'),.009,.75); overlay(beam,9); sceneG.add(beam); sc.beam=beam;
      const rl=tube(ctx,world(R,um(K.mustar),vv(K.dstar)),world(R,um(K.mustar),vv(K.pstar)),critHex(),.03,1); overlay(rl,10); rl.visible=K.gap>1e-4; sceneG.add(rl); sc.ruler=rl; sc.rulerEnds=[world(R,um(K.mustar),vv(K.dstar)),world(R,um(K.mustar),vv(K.pstar))];
      if(K.gap>1e-4) R.text('gap '+F(K.gap,4),um(K.mustar)+.19,(vv(K.dstar)+vv(K.pstar))/2,{size:17,color:cssv('critical'),bg:true});
      sc.wX.show(false); }
    const slab=new THREE.Mesh(new THREE.PlaneGeometry(5.5,3.2),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.3:.5})); slab.rotation.x=-Math.PI/2; slab.position.y=-.125; sceneG.add(slab); }
  /* forty straight rods, one per x, and the thick ridge running under all of them — visibly a bowl turned upside down */
  function bundle(){ const {THREE,ctx,sceneG,hx,colors,isLight}=sc;
    const slab=new THREE.Mesh(new THREE.PlaneGeometry(5.5,3.2),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.3:.5})); slab.rotation.x=-Math.PI/2; slab.position.y=-.125; sceneG.add(slab);
    sceneG.add(tube(ctx,[BX(0),-.11,.78],[BX(8),-.11,.78],hx('s7'),.014,.9)); [0,2,4,6,8].forEach(m=>sceneG.add(tube(ctx,[BX(m),-.11,.73],[BX(m),-.11,.83],hx('s7'),.01,.9)));
    sceneG.add(CIN.prim.label(ctx,'µ = 0',[BX(0),-.05,.98],{size:16,color:colors.muted,bg:false,depthTest:false})); sceneG.add(CIN.prim.label(ctx,'µ = 8',[BX(8),-.05,.98],{size:16,color:colors.muted,bg:false,depthTest:false}));
    const rods=[]; XS.forEach(x=>{ const h=fP(x), s=gP(x); let m0=0,m1=8; if(s>1e-9){ m1=Math.min(8,(LCLIP[1]-h)/s); } else if(s<-1e-9){ m1=Math.min(8,(LCLIP[0]-h)/s); } if(m1<=m0+1e-6) return;
      const t=tube(ctx,[BX(m0),BY(h+m0*s),BZ(x)],[BX(m1),BY(h+m1*s),BZ(x)],hx('s1'),.011,isLight?.5:.38); sceneG.add(t); rods.push({x,t}); }); sc.rods=rods;
    const rp=[]; for(let i=0;i<=64;i++){ const m=8*i/64, xs=Math.max(-1,Math.min(5,3-m/2)); rp.push([BX(m),BY(dB(m))+.004,BZ(xs)]); } sceneG.add(polyTube(ctx,rp,hx('s3'),.03,false));
    const cur=[]; rp.forEach(p=>{ cur.push(p[0],p[1],p[2],p[0],-.11,p[2]); }); const idx=[]; for(let i=0;i<rp.length-1;i++){ const a=2*i; idx.push(a,a+1,a+2,a+1,a+3,a+2); }
    const cg=new THREE.BufferGeometry(); cg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(cur),3)); cg.setIndex(idx); const curtain=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:hx('s3'),transparent:true,opacity:isLight?.08:.1,side:THREE.DoubleSide,depthWrite:false})); sceneG.add(curtain);
    const peak=overlay(CIN.prim.dot(ctx,[BX(4),BY(4)+.004,BZ(1)],hx('s3'),.05),12); sceneG.add(peak); const ph=haloSprite(ctx,hx('s3'),.5); ph.position.set(BX(4),BY(4),BZ(1)); sceneG.add(ph);
    sceneG.add(CIN.prim.label(ctx,'µ* = 4 · d* = 4',[BX(4),.06,.78],{size:16,color:colors.s3,bg:true,depthTest:false}));
    const hl=tube(ctx,[0,0,0],[0,1,0],hx('s4'),.024,1); overlay(hl,11); sceneG.add(hl); const drop=tube(ctx,[0,0,0],[0,1,0],hx('s4'),.008,.5); sceneG.add(drop); sc.hl={rod:hl,drop};
    sc.wX.show(true); sc.wP.show(false); sc.wD.show(false); }
  function buildScene(){ if(!sc) return; clearGroup(sc.sceneG); sc.L=sc.R=sc.beam=sc.ruler=sc.hl=null; sc.rods=null; met=false; sc.lab.hide();
    if(tab==='bundle') bundle(); else twoPanels();
    if(sc.handle){ sc.story=true; camTo(sc.handle,VW(tab),900,resume); } }
  function paint(){ if(!sc) return; const {ctx,hx,wP,wD,wX,lab,colors}=sc;
    if(tab==='two'){ const {ux,vv,um}=sc.map, xv=Math.max(-1,Math.min(5,dx)), mv=Math.max(0,Math.min(10,dmu));
      wP.show(true); wD.show(true); wP.setPos(world(sc.L,ux(xv),Math.max(0,Math.min(1,vv(fP(xv)))),.02)); wD.setPos(world(sc.R,um(mv),Math.max(0,Math.min(1,vv(dP(mv)))),.02));
      const on=Math.abs(fP(xv)-4)<1e-6&&Math.abs(dP(mv)-4)<1e-6;
      if(on&&!met){ flare(ctx,wP.g.position.toArray(),hx('s4'),900,1.5); flare(ctx,wD.g.position.toArray(),hx('s4'),900,1.5); } met=on;
      if(chips) chips.set(`p(x) = <b>${F(fP(xv),3)}</b> · d(µ) = <b>${F(dP(mv),3)}</b> · gap so far = <b>${F(fP(xv)-dP(mv),3)}</b>`,on?'<b>p* = 4 = d*</b> · the two beads sit on one beam of light':'weak duality: every allowed p(x) sits above every d(µ)'); }
    else if(tab==='gap'){ const K=facts(cs), {ux,vv,um}=sc.map; wP.show(true); wD.show(true); wP.setPos(world(sc.L,ux(K.C.xp),vv(K.pstar),.02)); wD.setPos(world(sc.R,um(K.mustar),vv(K.dstar),.02));
      if(chips) chips.set(`p* = <b>${F(K.pstar,4)}</b> · d* = <b>${F(K.dstar,4)}</b> · duality gap = <b>${F(K.gap,4)}</b>`,K.gap>1e-4?'the ridge stops short of the beam — a real gap':'the ridge reaches the beam — no gap, even without convexity'); }
    else { const xl=Math.max(-1,Math.min(5,dxl)), h=fP(xl), s=gP(xl); let m0=0,m1=8; if(s>1e-9) m1=Math.min(8,(LCLIP[1]-h)/s); else if(s<-1e-9) m1=Math.min(8,(LCLIP[0]-h)/s);
      const a=[BX(m0),BY(h),BZ(xl)], b=[BX(m1),BY(h+m1*s),BZ(xl)]; aimTube(sc.THREE,sc.hl.rod,a,b);
      const mt=Math.max(0,Math.min(8,6-2*xl)), p=[BX(mt),BY(h+mt*s),BZ(xl)]; wX.setPos([p[0],p[1]+.01,p[2]]); aimTube(sc.THREE,sc.hl.drop,[p[0],-.11,p[2]],p);
      if(sc.rods) sc.rods.forEach(r=>{ const k=Math.max(0,1-Math.abs(r.x-xl)/.5); r.t.material.opacity=(sc.isLight?.5:.38)+.5*k; });
      lab.set(`x = ${F(xl,2)} → height f(x) = ${F(h,2)}, slope g(x) = ${F(s,2)}`,[Math.max(-1.1/NF(),Math.min(1.1/NF(),p[0])),p[1]+.28,p[2]],{size:17,color:sc.isLight?colors.ink:colors.s4,bg:true,depthTest:false});
      if(chips) chips.set(`rod x = <b>${F(xl,2)}</b> · it is the lowest rod at µ = <b>${F(mt,2)}</b>`,'forty straight rods · the lit ridge under them bends downward'); }
    RR(ctx); }
  function drawTwo(){ const xv=Math.max(-1,Math.min(5,dx)), mv=Math.max(0,Math.min(10,dmu)), gapNow=fP(xv)-dP(mv);
    read.innerHTML='p(x) = <b>'+F(fP(xv),4)+'</b>   d(µ) = <b>'+F(dP(mv),4)+'</b>   gap so far = <b>'+F(gapNow,4)+'</b><br>'+
      'd(µ) = <b>2µ − µ²/4</b>, maximised at µ* = 4<br>p* = 4 = d*  →  zero duality gap (strong duality)';
    if(Math.abs(fP(xv)-4)<1e-6&&Math.abs(dP(mv)-4)<1e-6){ verd.className='verdict good'; verd.textContent='good — p* = 4 = d*: the two views meet, so the dual answer IS the primal answer'; }
    else { verd.className='verdict info'; verd.textContent='info — every allowed x is above every d(µ): weak duality is the whole left-hand column of this picture'; } paint(); }
  function drawBundle(){ const xl=Math.max(-1,Math.min(5,dxl)), h=fP(xl), s=gP(xl);
    read.innerHTML='d is the lowest of 40 straight rods. The lowest of any bundle of straight rods bends downward — so the dual is ALWAYS concave, however ugly f is.<br>'+
      'highlighted: x = <b>'+F(xl,2)+'</b> → height f(x) = <b>'+F(h,4)+'</b>, slope g(x) = <b>'+F(s,4)+'</b>';
    verd.className='verdict good'; verd.textContent='good — concavity is free: it comes from the SHAPE of the dual, not from any assumption about f or g'; paint(); }
  function drawGap(){ const K=facts(cs);
    read.innerHTML='p* = <b>'+F(K.pstar,4)+'</b>  ·  d* = <b>'+F(K.dstar,4)+'</b>  ·  duality gap = <b>'+F(K.gap,4)+'</b>'+(K.gap>1e-4?' > 0':'')+'<br>'+
      'the best fine rate is µ* = <b>'+F(K.mustar,4)+'</b>'+
      (cs==='bands'?'<br>the feasible set is [−2, −1] ∪ [1, 2], so p* = −2 — and the Lagrangian’s only stationary point IS x = −2, so d* reaches it'
                   :'<br>the deeper well is banned, so the cheapest Lagrangian point jumps from one well to the other and never stops at the answer');
    verd.className='verdict info';
    verd.textContent=K.gap>1e-4?'info — weak duality still holds (d* ≤ p*); it is strong duality that needs convexity'
                               :'info — weak duality still holds (d* ≤ p*); here the gap is zero even without convexity — convexity is sufficient, not necessary'; paint(); }
  function draw(){ caseBar.style.display=tab==='gap'?'':'none'; showTab(box.closest('.widget'),tab);
    if(tab==='two') drawTwo(); else if(tab==='bundle') drawBundle(); else drawGap(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.story) resume(); }
  /* ▶ stories: the two beads travel to the beam · the highlight sweeps the sheaf · the dual bead climbs the ridge and the ruler measures what is left */
  function play(){ stop(); const tok=run; const h=sc&&sc.handle; if(sc) sc.story=true;
    const done=()=>{ if(tok===run) resume(); };
    if(tab==='two'){ const x0=dx, m0=dmu; if(h) camTo(h,{theta:.02,phi:1.25,radius:4.8*NF()},900);
      anim=tween(2200,u=>{ if(tok!==run) return; dx=Math.round((x0+(1-x0)*u)*50)/50; dmu=Math.round((m0+(4-m0)*u)*20)/20; setCtl('du-x',dx,2); setCtl('du-mu',dmu,2); drawTwo(); },
        ()=>{ if(tok!==run) return; dx=1; dmu=4; setCtl('du-x',1,2); setCtl('du-mu',4,2); drawTwo(); if(h) camTo(h,VW('two'),1200,done); else done(); }); return; }
    if(tab==='gap'){ const K=facts(cs), {um,vv}=sc?sc.map:{um:null}; if(!sc){ drawGap(); return; }
      if(h) camTo(h,{theta:-.2,phi:1.2,radius:5.2*NF()},900); const rl=sc.ruler, ends=sc.rulerEnds; if(rl) rl.visible=false;
      anim=tween(2000,u=>{ if(tok!==run) return; const m=Math.max(cs==='bands'?.02:0,K.mustar*u), d=dOfCase(K.C,m).d; sc.wD.setPos(world(sc.R,um(m),Math.max(0,Math.min(1,vv(d))),.02)); RR(sc.ctx); },
        ()=>{ if(tok!==run) return; sc.wD.setPos(world(sc.R,um(K.mustar),vv(K.dstar),.02));
          if(K.gap>1e-4){ rl.visible=true; anim=tween(800,u=>{ if(tok!==run) return; aimTube(sc.THREE,rl,ends[0],[ends[0][0],ends[0][1]+(ends[1][1]-ends[0][1])*Math.max(.001,u),ends[0][2]]); RR(sc.ctx); },
              ()=>{ if(tok!==run) return; flare(sc.ctx,ends[1],critHex(),900,1.4); if(chips) chips.set(`duality gap = <b>${F(K.gap,4)}</b> · the ridge peaks at d* = ${F(K.dstar,4)}, the floor is p* = ${F(K.pstar,4)}`,'weak duality holds (d* ≤ p*) — strong duality needs convexity'); if(h) camTo(h,VW('gap'),1200,done); else done(); }); }
          else { flare(sc.ctx,sc.wD.g.position.toArray(),hx4(),900,1.6); if(chips) chips.set(`duality gap = <b>0.0000</b> · the ridge reaches the beam`,'no gap here even without convexity — convexity is sufficient, not necessary'); if(h) camTo(h,VW('gap'),1200,done); else done(); } }); return; }
    /* bundle */
    const x0=dxl; if(h) camTo(h,{theta:1.05,phi:1.32,radius:4.3*NF()},1000); let crossed=false;
    anim=tween(3200,u=>{ if(tok!==run) return; const x=-1+6*u; if(!crossed&&x>=1){ crossed=true; if(sc) flare(sc.ctx,[BX(4),BY(4),BZ(1)],sc.hx('s3'),900,1.6); }
        dxl=Math.round(x*20)/20; setCtl('du-xl',dxl,2); drawBundle(); },
      ()=>{ if(tok!==run) return; if(h) camTo(h,VW('bundle'),1400,done); else setTimeout(done,1000); const xa=dxl; anim=tween(1000,u=>{ if(tok!==run) return; dxl=Math.round((xa+(1-xa)*u)*20)/20; setCtl('du-xl',dxl,2); drawBundle(); },()=>{ if(tok!==run) return; dxl=1; setCtl('du-xl',1,2); drawBundle(); if(sc) flare(sc.ctx,[BX(4),BY(4),BZ(1)],sc.hx('s4'),900,1.6); }); }); }
  const hx4=()=>sc.hx('s4');
  document.getElementById('du-play').addEventListener('click',play);
  bindCtl('du-x',v=>{ stop(); dx=v; if(tab==='two') drawTwo(); },v=>fmt(v,2))();
  bindCtl('du-mu',v=>{ stop(); dmu=v; if(tab==='two') drawTwo(); },v=>fmt(v,2))();
  bindCtl('du-xl',v=>{ stop(); dxl=v; if(tab==='bundle') drawBundle(); },v=>fmt(v,2))();
  caseBar.querySelectorAll('[data-c]').forEach(b=>b.addEventListener('click',()=>{ stop(); pressOnly(caseBar,b); cs=b.dataset.c; if(sc) buildScene(); drawGap(); }));
  tabs(document.getElementById('du-tabs'),t=>{ stop(); tab=t; if(sc){ sc.user=false; buildScene(); } draw(); });
  showTab(box.closest('.widget'),'two');
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
  /* the two numbers this unit quotes, computed once and logged so a verify script can read them back */
  (function(){ const a=facts('bands'), b=facts('wells');
    console.info('U11 duality gaps · bands: p* = '+a.pstar.toFixed(4)+', d* = '+a.dstar.toFixed(4)+' at µ* = '+a.mustar.toFixed(4)+', gap = '+a.gap.toFixed(4)+
      ' · wells: p* = '+b.pstar.toFixed(4)+', d* = '+b.dstar.toFixed(4)+' at µ* = '+b.mustar.toFixed(4)+', gap = '+b.gap.toFixed(4)); })();
})();

/* ================= W14 · WHAT A WALL IS WORTH (a wall on the bowl, and the value curve as its shadow on a glass panel) ================= */
(function(){
  const box=document.getElementById('pr-3d'),read=document.getElementById('pr-read'),verd=document.getElementById('pr-verdict');
  if(!box) return;
  const NF=()=>box.clientWidth<560?1.25:1;   /* a phone stage is narrow: every camera radius is scaled up */
  let c=3.00,anim=null,run=0,sc=null,ST=null,chips=null;
  const sol=cc=>cc<=2?{x:2,y:2,mu:0,p:8}:{x:cc,y:4-cc,mu:4*cc-8,p:cc*cc+(4-cc)*(4-cc)};
  const f=(x,y)=>x*x+y*y, SC=.65, ZS=1.25/38.72, R=2.2*SC, MX=x=>(x-2.2)*SC, MZ=y=>-(y-2.2)*SC, at=(x,y)=>[MX(x),f(x,y)*ZS,MZ(y)];
  const fs=(u,v)=>f(2.2+u/SC,2.2+v/SC);
  const C0=1.4,C1=3.8,P0=7.4,P1=13.2, uc=cc=>(cc-C0)/(C1-C0), vp=p=>(p-P0)/(P1-P0);
  const VIEW={theta:.66,phi:1.12,radius:5.4};
  const VW=()=>({theta:VIEW.theta,phi:VIEW.phi,radius:VIEW.radius*NF()});
  function build(){
    sc=null; const narrow=box.clientWidth<560; const r=VIEW.radius*NF(), look=[0,.5,0];
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:[look[0]+r*Math.sin(VIEW.theta)*Math.sin(VIEW.phi),look[1]+r*Math.cos(VIEW.phi),look[2]+r*Math.cos(VIEW.theta)*Math.sin(VIEW.phi)],look,fov:36},autoRotate:0,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const surf=CIN.prim.surface(ctx,fs,{x:[-R,R],y:[-R,R],res:70,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:.94}); lightenSurface(ctx,surf,ZS); root.add(surf);
        const base=new Float32Array(surf.userData.geo.attributes.color.array);
        const grid=CIN.prim.grid(ctx,5,20,hx('grid'),{opacity:isLight?.45:.3}); grid.position.y=-.12; root.add(grid);
        const lv=[]; for(let i=1;i<=10;i++) lv.push(40*Math.pow(i/10,1.8)); root.add(liftedContours(ctx,fs,lv,-R,R,-R,R,ZS,hx('ink2'),{N:64}));
        const rail=[]; for(let i=0;i<=48;i++){ const t=4*i/48, q=at(t,4-t); q[1]+=.012; rail.push(q); } root.add(polyTube(ctx,rail,hx('s7'),.016,false));
        const litG=new THREE.Group(); root.add(litG);
        const wall=wallPanel(ctx,{w:3.0,h:1.05,color:'s2'}); wall.g.children[0].material.opacity=isLight?.3:.4; [-1.5,1.5].forEach(z=>wall.g.add(tube(ctx,[0,-.12,z],[0,.93,z],hx('s2'),.014,.95))); wall.g.children[2].material.opacity=.9; wall.g.traverse(m=>{ if(m.material) m.userData.op=m.material.opacity; });
        const free=new THREE.Mesh(new THREE.TorusGeometry(.07,.011,10,32),new THREE.MeshStandardMaterial({color:hx('ink2'),emissive:hx('ink2'),emissiveIntensity:isLight?.1:.5})); free.rotation.x=-Math.PI/2; const fq=at(2,2); free.position.set(fq[0],fq[1]+.02,fq[2]); root.add(free);
        const bead=walkerChar(ctx,hx('s4'),.06); const tail=cometTail(ctx,hx('s4'));
        const panel=glassPanel(ctx,{w:2.7,h:1.15,pos:[-1.45,.95,-2.03],yaw:.62,color:'s1'});
        const pts=[]; for(let i=0;i<=80;i++){ const cc=C0+(C1-C0)*i/80; pts.push([uc(cc),vp(sol(cc).p)]); } panel.curve(pts,hx('s1'),.013);
        const L=.42; panel.curve([[uc(3-L),vp(10-4*L)],[uc(3+L),vp(10+4*L)]],hx('s3'),.011);
        panel.g.add(tube(ctx,panel.toLocal(uc(2),0),panel.toLocal(uc(2),1),hx('ink2'),.005,.45));
        panel.text('p*(c) — what the problem costs',.5,.92,{size:18,color:colors.ink2}); panel.text('slope µ* = 4',uc(3.42)+.13,vp(10+4*L)+.02,{size:16,color:colors.s3});
        const pa=panel.bead(uc(3),vp(10),hx('s4'),.036), pp=panel.bead(uc(3),vp(10),hx('s3'),.03); const tick=tube(ctx,[0,0,0],[0,1,0],critHex(),.012); overlay(tick,12); panel.g.add(tick);
        root.add(CIN.prim.label(ctx,'free answer (2, 2)',[fq[0]+.05,fq[1]+.22,fq[2]+.1],{size:15,color:colors.muted,bg:false,depthTest:false}));
        const wlab=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,surf,base,litG,wall,bead,tail,panel,pa,pp,tick,wlab,handle:null,theta0:VIEW.theta,story:false,user:false};
        chips=hudPair(box); hint(box,'drag to orbit');
        paint();
      },
      update(ctx,t){ if(!sc||!sc.handle||sc.story||sc.user||RM) return false; const o=sc.handle.ctx.orbit; o.sph.theta=sc.theta0+.18*Math.sin(t*.4); o.place(); return true; }
    });
    if(handle){ grab(handle,()=>{ if(sc) sc.user=true; return false; },()=>{}); if(sc) sc.handle=handle; }
    return handle;
  }
  const resume=()=>{ if(!sc||!sc.handle) return; sc.theta0=sc.handle.ctx.orbit.sph.theta-.18*Math.sin(performance.now()/1000*.4); sc.story=false; };
  /* the wall stands at c; the surface behind it goes dark; the bead sits in the corner where the rail meets the wall; the shadow curve at the back reads the price */
  function paint(cur){ if(!sc) return; const cc=cur==null?c:cur, S=sol(cc), {THREE,ctx,hx,surf,base,litG,wall,bead,tail,panel,pa,pp,tick,wlab,colors}=sc, touching=cc>2+1e-9;
    wall.setX(MX(cc)); const k=touching?1:.3; wall.g.traverse(m=>{ if(m.material&&m.userData.op!=null) m.material.opacity=m.userData.op*k; });
    const geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color, dark=sc.isLight?new THREE.Color(hx('s2')).convertSRGBToLinear():new THREE.Color(0,0,0), kd=(sc.isLight?.3:.7)*k;
    for(let i=0;i<pos.count;i++){ const x=2.2+pos.getX(i)/SC; if(x<cc){ col.setXYZ(i,base[3*i]+(dark.r-base[3*i])*kd,base[3*i+1]+(dark.g-base[3*i+1])*kd,base[3*i+2]+(dark.b-base[3*i+2])*kd); } else col.setXYZ(i,base[3*i],base[3*i+1],base[3*i+2]); } col.needsUpdate=true;
    clearGroup(litG); const lit=[]; const x0=Math.max(0,Math.min(4,cc)); for(let i=0;i<=24;i++){ const t=x0+(4-x0)*i/24, q=at(t,4-t); q[1]+=.016; lit.push(q); } if(lit.length>1) litG.add(polyTube(ctx,lit,hx('s3'),.024,false));
    const q=at(S.x,S.y); bead.setPos([q[0],q[1]+.03,q[2]]); if(sc.tailFrom){ tail.set(sc.tailFrom,[q[0],q[1]+.03,q[2]]); } else tail.clear();
    wlab.set('wall at c = '+F(cc,2),[MX(cc),1.08,-1.35],{size:16,color:colors.s2,bg:true,depthTest:false});
    const cv=Math.max(C0,Math.min(C1,cc)), pred=10+4*(cc-3); const A=panel.toLocal(uc(cv),vp(S.p)), P=panel.toLocal(uc(cv),vp(Math.max(P0,Math.min(P1,pred))));
    pa.position.set(A[0],A[1],A[2]+.02); pp.position.set(P[0],P[1],P[2]+.025); pp.visible=Math.abs(cc-3)>1e-9; tick.visible=Math.abs(cc-3)>1e-9&&Math.abs(S.p-pred)>1e-4;
    if(tick.visible){ const L=Math.max(.035,Math.abs(A[1]-P[1])), sgn=A[1]>=P[1]?1:-1; aimTube(THREE,tick,[P[0],P[1],P[2]+.02],[P[0],P[1]+sgn*L,P[2]+.02]); }
    if(chips) chips.set(`c = <b>${F(cc,2)}</b> · µ* = <b>${F(S.mu,2)}</b> · p* = <b>${F(S.p,2)}</b>`,touching?(Math.abs(cc-3)>1e-9?`predicted 10 + 4·Δc = <b>${F(pred,2)}</b> · actual <b>${F(S.p,2)}</b> · error <b>${F(Math.abs(S.p-pred),2)}</b>`:'the wall is pressed against you · its price is the slope of the shadow curve'):'the wall is not touching you · µ* = 0');
    RR(ctx); }
  function draw(){ const S=sol(c), pred=10+4*(c-3);
    read.innerHTML='c = <b>'+F(c,2)+'</b> → x* = <b>'+F(S.x,2)+'</b>, y* = <b>'+F(S.y,2)+'</b>, µ* = <b>'+F(S.mu,2)+'</b>, p* = <b>'+F(S.p,2)+'</b><br>'+
      'predicted by the price:  10 + 4·Δc = <b>'+F(pred,2)+'</b>   ·   actually: <b>'+F(S.p,2)+'</b>   ·   error <b>'+F(Math.abs(S.p-pred),2)+'</b><br>'+
      'at c = 3.00 the answer is (3, 1) with µ* = 4 and p* = 10';
    if(c<=2+1e-9){ verd.className='verdict info'; verd.textContent='info — the wall is behind the free answer: µ* = 0 and the value curve is flat. The price of a wall you are not touching is nothing.'; }
    else { verd.className='verdict good'; verd.textContent='good — the multiplier told you the change before you re-solved anything'; }
    paint(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc){ sc.tailFrom=null; sc.tail.clear(); if(sc.story) resume(); } }
  const setC=v=>{ c=Math.round(v*100)/100; setCtl('pr-c',c,x=>fmt(x,2)); draw(); };
  /* ▶: nudge the wall to 2.9 while the camera turns to the shadow curve, let it go to 2 (the wall dims, the bead returns to the free answer), then push it back to 3 */
  function play(){ stop(); const tok=run; const h=sc&&sc.handle; if(sc) sc.story=true;
    if(RM){ setC(2.9); if(sc) sc.story=false; return; }
    const seg=(a,b,dur,then)=>{ if(sc){ const S=sol(a), q=at(S.x,S.y); sc.tailFrom=[q[0],q[1]+.03,q[2]]; } anim=tween(dur,u=>{ if(tok!==run) return; setC(a+(b-a)*u); },()=>{ if(tok!==run) return; setC(b); if(sc) sc.tailFrom=null; then&&then(); }); };
    const pause=(ms,then)=>setTimeout(()=>{ if(tok===run) then(); },ms);
    if(h) camTo(h,{theta:.66,phi:1.0,radius:5.0*NF()},1400);
    seg(3,2.9,1300,()=>pause(500,()=>seg(2.9,2,1400,()=>{ if(sc) flare(sc.ctx,at(2,2).map((v,i)=>i===1?v+.05:v),sc.hx('s3'),900,1.6);
      pause(600,()=>{ if(h) camTo(h,VW(),1500,()=>{ if(tok===run) resume(); }); seg(2,3,1400,()=>{ if(sc) flare(sc.ctx,at(3,1).map((v,i)=>i===1?v+.05:v),sc.hx('s4'),900,1.6); if(!h&&sc) sc.story=false; }); }); }))); }
  document.getElementById('pr-play').addEventListener('click',play);
  const preBar=document.getElementById('pr-pre');
  [['pr-p-base',3.00],['pr-p-near',2.90],['pr-p-free',2.00]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{ pressOnly(preBar,e.currentTarget); stop(); setC(v); }));
  bindCtl('pr-c',v=>{ stop(); c=v; pressOnly(preBar,null); draw(); },v=>fmt(v,2))();
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W15 · TWO POINTS AND A LINE (a margin road between two pylons, lanterns for the points, a beam for the boundary) ================= */
(function(){
  const box=document.getElementById('sv-3d'),read=document.getElementById('sv-read'),verd=document.getElementById('sv-verdict');
  if(!box) return;
  const NF=()=>box.clientWidth<560?1.4:1;   /* a phone stage is narrow: every camera radius is scaled up */
  let tab='ans',wv=1,av=0.5,x3=3,run=0,anim=null,sc=null,ST=null,chips=null,drag=false,prevB=null,wasStar=false,wasSV=false;
  /* hard margin with x₁ = +1 (class +1), x₂ = −1 (class −1) and a third point x₃ (class +1).
     For x₃ ≥ 1 the binding pair is (+1, −1): w = 1, b = 0, α₁ = α₂ = ½, α₃ = 0.
     For x₃ < 1 the binding pair is (x₃, −1):  w = 2/(x₃+1),  b = −w(x₃−1)/2 = (1−x₃)/(1+x₃),  α₂ = α₃ = 2/(x₃+1)², α₁ = 0. */
  function svm3(x){ if(x>=1) return {w:1,b:0,a:[0.5,0.5,0],sv:[true,true,false]};
    const w=2/(x+1), b=-w*(x-1)/2, al=2/((x+1)*(x+1));
    return {w,b,a:[0,al,al],sv:[false,true,true]}; }
  const q=a=>2*a-2*a*a;
  const FY=-.12, LH=1.25, SCL=.7, MX=x=>x*SCL, CL=x=>Math.max(-2.6,Math.min(3.0,x));
  const VIEW={theta:.2,phi:1.12,radius:5.4};
  const VW=()=>({theta:VIEW.theta,phi:VIEW.phi,radius:VIEW.radius*NF()});
  /* what the road looks like on each tab: slope w, offset b, the third lantern, which lanterns are lit */
  function model(){ if(tab==='ans') return {w:wv,b:0,x3:null,sv:[true,true],a:null};
    if(tab==='dual') return {w:2*av,b:0,x3:null,sv:[true,true],a:av};
    const S=svm3(x3); return {w:S.w,b:S.b,x3,sv:S.sv,a:S.a,S}; }
  function lampColor(l,hex){ l.g.traverse(m=>{ if(m.isPointLight) m.color.setHex(hex); else if(m.isSprite&&m.material) m.material.color.setHex(hex); else if(m.material&&m.material.emissive&&m.geometry&&m.geometry.type==='SphereGeometry'){ m.material.color.setHex(hex); m.material.emissive.setHex(hex); } }); }
  function mkLamp(ctx,hex,x){ const l=lampChar(ctx,hex,[MX(x),FY+LH,0]); l.g.rotation.x=Math.PI; l.g.traverse(m=>{ if(m.material&&m.material.emissive&&m.geometry&&m.geometry.type==='SphereGeometry'){ m.material.transparent=true; l.bulb=m; } }); l.g.add(tube(ctx,[0,.05,0],[0,LH,0],hxOf(ctx)('ink2'),.016,.85)); return l; }
  function build(){
    sc=null; const narrow=box.clientWidth<560; const r=VIEW.radius*NF(), look=[narrow?.5:0,.4,0];
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:[look[0]+r*Math.sin(VIEW.theta)*Math.sin(VIEW.phi),look[1]+r*Math.cos(VIEW.phi),look[2]+r*Math.cos(VIEW.theta)*Math.sin(VIEW.phi)],look,fov:36},autoRotate:0,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const grid=CIN.prim.grid(ctx,6,24,hx('grid'),{opacity:isLight?.45:.3}); grid.position.y=FY; root.add(grid);
        const slab=new THREE.Mesh(new THREE.PlaneGeometry(6,3.2),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.3:.5})); slab.rotation.x=-Math.PI/2; slab.position.y=FY-.005; root.add(slab);
        /* the number line */
        root.add(tube(ctx,[MX(-3),FY+.004,0],[MX(5),FY+.004,0],hx('ink2'),.008,.7)); for(let i=-2;i<=4;i++) root.add(tube(ctx,[MX(i),FY,.07],[MX(i),FY,-.07],hx('ink2'),.006,.7));
        /* the road, its kerbs and pylons */
        const road=new THREE.Mesh(new THREE.PlaneGeometry(1,1.3),new THREE.MeshBasicMaterial({color:hx('s3'),transparent:true,opacity:isLight?.18:.2,depthWrite:false,side:THREE.DoubleSide})); road.rotation.x=-Math.PI/2; road.position.y=FY+.002; root.add(road);
        const kerb=[tube(ctx,[0,0,0],[0,1,0],hx('s7'),.014,.9),tube(ctx,[0,0,0],[0,1,0],hx('s7'),.014,.9)]; kerb.forEach(k=>root.add(k));
        const pyl=[0,1].map(()=>{ const g=new THREE.Group(); root.add(g); g.add(tube(ctx,[0,FY,0],[0,FY+.82,0],hx('s7'),.035,1)); const top=overlay(CIN.prim.dot(ctx,[0,FY+.85,0],hx('s7'),.05),12); g.add(top); const h=haloSprite(ctx,hx('s7'),.55); h.position.y=FY+.85; g.add(h); return g; });
        /* the boundary beam */
        const beam=new THREE.Group(); root.add(beam); const pane=CIN.prim.glass(ctx,1.3,.9,hx('s4'),isLight?.2:.22); pane.rotation.y=Math.PI/2; pane.position.y=FY+.45; beam.add(pane);
        beam.add(tube(ctx,[0,FY,0],[0,FY+.9,0],hx('s4'),.014,1)); const bh=haloSprite(ctx,hx('s4'),.5); bh.position.y=FY+.9; beam.add(bh);
        /* the lanterns */
        const l1=mkLamp(ctx,hx('s3'),1), l2=mkLamp(ctx,hx('s2'),-1), l3=mkLamp(ctx,hx('s3'),3);
        const blab=slot(ctx,root), mlab=slot(ctx,root), tlab=slot(ctx,root), clab=[slot(ctx,root),slot(ctx,root)];
        /* the dual panel */
        const panel=glassPanel(ctx,{w:2.2,h:1.0,pos:[1.2,1.2,-2.0],color:'s3'}); const A0=0,A1=1.2,Q0=-.5,Q1=.62, ua=a=>(a-A0)/(A1-A0), vq=v=>(v-Q0)/(Q1-Q0);
        const pts=[]; for(let i=0;i<=80;i++){ const a=A1*i/80; pts.push([ua(a),vq(q(a))]); } panel.curve(pts,hx('s3'),.012); panel.hline(vq(0),hx('ink2'),true);
        panel.bead(ua(.5),vq(.5),hx('s4'),.034); panel.text('q(α) = 2α − 2α² · peak at α* = 0.5',.5,.12,{size:17,color:colors.ink2});
        const pb=panel.bead(ua(.5),vq(.5),hx('s2'),.03);
        const dragPlane=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})); dragPlane.rotation.x=-Math.PI/2; dragPlane.position.y=FY+LH; root.add(dragPlane);
        sc={THREE,ctx,root,colors,isLight,hx,road,kerb,pyl,beam,l1,l2,l3,blab,mlab,tlab,clab,panel,pb,ua,vq,dragPlane,handle:null,theta0:VIEW.theta,story:false,user:false};
        chips=hudPair(box); hint(box,'drag to orbit');
        prevB=null; wasStar=false; wasSV=false; paint();
      },
      update(ctx,t){ if(sc) mirror(); if(!sc||!sc.handle||sc.story||sc.user||RM) return false; const o=sc.handle.ctx.orbit; o.sph.theta=sc.theta0+.2*Math.sin(t*.4); o.place(); return true; }
    });
    if(handle&&sc){ sc.handle=handle; const pick=picker(handle,()=>sc.dragPlane);
      grab(handle,e=>{ if(!sc) return false; sc.user=true; if(tab!=='add') return false; const {THREE,ctx}=sc, r=ctx.renderer.domElement.getBoundingClientRect(), v=new THREE.Vector3().copy(sc.l3.g.position).project(ctx.camera);
          if(Math.hypot((v.x+1)/2*r.width-(e.clientX-r.left),(1-v.y)/2*r.height-(e.clientY-r.top))>44) return false; stop(); drag=true; return true; },
        e=>{ if(!drag) return; const h=pick(e); if(!h) return; x3=Math.max(0,Math.min(4,Math.round((h.x/SCL)*20)/20)); setCtl('sv-x3',x3,v=>fmt(v,2)); draw(); },
        ()=>{ drag=false; }); }
    return handle;
  }
  const resume=()=>{ if(!sc||!sc.handle) return; sc.theta0=sc.handle.ctx.orbit.sph.theta-.2*Math.sin(performance.now()/1000*.4); sc.story=false; };
  function mirror(){ const {THREE,ctx,l3}=sc, v=new THREE.Vector3().copy(l3.g.position).project(ctx.camera); box.dataset.x3=JSON.stringify([+((v.x+1)/2).toFixed(3),+((1-v.y)/2).toFixed(3)]); }
  function paint(){ if(!sc) return; const M=model(), {THREE,ctx,hx,road,kerb,pyl,beam,l1,l2,l3,blab,mlab,tlab,clab,panel,pb,ua,vq,colors}=sc;
    /* the class labels stand over the lanterns, except on the dual tab where the panel needs the sky: there they sit on the floor in front */
    clab[0].set('x = +1 · class +1',tab==='dual'?[MX(1),FY+.02,.62]:[MX(1),FY+LH+.3,0],{size:15,color:colors.s3,bg:true,depthTest:false});
    clab[1].set('x = −1 · class −1',tab==='dual'?[MX(-1),FY+.02,.62]:[MX(-1),FY+LH+.3,0],{size:15,color:colors.s2,bg:true,depthTest:false});
    const w=M.w, b=M.b, wide=w<1e-6, e1=wide?1e9:(1-b)/w, e2=wide?-1e9:(-1-b)/w, bnd=wide?0:-b/w, lo=CL(MX(Math.min(e1,e2))), hi=CL(MX(Math.max(e1,e2)));
    road.position.x=(lo+hi)/2; road.scale.x=Math.max(.001,hi-lo); road.material.opacity=(sc.isLight?.18:.2)*(wide?.45:1);
    aimTube(THREE,kerb[0],[lo,FY+.006,-.65],[lo,FY+.006,.65]); aimTube(THREE,kerb[1],[hi,FY+.006,-.65],[hi,FY+.006,.65]);
    pyl[0].position.set(lo,0,-.62); pyl[1].position.set(hi,0,-.62); pyl.forEach(p=>{ p.visible=!wide; });
    beam.position.x=MX(bnd); beam.visible=!wide; if(prevB!=null&&Math.abs(prevB-bnd)>.08&&!wide){ flare(ctx,[MX(bnd),FY+.9,0],hx('s4'),500,.9); prevB=bnd; } if(prevB==null&&!wide) prevB=bnd;
    blab.set(wide||tab!=='ans'?'':'boundary  w·x + b = 0',[MX(bnd),FY+1.15,0],{size:15,color:colors.s4,bg:true,depthTest:false}); if(wide||tab!=='ans') blab.hide();
    const gap=wide?Infinity:2/Math.abs(w); mlab.set('margin 2/|w| = '+(isFinite(gap)?F(gap,3):'∞'),[(lo+hi)/2,FY+.04,1.0],{size:16,color:colors.s3,bg:true,depthTest:false});
    /* the lanterns: lit when they clear the road, red when the pylons have passed them */
    const ok1=w*1+b>=1-1e-9, ok2=-(w*-1+b)>=1-1e-9; const s3=hx('s3'), s2=hx('s2'), cr=critHex();
    lampColor(l1,ok1?s3:cr); l1.set(ok1?1:.6); lampColor(l2,ok2?s2:cr); l2.set(ok2?1:.6);
    if(tab==='add'){ l3.g.visible=true; l3.g.position.x=MX(M.x3); const sv=M.sv[2]; lampColor(l3,s3); l3.set(sv?1:.1); if(l3.bulb) l3.bulb.material.opacity=sv?1:.35;
      tlab.set(sv?'x₃ = '+F(M.x3,2)+' · support vector · α₃ = '+F(M.a[2],4):'x₃ = '+F(M.x3,2)+' · α₃ = 0 · delete it and nothing changes',[Math.max(-1.0,Math.min(1.0,MX(M.x3))),FY+.03,-1.05],{size:15,color:sv?colors.s3:colors.muted,bg:true,depthTest:false});
      if(sv&&!wasSV) flare(ctx,[MX(M.x3),FY+LH,0],s3,900,1.6); wasSV=sv; }
    else { l3.g.visible=false; tlab.hide(); wasSV=false; }
    panel.show(tab==='dual'); if(tab==='dual'){ const P=panel.toLocal(ua(av),vq(q(Math.min(1.2,av)))); pb.position.set(P[0],P[1],P[2]+.02); const star=Math.abs(av-.5)<1e-9; if(star&&!wasStar){ flare(ctx,[MX(1),FY+.85,-.62],hx('s7'),900,1.4); flare(ctx,[MX(-1),FY+.85,-.62],hx('s7'),900,1.4); } wasStar=star; }
    if(chips){ if(tab==='ans') chips.set(`w = <b>${F(w,2)}</b> · margin 2/|w| = <b>${F(gap,3)}</b> · constraints <b>${ok1&&ok2?'satisfied':'violated'}</b>`,ok1&&ok2?(Math.abs(w-1)<1e-9?'the pylons touch the lanterns: the widest road that clears both':'legal, but the road is narrower than it needs to be'):'the pylons have passed the lanterns — not allowed');
      else if(tab==='dual') chips.set(`α = <b>${F(av,3)}</b> → w = 2α = <b>${F(w,3)}</b> · q(α) = <b>${F(q(av),4)}</b>`,Math.abs(av-.5)<1e-9?'the dual peak builds exactly the primal road: w* = 1':'the road is built out of the multiplier — the pylons slide as α moves');
      else chips.set(`x₃ = <b>${F(M.x3,2)}</b> · α₃ = <b>${F(M.a[2],4)}</b> · boundary x = <b>${F(bnd,3)}</b>`,M.sv[2]?'x₃ is now a support vector — the whole road moved':'outside the pylons the third lantern carries no weight'); }
    mirror(); RR(ctx); }
  function drawAns(){ const w=wv, b=0, ok1=w*1+b>=1-1e-9, ok2=-(w*-1+b)>=1-1e-9, gap=2/Math.abs(w);
    read.innerHTML='margin = <b>'+F(gap,4)+'</b>  ·  constraints: <b>'+(ok1&&ok2?'satisfied':'violated')+'</b>  ·  ½w² = <b>'+F(0.5*w*w,4)+'</b><br>'+
      'at the answer: w* = <b>1</b>, b* = <b>0</b>, α₁ = α₂ = <b>0.5</b>, margin = <b>2</b>';
    if(!(ok1&&ok2)){ verd.className='verdict bad'; verd.textContent='bad — w < 1: the gap is wider, but the points are now inside the margin. Not allowed.'; }
    else if(Math.abs(w-1)<1e-9){ verd.className='verdict good'; verd.textContent='good — w = 1 is the smallest w that still clears both constraints: widest margin = smallest ½w²'; }
    else { verd.className='verdict info'; verd.textContent='info — legal, but ½w² = '+F(0.5*w*w,3)+' is bigger than it needs to be: the margin is narrower than 2'; } paint(); }
  function drawDual(){ const a=Math.max(0,Math.min(1.2,av));
    read.innerHTML='α = <b>'+F(a,3)+'</b> → w = <b>'+F(2*a,3)+'</b> → ½w² = <b>'+F(2*a*a,4)+'</b> · q(α) = <b>'+F(q(a),4)+'</b><br>'+
      'at the peak: α* = <b>0.5</b>, w* = <b>1</b>, d* = <b>0.5</b> = p*';
    if(Math.abs(a-0.5)<1e-9){ verd.className='verdict good'; verd.textContent='good — the dual peak α* = 0.5 builds exactly the primal answer w* = 1, and d* = 0.5 = p*'; }
    else { verd.className='verdict info'; verd.textContent='info — q(α) = '+F(q(a),4)+' is below the peak 0.5: any α gives a lower bound, only α* gives the answer'; } paint(); }
  function drawAdd(){ const S=svm3(x3), bnd=-S.b/S.w, nsv=S.sv.filter(Boolean).length;
    read.innerHTML='α₃ = <b>'+F(S.a[2],4)+'</b> · support vectors: <b>'+nsv+'</b> of 3 · boundary x = <b>'+F(bnd,4)+'</b> · margin = <b>'+F(2/S.w,4)+'</b><br>'+
      'w = <b>'+F(S.w,4)+'</b>, b = <b>'+F(S.b,4)+'</b>'+(x3<1?'  — once x₃ < 1: w = 2/(x₃+1), b = −w(x₃−1)/2':'  (unchanged: x₃ carries no weight)')+'<br>'+
      'at x₃ = 3: α₃ = <b>0</b> · at x₃ = 0.5: w = <b>1.3333</b>, b = <b>0.3333</b>, α₂ = α₃ = <b>0.8889</b>';
    if(S.sv[2]){ verd.className='verdict good'; verd.textContent='good — complementary slackness is why an SVM is sparse: only the points whose constraint is tight carry the answer'; }
    else { verd.className='verdict good'; verd.textContent='good — α₃ = 0: the point is outside the margin, so it pays nothing and changes nothing'; } paint(); }
  function draw(){ showTab(box.closest('.widget'),tab); if(tab==='ans') drawAns(); else if(tab==='dual') drawDual(); else drawAdd(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.story) resume(); }
  /* ▶ stories: the road widens until the pylons touch the lanterns, then passes them · the road is built from α · the third lantern slides in and lights up */
  function play(){ stop(); const tok=run; const h=sc&&sc.handle; if(sc) sc.story=true;
    const done=()=>{ if(tok===run) resume(); };
    const seg=(get,set,a,b,dur,dec,then)=>{ anim=tween(dur,u=>{ if(tok!==run) return; set(Math.round((a+(b-a)*u)*dec)/dec); },()=>{ if(tok!==run) return; set(b); then&&then(); }); };
    const pause=(ms,then)=>setTimeout(()=>{ if(tok===run) then(); },ms);
    if(tab==='ans'){ const setW=v=>{ wv=v; setCtl('sv-w',v,x=>fmt(x,2)); drawAns(); };
      if(RM){ setW(1); done(); return; } if(h) camTo(h,{theta:1.25,phi:1.35,radius:4.4*NF()},1000);
      seg(null,setW,3,1,1800,100,()=>{ if(sc) flare(sc.ctx,[MX(1),FY+.85,-.62],sc.hx('s7'),900,1.5); pause(500,()=>seg(null,setW,1,.6,1000,100,()=>{ if(sc){ sparks(sc.ctx,[MX(1),FY+LH,0],critHex(),9,700); sparks(sc.ctx,[MX(-1),FY+LH,0],critHex(),9,700); }
        pause(700,()=>{ if(h) camTo(h,VW(),1300,done); seg(null,setW,.6,1,1000,100,()=>{ if(sc) flare(sc.ctx,[MX(-1),FY+.85,-.62],sc.hx('s7'),900,1.5); if(!h) done(); }); }); })); }); return; }
    if(tab==='dual'){ const setA=v=>{ av=v; setCtl('sv-a',v,x=>fmt(x,3)); drawDual(); };
      if(RM){ setA(.5); done(); return; } if(h) camTo(h,{theta:.05,phi:1.2,radius:5.0*NF()},1000);
      seg(null,setA,0,.5,2200,200,()=>pause(600,()=>seg(null,setA,.5,.8,900,200,()=>pause(400,()=>{ if(h) camTo(h,VW(),1200,done); seg(null,setA,.8,.5,900,200,h?null:done); })))); return; }
    const setX=v=>{ x3=v; setCtl('sv-x3',v,x=>fmt(x,2)); drawAdd(); };
    if(RM){ setX(.5); done(); return; } if(h) camTo(h,{theta:.6,phi:1.25,radius:4.6*NF()},1000);
    seg(null,setX,3,.5,2400,20,()=>pause(700,()=>{ if(h) camTo(h,VW(),1600,done); seg(null,setX,.5,3,1600,20,h?null:done); })); }
  document.getElementById('sv-play').addEventListener('click',play);
  bindCtl('sv-w',v=>{ stop(); wv=v; if(tab==='ans') drawAns(); },v=>fmt(v,2))();
  bindCtl('sv-a',v=>{ stop(); av=v; if(tab==='dual') drawDual(); },v=>fmt(v,3))();
  bindCtl('sv-x3',v=>{ stop(); x3=v; if(tab==='add') drawAdd(); },v=>fmt(v,2))();
  tabs(document.getElementById('sv-tabs'),t=>{ stop(); tab=t; prevB=null; if(sc&&sc.handle){ sc.user=false; sc.story=true; camTo(sc.handle,VW(),800,resume); } draw(); });
  showTab(box.closest('.widget'),'ans');
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
  /* self-check: the shifted hard-margin solution */
  (function(){ const s=svm3(0.5); if(Math.abs(s.w-4/3)>1e-9||Math.abs(s.b-1/3)>1e-9||Math.abs(s.a[2]-8/9)>1e-9) console.warn('W15: shifted SVM solution unexpected',s);
    console.info('U11 shifted SVM at x₃ = 0.5: w = '+s.w.toFixed(4)+', b = '+s.b.toFixed(4)+', α₂ = α₃ = '+s.a[2].toFixed(4)+', boundary x = '+(-s.b/s.w).toFixed(4)+', margin = '+(2/s.w).toFixed(4)); })();
})();
