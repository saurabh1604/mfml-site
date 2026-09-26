/* ================= UNIT 16 · widgets of §4–§6: w-cooc, w-svd-words, w-sgstep, w-w2v ================= */

/* ---------- §4 · w-cooc: the corpus builds the table; the angle between two rows ---------- */
(function(){
  const svg=document.getElementById('co-svg'); if(!svg) return;
  const sentBox=document.getElementById('co-sent'), mat=document.getElementById('co-mat'), pickHost=document.getElementById('co-pick'), read=document.getElementById('co-read');
  const st={win:2,pair:['chai','coffee']};
  function drawSent(){ sentBox.innerHTML=CO_SENT.map(s=>{ const w=s.split(' ');
      const inWin=new Set(); w.forEach((a,i)=>{ if(st.pair.includes(a)) for(let j=Math.max(0,i-st.win);j<=Math.min(w.length-1,i+st.win);j++) if(j!==i&&CO_CTX.includes(w[j])) inWin.add(j); });
      const hasPair=w.some(a=>st.pair.includes(a));
      return `<div class="${hasPair?'':'dim'}">`+w.map((a,i)=>CO_TARGETS.includes(a)?`<span class="t${st.pair.includes(a)?' sel':''}">${a}</span>`:CO_CTX.includes(a)?`<span class="c${inWin.has(i)?' in':''}">${a}</span>`:a).join(' ')+'</div>'; }).join(''); }
  function drawMat(M){ const base=coCounts(2), mx=Math.max(...M.flat(),1);
    mat.innerHTML='<table class="bgt"><thead><tr><th></th>'+CO_CTX.map(c=>`<th style="color:var(--s3)">${c}</th>`).join('')+'</tr></thead><tbody>'+
      M.map((r,i)=>`<tr class="${st.pair.includes(CO_TARGETS[i])?'on':''}"><th class="rh" style="color:var(--s1)">${CO_TARGETS[i]}</th>`+r.map((c,j)=>`<td class="cc${c?'':' z'}${c!==base[i][j]?' chg':''}" style="--h:${(c/mx).toFixed(3)}">${c}</td>`).join('')+'</tr>').join('')+'</tbody></table>';
    mat.dataset.m=JSON.stringify(M); }
  function drawAngle(M){ const narrow=vbFor(svg,'0 0 460 250','0 0 340 290'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg);
    const [a,b]=st.pair.map(w=>M[CO_TARGETS.indexOf(w)]), c=cosSim(a,b), th=Math.acos(Math.max(-1,Math.min(1,c))), na=norm(a), nb=norm(b);
    const ox=narrow?26:40, oy=narrow?150:210, R=narrow?270:170, mx=Math.max(na,nb,1e-9), la=R*na/mx, lb=R*nb/mx;
    const col=w=>w===st.pair[0]?cv(K16.word):cv('s5');
    /* arc */
    const ar=Math.min(la,lb)*.42; const [x1,y1]=[ox+ar,oy], [x2,y2]=[ox+ar*Math.cos(th),oy-ar*Math.sin(th)];
    el('path',{d:`M${ox},${oy} L${x1},${y1} A${ar},${ar} 0 0 0 ${x2},${y2} Z`,fill:cv(K16.gold),opacity:.18},svg);
    el('path',{d:`M${x1},${y1} A${ar},${ar} 0 0 0 ${x2},${y2}`,fill:'none',stroke:cv(K16.gold),'stroke-width':2},svg);
    const p={svg,glow,px:x=>x,py:y=>y};
    garrow(svg,ox,oy,ox+la,oy,col(st.pair[0]),3.2,!!glow); garrow(svg,ox,oy,ox+lb*Math.cos(th),oy-lb*Math.sin(th),col(st.pair[1]),3.2,!!glow);
    txt(svg,ox+la,oy+18*k,st.pair[0],FT(700,11,k,col(st.pair[0])),'end');
    txt(svg,ox+lb*Math.cos(th)+6,oy-lb*Math.sin(th)-6,st.pair[1],FT(700,11,k,col(st.pair[1])));
    const deg=th*180/Math.PI; txt(svg,ox+ar*1.1*Math.cos(th/2)+6,oy-ar*1.1*Math.sin(th/2)+4,N(deg,1)+'°',FT(700,10.5,k,cv(K16.gold)));
    /* the two rows as paired bars */
    const bx=narrow?40:268, by=narrow?192:40, bw=narrow?270:170, bh=narrow?66:120, mxc=Math.max(...a,...b,1);
    if(!narrow) txt(svg,bx,by-10,'their two rows',FT(700,10,k,'var(--ink-muted)'));
    CO_CTX.forEach((cx,j)=>{ const gx=bx+j*bw/4, w=bw/4*.34;
      [a,b].forEach((row,s)=>{ const h=bh*row[j]/mxc; el('rect',{x:gx+4+s*(w+2),y:by+bh-h,width:w,height:Math.max(.5,h),rx:3,fill:col(st.pair[s]),opacity:.85},svg); });
      txt(svg,gx+4+w,by+bh+13*k,cx,FT(600,9.5,k,'var(--s3)'),'middle'); });
    const dotv=dot(a,b);
    read.innerHTML=`${st.pair[0]} ${vecN(a)} · ${st.pair[1]} ${vecN(b)}<br>dot product <b>${N(dotv)}</b> · lengths √${N(dot(a,a))} and √${N(dot(b,b))}<br>cos θ = ${N(dotv)}/(√${N(dot(a,a))}·√${N(dot(b,b))}) = <b>${N(c,3)}</b> · θ ≈ <b>${N(deg,1)}°</b>`;
    svg.dataset.cos=c.toFixed(6); }
  function all(){ const M=coCounts(st.win); drawSent(); drawMat(M); drawAngle(M); pressPair(); }
  function pressPair(){ pickHost.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',st.pair.includes(b.dataset.w)?'true':'false')); }
  chipRow(pickHost,CO_TARGETS,'',w=>{ if(st.pair.includes(w)) return; st.pair=[st.pair[1],w]; all(); });
  bindCtl('co-win',v=>{ st.win=v; all(); },v=>String(v));
  all(); onTheme(all); onResizeW(svg.parentNode,all);
  window.U16Cooc={st,all,setPair(a,b){ st.pair=[a,b]; all(); }};
})();

/* ---------- §5 · w-svd-words: 16 words squeezed to k = 1, 2, 3 numbers (3-D) ---------- */
(function(){
  const box=document.getElementById('sv-3d'); if(!box||!CIN) return;
  const RAW=svdRows(SV_M), PP=svdRows(ppmi(SV_M));
  const st={k:3,mode:'raw',shown:null};
  const read=document.getElementById('sv-read'), bars=document.getElementById('sv-bars');
  const model=()=>st.mode==='raw'?RAW:PP;
  /* each word is drawn as its DIRECTION (length 2.2): the angle between two dots is exactly the angle the cosine measures */
  const target=()=>{ const m=model(); return SV_W.map((_,i)=>{ const c=m.coord(i), v=[0,1,2].map(d=>d<st.k?c[d]:0), n=norm(v)||1; return v.map(x=>x/n*2.2); }); };
  const P3w=c=>[c[0],c[2],c[1]];   /* direction 1 → x, direction 2 → depth (the floor), direction 3 → up */
  st.shown=target();
  function kcos(i,j){ const m=model(), a=m.coord(i).slice(0,st.k), b=m.coord(j).slice(0,st.k); return cosSim(a,b); }
  function readout(){ const m=model(), I=w=>SV_W.indexOf(w);
    read.innerHTML=`${st.mode==='raw'?'raw counts':'PPMI'} · keep <b>${st.k}</b> → energy kept <b>${N(100*m.energy[st.k-1],1)}%</b><br>cos(chai, coffee) = <b>${N(kcos(I('chai'),I('coffee')),3)}</b><br>cos(chai, cricket) = <b>${N(kcos(I('chai'),I('cricket')),3)}</b><br>cos(train, bus) = <b>${N(kcos(I('train'),I('bus')),3)}</b>`;
    box.dataset.state=[st.mode,st.k,m.energy[st.k-1].toFixed(4)].join(','); }
  function drawBars(){ const b=bars; b.innerHTML=''; const k=svgK(b,8), m=model(), S=m.S, mx=S[0], W=300, H=130, L=10, bw=(W-2*L)/S.length;
    S.forEach((s,i)=>{ const h=(H-40)*s/mx, x=L+i*bw+bw*.15, on=i<st.k; el('rect',{x,y:H-22-h,width:bw*.7,height:Math.max(1,h),rx:3,fill:on?cv(K16.gold):'var(--ink-muted)',opacity:on?.95:.35},b);
      if(i<4) txt(b,x+bw*.35,H-26-h,N(s,1),FT(700,8.5,k,on?'var(--ink)':'var(--ink-muted)'),'middle'); });
    txt(b,L,H-6,'singular values, biggest first',FT(600,9,k,'var(--ink-muted)')); }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:camFit(box,[4.2,3.4,5.6],[.4,.2,0],1.3),look:[.4,.2,0],fov:38},orbit:true,autoRotate:.08,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
      starfield(ctx,300,16);
      const sheet=CIN.prim.glass(ctx,5.6,5.6,hx('s7'),isLight?.07:.07); sheet.rotation.x=-Math.PI/2; root.add(sheet);
      const grid=CIN.prim.grid(ctx,5.6,14,hx('grid'),{opacity:isLight?.45:.28}); root.add(grid);
      const axes=[[1,0,0],[0,0,1],[0,1,0]].map((d,i)=>{ const t=tube(ctx,d.map(x=>-x*2.8),d.map(x=>x*2.8),hx(i===0?'s4':i===1?'s7':'s6'),.008,.55); root.add(t); return t; });
      const axl=[slot(ctx,root),slot(ctx,root),slot(ctx,root)];
      const G={tea:hx(K16.tea),sport:hx(K16.sport),travel:hx(K16.travel)};
      const pts=SV_W.map((w,i)=>{ const c=G[SV_G[i]]; const d=CIN.prim.dot(ctx,[0,0,0],c,.075), h=haloSprite(ctx,c,.5), stem=liveTube(ctx,c,.006,.45), ray=liveTube(ctx,c,.005,isLight?.35:.28); d.material.emissiveIntensity=isLight?.2:.55; root.add(d,h,stem,ray); return {d,h,stem,ray,c}; });
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2.2,.006,8,160),new THREE.MeshBasicMaterial({color:hx('ink2'),transparent:true,opacity:isLight?.35:.25})); ring.rotation.x=Math.PI/2; root.add(ring);
      const shell=new THREE.Mesh(new THREE.SphereGeometry(2.2,40,28),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x9fb6ff,transparent:true,opacity:isLight?.12:.045,depthWrite:false})); root.add(shell);
      const GROUPS=['tea','sport','travel'], glab=GROUPS.map(()=>slot(ctx,root));
      ctx.redraw=()=>{ const P=st.shown;
        sheet.visible=grid.visible=st.k>=2; axes[1].visible=st.k>=2; axes[2].visible=st.k>=3;
        ['direction 1','direction 2','direction 3'].forEach((t,i)=>{ const on=i<st.k; const pos=i===0?[-3.05,.1,0]:i===1?[0,.1,-3.05]:[0,-2.95,0]; axl[i].set(on?t:'',pos,{size:19,scale:.0085,color:colors.muted,bg:false}); });
        ring.visible=st.k>=2; shell.visible=st.k>=3;
        pts.forEach((o,i)=>{ const p=P3w(P[i]); o.d.position.set(...p); o.h.position.copy(o.d.position);
          aimTube(THREE,o.stem,[p[0],0,p[2]],p); o.stem.visible=Math.abs(p[1])>.03; aimTube(THREE,o.ray,[0,0,0],p); });
        GROUPS.forEach((g,gi)=>{ const idx=SV_W.map((_,i)=>i).filter(i=>SV_G[i]===g), m=[0,0,0]; idx.forEach(i=>{ const p=P3w(P[i]); m[0]+=p[0]; m[1]+=p[1]; m[2]+=p[2]; });
          const n=Math.hypot(...m)||1, off=st.k===1?[0,.32+.38*gi,0]:[0,.18,0], pos=m.map((x,d)=>x/n*2.62+off[d]);
          glab[gi].set(idx.map(i=>SV_W[i]).join(' · '),pos,{size:18,scale:.0078*LSc(box),color:colors[K16[g]],bg:true,weight:650}); });
        RR(ctx); };
      ctx.redraw(); if(matchMedia('(hover:hover) and (pointer:fine)').matches) hint(box,'drag to orbit');
    }}); }
  S3=mountStage(box,build);
  let tw=null;
  function go(dur){ const from=st.shown.map(p=>p.slice()), to=target(); if(tw) tw.stop();
    tw=tween(dur||900,u=>{ st.shown=from.map((p,i)=>p.map((x,d)=>x+(to[i][d]-x)*u)); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); },()=>{ st.shown=to; if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); });
    readout(); drawBars(); }
  bindCtl('sv-k',v=>{ st.k=v; go(); },v=>String(v));
  tabs(document.getElementById('sv-mode'),t=>{ st.mode=t; go(1200); });
  document.getElementById('sv-play').addEventListener('click',()=>{ let k=1; st.k=1; setCtl('sv-k',1,v=>String(v)); go(500);
    const step=()=>{ k++; if(k>3) return; st.k=k; setCtl('sv-k',k,v=>String(v)); go(1100); setTimeout(step,1500); }; setTimeout(step,1300); });
  readout(); drawBars(); onTheme(drawBars);
  window.U16Svd={st,RAW,PP,go,kcos};
})();

/* ---------- §6 · w-sgstep: one round of the game, as arrows ---------- */
(function(){
  const svg=document.getElementById('sg-svg'); if(!svg) return;
  const read=document.getElementById('sg-read');
  let S={v:SG0.v.slice(),up:SG0.up.slice(),un:SG0.un.slice()}, hist=[S], eta=1, busy=false, shown=S;
  function draw(){ const narrow=vbFor(svg,'0 0 560 300','0 0 340 330'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg);
    const X0=-2.1,X1=3.1,Y0=-.9,Y1=1.6, box0=narrow?{x:8,y:8,w:324,h:190}:{x:10,y:10,w:540,h:280};
    const sc=Math.min(box0.w/(X1-X0),box0.h/(Y1-Y0)), ox=box0.x+(box0.w-sc*(X1-X0))/2, oy=box0.y+(box0.h-sc*(Y1-Y0))/2;
    const px=x=>ox+(x-X0)*sc, py=y=>oy+(Y1-y)*sc;
    for(let x=Math.ceil(X0);x<=X1;x++) el('line',{x1:px(x),x2:px(x),y1:py(Y0),y2:py(Y1),stroke:'var(--grid)','stroke-width':1},svg);
    for(let y=Math.ceil(Y0);y<=Y1;y++) el('line',{x1:px(X0),x2:px(X1),y1:py(y),y2:py(y),stroke:'var(--grid)','stroke-width':1},svg);
    el('line',{x1:px(X0),x2:px(X1),y1:py(0),y2:py(0),stroke:'var(--axis)','stroke-width':1.4},svg); el('line',{x1:px(0),x2:px(0),y1:py(Y0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.4},svg);
    const hs=hist.slice(-12);
    [['v',K16.word],['up',K16.ctx],['un','critical']].forEach(([key,c])=>{ const pts=hs.map(s=>s[key]);
      if(pts.length>1) el('polyline',{points:pts.map(q=>px(q[0])+','+py(q[1])).join(' '),fill:'none',stroke:cv(c),'stroke-width':1.4,'stroke-dasharray':'3 4',opacity:.55},svg);
      pts.slice(0,-1).forEach(q=>el('circle',{cx:px(q[0]),cy:py(q[1]),r:2.4,fill:cv(c),opacity:.4},svg)); });
    const lab={v:'v chai',up:'u hot',un:'u football'};
    [['un','critical'],['up',K16.ctx],['v',K16.word]].forEach(([key,c])=>{ const q=shown[key]; garrow(svg,px(0),py(0),px(q[0]),py(q[1]),cv(c),3.2,!!glow);
      const d=Math.hypot(q[0],q[1])||1; txt(svg,px(q[0])+q[0]/d*12,py(q[1])-q[1]/d*12+4,lab[key],FT(700,11.5,k,cv(c)),q[0]>=0?'start':'end'); });
    /* loss mini-chart */
    const L=hist.map(sgLoss), cb=narrow?{x:40,y:228,w:270,h:62}:{x:px(1.95),y:py(1.5)+14,w:px(3.05)-px(1.95),h:py(.62)-py(1.5)-14};
    el('rect',{x:cb.x-10,y:cb.y-24,width:cb.w+20,height:cb.h+34,rx:10,fill:'var(--surface)',opacity:.78,stroke:'var(--line)'},svg);
    txt(svg,cb.x,cb.y-9,'loss per step',FT(700,9.5,k,'var(--ink-muted)'));
    const n=Math.max(8,L.length), lx=i=>cb.x+i*cb.w/(n-1), ly=v=>cb.y+cb.h-(Math.min(1,v))*cb.h;
    el('line',{x1:cb.x,x2:cb.x+cb.w,y1:ly(0),y2:ly(0),stroke:'var(--axis)','stroke-width':1},svg);
    glowPath(svg,L.map((v,i)=>(i?'L':'M')+lx(i).toFixed(1)+','+ly(v).toFixed(1)).join(''),cv(K16.loss),2,!!glow);
    L.forEach((v,i)=>el('circle',{cx:lx(i),cy:ly(v),r:2.6,fill:cv(K16.loss)},svg));
    txt(svg,cb.x+cb.w,cb.y-9,N(L[L.length-1],3),FT(800,11,k,cv(K16.loss)),'end');
    const s=shown, zp=dot(s.up,s.v), zn=dot(s.un,s.v);
    read.innerHTML=`step <b>${hist.length-1}</b> · η = ${N(eta,1)}<br>${tone(K16.ctx,'hot')}: u·v = <b>${N(zp,3)}</b>, "real" <b>${N(sigm(zp),3)}</b><br>${tone('critical','football')}: u·v = <b>${N(zn,3)}</b>, "random" <b>${N(sigm(-zn),3)}</b><br>loss <b>${N(sgLoss(s),3)}</b><br><span style="color:var(--ink-muted)">v = ${vecN(s.v,3)} · u<sub>hot</sub> = ${vecN(s.up,3)} · u<sub>football</sub> = ${vecN(s.un,3)}</span>`;
    svg.dataset.loss=sgLoss(hist[hist.length-1]).toFixed(6); svg.dataset.steps=hist.length-1; svg.dataset.v=hist[hist.length-1].v.map(x=>x.toFixed(4)).join(','); }
  function step(done){ if(busy) return; busy=true; const a=hist[hist.length-1], b=sgStep(a,eta); hist.push(b);
    const lerpS=u=>({v:a.v.map((x,i)=>x+(b.v[i]-x)*u),up:a.up.map((x,i)=>x+(b.up[i]-x)*u),un:a.un.map((x,i)=>x+(b.un[i]-x)*u)});
    tween(520,u=>{ shown=lerpS(u); draw(); },()=>{ shown=b; busy=false; draw(); done&&done(); }); }
  document.getElementById('sg-step').addEventListener('click',()=>step());
  document.getElementById('sg-run').addEventListener('click',()=>{ let n=0; const go=()=>{ if(n++<10) step(()=>setTimeout(go,60)); }; go(); });
  document.getElementById('sg-reset').addEventListener('click',()=>{ hist=[{v:SG0.v.slice(),up:SG0.up.slice(),un:SG0.un.slice()}]; shown=hist[0]; draw(); });
  bindCtl('sg-eta',v=>{ eta=v; draw(); },v=>N(v,1));
  draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  window.U16Sg={step,get hist(){ return hist; }};
})();

/* ---------- §6 · w-w2v: word2vec training live, words on a glass globe (3-D) ---------- */
(function(){
  const box=document.getElementById('wv-3d'); if(!box||!CIN) return;
  const TOP=Object.keys(W2V_TOPICS), VOC=[...TOP.flatMap(t=>W2V_TOPICS[t]),...W2V_SHARED], IDX={}; VOC.forEach((w,i)=>{ IDX[w]=i; });
  const GRP=VOC.map(w=>TOP.find(t=>W2V_TOPICS[t].includes(w))||'shared');
  const D=3, st={win:2,neg:5,run:false,seed:11,steps:0,loss:[],ema:null,pairs:0};
  const corpus=w2vCorpus(2016,420).map(s=>s.map(w=>IDX[w]));
  const counts=VOC.map(()=>0); corpus.forEach(s=>s.forEach(i=>counts[i]++));
  const table=[]; counts.forEach((c,i)=>{ const m=Math.round(Math.pow(c,.75)); for(let k=0;k<m;k++) table.push(i); });
  let V,U,R;
  function init(){ R=rng16(st.seed); V=VOC.map(()=>[0,0,0].map(()=>(R()-.5))); U=VOC.map(()=>[0,0,0]); st.steps=0; st.loss=[]; st.ema=null; st.pairs=0; }
  init();
  const lr=.06;
  function trainPairs(n){ let Lsum=0, cnt=0;
    for(let t=0;t<n;t++){ const s=corpus[Math.floor(R()*corpus.length)], i=Math.floor(R()*s.length), off=1+Math.floor(R()*st.win), j=i+(R()<.5?-off:off);
      if(j<0||j>=s.length) continue; const c=s[i], o=s[j], v=V[c], gv=[0,0,0];
      const upd=(w,label)=>{ const u=U[w], z=dot(u,v), sg=sigm(z), g=label?sg-1:sg; Lsum+=label?-Math.log(Math.max(1e-12,sg)):-Math.log(Math.max(1e-12,1-sg));
        for(let d=0;d<D;d++){ gv[d]+=g*u[d]; u[d]-=lr*g*v[d]; } };
      upd(o,1); for(let k=0;k<st.neg;k++){ const w=table[Math.floor(R()*table.length)]; if(w!==o) upd(w,0); }
      for(let d=0;d<D;d++) v[d]-=lr*gv[d]; cnt++; }
    st.pairs+=cnt; return cnt?Lsum/cnt:0; }
  function groupCos(){ let wi=0,nw=0,bt=0,nb=0; for(let i=0;i<VOC.length;i++) for(let j=i+1;j<VOC.length;j++){ if(GRP[i]==='shared'||GRP[j]==='shared') continue; const c=cosSim(V[i],V[j]); if(GRP[i]===GRP[j]){ wi+=c; nw++; } else { bt+=c; nb++; } } return {within:wi/nw,between:bt/nb}; }
  const read=document.getElementById('wv-read'), lsvg=document.getElementById('wv-loss');
  function readout(){ const g=groupCos(); read.innerHTML=`pairs played <b>${commas(st.pairs)}</b><br>loss <b>${st.ema==null?'—':N(st.ema,3)}</b><br>average cos, same topic <b>${N(g.within,3)}</b><br>average cos, different topics <b>${N(g.between,3)}</b>`;
    box.dataset.within=g.within.toFixed(4); box.dataset.between=g.between.toFixed(4); box.dataset.pairs=st.pairs; }
  function drawLoss(){ const b=lsvg; b.innerHTML=''; const k=svgK(b,8), W=300, H=140, L=30, T=12, B=22, glow=glo(b), Ls=st.loss;
    const mx=Math.max(4.5,...Ls), py=v=>T+(H-T-B)*(1-v/mx), px=i=>L+(W-L-8)*i/Math.max(1,Math.max(60,Ls.length)-1);
    [0,1,2,3,4].forEach(v=>{ if(v>mx) return; el('line',{x1:L,x2:W-8,y1:py(v),y2:py(v),stroke:'var(--grid)','stroke-width':1},b); txt(b,L-5,py(v)+3,String(v),FT(500,8.5,k,'var(--ink-muted)'),'end'); });
    if(Ls.length>1) glowPath(b,Ls.map((v,i)=>(i?'L':'M')+px(i).toFixed(1)+','+py(v).toFixed(1)).join(''),cv(K16.loss),2,!!glow);
    txt(b,L,H-5,'loss while training',FT(600,9,k,'var(--ink-muted)')); }
  let S3=null; const RG=1.75;
  function build(){ return CIN.stage3d(box,{camera:{pos:camFit(box,[3.6,2.6,5.2],[0,0,0],1.22),look:[0,0,0],fov:40},orbit:true,autoRotate:.14,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
      starfield(ctx,380,16);
      const globe=new THREE.Mesh(new THREE.SphereGeometry(RG,48,32),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x9fb6ff,transparent:true,opacity:isLight?.18:.06,roughness:.1,metalness:.2,depthWrite:false})); root.add(globe);
      const wire=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(RG,18,12)),new THREE.LineBasicMaterial({color:hx('grid'),transparent:true,opacity:isLight?.35:.22})); root.add(wire);
      const C={tea:hx(K16.tea),cricket:hx(K16.cricket),travel:hx(K16.travel),shared:hx('muted')};
      const pts=VOC.map((w,i)=>{ const c=C[GRP[i]]; const d=CIN.prim.dot(ctx,[0,0,0],c,GRP[i]==='shared'?.05:.07), h=haloSprite(ctx,c,GRP[i]==='shared'?.3:.5), sp=liveTube(ctx,c,.004,.3); root.add(d,h,sp); return {d,h,sp,lab:slot(ctx,root)}; });
      ctx.redraw=()=>{ pts.forEach((o,i)=>{ const v=V[i], n=norm(v)||1, p=[v[0]/n*RG,v[2]/n*RG,v[1]/n*RG]; o.d.position.set(...p); o.h.position.copy(o.d.position);
          aimTube(THREE,o.sp,[0,0,0],p); o.sp.material.opacity=isLight?.18:.12;
          o.lab.set(VOC[i],p.map(x=>x*1.12),{size:GRP[i]==='shared'?16:19,scale:.0082*LSc(box),color:GRP[i]==='shared'?colors.muted:colors.ink,bg:isLight}); }); RR(ctx); };
      ctx.redraw(); if(matchMedia('(hover:hover) and (pointer:fine)').matches) hint(box,'drag to orbit');
    },
    update(ctx){ if(!st.run) return false; tick(); ctx.redraw(); return true; } }); }
  function tick(){ const L=trainPairs(600); st.ema=st.ema==null?L:st.ema*.85+L*.15; st.steps++; if(st.steps%2===0){ st.loss.push(st.ema); if(st.loss.length>220) st.loss.shift(); drawLoss(); } if(st.steps%5===0) readout();
    if(st.pairs>=180000){ setRun(false); } }
  function setRun(on){ st.run=on; const b=document.getElementById('wv-play'); b.textContent=on?'❚❚ pause':(st.pairs>=180000?'▶ train again':'▶ train'); if(on&&S3&&S3.handle) S3.handle.requestRender(); readout(); drawLoss(); }
  S3=mountStage(box,build);
  document.getElementById('wv-play').addEventListener('click',()=>{ if(!st.run&&st.pairs>=180000){ init(); } setRun(!st.run); });
  document.getElementById('wv-seed').addEventListener('click',()=>{ st.seed=(st.seed*48271)%2147483647; init(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); readout(); drawLoss(); });
  bindCtl('wv-win',v=>{ st.win=v; },v=>String(v)); bindCtl('wv-neg',v=>{ st.neg=v; },v=>String(v));
  /* without WebGL (or off-screen) training still runs, so the numbers never depend on the picture */
  setInterval(()=>{ if(st.run&&!(S3&&S3.handle&&!S3.handle.ctx.dead&&S3.near)) tick(); },40);
  readout(); drawLoss(); onTheme(drawLoss);
  window.U16W2v={st,train(n){ for(let i=0;i<n;i++) tick(); readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); },groupCos,init,setRun};
})();
