/* ================= shared state for §10: the softmax machine and the probability triangle read the same scores ================= */
const S10={z:[2,1,0],T:1,shift:false,subs:[],set(o){ Object.assign(this,o); this.subs.forEach(f=>f(this)); }};
const CLS=[{n:'cat',k:'s1'},{n:'dog',k:'s2'},{n:'rabbit',k:'s7'}];
/* a log-scale temperature slider snaps to the round values people type: 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20 */
const snapT=v=>{ const T=Math.pow(10,v); for(const n of [.05,.1,.2,.25,.5,1,2,5,10,20]) if(Math.abs(T/n-1)<.025) return n; return +T.toFixed(3); };

/* ================= W12 · THE SOFTMAX MACHINE ================= */
(function(){
  const svg=document.getElementById('sm-svg'); if(!svg) return;
  const tbl=document.getElementById('sm-kv'), bars=document.getElementById('sm-bars'), verd=document.getElementById('sm-verdict'), pre=document.getElementById('sm-pre'), shBtn=document.getElementById('sm-shift');
  let lay=null, drag=-1;
  const Z0=-3, Z1=4;
  function draw(){ const {z,T,shift}=S10, m=Math.max(...z), zz=shift?z.map(v=>v-m):z, q=softmax(z,T), ex=zz.map(v=>Math.exp(v/T)), tot=ex.reduce((a,b)=>a+b,0);
    svg.innerHTML=''; const glow=glo(svg), dark=!isLight();
    /* left: scores on a vertical number line */
    const top=40, bot=320, py=v=>bot-(v-Z0)/(Z1-Z0)*(bot-top), bx=[70,125,180];
    for(let v=Z0;v<=Z1;v++){ el('line',{x1:44,y1:py(v),x2:212,y2:py(v),stroke:'var(--grid)','stroke-width':v?1:1.6},svg); txt(svg,38,py(v)+4,nm(String(v)),'font:500 10px Inter,system-ui;fill:var(--ink-muted)','end'); }
    txt(svg,128,24,shift?'scores − max':'scores z','font:700 12px Inter,system-ui;fill:var(--ink-2)','middle');
    zz.forEach((v,i)=>{ const x=bx[i], y0=py(0), y1=py(v), col=cvar(CLS[i].k);
      el('rect',{x:x-17,y:Math.min(y0,y1),width:34,height:Math.max(2,Math.abs(y1-y0)),rx:4,fill:col,opacity:.85,filter:glow||null},svg);
      el('circle',{cx:x,cy:y1,r:15,fill:col,opacity:.15},svg); el('circle',{cx:x,cy:y1,r:7.5,fill:'var(--ink)',stroke:col,'stroke-width':3},svg);
      txt(svg,x,v>=0?y1-14:y1+24,TT(v,2),'font:800 12px Inter,system-ui;fill:var(--ink)','middle'); txt(svg,x,bot+22,CLS[i].n,`font:700 11px Inter,system-ui;fill:${col}`,'middle'); });
    /* the glass */
    const gx=258, gw=92; el('rect',{x:gx,y:top-6,width:gw,height:bot-top+12,rx:16,fill:cvar(K14.mass),opacity:dark?.1:.12,stroke:cvar(K14.mass),'stroke-width':1.5},svg);
    txt(svg,gx+gw/2,top+14,'softmax','font:800 13px Inter,system-ui;fill:var(--s6)','middle');
    txt(svg,gx+gw/2,top+32,T===1?'e^z ÷ total':'e^(z/T) ÷ total','font:600 10px Inter,system-ui;fill:var(--ink-muted)','middle');
    ex.forEach((e,i)=>{ const y=top+78+i*62; txt(svg,gx+gw/2,y,'e^'+(T===1?'':'(')+TT(zz[i],2)+(T===1?'':'/'+TT(T,2)+')'),'font:600 10px Inter,system-ui;fill:var(--ink-2)','middle'); txt(svg,gx+gw/2,y+17,'= '+(e>=100?F(e,1):F(e,3)),`font:800 12px Inter,system-ui;fill:${cvar(CLS[i].k)}`,'middle'); });
    txt(svg,gx+gw/2,bot-4,'total '+(tot>=100?F(tot,1):F(tot,3)),'font:700 11px Inter,system-ui;fill:var(--ink)','middle');
    /* flows */
    zz.forEach((v,i)=>{ const y=top+84+i*62; el('path',{d:`M${bx[i]+20},${py(v)} C ${gx-30},${py(v)} ${gx-40},${y} ${gx-2},${y}`,fill:'none',stroke:cvar(CLS[i].k),'stroke-width':1.6,opacity:.45,'stroke-dasharray':'4 4'},svg);
      const tx=420+i*56+19, ty=bot-q[i]*(bot-top-40)-22; el('path',{d:`M${gx+gw+2},${y} C ${gx+gw+34},${y} ${tx},${Math.min(y,ty)-10} ${tx},${ty}`,fill:'none',stroke:cvar(CLS[i].k),'stroke-width':1.6,opacity:.45,'stroke-dasharray':'4 4'},svg); });
    /* right: probabilities */
    txt(svg,480,24,'probabilities q','font:700 12px Inter,system-ui;fill:var(--ink-2)','middle');
    el('line',{x1:400,y1:bot,x2:580,y2:bot,stroke:'var(--axis)','stroke-width':1.5},svg); el('line',{x1:400,y1:bot-(bot-top-40),x2:580,y2:bot-(bot-top-40),stroke:'var(--ink-muted)','stroke-dasharray':'4 5','stroke-width':1},svg); txt(svg,584,bot-(bot-top-40)+4,'1','font:600 10px Inter,system-ui;fill:var(--ink-muted)');
    q.forEach((p,i)=>{ const x=420+i*56, h=p*(bot-top-40), col=cvar(CLS[i].k); el('rect',{x,y:bot-h,width:38,height:Math.max(1,h),rx:4,fill:col,opacity:.9,filter:glow||null},svg);
      txt(svg,x+19,bot-h-8,F(p,3),'font:800 12px Inter,system-ui;fill:var(--ink)','middle'); txt(svg,x+19,bot+22,CLS[i].n,`font:700 11px Inter,system-ui;fill:${col}`,'middle'); });
    lay={bx,py,iy:Y=>Z0+(bot-Y)/(bot-top)*(Z1-Z0)};
    pbars(bars,q.map((p,i)=>[CLS[i].n,p,cvar(CLS[i].k)]));
    kv(tbl,[['scores z',z.map(v=>TT(v,2)).join(', ')],['temperature T',TT(T,2)],['scores used (z'+(shift?' − max':'')+')/T',zz.map(v=>TT(v/T,2)).join(', ')],['total of the exps',tot>=100?F(tot,2):F(tot,3)],['sum of q','<b>'+F(q.reduce((a,b)=>a+b,0),3)+'</b>']]);
    const top1=Math.max(...q);
    if(shift){ verd.className='verdict good'; verd.textContent='good — subtracting the max moved every score, and not one probability changed: only differences matter'; }
    else if(T<.2){ verd.className='verdict info'; verd.textContent='info — T = '+TT(T,2)+': almost winner-takes-all ('+F(top1,3)+')'; }
    else if(T>5){ verd.className='verdict info'; verd.textContent='info — T = '+TT(T,2)+': almost no opinion — every class near ⅓'; }
    else { verd.className='verdict info'; verd.textContent='info — exp keeps the order and makes everything positive; dividing by the total makes the shares add to 1'; } }
  svgDrag(svg,(x,y)=>{ if(!lay) return false; const {z,shift}=S10, m=Math.max(...z); let best=-1, bd=1e9; lay.bx.forEach((X,i)=>{ const v=shift?z[i]-m:z[i]; const d=Math.hypot(x-X,y-lay.py(v)); if(Math.abs(x-X)<30&&d<bd){ bd=d; best=i; } }); if(best<0) return false; drag=best; pressOnly(pre,null); if(shift){ S10.shift=false; shBtn.setAttribute('aria-pressed','false'); shBtn.textContent='subtract the max: off'; } },
    (x,y)=>{ if(drag<0) return; const z=S10.z.slice(); z[drag]=Math.max(Z0,Math.min(Z1,Math.round(lay.iy(y)*20)/20)); S10.set({z}); },()=>{ drag=-1; });
  bindCtl('sm-T',v=>{ S10.set({T:snapT(v)}); },v=>TT(snapT(v),2));
  document.getElementById('sm-p-base').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); S10.shift=false; shBtn.setAttribute('aria-pressed','false'); shBtn.textContent='subtract the max: off'; S10.set({z:[2,1,0]}); });
  document.getElementById('sm-p-tie').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); S10.set({z:[1.5,1.5,0]}); });
  shBtn.addEventListener('click',()=>{ const on=!S10.shift; shBtn.setAttribute('aria-pressed',on?'true':'false'); shBtn.textContent='subtract the max: '+(on?'on':'off'); S10.set({shift:on}); });
  S10.subs.push(()=>{ draw(); setCtl('sm-T',+Math.log10(S10.T).toFixed(2),()=>TT(S10.T,2)); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W13 · THE PROBABILITY TRIANGLE (3-D) ================= */
(function(){
  const box=document.getElementById('sx-3d'); if(!box) return;
  const tbl=document.getElementById('sx-kv'), verd=document.getElementById('sx-verdict');
  const S=2.5, pos=q=>[q[0]*S,q[2]*S,-q[1]*S];   /* cat → x, rabbit → up, dog → depth */
  let T=1, sc=null, anim=null;
  function build(){ sc=null; const narrow=box.clientWidth<520, r=narrow?10:8.1, th=2.25, ph=.98, look=[.8,1.0,-.8];
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[look[0]+r*Math.sin(ph)*Math.sin(th),look[1]+r*Math.cos(ph),look[2]+r*Math.sin(ph)*Math.cos(th)],look,fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx), c=ctx.colors;
        starfield(ctx,240,16); const fl=glassFloor(ctx,7,{div:28}); fl.grid.position.set(.8,-.01,-.8); fl.slab.position.set(.8,-.014,-.8);
        /* axes */
        [[[1,0,0],0],[[0,1,0],1],[[0,0,1],2]].forEach(([e,i])=>{ const tip=pos([e[0]*1.22,e[1]*1.22,e[2]*1.22]); root.add(CIN.prim.arrow(ctx,[0,0,0],tip,hx(CLS[i].k),{radius:.02,head:.16}));
          root.add(lab(ctx,'P('+CLS[i].n+')',[tip[0]*1.08,tip[1]*1.08+.12,tip[2]*1.08],{size:19,bg:false,color:c[CLS[i].k],scale:.0068})); });
        /* the glass triangle, tinted by its corners */
        const g=new THREE.BufferGeometry(), V=[pos([1,0,0]),pos([0,1,0]),pos([0,0,1])]; g.setAttribute('position',new THREE.Float32BufferAttribute(V.flat(),3));
        const cols=[0,1,2].map(i=>{ const K=new THREE.Color(hx(CLS[i].k)); K.convertSRGBToLinear(); return [K.r,K.g,K.b]; }); g.setAttribute('color',new THREE.Float32BufferAttribute(cols.flat(),3));
        root.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:isLight?.22:.2,side:THREE.DoubleSide,depthWrite:false})));
        [[0,1],[1,2],[2,0]].forEach(([a,b])=>root.add(tubeLine(ctx,[V[a],V[b]],isLight?hx('ink2'):0xffffff,.012,.7)));
        [0,1,2].forEach(i=>{ const e=[0,0,0]; e[i]=1; root.add(lab(ctx,CLS[i].n+' = 1',pos(e).map((v,k)=>v+(k===1?.28:0)),{size:16,color:c[CLS[i].k],scale:.006,depthTest:false})); });
        const ctr=pos([1/3,1/3,1/3]); root.add(CIN.prim.dot(ctx,ctr,hx('ink2'),.04)); root.add(lab(ctx,'⅓, ⅓, ⅓',[ctr[0],ctr[1]+.25,ctr[2]],{size:15,color:c.muted,scale:.0058,depthTest:false}));
        const pathG=new THREE.Group(), dropG=new THREE.Group(); root.add(pathG,dropG);
        const pt=bead(ctx,[0,0,0],K14.mean,.085); overlay(pt,12); root.add(pt);
        sc={ctx,THREE,hx,pathG,dropG,pt,handle:null}; sc.hud=hud(box); hint(box,'drag to orbit'); paint(true); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM||anim) return false; const o=sc.handle.ctx.orbit; o.sph.theta=2.25+.28*Math.sin(t*.2); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; }); }
    return handle; }
  function paint(path){ if(!sc) return; const {ctx,THREE,hx}=sc, q=softmax(S10.z,T);
    if(path!==false){ clearGroup(sc.pathG); const pts=[]; for(let k=0;k<=160;k++){ const t=Math.pow(10,-1.5+3*k/160); pts.push(pos(softmax(S10.z,t)).map((v,i)=>v+(i===1?.004:0))); } sc.pathG.add(tubeLine(ctx,pts,hx(K14.mass),.018,.95));
      [.5,1,2].forEach(t=>{ const q2=pos(softmax(S10.z,t)); sc.pathG.add(overlay(CIN.prim.dot(ctx,q2,hx('ink'),.03),10)); sc.pathG.add(lab(ctx,'T = '+t,[q2[0],q2[1]+.2,q2[2]],{size:14,color:ctx.colors.ink2,scale:.0052,depthTest:false})); }); }
    const p=pos(q); sc.pt.position.set(...p); clearGroup(sc.dropG);
    [[p[0],0,0],[0,p[1],0],[0,0,p[2]]].forEach(f=>sc.dropG.add(tubeLine(ctx,[p,f],hx('ink2'),.005,.5)));
    sc.hud.innerHTML='T = <b>'+TT(T,2)+'</b> · q = ('+q.map(v=>F(v,3)).join(', ')+')'; RR(ctx); }
  function readout(){ const q=softmax(S10.z,T), H=H2(q);
    kv(tbl,[['scores z',S10.z.map(v=>TT(v,2)).join(', ')],['temperature T','<b>'+TT(T,2)+'</b>'],['q (cat, dog, rabbit)',q.map(v=>F(v,3)).join(', ')],['distance to the centre',F(Math.hypot(q[0]-1/3,q[1]-1/3,q[2]-1/3),3)]]);
    if(T<=.12){ verd.className='verdict info'; verd.textContent='info — cold: the point hugs the winner\'s corner (argmax)'; }
    else if(T>=8){ verd.className='verdict info'; verd.textContent='info — hot: the point is almost at the centre, ⅓ each'; }
    else { verd.className='verdict good'; verd.textContent='good — every softmax output lives on this triangle; the glowing path is every temperature at once'; } }
  function setT(v){ T=v; setCtl('sx-T',+Math.log10(T).toFixed(2),()=>TT(T,2)); paint(false); readout(); }
  bindCtl('sx-T',v=>{ if(anim){ anim.stop(); anim=null; } T=snapT(v); paint(false); readout(); },v=>TT(snapT(v),2));
  document.getElementById('sx-play').addEventListener('click',()=>{ if(anim) anim.stop(); if(RM){ setT(20); return; } anim=tween(4200,u=>setT(+(.05*Math.pow(400,u)).toFixed(3)),()=>{ anim=null; setT(20); }); });
  S10.subs.push(()=>{ T=S10.T; setCtl('sx-T',+Math.log10(T).toFixed(2),()=>TT(T,2)); paint(true); readout(); });
  window.U14X={get:()=>({T,q:softmax(S10.z,T)})};
  readout();
  const ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<520)!==(rw<520)) remount(ST); rw=W; });
})();

/* ================= W14 · ENTROPY: THE AVERAGE SURPRISE (a coin curve + the dome over the triangle) ================= */
(function(){
  const svg=document.getElementById('en-svg'), box=document.getElementById('en-3d'); if(!svg||!box) return;
  const tbl=document.getElementById('en-kv'), bars=document.getElementById('en-bars'), verd=document.getElementById('en-verdict'), pre=document.getElementById('en-pre');
  let pb=.9, q3=[.9,.1,0], fr=null, drag=false, sc=null;
  const Hb=p=>H2([p,1-p]);
  /* the triangle on the floor: corners for outcome 1, 2, 3 */
  const R=2.1, CORN=[[0,R],[-R*Math.sin(2*Math.PI/3),R*Math.cos(2*Math.PI/3)],[R*Math.sin(2*Math.PI/3),R*Math.cos(2*Math.PI/3)]], HZ=1.25;
  const at=q=>[q[0]*CORN[0][0]+q[1]*CORN[1][0]+q[2]*CORN[2][0],q[0]*CORN[0][1]+q[1]*CORN[1][1]+q[2]*CORN[2][1]];
  function bary(x,y){ const [A,B,C]=CORN, d=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1]); let a=((B[1]-C[1])*(x-C[0])+(C[0]-B[0])*(y-C[1]))/d, b=((C[1]-A[1])*(x-C[0])+(A[0]-C[0])*(y-C[1]))/d, c=1-a-b;
    let q=[a,b,c].map(v=>Math.max(0,v)); const s=q[0]+q[1]+q[2]; return q.map(v=>v/s); }
  function draw(){ fr=frame(svg,0,1,0,1.12,{l:40,r:150,t:16,b:30,xs:.1,ys:.25,xf:v=>trim(F(v,1)),yf:v=>trim(F(v,2))});
    const g=el('g',{'clip-path':fr.clip},svg); let d='', f='M'+fr.px(0)+','+fr.py(0);
    for(let i=0;i<=300;i++){ const p=i/300, h=Hb(p); d+=(i?'L':'M')+fr.px(p).toFixed(1)+','+fr.py(h).toFixed(1); f+='L'+fr.px(p).toFixed(1)+','+fr.py(h).toFixed(1); } f+='L'+fr.px(1)+','+fr.py(0)+'Z';
    el('path',{d:f,fill:cvar(K14.mass),opacity:isLight()?.18:.16},g); glowPath(g,d,cvar(K14.mass),2.6,!isLight());
    const X=fr.px(pb), Y=fr.py(Hb(pb)); el('line',{x1:X,y1:fr.py(0),x2:X,y2:Y,stroke:'var(--ink)','stroke-width':1.5},svg);
    el('circle',{cx:X,cy:Y,r:14,fill:'var(--ink)',opacity:.12},svg); el('circle',{cx:X,cy:Y,r:7,fill:'var(--ink)',stroke:cvar(K14.mean),'stroke-width':2.4},svg);
    txt(svg,X+(pb>.8?-12:12),Y-12,F(Hb(pb),3)+' bits','font:800 12px Inter,system-ui;fill:var(--s4)',pb>.8?'end':'start');
    txt(svg,fr.px(1),fr.H-4,'coin: chance of heads p →','font:600 11px Inter,system-ui;fill:var(--ink-muted)','end');
    /* the two surprises */
    const sx=fr.W-128, sy=fr.T+6, sh=[pb>0?-log2(pb):Infinity,pb<1?-log2(1-pb):Infinity], hm=7;
    txt(svg,sx,sy+8,'surprise (bits)','font:700 10.5px Inter,system-ui;fill:var(--ink-muted)');
    ['heads','tails'].forEach((n,i)=>{ const v=sh[i], hh=Math.min(hm,v)/hm*150, x=sx+10+i*58; el('rect',{x,y:sy+170-hh,width:36,height:Math.max(1,hh),rx:4,fill:cvar(K14.loss),opacity:.85},svg);
      txt(svg,x+18,sy+164-hh,isFinite(v)?F(v,2):'∞','font:800 11px Inter,system-ui;fill:var(--ink)','middle'); txt(svg,x+18,sy+186,n,'font:600 10px Inter,system-ui;fill:var(--ink-2)','middle'); txt(svg,x+18,sy+199,'p = '+trim(F(i?1-pb:pb,3)),'font:500 9.5px Inter,system-ui;fill:var(--ink-muted)','middle'); }); }
  function build(){ sc=null; const narrow=box.clientWidth<520, r=narrow?8.6:6.9, th=.35, ph=.92, look=[0,.5,0];
    const handle=CIN.stage3d(box,{fill:true,autoRotate:0,camera:{pos:[r*Math.sin(ph)*Math.sin(th),look[1]+r*Math.cos(ph),r*Math.sin(ph)*Math.cos(th)],look,fov:34},
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx), c=ctx.colors;
        starfield(ctx,200,14); glassFloor(ctx,6,{div:24});
        /* the dome: a triangular grid over the simplex, height = entropy */
        const n=48, P=[], C=[], I=[], idx={}; let k=0; const white=new THREE.Color(1,1,1);
        for(let i=0;i<=n;i++) for(let j=0;j<=n-i;j++){ const q=[i/n,j/n,(n-i-j)/n], p=at(q), h=H2(q); P.push(p[0],h*HZ,-p[1]); const K=new THREE.Color(CIN.ramp(h/log2(3),c.s1,c.s6,c.s4)); if(isLight) K.lerp(white,.3); K.convertSRGBToLinear(); C.push(K.r,K.g,K.b); idx[i+','+j]=k++; }
        for(let i=0;i<n;i++) for(let j=0;j<n-i;j++){ const a=idx[i+','+j], b=idx[(i+1)+','+j], cc=idx[i+','+(j+1)]; I.push(a,b,cc); if(j<n-i-1){ const d=idx[(i+1)+','+(j+1)]; I.push(b,d,cc); } }
        const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3)); geo.setIndex(I); geo.computeVertexNormals();
        const dome=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:isLight?.85:.8,roughness:.5,side:THREE.DoubleSide,depthWrite:false})); root.add(dome);
        root.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:isLight?0x0d1020:0xffffff,wireframe:true,transparent:true,opacity:isLight?.06:.05})));
        /* the floor triangle */
        const tri=[0,1,2].map(i=>[CORN[i][0],.012,-CORN[i][1]]); [[0,1],[1,2],[2,0]].forEach(([a,b])=>root.add(tubeLine(ctx,[tri[a],tri[b]],hx(K14.mass),.012,.8)));
        ['outcome 1','outcome 2','outcome 3'].forEach((t,i)=>root.add(lab(ctx,t,[CORN[i][0]*1.2,.05,-CORN[i][1]*1.2],{size:17,bg:false,color:c.muted,scale:.006})));
        const top=[0,log2(3)*HZ,0]; root.add(lab(ctx,'log₂3 ≈ 1.585 bits',[top[0],top[1]+.3,top[2]],{size:16,color:c.s4,scale:.006,depthTest:false}));
        const hit=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({visible:false})); hit.rotation.x=-Math.PI/2; root.add(hit);
        const pt=bead(ctx,[0,0,0],K14.mean,.08); overlay(pt,12); root.add(pt); const foot=CIN.prim.dot(ctx,[0,0,0],hx('ink'),.045); root.add(foot); const stem=liveTube(ctx,hx('ink'),.007,.7); root.add(stem);
        sc={ctx,THREE,hit,pt,foot,stem,handle:null}; sc.hud=hud(box); hint(box,'drag the point · drag elsewhere to orbit'); paint(); },
      update(ctx,t){ if(!sc||!sc.handle||sc.user||RM) return false; const o=sc.handle.ctx.orbit; o.sph.theta=.35+.25*Math.sin(t*.2); o.place(); return true; } });
    if(handle&&sc){ sc.handle=handle; handle.ctx.renderer.domElement.addEventListener('pointerdown',()=>{ if(sc) sc.user=true; });
      const pick=picker(handle,()=>sc&&sc.hit);
      grab(handle,e=>{ const p=pick(e); if(!p) return false; const a=at(q3); if(Math.hypot(p.x-a[0],-p.z-a[1])>.5) return false; pressOnly(pre,null); return true; },
        e=>{ const p=pick(e); if(!p) return; q3=bary(p.x,-p.z).map(v=>Math.round(v*100)/100); const s=q3[0]+q3[1]+q3[2]; q3=q3.map(v=>v/s); paint(); readout(); },()=>{}); }
    return handle; }
  function paint(){ if(!sc) return; const {THREE}=sc, a=at(q3), h=H2(q3)*HZ; sc.pt.position.set(a[0],h+.02,-a[1]); sc.foot.position.set(a[0],.02,-a[1]); aimTube(THREE,sc.stem,[a[0],.02,-a[1]],[a[0],Math.max(.03,h),-a[1]]);
    sc.hud.innerHTML='H('+q3.map(v=>trim(F(v,2))).join(', ')+') = <b>'+F(H2(q3),3)+'</b> bits'; RR(sc.ctx); }
  function readout(){ pbars(bars,q3.map((p,i)=>['outcome '+(i+1),p,cvar(K14.mass)]));
    kv(tbl,[['coin p · its entropy',trim(F(pb,3))+' · <b>'+F(Hb(pb),3)+'</b> bits'],['three outcomes',q3.map(v=>trim(F(v,3))).join(', ')],['their entropy',`<b>${F(H2(q3),3)}</b> bits = ${F(H2(q3)*Math.LN2,3)} nats`],['the most it can be','log₂3 ≈ 1.585 bits']]);
    const h=H2(q3);
    if(h<1e-9){ verd.className='verdict good'; verd.textContent='good — a sure thing: zero surprise, zero entropy'; }
    else if(Math.abs(h-log2(3))<1e-3){ verd.className='verdict good'; verd.textContent='good — three equal chances: the top of the dome, 1.585 bits, as uncertain as three outcomes can be'; }
    else { verd.className='verdict info'; verd.textContent='info — the coin: '+F(Hb(pb),3)+' bits. The closer to a corner, the lower the dome: more predictable, less surprise on average.'; } }
  function all(){ draw(); paint(); readout(); }
  svgDrag(svg,(x,y)=>{ if(!fr) return false; if(x<fr.L-6||x>fr.W-fr.R+6) return false; drag=true; pressOnly(pre,null); },x=>{ if(!drag) return; pb=Math.max(0,Math.min(1,Math.round(fr.ix(x)*100)/100)); draw(); readout(); },()=>{ drag=false; });
  [['en-p-fair',.5,[.5,.5,0]],['en-p-9010',.9,[.9,.1,0]],['en-p-uni3',.5,[1/3,1/3,1/3]],['en-p-sure',1,[1,0,0]]].forEach(([id,p,q])=>document.getElementById(id).addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); pb=p; q3=q.slice(); all(); }));
  window.U14E={get:()=>({pb,Hb:Hb(pb),q3:q3.slice(),H3:H2(q3)})};
  draw(); readout(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const ST=mountStage(box,build); let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<520)!==(rw<520)) remount(ST); rw=W; });
})();

/* ================= W15 · PAYING FOR THE WRONG BELIEF (cross-entropy, KL both ways, and fitting one bell to two humps) ================= */
(function(){
  const svg=document.getElementById('kl-svg'), fsvg=document.getElementById('kl-fsvg'); if(!svg) return;
  const tbl=document.getElementById('kl-kv'), stack=document.getElementById('kl-stack'), verd=document.getElementById('kl-verdict'), pre=document.getElementById('kl-pre'), wid=svg.closest('.widget');
  let k=2, p=[.5,.5], q=[.1,.9], tab='bars', lay=null, drag=null, fmu=.8, fsg=1, anim=null;
  const NAMES=()=>k===2?['rain','dry']:['A','B','C','D','E'].slice(0,k);
  const norm1=a=>{ const s=a.reduce((x,y)=>x+y,0); return a.map(v=>v/s); };
  function setK(n){ const base=[.1,.3,.2,.25,.15], bq=[.3,.1,.25,.15,.2]; k=n; if(n===2){ p=[.5,.5]; q=[.1,.9]; } else { p=norm1(base.slice(0,n)); q=norm1(bq.slice(0,n)); } }
  function drawBars(){ svg.innerHTML=''; const glow=glo(svg), L=50, Rr=20, T0=34, B0=290, W=600, gw=(W-L-Rr)/k, py=v=>B0-v*(B0-T0);
    for(let v=0;v<=1.001;v+=.25){ el('line',{x1:L,y1:py(v),x2:W-Rr,y2:py(v),stroke:'var(--grid)'},svg); txt(svg,L-6,py(v)+4,trim(F(v,2)),'font:500 10px Inter,system-ui;fill:var(--ink-muted)','end'); }
    const bw=Math.min(46,gw*.3), cx=[];
    NAMES().forEach((nmx,i)=>{ const c=L+gw*(i+.5); cx.push(c);
      [[p,K14.p,-1],[q,K14.q,1]].forEach(([a,key,s])=>{ const x=c+s*(bw/2+3)-bw/2, h=a[i]*(B0-T0); el('rect',{x,y:B0-h,width:bw,height:Math.max(1,h),rx:5,fill:cvar(key),opacity:.88,filter:glow||null},svg);
        el('rect',{x:x+bw*.2,y:B0-h-5,width:bw*.6,height:10,rx:5,fill:'var(--ink)',opacity:.9},svg); txt(svg,x+bw/2,B0-h-12,F(a[i],2),`font:800 11px Inter,system-ui;fill:${cvar(key)}`,'middle'); });
      txt(svg,c,B0+20,nmx,'font:700 12px Inter,system-ui;fill:var(--ink-2)','middle'); });
    txt(svg,L,20,'truth p','font:800 12px Inter,system-ui;fill:var(--s1)'); txt(svg,L+62,20,'belief q','font:800 12px Inter,system-ui;fill:var(--s2)');
    lay={cx,bw,py,iy:Y=>(B0-Y)/(B0-T0)};
    const Hp=H2(p), Hpq=CE2(p,q), Kpq=KL2(p,q), Kqp=KL2(q,p), Hq=H2(q), mx=Math.max(Hpq,Hq+Kqp,1);
    const row=(nmx,segs,val)=>`<div class="sb"><span class="nm">${nmx}</span><span class="track">${segs.map(([v,c])=>`<i style="width:${(100*v/mx).toFixed(2)}%;background:${c}"></i>`).join('')}</span><span class="v">${val}</span></div>`;
    stack.innerHTML=row('H(p)',[[Hp,cvar(K14.p)]],F(Hp,3))+row('H(p, q)',[[Hp,cvar(K14.p)],[Kpq,cvar(K14.loss)]],F(Hpq,3))+row('KL(p‖q)',[[Kpq,cvar(K14.loss)]],F(Kpq,3))+row('KL(q‖p)',[[Kqp,cvar(K14.loss)]],F(Kqp,3));
    kv(tbl,[['truth p',p.map(v=>trim(F(v,3))).join(', ')],['belief q',q.map(v=>trim(F(v,3))).join(', ')],['H(p) — unavoidable',F(Hp,3)+' bits'],['H(p, q) = H(p) + KL','<b>'+F(Hpq,3)+'</b> bits'],['KL(p‖q) — the price','<b>'+F(Kpq,3)+'</b> bits'],['KL(q‖p) — the other way',F(Kqp,3)+' bits']]);
    if(Kpq<5e-4){ verd.className='verdict good'; verd.textContent='good — belief = truth: KL is 0 and your surprise is just H(p)'; }
    else { verd.className='verdict info'; verd.textContent='info — you pay '+F(Kpq,3)+' extra bits per day for the wrong belief; the other direction would cost '+F(Kqp,3)+' — KL is not symmetric'; } }
  /* ---- the fit tab ---- */
  const XS=[]; for(let i=0;i<=1200;i++) XS.push(-7+14*i/1200); const DX=14/1200;
  const PX=XS.map(x=>.5*npdf(x,-2,.6)+.5*npdf(x,2,.6));
  function kls(m,s){ let f=0,r=0; for(let i=0;i<XS.length;i++){ const a=Math.max(PX[i],1e-300), b=Math.max(npdf(XS[i],m,s),1e-300); f+=a*Math.log(a/b); r+=b*Math.log(b/a); } return [f*DX,r*DX]; }
  function fit(which,m0,s0){ let m=m0, s=s0, best=kls(m,s)[which], st=[.5,.3];
    for(let it=0;it<400&&(st[0]>1e-5||st[1]>1e-5);it++){ let moved=false; for(const [dm,ds] of [[st[0],0],[-st[0],0],[0,st[1]],[0,-st[1]]]){ const mm=m+dm, ss=Math.max(.2,s+ds), v=kls(mm,ss)[which]; if(v<best-1e-12){ best=v; m=mm; s=ss; moved=true; break; } } if(!moved){ st=[st[0]/2,st[1]/2]; } } return [m,s]; }
  function drawFit(){ const fr=frame(fsvg,-6,6,0,.8,{l:40,r:14,t:18,b:30,xs:1,ys:.2,yf:v=>trim(F(v,1))}); const g=el('g',{'clip-path':fr.clip},fsvg);
    const path=f=>XS.map((x,i)=>(i?'L':'M')+fr.px(x).toFixed(1)+','+fr.py(Math.min(.8,f(x,i))).toFixed(1)).join('');
    const area=f=>path(f)+'L'+fr.px(7)+','+fr.py(0)+'L'+fr.px(-7)+','+fr.py(0)+'Z';
    el('path',{d:area((x,i)=>PX[i]),fill:cvar(K14.p),opacity:isLight()?.22:.2},g); glowPath(g,path((x,i)=>PX[i]),cvar(K14.p),2.4,!isLight());
    el('path',{d:area(x=>npdf(x,fmu,fsg)),fill:cvar(K14.q),opacity:isLight()?.2:.18},g); glowPath(g,path(x=>npdf(x,fmu,fsg)),cvar(K14.q),2.6,!isLight());
    txt(fsvg,fr.px(-2),fr.py(.72)-4,'truth p: two humps','font:700 11px Inter,system-ui;fill:var(--s1)','middle'); txt(fsvg,fr.px(Math.max(-5,Math.min(5,fmu))),fr.py(Math.min(.74,npdf(fmu,fmu,fsg)))-10,'one bell q','font:700 11px Inter,system-ui;fill:var(--s2)','middle');
    const [f,r]=kls(fmu,fsg);
    kv(tbl,[['bell q: middle, spread',F(fmu,2)+', '+F(fsg,2)],['KL(p‖q) (nats)','<b>'+F(f,3)+'</b>'],['KL(q‖p) (nats)','<b>'+F(r,3)+'</b>'],['KL(p‖q) is smallest at','middle 0.00, spread 2.09'],['KL(q‖p) is smallest at','middle ±2.00, spread 0.60']]);
    const cov=Math.abs(fmu)<.02&&Math.abs(fsg-2.088)<.02, lock=Math.abs(Math.abs(fmu)-1.997)<.03&&Math.abs(fsg-.605)<.02;
    verd.className='verdict '+(cov||lock?'good':'info');
    verd.textContent=cov?'good — minimising KL(p‖q): the bell spreads to cover both humps (mass-covering), even though it puts mass in the empty middle':lock?'good — minimising KL(q‖p): the bell locks onto one hump and ignores the other (mode-seeking)':'info — press a fit button, or move the bell yourself and watch both KLs'; }
  function draw(){ if(tab==='bars') drawBars(); else drawFit(); }
  svgDrag(svg,(x,y)=>{ if(!lay) return false; let best=null, bd=1e9; lay.cx.forEach((c,i)=>{ [[-1,'p'],[1,'q']].forEach(([s,w])=>{ const bx=c+s*(lay.bw/2+3); const d=Math.abs(x-bx); if(d<lay.bw*.8&&d<bd){ bd=d; best=[w,i]; } }); }); if(!best) return false; drag=best; pressOnly(pre,null); },
    (x,y)=>{ if(!drag) return; const [w,i]=drag, a=w==='p'?p:q, v=Math.max(.01,Math.min(.99-.01*(k-2),lay.iy(y))), rest=a.reduce((s,t,j)=>j===i?s:s+t,0), out=a.map((t,j)=>j===i?v:t/rest*(1-v)); if(w==='p') p=out; else q=out; drawBars(); },()=>{ drag=null; });
  bindCtl('kl-k',v=>{ setK(v); pressOnly(pre,null); drawBars(); },v=>String(v));
  document.getElementById('kl-p-mumbai').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); setK(2); setCtl('kl-k',2,()=>'2'); drawBars(); });
  document.getElementById('kl-p-match').addEventListener('click',e=>{ pressOnly(pre,e.currentTarget); q=p.slice(); drawBars(); });
  document.getElementById('kl-swap').addEventListener('click',()=>{ const t=p; p=q; q=t; drawBars(); });
  const fitGo=(which)=>{ if(anim) anim.stop(); const tgt=which===0?fit(0,.3,1.5):fit(1,fmu>=-.05?1.6:-1.6,.8), a=[fmu,fsg]; anim=tween(RM?1:1500,u=>{ fmu=a[0]+(tgt[0]-a[0])*u; fsg=a[1]+(tgt[1]-a[1])*u; setCtl('kl-mu',+fmu.toFixed(2),v=>trim(F(v,2))); setCtl('kl-sig',+fsg.toFixed(2),v=>trim(F(v,2))); drawFit(); },()=>{ anim=null; fmu=tgt[0]; fsg=tgt[1]; drawFit(); }); };
  document.getElementById('kl-fwd').addEventListener('click',()=>fitGo(0));
  document.getElementById('kl-rev').addEventListener('click',()=>fitGo(1));
  bindCtl('kl-mu',v=>{ if(anim){ anim.stop(); anim=null; } fmu=v; drawFit(); },v=>trim(F(v,2)));
  bindCtl('kl-sig',v=>{ if(anim){ anim.stop(); anim=null; } fsg=v; drawFit(); },v=>trim(F(v,2)));
  tabs(document.getElementById('kl-tabs'),t=>{ tab=t; showTab(wid,t); draw(); });
  window.U14K={get:()=>({p:p.slice(),q:q.slice(),H:H2(p),CE:CE2(p,q),KL:KL2(p,q),KLr:KL2(q,p),fmu,fsg,kls:kls(fmu,fsg)}),fit};
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ================= W16 · TRAIN A SOFTMAX CLASSIFIER (the flagship: q − y, live) ================= */
(function(){
  const svg=document.getElementById('tr-svg'); if(!svg) return;
  const lsvg=document.getElementById('tr-loss'), tbl=document.getElementById('tr-kv'), bars=document.getElementById('tr-bars'), verd=document.getElementById('tr-verdict'), pre=document.getElementById('tr-pre');
  const rnd=seeded(3141), DATA=[], CEN=[[-1.6,-1.0],[1.6,-1.0],[0,1.6]];
  CEN.forEach((c,k)=>{ for(let i=0;i<25;i++) DATA.push({x:[c[0]+.8*gauss2(rnd),c[1]+.8*gauss2(rnd)],y:k}); });
  let W=[[0,0],[0,0],[0,0]], B=[0,0,0], step=0, hist=[], lr=.5, Tp=1, probe=[.6,.25], fr=null, drag=false, run=null;
  const scores=(x,T)=>[0,1,2].map(k=>(W[k][0]*x[0]+W[k][1]*x[1]+B[k])/(T||1));
  function lossAcc(){ let L=0, ok=0; DATA.forEach(d=>{ const q=softmax(scores(d.x)); L-=Math.log(Math.max(1e-300,q[d.y])); if(q.indexOf(Math.max(...q))===d.y) ok++; }); return [L/DATA.length,ok/DATA.length]; }
  function gdStep(){ const gW=[[0,0],[0,0],[0,0]], gB=[0,0,0], n=DATA.length;
    DATA.forEach(d=>{ const q=softmax(scores(d.x)); for(let k=0;k<3;k++){ const e=q[k]-(k===d.y?1:0); gW[k][0]+=e*d.x[0]/n; gW[k][1]+=e*d.x[1]/n; gB[k]+=e/n; } });
    for(let k=0;k<3;k++){ W[k][0]-=lr*gW[k][0]; W[k][1]-=lr*gW[k][1]; B[k]-=lr*gB[k]; } step++; hist.push(lossAcc()[0]); }
  const cols=()=>[0,1,2].map(k=>hexRGB(cssv(CLS[k].k)));
  function draw(){ fr=eqFrame(svg,0,.2,4.2,{l:30,r:12,t:12,b:26,xs:1,ys:1}); const g=el('g',{'clip-path':fr.clip},svg), light=isLight(), C=cols();
    /* belief map */
    const nx=120, ny=Math.round(nx*(fr.H-fr.T-fr.B)/(fr.W-fr.L-fr.R)), cv=document.createElement('canvas'); cv.width=nx; cv.height=ny; const cg=cv.getContext('2d'), im=cg.createImageData(nx,ny);
    for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ const x=fr.X0+(i+.5)/nx*(fr.X1-fr.X0), y=fr.Y1-(j+.5)/ny*(fr.Y1-fr.Y0), q=softmax(scores([x,y],Tp)), o=4*(j*nx+i), m=Math.max(...q);
      for(let c=0;c<3;c++) im.data[o+c]=Math.round(q[0]*C[0][c]+q[1]*C[1][c]+q[2]*C[2][c]); im.data[o+3]=Math.round(255*((light?.1:.12)+(light?.34:.42)*Math.pow((m-1/3)/(2/3),1.3))); }
    cg.putImageData(im,0,0); const img=el('image',{x:fr.L,y:fr.T,width:fr.W-fr.L-fr.R,height:fr.H-fr.T-fr.B,preserveAspectRatio:'none'},g); img.setAttribute('href',cv.toDataURL());
    /* the 50% borders (where the top two classes tie) */
    const segs=contourSegs((x,y)=>{ const z=scores([x,y]); const s=z.slice().sort((a,b)=>b-a); return s[0]-s[1]; },[.02],fr.X0,fr.X1,fr.Y0,fr.Y1,80);
    const d=segs[0].segs.map(([a,b,c2,e])=>'M'+fr.px(a).toFixed(1)+','+fr.py(b).toFixed(1)+'L'+fr.px(c2).toFixed(1)+','+fr.py(e).toFixed(1)).join('');
    if(d&&step>0) el('path',{d,stroke:'var(--ink)','stroke-width':1.6,opacity:.55,fill:'none'},g);
    /* the points: disc, diamond, triangle */
    DATA.forEach(p=>{ const X=fr.px(p.x[0]), Y=fr.py(p.x[1]), col=cvar(CLS[p.y].k), s=6;
      if(p.y===0) el('circle',{cx:X,cy:Y,r:s,fill:col,stroke:'var(--page)','stroke-width':1.3},g);
      else if(p.y===1) el('rect',{x:X-s*.85,y:Y-s*.85,width:s*1.7,height:s*1.7,transform:`rotate(45 ${X} ${Y})`,fill:col,stroke:'var(--page)','stroke-width':1.3},g);
      else el('path',{d:`M${X},${Y-s*1.15}L${X+s*1.05},${Y+s*.75}L${X-s*1.05},${Y+s*.75}Z`,fill:col,stroke:'var(--page)','stroke-width':1.3},g); });
    /* the probe */
    const X=fr.px(probe[0]), Y=fr.py(probe[1]); el('circle',{cx:X,cy:Y,r:18,fill:'var(--ink)',opacity:.14},svg); el('circle',{cx:X,cy:Y,r:8.5,fill:'var(--ink)',stroke:cvar(K14.mean),'stroke-width':3},svg);
    txt(svg,fr.L+8,fr.T+18,step?'after '+step+' steps':'untrained: ⅓ everywhere','font:700 12px Inter,system-ui;fill:var(--ink)');
    drawLoss(); readout(); }
  function drawLoss(){ const top=1.15, n=Math.max(60,hist.length), f=frame(lsvg,0,n,0,top,{l:30,r:8,t:10,b:22,xs:n>150?100:20,ys:.5,yf:v=>trim(F(v,1)),xf:v=>String(v)});
    if(hist.length){ const d=[[0,Math.log(3)]].concat(hist.map((v,i)=>[i+1,v])).map((p,i)=>(i?'L':'M')+f.px(p[0]).toFixed(1)+','+f.py(Math.min(top,p[1])).toFixed(1)).join(''); glowPath(el('g',{'clip-path':f.clip},lsvg),d,cvar(K14.loss),2.2,!isLight()); }
    txt(lsvg,f.W-f.R-4,f.T+12,'loss','font:700 10px Inter,system-ui;fill:var(--critical)','end'); }
  function readout(){ const q=softmax(scores(probe,Tp)), [L,acc]=lossAcc();
    pbars(bars,q.map((p,i)=>['class '+'ABC'[i],p,cvar(CLS[i].k)]));
    kv(tbl,[['steps',String(step)],['average loss (nats)','<b>'+F(L,3)+'</b>'],['training points right',Math.round(acc*DATA.length)+' of '+DATA.length],['probe at',vecS2(probe)],['prediction temperature',TT(Tp,2)]]);
    if(!step){ verd.className='verdict info'; verd.textContent='info — untrained: every class gets ⅓ everywhere, loss ln 3 ≈ 1.099'; }
    else if(L<.35){ verd.className='verdict good'; verd.textContent='good — '+step+' steps of "prediction minus truth": loss '+F(L,3)+', soft edges only where the classes meet'; }
    else { verd.className='verdict info'; verd.textContent='info — learning: each step moves every score by q − y, and the loss falls ('+F(L,3)+')'; } }
  const vecS2=v=>'('+v.map(x=>F(x,2)).join(', ')+')';
  function stop(){ if(run){ cancelAnimationFrame(run.raf); run=null; } }
  function train(){ stop(); if(RM){ for(let i=0;i<200;i++) gdStep(); draw(); return; } const target=step+200, t0=performance.now(); run={raf:0};
    const fr2=ts=>{ if(!run) return; const want=Math.min(target,Math.round(target-200+200*Math.min(1,(ts-t0)/3500))); while(step<want) gdStep(); draw(); if(step<target) run.raf=requestAnimationFrame(fr2); else run=null; };
    run.raf=requestAnimationFrame(fr2); }
  svgDrag(svg,(x,y)=>{ if(!fr) return false; if(Math.hypot(x-fr.px(probe[0]),y-fr.py(probe[1]))>30) return false; drag=true; },(x,y)=>{ if(!drag) return; probe=[Math.max(fr.X0+.1,Math.min(fr.X1-.1,Math.round(fr.ix(x)*20)/20)),Math.max(fr.Y0+.1,Math.min(fr.Y1-.1,Math.round(fr.iy(y)*20)/20))]; draw(); },()=>{ drag=false; });
  document.getElementById('tr-run').addEventListener('click',train);
  document.getElementById('tr-step').addEventListener('click',()=>{ stop(); gdStep(); draw(); });
  document.getElementById('tr-reset').addEventListener('click',()=>{ stop(); W=[[0,0],[0,0],[0,0]]; B=[0,0,0]; step=0; hist=[]; draw(); });
  bindCtl('tr-lr',v=>{ lr=v; },v=>trim(F(v,2)));
  bindCtl('tr-T',v=>{ Tp=v; draw(); },v=>trim(F(v,2)));
  window.U14T={get:()=>({step,loss:lossAcc()[0],acc:lossAcc()[1],probe:softmax(scores(probe,Tp))}),train:n=>{ for(let i=0;i<n;i++) gdStep(); draw(); }};
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();
