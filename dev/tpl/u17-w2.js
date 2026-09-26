/* ================= UNIT 17 · Act I–II widgets: w-shapes, w-bptt, w-power, w-eigen-memory ================= */

/* ---------- §4 · w-shapes: one cell, five jobs ---------- */
(function(){
  const svg=document.getElementById('sh-svg'); if(!svg) return;
  const read=document.getElementById('sh-read');
  /* the next-word bars: step 3 is §4's worked softmax, computed from the scores (2, 1, 0.5, −1); the others are toy probabilities */
  const SM=(sc)=>{ const e=sc.map(Math.exp), s=e.reduce((a,b)=>a+b,0); return e.map(v=>v/s); };
  const LM=[{w:['train','bus','tea','late'],p:[.5,.3,.15,.05]},{w:['to','is','was','late'],p:[.55,.3,.1,.05]},{w:['Delhi','Mumbai','late','the'],p:SM([2,1,.5,-1]),sc:[2,1,.5,-1]},{w:['is','was','the','late'],p:[.6,.25,.1,.05]}];
  const JOBS={
    m1:{n:5,ins:['this','film','was','really','good'],outs:[null,null,null,null,'happy 0.93'],title:'many → one · sentiment',say:'Five words go in, one read-out comes out after the last word: a softmax over <b class="p">happy / unhappy</b>.'},
    '1m':{n:5,ins:['📷 photo',null,null,null,null],outs:['a','dog','runs','on','sand'],title:'one → many · captioning',say:'One input — a photo turned into a vector — then the cell writes a caption, one word per step. (Each word it writes is usually fed back in as the next input.)'},
    mm:{n:5,ins:['the','train','is','very','late'],outs:['other','noun','verb','other','other'],title:'many → many · tag each word',say:'A read-out at every word: here a softmax over three tags, <b class="p">noun / verb / other</b>.'},
    s2s:{n:6,ins:['train','is','late',null,null,null],outs:[null,null,null,'train','late','hai'],split:3,title:'many → many, different length · translate',say:'An <b class="m">encoder</b> reads the English; its last note is handed to a <b style="color:var(--s6)">decoder</b> that writes the Hindi. Different lengths, different order — this is §10.'},
    lm:{n:5,ins:['the','train','to','Delhi','is'],outs:['train','to','Delhi','is','late'],title:'next word · a language model',say:'At every word, guess the <em>next</em> word. The true next word is the target, so the loss adds one surprise per step.'}};
  const st={job:'m1',k:-1};
  function draw(){ svg.innerHTML=''; const J=JOBS[st.job], n=J.n, lm=st.job==='lm', V=narrowSVG(svg,760,340,440,lm?540:340), ph=V.n, W=V.W, glow=glo(svg);
    const x0=ph?46:(lm?80:95), span=ph?W-92:(lm?430:570), xs=i=>x0+i*(span/(n-1)), yc=170, cw=ph?Math.min(64,span/(n-1)-10):64, ch=44, tw=ph?Math.min(76,span/(n-1)-4):72;
    txt(svg,16,24,J.title,'font:700 12.5px system-ui;fill:var(--ink-2)');
    for(let i=0;i<n;i++){ const x=xs(i), dec=J.split!=null&&i>=J.split, cur=i===st.k, act=st.k<0||i<=st.k;
      /* note arrow */
      if(i>0){ const hand=J.split!=null&&i===J.split; edge(svg,xs(i-1)+cw/2+2,yc,x-cw/2-3,yc,hand?cv(K17.gate):cv(K17.mem),hand?3:2.2,act?glow:null,act?1:.3);
        if(hand) txt(svg,(xs(i-1)+x)/2,yc-10,'summary','font:700 10.5px system-ui;fill:'+cv(K17.gate),'middle'); }
      const g=el('g',{opacity:act?1:.35},svg); if(cur&&glow) g.setAttribute('filter',glow);
      el('rect',{x:x-cw/2,y:yc-ch/2,width:cw,height:ch,rx:10,fill:dec?'color-mix(in srgb,var(--s6) 12%,transparent)':'color-mix(in srgb,var(--s3) 12%,transparent)',stroke:dec?cv(K17.prob):cv(K17.mem),'stroke-width':cur?2.6:1.5},g);
      txt(g,x,yc+4,dec?'decoder':(J.split!=null?'encoder':'cell'),'font:700 10.5px system-ui;fill:var(--ink-2)','middle');
      if(J.ins[i]){ const gi=el('g',{opacity:act?1:.35},svg); el('rect',{x:x-tw/2,y:268,width:tw,height:26,rx:7,fill:'color-mix(in srgb,var(--s1) 18%,transparent)',stroke:cv(K17.word),'stroke-width':1.3},gi);
        txt(gi,x,285,J.ins[i],'font:700 11px system-ui;fill:var(--ink)','middle'); edge(gi,x,266,x,yc+ch/2+3,cv(K17.word),2,null,1); }
      if(J.outs[i]){ const go=el('g',{opacity:act?1:.3},svg); edge(go,x,yc-ch/2-3,x,82,cv(K17.prob),2,null,1);
        el('rect',{x:x-(tw+8)/2,y:52,width:tw+8,height:26,rx:7,fill:'color-mix(in srgb,var(--s6) 18%,transparent)',stroke:cv(K17.prob),'stroke-width':1.3},go);
        txt(go,x,69,ph&&J.outs[i]==='happy 0.93'?'happy':J.outs[i],'font:700 11px system-ui;fill:var(--ink)','middle'); } }
    const nIn=J.ins.filter(Boolean).length, nOut=J.outs.filter(Boolean).length;
    txt(svg,16,lm&&ph?322:322,'inputs '+nIn+' · read-outs '+nOut,'font:600 11px system-ui;fill:var(--ink-muted)');
    let extra='';
    if(lm){ const k=Math.max(0,Math.min(3,st.k<0?2:st.k)), D=LM[k], bx=ph?16:560, bw=ph?W-80:170, by=ph?350:0;
      txt(svg,bx,by+48,'after "'+J.ins.slice(0,k+1).join(' ')+'"','font:700 11px system-ui;fill:var(--ink-2)');
      txt(svg,bx,by+66,'guess for the next word','font:500 10.5px system-ui;fill:var(--ink-muted)');
      D.w.forEach((w,j)=>{ const y=by+(ph?80:84)+j*(ph?40:42), p=D.p[j], truth=w===J.outs[k];
        txt(svg,bx,y+13,w,'font:700 11px system-ui;fill:'+(truth?'var(--ink)':'var(--ink-2)'));
        el('rect',{x:bx+62,y:y,width:bw-62,height:18,rx:5,fill:'none',stroke:'var(--line)'},svg);
        const g=el('g',glow?{filter:glow}:{},svg); el('rect',{x:bx+62,y:y,width:Math.max(2,(bw-62)*p),height:18,rx:5,fill:cv(K17.prob),opacity:truth?1:.55},g);
        txt(svg,bx+bw+4,y+13,N(p,3),'font:700 10.5px system-ui;fill:'+cv(K17.prob)); if(truth&&!ph) txt(svg,bx,y+30,'← true next word · loss −ln '+N(p,3)+' = '+N(-Math.log(p),3),'font:600 10px system-ui;fill:var(--critical)'); });
      extra='<br>After "'+J.ins.slice(0,k+1).join(' ')+'": '+D.w.map((w,j)=>w+' <b class="p">'+N(D.p[j],3)+'</b>').join(' · ')+(D.sc?' (softmax of the scores 2, 1, 0.5, −1)':'')+'.';
      svg.dataset.lm=D.p.map(v=>v.toFixed(3)).join(','); }
    read.innerHTML=J.say+extra; svg.dataset.job=st.job; svg.dataset.io=nIn+','+nOut; mfont(svg); }
  tabs(document.getElementById('sh-tabs'),t=>{ st.job=t; st.k=-1; draw(); });
  let timer=null; document.getElementById('sh-play').addEventListener('click',()=>{ clearInterval(timer); const n=JOBS[st.job].n, last=st.job==='lm'?3:n-1; st.k=0; draw(); if(RM){ st.k=last; draw(); return; }
    timer=setInterval(()=>{ st.k++; if(st.k>last){ clearInterval(timer); st.k=st.job==='lm'?last:-1; } draw(); },st.job==='lm'?1100:600); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17Shapes={st,draw,LM};
})();

/* ---------- §5 · w-bptt: the step machine through time ---------- */
(function(){
  const root=document.getElementById('w-bptt'); if(!root) return;
  const svg=document.getElementById('bp-svg'), card=document.getElementById('bp-card'), scrub=document.getElementById('bp-scrub'), count=document.getElementById('bp-count');
  const G=bptt1(BP.w,BP.u,BP.b,BP.x,BP.y), T=4;
  const STEPS=[...[1,2,3,4].map(t=>({id:'F'+t,kind:'f',t})),{id:'S',kind:'s'},...[4,3,2,1].map(t=>({id:'B'+t,kind:'b',t})),{id:'Σ',kind:'u'}];
  let k=0;
  const n4=v=>N(v,4);
  scrub.innerHTML=STEPS.map((s,i)=>`<button type="button" class="${s.kind==='f'?'f':s.kind==='u'?'u':'b'}" data-i="${i}" role="tab">${s.id}</button>`).join('');
  scrub.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>go(+b.dataset.i)));
  function draw(){ svg.innerHTML=''; const V=narrowSVG(svg,560,320,440,360), ph=V.n, glow=glo(svg), s=STEPS[k], xs=t=>ph?62+(t-1)*92:84+(t-1)*114, yc=ph?150:140, LX=ph?412:522;
    const fwdDone=t=>s.kind!=='f'||t<=s.t, bwdAt=t=>{ if(s.kind==='f') return false; if(s.kind==='s') return t===4; if(s.kind==='u') return true; return t>=s.t; };
    txt(svg,16,22,ph?'→ forward: the note':'forward: the note goes right','font:700 11px system-ui;fill:'+cv(K17.mem)); txt(svg,ph?16:544,ph?44:22,ph?'← backward: the blame':'backward: the blame comes back','font:700 11px system-ui;fill:var(--critical)',ph?'start':'end');
    for(let t=1;t<=T;t++){ const x=xs(t), on=fwdDone(t), cur=(s.kind==='f'||s.kind==='b')&&s.t===t;
      if(t>1) edge(svg,xs(t-1)+30,yc,x-32,yc,cv(K17.mem),2,on?glow:null,on?1:.25);
      if(bwdAt(t)&&t>1&&s.kind!=='s'&&(s.kind==='u'||t-1>=s.t-1)&&(s.kind==='u'||t>s.t)) edge(svg,x-32,yc+14,xs(t-1)+30,yc+14,'var(--critical)',1.8,glow,.85);
      const g=el('g',{opacity:on?1:.3},svg); if(cur&&glow) g.setAttribute('filter',glow);
      el('rect',{x:x-30,y:yc-24,width:60,height:48,rx:10,fill:'color-mix(in srgb,var(--s3) 11%,transparent)',stroke:cur?(s.kind==='b'?'var(--critical)':cv(K17.mem)):cv(K17.mem),'stroke-width':cur?2.6:1.4},g);
      txt(g,x,yc+4,'tanh','font:700 11px system-ui;fill:var(--ink-2)','middle');
      /* input */
      const gi=el('g',{opacity:on?1:.3},svg); el('rect',{x:x-20,y:yc+62,width:40,height:24,rx:6,fill:'color-mix(in srgb,var(--s1) 18%,transparent)',stroke:cv(K17.word)},gi); txt(gi,x,yc+78,'x = '+BP.x[t-1],'font:700 10.5px system-ui;fill:var(--ink)','middle'); edge(gi,x,yc+60,x,yc+27,cv(K17.word),1.6,null,1);
      /* note value */
      if(on){ txt(svg,x,yc-36,(ph?'':'h'+SUB(t)+' = ')+n4(G.h[t]),'font:700 11.5px system-ui;fill:'+cv(K17.mem),'middle'); }
      /* blame disc (area ∝ |blame|) — a dashed socket waits for it */
      if(!bwdAt(t)){ el('circle',{cx:x,cy:yc+150,r:16,fill:'none',stroke:'var(--critical)','stroke-dasharray':'3 4',opacity:.4},svg); if(t===1&&!ph) txt(svg,xs(1)-38,yc+154,'blame','font:600 10px system-ui;fill:var(--critical);opacity:.6','end'); }
      if(bwdAt(t)){ const v=G.dh[t], r=Math.max(2.5,(ph?32:40)*Math.sqrt(Math.abs(v)/Math.abs(G.dh[4]))); const dg=el('g',glow?{filter:glow}:{},svg);
        el('circle',{cx:x,cy:yc+150,r,fill:'var(--critical)',opacity:.75},dg); txt(svg,x,yc+150+Math.max(r,8)+14,(ph?'':'∂L/∂h'+SUB(t)+' ')+n4(v),'font:700 10.5px system-ui;fill:var(--critical)','middle'); } }
    edge(svg,xs(1)-58,yc,xs(1)-32,yc,cv(K17.mem),1.6,null,.7); txt(svg,xs(1)-48,yc-8,'h₀','font:700 10.5px system-ui;fill:'+cv(K17.mem),'middle');
    /* loss */
    const lossOn=s.kind!=='f'||s.t===4; const lg=el('g',{opacity:lossOn&&s.kind!=='f'?1:.3},svg); edge(lg,xs(4)+30,yc,LX-18,yc,'var(--ink-muted)',1.4,null,1);
    el('rect',{x:LX-18,y:yc-15,width:36,height:30,rx:7,fill:'color-mix(in srgb,var(--critical) 20%,transparent)',stroke:'var(--critical)','stroke-width':1.6},lg); txt(lg,LX,yc+5,'L','font:800 13px system-ui;fill:var(--critical)','middle');
    if(s.kind!=='f') txt(svg,LX,yc-24,'L = '+n4(G.L),'font:700 10.5px system-ui;fill:var(--critical)','middle');
    svg.dataset.step=s.id; mfont(svg);
    /* the card */
    const badge=`<span class="st-badge ${s.kind==='f'?'f':s.kind==='u'?'u':'b'}">${s.id}</span>`;
    let html='';
    if(s.kind==='f'){ const t=s.t; html=`<div class="st-head">${badge}<span class="st-rule a">forward</span></div><p class="st-title">Word ${t}: keep old, add new, squeeze</p>
      <div class="fw-rows"><div class="fw-row on">z${SUB(t)} = w·h${SUB(t-1)} + u·x${SUB(t)} = 0.5 · ${n4(G.h[t-1])} + 1 · ${BP.x[t-1]} = ${n4(G.z[t])}</div><div class="fw-row on">h${SUB(t)} = tanh(${n4(G.z[t])}) = <b style="color:var(--s3)">${n4(G.h[t])}</b></div></div>
      <p class="st-sub">${t===1?'The first word writes itself into the note.':'Only the old note comes in (x = 0), halved by w and squeezed by tanh.'} Store h${SUB(t)}: the way back needs it.</p>`; }
    else if(s.kind==='s'){ html=`<div class="st-head">${badge}<span class="st-rule s">the seed</span></div><p class="st-title">Score the last note</p>
      <div class="fw-rows"><div class="fw-row on">L = ½(h₄ − 1)² = ½(${n4(G.h[4])} − 1)² = ${n4(G.L)}</div><div class="fw-row on">∂L/∂h₄ = h₄ − 1 = <b style="color:var(--critical)">${n4(G.dh[4])}</b></div></div>
      <p class="st-sub">The target 1 asks the last note to still remember the first word. It has almost forgotten, so the blame is big: prediction minus truth.</p>`; }
    else if(s.kind==='b'){ const t=s.t; html=`<div class="st-head">${badge}<span class="st-rule a">Rule A</span><span class="st-rule b">Rule B</span></div><p class="st-title">Back through word ${t}</p>
      <div class="fw-rows"><div class="fw-row on">Rule A · ∂L/∂z${SUB(t)} = ∂L/∂h${SUB(t)} · (1 − h${SUB(t)}²) = ${n4(G.dh[t])} · ${n4(1-G.h[t]**2)} = ${n4(G.dz[t])}</div>
      <div class="fw-row on">Rule B · to the weight: ∂L/∂z${SUB(t)} · h${SUB(t-1)} = ${n4(G.dz[t])} · ${n4(G.h[t-1])} = <b style="color:var(--s4)">${n4(G.cw[t])}</b></div>
      <div class="fw-row on">Rule B · to the old note: ∂L/∂h${SUB(t-1)} = w · ∂L/∂z${SUB(t)} = 0.5 · ${n4(G.dz[t])} = <b style="color:var(--critical)">${n4(G.dh[t-1])}</b></div></div>
      <p class="st-sub">${t===1?'Word 1 reports 0 for w, because the note that came in, h₀, was 0.':'The blame shrinks by the factor w·(1 − h²) ≈ '+N(BP.w*(1-G.h[t]**2),3)+' on its way back.'}</p>`; }
    else { html=`<div class="st-head">${badge}<span class="st-rule u">add up</span></div><p class="st-title">One w, four reports: add them</p>
      <div class="fw-rows"><div class="fw-row on">∂L/∂w = ${[4,3,2,1].map(t=>'('+n4(G.cw[t])+')').join(' + ')}</div><div class="fw-row on">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <b style="color:var(--s4)">${n4(G.dw)}</b></div>
      <div class="fw-row on">∂L/∂u = ∂L/∂z₁ · x₁ = <b>${n4(G.du)}</b> (only word 1 is non-zero)</div></div>
      <div class="st-win">The blame fell from <b>${n4(G.dh[4])}</b> at word 4 to <b>${n4(G.dh[1])}</b> at word 1 — about ${N(G.dh[4]/G.dh[1],1)} times smaller.</div>`; }
    card.innerHTML=html;
    scrub.querySelectorAll('button').forEach((b,i)=>{ b.setAttribute('aria-selected',i===k?'true':'false'); b.classList.toggle('done',i<k); });
    count.textContent='step '+(k+1)+' / '+STEPS.length; root.dataset.step=s.id; }
  function go(i){ k=Math.max(0,Math.min(STEPS.length-1,i)); draw(); }
  document.getElementById('bp-next').addEventListener('click',()=>go(k+1));
  document.getElementById('bp-prev').addEventListener('click',()=>go(k-1));
  document.getElementById('bp-reset').addEventListener('click',()=>{ stop(); go(0); });
  let timer=null; const pb=document.getElementById('bp-play');
  const stop=()=>{ clearInterval(timer); timer=null; pb.textContent='▶ play'; };
  pb.addEventListener('click',()=>{ if(timer){ stop(); return; } if(k>=STEPS.length-1) k=-1; pb.textContent='❚❚ pause'; go(k+1); timer=setInterval(()=>{ if(k>=STEPS.length-1){ stop(); return; } go(k+1); },RM?50:1300); });
  go(0); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17BPTT={go,G,STEPS};
})();

/* ---------- §6 · w-power: powers of one number ---------- */
(function(){
  const svg=document.getElementById('pw-svg'); if(!svg) return;
  const read=document.getElementById('pw-read');
  const st={w:.5,T:10,tanh:false};
  const LO=-8, HI=6;                                           /* log10 range of the axis */
  function vals(){ const out=[]; if(!st.tanh){ for(let t=1;t<=50;t++) out.push(Math.pow(st.w,t)); return out; }
    const r=rnn1(st.w,1,0,[1].concat(new Array(50).fill(0)),0); let p=1; for(let t=1;t<=50;t++){ p*=st.w*(1-r.h[t+1]**2); out.push(p); } return out; }
  function draw(){ svg.innerHTML=''; const VB=narrowSVG(svg,760,300,440,300), ph=VB.n, glow=glo(svg), V=vals(), L=ph?52:48, R=ph?10:16, Tp=18, B=34, W=VB.W, H=300;
    const py=v=>{ const l=Math.max(LO,Math.min(HI,Math.log10(Math.max(1e-300,v)))); return Tp+(HI-l)/(HI-LO)*(H-Tp-B); }, bw=(W-L-R)/50, px=t=>L+(t-1)*bw;
    for(let e=LO;e<=HI;e+=2){ const y=py(10**e); el('line',{x1:L,y1:y,x2:W-R,y2:y,stroke:'var(--grid)','stroke-width':1},svg); txt(svg,L-6,y+3.5,e===0?'1':'10'+SUP(e),'font:500 10px system-ui;fill:var(--ink-muted)','end'); }
    [[1e-3,'one thousandth'],[1e3,'a thousand']].forEach(([v,l])=>{ const y=py(v); el('line',{x1:L,y1:y,x2:W-R,y2:y,stroke:'var(--ink-muted)','stroke-width':1,'stroke-dasharray':'5 4'},svg); txt(svg,L+6,y+(v<1?13:-5),l,'font:600 10px system-ui;fill:var(--ink-muted)'); });
    const y1=py(1); el('line',{x1:L,y1:y1,x2:W-R,y2:y1,stroke:'var(--axis)','stroke-width':1.6},svg);
    const g=el('g',glow?{filter:glow}:{},svg);
    V.forEach((v,i)=>{ const t=i+1, y=py(v), up=v>=1, sel=t===st.T; const col=sel?cv(K17.gate):up?'var(--critical)':cv(K17.mem);
      el('rect',{x:px(t)+1.5,y:Math.min(y,y1),width:bw-3,height:Math.max(1,Math.abs(y-y1)),rx:2,fill:col,opacity:sel?1:.8},sel?g:svg);
      if(v>10**HI) txt(svg,px(t)+bw/2,Tp-4,'↑','font:700 10px system-ui;fill:var(--critical)','middle'); });
    for(let t=ph?10:5;t<=50;t+=ph?10:5) txt(svg,px(t)+bw/2,H-B+15,String(t),'font:500 10px system-ui;fill:var(--ink-muted)','middle');
    txt(svg,W/2,H-4,'steps back t','font:600 10.5px system-ui;fill:var(--ink-muted)','middle');
    const v=V[st.T-1], yT=py(v), lt=(st.tanh?'':'w'+SUP(st.T)+' = ')+E(v,3), lx=Math.min(W-R-(ph?170:150),px(st.T)+bw+6), ly2=Math.max(Tp+14,Math.min(H-B-8,yT+(v>=1?-8:16)));
    el('rect',{x:lx-5,y:ly2-14,width:lt.length*(ph?10.2:7.4)+10,height:ph?26:20,rx:6,fill:'var(--surface-2, var(--surface))',stroke:cv(K17.gate),'stroke-width':1,opacity:.95},svg); txt(svg,lx,ly2,lt,'font:800 12px system-ui;fill:'+cv(K17.gate));
    let cross='';
    if(!st.tanh){ if(st.w<1){ const n=Math.floor(Math.log(1e-3)/Math.log(st.w))+1; cross='It first drops below one thousandth at <b>t = '+n+'</b>.'; }
      else if(st.w>1){ const n=Math.floor(Math.log(1e3)/Math.log(st.w))+1; cross='It first passes a thousand at <b>t = '+n+'</b>.'; }
      else cross='Exactly 1 at every step: the knife edge.'; }
    read.innerHTML=(st.tanh?'With tanh (the cell reads 1, then zeros): blame after '+st.T+' steps = <b class="g">'+E(v,3)+'</b>, against w'+SUP(st.T)+' = '+E(Math.pow(st.w,st.T),3)+' without it.':'w = <b>'+N(st.w,2)+'</b> · after T = '+st.T+' steps: w'+SUP(st.T)+' = <b class="g">'+E(v,4)+'</b><br>'+cross)+
      '<br><span class="warnmsg" style="color:'+(V[49]>=1?'var(--critical)':'var(--s3)')+'">'+(st.tanh?(V[49]<Math.pow(st.w,50)?'tanh only shrinks the factors':''):(st.w<1?'memory fades':st.w>1?'blame explodes':'held steady'))+'</span>';
    svg.dataset.v=String(v); svg.dataset.w=st.w; svg.dataset.T=st.T; mfont(svg); }
  bindCtl('pw-w',v=>{ st.w=v; draw(); },v=>N(v,2)); bindCtl('pw-T',v=>{ st.T=v; draw(); },v=>String(v));
  document.querySelectorAll('#w-power .preset[data-w]').forEach(b=>b.addEventListener('click',()=>{ st.w=+b.dataset.w; setCtl('pw-w',st.w,v=>N(v,2)); draw(); }));
  document.getElementById('pw-tanh').addEventListener('click',e=>{ st.tanh=!st.tanh; e.currentTarget.setAttribute('aria-pressed',st.tanh); draw(); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17Power={st,draw};
})();

/* ---------- §6 · w-eigen-memory: powers of a matrix, climbing through time (3-D) ---------- */
(function(){
  const box=document.getElementById('em-3d'); if(!box||!CIN) return;
  const read=document.getElementById('em-read'), bars=document.getElementById('em-bars');
  const PRE={fade:[[.5,.2],[.1,.4]],keep:[[.9,.4],[.1,.6]],explode:[[1.1,.2],[.1,1]],rotate:[[.8,-.6],[.6,.8]]};
  const st={M:PRE.keep.map(r=>r.slice()),v:[1,0],n:30,pre:'keep'};
  const S=1.55, DZ=.1, RMAX=3.3;                                /* floor scale, height per step, floor radius */
  const ids=['em-a','em-b','em-c','em-d'];
  const syncInputs=()=>ids.forEach((id,i)=>{ document.getElementById(id).value=+st.M[i>>1][i&1].toFixed(3); });
  const lamTxt=e=>e.real?('λ₁ = '+N(e.l[0],3)+', λ₂ = '+N(e.l[1],3)):('λ = '+N(e.re,3)+' ± '+N(e.im,3)+'i');
  function coefs(e){ if(!e.real) return null; const [p,q]=e.v, det=p[0]*q[1]-p[1]*q[0]; if(Math.abs(det)<1e-9) return null;
    return [(st.v[0]*q[1]-st.v[1]*q[0])/det,(p[0]*st.v[1]-p[1]*st.v[0])/det]; }
  function verdict(e){ const r=e.rho; if(!e.real) return Math.abs(r-1)<1e-6?'rotates, length kept':r<1?'spirals in: fades':'spirals out: explodes'; return Math.abs(r-1)<1e-6?'keeps one direction':r<1?'fades':'explodes'; }
  function readout(){ const e=eig2(st.M), P=orbit2(st.M,st.v,30), nm=v=>Math.hypot(v[0],v[1]);
    read.innerHTML=lamTxt(e)+'<br>|λ|<sub>max</sub> = <b class="g">'+N(e.rho,4)+'</b> → <b class="'+(e.rho>1+1e-9?'r':'m')+'">'+verdict(e)+'</b>'+
      '<br>W¹v = '+vecN(P[1],3)+' · W²v = '+vecN(P[2],3)+'<br>W¹⁰v = '+vecN(P[10],4)+' · ‖W³⁰v‖ = <b>'+E(nm(P[30]),3)+'</b>'+
      (e.real&&st.pre==='keep'?'<br>v = 0.2·(4, 1) + 0.2·(1, −1): the first part stays, the second halves.':'');
    box.dataset.state=JSON.stringify({rho:+e.rho.toFixed(6),real:e.real,l:e.real?e.l.map(x=>+x.toFixed(6)):[+e.re.toFixed(6),+e.im.toFixed(6)],p10:P[10].map(x=>+x.toFixed(6))});
    drawBars(P); }
  function drawBars(P){ bars.innerHTML=''; const VB=narrowSVG(bars,760,190,440,210), ph=VB.n, glow=glo(bars), W=VB.W,H=VB.H,L=ph?52:48,R=14,Tp=ph?30:14,B=28, LO=-6, HI=4;
    const py=v=>{ const l=Math.max(LO,Math.min(HI,Math.log10(Math.max(1e-300,v)))); return Tp+(HI-l)/(HI-LO)*(H-Tp-B); }, bw=(W-L-R)/30, px=t=>L+(t-1)*bw;
    for(let e=LO;e<=HI;e+=2){ const y=py(10**e); el('line',{x1:L,y1:y,x2:W-R,y2:y,stroke:'var(--grid)'},bars); txt(bars,L-6,y+3.5,e===0?'1':'10'+SUP(e),'font:500 10px system-ui;fill:var(--ink-muted)','end'); }
    const y1=py(1); el('line',{x1:L,y1:y1,x2:W-R,y2:y1,stroke:'var(--axis)','stroke-width':1.5},bars);
    for(let t=1;t<=30;t++){ const v=Math.hypot(...P[t]), y=py(v), on=t<=st.n; el('rect',{x:px(t)+2,y:Math.min(y,y1),width:bw-4,height:Math.max(1.5,Math.abs(y-y1)),rx:2,fill:v>1+1e-9?'var(--critical)':Math.abs(v-1)<1e-9?cv(K17.gate):cv(K17.mem),opacity:on?.85:.2},bars);
      if(t%(ph?10:5)===0) txt(bars,px(t)+bw/2,H-B+14,String(t),'font:500 10px system-ui;fill:var(--ink-muted)','middle'); }
    const e=eig2(st.M), cf=coefs(e);
    if(cf){ [0,1].forEach(i=>{ let d=''; for(let t=1;t<=30;t++){ const v=Math.abs(cf[i])*Math.pow(Math.abs(e.l[i]),t); if(v<1e-300) break; d+=(d?'L':'M')+(px(t)+bw/2).toFixed(1)+','+py(v).toFixed(1); }
        if(d) glowPath(bars,d,i?cv(K17.alt):cv(K17.word),2.2,!!glow); });
      txt(bars,ph?8:L+8,ph?16:Tp+2,ph?'bars: ‖Wᵗv‖ · lines: each eigen-part':'bars: length of Wᵗv · lines: the part along each eigen-direction','font:600 10.5px system-ui;fill:var(--ink-muted)'); }
    else txt(bars,ph?8:L+8,ph?16:Tp+2,'length of Wᵗv, log scale','font:600 10.5px system-ui;fill:var(--ink-muted)');
    mfont(bars); }
  function build(){ return CIN.stage3d(box,{camera:cam3({pos:[7.6,3.4,7.2],look:[0,1.45,0],fov:37},{pos:[9.4,4.4,9.0],look:[0,1.45,0],fov:40}),orbit:true,autoRotate:.1,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,isLight,colors}=ctx, hx=hxOf(ctx), dark=!isLight;
      starfield(ctx,260,16); glassFloor(ctx,2*RMAX+.6,{div:26});
      const axes=new THREE.Group(); root.add(axes);
      [[1,0],[0,1]].forEach(([a,b])=>{ const t=liveTube(ctx,hx('axis'),.008,.6); aimTube(THREE,t,[-RMAX*a,.005,RMAX*b],[RMAX*a,.005,-RMAX*b]); axes.add(t); });
      const dyn=new THREE.Group(); root.add(dyn);
      ctx.redraw=()=>{ clearGroup(dyn); const e=eig2(st.M), P=orbit2(st.M,st.v,30), c=ctx.colors;
        const to3=(p,t)=>{ let x=p[0]*S, y=p[1]*S; const r=Math.hypot(x,y); if(r>RMAX){ x*=RMAX/r; y*=RMAX/r; } return [x,t*DZ,-y]; };
        const H=30*DZ+.4;
        /* eigen walls (real) or the unit cylinder (complex) */
        if(e.real){ e.v.forEach((v,i)=>{ const col=hx(i?K17.alt:K17.word); const w=CIN.prim.glass(ctx,2*RMAX,H,col,isLight?.13:.12); w.position.set(0,H/2,0); w.rotation.y=Math.atan2(v[1],v[0]); dyn.add(w);
            const ln=liveTube(ctx,col,.02,.9); aimTube(THREE,ln,[-v[0]*RMAX,.02,v[1]*RMAX],[v[0]*RMAX,.02,-v[1]*RMAX]); dyn.add(ln);
            const tag=lab(ctx,'λ'+SUB(i+1)+' = '+N(e.l[i],3),[v[0]*(RMAX-.1)*(i?-1:1),H*(i?.55:.9),-v[1]*(RMAX-.1)*(i?-1:1)],{size:22,weight:700,scale:.0095,color:i?c.s2:c.s1,bg:true}); dyn.add(tag); }); }
        else { const r=e.rho*S; const cyl=new THREE.Mesh(new THREE.CylinderGeometry(Math.min(RMAX,S),Math.min(RMAX,S),H,64,1,true),new THREE.MeshStandardMaterial({color:hx(K17.gate),transparent:true,opacity:isLight?.1:.08,side:THREE.DoubleSide,depthWrite:false,emissive:hx(K17.gate),emissiveIntensity:.1}));
          cyl.position.y=H/2; dyn.add(cyl); dyn.add(lab(ctx,'complex λ · |λ| = '+N(e.rho,3),[0,H+.25,0],{size:26,weight:700,scale:.0095,color:c.s4,bg:true})); }
        /* the two parts of the note, each drawn on its own wall: one keeps its size, the other shrinks by λ every step */
        const cf=coefs(e);
        if(cf){ e.v.forEach((v,i)=>{ const col=hx(i?K17.alt:K17.word), cp=[]; for(let t=0;t<=st.n;t++){ const m=cf[i]*Math.pow(e.l[i],t); cp.push(to3([v[0]*m,v[1]*m],t)); }
            if(cp.length>1) dyn.add(polyTube(ctx,cp,col,.014,false)); }); }
        /* the start vector on the floor */
        const a=CIN.prim.arrow(ctx,[0,.03,0],to3(st.v,0).map((q,i)=>i===1?.03:q),hx(K17.mem),{radius:.03,head:.2}); dyn.add(a);
        /* the climbing chain of beads: bead t above W^t v */
        const n=st.n, pts=[]; for(let t=0;t<=n;t++) pts.push(to3(P[t],t));
        if(pts.length>1){ const path=polyTube(ctx,pts,hx(K17.mem),.028,false); dyn.add(path); }
        pts.forEach((p,t)=>{ const off=Math.hypot(P[t][0]*S,P[t][1]*S)>RMAX; const d=CIN.prim.dot(ctx,p,off?critHex():hx(K17.mem),t===n?.1:.058); dyn.add(d); });
        /* its shadow on the floor: the plain 2-D path of the note */
        if(pts.length>1){ const sh=CIN.prim.path(ctx,pts.map(p=>[p[0],.012,p[2]]),hx(K17.gate),{opacity:.8}); dyn.add(sh); }
        const tip=pts[pts.length-1]; const drop=liveTube(ctx,hx(K17.gate),.01,.55); aimTube(THREE,drop,[tip[0],.01,tip[2]],tip); dyn.add(drop);
        dyn.add(lab(ctx,'t = '+n,[tip[0]+.5,tip[1]+.22,tip[2]+.3],{size:22,weight:700,scale:.0095,color:c.s3,bg:true}));
        dyn.add(lab(ctx,'time ↑',[-RMAX+.2,H*.6,-RMAX+.2],{size:22,scale:.0095,color:c.muted,bg:false}));
        RR(ctx); };
      ctx.redraw();
    }}); }
  const S3=mountStage(box,build); flipRemount(S3);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  ids.forEach((id,i)=>document.getElementById(id).addEventListener('input',e=>{ const v=parseFloat(e.target.value); if(!isFinite(v)) return; st.M[i>>1][i&1]=Math.max(-3,Math.min(3,v)); st.pre=''; pressOnly(document.getElementById('em-pre'),null); redraw(); }));
  document.getElementById('em-pre').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ st.pre=b.dataset.p; st.M=PRE[b.dataset.p].map(r=>r.slice()); syncInputs(); pressOnly(document.getElementById('em-pre'),b); st.n=30; redraw(); }));
  let tw=null; document.getElementById('em-play').addEventListener('click',()=>{ if(tw) tw.stop(); tw=tween(3000,u=>{ const n=Math.round(u*30); if(n!==st.n){ st.n=n; redraw(); } },()=>{ st.n=30; redraw(); }); });
  syncInputs(); readout(); onResize(readout);
  window.U17Eigen={st,redraw,PRE};
})();
