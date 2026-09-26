/* ================= UNIT 18 · Act I widgets: w-relay, w-lookup, w-qkv ================= */

/* ---------- §1 · w-relay: pass the message, or ask directly ---------- */
(function(){
  const svg=document.getElementById('rl-svg'); if(!svg) return;
  const read=document.getElementById('rl-read');
  const WORDS=['the','train','to','delhi','is','late','because','of','the','heavy','rain','today'];
  const st={mode:'relay',n:8,t:1};            /* t = progress of the story, 0…1 (1 = finished) */
  let narrow=false;
  function layout(){ const n=st.n;
    if(!narrow){ svg.setAttribute('viewBox','0 0 760 330'); const x0=60,x1=700; return {W:760,H:330,P:Array.from({length:n},(_,i)=>[x0+(x1-x0)*i/(n-1),222]),row:true}; }
    svg.setAttribute('viewBox','0 0 400 430'); const cx=200,cy=205,r=150;
    return {W:400,H:430,P:Array.from({length:n},(_,i)=>{ const a=Math.PI+i/n*2*Math.PI; return [cx+r*Math.cos(a),cy+r*Math.sin(a)]; }),row:false}; }
  function draw(){ svg.innerHTML=''; const L=layout(), n=st.n, glow=glo(svg), F=fz(svg,12), Fs=fz(svg,10.5), P=L.P;
    const blue=cv(K18.tok), gold=cv(K18.w);
    const g=el('g',{},svg);
    if(st.mode==='all'){
      /* every pair joined directly: arcs above the row (or chords across the circle) */
      const lit=clamp01(st.t*1.4);
      for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){ const [x1,y1]=P[i],[x2,y2]=P[j];
        let d; if(L.row){ const h=Math.min(185,24+(x2-x1)*.36); d=`M${x1},${y1-14} Q${(x1+x2)/2},${y1-14-h*2} ${x2},${y2-14}`; } else d=`M${x1},${y1} Q${(x1+x2)/2*.5+100},${(y1+y2)/2*.5+102} ${x2},${y2}`;
        el('path',{d,fill:'none',stroke:gold,'stroke-width':1.3,opacity:(.12+.6*lit).toFixed(3),filter:glow&&lit>.5?glow:'none'},g); }
    } else {
      /* the relay: one hop after another; the first word's voice halves each time */
      for(let i=0;i+1<n;i++){ const [x1,y1]=P[i],[x2,y2]=P[i+1]; el('line',{x1,y1,x2,y2,stroke:'var(--ink-muted)','stroke-width':1.4,'stroke-dasharray':'4 4',opacity:.55},g);
        if(L.row){ const done=st.t*(n-1)>=i+1-1e-9, mx=(x1+x2)/2; el('path',{d:`M${x1+8},${y1-40} Q${mx},${y1-96} ${x2-8},${y2-40}`,fill:'none',stroke:done?cv(K18.q):'var(--ink-muted)','stroke-width':done?2:1.2,opacity:done?.9:.4,'marker-end':''},g);
          txt(svg,mx,y1-78,'turn '+(i+1),`font:700 ${Fs}px system-ui;fill:${done?'var(--s2)':'var(--ink-muted)'}`,'middle'); } }
      const hop=st.t*(n-1), k=Math.floor(Math.min(n-1.0001,hop)), f=hop-k;
      const a=P[k], b=P[Math.min(n-1,k+1)], x=a[0]+(b[0]-a[0])*f, y=a[1]+(b[1]-a[1])*f, v=Math.pow(.5,hop);
      if(st.t<1){ el('circle',{cx:x,cy:y,r:(5+14*Math.sqrt(v)).toFixed(2),fill:cv(K18.q),opacity:(.25+.75*v).toFixed(3),filter:glow||'none'},g); }
      /* the voice that reached each word */
      P.forEach(([px,py],i)=>{ if(i>hop+1e-9) return; const vv=Math.pow(.5,i), bh=46*vv;
        if(L.row){ el('rect',{x:px-7,y:py+30,width:14,height:Math.max(1.5,bh),rx:3,fill:cv(K18.q),opacity:.85},g); txt(svg,px,py+30+Math.max(1.5,bh)+F*1.1,N(vv,vv<.01?4:3),`font:700 ${Fs}px system-ui;fill:var(--s2)`,'middle'); } });
    }
    /* the words */
    P.forEach(([x,y],i)=>{ glowDot(svg,x,y,9,blue,glow); const w=WORDS[i];
      if(L.row) txt(svg,x,y-22,w,`font:600 ${F}px system-ui;fill:var(--ink)`,'middle');
      else { const cx=200,cy=205, dx=x-cx, dy=y-cy, d=Math.hypot(dx,dy)||1; txt(svg,x+dx/d*30,y+dy/d*26+F*.35,w,`font:600 ${F}px system-ui;fill:var(--ink)`,'middle'); } });
    if(!L.row&&st.mode==='relay'){ const hop=st.t*(n-1); txt(svg,200,210,'voice left: '+N(Math.pow(.5,hop),3),`font:700 ${F}px system-ui;fill:var(--s2)`,'middle'); }
    if(L.row) txt(svg,20,24,st.mode==='relay'?'hop after hop — the note fades':'every pair joined — one hop each',`font:700 ${F}px system-ui;fill:var(--ink-muted)`);
    const n2=n*n;
    read.innerHTML=st.mode==='relay'
      ?'Relay · hand-overs from the first word to the last: <b>'+(n-1)+'</b> · steps that must wait in a row: <b>'+n+'</b><br>the first word\'s voice at the end: 0.5<sup>'+(n-1)+'</sup> ≈ <b>'+N(Math.pow(.5,n-1),4)+'</b>'
      :'Attention · questions asked: '+n+' × '+n+' = <b>'+n2+'</b> · hops from the first word to the last: <b>1</b><br>steps that must wait in a row: <b>1</b> — all questions at the same time';
    svg.dataset.state=st.mode+','+n; }
  bindCtl('rl-n',v=>{ st.n=v; st.t=1; draw(); },v=>String(v));
  tabs(document.getElementById('rl-mode'),t=>{ st.mode=t; st.t=1; draw(); });
  let tw=null; document.getElementById('rl-play').addEventListener('click',()=>{ if(tw) tw.stop(); st.t=0; tw=tween(st.mode==='relay'?3200:1400,u=>{ st.t=u; draw(); },()=>{ st.t=1; draw(); }); });
  relayout(svg,()=>{ narrow=narrowOf(svg); draw(); });
  window.U18Relay={st,draw};
})();

/* ---------- §2 · w-lookup: the strict shopkeeper and the kind one ---------- */
(function(){
  const svg=document.getElementById('lk-svg'); if(!svg) return;
  const read=document.getElementById('lk-read');
  const D=[{n:'masala chai',k:[1,1],c:'#c68642',p:10},{n:'black coffee',k:[-.5,1.3],c:'#4a2c1a',p:20},{n:'lassi',k:[1.3,-.7],c:'#f1ead6',p:30},{n:'lemon tea',k:[-1,-.5],c:'#e9c046',p:15}];
  const st={q:[1.5,1],beta:1,mode:'soft'};
  const mixHex=(w)=>{ const rgb=D.map(d=>[1,3,5].map(o=>parseInt(d.c.slice(o,o+2),16))); const m=[0,1,2].map(c=>Math.round(rgb.reduce((s,r,i)=>s+w[i]*r[c],0))); return '#'+m.map(v=>v.toString(16).padStart(2,'0')).join(''); };
  function shares(){ const s=D.map(d=>st.beta*dot(st.q,d.k)); if(st.mode==='hard'){ const b=s.indexOf(Math.max(...s)); return {s,w:s.map((_,i)=>i===b?1:0)}; } return {s,w:softmax(s)}; }
  let narrow=false, map=null;
  function draw(){ svg.innerHTML=''; narrow=narrowOf(svg);
    svg.setAttribute('viewBox',narrow?'0 0 400 740':'0 0 640 380');
    const glow=glo(svg), F=fz(svg,12), Fs=fz(svg,10.5);
    const MX=narrow?[20,380]:[16,366], MY=narrow?[16,376]:[12,368], R=2.2;
    const px=x=>MX[0]+(x+R)/(2*R)*(MX[1]-MX[0]), py=y=>MY[1]-(y+R)/(2*R)*(MY[1]-MY[0]);
    map={px,py,ix:X=>(X-MX[0])/(MX[1]-MX[0])*2*R-R,iy:Y=>(MY[1]-Y)/(MY[1]-MY[0])*2*R-R};
    const g=el('g',{},svg);
    el('rect',{x:MX[0],y:MY[0],width:MX[1]-MX[0],height:MY[1]-MY[0],rx:10,fill:'none',stroke:'var(--line)'},g);
    for(let v=-2;v<=2;v++){ el('line',{x1:px(v),y1:MY[0],x2:px(v),y2:MY[1],stroke:'var(--grid)','stroke-width':1},g); el('line',{x1:MX[0],y1:py(v),x2:MX[1],y2:py(v),stroke:'var(--grid)','stroke-width':1},g); }
    el('line',{x1:MX[0],y1:py(0),x2:MX[1],y2:py(0),stroke:'var(--axis)','stroke-width':1.3},g); el('line',{x1:px(0),y1:MY[0],x2:px(0),y2:MY[1],stroke:'var(--axis)','stroke-width':1.3},g);
    txt(svg,MX[1]-6,py(0)-6,'more milky →',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'end');
    txt(svg,px(0)+6,MY[0]+F+2,'↑ more strong',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`);
    const {s,w}=shares(), P={px,py,svg,glow};
    D.forEach((d,i)=>{ const [x,y]=d.k; if(w[i]>.004) el('circle',{cx:px(x),cy:py(y),r:(8+46*Math.sqrt(w[i])).toFixed(2),fill:cv(K18.w),opacity:(.10+.30*w[i]).toFixed(3)},g);
      arrow(P,0,0,x,y,cv(K18.k),2.4); el('circle',{cx:px(x),cy:py(y),r:9,fill:d.c,stroke:'var(--ink-2)','stroke-width':1.2},svg);
      const above=y>=0, lx=px(x), ly=above?py(y)-18-F*1.15:py(y)+18+F*.8;
      txt(svg,lx,ly,d.n,`font:700 ${F}px system-ui;fill:var(--ink)`,'middle');
      txt(svg,lx,ly+F*1.15,'₹'+d.p+' · score '+N(s[i],2),`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'middle'); });
    arrow(P,0,0,st.q[0],st.q[1],cv(K18.q),3.4);
    { const qx=px(st.q[0]), qy=py(st.q[1]), below=st.q[1]>=0; txt(svg,qx+(st.q[0]>=0?-6:6),qy+(below?22+F*.4:-16),'your wish',`font:700 ${F}px system-ui;fill:var(--s2)`,st.q[0]>=0?'end':'start'); }
    el('circle',{cx:px(st.q[0]),cy:py(st.q[1]),r:13,fill:cv(K18.q),opacity:.18,style:'cursor:grab'},svg);
    /* the shares and the cup */
    const BX=narrow?30:392, BY=narrow?410:40, BW=narrow?200:150, bh=narrow?26:30;
    txt(svg,BX,BY-10,st.mode==='soft'?'shares (softmax)':'the one best match',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    D.forEach((d,i)=>{ const y=BY+i*(bh+10); el('rect',{x:BX,y,width:BW,height:bh,rx:6,fill:'var(--grid)',opacity:.45},svg);
      el('rect',{x:BX,y,width:Math.max(1.5,BW*w[i]),height:bh,rx:6,fill:cv(K18.w),opacity:.9,filter:glow&&w[i]>.3?glow:'none'},svg);
      txt(svg,BX+6,y+bh/2+F*.36,d.n,`font:600 ${F}px system-ui;fill:var(--ink)`);
      txt(svg,BX+BW+6,y+bh/2+F*.36,N(w[i],3),`font:700 ${F}px system-ui;fill:var(--s4)`); });
    const price=w.reduce((a,x,i)=>a+x*D[i].p,0), mix=mixHex(w);
    const CX=narrow?190:470, CY=narrow?590:222, cw=narrow?84:96, chh=narrow?100:112;
    el('path',{d:`M${CX-cw/2},${CY} L${CX+cw/2},${CY} L${CX+cw/2-12},${CY+chh} L${CX-cw/2+12},${CY+chh} Z`,fill:mix,stroke:'var(--ink-2)','stroke-width':2},svg);
    el('path',{d:`M${CX+cw/2-2},${CY+22} q26,6 18,34 q-6,16 -24,12`,fill:'none',stroke:'var(--ink-2)','stroke-width':3},svg);
    el('ellipse',{cx:CX,cy:CY,rx:cw/2,ry:7,fill:mix,stroke:'var(--ink-2)','stroke-width':1.5},svg);
    txt(svg,CX,CY+chh+F*1.6,'your cup: ₹'+N(price,2),`font:800 ${fz(svg,14)}px system-ui;fill:var(--ink)`,'middle');
    read.innerHTML=(st.mode==='soft'?'Kind (attention) · ':'Strict (dictionary) · ')+'scores = pickiness × (wish · key)<br>'+D.map((d,i)=>d.n+' <b>'+N(w[i],3)+'</b>').join(' · ')+'<br>price of your cup: <b>₹'+N(price,2)+'</b>';
    svg.dataset.state=[st.mode,N(st.q[0],2),N(st.q[1],2),N(st.beta,2),N(price,2)].join(','); }
  svgDrag(svg,(x,y)=>{ if(!map) return false; const X=map.px(st.q[0]),Y=map.py(st.q[1]); if(Math.hypot(x-X,y-Y)>40) return false; },(x,y)=>{ const cl2=v=>Math.max(-2,Math.min(2,Math.round(v*20)/20)); st.q=[cl2(map.ix(x)),cl2(map.iy(y))]; setCtl('lk-qx',st.q[0],v=>N(v,2)); setCtl('lk-qy',st.q[1],v=>N(v,2)); draw(); });
  bindCtl('lk-qx',v=>{ st.q[0]=v; draw(); },v=>N(v,2)); bindCtl('lk-qy',v=>{ st.q[1]=v; draw(); },v=>N(v,2));
  bindCtl('lk-s',v=>{ st.beta=v; draw(); },v=>N(v,1));
  tabs(document.getElementById('lk-mode'),t=>{ st.mode=t; draw(); });
  relayout(svg,draw);
  window.U18Lookup={st,draw,shares};
})();

/* ---------- §3 · w-qkv: one lookup in space (3-D) ---------- */
(function(){
  const box=document.getElementById('qk-3d'); if(!box||!CIN) return;
  const read=document.getElementById('qk-read'), matBox=document.getElementById('qk-mat');
  const st={ang:0,len:2,phase:4,preset:0};      /* phase 0…4: how far the story has run (4 = everything shown) */
  const q=()=>[st.len*Math.cos(st.ang*Math.PI/180),st.len*Math.sin(st.ang*Math.PI/180)].map(v=>Math.abs(v)<1e-9?0:v);
  const calc=()=>attend([q()],EX.K,EX.V);
  const UP=2.7;                                   /* height of the value floor */
  function readout(){ const r=calc(), qq=q(), raw=EX.K.map(k=>dot(qq,k));
    read.innerHTML='query <b style="color:var(--s2)">q = '+vecN(qq,3)+'</b><br>'+
      '① q·k = '+vecN(raw,3)+' → ÷√2 = <b>'+vecN(r.S[0],3)+'</b><br>'+
      '② shares = <b style="color:var(--s4)">'+vecN(r.A[0],3)+'</b><br>'+
      '③ blend: '+r.A[0].map((w,i)=>N(w,3)+'·v'+SUB(i+1)).join(' + ')+'<br>'+
      '④ answer = <b style="color:var(--ink)">'+vecN(r.O[0],3)+'</b>';
    box.dataset.state=[vecN(qq,3),vecN(r.A[0],3),vecN(r.O[0],3)].join(' ');
    /* the matrix form: every query at once, with this query's row lit */
    const all=attend(EX.Q,EX.K,EX.V), same=EX.Q.findIndex(r=>Math.abs(r[0]-qq[0])<1e-6&&Math.abs(r[1]-qq[1])<1e-6);
    const Q=same>=0?EX.Q:[qq], A=same>=0?all.A:r.A, O=same>=0?all.O:r.O, hi=same>=0?same:0;
    const rc=(i)=>i===hi?'rowhot':'';
    matBox.innerHTML=`<span class="qk-blk"><span class="qk-lab">softmax</span></span><span class="op">(</span><span class="qk-blk"><span class="qk-lab">Q</span>${matHTML(Q,{tone:'q',cell:rc})}</span><span class="qk-blk"><span class="qk-lab">Kᵀ</span>${matHTML(T_(EX.K),{tone:'k'})}</span><span class="op">/ √2 )</span><span class="op">=</span><span class="qk-blk"><span class="qk-lab">A</span>${matHTML(A,{tone:'gold',cell:rc})}</span><span class="op">·</span><span class="qk-blk"><span class="qk-lab">V</span>${matHTML(EX.V,{tone:'v'})}</span><span class="op">=</span><span class="qk-blk"><span class="qk-lab">answers</span>${matHTML(O,{tone:'par',cell:rc})}</span>`;
  }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[-2.1,5.0,5.0],look:[.6,1.25,-.6],fov:38},orbit:true,autoRotate:.1,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx), dark=!isLight;
      starfield(ctx,240,15); glassFloor(ctx,6.4,{div:24});
      const up=CIN.prim.glass(ctx,5.2,5.2,hx('s3'),dark?.07:.12); up.rotation.x=-Math.PI/2; up.position.y=UP; root.add(up);
      const upGrid=CIN.prim.grid(ctx,5.2,20,hx('grid'),{opacity:dark?.22:.35}); upGrid.position.y=UP+.002; root.add(upGrid);
      const stem=liveTube(ctx,hx('ink2'),.006,.35); aimTube(THREE,stem,[0,0,0],[0,UP,0]); root.add(stem);
      const C={q:hx(K18.q),k:hx(K18.k),v:hx(K18.v),w:hx(K18.w),ink:hx('ink')};
      const P2=(x,y,h)=>[x,h||0,-y];
      const keyA=EX.K.map(k=>{ const a=CIN.prim.arrow(ctx,P2(0,0,.02),P2(k[0],k[1],.02),C.k,{radius:.035,head:.2}); root.add(a); return a; });
      EX.K.forEach((k,i)=>root.add(lab(ctx,'k'+SUB(i+1),P2(k[0]+(k[0]?.32:-.3),k[1]-(k[1]?.0:.3)+(i===1?.25:0),.12),{size:26,scale:.011,color:colors.s1,bg:true})));
      const valA=EX.V.map((v,i)=>{ const a=CIN.prim.arrow(ctx,P2(0,0,UP+.02),P2(v[0],v[1],UP+.02),C.v,{radius:.03,head:.2}); a.traverse(m=>{ if(m.material){ m.material.transparent=true; m.material.opacity=.45; } }); root.add(a);
        root.add(lab(ctx,'v'+SUB(i+1),P2(v[0]+.15,v[1]+.2,UP+.05),{size:22,scale:.011,color:colors.s3,bg:!dark})); return a; });
      const qArrow=CIN.prim.arrow(ctx,P2(0,0,.03),P2(2,0,.03),C.q,{radius:.045,head:.24}); root.add(qArrow); const qLab=slot(ctx,root);
      /* shadows of q on each key line (the dot product as a projection) */
      const proj=EX.K.map(()=>{ const t=liveTube(ctx,C.q,.008,.55); root.add(t); const d=CIN.prim.dot(ctx,[0,0,0],C.q,.05); root.add(d); return {t,d}; });
      /* gold pillars: the shares */
      const pil=EX.K.map(k=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,1,28),new THREE.MeshStandardMaterial({color:C.w,emissive:C.w,emissiveIntensity:dark?.55:.2,roughness:.3,transparent:true,opacity:.78})); m.position.set(...P2(k[0],k[1],0)); root.add(m); return m; });
      const pilLab=EX.K.map(()=>slot(ctx,root));
      /* the chain of shrunken values, and the answer */
      const chain=EX.V.map(()=>{ const a=CIN.prim.arrow(ctx,[0,UP,0],[.5,UP,0],C.v,{radius:.04,head:.16}); root.add(a); return a; });
      const out=CIN.prim.arrow(ctx,[0,UP,0],[1,UP,0],C.ink,{radius:.055,head:.26}); root.add(out); const outH=haloSprite(ctx,C.ink,.6); root.add(outH); const outLab=slot(ctx,root);
      const hudEl=hud(box); hint(box,'drag to orbit');
      ctx.redraw=()=>{ const qq=q(), r=calc(), w=r.A[0], ph=st.phase, V3=THREE.Vector3;
        const qv=qq.map(x=>x);
        if(Math.hypot(...qv)>1e-6){ qArrow.visible=true; qArrow.userData.set(new V3(...P2(0,0,.03)),new V3(...P2(qv[0],qv[1],.03))); } else qArrow.visible=false;
        qLab.set('q',P2(qv[0]*1.1+.1,qv[1]*1.1+.1,.3),{size:26,scale:.011,color:colors.s2,bg:!dark});
        /* ① projections */
        const u1=clamp01(ph);
        EX.K.forEach((k,i)=>{ const L2=dot(k,k), t=dot(qv,k)/L2, f=[k[0]*t,k[1]*t];
          aimTube(THREE,proj[i].t,P2(qv[0],qv[1],.04),P2(f[0],f[1],.04)); proj[i].t.visible=u1>.02&&Math.hypot(qv[0]-f[0],qv[1]-f[1])>.02; proj[i].t.material.opacity=.55*u1;
          proj[i].d.position.set(...P2(f[0],f[1],.04)); proj[i].d.visible=u1>.02; });
        /* ② pillars */
        const u2=easeIO(clamp01(ph-1));
        pil.forEach((m,i)=>{ const h=Math.max(.002,w[i]*2.2*u2); m.scale.y=h; m.position.y=h/2; m.visible=u2>.01;
          if(u2>.5) pilLab[i].set(N(w[i],3),[m.position.x,h+.28,m.position.z],{size:24,scale:.011,color:colors.s4,bg:!dark}); else pilLab[i].hide(); });
        /* ③ chain of shrunken values */
        const u3=clamp01(ph-2); let acc=[0,0];
        chain.forEach((a,i)=>{ const part=easeIO(clamp01(u3*3-i)), v=EX.V[i], s=[v[0]*w[i]*part,v[1]*w[i]*part];
          const A=P2(acc[0],acc[1],UP+.05), B=P2(acc[0]+s[0],acc[1]+s[1],UP+.05);
          a.visible=part>.02&&Math.hypot(s[0],s[1])>.03; if(a.visible) a.userData.set(new V3(...A),new V3(...B)); acc=[acc[0]+s[0],acc[1]+s[1]]; });
        /* ④ the answer */
        const u4=easeIO(clamp01(ph-3)), o=r.O[0];
        out.visible=u4>.02&&Math.hypot(...o)>.03; if(out.visible) out.userData.set(new V3(...P2(0,0,UP+.08)),new V3(...P2(o[0]*u4,o[1]*u4,UP+.08)));
        outH.position.set(...P2(o[0],o[1],UP+.08)); outH.material.opacity=(dark?.7:.3)*u4;
        if(u4>.6) outLab.set('answer '+vecN(o,3),P2(o[0]+.2,o[1]+.35,UP+.45),{size:21,scale:.011,color:colors.ink,bg:true}); else outLab.hide();
        hudEl.innerHTML=ph<1?'① dot products: the shadow of q on each key':ph<2?'② softmax: gold pillars = shares <b>'+vecN(w,3)+'</b>':ph<3?'③ shrink each value by its share, lay them tip to tail':'④ answer <b>'+vecN(o,3)+'</b>';
        RR(ctx); };
      ctx.redraw();
    }}); }
  S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  const setQ=(a,l)=>{ st.ang=a; st.len=l; setCtl('qk-ang',a,v=>Math.round(v)+'°'); setCtl('qk-len',l,v=>N(v,2)); };
  bindCtl('qk-ang',v=>{ st.ang=v; st.phase=4; redraw(); },v=>Math.round(v)+'°');
  bindCtl('qk-len',v=>{ st.len=v; st.phase=4; redraw(); },v=>N(v,2));
  const PRE=[[0,2],[90,2],[45,Math.SQRT2]];
  tabs(document.getElementById('qk-row'),t=>{ const [a,l]=PRE[+t]; setQ(a,l); st.preset=+t; st.phase=4; redraw(); });
  let tw=null; document.getElementById('qk-play').addEventListener('click',()=>{ if(tw) tw.stop(); st.phase=0; redraw();
    const t0=performance.now(); tw={dead:false,stop(){ this.dead=true; }}; const me=tw;
    if(RM){ st.phase=4; redraw(); return; }
    (function fr(now){ if(me.dead) return; st.phase=Math.min(4,(now-t0)/1100); redraw(); if(st.phase<4) requestAnimationFrame(fr); })(t0); });
  readout();
  window.U18QKV={st,redraw,setQ};
})();
