/* ================= OPENING SHOT · every word asks every word ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced;
  const toks=LAB.tokens('the batsman hit the ball because it was loose'), R=LAB.run(toks), A=R.A[0], n=toks.length, IT=6, BALL=4;
  const T=19;
  const cl=v=>Math.max(0,Math.min(1,v)), seg=(t,a,b)=>cl((t-a)/(b-a)), lerp=(a,b,u)=>a+(b-a)*u;
  /* schedule (seconds into the loop) */
  const S={appear:[.2,1.4],sweep:[1.8,4.2],beams:[4.3,6.3],flow:[6.6,8.6],turn:[7.6,8.9],grid:[10.2,14.2],fade:[T-.8,T]};
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    const look=wide?[0,1.05,-1.1]:[0,.35,.2], cam0={theta:.04,phi:wide?1.2:1.18,radius:wide?17.5:12};
    const pos=[look[0]+cam0.radius*Math.sin(cam0.phi)*Math.sin(cam0.theta),look[1]+cam0.radius*Math.cos(cam0.phi),look[2]+cam0.radius*Math.sin(cam0.phi)*Math.cos(cam0.theta)];
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:0,camera:{pos,look,fov:wide?30:40},
      build(ctx){
        const {THREE,root,colors,isLight,camera}=ctx, hx=hxOf(ctx), dark=!isLight, SC=wide?.0085:.0105;
        /* keep the whole scene (both camera poses of the loop) inside the free space right of the text column */
        let offW=0, offH=0; const R0={r:cam0.radius};
        const applyOffset=()=>{ const w=ctx.size.w, h=ctx.size.h; if(!wide||!w||(w===offW&&h===offH)) return; offW=w; offH=h; fit(w,h); };
        starfield(ctx,560,24);
        { const top=new THREE.DirectionalLight(0xffffff,dark?.4:.25); top.position.set(2,8,3); root.add(top); }
        glassFloor(ctx,40,{div:160});
        const C={tok:hx(K18.tok),q:hx(K18.q),w:hx(K18.w),v:hx(K18.v),ink:hx('ink'),grey:hx('muted')};
        const SP=wide?.67:.9, X0=-(n-1)/2*SP, Y=.62, Z=1.5;
        const px=i=>X0+i*SP;
        /* ---- the words: a glass bead with a core that glows ---- */
        const beads=toks.map((t,i)=>{ const g=new THREE.Group(); g.position.set(px(i),Y,Z); root.add(g);
          const shell=new THREE.Mesh(new THREE.SphereGeometry(.26,32,22),new THREE.MeshStandardMaterial({color:dark?0xdfe8ff:0xffffff,transparent:true,opacity:dark?.16:.38,roughness:.08,metalness:.2,depthWrite:false}));
          const core=new THREE.Mesh(new THREE.SphereGeometry(.16,26,18),new THREE.MeshStandardMaterial({color:C.tok,emissive:C.tok,emissiveIntensity:0,roughness:.3,transparent:true,opacity:.95}));
          const halo=haloSprite(ctx,C.tok,1.05); halo.material.opacity=0; g.add(shell,core,halo);
          const word=lab(ctx,t.w,[px(i),Y-.52,Z+.05],{size:wide?21:26,scale:SC,color:colors.ink,bg:!dark}); word.material.opacity=0; root.add(word);
          const wt=slot(ctx,root); return {g,shell,core,halo,word,wt,x:px(i)}; });
        /* ---- the query beam from "it" to a moving tip ---- */
        const qBeam=liveTube(ctx,C.q,.022,.9); qBeam.material.depthWrite=false; root.add(qBeam); const qTip=haloSprite(ctx,C.q,.55); root.add(qTip);
        /* ---- gold arcs from "it" to every word, revealed along their length ---- */
        const arcPts=j=>{ const a=new THREE.Vector3(px(IT),Y+.2,Z), b=new THREE.Vector3(px(j),Y+.2,Z), h=.55+.24*Math.abs(IT-j);
          if(j===IT) return new THREE.CatmullRomCurve3([a,new THREE.Vector3(px(IT)-.35,Y+.95,Z),new THREE.Vector3(px(IT)+.35,Y+.95,Z),b.clone().add(new THREE.Vector3(.02,0,0))]);
          return new THREE.QuadraticBezierCurve3(a,new THREE.Vector3((a.x+b.x)/2,Y+h,Z-.05),b); };
        const arcs=toks.map((t,j)=>{ const w=A[IT][j], curve=arcPts(j), r=.012+.06*Math.sqrt(w);
          const geo=new THREE.TubeGeometry(curve,64,r,10,false), m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:C.w,emissive:C.w,emissiveIntensity:dark?.4+1.6*w:.25+.4*w,roughness:.3,transparent:true,opacity:.12+.88*Math.sqrt(w),depthWrite:false}));
          root.add(m); const cnt=geo.index.count; geo.setDrawRange(0,0);
          const pulse=haloSprite(ctx,C.v,.25+.9*Math.sqrt(w)); pulse.material.opacity=0; root.add(pulse);
          return {m,geo,cnt,curve,w,pulse}; });
        /* ---- the landscape: an n × n field of gold pillars behind the words ---- */
        const GZ0=-.35, GSP=.5, PH=2.4;
        const gz=i=>GZ0-i*GSP;
        const pillars=[]; const pg=new THREE.BoxGeometry(.3,1,.3);
        for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const w=A[i][j];
          const col=new THREE.Color(C.w).lerp(new THREE.Color(dark?0x1a2440:0xe9e4d4),1-Math.min(1,.25+w*1.1));
          const m=new THREE.Mesh(pg,new THREE.MeshStandardMaterial({color:col,emissive:C.w,emissiveIntensity:dark?.12+1.1*w:.05+.25*w,roughness:.35,metalness:.1,transparent:true,opacity:.92}));
          m.position.set(px(j),.001,gz(i)); m.scale.y=1e-3; m.visible=false; root.add(m); pillars.push({m,i,j,w}); }
        const rowLabs=toks.map((t,i)=>{ const s=lab(ctx,i===IT?'row “it”':'',[-X0+.75,.2,gz(i)],{size:21,scale:SC,color:colors.s2,bg:false}); s.material.opacity=0; if(i===IT) root.add(s); return s; });
        function fit(w,h){ const hdr=document.querySelector('.hero-stage header.hero'), br=box.getBoundingClientRect();
          const textR=hdr?Math.max(...[...hdr.children].map(c=>c.getBoundingClientRect().right))-br.left:w*.55;
          const toc=document.getElementById('toc'), tr=toc&&getComputedStyle(toc).display!=='none'?toc.getBoundingClientRect():null;
          const fR=tr&&tr.width>0&&tr.left<br.right?Math.min(w-28,tr.left-br.left-24):w-28, fL=Math.min(fR-240,textR+40); if(fR-fL<200) return;
          const V=THREE.Vector3, L=new V(...look), cam=camera.clone(); cam.clearViewOffset(); cam.aspect=w/h; cam.updateProjectionMatrix();
          const pts=[new V(px(0)-.55,Y-.7,Z),new V(px(n-1)+.55,Y-.7,Z),new V(px(0)-.4,Y+1.3,Z),new V(px(n-1)+.4,Y+1.3,Z),new V(px(0)-.25,0,gz(n-1)),new V(px(n-1)+.25,0,gz(n-1)),new V(px(0)-.25,2.5,gz(0)),new V(px(n-1)+1.9,.2,gz(IT))];
          let lo=0, hi=0;
          const span=R=>{ lo=1e9; hi=-1e9; [[cam0.phi,cam0.theta,R],[.9,-.06,R*.94]].forEach(([ph,th,r])=>{ cam.position.set(L.x+r*Math.sin(ph)*Math.sin(th),L.y+r*Math.cos(ph),L.z+r*Math.sin(ph)*Math.cos(th)); cam.lookAt(L); cam.updateMatrixWorld();
            pts.forEach(p=>{ const q=p.clone().project(cam), x=(q.x+1)/2*w; lo=Math.min(lo,x); hi=Math.max(hi,x); }); }); return hi-lo; };
          let R=17.5; for(let k=0;k<6;k++){ const sp=span(R); R=Math.max(12,R*sp/(fR-fL)); } span(R);
          R0.r=R; camera.setViewOffset(w,h,Math.round((lo+hi)/2-(fL+fR)/2),0,w,h);
          if(ctx.orbit&&!ctx.userCam){ ctx.orbit.sph.radius=R; ctx.orbit.place(); }
          box.dataset.fit=[Math.round(textR),Math.round(fL),Math.round(R*100)/100].join(','); }
        applyOffset(); setTimeout(()=>{ if(ctx.dead) return; offW=0; applyOffset(); RR(ctx); },0);
        /* test hook: where the scene's key points land on screen right now, and where the intro text ends */
        U18.hero={bounds(){ const hdr=document.querySelector('.hero-stage header.hero'), br=box.getBoundingClientRect(), V=THREE.Vector3, w=ctx.size.w, hh=ctx.size.h;
          const textR=hdr?Math.max(...[...hdr.children].map(c=>c.getBoundingClientRect().right))-br.left:0; camera.updateMatrixWorld();
          const P=[]; beads.forEach(b=>P.push(new V(b.x,Y,Z))); pillars.forEach(p=>{ if(p.m.visible) P.push(p.m.position.clone()); });
          let lo=1e9,hi=-1e9; P.forEach(p=>{ const q=p.clone().project(camera), x=(q.x+1)/2*w; lo=Math.min(lo,x); hi=Math.max(hi,x); });
          return {textR,lo,hi,w,h:hh,wide}; }};
        const hudEl=hud(box,wide?'hud-r':''); hudEl.style.maxWidth='calc(100% - 1.4rem)';
        if(fine) hint(box,'drag to orbit');
        ctx.renderer.domElement.addEventListener('pointerdown',()=>{ ctx.userCam=true; });
        const tokHex=new THREE.Color(C.tok), vHex=new THREE.Color(C.v), qHex=new THREE.Color(C.q);
        function apply(tt){
          const fade=1-seg(tt,S.fade[0],S.fade[1]);
          /* words appear, one after another */
          beads.forEach((b,i)=>{ const u=seg(tt,S.appear[0]+i*.1,S.appear[0]+i*.1+.5)*fade;
            let col=tokHex.clone(), glow=u;
            if(i===IT){ const q=seg(tt,S.sweep[0]-.4,S.sweep[0])*(1-seg(tt,S.flow[0],S.flow[0]+.6)); col.lerp(qHex,q);
              const turn=easeIO(seg(tt,S.turn[0],S.turn[1])); col.lerp(vHex,turn*.85); glow=u*(1+.6*turn+.4*q); }
            /* the sweep touches each word */
            const sw=seg(tt,S.sweep[0],S.sweep[1]); if(sw>0&&sw<1){ const tip=lerp(-.5,n-.5,sw); const near=Math.exp(-((tip-i)**2)*3); glow+=near*.9; }
            b.core.material.color.copy(col); b.core.material.emissive.copy(col); b.core.material.emissiveIntensity=(dark?.75:.4)*glow;
            b.halo.material.color.copy(col); b.halo.material.opacity=(dark?.5:.2)*Math.min(1.4,glow);
            b.word.material.opacity=u; b.word.visible=u>.02;
            b.g.scale.setScalar(.6+.4*easeIO(u)+(i===IT?.25*easeIO(seg(tt,S.turn[0],S.turn[1]))*fade:0));
            /* the share of each word, written above it */
            const wu=seg(tt,S.beams[0]+.6,S.beams[1])*(1-seg(tt,S.grid[0]-.6,S.grid[0]))*fade;
            if(wu>.02&&A[IT][i]>=.05){ b.wt.set(N(A[IT][i],3),[b.x,Y+.62+(i===BALL?.12:0),Z],{size:i===BALL?26:20,scale:SC,color:i===BALL?colors.s4:colors.ink2,bg:!dark}); if(b.wt.sp){ b.wt.sp.material.opacity=wu; } } else b.wt.hide(); });
          /* the query sweep */
          const sw=seg(tt,S.sweep[0],S.sweep[1]);
          if(sw>0&&sw<1){ const tip=lerp(-.5,n-.5,easeIO(sw)), tx=X0+tip*SP, a=[px(IT),Y+.2,Z], b=[tx,Y+.05,Z+.02];
            aimTube(THREE,qBeam,a,b); qBeam.visible=Math.abs(tx-px(IT))>.05; qBeam.material.opacity=(dark?.85:.7)*Math.sin(Math.PI*sw)**.3; qTip.position.set(...b); qTip.material.opacity=(dark?.95:.6)*Math.sin(Math.PI*sw)**.3; }
          else { qBeam.visible=false; qTip.material.opacity=0; }
          /* gold arcs grow, then fade when the landscape rises */
          const grow=easeIO(seg(tt,S.beams[0],S.beams[1])), arcFade=(1-seg(tt,S.grid[0]+1.6,S.grid[0]+3.2))*fade;
          arcs.forEach(a=>{ a.geo.setDrawRange(0,Math.floor(a.cnt*grow/6)*6); a.m.visible=grow>0&&arcFade>.01; a.m.material.opacity=(.12+.88*Math.sqrt(a.w))*arcFade;
            const f=seg(tt,S.flow[0],S.flow[1]); if(f>0&&f<1&&a.w>.001){ const p=a.curve.getPoint(1-easeIO(f)); a.pulse.position.copy(p); a.pulse.material.opacity=(dark?.95:.7)*Math.sin(Math.PI*f)**.4; } else a.pulse.material.opacity=0; });
          /* the landscape: rows rise one after another */
          pillars.forEach(p=>{ const u=easeIO(seg(tt,S.grid[0]+p.i*.28,S.grid[0]+p.i*.28+1.1))*fade; p.m.visible=u>.005; const hgt=Math.max(.02,p.w*PH)*u; p.m.scale.y=Math.max(1e-3,hgt); p.m.position.y=hgt/2;
            p.m.material.emissiveIntensity=(dark?.12+1.1*p.w:.05+.25*p.w)*(p.i===IT?1.35:1); });
          rowLabs.forEach((s,i)=>{ const u=seg(tt,S.grid[0]+i*.28,S.grid[0]+i*.28+.8)*fade; s.material.opacity=u; s.visible=u>.02; });
          /* camera: rise to look down on the landscape, then settle back (unless the reader has taken the camera) */
          if(ctx.orbit&&!ctx.userCam){ const up=easeIO(seg(tt,S.grid[0]-.4,S.grid[0]+2.4))*(1-easeIO(seg(tt,S.fade[0]-1.2,S.fade[1])));
            ctx.orbit.sph.phi=lerp(cam0.phi,.9,up); ctx.orbit.sph.theta=lerp(cam0.theta,wide?-.06:.04,up); ctx.orbit.sph.radius=lerp(R0.r,R0.r*(wide?.94:1.25),up); if(!wide) ctx.look.set(0,lerp(.35,.2,up),lerp(.2,-1.2,up)); ctx.orbit.place(); }
          /* HUD */
          let msg;
          if(tt<S.sweep[0]) msg='A sentence: nine words, nine vectors';
          else if(tt<S.beams[0]) msg='“it” sends its <b style="color:var(--s2)">query</b> to every word: <i>which of you is a thing?</i>';
          else if(tt<S.flow[0]) msg='Dot products, then softmax · “ball” gets <b>'+N(A[IT][BALL],3)+'</b>, each other word <b>'+N(A[IT][0],3)+'</b>';
          else if(tt<S.grid[0]-.3) msg='The <b style="color:var(--s3)">values</b> flow back · “it” now carries the ball';
          else msg='Every word asks every word at once · a <b>'+n+' × '+n+'</b> attention map';
          hudEl.innerHTML=msg;
        }
        ctx.hero={t0:null,tick(t){ applyOffset(); if(ctx.hero.t0==null) ctx.hero.t0=t; apply(window.U18HeroAt!=null?+window.U18HeroAt:(t-ctx.hero.t0)%T); return true; }};
        if(reduced){ apply(15.5); hudEl.innerHTML='Every word asks every word · “it” gives “ball” <b>'+N(A[IT][BALL],3)+'</b> of its attention'; }
        else apply(0);
        box.dataset.ready='1';
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.tick(t); }
    });
  }
  const HS=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(HS); rw=innerWidth; });
})();
