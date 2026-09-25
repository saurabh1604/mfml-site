/* ================= UNIT 15 · the unit's shared maths and colour language ================= */
/* one colour language for the whole unit: values forward = blue, blame backward = red, weights by sign, awake gold */
const K15={fwd:'s1',bwd:'critical',pos:'s3',neg:'s2',awake:'s4',accent:'s6',edge:'s7'};
const cv=k=>k==='critical'?'var(--critical)':'var(--'+k+')';
/* numbers: integers print bare, others trimmed; always a real minus sign */
const N=(v,d)=>{ if(!isFinite(v)) return v>0?'∞':'−∞'; if(Math.abs(v)<5e-13) return '0'; const r=Math.round(v); if(Math.abs(v-r)<1e-9) return nm(String(r)); return trim(F(v,d==null?4:d)); };
const vecN=(v,d)=>'('+v.map(x=>N(x,d)).join(', ')+')';
/* ---- a small generic multilayer network: arrays of layers, float64, no special cases ---- */
const ACTS={
  relu:{f:z=>z>0?z:0, d:z=>z>0?1:0, name:'ReLU'},
  sigmoid:{f:z=>1/(1+Math.exp(-z)), d:z=>{ const s=1/(1+Math.exp(-z)); return s*(1-s); }, name:'sigmoid'},
  tanh:{f:z=>Math.tanh(z), d:z=>1-Math.tanh(z)**2, name:'tanh'},
  none:{f:z=>z, d:()=>1, name:'none'}};
const matVec=(W,a)=>W.map(r=>r.reduce((s,w,k)=>s+w*a[k],0));
const clone=net=>({W:net.W.map(M=>M.map(r=>r.slice())), b:net.b.map(v=>v.slice()), act:(net.act||[]).slice()});
/* forward: returns [{z, a}] with entry 0 = the input */
function netForward(net,x){ const out=[{z:null,a:x.slice()}]; let a=x.slice();
  net.W.forEach((W,l)=>{ const z=matVec(W,a).map((v,j)=>v+net.b[l][j]), A=ACTS[net.act[l]||'relu']; a=z.map(A.f); out.push({z,a}); }); return out; }
/* backward for L = ½‖ŷ − y‖²: the two rules, layer by layer. dA[l] = ∂L/∂a(l), dZ[l] = ∂L/∂z(l) */
function netBackward(net,x,y){ const c=netForward(net,x), Lc=c.length-1, yh=c[Lc].a, yy=Array.isArray(y)?y:[y];
  const loss=.5*yh.reduce((s,v,i)=>s+(v-yy[i])**2,0);
  const dA=[], dZ=[], dW=[], db=[]; dA[Lc]=yh.map((v,i)=>v-yy[i]);
  for(let l=Lc;l>=1;l--){ const A=ACTS[net.act[l-1]||'relu'];
    dZ[l]=dA[l].map((g,j)=>g*A.d(c[l].z[j]));                                   /* Rule A */
    dW[l]=dZ[l].map(g=>c[l-1].a.map(a=>g*a)); db[l]=dZ[l].slice();               /* Rule B (i), (ii) */
    const W=net.W[l-1]; dA[l-1]=W[0].map((_,k)=>W.reduce((s,r,j)=>s+r[k]*dZ[l][j],0)); }   /* Rule B (iii): Wᵀ ∂L/∂z */
  return {cache:c,loss,yhat:yh,dA,dZ,dW,db}; }
function netLoss(net,x,y){ const c=netForward(net,x), yh=c[c.length-1].a, yy=Array.isArray(y)?y:[y]; return .5*yh.reduce((s,v,i)=>s+(v-yy[i])**2,0); }
function netStep(net,g,eta){ const n=clone(net); n.W.forEach((W,l)=>W.forEach((r,j)=>r.forEach((_,k)=>{ r[k]-=eta*g.dW[l+1][j][k]; }))); n.b.forEach((v,l)=>v.forEach((_,j)=>{ v[j]-=eta*g.db[l+1][j]; })); return n; }
/* every parameter as a flat list of {l, kind:'W'|'b', j, k, name} (for the gradient checks) */
function netParams(net){ const P=[]; net.W.forEach((W,l)=>{ W.forEach((r,j)=>r.forEach((_,k)=>P.push({l,kind:'W',j,k,name:'W'+SUP(l+1)+SUB(''+(j+1)+(k+1))}))); net.b[l].forEach((_,j)=>P.push({l,kind:'b',j,name:'b'+SUP(l+1)+SUB(j+1)})); }); return P; }
const pGet=(net,p)=>p.kind==='W'?net.W[p.l][p.j][p.k]:net.b[p.l][p.j];
const pSet=(net,p,v)=>{ if(p.kind==='W') net.W[p.l][p.j][p.k]=v; else net.b[p.l][p.j]=v; };
const gGet=(g,p)=>p.kind==='W'?g.dW[p.l+1][p.j][p.k]:g.db[p.l+1][p.j];

/* ---- THE worked example: salary from age and experience (Prof. Saurabh's handout) ---- */
const SAL={W:[[[0.1,0.3],[0.2,-0.1],[-0.1,0.2]],[[1,-0.5,1],[1,0.5,-1]],[[4,2]]], b:[[1,-1,-1],[1,-2],[2]], act:['relu','relu','relu']};
const SAL_X=[30,10], SAL_Y=50;
/* self-check: the page's numbers are computed, never typed — and they must match the handout */
(function(){ const g=netBackward(SAL,SAL_X,SAL_Y), s=netStep(SAL,g,1e-5), L1=netLoss(s,SAL_X,SAL_Y);
  const want=[g.cache[1].z.join(),g.yhat[0],g.loss,g.dZ[1].join(),g.dW[1].map(r=>r.join()).join('|'),L1.toFixed(2)].join(' ; ');
  if(want!=='7,4,-2 ; 40 ; 50 ; -60,10,0 ; -1800,-600|300,100|0,0 ; 18.89') console.warn('U15: salary example drifted: '+want); })();
/* ---- HTML matrix: a bracketed grid; opts.tone = fwd|bwd|par, opts.shape = '3×1', cells may carry data-r/data-c ---- */
function matHTML(rows,o){ o=o||{}; const cols=rows[0].length; let cells='';
  rows.forEach((r,i)=>r.forEach((v,j)=>{ const cls=o.cell?o.cell(i,j,v):''; cells+=`<span class="mc${cls?' '+cls:''}" data-r="${i}" data-c="${j}">${typeof v==='number'?N(v,o.d):v}</span>`; }));
  return `<span class="mtx ${o.tone||''}"${o.id?` id="${o.id}"`:''}><span class="mg" style="--c:${cols}">${cells}</span></span>`+(o.shape?`<span class="mshape">${o.shape}</span>`:''); }
const colOf=v=>v.map(x=>[x]);
/* a tiny SVG helper: text with a coloured tone */
const tone=(k,t)=>`<b style="color:${cv(k)}">${t}</b>`;
/* a step size as 10⁻⁵ or 6×10⁻⁵ */
const etaTxt=v=>{ if(v>=.01) return N(v,3); const e=Math.floor(Math.log10(v)+1e-9), m=v/10**e; return (Math.abs(m-1)<1e-6?'':trim(m.toFixed(2))+'×')+'10'+SUP(e); };
