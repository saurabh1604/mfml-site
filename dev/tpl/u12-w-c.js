/* ================= UNIT 12 · widgets, part C: §8–§11 ================= */

/* ================= W9 · THE SCREE PLOT AND THREE RULES ================= */
(function(){
  const box=document.getElementById('w-scree'); if(!box) return;
  const svg=document.getElementById('sc-svg'), rules=document.getElementById('sc-rules'), read=document.getElementById('sc-read');
  const SETS={'sc-five':{l:[4.5,2.1,0.9,0.4,0.1],std:false,name:'the practice-set eigenvalues'},
              'sc-svd':{l:[4,1,.25,.01],std:false,name:'σ = 20, 10, 5, 1 with N = 100, so λ = σ²/N'},
              'sc-noisy':{l:[6.0,3.1,0.62,0.55,0.5,0.47,0.43,0.4,0.38,0.35],std:false,name:'two real directions and a long tail of noise'},
              'sc-std':{l:[2.9,1.5,0.8,0.4,0.25,0.15],std:true,name:'six standardised features (each column contributes exactly 1)'}};
  let cur='sc-five', logS=false, target=90;
  const rulesOf=l=>{ const tot=l.reduce((a,b)=>a+b,0), cum=[]; l.reduce((a,b,i)=>(cum[i]=a+b,a+b),0);
    const Mt=cum.findIndex(c=>c/tot*100>=target-1e-9)+1;
    const n=l.length, lo=Math.min(...l), hi=Math.max(...l); let knee=1,best=-1; l.forEach((v,i)=>{ const xn=i/(n-1), yn=(v-lo)/((hi-lo)||1), d=(1-xn)-yn; if(d>best+1e-12){ best=d; knee=i+1; } });
    return {tot,cum,Mt,Me:Math.max(1,knee-1),knee,Mk:l.filter(v=>v>1).length}; };
  function draw(){ const S=SETS[cur], l=S.l, R=rulesOf(l), n=l.length, sh=l.map(v=>v/R.tot*100), NAR=respVB(svg,'0 0 760 320','0 0 420 330');
    const f=frame(svg,.4,n+.6,logS?-1:0,logS?2:100,{l:44,r:48,t:24,b:44,ys:logS?1:20,yf:v=>logS?(v===0?'1%':v===1?'10%':v===2?'100%':'0.1%'):v+'%',axes:false});
    const gl=f.glow, bw=Math.min(46,(f.px(2)-f.px(1))*.62), y=v=>logS?f.py(Math.log10(Math.max(v,.1))):f.py(v);
    /* target line */
    el('line',{x1:f.px(.4),x2:f.px(n+.6),y1:y(target),y2:y(target),stroke:'var(--s4)','stroke-width':1.4,'stroke-dasharray':'5 4'},svg);
    txt(svg,f.px(n+.6)+4,y(target)+4,target+'%','font:700 10.5px system-ui;fill:var(--s4)');
    sh.forEach((v,i)=>{ const kept=i<R.Mt; const r=el('rect',{x:f.px(i+1)-bw/2,y:y(v),width:bw,height:Math.max(1.5,y(logS?.1:0)-y(v)),rx:5,fill:kept?'var(--s2)':'var(--s1)',opacity:kept?.95:.38},svg); if(kept&&gl) r.setAttribute('filter',gl);
      txt(svg,f.px(i+1),y(v)-6,F(l[i],l[i]<.1?2:(l[i]<1?2:1)),'font:700 10.5px system-ui;fill:var(--ink-2)','middle');
      txt(svg,f.px(i+1),f.H-f.B+14,'PC'+(i+1),'font:600 10px system-ui;fill:var(--ink-muted)','middle'); });
    /* running total */
    let d=''; R.cum.forEach((c,i)=>{ d+=(i?'L':'M')+f.px(i+1).toFixed(1)+' '+y(c/R.tot*100).toFixed(1); }); glowPath(svg,d,'var(--s3)',2.2,gl);
    R.cum.forEach((c,i)=>{ glowDot(svg,f.px(i+1),y(c/R.tot*100),3.6,'var(--s3)',null); if(i===R.Mt-1) txt(svg,f.px(i+1)-9,y(c/R.tot*100)-9,F(c/R.tot*100,2)+'%','font:800 11.5px system-ui;fill:var(--s3)','end'); });
    /* the elbow */
    const kx=f.px(R.knee), ky=f.H-f.B+28; el('path',{d:`M${kx} ${ky-8} l5 7 h-10 z`,fill:'var(--s7)'},svg);
    txt(svg,kx+9,ky,'the bend','font:700 10px system-ui;fill:var(--s7)');
    txt(svg,f.L,14,NAR?'share per component · running total':'share of the spread per component (bars) and running total (line)'+(logS?' · log scale':''),'font:700 11px system-ui;fill:var(--ink-muted)');
    rules.innerHTML='<div class="rc"><span class="rn">target '+target+'%</span><b class="m">M = '+R.Mt+'</b>keeps '+F(R.cum[R.Mt-1]/R.tot*100,2)+'%'+(R.Mt>1?'; '+(R.Mt-1)+' would keep '+F(R.cum[R.Mt-2]/R.tot*100,2)+'%':'')+'</div>'+
      '<div class="rc"><span class="rn">the elbow</span><b class="m">M = '+R.Me+'</b>the scree bends at PC'+R.knee+'; keep the bars before the bend</div>'+
      '<div class="rc'+(S.std?'':' na')+'"><span class="rn">Kaiser: keep λ &gt; 1</span><b class="m">'+(S.std?'M = '+R.Mk:'('+R.Mk+')')+'</b>'+(S.std?'each column is worth exactly 1 here, so λ &gt; 1 means "worth more than one column"':'not fair here — the columns were not standardised, so "1" means nothing')+'</div>';
    read.innerHTML=S.name+' · total spread <b>'+F(R.tot,2)+'</b> = tr(C)<br>running totals: '+R.cum.map((c,i)=>'<b>'+F(c/R.tot*100,2)+'%</b>').join(' → '); }
  Object.keys(SETS).forEach(id=>document.getElementById(id).addEventListener('click',()=>{ cur=id; setPressed(Object.keys(SETS),id); draw(); }));
  document.getElementById('sc-log').addEventListener('click',e=>{ logS=!logS; e.currentTarget.setAttribute('aria-pressed',logS?'true':'false'); draw(); });
  bindCtl('sc-target',v=>{ target=v; draw(); },v=>v+' %');
  onWidth(draw); draw();
})();

/* ================= W10 · THE SEESAW: KEPT AGAINST LOST (2-D line / 3-D plane) ================= */
(function(){
  const box=document.getElementById('w-rebuild'); if(!box) return;
  const svg=document.getElementById('rb-svg'), bar=document.getElementById('rb-bar'), bar3=document.getElementById('rb-bar3'), read=document.getElementById('rb-read'), stage=document.getElementById('rb-3d');
  const th1=35*DEG, C2=fromEig([4.2,0.8],[[Math.cos(th1),Math.sin(th1)],[-Math.sin(th1),Math.cos(th1)]]), PTS=cloudExact(60,C2,515), TOT2=5.0;
  let ang=100, tab='line', anim=null, P=null;
  function drawBar(b,kept,tot,best){ b.innerHTML=''; const x0=14,W=292,y0=46,h=30, kw=W*kept/tot, gl=glo(b,2);
    txt(b,x0,20,'one fixed total = '+F(tot,2),'font:700 11.5px system-ui;fill:var(--ink)');
    el('rect',{x:x0,y:y0,width:W,height:h,rx:8,fill:'color-mix(in srgb,var(--ink) 8%,transparent)'},b);
    el('rect',{x:x0,y:y0,width:Math.max(0,kw),height:h,rx:8,fill:'var(--s1)',filter:gl||null},b);
    el('rect',{x:x0+kw,y:y0,width:Math.max(0,W-kw),height:h,rx:8,fill:'var(--critical)',opacity:.85},b);
    txt(b,x0+4,y0+h+18,'kept '+F(kept,3),'font:800 12px system-ui;fill:var(--s1)'); txt(b,x0+W-4,y0+h+18,'lost '+F(tot-kept,3),'font:800 12px system-ui;fill:var(--critical)','end');
    txt(b,x0+W/2,y0+h+38,best?'the least lost = the most kept':'turn to shrink the red part','font:600 10.5px system-ui;fill:'+(best?'var(--s3)':'var(--ink-muted)'),'middle'); }
  function draw2(){ const t=ang*DEG, d=[Math.cos(t),Math.sin(t)], E=eig2(C2[0][0],C2[0][1],C2[1][1]), kept=qf2(C2,t), lost=TOT2-kept, best=Math.abs(kept-E.l1)<1e-3;
    respVB(svg,'0 0 560 420','0 0 420 400'); P=eqFrame(svg,5,{step:1}); const {px,py,glow:gl}=P, Ly=P.layer;
    glowLine(Ly,px(-d[0]*9),py(-d[1]*9),px(d[0]*9),py(d[1]*9),'var(--s2)',2,gl);
    const gT=el('g',{},Ly), gP=el('g',{},Ly), gF=el('g',{},Ly);
    PTS.forEach(p=>{ const s=dot(p,d), f=[d[0]*s,d[1]*s]; el('line',{x1:px(p[0]),y1:py(p[1]),x2:px(f[0]),y2:py(f[1]),stroke:'var(--critical)','stroke-width':1.4,opacity:.8},gT);
      el('circle',{cx:px(p[0]),cy:py(p[1]),r:3.8,fill:'var(--s1)'},gP); el('circle',{cx:px(f[0]),cy:py(f[1]),r:2.4,fill:'var(--s4)',opacity:.9},gF); });
    if(gl){ gP.setAttribute('filter',gl); gT.setAttribute('filter',gl); }
    const tip=[d[0]*4.3,d[1]*4.3]; const g=el('g',{},svg); el('circle',{cx:px(tip[0]),cy:py(tip[1]),r:14,fill:'var(--s2)',opacity:.2},g); el('circle',{cx:px(tip[0]),cy:py(tip[1]),r:7.5,fill:'var(--s2)',stroke:'var(--page)','stroke-width':2},g);
    drawBar(bar,kept,TOT2,best);
    read.innerHTML='line at <b>'+F(ang,1)+'°</b> · kept (spread along the line) <b>'+F(kept,3)+'</b> + lost (average squared thread) <b>'+F(lost,3)+'</b> = <b>'+F(TOT2,3)+'</b>'+
      '<br>best line: '+F(((E.th/DEG)%180+180)%180,1)+'°, keeps <b>λ₁ = '+F(E.l1,2)+'</b> and loses <b>λ₂ = '+F(E.l2,2)+'</b>'+(best?' — <b style="color:var(--s3)">you are on it</b>':''); }
  const setAng=v=>{ ang=((v%180)+180)%180; setRange('rb-ang',ang,v=>F(v,1)+'°'); draw2(); };
  bindCtl('rb-ang',v=>{ ang=v; draw2(); },v=>F(v,1)+'°');
  svgDrag(svg,()=>{ if(!P) return false; if(anim){ anim.stop(); anim=null; } },(x,y)=>{ const X=P.ix(x),Y=P.iy(y); if(Math.hypot(X,Y)<.3) return; setAng(Math.atan2(Y,X)/DEG); });
  document.getElementById('rb-best').addEventListener('click',()=>{ if(anim){ anim.stop(); anim=null; } const E=eig2(C2[0][0],C2[0][1],C2[1][1]), a0=ang; let t=E.th/DEG; while(t-a0>90) t-=180; while(a0-t>90) t+=180; anim=tween(1400,e=>setAng(a0+(t-a0)*e),()=>{ anim=null; }); });
  /* ---- the 3-D plane ---- */
  const LAM3=[6,2.5,.5], q1=unit([1,.25,-.4]), q2=unit((()=>{ const t=[.3,.35,1]; const d=dot(t,q1); return t.map((v,i)=>v-d*q1[i]); })()), q3=[q1[1]*q2[2]-q1[2]*q2[1],q1[2]*q2[0]-q1[0]*q2[2],q1[0]*q2[1]-q1[1]*q2[0]];
  const C3=fromEig(LAM3,[q1,q2,q3]), P3=cloudExact(160,C3,616), TOT3=9, K=.34;
  let yaw=120, pitch=45, sc=null, anim3=null;
  const normal=()=>{ const y=yaw*DEG, p=pitch*DEG; return [Math.sin(p)*Math.cos(y),Math.cos(p),Math.sin(p)*Math.sin(y)]; };
  /* the normal of the best plane is PC3; write it as (turn, tilt) with turn in [0, 180) and tilt in [−90, 90] */
  const n3=(()=>{ const v=q3[1]<0?q3.map(x=>-x):q3; let y=Math.atan2(v[2],v[0])/DEG, p=Math.acos(Math.min(1,v[1]))/DEG; if(y<0){ y+=180; p=-p; } return {yaw:y,pitch:p}; })();
  function build(){ sc=null;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:[3.4,2.5,4.2],look:[0,0,0],fov:36},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){ const {root,isLight}=ctx, hx=hxOf(ctx);
        const cloud=glowCloud(ctx,P3.map(p=>p.map(v=>v*K)),hx('s1'),isLight?.13:.16); root.add(cloud);
        const feet=glowCloud(ctx,P3.map(p=>p.map(v=>v*K)),hx('s4'),isLight?.08:.1,.95); root.add(feet);
        const threads=segs(ctx,P3.length,hx('critical'),isLight?.7:.75); root.add(threads);
        const glass=glassPlane(ctx,hx('s2'),3.0,isLight?.12:.09); root.add(glass);
        sc={ctx,feet,threads,glass}; hint(stage,'drag to orbit'); place3(); },
      update(){ return false; } });
    if(handle&&sc) sc.handle=handle; return handle; }
  function place3(){ let n=unit(normal()); const kept=TOT3-dot(n,matVec(C3,n)), best=Math.abs(TOT3-kept-LAM3[2])<1e-3;
    if(sc){ const {ctx,feet,threads,glass}=sc; const A=P3.map(p=>p.map(v=>v*K)), B=A.map(p=>{ const s=dot(p,n); return [p[0]-n[0]*s,p[1]-n[1]*s,p[2]-n[2]*s]; });
      feet.userData.set(B); threads.userData.set(A,B);
      const a=unit(Math.abs(n[1])<.95?[n[2],0,-n[0]]:[1,0,0]), b=[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]]; glass.userData.orient(a,b); RR(ctx); }
    drawBar(bar3,kept,TOT3,best);
    if(tab==='plane') read.innerHTML='plane: turn <b>'+Math.round(yaw)+'°</b>, tilt <b>'+Math.round(pitch)+'°</b> · kept <b>'+F(kept,3)+'</b> + lost <b>'+F(TOT3-kept,3)+'</b> = <b>'+F(TOT3,2)+'</b><br>the best plane (through PC1 and PC2) keeps <b>λ₁ + λ₂ = '+F(LAM3[0]+LAM3[1],2)+'</b> and loses only <b>λ₃ = '+F(LAM3[2],2)+'</b>'+(best?' — <b style="color:var(--s3)">you are on it</b>':''); }
  bindCtl('rb-yaw',v=>{ yaw=v; place3(); },v=>v+'°'); bindCtl('rb-pitch',v=>{ pitch=v; place3(); },v=>v+'°');
  document.getElementById('rb-best3').addEventListener('click',()=>{ if(anim3){ anim3.stop(); anim3=null; } const y0=yaw,p0=pitch; let ty=n3.yaw; while(ty-y0>90) ty-=180; while(y0-ty>90) ty+=180;
    anim3=tween(1500,e=>{ yaw=((y0+(ty-y0)*e)%180+180)%180; pitch=p0+(n3.pitch-p0)*e; setRange('rb-yaw',Math.round(yaw),v=>v+'°'); setRange('rb-pitch',Math.round(pitch),v=>v+'°'); place3(); },
      ()=>{ anim3=null; yaw=n3.yaw; pitch=n3.pitch; place3(); }); });
  tabs(document.getElementById('rb-tabs'),t=>{ tab=t; showPane(box,t); if(t==='line') draw2(); else { if(!S3) S3=mountStage(stage,build); else remount(S3); place3(); } });
  let S3=null; onWidth(()=>{ if(tab==='line') draw2(); }); draw2(); drawBar(bar3,TOT3-dot(unit(normal()),matVec(C3,unit(normal()))),TOT3,false);
})();

/* ================= W11 · TWINS NO MORE (rotate to uncorrelated scores; loadings) ================= */
(function(){
  const box=document.getElementById('w-decor'); if(!box) return;
  const svg=document.getElementById('dc-svg'), read=document.getElementById('dc-read'), load=document.getElementById('dc-load'), read3=document.getElementById('dc-read3'), stage=document.getElementById('dc-3d');
  const C2=[[4,3.12],[3.12,4]], PTS=cloudExact(90,C2,778), E=eig2(4,3.12,4);
  let tt=0, anim=null, flip=1, sc=null;
  const corr=Q=>{ const {C}=covOf(Q); return C[0][1]/Math.sqrt(C[0][0]*C[1][1]); };
  function draw(){ const a=-E.th*tt, c=Math.cos(a), s=Math.sin(a), R=p=>[c*p[0]-s*p[1],s*p[0]+c*p[1]], Q=PTS.map(R);
    respVB(svg,'0 0 560 420','0 0 420 400'); const P=eqFrame(svg,5.6,{step:1}); const {px,py,glow:gl}=P;
    const g=el('g',{},P.layer); Q.forEach(p=>el('circle',{cx:px(p[0]),cy:py(p[1]),r:3.6,fill:'var(--s1)',opacity:.9},g)); if(gl) g.setAttribute('filter',gl);
    const d1=R([Math.cos(E.th),Math.sin(E.th)]), d2=R([-Math.sin(E.th),Math.cos(E.th)]), L1=Math.sqrt(E.l1)*1.9, L2=Math.sqrt(E.l2)*1.9;
    svgArrow(svg,px(0),py(0),px(d1[0]*L1),py(d1[1]*L1),'var(--s2)',3,gl); svgArrow(svg,px(0),py(0),px(d2[0]*L2),py(d2[1]*L2),'var(--s3)',2.6,gl);
    txt(svg,px(d1[0]*L1)+6,py(d1[1]*L1)-6,'PC1','font:800 12px system-ui;fill:var(--s2)'); txt(svg,px(d2[0]*L2)+6,py(d2[1]*L2)-6,'PC2','font:800 12px system-ui;fill:var(--s3)');
    txt(svg,P.box[0]+P.box[2]-8,py(0)-8,tt>.98?'PC1 score':'x₁','font:700 11px system-ui;fill:var(--ink-muted)','end'); txt(svg,px(0)+8,P.box[1]+16,tt>.98?'PC2 score':'x₂','font:700 11px system-ui;fill:var(--ink-muted)');
    const r=corr(Q), {C}=covOf(Q);
    read.innerHTML='correlation of the two columns: <b style="font-size:1.15em;color:'+(Math.abs(r)<.005?'var(--s3)':'var(--ink)')+'">'+F(r,2)+'</b><br>covariance matrix: <b>[['+F(C[0][0],2)+', '+F(C[0][1],2)+'], ['+F(C[1][0],2)+', '+F(C[1][1],2)+']]</b>'+(tt>.98?'<br>= diag(λ₁, λ₂) = diag('+F(E.l1,2)+', '+F(E.l2,2)+') — the scores never echo each other':''); }
  bindCtl('dc-t',v=>{ tt=v; draw(); },v=>Math.round(v*100)+' %'); onWidth(draw);
  document.getElementById('dc-play').addEventListener('click',()=>{ if(anim) anim.stop(); const t0=tt>.98?0:tt; anim=tween(1800,e=>{ tt=t0+(1-t0)*e; setRange('dc-t',tt,v=>Math.round(v*100)+' %'); draw(); },()=>{ anim=null; }); });
  /* ---- three columns: loadings ---- */
  const NAMES=['age','experience','certifications'], V1=[6/7,3/7,2/7], V2=[-1/Math.sqrt(5),2/Math.sqrt(5),0], V3=unit([-4,-2,15]);
  const C3=fromEig([9,3,.5],[V1,V2,V3]), P3=cloudExact(220,C3,31337), Kc=.3;
  const toT=v=>[v[0],v[2],-v[1]];                 /* age → x, certifications → up, experience → toward the back */
  function build(){ sc=null;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:[2.5,2.1,3.7],look:[.3,.35,-.3],fov:40},autoRotate:.08,autoRotateStopsOnUser:true,
      build(ctx){ const {root,colors,isLight}=ctx, hx=hxOf(ctx);
        root.add(glowCloud(ctx,P3.map(p=>toT(p).map(v=>v*Kc)),hx('s1'),isLight?.08:.1,isLight?.45:.5));
        const AXL=1.75; [[1,0,0],[0,1,0],[0,0,1]].forEach((e,i)=>{ const a=toT(e); root.add(CIN.prim.path(ctx,[a.map(v=>-v*AXL),a.map(v=>v*AXL)],hx('ink2'),{opacity:.55}));
          root.add(lab(ctx,NAMES[i],a.map(v=>v*(AXL+.22)),{size:15,color:colors.ink2,depthTest:false,scale:.0058})); });
        const grp=new ctx.THREE.Group(); root.add(grp);
        sc={ctx,grp,colors,hx}; hint(stage,'drag to orbit'); paint3(); },
      update(){ return false; } });
    if(handle&&sc) sc.handle=handle; return handle; }
  function paint3(){ const W1=V1.map(v=>v*flip), W2=V2.map(v=>v*flip);
    if(sc){ const {ctx,grp,colors,hx}=sc; clearGroup(grp); const L=1.7;
      /* each component as a recipe: walk its loading along age, then along experience, then up certifications — you arrive at the arrow's tip */
      [[W1,'s2','PC1'],[W2,'s3','PC2']].forEach(([w,c,n])=>{ const tip=toT(w).map(v=>v*L); grp.add(overlay(CIN.prim.arrow(ctx,[0,0,0],tip,hx(c),{radius:.022,head:.15}),8));
        grp.add(lab(ctx,n,tip.map(v=>v*1.12),{size:15,color:colors[c],depthTest:false,scale:.0056}));
        let at=[0,0,0]; [0,1,2].forEach(i=>{ if(Math.abs(w[i])<1e-9) return; const e=[0,0,0]; e[i]=w[i]; const step=toT(e).map(v=>v*L), nx=at.map((v,j)=>v+step[j]);
          grp.add(overlay(tube(ctx,at,nx,hx(c),.011,.55),7)); grp.add(overlay(CIN.prim.dot(ctx,nx,hx(c),.028),8));
          const mid=at.map((v,j)=>(v+nx[j])/2); grp.add(lab(ctx,(w[i]<0?'−':'')+Math.abs(w[i]).toFixed(2),[mid[0],mid[1]+.09,mid[2]],{size:12,color:colors[c],depthTest:false,scale:.0044})); at=nx; }); });
      RR(ctx); }
    /* the bars */
    const f=frame(load,-.5,2.5,-1,1,{l:34,r:8,t:24,b:30,ys:.5,axes:true}); const gl=f.glow, bw=(f.px(1)-f.px(0))*.26;
    NAMES.forEach((n,i)=>{ [[W1[i],'s2',-1],[W2[i],'s3',1]].forEach(([v,c,o])=>{ const x=f.px(i)+o*bw*.6, y0=f.py(0), y1=f.py(v);
        const r=el('rect',{x:x-bw/2,y:Math.min(y0,y1),width:bw,height:Math.max(1.2,Math.abs(y1-y0)),rx:4,fill:CV(c)},load); if(gl) r.setAttribute('filter',gl);
        txt(load,x,v>=0?y1-5:y1+13,F(v,2),'font:700 10px system-ui;fill:var(--ink-2)','middle'); });
      txt(load,f.px(i),f.H-f.B+15,n,'font:600 10.5px system-ui;fill:var(--ink-2)','middle'); });
    txt(load,f.L,14,'loadings: PC1 (orange) and PC2 (green)','font:700 11px system-ui;fill:var(--ink-muted)');
    const term=(w,i)=>(i?(w<0?' − ':' + '):(w<0?'−':''))+F(Math.abs(w),2)+'·'+NAMES[i];
    read3.innerHTML='z₁ = '+W1.map(term).join('')+'<br>z₂ = '+W2.map((w,i)=>w===0?'':term(w,i)).join('').replace(/^ \+ /,'')+
      '<br>checks: |w₁|² = <b>'+F(dot(W1,W1),3)+'</b>, |w₂|² = <b>'+F(dot(W2,W2),3)+'</b>, w₁·w₂ = <b>'+F(dot(W1,W2),3)+'</b>'+(flip<0?'<br><span style="color:var(--ink-muted)">signs flipped: same directions, same meaning, same spreads</span>':''); }
  document.getElementById('dc-flip').addEventListener('click',e=>{ flip=-flip; e.currentTarget.setAttribute('aria-pressed',flip<0?'true':'false'); paint3(); });
  let S3=null;
  tabs(document.getElementById('dc-tabs'),t=>{ showPane(box,t); if(t==='three'){ if(!S3) S3=mountStage(stage,build); else remount(S3); paint3(); } else draw(); });
  draw(); paint3();
})();

/* ================= W12 · KEEP THE BIGGEST LAYERS (a drawn picture; a 3-D cloud) ================= */
(function(){
  const box=document.getElementById('w-eckart'); if(!box) return;
  const cvO=document.getElementById('ek-orig'), cvR=document.getElementById('ek-rebuilt'), svS=document.getElementById('ek-sv'), read=document.getElementById('ek-read'), read2=document.getElementById('ek-read2'), cap2=document.getElementById('ek-cap2'), stage=document.getElementById('ek-3d');
  const H=64, W=96;
  /* a drawn village scene — sky, sun, two hills, a hut, a tree, a path — rasterised to a 64 × 96 grid of greys */
  function scene(){ const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d');
    const sky=g.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#2a3350'); sky.addColorStop(.62,'#8c95ad'); sky.addColorStop(1,'#b7bccb'); g.fillStyle=sky; g.fillRect(0,0,W,H);
    g.fillStyle='#f4f1e6'; g.beginPath(); g.arc(70,15,7.5,0,7); g.fill(); g.fillStyle='rgba(244,241,230,.25)'; g.beginPath(); g.arc(70,15,11,0,7); g.fill();
    g.fillStyle='#5a6072'; g.beginPath(); g.moveTo(0,44); for(let x=0;x<=W;x++) g.lineTo(x,40-9*Math.sin((x+6)/W*Math.PI*1.15)); g.lineTo(W,H); g.lineTo(0,H); g.fill();
    g.fillStyle='#3b3f4d'; g.beginPath(); g.moveTo(0,H); for(let x=0;x<=W;x++) g.lineTo(x,50-6*Math.sin((x-30)/W*Math.PI*1.6)); g.lineTo(W,H); g.fill();
    g.fillStyle='#c9c2b0'; g.beginPath(); g.moveTo(40,H); g.quadraticCurveTo(52,53,60,47); g.lineTo(63,47); g.quadraticCurveTo(58,55,52,H); g.fill();
    g.fillStyle='#d8d2c2'; g.fillRect(62,37,15,10); g.fillStyle='#262a36'; g.beginPath(); g.moveTo(60,38); g.lineTo(69.5,30); g.lineTo(79,38); g.fill(); g.fillStyle='#262a36'; g.fillRect(67.5,41,4,6);
    g.fillStyle='#232633'; g.fillRect(20,32,3,15); g.fillStyle='#1b1e29'; g.beginPath(); g.arc(21.5,28,8.5,0,7); g.fill(); g.beginPath(); g.arc(16.5,31,5.5,0,7); g.fill(); g.beginPath(); g.arc(26.5,31,5.5,0,7); g.fill();
    const d=g.getImageData(0,0,W,H).data, A=[]; for(let i=0;i<H;i++){ const r=[]; for(let j=0;j<W;j++){ const k=4*(i*W+j); r.push((.299*d[k]+.587*d[k+1]+.114*d[k+2])/255); } A.push(r); } return A; }
  let A=null, SV=null, k=6, rank=2, sc=null;
  function svd(){ if(SV) return SV; A=scene(); const AAt=matMul(A,matT(A)), es=eigSym(AAt);
    const sig=es.vals.map(v=>Math.sqrt(Math.max(v,0))), U=es.vecs, At=matT(A);
    const V=U.map((u,i)=>sig[i]>1e-9?matVec(At,u).map(x=>x/sig[i]):new Array(W).fill(0));
    SV={sig,U,V}; return SV; }
  function paintCanvas(cv,M){ const g=cv.getContext('2d'), im=g.createImageData(W,H);
    for(let i=0;i<H;i++) for(let j=0;j<W;j++){ const v=Math.max(0,Math.min(1,M[i][j]))*255, k4=4*(i*W+j); im.data[k4]=im.data[k4+1]=im.data[k4+2]=v; im.data[k4+3]=255; }
    const t=document.createElement('canvas'); t.width=W; t.height=H; t.getContext('2d').putImageData(im,0,0); g.imageSmoothingEnabled=false; g.clearRect(0,0,cv.width,cv.height); g.drawImage(t,0,0,cv.width,cv.height); }
  function drawPic(){ const {sig,U,V}=svd(); const R=[]; for(let i=0;i<H;i++){ const r=new Array(W).fill(0); for(let t=0;t<k;t++){ const a=sig[t]*U[t][i]; if(!a) continue; const v=V[t]; for(let j=0;j<W;j++) r[j]+=a*v[j]; } R.push(r); }
    paintCanvas(cvR,R); cap2.textContent='rebuilt from '+k+' layer'+(k===1?'':'s');
    let fro=0; for(let i=0;i<H;i++) for(let j=0;j<W;j++){ const e=A[i][j]-R[i][j]; fro+=e*e; } fro=Math.sqrt(fro);
    const tail=Math.sqrt(sig.slice(k).reduce((s,v)=>s+v*v,0)), spec=k<sig.length?sig[k]:0;
    /* singular value bars, log scale */
    const NAR=respVB(svS,'0 0 680 190','0 0 420 200');
    const f=frame(svS,-.5,H-.5,-3,Math.ceil(Math.log10(sig[0])+.2),{l:40,r:8,t:18,b:22,ys:1,yf:v=>'10'+(v<0?'⁻':'')+String(Math.abs(v)).replace(/\d/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]),axes:false});
    const gl=f.glow, bw=Math.max(1.5,(f.px(1)-f.px(0))*.7);
    sig.forEach((s,i)=>{ const y1=f.py(Math.max(-3,Math.log10(Math.max(s,1e-3)))), y0=f.py(-3); const kept=i<k; const r=el('rect',{x:f.px(i)-bw/2,y:y1,width:bw,height:Math.max(1,y0-y1),rx:1.5,fill:kept?'var(--s2)':'var(--s1)',opacity:kept?.95:.32},svS); if(kept&&gl&&i<3) r.setAttribute('filter',gl); });
    txt(svS,f.L,12,NAR?'64 singular values · log scale · kept lit':'the 64 singular values of the picture, biggest first (log scale) — kept ones lit','font:700 10.5px system-ui;fill:var(--ink-muted)');
    read.innerHTML='layers kept <b>k = '+k+'</b> of 64 · numbers stored <b>'+thou(k*(H+W+1))+'</b> instead of <b>'+thou(H*W)+'</b> ('+F(k*(H+W+1)/(H*W)*100,1)+'%)'+
      '<br>error, spectral norm: <b>σ'+SUB(k+1)+' = '+F(spec,3)+'</b> · Frobenius norm: <b>√(σ'+SUB(k+1)+'² + … + σ₆₄²) = '+F(tail,3)+'</b> (measured pixel by pixel: '+F(fro,3)+')'; }
  /* ---- the 3-D cloud ---- */
  const LAMc=[5,1.8,.35], r1=unit([1,.2,-.3]), r2=unit((()=>{ const t=[.2,1,.3]; const d=dot(t,r1); return t.map((v,i)=>v-d*r1[i]); })()), r3=[r1[1]*r2[2]-r1[2]*r2[1],r1[2]*r2[0]-r1[0]*r2[2],r1[0]*r2[1]-r1[1]*r2[0]];
  const AX=[r1,r2,r3], PC=cloudExact(180,fromEig(LAMc,AX),4242), Kk=.32, NC=PC.length;
  const rebuilt=m=>PC.map(p=>{ let q=[0,0,0]; for(let j=0;j<m;j++){ const s=dot(p,AX[j]); q=q.map((v,i)=>v+s*AX[j][i]); } return q; });
  function build(){ sc=null;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:[3.3,2.3,4.1],look:[0,0,0],fov:36},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){ const {root,isLight}=ctx, hx=hxOf(ctx);
        root.add(glowCloud(ctx,PC.map(p=>p.map(v=>v*Kk)),hx('s1'),isLight?.07:.08,isLight?.45:.5));
        const cop=glowCloud(ctx,PC.map(p=>p.map(v=>v*Kk)),hx('s4'),isLight?.09:.11,.95); root.add(cop);
        const th=segs(ctx,NC,hx('critical'),isLight?.6:.7); root.add(th);
        const rd=rod(ctx,hx('s2'),.02); root.add(rd); const gp=glassPlane(ctx,hx('s2'),[3.6,2.2],isLight?.13:.1); gp.userData.orient(r1,r2); root.add(gp);
        sc={ctx,cop,th,rd,gp}; hint(stage,'drag to orbit'); paintCloud(); },
      update(){ return false; } });
    if(handle&&sc) sc.handle=handle; return handle; }
  function paintCloud(){ const R=rebuilt(rank);
    if(sc){ const {ctx,cop,th,rd,gp}=sc; const Rs=R.map(p=>p.map(v=>v*Kk)); cop.userData.set(Rs); th.userData.set(PC.map(p=>p.map(v=>v*Kk)),Rs);
      rd.userData.set(r1,Math.sqrt(LAMc[0])*Kk*3.1,rank===1?1:0); gp.userData.setOp(rank===2?1:0); RR(ctx); }
    const sig=LAMc.map(l=>Math.sqrt(NC*l)), tail=Math.sqrt(sig.slice(rank).reduce((s,v)=>s+v*v,0)); let fro=0; PC.forEach((p,i)=>{ fro+=p.reduce((s,v,j)=>s+(v-R[i][j])**2,0); }); fro=Math.sqrt(fro);
    read2.innerHTML='data: '+NC+' points × 3 columns, singular values <b>'+sig.map(s=>F(s,2)).join(', ')+'</b> (σ = √(Nλ))<br>rank <b>'+rank+'</b>: '+(rank===1?'every point replaced by its shadow on the PC1 line':rank===2?'every point replaced by its shadow on the PC1–PC2 plane':'nothing dropped — the copy is exact')+
      '<br>Frobenius error <b>'+F(tail,3)+'</b> (measured '+F(fro,3)+') · spectral error <b>'+F(rank<3?sig[rank]:0,3)+'</b>'; }
  ['ek-r1','ek-r2','ek-r3'].forEach((id,i)=>document.getElementById(id).addEventListener('click',()=>{ rank=i+1; setPressed(['ek-r1','ek-r2','ek-r3'],id); paintCloud(); }));
  bindCtl('ek-k',v=>{ k=v; drawPic(); },v=>String(v)); onWidth(()=>{ if(drawn) drawPic(); });
  let S3=null, drawn=false;
  tabs(document.getElementById('ek-tabs'),t=>{ showPane(box,t==='pic'?'pic':'cloud'); if(t==='cloud'){ if(!S3) S3=mountStage(stage,build); else remount(S3); paintCloud(); } });
  /* the SVD of the picture is computed once, when the widget first comes near */
  txt(svS,20,40,'the singular values appear here…','font:600 12px system-ui;fill:var(--ink-muted)');
  const go=()=>{ if(drawn) return; drawn=true; svd(); paintCanvas(cvO,A); drawPic(); paintCloud(); };
  if('IntersectionObserver' in window) new IntersectionObserver((es,o)=>es.forEach(e=>{ if(e.isIntersecting){ go(); o.disconnect(); } }),{rootMargin:'600px 0px'}).observe(box); else go();
})();
