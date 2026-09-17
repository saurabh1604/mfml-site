/* ================= W11 · FIVE CONDITIONS, A BRANCHING INTERROGATION (a lit case tree over the map) ================= */
(function(){
  const box=document.getElementById('cs-3d'),tree=document.getElementById('cs-tree'),work=document.getElementById('cs-work'),check=document.getElementById('cs-check'),verd=document.getElementById('cs-verdict'),playBtn=document.getElementById('cs-play'),playBar=document.getElementById('cs-playbar');
  if(!box) return;
  const TWO=[
    {id:'b1',lab:'µ₁ = 0, µ₂ = 0',pt:[2/3,1/3],ok:true,why:'survives · x* = (2/3, 1/3) · f* = 2/3',
     lines:['assume both fences are slack, so µ₁ = µ₂ = 0','∂L/∂x: 2x + λ = 0  ⇒  x = −λ/2','∂L/∂y: 4y + λ = 0  ⇒  y = −λ/4','path: x + y = 1  ⇒  −3λ/4 = 1  ⇒  λ = −4/3','x = 2/3, y = 1/3 — both ≥ 0, so the fences really are slack','f = (2/3)² + 2(1/3)² = 4/9 + 2/9 = 2/3'],
     v:['good','good — survives every condition']},
    {id:'b2',lab:'µ₁ = 0, y = 0',pt:[1,0],ok:false,why:'burns out · µ₂ = −2 < 0',
     lines:['assume the y ≥ 0 fence is tight: y = 0','path: x + y = 1  ⇒  x = 1','∂L/∂x: 2(1) + λ = 0  ⇒  λ = −2','∂L/∂y: 4(0) + λ − µ₂ = 0  ⇒  µ₂ = λ = −2'],
     v:['bad','bad — rejected: µ₂ = −2 < 0 breaks dual feasibility']},
    {id:'b3',lab:'x = 0, µ₂ = 0',pt:[0,1],ok:false,why:'burns out · µ₁ = −4 < 0',
     lines:['assume the x ≥ 0 fence is tight: x = 0','path: x + y = 1  ⇒  y = 1','∂L/∂y: 4(1) + λ = 0  ⇒  λ = −4','∂L/∂x: 2(0) + λ − µ₁ = 0  ⇒  µ₁ = λ = −4'],
     v:['bad','bad — rejected: µ₁ = −4 < 0']},
    {id:'b4',lab:'x = 0, y = 0',pt:[0,0],ok:false,why:'burns out · x + y = 0 ≠ 1',
     lines:['assume both fences are tight: x = 0 and y = 0','path: x + y = 0 ≠ 1'],
     v:['bad','bad — rejected on the path, before any fine rate is computed']}];
  const ONE=[
    {id:'c1',lab:'µ = 0 · the fence is slack',pt:[2,2],ok:false,why:'burns out · g = 3 − 2 = 1 > 0 · outside the fence',
     lines:['assume x ≥ 3 is not binding, so µ = 0','∂L/∂x: 2x + λ = 0 · ∂L/∂y: 2y + λ = 0  ⇒  x = y','path: x + y = 4  ⇒  x = y = 2, λ = −4','fence: g = 3 − x = 3 − 2 = 1 > 0'],
     v:['bad','bad — rejected: the answer breaks the fence']},
    {id:'c2',lab:'g = 0 · the fence is tight',pt:[3,1],ok:true,why:'survives · µ = 4 ≥ 0 · x* = (3, 1), p* = 10',
     lines:['assume x ≥ 3 is binding: x = 3','path: x + y = 4  ⇒  y = 1','∂L/∂y: 2y + λ = 0  ⇒  λ = −2','∂L/∂x: 2x + λ − µ = 0  ⇒  6 − 2 − µ = 0  ⇒  µ = 4 ≥ 0 ✓','p* = 3² + 1² = 10'],
     v:['good','good — all five conditions hold: x* = (3, 1), λ = −2, µ = 4, p* = 10']}];
  const CHECKS=['stationarity  ∇f + λ∇h + µ∇g = 0','the path  x + y = 4','the fence  x ≥ 3','one fine charged only when touching  µ·g = 0','every fence fine  µ ≥ 0'];
  const PROB={two:{f:(x,y)=>x*x+2*y*y,X:[-0.45,1.45],Y:[-0.45,1.45],c:[0.5,0.5],S:1.75,seg:[[0,1],[1,0]],path:[[-0.45,1.45],[1.45,-0.45]],mid:[0.5,0.5],title:'minimise x² + 2y² on x + y = 1, x ≥ 0, y ≥ 0'},
              one:{f:(x,y)=>x*x+y*y,X:[-0.6,4.6],Y:[-0.6,4.6],c:[2,2],S:0.64,seg:[[3,1],[4.6,-0.6]],path:[[-0.6,4.6],[4.6,-0.6]],fence:3,mid:[2.5,1.5],title:'minimise x² + y² on x + y = 4, x ≥ 3'}};
  const H=1.35, NF=()=>box.clientWidth<560?1.3:1;
  let tab='two',pick=null,m=3,ticks=0,anim=null,run=0,sc=null,ST=null,chips=null,status={},active=null,playing=false;
  const rows=()=>tab==='two'?TWO:ONE;
  const P=()=>PROB[tab==='one'?'one':'two'];
  const mp=(x,y,h)=>{ const q=P(); return [(x-q.c[0])*q.S,h||0,-(y-q.c[1])*q.S]; };
  const lerp3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  function bez(P0,P1,P2,P3,n){ const out=[]; for(let i=0;i<=n;i++){ const t=i/n,u=1-t; out.push([0,1,2].map(k=>u*u*u*P0[k]+3*u*u*t*P1[k]+3*u*t*t*P2[k]+t*t*t*P3[k])); } return out; }
  function along(pts,u){ let L=0; const cum=[0]; for(let i=1;i<pts.length;i++){ L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]); cum.push(L); }
    const s=u*L; let i=1; while(i<cum.length-1&&cum[i]<s) i++; const t=(s-cum[i-1])/((cum[i]-cum[i-1])||1); return lerp3(pts[i-1],pts[i],Math.max(0,Math.min(1,t))); }
  function build(){
    sc=null; const narrow=box.clientWidth<560;
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[-3.5,3.2,4.1]:[-3.05,2.75,3.6],look:[0,.5,0],fov:36},autoRotate:.06,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const sceneG=new THREE.Group(); root.add(sceneG);
        sc={THREE,ctx,root,colors,isLight,hx,sceneG,edges:null,cases:null,star:null,walker:null,lab:[],handle:null};
        chips=hudPair(box); hint(box,'drag to orbit');
        buildScene(); paintTree();
      },
      update(){ return false; }
    });
    if(handle){ grab(handle,()=>false,()=>{}); if(sc) sc.handle=handle; }
    return handle;
  }
  /* the floor map: a dark slab, a fading grid, the level curves lying flat, the path and its allowed part */
  function floorMap(){ const {THREE,ctx,sceneG,hx,isLight,colors}=sc, q=P();
    const slab=new THREE.Mesh(new THREE.PlaneGeometry(3.6,3.6),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.35:.45})); slab.rotation.x=-Math.PI/2; slab.position.y=-.004; sceneG.add(slab);
    const grid=CIN.prim.grid(ctx,3.4,17,hx('grid'),{opacity:isLight?.45:.36}); grid.position.y=.001; sceneG.add(grid);
    const fs=(u,v)=>q.f(q.c[0]+u/q.S,q.c[1]+v/q.S); const top=q.f(q.X[1],q.Y[1]), lv=[]; for(let i=1;i<=10;i++) lv.push(top*Math.pow(i/11,2));
    const R=(q.X[1]-q.X[0])/2*q.S; sceneG.add(liftedContours(ctx,fs,lv,-R,R,-R,R,0,hx('s1'),{N:72,opacity:isLight?.55:.75}));
    const a=mp(q.path[0][0],q.path[0][1],.012), b=mp(q.path[1][0],q.path[1][1],.012); sceneG.add(tube(ctx,a,b,hx('ink2'),.008,.45));
    const s0=mp(q.seg[0][0],q.seg[0][1],.02), s1=mp(q.seg[1][0],q.seg[1][1],.02); sceneG.add(tube(ctx,s0,s1,hx('s3'),.03));
    [s0,s1].forEach(p=>sceneG.add(CIN.prim.dot(ctx,p,hx('s3'),.045)));
    if(q.fence!=null){ const wall=wallPanel(ctx,{w:3.4,h:.85,color:'s2'}); wall.g.position.y=.12; wall.setX(mp(q.fence,0)[0]); sceneG.add(wall.g);
      const bf=bannedFloor(ctx,{w:3.4,d:3.4,y:.006}); bf.setX(-1.7,mp(q.fence,0)[0]); sceneG.add(bf.m);
      sceneG.add(CIN.prim.label(ctx,'fence x ≥ 3',[mp(q.fence,0)[0],.95,1.35],{size:18,color:colors.s2,bg:false,depthTest:false})); }
    }
  /* an edge of the tree: a chain of lit tubes that can be re-lit or dissolved */
  function mkEdge(pts,cases){ const {ctx,hx,sceneG}=sc; const g=new sc.THREE.Group(); sceneG.add(g); const tubes=[];
    for(let i=0;i+1<pts.length;i++){ const t=tube(ctx,pts[i],pts[i+1],hx('s1'),.02,.6); g.add(t); tubes.push(t); } return {g,tubes,cases,pts}; }
  function setEdge(e,color,op,k){ e.tubes.forEach(t=>{ t.visible=op>0; t.material.color.setHex(color); t.material.emissive.setHex(color); t.material.opacity=op; t.scale.x=t.scale.z=k||1; }); }
  function buildScene(){ if(!sc) return; const {THREE,ctx,sceneG,hx,colors}=sc; clearGroup(sceneG); sc.edges=[]; sc.cases={}; sc.star=null; sc.walker=null; sc.lab=[];
    if(tab==='many'){ buildMany(); return; }
    floorMap(); const q=P(), rs=rows();
    const base=mp(q.mid[0],q.mid[1],.02), rootP=[base[0],H,base[2]]; sc.rootP=rootP;
    sc.edges.push(mkEdge([base,rootP],rs.map(r=>r.id)));
    const sh=[]; const cand=r=>mp(r.pt[0],r.pt[1],.03);
    if(tab==='two'){ const A=[rootP[0]+.7,H-.42,rootP[2]], B=[rootP[0]-.7,H-.42,rootP[2]];
      const EA=bez(rootP,[rootP[0]+.1,H-.1,rootP[2]],[A[0]-.1,A[1]+.2,A[2]],A,8), EB=bez(rootP,[rootP[0]-.1,H-.1,rootP[2]],[B[0]+.1,B[1]+.2,B[2]],B,8);
      sc.edges.push(mkEdge(EA,['b1','b2'])); sc.edges.push(mkEdge(EB,['b3','b4']));
      rs.forEach(r=>{ const left=(r.id==='b1'||r.id==='b2'), par=left?A:B, c=cand(r); const d=[c[0]-par[0],c[2]-par[2]], L=Math.hypot(d[0],d[1])||1;
        const S=[par[0]+d[0]/L*.5,H-.78,par[2]+d[1]/L*.5]; sh.push({r,par,S,c,head:left?EA:EB}); }); }
    else rs.forEach((r,i)=>{ const c=cand(r); const S=[rootP[0]+(i?.7:-.7),H-.45,rootP[2]]; sh.push({r,par:rootP,S,c,head:[rootP]}); });
    sh.forEach(({r,par,S,c,head})=>{ const stem=bez(par,[par[0],par[1]-.15,par[2]],[S[0],S[1]+.15,S[2]],S,6), arc=bez(S,[S[0],S[1]-.3,S[2]],[c[0],c[1]+.5,c[2]],c,12);
      sc.edges.push(mkEdge(stem,[r.id])); sc.edges.push(mkEdge(arc,[r.id]));
      const path=head.concat(stem.slice(1),arc.slice(1));
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.075,.012,10,32),new THREE.MeshStandardMaterial({color:hx('ink2'),emissive:hx('ink2'),emissiveIntensity:sc.isLight?.1:.5,transparent:true,opacity:.8})); ring.rotation.x=-Math.PI/2; ring.position.set(c[0],.02,c[2]); sceneG.add(ring);
      const scar=new THREE.Mesh(new THREE.CircleGeometry(.17,32),new THREE.MeshBasicMaterial({color:critHex(),transparent:true,opacity:sc.isLight?.3:.4,depthWrite:false})); scar.rotation.x=-Math.PI/2; scar.position.set(c[0],.016,c[2]); scar.visible=false; sceneG.add(scar);
      const lab=CIN.prim.label(ctx,r.lab,[S[0],S[1]+(sh.indexOf(sh.find(x=>x.r===r))%2?.36:.2),S[2]],{size:17,color:colors.ink,bg:true,depthTest:false}); sceneG.add(lab); sc.lab.push(lab);
      sc.cases[r.id]={r,path,c,ring,lab,scar}; });
    /* the star that lands on the survivor, and the bead that walks each branch */
    const star=new THREE.Group(); star.add(overlay(CIN.prim.dot(ctx,[0,0,0],hx('s3'),.065),12)); star.add(haloSprite(ctx,hx('s3'),.5)); star.visible=false; sceneG.add(star); sc.star=star;
    const w=walkerChar(ctx,hx('s4'),.06); w.show(false); sceneG.add(w.g); sc.walker=w;
    if(chips) chips.set(`<b>${rs.length}</b> branches · click one, or ▶`,q.title); }
  function paintTree(){ if(!sc||tab==='many') return; const {hx}=sc;
    sc.edges.forEach(e=>{ const cs=e.cases; if(active&&cs.indexOf(active)>=0) setEdge(e,hx('s4'),1,1.6);
      else if(cs.some(c=>status[c]==='good')) setEdge(e,hx('s3'),1,1.4);
      else if(cs.every(c=>status[c]==='dead')) setEdge(e,critHex(),.12,1);
      else setEdge(e,hx('s1'),.6,1); });
    Object.keys(sc.cases).forEach(id=>{ const C=sc.cases[id]; C.ring.visible=status[id]!=='good'&&status[id]!=='dead'; C.scar.visible=status[id]==='dead'; const col=id===active?hx('s4'):hx('ink2'); C.ring.material.color.setHex(col); C.ring.material.emissive.setHex(col);
      C.lab.material.opacity=status[id]==='dead'?.35:1; });
    const g=Object.keys(sc.cases).find(id=>status[id]==='good'); sc.star.visible=!!g; if(g){ const c=sc.cases[g].c; if(!sc.starLanding) sc.star.position.set(c[0],c[1]+.03,c[2]); }
    RR(sc.ctx); }
  /* the counting tab: a real binary tree whose 2^m leaves are lights on a row, and behind it the ghost fan with m² leaves */
  function buildMany(){ const {THREE,ctx,sceneG,hx,colors,isLight}=sc;
    const slab=new THREE.Mesh(new THREE.PlaneGeometry(4.2,3.6),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.35:.55})); slab.rotation.x=-Math.PI/2; slab.position.y=-.004; sceneG.add(slab);
    const grid=CIN.prim.grid(ctx,4,20,hx('grid'),{opacity:isLight?.45:.3}); grid.position.y=.001; sceneG.add(grid);
    const N=Math.pow(2,m), TOP=1.5, rootP=[0,TOP,-.35];
    const node=(l,i)=>{ const k=Math.pow(2,l), t=l/m; return [-1.7*t+3.4*t*(i+.5)/k,TOP*(1-t)+.02,-.35+1.05*t]; };
    sceneG.add(tube(ctx,[0,0,-.35],rootP,hx('s1'),.03,.9));
    const lines=[]; for(let l=1;l<=m;l++){ const k=Math.pow(2,l); for(let i=0;i<k;i++){ const a=node(l-1,i>>1), b=node(l,i); if(l<=4) sceneG.add(tube(ctx,a,b,hx('s1'),Math.max(.008,.026-l*.004),.75)); else lines.push(a[0],a[1],a[2],b[0],b[1],b[2]); } }
    if(lines.length){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(lines),3)); sceneG.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:hx('s1'),transparent:true,opacity:isLight?.55:.5}))); }
    for(let l=0;l<m&&l<=3;l++){ const k=Math.pow(2,l); for(let i=0;i<k;i++) sceneG.add(CIN.prim.dot(ctx,node(l,i),hx('s1'),.03)); }
    const lp=new Float32Array(N*3); for(let i=0;i<N;i++){ const p=node(m,i); lp[3*i]=p[0]; lp[3*i+1]=p[1]+.02; lp[3*i+2]=p[2]; }
    const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.BufferAttribute(lp,3));
    if(N<=64) for(let i=0;i<N;i++) sceneG.add(CIN.prim.dot(ctx,node(m,i),hx('s4'),N<=16?.04:.028));
    const leaves=new THREE.Points(lg,new THREE.PointsMaterial({color:hx('s4'),size:Math.max(.12,.5-.045*m),map:sparkTex(THREE),transparent:true,opacity:isLight?.85:.95,blending:isLight?THREE.NormalBlending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true})); leaves.frustumCulled=false; sceneG.add(leaves);
    sceneG.add(tube(ctx,[-1.75,.012,.7],[1.75,.012,.7],hx('s4'),.008,.6));
    /* the slip: m² leaves on a fan behind */
    const M2=m*m, gp=[1.0,TOP*.72,-1.35]; const gl=[]; const gpts=new Float32Array(M2*3);
    for(let i=0;i<M2;i++){ const x=-.3+2.6*(i+.5)/M2; gl.push(gp[0],gp[1],gp[2],x,.02,-1.35); gpts[3*i]=x; gpts[3*i+1]=.04; gpts[3*i+2]=-1.35; }
    const gg=new THREE.BufferGeometry(); gg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(gl),3)); sceneG.add(new THREE.LineSegments(gg,new THREE.LineBasicMaterial({color:critHex(),transparent:true,opacity:.28})));
    const g2=new THREE.BufferGeometry(); g2.setAttribute('position',new THREE.BufferAttribute(gpts,3)); const gpt=new THREE.Points(g2,new THREE.PointsMaterial({color:critHex(),size:.14,map:sparkTex(THREE),transparent:true,opacity:.5,blending:isLight?THREE.NormalBlending:THREE.AdditiveBlending,depthWrite:false})); gpt.frustumCulled=false; sceneG.add(gpt);
    sceneG.add(tube(ctx,[gp[0],0,gp[2]],gp,critHex(),.012,.3));
    sceneG.add(CIN.prim.label(ctx,'2^'+m+' = '+N+' branches',[0,.16,1.4],{size:20,color:colors.s4,bg:true,depthTest:false}));
    sceneG.add(CIN.prim.label(ctx,'m² = '+M2+' · the slip',[1.9,.5,-1.5],{size:17,color:cssv('critical'),bg:true,depthTest:false}));
    sceneG.add(CIN.prim.label(ctx,'fence 1: slack or tight?',[rootP[0]+.08,TOP-.02,rootP[2]-.35],{size:16,color:colors.muted,bg:true,depthTest:false}));
    if(chips) chips.set(`m = <b>${m}</b> → <b>${N}</b> branches (m² would say ${M2})`,'every fence is either doing work or not — the list doubles, it does not square');
    RR(ctx); }
  function drawMany(){ if(sc) buildScene(); const N=Math.pow(2,m);
    work.innerHTML='m = 3 → <b>8</b> branches (m² would say 9 — the classic slip)<br>'+(m===3?'':'m = '+m+' → <b>'+N+'</b> branches<br>')+'m = 10 → <b>1024</b>; an SVM has one fence per training point, which is why nobody lists cases';
    check.innerHTML=''; verd.className='verdict info';
    verd.textContent=m===3?'info — 2³ = 8, not 3² = 9: each fence doubles the list':'info — '+N+' branches for '+m+' fences: the list doubles with every fence'; }
  function drawChecks(){ if(tab!=='one'){ check.innerHTML=''; return; }
    check.innerHTML=CHECKS.map((c,i)=>'<div style="color:'+(i<ticks?'var(--s3)':'var(--ink-muted)')+'">'+(i<ticks?'✓':'○')+' '+c+'</div>').join(''); }
  function drawTree(){ if(tab==='many'){ tree.innerHTML=''; return; }
    tree.innerHTML=rows().map(r=>'<button class="preset" data-b="'+r.id+'" style="text-align:left"'+(pick===r.id?' aria-pressed="true"':'')+'>'+(status[r.id]==='good'?'✓ ':status[r.id]==='dead'?'✗ ':'')+r.lab+'</button>').join('');
    tree.querySelectorAll('[data-b]').forEach(b=>b.addEventListener('click',()=>{ stop(); interrogate(b.dataset.b,run,null,true); })); }
  function idle(){ work.innerHTML='pick a branch: assume which fences are doing work, then solve and check.'; verd.className='verdict info'; verd.textContent='info — each fence is either slack (µ = 0) or tight (g = 0). Guess, solve, then test.'; drawChecks(); drawTree(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.walker){ sc.walker.show(false); } active=null; playing=false; if(sc&&sc.handle) sc.handle.setAutoRotate(.06); }
  /* one branch on trial: the bead walks down it while the algebra types; then it survives (green, a star lands) or burns out (red, dissolves, the bead falls through the map) */
  function interrogate(id,tok,done,solo){ const r=rows().find(q=>q.id===id); if(!r) return; pick=id; active=id; status[id]=null; drawTree();
    const n=r.lines.length, dur=RM?0:Math.max(1000,120*n+420); if(sc&&sc.handle) sc.handle.setAutoRotate(0);
    work.innerHTML=''; verd.className='verdict info'; verd.textContent='info — solving branch '+r.lab+' …'; ticks=0; drawChecks();
    if(chips) chips.set(`branch <b>${r.lab}</b> · solving…`,P().title);
    const typed=k=>{ work.innerHTML=r.lines.slice(0,k).map((l,i)=>'<div style="opacity:'+(0.62+0.38*(i+1)/n)+'">'+(i+1)+'. '+l+'</div>').join(''); };
    const finish=()=>{ if(tok!==run) return; typed(n); verd.className='verdict '+r.v[0]; verd.textContent=r.v[1]; status[id]=r.ok?'good':'dead'; active=null; drawTree();
      if(chips) chips.set(`<b>${r.ok?'survives':'burns out'}</b> · ${r.why.replace(/^(survives|burns out) · /,'')}`,P().title);
      if(sc){ const {ctx,hx,walker,cases}=sc, C=cases[id];
        if(r.ok){ walker.show(false); sc.starLanding=true; paintTree(); sc.star.visible=true;
          anim=tween(600,u=>{ sc.star.position.set(C.c[0],C.c[1]+.03+.9*(1-u),C.c[2]); RR(ctx); },()=>{ sc.starLanding=false; if(tok!==run) return; flare(ctx,[C.c[0],C.c[1]+.05,C.c[2]],hx('s3'),900,1.8); paintTree(); }); }
        else { sc.edges.filter(e=>e.cases.length===1&&e.cases[0]===id).forEach(e=>setEdge(e,critHex(),1,1.6)); C.ring.visible=false; RR(ctx);
          sparks(ctx,[C.c[0],C.c[1]+.05,C.c[2]],critHex(),8,700);
          anim=tween(700,u=>{ sc.edges.filter(e=>e.cases.length===1&&e.cases[0]===id).forEach(e=>e.tubes.forEach(t=>{ t.material.opacity=1-u; }));
              const p=along(C.path,1); walker.setPos([p[0],p[1]-.8*u*u,p[2]]); walker.dot.material.opacity=1-u; walker.halo.material.opacity=(sc.isLight?.32:.65)*(1-u); RR(ctx); },
            ()=>{ walker.show(false); walker.dot.material.opacity=1; walker.halo.material.opacity=sc.isLight?.32:.65; paintTree(); }); } }
      if(tab==='one'&&r.ok){ if(RM){ ticks=5; drawChecks(); } else { const nxt=()=>{ if(tok!==run) return; if(ticks>=5) return; setTimeout(()=>{ if(tok!==run) return; ticks++; drawChecks(); nxt(); },260); }; nxt(); } }
      if(done) setTimeout(()=>{ if(tok===run) done(); },RM?0:420); else if(sc&&sc.handle&&!playing) sc.handle.setAutoRotate(.06); };
    if(sc){ const {walker,cases,ctx}=sc, C=cases[id]; paintTree(); walker.show(true); walker.setPos(C.path[0]);
      if(RM){ finish(); return; }
      let shown=0; anim=tween(dur,u=>{ if(tok!==run) return; const k=Math.min(n,Math.floor((u*dur-150)/120)+1); if(k>shown){ shown=k; typed(k); } walker.setPos(along(C.path,u)); RR(ctx); },finish); }
    else { if(RM){ finish(); return; } let k=0; const nxt=()=>{ if(tok!==run) return; if(k>=n){ finish(); return; } k++; typed(k); setTimeout(nxt,120); }; nxt(); } }
  function playAll(){ stop(); const tok=run; playing=true; const rs=rows(); rs.forEach(r=>{ status[r.id]=null; }); pick=null; if(sc){ sc.star.visible=false; paintTree(); } drawTree();
    const h=sc&&sc.handle, s=h?h.ctx.orbit.sph:null, base=s?{theta:s.theta,phi:s.phi,radius:s.radius}:null;
    if(h){ h.setAutoRotate(0); camTo(h,{phi:1.22,radius:4.3*NF(),theta:base.theta+.3},900); }
    let i=0; const nxt=()=>{ if(tok!==run) return; if(i>=rs.length){ playing=false; if(h){ camTo(h,base,1200,()=>{ if(tok===run) h.setAutoRotate(.06); }); } return; }
      const r=rs[i++]; if(h) camTo(h,{theta:base.theta+(i%2?.3:-.25),phi:1.05+.1*(i%2)},900); interrogate(r.id,tok,nxt,false); };
    setTimeout(()=>{ if(tok===run) nxt(); },RM?0:500); }
  function draw(){ if(tab==='many'){ drawMany(); drawTree(); return; } pick=null; active=null; status={}; if(sc) buildScene(); idle(); paintTree(); }
  playBtn.addEventListener('click',playAll);
  bindCtl('cs-m',v=>{ m=v|0; if(tab==='many') drawMany(); },v=>String(v|0))();
  tabs(document.getElementById('cs-tabs'),t=>{ stop(); tab=t; showTab(box.closest('.widget'),t); playBar.style.display=t==='many'?'none':''; draw(); });
  showTab(box.closest('.widget'),'two');
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W12 · WHICH PROBLEMS ARE HONEST (a string between two pins, a glass tangent plane, a lit set) ================= */
(function(){
  const box=document.getElementById('bw-3d'),read=document.getElementById('bw-read'),verd=document.getElementById('bw-verdict');
  if(!box) return;
  const X=[-2,2], Y=[-1.5,1.5];
  const FN={ sq:{f:(x,y)=>x*x+y*y,g:(x,y)=>[2*x,2*y],n:'x² + y²',cv:true,sw:'alt'},
    w:{f:(x,y)=>x*x*x*x-3*x*x+y*y,g:(x,y)=>[4*x*x*x-6*x,2*y],n:'x⁴ − 3x² + y²',cv:false,sw:'x'},
    abs:{f:(x,y)=>Math.abs(x)+Math.abs(y),g:(x,y)=>[Math.sign(x),Math.sign(y)],n:'|x| + |y|',cv:true,sw:'alt'},
    exp:{f:(x,y)=>Math.exp(x)+y*y,g:(x,y)=>[Math.exp(x),2*y],n:'eˣ + y²',cv:true,sw:'alt'},
    cube:{f:(x,y)=>x*x-y*y,g:(x,y)=>[2*x,-2*y],n:'x² − y²',cv:false,sw:'alt'},
    sqrt:{f:(x,y)=>4-x*x-y*y,g:(x,y)=>[-2*x,-2*y],n:'4 − x² − y²',cv:false,sw:'alt'} };
  const a1=Math.atan2(0.95,0.8125), b1=Math.atan2(0.95,0.0125), NF=()=>box.clientWidth<560?1.25:1;
  const SETS={
    disc:{n:'a disc',cv:true,inS:p=>Math.hypot(p[0],p[1])<=1.25,tour:t=>{ const a=2*Math.PI*t; return [1.05*Math.cos(a),1.05*Math.sin(a)]; },
      shape:T=>{ const s=new T.Shape(); s.absarc(0,0,1.25,0,2*Math.PI,false); return s; }},
    poly:{n:'a polygon',cv:true,inS:p=>{ for(let k=0;k<5;k++){ const a=Math.PI/2+2*Math.PI*k/5; if(p[0]*Math.cos(a)+p[1]*Math.sin(a)>1.1+1e-9) return false; } return true; },
      tour:t=>{ const a=2*Math.PI*t; return [0.82*Math.cos(a),0.82*Math.sin(a)]; },
      shape:T=>{ const s=new T.Shape(); for(let k=0;k<5;k++){ const a=Math.PI/2+2*Math.PI*k/5, b=Math.PI/2+2*Math.PI*(k+1)/5, den=Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b);
          const q=[(1.1*Math.sin(b)-1.1*Math.sin(a))/den,(1.1*Math.cos(a)-1.1*Math.cos(b))/den]; if(k) s.lineTo(q[0],q[1]); else s.moveTo(q[0],q[1]); } s.closePath(); return s; }},
    ring:{n:'an annulus',cv:false,inS:p=>{ const r=Math.hypot(p[0],p[1]); return r>=0.62&&r<=1.32; },tour:t=>{ const a=2*Math.PI*t; return [0.97*Math.cos(a),0.97*Math.sin(a)]; },
      shape:T=>{ const s=new T.Shape(); s.absarc(0,0,1.32,0,2*Math.PI,false); const h=new T.Path(); h.absarc(0,0,0.62,0,2*Math.PI,true); s.holes.push(h); return s; }},
    moon:{n:'a crescent',cv:false,inS:p=>Math.hypot(p[0],p[1])<=1.25&&Math.hypot(p[0]-0.8,p[1])>=0.95,tour:t=>{ const a=Math.PI*(0.28+1.44*t); return [1.06*Math.cos(a),1.06*Math.sin(a)]; },
      shape:T=>{ const s=new T.Shape(); s.absarc(0,0,1.25,a1,2*Math.PI-a1,false); s.absarc(0.8,0,0.95,2*Math.PI-b1,b1,true); s.closePath(); return s; }} };
  let tab='chord',key='sq',skey='disc',pin=[{u:.18,y:-.55},{u:.86,y:.45}],th=0.5,sweep=null,anim=null,run=0,sc=null,ST=null,chips=null,drag=-1;
  const Q=()=>FN[key], xOf=u=>X[0]+(X[1]-X[0])*u;
  const pinXY=k=>tab==='sets'?SETS[skey].tour(pin[k].u):[xOf(pin[k].u),pin[k].y];
  const range=R=>{ let lo=Infinity,hi=-Infinity; for(let i=0;i<=40;i++) for(let j=0;j<=30;j++){ const v=R.f(X[0]+4*i/40,Y[0]+3*j/30); if(v<lo) lo=v; if(v>hi) hi=v; } return [lo,hi]; };
  const chordFail=(R,A,B)=>{ for(const t of [0.35,0.5,0.65]){ const m=[t*A[0]+(1-t)*B[0],t*A[1]+(1-t)*B[1]]; if(R.f(m[0],m[1])>t*R.f(A[0],A[1])+(1-t)*R.f(B[0],B[1])+1e-9) return true; } return false; };
  function pairs(R){ const out=[]; for(let i=0;i<200;i++){ const a=xOf((i*0.6180339887498949)%1), b=xOf((i*0.2360679774997896+0.37)%1), y=Y[0]+3*((i*0.7548776662466927+0.11)%1);
      if(R.sw==='x'||i%2===0) out.push([[a,y],[b,y]]); else { const x=xOf((i*0.6180339887498949)%1), ya=Y[0]+3*((i*0.2360679774997896+0.37)%1), yb=Y[0]+3*((i*0.7548776662466927+0.11)%1); out.push([[x,ya],[x,yb]]); } } return out; }
  const tanFail=(R,p)=>{ const f0=R.f(p[0],p[1]), g=R.g(p[0],p[1]); for(let i=0;i<=20;i++) for(let j=0;j<=14;j++){ const x=X[0]+4*i/20, y=Y[0]+3*j/14; if(R.f(x,y)<f0+g[0]*(x-p[0])+g[1]*(y-p[1])-1e-6) return true; } return false; };
  const tanTour=t=>{ const a=2*Math.PI*t; return [1.75*Math.cos(a),1.25*Math.sin(2*a)]; };
  function build(){
    sc=null; const narrow=box.clientWidth<560;
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:narrow?[4.0,3.3,5.3]:[3.4,2.7,4.4],look:[0,.45,0],fov:36},autoRotate:.05,autoRotateStopsOnUser:true,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const sceneG=new THREE.Group(); root.add(sceneG);
        const matOK=new THREE.MeshStandardMaterial({color:hx('s3'),emissive:hx('s3'),emissiveIntensity:isLight?.15:.8,roughness:.3});
        const matBad=new THREE.MeshStandardMaterial({color:critHex(),emissive:critHex(),emissiveIntensity:isLight?.2:.9,roughness:.3});
        [matOK,matBad].forEach(mm=>{ mm.depthTest=false; mm.depthWrite=false; mm.transparent=true; });
        const str=new THREE.Group(); root.add(str); const segs=[]; for(let i=0;i<40;i++){ const t=tube(ctx,[0,0,0],[0,1,0],hx('s3'),.02); t.material.dispose(); t.material=matOK; t.renderOrder=11; str.add(t); segs.push(t); }
        const pins=[walkerChar(ctx,hx('s4'),.055),walkerChar(ctx,hx('s4'),.055)];
        const bead=overlay(CIN.prim.dot(ctx,[0,0,0],hx('s7'),.03),12); root.add(bead); const tick=tube(ctx,[0,0,0],[0,1,0],hx('s7'),.012); root.add(tick);
        const lab=slot(ctx,root); const lab2=slot(ctx,root); const flab=slot(ctx,root);
        const scarG=new THREE.Group(); root.add(scarG);
        const dragPlane=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})); dragPlane.rotation.x=-Math.PI/2; root.add(dragPlane);
        sc={THREE,ctx,root,colors,isLight,hx,sceneG,str,segs,matOK,matBad,pins,bead,tick,lab,lab2,flab,scarG,dragPlane,surf:null,contG:null,zs:1,zmin:0,plane:null,floor:null,base:null,handle:null,pick:null};
        chips=hudPair(box); hint(box,'drag to orbit · drag a pin');
        buildScene(); paint();
      },
      update(){ if(sc) mirror(); return false; }
    });
    if(handle&&sc){ sc.handle=handle; sc.pick=picker(handle,()=>sc.dragPlane);
      /* a pin is grabbed by its screen position (it may sit in a well the surface hides), then dragged on a level plane at its own height */
      grab(handle,e=>{ if(!sc) return false; const want=tab==='tangent'?[0]:[0,1]; const k=nearPin(e,want); if(k<0) return false; stop(); drag=k; sc.dragPlane.position.y=sc.pins[k].g.position.y; return true; },
        e=>{ if(!sc||drag<0) return; const h=sc.pick(e); if(!h) return; const x=Math.max(X[0],Math.min(X[1],h.x)), y=Math.max(Y[0],Math.min(Y[1],-h.z));
          if(tab==='sets'){ const S=SETS[skey]; let bt=0,bd=Infinity; for(let i=0;i<=160;i++){ const q=S.tour(i/160), d=Math.hypot(q[0]-x,q[1]-y); if(d<bd){ bd=d; bt=i/160; } } pin[drag].u=bt; }
          else { pin[drag].u=(x-X[0])/(X[1]-X[0]); pin[drag].y=y; }
          setCtl(drag?'bw-b':'bw-a',pin[drag].u,3); draw(); },
        ()=>{ drag=-1; }); }
    return handle;
  }
  const at=(x,y)=>[x,(Q().f(x,y)-sc.zmin)*sc.zs,-y];
  function nearPin(e,want){ const {THREE,ctx,pins}=sc, r=ctx.renderer.domElement.getBoundingClientRect(), v=new THREE.Vector3(); let best=-1,bd=42;
    want.forEach(k=>{ v.copy(pins[k].g.position).project(ctx.camera); const d=Math.hypot((v.x+1)/2*r.width-(e.clientX-r.left),(1-v.y)/2*r.height-(e.clientY-r.top)); if(d<bd){ bd=d; best=k; } }); return best; }
  function levels(){ const [lo,hi]=[sc.zmin,sc.zmax]; const lv=[]; for(let i=1;i<=9;i++) lv.push(lo+(hi-lo)*i/10); return lv; }
  /* the scene for a tab: the lit surface (string / tangent) or the floor with the lit shape (sets) */
  function buildScene(){ if(!sc) return; const {THREE,ctx,sceneG,hx,colors,isLight}=sc; clearGroup(sceneG); sc.surf=null; sc.plane=null; sc.floor=null; sc.contG=null; sc.base=null; clearGroup(sc.scarG);
    const grid=CIN.prim.grid(ctx,5.2,20,hx('grid'),{opacity:isLight?.45:.3}); grid.position.y=-.14; sceneG.add(grid);
    if(tab==='sets'){ const S=SETS[skey];
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(5.2,4.2),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.3:.5})); floor.rotation.x=-Math.PI/2; floor.position.y=-.01; sceneG.add(floor); sc.floor=floor;
      const geo=new THREE.ExtrudeGeometry(S.shape(THREE),{depth:.07,bevelEnabled:false,curveSegments:48});
      const shape=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:hx('s3'),emissive:hx('s3'),emissiveIntensity:isLight?.12:.35,roughness:.4,transparent:true,opacity:isLight?.55:.62})); shape.rotation.x=-Math.PI/2; shape.position.y=-.07; sceneG.add(shape);
      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo,20),new THREE.LineBasicMaterial({color:hx('s3'),transparent:true,opacity:.9})); edges.rotation.x=-Math.PI/2; edges.position.y=-.068; sceneG.add(edges);
      sceneG.add(CIN.prim.label(ctx,S.n,[0,.02,1.75],{size:20,color:colors.s3,bg:false,depthTest:false}));
      sc.str.visible=true; sc.bead.visible=false; sc.tick.visible=false; sc.pins[1].show(true); return; }
    const R=Q(), [lo,hi]=range(R), zs=1.35/((hi-lo)||1); sc.zs=zs; sc.zmin=lo; sc.zmax=hi;
    const surf=CIN.prim.surface(ctx,R.f,{x:X,y:Y,res:70,zscale:zs,ramp:[colors.s1,colors.s7,colors.s2],opacity:.94}); lightenSurface(ctx,surf,zs); surf.position.y=-lo*zs; sceneG.add(surf); sc.surf=surf;
    sc.base=new Float32Array(surf.userData.geo.attributes.color.array);
    const contG=new THREE.Group(); contG.position.y=-lo*zs; sceneG.add(contG); contG.add(liftedContours(ctx,R.f,levels(),X[0],X[1],Y[0],Y[1],zs,hx('ink2'),{N:64})); sc.contG=contG;
    if(tab==='tangent'){ const g=new THREE.Group(); const pane=overlay(CIN.prim.glass(ctx,1.7,1.7,hx('s3'),isLight?.22:.26),8); pane.material.opacity=isLight?.22:.26; g.add(pane);
      const fr=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.7,1.7)),new THREE.LineBasicMaterial({color:hx('s3'),transparent:true,opacity:.85,depthTest:false})); fr.renderOrder=9; g.add(fr); sceneG.add(g); sc.plane={g,pane,fr}; }
    sc.str.visible=tab==='chord'; sc.bead.visible=tab==='chord'; sc.tick.visible=tab==='chord'; sc.pins[1].show(tab!=='tangent'); }
  function reshapeSurf(){ if(!sc||!sc.surf) return; const R=Q(), [lo,hi]=range(R), zs=1.35/((hi-lo)||1); sc.zs=zs; sc.zmin=lo; sc.zmax=hi;
    reshape(sc.ctx,sc.surf,R.f,zs,null,1); sc.surf.position.y=-lo*zs; sc.base=new Float32Array(sc.surf.userData.geo.attributes.color.array);
    clearGroup(sc.contG); sc.contG.position.y=-lo*zs; sc.contG.add(liftedContours(sc.ctx,R.f,levels(),X[0],X[1],Y[0],Y[1],zs,sc.hx('ink2'),{N:64})); clearGroup(sc.scarG); }
  /* the string: forty short tubes, each coloured by whether it hangs below the surface */
  function paintString(A,B,below){ const {segs,matOK,matBad,THREE}=sc; let bad=0; const pa=at(A[0],A[1]), pb=at(B[0],B[1]);
    for(let i=0;i<40;i++){ const t0=i/40, t1=(i+1)/40, p0=[pa[0]+(pb[0]-pa[0])*t0,pa[1]+(pb[1]-pa[1])*t0+.012,pa[2]+(pb[2]-pa[2])*t0], p1=[pa[0]+(pb[0]-pa[0])*t1,pa[1]+(pb[1]-pa[1])*t1+.012,pa[2]+(pb[2]-pa[2])*t1];
      const tm=(t0+t1)/2, m=[A[0]+(B[0]-A[0])*tm,A[1]+(B[1]-A[1])*tm], chord=Q().f(A[0],A[1])+(Q().f(B[0],B[1])-Q().f(A[0],A[1]))*tm, isBad=below(m,chord); if(isBad) bad++;
      aimTube(THREE,segs[i],p0,p1); segs[i].material=isBad?matBad:matOK; segs[i].visible=true; } return bad; }
  function paintSeg(A,B,inS){ const {segs,matOK,matBad,THREE}=sc; let bad=0;
    for(let i=0;i<40;i++){ const t0=i/40, t1=(i+1)/40, tm=(t0+t1)/2, m=[A[0]+(B[0]-A[0])*tm,A[1]+(B[1]-A[1])*tm], isBad=!inS(m); if(isBad) bad++;
      aimTube(THREE,segs[i],[A[0]+(B[0]-A[0])*t0,.05,-(A[1]+(B[1]-A[1])*t0)],[A[0]+(B[0]-A[0])*t1,.05,-(A[1]+(B[1]-A[1])*t1)]); segs[i].material=isBad?matBad:matOK; } return bad; }
  function paintPlane(A){ const {plane,surf,base,THREE,hx}=sc; if(!plane||!surf) return 0; const R=Q(), f0=R.f(A[0],A[1]), g=R.g(A[0],A[1]), zs=sc.zs, p=at(A[0],A[1]);
    plane.g.position.set(p[0],p[1]+.006,p[2]); const n=new THREE.Vector3(-g[0]*zs,1,g[1]*zs).normalize(); plane.g.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);
    const geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color, crit=new THREE.Color(critHex()).convertSRGBToLinear(); let fails=0, tot=0;
    for(let i=0;i<pos.count;i++){ const x=pos.getX(i), y=-pos.getZ(i), d=R.f(x,y)-(f0+g[0]*(x-A[0])+g[1]*(y-A[1])); tot++;
      if(d<-1e-4){ fails++; const k=Math.min(1,-d*2/((sc.zmax-sc.zmin)||1)+.55); col.setXYZ(i,base[3*i]+(crit.r-base[3*i])*k,base[3*i+1]+(crit.g-base[3*i+1])*k,base[3*i+2]+(crit.b-base[3*i+2])*k); }
      else col.setXYZ(i,base[3*i],base[3*i+1],base[3*i+2]); }
    col.needsUpdate=true; const c=fails?critHex():hx('s3'); plane.pane.material.color.setHex(c); plane.pane.material.emissive.setHex(c); plane.fr.material.color.setHex(c); return fails/tot; }
  function mirror(){ const {pins,ctx,THREE}=sc, v=new THREE.Vector3(); box.dataset.pins=JSON.stringify(pins.map(p=>{ v.copy(p.g.position).project(ctx.camera); return [+((v.x+1)/2).toFixed(3),+((1-v.y)/2).toFixed(3)]; })); }
  function paint(){ if(!sc) return; paintCore(); mirror(); }
  function paintCore(){ const {pins,bead,tick,lab,lab2,flab,ctx,hx,THREE}=sc; const A=pinXY(0), B=pinXY(1), R=Q(); if(tab!=='sets') flab.set('f = '+R.n,[0,-.1,1.85],{size:20,color:sc.colors.ink2,bg:false,depthTest:false}); else flab.hide();
    if(tab==='sets'){ const S=SETS[skey]; pins[0].setPos([A[0],.05,-A[1]]); pins[1].setPos([B[0],.05,-B[1]]); const bad=paintSeg(A,B,S.inS);
      lab.set('x',[A[0],.3,-A[1]],{size:18,color:sc.colors.s4,bg:false,depthTest:false}); lab2.set('y',[B[0],.3,-B[1]],{size:18,color:sc.colors.s4,bg:false,depthTest:false});
      if(chips) chips.set(`${S.n} · the segment <b>${bad?'leaves the set':'stays inside'}</b>`,sweep&&sweep.done?`the segment left the set at <b>${sweep.bad}</b> of 200 positions`:'drag a pin around the rim'); RR(ctx); return; }
    const pa=at(A[0],A[1]); pins[0].setPos([pa[0],pa[1]+.012,pa[2]]);
    if(tab==='tangent'){ const frac=paintPlane(A); lab.set('tangent plane at ('+F(A[0],2)+', '+F(A[1],2)+')',[pa[0],pa[1]+.42,pa[2]],{size:17,color:sc.colors.s4,bg:true,depthTest:false}); lab2.hide();
      if(chips) chips.set(`f = ${R.n} · the plane <b>${frac>0?'pokes out of the surface':'stays under the surface'}</b>`,sweep&&sweep.done?`the tangent test failed at <b>${sweep.bad}</b> of 200 points`:'drag the pin'); RR(ctx); return; }
    const pb=at(B[0],B[1]); pins[1].setPos([pb[0],pb[1]+.012,pb[2]]);
    const fa=R.f(A[0],A[1]), fb=R.f(B[0],B[1]); const bad=paintString(A,B,(m,chord)=>R.f(m[0],m[1])>chord+1e-9);
    const mx=[th*A[0]+(1-th)*B[0],th*A[1]+(1-th)*B[1]], lhs=R.f(mx[0],mx[1]), rhs=th*fa+(1-th)*fb, pm=at(mx[0],mx[1]), pc=[pm[0],(rhs-sc.zmin)*sc.zs+.012,pm[2]];
    bead.position.set(pc[0],pc[1],pc[2]); aimTube(THREE,tick,[pm[0],pm[1]+.012,pm[2]],pc); const tc=lhs<=rhs+1e-9?hx('s7'):critHex(); tick.material.color.setHex(tc); tick.material.emissive.setHex(tc); bead.material.color.setHex(tc); bead.material.emissive.setHex(tc);
    lab.set('x',[pa[0],pa[1]+.3,pa[2]],{size:18,color:sc.colors.s4,bg:false,depthTest:false}); lab2.set('y',[pb[0],pb[1]+.3,pb[2]],{size:18,color:sc.colors.s4,bg:false,depthTest:false});
    if(chips) chips.set(`f = ${R.n} · the string <b>${bad?'passes under the surface':'stays clear'}</b>`,sweep&&sweep.done?`the chord test failed at <b>${sweep.bad}</b> of 200`:(sweep?`the chord test failed at <b>${sweep.bad}</b> of ${sweep.shown}`:'drag a pin · the red part hangs below the surface'));
    RR(ctx); }
  function scars(){ if(!sc) return; clearGroup(sc.scarG); if(!sweep||tab!=='chord') return; const {THREE,hx}=sc; const good=[],bad=[];
    sweep.pairs.slice(0,sweep.shown).forEach(([A,B,f])=>{ const a=at(A[0],A[1]), b=at(B[0],B[1]); (f?bad:good).push(a[0],a[1]+.02,a[2],b[0],b[1]+.02,b[2]); });
    [[good,hx('s3'),.18],[bad,critHex(),.75]].forEach(([arr,c,op])=>{ if(!arr.length) return; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(arr),3)); const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:op})); l.frustumCulled=false; sc.scarG.add(l); }); }
  function draw(){ const R=Q();
    if(tab==='sets'){ const S=SETS[skey], A=S.tour(pin[0].u), B=S.tour(pin[1].u); let out=0; for(let i=0;i<=120;i++){ const u=i/120; if(!S.inS([A[0]+(B[0]-A[0])*u,A[1]+(B[1]-A[1])*u])) out++; }
      read.innerHTML='the segment leaves the set: <b>'+(out>0?'yes':'no')+'</b>'+(out>0?' ('+F(out/121*100,0)+' % of it is outside)':'')+'<br>a convex set contains every segment between two of its points — no exceptions, no thin bits';
      if(out>0){ verd.className='verdict bad'; verd.textContent='bad — not a convex set: two allowed points with a banned stretch between them'; }
      else { verd.className='verdict '+(S.cv?'good':'info'); verd.textContent=S.cv?'good — a convex set: every segment stays inside':'info — this pair stays inside, but drag the points across the hole'; } paint(); return; }
    const A=pinXY(0), B=pinXY(1);
    if(tab==='tangent'){ const f0=R.f(A[0],A[1]), g=R.g(A[0],A[1]); let fails=0,tot=0; for(let i=0;i<=40;i++) for(let j=0;j<=30;j++){ const x=X[0]+4*i/40, y=Y[0]+3*j/30; tot++; if(R.f(x,y)<f0+g[0]*(x-A[0])+g[1]*(y-A[1])-1e-6) fails++; }
      let bad=0; for(let k=0;k<200;k++){ if(tanFail(R,tanTour(k/200))) bad++; }
      read.innerHTML='f(y) ≥ f(x) + ∇f(x)ᵀ(y−x)?  <b>'+(fails?'fails on '+F(fails/tot*100,0)+' % of the surface':'holds everywhere')+'</b><br>'+
        'over the whole surface, <b>'+bad+'</b> of 200 tangent points fail — the chord test fails on exactly the same surfaces<br>'+
        'the two tests agree on every surface here: a string that passes under is exactly a plane that pokes out';
      if(!fails){ verd.className='verdict '+(R.cv?'good':'info'); verd.textContent=R.cv?'good — the surface never falls below a tangent plane: a bowl':'info — this tangent is safe; drag the pin to where the surface bends the wrong way'; }
      else { verd.className='verdict bad'; verd.textContent='bad — the surface dives under its own tangent plane: not a bowl'; } paint(); return; }
    const fa=R.f(A[0],A[1]), fb=R.f(B[0],B[1]), mx=[th*A[0]+(1-th)*B[0],th*A[1]+(1-th)*B[1]], lhs=R.f(mx[0],mx[1]), rhs=th*fa+(1-th)*fb;
    read.innerHTML='θ = <b>'+F(th,2)+'</b>  ·  f(θx+(1−θ)y) = <b>'+F(lhs,4)+'</b>  ·  θf(x)+(1−θ)f(y) = <b>'+F(rhs,4)+'</b>  ·  <b>'+(lhs<=rhs+1e-9?'≤ holds':'FAILS')+'</b>'+
      (sweep&&sweep.done?'<br>the chord test failed at <b>'+sweep.bad+'</b> of 200 sampled pairs':'')+
      '<br>x = (<b>'+F(A[0],2)+'</b>, <b>'+F(A[1],2)+'</b>) · y = (<b>'+F(B[0],2)+'</b>, <b>'+F(B[1],2)+'</b>) · f(x) = '+F(fa,3)+', f(y) = '+F(fb,3);
    if(lhs<=rhs+1e-9){ verd.className='verdict '+(R.cv?'good':'info'); verd.textContent=R.cv?'good — a bowl: no chord ever cuts into it, so a stopping point is THE answer':'info — this pair passes, but the function is not a bowl: press ▶ to find the pairs that fail'; }
    else { verd.className='verdict bad'; verd.textContent='bad — the chord dips below the curve: this is not a bowl, so a stopping point is only a candidate'; }
    paint(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.handle) sc.handle.setAutoRotate(.05); }
  /* ▶: the string tries 200 pairs, every failed pair leaving a red scar on the surface; on the other tabs the pin tours the surface / the rim */
  function play(){ stop(); const tok=run; const R=Q(); const keep=pin.map(p=>({u:p.u,y:p.y}));
    if(sc&&sc.handle){ sc.handle.setAutoRotate(0); const s=sc.handle.ctx.orbit.sph; camTo(sc.handle,{phi:Math.min(s.phi,1.0),radius:Math.max(s.radius,5.2*NF())},1200); }
    const restore=()=>{ pin=keep; setCtl('bw-a',pin[0].u,3); setCtl('bw-b',pin[1].u,3); draw(); if(sc&&sc.handle) sc.handle.setAutoRotate(.05); };
    if(tab==='sets'){ const S=SETS[skey]; const N=200; let bad=0; const test=t=>{ const A=S.tour(pin[0].u), B=S.tour(t); for(let i=0;i<=40;i++){ const u=i/40; if(!S.inS([A[0]+(B[0]-A[0])*u,A[1]+(B[1]-A[1])*u])) return true; } return false; };
      for(let k=0;k<N;k++) if(test(0.02+0.96*k/(N-1))) bad++; sweep={bad,done:false,shown:0};
      if(RM){ sweep.done=true; restore(); return; }
      anim=tween(3000,u=>{ if(tok!==run) return; pin[1].u=0.02+0.96*u; sweep.shown=Math.round(u*N); setCtl('bw-b',pin[1].u,3); draw(); },()=>{ if(tok!==run) return; sweep.done=true; restore(); }); return; }
    if(tab==='tangent'){ const N=200; let bad=0; for(let k=0;k<N;k++) if(tanFail(R,tanTour(k/N))) bad++; sweep={bad,done:false,shown:0};
      if(RM){ sweep.done=true; restore(); return; }
      anim=tween(3000,u=>{ if(tok!==run) return; const p=tanTour(u); pin[0].u=(p[0]-X[0])/4; pin[0].y=p[1]; sweep.shown=Math.round(u*N); setCtl('bw-a',pin[0].u,3); draw(); },()=>{ if(tok!==run) return; sweep.done=true; restore(); }); return; }
    const PR=pairs(R).map(([A,B])=>[A,B,chordFail(R,A,B)]); const bad=PR.filter(p=>p[2]).length; sweep={pairs:PR,bad:0,shown:0,done:false};
    if(RM){ sweep.shown=200; sweep.bad=bad; sweep.done=true; scars(); restore(); return; }
    anim=tween(3000,u=>{ if(tok!==run) return; const k=Math.max(1,Math.round(u*200)); if(k!==sweep.shown){ sweep.shown=k; sweep.bad=PR.slice(0,k).filter(p=>p[2]).length; const [A,B]=PR[k-1]; pin[0].u=(A[0]-X[0])/4; pin[0].y=A[1]; pin[1].u=(B[0]-X[0])/4; pin[1].y=B[1]; scars(); draw(); } },
      ()=>{ if(tok!==run) return; sweep.shown=200; sweep.bad=bad; sweep.done=true; scars(); restore(); if(sc&&bad) flare(sc.ctx,[0,.9,0],critHex(),800,1.4); }); }
  document.getElementById('bw-play').addEventListener('click',play);
  const fbar=document.getElementById('bw-f'), sbar=document.getElementById('bw-s');
  fbar.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{ stop(); pressOnly(fbar,b); key=b.dataset.f; sweep=null; reshapeSurf(); draw(); }));
  sbar.querySelectorAll('[data-s]').forEach(b=>b.addEventListener('click',()=>{ stop(); pressOnly(sbar,b); skey=b.dataset.s; sweep=null; if(sc) buildScene(); draw(); }));
  bindCtl('bw-a',v=>{ stop(); pin[0].u=v; draw(); },v=>fmt(v,3))();
  bindCtl('bw-b',v=>{ stop(); pin[1].u=v; draw(); },v=>fmt(v,3))();
  bindCtl('bw-th',v=>{ th=v; draw(); },v=>fmt(v,2))();
  tabs(document.getElementById('bw-tabs'),t=>{ stop(); tab=t; sweep=null;
    fbar.style.display=t==='sets'?'none':''; sbar.style.display=t==='sets'?'':'none';
    document.getElementById('bw-b').parentNode.style.display=t==='tangent'?'none':'';
    document.getElementById('bw-th').parentNode.style.display=t==='chord'?'':'none'; if(sc) buildScene(); if(sc&&sc.handle){ sc.handle.ctx.look.y=t==='sets'?0:.45; camTo(sc.handle,t==='sets'?{phi:1.0,radius:4.6*NF()}:{phi:1.2,radius:6.0*NF()},900); } draw(); });
  sbar.style.display='none'; document.getElementById('bw-th').parentNode.style.display='';
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
  /* self-check: the two sweep counts this unit quotes */
  (function(){ const a=pairs(FN.sq).filter(([A,B])=>chordFail(FN.sq,A,B)).length, b=pairs(FN.w).filter(([A,B])=>chordFail(FN.w,A,B)).length;
    console.info('U11 chord sweep · bowl fails '+a+' of 200 · wavy fails '+b+' of 200'); if(a!==0||b!==119) console.warn('W12 sweep counts unexpected',a,b); })();
})();

/* ================= W13 · WHO MOVES FIRST (two facing panels and a beam · a sheaf of forty rods and the ridge under them · the gap as a ruler) ================= */
(function(){
  const box=document.getElementById('du-3d'),caseBar=document.getElementById('du-case'),read=document.getElementById('du-read'),verd=document.getElementById('du-verdict');
  if(!box) return;
  const NF=()=>box.clientWidth<560?1.25:1;   /* a phone stage is narrow: every camera radius is scaled up */
  /* the non-convex tab's two problems. d(µ) = min over x of f + µg, by a fine grid then Newton on h' = 0. */
  const GAP={
    bands:{name:'f(x) = x   subject to  g(x) = (x² − 1)(x² − 4) ≤ 0',
      f:x=>x, g:x=>(x*x-1)*(x*x-4), XR:[-7,7], N:6000, MU:0.5, pstar:-2, xp:-2,
      hd:(x,m)=>1+m*(4*x*x*x-10*x), hdd:(x,m)=>m*(12*x*x-10), bands:[[-2,-1],[1,2]], GX:[-2.6,2.6], V:[-3.2,3.0]},
    wells:{name:'f(x) = (x² − 1)² + 0.4x   subject to  g(x) = −x ≤ 0',
      f:x=>Math.pow(x*x-1,2)+0.4*x, g:x=>-x, XR:[-2.2,2.2], N:6000, MU:1.2, pstar:null, xp:0.945650,
      hd:(x,m)=>4*x*(x*x-1)+0.4-m, hdd:()=>0, bands:[[0,2.2]], GX:[-1.4,1.35], V:[-0.9,1.05], hdd2:x=>12*x*x-4},
  };
  function dOfCase(C,mu){ if(!(mu>0)&&C===GAP.bands) return {d:-Infinity,x:C.XR[0]};
    const h=x=>C.f(x)+mu*C.g(x); let bx=C.XR[0],bv=Infinity;
    for(let i=0;i<=C.N;i++){ const x=C.XR[0]+(C.XR[1]-C.XR[0])*i/C.N, v=h(x); if(v<bv){ bv=v; bx=x; } }
    let x=bx; for(let k=0;k<12;k++){ const d1=C.hd(x,mu), d2=C.hdd2?C.hdd2(x):C.hdd(x,mu); if(!isFinite(d2)||Math.abs(d2)<1e-9) break;
      const nx=x-d1/d2; if(!isFinite(nx)||nx<C.XR[0]||nx>C.XR[1]) break; x=nx; }
    const v=h(x); return v<bv?{d:v,x}:{d:bv,x:bx}; }
  function starOf(C){ let best=-Infinity,bm=0;
    for(let i=1;i<=1200;i++){ const mu=C.MU*i/1200, v=dOfCase(C,mu).d; if(v>best){ best=v; bm=mu; } }
    let lo=Math.max(0,bm-C.MU/1200), hi=Math.min(C.MU,bm+C.MU/1200);
    for(let k=0;k<80;k++){ const a=lo+(hi-lo)*.382, b=lo+(hi-lo)*.618; if(dOfCase(C,a).d<dOfCase(C,b).d) lo=a; else hi=b; }
    const mu=(lo+hi)/2; return {mu,d:dOfCase(C,mu).d}; }
  function pOf(C){ if(C.pstar!=null) return C.pstar; let b=Infinity;
    for(let i=0;i<=20000;i++){ const x=C.bands[0][0]+(C.bands[0][1]-C.bands[0][0])*i/20000; b=Math.min(b,C.f(x)); } return b; }
  const MEMO={};
  function facts(k){ if(MEMO[k]) return MEMO[k]; const C=GAP[k], s=starOf(C), p=pOf(C);
    const DS=[]; for(let i=0;i<=72;i++){ const m=C.MU*i/72; DS.push([m,dOfCase(C,m).d]); }
    return MEMO[k]={C,dstar:s.d,mustar:s.mu,pstar:p,gap:p-s.d,DS}; }
  const fP=x=>(x-3)*(x-3), gP=x=>x-1, dP=m=>2*m-m*m/4;
  const XS=[]; for(let i=0;i<40;i++) XS.push(-1+6*i/39);
  const dB=m=>{ let lo=Infinity; XS.forEach(x=>{ lo=Math.min(lo,fP(x)+m*gP(x)); }); return lo; };
  let tab='two',cs='bands',dx=1,dmu=4,dxl=3,run=0,anim=null,sc=null,ST=null,chips=null,met=false;
  /* the bundle's world: µ → x, L → height, x → depth */
  const BX=m=>(m-4)*.45, BY=L=>(L+3)*(1.6/13.5), BZ=x=>(x-2)/3*.6, LCLIP=[-3,9.5];
  const VIEWS={two:{theta:.12,phi:1.22,radius:6.0},gap:{theta:.12,phi:1.22,radius:6.0},bundle:{theta:.22,phi:1.2,radius:5.5}};
  const VW=t=>({theta:VIEWS[t].theta,phi:VIEWS[t].phi,radius:VIEWS[t].radius*NF()});
  function build(){
    sc=null; const narrow=box.clientWidth<560; const v=VIEWS[tab], r=v.radius*NF(), look=[0,.75,0];
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:[look[0]+r*Math.sin(v.theta)*Math.sin(v.phi),look[1]+r*Math.cos(v.phi),look[2]+r*Math.cos(v.theta)*Math.sin(v.phi)],look,fov:36},autoRotate:0,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const sceneG=new THREE.Group(); root.add(sceneG);
        const grid=CIN.prim.grid(ctx,6,24,hx('grid'),{opacity:isLight?.45:.3}); grid.position.y=-.12; root.add(grid);
        const wP=walkerChar(ctx,hx('s2'),.05), wD=walkerChar(ctx,hx('s3'),.05); const wX=walkerChar(ctx,hx('s4'),.05);
        const lab=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,sceneG,wP,wD,wX,lab,L:null,R:null,beam:null,ruler:null,hl:null,handle:null,theta0:v.theta,story:false,user:false};
        chips=hudPair(box); hint(box,'drag to orbit');
        buildScene(); paint();
      },
      /* the slow swing: the camera rocks ±0.2 rad so the panels' and rods' depth reads; it yields to a story and to the user's own drag */
      update(ctx,t){ if(!sc||!sc.handle||sc.story||sc.user||RM) return false; const o=sc.handle.ctx.orbit; o.sph.theta=sc.theta0+.2*Math.sin(t*.4); o.place(); return true; }
    });
    if(handle){ grab(handle,()=>{ if(sc) sc.user=true; return false; },()=>{}); if(sc) sc.handle=handle; }
    return handle;
  }
  const resume=()=>{ if(!sc||!sc.handle) return; sc.theta0=sc.handle.ctx.orbit.sph.theta-.2*Math.sin(performance.now()/1000*.4); sc.story=false; };
  const world=(P,u,v,lift)=>{ const {THREE}=sc; P.g.updateMatrixWorld(true); const q=P.g.localToWorld(new THREE.Vector3(...P.toLocal(u,v))); return [q.x,q.y+(lift||0),q.z]; };
  /* a dark strip on a panel (the banned part) or a lit one (the feasible set) */
  function strip(P,u0,u1,color,op,h){ const {THREE}=sc; const w=Math.max(.001,(u1-u0))*P.W, m=new THREE.Mesh(new THREE.PlaneGeometry(w,(h||1)*P.H),new THREE.MeshBasicMaterial({color,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide}));
    m.position.set(((u0+u1)/2-.5)*P.W,((h||1)/2-.5)*P.H,.006); P.g.add(m); return m; }
  function twoPanels(){ const {THREE,ctx,sceneG,hx,colors,isLight}=sc;
    const L=glassPanel(ctx,{w:2.1,h:1.5,pos:[-1.2,.85,0],yaw:.5,color:'s1'}), R=glassPanel(ctx,{w:2.1,h:1.5,pos:[1.2,.85,0],yaw:-.5,color:'s3'}); sceneG.add(L.g); sceneG.add(R.g); sc.L=L; sc.R=R;
    if(tab==='two'){ const X0=-1,X1=5,V0=-1,V1=10.5,M0=0,M1=10; const ux=x=>(x-X0)/(X1-X0), vv=y=>(y-V0)/(V1-V0), um=m=>(m-M0)/(M1-M0); sc.map={ux,vv,um};
      strip(L,ux(1),1,isLight?hx('s2'):0x000000,isLight?.12:.42); const fence=tube(ctx,L.toLocal(ux(1),0),L.toLocal(ux(1),1),hx('s2'),.008,.9); L.g.add(fence);
      const pts=[]; for(let i=0;i<=80;i++){ const x=X0+(X1-X0)*i/80; pts.push([ux(x),Math.max(0,Math.min(1,vv(fP(x))))]); } L.curve(pts,hx('s1'),.012);
      const pd=[]; for(let i=0;i<=80;i++){ const m=M0+(M1-M0)*i/80, y=vv(dP(m)); if(y>=-.01) pd.push([um(m),Math.max(0,Math.min(1,y))]); } R.curve(pd,hx('s3'),.012);
      L.hline(vv(4),hx('s4'),true); R.hline(vv(4),hx('s4'),true);
      L.bead(ux(1),vv(4),hx('s4'),.035); R.bead(um(4),vv(4),hx('s4'),.035);
      L.text('the primal, in x',.5,.93,{size:18,color:colors.ink2}); R.text('the dual, in µ ≥ 0',.5,.93,{size:18,color:colors.ink2});
      L.text('banned x > 1',ux(3.4),.62,{size:16,color:colors.s2}); R.text('d* = 4 at µ* = 4',um(4)+.24,vv(4)+.1,{size:16,color:isLight?colors.ink2:colors.s4});
      const a=world(L,ux(1),vv(4)), b=world(R,um(4),vv(4)); const beam=tube(ctx,a,b,hx('s4'),.009,.75); overlay(beam,9); sceneG.add(beam); sc.beam=beam;
      sc.wX.show(false); }
    else { const K=facts(cs), C=K.C, X0=C.GX[0],X1=C.GX[1],V0=C.V[0],V1=C.V[1]; const ux=x=>(x-X0)/(X1-X0), vv=y=>(y-V0)/(V1-V0), um=m=>m/C.MU; sc.map={ux,vv,um};
      strip(L,0,1,isLight?hx('s2'):0x000000,isLight?.10:.38); C.bands.forEach(b=>{ const s=strip(L,ux(Math.max(X0,b[0])),ux(Math.min(X1,b[1])),hx('s3'),isLight?.22:.28); s.position.z=.008; });
      const pts=[]; for(let i=0;i<=100;i++){ const x=X0+(X1-X0)*i/100, y=vv(C.f(x)); if(y>=-.02&&y<=1.02) pts.push([ux(x),Math.max(0,Math.min(1,y))]); } L.curve(pts,hx('s1'),.012);
      let pd=[]; K.DS.forEach(([m,d])=>{ if(!isFinite(d)) return; const y=vv(d); if(y>=-.02&&y<=1.02) pd.push([um(m),Math.max(0,Math.min(1,y))]); }); R.curve(pd,hx('s3'),.012);
      L.hline(vv(K.pstar),hx('s4'),true); R.hline(vv(K.pstar),hx('s4'),true);
      L.bead(ux(C.xp),vv(K.pstar),hx('s4'),.035); R.bead(um(K.mustar),vv(K.dstar),hx('s3'),.035);
      L.text('the primal · lit where g ≤ 0',.5,.93,{size:18,color:colors.ink2}); R.text('the dual d(µ)',.5,.93,{size:18,color:colors.ink2});
      L.text('p* = '+F(K.pstar,4),ux(C.xp)+(cs==='bands'?.2:-.22),vv(K.pstar)+.1,{size:16,color:isLight?colors.ink2:colors.s4});
      const a=world(L,ux(C.xp),vv(K.pstar)), b=world(R,um(K.mustar),vv(K.pstar)); const beam=tube(ctx,a,b,hx('s4'),.009,.75); overlay(beam,9); sceneG.add(beam); sc.beam=beam;
      const rl=tube(ctx,world(R,um(K.mustar),vv(K.dstar)),world(R,um(K.mustar),vv(K.pstar)),critHex(),.03,1); overlay(rl,10); rl.visible=K.gap>1e-4; sceneG.add(rl); sc.ruler=rl; sc.rulerEnds=[world(R,um(K.mustar),vv(K.dstar)),world(R,um(K.mustar),vv(K.pstar))];
      if(K.gap>1e-4) R.text('gap '+F(K.gap,4),um(K.mustar)+.19,(vv(K.dstar)+vv(K.pstar))/2,{size:17,color:cssv('critical'),bg:true});
      sc.wX.show(false); }
    const slab=new THREE.Mesh(new THREE.PlaneGeometry(5.5,3.2),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.3:.5})); slab.rotation.x=-Math.PI/2; slab.position.y=-.125; sceneG.add(slab); }
  /* forty straight rods, one per x, and the thick ridge running under all of them — visibly a bowl turned upside down */
  function bundle(){ const {THREE,ctx,sceneG,hx,colors,isLight}=sc;
    const slab=new THREE.Mesh(new THREE.PlaneGeometry(5.5,3.2),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.3:.5})); slab.rotation.x=-Math.PI/2; slab.position.y=-.125; sceneG.add(slab);
    sceneG.add(tube(ctx,[BX(0),-.11,.78],[BX(8),-.11,.78],hx('s7'),.014,.9)); [0,2,4,6,8].forEach(m=>sceneG.add(tube(ctx,[BX(m),-.11,.73],[BX(m),-.11,.83],hx('s7'),.01,.9)));
    sceneG.add(CIN.prim.label(ctx,'µ = 0',[BX(0),-.05,.98],{size:16,color:colors.muted,bg:false,depthTest:false})); sceneG.add(CIN.prim.label(ctx,'µ = 8',[BX(8),-.05,.98],{size:16,color:colors.muted,bg:false,depthTest:false}));
    const rods=[]; XS.forEach(x=>{ const h=fP(x), s=gP(x); let m0=0,m1=8; if(s>1e-9){ m1=Math.min(8,(LCLIP[1]-h)/s); } else if(s<-1e-9){ m1=Math.min(8,(LCLIP[0]-h)/s); } if(m1<=m0+1e-6) return;
      const t=tube(ctx,[BX(m0),BY(h+m0*s),BZ(x)],[BX(m1),BY(h+m1*s),BZ(x)],hx('s1'),.011,isLight?.5:.38); sceneG.add(t); rods.push({x,t}); }); sc.rods=rods;
    const rp=[]; for(let i=0;i<=64;i++){ const m=8*i/64, xs=Math.max(-1,Math.min(5,3-m/2)); rp.push([BX(m),BY(dB(m))+.004,BZ(xs)]); } sceneG.add(polyTube(ctx,rp,hx('s3'),.03,false));
    const cur=[]; rp.forEach(p=>{ cur.push(p[0],p[1],p[2],p[0],-.11,p[2]); }); const idx=[]; for(let i=0;i<rp.length-1;i++){ const a=2*i; idx.push(a,a+1,a+2,a+1,a+3,a+2); }
    const cg=new THREE.BufferGeometry(); cg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(cur),3)); cg.setIndex(idx); const curtain=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:hx('s3'),transparent:true,opacity:isLight?.08:.1,side:THREE.DoubleSide,depthWrite:false})); sceneG.add(curtain);
    const peak=overlay(CIN.prim.dot(ctx,[BX(4),BY(4)+.004,BZ(1)],hx('s3'),.05),12); sceneG.add(peak); const ph=haloSprite(ctx,hx('s3'),.5); ph.position.set(BX(4),BY(4),BZ(1)); sceneG.add(ph);
    sceneG.add(CIN.prim.label(ctx,'µ* = 4 · d* = 4',[BX(4),.06,.78],{size:16,color:colors.s3,bg:true,depthTest:false}));
    const hl=tube(ctx,[0,0,0],[0,1,0],hx('s4'),.024,1); overlay(hl,11); sceneG.add(hl); const drop=tube(ctx,[0,0,0],[0,1,0],hx('s4'),.008,.5); sceneG.add(drop); sc.hl={rod:hl,drop};
    sc.wX.show(true); sc.wP.show(false); sc.wD.show(false); }
  function buildScene(){ if(!sc) return; clearGroup(sc.sceneG); sc.L=sc.R=sc.beam=sc.ruler=sc.hl=null; sc.rods=null; met=false; sc.lab.hide();
    if(tab==='bundle') bundle(); else twoPanels();
    if(sc.handle){ sc.story=true; camTo(sc.handle,VW(tab),900,resume); } }
  function paint(){ if(!sc) return; const {ctx,hx,wP,wD,wX,lab,colors}=sc;
    if(tab==='two'){ const {ux,vv,um}=sc.map, xv=Math.max(-1,Math.min(5,dx)), mv=Math.max(0,Math.min(10,dmu));
      wP.show(true); wD.show(true); wP.setPos(world(sc.L,ux(xv),Math.max(0,Math.min(1,vv(fP(xv)))),.02)); wD.setPos(world(sc.R,um(mv),Math.max(0,Math.min(1,vv(dP(mv)))),.02));
      const on=Math.abs(fP(xv)-4)<1e-6&&Math.abs(dP(mv)-4)<1e-6;
      if(on&&!met){ flare(ctx,wP.g.position.toArray(),hx('s4'),900,1.5); flare(ctx,wD.g.position.toArray(),hx('s4'),900,1.5); } met=on;
      if(chips) chips.set(`p(x) = <b>${F(fP(xv),3)}</b> · d(µ) = <b>${F(dP(mv),3)}</b> · gap so far = <b>${F(fP(xv)-dP(mv),3)}</b>`,on?'<b>p* = 4 = d*</b> · the two beads sit on one beam of light':'weak duality: every allowed p(x) sits above every d(µ)'); }
    else if(tab==='gap'){ const K=facts(cs), {ux,vv,um}=sc.map; wP.show(true); wD.show(true); wP.setPos(world(sc.L,ux(K.C.xp),vv(K.pstar),.02)); wD.setPos(world(sc.R,um(K.mustar),vv(K.dstar),.02));
      if(chips) chips.set(`p* = <b>${F(K.pstar,4)}</b> · d* = <b>${F(K.dstar,4)}</b> · duality gap = <b>${F(K.gap,4)}</b>`,K.gap>1e-4?'the ridge stops short of the beam — a real gap':'the ridge reaches the beam — no gap, even without convexity'); }
    else { const xl=Math.max(-1,Math.min(5,dxl)), h=fP(xl), s=gP(xl); let m0=0,m1=8; if(s>1e-9) m1=Math.min(8,(LCLIP[1]-h)/s); else if(s<-1e-9) m1=Math.min(8,(LCLIP[0]-h)/s);
      const a=[BX(m0),BY(h),BZ(xl)], b=[BX(m1),BY(h+m1*s),BZ(xl)]; aimTube(sc.THREE,sc.hl.rod,a,b);
      const mt=Math.max(0,Math.min(8,6-2*xl)), p=[BX(mt),BY(h+mt*s),BZ(xl)]; wX.setPos([p[0],p[1]+.01,p[2]]); aimTube(sc.THREE,sc.hl.drop,[p[0],-.11,p[2]],p);
      if(sc.rods) sc.rods.forEach(r=>{ const k=Math.max(0,1-Math.abs(r.x-xl)/.5); r.t.material.opacity=(sc.isLight?.5:.38)+.5*k; });
      lab.set(`x = ${F(xl,2)} → height f(x) = ${F(h,2)}, slope g(x) = ${F(s,2)}`,[Math.max(-1.1/NF(),Math.min(1.1/NF(),p[0])),p[1]+.28,p[2]],{size:17,color:sc.isLight?colors.ink:colors.s4,bg:true,depthTest:false});
      if(chips) chips.set(`rod x = <b>${F(xl,2)}</b> · it is the lowest rod at µ = <b>${F(mt,2)}</b>`,'forty straight rods · the lit ridge under them bends downward'); }
    RR(ctx); }
  function drawTwo(){ const xv=Math.max(-1,Math.min(5,dx)), mv=Math.max(0,Math.min(10,dmu)), gapNow=fP(xv)-dP(mv);
    read.innerHTML='p(x) = <b>'+F(fP(xv),4)+'</b>   d(µ) = <b>'+F(dP(mv),4)+'</b>   gap so far = <b>'+F(gapNow,4)+'</b><br>'+
      'd(µ) = <b>2µ − µ²/4</b>, maximised at µ* = 4<br>p* = 4 = d*  →  zero duality gap (strong duality)';
    if(Math.abs(fP(xv)-4)<1e-6&&Math.abs(dP(mv)-4)<1e-6){ verd.className='verdict good'; verd.textContent='good — p* = 4 = d*: the two views meet, so the dual answer IS the primal answer'; }
    else { verd.className='verdict info'; verd.textContent='info — every allowed x is above every d(µ): weak duality is the whole left-hand column of this picture'; } paint(); }
  function drawBundle(){ const xl=Math.max(-1,Math.min(5,dxl)), h=fP(xl), s=gP(xl);
    read.innerHTML='d is the lowest of 40 straight rods. The lowest of any bundle of straight rods bends downward — so the dual is ALWAYS concave, however ugly f is.<br>'+
      'highlighted: x = <b>'+F(xl,2)+'</b> → height f(x) = <b>'+F(h,4)+'</b>, slope g(x) = <b>'+F(s,4)+'</b>';
    verd.className='verdict good'; verd.textContent='good — concavity is free: it comes from the SHAPE of the dual, not from any assumption about f or g'; paint(); }
  function drawGap(){ const K=facts(cs);
    read.innerHTML='p* = <b>'+F(K.pstar,4)+'</b>  ·  d* = <b>'+F(K.dstar,4)+'</b>  ·  duality gap = <b>'+F(K.gap,4)+'</b>'+(K.gap>1e-4?' > 0':'')+'<br>'+
      'the best fine rate is µ* = <b>'+F(K.mustar,4)+'</b>'+
      (cs==='bands'?'<br>the feasible set is [−2, −1] ∪ [1, 2], so p* = −2 — and the Lagrangian’s only stationary point IS x = −2, so d* reaches it'
                   :'<br>the deeper well is banned, so the cheapest Lagrangian point jumps from one well to the other and never stops at the answer');
    verd.className='verdict info';
    verd.textContent=K.gap>1e-4?'info — weak duality still holds (d* ≤ p*); it is strong duality that needs convexity'
                               :'info — weak duality still holds (d* ≤ p*); here the gap is zero even without convexity — convexity is sufficient, not necessary'; paint(); }
  function draw(){ caseBar.style.display=tab==='gap'?'':'none'; showTab(box.closest('.widget'),tab);
    if(tab==='two') drawTwo(); else if(tab==='bundle') drawBundle(); else drawGap(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.story) resume(); }
  /* ▶ stories: the two beads travel to the beam · the highlight sweeps the sheaf · the dual bead climbs the ridge and the ruler measures what is left */
  function play(){ stop(); const tok=run; const h=sc&&sc.handle; if(sc) sc.story=true;
    const done=()=>{ if(tok===run) resume(); };
    if(tab==='two'){ const x0=dx, m0=dmu; if(h) camTo(h,{theta:.02,phi:1.25,radius:4.8*NF()},900);
      anim=tween(2200,u=>{ if(tok!==run) return; dx=Math.round((x0+(1-x0)*u)*50)/50; dmu=Math.round((m0+(4-m0)*u)*20)/20; setCtl('du-x',dx,2); setCtl('du-mu',dmu,2); drawTwo(); },
        ()=>{ if(tok!==run) return; dx=1; dmu=4; setCtl('du-x',1,2); setCtl('du-mu',4,2); drawTwo(); if(h) camTo(h,VW('two'),1200,done); else done(); }); return; }
    if(tab==='gap'){ const K=facts(cs), {um,vv}=sc?sc.map:{um:null}; if(!sc){ drawGap(); return; }
      if(h) camTo(h,{theta:-.2,phi:1.2,radius:5.2*NF()},900); const rl=sc.ruler, ends=sc.rulerEnds; if(rl) rl.visible=false;
      anim=tween(2000,u=>{ if(tok!==run) return; const m=Math.max(cs==='bands'?.02:0,K.mustar*u), d=dOfCase(K.C,m).d; sc.wD.setPos(world(sc.R,um(m),Math.max(0,Math.min(1,vv(d))),.02)); RR(sc.ctx); },
        ()=>{ if(tok!==run) return; sc.wD.setPos(world(sc.R,um(K.mustar),vv(K.dstar),.02));
          if(K.gap>1e-4){ rl.visible=true; anim=tween(800,u=>{ if(tok!==run) return; aimTube(sc.THREE,rl,ends[0],[ends[0][0],ends[0][1]+(ends[1][1]-ends[0][1])*Math.max(.001,u),ends[0][2]]); RR(sc.ctx); },
              ()=>{ if(tok!==run) return; flare(sc.ctx,ends[1],critHex(),900,1.4); if(chips) chips.set(`duality gap = <b>${F(K.gap,4)}</b> · the ridge peaks at d* = ${F(K.dstar,4)}, the floor is p* = ${F(K.pstar,4)}`,'weak duality holds (d* ≤ p*) — strong duality needs convexity'); if(h) camTo(h,VW('gap'),1200,done); else done(); }); }
          else { flare(sc.ctx,sc.wD.g.position.toArray(),hx4(),900,1.6); if(chips) chips.set(`duality gap = <b>0.0000</b> · the ridge reaches the beam`,'no gap here even without convexity — convexity is sufficient, not necessary'); if(h) camTo(h,VW('gap'),1200,done); else done(); } }); return; }
    /* bundle */
    const x0=dxl; if(h) camTo(h,{theta:1.05,phi:1.32,radius:4.3*NF()},1000); let crossed=false;
    anim=tween(3200,u=>{ if(tok!==run) return; const x=-1+6*u; if(!crossed&&x>=1){ crossed=true; if(sc) flare(sc.ctx,[BX(4),BY(4),BZ(1)],sc.hx('s3'),900,1.6); }
        dxl=Math.round(x*20)/20; setCtl('du-xl',dxl,2); drawBundle(); },
      ()=>{ if(tok!==run) return; if(h) camTo(h,VW('bundle'),1400,done); else setTimeout(done,1000); const xa=dxl; anim=tween(1000,u=>{ if(tok!==run) return; dxl=Math.round((xa+(1-xa)*u)*20)/20; setCtl('du-xl',dxl,2); drawBundle(); },()=>{ if(tok!==run) return; dxl=1; setCtl('du-xl',1,2); drawBundle(); if(sc) flare(sc.ctx,[BX(4),BY(4),BZ(1)],sc.hx('s4'),900,1.6); }); }); }
  const hx4=()=>sc.hx('s4');
  document.getElementById('du-play').addEventListener('click',play);
  bindCtl('du-x',v=>{ stop(); dx=v; if(tab==='two') drawTwo(); },v=>fmt(v,2))();
  bindCtl('du-mu',v=>{ stop(); dmu=v; if(tab==='two') drawTwo(); },v=>fmt(v,2))();
  bindCtl('du-xl',v=>{ stop(); dxl=v; if(tab==='bundle') drawBundle(); },v=>fmt(v,2))();
  caseBar.querySelectorAll('[data-c]').forEach(b=>b.addEventListener('click',()=>{ stop(); pressOnly(caseBar,b); cs=b.dataset.c; if(sc) buildScene(); drawGap(); }));
  tabs(document.getElementById('du-tabs'),t=>{ stop(); tab=t; if(sc){ sc.user=false; buildScene(); } draw(); });
  showTab(box.closest('.widget'),'two');
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
  /* the two numbers this unit quotes, computed once and logged so a verify script can read them back */
  (function(){ const a=facts('bands'), b=facts('wells');
    console.info('U11 duality gaps · bands: p* = '+a.pstar.toFixed(4)+', d* = '+a.dstar.toFixed(4)+' at µ* = '+a.mustar.toFixed(4)+', gap = '+a.gap.toFixed(4)+
      ' · wells: p* = '+b.pstar.toFixed(4)+', d* = '+b.dstar.toFixed(4)+' at µ* = '+b.mustar.toFixed(4)+', gap = '+b.gap.toFixed(4)); })();
})();

/* ================= W14 · WHAT A WALL IS WORTH (a wall on the bowl, and the value curve as its shadow on a glass panel) ================= */
(function(){
  const box=document.getElementById('pr-3d'),read=document.getElementById('pr-read'),verd=document.getElementById('pr-verdict');
  if(!box) return;
  const NF=()=>box.clientWidth<560?1.25:1;   /* a phone stage is narrow: every camera radius is scaled up */
  let c=3.00,anim=null,run=0,sc=null,ST=null,chips=null;
  const sol=cc=>cc<=2?{x:2,y:2,mu:0,p:8}:{x:cc,y:4-cc,mu:4*cc-8,p:cc*cc+(4-cc)*(4-cc)};
  const f=(x,y)=>x*x+y*y, SC=.65, ZS=1.25/38.72, R=2.2*SC, MX=x=>(x-2.2)*SC, MZ=y=>-(y-2.2)*SC, at=(x,y)=>[MX(x),f(x,y)*ZS,MZ(y)];
  const fs=(u,v)=>f(2.2+u/SC,2.2+v/SC);
  const C0=1.4,C1=3.8,P0=7.4,P1=13.2, uc=cc=>(cc-C0)/(C1-C0), vp=p=>(p-P0)/(P1-P0);
  const VIEW={theta:.66,phi:1.12,radius:5.4};
  const VW=()=>({theta:VIEW.theta,phi:VIEW.phi,radius:VIEW.radius*NF()});
  function build(){
    sc=null; const narrow=box.clientWidth<560; const r=VIEW.radius*NF(), look=[0,.5,0];
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:[look[0]+r*Math.sin(VIEW.theta)*Math.sin(VIEW.phi),look[1]+r*Math.cos(VIEW.phi),look[2]+r*Math.cos(VIEW.theta)*Math.sin(VIEW.phi)],look,fov:36},autoRotate:0,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const surf=CIN.prim.surface(ctx,fs,{x:[-R,R],y:[-R,R],res:70,zscale:ZS,ramp:[colors.s1,colors.s7,colors.s2],opacity:.94}); lightenSurface(ctx,surf,ZS); root.add(surf);
        const base=new Float32Array(surf.userData.geo.attributes.color.array);
        const grid=CIN.prim.grid(ctx,5,20,hx('grid'),{opacity:isLight?.45:.3}); grid.position.y=-.12; root.add(grid);
        const lv=[]; for(let i=1;i<=10;i++) lv.push(40*Math.pow(i/10,1.8)); root.add(liftedContours(ctx,fs,lv,-R,R,-R,R,ZS,hx('ink2'),{N:64}));
        const rail=[]; for(let i=0;i<=48;i++){ const t=4*i/48, q=at(t,4-t); q[1]+=.012; rail.push(q); } root.add(polyTube(ctx,rail,hx('s7'),.016,false));
        const litG=new THREE.Group(); root.add(litG);
        const wall=wallPanel(ctx,{w:3.0,h:1.05,color:'s2'}); wall.g.children[0].material.opacity=isLight?.3:.4; [-1.5,1.5].forEach(z=>wall.g.add(tube(ctx,[0,-.12,z],[0,.93,z],hx('s2'),.014,.95))); wall.g.children[2].material.opacity=.9; wall.g.traverse(m=>{ if(m.material) m.userData.op=m.material.opacity; });
        const free=new THREE.Mesh(new THREE.TorusGeometry(.07,.011,10,32),new THREE.MeshStandardMaterial({color:hx('ink2'),emissive:hx('ink2'),emissiveIntensity:isLight?.1:.5})); free.rotation.x=-Math.PI/2; const fq=at(2,2); free.position.set(fq[0],fq[1]+.02,fq[2]); root.add(free);
        const bead=walkerChar(ctx,hx('s4'),.06); const tail=cometTail(ctx,hx('s4'));
        const panel=glassPanel(ctx,{w:2.7,h:1.15,pos:[-1.45,.95,-2.03],yaw:.62,color:'s1'});
        const pts=[]; for(let i=0;i<=80;i++){ const cc=C0+(C1-C0)*i/80; pts.push([uc(cc),vp(sol(cc).p)]); } panel.curve(pts,hx('s1'),.013);
        const L=.42; panel.curve([[uc(3-L),vp(10-4*L)],[uc(3+L),vp(10+4*L)]],hx('s3'),.011);
        panel.g.add(tube(ctx,panel.toLocal(uc(2),0),panel.toLocal(uc(2),1),hx('ink2'),.005,.45));
        panel.text('p*(c) — what the problem costs',.5,.92,{size:18,color:colors.ink2}); panel.text('slope µ* = 4',uc(3.42)+.13,vp(10+4*L)+.02,{size:16,color:colors.s3});
        const pa=panel.bead(uc(3),vp(10),hx('s4'),.036), pp=panel.bead(uc(3),vp(10),hx('s3'),.03); const tick=tube(ctx,[0,0,0],[0,1,0],critHex(),.012); overlay(tick,12); panel.g.add(tick);
        root.add(CIN.prim.label(ctx,'free answer (2, 2)',[fq[0]+.05,fq[1]+.22,fq[2]+.1],{size:15,color:colors.muted,bg:false,depthTest:false}));
        const wlab=slot(ctx,root);
        sc={THREE,ctx,root,colors,isLight,hx,surf,base,litG,wall,bead,tail,panel,pa,pp,tick,wlab,handle:null,theta0:VIEW.theta,story:false,user:false};
        chips=hudPair(box); hint(box,'drag to orbit');
        paint();
      },
      update(ctx,t){ if(!sc||!sc.handle||sc.story||sc.user||RM) return false; const o=sc.handle.ctx.orbit; o.sph.theta=sc.theta0+.18*Math.sin(t*.4); o.place(); return true; }
    });
    if(handle){ grab(handle,()=>{ if(sc) sc.user=true; return false; },()=>{}); if(sc) sc.handle=handle; }
    return handle;
  }
  const resume=()=>{ if(!sc||!sc.handle) return; sc.theta0=sc.handle.ctx.orbit.sph.theta-.18*Math.sin(performance.now()/1000*.4); sc.story=false; };
  /* the wall stands at c; the surface behind it goes dark; the bead sits in the corner where the rail meets the wall; the shadow curve at the back reads the price */
  function paint(cur){ if(!sc) return; const cc=cur==null?c:cur, S=sol(cc), {THREE,ctx,hx,surf,base,litG,wall,bead,tail,panel,pa,pp,tick,wlab,colors}=sc, touching=cc>2+1e-9;
    wall.setX(MX(cc)); const k=touching?1:.3; wall.g.traverse(m=>{ if(m.material&&m.userData.op!=null) m.material.opacity=m.userData.op*k; });
    const geo=surf.userData.geo, pos=geo.attributes.position, col=geo.attributes.color, dark=sc.isLight?new THREE.Color(hx('s2')).convertSRGBToLinear():new THREE.Color(0,0,0), kd=(sc.isLight?.3:.7)*k;
    for(let i=0;i<pos.count;i++){ const x=2.2+pos.getX(i)/SC; if(x<cc){ col.setXYZ(i,base[3*i]+(dark.r-base[3*i])*kd,base[3*i+1]+(dark.g-base[3*i+1])*kd,base[3*i+2]+(dark.b-base[3*i+2])*kd); } else col.setXYZ(i,base[3*i],base[3*i+1],base[3*i+2]); } col.needsUpdate=true;
    clearGroup(litG); const lit=[]; const x0=Math.max(0,Math.min(4,cc)); for(let i=0;i<=24;i++){ const t=x0+(4-x0)*i/24, q=at(t,4-t); q[1]+=.016; lit.push(q); } if(lit.length>1) litG.add(polyTube(ctx,lit,hx('s3'),.024,false));
    const q=at(S.x,S.y); bead.setPos([q[0],q[1]+.03,q[2]]); if(sc.tailFrom){ tail.set(sc.tailFrom,[q[0],q[1]+.03,q[2]]); } else tail.clear();
    wlab.set('wall at c = '+F(cc,2),[MX(cc),1.08,-1.35],{size:16,color:colors.s2,bg:true,depthTest:false});
    const cv=Math.max(C0,Math.min(C1,cc)), pred=10+4*(cc-3); const A=panel.toLocal(uc(cv),vp(S.p)), P=panel.toLocal(uc(cv),vp(Math.max(P0,Math.min(P1,pred))));
    pa.position.set(A[0],A[1],A[2]+.02); pp.position.set(P[0],P[1],P[2]+.025); pp.visible=Math.abs(cc-3)>1e-9; tick.visible=Math.abs(cc-3)>1e-9&&Math.abs(S.p-pred)>1e-4;
    if(tick.visible){ const L=Math.max(.035,Math.abs(A[1]-P[1])), sgn=A[1]>=P[1]?1:-1; aimTube(THREE,tick,[P[0],P[1],P[2]+.02],[P[0],P[1]+sgn*L,P[2]+.02]); }
    if(chips) chips.set(`c = <b>${F(cc,2)}</b> · µ* = <b>${F(S.mu,2)}</b> · p* = <b>${F(S.p,2)}</b>`,touching?(Math.abs(cc-3)>1e-9?`predicted 10 + 4·Δc = <b>${F(pred,2)}</b> · actual <b>${F(S.p,2)}</b> · error <b>${F(Math.abs(S.p-pred),2)}</b>`:'the wall is pressed against you · its price is the slope of the shadow curve'):'the wall is not touching you · µ* = 0');
    RR(ctx); }
  function draw(){ const S=sol(c), pred=10+4*(c-3);
    read.innerHTML='c = <b>'+F(c,2)+'</b> → x* = <b>'+F(S.x,2)+'</b>, y* = <b>'+F(S.y,2)+'</b>, µ* = <b>'+F(S.mu,2)+'</b>, p* = <b>'+F(S.p,2)+'</b><br>'+
      'predicted by the price:  10 + 4·Δc = <b>'+F(pred,2)+'</b>   ·   actually: <b>'+F(S.p,2)+'</b>   ·   error <b>'+F(Math.abs(S.p-pred),2)+'</b><br>'+
      'at c = 3.00 the answer is (3, 1) with µ* = 4 and p* = 10';
    if(c<=2+1e-9){ verd.className='verdict info'; verd.textContent='info — the wall is behind the free answer: µ* = 0 and the value curve is flat. The price of a wall you are not touching is nothing.'; }
    else { verd.className='verdict good'; verd.textContent='good — the multiplier told you the change before you re-solved anything'; }
    paint(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc){ sc.tailFrom=null; sc.tail.clear(); if(sc.story) resume(); } }
  const setC=v=>{ c=Math.round(v*100)/100; setCtl('pr-c',c,x=>fmt(x,2)); draw(); };
  /* ▶: nudge the wall to 2.9 while the camera turns to the shadow curve, let it go to 2 (the wall dims, the bead returns to the free answer), then push it back to 3 */
  function play(){ stop(); const tok=run; const h=sc&&sc.handle; if(sc) sc.story=true;
    if(RM){ setC(2.9); if(sc) sc.story=false; return; }
    const seg=(a,b,dur,then)=>{ if(sc){ const S=sol(a), q=at(S.x,S.y); sc.tailFrom=[q[0],q[1]+.03,q[2]]; } anim=tween(dur,u=>{ if(tok!==run) return; setC(a+(b-a)*u); },()=>{ if(tok!==run) return; setC(b); if(sc) sc.tailFrom=null; then&&then(); }); };
    const pause=(ms,then)=>setTimeout(()=>{ if(tok===run) then(); },ms);
    if(h) camTo(h,{theta:.66,phi:1.0,radius:5.0*NF()},1400);
    seg(3,2.9,1300,()=>pause(500,()=>seg(2.9,2,1400,()=>{ if(sc) flare(sc.ctx,at(2,2).map((v,i)=>i===1?v+.05:v),sc.hx('s3'),900,1.6);
      pause(600,()=>{ if(h) camTo(h,VW(),1500,()=>{ if(tok===run) resume(); }); seg(2,3,1400,()=>{ if(sc) flare(sc.ctx,at(3,1).map((v,i)=>i===1?v+.05:v),sc.hx('s4'),900,1.6); if(!h&&sc) sc.story=false; }); }); }))); }
  document.getElementById('pr-play').addEventListener('click',play);
  const preBar=document.getElementById('pr-pre');
  [['pr-p-base',3.00],['pr-p-near',2.90],['pr-p-free',2.00]].forEach(([id,v])=>document.getElementById(id).addEventListener('click',e=>{ pressOnly(preBar,e.currentTarget); stop(); setC(v); }));
  bindCtl('pr-c',v=>{ stop(); c=v; pressOnly(preBar,null); draw(); },v=>fmt(v,2))();
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
})();

/* ================= W15 · TWO POINTS AND A LINE (a margin road between two pylons, lanterns for the points, a beam for the boundary) ================= */
(function(){
  const box=document.getElementById('sv-3d'),read=document.getElementById('sv-read'),verd=document.getElementById('sv-verdict');
  if(!box) return;
  const NF=()=>box.clientWidth<560?1.4:1;   /* a phone stage is narrow: every camera radius is scaled up */
  let tab='ans',wv=1,av=0.5,x3=3,run=0,anim=null,sc=null,ST=null,chips=null,drag=false,prevB=null,wasStar=false,wasSV=false;
  /* hard margin with x₁ = +1 (class +1), x₂ = −1 (class −1) and a third point x₃ (class +1).
     For x₃ ≥ 1 the binding pair is (+1, −1): w = 1, b = 0, α₁ = α₂ = ½, α₃ = 0.
     For x₃ < 1 the binding pair is (x₃, −1):  w = 2/(x₃+1),  b = −w(x₃−1)/2 = (1−x₃)/(1+x₃),  α₂ = α₃ = 2/(x₃+1)², α₁ = 0. */
  function svm3(x){ if(x>=1) return {w:1,b:0,a:[0.5,0.5,0],sv:[true,true,false]};
    const w=2/(x+1), b=-w*(x-1)/2, al=2/((x+1)*(x+1));
    return {w,b,a:[0,al,al],sv:[false,true,true]}; }
  const q=a=>2*a-2*a*a;
  const FY=-.12, LH=1.25, SCL=.7, MX=x=>x*SCL, CL=x=>Math.max(-2.6,Math.min(3.0,x));
  const VIEW={theta:.2,phi:1.12,radius:5.4};
  const VW=()=>({theta:VIEW.theta,phi:VIEW.phi,radius:VIEW.radius*NF()});
  /* what the road looks like on each tab: slope w, offset b, the third lantern, which lanterns are lit */
  function model(){ if(tab==='ans') return {w:wv,b:0,x3:null,sv:[true,true],a:null};
    if(tab==='dual') return {w:2*av,b:0,x3:null,sv:[true,true],a:av};
    const S=svm3(x3); return {w:S.w,b:S.b,x3,sv:S.sv,a:S.a,S}; }
  function lampColor(l,hex){ l.g.traverse(m=>{ if(m.isPointLight) m.color.setHex(hex); else if(m.isSprite&&m.material) m.material.color.setHex(hex); else if(m.material&&m.material.emissive&&m.geometry&&m.geometry.type==='SphereGeometry'){ m.material.color.setHex(hex); m.material.emissive.setHex(hex); } }); }
  function mkLamp(ctx,hex,x){ const l=lampChar(ctx,hex,[MX(x),FY+LH,0]); l.g.rotation.x=Math.PI; l.g.traverse(m=>{ if(m.material&&m.material.emissive&&m.geometry&&m.geometry.type==='SphereGeometry'){ m.material.transparent=true; l.bulb=m; } }); l.g.add(tube(ctx,[0,.05,0],[0,LH,0],hxOf(ctx)('ink2'),.016,.85)); return l; }
  function build(){
    sc=null; const narrow=box.clientWidth<560; const r=VIEW.radius*NF(), look=[narrow?.5:0,.4,0];
    const handle=CIN.stage3d(box,{fill:true,camera:{pos:[look[0]+r*Math.sin(VIEW.theta)*Math.sin(VIEW.phi),look[1]+r*Math.cos(VIEW.phi),look[2]+r*Math.cos(VIEW.theta)*Math.sin(VIEW.phi)],look,fov:36},autoRotate:0,
      build(ctx){
        const {THREE,root,colors,isLight}=ctx, hx=hxOf(ctx);
        const grid=CIN.prim.grid(ctx,6,24,hx('grid'),{opacity:isLight?.45:.3}); grid.position.y=FY; root.add(grid);
        const slab=new THREE.Mesh(new THREE.PlaneGeometry(6,3.2),new THREE.MeshStandardMaterial({color:isLight?0xffffff:0x0b1020,roughness:.9,transparent:true,opacity:isLight?.3:.5})); slab.rotation.x=-Math.PI/2; slab.position.y=FY-.005; root.add(slab);
        /* the number line */
        root.add(tube(ctx,[MX(-3),FY+.004,0],[MX(5),FY+.004,0],hx('ink2'),.008,.7)); for(let i=-2;i<=4;i++) root.add(tube(ctx,[MX(i),FY,.07],[MX(i),FY,-.07],hx('ink2'),.006,.7));
        /* the road, its kerbs and pylons */
        const road=new THREE.Mesh(new THREE.PlaneGeometry(1,1.3),new THREE.MeshBasicMaterial({color:hx('s3'),transparent:true,opacity:isLight?.18:.2,depthWrite:false,side:THREE.DoubleSide})); road.rotation.x=-Math.PI/2; road.position.y=FY+.002; root.add(road);
        const kerb=[tube(ctx,[0,0,0],[0,1,0],hx('s7'),.014,.9),tube(ctx,[0,0,0],[0,1,0],hx('s7'),.014,.9)]; kerb.forEach(k=>root.add(k));
        const pyl=[0,1].map(()=>{ const g=new THREE.Group(); root.add(g); g.add(tube(ctx,[0,FY,0],[0,FY+.82,0],hx('s7'),.035,1)); const top=overlay(CIN.prim.dot(ctx,[0,FY+.85,0],hx('s7'),.05),12); g.add(top); const h=haloSprite(ctx,hx('s7'),.55); h.position.y=FY+.85; g.add(h); return g; });
        /* the boundary beam */
        const beam=new THREE.Group(); root.add(beam); const pane=CIN.prim.glass(ctx,1.3,.9,hx('s4'),isLight?.2:.22); pane.rotation.y=Math.PI/2; pane.position.y=FY+.45; beam.add(pane);
        beam.add(tube(ctx,[0,FY,0],[0,FY+.9,0],hx('s4'),.014,1)); const bh=haloSprite(ctx,hx('s4'),.5); bh.position.y=FY+.9; beam.add(bh);
        /* the lanterns */
        const l1=mkLamp(ctx,hx('s3'),1), l2=mkLamp(ctx,hx('s2'),-1), l3=mkLamp(ctx,hx('s3'),3);
        const blab=slot(ctx,root), mlab=slot(ctx,root), tlab=slot(ctx,root), clab=[slot(ctx,root),slot(ctx,root)];
        /* the dual panel */
        const panel=glassPanel(ctx,{w:2.2,h:1.0,pos:[1.2,1.2,-2.0],color:'s3'}); const A0=0,A1=1.2,Q0=-.5,Q1=.62, ua=a=>(a-A0)/(A1-A0), vq=v=>(v-Q0)/(Q1-Q0);
        const pts=[]; for(let i=0;i<=80;i++){ const a=A1*i/80; pts.push([ua(a),vq(q(a))]); } panel.curve(pts,hx('s3'),.012); panel.hline(vq(0),hx('ink2'),true);
        panel.bead(ua(.5),vq(.5),hx('s4'),.034); panel.text('q(α) = 2α − 2α² · peak at α* = 0.5',.5,.12,{size:17,color:colors.ink2});
        const pb=panel.bead(ua(.5),vq(.5),hx('s2'),.03);
        const dragPlane=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})); dragPlane.rotation.x=-Math.PI/2; dragPlane.position.y=FY+LH; root.add(dragPlane);
        sc={THREE,ctx,root,colors,isLight,hx,road,kerb,pyl,beam,l1,l2,l3,blab,mlab,tlab,clab,panel,pb,ua,vq,dragPlane,handle:null,theta0:VIEW.theta,story:false,user:false};
        chips=hudPair(box); hint(box,'drag to orbit');
        prevB=null; wasStar=false; wasSV=false; paint();
      },
      update(ctx,t){ if(sc) mirror(); if(!sc||!sc.handle||sc.story||sc.user||RM) return false; const o=sc.handle.ctx.orbit; o.sph.theta=sc.theta0+.2*Math.sin(t*.4); o.place(); return true; }
    });
    if(handle&&sc){ sc.handle=handle; const pick=picker(handle,()=>sc.dragPlane);
      grab(handle,e=>{ if(!sc) return false; sc.user=true; if(tab!=='add') return false; const {THREE,ctx}=sc, r=ctx.renderer.domElement.getBoundingClientRect(), v=new THREE.Vector3().copy(sc.l3.g.position).project(ctx.camera);
          if(Math.hypot((v.x+1)/2*r.width-(e.clientX-r.left),(1-v.y)/2*r.height-(e.clientY-r.top))>44) return false; stop(); drag=true; return true; },
        e=>{ if(!drag) return; const h=pick(e); if(!h) return; x3=Math.max(0,Math.min(4,Math.round((h.x/SCL)*20)/20)); setCtl('sv-x3',x3,v=>fmt(v,2)); draw(); },
        ()=>{ drag=false; }); }
    return handle;
  }
  const resume=()=>{ if(!sc||!sc.handle) return; sc.theta0=sc.handle.ctx.orbit.sph.theta-.2*Math.sin(performance.now()/1000*.4); sc.story=false; };
  function mirror(){ const {THREE,ctx,l3}=sc, v=new THREE.Vector3().copy(l3.g.position).project(ctx.camera); box.dataset.x3=JSON.stringify([+((v.x+1)/2).toFixed(3),+((1-v.y)/2).toFixed(3)]); }
  function paint(){ if(!sc) return; const M=model(), {THREE,ctx,hx,road,kerb,pyl,beam,l1,l2,l3,blab,mlab,tlab,clab,panel,pb,ua,vq,colors}=sc;
    /* the class labels stand over the lanterns, except on the dual tab where the panel needs the sky: there they sit on the floor in front */
    clab[0].set('x = +1 · class +1',tab==='dual'?[MX(1),FY+.02,.62]:[MX(1),FY+LH+.3,0],{size:15,color:colors.s3,bg:true,depthTest:false});
    clab[1].set('x = −1 · class −1',tab==='dual'?[MX(-1),FY+.02,.62]:[MX(-1),FY+LH+.3,0],{size:15,color:colors.s2,bg:true,depthTest:false});
    const w=M.w, b=M.b, wide=w<1e-6, e1=wide?1e9:(1-b)/w, e2=wide?-1e9:(-1-b)/w, bnd=wide?0:-b/w, lo=CL(MX(Math.min(e1,e2))), hi=CL(MX(Math.max(e1,e2)));
    road.position.x=(lo+hi)/2; road.scale.x=Math.max(.001,hi-lo); road.material.opacity=(sc.isLight?.18:.2)*(wide?.45:1);
    aimTube(THREE,kerb[0],[lo,FY+.006,-.65],[lo,FY+.006,.65]); aimTube(THREE,kerb[1],[hi,FY+.006,-.65],[hi,FY+.006,.65]);
    pyl[0].position.set(lo,0,-.62); pyl[1].position.set(hi,0,-.62); pyl.forEach(p=>{ p.visible=!wide; });
    beam.position.x=MX(bnd); beam.visible=!wide; if(prevB!=null&&Math.abs(prevB-bnd)>.08&&!wide){ flare(ctx,[MX(bnd),FY+.9,0],hx('s4'),500,.9); prevB=bnd; } if(prevB==null&&!wide) prevB=bnd;
    blab.set(wide||tab!=='ans'?'':'boundary  w·x + b = 0',[MX(bnd),FY+1.15,0],{size:15,color:colors.s4,bg:true,depthTest:false}); if(wide||tab!=='ans') blab.hide();
    const gap=wide?Infinity:2/Math.abs(w); mlab.set('margin 2/|w| = '+(isFinite(gap)?F(gap,3):'∞'),[(lo+hi)/2,FY+.04,1.0],{size:16,color:colors.s3,bg:true,depthTest:false});
    /* the lanterns: lit when they clear the road, red when the pylons have passed them */
    const ok1=w*1+b>=1-1e-9, ok2=-(w*-1+b)>=1-1e-9; const s3=hx('s3'), s2=hx('s2'), cr=critHex();
    lampColor(l1,ok1?s3:cr); l1.set(ok1?1:.6); lampColor(l2,ok2?s2:cr); l2.set(ok2?1:.6);
    if(tab==='add'){ l3.g.visible=true; l3.g.position.x=MX(M.x3); const sv=M.sv[2]; lampColor(l3,s3); l3.set(sv?1:.1); if(l3.bulb) l3.bulb.material.opacity=sv?1:.35;
      tlab.set(sv?'x₃ = '+F(M.x3,2)+' · support vector · α₃ = '+F(M.a[2],4):'x₃ = '+F(M.x3,2)+' · α₃ = 0 · delete it and nothing changes',[Math.max(-1.0,Math.min(1.0,MX(M.x3))),FY+.03,-1.05],{size:15,color:sv?colors.s3:colors.muted,bg:true,depthTest:false});
      if(sv&&!wasSV) flare(ctx,[MX(M.x3),FY+LH,0],s3,900,1.6); wasSV=sv; }
    else { l3.g.visible=false; tlab.hide(); wasSV=false; }
    panel.show(tab==='dual'); if(tab==='dual'){ const P=panel.toLocal(ua(av),vq(q(Math.min(1.2,av)))); pb.position.set(P[0],P[1],P[2]+.02); const star=Math.abs(av-.5)<1e-9; if(star&&!wasStar){ flare(ctx,[MX(1),FY+.85,-.62],hx('s7'),900,1.4); flare(ctx,[MX(-1),FY+.85,-.62],hx('s7'),900,1.4); } wasStar=star; }
    if(chips){ if(tab==='ans') chips.set(`w = <b>${F(w,2)}</b> · margin 2/|w| = <b>${F(gap,3)}</b> · constraints <b>${ok1&&ok2?'satisfied':'violated'}</b>`,ok1&&ok2?(Math.abs(w-1)<1e-9?'the pylons touch the lanterns: the widest road that clears both':'legal, but the road is narrower than it needs to be'):'the pylons have passed the lanterns — not allowed');
      else if(tab==='dual') chips.set(`α = <b>${F(av,3)}</b> → w = 2α = <b>${F(w,3)}</b> · q(α) = <b>${F(q(av),4)}</b>`,Math.abs(av-.5)<1e-9?'the dual peak builds exactly the primal road: w* = 1':'the road is built out of the multiplier — the pylons slide as α moves');
      else chips.set(`x₃ = <b>${F(M.x3,2)}</b> · α₃ = <b>${F(M.a[2],4)}</b> · boundary x = <b>${F(bnd,3)}</b>`,M.sv[2]?'x₃ is now a support vector — the whole road moved':'outside the pylons the third lantern carries no weight'); }
    mirror(); RR(ctx); }
  function drawAns(){ const w=wv, b=0, ok1=w*1+b>=1-1e-9, ok2=-(w*-1+b)>=1-1e-9, gap=2/Math.abs(w);
    read.innerHTML='margin = <b>'+F(gap,4)+'</b>  ·  constraints: <b>'+(ok1&&ok2?'satisfied':'violated')+'</b>  ·  ½w² = <b>'+F(0.5*w*w,4)+'</b><br>'+
      'at the answer: w* = <b>1</b>, b* = <b>0</b>, α₁ = α₂ = <b>0.5</b>, margin = <b>2</b>';
    if(!(ok1&&ok2)){ verd.className='verdict bad'; verd.textContent='bad — w < 1: the gap is wider, but the points are now inside the margin. Not allowed.'; }
    else if(Math.abs(w-1)<1e-9){ verd.className='verdict good'; verd.textContent='good — w = 1 is the smallest w that still clears both constraints: widest margin = smallest ½w²'; }
    else { verd.className='verdict info'; verd.textContent='info — legal, but ½w² = '+F(0.5*w*w,3)+' is bigger than it needs to be: the margin is narrower than 2'; } paint(); }
  function drawDual(){ const a=Math.max(0,Math.min(1.2,av));
    read.innerHTML='α = <b>'+F(a,3)+'</b> → w = <b>'+F(2*a,3)+'</b> → ½w² = <b>'+F(2*a*a,4)+'</b> · q(α) = <b>'+F(q(a),4)+'</b><br>'+
      'at the peak: α* = <b>0.5</b>, w* = <b>1</b>, d* = <b>0.5</b> = p*';
    if(Math.abs(a-0.5)<1e-9){ verd.className='verdict good'; verd.textContent='good — the dual peak α* = 0.5 builds exactly the primal answer w* = 1, and d* = 0.5 = p*'; }
    else { verd.className='verdict info'; verd.textContent='info — q(α) = '+F(q(a),4)+' is below the peak 0.5: any α gives a lower bound, only α* gives the answer'; } paint(); }
  function drawAdd(){ const S=svm3(x3), bnd=-S.b/S.w, nsv=S.sv.filter(Boolean).length;
    read.innerHTML='α₃ = <b>'+F(S.a[2],4)+'</b> · support vectors: <b>'+nsv+'</b> of 3 · boundary x = <b>'+F(bnd,4)+'</b> · margin = <b>'+F(2/S.w,4)+'</b><br>'+
      'w = <b>'+F(S.w,4)+'</b>, b = <b>'+F(S.b,4)+'</b>'+(x3<1?'  — once x₃ < 1: w = 2/(x₃+1), b = −w(x₃−1)/2':'  (unchanged: x₃ carries no weight)')+'<br>'+
      'at x₃ = 3: α₃ = <b>0</b> · at x₃ = 0.5: w = <b>1.3333</b>, b = <b>0.3333</b>, α₂ = α₃ = <b>0.8889</b>';
    if(S.sv[2]){ verd.className='verdict good'; verd.textContent='good — complementary slackness is why an SVM is sparse: only the points whose constraint is tight carry the answer'; }
    else { verd.className='verdict good'; verd.textContent='good — α₃ = 0: the point is outside the margin, so it pays nothing and changes nothing'; } paint(); }
  function draw(){ showTab(box.closest('.widget'),tab); if(tab==='ans') drawAns(); else if(tab==='dual') drawDual(); else drawAdd(); }
  function stop(){ run++; if(anim){ anim.stop(); anim=null; } if(sc&&sc.story) resume(); }
  /* ▶ stories: the road widens until the pylons touch the lanterns, then passes them · the road is built from α · the third lantern slides in and lights up */
  function play(){ stop(); const tok=run; const h=sc&&sc.handle; if(sc) sc.story=true;
    const done=()=>{ if(tok===run) resume(); };
    const seg=(get,set,a,b,dur,dec,then)=>{ anim=tween(dur,u=>{ if(tok!==run) return; set(Math.round((a+(b-a)*u)*dec)/dec); },()=>{ if(tok!==run) return; set(b); then&&then(); }); };
    const pause=(ms,then)=>setTimeout(()=>{ if(tok===run) then(); },ms);
    if(tab==='ans'){ const setW=v=>{ wv=v; setCtl('sv-w',v,x=>fmt(x,2)); drawAns(); };
      if(RM){ setW(1); done(); return; } if(h) camTo(h,{theta:1.25,phi:1.35,radius:4.4*NF()},1000);
      seg(null,setW,3,1,1800,100,()=>{ if(sc) flare(sc.ctx,[MX(1),FY+.85,-.62],sc.hx('s7'),900,1.5); pause(500,()=>seg(null,setW,1,.6,1000,100,()=>{ if(sc){ sparks(sc.ctx,[MX(1),FY+LH,0],critHex(),9,700); sparks(sc.ctx,[MX(-1),FY+LH,0],critHex(),9,700); }
        pause(700,()=>{ if(h) camTo(h,VW(),1300,done); seg(null,setW,.6,1,1000,100,()=>{ if(sc) flare(sc.ctx,[MX(-1),FY+.85,-.62],sc.hx('s7'),900,1.5); if(!h) done(); }); }); })); }); return; }
    if(tab==='dual'){ const setA=v=>{ av=v; setCtl('sv-a',v,x=>fmt(x,3)); drawDual(); };
      if(RM){ setA(.5); done(); return; } if(h) camTo(h,{theta:.05,phi:1.2,radius:5.0*NF()},1000);
      seg(null,setA,0,.5,2200,200,()=>pause(600,()=>seg(null,setA,.5,.8,900,200,()=>pause(400,()=>{ if(h) camTo(h,VW(),1200,done); seg(null,setA,.8,.5,900,200,h?null:done); })))); return; }
    const setX=v=>{ x3=v; setCtl('sv-x3',v,x=>fmt(x,2)); drawAdd(); };
    if(RM){ setX(.5); done(); return; } if(h) camTo(h,{theta:.6,phi:1.25,radius:4.6*NF()},1000);
    seg(null,setX,3,.5,2400,20,()=>pause(700,()=>{ if(h) camTo(h,VW(),1600,done); seg(null,setX,.5,3,1600,20,h?null:done); })); }
  document.getElementById('sv-play').addEventListener('click',play);
  bindCtl('sv-w',v=>{ stop(); wv=v; if(tab==='ans') drawAns(); },v=>fmt(v,2))();
  bindCtl('sv-a',v=>{ stop(); av=v; if(tab==='dual') drawDual(); },v=>fmt(v,3))();
  bindCtl('sv-x3',v=>{ stop(); x3=v; if(tab==='add') drawAdd(); },v=>fmt(v,2))();
  tabs(document.getElementById('sv-tabs'),t=>{ stop(); tab=t; prevB=null; if(sc&&sc.handle){ sc.user=false; sc.story=true; camTo(sc.handle,VW(),800,resume); } draw(); });
  showTab(box.closest('.widget'),'ans');
  ST=mountStage(box,build);
  let rw=box.clientWidth; addEventListener('resize',()=>{ const W=box.clientWidth; if((W<560)!==(rw<560)) remount(ST); rw=W; });
  draw();
  /* self-check: the shifted hard-margin solution */
  (function(){ const s=svm3(0.5); if(Math.abs(s.w-4/3)>1e-9||Math.abs(s.b-1/3)>1e-9||Math.abs(s.a[2]-8/9)>1e-9) console.warn('W15: shifted SVM solution unexpected',s);
    console.info('U11 shifted SVM at x₃ = 0.5: w = '+s.w.toFixed(4)+', b = '+s.b.toFixed(4)+', α₂ = α₃ = '+s.a[2].toFixed(4)+', boundary x = '+(-s.b/s.w).toFixed(4)+', margin = '+(2/s.w).toFixed(4)); })();
})();
