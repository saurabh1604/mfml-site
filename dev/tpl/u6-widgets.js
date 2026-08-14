/* ---------- unit-6 local helpers ---------- */
function bindCtl(id,fn,fmtr){const r=document.getElementById(id),o=document.getElementById(id+'-o');
  const upd=()=>{if(o)o.textContent=fmtr?fmtr(+r.value):fmt(+r.value,2);fn(+r.value);};
  r.addEventListener('input',upd);return upd;}
function tabs(bar,onSwitch){bar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));
  onSwitch(b.dataset.t);}));}
/* marching-squares contour lines for f on [X0,X1]x[Y0,Y1] */
function contours(p,f,levels,X0,X1,Y0,Y1,color,N){
  N=N||44;const g=el('g',{},p.svg);
  const hx=(X1-X0)/N,hy=(Y1-Y0)/N,V=[];
  for(let i=0;i<=N;i++){V[i]=[];for(let j=0;j<=N;j++)V[i][j]=f(X0+i*hx,Y0+j*hy);}
  const ip=(a,b,va,vb,L)=>a+(b-a)*((L-va)/((vb-va)||1e-9));
  levels.forEach(L=>{let d='';
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){
      const x0=X0+i*hx,x1=x0+hx,y0=Y0+j*hy,y1=y0+hy;
      const v=[V[i][j],V[i+1][j],V[i+1][j+1],V[i][j+1]];
      const cs=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
      const pts=[];
      for(let k=0;k<4;k++){const a=v[k],b=v[(k+1)%4];
        if((a<L)!==(b<L)){const A=cs[k],B=cs[(k+1)%4];
          pts.push([ip(A[0],B[0],a,b,L),ip(A[1],B[1],a,b,L)]);}}
      for(let k=0;k+1<pts.length;k+=2)
        d+=`M${p.px(pts[k][0]).toFixed(1)},${p.py(pts[k][1]).toFixed(1)}L${p.px(pts[k+1][0]).toFixed(1)},${p.py(pts[k+1][1]).toFixed(1)}`;
    }
    if(d)el('path',{d,stroke:color||'var(--grid)','stroke-width':1.1,fill:'none'},g);});
  return g;}

/* ================= W1 · THE FOGGY VALLEY ================= */
(function(){
  const svg=document.getElementById('val-svg'),read=document.getElementById('val-read'),verd=document.getElementById('val-verdict');
  const L=w=>0.15*w*w*w*w-0.55*w*w+0.15*w+1.2, dL=w=>0.6*w*w*w-1.1*w+0.15;
  const VX=2.2,VY=2.6;
  let w=1.9,fog=1;
  function draw(){
    const p=plane(svg,-VX,VX,-0.05,VY,{step:1,tickEvery:1,pad:24});
    const lit=fog>0.02?0.45+ (1-fog)*3.2 : 99;
    let dFull='',dLit='';
    for(let i=0;i<=300;i++){const x=-VX+2*VX*i/300,y=L(x);
      const seg=(i?'L':'M')+p.px(x).toFixed(1)+','+p.py(y).toFixed(1);
      dFull+=seg; if(Math.abs(x-w)<lit)dLit+=(dLit?'L':'M')+p.px(x).toFixed(1)+','+p.py(y).toFixed(1);}
    el('path',{d:dFull,stroke:'var(--grid)','stroke-width':2,fill:'none',opacity:fog>0.02?(1-fog)*0.9+0.06:1},svg);
    el('path',{d:dLit,stroke:'var(--s1)','stroke-width':3,fill:'none'},svg);
    // tangent, shortened so a steep slope stays inside the frame
    const m=dL(w),y0=L(w),dx=Math.min(0.8,0.55/Math.max(0.35,Math.abs(m)));
    el('path',{d:`M${p.px(w-dx)},${p.py(y0-m*dx)}L${p.px(w+dx)},${p.py(y0+m*dx)}`,stroke:'var(--s2)','stroke-width':2.2,'stroke-dasharray':'7 5'},svg);
    el('circle',{cx:p.px(w),cy:p.py(y0),r:6,fill:'var(--ink)'},svg);
    // downhill arrow
    const dir=-Math.sign(m)||1;
    const ay=Math.max(0.18,y0-0.42);
    arrow(p,w,ay,w+dir*0.5,ay,'var(--s3)',3,'downhill');
    txt(svg,p.px(0),p.py(-0.05)+22,'model parameter w','font:600 11px system-ui;fill:var(--ink-muted)','middle');
    txt(svg,14,26,'loss','font:600 11px system-ui;fill:var(--ink-muted)');
    read.innerHTML=`L(w) = <b>${fmt(L(w),3)}</b><br>slope L′(w) = <b style="color:var(--s2)">${fmt(m,3)}</b><br>step direction = <b style="color:var(--s3)">${dir>0?'+w':'−w'}</b>`;
    const flat=Math.abs(m)<0.06;
    verd.className='verdict '+(flat?'good':'info');
    verd.textContent=flat?'✓ Slope ≈ 0 — flat ground. A minimum, or a trap?':(fog>0.5?'You can only see your own patch — yet the slope still names a direction.':'Fog lifted: now you can see the whole valley. Your model never can.');
  }
  bindCtl('val-w',v=>{w=v;draw();})();
  bindCtl('val-fog',v=>{fog=v;draw();},v=>v>0.5?'on':(v<0.05?'off':fmt(v,2)))();
  svg.addEventListener('pointerdown',e=>{
    const p=plane(svg,-VX,VX,-0.05,VY,{step:1,pad:24});
    const pt=planePt(svg,p,e);const r=document.getElementById('val-w');
    r.value=Math.max(-2.05,Math.min(2.05,pt[0]));r.dispatchEvent(new Event('input'));});
  draw();
})();

/* ================= W2 · SECANT → TANGENT ================= */
(function(){
  const svg=document.getElementById('sec-svg'),read=document.getElementById('sec-read'),verd=document.getElementById('sec-verdict');
  const FS=[{n:'x²',f:x=>x*x,d:x=>2*x,sym:'2x'},
            {n:'x³−2x',f:x=>x*x*x-2*x,d:x=>3*x*x-2,sym:'3x²−2'},
            {n:'sin x',f:x=>Math.sin(x),d:x=>Math.cos(x),sym:'cos x'}];
  let k=0,x0=1,hv=0.85;
  const hOf=v=>0.02+v*1.2;
  function draw(){
    const F=FS[k],h=hOf(hv);
    const p=plane(svg,-2.2,2.2,-2.4,2.8,{step:1,tickEvery:1,pad:26});
    let d='';for(let i=0;i<=300;i++){const x=-2.2+4.4*i/300;d+=(i?'L':'M')+p.px(x).toFixed(1)+','+p.py(F.f(x)).toFixed(1);}
    el('path',{d,stroke:'var(--s1)','stroke-width':2.6,fill:'none'},svg);
    const y0=F.f(x0),x1=x0+h,y1=F.f(x1),m=(y1-y0)/h,tr=F.d(x0);
    // tangent (dashed, truth)
    el('path',{d:`M${p.px(x0-1.5)},${p.py(y0-tr*1.5)}L${p.px(x0+1.5)},${p.py(y0+tr*1.5)}`,stroke:'var(--s3)','stroke-width':2,'stroke-dasharray':'6 5'},svg);
    // secant
    el('path',{d:`M${p.px(x0-1.5)},${p.py(y0-m*1.5)}L${p.px(x0+1.5)},${p.py(y0+m*1.5)}`,stroke:'var(--s2)','stroke-width':2.4},svg);
    // rise/run triangle
    if(h>0.05){
      el('path',{d:`M${p.px(x0)},${p.py(y0)}L${p.px(x1)},${p.py(y0)}L${p.px(x1)},${p.py(y1)}`,stroke:'var(--ink-muted)','stroke-width':1.4,fill:'none','stroke-dasharray':'3 3'},svg);
      txt(svg,(p.px(x0)+p.px(x1))/2,p.py(y0)+14,'h','font:700 11px system-ui;fill:var(--ink-muted)','middle');}
    el('circle',{cx:p.px(x0),cy:p.py(y0),r:5.5,fill:'var(--ink)'},svg);
    el('circle',{cx:p.px(x1),cy:p.py(y1),r:5,fill:'var(--s2)'},svg);
    read.innerHTML=`h = <b>${fmt(h,3)}</b><br>secant slope = <b style="color:var(--s2)">${fmt(m,4)}</b><br>true f′(${fmt(x0,2)}) = <b style="color:var(--s3)">${fmt(tr,4)}</b> &nbsp;<span style="color:var(--ink-muted)">(${F.sym})</span><br>gap = <b>${fmt(Math.abs(m-tr),4)}</b>`;
    const close=Math.abs(m-tr)<0.02;
    verd.className='verdict '+(close?'good':'info');
    verd.textContent=close?'✓ The secant has settled onto the tangent — that number is the derivative.':'The two lines still disagree. Shrink h and watch the gap collapse.';
  }
  tabs(document.getElementById('sec-tabs'),t=>{k=+t;draw();});
  bindCtl('sec-x',v=>{x0=v;draw();})();
  bindCtl('sec-h',v=>{hv=v;draw();},v=>fmt(hOf(v),3))();
  draw();
})();

/* ================= W3 · THE CHAIN RULE MACHINE ================= */
(function(){
  const svg=document.getElementById('ch-svg'),read=document.getElementById('ch-read'),verd=document.getElementById('ch-verdict');
  const CS=[{n:'(2x+1)⁴',f:x=>2*x+1,df:()=>2,g:u=>u*u*u*u,dg:u=>4*u*u*u,fl:'f(x)=2x+1',gl:'g(u)=u⁴',dfl:"f′=2",dgl:"g′=4u³"},
            {n:'sin(x²)',f:x=>x*x,df:x=>2*x,g:u=>Math.sin(u),dg:u=>Math.cos(u),fl:'f(x)=x²',gl:'g(u)=sin u',dfl:"f′=2x",dgl:"g′=cos u"},
            {n:'e^(3x)',f:x=>3*x,df:()=>3,g:u=>Math.exp(u),dg:u=>Math.exp(u),fl:'f(x)=3x',gl:'g(u)=eᵘ',dfl:"f′=3",dgl:"g′=eᵘ"}];
  let k=0,x=0.5,dx=0.1;
  function box(X,Y,W,H,label,sub,col){
    el('rect',{x:X,y:Y,width:W,height:H,rx:12,fill:'var(--page)',stroke:col,'stroke-width':2},svg);
    txt(svg,X+W/2,Y+H/2-2,label,`font:700 14px system-ui;fill:${col}`,'middle');
    if(sub)txt(svg,X+W/2,Y+H/2+16,sub,'font:600 11px system-ui;fill:var(--ink-muted)','middle');}
  function bar(cx,cy,val,scale,col,lab){
    const w=Math.max(2,Math.min(70,Math.abs(val)*scale));
    el('rect',{x:cx-w/2,y:cy-6,width:w,height:12,rx:6,fill:col,opacity:.85},svg);
    txt(svg,cx,cy+26,lab,`font:700 11px system-ui;fill:${col}`,'middle');}
  function draw(){
    const C=CS[k];svg.innerHTML='';
    const u=C.f(x),du=C.f(x+dx)-u,h0=C.g(u),dh=C.g(u+du)-h0;
    const a1=du/dx,a2=dh/(du||1e-12),tot=dh/dx;
    const pf=C.df(x),pg=C.dg(u),ptot=pf*pg;
    box(40,60,130,72,C.fl,C.dfl,'var(--s1)');
    box(250,60,130,72,C.gl,C.dgl,'var(--s3)');
    [[175,'var(--s1)'],[385,'var(--s3)']].forEach(([X,c])=>{
      el('path',{d:`M${X},96L${X+64},96`,stroke:c,'stroke-width':2.2},svg);
      el('polygon',{points:`${X+70},96 ${X+60},91 ${X+60},101`,fill:c},svg);});
    txt(svg,20,96,'x','font:700 14px system-ui;fill:var(--ink)','middle');
    txt(svg,212,84,'u','font:700 13px system-ui;fill:var(--ink-2)','middle');
    txt(svg,470,96,'h','font:700 14px system-ui;fill:var(--ink)','middle');
    txt(svg,275,26,'two amplifiers in series — the ratios multiply','font:600 12px system-ui;fill:var(--ink-muted)','middle');
    const s1=520/Math.max(dx,1e-9)/12;
    bar(95,190,dx,Math.min(600,s1),'var(--ink-2)','Δx = '+fmt(dx,3));
    bar(275,190,du,Math.min(600,s1),'var(--s1)','Δu = '+fmt(du,3));
    bar(455,190,dh,Math.min(600,s1),'var(--s3)','Δh = '+fmt(dh,3));
    txt(svg,275,258,`×${fmt(a1,3)}  then  ×${fmt(a2,3)}   =   ×${fmt(tot,3)}`,'font:700 13px system-ui;fill:var(--ink)','middle');
    read.innerHTML=`measured Δh/Δx = <b>${fmt(tot,4)}</b><br>chain rule g′(f(x))·f′(x) = <b style="color:var(--s3)">${fmt(pg,3)}</b> × <b style="color:var(--s1)">${fmt(pf,3)}</b> = <b>${fmt(ptot,4)}</b><br>difference = <b>${fmt(Math.abs(tot-ptot),4)}</b>`;
    const close=Math.abs(tot-ptot)<0.01*Math.max(1,Math.abs(ptot));
    verd.className='verdict '+(close?'good':'info');
    verd.textContent=close?'✓ Measured amplification matches the product of the two derivatives.':'Nudge still too big — the leftover gap is curvature, which the derivative ignores.';
  }
  tabs(document.getElementById('ch-tabs'),t=>{k=+t;draw();});
  bindCtl('ch-x',v=>{x=v;draw();})();
  bindCtl('ch-n',v=>{dx=v;draw();},v=>fmt(v,3))();
  draw();
})();

/* ================= W4 · THE TAYLOR BUILDER ================= */
(function(){
  const svg=document.getElementById('tay-svg'),read=document.getElementById('tay-read'),verd=document.getElementById('tay-verdict');
  const fact=n=>{let r=1;for(let i=2;i<=n;i++)r*=i;return r;};
  const FS=[
    {n:'sin x + cos x',x0:0,f:x=>Math.sin(x)+Math.cos(x),c:k=>[1,1,-1,-1][k%4]/fact(k),X:[-6,6],Y:[-2.2,2.2],note:'derivatives cycle 1, 1, −1, −1'},
    {n:'x⁴ at x₀=1',x0:1,f:x=>x*x*x*x,c:k=>[1,4,6,4,1,0,0,0,0,0][k],X:[-0.6,2.4],Y:[-1.2,7],note:'exact once n ≥ 4 — every higher derivative is 0'},
    {n:'σ(x)',x0:0,f:x=>1/(1+Math.exp(-x)),c:k=>[0.5,0.25,0,-1/48,0,1/480,0,-17/80640,0,31/1451520][k],X:[-6,6],Y:[-0.3,1.4],note:'even-order terms vanish by symmetry'},
    {n:'ln(1+x)',x0:0,f:x=>Math.log(1+x),c:k=>k===0?0:(k%2?1:-1)/k,X:[-0.95,2.6],Y:[-3,2],note:'only trustworthy for |x| < 1'},
    {n:'eˣ',x0:0,f:x=>Math.exp(x),c:k=>1/fact(k),X:[-3.4,2.6],Y:[-1.5,8],note:'converges everywhere, fastest near 0'}];
  let k=0,deg=1;
  function draw(){
    const F=FS[k];
    const p=plane(svg,F.X[0],F.X[1],F.Y[0],F.Y[1],{step:1,tickEvery:F.X[1]-F.X[0]>7?2:1,pad:26});
    const T=x=>{let s=0;for(let j=0;j<=deg;j++)s+=F.c(j)*Math.pow(x-F.x0,j);return s;};
    let df='',dt='';const N=340;let worst=0,pf=false,pt2=false;
    const inY=v=>isFinite(v)&&v>=F.Y[0]&&v<=F.Y[1];
    for(let i=0;i<=N;i++){const x=F.X[0]+(F.X[1]-F.X[0])*i/N;
      const yf=F.f(x),yt=T(x);
      if(inY(yf)){df+=(pf?'L':'M')+p.px(x).toFixed(1)+','+p.py(yf).toFixed(1);pf=true;}else pf=false;
      if(inY(yt)){dt+=(pt2?'L':'M')+p.px(x).toFixed(1)+','+p.py(yt).toFixed(1);pt2=true;}else pt2=false;
      if(Math.abs(x-F.x0)<1&&isFinite(yf)&&isFinite(yt))worst=Math.max(worst,Math.abs(yf-yt));}
    el('path',{d:df,stroke:'var(--s1)','stroke-width':2.8,fill:'none'},svg);
    el('path',{d:dt,stroke:'var(--s2)','stroke-width':2.4,fill:'none','stroke-dasharray':'7 4'},svg);
    el('circle',{cx:p.px(F.x0),cy:p.py(F.f(F.x0)),r:5.5,fill:'var(--ink)'},svg);
    txt(svg,p.px(F.x0),p.py(F.f(F.x0))-13,'anchor x₀='+F.x0,'font:700 11px system-ui;fill:var(--ink-2)','middle');
    txt(svg,46,26,'f(x)','font:700 12px system-ui;fill:var(--s1)');
    txt(svg,46,44,'Tₙ(x)','font:700 12px system-ui;fill:var(--s2)');
    let terms=[];for(let j=0;j<=deg;j++){const c=F.c(j);if(Math.abs(c)>1e-12)terms.push((c>0&&terms.length?'+ ':'')+fmt(c,4)+(j?(F.x0?`(x−${F.x0})`:'x')+(j>1?'^'+j:''):''));}
    read.innerHTML=`n = <b>${deg}</b> · terms kept: <b>${terms.length}</b><br><span style="font-size:.86em">Tₙ = ${terms.join(' ')||'0'}</span><br>max error near anchor = <b>${worst<1e-12?'0':fmt(worst,4)}</b>`;
    const exact=worst<1e-9;
    verd.className='verdict '+(exact?'good':'info');
    verd.textContent=exact?'✓ Exact — the polynomial has fully reproduced the function.':F.note;
  }
  tabs(document.getElementById('tay-tabs'),t=>{k=+t;draw();});
  bindCtl('tay-deg',v=>{deg=v;draw();},v=>String(v|0))();
  draw();
})();

/* ================= W5 · THE SLICER (3D) ================= */
(function(){
  const svg=document.getElementById('ps-svg'),read=document.getElementById('ps-read'),verd=document.getElementById('ps-verdict');
  const f=(x,y)=>x*x-y*y+0.5*x*y, fx=(x,y)=>2*x+0.5*y, fy=(x,y)=>-2*y+0.5*x;
  const E=engine3d(svg,{scale:66,yaw:-0.72,pitch:0.42,cy:26});
  let mode=2,x0=0.8,y0=-0.6;
  const R=1.7;
  function draw(){
    svg.innerHTML='';
    const P=v=>E.proj([v[0],v[1],v[2]*0.62]);
    const segs=[];
    const N=13;
    for(let i=0;i<=N;i++){const u=-R+2*R*i/N;
      for(let j=0;j<N;j++){
        const v1=-R+2*R*j/N,v2=-R+2*R*(j+1)/N;
        segs.push([[u,v1,f(u,v1)],[u,v2,f(u,v2)]]);
        segs.push([[v1,u,f(v1,u)],[v2,u,f(v2,u)]]);}}
    segs.map(s=>({s,d:(P(s[0]).d+P(s[1]).d)/2})).sort((a,b)=>a.d-b.d).forEach(({s,d})=>{
      const A=P(s[0]),B=P(s[1]);
      el('line',{x1:A.x,y1:A.y,x2:B.x,y2:B.y,stroke:'var(--grid)','stroke-width':1,opacity:Math.max(.25,Math.min(1,0.62+d*0.2))},svg);});
    // slice curves
    function curve(fixY,col){let d='';
      for(let i=0;i<=90;i++){const t=-R+2*R*i/90;
        const pt=fixY?P([t,y0,f(t,y0)]):P([x0,t,f(x0,t)]);
        d+=(i?'L':'M')+pt.x.toFixed(1)+','+pt.y.toFixed(1);}
      el('path',{d,stroke:col,'stroke-width':3,fill:'none'},svg);}
    function tang(fixY,col){const m=fixY?fx(x0,y0):fy(x0,y0),L=0.75;
      const a=fixY?P([x0-L,y0,f(x0,y0)-m*L]):P([x0,y0-L,f(x0,y0)-m*L]);
      const b=fixY?P([x0+L,y0,f(x0,y0)+m*L]):P([x0,y0+L,f(x0,y0)+m*L]);
      el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:col,'stroke-width':2.6,'stroke-dasharray':'7 4'},svg);}
    if(mode===0||mode===2){curve(true,'var(--s1)');tang(true,'var(--s2)');}
    if(mode===1||mode===2){curve(false,'var(--s3)');tang(false,'var(--s7)');}
    const c=P([x0,y0,f(x0,y0)]);
    el('circle',{cx:c.x,cy:c.y,r:6,fill:'var(--ink)'},svg);
    txt(svg,16,24,'f(x,y) = x² − y² + ½xy','font:700 12px system-ui;fill:var(--ink-2)');
    if(mode===0||mode===2)txt(svg,16,44,'slice: y frozen at '+fmt(y0,2),'font:700 11px system-ui;fill:var(--s1)');
    if(mode===1||mode===2)txt(svg,16,mode===2?62:44,'slice: x frozen at '+fmt(x0,2),'font:700 11px system-ui;fill:var(--s3)');
    read.innerHTML=`f(x₀,y₀) = <b>${fmt(f(x0,y0),3)}</b><br>∂f/∂x = 2x + ½y = <b style="color:var(--s2)">${fmt(fx(x0,y0),3)}</b><br>∂f/∂y = −2y + ½x = <b style="color:var(--s7)">${fmt(fy(x0,y0),3)}</b><br>∇f = [ ${fmt(fx(x0,y0),2)}, ${fmt(fy(x0,y0),2)} ]`;
    const s=fx(x0,y0)*fy(x0,y0);
    verd.className='verdict '+(Math.abs(fx(x0,y0))<0.05&&Math.abs(fy(x0,y0))<0.05?'good':'info');
    verd.textContent=(Math.abs(fx(x0,y0))<0.08&&Math.abs(fy(x0,y0))<0.08)?'✓ Both partials ≈ 0 — the saddle point. Flat, but not a minimum.':(s<0?'The two slices tilt opposite ways — the signature of a saddle.':'Both slices tilt the same way here.');
  }
  E.drag(draw);
  bindCtl('ps-x',v=>{x0=v;draw();})();
  bindCtl('ps-y',v=>{y0=v;draw();})();
  tabs(document.getElementById('ps-tabs'),t=>{mode=+t;draw();});
  draw();
})();

/* ================= W6 · THE GRADIENT COMPASS ================= */
(function(){
  const svg=document.getElementById('gc-svg'),read=document.getElementById('gc-read'),verd=document.getElementById('gc-verdict');
  const FS=[{n:'bowl',f:(x,y)=>0.5*(x*x+y*y),g:(x,y)=>[x,y],lv:[0.1,0.3,0.6,1,1.5,2.1,2.8,3.6],note:'Circular contours: the gradient points straight at the centre from anywhere.'},
            {n:'stretched valley',f:(x,y)=>0.5*(0.16*x*x+2.4*y*y),g:(x,y)=>[0.16*x,2.4*y],lv:[0.05,0.15,0.3,0.5,0.8,1.2,1.7,2.3],note:'The arrow barely leans along the flat axis — descent will zig-zag across the narrow one.'},
            {n:'saddle',f:(x,y)=>0.5*(x*x-y*y),g:(x,y)=>[x,-y],lv:[-2,-1.2,-0.6,-0.2,0.2,0.6,1.2,2],note:'Up one way, down the other. The centre is flat yet is no minimum at all.'}];
  let k=0,px0=1.5,py0=1.05;
  function draw(){
    const F=FS[k];
    const p=plane(svg,-2.6,2.6,-1.9,1.9,{step:1,tickEvery:1,pad:26});
    contours(p,F.f,F.lv,-2.6,2.6,-1.9,1.9,'var(--grid)',52);
    const g=F.g(px0,py0),n=Math.hypot(g[0],g[1])||1e-9,s=Math.min(1.15,0.35+n*0.42)/n;
    arrow(p,px0,py0,px0+g[0]*s,py0+g[1]*s,'var(--s2)',3.2,'∇f');
    arrow(p,px0,py0,px0-g[0]*s,py0-g[1]*s,'var(--s3)',3.2,'−∇f');
    el('circle',{cx:p.px(px0),cy:p.py(py0),r:6,fill:'var(--ink)'},svg);
    txt(svg,16,24,F.n,'font:700 12px system-ui;fill:var(--ink-2)');
    txt(svg,16,42,'drag anywhere','font:600 11px system-ui;fill:var(--ink-muted)');
    read.innerHTML=`point = ( ${fmt(px0,2)}, ${fmt(py0,2)} )<br>f = <b>${fmt(F.f(px0,py0),3)}</b><br>∇f = [ <b style="color:var(--s2)">${fmt(g[0],3)}</b>, <b style="color:var(--s2)">${fmt(g[1],3)}</b> ]<br>‖∇f‖ = <b>${fmt(n,3)}</b> &nbsp;<span style="color:var(--ink-muted)">(steepness)</span>`;
    const flat=n<0.09;
    verd.className='verdict '+(flat?'good':'info');
    verd.textContent=flat?(k===2?'✓ Gradient ≈ 0 — but this is a saddle, not a minimum.':'✓ Gradient ≈ 0 — you have arrived at the flat point.'):F.note;
  }
  function pick(e){const p=plane(svg,-2.6,2.6,-1.9,1.9,{step:1,pad:26});const q=planePt(svg,p,e);
    px0=Math.max(-2.5,Math.min(2.5,q[0]));py0=Math.max(-1.8,Math.min(1.8,q[1]));draw();}
  let down=false;
  svg.addEventListener('pointerdown',e=>{down=true;try{svg.setPointerCapture(e.pointerId)}catch(_){}pick(e);e.preventDefault();});
  svg.addEventListener('pointermove',e=>{if(down)pick(e);});
  ['pointerup','pointercancel'].forEach(ev=>svg.addEventListener(ev,()=>down=false));
  tabs(document.getElementById('gc-tabs'),t=>{k=+t;draw();});
  draw();
})();

/* ================= W7 · THE SHAPE CALCULATOR ================= */
(function(){
  const svg=document.getElementById('sh-svg'),read=document.getElementById('sh-read'),verd=document.getElementById('sh-verdict');
  let IN='s',OUT='s';
  const TABLE={
    ss:{name:'a scalar',shape:'1 number',sym:'\\frac{dy}{dx}',ml:'a single learning-rate schedule',ok:1},
    vs:{name:'the gradient',shape:'n numbers (a vector)',sym:'\\nabla f',ml:'loss w.r.t. weights — the one that trains everything',ok:2},
    ms:{name:'a gradient matrix',shape:'m × n',sym:'\\frac{dy}{dX}',ml:'loss w.r.t. a CNN kernel',ok:1},
    sv:{name:'a tangent vector',shape:'m numbers',sym:'\\frac{d\\mathbf{y}}{dx}',ml:'a curve traced through parameter space',ok:1},
    vv:{name:'the Jacobian',shape:'m × n',sym:'\\mathbf{J}',ml:'one layer of a neural network',ok:2},
    mv:{name:'a rank-3 tensor',shape:'m × p × q',sym:'',ml:'rare in practice — reshape first',ok:0},
    sm:{name:'a matrix of derivatives',shape:'p × q',sym:'\\frac{dY}{dx}',ml:'a weight matrix evolving over time',ok:1},
    vm:{name:'a rank-3 tensor',shape:'p × q × n',sym:'',ml:'rare in practice — reshape first',ok:0},
    mm:{name:'a rank-4 tensor',shape:'p × q × m × n',sym:'',ml:'inside every autodiff library, never built explicitly',ok:0}};
  function shapeBox(X,Y,kind,label,col){
    if(kind==='s'){el('rect',{x:X+26,y:Y+26,width:20,height:20,rx:4,fill:col,opacity:.85},svg);}
    else if(kind==='v'){for(let i=0;i<4;i++)el('rect',{x:X+26,y:Y+8+i*18,width:20,height:14,rx:3,fill:col,opacity:.85},svg);}
    else{for(let i=0;i<3;i++)for(let j=0;j<3;j++)el('rect',{x:X+12+j*22,y:Y+10+i*22,width:18,height:18,rx:3,fill:col,opacity:.85},svg);}
    txt(svg,X+36,Y+104,label,'font:700 11px system-ui;fill:var(--ink-2)','middle');}
  function draw(){
    svg.innerHTML='';
    const key=IN+OUT,T=TABLE[key];
    shapeBox(20,40,IN,'input','var(--s1)');
    shapeBox(340,40,OUT,'output','var(--s3)');
    el('path',{d:'M104,86L150,86',stroke:'var(--ink-muted)','stroke-width':2},svg);
    el('polygon',{points:'156,86 146,81 146,91',fill:'var(--ink-muted)'},svg);
    el('path',{d:'M266,86L318,86',stroke:'var(--ink-muted)','stroke-width':2},svg);
    el('polygon',{points:'324,86 314,81 314,91',fill:'var(--ink-muted)'},svg);
    el('rect',{x:160,y:56,width:104,height:60,rx:12,fill:'var(--page)',stroke:'var(--s2)','stroke-width':2},svg);
    txt(svg,212,84,'f','font:700 18px system-ui;fill:var(--s2)','middle');
    txt(svg,212,104,'the function','font:600 10px system-ui;fill:var(--ink-muted)','middle');
    // derivative object
    const dcol=T.ok===2?'var(--s7)':(T.ok===1?'var(--ink-2)':'var(--serious)');
    el('rect',{x:96,y:160,width:270,height:64,rx:14,fill:'var(--surface)',stroke:dcol,'stroke-width':2.4},svg);
    txt(svg,231,184,'derivative is '+T.name,`font:700 13px system-ui;fill:${dcol}`,'middle');
    txt(svg,231,205,'shape: '+T.shape,'font:600 12px system-ui;fill:var(--ink-muted)','middle');
    read.innerHTML=`<b>${T.name}</b> · shape <b>${T.shape}</b><br><span style="color:var(--ink-muted)">${T.ml}</span>`;
    verd.className='verdict '+(T.ok===2?'good':'info');
    verd.textContent=T.ok===2?'★ One of the two shapes that carry practical machine learning.':(T.ok===1?'One number per (output, input) pair — count the pairs and the shape follows.':'A tensor of rank 3 or more: mathematically fine, almost never built in memory.');
  }
  tabs(document.getElementById('sh-in'),t=>{IN=t;draw();});
  tabs(document.getElementById('sh-out'),t=>{OUT=t;draw();});
  draw();
})();

/* ================= W8 · ZOOM UNTIL IT'S LINEAR ================= */
(function(){
  const svg=document.getElementById('jm-svg'),read=document.getElementById('jm-read'),verd=document.getElementById('jm-verdict');
  const MS=[
    {n:'linear',T:(x,y)=>[2*x-y,x+3*y],J:()=>[[2,-1],[1,3]],lab:'(2x − y, x + 3y)',det:'7 everywhere'},
    {n:'squaring',T:(x,y)=>[x*x-y*y,2*x*y],J:(x,y)=>[[2*x,-2*y],[2*y,2*x]],lab:'(x² − y², 2xy)',det:'4(x²+y²)'},
    {n:'exponential',T:(x,y)=>[Math.exp(x)*Math.cos(y),Math.exp(x)*Math.sin(y)],J:(x,y)=>[[Math.exp(x)*Math.cos(y),-Math.exp(x)*Math.sin(y)],[Math.exp(x)*Math.sin(y),Math.exp(x)*Math.cos(y)]],lab:'(eˣcos y, eˣsin y)',det:'e^{2x} — never zero'}];
  let k=0,x0=0.6,y0=0.5,win=0.8;
  function draw(){
    const M=MS[k];svg.innerHTML='';
    // left panel: input plane
    const gl=el('g',{},svg);
    const LX=[-1.6,1.6],LY=[-1.6,1.6],lw=250,lh=250,lox=22,loy=44;
    const lpx=x=>lox+(x-LX[0])/(LX[1]-LX[0])*lw, lpy=y=>loy+lh-(y-LY[0])/(LY[1]-LY[0])*lh;
    el('rect',{x:lox,y:loy,width:lw,height:lh,rx:8,fill:'none',stroke:'var(--ring)'},gl);
    for(let i=-1;i<=1;i++){el('line',{x1:lpx(i),y1:loy,x2:lpx(i),y2:loy+lh,stroke:'var(--grid)','stroke-width':1},gl);
      el('line',{x1:lox,y1:lpy(i),x2:lox+lw,y2:lpy(i),stroke:'var(--grid)','stroke-width':1},gl);}
    const hw=win/2;
    el('rect',{x:lpx(x0-hw),y:lpy(y0+hw),width:lpx(x0+hw)-lpx(x0-hw),height:lpy(y0-hw)-lpy(y0+hw),
      fill:'var(--wash-1)',stroke:'var(--s1)','stroke-width':2},gl);
    el('circle',{cx:lpx(x0),cy:lpy(y0),r:4.5,fill:'var(--ink)'},gl);
    txt(svg,lox+lw/2,loy-10,'input  (x, y)','font:700 12px system-ui;fill:var(--ink-2)','middle');
    // right panel: image of the window, auto-scaled
    const N=9,pts=[];
    for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){
      const xx=x0-hw+win*i/N, yy=y0-hw+win*j/N;
      pts.push([M.T(xx,yy),i,j]);}
    let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;
    pts.forEach(([q])=>{mnx=Math.min(mnx,q[0]);mxx=Math.max(mxx,q[0]);mny=Math.min(mny,q[1]);mxy=Math.max(mxy,q[1]);});
    const spanX=Math.max(mxx-mnx,1e-6),spanY=Math.max(mxy-mny,1e-6),span=Math.max(spanX,spanY)*1.25;
    const ccx=(mnx+mxx)/2,ccy=(mny+mxy)/2,rox=306,roy=44,rw=250,rh=250;
    const rpx=x=>rox+rw/2+(x-ccx)/span*rw, rpy=y=>roy+rh/2-(y-ccy)/span*rh;
    el('rect',{x:rox,y:roy,width:rw,height:rh,rx:8,fill:'none',stroke:'var(--ring)'},svg);
    const at=(i,j)=>pts[i*(N+1)+j][0];
    for(let i=0;i<=N;i++){let d1='',d2='';
      for(let j=0;j<=N;j++){const a=at(i,j),b=at(j,i);
        d1+=(j?'L':'M')+rpx(a[0]).toFixed(1)+','+rpy(a[1]).toFixed(1);
        d2+=(j?'L':'M')+rpx(b[0]).toFixed(1)+','+rpy(b[1]).toFixed(1);}
      el('path',{d:d1,stroke:'var(--s1)','stroke-width':1.1,fill:'none',opacity:.55},svg);
      el('path',{d:d2,stroke:'var(--s1)','stroke-width':1.1,fill:'none',opacity:.55},svg);}
    // the Jacobian parallelogram at the centre
    const J=M.J(x0,y0),c=M.T(x0,y0);
    const e1=[J[0][0]*hw,J[1][0]*hw],e2=[J[0][1]*hw,J[1][1]*hw];
    const corner=(a,b)=>[c[0]+a*e1[0]+b*e2[0],c[1]+a*e1[1]+b*e2[1]];
    const cs=[corner(-1,-1),corner(1,-1),corner(1,1),corner(-1,1)];
    el('polygon',{points:cs.map(q=>rpx(q[0]).toFixed(1)+','+rpy(q[1]).toFixed(1)).join(' '),
      fill:'none',stroke:'var(--s2)','stroke-width':2.4,'stroke-dasharray':'7 4'},svg);
    el('circle',{cx:rpx(c[0]),cy:rpy(c[1]),r:4.5,fill:'var(--ink)'},svg);
    txt(svg,rox+rw/2,roy-10,'output — dashed = what J predicts','font:700 12px system-ui;fill:var(--ink-2)','middle');
    txt(svg,22,17,M.lab,'font:700 12px system-ui;fill:var(--s1)');
    const det=J[0][0]*J[1][1]-J[0][1]*J[1][0];
    read.innerHTML=`J at (${fmt(x0,2)}, ${fmt(y0,2)}) =<br><span style="font-family:var(--mono)">[ ${fmt(J[0][0],2)}&nbsp; ${fmt(J[0][1],2)} ]<br>[ ${fmt(J[1][0],2)}&nbsp; ${fmt(J[1][1],2)} ]</span><br>det J = <b>${fmt(det,3)}</b> &nbsp;<span style="color:var(--ink-muted)">(${M.det})</span>`;
    // how well does the linear model match the true image corners?
    let err=0;[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,b])=>{
      const tr=M.T(x0+a*hw,y0+b*hw),pr=corner(a,b);
      err=Math.max(err,Math.hypot(tr[0]-pr[0],tr[1]-pr[1]));});
    const rel=err/Math.max(span,1e-9);
    verd.className='verdict '+(rel<0.02?'good':'info');
    verd.textContent=rel<0.02?'✓ At this window size the map is linear to the eye — J tells the whole story.':'Curvature still visible: the true image bulges away from the dashed parallelogram. Shrink the window.';
  }
  tabs(document.getElementById('jm-tabs'),t=>{k=+t;draw();});
  bindCtl('jm-x',v=>{x0=v;draw();})();
  bindCtl('jm-y',v=>{y0=v;draw();})();
  bindCtl('jm-z',v=>{win=v;draw();})();
  draw();
})();

/* ================= W9 · BACKPROP, ONE JACOBIAN AT A TIME ================= */
(function(){
  const svg=document.getElementById('bp-svg'),read=document.getElementById('bp-read'),verd=document.getElementById('bp-verdict');
  const W=[[2,-1],[1,3]],Y=[0.5,-0.5];
  let x=[1,1],stage=0;
  const MAXS=5;
  function calc(){
    const z=[W[0][0]*x[0]+W[0][1]*x[1], W[1][0]*x[0]+W[1][1]*x[1]];
    const a=z.map(Math.tanh);
    const r=[a[0]-Y[0],a[1]-Y[1]];
    const L=0.5*(r[0]*r[0]+r[1]*r[1]);
    const dLda=[r[0],r[1]];
    const dadz=[1-a[0]*a[0],1-a[1]*a[1]];
    const dLdz=[dLda[0]*dadz[0],dLda[1]*dadz[1]];
    const dLdx=[dLdz[0]*W[0][0]+dLdz[1]*W[1][0], dLdz[0]*W[0][1]+dLdz[1]*W[1][1]];
    return {z,a,r,L,dLda,dadz,dLdz,dLdx};}
  function node(X,label,vals,col,on,shape){
    el('rect',{x:X,y:56,width:96,height:62,rx:12,fill:on?'var(--surface)':'var(--page)',stroke:on?col:'var(--ring)','stroke-width':on?2.4:1.4},svg);
    txt(svg,X+48,78,label,`font:700 13px system-ui;fill:${on?col:'var(--ink-muted)'}`,'middle');
    txt(svg,X+48,98,vals,'font:600 11px var(--mono),monospace;fill:var(--ink-2)','middle');
    if(shape)txt(svg,X+48,132,shape,'font:600 10px system-ui;fill:var(--ink-muted)','middle');}
  function draw(){
    svg.innerHTML='';const C=calc();
    txt(svg,300,26,'forward  →','font:700 12px system-ui;fill:var(--ink-muted)','middle');
    node(20,'x',`[${fmt(x[0],2)}, ${fmt(x[1],2)}]`,'var(--s1)',stage>=0,'ℝ²');
    node(160,'z = Wx',`[${fmt(C.z[0],2)}, ${fmt(C.z[1],2)}]`,'var(--s1)',stage>=1,'ℝ²');
    node(300,'a = tanh z',`[${fmt(C.a[0],2)}, ${fmt(C.a[1],2)}]`,'var(--s3)',stage>=2,'ℝ²');
    node(440,'L = ½‖a−y‖²',fmt(C.L,3),'var(--s2)',stage>=3,'ℝ');
    [116,256,396].forEach((X,i)=>{const on=stage>=i+1;
      el('path',{d:`M${X},87L${X+38},87`,stroke:on?'var(--ink-2)':'var(--ring)','stroke-width':2},svg);
      el('polygon',{points:`${X+44},87 ${X+34},82 ${X+34},92`,fill:on?'var(--ink-2)':'var(--ring)'},svg);});
    // backward row
    if(stage>=4){
      txt(svg,300,182,'←  backward: each step multiplies by one Jacobian','font:700 12px system-ui;fill:var(--s2)','middle');
      const rows=[['∂L/∂a',`[${fmt(C.dLda[0],2)}, ${fmt(C.dLda[1],2)}]`,'1×2',440],
                  ['∂L/∂z',`[${fmt(C.dLdz[0],2)}, ${fmt(C.dLdz[1],2)}]`,'1×2',300],
                  ['∂L/∂x',`[${fmt(C.dLdx[0],2)}, ${fmt(C.dLdx[1],2)}]`,'1×2',160]];
      rows.forEach(([lab,v,sh,X],i)=>{
        el('rect',{x:X-34,y:206,width:130,height:52,rx:11,fill:'var(--surface)',stroke:'var(--s2)','stroke-width':2},svg);
        txt(svg,X+31,226,lab,'font:700 12px system-ui;fill:var(--s2)','middle');
        txt(svg,X+31,244,v+'  '+sh,'font:600 10px var(--mono),monospace;fill:var(--ink-2)','middle');});
      txt(svg,300,286,'row × diag(1−a²)  then  row × W   — always (1×2)(2×2) = 1×2','font:600 11px system-ui;fill:var(--ink-muted)','middle');
    } else {
      txt(svg,300,214,'press ▶ to push the values forward, then send the gradient back','font:600 12px system-ui;fill:var(--ink-muted)','middle');}
    const names=['start','z computed','a computed','loss computed','gradients sent back','done'];
    read.innerHTML=`stage: <b>${names[Math.min(stage,MAXS)]}</b><br>`
      + `L = <b style="color:var(--s2)">${stage>=3?fmt(C.L,4):'—'}</b><br>`
      + `∂L/∂x = ${stage>=4?`[ <b>${fmt(C.dLdx[0],3)}</b>, <b>${fmt(C.dLdx[1],3)}</b> ]`:'—'}`;
    verd.className='verdict '+(stage>=4?'good':'info');
    verd.textContent=stage>=4?'✓ Every backward quantity stayed a 1×2 row — no full matrix was ever formed.':'W = [[2,−1],[1,3]], y = [0.5, −0.5]. Advance to watch the values propagate.';
  }
  document.getElementById('bp-step').addEventListener('click',()=>{stage=Math.min(stage+1,4);draw();});
  document.getElementById('bp-reset').addEventListener('click',()=>{stage=0;draw();});
  bindCtl('bp-x1',v=>{x[0]=v;draw();})();
  bindCtl('bp-x2',v=>{x[1]=v;draw();})();
  draw();
})();

/* ================= W10 · LEARNING RATE ROULETTE ================= */
(function(){
  const svg=document.getElementById('gd-svg'),read=document.getElementById('gd-read'),verd=document.getElementById('gd-verdict');
  const f=(x,y)=>0.5*(0.25*x*x+2*y*y), g=(x,y)=>[0.25*x,2*y];
  let eta=0.18,N=18,sx=2.6,sy=1.15;
  function draw(){
    const p=plane(svg,-3.1,3.1,-1.75,1.75,{step:1,tickEvery:1,pad:26});
    contours(p,f,[0.05,0.15,0.35,0.65,1.05,1.6,2.3,3.2],-3.1,3.1,-1.75,1.75,'var(--grid)',56);
    let x=sx,y=sy,d='',pts=[[x,y]],blew=false;
    for(let i=0;i<N;i++){const gr=g(x,y);x-=eta*gr[0];y-=eta*gr[1];
      if(!isFinite(x)||!isFinite(y)||Math.abs(x)>40||Math.abs(y)>40){blew=true;break;}
      pts.push([x,y]);}
    pts.forEach((q,i)=>{const X=Math.max(-3.05,Math.min(3.05,q[0])),Y=Math.max(-1.72,Math.min(1.72,q[1]));
      d+=(i?'L':'M')+p.px(X).toFixed(1)+','+p.py(Y).toFixed(1);});
    el('path',{d,stroke:'var(--s2)','stroke-width':2.2,fill:'none'},svg);
    pts.forEach((q,i)=>{const X=Math.max(-3.05,Math.min(3.05,q[0])),Y=Math.max(-1.72,Math.min(1.72,q[1]));
      el('circle',{cx:p.px(X),cy:p.py(Y),r:i===0?6:3.4,fill:i===0?'var(--ink)':'var(--s2)',opacity:i===0?1:.85},svg);});
    el('circle',{cx:p.px(0),cy:p.py(0),r:5,fill:'none',stroke:'var(--s3)','stroke-width':2.4},svg);
    txt(svg,p.px(0),p.py(0)-12,'minimum','font:700 11px system-ui;fill:var(--s3)','middle');
    txt(svg,16,24,'valley stretched 8 : 1','font:700 12px system-ui;fill:var(--ink-2)');
    txt(svg,16,42,'drag to move the start','font:600 11px system-ui;fill:var(--ink-muted)');
    const last=pts[pts.length-1],fl=f(last[0],last[1]);
    read.innerHTML=`η = <b>${fmt(eta,3)}</b> · steps = <b>${N}</b><br>final loss = <b>${blew?'diverged':fmt(fl,4)}</b><br>distance to minimum = <b>${blew?'∞':fmt(Math.hypot(last[0],last[1]),3)}</b>`;
    const div=blew||fl>f(sx,sy);
    verd.className='verdict '+(div?'bad':(fl<0.02?'good':'info'));
    verd.textContent=div?'✗ Diverging — each step overshoots onto a steeper wall, so the next is worse. Stability here needs η < 1.':(fl<0.02?'✓ Converged. Notice the zig-zag: the narrow direction is what limits η.':'Descending, but slowly — the flat direction crawls while the narrow one dominates the step size.');
  }
  function pick(e){const p=plane(svg,-3.1,3.1,-1.75,1.75,{step:1,pad:26});const q=planePt(svg,p,e);
    sx=Math.max(-3,Math.min(3,q[0]));sy=Math.max(-1.7,Math.min(1.7,q[1]));draw();}
  let down=false;
  svg.addEventListener('pointerdown',e=>{down=true;try{svg.setPointerCapture(e.pointerId)}catch(_){}pick(e);e.preventDefault();});
  svg.addEventListener('pointermove',e=>{if(down)pick(e);});
  ['pointerup','pointercancel'].forEach(ev=>svg.addEventListener(ev,()=>down=false));
  bindCtl('gd-eta',v=>{eta=v;draw();},v=>fmt(v,3))();
  bindCtl('gd-n',v=>{N=v|0;draw();},v=>String(v|0))();
  draw();
})();
