/* ================= the soft-margin data: six blue, six orange, one rogue blue near the orange group ================= */
const SOFT={X:[[1,4],[1.5,5],[2,4.2],[.8,5.5],[2.5,5.6],[1.2,3.2],[3.4,2.6],[4,1.5],[4.5,2.6],[5.2,1.4],[3.8,.6],[5.5,3],[4.6,.5]],y:[1,1,1,1,1,1,1,-1,-1,-1,-1,-1,-1],rogue:6};

/* ================= W10 · THE FINE DIAL (slack as red pillars; the fine C on a log dial) ================= */
(function(){
  const box=document.getElementById('sl-3d'), tbl=document.getElementById('sl-kv'), verd=document.getElementById('sl-verdict'); if(!box) return;
  const CX=3.2, CY=3.05, S=.6, P=x=>[(x[0]-CX)*S,(x[1]-CY)*S], L=4.8, KH=.42;
  let lc=Math.log10(.02), sc=null, res=null, anim=null;
  const Cof=()=>Math.pow(10,lc);
  const fmtC=c=>c>=100?trim(F(c,0)):c>=1?trim(F(c,2)):trim(F(c,3));
  function solve(){ res=SVM.solve(SOFT.X,SOFT.y,{C:Cof()}); }
  function build(){ sc=null; const narrow=box.clientWidth<560, r=narrow?8.6:6.8, th=.3, ph=.92;
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),.2+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look:[0,.2,0],fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx);
        glassFloor(ctx,6.6,{div:26});
        SOFT.X.forEach((x,i)=>root.add(bead3(ctx,M3(...P(x),.075),SOFT.y[i],{r:.08})));
        const street=strip3(ctx,hx(K13.edge),isLight?.14:.18); root.add(street);
        const sideP=strip3(ctx,hx(K13.pos),isLight?.05:.07), sideN=strip3(ctx,hx(K13.neg),isLight?.05:.07); root.add(sideP,sideN);
        const cLine=liveTube(ctx,hx('ink'),.017,.95), e1=liveTube(ctx,hx(K13.edge),.013), e2=liveTube(ctx,hx(K13.edge),.013); root.add(cLine,e1,e2);
        const pil=SOFT.X.map(()=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,1,16),new THREE.MeshStandardMaterial({color:critHex(),emissive:critHex(),emissiveIntensity:isLight?.25:.8,roughness:.3,transparent:true,opacity:.88})); root.add(m); return m; });
        const rings=SOFT.X.map(()=>{ const m=ring3(ctx,.17,{tube:.016}); root.add(m); return m; });
        const labs=SOFT.X.map(()=>slot(ctx,root));
        sc={ctx,THREE,hx,street,sideP,sideN,cLine,e1,e2,pil,rings,labs,handle:null}; hint(box,'drag to orbit'); sc.hud=hud(box); paint(); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM||sc.story) return false; const o=sc.handle.ctx.orbit; o.sph.theta=.3+.16*Math.sin(t*.2); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; }); }
    return handle; }
  function paint(){ if(!sc||!res) return; const {THREE,street,sideP,sideN,cLine,e1,e2,pil,rings,labs,hx,ctx}=sc;
    const wn=res.wn, u=[res.w[0]/wn,res.w[1]/wn], d=[-u[1],u[0]], wd=2/wn*S, mid=-res.b/wn, k=mid-(u[0]*CX+u[1]*CY), cs=[k*u[0]*S,k*u[1]*S];
    street.userData.set(cs,u,wd,L,.004); const off=wd/2+1.6; sideP.userData.set([cs[0]+u[0]*off,cs[1]+u[1]*off],u,3.2,L,.003); sideN.userData.set([cs[0]-u[0]*off,cs[1]-u[1]*off],u,3.2,L,.003);
    const seg=(o,m)=>aimTube(THREE,m,M3(cs[0]+u[0]*o-d[0]*L/2,cs[1]+u[1]*o-d[1]*L/2,.013),M3(cs[0]+u[0]*o+d[0]*L/2,cs[1]+u[1]*o+d[1]*L/2,.013)); seg(0,cLine); seg(wd/2,e1); seg(-wd/2,e2);
    const C=Cof();
    SOFT.X.forEach((x,i)=>{ const p=P(x), xi=res.slack[i], a=res.alpha[i];
      if(xi>1e-6){ pil[i].visible=true; aimTube(THREE,pil[i],M3(p[0],p[1],.02),M3(p[0],p[1],.02+xi*KH)); labs[i].set('ξ = '+F(xi,2),M3(p[0],p[1],xi*KH+.22),{size:15,color:cssv('critical'),depthTest:false,scale:.0048}); }
      else { pil[i].visible=false; labs[i].hide(); }
      const bnd=a>=C*(1-1e-9), free=a>1e-9&&!bnd; rings[i].visible=free||bnd; rings[i].position.set(...M3(p[0],p[1],.012));
      const col=bnd?critHex():hx(K13.sv); rings[i].material.color.setHex(col); rings[i].material.emissive.setHex(col); });
    sc.hud.innerHTML='C = <b>'+fmtC(C)+'</b> · width <b>'+F(res.width,2)+'</b> · total slack <b>'+F(res.slackSum,2)+'</b>'; RR(ctx); }
  function draw(){ solve(); const C=Cof(), nb=res.alpha.filter(a=>a>=C*(1-1e-9)).length, nf=res.alpha.filter(a=>a>1e-9&&a<C*(1-1e-9)).length, xr=res.slack[SOFT.rogue];
    kv(tbl,[['fine C','<b>'+fmtC(C)+'</b>'],['street width 2/‖w‖','<b>'+F(res.width,3)+'</b>'],['total slack Σξ',F(res.slackSum,3)],['rogue point: ξ',F(xr,3)+(xr>1?' (wrong side)':xr>1e-6?' (inside)':'')],['support vectors',(nf+nb)+' · '+nf+' free, '+nb+' at the ceiling'],['objective ½‖w‖² + CΣξ',F(res.primal,4)]]);
    if(xr>1+1e-9){ verd.className='verdict info'; verd.textContent='info — the fine is so cheap that the rogue point is allowed across the centre line (ξ > 1): a wide, calm street'; }
    else if(xr>1e-6){ verd.className='verdict info'; verd.textContent='info — the rogue point pays for standing inside the street; raise C and the street tightens around it'; }
    else { verd.className='verdict good'; verd.textContent='good — nobody trespasses any more: this is the hard-margin street, width '+F(res.width,3)+', held up by the rogue point'; }
    paint(); }
  function setLC(v){ lc=v; setCtl('sl-c',lc,x=>fmtC(Math.pow(10,x))); draw(); }
  function stop(){ if(anim){ anim.stop(); anim=null; } if(sc) sc.story=false; }
  bindCtl('sl-c',v=>{ stop(); pressOnly(document.getElementById('sl-pre'),null); lc=v; draw(); },v=>fmtC(Math.pow(10,v)));
  [['sl-p-lo',Math.log10(.02)],['sl-p-1',0],['sl-p-hi',3]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{ stop(); pressOnly(document.getElementById('sl-pre'),e.currentTarget); const f=lc; anim=tween(RM?1:900,u=>setLC(f+(v-f)*u),()=>setLC(v)); }));
  document.getElementById('sl-play').addEventListener('click',()=>{ stop(); pressOnly(document.getElementById('sl-pre'),null); if(sc) sc.story=true; anim=tween(RM?1:4200,u=>setLC(-2+5*u),()=>{ setLC(3); if(sc) sc.story=false; }); });
  /* two static snapshots */
  function snap(id,cap,C){ const svg=document.getElementById(id), r=SVM.solve(SOFT.X,SOFT.y,{C}); const fr=eqFrame(svg,3.15,3.05,3.95,{xs:1,ys:1,xt:false,yt:false,l:10,b:10,t:10,r:10});
    drawLinSVM(fr,svg,SOFT.X,SOFT.y,r,{alphaLabels:false,wOff:1.2,wLen:.7});
    SOFT.X.forEach((x,i)=>{ if(r.slack[i]>1e-6) txt(svg,fr.px(x[0])+11,fr.py(x[1])+15,'ξ '+F(r.slack[i],2),'font:700 10.5px Inter,system-ui;fill:var(--critical)'); });
    document.getElementById(cap).innerHTML='<b>C = '+fmtC(C)+'</b> · street width <b>'+F(r.width,2)+'</b> · total slack <b>'+F(r.slackSum,2)+'</b> · '+r.nsv+' support vectors'; }
  const snaps=()=>{ snap('sl-snap-lo','sl-cap-lo',.02); snap('sl-snap-hi','sl-cap-hi',1000); };
  setCtl('sl-c',lc,x=>fmtC(Math.pow(10,x))); draw(); snaps(); new MutationObserver(snaps).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
})();

/* ================= W11 · DRAG A POINT ACROSS THE STREET (the hinge and the 0/1 loss, side by side) ================= */
(function(){
  const svg=document.getElementById('hg-svg'), tbl=document.getElementById('hg-kv'), verd=document.getElementById('hg-verdict'); if(!svg) return;
  const w=[.5,.5], b=-2, wn=Math.SQRT1_2, u=[w[0]/wn,w[1]/wn], BASE=[2,2];         /* centre line x₁+x₂ = 4, edges 6 (+1) and 2 (−1) */
  let yc=1, pt=[3.4,3.1], fr=null, P=null, drag=false, anim=null;
  const zOf=()=>yc*(w[0]*pt[0]+w[1]*pt[1]+b);
  function draw(){ svg.innerHTML=''; const glow=glo(svg);
    /* left: the street (an equal-scale panel) */
    const X0=-.25, X1=4.65, Y0=-.25; fr=panel(svg,34,16,380,338,X0,X1,Y0,Y0+(X1-X0)*338/380,{xs:1,ys:1}); fr.glow=glow;
    const gl=el('g',{'clip-path':fr.clip},svg); drawStreet(fr,gl,w,b,{sides:true});
    [[6,'score +1 edge'],[2,'score −1 edge'],[4,'centre line']].forEach(([c,t])=>{ const X=fr.px(c/2+1.3), Y=fr.py(c/2-1.3); const tt=txt(gl,X,Y-6,t,'font:600 10px Inter,system-ui;fill:'+(c===4?'var(--ink-2)':'var(--s7)'),'middle'); tt.setAttribute('transform',`rotate(45 ${X} ${Y})`); });
    const z=zOf(), foot=[pt[0]-(w[0]*pt[0]+w[1]*pt[1]+b)/wn*u[0],pt[1]-(w[0]*pt[0]+w[1]*pt[1]+b)/wn*u[1]];
    el('line',{x1:fr.px(pt[0]),y1:fr.py(pt[1]),x2:fr.px(foot[0]),y2:fr.py(foot[1]),stroke:'var(--ink-muted)','stroke-dasharray':'4 4'},gl);
    mark(svg,fr.px(pt[0]),fr.py(pt[1]),yc,{r:9}); txt(svg,fr.px(pt[0])+14,fr.py(pt[1])-10,'z = '+nm(trim(F(z,2))),'font:700 12px Inter,system-ui;fill:var(--s4);paint-order:stroke;stroke:var(--page);stroke-width:3px');
    /* right: the losses */
    P=panel(svg,490,26,380,300,-2.5,3,-.1,3.5,{xs:.5,ys:.5,xf:v=>Number.isInteger(v)?nm(String(v)):'',yf:v=>Number.isInteger(v)?String(v):'',title:'loss against the score z'});
    const g=el('g',{'clip-path':P.clip},svg);
    el('rect',{x:P.px(0),y:P.y,width:P.px(1)-P.px(0),height:P.h,fill:cvar(K13.edge),opacity:.1},g);
    txt(svg,P.px(.5),P.y+14,'inside the street','font:600 9.5px Inter,system-ui;fill:var(--s7)','middle');
    const hd=`M${P.px(-2.5)},${P.py(3.5)}L${P.px(1)},${P.py(0)}L${P.px(3)},${P.py(0)}`; glowPath(g,hd,cvar(K13.edge),3,!!glow);
    el('path',{d:`M${P.px(-2.5)},${P.py(1)}L${P.px(0)},${P.py(1)}M${P.px(0)},${P.py(0)}L${P.px(3)},${P.py(0)}`,stroke:'var(--ink-2)','stroke-width':2,'stroke-dasharray':'6 5',fill:'none'},g);
    el('circle',{cx:P.px(0),cy:P.py(1),r:3.5,fill:'var(--ink-2)'},g); el('circle',{cx:P.px(0),cy:P.py(0),r:3.5,fill:'none',stroke:'var(--ink-2)','stroke-width':1.5},g);
    txt(svg,P.px(-2.3),P.py(3.2),'hinge max(0, 1 − z)','font:700 11px Inter,system-ui;fill:var(--s7)'); txt(svg,P.px(-2.3),P.py(1)-8,'0/1: count mistakes','font:700 11px Inter,system-ui;fill:var(--ink-2)');
    const zz=Math.max(-2.5,Math.min(3,z)), hl=Math.max(0,1-z), zl=z<0?1:0;
    el('line',{x1:P.px(zz),y1:P.y,x2:P.px(zz),y2:P.y+P.h,stroke:cvar(K13.sv),'stroke-width':1.4,'stroke-dasharray':'3 4'},g);
    glowDot(g,P.px(zz),P.py(Math.min(3.5,hl)),6,cvar(K13.edge),glow); glowDot(g,P.px(zz),P.py(zl),5,'var(--ink-2)',null);
    txt(svg,P.px(zz)+8,P.py(Math.min(3.5,hl))-8,'ξ = '+trim(F(hl,2)),'font:700 12px Inter,system-ui;fill:var(--s4)');
    txt(svg,P.x+P.w/2,P.y+P.h+26,'score z = y(w·x + b)','font:600 10.5px Inter,system-ui;fill:var(--ink-muted)','middle');
    const where=z>1+1e-9?'outside the street — no loss':Math.abs(z-1)<1e-9?'exactly on its edge — still no loss':z>1e-9?'inside the street, correct side — pays '+trim(F(hl,2)):Math.abs(z)<1e-9?'on the centre line — pays 1':'across the line: misclassified — pays '+trim(F(hl,2));
    kv(tbl,[['class',yc>0?'<span class="k-pos">+1 (blue)</span>':'<span class="k-neg">−1 (orange)</span>'],['score z',nm(trim(F(z,3)))],['hinge ξ = max(0, 1 − z)','<b>'+trim(F(hl,3))+'</b>'],['0/1 loss',String(zl)]]);
    verd.className=z>=1-1e-9?'verdict good':(z>=0?'verdict info':'verdict bad'); verd.textContent=(z>=1-1e-9?'good — ':z>=0?'info — ':'bad — ')+where; }
  svgDrag(svg,(x,y)=>{ if(x>440) return false; if(!fr) return false; const X=fr.px(pt[0]),Y=fr.py(pt[1]); if(Math.hypot(x-X,y-Y)>34) return false; drag=true; if(anim){ anim.stop(); anim=null; } },
    (x,y)=>{ if(!drag) return; pt=[Math.max(fr.X0+.05,Math.min(fr.X1-.05,fr.ix(x))),Math.max(fr.Y0+.05,Math.min(fr.Y1-.05,fr.iy(y)))]; draw(); },()=>{ drag=false; });
  document.querySelectorAll('#hg-pre [data-z]').forEach(bt=>bt.addEventListener('click',()=>{ if(anim) anim.stop(); const z=+bt.dataset.z; const s=(z/yc-b)/w[0];        /* x₁ + x₂ for that score; x₁ − x₂ is kept */
    const target=[s/2+(pt[0]-pt[1])/2,s/2-(pt[0]-pt[1])/2].map(v=>Math.max(-.2,Math.min(4.6,v))); const from=pt.slice(); anim=tween(RM?1:700,t=>{ pt=[from[0]+(target[0]-from[0])*t,from[1]+(target[1]-from[1])*t]; draw(); }); }));
  document.getElementById('hg-flip').addEventListener('click',()=>{ yc=-yc; draw(); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();
