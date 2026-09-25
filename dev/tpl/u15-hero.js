/* ================= OPENING SHOT · values go right, blame comes back ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced;
  const G1=netBackward(SAL,SAL_X,SAL_Y), NET2=netStep(SAL,G1,1e-5), G2=netBackward(NET2,SAL_X,SAL_Y);
  const SIZES=[2,3,2,1], LX=[-2.45,-.9,.65,2.15], HY=1.35, SP=1.12;
  const nodePos=(l,i)=>{ const n=SIZES[l]; return [LX[l], HY+((n-1)/2-i)*SP, (i-(n-1)/2)*.34]; };
  const LOSS=[3.3,HY,0], GX=4.3, GY0=.18, GH=2.4, gy=v=>GY0+GH*Math.max(0,Math.min(62,v))/60;
  const T=18;
  /* the schedule (seconds into the loop) */
  const W1S=[.6,2.3,3.8], W1D=1.0, W2S=[12.3,13.0,13.7], W2D=.62;
  const B_S=[[6.6,7.1],[7.3,8.2],[8.5,9.4],[9.8,10.7]], UPD=[11.2,12.1];
  const cl=v=>Math.max(0,Math.min(1,v)), seg=(t,a,b)=>cl((t-a)/(b-a));
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    const look=[wide?1.0:.95,1.2,0], cam0={theta:.22,phi:1.2,radius:wide?16.2:10.4};
    const pos=[look[0]+cam0.radius*Math.sin(cam0.phi)*Math.sin(cam0.theta),look[1]+cam0.radius*Math.cos(cam0.phi),look[2]+cam0.radius*Math.sin(cam0.phi)*Math.cos(cam0.theta)];
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:0,camera:{pos,look,fov:wide?30:40},
      build(ctx){
        const {THREE,root,colors,isLight,camera}=ctx, hx=hxOf(ctx), dark=!isLight, SC=wide?.0082:.0072;
        let offW=0; const applyOffset=()=>{ const w=ctx.size.w, h=ctx.size.h; if(!wide||!w||w===offW) return; offW=w; camera.setViewOffset(w,h,-Math.round(w*.27),0,w,h); };
        applyOffset();
        starfield(ctx,520,24);
        { const top=new THREE.DirectionalLight(0xffffff,dark?.4:.25); top.position.set(2,8,3); root.add(top); }
        glassFloor(ctx,11,{div:44});
        const C={fwd:hx(K15.fwd),bwd:hx(K15.bwd),pos:hx(K15.pos),neg:hx(K15.neg),awake:hx(K15.awake),grey:hx('muted'),ink:hx('ink'),acc:hx(K15.accent)};
        /* ---- nodes: a glass shell, a core that fills with light, a halo, an awake ring ---- */
        const nodes=SIZES.map((n,l)=>Array.from({length:n},(_,i)=>{ const g=new THREE.Group(); g.position.set(...nodePos(l,i)); root.add(g);
          const shell=new THREE.Mesh(new THREE.SphereGeometry(.23,32,22),new THREE.MeshStandardMaterial({color:dark?0xdfe8ff:0xffffff,transparent:true,opacity:dark?.16:.35,roughness:.08,metalness:.2,depthWrite:false}));
          const core=new THREE.Mesh(new THREE.SphereGeometry(.14,26,18),new THREE.MeshStandardMaterial({color:C.grey,emissive:C.fwd,emissiveIntensity:0,roughness:.3,transparent:true,opacity:.95}));
          const halo=haloSprite(ctx,C.fwd,1.0); halo.material.opacity=0;
          const ring=new THREE.Mesh(new THREE.TorusGeometry(.3,.012,10,56),new THREE.MeshStandardMaterial({color:C.awake,emissive:C.awake,emissiveIntensity:dark?.9:.3,transparent:true,opacity:0,depthWrite:false}));
          ring.rotation.y=Math.PI/2*.0; g.add(shell,core,halo,ring);
          const val=slot(ctx,root), grad=slot(ctx,root); return {g,shell,core,halo,ring,val,grad,l,i,p:nodePos(l,i)}; }));
        /* the loss node: a red crystal */
        const lossG=new THREE.Group(); lossG.position.set(...LOSS); root.add(lossG);
        const lossM=new THREE.Mesh(new THREE.OctahedronGeometry(.2,0),new THREE.MeshStandardMaterial({color:C.bwd,emissive:C.bwd,emissiveIntensity:dark?.25:.1,roughness:.25,flatShading:true,transparent:true,opacity:.9}));
        const lossH=haloSprite(ctx,C.bwd,1.1); lossH.material.opacity=0; lossG.add(lossM,lossH); const lossLab=slot(ctx,root);
        /* the gauge: a glass column, the true salary as a ring, the prediction as a blue bead */
        const col=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,GH,32,1,true),new THREE.MeshStandardMaterial({color:dark?0xcfe0ff:0xffffff,transparent:true,opacity:dark?.10:.3,roughness:.1,side:THREE.DoubleSide,depthWrite:false}));
        col.position.set(GX,GY0+GH/2,0); root.add(col);
        [0,10,20,30,40,50,60].forEach(v=>{ const t=new THREE.Mesh(new THREE.TorusGeometry(.135,.003,6,40),new THREE.MeshBasicMaterial({color:hx('ink2'),transparent:true,opacity:.25})); t.rotation.x=Math.PI/2; t.position.set(GX,gy(v),0); root.add(t); });
        const target=new THREE.Mesh(new THREE.TorusGeometry(.2,.018,12,64),new THREE.MeshStandardMaterial({color:C.ink,emissive:C.ink,emissiveIntensity:dark?.8:.1})); target.rotation.x=Math.PI/2; target.position.set(GX,gy(50),0); root.add(target);
        root.add(lab(ctx,'true salary 50',[GX,gy(50)+.34,0],{size:20,scale:SC,color:colors.ink,bg:!dark}));
        const bead=CIN.prim.dot(ctx,[GX,gy(0),0],C.fwd,.1); root.add(bead); const beadH=haloSprite(ctx,C.fwd,.7); root.add(beadH); const beadLab=slot(ctx,root);
        const fill=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1,20),new THREE.MeshStandardMaterial({color:C.fwd,emissive:C.fwd,emissiveIntensity:dark?.7:.2,transparent:true,opacity:.55})); root.add(fill);
        /* ---- edges: sign colour, thickness ∝ |w|, a red "blame skin" on top, a travelling pulse ---- */
        const edges=[];
        SAL.W.forEach((W,l)=>W.forEach((row,j)=>row.forEach((w,k)=>{ const A=nodes[l][k].p, B=nodes[l+1][j].p; const d=[B[0]-A[0],B[1]-A[1],B[2]-A[2]], L=Math.hypot(...d), u=d.map(x=>x/L);
          const a0=A.map((x,m)=>x+u[m]*.24), b0=B.map((x,m)=>x-u[m]*.24);
          const r=.006+.017*Math.min(1,Math.sqrt(Math.abs(w))/2);
          const m=liveTube(ctx,w>=0?C.pos:C.neg,r,dark?.75:.85); aimTube(THREE,m,a0,b0); root.add(m);
          const skin=liveTube(ctx,C.bwd,r*1.9+.006,0); skin.material.depthWrite=false; aimTube(THREE,skin,a0,b0); root.add(skin);
          const pulse=haloSprite(ctx,C.fwd,.5); pulse.material.opacity=0; root.add(pulse);
          edges.push({l,j,k,w,r,m,skin,pulse,a0,b0}); })));
        /* the output → loss wire */
        const lw=liveTube(ctx,hx('ink2'),.008,.45); const oA=nodes[3][0].p, la0=[oA[0]+.24,oA[1],oA[2]], lb0=[LOSS[0]-.2,LOSS[1],LOSS[2]]; aimTube(THREE,lw,la0,lb0); root.add(lw);
        const lpulse=haloSprite(ctx,C.fwd,.5); lpulse.material.opacity=0; root.add(lpulse);
        /* layer captions on the floor */
        [['input',0],['hidden · 3',1],['hidden · 2',2],['output',3]].forEach(([t,l])=>root.add(lab(ctx,t,[LX[l],HY+2.05,0],{size:17,scale:SC,color:colors.muted,bg:false})));
        const hudEl=hud(box,wide?'hud-r':''); hudEl.style.maxWidth='calc(100% - 1.4rem)';
        if(fine) hint(box,'drag to orbit');
        const lerp=(a,b,u)=>a+(b-a)*u;
        const aVal=(G,l,i)=>G.cache[l].a[i], zVal=(G,l,i)=>G.cache[l].z?G.cache[l].z[i]:G.cache[l].a[i];
        const lblV=(n,text,op,color)=>{ n.val.set(text,[n.p[0],n.p[1]+.43,n.p[2]],{size:24,scale:SC,color:color||colors.s1,bg:!dark}); if(n.val.sp){ n.val.sp.material.opacity=op; n.val.sp.visible=op>.02; } };
        const lblG=(n,text,op)=>{ n.grad.set(text,[n.p[0],n.p[1]-.44,n.p[2]],{size:21,scale:SC,color:cssv('critical'),bg:!dark}); if(n.grad.sp){ n.grad.sp.material.opacity=op; n.grad.sp.visible=op>.02; } };
        const sleepy=nodes[1][2];
        function apply(tt){
          /* which forward wave is showing */
          const wave2=tt>=W2S[0], G=wave2?G2:G1, S=wave2?W2S:W1S, D=wave2?W2D:W1D, fade=1-seg(tt,T-.6,T);
          /* nodes */
          nodes.forEach((layer,l)=>layer.forEach(n=>{ let lit;
            if(l===0) lit=wave2?1:seg(tt,.1,.5); else lit=wave2?seg(tt,S[l-1]+D,S[l-1]+D+.25)*1+(1-seg(tt,S[0]-.3,S[0]))*0:seg(tt,S[l-1]+D,S[l-1]+D+.3);
            if(wave2&&l>0){ const done=seg(tt,S[l-1]+D,S[l-1]+D+.25); lit=Math.max(done,.55); }
            const v=aVal(G,l,n.i), z=zVal(G,l,n.i), asleep=l>0&&l<3&&z<=0;
            const sleepU=(n===sleepy)?(wave2?1:seg(tt,2.05,2.5)):0;
            const mag=l===0?.75:Math.min(1,.35+Math.abs(v)/12);
            const colr=(n===sleepy)?new THREE.Color(C.fwd).lerp(new THREE.Color(C.grey),sleepU):new THREE.Color(C.fwd);
            n.core.material.emissive.copy(colr); n.core.material.emissiveIntensity=(dark?1.3:.55)*lit*mag*(1-.85*sleepU)*fade;
            n.core.material.color.copy(new THREE.Color(C.grey).lerp(colr,lit*(1-sleepU)));
            n.halo.material.color.copy(colr); n.halo.material.opacity=(dark?.55:.25)*lit*mag*(1-.9*sleepU)*fade;
            n.ring.material.opacity=(l===1||l===2)&&!asleep?lit*.9*fade:0; n.ring.lookAt(camera.position);
            let txt=l===0?(n.i===0?'age 30':'exp 10'):N(v,2);
            if(n===sleepy) txt=sleepU>.5?'0 · asleep':'−2';
            if(l===3) txt='ŷ = '+N(v,2);
            lblV(n,txt,lit*fade,n===sleepy&&sleepU>.5?colors.muted:null);
          }));
          /* forward pulses */
          edges.forEach(e=>{ const u=seg(tt,S[e.l],S[e.l]+D), aPrev=aVal(G,e.l,e.k), carry=Math.abs(e.w*aPrev);
            const on=u>0&&u<1&&carry>1e-9; e.pulse.material.color.setHex(C.fwd);
            if(on){ e.pulse.position.set(lerp(e.a0[0],e.b0[0],u),lerp(e.a0[1],e.b0[1],u),lerp(e.a0[2],e.b0[2],u)); const s=.22+.3*Math.min(1,Math.sqrt(carry)/4); e.pulse.scale.setScalar(s); e.pulse.material.opacity=(dark?.95:.6)*Math.sin(Math.PI*u)**.5; }
            else e.pulse.material.opacity=0; });
          /* output → loss */
          const lf=seg(tt,S[2]+D,S[2]+D+.5), L0=wave2?G2.loss:G1.loss;
          let lu=lf>0&&lf<1?lf:-1, lcol=C.fwd;
          const bl=seg(tt,B_S[0][0],B_S[0][1]); if(!wave2&&bl>0&&bl<1){ lu=1-bl; lcol=C.bwd; }
          if(lu>=0){ lpulse.material.color.setHex(lcol); lpulse.position.set(lerp(la0[0],lb0[0],lu),lerp(la0[1],lb0[1],lu),lerp(la0[2],lb0[2],lu)); lpulse.scale.setScalar(.45); lpulse.material.opacity=(dark?.95:.6); } else lpulse.material.opacity=0;
          const lossLit=wave2?1:lf; lossM.material.emissiveIntensity=(dark?.25:.08)+(dark?1.1:.4)*lossLit*fade; lossH.material.opacity=(dark?.5:.2)*lossLit*fade;
          let lossShown=G1.loss; if(wave2) lossShown=lerp(G1.loss,G2.loss,easeIO(seg(tt,S[2]+D,S[2]+D+.9)));
          lossLab.set('loss '+N(lossShown,2),[LOSS[0],LOSS[1]-.44,LOSS[2]],{size:23,scale:SC,color:cssv('critical'),bg:!dark}); if(lossLab.sp){ lossLab.sp.material.opacity=lossLit*fade; lossLab.sp.visible=lossLit>.02; }
          /* the gauge */
          let yv=0; if(!wave2) yv=lerp(0,G1.yhat[0],easeIO(seg(tt,S[2]+D,S[2]+D+.6))); else yv=lerp(G1.yhat[0],G2.yhat[0],easeIO(seg(tt,S[2]+D,S[2]+D+.8)));
          yv*=fade; bead.position.set(GX,gy(yv),0); beadH.position.copy(bead.position); beadH.material.opacity=(dark?.6:.25)*(yv>0.5?1:0);
          fill.position.set(GX,(GY0+gy(yv))/2,0); fill.scale.y=Math.max(1e-3,gy(yv)-GY0); fill.visible=yv>.3;
          beadLab.set(yv>.5?'ŷ '+N(yv,2):'',[GX-.7,gy(yv)+.05,0],{size:21,scale:SC,color:colors.s1,bg:!dark});
          /* backward: gradient labels and red pulses */
          const bOn=!wave2&&tt>=B_S[0][0], gradFade=wave2?1-seg(tt,S[0],S[0]+.5):1;
          const gShow=[null,seg(tt,B_S[3][0]-.3,B_S[2][1]+.2),seg(tt,B_S[2][0]-.2,B_S[1][1]+.2),seg(tt,B_S[0][1],B_S[0][1]+.25)];
          nodes.forEach((layer,l)=>layer.forEach(n=>{ if(l===0){ lblG(n,'',0); return; }
            const g=G1.dZ[l][n.i], gA=G1.dA[l][n.i]; let op=tt>=B_S[0][0]?gShow[l]*gradFade*fade:0; if(tt>=W2S[0]+.6) op=0;
            let t='∂L/∂z '+N(g,2);
            if(n===sleepy){ const blocked=seg(tt,B_S[2][1],B_S[2][1]+.35); t=blocked<.5?'−20 arrives':'−20 blocked → 0'; }
            lblG(n,t,op); }));
          edges.forEach(e=>{ const u=seg(tt,B_S[3-e.l][0],B_S[3-e.l][1]); const blame=Math.abs(G1.dZ[e.l+1][e.j]*e.w);   /* what travels back along this wire */
            const on=bOn&&u>0&&u<1&&blame>1e-9;
            if(on){ e.pulse.material.color.setHex(C.bwd); e.pulse.position.set(lerp(e.b0[0],e.a0[0],u),lerp(e.b0[1],e.a0[1],u),lerp(e.b0[2],e.a0[2],u)); e.pulse.scale.setScalar(.22+.3*Math.min(1,Math.sqrt(blame)/6)); e.pulse.material.opacity=(dark?.95:.65)*Math.sin(Math.PI*u)**.5; }
            /* the wire's own gradient ∂L/∂w flashes red once the blame has crossed it; the update rinses it gold */
            const gw=Math.abs(G1.dW[e.l+1][e.j][e.k]), strength=gw>0?Math.min(1,.25+Math.log10(1+gw)/3.4):0;
            const crossed=bOn||(tt>=B_S[0][0]&&tt<W2S[0]) ? seg(tt,B_S[3-e.l][1]-.2,B_S[3-e.l][1]+.2) : 0;
            const rinse=seg(tt,UPD[0],UPD[1]); const flash=crossed*(1-rinse)*strength;
            e.skin.material.opacity=(dark?.55:.45)*flash*fade; e.skin.material.color.setHex(C.bwd); e.skin.material.emissive.setHex(C.bwd);
            const up=Math.sin(Math.PI*rinse)*(gw>0?1:0);
            e.m.material.emissive.setHex(up>.05?C.awake:(e.w>=0?C.pos:C.neg)); e.m.material.color.setHex(up>.05?C.awake:(e.w>=0?C.pos:C.neg));
            e.m.scale.x=e.m.scale.z=1+1.4*up; e.m.material.emissiveIntensity=(dark?.8:.25)+1.2*up; e.m.material.opacity=(dark?.75:.85)*fade; });
          /* the sleeping neuron's block: a grey spark */
          const blk=seg(tt,B_S[2][1],B_S[2][1]+.5); sleepy.shell.material.opacity=(dark?.16:.35)+(blk>0&&blk<1?.5*Math.sin(Math.PI*blk):0);
          /* HUD */
          let msg;
          if(tt<S[0]) msg='Age 30 and experience 10 go in';
          else if(!wave2&&tt<B_S[0][0]) msg=tt<2.9?'Forward · the third neuron got −2, so ReLU puts it to <b>sleep</b>':'Forward · prediction ŷ = <b>'+N(G1.yhat[0])+'</b>, true salary 50 · loss <b>'+N(G1.loss)+'</b>';
          else if(tt<UPD[0]) msg=tt<B_S[2][1]?'Backward · the blame −10 splits by the weights: <b>−40</b> and <b>−20</b>':'Backward · the −20 is <b>blocked</b> at the sleeping neuron';
          else if(tt<W2S[0]) msg='Update · every weight takes a small step against its blame';
          else msg='Forward again · ŷ = <b>'+N(G2.yhat[0],2)+'</b> · loss 50 → <b>'+N(G2.loss,2)+'</b>';
          hudEl.innerHTML=msg;
        }
        ctx.hero={t0:null,tick(t){ applyOffset(); if(ctx.hero.t0==null) ctx.hero.t0=t; apply(window.U15HeroAt!=null?+window.U15HeroAt:(t-ctx.hero.t0)%T); return true; }};
        if(reduced){ apply(16.4); hudEl.innerHTML='Values go right, blame comes back · loss 50 → <b>'+N(G2.loss,2)+'</b> after one step'; }
        else apply(0);
        box.dataset.ready='1';
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.tick(t); }
    });
  }
  const HS=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(HS); rw=innerWidth; });
})();
