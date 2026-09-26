/* ================= UNIT 16 · widgets of Act V: w-cosine, w-para, w-analogy, w-polysemy, w-pieces, and the card pictures ================= */

/* ---------- §15 · w-cosine: three rulers for "similar" ---------- */
(function(){
  const svg=document.getElementById('cz-svg'); if(!svg) return;
  const read=document.getElementById('cz-read'); const st={a:[2,1],b:[4,2],norm:false,drag:null}; let geo=null;
  const shown=v=>st.norm?vscale(v,1/(norm(v)||1)):v;
  function draw(){ const narrow=vbFor(svg,'0 0 480 360','0 0 340 320'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg);
    const W=narrow?340:480, H=narrow?320:360, X0=-1.2,X1=5.2,Y0=-1.2,Y1=4.2, s=Math.min((W-24)/(X1-X0),(H-24)/(Y1-Y0)), ox=(W-s*(X1-X0))/2, oy=(H-s*(Y1-Y0))/2;
    const px=x=>ox+(x-X0)*s, py=y=>oy+(Y1-y)*s; geo={px,py,ix:X=>X0+(X-ox)/s,iy:Y=>Y1-(Y-oy)/s,s};
    for(let x=Math.ceil(X0);x<=X1;x++) el('line',{x1:px(x),x2:px(x),y1:py(Y0),y2:py(Y1),stroke:'var(--grid)','stroke-width':1},svg);
    for(let y=Math.ceil(Y0);y<=Y1;y++) el('line',{x1:px(X0),x2:px(X1),y1:py(y),y2:py(y),stroke:'var(--grid)','stroke-width':1},svg);
    el('line',{x1:px(X0),x2:px(X1),y1:py(0),y2:py(0),stroke:'var(--axis)','stroke-width':1.4},svg); el('line',{x1:px(0),x2:px(0),y1:py(Y0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.4},svg);
    el('circle',{cx:px(0),cy:py(0),r:s,fill:'none',stroke:cv(K16.gold),'stroke-width':st.norm?1.8:1,'stroke-dasharray':'4 4',opacity:st.norm?.9:.45},svg);
    const a=shown(st.a), b=shown(st.b), c=cosSim(a,b), th=Math.acos(Math.max(-1,Math.min(1,c))), aa=Math.atan2(a[1],a[0]), ab=Math.atan2(b[1],b[0]);
    const r=Math.min(norm(a),norm(b),1.2)*s*.45, a0=Math.min(aa,ab), a1=Math.max(aa,ab), big=(a1-a0)>Math.PI?1:0;
    if(th>.02) el('path',{d:`M${px(0)+r*Math.cos(a0)},${py(0)-r*Math.sin(a0)} A${r},${r} 0 ${big} 0 ${px(0)+r*Math.cos(a1)},${py(0)-r*Math.sin(a1)}`,fill:'none',stroke:cv(K16.gold),'stroke-width':2},svg);
    el('line',{x1:px(a[0]),y1:py(a[1]),x2:px(b[0]),y2:py(b[1]),stroke:'var(--critical)','stroke-width':1.8,'stroke-dasharray':'5 4'},svg);
    garrow(svg,px(0),py(0),px(b[0]),py(b[1]),cv('s5'),3.2,!!glow); garrow(svg,px(0),py(0),px(a[0]),py(a[1]),cv(K16.word),3.2,!!glow);
    /* labels: when the two arrows lie on one line, put a's name below the line and b's above, so neither sits on the other arrow */
    const col=Math.abs(c)>.985;
    [['a',a,K16.word,col?1:-1],['b',b,'s5',-1]].forEach(([n,v,cc,side])=>{ el('circle',{cx:px(v[0]),cy:py(v[1]),r:11,fill:cv(cc),opacity:.18},svg);
      const d=Math.hypot(v[0],v[1])||1, nx=-v[1]/d, ny=v[0]/d; txt(svg,px(v[0])+nx*16*(side<0?1:-1)+(side<0?4:6),py(v[1])-ny*16*(side<0?1:-1)+4,n+' '+vecN(v,2),FT(800,11,k,cv(cc)),side<0?'start':'start'); });
    const d=norm(vsub(a,b));
    read.innerHTML=`a·b = <b>${N(dot(a,b),3)}</b><br>cos θ = <b>${N(c,3)}</b> · θ = <b>${N(th*180/Math.PI,1)}°</b><br>distance ‖a − b‖ = <b>${N(d,3)}</b>`+(st.norm?`<br><span style="color:var(--ink-muted)">√(2 − 2 cos θ) = ${N(Math.sqrt(Math.max(0,2-2*c)),3)}</span>`:''); }
  svgDrag(svg,(x,y)=>{ if(!geo) return false; let best=null, bd=30*(+svg.viewBox.baseVal.width/(svg.getBoundingClientRect().width||1));
      ['a','b'].forEach(n=>{ const v=shown(st[n]), dd=Math.hypot(geo.px(v[0])-x,geo.py(v[1])-y); if(dd<bd){ bd=dd; best=n; } }); st.drag=best; return !!best; },
    (x,y)=>{ if(!st.drag) return; let v=[Math.round(geo.ix(x)*10)/10,Math.round(geo.iy(y)*10)/10]; if(Math.hypot(...v)<.2) return; st[st.drag]=v.map(q=>Math.max(-1.1,Math.min(5,q))); draw(); },()=>{ st.drag=null; });
  document.getElementById('cz-norm').addEventListener('click',e=>{ st.norm=!st.norm; e.currentTarget.setAttribute('aria-pressed',st.norm); draw(); });
  document.getElementById('cz-shop').addEventListener('click',()=>{ st.a=[2,1]; st.b=[4,2]; draw(); });
  document.getElementById('cz-right').addEventListener('click',()=>{ st.a=[3,0]; st.b=[0,2]; draw(); });
  draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  U16['w-cosine']={state(){ const a=shown(st.a), b=shown(st.b); return {a,b,norm:st.norm,dot:dot(a,b),cos:cosSim(a,b),dist:norm(vsub(a,b)),texts:textBoxes(svg)}; },
    set(a,b){ st.a=a; st.b=b; draw(); }, setNorm(v){ st.norm=v; document.getElementById('cz-norm').setAttribute('aria-pressed',v); draw(); }};
})();

/* ---------- §15 · w-para: the parallelogram by hand ---------- */
(function(){
  const svg=document.getElementById('pa2-svg'); if(!svg) return;
  const read=document.getElementById('pa2-read');
  const P0={king:[3,2],man:[1,2],woman:[1,-2]}, FIX={queen:[3,-2],prince:[2.2,3.3],princess:[2.4,-3.3],boy:[.5,2.8],girl:[.4,-2.9]};
  const st={P:JSON.parse(JSON.stringify(P0)),inc:false,drag:null};
  let geo=null;
  const res=()=>vsub(vadd(st.P.king,st.P.woman),st.P.man);
  function ranked(){ const q=res(), all=Object.assign({},FIX,st.P); return Object.keys(all).filter(w=>st.inc||!(w in st.P)).map(w=>({w,c:cosSim(q,all[w])})).sort((a,b)=>b.c-a.c); }
  function draw(){ const narrow=vbFor(svg,'0 0 520 380','0 0 340 340'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg);
    const W=narrow?340:520, H=narrow?340:380, X0=-1,X1=5,Y0=-4.2,Y1=4.2, s=Math.min((W-30)/(X1-X0),(H-24)/(Y1-Y0)), ox=(W-s*(X1-X0))/2, oy=(H-s*(Y1-Y0))/2;
    const px=x=>ox+(x-X0)*s, py=y=>oy+(Y1-y)*s; geo={px,py,ix:X=>X0+(X-ox)/s,iy:Y=>Y1-(Y-oy)/s};
    for(let x=Math.ceil(X0);x<=X1;x++) el('line',{x1:px(x),x2:px(x),y1:py(Y0),y2:py(Y1),stroke:'var(--grid)','stroke-width':1},svg);
    for(let y=Math.ceil(Y0);y<=Y1;y++) el('line',{x1:px(X0),x2:px(X1),y1:py(y),y2:py(y),stroke:'var(--grid)','stroke-width':1},svg);
    el('line',{x1:px(X0),x2:px(X1),y1:py(0),y2:py(0),stroke:'var(--axis)','stroke-width':1.4},svg); el('line',{x1:px(0),x2:px(0),y1:py(Y0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.4},svg);
    const K=st.P.king, M=st.P.man, Wo=st.P.woman, D=res(), R=ranked(), best=R[0];
    el('polygon',{class:'para',points:[M,K,D,Wo].map(p=>px(p[0])+','+py(p[1])).join(' '),fill:cv(K16.gold),opacity:.1,stroke:cv(K16.gold),'stroke-width':1,'stroke-dasharray':'4 4'},svg);
    garrow(svg,px(M[0]),py(M[1]),px(Wo[0]),py(Wo[1]),cv('s5'),3,!!glow); garrow(svg,px(K[0]),py(K[1]),px(D[0]),py(D[1]),cv('s5'),3,!!glow);
    el('line',{x1:px(0),y1:py(0),x2:px(D[0]),y2:py(D[1]),stroke:cv(K16.gold),'stroke-width':1.2,'stroke-dasharray':'2 4',opacity:.8},svg);
    el('circle',{cx:px(D[0]),cy:py(D[1]),r:11,fill:'none',stroke:cv(K16.gold),'stroke-width':2.2},svg);
    Object.entries(FIX).forEach(([w,p])=>{ const on=w===best.w; glowDot(svg,px(p[0]),py(p[1]),on?7:5,on?cv(K16.gold):'var(--ink-2)',on&&glow); txt(svg,px(p[0])+(on?17:9),py(p[1])+4,w,FT(on?800:600,10.5,k,on?cv(K16.gold):'var(--ink-2)')); });
    Object.entries(st.P).forEach(([w,p])=>{ const on=w===best.w; el('circle',{cx:px(p[0]),cy:py(p[1]),r:12,fill:cv(K16.people),opacity:.18},svg); glowDot(svg,px(p[0]),py(p[1]),7,on?cv(K16.gold):cv(K16.people),glow);
      txt(svg,px(p[0])-12,py(p[1])-12,w,FT(800,11,k,on?cv(K16.gold):cv(K16.people)),'end'); });
    txt(svg,px(D[0])+(best.w==='queen'&&!st.inc?17:14),py(D[1])+20,'king − man + woman',FT(700,9.5,k,cv(K16.gold))); fitIn(svg);
    read.innerHTML=`king − man + woman = ${vecN(st.P.king,2)} − ${vecN(st.P.man,2)} + ${vecN(st.P.woman,2)} = <b>${vecN(D,2)}</b><br>nearest by cosine${st.inc?' (inputs allowed)':' (skipping king, man, woman)'}:<br>`+
      R.slice(0,4).map((o,i)=>`${i?'':'<b>'}${o.w} ${N(o.c,3)}${i?'':'</b>'}`).join(' · '); }
  svgDrag(svg,(x,y)=>{ if(!geo) return false; let bestW=null,bd=24*(+svg.viewBox.baseVal.width/(svg.getBoundingClientRect().width||1))*1.2;
      Object.entries(st.P).forEach(([w,p])=>{ const d=Math.hypot(geo.px(p[0])-x,geo.py(p[1])-y); if(d<bd){ bd=d; bestW=w; } }); st.drag=bestW; return !!bestW; },
    (x,y)=>{ if(!st.drag) return; st.P[st.drag]=[Math.round(geo.ix(x)*10)/10,Math.round(geo.iy(y)*10)/10].map((v,i)=>Math.max(i?-4:-1,Math.min(i?4:5,v))); draw(); },()=>{ st.drag=null; });
  document.getElementById('pa2-inc').addEventListener('click',e=>{ st.inc=!st.inc; e.currentTarget.setAttribute('aria-pressed',st.inc); draw(); });
  document.getElementById('pa2-reset').addEventListener('click',()=>{ st.P=JSON.parse(JSON.stringify(P0)); draw(); });
  draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  U16['w-para']={state(){ const pts=svg.querySelector('polygon.para').getAttribute('points').split(' ').map(p=>p.split(',').map(Number)); return {P:JSON.parse(JSON.stringify(st.P)),D:res(),ranked:ranked(),best:ranked()[0].w,inc:st.inc,poly:pts,geo:{px:[0,1,2,3,4,5].map(geo.px),py:[-4,0,4].map(geo.py)},texts:textBoxes(svg)}; },
    set(w,p){ st.P[w]=p; draw(); }, setInc(v){ st.inc=v; document.getElementById('pa2-inc').setAttribute('aria-pressed',v); draw(); }, reset(){ st.P=JSON.parse(JSON.stringify(P0)); draw(); }};
})();

/* ---------- §15 · w-analogy: the embedding explorer (3-D) — dots, a few named words, hover for the rest ---------- */
(function(){
  const box=document.getElementById('ex-3d'); if(!box||!CIN) return;
  const selA=document.getElementById('ex-a'), selB=document.getElementById('ex-b'), selC=document.getElementById('ex-c'), ans=document.getElementById('ex-ans'), read=document.getElementById('ex-read'), find=document.getElementById('ex-find');
  const GN={people:'people',tea:'tea and drinks',cricket:'cricket',animal:'animals',place:'places',bat:'two-faced'};
  const opts=['people','tea','cricket','animal','place','bat'].map(g=>`<optgroup label="${GN[g]}">`+EX.w.filter((w,i)=>EX.group[i]===g).map(w=>`<option value="${w}">${w}</option>`).join('')+'</optgroup>').join('');
  [selA,selB,selC].forEach(s=>{ s.innerHTML=opts; });
  document.getElementById('ex-list').innerHTML=EX.w.map(w=>`<option value="${w}">`).join('');
  const st={a:'king',b:'man',c:'woman',inc:false,names:false,dirs:new Set(),focus:null};
  const V=w=>EX.v[EX.idx[w]], POS=EX.v.map(exPos);
  const query=()=>vadd(vsub(V(st.a),V(st.b)),V(st.c));
  const PAIRS={female:[['king','queen'],['prince','princess'],['man','woman'],['boy','girl'],['father','mother'],['son','daughter'],['brother','sister'],['husband','wife'],['uncle','aunt'],['actor','actress']],
    royal:[['man','king'],['woman','queen'],['boy','prince'],['girl','princess']],
    young:[['dog','puppy'],['cat','kitten'],['cow','calf'],['lion','cub'],['horse','foal'],['man','boy'],['woman','girl'],['king','prince'],['queen','princess']],
    capital:[['India','Delhi'],['France','Paris'],['Japan','Tokyo'],['Italy','Rome'],['Nepal','Kathmandu'],['England','London']]};
  const DIRC={female:'s5',royal:'s4',young:'s6',capital:'s1',topic:'s2'};
  function result(){ const q=query(), skip=st.inc?null:[st.a,st.b,st.c], nn=exNearest(q,skip,5); return {q,nn}; }
  function named(){ const {nn}=result(), o=[]; const add=(w,prio,role)=>{ if(!o.some(x=>x.w===w)) o.push({w,prio,role}); };
    add(nn[0].w,0,'answer'); [st.a,st.b,st.c].forEach((w,i)=>add(w,1,'ABC'[i])); if(st.focus) add(st.focus,1,'focus'); nn.slice(1,4).forEach(n=>add(n.w,2,'near'));
    if(st.names) EX.w.forEach(w=>add(w,3,'all')); return o; }
  function readout(){ const {nn}=result(); ans.textContent=nn[0].w; ans.dataset.w=nn[0].w; const mx=nn[0].c;
    let h=`<b>${st.a} − ${st.b} + ${st.c}</b> ≈ <b style="color:var(--s4)">${nn[0].w}</b><br><span style="color:var(--ink-muted)">nearest by cosine (all 13 numbers)${st.inc?', inputs allowed':', skipping '+st.a+', '+st.b+', '+st.c}</span><table>`+
      nn.map((o,i)=>`<tr class="${i?'':'top'}"><td>${i+1}. ${o.w}</td><td class="n">${N(o.c,3)}</td><td style="width:40%"><span class="bar" style="width:${Math.max(4,100*(o.c-.5)/(Math.max(.5,mx-.5)||1)).toFixed(0)}%"></span></td></tr>`).join('')+'</table>';
    if(st.focus){ const fn=exNearest(V(st.focus),[st.focus],4); h+=`<div style="margin-top:.5rem"><b>${st.focus}</b>'s nearest words: `+fn.map(o=>`${o.w} <b>${N(o.c,2)}</b>`).join(' · ')+'</div>'; }
    read.innerHTML=h; }
  let S3=null, ctxRef=null;
  function build(){ const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    return CIN.stage3d(box,{camera:{pos:camFit(box,[2.3,2.6,8.8],[.1,.05,-.4],1.18),look:[.1,.05,-.4],fov:40},orbit:true,autoRotate:.05,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx); ctxRef=ctx;
      starfield(ctx,700,22);
      const fl=CIN.prim.grid(ctx,14,28,hx('grid'),{opacity:isLight?.35:.16}); fl.position.y=-4.1; root.add(fl);
      const GC={people:hx(K16.people),tea:hx(K16.tea),cricket:hx(K16.cricket),animal:hx(K16.animal),place:hx(K16.place),bat:hx(K16.bat)};
      ['people','tea','cricket','animal','place'].forEach(g=>{ const idx=EX.w.map((_,i)=>i).filter(i=>EX.group[i]===g), m=[0,0,0]; idx.forEach(i=>POS[i].forEach((x,d)=>{ m[d]+=x/idx.length; })); const h=haloSprite(ctx,GC[g],3.6); h.position.set(...m); h.material.opacity=isLight?.07:.1; root.add(h); });
      const pts=EX.w.map((w,i)=>{ const c=GC[EX.group[i]]; const d=CIN.prim.dot(ctx,POS[i],c,.07); d.material.emissiveIntensity=isLight?.25:.7; const h=haloSprite(ctx,c,.42); h.position.set(...POS[i]); root.add(d,h); return {d,h}; });
      const labs={}; const labOf=w=>labs[w]||(labs[w]=tslot(ctx,root));
      const pg=new THREE.Group(); root.add(pg);
      const quadGeo=new THREE.BufferGeometry(); quadGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(18),3));
      const quad=new THREE.Mesh(quadGeo,new THREE.MeshBasicMaterial({color:hx(K16.gold),transparent:true,opacity:isLight?.16:.12,side:THREE.DoubleSide,depthWrite:false})); pg.add(quad);
      const edgesT=[0,1,2,3].map(()=>{ const t=liveTube(ctx,hx(K16.gold),.012,.7); t.material.depthWrite=false; pg.add(t); return t; });
      const offA=CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s5'),{radius:.03,head:.22}), offB=CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s5'),{radius:.03,head:.22}); overlay(offA,11); overlay(offB,11); pg.add(offA,offB);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.2,.016,10,56),new THREE.MeshStandardMaterial({color:hx(K16.gold),emissive:hx(K16.gold),emissiveIntensity:isLight?.3:1,transparent:true,depthWrite:false})); pg.add(ring);
      const qdot=CIN.prim.dot(ctx,[0,0,0],hx(K16.gold),.06); pg.add(qdot); const snap=liveTube(ctx,hx(K16.gold),.006,.8); pg.add(snap);
      const focusRing=new THREE.Mesh(new THREE.TorusGeometry(.22,.012,10,56),new THREE.MeshBasicMaterial({color:hx('ink'),transparent:true,opacity:.9,depthWrite:false})); root.add(focusRing);
      const dirG=new THREE.Group(); root.add(dirG);
      hoverTips(ctx,box,()=>EX.w.map((w,i)=>({p:POS[i],t:w,c:'var(--'+K16[EX.group[i]]+')'})));
      let lastCam='';
      ctx.relabel=()=>{ const {q}=result(), D=exPos(q), items=named().map(o=>{ const role=o.role, on=role!=='all'&&role!=='near';
          const text=role==='answer'?o.w+' ✓':'ABC'.includes(role)&&role.length===1?o.w+' · '+role:o.w;
          return {slot:labOf(o.w),anchor:POS[EX.idx[o.w]],text,prio:o.prio,optional:role==='near',minPx:role==='all'?9:11,opts:{size:role==='all'?16:role==='near'?18:22,scale:(role==='all'?.0078:role==='near'?.0086:.0104)*LSc(box),color:role==='answer'?colors.s4:on?colors.ink:colors.ink2,bg:true,weight:on?800:600}}; });
        const used=new Set(items.map(it=>it.slot)); Object.values(labs).forEach(s=>{ if(!used.has(s)&&s.sp) s.sp.visible=false; });
        /* belt and braces: no word label other than the named ones may stay on screen */
        const live=new Set([...used].map(sl=>sl.sp)); root.traverse(o=>{ if(o.isSprite&&o.userData&&o.userData.t&&!live.has(o)) o.visible=false; });
        ctx.placed=layoutLabels(ctx,items,{avoid:[D,...[st.a,st.b,st.c].map(w=>POS[EX.idx[w]])]}); ctx.lastItems=items; };
      ctx.pulse=()=>{ if(st.focus){ const p=POS[EX.idx[st.focus]]; focusRing.visible=true; focusRing.position.set(...p); focusRing.lookAt(ctx.camera.position); focusRing.scale.setScalar(1+.25*Math.sin(performance.now()/260)); } else focusRing.visible=false; ring.lookAt(ctx.camera.position); };
      ctx.redraw=()=>{ const {q,nn}=result(), A=POS[EX.idx[st.a]], B=POS[EX.idx[st.b]], C=POS[EX.idx[st.c]], D=exPos(q), best=POS[nn[0].i];
        const arr=quadGeo.attributes.position.array; [B,A,D,B,D,C].forEach((p,j)=>{ arr[3*j]=p[0]; arr[3*j+1]=p[1]; arr[3*j+2]=p[2]; }); quadGeo.attributes.position.needsUpdate=true; quadGeo.computeBoundingSphere();
        [[B,A],[A,D],[D,C],[C,B]].forEach(([p,r],j)=>aimTube(THREE,edgesT[j],p,r));
        offA.userData.set(new THREE.Vector3(...B),new THREE.Vector3(...C)); offB.userData.set(new THREE.Vector3(...A),new THREE.Vector3(...D));
        qdot.position.set(...D); ring.position.set(...best); ring.lookAt(ctx.camera.position); aimTube(THREE,snap,D,best);
        const hot=new Set(named().filter(o=>o.role!=='all').map(o=>o.w));
        pts.forEach((o,i)=>{ const on=hot.has(EX.w[i]); o.d.scale.setScalar(on?1.6:1); o.h.material.opacity=(isLight?.3:.6)*(on?1.4:.8); });
        ctx.pulse();
        clearGroup(dirG);
        st.dirs.forEach(d=>{ const c=hx(DIRC[d]);
          if(d==='topic'){ const m=g=>{ const idx=EX.w.map((_,i)=>i).filter(i=>EX.group[i]===g), s=[0,0,0]; idx.forEach(i=>POS[i].forEach((x,k)=>{ s[k]+=x/idx.length; })); return s; };
            const a=CIN.prim.arrow(ctx,m('tea'),m('cricket'),c,{radius:.045,head:.3}); overlay(a,9); dirG.add(a); return; }
          PAIRS[d].forEach(([x,y])=>{ const a=CIN.prim.arrow(ctx,POS[EX.idx[x]],POS[EX.idx[y]],c,{radius:.018,head:.16}); overlay(a,9); dirG.add(a); }); });
        lastCam=''; RR(ctx); };
      ctx.redraw(); if(fine) hint(box,'drag to orbit');
      ctx.camKey=()=>{ const p=ctx.camera.position; return p.x.toFixed(3)+','+p.y.toFixed(3)+','+p.z.toFixed(3)+','+ctx.size.w+'x'+ctx.size.h; };
      ctx.tick=()=>{ const k=ctx.camKey(); if(k!==lastCam){ lastCam=k; ctx.relabel(); return true; } return false; };
    },
    update(ctx){ if(!ctx.tick) return false; ctx.pulse(); const moved=ctx.tick(); return moved||!!st.focus; } }); }
  S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  function lookAt(p,dur){ const h=S3&&S3.handle; if(!h) return; const L=h.ctx.look, from=[L.x,L.y,L.z]; tween(dur||900,u=>{ L.set(from[0]+(p[0]-from[0])*u,from[1]+(p[1]-from[1])*u,from[2]+(p[2]-from[2])*u); h.ctx.orbit.place(); }); }
  function setQ(a,b,c,fly){ st.a=a; st.b=b; st.c=c; selA.value=a; selB.value=b; selC.value=c; st.focus=null; redraw();
    if(fly!==false){ const P=[a,b,c].map(w=>POS[EX.idx[w]]), m=[0,1,2].map(d=>(P[0][d]+P[1][d]+P[2][d])/3); lookAt(m.map((x,d)=>x*.55+[.1,.05,-.4][d]*.45)); } }
  [selA,selB,selC].forEach((s,i)=>s.addEventListener('change',()=>{ st[['a','b','c'][i]]=s.value; setQ(st.a,st.b,st.c); }));
  document.getElementById('ex-pre').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const [a,bb,c]=b.dataset.q.split(','); setQ(a,bb,c); }));
  document.getElementById('ex-dirs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const d=b.dataset.d; if(st.dirs.has(d)) st.dirs.delete(d); else st.dirs.add(d); b.setAttribute('aria-pressed',st.dirs.has(d)); redraw(); }));
  document.getElementById('ex-inc').addEventListener('click',e=>{ st.inc=!st.inc; e.currentTarget.setAttribute('aria-pressed',st.inc); redraw(); });
  document.getElementById('ex-names').addEventListener('click',e=>{ st.names=!st.names; e.currentTarget.setAttribute('aria-pressed',st.names); redraw(); });
  const tryFind=()=>{ const w=EX.w.find(x=>x.toLowerCase()===find.value.trim().toLowerCase()); if(!w) return; st.focus=w; redraw(); lookAt(POS[EX.idx[w]].map(x=>x*.7)); };
  find.addEventListener('change',tryFind); find.addEventListener('input',tryFind); find.addEventListener('keydown',e=>{ if(e.key==='Enter') tryFind(); });
  selA.value=st.a; selB.value=st.b; selC.value=st.c; readout();
  U16['w-analogy']={state(){ const {q,nn}=result(); return {a:st.a,b:st.b,c:st.c,answer:nn[0].w,nn,q,names:st.names,focus:st.focus,dirs:[...st.dirs],
      named:named().filter(o=>o.role!=='all').map(o=>o.w),labels:S3&&S3.handle&&ctxRef&&!ctxRef.dead?labelRects(ctxRef):null}; },
    setQ, focus(w){ find.value=w; tryFind(); }, redraw};
})();

/* ---------- §16 · w-polysemy: the word with two lives (3-D) ---------- */
(function(){
  const box=document.getElementById('po-3d'); if(!box||!CIN) return;
  const read=document.getElementById('po-read'), st={s:.5};
  const CRI=EX.w.filter((w,i)=>EX.group[i]==='cricket'), ANI=EX.w.filter((w,i)=>EX.group[i]==='animal');
  const mean=ws=>{ const m=EX.v[0].map(()=>0); ws.forEach(w=>EX.v[EX.idx[w]].forEach((x,d)=>{ m[d]+=x/ws.length; })); return m; };
  const CM=mean(CRI), AM=mean(ANI);
  const batV=()=>vadd(vscale(CM,st.s),vscale(AM,1-st.s));
  const near=()=>exNearest(batV(),['bat'],3);
  function readout(){ const b=batV(), nn=near();
    read.innerHTML=`bat = <b>${N(100*st.s,0)}%</b> cricket meaning + <b>${N(100*(1-st.s),0)}%</b> animal meaning<br>cos with the cricket meaning <b>${N(cosSim(b,CM),3)}</b><br>cos with the animal meaning <b>${N(cosSim(b,AM),3)}</b><br>nearest words: `+nn.map(o=>`${o.w} <b>${N(o.c,2)}</b>`).join(' · '); }
  let S3=null, ctxRef=null;
  const MID=[0,1,2].map(d=>(exPos(CM)[d]+exPos(AM)[d])/2);
  function build(){ return CIN.stage3d(box,{camera:{pos:camFit(box,[MID[0]+.9,MID[1]+1.5,MID[2]+5.0],MID,1.3),look:MID,fov:40},orbit:true,autoRotate:.07,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx); ctxRef=ctx;
      starfield(ctx,380,16); const fl=CIN.prim.grid(ctx,12,24,hx('grid'),{opacity:isLight?.35:.18}); fl.position.y=MID[1]-1.6; root.add(fl);
      const cc=hx(K16.cricket), ac=hx(K16.animal), pc=hx(K16.bat);
      const drawG=(ws,c)=>ws.forEach(w=>{ const p=exPos(EX.v[EX.idx[w]]); const d=CIN.prim.dot(ctx,p,c,.07); const h=haloSprite(ctx,c,.45); h.position.set(...p); root.add(d,h); });
      drawG(CRI,cc); drawG(ANI,ac);
      const pC=exPos(CM), pA=exPos(AM);
      [[pC,cc],[pA,ac]].forEach(([p,c])=>{ const h=haloSprite(ctx,c,2.6); h.position.set(...p); h.material.opacity=isLight?.1:.16; root.add(h); });
      const path=[]; for(let i=0;i<=24;i++){ const u=i/24; path.push(exPos(vadd(vscale(CM,u),vscale(AM,1-u)))); }
      for(let i=0;i<24;i+=2) root.add(tube(ctx,path[i],path[i+1],pc,.008,.6));
      const bat=CIN.prim.dot(ctx,[0,0,0],pc,.13); const bh=haloSprite(ctx,pc,1.1); root.add(bat,bh);
      const links=[0,1,2].map(()=>{ const t=liveTube(ctx,pc,.007,.7); t.material.depthWrite=false; root.add(t); return t; });
      const sBat=tslot(ctx,root), sG=[tslot(ctx,root),tslot(ctx,root)], sN={};
      hoverTips(ctx,box,()=>CRI.concat(ANI).map(w=>({p:exPos(EX.v[EX.idx[w]]),t:w,c:'var(--'+(CRI.includes(w)?K16.cricket:K16.animal)+')'})).concat([{p:exPos(batV()),t:'bat',c:'var(--'+K16.bat+')'}]));
      let lastCam='';
      ctx.relabel=()=>{ const p=exPos(batV()), nn=near(); const items=[{slot:sBat,anchor:p,text:'bat',prio:0,opts:{size:26,scale:.0098*LSc(box),color:colors.s5,bg:true,weight:800}},
          {slot:sG[0],anchor:pC,text:'cricket words',prio:2,optional:true,maxFar:(w,h)=>w/2+h+30,opts:{size:19,scale:.0082*LSc(box),color:colors.s3,bg:true,weight:700}},{slot:sG[1],anchor:pA,text:'animal words',prio:2,optional:true,maxFar:(w,h)=>w/2+h+30,opts:{size:19,scale:.0082*LSc(box),color:colors.s4,bg:true,weight:700}}];
        nn.forEach(o=>{ const s=sN[o.w]||(sN[o.w]=tslot(ctx,root)); items.push({slot:s,anchor:exPos(EX.v[o.i]),text:o.w,prio:1,optional:true,opts:{size:18,scale:.0082*LSc(box),color:colors.ink,bg:true,weight:650}}); });
        const used=new Set(items.map(it=>it.slot)); Object.values(sN).forEach(s=>{ if(!used.has(s)&&s.sp) s.sp.visible=false; });
        layoutLabels(ctx,items,{avoid:[p]}); };
      ctx.redraw=()=>{ const p=exPos(batV()); bat.position.set(...p); bh.position.set(...p); near().forEach((o,j)=>aimTube(THREE,links[j],p,exPos(EX.v[o.i]))); lastCam=''; RR(ctx); };
      ctx.tick=()=>{ const q=ctx.camera.position, k=q.x.toFixed(3)+','+q.y.toFixed(3)+','+q.z.toFixed(3)+','+ctx.size.w; if(k!==lastCam){ lastCam=k; ctx.relabel(); return true; } return false; };
      ctx.redraw(); if(matchMedia('(hover:hover) and (pointer:fine)').matches) hint(box,'drag to orbit');
    }, update(ctx){ return ctx.tick?ctx.tick():false; } }); }
  S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  bindCtl('po-s',v=>{ st.s=v; redraw(); },v=>N(100*v,0)+'%');
  const goTo=to=>{ const from=st.s; tween(1300,u=>{ st.s=from+(to-from)*u; setCtl('po-s',st.s,v=>N(100*v,0)+'%'); redraw(); }); };
  document.getElementById('po-cric').addEventListener('click',()=>goTo(.95));
  document.getElementById('po-anim').addEventListener('click',()=>goTo(.05));
  readout();
  U16['w-polysemy']={state(){ const b=batV(); return {s:st.s,cosC:cosSim(b,CM),cosA:cosSim(b,AM),nn:near(),labels:S3&&S3.handle&&ctxRef&&!ctxRef.dead?labelRects(ctxRef):null}; },
    set(s){ st.s=s; setCtl('po-s',s,v=>N(100*v,0)+'%'); redraw(); }};
})();

/* ---------- §16 · w-pieces: fastText character pieces and a BPE merge player ---------- */
(function(){
  const root=document.getElementById('w-pieces'); if(!root) return;
  const inp=document.getElementById('pc-word'), piecesEl=document.getElementById('pc-pieces'), knownEl=document.getElementById('pc-known'), pread=document.getElementById('pc-read');
  const KNOWN=['chai','coffee','kadak','dudhwala','sabziwala','cricket','player','chain','milk','sugar'];
  const grams=w=>{ const s='<'+w+'>'; const o=[]; for(let i=0;i+3<=s.length;i++) o.push(s.slice(i,i+3)); return o; };
  const st={word:'chaiwala',tab:'ft',merges:[],bw:'hugs'};
  function drawFT(){ const w=(inp.value||'').trim().toLowerCase().replace(/[^a-z]/g,''); st.word=w; const G=grams(w), Gs=new Set(G);
    const shared=KNOWN.map(k=>({k,s:grams(k).filter(g=>Gs.has(g))})).filter(o=>o.k!==w).sort((a,b)=>b.s.length-a.s.length||KNOWN.indexOf(a.k)-KNOWN.indexOf(b.k));
    const inAny=new Set(shared.flatMap(o=>o.s));
    piecesEl.innerHTML=w?`<div class="bg-lbl" style="margin-top:.7rem">its pieces (&lt; and &gt; mark the start and end)</div>`+G.map(g=>`<span class="tk${inAny.has(g)?' sh':''}">${esc(g)}</span>`).join(' '):'';
    const mx=Math.max(1,...shared.map(o=>o.s.length));
    knownEl.innerHTML='<div class="bg-lbl">known words that share pieces</div>'+shared.filter(o=>o.s.length).map(o=>`<div class="pc-row"><span class="pc-w">${esc(o.k)}</span><span class="pc-bar"><i style="width:${(100*o.s.length/mx).toFixed(0)}%"></i></span><span class="pc-n">${o.s.length}</span><span class="pc-g">${o.s.map(esc).join(' ')}</span></div>`).join('')+(shared.every(o=>!o.s.length)?'<div class="pc-row" style="color:var(--ink-muted)">no known word shares a piece</div>':'');
    const top=shared[0];
    pread.innerHTML=w?`"${esc(w)}" has <b>${G.length}</b> pieces`+(top&&top.s.length?`; most shared with <b>${esc(top.k)}</b> (${top.s.length})`:'')+`<br><span style="color:var(--ink-muted)">its fastText vector = the sum of its piece vectors, so it lands near words it shares pieces with</span>`:'type a word';
    root.dataset.word=w; }
  /* ---- BPE ---- */
  const BP_CORPUS=[['hug',10],['pug',5],['pun',12],['bun',4],['hugs',5]];
  const segs=()=>{ let W=BP_CORPUS.map(([w,c])=>({sym:w.split(''),c})); st.merges.forEach(([a,b])=>{ W=W.map(o=>{ const out=[]; for(let i=0;i<o.sym.length;i++){ if(i+1<o.sym.length&&o.sym[i]===a&&o.sym[i+1]===b){ out.push(a+b); i++; } else out.push(o.sym[i]); } return {sym:out,c:o.c}; }); }); return W; };
  function pairCounts(W){ const cnt=new Map(), order=[]; W.forEach(o=>{ for(let i=0;i+1<o.sym.length;i++){ const k=o.sym[i]+'\u0001'+o.sym[i+1]; if(!cnt.has(k)){ cnt.set(k,0); order.push(k); } cnt.set(k,cnt.get(k)+o.c); } });
    return order.map(k=>({a:k.split('\u0001')[0],b:k.split('\u0001')[1],n:cnt.get(k)})); }
  function nextMerge(W){ const P=pairCounts(W); if(!P.length) return null; const mx=Math.max(...P.map(p=>p.n)); return P.find(p=>p.n===mx); }   /* ties: earliest in reading order */
  function cut(word,ms){ let sym=word.split(''); ms.forEach(([a,b])=>{ const out=[]; for(let i=0;i<sym.length;i++){ if(i+1<sym.length&&sym[i]===a&&sym[i+1]===b){ out.push(a+b); i++; } else out.push(sym[i]); } sym=out; }); return sym; }
  function drawBPE(){ const W=segs(), P=pairCounts(W), nx=nextMerge(W);
    document.getElementById('bp-corpus').innerHTML='<div class="bg-lbl">the corpus, cut into the current symbols</div>'+W.map(o=>`<div class="bp-w">${o.sym.map(s=>`<span class="tk${s.length>1?' mg':''}">${esc(s)}</span>`).join('')}<span class="bp-c">× ${o.c}</span></div>`).join('');
    const top=P.slice().sort((a,b)=>b.n-a.n||P.indexOf(a)-P.indexOf(b)).slice(0,6);
    document.getElementById('bp-pairs').innerHTML='<div class="bg-lbl" style="margin-top:.6rem">neighbouring pairs, counted</div>'+top.map(p=>`<span class="bp-p${nx&&p.a===nx.a&&p.b===nx.b?' nx':''}">${esc(p.a)}+${esc(p.b)} <b>${p.n}</b></span>`).join('')+
      `<div class="bp-m">${st.merges.length?'merges so far: '+st.merges.map((m,i)=>`${i+1}. ${esc(m[0])}+${esc(m[1])} (${m[2]})`).join(' · '):'no merges yet — every word is spelled letter by letter'}</div>`;
    const w=(document.getElementById('bp-word').value||'').trim().toLowerCase().replace(/[^a-z]/g,''); st.bw=w; const c=cut(w,st.merges);
    document.getElementById('bp-cut').innerHTML=w?c.map(s=>`<span class="tk${s.length>1?' mg':''}">${esc(s)}</span>`).join('<span class="bp-dot">·</span>'):'';
    document.getElementById('bp-read').innerHTML=w?`"${esc(w)}" → <b>${c.map(esc).join(' · ')}</b> after ${st.merges.length} merge${st.merges.length===1?'':'s'}`+(nx?`<br>next merge: <b>${esc(nx.a)}+${esc(nx.b)}</b> (${nx.n})`:''):'type a word'; }
  document.getElementById('bp-next').addEventListener('click',()=>{ const nx=nextMerge(segs()); if(nx) st.merges.push([nx.a,nx.b,nx.n]); drawBPE(); });
  document.getElementById('bp-reset').addEventListener('click',()=>{ st.merges=[]; drawBPE(); });
  document.getElementById('bp-word').addEventListener('input',drawBPE);
  document.getElementById('bp-pre').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ document.getElementById('bp-word').value=b.dataset.w; drawBPE(); }));
  inp.addEventListener('input',drawFT);
  document.getElementById('pc-pre').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ inp.value=b.dataset.w; drawFT(); }));
  tabs(document.getElementById('pc-tabs'),t=>{ st.tab=t; showTab(root,t); if(t==='bpe') drawBPE(); else drawFT(); });
  drawFT(); drawBPE();
  U16['w-pieces']={state(){ const W=segs(); return {word:st.word,grams:grams(st.word),shared:KNOWN.map(k=>({k,n:grams(k).filter(g=>grams(st.word).includes(g)).length})),
      merges:st.merges.map(m=>m.slice()),corpus:W.map(o=>o.sym.join(' ')),pairs:pairCounts(W),next:nextMerge(W),cut:cut(st.bw,st.merges),bw:st.bw}; },
    setWord(w){ inp.value=w; drawFT(); }, merge(n){ for(let i=0;i<n;i++){ const nx=nextMerge(segs()); if(nx) st.merges.push([nx.a,nx.b,nx.n]); } drawBPE(); }, reset(){ st.merges=[]; drawBPE(); },
    cutWord(w){ document.getElementById('bp-word').value=w; drawBPE(); return cut(w,st.merges); }, setTab(t){ document.querySelector(`#pc-tabs [data-t="${t}"]`).click(); }, grams, cut};
})();

/* ---------- §17 · one small picture per card ---------- */
(function(){
  const minis=document.querySelectorAll('svg.mini'); if(!minis.length) return;
  const C=k=>cv(k);
  const D={
    map(s){ [[14,14],[14,28],[14,42]].forEach(([x,y],i)=>{ el('line',{x1:8,x2:44,y1:y,y2:y,stroke:'var(--grid)','stroke-width':1},s); el('circle',{cx:x+14,cy:y,r:3.6,fill:C(['s2','s2','s3'][i])},s); });
      el('path',{d:'M52 28 L66 28',stroke:'var(--ink-muted)','stroke-width':1.4,fill:'none'},s); el('polygon',{points:'66,24 72,28 66,32',fill:'var(--ink-muted)'},s);
      [[86,18,'s2'],[92,22,'s2'],[88,26,'s2'],[104,40,'s3'],[110,36,'s3']].forEach(([x,y,c])=>el('circle',{cx:x,cy:y,r:3.6,fill:C(c)},s)); el('circle',{cx:89,cy:22,r:10,fill:'none',stroke:C('s2'),'stroke-dasharray':'2 2',opacity:.7},s); },
    chain(s){ ['1','¾','⅔','1'].forEach((t,i)=>{ const x=6+i*29; el('rect',{x,y:16,width:22,height:22,rx:5,fill:'color-mix(in srgb,var(--s6) 18%,transparent)',stroke:C('s6')},s); txt(s,x+11,31,t,'font:700 11px Inter,system-ui;fill:var(--ink)','middle'); if(i<3) txt(s,x+25.5,31,'×','font:600 10px Inter,system-ui;fill:var(--ink-muted)','middle'); }); },
    smooth(s){ [26,12,2,2,2].forEach((h,i)=>{ el('rect',{x:8+i*14,y:44-h,width:10,height:h,rx:2,fill:i<2?C('s6'):C('s2'),opacity:.9},s); }); [20,10,5,5,5].forEach((h,i)=>{ el('rect',{x:84+i*7,y:44-h,width:5,height:h,rx:1.5,fill:i<2?C('s6'):C('s2'),opacity:.9},s); }); el('path',{d:'M69 30 L78 30',stroke:'var(--ink-muted)','stroke-width':1.4,fill:'none'},s); el('polygon',{points:'78,27 82,30 78,33',fill:'var(--ink-muted)'},s); },
    die(s){ el('rect',{x:10,y:8,width:40,height:40,rx:9,fill:'color-mix(in srgb,var(--s6) 14%,transparent)',stroke:C('s6'),'stroke-width':1.5},s); [[20,18],[40,18],[30,28],[20,38],[40,38]].forEach(([x,y])=>el('circle',{cx:x,cy:y,r:3.2,fill:C('s6')},s));
      { const t2=txt(s,84,33,'2','font:800 12px Inter,system-ui;fill:var(--ink)','middle'); const sup=el('tspan',{dy:'-5',style:'font-size:8.5px'},t2); sup.textContent='1.75'; } txt(s,86,46,'≈ 3.36 faces','font:600 8.5px Inter,system-ui;fill:var(--ink-muted)','middle'); },
    table(s){ const M=[[5,4,0,1],[4,5,0,0],[0,0,5,4],[0,1,4,5]]; M.forEach((r,i)=>r.forEach((v,j)=>el('rect',{x:34+j*13,y:4+i*12,width:11,height:10,rx:2,fill:`color-mix(in srgb,var(--s3) ${v*16}%,var(--grid))`},s))); },
    pmi(s){ el('rect',{x:20,y:14,width:16,height:34,rx:3,fill:C('s1'),opacity:.9},s); el('rect',{x:40,y:24,width:16,height:24,rx:3,fill:'var(--ink-muted)',opacity:.5},s); txt(s,38,10,'count vs chance','font:600 7.5px Inter,system-ui;fill:var(--ink-muted)','middle');
      txt(s,92,34,'log₂ 1.6','font:800 11px Inter,system-ui;fill:var(--ink)','middle'); txt(s,92,46,'"the" → 0','font:600 8.5px Inter,system-ui;fill:var(--ink-muted)','middle'); },
    svd(s){ for(let i=0;i<5;i++) for(let j=0;j<6;j++) el('rect',{x:6+j*7,y:6+i*9,width:6,height:8,rx:1.5,fill:'var(--grid)'},s); txt(s,58,31,'≈','font:700 13px Inter,system-ui;fill:var(--ink-muted)','middle');
      for(let i=0;i<5;i++) el('rect',{x:70,y:6+i*9,width:10,height:8,rx:1.5,fill:C('s4'),opacity:.85},s); for(let j=0;j<6;j++) el('rect',{x:86+j*5,y:26,width:4,height:8,rx:1,fill:C('s4'),opacity:.6},s); },
    cbow(s){ [[10,12],[10,44],[110,12],[110,44]].forEach(([x,y])=>{ el('circle',{cx:x,cy:y,r:4,fill:C('s3')},s); el('line',{x1:x,y1:y,x2:60,y2:28,stroke:C('s3'),'stroke-width':1.3,opacity:.7},s); });
      el('rect',{x:46,y:18,width:28,height:20,rx:5,fill:'color-mix(in srgb,var(--s4) 22%,transparent)',stroke:C('s4'),'stroke-dasharray':'3 2'},s); txt(s,60,32,'?','font:800 12px Inter,system-ui;fill:var(--ink)','middle'); },
    sg(s){ el('circle',{cx:60,cy:28,r:6,fill:C('s4')},s); [[12,10],[12,46],[108,10],[108,46]].forEach(([x,y])=>{ garrow(s,60,28,x,y,C('s3'),1.4,false); }); },
    cheap(s){ const n=[[60,8],[34,26],[86,26]]; [[0,1],[0,2]].forEach(([a,b])=>el('line',{x1:n[a][0],y1:n[a][1],x2:n[b][0],y2:n[b][1],stroke:C('s7'),'stroke-width':1.4},s));
      [[20,46],[48,46],[72,46],[100,46]].forEach(([x,y],i)=>{ el('line',{x1:n[1+Math.floor(i/2)][0],y1:n[1+Math.floor(i/2)][1],x2:x,y2:y,stroke:i===1?C('s4'):C('s7'),'stroke-width':i===1?2.4:1.2},s); el('circle',{cx:x,cy:y,r:4,fill:i===1?C('s4'):C('s7')},s); }); n.forEach(([x,y])=>el('circle',{cx:x,cy:y,r:4.5,fill:'var(--surface)',stroke:C('s7')},s)); },
    meet(s){ el('path',{d:'M6 13 C 40 13, 50 28, 70 28',stroke:C('s3'),'stroke-width':2.2,fill:'none'},s); el('path',{d:'M6 43 C 40 43, 50 28, 70 28',stroke:C('s1'),'stroke-width':2.2,fill:'none'},s); el('path',{d:'M70 28 L 100 28',stroke:C('s4'),'stroke-width':3,fill:'none'},s); el('circle',{cx:106,cy:28,r:6,fill:C('s4')},s);
      txt(s,8,8,'count','font:600 7.5px Inter,system-ui;fill:var(--ink-muted)'); txt(s,8,52,'predict','font:600 7.5px Inter,system-ui;fill:var(--ink-muted)'); },
    nlm(s){ ['s1','s1','s3','s6'].forEach((c,i)=>{ el('rect',{x:6+i*28,y:18,width:20,height:20,rx:5,fill:`color-mix(in srgb,var(--${c}) 22%,transparent)`,stroke:C(c)},s); if(i<3) garrow(s,27+i*28,28,33+i*28,28,'var(--ink-muted)',1.2,false); }); },
    para(s){ const P=[[20,14],[70,14],[90,44],[40,44]]; el('polygon',{points:P.map(p=>p.join(',')).join(' '),fill:'color-mix(in srgb,var(--s4) 12%,transparent)',stroke:C('s4'),'stroke-dasharray':'3 2'},s);
      garrow(s,20,14,40,44,C('s5'),1.6,false); garrow(s,70,14,90,44,C('s5'),1.6,false); P.forEach(([x,y],i)=>el('circle',{cx:x,cy:y,r:3.6,fill:i===2?C('s4'):C('s7')},s)); },
    pieces(s){ ['<ch','cha','hai','ai>'].forEach((g,i)=>{ el('rect',{x:4+i*29,y:17,width:26,height:20,rx:5,fill:i<3?'color-mix(in srgb,var(--s4) 22%,transparent)':'color-mix(in srgb,var(--s1) 14%,transparent)',stroke:i<3?C('s4'):C('s1')},s); txt(s,17+i*29,31,g,'font:700 8.5px ui-monospace,Menlo,monospace;fill:var(--ink)','middle'); }); }
  };
  function drawAll(){ minis.forEach(s=>{ s.innerHTML=''; const f=D[s.dataset.mini]; if(f) f(s); }); }
  drawAll(); onTheme(drawAll);
  U16['cards']={state(){ return [...minis].map(s=>({k:s.dataset.mini,n:s.children.length})); }};
})();
