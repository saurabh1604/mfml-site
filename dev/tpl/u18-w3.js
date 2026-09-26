/* ================= UNIT 18 · widgets for §6–§7: w-heads, w-subspace, w-shuffle, w-clocks, w-rope ================= */

/* ---------- §6 · w-heads: two heads on one sentence + the shapes of the split ---------- */
(function(){
  const svg=document.getElementById('hd-svg'), split=document.getElementById('hd-split'); if(!svg) return;
  const chips=document.getElementById('hd-toks'), read=document.getElementById('hd-read');
  const toks=LAB.tokens('the batsman hit the ball because it was loose'), R=LAB.run(toks), n=toks.length;
  const HS=[1,2,4,8,16,32];
  const st={sel:6,d:512,hi:3};
  function drawChips(){ chips.innerHTML=toks.map((t,i)=>`<button type="button" data-i="${i}" aria-pressed="${i===st.sel}">${t.w}</button>`).join('');
    chips.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ st.sel=+b.dataset.i; drawChips(); draw(); })); }
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 560':'0 0 760 300');
    const glow=glo(svg), F=fz(svg,12.5), Fs=fz(svg,10.5), c1=cv(K18.h1), c2=cv(K18.h2);
    const P=narrow?toks.map((_,i)=>[200,40+i*(480/(n-1))]):toks.map((_,i)=>[50+i*(660/(n-1)),150]);
    [0,1].forEach(h=>{ const A=R.A[h][st.sel], col=h?c2:c1;
      toks.forEach((_,j)=>{ const w=A[j]; if(w<.01) return; const [x1,y1]=P[st.sel],[x2,y2]=P[j];
        let d; if(narrow){ const s=h?1:-1, bend=j===st.sel?40:30+Math.abs(y2-y1)*.45; d=j===st.sel?`M${x1+s*34},${y1-6} C${x1+s*80},${y1-26} ${x1+s*80},${y1+26} ${x1+s*34},${y1+6}`:`M${x1+s*34},${y1} Q${x1+s*(34+bend)},${(y1+y2)/2} ${x2+s*34},${y2}`; }
        else { const s=h?1:-1, bend=j===st.sel?40:26+Math.abs(x2-x1)*.34; d=j===st.sel?`M${x1-8},${y1+s*16} C${x1-30},${y1+s*62} ${x1+30},${y1+s*62} ${x1+8},${y1+s*16}`:`M${x1},${y1+s*16} Q${(x1+x2)/2},${y1+s*(16+bend)} ${x2},${y2+s*16}`; }
        el('path',{d,fill:'none',stroke:col,'stroke-width':(1+7*w).toFixed(2),'stroke-linecap':'round',opacity:(.18+.82*w).toFixed(3),filter:glow&&w>.4?glow:'none'},svg);
        if(w>.08){ const [xx,yy]=narrow?[x2+(h?1:-1)*(34+Math.min(60,20+Math.abs(y2-P[st.sel][1])*.25)),y2+4]:[x2,y2+(h?1:-1)*(16+Math.min(120,26+Math.abs(x2-P[st.sel][0])*.34)*.5)+ (h?F:-4)];
          txt(svg,xx,yy,N(w,2),`font:800 ${Fs}px system-ui;fill:${col}`,'middle'); } }); });
    toks.forEach((t,i)=>{ const [x,y]=P[i], on=i===st.sel; txt(svg,x,y+F*.36,t.w,`font:${on?800:600} ${F}px system-ui;fill:${on?'var(--s2)':'var(--ink)'}`,'middle'); });
    if(narrow){ txt(svg,12,18,'◀ head 1 · meaning',`font:800 ${Fs}px system-ui;fill:${c1}`); txt(svg,388,18,'head 2 · word before ▶',`font:800 ${Fs}px system-ui;fill:${c2}`,'end'); }
    else { txt(svg,14,22,'head 1 · meaning (above)',`font:800 ${Fs}px system-ui;fill:${c1}`); txt(svg,14,290,'head 2 · the word before (below)',`font:800 ${Fs}px system-ui;fill:${c2}`); }
    svg.dataset.state=toks[st.sel].w+','+N(R.A[0][st.sel].indexOf(Math.max(...R.A[0][st.sel])),0)+','+N(R.A[1][st.sel].indexOf(Math.max(...R.A[1][st.sel])),0); }
  function drawSplit(){ split.innerHTML=''; const narrow=narrowOf(split); split.setAttribute('viewBox',narrow?'0 0 400 300':'0 0 760 170');
    const h=HS[st.hi], d=st.d, dk=d/h, F=fz(split,11), Fs=fz(split,10), glow=glo(split);
    const W=narrow?360:300, x0=narrow?20:20, y0=narrow?40:60, bh=26;
    txt(split,x0,y0-10,'one word: d = '+d,`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    const cols=['s5','s6','s7','s3','s2','s1'];
    for(let i=0;i<h;i++){ const x=x0+W*i/h; el('rect',{x:x+.5,y:y0,width:Math.max(.8,W/h-1),height:bh,rx:Math.min(4,W/h/3),fill:cv(cols[i%6]),opacity:.85},split); }
    if(h<=8) for(let i=0;i<h;i++) txt(split,x0+W*(i+.5)/h,y0+bh/2+F*.36,String(dk),`font:700 ${Math.min(F,W/h/2.6+4)}px system-ui;fill:#0b1020`,'middle');
    const x1=narrow?20:360, y1=narrow?130:60;
    edge(split,narrow?200:x0+W+8,narrow?y0+bh+6:y0+bh/2,narrow?200:x1-10,narrow?y1-14:y1+bh/2,'var(--ink-muted)',1.5,null);
    const bw=(narrow?360:220)/Math.min(h,16);
    for(let i=0;i<Math.min(h,16);i++){ el('rect',{x:x1+i*bw+1,y:y1,width:Math.max(1,bw-2),height:bh,rx:4,fill:'none',stroke:cv(cols[i%6]),'stroke-width':1.6,filter:glow||'none'},split); }
    txt(split,x1,y1-10,h+' head'+(h>1?'s':'')+(h>16?' (first 16 drawn)':'')+', each its own attention on '+dk+' numbers',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    const x2=narrow?20:620, y2=narrow?220:60;
    edge(split,narrow?200:x1+(narrow?360:220)+8,narrow?y1+bh+6:y1+bh/2,narrow?200:x2-10,narrow?y2-14:y2+bh/2,'var(--ink-muted)',1.5,null);
    el('rect',{x:x2,y:y2,width:narrow?360:120,height:bh,rx:5,fill:cv(K18.w),opacity:.9},split);
    txt(split,x2+(narrow?180:60),y2+bh/2+F*.36,'glue · × W_O',`font:800 ${F}px system-ui;fill:#1a1206`,'middle');
    txt(split,x2,y2-10,'back to length '+d,`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    if(!narrow) txt(split,20,150,'Every head: W_Q, W_K, W_V of size '+d+' × '+dk+'. Together with W_O: 4 × '+d+'² = '+grp(4*d*d)+' weights, whatever the number of heads.',`font:600 ${Fs}px system-ui;fill:var(--ink-2)`);
    read.innerHTML='d = <b>'+d+'</b>, h = <b>'+h+'</b> → each head works on <b>d<sub>k</sub> = '+d+' / '+h+' = '+dk+'</b> numbers<br>one head\'s W<sub>Q</sub>: '+d+' × '+dk+' = '+grp(d*dk)+' · all heads\' W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub>: 3 × '+h+' × '+grp(d*dk)+' = '+grp(3*d*d)+'<br>plus W<sub>O</sub> ('+d+' × '+d+'): total <b>'+grp(4*d*d)+'</b> = 4d²';
    split.dataset.state=[d,h,dk,4*d*d].join(','); }
  bindCtl('hd-d',v=>{ st.d=v; drawSplit(); },v=>String(v));
  bindCtl('hd-h',v=>{ st.hi=v; drawSplit(); },v=>String(HS[v]));
  drawChips(); relayout(svg,draw); relayout(split,drawSplit);
  window.U18Heads={st,draw,drawSplit,R};
})();

/* ---------- §6 · w-subspace: each head wears its own glasses (3-D) ---------- */
(function(){
  const box=document.getElementById('ss-3d'); if(!box||!CIN) return;
  const read=document.getElementById('ss-read'), qBar=document.getElementById('ss-q');
  const WDS=[['chai',[1,.8,0],1],['coffee',[.75,1.05,0],-1],['lassi',[1,-.8,0],1],['ice',[.1,-1.1,0],1],['sun',[-.3,1.1,.2],-1],['cricket',[-.3,.3,1],-1],['football',[.25,-.3,1],1],['bat',[-.5,0,.7],-1]];
  const HEADS=[{n:'drink',u:[1,0,0],c:'s5'},{n:'hot',u:[0,1,0],c:'s6'},{n:'sport',u:[0,0,1],c:'s7'}], SH=3;
  const st={head:0,q:1};
  const shares=()=>{ const u=HEADS[st.head].u, qx=dot(u,WDS[st.q][1])*SH; return softmax(WDS.map(([,x])=>qx*dot(u,x))); };
  qBar.innerHTML=WDS.map(([w],i)=>`<button role="tab" aria-selected="${i===st.q}" data-t="${i}">${w}</button>`).join('');
  function readout(){ const w=shares(), order=w.map((x,i)=>[x,i]).sort((a,b)=>b[0]-a[0]);
    read.innerHTML='“<b style="color:var(--s2)">'+WDS[st.q][0]+'</b>” asks the <b style="color:'+cv(HEADS[st.head].c)+'">'+HEADS[st.head].n+' head</b><br>its shadow on the rod: <b>'+N(dot(HEADS[st.head].u,WDS[st.q][1]),2)+'</b><br>'+order.slice(0,4).map(([x,i])=>WDS[i][0]+' <b style="color:var(--s4)">'+N(x,3)+'</b>').join(' · ');
    box.dataset.state=[WDS[st.q][0],HEADS[st.head].n,w.map(x=>x.toFixed(3)).join(' ')].join('|'); }
  let S3=null; const S=1.7, CY=1.55;
  const P3=x=>[x[0]*S,CY+x[1]*S,x[2]*S];
  function build(){ return CIN.stage3d(box,{camera:{pos:[5.8,4.6,8.4],look:[.2,1.45,0],fov:36},orbit:true,autoRotate:.12,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx), dark=!isLight;
      starfield(ctx,260,15); glassFloor(ctx,7,{div:28});
      const rods=HEADS.map(h=>{ const a=h.u.map(v=>-v*2.1), b=h.u.map(v=>v*2.1); const t=liveTube(ctx,hx(h.c),.025,.9); aimTube(THREE,t,[a[0]*S/1.7,CY+a[1]*S/1.7,a[2]*S/1.7],[b[0]*S/1.7,CY+b[1]*S/1.7,b[2]*S/1.7]); root.add(t);
        const l=lab(ctx,h.n+' head',[b[0]*S/1.7*1.05,CY+b[1]*S/1.7*1.05+.15,b[2]*S/1.7*1.05],{size:22,scale:.0105,color:colors[h.c],bg:!dark}); root.add(l); return {t,l}; });
      const beads=WDS.map(([w,x,side])=>{ const d=CIN.prim.dot(ctx,P3(x),hx(K18.tok),.1); root.add(d); root.add(lab(ctx,w,[P3(x)[0]+side*(.2+w.length*.045),P3(x)[1]+.18,P3(x)[2]],{size:22,scale:.0105,color:colors.ink,bg:!dark}));
        const drop=liveTube(ctx,hx('muted'),.006,.6); root.add(drop); const sh=CIN.prim.dot(ctx,[0,0,0],hx('ink2'),.055); root.add(sh); return {d,drop,sh}; });
      const beams=new THREE.Group(); root.add(beams);
      const hudEl=hud(box); hint(box,'drag to orbit');
      ctx.redraw=()=>{ const H=HEADS[st.head], w=shares(); clearGroup(beams);
        rods.forEach((r,k)=>{ const on=k===st.head; r.t.material.opacity=on?1:.22; r.t.scale.x=r.t.scale.z=on?1.6:1; r.l.material.opacity=on?1:.35; });
        WDS.forEach(([,x],i)=>{ const b=beads[i], p=P3(x), s=dot(H.u,x), foot=[H.u[0]*s*S,CY+H.u[1]*s*S,H.u[2]*s*S];
          aimTube(THREE,b.drop,p,foot); b.drop.visible=Math.hypot(p[0]-foot[0],p[1]-foot[1],p[2]-foot[2])>.03; b.sh.position.set(...foot); b.sh.material.color.setHex(hx(H.c)); b.sh.material.emissive.setHex(hx(H.c));
          const on=i===st.q; b.d.material.color.setHex(on?hx(K18.q):hx(K18.tok)); b.d.material.emissive.setHex(on?hx(K18.q):hx(K18.tok)); b.d.scale.setScalar(on?1.5:1);
          if(i!==st.q&&w[i]>.01){ const t=tube(ctx,P3(WDS[st.q][1]),p,hx(K18.w),.006+.035*Math.sqrt(w[i]),.25+.75*Math.sqrt(w[i])); t.material.depthWrite=false; beams.add(t); } });
        hudEl.innerHTML='“'+WDS[st.q][0]+'” through the <b>'+H.n+'</b> head · shares in gold';
        RR(ctx); };
      ctx.redraw();
    }}); }
  S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  tabs(document.getElementById('ss-head'),t=>{ st.head=+t; redraw(); });
  tabs(qBar,t=>{ st.q=+t; redraw(); });
  readout();
  window.U18Sub={st,redraw,shares};
})();

/* ---------- §7 · w-shuffle: attention cannot see order ---------- */
(function(){
  const svg=document.getElementById('sh-svg'); if(!svg) return;
  const read=document.getElementById('sh-read');
  const E={dog:[2,0],bites:[1,1],man:[0,2]}, TAG=[[1,0],[0,0],[0,1]];
  const st={order:['dog','bites','man'],pos:false,slide:null};
  const outs=()=>{ const X=st.order.map((w,p)=>E[w].map((v,c)=>v+(st.pos?TAG[p][c]:0))); return attend(X,X,X).O; };
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 330':'0 0 760 300');
    const glow=glo(svg), F=fz(svg,13), Fs=fz(svg,10.5), O=outs(), W=narrow?400:760, cw=narrow?118:190, gap=(W-3*cw)/4;
    const colOf={dog:cv('s5'),bites:cv('s7'),man:cv('s6')};
    st.order.forEach((w,p)=>{ let x=gap+p*(cw+gap); if(st.slide&&st.slide[w]!=null){ const [from,u]=st.slide[w]; x=gap+(from+(p-from)*u)*(cw+gap); }
      el('rect',{x,y:18,width:cw,height:44,rx:10,fill:'color-mix(in srgb,'+colOf[w]+' 18%,transparent)',stroke:colOf[w],'stroke-width':1.6},svg);
      txt(svg,x+cw/2,40+F*.36,w,`font:800 ${F}px system-ui;fill:var(--ink)`,'middle');
      if(st.pos) txt(svg,x+cw-8,56,'tag '+vecN(TAG[p],0),`font:700 ${Fs}px system-ui;fill:var(--s4)`,'end');
      const pn=panel(svg,x+10,80,cw-20,cw-20>150?150:cw-20,-.2,3.2,-.2,3.2,{xs:1,ys:1,xt:false,yt:false});
      const o=O[p]; el('line',{x1:pn.px(0),y1:pn.py(0),x2:pn.px(o[0]),y2:pn.py(o[1]),stroke:colOf[w],'stroke-width':3.2,'stroke-linecap':'round',filter:glow||'none'},svg);
      el('circle',{cx:pn.px(o[0]),cy:pn.py(o[1]),r:5,fill:colOf[w]},svg);
      txt(svg,x+cw/2,80+(cw-20>150?150:cw-20)+F*1.4,vecN(o,3),`font:700 ${Fs}px system-ui;fill:var(--ink-2)`,'middle'); });
    read.innerHTML='order: <b>'+st.order.join(' ')+'</b> · position tags <b>'+(st.pos?'on':'off')+'</b><br>'+st.order.map((w,p)=>w+' → <b>'+vecN(O[p],3)+'</b>').join(' · ')+(st.pos?'':'<br>each word keeps its own answer wherever it stands');
    svg.dataset.state=st.order.join(' ')+'|'+(st.pos?1:0)+'|'+O[st.order.indexOf('dog')].map(v=>v.toFixed(3)).join(','); }
  function perm(){ const o=st.order.slice(); let nw; do{ nw=o.slice().sort(()=>Math.random()-.5); }while(nw.join()===o.join()); return nw; }
  let tw=null;
  function setOrder(nw){ if(tw) tw.stop(); const from={}; st.order.forEach((w,p)=>{ from[w]=p; }); st.order=nw; st.slide={}; nw.forEach(w=>{ st.slide[w]=[from[w],0]; });
    tw=tween(650,u=>{ nw.forEach(w=>{ st.slide[w][1]=u; }); draw(); },()=>{ st.slide=null; draw(); }); }
  document.getElementById('sh-shuffle').addEventListener('click',()=>setOrder(perm()));
  document.getElementById('sh-reset').addEventListener('click',()=>setOrder(['dog','bites','man']));
  document.getElementById('sh-pos').addEventListener('click',e=>{ st.pos=!st.pos; e.currentTarget.setAttribute('aria-pressed',st.pos); draw(); });
  relayout(svg,draw);
  window.U18Shuffle={st,draw,outs,setOrder};
})();

/* ---------- §7 · w-clocks: position as a row of clocks ---------- */
(function(){
  const svg=document.getElementById('ck-svg'); if(!svg) return;
  const read=document.getElementById('ck-read');
  const OM=[1,.1,.01,.001], st={pos:1};
  const pe=p=>OM.flatMap(w=>[Math.sin(w*p),Math.cos(w*p)]);
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 560':'0 0 760 360');
    const glow=glo(svg), F=fz(svg,11.5), Fs=fz(svg,10), v=pe(st.pos), cols=['s2','s5','s6','s3'];
    OM.forEach((w,k)=>{ const cx=narrow?100+(k%2)*200:95+k*190, cy=narrow?95+Math.floor(k/2)*190:100, r=narrow?58:62, a=w*st.pos;
      el('circle',{cx,cy,r,fill:'color-mix(in srgb,var(--surface-2) 70%,transparent)',stroke:'var(--line)','stroke-width':1.5},svg);
      for(let t=0;t<12;t++){ const b=t/12*2*Math.PI; el('line',{x1:cx+Math.sin(b)*(r-6),y1:cy-Math.cos(b)*(r-6),x2:cx+Math.sin(b)*(r-1),y2:cy-Math.cos(b)*(r-1),stroke:'var(--ink-muted)','stroke-width':1.2},svg); }
      /* the hand: angle a, drawn from 12 o'clock clockwise so that sin is the x-reach and cos the y-reach */
      glowLine(svg,cx,cy,cx+Math.sin(a)*(r-10),cy-Math.cos(a)*(r-10),cv(cols[k]),4,!!glow);
      el('circle',{cx,cy,r:4.5,fill:cv(cols[k])},svg);
      txt(svg,cx,cy+r+F*1.3,'speed '+w,`font:700 ${F}px system-ui;fill:${cv(cols[k])}`,'middle');
      txt(svg,cx,cy+r+F*2.5,'sin '+N(v[2*k],4)+' · cos '+N(v[2*k+1],4),`font:600 ${Fs}px system-ui;fill:var(--ink-2)`,'middle'); });
    /* the strip: positions 0…63 across, 8 numbers down */
    const X0=narrow?60:60, Y0=narrow?420:228, WW=narrow?328:680, HH=narrow?112:112, cw=WW/64, ch=HH/8;
    for(let p=0;p<64;p++){ const e=pe(p); e.forEach((x,c)=>{ el('rect',{x:X0+p*cw,y:Y0+c*ch,width:cw+.3,height:ch+.3,fill:x>=0?cv(K18.w):cv(K18.k),opacity:(.08+.9*Math.abs(x)).toFixed(3)},svg); }); }
    el('rect',{x:X0+st.pos*cw-1,y:Y0-4,width:cw+2,height:HH+8,rx:2,fill:'none',stroke:'var(--ink)','stroke-width':1.8},svg);
    txt(svg,X0,Y0-10,'tags of positions 0 → 63 (gold = +, blue = −)',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    ['sin·1','cos·1','sin·0.1','cos·0.1','sin·0.01','cos·0.01','sin·0.001','cos·0.001'].forEach((t,c)=>{ if(!narrow||c%2===0) txt(svg,X0-4,Y0+c*ch+ch/2+Fs*.35,narrow?t.replace('sin·',''):t,`font:600 ${Math.min(Fs,ch*1.4)}px system-ui;fill:var(--ink-muted)`,'end'); });
    read.innerHTML='position <b>'+st.pos+'</b> → tag <b>('+v.map(x=>N(x,4)).join(', ')+')</b>';
    svg.dataset.state=st.pos+'|'+v.map(x=>x.toFixed(4)).join(','); }
  bindCtl('ck-pos',v=>{ st.pos=v; draw(); },v=>String(v));
  relayout(svg,draw);
  window.U18Clocks={st,draw,pe};
})();

/* ---------- §7 · w-rope: rotary positions on a glass clock (3-D) ---------- */
(function(){
  const box=document.getElementById('rp-3d'); if(!box||!CIN) return;
  const read=document.getElementById('rp-read');
  const st={m:3,n:1,th:30,many:false};
  const SPEEDS=[1,1/3,1/9];
  const score=(m,n)=>{ const ks=st.many?SPEEDS:[1]; return ks.map(s=>Math.cos((m-n)*st.th*s*Math.PI/180)); };
  function readout(){ const sc=score(st.m,st.n), tot=sc.reduce((a,b)=>a+b,0);
    read.innerHTML='query turned by m·θ = '+st.m+' × '+st.th+'° = <b style="color:var(--s2)">'+N(st.m*st.th,1)+'°</b><br>key turned by n·θ = '+st.n+' × '+st.th+'° = <b style="color:var(--s1)">'+N(st.n*st.th,1)+'°</b><br>gap m − n = <b>'+(st.m-st.n)+'</b> → angle between <b>'+N((st.m-st.n)*st.th,1)+'°</b><br>'+
      (st.many?'three clocks: '+sc.map(x=>N(x,3)).join(' + ')+' = <b style="color:var(--s4)">'+N(tot,3)+'</b>':'score q·k = cos '+N((st.m-st.n)*st.th,1)+'° = <b style="color:var(--s4)">'+N(tot,3)+'</b>');
    box.dataset.state=[st.m,st.n,st.th,st.many?1:0,tot.toFixed(4)].join(','); }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[0,4.3,4.4],look:[0,.05,.15],fov:38},orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx), dark=!isLight;
      starfield(ctx,260,15); glassFloor(ctx,8,{div:32});
      const dials=[0,1,2].map(k=>{ const g=new THREE.Group(); g.position.y=.02+k*1.25; root.add(g);
        const disc=new THREE.Mesh(new THREE.CircleGeometry(1.55,64),new THREE.MeshStandardMaterial({color:dark?0x9fb4ff:0xffffff,transparent:true,opacity:dark?.08:.35,roughness:.1,side:THREE.DoubleSide,depthWrite:false})); disc.rotation.x=-Math.PI/2; g.add(disc);
        const rim=new THREE.Mesh(new THREE.TorusGeometry(1.55,.012,8,96),new THREE.MeshBasicMaterial({color:hx('ink2'),transparent:true,opacity:.4})); rim.rotation.x=Math.PI/2; g.add(rim);
        for(let t=0;t<12;t++){ const b=t/12*2*Math.PI, tk=liveTube(ctx,hx('ink2'),.008,.6); aimTube(THREE,tk,[Math.cos(b)*1.42,0,-Math.sin(b)*1.42],[Math.cos(b)*1.55,0,-Math.sin(b)*1.55]); g.add(tk); }
        const qa=CIN.prim.arrow(ctx,[0,.03,0],[1.3,.03,0],hx(K18.q),{radius:.04,head:.22}), ka=CIN.prim.arrow(ctx,[0,.05,0],[1.3,.05,0],hx(K18.k),{radius:.04,head:.22}); g.add(qa,ka);
        const arc=new THREE.Group(); g.add(arc); const lbl=slot(ctx,g); return {g,qa,ka,arc,lbl}; });
      const hudEl=hud(box); hint(box,'drag to orbit');
      ctx.redraw=(mm,nn)=>{ const m=mm==null?st.m:mm, n=nn==null?st.n:nn, V=THREE.Vector3;
        dials.forEach((D,k)=>{ const on=k===0||st.many; D.g.visible=on; if(!on) return; const s=st.many?SPEEDS[k]:1, aq=m*st.th*s*Math.PI/180, ak=n*st.th*s*Math.PI/180, P=a=>new V(Math.cos(a)*1.3,.04,-Math.sin(a)*1.3);
          D.qa.userData.set(new V(0,.04,0),P(aq)); D.ka.userData.set(new V(0,.06,0),P(ak));
          clearGroup(D.arc); const a0=Math.min(aq,ak), a1=Math.max(aq,ak); if(a1-a0>1e-3){ const pts=[]; for(let t=0;t<=40;t++){ const a=a0+(a1-a0)*t/40; pts.push(new V(Math.cos(a)*.7,.05,-Math.sin(a)*.7)); }
            const tb=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.03,8,false),new THREE.MeshStandardMaterial({color:hx(K18.w),emissive:hx(K18.w),emissiveIntensity:dark?1:.3})); D.arc.add(tb); }
          const c=Math.cos((m-n)*st.th*s*Math.PI/180); D.lbl.set((st.many?'clock '+(k+1)+' · ':'')+'cos '+N(Math.abs((m-n)*st.th*s),1)+'° = '+N(c,3),[0,.55,1.75],{size:22,scale:.0105,color:colors.s4,bg:true}); });
        hudEl.innerHTML='query at <b>'+N(m,2)+'</b>, key at <b>'+N(n,2)+'</b> · gap <b>'+N(m-n,2)+'</b>';
        RR(ctx); };
      ctx.redraw();
    }}); }
  S3=mountStage(box,build);
  const redraw=(m,n)=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(m,n); };
  bindCtl('rp-m',v=>{ st.m=v; redraw(); },v=>String(v)); bindCtl('rp-n',v=>{ st.n=v; redraw(); },v=>String(v));
  bindCtl('rp-th',v=>{ st.th=v; redraw(); },v=>v+'°');
  document.getElementById('rp-many').addEventListener('click',e=>{ st.many=!st.many; e.currentTarget.setAttribute('aria-pressed',st.many); const h=S3&&S3.handle; if(h){ const o=h.ctx.orbit; h.ctx.look.set(0,st.many?1.3:.05,st.many?0:.15); o.sph.radius=st.many?8.4:6.15; o.place(); } redraw(); });
  let tw=null; document.getElementById('rp-both').addEventListener('click',()=>{ if(tw) tw.stop(); if(st.m>=11||st.n>=11){ const k=Math.min(st.m,st.n); st.m-=k; st.n-=k; }
    const m0=st.m,n0=st.n; tw=tween(1400,u=>{ redraw(m0+u,n0+u); },()=>{ st.m=m0+1; st.n=n0+1; setCtl('rp-m',st.m,v=>String(v)); setCtl('rp-n',st.n,v=>String(v)); redraw(); }); });
  readout();
  window.U18Rope={st,redraw,score};
})();
