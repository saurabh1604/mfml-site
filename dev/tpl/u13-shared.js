/* ================= UNIT 13 · helpers on top of the kit ================= */
/* one colour language for the whole unit */
const K13={pos:'s1',neg:'s2',edge:'s7',sv:'s4',w:'s3',crit:'critical'};
const cvar=k=>'var(--'+k+')';
const classKey=y=>y>0?K13.pos:K13.neg;
const TT=(v,d)=>trim(F(v,d==null?3:d));                  /* trimmed fixed, real minus sign */
/* a rational that prints as a fraction when it is one (1/32, 5/3, −1/12 …) */
function frac(v,maxDen){ maxDen=maxDen||128; if(!isFinite(v)) return v>0?'∞':'−∞'; if(Math.abs(v)<1e-12) return '0';
  for(let d=1;d<=maxDen;d++){ const n=Math.round(v*d); if(Math.abs(n/d-v)<1e-9){ return d===1?nm(String(n)):nm(String(n))+'/'+d; } } return TT(v,4); }
const vecS=(v,d)=>'('+v.map(x=>TT(x,d==null?3:d)).join(', ')+')';
/* an equal-scale frame centred on (cx, cy): the SVM pictures need true right angles */
function eqFrame(svg,cx,cy,halfW,o){ o=o||{}; const W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height;
  const L=o.l==null?30:o.l,R=o.r==null?12:o.r,T=o.t==null?12:o.t,B=o.b==null?26:o.b;
  const pw=W-L-R, ph=H-T-B, s=pw/(2*halfW), halfH=ph/s/2;
  return frame(svg,cx-halfW,cx+halfW,cy-halfH,cy+halfH,Object.assign({l:L,r:R,t:T,b:B},o)); }
/* the part of the line w·x + b = c inside the box [X0,X1]×[Y0,Y1] → [[x,y],[x,y]] or null */
function lineInBox(w,b,c,fr){ const pts=[], X0=fr.X0,X1=fr.X1,Y0=fr.Y0,Y1=fr.Y1, e=1e-12;
  if(Math.abs(w[1])>e){ for(const x of [X0,X1]){ const y=(c-b-w[0]*x)/w[1]; if(y>=Y0-1e-9&&y<=Y1+1e-9) pts.push([x,y]); } }
  if(Math.abs(w[0])>e){ for(const y of [Y0,Y1]){ const x=(c-b-w[1]*y)/w[0]; if(x>=X0-1e-9&&x<=X1+1e-9) pts.push([x,y]); } }
  if(pts.length<2) return null; let best=[pts[0],pts[1]], d=0;
  for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){ const dd=Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1]); if(dd>d){ d=dd; best=[pts[i],pts[j]]; } }
  return best; }
/* the band lo ≤ w·x + b ≤ hi, clipped to the frame box, as a polygon (Sutherland–Hodgman) */
function bandPoly(w,b,lo,hi,fr){ let poly=[[fr.X0,fr.Y0],[fr.X1,fr.Y0],[fr.X1,fr.Y1],[fr.X0,fr.Y1]];
  const clip=(P,g)=>{ const out=[]; for(let i=0;i<P.length;i++){ const A=P[i],Bq=P[(i+1)%P.length],fa=g(A),fb=g(Bq); if(fa>=0) out.push(A); if((fa>=0)!==(fb>=0)){ const t=fa/(fa-fb); out.push([A[0]+t*(Bq[0]-A[0]),A[1]+t*(Bq[1]-A[1])]); } } return out; };
  poly=clip(poly,p=>w[0]*p[0]+w[1]*p[1]+b-lo); if(poly.length) poly=clip(poly,p=>hi-(w[0]*p[0]+w[1]*p[1]+b)); return poly; }
const polyD=(fr,P)=>P.length?'M'+P.map(p=>fr.px(p[0]).toFixed(1)+','+fr.py(p[1]).toFixed(1)).join('L')+'Z':'';
/* markers: class +1 is a blue disc, class −1 an orange diamond (shape as well as colour) */
function mark(parent,X,Y,y,o){ o=o||{}; const r=o.r||7, g=el('g',{class:'pt'},parent), col=cvar(o.color||classKey(y));
  if(o.halo!==false) el('circle',{cx:X,cy:Y,r:r*2.1,fill:col,opacity:o.dim?.06:.16},g);
  if(y>0) el('circle',{cx:X,cy:Y,r,fill:o.hollow?'none':col,stroke:o.hollow?col:'var(--page)','stroke-width':o.hollow?2:1.4,opacity:o.dim?.35:1},g);
  else el('rect',{x:X-r*.86,y:Y-r*.86,width:r*1.72,height:r*1.72,transform:`rotate(45 ${X} ${Y})`,fill:o.hollow?'none':col,stroke:o.hollow?col:'var(--page)','stroke-width':o.hollow?2:1.4,opacity:o.dim?.35:1},g);
  return g; }
function svRing(parent,X,Y,r,o){ o=o||{}; const g=el('g',{},parent); el('circle',{cx:X,cy:Y,r:(r||7)+6,fill:'none',stroke:cvar(o.color||K13.sv),'stroke-width':o.w||2.4,opacity:o.op==null?1:o.op},g);
  if(!isLight()&&o.glow!==false) el('circle',{cx:X,cy:Y,r:(r||7)+6,fill:'none',stroke:cvar(o.color||K13.sv),'stroke-width':(o.w||2.4)*3.2,opacity:.18},g); return g; }
/* the street for a linear model inside a frame: fill, two violet edges, the centre line, optional w arrow */
function drawStreet(fr,layer,w,b,o){ o=o||{}; const wn=Math.hypot(w[0],w[1]); if(wn<1e-12) return;
  const band=bandPoly(w,b,-1,1,fr); if(band.length) el('path',{d:polyD(fr,band),fill:cvar(K13.edge),opacity:isLight()?.08:.11},layer);
  if(o.sides!==false){ const hp=bandPoly(w,b,1,1e9,fr), hn=bandPoly(w,b,-1e9,-1,fr);
    if(hp.length) el('path',{d:polyD(fr,hp),fill:cvar(K13.pos),opacity:isLight()?.045:.06},layer); if(hn.length) el('path',{d:polyD(fr,hn),fill:cvar(K13.neg),opacity:isLight()?.045:.06},layer); }
  [[1,K13.edge],[-1,K13.edge]].forEach(([c,k])=>{ const s=lineInBox(w,b,c,fr); if(s) glowLine(layer,fr.px(s[0][0]),fr.py(s[0][1]),fr.px(s[1][0]),fr.py(s[1][1]),cvar(k),2,!isLight(),{'stroke-dasharray':o.dashEdges?'7 5':null}); });
  const s0=lineInBox(w,b,0,fr); if(s0) glowLine(layer,fr.px(s0[0][0]),fr.py(s0[0][1]),fr.px(s0[1][0]),fr.py(s0[1][1]),'var(--ink)',2.6,!isLight());
  return s0; }
/* a canvas-painted image of sign(f) behind an SVG frame: soft colour by side, deeper outside the street */
function regionImage(layer,fr,f,o){ o=o||{}; const nx=o.nx||120, ny=Math.max(8,Math.round(nx*(fr.H-fr.T-fr.B)/(fr.W-fr.L-fr.R)));
  const c=document.createElement('canvas'); c.width=nx; c.height=ny; const g=c.getContext('2d'), im=g.createImageData(nx,ny);
  const hexRGB=h=>{ const n=CIN?CIN.hex(h):0x888888; return [(n>>16)&255,(n>>8)&255,n&255]; };
  const P=hexRGB(cssv(K13.pos)), N=hexRGB(cssv(K13.neg)), light=isLight();
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ const x=fr.X0+(i+.5)/nx*(fr.X1-fr.X0), y=fr.Y1-(j+.5)/ny*(fr.Y1-fr.Y0), v=f([x,y]);
    const col=v>=0?P:N, a=Math.min(1,Math.abs(v)); const al=(light?.10:.13)+(light?.14:.20)*a; const k=4*(j*nx+i);
    im.data[k]=col[0]; im.data[k+1]=col[1]; im.data[k+2]=col[2]; im.data[k+3]=Math.round(255*al); }
  g.putImageData(im,0,0);
  const img=el('image',{x:fr.L,y:fr.T,width:fr.W-fr.L-fr.R,height:fr.H-fr.T-fr.B,preserveAspectRatio:'none'},layer); img.setAttribute('href',c.toDataURL()); img.style.imageRendering='auto'; return img; }
/* contour lines f = levels in a frame (marching squares from the kit) */
function contours(layer,fr,f,levels,o){ o=o||{}; const N=o.N||90; const all=contourSegs((x,y)=>f([x,y]),levels,fr.X0,fr.X1,fr.Y0,fr.Y1,N);
  all.forEach(({L,segs})=>{ const d=segs.map(([a,b,c,e])=>'M'+fr.px(a).toFixed(1)+','+fr.py(b).toFixed(1)+'L'+fr.px(c).toFixed(1)+','+fr.py(e).toFixed(1)).join('');
    if(!d) return; const main=Math.abs(L)<1e-9; const col=main?'var(--ink)':cvar(K13.edge);
    if(main&&!isLight()) el('path',{d,stroke:col,'stroke-width':6,opacity:.16,fill:'none','stroke-linecap':'round'},layer);
    el('path',{d,stroke:col,'stroke-width':main?2.4:1.7,fill:'none','stroke-linecap':'round','stroke-dasharray':main?null:'6 4',opacity:main?1:.95},layer); }); }
/* a key/value readout table */
function kv(tbl,rows){ tbl.innerHTML=rows.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join(''); }
/* tween a number on a slider (the ▶ stories) */
function slideTo(id,from,to,dur,set,done,dec){ return tween(dur,u=>{ const v=from+(to-from)*u; set(dec?Math.round(v*dec)/dec:v); },()=>{ set(to); done&&done(); }); }
/* ---- 3-D: math (x₁, x₂, height) → three.js [x₁, height, −x₂] ---- */
const M3=(x,y,z)=>[x,z||0,-y];
/* a data point as a lit bead with a soft halo */
function bead3(ctx,pos,y,o){ o=o||{}; const {THREE}=ctx, hx=hxOf(ctx), col=hx(o.color||classKey(y)), g=new THREE.Group(); g.position.set(...pos);
  const r=o.r||.07; let m;
  if(y>0) m=new THREE.Mesh(new THREE.SphereGeometry(r,22,16),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:ctx.isLight?.25:.8,roughness:.3,transparent:true}));
  else { m=new THREE.Mesh(new THREE.OctahedronGeometry(r*1.25,0),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:ctx.isLight?.25:.8,roughness:.35,flatShading:true,transparent:true})); }
  g.add(m); const h=haloSprite(ctx,col,r*(ctx.isLight?4:6.5)); g.add(h); g.userData={m,h,y}; return g; }
/* a gold ring lying flat on the floor around a support vector */
function ring3(ctx,r,o){ o=o||{}; const {THREE}=ctx, col=hxOf(ctx)(o.color||K13.sv);
  const m=new THREE.Mesh(new THREE.TorusGeometry(r||.14,o.tube||.013,10,48),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:ctx.isLight?.3:.9,roughness:.3,transparent:true}));
  m.rotation.x=Math.PI/2; return m; }
/* a flat strip on the floor (the street): centre c (math), unit normal u, width wd, length len */
function strip3(ctx,color,opacity){ const {THREE}=ctx; const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));
  m.rotation.x=-Math.PI/2; const g=new THREE.Group(); g.add(m);
  g.userData.set=(c,u,wd,len,h)=>{ g.position.set(c[0],h||0,-c[1]); g.rotation.y=Math.atan2(u[1],u[0]); m.scale.set(Math.max(1e-3,wd),len,1); };
  return g; }
/* a lit tube you can re-aim every frame: aimTube(THREE, mesh, A, B) from the kit */
function liveTube(ctx,color,r,op){ const {THREE}=ctx; const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1,12),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:ctx.isLight?.2:.8,roughness:.3,transparent:true,opacity:op==null?1:op})); return m; }
/* a starfield for the dark theme */
function starfield(ctx,n,R){ const {THREE,root}=ctx; if(ctx.isLight) return null; const sp=new Float32Array(n*3);
  let s=7; const rnd=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
  for(let k=0;k<n;k++){ let x,y,z; do{ x=(rnd()*2-1)*R; y=(rnd()*2-1)*R*.55; z=(rnd()*2-1)*R-3; }while(Math.hypot(x,y-1,z)<R*.3); sp[3*k]=x; sp[3*k+1]=y; sp[3*k+2]=z; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(sp,3));
  const p=new THREE.Points(g,new THREE.PointsMaterial({color:hxOf(ctx)('ink2'),size:.05,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false})); root.add(p); return p; }
/* a glass floor with a faint grid */
function glassFloor(ctx,size,o){ o=o||{}; const {THREE,root,isLight}=ctx, hx=hxOf(ctx);
  const grid=CIN.prim.grid(ctx,size,o.div||24,hx('grid'),{opacity:isLight?.5:.3}); grid.position.y=o.y||0; root.add(grid);
  const slab=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.85,transparent:true,opacity:isLight?.35:.55,depthWrite:false})); slab.rotation.x=-Math.PI/2; slab.position.y=(o.y||0)-.004; root.add(slab);
  return {grid,slab}; }
/* seeded random numbers (the datasets must be the same for every reader) */
function seeded(seed){ let s=seed>>>0||1; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
function gauss2(rnd){ const u=Math.max(1e-9,rnd()), v=rnd(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

/* ---- the unit's shared data ---- */
/* D1: twelve points; the SVM is w = (−½, ½), b = 0, support vectors (1,3)⁺ (3,5)⁺ (4,2)⁻ with α = ⅛, ⅛, ¼ */
const D1={X:[[1,3],[3,5],[0.5,4.8],[1.8,5.6],[2.6,6.4],[0.2,3.6],[4,2],[3,0.6],[5,1.2],[5.8,3],[6.2,4],[4.8,0.4]],y:[1,1,1,1,1,1,-1,-1,-1,-1,-1,-1]};
/* the widest street for one tilt (street direction θ in degrees): exact, by projecting every point onto the normal */
function streetAtTilt(X,y,deg){ const th=(deg+90)*Math.PI/180, u=[Math.cos(th),Math.sin(th)]; let hi=Infinity, lo=-Infinity, ip=-1, in_=-1;
  X.forEach((p,i)=>{ const s=u[0]*p[0]+u[1]*p[1]; if(y[i]>0){ if(s<hi){ hi=s; ip=i; } } else { if(s>lo){ lo=s; in_=i; } } });
  const width=hi-lo; const touch=[]; X.forEach((p,i)=>{ const s=u[0]*p[0]+u[1]*p[1]; if((y[i]>0&&Math.abs(s-hi)<1e-9)||(y[i]<0&&Math.abs(s-lo)<1e-9)) touch.push(i); });
  return {u,hi,lo,width,mid:(hi+lo)/2,touch,ip,in:in_}; }
/* self-check: D1's hard-margin answer */
(function(){ const r=SVM.solve(D1.X,D1.y); const want=[0.125,0.125,0,0,0,0,0.25,0,0,0,0,0];
  if(!r.ok||r.alpha.some((a,i)=>Math.abs(a-want[i])>1e-9)||Math.abs(r.w[0]+0.5)>1e-9||Math.abs(r.w[1]-0.5)>1e-9||Math.abs(r.b)>1e-9) console.warn('U13: D1 solve unexpected',r.alpha,r.w,r.b);
  const t=streetAtTilt(D1.X,D1.y,45); if(Math.abs(t.width-2*Math.SQRT2)>1e-9) console.warn('U13: tilt 45° width',t.width);
  console.info('U13 solver · D1: α = '+r.alpha.map(a=>frac(a)).join(', ')+' · w = '+vecS(r.w)+' · b = '+frac(r.b)+' · '+r.iter+' steps, '+r.ms.toFixed(2)+' ms'); })();
window.U13SVM=SVM;
