/* ================= UNIT 10 · local helpers (on top of the house runtime) ================= */
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
/* ---- new in Unit 10 ---- */
const lerp=(a,b,u)=>a+(b-a)*u;
/* rewrite a prim.surface in place (position + colour + normals) — the live morph primitive; the mesh is never re-created */
function reshape(ctx,surf,fs,zs,ramp,gamma){ const T=ctx.THREE, geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color, n=pos.count;
  const zv=surf.userData.zv||(surf.userData.zv=new Float32Array(n)); let zmin=Infinity,zmax=-Infinity;
  for(let i=0;i<n;i++){ const z=fs(pos.getX(i),-pos.getZ(i)); zv[i]=z; if(z<zmin) zmin=z; if(z>zmax) zmax=z; }
  const c=ctx.colors, a=ramp||[c.s1,c.s7,c.s2], key=a.join('|')+(ctx.isLight?'L':'D');
  if(!surf.userData.lut||surf.userData.lutKey!==key){ const white=new T.Color(1,1,1), lut=[]; for(let k=0;k<64;k++){ const K=new T.Color(CIN.ramp(k/63,a[0],a[1],a[2])); if(ctx.isLight) K.lerp(white,.42); lut.push(K.convertSRGBToLinear()); } surf.userData.lut=lut; surf.userData.lutKey=key; }
  const lut=surf.userData.lut, span=(zmax-zmin)||1;
  for(let i=0;i<n;i++){ pos.setY(i,zv[i]*zs); const K=lut[Math.max(0,Math.min(63,Math.round(Math.pow((zv[i]-zmin)/span,gamma||1)*63)))]; col.setXYZ(i,K.r,K.g,K.b); }
  pos.needsUpdate=true; col.needsUpdate=true; geo.computeVertexNormals(); surf.userData.zmin=zmin; surf.userData.zmax=zmax; surf.userData.mesh.frustumCulled=false; return {zmin,zmax}; }
/* an SVG dial: an arc from −135° to +135°, ticks, a needle, an optional target mark; value v ∈ [lo,hi] */
function dial(parent,cx,cy,r,lo,hi,v,opts){ opts=opts||{}; const g=el('g',{},parent); const A0=-135,A1=135, ang=u=>(A0+(A1-A0)*Math.max(0,Math.min(1,u)))*Math.PI/180;
  const pt=(a,rr)=>[cx+rr*Math.sin(a),cy-rr*Math.cos(a)];
  const arc=(a0,a1,rr)=>{ const [x0,y0]=pt(a0,rr),[x1,y1]=pt(a1,rr); return `M${x0.toFixed(1)},${y0.toFixed(1)}A${rr},${rr} 0 ${(a1-a0)>Math.PI?1:0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`; };
  el('path',{d:arc(ang(0),ang(1),r),stroke:'var(--line, var(--ring))','stroke-width':opts.track||6,fill:'none','stroke-linecap':'round',opacity:.9},g);
  const u=(v-lo)/((hi-lo)||1);
  const u0=opts.zero==null?0:(opts.zero-lo)/((hi-lo)||1); if(Math.abs(u-u0)>0.005) el('path',{d:arc(ang(Math.min(u,u0)),ang(Math.max(u,u0)),r),stroke:opts.color||'var(--s4)','stroke-width':opts.track||6,fill:'none','stroke-linecap':'round',opacity:.55,filter:opts.glow||'none'},g);
  const nt=opts.ticks==null?5:opts.ticks; for(let i=0;i<=nt;i++){ const a=ang(i/nt),[x0,y0]=pt(a,r+5),[x1,y1]=pt(a,r+9); el('line',{x1:x0,y1:y0,x2:x1,y2:y1,stroke:'var(--ink-muted)','stroke-width':1},g); if(opts.tickLab){ const [tx,ty]=pt(a,r+18); txt(g,tx,ty+3.5,opts.tickLab(lo+(hi-lo)*i/nt),'font:500 9px system-ui;fill:var(--ink-muted)','middle'); } }
  if(opts.mark!=null){ const um=(opts.mark-lo)/((hi-lo)||1), a=ang(um), [x0,y0]=pt(a,r-9),[x1,y1]=pt(a,r+9); el('line',{x1:x0,y1:y0,x2:x1,y2:y1,stroke:opts.markColor||'var(--s3)','stroke-width':3,'stroke-linecap':'round'},g); }
  const a=ang(u),[nx,ny]=pt(a,r-4); el('line',{x1:cx,y1:cy,x2:nx,y2:ny,stroke:opts.color||'var(--s4)','stroke-width':3,'stroke-linecap':'round',filter:opts.glow||'none'},g);
  el('circle',{cx,cy,r:4,fill:opts.color||'var(--s4)'},g);
  if(opts.label) txt(g,cx,cy+r+(opts.tickLab?30:16),opts.label,opts.labelStyle||'font:700 11px system-ui;fill:var(--ink-2)','middle');
  if(opts.value!=null) txt(g,cx,cy+r*.45,opts.value,'font:700 11px system-ui;fill:'+(opts.color||'var(--s4)'),'middle');
  return g; }
/* ---- the guns-and-butter problem shared by the hero and W10: blended columns z_j(t), Hessian, minimiser, window ---- */
const GB=(function(){
  const X1=[0.1,0.8,0.4], X2=[25,10,10], Y=[7,1,4], n=3;
  const mean=a=>a.reduce((s,v)=>s+v,0)/a.length, sd=a=>{ const m=mean(a); return Math.sqrt(mean(a.map(v=>(v-m)*(v-m)))); };
  const m1=mean(X1),s1=sd(X1),m2=mean(X2),s2=sd(X2),ym=mean(Y), mn1=Math.min(...X1),mx1=Math.max(...X1),mn2=Math.min(...X2),mx2=Math.max(...X2);
  /* the whitening map of the standardised columns: rotate by the eigenvectors of their covariance, divide by √(n λ) so ZᵀZ = I */
  const zs1=X1.map(v=>(v-m1)/s1), zs2=X2.map(v=>(v-m2)/s2);
  const C=[mean(zs1.map(v=>v*v)),mean(zs1.map((v,i)=>v*zs2[i])),mean(zs2.map(v=>v*v))], E=eig2(C[0],C[1],C[2]);
  let v1=E.v1.slice(); if(v1[0]<0) v1=[-v1[0],-v1[1]]; const v2=[-v1[1],v1[0]];
  const WM=[[v1[0]/Math.sqrt(n*E.l1),v2[0]/Math.sqrt(n*E.l2)],[v1[1]/Math.sqrt(n*E.l1),v2[1]/Math.sqrt(n*E.l2)]];   /* z' = z · WM */
  function cols(t,scheme){ const yt=Y.map(v=>v-t*ym); let z1,z2;
    if(scheme==='minmax'){ z1=X1.map(v=>(v-t*mn1)/Math.pow(mx1-mn1,t)); z2=X2.map(v=>(v-t*mn2)/Math.pow(mx2-mn2,t)); }
    else { z1=X1.map(v=>(v-t*m1)/Math.pow(s1,t)); z2=X2.map(v=>(v-t*m2)/Math.pow(s2,t));
      if(scheme==='whiten'){ const M=[[1+t*(WM[0][0]-1),t*WM[0][1]],[t*WM[1][0],1+t*(WM[1][1]-1)]]; const a=z1.map((v,i)=>v*M[0][0]+z2[i]*M[1][0]), b=z1.map((v,i)=>v*M[0][1]+z2[i]*M[1][1]); z1=a; z2=b; } }
    return {z1,z2,y:yt}; }
  function problem(t,scheme){ scheme=scheme||'standardise'; const {z1,z2,y}=cols(t,scheme);
    const H=[[2*z1.reduce((s,v)=>s+v*v,0),2*z1.reduce((s,v,i)=>s+v*z2[i],0)],[0,2*z2.reduce((s,v)=>s+v*v,0)]]; H[1][0]=H[0][1];
    const b=[2*z1.reduce((s,v,i)=>s+v*y[i],0),2*z2.reduce((s,v,i)=>s+v*y[i],0)], det=H[0][0]*H[1][1]-H[0][1]*H[1][0];
    const ws=[(H[1][1]*b[0]-H[0][1]*b[1])/det,(-H[1][0]*b[0]+H[0][0]*b[1])/det];
    const J=w=>{ let s=0; for(let i=0;i<n;i++){ const r=w[0]*z1[i]+w[1]*z2[i]-y[i]; s+=r*r; } return s; };
    const grad=w=>[H[0][0]*(w[0]-ws[0])+H[0][1]*(w[1]-ws[1]),H[1][0]*(w[0]-ws[0])+H[1][1]*(w[1]-ws[1])];
    const e=eig2(H[0][0],H[0][1],H[1][1]);
    const hx=Math.pow(2.5,1-t)*Math.pow(3.5,t), hy=Math.pow(0.5,1-t)*Math.pow(3.5,t);   /* window half-widths, log-interpolated. Raw w₂ ± 0.5 (not ± 0.10): mapped onto a square stage, ± 0.10 leaves an on-stage contour aspect of only 2.3:1 — flatter than the standardised bowl — while ± 0.5 keeps a 7.8:1 trench with the zig-zag still visible on its floor */
    return {t,scheme,z1,z2,y,H,ws,J,Jstar:J(ws),grad,l1:e.l1,l2:e.l2,v1:e.v1,v2:e.v2,kappa:e.l1/e.l2,lim:2/e.l1,hx,hy}; }
  return {problem,m1,s1,m2,s2,ym,mn1,mx1,mn2,mx2,X1,X2,Y}; })();
/* verify the two Hessians once (H = 2 ZᵀZ) */
(function(){ const a=GB.problem(0), b=GB.problem(1); const r=v=>Math.round(v*100)/100;
  console.info('U10 guns-and-butter Hessians · raw H = [['+r(a.H[0][0])+', '+r(a.H[0][1])+'],['+r(a.H[1][0])+', '+r(a.H[1][1])+']] κ ≈ '+Math.round(a.kappa)+' · standardised H = [['+r(b.H[0][0])+', '+r(b.H[0][1])+'],['+r(b.H[1][0])+', '+r(b.H[1][1])+']] κ ≈ '+r(b.kappa));
  if(Math.abs(a.H[0][0]-1.62)>1e-6||Math.abs(a.H[1][1]-1650)>1e-6||Math.abs(b.H[0][0]-6)>1e-6||Math.abs(b.H[0][1]+4.932)>1e-3) console.warn('U10: Hessians differ from the lecture'); })();

/* ================= W1 · THE SQUARES ARE SQUARES ================= */
(function(){
  const box=document.getElementById('w-bill'),svg=document.getElementById('bl-svg'),side=document.getElementById('bl-h'),read=document.getElementById('bl-read'),verd=document.getElementById('bl-verdict');
  if(!box||!svg) return;
  const X=[1,2,3], Y=[2,5,7], J=w=>14*w*w-66*w+78, dJ=w=>28*w-66, WS=33/14, JS=J(WS);
  let w=0,eta=0.02,anim=null,run=0,trace=null,ran=false;
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function drawMain(cur){
    const ww=cur==null?w:cur, p=frame(svg,0,3.6,0,12,{l:40,r:16,t:30,b:30,xs:1,ys:2}); const glow=p.glow, unit=p.py(0)-p.py(1);
    txt(svg,p.L+6,p.T-10,'receipts (x, y) = (1, 2), (2, 5), (3, 7) · model ŷ = w·x','font:600 10.5px system-ui;fill:var(--ink-muted)');
    const gp=el('g',{'clip-path':p.clip},svg);
    /* the line */
    el('line',{x1:p.px(0),y1:p.py(0),x2:p.px(3.6),y2:p.py(ww*3.6),stroke:'var(--s4)','stroke-width':2.6,'stroke-linecap':'round',filter:glow||'none'},gp);
    /* the squares */
    const areas=[0,0,0]; [0,1,2].map(i=>[i,Math.abs(ww*X[i]-Y[i])]).sort((a,b)=>b[1]-a[1]).forEach(([i])=>{ const yh=ww*X[i], m=yh-Y[i], s=Math.abs(m)*unit; areas[i]=m*m;
      if(s>.5){ const x0=p.px(X[i]), yTop=Math.min(p.py(Y[i]),p.py(yh)); el('rect',{x:x0-s,y:yTop,width:s,height:s,fill:'var(--critical)',opacity:.16,stroke:'var(--critical)','stroke-width':1.2},gp);
        el('line',{x1:x0,y1:p.py(Y[i]),x2:x0,y2:p.py(yh),stroke:'var(--critical)','stroke-width':2.4,'stroke-linecap':'round'},gp);
        if(s>18) txt(gp,x0-s/2,yTop+s/2+4,F(m*m,2),'font:700 10px system-ui;fill:var(--critical)','middle'); } });
    X.forEach((x,i)=>glowDot(svg,p.px(x),p.py(Y[i]),5.5,'var(--s1)',glow));
    const tot=areas.reduce((s,v)=>s+v,0);
    txt(svg,p.W-p.R-4,p.T-10,`J = ${areas.map(a=>F(a,2)).join(' + ')} = ${F(tot,2)}`,'font:700 11px system-ui;fill:var(--critical)','end');
    txt(svg,p.W-p.R-2,p.H-p.B-6,'x','font:600 10px system-ui;fill:var(--ink-muted)','end'); txt(svg,p.L+4,p.T+10,'y','font:600 10px system-ui;fill:var(--ink-muted)');
  }
  function drawSide(cur){
    const ww=cur==null?w:cur, p=frame(side,0,4,0,85,{l:34,r:12,t:22,b:24,xs:1,ys:20}); const glow=p.glow;
    txt(side,p.L+4,p.T-9,'the bill J(w) = 14w² − 66w + 78','font:600 9.5px system-ui;fill:var(--ink-muted)');
    let d=''; for(let i=0;i<=80;i++){ const x=4*i/80; d+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.py(J(x)).toFixed(1); }
    el('path',{d,stroke:'var(--s7)','stroke-width':2.4,fill:'none',filter:glow||'none'},side);
    el('line',{x1:p.px(WS),y1:p.py(JS),x2:p.px(WS),y2:p.py(0),stroke:'var(--s3)','stroke-width':1.2,'stroke-dasharray':'3 3'},side);
    txt(side,p.px(WS)+4,p.py(0)-5,'w* = 2.357','font:700 9.5px system-ui;fill:var(--s3)');
    if(trace) trace.forEach(v=>{ if(v>=0&&v<=4) el('circle',{cx:p.px(v),cy:p.py(J(v)),r:2.6,fill:'var(--s4)',opacity:.4},side); });
    const wc=Math.max(0,Math.min(4,ww)); glowDot(side,p.px(wc),p.py(Math.min(85,J(wc))),5,'var(--s4)',glow);
    txt(side,p.W-p.R-2,p.H-3,'w','font:600 9px system-ui;fill:var(--ink-muted)','end');
  }
  function draw(){
    drawMain(); drawSide();
    const miss=X.map((x,i)=>w*x-Y[i]), sl=dJ(w);
    let s=`w = <b>${F(w,3)}</b><br>misses: (<b>${miss.map(m=>F(m,2)).join('</b>, <b>')}</b>)<br>J(w) = 14w² − 66w + 78 = <b>${F(J(w),3)}</b><br>slope dJ/dw = 28w − 66 = <b>${F(sl,2)}</b><br>best: w* = 33/14 = <b>2.357</b>, J* = 3/14 = <b>0.214</b>`;
    if(trace){ const tw=trace.length>6?[...trace.slice(0,5),'…',trace[trace.length-1]]:trace, tj=tw.map(v=>v==='…'?'…':(Math.abs(v)>1e4?sci(J(v),1):F(J(v),2)));
      s+=`<br>w: ${tw.map(v=>v==='…'?'…':(Math.abs(v)>1e4?sci(v,1):F(v,3))).join(' → ')}<br>J: ${tj.join(' → ')}`; }
    read.innerHTML=s;
    if(ran&&eta>=1/14){ verd.className='verdict bad'; verd.textContent=`✗ η = ${fmt(eta,3)} ≥ 1/14 ≈ 0.0714: every step overshoots by more than it gains — the squares grow`; }
    else if(Math.abs(sl)<0.3){ verd.className='verdict good'; verd.textContent='✓ at the bottom: slope 0, three small squares that cannot all shrink at once'; }
    else { verd.className='verdict info'; verd.textContent='the bill is the area of the squares — turn the knob and watch them shrink'; }
  }
  function play(){ stop(); const tok=run; let k=0; trace=[w]; ran=true;
    const step=()=>{ if(tok!==run) return; if(k>=12){ draw(); return; }
      const w0=w, w1=w-eta*dJ(w); if(!isFinite(w1)||Math.abs(w1)>1e6){ draw(); return; }
      anim=tween(250,u=>{ const c=w0+(w1-w0)*u; drawMain(c); drawSide(c); },()=>{ w=w1; k++; trace.push(w); setCtl('bl-w',Math.max(0,Math.min(4,w)),2); draw(); step(); }); };
    step(); }
  document.getElementById('bl-play').addEventListener('click',play);
  document.getElementById('bl-reset').addEventListener('click',()=>{ stop(); w=0; trace=null; ran=false; setCtl('bl-w',0,2); draw(); });
  bindCtl('bl-w',v=>{ stop(); w=v; trace=null; ran=false; draw(); })();
  bindCtl('bl-eta',v=>{ eta=v; ran=false; draw(); },v=>fmt(v,3))();
  /* self-check: the η = 0.02 trace from w = 0 */
  (function(){ let x=0; const t=[x]; for(let i=0;i<3;i++){ x=x-0.02*dJ(x); t.push(x); } const s=t.map(v=>v.toFixed(3)).join(' → '); if(s!=='0.000 → 1.320 → 1.901 → 2.156') console.warn('W1 trace unexpected',s); })();
  draw();
})();

/* ================= W2 · THE PARACHUTE DROP ================= */
(function(){
  const box=document.getElementById('w-drop'),svg=document.getElementById('dp-svg'),read=document.getElementById('dp-read'),verd=document.getElementById('dp-verdict');
  if(!box||!svg) return;
  const XX=200, YY=7, KMAX=13;
  let tab='overflow',lw0=0,leta=-3,sep=0.3,shown=99,anim=null,run=0,ranC=false,pathA=null,pathB=null;
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  /* ---- overflow ---- */
  function iterate(){ const eta=Math.pow(10,leta), w0=Math.pow(10,lw0); const ws=[w0]; let w=w0, kov=-1;
    for(let k=1;k<=2500;k++){ w=w-eta*2*XX*(w*XX-YY); ws.push(w); if(!isFinite(w)){ if(kov<0) kov=k; else break; } }   /* ∞ then NaN: Inf − Inf */
    return {ws,kov,eta,w0,fac:1-2*eta*XX*XX}; }
  function drawOverflow(){
    const R=iterate(), {ws,kov,fac}=R, n=ws.length; const glow=glo(svg);
    /* which bars: the ladder 0…12, then (if overflow later) ⋯ and the last finite, ∞, NaN */
    let idx=[]; for(let k=0;k<=Math.min(KMAX,n-1);k++) idx.push(k);
    let gap=false; if(kov>KMAX+1){ gap=true; idx.push(kov-1,kov); if(n>kov+1) idx.push(kov+1); } else if(kov>0){ idx=[]; for(let k=0;k<n;k++) idx.push(k); }
    const lg=v=>Math.log10(Math.max(1e-3,Math.abs(v)));
    const finiteLogs=idx.filter(k=>isFinite(ws[k])).map(k=>lg(ws[k]));
    const lowTop=Math.max(6,Math.ceil((Math.max(...finiteLogs.filter(v=>v<290),-3)+3)/5)*5);
    const broken=gap||finiteLogs.some(v=>v>=290);
    const W=600,H=340,L=54,Rr=16,T=34,B=36, Y1=T+ (broken?70:0), Y0=H-B;   /* bottom band [−3, lowTop] and, when broken, a top band [290, 312] */
    const yOf=l=>{ if(!broken||l<=lowTop) return Y0-(Math.min(l,lowTop)+3)/(lowTop+3)*(Y0-Y1); if(l>=290) return T+ (1-(Math.min(l,312)-290)/22)*52; return Y1; };
    txt(svg,L+4,T-14,`|wₖ| after each step · w ← w − η·2x(wx − y) · x = 200, y = 7 · factor ${F(fac,fac>-100&&fac<100?2:0)}`,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    /* bands */
    el('rect',{x:L,y:Y1,width:W-L-Rr,height:Y0-Y1,rx:6,fill:'none',stroke:'var(--line, var(--ring))',opacity:.7},svg);
    for(let e=Math.ceil(-3/5)*5;e<=lowTop;e+=(lowTop>20?10:5)){ const y=yOf(e); el('line',{x1:L,y1:y,x2:W-Rr,y2:y,stroke:'var(--grid)'},svg); txt(svg,L-5,y+3.5,'10'+SUP(e),'font:500 9.5px system-ui;fill:var(--ink-muted)','end'); }
    if(broken){ el('rect',{x:L,y:T,width:W-L-Rr,height:52,rx:6,fill:'none',stroke:'var(--line, var(--ring))',opacity:.7},svg);
      el('path',{d:`M${L-8},${Y1-6}l6,-4l-6,-4M${W-Rr+8},${Y1-6}l-6,-4l6,-4`,stroke:'var(--ink-muted)','stroke-width':1.4,fill:'none'},svg);
      [290,300].forEach(e=>{ const y=yOf(e); el('line',{x1:L,y1:y,x2:W-Rr,y2:y,stroke:'var(--grid)'},svg); txt(svg,L-5,y+3.5,'10'+SUP(e),'font:500 9.5px system-ui;fill:var(--ink-muted)','end'); });
      txt(svg,(L+W-Rr)/2,Y1-9,'⋯ steps 13 … '+(kov-2)+' ⋯','font:600 9.5px system-ui;fill:var(--ink-muted)','middle');
      const yc=yOf(308.26); el('line',{x1:L,y1:yc,x2:W-Rr,y2:yc,stroke:'var(--critical)','stroke-width':1.6,'stroke-dasharray':'6 4'},svg); txt(svg,L+6,yc-5,'float64 ceiling 1.8 × 10³⁰⁸ · overflow','font:700 10px system-ui;fill:var(--critical)'); }
    else { txt(svg,W-Rr-4,T+2,'float64 ceiling 1.8 × 10³⁰⁸ is far above — but the ladder climbs by ×'+(Math.abs(fac)>=100?sci(Math.abs(fac),1):F(Math.abs(fac),1))+' a step','font:600 9.5px system-ui;fill:var(--ink-muted)','end'); }
    /* bars */
    const nb=idx.length, bw=Math.min(30,(W-L-Rr-20)/nb-4), gx=(W-L-Rr-20)/nb;
    idx.forEach((k,i)=>{ if(i>=shown) return; const v=ws[k], x=L+10+gx*i+gx/2; const lab=String(k);
      if(!isFinite(v)){ const chip=el('g',{},svg); const y=isNaN(v)?T+4:yOf(312)-2;
        const pid='hatch-'+svg.id; if(!svg.querySelector('#'+pid)){ const defs=svg.querySelector('defs')||el('defs',{},svg); const pat=el('pattern',{id:pid,width:6,height:6,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs); el('rect',{width:6,height:6,fill:'var(--critical)',opacity:.18},pat); el('line',{x1:0,y1:0,x2:0,y2:6,stroke:'var(--critical)','stroke-width':2},pat); }
        el('rect',{x:x-bw/2,y:y,width:bw,height:22,rx:5,fill:'url(#'+pid+')',stroke:'var(--critical)','stroke-width':1.4},chip);
        el('rect',{x:x-bw/2,y:y,width:bw,height:22,rx:5,fill:'var(--page)',opacity:.55},chip);
        txt(chip,x,y+15,isNaN(v)?'NaN':'∞','font:800 12px system-ui;fill:var(--critical)','middle'); }
      else { const l=lg(v), y=yOf(l), crit=Math.abs(v)>=1e300, col=crit?'var(--critical)':'var(--s4)';
        const g=el('g',{},svg); if(glow&&!crit) g.setAttribute('filter',glow);
        if(broken&&l>=290){ el('rect',{x:x-bw/2,y:y,width:bw,height:T+52-y,rx:3,fill:col,opacity:.85},g); el('rect',{x:x-bw/2,y:Y1,width:bw,height:Y0-Y1,rx:3,fill:col,opacity:.3},g); }
        else el('rect',{x:x-bw/2,y:Math.min(y,Y0-2),width:bw,height:Math.max(2,Y0-Math.min(y,Y0-2)),rx:3,fill:col,opacity:.85},g);
        txt(svg,x,Math.max(T+10,y-5),'10'+SUP(Math.round(l)),'font:600 8.5px system-ui;fill:var(--ink-2)','middle'); }
      txt(svg,x,Y0+14,(i===0?'k = ':'')+lab,'font:500 9px system-ui;fill:var(--ink-muted)','middle'); });
    /* readout */
    const yh=R.w0*XX, e0=(yh-YY)*(yh-YY), safe=Math.abs(fac)<1;
    read.innerHTML=`w₀ = <b>${R.w0>=1e3||R.w0<1e-2?sci(R.w0,1):F(R.w0,3)}</b>, x = 200, y = 7 · η = <b>${sci(R.eta,1)}</b><br>first prediction ŷ = w₀x = <b>${yh>=1e4?sci(yh,2):F(yh,2)}</b>, first squared error = <b>${e0>=1e4?sci(e0,2):F(e0,2)}</b><br>factor per step 1 − 2ηx² = <b>${Math.abs(fac)>=1e3?sci(fac,2):F(fac,fac===Math.round(fac)?0:3)}</b><br>steps until overflow: <b>${kov>0?kov:'never — converging'}</b><br>safe zone: η < 1/x² = <b>2.5 × 10⁻⁵</b>`;
    if(kov>0){ verd.className='verdict bad'; verd.textContent=`✗ overflow after ${kov} steps — the numbers, not the model, gave up`; }
    else if(R.w0<1e-2&&safe){ verd.className='verdict info'; verd.textContent=`w₀ tiny (${sci(R.w0,1)}): the first gradient is ≈ ${F(2*XX*(R.w0*XX-YY),0)}, the signal is still there — underflow only bites inside long products`; }
    else if(safe){ verd.className='verdict good'; verd.textContent='✓ |1 − 2ηx²| < 1: the start is forgiven, every step shrinks the error'; }
    else { verd.className='verdict bad'; verd.textContent=`✗ |1 − 2ηx²| = ${Math.abs(fac)>=1e3?sci(Math.abs(fac),1):F(Math.abs(fac),2)} > 1: every step is bigger than the last — overflow is coming`; }
    return idx.length;
  }
  /* ---- clones ---- */
  const fc=w=>(w[0]+w[1]-1)*(w[0]+w[1]-1)+0.3*(w[0]*w[0]+w[1]*w[1]), gc=w=>[2*(w[0]+w[1]-1)+0.6*w[0],2*(w[0]+w[1]-1)+0.6*w[1]], WM=1/2.6;
  function simulate(){ let A=[1.2,1.2],B=[1.2,1.2-sep]; const pa=[A.slice()],pb=[B.slice()]; for(let k=0;k<30;k++){ const ga=gc(A),gb=gc(B); A=[A[0]-.25*ga[0],A[1]-.25*ga[1]]; B=[B[0]-.25*gb[0],B[1]-.25*gb[1]]; pa.push(A.slice()); pb.push(B.slice()); } return {pa,pb}; }
  function drawClones(){
    if(!pathA){ const S=simulate(); pathA=S.pa; pathB=S.pb; }
    const p=plane(svg,-2.5,2.5,-1.6,1.6,{pad:24,tickEvery:1}); const glow=p.glow, clip=planeClip(p,-2.5,2.5,-1.6,1.6);
    const fmax=fc([2.5,1.6]), lv=[]; for(let i=1;i<=9;i++) lv.push(fmax*Math.pow(i/9.5,2));
    const cg=el('g',{opacity:.38,'clip-path':clip},svg);
    contourSegs((x,y)=>fc([x,y]),lv,-2.5,2.5,-1.6,1.6,100).forEach(({segs})=>{ let d=''; segs.forEach(s=>{ d+=`M${p.px(s[0]).toFixed(1)},${p.py(s[1]).toFixed(1)}L${p.px(s[2]).toFixed(1)},${p.py(s[3]).toFixed(1)}`; }); el('path',{d,stroke:'var(--s1)','stroke-width':1.3,fill:'none'},cg); });
    el('line',{x1:p.px(-1.6),y1:p.py(-1.6),x2:p.px(1.6),y2:p.py(1.6),stroke:'var(--s2)','stroke-width':1.8,'stroke-dasharray':'7 5',opacity:.9},svg);
    txt(svg,p.px(-1.5)+6,p.py(-1.5)-8,'w₁ = w₂ · identical clones stay here for ever','font:700 10px system-ui;fill:var(--s2)');
    txt(svg,30,16,'f = (w₁ + w₂ − 1)² + 0.3(w₁² + w₂²) · γ = 0.25 · 30 steps','font:600 10.5px system-ui;fill:var(--ink-muted)');
    glowDot(svg,p.px(WM),p.py(WM),4.5,'var(--s3)',glow); txt(svg,p.px(WM)+8,p.py(WM)+12,'w* = (0.385, 0.385)','font:700 10px system-ui;fill:var(--s3)');
    const n=Math.min(shown,pathA.length), gp=el('g',{'clip-path':clip},svg);
    [[pathB,'var(--s7)','B'],[pathA,'var(--s4)','A']].forEach(([P,col,name])=>{ let d=''; for(let i=0;i<n;i++) d+=(i?'L':'M')+p.px(P[i][0]).toFixed(1)+','+p.py(P[i][1]).toFixed(1); if(n>1) glowPath(gp,d,col,2,glow,{opacity:.9});
      for(let i=0;i<n;i++) el('circle',{cx:p.px(P[i][0]),cy:p.py(P[i][1]),r:2.2,fill:col,opacity:.5},gp);
      const c=P[n-1]; glowDot(gp,p.px(c[0]),p.py(c[1]),6,col,glow); txt(svg,p.px(P[0][0])+9,p.py(P[0][1])+(name==='A'?-6:14),name+' · ('+F(P[0][0],2)+', '+F(P[0][1],2)+')',`font:700 10.5px system-ui;fill:${col}`); });
    txt(svg,570,16,`step ${n-1} of 30`,'font:700 11px system-ui;fill:var(--s4)','end');
    const A=pathA[n-1], B=pathB[n-1], ga=gc(A), gb=gc(B), Bend=pathB[30], Aend=pathA[30], dB=Math.abs(Bend[0]-Bend[1]);
    read.innerHTML=`A: (w₁, w₂) = (<b>${F(A[0],3)}</b>, <b>${F(A[1],3)}</b>) — on the diagonal: ∂f/∂w₁ = ∂f/∂w₂ = <b>${F(ga[0],3)}</b>, the two knobs receive identical updates<br>B: (<b>${F(B[0],3)}</b>, <b>${F(B[1],3)}</b>), gradient (<b>${F(gb[0],3)}</b>, <b>${F(gb[1],3)}</b>)<br>after 30 steps: A at (<b>${F(Aend[0],3)}</b>, <b>${F(Aend[1],3)}</b>), B at (<b>${F(Bend[0],3)}</b>, <b>${F(Bend[1],3)}</b>)<br>B's |w₁ − w₂|: ${F(sep,2)} at the start → <b>${dB<1e-3&&dB>0?sci(dB,1):F(dB,4)}</b> after 30 steps`;
    if(sep<1e-9){ verd.className='verdict info'; verd.textContent='on the diagonal the gradient is symmetric — start equal, stay equal: the two knobs never become different'; }
    else { verd.className='verdict good'; verd.textContent=`✓ a little randomness breaks the tie — B's two knobs part company (|w₁ − w₂| = ${dB<1e-3?sci(dB,1):F(dB,4)} after 30 steps, never exactly 0)`; }
    return pathA.length;
  }
  function draw(){ return tab==='overflow'?drawOverflow():drawClones(); }
  function play(){ stop(); const tok=run; shown=1; const n=draw(); const dur=tab==='overflow'?180:120;
    const next=()=>{ if(tok!==run) return; if(shown>=n){ shown=999; draw(); return; } anim=tween(dur,()=>{},()=>{ shown++; draw(); next(); }); }; next(); }
  document.getElementById('dp-play').addEventListener('click',play);
  bindCtl('dp-w0',v=>{ stop(); shown=999; lw0=v; draw(); },v=>{ const x=Math.pow(10,v); return x>=1e3||x<1e-2?x.toExponential(0).replace('e+','e'):fmt(x,3); })();
  bindCtl('dp-eta',v=>{ stop(); shown=999; leta=v; draw(); },v=>{ const x=Math.pow(10,v); return x.toExponential(1).replace('e-','e−'); })();
  bindCtl('dp-sep',v=>{ stop(); shown=999; sep=v; pathA=null; pressOnly(document.getElementById('dp-start'),null); draw(); })();
  const bar=document.getElementById('dp-start'); bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ pressOnly(bar,btn); stop(); shown=999; sep=btn.dataset.p==='same'?0:0.3; setCtl('dp-sep',sep,2); pathA=null; draw(); }));
  tabs(document.getElementById('dp-tabs'),t=>{ stop(); shown=999; tab=t; box.querySelectorAll('[data-tab]').forEach(e=>e.style.display=e.dataset.tab===t?'':'none'); draw(); });
  draw();
})();

/* ================= W3 · FULL MARKS BY MEMORISING ================= */
(function(){
  const box=document.getElementById('w-memo'),svg=document.getElementById('mm-svg'),knobs=document.getElementById('mm-knobs'),read=document.getElementById('mm-read'),verd=document.getElementById('mm-verdict');
  if(!box||!svg) return;
  const ROWS=[[61,2,3,0.1,59],[40,0,4,0.5,40],[68,0,10,1.0,70]];
  /* the memoriser: solve 2w₂ + 3w₃ + w₅ = 59, 4w₃ + w₅ = 40, 10w₃ + w₅ = 70 */
  const w3=(70-40)/(10-4), w5=40-4*w3, w2=(59-3*w3-w5)/2;
  const MODEL={honest:[1,0,0,0,0],memoriser:[0,w2,w3,0,w5]};
  const pred=(w,r)=>w[0]*r[0]+w[1]*r[1]+w[2]*r[2]+w[3]*r[3]+w[4];
  const Jtrain=w=>ROWS.reduce((s,r)=>s+Math.pow(pred(w,r)-r[4],2),0);
  console.info('U10 memoriser: w₃ = '+w3+', w₅ = '+w5+', w₂ = '+w2+' · training J honest = '+Jtrain(MODEL.honest)+', memoriser = '+Jtrain(MODEL.memoriser));
  let tab='honest',x1=50,dragging=false;
  const unseen=()=>[x1,1,6,0.3,x1];
  function draw(){
    const w=MODEL[tab], p=frame(svg,30,80,20,90,{l:40,r:16,t:30,b:30,xs:10,ys:10}); const glow=p.glow;
    txt(svg,p.L+6,p.T-10,'y against x₁ · three training rows · one unseen row','font:600 10.5px system-ui;fill:var(--ink-muted)');
    const gp=el('g',{'clip-path':p.clip},svg);
    /* honest line y = x₁ */
    el('line',{x1:p.px(30),y1:p.py(30),x2:p.px(80),y2:p.py(80),stroke:'var(--s3)','stroke-width':tab==='honest'?2.6:1.4,'stroke-dasharray':tab==='honest'?'none':'4 4',opacity:tab==='honest'?1:.55,filter:tab==='honest'&&glow?glow:'none'},gp);
    txt(svg,p.px(76),p.py(76)-10,'honest · ŷ = x₁','font:700 10px system-ui;fill:var(--s3)','end');
    /* memoriser: flat line at 62 for the unseen family, markers on the three dots */
    const um=pred(MODEL.memoriser,unseen());
    if(tab==='memoriser'){ el('line',{x1:p.px(30),y1:p.py(um),x2:p.px(80),y2:p.py(um),stroke:'var(--s2)','stroke-width':2.2,'stroke-dasharray':'8 5',filter:glow||'none'},gp);
      txt(svg,p.px(31),p.py(um)-7,`the memoriser ignores x₁ · ŷ = 12·1 + 5·6 + 20 = ${F(um,0)}`,'font:700 10px system-ui;fill:var(--s2)'); }
    /* the unseen row: truth ring on the diagonal, stems to both predictions */
    const u=unseen(), ph=pred(MODEL.honest,u), pm=um;
    el('line',{x1:p.px(x1),y1:p.py(u[4]),x2:p.px(x1),y2:p.py(pm),stroke:'var(--critical)','stroke-width':tab==='memoriser'?3:1.2,'stroke-linecap':'round',opacity:tab==='memoriser'?.95:.35},gp);
    if(tab==='memoriser'){ glowDot(gp,p.px(x1),p.py(pm),5,'var(--s2)',glow); txt(svg,p.px(x1)+9,p.py(pm)+4,'ŷ = '+F(pm,0),'font:700 10px system-ui;fill:var(--s2)'); const my=(p.py(u[4])+p.py(pm))/2; if(Math.abs(p.py(u[4])-p.py(pm))>16) txt(svg,p.px(x1)+9,my+4,'error '+F(Math.abs(pm-u[4]),0),'font:700 10px system-ui;fill:var(--critical)'); }
    else { glowDot(gp,p.px(x1),p.py(ph),4.5,'var(--s3)',glow); txt(svg,p.px(x1)+9,p.py(ph)+14,'ŷ = '+F(ph,0)+' · error 0','font:700 10px system-ui;fill:var(--s3)'); }
    const ring=el('g',{filter:glow||'none',style:'cursor:grab'},svg); el('circle',{cx:p.px(x1),cy:p.py(x1),r:9,fill:'none',stroke:'var(--s4)','stroke-width':2.6},ring); el('circle',{cx:p.px(x1),cy:p.py(x1),r:2.2,fill:'var(--s4)'},ring);
    txt(svg,p.px(x1)-12,p.py(x1)-10,'unseen row · truth ≈ x₁ = '+F(x1,1),'font:700 10px system-ui;fill:var(--s4)','end');
    /* the three training rows */
    ROWS.forEach(r=>{ glowDot(svg,p.px(r[0]),p.py(r[4]),6,'var(--s1)',glow); if(tab==='memoriser'){ const m=el('g',{},svg); el('rect',{x:p.px(r[0])-5,y:p.py(r[4])-5,width:10,height:10,fill:'none',stroke:'var(--s2)','stroke-width':2,transform:`rotate(45 ${p.px(r[0])} ${p.py(r[4])})`},m); } });
    txt(svg,p.W-p.R-2,p.H-p.B-6,'x₁','font:600 10px system-ui;fill:var(--ink-muted)','end'); txt(svg,p.L+4,p.T+10,'y','font:600 10px system-ui;fill:var(--ink-muted)');
    drawKnobs(w);
    const preds=ROWS.map(r=>pred(w,r)), J=Jtrain(w), pu=pred(w,u), err=Math.abs(pu-u[4]);
    read.innerHTML=`training rows: ŷ = (<b>${preds.map(v=>F(v,0)).join('</b>, <b>')}</b>) vs y = (59, 40, 70) → J = <b>${F(J,0)}</b><br>unseen row (x₁ = <b>${F(x1,1)}</b>): truth ≈ <b>${F(u[4],1)}</b>, ŷ = <b>${F(pu,1)}</b>, error = <b>${F(err,1)}</b><br>memoriser solves 2w₂ + 3w₃ + w₅ = 59, 4w₃ + w₅ = 40, 10w₃ + w₅ = 70 → w₃ = <b>5</b>, w₅ = <b>20</b>, w₂ = <b>12</b><br>slide's w₂ = 7 gives ŷ₁ = 49 ≠ 59; the exact solution is w₂ = 12`;
    if(tab==='honest'){ verd.className='verdict good'; verd.textContent='✓ J = 8 on the training rows, error ≈ 0 on the unseen row — it learned the rule y ≈ x₁'; }
    else { verd.className='verdict bad'; verd.textContent=`✗ J = 0 on the training rows, error ${F(err,0)} on the unseen row — it memorised three facts with variables that have nothing to do with the answer`; }
  }
  function drawKnobs(w){ knobs.innerHTML=''; const glow=glo(knobs);
    for(let i=0;i<5;i++){ const cx=34+i*58; dial(knobs,cx,46,20,0,20,w[i],{color:w[i]?'var(--s4)':'var(--ink-muted)',ticks:4,track:4,glow,label:'w'+SUB(i+1),value:String(w[i])}); }
    const chip=el('g',{},knobs); el('rect',{x:70,y:92,width:160,height:20,rx:10,fill:'var(--surface)',stroke:'var(--line, var(--ring))'},chip); txt(chip,150,106,'5 knobs · 3 facts · 2 knobs free','font:700 10px system-ui;fill:var(--s2)','middle'); }
  /* drag the unseen row along the diagonal */
  const toX=e=>{ const r=svg.getBoundingClientRect(); const sx=(e.clientX-r.left)/r.width*600; return Math.max(30,Math.min(80,30+(sx-40)/(600-40-16)*50)); };
  svg.addEventListener('pointerdown',e=>{ dragging=true; try{ svg.setPointerCapture(e.pointerId); }catch(_){ } x1=Math.round(toX(e)*2)/2; setCtl('mm-x1',x1,1); draw(); });
  svg.addEventListener('pointermove',e=>{ if(!dragging) return; x1=Math.round(toX(e)*2)/2; setCtl('mm-x1',x1,1); draw(); });
  const up=()=>{ dragging=false; }; svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',up);
  bindCtl('mm-x1',v=>{ x1=v; draw(); },v=>fmt(v,1))();
  tabs(document.getElementById('mm-tabs'),t=>{ tab=t; draw(); });
  draw();
})();

/* ================= W4 · THE HAIR-TRIGGER AND THE STIFF KNOB ================= */
(function(){
  const box=document.getElementById('w-knobs'),svg=document.getElementById('kn-svg'),read=document.getElementById('kn-read'),verd=document.getElementById('kn-verdict');
  if(!box||!svg) return;
  let x1=50,x2=4,leta=-5,w=[0,0],anim=null,run=0,k=0;
  const eta=()=>Math.pow(10,leta), S=()=>[x1*x1,x2*x2];
  const fmtE=v=>{ const e=Math.floor(Math.log10(v)), m=v/Math.pow(10,e); return (Math.abs(m-1)<1e-9?'':F(m,1)+'×')+'10'+SUP(e); };
  const big=v=>v>=1e4||v<1e-3?sci(v,1):F(v,v>=100?0:(v>=1?2:4));
  function logBar(p,x,y,wid,lo,hi,v,col,glow,zones,lab){ const g=el('g',{},p); el('rect',{x,y,width:wid,height:10,rx:5,fill:'var(--surface-2)',stroke:'var(--line, var(--ring))',opacity:.9},g);
    const px=l=>x+(Math.max(lo,Math.min(hi,l))-lo)/(hi-lo)*wid;
    (zones||[]).forEach(z=>{ el('rect',{x:px(z[0]),y,width:Math.max(0,px(z[1])-px(z[0])),height:10,rx:5,fill:z[2],opacity:.22},g); txt(g,(px(z[0])+px(z[1]))/2,y+8,z[3],`font:700 8px system-ui;fill:${z[2]}`,'middle'); });
    const l=Math.log10(Math.max(1e-12,v)); const bx=px(l);
    const b=el('g',{},g); if(glow) b.setAttribute('filter',glow); el('rect',{x,y:y+2,width:Math.max(2,bx-x),height:6,rx:3,fill:col,opacity:.9},b); el('circle',{cx:bx,cy:y+5,r:5,fill:col},b);
    for(let e=Math.ceil(lo);e<=hi;e+=(hi-lo>6?2:1)){ txt(g,px(e),y+21,'10'+SUP(e),'font:500 8.5px system-ui;fill:var(--ink-muted)','middle'); }
    txt(g,x,y-3,lab,'font:600 9.5px system-ui;fill:var(--ink-2)'); return g; }
  function draw(cur){
    const ww=cur||w, s=S(), e=eta(), mv=[e*s[0],e*s[1]]; svg.innerHTML=''; const glow=glo(svg);
    txt(svg,20,18,'y = w₁·x₁² + w₂·x₂² · one stride η for both knobs · target mark at w = 1','font:600 10.5px system-ui;fill:var(--ink-muted)');
    [[150,'w₁ (age²)',0],[450,'w₂ (college²)',1]].forEach(([cx,lab,i])=>{
      dial(svg,cx,120,66,-0.5,2,ww[i],{zero:0,color:i?'var(--s7)':'var(--s4)',ticks:5,track:8,glow,mark:1,tickLab:v=>F(v,1),label:lab,labelStyle:'font:800 13px system-ui;fill:var(--ink)',value:'w = '+F(ww[i],3)});
      logBar(svg,cx-120,238,240,0,4,s[i],'var(--s2)',glow,[],`sensitivity ∂y/∂w${SUB(i+1)} = x${SUB(i+1)}² = ${F(s[i],0)}`);
      logBar(svg,cx-120,296,240,-6,3,mv[i],i?'var(--s7)':'var(--s4)',glow,[[0,3,'var(--critical)','overshoot'],[-6,-3,'var(--ink-muted)','crawl']],`movement per step η·x${SUB(i+1)}²·|r| = ${big(mv[i])}`); });
    if(!cur){ const ratio=s[0]/s[1], st2=1/mv[1], st1=1/mv[0];
      read.innerHTML=`∂y/∂w₁ = x₁² = <b>${F(s[0],0)}</b>, ∂y/∂w₂ = x₂² = <b>${F(s[1],0)}</b>, ratio = <b>${F(ratio,ratio>=100?0:1)}</b><br>one stride η = <b>${fmtE(e)}</b> moves w₁ by <b>${big(mv[0])}</b> and w₂ by <b>${big(mv[1])}</b> per unit of error<br>steps for w₂ to move 1 unit ≈ <b>${st2>=1e4?sci(st2,1):F(st2,st2>=100?0:1)}</b><br>steps for w₁ to move 1 unit ≈ <b>${st1>=1e4?sci(st1,1):F(st1,st1>=100?0:(st1>=1?1:3))}</b>`;
      if(mv[0]>1){ verd.className='verdict bad'; verd.textContent=`✗ serve the stiff knob and the hair-trigger overshoots (moves ${big(mv[0])} per step)`; }
      else if(st2>1000){ verd.className='verdict info'; verd.textContent=`protect the hair-trigger and the stiff knob crawls (${st2>=1e4?sci(st2,1):F(st2,0)} steps per unit)`; }
      else { verd.className='verdict good'; verd.textContent='✓ both knobs move at a workable pace'; } }
  }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run; const s=S(), e=eta(); w=[0,0]; k=0; draw();
    const step=()=>{ if(tok!==run) return; if(k>=8){ draw(); return; }
      const w0=w.slice(), w1=[w[0]-e*s[0]*(w[0]-1),w[1]-e*s[1]*(w[1]-1)].map(v=>Math.max(-50,Math.min(50,v)));   /* residual r = w − 1: the mark is at w = 1 */
      anim=tween(250,u=>draw([w0[0]+(w1[0]-w0[0])*u,w0[1]+(w1[1]-w0[1])*u]),()=>{ w=w1; k++; draw(); step(); }); };
    step(); }
  document.getElementById('kn-play').addEventListener('click',play);
  bindCtl('kn-x1',v=>{ stop(); x1=v; w=[0,0]; draw(); },v=>String(v|0))();
  bindCtl('kn-x2',v=>{ stop(); x2=v; w=[0,0]; draw(); },v=>String(v|0))();
  bindCtl('kn-eta',v=>{ stop(); leta=v; w=[0,0]; draw(); },v=>nm(Math.pow(10,v).toExponential(1)).replace('e−0','e−').replace('.0e','e'))();
  const bar=document.getElementById('kn-presets');
  bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ pressOnly(bar,btn); stop(); const p=btn.dataset.p; leta=p==='protect'?Math.log10(0.01/(x1*x1)):(p==='serve'?Math.log10(0.01/(x2*x2)):-5); leta=Math.max(-8,Math.min(-2,leta)); setCtl('kn-eta',leta,v=>nm(Math.pow(10,v).toExponential(1)).replace('e−0','e−').replace('.0e','e')); w=[0,0]; draw(); }));
  draw();
})();

/* ================= W5 · THREE WAYS TO FIX THE UNITS ================= */
(function(){
  const box=document.getElementById('w-rescale'),svg=document.getElementById('rs-svg'),table=document.getElementById('rs-table'),read=document.getElementById('rs-read'),verd=document.getElementById('rs-verdict');
  if(!box||!svg) return;
  const sN=document.getElementById('rs-new');
  const CLOUD=[]; for(let i=0;i<24;i++) CLOUD.push([30+0.7*i+6*Math.sin(1.7*i),0.02*i*i+0.4*Math.cos(2.3*i)]);
  const DATA={lecture:[[0.1,25],[0.8,10],[0.4,10]],cloud:CLOUD,outlier:[...CLOUD,[95,40]]};
  let key='lecture',tab='raw',xn=null,anim=null,shown=null;   /* shown: the currently drawn (possibly mid-tween) state */
  const stats=P=>{ const S=[0,1].map(j=>{ const v=P.map(p=>p[j]), m=v.reduce((s,a)=>s+a,0)/v.length, sd=Math.sqrt(v.reduce((s,a)=>s+(a-m)*(a-m),0)/v.length); return {m,sd,min:Math.min(...v),max:Math.max(...v)}; }); return S; };
  const tf=(v,j,S,t)=>{ const s=S[j]; if(t==='centre') return v-s.m; if(t==='standardise') return (v-s.m)/(s.sd||1); if(t==='minmax') return (v-s.min)/((s.max-s.min)||1); return v; };
  function state(t){ const P=DATA[key], S=stats(P); const pts=P.map(p=>[tf(p[0],0,S,t),tf(p[1],1,S,t)]);
    const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]); const nx=tf(xn,0,S,t);
    let X0=Math.min(...xs,nx),X1=Math.max(...xs,nx),Y0=Math.min(...ys),Y1=Math.max(...ys);
    if(t==='minmax'){ X0=Math.min(X0,-0.1); X1=Math.max(X1,1.1); Y0=Math.min(Y0,-0.1); Y1=Math.max(Y1,1.1); }
    if(t!=='raw'){ X0=Math.min(X0,0); X1=Math.max(X1,0); Y0=Math.min(Y0,0); Y1=Math.max(Y1,0); }
    let padx=(X1-X0||1)*.12, pady=(Y1-Y0||1)*.14; X0-=padx; X1+=padx; Y0-=pady; Y1+=pady;
    { const u=Math.max((X1-X0)/540,(Y1-Y0)/280); const cx=(X0+X1)/2, cy=(Y0+Y1)/2; X0=cx-u*270; X1=cx+u*270; Y0=cy-u*140; Y1=cy+u*140; }   /* one scale for both axes — the smear must be seen */
    return {pts,S,nx,X0,X1,Y0,Y1,mean:[tf(S[0].m,0,S,t),tf(S[1].m,1,S,t)],sig:[t==='standardise'?1:(t==='minmax'?S[0].sd/((S[0].max-S[0].min)||1):S[0].sd),t==='standardise'?1:(t==='minmax'?S[1].sd/((S[1].max-S[1].min)||1):S[1].sd)]}; }
  const nice=v=>{ const a=[0.1,0.2,0.5,1,2,5,10,20,50]; return a.find(s=>v/s<=7)||100; };
  function paint(st,t){
    const p=frame(svg,st.X0,st.X1,st.Y0,st.Y1,{l:44,r:16,t:30,b:30,xs:nice(st.X1-st.X0),ys:nice(st.Y1-st.Y0),xf:v=>nm(fmt(v,2)),yf:v=>nm(fmt(v,2))}); const glow=p.glow;
    const names={raw:'raw · x',centre:'centred · x − μ',standardise:'standardised · (x − μ)/σ',minmax:'min–max · (x − min)/(max − min)'};
    txt(svg,p.L+6,p.T-10,names[t]+' · '+(key==='lecture'?'3 rows':(key==='cloud'?'24 points':'24 points + 1 outlier')),'font:600 10.5px system-ui;fill:var(--ink-muted)');
    const gp=el('g',{'clip-path':p.clip},svg);
    if(t==='minmax'){ el('rect',{x:p.px(0),y:p.py(1),width:p.px(1)-p.px(0),height:p.py(0)-p.py(1),fill:'var(--s3)',opacity:.06,stroke:'var(--s3)','stroke-width':1.6,'stroke-dasharray':'6 4'},gp); txt(svg,p.px(1)-4,p.py(0)-5,'the unit box [0,1]²','font:700 9.5px system-ui;fill:var(--s3)','end'); }
    /* σ-ellipse (1 σ per axis) */
    const ex=st.sig[0], ey=st.sig[1]; if(ex>0&&ey>0) el('ellipse',{cx:p.px(st.mean[0]),cy:p.py(st.mean[1]),rx:Math.abs(p.px(st.mean[0]+ex)-p.px(st.mean[0])),ry:Math.abs(p.py(st.mean[1]+ey)-p.py(st.mean[1])),fill:'none',stroke:'var(--s7)','stroke-width':1.5,'stroke-dasharray':'5 4',opacity:.9},gp);
    st.pts.forEach((q,i)=>{ const out=key==='outlier'&&i===st.pts.length-1; glowDot(gp,p.px(q[0]),p.py(q[1]),out?6.5:5,out?'var(--s2)':'var(--s1)',glow); if(out) txt(svg,p.cx(p.px(q[0])-9),p.cy(p.py(q[1])+4),'outlier','font:700 10px system-ui;fill:var(--s2)','end'); });
    const mx=p.px(st.mean[0]), my=p.py(st.mean[1]); el('path',{d:`M${mx-7},${my}L${mx+7},${my}M${mx},${my-7}L${mx},${my+7}`,stroke:'var(--s4)','stroke-width':2.4,'stroke-linecap':'round',filter:glow||'none'},gp); txt(svg,mx+9,my-6,'μ','font:700 10.5px system-ui;fill:var(--s4)');
    /* the unseen value on feature 1, at the mean of feature 2 */
    const outside=t==='minmax'&&(st.nx<0||st.nx>1); const ring=el('g',{filter:glow||'none'},gp); el('circle',{cx:p.px(st.nx),cy:p.py(st.mean[1]),r:8,fill:'none',stroke:outside?'var(--critical)':'var(--s4)','stroke-width':2.4},ring);
    txt(svg,p.cx(p.px(st.nx)),p.cy(p.py(st.mean[1])-14),'unseen x₁ → '+F(st.nx,2)+(outside?' · outside [0,1]!':''),`font:700 10px system-ui;fill:${outside?'var(--critical)':'var(--s4)'}`,'middle');
    txt(svg,p.W-p.R-2,p.H-p.B-6,'feature 1','font:600 10px system-ui;fill:var(--ink-muted)','end'); txt(svg,p.L+4,p.T+10,'feature 2','font:600 10px system-ui;fill:var(--ink-muted)');
  }
  function drawTable(S){ const P=DATA[key]; const row=(h,c)=>`<tr><th style="text-transform:none;letter-spacing:0">${h}</th>${c.map(v=>`<td>${v}</td>`).join('')}</tr>`;
    const th=t=>`<th style="text-transform:none;letter-spacing:0">${t}</th>`; let s=`<tr>${th('')}${th('μ')}${th('σ')}${th('min')}${th('max')}</tr>`;
    s+=row('feature 1',[F(S[0].m,3),F(S[0].sd,3),F(S[0].min,2),F(S[0].max,2)])+row('feature 2',[F(S[1].m,3),F(S[1].sd,3),F(S[1].min,2),F(S[1].max,2)]);
    s+=`<tr>${th('unseen x₁ = '+F(xn,2))}<td colspan="4">centred ${F(tf(xn,0,S,'centre'),3)} · z = ${F(tf(xn,0,S,'standardise'),3)} · min–max ${F(tf(xn,0,S,'minmax'),3)}</td></tr>`;
    if(key==='lecture'){ const z1=P.map(p=>tf(p[0],0,S,'standardise')), z2=P.map(p=>tf(p[1],1,S,'standardise')); s+=`<tr>${th('z₁ (standardised)')}<td colspan="4">(${z1.map(v=>F(v,3)).join(', ')})</td></tr><tr>${th('z₂ (standardised)')}<td colspan="4">(${z2.map(v=>F(v,3)).join(', ')})</td></tr>`; }
    table.innerHTML=s; }
  function draw(){ if(anim){ anim.stop(); anim=null; } const st=state(tab); shown=st; paint(st,tab); drawTable(st.S); readout(st); }
  function readout(st){ const S=st.S, P=DATA[key], ratio=S[1].sd/S[0].sd; const big=ratio>=1?ratio:1/ratio;
    const mm=tf(xn,0,S,'minmax'), out=mm<0||mm>1;
    read.innerHTML=`feature 1: μ = <b>${F(S[0].m,3)}</b>, σ = <b>${F(S[0].sd,3)}</b>, min = <b>${F(S[0].min,2)}</b>, max = <b>${F(S[0].max,2)}</b><br>feature 2: μ = <b>${F(S[1].m,3)}</b>, σ = <b>${F(S[1].sd,3)}</b>, min = <b>${F(S[1].min,2)}</b>, max = <b>${F(S[1].max,2)}</b><br>unseen x₁ = <b>${F(xn,2)}</b> → centred <b>${F(tf(xn,0,S,'centre'),3)}</b>, standardised z = <b>${F(tf(xn,0,S,'standardise'),3)}</b>, min-max <b>${F(mm,3)}</b>${out?' (outside [0,1]!)':''}<br>after standardising every column has mean 0 and variance 1 — "one unit" now means "one standard deviation of surprise" in every column`;
    if(tab==='raw'){ verd.className='verdict info'; verd.textContent=`the cloud is a smear: one feature's numbers are ${F(big,1)} × bigger than the other's`; }
    else if(tab==='centre'){ verd.className='verdict good'; verd.textContent='✓ centred: the cloud sits on the origin — same shape, same smear'; }
    else if(tab==='standardise'){ verd.className='verdict good'; verd.textContent='✓ standardised: both features have spread 1 — the smear is gone (a leftover tilt is correlation, not scale)'; }
    else if(key==='outlier'){ const rest=P.slice(0,-1).map(q=>[tf(q[0],0,S,'minmax'),tf(q[1],1,S,'minmax')]); const bx=Math.max(...rest.map(q=>q[0]))-Math.min(...rest.map(q=>q[0])), by=Math.max(...rest.map(q=>q[1]))-Math.min(...rest.map(q=>q[1]));
      verd.className='verdict bad'; verd.textContent=`✗ min–max with an outlier: ${rest.length} points crushed into ${F(bx*by*100,0)} % of the box`; }
    else { verd.className='verdict good'; verd.textContent='✓ min–max: everything inside [0,1] — simple and bounded, but one outlier squashes the rest into a corner'; } }
  function switchTab(t){ if(anim){ anim.stop(); anim=null; } const from=shown||state(tab), to=state(t); tab=t;
    const mix=u=>({pts:from.pts.map((q,i)=>[lerp(q[0],to.pts[i][0],u),lerp(q[1],to.pts[i][1],u)]),S:to.S,nx:lerp(from.nx,to.nx,u),X0:lerp(from.X0,to.X0,u),X1:lerp(from.X1,to.X1,u),Y0:lerp(from.Y0,to.Y0,u),Y1:lerp(from.Y1,to.Y1,u),mean:[lerp(from.mean[0],to.mean[0],u),lerp(from.mean[1],to.mean[1],u)],sig:[lerp(from.sig[0],to.sig[0],u),lerp(from.sig[1],to.sig[1],u)]});
    drawTable(to.S); readout(to);
    anim=tween(600,u=>{ shown=mix(u); paint(shown,t); },()=>{ shown=to; paint(to,t); anim=null; }); }
  function setData(k){ key=k; const v=DATA[key].map(p=>p[0]), mn=Math.min(...v), mx=Math.max(...v), r=mx-mn; sN.min=(mn-.5*r).toFixed(3); sN.max=(mx+.5*r).toFixed(3); sN.step=(r/200).toFixed(4); xn=mx+.1*r; setCtl('rs-new',xn,2); draw(); }
  bindCtl('rs-new',v=>{ xn=v; draw(); });
  tabs(document.getElementById('rs-tabs'),switchTab);
  const bar=document.getElementById('rs-data'); bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ if(!DATA[btn.dataset.p]) return; pressOnly(bar,btn); setData(btn.dataset.p); }));
  setData('lecture');
})();

/* ================= W6 · THE MARBLE RAIN AND THE COMBINATION LOCK ================= */
(function(){
  const box=document.getElementById('w-valleys'),svg=document.getElementById('vl-svg'),side=document.getElementById('vl-lock'),read=document.getElementById('vl-read'),verd=document.getElementById('vl-verdict');
  if(!box||!svg) return;
  const Fx=x=>(x-1)*(x-1)*((x-3)*(x-3)-1), dF=x=>4*x*x*x-24*x*x+42*x-22, d2F=x=>12*x*x-48*x+42, X0=-0.3, X1=4.3;
  const ST=rootsOf(dF,X0,X1).map(x=>({x,f:Fx(x),d2:d2F(x)})); const WS=ST[1].x, GLOB=ST[2], LOC=ST[0];
  console.info('U10 marble rain: stationary points '+ST.map(s=>s.x.toFixed(3)+' (F = '+s.f.toFixed(3)+', F″ = '+s.d2.toFixed(2)+')').join(', '));
  let tab='rain',lo=0,hi=4,n=24,eta=0.02,d=3,kk=3,pp=0.6,anim=null,run=0,marbles=null,phase='idle',lockState=null,presses=0;
  let Fmin=Infinity,Fmax=-Infinity; for(let i=0;i<=400;i++){ const v=Fx(X0+(X1-X0)*i/400); Fmin=Math.min(Fmin,v); Fmax=Math.max(Fmax,v); }
  const YT=Math.min(Fmax,9.5);
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  /* ---- rain ---- */
  function drawRain(){
    const p=frame(svg,X0,X1,Fmin-1.2,YT,{l:40,r:16,t:30,b:52,xs:1,ys:2}); const glow=p.glow;
    txt(svg,p.L+6,p.T-10,'F(x) = (x − 1)²((x − 3)² − 1) · x ← x − ηF′(x)','font:600 10.5px system-ui;fill:var(--ink-muted)');
    /* basins */
    el('rect',{x:p.px(X0),y:p.T,width:p.px(WS)-p.px(X0),height:p.H-p.T-p.B,fill:'var(--s2)',opacity:.06},svg);
    el('rect',{x:p.px(WS),y:p.T,width:p.px(X1)-p.px(WS),height:p.H-p.T-p.B,fill:'var(--s3)',opacity:.07},svg);
    /* the start range */
    el('rect',{x:p.px(lo),y:p.T+2,width:Math.max(1,p.px(hi)-p.px(lo)),height:8,rx:4,fill:'var(--s4)',opacity:.35},svg); txt(svg,(p.px(lo)+p.px(hi))/2,p.T+20,`starts in [${nm(fmt(lo,2))}, ${nm(fmt(hi,2))}]`,'font:700 9.5px system-ui;fill:var(--s4)','middle');
    let dd=''; for(let i=0;i<=300;i++){ const x=X0+(X1-X0)*i/300; dd+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.cy(p.py(Fx(x))).toFixed(1); }
    el('path',{d:dd,stroke:'var(--s1)','stroke-width':3,fill:'none','stroke-linejoin':'round',filter:glow||'none','clip-path':p.clip},svg);
    el('line',{x1:p.px(WS),y1:p.py(ST[1].f),x2:p.px(WS),y2:p.py(Fmin-1.2),stroke:'var(--s2)','stroke-width':1.2,'stroke-dasharray':'3 3',opacity:.7},svg);
    glowDot(svg,p.px(WS),p.py(ST[1].f),5,'var(--s2)',glow); txt(svg,p.px(WS),p.py(ST[1].f)-11,'watershed '+F(WS,3),'font:700 10px system-ui;fill:var(--s2)','middle');
    glowDot(svg,p.px(LOC.x),p.py(LOC.f),5.5,'var(--s3)',glow); txt(svg,p.px(LOC.x)-8,p.py(LOC.f)+16,'local · F = 0','font:700 10px system-ui;fill:var(--s3)','end');
    glowDot(svg,p.px(GLOB.x),p.py(GLOB.f),5.5,'var(--s3)',glow); txt(svg,p.px(GLOB.x)+10,p.py(GLOB.f)+16,'global · F = −4.85','font:700 10px system-ui;fill:var(--s3)');
    /* marbles */
    let nl=0,ng=0; if(marbles){ const gp=el('g',{'clip-path':p.clip},svg); marbles.forEach(m=>{ const y=phase==='fall'?lerp(p.T+12,p.py(Fx(m.x)),m.u):p.py(Fx(m.x));
        if(m.prev!=null&&phase==='roll'){ const x0=p.px(m.prev), y0=p.py(Fx(m.prev)); if(Math.abs(x0-p.px(m.x))>1.5) el('line',{x1:x0,y1:y0,x2:p.px(m.x),y2:y,stroke:'var(--s4)','stroke-width':3,'stroke-linecap':'round',opacity:.35},gp); }
        glowDot(gp,p.px(m.x),y,4.2,'var(--s4)',glow); if(phase!=='fall'){ if(Math.abs(m.x-LOC.x)<0.12) nl++; else if(Math.abs(m.x-GLOB.x)<0.12) ng++; } });
      [[LOC.x,nl,'var(--s2)'],[GLOB.x,ng,'var(--s3)']].forEach(([x,c,col])=>{ const cx=Math.max(p.L+44,Math.min(p.W-p.R-44,p.px(x))), cy=p.T+42; el('rect',{x:cx-42,y:cy-10,width:84,height:18,rx:9,fill:'var(--surface)',stroke:col,opacity:.95},svg); txt(svg,cx,cy+3.5,`${c} of ${marbles.length} marbles`,`font:700 9.5px system-ui;fill:${col}`,'middle'); }); }
    /* the share bar */
    const by=p.H-p.B+30, bw=p.W-p.L-p.R, share=marbles&&phase!=='fall'?ng/marbles.length:Math.max(0,Math.min(1,(hi-Math.max(lo,WS))/((hi-lo)||1)));
    el('rect',{x:p.L,y:by,width:bw,height:9,rx:4.5,fill:'var(--s2)',opacity:.25},svg); el('rect',{x:p.L,y:by,width:bw*share,height:9,rx:4.5,fill:'var(--s3)',opacity:.9,filter:glow||'none'},svg);
    txt(svg,p.L,by-4,(marbles&&phase!=='fall'?'marbles that reached the global valley: ':'share of starts right of the watershed: ')+F(share*100,0)+' %','font:600 9.5px system-ui;fill:var(--ink-2)');
    txt(svg,p.W-p.R-2,p.H-p.B-6,'x','font:600 10px system-ui;fill:var(--ink-muted)','end');
    drawRestarts(); readRain(nl,ng);
  }
  function drawRestarts(){ side.innerHTML=''; const glow=glo(side); const pr=Math.max(0,Math.min(1,(hi-Math.max(lo,WS))/((hi-lo)||1))); const K=20;
    const W=300,H=200,pad=[36,16,26,12]; const px=k=>pad[0]+k/K*(W-pad[0]-pad[3]), py=v=>H-pad[2]-v*(H-pad[1]-pad[2]);
    el('rect',{x:pad[0],y:pad[1],width:W-pad[0]-pad[3],height:H-pad[1]-pad[2],rx:5,fill:'none',stroke:'var(--line, var(--ring))'},side);
    [0,.5,.99].forEach(v=>{ el('line',{x1:pad[0],y1:py(v),x2:W-pad[3],y2:py(v),stroke:v===.99?'var(--s3)':'var(--grid)','stroke-dasharray':v===.99?'4 3':'none'},side); txt(side,pad[0]-4,py(v)+3.5,String(v),'font:500 9px system-ui;fill:var(--ink-muted)','end'); });
    [1,5,10,15,20].forEach(k=>txt(side,px(k),H-pad[2]+11,String(k),'font:500 9px system-ui;fill:var(--ink-muted)','middle'));
    let dd=''; for(let k=1;k<=K;k++){ dd+=(k>1?'L':'M')+px(k).toFixed(1)+','+py(1-Math.pow(1-pr,k)).toFixed(1); } el('path',{d:dd,stroke:'var(--s4)','stroke-width':2.2,fill:'none',filter:glow||'none'},side);
    const kn=pr>=1?1:(pr<=0?Infinity:Math.ceil(Math.log(0.01)/Math.log(1-pr))); if(isFinite(kn)&&kn<=K){ glowDot(side,px(kn),py(1-Math.pow(1-pr,kn)),4.5,'var(--s3)',glow); txt(side,Math.min(px(kn),W-60),py(1-Math.pow(1-pr,kn))+26,'k = '+kn+' restarts','font:700 10px system-ui;fill:var(--s3)'); }
    txt(side,pad[0]+4,H-pad[2]-8,'P(at least one global hit in k restarts) · p = '+F(pr,3),'font:600 8.5px system-ui;fill:var(--ink-muted)'); txt(side,W-pad[3]-2,H-3,'restarts k','font:600 9px system-ui;fill:var(--ink-muted)','end'); }
  function readRain(nl,ng){ const pr=Math.max(0,Math.min(1,(hi-Math.max(lo,WS))/((hi-lo)||1))); const kn=pr>=1?1:(pr<=0?'∞':Math.ceil(Math.log(0.01)/Math.log(1-pr)));
    read.innerHTML=`watershed at x = <b>${F(WS,3)}</b>: starts left of it reach F = <b>0</b>, starts right of it reach F = <b>${F(GLOB.f,3)}</b><br>share of [${nm(fmt(lo,2))}, ${nm(fmt(hi,2))}] right of the watershed = <b>${F(pr,4)}</b> → P(global) = <b>${F(pr,4)}</b><br>marbles: <b>${ng}</b> global · <b>${nl}</b> local<br>restarts needed for P ≥ 0.99 with p = ${F(pr,3)}: k = ⌈ln 0.01 / ln(1 − p)⌉ = <b>${kn}</b>`;
    const N=marbles?marbles.length:n;
    if(lo>=WS){ verd.className='verdict good'; verd.textContent=`✓ all ${N} marbles found the global valley`; }
    else if(hi<=WS){ verd.className='verdict bad'; verd.textContent=`✗ all ${N} marbles stuck at F = 0 while F = −4.848 sat next door`; }
    else { verd.className='verdict info'; verd.textContent='a downhill walker never climbs the watershed — where it lands is decided before it takes a step'; } }
  function playRain(){ stop(); const tok=run; marbles=[]; for(let i=0;i<n;i++) marbles.push({x:lo+(hi-lo)*(i+.5)/n,u:0,prev:null,done:false}); phase='fall'; drawRain();
    anim=tween(500,u=>{ marbles.forEach(m=>m.u=u); drawRain(); },()=>{ if(tok!==run) return; phase='roll'; let k=0;
      const step=()=>{ if(tok!==run) return; let moving=false; marbles.forEach(m=>{ if(m.done) return; const g=dF(m.x); const nx=Math.max(X0,Math.min(X1,m.x-eta*g)); m.prev=m.x; m.x=nx; if(Math.abs(g)<1e-3||k>=119){ m.done=true; } else moving=true; }); k++; drawRain();
        if(!moving||k>=120){ marbles.forEach(m=>m.done=true); phase='done'; drawRain(); return; } anim=tween(50,()=>{},step); }; step(); }); }
  /* ---- lock ---- */
  function drawLock(cur){ svg.innerHTML=''; const glow=glo(svg); const W=600,H=340; const rows=d>6?2:1, cols=Math.ceil(d/rows), r=Math.min(46,(W-60)/(cols*2.35)), gap=(W-40)/cols;
    txt(svg,20,18,`${d} dial${d>1?'s':''} × ${kk} notches · every dial must land on its glowing notch`,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    const opened=lockState&&lockState.done&&lockState.open;
    for(let i=0;i<d;i++){ const cx=20+gap*((i%cols)+.5), cy=rows===1?150:(i<cols?92:212); const g=el('g',{},svg);
      el('circle',{cx,cy,r,fill:opened?'var(--s3)':'var(--surface)',opacity:opened?.25:.9,stroke:opened?'var(--s3)':'var(--line, var(--ring))','stroke-width':opened?2.5:1.5,filter:opened&&glow?glow:'none'},g);
      for(let j=0;j<kk;j++){ const a=-Math.PI/2+j/kk*2*Math.PI, x=cx+Math.cos(a)*(r-7), y=cy+Math.sin(a)*(r-7); const good=j===0; const dot=el('circle',{cx:x,cy:y,r:good?5:3.6,fill:good?'var(--s3)':'var(--s2)',opacity:good?1:.8},g); if(good&&glow) dot.setAttribute('filter',glow); }
      const ang=cur?cur[i]:(lockState?lockState.ang[i]:0); const a=-Math.PI/2+ang*2*Math.PI; el('line',{x1:cx,y1:cy,x2:cx+Math.cos(a)*(r-13),y2:cy+Math.sin(a)*(r-13),stroke:'var(--s4)','stroke-width':Math.max(2,r/12),'stroke-linecap':'round',filter:glow||'none'},g); el('circle',{cx,cy,r:Math.max(2.5,r/9),fill:'var(--s4)'},g);
      if(lockState&&lockState.done&&r>18) txt(g,cx,cy+r+14,lockState.right[i]?'✓':'✗',`font:800 12px system-ui;fill:${lockState.right[i]?'var(--s3)':'var(--critical)'}`,'middle'); }
    const total=Math.pow(kk,d), pd=Math.pow(pp,d);
    const chip=(x,y,t,col)=>{ const g=el('g',{},svg); el('rect',{x:x-2,y:y-13,width:t.length*6.2+12,height:19,rx:9,fill:'var(--surface)',stroke:col,opacity:.95},g); txt(g,x+4,y,t,`font:700 10.5px system-ui;fill:${col}`); };
    const cy1=rows===1?262:300, cy2=rows===1?292:328; chip(20,cy1,`k${SUP(d)} = ${total>=1e6?sci(total,2):String(total)} combinations · 1 opens the door`,'var(--s2)'); chip(20,cy2,`P(open) = p${SUP(d)} = ${pd<1e-3?sci(pd,2):F(pd,3)}`,'var(--s4)');
    if(lockState&&lockState.done){ const t=lockState.open?'✓ every dial on its notch — the lock opens':'✗ '+lockState.right.filter(v=>!v).length+' dial'+(lockState.right.filter(v=>!v).length>1?'s':'')+' off — the lock stays shut'; txt(svg,W-20,cy2,t,`font:800 12px system-ui;fill:${lockState.open?'var(--s3)':'var(--critical)'}`,'end'); }
    read.innerHTML=`d = <b>${d}</b> dials × k = <b>${kk}</b> notches → k${SUP(d)} = <b>${total>=1e6?sci(total,2):String(total)}</b> settings<br>only one is the global minimum<br>with p = <b>${F(pp,2)}</b> per dial, P(all right) = p${SUP(d)} = <b>${pd<1e-3?sci(pd,2):F(pd,3)}</b><br>expected restarts to open once ≈ 1/p${SUP(d)} = <b>${1/pd>=1e4?sci(1/pd,2):F(1/pd,1)}</b>`;
    if(pd<0.05){ verd.className='verdict bad'; verd.textContent=`✗ p${SUP(d)} = ${pd<1e-3?sci(pd,2):F(pd,3)} — restarts alone cannot rescue a walker in high dimensions`; }
    else { verd.className='verdict info'; verd.textContent='every dial settling on its own flat spot is a solution of ∇F = 0 — the minima multiply'; }
  }
  function playLock(){ stop(); const tok=run; presses++; let s=17+presses*101; const rnd=()=>{ s=(s*1664525+1013904223)%4294967296; return s/4294967296; };
    const right=[],ang=[]; for(let i=0;i<d;i++){ const ok=rnd()<pp; right.push(ok); const j=ok?0:1+Math.floor(rnd()*(kk-1)); ang.push(j/kk); }
    lockState={ang:new Array(d).fill(0),right,done:false,open:right.every(v=>v)}; const from=new Array(d).fill(0); const turns=ang.map((a,i)=>2+i*.5+a);
    anim=tween(600+d*120,u=>{ if(tok!==run) return; const cur=turns.map((T,i)=>{ const st=i*.08/(1+d*.08), uu=Math.max(0,Math.min(1,(u-st)/(1-st))); return (from[i]+T*(1-Math.pow(1-uu,3)))%1; }); drawLock(cur); },()=>{ if(tok!==run) return; lockState.ang=ang; lockState.done=true; drawLock(); }); }
  function draw(){ if(tab==='rain'){ side.style.display=''; drawRain(); } else { side.style.display='none'; drawLock(); } }
  document.getElementById('vl-play').addEventListener('click',()=>tab==='rain'?playRain():playLock());
  const sLo=document.getElementById('vl-lo'), sHi=document.getElementById('vl-hi');
  bindCtl('vl-lo',v=>{ stop(); lo=v; if(hi<=lo){ hi=Math.min(X1,lo+.05); setCtl('vl-hi',hi,2); } marbles=null; draw(); })();
  bindCtl('vl-hi',v=>{ stop(); hi=v; if(lo>=hi){ lo=Math.max(X0,hi-.05); setCtl('vl-lo',lo,2); } marbles=null; draw(); })();
  bindCtl('vl-n',v=>{ stop(); n=v|0; marbles=null; draw(); },v=>String(v|0))();
  bindCtl('vl-eta',v=>{ stop(); eta=v; marbles=null; draw(); },v=>fmt(v,3))();
  bindCtl('vl-d',v=>{ stop(); d=v|0; lockState=null; draw(); },v=>String(v|0))();
  bindCtl('vl-k',v=>{ stop(); kk=v|0; lockState=null; draw(); },v=>String(v|0))();
  bindCtl('vl-p',v=>{ stop(); pp=v; lockState=null; draw(); })();
  tabs(document.getElementById('vl-tabs'),t=>{ stop(); tab=t; box.querySelectorAll('[data-tab]').forEach(e=>e.style.display=e.dataset.tab===t?'':'none'); document.getElementById('vl-play').textContent=t==='rain'?'▶ drop the marbles':'▶ spin the dials'; draw(); });
  draw();
})();

/* ================= W7 · THE SALT FLAT (three.js + progress chart) ================= */
(function(){
  const box=document.getElementById('sf-3d'),side=document.getElementById('sf-prog'),read=document.getElementById('sf-read'),verd=document.getElementById('sf-verdict');
  if(!box) return;
  /* a cliff (sigmoid) dropping onto a shelf that slopes down at 0.02, then a bowl (Gaussian) on the right */
  const sg=u=>1/(1+Math.exp(-u)), BX=2.4, BW=0.5;
  const f=(x,y)=>1.6*sg(-5*(x+1.9))-0.02*x+0.35*y*y-1.2*Math.exp(-((x-BX)*(x-BX)+y*y)/BW);
  const grad=(x,y)=>{ const s=sg(-5*(x+1.9)), E=Math.exp(-((x-BX)*(x-BX)+y*y)/BW); return [-8*s*(1-s)-0.02+2.4/BW*(x-BX)*E, 0.7*y+2.4/BW*y*E]; };
  { const h=1e-5, x=.3, y=.4, nn=[(f(x+h,y)-f(x-h,y))/(2*h),(f(x,y+h)-f(x,y-h))/(2*h)], a=grad(x,y); if(Math.hypot(a[0]-nn[0],a[1]-nn[1])>1e-6) console.warn('salt flat: analytic gradient disagrees with finite differences',a,nn); }
  const X=[-3.2,3.6], Y=[-2,2], S=4.4/(X[1]-X[0]), CX=(X[0]+X[1])/2, ZS=.8*S, FLAT=0.05;
  const PRE={cliff:[-2.6,0.6],shelf:[-0.6,0.3],rim:[1.3,0.8]};
  let g=0.3,K=300,start=PRE.cliff.slice(),pos=start.slice(),hist=[start.slice()],sc=null,hudEl=null,anim=null,run=0,ST=null,converged=false,preset='cliff';
  const P3=(x,y,z)=>[(x-CX)*S,z*ZS,-y*S], at=p=>P3(p[0],p[1],f(p[0],p[1]));
  const clampD=p=>[Math.max(X[0],Math.min(X[1],p[0])),Math.max(Y[0],Math.min(Y[1],p[1]))];
  function build(){
    sc=null; const narrow=box.clientWidth<560;
    const fs=(u,v)=>f(u/S+CX,-(-v)/S), U0=(X[0]-CX)*S,U1=(X[1]-CX)*S,V0=Y[0]*S,V1=Y[1]*S;
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[4.8,5.0,6.6]:[5.0,4.7,6.9],look:[0,.3,0],fov:34},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        const surf=CIN.prim.surface(ctx,fs,{x:[U0,U1],y:[V0,V1],res:80,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:1,wire:false}); lightenSurface(ctx,surf,ZS); root.add(surf);
        const floorY=surf.userData.zmin*ZS-.25;
        const grid=CIN.prim.grid(ctx,6,18,hx('grid'),{opacity:isLight?.5:.3}); grid.position.y=floorY; root.add(grid);
        const lv=[]; for(let i=1;i<=8;i++) lv.push(surf.userData.zmin+(surf.userData.zmax-surf.userData.zmin)*i/9); root.add(liftedContours(ctx,fs,lv,U0,U1,V0,V1,ZS,hx('ink2'),{N:80}));
        [['cliff',[U0+.45,floorY,-V1-.15]],['salt flat',[-.1,floorY,-V1-.15]],['bowl',[U1-.45,floorY,-V1-.15]]].forEach(([t,p])=>root.add(CIN.prim.label(ctx,t,p,{size:22,color:colors.muted,bg:false,depthTest:false})));
        const walker=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.075),12); root.add(walker);
        const halo=haloSprite(ctx,hx('s4'),.7); root.add(halo);
        const pole=tube(ctx,[0,0,0],[0,1,0],hx('s4'),.006,.5); root.add(pole);
        /* footprints: one additive point sprite per step — they pile up into a glowing band where the steps are tiny */
        const MAXP=700, fp=new Float32Array(MAXP*3); const fgeo=new THREE.BufferGeometry(); fgeo.setAttribute('position',new THREE.BufferAttribute(fp,3)); fgeo.setDrawRange(0,0);
        const fmat=new THREE.PointsMaterial({color:hx('s3'),size:isLight?.4:.5,map:sparkTex(THREE),transparent:true,opacity:isLight?.55:.38,blending:isLight?THREE.NormalBlending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true});
        const foot=new THREE.Points(fgeo,fmat); foot.frustumCulled=false; foot.renderOrder=9; root.add(foot);
        const trailG=new THREE.Group(); root.add(trailG); const lab=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,walker,halo,pole,foot,fp,fgeo,trailG,lab,floorY};
        hudEl=hud(box); hint(box,'drag to orbit');
        paint(); paintTrail();
      },
      update(){ return false; }
    });
    if(handle) grab(handle,()=>false,()=>{});
    return handle;
  }
  function paint(cur){ if(!sc) return; const c=cur||pos, {walker,halo,pole,ctx,lab,floorY}=sc; const q=at(c); walker.position.set(q[0],q[1]+.012,q[2]); halo.position.copy(walker.position);
    aimTube(ctx.THREE,pole,[q[0],floorY,q[2]],[q[0],q[1],q[2]]);
    const gr=grad(c[0],c[1]), gn=Math.hypot(gr[0],gr[1]); const k=hist.length-1;
    lab.set(`step ${k}`,[q[0],q[1]+.36,q[2]],{size:18,color:sc.colors.s4,bg:false,depthTest:false});
    if(hudEl) hudEl.innerHTML=`step <b>${k}</b> · f = <b>${F(f(c[0],c[1]),3)}</b> · |∇f| = <b>${gn<1e-3?sci(gn,1):F(gn,3)}</b>`;
    RR(ctx); }
  function paintTrail(){ if(!sc) return; clearGroup(sc.trailG); const {fp,fgeo}=sc; const n=Math.min(hist.length,700);
    for(let i=0;i<n;i++){ const q=at(hist[i]); fp[3*i]=q[0]; fp[3*i+1]=q[1]+.02; fp[3*i+2]=q[2]; } fgeo.attributes.position.needsUpdate=true; fgeo.setDrawRange(0,n);
    if(hist.length>=2){ const pts=hist.filter((p,i)=>i%2===0||i===hist.length-1).map(p=>{ const q=at(p); q[1]+=.012; return q; }); sc.trailG.add(ribbon(sc.ctx,pts,sc.hx('s3'),.016)); }
    RR(sc.ctx); }
  function drawSide(){
    const n=hist.length; const fs=hist.map(p=>f(p[0],p[1])), gs=hist.map(p=>Math.hypot(...grad(p[0],p[1])));
    const p=frame(side,0,Math.max(20,Math.max(K,n-1)),-1.4,3.1,{l:34,r:36,t:22,b:24,xs:Math.max(K,n-1)>300?200:100,ys:1}); const glow=p.glow;
    txt(side,p.L+4,p.T-9,'height f (solid) · |∇f| on a log scale (dashed)','font:600 9px system-ui;fill:var(--ink-muted)');
    const lg=v=>Math.log10(Math.max(1e-4,v)), pyg=v=>p.py(-1.4+(lg(v)+4)/4.6*4.5);
    [1,0.1,0.01,0.001].forEach(v=>{ const y=pyg(v); txt(side,p.W-p.R+4,y+3,'10'+SUP(Math.round(Math.log10(v))),'font:500 8.5px system-ui;fill:var(--s7)'); });
    el('line',{x1:p.px(0),y1:pyg(FLAT),x2:p.px(p.X1),y2:pyg(FLAT),stroke:'var(--s7)','stroke-width':1,'stroke-dasharray':'2 3',opacity:.5},side); txt(side,p.px(p.X1)-3,pyg(FLAT)-4,'flat: |∇f| < 0.05','font:600 8.5px system-ui;fill:var(--s7)','end');
    let df='',dg=''; for(let i=0;i<n;i++){ df+=(i?'L':'M')+p.px(i).toFixed(1)+','+p.py(fs[i]).toFixed(1); dg+=(i?'L':'M')+p.px(i).toFixed(1)+','+pyg(gs[i]).toFixed(1); }
    if(n>1){ el('path',{d:dg,stroke:'var(--s7)','stroke-width':1.5,fill:'none','stroke-dasharray':'4 3','clip-path':p.clip},side); el('path',{d:df,stroke:'var(--s4)','stroke-width':2.2,fill:'none','clip-path':p.clip,filter:glow||'none'},side); }
    glowDot(side,p.px(n-1),p.py(fs[n-1]),4,'var(--s4)',glow);
    txt(side,p.W-p.R-2,p.H-3,'step','font:600 9px system-ui;fill:var(--ink-muted)','end');
  }
  function draw(){
    const gr=grad(pos[0],pos[1]), gn=Math.hypot(gr[0],gr[1]), flat=hist.filter(p=>Math.hypot(...grad(p[0],p[1]))<FLAT).length, k=hist.length-1;
    read.innerHTML=`position (x, y) = (<b>${F(pos[0],3)}</b>, <b>${F(pos[1],3)}</b>)<br>tilt |∇f| = <b>${gn<1e-3?sci(gn,2):F(gn,4)}</b><br>step length γ|∇f| = <b>${g*gn<1e-3?sci(g*gn,2):F(g*gn,4)}</b><br>steps spent with |∇f| < 0.05 so far: <b>${flat}</b> of <b>${k}</b><br>at |∇f| = 0.001 and γ = 0.01 a step moves 10⁻⁵: crossing a flat of width 2 takes ≈ 200 000 steps`;
    if(converged||(gn<0.02&&pos[0]>1.5&&k>0)){ verd.className='verdict good'; verd.textContent=`✓ reached the valley after ${k} steps — ${flat} of them spent shuffling across the flat`; }
    else if(gn<FLAT&&f(pos[0],pos[1])>-0.5){ verd.className='verdict info'; verd.textContent='on the flat the tilt is nearly zero, so the steps are nearly zero — not a minimum, just slow'; }
    else if(k===0&&preset==='cliff'){ verd.className='verdict info'; verd.textContent='the cliff is fast; watch the walker slow to a crawl on the shelf'; }
    else if(k===0){ verd.className='verdict info'; verd.textContent=`start at (${F(pos[0],1)}, ${F(pos[1],1)}) with tilt ${F(gn,3)} — press ▶`; }
    else { verd.className='verdict info'; verd.textContent=`walking · tilt ${F(gn,3)} → step ${F(g*gn,4)}`; }
    drawSide(); paint();
  }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function setStart(p){ stop(); start=p.slice(); pos=p.slice(); hist=[p.slice()]; converged=false; paintTrail(); draw(); }
  function play(){ stop(); const tok=run; pos=start.slice(); hist=[start.slice()]; converged=false; paintTrail(); draw(); let k=0;
    if(RM){ for(;k<K;k++){ const gr=grad(pos[0],pos[1]); pos=clampD([pos[0]-g*gr[0],pos[1]-g*gr[1]]); hist.push(pos.slice()); if(Math.hypot(...gr)<0.02&&pos[0]>1.5){ converged=true; break; } } paintTrail(); draw(); return; }
    const step=()=>{ if(tok!==run) return; if(k>=K){ draw(); return; }
      const gr=grad(pos[0],pos[1]), gn=Math.hypot(gr[0],gr[1]); if(gn<0.02&&pos[0]>1.5){ converged=true; draw(); return; }
      const p0=pos.slice(), p1=clampD([pos[0]-g*gr[0],pos[1]-g*gr[1]]); if(!isFinite(p1[0])||!isFinite(p1[1])){ draw(); return; }
      anim=tween(30,u=>paint([p0[0]+(p1[0]-p0[0])*u,p0[1]+(p1[1]-p0[1])*u]),()=>{ pos=p1; hist.push(p1.slice()); k++; if(k%3===0||k>=K) paintTrail(); if(k%5===0||k>=K) drawSide(); if(k%10===0) draw(); else paint(); step(); }); };
    step(); }
  document.getElementById('sf-play').addEventListener('click',play);
  document.getElementById('sf-reset').addEventListener('click',()=>setStart(start));
  bindCtl('sf-g',v=>{ g=v; draw(); })();
  bindCtl('sf-k',v=>{ K=v|0; draw(); },v=>String(v|0))();
  const bar=document.getElementById('sf-presets');
  bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ const P=PRE[btn.dataset.p]; if(!P) return; pressOnly(bar,btn); preset=btn.dataset.p; setStart(P); }));

  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W8 · THE CANYON (three.js + factor bars) ================= */
(function(){
  const box=document.getElementById('cn-3d'),side=document.getElementById('cn-side'),read=document.getElementById('cn-read'),verd=document.getElementById('cn-verdict');
  if(!box) return;
  const PRE={lecture:[10,10],axis:[10,0.5],wall:[2,10]}, D=12, SC=2.2/D;
  let c=4,eta=0.24,K=8,start=[10,10],x=[10,10],path=[[10,10]],sc=null,hudEl=null,anim=null,run=0,ST=null,diverged=false;
  const L=v=>v[0]*v[0]+c*v[1]*v[1], grad=v=>[2*v[0],2*c*v[1]];
  const zsOf=()=>1.5/L([D,D]);
  const P3=(px,py,z)=>[px*SC,z*zsOf(),-py*SC], at=v=>P3(v[0],v[1],L(v));
  const fs=(u,v)=>L([u/SC,v/SC]);
  function levels(){ const lv=[]; for(let i=1;i<=9;i++) lv.push(L([D,D])*Math.pow(i/10,2)); return lv; }
  function build(){
    sc=null; const narrow=box.clientWidth<560;
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[5.4,5.0,7.2]:[4.6,4.2,6.4],look:[0,.5,0],fov:34},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        const surf=CIN.prim.surface(ctx,fs,{x:[-2.2,2.2],y:[-2.2,2.2],res:72,zscale:zsOf(),ramp:[colors.s1,colors.s7,colors.s2],opacity:.92}); lightenSurface(ctx,surf,zsOf()); root.add(surf);
        const floorY=-.14; const grid=CIN.prim.grid(ctx,5,20,hx('grid'),{opacity:isLight?.5:.32}); grid.position.y=floorY; root.add(grid);
        const contG=new THREE.Group(); root.add(contG); contG.add(liftedContours(ctx,fs,levels(),-2.2,2.2,-2.2,2.2,zsOf(),hx('ink2'),{N:72}));
        [['x →',[2.5,floorY,2.3]],['y →',[-2.3,floorY,-2.55]]].forEach(([t,p])=>root.add(CIN.prim.label(ctx,t,p,{size:24,color:colors.muted,bg:false,depthTest:false})));
        root.add(overlay(CIN.prim.dot(ctx,[0,0,0],hx('s3'),.05))); root.add(tube(ctx,[0,floorY,0],[0,0,0],hx('s3'),.006,.6)); root.add(CIN.prim.label(ctx,'bottom',[0,.16,0],{size:18,color:colors.s3,bg:false,depthTest:false}));
        const walker=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.06),12); root.add(walker); const halo=haloSprite(ctx,hx('s4'),.5); root.add(halo);
        const gArr=overlay(CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s2'),{radius:.024,head:.15}),11); root.add(gArr);
        const bArr=overlay(CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s3'),{radius:.018,head:.13}),11); bArr.traverse(m=>{ if(m.material) m.material.opacity=.62; }); root.add(bArr);
        const pathG=new THREE.Group(); root.add(pathG); const lab=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,surf,contG,walker,halo,gArr,bArr,pathG,lab,floorY};
        hudEl=hud(box); hint(box,'drag to orbit');
        paint(); paintPath();
      },
      update(){ return false; }
    });
    if(handle) grab(handle,()=>false,()=>{});
    return handle;
  }
  function reshapeAll(){ if(!sc) return; reshape(sc.ctx,sc.surf,fs,zsOf()); clearGroup(sc.contG); sc.contG.add(liftedContours(sc.ctx,fs,levels(),-2.2,2.2,-2.2,2.2,zsOf(),sc.hx('ink2'),{N:72})); }
  const angle=v=>angleDeg(grad(v),v);   /* between the descent direction −∇L and the line to the bottom */
  function paint(cur,k){ if(!sc) return; const v=cur||x, {walker,halo,gArr,bArr,ctx,lab}=sc; const vis=Math.abs(v[0])<=D*1.02&&Math.abs(v[1])<=D*1.02; walker.visible=vis; halo.visible=vis; gArr.visible=vis; bArr.visible=vis; if(!vis){ lab.hide(); RR(ctx); return; }
    const p=at(v); walker.position.set(p[0],p[1]+.012,p[2]); halo.position.copy(walker.position);
    const gr=grad(v), gn=Math.hypot(gr[0],gr[1]), dist=Math.hypot(v[0],v[1]);
    if(gn>1e-3&&dist>.05){ const Lg=Math.min(1.1,.12+.045*Math.sqrt(gn)); gArr.userData.set([p[0],p[1]+.03,p[2]],[p[0]+gr[0]/gn*Lg,p[1]+.03,p[2]-gr[1]/gn*Lg]);
      const Lb=Math.min(1.1,Lg); bArr.userData.set([p[0],p[1]+.03,p[2]],[p[0]-v[0]/dist*Lb,p[1]+.03,p[2]+v[1]/dist*Lb]); } else { gArr.visible=false; bArr.visible=false; }
    const kk=k==null?path.length-1:k; lab.set(`k = ${kk}`,[p[0],p[1]+.24,p[2]],{size:18,color:sc.colors.s4,bg:false,depthTest:false});
    const an=angle(v); if(hudEl) hudEl.innerHTML=`k = <b>${kk}</b> · L = <b>${F(L(v),1)}</b> · angle(∇L, to-bottom) = <b>${isNaN(an)?'—':F(an,1)+'°'}</b>`;
    RR(ctx); }
  function paintPath(){ if(!sc) return; clearGroup(sc.pathG); const pts=path.filter(p=>Math.abs(p[0])<=D&&Math.abs(p[1])<=D).map(p=>{ const q=at(p); q[1]+=.01; return q; }); if(pts.length>=2) sc.pathG.add(polyTube(sc.ctx,pts,sc.hx('s3'),.02)); RR(sc.ctx); }
  function drawSide(){ side.innerHTML=''; const glow=glo(side); const W=300,H=200, fx=1-2*eta, fy=1-2*c*eta; const x0=40,x1=W-16, px=v=>x0+(v+1.2)/2.4*(x1-x0);
    txt(side,x0,16,'per-step factors · |factor| < 1 shrinks, < 0 bounces','font:600 9px system-ui;fill:var(--ink-muted)');
    [[46,'x: 1 − 2η',fx,'var(--s3)'],[86,'y: 1 − 2cη',fy,'var(--s2)']].forEach(([y,lab,v,col])=>{
      el('rect',{x:x0,y:y-6,width:x1-x0,height:12,rx:6,fill:'var(--surface-2)',stroke:'var(--line, var(--ring))'},side);
      el('rect',{x:x0,y:y-6,width:px(-1)-x0,height:12,rx:6,fill:'var(--critical)',opacity:.22},side); el('rect',{x:px(1),y:y-6,width:x1-px(1),height:12,rx:6,fill:'var(--critical)',opacity:.22},side);
      el('rect',{x:px(-1),y:y-6,width:px(0)-px(-1),height:12,fill:'var(--s2)',opacity:.08},side);
      const vv=Math.max(-1.2,Math.min(1.2,v)), g=el('g',{},side); if(glow) g.setAttribute('filter',glow); el('rect',{x:Math.min(px(0),px(vv)),y:y-4,width:Math.max(2,Math.abs(px(vv)-px(0))),height:8,rx:4,fill:Math.abs(v)>=1?'var(--critical)':col,opacity:.9},g); el('circle',{cx:px(vv),cy:y,r:5,fill:Math.abs(v)>=1?'var(--critical)':col},g);
      txt(side,x0,y-10,lab+' = '+F(v,3),`font:700 9.5px system-ui;fill:${Math.abs(v)>=1?'var(--critical)':col}`); });
    [-1,0,1].forEach(v=>{ el('line',{x1:px(v),y1:34,x2:px(v),y2:100,stroke:'var(--ink-muted)','stroke-width':1,'stroke-dasharray':'2 2',opacity:.6},side); txt(side,px(v),106,String(v),'font:500 9px system-ui;fill:var(--ink-muted)','middle'); });
    txt(side,(px(-1)+px(0))/2,120,'bounces','font:700 8.5px system-ui;fill:var(--s2)','middle'); txt(side,px(-1.2)+2,120,'diverges','font:700 8.5px system-ui;fill:var(--critical)'); txt(side,px(1.2)-2,120,'diverges','font:700 8.5px system-ui;fill:var(--critical)','end');
    /* loss sparkline */
    const Ls=path.map(L), n=Ls.length, lo=Math.log10(Math.max(1e-3,Math.min(...Ls))), hi=Math.log10(Math.max(...Ls,1e-2)); const sy=v=>192-(Math.log10(Math.max(1e-3,v))-lo)/((hi-lo)||1)*50, sx=i=>x0+i/Math.max(1,K)*(x1-x0);
    el('rect',{x:x0,y:132,width:x1-x0,height:64,rx:5,fill:'none',stroke:'var(--line, var(--ring))'},side); txt(side,x0+4,143,'L per step (log) · '+Ls.map(v=>v>=1e4?sci(v,1):F(v,1)).slice(0,5).join(' → ')+(n>5?' …':''),'font:600 8px system-ui;fill:var(--ink-muted)');
    let d=''; for(let i=0;i<n;i++) d+=(i?'L':'M')+sx(i).toFixed(1)+','+sy(Ls[i]).toFixed(1); if(n>1) el('path',{d,stroke:'var(--s4)','stroke-width':2,fill:'none',filter:glow||'none'},side); for(let i=0;i<n;i++) el('circle',{cx:sx(i),cy:sy(Ls[i]),r:2.4,fill:'var(--s4)'},side); }
  function draw(){ const fx=1-2*eta, fy=1-2*c*eta, an=angle(x), k=path.length-1;
    read.innerHTML=`L = x² + ${nm(fmt(c,1))} y² · ∂²L/∂x² = 2, ∂²L/∂y² = <b>${nm(fmt(2*c,1))}</b> · κ = <b>${nm(fmt(c,1))}</b><br>update: x ← (1 − 2η) x = <b>${F(fx,3)}</b> x,  y ← (1 − 2cη) y = <b>${F(fy,3)}</b> y<br>speed limit: η < 2/(2c) = 1/c = <b>${F(1/c,3)}</b><br>one-step finish exists only when c = 1: η = 0.5 sends every point to the origin<br>angle between the gradient and the straight line to the bottom = <b>${isNaN(an)?'—':F(an,1)+'°'}</b><br>x${SUB(k)} = (<b>${Math.abs(x[0])>=1e4?sci(x[0],2):F(x[0],3)}</b>, <b>${Math.abs(x[1])>=1e4?sci(x[1],2):F(x[1],3)}</b>), L = <b>${L(x)>=1e4?sci(L(x),2):F(L(x),1)}</b>`;
    if(diverged){ verd.className='verdict bad'; verd.textContent=`✗ η ≥ 1/c: the stiff direction grows every step — diverging (|y| passed 10⁴, run stopped)`; }
    else if(c===1){ verd.className='verdict good'; verd.textContent='✓ c = 1: a round bowl — the gradient points straight at the bottom; η = 0.5 finishes in one step'; }
    else if(eta>=1/c-1e-9){ verd.className='verdict bad'; verd.textContent='✗ η ≥ 1/c: the stiff direction grows every step — diverging'; }
    else if(fy<0){ verd.className='verdict info'; verd.textContent=`the y-direction bounces (factor ${F(fy,3)}) while x creeps (factor ${F(fx,3)}): most of the motion is sideways`; }
    else { verd.className='verdict good'; verd.textContent='✓ both factors inside (−1, 1) and positive: smooth but slow — the stiff direction caps η at 1/c and the soft one crawls'; }
    drawSide(); paint(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function reset(){ stop(); x=start.slice(); path=[x.slice()]; diverged=false; paintPath(); draw(); }
  function play(){ stop(); const tok=run; x=start.slice(); path=[x.slice()]; diverged=false; paintPath(); draw(); let k=0;
    const step=()=>{ if(tok!==run) return; if(k>=K){ draw(); return; } const gr=grad(x), nx=[x[0]-eta*gr[0],x[1]-eta*gr[1]], x0=x.slice();
      if(!isFinite(nx[0])||!isFinite(nx[1])||Math.abs(nx[1])>1e4||Math.abs(nx[0])>1e4){ diverged=true; draw(); return; }
      anim=tween(220,u=>paint([x0[0]+(nx[0]-x0[0])*u,x0[1]+(nx[1]-x0[1])*u],path.length-1),()=>{ x=nx; k++; path.push(x.slice()); paintPath(); draw(); step(); }); };
    step(); }
  document.getElementById('cn-play').addEventListener('click',play);
  document.getElementById('cn-reset').addEventListener('click',reset);
  bindCtl('cn-c',v=>{ stop(); c=v; x=start.slice(); path=[x.slice()]; diverged=false; reshapeAll(); paintPath(); draw(); },v=>fmt(v,1))();
  bindCtl('cn-eta',v=>{ stop(); eta=v; x=start.slice(); path=[x.slice()]; diverged=false; paintPath(); draw(); },v=>fmt(v,3))();
  bindCtl('cn-k',v=>{ K=v|0; draw(); },v=>String(v|0))();
  const bar=document.getElementById('cn-presets'); bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ const P=PRE[btn.dataset.p]; if(!P) return; pressOnly(bar,btn); start=P.slice(); reset(); }));
  /* self-check: the companion's trace for c = 4, η = 0.24 from (10, 10) */
  (function(){ let v=[10,10]; const tr=[],Ls=[500]; for(let i=0;i<6;i++){ v=[(1-0.48)*v[0],(1-1.92)*v[1]]; tr.push('('+v[0].toFixed(3)+', '+v[1].toFixed(3)+')'); Ls.push(v[0]*v[0]+4*v[1]*v[1]); }
    console.info('U10 canyon c = 4, η = 0.24: '+tr.join(' → ')+' · L: '+Ls.map(l=>l.toFixed(1)).join(' → ')); if(tr[0]!=='(5.200, -9.200)'||Math.abs(Ls[6]-147.1)>0.1) console.warn('W8 trace unexpected'); })();
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W9 · THE COMPASS CROSSES THE CONTOUR LINES ================= */
(function(){
  const box=document.getElementById('w-compass'),svg=document.getElementById('cp-svg'),read=document.getElementById('cp-read'),verd=document.getElementById('cp-verdict');
  if(!box||!svg) return;
  const FN={circle:{a:1,b:0,name:'F = x² + y²'},ellipse:{a:4,b:0,name:'F = x² + 4y²'},tilted:{a:1,b:1,name:'F = x² + xy + y²'}};
  let tab='ellipse',pt=[2.2,1.1],anim=null,run=0,dragging=false,P=null; const CD={};
  const Q=()=>FN[tab], Fv=v=>{ const {a,b}=Q(); return v[0]*v[0]+b*v[0]*v[1]+a*v[1]*v[1]; }, grad=v=>{ const {a,b}=Q(); return [2*v[0]+b*v[1],b*v[0]+2*a*v[1]]; };
  const radius=(th,c)=>{ const {a,b}=Q(); const ct=Math.cos(th),st=Math.sin(th); return Math.sqrt(c/(ct*ct+b*ct*st+a*st*st)); };
  function draw(cur){
    const v=cur||pt, R=3, RX=4.8, RY=2.8; P=plane(svg,-RX,RX,-RY,RY,{pad:24,tickEvery:1}); const p=P, glow=p.glow, clip=planeClip(p,-RX,RX,-RY,RY);
    const fmax=Math.max(Fv([RX,RY]),Fv([RX,-RY]))*.9, lv=[]; for(let i=1;i<=10;i++) lv.push(fmax*Math.pow(i/10,2));
    const segPath=segs=>{ let d=''; segs.forEach(s=>{ d+=`M${p.px(s[0]).toFixed(1)},${p.py(s[1]).toFixed(1)}L${p.px(s[2]).toFixed(1)},${p.py(s[3]).toFixed(1)}`; }); return d; };
    if(!CD[tab]) CD[tab]=contourSegs((x,y)=>Fv([x,y]),lv,-RX,RX,-RY,RY,100).map(({segs})=>segPath(segs));
    const cg=el('g',{opacity:.4,'clip-path':clip},svg); CD[tab].forEach(d=>el('path',{d,stroke:'var(--s1)','stroke-width':1.3,fill:'none'},cg));
    /* the level curve through the point, drawn bright (parametric) */
    const c=Fv(v); if(c>1e-4){ let d=''; for(let i=0;i<=180;i++){ const th=i/180*2*Math.PI, r=radius(th,c); d+=(i?'L':'M')+p.px(r*Math.cos(th)).toFixed(1)+','+p.py(r*Math.sin(th)).toFixed(1); } el('path',{d:d+'Z',stroke:'var(--s1)','stroke-width':2.2,fill:'none',opacity:.95,'clip-path':clip,filter:glow||'none'},svg); }
    glowDot(svg,p.px(0),p.py(0),4.5,'var(--s3)',glow); txt(svg,p.px(0)+8,p.py(0)+14,'minimum','font:700 10px system-ui;fill:var(--s3)');
    const g=grad(v), gn=Math.hypot(g[0],g[1]);
    if(gn>1e-6){ const Lg=Math.min(1.3,.25*gn), u=[g[0]/gn,g[1]/gn], tg=[-u[1],u[0]];
      /* tangent through the point (⟂ ∇F) */
      el('line',{x1:p.px(v[0]-tg[0]*.9),y1:p.py(v[1]-tg[1]*.9),x2:p.px(v[0]+tg[0]*.9),y2:p.py(v[1]+tg[1]*.9),stroke:'var(--s7)','stroke-width':2.4,'stroke-linecap':'round',filter:glow||'none','clip-path':clip},svg);
      txt(svg,p.px(v[0]+tg[0]*.95),p.py(v[1]+tg[1]*.95)+(tg[1]>0?-6:12),'contour tangent','font:700 9.5px system-ui;fill:var(--s7)',tg[0]>=0?'start':'end');
      /* right-angle marker */
      const s=.16, m1=[v[0]+u[0]*s,v[1]+u[1]*s], m2=[v[0]+u[0]*s+tg[0]*s,v[1]+u[1]*s+tg[1]*s], m3=[v[0]+tg[0]*s,v[1]+tg[1]*s];
      el('path',{d:`M${p.px(m1[0])},${p.py(m1[1])}L${p.px(m2[0])},${p.py(m2[1])}L${p.px(m3[0])},${p.py(m3[1])}`,stroke:'var(--ink)','stroke-width':1.4,fill:'none',opacity:.9},svg);
      /* to the bottom (dashed, s3) then the gradient (s2) on top */
      const dist=Math.hypot(v[0],v[1]); if(dist>.05){ const Lb=Math.min(1.3,Lg), e=[v[0]-v[0]/dist*Lb,v[1]-v[1]/dist*Lb]; const ar=arrow(p,v[0],v[1],e[0],e[1],'var(--s3)',2.4,'to the bottom','font:700 10px system-ui;fill:var(--s3)'); ar.querySelector('line').setAttribute('stroke-dasharray','6 4'); }
      arrow(p,v[0],v[1],v[0]+u[0]*Lg,v[1]+u[1]*Lg,'var(--s2)',2.8,'∇F','font:700 11px system-ui;fill:var(--s2)'); }
    const dot=el('g',{style:'cursor:grab'},svg); glowDot(dot,p.px(v[0]),p.py(v[1]),7,'var(--s4)',glow);
    const ang=angleDeg(g,v);   /* between −∇F and the line to the minimum */
    txt(svg,30,16,Q().name+' · drag the point','font:600 10.5px system-ui;fill:var(--ink-muted)');
    const chip=el('g',{},svg); el('rect',{x:366,y:4,width:228,height:20,rx:10,fill:'var(--surface)',stroke:'var(--s2)',opacity:.95},chip); txt(chip,480,18,`∇F ⟂ contour: 90.0° · ∇F vs bottom: ${isNaN(ang)?'—':F(ang,1)+'°'}`,'font:700 9.5px system-ui;fill:var(--s2)','middle');
    if(!cur){ read.innerHTML=`F(x, y) = <b>${F(c,3)}</b> at (<b>${F(v[0],2)}</b>, <b>${F(v[1],2)}</b>)<br>∇F = (<b>${F(g[0],3)}</b>, <b>${F(g[1],3)}</b>)<br>a tiny move δx along the contour changes F by ∇F·δx = 0 → ∇F ⟂ contour (angle = <b>90.0°</b>)<br>angle between ∇F and the straight line to the minimum = <b>${isNaN(ang)?'—':F(ang,1)+'°'}</b>`;
      if(tab==='circle'){ verd.className='verdict good'; verd.textContent='✓ round bowl: across the contour IS toward the centre — the gradient points at the answer'; }
      else { verd.className='verdict info'; verd.textContent=`stretched bowl: across the contour is not toward the centre — that gap (${isNaN(ang)?'—':F(ang,1)+'°'}) is the zig-zag`; } }
  }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function play(){ stop(); const tok=run; const c=Fv(pt); if(c<1e-4) return; const th0=Math.atan2(pt[1],pt[0]);
    anim=tween(3000,u=>{ if(tok!==run) return; const th=th0+u*2*Math.PI, r=radius(th,c); draw([r*Math.cos(th),r*Math.sin(th)]); },()=>{ draw(); }); }
  const toPt=e=>{ const q=planePt(svg,P,e); return [Math.max(-4.6,Math.min(4.6,q[0])),Math.max(-2.7,Math.min(2.7,q[1]))]; };
  svg.addEventListener('pointerdown',e=>{ if(!P) return; const q=toPt(e); if(Math.hypot(q[0]-pt[0],q[1]-pt[1])>.6) return; stop(); dragging=true; try{ svg.setPointerCapture(e.pointerId); }catch(_){ } });
  svg.addEventListener('pointermove',e=>{ if(!dragging) return; pt=toPt(e); draw(); });
  const up=()=>{ dragging=false; }; svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',up);
  document.getElementById('cp-play').addEventListener('click',play);
  tabs(document.getElementById('cp-tabs'),t=>{ stop(); tab=t; draw(); });
  draw();
})();

/* ================= W10 · CHANGE THE UNITS, NOT THE MODEL (three.js, live morph) ================= */
(function(){
  const box=document.getElementById('un-3d'),side=document.getElementById('un-side'),read=document.getElementById('un-read'),verd=document.getElementById('un-verdict');
  if(!box) return;
  let t=0,scheme='standardise',frac=0.9,K=30,pr=GB.problem(0,'standardise'),w=null,path=[],sc=null,hudEl=null,anim=null,run=0,ST=null,contourTick=0,lastRun=null;
  const startOf=p=>[p.ws[0]+2.0*p.hx/2.5,p.ws[1]+0.25*p.hy/0.5];   /* the hero's raw start, scaled with the window */
  const zsOf=p=>{ let zm=0; for(let i=0;i<=16;i++) for(let j=0;j<=16;j++){ const v=p.J([p.ws[0]-p.hx+2*p.hx*i/16,p.ws[1]-p.hy+2*p.hy*j/16])-p.Jstar; if(v>zm) zm=v; } return 1.6/(zm||1); };
  let ZS=zsOf(pr);
  const P3=(x,y,z)=>[(x-pr.ws[0])/pr.hx*2.2,(z-pr.Jstar)*ZS,-(y-pr.ws[1])/pr.hy*2.2], at=v=>P3(v[0],v[1],pr.J(v));
  const fs=(u,v)=>pr.J([pr.ws[0]+u/2.2*pr.hx,pr.ws[1]+v/2.2*pr.hy])-pr.Jstar;
  const levels=()=>{ const zm=1.6/ZS, lv=[]; for(let i=1;i<=8;i++) lv.push(zm*Math.pow(i/9,2)); return lv; };
  function setProblem(){ pr=GB.problem(t,scheme); ZS=zsOf(pr); }
  function build(){
    sc=null; const narrow=box.clientWidth<560;
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[5.2,4.8,7.0]:[4.4,3.8,6.0],look:[0,.45,0],fov:34},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        const surf=CIN.prim.surface(ctx,fs,{x:[-2.2,2.2],y:[-2.2,2.2],res:80,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:.93}); root.add(surf); reshape(ctx,surf,fs,ZS,null,.6);
        const floorY=-.16; const grid=CIN.prim.grid(ctx,5,20,hx('grid'),{opacity:isLight?.5:.32}); grid.position.y=floorY; root.add(grid);
        const contG=new THREE.Group(); root.add(contG); contG.add(liftedContours(ctx,fs,levels(),-2.2,2.2,-2.2,2.2,ZS,hx('ink2'),{N:64}));
        const star=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s3'),.05)); root.add(star); root.add(tube(ctx,[0,floorY,0],[0,0,0],hx('s3'),.006,.6)); root.add(CIN.prim.label(ctx,'w*',[0,.16,0],{size:18,color:colors.s3,bg:false,depthTest:false}));
        [['w₁ →',[2.5,floorY,2.3]],['w₂ →',[-2.3,floorY,-2.55]]].forEach(([tt,p])=>root.add(CIN.prim.label(ctx,tt,p,{size:24,color:colors.muted,bg:false,depthTest:false})));
        const walker=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.06),12); root.add(walker); const halo=haloSprite(ctx,hx('s4'),.5); root.add(halo);
        const pathG=new THREE.Group(); root.add(pathG); const lab=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,surf,contG,walker,halo,pathG,lab,floorY};
        hudEl=hud(box); hint(box,'drag to orbit');
        paint(); paintPath();
      },
      update(){ return false; }
    });
    if(handle) grab(handle,()=>false,()=>{});
    return handle;
  }
  let ctTimer=null; const contours=()=>{ if(!sc) return; clearGroup(sc.contG); sc.contG.add(liftedContours(sc.ctx,fs,levels(),-2.2,2.2,-2.2,2.2,ZS,sc.hx('ink2'),{N:64})); RR(sc.ctx); };
  function morph(force){ if(!sc) return; reshape(sc.ctx,sc.surf,fs,ZS,null,.6); contourTick++; clearTimeout(ctTimer); if(force||contourTick%3===0) contours(); else ctTimer=setTimeout(contours,90);   /* every third frame while sliding, and always once the finger stops */ RR(sc.ctx); }
  function paint(cur,k){ if(!sc) return; const v=cur||w, {walker,halo,ctx,lab}=sc; const q=at(v); const vis=Math.abs(q[0])<=2.4&&Math.abs(q[2])<=2.4; walker.visible=vis; halo.visible=vis;
    walker.position.set(q[0],q[1]+.012,q[2]); halo.position.copy(walker.position); const kk=k==null?path.length-1:k;
    if(vis) lab.set(`step ${kk} · J = ${nm(pr.J(v).toFixed(2))}`,[q[0],q[1]+.24,q[2]],{size:18,color:sc.colors.s4,bg:false,depthTest:false}); else lab.hide();
    if(hudEl) hudEl.innerHTML=`t = <b>${F(t,2)}</b> · κ = <b>${pr.kappa>=100?F(pr.kappa,0):F(pr.kappa,1)}</b> · 2/λ_max = <b>${pr.lim<0.01?sci(pr.lim,2):F(pr.lim,3)}</b>`;
    RR(ctx); }
  function paintPath(){ if(!sc) return; clearGroup(sc.pathG); const pts=path.map(p=>{ const q=at(p); q[1]+=.01; return q; }).filter(q=>Math.abs(q[0])<=2.4&&Math.abs(q[2])<=2.4); if(pts.length>=2) sc.pathG.add(polyTube(sc.ctx,pts,sc.hx('s3'),.018)); RR(sc.ctx); }
  function drawSide(){ side.innerHTML=''; const glow=glo(side); const lg=v=>Math.log10(Math.max(1e-3,v)); const y0=128,y1=22, py=v=>y0-(lg(v)+0.5)/(4)*(y0-y1);
    txt(side,14,14,'Hessian eigenvalues (log)','font:600 9px system-ui;fill:var(--ink-muted)');
    [0,1,2,3].forEach(e=>{ const y=py(Math.pow(10,e)); el('line',{x1:30,y1:y,x2:130,y2:y,stroke:'var(--grid)'},side); txt(side,26,y+3,'10'+SUP(e),'font:500 8.5px system-ui;fill:var(--ink-muted)','end'); });
    [[48,pr.l1,'var(--s2)','λ_max'],[100,pr.l2,'var(--s3)','λ_min']].forEach(([x,v,col,lab])=>{ const g=el('g',{},side); if(glow) g.setAttribute('filter',glow); el('rect',{x:x-12,y:py(v),width:24,height:Math.max(2,y0-py(v)),rx:4,fill:col,opacity:.9},g); txt(side,x,py(v)-5,v>=100?F(v,0):F(v,2),`font:700 9.5px system-ui;fill:${col}`,'middle'); txt(side,x,y0+12,lab,'font:600 9px system-ui;fill:var(--ink-2)','middle'); });
    txt(side,74,y0+27,'κ = '+(pr.kappa>=100?F(pr.kappa,0):F(pr.kappa,2)),'font:800 12px system-ui;fill:var(--s4)','middle');
    /* loss vs step of the last run */
    const R=lastRun; txt(side,150,14,'J per step of the last run (log)','font:600 9px system-ui;fill:var(--ink-muted)');
    el('rect',{x:150,y:22,width:140,height:106,rx:5,fill:'none',stroke:'var(--line, var(--ring))'},side);
    if(R&&R.length>1){ const lo=Math.log10(Math.max(1e-6,Math.min(...R))), hi=Math.log10(Math.max(...R,1e-5)); const sx=i=>154+i/(R.length-1)*132, sy=v=>124-(Math.log10(Math.max(1e-6,v))-lo)/((hi-lo)||1)*98; let d=''; R.forEach((v,i)=>{ d+=(i?'L':'M')+sx(i).toFixed(1)+','+sy(v).toFixed(1); }); el('path',{d,stroke:'var(--s4)','stroke-width':2,fill:'none',filter:glow||'none'},side); txt(side,286,124,'J = '+(R[R.length-1]<1e-3?sci(R[R.length-1],1):F(R[R.length-1],3)),'font:700 9px system-ui;fill:var(--s4)','end'); }
    else txt(side,220,80,'press ▶','font:600 10px system-ui;fill:var(--ink-muted)','middle');
    const Hm=pr.H; txt(side,14,172,`H(t) = [[${F(Hm[0][0],2)}, ${F(Hm[0][1],2)}], [${F(Hm[1][0],2)}, ${F(Hm[1][1],2)}]]`,'font:600 9.5px system-ui;fill:var(--ink-2)');
    txt(side,14,188,`2/λ_max = ${pr.lim<0.01?sci(pr.lim,2):F(pr.lim,3)} · η = ${F(frac,2)}·2/λ_max = ${pr.lim*frac<0.01?sci(pr.lim*frac,2):F(pr.lim*frac,4)}`,'font:600 9.5px system-ui;fill:var(--ink-2)');
    txt(side,14,203,{standardise:'z = (x − t·μ)/σᵗ',minmax:'z = (x − t·min)/rangeᵗ',whiten:'standardise, then rotate by the eigenvectors, then divide by √λ'}[scheme],'font:600 9px system-ui;fill:var(--ink-muted)');
    txt(side,14,216,'H = 2ZᵀZ · κ = λ_max / λ_min','font:600 9px system-ui;fill:var(--ink-muted)'); }
  const stepsFor=(p,fr)=>{ const eta=fr*2/p.l1, f=Math.abs(1-eta*p.l2); return f>=1?Infinity:(f===0?1:Math.ceil(Math.log(100)/Math.abs(Math.log(f)))); };
  function draw(){ const eta=frac*pr.lim, s0=stepsFor(GB.problem(0,scheme),frac), s1=stepsFor(GB.problem(1,scheme),frac), sN=stepsFor(pr,frac), k=path.length-1, dist=Math.hypot(w[0]-pr.ws[0],w[1]-pr.ws[1]), J=pr.J(w);
    const H=pr.H, kf=pr.kappa>=100?F(pr.kappa,0):F(pr.kappa,2);
    read.innerHTML=`H(t) = [[<b>${F(H[0][0],2)}</b>, <b>${F(H[0][1],2)}</b>],[<b>${F(H[1][0],2)}</b>, <b>${F(H[1][1],2)}</b>]]<br>λ_max = <b>${pr.l1>=100?F(pr.l1,1):F(pr.l1,2)}</b>, λ_min = <b>${F(pr.l2,2)}</b>, κ = <b>${kf}</b><br>largest safe stride 2/λ_max = <b>${pr.lim<0.01?sci(pr.lim,2):F(pr.lim,3)}</b><br>steps to shrink the error 100× along the soft direction at η = ${F(frac,2)}·2/λ_max ≈ <b>${isFinite(sN)?sN:'∞'}</b> (≈ ${isFinite(s0)?s0:'∞'} at raw units vs ${isFinite(s1)?s1:'∞'} ${scheme==='standardise'?'standardised':scheme==='minmax'?'min–max scaled':'whitened'})<br>after <b>${k}</b> steps: J = <b>${J<1e-3&&J>0?sci(J,2):F(J,3)}</b>, distance to w* = <b>${dist<1e-3&&dist>0?sci(dist,2):F(dist,3)}</b>`;
    if(scheme==='standardise'&&t<0.2){ verd.className='verdict bad'; verd.textContent=`✗ κ ≈ ${kf}: a razor blade — the safe stride is set by the stiff wall and the soft floor gets ${F(100/pr.kappa,2)} steps' worth of progress per 100`; }
    else if(t>=0.99&&scheme==='standardise'){ verd.className='verdict good'; verd.textContent='✓ κ ≈ 10 — the same problem, re-measured: nothing about the model or the data\'s meaning changed, only the units'; }
    else if(t>=0.99&&scheme==='whiten'){ verd.className='verdict good'; verd.textContent='✓ κ = 1: a perfect bowl — whitening also removed the tilt; the gradient points straight at the answer'; }
    else if(t>=0.99&&scheme==='minmax'){ verd.className='verdict good'; verd.textContent='✓ κ ≈ 1.18 inside the unit box — on this data the min–max columns happen to be uncorrelated'; }
    else if(t<0.2){ verd.className='verdict bad'; verd.textContent=`✗ κ ≈ ${kf}: a razor blade — slide t to re-measure the columns`; }
    else { verd.className='verdict info'; verd.textContent=`${scheme==='standardise'?'standardising':scheme==='minmax'?'min–max scaling':'whitening'}… κ = ${kf}`; }
    drawSide(); paint(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } }
  function reset(){ stop(); w=startOf(pr); path=[w.slice()]; paintPath(); draw(); }
  function play(){ stop(); const tok=run; w=startOf(pr); path=[w.slice()]; lastRun=[pr.J(w)]; paintPath(); draw(); let k=0; const eta=frac*pr.lim;
    const step=()=>{ if(tok!==run) return; if(k>=K){ draw(); return; } const gr=pr.grad(w), nw=[w[0]-eta*gr[0],w[1]-eta*gr[1]], w0=w.slice();
      if(!isFinite(nw[0])||!isFinite(nw[1])||Math.hypot(nw[0],nw[1])>1e6){ draw(); return; }
      anim=tween(140,u=>paint([w0[0]+(nw[0]-w0[0])*u,w0[1]+(nw[1]-w0[1])*u],path.length-1),()=>{ w=nw; k++; path.push(w.slice()); lastRun.push(pr.J(w)); paintPath(); draw(); step(); }); };
    step(); }
  function setT(v,force){ stop(); t=v; setProblem(); morph(force); w=startOf(pr); path=[w.slice()]; paintPath(); draw(); }
  w=startOf(pr); path=[w.slice()];
  document.getElementById('un-play').addEventListener('click',play);
  document.getElementById('un-reset').addEventListener('click',reset);
  bindCtl('un-t',v=>setT(v));
  bindCtl('un-eta',v=>{ frac=v; draw(); })();
  bindCtl('un-k',v=>{ K=v|0; draw(); },v=>String(v|0))();
  const bar=document.getElementById('un-scheme'); bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ pressOnly(bar,btn); scheme=btn.dataset.p; lastRun=null; setT(t,true); }));
  /* self-check: the three t = 1 Hessians */
  (function(){ const s=GB.problem(1,'standardise'), m=GB.problem(1,'minmax'), wh=GB.problem(1,'whiten'); const r=v=>Math.round(v*1000)/1000;
    console.info('U10 schemes at t = 1 · standardise λ = '+r(s.l1)+', '+r(s.l2)+' κ = '+r(s.kappa)+' · minmax λ = '+r(m.l1)+', '+r(m.l2)+' κ = '+r(m.kappa)+' · whiten λ = '+r(wh.l1)+', '+r(wh.l2)+' κ = '+r(wh.kappa));
    if(Math.abs(m.l1-2.367)>1e-2||Math.abs(wh.kappa-1)>1e-6) console.warn('W10 scheme Hessians unexpected'); })();
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W11 · THE TRAINING CLINIC ================= */
(function(){
  const box=document.getElementById('w-clinic'),svg=document.getElementById('cl-svg'),panel=document.getElementById('cl-panel'),read=document.getElementById('cl-read'),verd=document.getElementById('cl-verdict');
  if(!box||!svg) return;
  const seq=(n,f)=>{ const a=[]; for(let i=0;i<n;i++) a.push(f(i)); return a; };
  const CASES=[
    {name:'NaN',loss:[3.2,8e5,2e11,Infinity,NaN],diag:'overflow: huge start or unscaled features',fix:'initialise in [−1, 1], scale the features, lower η',why:'a sawtooth or a plateau never produces NaN — only numbers that outgrew float64',ghost:seq(6,i=>3.2*Math.pow(0.42,i))},
    {name:'memoriser',train:seq(61,i=>Math.max(0.004,4*Math.exp(-i/10)-0.01)),test:seq(61,i=>0.9+(i<=25?3.1*Math.pow(1-i/25,2):2.2*Math.pow((i-25)/35,1.3))),diag:'overfitting: more knobs than facts',fix:'more data, fewer knobs, regularise, stop early',why:'the train loss is perfectly healthy — only the unseen data complains',ghost:seq(61,i=>0.9+3.1*Math.exp(-i/9))},
    {name:'oscillates',loss:seq(24,i=>((i%2?4:12)+(i%2?[0,1,2]:[0,-1,1])[(i>>1)%3])*(1+0.02*i)),diag:'η above 2/λ_max in the stiff direction',fix:'reduce η or standardise the features',why:'a plateau is flat and overfitting is smooth — a growing sawtooth is a step that is too long',ghost:seq(24,i=>12*Math.pow(0.7,i)+0.6)},
    {name:'fast then crawls',loss:seq(209,i=>i<=8?40-37*(1-Math.pow(1-i/8,2.2)):3-0.4*(1-Math.exp(-(i-8)/70))),diag:'zig-zag in a badly conditioned canyon',fix:'standardise; momentum / adaptive steps (next unit)',why:'nothing overflowed and nothing oscillates visibly — the stiff direction was solved in 8 steps and the soft one crawls',ghost:seq(209,i=>0.6+39.4*Math.exp(-i/9))},
    {name:'flat from the start',loss:seq(201,i=>i<4?[6,5.99,5.99,5.98][i]:5.98-0.0004*(i-3)-0.002*Math.abs(Math.sin(i/5))),diag:'a plateau, or η far too small',fix:'raise η, better start, check the gradient code',why:'a canyon still drops fast at first and overfitting needs a falling train loss — this one never moved',ghost:seq(201,i=>0.5+5.5*Math.exp(-i/25))},
    {name:'different every time',runs:[seq(81,i=>0.4+5.6*Math.exp(-i/12)),seq(81,i=>2.1+3.9*Math.exp(-i/9)),seq(81,i=>0.4+5.6*Math.exp(-i/16))],diag:'several local minima, different basins',fix:'restarts, keep the best — or accept it',why:'each run is smooth and settles — they just settle in different valleys',ghost:seq(81,i=>0.4+5.6*Math.exp(-i/12))}
  ];
  const POS=[2,4,1,3,2,4]; let ci=0, solved=new Set(), answered={};
  const fmtL=v=>v===Infinity?'∞':(v!==v?'NaN':(v>=1e4?sci(v,0).replace('e+','e'):(v>=100?F(v,0):(v<0.01?sci(v,1):F(v,v<10?2:1)))));
  function draw(){
    const C=CASES[ci]; svg.innerHTML=''; const glow=glo(svg);
    const series=C.runs?C.runs.map((r,i)=>({v:r,col:['var(--s4)','var(--s7)','var(--s2)'][i],w:2.2,lab:'seed '+(i+1)})):(C.train?[{v:C.train,col:'var(--s3)',w:2.4,lab:'train'},{v:C.test,col:'var(--s2)',w:2.4,lab:'test'}]:[{v:C.loss,col:'var(--s4)',w:2.6,lab:'loss'}]);
    const fin=[].concat(...series.map(s=>s.v)).filter(v=>isFinite(v)&&v>0); const ghost=answered[ci]==='ok'?C.ghost:null; if(ghost) fin.push(...ghost.filter(v=>v>0));
    let lo=Math.log10(Math.min(...fin)), hi=Math.log10(Math.max(...fin)); if(hi-lo<0.05){ const m=(hi+lo)/2; lo=m-0.025; hi=m+0.025; } const pad=(hi-lo)*.08; lo-=pad; hi+=pad;
    const N=Math.max(...series.map(s=>s.v.length))-1, ys=(hi-lo)>3?2:((hi-lo)>1?1:((hi-lo)>0.3?0.2:0.01));
    const p=frame(svg,0,N,lo,hi,{l:52,r:30,t:32,b:30,xs:N>100?50:(N>20?10:1),ys,yf:v=>{ const x=Math.pow(10,v); return x>=1e4||x<0.01?nm(x.toExponential(0)).replace('e+','e'):nm(fmt(x,2)); },xf:v=>String(Math.round(v))});
    txt(svg,p.L+6,p.T-10,`case ${ci+1} · ${C.name} · loss against step`,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    if(ghost){ let d=''; let started=false; ghost.forEach((v,i)=>{ if(!(v>0)) return; d+=(started?'L':'M')+p.px(i).toFixed(1)+','+p.py(Math.log10(v)).toFixed(1); started=true; }); el('path',{d,stroke:'var(--s3)','stroke-width':2,fill:'none','stroke-dasharray':'6 4',opacity:.85,'clip-path':p.clip},svg); txt(svg,p.W-p.R-4,p.T+12,'after the fix (ghost)','font:700 10px system-ui;fill:var(--s3)','end'); }
    series.forEach((s,si)=>{ let d='',started=false; s.v.forEach((v,i)=>{ if(!(isFinite(v)&&v>0)){ started=false; return; } d+=(started?'L':'M')+p.px(i).toFixed(1)+','+p.py(Math.log10(v)).toFixed(1); started=true; });
      if(d) glowPath(svg,d,s.col,s.w,glow,{opacity:.95,'clip-path':p.clip}); s.v.forEach((v,i)=>{ if(isFinite(v)&&v>0&&(s.v.length<=30)) el('circle',{cx:p.px(i),cy:p.py(Math.log10(v)),r:3,fill:s.col},svg); });
      if(series.length>1){ txt(svg,p.L+8+si*70,p.T+12,'— '+s.lab,`font:700 10px system-ui;fill:${s.col}`); }
      s.v.forEach((v,i)=>{ if(isFinite(v)) return; const x=p.px(i), y=p.T+8; const pid='hatch-'+svg.id; if(!svg.querySelector('#'+pid)){ const defs=svg.querySelector('defs')||el('defs',{},svg); const pat=el('pattern',{id:pid,width:6,height:6,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs); el('line',{x1:0,y1:0,x2:0,y2:6,stroke:'var(--critical)','stroke-width':2},pat); }
        const g=el('g',{},svg); el('rect',{x:x-20,y,width:40,height:22,rx:6,fill:'var(--page)'},g); el('rect',{x:x-20,y,width:40,height:22,rx:6,fill:'url(#'+pid+')',opacity:.5,stroke:'var(--critical)','stroke-width':1.4},g); txt(g,x,y+15,v!==v?'NaN':'∞','font:800 12px system-ui;fill:var(--critical)','middle'); el('line',{x1:x,y1:y+22,x2:x,y2:p.H-p.B,stroke:'var(--critical)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.6},svg); }); });
    if(C.test){ const i=25; el('line',{x1:p.px(i),y1:p.T,x2:p.px(i),y2:p.H-p.B,stroke:'var(--s2)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.6},svg); txt(svg,p.px(i)+4,p.H-p.B-8,'test turns up at step 25','font:700 9.5px system-ui;fill:var(--s2)'); }
    txt(svg,p.W-p.R-2,p.H-4,'step','font:600 9.5px system-ui;fill:var(--ink-muted)','end');
    /* readout: the raw numbers */
    const compact=a=>{ if(a.length<=8) return a.map(fmtL).join(' → '); const idx=[0,1,2,3,Math.floor(a.length/2),a.length-2,a.length-1]; return idx.map((i,k)=>(k===4?'… '+fmtL(a[i])+' (step '+i+')':fmtL(a[i]))).join(' → '); };
    read.innerHTML=C.runs?C.runs.map((r,i)=>`seed ${i+1}: ${compact(r)}`).join('<br>'):(C.train?`train: ${compact(C.train)}<br>test: ${compact(C.test)}`:`loss: ${compact(C.loss)}`);
    drawPanel();
  }
  function drawPanel(){ const C=CASES[ci]; const wrong=[1,2,3].map(k=>CASES[(ci+k)%6].diag); const opts=[]; let wi=0; for(let k=1;k<=4;k++) opts.push(k===POS[ci]?{d:C.diag,ok:true}:{d:wrong[wi++],ok:false});
    panel.innerHTML=`<div style="font-family:var(--ui);font-size:.86rem;color:var(--ink-2);margin-bottom:.4rem">diagnosis? <span class="chip" style="float:right">${solved.size} of 6 diagnosed</span></div><div class="presets" id="cl-opts" style="flex-direction:column;align-items:stretch">${opts.map((o,i)=>`<button class="preset" data-d="${i}" data-ok="${o.ok?1:0}" style="text-align:left">${o.d}</button>`).join('')}</div>`;
    panel.querySelectorAll('[data-d]').forEach(btn=>btn.addEventListener('click',()=>{ const ok=btn.dataset.ok==='1'; panel.querySelectorAll('[data-d]').forEach(b=>b.setAttribute('aria-pressed',b===btn?'true':'false'));
      if(ok){ solved.add(ci); answered[ci]='ok'; verd.className='verdict good'; verd.textContent=`✓ ${C.diag} — fix: ${C.fix}`; draw(); }
      else { answered[ci]='no'; verd.className='verdict bad'; verd.textContent=`✗ not this one: ${C.why} — try again`; drawPanel(); } })); }
  const bar=document.getElementById('cl-cases'); bar.querySelectorAll('[data-c]').forEach(btn=>btn.addEventListener('click',()=>{ pressOnly(bar,btn); ci=(+btn.dataset.c)-1; verd.className='verdict info'; verd.textContent=`case ${ci+1} · ${CASES[ci].name}: read the curve, then pick the diagnosis`; draw(); }));
  verd.className='verdict info'; verd.textContent='case 1 · NaN: read the curve, then pick the diagnosis';
  draw();
})();

/* ================= OPENING SHOT · the canyon becomes a bowl ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced;
  const RAW=GB.problem(0), STD=GB.problem(1);
  const STEP=.1, NST=40, T_RAW=4.5, T_MORPH=2.5, T_STD=4.5, T_BACK=2;
  function descent(pr,start,gam){ const pts=[start.slice()]; let w=start.slice(); for(let k=0;k<NST;k++){ const g=pr.grad(w); w=[w[0]-gam*g[0],w[1]-gam*g[1]]; pts.push(w.slice()); } return pts; }
  const PATH_RAW=descent(RAW,[RAW.ws[0]+2.0,RAW.ws[1]+0.25],0.0011)   /* (2.0, 0.25) rather than (2.0, 0.08): with the w₂ window at ± 0.5 the bounce must climb the walls to read as wall-to-wall */, PATH_STD=descent(STD,[STD.ws[0]+2.6,STD.ws[1]+2.2],0.17);
  const zsOf=p=>{ let zm=0; for(let i=0;i<=16;i++) for(let j=0;j<=16;j++){ const v=p.J([p.ws[0]-p.hx+2*p.hx*i/16,p.ws[1]-p.hy+2*p.hy*j/16])-p.Jstar; if(v>zm) zm=v; } return 1.6/(zm||1); };
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:.04,autoRotateStopsOnUser:true,
      camera:{pos:wide?[4.6,10.4,8.8]:[1.8,11.0,8.2],look:wide?[-2.0,-.7,.9]:[0,-.3,.4],fov:32},
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]), dark=!isLight;
        if(dark){ const n=600, sp=new Float32Array(n*3); for(let k=0;k<n;k++){ let x,y,z; do{ x=(Math.random()*2-1)*26; y=(Math.random()*2-1)*14; z=(Math.random()*2-1)*26-6; }while(Math.hypot(x-5,y-5,z-7)<7); sp[3*k]=x; sp[3*k+1]=y; sp[3*k+2]=z; }
          const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
          root.add(new THREE.Points(sg,new THREE.PointsMaterial({color:hx('ink2'),size:.06,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}))); }
        { const top=new THREE.DirectionalLight(0xffffff,dark?.55:.25); top.position.set(2,8,3); root.add(top); }   /* the trench floor must read even under the hero scrim */
        let pr=RAW, ZS=zsOf(pr);
        const fs=(u,v)=>pr.J([pr.ws[0]+u/2.2*pr.hx,pr.ws[1]+v/2.2*pr.hy])-pr.Jstar;
        const P3=(x,y,z)=>[(x-pr.ws[0])/pr.hx*2.2,(z-pr.Jstar)*ZS,-(y-pr.ws[1])/pr.hy*2.2], at=v=>P3(v[0],v[1],pr.J(v));
        const levels=()=>{ const zm=1.6/ZS, lv=[]; for(let i=1;i<=8;i++) lv.push(zm*Math.pow(i/9,2)); return lv; };
        const surf=CIN.prim.surface(ctx,fs,{x:[-2.2,2.2],y:[-2.2,2.2],res:80,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:isLight?.97:.93}); root.add(surf); reshape(ctx,surf,fs,ZS,null,.55);
        { const vis=fadeAttr(THREE,surf), pos=surf.userData.geo.attributes.position; for(let i=0;i<pos.count;i++){ const u=pos.getX(i)/2.2, v=pos.getZ(i)/2.2, r=Math.pow(Math.pow(Math.abs(u),6)+Math.pow(Math.abs(v),6),1/6); vis.setX(i,r<.93?1:Math.max(0,1-(r-.93)/.07)); } vis.needsUpdate=true; }
        const floorY=-.3; const grid=CIN.prim.grid(ctx,9,18,hx('grid'),{opacity:isLight?.35:.22}); grid.position.y=floorY; root.add(grid);
        const contG=new THREE.Group(); root.add(contG); const rebuildContours=()=>{ clearGroup(contG); contG.add(liftedContours(ctx,fs,levels(),-2.2,2.2,-2.2,2.2,ZS,hx('ink2'),{N:64})); }; rebuildContours();
        const star=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s3'),.045)); root.add(star);
        const walker=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s4'),.085),12); root.add(walker);
        const halo=haloSprite(ctx,hx('s4'),.8); root.add(halo);
        const trailG=new THREE.Group(); root.add(trailG); const lab=slot(ctx,root); const hudEl=hud(box,'hud-b'); let trail=null;
        const setTrail=(pts,op)=>{ clearGroup(trailG); trail=null; if(pts.length>=2){ trail=ribbon(ctx,pts.map(p=>{ const q=at(p); q[1]+=.014; return q; }),hx('s3'),.028); trail.material.transparent=true; trail.material.opacity=op==null?1:op; trailG.add(trail); } };
        const setT=(t,cont)=>{ pr=GB.problem(t); ZS=zsOf(pr); reshape(ctx,surf,fs,ZS,null,.55); if(cont) rebuildContours(); };
        const place=(pos,k,tag)=>{ const q=at(pos); walker.position.set(q[0],q[1]+.012,q[2]); halo.position.copy(walker.position);
          lab.set(`${tag} · step ${k} · J = ${nm(pr.J(pos).toFixed(2))}`,[q[0],q[1]+.3,q[2]],{size:20,color:colors.s4,bg:false,depthTest:false,scale:.0075}); };
        const alpha=a=>{ walker.material.opacity=a; halo.material.opacity=(dark?.65:.32)*a; if(trail) trail.material.opacity=a; if(a<.02) lab.hide(); };
        const st={phase:'raw',t0:null,k:0,frame:0};
        box.dataset.phase=st.phase;
        ctx.hero={apply(t){ if(st.t0==null) st.t0=t; const e=t-st.t0; st.frame++;
          if(box.dataset.phase!==st.phase) box.dataset.phase=st.phase;   /* verify hook */
          if(st.phase==='raw'||st.phase==='std'){ const P=st.phase==='raw'?PATH_RAW:PATH_STD, tag=st.phase==='raw'?'raw units':'standardised';
            const kf=Math.min(NST,e/STEP), k=Math.floor(kf), u=CIN.ease.out(kf-k), a=P[k], b=P[Math.min(NST,k+1)]; const pos=[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
            if(k!==st.k){ st.k=k; setTrail(P.slice(0,k+1)); } place(pos,k,tag); alpha(1);
            if(hudEl) hudEl.innerHTML=st.phase==='raw'?'raw units · κ ≈ <b>1487</b> · a razor-blade trench':'standardised · κ ≈ <b>10</b> · a tilted bowl';
            if(e>=(st.phase==='raw'?T_RAW:T_STD)){ st.phase=st.phase==='raw'?'morph':'back'; st.t0=t; st.k=-1; setTrail(P); } }
          else { const dur=st.phase==='morph'?T_MORPH:T_BACK, u=Math.min(1,e/dur), tt=easeIO(st.phase==='morph'?u:1-u);
            setT(tt,st.frame%4===0||u>=1); alpha(Math.max(0,1-u*2.2));
            if(hudEl) hudEl.innerHTML=st.phase==='morph'?'standardising the columns…':'back to raw units…';
            if(u>=1){ st.phase=st.phase==='morph'?'std':'raw'; st.t0=t; st.k=-1; setTrail([]); } }
          return true; }};
        if(reduced){ setTrail(PATH_RAW); place(PATH_RAW[NST],NST,'raw units'); if(hudEl) hudEl.innerHTML='raw units · κ ≈ <b>1487</b> · 40 steps bouncing along the trench'; }
        else { place(PATH_RAW[0],0,'raw units'); if(hudEl) hudEl.innerHTML='raw units · κ ≈ <b>1487</b>'; }
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.apply(t); }
    });
  }
  const S=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(S); rw=innerWidth; });
})();
