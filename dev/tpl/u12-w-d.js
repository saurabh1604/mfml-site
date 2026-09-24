/* ================= UNIT 12 · widgets, part D: §12–§15 ================= */

/* ================= W13 · THE HOWL: POWER ITERATION (2-D angle; 3-D sphere) ================= */
(function(){
  const box=document.getElementById('w-power'); if(!box) return;
  const svg=document.getElementById('pw-svg'), lg=document.getElementById('pw-log'), read=document.getElementById('pw-read'), stage=document.getElementById('pw-3d');
  let r=1/9, start=0, xs=[], anim=null, tab='two';
  const Cof=()=>{ const l1=9, l2=9*r, c=Math.SQRT1_2; return [[(l1+l2)/2,(l1-l2)/2],[(l1-l2)/2,(l1+l2)/2]]; };   /* top direction at 45°; r = 1/9 gives [[5,4],[4,5]] */
  const W1=[Math.SQRT1_2,Math.SQRT1_2];
  const angTo=x=>{ const c=Math.abs(dot(x,W1)); return Math.acos(Math.min(1,c))/DEG; };
  const reset=()=>{ const t=start*DEG; xs=[[Math.cos(t),Math.sin(t)]]; };
  const step=()=>{ const C=Cof(), x=xs[xs.length-1], y=matVec(C,x); xs.push(unit(y)); };
  const nMax=()=>Math.max(8,Math.min(60,Math.ceil(Math.log(1e-4)/Math.log(Math.max(r,1e-3)))+1));
  function draw(){ const C=Cof(), k=xs.length-1, x=xs[k];
    const P=eqFrame(svg,1.45,{step:.5}); const {px,py,glow:gl}=P;
    /* the ellipse C·circle, scaled so its long axis has length 1 */
    let d=''; for(let i=0;i<=90;i++){ const a=i/90*2*Math.PI, v=matVec(C,[Math.cos(a),Math.sin(a)]); d+=(i?'L':'M')+px(v[0]/9).toFixed(1)+' '+py(v[1]/9).toFixed(1); }
    el('path',{d:d+'Z',fill:'color-mix(in srgb,var(--s2) 8%,transparent)',stroke:'var(--s2)','stroke-width':1.1,opacity:.7},P.layer);
    el('circle',{cx:px(0),cy:py(0),r:P.s,fill:'none',stroke:'var(--ink-muted)','stroke-width':1,'stroke-dasharray':'3 4'},P.layer);
    glowLine(P.layer,px(-W1[0]*1.4),py(-W1[1]*1.4),px(W1[0]*1.4),py(W1[1]*1.4),'var(--s2)',1.8,gl);
    txt(svg,px(W1[0]*1.25)+6,py(W1[1]*1.25),'w₁','font:800 13px system-ui;fill:var(--s2)');
    /* ghosts of earlier passes */
    xs.forEach((v,i)=>{ if(i===k) return; const o=.12+.5*(i/(k||1)); svgArrow(svg,px(0),py(0),px(v[0]),py(v[1]),'var(--ink-2)',1.6,null,o); el('circle',{cx:px(v[0]),cy:py(v[1]),r:3,fill:'var(--s4)',opacity:o+.2},svg); });
    for(let i=1;i<=k;i++){ const a=xs[i-1], b=xs[i]; el('path',{d:`M${px(a[0])} ${py(a[1])} A${P.s} ${P.s} 0 0 ${a[0]*b[1]-a[1]*b[0]>0?0:1} ${px(b[0])} ${py(b[1])}`,fill:'none',stroke:'var(--s4)','stroke-width':2,opacity:.6},svg); }
    if(k>0){ const prev=xs[k-1], y=matVec(C,prev); svgArrow(svg,px(0),py(0),px(y[0]/9),py(y[1]/9),'var(--s2)',1.8,null,.55); }
    svgArrow(svg,px(0),py(0),px(x[0]),py(x[1]),'var(--ink)',3,gl);
    txt(svg,px(x[0]*1.1),py(x[1]*1.1)+(x[1]<0?14:-4),'x'+SUB(k),'font:800 12px system-ui;fill:var(--ink)','middle');
    /* the log-angle chart */
    const N=nMax(), th0=angTo(xs[0]);
    const f=frame(lg,0,N,-4,2,{r:10,t:22,b:30,xs:N>20?10:(N>10?2:1),ys:1,yf:v=>({'-4':'0.0001°','-3':'0.001°','-2':'0.01°','-1':'0.1°','0':'1°','1':'10°','2':'100°'})[String(v)]||'',l:52,axes:false});
    let dp=''; for(let i=0;i<=N;i++){ const a=Math.atan(Math.tan(th0*DEG)*Math.pow(r,i))/DEG; const y=Math.log10(Math.max(a,1e-4)); dp+=(i?'L':'M')+f.px(i).toFixed(1)+' '+f.py(Math.max(-4,y)).toFixed(1); }
    el('path',{d:dp,fill:'none',stroke:'var(--s7)','stroke-width':1.4,'stroke-dasharray':'5 4',opacity:.85},lg);
    xs.forEach((v,i)=>{ if(i>N) return; const a=angTo(v); glowDot(lg,f.px(i),f.py(Math.max(-4,Math.log10(Math.max(a,1e-4)))),4,'var(--s4)',i===k?f.glow:null); });
    txt(lg,f.L,14,'angle to w₁ after each pass (log scale)','font:700 11px system-ui;fill:var(--ink-muted)');
    txt(lg,f.px(N)-4,f.H-f.B-6,'slope: ×'+F(r,3)+' per pass','font:700 10.5px system-ui;fill:var(--s7)','end');
    txt(lg,f.px(N/2),f.H-4,'pass k','font:600 10px system-ui;fill:var(--ink-muted)','middle');
    const lam=dot(x,matVec(C,x));
    if(tab==='two') read.innerHTML='C = [['+F(C[0][0],3)+', '+F(C[0][1],3)+'], ['+F(C[1][0],3)+', '+F(C[1][1],3)+']] · λ₁ = 9, λ₂ = '+F(9*r,3)+' · ratio <b>'+F(r,3)+'</b>'+
      '<br>pass <b>'+k+'</b>: x'+SUB(k)+' = (<b>'+F(x[0],4)+'</b>, <b>'+F(x[1],4)+'</b>) · angle to w₁ <b>'+(angTo(x)<1e-3?'< 0.001':F(angTo(x),3))+'°</b> · estimate xᵀCx = <b>'+F(lam,4)+'</b>'; }
  bindCtl('pw-ratio',v=>{ r=v; reset(); draw(); },v=>F(v,3));
  bindCtl('pw-start',v=>{ start=v; reset(); draw(); },v=>v+'°');
  document.getElementById('pw-step').addEventListener('click',()=>{ if(anim){ anim.stop(); anim=null; } if(xs.length<=nMax()){ step(); draw(); } });
  document.getElementById('pw-reset').addEventListener('click',()=>{ if(anim){ anim.stop(); anim=null; } reset(); draw(); });
  document.getElementById('pw-play').addEventListener('click',()=>{ if(anim){ anim.stop(); anim=null; } reset(); draw(); const N=nMax();
    if(RM){ while(xs.length<=N) step(); draw(); return; }
    let dead=false; anim={stop(){ dead=true; }}; const tick=()=>{ if(dead) return; if(xs.length>N){ anim=null; return; } step(); draw(); setTimeout(tick,N>20?140:420); }; setTimeout(tick,300); });
  reset(); draw();
  /* ---- the 3-D loop on a sphere ---- */
  const L3=[6,3,1], e1=unit([1,.45,-.3]), e2=unit((()=>{ const t=[-.3,1,.4]; const d=dot(t,e1); return t.map((v,i)=>v-d*e1[i]); })()), e3=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
  const C3=fromEig(L3,[e1,e2,e3]); let seed=5, ys=[], sc=null, anim3=null;
  const reset3=()=>{ const rr=rng(seed); let v; do{ v=[gauss(rr),gauss(rr),gauss(rr)]; }while(Math.abs(dot(unit(v),e1))>.35); ys=[unit(v)]; };
  const step3=()=>{ ys.push(unit(matVec(C3,ys[ys.length-1]))); };
  function build(){ sc=null;
    const handle=CIN.stage3d(stage,{fill:true,camera:{pos:[2.6,1.8,3.2],look:[0,0,0],fov:38},autoRotate:.12,autoRotateStopsOnUser:true,
      build(ctx){ const {THREE,root,isLight}=ctx, hx=hxOf(ctx);
        const sph=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),new THREE.MeshBasicMaterial({color:hx('ink2'),wireframe:true,transparent:true,opacity:isLight?.1:.08})); root.add(sph);
        /* the ellipsoid C·sphere, scaled so its long axis is 1 */
        const el3=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.MeshStandardMaterial({color:hx('s2'),transparent:true,opacity:isLight?.16:.14,roughness:.3,emissive:hx('s2'),emissiveIntensity:isLight?.05:.2,depthWrite:false}));
        const M=new THREE.Matrix4().makeBasis(new THREE.Vector3(...e1),new THREE.Vector3(...e2),new THREE.Vector3(...e3)); el3.quaternion.setFromRotationMatrix(M); el3.scale.set(1,L3[1]/L3[0],L3[2]/L3[0]); root.add(el3);
        [e1,e2,e3].forEach((e,i)=>{ const rd=rod(ctx,hx(PCC[i]),.012); rd.userData.set(e,[1.25,.9,.75][i],.9); root.add(rd); });
        const trail=new THREE.Group(), arrowG=new THREE.Group(); root.add(trail,arrowG);
        sc={ctx,trail,arrowG,hx}; hint(stage,'drag to orbit'); paint3(); },
      update(){ return false; } });
    if(handle&&sc) sc.handle=handle; return handle; }
  function paint3(){ const k=ys.length-1, x=ys[k], ang=Math.acos(Math.min(1,Math.abs(dot(x,e1))))/DEG, lam=dot(x,matVec(C3,x));
    if(sc){ const {ctx,trail,arrowG,hx}=sc; clearGroup(trail); clearGroup(arrowG);
      ys.forEach((v,i)=>{ trail.add(overlay(CIN.prim.dot(ctx,v,hx('s4'),i===k?.05:.032),9)); if(i>0){ const a=ys[i-1], pts=[]; for(let t=0;t<=16;t++){ const u=t/16, q=unit(a.map((c,j)=>c*(1-u)+v[j]*u)); pts.push(q); } trail.add(overlay(ribbon(ctx,pts,hx('s4'),.008),8)); } });
      arrowG.add(overlay(CIN.prim.arrow(ctx,[0,0,0],x,hx('ink'),{radius:.018,head:.12}),10)); RR(ctx); }
    if(tab==='three') read.innerHTML='3 × 3 matrix with eigenvalues 6, 3, 1 · pass <b>'+k+'</b> · angle to w₁ <b>'+(ang<1e-3?'< 0.001':F(ang,3))+'°</b> · estimate xᵀCx = <b>'+F(lam,4)+'</b><br>each pass: the w₂ part × <b>1/2</b>, the w₃ part × <b>1/6</b>'; }
  document.getElementById('pw3-step').addEventListener('click',()=>{ if(ys.length<25){ step3(); paint3(); } });
  document.getElementById('pw3-reset').addEventListener('click',()=>{ if(anim3){ anim3.stop(); anim3=null; } seed++; reset3(); paint3(); });
  document.getElementById('pw3-play').addEventListener('click',()=>{ if(anim3){ anim3.stop(); anim3=null; } reset3(); paint3(); if(RM){ for(let i=0;i<14;i++) step3(); paint3(); return; }
    let dead=false; anim3={stop(){ dead=true; }}; const tick=()=>{ if(dead) return; if(ys.length>14){ anim3=null; return; } step3(); paint3(); setTimeout(tick,520); }; setTimeout(tick,300); });
  reset3();
  let S3=null;
  tabs(document.getElementById('pw-tabs'),t=>{ tab=t; showPane(box,t); if(anim){ anim.stop(); anim=null; } if(anim3){ anim3.stop(); anim3=null; } if(t==='three'){ if(!S3) S3=mountStage(stage,build); else remount(S3); paint3(); } else draw(); });
})();

/* ================= W14 · LONG DATA, WIDE DATA (memory, and the Gram trick on a tiny example) ================= */
(function(){
  const box=document.getElementById('w-wide'); if(!box) return;
  const mem=document.getElementById('wd-mem'), demo=document.getElementById('wd-demo'), read=document.getElementById('wd-read');
  let lN=Math.log10(40), lD=Math.log10(12000), seed=11;
  const val=l=>{ const v=Math.pow(10,l); return v<100?Math.round(v):v<1e4?Math.round(v/10)*10:Math.round(v/100)*100; };
  const sciS=v=>{ const e=Math.floor(Math.log10(v)), m=v/Math.pow(10,e); return F(m,2)+' × 10'+String(e).replace(/\d/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]); };
  const bytes=b=>{ const u=[['TB',1e12],['GB',1e9],['MB',1e6],['KB',1e3]]; for(const [n,s] of u) if(b>=s) return trim((b/s).toFixed(b/s<10?3:1))+' '+n; return Math.round(b)+' B'; };
  function draw(){ const N=val(lN), D=val(lD), mC=D*D*8, mK=N*N*8, lap=16e9, NAR=respVB(mem,'0 0 760 220','0 0 420 240');
    const f=frame(mem,2,13,-.5,1.5,{l:NAR?84:118,r:18,t:30,b:34,xs:1,xf:v=>v%3===0?(v===3?'1 KB':v===6?'1 MB':v===9?'1 GB':v===12?'1 TB':''):'',yt:false,axes:false});
    const gl=f.glow, h=26;
    [[1,'C · D × D = '+thou(D)+' × '+thou(D),mC,'s2'],[0,'K · N × N = '+thou(N)+' × '+thou(N),mK,'s3']].forEach(([y,l,b,c])=>{ const x1=f.px(Math.max(2,Math.log10(Math.max(b,100)))); const r=el('rect',{x:f.px(2),y:f.py(y)-h/2,width:Math.max(2,x1-f.px(2)),height:h,rx:7,fill:CV(c),opacity:.9},mem); if(gl) r.setAttribute('filter',gl);
      txt(mem,f.L-8,f.py(y)+4,NAR?(y?'C':'K'):(y?'covariance C':'Gram matrix K'),'font:700 11.5px system-ui;fill:'+CV(c),'end'); txt(mem,Math.min(x1+8,f.W-150),f.py(y)+4,bytes(b),'font:800 12px system-ui;fill:var(--ink)'); txt(mem,f.px(2)+8,f.py(y)-h/2-5,l,'font:600 10px system-ui;fill:var(--ink-muted)'); });
    const xl=f.px(Math.log10(lap)); el('line',{x1:xl,x2:xl,y1:f.T,y2:f.H-f.B,stroke:'var(--critical)','stroke-width':1.6,'stroke-dasharray':'5 4'},mem); txt(mem,xl+5,f.T+12,'a 16 GB laptop','font:700 10.5px system-ui;fill:var(--critical)');
    txt(mem,f.L,16,NAR?'memory in 8-byte numbers (log scale)':'memory to store the matrix, in 8-byte numbers (log scale)','font:700 11px system-ui;fill:var(--ink-muted)');
    const wide=D>N;
    read.innerHTML='N = <b>'+thou(N)+'</b> rows, D = <b>'+thou(D)+'</b> columns — '+(wide?'<b>wide</b> data':'<b>long</b> data')+
      '<br>C: <b>'+bytes(mC)+'</b>'+(mC>lap?' — <b style="color:var(--critical)">does not fit</b>':'')+' · eigen-split work ≈ D³ = <b>'+sciS(D**3)+'</b>'+
      '<br>K: <b>'+bytes(mK)+'</b> · work ≈ N³ = <b>'+sciS(N**3)+'</b> · non-zero eigenvalues at most <b>'+thou(Math.min(N-1,D))+'</b>'+(wide?' — solve the small one':' — here C is already the small one'); }
  function roll(){ const r=rng(seed), Nn=3, Dd=5, X=[[],[],[]];
    for(let j=0;j<Dd;j++){ let a,b; do{ a=Math.round((r()*2-1)*3); b=Math.round((r()*2-1)*3); }while(a===0&&b===0); X[0].push(a); X[1].push(b); X[2].push(-a-b); }
    const C=matMul(matT(X),X).map(rw=>rw.map(v=>v/Nn)), K=matMul(X,matT(X)).map(rw=>rw.map(v=>v/Nn)), eC=eigSym(C), eK=eigSym(K);
    const fx=v=>Math.abs(v)<5e-9?'0':F(v,4);
    const mat=(M,cls)=>'<table class="mini"><tbody>'+M.map(rw=>'<tr>'+rw.map(v=>'<td>'+nm(String(Math.round(v*1000)/1000))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
    const u1=eK.vecs[0], XtU=matVec(matT(X),u1), nr=norm(XtU), wRec=XtU.map(v=>v/nr), wDir=eC.vecs[0], sg=Math.sign(dot(wRec,wDir))||1;
    demo.innerHTML='<div class="demo2"><div><h4>the data X (3 × 5, each column adds to 0)</h4>'+mat(X)+'</div>'+
      '<div><h4>eigenvalues, both ways</h4><table class="mini"><thead><tr><th></th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>'+
      '<tr><td>C = XᵀX/3 (5 × 5)</td>'+eC.vals.map(v=>'<td>'+fx(v)+'</td>').join('')+'</tr><tr><td>K = XXᵀ/3 (3 × 3)</td>'+eK.vals.map(v=>'<td>'+fx(v)+'</td>').join('')+'<td>—</td><td>—</td></tr></tbody></table>'+
      '<div style="font-size:.8rem;color:var(--ink-muted)">3 centred points span at most N − 1 = 2 directions, so only two eigenvalues are non-zero — and they match.</div></div>'+
      '<div style="grid-column:1/-1"><h4>the top direction, both ways</h4><div class="mono" style="font-size:.8rem;line-height:1.7">direct — top eigenvector of C:<br><b>('+wDir.map(v=>F(v,4)).join(', ')+')</b><br>recovered — Xᵀu / ‖Xᵀu‖:<br><b>('+wRec.map(v=>F(v*sg,4)).join(', ')+')</b></div>'+
      '<div style="font-size:.8rem;color:var(--ink-muted)">‖Xᵀu‖ = '+F(nr,4)+' = √(N λ₁) = √(3 × '+F(eK.vals[0],4)+') = '+F(Math.sqrt(3*eK.vals[0]),4)+' · |direct · recovered| = '+F(Math.abs(dot(wRec,wDir)),6)+(sg<0?' (the sign came out flipped — signs are arbitrary)':'')+'</div></div></div>';
    box.dataset.match=(Math.abs(eC.vals[0]-eK.vals[0])<1e-9&&Math.abs(eC.vals[1]-eK.vals[1])<1e-9&&Math.abs(Math.abs(dot(wRec,wDir))-1)<1e-9)?'1':'0'; }
  const fmtN=v=>thou(val(v));
  bindCtl('wd-n',v=>{ lN=v; setPressed(['wd-gene','wd-cust'],null); draw(); },fmtN); bindCtl('wd-d',v=>{ lD=v; setPressed(['wd-gene','wd-cust'],null); draw(); },fmtN);
  const pre=(n,d,id)=>{ lN=Math.log10(n); lD=Math.log10(d); setRange('wd-n',lN,fmtN); setRange('wd-d',lD,fmtN); setPressed(['wd-gene','wd-cust'],id); draw(); };
  document.getElementById('wd-gene').addEventListener('click',()=>pre(40,12000,'wd-gene'));
  document.getElementById('wd-cust').addEventListener('click',()=>pre(100000,40,'wd-cust'));
  document.getElementById('wd-roll').addEventListener('click',()=>{ seed++; roll(); });
  setRange('wd-n',lN,fmtN); setRange('wd-d',lD,fmtN); onWidth(draw); draw(); roll();
})();

/* ================= W15 · THE RECIPE, STEP BY STEP — AND TWO TRAPS ================= */
(function(){
  const box=document.getElementById('w-recipe'); if(!box) return;
  const svg=document.getElementById('rc-svg'), read=document.getElementById('rc-read'), bar=document.getElementById('rc-steps'), ubar=document.getElementById('rc-u');
  /* the recipe cloud: two columns in different units */
  const MU=[2,2.2], SD=[2.6,1.3], RHO=.75;
  const RAW=cloudExact(70,[[SD[0]**2,RHO*SD[0]*SD[1]],[RHO*SD[0]*SD[1],SD[1]**2]],2718).map(p=>[p[0]+MU[0],p[1]+MU[1]]);
  const Z=RAW.map(p=>[(p[0]-MU[0])/SD[0],(p[1]-MU[1])/SD[1]]), CZ=covOf(Z).C, EZ=eig2(CZ[0][0],CZ[0][1],CZ[1][1]), wz=[Math.cos(EZ.th),Math.sin(EZ.th)];
  const PROJ=Z.map(p=>{ const s=dot(p,wz); return [wz[0]*s,wz[1]*s]; }), UNDO=PROJ.map(p=>[p[0]*SD[0]+MU[0],p[1]*SD[1]+MU[1]]);
  const STAGES=[RAW,RAW.map(p=>[p[0]-MU[0],p[1]-MU[1]]),Z,Z,PROJ,UNDO];
  const WORDS=['(a) the data as it came: column 1 has spread '+F(SD[0]**2,2)+', column 2 has '+F(SD[1]**2,2)+', in different units',
    '(b) centre: subtract the means ('+F(MU[0],1)+', '+F(MU[1],1)+') — the cloud moves to the origin',
    '(c) standardise: divide each column by its standard deviation ('+F(SD[0],1)+' and '+F(SD[1],1)+') — both now have spread 1',
    '(d) eigen-split C: PC1 (orange) and PC2 (green), drawn with length √λ: λ₁ = '+F(EZ.l1,3)+', λ₂ = '+F(EZ.l2,3),
    '(e) project: every point drops onto PC1 — one number per point, the score z = w₁ᵀx',
    '(f) undo: multiply by σ and add μ back — the rebuilt points lie on a line in the original units'];
  let tab='steps', st=0, pos=STAGES[0].map(p=>p.slice()), anim=null, stdOn=false;
  /* ---- unit trap data: height (m) and weight (kg) ---- */
  const VH=.006695, VW=57.34, RH=.7, HW=cloudExact(60,[[VH,RH*Math.sqrt(VH*VW)],[RH*Math.sqrt(VH*VW),VW]],1618).map(p=>[p[0]+1.65,p[1]+62]);
  const CHW=covOf(HW).C, EHW=eigSym(CHW), SHW=[Math.sqrt(CHW[0][0]),Math.sqrt(CHW[1][1])], ZHW=HW.map(p=>[(p[0]-1.65)/SHW[0],(p[1]-62)/SHW[1]]), EZH=eigSym(covOf(ZHW).C);
  /* ---- blind to y: y follows the PC2 score only ---- */
  const tb=25*DEG, CB=fromEig([6,.55],[[Math.cos(tb),Math.sin(tb)],[-Math.sin(tb),Math.cos(tb)]]), BL=cloudExact(80,CB,99), EB=eig2(CB[0][0],CB[0][1],CB[1][1]);
  const bw1=[Math.cos(EB.th),Math.sin(EB.th)], bw2=[-bw1[1],bw1[0]], YB=BL.map(p=>dot(p,bw2)/Math.sqrt(EB.l2));
  const yCol=v=>{ const t=Math.max(0,Math.min(1,(v+2.2)/4.4)); return 'color-mix(in srgb,var(--s6) '+Math.round((1-t)*100)+'%,var(--s5))'; };
  const corrOf=(a,b)=>{ const n=a.length, ma=a.reduce((s,v)=>s+v,0)/n, mb=b.reduce((s,v)=>s+v,0)/n; let sab=0,saa=0,sbb=0; a.forEach((v,i)=>{ sab+=(v-ma)*(b[i]-mb); saa+=(v-ma)**2; sbb+=(b[i]-mb)**2; }); return sab/Math.sqrt(saa*sbb); };
  function drawSteps(){ if(tab!=='steps') return; const P=eqFrame(svg,1,{bounds:[-7.2,10.6,-4.4,7.4],step:1}); const {px,py,glow:gl}=P;
    if(st>0){ const gg=el('g',{opacity:.2},P.layer); RAW.forEach(p=>el('circle',{cx:px(p[0]),cy:py(p[1]),r:3,fill:'none',stroke:'var(--s1)','stroke-width':1},gg)); txt(P.layer,px(9.6),py(6.6),'the original data (faint)','font:600 10px system-ui;fill:var(--ink-muted)','end'); }
    if(st>=3&&st<=4) glowLine(P.layer,px(-wz[0]*4),py(-wz[1]*4),px(wz[0]*4),py(wz[1]*4),'var(--s2)',1.2,null,{opacity:.5,'stroke-dasharray':'4 4'});
    if(st===5){ glowLine(P.layer,px(MU[0]-wz[0]*SD[0]*4),py(MU[1]-wz[1]*SD[1]*4),px(MU[0]+wz[0]*SD[0]*4),py(MU[1]+wz[1]*SD[1]*4),'var(--s2)',1.6,gl); }
    if(st===4){ Z.forEach((p,i)=>el('line',{x1:px(p[0]),y1:py(p[1]),x2:px(PROJ[i][0]),y2:py(PROJ[i][1]),stroke:'var(--ink-muted)','stroke-width':.7,opacity:.35},P.layer)); }
    const g=el('g',{},P.layer); pos.forEach(p=>el('circle',{cx:px(p[0]),cy:py(p[1]),r:3.6,fill:st>=4?'var(--s4)':'var(--s1)',opacity:.92},g)); if(gl) g.setAttribute('filter',gl);
    if(st===0||st===5){ const m=el('g',{},svg); el('line',{x1:px(MU[0])-8,y1:py(MU[1]),x2:px(MU[0])+8,y2:py(MU[1]),stroke:'var(--s4)','stroke-width':2.4},m); el('line',{x1:px(MU[0]),y1:py(MU[1])-8,x2:px(MU[0]),y2:py(MU[1])+8,stroke:'var(--s4)','stroke-width':2.4},m); txt(svg,px(MU[0])+10,py(MU[1])+18,'mean μ','font:800 10.5px system-ui;fill:var(--s4)'); }
    else { const m=el('g',{},svg); el('circle',{cx:px(0),cy:py(0),r:4,fill:'var(--s4)'},m); }
    if(st===3){ const L1=Math.sqrt(EZ.l1)*1.6, L2=Math.sqrt(EZ.l2)*1.6; svgArrow(svg,px(0),py(0),px(wz[0]*L1),py(wz[1]*L1),'var(--s2)',3.2,gl); svgArrow(svg,px(0),py(0),px(-wz[1]*L2),py(wz[0]*L2),'var(--s3)',2.8,gl);
      txt(svg,px(wz[0]*L1)+8,py(wz[1]*L1),'PC1','font:800 12px system-ui;fill:var(--s2)'); txt(svg,px(-wz[1]*L2)-8,py(wz[0]*L2),'PC2','font:800 12px system-ui;fill:var(--s3)','end'); }
    txt(svg,20,24,WORDS[st].split(':')[0],'font:800 13px system-ui;fill:var(--ink)');
    const LIST=['centre','standardise','eigen-split','project','undo (optional)'];
    read.innerHTML='<ol style="margin:0 0 .5rem 1.1rem;padding:0">'+LIST.map((t,i)=>'<li style="'+(i+1===st?'color:var(--ink);font-weight:800':(i+1<st?'color:var(--ink-2)':'color:var(--ink-muted)'))+'">'+t+(i+1<st?' ✓':'')+'</li>').join('')+'</ol>'+WORDS[st]+(st===2?'<br>check: spreads now <b>'+F(CZ[0][0],3)+'</b> and <b>'+F(CZ[1][1],3)+'</b>':'')+(st>=3?'<br>C (standardised) = [['+F(CZ[0][0],3)+', '+F(CZ[0][1],3)+'], ['+F(CZ[1][0],3)+', '+F(CZ[1][1],3)+']] · PC1 keeps <b>'+F(EZ.l1/(EZ.l1+EZ.l2)*100,1)+'%</b>':''); }
  function goStep(s){ if(anim){ anim.stop(); anim=null; } const from=pos.map(p=>p.slice()), to=STAGES[s]; st=s; setTabs(bar,String(s),'s');
    anim=tween(900,u=>{ pos=from.map((p,i)=>[p[0]+(to[i][0]-p[0])*u,p[1]+(to[i][1]-p[1])*u]); drawSteps(); },()=>{ anim=null; pos=to.map(p=>p.slice()); drawSteps(); }); }
  function drawUnits(){ const Q=stdOn?ZHW:HW, E=stdOn?EZH:EHW, w=E.vecs[0], mu=stdOn?[0,0]:[1.65,62];
    const P=stdOn?eqFrame(svg,3.2,{step:1}):eqFrame(svg,1,{bounds:[-24,28,38,86],step:5}); const {px,py,glow:gl}=P;
    const g=el('g',{},P.layer); Q.forEach(p=>el('circle',{cx:px(p[0]),cy:py(p[1]),r:3.4,fill:'var(--s1)',opacity:.9},g)); if(gl) g.setAttribute('filter',gl);
    const L=stdOn?3:22; glowLine(P.layer,px(mu[0]-w[0]*L),py(mu[1]-w[1]*L),px(mu[0]+w[0]*L),py(mu[1]+w[1]*L),'var(--s2)',2.4,gl);
    txt(svg,P.box[0]+P.box[2]-8,py(stdOn?0:38)-8,stdOn?'height (standardised)':'height in metres','font:700 11px system-ui;fill:var(--ink-muted)','end');
    txt(svg,px(stdOn?0:0)+8,P.box[1]+16,stdOn?'weight (standardised)':'weight in kilograms','font:700 11px system-ui;fill:var(--ink-muted)');
    /* inset: PC1 loadings */
    const x0=P.box[0]+14, y0=P.box[1]+44, bw2=34, H2=90; el('rect',{x:x0-8,y:y0-38,width:130,height:H2+68,rx:10,fill:'color-mix(in srgb,var(--surface) 85%,transparent)',stroke:'var(--line)'},svg);
    txt(svg,x0,y0-20,'PC1 loadings','font:800 11px system-ui;fill:var(--s2)');
    [['height',Math.abs(w[0])],['weight',Math.abs(w[1])]].forEach(([n,v],i)=>{ const x=x0+i*(bw2+22), h=v*H2; el('rect',{x,y:y0+H2-h+6,width:bw2,height:Math.max(1.5,h),rx:4,fill:'var(--s2)'},svg); txt(svg,x+bw2/2,y0+H2-h,F(v,2),'font:800 11px system-ui;fill:var(--ink)','middle'); txt(svg,x+bw2/2,y0+H2+20,n,'font:600 10px system-ui;fill:var(--ink-2)','middle'); });
    read.innerHTML=(stdOn?'<b>standardised</b>: both columns have spread 1':'<b>raw units</b>: height’s spread is <b>'+F(CHW[0][0],6)+'</b> m², weight’s is <b>'+F(CHW[1][1],2)+'</b> kg² — about <b>'+thou(CHW[1][1]/CHW[0][0])+'</b> times bigger')+
      '<br>PC1 loadings: height <b>'+F(Math.abs(w[0]),2)+'</b>, weight <b>'+F(Math.abs(w[1]),2)+'</b>'+(stdOn?' — an equal mix: the real relationship shows':' — PC1 is just the weight column, because kilograms make bigger numbers'); }
  function drawBlind(){ const P=eqFrame(svg,1,{bounds:[-6.5,11,-4.6,4.6],step:1}); const {px,py,glow:gl}=P;
    const g=el('g',{},P.layer); BL.forEach((p,i)=>el('circle',{cx:px(p[0]),cy:py(p[1]),r:4.2,fill:yCol(YB[i]),opacity:.95},g)); if(gl) g.setAttribute('filter',gl);
    svgArrow(svg,px(0),py(0),px(bw1[0]*Math.sqrt(EB.l1)*1.7),py(bw1[1]*Math.sqrt(EB.l1)*1.7),'var(--s2)',3,gl); svgArrow(svg,px(0),py(0),px(bw2[0]*Math.sqrt(EB.l2)*2.6),py(bw2[1]*Math.sqrt(EB.l2)*2.6),'var(--s3)',2.6,gl);
    txt(svg,px(bw1[0]*Math.sqrt(EB.l1)*1.7),py(bw1[1]*Math.sqrt(EB.l1)*1.7)-12,'PC1 — kept','font:800 11px system-ui;fill:var(--s2)','end'); txt(svg,px(bw2[0]*Math.sqrt(EB.l2)*2.6)-4,py(bw2[1]*Math.sqrt(EB.l2)*2.6)-6,'PC2 — dropped','font:800 11px system-ui;fill:var(--s3)','end');
    txt(svg,20,24,'colour = the target y','font:800 12px system-ui;fill:var(--ink)');
    const z1=BL.map(p=>dot(p,bw1)), z2=BL.map(p=>dot(p,bw2));
    [[z1,'y against the PC1 score',0,'s2'],[z2,'y against the PC2 score',1,'s3']].forEach(([z,t,k,c])=>{ const x0=392, y0=40+k*190, w=190, h=150;
      el('rect',{x:x0,y:y0,width:w,height:h,rx:10,fill:'color-mix(in srgb,var(--surface) 88%,transparent)',stroke:'var(--line)'},svg);
      txt(svg,x0+10,y0+17,t,'font:700 10.5px system-ui;fill:'+CV(c));
      const zm=Math.max(...z.map(Math.abs))*1.1; z.forEach((v,i)=>el('circle',{cx:x0+w/2+v/zm*(w/2-12),cy:y0+h/2+14-YB[i]/2.6*(h/2-24),r:2.8,fill:yCol(YB[i])},svg));
      txt(svg,x0+w-10,y0+h-8,'r = '+F(corrOf(z,YB),2),'font:800 11px system-ui;fill:var(--ink)','end'); });
    read.innerHTML='PCA keeps PC1 because it has the most spread (<b>'+F(EB.l1,2)+'</b> against <b>'+F(EB.l2,2)+'</b>). But the target y changes <b>across</b> the cloud, along PC2.<br>correlation of y with the PC1 score: <b>'+F(corrOf(z1,YB),2)+'</b> · with the PC2 score: <b>'+F(corrOf(z2,YB),2)+'</b> — the dropped component is the one that predicts y'; }
  function draw(){ if(tab==='steps') drawSteps(); else if(tab==='units') drawUnits(); else drawBlind(); }
  bar.querySelectorAll('button[data-s]').forEach(b=>b.addEventListener('click',()=>goStep(+b.dataset.s)));
  document.getElementById('rc-play').addEventListener('click',()=>{ pos=STAGES[0].map(p=>p.slice()); st=0; drawSteps(); let s=0; const next=()=>{ if(tab!=='steps') return; s++; if(s>5) return; goStep(s); setTimeout(next,RM?0:1500); }; setTimeout(next,RM?0:700); });
  document.getElementById('rc-raw').addEventListener('click',()=>{ stdOn=false; setPressed(['rc-raw','rc-std'],'rc-raw'); drawUnits(); });
  document.getElementById('rc-std').addEventListener('click',()=>{ stdOn=true; setPressed(['rc-raw','rc-std'],'rc-std'); drawUnits(); });
  tabs(document.getElementById('rc-tabs'),t=>{ tab=t; bar.style.display=t==='steps'?'':'none'; ubar.style.display=t==='units'?'':'none'; draw(); });
  box.dataset.rawLoad=F(Math.abs(EHW.vecs[0][0]),2)+','+F(Math.abs(EHW.vecs[0][1]),2); box.dataset.stdLoad=F(Math.abs(EZH.vecs[0][0]),2)+','+F(Math.abs(EZH.vecs[0][1]),2);
  draw();
})();

/* ================= W16 · A PCA CALCULATOR THAT SHOWS ITS WORK ================= */
(function(){
  const box=document.getElementById('w-worked'); if(!box) return;
  const svg=document.getElementById('wk-svg'), cards=document.getElementById('wk-cards'), inp=document.getElementById('wk-input');
  const SETS={'wk-five':[[1,2],[4,5],[7,8],[8,4],[10,6]],'wk-four':[[2,3],[4,7],[6,5],[8,9]],
    'wk-nine':[[1.11,10],[1.21,12],[1.36,13],[1.49,15],[1.63,16],[1.68,17],[1.83,18],[1.88,19],[1.95,20]]};
  let pts=SETS['wk-five'].map(p=>p.slice()), drag=-1, P=null, dec=0;
  const f=(v,d)=>F(v,d==null?4:d), g4=v=>{ const s=(+v).toFixed(4); return nm(s.replace(/\.?0+$/,'')); };
  const parse=s=>{ const m=[...s.matchAll(/\(?\s*(-?\d*\.?\d+)\s*[,;\s]\s*(-?\d*\.?\d+)\s*\)?/g)].map(x=>[+x[1],+x[2]]); return m.length>=2&&m.length<=40?m:null; };
  const txtOf=()=>pts.map(p=>'('+g4(p[0])+','+g4(p[1])+')').join(' ');
  function compute(){ const N=pts.length, mu=[0,0]; pts.forEach(p=>{ mu[0]+=p[0]/N; mu[1]+=p[1]/N; });
    const X=pts.map(p=>[p[0]-mu[0],p[1]-mu[1]]), S=[[0,0],[0,0]]; X.forEach(x=>{ S[0][0]+=x[0]*x[0]; S[0][1]+=x[0]*x[1]; S[1][1]+=x[1]*x[1]; }); S[1][0]=S[0][1];
    const C=S.map(r=>r.map(v=>v/N)), tr=C[0][0]+C[1][1], det=C[0][0]*C[1][1]-C[0][1]*C[1][0], disc=Math.max(0,tr*tr-4*det), l1=(tr+Math.sqrt(disc))/2, l2=(tr-Math.sqrt(disc))/2;
    /* eigenvector from a row of (C − λI) — use the better-conditioned row */
    const vec=l=>{ let v=Math.abs(C[0][1])>1e-12?(Math.abs(C[0][0]-l)>=Math.abs(C[1][1]-l)?[C[0][1],l-C[0][0]]:[l-C[1][1],C[1][0]]):(Math.abs(C[0][0]-l)<Math.abs(C[1][1]-l)?[1,0]:[0,1]); const n=norm(v); v=v.map(x=>x/n); if(v[0]<0||(Math.abs(v[0])<1e-12&&v[1]<0)) v=v.map(x=>-x); return {raw:v,n}; };
    const v1=vec(l1).raw; let v2=[-v1[1],v1[0]]; if(v2[0]<0) v2=v2.map(x=>-x);
    const z=X.map(x=>dot(x,v1)), z2=X.map(x=>dot(x,v2)), vz=z.reduce((s,v)=>s+v*v,0)/N, vz2=z2.reduce((s,v)=>s+v*v,0)/N;
    return {N,mu,X,S,C,tr,det,disc,l1,l2,v1,v2,z,z2,vz,vz2}; }
  function draw(){ const R=compute(); const {mu,X,C,l1,l2,v1,v2,z}=R;
    const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]); let x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys); const span=Math.max(x1-x0,y1-y0,1)*.28;
    respVB(svg,'0 0 540 420','0 0 420 400'); P=eqFrame(svg,1,{bounds:[x0-span,x1+span,y0-span,y1+span],step:Math.max(x1-x0,y1-y0)>12?2:(Math.max(x1-x0,y1-y0)<3?.25:1)}); const {px,py,glow:gl}=P;
    const L=Math.max(x1-x0,y1-y0)*1.2;
    glowLine(P.layer,px(mu[0]-v2[0]*L),py(mu[1]-v2[1]*L),px(mu[0]+v2[0]*L),py(mu[1]+v2[1]*L),'var(--s3)',1.4,gl,{'stroke-dasharray':'6 5'});
    glowLine(P.layer,px(mu[0]-v1[0]*L),py(mu[1]-v1[1]*L),px(mu[0]+v1[0]*L),py(mu[1]+v1[1]*L),'var(--s2)',2.2,gl);
    pts.forEach((p,i)=>{ const f0=[mu[0]+v1[0]*z[i],mu[1]+v1[1]*z[i]]; el('line',{x1:px(p[0]),y1:py(p[1]),x2:px(f0[0]),y2:py(f0[1]),stroke:'var(--ink-muted)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.8},P.layer);
      el('circle',{cx:px(f0[0]),cy:py(f0[1]),r:3.4,fill:'var(--s4)'},P.layer);
      if(pts.length<=12){ let dx=px(f0[0])-px(p[0]), dy=py(f0[1])-py(p[1]); const dl=Math.hypot(dx,dy); let far=17; if(dl<2){ dx=-v1[1]; dy=-v1[0]; far=26; } else { dx/=dl; dy/=dl; } txt(P.layer,px(f0[0])+dx*far,py(f0[1])+dy*far+4,F(z[i],2),'font:800 10.5px system-ui;fill:var(--s4)','middle'); } });
    const m=el('g',{},svg); el('line',{x1:px(mu[0])-7,y1:py(mu[1]),x2:px(mu[0])+7,y2:py(mu[1]),stroke:'var(--s4)','stroke-width':2.2},m); el('line',{x1:px(mu[0]),y1:py(mu[1])-7,x2:px(mu[0]),y2:py(mu[1])+7,stroke:'var(--s4)','stroke-width':2.2},m);
    pts.forEach((p,i)=>{ const g=el('g',{},svg); el('circle',{cx:px(p[0]),cy:py(p[1]),r:12,fill:'var(--s1)',opacity:drag===i?.28:.12},g); el('circle',{cx:px(p[0]),cy:py(p[1]),r:6,fill:'var(--s1)',stroke:'var(--page)','stroke-width':1.4},g); if(gl) g.setAttribute('filter',gl); });
    txt(svg,P.box[0]+10,P.box[1]+18,'PC1','font:800 11px system-ui;fill:var(--s2)'); txt(svg,P.box[0]+44,P.box[1]+18,'PC2','font:800 11px system-ui;fill:var(--s3)');
    cardsOut(R); }
  function cardsOut(R){ const {N,mu,X,S,C,tr,det,disc,l1,l2,v1,v2,z,vz,vz2}=R, d=dec, ok=c=>c?'<span class="ok">✓</span>':'<span class="no">✗</span>';
    const cs=[X.reduce((s,x)=>s+x[0],0),X.reduce((s,x)=>s+x[1],0)];
    const c=[];
    c.push(['1','the mean','μ = (<b>'+f(mu[0])+'</b>, <b>'+f(mu[1])+'</b>) from '+N+' points']);
    c.push(['2','centre','rows x − μ: '+X.slice(0,6).map(x=>'('+f(x[0],3)+', '+f(x[1],3)+')').join(' ')+(N>6?' …':'')+'<br>column sums: '+f(cs[0],6)+', '+f(cs[1],6)+' '+ok(Math.abs(cs[0])<1e-9&&Math.abs(cs[1])<1e-9)]);
    c.push(['3','C = XᵀX / N','sums Σx₁² = '+f(S[0][0])+', Σx₂² = '+f(S[1][1])+', Σx₁x₂ = '+f(S[0][1])+'; divide by N = '+N+'<br>C = [[<b>'+f(C[0][0])+'</b>, <b>'+f(C[0][1])+'</b>], [<b>'+f(C[1][0])+'</b>, <b>'+f(C[1][1])+'</b>]]']);
    c.push(['4','eigenvalues','λ² − '+f(tr)+' λ + '+f(det)+' = 0 → λ = ('+f(tr)+' ± √'+f(disc)+') / 2<br>λ₁ = <b>'+f(l1)+'</b>, λ₂ = <b>'+f(l2)+'</b> · Σλ = '+f(l1+l2)+' = tr C '+ok(Math.abs(l1+l2-tr)<1e-9)+' · Πλ = '+f(l1*l2)+' = det C '+ok(Math.abs(l1*l2-det)<1e-9)]);
    c.push(['5','eigenvectors, length 1','w₁ = (<b>'+f(v1[0])+'</b>, <b>'+f(v1[1])+'</b>) · w₂ = ('+f(v2[0])+', '+f(v2[1])+')<br>|w₁| = '+f(norm(v1))+' '+ok(Math.abs(norm(v1)-1)<1e-9)+' · w₁·w₂ = '+f(dot(v1,v2),6)+' '+ok(Math.abs(dot(v1,v2))<1e-9)]);
    c.push(['6','scores on PC1','z = '+z.slice(0,9).map(v=>f(v,3)).join(', ')+(N>9?' …':'')+'<br>mean '+f(z.reduce((s,v)=>s+v,0)/N,6)+' '+ok(Math.abs(z.reduce((s,v)=>s+v,0))<1e-9)+' · spread '+f(vz)+' = λ₁ '+ok(Math.abs(vz-l1)<1e-9)+' · PC2 spread '+f(vz2)+' = λ₂ '+ok(Math.abs(vz2-l2)<1e-9)]);
    c.push(['7','shares','PC1 keeps <b>'+F(l1/(l1+l2)*100,2)+'%</b>, PC2 <b>'+F(l2/(l1+l2)*100,2)+'%</b>']);
    cards.innerHTML=c.map(([n,h,b])=>'<div class="wk-card"><div class="wh"><i>'+n+'</i>'+h+'</div><div class="mono">'+b+'</div></div>').join('');
    box.dataset.l1=f(l1); box.dataset.w1=f(v1[0])+','+f(v1[1]); }
  svgDrag(svg,(x,y)=>{ if(!P) return false; let best=-1,bd=1e9; pts.forEach((p,i)=>{ const d=Math.hypot(P.px(p[0])-x,P.py(p[1])-y); if(d<bd){ bd=d; best=i; } }); if(bd>24) return false; drag=best; },
    (x,y)=>{ if(drag<0) return; const q=Math.pow(10,dec); pts[drag]=[Math.round(P.ix(x)*q)/q,Math.round(P.iy(y)*q)/q]; draw(); },()=>{ drag=-1; inp.value=txtOf(); draw(); });
  Object.keys(SETS).forEach(id=>document.getElementById(id).addEventListener('click',()=>{ pts=SETS[id].map(p=>p.slice()); dec=id==='wk-nine'?2:0; setPressed(Object.keys(SETS),id); inp.value=txtOf(); draw(); }));
  const apply=()=>{ const q=parse(inp.value); if(!q){ inp.style.borderColor='var(--critical)'; return; } inp.style.borderColor=''; pts=q; dec=pts.some(p=>p.some(v=>Math.abs(v-Math.round(v))>1e-9))?2:0; setPressed(Object.keys(SETS),null); draw(); };
  document.getElementById('wk-apply').addEventListener('click',apply); onWidth(draw); inp.addEventListener('keydown',e=>{ if(e.key==='Enter') apply(); });
  draw();
})();
