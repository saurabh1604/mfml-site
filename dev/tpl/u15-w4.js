/* ================= UNIT 15 · Acts III–IV widgets: w-stepper, w-train1, w-canyon, w-depth ================= */

/* ---------- §8 · w-stepper: 17 steps — forward, seed, backward, update, re-run ---------- */
(function(){
  const root=document.getElementById('w-stepper'); if(!root) return;
  const netS=document.getElementById('st-net'), chS=document.getElementById('st-chain'), card=document.getElementById('st-card'), info=document.getElementById('st-info'), cacheEl=document.getElementById('st-cache'), scrub=document.getElementById('st-scrub'), count=document.getElementById('st-count');
  const G=netBackward(SAL,SAL_X,SAL_Y), C=G.cache, NET2=netStep(SAL,G,1e-5), C2=netForward(NET2,SAL_X), L2=netLoss(NET2,SAL_X,SAL_Y);
  const TAGS=['F1','F2','F3','F4','F5','F6','F7','S','B1','B2','B3','B4','B5','B6','B7','U','V'];
  /* chain nodes: value + blame */
  const NODES=[
    {k:'a0',t:'a⁽⁰⁾',v:C[0].a,g:G.dA[0]},{k:'z1',t:'z⁽¹⁾',v:C[1].z,g:G.dZ[1]},{k:'a1',t:'a⁽¹⁾',v:C[1].a,g:G.dA[1]},{k:'z2',t:'z⁽²⁾',v:C[2].z,g:G.dZ[2]},
    {k:'a2',t:'a⁽²⁾',v:C[2].a,g:G.dA[2]},{k:'z3',t:'z⁽³⁾',v:C[3].z,g:G.dZ[3]},{k:'yh',t:'ŷ',v:C[3].a,g:G.dA[3]},{k:'L',t:'L',v:[G.loss],g:[1]}];
  const OPS=['×W⁽¹⁾ + b⁽¹⁾','ReLU','×W⁽²⁾ + b⁽²⁾','ReLU','×W⁽³⁾ + b⁽³⁾','ReLU','½(ŷ − y)²'];
  const fwdN=s=>s<=6?s+2:8, bwdN=s=>s<7?0:s<=14?s-6:8;   /* how many nodes are known (from the left / from the right) */
  const arrowOf=s=>s<=6?s:(s>=8&&s<=14?14-s:-1);       /* which chain arrow the step crosses */
  const READS={9:'z3',10:'a2',11:'z2',12:'a1',13:'z1',14:'a0'};
  let s=0, sel=null, play=null, raf=null;
  const M=(rows,o)=>matHTML(rows,o), col=v=>colOf(v), eq=h=>`<div class="eqrow scroll-x">${h}</div>`, op=t=>`<span class="op">${t}</span>`, vn=t=>`<span class="vn">${t}</span>`;
  const rule=(k,t)=>`<span class="st-rule ${k}">${t}</span>`;
  const rows=list=>'<div class="fw-rows">'+list.map((t,i)=>`<div class="fw-row"><b>row ${i+1}</b> ${t}</div>`).join('')+'</div>';
  const P=v=>'('+N(v,4)+')';
  function linRows(W,a,b,z){ return rows(W.map((r,i)=>r.map((w,k)=>P(w)+P(a[k])).join(' + ')+(b[i]<0?' − '+N(-b[i]):' + '+N(b[i]))+' = <b class="k-fwd">'+N(z[i],4)+'</b>')); }
  function backRows(W,dz,da){ return rows(W[0].map((_,k)=>W.map((r,j)=>P(r[k])+P(dz[j])).join(' + ')+' = <b class="k-bwd">'+N(da[k],4)+'</b>')); }
  function body(s){ const t=TAGS[s];
    switch(t){
      case 'F1': case 'F3': case 'F5': { const l=(s/2)+1, W=SAL.W[l-1], b=SAL.b[l-1], a=C[l-1].a, z=C[l].z;
        return {title:(l===1?'a⁽⁰⁾':'a⁽'+(l-1)+'⁾')+' → z⁽'+l+'⁾', sub:'Linear arrow: multiply by W⁽'+l+'⁾, add b⁽'+l+'⁾.', rl:rule('f','forward'),
          html:eq(vn('z⁽'+l+'⁾')+op('=')+M(W,{tone:'par'})+M(col(a),{tone:'fwd'})+op('+')+M(col(b),{tone:'par'})+op('=')+M(col(z),{tone:'fwd'})+`<span class="mshape ok">${z.length}×1 ✓</span>`)+linRows(W,a,b,z)}; }
      case 'F2': case 'F4': case 'F6': { const l=(s+1)/2, z=C[l].z, a=C[l].a;
        const note=l===1?'The third neuron got −2, so ReLU switched it off. Watch what happens to it on the way back.':l===2?'Both entries are positive, so ReLU changes nothing here.':'z⁽³⁾ = 40 &gt; 0, so the last ReLU acts like "do nothing". The network predicts 40 lakhs.';
        return {title:'z⁽'+l+'⁾ → '+(l===3?'ŷ':'a⁽'+l+'⁾'), sub:'ReLU arrow: keep it if positive, else zero.', rl:rule('f','forward'),
          html:eq(vn(l===3?'ŷ':'a⁽'+l+'⁾')+op('= ReLU')+M(col(z),{tone:'fwd'})+op('=')+M(col(a),{tone:'fwd',cell:i=>z[i]>0?'':'dead'}))+`<p class="fw-note">${note}</p>`}; }
      case 'F7': return {title:'ŷ → L', sub:'The loss: how wrong is the guess?', rl:rule('f','forward'),
          html:eq(vn('L')+op('=')+' ½(ŷ − y)² '+op('=')+' ½(40 − 50)² '+op('=')+' ½(100) '+op('=')+'<b class="k-bwd">50</b>')+'<p class="fw-note">The error ŷ − y = <b class="k-bwd">−10</b>: the guess is 10 lakhs too low. The forward pass is done, and the cache is full.</p>'};
      case 'S': return {title:'The seed', sub:'Start the walk back at the loss itself.', rl:rule('s','start'),
          html:eq(vn('∂L/∂L')+op('=')+'<b class="k-bwd">1</b>')+'<p class="fw-note">From here we walk right to left, carrying one thing: the blame ∂L/∂(node) of the node we stand on. Every arrow is linear or ReLU, so two rules will do: <b>Rule A</b> for a ReLU arrow (a switch), <b>Rule B</b> for a linear arrow (outer product, and Wᵀ).</p>'};
      case 'B1': return {title:'Cross ŷ → L backwards', sub:'The slope of ½(ŷ − y)² is ŷ − y.', rl:rule('s','start'),
          html:eq(vn('∂L/∂ŷ')+op('=')+' ŷ − y '+op('=')+' 40 − 50 '+op('=')+M([[-10]],{tone:'bwd'}))+'<p class="fw-note">The ½ was there only to cancel the 2. Prediction minus truth — the seed of every other gradient.</p>'};
      case 'B2': case 'B4': case 'B6': { const l=(15-s)/2, z=C[l].z, g=G.dA[l], d=G.dZ[l], sw=z.map(v=>v>0?1:0);
        const note=l===3?'Stored z⁽³⁾ = 40 is positive, so the switch is on.':l===2?'Stored z⁽²⁾ = (6, 7): both switches on, the blame passes unchanged.':'Stored z⁽¹⁾ = (7, 4, −2). The third switch is <b>off</b>: the −20 is <b>blocked</b>. A neuron that slept on the way forward learns nothing on the way back.';
        return {title:'Cross z⁽'+l+'⁾ → '+(l===3?'ŷ':'a⁽'+l+'⁾')+' backwards', sub:'Rule A: multiply by the switch ReLU′(z).', rl:rule('a','Rule A'),
          html:eq(vn('∂L/∂z⁽'+l+'⁾')+op('=')+M(col(g),{tone:'bwd'})+op('⊙')+M(col(sw),{tone:'gold',cell:i=>sw[i]?'':'dead'})+op('=')+M(col(d),{tone:'bwd',cell:i=>sw[i]?'':'zero'}))+`<p class="fw-note">${note}</p>`}; }
      case 'B3': case 'B5': case 'B7': { const l=(16-s)/2, W=SAL.W[l-1], a=C[l-1].a, d=G.dZ[l], dW=G.dW[l], dA=G.dA[l-1];
        const note=l===3?'The neuron with the bigger weight (4 against 2) gets twice the blame. That is all Wᵀ is doing.':l===2?'The third column of ∂L/∂W⁽²⁾ is all zero: it multiplied a⁽¹⁾₃ = 0. A weight that carried nothing gets no blame.':'The whole third row is zero — the sleeping neuron\'s weights will not move this step. (∂L/∂a⁽⁰⁾ is shown in the chain, but no weight sits before the input, so nothing uses it.)';
        return {title:(l===1?'a⁽⁰⁾':'a⁽'+(l-1)+'⁾')+' → z⁽'+l+'⁾ backwards', sub:'Rule B: three results — the weights, the shifts, the layer below.', rl:rule('b','Rule B'),
          html:eq(vn('∂L/∂W⁽'+l+'⁾')+op('=')+M(col(d),{tone:'bwd'})+M([a],{tone:'fwd'})+op('=')+M(dW,{tone:'bwd',cell:(i,j)=>Math.abs(dW[i][j])<1e-12?'zero':''})+`<span class="mshape">${dW.length}×${dW[0].length}</span>`)+
            eq(vn('∂L/∂b⁽'+l+'⁾')+op('=')+M(col(d),{tone:'bwd'})+op('&nbsp;&nbsp;')+vn('∂L/∂a⁽'+(l-1)+'⁾')+op('= W⁽'+l+'⁾ᵀ·')+M(col(d),{tone:'bwd'})+op('=')+M(col(dA),{tone:'bwd'}))+(l===2?backRows(W,d,dA):'')+`<p class="fw-note">${note}</p>`}; }
      case 'U': { const f=v=>N(v,4); const chg=(A,B)=>(i,j)=>Math.abs(A[i][j]-B[i][j])>1e-12?'hot':'';
        return {title:'Update every weight', sub:'θ ← θ − η ∂L/∂θ with η = 10⁻⁵.', rl:rule('u','update'),
          html:'<p class="fw-note" style="margin-top:0">For example 0.1 − 10⁻⁵(−1800) = 0.1 + 0.018 = 0.118. Gold = changed; the rest had zero gradient.</p>'+
            eq(vn('W⁽¹⁾')+op('=')+M(NET2.W[0],{tone:'par',d:4,cell:chg(NET2.W[0],SAL.W[0])})+vn('b⁽¹⁾')+op('=')+M(col(NET2.b[0]),{tone:'par',d:4,cell:chg(col(NET2.b[0]),col(SAL.b[0]))}))+
            eq(vn('W⁽²⁾')+op('=')+M(NET2.W[1],{tone:'par',d:4,cell:chg(NET2.W[1],SAL.W[1])})+vn('b⁽²⁾')+op('=')+M(col(NET2.b[1]),{tone:'par',d:4,cell:chg(col(NET2.b[1]),col(SAL.b[1]))}))+
            eq(vn('W⁽³⁾')+op('=')+M(NET2.W[2],{tone:'par',d:4,cell:chg(NET2.W[2],SAL.W[2])})+vn('b⁽³⁾')+op('=')+M(col(NET2.b[2]),{tone:'par',d:4,cell:()=> 'hot'}))}; }
      case 'V': return {title:'Run the chain forward again', sub:'Did one pass of backprop help?', rl:rule('f','forward'),
          html:eq(vn('z⁽¹⁾')+op('=')+M(col(C2[1].z),{tone:'fwd',d:4})+vn('a⁽²⁾')+op('=')+M(col(C2[2].a),{tone:'fwd',d:4})+vn('ŷ')+op('=')+M([[C2[3].a[0]]],{tone:'fwd',d:4}))+
            `<div class="st-win">loss <b>50</b> → <b>${N(L2,2)}</b> · error −10 → ${N(C2[3].a[0]-SAL_Y,2)} · prediction 40 → ${N(C2[3].a[0],2)}</div><p class="fw-note">Repeat the pair a few hundred times and the error goes to zero.</p>`};
    } }
  /* ---- the network picture ---- */
  /* narrow screens: a taller canvas and ~1.7× text so every label is ≥ 11 px on a 390 px phone */
  const narrowOf=svg=>{ const w=svg.getBoundingClientRect().width; return w>0&&w<560; };
  let NW=false, K=1, NR=17;
  const LX=[60,200,340,470], pos=(l,i)=>{ const n=[2,3,2,1][l]; return NW?[[62,195,330,462][l],212+(i-(n-1)/2)*122]:[LX[l],172+(i-(n-1)/2)*92]; };
  const fs=(w,px)=>'font:'+w+' '+(px*K).toFixed(1)+'px system-ui;';
  let pulses=[];
  function drawNet(){ netS.innerHTML=''; NW=narrowOf(netS); K=NW?1.75:1; NR=NW?23:17; netS.setAttribute('viewBox',NW?'0 0 520 440':'0 0 520 330'); const glow=glo(netS), fN=fwdN(s), bN=bwdN(s);
    const zKnown=l=>fN>=[1,2,4,6][l], aKnown=l=>fN>=[1,3,5,7][l], gKnown=l=>bN>=[0,7,5,3][l]&&l>0;   /* chain indices: z1=1,a1=2,z2=3,a2=4,z3=5,ŷ=6 */
    const act=[-1,-1,-1]; if(s===0) act[0]='f'; if(s===2) act[1]='f'; if(s===4) act[2]='f'; if(s===10) act[2]='b'; if(s===12) act[1]='b'; if(s===14) act[0]='b';
    const asleep=(l,i)=>l>0&&l<3&&aKnown(l)&&C[l].z[i]<=0;
    pulses=[];
    SAL.W.forEach((W,l)=>W.forEach((row,j)=>row.forEach((w,k)=>{ const [x1,y1]=pos(l,k),[x2,y2]=pos(l+1,j), on=act[l];
      const carried=on==='f'?Math.abs(w*C[l].a[k])>1e-12:on==='b'?Math.abs(w*G.dZ[l+1][j])>1e-12:false;
      const colr=on==='f'?cv(K15.fwd):on==='b'?'var(--critical)':cv(w>=0?K15.pos:K15.neg);
      const dead=asleep(l,k)||(l+1<3&&asleep(l+1,j)&&on==='b');
      el('line',{x1:x1+NR,y1,x2:x2-NR,y2,stroke:colr,'stroke-width':on&&carried?2.6:1.1+2.6*Math.min(1,Math.sqrt(Math.abs(w))/2),'stroke-linecap':'round',opacity:dead?.22:(on?(carried?.95:.3):.6)},netS);
      if(on&&carried) pulses.push({x1:x1+NR,y1,x2:x2-NR,y2,dir:on,color:colr}); })));
    [2,3,2,1].forEach((n,l)=>{ for(let i=0;i<n;i++){ const [x,y]=pos(l,i), sl=asleep(l,i), zk=zKnown(l), ak=aKnown(l), gk=gKnown(l);
      if(glow&&ak&&!sl) el('circle',{cx:x,cy:y,r:NR+7,fill:cv(K15.fwd),opacity:.13},netS);
      el('circle',{cx:x,cy:y,r:NR,fill:sl?'color-mix(in srgb,var(--ink-muted) 22%,transparent)':'var(--surface-2, var(--surface))',stroke:sl?'var(--ink-muted)':l===0?cv(K15.fwd):l===3?'var(--ink)':cv(K15.awake),'stroke-width':2,'stroke-dasharray':sl?'3 3':null},netS);
      if(ak) txt(netS,x,y+4.5*K,N(C[l].a[i],2),fs(700,12)+'fill:'+(sl?'var(--ink-muted)':'var(--ink)'),'middle');
      if(l>0&&zk) txt(netS,x,y-NR-8,'z '+N(C[l].z[i],2),fs(600,10.5)+'fill:'+cv(K15.fwd),'middle');
      if(l===0) txt(netS,NW?x:x-NR-6,NW?y-NR-8:y+4,i?'exp':'age',fs(600,10.5)+'fill:var(--ink-2)',NW?'middle':'end');
      if(gk) txt(netS,x,y+NR+17*K,N(G.dZ[l][i],2),fs(700,11)+'fill:var(--critical)','middle'); } });
    [['input',0],['hidden 1',1],['hidden 2',2],['output',3]].forEach(([t,l])=>txt(netS,pos(l,0)[0],NW?432:320,t,fs(600,10)+'fill:var(--ink-muted)','middle'));
    txt(netS,512,NW?24:22,'above: z · inside: a · below: ∂L/∂z',fs(600,NW?9.4:10)+'fill:var(--ink-muted)','end');
    pulses.forEach(p=>{ p.el=el('circle',{r:4.5,fill:p.color,opacity:0},netS); if(glow) p.el.setAttribute('filter',glow); });
    if(!raf&&pulses.length&&!RM) raf=requestAnimationFrame(animate); }
  function animate(t){ raf=null; if(!pulses.length||!document.body.contains(netS)) return; const u=(t/900)%1;
    pulses.forEach(p=>{ const v=p.dir==='f'?u:1-u; p.el.setAttribute('cx',p.x1+(p.x2-p.x1)*v); p.el.setAttribute('cy',p.y1+(p.y2-p.y1)*v); p.el.setAttribute('opacity',Math.sin(Math.PI*u)**.6); });
    raf=requestAnimationFrame(animate); }
  /* ---- the chain ---- */
  function drawChain(){ chS.innerHTML=''; const fN=fwdN(s), bN=bwdN(s), ar=arrowOf(s), nw=narrowOf(chS.parentNode), k=nw?1.55:1;
    /* wide: one row of eight; narrow: two rows of four, so nothing scrolls sideways */
    chS.setAttribute('viewBox',nw?'0 0 420 345':'0 0 760 150'); chS.style.minWidth=nw?'0':'';
    const bw=nw?82:70, step=nw?104:94, bx=i=>nw?12+(i%4)*step:18+i*94, by=i=>nw?(i<4?8:192):8, F=(w,px)=>'font:'+w+' '+(px*k).toFixed(1)+'px system-ui;';
    const vec=v=>v.length>1?'('+v.map(x=>N(x,2)).join(', ')+')':N(v[0],2);
    NODES.forEach((n,i)=>{ const x=bx(i), y=by(i), isL=n.k==='L', on=sel===n.k, g=el('g',{style:'cursor:pointer','data-node':n.k,role:'button','aria-label':'inspect '+n.t},chS);
      el('rect',{x,y,width:bw,height:30*(nw?1.25:1),rx:8,fill:isL?'color-mix(in srgb,var(--critical) 18%,transparent)':'color-mix(in srgb,var(--s1) 13%,transparent)',stroke:on?cv(K15.awake):isL?'var(--critical)':cv(K15.fwd),'stroke-width':on?2.6:1.5},g);
      txt(g,x+bw/2,y+(nw?25:20),n.t,F(700,13)+'fill:var(--ink)','middle');
      const vk=i<fN, gk=i>=8-bN, yv=y+(nw?64:58), yg=y+(nw?94:84), long=nw&&(n.v.length>2||n.g.length>2);
      txt(chS,x+bw/2,yv,vk?vec(n.v):'·',F(600,long?9.8:10.5)+'fill:'+cv(K15.fwd),'middle');
      txt(chS,x+bw/2,yg,gk?vec(n.g):'·',F(700,long?9.8:10.5)+'fill:var(--critical)','middle');
      if(i<7){ const on2=ar===i, back=s>=8, colr=on2?(back?'var(--critical)':cv(K15.fwd)):'var(--ink-muted)', hy=y+(nw?19:15);
        if(nw&&i===3){ /* wrap: down the right side and back to the start of row two */
          const X=x+bw+8, Y2=by(4)+19; el('path',{d:`M${x+bw+2},${hy}H${X}V${Y2-36}H${bx(4)-4}V${Y2}H${bx(4)-1}`,fill:'none',stroke:colr,'stroke-width':on2?3:1.4},chS);
          txt(chS,210,Y2-42,OPS[i],F(600,9.5)+'fill:'+cv(K15.awake),'middle'); }
        else { el('line',{x1:x+bw+2,y1:hy,x2:x+step-2,y2:hy,stroke:colr,'stroke-width':on2?3:1.4},chS);
          if(on2) el('polygon',{points:back?`${x+bw+2},${hy} ${x+bw+10},${hy-5} ${x+bw+10},${hy+5}`:`${x+step-2},${hy} ${x+step-10},${hy-5} ${x+step-10},${hy+5}`,fill:colr},chS);
          txt(chS,x+bw+(step-bw)/2,nw?y+120:118+(i%2)*14,OPS[i],F(600,9.5)+'fill:'+(OPS[i]==='ReLU'?cv(K15.awake):'var(--ink-muted)'),'middle'); } } });
    if(!nw){ txt(chS,4,66,'value','font:700 9px system-ui;fill:'+cv(K15.fwd)); txt(chS,4,92,'∂L/∂','font:700 9px system-ui;fill:var(--critical)'); }
    else txt(chS,410,340,'blue: value · red: ∂L/∂(node)',F(600,8)+'fill:var(--ink-muted)','end');
    chS.querySelectorAll('[data-node]').forEach(g=>g.addEventListener('click',()=>{ sel=g.dataset.node; renderInfo(); drawChain(); })); }
  function renderInfo(){ if(!sel){ info.textContent='Click a box of the chain.'; return; } const i=NODES.findIndex(n=>n.k===sel), n=NODES[i], fN=fwdN(s), bN=bwdN(s);
    const V=n.v.length>1?vecN(n.v,4):N(n.v[0],4), Gd=n.g.length>1?vecN(n.g,4):N(n.g[0],4);
    const local={a0:'the input — nothing comes before it',z1:'the next arrow is ReLU: slope ReLU′(z⁽¹⁾) = (1, 1, 0)',a1:'the next arrow is ×W⁽²⁾: going back, multiply by W⁽²⁾ᵀ',z2:'ReLU′(z⁽²⁾) = (1, 1)',a2:'the next arrow is ×W⁽³⁾: going back, multiply by W⁽³⁾ᵀ',z3:'ReLU′(z⁽³⁾) = 1',yh:'∂L/∂ŷ = ŷ − y',L:'the end of the chain'}[n.k];
    info.innerHTML='<b>'+n.t+'</b> · value '+(i<fN?'<b class="k-fwd">'+V+'</b>':'not computed yet')+'<br>local slope: '+local+'<br>blame ∂L/∂'+n.t+': '+(i>=8-bN?'<b class="k-bwd">'+Gd+'</b>':'not reached yet'); }
  function renderCache(){ const fN=fwdN(s), rd=READS[s];
    cacheEl.innerHTML='<span class="lbl">cache</span>'+NODES.slice(0,6).map((n,i)=>{ const filled=i<fN, reading=rd===n.k, used=s>=8&&Object.entries(READS).some(([st,k])=>k===n.k&&+st<s);
      return `<span class="st-c${filled?' on':''}${reading?' read':''}${used?' used':''}">${n.t} ${filled?(n.v.length>1?vecN(n.v,2):N(n.v[0],2)):'…'}${reading?' ← read now':''}</span>`; }).join(''); }
  function render(){ const b=body(s); scrub.querySelectorAll('button').forEach((x,i)=>{ x.setAttribute('aria-selected',i===s?'true':'false'); x.classList.toggle('done',i<s); });
    const ph=s<=6?'FORWARD':s<=14?(s===7?'START':'BACKWARD'):s===15?'UPDATE':'RE-RUN';
    card.innerHTML=`<div class="st-head"><span class="st-badge ${s<=6||s===16?'f':s===15?'u':'b'}">${ph} · ${TAGS[s]}</span>${b.rl}</div><h4 class="st-title">${b.title}</h4><p class="st-sub">${b.sub}</p>${b.html}`;
    count.textContent='step '+(s+1)+' / 17'; drawNet(); drawChain(); renderCache(); renderInfo(); root.dataset.step=TAGS[s]; }
  scrub.innerHTML=TAGS.map((t,i)=>`<button role="tab" data-i="${i}" aria-selected="${i===0}" class="${i<=6?'f':i<=14?'b':'u'}">${t}</button>`).join('');
  scrub.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ stop(); s=+b.dataset.i; render(); }));
  const stop=()=>{ if(play){ clearTimeout(play); play=null; } document.getElementById('st-play').textContent='▶ play'; };
  document.getElementById('st-prev').addEventListener('click',()=>{ stop(); s=Math.max(0,s-1); render(); });
  document.getElementById('st-next').addEventListener('click',()=>{ stop(); s=Math.min(16,s+1); render(); });
  document.getElementById('st-reset').addEventListener('click',()=>{ stop(); s=0; sel=null; render(); });
  document.getElementById('st-play').addEventListener('click',e=>{ if(play){ stop(); return; } if(s>=16) s=0; e.currentTarget.textContent='❚❚ pause'; const go=()=>{ render(); if(s>=16){ stop(); return; } play=setTimeout(()=>{ s++; go(); },RM?1200:2300); }; go(); });
  root.addEventListener('keydown',e=>{ if(e.target.closest('input')) return; if(e.key==='ArrowRight'){ stop(); s=Math.min(16,s+1); render(); e.preventDefault(); } if(e.key==='ArrowLeft'){ stop(); s=Math.max(0,s-1); render(); e.preventDefault(); } });
  root.tabIndex=-1;
  render(); new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  let lastNW=null; addEventListener('resize',()=>{ const n=narrowOf(netS); if(n!==lastNW){ lastNW=n; drawNet(); drawChain(); } });
  window.U15Stepper={go(i){ stop(); s=i; render(); }, select(k){ sel=k; render(); }, get step(){ return TAGS[s]; }, L2};
})();

/* ---------- §9 · w-train1: train on the one example; check every gradient ---------- */
(function(){
  const svg=document.getElementById('tr-svg'); if(!svg) return;
  const read=document.getElementById('tr-read'), gc=document.getElementById('tr-gc');
  const scaledNet=()=>{ const n=clone(SAL); n.W[0]=n.W[0].map(r=>[r[0]*100,r[1]*10]); return n; };
  const st={eta:1e-5,scaled:false,net:clone(SAL),x:SAL_X.slice(),hist:[],run:null};
  function reset(){ stop(); st.net=st.scaled?scaledNet():clone(SAL); st.x=st.scaled?[.3,1]:SAL_X.slice(); const c=netForward(st.net,st.x); st.hist=[{L:netLoss(st.net,st.x,SAL_Y),y:c[3].a[0]}]; draw(); gc.innerHTML=''; }
  function step(){ const g=netBackward(st.net,st.x,SAL_Y); st.net=netStep(st.net,g,st.eta); const c=netForward(st.net,st.x), L=netLoss(st.net,st.x,SAL_Y); st.hist.push({L,y:c[3].a[0],dead:c[1].z.every(v=>v<=0)}); }
  function draw(){ svg.innerHTML=''; const glow=glo(svg), n=st.hist.length-1, T=Math.max(40,n);
    const lp=panel(svg,52,24,250,230,0,T,-8,7,{ys:3,xs:T>200?100:T>80?40:10,title:'loss (log scale)',yf:v=>'10'+SUP(v)});
    const yp=panel(svg,370,24,250,230,0,T,0,100,{ys:25,xs:T>200?100:T>80?40:10,title:'prediction ŷ'});
    el('line',{x1:yp.x,y1:yp.py(50),x2:yp.x+yp.w,y2:yp.py(50),stroke:'var(--ink)','stroke-width':1.3,'stroke-dasharray':'6 4',opacity:.7},svg); txt(svg,yp.x+yp.w-4,yp.py(50)-6,'truth 50','font:600 10px system-ui;fill:var(--ink-2)','end');
    const lg=v=>Math.log10(Math.max(1e-8,Math.min(1e7,v)));
    const dL=st.hist.map((h,i)=>(i?'L':'M')+lp.px(i).toFixed(1)+','+lp.cy(lp.py(isFinite(h.L)?lg(h.L):7)).toFixed(1)).join('');
    const dY=st.hist.map((h,i)=>(i?'L':'M')+yp.px(i).toFixed(1)+','+yp.cy(yp.py(isFinite(h.y)?h.y:100)).toFixed(1)).join('');
    glowPath(el('g',{'clip-path':lp.clip},svg),dL,'var(--critical)',2.4,!!glow); glowPath(el('g',{'clip-path':yp.clip},svg),dY,cv(K15.fwd),2.4,!!glow);
    const h=st.hist[n]; glowDot(svg,lp.px(n),lp.cy(lp.py(lg(h.L))),4,'var(--critical)',glow); glowDot(svg,yp.px(n),yp.cy(yp.py(h.y)),4,cv(K15.fwd),glow);
    txt(svg,lp.x+lp.w/2,lp.y+lp.h+26,'step','font:500 10px system-ui;fill:var(--ink-muted)','middle'); txt(svg,yp.x+yp.w/2,yp.y+yp.h+26,'step','font:500 10px system-ui;fill:var(--ink-muted)','middle');
    const up=n>0&&h.L>st.hist[n-1].L*1.0000001, dead=h.dead;
    let msg=dead?'<b class="k-bwd">dead:</b> every hidden-1 neuron is asleep, ŷ is stuck at 0, and every gradient before them is 0.':up?'<b class="k-bwd">overshoot:</b> the loss went <b>up</b> on the last step.':n&&h.L<1e-6?'<b class="k-fwd">converged:</b> ŷ ≈ 50.':'';
    read.innerHTML='η = <b>'+etaS(st.eta)+'</b> · inputs '+(st.scaled?'<b>scaled</b> (0.3, 1)':'raw (30, 10)')+'<br>step <b>'+n+'</b> · ŷ = <b>'+(isFinite(h.y)?N(h.y,4):'∞')+'</b> · L = <b>'+(isFinite(h.L)?(h.L>=1e-4?N(h.L,4):sci(h.L,2)):'∞')+'</b>'+(msg?'<br>'+msg:'');
    svg.dataset.step=n; svg.dataset.loss=h.L; svg.dataset.yhat=h.y; }
  const etaS=v=>{ const e=Math.floor(Math.log10(v)+1e-9), m=v/10**e; return (Math.abs(m-1)<1e-6?'':trim(m.toFixed(2))+'×')+'10'+SUP(e); };
  const stop=()=>{ if(st.run){ cancelAnimationFrame(st.run); st.run=null; document.getElementById('tr-run').textContent='▶ run'; } };
  bindCtl('tr-eta',v=>{ st.eta=Math.pow(10,v); },v=>etaS(Math.pow(10,v)));
  document.getElementById('tr-step').addEventListener('click',()=>{ stop(); step(); draw(); });
  document.getElementById('tr-run').addEventListener('click',e=>{ if(st.run){ stop(); return; } e.currentTarget.textContent='❚❚ pause';
    const fr=()=>{ for(let k=0;k<3;k++){ const h=st.hist[st.hist.length-1]; if(st.hist.length>400||!isFinite(h.L)||h.L<1e-12){ draw(); stop(); return; } step(); } draw(); st.run=requestAnimationFrame(fr); }; st.run=requestAnimationFrame(fr); });
  document.getElementById('tr-reset').addEventListener('click',reset);
  document.getElementById('tr-scale').addEventListener('click',e=>{ st.scaled=!st.scaled; e.currentTarget.setAttribute('aria-pressed',st.scaled); reset(); });
  function check(){ const g=netBackward(st.net,st.x,SAL_Y), P=netParams(st.net), h=1e-5; let worst=0;
    const rowsH=P.map(p=>{ const n1=clone(st.net), n2=clone(st.net); pSet(n1,p,pGet(st.net,p)+h); pSet(n2,p,pGet(st.net,p)-h);
      const fd=(netLoss(n1,st.x,SAL_Y)-netLoss(n2,st.x,SAL_Y))/(2*h), bp=gGet(g,p), rel=Math.abs(fd-bp)/Math.max(1e-12,Math.abs(fd)+Math.abs(bp)), relS=(Math.abs(fd)+Math.abs(bp))<1e-12?'both 0':sci(rel,1); if(Math.abs(fd)+Math.abs(bp)>1e-9) worst=Math.max(worst,rel);
      return `<tr><th>${p.name}</th><td>${N(bp,6)}</td><td>${N(fd,6)}</td><td>${relS}</td></tr>`; });
    gc.innerHTML='<tr><th>number</th><td><b>backprop</b></td><td><b>finite difference</b></td><td><b>relative gap</b></td></tr>'+rowsH.join('')+`<tr><th>worst</th><td></td><td></td><td><b>${sci(worst,1)}</b></td></tr>`;
    gc.dataset.worst=worst; return worst; }
  document.getElementById('tr-check').addEventListener('click',check);
  reset(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.U15Train={st,step,reset,check};
})();

/* ---------- §9 · w-canyon: the loss over two knobs (3-D) ---------- */
(function(){
  const box=document.getElementById('cy-3d'); if(!box||!CIN) return;
  const read=document.getElementById('cy-read');
  const st={eta:1e-5,scaled:false,path:[],t:1};
  const base=()=>{ const n=clone(SAL); if(st.scaled) n.W[0]=n.W[0].map(r=>[r[0]*100,r[1]*10]); return n; };
  const X=()=>st.scaled?[.3,1]:SAL_X;
  const R=()=>st.scaled?8:.5;                             /* both axes span ±R in their own units */
  const lossAt=(u,v)=>{ const n=base(); n.W[0][0][0]+=u; n.b[2][0]+=v; return netLoss(n,X(),SAL_Y); };
  const H=L=>Math.log10(1+L)*.62;
  function roll(){ let u=0,v=0; const P=[[u,v,lossAt(u,v)]];
    for(let i=0;i<40;i++){ const n=base(); n.W[0][0][0]+=u; n.b[2][0]+=v; const g=netBackward(n,X(),SAL_Y); u-=st.eta*g.dW[1][0][0]; v-=st.eta*g.db[3][0];
      const L=lossAt(u,v); P.push([u,v,L]); if(!isFinite(L)||Math.abs(u)>R()*3||Math.abs(v)>R()*3) break; }
    st.path=P; }
  function readout(){ const P=st.path, last=P[P.length-1], out=Math.abs(last[0])>R()||Math.abs(last[1])>R();
    read.innerHTML=(st.scaled?'<b>scaled</b> inputs · window ±8':'<b>raw</b> inputs · window ±0.5')+' · η = <b>'+etaTxt(st.eta)+'</b><br>'+
      'slope of ŷ along W⁽¹⁾₁₁: <b>'+(st.scaled?'1.8':'180')+'</b> · along b⁽³⁾: <b>1</b><br>'+
      (out?'<b class="k-bwd">the ball flew out of the window</b> on step '+(P.length-1)+' (loss '+big(last[2],1)+')':'after '+(P.length-1)+' steps: loss <b>'+(last[2]>=1e-3?N(last[2],3):sci(last[2],1))+'</b>');
    box.dataset.state=[st.scaled?'scaled':'raw',st.eta,P.length-1,last[2]].join(','); }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[4.6,4.2,5.4],look:[0,.6,0],fov:38},orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,isLight,colors}=ctx, hx=hxOf(ctx);
      starfield(ctx,240,16); glassFloor(ctx,4.6,{div:24});
      const S=2/1;   /* the window maps to [−2, 2] in the scene */
      const surf=CIN.prim.surface(ctx,(x,y)=>0,{x:[-2,2],y:[-2,2],res:90,opacity:.86}); root.add(surf);
      const grp=new THREE.Group(); root.add(grp);
      const lblU=lab(ctx,'W⁽¹⁾₁₁ →',[2.35,.05,0],{size:22,scale:.009,color:colors.ink2,bg:true}), lblV=lab(ctx,'← b⁽³⁾',[-.2,.05,2.4],{size:22,scale:.009,color:colors.ink2,bg:true}); root.add(lblU,lblV);
      ctx.redraw=()=>{ const r=R(), c=ctx.colors; reshape(ctx,surf,(x,y)=>H(lossAt(x/2*r,y/2*r)),1,[c.s6,c.s7,c.s2],.8);
        clearGroup(grp); const P=st.path, n=Math.max(1,Math.round((P.length-1)*st.t)), pts=[];
        for(let i=0;i<=Math.min(n,P.length-1);i++){ const [u,v,L]=P[i]; if(Math.abs(u)>r*1.02||Math.abs(v)>r*1.02){ break; } pts.push([u/r*2,H(L)+.05,-v/r*2]); }
        if(pts.length>1) grp.add(overlay(polyTube(ctx,pts,hx(K15.awake),.02,true),11));
        if(pts.length){ const d=CIN.prim.dot(ctx,pts[pts.length-1],hx(K15.fwd),.08); grp.add(overlay(d,12)); const h=haloSprite(ctx,hx(K15.fwd),.5); h.position.set(...pts[pts.length-1]); grp.add(h); }
        const s0=CIN.prim.dot(ctx,[0,H(P[0][2])+.05,0],hx('ink'),.05); grp.add(overlay(s0,12));
        RR(ctx); };
      ctx.redraw();
    }}); }
  roll(); S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  const bar=document.getElementById('cy-eta');
  bar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ st.eta=+b.dataset.eta; pressOnly(bar,b); roll(); st.t=1; redraw(); }));
  document.getElementById('cy-scale').addEventListener('click',e=>{ st.scaled=!st.scaled; e.currentTarget.setAttribute('aria-pressed',st.scaled); roll(); st.t=1; redraw(); });
  let tw=null; document.getElementById('cy-play').addEventListener('click',()=>{ if(tw) tw.stop(); roll(); let last=-1; tw=tween(3000,u=>{ const q=Math.round(u*40)/40; if(q!==last){ last=q; st.t=q; if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); } },()=>{ st.t=1; redraw(); }); });
  readout();
  window.U15Canyon={st,roll,lossAt};
})();

/* ---------- §10 · w-depth: the blame tower (3-D) ---------- */
(function(){
  const box=document.getElementById('dp-3d'); if(!box||!CIN) return;
  const read=document.getElementById('dp-read');
  const WID=4, st={act:'sigmoid',n:12,bias:0,scale:1,seed:7,t:1};
  let RAW=null;
  function weights(){ const r=seeded(st.seed); RAW=[]; for(let l=0;l<21;l++){ RAW.push(Array.from({length:l===20?1:WID},()=>Array.from({length:WID},()=>gauss2(r)))); } }
  const X0=[1,-.5,.8,.3];
  /* start from weights where, at bias 0, every ReLU layer keeps at least one neuron awake for scales ½, 1 and 2 (so the ReLU picture is fair) */
  (function(){ for(let k=0;k<400;k++){ weights(); let good=true; for(const sc of [.5,1,2]){ let a=X0.slice(); for(let l=0;l<20&&good;l++){ const z=matVec(RAW[l].map(r=>r.map(v=>v*sc*Math.SQRT1_2)),a); if(z.every(v=>v<=0)) good=false; a=z.map(v=>Math.max(0,v)); } }
      if(good) return; st.seed=(st.seed*48271)%2147483647; } })();
  function net(){ const W=[], b=[], act=[]; const s=st.scale*Math.sqrt(2/WID);   /* ×1 = the careful start √(2/fan-in) */
    for(let l=0;l<st.n;l++){ W.push(RAW[l].map(r=>r.map(v=>v*s))); b.push(new Array(WID).fill(st.bias)); act.push(st.act); }
    W.push(RAW[20].map(r=>r.map(v=>v*s))); b.push([0]); act.push('none'); return {W,b,act}; }
  function compute(){ const n=net(), g=netBackward(n,X0,1), L=n.W.length;
    const size=[]; for(let l=1;l<=L;l++){ size.push(Math.sqrt(g.dZ[l].reduce((s,v)=>s+v*v,0))); }   /* the blame that gets through each layer's bend: ‖∂L/∂z⁽ˡ⁾‖ */
    const awake=[]; for(let l=1;l<L;l++) awake.push(g.cache[l].z.map(z=>st.act==='relu'?z>0:true));
    return {size,awake,cache:g.cache,loss:g.loss}; }
  function readout(R){ const top=R.size[R.size.length-2]!=null?R.size[R.size.length-2]:R.size[0], bot=R.size[0], ratio=bot/(top||1e-300);
    const asleep=R.awake.reduce((s,a)=>s+a.filter(v=>!v).length,0);
    read.innerHTML='blame at the top hidden layer: <b>'+sci(top,1)+'</b><br>at the first layer: <b>'+sci(bot,1)+'</b> — '+(bot===0?'<b class="k-bwd">no blame arrives at all</b>':'× <b>'+sci(ratio,1)+'</b> of the top')+'<br>sleeping neurons: <b>'+asleep+'</b> of '+(st.n*WID)+(st.act!=='relu'?' (sigmoid and tanh never switch fully off)':'');
    box.dataset.ratio=ratio; box.dataset.bottom=bot; box.dataset.asleep=asleep; }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[5.6,3.2,7.2],look:[.9,2.2,0],fov:40},orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,isLight,colors}=ctx, hx=hxOf(ctx);
      starfield(ctx,260,18); glassFloor(ctx,6,{div:24});
      const grp=new THREE.Group(); root.add(grp);
      ctx.redraw=()=>{ clearGroup(grp); const R=compute(), n=st.n, DY=Math.min(.42,5.4/(n+1)), y=l=>.25+l*DY;   /* l = 0 input … n hidden … n+1 output */
        /* the stem and the discs */
        grp.add(tube(ctx,[0,y(0),0],[0,y(n+1),0],hx('ink2'),.012,.4));
        for(let l=0;l<=n+1;l++){ const isH=l>=1&&l<=n, rr=l===n+1?.28:.62;
          const disc=new THREE.Mesh(new THREE.CylinderGeometry(rr,rr,.02,40),new THREE.MeshStandardMaterial({color:hx(l===n+1?'critical':K15.accent),transparent:true,opacity:isLight?.18:.14,depthWrite:false})); disc.position.y=y(l); grp.add(disc);
          if(l===0||isH) for(let i=0;i<WID;i++){ const a=i/WID*Math.PI*2+.4, on=l===0?true:R.awake[l-1][i]; const d=CIN.prim.dot(ctx,[Math.cos(a)*.42,y(l),Math.sin(a)*.42],on?hx(l===0?K15.fwd:K15.awake):hx('muted'),.06); if(!on){ d.material.emissiveIntensity=0; } grp.add(d); }
          /* the gradient bar for this layer's incoming weights (layers 1 … n+1) */
          if(l>=1){ const g=R.size[l-1], shown=st.t*(n+1)>=(n+1-l); const lg=g>0?Math.log10(g):-12, len=Math.max(0,(lg+9)/9)*3.2;
            if(shown&&len>0){ const b=tube(ctx,[.75,y(l),0],[.75+len,y(l),0],hx('critical'),.028+.03*Math.min(1,len/3.2),isLight?.9:.95); grp.add(b);
              for(let e=-8;e<=lg;e++){ const x=.75+(e+9)/9*3.2; if(x<.75+len-.02){ const ring=new THREE.Mesh(new THREE.TorusGeometry(.05,.008,6,18),new THREE.MeshBasicMaterial({color:hx('ink'),transparent:true,opacity:.5})); ring.rotation.y=Math.PI/2; ring.position.set(x,y(l),0); grp.add(ring); } } }
            if(shown&&l===1) grp.add(lab(ctx,g>0?'first layer: '+sci(g,1):'first layer: 0',[.75+Math.max(len,.2)+.75,y(l),0],{size:20,scale:.0085,color:cssv('critical'),bg:true})); }
        }
        grp.add(lab(ctx,'loss',[0,y(n+1)+.3,0],{size:20,scale:.0085,color:cssv('critical'),bg:true})); grp.add(lab(ctx,'input',[0,y(0)-.25,0],{size:20,scale:.0085,color:colors.s1,bg:true}));
        /* the pulse */
        if(st.t<1){ const yy=y(n+1)-(y(n+1)-y(0))*st.t; const h=haloSprite(ctx,hx('critical'),.9); h.position.set(0,yy,0); grp.add(h); }
        if(ctx.orbit){ ctx.look.set(1.3,y((n+1)/2),0); ctx.orbit.sph.radius=5.4+n*.3; ctx.orbit.place(); }
        readout(R); RR(ctx); };
      ctx.redraw();
      setTimeout(()=>{ if(!ctx.dead&&ctx.orbit) ctx.redraw(); },0);   /* the orbit exists only after build(): place the camera again */
    }}); }
  S3=mountStage(box,build);
  const redraw=()=>{ if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); else readout(compute()); };
  tabs(document.getElementById('dp-act'),t=>{ st.act=t; redraw(); });
  bindCtl('dp-n',v=>{ st.n=v; redraw(); },v=>String(v)); bindCtl('dp-bias',v=>{ st.bias=v; redraw(); },v=>N(v,1));
  const sb=document.getElementById('dp-scale'); sb.querySelectorAll('button[data-s]').forEach(b=>b.addEventListener('click',()=>{ st.scale=+b.dataset.s; sb.querySelectorAll('button[data-s]').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false')); redraw(); }));
  document.getElementById('dp-seed').addEventListener('click',()=>{ st.seed=(st.seed*48271)%2147483647; weights(); redraw(); });
  box.dataset.seed=st.seed;
  let tw=null; document.getElementById('dp-play').addEventListener('click',()=>{ if(tw) tw.stop(); let last=-1; tw=tween(2800,u=>{ const q=Math.round(u*40)/40; if(q!==last){ last=q; st.t=q; redraw(); } },()=>{ st.t=1; redraw(); }); });
  readout(compute());
  window.U15Depth={st,compute};
})();
