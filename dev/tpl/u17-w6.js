/* ================= UNIT 17 · Act IV–V widgets: w-bidir (reading both ways, floors), w-bleu (grading a translation) ================= */

/* ---------- §11 · w-bidir ---------- */
(function(){
  const svg=document.getElementById('bd-svg'); if(!svg) return;
  const read=document.getElementById('bd-read');
  const FWD=K17.mem, BWD='s5';
  /* one-number word codes: toy numbers for the picture (hand-made, not trained) */
  const SENT={toy:{w:['word 1','word 2','word 3'],x:[0,0,1]},
    bears:{w:['He','said','Teddy','bears','are','on','sale'],x:[.2,-.3,.5,.9,-.4,.1,.8]},
    pres:{w:['He','said','Teddy','Roosevelt','was','a','president'],x:[.2,-.3,.5,-.9,.3,-.1,-.8]}};
  const D0={mode:'two',sent:'toy',w:.5,sel:null,prog:1};
  const st=Object.assign({},D0);
  const fwdRun=(x,w)=>{ const h=[]; let p=0; x.forEach(v=>{ p=tanh(w*p+v); h.push(p); }); return h; };
  const bwdRun=(x,w)=>{ const h=new Array(x.length); let p=0; for(let t=x.length-1;t>=0;t--){ p=tanh(w*p+x[t]); h[t]=p; } return h; };
  const PAR=(h,d)=>h*(h+d)+h;
  const n2=v=>Math.abs(v)<0.005&&v!==0?N(v,3):N(v,2);          /* never print a small non-zero note as "−0" */
  let S={};
  function notesOf(key){ const s=SENT[key]; const f=fwdRun(s.x,st.w), b=bwdRun(s.x,st.w), f2=fwdRun(f,st.w); return {f,b,f2}; }
  function draw(){ svg.innerHTML=''; const s=SENT[st.sent], n=s.w.length, R=notesOf(st.sent), rowH=n<=3?76:58, V=narrowSVG(svg,760,360,440,96+n*rowH), ph=V.n, Wd=V.W, glow=glo(svg);
    const two=st.mode==='two', stack=st.mode==='stack';
    if(ph){ drawPhone(s,n,R,rowH,glow,two,stack); return finish(s,n,R,two,stack); }
    const x0=ph?40:(n<5?170:70), x1=Wd-(ph?40:(n<5?170:70)), xs=i=>n===1?(x0+x1)/2:x0+i*(x1-x0)/(n-1);
    const cw=Math.min(ph?50:66,(x1-x0)/Math.max(1,n-1)-10), chh=30;
    /* rows (y of the centre line) */
    const Y=ph?(stack?{f2:62,f1:170,w:278,note:360}:{f:62,w:160,b:258,note:350}):(stack?{f2:56,f1:150,w:244,note:314}:{f:56,w:140,b:224,note:304});
    const prog=st.prog*(two?2:1)*n;       /* how many cell-steps are revealed */
    const fOn=i=>prog>=i+.5, bOn=i=>two&&prog>=n+(n-1-i)+.5;
    const infl=st.sel==null?null:(two?s.w.map((_,i)=>i):s.w.map((_,i)=>i).filter(i=>i<=st.sel));
    /* section labels */
    const lab=(y,t,c)=>txt(svg,ph?8:14,y,t,'font:700 11px system-ui;fill:'+c);
    const cell=(x,y,v,col,on,sel)=>{ const g=el('g',{opacity:on?1:.28},svg); if(on&&sel&&glow) g.setAttribute('filter',glow);
      el('rect',{x:x-cw/2,y:y-chh/2,width:cw,height:chh,rx:8,fill:'color-mix(in srgb,'+cv(col)+' 14%,transparent)',stroke:cv(col),'stroke-width':sel?2.4:1.3},g);
      const t=txt(g,x,y+4,on?(ph?n2(v):N(v,4)):'·','font:700 '+(ph?10.5:11)+'px system-ui;fill:var(--ink)','middle'); return g; };
    if(!stack){
      lab(Y.f-chh/2-8,'→ forward reader',cv(FWD));
      if(two) lab(Y.b+chh/2+16,'← backward reader',cv(BWD)); else txt(svg,ph?8:14,Y.b+4,'(no backward reader: one-way)','font:600 10.5px system-ui;fill:var(--ink-muted)');
    } else { lab(Y.f2-chh/2-8,'floor 2 · reads floor 1\'s notes',cv(K17.prob)); lab(Y.f1-chh/2-8,'floor 1 · reads the words',cv(FWD)); }
    const tiles=[];
    for(let i=0;i<n;i++){ const x=xs(i), inf=infl&&infl.includes(i), isSel=st.sel===i;
      /* word tile */
      const tw=Math.min(ph?52:84,(x1-x0)/Math.max(1,n-1)-6); const g=el('g',{style:'cursor:pointer','data-i':i},svg);
      el('rect',{x:x-tw/2,y:Y.w-14,width:tw,height:28,rx:8,fill:'color-mix(in srgb,var(--s1) '+(inf?34:16)+'%,transparent)',stroke:isSel?cv(K17.gate):inf?cv(K17.gate):cv(K17.word),'stroke-width':isSel?3:inf?2:1.2},g);
      const wl=txt(g,x,Y.w+4,s.w[i],'font:700 '+(ph&&s.w[i].length>6?9.5:11.5)+'px system-ui;fill:var(--ink)','middle');
      txt(g,x,Y.w+(ph?28:30),'x = '+N(s.x[i],2),'font:600 10px system-ui;fill:'+cv(K17.word),'middle');
      g.addEventListener('click',()=>{ st.sel=st.sel===i?null:i; draw(); }); tiles.push(g);
      if(!stack){ /* forward cell + arrow */
        cell(x,Y.f,R.f[i],FWD,fOn(i),isSel); edge(svg,x,Y.w-16,x,Y.f+chh/2+3,cv(K17.word),1.2,null,fOn(i)?.8:.25);
        if(i>0) edge(svg,xs(i-1)+cw/2+2,Y.f,x-cw/2-3,Y.f,cv(FWD),2,fOn(i)?glow:null,fOn(i)?1:.25);
        if(two){ cell(x,Y.b,R.b[i],BWD,bOn(i),isSel); edge(svg,x,Y.w+(ph?34:36),x,Y.b-chh/2-3,cv(K17.word),1.2,null,bOn(i)?.8:.25);
          if(i<n-1) edge(svg,xs(i+1)-cw/2-2,Y.b,x+cw/2+3,Y.b,cv(BWD),2,bOn(i)?glow:null,bOn(i)?1:.25); }
        /* the word's final note: forward half | backward half */
        const nw=two?Math.min(cw+10,(x1-x0)/Math.max(1,n-1)-6):cw*.6, ny=Y.note, fv=fOn(i)?R.f[i]:null, bv=two&&bOn(i)?R.b[i]:null;
        chip(x,ny,nw,fv,bv,two,i,n<=3);
      } else { /* two floors, one-way */
        cell(x,Y.f1,R.f[i],FWD,fOn(i),isSel); cell(x,Y.f2,R.f2[i],K17.prob,fOn(i),isSel);
        edge(svg,x,Y.w-16,x,Y.f1+chh/2+3,cv(K17.word),1.2,null,fOn(i)?.8:.25); edge(svg,x,Y.f1-chh/2-2,x,Y.f2+chh/2+3,cv(FWD),1.6,null,fOn(i)?.9:.25);
        if(i>0){ edge(svg,xs(i-1)+cw/2+2,Y.f1,x-cw/2-3,Y.f1,cv(FWD),2,fOn(i)?glow:null,fOn(i)?1:.25); edge(svg,xs(i-1)+cw/2+2,Y.f2,x-cw/2-3,Y.f2,cv(K17.prob),2,fOn(i)?glow:null,fOn(i)?1:.25); } } }
    if(!stack) txt(svg,ph?8:14,Y.note-18,two?'each word\'s note: [ forward | backward ]':'each word\'s note: forward only','font:700 11px system-ui;fill:var(--ink-2)');
    finish(s,n,R,two,stack); }
  /* one half-and-half chip: the word's final note (fill strength = size of the number) */
  function chip(x,ny,nw,fv,bv,two,i,withVals){ const op=v=>v==null?.06:(.12+.8*Math.min(1,Math.abs(v))).toFixed(3);
    const hf=el('rect',{x:x-nw/2,y:ny-11,width:two?nw/2:nw,height:22,rx:5,fill:cv(FWD),'fill-opacity':op(fv),stroke:cv(FWD),'stroke-width':1},svg); hf.dataset.role='nf'; hf.dataset.i=i; hf.dataset.v=fv==null?'':fv;
    if(two){ const hb=el('rect',{x:x,y:ny-11,width:nw/2,height:22,rx:5,fill:cv(BWD),'fill-opacity':op(bv),stroke:cv(BWD),'stroke-width':1},svg); hb.dataset.role='nb'; hb.dataset.i=i; hb.dataset.v=bv==null?'':bv; }
    if(withVals){ if(fv!=null) txt(svg,two?x-nw/4:x,ny+30,N(fv,4),'font:700 10.5px system-ui;fill:'+cv(FWD),'middle'); if(two&&bv!=null) txt(svg,x+nw/4,ny+30,N(bv,4),'font:700 10.5px system-ui;fill:'+cv(BWD),'middle'); } }
  /* phones: one row per word — forward reader on the left, backward reader on the right, the note chip at the end */
  function drawPhone(s,n,R,rowH,glow,two,stack){ const prog=st.prog*(two?2:1)*n, fOn=i=>prog>=i+.5, bOn=i=>two&&prog>=n+(n-1-i)+.5;
    const infl=st.sel==null?null:(two?s.w.map((_,i)=>i):s.w.map((_,i)=>i).filter(i=>i<=st.sel)), y=i=>70+i*rowH, cw=72, chh=30;
    const X=stack?{w:78,f1:208,f2:340}:{f:52,w:176,b:300,note:398};
    const cell=(x,yy,v,col,on,sel)=>{ const g=el('g',{opacity:on?1:.28},svg); if(on&&sel&&glow) g.setAttribute('filter',glow);
      el('rect',{x:x-cw/2,y:yy-chh/2,width:cw,height:chh,rx:8,fill:'color-mix(in srgb,'+cv(col)+' 14%,transparent)',stroke:cv(col),'stroke-width':sel?2.4:1.3},g);
      txt(g,x,yy+4,on?n2(v):'·','font:700 11px system-ui;fill:var(--ink)','middle'); };
    if(stack){ txt(svg,X.w,26,'words','font:700 11px system-ui;fill:'+cv(K17.word),'middle'); txt(svg,X.f1,26,'floor 1 ↓','font:700 11px system-ui;fill:'+cv(FWD),'middle'); txt(svg,X.f2,26,'floor 2 ↓','font:700 11px system-ui;fill:'+cv(K17.prob),'middle'); }
    else { txt(svg,X.f,26,'forward ↓','font:700 11px system-ui;fill:'+cv(FWD),'middle'); txt(svg,X.w,26,'words','font:700 11px system-ui;fill:'+cv(K17.word),'middle');
      txt(svg,X.b,26,two?'backward ↑':'(one-way)','font:700 11px system-ui;fill:'+(two?cv(BWD):'var(--ink-muted)'),'middle'); txt(svg,X.note,26,'note','font:700 11px system-ui;fill:var(--ink-2)','middle'); }
    for(let i=0;i<n;i++){ const yy=y(i), inf=infl&&infl.includes(i), isSel=st.sel===i, tw=100;
      const g=el('g',{style:'cursor:pointer','data-i':i},svg);
      el('rect',{x:X.w-tw/2,y:yy-22,width:tw,height:44,rx:8,fill:'color-mix(in srgb,var(--s1) '+(inf?34:16)+'%,transparent)',stroke:isSel||inf?cv(K17.gate):cv(K17.word),'stroke-width':isSel?3:inf?2:1.2},g);
      txt(g,X.w,yy-6,s.w[i],'font:700 11.5px system-ui;fill:var(--ink)','middle'); txt(g,X.w,yy+15,'x = '+N(s.x[i],2),'font:600 9px system-ui;fill:'+cv(K17.word),'middle');
      g.addEventListener('click',()=>{ st.sel=st.sel===i?null:i; draw(); });
      if(stack){ cell(X.f1,yy,R.f[i],FWD,fOn(i),isSel); cell(X.f2,yy,R.f2[i],K17.prob,fOn(i),isSel);
        edge(svg,X.w+tw/2+2,yy,X.f1-cw/2-3,yy,cv(K17.word),1.2,null,fOn(i)?.8:.25); edge(svg,X.f1+cw/2+2,yy,X.f2-cw/2-3,yy,cv(FWD),1.4,null,fOn(i)?.9:.25);
        if(i>0){ edge(svg,X.f1,y(i-1)+chh/2+2,X.f1,yy-chh/2-3,cv(FWD),2,fOn(i)?glow:null,fOn(i)?1:.25); edge(svg,X.f2,y(i-1)+chh/2+2,X.f2,yy-chh/2-3,cv(K17.prob),2,fOn(i)?glow:null,fOn(i)?1:.25); } }
      else { cell(X.f,yy,R.f[i],FWD,fOn(i),isSel); edge(svg,X.w-tw/2-2,yy,X.f+cw/2+3,yy,cv(K17.word),1.2,null,fOn(i)?.8:.25);
        if(i>0) edge(svg,X.f,y(i-1)+chh/2+2,X.f,yy-chh/2-3,cv(FWD),2,fOn(i)?glow:null,fOn(i)?1:.25);
        if(two){ cell(X.b,yy,R.b[i],BWD,bOn(i),isSel); edge(svg,X.w+tw/2+2,yy,X.b-cw/2-3,yy,cv(K17.word),1.2,null,bOn(i)?.8:.25);
          if(i<n-1) edge(svg,X.b,y(i+1)-chh/2-2,X.b,yy+chh/2+3,cv(BWD),2,bOn(i)?glow:null,bOn(i)?1:.25); }
        chip(X.note,yy,two?56:30,fOn(i)?R.f[i]:null,two&&bOn(i)?R.b[i]:null,two,i,false); } } }
  function finish(s,n,R,two,stack){ const infl=st.sel==null?null:(two?s.w.map((_,i)=>i):s.w.map((_,i)=>i).filter(i=>i<=st.sel));
    /* the Teddy comparison */
    const teddy={}; if(st.sent!=='toy'){ ['bears','pres'].forEach(k=>{ const r=notesOf(k); teddy[k]=two?[r.f[2],r.b[2]]:stack?[r.f2[2]]:[r.f[2]]; }); }
    const noteTxt=i=>two?'('+N(R.f[i],4)+', '+N(R.b[i],4)+')':stack?'('+N(R.f2[i],4)+')':'('+N(R.f[i],4)+')';
    const counts={one:PAR(128,64),two:2*PAR(128,64),stack:PAR(128,64)+PAR(128,128)};
    let html='';
    if(st.sent==='toy') html='x = (0, 0, 1) · w = '+N(st.w,2)+', u = 1<br>forward notes <b class="m">('+R.f.map(v=>N(v,4)).join(', ')+')</b>'+(two?'<br>backward notes <b style="color:var(--s5)">('+R.b.map(v=>N(v,4)).join(', ')+')</b>':'')+(stack?'<br>floor 2 notes <b class="p">('+R.f2.map(v=>N(v,4)).join(', ')+')</b>':'')+'<br>word 1\'s note: <b>'+noteTxt(0)+'</b>';
    else { const same=Math.abs(teddy.bears[teddy.bears.length-1]-teddy.pres[teddy.pres.length-1])<1e-12&&teddy.bears.every((v,j)=>Math.abs(v-teddy.pres[j])<1e-12);
      html='The note at "Teddy" · with bears: <b>('+teddy.bears.map(v=>N(v,4)).join(', ')+')</b> · with Roosevelt: <b>('+teddy.pres.map(v=>N(v,4)).join(', ')+')</b><br>'+(same?'<b class="r">The same</b> — a one-way reader at "Teddy" has read only "He said Teddy" in both, so nothing can tell them apart.':'<b class="m">Different</b> — the backward half has read the words after "Teddy", so a tagger can now tell the toy from the president.')+'<br><span style="color:var(--ink-muted)">(word codes are hand-made toy numbers)</span>'; }
    if(st.sel!=null) html+='<br>Click-through: word '+(st.sel+1)+' ("'+s.w[st.sel]+'") can be changed by '+(two?'<b>every</b> word — the backward half reads the words after it':'words 1 to '+(st.sel+1)+' only — the words after it are not read yet')+'.';
    html+='<br>numbers to learn (h = 128, d = 64): <b class="g">'+String(counts[st.mode]).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+'</b> ('+(st.mode==='one'?'one cell':st.mode==='two'?'two cells of 24 704':'24 704 + 32 896')+')';
    read.innerHTML=html;
    S={mode:st.mode,sent:st.sent,w:st.w,words:s.w.slice(),x:s.x.slice(),fwd:R.f.slice(),bwd:two?R.b.slice():null,floor2:stack?R.f2.slice():null,sel:st.sel,influence:infl,teddy,count:counts[st.mode],prog:st.prog};
    mfont(svg); declutter(svg); }
  const syncBtns=()=>{ document.getElementById('bd-mode').querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===st.mode?'true':'false'));
    document.getElementById('bd-sent').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===st.sent?'true':'false')); };
  tabs(document.getElementById('bd-mode'),t=>{ st.mode=t; st.prog=1; draw(); });
  document.getElementById('bd-sent').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ st.sent=b.dataset.s; st.sel=null; st.prog=1; syncBtns(); draw(); }));
  bindCtl('bd-w',v=>{ st.w=v; draw(); },v=>N(v,2));
  let tw=null; document.getElementById('bd-play').addEventListener('click',()=>{ if(tw) tw.stop(); st.prog=0; draw(); tw=tween(st.mode==='two'?3200:2000,u=>{ st.prog=u; draw(); },()=>{ st.prog=1; draw(); }); });
  document.getElementById('bd-reset').addEventListener('click',()=>{ if(tw) tw.stop(); Object.assign(st,D0); setCtl('bd-w',st.w,v=>N(v,2)); syncBtns(); draw(); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  reg('w-bidir',{state:()=>JSON.parse(JSON.stringify(S)),st,draw,fwdRun,bwdRun,SENT});
})();

/* ---------- §13 · w-bleu ---------- */
(function(){
  const svg=document.getElementById('bl-svg'); if(!svg) return;
  const read=document.getElementById('bl-read'), inp=document.getElementById('bl-cand');
  const REF='the train is running late', D0='the train is late';
  document.getElementById('bl-ref').textContent=REF;
  const toks=s=>String(s).toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).filter(Boolean);
  const grams=(w,n)=>{ const g=[]; for(let i=0;i+n<=w.length;i++) g.push(w.slice(i,i+n).join(' ')); return g; };
  /* clipped matches: each reference n-gram can be used as many times as it occurs in the reference */
  function clipMatch(cg,rg){ const left={}; rg.forEach(g=>left[g]=(left[g]||0)+1); return cg.map(g=>{ if(left[g]>0){ left[g]--; return true; } return false; }); }
  function bleu(cand){ const c=toks(cand), r=toks(REF), c1=grams(c,1), c2=grams(c,2), m1=clipMatch(c1,grams(r,1)), m2=clipMatch(c2,grams(r,2));
    const k1=m1.filter(Boolean).length, k2=m2.filter(Boolean).length, p1=c1.length?k1/c1.length:0, p2=c2.length?k2/c2.length:0;
    const BP=c.length===0?0:(c.length>=r.length?1:Math.exp(1-r.length/c.length)), score=(p1>0&&p2>0)?BP*Math.sqrt(p1*p2):0;
    return {c,r,c1,c2,m1,m2,k1,k2,p1,p2,BP,score}; }
  let S={};
  function draw(){ svg.innerHTML=''; const B=bleu(inp.value), V=narrowSVG(svg,760,300,440,560), ph=V.n, Wd=V.W, glow=glo(svg);
    const gold=cv(K17.gate);
    /* word tiles, flowing onto new lines */
    const areaW=ph?Wd-24:470, x0=ph?12:16;
    function flow(items,match,y0,label,fs){ txt(svg,x0,y0-10,label,'font:700 11px system-ui;fill:var(--ink-2)'); let x=x0, y=y0; const out=[];
      items.forEach((t,i)=>{ const w=t.length*fs*.6+18; if(x+w>x0+areaW&&x>x0){ x=x0; y+=34; }
        const g=el('g',{},svg); el('rect',{x,y,width:w,height:26,rx:7,fill:match[i]?'color-mix(in srgb,'+gold+' 26%,transparent)':'none',stroke:match[i]?gold:'var(--ink-muted)','stroke-width':match[i]?1.8:1,'stroke-dasharray':match[i]?'':'3 3'},g);
        txt(g,x+w/2,y+17,t,'font:700 '+fs+'px system-ui;fill:'+(match[i]?'var(--ink)':'var(--ink-muted)'),'middle'); out.push({t,match:match[i]}); x+=w+6; });
      if(!items.length) txt(svg,x0,y0+17,'(none)','font:600 11px system-ui;fill:var(--ink-muted)'); return y+26; }
    let y=flow(B.c1,B.m1,30,ph?'candidate words (gold: in the reference)':'the candidate\'s words — gold ones appear in the reference',12);
    y=flow(B.c2,B.m2,y+36,ph?'candidate pairs (gold: in the reference)':'its word pairs — gold ones appear in the reference',11.5);
    const used=clipMatch(B.r,B.c1);          /* which reference words were matched (each at most once per copy) */
    y=flow(B.r,used,y+36,ph?'reference words (gold: matched)':'the reference\'s words — gold ones were matched',11.5);
    /* the bars */
    const bx=ph?74:560, bw=ph?Wd-bx-78:136, by=ph?y+40:34, rows=[['p₁',B.p1,B.k1+'/'+B.c1.length,cv(K17.word)],['p₂',B.p2,B.k2+'/'+B.c2.length,cv(K17.word)],['BP',B.BP,N(B.BP,4),cv(K17.prob)],['BLEU-2',B.score,N(B.score,4),gold]];
    const bars=[];
    rows.forEach(([name,v,label,col],j)=>{ const yy=by+j*(j===3?46:40)+(j===3?10:0), h=j===3?26:20;
      txt(svg,bx-8,yy+h*.72,name,'font:700 '+(j===3?12.5:11.5)+'px system-ui;fill:'+(j===3?gold:'var(--ink-2)'),'end');
      el('rect',{x:bx,y:yy,width:bw,height:h,rx:5,fill:'none',stroke:'var(--line)'},svg);
      const g=el('g',j===3&&glow?{filter:glow}:{},svg); const r=el('rect',{x:bx,y:yy,width:Math.max(0,v)*bw,height:h,rx:5,fill:col,opacity:j===3?1:.8},g); r.dataset.role='bar'; r.dataset.name=name; r.dataset.v=v;
      txt(svg,bx+bw+6,yy+h*.72,label,'font:700 '+(j===3?12.5:11)+'px system-ui;fill:'+(j===3?gold:'var(--ink)')); bars.push({name,v,w:Math.max(0,v)*bw}); });
    if(!ph){ txt(svg,bx,by+4*40+34,'BLEU-2 = BP · √(p₁ · p₂)','font:600 11px system-ui;fill:var(--ink-muted)'); svg.setAttribute('viewBox','0 0 '+Wd+' '+Math.ceil(Math.max(by+4*40+34+14,y+14))); }   /* as tall as its content */
    else svg.setAttribute('viewBox','0 0 '+Wd+' '+Math.ceil(by+3*40+10+26+18));
    const c=B.c.length, r=B.r.length;
    read.innerHTML=c?('Words: <b>'+B.k1+'</b> of '+B.c1.length+' match (p₁ = '+N(B.p1,4)+') · pairs: <b>'+B.k2+'</b> of '+B.c2.length+' match (p₂ = '+(B.c2.length?N(B.p2,4):'— no pairs')+')'+
      '<br>length c = '+c+', reference r = '+r+' → brevity penalty '+(c>=r?'1 (not too short)':'e<sup>1 − '+r+'/'+c+'</sup> = <b>'+N(B.BP,4)+'</b>')+
      '<br>BLEU-2 = '+N(B.BP,4)+' · √('+N(B.p1,4)+' · '+N(B.p2,4)+') = <b class="g">'+N(B.score,4)+'</b>'+(B.p2===0&&B.c2.length?' — no pair matches, so the geometric mean is 0':'')+
      (B.c1.length&&B.k1<B.c1.filter(w=>B.r.includes(w)).length?'<br>Some words are in the reference but were <b>clipped</b>: each reference word can be matched only as often as it appears there.':'')):'Type a candidate translation.';
    S={cand:inp.value,words:B.c,ref:B.r,uni:B.c1.map((g,i)=>({g,m:B.m1[i]})),bi:B.c2.map((g,i)=>({g,m:B.m2[i]})),p1:[B.k1,B.c1.length],p2:[B.k2,B.c2.length],BP:B.BP,bleu:B.score,bars,scale:bw};
    mfont(svg); declutter(svg); }
  inp.addEventListener('input',draw);
  document.getElementById('bl-pre').querySelectorAll('button[data-c]').forEach(b=>b.addEventListener('click',()=>{ inp.value=b.dataset.c; draw(); }));
  document.getElementById('bl-reset').addEventListener('click',()=>{ inp.value=D0; draw(); });
  draw(); new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(draw);
  reg('w-bleu',{state:()=>JSON.parse(JSON.stringify(S)),draw,bleu});
})();
