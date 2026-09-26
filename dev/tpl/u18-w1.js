/* ================= UNIT 18 · Act I widgets: w-align (§1), w-lookup (§2) ================= */

/* ---------- §1 · w-align: the interpreter looks back ---------- */
(function(){
  const svg=document.getElementById('al-svg'); if(!svg) return;
  const read=document.getElementById('al-read'), stepBar=document.getElementById('al-step'), modeBar=document.getElementById('al-mode');
  const A=ALIGN, st={mode:'att',step:1,k:1,u:1}, v3=v=>'('+v.map(x=>F(x,3)).join(', ')+')';
  const calc=t=>{ const q=A.Q[t].map(v=>v*st.k), s=A.H.map(h=>dot(q,h)), w=softmax(s), c=[0,1,2].map(i=>w.reduce((a,x,j)=>a+x*A.H[j][i],0)); return {q,s,w,c}; };
  /* the picture's legend, in one place: beam width and opacity, map-cell opacity, context-bar height */
  const bw=w=>1.5+13*w, bo=w=>.25+.75*w, co=w=>.08+.92*w;
  const G=n=>n?{W:400,H:766,nx:[70,200,330],nw:104,ny:40,nh:66,dx:[52,148,252,348],dw:86,dy:292,dh:58,gx:120,gy:458,cw:80,rh:34,mt:410,cy0:626,cyb:726,cmax:64,cvx:200}
    :{W:760,H:400,nx:[80,196,312],nw:100,ny:40,nh:66,dx:[70,176,282,388],dw:88,dy:292,dh:58,gx:572,gy:66,cw:58,rh:36,mt:22,cy0:240,cyb:352,cmax:70,cvx:659};
  let narrow=false, lastRead='';
  function draw(){ svg.innerHTML=''; narrow=narrowOf(svg); const g=G(narrow); svg.setAttribute('viewBox',`0 0 ${g.W} ${g.H}`);
    const u=st.u, glow=u>=1?glo(svg):null, F=fz(svg,12.5), Fs=fz(svg,10.5), Fb=fz(svg,16), att=st.mode==='att';   /* glow filters only at rest: while the story plays, SVG filters are the costly part of a frame */
    const blue=cv(K18.k), gold=cv(K18.w), orange=cv(K18.q), cur=calc(st.step);
    const sec=(t,x,y,anc)=>txt(svg,x,y,t,`font:700 ${Fs}px system-ui;fill:var(--ink-muted);letter-spacing:.04em`,anc);
    sec(narrow?'ENGLISH NOTES · read left to right':'ENGLISH NOTES · the encoder read left to right',narrow?18:30,24);
    sec(narrow?'HINDI · written one word at a time':'HINDI · the decoder writes one word at a time',narrow?18:26,g.dy+g.dh+(narrow?24:30));
    /* ---- the encoder notes: a card each, with the note's three numbers as tiny bars ---- */
    const noteTop=g.ny, noteBot=g.ny+g.nh;
    A.EN.forEach((w,j)=>{ const cx=g.nx[j], x0=cx-g.nw/2;
      el('rect',{x:x0,y:noteTop,width:g.nw,height:g.nh,rx:12,fill:'color-mix(in srgb,'+blue+' 13%,transparent)',stroke:blue,'stroke-width':1.5},svg);
      txt(svg,cx,noteTop+20,w,`font:800 ${F}px system-ui;fill:var(--ink)`,'middle');
      A.H[j].forEach((v,i)=>{ const bx=cx-22+i*16, h=4+22*v; el('rect',{x:bx,y:noteBot-10-h,width:11,height:h,rx:2,fill:blue,opacity:v?.95:.35},svg); });
      if(j<2) edge(svg,x0+g.nw+3,noteTop+g.nh/2,g.nx[j+1]-g.nw/2-3,noteTop+g.nh/2,'var(--ink-muted)',1.3,null,.8); });
    /* ---- no attention: the relay's last note is the only thing the decoder gets ---- */
    let sumP=null;
    if(!att){ const sw=narrow?260:76, sh=narrow?52:g.nh, sx=narrow?200:446, sy=narrow?126:g.ny;
      el('rect',{x:sx-sw/2,y:sy,width:sw,height:sh,rx:12,fill:'color-mix(in srgb,var(--ink-muted) 16%,transparent)',stroke:'var(--ink-2)','stroke-width':1.6,'stroke-dasharray':'5 3'},svg);
      txt(svg,sx,sy+(narrow?20:26),'summary',`font:800 ${F}px system-ui;fill:var(--ink)`,'middle');
      txt(svg,sx,sy+(narrow?20+F*1.35:44),narrow?'one note for the whole sentence':'one note',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'middle');
      if(narrow) edge(svg,g.nx[2],noteBot+2,sx+sw/2-8,sy-2,'var(--ink-muted)',1.3,null,.8); else edge(svg,g.nx[2]+g.nw/2+3,noteTop+g.nh/2,sx-sw/2-3,noteTop+g.nh/2,'var(--ink-muted)',1.3,null,.8);
      sumP=[sx,sy+sh]; }
    /* ---- beams from the word being written back to the notes ---- */
    const bx=g.dx[st.step], by=g.dy;
    if(att){ cur.w.forEach((w,j)=>{ const x2=g.nx[j], y2=noteBot+2, d=`M${bx},${by} C${bx},${by-70} ${x2},${y2+70} ${x2},${y2}`;
        const p=el('path',{d,fill:'none',stroke:gold,'stroke-width':bw(w).toFixed(3),opacity:bo(w).toFixed(3),'stroke-linecap':'round',filter:glow&&w>.5?glow:'none','data-role':'beam','data-j':j},svg);
        if(u<1){ const L=p.getTotalLength?p.getTotalLength():400; p.setAttribute('stroke-dasharray',L); p.setAttribute('stroke-dashoffset',(L*(1-u)).toFixed(1)); }
        if(u>.55) txt(svg,x2+10,noteBot+(narrow?20:22),FX(w,3),`font:800 ${F}px system-ui;fill:${w>.5?'var(--s4)':'var(--ink-2)'}`+HALO,'start').setAttribute('data-role','wlab'); });
    } else { for(let t=0;t<=st.step;t++){ const x1=g.dx[t], d=`M${x1},${by} C${x1},${by-60} ${sumP[0]},${sumP[1]+60} ${sumP[0]},${sumP[1]+2}`;
        el('path',{d,fill:'none',stroke:'var(--ink-2)','stroke-width':t===st.step?5:2,opacity:t===st.step?.75:.3,'stroke-linecap':'round','data-role':'sumbeam'},svg); } }
    /* ---- the Hindi being written ---- */
    A.HI.forEach((w,t)=>{ const cx=g.dx[t], x0=cx-g.dw/2, done=t<st.step, now=t===st.step;
      el('rect',{x:x0,y:g.dy,width:g.dw,height:g.dh,rx:12,fill:now?'color-mix(in srgb,'+orange+' 20%,transparent)':done?'color-mix(in srgb,var(--surface-2) 80%,transparent)':'none',stroke:now?orange:'var(--ink-muted)','stroke-width':now?2:1.2,'stroke-dasharray':t>st.step?'5 4':'none',filter:now&&glow?glow:'none'},svg);
      if(t<=st.step){ txt(svg,cx,g.dy+25,w,dv(w,`font:800 ${Fb}px system-ui;fill:${now?'var(--s2)':'var(--ink)'}`),'middle'); txt(svg,cx,g.dy+46,A.TR[t],`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'middle'); }
      else txt(svg,cx,g.dy+36,'?',`font:700 ${Fb}px system-ui;fill:var(--ink-muted)`,'middle'); });
    /* ---- the alignment map ---- */
    const gx=g.gx, gy=g.gy, cw=g.cw, rh=g.rh;
    txt(svg,narrow?20:gx-60,g.mt,att?(narrow?'ALIGNMENT MAP · hand-made numbers':'ALIGNMENT MAP · hand-made'):'NO MAP',`font:700 ${Fs}px system-ui;fill:var(--ink-muted);letter-spacing:.04em`);
    A.EN.forEach((w,j)=>txt(svg,gx+(j+.5)*cw,gy-8,w,`font:700 ${Fs}px system-ui;fill:var(--s1)`,'middle'));
    A.HI.forEach((w,r)=>{ txt(svg,gx-8,gy+(r+.5)*rh+F*.36,w,dv(w,`font:700 ${F}px system-ui;fill:${r===st.step?'var(--s2)':'var(--ink-2)'}`),'end');
      const R=calc(r), f=r<st.step?1:r===st.step?clamp01((u-.35)/.65):0;
      R.w.forEach((w,c)=>{ const x=gx+c*cw, y=gy+r*rh, on=att&&f>0;
        const cell=el('rect',{x:x+1.5,y:y+1.5,width:cw-3,height:rh-3,rx:6,fill:on?gold:'var(--grid)',opacity:on?(co(w)*f).toFixed(3):.35,stroke:'var(--line)','data-role':'cell','data-r':r,'data-c':c,'data-t':on&&f>.5?FX(w,3):''},svg);
        if(on&&f>.5) txt(svg,x+cw/2,y+rh/2+Fs*.36,FX(w,3),`font:700 ${Fs}px system-ui;fill:${w>.55?'#1a1206':'var(--ink)'}`,'middle'); }); });
    if(att) el('rect',{x:gx-2,y:gy+st.step*rh,width:3*cw+4,height:rh,rx:7,fill:'none',stroke:orange,'stroke-width':2,filter:glow||'none'},svg);
    else { const mx=gx+1.5*cw, my=gy+2*rh; txt(svg,mx,my-6,'every word gets',`font:700 ${F}px system-ui;fill:var(--ink-2)`+HALO,'middle'); txt(svg,mx,my+F*1.1,'the same summary',`font:700 ${F}px system-ui;fill:var(--ink-2)`+HALO,'middle'); }
    /* ---- the context vector: the blend, drawn as three bars under the map's columns ---- */
    txt(svg,narrow?20:gx-60,g.cy0,att?'CONTEXT c = the blend of the notes':'CONTEXT = the summary, every time',`font:700 ${Fs}px system-ui;fill:var(--ink-muted);letter-spacing:.04em`);
    if(att){ cur.c.forEach((v,j)=>{ const x=gx+(j+.5)*cw, h=Math.max(1.5,g.cmax*v*u);
        el('rect',{x:x-cw*.28,y:g.cyb-h,width:cw*.56,height:h,rx:4,fill:blue,opacity:.9,filter:glow&&v>.5?glow:'none','data-role':'cbar','data-j':j},svg);
        if(u>.55) txt(svg,x,g.cyb-h-6,FX(v,3),`font:700 ${Fs}px system-ui;fill:var(--ink)`,'middle'); });
      el('line',{x1:gx,y1:g.cyb,x2:gx+3*cw,y2:g.cyb,stroke:'var(--axis)','stroke-width':1.2},svg);
      A.EN.forEach((w,j)=>txt(svg,gx+(j+.5)*cw,g.cyb+(narrow?16:15),w,`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'middle')); }
    /* ---- readout ---- */
    const t=st.step, rk=[st.mode,t,st.k].join('|');
    if(rk!==lastRead){ lastRead=rk; read.innerHTML=att?'writing <b style="color:var(--s2)">'+A.HI[t]+'</b> ('+A.TR[t]+', “'+A.GL[t]+'”) · decoder state q = '+vecN(A.Q[t],2)+(st.k!==1?' × '+N(st.k,2)+' = '+vecN(cur.q,2):'')+'<br>scores q·h = '+vecN(cur.s,3)+' → shares <b style="color:var(--s4)">'+v3(cur.w)+'</b><br>context c = '+cur.w.map((w,j)=>FX(w,3)+'·h<sub>'+A.EN[j]+'</sub>').join(' + ')+' = <b>'+v3(cur.c)+'</b> · it looks most at <b>'+A.EN[cur.w.indexOf(Math.max(...cur.w))]+'</b>'
      :'No attention (Unit 17) · the decoder writes all four words from <b>one summary</b>. Every word gets the same few numbers, and a 50-word sentence would have to fit into the same few numbers too — that is the bottleneck.'; }
    svg.dataset.state=[st.mode,t,N(st.k,2),cur.w.map(x=>x.toFixed(3)).join(' ')].join('|'); }
  /* ---- the story: write the four words one after another ---- */
  let chain=null; const stop=()=>{ if(chain){ chain.dead=true; if(chain.tw) chain.tw.stop(); clearTimeout(chain.to); chain=null; } };
  /* off screen, the story keeps its clock but draws nothing; it catches up the moment it is seen again */
  let seen=true;
  if('IntersectionObserver' in window) new IntersectionObserver(es=>es.forEach(e=>{ seen=e.isIntersecting; if(seen&&chain) draw(); }),{rootMargin:'120px 0px'}).observe(svg);
  function play(){ stop(); const me=chain={dead:false,tw:null,to:0};
    const go=t=>{ if(me.dead) return; st.step=t; st.u=0; selTab(stepBar,t); draw();
      me.tw=tween(1150,u=>{ if(me.dead) return; st.u=u; if(seen) draw(); },()=>{ if(me.dead) return; st.u=1; draw(); if(t<3) me.to=setTimeout(()=>go(t+1),RM?0:380); else chain=null; }); };
    go(0); }
  document.getElementById('al-play').addEventListener('click',play);
  tabs(modeBar,t=>{ stop(); st.mode=t; st.u=1; draw(); });
  tabs(stepBar,t=>{ stop(); st.step=+t; st.u=1; draw(); });
  bindCtl('al-k',v=>{ stop(); st.k=v; st.u=1; draw(); },v=>N(v,1));
  relayout(svg,()=>draw());
  U18.align={st,draw,calc,play,stop,legend:{bw,bo,co},
    state(){ const q=s=>[...svg.querySelectorAll(s)];
      return {mode:st.mode,step:st.step,k:st.k,u:st.u,cur:calc(st.step),rows:[0,1,2,3].map(calc),
        beams:q('[data-role=beam]').map(p=>({j:+p.dataset.j,w:+p.getAttribute('stroke-width'),o:+p.getAttribute('opacity')})),
        sumBeams:q('[data-role=sumbeam]').length,
        cells:q('[data-role=cell]').map(r=>({r:+r.dataset.r,c:+r.dataset.c,o:+r.getAttribute('opacity'),t:r.dataset.t})),
        bars:q('[data-role=cbar]').map(r=>({j:+r.dataset.j,h:+r.getAttribute('height')})),cmax:G(narrow).cmax}; }};
})();

/* ---------- §2 · w-lookup: the strict shopkeeper and the kind one ---------- */
(function(){
  const svg=document.getElementById('lk-svg'); if(!svg) return;
  const read=document.getElementById('lk-read');
  const D=[{n:'masala chai',k:[1,1],c:'#c68642',p:10},{n:'black coffee',k:[-.5,1.3],c:'#4a2c1a',p:20},{n:'lassi',k:[1.3,-.7],c:'#f1ead6',p:30},{n:'lemon tea',k:[-1,-.5],c:'#e9c046',p:15}];
  const st={q:[1.5,1],beta:1,mode:'soft'};
  const mixHex=(w)=>{ const rgb=D.map(d=>[1,3,5].map(o=>parseInt(d.c.slice(o,o+2),16))); const m=[0,1,2].map(c=>Math.round(rgb.reduce((s,r,i)=>s+w[i]*r[c],0))); return '#'+m.map(v=>v.toString(16).padStart(2,'0')).join(''); };
  function shares(){ const s=D.map(d=>st.beta*dot(st.q,d.k)); if(st.mode==='hard'){ const b=s.indexOf(Math.max(...s)); return {s,w:s.map((_,i)=>i===b?1:0)}; } return {s,w:softmax(s)}; }
  const halo=w=>8+46*Math.sqrt(w);
  let narrow=false, map=null, BW=0;
  function draw(){ svg.innerHTML=''; narrow=narrowOf(svg);
    svg.setAttribute('viewBox',narrow?'0 0 400 760':'0 0 640 380');
    const glow=glo(svg), F=fz(svg,12), Fs=fz(svg,10.5);
    const MX=narrow?[20,380]:[16,366], MY=narrow?[16,376]:[12,368], R=2.2;
    const px=x=>MX[0]+(x+R)/(2*R)*(MX[1]-MX[0]), py=y=>MY[1]-(y+R)/(2*R)*(MY[1]-MY[0]);
    map={px,py,ix:X=>(X-MX[0])/(MX[1]-MX[0])*2*R-R,iy:Y=>(MY[1]-Y)/(MY[1]-MY[0])*2*R-R};
    const g=el('g',{},svg);
    el('rect',{x:MX[0],y:MY[0],width:MX[1]-MX[0],height:MY[1]-MY[0],rx:10,fill:'none',stroke:'var(--line)'},g);
    for(let v=-2;v<=2;v++){ el('line',{x1:px(v),y1:MY[0],x2:px(v),y2:MY[1],stroke:'var(--grid)','stroke-width':1},g); el('line',{x1:MX[0],y1:py(v),x2:MX[1],y2:py(v),stroke:'var(--grid)','stroke-width':1},g); }
    el('line',{x1:MX[0],y1:py(0),x2:MX[1],y2:py(0),stroke:'var(--axis)','stroke-width':1.3},g); el('line',{x1:px(0),y1:MY[0],x2:px(0),y2:MY[1],stroke:'var(--axis)','stroke-width':1.3},g);
    const obst=[];
    obst.push(bboxOf(txt(svg,MX[1]-6,py(0)-6,'more milky →',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`+HALO,'end')));
    obst.push(bboxOf(txt(svg,px(0)+6,MY[0]+F+2,'↑ more strong',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`+HALO)));
    const {s,w}=shares(), P={px,py,svg,glow};
    D.forEach((d,i)=>{ const [x,y]=d.k; if(w[i]>.004) el('circle',{cx:px(x),cy:py(y),r:halo(w[i]).toFixed(2),fill:cv(K18.w),opacity:(.10+.30*w[i]).toFixed(3),'data-role':'halo','data-i':i},g);
      arrow(P,0,0,x,y,cv(K18.k),2.4); });
    arrow(P,0,0,st.q[0],st.q[1],cv(K18.q),3.4);
    D.forEach((d,i)=>{ const [x,y]=d.k; el('circle',{cx:px(x),cy:py(y),r:9,fill:d.c,stroke:'var(--ink-2)','stroke-width':1.2},svg); obst.push(circBox(px(x),py(y),11)); });
    /* each drink's name and price above (or below) its dot, with a halo so it reads over the glow */
    const mapBox={x:MX[0]+2,y:MY[0]+2,w:MX[1]-MX[0]-4,h:MY[1]-MY[0]-4};
    D.forEach((d,i)=>{ const [x,y]=d.k, X=px(x), Y=py(y), gapL=F*1.3, up=[X,Y-16-gapL,'middle'], down=[X,Y+18+F*.8,'middle'];
      placeLines(svg,[...(y>=0?[up,down]:[down,up]),[X+16,Y-gapL*.5+F*.35,'start'],[X-16,Y-gapL*.5+F*.35,'end']],
        [{s:d.n,style:`font:700 ${F}px system-ui;fill:var(--ink)`+HALO},{s:'₹'+d.p+' · score '+N(s[i],2),style:`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`+HALO,dy:gapL}],obst,1,mapBox); });
    /* the query's own label "q": the first free spot around the arrow tip */
    { const qx=px(st.q[0]), qy=py(st.q[1]), L=Math.hypot(qx-px(0),qy-py(0))||1, ux=(qx-px(0))/L, uy=(qy-py(0))/L, o=16;
      const cands=[[qx+ux*o,qy+uy*o+F*.35,ux>=0?'start':'end'],[qx-uy*o,qy+ux*o+F*.35,'middle'],[qx+uy*o,qy-ux*o+F*.35,'middle'],[qx+14,qy-12,'start'],[qx-14,qy-12,'end'],[qx+14,qy+22,'start'],[qx-14,qy+22,'end'],
        [Math.min(qx+12,MX[1]-6),qy+F*2.2,'end'],[Math.max(qx-12,MX[0]+6),qy+F*2.2,'start'],[qx,qy+F*2.4,'middle'],[qx,qy-F*1.6,'middle']];
      const box=mapBox, sty=`font:800 ${F}px system-ui;fill:var(--s2)`+HALO, keep=obst.length;
      let ql=placeLabel(svg,cands,'q · your wish',sty,obst,1,box);
      if(!ql._free){ ql.remove(); obst.length=keep; ql=placeLabel(svg,cands,'q',sty,obst,1,box); }   /* no room for the words: the letter alone (the caption says what q is) */
      ql.setAttribute('data-role','qlab'); }
    el('circle',{cx:px(st.q[0]),cy:py(st.q[1]),r:13,fill:cv(K18.q),opacity:.18,style:'cursor:grab'},svg);
    /* the shares: names in their own column, bars beside them */
    const NX=narrow?24:384, BX=narrow?130:474, BY=narrow?418:44; BW=narrow?190:108; const bh=narrow?26:28;
    txt(svg,NX,BY-12,st.mode==='soft'?'SHARES (softmax)':'THE ONE BEST MATCH',`font:700 ${Fs}px system-ui;fill:var(--ink-muted);letter-spacing:.04em`);
    D.forEach((d,i)=>{ const y=BY+i*(bh+10);
      txt(svg,NX,y+bh/2+F*.36,d.n,`font:600 ${F}px system-ui;fill:var(--ink)`);
      el('rect',{x:BX,y,width:BW,height:bh,rx:6,fill:'var(--grid)',opacity:.45},svg);
      el('rect',{x:BX,y,width:Math.max(1.5,BW*w[i]),height:bh,rx:6,fill:cv(K18.w),opacity:.92,filter:glow&&w[i]>.3?glow:'none','data-role':'bar','data-i':i},svg);
      txt(svg,BX+BW+6,y+bh/2+F*.36,N(w[i],3),`font:700 ${F}px system-ui;fill:var(--s4)`); });
    const price=w.reduce((a,x,i)=>a+x*D[i].p,0), mix=mixHex(w);
    const CX=narrow?200:500, CY=narrow?598:220, cw=narrow?84:96, chh=narrow?100:104;
    el('path',{d:`M${CX-cw/2},${CY} L${CX+cw/2},${CY} L${CX+cw/2-12},${CY+chh} L${CX-cw/2+12},${CY+chh} Z`,fill:mix,stroke:'var(--ink-2)','stroke-width':2,'data-role':'cup'},svg);
    el('path',{d:`M${CX+cw/2-2},${CY+22} q26,6 18,34 q-6,16 -24,12`,fill:'none',stroke:'var(--ink-2)','stroke-width':3},svg);
    el('ellipse',{cx:CX,cy:CY,rx:cw/2,ry:7,fill:mix,stroke:'var(--ink-2)','stroke-width':1.5},svg);
    txt(svg,CX,CY+chh+F*1.6,'your cup: ₹'+N(price,2),`font:800 ${fz(svg,14)}px system-ui;fill:var(--ink)`,'middle');
    read.innerHTML=(st.mode==='soft'?'Kind (attention) · ':'Strict (dictionary) · ')+'scores = pickiness × (wish · key)<br>'+D.map((d,i)=>d.n+' <b>'+N(w[i],3)+'</b>').join(' · ')+'<br>price of your cup: <b>₹'+N(price,2)+'</b>';
    svg.dataset.state=[st.mode,N(st.q[0],2),N(st.q[1],2),N(st.beta,2),N(price,2)].join(','); }
  svgDrag(svg,(x,y)=>{ if(!map) return false; const X=map.px(st.q[0]),Y=map.py(st.q[1]); if(Math.hypot(x-X,y-Y)>40) return false; },(x,y)=>{ const cl2=v=>Math.max(-2,Math.min(2,Math.round(v*20)/20)); st.q=[cl2(map.ix(x)),cl2(map.iy(y))]; setCtl('lk-qx',st.q[0],v=>N(v,2)); setCtl('lk-qy',st.q[1],v=>N(v,2)); draw(); });
  bindCtl('lk-qx',v=>{ st.q[0]=v; draw(); },v=>N(v,2)); bindCtl('lk-qy',v=>{ st.q[1]=v; draw(); },v=>N(v,2));
  bindCtl('lk-s',v=>{ st.beta=v; draw(); },v=>N(v,1));
  tabs(document.getElementById('lk-mode'),t=>{ st.mode=t; draw(); });
  relayout(svg,draw);
  U18.lookup={st,draw,shares,D,
    state(){ const {s,w}=shares(); return {mode:st.mode,q:st.q.slice(),beta:st.beta,scores:s,shares:w,price:w.reduce((a,x,i)=>a+x*D[i].p,0),cup:mixHex(w),BW,
      bars:[...svg.querySelectorAll('[data-role=bar]')].map(r=>({i:+r.dataset.i,w:+r.getAttribute('width')})),
      q2px:map?[map.px(st.q[0]),map.py(st.q[1])]:null}; }};
})();
