/* ================= UNIT 18 · Act II widgets (2): w-attnmap (§6), w-heads, w-subspace (§7) ================= */

/* ---------- §6 · w-attnmap: THE ATTENTION LAB ---------- */
(function(){
  const box=document.getElementById('am-3d'); if(!box) return;
  const input=document.getElementById('am-text'), chips=document.getElementById('am-toks'), heat=document.getElementById('am-heat'), outSvg=document.getElementById('am-out'), read=document.getElementById('am-read');
  const PRE={'am-p1':'the batsman hit the ball because it was loose','am-p2':'my mother made chai and she poured it','am-p3':'the train to delhi was late because it broke'};
  const st={text:PRE['am-p1'],toks:[],R:null,sel:6,head:0,view:'beams',T:1,causal:false,flow:1};
  function compute(){ st.R=LAB.run(st.toks,{T:st.T,causal:st.causal}); }
  function load(text){ st.text=text; st.toks=LAB.tokens(text); if(!st.toks.length) st.toks=LAB.tokens('it');
    const it=st.toks.findIndex(t=>t.w==='it'||t.w==='she'||t.w==='he'); st.sel=it>=0?it:st.toks.length-1; compute(); }
  const W=()=>st.R.A[st.head];
  /* a share this close to 1 is printed with 4 decimals, so "0.9999" never reads as an exact 1 */
  const SH=w=>w>.999&&w<1?F(w,4):N(w,3);
  /* ---- token chips ---- */
  function drawChips(){ const A=W(); chips.innerHTML=st.toks.map((t,i)=>`<button type="button" data-i="${i}" aria-pressed="${i===st.sel}"${t.known?'':' class="unk" title="not in the lab’s word list — treated as a thing"'}>${t.w}<span class="wt">${SH(A[st.sel][i])}</span></button>`).join('');
    chips.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ select(+b.dataset.i); })); }
  /* ---- the heat map: cell opacity = 0.06 + 0.94·share^0.6 ---- */
  const cellOp=w=>.06+.94*Math.pow(w,.6);
  function drawHeat(){ heat.innerHTML=''; const n=st.toks.length, A=W(), L=78, T0=70, S=Math.min(26,(330-L-8)/n), glow=glo(heat);
    heat.setAttribute("viewBox",`0 0 ${L+S*n+34} ${T0+S*n+8}`);   /* room on the right for the last slanted name */ const F=Math.max(12.2,fz(heat,10.5));
    st.toks.forEach((t,j)=>{ const x=L+j*S+S/2, tt=txt(heat,x,T0-6,t.w,`font:600 ${F}px system-ui;fill:var(--ink-2)`,'start'); tt.setAttribute('transform',`rotate(-55 ${x} ${T0-6})`); });
    st.toks.forEach((t,i)=>{ txt(heat,L-6,T0+i*S+S/2+F*.35,t.w,`font:${i===st.sel?800:600} ${F}px system-ui;fill:${i===st.sel?'var(--s2)':'var(--ink-2)'}`,'end');
      st.toks.forEach((_,j)=>{ const w=A[i][j], masked=st.causal&&j>i; const r=el('rect',{x:L+j*S+1,y:T0+i*S+1,width:S-2,height:S-2,rx:3,fill:masked?'var(--grid)':cv(K18.w),opacity:masked?.35:cellOp(w).toFixed(3),style:'cursor:pointer','data-role':'cell','data-r':i,'data-c':j},heat);
        r.addEventListener('click',()=>select(i)); }); });
    el('rect',{x:L,y:T0+st.sel*S,width:S*n,height:S,rx:4,fill:'none',stroke:cv(K18.q),'stroke-width':2,filter:glow||'none'},heat); }
  /* ---- the chosen word, before and after ---- */
  function drawOut(){ outSvg.innerHTML=''; const nar=narrowOf(outSvg); outSvg.setAttribute('viewBox',nar?'0 0 420 236':'0 0 420 200'); const F=fz(outSvg,10.5), t=st.toks[st.sel], x=st.R.X[st.sel], y=st.R.Y[st.sel], L=nar?24:10, bw=(420-2*L)/8;
    txt(outSvg,L,16,'“'+t.w+'” before attention (grey) and after (green)',`font:700 ${F}px system-ui;fill:var(--ink-muted)`);
    const base=150, sc=78;
    LAB.FS.forEach((f,c)=>{ const X0=L+c*bw+6, w=(bw-14)/2, b=Math.max(0,x[c]), a=Math.max(0,y[c]);
      el('rect',{x:X0,y:base-b*sc,width:w,height:Math.max(1.5,b*sc),rx:2,fill:'var(--ink-muted)',opacity:.7,'data-role':'before','data-c':c},outSvg);
      el('rect',{x:X0+w+2,y:base-Math.min(1.3,a)*sc,width:w,height:Math.max(1.5,Math.min(1.3,a)*sc),rx:2,fill:cv(K18.v),opacity:.92,'data-role':'after','data-c':c},outSvg);
      if(a-b>.05) txt(outSvg,X0+w+2+w/2,base-Math.min(1.3,a)*sc-4,'+'+N(a-b,2),`font:700 ${F}px system-ui;fill:var(--s3)`,'middle');
      const lt=txt(outSvg,X0+w,base+14,f,`font:600 ${F}px system-ui;fill:var(--ink-2)`,nar?'end':'middle'); if(nar) lt.setAttribute('transform',`rotate(-40 ${X0+w} ${base+14})`); });
    el('line',{x1:L,y1:base,x2:420-L,y2:base,stroke:'var(--axis)','stroke-width':1},outSvg); }
  function readout(){ const A=W(), t=st.toks[st.sel], row=A[st.sel].map((w,j)=>[w,j]).sort((a,b)=>b[0]-a[0]);
    const unk=st.toks.filter(x=>!x.known).map(x=>'“'+x.w+'”');
    read.innerHTML='“<b style="color:var(--s2)">'+t.w+'</b>” asks (head '+(st.head+1)+(st.head?' · the word before':' · meaning')+', temperature '+N(st.T,2)+(st.causal?', no peeking':'')+'):<br>'+
      row.slice(0,3).map(([w,j])=>'“'+st.toks[j].w+'” <b style="color:var(--s4)">'+SH(w)+'</b>').join(' · ')+'<br>'+
      'its <i>thing</i> feature: '+N(st.R.X[st.sel][0],2)+' → <b style="color:var(--s3)">'+N(st.R.Y[st.sel][0],3)+'</b> · <i>someone</i>: '+N(st.R.X[st.sel][1],2)+' → <b style="color:var(--s3)">'+N(st.R.Y[st.sel][1],3)+'</b>'+
      (unk.length?'<br><span style="color:var(--ink-muted)">'+unk.join(', ')+' '+(unk.length>1?'are':'is')+' not in the lab’s word list — treated as a thing.</span>':'');
    box.dataset.state=[st.toks.map(x=>x.w).join(' '),st.sel,st.head,N(st.T,2),st.causal?1:0].join('|'); }
  /* ---- the 3-D stage ---- */
  let S3=null, geo=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[0,5.4,9.4],look:[0,.55,-1.3],fov:38},orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,colors,isLight,camera}=ctx, hx=hxOf(ctx), dark=!isLight; declutterOn(ctx);
      starfield(ctx,300,18); glassFloor(ctx,16,{div:64});
      const C={tok:hx(K18.tok),q:hx(K18.q),w:hx(K18.w),v:hx(K18.v),grey:hx('muted')};
      const dyn=new THREE.Group(); root.add(dyn); const beamG=new THREE.Group(); root.add(beamG);
      const hudEl=hud(box); hint(box,'drag to orbit · click a word');
      let beads=[], pillars=[], labs=[], pulses=[], SP=1, X0=0, Y=.55, Z=1.4, GZ0=-.3, GSP=.55, LK=.0095, rowGap=.4, stag=false, NAR=false;
      const px=i=>X0+i*SP;
      ctx.rebuild=()=>{ clearGroup(dyn); const n=st.toks.length; NAR=box.clientWidth<560; SP=NAR?Math.min(.9,7.2/Math.max(1,n-1)):Math.min(.95,8.6/Math.max(1,n-1)); X0=-(n-1)/2*SP; GSP=Math.min(.55,5/n);
        LK=NAR?.0152:.0095;   /* phone: bigger, so a word's text is at least 11 px tall */
        beads=st.toks.map((t,i)=>{ const g=new THREE.Group(); g.position.set(px(i),Y,Z); dyn.add(g);
          const shell=new THREE.Mesh(new THREE.SphereGeometry(.24,28,20),new THREE.MeshStandardMaterial({color:dark?0xdfe8ff:0xffffff,transparent:true,opacity:dark?.16:.38,roughness:.08,metalness:.2,depthWrite:false}));
          const core=new THREE.Mesh(new THREE.SphereGeometry(.15,24,16),new THREE.MeshStandardMaterial({color:C.tok,emissive:C.tok,emissiveIntensity:dark?.7:.3,roughness:.3}));
          const halo=haloSprite(ctx,C.tok,.9); g.add(shell,core,halo); core.userData.i=i; shell.userData.i=i;
          const w=lab(ctx,t.w,[px(i),Y-.52,Z+.05],{size:t.w.length>7&&!NAR?21:24,scale:LK,color:t.known?colors.ink:colors.muted,bg:!dark}); dyn.add(w);
          const wt=slot(ctx,dyn); return {g,core,halo,shell,wt,w}; });
        /* words too wide for their slot? put every other label on a second row, so no two ever touch */
        stag=beads.some((b,i)=>i+1<beads.length&&(b.w.scale.x+beads[i+1].w.scale.x)/2>SP*.94);
        rowGap=beads.length?beads[0].w.scale.y+.05:.4;
        if(stag) beads.forEach((b,i)=>{ if(i%2) b.w.position.y=Y-.52-rowGap; });
        pillars=[]; const pg=new THREE.BoxGeometry(1,1,1);
        for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const m=new THREE.Mesh(pg,new THREE.MeshStandardMaterial({color:C.w,emissive:C.w,emissiveIntensity:.2,roughness:.35,transparent:true,opacity:.9}));
          m.scale.set(SP*.34,1e-3,GSP*.62); m.position.set(px(j),0,GZ0-i*GSP); dyn.add(m); pillars.push({m,i,j}); }
        ctx._view=null; ctx.redraw(); };
      ctx.redraw=()=>{ const n=st.toks.length, A=W(), sel=st.sel, land=st.view==='land', V=THREE.Vector3;
        clearGroup(beamG); pulses=[]; const g2={beams:[],pillars:[],stag};
        beads.forEach((b,i)=>{ const on=i===sel, col=on?C.q:C.tok; b.core.material.color.setHex(col); b.core.material.emissive.setHex(col); b.core.material.emissiveIntensity=(dark?.7:.3)*(on?1.6:1);
          b.halo.material.color.setHex(col); b.halo.material.opacity=(dark?.45:.18)*(on?1.4:.8); b.g.scale.setScalar(on?1.18:1);
          /* the share of each word, written under its name (phones: the chips above carry the shares) */
          if(!land&&!NAR){ const w=A[sel][i]; b.wt.set(SH(w),[px(i),Y-.52-(stag?2:1)*rowGap,Z+.05],{size:w>.3?22:18,scale:LK,color:w>.3?colors.s4:colors.ink2,bg:!dark}); } else b.wt.hide(); });
        if(!land){ st.toks.forEach((_,j)=>{ const w=A[sel][j]; if(w<.004) return; const a=new V(px(sel),Y+.18,Z), b=new V(px(j),Y+.18,Z);
            const curve=j===sel?new THREE.CatmullRomCurve3([a,new V(px(sel)-.3,Y+.9,Z),new V(px(sel)+.3,Y+.9,Z),b.clone().add(new V(.02,0,0))]):new THREE.QuadraticBezierCurve3(a,new V((a.x+b.x)/2,Y+.45+.2*Math.abs(sel-j)*SP,Z-.05),b);
            const r=.01+.055*Math.sqrt(w), m=new THREE.Mesh(new THREE.TubeGeometry(curve,48,r,10,false),new THREE.MeshStandardMaterial({color:C.w,emissive:C.w,emissiveIntensity:dark?.35+1.5*w:.2+.4*w,roughness:.3,transparent:true,opacity:.3+.7*Math.sqrt(w),depthWrite:false}));
            beamG.add(m); g2.beams.push({j,r,w}); const p=haloSprite(ctx,C.v,.2+.8*Math.sqrt(w)); p.material.opacity=0; beamG.add(p); pulses.push({p,curve,w}); }); }
        pillars.forEach(({m,i,j})=>{ const masked=st.causal&&j>i, w=A[i][j], h=land?Math.max(.012,w*2.4):.012; m.scale.y=h; m.position.y=h/2; m.visible=land;
          const hot=i===sel; m.material.opacity=masked?.15:(land?(hot?.95:.7):.5); m.material.emissiveIntensity=(dark?.1+1.1*w:.05+.25*w)*(hot?1.5:1);
          m.material.color.setHex(masked?C.grey:C.w); if(!hot&&land) m.material.color.lerp(new THREE.Color(dark?0x2a3558:0xdcd6c4),.35);
          if(land) g2.pillars.push({i,j,h,w}); });
        labs.forEach(s=>dyn.remove(s)); labs=[];
        if(land){ const s=lab(ctx,'row “'+st.toks[sel].w+'”',[-X0+.75*SP+.45,.25,GZ0-sel*GSP],{size:20,scale:LK,color:colors.s2,bg:!dark}); dyn.add(s); labs.push(s); }
        /* the camera follows the view (with a glide) and the phone/desktop layout (at once, e.g. after a resize) */
        if(ctx.orbit&&(ctx._view!==st.view||ctx._nar!==NAR)){ const first=ctx._view==null||ctx._view===st.view; ctx._view=st.view; ctx._nar=NAR; const L0=ctx.look.clone(), L1=land?new V(0,.5,-1.5):new V(0,NAR?.2:.4,1.3), ph0=ctx.orbit.sph.phi, ph1=land?.95:1.2, r0=ctx.orbit.sph.radius;
          /* far enough back that the whole row of beads fits the stage (a 10–12-word sentence is wider than the default view) */
          const fitR=((n-1)/2*SP+.55)/(Math.tan(camera.fov*Math.PI/360)*camera.aspect), r1=land?11.2*(NAR?1.7:1):NAR?12.6:Math.max(9.2,fitR);   /* phones: the row is already squeezed to fit (SP ≤ 7.2/(n − 1)) */
          const go=u=>{ ctx.look.lerpVectors(L0,L1,u); ctx.orbit.sph.phi=ph0+(ph1-ph0)*u; ctx.orbit.sph.radius=r0+(r1-r0)*u; ctx.orbit.place(); };
          if(first) go(1); else tween(900,go); }
        hudEl.innerHTML=land?'The whole map · row “'+st.toks[sel].w+'” lit · pillar height = share':'“'+st.toks[sel].w+'” asks every word · gold = its shares';
        geo=g2; RR(ctx); };
      ctx.flow=u=>{ pulses.forEach(({p,curve,w})=>{ if(u<=0||u>=1){ p.material.opacity=0; return; } p.position.copy(curve.getPoint(1-u)); p.material.opacity=(dark?.95:.7)*Math.sin(Math.PI*u)**.4; });
        const b=beads[st.sel]; if(b){ const g=Math.sin(Math.PI*clamp01(u*1.2-.2)); b.core.material.emissive.setHex(g>.2?C.v:C.q); b.halo.material.color.setHex(g>.2?C.v:C.q); } RR(ctx); };
      /* click a bead to choose the asking word */
      const ray=new THREE.Raycaster(), v2=new THREE.Vector2(); let down=null;
      ctx.renderer.domElement.addEventListener('pointerdown',e=>{ down=[e.clientX,e.clientY]; });
      ctx.renderer.domElement.addEventListener('pointerup',e=>{ if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5) return; const r=ctx.renderer.domElement.getBoundingClientRect();
        v2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(v2,camera); const hit=ray.intersectObjects(beads.map(b=>b.shell),false)[0]; if(hit) select(hit.object.userData.i); });
      ctx.rebuild(); setTimeout(()=>{ if(!ctx.dead) ctx.redraw(); },0);
    }}); }
  S3=mountStage(box,build); watchLayout(box,S3);
  const ctx3=()=>S3&&S3.handle&&S3.handle.ctx;
  function redrawAll(rebuild){ compute(); drawChips(); drawHeat(); drawOut(); readout(); const c=ctx3(); if(c){ if(rebuild&&c.rebuild) c.rebuild(); else if(c.redraw) c.redraw(); } }
  function select(i){ st.sel=Math.max(0,Math.min(st.toks.length-1,i)); redrawAll(false); }
  let tw=null;
  function play(){ if(tw) tw.stop(); const c=ctx3(); if(!c||!c.flow) return; if(st.view!=='beams'){ st.view='beams'; selTab(document.getElementById('am-view'),'beams'); c.redraw(); }
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
  let rsT=null, lastW=0; const rs=()=>{ clearTimeout(rsT); rsT=setTimeout(()=>{ const w=outSvg.getBoundingClientRect().width+heat.getBoundingClientRect().width*1000; if(Math.abs(w-lastW)<2) return; lastW=w; drawHeat(); drawOut(); const c=ctx3(); if(c&&c.rebuild) c.rebuild(); },80); }; addEventListener('resize',rs); if('ResizeObserver' in window){ const ro=new ResizeObserver(rs); ro.observe(outSvg.parentNode); ro.observe(heat); }
  U18.lab={st,select,load:(t)=>{ input.value=t; load(t); redrawAll(true); },redrawAll,cellOp,
    state(){ return {toks:st.toks.map(t=>t.w),sel:st.sel,head:st.head,T:st.T,causal:st.causal,view:st.view,A:st.R.A,X:st.R.X,Y:st.R.Y,geo,
      cells:[...heat.querySelectorAll('[data-role=cell]')].map(r=>({r:+r.dataset.r,c:+r.dataset.c,o:+r.getAttribute('opacity')}))}; },
    labels(){ return stageRects(ctx3()); },turn(a){ turnView(ctx3(),a); },cam(){ const c=ctx3(); return c&&c.orbit?{nar:c._nar,view:c._view,r:c.orbit.sph.radius,w:box.clientWidth,aspect:c.camera.aspect,size:[c.size.w,c.size.h],look:c.look.toArray(),phi:c.orbit.sph.phi,theta:c.orbit.sph.theta}:null; }};
})();

/* ---------- §7 · w-heads: two heads on one sentence + the shapes of the split ---------- */
(function(){
  const svg=document.getElementById('hd-svg'), split=document.getElementById('hd-split'); if(!svg) return;
  const chips=document.getElementById('hd-toks'), read=document.getElementById('hd-read');
  const toks=LAB.tokens('the batsman hit the ball because it was loose'), R=LAB.run(toks), n=toks.length;
  const HS=[1,2,4,8,12,16,32,64];
  const st={sel:6,d:512,hi:3};
  const arcW=w=>1+7*w, arcO=w=>.18+.82*w;
  function drawChips(){ chips.innerHTML=toks.map((t,i)=>`<button type="button" data-i="${i}" aria-pressed="${i===st.sel}">${t.w}</button>`).join('');
    chips.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ st.sel=+b.dataset.i; drawChips(); draw(); })); }
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 560':'0 0 760 300');
    const glow=glo(svg), F=fz(svg,12.5), Fs=fz(svg,10.5), c1=cv(K18.h1), c2=cv(K18.h2);
    const P=narrow?toks.map((_,i)=>[200,40+i*(480/(n-1))]):toks.map((_,i)=>[50+i*(660/(n-1)),150]);
    const obst=[];
    toks.forEach((t,i)=>{ const [x,y]=P[i], on=i===st.sel; obst.push(bboxOf(txt(svg,x,y+F*.36,t.w,`font:${on?800:600} ${F}px system-ui;fill:${on?'var(--s2)':'var(--ink)'}`,'middle'))); });
    /* the two head legends first, so no share label lands on them */
    if(narrow){ obst.push(bboxOf(txt(svg,12,18,'◀ head 1 · meaning',`font:800 ${Fs}px system-ui;fill:${c1}`))); obst.push(bboxOf(txt(svg,388,18,'head 2 · word before ▶',`font:800 ${Fs}px system-ui;fill:${c2}`,'end'))); }
    else { obst.push(bboxOf(txt(svg,14,22,'head 1 · meaning (above)',`font:800 ${Fs}px system-ui;fill:${c1}`))); obst.push(bboxOf(txt(svg,14,290,'head 2 · the word before (below)',`font:800 ${Fs}px system-ui;fill:${c2}`))); }
    const labs=[], box=narrow?{x:2,y:24,w:396,h:534}:{x:2,y:2,w:756,h:296};
    [0,1].forEach(h=>{ const A=R.A[h][st.sel], col=h?c2:c1;
      toks.forEach((_,j)=>{ const w=A[j]; if(w<.01) return; const [x1,y1]=P[st.sel],[x2,y2]=P[j], s=h?1:-1;
        let d, apex;
        if(narrow){ if(j===st.sel){ d=`M${x1+s*34},${y1-6} C${x1+s*80},${y1-26} ${x1+s*80},${y1+26} ${x1+s*34},${y1+6}`; apex=[x1+s*68,y1]; }
          else { const bend=30+Math.abs(y2-y1)*.45, cx=x1+s*(34+bend), cy=(y1+y2)/2; d=`M${x1+s*34},${y1} Q${cx},${cy} ${x2+s*34},${y2}`; apex=[(x1+s*34+2*cx+x2+s*34)/4,(y1+2*cy+y2)/4]; } }
        else { if(j===st.sel){ d=`M${x1-8},${y1+s*16} C${x1-30},${y1+s*62} ${x1+30},${y1+s*62} ${x1+8},${y1+s*16}`; apex=[x1,y1+s*50]; }
          else { const bend=26+Math.abs(x2-x1)*.34, cx=(x1+x2)/2, cy=y1+s*(16+bend); d=`M${x1},${y1+s*16} Q${cx},${cy} ${x2},${y2+s*16}`; apex=[(x1+2*cx+x2)/4,(y1+s*16+2*cy+y2+s*16)/4]; } }
        el('path',{d,fill:'none',stroke:col,'stroke-width':arcW(w).toFixed(2),'stroke-linecap':'round',opacity:arcO(w).toFixed(3),filter:glow&&w>.4?glow:'none','data-role':'arc','data-h':h,'data-j':j},svg);
        if(w>.08) labs.push({apex,w,col,s,h}); }); });
    /* each share sits at its arc's apex, nudged outward until it touches nothing */
    labs.sort((a,b)=>b.w-a.w).forEach(({apex,w,col,s})=>{ const [ax,ay]=apex, st2=`font:800 ${Fs}px system-ui;fill:${col}`+HALO;
      const cands=narrow?[[ax+s*10,ay+Fs*.35,s>0?'start':'end'],[ax+s*22,ay+Fs*.35,s>0?'start':'end'],[ax+s*10,ay-Fs,s>0?'start':'end'],[ax+s*10,ay+Fs*1.6,s>0?'start':'end']]
        :(()=>{ const out=s>0?Fs*1.1:-5, inn=s>0?-6:Fs*1.1; return [[ax,ay+out,'middle'],[ax,ay+inn,'middle'],[ax,ay+(s>0?Fs*2.1:-5-Fs),'middle'],[ax+Fs*2.4,ay+out,'middle'],[ax-Fs*2.4,ay+out,'middle'],[ax+Fs*2.4,ay+inn,'middle'],[ax-Fs*2.4,ay+inn,'middle']]; })();   /* outside the arc first, then just inside it */
      const t=placeLabel(svg,cands,N(w,2),st2,obst,1,box); if(t) t.setAttribute('data-role','arclab'); });
    svg.dataset.state=toks[st.sel].w+','+N(R.A[0][st.sel].indexOf(Math.max(...R.A[0][st.sel])),0)+','+N(R.A[1][st.sel].indexOf(Math.max(...R.A[1][st.sel])),0); }
  function drawSplit(){ split.innerHTML=''; const narrow=narrowOf(split); split.setAttribute('viewBox',narrow?'0 0 400 300':'0 0 760 170');
    const h=HS[st.hi], d=st.d, even=d%h===0, dk=d/h, F=fz(split,11), Fs=fz(split,10), glow=glo(split);
    const W=narrow?360:300, x0=narrow?20:20, y0=narrow?40:60, bh=26;
    txt(split,x0,y0-10,'one word: d = '+d,`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    const cols=['s5','s6','s7','s3','s2','s1'];
    for(let i=0;i<h;i++){ const x=x0+W*i/h; el('rect',{x:x+.5,y:y0,width:Math.max(.8,W/h-1),height:bh,rx:Math.min(4,W/h/3),fill:cv(cols[i%6]),opacity:.85,'data-role':'piece'},split); }
    if(h<=8&&even) for(let i=0;i<h;i++) txt(split,x0+W*(i+.5)/h,y0+bh/2+F*.36,String(dk),`font:700 ${Math.min(F,W/h/2.6+4)}px system-ui;fill:#0b1020`,'middle');
    const x1=narrow?20:360, y1=narrow?130:60;
    edge(split,narrow?200:x0+W+8,narrow?y0+bh+6:y0+bh/2,narrow?200:x1-10,narrow?y1-14:y1+bh/2,'var(--ink-muted)',1.5,null);
    const bw=(narrow?360:220)/Math.min(h,16);
    for(let i=0;i<Math.min(h,16);i++){ el('rect',{x:x1+i*bw+1,y:y1,width:Math.max(1,bw-2),height:bh,rx:4,fill:'none',stroke:cv(cols[i%6]),'stroke-width':1.6,filter:glow||'none'},split); }
    txt(split,x1,y1-10,even?h+' head'+(h>1?'s':'')+(h>16?' (first 16 drawn)':'')+', each on '+dk+' numbers':d+' does not split into '+h+' equal heads',`font:700 ${Fs}px system-ui;fill:${even?'var(--ink-muted)':'var(--critical)'}`);
    const x2=narrow?20:620, y2=narrow?220:60;
    edge(split,narrow?200:x1+(narrow?360:220)+8,narrow?y1+bh+6:y1+bh/2,narrow?200:x2-10,narrow?y2-14:y2+bh/2,'var(--ink-muted)',1.5,null);
    el('rect',{x:x2,y:y2,width:narrow?360:120,height:bh,rx:5,fill:cv(K18.w),opacity:.9},split);
    txt(split,x2+(narrow?180:60),y2+bh/2+F*.36,'glue · × W_O',`font:800 ${F}px system-ui;fill:#1a1206`,'middle');
    txt(split,x2,y2-10,'back to length '+d,`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    if(!narrow){ txt(split,20,136,'Every head: W_Q, W_K, W_V of size '+d+' × '+(even?dk:'?')+'.',`font:600 ${Fs}px system-ui;fill:var(--ink-2)`);
      txt(split,20,136+Fs*1.4,'With W_O: 4 × '+d+'² = '+grp(4*d*d)+' weights, whatever the number of heads.',`font:600 ${Fs}px system-ui;fill:var(--ink-2)`); }
    read.innerHTML=even?'d = <b>'+d+'</b>, h = <b>'+h+'</b> → each head works on <b>d<sub>k</sub> = '+d+' / '+h+' = '+dk+'</b> numbers<br>one head\'s W<sub>Q</sub>: '+d+' × '+dk+' = '+grp(d*dk)+' · all heads\' W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub>: 3 × '+h+' × '+grp(d*dk)+' = '+grp(3*d*d)+'<br>plus W<sub>O</sub> ('+d+' × '+d+'): total <b>'+grp(4*d*d)+'</b> = 4d²'
      :'d = <b>'+d+'</b>, h = <b>'+h+'</b> → '+d+' / '+h+' = '+N(dk,2)+' is <b>not a whole number</b>. Real models pick d as a multiple of h (768 = 12 × 64).<br>The weight count would still be 4d² = <b>'+grp(4*d*d)+'</b>.';
    split.dataset.state=[d,h,even?dk:N(dk,2),4*d*d].join(','); }
  bindCtl('hd-d',v=>{ st.d=v; drawSplit(); },v=>String(v));
  bindCtl('hd-h',v=>{ st.hi=v; drawSplit(); },v=>String(HS[v]));
  drawChips(); relayout(svg,draw); relayout(split,drawSplit);
  U18.heads={st,draw,drawSplit,R,HS,arcW,arcO,select(i){ st.sel=i; drawChips(); draw(); },
    state(){ return {sel:st.sel,word:toks[st.sel].w,A:[R.A[0][st.sel],R.A[1][st.sel]],d:st.d,h:HS[st.hi],
      arcs:[...svg.querySelectorAll('[data-role=arc]')].map(p=>({h:+p.dataset.h,j:+p.dataset.j,w:+p.getAttribute('stroke-width'),o:+p.getAttribute('opacity')}))}; }};
})();

/* ---------- §7 · w-subspace: each head wears its own glasses (2-D) ---------- */
(function(){
  const svg=document.getElementById('ss-svg'); if(!svg) return;
  const read=document.getElementById('ss-read'), qBar=document.getElementById('ss-q'), hBar=document.getElementById('ss-head');
  const WDS=[['chai',[1,.8,0]],['coffee',[.75,1.05,0]],['lassi',[1,-.8,0]],['ice',[.1,-1.1,0]],['sun',[-.3,1.1,.2]],['cricket',[-.3,.3,1]],['football',[.25,-.3,1]],['bat',[-.5,0,.7]]];
  const HEADS=[{n:'drink',c:'s5'},{n:'hot',c:'s6'},{n:'sport',c:'s7'}], SH=3;
  const st={head:0,q:1};
  /* head h keeps only feature h: its query is SH × (the asking word's feature h), each key is the word's feature h (d_k = 1, so √d_k = 1) */
  const sharesOf=(h,qi)=>{ const qx=WDS[qi][1][h]*SH; return softmax(WDS.map(([,x])=>qx*x[h])); };
  qBar.innerHTML=WDS.map(([w],i)=>`<button role="tab" aria-selected="${i===st.q}" data-t="${i}">${w}</button>`).join('');
  let narrow=false, lastBW=0;
  function draw(){ svg.innerHTML=''; narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 770':'0 0 760 380');
    const glow=glo(svg), F=fz(svg,12), Fs=fz(svg,10.5), rh=narrow?34:36, n=WDS.length;
    const T1={x:narrow?96:104,y:narrow?64:66,cw:narrow?94:72}, T2={x:narrow?96:424,y:narrow?446:66,cw:narrow?98:110};
    const sec=(x,y,t)=>txt(svg,x,y,t,`font:700 ${Fs}px system-ui;fill:var(--ink-muted);letter-spacing:.04em`);
    sec(narrow?14:18,narrow?24:24,'WHAT EACH WORD IS MADE OF (hand-made)');
    sec(narrow?14:T2.x-6,narrow?406:24,'HOW MUCH “'+WDS[st.q][0].toUpperCase()+'” LISTENS · per head');
    const all=HEADS.map((_,h)=>sharesOf(h,st.q));
    [T1,T2].forEach((T,k)=>{
      /* the asking word's row, outlined across the table */
      el('rect',{x:T.x-(k?4:88),y:T.y+st.q*rh+1,width:3*T.cw+(k?8:92),height:rh-2,rx:8,fill:'color-mix(in srgb,var(--s2) 12%,transparent)',stroke:cv(K18.q),'stroke-width':1.6},svg);
      HEADS.forEach((H,h)=>{ const on=h===st.head, x=T.x+h*T.cw;
        if(on) el('rect',{x:x+1,y:T.y-26,width:T.cw-2,height:n*rh+28,rx:9,fill:'color-mix(in srgb,'+cv(H.c)+' 12%,transparent)',stroke:cv(H.c),'stroke-width':on?2:1,filter:glow&&on?glow:'none'},svg);
        txt(svg,x+T.cw/2,T.y-9,k?H.n+' head':H.n+'?',`font:800 ${F}px system-ui;fill:${cv(H.c)}`,'middle'); });
      WDS.forEach(([w],i)=>{ if(k===0||narrow) txt(svg,T.x-10,T.y+i*rh+rh/2+F*.36,w,`font:${i===st.q?800:600} ${F}px system-ui;fill:${i===st.q?'var(--s2)':'var(--ink)'}`,'end'); });
    });
    /* left: the features. A head sees only its own column; the other two are dimmed */
    WDS.forEach(([w,x],i)=>x.forEach((v,h)=>{ const X=T1.x+h*T1.cw, Y=T1.y+i*rh, on=h===st.head;
      el('rect',{x:X+5,y:Y+4,width:T1.cw-10,height:rh-8,rx:5,fill:v>=0?cv(K18.k):'var(--critical)',opacity:((on?.12:.05)+(on?.7:.22)*Math.min(1,Math.abs(v)/1.1)).toFixed(3),'data-role':'feat','data-i':i,'data-h':h},svg);
      txt(svg,X+T1.cw/2,Y+rh/2+Fs*.36,N(v,2),`font:700 ${Fs}px system-ui;fill:${on?'var(--ink)':'var(--ink-muted)'};opacity:${on?1:.55}`,'middle'); }));
    /* right: the shares, one column per head. Bar width = share × (column width − 50), so a full column would be a share of 1 */
    /* phone: the number on top and a thin full-width bar under it; wide: the bar, then the number */
    const BWm=narrow?T2.cw-18:T2.cw-50; lastBW=BWm;
    all.forEach((sh,h)=>sh.forEach((p,i)=>{ const X=T2.x+h*T2.cw+(narrow?9:6), Y=T2.y+i*rh, on=h===st.head, by=narrow?Y+rh-10:Y+rh/2-6, bh=narrow?6:12;
      el('rect',{x:X,y:by,width:BWm,height:bh,rx:3,fill:'var(--grid)',opacity:.45},svg);
      el('rect',{x:X,y:by,width:Math.max(1.2,BWm*p),height:bh,rx:3,fill:cv(K18.w),opacity:on?.95:.55,filter:glow&&on&&p>.25?glow:'none','data-role':'share','data-i':i,'data-h':h},svg);
      if(narrow) txt(svg,X+BWm/2,Y+rh/2+1,FX(p,3),`font:${on?800:600} ${Fs}px system-ui;fill:${on?'var(--s4)':'var(--ink-muted)'}`,'middle');
      else txt(svg,X+BWm+4,Y+rh/2+Fs*.36,FX(p,3),`font:${on?800:600} ${Fs}px system-ui;fill:${on?'var(--s4)':'var(--ink-muted)'}`); }));
    const w=all[st.head], order=w.map((x,i)=>[x,i]).sort((a,b)=>b[0]-a[0]);
    read.innerHTML='“<b style="color:var(--s2)">'+WDS[st.q][0]+'</b>” asks the <b style="color:'+cv(HEADS[st.head].c)+'">'+HEADS[st.head].n+' head</b>: its '+HEADS[st.head].n+' feature is <b>'+N(WDS[st.q][1][st.head],2)+'</b>, so its query is 3 × '+N(WDS[st.q][1][st.head],2)+' = <b>'+N(3*WDS[st.q][1][st.head],2)+'</b><br>'+order.slice(0,4).map(([x,i])=>WDS[i][0]+' <b style="color:var(--s4)">'+FX(x,3)+'</b>').join(' · ');
    svg.dataset.state=[WDS[st.q][0],HEADS[st.head].n,w.map(x=>x.toFixed(3)).join(' ')].join('|'); }
  tabs(hBar,t=>{ st.head=+t; draw(); });
  tabs(qBar,t=>{ st.q=+t; draw(); });
  relayout(svg,draw);
  U18.sub={st,draw,sharesOf,WDS,HEADS,SH,set(h,q){ if(h!=null){ st.head=h; selTab(hBar,h); } if(q!=null){ st.q=q; selTab(qBar,q); } draw(); },
    state(){ return {q:WDS[st.q][0],head:HEADS[st.head].n,shares:HEADS.map((_,h)=>sharesOf(h,st.q)),
      bars:[...svg.querySelectorAll('[data-role=share]')].map(r=>({i:+r.dataset.i,h:+r.dataset.h,w:+r.getAttribute('width')})),BW:lastBW}; }};
})();
