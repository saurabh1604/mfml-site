/* ================= UNIT 15 · Act I widgets: w-anatomy, w-neuron, w-acts ================= */

/* ---------- §1 · w-anatomy: graph, matrices, chain — twins light up together ---------- */
(function(){
  const root=document.getElementById('w-anatomy'); if(!root) return;
  const gs=document.getElementById('an-graph'), cs=document.getElementById('an-chain'), mat=document.getElementById('an-mat'), read=document.getElementById('an-read');
  const DESC={
    a0:'<b>a⁽⁰⁾</b> · 2 × 1 · the input: age 30 and experience 10.',
    W1:'<b>W⁽¹⁾</b> · 3 × 2 · six wires from the 2 inputs into the 3 neurons of hidden layer 1. Row j = the wires arriving at neuron j.',
    b1:'<b>b⁽¹⁾</b> · 3 × 1 · one shift for each neuron of hidden layer 1.',
    z1:'<b>z⁽¹⁾</b> · 3 × 1 · the mix before the bend: W⁽¹⁾a⁽⁰⁾ + b⁽¹⁾.', a1:'<b>a⁽¹⁾</b> · 3 × 1 · what hidden layer 1 sends on, after the ReLU.',
    act1:'<b>ReLU</b> · the bend of hidden layer 1, done to each neuron on its own.', act2:'<b>ReLU</b> · the bend of hidden layer 2.', act3:'<b>ReLU</b> · the bend at the output (here it changes nothing, because z⁽³⁾ &gt; 0).',
    W2:'<b>W⁽²⁾</b> · 2 × 3 · six wires from the 3 neurons of layer 1 into the 2 neurons of layer 2.', b2:'<b>b⁽²⁾</b> · 2 × 1 · one shift per neuron of hidden layer 2.',
    z2:'<b>z⁽²⁾</b> · 2 × 1 · the mix of layer 2.', a2:'<b>a⁽²⁾</b> · 2 × 1 · what hidden layer 2 sends on.',
    W3:'<b>W⁽³⁾</b> · 1 × 2 · two wires into the single output neuron.', b3:'<b>b⁽³⁾</b> · 1 × 1 · the output shift.',
    z3:'<b>z⁽³⁾</b> · 1 × 1 · the output mix.', yhat:'<b>ŷ</b> · 1 × 1 · the predicted salary.', L:'<b>L</b> · 1 × 1 · the loss ½(ŷ − y)²: how wrong the guess is.'};
  const LX=[76,205,340,455], NY=n=>i=>165+(i-(n-1)/2)*96;
  const pos=(l,i)=>[LX[l],NY([2,3,2,1][l])(i)];
  let K=1; const F=(w,px)=>'font:'+w+' '+(px*K).toFixed(1)+'px system-ui;';
  function drawGraph(){ gs.innerHTML=''; const gw=gs.getBoundingClientRect().width; K=gw>0&&gw<560?1.8:1; const glow=glo(gs), R=K>1?19:15;
    SAL.W.forEach((W,l)=>W.forEach((row,j)=>row.forEach((w,k)=>{ const [x1,y1]=pos(l,k),[x2,y2]=pos(l+1,j);
      const e=el('line',{x1,y1,x2,y2,stroke:cv(w>=0?K15.pos:K15.neg),'stroke-width':1.2+3.4*Math.min(1,Math.sqrt(Math.abs(w))/2),'stroke-linecap':'round',opacity:.9,'data-obj':'W'+(l+1)},gs); })));
    const [ox,oy]=pos(3,0); el('line',{x1:ox+R+1,y1:oy,x2:524-17*K,y2:oy,stroke:'var(--ink-muted)','stroke-width':1.5,'stroke-dasharray':'4 3','data-obj':'L yhat'},gs);
    el('rect',{x:524-17*K,y:oy-15*K,width:34*K,height:30*K,rx:7,fill:'color-mix(in srgb,var(--critical) 20%,transparent)',stroke:cv(K15.bwd),'stroke-width':1.6,'data-obj':'L'},gs);
    txt(gs,524,oy+5*K,'L',F(700,13)+'fill:var(--critical)','middle');
    [2,3,2,1].forEach((n,l)=>{ for(let i=0;i<n;i++){ const [x,y]=pos(l,i), obj=l===0?'a0':l===3?'z3 yhat act3 b3':'z'+l+' a'+l+' act'+l+' b'+l;
      const g=el('g',{'data-obj':obj,style:'cursor:pointer'},gs);
      if(glow&&l>0) el('circle',{cx:x,cy:y,r:R+7,fill:cv(K15.fwd),opacity:.12},g);
      el('circle',{cx:x,cy:y,r:R,fill:'var(--surface-2, var(--surface))',stroke:l===0?cv(K15.fwd):l===3?'var(--ink)':cv(K15.awake),'stroke-width':2},g);
      if(l>0){ const bg=el('g',{'data-obj':'b'+l},gs); el('rect',{x:x+R*.6,y:y-R-11*K,width:22*K,height:13*K,rx:4,fill:'var(--surface)',stroke:'var(--ink-muted)','stroke-width':1},bg); txt(bg,x+R*.6+11*K,y-R-11*K+9.5*K,'+b',F(700,9)+'fill:var(--ink-2)','middle'); }
      if(l===0) txt(gs,x-R-6,y+4*K,i?'exp':'age',F(600,11)+'fill:var(--ink-2)','end'); } });
    [['input · 2',0],['hidden · 3',1],['hidden · 2',2],['output · 1',3]].forEach(([t,l])=>txt(gs,LX[l],K>1?322:318,K>1?t.replace(' · ',' '):t,F(600,10.5)+'fill:var(--ink-muted)','middle'));
    [['W⁽¹⁾ 3×2',(LX[0]+LX[1])/2,'W1'],['W⁽²⁾ 2×3',(LX[1]+LX[2])/2,'W2'],['W⁽³⁾ 1×2',(LX[2]+LX[3])/2,'W3']].forEach(([t,x,o])=>{ const g=el('g',{'data-obj':o},gs); txt(g,x,K>1?24:22,K>1?t.split(' ')[0]:t,F(700,11)+'fill:var(--ink-2)','middle'); });
  }
  const CH=[['a0','a⁽⁰⁾'],['z1','z⁽¹⁾'],['a1','a⁽¹⁾'],['z2','z⁽²⁾'],['a2','a⁽²⁾'],['z3','z⁽³⁾'],['yhat','ŷ'],['L','L']];
  const OPS=[['W1 b1','× W⁽¹⁾ + b⁽¹⁾'],['act1','ReLU'],['W2 b2','× W⁽²⁾ + b⁽²⁾'],['act2','ReLU'],['W3 b3','× W⁽³⁾ + b⁽³⁾'],['act3','ReLU'],['L','½(ŷ − y)²']];
  function drawChain(){ cs.innerHTML=''; CH.forEach(([o,t],i)=>{ const y=10+i*40, g=el('g',{'data-obj':o,style:'cursor:pointer'},cs);
      const isL=o==='L'; el('rect',{x:40,y,width:92,height:28,rx:8,fill:isL?'color-mix(in srgb,var(--critical) 18%,transparent)':'color-mix(in srgb,var(--s1) 14%,transparent)',stroke:isL?cv(K15.bwd):cv(K15.fwd),'stroke-width':1.6},g);
      txt(g,86,y+19,t,'font:700 13px system-ui;fill:var(--ink)','middle');
      if(i<7){ const og=el('g',{'data-obj':OPS[i][0]},cs); edge(og,86,y+29,86,y+39,'var(--ink-muted)',1.6,null); txt(og,150,y+38,OPS[i][1],'font:600 11.5px system-ui;fill:'+(OPS[i][1]==='ReLU'?cv(K15.awake):'var(--ink-2)')); } });
    txt(cs,250,40,'eight nodes','font:700 11px system-ui;fill:var(--ink-muted)'); txt(cs,250,56,'in one line','font:700 11px system-ui;fill:var(--ink-muted)');
  }
  let quiz=false; const OPTS=['?','1×1','1×2','2×1','1×3','3×1','2×3','3×2'];
  const ITEMS=[['a0','a⁽⁰⁾',colOf(SAL_X),'2×1','fwd'],['W1','W⁽¹⁾',SAL.W[0],'3×2','par'],['b1','b⁽¹⁾',colOf(SAL.b[0]),'3×1','par'],['W2','W⁽²⁾',SAL.W[1],'2×3','par'],['b2','b⁽²⁾',colOf(SAL.b[1]),'2×1','par'],['W3','W⁽³⁾',SAL.W[2],'1×2','par'],['b3','b⁽³⁾',colOf(SAL.b[2]),'1×1','par']];
  const guess={};
  function drawMat(){ mat.innerHTML=ITEMS.map(([o,t,M,sh,tn])=>{ const g=guess[o]||0, right=OPTS[g]===sh;
      const badge=quiz?`<button class="qshape${right?' ok':''}" data-q="${o}" type="button">${OPTS[g]}${right?' ✓':''}</button>`:`<span class="mshape">${sh}</span>`;
      return `<div class="an-item" data-obj="${o}"><span class="an-nm">${t}</span>${matHTML(M,{tone:tn})}${badge}</div>`; }).join('');
    if(quiz){ const n=ITEMS.filter(([o,,,sh])=>OPTS[guess[o]||0]===sh).length; read.innerHTML='Shape quiz · <b>'+n+'</b> of 7 right'+(n===7?' — every shape follows (neurons here) × (neurons before).':' · click a "?" to cycle through shapes.'); }
    mat.querySelectorAll('.qshape').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); const o=b.dataset.q; guess[o]=((guess[o]||0)+1)%OPTS.length; if(guess[o]===0) guess[o]=1; drawMat(); bindHover(); })); }
  function light(objs){ const set=new Set(objs||[]); root.classList.toggle('an-focus',set.size>0);
    root.querySelectorAll('[data-obj]').forEach(n=>{ const on=n.dataset.obj.split(' ').some(o=>set.has(o)); n.classList.toggle('an-hl',on); });
    if(set.size&&!quiz){ const k=[...set][0]; read.innerHTML=[...set].map(o=>DESC[o]).filter(Boolean).join('<br>'); }
    root.dataset.hl=[...set].join(' '); }
  function bindHover(){ root.querySelectorAll('[data-obj]').forEach(n=>{ if(n._b) return; n._b=1;
    const objs=()=>{ const t=n.dataset.obj.split(' '); return t; };
    n.addEventListener('pointerenter',()=>light(objs())); n.addEventListener('pointerleave',()=>light([]));
    n.addEventListener('click',()=>light(objs())); }); }
  tabs(document.getElementById('an-tabs'),t=>{ mat.style.display=t==='mat'?'':'none'; document.getElementById('an-chain-box').style.display=t==='chain'?'':'none'; });
  document.getElementById('an-quiz').addEventListener('click',e=>{ quiz=!quiz; e.currentTarget.setAttribute('aria-pressed',quiz); if(quiz){ document.getElementById('an-t-mat').click(); } else read.textContent='Point at a wire, a neuron or a box.'; drawMat(); bindHover(); });
  document.getElementById('an-reset').addEventListener('click',()=>{ Object.keys(guess).forEach(k=>delete guess[k]); drawMat(); bindHover(); light([]); if(!quiz) read.textContent='Point at a wire, a neuron or a box.'; });
  window.U15Anatomy={light,solve(){ ITEMS.forEach(([o,,,sh])=>{ guess[o]=OPTS.indexOf(sh); }); drawMat(); bindHover(); }};
  const redraw=()=>{ drawGraph(); drawChain(); drawMat(); bindHover(); };
  redraw(); let lastK=K; addEventListener('resize',()=>{ const w=gs.getBoundingClientRect().width, k=w>0&&w<560?1.8:1; if(k!==lastK){ lastK=k; redraw(); } }); new MutationObserver(redraw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ---------- §2 · w-neuron: the neuron's sheet over the plane (3-D) ---------- */
(function(){
  const box=document.getElementById('nr-3d'); if(!box||!CIN) return;
  const st={w1:1,w2:1,b:-2,act:'relu',slope:false};
  const R=3, ZS=.55;                                  /* inputs in [−3, 3]², heights scaled */
  const actF=()=>ACTS[st.act];
  const H=(x,y)=>{ const z=st.w1*x+st.w2*y+st.b, a=actF().f(z); return st.act==='sigmoid'?a*3:st.act==='tanh'?a*2:Math.max(-4.5,Math.min(4.5,a)); };
  const read=document.getElementById('nr-read');
  function readout(){ const z=st.w1*3+st.w2*1+st.b, A=actF(); const wn=Math.hypot(st.w1,st.w2);
    read.innerHTML='z = '+N(st.w1,2)+'x₁ + '+N(st.w2,2)+'x₂ + ('+N(st.b,2)+')<br>at (3, 1): z = <b>'+N(z,2)+'</b> → a = <b>'+N(A.f(z),3)+'</b>, slope <b>'+N(A.d(z),3)+'</b>'+
      (wn>1e-9?'<br>crease: '+N(st.w1,2)+'x₁ + '+N(st.w2,2)+'x₂ = '+N(-st.b,2):'<br>w = 0: no crease — the sheet is flat');
    box.dataset.state=[st.act,st.w1,st.w2,st.b].join(','); }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[6.4,5.6,8.4],look:[0,.5,0],fov:36},orbit:true,autoRotate:.12,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx);
      starfield(ctx,260,16); glassFloor(ctx,2*R+.4,{div:24});
      const surf=CIN.prim.surface(ctx,(x,y)=>0,{x:[-R,R],y:[-R,R],res:72,opacity:.88}); surf.position.y=.012; root.add(surf);
      const crease=liveTube(ctx,hx(K15.awake),.03,1); root.add(crease); const creaseH=liveTube(ctx,hx(K15.awake),.09,isLight?.12:.22); creaseH.material.depthWrite=false; root.add(creaseH);
      const wArrow=CIN.prim.arrow(ctx,[0,.02,0],[1,.02,0],hx(K15.pos),{radius:.03,head:.2}); root.add(wArrow);
      const probe=CIN.prim.dot(ctx,[3,0,-1],hx(K15.fwd),.09); root.add(overlay(probe,12)); const drop=liveTube(ctx,hx(K15.fwd),.012,.8); root.add(drop);
      const lblA=slot(ctx,root), lblC=slot(ctx,root);
      ctx.redraw=()=>{ const c=ctx.colors;
        const ramp=[c.s7,c.s6,c.s4];
        if(st.slope){ reshape(ctx,surf,H,ZS,[c.grid,c.s7,c.s4]); /* colour by slope instead of height */
          const geo=surf.userData.geo,pos=geo.attributes.position,col=geo.attributes.color, A=actF(), lo=new THREE.Color(isLight?0xd8d6cc:0x1b2440), hi=new THREE.Color(hx(K15.awake));
          for(let i=0;i<pos.count;i++){ const x=pos.getX(i), y=-pos.getZ(i), s=A.d(st.w1*x+st.w2*y+st.b), k=lo.clone().lerp(hi,Math.min(1,s)).convertSRGBToLinear(); col.setXYZ(i,k.r,k.g,k.b); } col.needsUpdate=true; }
        else reshape(ctx,surf,H,ZS,ramp);
        const wn=Math.hypot(st.w1,st.w2);
        if(wn>1e-9){ const u=[st.w1/wn,st.w2/wn], d=[-u[1],u[0]], p0=[-st.b*u[0]/wn,-st.b*u[1]/wn];
          /* clip the crease to the square */
          let ts=[]; for(const [k,lim] of [[0,-R],[0,R],[1,-R],[1,R]]){ if(Math.abs(d[k])>1e-9){ const t=(lim-p0[k])/d[k], q=[p0[0]+t*d[0],p0[1]+t*d[1]]; if(Math.abs(q[0])<=R+1e-9&&Math.abs(q[1])<=R+1e-9) ts.push(t); } }
          if(ts.length>=2){ const t0=Math.min(...ts),t1=Math.max(...ts); const A=[p0[0]+t0*d[0],p0[1]+t0*d[1]],B=[p0[0]+t1*d[0],p0[1]+t1*d[1]];
            aimTube(THREE,crease,M3(A[0],A[1],.02),M3(B[0],B[1],.02)); aimTube(THREE,creaseH,M3(A[0],A[1],.02),M3(B[0],B[1],.02)); crease.visible=creaseH.visible=true;
            const mid=[(A[0]+B[0])/2,(A[1]+B[1])/2]; wArrow.visible=true; wArrow.userData.set(new THREE.Vector3(...M3(mid[0],mid[1],.03)),new THREE.Vector3(...M3(mid[0]+u[0]*.9,mid[1]+u[1]*.9,.03)));
            lblC.set('crease  z = 0',M3(B[0]*.92,B[1]*.92,.35),{size:24,scale:.011,color:ctx.colors.s4,bg:true}); }
          else { crease.visible=creaseH.visible=false; wArrow.visible=false; lblC.hide(); } }
        else { crease.visible=creaseH.visible=false; wArrow.visible=false; lblC.hide(); }
        const hz=H(3,1)*ZS; probe.position.set(...M3(3,1,hz)); aimTube(THREE,drop,M3(3,1,0),M3(3,1,hz)); drop.visible=Math.abs(hz)>.02;
        const z=st.w1*3+st.w2+st.b; lblA.set('at (3, 1): a = '+N(actF().f(z),2),M3(3,1,hz+.5),{size:24,scale:.011,color:ctx.colors.s1,bg:true});
        RR(ctx); };
      ctx.redraw();
    }}); }
  S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  ['w1','w2','b'].forEach(k=>bindCtl('nr-'+k,v=>{ st[k]=v; redraw(); },v=>N(v,2)));
  tabs(document.getElementById('nr-act'),t=>{ st.act=t; redraw(); });
  document.getElementById('nr-slope').addEventListener('click',e=>{ st.slope=!st.slope; e.currentTarget.setAttribute('aria-pressed',st.slope); redraw(); });
  let tw=null; document.getElementById('nr-play').addEventListener('click',()=>{ if(tw) tw.stop(); const b0=st.b;
    tw=tween(3600,u=>{ const v=-3+6*u; st.b=Math.round(v*20)/20; setCtl('nr-b',st.b,x=>N(x,2)); redraw(); },()=>{ st.b=b0; setCtl('nr-b',b0,x=>N(x,2)); redraw(); }); });
  readout();
  window.U15Neuron={st,redraw};
})();

/* ---------- §2 · w-acts: four bends and their slopes ---------- */
(function(){
  const svg=document.getElementById('ac-svg'); if(!svg) return;
  const read=document.getElementById('ac-read'); let z0=1;
  const KEYS=['relu','sigmoid','tanh','none'], TT={relu:'ReLU',sigmoid:'sigmoid',tanh:'tanh',none:'none'};
  function draw(){ svg.innerHTML=''; const glow=glo(svg), W=760, pw=150, gap=38, x0=38;
    KEYS.forEach((k,i)=>{ const A=ACTS[k], x=x0+i*(pw+gap);
      const top=panel(svg,x,26,pw,120,-6,6,k==='none'?-6:-1.2,k==='none'?6:1.2*(k==='relu'?5:1),{xs:3,ys:k==='none'?3:k==='relu'?2:1,title:TT[k]});
      const bot=panel(svg,x,178,pw,84,-6,6,-.1,1.15,{xs:3,ys:.5,title:'slope'});
      const path=(pn,f)=>{ let d=''; for(let t=0;t<=200;t++){ const zz=-6+12*t/200; d+=(t?'L':'M')+pn.px(zz).toFixed(1)+','+pn.cy(pn.py(f(zz))).toFixed(1); } return d; };
      glowPath(top.g,path(top,A.f),cv(K15.fwd),2.4,!!glow); glowPath(bot.g,path(bot,A.d),cv(K15.awake),2.2,!!glow);
      if(k==='sigmoid') glowLine(bot.g,bot.px(-6),bot.py(.25),bot.px(6),bot.py(.25),'var(--critical)',1,false,{'stroke-dasharray':'4 3',opacity:.8});
      [top,bot].forEach(pn=>el('line',{x1:pn.px(z0),y1:pn.y,x2:pn.px(z0),y2:pn.y+pn.h,stroke:'var(--ink-2)','stroke-width':1.2,'stroke-dasharray':'3 3'},pn.g));
      glowDot(top.g,top.px(z0),top.cy(top.py(A.f(z0))),4.5,cv(K15.fwd),glow); glowDot(bot.g,bot.px(z0),bot.cy(bot.py(A.d(z0))),4.5,cv(K15.awake),glow);
      txt(svg,x+pw,bot.y+bot.h+28,'slope '+N(A.d(z0),3),'font:700 11px system-ui;fill:'+cv(K15.awake),'end');
      txt(svg,x,bot.y+bot.h+28,'value '+N(A.f(z0),3),'font:700 11px system-ui;fill:'+cv(K15.fwd)); });
    read.innerHTML='at z = <b>'+N(z0,2)+'</b>: '+KEYS.map(k=>TT[k]+' slope <b>'+N(ACTS[k].d(z0),3)+'</b>').join(' · ');
    svg.dataset.z=z0; }
  bindCtl('ac-z',v=>{ z0=v; draw(); },v=>N(v,1));
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();
