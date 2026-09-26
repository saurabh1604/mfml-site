/* ================= UNIT 16 · widgets of Acts I–II: w-onehot, w-bigram, w-smooth, w-perplexity ================= */
/* SVG text that stays readable on a phone: font sizes are multiplied by k so that the smallest label renders at ≥ 11 px */
function svgK(svg,base){ const cw=svg.getBoundingClientRect().width||svg.parentNode.getBoundingClientRect().width||600, vbW=+svg.viewBox.baseVal.width||600; return Math.max(1,Math.min(2.4,11.2/((base||10)*cw/vbW))); }
const FT=(w,px,k,fill)=>'font:'+w+' '+(px*(k||1)).toFixed(1)+'px Inter,system-ui;fill:'+fill;
/* choose a compact viewBox on narrow screens; returns true when narrow */
function vbFor(svg,wide,narrow){ const cw=svg.parentNode.getBoundingClientRect().width||svg.getBoundingClientRect().width||700; const n=cw<520; svg.setAttribute('viewBox',n?narrow:wide); return n; }
/* 3-D stages on a phone: step the camera back and grow the sprite labels so the picture still fits and reads */
const isNarrow=box=>(box.clientWidth||box.getBoundingClientRect().width||600)<560;
const camFit=(box,pos,look,k)=>isNarrow(box)?pos.map((p,i)=>look[i]+(p-look[i])*(k||1.35)):pos;
const LSc=box=>isNarrow(box)?1.32:1;
const onTheme=fn=>new MutationObserver(fn).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
function onResizeW(el,fn){ let w=0; new ResizeObserver(()=>{ const x=Math.round(el.getBoundingClientRect().width); if(x&&Math.abs(x-w)>30){ w=x; fn(); } }).observe(el); }
/* a glowing SVG arrow without an SVG filter (filters on straight lines misrender): halo underlay + shaft + head */
function garrow(svg,x1,y1,x2,y2,color,w,glow){ const g=el('g',{},svg), dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L, hl=Math.min(11+w,L*.45), hx=x2-ux*hl, hy=y2-uy*hl;
  if(glow) el('line',{x1,y1,x2:hx,y2:hy,stroke:color,'stroke-width':w*3.4,'stroke-linecap':'round',opacity:.2},g);
  el('line',{x1,y1,x2:hx,y2:hy,stroke:color,'stroke-width':w,'stroke-linecap':'round'},g);
  const nx=-uy*(hl*.45), ny=ux*(hl*.45); el('polygon',{points:`${x2},${y2} ${hx+nx},${hy+ny} ${hx-nx},${hy-ny}`,fill:color},g); return g; }
function chipRow(host,words,cls,onPick){ host.innerHTML=words.map(w=>`<button type="button" class="wchip ${cls||''}" data-w="${esc(w)}" aria-pressed="false">${esc(w)}</button>`).join('');
  host.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>onPick(b.dataset.w))); }
function pressChip(host,w){ host.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.w===w?'true':'false')); }
/* a probability printed so that tiny values stay readable: 0.667 · 0.0125 · 0.00006 */
function pf(v){ if(!isFinite(v)) return '—'; if(Math.abs(v)<1e-15) return '0'; const a=Math.abs(v); if(a>=.1) return trim(F(v,3)); if(a>=.001) return trim(F(v,4)); return nm(v.toFixed(Math.min(9,Math.ceil(-Math.log10(a))))); }
/* the rendered boxes of an SVG's text, for the overlap tests (viewBox units) */
/* nudge any label that crosses the edge of the picture back inside (unrotated text only) */
function fitIn(svg,m){ m=m==null?2:m; const vb=svg.viewBox&&svg.viewBox.baseVal; if(!vb||!vb.width) return;
  svg.querySelectorAll('text').forEach(t=>{ if(t.getAttribute('transform')||t.closest('[transform]')) return; let b; try{ b=t.getBBox(); }catch(e){ return; } if(!b||!b.width) return;
    let dx=0, dy=0; if(b.x<vb.x+m) dx=vb.x+m-b.x; else if(b.x+b.width>vb.x+vb.width-m) dx=vb.x+vb.width-m-(b.x+b.width);
    if(b.y<vb.y+m) dy=vb.y+m-b.y; else if(b.y+b.height>vb.y+vb.height-m) dy=vb.y+vb.height-m-(b.y+b.height);
    if(dx) t.setAttribute('x',+t.getAttribute('x')+dx); if(dy) t.setAttribute('y',+t.getAttribute('y')+dy); }); }
function textBoxes(svg){ return [...svg.querySelectorAll('text')].filter(t=>t.textContent.trim()&&t.getAttribute('opacity')!=='0').map(t=>{ const b=t.getBBox(); return {t:t.textContent,x:b.x,y:b.y,w:b.width,h:b.height}; }); }

/* ---------- §1 · w-onehot: three words on three axes, then free to lean together (3-D) ---------- */
(function(){
  const box=document.getElementById('oh-3d'); if(!box||!CIN) return;
  const W=['chai','coffee','cricket'];
  const ONE=[[1,0,0],[0,1,0],[0,0,1]], MEAN=[[.84,.52,.16],[.55,.82,.17],[.13,.1,.99]].map(v=>vscale(v,1/norm(v)));   /* hand-made "meaning" directions */
  const st={m:0}; const read=document.getElementById('oh-read');
  const vecs=()=>ONE.map((o,i)=>{ const v=o.map((x,j)=>x+(MEAN[i][j]-x)*st.m); return vscale(v,1/norm(v)); });
  const PAIRS=[[0,1],[0,2],[1,2]];
  function readout(){ const V=vecs(), d=(a,b)=>norm(vsub(a,b));
    const row=(i,j)=>`${W[i]} · ${W[j]}: cos&nbsp;<b>${N(cosSim(V[i],V[j]),3)}</b> · dist&nbsp;<b>${N(d(V[i],V[j]),3)}</b>`;
    read.innerHTML=PAIRS.map(([i,j])=>row(i,j)).join('<br>')+(st.m<.01?'<br><span style="color:var(--ink-muted)">every pair: at right angles, the same distance — a directory</span>':st.m>.99?'<br><span style="color:var(--ink-muted)">now "close" can mean "similar" — a map</span>':''); }
  let S3=null, ctxRef=null; const L=2.1;
  const P=v=>[v[0]*L,v[2]*L,v[1]*L];   /* math (chai, coffee, cricket) → three.js: chai along x, coffee along z (toward the viewer), cricket up */
  function build(){ return CIN.stage3d(box,{camera:{pos:camFit(box,[6.3,4.1,4.9],[.7,.62,.7],1.08),look:[.7,.62,.7],fov:34},orbit:true,autoRotate:.1,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx); ctxRef=ctx;
      starfield(ctx,260,14); const g=CIN.prim.grid(ctx,8,16,hx('grid'),{opacity:isLight?.45:.25}); g.position.set(0,-.001,0); root.add(g);
      [[1,0,0],[0,1,0],[0,0,1]].forEach(a=>root.add(tube(ctx,[0,0,0],P(a).map(x=>x*1.18),hx('axis'),.006,.5)));
      const cube=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L,L,L)),new THREE.LineBasicMaterial({color:hx('grid'),transparent:true,opacity:isLight?.5:.35})); cube.position.set(L/2,L/2,L/2); root.add(cube);
      const cols=[hx(K16.tea),hx(K16.tea),hx(K16.cricket)];
      const arrows=W.map((w,i)=>{ const a=CIN.prim.arrow(ctx,[0,0,0],P(ONE[i]),cols[i],{radius:.04,head:.26}); root.add(a); return a; });
      const tips=W.map((w,i)=>{ const h=haloSprite(ctx,cols[i],.55); root.add(h); return h; });
      const labs=W.map(()=>tslot(ctx,root)), links=PAIRS.map(([i,j])=>{ const t=liveTube(ctx,hx(i+j===1?K16.gold:'ink2'),.011,isLight?.7:.6); t.material.depthWrite=false; root.add(t); return {i,j,t,lab:tslot(ctx,root)}; });
      /* labels are laid out on the screen (layoutLabels): each word next to its arrow tip, each distance next to the middle of its dashed line,
         never on top of one another and never off the stage — re-done whenever the camera moves */
      let lastCam='';
      ctx.relabel=()=>{ const V=vecs().map(P), U=vecs();
        const items=W.map((w,i)=>({slot:labs[i],anchor:V[i].map(x=>x*1.3),text:w,prio:0,opts:{size:24,scale:.0105*(isNarrow(box)?1.08:1),color:colors.ink,bg:true,weight:700}}));   /* just beyond each tip */
        links.forEach(o=>{ const mid=V[o.i].map((x,k)=>(x+V[o.j][k])/2); items.push({slot:o.lab,anchor:mid,text:N(norm(vsub(U[o.i],U[o.j])),3),prio:1,opts:{size:20,scale:.009*(isNarrow(box)?1.05:1),color:o.i+o.j===1?colors.s4:colors.muted,bg:true}}); });
        layoutLabels(ctx,items,{avoid:V}); };
      ctx.redraw=()=>{ const V=vecs().map(P);
        arrows.forEach((a,i)=>a.userData.set(new THREE.Vector3(0,0,0),new THREE.Vector3(...V[i]))); tips.forEach((h,i)=>h.position.set(...V[i]));
        links.forEach(o=>aimTube(THREE,o.t,V[o.i],V[o.j]));
        ctx.relabel(); lastCam=''; RR(ctx); };
      ctx.tick=()=>{ const q=ctx.camera.position, k=q.x.toFixed(3)+','+q.y.toFixed(3)+','+q.z.toFixed(3)+','+ctx.size.w; if(k!==lastCam){ lastCam=k; ctx.relabel(); return true; } return false; };
      ctx.redraw(); if(matchMedia('(hover:hover) and (pointer:fine)').matches) hint(box,'drag to orbit');
    }, update(ctx){ return ctx.tick?ctx.tick():false; } }); }
  S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  const bar=document.getElementById('oh-mode'); let tw=null;
  function go(to,dur){ if(tw) tw.stop(); const from=st.m; tw=tween(dur,u=>{ st.m=from+(to-from)*u; redraw(); },()=>{ st.m=to; redraw(); }); }
  tabs(bar,t=>go(t==='meaning'?1:0,1400));
  document.getElementById('oh-play').addEventListener('click',()=>{ bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t==='meaning'?'true':'false')); st.m=0; redraw(); setTimeout(()=>go(1,2600),250); });
  readout();
  U16['w-onehot']={state(){ const V=vecs(), o={m:st.m,vecs:V,cos:{},dist:{},labels:S3&&S3.handle&&ctxRef&&!ctxRef.dead?labelRects(ctxRef):null}; PAIRS.forEach(([i,j])=>{ const k=W[i]+'·'+W[j]; o.cos[k]=cosSim(V[i],V[j]); o.dist[k]=norm(vsub(V[i],V[j])); }); return o; },
    set(m){ if(tw) tw.stop(); st.m=m; redraw(); }};
})();

/* ---------- §2 · w-bigram: a guesser with a short memory — count, guess, chain, write ---------- */
(function(){
  const ta=document.getElementById('bg-text'); if(!ta) return;
  const tbl=document.getElementById('bg-table'), prevHost=document.getElementById('bg-prev'), svg=document.getElementById('bg-bars'), read=document.getElementById('bg-read'),
    out=document.getElementById('bg-out'), strip=document.getElementById('bg-strip'), chainEl=document.getElementById('bg-chain'), scIn=document.getElementById('bg-score'), memBar=document.getElementById('bg-mem');
  const MK=new Set(['<s>','</s>','⟨s⟩','⟨/s⟩']);
  const st={mem:1,prev:'drink',model:null,chain:null,step:-1,timer:null,hold:null,gen:0};
  ta.value=BIGRAM_DEFAULT;
  const lines=()=>ta.value.split('\n').map(l=>l.trim().split(/\s+/).filter(w=>w&&!MK.has(w))).filter(l=>l.length);
  const pad=(toks,mem)=>[...Array(mem).fill(BOS),...toks,EOS];
  function build(mem){ const C={}, rows=[], next=[];
    lines().forEach(l=>{ const seq=pad(l,mem); for(let i=mem;i<seq.length;i++){ const h=seq.slice(i-mem,i).join(' '), w=seq[i];
      if(!C[h]){ C[h]={}; rows.push(h); } C[h][w]=(C[h][w]||0)+1; if(w!==EOS&&!next.includes(w)) next.push(w); } });
    next.push(EOS); return {C,rows,next,mem}; }
  const tot=(M,h)=>Object.values(M.C[h]||{}).reduce((a,b)=>a+b,0);
  const prob=(M,h,w)=>{ const c=(M.C[h]||{})[w]||0, n=tot(M,h); return {num:c,den:n,p:n?c/n:0}; };
  function chainOf(M,toks){ const seq=pad(toks,M.mem), steps=[]; let P=1;
    for(let i=M.mem;i<seq.length;i++){ const h=seq.slice(i-M.mem,i).join(' '), w=seq[i], o=prob(M,h,w); P*=o.p; steps.push(Object.assign({h,w,i,run:P,seen:!!M.C[h]},o)); }
    return {seq,steps,P}; }
  const defPrev=M=>{ const want=M.mem===1?'drink':'I drink'; return M.rows.includes(want)?want:(M.rows[0]||''); };
  function drawTable(){ const M=st.model, V=M.next, mx=Math.max(1,...M.rows.map(r=>Math.max(...Object.values(M.C[r]))));
    const used={}; if(st.chain) st.chain.steps.forEach((s,k)=>{ if(st.step<0||k<=st.step) used[s.h+'→'+s.w]=(used[s.h+'→'+s.w]||[]).concat(k+1); });
    const cur=st.step>=0&&st.chain?st.chain.steps[st.step]:null;
    let h='<table class="bgt"><thead><tr><th class="corner">history ↓ · next →</th>'+V.map(w=>`<th class="${cur&&cur.w===w?'hot':''}">${esc(w)}</th>`).join('')+'<th class="tot">total</th></tr></thead><tbody>';
    M.rows.forEach(r=>{ const on=r===st.prev; h+=`<tr class="${on?'on':''}"><th class="rh${on?' on':''}" data-h="${esc(r)}">${esc(r)} →</th>`+V.map(w=>{ const c=(M.C[r]||{})[w]||0, u=used[r+'→'+w], now=cur&&cur.h===r&&cur.w===w;
      return `<td class="${c?'':'z'}${u?' path':''}${now?' now':''}" style="--h:${(c/mx).toFixed(3)}">${c}${u?`<i class="stepb">${u.join(',')}</i>`:''}</td>`; }).join('')+`<td class="tot">${tot(M,r)}</td></tr>`; });
    tbl.innerHTML=h+'</tbody></table>'; tbl.querySelectorAll('th.rh').forEach(th=>th.addEventListener('click',()=>pick(th.dataset.h))); }
  function drawBars(){ const M=st.model; const narrow=vbFor(svg,'0 0 560 220','0 0 340 260'); svg.innerHTML=''; const k=svgK(svg,10.5), glow=glo(svg), V=M.next;
    const W=narrow?340:560, H=narrow?260:220, L=narrow?12:34, R=12, T=narrow?46:30, B=narrow?66:44, bw=(W-L-R)/V.length;
    const ps=V.map(n=>prob(M,st.prev,n)), top=Math.max(.34,...ps.map(o=>o.p)), py=p=>H-B-(p/top)*(H-T-B);
    const cur=st.step>=0&&st.chain?st.chain.steps[st.step]:null;
    [0,.25,.5,.75,1].filter(v=>v<=top+1e-9).forEach(v=>{ el('line',{x1:L,x2:W-R,y1:py(v),y2:py(v),stroke:'var(--grid)','stroke-width':1},svg); if(!narrow) txt(svg,L-5,py(v)+3.5,N(v,2),FT(500,9.5,k,'var(--ink-muted)'),'end'); });
    V.forEach((n,i)=>{ const o=ps[i], x=L+i*bw+bw*.16, w=bw*.68, y=py(o.p), g=el('g',{},svg), hot=cur&&cur.h===st.prev&&cur.w===n;
      const col=hot?cv(K16.gold):o.p>0?cv(K16.prob):'var(--ink-muted)';
      if(glow&&o.p>0) el('rect',{x:x-2,y:y-2,width:w+4,height:Math.max(0,H-B-y)+2,rx:5,fill:col,opacity:.18},g);
      el('rect',{class:'bar','data-w':n,'data-p':o.p.toFixed(6),x,y,width:w,height:Math.max(0,H-B-y),rx:4,fill:col,opacity:o.p>0?.92:.3},g);
      if(o.p>0) txt(svg,x+w/2,y-5,o.num+'/'+o.den,FT(700,9.5,k,'var(--ink)'),'middle');
      const lab=txt(svg,x+w/2,H-B+14*k,n,FT(hot?800:600,10,k,hot?cv(K16.gold):'var(--ink-2)'),narrow?'end':'middle'); if(narrow) lab.setAttribute('transform',`rotate(-50 ${x+w/2} ${H-B+10})`); });
    txt(svg,L,16*k*.9,'next word after “'+st.prev+'”'+(M.mem===2?' · memory: 2 words':' · memory: 1 word'),FT(700,10.5,k,'var(--ink-muted)'));
  }
  function readout(){ const M=st.model; if(!M.C[st.prev]){ read.innerHTML='“'+esc(st.prev)+'” is never followed by anything, so it has no row.'; return; }
    const V=M.next, n=tot(M,st.prev), list=V.map(w=>Object.assign({w},prob(M,st.prev,w))).filter(o=>o.p>0).sort((a,b)=>b.p-a.p);
    read.innerHTML=list.slice(0,4).map(o=>`P(${esc(o.w)} | ${esc(st.prev)}) = ${o.num}/${o.den} = <b>${N(o.p,3)}</b>`).join('<br>')+(list.length>4?'<br><span style="color:var(--ink-muted)">… and '+(list.length-4)+' more</span>':'')+
      `<br><span style="color:var(--ink-muted)">history “${esc(st.prev)}” was seen ${n} time${n===1?'':'s'} · memory ${M.mem} word${M.mem===1?'':'s'}</span>`; }
  function drawChain(){ const C=st.chain; if(!C){ strip.innerHTML=''; chainEl.innerHTML=''; return; }
    const k=st.step, cur=k>=0?C.steps[k]:null, M=st.model;
    strip.innerHTML=C.seq.map((w,i)=>{ let cls='tk'+(MK.has(w)?' mk':'');
      if(cur){ if(i===cur.i) cls+=' tgt'; else if(i>=cur.i-M.mem&&i<cur.i) cls+=' mem'; else if(i<cur.i) cls+=' gone'; else cls+=' todo'; }
      return `<span class="${cls}">${esc(w)}</span>`; }).join(' ')+(cur?`<span class="bg-memlab">memory: ${M.mem} word${M.mem===1?'':'s'}</span>`:'');
    const shown=k>=0?C.steps.slice(0,k+1):C.steps, done=k<0||k===C.steps.length-1;
    chainEl.innerHTML=shown.map((s,j)=>`<span class="bc${s.p>0?'':' zero'}${j===k?' cur':''}"><i>P(${esc(s.w)} | ${esc(s.h)})</i><b>${s.den?s.num+'/'+s.den:'0'}</b></span>`).join('<span class="bx">×</span>')+
      (done?`<span class="bx">=</span><span class="bc tot${C.P>0?'':' zero'}"><i>whole sentence</i><b>${C.P>0?N(C.P,4):'0'}</b></span>`:`<span class="bx">…</span><span class="bc run"><i>so far</i><b>${N(shown[shown.length-1].run,4)}</b></span>`); }
  function score(){ const w=scIn.value.trim().split(/\s+/).filter(x=>x&&!MK.has(x)); st.chain=w.length?chainOf(st.model,w):null; }
  function all(){ stopPlay(); const M=st.model=build(st.mem); if(!M.C[st.prev]) st.prev=defPrev(M); score();
    chipRow(prevHost,M.rows,'',pick); pressChip(prevHost,st.prev); drawTable(); drawBars(); readout(); drawChain(); }
  function pick(h){ st.prev=h; pressChip(prevHost,h); drawTable(); drawBars(); readout(); }
  function stopPlay(){ if(st.timer){ clearInterval(st.timer); st.timer=null; } if(st.step>=0){ st.step=-1; if(st.hold!=null&&st.model&&st.model.C[st.hold]) st.prev=st.hold; } }
  function showStep(){ const s=st.chain.steps[st.step]; if(s&&st.model.C[s.h]) st.prev=s.h; pressChip(prevHost,st.prev); drawTable(); drawBars(); readout(); drawChain(); }
  function play(){ stopPlay(); score(); if(!st.chain) return; st.hold=st.prev;
    if(RM){ drawTable(); drawBars(); readout(); drawChain(); return; }
    st.step=0; showStep(); st.timer=setInterval(()=>{ if(st.step>=st.chain.steps.length-1){ clearInterval(st.timer); st.timer=null; setTimeout(()=>{ if(st.timer) return; stopPlay(); drawTable(); drawBars(); readout(); drawChain(); },900); return; } st.step++; showStep(); },900); }
  function generate(seed){ const M=st.model; if(!M.rows.length) return ''; const r=rng16(seed==null?(7919+(++st.gen)*104729):seed);
    const hist=Array(M.mem).fill(BOS), words=[];
    while(words.length<14){ const h=hist.slice(-M.mem).join(' '), row=M.C[h]; if(!row) break; const tot2=Object.values(row).reduce((a,b)=>a+b,0); let x=r()*tot2, pick2=null;
      for(const [w,c] of Object.entries(row)){ x-=c; if(x<=0){ pick2=w; break; } } if(pick2==null) pick2=Object.keys(row).pop();
      words.push(pick2); hist.push(pick2); if(pick2===EOS) break; }
    const shown=[BOS,...words]; out.innerHTML=shown.map((x,i)=>`<span class="gw${MK.has(x)?' mk':''}" style="animation-delay:${i*110}ms">${esc(x)}</span>`).join(' '); out.dataset.words=shown.join(' '); return shown.join(' '); }
  scIn.addEventListener('input',()=>{ stopPlay(); score(); drawTable(); drawChain(); });
  let deb=null; ta.addEventListener('input',()=>{ clearTimeout(deb); deb=setTimeout(all,180); });
  tabs(memBar,t=>{ st.mem=+t; st.prev=defPrev(build(st.mem)); all(); });
  document.getElementById('bg-reset').addEventListener('click',()=>{ ta.value=BIGRAM_DEFAULT; st.prev=defPrev(build(st.mem)); all(); });
  document.getElementById('bg-add').addEventListener('click',()=>{ if(!/^\s*we drink coffee\s*$/m.test(ta.value)) ta.value=ta.value.replace(/\s*$/,'')+'\nwe drink coffee'; all(); });
  document.getElementById('bg-gen').addEventListener('click',()=>generate());
  document.getElementById('bg-play').addEventListener('click',play);
  all(); onTheme(drawBars); onResizeW(svg.parentNode,drawBars);
  U16['w-bigram']={state(){ const M=st.model, row={}; M.next.forEach(w=>{ row[w]=prob(M,st.prev,w).p; });
      return {mem:M.mem,prev:st.prev,next:M.next.slice(),rows:M.rows.slice(),counts:JSON.parse(JSON.stringify(M.C)),row,rowSum:Object.values(row).reduce((a,b)=>a+b,0),
        chain:st.chain?st.chain.steps.map(s=>({h:s.h,w:s.w,num:s.num,den:s.den,p:s.p})):[],product:st.chain?st.chain.P:null,step:st.step,
        bars:[...svg.querySelectorAll('rect.bar')].map(r=>({w:r.dataset.w,p:+r.dataset.p,h:+r.getAttribute('height'),y:+r.getAttribute('y')})),
        pathCells:[...tbl.querySelectorAll('td.path')].length, words:out.dataset.words||''}; },
    pick, setMem(m){ memBar.querySelector(`[data-t="${m}"]`).click(); }, score(s){ scIn.value=s; stopPlay(); score(); drawTable(); drawChain(); }, play, generate, all, stop(){ stopPlay(); drawTable(); drawBars(); drawChain(); }};
})();

/* ---------- §3 · w-smooth: where does the probability go? ---------- */
(function(){
  const svg=document.getElementById('sm-svg'); if(!svg) return;
  const read=document.getElementById('sm-read'), st={mode:'mle',t:0,lk:-1,lam:.8};
  const Vof=t=>Math.round(7*Math.pow(50000/7,t)), kOf=x=>Math.pow(10,x);
  const V=()=>st.mode==='interp'?7:Vof(st.t);
  const cur=()=>smoothRow(st.mode,V(),kOf(st.lk),st.lam);
  const kTxt=x=>{ const k=kOf(x); return k>=.1?trim(F(k,2)):trim(F(k,3)); };
  function ctlState(){ const on={'sm-v':st.mode==='add1'||st.mode==='addk'||st.mode==='mle','sm-k':st.mode==='addk','sm-l':st.mode==='interp'};
    Object.entries(on).forEach(([id,o])=>{ const r=document.getElementById(id); r.disabled=!o; r.closest('.ctl').classList.toggle('off',!o); });
    document.getElementById('sm-v-o').textContent=commas(V()); }
  function draw(){ const narrow=vbFor(svg,'0 0 600 330','0 0 340 440'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg), R=cur(), mle=smoothRow('mle',7,0,0);
    const names=SM_WORDS.slice(), showO=R.others.n>0, labs=showO?names.concat(['others']):names;
    const W=narrow?340:600, L=narrow?14:40, Rr=10, T=narrow?44:34, H=narrow?270:236, n=labs.length, bw=(W-L-Rr)/n;
    const vals=names.map(w=>R.p[w]).concat(showO?[R.others.total]:[]), top=Math.max(.7,...vals), py=v=>T+(H-T)*(1-v/top);
    [0,.25,.5].forEach(v=>{ el('line',{x1:L,x2:W-Rr,y1:py(v),y2:py(v),stroke:'var(--grid)','stroke-width':1},svg); if(!narrow) txt(svg,L-6,py(v)+3.5,N(v,2),FT(500,9.5,k,'var(--ink-muted)'),'end'); });
    txt(svg,L,T-16,'chance of each word after “drink”'+(showO?' · V = '+commas(V()):''),FT(700,10,Math.min(k,1.3),'var(--ink-muted)'));
    labs.forEach((w,i)=>{ const v=vals[i], seen=(SM_ROW[w]||0)>0, x=L+i*bw+bw*.17, bwid=bw*.66, y=py(v), g=el('g',{},svg);
      const col=w==='others'?cv('s2'):seen?cv(K16.prob):cv('s2');
      if(glow&&v>0) el('rect',{x:x-2,y:y-2,width:bwid+4,height:Math.max(0,py(0)-y)+2,rx:5,fill:col,opacity:.16},g);
      el('rect',{class:'bar','data-w':w,'data-v':v.toFixed(9),x,y,width:bwid,height:Math.max(0,py(0)-y),rx:4,fill:col,opacity:w==='others'?.55:.9},g);
      if(w!=='others'&&st.mode!=='mle'){ const m=mle.p[w]; if(m>0) el('rect',{class:'ghost',x:x-3,y:py(m),width:bwid+6,height:py(0)-py(m),rx:4,fill:'none',stroke:'var(--ink-2)','stroke-width':1.3,'stroke-dasharray':'4 3',opacity:.8},g); }
      txt(svg,x+bwid/2,Math.min(y,st.mode!=='mle'&&w!=='others'&&mle.p[w]>0?py(mle.p[w]):y)-6,pf(v),FT(700,narrow?9.5:9.5,k,'var(--ink)'),'middle');
      const lab=txt(svg,x+bwid/2,H+14*k,w==='others'?'+'+commas(R.others.n)+' more':w,FT(600,10,k,w==='others'?cv('s2'):'var(--ink-2)'),narrow?'end':'middle');
      if(narrow) lab.setAttribute('transform',`rotate(-45 ${x+bwid/2} ${H+10})`); });
    /* the meter: kept by the words really seen vs moved to words never seen */
    const my=narrow?H+96:H+50, mw=W-L-Rr, kx=L+mw*R.kept;
    el('rect',{x:L,y:my,width:mw,height:16,rx:8,fill:cv('s2'),opacity:.8},svg); el('rect',{class:'kept',x:L,y:my,width:Math.max(0,mw*R.kept),height:16,rx:8,fill:cv(K16.prob),opacity:.95},svg);
    txt(svg,L,my+34*Math.min(k,1.2),'kept by chai + coffee: '+N(100*R.kept,1)+'%',FT(700,10,Math.min(k,1.25),cv(K16.prob)));
    txt(svg,W-Rr,my+(narrow?52:34)*Math.min(k,1.2),'given to words never seen: '+N(100*R.moved,1)+'%',FT(700,10,Math.min(k,1.25),cv('s2')),'end');
    const sumTxt=Math.abs(R.sum-1)<1e-9?'1':N(R.sum,6);
    read.innerHTML={mle:'count ÷ total — the raw row',add1:'add-one: (c + 1) / (3 + V)',addk:'add-k: (c + k) / (3 + kV), k = '+kTxt(st.lk),interp:'λ · bigram + (1 − λ) · unigram, λ = '+N(st.lam,2)}[st.mode]+
      `<br>P(chai | drink) = <b>${pf(R.p.chai)}</b> · P(cricket | drink) = <b>${pf(R.p.cricket)}</b>`+(R.others.n?`<br>${commas(R.others.n)} other words get <b>${pf(R.others.each)}</b> each — <b>${pf(R.others.total)}</b> in all`:'')+
      (st.mode==='interp'?'<br><span style="color:var(--ink-muted)">the unigram adviser only knows the 7 words it has met, so V stays 7 here</span>':'')+`<br><span style="color:var(--ink-muted)">the row adds up to ${sumTxt}</span>`; }
  tabs(document.getElementById('sm-mode'),t=>{ st.mode=t; ctlState(); draw(); });
  bindCtl('sm-v',v=>{ st.t=v; ctlState(); draw(); },v=>commas(Vof(v)));
  bindCtl('sm-k',v=>{ st.lk=v; draw(); },v=>kTxt(v));
  bindCtl('sm-l',v=>{ st.lam=v; draw(); },v=>N(v,2));
  ctlState(); draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  U16['w-smooth']={state(){ const R=cur(); return {mode:st.mode,V:V(),k:kOf(st.lk),lam:st.lam,p:R.p,others:R.others,sum:R.sum,kept:R.kept,moved:R.moved,
      bars:[...svg.querySelectorAll('rect.bar')].map(r=>({w:r.dataset.w,v:+r.dataset.v,h:+r.getAttribute('height')})),keptW:+svg.querySelector('rect.kept').getAttribute('width'),texts:textBoxes(svg)}; },
    set(o){ Object.assign(st,o); if(o.mode) document.querySelectorAll('#sm-mode button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===st.mode?'true':'false'));
      setCtl('sm-v',st.t,v=>commas(Vof(v))); setCtl('sm-k',st.lk,v=>kTxt(v)); setCtl('sm-l',st.lam,v=>N(v,2)); ctlState(); draw(); }};
})();

/* ---------- §4 · w-perplexity: surprise bars and a spinner with "perplexity" equal slices ---------- */
(function(){
  const svg=document.getElementById('pp-svg'); if(!svg) return;
  const read=document.getElementById('pp-read'); const p=[.5,.25,.5,.125];
  const stats=()=>{ const s=p.map(x=>Math.log2(1/x)), H=s.reduce((a,b)=>a+b,0)/4; return {s,H,PP:Math.pow(2,H)}; };
  function draw(){ const narrow=vbFor(svg,'0 0 600 300','0 0 340 470'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg), {s,H,PP}=stats();
    const bx=narrow?40:44, bw=narrow?290:280, by=narrow?40:46, bh=narrow?170:196, top=Math.max(4,Math.ceil(Math.max(...s,H)+.3));
    const px=i=>bx+(i+.5)*bw/4, py=v=>by+bh-(v/top)*bh;
    for(let v=0;v<=top;v++){ el('line',{x1:bx,x2:bx+bw,y1:py(v),y2:py(v),stroke:'var(--grid)','stroke-width':1},svg); txt(svg,bx-6,py(v)+3.5,String(v),FT(500,9.5,k,'var(--ink-muted)'),'end'); }
    txt(svg,bx,by-14,'surprise, bits',FT(700,10,k,'var(--ink-muted)'));
    s.forEach((v,i)=>{ const x=px(i)-bw/4*.3, w=bw/4*.6, y=py(v), col=cv(K16.loss), g=el('g',{},svg);
      if(glow) el('rect',{x:x-3,y:y-3,width:w+6,height:by+bh-y+3,rx:6,fill:col,opacity:.16},g);
      el('rect',{class:'bar','data-s':v.toFixed(6),x,y,width:w,height:Math.max(1,by+bh-y),rx:5,fill:col,opacity:.85},g);
      txt(svg,px(i),y-6,N(v,2),FT(700,10,k,'var(--ink)'),'middle');
      txt(svg,px(i),by+bh+15*k,'p = '+N(p[i],3),FT(600,9.5,k,'var(--ink-2)'),'middle'); });
    glowLine(svg,bx,py(H),bx+bw,py(H),cv(K16.gold),2,!!glow,{'stroke-dasharray':'6 4'});
    txt(svg,bx+4,py(H)-6,'average '+N(H,3),FT(700,10,k,cv(K16.gold)),'start');
    /* the spinner: PP equal slices (the last one partial) */
    const cx=narrow?170:470, cy=narrow?345:140, r=narrow?78:96, n=Math.ceil(PP-1e-9);
    const g=el('g',glow?{filter:glow}:{},svg), ang=a=>[cx+r*Math.sin(a),cy-r*Math.cos(a)];
    const slice=(a0,a1,fill,op)=>{ const [x0,y0]=ang(a0),[x1,y1]=ang(a1), big=a1-a0>Math.PI?1:0; el('path',{class:'slice',d:`M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${big} 1 ${x1},${y1} Z`,fill,opacity:op,stroke:'var(--page)','stroke-width':n>40?.4:1.2},g); };
    const tot=2*Math.PI, unit=tot/PP;
    if(PP<1.0005){ el('circle',{cx,cy,r,fill:cv(K16.prob),opacity:.85},g); }
    else for(let i=0;i<n;i++){ const a0=i*unit, a1=Math.min(tot,(i+1)*unit); slice(a0,a1,i===0?cv(K16.gold):(i%2?cv(K16.prob):cv(K16.word)),i===0?.95:.8); }
    el('circle',{cx,cy,r:r*(narrow?.5:.36),fill:'var(--surface)',opacity:.92},svg);
    txt(svg,cx,cy+2,N(PP,3),FT(800,19,Math.min(k,1.3),'var(--ink)'),'middle');
    txt(svg,cx,cy+16*Math.min(k,1.3),'perplexity',FT(600,9,Math.min(k,1.35),'var(--ink-muted)'),'middle');
    txt(svg,cx,cy+r+22*Math.min(k,1.2),'a die with '+N(PP,2)+' equal faces',FT(600,10,Math.min(k,1.2),'var(--ink-2)'),'middle');
    read.innerHTML='surprises: '+s.map(v=>'<b>'+N(v,3)+'</b>').join(' · ')+' bits<br>average surprise <b>'+N(H,4)+'</b> bits<br>perplexity 2<sup>'+N(H,3)+'</sup> = <b>'+N(PP,3)+'</b>'+
      (PP>=5.999&&PP<=6.001?' — a fair six-sided die':PP<1.0005?' — perfect, no surprise':''); }
  const set=arr=>{ arr.forEach((v,i)=>{ p[i]=v; setCtl('pp-p'+(i+1),v,x=>N(x,3)); }); draw(); };
  [1,2,3,4].forEach(i=>bindCtl('pp-p'+i,v=>{ p[i-1]=v; draw(); },v=>N(v,3)));
  document.getElementById('pp-spec').addEventListener('click',()=>set([.5,.25,.5,.125]));
  document.getElementById('pp-ours').addEventListener('click',()=>set([1,.75,2/3,1]));
  document.getElementById('pp-six').addEventListener('click',()=>set([1/6,1/6,1/6,1/6]));
  document.getElementById('pp-perfect').addEventListener('click',()=>set([1,1,1,1]));
  document.getElementById('pp-miss').addEventListener('click',()=>set([.5,.25,.5,.01]));
  draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  U16['w-perplexity']={state(){ const o=stats(); return {p:p.slice(),surprise:o.s,H:o.H,PP:o.PP,slices:svg.querySelectorAll('path.slice').length,
      bars:[...svg.querySelectorAll('rect.bar')].map(r=>({s:+r.dataset.s,h:+r.getAttribute('height')})),texts:textBoxes(svg)}; }, set};
})();
