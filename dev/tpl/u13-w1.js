/* ================= W1 · THE WIDEST STREET, ONE TILT AT A TIME (a street on a glass floor, pushed out at every tilt) ================= */
(function(){
  const box=document.getElementById('tl-3d'), svg=document.getElementById('tl-curve'), read=document.getElementById('tl-read'), verd=document.getElementById('tl-verdict');
  if(!box) return;
  const CX=3.2, CY=3.4, S=.55, P=x=>[(x[0]-CX)*S,(x[1]-CY)*S], L=5.4;
  let deg=20, sc=null, anim=null, run=0, wasBest=false;
  const NAME=i=>'('+D1.X[i].map(v=>nm(String(v))).join(', ')+')';
  /* the width-vs-tilt curve (exact, sampled) */
  const CURVE=[]; for(let d=5;d<=95;d+=.5) CURVE.push([d,streetAtTilt(D1.X,D1.y,d).width]);
  let cf=null;
  function drawCurve(){ cf=frame(svg,5,95,-.6,3.1,{l:34,r:10,t:14,b:26,xs:15,ys:1,xf:v=>v+'°'});
    const g=el('g',{'clip-path':cf.clip},svg);
    el('rect',{x:cf.px(5),y:cf.py(0),width:cf.px(95)-cf.px(5),height:cf.py(-.6)-cf.py(0),fill:cvar('critical'),opacity:.08},g);
    txt(svg,cf.px(50),cf.py(-.36),'no street: the line cannot even split the points','font:600 9.5px Inter,system-ui;fill:var(--critical)','middle');
    const d=CURVE.map((q,i)=>(i?'L':'M')+cf.px(q[0]).toFixed(1)+','+cf.py(Math.max(-.6,q[1])).toFixed(1)).join('');
    glowPath(g,d,cvar(K13.edge),2.4,!isLight());
    const bx=cf.px(45), by=cf.py(2*Math.SQRT2); el('circle',{cx:bx,cy:by,r:5,fill:cvar(K13.sv)},svg); txt(svg,bx+8,by-6,'widest: 45° · 2.83','font:700 10px Inter,system-ui;fill:var(--s4)');
    txt(svg,cf.L+2,cf.T+10,'street width','font:600 10px Inter,system-ui;fill:var(--ink-muted)');
    cf.cur=el('g',{},svg); }
  function markCurve(){ if(!cf) return; cf.cur.innerHTML=''; const w=streetAtTilt(D1.X,D1.y,deg).width, X=cf.px(deg), Y=cf.py(Math.max(-.6,w));
    el('line',{x1:X,y1:cf.py(-.6),x2:X,y2:cf.py(3.1),stroke:'var(--ink-muted)','stroke-dasharray':'3 4'},cf.cur);
    glowDot(cf.cur,X,Y,5.5,w>0?'var(--ink)':cvar('critical'),cf.glow); }
  function build(){ sc=null; const narrow=box.clientWidth<560, r=narrow?8.4:6.6;
    const th=.35, ph=.95, look=[0,.1,0];
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),look[1]+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look,fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx);
        glassFloor(ctx,7,{div:28});
        D1.X.forEach((x,i)=>root.add(bead3(ctx,M3(...P(x),.075),D1.y[i],{r:.08})));
        const street=strip3(ctx,hx(K13.edge),isLight?.14:.17); root.add(street);
        const sideP=strip3(ctx,hx(K13.pos),isLight?.05:.06), sideN=strip3(ctx,hx(K13.neg),isLight?.05:.06); root.add(sideP,sideN);
        const cLine=liveTube(ctx,hx('ink'),.017,.95), e1=liveTube(ctx,hx(K13.edge),.013), e2=liveTube(ctx,hx(K13.edge),.013); root.add(cLine,e1,e2);
        const wA=CIN.prim.arrow(ctx,[0,.03,0],[.5,.03,0],hx(K13.w),{radius:.02,head:.15}); root.add(wA);
        const touch=[0,1,2].map(()=>{ const m=ring3(ctx,.16,{color:'ink2',tube:.009}); root.add(m); return m; });
        const gold=[0,1,6].map(i=>{ const m=ring3(ctx,.18,{tube:.017}); m.position.set(...M3(...P(D1.X[i]),.012)); m.visible=false; root.add(m); return m; });
        const lab=slot(ctx,root);
        sc={ctx,THREE,hx,street,sideP,sideN,cLine,e1,e2,wA,touch,gold,lab,handle:null};
        hint(box,'drag to orbit'); sc.hud=hud(box); paint(); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM||sc.story) return false; const o=sc.handle.ctx.orbit; o.sph.theta=.35+.18*Math.sin(t*.25); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; }); }
    return handle; }
  function paint(){ if(!sc) return; const {THREE,street,sideP,sideN,cLine,e1,e2,wA,touch,gold,lab,ctx}=sc;
    const st=streetAtTilt(D1.X,D1.y,deg), u=st.u, d=[-u[1],u[0]], wd=Math.max(0,st.width)*S, k=st.mid-(u[0]*CX+u[1]*CY), cs=[k*u[0]*S,k*u[1]*S];
    street.userData.set(cs,u,Math.max(.004,wd),L,.004); street.visible=st.width>0;
    const off=wd/2+1.6; sideP.userData.set([cs[0]+u[0]*off,cs[1]+u[1]*off],u,3.2,L,.003); sideN.userData.set([cs[0]-u[0]*off,cs[1]-u[1]*off],u,3.2,L,.003);
    const seg=(o,m)=>{ aimTube(THREE,m,M3(cs[0]+u[0]*o-d[0]*L/2,cs[1]+u[1]*o-d[1]*L/2,.013),M3(cs[0]+u[0]*o+d[0]*L/2,cs[1]+u[1]*o+d[1]*L/2,.013)); };
    seg(0,cLine); seg(wd/2,e1); seg(-wd/2,e2); cLine.material.color.setHex(st.width>0?sc.hx('ink'):critHex()); cLine.material.emissive.setHex(st.width>0?sc.hx('ink'):critHex());
    const a0=M3(cs[0]+d[0]*1.3,cs[1]+d[1]*1.3,.035), a1=M3(cs[0]+d[0]*1.3+u[0]*.6,cs[1]+d[1]*1.3+u[1]*.6,.035); wA.userData.set(new THREE.Vector3(...a0),new THREE.Vector3(...a1)); wA.visible=st.width>0;
    const best=Math.abs(deg-45)<.26;
    touch.forEach((m,j)=>{ const i=st.touch[j]; m.visible=i!=null&&!best; if(i!=null) m.position.set(...M3(...P(D1.X[i]),.012)); });
    gold.forEach(m=>{ m.visible=best; });
    if(best&&!wasBest) [0,1,6].forEach(i=>flare(ctx,M3(...P(D1.X[i]),.1),sc.hx(K13.sv),800,.9)); wasBest=best;
    lab.set(st.width>0?'width '+F(st.width,2):'no street',M3(cs[0]-d[0]*1.9,cs[1]-d[1]*1.9,.25),{size:17,color:st.width>0?(best?cssv(K13.sv):cssv('ink')):cssv('critical'),depthTest:false,scale:.0052});
    sc.hud.innerHTML='tilt <b>'+F(deg,1)+'°</b> · width <b>'+F(Math.max(0,st.width),3)+'</b>'+(best?' · the widest':'');
    RR(ctx); }
  function draw(){ const st=streetAtTilt(D1.X,D1.y,deg), best=Math.abs(deg-45)<.26;
    read.innerHTML='street width = <b>'+F(Math.max(0,st.width),3)+'</b>'+(st.width>0?'':' (no street)')+'<br>touching: '+st.touch.map(i=>'<span class="'+(D1.y[i]>0?'k-pos':'k-neg')+'">'+NAME(i)+'</span>').join(' · ')+'<br>best of all tilts: <b>2.828</b> at 45°';
    if(st.width<=0){ verd.className='verdict bad'; verd.textContent='bad — at this tilt no line splits the points: a blue and an orange point overlap along the normal'; }
    else if(best){ verd.className='verdict good'; verd.textContent='good — the widest street of all: width 2.828, held up by three points'; }
    else { verd.className='verdict info'; verd.textContent='info — a perfect split, but '+F(2*Math.SQRT2-st.width,2)+' narrower than the widest street'; }
    markCurve(); paint(); }
  function setDeg(v){ deg=Math.round(v*10)/10; setCtl('tl-t',deg,x=>F(x,1).replace(/\.0$/,'')+'°'); draw(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc) sc.story=false; }
  function play(){ stop(); const tok=run; if(sc) sc.story=true; pressOnly(document.getElementById('tl-pre'),null);
    if(RM){ setDeg(45); return; }
    const seq=[[deg,90,1400],[90,12,2000],[12,45,1600]]; let k=0;
    const next=()=>{ if(tok!==run) return; if(k>=seq.length){ if(sc) sc.story=false; pressOnly(document.getElementById('tl-pre'),document.getElementById('tl-p-c')); return; } const [a,b,dur]=seq[k++]; anim=slideTo(null,a,b,dur,v=>{ if(tok===run) setDeg(v); },()=>setTimeout(next,250)); };
    if(sc&&sc.handle) camTo(sc.handle,{theta:.2,phi:.72,radius:(box.clientWidth<560?8.4:6.6)},900); next(); }
  document.getElementById('tl-play').addEventListener('click',play);
  [['tl-p-a',20],['tl-p-b',70],['tl-p-c',45]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{ stop(); pressOnly(document.getElementById('tl-pre'),e.currentTarget); setDeg(v); }));
  bindCtl('tl-t',v=>{ stop(); pressOnly(document.getElementById('tl-pre'),null); deg=v; draw(); },v=>F(v,1).replace(/\.0$/,'')+'°');
  drawCurve(); draw();
  new MutationObserver(()=>{ drawCurve(); markCurve(); }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
})();

/* ================= W2 · THE DISTANCE FORMULA, LIVE (a probe, its straight-across walk, and the compass w) ================= */
(function(){
  const svg=document.getElementById('pb-svg'), tbl=document.getElementById('pb-kv'), verd=document.getElementById('pb-verdict'); if(!svg) return;
  const W0=Math.atan2(2,1)*180/Math.PI;
  let ang=W0, b=-6, pr=[4.4,5.2], fr=null, drag=false;
  const wv=()=>{ const t=ang*Math.PI/180; return [Math.sqrt(5)*Math.cos(t),Math.sqrt(5)*Math.sin(t)]; };
  const isDefault=()=>Math.abs(ang-W0)<.06&&Math.abs(b+6)<1e-9;
  function twoPoints(w){ if(isDefault()) return [[6,0],[0,3]]; const n2=w[0]*w[0]+w[1]*w[1], f0=[-b*w[0]/n2,-b*w[1]/n2], d=[-w[1]/Math.sqrt(n2),w[0]/Math.sqrt(n2)];
    return [[f0[0]+2.6*d[0],f0[1]+2.6*d[1]],[f0[0]-2.6*d[0],f0[1]-2.6*d[1]]]; }
  function draw(){ const w=wv(), wn=Math.hypot(...w); fr=eqFrame(svg,4,3.62,4.35,{xs:1,ys:1});
    const g=el('g',{'clip-path':fr.clip},svg);
    const hp=bandPoly(w,b,0,1e9,fr), hn=bandPoly(w,b,-1e9,0,fr);
    if(hp.length) el('path',{d:polyD(fr,hp),fill:cvar(K13.pos),opacity:isLight()?.06:.08},g); if(hn.length) el('path',{d:polyD(fr,hn),fill:cvar(K13.neg),opacity:isLight()?.06:.08},g);
    const s0=lineInBox(w,b,0,fr); if(s0) glowLine(g,fr.px(s0[0][0]),fr.py(s0[0][1]),fr.px(s0[1][0]),fr.py(s0[1][1]),'var(--ink)',2.6,!isLight());
    const eq=isDefault()?'x₁ + 2x₂ = 6':nm(T3w(w[0]))+'x₁ + '+nm(T3w(w[1]))+'x₂ '+(b<=0?'= ':'= −')+T3w(Math.abs(b));
    /* two points on the line and the arrow between them */
    const [p,q]=twoPoints(w);

    [[p,'p'],[q,'q']].forEach(([z,n])=>{ el('circle',{cx:fr.px(z[0]),cy:fr.py(z[1]),r:4.5,fill:'var(--ink)'},g); txt(svg,fr.px(z[0])+8,fr.py(z[1])-8,n,'font:700 12px Inter,system-ui;fill:var(--ink-2)'); });
    /* the probe's walk */
    const f=w[0]*pr[0]+w[1]*pr[1]+b, t=f/wn, u=[w[0]/wn,w[1]/wn], foot=[pr[0]-t*u[0],pr[1]-t*u[1]];
    el('line',{x1:fr.px(pr[0]),y1:fr.py(pr[1]),x2:fr.px(foot[0]),y2:fr.py(foot[1]),stroke:cvar(K13.sv),'stroke-width':2.2,'stroke-dasharray':'6 5'},g);
    if(Math.abs(t)>.35){ const mx=(pr[0]+foot[0])/2, my=(pr[1]+foot[1])/2; txt(svg,fr.px(mx)+10,fr.py(my),F(Math.abs(t),3),'font:700 13px Inter,system-ui;fill:var(--s4)'); }
    /* right-angle tick at the foot + the unit normal */
    const dd=[-u[1],u[0]], sz=.22; const sgn=t>=0?1:-1;
    el('path',{d:`M${fr.px(foot[0]+dd[0]*sz)},${fr.py(foot[1]+dd[1]*sz)}L${fr.px(foot[0]+dd[0]*sz+u[0]*sz*sgn)},${fr.py(foot[1]+dd[1]*sz+u[1]*sz*sgn)}L${fr.px(foot[0]+u[0]*sz*sgn)},${fr.py(foot[1]+u[1]*sz*sgn)}`,fill:'none',stroke:'var(--ink-muted)','stroke-width':1.2},g);
    const wa=[foot[0]-dd[0]*.9,foot[1]-dd[1]*.9]; edge(g,fr.px(wa[0]),fr.py(wa[1]),fr.px(wa[0]+u[0]*1.1),fr.py(wa[1]+u[1]*1.1),cvar(K13.w),3,fr.glow);
    txt(svg,fr.px(wa[0]+u[0]*1.25)+4,fr.py(wa[1]+u[1]*1.25),'ŵ','font:700 14px Inter,system-ui;fill:var(--s3)');
    { const of=.28, A=[q[0]+u[0]*of,q[1]+u[1]*of], Bq=[p[0]+u[0]*of,p[1]+u[1]*of]; edge(g,fr.px(A[0]),fr.py(A[1]),fr.px(Bq[0]),fr.py(Bq[1]),'var(--ink-2)',1.5,null,.75);
      txt(svg,fr.px((A[0]+Bq[0])/2+u[0]*.22),fr.py((A[1]+Bq[1])/2+u[1]*.22),'p − q','font:600 11px Inter,system-ui;fill:var(--ink-2)','middle'); }
    /* the probe */
    const X=fr.px(pr[0]), Y=fr.py(pr[1]); el('circle',{cx:X,cy:Y,r:16,fill:cvar(K13.sv),opacity:.14},svg); el('circle',{cx:X,cy:Y,r:8,fill:'var(--ink)',stroke:cvar(K13.sv),'stroke-width':2.5},svg);
    txt(svg,X+12,Y-12,'probe','font:700 11px Inter,system-ui;fill:var(--ink-2)');
    if(s0){ const m=[s0[0][0]*.62+s0[1][0]*.38,s0[0][1]*.62+s0[1][1]*.38], at=[m[0]-u[0]*.32,m[1]-u[1]*.32]; let ang2=Math.atan2(-(fr.py(s0[1][1])-fr.py(s0[0][1])),fr.px(s0[1][0])-fr.px(s0[0][0]))*180/Math.PI; if(ang2>90) ang2-=180; if(ang2<-90) ang2+=180;
      const tt=txt(svg,fr.px(at[0]),fr.py(at[1]),eq,'font:700 12.5px Inter,system-ui;fill:var(--ink)','middle'); tt.setAttribute('transform',`rotate(${-ang2} ${fr.px(at[0])} ${fr.py(at[1])})`); }
    const pq=[p[0]-q[0],p[1]-q[1]], dotpq=w[0]*pq[0]+w[1]*pq[1];
    kv(tbl,[['probe',vecS(pr,2)],['raw score f = w·x + b','<b>'+T3w(f)+'</b>'],['‖w‖',T3w(wn)],['distance f/‖w‖','<b>'+T3w(t)+'</b>'],['side',Math.abs(f)<1e-9?'on the line':(f>0?'<span class="k-pos">+ (the side w points to)</span>':'<span class="k-neg">− (against w)</span>')],['w · (p − q)',T3w(Math.abs(dotpq)<1e-9?0:dotpq)+(Math.abs(dotpq)<1e-9?' ✓ at right angles':'')]]);
    if(Math.abs(f)<1e-6){ verd.className='verdict good'; verd.textContent='good — on the line the score is exactly 0, so the distance is 0'; }
    else { verd.className='verdict info'; verd.textContent='info — the score '+T3w(f)+' is ‖w‖ = '+T3w(wn)+' times the distance '+T3w(t)+'; divide and you have the true distance'; } }
  function T3w(v){ return Math.abs(v)<5e-4?'0':trim(F(v,3)); }
  svgDrag(svg,(x,y)=>{ if(!fr) return false; const X=fr.px(pr[0]),Y=fr.py(pr[1]); if(Math.hypot(x-X,y-Y)>30) return false; drag=true; pressOnly(document.getElementById('pb-reset').parentNode,null); },
    (x,y)=>{ if(!drag) return; pr=[Math.max(fr.X0+.1,Math.min(fr.X1-.1,Math.round(fr.ix(x)*20)/20)),Math.max(fr.Y0+.1,Math.min(fr.Y1-.1,Math.round(fr.iy(y)*20)/20))]; draw(); },()=>{ drag=false; });
  bindCtl('pb-ang',v=>{ ang=v; pressOnly(document.getElementById('pb-reset').parentNode,null); draw(); },v=>F(v,1).replace(/\.0$/,'')+'°');
  bindCtl('pb-b',v=>{ b=v; pressOnly(document.getElementById('pb-reset').parentNode,null); draw(); },v=>nm(fmt(v,1)));
  document.getElementById('pb-reset').addEventListener('click',e=>{ ang=W0; b=-6; pr=[4.4,5.2]; setCtl('pb-ang',63.4,v=>'63.4°'); setCtl('pb-b',-6,v=>'−6'); pressOnly(e.currentTarget.parentNode,e.currentTarget); draw(); });
  document.getElementById('pb-on').addEventListener('click',e=>{ const w=wv(), wn=Math.hypot(...w), f=w[0]*pr[0]+w[1]*pr[1]+b, t=f/wn; const from=pr.slice(), to=[pr[0]-t*w[0]/wn,pr[1]-t*w[1]/wn];
    pressOnly(e.currentTarget.parentNode,e.currentTarget); tween(700,u=>{ pr=[from[0]+(to[0]-from[0])*u,from[1]+(to[1]-from[1])*u]; draw(); }); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W3 · THE CAUCHY–SCHWARZ BOUND, LIVE (two points on two edges, the gap pinned) ================= */
(function(){
  const svg=document.getElementById('gp-svg'), tbl=document.getElementById('gp-kv'), verd=document.getElementById('gp-verdict'); if(!svg) return;
  const w=[-.5,-.5], b=2.5, wn=Math.SQRT1_2, M=2/wn;
  let sP=2.4, sN=6.2, fr=null, drag=null, anim=null;
  const xP=()=>[sP,3-sP], xN=()=>[sN,7-sN];                  /* blue on x₁+x₂ = 3 (score +1), orange on x₁+x₂ = 7 (score −1) */
  function draw(){ fr=eqFrame(svg,4,3.6,4.3,{xs:1,ys:1}); const g=el('g',{'clip-path':fr.clip},svg);
    drawStreet(fr,g,w,b,{sides:true});
    const p=xP(), q=xN(), dv=[p[0]-q[0],p[1]-q[1]], dist=Math.hypot(...dv), cosv=Math.abs(w[0]*dv[0]+w[1]*dv[1])/(wn*dist);
    /* the straight-across gap from the blue point */
    const u=[w[0]/wn,w[1]/wn], across=[p[0]-u[0]*M,p[1]-u[1]*M];
    glowLine(g,fr.px(p[0]),fr.py(p[1]),fr.px(across[0]),fr.py(across[1]),cvar(K13.pos),3.2,!isLight());
    el('circle',{cx:fr.px(across[0]),cy:fr.py(across[1]),r:4,fill:cvar(K13.pos)},g);
    { const dd=[-u[1],u[0]], mx=(p[0]+across[0])/2-dd[0]*.64, my=(p[1]+across[1])/2-dd[1]*.64; const tt=txt(svg,fr.px(mx),fr.py(my),'gap '+F(M,3),'font:700 12px Inter,system-ui;fill:var(--s1)','middle'); tt.setAttribute('transform',`rotate(-45 ${fr.px(mx)} ${fr.py(my)})`); }
    /* the point-to-point distance */
    glowLine(g,fr.px(p[0]),fr.py(p[1]),fr.px(q[0]),fr.py(q[1]),cvar(K13.neg),2.4,!isLight(),{'stroke-dasharray':'8 5'});
    { let nx=-dv[1]/dist, ny=dv[0]/dist; if(ny>0){ nx=-nx; ny=-ny; } const mx=(p[0]+q[0])/2+nx*.42, my=(p[1]+q[1])/2+ny*.42; txt(svg,fr.px(mx),fr.py(my)+4,'‖x⁺ − x⁻‖ = '+F(dist,3),'font:700 12px Inter,system-ui;fill:var(--s2)','middle'); }
    /* w at the middle of the street */
    const c0=[1.6,3.4]; edge(g,fr.px(c0[0]),fr.py(c0[1]),fr.px(c0[0]+u[0]*1.1),fr.py(c0[1]+u[1]*1.1),cvar(K13.w),3,fr.glow); txt(svg,fr.px(c0[0]+u[0]*1.1)-6,fr.py(c0[1]+u[1]*1.1)+4,'w','font:700 14px Inter,system-ui;fill:var(--s3)','end');
    [[[.5,2.5],.3,'x₁ + x₂ = 3 · score +1'],[[3.3,3.7],-.3,'x₁ + x₂ = 7 · score −1'],[[1.1,3.9],-.22,'boundary x₁ + x₂ = 5']].forEach(([pt,o,t])=>{ const X=fr.px(pt[0]+u[0]*o), Y=fr.py(pt[1]+u[1]*o); const tt=txt(svg,X,Y,t,'font:600 11px Inter,system-ui;fill:'+(t[0]==='b'?'var(--ink-2)':'var(--s7)'),'middle'); tt.setAttribute('transform',`rotate(45 ${X} ${Y})`); });
    mark(svg,fr.px(p[0]),fr.py(p[1]),1,{r:8}); mark(svg,fr.px(q[0]),fr.py(q[1]),-1,{r:8});
    txt(svg,fr.px(p[0])-12,fr.py(p[1])+20,'x⁺','font:700 13px Inter,system-ui;fill:var(--s1)','end'); txt(svg,fr.px(q[0])+12,fr.py(q[1])-10,'x⁻','font:700 13px Inter,system-ui;fill:var(--s2)');
    const dotv=w[0]*dv[0]+w[1]*dv[1];
    kv(tbl,[['margin 2c/‖w‖','<b>'+F(M,3)+'</b>'],['‖x⁺ − x⁻‖',F(dist,3)],['difference',F(dist-M,3)],['w · (x⁺ − x⁻)',trim(F(dotv,3))+' = 2c ✓'],['‖w‖',F(wn,3)],['angle between x⁺ − x⁻ and w',F(Math.acos(Math.min(1,cosv))*180/Math.PI,1)+'°']]);
    if(dist-M<.005){ verd.className='verdict good'; verd.textContent='good — face to face: the joining line runs along w, so Cauchy–Schwarz is an equality and the distance is the width'; }
    else { verd.className='verdict info'; verd.textContent='info — at a slant the two points are '+F(dist-M,3)+' further apart than the width; the gap itself never moved'; } }
  const proj=(x,y,c)=>{ const X=fr.ix(x), Y=fr.iy(y); return (X-Y+c)/2; };   /* the s with (s, c−s) nearest the pointer */
  svgDrag(svg,(x,y)=>{ if(!fr) return false; stopA(); const p=xP(), q=xN(); const dp=Math.hypot(x-fr.px(p[0]),y-fr.py(p[1])), dq=Math.hypot(x-fr.px(q[0]),y-fr.py(q[1]));
      if(Math.min(dp,dq)>34) return false; drag=dp<=dq?'p':'q'; },
    (x,y)=>{ if(drag==='p') sP=Math.max(-.3,Math.min(3.3,proj(x,y,3))); else if(drag==='q') sN=Math.max(-.3,Math.min(7.3,proj(x,y,7))); draw(); },()=>{ drag=null; });
  function stopA(){ if(anim){ anim.stop(); anim=null; } }
  const go=(a,bq,dur)=>{ stopA(); const A0=sP,B0=sN; anim=tween(dur||900,u=>{ sP=A0+(a-A0)*u; sN=B0+(bq-B0)*u; draw(); }); };
  document.getElementById('gp-play').addEventListener('click',()=>{ go(sP,sP+2,1400); });
  document.getElementById('gp-p-slant').addEventListener('click',()=>{ go(2.4,6.2,700); });
  document.getElementById('gp-p-face').addEventListener('click',()=>{ go(1.5,3.5,700); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W4 · RESCALE EVERYTHING; NOTHING MOVES (a slab in ℝ³ and an arrow that stretches) ================= */
(function(){
  const box=document.getElementById('sc-3d'), tbl=document.getElementById('sc-kv'), verd=document.getElementById('sc-verdict'); if(!box) return;
  const SP=[[4,1,1],[1,4,1],[1,1,4]], SN=[[2,0,0],[0,2,0],[0,0,2]], XP=[[3.2,3,2.4],[2.2,4.4,1.8]], XN=[[.3,.2,.4],[.9,.1,.1]];
  const C0=[2,2,2], S=.55, Q=v=>[(v[0]-C0[0])*S,(v[2]-C0[2])*S,-(v[1]-C0[1])*S];       /* math (x₁,x₂,x₃) → three.js, x₃ up */
  let k=1, sc=null, edge=false;
  function build(){ sc=null; const narrow=box.clientWidth<560, r=narrow?9.6:7.6, th=1.0, ph=1.05;
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look:[0,0,0],fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx);
        const n3=new THREE.Vector3(1,1,-1).normalize();                 /* (1,1,1) in three.js coords */
        const planeAt=(s,col,op)=>{ const g=new THREE.Group(); const m=CIN.prim.glass(ctx,2.9,2.9,col,op); g.add(m);
          const fe=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.9,2.9)),new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.7})); g.add(fe);
          g.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n3); g.position.set(...Q([s/3,s/3,s/3])); root.add(g); return g; };
        planeAt(2,hx(K13.edge),isLight?.14:.16); planeAt(6,hx(K13.edge),isLight?.14:.16); planeAt(4,hx('ink2'),isLight?.10:.09);
        const ringAt=(p)=>{ const r=ring3(ctx,.13,{tube:.012}); r.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n3); r.position.set(...Q(p)); root.add(r); };
        SP.forEach(p=>{ root.add(bead3(ctx,Q(p),1,{r:.075})); ringAt(p); }); SN.forEach(p=>{ root.add(bead3(ctx,Q(p),-1,{r:.075})); ringAt(p); });
        XP.forEach(p=>root.add(bead3(ctx,Q(p),1,{r:.065}))); XN.forEach(p=>root.add(bead3(ctx,Q(p),-1,{r:.065})));
        /* axes */
        const ax=[[[0,0,0],[5.2,0,0],'x₁'],[[0,0,0],[0,5.2,0],'x₂'],[[0,0,0],[0,0,5.2],'x₃']];
        ax.forEach(([a,b2,t])=>{ root.add(tube(ctx,Q(a),Q(b2),hx('axis'),.006,.8)); root.add(lab(ctx,t,Q(b2.map(v=>v*1.05)),{size:18,color:cssv('ink-muted'),bg:false,depthTest:false})); });
        const base=Q([4/3,4/3,4/3]);
        const wA=CIN.prim.arrow(ctx,base,[base[0]+.3,base[1]+.3,base[2]-.3],hx(K13.w),{radius:.03,head:.2}); root.add(wA);
        const wl=slot(ctx,root), thl=slot(ctx,root);
        sc={ctx,THREE,wA,wl,thl,base,n3,handle:null}; hint(box,'drag to orbit'); sc.hud=hud(box); paint(); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM||edge) return false; const o=sc.handle.ctx.orbit; o.sph.theta+=.0012; o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; }); }
    return handle; }
  function paint(){ if(!sc) return; const {THREE,wA,wl,thl,base,n3,ctx}=sc; const wn=k*Math.sqrt(3)/2, Lw=.62*wn;
    const tip=new THREE.Vector3(...base).add(n3.clone().multiplyScalar(Lw)); wA.userData.set(new THREE.Vector3(...base),tip);
    wl.set('kw, ‖kw‖ = '+F(wn,3),[tip.x+.12,tip.y+.12,tip.z],{size:17,color:cssv(K13.w),depthTest:false,scale:.0052});
    thl.hide();
    sc.hud.innerHTML='k = <b>'+trim(F(k,2))+'</b> · c = <b>'+trim(F(k,2))+'</b> · ‖w‖ = <b>'+F(wn,3)+'</b> · thickness <b>2.309</b>'; RR(ctx); }
  function draw(){ const wn=k*Math.sqrt(3)/2, h=trim(F(k/2,3));
    kv(tbl,[['w = k·(½, ½, ½)','('+h+', '+h+', '+h+')'],['b = −2k',nm(trim(F(-2*k,3)))],['c (nearest score)','<b>'+trim(F(k,3))+'</b>'],['‖w‖',F(wn,3)],['scores of the six ringed points','±'+trim(F(k,3))],['thickness 2c/‖w‖','<b>'+F(2*k/wn,3)+'</b> = 4/√3'],['canonical (c = 1)?',Math.abs(k-1)<1e-9?'yes':'no']]);
    if(Math.abs(k-1)<1e-9){ verd.className='verdict good'; verd.textContent='good — canonical: the nearest points score exactly ±1 and the thickness is 2/‖w‖ = 2/0.866 = 2.309'; }
    else { verd.className='verdict info'; verd.textContent='info — every number is ×'+trim(F(k,2))+', the slab has not moved: 2c/‖w‖ is still 2.309 (but 2/‖w‖ = '+F(2/wn,3)+' would now be wrong)'; }
    paint(); }
  bindCtl('sc-k',v=>{ k=v; pressOnly(document.getElementById('sc-p1').parentNode,null); draw(); },v=>trim(F(v,2)));
  document.getElementById('sc-p1').addEventListener('click',e=>{ const a=k; pressOnly(e.currentTarget.parentNode,e.currentTarget); tween(700,u=>{ k=a+(1-a)*u; setCtl('sc-k',k,v=>trim(F(v,2))); draw(); },()=>{ k=1; setCtl('sc-k',1,()=>'1'); draw(); }); });
  document.getElementById('sc-p3').addEventListener('click',e=>{ const a=k; pressOnly(e.currentTarget.parentNode,e.currentTarget); tween(900,u=>{ k=a+(3-a)*u; setCtl('sc-k',k,v=>trim(F(v,2))); draw(); },()=>{ k=3; setCtl('sc-k',3,()=>'3'); draw(); }); });
  document.getElementById('sc-edge').addEventListener('click',e=>{ edge=!edge; e.currentTarget.setAttribute('aria-pressed',edge?'true':'false'); e.currentTarget.textContent=edge?'back to 3-D':'look edge-on';
    if(sc&&sc.handle){ const r=box.clientWidth<560?9.6:7.6; camTo(sc.handle,edge?{theta:Math.PI/4,phi:Math.PI/2-.0001,radius:r}:{theta:1.0,phi:1.05,radius:r},1300); } });
  draw();
  const ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
})();

/* ================= W5 · A BOWL, FOUR WALLS, ONE RESTING PLACE (the QP over the w-plane with b fixed) ================= */
(function(){
  const box=document.getElementById('qp-3d'), read=document.getElementById('qp-read'), verd=document.getElementById('qp-verdict'), svg1=document.getElementById('qp-1d'); if(!box) return;
  const X=[[1,2],[2.5,0],[-1,-1],[-1,1]], Y=[1,1,-1,-1], B=-.6, OV=[-1,0];
  const W1=[-1.9,2.3], W2=[-1,1.9], CW=[(W1[0]+W1[1])/2,(W2[0]+W2[1])/2], ZS=.27;
  const Q=(a,b2,h)=>[a-CW[0],(h||0),-(b2-CW[1])];
  let over=false, sc=null, ball=[2,1.2], anim=null, wmin=.8;
  const cons=()=>{ const c=X.map((x,i)=>({a:[Y[i]*x[0],Y[i]*x[1]],r:1-Y[i]*B,y:Y[i],x})); if(over) c.push({a:[OV[0],OV[1]],r:1-B,y:1,x:OV,over:true}); return c; };  /* a·w ≥ r */
  const feas=w=>cons().every(c=>c.a[0]*w[0]+c.a[1]*w[1]>=c.r-1e-9);
  function region(){ let poly=[[W1[0],W2[0]],[W1[1],W2[0]],[W1[1],W2[1]],[W1[0],W2[1]]];
    cons().forEach(c=>{ const out=[]; for(let i=0;i<poly.length;i++){ const A=poly[i],Bq=poly[(i+1)%poly.length],fa=c.a[0]*A[0]+c.a[1]*A[1]-c.r,fb=c.a[0]*Bq[0]+c.a[1]*Bq[1]-c.r; if(fa>=0) out.push(A); if((fa>=0)!==(fb>=0)){ const t=fa/(fa-fb); out.push([A[0]+t*(Bq[0]-A[0]),A[1]+t*(Bq[1]-A[1])]); } } poly=out; });
    return poly; }
  const projW=w=>{ let v=w.slice(); for(let it=0;it<60;it++){ cons().forEach(c=>{ const s=c.a[0]*v[0]+c.a[1]*v[1]-c.r; if(s<0){ const n2=c.a[0]*c.a[0]+c.a[1]*c.a[1]; v=[v[0]-s*c.a[0]/n2,v[1]-s*c.a[1]/n2]; } }); } return v; };
  function path(){ const pts=[ball.slice()]; let w=ball.slice(); for(let i=0;i<140;i++){ w=projW([w[0]-.06*w[0],w[1]-.06*w[1]]); pts.push(w.slice()); } pts.push([.8,.4]); return pts; }
  function build(){ sc=null; const narrow=box.clientWidth<560, r=narrow?9.2:7.0, th=-.7, ph=1.0;
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[.3+r*Math.sin(ph)*Math.sin(th),.45+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look:[.3,.45,0],fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx);
        glassFloor(ctx,5.6,{div:28,y:-.002});
        const f=(a,b2)=>.5*(a*a+b2*b2);
        const bowl=CIN.prim.surface(ctx,f,{x:W1,y:W2,res:80,zscale:ZS,ramp:[ctx.colors.s1,ctx.colors.s7,ctx.colors.s2],opacity:isLight?.34:.26,wire:false}); lightenSurface(ctx,bowl,ZS); root.add(bowl);
        bowl.traverse(m=>{ if(m.material){ m.material.depthWrite=false; } });
        { const cg=new THREE.Group(); cg.position.set(-CW[0],.006,CW[1]); cg.add(liftedContours(ctx,f,[.1,.25,.5,1,1.5,2,3,4],W1[0],W1[1],W2[0],W2[1],ZS,hx('ink2'),{N:90,opacity:isLight?.45:.5})); root.add(cg); }
        /* the allowed patch of the bowl, lit */
        const patch=CIN.prim.surface(ctx,f,{x:W1,y:W2,res:120,zscale:ZS,ramp:[ctx.colors.s3,ctx.colors.s3,ctx.colors.s4],opacity:.92,wire:false}); root.add(patch);
        const vis=fadeAttr(THREE,patch);
        const pos=patch.userData.geo.attributes.position; patch.position.y=.004;
        /* floor: region + lines + axes */
        const regG=new THREE.Group(); root.add(regG);
        const lines=new THREE.Group(); root.add(lines);
        const walls=new THREE.Group(); root.add(walls);
        root.add(tube(ctx,Q(W1[0],0,.003),Q(W1[1],0,.003),hx('axis'),.006,.9)); root.add(tube(ctx,Q(0,W2[0],.003),Q(0,W2[1],.003),hx('axis'),.006,.9));
        root.add(lab(ctx,'w₁',Q(W1[1]+.15,0,.05),{size:18,color:cssv('ink-muted'),bg:false,depthTest:false})); root.add(lab(ctx,'w₂',Q(0,W2[1]+.15,.05),{size:18,color:cssv('ink-muted'),bg:false,depthTest:false}));
        const ballM=overlay(CIN.prim.dot(ctx,[0,0,0],hx('ink'),.07),12), bh=haloSprite(ctx,hx('ink'),.5); root.add(ballM); root.add(bh);
        const star=ring3(ctx,.12,{tube:.014}); star.position.set(...Q(.8,.4,.01)); root.add(star);
        const bl=slot(ctx,root);
        sc={ctx,THREE,hx,patch,vis,pos,regG,lines,walls,ballM,bh,bl,star,handle:null}; hint(box,'drag to orbit'); sc.hud=hud(box); paintScene(); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM||sc.story) return false; const o=sc.handle.ctx.orbit; o.sph.theta=-.7+.15*Math.sin(t*.22); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; }); }
    return handle; }
  function paintScene(){ if(!sc) return; const {THREE,hx,patch,vis,pos,regG,lines,walls,ctx,star}=sc;
    for(let i=0;i<pos.count;i++){ const a=pos.getX(i)+CW[0], b2=-pos.getZ(i)+CW[1]; vis.setX(i,feas([a,b2])?1:0); } vis.needsUpdate=true;
    clearGroup(regG); clearGroup(lines); clearGroup(walls);
    const P=region(); if(P.length>=3){ const sh=new THREE.Shape(P.map(p=>new THREE.Vector2(p[0]-CW[0],p[1]-CW[1]))); const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:hx(K13.w),transparent:true,opacity:ctx.isLight?.22:.28,depthWrite:false,side:THREE.DoubleSide})); m.rotation.x=-Math.PI/2; m.position.y=.006; regG.add(m); }
    cons().forEach(c=>{ const fake={X0:W1[0],X1:W1[1],Y0:W2[0],Y1:W2[1]}; const s=lineInBox(c.a,-c.r,0,fake); if(!s) return; const col=c.over?critHex():hx(classKey(c.y));
      lines.add(tube(ctx,Q(s[0][0],s[0][1],.01),Q(s[1][0],s[1][1],.01),col,.012,.95));
      const active=!c.over&&Math.abs(c.a[0]*.8+c.a[1]*.4-c.r)<1e-9;
      if(active||c.over){ const A=Q(s[0][0],s[0][1],0), Bq=Q(s[1][0],s[1][1],0), dx=Bq[0]-A[0], dz=Bq[2]-A[2], Lw=Math.hypot(dx,dz);
        const wall=CIN.prim.glass(ctx,Lw,1.0,col,ctx.isLight?.13:.15); wall.position.set((A[0]+Bq[0])/2,.5,(A[2]+Bq[2])/2); wall.rotation.y=-Math.atan2(dz,dx); walls.add(wall); }
      const end=s[0][0]>s[1][0]?s[0]:s[1], other=end===s[0]?s[1]:s[0], at=[end[0]*.86+other[0]*.14,end[1]*.86+other[1]*.14]; const t0=c.over?'blue (−1, 0)':(c.y>0?'blue ':'orange ')+'('+c.x.map(v=>nm(String(v))).join(', ')+')';
      walls.add(lab(ctx,t0,Q(at[0],at[1],.14),{size:15,color:c.over?cssv('critical'):cssv(classKey(c.y)),depthTest:false,scale:.006})); });
    star.visible=!over; setBall(ball); }
  function setBall(w){ if(!sc) return; ball=w; const h=.5*(w[0]*w[0]+w[1]*w[1])*ZS; sc.ballM.position.set(...Q(w[0],w[1],h+.07)); sc.bh.position.set(...Q(w[0],w[1],h+.07)); sc.ballM.visible=!over; sc.bh.visible=!over;
    sc.bl.set(over?'':'½‖w‖² = '+F(.5*(w[0]*w[0]+w[1]*w[1]),3),Q(w[0],w[1],h+.34),{size:16,color:cssv('ink'),depthTest:false,scale:.005});
    sc.hud.innerHTML=over?'no w clears every wall — the problem has <b>no answer</b>':'w = <b>'+vecS(w,2)+'</b> · ½‖w‖² = <b>'+F(.5*(w[0]*w[0]+w[1]*w[1]),3)+'</b>'; RR(sc.ctx); }
  function draw(){ const at=Math.hypot(ball[0]-.8,ball[1]-.4)<1e-6;
    if(over){ read.innerHTML='a fifth point, blue (−1, 0), sits between the two orange points<br>its wall: −w₁ − 0.6 ≥ 1, i.e. <b>w₁ ≤ −1.6</b><br>but the orange walls need w₁ ± w₂ ≥ 0.4, so <b>w₁ ≥ 0.4</b>'; verd.className='verdict bad'; verd.textContent='bad — the allowed region is empty: no line (for any b) clears every point, so the hard margin has no answer at all'; return; }
    read.innerHTML='ball at w = <b>'+vecS(ball,3)+'</b> · ½‖w‖² = <b>'+F(.5*(ball[0]**2+ball[1]**2),3)+'</b><br>the answer: w = (0.8, 0.4), b = −0.6, ½‖w‖² = <b>0.4</b>, width 2/‖w‖ = √5 ≈ <b>2.236</b><br>walls touching it: <span class="k-pos">(1, 2)</span> and <span class="k-neg">(−1, 1)</span>';
    if(at){ verd.className='verdict good'; verd.textContent='good — the lowest allowed point sits in the corner of two walls: those two points are the support vectors'; }
    else { verd.className='verdict info'; verd.textContent='info — any allowed w is a valid street; the lowest one is the widest'; } }
  function stop(){ if(anim){ anim.stop(); anim=null; } if(sc) sc.story=false; }
  document.getElementById('qp-play').addEventListener('click',()=>{ stop(); if(over) return; const pts=path(); ball=[2,1.2]; if(sc) sc.story=true;
    if(RM){ setBall([.8,.4]); draw(); if(sc) sc.story=false; return; }
    anim=tween(3200,u=>{ const f=u*(pts.length-1), i=Math.floor(f), v=f-i, a=pts[i], b2=pts[Math.min(i+1,pts.length-1)]; setBall([a[0]+(b2[0]-a[0])*v,a[1]+(b2[1]-a[1])*v]); draw(); },()=>{ setBall([.8,.4]); draw(); if(sc){ sc.story=false; flare(sc.ctx,Q(.8,.4,.3*ZS+.1),sc.hx(K13.sv),900,1.2); } }); });
  document.getElementById('qp-over').addEventListener('click',e=>{ stop(); over=!over; e.currentTarget.setAttribute('aria-pressed',over?'true':'false'); e.currentTarget.textContent=over?'remove the overlapping point':'add an overlapping point';
    if(!over) ball=[.8,.4]; paintScene(); draw(); if(over&&sc) sparks(sc.ctx,Q(-1.6,.4,.3),critHex(),10,800); });
  /* the 1-D comparison */
  function draw1(){ const fr=frame(svg1,-3,3,0,5,{l:26,r:8,t:10,b:24,xs:1,ys:1}); const g=el('g',{'clip-path':fr.clip},svg1);
    el('rect',{x:fr.px(-3),y:fr.py(5),width:fr.px(wmin)-fr.px(-3),height:fr.py(0)-fr.py(5),fill:hatchPat(svg1,'qp1h',cvar('critical'),.35)},g);
    const cur=(fn,col,dash)=>{ let d=''; for(let i=0;i<=240;i++){ const x=-3+6*i/240; const v=fn(x); if(!isFinite(v)||v>6){ d+=' '; continue; } d+=(d&&!d.endsWith(' ')?'L':'M')+fr.px(x).toFixed(1)+','+fr.py(v).toFixed(1); } glowPath(g,d.replace(/ +/g,' ').trim(),col,2.2,!isLight(),dash?{'stroke-dasharray':dash}:null); };
    cur(x=>Math.abs(x),'var(--ink-2)'); cur(x=>.5*x*x,cvar(K13.w)); cur(x=>Math.abs(x)<1e-6?Infinity:2/Math.abs(x),cvar(K13.edge),'6 4');
    [[Math.abs(wmin),'var(--ink-2)'],[.5*wmin*wmin,cvar(K13.w)],[2/wmin,cvar(K13.edge)]].forEach(([v,c])=>{ if(v<=5) el('circle',{cx:fr.px(wmin),cy:fr.py(v),r:4.5,fill:c,stroke:'var(--page)','stroke-width':1.2},svg1); });
    el('line',{x1:fr.px(wmin),y1:fr.py(0),x2:fr.px(wmin),y2:fr.py(5),stroke:cvar(K13.sv),'stroke-width':1.6},svg1);
    txt(svg1,fr.px(2.75),fr.py(2.2),'‖w‖','font:700 10px Inter,system-ui;fill:var(--ink-2)','middle'); txt(svg1,fr.px(1.75),fr.py(2.55),'½‖w‖²','font:700 10px Inter,system-ui;fill:var(--s3)','middle');
    txt(svg1,fr.px(2.4),fr.py(1.15),'2/‖w‖','font:700 10px Inter,system-ui;fill:var(--s7)','middle'); txt(svg1,fr.px(0)+4,fr.py(.25),'kink','font:600 9px Inter,system-ui;fill:var(--ink-muted)');
    txt(svg1,fr.px(-3)+4,fr.py(5)+12,'not allowed','font:700 9px Inter,system-ui;fill:var(--critical)'); }
  bindCtl('qp-wmin',v=>{ wmin=v; draw1(); },v=>trim(F(v,2)));
  draw(); draw1(); new MutationObserver(draw1).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
})();
