/* ================= OPENING SHOT · the widest street, then a straight cut up there is a curve down here ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced;
  const CX=3.2, CY=3.4, S=.52, P=x=>[(x[0]-CX)*S,(x[1]-CY)*S];
  const KEYS=[[0,16],[.22,78],[.45,26],[.66,58],[.84,43],[1,45]];           /* the tilt search, as (time share, degrees) */
  const tiltAt=u=>{ for(let i=1;i<KEYS.length;i++){ if(u<=KEYS[i][0]){ const a=KEYS[i-1],b=KEYS[i],v=(u-a[0])/(b[0]-a[0]); return a[1]+(b[1]-a[1])*easeIO(v); } } return 45; };
  const T_SEARCH=7.5, T_HOLD=2.6, T_SWAP=1.3, T_LIFT=3.0, T_CUT=2.4, T_HOLD2=3.4, T_BACK=1.8;
  /* the rings: inner blue, outer orange (seeded, so every reader sees the same picture) */
  const RINGS=(function(){ const rnd=seeded(13), pts=[];
    for(let i=0;i<14;i++){ const t=i/14*2*Math.PI+.2, r=.6+(rnd()-.5)*.12; pts.push({p:[r*Math.cos(t),r*Math.sin(t)],y:1}); }
    for(let i=0;i<22;i++){ const t=i/22*2*Math.PI, r=1.42+(rnd()-.5)*.14; pts.push({p:[r*Math.cos(t),r*Math.sin(t)],y:-1}); }
    return pts; })();
  const KZ=.55, R0=1.02, Z0=KZ*R0*R0;
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    const cam0={theta:.5,phi:.9,radius:wide?8.4:7.2}, look=[0,.25,0];
    const pos=[look[0]+cam0.radius*Math.sin(cam0.phi)*Math.sin(cam0.theta),look[1]+cam0.radius*Math.cos(cam0.phi),look[2]+cam0.radius*Math.sin(cam0.phi)*Math.cos(cam0.theta)];
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:0,camera:{pos,look,fov:wide?30:36},
      build(ctx){
        const {THREE,root,colors,isLight,camera,renderer}=ctx, hx=hxOf(ctx), dark=!isLight;
        let offW=0; const applyOffset=()=>{ const w=ctx.size.w, h=ctx.size.h; if(!wide||!w||w===offW) return; offW=w; camera.setViewOffset(w,h,-Math.round(w*.21),0,w,h); };
        applyOffset();
        starfield(ctx,480,22);
        { const top=new THREE.DirectionalLight(0xffffff,dark?.45:.25); top.position.set(2,8,3); root.add(top); }
        glassFloor(ctx,7.5,{div:30});
        /* ---- scene 1: the street ---- */
        const s1=new THREE.Group(); root.add(s1);
        const beads=D1.X.map((x,i)=>{ const b=bead3(ctx,M3(...P(x),.07),D1.y[i],{r:.075}); s1.add(b); return b; });
        const street=strip3(ctx,hx(K13.edge),dark?.26:.16); s1.add(street);
        const sideP=strip3(ctx,hx(K13.pos),dark?.09:.06), sideN=strip3(ctx,hx(K13.neg),dark?.09:.06); s1.add(sideP,sideN);
        const cLine=liveTube(ctx,hx('ink'),.016,.95), e1=liveTube(ctx,hx(K13.edge),.012,.95), e2=liveTube(ctx,hx(K13.edge),.012,.95); s1.add(cLine,e1,e2);
        const wArrow=CIN.prim.arrow(ctx,[0,.03,0],[.5,.03,0],hx(K13.w),{radius:.018,head:.14}); s1.add(wArrow);
        const touchR=[0,1,2].map(()=>{ const r=ring3(ctx,.15,{color:'ink2',tube:.008}); s1.add(r); return r; });
        const gold=[0,1,6].map(i=>{ const r=ring3(ctx,.17,{tube:.016}); const p=M3(...P(D1.X[i]),.012); r.position.set(...p); r.scale.setScalar(.01); r.visible=false; s1.add(r); const h=haloSprite(ctx,hx(K13.sv),.6); h.position.set(p[0],p[1]+.07,p[2]); h.visible=false; s1.add(h); return {r,h}; });
        const L=4.3;
        const setStreet=deg=>{ const st=streetAtTilt(D1.X,D1.y,deg), u=st.u, d=[-u[1],u[0]], wd=Math.max(0,st.width)*S;
          /* the street centre in scene coords: the data centre (CX, CY) moved onto the middle line */
          const k=st.mid-(u[0]*CX+u[1]*CY), cs=[k*u[0]*S,k*u[1]*S];
          street.userData.set(cs,u,wd,L,.004);
          const off=(wd/2+1.6); sideP.userData.set([cs[0]+u[0]*off,cs[1]+u[1]*off],u,3.2-0,L,.003); sideN.userData.set([cs[0]-u[0]*off,cs[1]-u[1]*off],u,3.2,L,.003);
          const seg=(o,m)=>{ const A=M3(cs[0]+u[0]*o-d[0]*L/2,cs[1]+u[1]*o-d[1]*L/2,.012), B=M3(cs[0]+u[0]*o+d[0]*L/2,cs[1]+u[1]*o+d[1]*L/2,.012); aimTube(THREE,m,A,B); };
          seg(0,cLine); seg(wd/2,e1); seg(-wd/2,e2);
          const a0=M3(cs[0]+d[0]*1.15,cs[1]+d[1]*1.15,.03), a1=M3(cs[0]+d[0]*1.15+u[0]*.55,cs[1]+d[1]*1.15+u[1]*.55,.03); wArrow.userData.set(new THREE.Vector3(...a0),new THREE.Vector3(...a1));
          touchR.forEach((r,j)=>{ const i=st.touch[j]; r.visible=i!=null; if(i!=null) r.position.set(...M3(...P(D1.X[i]),.012)); });
          return st; };
        /* ---- scene 2: rings, the bowl, the cut ---- */
        const s2=new THREE.Group(); root.add(s2); s2.visible=false;
        const rb=RINGS.map(q=>{ const b=bead3(ctx,M3(q.p[0],q.p[1],.07),q.y,{r:.07}); s2.add(b); return b; });
        const bowl=(function(){ const nr=26, na=72, Rm=1.62, pos=[], col=[], idx=[]; const c=colors;
          for(let i=0;i<=nr;i++) for(let j=0;j<=na;j++){ const r=Rm*i/nr, t=j/na*2*Math.PI, z=KZ*r*r; pos.push(r*Math.cos(t),z,-r*Math.sin(t));
            const K=new THREE.Color(CIN.ramp(z/(KZ*Rm*Rm),c.s1,c.s7,c.s2)); if(isLight) K.lerp(new THREE.Color(1,1,1),.35); K.convertSRGBToLinear(); col.push(K.r,K.g,K.b); }
          for(let i=0;i<nr;i++) for(let j=0;j<na;j++){ const a=i*(na+1)+j, b=a+na+1; idx.push(a,b,a+1,b,b+1,a+1); }
          const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals();
          const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:0,side:THREE.DoubleSide,roughness:.55,depthWrite:false}));
          const wf=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:isLight?0x0d1020:0xffffff,wireframe:true,transparent:true,opacity:0})); const G=new THREE.Group(); G.add(m,wf); G.userData={m,wf}; return G; })();
        s2.add(bowl);
        const cut=CIN.prim.glass(ctx,3.6,3.6,hx('ink2'),0); cut.rotation.x=-Math.PI/2; s2.add(cut);
        const cutEdge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.6,3.6)),new THREE.LineBasicMaterial({color:hx('ink2'),transparent:true,opacity:0,depthWrite:false})); cutEdge.rotation.x=-Math.PI/2; s2.add(cutEdge);
        const upRing=new THREE.Mesh(new THREE.TorusGeometry(R0,.022,10,96),new THREE.MeshStandardMaterial({color:hx('ink'),emissive:hx('ink'),emissiveIntensity:dark?1:.2,transparent:true,opacity:0,depthWrite:false})); upRing.renderOrder=6; upRing.rotation.x=Math.PI/2; upRing.position.y=Z0; s2.add(upRing);
        const floorRing=new THREE.Mesh(new THREE.TorusGeometry(R0,.026,10,96),new THREE.MeshStandardMaterial({color:hx('ink'),emissive:hx('ink'),emissiveIntensity:dark?1:.25,transparent:true,opacity:0,depthWrite:false})); floorRing.rotation.x=Math.PI/2; floorRing.position.y=.012; s2.add(floorRing);
        const floorGlow=new THREE.Mesh(new THREE.RingGeometry(R0-.09,R0+.09,96),new THREE.MeshBasicMaterial({color:hx(K13.edge),transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide})); floorGlow.rotation.x=-Math.PI/2; floorGlow.position.y=.008; s2.add(floorGlow);
        const drops=new THREE.Group(); s2.add(drops); for(let j=0;j<28;j++){ const t=j/28*2*Math.PI; const m=liveTube(ctx,hx('ink2'),.004,0); m.material.depthWrite=false; aimTube(THREE,m,[R0*Math.cos(t),.012,-R0*Math.sin(t)],[R0*Math.cos(t),Z0,-R0*Math.sin(t)]); drops.add(m); }
        const setOp=(o,v)=>o.traverse(m=>{ if(m.material&&m.material.transparent!==undefined){ m.material.transparent=true; if(m.userData.baseOp==null) m.userData.baseOp=m.material.opacity||1; m.material.opacity=m.userData.baseOp*v; } });
        const hudEl=hud(box,wide?'hud-r':''); hudEl.style.maxWidth='calc(100% - 1.4rem)'; if(fine) hint(box,'drag to orbit');
        const liftTo=u=>{ rb.forEach((b,i)=>{ const q=RINGS[i].p, r2=q[0]*q[0]+q[1]*q[1]; b.position.y=.07+KZ*r2*u; }); };
        /* timeline */
        let held=false; renderer.domElement.addEventListener('pointerdown',()=>{ held=true; });
        const st={phase:'street',t0:null,lit:false,from:null};
        const cur=()=>{ const s=ctx.orbit.sph; return {theta:s.theta,phi:s.phi,radius:s.radius}; };
        const CAM={street:{theta:.5,phi:.9,radius:cam0.radius},lift:{theta:.95,phi:1.1,radius:cam0.radius*1.06}};
        const drive=(to,e,bl)=>{ if(held||!ctx.orbit) return; const u=easeIO(Math.min(1,e/bl)), s=ctx.orbit.sph; ['theta','phi','radius'].forEach(k=>{ s[k]=st.from[k]+(to[k]-st.from[k])*u; }); ctx.orbit.place(); };
        const enter=(ph,t)=>{ st.phase=ph; st.t0=t; st.from=ctx.orbit?cur():null; box.dataset.phase=ph==='street'||ph==='hold'?'street':'lift'; };
        const showScene1=v=>{ s1.visible=v>0.001; setOp(s1,v); }, showScene2=v=>{ s2.visible=v>0.001; rb.forEach(b=>setOp(b,v)); };
        const resetS2=()=>{ liftTo(0); [upRing,floorRing,floorGlow,drops,cut,cutEdge].forEach(o=>{ o.visible=false; }); bowl.visible=false; bowl.userData.m.material.opacity=0; bowl.userData.wf.material.opacity=0; cut.material.opacity=0; cutEdge.material.opacity=0; upRing.material.opacity=0; floorRing.material.opacity=0; floorGlow.material.opacity=0; drops.children.forEach(m=>{ m.material.opacity=0; }); cut.position.y=Z0+1.4; cutEdge.position.y=Z0+1.4; };
        const goldPop=u=>{ gold.forEach(({r,h},k)=>{ const v=Math.max(0,Math.min(1,u*3-k*.5)); r.visible=v>0; h.visible=v>0; r.scale.setScalar(Math.max(.01,v<1?easeIO(v)*1.25:1)); h.material.opacity=(dark?.65:.3)*(1-Math.abs(v-.6)); }); };
        const cutState=(u)=>{ cut.visible=cutEdge.visible=u>.001; const yz=Z0+1.4*(1-easeIO(u)); cut.position.y=yz; cutEdge.position.y=yz; cut.material.opacity=(dark?.16:.14)*Math.min(1,u*2); cutEdge.material.opacity=.45*Math.min(1,u*2); };
        const circles=(v)=>{ [upRing,floorRing,floorGlow,drops].forEach(o=>{ o.visible=v>.001; }); upRing.material.opacity=v; floorRing.material.opacity=v; floorGlow.material.opacity=(dark?.28:.18)*v; drops.children.forEach(m=>{ m.material.opacity=.35*v; }); };
        resetS2(); setStreet(16); showScene1(1); showScene2(0); box.dataset.phase='street';
        ctx.hero={tick(t){ applyOffset(); if(!ctx.orbit) return true; if(st.t0==null){ st.t0=t; st.from=cur(); } const e=t-st.t0;
          if(st.phase==='street'){ const u=Math.min(1,e/T_SEARCH), deg=tiltAt(u), s=setStreet(deg);
            hudEl.innerHTML='Searching every tilt · street width <b>'+F(Math.max(0,s.width),2)+'</b>';
            drive(CAM.street,e,2); if(e>=T_SEARCH){ enter('hold',t); st.lit=false; } }
          else if(st.phase==='hold'){ setStreet(45); touchR.forEach(r=>{ r.visible=false; }); goldPop(Math.min(1,e/1.2));
            if(!st.lit){ st.lit=true; [0,1,6].forEach(i=>flare(ctx,M3(...P(D1.X[i]),.1),hx(K13.sv),900,1.0)); }
            hudEl.innerHTML='The widest street · width 2/‖w‖ = <b>2.83</b> · three points hold it up';
            if(e>=T_HOLD){ enter('swap',t); } }
          else if(st.phase==='swap'){ const u=Math.min(1,e/T_SWAP); showScene1(1-u); showScene2(u); hudEl.innerHTML='Now no straight line will do';
            if(e>=T_SWAP){ showScene1(0); goldPop(0); enter('lift',t); } }
          else if(st.phase==='lift'){ const u=Math.min(1,e/T_LIFT), v=easeIO(u); liftTo(v); bowl.visible=true; bowl.userData.m.material.opacity=(dark?.34:.4)*v; bowl.userData.wf.material.opacity=(dark?.06:.07)*v;
            hudEl.innerHTML='Lift every point by its squared distance, x₁² + x₂²'; drive(CAM.lift,e,2.6); if(e>=T_LIFT){ enter('cut',t); st.lit=false; } }
          else if(st.phase==='cut'){ const u=Math.min(1,e/T_CUT); cutState(u); const cv=Math.max(0,Math.min(1,(u-.7)/.3)); circles(cv);
            if(cv>0&&!st.lit){ st.lit=true; flare(ctx,[0,Z0,0],hx('ink'),1100,2.2); }
            hudEl.innerHTML='A flat cut up there <b>is</b> a circle down here'; if(e>=T_CUT){ enter('hold2',t); } }
          else if(st.phase==='hold2'){ hudEl.innerHTML='A straight cut up there is a curved rule down here'; if(e>=T_HOLD2){ enter('back',t); } }
          else { const u=Math.min(1,e/T_BACK), v=1-easeIO(u); liftTo(v); bowl.userData.m.material.opacity=(dark?.34:.4)*v; bowl.userData.wf.material.opacity=(dark?.06:.07)*v; cut.material.opacity=(dark?.16:.14)*v; cutEdge.material.opacity=.45*v; circles(v);
            if(u>.55){ const w=(u-.55)/.45; showScene2(1-w); showScene1(w); setStreet(16); touchR.forEach(r=>{ r.visible=w>.5; }); }
            drive(CAM.street,e,T_BACK); if(e>=T_BACK){ resetS2(); showScene2(0); showScene1(1); enter('street',t); } }
          return true; }};
        if(reduced){ showScene1(0); showScene2(1); liftTo(1); bowl.visible=true; bowl.userData.m.material.opacity=dark?.34:.4; bowl.userData.wf.material.opacity=dark?.06:.07; cutState(1); circles(1); box.dataset.phase='lift';
          hudEl.innerHTML='A straight cut up there is a curved rule down here'; }
        else hudEl.innerHTML='Searching every tilt';
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.tick(t); }
    });
  }
  const HS=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(HS); rw=innerWidth; });
})();
