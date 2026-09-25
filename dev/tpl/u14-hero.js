/* ================= OPENING SHOT · beads become a bell, the bell becomes a mountain, scores become probabilities ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced;
  const ROWS=10, DX=.24, PEG0=3.25, DY=.2, NB=460, BH=.0165;   /* board geometry; NB beads per shower; bar height per bead */
  const binX=k=>(k-ROWS/2)*DX;
  const T_RAIN=8.2, T_BELL=1.6, T_MELT=2.8, T_HOLD=3.6, T_SWAP=1.0, T_SOFT=3.6, T_HOLD3=3.4, T_BACK=1.2;
  const SIGS=[[.7,.35],[.35,.7]];                       /* Σ = 0.35·[[2,1],[1,2]] in scene units */
  const detS=.7*.7-.35*.35, dens=(x,y)=>{ const a=(.7*x*x-2*.35*x*y+.7*y*y)/detS; return Math.exp(-.5*a); };
  const MH=1.9;                                          /* mountain height */
  const Z=[2,1,0], Q=softmax(Z), PCOL=['s1','s2','s7'];
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    const cam0={theta:.28,phi:1.2,radius:wide?9.3:9.4}, look=[0,1.5,0];
    const pos=[look[0]+cam0.radius*Math.sin(cam0.phi)*Math.sin(cam0.theta),look[1]+cam0.radius*Math.cos(cam0.phi),look[2]+cam0.radius*Math.sin(cam0.phi)*Math.cos(cam0.theta)];
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:0,camera:{pos,look,fov:wide?32:38},
      build(ctx){
        const {THREE,root,colors:c,isLight,camera,renderer}=ctx, hx=hxOf(ctx), dark=!isLight;
        let offW=0; const applyOffset=()=>{ const w=ctx.size.w, h=ctx.size.h; if(!wide||!w||w===offW) return; offW=w; camera.setViewOffset(w,h,-Math.round(w*.2),0,w,h); };
        applyOffset();
        starfield(ctx,520,22);
        { const top=new THREE.DirectionalLight(0xffffff,dark?.45:.25); top.position.set(2,8,3); root.add(top); }
        glassFloor(ctx,8,{div:32});
        const setOp=(o,v)=>o.traverse(m=>{ const mt=m.material; if(!mt) return; mt.transparent=true; if(mt.userData.baseOp==null) mt.userData.baseOp=mt.opacity==null?1:mt.opacity; mt.opacity=mt.userData.baseOp*v; });
        /* ---- scene 1: the Galton board ---- */
        const s1=new THREE.Group(); root.add(s1);
        const pane=CIN.prim.glass(ctx,2.95,3.75,hx('ink2'),dark?.05:.07); pane.position.set(0,1.88,-.09); s1.add(pane);
        const paneEdge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.95,3.75)),new THREE.LineBasicMaterial({color:hx('ink2'),transparent:true,opacity:.35})); paneEdge.position.copy(pane.position); s1.add(paneEdge);
        const nPeg=ROWS*(ROWS+1)/2, pegs=new THREE.InstancedMesh(new THREE.SphereGeometry(.028,12,8),new THREE.MeshStandardMaterial({color:hx('ink'),emissive:hx('ink'),emissiveIntensity:dark?.55:.1,roughness:.3,transparent:true}),nPeg);
        { const m=new THREE.Matrix4(); let k=0; for(let i=0;i<ROWS;i++) for(let j=0;j<=i;j++){ m.makeTranslation((j-i/2)*DX,PEG0-i*DY,0); pegs.setMatrixAt(k++,m); } } s1.add(pegs);
        /* slot walls */
        for(let k=0;k<=ROWS+1;k++){ const x=(k-.5-ROWS/2)*DX; const w=liveTube(ctx,hx('ink2'),.006,.35); aimTube(THREE,w,[x,0,0],[x,1.25,0]); s1.add(w); }
        /* histogram bars */
        const bars=[]; for(let k=0;k<=ROWS;k++){ const b=new THREE.Mesh(new THREE.BoxGeometry(DX*.8,1,.34),new THREE.MeshStandardMaterial({color:hx(K14.mass),emissive:hx(K14.mass),emissiveIntensity:dark?.55:.18,roughness:.35,transparent:true,opacity:.88})); b.position.set(binX(k),0,0); b.scale.y=1e-3; s1.add(b); bars.push(b); }
        /* the bell that emerges: a gold outline of the expected shape */
        const bellPts=[]; for(let i=0;i<=80;i++){ const x=-1.35+2.7*i/80, k=x/DX+ROWS/2; const sd=Math.sqrt(ROWS/4); bellPts.push([x,NB*BH*Math.exp(-.5*((k-ROWS/2)/sd)**2)/(sd*Math.sqrt(2*Math.PI))+.02,.2]); }
        const bell=tubeLine(ctx,bellPts,hx(K14.mean),.018,.5); bell.material.opacity=0; root.add(bell);
        /* beads in flight: one instanced mesh */
        const MAXF=140, beadMat=new THREE.MeshStandardMaterial({color:dark?0xffffff:hx(K14.mass),emissive:hx(K14.mass),emissiveIntensity:dark?1:.35,roughness:.25}), beads=new THREE.InstancedMesh(new THREE.SphereGeometry(.042,14,10),beadMat,MAXF);
        beads.count=0; beads.frustumCulled=false; s1.add(beads);
        const rnd=seeded(14), mtx=new THREE.Matrix4();
        let fly=[], spawned=0, counts=new Array(ROWS+1).fill(0);
        const beadPos=(b,t)=>{ /* t in rows: 0 = funnel, 1..ROWS = peg rows, ROWS+1 = slot */
          const i=Math.floor(t), u=t-i, xs=k=>{ let r=0; for(let j=0;j<k&&j<ROWS;j++) if(b.p[j]) r++; return (r-Math.min(k,ROWS)/2)*DX; };
          const ys=k=>k<=0?PEG0+.32:(k<=ROWS?PEG0-(k-1)*DY+.06:.02+counts[b.r]*BH);
          if(i>=ROWS+1) return [xs(ROWS),ys(ROWS+1)];
          return [xs(i)+(xs(i+1)-xs(i))*u, ys(i)+(ys(i+1)-ys(i))*u+(i>0&&i<ROWS?Math.sin(Math.PI*u)*.07:0)]; };
        const resetBoard=()=>{ fly=[]; spawned=0; counts.fill(0); bars.forEach(b=>{ b.scale.y=1e-3; b.position.y=0; }); beads.count=0; bell.material.opacity=0; };
        /* ---- scene 2: the mountain ---- */
        const s2=new THREE.Group(); root.add(s2); s2.visible=false;
        const surf=CIN.prim.surface(ctx,(x,y)=>dens(x,y),{x:[-2.7,2.7],y:[-2.7,2.7],res:84,ramp:[c.s1,c.s6,c.s4],opacity:isLight?.9:.86}); s2.add(surf);
        const vis=fadeAttr(THREE,surf); { const p=surf.userData.geo.attributes.position; for(let i=0;i<p.count;i++){ const u=Math.max(0,Math.min(1,(p.getY(i)-.01)/.16)); vis.setX(i,u*u*(3-2*u)); } vis.needsUpdate=true; }
        if(surf.children[1]) surf.children[1].material.opacity=isLight?.05:.045;
        const E=eig2(SIGS[0][0],SIGS[0][1],SIGS[1][1]);
        const ring=k=>ellipsePts(0,0,SIGS[0][0],SIGS[0][1],SIGS[1][1],k,120).map(p=>M3(p[0],p[1],.014));
        const floorG=new THREE.Group(); s2.add(floorG);
        [1,2].forEach((k,i)=>floorG.add(overlay(tubeLine(ctx,ring(k),hx(K14.mass),.022-.007*i,1-.3*i),6)));
        [1,2].forEach(k=>{ const h=Math.exp(-.5*k*k); floorG.add(tubeLine(ctx,ellipsePts(0,0,SIGS[0][0],SIGS[0][1],SIGS[1][1],k,120).map(p=>M3(p[0],p[1],h+.008)),dark?0xffffff:hx('ink'),.008,.55)); });
        E.forEach(e=>{ const L=2*Math.sqrt(e.l); const a=CIN.prim.arrow(ctx,M3(-e.v[0]*L,-e.v[1]*L,.03),M3(e.v[0]*L,e.v[1]*L,.03),hx(K14.axis),{radius:.02,head:.17}); overlay(a,8); floorG.add(a);
          const b=CIN.prim.arrow(ctx,M3(e.v[0]*L,e.v[1]*L,.03),M3(-e.v[0]*L,-e.v[1]*L,.03),hx(K14.axis),{radius:.02,head:.17}); overlay(b,8); floorG.add(b); });
        const peakB=bead(ctx,[0,MH+.05,0],K14.mean,.07); s2.add(peakB);
        /* ---- scene 3: scores → softmax → probabilities ---- */
        const s3=new THREE.Group(); root.add(s3); s3.visible=false; s3.position.x=-.7;
        const sm=CIN.prim.glass(ctx,3.3,2.7,hx(K14.mass),dark?.13:.16); sm.rotation.y=Math.PI/2; sm.position.set(0,1.35,0); s3.add(sm);
        const smEdge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.3,2.7)),new THREE.LineBasicMaterial({color:hx(K14.mass),transparent:true,opacity:.7})); smEdge.rotation.y=Math.PI/2; smEdge.position.copy(sm.position); s3.add(smEdge);
        s3.add(lab(ctx,'softmax',[0,2.95,0],{size:26,color:c.s6,scale:.0075,depthTest:false}));
        const pil=Z.map((z,i)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(.42,1,.42),new THREE.MeshStandardMaterial({color:hx(PCOL[i]),emissive:hx(PCOL[i]),emissiveIntensity:dark?.5:.15,roughness:.3,transparent:true,opacity:.92})); s3.add(m); return m; });
        const pilLab=[0,1,2].map(()=>slot(ctx,s3));
        const sumLab=slot(ctx,s3);
        const ZROW=[-1.05,0,1.05], SH=.78, PH=2.3;
        const setPillars=u=>{ /* u: 0 = scores on the left, 1 = probabilities on the right */
          pil.forEach((m,i)=>{ const x=-2.3+3.9*easeIO(Math.min(1,Math.max(0,u*1.15-i*.075))), cross=Math.max(0,Math.min(1,(x+.25)/.5)), h=Math.max(.05,(1-cross)*Math.max(.05,Z[i]*SH)+cross*Q[i]*PH);
            m.scale.y=h; m.position.set(x,h/2,ZROW[i]); const txt=cross<.5?'z = '+Z[i]:F(Q[i],3); pilLab[i].set(txt,[x,h+.3,ZROW[i]],{size:21,color:cross<.5?cssv('ink'):cssv(PCOL[i]),scale:.0068,depthTest:false}); });
          if(u>=.999) sumLab.set('0.665 + 0.245 + 0.090 = 1',[1.3,2.45,0],{size:22,color:cssv(K14.mean),scale:.007,depthTest:false}); else sumLab.hide(); };
        const hudEl=hud(box,wide?'hud-r':''); hudEl.style.maxWidth='calc(100% - 1.4rem)'; if(fine) hint(box,'drag to orbit');
        /* ---- the timeline ---- */
        let held=false; renderer.domElement.addEventListener('pointerdown',()=>{ held=true; });
        const st={phase:'rain',t0:null,from:null,lit:false};
        const cur=()=>{ const s=ctx.orbit.sph; return {theta:s.theta,phi:s.phi,radius:s.radius}; };
        const CAM={rain:{theta:.28,phi:1.2,radius:cam0.radius},melt:{theta:.5,phi:.82,radius:cam0.radius*1.0},soft:{theta:1.02,phi:1.16,radius:cam0.radius*1.02}};
        const drive=(to,e,bl)=>{ if(held||!ctx.orbit||!st.from) return; const u=easeIO(Math.min(1,e/bl)), s=ctx.orbit.sph; ['theta','phi','radius'].forEach(k=>{ s[k]=st.from[k]+(to[k]-st.from[k])*u; }); ctx.orbit.place(); };
        const enter=(ph,t)=>{ st.phase=ph; st.t0=t; st.from=ctx.orbit?cur():null; st.lit=false; box.dataset.phase=ph; };
        const show=(g,v)=>{ g.visible=v>.001; setOp(g,v); };
        const mountain=v=>{ const p=surf.userData.geo.attributes.position, zv=surf.userData.zv0||(surf.userData.zv0=Float32Array.from({length:p.count},(_,i)=>p.getY(i)));
          for(let i=0;i<p.count;i++) p.setY(i,zv[i]*MH*Math.max(.001,v)); p.needsUpdate=true; surf.userData.geo.computeVertexNormals(); peakB.position.y=MH*v+.06; };
        let lastT=0;
        const rain=(t,dt)=>{ const e=t-st.t0; /* spawn at a rate that front-loads the shower */
          const want=Math.min(NB,Math.floor(NB*Math.min(1,e/(T_RAIN-1.8))**1.15));
          while(spawned<want){ const p=[]; let r=0; for(let j=0;j<ROWS;j++){ const R=rnd()<.5; p.push(R); if(R) r++; } fly.push({p,r,t:0}); spawned++; }
          fly.forEach(b=>{ b.t+=dt*9.5; }); const done=fly.filter(b=>b.t>=ROWS+1); done.forEach(b=>{ counts[b.r]++; }); fly=fly.filter(b=>b.t<ROWS+1);
          if(fly.length>MAXF) fly.splice(0,fly.length-MAXF).forEach(b=>{ counts[b.r]++; });
          bars.forEach((b,k)=>{ const h=Math.max(1e-3,counts[k]*BH); b.scale.y=h; b.position.y=h/2; });
          beads.count=fly.length; fly.forEach((b,i)=>{ const [x,y]=beadPos(b,b.t); mtx.makeTranslation(x,y,0); beads.setMatrixAt(i,mtx); }); beads.instanceMatrix.needsUpdate=true; };
        ctx.hero={tick(t){ applyOffset(); if(!ctx.orbit) return true; if(st.t0==null){ st.t0=t; st.from=cur(); lastT=t; } const dt=Math.min(.1,t-lastT); lastT=t; const e=t-st.t0;
          if(st.phase==='rain'){ rain(t,dt); hudEl.innerHTML='Every bead flips a coin at every peg · <b>'+Math.min(spawned,NB)+'</b> beads'; drive(CAM.rain,e,2);
            if(e>=T_RAIN&&!fly.length) enter('bell',t); }
          else if(st.phase==='bell'){ const u=Math.min(1,e/T_BELL); bell.material.opacity=u; hudEl.innerHTML='No bead knows about bells — <b>the shape comes from counting</b>';
            if(!st.lit){ st.lit=true; flare(ctx,[0,NB*BH*.25+.3,0],hx(K14.mean),900,1.4); } if(e>=T_BELL+.6) enter('melt',t); }
          else if(st.phase==='melt'){ const u=Math.min(1,e/T_MELT), v=easeIO(u); show(s1,1-v); bell.material.opacity=1-v; s2.visible=true; setOp(s2,Math.min(1,v*1.4)); mountain(v); drive(CAM.melt,e,T_MELT);
            hudEl.innerHTML='The pile melts into a mountain of probability'; if(e>=T_MELT){ show(s1,0); enter('hold',t); } }
          else if(st.phase==='hold'){ hudEl.innerHTML='Σ = [[2, 1], [1, 2]] · <b>the ellipse you met in Unit 12 was a probability all along</b>';
            if(!st.lit){ st.lit=true; flare(ctx,[0,.05,0],hx(K14.mass),1000,2.4); } if(!held&&ctx.orbit){ ctx.orbit.sph.theta+=dt*.08; ctx.orbit.place(); } if(e>=T_HOLD) enter('swap',t); }
          else if(st.phase==='swap'){ const u=Math.min(1,e/T_SWAP); show(s2,1-u); show(s3,u); setPillars(0); drive(CAM.soft,e,T_SWAP+1); hudEl.innerHTML='Scores are not probabilities…'; if(e>=T_SWAP){ show(s2,0); enter('soft',t); } }
          else if(st.phase==='soft'){ const u=Math.min(1,e/T_SOFT); setPillars(u); drive(CAM.soft,e,1); hudEl.innerHTML='scores 2, 1, 0 → <b>softmax</b> → shares that add to 1';
            if(u>=1&&!st.lit){ st.lit=true; flare(ctx,[.9,1.6,0],hx(K14.mean),900,1.8); } if(e>=T_SOFT) enter('hold3',t); }
          else if(st.phase==='hold3'){ hudEl.innerHTML='<b>0.665 + 0.245 + 0.090 = 1</b> · honest probabilities from raw scores'; if(e>=T_HOLD3) enter('back',t); }
          else { const u=Math.min(1,e/T_BACK); show(s3,1-u); drive(CAM.rain,e,T_BACK); if(e>=T_BACK){ show(s3,0); resetBoard(); mountain(0); s2.visible=false; show(s1,1); enter('rain',t); } }
          return true; }};
        resetBoard(); mountain(0); show(s1,1); box.dataset.phase='rain';
        if(reduced){ show(s1,0); s2.visible=false; show(s3,1); setPillars(1); box.dataset.phase='hold3'; hudEl.innerHTML='<b>0.665 + 0.245 + 0.090 = 1</b> · honest probabilities from raw scores';
          camera.position.setFromSpherical(new THREE.Spherical(CAM.soft.radius,CAM.soft.phi,CAM.soft.theta)).add(new THREE.Vector3(...look)); camera.lookAt(...look); }
        else hudEl.innerHTML='Every bead flips a coin at every peg';
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.tick(t); }
    });
  }
  const HS=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(HS); rw=innerWidth; });
  window.U14H={phase:()=>box.dataset.phase};
})();
