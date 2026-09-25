/* ================= W1 · THE GALTON BOARD (one bead is a surprise, a crowd is a shape) ================= */
(function(){
  const cv=document.getElementById('gl-cv'); if(!cv) return;
  const g=cv.getContext('2d'), W=cv.width, H=cv.height, tbl=document.getElementById('gl-kv'), verd=document.getElementById('gl-verdict');
  let R=12, P=.5, counts=[], N=0, sum=0, sum2=0, flying=[], queue=0, rnd=seeded(1414), raf=0, lastSpawn=0, mode='one';
  const TOP=58, PEGH=430, HB=H-34, HT=548;                      /* peg zone, histogram zone (canvas px) */
  const geo=()=>{ const dx=Math.min(64,(W-150)/(R+1)), dy=PEGH/R; return {dx,dy,cx:W/2}; };
  function reset(){ counts=new Array(R+1).fill(0); N=0; sum=0; sum2=0; flying=[]; queue=0; rnd=seeded(1414+R*31+Math.round(P*100)); draw(); readout(); }
  const pk=k=>binom(R,k)*Math.pow(P,k)*Math.pow(1-P,R-k);
  function fs(px){ const k=W/Math.max(1,cv.clientWidth||W); return Math.round(Math.min(px*k,px*3.3)); }
  function spawn(){ const path=[]; let r=0; for(let i=0;i<R;i++){ const right=rnd()<P; path.push(right); if(right) r++; } flying.push({path,r,t:0}); }
  function land(b){ counts[b.r]++; N++; sum+=b.r; sum2+=b.r*b.r; }
  function beadXY(b,G){ /* t in [0, R+1]: 0 = entering above the first peg, i = on peg row i, R+1 = in the slot */
    const t=Math.min(b.t,R+1), i=Math.floor(t), u=t-i;
    const rightsBefore=k=>{ let s=0; for(let j=0;j<k&&j<R;j++) if(b.path[j]) s++; return s; };
    const px=k=>{ if(k<=0) return G.cx; const kk=Math.min(k,R); return G.cx+(rightsBefore(kk)-kk/2)*G.dx; };
    const py=k=>k<=0?TOP-40:(k<=R?TOP+(k-1)*G.dy+G.dy*.5-9:HT-8);
    if(i>=R+1) return [px(R),HT-8];
    const x0=px(i), x1=px(i+1), y0=py(i), y1=py(i+1);
    return [x0+(x1-x0)*u, y0+(y1-y0)*u - (i>0&&i<R?Math.sin(Math.PI*u)*G.dy*.35:0)]; }
  function draw(){ const G=geo(), dark=!isLight(); g.clearRect(0,0,W,H);
    const mass=cssv(K14.mass), ink=cssv('ink'), ink2=cssv('ink-2'), muted=cssv('ink-muted'), gold=cssv(K14.mean);
    /* the funnel */
    g.strokeStyle=rgba('ink-2',.35); g.lineWidth=3; g.beginPath(); g.moveTo(G.cx-70,TOP-58); g.lineTo(G.cx-14,TOP-18); g.moveTo(G.cx+70,TOP-58); g.lineTo(G.cx+14,TOP-18); g.stroke();
    /* pegs */
    for(let i=0;i<R;i++) for(let j=0;j<=i;j++){ const x=G.cx+(j-i/2)*G.dx, y=TOP+i*G.dy+G.dy*.5;
      if(dark){ g.fillStyle=rgba('ink-2',.14); g.beginPath(); g.arc(x,y,11,0,7); g.fill(); }
      g.fillStyle=dark?rgba('ink',.8):rgba('ink-2',.85); g.beginPath(); g.arc(x,y,5,0,7); g.fill(); }
    /* slot walls */
    g.strokeStyle=rgba('ink-2',.22); g.lineWidth=2;
    for(let k=0;k<=R+1;k++){ const x=G.cx+(k-.5-R/2)*G.dx; g.beginPath(); g.moveTo(x,HT-24); g.lineTo(x,HB); g.stroke(); }
    g.strokeStyle=rgba('ink-2',.5); g.beginPath(); g.moveTo(G.cx-(R/2+.5)*G.dx-10,HB); g.lineTo(G.cx+(R/2+.5)*G.dx+10,HB); g.stroke();
    /* the pile */
    const exp=counts.map((_,k)=>N*pk(k)), top=Math.max(1,...counts,...exp), scale=(HB-HT-6)/top, bw=G.dx*.78;
    const small=Math.max(...counts)<=14&&N<=60;
    counts.forEach((c,k)=>{ const x=G.cx+(k-R/2)*G.dx;
      if(small){ const rr=Math.min(10,G.dx*.2); for(let m=0;m<c;m++){ const y=HB-rr-2-m*(2*rr+2); if(dark){ g.fillStyle=rgba(K14.mass,.25); g.beginPath(); g.arc(x,y,rr*2,0,7); g.fill(); } g.fillStyle=mass; g.beginPath(); g.arc(x,y,rr,0,7); g.fill(); } return; }
      const h=c*scale; if(h<=0) return; const gr=g.createLinearGradient(0,HB-h,0,HB); gr.addColorStop(0,rgba(K14.mass,dark?.95:.9)); gr.addColorStop(1,rgba(K14.mass,dark?.35:.45));
      if(dark&&!flying.length){ g.shadowColor=mass; g.shadowBlur=18; } g.fillStyle=gr; g.fillRect(x-bw/2,HB-h,bw,h); g.shadowBlur=0; });
    /* the expected shape */
    if(N>=20){ g.setLineDash([10,8]); g.strokeStyle=rgba('ink',.8); g.lineWidth=2.5; g.beginPath();
      exp.forEach((e,k)=>{ const x=G.cx+(k-R/2)*G.dx, y=HB-e*scale; if(!k) g.moveTo(x-G.dx/2,y); else g.lineTo(x-G.dx/2,y); g.lineTo(x+G.dx/2,y); }); g.stroke(); g.setLineDash([]); }
    /* the centre n·p */
    const mx=G.cx+(R*P-R/2)*G.dx; g.fillStyle=gold; g.beginPath(); g.moveTo(mx,HB+4); g.lineTo(mx-11,HB+26); g.lineTo(mx+11,HB+26); g.closePath(); g.fill();
    g.font=`700 ${fs(12)}px Inter,system-ui`; g.textAlign='left'; g.fillStyle=gold; g.fillText('centre n·p = '+trim(F(R*P,2)),Math.min(W-fs(12)*9,mx+16),HB+24);
    /* beads in flight */
    flying.forEach(b=>{ const [x,y]=beadXY(b,G); if(dark){ g.fillStyle=rgba(K14.mass,.28); g.beginPath(); g.arc(x,y,15,0,7); g.fill(); } g.fillStyle=dark?'#ffffff':mass; g.beginPath(); g.arc(x,y,6.5,0,7); g.fill(); if(!dark){ g.strokeStyle=ink; g.lineWidth=1; g.stroke(); } });
    g.font=`700 ${fs(12)}px Inter,system-ui`; g.fillStyle=N?cssv(K14.mass):muted; g.textAlign='left'; g.fillText(N?N.toLocaleString('en-IN')+' bead'+(N===1?'':'s')+' in the slots':'the slots are empty',22,30);
    g.font=`600 ${fs(11)}px Inter,system-ui`; g.fillStyle=muted; g.textAlign='right'; g.fillText('slot = number of right bounces',W-22,30); }
  function readout(){ const mean=N?sum/N:NaN, sd=N>1?Math.sqrt(Math.max(0,sum2/N-mean*mean)):NaN, mid=Math.round(R*P);
    kv(tbl,[['beads dropped','<b>'+N+'</b>'],['pile centre (seen)',N?F(mean,2):'—'],['centre n·p (predicted)',trim(F(R*P,2))],['spread (seen)',N>1?F(sd,2):'—'],['spread √(np(1−p))',F(Math.sqrt(R*P*(1-P)),2)],['share in slot '+mid,N?PCT(counts[mid]/N,1)+' <span style="color:var(--ink-muted)">vs '+PCT(pk(mid),1)+'</span>':'— vs '+PCT(pk(mid),1)]]);
    if(!N){ verd.className='verdict info'; verd.textContent='info — drop a bead. Nobody can say where one bead will land.'; }
    else if(N<60){ verd.className='verdict info'; verd.textContent='info — '+N+' bead'+(N>1?'s':'')+': still lumpy. Keep dropping and a shape will appear.'; }
    else if(N<600){ verd.className='verdict info'; verd.textContent='info — the pile is taking the shape of the dashed outline'; }
    else { verd.className='verdict good'; verd.textContent='good — '+N+' beads, one clear shape: centre '+F(mean,2)+' against n·p = '+trim(F(R*P,2))+'. The shape is the knowledge.'; } }
  let lastT=0, acc=0;
  function loop(ts){ raf=0; const dt=lastT?Math.min(.4,(ts-lastT)/1000):1/60; lastT=ts;
    const speed=mode==='one'?9:(mode==='mid'?20:34), rate=mode==='one'?1e9:(mode==='mid'?110:800);
    if(queue>0){ acc+=rate*dt; const k=Math.min(queue,mode==='one'?1:Math.floor(acc)); acc-=k; if(mode==='one') acc=0; for(let i=0;i<k;i++) spawn(); queue-=k; } else acc=0;
    flying.forEach(b=>{ b.t+=speed*dt; });
    const done=flying.filter(b=>b.t>=R+1); done.forEach(land); flying=flying.filter(b=>b.t<R+1);
    draw(); if(done.length) readout();
    if(flying.length||queue>0) raf=requestAnimationFrame(loop); else lastT=0; }
  function drop(n){ if(RM){ for(let i=0;i<n;i++){ spawn(); land(flying.pop()); } draw(); readout(); return; }
    const want=n===1?'one':(n>=1000?'bulk':'mid'), rank={one:0,mid:1,bulk:2}; if(!(flying.length||queue)||rank[want]>rank[mode]) mode=want; queue+=n; if(!raf) raf=requestAnimationFrame(loop); }
  document.getElementById('gl-1').addEventListener('click',()=>drop(1));
  document.getElementById('gl-100').addEventListener('click',()=>drop(100));
  document.getElementById('gl-2000').addEventListener('click',()=>drop(2000));
  document.getElementById('gl-reset').addEventListener('click',()=>{ if(raf){ cancelAnimationFrame(raf); raf=0; } reset(); });
  bindCtl('gl-rows',v=>{ R=v; if(raf){ cancelAnimationFrame(raf); raf=0; } reset(); },v=>String(v));
  bindCtl('gl-bias',v=>{ P=v; if(raf){ cancelAnimationFrame(raf); raf=0; } reset(); },v=>trim(F(v,2)));
  window.U14G={get:()=>({N,counts:counts.slice(),mean:N?sum/N:NaN,flying:flying.length,queue})};
  reset();
  /* the first time the board scrolls into view, a small shower of beads starts on its own */
  if('IntersectionObserver' in window){ const io=new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ io.disconnect(); if(!N&&!queue&&!flying.length) drop(160); } },{threshold:.45}); io.observe(cv); }
  new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  addEventListener('resize',()=>{ draw(); });
})();

/* ================= W2 · DICE ON A SEE-SAW (the mean is the balance point) ================= */
(function(){
  const svg=document.getElementById('dc-svg'); if(!svg) return;
  const tbl=document.getElementById('dc-kv'), verd=document.getElementById('dc-verdict');
  let k=2, pm=[], lo=2, hi=12, mu=7, v=35/6, piv=4.5, rolls=[], nR=0, rnd=seeded(36), anim=null, drag=false;
  function pmfOf(n){ let d=[1]; for(let r=0;r<n;r++){ const nd=new Array(d.length+6).fill(0); d.forEach((p,i)=>{ for(let f=1;f<=6;f++) nd[i+f]+=p/6; }); d=nd; } /* index = total */ return d; }
  function setK(n){ k=n; const d=pmfOf(n); lo=n; hi=6*n; pm=[]; for(let x=lo;x<=hi;x++) pm.push([x,d[x]]); mu=3.5*n; v=35*n/12; rolls=new Array(hi+1).fill(0); nR=0; rnd=seeded(36+n); piv=lo+(hi-lo)*.25; draw(); }
  const torque=()=>pm.reduce((a,[x,p])=>a+p*(x-piv),0);
  let lay=null;
  function draw(){ svg.innerHTML=''; const Wv=600, Hv=400, L=40, Rr=24, plankY=292, glow=glo(svg);
    const X0=lo-.8, X1=hi+.8, px=x=>L+(x-X0)/(X1-X0)*(Wv-L-Rr), PX=px(piv);
    const maxP=Math.max(...pm.map(q=>q[1]),nR?Math.max(...rolls)/nR:0), hs=200/maxP;
    const tq=torque(), ang=Math.max(-11,Math.min(11,tq*(k===1?7:k===2?3.2:2.2))), level=Math.abs(piv-mu)<1e-6;
    lay={px,ix:X=>X0+(X-L)/(Wv-L-Rr)*(X1-X0),plankY};
    const G=el('g',{transform:`rotate(${ang.toFixed(3)} ${PX} ${plankY})`,style:'transition:transform .25s'},svg);
    /* bars */
    const bw=Math.min(34,(px(lo+1)-px(lo))*.72);
    pm.forEach(([x,p])=>{ const X=px(x), h=p*hs; el('rect',{x:X-bw/2,y:plankY-h,width:bw,height:h,rx:3,fill:cvar(K14.mass),opacity:isLight()?.75:.85,filter:glow||null},G);
      if(k<3||x%2===0) txt(G,X,plankY+17,String(x),'font:600 11px Inter,system-ui;fill:var(--ink-muted)','middle'); });
    /* rolled outline */
    if(nR){ pm.forEach(([x])=>{ const X=px(x), h=rolls[x]/nR*hs; el('rect',{x:X-bw/2-3,y:plankY-h,width:bw+6,height:h,rx:3,fill:'none',stroke:'var(--ink)','stroke-width':1.8,opacity:.9},G); }); }
    /* the plank */
    el('rect',{x:px(X0)+2,y:plankY,width:px(X1)-px(X0)-4,height:6,rx:3,fill:'var(--ink-2)',opacity:.8},G);
    /* spread bar, under the plank */
    const sd=Math.sqrt(v); el('rect',{x:px(mu-sd),y:plankY+26,width:px(mu+sd)-px(mu-sd),height:7,rx:3.5,fill:cvar(K14.axis),opacity:.85},G);
    txt(G,px(mu+sd)+6,plankY+34,'±σ = ±'+F(sd,2),'font:700 11px Inter,system-ui;fill:var(--s3)');
    /* pivot */
    const pv=el('g',{class:'pivot',style:'cursor:grab'},svg);
    el('circle',{cx:PX,cy:plankY+26,r:26,fill:cvar(K14.mean),opacity:.12},pv);
    el('path',{d:`M${PX},${plankY+6}L${PX-17},${plankY+44}L${PX+17},${plankY+44}Z`,fill:cvar(K14.mean),filter:glow||null},pv);
    el('rect',{x:PX-40,y:plankY+44,width:80,height:5,rx:2.5,fill:'var(--ink-muted)',opacity:.6},svg);
    txt(svg,PX,plankY+66,'pivot '+trim(F(piv,2)),'font:700 12px Inter,system-ui;fill:var(--s4)','middle');
    txt(svg,L,26,k+(k>1?' dice':' die')+' · each bar is P(total)','font:600 12px Inter,system-ui;fill:var(--ink-muted)');
    if(level) txt(svg,PX,46,'level — the balance point is '+trim(F(mu,2)),'font:700 13px Inter,system-ui;fill:var(--s4)','middle');
    else txt(svg,PX,46,tq>0?'tips right →':'← tips left','font:700 13px Inter,system-ui;fill:var(--ink-2)','middle');
    readout(tq,level); }
  function readout(tq,level){ const em=nR?rolls.reduce((a,c,x)=>a+c*x,0)/nR:NaN;
    kv(tbl,[['dice',String(k)],['mean E[X] = 3.5 × dice','<b>'+trim(F(mu,2))+'</b>'],['variance Var[X]',F(v,3)+' <span style="color:var(--ink-muted)">= 35·'+k+'/12</span>'],['spread σ',F(Math.sqrt(v),3)],['pivot at',trim(F(piv,2))+(level?' ✓':'')],['turning push Σp(x)(x − pivot)',F(Math.abs(tq)<1e-12?0:tq,3)],['rolls',nR?nR+' · average '+F(em,3):'none yet']]);
    if(level){ verd.className='verdict good'; verd.textContent='good — the plank is level at '+trim(F(mu,2))+': the weights balance exactly at the mean'; }
    else { verd.className='verdict info'; verd.textContent='info — more weight sits '+(tq>0?'right':'left')+' of the pivot, so the plank tips '+(tq>0?'right':'left')+'. Slide the pivot '+(tq>0?'right':'left')+'.'; } }
  svgDrag(svg,(x,y)=>{ if(!lay) return false; const PX=lay.px(piv); if(Math.abs(x-PX)>36||y<lay.plankY-10) return false; drag=true; },
    (x)=>{ if(!drag) return; let f=lay.ix(x); f=Math.max(lo-.5,Math.min(hi+.5,f)); if(Math.abs(f-mu)<.12) f=mu; piv=Math.round(f*100)/100; if(Math.abs(piv-mu)<.011) piv=mu; draw(); },()=>{ drag=false; });
  function roll(n){ for(let i=0;i<n;i++){ let s=0; for(let d=0;d<k;d++) s+=1+Math.floor(rnd()*6); rolls[s]++; nR++; } }
  document.getElementById('dc-roll').addEventListener('click',()=>{ if(anim) anim.stop(); if(RM){ roll(600); draw(); return; } let done=0; anim=tween(2200,u=>{ const want=Math.round(600*u); if(want>done){ roll(want-done); done=want; draw(); } }); });
  document.getElementById('dc-level').addEventListener('click',()=>{ const a=piv; slideTo(null,a,mu,700,f=>{ piv=f; draw(); }); });
  document.getElementById('dc-clear').addEventListener('click',()=>{ rolls=new Array(hi+1).fill(0); nR=0; draw(); });
  tabs(document.getElementById('dc-tabs'),t=>setK(+t));
  window.U14D={state:()=>({k,mu,v,piv,nR,level:Math.abs(piv-mu)<1e-6})};
  setK(2);
  new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W3 · AREA, NOT HEIGHT (a density with a draggable window) ================= */
(function(){
  const svg=document.getElementById('dn-svg'); if(!svg) return;
  const tbl=document.getElementById('dn-kv'), verd=document.getElementById('dn-verdict'), MU=5;
  let s=1, a=4, b=6, fr=null, dragH=null;
  const area=()=>b<=a?0:Phi((b-MU)/s)-Phi((a-MU)/s);
  function total(){ const n=800, A=MU-9*s, B=MU+9*s, h=(B-A)/n; let t=npdf(A,MU,s)+npdf(B,MU,s); for(let i=1;i<n;i++) t+=(i%2?4:2)*npdf(A+i*h,MU,s); return t*h/3; }
  function draw(){ const pk=1/(s*SQ2PI), top=Math.max(1.25,pk*1.12);
    fr=frame(svg,0,10,0,top,{l:44,r:14,t:18,b:34,xs:1,ys:top>2.5?1:.25,yf:v=>trim(F(v,2))});
    const g=el('g',{'clip-path':fr.clip},svg);
    /* the window */
    if(b>a){ let d='M'+fr.px(a)+','+fr.py(0); for(let i=0;i<=160;i++){ const x=a+(b-a)*i/160; d+='L'+fr.px(x).toFixed(1)+','+fr.py(npdf(x,MU,s)).toFixed(1); } d+='L'+fr.px(b)+','+fr.py(0)+'Z';
      el('path',{d,fill:cvar(K14.mass),opacity:isLight()?.35:.4},g); }
    /* the curve */
    let d=''; for(let i=0;i<=400;i++){ const x=10*i/400; d+=(i?'L':'M')+fr.px(x).toFixed(1)+','+fr.py(Math.min(top*1.05,npdf(x,MU,s))).toFixed(1); }
    glowPath(g,d,'var(--ink)',2.6,!isLight());
    /* height 1 */
    glowLine(g,fr.px(0),fr.py(1),fr.px(10),fr.py(1),'var(--ink-muted)',1.2,false,{'stroke-dasharray':'6 5'}); txt(svg,fr.px(10)-4,fr.py(1)-6,'height 1','font:600 11px Inter,system-ui;fill:var(--ink-muted)','end');
    /* peak label */
    txt(svg,fr.px(MU)+10,Math.max(fr.T+14,fr.py(pk)+4),'peak '+F(pk,3),'font:700 12px Inter,system-ui;fill:var(--s4)');
    /* area label */
    const ab=area(); txt(svg,fr.px((a+b)/2),fr.py(0)-10,b>a?'area '+F(ab,3):'zero width → area 0','font:800 13px Inter,system-ui;fill:'+(isLight()?'var(--ink)':'var(--s6)'),'middle');
    /* handles */
    [['a',a],['b',b]].forEach(([n,x],i)=>{ const X=fr.px(x), Y=fr.py(0); el('line',{x1:X,y1:Y,x2:X,y2:fr.py(Math.min(top,npdf(x,MU,s))),stroke:cvar(K14.mass),'stroke-width':2},svg);
      el('circle',{cx:X,cy:Y,r:13,fill:cvar(K14.mean),opacity:.16},svg); el('circle',{cx:X,cy:Y,r:7,fill:'var(--ink)',stroke:cvar(K14.mean),'stroke-width':2.5},svg);
      txt(svg,X+(i?9:-9),Y+26,n+' = '+trim(F(x,2)),'font:700 11px Inter,system-ui;fill:var(--ink-2)',i?'start':'end'); });
    txt(svg,fr.px(10),fr.H-4,'minutes late →','font:600 11px Inter,system-ui;fill:var(--ink-muted)','end');
    const tot=total();
    kv(tbl,[['spread σ',trim(F(s,2))+' min'],['peak height 1/(σ√2π)','<b>'+F(pk,3)+'</b>'+(pk>1?' <span style="color:var(--ink-muted)">(above 1!)</span>':'')],['window','from '+trim(F(a,2))+' to '+trim(F(b,2))],['P(window) = area','<b>'+F(ab,3)+'</b>'],['total area under the curve',F(tot,3)]]);
    if(b<=a){ verd.className='verdict good'; verd.textContent='good — a window of zero width holds zero probability: P(exactly 5) = 0, even though the height there is '+F(pk,3); }
    else if(pk>1){ verd.className='verdict good'; verd.textContent='good — the peak is '+F(pk,3)+', above 1, and the total area is still 1: a height is a rate, not a chance'; }
    else { verd.className='verdict info'; verd.textContent='info — the chance of being '+trim(F(a,2))+' to '+trim(F(b,2))+' minutes late is the shaded area, '+F(ab,3); } }
  svgDrag(svg,(x,y)=>{ if(!fr) return false; const da=Math.abs(x-fr.px(a)), db=Math.abs(x-fr.px(b)); if(y<fr.py(0)-60||Math.min(da,db)>30) return false; dragH=da<db||(da===db&&x<fr.px(a))?'a':'b'; pressOnly(document.getElementById('dn-pre'),null); },
    x=>{ if(!dragH) return; const v=Math.max(0,Math.min(10,Math.round(fr.ix(x)*20)/20)); if(dragH==='a') a=Math.min(v,b); else b=Math.max(v,a); draw(); },()=>{ dragH=null; });
  bindCtl('dn-sig',v=>{ s=v; draw(); },v=>trim(F(v,2)));
  const pre=document.getElementById('dn-pre');
  document.getElementById('dn-p-46').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); a=4; b=6; draw(); });
  document.getElementById('dn-p-narrow').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); a=4; b=6; const f=s; slideTo(null,f,.1,900,v=>{ s=Math.round(v*100)/100; setCtl('dn-sig',s,x=>trim(F(x,2))); draw(); }); });
  document.getElementById('dn-p-exact').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); a=5; b=5; draw(); });
  draw();
  new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W4 · TEN THOUSAND PEOPLE WALK INTO A CLINIC (natural frequencies) ================= */
(function(){
  const cv=document.getElementById('by-cv'); if(!cv) return;
  const g=cv.getContext('2d'), W=cv.width, H=cv.height, tbl=document.getElementById('by-kv'), verd=document.getElementById('by-verdict');
  const GC=100, CELL=6, GX=4, GY=44, ZX=648, ZW=W-ZX-4, ZY=44, ZH=600;
  let prev=.01, sens=.99, fpr=.05, round=1, anim=null;
  const post=()=>sens*prev/(sens*prev+fpr*(1-prev));
  function fs(px){ const k=W/Math.max(1,cv.clientWidth||W); return Math.round(Math.min(px*k,px*3.1)); }
  function counts(){ const sick=Math.round(1e4*prev), healthy=1e4-sick, tp=Math.round(sick*sens), fp=Math.round(healthy*fpr); return {sick,healthy,tp,fp}; }
  function rr(x,y,w,h,r){ g.beginPath(); if(g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); g.fill(); }
  function draw(){ const c=counts(), dark=!isLight(); g.clearRect(0,0,W,H);
    const sickC=rgba(K14.q,1), sickDim=rgba(K14.q,dark?.28:.28), hC=dark?rgba('ink',.78):rgba('ink-2',.62), hDim=dark?rgba('ink-muted',.14):rgba('ink-muted',.15);
    g.font=`700 ${fs(12)}px Inter,system-ui`; g.textAlign='left'; g.fillStyle=cssv('ink-2'); g.fillText('the whole clinic · 10 000 people',GX,GY-14);
    /* row-major: the sick first (flagged ones first), then the flagged healthy, then everyone else */
    let i=0; const put=(fill)=>{ const x=GX+(i%GC)*CELL, y=GY+Math.floor(i/GC)*CELL; g.fillStyle=fill; g.fillRect(x+.5,y+.5,CELL-1,CELL-1); i++; };
    for(let k=0;k<c.sick;k++) put(k<c.tp?sickC:sickDim);
    for(let k=0;k<c.healthy;k++) put(k<c.fp?hC:hDim);
    /* a bracket around everyone who tested positive */
    const rowsPos=Math.ceil((c.sick+c.fp)/GC); g.strokeStyle=rgba(K14.mass,.95); g.lineWidth=2.5; if(dark){ g.shadowColor=cssv(K14.mass); g.shadowBlur=12; }
    g.strokeRect(GX-2,GY-2,GC*CELL+4,Math.max(CELL,rowsPos*CELL)+4); g.shadowBlur=0;
    /* the zoom: only the positives, at a readable size */
    const P=c.tp+c.fp; let cs=Math.max(5,Math.min(34,Math.floor(Math.sqrt(ZW*ZH/Math.max(1,P))))); let cols=Math.max(1,Math.floor(ZW/cs)); while(Math.ceil(P/cols)*cs>ZH&&cs>5){ cs--; cols=Math.floor(ZW/cs); }
    g.fillStyle=cssv(K14.mass); g.font=`800 ${fs(12)}px Inter,system-ui`; g.fillText('zoom · the '+P.toLocaleString('en-IN')+' who tested positive',ZX,GY-14);
    /* the funnel from the bracket to the zoom */
    g.strokeStyle=rgba(K14.mass,.35); g.lineWidth=1.5; g.setLineDash([6,6]); g.beginPath(); g.moveTo(GX+GC*CELL+4,GY); g.lineTo(ZX-6,ZY); g.moveTo(GX+GC*CELL+4,GY+rowsPos*CELL); g.lineTo(ZX-6,ZY+Math.ceil(P/cols)*cs); g.stroke(); g.setLineDash([]);
    for(let k=0;k<P;k++){ const x=ZX+(k%cols)*cs, y=ZY+Math.floor(k/cols)*cs, sick=k<c.tp;
      if(sick&&dark&&cs>=10){ g.fillStyle=rgba(K14.q,.25); rr(x-1,y-1,cs,cs,cs*.3); }
      g.fillStyle=sick?sickC:hC; rr(x+1,y+1,cs-2,cs-2,Math.max(1,cs*.22)); }
    /* the split bar */
    const y0=GY+GC*CELL+34, bw=W-8, ws=P?bw*c.tp/P:0;
    if(dark){ g.shadowColor=cssv(K14.q); g.shadowBlur=14; } g.fillStyle=sickC; g.fillRect(4,y0,ws,30); g.shadowBlur=0;
    g.fillStyle=hC; g.fillRect(4+ws,y0,bw-ws,30); g.strokeStyle=rgba(K14.mass,1); g.lineWidth=2; g.strokeRect(4,y0,bw,30);
    g.font=`800 ${fs(13)}px Inter,system-ui`; g.textBaseline='top';
    g.fillStyle=cssv(K14.q); g.textAlign='left'; g.fillText(c.tp.toLocaleString('en-IN')+' sick',4,y0+40);
    g.fillStyle=cssv('ink-2'); g.textAlign='right'; g.fillText(c.fp.toLocaleString('en-IN')+' healthy',W-4,y0+40);
    g.fillStyle=cssv(K14.mean); g.textAlign='center'; g.fillText('P(sick | +) = '+c.tp.toLocaleString('en-IN')+' / '+P.toLocaleString('en-IN')+' = '+F(post(),3),W/2,y0+40); g.textBaseline='alphabetic'; }
  function readout(){ const c=counts(), p=post();
    kv(tbl,[['round',round===1?'first test':'test number '+round],['prior P(sick)','<b>'+(prev<.1?trim(F(100*prev,2)):trim(F(100*prev,1)))+'%</b>'],['sick · flagged',c.sick.toLocaleString('en-IN')+' · '+c.tp.toLocaleString('en-IN')],['healthy · flagged',c.healthy.toLocaleString('en-IN')+' · '+c.fp.toLocaleString('en-IN')],['all positives',(c.tp+c.fp).toLocaleString('en-IN')],['P(sick | +) = posterior','<b>'+F(p,3)+'</b>']]);
    verd.className='verdict '+(p>=.5?'good':'info');
    verd.textContent=(p>=.5?'good — ':'info — ')+'only '+c.tp.toLocaleString('en-IN')+' of the '+(c.tp+c.fp).toLocaleString('en-IN')+' positives are sick: P(sick | +) = '+F(p,3)+(round>1?' — the old posterior was this test\'s prior':''); }
  function all(){ draw(); readout(); }
  const setPrev=v=>{ prev=v; setCtl('by-prev',Math.max(.1,Math.min(20,+(100*v).toFixed(2))),()=>(v<.1?trim(F(100*v,2)):trim(F(100*v,1)))+'%'); };
  bindCtl('by-prev',v=>{ prev=v/100; round=1; all(); },v=>trim(F(v,1))+'%');
  bindCtl('by-sens',v=>{ sens=v/100; all(); },v=>trim(F(v,1))+'%');
  bindCtl('by-fpr',v=>{ fpr=v/100; all(); },v=>trim(F(v,1))+'%');
  document.getElementById('by-again').addEventListener('click',()=>{ if(anim) anim.stop(); const from=prev, to=post(); round++;
    anim=slideTo(null,from,to,RM?1:1100,v=>{ prev=v; draw(); },()=>{ prev=to; setPrev(to); all(); }); });
  document.getElementById('by-reset').addEventListener('click',()=>{ if(anim) anim.stop(); prev=.01; sens=.99; fpr=.05; round=1; setCtl('by-prev',1,()=>'1%'); setCtl('by-sens',99,()=>'99%'); setCtl('by-fpr',5,()=>'5%'); all(); });
  window.U14B={post,counts,get prev(){ return prev; }};
  all();
  new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  addEventListener('resize',draw);
})();
