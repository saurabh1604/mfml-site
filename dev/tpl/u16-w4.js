/* ================= UNIT 16 · widgets of §9–§11: w-analogy (the embedding explorer), w-polysemy, w-cosine ================= */

/* ---------- §9 · w-analogy: the embedding explorer (3-D, flagship) ---------- */
(function(){
  const box=document.getElementById('ex-3d'); if(!box||!CIN) return;
  const selA=document.getElementById('ex-a'), selB=document.getElementById('ex-b'), selC=document.getElementById('ex-c'), ans=document.getElementById('ex-ans'), read=document.getElementById('ex-read'), find=document.getElementById('ex-find');
  const GN={people:'people',tea:'tea and drinks',cricket:'cricket',animal:'animals',place:'places',bat:'two-faced'};
  const opts=['people','tea','cricket','animal','place','bat'].map(g=>`<optgroup label="${GN[g]}">`+EX.w.filter((w,i)=>EX.group[i]===g).map(w=>`<option value="${w}">${w}</option>`).join('')+'</optgroup>').join('');
  [selA,selB,selC].forEach(s=>{ s.innerHTML=opts; });
  document.getElementById('ex-list').innerHTML=EX.w.map(w=>`<option value="${w}">`).join('');
  const st={a:'king',b:'man',c:'woman',inc:false,names:!isNarrow(box),dirs:new Set(),focus:null,flash:0};
  const V=w=>EX.v[EX.idx[w]], POS=EX.v.map(exPos);
  const query=()=>vadd(vsub(V(st.a),V(st.b)),V(st.c));
  const PAIRS={female:[['king','queen'],['prince','princess'],['man','woman'],['boy','girl'],['father','mother'],['son','daughter'],['brother','sister'],['husband','wife'],['uncle','aunt'],['actor','actress']],
    royal:[['man','king'],['woman','queen'],['boy','prince'],['girl','princess']],
    young:[['dog','puppy'],['cat','kitten'],['cow','calf'],['lion','cub'],['horse','foal'],['man','boy'],['woman','girl'],['king','prince'],['queen','princess']],
    capital:[['India','Delhi'],['France','Paris'],['Japan','Tokyo'],['Italy','Rome'],['Nepal','Kathmandu'],['England','London']]};
  const DIRC={female:'s5',royal:'s4',young:'s6',capital:'s1',topic:'s2'};
  function result(){ const q=query(), skip=st.inc?null:[st.a,st.b,st.c], nn=exNearest(q,skip,5); return {q,nn}; }
  function readout(){ const {nn}=result(); ans.textContent=nn[0].w; ans.dataset.w=nn[0].w;
    const mx=nn[0].c;
    let h=`<b>${st.a} − ${st.b} + ${st.c}</b> ≈ <b style="color:var(--s4)">${nn[0].w}</b><br><span style="color:var(--ink-muted)">nearest by cosine (all 13 numbers)${st.inc?', inputs allowed':', skipping '+st.a+', '+st.b+', '+st.c}</span><table>`+
      nn.map((o,i)=>`<tr class="${i?'':'top'}"><td>${i+1}. ${o.w}</td><td class="n">${N(o.c,3)}</td><td style="width:40%"><span class="bar" style="width:${Math.max(4,100*(o.c-.5)/(Math.max(.5,mx-.5)||1)).toFixed(0)}%"></span></td></tr>`).join('')+'</table>';
    if(st.focus){ const fn=exNearest(V(st.focus),[st.focus],4); h+=`<div style="margin-top:.5rem"><b>${st.focus}</b>'s nearest words: `+fn.map(o=>`${o.w} <b>${N(o.c,2)}</b>`).join(' · ')+'</div>'; }
    read.innerHTML=h; box.dataset.answer=nn[0].w; box.dataset.q=[st.a,st.b,st.c].join(','); }
  let S3=null;
  function build(){ const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    return CIN.stage3d(box,{camera:{pos:camFit(box,[2.3,2.6,8.8],[.1,.05,-.4],1.18),look:[.1,.05,-.4],fov:40},orbit:true,autoRotate:.05,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
      starfield(ctx,700,22);
      const fl=CIN.prim.grid(ctx,14,28,hx('grid'),{opacity:isLight?.35:.16}); fl.position.y=-4.1; root.add(fl);
      const GC={people:hx(K16.people),tea:hx(K16.tea),cricket:hx(K16.cricket),animal:hx(K16.animal),place:hx(K16.place),bat:hx(K16.bat)};
      /* soft group glows */
      ['people','tea','cricket','animal','place'].forEach(g=>{ const idx=EX.w.map((_,i)=>i).filter(i=>EX.group[i]===g), m=[0,0,0]; idx.forEach(i=>POS[i].forEach((x,d)=>{ m[d]+=x/idx.length; })); const h=haloSprite(ctx,GC[g],3.6); h.position.set(...m); h.material.opacity=isLight?.07:.1; root.add(h); });
      const pts=EX.w.map((w,i)=>{ const c=GC[EX.group[i]]; const d=CIN.prim.dot(ctx,POS[i],c,.07); d.material.emissiveIntensity=isLight?.25:.7; const h=haloSprite(ctx,c,.42); h.position.set(...POS[i]); root.add(d,h); return {d,h,lab:slot(ctx,root)}; });
      /* the parallelogram */
      const pg=new THREE.Group(); root.add(pg);
      const quadGeo=new THREE.BufferGeometry(); quadGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(18),3));
      const quad=new THREE.Mesh(quadGeo,new THREE.MeshBasicMaterial({color:hx(K16.gold),transparent:true,opacity:isLight?.16:.12,side:THREE.DoubleSide,depthWrite:false})); pg.add(quad);
      const edgesT=[0,1,2,3].map(()=>{ const t=liveTube(ctx,hx(K16.gold),.012,.7); t.material.depthWrite=false; pg.add(t); return t; });
      const offA=CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s5'),{radius:.03,head:.22}), offB=CIN.prim.arrow(ctx,[0,0,0],[1,0,0],hx('s5'),{radius:.03,head:.22}); overlay(offA,11); overlay(offB,11); pg.add(offA,offB);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.2,.016,10,56),new THREE.MeshStandardMaterial({color:hx(K16.gold),emissive:hx(K16.gold),emissiveIntensity:isLight?.3:1,transparent:true,depthWrite:false})); pg.add(ring);
      const qdot=CIN.prim.dot(ctx,[0,0,0],hx(K16.gold),.06); pg.add(qdot); const snap=liveTube(ctx,hx(K16.gold),.006,.8); pg.add(snap);
      const tags=[slot(ctx,root),slot(ctx,root),slot(ctx,root),slot(ctx,root)];
      const focusRing=new THREE.Mesh(new THREE.TorusGeometry(.22,.012,10,56),new THREE.MeshBasicMaterial({color:hx('ink'),transparent:true,opacity:.9,depthWrite:false})); root.add(focusRing);
      const dirG=new THREE.Group(); root.add(dirG);
      ctx.pulse=()=>{ if(st.focus){ const p=POS[EX.idx[st.focus]]; focusRing.visible=true; focusRing.position.set(...p); focusRing.lookAt(ctx.camera.position); focusRing.scale.setScalar(1+.25*Math.sin(performance.now()/260)); } else focusRing.visible=false; ring.lookAt(ctx.camera.position); };
      ctx.redraw=()=>{ const {q,nn}=result(), A=POS[EX.idx[st.a]], B=POS[EX.idx[st.b]], C=POS[EX.idx[st.c]], D=exPos(q), best=POS[nn[0].i];
        const vs=[B,A,D,C]; const arr=quadGeo.attributes.position.array; [B,A,D,B,D,C].forEach((p,j)=>{ arr[3*j]=p[0]; arr[3*j+1]=p[1]; arr[3*j+2]=p[2]; }); quadGeo.attributes.position.needsUpdate=true; quadGeo.computeBoundingSphere();
        [[B,A],[A,D],[D,C],[C,B]].forEach(([p,r],j)=>aimTube(THREE,edgesT[j],p,r));
        offA.userData.set(new THREE.Vector3(...B),new THREE.Vector3(...C)); offB.userData.set(new THREE.Vector3(...A),new THREE.Vector3(...D));
        qdot.position.set(...D); ring.position.set(...best); ring.lookAt(ctx.camera.position); aimTube(THREE,snap,D,best);
        const hot=new Set([st.a,st.b,st.c,nn[0].w]);
        pts.forEach((o,i)=>{ const w=EX.w[i], on=hot.has(w)||w===st.focus; o.d.scale.setScalar(on?1.6:1); o.h.material.opacity=(isLight?.3:.6)*(on?1.4:.8);
          const show=st.names||on||nn.slice(0,3).some(n=>n.w===w);
          o.lab.set(show?w:'',[POS[i][0],POS[i][1]+(on?.26:.19),POS[i][2]],{size:on?23:18,scale:(on?.0108:.0092)*LSc(box),color:w===nn[0].w?colors.s4:on?colors.ink:colors.ink2,bg:on||isLight,weight:on?800:600}); });
        tags[0].set('A',[A[0]-.18,A[1]-.22,A[2]],{size:18,scale:.008,color:colors.s4,bg:true,weight:800}); tags[1].set('B',[B[0]-.18,B[1]-.22,B[2]],{size:18,scale:.008,color:colors.s4,bg:true,weight:800});
        tags[2].set('C',[C[0]-.18,C[1]-.22,C[2]],{size:18,scale:.008,color:colors.s4,bg:true,weight:800}); tags[3].set('A − B + C',[D[0]+.1,D[1]-.28,D[2]],{size:17,scale:.0078,color:colors.s4,bg:true,weight:700});
        ctx.pulse();
        /* direction arrows */
        clearGroup(dirG);
        st.dirs.forEach(d=>{ const c=hx(DIRC[d]);
          if(d==='topic'){ const m=g=>{ const idx=EX.w.map((_,i)=>i).filter(i=>EX.group[i]===g), s=[0,0,0]; idx.forEach(i=>POS[i].forEach((x,k)=>{ s[k]+=x/idx.length; })); return s; };
            const a=CIN.prim.arrow(ctx,m('tea'),m('cricket'),c,{radius:.045,head:.3}); overlay(a,9); dirG.add(a); return; }
          PAIRS[d].forEach(([x,y])=>{ const a=CIN.prim.arrow(ctx,POS[EX.idx[x]],POS[EX.idx[y]],c,{radius:.018,head:.16}); overlay(a,9); dirG.add(a); }); });
        RR(ctx); };
      ctx.redraw(); if(fine) hint(box,'drag to orbit');
    },
    update(ctx){ if(ctx.pulse){ ctx.pulse(); return !!st.focus; } return false; } }); }
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
  selA.value=st.a; selB.value=st.b; selC.value=st.c; document.getElementById('ex-names').setAttribute('aria-pressed',st.names); readout();
  window.U16Ex={st,setQ,result,redraw,focus(w){ find.value=w; tryFind(); }};
})();

/* ---------- §10 · w-polysemy: the word with two lives (3-D) ---------- */
(function(){
  const box=document.getElementById('po-3d'); if(!box||!CIN) return;
  const read=document.getElementById('po-read'), st={s:.5};
  const CRI=EX.w.filter((w,i)=>EX.group[i]==='cricket'), ANI=EX.w.filter((w,i)=>EX.group[i]==='animal');
  const mean=ws=>{ const m=EX.v[0].map(()=>0); ws.forEach(w=>EX.v[EX.idx[w]].forEach((x,d)=>{ m[d]+=x/ws.length; })); return m; };
  const CM=mean(CRI), AM=mean(ANI);
  const batV=()=>vadd(vscale(CM,st.s),vscale(AM,1-st.s));
  const near=()=>exNearest(batV(),['bat'],3);
  function readout(){ const b=batV(), nn=near();
    read.innerHTML=`bat = <b>${N(100*st.s,0)}%</b> cricket meaning + <b>${N(100*(1-st.s),0)}%</b> animal meaning<br>cos with the cricket meaning <b>${N(cosSim(b,CM),3)}</b><br>cos with the animal meaning <b>${N(cosSim(b,AM),3)}</b><br>nearest words: `+nn.map(o=>`${o.w} <b>${N(o.c,2)}</b>`).join(' · ');
    box.dataset.s=st.s.toFixed(3); box.dataset.nn=nn.map(o=>o.w).join(','); }
  let S3=null;
  const MID=[0,1,2].map(d=>(exPos(CM)[d]+exPos(AM)[d])/2);
  function build(){ return CIN.stage3d(box,{camera:{pos:camFit(box,[MID[0]+.9,MID[1]+1.5,MID[2]+5.0],MID,1.3),look:MID,fov:40},orbit:true,autoRotate:.07,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
      starfield(ctx,380,16); const fl=CIN.prim.grid(ctx,12,24,hx('grid'),{opacity:isLight?.35:.18}); fl.position.y=MID[1]-1.6; root.add(fl);
      const cc=hx(K16.cricket), ac=hx(K16.animal), pc=hx(K16.bat);
      const draw=(ws,c)=>ws.forEach(w=>{ const p=exPos(EX.v[EX.idx[w]]); const d=CIN.prim.dot(ctx,p,c,.07); const h=haloSprite(ctx,c,.45); h.position.set(...p); root.add(d,h); root.add(lab(ctx,w,[p[0],p[1]+.2,p[2]],{size:18,scale:.0078*LSc(box),color:colors.ink2,bg:isLight})); });
      draw(CRI,cc); draw(ANI,ac);
      const pC=exPos(CM), pA=exPos(AM);
      [[pC,cc,'cricket meaning'],[pA,ac,'animal meaning']].forEach(([p,c,t])=>{ const h=haloSprite(ctx,c,2.6); h.position.set(...p); h.material.opacity=isLight?.1:.16; root.add(h); root.add(lab(ctx,t,[p[0],p[1]-.42,p[2]],{size:19,scale:.0082*LSc(box),color:t[0]==='c'?colors.s3:colors.s4,bg:true,weight:700})); });
      const path=[]; for(let i=0;i<=24;i++){ const u=i/24; path.push(exPos(vadd(vscale(CM,u),vscale(AM,1-u)))); }
      for(let i=0;i<24;i+=2) root.add(tube(ctx,path[i],path[i+1],pc,.008,.6));
      const bat=CIN.prim.dot(ctx,[0,0,0],pc,.13); const bh=haloSprite(ctx,pc,1.1); root.add(bat,bh); const bl=slot(ctx,root);
      const links=[0,1,2].map(()=>{ const t=liveTube(ctx,pc,.007,.7); t.material.depthWrite=false; root.add(t); return t; });
      ctx.redraw=()=>{ const p=exPos(batV()); bat.position.set(...p); bh.position.set(...p); bl.set('bat',[p[0],p[1]+.32,p[2]],{size:26,scale:.0098*LSc(box),color:colors.s5,bg:true,weight:800});
        near().forEach((o,j)=>aimTube(THREE,links[j],p,exPos(EX.v[o.i]))); RR(ctx); };
      ctx.redraw(); if(matchMedia('(hover:hover) and (pointer:fine)').matches) hint(box,'drag to orbit');
    }}); }
  S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  bindCtl('po-s',v=>{ st.s=v; redraw(); },v=>N(100*v,0)+'%');
  const goTo=to=>{ const from=st.s; tween(1300,u=>{ st.s=from+(to-from)*u; setCtl('po-s',st.s,v=>N(100*v,0)+'%'); redraw(); }); };
  document.getElementById('po-cric').addEventListener('click',()=>goTo(.95));
  document.getElementById('po-anim').addEventListener('click',()=>goTo(.05));
  readout(); window.U16Poly={st,redraw,set(s){ st.s=s; setCtl('po-s',s,v=>N(100*v,0)+'%'); redraw(); }};
})();

/* ---------- §11 · w-cosine: three rulers for "similar" ---------- */
(function(){
  const svg=document.getElementById('cz-svg'); if(!svg) return;
  const read=document.getElementById('cz-read'); const st={a:[2,1],b:[4,2],norm:false,drag:null}; let geo=null;
  const shown=v=>st.norm?vscale(v,1/(norm(v)||1)):v;
  function draw(){ const narrow=vbFor(svg,'0 0 480 360','0 0 340 320'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg);
    const W=narrow?340:480, H=narrow?320:360, X0=-1.2,X1=5.2,Y0=-1.2,Y1=4.2, s=Math.min((W-24)/(X1-X0),(H-24)/(Y1-Y0)), ox=(W-s*(X1-X0))/2, oy=(H-s*(Y1-Y0))/2;
    const px=x=>ox+(x-X0)*s, py=y=>oy+(Y1-y)*s; geo={px,py,ix:X=>X0+(X-ox)/s,iy:Y=>Y1-(Y-oy)/s};
    for(let x=Math.ceil(X0);x<=X1;x++) el('line',{x1:px(x),x2:px(x),y1:py(Y0),y2:py(Y1),stroke:'var(--grid)','stroke-width':1},svg);
    for(let y=Math.ceil(Y0);y<=Y1;y++) el('line',{x1:px(X0),x2:px(X1),y1:py(y),y2:py(y),stroke:'var(--grid)','stroke-width':1},svg);
    el('line',{x1:px(X0),x2:px(X1),y1:py(0),y2:py(0),stroke:'var(--axis)','stroke-width':1.4},svg); el('line',{x1:px(0),x2:px(0),y1:py(Y0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.4},svg);
    el('circle',{cx:px(0),cy:py(0),r:s,fill:'none',stroke:cv(K16.gold),'stroke-width':st.norm?1.8:1,'stroke-dasharray':'4 4',opacity:st.norm?.9:.45},svg);
    const a=shown(st.a), b=shown(st.b), c=cosSim(a,b), th=Math.acos(Math.max(-1,Math.min(1,c))), aa=Math.atan2(a[1],a[0]), ab=Math.atan2(b[1],b[0]);
    const r=Math.min(norm(a),norm(b),1.2)*s*.45, a0=Math.min(aa,ab), a1=Math.max(aa,ab), big=(a1-a0)>Math.PI?1:0;
    el('path',{d:`M${px(0)+r*Math.cos(a0)},${py(0)-r*Math.sin(a0)} A${r},${r} 0 ${big} 0 ${px(0)+r*Math.cos(a1)},${py(0)-r*Math.sin(a1)}`,fill:'none',stroke:cv(K16.gold),'stroke-width':2},svg);
    el('line',{x1:px(a[0]),y1:py(a[1]),x2:px(b[0]),y2:py(b[1]),stroke:'var(--critical)','stroke-width':1.8,'stroke-dasharray':'5 4'},svg);
    garrow(svg,px(0),py(0),px(a[0]),py(a[1]),cv(K16.word),3.2,!!glow); garrow(svg,px(0),py(0),px(b[0]),py(b[1]),cv('s5'),3.2,!!glow);
    [['a',a,K16.word],['b',b,'s5']].forEach(([n,v,col])=>{ el('circle',{cx:px(v[0]),cy:py(v[1]),r:11,fill:cv(col),opacity:.18},svg); txt(svg,px(v[0])+10,py(v[1])-8,n+' '+vecN(v,2),FT(800,11,k,cv(col))); });
    const d=norm(vsub(a,b));
    read.innerHTML=`a·b = <b>${N(dot(a,b),3)}</b><br>cos θ = <b>${N(c,3)}</b> · θ = <b>${N(th*180/Math.PI,1)}°</b><br>distance ‖a − b‖ = <b>${N(d,3)}</b>`+(st.norm?`<br><span style="color:var(--ink-muted)">√(2 − 2 cos θ) = ${N(Math.sqrt(Math.max(0,2-2*c)),3)}</span>`:'');
    svg.dataset.cos=c.toFixed(6); svg.dataset.dist=d.toFixed(6); svg.dataset.dot=dot(a,b).toFixed(6); }
  svgDrag(svg,(x,y)=>{ if(!geo) return false; let best=null, bd=30*(+svg.viewBox.baseVal.width/(svg.getBoundingClientRect().width||1));
      ['a','b'].forEach(n=>{ const v=shown(st[n]), dd=Math.hypot(geo.px(v[0])-x,geo.py(v[1])-y); if(dd<bd){ bd=dd; best=n; } }); st.drag=best; return !!best; },
    (x,y)=>{ if(!st.drag) return; let v=[Math.round(geo.ix(x)*10)/10,Math.round(geo.iy(y)*10)/10]; if(Math.hypot(...v)<.2) return; st[st.drag]=v.map(q=>Math.max(-1.1,Math.min(5,q))); draw(); },()=>{ st.drag=null; });
  document.getElementById('cz-norm').addEventListener('click',e=>{ st.norm=!st.norm; e.currentTarget.setAttribute('aria-pressed',st.norm); draw(); });
  document.getElementById('cz-shop').addEventListener('click',()=>{ st.a=[2,1]; st.b=[4,2]; draw(); });
  document.getElementById('cz-right').addEventListener('click',()=>{ st.a=[3,0]; st.b=[0,2]; draw(); });
  draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  window.U16Cos={st,draw,set(a,b){ st.a=a; st.b=b; draw(); }};
})();
