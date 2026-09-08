/* ================= UNIT 8 · local helpers (on top of the house runtime) ================= */
const SUP=n=>String(n).replace(/-/g,'−').split('').map(c=>({'−':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','.':'·'})[c]||c).join('');
const SUB=n=>String(n).split('').map(c=>'₀₁₂₃₄₅₆₇₈₉'[+c]||c).join('');
const FACT=k=>{ let r=1; for(let i=2;i<=k;i++) r*=i; return r; };
const critHex=()=>CIN.hex(getComputedStyle(document.documentElement).getPropertyValue('--critical').trim());
/* small numbers in exponent style, everything else fixed — the convention the readouts share */
const sci=(v,d)=>(+v).toExponential(d==null?2:d);
const errFmt=v=>Math.abs(v)<1e-3&&v!==0?sci(v,3):fmt(v,5);
/* an SVG frame with independent x/y scales (the shared `plane` keeps one scale for both axes) */
function frame(svg,X0,X1,Y0,Y1,o){ o=o||{}; svg.innerHTML='';
  const W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height;
  const L=o.l==null?36:o.l,R=o.r==null?14:o.r,T=o.t==null?18:o.t,B=o.b==null?28:o.b;
  const px=x=>L+(x-X0)/(X1-X0)*(W-L-R), py=y=>H-B-(y-Y0)/(Y1-Y0)*(H-T-B);
  const glow=glo(svg); const defs=svg.querySelector('defs')||el('defs',{},svg);
  const cid='clip-'+(svg.id||'f'); const cp=el('clipPath',{id:cid},defs); el('rect',{x:L,y:T,width:W-L-R,height:H-T-B},cp);
  const g=el('g',{},svg), xs=o.xs||1, ys=o.ys||1, tf='font:500 10px system-ui;fill:var(--ink-muted)';
  const z=v=>Math.abs(v)<1e-9?0:v;
  for(let i=Math.ceil(X0/xs-1e-9);i*xs<=X1+1e-9;i++){ const x=i*xs,X=px(x); el('line',{x1:X,y1:py(Y0),x2:X,y2:py(Y1),stroke:'var(--grid)','stroke-width':1},g); if(o.xt!==false) txt(svg,X,H-B+13,fmt(z(x),2),tf,'middle'); }
  for(let i=Math.ceil(Y0/ys-1e-9);i*ys<=Y1+1e-9;i++){ const y=i*ys,Y=py(y); el('line',{x1:px(X0),y1:Y,x2:px(X1),y2:Y,stroke:'var(--grid)','stroke-width':1},g); if(o.yt!==false) txt(svg,L-5,Y+3.5,fmt(z(y),2),tf,'end'); }
  if(Y0<=0&&Y1>=0) el('line',{x1:px(X0),y1:py(0),x2:px(X1),y2:py(0),stroke:'var(--axis)','stroke-width':1.5},g);
  if(X0<=0&&X1>=0) el('line',{x1:px(0),y1:py(Y0),x2:px(0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.5},g);
  el('rect',{x:L,y:T,width:W-L-R,height:H-T-B,rx:6,fill:'none',stroke:'var(--line, var(--ring))',opacity:.7},g);
  const cy=v=>Math.max(py(Y1),Math.min(py(Y0),v));   /* clamp a pixel y into the frame */
  return {px,py,cy,glow,clip:'url(#'+cid+')',W,H,L,R,T,B,X0,X1,Y0,Y1}; }
/* a glowing straight segment: a filter region is sized from the bbox, so an axis-aligned line under the glow filter vanishes — fake the halo with a wide translucent underlay instead */
function glowLine(parent,x1,y1,x2,y2,color,w,glow,extra){ const g=el('g',{},parent);
  if(glow) el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':w*3.2,'stroke-linecap':'round',opacity:.22},g);
  const at=Object.assign({x1,y1,x2,y2,stroke:color,'stroke-width':w,'stroke-linecap':'round'},extra||{}); el('line',at,g); return g; }
/* in the light theme the surface ramp is washed toward white (as Unit 7's stages do), so the landscape reads on a pale page */
function lightenSurface(ctx,surf,zs,ramp){ if(!ctx.isLight) return; const T=ctx.THREE, geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color, {zmin,zmax}=surf.userData;
  const c=ctx.colors, a=ramp||[c.s1,c.s7,c.s2], white=new T.Color(1,1,1);
  for(let i=0;i<pos.count;i++){ const t=(pos.getY(i)/zs-zmin)/((zmax-zmin)||1); const k=new T.Color(CIN.ramp(t,a[0],a[1],a[2])).lerp(white,.42).convertSRGBToLinear(); col.setXYZ(i,k.r,k.g,k.b); } col.needsUpdate=true; }
/* remove and dispose everything in a three.js group */
function clearGroup(g){ while(g.children.length){ const c=g.children[g.children.length-1]; g.remove(c);
  c.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ (Array.isArray(m.material)?m.material:[m.material]).forEach(x=>{ if(x.map) x.map.dispose(); x.dispose(); }); } }); } }
/* the 2×2 symmetric Hessian [[A,B],[B,C]]: eigenvalues, eigen-directions, discriminant */
const angDeg=v=>{ let d=Math.atan2(v[1],v[0])*180/Math.PI; d=((d%180)+180)%180; return d; };
function eig2(A,B,C){ const tr=A+C, det=A*C-B*B, disc=Math.sqrt(((A-C)/2)*((A-C)/2)+B*B); const l1=tr/2+disc, l2=tr/2-disc;
  let v1=Math.abs(B)>1e-9?[B,l1-A]:(A>=C?[1,0]:[0,1]); const n=Math.hypot(v1[0],v1[1])||1; v1=[v1[0]/n,v1[1]/n]; const v2=[-v1[1],v1[0]];
  return {tr,det,disc,l1,l2,v1,v2,th1:angDeg(v1),th2:angDeg(v2)}; }
function hessKind(A,B,C){ const D=A*C-B*B; if(D>1e-9&&A>0) return 'min'; if(D>1e-9&&A<0) return 'max'; if(D<-1e-9) return 'saddle'; return 'flat'; }
function hessVerdict(A,B,C,verd){ const k=hessKind(A,B,C);
  if(k==='min'){ verd.className='verdict good'; verd.textContent='✓ D > 0 and fxx > 0 — bowl: local minimum'; }
  else if(k==='max'){ verd.className='verdict good'; verd.textContent='✓ D > 0 and fxx < 0 — dome: local maximum'; }
  else if(k==='saddle'){ verd.className='verdict bad'; verd.textContent='✗ D < 0 — saddle: up one way, down another'; }
  else { verd.className='verdict info'; verd.textContent='D = 0 — the test is silent (a trough, or worse)'; }
  return k; }
const HPRE={bowl:[2,0,2],dome:[-2,0,-2],saddle:[2,0,-2],twist:[0,1,0],trough:[2,0,0],b2:[4,2,6]};
function pressOnly(bar,btn){ bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===btn?'true':'false')); }
function selectTab(bar,key){ bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x.dataset.t===key?'true':'false')); }

/* ================= W1 · THE FLAT-SPOT HUNTER ================= */
(function(){
  const box=document.getElementById('w-flat'),svg=document.getElementById('fl-svg'),read=document.getElementById('fl-read'),verd=document.getElementById('fl-verdict');
  if(!box||!svg)return;
  const sA=document.getElementById('fl-a'),sB=document.getElementById('fl-b'),oA=document.getElementById('fl-a-o'),oB=document.getElementById('fl-b-o');
  const X0=-2.6,X1=2.8,Y0=-0.8,Y1=2.5;
  const fS=x=>0.55*Math.sin(1.6*x)+0.22*x*x-0.15*x, dS=x=>0.88*Math.cos(1.6*x)+0.44*x-0.15;
  const fK=x=>Math.abs(x-0.2)-0.6, dK=x=>x<0.2?-1:1;
  let mode='rolle',a=-1.6,b=1.8,cs=[],animH=null,P=null,tang=null,tLine=null,tHalo=null,tDot=null,hudT=null,cDots=[];
  const F=()=>mode==='broken'?fK:fS, DF=()=>mode==='broken'?dK:dS;
  function bisect(g,lo,hi){ let flo=g(lo); for(let i=0;i<60;i++){ const m=(lo+hi)/2,fm=g(m); if((fm<0)===(flo<0)){lo=m;flo=fm;} else hi=m; } return (lo+hi)/2; }
  function roots(g,lo,hi){ const out=[],N=600; let x0=lo,g0=g(lo); for(let i=1;i<=N;i++){ const x1=lo+(hi-lo)*i/N,g1=g(x1); if((g0<0)!==(g1<0)) out.push(bisect(g,x0,x1)); x0=x1; g0=g1; } return out; }
  function ends(){ if(mode==='broken') return {A:-1.2,B:1.6}; if(mode==='mvt') return {A:a,B:b};
    const r=roots(x=>fS(x)-fS(a),a+0.3,X1-0.05); return {A:a,B:r.length?r[0]:null}; }
  function stopAnim(){ if(animH){animH.stop();animH=null;} }
  function syncCtl(){
    sA.disabled=mode==='broken'; sB.disabled=mode!=='mvt';
    if(mode==='broken'){ oA.textContent='−1.2'; oB.textContent='1.6'; }
    else { oA.textContent=fmt(a,2); oB.textContent=mode==='rolle'?'auto':fmt(b,2); }
  }
  function draw(){
    stopAnim(); syncCtl(); const {A,B}=ends(), f=F(), df=DF();
    P=frame(svg,X0,X1,Y0,Y1,{l:30,r:14,t:30,b:26,xs:1,ys:1}); const glow=P.glow;
    let d=''; for(let i=0;i<=400;i++){ const x=X0+(X1-X0)*i/400; d+=(i?'L':'M')+P.px(x).toFixed(1)+','+P.py(f(x)).toFixed(1); }
    el('path',{d,stroke:'var(--s1)','stroke-width':3,fill:'none','stroke-linecap':'round','stroke-linejoin':'round',filter:glow||'none'},svg);
    txt(svg,P.L+6,P.T-10,mode==='broken'?'g(x) = |x − 0.2| − 0.6':'f(x) = 0.55 sin 1.6x + 0.22x² − 0.15x','font:600 10.5px system-ui;fill:var(--ink-muted)');
    const endMark=(x,name)=>{ el('line',{x1:P.px(x),y1:P.py(f(x)),x2:P.px(x),y2:P.py(Y0),stroke:'var(--s2)','stroke-width':1,'stroke-dasharray':'2 3',opacity:.6},svg);
      el('circle',{cx:P.px(x),cy:P.py(f(x)),r:5.5,fill:'var(--s2)',stroke:'var(--page)','stroke-width':1.5,filter:glow||'none'},svg);
      txt(svg,P.px(x),P.py(Y0)-6,name,'font:700 11px system-ui;fill:var(--s2)','middle'); };
    cs=[]; cDots=[];
    if(B==null){ endMark(A,'a');
      read.innerHTML=`f(a) = <b>${fmt(f(A),3)}</b><br>b: <b>none</b> — the curve never returns to that height in view`;
      verd.className='verdict info'; verd.textContent='no second point at that height in view — move a'; return; }
    const m=(f(B)-f(A))/(B-A);
    glowLine(svg,P.px(A),P.py(f(A)),P.px(B),P.py(f(B)),'var(--s2)',2.2,glow,{'stroke-dasharray':'7 5'});
    endMark(A,'a'); endMark(B,'b');
    if(mode!=='broken'){
      cs=roots(x=>df(x)-m,A+1e-3,B-1e-3);
      cs.forEach(c=>{ const y=f(c), L=.45;
        glowLine(svg,P.px(c-L),P.cy(P.py(y-L*m)),P.px(c+L),P.cy(P.py(y+L*m)),'var(--s3)',2.4,glow);
        const g=glowDot(svg,P.px(c),P.py(y),6,'var(--s4)',glow); cDots.push(g.lastChild);
        txt(svg,P.px(c),P.py(y)-14,'c','font:700 11px system-ui;fill:var(--s4)','middle'); });
    } else {
      glowDot(svg,P.px(0.2),P.py(-0.6),6,'var(--critical)',glow);
      txt(svg,P.px(0.2)+14,P.py(-0.6)+4,'no tangent here','font:700 10.5px system-ui;fill:var(--critical)');
    }
    /* the sliding tangent (revealed by ▶) + its slope readout in the corner */
    tang=el('g',{opacity:0},svg);
    tHalo=glow?el('line',{x1:0,y1:0,x2:0,y2:0,stroke:'var(--s1)','stroke-width':10,'stroke-linecap':'round',opacity:.22},tang):null;
    tLine=el('line',{x1:0,y1:0,x2:0,y2:0,stroke:'var(--s1)','stroke-width':3.2,'stroke-linecap':'round'},tang);
    tDot=el('circle',{cx:0,cy:0,r:5,fill:'var(--s1)',stroke:'var(--page)','stroke-width':1.5},tang);
    hudT=txt(svg,P.W-16,P.T-10,'','font:700 10.5px system-ui;fill:var(--ink-2)','end');
    const cList=cs.length?cs.map(c=>fmt(c,3)).join(', '):'—';
    if(mode==='mvt'){
      read.innerHTML=`average slope (f(b)−f(a))/(b−a) = <b>${fmt(m,3)}</b><br>c = <b>${cList}</b> (f′(c) = ${cs.length?cs.map(c=>fmt(df(c),3)).join(', '):'—'})`;
      verd.className='verdict good'; verd.textContent='✓ a point c with f′(c) equal to the chord\'s slope exists — as the theorem promises';
    } else if(mode==='rolle'){
      read.innerHTML=`f(a) = f(b) = <b>${fmt(f(A),3)}</b> · b (auto) = <b>${fmt(B,3)}</b><br>chord slope = <b>0</b><br>c = <b>${cList}</b> (f′(c) = 0)`;
      verd.className='verdict good'; verd.textContent='✓ f(a)=f(b) ⇒ a flat spot: f′(c)=0 at c = '+cList;
    } else {
      read.innerHTML=`g(a) = g(b) = <b>0.8</b> · chord slope = <b>0</b><br>c = <b>none</b> — g′ jumps from −1 to +1 at x = 0.2`;
      verd.className='verdict bad'; verd.textContent='✗ same height at both ends, yet no flat spot — the kink at x = 0.2 has no tangent, so Rolle\'s hypothesis fails and its promise is void';
    }
  }
  function place(x){ const f=F(), df=DF(), s=df(x), y=f(x), L=.45;
    [tLine,tHalo].forEach(ln=>{ if(!ln) return; ln.setAttribute('x1',P.px(x-L)); ln.setAttribute('y1',P.cy(P.py(y-L*s))); ln.setAttribute('x2',P.px(x+L)); ln.setAttribute('y2',P.cy(P.py(y+L*s))); });
    tDot.setAttribute('cx',P.px(x)); tDot.setAttribute('cy',P.py(y));
    hudT.textContent=mode==='broken'&&Math.abs(x-0.2)<0.02?'slope here: undefined — the kink':'slope here: '+fmt(s,2); }
  function flash(i){ const dot=cDots[i]; if(!dot) return; tween(360,u=>dot.setAttribute('r',6+9*Math.sin(Math.PI*u))); }
  function play(){ stopAnim(); const {A,B}=ends(); if(B==null||!tang) return;
    const way=[A,...cs,B], total=B-A; let i=0; tang.setAttribute('opacity',1);
    const seg=()=>{ if(i>=way.length-1){ animH=tween(500,()=>{},()=>{ tang.setAttribute('opacity',0); hudT.textContent=''; animH=null; }); return; }
      const from=way[i],to=way[i+1],ci=i; i++;
      animH=tween(Math.max(160,2600*(to-from)/total),u=>place(from+(to-from)*u),()=>{ if(i<way.length-1){ flash(ci); animH=tween(500,()=>{},seg); } else seg(); }); };
    place(A); seg(); }
  document.getElementById('fl-play').addEventListener('click',play);
  bindCtl('fl-a',v=>{ a=v; if(mode==='mvt'&&b<a+0.3){ b=Math.min(+sB.max,a+0.3); sB.value=b; } draw(); })();
  bindCtl('fl-b',v=>{ b=v; if(mode==='mvt'&&b<a+0.3){ a=Math.max(+sA.min,b-0.3); sA.value=a; } draw(); })();
  tabs(document.getElementById('fl-tabs'),t=>{ mode=t; if(mode==='mvt'&&b<a+0.3){ b=Math.min(+sB.max,a+0.3); sB.value=b; } draw(); });
  draw();
})();

/* ================= W2 · THE ROLLE LADDER ================= */
(function(){
  const box=document.getElementById('w-ladder'),svg=document.getElementById('ld-svg'),read=document.getElementById('ld-read'),verd=document.getElementById('ld-verdict');
  if(!box||!svg)return;
  const DER={exp:(j,x)=>Math.exp(x), sin:(j,x)=>[Math.sin,Math.cos,x=>-Math.sin(x),x=>-Math.cos(x)][j%4](x)};
  const NAME={exp:'eˣ',sin:'sin x'}, ROW=['F','F′','F″','F‴','F⁽⁴⁾'];
  let fn='exp',b=2,n=3,shown=99,animH=null,rows=[],newDots=[];
  function bisect(g,lo,hi){ let flo=g(lo); for(let i=0;i<70;i++){ const m=(lo+hi)/2,fm=g(m); if((fm<0)===(flo<0)){lo=m;flo=fm;} else hi=m; } return (lo+hi)/2; }
  /* the promised zero strictly inside (lo,hi): first sign change from the a-side; a tangency falls back to the interior minimum of |g| */
  function findZero(g,lo,hi){ const N=600; let x0=lo+(hi-lo)/N,g0=g(x0);
    for(let i=2;i<N;i++){ const x1=lo+(hi-lo)*i/N,g1=g(x1); if((g0<0)!==(g1<0)) return bisect(g,x0,x1); x0=x1; g0=g1; }
    let best=null,bv=Infinity; const vs=[]; for(let i=0;i<=N;i++) vs.push(Math.abs(g(lo+(hi-lo)*i/N)));
    for(let i=12;i<N-12;i++) if(vs[i]<=vs[i-1]&&vs[i]<=vs[i+1]&&vs[i]<bv){ bv=vs[i]; best=lo+(hi-lo)*i/N; }
    return best; }
  function model(){ const f=(j,x)=>DER[fn](j,x); const coef=[]; for(let k=0;k<n;k++) coef[k]=f(k,0)/FACT(k);
    let s=0; for(let k=0;k<n;k++) s+=coef[k]*Math.pow(b,k); coef[n]=(f(0,b)-s)/Math.pow(b,n);
    const Fj=(j,x)=>{ let v=f(j,x); for(let k=j;k<=n;k++) v-=coef[k]*FACT(k)/FACT(k-j)*Math.pow(x,k-j); return v; };
    const cs=[]; let hi=b; for(let j=1;j<=n;j++){ const c=findZero(x=>Fj(j,x),0,hi); cs.push(c); if(c!=null) hi=c; }
    return {f,coef,Fj,cs}; }
  function draw(){
    const M=model(); svg.innerHTML=''; const glow=glo(svg); rows=[]; newDots=[];
    const W=600,H=400,L=46,R=14,top=26,bot=18, rh=(H-top-bot)/(n+1), X0=-0.15,X1=b+0.15;
    const px=x=>L+(x-X0)/(X1-X0)*(W-L-R);
    txt(svg,L,15,`f = ${NAME[fn]} · P copies f and its first ${n-1} derivative${n>2?'s':''} at a = 0, then hits f at b · F = f − P`,'font:600 10.5px system-ui;fill:var(--ink-muted)');
    /* every row has its own y-scale; compute them first so drop-lines can land exactly on the next zero line */
    const SC=[]; for(let j=0;j<=n;j++){ const y0=top+j*rh, vals=[]; for(let i=0;i<=160;i++) vals.push(M.Fj(j,X0+(X1-X0)*i/160));
      let lo=Math.min(0,...vals),hi=Math.max(0,...vals); const span=(hi-lo)||1; lo-=span*.12; hi+=span*.12;
      SC.push({y0,vals,py:v=>y0+rh-6-(v-lo)/(hi-lo)*(rh-12)}); }
    for(let j=0;j<=n;j++){
      const {y0,vals,py}=SC[j], g=el('g',{opacity:j<shown?1:0},svg); rows.push(g);
      el('rect',{x:L,y:y0+1,width:W-L-R,height:rh-2,rx:6,fill:'color-mix(in srgb, var(--surface) 55%, transparent)',stroke:'var(--line, var(--ring))',opacity:.8},g);
      el('line',{x1:px(X0),y1:py(0),x2:px(X1),y2:py(0),stroke:'var(--axis)','stroke-width':1.2},g);
      txt(g,10,y0+rh/2+5,ROW[j],'font:700 13px system-ui;fill:var(--s4)');
      let d=''; vals.forEach((v,i)=>{ d+=(i?'L':'M')+px(X0+(X1-X0)*i/160).toFixed(1)+','+py(v).toFixed(1); });
      el('path',{d,stroke:'var(--s1)','stroke-width':2.4,fill:'none','stroke-linejoin':'round',filter:glow||'none'},g);
      const faint=(x,lab)=>{ el('circle',{cx:px(x),cy:py(0),r:4,fill:'var(--s4)',opacity:.4},g); if(lab) txt(g,px(x),py(0)-8,lab,'font:600 9.5px system-ui;fill:var(--s4)','middle'); };
      if(j===0){ faint(0,'a'); faint(b,'b'); if(n>=1) el('line',{x1:px(b),y1:py(0),x2:px(b),y2:SC[1].py(0),stroke:'var(--s4)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.35},g); }
      else { const prev=j===1?b:M.cs[j-2]; if(j<n) faint(0,'a'); if(prev!=null) faint(prev,j===1?'b':'c'+SUB(j-1)); }
      if(j>=1&&M.cs[j-1]!=null){ const c=M.cs[j-1];
        if(j<n) el('line',{x1:px(c),y1:py(0),x2:px(c),y2:SC[j+1].py(0),stroke:'var(--s4)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.6},g);
        const dg=glowDot(g,px(c),py(0),5.5,'var(--s4)',glow); newDots.push(dg);
        txt(g,px(c)+8,py(0)-8,'c'+SUB(j)+' = '+fmt(c,3),'font:700 10.5px system-ui;fill:var(--s4)'); }
      txt(g,W-R-4,y0+12,j===0?'F(a) = F(b) = 0 · Rolle ⇒ F′(c₁) = 0':(j<n?`${ROW[j]}(a) = 0 by construction · Rolle ⇒ ${ROW[j+1]}(c${SUB(j+1)}) = 0`:`f⁽${SUP(n)}⁾(c${SUB(n)}) = n!·aₙ`),'font:600 9px system-ui;fill:var(--ink-muted)','end');
    }
    /* x ticks along the bottom */
    for(let x=0;x<=b+1e-9;x+=0.5) txt(svg,px(x),H-4,fmt(x,1),'font:500 9.5px system-ui;fill:var(--ink-muted)','middle');
    const all=M.cs.every(c=>c!=null), nested=all&&M.cs.every((c,i)=>c>0&&c<(i?M.cs[i-1]:b));
    const cn=M.cs[n-1], lhs=cn!=null?M.f(n,cn):NaN, rhs=FACT(n)*M.coef[n];
    read.innerHTML=M.cs.map((c,i)=>`c${SUB(i+1)} = <b>${c==null?'?':fmt(c,4)}</b>`).join(' &nbsp; ')
      +`<br>F⁽${SUP(n)}⁾(c${SUB(n)}) = 0 ⇒ f⁽${SUP(n)}⁾(c${SUB(n)}) = <b>${cn!=null?fmt(lhs,4):'?'}</b> = n!·aₙ = <b>${fmt(rhs,4)}</b>`;
    if(nested){ verd.className='verdict good'; verd.textContent='✓ a < '+M.cs.map((c,i)=>'c'+SUB(n-i)).join(' < ')+' < b — each rung hands one zero down'; }
    else { verd.className='verdict info'; verd.textContent='a zero went missing numerically — nudge b'; }
  }
  function stopAnim(){ if(animH){animH.stop();animH=null;} }
  function reveal(j,then){ const g=rows[j]; if(!g){ then&&then(); return; } g.setAttribute('opacity',0); shown=j+1;
    animH=tween(500,u=>g.setAttribute('opacity',u),()=>{ const dg=newDots[j-1]; if(dg){ const c=dg.lastChild; animH=tween(320,u=>c.setAttribute('r',5.5+7*Math.sin(Math.PI*u)),()=>{ animH=null; then&&then(); }); } else { animH=null; then&&then(); } }); }
  document.getElementById('ld-play').addEventListener('click',()=>{ stopAnim(); shown=1; rows.forEach((g,j)=>g.setAttribute('opacity',j<1?1:0)); let j=1; const next=()=>{ if(j<=n) reveal(j++,next); }; next(); });
  document.getElementById('ld-step').addEventListener('click',()=>{ stopAnim(); if(shown>n){ shown=1; rows.forEach((g,j)=>g.setAttribute('opacity',j<1?1:0)); return; } reveal(shown); });
  document.getElementById('ld-reset').addEventListener('click',()=>{ stopAnim(); shown=1; rows.forEach((g,j)=>g.setAttribute('opacity',j<1?1:0)); });
  bindCtl('ld-b',v=>{ b=v; stopAnim(); shown=99; draw(); })();
  bindCtl('ld-n',v=>{ n=v|0; stopAnim(); shown=99; draw(); },v=>String(v|0))();
  tabs(document.getElementById('ld-tabs'),t=>{ fn=t; stopAnim(); shown=99; draw(); });
  draw();
})();

/* ================= W3 · THE REMAINDER DETECTIVE ================= */
(function(){
  const box=document.getElementById('w-rem'),svg=document.getElementById('rm-svg'),read=document.getElementById('rm-read'),verd=document.getElementById('rm-verdict');
  if(!box||!svg)return;
  const sX=document.getElementById('rm-x'),sN=document.getElementById('rm-n');
  const TABS={
    exp:{a:0,r:[-1.5,2.5],y:[-1.5,13],xs:.5,ys:2,x0:1,name:'eˣ',d:(j,x)=>Math.exp(x)},
    cos:{a:0,r:[-3,3],y:[-3.2,1.6],xs:1,ys:1,x0:1,name:'cos x',d:(j,x)=>[Math.cos,x=>-Math.sin(x),x=>-Math.cos(x),Math.sin][j%4](x)},
    ln:{a:1,r:[0.3,3],y:[-2.2,1.6],xs:.5,ys:1,x0:1.5,name:'ln x',d:(j,x)=>j===0?Math.log(x):Math.pow(-1,j-1)*FACT(j-1)/Math.pow(x,j)},
    sqrt:{a:4,r:[1,8],y:[0.4,3.4],xs:1,ys:1,x0:4.2,name:'√x',d:(j,x)=>{ if(j===0) return Math.sqrt(x); let c=1; for(let i=0;i<j;i++) c*=(0.5-i); return c*Math.pow(x,0.5-j); }}};
  let tab='exp',n=2,xv=1;
  function bisect(g,lo,hi){ let flo=g(lo); for(let i=0;i<80;i++){ const m=(lo+hi)/2,fm=g(m); if((fm<0)===(flo<0)){lo=m;flo=fm;} else hi=m; } return (lo+hi)/2; }
  function setTab(t,xval,nval){ tab=t; const T=TABS[t]; selectTab(document.getElementById('rm-tabs'),t);
    sX.min=T.r[0]; sX.max=T.r[1]; sX.step=0.05; xv=xval==null?T.x0:xval; sX.value=xv; document.getElementById('rm-x-o').textContent=fmt(xv,2);
    if(nval!=null){ n=nval; sN.value=n; document.getElementById('rm-n-o').textContent=String(n); } }
  function draw(){
    const T=TABS[tab], a=T.a, x=Math.max(T.r[0],Math.min(T.r[1],xv)), f=t=>T.d(0,t);
    const Pn=t=>{ let s=0; for(let k=0;k<n;k++) s+=T.d(k,a)/FACT(k)*Math.pow(t-a,k); return s; };
    const Mof=t=>{ const lo=Math.min(a,t),hi=Math.max(a,t); let M=0; for(let i=0;i<=40;i++) M=Math.max(M,Math.abs(T.d(n,lo+(hi-lo)*i/40))); return M; };
    const bnd=t=>Mof(t)*Math.pow(Math.abs(t-a),n)/FACT(n);
    const p=frame(svg,T.r[0],T.r[1],T.y[0],T.y[1],{l:36,r:14,t:30,b:26,xs:T.xs,ys:T.ys}); const glow=p.glow;
    /* the guarantee band */
    let up='',dn=''; const N=120; for(let i=0;i<=N;i++){ const t=T.r[0]+(T.r[1]-T.r[0])*i/N, c=Pn(t), w=bnd(t);
      up+=(i?'L':'M')+p.px(t).toFixed(1)+','+p.cy(p.py(c+w)).toFixed(1); dn=('L'+p.px(t).toFixed(1)+','+p.cy(p.py(c-w)).toFixed(1))+dn; }
    el('path',{d:up+dn+'Z',fill:'var(--s4)',opacity:.16,'clip-path':p.clip},svg);
    const curve=(g,col,w,dash)=>{ let d=''; for(let i=0;i<=300;i++){ const t=T.r[0]+(T.r[1]-T.r[0])*i/300; d+=(i?'L':'M')+p.px(t).toFixed(1)+','+p.cy(p.py(g(t))).toFixed(1); }
      const a2={d,stroke:col,'stroke-width':w,fill:'none','stroke-linejoin':'round','clip-path':p.clip}; if(dash) a2['stroke-dasharray']=dash; if(glow&&!dash) a2.filter=glow; el('path',a2,svg); };
    curve(Pn,'var(--s2)',2.4,'7 4'); curve(f,'var(--s1)',3);
    /* anchor, gap, c */
    const fa=f(a); el('circle',{cx:p.px(a),cy:p.py(fa),r:6,fill:'var(--s4)',stroke:'var(--page)','stroke-width':1.5,filter:glow||'none'},svg);
    txt(svg,p.px(a),p.py(fa)-12,'a = '+String(a),'font:700 10.5px system-ui;fill:var(--s4)','middle');
    const fx=f(x), Px=Pn(x), err=fx-Px, bound=bnd(x), gapPx=Math.abs(p.py(fx)-p.py(Px));
    el('line',{x1:p.px(x),y1:p.cy(p.py(fx)),x2:p.px(x),y2:p.cy(p.py(Px)),stroke:'var(--critical)','stroke-width':4,'stroke-linecap':'round',opacity:.95},svg);
    el('circle',{cx:p.px(x),cy:p.cy(p.py(Px)),r:4.5,fill:'var(--s2)'},svg); el('circle',{cx:p.px(x),cy:p.cy(p.py(fx)),r:4.5,fill:'var(--s1)'},svg);
    { const right=p.px(x)>p.W-70; txt(svg,p.px(x)+(right?-9:9),p.cy((p.py(fx)+p.py(Px))/2)+4,gapPx>14?'error':'x','font:650 10px system-ui;fill:var(--critical)',right?'end':'start'); }
    let c=null, cTxt;
    if(Math.abs(x-a)<1e-9){ cTxt='any point (no gap)'; }
    else { const R=err, target=FACT(n)*R/Math.pow(x-a,n), g=t=>T.d(n,t)-target, lo=Math.min(a,x),hi=Math.max(a,x);
      if(tab==='cos'){ let t0=lo,g0=g(lo); for(let i=1;i<=400;i++){ const t1=lo+(hi-lo)*i/400,g1=g(t1); if((g0<0)!==(g1<0)){ c=bisect(g,t0,t1); break; } t0=t1; g0=g1; } }
      else if((g(lo)<0)!==(g(hi)<0)) c=bisect(g,lo,hi);
      if(c==null){ let best=lo,bv=Infinity; for(let i=0;i<=400;i++){ const t=lo+(hi-lo)*i/400,v=Math.abs(g(t)); if(v<bv){bv=v;best=t;} } c=best; }
      cTxt='c = '+fmt(c,4);
      const yAx=T.y[0]<=0&&T.y[1]>=0?p.py(0):p.py(T.y[0]);
      el('line',{x1:p.px(c),y1:yAx,x2:p.px(c),y2:p.cy(p.py(f(c))),stroke:'var(--s4)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.7},svg);
      glowDot(svg,p.px(c),yAx,5.5,'var(--s4)',glow);
      txt(svg,p.px(c),yAx+(yAx>p.H-p.B-14?-9:16),'c = '+fmt(c,3),'font:700 10.5px system-ui;fill:var(--s4)','middle'); }
    txt(svg,p.L+6,p.T-10,`${T.name} (blue) · P${SUB(n-1)} (orange, dashed) · band = P${SUB(n-1)} ± M|t−a|${SUP(n)}/${n}!`,'font:600 10px system-ui;fill:var(--ink-muted)');
    read.innerHTML=`P${SUB(n-1)}(${fmt(x,2)}) = <b>${fmt(Px,6)}</b><br>f(${fmt(x,2)}) = <b>${fmt(fx,6)}</b><br>error f − P = <b style="color:var(--critical)">${errFmt(err)}</b><br>bound M·|x−a|${SUP(n)}/${n}! = <b>${errFmt(bound)}</b><br>the c that makes it exact: <b>${cTxt}</b>`;
    const strict=c!=null&&c>Math.min(a,x)+1e-9*Math.max(1,Math.abs(x-a))&&c<Math.max(a,x)-1e-9*Math.max(1,Math.abs(x-a));
    if(bound>=1){ verd.className='verdict info'; verd.textContent='bound ≥ 1 — the guarantee is honest but weak this far from the anchor'; }
    else if(c==null){ verd.className='verdict info'; verd.textContent='x = a: no gap to explain — every c works'; }
    else if(Math.abs(err)<=bound*(1+1e-9)+1e-15&&strict){ verd.className='verdict good'; verd.textContent='✓ |error| ≤ bound, and c lies strictly between a and x — exactly as Taylor\'s theorem promises'; }
    else { verd.className='verdict info'; verd.textContent='rounding at this scale hides the strict inequality — move x a little farther from a'; }
  }
  bindCtl('rm-n',v=>{ n=v|0; draw(); },v=>String(v|0))();
  bindCtl('rm-x',v=>{ xv=v; draw(); })();
  tabs(document.getElementById('rm-tabs'),t=>{ setTab(t); draw(); });
  const PRE={a3:['sqrt',4.2,3],cos05:['cos',0.5,4],ln15:['ln',1.5,5],e1:['exp',1,5]};
  box.querySelectorAll('.presets [data-p]').forEach(btn=>btn.addEventListener('click',()=>{ const P=PRE[btn.dataset.p]; if(!P) return; pressOnly(btn.parentNode,btn); setTab(P[0],P[1],P[2]); draw(); }));
  draw();
})();

/* ================= W4 · THE LINE TRICK (three.js + side chart) ================= */
(function(){
  const box=document.getElementById('wk-3d'),side=document.getElementById('wk-side'),read=document.getElementById('wk-read'),verd=document.getElementById('wk-verdict');
  if(!box)return;
  const f=(x,y)=>Math.exp(x)*Math.sin(y), fx=(x,y)=>Math.exp(x)*Math.sin(y), fy=(x,y)=>Math.exp(x)*Math.cos(y), fxx=fx, fxy=fy, fyy=(x,y)=>-Math.exp(x)*Math.sin(y);
  const DOM=1.2, ZS=.55, P3=(x,y,z)=>[x,z*ZS,-y];
  const S={a:0,b:0,h:0.5,k:0.6}; let tab='walk',sc=null,hudEl=null;
  const ctl={}; ['a','b','h','k'].forEach(k=>ctl[k]=document.getElementById('wk-'+k));
  function clampStep(){ let ch=false; const hmin=-DOM-S.a,hmax=DOM-S.a,kmin=-DOM-S.b,kmax=DOM-S.b;
    if(S.h<hmin||S.h>hmax){ S.h=Math.round(Math.max(hmin,Math.min(hmax,S.h))*20)/20; ctl.h.value=S.h; document.getElementById('wk-h-o').textContent=fmt(S.h,2); ch=true; }
    if(S.k<kmin||S.k>kmax){ S.k=Math.round(Math.max(kmin,Math.min(kmax,S.k))*20)/20; ctl.k.value=S.k; document.getElementById('wk-k-o').textContent=fmt(S.k,2); ch=true; } return ch; }
  function calc(){ const {a,b,h,k}=S; const F0=f(a,b), F1=h*fx(a,b)+k*fy(a,b), F2=h*h*fxx(a,b)+2*h*k*fxy(a,b)+k*k*fyy(a,b);
    const Q=(x,y)=>{ const dx=x-a,dy=y-b; return F0+fx(a,b)*dx+fy(a,b)*dy+.5*(fxx(a,b)*dx*dx+2*fxy(a,b)*dx*dy+fyy(a,b)*dy*dy); };
    const fS=f(a+h,b+k), QS=Q(a+h,b+k); return {F0,F1,F2,Q,fS,QS,gap:fS-QS,Ft:t=>f(a+t*h,b+t*k),Qt:t=>F0+F1*t+.5*F2*t*t}; }
  function build(){
    sc=null; const narrow=box.clientWidth<560;
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[4.9,4.0,6.0]:[4.4,3.5,5.4],look:[0,-.05,0],fov:34},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        const surf=CIN.prim.surface(ctx,f,{x:[-DOM,DOM],y:[-DOM,DOM],res:72,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:.92}); lightenSurface(ctx,surf,ZS); root.add(surf);
        const floorY=surf.userData.zmin*ZS-.12;
        const grid=CIN.prim.grid(ctx,3.2,16,hx('grid'),{opacity:isLight?.5:.35}); grid.position.y=floorY; root.add(grid);
        [['x →',[DOM+.35,floorY,DOM+.15]],['y →',[-DOM-.2,floorY,-DOM-.35]]].forEach(([t,p])=>root.add(CIN.prim.label(ctx,t,p,{size:24,color:colors.muted,bg:false,depthTest:false})));
        const dyn=new THREE.Group(); root.add(dyn);
        sc={THREE,ctx,root,dyn,colors,isLight,hx,floorY};
        hudEl=hud(box); hint(box,'drag to orbit');
        paint();
      },
      update(ctx){ return false; }
    });
    if(handle) grab(handle,()=>false,()=>{});
    return handle;
  }
  function paint(){
    if(!sc) return; const {THREE,ctx,dyn,hx,isLight,floorY}=sc, C=calc(), {a,b,h,k}=S;
    clearGroup(dyn);
    /* the straight segment on the floor, and the walk lifted onto the surface */
    dyn.add(tube(ctx,[a,floorY+.005,-b],[a+h,floorY+.005,-(b+k)],hx('s4'),.018));
    dyn.add(CIN.prim.dot(ctx,[a,floorY+.005,-b],hx('s4'),.035)); dyn.add(CIN.prim.dot(ctx,[a+h,floorY+.005,-(b+k)],hx('s1'),.035));
    const showWalk=tab!=='clone', full=tab!=='clone';
    const pts=(t0,t1)=>{ const o=[]; for(let i=0;i<=40;i++){ const t=t0+(t1-t0)*i/40; o.push(P3(a+t*h,b+t*k,C.Ft(t)+.01)); } return o; };
    if(Math.hypot(h,k)>1e-6){
      if(full){ [[-.25,0],[1,1.25]].forEach(([t0,t1])=>{ const r=ribbon(ctx,pts(t0,t1),hx('s3'),.016); r.material.transparent=true; r.material.opacity=.4; dyn.add(r); }); }
      const r=ribbon(ctx,pts(0,1),hx('s3'),.03); if(!showWalk){ r.material.transparent=true; r.material.opacity=.5; } dyn.add(r);
    }
    const PP=P3(a,b,f(a,b)), SS=P3(a+h,b+k,C.fS);
    dyn.add(overlay(CIN.prim.dot(ctx,PP,hx('s4'),.06))); dyn.add(overlay(CIN.prim.dot(ctx,SS,hx('s1'),.06)));
    dyn.add(tube(ctx,[a,floorY,-b],PP,hx('ink2'),.005,.5)); dyn.add(tube(ctx,[a+h,floorY,-(b+k)],SS,hx('ink2'),.005,.5));
    dyn.add(CIN.prim.label(ctx,'P',[PP[0],PP[1]+.2,PP[2]],{size:22,color:sc.colors.s4,bg:false,depthTest:false}));
    dyn.add(CIN.prim.label(ctx,'S',[SS[0],SS[1]+.2,SS[2]],{size:22,color:sc.colors.s1,bg:false,depthTest:false}));
    if(tab!=='walk'){
      const R=.75, clone=CIN.prim.surface(ctx,C.Q,{x:[a-R,a+R],y:[b-R,b+R],res:40,zscale:ZS,ramp:[sc.colors.s4,sc.colors.s4,sc.colors.s4],wire:false,opacity:.5});
      const mat=clone.userData.mesh.material; mat.depthWrite=false; mat.emissive=new THREE.Color(hx('s4')); mat.emissiveIntensity=isLight?.12:.35; mat.roughness=.25;
      const vis=fadeAttr(THREE,clone), pos=clone.userData.geo.attributes.position;
      for(let i=0;i<pos.count;i++){ const d=Math.hypot(pos.getX(i),pos.getZ(i)); vis.setX(i,d<.55*R?1:Math.max(0,1-(d-.55*R)/(.45*R))); } vis.needsUpdate=true;
      clone.position.set(a,.004,-b); clone.renderOrder=5; dyn.add(clone);   /* the patch geometry is centred on the origin; its heights were sampled around (a, b) */
      const QP=P3(a+h,b+k,C.QS); dyn.add(overlay(CIN.prim.dot(ctx,QP,hx('s2'),.05)));
      if(Math.abs(C.gap)*ZS>.004) dyn.add(overlay(tube(ctx,QP,SS,critHex(),.02)));
    }
    if(hudEl) hudEl.innerHTML=`f(S) = <b>${fmt(C.fS,4)}</b> · Q(S) = <b>${fmt(C.QS,4)}</b> · gap = <b>${Math.abs(C.gap)<1e-2?sci(C.gap,2):fmt(C.gap,4)}</b>`;
    ctx.requestRender&&ctx.requestRender();
  }
  function drawSide(){
    if(!side) return; const C=calc(); side.innerHTML=''; const glow=glo(side);
    const W=300,H=150,pad=[34,10,24,10], T0=-.25,T1=1.25;
    const vals=[]; for(let i=0;i<=60;i++){ const t=T0+(T1-T0)*i/60; vals.push(C.Ft(t),C.Qt(t)); }
    let lo=Math.min(...vals),hi=Math.max(...vals); const span=(hi-lo)||1; lo-=span*.12; hi+=span*.12;
    const px=t=>pad[0]+(t-T0)/(T1-T0)*(W-pad[0]-pad[3]),py=v=>H-pad[2]-(v-lo)/(hi-lo)*(H-pad[1]-pad[2]);
    el('rect',{x:pad[0],y:pad[1],width:W-pad[0]-pad[3],height:H-pad[1]-pad[2],fill:'none',stroke:'var(--line, var(--ring))'},side);
    [0,1].forEach(t=>{ el('line',{x1:px(t),y1:pad[1],x2:px(t),y2:H-pad[2],stroke:'var(--grid)'},side); txt(side,px(t),H-pad[2]+11,t===0?'t = 0 (P)':'t = 1 (S)','font:600 9px system-ui;fill:var(--ink-muted)','middle'); });
    if(lo<=0&&hi>=0) el('line',{x1:px(T0),y1:py(0),x2:px(T1),y2:py(0),stroke:'var(--axis)'},side);
    [lo+span*.12,hi-span*.12].forEach(v=>txt(side,pad[0]-4,py(v)+3,fmt(v,2),'font:500 9px system-ui;fill:var(--ink-muted)','end'));
    const curve=(g,col,dash)=>{ let d=''; for(let i=0;i<=80;i++){ const t=T0+(T1-T0)*i/80; d+=(i?'L':'M')+px(t).toFixed(1)+','+py(g(t)).toFixed(1); }
      const at={d,stroke:col,'stroke-width':2.2,fill:'none'}; if(dash) at['stroke-dasharray']=dash; else if(glow&&span>1e-6) at.filter=glow; el('path',at,side); };
    curve(C.Qt,'var(--s2)','5 3'); curve(C.Ft,'var(--s3)');
    glowDot(side,px(0),py(C.Ft(0)),3.5,'var(--s4)',glow); glowDot(side,px(1),py(C.Ft(1)),3.5,'var(--s1)',glow);
    el('circle',{cx:px(1),cy:py(C.Qt(1)),r:3,fill:'var(--s2)'},side);
    txt(side,W-pad[3]-4,pad[1]+12,'F(1) = '+fmt(C.Ft(1),4),'font:700 9.5px system-ui;fill:var(--s3)','end');
    txt(side,W-pad[3]-4,pad[1]+24,'quadratic = '+fmt(C.Qt(1),4),'font:700 9.5px system-ui;fill:var(--s2)','end');
    txt(side,pad[0]+4,pad[1]+12,'F(t) = f(a+th, b+tk)','font:600 9px system-ui;fill:var(--ink-muted)');
  }
  function draw(){
    clampStep(); const C=calc(), {a,b,h,k}=S;
    read.innerHTML=`F′(0) = h·fx + k·fy = <b>${fmt(C.F1,4)}</b><br>F″(0) = h²fxx + 2hk·fxy + k²fyy = <b>${fmt(C.F2,4)}</b><br>f(S) = <b>${fmt(C.fS,5)}</b> · Q(S) = <b>${fmt(C.QS,5)}</b><br>gap f − Q = <b style="color:var(--critical)">${Math.abs(C.gap)<1e-2?sci(C.gap,2):fmt(C.gap,4)}</b>`;
    verd.className='verdict info'; verd.textContent=`gap ≈ ${Math.abs(C.gap)<1e-2?sci(Math.abs(C.gap),2):fmt(Math.abs(C.gap),4)} — a third-order crumb: halve the step and it shrinks ≈ 8×`;
    drawSide(); paint();
  }
  const upd={}; ['a','b','h','k'].forEach(key=>{ upd[key]=bindCtl('wk-'+key,v=>{ S[key]=v; draw(); }); });
  Object.values(upd).forEach(u=>u());
  tabs(document.getElementById('wk-tabs'),t=>{ tab=t; paint(); });
  const PRE={a2:{a:0,b:0,h:0.1,k:0.2},a2x2:{a:0,b:0,h:0.2,k:0.4}};
  document.querySelectorAll('#w-walk .presets [data-p]').forEach(btn=>btn.addEventListener('click',()=>{ const P=PRE[btn.dataset.p]; if(!P) return; pressOnly(btn.parentNode,btn);
    for(const key in P){ ctl[key].value=P[key]; S[key]=P[key]; document.getElementById('wk-'+key+'-o').textContent=fmt(P[key],2); } draw(); }));
  const ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W5 · THE JUDGE (three.js) ================= */
(function(){
  const box=document.getElementById('jd-3d'),read=document.getElementById('jd-read'),verd=document.getElementById('jd-verdict');
  if(!box)return;
  const sA=document.getElementById('jd-a'),sB=document.getElementById('jd-b'),sC=document.getElementById('jd-c');
  sA.setAttribute('max','6'); sC.setAttribute('max','6');
  const R=1.5; let A=2,B=0,C=2,tab='disc',theta=0,sc=null,hudEl=null;
  const Qf=(x,y)=>0.5*(A*x*x+2*B*x*y+C*y*y), Qdir=th=>A*Math.cos(th)*Math.cos(th)+2*B*Math.sin(th)*Math.cos(th)+C*Math.sin(th)*Math.sin(th);
  function build(){
    sc=null; const narrow=box.clientWidth<560;
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[4.4,3.6,5.4]:[3.6,2.9,4.5],look:[0,.2,0],fov:34},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        const grid=CIN.prim.grid(ctx,4,16,hx('grid'),{opacity:isLight?.5:.35}); grid.position.y=-1.35; root.add(grid);
        const surf=CIN.prim.surface(ctx,Qf,{x:[-R,R],y:[-R,R],res:64,zscale:.3,ramp:[colors.s1,colors.s7,colors.s2],opacity:.9}); root.add(surf);
        [['x →',[R+.35,-1.35,R+.1]],['y →',[-R-.25,-1.35,-R-.3]]].forEach(([t,p])=>root.add(CIN.prim.label(ctx,t,p,{size:24,color:colors.muted,bg:false,depthTest:false})));
        const flat=overlay(CIN.prim.dot(ctx,[0,0,0],hx('ink'),.05)); root.add(flat);
        const arr1=overlay(CIN.prim.arrow(ctx,[0,.01,0],[1,.01,0],hx('s3'),{radius:.03,head:.16})), arr2=overlay(CIN.prim.arrow(ctx,[0,.01,0],[0,.01,-1],hx('s3'),{radius:.03,head:.16})); root.add(arr1,arr2);
        const probe=overlay(CIN.prim.dot(ctx,[.9,0,0],hx('s4'),.065)); root.add(probe);
        const halo=CIN.prim.dot(ctx,[.9,0,0],hx('s4'),.14); halo.material.transparent=true; halo.material.opacity=isLight?.2:.25; halo.material.depthWrite=false; root.add(halo);
        const lab1=slot(ctx,root), lab2=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,surf,arr1,arr2,probe,halo,lab1,lab2,cont:null,ZS:.3};
        hudEl=hud(box,'hud-o'); hint(box,'drag to orbit · the probe circles the flat point');
        reshape(); paint();
      },
      update(ctx,t,dt){ if(ctx.dead||!sc) return false; if(CIN.reduced) return false; theta+=.8*dt; probe(); return true; }
    });
    if(handle) grab(handle,()=>false,()=>{});   /* orbit only — but this mirrors the view angle on the container for the verify suite */
    return handle;
  }
  function reshape(){
    if(!sc) return; const {surf,ctx,THREE,hx}=sc, geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color;
    const zs=new Float32Array(pos.count); let zmin=Infinity,zmax=-Infinity;
    for(let i=0;i<pos.count;i++){ const z=Qf(pos.getX(i),-pos.getZ(i)); zs[i]=z; zmin=Math.min(zmin,z); zmax=Math.max(zmax,z); }
    const ZS=Math.max(.12,Math.min(.6,1.1/Math.max(Math.abs(zmin),Math.abs(zmax),1e-6))); sc.ZS=ZS; sc.zmin=zmin; sc.zmax=zmax;
    const c=sc.colors, white=new THREE.Color(1,1,1);
    for(let i=0;i<pos.count;i++){ pos.setY(i,zs[i]*ZS); const t=(zs[i]-zmin)/((zmax-zmin)||1); const k=new THREE.Color(CIN.ramp(t,c.s1,c.s7,c.s2)); if(ctx.isLight) k.lerp(white,.42); k.convertSRGBToLinear(); col.setXYZ(i,k.r,k.g,k.b); }
    pos.needsUpdate=true; col.needsUpdate=true; geo.computeVertexNormals();
    if(sc.cont){ sc.root.remove(sc.cont); sc.cont.geometry.dispose(); sc.cont.material.dispose(); sc.cont=null; }
    if(zmax-zmin>1e-6){ const lv=[]; for(let i=1;i<=8;i++) lv.push(zmin+(zmax-zmin)*i/9); sc.cont=liftedContours(ctx,Qf,lv,-R,R,-R,R,ZS,hx('ink2'),{N:64}); sc.root.add(sc.cont); }
    /* eigen-directions on the tangent plane through the flat point */
    const E=eig2(A,B,C), zero=Math.abs(A)+Math.abs(B)+Math.abs(C)<1e-9;
    [[sc.arr1,E.l1,E.v1,sc.lab1,'λ₁'],[sc.arr2,E.l2,E.v2,sc.lab2,'λ₂']].forEach(([arr,l,v,lab,name])=>{
      arr.visible=!zero; if(zero){ lab.hide(); return; }
      const L=0.35+0.35*Math.min(Math.abs(l)/3,1), colKey=l>.05?'s3':(l<-.05?'s2':'muted');
      arr.userData.set([0,.012,0],[v[0]*L,.012,-v[1]*L]); const m=arr.children[0].material; m.color.setHex(hx(colKey)); m.emissive.setHex(hx(colKey));
      lab.set(name+' = '+fmt(l,2),[v[0]*(L+.22),.05,-v[1]*(L+.22)],{size:20,color:sc.colors[colKey],bg:false,depthTest:false}); });
  }
  function probe(){
    if(!sc) return; const x=.9*Math.cos(theta), y=.9*Math.sin(theta), z=Qf(x,y), q=Qdir(theta);
    sc.probe.position.set(x,z*sc.ZS+.02,-y); sc.halo.position.copy(sc.probe.position);
    const deg=((theta*180/Math.PI)%360+360)%360;
    if(hudEl) hudEl.innerHTML=`direction θ = <b>${deg.toFixed(0)}°</b> · Q = <b>${fmt(q,2)}</b> → ${q>.05?'above':(q<-.05?'below':'level with')} the flat point`;
  }
  function paint(){ if(!sc) return; probe(); sc.ctx.requestRender&&sc.ctx.requestRender(); }
  function draw(){
    const E=eig2(A,B,C), D=E.det, kind=hessVerdict(A,B,C,verd);
    const mx=`<span class="mx"><i>${fmt(A,2)}</i><i>${fmt(B,2)}</i><i>${fmt(B,2)}</i><i>${fmt(C,2)}</i></span>`;
    const rule={min:'D > 0, fxx > 0 ⇒ minimum',max:'D > 0, fxx < 0 ⇒ maximum',saddle:'D < 0 ⇒ saddle',flat:'D = 0 ⇒ inconclusive'}[kind];
    if(tab==='disc') read.innerHTML=`H = ${mx}<br>D = fxx·fyy − fxy² = <b>${fmt(D,3)}</b> · fxx = <b>${fmt(A,2)}</b><br>${rule}`;
    else if(tab==='sylv'){ const d1=A,d2=D; const line=d2>1e-9&&d1>0?'both positive ⇒ positive-definite':(d2>1e-9&&d1<0?'Δ₁ < 0, Δ₂ > 0 (alternating) ⇒ negative-definite':(d2<-1e-9?'Δ₂ < 0 ⇒ indefinite':'Δ₂ = 0 ⇒ singular'));
      read.innerHTML=`leading minors: Δ₁ = fxx = <b>${fmt(d1,2)}</b>, Δ₂ = det H = <b>${fmt(d2,3)}</b><br>→ ${line}`; }
    else { const sg=E.l1>1e-9&&E.l2>1e-9?'both > 0 ⇒ minimum':(E.l1<-1e-9&&E.l2<-1e-9?'both < 0 ⇒ maximum':(E.l1*E.l2<-1e-9?'opposite signs ⇒ saddle':'a zero eigenvalue ⇒ inconclusive'));
      read.innerHTML=`λ₁ = <b>${fmt(E.l1,2)}</b>, λ₂ = <b>${fmt(E.l2,2)}</b> (trace ${fmt(E.tr,2)}, det ${fmt(D,3)} = λ₁λ₂)<br>eigen-directions: θ₁ = <b>${E.th1.toFixed(1)}°</b>, θ₂ = <b>${E.th2.toFixed(1)}°</b><br>${sg}`; }
    reshape(); paint();
  }
  const uA=bindCtl('jd-a',v=>{A=v;draw();}), uB=bindCtl('jd-b',v=>{B=v;draw();}), uC=bindCtl('jd-c',v=>{C=v;draw();});
  tabs(document.getElementById('jd-tabs'),t=>{ tab=t; draw(); });
  const bar=document.getElementById('jd-presets');
  bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ const P=HPRE[btn.dataset.p]; if(!P) return; pressOnly(bar,btn);
    sA.value=P[0]; sB.value=P[1]; sC.value=P[2]; A=P[0]; B=P[1]; C=P[2];
    document.getElementById('jd-a-o').textContent=fmt(A,2); document.getElementById('jd-b-o').textContent=fmt(B,2); document.getElementById('jd-c-o').textContent=fmt(C,2); draw(); }));
  uA(); uB(); uC();
  mountStage(box,build);
  draw();
})();

/* ================= W6 · THE CURVATURE COMPASS ================= */
(function(){
  const box=document.getElementById('w-rose'),svg=document.getElementById('rs-svg'),read=document.getElementById('rs-read'),verd=document.getElementById('rs-verdict');
  if(!box||!svg)return;
  const sTh=document.getElementById('rs-th'),oTh=document.getElementById('rs-th-o');
  let A=2,B=0,C=-2,th=30,animH=null;
  const Q=t=>A*Math.cos(t)*Math.cos(t)+2*B*Math.sin(t)*Math.cos(t)+C*Math.sin(t)*Math.sin(t);
  function draw(){
    svg.innerHTML=''; const glow=glo(svg); const cx=300,cy=175;
    let qmax=0; for(let i=0;i<360;i++) qmax=Math.max(qmax,Math.abs(Q(i*Math.PI/180)));
    const k=130/Math.max(qmax,.5);
    const pt=(t,r)=>[cx+r*Math.cos(t),cy-r*Math.sin(t)];
    /* polar grid */
    for(let q=1;q<=3;q++){ const r=q*k; if(r>165) break; el('circle',{cx,cy,r,fill:'none',stroke:'var(--grid)','stroke-width':1},svg); txt(svg,cx+r*0.7071+3,cy-r*0.7071-3,'|Q| = '+q,'font:500 8.5px system-ui;fill:var(--ink-muted)'); }
    el('line',{x1:cx-160,y1:cy,x2:cx+160,y2:cy,stroke:'var(--axis)','stroke-width':1,opacity:.6},svg);
    el('line',{x1:cx,y1:cy-158,x2:cx,y2:cy+158,stroke:'var(--axis)','stroke-width':1,opacity:.6},svg);
    txt(svg,cx+166,cy+4,'θ = 0°','font:600 9.5px system-ui;fill:var(--ink-muted)'); txt(svg,cx+5,cy-161,'90°','font:600 9.5px system-ui;fill:var(--ink-muted)');
    /* the rose: positive lobes vs negative lobes */
    if(qmax<1e-9){ glowDot(svg,cx,cy,5,'var(--s4)',glow); txt(svg,cx,cy-14,'Q ≡ 0 — flat in every direction','font:600 10px system-ui;fill:var(--ink-muted)','middle'); }
    else { let dP='',dN='',prev=null;
      for(let i=0;i<=360;i++){ const t=i*Math.PI/180, q=Q(t), s=q>=0, r=Math.abs(q)*k, [x,y]=pt(t,r), P=x.toFixed(1)+','+y.toFixed(1);
        if(prev===null){ if(s) dP+='M'+P; else dN+='M'+P; }
        else if(s!==prev){ if(prev) dP+='Z'; else dN+='Z'; if(s) dP+='M'+cx+','+cy+'L'+P; else dN+='M'+cx+','+cy+'L'+P; }
        else { if(s) dP+='L'+P; else dN+='L'+P; }
        prev=s; }
      if(prev) dP+='Z'; else dN+='Z';
      if(dP) el('path',{d:dP,fill:'var(--s3)','fill-opacity':.28,stroke:'var(--s3)','stroke-width':2,'stroke-linejoin':'round',filter:glow||'none'},svg);
      if(dN) el('path',{d:dN,fill:'var(--critical)','fill-opacity':.24,stroke:'var(--critical)','stroke-width':2,'stroke-linejoin':'round',filter:glow||'none'},svg); }
    /* eigen-directions as long spokes */
    const E=eig2(A,B,C);
    [[E.v1,E.l1,'var(--s4)','λ₁ = '+fmt(E.l1,2)],[E.v2,E.l2,'var(--s7)','λ₂ = '+fmt(E.l2,2)]].forEach(([v,l,col,name])=>{
      const t=Math.atan2(v[1],v[0]); const [x0,y0]=pt(t,-132),[x1,y1]=pt(t,132);
      glowLine(svg,x0,y0,x1,y1,col,2,glow,{'stroke-dasharray':'8 5',opacity:.9});
      /* the name rides beside the spoke's tip, nudged off the axis labels */
      const s=Math.cos(t)>=-1e-9?1:-1, tip=pt(t,146*s), off=[-Math.sin(t)*11*s, -Math.cos(t)*11*s];
      txt(svg,tip[0]+off[0],tip[1]+off[1]+4,name,`font:700 10.5px system-ui;fill:${col}`,'middle'); });
    /* the needle */
    const t=th*Math.PI/180, q=Q(t), r=Math.abs(q)*k, [nx,ny]=pt(t,r), [ex,ey]=pt(t,135);
    glowLine(svg,cx,cy,ex,ey,'var(--s1)',2.4,glow,{opacity:.85});
    glowDot(svg,nx,ny,5.5,'var(--s1)',glow);
    { const ax=ex+Math.sin(t)*16, ay=ey+Math.cos(t)*16+4;   /* beside the needle tip, on the side away from the spoke names */
      txt(svg,Math.max(40,Math.min(560,ax)),Math.max(14,Math.min(334,ay)),'Q(θ) = '+fmt(q,2),'font:700 11px system-ui;fill:var(--s1)','middle'); }
    /* extremes over θ */
    const kind=hessVerdict(A,B,C,verd), D=E.det;
    const cross=kind==='saddle'?'4':(kind==='flat'?(Math.abs(A)+Math.abs(B)+Math.abs(C)<1e-9?'Q ≡ 0':'2 (touching)'):'0');
    read.innerHTML=`Q(θ) = fxx cos²θ + 2fxy sinθ cosθ + fyy sin²θ = <b>${fmt(q,3)}</b> at θ = ${th}°<br>max over θ = λ₁ = <b>${fmt(E.l1,3)}</b> at θ = <b>${E.th1.toFixed(1)}°</b><br>min over θ = λ₂ = <b>${fmt(E.l2,3)}</b> at θ = <b>${E.th2.toFixed(1)}°</b><br>D = <b>${fmt(D,3)}</b> = λ₁λ₂ · zero crossings per turn: <b>${cross}</b>`;
  }
  ['a','b','c'].forEach(key=>bindCtl('rs-'+key,v=>{ if(key==='a')A=v; else if(key==='b')B=v; else C=v; draw(); })());
  bindCtl('rs-th',v=>{ th=v|0; draw(); },v=>String(v|0)+'°')();
  document.getElementById('rs-play').addEventListener('click',()=>{ if(animH) animH.stop();
    animH=tween(3200,u=>{ th=Math.round(u*360); sTh.value=th; oTh.textContent=th+'°'; draw(); },()=>{ animH=null; }); });
  const bar=document.getElementById('rs-presets');
  bar.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ const P=HPRE[btn.dataset.p]; if(!P) return; pressOnly(bar,btn); [A,B,C]=P;
    ['a','b','c'].forEach((key,i)=>{ document.getElementById('rs-'+key).value=P[i]; document.getElementById('rs-'+key+'-o').textContent=fmt(P[i],2); }); draw(); }));
  draw();
})();

/* ================= W7 · THE CRITICAL-POINT HUNTER (three.js) ================= */
(function(){
  const box=document.getElementById('ht-3d'),read=document.getElementById('ht-read'),verd=document.getElementById('ht-verdict'),bar=document.getElementById('ht-points'),cloneBtn=document.getElementById('ht-clone');
  if(!box)return;
  const LAND={
    p1:{name:'xy − x² − y² − 2x − 2y + 4',f:(x,y)=>x*y-x*x-y*y-2*x-2*y+4,H:(x,y)=>[-2,1,-2],X:[-4.6,0.6],Y:[-4.6,0.6],cps:[[-2,-2]]},
    p2:{name:'x³ + y³ − 3xy + 1',f:(x,y)=>x*x*x+y*y*y-3*x*y+1,H:(x,y)=>[6*x,-3,6*y],X:[-1.1,1.7],Y:[-1.1,1.7],cps:[[0,0],[1,1]]},
    b1:{name:'x³ − 3xy + 3y²',f:(x,y)=>x*x*x-3*x*y+3*y*y,H:(x,y)=>[6*x,-3,6],X:[-0.9,1.4],Y:[-0.7,1.1],cps:[[0,0],[0.5,0.25]]},
    b2:{name:'2x² + 2xy + 3y² − 4x − 2y',f:(x,y)=>2*x*x+2*x*y+3*y*y-4*x-2*y,H:()=>[4,2,6],X:[-1.2,3.2],Y:[-2.2,2.2],cps:[[1,0]]},
    g:{name:'x⁴ + y⁴',f:(x,y)=>x*x*x*x+y*y*y*y,H:(x,y)=>[12*x*x,0,12*y*y],X:[-1.2,1.2],Y:[-1.2,1.2],cps:[[0,0]],truth:'truth: f ≥ 0 with equality only at the origin — a minimum the Hessian cannot see'},
    h:{name:'x⁴ − y⁴',f:(x,y)=>x*x*x*x-y*y*y*y,H:(x,y)=>[12*x*x,0,-12*y*y],X:[-1.2,1.2],Y:[-1.2,1.2],cps:[[0,0]],truth:'truth: t⁴ along x, −t⁴ along y — a saddle the Hessian cannot see'}};
  const KIND={min:'minimum',max:'maximum',saddle:'saddle',flat:'inconclusive'}, KCOL={min:'s3',max:'s2',saddle:'s7',flat:'muted'};
  let key='p1',sel=0,showClone=true,sc=null,hudEl=null,ST=null;
  const cpInfo=(L,i)=>{ const [x,y]=L.cps[i], [a,b,c]=L.H(x,y); return {x,y,a,b,c,D:a*c-b*b,f0:L.f(x,y),kind:hessKind(a,b,c)}; };
  const neg=s=>String(s).replace(/-/g,'−');
  function build(){
    sc=null; const L=LAND[key], narrow=box.clientWidth<560;
    const cx=(L.X[0]+L.X[1])/2, cy=(L.Y[0]+L.Y[1])/2, SX=2.8/Math.max(L.X[1]-L.X[0],L.Y[1]-L.Y[0]);
    const fs=(u,v)=>L.f(u/SX+cx,v/SX+cy), U0=(L.X[0]-cx)*SX,U1=(L.X[1]-cx)*SX,V0=(L.Y[0]-cy)*SX,V1=(L.Y[1]-cy)*SX;
    return CIN.stage3d(box,{fill:true,camera:{pos:narrow?[4.3,3.6,5.3]:[4.0,3.3,5.0],look:[0,.1,0],fov:34},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        let zmin=Infinity,zmax=-Infinity; for(let i=0;i<=40;i++)for(let j=0;j<=40;j++){ const z=fs(U0+(U1-U0)*i/40,V0+(V1-V0)*j/40); zmin=Math.min(zmin,z); zmax=Math.max(zmax,z); }
        const ZS=1.6/((zmax-zmin)||1), floorY=zmin*ZS-.15;
        const grid=CIN.prim.grid(ctx,3.6,18,hx('grid'),{opacity:isLight?.5:.35}); grid.position.y=floorY; root.add(grid);
        const surf=CIN.prim.surface(ctx,fs,{x:[U0,U1],y:[V0,V1],res:72,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:.9}); lightenSurface(ctx,surf,ZS); root.add(surf);
        const lv=[]; for(let i=1;i<=9;i++) lv.push(zmin+(zmax-zmin)*i/10); root.add(liftedContours(ctx,fs,lv,U0,U1,V0,V1,ZS,hx('ink2'),{N:64}));
        [['x →',[U1+.3,floorY,-V0+.1]],['y →',[U0-.2,floorY,-V1-.3]]].forEach(([t,p])=>root.add(CIN.prim.label(ctx,t,p,{size:24,color:colors.muted,bg:false,depthTest:false})));
        const P3=(x,y,z)=>[(x-cx)*SX,z*ZS,-(y-cy)*SX];
        const dots=L.cps.map((cp,i)=>{ const I=cpInfo(L,i), d=CIN.prim.dot(ctx,P3(I.x,I.y,I.f0+.01/ZS),hx(KCOL[I.kind]),.07); d.userData.idx=i; overlay(d,12); root.add(d); return d; });
        const halo=CIN.prim.dot(ctx,[0,0,0],hx('s4'),.19); halo.material.transparent=true; halo.material.opacity=isLight?.22:.28; halo.material.depthWrite=false; root.add(halo);
        const cloneG=new THREE.Group(); root.add(cloneG);
        const lab=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,dots,halo,cloneG,lab,P3,SX,ZS,L};
        hudEl=hud(box); hint(box,'drag to orbit · click a dot to select it');
        paint();
      },
      update(ctx){ return false; }
    });
  }
  function paint(){
    if(!sc) return; const {THREE,ctx,hx,dots,halo,cloneG,P3,SX,ZS,L,isLight}=sc, I=cpInfo(L,sel);
    dots.forEach((d,i)=>{ const s=i===sel?1.5:1; d.scale.set(s,s,s); });
    halo.position.copy(dots[sel].position);
    sc.lab.set(`(${neg(fmt(I.x,2))}, ${neg(fmt(I.y,2))}) · ${KIND[I.kind]}`,[dots[sel].position.x,dots[sel].position.y+.32,dots[sel].position.z],{size:20,color:sc.colors[KCOL[I.kind]==='muted'?'ink2':KCOL[I.kind]],bg:false,depthTest:false});
    clearGroup(cloneG);
    if(showClone){ const Rc=.55, uP=(I.x-(L.X[0]+L.X[1])/2)*SX, vP=(I.y-(L.Y[0]+L.Y[1])/2)*SX;
      const Qs=(u,v)=>{ const dx=(u-uP)/SX, dy=(v-vP)/SX; return I.f0+.5*(I.a*dx*dx+2*I.b*dx*dy+I.c*dy*dy); };
      const clone=CIN.prim.surface(ctx,Qs,{x:[uP-Rc,uP+Rc],y:[vP-Rc,vP+Rc],res:36,zscale:ZS,ramp:[sc.colors.s4,sc.colors.s4,sc.colors.s4],wire:false,opacity:.5});
      const mat=clone.userData.mesh.material; mat.depthWrite=false; mat.emissive=new THREE.Color(hx('s4')); mat.emissiveIntensity=isLight?.12:.35; mat.roughness=.25;
      const vis=fadeAttr(THREE,clone), pos=clone.userData.geo.attributes.position;
      for(let i=0;i<pos.count;i++){ const d=Math.hypot(pos.getX(i),pos.getZ(i)); vis.setX(i,d<.55*Rc?1:Math.max(0,1-(d-.55*Rc)/(.45*Rc))); } vis.needsUpdate=true;
      clone.position.set(uP,.006,-vP); clone.renderOrder=5; cloneG.add(clone); }
    if(hudEl) hudEl.innerHTML=`selected (<b>${neg(fmt(I.x,2))}</b>, <b>${neg(fmt(I.y,2))}</b>): ${KIND[I.kind]}`;
    ctx.requestRender&&ctx.requestRender();
  }
  function draw(){
    const L=LAND[key], I=cpInfo(L,sel);
    const mx=`<span class="mx"><i>${fmt(I.a,2)}</i><i>${fmt(I.b,2)}</i><i>${fmt(I.b,2)}</i><i>${fmt(I.c,2)}</i></span>`;
    const line={min:'✓ D > 0 and fxx > 0 ⇒ local minimum',max:'✓ D > 0 and fxx < 0 ⇒ local maximum',saddle:'✗ D < 0 ⇒ saddle',flat:'D = 0 ⇒ the second-derivative test is inconclusive'}[I.kind];
    read.innerHTML=`f(${fmt(I.x,2)}, ${fmt(I.y,2)}) = <b>${fmt(I.f0,4)}</b><br>∇f = (fx, fy) = (<b>0</b>, <b>0</b>) ✓<br>H = ${mx}<br>D = <b>${fmt(I.D,3)}</b> · fxx = <b>${fmt(I.a,2)}</b><br>${line}`
      +(L.truth?`<br><span style="color:var(--s4)">${L.truth}</span>`:'')+(showClone&&I.kind==='flat'?'<br>the quadratic clone here is the flat plane z = f(P) — H = 0 has nothing to add':'');
    verd.className='verdict '+(I.kind==='saddle'?'bad':(I.kind==='flat'?'info':'good'));
    verd.textContent=I.kind==='min'?`✓ (${fmt(I.x,2)}, ${fmt(I.y,2)}) is a local minimum — D = ${fmt(I.D,3)} > 0, fxx = ${fmt(I.a,2)} > 0`
      :(I.kind==='max'?`✓ (${fmt(I.x,2)}, ${fmt(I.y,2)}) is a local maximum — D = ${fmt(I.D,3)} > 0, fxx = ${fmt(I.a,2)} < 0`
      :(I.kind==='saddle'?`✗ (${fmt(I.x,2)}, ${fmt(I.y,2)}) is a saddle — D = ${fmt(I.D,3)} < 0`
      :`D = 0 at (${fmt(I.x,2)}, ${fmt(I.y,2)}) — the Hessian is silent; only the function itself can tell`));
    bar.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-selected',i===sel?'true':'false'));
    paint();
  }
  function buildBar(){ bar.innerHTML=''; LAND[key].cps.forEach((cp,i)=>{ const b=document.createElement('button'); b.type='button'; b.setAttribute('role','tab'); b.textContent=`(${neg(fmt(cp[0],2))}, ${neg(fmt(cp[1],2))})`; b.addEventListener('click',()=>{ sel=i; draw(); }); bar.appendChild(b); }); }
  function pickDot(handle){ const {THREE,camera,renderer}=handle.ctx; const ray=new THREE.Raycaster(), v=new THREE.Vector2();
    return e=>{ if(!sc) return false; const r=renderer.domElement.getBoundingClientRect(); if(!r.width||!r.height) return false;
      v.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(v,camera);
      const hits=ray.intersectObjects(sc.dots,false); if(!hits.length) return false; sel=hits[0].object.userData.idx; draw(); return true; }; }
  function mount(){ ST=mountStage(box,()=>{ const h=build(); if(h) grab(h,pickDot(h),()=>{}); return h; }); }
  cloneBtn.addEventListener('click',()=>{ showClone=!showClone; cloneBtn.setAttribute('aria-pressed',showClone?'true':'false'); draw(); });
  const pb=document.getElementById('ht-presets');
  pb.querySelectorAll('[data-p]').forEach(btn=>btn.addEventListener('click',()=>{ if(!LAND[btn.dataset.p]) return; pressOnly(pb,btn); key=btn.dataset.p; sel=0; buildBar(); remount(ST); draw(); }));
  buildBar(); mount();
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W8 · THE FACTORIAL WINS ================= */
(function(){
  const box=document.getElementById('w-fact'),svg=document.getElementById('fc-svg'),read=document.getElementById('fc-read'),verd=document.getElementById('fc-verdict');
  if(!box||!svg)return;
  let tab='exp',xv=2,N=4;
  function series(){
    const slots=[], x=xv;
    if(tab==='exp'){ for(let n=0;n<=14;n++) slots.push({n,term:Math.pow(x,n)/FACT(n)}); return {slots,truth:Math.exp(x),first:0,label:'n',name:'eˣ'}; }
    if(tab==='cos'){ for(let m=0;m<=14;m++) slots.push({n:m,term:Math.pow(-1,m)*Math.pow(x,2*m)/FACT(2*m)}); return {slots,truth:Math.cos(x),first:0,label:'term number m (the x²ᵐ term)',name:'cos x'}; }
    for(let n=1;n<=14;n++) slots.push({n,term:Math.pow(-1,n+1)*Math.pow(x,n)/n}); return {slots,truth:Math.log(1+x),first:1,label:'n',name:'ln(1 + x)'};
  }
  function draw(){
    const S=series(); svg.innerHTML=''; const glow=glo(svg);
    const W=600,H=340,L=54,R=16,T=30,B=40, LY0=-12,LY1=4;
    const slots=S.slots, ns=slots.length, sw=(W-L-R)/ns, bw=sw*.58;
    const px=i=>L+sw*(i+.5), py=lv=>T+(LY1-Math.max(LY0,Math.min(LY1,lv)))/(LY1-LY0)*(H-T-B);
    /* partial sums: kept = terms with index < N (exp/cos) or ≤ N (ln) */
    const kept=n=>tab==='ln'?n<=N:n<N;
    let acc=0; const sums=[]; slots.forEach(s=>{ sums.push(acc); acc+=s.term; }); sums.push(acc);   /* sums[i] = sum of the first i slots */
    const errAfter=i=>Math.abs(S.truth-sums[i]);
    el('rect',{x:L,y:T,width:W-L-R,height:H-T-B,rx:6,fill:'none',stroke:'var(--line, var(--ring))',opacity:.7},svg);
    [4,0,-4,-8,-12].forEach(e=>{ el('line',{x1:L,y1:py(e),x2:W-R,y2:py(e),stroke:'var(--grid)','stroke-width':1},svg); txt(svg,L-6,py(e)+3.5,'10'+SUP(e),'font:600 9.5px system-ui;fill:var(--ink-muted)','end'); });
    el('line',{x1:L,y1:py(0),x2:W-R,y2:py(0),stroke:'var(--axis)','stroke-width':1.4,'stroke-dasharray':'6 4'},svg);
    txt(svg,W-R-4,py(0)-4,'1','font:700 10px system-ui;fill:var(--ink-2)','end');
    let hump=0; slots.forEach((s,i)=>{ if(Math.abs(s.term)>Math.abs(slots[hump].term)) hump=i; });
    slots.forEach((s,i)=>{ const lv=Math.log10(Math.max(1e-300,Math.abs(s.term))), y=py(lv), on=kept(s.n);
      const hgt=Math.max(1.2,py(LY0)-y);
      el('rect',{x:px(i)-bw/2,y:py(LY0)-hgt,width:bw,height:hgt,rx:2.5,fill:'var(--s1)',opacity:on?.92:.28,filter:on&&glow?glow:'none'},svg);
      if(i===hump) txt(svg,px(i),Math.max(T+12,y-13),'hump','font:700 9px system-ui;fill:var(--s4)','middle');
      txt(svg,px(i),H-B+13,String(s.n),'font:500 9.5px system-ui;fill:var(--ink-muted)','middle'); });
    /* the actual truncation error after n terms */
    let d=''; const errPts=[]; for(let i=0;i<ns;i++){ const nTerms=S.first+i; const e=errAfter(i); const y=py(Math.log10(Math.max(1e-300,e))); errPts.push([px(i),y,nTerms]); d+=(i?'L':'M')+px(i).toFixed(1)+','+y.toFixed(1); }
    el('path',{d,stroke:'var(--s2)','stroke-width':2.2,fill:'none','stroke-linejoin':'round',filter:glow||'none'},svg);
    errPts.forEach(([x,y,nT])=>el('circle',{cx:x,cy:y,r:nT===N?5:3,fill:'var(--s2)',stroke:nT===N?'var(--page)':'none','stroke-width':1.5},svg));
    txt(svg,(L+W-R)/2,H-6,S.label==='n'?'term number n':S.label,'font:650 10.5px system-ui;fill:var(--ink-2)','middle');
    txt(svg,L,T-10,`bars: |term| at x = ${fmt(xv,2)} (bright = kept) · orange: |${S.name} − partial sum after n terms| · log scale`,'font:600 9.5px system-ui;fill:var(--ink-muted)');
    /* readout */
    const keptCount=Math.min(N,ns), partial=sums[keptCount], err=S.truth-partial, hs=slots[hump];
    read.innerHTML=`largest term: n = <b>${hs.n}</b> (size ${Math.abs(hs.term)<1e-3||Math.abs(hs.term)>=1e4?sci(Math.abs(hs.term),2):fmt(Math.abs(hs.term),4)})<br>terms kept: n = <b>${N}</b><br>partial sum = <b>${Math.abs(partial)>=1e6?sci(partial,4):fmt(partial,6)}</b><br>true value = <b>${fmt(S.truth,6)}</b><br>error = <b style="color:var(--s2)">${sci(err,2)}</b>`;
    if(tab==='ln'&&xv>1){ verd.className='verdict bad'; verd.textContent='✗ |x| > 1: the terms never shrink — the series diverges; ln(1+x) exists, its MacLaurin series does not reach it'; }
    else if(tab==='ln'){ verd.className='verdict info'; verd.textContent='radius of trust: |x| ≤ 1 — terms shrink like xⁿ/n, slowly'; }
    else { verd.className='verdict good'; verd.textContent='✓ n! beats |x|ⁿ — the error after the hump falls factorially'; }
  }
  bindCtl('fc-x',v=>{ xv=v; draw(); })();
  bindCtl('fc-n',v=>{ N=v|0; draw(); },v=>String(v|0))();
  tabs(document.getElementById('fc-tabs'),t=>{ tab=t; draw(); });
  draw();
})();

/* ================= OPENING SHOT · the impostor grows (order 0 → 1 → 2 clone over a landscape) ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced;
  const f=(x,y)=>Math.sin(1.15*x)*Math.cos(0.85*y)+0.18*x;
  const fx=(x,y)=>1.15*Math.cos(1.15*x)*Math.cos(0.85*y)+0.18, fy=(x,y)=>-0.85*Math.sin(1.15*x)*Math.sin(0.85*y);
  const fxx=(x,y)=>-1.15*1.15*Math.sin(1.15*x)*Math.cos(0.85*y), fxy=(x,y)=>-1.15*0.85*Math.cos(1.15*x)*Math.sin(0.85*y), fyy=(x,y)=>-0.85*0.85*Math.sin(1.15*x)*Math.cos(0.85*y);
  const ZS=.9, K=[[1.0,-0.5],[2.2,1.2],[1.6,-1.8],[0.8,2.0]];   /* anchors kept on the right half: the title sits over the left */
  const PH=[['grow',1.0],['hold0',1.8],['m1',1.2],['hold1',2.0],['m2',1.2],['hold2',3.0],['move',1.6],['settle',.4]], CYCLE=PH.reduce((s,p)=>s+p[1],0);
  const smooth=u=>{ u=clamp01(u); return u*u*(3-2*u); }, eout=u=>1-Math.pow(1-clamp01(u),3);
  const LABEL=['order 0 · a dot','order 1 · the tangent plane','order 2 · the quadratic clone'];
  function state(t){
    const cyc=Math.floor(t/CYCLE), u=t-cyc*CYCLE, ki=((cyc%4)+4)%4; let acc=0,ph='settle',s=0;
    for(const [name,dur] of PH){ if(u<acc+dur){ ph=name; s=(u-acc)/dur; break; } acc+=dur; }
    const A0=K[ki],A1=K[(ki+1)%4]; let a=A0[0],b=A0[1],R=1.7,lo=2,hi=2,mix=1,alpha=1;
    if(ph==='grow'){ R=.7*eout(s); lo=hi=0; alpha=Math.min(1,s*3); }
    else if(ph==='hold0'){ R=.7; lo=hi=0; }
    else if(ph==='m1'){ mix=smooth(s); R=.7+.45*mix; lo=0; hi=1; }
    else if(ph==='hold1'){ R=1.15; lo=hi=1; }
    else if(ph==='m2'){ mix=smooth(s); R=1.15+.55*mix; lo=1; hi=2; }
    else if(ph==='hold2'){ R=1.7; }
    else if(ph==='move'){ alpha=1-clamp01(s*2); const e=smooth(s); a=A0[0]+(A1[0]-A0[0])*e; b=A0[1]+(A1[1]-A0[1])*e; }
    else { a=A1[0]; b=A1[1]; alpha=0; R=.02; lo=hi=0; }
    return {a,b,R:Math.max(R,.02),lo,hi,mix,alpha,ph};
  }
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:.045,autoRotateStopsOnUser:true,
      camera:{pos:wide?[5.2,4.6,7.8]:[2.4,6.2,8.6],look:wide?[-1.2,.2,0]:[0,0,.4],fov:32},
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=k=>CIN.hex(colors[k]);
        if(!isLight){ const n=600, sp=new Float32Array(n*3); for(let k=0;k<n;k++){ sp[3*k]=(Math.random()*2-1)*26; sp[3*k+1]=(Math.random()*2-1)*14; sp[3*k+2]=(Math.random()*2-1)*26-6; }
          const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
          root.add(new THREE.Points(sg,new THREE.PointsMaterial({color:hx('ink2'),size:.06,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}))); }
        const floorY=-1.26*ZS-.3;
        const grid=CIN.prim.grid(ctx,8,16,hx('grid'),{opacity:isLight?.35:.22}); grid.position.y=floorY; root.add(grid);
        const surf=CIN.prim.surface(ctx,f,{x:[-3,3],y:[-3,3],res:80,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:isLight?.97:.93}); lightenSurface(ctx,surf,ZS); root.add(surf);
        /* the clone: a unit patch whose vertices are rewritten every morph */
        const clone=CIN.prim.surface(ctx,()=>0,{x:[-1,1],y:[-1,1],res:44,zscale:1,ramp:[colors.s4,colors.s4,colors.s4],wire:false,opacity:isLight?.45:.55});
        const cm=clone.userData.mesh.material; cm.depthWrite=false; cm.emissive=new THREE.Color(hx('s4')); cm.emissiveIntensity=isLight?.14:.55; cm.roughness=.25; clone.renderOrder=5; root.add(clone);
        const geo=clone.userData.geo, pos=geo.attributes.position, vis=fadeAttr(THREE,clone), n=pos.count, U=new Float32Array(n), V=new Float32Array(n);
        for(let i=0;i<n;i++){ U[i]=pos.getX(i); V[i]=-pos.getZ(i); const d=Math.hypot(U[i],V[i]); vis.setX(i,d<.55?1:Math.max(0,1-(d-.55)/.45)); } vis.needsUpdate=true;
        const anchor=CIN.prim.dot(ctx,[0,0,0],hx('s4'),.09); root.add(anchor);
        const halo=CIN.prim.dot(ctx,[0,0,0],hx('s4'),.2); halo.material.transparent=true; halo.material.opacity=isLight?.2:.28; halo.material.depthWrite=false; root.add(halo);
        const pole=tube(ctx,[0,0,0],[0,1,0],hx('ink2'),.008,.55); root.add(pole);
        const lab=slot(ctx,root);
        let gkey='';
        ctx.hero={apply(t){
          const st=state(t), key=[st.a.toFixed(4),st.b.toFixed(4),st.lo,st.hi,st.mix.toFixed(3),st.R.toFixed(3)].join('|');
          let changed=false; if(box.dataset.phase!==st.ph) box.dataset.phase=st.ph;   /* verify hook: which beat of the story is showing */
          if(key!==gkey){ gkey=key; changed=true; const {a,b,R,lo,hi,mix}=st;
            const F0=f(a,b), FX=fx(a,b), FY=fy(a,b), XX=fxx(a,b), XY=fxy(a,b), YY=fyy(a,b);
            for(let i=0;i<n;i++){ const dx=R*U[i], dy=R*V[i]; const T0=F0, T1=T0+FX*dx+FY*dy, T2=T1+.5*(XX*dx*dx+2*XY*dx*dy+YY*dy*dy); const Tl=[T0,T1,T2][lo], Th=[T0,T1,T2][hi];
              pos.setXYZ(i,a+dx,(Tl+(Th-Tl)*mix)*ZS,-(b+dy)); }
            pos.needsUpdate=true; geo.computeVertexNormals();
            const ay=F0*ZS; anchor.position.set(a,ay,-b); halo.position.copy(anchor.position); aimTube(THREE,pole,[a,floorY,-b],[a,ay,-b]);
            const k=st.mix>.5?st.hi:st.lo; if(st.alpha>.4) lab.set(LABEL[k],[a+.75,ay+.58,-b],{size:22,color:colors.s4,bg:false,depthTest:false,scale:.0075}); }
          const op=(isLight?.45:.55)*st.alpha; if(Math.abs(cm.opacity-op)>1e-3){ cm.opacity=op; changed=true; } clone.visible=st.alpha>.01&&st.R>.03;
          if(st.alpha<=.4) lab.hide(); else if(lab.sp) lab.sp.visible=true;
          return changed; }};
        ctx.hero.apply(reduced?CYCLE+1.0+1.8+1.2+2.0+1.2+1.5:0);
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.apply(t); }
    });
  }
  const S=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(S); rw=innerWidth; });
})();

/* ================= W9 · THE SANDWICH, UNWRAPPED (DOM) ================= */
(function(){
  const box=document.getElementById('sd-box'),read=document.getElementById('sd-read'),verd=document.getElementById('sd-verdict'); if(!box) return;
  let mode='2';
  const sub=i=>['₁','₂','₃'][i];
  const NUM={H:[[4,2],[2,6]],h:[0.5,-1]};
  const cls=(i,j)=>i===j?'d':(Math.abs(i-j)===1?'o1':'o2');
  const hf=v=>fmt(v,2);
  const pf=v=>v<0?'('+fmt(v,2)+')':fmt(v,2);
  function render(){
    box.innerHTML='';
    const n=mode==='3'?3:2, num=mode==='num';
    const H=num?NUM.H:null, h=num?NUM.h:null;
    const mk=(tag,cl,html)=>{ const d=document.createElement(tag); d.className=cl; d.innerHTML=html||''; return d; };
    /* hᵀ row */
    const row=mk('div','vec row'); row.style.gridTemplateColumns=`repeat(${n},auto)`;
    for(let j=0;j<n;j++) row.appendChild(mk('span','cell hv',num?hf(h[j]):'h'+sub(j)));
    /* H matrix */
    const mat=mk('div','mat'); mat.style.gridTemplateColumns=`repeat(${n},auto)`;
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const c=mk('span','cell '+cls(i,j),num?String(H[i][j]):'f'+sub(i)+sub(j)); c.dataset.ij=i+''+j; mat.appendChild(c); }
    /* h column */
    const col=mk('div','vec col'); col.style.gridTemplateColumns='auto';
    for(let i=0;i<n;i++) col.appendChild(mk('span','cell hv',num?hf(h[i]):'h'+sub(i)));
    const wrap=(el,label)=>{ const w=mk('div','piece',''); w.appendChild(el); w.appendChild(mk('div','lab',label)); return w; };
    box.appendChild(wrap(row,'hᵀ · 1×'+n)); box.appendChild(wrap(mat,'H · '+n+'×'+n)); box.appendChild(wrap(col,'h · '+n+'×1'));
    box.appendChild(mk('span','eq','='));
    /* expanded sum: one term per entry, grouped so mirror entries sit side by side */
    const sum=mk('div','sum','');
    const terms=[];
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){
      const t=mk('span','term '+cls(i,j), num? `${pf(h[i])}·${H[i][j]}·${pf(h[j])}` : `h${sub(i)}·f${sub(i)}${sub(j)}·h${sub(j)}`);
      t.dataset.ij=i+''+j; terms.push(t);
    }
    terms.forEach((t,k)=>{ if(k) sum.appendChild(mk('span','plus','+')); sum.appendChild(t); });
    box.appendChild(sum);
    /* hover / tap linkage: entry ↔ term, plus the row and column step components */
    const cells=[...mat.querySelectorAll('.cell')], rows=[...row.children], cols=[...col.children];
    const hl=(ij,on)=>{ const i=+ij[0], j=+ij[1];
      cells.forEach(c=>c.classList.toggle('hl',on&&(c.dataset.ij===ij||c.dataset.ij===ij[1]+ij[0])));
      terms.forEach(t=>t.classList.toggle('hl',on&&(t.dataset.ij===ij||t.dataset.ij===ij[1]+ij[0])));
      rows.forEach((c,k)=>c.classList.toggle('hl',on&&(k===i||k===j))); cols.forEach((c,k)=>c.classList.toggle('hl',on&&(k===i||k===j)));
      if(on){ const mirror=i!==j; read.innerHTML = num
        ? `entry H<sub>${i+1}${j+1}</sub> = <b>${H[i][j]}</b> feeds the term h<sub>${i+1}</sub>·H<sub>${i+1}${j+1}</sub>·h<sub>${j+1}</sub> = ${pf(h[i])}·${H[i][j]}·${pf(h[j])} = <b>${hf(h[i]*H[i][j]*h[j])}</b>${mirror?` — and its mirror H<sub>${j+1}${i+1}</sub> feeds the same product, so together they give <b>${hf(2*h[i]*H[i][j]*h[j])}</b>`:''}`
        : `entry f<sub>${i+1}${j+1}</sub> (row ${i+1}, column ${j+1}) feeds the term <b>h<sub>${i+1}</sub>·f<sub>${i+1}${j+1}</sub>·h<sub>${j+1}</sub></b>: one h from its row, one from its column${mirror?` — and by symmetry f<sub>${j+1}${i+1}</sub> feeds the same product, so the two merge into <b>2·f<sub>${i+1}${j+1}</sub>·h<sub>${i+1}</sub>h<sub>${j+1}</sub></b>`:' — a pure square term'}`; }
      else base(); };
    [...cells,...terms].forEach(el=>{ el.addEventListener('pointerenter',()=>hl(el.dataset.ij,true)); el.addEventListener('pointerleave',()=>hl(el.dataset.ij,false)); el.addEventListener('click',()=>hl(el.dataset.ij,true)); });
    function base(){
      if(num){ const Hh=[0,1].map(i=>H[i][0]*h[0]+H[i][1]*h[1]); const q=h[0]*Hh[0]+h[1]*Hh[1];
        read.innerHTML=`H = [[4, 2],[2, 6]] (Problem 7), step h = (${hf(h[0])}, ${hf(h[1])})<br>inside first: Hh = (4·${pf(h[0])} + 2·${pf(h[1])}, 2·${pf(h[0])} + 6·${pf(h[1])}) = (<b>${hf(Hh[0])}</b>, <b>${hf(Hh[1])}</b>) — an n×1 column<br>then hᵀ(Hh) = ${pf(h[0])}·${pf(Hh[0])} + ${pf(h[1])}·${pf(Hh[1])} = <b>${hf(q)}</b> — a single number<br>the sum, term by term: 4·${pf(h[0])}² + 2·2·${pf(h[0])}${pf(h[1])} + 6·${pf(h[1])}² = ${hf(H[0][0]*h[0]*h[0])} ${2*H[0][1]*h[0]*h[1]<0?'−':'+'} ${hf(Math.abs(2*H[0][1]*h[0]*h[1]))} + ${hf(H[1][1]*h[1]*h[1])} = <b>${hf(q)}</b> ✓<br>quadratic term of Taylor: ½·hᵀHh = <b>${hf(q/2)}</b>`;
        verd.className='verdict good'; verd.textContent='✓ (1×2)(2×2)(2×1) collapsed to one number, both ways — the shapes are the memory aid';
      } else { const n=mode==='3'?3:2; const distinct=n*(n+1)/2;
        read.innerHTML=`${n*n} entries in H, <b>${distinct}</b> distinct numbers (symmetry pairs the off-diagonal ones)<br>${n} square terms h<sub>i</sub>²f<sub>ii</sub> and ${n*(n-1)/2} cross terms, each doubled: ${n===2?'h₁²f₁₁ + 2h₁h₂f₁₂ + h₂²f₂₂':'h₁²f₁₁ + h₂²f₂₂ + h₃²f₃₃ + 2h₁h₂f₁₂ + 2h₁h₃f₁₃ + 2h₂h₃f₂₃'}<br>shape check: (1×${n})(${n}×${n})(${n}×1) = 1×1 — a number, as every term of Taylor must be`;
        verd.className='verdict info'; verd.textContent=n===2?'hover an entry — the two off-diagonal entries feed the same product, hence the 2 in 2hk·fxy':'hover an entry — three variables, six distinct curvatures, still one number out'; }
    }
    base();
  }
  tabs(document.getElementById('sd-tabs'),t=>{ mode=t; render(); });
  render();
})();
