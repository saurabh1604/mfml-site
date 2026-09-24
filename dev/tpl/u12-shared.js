/* ---------- shared helpers (house runtime) ---------- */
const store={mem:{},get(k){try{return localStorage.getItem(k)??this.mem[k]??null}catch(e){return this.mem[k]??null}},set(k,v){this.mem[k]=v;try{localStorage.setItem(k,v)}catch(e){}}};
const themeBtn=document.getElementById('theme-btn');const modes=['dark','light'];let mode=store.get('mfml-theme')==='light'?'light':'dark';
function applyTheme(){document.documentElement.setAttribute('data-theme',mode);themeBtn.innerHTML = '<span class="tw">Theme: </span>' + mode;}
themeBtn.addEventListener('click',()=>{mode=modes[(modes.indexOf(mode)+1)%2];store.set('mfml-theme',mode);applyTheme();});applyTheme();
const rail=document.getElementById('read-progress');
addEventListener('scroll',()=>{const h=document.documentElement;rail.style.width=((h.scrollTop/(h.scrollHeight-h.clientHeight))*100).toFixed(2)+'%';},{passive:true});
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);if(parent)parent.appendChild(n);return n;}
function txt(parent,x,y,s,style,anchor){const t=el('text',{x,y,'text-anchor':anchor||'start'},parent);t.setAttribute('style',(style||'font:600 11px system-ui;fill:var(--ink-muted)').replace(/system-ui/g,'Inter,system-ui'));t.textContent=s;return t;}
/* ---- cinema helpers: SVG glow (dropped in the light theme) + theme probe ---- */
const CIN=window.Cinema||null;
const isLight=()=>document.documentElement.getAttribute('data-theme')==='light';
function glo(svg,blur){ if(!CIN||isLight()) return null; return CIN.glowFilter(svg,'g-'+(svg.id||'x'),blur||2.4); }
const G=(p,attrs)=>{ if(p&&p.glow) attrs.filter=p.glow; return attrs; };
/* ---- three.js stage registry: every stage rebuilds itself when the theme flips, so colours are always the live palette ---- */
const STAGES=[];
/* 3D stages mount only while they are near the viewport and give their GL context back when they scroll far away
   (browsers cap live WebGL contexts at ~8-16 and silently kill the oldest). A stage's state must live OUTSIDE build():
   build() is called again from scratch on every return, and on every theme flip. */
const NEAR='900px 0px';
function mountStage(box, build){ const S={box,build,handle:null,near:false}; STAGES.push(S);
  const dist=()=>{ const r=box.getBoundingClientRect(); return r.bottom<0?-r.bottom:r.top>innerHeight?r.top-innerHeight:0; };
  S.near=dist()<900;
  if(S.near) remount(S);
  if('IntersectionObserver' in window) new IntersectionObserver(es=>es.forEach(e=>{ S.near=e.isIntersecting; clearTimeout(S.park);
      if(S.near){ if(!S.handle) remount(S); else S.handle.requestRender(); }
      else if(S.handle) S.park=setTimeout(()=>{ if(!S.near&&S.handle) unmountStage(S); },900); }),{rootMargin:NEAR,threshold:0}).observe(box);
  return S; }
function unmountStage(S){ if(!S.handle) return; const h=S.handle; try{ h.ctx.dead=true; const R=h.ctx.renderer; R.render=()=>{}; R.setSize=()=>{}; h.dispose(); R.forceContextLoss(); }catch(e){} S.handle=null; S.box.innerHTML=''; S.box.dataset.parked='1'; }
function remount(S){
  if(S.handle){ const h=S.handle; try{ h.ctx.dead=true; const R=h.ctx.renderer; R.render=()=>{}; R.setSize=()=>{}; h.dispose(); R.forceContextLoss(); }catch(e){} S.handle=null; }  /* give the GL context back */
  S.box.innerHTML=''; delete S.box.dataset.parked; if(CIN&&window.THREE){ try{ S.handle=S.build(); }catch(e){ console.warn('stage failed', e); } } }
function hud(box, cls){ const d=document.createElement('div'); d.className='hud'+(cls?' '+cls:''); box.appendChild(d); return d; }
function hint(box, text){ const d=document.createElement('div'); d.className='hint'; d.textContent=text||'drag to orbit'; box.appendChild(d); return d; }
new MutationObserver(()=>STAGES.forEach(S=>{ if(S.handle||S.near) remount(S); })).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
/* a lit tube between two points (three.js coords) — the glowing-edge primitive */
function tube(ctx,a,b,color,r,opacity){ const T=ctx.THREE; const A=new T.Vector3(...a), B=new T.Vector3(...b); const d=B.clone().sub(A), L=Math.max(1e-4,d.length());
  const m=new T.Mesh(new T.CylinderGeometry(r,r,L,12),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:ctx.isLight?.15:.7,roughness:.3,transparent:true,opacity:opacity==null?1:opacity}));
  m.position.copy(A).add(d.clone().multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()); return m; }
/* a sprite label that only re-renders when its text changes */
function slot(ctx,root){ return {sp:null,key:'',set(text,pos,opts){ if(text!==this.key){ if(this.sp) root.remove(this.sp); this.key=text; this.sp=text?CIN.prim.label(ctx,text,pos,opts):null; if(this.sp){ this.sp.material.depthWrite=false; this.sp.renderOrder=999; root.add(this.sp);} } else if(this.sp){ this.sp.position.set(...pos); this.sp.visible=true; } },
  hide(){ if(this.sp) this.sp.visible=false; }}; }
/* a soft round sprite for glowing pulses (a bare Points material draws squares) */
let _spark=null; function sparkTex(THREE){ if(_spark) return _spark; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const r=g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(.3,'rgba(255,255,255,.85)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,64,64); _spark=new THREE.CanvasTexture(c); return _spark; }
function plane(svg,X0,X1,Y0,Y1,opts){opts=opts||{};svg.innerHTML='';
  const W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height,pad=opts.pad||26;
  const s=Math.min((W-2*pad)/(X1-X0),(H-2*pad)/(Y1-Y0));
  const cx=pad+((W-2*pad)-s*(X1-X0))/2,cy=pad+((H-2*pad)-s*(Y1-Y0))/2;
  const px=x=>cx+(x-X0)*s,py=y=>H-cy-(y-Y0)*s,step=opts.step||1;
  /* the grid fades toward the edges (radial mask) and the key strokes glow */
  const glow=glo(svg);
  const defs=svg.querySelector('defs')||el('defs',{},svg);
  const mid='m-'+(svg.id||'p');
  const rg=el('radialGradient',{id:mid+'-g',cx:'50%',cy:'50%',r:'62%'},defs);
  el('stop',{offset:'0','stop-color':'#fff'},rg); el('stop',{offset:'.72','stop-color':'#fff','stop-opacity':'.8'},rg); el('stop',{offset:'1','stop-color':'#fff','stop-opacity':'.05'},rg);
  const mk=el('mask',{id:mid},defs); el('rect',{x:0,y:0,width:W,height:H,fill:`url(#${mid}-g)`},mk);
  const g=el('g',{mask:`url(#${mid})`},svg);
  for(let x=Math.ceil(X0);x<=X1;x+=step)el('line',{x1:px(x),y1:py(Y0),x2:px(x),y2:py(Y1),stroke:'var(--grid)','stroke-width':x===0?0:1},g);
  for(let y=Math.ceil(Y0);y<=Y1;y+=step)el('line',{x1:px(X0),y1:py(y),x2:px(X1),y2:py(y),stroke:'var(--grid)','stroke-width':y===0?0:1},g);
  el('line',{x1:px(X0),y1:py(0),x2:px(X1),y2:py(0),stroke:'var(--axis)','stroke-width':1.5},g);
  el('line',{x1:px(0),y1:py(Y0),x2:px(0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.5},g);
  if(!opts.noticks){const te=opts.tickEvery||1;
    for(let x=Math.ceil(X0);x<=X1;x+=step)if(x!==0&&Math.abs(x)%te===0)txt(svg,px(x),py(0)+15,x,'font:500 10px system-ui;fill:var(--ink-muted)','middle');
    for(let y=Math.ceil(Y0);y<=Y1;y+=step)if(y!==0&&Math.abs(y)%te===0)txt(svg,px(0)-7,py(y)+3.5,y,'font:500 10px system-ui;fill:var(--ink-muted)','end');}
  return {px,py,svg,grid:g,glow};}
function arrow(p,x0,y0,x1,y1,color,w,label,lblStyle){const g=el('g',G(p,{}),p.svg);
  const X0=p.px(x0),Y0=p.py(y0),X1=p.px(x1),Y1=p.py(y1),dx=X1-X0,dy=Y1-Y0,L=Math.hypot(dx,dy)||1;
  const hx=X1-dx/L*10,hy=Y1-dy/L*10;
  el('line',{x1:X0,y1:Y0,x2:hx,y2:hy,stroke:color,'stroke-width':w||2.5,'stroke-linecap':'round'},g);
  const nx=-dy/L*4.5,ny=dx/L*4.5;
  el('polygon',{points:`${X1},${Y1} ${hx+nx},${hy+ny} ${hx-nx},${hy-ny}`,fill:color},g);
  if(label)txt(p.svg,X1+dx/L*8+(dx>=0?2:-2),Y1+dy/L*8,label,lblStyle||`font:700 12px system-ui;fill:${color}`,dx>=0?'start':'end');
  return g;}
const fmt=(v,d=2)=>(+v).toFixed(d).replace(/\.?0+$/,'').replace(/^-0$/,'0');
function planePt(svg,p,e){const r=svg.getBoundingClientRect(),W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height;
  const sx=(e.clientX-r.left)/r.width*W,sy=(e.clientY-r.top)/r.height*H;
  const x0=p.px(0),y0=p.py(0),ux=p.px(1)-x0,uy=p.py(1)-y0;
  return [(sx-x0)/ux,(sy-y0)/uy];}
/* a straight SVG edge with an arrowhead, optionally glowing */
function edge(svg,sx,sy,ex,ey,color,w,glow,op){const dx=ex-sx,dy=ey-sy,L=Math.hypot(dx,dy)||1;
  const g=el('g',glow?{filter:glow,opacity:op==null?1:op}:{opacity:op==null?1:op},svg);
  el('line',{x1:sx,y1:sy,x2:ex,y2:ey,stroke:color,'stroke-width':w,'stroke-linecap':'round'},g);
  el('polygon',{points:`${ex},${ey} ${ex-dx/L*8-dy/L*3.5},${ey-dy/L*8+dx/L*3.5} ${ex-dx/L*8+dy/L*3.5},${ey-dy/L*8-dx/L*3.5}`,fill:color},g);
  return g;}


/* ---- 3D helpers (from Unit 6) ---- */
const T3=v=>[v[0],v[2],-v[1]];   /* math (x, y, z-up) → three.js (x, y-up, z toward the camera) */
/* a pointer → surface picker: returns the hit point on the given mesh (world coords) or null */
function picker(handle, getMesh){
  const {THREE,camera,renderer}=handle.ctx; const ray=new THREE.Raycaster(); const v=new THREE.Vector2();
  return e=>{ const r=renderer.domElement.getBoundingClientRect(); if(!r.width||!r.height) return null;
    v.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(v,camera);
    const m=getMesh(); if(!m) return null; const hits=ray.intersectObject(m,false); return hits.length?hits[0].point:null; };
}
/* a drag that lives on top of the stage's orbit: if `onDown(e)` claims the pointer, the orbit never sees it */
function grab(handle, onDown, onMove, onUp){
  const el=handle.ctx.renderer.domElement; let active=false;
  el.addEventListener('pointerdown',e=>{ if(!onDown(e)) return; active=true; e.stopImmediatePropagation(); try{ el.setPointerCapture(e.pointerId); }catch(_){} el.style.cursor='grabbing'; },{capture:true});
  el.addEventListener('pointermove',e=>{ if(active) onMove(e); },{capture:true});
  const up=e=>{ if(!active) return; active=false; el.style.cursor='grab'; onUp&&onUp(e); };
  el.addEventListener('pointerup',up,{capture:true}); el.addEventListener('pointercancel',up,{capture:true});
  /* verify hook + a11y: the view angle is mirrored on the container while the user orbits */
  el.addEventListener('pointermove',e=>{ if(e.buttons&&!active) handle.ctx.renderer.domElement.parentNode.dataset.view=handle.ctx.orbit.sph.theta.toFixed(3); });
}
function aimTube(THREE,m,A,B){ const d=new THREE.Vector3(B[0]-A[0],B[1]-A[1],B[2]-A[2]); const L=d.length()||1e-4;
  m.position.set((A[0]+B[0])/2,(A[1]+B[1])/2,(A[2]+B[2])/2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()); m.scale.y=L; }
/* annotations (arrows, tangents, dots, paths) always read on top of the surface they annotate */
function overlay(o,order){ o.traverse(m=>{ if(m.material){ m.material.depthTest=false; m.material.depthWrite=false; m.material.transparent=true; m.renderOrder=order==null?10:order; } }); return o; }
function lab(ctx,t,pos,opts){ const l=CIN.prim.label(ctx,t,pos,opts); l.renderOrder=20; return l; }
/* per-vertex visibility on a prim.surface: a 'vis' attribute multiplies the fragment alpha (fog, rim fade) */
function fadeAttr(THREE,surf){ const geo=surf.userData.geo, n=geo.attributes.position.count, vis=new THREE.BufferAttribute(new Float32Array(n).fill(1),1); geo.setAttribute('vis',vis);
  const mat=surf.userData.mesh.material; mat.transparent=true;
  mat.onBeforeCompile=sh=>{ sh.vertexShader='attribute float vis;\nvarying float vVis;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvVis=vis;');
    sh.fragmentShader='varying float vVis;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\nif(vVis<0.02) discard;\ngl_FragColor.a*=vVis;'); };
  mat.needsUpdate=true; return vis; }
/* a glowing curve through 3D points (a thin tube) */
function ribbon(ctx,pts,color,r){ const T=ctx.THREE; const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));
  return new T.Mesh(new T.TubeGeometry(curve,Math.max(8,pts.length),r||.022,8,false),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:ctx.isLight?.15:.75,roughness:.3})); }
/* marching-squares contour segments of f in math coords: [{L, segs:[[x0,y0,x1,y1],…]},…] */
function contourSegs(f,levels,X0,X1,Y0,Y1,N){
  N=N||60;const hx=(X1-X0)/N,hy=(Y1-Y0)/N,V=[];
  for(let i=0;i<=N;i++){V[i]=[];for(let j=0;j<=N;j++)V[i][j]=f(X0+i*hx,Y0+j*hy);}
  const ip=(a,b,va,vb,L)=>a+(b-a)*((L-va)/((vb-va)||1e-9));
  return levels.map(L=>{const segs=[];
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){
      const x0=X0+i*hx,x1=x0+hx,y0=Y0+j*hy,y1=y0+hy;
      const v=[V[i][j],V[i+1][j],V[i+1][j+1],V[i][j+1]],cs=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],pts=[];
      for(let k=0;k<4;k++){const a=v[k],b=v[(k+1)%4];
        if((a<L)!==(b<L)){const A=cs[k],B=cs[(k+1)%4];pts.push([ip(A[0],B[0],a,b,L),ip(A[1],B[1],a,b,L)]);}}
      for(let k=0;k+1<pts.length;k+=2)segs.push([pts[k][0],pts[k][1],pts[k+1][0],pts[k+1][1]]);}
    return {L,segs};});}
/* contour rings lifted onto a height field (three.js LineSegments) */
function liftedContours(ctx,f,levels,X0,X1,Y0,Y1,zs,color,opts){
  const T=ctx.THREE; opts=opts||{}; const all=contourSegs(f,levels,X0,X1,Y0,Y1,opts.N||64); const pos=[];
  all.forEach(({L,segs})=>segs.forEach(([a,b,c,d])=>{pos.push(a,L*zs+.012,-b,c,L*zs+.012,-d);}));
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(new Float32Array(pos),3));
  const m=new T.LineSegments(g,new T.LineBasicMaterial({color,transparent:true,opacity:opts.opacity==null?(ctx.isLight?.55:.62):opts.opacity})); m.frustumCulled=false; return m; }
function glowDot(svg,cx,cy,r,color,glow){ const g=el('g',{},svg); if(glow) g.setAttribute('filter',glow);
  el('circle',{cx,cy,r:r*2.2,fill:color,opacity:.18},g); el('circle',{cx,cy,r,fill:color},g); return g; }

/* ---------- checks ---------- */
const solved=new Set((store.get('mfml-u12-checks')||'').split(',').filter(Boolean));
const scoreEl=document.getElementById('score');
function updScore(){ scoreEl.textContent=solved.size;
  var _c=document.getElementById('score-chip');
  if(_c) _c.classList.toggle('done', solved.size >= document.querySelectorAll('.check').length); }
document.querySelectorAll('.check').forEach(chk=>{
  const id=chk.dataset.check,why=chk.querySelector('.why');
  chk.querySelectorAll('.opts button').forEach(btn=>btn.addEventListener('click',()=>{
    chk.querySelectorAll('.opts button').forEach(b=>b.classList.remove('picked-good','picked-bad'));
    const ok=btn.hasAttribute('data-correct');
    btn.classList.add(ok?'picked-good':'picked-bad');
    why.className='why on '+(ok?'good':'bad');
    why.innerHTML=(ok?'<b class="st-good">✓ Correct.</b> ':'<b class="st-bad">✗ Not quite.</b> ')+btn.dataset.why;
    if(ok){solved.add(id);store.set('mfml-u12-checks',[...solved].join(','));updScore();}
  }));});
updScore();
/* ---------- toc ---------- */
(function(){
  const toc=document.getElementById('toc');if(!toc)return;
  const secs=[...document.querySelectorAll('section.unit')];
  secs.forEach(s=>{const h=s.querySelector('h2'),n=s.querySelector('.sec-num');if(!h)return;
    const a=document.createElement('a');a.href='#'+s.id;
    let t=h.textContent.replace(/\s+—.*$/,'');if(t.length>36)t=t.slice(0,35)+'…';
    a.textContent=(n?n.textContent+' · ':'')+t;toc.appendChild(a);});
  const links=[...toc.querySelectorAll('a')];
  function spy(){let i=0;secs.forEach((s,j)=>{if(s.getBoundingClientRect().top<150)i=j;});
    links.forEach((l,j)=>l.classList.toggle('on',j===i));}
  addEventListener('scroll',spy,{passive:true});spy();
})();

/* ---------- local helpers ---------- */
function bindCtl(id,fn,fmtr){const r=document.getElementById(id),o=document.getElementById(id+'-o');
  const upd=()=>{if(o)o.textContent=fmtr?fmtr(+r.value):fmt(+r.value,2);fn(+r.value);};
  r.addEventListener('input',upd);return upd;}
function tabs(bar,onSwitch){bar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));
  onSwitch(b.dataset.t);}));}
/* ---------- tiny animation runtime (respects reduced motion) ---------- */
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeIO=u=>u<0.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
function tween(dur,step,done){
  if(RM){step(1);done&&done();return {stop(){}};}
  let dead=false;const t0=performance.now();
  (function fr(t){if(dead)return;const u=Math.min(1,(t-t0)/dur);step(easeIO(u));
    if(u<1)requestAnimationFrame(fr);else done&&done();})(t0);
  return {stop(){dead=true;}};}
const clamp01=v=>Math.max(0,Math.min(1,v));

/* ================= UNIT 12 · local helpers (on top of the house runtime) ================= */
const SUB=n=>String(n).split('').map(c=>'₀₁₂₃₄₅₆₇₈₉'[+c]||c).join('');
const nm=s=>String(s).replace(/-/g,'−');                       /* a real minus sign in readouts */
const F=(v,d)=>{ const s=(+v).toFixed(d==null?2:d); return nm(/^-0\.?0*$/.test(s)?s.slice(1):s); };
const trim=s=>s.indexOf('.')<0?s:s.replace(/0+$/,'').replace(/\.$/,'');
const T=(v,d)=>trim(F(v,d==null?3:d));
const RR=ctx=>{ if(ctx&&ctx.requestRender) ctx.requestRender(); };
const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue('--'+n).trim();
const CV=n=>'var(--'+n+')';
const DEG=Math.PI/180;
const thou=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',');
/* PCA colour language: data s1 · PC1 s2 · PC2 s3 · PC3 s6 · error critical */
const PCC=['s2','s3','s6'];
/* ---------- seeded randomness ---------- */
function rng(seed){ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(r){ let u=0,v=0; while(u<1e-12) u=r(); v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
/* ---------- small dense linear algebra ---------- */
const zeros=(n,m)=>Array.from({length:n},()=>new Array(m).fill(0));
const matT=A=>A[0].map((_,j)=>A.map(r=>r[j]));
const matMul=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,v,k)=>s+v*B[k][j],0)));
const matVec=(A,v)=>A.map(r=>r.reduce((s,x,k)=>s+x*v[k],0));
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>Math.sqrt(dot(a,a));
const unit=a=>{ const n=norm(a)||1; return a.map(v=>v/n); };
/* Jacobi eigen-split of a symmetric matrix → values (largest first) and unit vectors (vecs[k] is the k-th eigenvector) */
function eigSym(A0){ const n=A0.length, A=A0.map(r=>r.slice()), V=zeros(n,n); for(let i=0;i<n;i++) V[i][i]=1;
  for(let sweep=0;sweep<60;sweep++){ let off=0; for(let i=0;i<n;i++) for(let j=i+1;j<n;j++) off+=A[i][j]*A[i][j]; if(off<1e-22) break;
    for(let p=0;p<n;p++) for(let q=p+1;q<n;q++){ if(Math.abs(A[p][q])<1e-300) continue;
      const th=(A[q][q]-A[p][p])/(2*A[p][q]), t=Math.sign(th||1)/(Math.abs(th)+Math.sqrt(th*th+1)), c=1/Math.sqrt(t*t+1), s=t*c;
      for(let k=0;k<n;k++){ const akp=A[k][p], akq=A[k][q]; A[k][p]=c*akp-s*akq; A[k][q]=s*akp+c*akq; }
      for(let k=0;k<n;k++){ const apk=A[p][k], aqk=A[q][k]; A[p][k]=c*apk-s*aqk; A[q][k]=s*apk+c*aqk; }
      for(let k=0;k<n;k++){ const vkp=V[k][p], vkq=V[k][q]; V[k][p]=c*vkp-s*vkq; V[k][q]=s*vkp+c*vkq; } } }
  const idx=[...Array(n).keys()].sort((a,b)=>A[b][b]-A[a][a]);
  return { vals:idx.map(i=>A[i][i]), vecs:idx.map(i=>{ const v=V.map(r=>r[i]); /* a fixed sign: largest entry positive */ let m=0; v.forEach((x,k)=>{ if(Math.abs(x)>Math.abs(v[m])+1e-12) m=k; }); return v[m]<0?v.map(x=>-x):v; }) }; }
/* 2×2 closed form: angle (radians) of the top eigenvector, and both eigenvalues */
function eig2(a,b,d){ const tr=a+d, det=a*d-b*b, disc=Math.sqrt(Math.max(0,tr*tr/4-det)); const l1=tr/2+disc, l2=tr/2-disc; const th=0.5*Math.atan2(2*b,a-d); return {l1,l2,th}; }
const qf2=(C,th)=>C[0][0]*Math.cos(th)**2+2*C[0][1]*Math.cos(th)*Math.sin(th)+C[1][1]*Math.sin(th)**2;   /* wᵀCw at angle th */
function covOf(P){ const N=P.length, D=P[0].length, mu=new Array(D).fill(0); P.forEach(p=>p.forEach((v,k)=>mu[k]+=v/N));
  const C=zeros(D,D); P.forEach(p=>{ for(let j=0;j<D;j++) for(let k=0;k<D;k++) C[j][k]+=(p[j]-mu[j])*(p[k]-mu[k])/N; }); return {mu,C}; }
/* build C from eigenvalues and orthonormal directions */
function fromEig(vals,vecs){ const D=vecs[0].length, C=zeros(D,D); vals.forEach((l,k)=>{ const v=vecs[k]; for(let i=0;i<D;i++) for(let j=0;j<D;j++) C[i][j]+=l*v[i]*v[j]; }); return C; }
/* N points with mean exactly 0 and covariance exactly C (divide by N): sample, whiten, colour */
function cloudExact(N,C,seed,shape){ const D=C.length, r=rng(seed); let P=[];
  for(let i=0;i<N;i++){ const p=[]; for(let k=0;k<D;k++) p.push(shape==='u'?(r()*2-1):gauss(r)); P.push(p); }
  const {mu,C:S}=covOf(P); P=P.map(p=>p.map((v,k)=>v-mu[k]));
  const es=eigSym(S), ec=eigSym(C);
  const Wm=zeros(D,D), Cm=zeros(D,D);   /* S^(-1/2) and C^(1/2) */
  es.vals.forEach((l,k)=>{ const v=es.vecs[k], s=1/Math.sqrt(Math.max(l,1e-12)); for(let i=0;i<D;i++) for(let j=0;j<D;j++) Wm[i][j]+=s*v[i]*v[j]; });
  ec.vals.forEach((l,k)=>{ const v=ec.vecs[k], s=Math.sqrt(Math.max(l,0)); for(let i=0;i<D;i++) for(let j=0;j<D;j++) Cm[i][j]+=s*v[i]*v[j]; });
  const M=matMul(Wm,Cm); return P.map(p=>matVec(matT(M),p)); }
/* ---------- SVG helpers (after Unit 11) ---------- */
function frame(svg,X0,X1,Y0,Y1,o){ o=o||{}; if(o.clear!==false) svg.innerHTML='';
  const W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height;
  const L=o.l==null?36:o.l,R=o.r==null?14:o.r,Tp=o.t==null?18:o.t,B=o.b==null?28:o.b;
  const px=x=>L+(x-X0)/(X1-X0)*(W-L-R), py=y=>H-B-(y-Y0)/(Y1-Y0)*(H-Tp-B);
  const glow=glo(svg); const defs=svg.querySelector('defs')||el('defs',{},svg);
  const cid='clip-'+(svg.id||'f'); if(!defs.querySelector('#'+cid)){ const cp=el('clipPath',{id:cid},defs); el('rect',{x:L,y:Tp,width:W-L-R,height:H-Tp-B},cp); }
  const g=el('g',{},svg), tf='font:500 10px system-ui;fill:var(--ink-muted)', z=v=>Math.abs(v)<1e-9?0:v;
  if(o.xs) for(let i=Math.ceil(X0/o.xs-1e-9);i*o.xs<=X1+1e-9;i++){ const x=i*o.xs,X=px(x); el('line',{x1:X,y1:py(Y0),x2:X,y2:py(Y1),stroke:'var(--grid)','stroke-width':1},g); if(o.xt!==false) txt(svg,X,H-B+13,o.xf?o.xf(z(x)):nm(fmt(z(x),2)),tf,'middle'); }
  if(o.ys) for(let i=Math.ceil(Y0/o.ys-1e-9);i*o.ys<=Y1+1e-9;i++){ const y=i*o.ys,Y=py(y); el('line',{x1:px(X0),y1:Y,x2:px(X1),y2:Y,stroke:'var(--grid)','stroke-width':1},g); if(o.yt!==false) txt(svg,L-5,Y+3.5,o.yf?o.yf(z(y)):nm(fmt(z(y),2)),tf,'end'); }
  if(o.axes!==false){ if(Y0<=0&&Y1>=0) el('line',{x1:px(X0),y1:py(0),x2:px(X1),y2:py(0),stroke:'var(--axis)','stroke-width':1.3},g);
    if(X0<=0&&X1>=0) el('line',{x1:px(0),y1:py(Y0),x2:px(0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.3},g); }
  if(o.box!==false) el('rect',{x:L,y:Tp,width:W-L-R,height:H-Tp-B,rx:6,fill:'none',stroke:'var(--line, var(--ring))',opacity:.7},g);
  return {px,py,glow,clip:'url(#'+cid+')',W,H,L,R,T:Tp,B,X0,X1,Y0,Y1,svg,g,
    ix:X=>X0+(X-L)/(W-L-R)*(X1-X0), iy:Y=>Y0+(H-B-Y)/(H-Tp-B)*(Y1-Y0)}; }
/* an equal-scale frame centred on the origin: soft-masked grid, axes, and a clip for everything drawn inside */
function eqFrame(svg,R,o){ o=o||{}; svg.innerHTML=''; const W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height, pad=o.pad==null?14:o.pad, top=o.top||0;
  const bx=pad, by=top+pad, bw=W-2*pad, bh=H-top-2*pad; let s=Math.min(bw,bh)/(2*R), cx=bx+bw/2+(o.dx||0), cy=by+bh/2+(o.dy||0);
  if(o.bounds){ const [x0,x1,y0,y1]=o.bounds; s=Math.min(bw/(x1-x0),bh/(y1-y0)); cx=bx+(bw-(x1-x0)*s)/2-x0*s; cy=by+(bh-(y1-y0)*s)/2+y1*s; }
  const px=x=>cx+x*s, py=y=>cy-y*s, glow=glo(svg), defs=el('defs',{},svg), id=svg.id||'eq';
  const rg=el('radialGradient',{id:id+'-mg',cx:'50%',cy:'50%',r:'60%'},defs); el('stop',{offset:'0','stop-color':'#fff'},rg); el('stop',{offset:'.7','stop-color':'#fff','stop-opacity':'.75'},rg); el('stop',{offset:'1','stop-color':'#fff','stop-opacity':'.04'},rg);
  const mk=el('mask',{id:id+'-m'},defs); el('rect',{x:bx,y:by,width:bw,height:bh,fill:`url(#${id}-mg)`},mk);
  const cp=el('clipPath',{id:id+'-c'},defs); el('rect',{x:bx,y:by,width:bw,height:bh,rx:10},cp);
  const g=el('g',{mask:`url(#${id}-m)`},svg), step=o.step||1;
  for(let x=Math.ceil((bx-cx)/s/step)*step;px(x)<=bx+bw;x+=step) el('line',{x1:px(x),y1:by,x2:px(x),y2:by+bh,stroke:'var(--grid)','stroke-width':Math.abs(x)<1e-9?0:1},g);
  for(let y=Math.ceil((cy-by-bh)/s/step)*step;py(y)>=by;y+=step) el('line',{x1:bx,y1:py(y),x2:bx+bw,y2:py(y),stroke:'var(--grid)','stroke-width':Math.abs(y)<1e-9?0:1},g);
  if(o.axes!==false){ el('line',{x1:bx,y1:py(0),x2:bx+bw,y2:py(0),stroke:'var(--axis)','stroke-width':1.4},g); el('line',{x1:px(0),y1:by,x2:px(0),y2:by+bh,stroke:'var(--axis)','stroke-width':1.4},g); }
  const layer=el('g',{'clip-path':`url(#${id}-c)`},svg);
  return {px,py,s,glow,layer,svg,W,H,cx,cy,box:[bx,by,bw,bh],ix:X=>(X-cx)/s,iy:Y=>(cy-Y)/s}; }
function glowLine(parent,x1,y1,x2,y2,color,w,glow,extra){ const g=el('g',{},parent);
  if(glow) el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':w*3.2,'stroke-linecap':'round',opacity:.22},g);
  el('line',Object.assign({x1,y1,x2,y2,stroke:color,'stroke-width':w,'stroke-linecap':'round'},extra||{}),g); return g; }
function glowPath(parent,d,color,w,glow,extra){ if(!d) return null; const g=el('g',{},parent);
  if(glow) el('path',{d,stroke:color,'stroke-width':w*3,fill:'none','stroke-linejoin':'round','stroke-linecap':'round',opacity:.2},g);
  el('path',Object.assign({d,stroke:color,'stroke-width':w,fill:'none','stroke-linejoin':'round','stroke-linecap':'round'},extra||{}),g); return g; }
/* pointer drag on an SVG, in viewBox coordinates */
function svgDrag(svg,onDown,onMove,onUp){ let on=false; svg.style.touchAction='none';
  const pt=e=>{ const r=svg.getBoundingClientRect(),W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height;
    return [(e.clientX-r.left)/(r.width||1)*W,(e.clientY-r.top)/(r.height||1)*H]; };
  svg.addEventListener('pointerdown',e=>{ const q=pt(e); if(onDown&&onDown(q[0],q[1])===false) return; on=true; try{svg.setPointerCapture(e.pointerId);}catch(_){} onMove(q[0],q[1]); e.preventDefault(); });
  svg.addEventListener('pointermove',e=>{ if(!on) return; const q=pt(e); onMove(q[0],q[1]); });
  const up=()=>{ if(!on) return; on=false; onUp&&onUp(); };
  svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',up); }
/* an arrow in raw SVG coordinates (optionally glowing) */
function svgArrow(parent,x0,y0,x1,y1,color,w,glow,op){ const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy); const g=el('g',{opacity:op==null?1:op},parent); if(L<1) return g;
  const hl=Math.min(11,L*.45), hx=x1-dx/L*hl, hy=y1-dy/L*hl, nx=-dy/L*hl*.42, ny=dx/L*hl*.42;
  if(glow) el('line',{x1:x0,y1:y0,x2:hx,y2:hy,stroke:color,'stroke-width':w*3.4,'stroke-linecap':'round',opacity:.22},g);
  el('line',{x1:x0,y1:y0,x2:hx,y2:hy,stroke:color,'stroke-width':w,'stroke-linecap':'round'},g);
  el('polygon',{points:`${x1},${y1} ${hx+nx},${hy+ny} ${hx-nx},${hy-ny}`,fill:color},g); return g; }
function setPressed(ids,on){ ids.forEach(id=>{ const b=document.getElementById(id); if(b) b.setAttribute('aria-pressed',id===on?'true':'false'); }); }
function setTabs(bar,key,attr){ bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset[attr||'t']===key?'true':'false')); }
function showPane(box,key){ box.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.dataset.pane===key)); }
function setRange(id,v,fmtr){ const r=document.getElementById(id), o=document.getElementById(id+'-o'); if(!r) return; r.value=v; if(o) o.textContent=fmtr?fmtr(+v):fmt(+v,2); }
/* ---------- 3D helpers ---------- */
const hxOf=ctx=>n=>{ const c=ctx.colors[n]; return CIN.hex(c||cssv(n==='critical'?'critical':n)); };
function clearGroup(g){ while(g.children.length){ const c=g.children[g.children.length-1]; g.remove(c);
  c.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ (Array.isArray(m.material)?m.material:[m.material]).forEach(x=>{ if(x.map&&x.map!==_spark) x.map.dispose(); x.dispose(); }); } }); } }
function haloSprite(ctx,color,size){ const Th=ctx.THREE; const m=new Th.SpriteMaterial({map:sparkTex(Th),color,transparent:true,opacity:ctx.isLight?.32:.65,blending:ctx.isLight?Th.NormalBlending:Th.AdditiveBlending,depthWrite:false,depthTest:false}); const s=new Th.Sprite(m); s.scale.set(size,size,1); s.renderOrder=14; return s; }
/* a cloud of soft glowing points; pts in three.js coords; set(pts) rewrites positions, tint(i,hex) recolours */
function glowCloud(ctx,pts,color,size,opacity){ const Th=ctx.THREE, n=pts.length, pos=new Float32Array(n*3), col=new Float32Array(n*3), c=new Th.Color(color);
  pts.forEach((p,i)=>{ pos[3*i]=p[0]; pos[3*i+1]=p[1]; pos[3*i+2]=p[2]; col[3*i]=c.r; col[3*i+1]=c.g; col[3*i+2]=c.b; });
  const g=new Th.BufferGeometry(); g.setAttribute('position',new Th.BufferAttribute(pos,3)); g.setAttribute('color',new Th.BufferAttribute(col,3));
  const m=new Th.PointsMaterial({size:size||.11,map:sparkTex(Th),vertexColors:true,transparent:true,opacity:opacity==null?(ctx.isLight?.85:.95):opacity,depthWrite:false,blending:ctx.isLight?Th.NormalBlending:Th.AdditiveBlending,sizeAttenuation:true});
  const P=new Th.Points(g,m); P.frustumCulled=false;
  P.userData.set=q=>{ const a=g.attributes.position; q.forEach((p,i)=>{ a.array[3*i]=p[0]; a.array[3*i+1]=p[1]; a.array[3*i+2]=p[2]; }); a.needsUpdate=true; };
  P.userData.tintAll=h=>{ const k=new Th.Color(h), a=g.attributes.color; for(let i=0;i<n;i++){ a.array[3*i]=k.r; a.array[3*i+1]=k.g; a.array[3*i+2]=k.b; } a.needsUpdate=true; };
  P.userData.tint=(i,h)=>{ const k=new Th.Color(h), a=g.attributes.color; a.array[3*i]=k.r; a.array[3*i+1]=k.g; a.array[3*i+2]=k.b; a.needsUpdate=true; };
  return P; }
/* n line segments whose ends can be rewritten every frame */
function segs(ctx,n,color,opacity){ const Th=ctx.THREE, g=new Th.BufferGeometry(); g.setAttribute('position',new Th.BufferAttribute(new Float32Array(n*6),3));
  const L=new Th.LineSegments(g,new Th.LineBasicMaterial({color,transparent:true,opacity:opacity==null?.5:opacity,depthWrite:false})); L.frustumCulled=false;
  L.userData.set=(A,B)=>{ const a=g.attributes.position.array; for(let i=0;i<n;i++){ const p=A[i],q=B[i]; a[6*i]=p[0];a[6*i+1]=p[1];a[6*i+2]=p[2];a[6*i+3]=q[0];a[6*i+4]=q[1];a[6*i+5]=q[2]; } g.attributes.position.needsUpdate=true; };
  return L; }
/* a glowing rod through the origin along a unit direction d (three.js coords), half-length h */
function rod(ctx,color,r){ const Th=ctx.THREE, g=new Th.Group();
  const m=new Th.Mesh(new Th.CylinderGeometry(r||.03,r||.03,1,16),new Th.MeshStandardMaterial({color,emissive:color,emissiveIntensity:ctx.isLight?.35:1.1,roughness:.3,transparent:true,opacity:1}));
  const glowM=new Th.Mesh(new Th.CylinderGeometry((r||.03)*3.2,(r||.03)*3.2,1,16),new Th.MeshBasicMaterial({color,transparent:true,opacity:ctx.isLight?.10:.16,depthWrite:false,blending:ctx.isLight?Th.NormalBlending:Th.AdditiveBlending}));
  const tipA=CIN.prim.dot(ctx,[0,0,0],color,(r||.03)*2.2), tipB=CIN.prim.dot(ctx,[0,0,0],color,(r||.03)*2.2);
  g.add(m,glowM,tipA,tipB);
  g.userData.set=(d,h,op)=>{ const v=new Th.Vector3(d[0],d[1],d[2]).normalize(); m.scale.y=glowM.scale.y=2*h; m.quaternion.setFromUnitVectors(new Th.Vector3(0,1,0),v); glowM.quaternion.copy(m.quaternion);
    tipA.position.copy(v.clone().multiplyScalar(h)); tipB.position.copy(v.clone().multiplyScalar(-h));
    if(op!=null){ m.material.opacity=op; glowM.material.opacity=(ctx.isLight?.10:.16)*op; tipA.material.transparent=tipB.material.transparent=true; tipA.material.opacity=tipB.material.opacity=op; } g.visible=op==null||op>.01; };
  return g; }
function camTo(handle,to,dur,done){ const s=handle.ctx.orbit.sph, from={theta:s.theta,phi:s.phi,radius:s.radius};
  return tween(dur,u=>{ if(handle.ctx.dead) return; if(to.theta!=null) s.theta=from.theta+(to.theta-from.theta)*u; if(to.phi!=null) s.phi=from.phi+(to.phi-from.phi)*u; if(to.radius!=null) s.radius=from.radius+(to.radius-from.radius)*u; handle.ctx.orbit.place(); },done); }
/* math (x, y, z-up) → three.js (x, y-up, z toward the camera) — Unit 6's convention */
const M3=v=>[v[0],v[2],-v[1]];
/* a glass disc/plane spanned by two unit directions (three.js coords) */
function glassPlane(ctx,color,size,opacity){ const Th=ctx.THREE; const sw=Array.isArray(size)?size[0]:size, sh=Array.isArray(size)?size[1]:size; const m=new Th.Mesh(new Th.PlaneGeometry(sw,sh),new Th.MeshStandardMaterial({color,transparent:true,opacity:opacity==null?(ctx.isLight?.16:.13):opacity,side:Th.DoubleSide,roughness:.2,metalness:.1,emissive:color,emissiveIntensity:ctx.isLight?.1:.3,depthWrite:false}));
  const edge=new Th.LineSegments(new Th.EdgesGeometry(m.geometry),new Th.LineBasicMaterial({color,transparent:true,opacity:ctx.isLight?.5:.55})); m.add(edge);
  const base=m.material.opacity, ebase=edge.material.opacity; m.userData.setOp=o=>{ m.material.opacity=Math.max(base,.12)*o; edge.material.opacity=ebase*o; m.visible=o>.01; }; if(base<=0) m.userData.setOp(0);
  m.userData.orient=(a,b)=>{ const A=new Th.Vector3(...a).normalize(), B=new Th.Vector3(...b).normalize(), N=A.clone().cross(B).normalize(); const M=new Th.Matrix4().makeBasis(A,B,N); m.quaternion.setFromRotationMatrix(M); };
  return m; }
function starField(ctx,n,R){ if(ctx.isLight) return null; const Th=ctx.THREE, sp=new Float32Array(n*3), r=rng(7);
  for(let k=0;k<n;k++){ let x,y,z; do{ x=(r()*2-1)*R; y=(r()*2-1)*R*.6; z=(r()*2-1)*R; }while(Math.hypot(x,y,z)<R*.35); sp[3*k]=x; sp[3*k+1]=y; sp[3*k+2]=z; }
  const g=new Th.BufferGeometry(); g.setAttribute('position',new Th.BufferAttribute(sp,3));
  const P=new Th.Points(g,new Th.PointsMaterial({color:hxOf(ctx)('ink2'),size:.05,transparent:true,opacity:.55,blending:Th.AdditiveBlending,depthWrite:false})); ctx.root.add(P); return P; }
/* a chart that redraws with a narrower viewBox on phones (so its text stays readable) */
function respVB(svg,wide,narrow){ const w=svg.getBoundingClientRect().width||svg.parentNode.getBoundingClientRect().width||800, n=w>0&&w<520; svg.setAttribute('viewBox',n?narrow:wide); return n; }
function onWidth(fn){ let last=innerWidth<520; addEventListener('resize',()=>{ const n=innerWidth<520; if(n!==last){ last=n; fn(); } }); }
function lightenSurface(ctx,surf,zs,ramp){ if(!ctx.isLight) return; const T=ctx.THREE, geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color, {zmin,zmax}=surf.userData;
  const c=ctx.colors, a=ramp||[c.s1,c.s7,c.s2], white=new T.Color(1,1,1);
  for(let i=0;i<pos.count;i++){ const t=(pos.getY(i)/zs-zmin)/((zmax-zmin)||1); const k=new T.Color(CIN.ramp(t,a[0],a[1],a[2])).lerp(white,.42).convertSRGBToLinear(); col.setXYZ(i,k.r,k.g,k.b); } col.needsUpdate=true; }
