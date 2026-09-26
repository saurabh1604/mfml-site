/* ================= OPENING SHOT · a memory rides the conveyor, blame comes back ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced;
  const WORDS=['the','train','to','Delhi','is','late'], NW=WORDS.length;
  const X=t=>-3.75+t*1.5, CY=.95, LOSSX=5.05, LANEY=2.35;
  const T=24;
  const W_S=t=>.5+1.15*t, W_D=.95;                                   /* forward schedule */
  const BF=[8.7,12.5], BX=[13.9,17.7], LN=[18.1,18.9], LB=[19.1,22.6];   /* back: fade, explode, lane rises, lane pulse */
  const FACT={fade:.5,expl:1.5,lane:.97};
  const cl=v=>Math.max(0,Math.min(1,v)), seg=(t,a,b)=>cl((t-a)/(b-a));
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    const look=[wide?.55:.9,wide?1.35:.75,0], cam0=wide?{theta:.3,phi:1.14,radius:20}:{theta:.78,phi:1.12,radius:11.8};
    const pos=[look[0]+cam0.radius*Math.sin(cam0.phi)*Math.sin(cam0.theta),look[1]+cam0.radius*Math.cos(cam0.phi),look[2]+cam0.radius*Math.sin(cam0.phi)*Math.cos(cam0.theta)];
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:0,camera:{pos,look,fov:wide?31:44},
      build(ctx){
        const {THREE,root,colors,isLight,camera}=ctx, hx=hxOf(ctx), dark=!isLight, SC=wide?.0086:.0078;
        let offW=0; const applyOffset=()=>{ const w=ctx.size.w, h=ctx.size.h; if(!wide||!w||w===offW) return; offW=w; camera.setViewOffset(w,h,-Math.round(w*.26),0,w,h); };
        applyOffset();
        starfield(ctx,560,24);
        { const top=new THREE.DirectionalLight(0xffffff,dark?.45:.25); top.position.set(2,8,4); root.add(top); }
        glassFloor(ctx,13,{div:52});
        const C={word:hx(K17.word),mem:hx(K17.mem),loss:critHex(),gate:hx(K17.gate),prob:hx(K17.prob),ink:hx('ink'),muted:hx('muted'),edge:hx(K17.edge)};
        /* ---- the conveyor belt: a glass slab with sliding light dashes ---- */
        const belt=new THREE.Mesh(new THREE.BoxGeometry(10.6,.1,1.25),new THREE.MeshStandardMaterial({color:dark?0x1a2340:0xe8ecf6,transparent:true,opacity:dark?.55:.7,roughness:.25,metalness:.2}));
        belt.position.set(.55,.34,0); root.add(belt);
        const rails=[-.64,.64].map(z=>{ const r=liveTube(ctx,C.edge,.02,.8); aimTube(THREE,r,[-4.75,.4,z],[5.85,.4,z]); root.add(r); return r; });
        const dashes=[]; for(let k=0;k<22;k++){ const d=new THREE.Mesh(new THREE.BoxGeometry(.22,.012,.9),new THREE.MeshBasicMaterial({color:C.edge,transparent:true,opacity:dark?.28:.22})); d.position.set(-4.6+k*.48,.4,0); root.add(d); dashes.push(d); }
        /* ---- six glass cells: the same cell, copied once per word ---- */
        const cells=WORDS.map((w,t)=>{ const g=new THREE.Group(); g.position.set(X(t),CY,0); root.add(g);
          const glass=new THREE.Mesh(new THREE.BoxGeometry(.92,.92,.92),new THREE.MeshStandardMaterial({color:dark?0xcfe0ff:0xffffff,transparent:true,opacity:dark?.10:.28,roughness:.05,metalness:.3,depthWrite:false}));
          const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.92,.92,.92)),new THREE.LineBasicMaterial({color:C.mem,transparent:true,opacity:dark?.55:.7}));
          g.add(glass,edges);
          const tag=lab(ctx,'h'+'₁₂₃₄₅₆'[t],[X(t),.62,.78],{size:18,scale:SC,color:colors.muted,bg:false}); root.add(tag);
          const word=slot(ctx,root); return {g,glass,edges,word}; });
        /* the loss crystal after the last word */
        const lossG=new THREE.Group(); lossG.position.set(LOSSX,CY,0); root.add(lossG);
        const lossM=new THREE.Mesh(new THREE.OctahedronGeometry(.2,0),new THREE.MeshStandardMaterial({color:C.loss,emissive:C.loss,emissiveIntensity:dark?.3:.1,flatShading:true,roughness:.25}));
        const lossH=haloSprite(ctx,C.loss,1.0); lossH.material.opacity=0; lossG.add(lossM,lossH);
        root.add(lab(ctx,'loss',[LOSSX,CY-.45,0],{size:17,scale:SC,color:cssv('critical'),bg:false}));
        /* ---- the memory orb ---- */
        const orb=new THREE.Mesh(new THREE.SphereGeometry(.2,32,22),new THREE.MeshStandardMaterial({color:C.mem,emissive:C.mem,emissiveIntensity:dark?1.1:.4,roughness:.25}));
        const orbH=haloSprite(ctx,C.mem,1.2); root.add(orb,orbH);
        const orbL=new THREE.PointLight(C.mem,dark?1.6:0,3); root.add(orbL);
        const trail=[]; for(let k=0;k<10;k++){ const s=haloSprite(ctx,C.mem,.3); s.material.opacity=0; root.add(s); trail.push(s); }
        const HUES=[C.mem,C.edge,C.word,C.prob,C.gate,C.mem].map(h=>new THREE.Color(h));
        const colAt=t=>{ const k=Math.max(0,Math.min(NW-1,t)); const a=Math.floor(k), b=Math.min(NW-1,a+1), u=k-a; return new THREE.Color(C.mem).lerp(HUES[a].clone().lerp(HUES[b],u),.55); };
        /* ---- the red blame pulse ---- */
        const pulse=haloSprite(ctx,C.loss,1); pulse.material.opacity=0; root.add(pulse);
        const pCore=new THREE.Mesh(new THREE.SphereGeometry(.1,20,14),new THREE.MeshStandardMaterial({color:C.loss,emissive:C.loss,emissiveIntensity:dark?1.2:.5})); pCore.visible=false; root.add(pCore);
        const factorTags=[], valTags=[]; for(let t=0;t<NW;t++){ factorTags.push(slot(ctx,root)); valTags.push(slot(ctx,root)); }
        const switchTag=slot(ctx,root);
        /* ---- the LSTM express lane: a gold rail with a forget-gate ring over each cell ---- */
        const lane=new THREE.Group(); root.add(lane);
        const rail=liveTube(ctx,C.gate,.045,.95); aimTube(THREE,rail,[X(0)-.6,LANEY,0],[LOSSX,LANEY,0]); lane.add(rail);
        const railH=liveTube(ctx,C.gate,.13,dark?.18:.12); railH.material.depthWrite=false; aimTube(THREE,railH,[X(0)-.6,LANEY,0],[LOSSX,LANEY,0]); lane.add(railH);
        const rings=WORDS.map((_,t)=>{ const r=new THREE.Mesh(new THREE.TorusGeometry(.2,.022,10,40),new THREE.MeshStandardMaterial({color:C.gate,emissive:C.gate,emissiveIntensity:dark?.9:.35,transparent:true})); r.position.set(X(t),LANEY,0); r.rotation.y=Math.PI/2; lane.add(r);
          const stem=liveTube(ctx,C.gate,.012,.5); aimTube(THREE,stem,[X(t),CY+.47,0],[X(t),LANEY-.2,0]); lane.add(stem); return r; });
        { const stem=liveTube(ctx,C.gate,.012,.5); aimTube(THREE,stem,[LOSSX,CY+.22,0],[LOSSX,LANEY,0]); lane.add(stem); }
        const laneLab=lab(ctx,'LSTM express lane · × f each step',[.2,LANEY+.42,0],{size:19,scale:SC,color:colors.s4,bg:!dark}); lane.add(laneLab);
        const hudEl=hud(box,wide?'hud-r':''); hudEl.style.maxWidth='calc(100% - 1.4rem)';
        if(fine) hint(box,'drag to orbit');
        const lerp=(a,b,u)=>a+(b-a)*u;
        const setLane=(u)=>{ lane.visible=u>.01; lane.position.y=-1.1*(1-u); lane.traverse(m=>{ if(m.material){ m.material.transparent=true; if(m.userData.op==null) m.userData.op=m.material.opacity; m.material.opacity=m.userData.op*u; } }); };
        /* the pulse runs from the loss back through the cells; returns the size where it is */
        function runBack(tt,win,factor,y,kind){ const [a,b]=win, hops=NW, u=seg(tt,a,b);
          if(u<=0||u>=1) return null;
          const f=u*hops, k=Math.min(hops-1,Math.floor(f)), v=f-k;      /* hop k: from position (hops−k) to (hops−k−1) */
          const xFrom=k===0?LOSSX:X(NW-k), xTo=X(NW-1-k), size0=Math.pow(factor,Math.max(0,k-1)), size1=Math.pow(factor,k);   /* the loss hands 1 to the last note; then one factor per word */
          const e=easeIO(v); return {x:lerp(xFrom,xTo,e),y,size:lerp(size0,size1,e),k,v}; }
        function apply(tt){
          const fade=1-seg(tt,T-.8,T);
          /* dashes slide while the note is travelling forward */
          const moving=tt<W_S(NW-1)+W_D; dashes.forEach((d,k)=>{ const x=-4.6+((k*.48+(moving?tt*.9:W_S(NW-1)*.9))%10.56); d.position.x=x; });
          /* words fall into their cells */
          let tNote=-1;
          WORDS.forEach((w,t)=>{ const u=seg(tt,W_S(t),W_S(t)+.45), y=lerp(3.4,CY+.72,easeIO(u));
            cells[t].word.set(w,[X(t),y,0],{size:30,weight:700,scale:SC,color:colors.s1,bg:true});
            if(cells[t].word.sp){ cells[t].word.sp.material.opacity=(u>0?Math.min(1,u*2):0)*fade*(tt>W_S(t)+1.4?.8:1); cells[t].word.sp.visible=u>0; }
            const lit=seg(tt,W_S(t)+.4,W_S(t)+.7)*(1-.55*seg(tt,W_S(t)+1.1,W_S(t)+1.6));
            cells[t].edges.material.opacity=((dark?.35:.5)+.6*lit)*fade; cells[t].glass.material.opacity=(dark?.08:.24)+.18*lit;
            if(tt>=W_S(t)) tNote=t; });
          /* the orb: rides from cell t−1 to cell t as word t lands */
          let ox=X(0)-1.2, oc=0, oy=CY;
          if(tNote>=0){ const t=tNote, u=easeIO(seg(tt,W_S(t)+.15,W_S(t)+.75)); ox=lerp(t===0?X(0)-1.2:X(t-1),X(t),u); oy=CY+.28*Math.sin(Math.PI*u); oc=t-1+u; }
          const orbOn=seg(tt,.2,.6)*fade;
          const col=colAt(Math.max(0,oc)); orb.material.color.copy(col); orb.material.emissive.copy(col); orbH.material.color.copy(col); orbL.color.copy(col);
          orb.position.set(ox,oy,0); orbH.position.copy(orb.position); orbL.position.set(ox,oy+.3,.3);
          orb.scale.setScalar(Math.max(.01,orbOn)); orbH.material.opacity=(dark?.7:.3)*orbOn; orbL.intensity=(dark?1.6:0)*orbOn;
          trail.forEach((s,k)=>{ const back=(k+1)*.07, t2=Math.max(0,tt-back); let tx=ox; if(tNote>=0){ const t=tNote, u=easeIO(seg(t2,W_S(t)+.15,W_S(t)+.75)); tx=lerp(t===0?X(0)-1.2:X(t-1),X(t),u); } s.position.set(tx,CY,0); s.material.color.copy(col); s.material.opacity=moving&&tNote>=0?(dark?.22:.1)*(1-k/10)*orbOn:0; });
          /* the loss lights up when the last note arrives */
          const lossLit=seg(tt,W_S(NW-1)+.8,W_S(NW-1)+1.2)*fade; lossM.material.emissiveIntensity=(dark?.3:.1)+(dark?1.2:.4)*lossLit; lossH.material.opacity=(dark?.45:.2)*lossLit;
          /* blame: fading run, then exploding run along the belt, then the lane */
          const r1=runBack(tt,BF,FACT.fade,CY,'fade'), r2=runBack(tt,BX,FACT.expl,CY,'expl'), r3=runBack(tt,LB,FACT.lane,LANEY,'lane');
          const r=r1||r2||r3;
          if(r){ const k=r3?.55+.55*r.size:r2?.32+.3*r.size:.28+.95*r.size; pulse.position.set(r.x,r.y,.02); pulse.scale.setScalar(k*1.25); pulse.material.opacity=(dark?.95:.6); pCore.visible=true; pCore.position.set(r.x,r.y,0); pCore.scale.setScalar(Math.max(.35,Math.min(3.2,k*1.6))); }
          else { pulse.material.opacity=0; pCore.visible=false; }
          /* size tags left behind at each cell */
          const tagRun=(tt>=BF[0]&&tt<BX[0]-.2)?['fade',BF,FACT.fade,CY]:(tt>=BX[0]&&tt<LN[0])?['expl',BX,FACT.expl,CY]:(tt>=LB[0])?['lane',LB,FACT.lane,LANEY]:null;
          for(let t=0;t<NW;t++){ const vt=valTags[t], ft=factorTags[t];
            if(!tagRun){ vt.hide(); ft.hide(); continue; }
            const [kind,win,fac,y]=tagRun, hopDone=seg(tt,win[0],win[1])*NW, need=NW-t;   /* cell t is reached after hop number need */
            if(hopDone>=need-.02){ const val=Math.pow(fac,need-1), txt=kind==='expl'?N(val,1):N(val,val<.1?3:2);
              vt.set(txt,kind==='lane'?[X(t)+.42,y+.42,0]:[X(t),.25,1.05],{size:27,weight:800,scale:SC,color:kind==='lane'?colors.s4:cssv('critical'),bg:true});
              if(vt.sp){ vt.sp.material.opacity=fade; } }
            else vt.hide();
            if(t===NW-2&&hopDone>1.2&&hopDone<2.6){ ft.set('× '+N(fac,2)+' each step',kind==='lane'?[(X(t)+X(t+1))/2,y+.5,.3]:[LOSSX-.2,CY+1.3,0],{size:24,weight:800,scale:SC,color:kind==='lane'?colors.s4:cssv('critical'),bg:!dark}); } else ft.hide(); }
          /* the switch */
          const sw=seg(tt,BX[0]-1.1,BX[0]-.4);
          if(tt>BX[0]-1.2&&tt<LN[0]){ switchTag.set(sw<.5?'switch · w = 0.5':'switch · w = 1.5',[X(2)+.75,CY+1.55,0],{size:26,weight:800,scale:SC,color:sw<.5?colors.s3:cssv('critical'),bg:true}); } else switchTag.hide();
          /* the lane rises */
          const lu=tt>=LN[0]?easeIO(seg(tt,LN[0],LN[1]))*fade:0; setLane(lu);
          rings.forEach((rg,t)=>{ const hopDone=seg(tt,LB[0],LB[1])*NW, hit=hopDone>=NW-t-.15&&hopDone<NW-t+.6; rg.scale.setScalar(hit?1.35:1); rg.material.emissiveIntensity=(dark?.9:.35)+(hit?1.4:0); rg.lookAt(camera.position.x,rg.position.y,camera.position.z); });
          /* HUD */
          let msg;
          if(tt<W_S(0)) msg='A sentence arrives, one word at a time';
          else if(tt<W_S(NW-1)+W_D) msg='Forward · the <b>same cell</b> reads word '+(tNote+1)+', <b>'+WORDS[Math.max(0,tNote)]+'</b>, and updates the one note it carries';
          else if(tt<BF[0]) msg='The note has read the whole sentence · now the <b>blame</b> comes back';
          else if(tt<BX[0]-1.2) msg='Backward, w = 0.5 · the blame <b>halves</b> at every word: 1 → <b>'+N(Math.pow(.5,NW-1),3)+'</b> — memory <b>fades</b>';
          else if(tt<LN[0]) msg='Backward, w = 1.5 · the blame <b>grows</b> at every word: 1 → <b>'+N(Math.pow(1.5,NW-1),1)+'</b> — it <b>explodes</b>';
          else msg='The LSTM express lane · × f = 0.97 per word: 1 → <b>'+N(Math.pow(.97,NW-1),2)+'</b> — memory <b>survives</b>';
          hudEl.innerHTML=msg;
        }
        ctx.hero={t0:null,tick(t){ applyOffset(); if(ctx.hero.t0==null) ctx.hero.t0=t; apply(window.U17HeroAt!=null?+window.U17HeroAt:(t-ctx.hero.t0)%T); return true; }};
        if(reduced){ apply(21.9); hudEl.innerHTML='Blame back through six words · plain cell ×0.5: <b>0.031</b> · ×1.5: <b>7.6</b> · LSTM lane ×0.97: <b>0.86</b>'; }
        else apply(0);
        box.dataset.ready='1';
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.tick(t); }
    });
  }
  const HS=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(HS); rw=innerWidth; });
})();
