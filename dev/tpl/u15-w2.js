/* ================= UNIT 15 · Act I widgets (continued): w-collapse, w-folds, w-paper ================= */

/* ---------- §3 · w-collapse: the space view — glass pages, one per layer ---------- */
(function(){
  const box=document.getElementById('co-3d'); if(!box||!CIN) return;
  const read=document.getElementById('co-read'), verdict=document.getElementById('co-verdict');
  const PRE={
    ex:{L1:{W:[[1,2],[0,1]],b:[1,0]}, L2:{W:[[1,-1],[2,1]],b:[0,1]}, box:[-.5,1.5], cut:false},
    xor:{L1:{W:[[1,1],[1,1]],b:[0,-1]}, L2:{W:[[1,-2],[0,1]],b:[-.5,0]}, box:[-.5,1.5], cut:true}};
  const st={pre:'ex',act:'none',anim:1};
  /* four noisy clusters at the corners of the unit square; XOR colouring: blue when exactly one coordinate is 1 */
  const DATA=(function(){ const r=seeded(15), P=[]; [[0,0,-1],[1,0,1],[0,1,1],[1,1,-1]].forEach(([cx,cy,y])=>{ const g=()=>Math.max(-2.2,Math.min(2.2,gauss2(r))); for(let i=0;i<10;i++) P.push({x:[cx+.1*g(),cy+.1*g()],y}); }); return P; })();
  const act=v=>v.map(ACTS[st.act].f);
  const lay=(L,x)=>matVec(L.W,x).map((v,j)=>v+L.b[j]);
  const mapAll=x=>{ const P=PRE[st.pre], h=act(lay(P.L1,x)), o=lay(P.L2,h); return [x,h,o]; };
  const mm=(A,B)=>A.map(r=>B[0].map((_,k)=>r.reduce((s,v,j)=>s+v*B[j][k],0)));
  function oneMatrix(){ const P=PRE[st.pre]; return {W:mm(P.L2.W,P.L1.W), b:lay(P.L2,P.L1.b)}; }
  function score(){ const P=PRE[st.pre]; if(!P.cut) return null; let ok=0; DATA.forEach(d=>{ const o=mapAll(d.x)[2]; if((o[0]>0?1:-1)===d.y) ok++; }); return ok; }
  function texts(){ const P=PRE[st.pre], M=oneMatrix(), f=v=>N(v,2);
    const matS=W=>'['+W.map(r=>r.map(f).join(', ')).join('; ')+']';
    let h='layer 1: W₁ = '+matS(P.L1.W)+', b₁ = '+vecN(P.L1.b)+'<br>bend: <b>'+(st.act==='none'?'none':st.act==='relu'?'ReLU':'tanh')+'</b><br>layer 2: W₂ = '+matS(P.L2.W)+', b₂ = '+vecN(P.L2.b);
    if(st.act==='none') h+='<br>one matrix: W₂W₁ = <b>'+matS(M.W)+'</b>, W₂b₁ + b₂ = <b>'+vecN(M.b)+'</b>';
    read.innerHTML=h;
    const sc=score();
    if(st.pre==='ex'){ if(st.act==='none'){ verdict.className='verdict good'; verdict.textContent='The last page and the ghost page match exactly: two straight layers = one.'; }
      else { verdict.className='verdict info'; verdict.textContent='The grid is '+(st.act==='relu'?'folded':'bent')+' — no single matrix can do that.'; } }
    else { const good=sc===DATA.length; verdict.className='verdict '+(good?'good':'bad');
      verdict.textContent='A straight cut on the last page gets '+sc+' of '+DATA.length+' points right'+(good?' — the fold untangled XOR.':st.act==='none'?' — without a bend, XOR stays tangled.':'.'); }
    box.dataset.state=[st.pre,st.act,sc==null?'':sc].join(','); }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[.6,2.2,9.4],look:[0,1.4,0],fov:36},orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,isLight,colors}=ctx, hx=hxOf(ctx);
      starfield(ctx,260,18);
      const scene=new THREE.Group(); root.add(scene);
      const PW=2.15, CY=1.4, RY=.32;
      const narrow=()=>ctx.size.w/ctx.size.h<1.35;
      const PXs=n=>narrow()?(n===4?[[-1.3,1.3],[1.3,1.3],[-1.3,-1.35],[1.3,-1.35]]:[[-1.3,1.3],[1.3,1.3],[0,-1.35]]):(n===4?[[-3.45,0],[-1.15,0],[1.15,0],[3.45,0]]:[[-2.45,0],[0,0],[2.45,0]]);
      const ry=()=>narrow()?0:RY;
      const toW=(k,n,u,v)=>{ const [px,py]=PXs(n)[k]; return [px+u*Math.cos(ry()),CY+py+v,-u*Math.sin(ry())]; };
      function draw(){ clearGroup(scene);
        const P=PRE[st.pre], [a0,a1]=P.box, NL=9, grid=[];
        for(let i=0;i<NL;i++){ const c=a0+(a1-a0)*i/(NL-1); const h=[],v=[]; for(let t=0;t<=48;t++){ const s=a0+(a1-a0)*t/48; h.push([s,c]); v.push([c,s]); } grid.push(h,v); }
        const pages=st.act==='none'?4:3, M=oneMatrix();
        const mapK=(x,k)=>k<3?mapAll(x)[k]:lay(M,x);
        for(let k=0;k<pages;k++){ const vis=Math.max(0,Math.min(1,st.anim*3-k+1)); if(vis<=0) continue;
          /* fit this page: equal scale on both axes, so angles are honest */
          let lo=[1e9,1e9], hi=[-1e9,-1e9]; const acc=p=>{ lo=[Math.min(lo[0],p[0]),Math.min(lo[1],p[1])]; hi=[Math.max(hi[0],p[0]),Math.max(hi[1],p[1])]; };
          grid.forEach(L=>L.forEach(x=>acc(mapK(x,k)))); DATA.forEach(d=>acc(mapK(d.x,k)));
          /* each axis is fitted to the page on its own: straight lines stay straight and parallel lines stay parallel under any such scaling */
          const sx=(PW-.35)/Math.max(hi[0]-lo[0],.5), sy=(PW-.35)/Math.max(hi[1]-lo[1],.5), s=sx, mid=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2];
          const W3=p=>toW(k,pages,(p[0]-mid[0])*sx,(p[1]-mid[1])*sy);
          const ghost=k===3;
          const pane=CIN.prim.glass(ctx,PW,PW,hx(ghost?'muted':K15.accent),(isLight?.07:.06)*vis); pane.position.set(PXs(pages)[k][0],CY+PXs(pages)[k][1],0); pane.rotation.y=ry(); scene.add(pane);
          const fr=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(PW,PW)),new THREE.LineBasicMaterial({color:hx(ghost?'muted':K15.accent),transparent:true,opacity:.55*vis})); fr.position.copy(pane.position); fr.rotation.y=ry(); scene.add(fr);
          /* the grid */
          const pos=[]; grid.forEach(L=>{ for(let t=0;t+1<L.length;t++){ pos.push(...W3(mapK(L[t],k)),...W3(mapK(L[t+1],k))); } });
          const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
          scene.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:hx(ghost?'muted':'ink2'),transparent:true,opacity:(isLight?.5:.42)*vis,depthWrite:false})));
          /* the data */
          const pp=[],cc=[]; DATA.forEach(d=>{ pp.push(...W3(mapK(d.x,k))); const c=new THREE.Color(hx(d.y>0?K15.fwd:K15.neg)); cc.push(c.r,c.g,c.b); });
          const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.Float32BufferAttribute(pp,3)); pg.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
          const pts=new THREE.Points(pg,new THREE.PointsMaterial({size:isLight?.2:.26,map:sparkTex(THREE),vertexColors:true,transparent:true,opacity:vis,depthWrite:false,blending:isLight?THREE.NormalBlending:THREE.AdditiveBlending})); pts.renderOrder=5; scene.add(pts);
          const cores=new THREE.Points(pg,new THREE.PointsMaterial({size:.07,vertexColors:true,transparent:true,opacity:vis})); scene.add(cores);
          /* the straight cut on the output page (score = 0) */
          if(P.cut&&k===2){ const u0=(0-mid[0])*s;
            if(Math.abs(u0)<PW/2){ const A=toW(k,pages,u0,-PW/2+.1), B=toW(k,pages,u0,PW/2-.1); scene.add(tube(ctx,A,B,hx(K15.awake),.022)); scene.add(lab(ctx,'straight cut',toW(k,pages,u0,-PW/2-.16),{size:22,color:colors.s4,bg:true})); } }
          const names=['input plane','after layer 1'+(st.act==='none'?'':' + '+(st.act==='relu'?'ReLU':'tanh')),'after layer 2','ghost: one matrix'];
          scene.add(lab(ctx,names[k],toW(k,pages,0,PW/2+.2),{size:22,scale:.0085,color:ghost?colors.muted:colors.s6,bg:true}));
        }
        /* threads: join each 3rd point across pages 0→1→2 using each page's fit (recomputed) */
        const fits=[]; for(let k=0;k<3;k++){ let lo=[1e9,1e9],hi=[-1e9,-1e9]; const acc=p=>{ lo=[Math.min(lo[0],p[0]),Math.min(lo[1],p[1])]; hi=[Math.max(hi[0],p[0]),Math.max(hi[1],p[1])]; };
          grid.forEach(L=>L.forEach(x=>acc(mapK(x,k)))); DATA.forEach(d=>acc(mapK(d.x,k))); const sx=(PW-.35)/Math.max(hi[0]-lo[0],.5), sy=(PW-.35)/Math.max(hi[1]-lo[1],.5), mid=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2];
          fits.push(p=>toW(k,pages,(p[0]-mid[0])*sx,(p[1]-mid[1])*sy)); }
        const tpos=[], tcol=[]; DATA.forEach((d,i)=>{ if(i%2) return; const c=new THREE.Color(hx(d.y>0?K15.fwd:K15.neg)); for(let k=0;k<2;k++){ if(st.anim*3-k-1<=0) continue; tpos.push(...fits[k](mapK(d.x,k)),...fits[k+1](mapK(d.x,k+1))); tcol.push(c.r,c.g,c.b,c.r,c.g,c.b); } });
        if(tpos.length){ const tg=new THREE.BufferGeometry(); tg.setAttribute('position',new THREE.Float32BufferAttribute(tpos,3)); tg.setAttribute('color',new THREE.Float32BufferAttribute(tcol,3));
          scene.add(new THREE.LineSegments(tg,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:isLight?.35:.3,depthWrite:false}))); }
        const nar=narrow(); if(ctx.orbit){ ctx.look.set(0,CY,0); ctx.orbit.sph.radius=nar?8.9:(pages===4?7.0:5.9); ctx.orbit.place(); }
        RR(ctx); }
      ctx.redraw=draw; draw();
      setTimeout(()=>{ if(!ctx.dead&&ctx.orbit) ctx.redraw(); },0);   /* the orbit exists only after build(): place the camera again */
      let lw=0; new ResizeObserver(()=>{ const w=ctx.size.w; if(Math.abs(w-lw)>40){ lw=w; if(!ctx.dead) draw(); } }).observe(box);
    }}); }
  S3=mountStage(box,build);
  const redraw=()=>{ texts(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  tabs(document.getElementById('co-act'),t=>{ st.act=t; redraw(); });
  const pre=document.getElementById('co-pre');
  const setPre=(k,btn)=>{ st.pre=k; pressOnly(pre,btn); pre.querySelector('#co-play').removeAttribute('aria-pressed'); redraw(); };
  document.getElementById('co-p-ex').addEventListener('click',e=>setPre('ex',e.currentTarget));
  document.getElementById('co-p-xor').addEventListener('click',e=>setPre('xor',e.currentTarget));
  let tw=null; document.getElementById('co-play').addEventListener('click',()=>{ if(tw) tw.stop(); st.anim=0; redraw(); let last=-1;
    tw=tween(3200,u=>{ const q=Math.round(u*30)/30; if(q!==last){ last=q; st.anim=q; if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); } },()=>{ st.anim=1; redraw(); }); });
  texts();
  window.U15Collapse={st,score,oneMatrix,redraw};
})();

/* ---------- §4 · w-folds: a one-hidden-layer ReLU fit, crease by crease ---------- */
(function(){
  const svg=document.getElementById('fo-svg'); if(!svg) return;
  const read=document.getElementById('fo-read'), A=-3.2, B=3.2, M=161;
  const XS=Array.from({length:M},(_,i)=>A+(B-A)*i/(M-1));
  const FN={sin:x=>Math.sin(x), step:x=>x<0?-.8:.8, abs:x=>Math.abs(x)/2-.8, bump:x=>1.6*Math.exp(-x*x*1.2)-.6};
  const st={f:'sin',n:3,hinges:true,drawn:XS.map(x=>Math.sin(x))};
  const target=()=>st.f==='draw'?st.drawn:XS.map(FN[st.f]);
  /* least squares: basis 1, ReLU(x − k_i) with k_i = A + (B − A)·i/N — the first crease sits at the left edge */
  function fit(Y,n){ const knots=Array.from({length:n},(_,i)=>A+(B-A)*i/n), P=n+1;
    const phi=x=>[1,...knots.map(k=>Math.max(0,x-k))];
    const G=Array.from({length:P},()=>new Array(P).fill(0)), r=new Array(P).fill(0);
    XS.forEach((x,t)=>{ const f=phi(x); for(let i=0;i<P;i++){ r[i]+=f[i]*Y[t]; for(let j=0;j<P;j++) G[i][j]+=f[i]*f[j]; } });
    for(let i=0;i<P;i++) G[i][i]+=1e-9;
    /* Gaussian elimination with partial pivoting */
    const Mx=G.map((row,i)=>[...row,r[i]]);
    for(let c=0;c<P;c++){ let p=c; for(let i=c+1;i<P;i++) if(Math.abs(Mx[i][c])>Math.abs(Mx[p][c])) p=i; [Mx[c],Mx[p]]=[Mx[p],Mx[c]];
      for(let i=c+1;i<P;i++){ const f=Mx[i][c]/Mx[c][c]; for(let j=c;j<=P;j++) Mx[i][j]-=f*Mx[c][j]; } }
    const w=new Array(P).fill(0); for(let i=P-1;i>=0;i--){ let s=Mx[i][P]; for(let j=i+1;j<P;j++) s-=Mx[i][j]*w[j]; w[i]=s/Mx[i][i]; }
    const yh=XS.map(x=>phi(x).reduce((s,v,i)=>s+v*w[i],0)); const rms=Math.sqrt(yh.reduce((s,v,t)=>s+(v-Y[t])**2,0)/M);
    return {knots,w,yh,rms,phi}; }
  let fr=null;
  function draw(){ const Y=target(), F=fit(Y,st.n);
    fr=frame(svg,A,B,-2,2,{xs:1,ys:1,l:34,r:14,t:16,b:26}); const glow=fr.glow, g=el('g',{'clip-path':fr.clip},svg);
    const pth=ys=>XS.map((x,t)=>(t?'L':'M')+fr.px(x).toFixed(1)+','+fr.py(Math.max(-2.4,Math.min(2.4,ys[t]))).toFixed(1)).join('');
    if(st.hinges) F.knots.forEach((k,i)=>{ const w=F.w[i+1]; const ys=XS.map(x=>F.w[0]/st.n+w*Math.max(0,x-k)); el('path',{d:pth(ys),stroke:cv(w>=0?K15.pos:K15.neg),'stroke-width':1.3,fill:'none',opacity:.45},g); });
    el('path',{d:pth(Y),stroke:'var(--ink-2)','stroke-width':2,'stroke-dasharray':'6 5',fill:'none',opacity:.9},g);
    glowPath(g,pth(F.yh),cv(K15.fwd),3,!!glow);
    F.knots.forEach(k=>{ const X=fr.px(k); el('line',{x1:X,y1:fr.py(-2),x2:X,y2:fr.py(-2)-9,stroke:cv(K15.awake),'stroke-width':2},svg); glowDot(svg,X,fr.py(-2)-9,2.6,cv(K15.awake),glow); });
    txt(svg,fr.W-fr.R-8,fr.T+16,'error (rms) '+N(F.rms,4),'font:700 12px system-ui;fill:'+cv(K15.awake),'end');
    txt(svg,fr.L+8,fr.T+16,st.n+' neuron'+(st.n>1?'s':'')+' · '+st.n+' crease'+(st.n>1?'s':''),'font:700 12px system-ui;fill:var(--ink-2)');
    read.innerHTML='N = <b>'+st.n+'</b> neurons → error <b>'+N(F.rms,4)+'</b>'+(st.f==='draw'?' · drag on the plot to draw':'')+'<br>dashed: the target · bold: the network · faint: each neuron\'s hinge';
    svg.dataset.rms=F.rms.toFixed(6); svg.dataset.n=st.n; svg.dataset.f=st.f;
    return F; }
  bindCtl('fo-n',v=>{ st.n=v; draw(); },v=>String(v));
  const pre=document.getElementById('fo-pre');
  pre.querySelectorAll('button[data-f]').forEach(b=>b.addEventListener('click',()=>{ st.f=b.dataset.f; pressOnly(pre,b); if(st.f==='draw') svg.style.cursor='crosshair'; else svg.style.cursor=''; draw(); }));
  document.getElementById('fo-hinges').addEventListener('click',e=>{ st.hinges=!st.hinges; e.currentTarget.setAttribute('aria-pressed',st.hinges); draw(); });
  let tw=null; document.getElementById('fo-play').addEventListener('click',()=>{ if(tw) tw.stop(); let last=0; tw=tween(6000,u=>{ const n=1+Math.round(u*23); if(n!==last){ last=n; st.n=n; setCtl('fo-n',n,v=>String(v)); draw(); } }); });
  svgDrag(svg,()=>{ if(st.f!=='draw') return false; },(X,Y)=>{ if(!fr) return; const x=fr.ix(X), y=Math.max(-2,Math.min(2,fr.iy(Y)));
    XS.forEach((xx,t)=>{ const w=Math.exp(-(((xx-x)/.18)**2)); st.drawn[t]=st.drawn[t]*(1-w)+y*w; }); draw(); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.U15Folds={st,fit:(n,f)=>fit(XS.map(FN[f||'sin']),n),draw};
})();

/* ---------- §4 · w-paper: fold the folded strip again (3-D ribbons) ---------- */
(function(){
  const box=document.getElementById('pa-3d'); if(!box||!CIN) return;
  const read=document.getElementById('pa-read');
  const st={k:3,morph:1};
  const tent=x=>2*Math.max(0,x)-4*Math.max(0,x-.5);
  const tk=(x,k)=>{ for(let i=0;i<k;i++) x=tent(x); return x; };
  function readout(){ const k=st.k; read.innerHTML='<b>'+k+'</b> layer'+(k>1?'s':'')+' of 2 ReLUs = <b>'+(2*k)+'</b> neurons<br>→ <b>'+(2**k)+'</b> straight pieces<br>one wide layer would need <b>'+(2**k-1)+'</b> neurons (one per corner)';
    box.dataset.k=k; box.dataset.pieces=2**k; }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[.9,3.2,8.6],look:[.4,1.9,-1.5],fov:38},orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,isLight,colors}=ctx, hx=hxOf(ctx);
      starfield(ctx,240,16); glassFloor(ctx,8,{div:32});
      const grp=new THREE.Group(); root.add(grp);
      const XW=4.4, H=.85, DZ=1.0, DY=1.08, BAND=.22;
      function ribbon(j,ys,u){ /* ys: function x→height on [0,1]; draw 2^j pieces, alternately coloured */
        const n=2**j, c1=new THREE.Color(hx(K15.accent)), c2=new THREE.Color(hx(K15.edge)), z=-j*DZ, y0f=j*DY;
        const pos=[], col=[];
        for(let p=0;p<n;p++){ const x0=p/n, x1=(p+1)/n, y0=ys(x0), y1=ys(x1), c=p%2?c2:c1;
          const X0=(x0-.5)*XW, X1=(x1-.5)*XW;
          const T0=y0f+y0*H, T1=y0f+y1*H, quad=[[X0,T0-BAND,z],[X1,T1-BAND,z],[X1,T1,z],[X0,T0-BAND,z],[X1,T1,z],[X0,T0,z]];
          quad.forEach(q=>{ pos.push(...q); col.push(c.r,c.g,c.b); }); }
        const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.computeVertexNormals();
        const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,emissive:hx(K15.accent),emissiveIntensity:isLight?.05:.25,roughness:.35,transparent:true,opacity:u*(isLight?.85:.8)}));
        grp.add(m);
        /* the top edge as a glowing tube and a bead at every corner */
        for(let p=0;p<n;p++){ const x0=p/n,x1=(p+1)/n; grp.add(tube(ctx,[(x0-.5)*XW,y0f+ys(x0)*H,z],[(x1-.5)*XW,y0f+ys(x1)*H,z],hx(p%2?K15.edge:K15.accent),.022,u)); }
        for(let p=1;p<n;p++){ const d=CIN.prim.dot(ctx,[(p/n-.5)*XW,y0f+ys(p/n)*H,z],hx(K15.awake),.055); d.material.transparent=true; d.material.opacity=u; grp.add(d); }
        grp.add(lab(ctx,(j===0?'input':'layer '+j)+' · '+n+' piece'+(n>1?'s':''),[XW/2+1.05,y0f+.45,z],{size:22,scale:.009,color:j===st.k?colors.s4:colors.ink2,bg:true}));
      }
      ctx.redraw=()=>{ clearGroup(grp); const kk=st.k; ctx.look.set(.4,(kk*DY+H)/2,-kk*DZ/2); if(ctx.orbit){ ctx.orbit.sph.radius=6.2+kk*1.25; ctx.orbit.place(); }
        for(let j=0;j<=st.k;j++){ if(j<st.k||st.morph>=1) ribbon(j,x=>tk(x,j),1);
          else { const u=st.morph; ribbon(j,x=>tk(x,j-1)*(1-u)+tk(x,j)*u,.35+.65*u); } }
        RR(ctx); };
      ctx.redraw();
      setTimeout(()=>{ if(!ctx.dead&&ctx.orbit) ctx.redraw(); },0);   /* the orbit exists only after build(): place the camera again */
    }}); }
  S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  bindCtl('pa-k',v=>{ st.k=v; st.morph=1; redraw(); },v=>String(v));
  let tw=null; document.getElementById('pa-play').addEventListener('click',()=>{ if(tw) tw.stop(); st.k=st.k>=5?1:st.k+1; setCtl('pa-k',st.k,v=>String(v)); st.morph=0; readout(); let last=-1;
    tw=tween(1600,u=>{ const q=Math.round(u*24)/24; if(q!==last){ last=q; st.morph=q; if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); } },()=>{ st.morph=1; redraw(); }); });
  readout();
  window.U15Paper={st,tk};
})();
