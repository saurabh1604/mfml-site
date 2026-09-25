/* ================= UNIT 14 · helpers on top of the kit ================= */
/* one colour language for the whole unit */
const K14={mass:'s6',data:'s1',p:'s1',q:'s2',loss:'critical',mean:'s4',axis:'s3',c3:'s7'};
const cvar=k=>'var(--'+k+')';
const TT=(v,d)=>trim(F(v,d==null?3:d));                  /* trimmed fixed, real minus sign */
const PCT=(v,d)=>trim(F(100*v,d==null?1:d))+'%';
/* a key/value readout table */
function kv(tbl,rows){ tbl.innerHTML=rows.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join(''); }
/* tween a number (the ▶ stories) */
function slideTo(id,from,to,dur,set,done,dec){ return tween(dur,u=>{ const v=from+(to-from)*u; set(dec?Math.round(v*dec)/dec:v); },()=>{ set(to); done&&done(); }); }
/* probability bars */
function pbars(host,rows){ host.innerHTML=rows.map(r=>`<div class="pb"><span class="nm">${r[0]}</span><span class="bar"><i style="width:${(100*Math.max(0,Math.min(1,r[1]))).toFixed(2)}%;background:${r[2]}"></i></span><span class="v">${r[3]==null?F(r[1],3):r[3]}</span></div>`).join(''); }
/* ---- probability ---- */
const SQ2PI=Math.sqrt(2*Math.PI);
const npdf=(x,mu,s)=>Math.exp(-.5*((x-mu)/s)*((x-mu)/s))/(s*SQ2PI);
function erf(x){ /* Abramowitz–Stegun 7.1.26 refined by one Newton-free series switch: |err| < 1.5e-7 */
  const s=x<0?-1:1; x=Math.abs(x); if(x<2.5){ let sum=x, t=x, n=0; const x2=x*x; while(Math.abs(t)>1e-17*Math.abs(sum)&&n<200){ n++; t*=-x2/n; sum+=t/(2*n+1); } return s*2/Math.sqrt(Math.PI)*sum; }
  /* continued fraction for erfc at large x */
  let f=0; for(let k=60;k>=1;k--) f=k/2/(x+f); return s*(1-Math.exp(-x*x)/Math.sqrt(Math.PI)/(x+f)); }
const Phi=z=>.5*(1+erf(z/Math.SQRT2));
function softmax(z,T){ T=T||1; const m=Math.max(...z.map(v=>v/T)); const e=z.map(v=>Math.exp(v/T-m)); const s=e.reduce((a,b)=>a+b,0); return e.map(v=>v/s); }
const log2=x=>Math.log(x)/Math.LN2;
const H2=p=>-p.reduce((a,v)=>a+(v>0?v*log2(v):0),0);
const CE2=(p,q)=>-p.reduce((a,v,i)=>a+(v>0?v*log2(q[i]):0),0);
const KL2=(p,q)=>p.reduce((a,v,i)=>a+(v>0?v*log2(v/q[i]):0),0);
function binom(n,k){ let r=1; for(let i=1;i<=k;i++) r=r*(n-k+i)/i; return r; }
/* seeded random numbers (every reader sees the same beads, rolls and clouds) */
function seeded(seed){ let s=seed>>>0||1; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
function gauss2(rnd){ const u=Math.max(1e-12,rnd()), v=rnd(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
/* 2×2 symmetric eigen: returns [{l, v:[x,y]}, …] largest first */
function eig2(a,b,c){ const t=(a+c)/2, d=Math.sqrt(((a-c)/2)*((a-c)/2)+b*b), l1=t+d, l2=t-d;
  let v1; if(Math.abs(b)>1e-12) v1=[l1-c,b]; else v1=a>=c?[1,0]:[0,1]; const n=Math.hypot(...v1); v1=[v1[0]/n,v1[1]/n];
  return [{l:l1,v:v1},{l:l2,v:[-v1[1],v1[0]]}]; }
/* a matrix printed as a tiny grid (inside table.kv) */
const mx2=(m,d)=>'<span class="mx">'+m.flat().map(v=>'<span>'+TT(v,d==null?3:d)+'</span>').join('')+'</span>';
/* ---- canvas helpers (the Galton board, the clinic, the classifier's map) ---- */
function hexRGB(h){ const n=CIN?CIN.hex(h):0x888888; return [(n>>16)&255,(n>>8)&255,n&255]; }
const rgba=(k,a)=>{ const c=hexRGB(cssv(k)); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
/* ---- 3-D: math (x₁, x₂, height) → three.js [x₁, height, −x₂] ---- */
const M3=(x,y,z)=>[x,z||0,-y];
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
/* a lit bead with a soft halo */
function bead(ctx,pos,colorKey,r){ const {THREE}=ctx, col=hxOf(ctx)(colorKey), g=new THREE.Group(); g.position.set(...pos);
  const m=new THREE.Mesh(new THREE.SphereGeometry(r||.06,22,16),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:ctx.isLight?.3:.85,roughness:.3,transparent:true}));
  g.add(m); const h=haloSprite(ctx,col,(r||.06)*(ctx.isLight?4:6.5)); g.add(h); g.userData={m,h}; return g; }
/* a flat line strip on the floor or in the air (LineSegments from a flat [x,y,z,…] list) — cheap for many contour rings */
function segs3(ctx,flat,color,op){ const T=ctx.THREE; const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(new Float32Array(flat),3));
  const m=new T.LineSegments(g,new T.LineBasicMaterial({color,transparent:true,opacity:op==null?.8:op,depthWrite:false})); m.frustumCulled=false; return m; }
/* an ellipse on the floor (math coords, centre c, symmetric 2×2 covariance entries a,b,c2, radius k in Mahalanobis units) → flat xyz list for a closed line */
function ellipsePts(cx,cy,a,b,c,k,n,h){ const E=eig2(a,b,c), out=[]; n=n||96;
  for(let i=0;i<=n;i++){ const t=i/n*2*Math.PI, u=k*Math.sqrt(E[0].l)*Math.cos(t), v=k*Math.sqrt(E[1].l)*Math.sin(t);
    const x=cx+u*E[0].v[0]+v*E[1].v[0], y=cy+u*E[0].v[1]+v*E[1].v[1]; out.push([x,y]); } return out; }
/* a smooth glowing closed/open curve through 3-D points (tube) that can be rebuilt cheaply */
function tubeLine(ctx,pts,color,r,op){ const T=ctx.THREE; if(pts.length<2) return new T.Group();
  const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));
  return new T.Mesh(new T.TubeGeometry(curve,Math.max(16,pts.length*2),r||.015,8,false),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:ctx.isLight?.2:.85,roughness:.3,transparent:true,opacity:op==null?1:op,depthWrite:op==null||op>=1})); }
/* an equal-scale frame centred on (cx, cy): ellipses must look like ellipses */
function eqFrame(svg,cx,cy,halfW,o){ o=o||{}; const W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height;
  const L=o.l==null?30:o.l,R=o.r==null?12:o.r,T=o.t==null?12:o.t,B=o.b==null?26:o.b;
  const pw=W-L-R, ph=H-T-B, s=pw/(2*halfW), halfH=ph/s/2;
  return frame(svg,cx-halfW,cx+halfW,cy-halfH,cy+halfH,Object.assign({l:L,r:R,t:T,b:B},o)); }
/* the ellipse (x−c)ᵀΣ⁻¹(x−c) = k² as an SVG path in a frame */
function ellD(fr,c,S,k){ return ellipsePts(c[0],c[1],S[0][0],S[0][1],S[1][1],k,120).map((p,i)=>(i?'L':'M')+fr.px(p[0]).toFixed(1)+','+fr.py(p[1]).toFixed(1)).join('')+'Z'; }
