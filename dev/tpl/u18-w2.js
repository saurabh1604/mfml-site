/* ================= UNIT 18 · Act II widgets (1): w-relay, w-qkv (§3), w-scale (§4), w-context (§5) ================= */

/* ---------- §3 · w-relay: pass the message, or ask directly ---------- */
(function(){
  const svg=document.getElementById('rl-svg'); if(!svg) return;
  const read=document.getElementById('rl-read');
  const WORDS=['the','train','to','delhi','is','late','because','of','the','heavy','rain','today'];
  const st={mode:'relay',n:8,t:1};            /* t = progress of the story, 0…1 (1 = finished) */
  const BH=46;                                 /* bar height for a voice of 1 */
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
        el('path',{d,fill:'none',stroke:gold,'stroke-width':1.3,opacity:(.12+.6*lit).toFixed(3),filter:glow&&lit>.5?glow:'none','data-role':'pair'},g); }
    } else {
      /* the relay: one hop after another; the first word's voice halves each time */
      for(let i=0;i+1<n;i++){ const [x1,y1]=P[i],[x2,y2]=P[i+1]; el('line',{x1,y1,x2,y2,stroke:'var(--ink-muted)','stroke-width':1.4,'stroke-dasharray':'4 4',opacity:.55},g);
        if(L.row){ const done=st.t*(n-1)>=i+1-1e-9, mx=(x1+x2)/2; el('path',{d:`M${x1+8},${y1-40} Q${mx},${y1-96} ${x2-8},${y2-40}`,fill:'none',stroke:done?cv(K18.q):'var(--ink-muted)','stroke-width':done?2:1.2,opacity:done?.9:.4,'data-role':'hop'},g);
          txt(svg,mx,y1-78,'turn '+(i+1),`font:700 ${Fs}px system-ui;fill:${done?'var(--s2)':'var(--ink-muted)'}`,'middle'); } }
      const hop=st.t*(n-1), k=Math.floor(Math.min(n-1.0001,hop)), f=hop-k;
      const a=P[k], b=P[Math.min(n-1,k+1)], x=a[0]+(b[0]-a[0])*f, y=a[1]+(b[1]-a[1])*f, v=Math.pow(.5,hop);
      if(st.t<1){ el('circle',{cx:x,cy:y,r:(5+14*Math.sqrt(v)).toFixed(2),fill:cv(K18.q),opacity:(.25+.75*v).toFixed(3),filter:glow||'none'},g); }
      /* the voice that reached each word: bar height = BH × 0.5^i */
      P.forEach(([px,py],i)=>{ if(i>hop+1e-9) return; const vv=Math.pow(.5,i), bh=BH*vv;
        if(L.row){ el('rect',{x:px-7,y:py+30,width:14,height:Math.max(1.5,bh),rx:3,fill:cv(K18.q),opacity:.85,'data-role':'voice','data-i':i},g); txt(svg,px,py+30+Math.max(1.5,bh)+F*1.1,N(vv,vv<.01?4:3),`font:700 ${Fs}px system-ui;fill:var(--s2)`,'middle'); }
        else { /* phone: the same bar, pointing from the bead towards the middle of the circle (length = BH × 0.5^i) */
          const dx=200-px, dy=205-py, d=Math.hypot(dx,dy)||1, ux=dx/d, uy=dy/d, L0=17, len=Math.max(1.5,bh);
          el('line',{x1:px+ux*L0,y1:py+uy*L0,x2:px+ux*(L0+len),y2:py+uy*(L0+len),stroke:cv(K18.q),'stroke-width':9,'stroke-linecap':'butt',opacity:.85,'data-role':'voice','data-i':i,'data-h':len},g); } });
    }
    /* the words */
    P.forEach(([x,y],i)=>{ glowDot(svg,x,y,9,blue,glow); const w=WORDS[i];
      if(L.row) txt(svg,x,y-22,w,`font:600 ${F}px system-ui;fill:var(--ink)`,'middle');
      else { const cx=200,cy=205, dx=x-cx, dy=y-cy, d=Math.hypot(dx,dy)||1; txt(svg,x+dx/d*30,y+dy/d*26+F*.35,w,`font:600 ${F}px system-ui;fill:var(--ink)`,'middle'); } });
    if(!L.row&&st.mode==='relay'){ const hop=st.t*(n-1); txt(svg,200,210,'voice left: '+N(Math.pow(.5,hop),3),`font:700 ${F}px system-ui;fill:var(--s2)`,'middle'); }
    if(L.row) txt(svg,20,24,st.mode==='relay'?'hop after hop — the first word\'s voice fades':'every pair joined — one hop each',`font:700 ${F}px system-ui;fill:var(--ink-muted)`);
    const n2=n*n;
    read.innerHTML=st.mode==='relay'
      ?'Relay · hand-overs from the first word to the last: <b>'+(n-1)+'</b> · steps that must wait in a row: <b>'+n+'</b><br>the first word\'s voice at the end: 0.5<sup>'+(n-1)+'</sup> ≈ <b>'+N(Math.pow(.5,n-1),4)+'</b>'
      :'Attention · questions asked: '+n+' × '+n+' = <b>'+n2+'</b> · hops from the first word to the last: <b>1</b><br>steps that must wait in a row: <b>1</b> — all questions at the same time';
    svg.dataset.state=st.mode+','+n; }
  bindCtl('rl-n',v=>{ st.n=v; st.t=1; draw(); },v=>String(v));
  tabs(document.getElementById('rl-mode'),t=>{ st.mode=t; st.t=1; draw(); });
  let tw=null; document.getElementById('rl-play').addEventListener('click',()=>{ if(tw) tw.stop(); st.t=0; tw=tween(st.mode==='relay'?3200:1400,u=>{ st.t=u; draw(); },()=>{ st.t=1; draw(); }); });
  relayout(svg,()=>{ narrow=narrowOf(svg); draw(); });
  U18.relay={st,draw,BH,state(){ return {mode:st.mode,n:st.n,t:st.t,voice:Math.pow(.5,st.n-1),narrow,
    bars:[...svg.querySelectorAll('[data-role=voice]')].map(r=>({i:+r.dataset.i,h:+(r.getAttribute('height')||r.dataset.h)})),
    pairs:svg.querySelectorAll('[data-role=pair]').length,hops:svg.querySelectorAll('[data-role=hop]').length}; }};
})();

/* ---------- §3 · w-qkv: one lookup in space (3-D) ---------- */
(function(){
  const box=document.getElementById('qk-3d'); if(!box||!CIN) return;
  const read=document.getElementById('qk-read'), matBox=document.getElementById('qk-mat');
  const st={ang:0,len:2,phase:4,preset:0};      /* phase 0…4: how far the story has run (4 = everything shown) */
  const q=()=>[st.len*Math.cos(st.ang*Math.PI/180),st.len*Math.sin(st.ang*Math.PI/180)].map(v=>Math.abs(v)<1e-9?0:v);
  const calc=()=>attend([q()],EX.K,EX.V);
  const UP=2.7, PH=2.2;                           /* height of the value floor; pillar height per unit of share */
  let geo=null;                                   /* what the scene actually drew (for the tests) */
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
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx), dark=!isLight; declutterOn(ctx);
      starfield(ctx,240,15); glassFloor(ctx,6.4,{div:24});
      const up=CIN.prim.glass(ctx,5.2,5.2,hx('s3'),dark?.07:.12); up.rotation.x=-Math.PI/2; up.position.y=UP; root.add(up);
      const upGrid=CIN.prim.grid(ctx,5.2,20,hx('grid'),{opacity:dark?.22:.35}); upGrid.position.y=UP+.002; root.add(upGrid);
      const stem=liveTube(ctx,hx('ink2'),.006,.35); aimTube(THREE,stem,[0,0,0],[0,UP,0]); root.add(stem);
      const C={q:hx(K18.q),k:hx(K18.k),v:hx(K18.v),w:hx(K18.w),ink:hx('ink')};
      const P2=(x,y,h)=>[x,h||0,-y];
      EX.K.forEach(k=>{ const a=CIN.prim.arrow(ctx,P2(0,0,.02),P2(k[0],k[1],.02),C.k,{radius:.035,head:.2}); root.add(a); });
      /* key labels sit outside the pillars, and draw on top so a pillar never hides them */
      [[1.35,-.42],[-.55,.72],[1.62,.62]].forEach(([x,y],i)=>root.add(lab(ctx,'k'+SUB(i+1),P2(x,y,.12),{size:26,scale:.011,color:colors.s1,bg:true,depthTest:false})));
      EX.V.forEach((v,i)=>{ const a=CIN.prim.arrow(ctx,P2(0,0,UP+.02),P2(v[0],v[1],UP+.02),C.v,{radius:.03,head:.2}); a.traverse(m=>{ if(m.material){ m.material.transparent=true; m.material.opacity=.45; } }); root.add(a);
        root.add(lab(ctx,'v'+SUB(i+1),P2(v[0]+(v[0]?.28:-.3),v[1]+(v[1]?.28:-.3),UP+.05),{size:22,scale:.011,color:colors.s3,bg:!dark})); });
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
        const g2={pillars:[],chain:[],answer:null,q:qq.slice(),phase:ph};
        if(Math.hypot(...qq)>1e-6){ qArrow.visible=true; qArrow.userData.set(new V3(...P2(0,0,.03)),new V3(...P2(qq[0],qq[1],.03))); } else qArrow.visible=false;
        /* q's label: just past the tip, low, nudged toward the viewer, so it stays clear of the pillar labels */
        const qn=Math.hypot(...qq); if(qn>1e-6){ const ux=qq[0]/qn, uy=qq[1]/qn; qLab.set('q',P2(qq[0]+.42*ux+.2*uy,qq[1]+.42*uy-.2*ux,.12),{size:26,scale:.011,color:colors.s2,bg:true,depthTest:false}); } else qLab.hide();
        /* ① projections */
        const u1=clamp01(ph);
        EX.K.forEach((k,i)=>{ const L2=dot(k,k), t=dot(qq,k)/L2, f=[k[0]*t,k[1]*t];
          aimTube(THREE,proj[i].t,P2(qq[0],qq[1],.04),P2(f[0],f[1],.04)); proj[i].t.visible=u1>.02&&Math.hypot(qq[0]-f[0],qq[1]-f[1])>.02; proj[i].t.material.opacity=.55*u1;
          proj[i].d.position.set(...P2(f[0],f[1],.04)); proj[i].d.visible=u1>.02; });
        /* ② pillars: height = PH × share */
        const u2=easeIO(clamp01(ph-1));
        pil.forEach((m,i)=>{ const h=Math.max(.002,w[i]*PH*u2); m.scale.y=h; m.position.y=h/2; m.visible=u2>.01;
          g2.pillars.push({x:m.position.x,z:m.position.z,h:m.visible?h:0});
          if(u2>.5) pilLab[i].set(N(w[i],3),[m.position.x,h+.3,m.position.z],{size:24,scale:.011,color:colors.s4,bg:!dark}); else pilLab[i].hide(); });
        /* ③ chain of shrunken values */
        const u3=clamp01(ph-2); let acc=[0,0];
        chain.forEach((a,i)=>{ const part=easeIO(clamp01(u3*3-i)), v=EX.V[i], s=[v[0]*w[i]*part,v[1]*w[i]*part];
          const A=P2(acc[0],acc[1],UP+.05), B=P2(acc[0]+s[0],acc[1]+s[1],UP+.05);
          a.visible=part>.02&&Math.hypot(s[0],s[1])>.03; if(a.visible) a.userData.set(new V3(...A),new V3(...B)); acc=[acc[0]+s[0],acc[1]+s[1]]; g2.chain.push({from:[A[0],-A[2]],to:[B[0],-B[2]],on:a.visible}); });
        /* ④ the answer */
        const u4=easeIO(clamp01(ph-3)), o=r.O[0];
        out.visible=u4>.02&&Math.hypot(...o)>.03; if(out.visible) out.userData.set(new V3(...P2(0,0,UP+.08)),new V3(...P2(o[0]*u4,o[1]*u4,UP+.08)));
        g2.answer=out.visible?[o[0]*u4,o[1]*u4]:null;
        outH.position.set(...P2(o[0],o[1],UP+.08)); outH.material.opacity=(dark?.7:.3)*u4;
        if(u4>.6) outLab.set('answer '+vecN(o,3),P2(o[0]+.2,o[1]+.45,UP+.5),{size:21,scale:.011,color:colors.ink,bg:true}); else outLab.hide();
        hudEl.innerHTML=ph<1?'① dot products: the shadow of q on each key':ph<2?'② softmax: gold pillars = shares <b>'+vecN(w,3)+'</b>':ph<3?'③ shrink each value by its share, lay them tip to tail':'④ answer <b>'+vecN(o,3)+'</b>';
        geo=g2; RR(ctx); };
      ctx.redraw();
    }}); }
  S3=mountStage(box,build); watchLayout(box,S3);
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
  U18.qkv={st,redraw,setQ,PH,UP,state(){ const r=calc(); return {q:q(),scores:r.S[0],shares:r.A[0],answer:r.O[0],phase:st.phase,geo}; },
    labels(){ const c=S3&&S3.handle&&S3.handle.ctx; return stageRects(c); },turn(a){ turnView(S3&&S3.handle&&S3.handle.ctx,a); }};
})();

/* ---------- §4 · w-scale: the spread grows with d, √d calms it ---------- */
(function(){
  const svg=document.getElementById('sc-svg'); if(!svg) return;
  const read=document.getElementById('sc-read');
  const DS=[1,2,4,8,16,32,64,128,256,512];
  const st={di:6,scaled:false,seed:11};
  const cache={};
  function sample(d){ const key=d+'|'+st.seed; if(cache[key]) return cache[key]; const rnd=seeded(st.seed*7919+d), n=2000, out=new Float64Array(n);
    for(let s=0;s<n;s++){ let acc=0; for(let i=0;i<d;i++) acc+=gauss2(rnd)*gauss2(rnd); out[s]=acc; } return (cache[key]=out); }
  let narrow=false, last=null;
  function draw(){ svg.innerHTML=''; narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 700':'0 0 760 360');
    const glow=glo(svg), F=fz(svg,11.5), Fs=fz(svg,10);
    const d=DS[st.di], raw=sample(d), k=st.scaled?1/Math.sqrt(d):1, X=24;
    const vals=Array.from(raw,v=>v*k), mean=vals.reduce((a,b)=>a+b,0)/vals.length, sd=Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length);
    /* ---- the histogram ---- */
    const H=narrow?{x:40,y:40,w:340,h:230}:{x:44,y:40,w:370,h:250};
    const pn=panel(svg,H.x,H.y,H.w,H.h,-X,X,0,1,{xs:8,title:(st.scaled?'scores ÷ √d':'raw scores q·k')+' · 2 000 random pairs',xt:true});
    txt(svg,H.x+H.w,H.y-6,'d = '+d,`font:800 ${F}px system-ui;fill:var(--s4)`,'end');
    const B=48, bw=2*X/B, cnt=new Array(B).fill(0); let lo=0,hi=0;
    vals.forEach(v=>{ if(v<-X){ lo++; return; } if(v>=X){ hi++; return; } cnt[Math.floor((v+X)/bw)]++; });
    const mx=Math.max(...cnt,lo,hi,1);
    cnt.forEach((c,i)=>{ if(!c) return; const x0=pn.px(-X+i*bw), x1=pn.px(-X+(i+1)*bw), h=c/mx*(H.h-8); el('rect',{x:x0+.6,y:pn.py(0)-h,width:Math.max(.5,x1-x0-1.2),height:h,rx:1.5,fill:cv(K18.k),opacity:.85,'data-role':'bin','data-c':c},svg); });
    [[lo,-X],[hi,X]].forEach(([c,x])=>{ if(c){ const h=c/mx*(H.h-8); el('rect',{x:pn.px(x)-(x<0?0:5),y:pn.py(0)-h,width:5,height:h,fill:'var(--critical)',opacity:.85},svg); } });
    const sdLine=(v,col,lab)=>{ if(Math.abs(v)>X) return; [v,-v].forEach(u=>el('line',{x1:pn.px(u),y1:H.y,x2:pn.px(u),y2:H.y+H.h,stroke:col,'stroke-width':1.6,'stroke-dasharray':'5 4','data-role':'sd'},svg)); txt(svg,pn.px(v)+4,H.y+F+2,lab,`font:700 ${Fs}px system-ui;fill:${col}`+HALO); };
    sdLine(sd,cv(K18.w),'spread '+N(sd,2));
    if(lo+hi) txt(svg,H.x+H.w/2,H.y+H.h+F*2.6,(lo+hi)+' scores beyond ±'+X+' (red edges)',`font:600 ${Fs}px system-ui;fill:var(--critical)`,'middle');
    /* ---- one row of 8 scores and its softmax: bar height = share × (panel height − 40) ---- */
    const row=Array.from(raw.slice(0,8),v=>v*k), sh=softmax(row), top=Math.max(...sh), slope=top*(1-top);
    const R=narrow?{x:40,y:360,w:340,h:190}:{x:470,y:40,w:260,h:210}, BHmax=R.h-40;
    txt(svg,R.x,R.y-6,'one row of 8 scores → softmax shares',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    const bwid=R.w/8;
    const vlab=[];
    sh.forEach((p,i)=>{ const x=R.x+i*bwid+3, h=p*BHmax; el('rect',{x,y:R.y+R.h-26-h,width:bwid-6,height:Math.max(1.5,h),rx:3,fill:cv(K18.w),opacity:.92,filter:glow&&p>.5?glow:'none','data-role':'share','data-i':i,'data-h':h.toFixed(4)},svg);
      vlab.push(txt(svg,x+(bwid-6)/2,R.y+R.h-10,N(row[i],1),`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'middle'));
      if(p>.05) txt(svg,x+(bwid-6)/2,R.y+R.h-30-h,N(p,2),`font:700 ${Fs}px system-ui;fill:var(--s4)`,'middle'); });
    /* the eight scores under the bars: if two neighbours would touch, every second one drops a line */
    if(vlab.some((t,i)=>i&&hitBox(bboxOf(vlab[i-1]),bboxOf(t),2))) vlab.forEach((t,i)=>{ if(i%2) t.setAttribute('y',+t.getAttribute('y')+Fs*1.35); });
    el('line',{x1:R.x,y1:R.y+R.h-26,x2:R.x+R.w,y2:R.y+R.h-26,stroke:'var(--axis)','stroke-width':1.2},svg);
    /* ---- the blame meter: width = slope / 0.25 (0.25 is the biggest a slope p(1 − p) can be) ---- */
    const M=narrow?{x:40,y:610,w:340}:{x:470,y:300,w:260};
    txt(svg,M.x,M.y-8,'blame that gets through, p(1 − p)',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    el('rect',{x:M.x,y:M.y,width:M.w,height:14,rx:7,fill:'var(--grid)',opacity:.6},svg);
    /* three words for the slope: under 0.02 frozen, under 0.1 weak, else alive (the most a share's slope can be is 0.25) */
    const mood=slope<.02?['frozen','var(--critical)']:slope<.1?['weak','var(--s4)']:['alive','var(--s3)'];
    el('rect',{x:M.x,y:M.y,width:Math.max(3,M.w*slope/.25),height:14,rx:7,fill:slope<.02?'var(--critical)':slope<.1?cv(K18.w):cv(K18.v),filter:glow||'none','data-role':'meter'},svg);
    const sl4=v=>v<1e-4?'< 0.0001':N(v,4), tp3=v=>v>.9999?'> 0.9999':N(v,3);
    txt(svg,M.x+M.w,M.y+32,sl4(slope)+' — '+mood[0],`font:800 ${F}px system-ui;fill:${mood[1]}`,'end');
    read.innerHTML='d = <b>'+d+'</b> · √d = <b>'+N(Math.sqrt(d),2)+'</b> · measured spread of '+(st.scaled?'scaled':'raw')+' scores ≈ <b>'+N(sd,2)+'</b><br>top share of the sample row <b>'+tp3(top)+'</b> · its slope p(1 − p) '+(slope<1e-4?'':'= ')+'<b>'+sl4(slope)+'</b>'+(st.scaled?' · dividing by √d keeps the spread near 1':'');
    last={d,scaled:st.scaled,sd,top,slope,row,shares:sh,BHmax,meterW:M.w};
    svg.dataset.state=[d,st.scaled?1:0,sd.toFixed(3),top.toFixed(4)].join(','); }
  bindCtl('sc-d',v=>{ st.di=v; draw(); },v=>String(DS[v]));
  document.getElementById('sc-scaled').addEventListener('click',e=>{ st.scaled=!st.scaled; e.currentTarget.setAttribute('aria-pressed',st.scaled); draw(); });
  document.getElementById('sc-new').addEventListener('click',()=>{ st.seed++; draw(); });
  relayout(svg,draw);
  U18.scale={st,draw,sample,state(){ return Object.assign({},last,{bars:[...svg.querySelectorAll('[data-role=share]')].map(r=>+r.dataset.h),meter:+(svg.querySelector('[data-role=meter]')||{getAttribute:()=>0}).getAttribute('width')}); }};
})();

/* ---------- §5 · w-context: a chameleon word ---------- */
(function(){
  const svg=document.getElementById('cx-svg'); if(!svg) return;
  const read=document.getElementById('cx-read'), barA=document.getElementById('cx-a'), barB=document.getElementById('cx-b');
  const st={a:'river',b:'money'};
  [barA,barB].forEach((bar,k)=>{ bar.innerHTML=CTX.ORDER.map(w=>`<button role="tab" aria-selected="${w===(k?st.b:st.a)}" data-t="${w}">${w}</button>`).join(''); });
  const colA=()=>cv('s6'), colB=()=>cv('s5');
  let narrow=false, map=null;
  function draw(){ svg.innerHTML=''; narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 770':'0 0 760 380');
    const glow=glo(svg), F=fz(svg,12), Fs=fz(svg,10.5), Fb=fz(svg,15);
    const O=narrow?[46,340]:[60,340], S=narrow?100:100, px=x=>O[0]+x*S, py=y=>O[1]-y*S; map={px,py};
    const XM=narrow?3.3:3.3, YM=3.1, ticks=[];
    /* grid and axes */
    for(let v=0;v<=3;v++){ el('line',{x1:px(v),y1:py(0),x2:px(v),y2:py(YM),stroke:'var(--grid)','stroke-width':1},svg); el('line',{x1:px(0),y1:py(v),x2:px(XM),y2:py(v),stroke:'var(--grid)','stroke-width':1},svg);
      if(v){ ticks.push(bboxOf(txt(svg,px(v),py(0)+F*1.2,String(v),`font:500 ${Fs}px system-ui;fill:var(--ink-muted)`,'middle'))); ticks.push(bboxOf(txt(svg,px(0)-7,py(v)+Fs*.35,String(v),`font:500 ${Fs}px system-ui;fill:var(--ink-muted)`,'end'))); } }
    el('line',{x1:px(0),y1:py(0),x2:px(XM),y2:py(0),stroke:'var(--axis)','stroke-width':1.5},svg); el('line',{x1:px(0),y1:py(0),x2:px(0),y2:py(YM),stroke:'var(--axis)','stroke-width':1.5},svg);
    const obst=ticks.filter(Boolean), mapBox={x:2,y:2,w:(narrow?396:px(XM)+6),h:py(0)+F*1.5};
    obst.push(bboxOf(txt(svg,px(XM),py(0)-8,'nature →',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`+HALO,'end')));
    obst.push(bboxOf(txt(svg,px(0)+8,py(YM)+Fs,'↑ money',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`+HALO)));
    const P={px,py,svg,glow:null}, B=CTX.BANK, rA=CTX.run(st.a), rB=CTX.run(st.b), nA=CTX.NB[st.a], nB=CTX.NB[st.b];
    /* the road each sentence pulls bank along: from bank to its neighbour */
    [[nA,colA()],[nB,colB()]].forEach(([n,c])=>el('line',{x1:px(B[0]),y1:py(B[1]),x2:px(n[0]),y2:py(n[1]),stroke:c,'stroke-width':1.6,'stroke-dasharray':'3 5',opacity:.7},svg));
    /* the neighbours (thin), then bank as Unit 16 stored it (grey) */
    const same=st.a===st.b;
    [[nA,colA(),st.a],[nB,colB(),st.b]].forEach(([n,c,w],k)=>{ if(k&&same) return; arrow(P,0,0,n[0],n[1],same?'var(--ink-2)':c,1.8); obst.push(circBox(px(n[0]),py(n[1]),7)); });
    arrow(P,0,0,B[0],B[1],'var(--ink-muted)',3);
    /* bank's two new vectors (thick) */
    const oA=rA.out, oB=rB.out;
    const gA=arrow(Object.assign({},P,{glow}),0,0,oA[0],oA[1],colA(),4.2); gA.setAttribute('data-role','outA'); gA.dataset.x=oA[0]; gA.dataset.y=oA[1];
    const gB=arrow(Object.assign({},P,{glow}),0,0,oB[0],oB[1],colB(),4.2); gB.setAttribute('data-role','outB'); gB.dataset.x=oB[0]; gB.dataset.y=oB[1];
    [oA,oB].forEach(o=>obst.push(circBox(px(o[0]),py(o[1]),8)));
    /* the angle between the two new banks */
    const a1=Math.atan2(oA[1],oA[0]), a2=Math.atan2(oB[1],oB[0]), cs=CTX.cos(oA,oB), ang=Math.acos(Math.max(-1,Math.min(1,cs)))*180/Math.PI, rr=.62;
    if(ang>.5){ const pts=[]; for(let i=0;i<=24;i++){ const a=a1+(a2-a1)*i/24; pts.push(px(rr*Math.cos(a)).toFixed(1)+','+py(rr*Math.sin(a)).toFixed(1)); }
      el('polyline',{points:pts.join(' '),fill:'none',stroke:cv(K18.w),'stroke-width':2.6,'data-role':'arc'},svg);
      const am=(a1+a2)/2; placeLabel(svg,[[px(.95*Math.cos(am)),py(.95*Math.sin(am))+Fs*.35,'middle'],[px(1.15*Math.cos(am)),py(1.15*Math.sin(am))+Fs*.35,'middle']],N(ang,1)+'°',`font:800 ${F}px system-ui;fill:var(--s4)`+HALO,obst,1); }
    /* labels: neighbours, old bank, new banks — placed where they do not collide */
    const lab=(x,y,t,style,cands)=>placeLabel(svg,cands.map(([dx,dy,an])=>[px(x)+dx,py(y)+dy,an]),t,style,obst,1,mapBox);
    const around=[[10,-8,'start'],[10,F+4,'start'],[-10,-8,'end'],[-10,F+4,'end'],[0,-12,'middle'],[0,F+10,'middle']];
    lab(nA[0],nA[1],st.a,`font:700 ${F}px system-ui;fill:${same?'var(--ink-2)':'var(--s6)'}`+HALO,around);
    if(!same) lab(nB[0],nB[1],st.b,`font:700 ${F}px system-ui;fill:var(--s5)`+HALO,around);
    lab(oA[0],oA[1],'bank in A',`font:800 ${F}px system-ui;fill:var(--s6)`+HALO,around);
    lab(oB[0],oB[1],'bank in B',`font:800 ${F}px system-ui;fill:var(--s5)`+HALO,around);
    lab(B[0],B[1],'bank (Unit 16)',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`+HALO,[[10,F+4,'start'],[10,-8,'start'],[-10,F+4,'end'],[-10,-8,'end']]);
    /* the two sentences: shares and new vectors */
    const card=(x,y,w,tag,col,nb,r)=>{ txt(svg,x,y,tag+' · '+nb+' bank',`font:800 ${Fb}px system-ui;fill:${col}`);
      txt(svg,x,y+F*1.5,'bank asks with (1, 1): scores '+FX(r.s[0],3)+' and '+FX(r.s[1],3),`font:600 ${Fs}px system-ui;fill:var(--ink-2)`);
      [[nb,r.w[0]],['bank itself',r.w[1]]].forEach(([nm,v],i)=>{ const yy=y+F*2.4+i*(F*1.7), bx=x+(narrow?96:92), bwMax=w-(narrow?150:146);
        txt(svg,x,yy+F*.9,nm,`font:600 ${F}px system-ui;fill:var(--ink)`);
        el('rect',{x:bx,y:yy,width:bwMax,height:F*1.1,rx:4,fill:'var(--grid)',opacity:.5},svg);
        el('rect',{x:bx,y:yy,width:Math.max(1.5,bwMax*v),height:F*1.1,rx:4,fill:cv(K18.w),opacity:.92,'data-role':'share'+tag,'data-i':i},svg);
        txt(svg,bx+bwMax+6,yy+F*.9,FX(v,3),`font:700 ${F}px system-ui;fill:var(--s4)`); });
      txt(svg,x,y+F*6.7,'new bank = '+vecN(r.out,3),`font:800 ${F}px system-ui;fill:${col}`); };
    const CX=narrow?20:440, CW=narrow?360:300;
    card(CX,narrow?404:34,CW,'A',cv('s6'),st.a,rA); card(CX,narrow?544:162,CW,'B',cv('s5'),st.b,rB);
    const cy=narrow?700:306;
    txt(svg,CX,cy,'cos(bank in A, bank in B) = '+FX(cs,3),`font:800 ${Fb}px system-ui;fill:var(--s4)`);
    txt(svg,CX,cy+F*1.6,same?'same company → the same bank':ang<.5?'same direction: both pull bank the same way':(st.a==='the'||st.b==='the')?N(ang,1)+'° apart — “the” hardly moves bank':'an angle of '+N(ang,1)+'° — two meanings',`font:600 ${F}px system-ui;fill:var(--ink-2)`).setAttribute('data-role','verdict');
    read.innerHTML='A · “'+st.a+' bank”: shares ('+st.a+' '+FX(rA.w[0],3)+', bank '+FX(rA.w[1],3)+') → bank = <b style="color:var(--s6)">'+vecN(rA.out,3)+'</b><br>B · “'+st.b+' bank”: shares ('+st.b+' '+FX(rB.w[0],3)+', bank '+FX(rB.w[1],3)+') → bank = <b style="color:var(--s5)">'+vecN(rB.out,3)+'</b><br>cosine between the two banks <b>'+N(cs,3)+'</b> (Unit 16 would say 1)';
    svg.dataset.state=[st.a,st.b,rA.out.map(v=>v.toFixed(3)).join(' '),rB.out.map(v=>v.toFixed(3)).join(' '),cs.toFixed(3)].join('|'); }
  tabs(barA,t=>{ st.a=t; draw(); }); tabs(barB,t=>{ st.b=t; draw(); });
  relayout(svg,draw);
  U18.context={st,draw,set(a,b){ if(a){ st.a=a; selTab(barA,a); } if(b){ st.b=b; selTab(barB,b); } draw(); },
    state(){ const rA=CTX.run(st.a), rB=CTX.run(st.b), cs=CTX.cos(rA.out,rB.out); const tip=r=>{ const g=svg.querySelector('[data-role='+r+'] line'); return g?[+g.getAttribute('x1'),+g.getAttribute('y1'),+svg.querySelector('[data-role='+r+'] polygon').getAttribute('points').split(' ')[0].split(',')[0],+svg.querySelector('[data-role='+r+'] polygon').getAttribute('points').split(' ')[0].split(',')[1]]:null; };
      return {a:st.a,b:st.b,A:rA,B:rB,cos:cs,angle:Math.acos(Math.max(-1,Math.min(1,cs)))*180/Math.PI,tipA:tip('outA'),tipB:tip('outB'),px:map?[map.px(0),map.py(0),map.px(1)-map.px(0)]:null}; }};
})();
