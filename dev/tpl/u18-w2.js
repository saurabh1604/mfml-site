/* ================= UNIT 18 · Act II widgets: w-scale, w-attnmap (the attention lab) ================= */

/* ---------- §4 · w-scale: the spread grows with d, √d calms it ---------- */
(function(){
  const svg=document.getElementById('sc-svg'); if(!svg) return;
  const read=document.getElementById('sc-read');
  const DS=[1,2,4,8,16,32,64,128,256,512];
  const st={di:6,scaled:false,seed:11};
  const cache={};
  function sample(d){ const key=d+'|'+st.seed; if(cache[key]) return cache[key]; const rnd=seeded(st.seed*7919+d), n=2000, out=new Float64Array(n);
    for(let s=0;s<n;s++){ let acc=0; for(let i=0;i<d;i++) acc+=gauss2(rnd)*gauss2(rnd); out[s]=acc; } return (cache[key]=out); }
  let narrow=false;
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
    cnt.forEach((c,i)=>{ if(!c) return; const x0=pn.px(-X+i*bw), x1=pn.px(-X+(i+1)*bw), h=c/mx*(H.h-8); el('rect',{x:x0+.6,y:pn.py(0)-h,width:Math.max(.5,x1-x0-1.2),height:h,rx:1.5,fill:cv(K18.k),opacity:.85},svg); });
    [[lo,-X],[hi,X]].forEach(([c,x])=>{ if(c){ const h=c/mx*(H.h-8); el('rect',{x:pn.px(x)-(x<0?0:5),y:pn.py(0)-h,width:5,height:h,fill:'var(--critical)',opacity:.85},svg); } });
    const sdLine=(v,col,lab)=>{ if(Math.abs(v)>X) return; [v,-v].forEach(u=>el('line',{x1:pn.px(u),y1:H.y,x2:pn.px(u),y2:H.y+H.h,stroke:col,'stroke-width':1.6,'stroke-dasharray':'5 4'},svg)); txt(svg,pn.px(v)+4,H.y+F+2,lab,`font:700 ${Fs}px system-ui;fill:${col}`); };
    sdLine(sd,cv(K18.w),'spread '+N(sd,2));
    if(lo+hi) txt(svg,H.x+H.w/2,H.y+H.h+F*2.6,(lo+hi)+' scores beyond ±'+X+' (red edges)',`font:600 ${Fs}px system-ui;fill:var(--critical)`,'middle');
    /* ---- one row of 8 scores and its softmax ---- */
    const row=Array.from(raw.slice(0,8),v=>v*k), sh=softmax(row), top=Math.max(...sh), slope=top*(1-top);
    const R=narrow?{x:40,y:360,w:340,h:190}:{x:470,y:40,w:260,h:210};
    txt(svg,R.x,R.y-6,'one row of 8 scores → softmax shares',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    const bwid=R.w/8;
    sh.forEach((p,i)=>{ const x=R.x+i*bwid+3, h=p*(R.h-40); el('rect',{x,y:R.y+R.h-26-h,width:bwid-6,height:Math.max(1.5,h),rx:3,fill:cv(K18.w),opacity:.92,filter:glow&&p>.5?glow:'none'},svg);
      txt(svg,x+(bwid-6)/2,R.y+R.h-10,N(row[i],1),`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'middle');
      if(p>.05) txt(svg,x+(bwid-6)/2,R.y+R.h-30-h,N(p,2),`font:700 ${Fs}px system-ui;fill:var(--s4)`,'middle'); });
    el('line',{x1:R.x,y1:R.y+R.h-26,x2:R.x+R.w,y2:R.y+R.h-26,stroke:'var(--axis)','stroke-width':1.2},svg);
    /* ---- the blame meter ---- */
    const M=narrow?{x:40,y:610,w:340}:{x:470,y:300,w:260};
    txt(svg,M.x,M.y-8,'blame that gets through: slope of the top share, p(1 − p)',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    el('rect',{x:M.x,y:M.y,width:M.w,height:14,rx:7,fill:'var(--grid)',opacity:.6},svg);
    el('rect',{x:M.x,y:M.y,width:Math.max(3,M.w*slope/.25),height:14,rx:7,fill:slope<.02?'var(--critical)':cv(K18.v),filter:glow||'none'},svg);
    txt(svg,M.x+M.w,M.y+32,N(slope,4)+(slope<.02?' — frozen':' — alive'),`font:800 ${F}px system-ui;fill:${slope<.02?'var(--critical)':'var(--s3)'}`,'end');
    read.innerHTML='d = <b>'+d+'</b> · √d = <b>'+N(Math.sqrt(d),2)+'</b> · measured spread of '+(st.scaled?'scaled':'raw')+' scores ≈ <b>'+N(sd,2)+'</b><br>top share of the sample row <b>'+N(top,3)+'</b> · its slope p(1 − p) = <b>'+N(slope,4)+'</b>'+(st.scaled?' · dividing by √d keeps the spread near 1':'');
    svg.dataset.state=[d,st.scaled?1:0,sd.toFixed(3),top.toFixed(4)].join(','); }
  bindCtl('sc-d',v=>{ st.di=v; draw(); },v=>String(DS[v]));
  document.getElementById('sc-scaled').addEventListener('click',e=>{ st.scaled=!st.scaled; e.currentTarget.setAttribute('aria-pressed',st.scaled); draw(); });
  document.getElementById('sc-new').addEventListener('click',()=>{ st.seed++; draw(); });
  relayout(svg,draw);
  window.U18Scale={st,draw,sample};
})();

/* ---------- §5 · w-attnmap: THE ATTENTION LAB ---------- */
(function(){
  const box=document.getElementById('am-3d'); if(!box) return;
  const input=document.getElementById('am-text'), chips=document.getElementById('am-toks'), heat=document.getElementById('am-heat'), outSvg=document.getElementById('am-out'), read=document.getElementById('am-read');
  const PRE={'am-p1':'the batsman hit the ball because it was loose','am-p2':'my mother made chai and she poured it','am-p3':'the train to delhi was late because it broke'};
  const st={text:PRE['am-p1'],toks:[],R:null,sel:6,head:0,view:'beams',T:1,causal:false,flow:1};
  function compute(){ st.R=LAB.run(st.toks,{T:st.T,causal:st.causal}); }
  function load(text){ st.text=text; st.toks=LAB.tokens(text); if(!st.toks.length) st.toks=LAB.tokens('it');
    const it=st.toks.findIndex(t=>t.w==='it'||t.w==='she'||t.w==='he'); st.sel=it>=0?it:st.toks.length-1; compute(); }
  const W=()=>st.R.A[st.head];
  /* ---- token chips ---- */
  function drawChips(){ const A=W(); chips.innerHTML=st.toks.map((t,i)=>`<button type="button" data-i="${i}" aria-pressed="${i===st.sel}"${t.known?'':' class="unk" title="not in the lab’s word list — treated as a thing"'}>${t.w}<span class="wt">${N(A[st.sel][i],3)}</span></button>`).join('');
    chips.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ select(+b.dataset.i); })); }
  /* ---- the heat map ---- */
  function drawHeat(){ heat.innerHTML=''; const n=st.toks.length, A=W(), L=78, T0=70, S=Math.min(26,(330-L-8)/n), glow=glo(heat);
    heat.setAttribute("viewBox",`0 0 ${L+S*n+8} ${T0+S*n+8}`); const F=Math.max(12.2,fz(heat,10.5));
    st.toks.forEach((t,j)=>{ const x=L+j*S+S/2, tt=txt(heat,x,T0-6,t.w,`font:600 ${F}px system-ui;fill:var(--ink-2)`,'start'); tt.setAttribute('transform',`rotate(-55 ${x} ${T0-6})`); });
    st.toks.forEach((t,i)=>{ txt(heat,L-6,T0+i*S+S/2+F*.35,t.w,`font:${i===st.sel?800:600} ${F}px system-ui;fill:${i===st.sel?'var(--s2)':'var(--ink-2)'}`,'end');
      st.toks.forEach((_,j)=>{ const w=A[i][j], masked=st.causal&&j>i; const r=el('rect',{x:L+j*S+1,y:T0+i*S+1,width:S-2,height:S-2,rx:3,fill:masked?'var(--grid)':cv(K18.w),opacity:masked?.35:(.06+.94*Math.pow(w,.6)).toFixed(3),style:'cursor:pointer'},heat);
        r.addEventListener('click',()=>select(i)); }); });
    el('rect',{x:L,y:T0+st.sel*S,width:S*n,height:S,rx:4,fill:'none',stroke:cv(K18.q),'stroke-width':2,filter:glow||'none'},heat); }
  /* ---- the chosen word, before and after ---- */
  function drawOut(){ outSvg.innerHTML=''; const nar=narrowOf(outSvg); outSvg.setAttribute('viewBox',nar?'0 0 420 236':'0 0 420 200'); const F=fz(outSvg,10.5), t=st.toks[st.sel], x=st.R.X[st.sel], y=st.R.Y[st.sel], L=10, bw=(420-2*L)/8;
    txt(outSvg,L,16,'“'+t.w+'” before attention (grey) and after (green)',`font:700 ${F}px system-ui;fill:var(--ink-muted)`);
    const base=150, sc=78;
    LAB.FS.forEach((f,c)=>{ const X0=L+c*bw+6, w=(bw-14)/2, b=Math.max(0,x[c]), a=Math.max(0,y[c]);
      el('rect',{x:X0,y:base-b*sc,width:w,height:Math.max(1.5,b*sc),rx:2,fill:'var(--ink-muted)',opacity:.7},outSvg);
      el('rect',{x:X0+w+2,y:base-Math.min(1.3,a)*sc,width:w,height:Math.max(1.5,Math.min(1.3,a)*sc),rx:2,fill:cv(K18.v),opacity:.92},outSvg);
      if(a-b>.05) txt(outSvg,X0+w+2+w/2,base-Math.min(1.3,a)*sc-4,'+'+N(a-b,2),`font:700 ${F}px system-ui;fill:var(--s3)`,'middle');
      const lt=txt(outSvg,X0+w,base+14,f,`font:600 ${F}px system-ui;fill:var(--ink-2)`,nar?'end':'middle'); if(nar) lt.setAttribute('transform',`rotate(-40 ${X0+w} ${base+14})`); });
    el('line',{x1:L,y1:base,x2:420-L,y2:base,stroke:'var(--axis)','stroke-width':1},outSvg); }
  function readout(){ const A=W(), t=st.toks[st.sel], row=A[st.sel].map((w,j)=>[w,j]).sort((a,b)=>b[0]-a[0]);
    const unk=st.toks.filter(x=>!x.known).map(x=>'“'+x.w+'”');
    read.innerHTML='“<b style="color:var(--s2)">'+t.w+'</b>” asks (head '+(st.head+1)+(st.head?' · the word before':' · meaning')+', temperature '+N(st.T,2)+(st.causal?', no peeking':'')+'):<br>'+
      row.slice(0,3).map(([w,j])=>'“'+st.toks[j].w+'” <b style="color:var(--s4)">'+N(w,3)+'</b>').join(' · ')+'<br>'+
      'its <i>thing</i> feature: '+N(st.R.X[st.sel][0],2)+' → <b style="color:var(--s3)">'+N(st.R.Y[st.sel][0],3)+'</b> · <i>someone</i>: '+N(st.R.X[st.sel][1],2)+' → <b style="color:var(--s3)">'+N(st.R.Y[st.sel][1],3)+'</b>'+
      (unk.length?'<br><span style="color:var(--ink-muted)">'+unk.join(', ')+' '+(unk.length>1?'are':'is')+' not in the lab’s word list — treated as a thing.</span>':'');
    box.dataset.state=[st.toks.map(x=>x.w).join(' '),st.sel,st.head,N(st.T,2),st.causal?1:0].join('|'); }
  /* ---- the 3-D stage ---- */
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[0,5.4,9.4],look:[0,.55,-1.3],fov:38},orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,colors,isLight,camera}=ctx, hx=hxOf(ctx), dark=!isLight;
      
      starfield(ctx,300,18); glassFloor(ctx,16,{div:64});
      const C={tok:hx(K18.tok),q:hx(K18.q),w:hx(K18.w),v:hx(K18.v),grey:hx('muted')};
      const dyn=new THREE.Group(); root.add(dyn); const beamG=new THREE.Group(); root.add(beamG);
      const hudEl=hud(box); hint(box,'drag to orbit · click a word');
      let beads=[], pillars=[], labs=[], pulses=[], SP=1, X0=0, Y=.55, Z=1.4, GZ0=-.3, GSP=.55;
      const px=i=>X0+i*SP;
      ctx.rebuild=()=>{ clearGroup(dyn); const n=st.toks.length; SP=Math.min(.95,8.6/Math.max(1,n-1)); X0=-(n-1)/2*SP; GSP=Math.min(.55,5/n);
        beads=st.toks.map((t,i)=>{ const g=new THREE.Group(); g.position.set(px(i),Y,Z); dyn.add(g);
          const shell=new THREE.Mesh(new THREE.SphereGeometry(.24,28,20),new THREE.MeshStandardMaterial({color:dark?0xdfe8ff:0xffffff,transparent:true,opacity:dark?.16:.38,roughness:.08,metalness:.2,depthWrite:false}));
          const core=new THREE.Mesh(new THREE.SphereGeometry(.15,24,16),new THREE.MeshStandardMaterial({color:C.tok,emissive:C.tok,emissiveIntensity:dark?.7:.3,roughness:.3}));
          const halo=haloSprite(ctx,C.tok,.9); g.add(shell,core,halo); core.userData.i=i; shell.userData.i=i;
          const w=lab(ctx,t.w,[px(i),Y-.5,Z+.05],{size:t.w.length>7?21:24,scale:.0095,color:t.known?colors.ink:colors.muted,bg:!dark}); dyn.add(w);
          const wt=slot(ctx,dyn); return {g,core,halo,shell,wt}; });
        pillars=[]; const pg=new THREE.BoxGeometry(1,1,1);
        for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const m=new THREE.Mesh(pg,new THREE.MeshStandardMaterial({color:C.w,emissive:C.w,emissiveIntensity:.2,roughness:.35,transparent:true,opacity:.9}));
          m.scale.set(SP*.34,1e-3,GSP*.62); m.position.set(px(j),0,GZ0-i*GSP); dyn.add(m); pillars.push({m,i,j}); }
        ctx.redraw(); };
      ctx.redraw=()=>{ const n=st.toks.length, A=W(), sel=st.sel, land=st.view==='land', V=THREE.Vector3;
        clearGroup(beamG); pulses=[];
        beads.forEach((b,i)=>{ const on=i===sel, col=on?C.q:C.tok; b.core.material.color.setHex(col); b.core.material.emissive.setHex(col); b.core.material.emissiveIntensity=(dark?.7:.3)*(on?1.6:1);
          b.halo.material.color.setHex(col); b.halo.material.opacity=(dark?.45:.18)*(on?1.4:.8); b.g.scale.setScalar(on?1.18:1);
          if(!land){ const w=A[sel][i]; b.wt.set(N(w,3),[px(i),Y+.5+(w>.3?.1:0),Z],{size:w>.3?24:19,scale:.0095,color:w>.3?colors.s4:colors.ink2,bg:!dark}); } else b.wt.hide(); });
        if(!land){ st.toks.forEach((_,j)=>{ const w=A[sel][j]; if(w<.004) return; const a=new V(px(sel),Y+.18,Z), b=new V(px(j),Y+.18,Z);
            const curve=j===sel?new THREE.CatmullRomCurve3([a,new V(px(sel)-.3,Y+.9,Z),new V(px(sel)+.3,Y+.9,Z),b.clone().add(new V(.02,0,0))]):new THREE.QuadraticBezierCurve3(a,new V((a.x+b.x)/2,Y+.45+.2*Math.abs(sel-j)*SP,Z-.05),b);
            const m=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.01+.055*Math.sqrt(w),10,false),new THREE.MeshStandardMaterial({color:C.w,emissive:C.w,emissiveIntensity:dark?.35+1.5*w:.2+.4*w,roughness:.3,transparent:true,opacity:.3+.7*Math.sqrt(w),depthWrite:false}));
            beamG.add(m); const p=haloSprite(ctx,C.v,.2+.8*Math.sqrt(w)); p.material.opacity=0; beamG.add(p); pulses.push({p,curve,w}); }); }
        pillars.forEach(({m,i,j})=>{ const masked=st.causal&&j>i, w=A[i][j], h=land?Math.max(.012,w*2.4):.012; m.scale.y=h; m.position.y=h/2; m.visible=land;
          const hot=i===sel; m.material.opacity=masked?.15:(land?(hot?.95:.7):.5); m.material.emissiveIntensity=(dark?.1+1.1*w:.05+.25*w)*(hot?1.5:1);
          m.material.color.setHex(masked?C.grey:(hot?C.w:C.w)); if(!hot&&land) m.material.color.lerp(new THREE.Color(dark?0x2a3558:0xdcd6c4),.35); });
        labs.forEach(s=>dyn.remove(s)); labs=[];
        if(land){ const s=lab(ctx,'row “'+st.toks[sel].w+'”',[-X0+.75*SP+.35,.25,GZ0-sel*GSP],{size:20,scale:.0095,color:colors.s2,bg:!dark}); dyn.add(s); labs.push(s); }
        if(ctx.orbit&&ctx._view!==st.view){ const first=ctx._view==null; ctx._view=st.view; const L0=ctx.look.clone(), L1=land?new V(0,.5,-1.5):new V(0,.5,1.3), ph0=ctx.orbit.sph.phi, ph1=land?.95:1.2, r0=ctx.orbit.sph.radius, r1=(land?11.2:9.2)*(box.clientWidth<560?1.7:1);
          const go=u=>{ ctx.look.lerpVectors(L0,L1,u); ctx.orbit.sph.phi=ph0+(ph1-ph0)*u; ctx.orbit.sph.radius=r0+(r1-r0)*u; ctx.orbit.place(); };
          if(first) go(1); else tween(900,go); }
        hudEl.innerHTML=land?'The whole map · row “'+st.toks[sel].w+'” lit · pillar height = share':'“'+st.toks[sel].w+'” asks every word · gold = its shares';
        RR(ctx); };
      ctx.flow=u=>{ pulses.forEach(({p,curve,w})=>{ if(u<=0||u>=1){ p.material.opacity=0; return; } p.position.copy(curve.getPoint(1-u)); p.material.opacity=(dark?.95:.7)*Math.sin(Math.PI*u)**.4; });
        const b=beads[st.sel]; if(b){ const g=Math.sin(Math.PI*clamp01(u*1.2-.2)); b.core.material.emissive.setHex(g>.2?C.v:C.q); b.halo.material.color.setHex(g>.2?C.v:C.q); } RR(ctx); };
      /* click a bead to choose the asking word */
      const ray=new THREE.Raycaster(), v2=new THREE.Vector2(); let down=null;
      ctx.renderer.domElement.addEventListener('pointerdown',e=>{ down=[e.clientX,e.clientY]; });
      ctx.renderer.domElement.addEventListener('pointerup',e=>{ if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5) return; const r=ctx.renderer.domElement.getBoundingClientRect();
        v2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(v2,camera); const hit=ray.intersectObjects(beads.map(b=>b.shell),false)[0]; if(hit) select(hit.object.userData.i); });
      ctx.rebuild(); setTimeout(()=>{ if(!ctx.dead) ctx.redraw(); },0);
    }}); }
  S3=mountStage(box,build);
  const ctx3=()=>S3&&S3.handle&&S3.handle.ctx;
  function redrawAll(rebuild){ compute(); drawChips(); drawHeat(); drawOut(); readout(); const c=ctx3(); if(c){ if(rebuild&&c.rebuild) c.rebuild(); else if(c.redraw) c.redraw(); } }
  function select(i){ st.sel=Math.max(0,Math.min(st.toks.length-1,i)); redrawAll(false); }
  let tw=null;
  function play(){ if(tw) tw.stop(); const c=ctx3(); if(!c||!c.flow) return; if(st.view!=='beams'){ st.view='beams'; document.querySelector('#am-view [data-t="beams"]').click(); }
    tw=tween(1800,u=>{ const k=ctx3(); if(k&&k.flow) k.flow(u); },()=>{ const k=ctx3(); if(k&&k.flow) k.flow(1); }); }
  document.getElementById('am-go').addEventListener('click',()=>{ const t=input.value.trim(); if(t&&t!==st.text){ load(t); redrawAll(true); pressOnly(document.getElementById('am-pre'),null); } play(); });
  input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); document.getElementById('am-go').click(); } });
  Object.keys(PRE).forEach(id=>document.getElementById(id).addEventListener('click',e=>{ input.value=PRE[id]; load(PRE[id]); pressOnly(document.getElementById('am-pre'),e.currentTarget); redrawAll(true); }));
  tabs(document.getElementById('am-head'),t=>{ st.head=+t; redrawAll(false); });
  tabs(document.getElementById('am-view'),t=>{ st.view=t; const c=ctx3(); if(c&&c.redraw) c.redraw(); });
  bindCtl('am-temp',v=>{ st.T=v; redrawAll(false); },v=>N(v,2));
  document.getElementById('am-causal').addEventListener('click',e=>{ st.causal=!st.causal; e.currentTarget.setAttribute('aria-pressed',st.causal); redrawAll(false); });
  load(st.text);
  redrawAll(false);
  new MutationObserver(()=>{ drawHeat(); drawOut(); }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  let rsT=null, lastW=0; const rs=()=>{ clearTimeout(rsT); rsT=setTimeout(()=>{ const w=outSvg.getBoundingClientRect().width+heat.getBoundingClientRect().width*1000; if(Math.abs(w-lastW)<2) return; lastW=w; drawHeat(); drawOut(); },80); }; addEventListener('resize',rs); if('ResizeObserver' in window){ const ro=new ResizeObserver(rs); ro.observe(outSvg.parentNode); ro.observe(heat); }
  window.U18Lab={st,select,load:(t)=>{ input.value=t; load(t); redrawAll(true); },redrawAll};
})();
