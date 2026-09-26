/* ================= OPENING SHOT · a word is where it lives ================= */
(function(){
  const box=document.getElementById('hero-3d'); if(!box||!CIN) return;
  const reduced=CIN.reduced, T=16;
  /* the words: scattered start → home (hand-placed for the picture; not trained) */
  const TEA=[['chai',[2.15,1.7,.3]],['coffee',[3.25,1.3,-.1]],['milk',[2.4,.85,-.3]],['cup',[2.95,2.15,.2]],['sugar',[1.4,1.2,-.1]]];
  const CRI=[['bat',[2.55,-.95,.5]],['wicket',[3.45,-.65,-.2]],['over',[2.1,-1.8,-.25]],['six',[3.2,-1.75,.35]],['ball',[1.65,-.7,.2]]];
  const MAN=[-1.35,-.35,.55], D=[.75,-.95,.62], KING=[-1.05,1.3,.15], ERR=[.07,.06,-.06];
  const WOMAN=MAN.map((x,i)=>x+D[i]), QUEEN=KING.map((x,i)=>x+D[i]+ERR[i]);
  const PEOPLE=[['man',MAN],['woman',WOMAN],['king',KING],['queen',QUEEN]];
  const r=rng16(7), scat=()=>[(r()*2-1)*3.6+.6,(r()*2-1)*2.1+.2,(r()*2-1)*1.8];
  const WORDS=[...TEA.map(([w,p])=>({w,home:p,from:scat(),g:'tea'})),...CRI.map(([w,p])=>({w,home:p,from:scat(),g:'cricket'})),...PEOPLE.map(([w,p])=>({w,home:p,from:p,g:'people'}))];
  const LOFF={queen:[.66,.02],woman:[.05,-.34],man:[-.42,.05],king:[-.1,.32]};
  const cl=v=>Math.max(0,Math.min(1,v)), seg=(t,a,b)=>cl((t-a)/(b-a)), E=CIN.ease.inOut, lerp=(a,b,u)=>a.map((x,i)=>x+(b[i]-x)*u);
  function build(){
    const wide=innerWidth>=760, fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    const look=[wide?.75:1.0,wide?.15:-.05,0], cam0={theta:.34,phi:1.28,radius:wide?10.3:9.3};
    const pos=[look[0]+cam0.radius*Math.sin(cam0.phi)*Math.sin(cam0.theta),look[1]+cam0.radius*Math.cos(cam0.phi),look[2]+cam0.radius*Math.sin(cam0.phi)*Math.cos(cam0.theta)];
    return CIN.stage3d(box,{fill:true,orbit:fine,zoom:false,autoRotate:0,camera:{pos,look,fov:wide?34:44},
      build(ctx){
        const {THREE,root,colors,isLight,camera}=ctx, hx=hxOf(ctx), dark=!isLight, SC=wide?.0078:.0112;
        let offW=0; const applyOffset=()=>{ const w=ctx.size.w, h=ctx.size.h; if(!wide||!w||w===offW) return; offW=w; camera.setViewOffset(w,h,-Math.round(w*.25),0,w,h); };
        applyOffset();
        starfield(ctx,640,26);
        const floor=CIN.prim.grid(ctx,40,80,hx('grid'),{opacity:isLight?.32:.16}); floor.position.y=-2.6; root.add(floor);
        const COL={tea:hx(K16.tea),cricket:hx(K16.cricket),people:hx(K16.people)}, pink=hx(K16.bat), gold=hx(K16.gold);
        /* each word: a core, a halo, a label, a faint stem to the floor */
        const nodes=WORDS.map(o=>{ const c=COL[o.g]; const core=CIN.prim.dot(ctx,o.from,c,.085); const halo=haloSprite(ctx,c,.62); const stem=liveTube(ctx,c,.004,isLight?.25:.18);
          root.add(core,halo,stem); const lab=slot(ctx,root); return Object.assign({core,halo,stem,lab,c},o); });
        /* soft cluster glows (appear when a group has gathered) */
        const glowT=haloSprite(ctx,COL.tea,3.4), glowC=haloSprite(ctx,COL.cricket,3.4); glowT.position.set(2.35,1.45,.05); glowC.position.set(2.55,-1.2,.1); root.add(glowT,glowC);
        /* the man → woman arrow, and its copy carried to king */
        const arr=CIN.prim.arrow(ctx,MAN,WOMAN,pink,{radius:.032,head:.26}); overlay(arr,11); root.add(arr);
        const cp=CIN.prim.arrow(ctx,MAN,WOMAN,pink,{radius:.032,head:.26}); overlay(cp,11); root.add(cp);
        const trail=liveTube(ctx,pink,.008,.0); root.add(trail); trail.material.depthWrite=false;
        const ring=new THREE.Mesh(new THREE.TorusGeometry(.2,.014,10,56),new THREE.MeshStandardMaterial({color:gold,emissive:gold,emissiveIntensity:dark?1:.3,transparent:true,opacity:0,depthWrite:false})); root.add(ring);
        const dLab=slot(ctx,root), hudEl=hud(box,wide?'hud-r':''); hudEl.style.maxWidth='calc(100% - 1.4rem)';
        if(fine) hint(box,'drag to orbit');
        box.addEventListener('pointerdown',()=>{ box._grab=1; });
        const V3=a=>new THREE.Vector3(...a);
        let flared=false;
        function apply(tt){
          const gather=E(seg(tt,1,4.6)), ppl=seg(tt,4.4,5.4), fade=1-seg(tt,T-.7,T);
          nodes.forEach((n,k)=>{ const isP=n.g==='people'; let p=isP?n.home:lerp(n.from,n.home,gather);
            if(!isP){ const w=.05*(1-gather)+.02; p=[p[0]+Math.sin(tt*.9+k)*w,p[1]+Math.cos(tt*.7+k*1.3)*w,p[2]]; }
            const vis=(isP?ppl:1)*fade;
            n.core.position.set(...p); n.halo.position.set(...p); n.core.visible=vis>.02; n.halo.material.opacity=(dark?.5:.22)*vis*(isP?1:.6+.4*gather);
            n.core.material.opacity=vis; n.core.material.transparent=true;
            aimTube(THREE,n.stem,[p[0],-2.6,p[2]],p); n.stem.material.opacity=(isLight?.22:.14)*vis;
            let lc=colors.ink; if(n.w==='queen'&&tt>10.2) lc=colors.s4;
            const off=LOFF[n.w]||[0,.3]; n.lab.set(n.w,[p[0]+off[0],p[1]+off[1],p[2]],{size:isP?27:23,scale:SC,color:lc,bg:!dark,weight:isP?700:600});
            if(n.lab.sp){ n.lab.sp.material.opacity=vis*(isP?1:.55+.45*gather); n.lab.sp.visible=vis>.02; } });
          glowT.material.opacity=(dark?.16:.08)*seg(tt,3.2,4.8)*fade; glowC.material.opacity=(dark?.16:.08)*seg(tt,3.4,5)*fade;
          /* the arrow grows from man to woman */
          const g1=E(seg(tt,5.6,6.9)); arr.visible=g1>.02&&fade>.02;
          if(arr.visible) arr.userData.set(V3(MAN),V3(lerp(MAN,WOMAN,Math.max(.06,g1))));
          dLab.set(g1>.5?'woman − man':'',[MAN[0]+D[0]/2+.95,MAN[1]+D[1]/2-.05,MAN[2]+D[2]/2],{size:21,scale:SC,color:colors.s5,bg:!dark});
          if(dLab.sp){ dLab.sp.material.opacity=fade*seg(tt,6.2,6.8); }
          /* the copy lifts and travels to king */
          const mv=E(seg(tt,7.4,9.9)); cp.visible=tt>7.3&&fade>.02;
          if(cp.visible){ const a=lerp(MAN,KING,mv), lift=Math.sin(Math.PI*mv)*.55; const A=[a[0]+lift*.3,a[1]+lift,a[2]+lift*.4]; cp.userData.set(V3(A),V3(A.map((x,i)=>x+D[i]))); }
          const st=tt>7.4&&tt<T; if(st){ aimTube(THREE,trail,MAN,lerp(MAN,KING,mv)); trail.material.opacity=(dark?.35:.3)*seg(tt,7.4,8)*fade; } else trail.material.opacity=0;
          /* the tip lands next to queen */
          const land=seg(tt,9.9,10.6); ring.position.set(...QUEEN); ring.lookAt(camera.position); ring.material.opacity=land*fade*(dark?.95:.8); ring.scale.setScalar(1+.25*Math.sin(tt*3)*land);
          if(tt>9.95&&tt<10.3&&!flared&&!reduced){ flared=true; flare(ctx,QUEEN,gold,1000,1.7); } if(tt<9) flared=false;
          let msg;
          if(tt<1.2) msg='Words start as labels — scattered, no meaning';
          else if(tt<4.8) msg='Words used alike drift together: <b>tea</b> here, <b>cricket</b> there';
          else if(tt<7.2) msg='The step from man to woman is an <b>arrow</b>';
          else if(tt<10) msg='Carry the same arrow to king …';
          else msg='… and it lands next to <b>queen</b>. A word is where it lives.';
          hudEl.innerHTML=msg;
        }
        ctx.hero={t0:null,tick(t){ applyOffset(); if(ctx.hero.t0==null) ctx.hero.t0=t; const tt=window.U16HeroAt!=null?+window.U16HeroAt:(t-ctx.hero.t0)%T; apply(tt);
          if(!ctx.orbit||ctx.orbit.sph==null) return true; if(window.U16HeroAt==null&&!box._grab){ ctx.orbit.sph.theta=cam0.theta+.16*Math.sin(t*.12); ctx.orbit.place(); } return true; }};
        if(reduced){ apply(12.5); hudEl.innerHTML='Tea words together, cricket words together — and king + (woman − man) lands next to <b>queen</b>.'; }
        else apply(0);
        box.dataset.ready='1';
      },
      update(ctx,t){ if(reduced||ctx.dead) return false; return ctx.hero.tick(t); }
    });
  }
  const HS=mountStage(box,build);
  let rw=innerWidth; addEventListener('resize',()=>{ const wide=innerWidth>=760; if(wide!==(rw>=760)) remount(HS); rw=innerWidth; });
})();
