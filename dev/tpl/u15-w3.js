/* ================= UNIT 15 · Acts II–III widgets: w-forward, w-heads, w-rules ================= */

/* ---------- §5 · w-forward: row by row through the salary network ---------- */
(function(){
  const root=document.getElementById('w-forward'); if(!root) return;
  const stage=document.getElementById('fw-stage'), stepsBar=document.getElementById('fw-steps'), neur=document.getElementById('fw-neurons');
  const st={x:[30,10],s:0,r:-1};
  const STEPS=['F1','F2','F3','F4','F5','F6','F7'];
  const SUBT=['a⁽⁰⁾ → z⁽¹⁾ · linear arrow','z⁽¹⁾ → a⁽¹⁾ · ReLU arrow','a⁽¹⁾ → z⁽²⁾ · linear arrow','z⁽²⁾ → a⁽²⁾ · ReLU arrow','a⁽²⁾ → z⁽³⁾ · linear arrow','z⁽³⁾ → ŷ · ReLU arrow','ŷ → L · the score'];
  stepsBar.innerHTML=STEPS.map((t,i)=>`<button role="tab" data-s="${i}" aria-selected="${i===0}">${t}</button>`).join('');
  const P=(v)=>'('+N(v,4)+')';
  function render(){ const c=netForward(SAL,st.x), s=st.s, r=st.r, yh=c[3].a[0], L=.5*(yh-SAL_Y)**2;
    stepsBar.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-selected',i===s?'true':'false'));
    /* awake / asleep chips */
    neur.innerHTML=[1,2].map(l=>c[l].z.map((z,j)=>`<span class="fw-n ${z>0?'on':'off'}" title="layer ${l}, neuron ${j+1}">h${SUP(l)}${SUB(j+1)} ${z>0?'awake':'asleep'} <b>${N(z,2)}</b></span>`).join('')).join('');
    let h=`<div class="fw-title"><span class="fw-badge">${STEPS[s]}</span>${SUBT[s]}</div>`;
    if(s%2===0&&s<6){ const l=s/2+1, W=SAL.W[l-1], b=SAL.b[l-1], a=c[l-1].a, z=c[l].z, n=W.length;
      const hotW=(i,j)=>r===i?'hot':'', hotA=(i,j)=>r>=0?'hotb':'', hotB=(i,j)=>r===i?'hot':'', hotZ=(i,j)=>(r===i?'hot':(r>=0&&i>r?'zero':''));
      h+=`<div class="eqrow scroll-x"><span class="vn">z⁽${l}⁾</span><span class="op">=</span>${matHTML(W,{tone:'par',cell:hotW})}${matHTML(colOf(a),{tone:'fwd',cell:hotA})}<span class="op">+</span>${matHTML(colOf(b),{tone:'par',cell:hotB})}<span class="op">=</span>${matHTML(colOf(z.map((v,i)=>r>=0&&i>r?'·':v)),{tone:'fwd',cell:hotZ,d:4})}<span class="mshape ok">${n}×1 ✓</span></div>`;
      h+='<div class="fw-rows">'+W.map((row,i)=>{ const terms=row.map((w,k)=>P(w)+P(a[k])).join(' + '), prods=row.map((w,k)=>N(w*a[k],4)).join(' + ').replace(/\+ −/g,'− ');
        const bb=b[i]<0?' − '+N(-b[i],4):' + '+N(b[i],4); return `<div class="fw-row${r===i?' on':''}${r>=0&&i>r?' later':''}"><b>row ${i+1}</b> ${terms}${bb} = ${prods}${bb} = <b class="${z[i]>0?'k-fwd':'k-sleep'}">${N(z[i],4)}</b></div>`; }).join('')+'</div>';
      h+=`<p class="fw-note">Each row is one neuron: the dot product of that row of W⁽${l}⁾ with the input column, plus its shift.</p>`; }
    else if(s<6){ const l=(s+1)/2, z=c[l].z, a=c[l].a;
      h+=`<div class="eqrow scroll-x"><span class="vn">a⁽${l}⁾</span><span class="op">= ReLU</span>${matHTML(colOf(z),{tone:'fwd',d:4})}<span class="op">=</span>${matHTML(colOf(z.map(v=>'max(0, '+N(v,4)+')')),{tone:'par'})}<span class="op">=</span>${matHTML(colOf(a),{tone:'fwd',d:4,cell:(i)=>z[i]>0?'':'dead'})}</div>`;
      const sl=z.map((v,i)=>v>0?null:i+1).filter(v=>v);
      h+=`<p class="fw-note">${sl.length?'Neuron'+(sl.length>1?'s ':' ')+sl.join(' and ')+' got a negative total (or zero), so ReLU switched '+(sl.length>1?'them':'it')+' off: <b class="k-sleep">asleep</b>.':'Every entry is positive, so ReLU changes nothing here.'}</p>`; }
    else { h+=`<div class="eqrow scroll-x"><span class="vn">L</span><span class="op">=</span> ½(ŷ − y)² <span class="op">=</span> ½(${N(yh,4)} − 50)² <span class="op">=</span> <b class="k-bwd">${N(L,4)}</b></div><p class="fw-note">The error is ŷ − y = <b class="k-bwd">${N(yh-SAL_Y,4)}</b>: ${yh<SAL_Y?'the guess is too low':yh>SAL_Y?'the guess is too high':'spot on'}. That number is the seed of the backward pass.</p>`; }
    h+=`<div class="fw-cache"><span class="lbl">cache</span>`+['a⁽⁰⁾','z⁽¹⁾','a⁽¹⁾','z⁽²⁾','a⁽²⁾','z⁽³⁾','ŷ'].map((t,i)=>{ const v=[c[0].a,c[1].z,c[1].a,c[2].z,c[2].a,c[3].z,c[3].a][i]; const on=i<=s; return `<span class="fw-c${on?' on':''}">${t} ${on?vecN(v,2):'…'}</span>`; }).join('')+'</div>';
    stage.innerHTML=h;
    root.dataset.z1=c[1].z.join(','); root.dataset.yhat=yh; root.dataset.loss=L; root.dataset.step=s; }
  stepsBar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ stop(); st.s=+b.dataset.s; st.r=-1; render(); }));
  bindCtl('fw-age',v=>{ st.x[0]=v; render(); },v=>String(v)); bindCtl('fw-exp',v=>{ st.x[1]=v; render(); },v=>String(v));
  let timer=null; const stop=()=>{ if(timer){ clearTimeout(timer); timer=null; } };
  document.getElementById('fw-prev').addEventListener('click',()=>{ stop(); st.s=Math.max(0,st.s-1); st.r=-1; render(); });
  document.getElementById('fw-next').addEventListener('click',()=>{ stop(); st.s=Math.min(6,st.s+1); st.r=-1; render(); });
  document.getElementById('fw-reset').addEventListener('click',()=>{ stop(); st.x=[30,10]; setCtl('fw-age',30,v=>String(v)); setCtl('fw-exp',10,v=>String(v)); st.s=0; st.r=-1; render(); });
  document.getElementById('fw-play').addEventListener('click',()=>{ stop(); const seq=[]; for(let s=0;s<7;s++){ if(s%2===0&&s<6){ const n=SAL.W[s/2].length; for(let r=0;r<n;r++) seq.push([s,r]); seq.push([s,-1]); } else seq.push([s,-1]); }
    let i=0; const go=()=>{ if(i>=seq.length){ timer=null; return; } [st.s,st.r]=seq[i++]; render(); timer=setTimeout(go,RM?0:(st.r>=0?850:1100)); }; go(); });
  render();
  window.U15Forward={st,render};
})();

/* ---------- §6 · w-heads: regression and classification, one kind of blame ---------- */
(function(){
  const sr=document.getElementById('hd-reg'), sc=document.getElementById('hd-cls'); if(!sr||!sc) return;
  const read=document.getElementById('hd-read');
  const st={yh:40,z:[2,1,0],same:false};
  const soft=z=>{ const m=Math.max(...z), e=z.map(v=>Math.exp(v-m)), s=e.reduce((a,b)=>a+b,0); return e.map(v=>v/s); };
  function numberLine(svg,x,y0,y1,lo,hi,truth,pred,lab,glow,o){ o=o||{}; const py=v=>y1-(v-lo)/(hi-lo)*(y1-y0);
    el('line',{x1:x,y1:y0,x2:x,y2:y1,stroke:'var(--axis)','stroke-width':2},svg);
    (o.ticks||[]).forEach(t=>{ el('line',{x1:x-4,y1:py(t),x2:x+4,y2:py(t),stroke:'var(--axis)','stroke-width':1.5},svg); txt(svg,x-8,py(t)+4,N(t),'font:500 10px system-ui;fill:var(--ink-muted)','end'); });
    el('circle',{cx:x,cy:py(truth),r:9,fill:'none',stroke:'var(--ink)','stroke-width':2.2},svg);
    if(Math.abs(pred-truth)>1e-9){ const d=pred-truth; if(Math.abs(py(pred)-py(truth))>10) edge(svg,x+(o.arrowDx||16),py(truth),x+(o.arrowDx||16),py(pred),'var(--critical)',2.6,glow); }
    glowDot(svg,x,py(pred),6,cv(K15.fwd),glow);
    if(lab) txt(svg,x+(o.arrowDx||16)+8,(py(truth)+py(pred))/2+4,lab,'font:700 11.5px system-ui;fill:var(--critical)');
    return py; }
  function drawReg(){ sr.innerHTML=''; const glow=glo(sr), d=st.yh-SAL_Y, L=.5*d*d;
    const py=numberLine(sr,90,24,272,0,80,SAL_Y,st.yh,'ŷ − y = '+N(d,2),glow,{ticks:[0,20,40,60,80],arrowDx:18});
    txt(sr,78,py(SAL_Y)+4,'truth 50','font:600 10.5px system-ui;fill:var(--ink)','end'); txt(sr,70,py(st.yh)+18,'ŷ','font:700 12px system-ui;fill:'+cv(K15.fwd),'end');
    /* the loss as half of a square on the gap */
    const side=Math.abs(py(st.yh)-py(SAL_Y)), x0=210, yA=Math.min(py(st.yh),py(SAL_Y));
    if(side>2){ const s=Math.min(side,110); el('rect',{x:x0,y:yA,width:s,height:s,fill:'none',stroke:'color-mix(in srgb,var(--critical) 55%,transparent)','stroke-width':1.4},sr);
      el('path',{d:`M${x0},${yA}L${x0+s},${yA+s}L${x0},${yA+s}Z`,fill:'color-mix(in srgb,var(--critical) 30%,transparent)'},sr); }
    txt(sr,210,20,'L = ½(ŷ − y)² = '+N(L,2),'font:700 12px system-ui;fill:var(--critical)');
    txt(sr,210,290,'½ of the square on the gap','font:500 10px system-ui;fill:var(--ink-muted)');
    if(st.same) txt(sr,170,150,'prediction − truth','font:700 12px system-ui;fill:'+cv(K15.awake),'middle');
    return {d,L}; }
  function drawCls(){ sc.innerHTML=''; const glow=glo(sc), q=soft(st.z), y=[1,0,0], L=-Math.log(q[0]);
    if(!st.same){ const bx=[60,160,260], base=178, H=138;
      q.forEach((p,i)=>{ const x=bx[i]; el('rect',{x:x-26,y:base-H*p,width:52,height:H*p,rx:6,fill:i===0?cv(K15.fwd):'color-mix(in srgb,var(--s1) 45%,transparent)',opacity:.85},sc);
        txt(sc,x,base-H*p-7,'q'+SUB(i+1)+' '+N(p,3),'font:700 11px system-ui;fill:var(--ink)','middle');
        const g=p-y[i], A0=base+62; el('line',{x1:x-22,y1:A0,x2:x+22,y2:A0,stroke:'var(--axis)','stroke-width':1},sc);
        if(Math.abs(g)>.005) edge(sc,x,A0,x,A0+Math.sign(g)*Math.max(8,Math.abs(g)*55),'var(--critical)',2.6,glow);
        txt(sc,x+10,A0+(g<0?-8:16),N(g,3),'font:700 11px system-ui;fill:var(--critical)');
        txt(sc,x,base+16,i===0?'class 1 ✓':'class '+(i+1),'font:600 10.5px system-ui;fill:'+(i===0?'var(--ink)':'var(--ink-muted)'),'middle'); });
      el('line',{x1:20,y1:base,x2:320,y2:base,stroke:'var(--axis)','stroke-width':1.5},sc);
      txt(sc,20,20,'L = −ln q₁ = '+N(L,3),'font:700 12px system-ui;fill:var(--critical)'); txt(sc,20,290,'red arrows: q − y (the blame on each score)','font:500 10px system-ui;fill:var(--ink-muted)'); }
    else { [70,170,270].forEach((x,i)=>{ numberLine(sc,x,40,250,0,1,y[i],q[i],N(q[i]-y[i],3),glow,{ticks:i===0?[0,.5,1]:[],arrowDx:14}); txt(sc,x,272,'class '+(i+1)+(i===0?' ✓':''),'font:600 10.5px system-ui;fill:var(--ink-2)','middle'); });
      txt(sc,20,20,'each class: truth ring, prediction dot, arrow = q − y','font:600 11px system-ui;fill:'+cv(K15.awake)); }
    return {q,L}; }
  function draw(){ const a=drawReg(), b=drawCls(); const g=b.q.map((p,i)=>p-(i===0?1:0));
    read.innerHTML='regression: ŷ − y = <b>'+N(a.d,2)+'</b>, L = <b>'+N(a.L,2)+'</b> &nbsp;·&nbsp; classification: q = <b>'+vecN(b.q,3)+'</b>, L = <b>'+N(b.L,3)+'</b>, q − y = <b>'+vecN(g,3)+'</b>';
    sr.dataset.v=a.d; sc.dataset.q=b.q.map(v=>v.toFixed(6)).join(','); }
  bindCtl('hd-y',v=>{ st.yh=v; draw(); },v=>N(v,1));
  [0,1,2].forEach(i=>bindCtl('hd-z'+(i+1),v=>{ st.z[i]=v; draw(); },v=>N(v,1)));
  document.getElementById('hd-same').addEventListener('click',e=>{ st.same=!st.same; e.currentTarget.setAttribute('aria-pressed',st.same); draw(); });
  document.getElementById('hd-reset').addEventListener('click',()=>{ st.yh=40; st.z=[2,1,0]; setCtl('hd-y',40,v=>N(v,1)); [2,1,0].forEach((v,i)=>setCtl('hd-z'+(i+1),v,x=>N(x,1))); draw(); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.U15Heads={st,draw};
})();

/* ---------- §7 · w-rules: Rule A (the switch) and Rule B (outer product, Wᵀ) ---------- */
(function(){
  const sa=document.getElementById('ra-svg'), sb=document.getElementById('rb-svg'); if(!sa||!sb) return;
  const ra=document.getElementById('ra-read'), mats=document.getElementById('rb-mats');
  const A={g:[-60,10,-20],z:[7,4,-2]};
  function drawA(){ sa.innerHTML=''; const glow=glo(sa); const out=A.g.map((g,j)=>A.z[j]>0?g:0);
    txt(sa,50,22,'blame in ∂L/∂a','font:700 10.5px system-ui;fill:var(--ink-muted)','middle'); txt(sa,160,22,'stored z · switch','font:700 10.5px system-ui;fill:var(--ink-muted)','middle'); txt(sa,270,22,'∂L/∂z out','font:700 10.5px system-ui;fill:var(--ink-muted)','middle');
    A.g.forEach((g,j)=>{ const y=65+j*65, on=A.z[j]>0;
      el('rect',{x:18,y:y-16,width:64,height:32,rx:8,fill:'color-mix(in srgb,var(--critical) 16%,transparent)',stroke:'var(--critical)','stroke-width':1.4},sa); txt(sa,50,y+5,N(g),'font:700 13px system-ui;fill:var(--critical)','middle');
      el('line',{x1:82,y1:y,x2:128,y2:y,stroke:'var(--critical)','stroke-width':2.4,opacity:.8},sa);
      /* the switch: a lever from 128 to 192 */
      el('circle',{cx:128,cy:y,r:4,fill:'var(--ink-2)'},sa); el('circle',{cx:192,cy:y,r:4,fill:'var(--ink-2)'},sa);
      if(on) glowLine(sa,128,y,192,y,cv(K15.awake),3,!!glow); else el('line',{x1:128,y1:y,x2:186,y2:y-13,stroke:'var(--ink-muted)','stroke-width':3,'stroke-linecap':'round'},sa);
      const zb=el('g',{style:'cursor:pointer','data-j':j,class:'ra-z',role:'button','aria-label':'flip the sign of z'+(j+1)},sa); el('rect',{x:136,y:y+10,width:48,height:22,rx:6,fill:'color-mix(in srgb,var(--s1) 14%,transparent)',stroke:cv(K15.fwd),'stroke-width':1.2},zb); txt(zb,160,y+25,'z = '+N(A.z[j]),'font:700 11px system-ui;fill:'+cv(K15.fwd),'middle');
      txt(sa,160,y-21,on?'awake · slope 1':'asleep · slope 0','font:600 10px system-ui;fill:'+(on?cv(K15.awake):'var(--ink-muted)'),'middle');
      el('line',{x1:192,y1:y,x2:238,y2:y,stroke:on?'var(--critical)':'var(--ink-muted)','stroke-width':2.4,opacity:on?.8:.4,'stroke-dasharray':on?null:'3 4'},sa);
      el('rect',{x:238,y:y-16,width:64,height:32,rx:8,fill:on?'color-mix(in srgb,var(--critical) 16%,transparent)':'transparent',stroke:on?'var(--critical)':'var(--ink-muted)','stroke-width':1.4},sa); txt(sa,270,y+5,N(out[j]),'font:700 13px system-ui;fill:'+(on?'var(--critical)':'var(--ink-muted)'),'middle'); });
    sa.querySelectorAll('.ra-z').forEach(g=>g.addEventListener('click',()=>{ const j=+g.dataset.j; A.z[j]=-A.z[j]; drawA(); }));
    ra.innerHTML='('+A.g.map(v=>N(v)).join(', ')+') ⊙ ('+A.z.map(v=>v>0?1:0).join(', ')+') = <b>('+out.map(v=>N(v)).join(', ')+')</b>'; sa.dataset.out=out.join(','); }
  document.getElementById('ra-reset').addEventListener('click',()=>{ A.z=[7,4,-2]; drawA(); });
  /* ---- Rule B ---- */
  const LAY={2:{W:SAL.W[1],a:[7,4,0],dz:[-40,-20],name:'2'},3:{W:SAL.W[2],a:[6,7],dz:[-10],name:'3'}};
  const B={l:2,cells:0,back:0,anim:null};
  function drawB(){ const L=LAY[B.l], W=L.W, n=W.length, m=W[0].length; sb.innerHTML=''; const glow=glo(sb);
    const ly=k=>125+(k-(m-1)/2)*70, ry=j=>125+(j-(n-1)/2)*80, LX=70, RX=370;
    const cellOrder=[]; for(let j=0;j<n;j++) for(let k=0;k<m;k++) cellOrder.push([j,k]);
    const curCell=B.cells>0&&B.cells<=cellOrder.length?cellOrder[B.cells-1]:null, backK=B.back>0?B.back-1:-1;
    for(let j=0;j<n;j++) for(let k=0;k<m;k++){ const w=W[j][k], hot=curCell&&curCell[0]===j&&curCell[1]===k, back=backK===k;
      el('line',{x1:LX+18,y1:ly(k),x2:RX-18,y2:ry(j),stroke:hot||back?'var(--critical)':cv(w>=0?K15.pos:K15.neg),'stroke-width':(hot||back?3.2:1.4+2.2*Math.min(1,Math.abs(w)/2)),opacity:hot||back?1:.75},sb);
      const mx=LX+18+(RX-LX-36)*.3, my=ly(k)+(ry(j)-ly(k))*.3; if(hot||back) txt(sb,mx,my-5,'w '+N(w),'font:700 10px system-ui;fill:var(--ink)','middle'); }
    for(let k=0;k<m;k++){ glowDot(sb,LX,ly(k),16,'color-mix(in srgb,var(--s1) 30%,transparent)',null); el('circle',{cx:LX,cy:ly(k),r:16,fill:'none',stroke:cv(K15.fwd),'stroke-width':2},sb); txt(sb,LX,ly(k)+4,N(L.a[k]),'font:700 12px system-ui;fill:'+cv(K15.fwd),'middle'); txt(sb,LX-24,ly(k)+4,'a'+SUB(k+1),'font:600 10.5px system-ui;fill:var(--ink-muted)','end'); }
    for(let j=0;j<n;j++){ el('circle',{cx:RX,cy:ry(j),r:17,fill:'color-mix(in srgb,var(--critical) 18%,transparent)',stroke:'var(--critical)','stroke-width':2},sb); txt(sb,RX,ry(j)+4,N(L.dz[j]),'font:700 12px system-ui;fill:var(--critical)','middle'); txt(sb,RX+24,ry(j)+4,'∂L/∂z'+SUB(j+1),'font:600 10.5px system-ui;fill:var(--ink-muted)'); }
    txt(sb,LX,20,'layer below: a (stored)','font:700 10.5px system-ui;fill:var(--ink-muted)','middle'); txt(sb,RX,20,'blame at z','font:700 10.5px system-ui;fill:var(--ink-muted)','middle');
    if(backK>=0){ const tot=W.reduce((s,r,j)=>s+r[backK]*L.dz[j],0); txt(sb,LX,ly(backK)+34,'∂L/∂a'+SUB(backK+1)+' = '+N(tot),'font:700 11px system-ui;fill:var(--critical)','middle'); }
    /* matrices */
    const dW=W.map((r,j)=>r.map((_,k)=>{ const idx=j*m+k+1; return idx<=B.cells?N(L.dz[j]*L.a[k]):'·'; }));
    const back=W[0].map((_,k)=>k<B.back?N(W.reduce((s,r,j)=>s+r[k]*L.dz[j],0)):'·');
    const WT=W[0].map((_,k)=>W.map(r=>r[k]));
    mats.innerHTML=`<div class="eqrow scroll-x"><span class="vn">∂L/∂W⁽${L.name}⁾</span><span class="op">=</span>${matHTML(colOf(L.dz),{tone:'bwd'})}${matHTML([L.a],{tone:'fwd'})}<span class="op">=</span>${matHTML(dW,{tone:'bwd',cell:(i,j)=>curCell&&curCell[0]===i&&curCell[1]===j?'hotr':''})}<span class="mshape">${n}×${m}</span></div>`+
      `<div class="eqrow scroll-x"><span class="vn">∂L/∂a⁽${+L.name-1}⁾</span><span class="op">= Wᵀ·</span>${matHTML(WT,{tone:'par',cell:(i)=>i===backK?'hot':''})}${matHTML(colOf(L.dz),{tone:'bwd'})}<span class="op">=</span>${matHTML(colOf(back),{tone:'bwd',cell:(i)=>i===backK?'hotr':''})}<span class="mshape">${m}×1</span></div>`+
      `<div class="eqrow"><span class="vn">∂L/∂b⁽${L.name}⁾</span><span class="op">=</span>${matHTML(colOf(L.dz),{tone:'bwd'})}<span class="fw-note" style="margin:0 0 0 .4rem">a shift gets exactly the blame of its z</span></div>`;
    sb.dataset.cells=B.cells; sb.dataset.back=B.back; }
  const stopB=()=>{ if(B.anim){ clearTimeout(B.anim); B.anim=null; } };
  document.getElementById('rb-outer').addEventListener('click',()=>{ stopB(); const L=LAY[B.l], tot=L.W.length*L.W[0].length; B.back=0; B.cells=0; const go=()=>{ B.cells++; drawB(); if(B.cells<tot) B.anim=setTimeout(go,RM?0:650); else B.anim=null; }; go(); });
  document.getElementById('rb-back').addEventListener('click',()=>{ stopB(); const L=LAY[B.l], m=L.W[0].length; B.cells=L.W.length*m; B.back=0; const go=()=>{ B.back++; drawB(); if(B.back<m) B.anim=setTimeout(go,RM?0:1000); else B.anim=null; }; go(); });
  document.getElementById('rb-layer').addEventListener('click',e=>{ stopB(); B.l=B.l===2?3:2; e.currentTarget.setAttribute('aria-pressed',B.l===3); e.currentTarget.textContent=B.l===3?'use layer 2 instead':'use layer 3 instead'; B.cells=0; B.back=0; drawB(); });
  const both=()=>{ drawA(); drawB(); };
  both(); new MutationObserver(both).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.U15Rules={A,B,drawA,drawB};
})();
