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
function mountStage(box, build){ const S={box,build,handle:null}; STAGES.push(S); remount(S);
  if('IntersectionObserver' in window) new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting&&S.handle) S.handle.requestRender(); }),{threshold:.02}).observe(box);  /* a canvas the browser discarded off-screen gets repainted on return */
  return S; }
function remount(S){
  if(S.handle){ const h=S.handle; try{ h.ctx.dead=true; const R=h.ctx.renderer; R.render=()=>{}; R.setSize=()=>{}; h.dispose(); R.forceContextLoss(); }catch(e){} S.handle=null; }  /* give the GL context back — browsers cap live contexts and silently kill the oldest; the old loop may be woken again by its observers: make it inert */
  S.box.innerHTML=''; if(CIN&&window.THREE){ try{ S.handle=S.build(); }catch(e){ console.warn('stage failed', e); } } }
function hud(box, cls){ const d=document.createElement('div'); d.className='hud'+(cls?' '+cls:''); box.appendChild(d); return d; }
function hint(box, text){ const d=document.createElement('div'); d.className='hint'; d.textContent=text||'drag to orbit'; box.appendChild(d); return d; }
new MutationObserver(()=>STAGES.forEach(remount)).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
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
const solved=new Set((store.get('mfml-u8-checks')||'').split(',').filter(Boolean));
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
    if(ok){solved.add(id);store.set('mfml-u8-checks',[...solved].join(','));updScore();}
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
