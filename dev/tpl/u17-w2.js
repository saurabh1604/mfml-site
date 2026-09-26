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
    s2s:{n:6,ins:['train','is','late',null,null,null],outs:[null,null,null,'train','late','hai'],split:3,title:'many → many, different length · translate',say:'An <b class="m">encoder</b> reads the English; its last note is handed to a <b style="color:var(--s6)">decoder</b> that writes the Hindi. Different lengths, different order — this is §12.'},
    lm:{n:5,ins:['the','train','to','Delhi','is'],outs:['train','to','Delhi','is','late'],title:'next word · a language model',say:'At every word, guess the <em>next</em> word. The true next word is the target, so the loss adds one surprise per step.'}};
  const st={job:'m1',k:-1};
  let S={};
  function draw(){ svg.innerHTML=''; const J=JOBS[st.job], n=J.n, lm=st.job==='lm', V=narrowSVG(svg,760,340,440,lm?590:340), ph=V.n, W=V.W, glow=glo(svg);
    const x0=ph?46:(lm?80:95), span=ph?W-92:(lm?430:570), xs=i=>x0+i*(span/(n-1)), yc=170, cw=ph?Math.min(64,span/(n-1)-10):64, ch=44, tw=ph?Math.min(76,span/(n-1)-4):72;
    txt(svg,16,24,J.title,'font:700 12.5px system-ui;fill:var(--ink-2)');
    for(let i=0;i<n;i++){ const x=xs(i), dec=J.split!=null&&i>=J.split, cur=i===st.k, act=st.k<0||i<=st.k;
      /* note arrow */
      if(i>0){ const hand=J.split!=null&&i===J.split; edge(svg,xs(i-1)+cw/2+2,yc,x-cw/2-3,yc,hand?cv(K17.gate):cv(K17.mem),hand?3:2.2,act?glow:null,act?1:.3);
        if(hand) txt(svg,(xs(i-1)+x)/2,ph?yc-ch/2-8:yc-ch/2-8,'summary','font:700 10.5px system-ui;fill:'+cv(K17.gate),'middle'); }
      const g=el('g',{opacity:act?1:.35},svg);
      const cr=el('rect',{x:x-cw/2,y:yc-ch/2,width:cw,height:ch,rx:10,fill:dec?'color-mix(in srgb,var(--s6) 12%,transparent)':'color-mix(in srgb,var(--s3) 12%,transparent)',stroke:dec?cv(K17.prob):cv(K17.mem),'stroke-width':cur?2.6:1.5},g); if(cur&&glow) cr.setAttribute('filter',glow);
      txt(g,x,yc+4,dec?'decoder':(J.split!=null?'encoder':'cell'),'font:700 10.5px system-ui;fill:var(--ink-2)','middle');
      if(J.ins[i]){ const gi=el('g',{opacity:act?1:.35},svg); el('rect',{x:x-tw/2,y:268,width:tw,height:26,rx:7,fill:'color-mix(in srgb,var(--s1) 18%,transparent)',stroke:cv(K17.word),'stroke-width':1.3},gi);
        txt(gi,x,285,J.ins[i],'font:700 11px system-ui;fill:var(--ink)','middle'); edge(gi,x,266,x,yc+ch/2+3,cv(K17.word),2,null,1); }
      if(J.outs[i]){ const go=el('g',{opacity:act?1:.3},svg); edge(go,x,yc-ch/2-3,x,82,cv(K17.prob),2,null,1);
        el('rect',{x:x-(tw+8)/2,y:52,width:tw+8,height:26,rx:7,fill:'color-mix(in srgb,var(--s6) 18%,transparent)',stroke:cv(K17.prob),'stroke-width':1.3},go);
        txt(go,x,69,ph&&J.outs[i]==='happy 0.93'?'happy':J.outs[i],'font:700 11px system-ui;fill:var(--ink)','middle'); } }
    const nIn=J.ins.filter(Boolean).length, nOut=J.outs.filter(Boolean).length;
    txt(svg,16,lm&&ph?322:322,'inputs '+nIn+' · read-outs '+nOut,'font:600 11px system-ui;fill:var(--ink-muted)');
    let extra='';
    let barsOut=[];
    if(lm){ const k=Math.max(0,Math.min(3,st.k<0?2:st.k)), D=LM[k], bx=ph?16:556, bw=ph?W-80:156, by=ph?350:0, lw=ph?78:62;
      txt(svg,bx,by+48,'after "'+J.ins.slice(0,k+1).join(' ')+'"','font:700 11px system-ui;fill:var(--ink-2)');
      txt(svg,bx,by+66,'guess for the next word','font:500 10.5px system-ui;fill:var(--ink-muted)');
      D.w.forEach((w,j)=>{ const y=by+(ph?80:84)+j*(ph?44:42), p=D.p[j], truth=w===J.outs[k];
        txt(svg,bx,y+13,w,'font:700 11px system-ui;fill:'+(truth?'var(--ink)':'var(--ink-2)'));
        el('rect',{x:bx+lw,y:y,width:bw-lw,height:18,rx:5,fill:'none',stroke:'var(--line)'},svg);
        const g=el('g',glow?{filter:glow}:{},svg); const r=el('rect',{x:bx+lw,y:y,width:Math.max(2,(bw-lw)*p),height:18,rx:5,fill:cv(K17.prob),opacity:truth?1:.55},g); r.dataset.p=p; r.dataset.w=w;
        barsOut.push({w,p,width:Math.max(2,(bw-lw)*p),scale:bw-lw});
        txt(svg,bx+bw+4,y+13,N(p,3),'font:700 10.5px system-ui;fill:'+cv(K17.prob)); if(truth&&!ph) txt(svg,bx,y+30,'← true next word · loss −ln '+N(p,3)+' = '+N(-Math.log(p),3),'font:600 10px system-ui;fill:var(--critical)'); });
      extra='<br>After "'+J.ins.slice(0,k+1).join(' ')+'": '+D.w.map((w,j)=>w+' <b class="p">'+N(D.p[j],3)+'</b>').join(' · ')+(D.sc?' (softmax of the scores 2, 1, 0.5, −1)':' (made-up numbers for the picture)')+'.';
      svg.dataset.lm=D.p.map(v=>v.toFixed(3)).join(','); }
    read.innerHTML=J.say+extra; svg.dataset.job=st.job; svg.dataset.io=nIn+','+nOut; mfont(svg); declutter(svg);
    S={job:st.job,k:st.k,io:[nIn,nOut],bars:barsOut}; }
  tabs(document.getElementById('sh-tabs'),t=>{ st.job=t; st.k=-1; draw(); });
  let timer=null; document.getElementById('sh-play').addEventListener('click',()=>{ clearInterval(timer); const n=JOBS[st.job].n, last=st.job==='lm'?3:n-1; st.k=0; draw(); if(RM){ st.k=last; draw(); return; }
    timer=setInterval(()=>{ st.k++; if(st.k>last){ clearInterval(timer); st.k=st.job==='lm'?last:-1; } draw(); },st.job==='lm'?1100:600); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17Shapes={st,draw,LM}; reg('w-shapes',{state:()=>JSON.parse(JSON.stringify(S)),st,draw,LM});
})();

/* ---------- §6 · w-bptt: the step machine through time ---------- */
(function(){
  const root=document.getElementById('w-bptt'); if(!root) return;
  const svg=document.getElementById('bp-svg'), card=document.getElementById('bp-card'), scrub=document.getElementById('bp-scrub'), count=document.getElementById('bp-count');
  const G=bptt1(BP.w,BP.u,BP.b,BP.x,BP.y), T=4, KT=2;       /* KT: how many steps the truncated walk goes back */
  let trunc=false; const cut=t=>trunc&&t<=T-KT;             /* words the truncated blame never reaches */
  const dwT=()=>{ let s=0; for(let t=T;t>T-KT;t--) s+=G.cw[t]; return s; };
  const STEPS=[...[1,2,3,4].map(t=>({id:'F'+t,kind:'f',t})),{id:'S',kind:'s'},...[4,3,2,1].map(t=>({id:'B'+t,kind:'b',t})),{id:'Σ',kind:'u'}];
  let k=0;
  const n4=v=>N(v,4);
  scrub.innerHTML=STEPS.map((s,i)=>`<button type="button" class="${s.kind==='f'?'f':s.kind==='u'?'u':'b'}" data-i="${i}" role="tab">${s.id}</button>`).join('');
  scrub.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>go(+b.dataset.i)));
  let S={};
  function draw(){ svg.innerHTML=''; const V=narrowSVG(svg,560,372,440,400), ph=V.n, glow=glo(svg), s=STEPS[k], xs=t=>ph?62+(t-1)*92:84+(t-1)*114, yc=ph?150:140, LX=ph?412:522, discs=[];
    const fwdDone=t=>s.kind!=='f'||t<=s.t, bwdAt=t=>{ if(s.kind==='f') return false; if(s.kind==='s') return t===4; if(s.kind==='u') return true; return t>=s.t; };
    txt(svg,16,22,ph?'→ forward: the note':'forward: the note goes right','font:700 11px system-ui;fill:'+cv(K17.mem)); txt(svg,ph?16:544,ph?44:22,ph?'← backward: the blame':'backward: the blame comes back','font:700 11px system-ui;fill:var(--critical)',ph?'start':'end');
    for(let t=1;t<=T;t++){ const x=xs(t), on=fwdDone(t), cur=(s.kind==='f'||s.kind==='b')&&s.t===t;
      if(t>1) edge(svg,xs(t-1)+30,yc,x-32,yc,cv(K17.mem),2,on?glow:null,on?1:.25);
      if(bwdAt(t)&&t>1&&s.kind!=='s'&&(s.kind==='u'||t-1>=s.t-1)&&(s.kind==='u'||t>s.t)&&!cut(t-1)) edge(svg,x-32,yc+14,xs(t-1)+30,yc+14,'var(--critical)',1.8,glow,.85);
      const g=el('g',{opacity:on?1:.3},svg); if(cur&&glow) g.setAttribute('filter',glow);
      el('rect',{x:x-30,y:yc-24,width:60,height:48,rx:10,fill:'color-mix(in srgb,var(--s3) 11%,transparent)',stroke:cur?(s.kind==='b'?'var(--critical)':cv(K17.mem)):cv(K17.mem),'stroke-width':cur?2.6:1.4},g);
      txt(g,x,yc+4,'tanh','font:700 11px system-ui;fill:var(--ink-2)','middle');
      /* input */
      const gi=el('g',{opacity:on?1:.3},svg); el('rect',{x:x-20,y:yc+62,width:40,height:24,rx:6,fill:'color-mix(in srgb,var(--s1) 18%,transparent)',stroke:cv(K17.word)},gi); txt(gi,x,yc+78,'x = '+BP.x[t-1],'font:700 10.5px system-ui;fill:var(--ink)','middle'); edge(gi,x,yc+60,x,yc+27,cv(K17.word),1.6,null,1);
      /* note value */
      if(on){ txt(svg,x,yc-36,(ph?'':'h'+SUB(t)+' = ')+n4(G.h[t]),'font:700 11.5px system-ui;fill:'+cv(K17.mem),'middle'); }
      /* blame disc (area ∝ |blame|) — a dashed socket waits for it */
      if(!bwdAt(t)||cut(t)){ el('circle',{cx:x,cy:yc+150,r:16,fill:'none',stroke:'var(--critical)','stroke-dasharray':'3 4',opacity:.4},svg); if(t===1&&!ph) txt(svg,xs(1)-38,yc+154,'blame','font:600 10px system-ui;fill:var(--critical);opacity:.6','end'); }
      if(bwdAt(t)&&!cut(t)){ const v=G.dh[t], r=Math.max(2.5,(ph?32:40)*Math.sqrt(Math.abs(v)/Math.abs(G.dh[4]))); const dg=el('g',glow?{filter:glow}:{},svg);
        const c=el('circle',{cx:x,cy:yc+150,r,fill:'var(--critical)',opacity:.75},dg); c.dataset.t=t; c.dataset.v=v; discs.push({t,v,r}); txt(svg,x,yc+150+Math.max(r,8)+14,(ph?'':'∂L/∂h'+SUB(t)+' ')+n4(v),'font:700 10.5px system-ui;fill:var(--critical)','middle'); } }
    if(trunc){ const xc=(xs(T-KT)+xs(T-KT+1))/2; el('line',{x1:xc,y1:yc+110,x2:xc,y2:yc+190,stroke:cv(K17.gate),'stroke-width':2,'stroke-dasharray':'4 3'},svg); txt(svg,xc,yc+206,'✂ cut','font:800 11px system-ui;fill:'+cv(K17.gate),'middle'); }
    edge(svg,xs(1)-58,yc,xs(1)-32,yc,cv(K17.mem),1.6,null,.7); txt(svg,xs(1)-48,yc-8,'h₀','font:700 10.5px system-ui;fill:'+cv(K17.mem),'middle');
    /* loss */
    const lossOn=s.kind!=='f'||s.t===4; const lg=el('g',{opacity:lossOn&&s.kind!=='f'?1:.3},svg); edge(lg,xs(4)+30,yc,LX-18,yc,'var(--ink-muted)',1.4,null,1);
    el('rect',{x:LX-18,y:yc-15,width:36,height:30,rx:7,fill:'color-mix(in srgb,var(--critical) 20%,transparent)',stroke:'var(--critical)','stroke-width':1.6},lg); txt(lg,LX,yc+5,'L','font:800 13px system-ui;fill:var(--critical)','middle');
    if(s.kind!=='f') txt(svg,ph?436:LX,ph?yc+36:yc-24,'L = '+n4(G.L),'font:700 10.5px system-ui;fill:var(--critical)',ph?'end':'middle');
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
    else if(s.kind==='b'&&cut(s.t)){ html=`<div class="st-head">${badge}<span class="st-rule u">✂ cut</span></div><p class="st-title">Word ${s.t}: the blame never arrives</p>
      <p class="st-sub">Truncated BPTT walks back only ${KT} steps from the loss, so it stops after word ${T-KT+1}. The note of word ${s.t} still flowed forward — but word ${s.t} gets no blame, and its copy of the cell reports nothing for w.</p>`; }
    else if(s.kind==='b'){ const t=s.t; html=`<div class="st-head">${badge}<span class="st-rule a">Rule A</span><span class="st-rule b">Rule B</span></div><p class="st-title">Back through word ${t}</p>
      <div class="fw-rows"><div class="fw-row on">Rule A · ∂L/∂z${SUB(t)} = ∂L/∂h${SUB(t)} · (1 − h${SUB(t)}²) = ${n4(G.dh[t])} · ${n4(1-G.h[t]**2)} = ${n4(G.dz[t])}</div>
      <div class="fw-row on">Rule B · to the weight: ∂L/∂z${SUB(t)} · h${SUB(t-1)} = ${n4(G.dz[t])} · ${n4(G.h[t-1])} = <b style="color:var(--s4)">${n4(G.cw[t])}</b></div>
      <div class="fw-row on">Rule B · to the old note: ∂L/∂h${SUB(t-1)} = w · ∂L/∂z${SUB(t)} = 0.5 · ${n4(G.dz[t])} = <b style="color:var(--critical)">${n4(G.dh[t-1])}</b></div></div>
      <p class="st-sub">${t===1?'Word 1 reports 0 for w, because the note that came in, h₀, was 0.':'The blame shrinks by the factor w·(1 − h²) ≈ '+N(BP.w*(1-G.h[t]**2),3)+' on its way back.'}</p>`; }
    else if(trunc){ html=`<div class="st-head">${badge}<span class="st-rule u">add up</span></div><p class="st-title">One w, only ${KT} reports: add them</p>
      <div class="fw-rows"><div class="fw-row on">∂L/∂w ≈ ${[4,3].map(t=>'('+n4(G.cw[t])+')').join(' + ')} = <b style="color:var(--s4)">${n4(dwT())}</b></div><div class="fw-row on">∂L/∂u ≈ 0 (the only word with x ≠ 0, word 1, is beyond the cut)</div></div>
      <div class="st-win">Full BPTT gives <b>${n4(G.dw)}</b>. The truncated walk gives <b>${n4(dwT())}</b>: words 1 and 2 lost their votes.</div>`; }
    else { html=`<div class="st-head">${badge}<span class="st-rule u">add up</span></div><p class="st-title">One w, four reports: add them</p>
      <div class="fw-rows"><div class="fw-row on">∂L/∂w = ${[4,3,2,1].map(t=>'('+n4(G.cw[t])+')').join(' + ')}</div><div class="fw-row on">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <b style="color:var(--s4)">${n4(G.dw)}</b></div>
      <div class="fw-row on">∂L/∂u = ∂L/∂z₁ · x₁ = <b>${n4(G.du)}</b> (only word 1 is non-zero)</div></div>
      <div class="st-win">The blame fell from <b>${n4(G.dh[4])}</b> at word 4 to <b>${n4(G.dh[1])}</b> at word 1 — about ${N(G.dh[4]/G.dh[1],1)} times smaller.</div>`; }
    card.innerHTML=html;
    scrub.querySelectorAll('button').forEach((b,i)=>{ b.setAttribute('aria-selected',i===k?'true':'false'); b.classList.toggle('done',i<k); });
    count.textContent='step '+(k+1)+' / '+STEPS.length; root.dataset.step=s.id;
    S={step:s.id,k,trunc,h:G.h.slice(),dh:G.dh.map((v,t)=>cut(t)&&t>=1?null:v),cw:G.cw.map((v,t)=>cut(t)?0:v),dw:trunc?dwT():G.dw,L:G.L,discs}; }
  function go(i){ k=Math.max(0,Math.min(STEPS.length-1,i)); draw(); }
  document.getElementById('bp-next').addEventListener('click',()=>go(k+1));
  document.getElementById('bp-prev').addEventListener('click',()=>go(k-1));
  document.getElementById('bp-reset').addEventListener('click',()=>{ stop(); trunc=false; const tb=document.getElementById('bp-trunc'); if(tb) tb.setAttribute('aria-pressed','false'); go(0); });
  let timer=null; const pb=document.getElementById('bp-play');
  const stop=()=>{ clearInterval(timer); timer=null; pb.textContent='▶ play'; };
  pb.addEventListener('click',()=>{ if(timer){ stop(); return; } if(k>=STEPS.length-1) k=-1; pb.textContent='❚❚ pause'; go(k+1); timer=setInterval(()=>{ if(k>=STEPS.length-1){ stop(); return; } go(k+1); },RM?50:1300); });
  const tbtn=document.getElementById('bp-trunc'); if(tbtn) tbtn.addEventListener('click',()=>{ trunc=!trunc; tbtn.setAttribute('aria-pressed',trunc); draw(); });
  go(0); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17BPTT={go,G,STEPS}; reg('w-bptt',{state:()=>JSON.parse(JSON.stringify(S)),go,G,STEPS,setTrunc:v=>{ trunc=!!v; if(tbtn) tbtn.setAttribute('aria-pressed',trunc); draw(); }});
})();

/* ---------- §7 · w-power: powers of one number (the whisper line) ---------- */
(function(){
  const svg=document.getElementById('pw-svg'); if(!svg) return;
  const read=document.getElementById('pw-read');
  const D0={w:.5,T:10,tanh:false}; const st=Object.assign({},D0);
  const LO=-16, HI=9;                                          /* log10 range of the axis: every bar for w in [0.5, 1.5] fits, nothing is clipped */
  function vals(){ const out=[]; if(!st.tanh){ for(let t=1;t<=50;t++) out.push(Math.pow(st.w,t)); return out; }
    const r=rnn1(st.w,1,0,[1].concat(new Array(50).fill(0)),0); let p=1; for(let t=1;t<=50;t++){ p*=st.w*(1-r.h[t+1]**2); out.push(p); } return out; }
  let S={};
  function draw(){ svg.innerHTML=''; const VB=narrowSVG(svg,760,300,440,320), ph=VB.n, glow=glo(svg), V=vals(), W=VB.W, H=VB.H, L=ph?50:52, R=ph?64:112, Tp=34, B=ph?44:40;
    const py=v=>{ const l=Math.max(LO,Math.min(HI,Math.log10(Math.max(1e-300,v)))); return Tp+(HI-l)/(HI-LO)*(H-Tp-B); }, bw=(W-L-R)/50, px=t=>L+(t-1)*bw;
    for(let e=-16;e<=8;e+=4){ const y=py(10**e); el('line',{x1:L,y1:y,x2:W-R,y2:y,stroke:'var(--grid)','stroke-width':1},svg); txt(svg,L-6,y+3.5,e===0?'1':'10'+SUP(e),'font:500 10px system-ui;fill:var(--ink-muted)','end').classList.add('tick'); }
    [[1e-3,ph?'1/1000':'one thousandth'],[1e3,ph?'1000':'a thousand']].forEach(([v,l])=>{ const y=py(v); el('line',{x1:L,y1:y,x2:W-R,y2:y,stroke:'var(--ink-muted)','stroke-width':1,'stroke-dasharray':'5 4'},svg); txt(svg,W-R+6,y+4,l,'font:600 10.5px system-ui;fill:var(--ink-muted)'); });
    const y1=py(1); el('line',{x1:L,y1:y1,x2:W-R,y2:y1,stroke:'var(--axis)','stroke-width':1.6},svg); txt(svg,W-R+6,y1+4,ph?'1':'1 = the start','font:700 10.5px system-ui;fill:var(--ink-2)');
    const g=el('g',glow?{filter:glow}:{},svg), bars=[], ghosts=[];
    if(st.tanh) for(let t=1;t<=50;t++){ const v0=Math.pow(st.w,t), y=py(v0);   /* dashed outlines: the plain powers w^t, so the squeeze can be seen */
      const r=el('rect',{x:px(t)+1.2,y:Math.min(y,y1),width:bw-2.4,height:Math.max(1,Math.abs(y-y1)),rx:2,fill:'none',stroke:'var(--ink-muted)','stroke-width':1,'stroke-dasharray':'3 2',opacity:.9},svg); r.dataset.ghost=t; ghosts.push({t,v:v0,top:Math.min(y,y1),h:Math.abs(y-y1)}); }
    V.forEach((v,i)=>{ const t=i+1, y=py(v), up=v>=1, sel=t===st.T; const col=sel?cv(K17.gate):up?'var(--critical)':cv(K17.mem);
      const r=el('rect',{x:px(t)+1.2,y:Math.min(y,y1),width:bw-2.4,height:Math.max(1,Math.abs(y-y1)),rx:2,fill:col,opacity:sel?1:.8},sel?g:svg); r.dataset.t=t; r.dataset.v=v;
      bars.push({t,v,top:Math.min(y,y1),h:Math.abs(y-y1),clipped:Math.log10(Math.max(v,1e-300))<LO||Math.log10(v)>HI});
      if(Math.log10(Math.max(v,1e-300))<LO){ const xm=px(t)+bw/2, ym=H-B-2; el('path',{d:`M${(xm-3).toFixed(1)},${ym-5} h6 l-3,5 z`,fill:'var(--ink)','data-role':'below-floor'},svg); } });   /* below the axis floor: a small triangle (a shape, not text, so no step tick is ever hidden) */
    /* a small marker under the chosen bar, and the value in a fixed place */
    const xs=px(st.T)+bw/2; el('path',{d:`M${xs},${Tp-4} l-5,-7 h10 z`,fill:cv(K17.gate)},svg);
    for(let t=ph?10:5;t<=50;t+=ph?10:5) txt(svg,px(t)+bw/2,H-B+15,String(t),'font:500 10px system-ui;fill:var(--ink-muted)','middle').classList.add('tick');
    if(ph) txt(svg,W-R+16,H-B+15,'t →','font:600 10.5px system-ui;fill:var(--ink-muted)');   /* phones: in the right margin, on the tick row, so no tick is hidden */
    else txt(svg,W-R,H-B+30,'steps t →','font:600 10.5px system-ui;fill:var(--ink-muted)','end');
    const v=V[st.T-1];
    txt(svg,L,20,(st.tanh?'blame after '+st.T+' steps, with tanh = ':'w'+SUP(st.T)+' = ')+E(v,3),'font:800 13px system-ui;fill:'+cv(K17.gate));
    let cross='';
    if(!st.tanh){ if(st.w<1){ const n=Math.floor(Math.log(1e-3)/Math.log(st.w))+1; cross='It first drops below one thousandth at <b>t = '+n+'</b>.'; }
      else if(st.w>1){ const n=Math.floor(Math.log(1e3)/Math.log(st.w))+1; cross='It first passes a thousand at <b>t = '+n+'</b>.'; }
      else cross='Exactly 1 at every step: the knife edge.'; }
    read.innerHTML=(st.tanh?'With tanh (the cell reads 1, then zeros): blame after '+st.T+' steps = <b class="g">'+E(v,3)+'</b>, against w'+SUP(st.T)+' = '+E(Math.pow(st.w,st.T),3)+' without it (the dashed outlines).'+(st.w>1&&V[49]<1?'<br>The note gets stuck near '+N(Math.abs(rnn1(st.w,1,0,[1].concat(new Array(50).fill(0)),0).h[51]),2)+', where tanh is flat, so each step passes on less than 1: the explosion has turned into fading.':''):'w = <b>'+N(st.w,2)+'</b> · after t = '+st.T+' steps: w'+SUP(st.T)+' = <b class="g">'+E(v,4)+'</b><br>'+cross)+
      '<br><span class="warnmsg" style="color:'+(V[49]>=1?'var(--critical)':'var(--s3)')+'">'+(st.tanh?'tanh only shrinks the factors':(st.w<1?'memory fades':st.w>1?'blame explodes':'held steady'))+'</span>';
    svg.dataset.v=String(v); svg.dataset.w=st.w; svg.dataset.T=st.T;
    S={w:st.w,T:st.T,tanh:st.tanh,vals:V.slice(),bars,ghosts,map:{LO,HI,Tp,B,H,y1}};
    mfont(svg); declutter(svg); }
  bindCtl('pw-w',v=>{ st.w=v; draw(); },v=>N(v,2)); bindCtl('pw-T',v=>{ st.T=v; draw(); },v=>String(v));
  document.querySelectorAll('#w-power .preset[data-w]').forEach(b=>b.addEventListener('click',()=>{ st.w=+b.dataset.w; setCtl('pw-w',st.w,v=>N(v,2)); draw(); }));
  const tb=document.getElementById('pw-tanh'); tb.addEventListener('click',()=>{ st.tanh=!st.tanh; tb.setAttribute('aria-pressed',st.tanh); draw(); });
  document.getElementById('pw-reset').addEventListener('click',()=>{ Object.assign(st,D0); tb.setAttribute('aria-pressed','false'); setCtl('pw-w',st.w,v=>N(v,2)); setCtl('pw-T',st.T,v=>String(v)); draw(); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  window.U17Power={st,draw}; reg('w-power',{state:()=>JSON.parse(JSON.stringify(S)),st,draw});
})();

/* ---------- §7 · w-eigen-memory: powers of a matrix, seen on the plane and on a log chart (2-D rebuild) ---------- */
(function(){
  const pl=document.getElementById('em-plane'), ch=document.getElementById('em-bars'); if(!pl||!ch) return;
  const read=document.getElementById('em-read');
  const PRE={fade:[[.5,.2],[.1,.4]],keep:[[.9,.4],[.1,.6]],explode:[[1.1,.2],[.1,1]],rotate:[[.8,-.6],[.6,.8]]};
  const D0={M:PRE.keep.map(r=>r.slice()),v:[1,0],n:30,pre:'keep'};
  const st=JSON.parse(JSON.stringify(D0));
  const ids=['em-a','em-b','em-c','em-d'], TMAX=30;
  const syncInputs=()=>ids.forEach((id,i)=>{ document.getElementById(id).value=+st.M[i>>1][i&1].toFixed(3); });
  const lamTxt=e=>e.real?('λ₁ = '+N(e.l[0],3)+', λ₂ = '+N(e.l[1],3)):('λ = '+N(e.re,3)+' ± '+N(e.im,3)+'i');
  function coefs(e){ if(!e.real) return null; const [p,q]=e.v, det=p[0]*q[1]-p[1]*q[0]; if(Math.abs(det)<1e-9) return null;
    return [(st.v[0]*q[1]-st.v[1]*q[0])/det,(p[0]*st.v[1]-p[1]*st.v[0])/det]; }
  function verdict(e){ const r=e.rho; if(!e.real) return Math.abs(r-1)<1e-6?'turns, length kept':r<1?'spirals in: fades':'spirals out: explodes'; return Math.abs(r-1)<1e-6?'keeps one direction':r<1?'fades':'explodes'; }
  let S={};
  function compute(){ const e=eig2(st.M), P=orbit2(st.M,st.v,TMAX), norms=P.map(p=>Math.hypot(p[0],p[1])), cf=coefs(e);
    const parts=cf?[0,1].map(i=>P.map((_,t)=>Math.abs(cf[i])*Math.pow(Math.abs(e.l[i]),t))):null;
    const mod=!e.real?P.map((_,t)=>Math.hypot(...st.v)*Math.pow(e.rho,t)):null;
    return {e,P,norms,cf,parts,mod}; }
  function drawPlane(C){ const V=narrowSVG(pl,400,380,400,380), W=V.W, H=V.H; const e=C.e, P=C.P;
    const inf=Math.max(...P.map(p=>Math.max(Math.abs(p[0]),Math.abs(p[1])))), R=Math.max(1.25,Math.min(3,1.12*Math.max(1,Math.min(inf,3))));
    const p=plane(pl,-R,R,-R*H/W,R*H/W,{pad:24,step:1}); tickify(pl); const glow=p.glow, map={ox:p.px(0),oy:p.py(0),s:p.px(1)-p.px(0)};
    const inView=q=>Math.abs(q[0])<=R&&Math.abs(q[1])<=R*H/W;
    const cols=[cv(K17.word),cv(K17.alt)];
    txt(pl,10,16,'the note’s plane','font:700 11px system-ui;fill:var(--ink-2)').setAttribute('data-leg',1);
    const legBg=el('rect',{x:5,y:20,width:e.real?196:232,height:e.real?40:22,rx:7,fill:'var(--surface-2, var(--surface))',opacity:.94},pl);
    if(e.real){ e.v.forEach((u,i)=>{ const L=3*R; const g=el('g',glow?{filter:glow}:{},pl);
        el('line',{x1:p.px(-u[0]*L),y1:p.py(-u[1]*L),x2:p.px(u[0]*L),y2:p.py(u[1]*L),stroke:cols[i],'stroke-width':2,opacity:.8,'data-eig':i},g);
        /* a legend in the corner says which line is which: nothing is written on top of the lines or the dots */
        el('line',{x1:10,y1:30+i*17,x2:28,y2:30+i*17,stroke:cols[i],'stroke-width':3,'data-leg':1},pl);
        txt(pl,33,34+i*17,'λ'+SUB(i+1)+' = '+N(e.l[i],3)+(Math.abs(e.l[i])<1-1e-9?' (shrinks)':Math.abs(e.l[i])>1+1e-9?' (grows)':' (kept)'),'font:800 11.5px system-ui;fill:'+cols[i]).setAttribute('data-leg',1); }); }
    else { const r=Math.hypot(...st.v); el('circle',{cx:p.px(0),cy:p.py(0),r:r*map.s,fill:'none',stroke:cv(K17.gate),'stroke-width':1.4,'stroke-dasharray':'5 4',opacity:.8},pl);
      txt(pl,10,34,'λ = '+N(e.re,3)+' ± '+N(e.im,3)+'i · |λ| = '+N(e.rho,3),'font:800 11.5px system-ui;fill:'+cv(K17.gate)).setAttribute('data-leg',1);
      txt(pl,W/2,H-10,'no real eigen-direction: every direction turns','font:700 11px system-ui;fill:'+cv(K17.gate),'middle'); }
    /* the start vector */
    arrow(p,0,0,st.v[0],st.v[1],cv(K17.mem),2.6,'v','font:800 13px system-ui;fill:'+cv(K17.mem));
    /* the path of W^t v */
    const n=st.n; let d='', off=-1; const dots=[];
    for(let t=0;t<=n;t++){ const q=P[t]; if(!inView(q)){ if(off<0) off=t; continue; } d+=(d?'L':'M')+p.px(q[0]).toFixed(1)+','+p.py(q[1]).toFixed(1); }
    if(d) el('path',{d,fill:'none',stroke:cv(K17.gate),'stroke-width':1.2,opacity:.55},pl);
    for(let t=1;t<=n;t++){ const q=P[t]; if(!inView(q)) continue; const last=t===n; const c=el('circle',{cx:p.px(q[0]),cy:p.py(q[1]),r:last?6.5:Math.max(2.6,4.8-t*.07),fill:last?cv(K17.gate):cv(K17.mem),opacity:last?1:Math.max(.35,1-t*.025)},pl);
      if(last&&glow) c.setAttribute('filter',glow); c.dataset.t=t; dots.push({t,x:q[0],y:q[1]}); }
    [1,2].forEach(t=>{ if(t<=n&&inView(P[t])&&Math.hypot(P[t][0]-P[t-1][0],P[t][1]-P[t-1][1])*map.s>16){ const q=P[t]; const lt=txt(pl,p.px(q[0])+8,p.py(q[1])-8,'t = '+t,'font:700 10.5px system-ui;fill:var(--ink-2)'); lt.dataset.alt='-44,0;0,20;-44,20'; } });
    if(off>=0){ const q=P[off], a=Math.atan2(q[1],q[0]), ex=R*.93*Math.cos(a)/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a))*W/H), ey=R*H/W*.93*Math.sin(a)/Math.max(Math.abs(Math.sin(a)),Math.abs(Math.cos(a))*H/W);
      arrow(p,ex*.8,ey*.8,ex,ey,'var(--critical)',3); txt(pl,W-10,16,'↗ off the map from t = '+off,'font:800 11.5px system-ui;fill:var(--critical)','end'); }
    /* the newest dot, split into its two eigen-parts */
    if(C.cf&&n>=1&&inView(P[n])){ const A=[e.v[0][0]*C.cf[0]*Math.pow(e.l[0],n),e.v[0][1]*C.cf[0]*Math.pow(e.l[0],n)];
      el('line',{x1:p.px(0),y1:p.py(0),x2:p.px(A[0]),y2:p.py(A[1]),stroke:cols[0],'stroke-width':3,'stroke-dasharray':'6 4'},pl);
      el('line',{x1:p.px(A[0]),y1:p.py(A[1]),x2:p.px(P[n][0]),y2:p.py(P[n][1]),stroke:cols[1],'stroke-width':3,'stroke-dasharray':'6 4'},pl); }
    if(st.pre==='keep'){ el('circle',{cx:p.px(.8),cy:p.py(.2),r:10,fill:'none',stroke:cv(K17.gate),'stroke-width':1.4,'stroke-dasharray':'3 3'},pl); const t=txt(pl,p.px(.8)+14,p.py(.2)+22,'(0.8, 0.2)','font:700 11px system-ui;fill:'+cv(K17.gate)); t.dataset.alt='-80,0;0,-34'; }
    /* keep the legend on top of the lines */
    [legBg,...pl.querySelectorAll('[data-leg]')].forEach(n=>pl.appendChild(n));
    mfont(pl);
    { let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; pl.querySelectorAll('[data-leg]').forEach(n=>{ const b=n.getBBox(); x0=Math.min(x0,b.x); y0=Math.min(y0,b.y); x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height); });
      if(x1>x0){ legBg.setAttribute('x',x0-5); legBg.setAttribute('y',y0-4); legBg.setAttribute('width',x1-x0+10); legBg.setAttribute('height',y1-y0+8); } }      /* the legend's backing card fits the (possibly enlarged) text */
    declutter(pl);
    return {R,map,dots,off}; }
  function drawChart(C){ ch.innerHTML=''; const V=narrowSVG(ch,440,380,440,380), ph=V.n, W=V.W, H=V.H, L=46, Rm=14, Tp=ph?58:46, B=ph?52:38, glow=glo(ch);   /* phones draw this chart small, so its text is enlarged: give the top tick, the step ticks and the axis title rows of their own */
    const vals=[...C.norms]; if(C.parts) C.parts.forEach(a=>vals.push(...a)); if(C.mod) vals.push(...C.mod);
    const lg=v=>Math.log10(Math.max(v,1e-300)); let lo=Math.floor(Math.min(...vals.map(lg))+1e-9), hi=Math.ceil(Math.max(...vals.map(lg))-1e-9);
    lo=Math.max(lo,-18); hi=Math.min(Math.max(hi,lo+1),8); if(hi-lo<2){ lo=Math.min(lo,-1); hi=Math.max(hi,1); }
    const bw=(W-L-Rm)/(TMAX+1), px=t=>L+(t+.5)*bw, py=v=>Tp+(hi-Math.max(lo,Math.min(hi,lg(v))))/(hi-lo)*(H-Tp-B), floorY=py(Math.pow(10,lo));
    const k=Math.max(1,Math.ceil((hi-lo)/6));
    for(let e=hi;e>=lo;e-=k){ const y=py(Math.pow(10,e)); el('line',{x1:L,y1:y,x2:W-Rm,y2:y,stroke:'var(--grid)'},ch); txt(ch,L-6,y+3.5,e===0?'1':'10'+SUP(e),'font:500 10px system-ui;fill:var(--ink-muted)','end').classList.add('tick'); }
    if(lo<0&&hi>0){ const y1=py(1); el('line',{x1:L,y1:y1,x2:W-Rm,y2:y1,stroke:'var(--axis)','stroke-width':1.5},ch); }
    for(let t=0;t<=TMAX;t+=5){ txt(ch,px(t),H-B+15,String(t),'font:500 10px system-ui;fill:var(--ink-muted)','middle').classList.add('tick'); }
    if(ph) txt(ch,(L+W-Rm)/2,H-4,'steps t →','font:600 10.5px system-ui;fill:var(--ink-muted)','middle'); else txt(ch,W-Rm,H-6,'steps t','font:600 10.5px system-ui;fill:var(--ink-muted)','end');
    /* legend */
    txt(ch,10,16,'length of Wᵗv (bars, log scale)','font:700 11px system-ui;fill:var(--ink-2)');
    const leg=C.parts?[['part along λ₁',cv(K17.word)],['part along λ₂',cv(K17.alt)]]:C.mod?[['|λ|ᵗ · |v|',cv(K17.gate)]]:[['the eigen-directions coincide: no split',cv(K17.gate)]];
    leg.forEach(([t,c],i)=>{ const x=10+i*150; el('line',{x1:x,y1:31,x2:x+18,y2:31,stroke:c,'stroke-width':3},ch); txt(ch,x+23,35,t,'font:700 10.5px system-ui;fill:'+c); });
    const n=st.n, bars=[];
    for(let t=0;t<=TMAX;t++){ const v=C.norms[t], y=py(v), col=v>1+1e-9?'var(--critical)':v<1-1e-9?cv(K17.mem):cv(K17.gate);
      const r=el('rect',{x:px(t)-bw/2+1,y,width:Math.max(1,bw-2),height:Math.max(1,floorY-y),rx:2,fill:col,opacity:t<=n?.82:.14},ch); r.dataset.t=t; r.dataset.v=v; bars.push({t,v,y,h:floorY-y}); }
    const lines=C.parts?C.parts:C.mod?[C.mod]:[], lc=C.parts?[cv(K17.word),cv(K17.alt)]:[cv(K17.gate)];
    lines.forEach((arr,i)=>{ let d='', cut=-1; for(let t=0;t<=TMAX;t++){ if(lg(arr[t])<lo-1e-9){ cut=t; break; } d+=(d?'L':'M')+px(t).toFixed(1)+','+py(arr[t]).toFixed(1); }
      if(d) glowPath(ch,d,lc[i],2.4,!!glow,{'data-line':i});
      if(cut>0) txt(ch,px(cut-1),floorY-4,'↓','font:800 12px system-ui;fill:'+lc[i],'middle'); });
    mfont(ch); declutter(ch);
    return {lo,hi,L,Tp,B,H,bw,floorY,bars}; }
  function redraw(){ const C=compute(), e=C.e, P=C.P, nm=v=>Math.hypot(v[0],v[1]);
    const PL=drawPlane(C), CH=drawChart(C);
    read.innerHTML=lamTxt(e)+'<br>|λ|<sub>max</sub> = <b class="g">'+N(e.rho,4)+'</b> → <b class="'+(e.rho>1+1e-9?'r':'m')+'">'+verdict(e)+'</b>'+
      '<br>W¹v = '+vecN(P[1],3)+' · W²v = '+vecN(P[2],3)+'<br>W¹⁰v = '+vecN(P[10],4)+' · ‖W³⁰v‖ = <b>'+E(nm(P[30]),4)+'</b>'+
      (st.pre==='keep'?'<br>v = 0.2·(4, 1) + 0.2·(1, −1): the first part stays, the second halves.':'')+(PL.off>=0?'<br><b class="r">Off the map</b> from t = '+PL.off+'.':'');
    S={M:st.M.map(r=>r.slice()),v:st.v.slice(),pre:st.pre,n:st.n,real:e.real,l:e.real?e.l.slice():[e.re,e.im],evec:e.real?e.v.map(u=>u.slice()):null,rho:e.rho,cf:C.cf,P:P.map(q=>q.slice()),norms:C.norms.slice(),parts:C.parts,plane:PL,chart:CH};
    box.dataset.state=JSON.stringify({rho:+e.rho.toFixed(6),real:e.real,l:e.real?e.l.map(x=>+x.toFixed(6)):[+e.re.toFixed(6),+e.im.toFixed(6)],p10:P[10].map(x=>+x.toFixed(6))}); }
  const box=document.getElementById('w-eigen-memory');
  ids.forEach((id,i)=>document.getElementById(id).addEventListener('input',ev=>{ const v=parseFloat(ev.target.value); if(!isFinite(v)) return; st.M[i>>1][i&1]=Math.max(-3,Math.min(3,v)); st.pre=''; pressOnly(document.getElementById('em-pre'),null); redraw(); }));
  document.getElementById('em-pre').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ st.pre=b.dataset.p; st.M=PRE[b.dataset.p].map(r=>r.slice()); syncInputs(); pressOnly(document.getElementById('em-pre'),b); redraw(); }));
  bindCtl('em-t',v=>{ st.n=v; redraw(); },v=>String(v));
  let tw=null; document.getElementById('em-play').addEventListener('click',()=>{ if(tw) tw.stop(); let last=-1; tw=tween(3200,u=>{ const n=Math.round(u*TMAX); if(n!==last){ last=n; st.n=n; setCtl('em-t',n,v=>String(v)); redraw(); } },()=>{ st.n=TMAX; setCtl('em-t',TMAX,v=>String(v)); redraw(); }); });
  document.getElementById('em-reset').addEventListener('click',()=>{ if(tw) tw.stop(); Object.assign(st,JSON.parse(JSON.stringify(D0))); syncInputs(); setCtl('em-t',st.n,v=>String(v)); pressOnly(document.getElementById('em-pre'),document.querySelector('#em-pre [data-p="keep"]')); redraw(); });
  syncInputs(); redraw(); new MutationObserver(redraw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(redraw);
  window.U17Eigen={st,redraw,PRE}; reg('w-eigen-memory',{state:()=>JSON.parse(JSON.stringify(S)),st,redraw,PRE});
})();
