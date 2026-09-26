/* ================= UNIT 18 · Act III widgets: w-shuffle, w-clocks, w-rope (§8), w-layernorm, w-block (§9) ================= */

/* ---------- §8 · w-shuffle: attention cannot see order ---------- */
(function(){
  const svg=document.getElementById('sh-svg'); if(!svg) return;
  const read=document.getElementById('sh-read');
  const E={dog:[2,0],bites:[1,1],man:[0,2]}, TAG=[[1,0],[0,0],[0,1]];
  const st={order:['dog','bites','man'],pos:false,slide:null};
  const outs=()=>{ const X=st.order.map((w,p)=>E[w].map((v,c)=>v+(st.pos?TAG[p][c]:0))); return attend(X,X,X).O; };
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 330':'0 0 760 300');
    const glow=glo(svg), F=fz(svg,13), Fs=fz(svg,10.5), O=outs(), W=narrow?400:760, cw=narrow?118:190, gap=(W-3*cw)/4;
    const colOf={dog:cv('s5'),bites:cv('s7'),man:cv('s6')};
    st.order.forEach((w,p)=>{ let x=gap+p*(cw+gap); if(st.slide&&st.slide[w]!=null){ const [from,u]=st.slide[w]; x=gap+(from+(p-from)*u)*(cw+gap); }
      el('rect',{x,y:18,width:cw,height:44,rx:10,fill:'color-mix(in srgb,'+colOf[w]+' 18%,transparent)',stroke:colOf[w],'stroke-width':1.6},svg);
      txt(svg,x+cw/2,40+F*.36,w,`font:800 ${F}px system-ui;fill:var(--ink)`,'middle');
      if(st.pos) txt(svg,x+cw-8,56,'tag '+vecN(TAG[p],0),`font:700 ${Fs}px system-ui;fill:var(--s4)`,'end');
      const ph=cw-20>150?150:cw-20, pn=panel(svg,x+10,80,cw-20,ph,-.2,3.2,-.2,3.2,{xs:1,ys:1,xt:false,yt:false});
      const o=O[p]; el('line',{x1:pn.px(0),y1:pn.py(0),x2:pn.px(o[0]),y2:pn.py(o[1]),stroke:colOf[w],'stroke-width':3.2,'stroke-linecap':'round',filter:glow||'none','data-role':'ans','data-w':w},svg);
      el('circle',{cx:pn.px(o[0]),cy:pn.py(o[1]),r:5,fill:colOf[w]},svg);
      txt(svg,x+cw/2,80+ph+F*1.4,vecN(o,3),`font:700 ${Fs}px system-ui;fill:var(--ink-2)`,'middle'); });
    read.innerHTML='order: <b>'+st.order.join(' ')+'</b> · position tags <b>'+(st.pos?'on':'off')+'</b><br>'+st.order.map((w,p)=>w+' → <b>'+vecN(O[p],3)+'</b>').join(' · ')+(st.pos?'':'<br>each word keeps its own answer wherever it stands');
    svg.dataset.state=st.order.join(' ')+'|'+(st.pos?1:0)+'|'+O[st.order.indexOf('dog')].map(v=>v.toFixed(3)).join(','); }
  function perm(){ const o=st.order.slice(); let nw; do{ nw=o.slice().sort(()=>Math.random()-.5); }while(nw.join()===o.join()); return nw; }
  let tw=null;
  function setOrder(nw){ if(tw) tw.stop(); const from={}; st.order.forEach((w,p)=>{ from[w]=p; }); st.order=nw; st.slide={}; nw.forEach(w=>{ st.slide[w]=[from[w],0]; });
    tw=tween(650,u=>{ nw.forEach(w=>{ st.slide[w][1]=u; }); draw(); },()=>{ st.slide=null; draw(); }); }
  document.getElementById('sh-shuffle').addEventListener('click',()=>setOrder(perm()));
  document.getElementById('sh-reset').addEventListener('click',()=>setOrder(['dog','bites','man']));
  document.getElementById('sh-pos').addEventListener('click',e=>{ st.pos=!st.pos; e.currentTarget.setAttribute('aria-pressed',st.pos); draw(); });
  relayout(svg,draw);
  U18.shuffle={st,draw,outs,setOrder,state(){ const O=outs(); return {order:st.order.slice(),pos:st.pos,out:Object.fromEntries(st.order.map((w,p)=>[w,O[p]]))}; }};
})();

/* ---------- §8 · w-clocks: position as a row of clocks, and the three ways compared ---------- */
(function(){
  const svg=document.getElementById('ck-svg'); if(!svg) return;
  const read=document.getElementById('ck-read'), box=svg.closest('.widget');
  const st={tab:'clocks',d:4,pos:1,k:1};
  const OM=()=>st.d===4?[1,.01]:[1,.1,.01,.001];                       /* ω_i = 1/10000^(2i/d) */
  const pe=(p,om)=>(om||OM()).flatMap(w=>[Math.sin(w*p),Math.cos(w*p)]);
  /* the compare view: toy "learned" rows (seeded random numbers standing in for a trained table of 16 positions), d = 4 clock tags, and rotary turns with θ = 30° */
  const LMAX=15, TH=30, PMAX=24;
  const LEARN=(function(){ const r=seeded(1811), rows=[]; for(let p=0;p<=LMAX;p++) rows.push([0,1,2,3].map(()=>.62*gauss2(r))); return rows; })();
  const series=k=>({learned:Array.from({length:LMAX-k+1},(_,p)=>dot(LEARN[p],LEARN[p+k])),
    sin:Array.from({length:PMAX+1},(_,p)=>dot(pe(p,[1,.01]),pe(p+k,[1,.01]))),
    rot:Array.from({length:PMAX+1},()=>Math.cos(k*TH*Math.PI/180))});
  let last=null;
  function drawClocks(narrow){ const om=OM(), nc=om.length; svg.setAttribute('viewBox',narrow?'0 0 400 '+(nc>2?580:440):'0 0 760 360');   /* the viewBox first: fz() reads it */
    const glow=glo(svg), F=fz(svg,11.5), Fs=fz(svg,10), v=pe(st.pos), cols=['s2','s5','s6','s3'];
    om.forEach((w,k)=>{ const two=nc===2, cx=narrow?(two?100+k*200:100+(k%2)*200):(two?190+k*380:95+k*190), cy=narrow?(two?95:95+Math.floor(k/2)*190):100, r=narrow?58:62, a=w*st.pos;
      el('circle',{cx,cy,r,fill:'color-mix(in srgb,var(--surface-2) 70%,transparent)',stroke:'var(--line)','stroke-width':1.5},svg);
      for(let t=0;t<12;t++){ const b=t/12*2*Math.PI; el('line',{x1:cx+Math.sin(b)*(r-6),y1:cy-Math.cos(b)*(r-6),x2:cx+Math.sin(b)*(r-1),y2:cy-Math.cos(b)*(r-1),stroke:'var(--ink-muted)','stroke-width':1.2},svg); }
      /* the hand: angle a from 12 o'clock, clockwise, so that sin is the sideways reach and cos the upward reach */
      glowLine(svg,cx,cy,cx+Math.sin(a)*(r-10),cy-Math.cos(a)*(r-10),cv(cols[k]),4,!!glow).setAttribute('data-role','hand');
      el('circle',{cx,cy,r:4.5,fill:cv(cols[k])},svg);
      txt(svg,cx,cy+r+F*(narrow?1.35:1.3),'speed '+w,`font:700 ${F}px system-ui;fill:${cv(cols[k])}`,'middle');
      if(narrow){ txt(svg,cx,cy+r+F*2.7,'sin '+FX(v[2*k],4),`font:600 ${Fs}px system-ui;fill:var(--ink-2)`,'middle'); txt(svg,cx,cy+r+F*3.95,'cos '+FX(v[2*k+1],4),`font:600 ${Fs}px system-ui;fill:var(--ink-2)`,'middle'); }
      else txt(svg,cx,cy+r+F*2.5,'sin '+FX(v[2*k],4)+' · cos '+FX(v[2*k+1],4),`font:600 ${Fs}px system-ui;fill:var(--ink-2)`,'middle'); });
    /* the strip: positions 0…63 across, d numbers down */
    const d=st.d, X0=narrow?80:92, Y0=narrow?(nc>2?446:306):228, WW=narrow?306:640, HH=narrow?(nc>2?112:96):112, cw=WW/64, ch=HH/d;
    for(let p=0;p<64;p++){ const e=pe(p); e.forEach((x,c)=>{ el('rect',{x:X0+p*cw,y:Y0+c*ch,width:cw+.3,height:ch+.3,fill:x>=0?cv(K18.w):cv(K18.k),opacity:(.08+.9*Math.abs(x)).toFixed(3)},svg); }); }
    el('rect',{x:X0+st.pos*cw-1,y:Y0-4,width:cw+2,height:HH+8,rx:2,fill:'none',stroke:'var(--ink)','stroke-width':1.8},svg);
    txt(svg,narrow?16:X0,Y0-10,narrow?'positions 0 → 63 · gold +, blue −':'tags of positions 0 → 63 (gold = +, blue = −)',`font:700 ${Fs}px system-ui;fill:var(--ink-muted)`);
    const names=om.flatMap(w=>['sin·'+w,'cos·'+w]);
    names.forEach((t,c)=>{ if(!narrow||d===4||c%2===0) txt(svg,X0-5,Y0+c*ch+ch/2+Fs*.35,narrow&&d>4?t.replace('sin·',''):t,`font:600 ${Math.min(Fs,ch*.9+2)}px system-ui;fill:var(--ink-muted)`,'end'); });
    const nb=dot(pe(st.pos),pe(st.pos+1));
    read.innerHTML='position <b>'+st.pos+'</b> → tag PE('+st.pos+') = <b>('+v.map(x=>FX(x,4)).join(', ')+')</b><br>PE('+st.pos+')·PE('+(st.pos+1)+') = <b style="color:var(--s4)">'+FX(nb,4)+'</b> — the same for every neighbouring pair';
    last={tab:'clocks',d,pos:st.pos,pe:v,nb,hands:[...svg.querySelectorAll('[data-role=hand] line:last-child')].map(l=>[+l.getAttribute('x2')-+l.getAttribute('x1'),+l.getAttribute('y1')-+l.getAttribute('y2')])};
    svg.dataset.state=st.pos+'|'+v.map(x=>x.toFixed(4)).join(','); }
  function drawCmp(narrow){ svg.setAttribute('viewBox',narrow?'0 0 400 470':'0 0 760 360');
    const glow=glo(svg), F=fz(svg,11.5), Fs=fz(svg,10), k=st.k, S=series(k);
    const P=narrow?{x:48,y:92,w:334,h:250}:{x:66,y:66,w:660,h:238}, Y0=-2.2, Y1=2.4;
    const pn=panel(svg,P.x,P.y,P.w,P.h,0,PMAX,Y0,Y1,{xs:4,ys:1});
    txt(svg,P.x+P.w,P.y+P.h+F*2.3,'first position of the pair, p',`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`,'end');
    txt(svg,P.x-4,P.y-8,'score between positions p and p + '+k,`font:600 ${Fs}px system-ui;fill:var(--ink-muted)`);
    const C={learned:cv('s7'),sin:cv('s6'),rot:cv('s3')};
    const path=a=>a.map((v,p)=>(p?'L':'M')+pn.px(p).toFixed(1)+','+pn.py(v).toFixed(1)).join('');
    glowPath(svg,path(S.learned),C.learned,2.4,!!glow).setAttribute('data-role','learned');
    S.learned.forEach((v,p)=>el('circle',{cx:pn.px(p),cy:pn.py(v),r:3,fill:C.learned},svg));
    glowPath(svg,path(S.sin),C.sin,2.8,!!glow).setAttribute('data-role','sin');
    glowPath(svg,path(S.rot),C.rot,2.8,!!glow,{'stroke-dasharray':'7 5'}).setAttribute('data-role','rot');
    /* the learned table ends at position 15 */
    const xe=pn.px(LMAX-k+.5); el('line',{x1:xe,y1:P.y,x2:xe,y2:P.y+P.h,stroke:C.learned,'stroke-width':1.4,'stroke-dasharray':'3 4',opacity:.8},svg);
    txt(svg,xe+5,P.y+P.h-8,narrow?'learned table ends':'the learned table has no row 16',`font:700 ${Fs}px system-ui;fill:${C.learned}`+HALO);
    /* legend, above the chart */
    const L=[['learned rows (toy random numbers)',C.learned,null],['clock tags, d = 4: '+N(S.sin[0],4)+' for every p',C.sin,null],['turns, θ = 30°: cos '+(k*TH)+'° = '+N(S.rot[0],3)+' for every p',C.rot,'7 5']];
    /* one legend item after another, by measured width; an item that would pass the right edge starts a new line */
    { let lx=P.x, ly=narrow?20:22; const right=(narrow?400:760)-8;
      L.forEach(([t,c,da])=>{ const tt=txt(svg,lx+24,ly,t,`font:700 ${Fs}px system-ui;fill:var(--ink-2)`), b=bboxOf(tt), w=b?b.w:t.length*Fs*.6;
        if(lx>P.x&&lx+24+w>right){ lx=P.x; ly+=F*1.45; tt.setAttribute('x',lx+24); tt.setAttribute('y',ly); }
        el('line',{x1:lx,y1:ly-F*.35,x2:lx+18,y2:ly-F*.35,stroke:c,'stroke-width':3,'stroke-dasharray':da||'none','data-role':'swatch'},svg); lx+=24+w+22; }); }
    const lo=Math.min(...S.learned), hi=Math.max(...S.learned);
    read.innerHTML='gap <b>k = '+k+'</b> · clock tags: PE(p)·PE(p+'+k+') = cos '+k+' + cos '+N(.01*k,2)+' = <b style="color:var(--s6)">'+N(S.sin[0],4)+'</b> for every p<br>turns: cos('+k+' × 30°) = <b style="color:var(--s3)">'+N(S.rot[0],3)+'</b> for every p · learned rows: anywhere from '+N(lo,2)+' to '+N(hi,2)+', and nothing past position '+LMAX;
    last={tab:'cmp',k,S};
    svg.dataset.state='cmp|'+k+'|'+S.sin[0].toFixed(4)+'|'+S.rot[0].toFixed(4); }
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); if(st.tab==='cmp') drawCmp(narrow); else drawClocks(narrow); }
  tabs(document.getElementById('ck-tab'),t=>{ st.tab=t; showTab(box,t); draw(); });
  tabs(document.getElementById('ck-d'),t=>{ st.d=+t; draw(); });
  bindCtl('ck-pos',v=>{ st.pos=v; draw(); },v=>String(v));
  bindCtl('ck-k',v=>{ st.k=v; draw(); },v=>String(v));
  relayout(svg,draw);
  U18.clocks={st,draw,pe,series,LMAX,set(o){ Object.assign(st,o); if(o.tab){ selTab(document.getElementById('ck-tab'),o.tab); showTab(box,o.tab); } if(o.d) selTab(document.getElementById('ck-d'),o.d); if(o.pos!=null) setCtl('ck-pos',o.pos,v=>String(v)); if(o.k!=null) setCtl('ck-k',o.k,v=>String(v)); draw(); },state(){ return last; }};
})();

/* ---------- §8 · w-rope: rotary positions on a glass clock (3-D) ---------- */
(function(){
  const box=document.getElementById('rp-3d'); if(!box||!CIN) return;
  const read=document.getElementById('rp-read');
  const st={m:3,n:1,th:30,many:false};
  const SPEEDS=[1,1/3,1/9];
  const score=(m,n)=>{ const ks=st.many?SPEEDS:[1]; return ks.map(s=>Math.cos((m-n)*st.th*s*Math.PI/180)); };
  let geo=null;
  function readout(){ const sc=score(st.m,st.n), tot=sc.reduce((a,b)=>a+b,0);
    read.innerHTML='query turned by m·θ = '+st.m+' × '+st.th+'° = <b style="color:var(--s2)">'+N(st.m*st.th,1)+'°</b><br>key turned by n·θ = '+st.n+' × '+st.th+'° = <b style="color:var(--s1)">'+N(st.n*st.th,1)+'°</b><br>gap m − n = <b>'+(st.m-st.n)+'</b> → angle between <b>'+N((st.m-st.n)*st.th,1)+'°</b><br>'+
      (st.many?'three clocks (speeds 1, ⅓, ⅑): '+SPEEDS.map(k=>'cos '+N(Math.abs((st.m-st.n)*st.th*k),1)+'°').join(' + ')+'<br>= '+sc.map(x=>N(x,3)).join(' + ')+' = <b style="color:var(--s4)">'+N(tot,3)+'</b>':'score q·k = cos '+N((st.m-st.n)*st.th,1)+'° = <b style="color:var(--s4)">'+N(tot,3)+'</b>');
    box.dataset.state=[st.m,st.n,st.th,st.many?1:0,tot.toFixed(4)].join(','); }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[0,4.3,4.4],look:[0,.05,.15],fov:38},orbit:true,autoRotate:0,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx), dark=!isLight; declutterOn(ctx);
      starfield(ctx,260,15); glassFloor(ctx,8,{div:32});
      const dials=[0,1,2].map(k=>{ const g=new THREE.Group(); g.position.y=.02+k*1.25; root.add(g);
        const disc=new THREE.Mesh(new THREE.CircleGeometry(1.55,64),new THREE.MeshStandardMaterial({color:dark?0x9fb4ff:0xffffff,transparent:true,opacity:dark?.08:.35,roughness:.1,side:THREE.DoubleSide,depthWrite:false})); disc.rotation.x=-Math.PI/2; g.add(disc);
        const rim=new THREE.Mesh(new THREE.TorusGeometry(1.55,.012,8,96),new THREE.MeshBasicMaterial({color:hx('ink2'),transparent:true,opacity:.4})); rim.rotation.x=Math.PI/2; g.add(rim);
        for(let t=0;t<12;t++){ const b=t/12*2*Math.PI, tk=liveTube(ctx,hx('ink2'),.008,.6); aimTube(THREE,tk,[Math.cos(b)*1.42,0,-Math.sin(b)*1.42],[Math.cos(b)*1.55,0,-Math.sin(b)*1.55]); g.add(tk); }
        const qa=CIN.prim.arrow(ctx,[0,.03,0],[1.3,.03,0],hx(K18.q),{radius:.04,head:.22}), ka=CIN.prim.arrow(ctx,[0,.05,0],[1.3,.05,0],hx(K18.k),{radius:.04,head:.22}); g.add(qa,ka);
        const arc=new THREE.Group(); g.add(arc); const lbl=slot(ctx,g); return {g,qa,ka,arc,lbl}; });
      const hudEl=hud(box); hint(box,'drag to orbit');
      ctx.redraw=(mm,nn)=>{ const m=mm==null?st.m:mm, n=nn==null?st.n:nn, V=THREE.Vector3; const g2={dials:[]};
        dials.forEach((D,k)=>{ const on=k===0||st.many; D.g.visible=on; if(!on) return; const s=st.many?SPEEDS[k]:1, aq=m*st.th*s*Math.PI/180, ak=n*st.th*s*Math.PI/180, P=a=>new V(Math.cos(a)*1.3,.04,-Math.sin(a)*1.3);
          D.qa.userData.set(new V(0,.04,0),P(aq)); D.ka.userData.set(new V(0,.06,0),P(ak)); g2.dials.push({aq,ak});
          clearGroup(D.arc); const a0=Math.min(aq,ak), a1=Math.max(aq,ak); if(a1-a0>1e-3){ const pts=[]; for(let t=0;t<=40;t++){ const a=a0+(a1-a0)*t/40; pts.push(new V(Math.cos(a)*.7,.05,-Math.sin(a)*.7)); }
            const tb=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.03,8,false),new THREE.MeshStandardMaterial({color:hx(K18.w),emissive:hx(K18.w),emissiveIntensity:dark?1:.3})); D.arc.add(tb); }
          /* one dial: the label sits in front of it; a stack of three: each label beside its own dial, so it never covers the dial above */
          const c=Math.cos((m-n)*st.th*s*Math.PI/180); D.lbl.set(st.many?'clock '+(k+1)+': '+N(c,3):'cos '+N(Math.abs((m-n)*st.th*s),1)+'° = '+N(c,3),st.many?[2.4,.08,.35]:[0,.55,1.75],{size:st.many?20:22,scale:.0105,color:colors.s4,bg:true}); });
        hudEl.innerHTML='query at <b>'+N(m,2)+'</b>, key at <b>'+N(n,2)+'</b> · gap <b>'+N(m-n,2)+'</b>';
        geo=g2; RR(ctx); };
      ctx.redraw();
    }}); }
  S3=mountStage(box,build); watchLayout(box,S3);
  const redraw=(m,n)=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(m,n); };
  bindCtl('rp-m',v=>{ st.m=v; redraw(); },v=>String(v)); bindCtl('rp-n',v=>{ st.n=v; redraw(); },v=>String(v));
  bindCtl('rp-th',v=>{ st.th=v; redraw(); },v=>v+'°');
  document.getElementById('rp-many').addEventListener('click',e=>{ st.many=!st.many; e.currentTarget.setAttribute('aria-pressed',st.many); const h=S3&&S3.handle; if(h){ const o=h.ctx.orbit; h.ctx.look.set(0,st.many?1.3:.05,st.many?0:.15); o.sph.radius=st.many?8.4:6.15; o.place(); } redraw(); });
  let tw=null; document.getElementById('rp-both').addEventListener('click',()=>{ if(tw) tw.stop(); if(st.m>=11||st.n>=11){ const k=Math.min(st.m,st.n); st.m-=k; st.n-=k; }
    const m0=st.m,n0=st.n; tw=tween(1400,u=>{ redraw(m0+u,n0+u); },()=>{ st.m=m0+1; st.n=n0+1; setCtl('rp-m',st.m,v=>String(v)); setCtl('rp-n',st.n,v=>String(v)); redraw(); }); });
  readout();
  U18.rope={st,redraw,score,state(){ const sc=score(st.m,st.n); return {m:st.m,n:st.n,th:st.th,many:st.many,scores:sc,total:sc.reduce((a,b)=>a+b,0),geo}; },labels(){ return stageRects(S3&&S3.handle&&S3.handle.ctx); },turn(a){ turnView(S3&&S3.handle&&S3.handle.ctx,a); }};
})();

/* ---------- §9 · w-layernorm: centre, then shrink to spread 1 ---------- */
(function(){
  const svg=document.getElementById('ln-svg'); if(!svg) return;
  const read=document.getElementById('ln-read');
  const st={x:[1,2,3,6],g:1,b:0};
  let last=null;
  function draw(){ svg.innerHTML=''; const narrow=narrowOf(svg); svg.setAttribute('viewBox',narrow?'0 0 400 640':'0 0 760 290');
    const glow=glo(svg), F=fz(svg,11.5), Fs=fz(svg,10);
    const x=st.x, m=x.reduce((a,c)=>a+c,0)/4, v=x.reduce((a,c)=>a+(c-m)**2,0)/4, sd=Math.sqrt(v), c=x.map(t=>t-m), y=layerNorm(x,st.g,st.b);
    const PAN=narrow?[[40,40],[40,250],[40,460]].map(([a,b])=>({x:a,y:b,w:340,h:150})):[[36,44],[292,44],[548,44]].map(([a,b])=>({x:a,y:b,w:196,h:200}));
    /* the mean goes in each panel's title, so no label ever sits on a bar */
    /* the result panel is ±3 unless γ and β push a bar past it: then it grows to the next whole number, so no bar is ever cut */
    const Y2=[Math.min(-3,Math.floor(Math.min(...y)-.25)),Math.max(3,Math.ceil(Math.max(...y)+.25))];
    const specs=[{t:'input x · dashed: mean '+N(m,3),v:x,Y:[-6,10],col:K18.tok,line:m},{t:'centred: x − mean · dashed: 0',v:c,Y:[-8,8],col:'s7',line:0},{t:'÷ spread, then × γ + β',v:y,Y:Y2,col:K18.v,line:null}];
    const drawn=[];
    specs.forEach((S,k)=>{ const P=PAN[k], pn=panel(svg,P.x,P.y,P.w,P.h,0,4,S.Y[0],S.Y[1],{ys:k===2?(S.Y[1]-S.Y[0]>(narrow?6:8)?2:1):(narrow?4:2),xt:false,title:S.t});   /* phone: fewer ticks, so they never touch */ const bw=P.w/4;
      if(S.line!=null) el('line',{x1:P.x,y1:pn.py(S.line),x2:P.x+P.w,y2:pn.py(S.line),stroke:cv(K18.w),'stroke-width':1.6,'stroke-dasharray':'6 4'},svg);
      if(k===2) [1,-1].forEach(u=>el('line',{x1:P.x,y1:pn.py(u*st.g+st.b),x2:P.x+P.w,y2:pn.py(u*st.g+st.b),stroke:cv(K18.v),'stroke-width':1,'stroke-dasharray':'3 4',opacity:.7},svg));
      S.v.forEach((val,i)=>{ const x0=P.x+i*bw+bw*.2, y0=pn.py(0), y1=pn.py(Math.max(S.Y[0],Math.min(S.Y[1],val)));
        el('rect',{x:x0,y:Math.min(y0,y1),width:bw*.6,height:Math.max(1.5,Math.abs(y1-y0)),rx:3,fill:cv(S.col),opacity:.9,filter:glow&&k===2?glow:'none','data-role':'bar','data-k':k,'data-i':i},svg);
        txt(svg,x0+bw*.3,(val>=0?Math.min(y0,y1)-5:Math.max(y0,y1)+F),N(val,3),`font:700 ${Fs}px system-ui;fill:var(--ink)`+HALO,'middle'); });
      drawn.push({k,zero:pn.py(0),unit:pn.py(0)-pn.py(1)});
      if(k<2) edge(svg,narrow?372:P.x+P.w+8,narrow?P.y+P.h+14:P.y+P.h/2,narrow?372:P.x+P.w+48,narrow?P.y+P.h+52:P.y+P.h/2,'var(--ink-muted)',1.6,null); });   /* phone: the arrow runs down the right edge, clear of the next title */
    read.innerHTML='mean <b>'+N(m,3)+'</b> · variance <b>'+N(v,3)+'</b> · spread √'+N(v,3)+' = <b>'+N(sd,3)+'</b><br>result <b>'+vecN(y,3)+'</b>'+(sd<1e-9?' (all equal: nothing to scale)':'');
    last={x:x.slice(),g:st.g,b:st.b,mean:m,variance:v,y,panels:drawn};
    svg.dataset.state=[x.join(' '),st.g,st.b,y.map(t=>t.toFixed(3)).join(' ')].join('|'); }
  [1,2,3,4].forEach(i=>bindCtl('ln-x'+i,v=>{ st.x[i-1]=v; draw(); },v=>N(v,1)));
  bindCtl('ln-g',v=>{ st.g=v; draw(); },v=>N(v,1)); bindCtl('ln-b',v=>{ st.b=v; draw(); },v=>N(v,1));
  relayout(svg,draw);
  U18.ln={st,draw,state(){ return Object.assign({},last,{bars:[...svg.querySelectorAll('[data-role=bar]')].map(r=>({k:+r.dataset.k,i:+r.dataset.i,y:+r.getAttribute('y'),h:+r.getAttribute('height')}))}); }};
})();

/* ---------- §9 · w-block: one page's ride through one block (3-D) ---------- */
const BLOCK=(function(){
  const x=[1,0,1,2], a=[0,2,2,4], s2=x.map((v,i)=>v+a[i]), s3=layerNorm(s2);
  const relu=v=>Math.max(0,v), pos=s3.map(relu), neg=s3.map(v=>relu(-v)), f=[0,1,2,3].map(i=>.5*(pos[i]+(i>0?neg[i-1]:0))), s5=s3.map((v,i)=>v+f[i]), s6=layerNorm(s5);
  return {S:[{n:'the page x',sh:'page x',v:x,k:'tok'},{n:'talk: attention writes',sh:'talk',v:a,k:'v'},{n:'add: x + attention',sh:'add',v:s2,k:'tok'},{n:'steady: layer norm',sh:'steady',v:s3,k:'tok'},{n:'think: the small network writes',sh:'think',v:f,k:'v'},{n:'add',sh:'add',v:s5,k:'tok'},{n:'steady → out',sh:'steady → out',v:s6,k:'tok'}]};
})();
(function(){
  const box=document.getElementById('bk-3d'); if(!box||!CIN) return;
  const read=document.getElementById('bk-read'), tbl=document.getElementById('bk-params');
  const S=BLOCK.S, H=.95, HS=.2, BAR=HS*2.2, st={lv:6,d:512};
  let geo=null;
  let rkey='';
  function readout(){ const key=Math.ceil(st.lv-1e-9)+'|'+Math.round(st.lv)+'|'+st.d; if(key===rkey) return; rkey=key;   /* the text changes only at a station: skip the rebuild in between */
    read.innerHTML=S.map((s,i)=>`<span style="opacity:${i<=Math.ceil(st.lv-1e-9)?1:.35}">${i===Math.round(st.lv)?'▶ ':''}${s.n}: <b style="color:${cv(K18[s.k])}">${vecN(s.v,3)}</b></span>`).join('<br>');
    box.dataset.state=Math.round(st.lv)+'|'+vecN(S[Math.round(st.lv)].v,3);
    const d=st.d, ff=4*d, rows=[['attention 4d²',4*d*d],['feed-forward 2·d·4d',2*d*ff],['weights only',4*d*d+2*d*ff],['+ biases (4d + 4d + d)',4*d*d+2*d*ff+4*d+ff+d],['+ two layer norms (4d)',4*d*d+2*d*ff+4*d+ff+d+4*d]];
    kv(tbl,rows.map(([k,v])=>[k+(k.startsWith('attention')?' · d = '+d:''),grp(v)])); }
  let S3=null;
  function build(){ return CIN.stage3d(box,{camera:{pos:[7.8,6.0,8.8],look:[-.3,3.0,0],fov:40},orbit:true,autoRotate:.08,autoRotateStopsOnUser:true,
    build(ctx){ const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx), dark=!isLight, NAR=box.clientWidth<560, LS=NAR?.0195:.0112; declutterOn(ctx);   /* phone: short floor names (the read-out has the long ones), big enough to read */
      starfield(ctx,260,16); glassFloor(ctx,7,{div:28});
      const floors=S.map((s,i)=>{ const g=new THREE.Group(); g.position.y=i*H; root.add(g);
        const slab=CIN.prim.glass(ctx,2.6,1.3,hx(i===1||i===4?'s3':i===3||i===6?'s6':'s1'),dark?.08:.16); slab.rotation.x=-Math.PI/2; g.add(slab);
        const fr=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.6,1.3)),new THREE.LineBasicMaterial({color:hx('ink2'),transparent:true,opacity:.3})); fr.rotation.x=-Math.PI/2; g.add(fr);
        /* the floor's name sits to the left of its slab, right-aligned to the slab's edge */
        const L=lab(ctx,NAR?s.sh:s.n,[0,.1,0],{size:22,scale:LS,color:i===1||i===4?colors.s3:colors.ink,bg:true}); L.position.x=-1.4-L.scale.x/2; g.add(L); return {g,slab}; });
      /* the residual lane: a copy jumps past attention (0 → 2) and past the small network (3 → 5) */
      const LX=1.75, lane=[[0,2],[3,5]].map(([a,b])=>{ const pts=[[.95,a*H+.05,0],[LX,a*H+.35,0],[LX,b*H-.35,0],[.95,b*H+.05,0]]; const g=polyTube(ctx,pts,hx(K18.w),.02,false); root.add(g); return {a,b,pts}; });
      root.add(lab(ctx,'residual lane',[LX+.2,1.0*H,0],{size:20,scale:LS,color:colors.s4,bg:true}));
      /* the travelling page: 4 bars, height = |value| × 0.44 */
      const bars=[0,1,2,3].map(i=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(.22,1,.22),new THREE.MeshStandardMaterial({color:hx('s1'),emissive:hx('s1'),emissiveIntensity:dark?.6:.2,roughness:.3})); root.add(m); return m; });
      const ghost=[0,1,2,3].map(()=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(.1,1,.1),new THREE.MeshStandardMaterial({color:hx(K18.w),emissive:hx(K18.w),emissiveIntensity:dark?.8:.25,transparent:true,opacity:.85})); root.add(m); return m; });
      const vals=slot(ctx,root);
      const hudEl=hud(box); hint(box,'drag to orbit');
      ctx.redraw=()=>{ const lv=st.lv, i0=Math.floor(Math.min(5.999,lv)), u=easeIO(lv-i0), A=S[i0].v, B=S[Math.min(6,i0+1)].v, y=lv*H;
        const v=A.map((a,k)=>a+(B[k]-a)*u), kk=S[Math.round(lv)].k; const g2={lv,v:v.slice(),bars:[]};
        bars.forEach((m,k)=>{ const h=Math.max(.01,Math.abs(v[k])*BAR); m.scale.y=h; m.position.set(-.6+k*.4,y+.02+(v[k]>=0?h/2:-h/2),0); const col=hx(K18[kk]); m.material.color.setHex(col); m.material.emissive.setHex(col); g2.bars.push({h,sign:v[k]>=0?1:-1}); });
        /* the numbers of the nearest station ride above the bars (they change 7 times a trip, not every frame) */
        vals.set(vecN(S[Math.round(lv)].v.map(t=>Math.round(t*1000)/1000),2),[0,y+1.35,0],{size:20,scale:LS*1.03,color:colors.ink,bg:true});
        /* the copy on the lane */
        let gl=null; lane.forEach(L=>{ if(lv>L.a+.02&&lv<L.b-.02) gl={L,t:(lv-L.a)/(L.b-L.a)}; });
        ghost.forEach((m,k)=>{ if(!gl){ m.visible=false; return; } m.visible=true; const P=gl.L.pts, seg=Math.min(2.999,gl.t*3), j=Math.floor(seg), f=seg-j, p=P[j].map((c,q)=>c+(P[j+1][q]-c)*f), val=S[gl.L.a].v[k], h=Math.max(.01,Math.abs(val)*HS*1.4);
          m.scale.y=h; m.position.set(p[0]+(k-1.5)*.12,p[1]+(val>=0?h/2:-h/2),p[2]); });
        floors.forEach((f,i)=>{ const on=Math.abs(i-lv)<.5; f.slab.material.opacity=(dark?.08:.16)*(on?2.6:1); });
        hudEl.innerHTML='station '+(Math.round(lv)+1)+' of 7 · <b>'+S[Math.round(lv)].n+'</b>';
        geo=g2; RR(ctx); };
      ctx.redraw();
    }}); }
  S3=mountStage(box,build);
  watchLayout(box,S3);
  const redraw=()=>{ readout(); if(S3&&S3.handle&&S3.handle.ctx.redraw) S3.handle.ctx.redraw(); };
  let tw=null; const stop=()=>{ if(tw){ tw.stop(); tw=null; } };
  let tgt=6;
  document.getElementById('bk-play').addEventListener('click',()=>{ stop(); st.lv=0; tgt=6; redraw(); tw=tween(6200,u=>{ st.lv=u*6; redraw(); },()=>{ st.lv=6; redraw(); }); });
  document.getElementById('bk-step').addEventListener('click',()=>{ stop(); tgt=tgt>=6?0:tgt+1; const from=st.lv, to=tgt; if(to===0){ st.lv=0; redraw(); return; } tw=tween(700,u=>{ st.lv=from+(to-from)*u; redraw(); },()=>{ st.lv=to; redraw(); }); });
  document.getElementById('bk-reset').addEventListener('click',()=>{ stop(); st.lv=0; tgt=0; redraw(); });
  tabs(document.getElementById('bk-d'),t=>{ st.d=+t; readout(); });
  readout();
  U18.block={st,redraw,S,BAR,state(){ return {lv:st.lv,d:st.d,geo}; },labels(){ return stageRects(S3&&S3.handle&&S3.handle.ctx); },turn(a){ turnView(S3&&S3.handle&&S3.handle.ctx,a); }};
})();
