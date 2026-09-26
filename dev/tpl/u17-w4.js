/* ================= UNIT 17 · Act IV widgets: w-seq2seq, w-beam ================= */

/* ---------- §12 · w-seq2seq: English in, one summary orb, Hindi out (3-D) ---------- */
(function(){
  const box=document.getElementById('sq-3d'); if(!box) return;
  const read=document.getElementById('sq-read');
  const EN=['the','train','to','Delhi','is','late','today','because','of','thick','fog','near','Agra','and','the','signals','were','slow'];
  const HI=['Delhi','ki','train','late','hai'];
  const SLOTS=8, KEEP=.9, SHOW=6;
  const st={n:6,tf:false,ph:1};
  /* short sentences are shown whole and must match the Hindi the decoder writes; long ones show 3 + … + 3 words */
  const SHORT={3:['Delhi','train','late'],4:['Delhi','train','is','late'],5:['the','Delhi','train','is','late'],6:['the','train','to','Delhi','is','late']}, TAIL=['fog','near','Agra'];
  const word=k=>{ const n=st.n; return n<=6?SHORT[n][k]:k<3?EN[k]:k>=n-3?TAIL[k-(n-3)]:EN[k%EN.length]; };
  function readout(){ const n=st.n, s1=Math.pow(KEEP,n-1);
    read.innerHTML='Sentence: <b class="w">'+n+'</b> words × 8 numbers = <b>'+8*n+'</b> numbers in → summary: <b class="m">8</b> numbers out'+(n>SLOTS?' · <b class="r">more words than slots</b>':'')+
      '<br>Word 1 still speaks in the summary at 0.9'+SUP(n-1)+' = <b class="'+(s1<.01?'r':'m')+'">'+E(s1,3)+'</b> of its first strength (toy leak rate 0.9 per step)'+
      '<br>Decoder input while training: <b class="g">'+(st.tf?'the true previous Hindi word (teacher forcing)':'its own last word (as at test time)')+'</b>';
    box.dataset.state=[n,s1.toFixed(6),st.tf?'tf':'own'].join(','); }
  function build(){ if(!CIN) return null; const P=PHONE();
    /* desktop: encoder → orb → decoder in one row. Phone: three rows — the encoder on top, the orb in the middle, the decoder below */
    return CIN.stage3d(box,{camera:cam3({pos:[.3,3.3,8.3],look:[.15,1.15,0],fov:42},{pos:[0,2.1,9.9],look:[0,1.45,0],fov:44}),orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,isLight,colors}=ctx, hx=hxOf(ctx), dark=!isLight, SC=P?.0122:.0088;
      starfield(ctx,300,18); glassFloor(ctx,14,{div:44,y:P?-1.35:-.1});
      const C={word:hx(K17.word),mem:hx(K17.mem),prob:hx(K17.prob),gate:hx(K17.gate)};
      const OX=0, OY=P?1.5:1.35, OR=P?.58:.62, EY=P?3.05:OY, DY=P?-.05:OY, SH=SHOW;
      const hudEl=hud(box); hudEl.style.maxWidth='calc(100% - 1.4rem)';
      /* the summary orb: a glass shell with 8 fixed slots on its equator */
      const shell=new THREE.Mesh(new THREE.SphereGeometry(OR,40,28),new THREE.MeshStandardMaterial({color:C.mem,emissive:C.mem,emissiveIntensity:dark?.25:.08,transparent:true,opacity:dark?.2:.25,roughness:.1,depthWrite:false}));
      shell.position.set(OX,OY,0); root.add(shell); const sh=haloSprite(ctx,C.mem,2.6); sh.position.set(OX,OY,0); root.add(sh);
      for(let s=0;s<SLOTS;s++){ const a=s/SLOTS*Math.PI*2; const r=new THREE.Mesh(new THREE.TorusGeometry(.075,.014,8,24),new THREE.MeshStandardMaterial({color:C.mem,emissive:C.mem,emissiveIntensity:dark?.8:.3})); r.position.set(OX+OR*Math.cos(a),OY,OR*Math.sin(a)); r.lookAt(OX,OY,0); root.add(r); }
      root.add(lab(ctx,P?'summary · 8':'summary · 8 numbers',P?[OX+1.85,OY+.12,0]:[OX,OY+OR+.45,0],{size:26,weight:800,scale:SC,color:colors.s3,bg:true}));
      if(!P){ root.add(lab(ctx,'encoder · reads English',[-3.3,2.45,0],{size:24,weight:700,scale:SC,color:colors.muted,bg:false}));
      }
      const dyn=new THREE.Group(); root.add(dyn);
      const cellBox=(x,y,col)=>{ const g=new THREE.Group(); g.position.set(x,y,0);
        g.add(new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),new THREE.MeshStandardMaterial({color:dark?0xcfe0ff:0xffffff,transparent:true,opacity:dark?.1:.3,depthWrite:false})));
        g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.5,.5,.5)),new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.8}))); return g; };
      ctx.redraw=()=>{ clearGroup(dyn); const n=st.n, ph=st.ph, shown=Math.min(n,SH);
        if(!P) dyn.add(lab(ctx,n>SH?'decoder · writes Hindi (its first words)':'decoder · writes Hindi',[3.9,2.45,0],{size:24,weight:700,scale:SC,color:colors.muted,bg:false}));
        const encX=i=>P?-2.55+i*(5.1/Math.max(1,shown-1)):-5.4+i*(3.9/Math.max(1,shown-1)), decX=j=>P?-2.55+j*(5.1/5):1.5+j*.95;
        const encPh=Math.min(1,ph/.55), decPh=Math.max(0,(ph-.55)/.45);
        /* encoder cells + words (the middle is skipped when the sentence is long) */
        const half=Math.floor(SH/2);
        for(let i=0;i<shown;i++){ const k=(n>SH&&i>=half)?n-(shown-i):i, on=encPh*shown>=i+.5; const x=encX(i);
          const cb=cellBox(x,EY,C.mem); cb.children.forEach(m=>{ if(m.material) m.material.opacity*=on?1:.35; }); dyn.add(cb);
          dyn.add(lab(ctx,word(k),P?[x,EY+.55,0]:[x,.42,0],{size:P?24:27,weight:700,scale:SC,color:colors.s1,bg:true}));
          if(i<shown-1) { const t=liveTube(ctx,C.mem,.014,on?.9:.25); aimTube(THREE,t,[x+.25,EY,0],[encX(i+1)-.25,EY,0]); dyn.add(t); } }
        if(n>SH) dyn.add(lab(ctx,'… '+(n-SH)+' more …',[(encX(half-1)+encX(half))/2,EY+(P?-.55:.62),0],{size:20,scale:SC,color:colors.muted,bg:true}));
        { const t=liveTube(ctx,C.gate,.025,encPh>=1?.95:.3); aimTube(THREE,t,P?[encX(shown-1),EY-.25,0]:[encX(shown-1)+.25,OY,0],P?[OX+.3,OY+OR*.85,0]:[OX-OR,OY,0]); dyn.add(t); }
        /* one spark per word inside the orb; its size is how loudly that word still speaks (0.9^(n−k)) */
        const rnd=seeded(5); const inside=Math.min(n,SLOTS), crowd=n>SLOTS;
        for(let k=0;k<n;k++){ const arrived=encPh*n>=k+.5; if(!arrived) continue; const s=Math.pow(KEEP,n-1-k);
          const u=rnd(), v=rnd(), rr=OR*(crowd&&k<n-inside?1.05+.55*rnd():.25+.55*rnd()), th=u*Math.PI*2, ph2=Math.acos(2*v-1);
          const p=[OX+rr*Math.sin(ph2)*Math.cos(th),OY+rr*Math.cos(ph2)*.8,rr*Math.sin(ph2)*Math.sin(th)];
          const d=CIN.prim.dot(ctx,p,k===0?hx(K17.gate):C.word,.03+.07*s); dyn.add(d);
          if(k===0){ const hh=haloSprite(ctx,hx(K17.gate),.2+.9*s); hh.position.set(...p); dyn.add(hh); dyn.add(lab(ctx,(P?'word 1: ':'word 1 speaks at ')+E(s,2),P?[OX+1.3,OY-OR-.14,0]:[OX+.2,OY-OR-.66,.25],{size:20,weight:700,scale:SC,color:colors.s4,bg:true}));   /* desktop: one line below the encoder's words, so it never touches the last one */   /* phones: in the free lower-right corner, clear of the sparks and the gold wires */ } }
        hudEl.innerHTML=(P?'':'<b>'+n+'</b> words × 8 = ')+'<b>'+8*n+'</b> numbers → one <b>8</b>-number summary'+(n>SLOTS?' · <b style="color:var(--critical)">crowded</b>':'');
        shell.material.emissive.setHex(crowd?critHex():C.mem); shell.material.emissiveIntensity=(dark?.25:.08)+(crowd?Math.min(.9,(n-SLOTS)/25):0); sh.material.color.setHex(crowd?critHex():C.mem);
        /* decoder */
        const outs=HI.concat(['⟨end⟩']);
        { const t=liveTube(ctx,C.gate,.025,decPh>0?.95:.3); aimTube(THREE,t,P?[OX-.3,OY-OR*.85,0]:[OX+OR,OY,0],P?[decX(0),DY+.25,0]:[decX(0)-.25,OY,0]); dyn.add(t); }
        outs.forEach((w,j)=>{ const on=decPh*outs.length>=j+.5, x=decX(j); const cb=cellBox(x,DY,C.prob); cb.children.forEach(m=>{ if(m.material) m.material.opacity*=on?1:.35; }); dyn.add(cb);
          if(on) dyn.add(lab(ctx,w,P?[x,DY-.55,0]:[x,OY+.62,0],{size:27,weight:800,scale:SC,color:colors.s6,bg:true}));
          if(!P){ const prev=j===0?'⟨start⟩':outs[j-1]; dyn.add(lab(ctx,prev,[x,.42,0],{size:21,weight:700,scale:SC,color:st.tf?colors.s4:colors.ink2,bg:true})); }
          if(j<outs.length-1){ const t=liveTube(ctx,C.prob,.012,on?.8:.25); aimTube(THREE,t,[x+.25,DY,0],[decX(j+1)-.25,DY,0]); dyn.add(t); } });
        if(!P) dyn.add(lab(ctx,st.tf?'↑ fed: the true previous word':'↑ fed: its own last word',[decX(2.5),-.08,.35],{size:22,weight:700,scale:SC,color:st.tf?colors.s4:colors.muted,bg:false}));
        RR(ctx); };
      ctx.redraw();
    }}); }
  const S3=CIN?mountStage(box,build):null; flipRemount(S3);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  bindCtl('sq-n',v=>{ st.n=v; st.ph=1; redraw(); },v=>String(v));
  [['sq-5',5],['sq-50',50]].forEach(([id,n])=>{ const b=document.getElementById(id); if(b) b.addEventListener('click',()=>{ st.n=n; st.ph=1; setCtl('sq-n',n,v=>String(v)); redraw(); }); });
  const tf=document.getElementById('sq-tf'); tf.addEventListener('click',()=>{ st.tf=!st.tf; tf.setAttribute('aria-pressed',st.tf); redraw(); });
  let tw=null; document.getElementById('sq-play').addEventListener('click',()=>{ if(tw) tw.stop(); let last=-1; tw=tween(5200,u=>{ const q=Math.round(u*60)/60; if(q!==last){ last=q; st.ph=q; redraw(); } },()=>{ st.ph=1; redraw(); }); });
  readout(); window.U17Seq={st,redraw};
  reg('w-seq2seq',{state:()=>({n:st.n,tf:st.tf,ph:st.ph,numbersIn:8*st.n,numbersOut:SLOTS,word1:Math.pow(KEEP,st.n-1),crowded:st.n>SLOTS}),st,redraw,rects:stageRects(S3)});
})();

/* ---------- §13 · w-beam: greedy against beam search ---------- */
(function(){
  const svg=document.getElementById('bm-svg'); if(!svg) return;
  const read=document.getElementById('bm-read');
  const st={k:1,stage:2,log:false};
  const L1=BEAM.root.map(([w,p])=>({w,p})), LEAF=[]; L1.forEach(a=>(BEAM.next[a.w]||[]).forEach(([w,p])=>LEAF.push({a:a.w,w,p,P:a.p*p})));
  function draw(){ svg.innerHTML=''; const VB=narrowSVG(svg,760,360,440,610), ph=VB.n, glow=glo(svg), R=beamSearch(st.k), s1=R.log[0].kept, s2=R.log[1].kept, best=R.best.w.join(' ');
    const X0=ph?22:50, X1=ph?146:270, X2=ph?340:500, Y0=ph?300:180, y1=i=>ph?112+i*188:70+i*112, yl=i=>ph?34+i*84:28+i*50;
    const val=p=>st.log?N(Math.log(p),3):N(p,2);
    el('circle',{cx:X0,cy:Y0,r:9,fill:'var(--ink-2)'},svg); txt(svg,X0,Y0+26,'start','font:700 11px system-ui;fill:var(--ink-muted)','middle');
    L1.forEach((a,i)=>{ const kept=st.stage>=1&&s1.includes(a.w), dim=st.stage>=1&&!kept; const col=kept?cv(K17.gate):'var(--ink-muted)', y=y1(i);
      const g=el('g',{opacity:dim?.35:1},svg); if(kept&&glow) g.setAttribute('filter',glow);
      el('path',{d:`M${X0+9},${Y0} C${X0+(ph?50:90)},${Y0} ${X1-(ph?70:110)},${y} ${X1-36},${y}`,fill:'none',stroke:col,'stroke-width':kept?3.2:1.6},g);
      txt(svg,X1-(ph?50:62),y-(ph?14:8),val(a.p),'font:700 11px system-ui;fill:'+(kept?cv(K17.gate):'var(--ink-2)'),'middle');
      const gb=el('g',{opacity:dim?.4:1},svg); el('rect',{x:X1-36,y:y-15,width:72,height:30,rx:8,fill:kept?'color-mix(in srgb,var(--s4) 16%,transparent)':'color-mix(in srgb,var(--s6) 10%,transparent)',stroke:kept?cv(K17.gate):cv(K17.prob),'stroke-width':1.4},gb);
      txt(gb,X1,y+5,a.w,'font:700 12px system-ui;fill:var(--ink)','middle'); });
    LEAF.forEach((l,i)=>{ const ia=L1.findIndex(a=>a.w===l.a), y=yl(i), s=l.a+' '+l.w, parentKept=st.stage<1||s1.includes(l.a), kept=st.stage>=2&&s2.includes(s), isBest=st.stage>=2&&s===best;
      const col=isBest?cv(K17.gate):kept?cv(K17.gate):'var(--ink-muted)', op=!parentKept?.18:(st.stage>=2&&!kept?.45:1);
      const g=el('g',{opacity:op},svg); if(isBest&&glow) g.setAttribute('filter',glow);
      el('path',{d:`M${X1+36},${y1(ia)} C${X1+(ph?70:120)},${y1(ia)} ${X2-(ph?80:120)},${y} ${X2-40},${y}`,fill:'none',stroke:col,'stroke-width':isBest?3.4:kept?2.4:1.3},g);
      txt(svg,X2-(ph?62:70),y-(ph?10:6),val(l.p),'font:700 10.5px system-ui;fill:var(--ink-2);opacity:'+op,'middle');
      const gb=el('g',{opacity:op},svg); el('rect',{x:X2-40,y:y-14,width:80,height:28,rx:8,fill:isBest?'color-mix(in srgb,var(--s4) 24%,transparent)':'none',stroke:isBest?cv(K17.gate):'var(--line)','stroke-width':isBest?2:1},gb);
      txt(gb,X2,y+4,l.w,'font:700 11.5px system-ui;fill:var(--ink)','middle');
      if(ph) txt(gb,X2,y+34,(isBest?'★ ':'')+(st.log?'ln P '+N(Math.log(l.P),2):'P = '+N(l.P,2)),'font:'+(isBest?800:600)+' 11px system-ui;fill:'+(isBest?cv(K17.gate):'var(--ink-2)'),'middle');
      else txt(gb,X2+50,y+4,(isBest?'★ ':'')+'"'+s+'" '+(st.log?'ln P = '+N(Math.log(l.P),3):'P = '+N(l.P,2)),'font:'+(isBest?800:600)+' 11px system-ui;fill:'+(isBest?cv(K17.gate):'var(--ink-2)')); });
    const kept1=s1.map(w=>'"'+w+'"').join(', '), cand=R.log[1].cand.map(c=>c.w.join(' ')+' '+N(c.p,2)).join(' · ');
    read.innerHTML='Width <b>'+st.k+'</b>'+(st.k===1?' (greedy)':'')+' · step 1 keeps '+kept1+'<br>step 2 sees: '+cand+'<br>'+(st.stage>=2?'Winner: <b class="g">"'+best+'"</b>, P = <b>'+N(R.best.p,2)+'</b> (ln P = '+N(Math.log(R.best.p),3)+')':'…');
    svg.dataset.best=best+'|'+R.best.p.toFixed(4); svg.dataset.k=st.k; mfont(svg); declutter(svg);
    S={k:st.k,stage:st.stage,log:st.log,best:R.best.w.join(' '),p:R.best.p,kept1:s1.slice(),kept2:s2.slice(),cand:R.log[1].cand.map(c=>({w:c.w.join(' '),p:c.p}))}; }
  let S={};
  tabs(document.getElementById('bm-k'),t=>{ st.k=+t; st.stage=2; draw(); });
  const lg=document.getElementById('bm-log'); lg.addEventListener('click',()=>{ st.log=!st.log; lg.setAttribute('aria-pressed',st.log); draw(); });
  let timer=null; document.getElementById('bm-play').addEventListener('click',()=>{ clearInterval(timer); st.stage=0; draw(); if(RM){ st.stage=2; draw(); return; } timer=setInterval(()=>{ st.stage++; draw(); if(st.stage>=2) clearInterval(timer); },1100); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17Beam={st,draw}; reg('w-beam',{state:()=>JSON.parse(JSON.stringify(S)),st,draw});
})();
