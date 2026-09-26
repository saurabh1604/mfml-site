/* ================= UNIT 18 · Act IV widgets: w-mask (§10), w-families (§11), w-cost (§12), w-tiny (§13) ================= */

/* ---------- §10 · w-mask: no peeking, and every guess at once ---------- */
(function(){
  const svg=document.getElementById('mk-svg'); if(!svg) return;
  const read=document.getElementById('mk-read'), playBtn=document.getElementById('mk-play');
  const SENT=['I','drink','hot','chai','daily'];
  const st={mode:'enc',rows:9,u:1};
  function calc(){ const r=attend(EX.Q,EX.K,EX.V,{causal:st.mode==='dec'}); return {rowsL:['word 1','word 2','word 3'],colsL:['1','2','3'],...r}; }
  function drawTables(narrow){ const r=calc(), nr=3, nc=3;
    svg.setAttribute('viewBox',narrow?'0 0 400 640':'0 0 760 260');
    const F=fz(svg,11.5), Fs=fz(svg,10), hatch=hatchPat(svg,'mk-h','var(--ink-muted)',.45);
    const cs=narrow?Math.min(64,280/nc):Math.min(58,200/nc), chh=narrow?40:Math.min(46,230/nr);
    const grid=(x0,y0,M,title,fmtr,kind,labels)=>{ txt(svg,x0,y0-30,title,`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
      r.colsL.forEach((c,j)=>txt(svg,x0+j*cs+cs/2,y0-8,c,`font:700 ${Fs}px system-ui;fill:var(--s1)`,'middle'));
      M.forEach((row,i)=>{ if(labels) txt(svg,x0-6,y0+i*chh+chh/2+F*.35,r.rowsL[i],`font:700 ${Fs}px system-ui;fill:var(--s2)`,'end');
        row.forEach((val,j)=>{ const shown=i<st.rows, masked=!isFinite(val)||(kind==='A'&&st.mode==='dec'&&j>i);
          const X=x0+j*cs, Y=y0+i*chh; el('rect',{x:X+1,y:Y+1,width:cs-2,height:chh-2,rx:5,fill:masked?hatch:(kind==='A'?cv(K18.w):'color-mix(in srgb,var(--surface-2) 70%,transparent)'),opacity:masked?1:(kind==='A'?(shown?(.12+.88*val).toFixed(3):.05):1),stroke:'var(--line)','data-role':kind==='A'?'share':'score','data-r':i,'data-c':j},svg);
          if(shown) txt(svg,X+cs/2,Y+chh/2+F*.36,masked&&kind==='S'?'−∞':fmtr(val),`font:700 ${F}px system-ui;fill:${kind==='A'&&val>.55?'#1a1206':'var(--ink)'}`,'middle'); }); }); };
    const f3=v=>N(v,3);
    const G1=narrow?[80,60]:[90,70], G2=narrow?[80,60+nr*chh+70]:[90+nc*cs+60,70];
    grid(G1[0],G1[1],r.S,'scores q·k/√d'+(st.mode==='dec'?' + mask':''),f3,'S',true);
    grid(G2[0],G2[1],r.A,'shares (softmax of each row)',f3,'A',!!narrow);
    const G3=narrow?[80,60+2*(nr*chh+70)]:[G2[0]+nc*cs+70,70]; txt(svg,G3[0],G3[1]-30,'answers (shares · V)',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    r.O.forEach((o,i)=>{ if(i>=st.rows) return; txt(svg,G3[0],G3[1]+i*chh+chh/2+F*.36,vecN(o,3),`font:700 ${F}px system-ui;fill:var(--s3)`); });
    read.innerHTML=(st.mode==='enc'?'Encoder · every word may look both ways.':'Decoder · above the diagonal the score is −∞, so the share is exactly 0.')+'<br>'+r.A.map((row,i)=>'row '+(i+1)+': <b>'+vecN(row,3)+'</b> → '+vecN(r.O[i],3)).join('<br>');
    svg.dataset.state=st.mode+'|'+r.A.map(row=>row.map(v=>v.toFixed(3)).join(' ')).join(';'); return r; }
  /* every guess at once: the same five-word sentence, graded at four places — by a relay (one step each) and by a masked transformer (one step for all) */
  function drawAll(narrow){ svg.setAttribute('viewBox',narrow?'0 0 400 620':'0 0 760 330');
    const F=fz(svg,11.5), Fs=fz(svg,10.5), glow=glo(svg), n=SENT.length, cs=narrow?40:34, u=st.u;
    const relayLit=Math.min(n-1,Math.floor(u*(n-1)+1e-9)), allLit=u>.02?n-1:0;
    const block=(x0,y0,title,lit,steps,col)=>{ txt(svg,x0-70,y0-44,title,`font:800 ${Fs}px system-ui;fill:${col};letter-spacing:.03em`);
      SENT.forEach((w,j)=>txt(svg,x0+j*cs+cs/2,y0-8,w,`font:700 ${Fs}px system-ui;fill:var(--s1)`,'middle'));
      SENT.forEach((w,i)=>{ const on=i<lit, last=i===n-1;
        txt(svg,x0-8,y0+i*cs+cs/2+Fs*.36,'pos '+(i+1),`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'end');
        SENT.forEach((_,j)=>{ const see=j<=i; el('rect',{x:x0+j*cs+1,y:y0+i*cs+1,width:cs-2,height:cs-2,rx:4,fill:see?cv(K18.w):'var(--grid)',opacity:see?(on?.95:.25):.35,'data-role':'see','data-r':i,'data-c':j},svg); });
        const gx=x0+n*cs+10, gy=y0+i*cs+cs/2+Fs*.36;
        if(last) txt(svg,gx,gy,'(nothing after)',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`);
        else { if(on) el('circle',{cx:gx+5,cy:y0+i*cs+cs/2,r:5,fill:'var(--critical)',filter:glow||'none','data-role':'graded'},svg);
          txt(svg,gx+15,gy,'→ '+SENT[i+1],`font:${on?800:600} ${F}px system-ui;fill:${on?'var(--ink)':'var(--ink-muted)'}`); } });
      txt(svg,x0-70,y0+n*cs+F*1.8,'steps in a row: '+steps,`font:800 ${F}px system-ui;fill:${col}`+HALO); };
    const RX=narrow?90:110, TX=narrow?90:466, RY=narrow?70:86, TY=narrow?370:86;
    block(RX,RY,'RELAY (Unit 17) · one guess per step',relayLit,Math.max(relayLit,u>.02?1:0)+' of '+(n-1),cv('s1'));
    block(TX,TY,'MASKED TRANSFORMER · all guesses at once',allLit,u>.02?1:0,cv('s3'));
    read.innerHTML='“'+SENT.join(' ')+'” · '+(n-1)+' next-word guesses, graded (red) at positions 1–'+(n-1)+'<br>relay: <b>'+(n-1)+'</b> steps, each waiting for the one before · masked transformer: <b>1</b> step per layer, all rows at once';
    svg.dataset.state='all|'+relayLit+'|'+allLit; }
  let last=null;
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); if(st.mode==='all'){ drawAll(narrow); last={mode:'all',u:st.u}; } else { last=drawTables(narrow); last.mode=st.mode; } }
  tabs(document.getElementById('mk-mode'),t=>{ if(tw) tw.stop(); st.mode=t; st.rows=9; st.u=1; playBtn.textContent=t==='all'?'▶ race them':'▶ fill row by row'; draw(); });
  let tw=null; playBtn.addEventListener('click',()=>{ if(tw) tw.stop();
    if(st.mode==='all'){ st.u=0; draw(); tw=tween(2600,u=>{ st.u=Math.max(.021,u); draw(); },()=>{ st.u=1; draw(); }); return; }
    st.rows=0; draw(); tw=tween(3*650,u=>{ const r=Math.floor(u*3+1e-9); if(r!==st.rows){ st.rows=r; draw(); } },()=>{ st.rows=9; draw(); }); });
  relayout(svg,draw);
  U18.mask={st,draw,calc,SENT,state(){ const s={mode:st.mode,u:st.u,rows:st.rows};
    if(st.mode!=='all'){ const r=calc(); s.A=r.A; s.O=r.O; s.cells=[...svg.querySelectorAll('[data-role=share]')].map(e=>({r:+e.dataset.r,c:+e.dataset.c,o:+e.getAttribute('opacity'),hatch:/url/.test(e.getAttribute('fill'))})); }
    else { s.see=[...svg.querySelectorAll('[data-role=see]')].map(e=>({r:+e.dataset.r,c:+e.dataset.c,gold:!/grid/.test(e.getAttribute('fill'))})); s.graded=svg.querySelectorAll('[data-role=graded]').length; }
    return s; }};
})();

/* ---------- §11 · w-families: who may look at whom, and who is graded ---------- */
(function(){
  const svg=document.getElementById('fm-svg'); if(!svg) return;
  const read=document.getElementById('fm-read'), famBar=document.getElementById('fm-fam'), maskBtn=document.getElementById('fm-mask');
  const TOK='the train to delhi is late because of the heavy rain today'.split(' ');
  const RANDOM=['kite','blue','ran','cup','seven','soft'];
  const st={fam:'bert',seed:19,nexp:9};
  /* BERT's masking game: choose round(15% of the tokens); each chosen token → [MASK] 80%, a random word 10%, unchanged 10% */
  function masking(seed){ const r=seeded(seed*7919+13), n=TOK.length, k=Math.max(1,Math.round(.15*n)), idx=[...Array(n).keys()];
    for(let i=n-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
    const chosen=idx.slice(0,k).sort((a,b)=>a-b), kind={}, shown=TOK.slice();
    chosen.forEach(i=>{ const x=r(); kind[i]=x<.8?'mask':x<.9?'random':'keep'; if(kind[i]==='mask') shown[i]='[MASK]'; else if(kind[i]==='random') shown[i]=RANDOM[Math.floor(r()*RANDOM.length)]; });
    return {chosen,kind,shown,k}; }
  let last=null;
  function gridBlock(x0,y0,cs,rowsL,colsL,allow,opts){ opts=opts||{}; const F=fz(svg,11), Fs=fz(svg,10), cells=[];
    if(opts.title) txt(svg,x0-(opts.titleDx||0),y0-(opts.rotCols?(opts.rot<-60?84:74):28),opts.title,`font:800 ${Fs}px system-ui;fill:${opts.tcol||'var(--ink-muted)'};letter-spacing:.03em`);
    colsL.forEach((c,j)=>{ const x=x0+j*cs+cs/2; const t=txt(svg,x,y0-6,c,dv(c,`font:700 ${Fs}px system-ui;fill:${opts.ccol?opts.ccol(j):'var(--s1)'}`),opts.rotCols?'start':'middle'); if(opts.rotCols) t.setAttribute('transform',`rotate(${opts.rot||-55} ${x} ${y0-6})`); });
    rowsL.forEach((rl,i)=>{ txt(svg,x0-6,y0+i*cs+cs/2+Fs*.36,rl,dv(rl,`font:700 ${Fs}px system-ui;fill:${opts.rcol?opts.rcol(i):'var(--s2)'}`),'end');
      colsL.forEach((_,j)=>{ const a=allow(i,j), w=typeof a==='number'?a:(a?1:0), gold=w>0;
        el('rect',{x:x0+j*cs+1,y:y0+i*cs+1,width:cs-2,height:cs-2,rx:Math.min(4,cs/5),fill:gold?cv(K18.w):'var(--grid)',opacity:gold?(opts.shade?(.12+.88*w):.9).toFixed(3):.35,'data-role':'perm','data-g':opts.g||'main','data-r':i,'data-c':j},svg);
        if(opts.shade&&gold&&cs>=30) txt(svg,x0+j*cs+cs/2,y0+i*cs+cs/2+F*.33,FX(w,2),`font:700 ${Fs}px system-ui;fill:${w>.55?'#1a1206':'var(--ink)'}`,'middle');
        cells.push({i,j,w}); }); });
    return cells; }
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg);
    svg.setAttribute('viewBox',st.fam==='t5'?(narrow?'0 0 400 900':'0 0 760 330'):(narrow?'0 0 400 540':'0 0 760 420'));   /* the viewBox first: fz() reads it */
    const glow=glo(svg), F=fz(svg,11.5), Fs=fz(svg,10.5), n=TOK.length;
    const graded=[]; let note='';
    if(st.fam==='t5'){
      const EN=ALIGN.EN, DIN=['<s>'].concat(ALIGN.HI.slice(0,3)), DOUT=ALIGN.HI, cs=narrow?44:40;
      const E0=narrow?[124,90]:[90,74], D0=narrow?[124,326]:[330,74], C0=narrow?[124,600]:[590,74];
      gridBlock(E0[0],E0[1],cs,EN,EN,()=>true,{title:'ENCODER · reads both ways',titleDx:70,g:'enc'});
      gridBlock(D0[0],D0[1],cs,DIN,DIN,(i,j)=>j<=i,{title:'DECODER · no peeking',titleDx:70,g:'dec',ccol:()=>'var(--s2)'});
      gridBlock(C0[0],C0[1],cs,DIN,EN,(i,j)=>ALIGN.H.length&&softmax(ALIGN.Q[i])[j],{title:'CROSS-ATTENTION = §1',titleDx:70,g:'cross',shade:true});
      DIN.forEach((w,i)=>{ const x=D0[0]+4*cs+10, y=D0[1]+i*cs+cs/2; el('circle',{cx:x+5,cy:y,r:5,fill:'var(--critical)',filter:glow||'none','data-role':'graded','data-i':i},svg); txt(svg,x+15,y+F*.36,'→ '+DOUT[i],dv(DOUT[i],`font:800 ${F}px system-ui;fill:var(--ink)`)); graded.push(i); });
      const ny=narrow?836:300;
      /* the rows are decoder positions: row "<s>" is the one about to write मैं, so each cross-attention row is §1's row for that word */
      if(narrow){ txt(svg,20,ny,'queries: from the decoder (rows)',`font:600 ${Fs}px system-ui;fill:var(--ink-2)`); txt(svg,20,ny+Fs*1.45,'each row writes the word after its →',`font:600 ${Fs}px system-ui;fill:var(--ink-2)`); txt(svg,20,ny+Fs*2.9,'keys and values: from the encoder (columns)',`font:600 ${Fs}px system-ui;fill:var(--ink-2)`); }
      else { txt(svg,90,ny,'queries from the decoder (rows) · keys and values from the encoder (columns)',`font:600 ${Fs}px system-ui;fill:var(--ink-2)`); txt(svg,90,ny+Fs*1.5,'each row is the decoder about to write the word after its → — so row “<s>” looks at “I” before writing मैं',dv('मैं',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`)); }
      note='Encoder–decoder · the encoder reads “I drink tea” both ways; the decoder writes “मैं चाय पीता हूँ” with a mask and looks back at the encoder through cross-attention — §1’s alignment map. Graded: every Hindi word, <b>4</b>.';
    } else {
      const bert=st.fam==='bert', M=masking(st.seed), cs=narrow?22:21, shown=bert?M.shown:TOK;
      const x0=narrow?86:150, y0=narrow?118:110;
      gridBlock(x0,y0,cs,shown,shown,(i,j)=>bert?true:j<=i,{title:bert?'BERT · every word sees both sides':'GPT · each word sees only its left',titleDx:narrow?80:130,rotCols:true,rot:narrow?-66:-55,g:'main',
        rcol:i=>bert&&M.kind[i]?'var(--critical)':'var(--s2)',ccol:j=>bert&&M.kind[j]?'var(--critical)':'var(--s1)'});
      for(let i=0;i<n;i++){ const isG=bert?M.chosen.includes(i):i<n-1; if(!isG) continue; graded.push(i);
        const x=x0+n*cs+(narrow?6:10), y=y0+i*cs+cs/2; el('circle',{cx:x+5,cy:y,r:4.5,fill:'var(--critical)',filter:glow||'none','data-role':'graded','data-i':i},svg);
        if(!narrow) txt(svg,x+14,y+Fs*.36,bert?'guess “'+TOK[i]+'”'+(M.kind[i]==='mask'?'':M.kind[i]==='random'?' (was swapped)':' (left as is)'):'→ '+TOK[i+1],`font:700 ${Fs}px system-ui;fill:var(--ink)`+HALO); }
      if(!narrow){ const lx=530, ly=y0+20, row=(i,ls,sw)=>{ const yy=ly+i*F*2.9; sw(lx,yy); ls.forEach((t,k)=>txt(svg,lx+26,yy+F*.36+k*F*1.3,t,`font:600 ${Fs}px system-ui;fill:var(--ink-2)`)); };
        txt(svg,lx,ly-24,'HOW TO READ IT',`font:800 ${Fs}px system-ui;fill:var(--ink-muted);letter-spacing:.04em`);
        row(0,['the row’s word may look','at the column’s word'],(x,y)=>el('rect',{x,y:y-8,width:16,height:16,rx:3,fill:cv(K18.w)},svg));
        row(1,['not allowed: hidden','by the mask'],(x,y)=>el('rect',{x,y:y-8,width:16,height:16,rx:3,fill:'var(--grid)',stroke:'var(--line)','stroke-width':1.2},svg));
        row(2,['graded: the guess here','enters the loss'],(x,y)=>el('circle',{cx:x+8,cy:y,r:5,fill:'var(--critical)'},svg));
        if(bert){ const by=ly+F*9.4; txt(svg,lx,by,'each chosen word becomes:',`font:700 ${Fs}px system-ui;fill:var(--ink-2)`);
          ['80% → [MASK]','10% → a random word','10% → left as it is'].forEach((t,i)=>txt(svg,lx+12,by+F*(1.6+i*1.5),t,`font:600 ${Fs}px system-ui;fill:var(--ink-2)`)); } }
      const ky=narrow?y0+n*cs+30:y0+n*cs+34;
      txt(svg,narrow?14:x0-130,ky,bert?'graded places: '+M.k+' of '+n+' (15% → '+N(.15*n,2)+' ≈ '+M.k+')':'graded places: '+(n-1)+' of '+n+' (every next word)',`font:800 ${F}px system-ui;fill:var(--critical)`+HALO);
      if(narrow){ /* phone: no room beside the rows, so the red dots are explained underneath */
        el('circle',{cx:19,cy:ky+F*1.5-F*.33,r:4.5,fill:'var(--critical)'},svg); txt(svg,30,ky+F*1.5,'red dot = this row’s guess is graded',`font:600 ${Fs}px system-ui;fill:var(--ink-2)`);
        txt(svg,14,ky+F*2.9,bert?'guesses: '+M.chosen.map(i=>'“'+TOK[i]+'”').join(', '):'row i guesses word i + 1',`font:600 ${Fs}px system-ui;fill:var(--ink-2)`); }
      note=bert?'BERT · no mask: the whole grid is gold. It hides about 15% of the words — here '+M.k+' of '+n+' — and is graded only there: '+M.chosen.map(i=>'“'+TOK[i]+'” as '+(M.kind[i]==='mask'?'[MASK]':M.kind[i]==='random'?'“'+M.shown[i]+'”':'itself')).join(', ')+'.'
        :'GPT · the causal mask: a staircase. Every position guesses the word after it, so <b>'+(n-1)+'</b> of the '+n+' positions are graded, all in one pass.';
      last={fam:st.fam,mask:M}; }
    const N0=Math.pow(2,st.nexp), b=.15*N0;
    read.innerHTML=note+'<br>text of <b>'+grp(N0)+'</b> tokens · BERT grades 0.15 × '+grp(N0)+' = <b>'+N(b,2)+'</b> (≈ '+Math.round(b)+'; [MASK] '+N(.8*b,2)+' · random '+N(.1*b,2)+' · unchanged '+N(.1*b,2)+') · GPT grades <b>'+grp(N0-1)+'</b> — '+N((N0-1)/b,1)+' times as many';
    const cells=[...svg.querySelectorAll('[data-role=perm]')].map(e=>({g:e.dataset.g,r:+e.dataset.r,c:+e.dataset.c,gold:!/grid/.test(e.getAttribute('fill')),o:+e.getAttribute('opacity')}));
    last=Object.assign(last&&last.fam===st.fam?last:{fam:st.fam},{graded,cells,n:N0,bert:b,gpt:N0-1});
    svg.dataset.state=[st.fam,graded.join(' '),N0].join('|'); }
  tabs(famBar,t=>{ st.fam=t; maskBtn.disabled=t!=='bert'; draw(); });
  maskBtn.addEventListener('click',()=>{ if(st.fam!=='bert'){ st.fam='bert'; selTab(famBar,'bert'); maskBtn.disabled=false; } st.seed++; draw(); });
  bindCtl('fm-n',v=>{ st.nexp=v; draw(); },v=>grp(Math.pow(2,v)));
  relayout(svg,draw);
  U18.families={st,draw,masking,TOK,set(fam){ st.fam=fam; selTab(famBar,fam); maskBtn.disabled=fam!=='bert'; draw(); },state(){ return last; }};
})();

/* ---------- §12 · w-cost: handshakes against the relay ---------- */
(function(){
  const svg=document.getElementById('cs-svg'); if(!svg) return;
  const read=document.getElementById('cs-read');
  const st={lg:3,h:1,L:1};
  const nOf=()=>Math.round(Math.pow(10,st.lg));
  let last=null;
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 440':'0 0 760 340');
    const glow=glo(svg), F=fz(svg,11.5), Fs=fz(svg,10);
    /* y from 10^−0.6 so the flat "1 step" line sits clear of the bottom edge and its dot never covers a tick label */
    const P=narrow?{x:58,y:92,w:318,h:280}:{x:72,y:30,w:640,h:250}, Y0=-.6, Y1=13;
    const pn=panel(svg,P.x,P.y,P.w,P.h,1,5,Y0,Y1,{xs:1,ys:2,xt:false,yt:false});
    for(let v=1;v<=5;v++) txt(svg,pn.px(v),P.y+P.h+16,'10'+SUP(v),`font:500 ${Fs}px system-ui;fill:var(--ink-muted)`,'middle');
    for(let v=0;v<=12;v+=2) txt(svg,P.x-6,pn.py(v)+Fs*.35,'10'+SUP(v),`font:500 ${Fs}px system-ui;fill:var(--ink-muted)`,'end');
    txt(svg,P.x+P.w,P.y+P.h+F*2.6,'words n (log scale)',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'end');
    txt(svg,P.x-6,P.y-8,'count (log scale)',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`);
    const curve=(f,col,dash,role)=>{ let d=''; for(let t=0;t<=100;t++){ const lg=1+4*t/100, v=Math.log10(Math.max(1,f(Math.pow(10,lg)))); d+=(t?'L':'M')+pn.px(lg).toFixed(1)+','+pn.py(Math.min(Y1,v)).toFixed(1); }
      glowPath(svg,d,col,2.6,!!glow,dash?{'stroke-dasharray':dash}:null).setAttribute('data-role',role); };
    const att=n=>n*n*st.h*st.L, rel=n=>n, par=()=>st.L;
    curve(att,cv(K18.w),null,'att'); curve(rel,cv(K18.k),null,'rel'); curve(par,cv(K18.v),'6 5','par');
    const n=nOf(), X=pn.px(st.lg);
    el('line',{x1:X,y1:P.y,x2:X,y2:P.y+P.h,stroke:'var(--ink-2)','stroke-width':1.2,'stroke-dasharray':'3 4'},svg);
    const dots=[[att(n),K18.w],[rel(n),K18.k],[par(),K18.v]].map(([v,k])=>{ const y=pn.py(Math.min(Y1,Math.log10(Math.max(1,v)))); glowDot(svg,X,y,5,cv(k),glow); return y; });
    const L=[['attention scores n²·h·L',K18.w],['relay: steps in a row, n',K18.k],['attention: steps in a row = layers',K18.v]];
    L.forEach(([t,k],i)=>{ const lx=narrow?P.x:P.x+12, ly=narrow?20+i*(F*1.45):P.y+18+i*(F*1.4); el('rect',{x:lx,y:ly-F*.62,width:16,height:4,rx:2,fill:cv(k)},svg); txt(svg,lx+22,ly-F*.2,t,`font:700 ${Fs}px system-ui;fill:var(--ink-2)`+HALO); });
    const mb=att(n)*2/1e6;
    read.innerHTML='n = <b>'+grp(n)+'</b> words · '+st.h+' head'+(st.h>1?'s':'')+' · '+st.L+' layer'+(st.L>1?'s':'')+'<br>attention scores: '+grp(n)+'² × '+st.h+' × '+st.L+' = <b style="color:var(--s4)">'+grp(att(n))+'</b> (≈ '+(mb>=1e6?N(mb/1e6,2)+' TB':mb>=1000?N(mb/1000,2)+' GB':N(mb,2)+' MB')+' at 2 bytes each)<br>steps that must wait in a row: relay <b style="color:var(--s1)">'+grp(n)+'</b> · attention <b style="color:var(--s3)">'+st.L+'</b>';
    last={n,h:st.h,L:st.L,scores:att(n),mb,dotsY:dots,py:v=>pn.py(v)};
    svg.dataset.state=[n,st.h,st.L,att(n)].join(','); }
  bindCtl('cs-n',v=>{ st.lg=v; draw(); },v=>grp(Math.round(Math.pow(10,v))));
  bindCtl('cs-h',v=>{ st.h=v; draw(); },v=>String(v)); bindCtl('cs-L',v=>{ st.L=v; draw(); },v=>String(v));
  relayout(svg,draw);
  U18.cost={st,draw,state(){ return last; }};
})();

/* ---------- §13 · w-tiny: a tiny transformer, step by step ---------- */
(function(){
  const card=document.getElementById('tn-card'); if(!card) return;
  const svg=document.getElementById('tn-svg'), scrub=document.getElementById('tn-scrub'), count=document.getElementById('tn-count');
  const st={sent:'drink',k:0};
  const TGT={drink:['drink','chai'],play:['play','cricket']};
  const R=()=>TINY.run(['I',st.sent]);
  const rowsL=()=>['“I”','“'+st.sent+'”'];
  const M=(A,tone,o)=>matHTML(A,Object.assign({tone},o||{}));
  const row=(nm,html)=>`<div class="tn-row"><span class="nm">${nm}</span>${html}</div>`;
  const STEPS=[
    {s:'look up',t:'1 · Look up each word',sub:'Each word\'s row of the embedding table (Unit 16).',b:r=>row('E(I)',M([r.E[0]],'par'))+row('E('+st.sent+')',M([r.E[1]],'par')),note:'The four numbers are hand-made features: who, drink, play, and a last one that the positions will use.'},
    {s:'+ position',t:'2 · Add the position vectors',sub:'X = E + P. The table P is learned in many real models; here p₀ = (0, 0, 0, 1) and p₁ = (0, 0, 0, −1).',b:r=>row('P',M(r.P,'par'))+row('X',M(r.X,'k')),note:'Now the last number says "I come first" (+1) or "I come second" (−1).'},
    {s:'head 1 · scores',t:'3 · Head 1: queries, keys, scores',sub:'Head 1 is set up to look at the word before. Masked: a word may not look ahead.',b:r=>row('Q₁ = XW_Q',M(r.q1,'q'))+row('K₁ = XW_K',M(r.k1,'k'))+row('scores',M(r.h1.S,'gold')),note:'Row 2: q = (2, 0) meets k₁ = (1, 0) and k₂ = (−1, 0): scores 2/√2 = 1.414 and −1.414.'},
    {s:'head 1 · blend',t:'4 · Head 1: shares and blend',sub:'Softmax each row, then blend the values.',b:r=>row('shares',M(r.h1.A,'gold',{cell:(i,j)=>i===1?'hot':''}))+row('V₁',M(r.v1,'v'))+row('answer',M(r.h1.O,'v')),note:'Row 2 gives 0.944 to “I” and 0.056 to itself: the second word pulls in the first word’s meaning.'},
    {s:'head 2 · scores',t:'5 · Head 2: queries, keys, scores',sub:'Head 2 is set up to look for action words (drink, play).',b:r=>row('Q₂',M(r.q2,'q'))+row('K₂',M(r.k2,'k'))+row('scores',M(r.h2.S,'gold')),note:'Only the action word has a non-zero key, so row 2 scores it 1.414.'},
    {s:'head 2 · blend',t:'6 · Head 2: shares and blend',sub:'The same softmax-and-blend, with head 2\'s own values.',b:r=>row('shares',M(r.h2.A,'gold'))+row('V₂',M(r.v2,'v'))+row('answer',M(r.h2.O,'v')),note:'Row 2: shares (0.196, 0.804) — the same numbers as the masked example of §10.'},
    {s:'glue · W_O',t:'7 · Glue the heads, mix with W_O',sub:'[head 1 | head 2] is 2 × 4; W_O maps it back to d = 4.',b:r=>row('[h₁ | h₂]',M(r.H,'par'))+row('× W_O',M(r.att,'v')),note:'Head 2\'s "drink" lands in the drink column; its "play" lands in the play column.'},
    {s:'add · norm',t:'8 · Add the shortcut, then layer norm',sub:'R = X + attention; each row to mean 0 and spread 1.',b:r=>row('X + att',M(r.R1,'k'))+row('LN',M(r.L1,'k')),note:'The residual keeps each word\'s own numbers; layer norm only rescales.'},
    {s:'small network',t:'9 · The small network, word by word',sub:'hidden = ReLU(L W₁), out = hidden W₂.',b:r=>row('ReLU(L W₁)',M(r.hid,'par'))+row('× W₂',M(r.F,'v')),note:'Its first neuron fires for "drink more than play"; its second for "play more than drink".'},
    {s:'add · norm',t:'10 · Add and layer norm again',sub:'The block\'s output: one new vector per word.',b:r=>row('L + FFN',M(r.R2,'k'))+row('LN',M(r.L2,'k')),note:'This is what a second block would receive. We stop after one.'},
    {s:'vocab scores',t:'11 · Score every word of the vocabulary',sub:'logits = output × W_U (columns: I, drink, play, chai, cricket).',b:r=>row('logits',M(r.logits,'gold')),note:'Row 1 favours drink and play; row 2 favours '+(st.sent==='drink'?'chai':'cricket')+'. (With weight tying, W_U would be the embedding table turned on its side.)'},
    {s:'softmax · loss',t:'12 · Softmax, and the loss',sub:'Probabilities for the next word at every position; the loss is the average −ln p(true next word).',b:r=>{ const T=TGT[st.sent], p0=r.probs[0][TINY.VOC.indexOf(T[0])], p1=r.probs[1][TINY.VOC.indexOf(T[1])], L=(-Math.log(p0)-Math.log(p1))/2;
      const bars=pr=>{ const mx=Math.max(...pr); return '<div class="tn-probs">'+pr.map((p,i)=>`<span>${TINY.VOC[i]}</span><span class="bar${p===mx?' win':''}" style="width:${(p*100).toFixed(1)}%"></span><span class="pv">${N(p,3)}</span>`).join('')+'</div>'; };
      return row('after “I”',bars(r.probs[0]))+row('after “I '+st.sent+'”',bars(r.probs[1]))+`<div class="st-win">loss = ½(−ln ${N(p0,3)} − ln ${N(p1,3)}) = <b>${N(L,3)}</b> for “I ${st.sent} ${T[1]}”</div>`; },note:'Backprop (Unit 15) would now send the blame back through every matrix on this tower.'}];
  function drawTower(){ svg.innerHTML=""; const glow=glo(svg), F=Math.max(14,fz(svg,12)), n=STEPS.length, H=460, top=18, h=(H-2*top)/n;
    STEPS.forEach((s,i)=>{ const y=H-top-(i+1)*h, on=i===st.k, done=i<st.k;
      const cat=i<2?K18.tok:i<7?K18.w:i<10?K18.v:K18.prob; el('rect',{x:24,y:y+6,width:8,height:h-12,rx:3,fill:cv(cat),opacity:on||done?1:.45},svg);
      el('rect',{x:40,y:y+3,width:300,height:h-6,rx:9,fill:on?'color-mix(in srgb,var(--s4) 22%,transparent)':done?'color-mix(in srgb,var(--s1) 12%,transparent)':'color-mix(in srgb,var(--surface-2) 60%,transparent)',stroke:on?cv(K18.w):'var(--line)','stroke-width':on?2:1,filter:on&&glow?glow:'none',style:'cursor:pointer'},svg).addEventListener('click',()=>go(i));
      txt(svg,58,y+h/2+F*.36,(i+1)+' · '+s.s,`font:${on?800:600} ${F}px system-ui;fill:${on?'var(--ink)':'var(--ink-2)'}`);
      if(i<n-1) el('line',{x1:190,y1:y+3,x2:190,y2:y-3,stroke:'var(--ink-muted)','stroke-width':1.4},svg); }); }
  function draw(){ const r=R(), s=STEPS[st.k];
    card.innerHTML=`<div class="st-head"><span class="st-badge ${st.k>=10?'a':'f'}">STEP ${st.k+1}</span><span class="st-rule">${rowsL().join(' · ')}</span></div><h4 class="st-title">${s.t}</h4><p class="st-sub">${s.sub}</p><div class="tn-rows">${s.b(r)}</div><p class="st-info">${s.note}</p>`;
    scrub.querySelectorAll('button').forEach((b,i)=>{ b.setAttribute('aria-selected',i===st.k); b.classList.toggle('done',i<st.k); });
    count.textContent=(st.k+1)+' / '+STEPS.length; drawTower();
    card.dataset.state=st.sent+'|'+st.k+'|'+r.probs[1].map(p=>p.toFixed(3)).join(' '); }
  scrub.innerHTML=STEPS.map((s,i)=>`<button type="button" role="tab" class="${i>=10?'a':'f'}" aria-selected="${i===0}">${i+1}</button>`).join('');
  scrub.querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>go(i)));
  function go(k){ st.k=Math.max(0,Math.min(STEPS.length-1,k)); draw(); }
  document.getElementById('tn-next').addEventListener('click',()=>go(st.k+1));
  document.getElementById('tn-prev').addEventListener('click',()=>go(st.k-1));
  document.getElementById('tn-end').addEventListener('click',()=>go(STEPS.length-1));
  tabs(document.getElementById('tn-sent'),t=>{ st.sent=t; draw(); });
  draw(); new MutationObserver(drawTower).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if('ResizeObserver' in window){ let lw=0; new ResizeObserver(()=>{ const w=svg.getBoundingClientRect().width; if(Math.abs(w-lw)>4){ lw=w; drawTower(); } }).observe(svg.parentNode); }
  U18.tiny={st,go,R,state(){ const r=R(); return {sent:st.sent,k:st.k,probs:r.probs,h1:r.h1.A,h2:r.h2.A}; }};
})();
