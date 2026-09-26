/* ================= UNIT 16 · widgets of Act III: w-cooc, w-pmi, w-svd-words, w-friends ================= */

/* ---------- §5 · w-cooc: word × word (the corpus builds the table; the angle between two rows) and word × document ---------- */
(function(){
  const svg=document.getElementById('co-svg'); if(!svg) return;
  const root=document.getElementById('w-cooc'), sentBox=document.getElementById('co-sent'), mat=document.getElementById('co-mat'), pickHost=document.getElementById('co-pick'), read=document.getElementById('co-read');
  const dsvg=document.getElementById('cd-svg'), dmat=document.getElementById('cd-mat'), ddocs=document.getElementById('cd-docs'), dread=document.getElementById('cd-read');
  const st={tab:'ww',win:2,pair:['chai','coffee']};
  function drawSent(){ sentBox.innerHTML=CO_SENT.map(s=>{ const w=s.split(' ');
      const inWin=new Set(); w.forEach((a,i)=>{ if(st.pair.includes(a)) for(let j=Math.max(0,i-st.win);j<=Math.min(w.length-1,i+st.win);j++) if(j!==i&&CO_CTX.includes(w[j])) inWin.add(j); });
      const hasPair=w.some(a=>st.pair.includes(a));
      return `<div class="${hasPair?'':'dim'}">`+w.map((a,i)=>CO_TARGETS.includes(a)?`<span class="t${st.pair.includes(a)?' sel':''}">${a}</span>`:CO_CTX.includes(a)?`<span class="c${inWin.has(i)?' in':''}">${a}</span>`:a).join(' ')+'</div>'; }).join(''); }
  function drawMat(M){ const base=coCounts(2), mx=Math.max(...M.flat(),1);
    mat.innerHTML='<table class="bgt"><thead><tr><th></th>'+CO_CTX.map(c=>`<th style="color:var(--s3)">${c}</th>`).join('')+'</tr></thead><tbody>'+
      M.map((r,i)=>`<tr class="${st.pair.includes(CO_TARGETS[i])?'on':''}"><th class="rh" style="color:var(--s1)">${CO_TARGETS[i]}</th>`+r.map((c,j)=>`<td class="cc${c?'':' z'}${c!==base[i][j]?' chg':''}" style="--h:${(c/mx).toFixed(3)}">${c}</td>`).join('')+'</tr>').join('')+'</tbody></table>'; }
  let geo=null;
  function drawAngle(M){ const narrow=vbFor(svg,'0 0 460 250','0 0 340 300'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg);
    const [a,b]=st.pair.map(w=>M[CO_TARGETS.indexOf(w)]), c=cosSim(a,b), th=Math.acos(Math.max(-1,Math.min(1,c))), na=norm(a), nb=norm(b);
    const ox=narrow?30:40, oy=narrow?162:210, R=narrow?250:170, mx=Math.max(na,nb,1e-9), la=R*na/mx, lb=R*nb/mx;
    const col=w=>w===st.pair[0]?cv(K16.word):cv('s5');
    const ar=Math.min(la,lb)*.42, x1=ox+ar, y1=oy, x2=ox+ar*Math.cos(th), y2=oy-ar*Math.sin(th);
    el('path',{d:`M${ox},${oy} L${x1},${y1} A${ar},${ar} 0 0 0 ${x2},${y2} Z`,fill:cv(K16.gold),opacity:.18},svg);
    el('path',{d:`M${x1},${y1} A${ar},${ar} 0 0 0 ${x2},${y2}`,fill:'none',stroke:cv(K16.gold),'stroke-width':2},svg);
    const tipA=[ox+la,oy], tipB=[ox+lb*Math.cos(th),oy-lb*Math.sin(th)];
    garrow(svg,ox,oy,tipA[0],tipA[1],col(st.pair[0]),3.2,!!glow); garrow(svg,ox,oy,tipB[0],tipB[1],col(st.pair[1]),3.2,!!glow);
    txt(svg,tipA[0],oy+18*k,st.pair[0],FT(700,11,k,col(st.pair[0])),'end');
    /* the second word's name goes above its tip, or to the right of it when the two arrows nearly coincide */
    if(th<.35) txt(svg,tipB[0]+8,tipB[1]-8*k,st.pair[1],FT(700,11,k,col(st.pair[1])),'start'); else txt(svg,tipB[0]+6,tipB[1]-6,st.pair[1],FT(700,11,k,col(st.pair[1])));
    const deg=th*180/Math.PI; txt(svg,ox+ar*1.12*Math.cos(th/2)+6,oy-ar*1.12*Math.sin(th/2)+4,N(deg,1)+'°',FT(700,10.5,k,cv(K16.gold)));
    const bx=narrow?40:268, by=narrow?206:40, bw=narrow?270:170, bh=narrow?56:120, mxc=Math.max(...a,...b,1);
    if(!narrow) txt(svg,bx,by-10,'their two rows',FT(700,10,k,'var(--ink-muted)'));
    CO_CTX.forEach((cx,j)=>{ const gx=bx+j*bw/4, w=bw/4*.34;
      [a,b].forEach((row,s)=>{ const h=bh*row[j]/mxc; el('rect',{class:'rowbar','data-v':row[j],x:gx+4+s*(w+2),y:by+bh-h,width:w,height:Math.max(.5,h),rx:3,fill:col(st.pair[s]),opacity:.85},svg); });
      txt(svg,gx+4+w,by+bh+13*k,cx,FT(600,9.5,k,'var(--s3)'),'middle'); });
    geo={ox,oy,la,lb,th,tipA,tipB,na,nb};
    const dotv=dot(a,b);
    read.innerHTML=`${st.pair[0]} ${vecN(a)} · ${st.pair[1]} ${vecN(b)}<br>dot product <b>${N(dotv)}</b> · lengths √${N(dot(a,a))} and √${N(dot(b,b))}<br>cos θ = ${N(dotv)}/(√${N(dot(a,a))}·√${N(dot(b,b))}) = <b>${N(c,3)}</b> · θ ≈ <b>${N(deg,1)}°</b>`; }
  /* word × document */
  const CDW=2, CD=cdTables(CDW);
  function drawDocs(){ ddocs.innerHTML=CD_DOCS.map(([t,d],i)=>`<div class="doc"><b>D${i+1} · ${esc(t)}</b>`+d.split(' ').map(w=>w==='chai'?`<span class="w-t">${w}</span>`:w==='kettle'?`<span class="w-k">${w}</span>`:w==='coffee'?`<span class="w-x">${w}</span>`:w==='cricket'?`<span class="w-c">${w}</span>`:esc(w)).join(' ')+'</div>').join('');
    const mx=Math.max(...CD.TD.flat(),1);
    dmat.innerHTML='<table class="bgt"><thead><tr><th></th>'+CD_DOCS.map((_,i)=>`<th>D${i+1}</th>`).join('')+'</tr></thead><tbody>'+
      CD.TD.map((r,i)=>`<tr class="${i===0?'on':''}"><th class="rh" style="color:var(--s1)">${CD_T[i]}</th>`+r.map(c=>`<td class="${c?'':'z'}" style="--h:${(c/mx).toFixed(3)}">${c}</td>`).join('')+'</tr>').join('')+'</tbody></table>'; }
  const simTo=(tbl,w)=>CD_T.filter(x=>x!==w).map(x=>({w:x,c:cosSim(tbl[CD_T.indexOf(w)],tbl[CD_T.indexOf(x)])}));
  function drawDocBars(){ const narrow=vbFor(dsvg,'0 0 460 230','0 0 340 330'); dsvg.innerHTML=''; const k=svgK(dsvg,10), glow=glo(dsvg);
    const sets=[['by neighbours (±'+CDW+' words)',simTo(CD.NB,'chai')],['by documents',simTo(CD.TD,'chai')]], COL={coffee:cv('s1'),kettle:cv('s2'),cricket:cv('s3')};
    if(!narrow) txt(dsvg,18,16,'who is most like chai?',FT(800,10.5,Math.min(k,1.25),'var(--ink)'));
    sets.forEach(([title,arr],si)=>{ const x0=narrow?20:(si?248:18), y0=narrow?(si?182:26):40, w=narrow?300:194, bh=narrow?104:146, top=y0+18*Math.min(k,1.3);
      txt(dsvg,x0,y0,narrow?'who is most like chai? '+title:title,FT(700,10,Math.min(k,1.25),'var(--ink-muted)'));
      const best=arr.reduce((a,b)=>b.c>a.c?b:a); const rowH=(bh-10)/arr.length;
      arr.forEach((o,i)=>{ const y=top+i*rowH, lx=x0+62*Math.min(k,1.25), bw=Math.max(0,(w-(lx-x0)-40)*Math.max(0,o.c)), isB=o===best;
        txt(dsvg,lx-6,y+rowH*.55,o.w,FT(isB?800:600,10.5,Math.min(k,1.25),isB?COL[o.w]:'var(--ink-2)'),'end');
        el('rect',{x:lx,y:y+rowH*.18,width:w-(lx-x0)-40,height:rowH*.5,rx:4,fill:'var(--grid)',opacity:.5},dsvg);
        el('rect',{class:'simbar','data-set':si,'data-w':o.w,'data-c':o.c.toFixed(6),x:lx,y:y+rowH*.18,width:bw,height:rowH*.5,rx:4,fill:COL[o.w],opacity:isB?.95:.55},dsvg);
        txt(dsvg,lx+bw+5,y+rowH*.55,N(o.c,3),FT(700,10,Math.min(k,1.25),'var(--ink)')); }); });
    const nb=simTo(CD.NB,'chai'), td=simTo(CD.TD,'chai'), g=w=>a=>a.find(o=>o.w===w).c;
    dread.innerHTML=`by neighbours: cos(chai, coffee) = <b>${N(g('coffee')(nb),3)}</b>, cos(chai, kettle) = <b>${N(g('kettle')(nb),3)}</b><br>by documents: cos(chai, kettle) = <b>${N(g('kettle')(td),3)}</b>, cos(chai, coffee) = <b>${N(g('coffee')(td),3)}</b><br><span style="color:var(--ink-muted)">small window → stand-ins · whole document → topic-mates</span>`; }
  function all(){ if(st.tab==='ww'){ const M=coCounts(st.win); drawSent(); drawMat(M); drawAngle(M); pressPair(); } else { drawDocs(); drawDocBars(); } }
  function pressPair(){ pickHost.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',st.pair.includes(b.dataset.w)?'true':'false')); }
  chipRow(pickHost,CO_TARGETS,'',w=>{ if(st.pair.includes(w)) return; st.pair=[st.pair[1],w]; all(); });
  bindCtl('co-win',v=>{ st.win=v; all(); },v=>String(v));
  tabs(document.getElementById('co-tabs'),t=>{ st.tab=t; showTab(root,t); all(); });
  all(); onTheme(()=>{ all(); }); onResizeW(root,all);
  U16['w-cooc']={state(){ const M=coCounts(st.win), [a,b]=st.pair.map(w=>M[CO_TARGETS.indexOf(w)]);
      return {tab:st.tab,win:st.win,pair:st.pair.slice(),M,cos:cosSim(a,b),geo:geo&&{...geo},rowbars:[...svg.querySelectorAll('rect.rowbar')].map(r=>({v:+r.dataset.v,h:+r.getAttribute('height')})),
        doc:{TD:CD.TD,nb:simTo(CD.NB,'chai'),td:simTo(CD.TD,'chai'),bars:[...dsvg.querySelectorAll('rect.simbar')].map(r=>({set:+r.dataset.set,w:r.dataset.w,c:+r.dataset.c,width:+r.getAttribute('width')}))},
        texts:textBoxes(st.tab==='ww'?svg:dsvg)}; },
    setPair(a,b){ st.pair=[a,b]; all(); }, setTab(t){ document.querySelector(`#co-tabs [data-t="${t}"]`).click(); }};
})();

/* ---------- §6 · w-pmi: counts → if strangers → ratio → PMI → PPMI; and TF-IDF ---------- */
(function(){
  const grid=document.getElementById('pm-grid'); if(!grid) return;
  const root=document.getElementById('w-pmi'), read=document.getElementById('pm-read'), stepsBar=document.getElementById('pm-steps');
  const st={tab:'pmi',step:0,M:PM_M0.map(r=>r.slice())};
  const STEPNAME=['the counts','what chance alone would give: row total × column total ÷ N','the ratio: count ÷ chance','PMI = log₂ of the ratio','PPMI = the positive part of PMI'];
  const vfmt=(x,step)=>{ if(step===0) return String(x); if(!isFinite(x)) return x===-Infinity?'−∞':'—'; return trim(F(x,step===1?2:3)); };
  function draw(){ const S=pmiSteps(st.M), s=st.step, tbl=[st.M,S.E,S.R,S.P,S.PP][s];
    const fin=tbl.flat().filter(x=>isFinite(x)), mx=Math.max(1e-9,...fin.map(Math.abs)), mxR=Math.max(1e-9,...fin.map(x=>Math.abs(Math.log2(Math.max(x,1e-9)))));
    let h=`<table class="pmt"><caption>${s+1} · ${STEPNAME[s]}</caption><thead><tr><th></th>`+PM_C.map(c=>`<th class="cl">${c}</th>`).join('')+(s===0?'<th class="tot">row total</th>':'')+'</tr></thead><tbody>';
    PM_R.forEach((r,i)=>{ h+=`<tr><th class="rw">${r}</th>`+PM_C.map((c,j)=>{ const x=tbl[i][j];
        let cls='', hv=0; if(s===0||s===1){ cls='pos'; hv=x/mx; } else if(s===2){ const l=Math.log2(Math.max(x,1e-9)); cls=l>1e-9?'pos':l<-1e-9?'neg':'zero'; hv=Math.min(1,Math.abs(l)/mxR); } else { cls=x>1e-9?'pos':x<-1e-9||x===-Infinity?'neg':'zero'; hv=isFinite(x)?Math.min(1,Math.abs(x)/mx):1; }
        const hl=r==='chai'&&c==='hot'?' hl':'';
        if(s===0) return `<td class="${cls}${hl}" style="--h:${hv.toFixed(3)}"><input type="number" min="0" max="99" step="1" value="${x}" data-i="${i}" data-j="${j}" aria-label="count of ${r} with ${c}"></td>`;
        return `<td class="${cls}${hl}" data-v="${isFinite(x)?x:String(x)}" style="--h:${hv.toFixed(3)}">${vfmt(x,s)}</td>`; }).join('')+(s===0?`<td class="tot">${S.rs[i]}</td>`:'')+'</tr>'; });
    if(s===0) h+=`<tr><th class="rw tot">column total</th>`+S.cs.map(c=>`<td class="tot">${c}</td>`).join('')+`<td class="tot">N = ${S.N}</td></tr>`;
    grid.innerHTML=h+'</tbody></table>';
    grid.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{ const v=Math.max(0,Math.min(99,Math.round(+inp.value||0))); st.M[+inp.dataset.i][+inp.dataset.j]=v; const i=+inp.dataset.i,j=+inp.dataset.j; draw(); const again=grid.querySelector(`input[data-i="${i}"][data-j="${j}"]`); if(again){ again.focus(); } }));
    const ci=0, hj=0, tj=1, mj=2, e=S.E[ci][hj];
    read.innerHTML=`chai · hot: count <b>${st.M[0][0]}</b>, chance gives <b>${trim(F(e,2))}</b> (= ${S.rs[0]} × ${S.cs[0]} ÷ ${S.N})<br>ratio <b>${vfmt(S.R[0][0],2)}</b> → PMI <b>${vfmt(S.P[0][0],3)}</b> bits<br>chai · the: PMI <b>${vfmt(S.P[0][tj],3)}</b> · chai · match: PMI <b>${vfmt(S.P[0][mj],3)}</b> → PPMI <b>${vfmt(S.PP[0][mj],3)}</b>`+
      `<br><span style="color:var(--ink-muted)">${['shade = the size of the count: "the" looks like the biggest neighbour','shade = the count that chance alone would give','blue: more than chance · red: less than chance · grey: exactly chance'][s]||'"the" meets both words exactly as often as chance says'}</span>`; }
  function drawTF(){ const T=tfidf(), docs=document.getElementById('tf-docs'), tg=document.getElementById('tf-grid'), tr=document.getElementById('tf-read');
    docs.innerHTML=TF_DOCS.map(d=>`<div class="doc"><b>${d.n}</b>`+Object.entries(d.w).map(([w,c])=>`<span class="${w==='the'?'w-z':'w-t'}">${w}</span> ×${c}`).join(' · ')+'</div>').join('');
    const mxW=Math.max(...T.W.flat(),1e-9);
    let h='<table class="pmt"><caption>counts, how many documents have the word, and the weight tf × idf</caption><thead><tr><th></th>'+TF_DOCS.map(d=>`<th class="cl">tf ${d.n}</th>`).join('')+'<th class="cl">df</th><th class="cl">idf</th>'+TF_DOCS.map(d=>`<th class="cl">weight ${d.n}</th>`).join('')+'</tr></thead><tbody>';
    TF_W.forEach((w,i)=>{ h+=`<tr><th class="rw">${w}</th>`+T.tf[i].map(x=>`<td class="${x?'':'zero'}">${x}</td>`).join('')+`<td>${T.df[i]}</td><td class="${T.idf[i]>0?'pos':'zero'}" style="--h:${(T.idf[i]/.477).toFixed(3)}" data-v="${T.idf[i]}">${trim(F(T.idf[i],3))}</td>`+
      T.W[i].map(x=>`<td class="${x>0?'pos':'zero'}" style="--h:${(x/mxW).toFixed(3)}" data-v="${x}">${trim(F(x,3))}</td>`).join('')+'</tr>'; });
    tg.innerHTML=h+'</tbody></table>';
    tr.innerHTML=`"the" is the commonest word in D1 (tf 3) but it is in all ${T.N} documents: idf = log₁₀(3/3) = <b>0</b>, weight <b>0</b><br>chai in D1: 2 × ${trim(F(T.idf[1],3))} = <b>${trim(F(T.W[1][0],3))}</b> · hot in D1: <b>${trim(F(T.W[2][0],3))}</b> · cricket in D2: <b>${trim(F(T.W[3][1],3))}</b>`; }
  stepsBar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ st.step=+b.dataset.s; stepsBar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false')); draw(); }));
  document.getElementById('pm-reset').addEventListener('click',()=>{ st.M=PM_M0.map(r=>r.slice()); draw(); });
  tabs(document.getElementById('pm-tabs'),t=>{ st.tab=t; showTab(root,t); if(t==='tfidf') drawTF(); else draw(); });
  draw(); drawTF();
  U16['w-pmi']={state(){ const S=pmiSteps(st.M), T=tfidf(); return {tab:st.tab,step:st.step,M:st.M.map(r=>r.slice()),N:S.N,E:S.E,R:S.R,P:S.P,PP:S.PP,shown:[...grid.querySelectorAll('td[data-v]')].map(t=>t.dataset.v),tfidf:T}; },
    step(s){ stepsBar.querySelector(`[data-s="${s}"]`).click(); }, setCount(i,j,v){ st.M[i][j]=v; draw(); }, reset(){ st.M=PM_M0.map(r=>r.slice()); draw(); }, setTab(t){ document.querySelector(`#pm-tabs [data-t="${t}"]`).click(); }};
})();

/* ---------- §7 · w-svd-words: 16 words squeezed to k = 1, 2, 3 numbers (3-D), one label per topic, hover for each word ---------- */
(function(){
  const box=document.getElementById('sv-3d'); if(!box||!CIN) return;
  const RAW=svdRows(SV_M), PP=svdRows(ppmi(SV_M));
  const st={k:3,mode:'raw',shown:null};
  const read=document.getElementById('sv-read'), bars=document.getElementById('sv-bars');
  const model=()=>st.mode==='raw'?RAW:PP;
  /* each word is drawn as its DIRECTION (length 2.2): the angle between two dots is exactly the angle the cosine measures */
  const target=()=>{ const m=model(); return SV_W.map((_,i)=>{ const c=m.coord(i), v=[0,1,2].map(d=>d<st.k?c[d]:0), n=norm(v)||1; return v.map(x=>x/n*2.2); }); };
  const P3w=c=>[c[0],c[2],c[1]];   /* direction 1 → x, direction 2 → depth (the floor), direction 3 → up */
  st.shown=target();
  function kcos(i,j){ const m=model(), a=m.coord(i).slice(0,st.k), b=m.coord(j).slice(0,st.k); return cosSim(a,b); }
  const GROUPS=['tea','sport','travel'], GNAME={tea:'tea words',sport:'sport words',travel:'travel words'};
  function readout(){ const m=model(), I=w=>SV_W.indexOf(w);
    read.innerHTML=`${st.mode==='raw'?'raw counts':'PPMI'} · keep <b>${st.k}</b> → energy kept <b>${N(100*m.energy[st.k-1],1)}%</b><br>cos(chai, coffee) = <b>${N(kcos(I('chai'),I('coffee')),3)}</b><br>cos(chai, cricket) = <b>${N(kcos(I('chai'),I('cricket')),3)}</b><br>cos(train, bus) = <b>${N(kcos(I('train'),I('bus')),3)}</b>`; }
  function drawBars(){ const b=bars; b.innerHTML=''; const k=svgK(b,8), m=model(), S=m.S, mx=S[0], W=300, H=130, L=10, bw=(W-2*L)/S.length;
    S.forEach((s,i)=>{ const h=(H-40)*s/mx, x=L+i*bw+bw*.15, on=i<st.k; el('rect',{class:'sv','data-s':s.toFixed(6),x,y:H-22-h,width:bw*.7,height:Math.max(1,h),rx:3,fill:on?cv(K16.gold):'var(--ink-muted)',opacity:on?.95:.35},b);
      if(i<4) txt(b,x+bw*.35,H-26-h,N(s,1),FT(700,8.5,k,on?'var(--ink)':'var(--ink-muted)'),'middle'); });
    txt(b,L,H-6,'singular values, biggest first',FT(600,9,k,'var(--ink-muted)')); }
  let S3=null, ctxRef=null, glabs=[];
  function build(){ return CIN.stage3d(box,{camera:{pos:camFit(box,[4.2,3.4,5.6],[.4,.2,0],1.3),look:[.4,.2,0],fov:38},orbit:true,autoRotate:.08,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx); ctxRef=ctx;
      starfield(ctx,300,16);
      const sheet=CIN.prim.glass(ctx,5.6,5.6,hx('s7'),isLight?.07:.07); sheet.rotation.x=-Math.PI/2; root.add(sheet);
      const grid=CIN.prim.grid(ctx,5.6,14,hx('grid'),{opacity:isLight?.45:.28}); root.add(grid);
      const axes=[[1,0,0],[0,0,1],[0,1,0]].map((d,i)=>{ const t=tube(ctx,d.map(x=>-x*2.8),d.map(x=>x*2.8),hx('ink2'),.006,.35); root.add(t); return t; });
      const axl=[tslot(ctx,root),tslot(ctx,root),tslot(ctx,root)];
      const G={tea:hx(K16.tea),sport:hx(K16.sport),travel:hx(K16.travel)};
      const pts=SV_W.map((w,i)=>{ const c=G[SV_G[i]]; const d=CIN.prim.dot(ctx,[0,0,0],c,.075), h=haloSprite(ctx,c,.5), stem=liveTube(ctx,c,.006,.45), ray=liveTube(ctx,c,.005,isLight?.35:.28); d.material.emissiveIntensity=isLight?.2:.55; root.add(d,h,stem,ray); return {d,h,stem,ray,c}; });
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2.2,.006,8,160),new THREE.MeshBasicMaterial({color:hx('ink2'),transparent:true,opacity:isLight?.35:.25})); ring.rotation.x=Math.PI/2; root.add(ring);
      const shell=new THREE.Mesh(new THREE.SphereGeometry(2.2,40,28),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x9fb6ff,transparent:true,opacity:isLight?.12:.045,depthWrite:false})); root.add(shell);
      glabs=GROUPS.map(()=>({lab:tslot(ctx,root),lead:(()=>{ const t=liveTube(ctx,hx('ink2'),.005,.55); t.material.depthWrite=false; root.add(t); return t; })()}));
      hoverTips(ctx,box,()=>SV_W.map((w,i)=>({p:P3w(st.shown[i]),t:w,c:'var(--'+K16[SV_G[i]]+')'})));
      ctx.redraw=()=>{ const P=st.shown;
        sheet.visible=grid.visible=st.k>=2; axes[1].visible=st.k>=2; axes[2].visible=st.k>=3; ring.visible=st.k>=2; shell.visible=st.k>=3;
        pts.forEach((o,i)=>{ const p=P3w(P[i]); o.d.position.set(...p); o.h.position.copy(o.d.position);
          aimTube(THREE,o.stem,[p[0],0,p[2]],p); o.stem.visible=Math.abs(p[1])>.03; aimTube(THREE,o.ray,[0,0,0],p); });
        ctx.relabel(); lastCam=''; RR(ctx); };
      /* one label per topic, just beyond the cluster along its mean direction and joined to it by a thin leader line; the axis names are optional.
         The labels are laid out on the screen (layoutLabels) so they never collide or leave the stage — re-done whenever the camera moves */
      let lastCam='';
      ctx.relabel=()=>{ const P=st.shown;
        const means=GROUPS.map(g=>{ const idx=SV_W.map((_,i)=>i).filter(i=>SV_G[i]===g), m=[0,0,0]; idx.forEach(i=>{ const p=P3w(P[i]); m[0]+=p[0]/idx.length; m[1]+=p[1]/idx.length; m[2]+=p[2]/idx.length; }); return m; });
        const items=GROUPS.map((g,gi)=>{ const n=Math.hypot(...means[gi])||1; return {slot:glabs[gi].lab,anchor:means[gi].map(x=>x/n*2.75),text:GNAME[g],prio:0,gi,opts:{size:19,scale:.0082*LSc(box),color:colors[K16[g]],bg:true,weight:700}}; });
        ['direction 1','direction 2','direction 3'].forEach((t,i)=>{ if(i<st.k) items.push({slot:axl[i],anchor:i===0?[-2.9,0,0]:i===1?[0,0,-2.9]:[0,-2.9,0],text:t,prio:2,optional:true,opts:{size:17,scale:.0072*LSc(box),color:colors.muted,bg:false}}); else axl[i].set('',[0,0,0],{size:17,scale:.0072*LSc(box),color:colors.muted,bg:false}); });
        layoutLabels(ctx,items,{avoid:P.map(P3w)});
        items.forEach(it=>{ if(it.gi==null) return; const sp=it.slot.sp, lead=glabs[it.gi].lead; lead.visible=!!(sp&&sp.visible); if(lead.visible) aimTube(THREE,lead,means[it.gi],[sp.position.x,sp.position.y,sp.position.z]); }); };
      ctx.tick=()=>{ const q=ctx.camera.position, k=q.x.toFixed(3)+','+q.y.toFixed(3)+','+q.z.toFixed(3)+','+ctx.size.w; if(k!==lastCam){ lastCam=k; ctx.relabel(); return true; } return false; };
      ctx.redraw(); if(matchMedia('(hover:hover) and (pointer:fine)').matches) hint(box,'drag to orbit');
    }, update(ctx){ return ctx.tick?ctx.tick():false; } }); }
  S3=mountStage(box,build);
  let tw=null;
  function go(dur){ const from=st.shown.map(p=>p.slice()), to=target(); if(tw) tw.stop();
    tw=tween(dur||900,u=>{ st.shown=from.map((p,i)=>p.map((x,d)=>x+(to[i][d]-x)*u)); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); },()=>{ st.shown=to; if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); });
    readout(); drawBars(); }
  bindCtl('sv-k',v=>{ st.k=v; go(); },v=>String(v));
  tabs(document.getElementById('sv-mode'),t=>{ st.mode=t; go(1200); });
  document.getElementById('sv-play').addEventListener('click',()=>{ let k=1; st.k=1; setCtl('sv-k',1,v=>String(v)); go(500);
    const step=()=>{ k++; if(k>3) return; st.k=k; setCtl('sv-k',k,v=>String(v)); go(1100); setTimeout(step,1500); }; setTimeout(step,1300); });
  readout(); drawBars(); onTheme(drawBars); onResizeW(bars.parentNode,drawBars);
  U16['w-svd-words']={state(){ const m=model(); return {mode:st.mode,k:st.k,energy:m.energy[st.k-1],S:m.S.slice(),target:target(),shown:st.shown.map(p=>p.slice()),
      cos:{chai_coffee:kcos(0,1),chai_cricket:kcos(0,5),train_bus:kcos(11,12)},bars:[...bars.querySelectorAll('rect.sv')].map(r=>({s:+r.dataset.s,h:+r.getAttribute('height')})),
      labels:S3&&S3.handle&&ctxRef&&!ctxRef.dead?labelRects(ctxRef):null}; },
    set(o){ if(tw) tw.stop(); Object.assign(st,o); st.shown=target(); if(o.k) setCtl('sv-k',st.k,v=>String(v)); if(o.mode) document.querySelectorAll('#sv-mode button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===st.mode?'true':'false'));
      readout(); drawBars(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); }, kcos, RAW, PP};
})();

/* ---------- §7 · w-friends: friends of friends — the rebuilt table and the drink words in the plane of directions 1 and 3 ---------- */
(function(){
  const svg=document.getElementById('fr-svg'); if(!svg) return;
  const grid=document.getElementById('fr-grid'), read=document.getElementById('fr-read'); const st={k:2}; let geoF=null;
  const cosK=(i,j)=>cosSim(FR.coord(i,st.k),FR.coord(j,st.k));
  function drawGrid(){ const C=FR.rebuilt(st.k), mx=Math.max(...FR_M.flat());
    let h=`<table class="pmt"><caption>the table rebuilt from ${st.k} direction${st.k>1?'s':''} (${N(100*FR.energy(st.k),1)}% of the energy)</caption><thead><tr><th></th>`+FR_C.map(c=>`<th class="cl">${c}</th>`).join('')+'</tr></thead><tbody>';
    FR_W.forEach((w,i)=>{ h+=`<tr><th class="rw">${w}</th>`+FR_C.map((c,j)=>{ const x=Math.abs(C[i][j])<1e-9?0:C[i][j], fill=FR_M[i][j]===0&&x>.05;
      return `<td class="${x>.05?'pos':'zero'}${fill?' fill':''}" data-v="${x.toFixed(6)}" style="--h:${Math.min(1,Math.max(0,x)/mx).toFixed(3)}">${trim(F(x,2))}</td>`; }).join('')+'</tr>'; });
    grid.innerHTML=h+'</tbody></table>'; }
  function drawPlane(){ svg.setAttribute('viewBox','0 0 320 300'); svg.innerHTML=''; const k=svgK(svg,10), glow=glo(svg), K=Math.min(k,1.25);
    /* direction 1 → right, direction 3 → up (tea is + on direction 3); one scale for both axes so angles are exact */
    const X0=-.4,X1=6.4,Y0=-4.4,Y1=4.4, L=30,R=14,T=30,B=34, sc=Math.min((320-L-R)/(X1-X0),(300-T-B)/(Y1-Y0)), ox=L+(-X0)*sc, oy=T+Y1*sc;
    const px=v=>ox+v*sc, py=v=>oy-v*sc;
    for(let x=0;x<=6;x++) el('line',{x1:px(x),x2:px(x),y1:py(Y0),y2:py(Y1),stroke:'var(--grid)','stroke-width':1},svg);
    for(let y=-4;y<=4;y++) el('line',{x1:px(X0),x2:px(X1),y1:py(y),y2:py(y),stroke:'var(--grid)','stroke-width':1},svg);
    el('line',{x1:px(X0),x2:px(X1),y1:oy,y2:oy,stroke:'var(--axis)','stroke-width':1.4},svg);
    el('line',{x1:ox,x2:ox,y1:py(Y0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.4,'stroke-dasharray':st.k>=3?'':'4 4',opacity:st.k>=3?1:.5},svg);
    txt(svg,320-R,300-10,'direction 1 · drinks →',FT(700,9.5,K,'var(--ink-muted)'),'end');
    txt(svg,L-24,16,st.k>=3?'↑ direction 3 · chai vs tea':'↑ direction 3 · dropped at k = 2',FT(700,9.5,K,st.k>=3?'var(--ink-muted)':'var(--critical)'));
    const C={chai:cv(K16.gold),tea:cv('s5'),coffee:cv(K16.tea)}, pos={};
    ['coffee','chai','tea'].forEach(w=>{ const i=FR_W.indexOf(w), c=FR.coord(i,Math.max(st.k,3)); pos[w]=[c[0],st.k>=3?c[2]:0]; });
    /* when the arrows coincide (k = 2) they are drawn thick to thin so all three stay visible */
    [['coffee',5.2],['chai',3.6],['tea',2.2]].forEach(([w,wd])=>{ const [x,y]=pos[w]; garrow(svg,ox,oy,px(x),py(y),C[w],wd,!!glow); });
    const vs=w=>vecN(pos[w].map(v=>Math.abs(v)<1e-9?0:v),2);
    if(st.k>=3){ txt(svg,px(pos.tea[0])+8,py(pos.tea[1])+4,'tea '+vs('tea'),FT(800,10.5,K,C.tea)); txt(svg,px(pos.chai[0])+8,py(pos.chai[1])+4,'chai '+vs('chai'),FT(800,10.5,K,C.chai));
      txt(svg,px(pos.coffee[0]),oy-10,'coffee '+vs('coffee'),FT(800,10.5,K,C.coffee),'end'); }
    else { txt(svg,px(pos.coffee[0]),oy-12,'coffee (6, 0)',FT(800,10.5,K,C.coffee),'end'); txt(svg,px(2.2),oy+22,'chai and tea: both (4, 0)',FT(800,10.5,K,C.chai),'middle'); }
    const cct=cosK(0,1), ang=Math.acos(Math.max(-1,Math.min(1,cct)));
    if(st.k>=3){ const r=40, a0=Math.atan2(pos.chai[1],pos.chai[0]), a1=Math.atan2(pos.tea[1],pos.tea[0]);
      el('path',{d:`M${ox+r*Math.cos(a0)},${oy-r*Math.sin(a0)} A${r},${r} 0 0 0 ${ox+r*Math.cos(a1)},${oy-r*Math.sin(a1)}`,fill:'none',stroke:cv(K16.gold),'stroke-width':2},svg);
      txt(svg,ox+r+6,oy+4,N(ang*180/Math.PI,0)+'°',FT(800,10.5,K,cv(K16.gold))); }
    svg.dataset.k=st.k; geoF={ox,oy,sc,tips:Object.fromEntries(Object.entries(pos).map(([w,p])=>[w,[px(p[0]),py(p[1])]]))};
    read.innerHTML=`keep <b>${st.k}</b> of the singular values ${FR.S.slice(0,5).map(s=>N(s,3)).join(', ')}<br>cos(chai, tea) = <b>${N(cct,3)}</b> · cos(chai, coffee) = <b>${N(cosK(0,2),3)}</b><br>`+
      (st.k===2?'coffee joined them: the squeeze filled in chai–cup and chai–kettle':st.k===3?'direction 3 keeps what makes chai and tea different':'direction 4 only splits cricket from football'); }
  function all(){ drawGrid(); drawPlane(); }
  bindCtl('fr-k',v=>{ st.k=v; all(); },v=>String(v));
  all(); onTheme(drawPlane); onResizeW(svg.parentNode,drawPlane);
  U16['w-friends']={state(){ return {k:st.k,S:FR.S.slice(),energy:FR.energy(st.k),coords:FR_W.map((_,i)=>FR.coord(i,st.k)),cos:{chai_tea:cosK(0,1),chai_coffee:cosK(0,2),tea_coffee:cosK(1,2),cricket_football:cosK(3,4)},
      rebuilt:FR.rebuilt(st.k),filled:[...grid.querySelectorAll('td.fill')].length,geo:geoF,texts:textBoxes(svg)}; }, set(k){ st.k=k; setCtl('fr-k',k,v=>String(v)); all(); }};
})();
