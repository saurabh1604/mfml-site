/* ================= UNIT 16 · widgets of §1–§3: w-onehot, w-bigram, w-perplexity ================= */
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

/* ---------- §1 · w-onehot: three words on three axes, then free to lean together (3-D) ---------- */
(function(){
  const box=document.getElementById('oh-3d'); if(!box||!CIN) return;
  const W=['chai','coffee','cricket'];
  const ONE=[[1,0,0],[0,1,0],[0,0,1]], MEAN=[[.84,.52,.16],[.55,.82,.17],[.13,.1,.99]].map(v=>vscale(v,1/norm(v)));
  const st={m:0}; const read=document.getElementById('oh-read');
  const vecs=()=>ONE.map((o,i)=>{ const v=o.map((x,j)=>x+(MEAN[i][j]-x)*st.m); return vscale(v,1/norm(v)); });
  function readout(){ const V=vecs(), d=(a,b)=>norm(vsub(a,b));
    const row=(i,j)=>`${W[i]} · ${W[j]}: cos <b>${N(cosSim(V[i],V[j]),3)}</b> · dist <b>${N(d(V[i],V[j]),3)}</b>`;
    read.innerHTML=row(0,1)+'<br>'+row(0,2)+'<br>'+row(1,2)+(st.m<.01?'<br><span style="color:var(--ink-muted)">every pair: at right angles, the same distance</span>':st.m>.99?'<br><span style="color:var(--ink-muted)">now "close" can mean "similar"</span>':'');
    box.dataset.m=st.m.toFixed(3); box.dataset.cos01=cosSim(V[0],V[1]).toFixed(4); box.dataset.d02=norm(vsub(V[0],V[2])).toFixed(4); }
  let S3=null; const L=2.1;
  const P=v=>[v[0]*L,v[2]*L,v[1]*L];   /* math (chai, coffee, cricket) → three.js: chai along x, coffee along z (toward the viewer), cricket up */
  function build(){ return CIN.stage3d(box,{camera:{pos:camFit(box,[6.3,4.1,4.9],[.7,.62,.7],1.25),look:[.7,.62,.7],fov:34},orbit:true,autoRotate:.1,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
      starfield(ctx,260,14); const g=CIN.prim.grid(ctx,8,16,hx('grid'),{opacity:isLight?.45:.25}); g.position.set(0,-.001,0); root.add(g);
      /* the three axes, faint, and the unit cube's edges as a ghost */
      [[1,0,0],[0,1,0],[0,0,1]].forEach(a=>root.add(tube(ctx,[0,0,0],P(a).map(x=>x*1.18),hx('axis'),.006,.5)));
      const cube=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L,L,L)),new THREE.LineBasicMaterial({color:hx('grid'),transparent:true,opacity:isLight?.5:.35})); cube.position.set(L/2,L/2,L/2); root.add(cube);
      const cols=[hx(K16.tea),hx(K16.tea),hx(K16.cricket)];
      const arrows=W.map((w,i)=>{ const a=CIN.prim.arrow(ctx,[0,0,0],P(ONE[i]),cols[i],{radius:.04,head:.26}); root.add(a); return a; });
      const tips=W.map((w,i)=>{ const h=haloSprite(ctx,cols[i],.7); root.add(h); return h; });
      const labs=W.map(()=>slot(ctx,root)), links=[[0,1],[0,2],[1,2]].map(([i,j])=>{ const t=liveTube(ctx,hx(i+j===1?K16.gold:'ink2'),.011,isLight?.7:.6); t.material.depthWrite=false; root.add(t); return {i,j,t,lab:slot(ctx,root)}; });
      ctx.redraw=()=>{ const V=vecs().map(P);
        arrows.forEach((a,i)=>a.userData.set(new THREE.Vector3(0,0,0),new THREE.Vector3(...V[i]))); tips.forEach((h,i)=>h.position.set(...V[i]));
        labs.forEach((l,i)=>l.set(W[i],[V[i][0]*1.14,V[i][1]*1.14+.18,V[i][2]*1.14],{size:26,scale:.0105*LSc(box),color:colors.ink,bg:!isLight?false:true,weight:700}));
        links.forEach(o=>{ aimTube(THREE,o.t,V[o.i],V[o.j]); const d=norm(vsub(vecs()[o.i],vecs()[o.j])); const mid=V[o.i].map((x,k)=>(x+V[o.j][k])/2);
          o.lab.set(N(d,3),[mid[0],mid[1]+.12,mid[2]],{size:21,scale:.0095*LSc(box),color:o.i+o.j===1?colors.s4:colors.muted,bg:true}); });
        RR(ctx); };
      ctx.redraw(); if(matchMedia('(hover:hover) and (pointer:fine)').matches) hint(box,'drag to orbit');
    }}); }
  S3=mountStage(box,build);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  const bar=document.getElementById('oh-mode'); let tw=null;
  function go(to,dur){ if(tw) tw.stop(); const from=st.m; tw=tween(dur,u=>{ st.m=from+(to-from)*u; redraw(); },()=>{ st.m=to; redraw(); }); }
  tabs(bar,t=>go(t==='meaning'?1:0,1400));
  document.getElementById('oh-play').addEventListener('click',()=>{ bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t==='meaning'?'true':'false')); st.m=0; redraw(); setTimeout(()=>go(1,2600),250); });
  readout(); window.U16Onehot={st,redraw};
})();

/* ---------- §2 · w-bigram: count neighbours, guess, smooth, write ---------- */
(function(){
  const ta=document.getElementById('bg-text'); if(!ta) return;
  const tbl=document.getElementById('bg-table'), prevHost=document.getElementById('bg-prev'), svg=document.getElementById('bg-bars'), read=document.getElementById('bg-read'), out=document.getElementById('bg-out');
  const st={smooth:false,prev:'drink',model:null};
  ta.value=BIGRAM_DEFAULT;
  function parse(){ const lines=ta.value.split('\n').map(l=>l.trim().split(/\s+/).filter(Boolean)).filter(l=>l.length);
    const vocab=[], idx={}; lines.forEach(l=>l.forEach(w=>{ if(!(w in idx)){ idx[w]=vocab.length; vocab.push(w); } }));
    const C={}, starts={}; lines.forEach(l=>{ starts[l[0]]=(starts[l[0]]||0)+1; for(let i=0;i+1<l.length;i++){ (C[l[i]]=C[l[i]]||{}); C[l[i]][l[i+1]]=(C[l[i]][l[i+1]]||0)+1; } });
    const rows=vocab.filter(w=>C[w]);
    return {vocab,C,rows,starts,nLines:lines.length}; }
  const tot=(M,w)=>Object.values(M.C[w]||{}).reduce((a,b)=>a+b,0);
  function prob(M,w,n,smooth){ const c=(M.C[w]||{})[n]||0, t=tot(M,w), V=M.vocab.length; return smooth?{num:c+1,den:t+V,p:(c+1)/(t+V)}:{num:c,den:t,p:t?c/t:0}; }
  function drawTable(M){ const V=M.vocab, mx=Math.max(1,...M.rows.map(r=>Math.max(...Object.values(M.C[r]))));
    let h='<table class="bgt"><thead><tr><th></th>'+V.map(w=>`<th>${esc(w)}</th>`).join('')+'<th>total</th></tr></thead><tbody>';
    M.rows.forEach(r=>{ h+=`<tr class="${r===st.prev?'on':''}"><th class="rh${r===st.prev?' on':''}" data-w="${esc(r)}">${esc(r)} →</th>`+V.map(n=>{ const c=(M.C[r]||{})[n]||0, show=st.smooth?c+1:c;
      return `<td class="${c?'':'z'}" style="--h:${(c/mx).toFixed(3)}">${show}</td>`; }).join('')+`<td class="tot">${tot(M,r)+(st.smooth?V.length:0)}</td></tr>`; });
    tbl.innerHTML=h+'</tbody></table>'; tbl.querySelectorAll('th.rh').forEach(th=>th.addEventListener('click',()=>pick(th.dataset.w))); }
  function drawBars(M){ const narrow=vbFor(svg,'0 0 560 220','0 0 340 260'); svg.innerHTML=''; const k=svgK(svg,10.5), glow=glo(svg), V=M.vocab;
    const W=narrow?340:560, H=narrow?260:220, L=narrow?12:34, R=12, T=narrow?44:28, B=narrow?64:48, bw=(W-L-R)/V.length;
    const ps=V.map(n=>prob(M,st.prev,n,st.smooth)), top=Math.max(.34,...ps.map(o=>o.p));
    const py=p=>H-B-(p/top)*(H-T-B);
    [0,.25,.5,.75,1].filter(v=>v<=top+1e-9).forEach(v=>{ el('line',{x1:L,x2:W-R,y1:py(v),y2:py(v),stroke:'var(--grid)','stroke-width':1},svg); if(!narrow) txt(svg,L-5,py(v)+3.5,N(v,2),FT(500,9.5,k,'var(--ink-muted)'),'end'); });
    V.forEach((n,i)=>{ const o=ps[i], x=L+i*bw+bw*.16, w=bw*.68, y=py(o.p), g=el('g',{},svg);
      const col=o.p>0?cv(K16.prob):'var(--ink-muted)';
      if(glow&&o.p>0) el('rect',{x:x-2,y:y-2,width:w+4,height:Math.max(0,H-B-y)+2,rx:5,fill:col,opacity:.18},g);
      el('rect',{x,y,width:w,height:Math.max(0,H-B-y),rx:4,fill:col,opacity:o.p>0?.9:.3},g);
      if(o.p>0) txt(svg,x+w/2,y-5,o.den?(o.num+'/'+o.den):'',FT(700,9.5,k,'var(--ink)'),'middle');
      const lab=txt(svg,x+w/2,H-B+14*k,n,FT(600,10,k,'var(--ink-2)'),narrow?'end':'middle'); if(narrow) lab.setAttribute('transform',`rotate(-50 ${x+w/2} ${H-B+10})`); });
    txt(svg,L,16*k*.9,'next word after "'+st.prev+'"'+(st.smooth?' · add-one':''),FT(700,10.5,k,'var(--ink-muted)'));
    svg.dataset.prev=st.prev; svg.dataset.p=ps.map(o=>o.p.toFixed(4)).join(','); }
  function readout(M){ if(!M.C[st.prev]){ read.innerHTML='"'+esc(st.prev)+'" is never followed by anything (it ends every sentence), so it has no row.'; return; }
    const V=M.vocab, t=tot(M,st.prev), list=V.map(n=>({n,...prob(M,st.prev,n,st.smooth)})).filter(o=>o.p>0).sort((a,b)=>b.p-a.p);
    const shown=list.slice(0,4).map(o=>`P(${esc(o.n)} | ${esc(st.prev)}) = ${o.num}/${o.den} = <b>${N(o.p,3)}</b>`).join('<br>');
    read.innerHTML=shown+(list.length>4?'<br><span style="color:var(--ink-muted)">… and '+(list.length-4)+' more small bars</span>':'')+
      '<br><span style="color:var(--ink-muted)">row "'+esc(st.prev)+'": '+t+' pairs'+(st.smooth?' + '+V.length+' pretend ones':'')+' · vocabulary '+V.length+' words</span>'; }
  function all(){ const M=st.model=parse(); if(!M.C[st.prev]) st.prev=M.rows.includes('drink')?'drink':(M.rows[0]||'');
    chipRow(prevHost,M.rows,'',pick); pressChip(prevHost,st.prev); drawTable(M); drawBars(M); readout(M); score(); }
  const scIn=document.getElementById('bg-score'), chain=document.getElementById('bg-chain');
  function score(){ const M=st.model; if(!M) return; const w=scIn.value.trim().split(/\s+/).filter(Boolean); if(w.length<2){ chain.innerHTML=''; return; }
    const S=Object.values(M.starts).reduce((a,b)=>a+b,0), fs=[]; let P=1;
    const f0={num:M.starts[w[0]]||0,den:S}; fs.push({t:'start → '+w[0],...f0,p:f0.num/f0.den});
    for(let i=0;i+1<w.length;i++){ const o=prob(M,w[i],w[i+1],st.smooth); fs.push({t:w[i]+' → '+w[i+1],...o}); }
    fs.forEach(o=>{ P*=o.p; });
    chain.innerHTML=fs.map(o=>`<span class="bc${o.p>0?'':' zero'}"><i>${esc(o.t)}</i><b>${o.den?o.num+'/'+o.den:'0'}</b></span>`).join('<span class="bx">×</span>')+
      `<span class="bx">=</span><span class="bc tot${P>0?'':' zero'}"><i>whole sentence</i><b>${P>0?N(P,4):'0'}</b></span>`;
    chain.dataset.p=P.toFixed(6); }
  scIn.addEventListener('input',score);
  function pick(w){ st.prev=w; pressChip(prevHost,w); drawTable(st.model); drawBars(st.model); readout(st.model); }
  function sample(dist){ let r=Math.random()*dist.reduce((a,o)=>a+o.p,0); for(const o of dist){ r-=o.p; if(r<=0) return o.n; } return dist[dist.length-1].n; }
  function generate(){ const M=st.model; if(!M||!M.vocab.length) return; const S=Object.entries(M.starts).map(([n,c])=>({n,p:c}));
    let w=sample(S); const words=[w]; while(words.length<14&&w!=='.'){ if(!M.C[w]&&!st.smooth) break; const d=M.vocab.map(n=>({n,p:prob(M,w,n,st.smooth).p})); w=sample(d); words.push(w); }
    out.innerHTML=words.map((x,i)=>`<span class="gw" style="animation-delay:${i*110}ms">${esc(x)}</span>`).join(' '); out.dataset.words=words.join(' '); }
  let deb=null; ta.addEventListener('input',()=>{ clearTimeout(deb); deb=setTimeout(all,180); });
  document.getElementById('bg-smooth').addEventListener('click',e=>{ st.smooth=!st.smooth; e.currentTarget.setAttribute('aria-pressed',st.smooth); all(); });
  document.getElementById('bg-reset').addEventListener('click',()=>{ ta.value=BIGRAM_DEFAULT; st.prev='drink'; all(); });
  document.getElementById('bg-gen').addEventListener('click',generate);
  all(); onTheme(()=>drawBars(st.model)); onResizeW(svg.parentNode,()=>drawBars(st.model));
  window.U16Bigram={st,pick,all,prob:(w,n)=>prob(st.model,w,n,st.smooth).p};
})();

/* ---------- §3 · w-perplexity: surprise bars and a spinner with "perplexity" equal slices ---------- */
(function(){
  const svg=document.getElementById('pp-svg'); if(!svg) return;
  const read=document.getElementById('pp-read'); const p=[.5,.25,.5,.125];
  const stats=()=>{ const s=p.map(x=>Math.log2(1/x)), H=s.reduce((a,b)=>a+b,0)/4; return {s,H,PP:Math.pow(2,H)}; };
  function draw(){ const narrow=vbFor(svg,'0 0 600 300','0 0 340 470'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg), {s,H,PP}=stats();
    /* bars */
    const bx=narrow?40:44, bw=narrow?290:280, by=narrow?40:46, bh=narrow?170:196, top=Math.max(4,Math.ceil(Math.max(...s,H)+.3));
    const px=i=>bx+(i+.5)*bw/4, py=v=>by+bh-(v/top)*bh;
    for(let v=0;v<=top;v++){ el('line',{x1:bx,x2:bx+bw,y1:py(v),y2:py(v),stroke:'var(--grid)','stroke-width':1},svg); txt(svg,bx-6,py(v)+3.5,String(v),FT(500,9.5,k,'var(--ink-muted)'),'end'); }
    txt(svg,bx,by-14,'surprise, bits',FT(700,10,k,'var(--ink-muted)'));
    s.forEach((v,i)=>{ const x=px(i)-bw/4*.3, w=bw/4*.6, y=py(v), hot=v>4, col=hot?'var(--critical)':cv(K16.loss), g=el('g',{},svg);
      if(glow) el('rect',{x:x-3,y:y-3,width:w+6,height:by+bh-y+3,rx:6,fill:col,opacity:.16},g);
      el('rect',{x,y,width:w,height:Math.max(1,by+bh-y),rx:5,fill:col,opacity:.85},g);
      txt(svg,px(i),y-6,N(v,2),FT(700,10,k,'var(--ink)'),'middle');
      txt(svg,px(i),by+bh+15*k,'p = '+N(p[i],3),FT(600,9.5,k,'var(--ink-2)'),'middle'); });
    glowLine(svg,bx,py(H),bx+bw,py(H),cv(K16.gold),2,!!glow,{'stroke-dasharray':'6 4'});
    txt(svg,bx+4,py(H)-6,'average '+N(H,3),FT(700,10,k,cv(K16.gold)),'start');
    /* the spinner: PP equal slices (the last one partial) */
    const cx=narrow?170:470, cy=narrow?345:140, r=narrow?78:96, n=Math.ceil(PP-1e-9), frac=PP-(n-1);
    const g=el('g',glow?{filter:glow}:{},svg), ang=a=>[cx+r*Math.sin(a),cy-r*Math.cos(a)];
    const slice=(a0,a1,fill,op)=>{ const [x0,y0]=ang(a0),[x1,y1]=ang(a1), big=a1-a0>Math.PI?1:0; el('path',{d:`M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${big} 1 ${x1},${y1} Z`,fill,opacity:op,stroke:'var(--page)','stroke-width':n>40?.4:1.2},g); };
    const tot=2*Math.PI, unit=tot/PP;
    if(PP<1.0005){ el('circle',{cx,cy,r,fill:cv(K16.prob),opacity:.85},g); }
    else for(let i=0;i<n;i++){ const a0=i*unit, a1=Math.min(tot,(i+1)*unit); slice(a0,a1,i===0?cv(K16.gold):(i%2?cv(K16.prob):cv(K16.word)),i===0?.95:.8); }
    el('circle',{cx,cy,r:r*(narrow?.5:.36),fill:'var(--surface)',opacity:.92},svg);
    txt(svg,cx,cy+2,N(PP,3),FT(800,19,Math.min(k,1.3),'var(--ink)'),'middle');
    txt(svg,cx,cy+16*Math.min(k,1.3),'perplexity',FT(600,9,Math.min(k,1.35),'var(--ink-muted)'),'middle');
    txt(svg,cx,cy+r+22*Math.min(k,1.2),'like a spinner with '+N(PP,2)+' equal slices',FT(600,10,Math.min(k,1.2),'var(--ink-2)'),'middle');
    svg.dataset.pp=PP.toFixed(6); svg.dataset.h=H.toFixed(6);
    read.innerHTML='surprises: '+s.map(v=>'<b>'+N(v,3)+'</b>').join(' · ')+' bits<br>average surprise <b>'+N(H,4)+'</b> bits<br>perplexity 2<sup>'+N(H,3)+'</sup> = <b>'+N(PP,3)+'</b>'+
      (PP>=5.999&&PP<=6.001?' — a fair die':PP<1.0005?' — perfect, no surprise':''); }
  const set=(arr)=>{ arr.forEach((v,i)=>{ p[i]=v; setCtl('pp-p'+(i+1),v,x=>N(x,3)); }); draw(); };
  [1,2,3,4].forEach(i=>bindCtl('pp-p'+i,v=>{ p[i-1]=v; draw(); },v=>N(v,3)));
  document.getElementById('pp-spec').addEventListener('click',()=>set([.5,.25,.5,.125]));
  document.getElementById('pp-six').addEventListener('click',()=>set([1/6,1/6,1/6,1/6]));
  document.getElementById('pp-perfect').addEventListener('click',()=>set([1,1,1,1]));
  document.getElementById('pp-miss').addEventListener('click',()=>set([.5,.25,.5,.01]));
  draw(); onTheme(draw); onResizeW(svg.parentNode,draw);
  window.U16PP={p,set,stats};
})();
