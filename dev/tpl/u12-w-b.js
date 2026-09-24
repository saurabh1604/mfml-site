/* ================= UNIT 12 · widgets, part B: §4–§7 ================= */
const CPRE={a:[[10,4],[4,4]],b:[[5,4],[4,5]],c:[[5,2],[2,8]]};
const angOf2=C=>{ const E=eig2(C[0][0],C[0][1],C[1][1]); return {E,a1:((E.th/DEG)%180+180)%180}; };

/* ================= W5 · THE SCORE BOWL (3D) ================= */
(function(){
  const box=document.getElementById('w-bowl'), stage=document.getElementById('bw-3d'); if(!box||!stage) return;
  const read=document.getElementById('bw-read'), verd=document.getElementById('bw-verdict');
  let key='a', ang=45, anim=null, sc=null;
  const C=()=>CPRE[key];
  const RD=1.4;
  function build(){ sc=null; const Cm=C(), {E}=angOf2(Cm), ZS=1.25/E.l1;
    const q=(x,y)=>Cm[0][0]*x*x+2*Cm[0][1]*x*y+Cm[1][1]*y*y;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:[2.55,2.75,3.5],look:[0,.6,0],fov:36},autoRotate:.12,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const surf=CIN.prim.surface(ctx,(x,y)=>Math.min(q(x,y),E.l1*1.6),{x:[-RD,RD],y:[-RD,RD],res:90,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:isLight?.88:.82,wire:false});
        lightenSurface(ctx,surf,ZS,[colors.s1,colors.s7,colors.s2]); root.add(surf);
        { const vis=fadeAttr(THREE,surf), pos=surf.userData.geo.attributes.position; for(let i=0;i<pos.count;i++){ const r=Math.hypot(pos.getX(i),pos.getZ(i)); vis.setX(i,r<1.13?1:Math.max(0,1-(r-1.13)/.12)); } vis.needsUpdate=true; }
        root.add(CIN.prim.grid(ctx,2.8,14,hx('grid'),{opacity:isLight?.45:.3}));
        /* contour rings of equal score, lifted onto the bowl and clipped to the lit disc */
        { const lv=[.25,.5,1,1.5,2,3,4.5,6.5].map(k=>k*E.l2), pos=[];
          contourSegs(q,lv,-RD,RD,-RD,RD,80).forEach(({L,segs})=>segs.forEach(([a,b,c,d])=>{ if(Math.hypot(a,b)<1.12&&Math.hypot(c,d)<1.12) pos.push(a,L*ZS+.006,-b,c,L*ZS+.006,-d); }));
          const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));
          root.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:isLight?0x0d1020:0xffffff,transparent:true,opacity:isLight?.22:.2}))); }
        /* the floor circle and the lifted ring */
        const floor=[], ring=[]; for(let k=0;k<=180;k++){ const t=k/180*2*Math.PI, x=Math.cos(t), y=Math.sin(t); floor.push(M3([x,y,0])); ring.push(M3([x,y,q(x,y)*ZS])); }
        root.add(CIN.prim.path(ctx,floor,hx('ink2'),{opacity:.55}));
        root.add(overlay(ribbon(ctx,ring,hx('s4'),.018),6));
        /* PC1 and PC2: stems at ±w on the ring, arrows on the floor */
        const mk=(th,col,lab)=>{ [1,-1].forEach(sg=>{ const x=sg*Math.cos(th), y=sg*Math.sin(th), h=q(x,y)*ZS;
            root.add(overlay(tube(ctx,M3([x,y,0]),M3([x,y,h]),col,.012,.9),7)); root.add(overlay(CIN.prim.dot(ctx,M3([x,y,h]),col,.05),8));
            if(sg>0) root.add(lab); });
          root.add(overlay(CIN.prim.arrow(ctx,M3([0,0,0.004]),M3([Math.cos(th),Math.sin(th),0.004]),col,{radius:.014,head:.12}),7)); };
        mk(E.th,hx('s2'),lab(ctx,'PC1 · λ₁ = '+T(E.l1,2),M3([-Math.cos(E.th)*1.05,-Math.sin(E.th)*1.05,E.l1*ZS+.28]),{size:15,color:colors.s2,depthTest:false,scale:.0068}));
        mk(E.th+Math.PI/2,hx('s3'),lab(ctx,'PC2 · λ₂ = '+T(E.l2,2),M3([-Math.sin(E.th)*1.1,Math.cos(E.th)*1.1,E.l2*ZS+.22]),{size:14,color:colors.s3,depthTest:false,scale:.0064}));
        const bead=overlay(CIN.prim.dot(ctx,[0,0,0],hx('ink'),.06),12), halo=haloSprite(ctx,hx('s4'),.42), stem=overlay(tube(ctx,[0,0,0],[0,1,0],hx('ink2'),.007,.8),9);
        const warrow=new THREE.Group(); root.add(bead,halo,stem,warrow);
        const chip=slot(ctx,root);
        sc={ctx,bead,halo,stem,warrow,chip,q,ZS,colors,hx};
        hint(stage,'drag to orbit'); place(); },
      update(){ return false; } });
    if(handle&&sc) sc.handle=handle; return handle; }
  function place(){ const Cm=C(), {E,a1}=angOf2(Cm), t=ang*DEG, x=Math.cos(t), y=Math.sin(t), v=qf2(Cm,t);
    if(sc){ const {ctx,bead,halo,stem,warrow,chip,ZS,colors,hx}=sc, top=M3([x,y,v*ZS]);
      bead.position.set(...top); halo.position.set(...top); aimTube(ctx.THREE,stem,M3([x,y,0]),top);
      clearGroup(warrow); warrow.add(overlay(CIN.prim.arrow(ctx,M3([0,0,.006]),M3([x,y,.006]),hx('ink'),{radius:.011,head:.1}),9));
      chip.set('wᵀCw = '+F(v,2),[top[0]*1.15,top[1]+.3,top[2]*1.15],{size:15,color:colors.s4,depthTest:false,scale:.0064}); RR(ctx); }
    const d1=Math.min(Math.abs(((ang-a1)%180+180)%180),180-Math.abs(((ang-a1)%180+180)%180));
    read.innerHTML='w = (<b>'+F(x,3)+'</b>, <b>'+F(y,3)+'</b>) at <b>'+F(ang,1)+'°</b><br>score wᵀCw = <b>'+F(v,3)+'</b><br>highest on the ring: <b>λ₁ = '+T(E.l1,3)+'</b> at '+F(a1,1)+'° and '+F(a1+180,1)+'°<br>lowest: <b>λ₂ = '+T(E.l2,3)+'</b> at '+F((a1+90)%360,1)+'° and '+F((a1+270)%360,1)+'°';
    if(d1<.8){ verd.className='verdict good'; verd.textContent='the top of the ring — this direction is PC1, and its score is λ₁'; }
    else if(Math.abs(d1-90)<.8){ verd.className='verdict info'; verd.textContent='the bottom of the ring — this is PC2, a quarter-turn from the top'; }
    else { verd.className='verdict info'; verd.textContent='in between — the score is a blend of λ₁ and λ₂'; } }
  bindCtl('bw-ang',v=>{ ang=v; place(); },v=>F(v,1)+'°');
  const setC=(k,id)=>{ key=k; setPressed(['bw-a','bw-b','bw-c'],id); if(S) remount(S); place(); };
  document.getElementById('bw-a').addEventListener('click',()=>setC('a','bw-a'));
  document.getElementById('bw-b').addEventListener('click',()=>setC('b','bw-b'));
  document.getElementById('bw-c').addEventListener('click',()=>setC('c','bw-c'));
  document.getElementById('bw-play').addEventListener('click',()=>{ if(anim){ anim.stop(); anim=null; } const a0=ang;
    if(RM){ const {a1}=angOf2(C()); ang=a1; setRange('bw-ang',ang,v=>F(v,1)+'°'); place(); return; }
    let dead=false; const t0=performance.now(); anim={stop(){ dead=true; }};
    (function fr(now){ if(dead) return; const e=Math.min(1,(now-t0)/7000); ang=(a0+360*e)%360; setRange('bw-ang',ang,v=>F(v,1)+'°'); place(); if(e<1) requestAnimationFrame(fr); else anim=null; })(t0); });
  const S=mountStage(stage,build); place();
})();

/* ================= W6 · THE LEASH AND THE TWO ARROWS ================= */
(function(){
  const box=document.getElementById('w-leash'); if(!box) return;
  const svg=document.getElementById('ls-svg'), meter=document.getElementById('ls-meter'), read=document.getElementById('ls-read');
  let key='a', ang=70, anim=null, P=null;
  function draw(){ const C=CPRE[key], {E,a1}=angOf2(C), t=ang*DEG, w=[Math.cos(t),Math.sin(t)];
    const gf=[2*(C[0][0]*w[0]+C[0][1]*w[1]),2*(C[1][0]*w[0]+C[1][1]*w[1])], gg=[2*w[0],2*w[1]];
    const cosA=dot(gf,gg)/(norm(gf)*norm(gg)), A=Math.acos(Math.max(-1,Math.min(1,cosA)))/DEG;
    const tan=[-w[1],w[0]], lean=dot(gf,tan);                         /* the part of ∇f along the circle */
    respVB(svg,'0 0 540 460','0 0 420 420'); P=eqFrame(svg,1.75,{step:.5}); const {px,py,glow:gl}=P, Ly=P.layer;
    /* contour rings of wᵀCw */
    const f=(x,y)=>C[0][0]*x*x+2*C[0][1]*x*y+C[1][1]*y*y, lv=[]; for(let k=1;k<=9;k++) lv.push(E.l1*k*k/9*.55);
    lv.push(E.l1,E.l2);
    contourSegs(f,lv,-1.9,1.9,-1.9,1.9,70).forEach(({L,segs})=>{ const hot=Math.abs(L-E.l1)<1e-9, cold=Math.abs(L-E.l2)<1e-9; const g=el('g',{},Ly);
      segs.forEach(([a,b,c,d])=>el('line',{x1:px(a),y1:py(b),x2:px(c),y2:py(d),stroke:hot?'var(--s2)':cold?'var(--s3)':'var(--s1)','stroke-width':hot||cold?1.6:1,opacity:hot||cold?.75:.35,'stroke-dasharray':hot||cold?'4 4':null},g)); });
    txt(Ly,px(1.02*Math.cos(E.th+.5)),py(1.02*Math.sin(E.th+.5))-10,'','');
    /* the leash */
    const ring=el('g',{},Ly); el('circle',{cx:px(0),cy:py(0),r:P.s,fill:'none',stroke:'var(--s4)','stroke-width':6,opacity:.13},ring); el('circle',{cx:px(0),cy:py(0),r:P.s,fill:'none',stroke:'var(--s4)','stroke-width':2},ring);
    /* PC1/PC2 marks on the circle */
    [[E.th,'var(--s2)','PC1'],[E.th+Math.PI,'var(--s2)',''],[E.th+Math.PI/2,'var(--s3)','PC2'],[E.th-Math.PI/2,'var(--s3)','']].forEach(([a,c,l])=>{ el('circle',{cx:px(Math.cos(a)),cy:py(Math.sin(a)),r:4.5,fill:c},Ly); if(l) txt(Ly,px(1.16*Math.cos(a)),py(1.16*Math.sin(a))+4,l,'font:800 11px system-ui;fill:'+c,'middle'); });
    /* the tangent: the only way the bead may move */
    el('line',{x1:px(w[0]-tan[0]*.55),y1:py(w[1]-tan[1]*.55),x2:px(w[0]+tan[0]*.55),y2:py(w[1]+tan[1]*.55),stroke:'var(--ink-2)','stroke-width':1.3,'stroke-dasharray':'2 4',opacity:.8},Ly);
    /* the two arrows, drawn at fixed lengths — only their directions matter */
    const uf=unit(gf), ug=unit(gg);
    svgArrow(svg,px(w[0]),py(w[1]),px(w[0]+ug[0]*.5),py(w[1]+ug[1]*.5),'var(--ink-2)',2.4,gl);
    svgArrow(svg,px(w[0]),py(w[1]),px(w[0]+uf[0]*.72),py(w[1]+uf[1]*.72),'var(--s2)',3,gl);
    txt(svg,px(w[0]+uf[0]*.8),py(w[1]+uf[1]*.8)+4,'∇f = 2Cw','font:800 11.5px system-ui;fill:var(--s2)',uf[0]>=0?'start':'end');
    txt(svg,px(w[0]+ug[0]*.56),py(w[1]+ug[1]*.56)+(ug[1]>0?-6:14),'∇g = 2w','font:700 11px system-ui;fill:var(--ink-2)',ug[0]>=0?'start':'end');
    /* the lean: which way is uphill along the circle */
    if(A>1.5){ const s=Math.sign(lean); svgArrow(svg,px(w[0]),py(w[1]),px(w[0]+tan[0]*s*.3),py(w[1]+tan[1]*s*.3),'var(--s4)',2.2,gl,.9); }
    const bead=el('g',{},svg); el('circle',{cx:px(w[0]),cy:py(w[1]),r:15,fill:'var(--s4)',opacity:.2},bead); el('circle',{cx:px(w[0]),cy:py(w[1]),r:8,fill:'var(--s4)',stroke:'var(--page)','stroke-width':2},bead); if(gl) bead.setAttribute('filter',gl);
    /* the parallel meter */
    meter.innerHTML=''; const cx=150,cy=100,R=78; const mg=glo(meter,2);
    el('path',{d:`M${cx-R} ${cy} A${R} ${R} 0 0 1 ${cx+R} ${cy}`,fill:'none',stroke:'color-mix(in srgb,var(--ink) 14%,transparent)','stroke-width':12,'stroke-linecap':'round'},meter);
    const u=Math.min(1,A/90), ex=cx-R*Math.cos(Math.PI*u), ey=cy-R*Math.sin(Math.PI*u);
    el('path',{d:`M${cx-R} ${cy} A${R} ${R} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`,fill:'none',stroke:A<1?'var(--s3)':'var(--s2)','stroke-width':12,'stroke-linecap':'round',filter:mg||null},meter);
    txt(meter,cx,cy-18,F(A,1)+'°','font:800 22px system-ui;fill:'+(A<1?'var(--s3)':'var(--ink)'),'middle');
    txt(meter,cx,cy+30,A<1?'parallel — an eigenvector':'angle between the two arrows','font:600 11px system-ui;fill:'+(A<1?'var(--s3)':'var(--ink-muted)'),'middle');
    txt(meter,cx-R,cy+14,'0°','font:600 9.5px system-ui;fill:var(--ink-muted)','middle'); txt(meter,cx+R,cy+14,'90°','font:600 9.5px system-ui;fill:var(--ink-muted)','middle');
    const score=f(w[0],w[1]), lam=dot(gf,gg)/dot(gg,gg);
    read.innerHTML='bead at <b>'+F(ang,1)+'°</b> · score wᵀCw = <b>'+F(score,3)+'</b><br>angle between ∇f and ∇g: <b>'+F(A,2)+'°</b>'+(A<1?' — <b style="color:var(--s3)">parallel</b>: ∇f = '+F(lam,2)+' ∇g, so Cw = '+F(lam,2)+' w':'<br>uphill along the circle: <b>'+(lean>0?'anticlockwise':'clockwise')+'</b>'); }
  bindCtl('ls-ang',v=>{ ang=v; draw(); },v=>F(v,1)+'°');
  const setAng=v=>{ ang=((v%360)+360)%360; setRange('ls-ang',ang,v=>F(v,1)+'°'); draw(); };
  svgDrag(svg,(x,y)=>{ if(!P) return false; const X=P.ix(x),Y=P.iy(y); if(Math.abs(Math.hypot(X,Y)-1)>.35) return false; if(anim){ anim.stop(); anim=null; } },(x,y)=>{ setAng(Math.atan2(P.iy(y),P.ix(x))/DEG); });
  box.querySelectorAll('#ls-tabs button').forEach(b=>b.addEventListener('click',()=>{ key=b.dataset.c; setTabs(document.getElementById('ls-tabs'),key,'c'); draw(); })); onWidth(draw);
  /* climb: follow the lean along the circle (gradient ascent on the leash) until the two arrows line up */
  document.getElementById('ls-climb').addEventListener('click',()=>{ if(anim){ anim.stop(); anim=null; } const C=CPRE[key], {E}=angOf2(C);
    /* the nearest top (w or −w) along the way uphill leans */
    let target=E.th/DEG; while(target-ang>180) target-=360; while(ang-target>180) target+=360; if(Math.abs(target-ang)>90) target+=target>ang?-180:180;
    const a0=ang; anim=tween(RM?0:1800,u=>{ const e=1-Math.pow(1-u,2.2); setAng(a0+(target-a0)*e); },()=>{ anim=null; setAng(target); }); });
  draw();
})();

/* ================= W7 · ONE NUMBER, THREE READINGS ================= */
(function(){
  const box=document.getElementById('w-three'); if(!box) return;
  const p1=document.getElementById('th-p1'), p2=document.getElementById('th-p2'), p3=document.getElementById('th-p3'), read=document.getElementById('th-read');
  let key='b', ang=20, anim=null;
  const CL={}; ['a','b','c'].forEach(k=>{ CL[k]=cloudExact(120,CPRE[k],300+k.charCodeAt(0)); });
  const KEYS={'th-a':'b','th-b':'a','th-c':'c'};
  function draw(){ const C=CPRE[key], {E}=angOf2(C), t=ang*DEG, w=[Math.cos(t),Math.sin(t)], Cw=matVec(C,w), st=norm(Cw), sp=dot(w,Cw), res=Math.hypot(Cw[0]-sp*w[0],Cw[1]-sp*w[1]), eig=res<1e-3*E.l1;
    const s=1/E.l1*1.35;
    /* panel 1: stretch */
    let P=eqFrame(p1,1.55,{step:.5}); const g1=P.glow;
    let d=''; for(let k=0;k<=72;k++){ const a=k/72*2*Math.PI, v=matVec(C,[Math.cos(a),Math.sin(a)]); d+=(k?'L':'M')+P.px(v[0]*s).toFixed(1)+' '+P.py(v[1]*s).toFixed(1); }
    el('path',{d:d+'Z',fill:'color-mix(in srgb,var(--s2) 7%,transparent)',stroke:'var(--s2)','stroke-width':1,opacity:.6},P.layer);
    el('circle',{cx:P.px(0),cy:P.py(0),r:P.s,fill:'none',stroke:'var(--ink-muted)','stroke-width':1,'stroke-dasharray':'3 4'},P.layer);
    svgArrow(p1,P.px(0),P.py(0),P.px(Cw[0]*s),P.py(Cw[1]*s),'var(--s2)',3.2,g1);
    svgArrow(p1,P.px(0),P.py(0),P.px(w[0]),P.py(w[1]),'var(--ink)',2.4,g1);
    txt(p1,12,20,'① the stretch  |Cw| = '+F(st,2),'font:800 12px system-ui;fill:var(--s2)');
    txt(p1,12,36,eig?'Cw lies along w: stretched, not turned':'Cw is turned away from w','font:600 10.5px system-ui;fill:var(--ink-muted)');
    /* panel 2: spread */
    P=eqFrame(p2,Math.sqrt(E.l1)*2.6,{step:Math.sqrt(E.l1)>2.5?2:1}); const g2=P.glow, L=Math.sqrt(E.l1)*3;
    glowLine(P.layer,P.px(-w[0]*L),P.py(-w[1]*L),P.px(w[0]*L),P.py(w[1]*L),'var(--s2)',1.8,g2);
    const gp=el('g',{},P.layer), gd=el('g',{},P.layer);
    CL[key].forEach(p=>{ const z=dot(p,w); el('line',{x1:P.px(p[0]),y1:P.py(p[1]),x2:P.px(w[0]*z),y2:P.py(w[1]*z),stroke:'var(--ink-muted)','stroke-width':.6,opacity:.35},gp); el('circle',{cx:P.px(p[0]),cy:P.py(p[1]),r:2.6,fill:'var(--s1)',opacity:.85},gp); el('circle',{cx:P.px(w[0]*z),cy:P.py(w[1]*z),r:2.2,fill:'var(--s4)'},gd); });
    if(g2) gd.setAttribute('filter',g2);
    txt(p2,12,20,'② the spread  wᵀCw = '+F(sp,2),'font:800 12px system-ui;fill:var(--s4)');
    txt(p2,12,36,'120 points with exactly this C','font:600 10.5px system-ui;fill:var(--ink-muted)');
    /* panel 3: the fine — split 2Cw into a part along w (λ·2w) and a leftover along the circle */
    P=eqFrame(p3,1.55,{step:.5}); const g3=P.glow, k3=.6/E.l1;
    el('circle',{cx:P.px(0),cy:P.py(0),r:P.s*.5,fill:'none',stroke:'var(--ink-muted)','stroke-width':1,'stroke-dasharray':'3 4'},P.layer);
    const o=[w[0]*.5,w[1]*.5], along=[w[0]*sp*2*k3,w[1]*sp*2*k3], left=[(Cw[0]-sp*w[0])*2*k3,(Cw[1]-sp*w[1])*2*k3];
    svgArrow(p3,P.px(o[0]),P.py(o[1]),P.px(o[0]+along[0]),P.py(o[1]+along[1]),'var(--s7)',3,g3);
    if(!eig){ svgArrow(p3,P.px(o[0]+along[0]),P.py(o[1]+along[1]),P.px(o[0]+along[0]+left[0]),P.py(o[1]+along[1]+left[1]),'var(--critical)',2.4,g3);
      el('line',{x1:P.px(o[0]),y1:P.py(o[1]),x2:P.px(o[0]+along[0]+left[0]),y2:P.py(o[1]+along[1]+left[1]),stroke:'var(--s2)','stroke-width':1.6,'stroke-dasharray':'4 3'},p3); }
    glowDot(p3,P.px(o[0]),P.py(o[1]),5,'var(--s4)',g3);
    { const e1=[o[0]+along[0],o[1]+along[1]], lf=unit(along); txt(p3,P.px(e1[0]-lf[1]*.14),P.py(e1[1]+lf[0]*.14)+(lf[0]<0?10:-4),'λ·2w','font:800 11px system-ui;fill:var(--s7)','middle');
      if(!eig){ const e2=[e1[0]+left[0],e1[1]+left[1]]; txt(p3,P.px(e2[0])+(left[0]>=0?6:-6),P.py(e2[1])-6,'leftover','font:700 10.5px system-ui;fill:var(--critical)',left[0]>=0?'start':'end');
        txt(p3,P.px((o[0]+e2[0])/2)+(left[0]>=0?-8:8),P.py((o[1]+e2[1])/2)-8,'2Cw','font:700 10.5px system-ui;fill:var(--s2)',left[0]>=0?'end':'start'); } }
    txt(p3,12,20,'③ the fine  λ = '+F(sp,2),'font:800 12px system-ui;fill:var(--s7)');
    txt(p3,12,36,eig?'2Cw = λ·2w exactly: no leftover':'leftover along the circle: '+F(2*res,2),'font:600 10.5px system-ui;fill:'+(eig?'var(--ink-muted)':'var(--critical)'));
    read.innerHTML='w at <b>'+F(ang,1)+'°</b> · stretch |Cw| = <b>'+F(st,3)+'</b> · spread wᵀCw = <b>'+F(sp,3)+'</b> · best fine λ = <b>'+F(sp,3)+'</b> with leftover <b>'+F(2*res,3)+'</b>'+
      (eig?'<br><b style="color:var(--s3)">an eigenvector: all three readings agree — '+F(sp,2)+'</b>':'<br>not an eigenvector: the stretch ('+F(st,2)+') is bigger than the spread ('+F(sp,2)+'), and no fine can cancel the leftover'); }
  bindCtl('th-ang',v=>{ ang=v; draw(); },v=>F(v,1)+'°');
  const goTo=a=>{ if(anim){ anim.stop(); anim=null; } const a0=ang; let t=((a%180)+180)%180; while(t-a0>90) t-=180; while(a0-t>90) t+=180; anim=tween(800,e=>{ ang=((a0+(t-a0)*e)%180+180)%180; setRange('th-ang',ang,v=>F(v,1)+'°'); draw(); },()=>{ anim=null; ang=((t%180)+180)%180; setRange('th-ang',ang,v=>F(v,1)+'°'); draw(); }); };
  Object.keys(KEYS).forEach(id=>document.getElementById(id).addEventListener('click',()=>{ key=KEYS[id]; setPressed(Object.keys(KEYS),id); draw(); }));
  document.getElementById('th-snap').addEventListener('click',()=>goTo(angOf2(CPRE[key]).a1));
  document.getElementById('th-snap2').addEventListener('click',()=>goTo(angOf2(CPRE[key]).a1+90));
  draw();
})();

/* ================= W8 · FIND IT, PEEL IT, REPEAT (3D) ================= */
(function(){
  const box=document.getElementById('w-peel'), stage=document.getElementById('pl-3d'); if(!box||!stage) return;
  const bars=document.getElementById('pl-bars'), read=document.getElementById('pl-read');
  const LAM=[9,4,1];
  const b1=unit([1,.3,-.35]), b2=unit((()=>{ const t=[-.2,1,.25]; const d=dot(t,b1); return t.map((v,i)=>v-d*b1[i]); })());
  const b3=[b1[1]*b2[2]-b1[2]*b2[1],b1[2]*b2[0]-b1[0]*b2[2],b1[0]*b2[1]-b1[1]*b2[0]];
  const AX=[b1,b2,b3], C3=fromEig(LAM,AX), K=.26;
  const P0=cloudExact(360,C3,909);
  let step=0, pts=P0.map(p=>p.slice()), busy=null, sc=null;       /* step: 0 raw · 1 PC1 found · 2 peeled 1 · 3 PC2 found · 4 peeled 2 · 5 PC3 found */
  const sc3=p=>p.map(v=>v*K);
  const peeled=k=>P0.map(p=>{ let q=p.slice(); for(let j=0;j<k;j++){ const s=dot(q,AX[j]); q=q.map((v,i)=>v-s*AX[j][i]); } return q; });
  const eigNow=()=>eigSym(covOf(pts).C).vals.map(v=>Math.max(0,v));
  function build(){ sc=null;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:[4.0,2.7,4.9],look:[0,0,0],fov:36},autoRotate:.1,autoRotateStopsOnUser:true,
      build(ctx){ const {root,colors,isLight}=ctx, hx=hxOf(ctx);
        const cloud=glowCloud(ctx,pts.map(sc3),hx('s1'),isLight?.11:.14); root.add(cloud);
        const rods=AX.map((a,i)=>{ const r=rod(ctx,hx(PCC[i]),.022); r.userData.set(a,0.01,0); root.add(r); return r; });
        const glass=glassPlane(ctx,hx('s2'),3.4,0); glass.userData.orient(b2,b3); root.add(glass);
        { const gr=CIN.prim.grid(ctx,5,10,hx('grid'),{opacity:isLight?.35:.22}); gr.position.y=-1.4; root.add(gr); }
        const chip=slot(ctx,root);
        /* the cloud's shape as a glass egg (1.8 standard deviations): it flattens with the cloud as each direction is peeled */
        const egg=new ctx.THREE.Mesh(new ctx.THREE.SphereGeometry(1,40,28),new ctx.THREE.MeshStandardMaterial({color:hx('s1'),transparent:true,opacity:isLight?.1:.08,roughness:.3,emissive:hx('s1'),emissiveIntensity:isLight?.05:.25,depthWrite:false}));
        egg.quaternion.setFromRotationMatrix(new ctx.THREE.Matrix4().makeBasis(new ctx.THREE.Vector3(...b1),new ctx.THREE.Vector3(...b2),new ctx.THREE.Vector3(...b3))); root.add(egg);
        const eggW=new ctx.THREE.LineSegments(new ctx.THREE.WireframeGeometry(new ctx.THREE.SphereGeometry(1,18,12)),new ctx.THREE.LineBasicMaterial({color:hx('s1'),transparent:true,opacity:isLight?.12:.09})); egg.add(eggW);
        sc={ctx,cloud,rods,glass,chip,colors,egg};
        hint(stage,'drag to orbit'); paint(true); },
      update(){ return false; } });
    if(handle&&sc) sc.handle=handle; return handle; }
  const Hlen=i=>Math.sqrt(LAM[i])*K*2.9;
  function paint(full){ if(sc){ const {ctx,cloud,rods,glass,chip,colors,egg}=sc; cloud.userData.set(pts.map(sc3));
      { const Cn=covOf(pts).C; const s3=AX.map(a=>Math.max(.004,1.8*Math.sqrt(Math.max(0,dot(a,matVec(Cn,a))))*K)); egg.scale.set(s3[0],s3[1],s3[2]); }
      rods.forEach((r,i)=>{ const found=(i===0&&step>=1)||(i===1&&step>=3)||(i===2&&step>=5); r.userData.set(AX[i],found?Hlen(i):.01,found?1:0); });
      glass.userData.setOp(step===2||step===3?1:0);
      const i=step>=5?2:step>=3?1:step>=1?0:-1;
      if(i>=0&&step%2===1){ const a=AX[i], h=Hlen(i)*.72; chip.set('PC'+(i+1)+' · λ = '+LAM[i],[a[0]*h,a[1]*h+.3,a[2]*h],{size:16,color:colors[PCC[i]],depthTest:false,scale:.005}); } else chip.hide();
      RR(ctx); }
    drawBars(); }
  function drawBars(){ const v=eigNow(); const f=frame(bars,-.5,2.5,0,10,{l:28,r:8,t:26,b:30,ys:2,axes:false}); const gl=f.glow, bw=(f.px(1)-f.px(0))*.55;
    /* bars are drawn per direction (PC1, PC2, PC3), reading what is left along each */
    const along=AX.map(a=>dot(a,matVec(covOf(pts).C,a)));
    along.forEach((val,i)=>{ const y0=f.py(0), y1=f.py(Math.max(0,val)); const r=el('rect',{x:f.px(i)-bw/2,y:y1,width:bw,height:Math.max(1.5,y0-y1),rx:5,fill:CV(PCC[i]),opacity:.92},bars); if(gl) r.setAttribute('filter',gl);
      txt(bars,f.px(i),y1-6,F(Math.abs(val)<5e-9?0:val,2),'font:800 12px system-ui;fill:var(--ink)','middle'); txt(bars,f.px(i),f.H-f.B+15,'along w'+SUB(i+1),'font:600 10.5px system-ui;fill:'+CV(PCC[i]),'middle'); });
    txt(bars,f.L,14,'spread left along each direction','font:700 11px system-ui;fill:var(--ink-muted)');
    const words=['the raw cloud: spreads 9, 4 and 1 along three hidden directions','PC1 found: the top direction, λ₁ = 9','peeled: every point slid along w₁ onto the plane — λ₁ fell to 0, the others did not move','PC2 found: the top of what is left is λ₂ = 4, at right angles to w₁','peeled again: the disc squashed onto one line','PC3 found: λ₃ = 1 — all three directions, all at right angles'];
    read.innerHTML='step <b>'+step+' of 5</b> · '+words[step]+'<br>eigenvalues of what is left: <b>'+v.map(x=>F(x<5e-9?0:x,2)).join(', ')+'</b> · total <b>'+F(v.reduce((a,b)=>a+b,0),2)+'</b>';
    document.getElementById('pl-find').disabled=step%2===1||step>=5; document.getElementById('pl-peel').disabled=step%2===0||step>=5; }
  function find(done){ if(busy||step%2===1||step>=5) return; step++; const i=(step-1)/2; if(RM||!sc){ paint(); done&&done(); return; }
    paint(); sc.rods[i].userData.set(AX[i],.01,0);
    busy=tween(700,u=>{ if(sc){ sc.rods[i].userData.set(AX[i],Math.max(.01,Hlen(i)*u),u); RR(sc.ctx); } },()=>{ busy=null; paint(); done&&done(); }); }
  function peel(done){ if(busy||step%2===0||step>=5) return; const k=(step+1)/2, from=pts.map(p=>p.slice()), to=peeled(k); step++;
    if(RM){ pts=to; paint(); done&&done(); return; }
    busy=tween(1300,u=>{ pts=from.map((p,i)=>p.map((v,j)=>v+(to[i][j]-v)*u)); paint(); },()=>{ busy=null; pts=to; paint(); done&&done(); }); }
  let story=0;
  function reset(){ story++; if(busy){ busy.stop(); busy=null; } step=0; pts=P0.map(p=>p.slice()); paint(); }
  document.getElementById('pl-find').addEventListener('click',()=>find());
  document.getElementById('pl-peel').addEventListener('click',()=>peel());
  document.getElementById('pl-reset').addEventListener('click',reset);
  /* the whole story: each move starts when the last one has finished, with a short pause to look */
  document.getElementById('pl-play').addEventListener('click',()=>{ reset(); const tok=story, seq=[find,peel,find,peel,find]; let k=0;
    const next=()=>{ if(tok!==story||k>=seq.length) return; const f=seq[k++]; f(()=>setTimeout(next,RM?0:900)); }; setTimeout(next,RM?0:400); });
  mountStage(stage,build); paint();
})();
