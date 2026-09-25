/* ================= UNIT 15 · #w-play — THE NETWORK PLAYGROUND (build, step, inspect, train, check) =================
   Self-contained: needs nothing from the house runtime. Plain float64 JS; forward/backward are generic over
   an array of layers (nothing is special-cased for the salary net). Exposes window.U15Play for the test suite. */
(function(){
'use strict';
const ROOT=document.getElementById('w-play'); if(!ROOT) return;
const $=id=>document.getElementById(id);
const RMo=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const MAXH=6, MAXN=8;

/* ---------- number formatting (real minus signs) ---------- */
const MI='−', sg=s=>String(s).replace(/-/g,MI);
function sci(v,d){ const s=v.toExponential(d==null?2:d).split('e'); let m=s[0]; if(m.indexOf('.')>=0) m=m.replace(/0+$/,'').replace(/\.$/,''); return sg(m)+'e'+sg(String(+s[1])); }
function fm(v,d){ if(v==null||isNaN(v)) return '—'; if(!isFinite(v)) return v>0?'∞':MI+'∞'; const a=Math.abs(v); if(a===0) return '0';
  if(a>=1e5||a<1e-3) return sci(v,2);
  let s=v.toFixed(d!=null?d:(a>=1000?1:a>=100?2:4)); if(s.indexOf('.')>=0) s=s.replace(/0+$/,'').replace(/\.$/,''); if(s==='-0') s='0'; return sg(s); }
function fs(v){ if(v==null||isNaN(v)) return '·'; if(!isFinite(v)) return v>0?'∞':MI+'∞'; const a=Math.abs(v); if(a===0) return '0';
  if(a>=1e4||a<1e-3) return sci(v,1); let s=v.toFixed(a>=100?0:a>=10?1:a>=1?2:3); if(s.indexOf('.')>=0) s=s.replace(/0+$/,'').replace(/\.$/,''); if(s==='-0'||s==='0') return a<5e-4?'0':s; return sg(s); }
const P=v=>'('+fm(v)+')';
const SUPD={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}, SUBD={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
const tsup=l=>'⁽'+String(l).split('').map(c=>SUPD[c]).join('')+'⁾', tsub=n=>String(n).split('').map(c=>SUBD[c]).join('');
const usup=l=>'<sup>('+l+')</sup>', usub=n=>'<sub>'+n+'</sub>';
/* HTML variable names: z⁽ˡ⁾ⱼ */
const V=(s,l,j)=>'<span class="pl-v"><i>'+s+'</i>'+(l!=null?'<sup>('+l+')</sup>':'')+(j!=null?'<sub>'+j+'</sub>':'')+'</span>';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

/* ---------- seeded randomness ---------- */
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function gauss(r){ let u=0; while(u===0) u=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r()); }
function shuffle(a,r){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

/* ---------- datasets ---------- */
const DSN={salary1:'salary · one person',salaryset:'salary · 30 people',sine:'sine wave',step:'a step',abs:'|x|, a V',moons:'two moons',xor:'XOR',circles:'circles',spirals:'three spirals'};
function makeData(name,noise,seed,sq,sc){
  const r=mulberry(seed*7919+101), g=()=>gauss(r), Pp=[], Y=[]; let d={};
  const nz=[0,1,2][noise]||0;
  if(name==='salary1'){ Pp.push([30,10]); Y.push(50); d={kind:'reg',dim:2,names:['age','exp'],long:['age','experience'],dom:[0,60,0,30]}; }
  else if(name==='salaryset'){ for(let i=0;i<30;i++){ const age=22+r()*38, ex=Math.max(0,age-22-r()*9); Pp.push([age,ex]); Y.push(8+0.4*age+2.2*ex+0.04*ex*ex+g()*2*nz); }
    d={kind:'reg',dim:2,names:['age','exp'],long:['age','experience'],dom:[18,62,0,44]}; }
  else if(name==='sine'||name==='step'||name==='abs'){ const f=name==='sine'?(x=>Math.sin(1.3*x)):name==='step'?(x=>x<0?-0.8:0.8):(x=>Math.abs(x)-1.4);
    for(let i=0;i<60;i++){ const x=-3+6*(i+r())/60; Pp.push([x]); Y.push(f(x)+g()*0.09*nz); }
    d={kind:'reg',dim:1,names:['x'],long:['x'],dom:[-3.3,3.3]}; }
  else if(name==='moons'){ const s=[0.04,0.1,0.2][nz]; for(let i=0;i<200;i++){ const c=i%2, t=Math.PI*r(); const p=c?[1-Math.cos(t),0.5-Math.sin(t)]:[Math.cos(t),Math.sin(t)]; Pp.push([p[0]+g()*s,p[1]+g()*s]); Y.push(c); }
    d={kind:'cls',K:2,dim:2,names:['x₁','x₂'],long:['x₁','x₂'],dom:[-1.6,2.6,-1.85,2.35]}; }
  else if(name==='xor'){ const s=[0.18,0.3,0.45][nz]; for(let i=0;i<200;i++){ const sx=r()<.5?-1:1, sy=r()<.5?-1:1; Pp.push([sx+g()*s,sy+g()*s]); Y.push(sx*sy>0?0:1); }
    d={kind:'cls',K:2,dim:2,names:['x₁','x₂'],long:['x₁','x₂'],dom:[-2.4,2.4,-2.4,2.4]}; }
  else if(name==='circles'){ const s=[0.03,0.08,0.16][nz]; for(let i=0;i<200;i++){ const c=i%2, t=2*Math.PI*r(), rad=c?1+0.25*r():0.5*Math.sqrt(r()); Pp.push([rad*Math.cos(t)+g()*s,rad*Math.sin(t)+g()*s]); Y.push(c); }
    d={kind:'cls',K:2,dim:2,names:['x₁','x₂'],long:['x₁','x₂'],dom:[-1.75,1.75,-1.75,1.75]}; }
  else { const s=[0.08,0.2,0.4][nz]; for(let k=0;k<3;k++) for(let i=0;i<70;i++){ const t=(i+1)/70, th=t*4.1+k*2*Math.PI/3+g()*s*0.5, rad=t; Pp.push([rad*Math.cos(th),rad*Math.sin(th)]); Y.push(k); }
    d={kind:'cls',K:3,dim:2,names:['x₁','x₂'],long:['x₁','x₂'],dom:[-1.2,1.2,-1.2,1.2]}; }
  let fx=p=>p.slice(), inNames=d.names.slice();
  d.canSq=d.kind==='cls'; d.canSc=name.indexOf('salary')===0;
  if(sq&&d.canSq){ fx=p=>[p[0],p[1],p[0]*p[0],p[1]*p[1]]; inNames=['x₁','x₂','x₁²','x₂²']; }
  if(sc&&d.canSc){ fx=p=>[p[0]/100,p[1]/10]; inNames=['age/100','exp/10']; }
  d.name=name; d.P=Pp; d.Y=Y; d.fx=fx; d.X=Pp.map(fx); d.nin=d.X[0].length; d.inNames=inNames; d.nout=d.kind==='cls'?d.K:1;
  let lo=Infinity,hi=-Infinity; Y.forEach(y=>{ if(y<lo) lo=y; if(y>hi) hi=y; }); d.ylo=lo; d.yhi=hi;
  return d; }

/* ---------- the network (generic) ---------- */
const act=(f,z)=>f==='relu'?(z>0?z:0):f==='sigmoid'?1/(1+Math.exp(-z)):f==='tanh'?Math.tanh(z):z;
const dact=(f,z,a)=>f==='relu'?(z>0?1:0):f==='sigmoid'?a*(1-a):f==='tanh'?1-a*a:1;
const ACTN={relu:'ReLU',sigmoid:'sigmoid',tanh:'tanh',none:'none',softmax:'softmax'};
const outAct=h=>h==='cls'?'softmax':h==='relu'?'relu':'none';
function mkNet(sizes,hid,head){ const L=sizes.length-1, net={sizes:sizes.slice(),head,acts:[null],W:[null],b:[null]};
  for(let l=1;l<=L;l++){ net.acts.push(l<L?hid[l-1]:outAct(head)); net.W.push(Array.from({length:sizes[l]},()=>new Array(sizes[l-1]).fill(0))); net.b.push(new Array(sizes[l]).fill(0)); }
  Object.defineProperty(net,'L',{get(){ return this.sizes.length-1; },enumerable:false}); return net; }
function fwd(net,x){ const L=net.L, a=[Float64Array.from(x)], z=[null]; let lse=0;
  for(let l=1;l<=L;l++){ const W=net.W[l], b=net.b[l], n=W.length, ap=a[l-1], m=ap.length, zl=new Float64Array(n), al=new Float64Array(n), f=net.acts[l];
    for(let j=0;j<n;j++){ let s=b[j]; const r=W[j]; for(let k=0;k<m;k++) s+=r[k]*ap[k]; zl[j]=s; }
    if(f==='softmax'){ let mx=-Infinity; for(let j=0;j<n;j++) if(zl[j]>mx) mx=zl[j]; let S=0; for(let j=0;j<n;j++){ al[j]=Math.exp(zl[j]-mx); S+=al[j]; } for(let j=0;j<n;j++) al[j]/=S; lse=mx+Math.log(S); }
    else for(let j=0;j<n;j++) al[j]=act(f,zl[j]);
    z.push(zl); a.push(al); }
  return {a,z,lse}; }
function lossOf(net,c,y){ const L=net.L; if(net.head==='cls') return c.lse-c.z[L][y]; const e=c.a[L][0]-y; return .5*e*e; }
function bwd(net,c,y){ const L=net.L, gz=new Array(L+1).fill(null), ga=new Array(L+1).fill(null), gW=[null], gb=[null];
  const o=c.a[L];
  if(net.head==='cls'){ gz[L]=Float64Array.from(o); gz[L][y]-=1; }
  else { ga[L]=Float64Array.of(o[0]-y); gz[L]=Float64Array.of(ga[L][0]*dact(net.acts[L],c.z[L][0],o[0])); }
  for(let l=L;l>=1;l--){ const W=net.W[l], n=W.length, ap=c.a[l-1], m=ap.length, g=gz[l], gl=[], gal=new Float64Array(m);
    for(let j=0;j<n;j++){ const row=new Float64Array(m), r=W[j]; for(let k=0;k<m;k++){ row[k]=g[j]*ap[k]; gal[k]+=r[k]*g[j]; } gl.push(row); }
    gW[l]=gl; gb[l]=Float64Array.from(g); ga[l-1]=gal;
    if(l>1){ const f=net.acts[l-1], zp=c.z[l-1]; const gp=new Float64Array(m); for(let k=0;k<m;k++) gp[k]=gal[k]*dact(f,zp[k],ap[k]); gz[l-1]=gp; } }
  return {gz,ga,gW,gb}; }
function zeroG(net){ const gW=[null],gb=[null]; for(let l=1;l<=net.L;l++){ gW.push(net.W[l].map(r=>new Float64Array(r.length))); gb.push(new Float64Array(net.b[l].length)); } return {gW,gb}; }
function batchGrad(net,d,idx){ const G=zeroG(net); let Ls=0, hit=0; const L=net.L; G.bl=new Float64Array(L+1);
  for(const i of idx){ const c=fwd(net,d.X[i]), y=d.Y[i]; Ls+=lossOf(net,c,y); if(d.kind==='cls'){ let am=0; const o=c.a[L]; for(let j=1;j<o.length;j++) if(o[j]>o[am]) am=j; if(am===y) hit++; }
    const g=bwd(net,c,y); for(let l=1;l<=L;l++){ const GW=G.gW[l], gw=g.gW[l]; let q=0; for(let j=0;j<g.gz[l].length;j++) q+=g.gz[l][j]*g.gz[l][j]; G.bl[l]+=Math.sqrt(q/g.gz[l].length); for(let j=0;j<GW.length;j++){ const A=GW[j], B=gw[j]; for(let k=0;k<A.length;k++) A[k]+=B[k]; G.gb[l][j]+=g.gb[l][j]; } } }
  const n=idx.length||1; for(let l=1;l<=L;l++){ G.gW[l].forEach(r=>{ for(let k=0;k<r.length;k++) r[k]/=n; }); for(let j=0;j<G.gb[l].length;j++) G.gb[l][j]/=n; }
  for(let l=1;l<=L;l++) G.bl[l]/=n; G.loss=Ls/n; G.acc=hit/n; return G; }
function meanLoss(net,d,idx,sig){ let s=0; const L=net.L;
  for(const i of idx){ const c=fwd(net,d.X[i]); s+=lossOf(net,c,d.Y[i]); if(sig) for(let l=1;l<=L;l++){ if(net.acts[l]!=='relu') continue; const z=c.z[l]; for(let j=0;j<z.length;j++) sig.push(z[j]>0?1:0); } }
  return s/(idx.length||1); }
function snapshot(net){ return {W:net.W.map(w=>w&&w.map(r=>r.slice())),b:net.b.map(b=>b&&b.slice())}; }
function restore(net,s){ net.W=s.W.map(w=>w&&w.map(r=>r.slice())); net.b=s.b.map(b=>b&&b.slice()); }
function params(net){ const out=[]; for(let l=1;l<=net.L;l++){ net.W[l].forEach((r,j)=>r.forEach((_,k)=>out.push({l,j,k}))); net.b[l].forEach((_,j)=>out.push({l,j,b:true})); } return out; }
const pget=(net,p)=>p.b?net.b[p.l][p.j]:net.W[p.l][p.j][p.k];
const pset=(net,p,v)=>{ if(p.b) net.b[p.l][p.j]=v; else net.W[p.l][p.j][p.k]=v; };
const gget=(G,p)=>p.b?G.gb[p.l][p.j]:G.gW[p.l][p.j][p.k];
const pname=p=>p.b?'b'+usup(p.l)+usub(p.j+1):'W'+usup(p.l)+usub(p.j+1)+usub(p.k+1);
/* central difference with Richardson extrapolation; halves h whenever a ReLU switch flips inside the probe interval
   (inside one on/off pattern the loss is smooth, so the difference is accurate to rounding) */
function lossVec(net,d,idx,sig){ const out=new Float64Array(idx.length), L=net.L; let t=0;
  for(const i of idx){ const c=fwd(net,d.X[i]); out[t++]=lossOf(net,c,d.Y[i]); if(sig) for(let l=1;l<=L;l++){ if(net.acts[l]!=='relu') continue; const z=c.z[l]; for(let j=0;j<z.length;j++) sig.push(z[j]>0?1:0); } }
  return out; }
function fdiff(net,d,idx,p){ const th=pget(net,p), base=[]; lossVec(net,d,idx,base); let h=4e-3*Math.max(1,Math.abs(th)), out=null;
  /* per-example differences are summed (not two big sums subtracted), so rounding stays at the size of one example's loss */
  for(let tries=0;tries<10&&out==null;tries++,h/=8){ const Dh=hh=>{ const s1=[],s2=[]; pset(net,p,th+hh); const Lp=lossVec(net,d,idx,s1); pset(net,p,th-hh); const Lm=lossVec(net,d,idx,s2); pset(net,p,th);
      for(let i=0;i<base.length;i++) if(s1[i]!==base[i]||s2[i]!==base[i]) return null; let s=0; for(let i=0;i<Lp.length;i++) s+=Lp[i]-Lm[i]; return s/Lp.length/(2*hh); };
    const a=Dh(h); if(a==null) continue; const b=Dh(h/2); if(b==null) continue; out=(4*b-a)/3; }
  pset(net,p,th); return out==null?NaN:out; }
const relErr=(g,f)=>{ const m=Math.max(Math.abs(g),Math.abs(f)); return m<1e-12?Math.abs(g-f):Math.abs(g-f)/m; };

/* ---------- state ---------- */
const S={ds:'salary1',noise:1,sq:false,sc:false,dseed:7,seed:1,init:1,bias:0,eta:1e-5,opt:'gd',batch:'full',
  view:'graph',pics:false,wlab:true,preset:'salary',probe:0,idx:-1,steps:[],iBack:0,iU:0,iR:0,upd:false,
  running:false,it:0,seen:0,hist:[],sel:null,hover:null,spaceK:null,anims:[],gcr:null,diverged:false};
let D=null, NET=null, OPT=null, TR=null;

function initWeights(net,seed,from){ const r=mulberry(seed*104729+17); const L=net.L; from=from||1;
  for(let l=from;l<=L;l++){ const W=net.W[l], fan=W[0].length, sd=S.init/Math.sqrt(fan);
    for(let j=0;j<W.length;j++){ for(let k=0;k<fan;k++) W[j][k]=gauss(r)*sd; net.b[l][j]=S.bias;
      if(l===1&&fan===1&&D&&D.dim===1){ const c=D.dom[0]+(D.dom[1]-D.dom[0])*(0.12+0.76*r()); net.b[l][j]=-W[j][0]*c+S.bias; } } } }
function initRow(net,l,j,r){ const fan=net.W[l][0].length, sd=S.init/Math.sqrt(fan); for(let k=0;k<fan;k++) net.W[l][j][k]=gauss(r)*sd; net.b[l][j]=S.bias;
  if(l===1&&fan===1&&D&&D.dim===1){ const c=D.dom[0]+(D.dom[1]-D.dom[0])*(0.1+0.8*r()); net.b[l][j]=-net.W[l][j][0]*c+S.bias; } }
function resetOpt(){ OPT={t:0,m:zeroG(NET),v:zeroG(NET)}; TR={r:mulberry(S.seed*31+5),order:D.X.map((_,i)=>i),ptr:1e9}; S.it=0; S.seen=0; S.hist=[]; S.diverged=false; S.gcr=null; }
const ALL=()=>D.X.map((_,i)=>i);
function applyGrad(G,eta,opt){ const o=OPT; o.t++; const b1=.9,b2=.999,eps=1e-8, c1=1-Math.pow(b1,o.t), c2=1-Math.pow(b2,o.t);
  for(let l=1;l<=NET.L;l++){ const W=NET.W[l], B=NET.b[l];
    const upd=(get,set,g,mArr,vArr,i)=>{ if(opt==='gd') set(get()-eta*g); else if(opt==='mom'){ mArr[i]=.9*mArr[i]+g; set(get()-eta*mArr[i]); } else { mArr[i]=b1*mArr[i]+(1-b1)*g; vArr[i]=b2*vArr[i]+(1-b2)*g*g; set(get()-eta*(mArr[i]/c1)/(Math.sqrt(vArr[i]/c2)+eps)); } };
    for(let j=0;j<W.length;j++){ const row=W[j], gm=o.m.gW[l][j], gv=o.v.gW[l][j], g=G.gW[l][j]; for(let k=0;k<row.length;k++) upd(()=>row[k],v=>{ row[k]=v; },g[k],gm,gv,k);
      upd(()=>B[j],v=>{ B[j]=v; },G.gb[l][j],o.m.gb[l],o.v.gb[l],j); } } }
function trainIter(){ const N=D.X.length; let idx;
  if(S.batch==='full') idx=ALL(); else { const B=S.batch==='mini'?Math.min(16,N):1; idx=[]; for(let b=0;b<B;b++){ if(TR.ptr>=N){ shuffle(TR.order,TR.r); TR.ptr=0; } idx.push(TR.order[TR.ptr++]); } }
  const G=batchGrad(NET,D,idx); applyGrad(G,S.eta,S.opt); S.it++; S.seen+=idx.length; return G.loss; }
function record(){ const G=batchGrad(NET,D,ALL()); S.full=G; if(!isFinite(G.loss)||G.loss>1e12){ S.diverged=true; }
  S.hist.push([S.it,G.loss]); if(S.hist.length>1600){ S.hist=S.hist.filter((_,i)=>i%2===0||i===S.hist.length-1); } return G; }

/* ---------- presets ---------- */
const NOTES={
  salary:{t:'The unit’s worked example, exactly',b:'Age 30 and experience 10 go in; the true salary is 50 lakhs; ReLU after every layer; loss ½(ŷ − y)². Everything is already computed — <span class="k-v">blue</span> values going right, <span class="k-g">red</span> blame coming back. Walk it from the start one node at a time. At the end, one more ▶ takes a step with η = 10⁻⁵ and the next ▶ re-runs the network.',a:'↺ walk it from the start'},
  collapse:{t:'No bend = one matrix',b:'Every hidden layer has no bend. However many layers you stack, they multiply out to a single matrix and a single shift, so the boundary can only ever be one straight line. Train it and watch it stall. Then give the layers a bend and train again.',a:'give every layer a ReLU bend'},
  dead:{t:'Dead ReLU',b:'Every bias starts at −2.5, so most neurons are asleep for every single point (grey). An asleep ReLU passes no value forward and no blame back: the gradients on its wires are exactly 0 — click a grey neuron, or run the gradient check. Training cannot wake it.',a:'start again with bias 0.1'},
  vanish:{t:'Vanishing sigmoid',b:'Six sigmoid layers. A sigmoid’s slope is never more than 0.25, so on the way back every layer shrinks the blame again. Watch the bars under the loss curve fade towards the input, then train: learning crawls. Then swap every bend to ReLU.',a:'swap every bend to ReLU'},
  folds:{t:'Fold by fold',b:'One input, one hidden layer of ReLU neurons. Each neuron adds one crease — its hinge, drawn faint in the Space panel — and the output adds the bent pieces up. Train, then add neurons one at a time and train again: more creases, a closer fit.',a:'+ add a neuron'},
  free:{t:'Free play',b:'Your lab. Pick data, add or remove layers and neurons, choose a bend for each layer, and train. Click any neuron or wire to look inside it.',a:''}};
const PRESETS={
  salary:{ds:'salary1',sizes:[2,3,2,1],hid:['relu','relu'],head:'relu',eta:1e-5,opt:'gd',batch:'full',init:1,bias:0,seed:1,pics:false,wlab:true,
    W:[null,[[0.1,0.3],[0.2,-0.1],[-0.1,0.2]],[[1,-0.5,1],[1,0.5,-1]],[[4,2]]],b:[null,[1,-1,-1],[1,-2],[2]]},
  collapse:{ds:'moons',sizes:[2,4,4,2],hid:['none','none'],head:'cls',eta:0.02,opt:'adam',batch:'full',init:1,bias:0,seed:3,pics:true,wlab:false},
  dead:{ds:'moons',sizes:[2,8,8,2],hid:['relu','relu'],head:'cls',eta:0.02,opt:'adam',batch:'full',init:1,bias:-2.5,seed:2,pics:true,wlab:false},
  vanish:{ds:'circles',sizes:[2,4,4,4,4,4,4,2],hid:['sigmoid','sigmoid','sigmoid','sigmoid','sigmoid','sigmoid'],head:'cls',eta:0.5,opt:'gd',batch:'full',init:1,bias:0,seed:4,pics:true,wlab:false},
  folds:{ds:'sine',sizes:[1,2,1],hid:['relu'],head:'lin',eta:0.03,opt:'adam',batch:'full',init:1,bias:0,seed:5,pics:false,wlab:false},
  free:{ds:'xor',sizes:[2,5,4,2],hid:['relu','relu'],head:'cls',eta:0.03,opt:'adam',batch:'full',init:1,bias:0.1,seed:1,pics:true,wlab:false}};
function loadPreset(name){ const p=PRESETS[name]; if(!p) throw new Error('no preset '+name); pause();
  Object.assign(S,{preset:name,ds:p.ds,noise:1,sq:false,sc:false,eta:p.eta,opt:p.opt,batch:p.batch,init:p.init,bias:p.bias,seed:p.seed,pics:p.pics,wlab:p.wlab,probe:0,sel:null,spaceK:null});
  D=makeData(S.ds,S.noise,S.dseed,S.sq,S.sc); NET=mkNet(p.sizes,p.hid,p.head);
  if(p.W){ for(let l=1;l<=NET.L;l++){ NET.W[l]=p.W[l].map(r=>r.slice()); NET.b[l]=p.b[l].slice(); } } else initWeights(NET,S.seed);
  if(name!=='salary'&&D.kind==='cls'){ /* a probe point that is not too boring: the first point of the minority side */ S.probe=0; }
  if(name==='salary') S.sel={e:true,l:1,j:0,k:0};
  resetOpt(); syncControls(); rebuild(true); }

/* ---------- architecture edits (keep the weights you can keep) ---------- */
function addNeuron(l){ const r=mulberry(S.seed*131+l*17+NET.sizes[l]*3); if(NET.sizes[l]>=MAXN) return; NET.sizes[l]++; NET.W[l].push(new Array(NET.sizes[l-1]).fill(0)); NET.b[l].push(0); initRow(NET,l,NET.sizes[l]-1,r);
  const Wn=NET.W[l+1], sd=S.init/Math.sqrt(NET.sizes[l]); Wn.forEach(row=>row.push(gauss(r)*sd*(S.preset==='folds'?0.3:1))); archChanged(); }
function removeNeuron(l){ if(NET.sizes[l]<=1) return; NET.sizes[l]--; NET.W[l].pop(); NET.b[l].pop(); NET.W[l+1].forEach(row=>row.pop()); archChanged(); }
function addLayer(){ const L=NET.L; if(L-1>=MAXH) return; const n=L>1?NET.sizes[L-1]:Math.max(3,D.nin); const r=mulberry(S.seed*211+L);
  NET.sizes.splice(L,0,n); NET.acts.splice(L,0,L>1?NET.acts[L-1]:'relu'); NET.W.splice(L,0,Array.from({length:n},()=>new Array(NET.sizes[L-1]).fill(0))); NET.b.splice(L,0,new Array(n).fill(0));
  for(let j=0;j<n;j++) initRow(NET,L,j,r);
  const nl=NET.L; if(NET.W[nl][0].length!==n){ NET.W[nl]=Array.from({length:NET.sizes[nl]},()=>new Array(n).fill(0)); for(let j=0;j<NET.sizes[nl];j++) initRow(NET,nl,j,r); }
  archChanged(); }
function removeLayer(l){ if(NET.L<2) return; const r=mulberry(S.seed*307+l); NET.sizes.splice(l,1); NET.acts.splice(l,1); NET.W.splice(l,1); NET.b.splice(l,1);
  if(NET.W[l][0].length!==NET.sizes[l-1]){ NET.W[l]=Array.from({length:NET.sizes[l]},()=>new Array(NET.sizes[l-1]).fill(0)); for(let j=0;j<NET.sizes[l];j++) initRow(NET,l,j,r); }
  archChanged(); }
function setHead(h){ const L=NET.L; NET.head=h; NET.acts[L]=outAct(h); archChanged(); }
function setAct(l,f){ NET.acts[l]=f; archChanged(); }
function setAllActs(f){ for(let l=1;l<NET.L;l++) NET.acts[l]=f; archChanged(); }
function archChanged(){ pause(); S.sel=null; resetOpt(); rebuild(); }
function dataChanged(){ pause(); const old=D; D=makeData(S.ds,S.noise,S.dseed,S.sq,S.sc); S.probe=Math.min(S.probe,D.X.length-1);
  const L=NET.L, r=mulberry(S.seed*401+7);
  const wantHead=D.kind==='cls'?'cls':D.name.indexOf('salary')===0?(NET.head==='cls'?'lin':NET.head):(old&&old.name.indexOf('salary')!==0&&old.kind==='reg'?NET.head:'lin');
  if(NET.sizes[0]!==D.nin||NET.sizes[L]!==D.nout||wantHead!==NET.head||!old||old.dim!==D.dim){
    NET.sizes[0]=D.nin; NET.sizes[L]=D.nout; NET.head=wantHead; NET.acts[L]=outAct(wantHead);
    NET.W[1]=Array.from({length:NET.sizes[1]},()=>new Array(D.nin).fill(0)); for(let j=0;j<NET.sizes[1];j++) initRow(NET,1,j,r);
    NET.W[L]=Array.from({length:D.nout},()=>new Array(NET.sizes[L-1]).fill(0)); NET.b[L]=new Array(D.nout).fill(0); for(let j=0;j<D.nout;j++) initRow(NET,L,j,r); }
  S.sel=null; S.spaceK=null; resetOpt(); rebuild(); }
function reinit(){ pause(); initWeights(NET,S.seed); S.sel=null; resetOpt(); rebuild(); }

/* ---------- the probe example and the step machine ---------- */
function probeXY(){ return [D.X[S.probe],D.Y[S.probe]]; }
function probeCache(){ const [x,y]=probeXY(), c=fwd(NET,x), g=bwd(NET,c,y); return {c,g,loss:lossOf(NET,c,y),x,y}; }
function buildSteps(){ const L=NET.L, cls=NET.head==='cls', st=[];
  for(let l=1;l<=L;l++){ for(let j=0;j<NET.sizes[l];j++) st.push({k:'F',l,j}); if(cls&&l===L) st.push({k:'SM',l}); }
  st.push({k:'L'}); st.push({k:'S'});
  for(let l=L;l>=1;l--){ if(!(cls&&l===L)) for(let j=0;j<NET.sizes[l];j++) st.push({k:'A',l,j}); for(let j=0;j<NET.sizes[l];j++) st.push({k:'BW',l,j}); if(l>1) for(let k=0;k<NET.sizes[l-1];k++) st.push({k:'BA',l,j:k}); }
  S.iBack=st.length-1; st.push({k:'U'}); S.iU=st.length-1; st.push({k:'R'}); S.iR=st.length-1; S.steps=st; }
const grp=s=>s.k==='F'||s.k==='SM'?'F'+s.l:s.k==='A'||s.k==='BW'||s.k==='BA'?'B'+s.l:s.k;
const phs=s=>s.k==='F'||s.k==='SM'||s.k==='L'?'fwd':s.k==='S'||s.k==='A'||s.k==='BW'||s.k==='BA'?'bwd':s.k;
function revAt(i){ const R=new Set(); const L=NET.L, cls=NET.head==='cls';
  for(let t=0;t<=i&&t<S.steps.length;t++){ const s=S.steps[t];
    if(s.k==='F'){ R.add('z'+s.l+'.'+s.j); if(!(cls&&s.l===L)) R.add('a'+s.l+'.'+s.j); }
    else if(s.k==='SM'){ for(let j=0;j<NET.sizes[L];j++) R.add('a'+L+'.'+j); }
    else if(s.k==='L') R.add('L');
    else if(s.k==='S'){ if(cls) for(let j=0;j<NET.sizes[L];j++) R.add('gz'+L+'.'+j); else R.add('ga'+L+'.0'); }
    else if(s.k==='A') R.add('gz'+s.l+'.'+s.j);
    else if(s.k==='BW') R.add('gw'+s.l+'.'+s.j);
    else if(s.k==='BA') R.add('ga'+(s.l-1)+'.'+s.j); }
  return R; }
function commitHand(){ if(!S.upd) return; S.upd=false; S.it++; S.seen+=1; S.hist.push([S.it,meanLoss(NET,D,ALL())]); }
function goTo(i,quiet){ pause(); S.fresh=false; const prev=S.idx;
  if(prev===S.iR&&i>S.iR){ commitHand(); S.pc=probeCache(); buildSteps(); i=0; }
  i=Math.max(-1,Math.min(S.steps.length-1,i));
  if(i>=S.iU&&!S.upd){ S.snap=snapshot(NET); const g=S.pc.g; for(let l=1;l<=NET.L;l++){ NET.W[l].forEach((r,j)=>r.forEach((w,k)=>{ r[k]=w-S.eta*g.gW[l][j][k]; })); NET.b[l]=NET.b[l].map((b,j)=>b-S.eta*g.gb[l][j]); } S.upd=true; S.pcNew=probeCache(); }
  if(i<S.iU&&S.upd){ restore(NET,S.snap); S.upd=false; }
  S.idx=i; setDisplay(); if(!quiet&&i===prev+1&&i>=0) stepAnim(S.steps[i]); drawAll(); }
function setDisplay(){ if(S.upd&&S.idx===S.iR){ S.dc=S.pcNew; const R=new Set(); revAt(S.iBack).forEach(k=>{ if(k[0]!=='g') R.add(k); }); S.rev=R; }
  else { S.dc=S.pc; S.rev=revAt(Math.min(S.idx,S.iBack)); } }
function stepNode(){ goTo(S.idx+1); }
function stepLayer(){ let i=S.idx; if(i===S.iR){ goTo(i+1); return; } const g=grp(S.steps[i+1]||{k:'end'}); while(i+1<S.steps.length&&grp(S.steps[i+1])===g) i++; goTo(i,true); flashGroup(g); }
function stepPass(){ let i=S.idx; if(i===S.iR){ goTo(i+1); i=S.idx; } const p=phs(S.steps[i+1]||{k:'end'}); while(i+1<S.steps.length&&phs(S.steps[i+1])===p) i++; goTo(i,true); flashGroup(p==='fwd'?'ALLF':p==='bwd'?'ALLB':p); }

/* ---------- geometry of the graph ---------- */
const GR={cv:null,ctx:null,w:0,h:0,pos:[],r:16,lossP:null};
function layoutGraph(){ const w=GR.w,h=GR.h,L=NET.L, narrow=w<520; const padL=narrow?40:62, padR=narrow?30:46, top=narrow?44:52, bot=narrow?34:40;
  const cols=L+2, gap=(w-padL-padR)/(cols-1); const maxN=Math.max(...NET.sizes);
  let sp=Math.min((h-top-bot)/Math.max(1,maxN-1+.001),narrow?96:120), r=Math.max(8.5,Math.min(26,sp*.34,gap*.25));
  const avail=h-top-bot-2*r-4; sp=Math.min(sp,avail/Math.max(1,maxN-1)); r=Math.max(8.5,Math.min(r,sp*.36));
  GR.r=r; GR.gap=gap; GR.sp=sp; GR.pos=NET.sizes.map((n,l)=>{ const x=padL+l*gap, cy=top+(h-top-bot)/2; return Array.from({length:n},(_,j)=>[x,n===1?cy:cy+(j-(n-1)/2)*sp]); });
  GR.lossP=[padL+(L+1)*gap,top+(h-top-bot)/2]; GR.top=top; GR.bot=bot; }
function bz(p,q,t){ const dx=(q[0]-p[0])*.5, u=1-t, a=u*u*u, b=3*u*u*t, c=3*u*t*t, d=t*t*t; return [a*p[0]+b*(p[0]+dx)+c*(q[0]-dx)+d*q[0], a*p[1]+b*p[1]+c*q[1]+d*q[1]]; }
function bzPath(ctx,p,q){ const dx=(q[0]-p[0])*.5; ctx.moveTo(p[0],p[1]); ctx.bezierCurveTo(p[0]+dx,p[1],q[0]-dx,q[1],q[0],q[1]); }

/* ---------- colours (read from the page's CSS variables; re-read on theme change) ---------- */
let C={}, LIGHT=false; const RGBC={};
function rgb(c){ if(RGBC[c]) return RGBC[c]; let s=(c||'').trim(), out=[128,128,128]; if(s[0]==='#'){ if(s.length===4) s='#'+s[1]+s[1]+s[2]+s[2]+s[3]+s[3]; const n=parseInt(s.slice(1,7),16); out=[n>>16&255,n>>8&255,n&255]; } else { const m=s.match(/[\d.]+/g); if(m) out=[+m[0],+m[1],+m[2]]; } return RGBC[c]=out; }
const A=(c,a)=>{ const r=rgb(c); return 'rgba('+r[0]+','+r[1]+','+r[2]+','+a+')'; };
const mix=(c1,c2,t)=>{ const a=rgb(c1),b=rgb(c2); return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]; };
function readPal(){ const cs=getComputedStyle(document.documentElement), g=(n,f)=>cs.getPropertyValue('--'+n).trim()||f;
  LIGHT=document.documentElement.getAttribute('data-theme')==='light'||(document.documentElement.getAttribute('data-theme')!=='dark'&&!g('canvas','')&&matchMedia('(prefers-color-scheme: light)').matches);
  C={s1:g('s1','#5b93ff'),s2:g('s2','#ff7b4a'),s3:g('s3','#35d9a4'),s4:g('s4','#ffc857'),s5:g('s5','#ff6cb0'),s6:g('s6','#3fd8f6'),s7:g('s7','#a493ff'),crit:g('critical','#ff6470'),
    ink:g('ink','#eef1f8'),ink2:g('ink-2','#b4bdd2'),mut:g('ink-muted','#7d879d'),grid:g('grid','#1c2438'),axis:g('axis','#2b3550'),surf:g('surface','#0e1320'),surf2:g('surface-2','#141b2d'),page:g('page','#070a12')};
  C.cls=[C.s1,C.s2,C.s3]; C.ui=(cs.getPropertyValue('--ui').trim()||'system-ui,sans-serif'); C.mono=(cs.getPropertyValue('--mono').trim()||'ui-monospace,monospace'); }
function fitCanvas(cv,h){ const w=Math.max(200,Math.floor(cv.parentElement.clientWidth)); const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.style.width=w+'px'; cv.style.height=h+'px'; const W=Math.round(w*dpr),H=Math.round(h*dpr); if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
  const ctx=cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); return {ctx,w,h,dpr}; }

/* ---------- drawing: the graph ---------- */
function slopeOf(l,j,c){ const f=NET.acts[l]; if(f==='softmax') return null; return dact(f,c.z[l][j],c.a[l][j]); }
function asleep(l,j,c){ return NET.acts[l]==='relu'&&c.z[l][j]<=0; }
function drawGraph(tm){ const cv=$('pl-graph'); if(!cv||S.view!=='graph') return; const narrow=cv.parentElement.clientWidth<560, maxN=Math.max(...NET.sizes);
  const f=fitCanvas(cv,narrow?Math.max(330,Math.min(430,170+maxN*36)):Math.max(420,Math.min(520,170+maxN*44))); const ctx=f.ctx; GR.w=f.w; GR.h=f.h; layoutGraph(); ctx.clearRect(0,0,f.w,f.h);
  const L=NET.L, pos=GR.pos, r=GR.r, dc=S.dc, c=dc.c, g=dc.g, R=S.rev, cls=NET.head==='cls';
  const hasB=[...R].some(k=>k[0]==='g'), bw=hasB&&S.idx<=S.iBack&&!S.fresh;  /* while the blame is out, the weights step back */
  const cur=S.idx>=0&&S.idx<S.steps.length&&!S.running&&!S.fresh?S.steps[S.idx]:null;
  const redW=!S.fresh||NET.sizes.reduce((a,b)=>a+b,0)<=9, redN=!S.fresh||(Math.max(...NET.sizes)<=4&&GR.gap>=90);
  /* column headers + shape tags */
  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  for(let l=0;l<=L;l++){ const x=pos[l][0][0]; const top=GR.top-(narrow?24:26);
    const t1=l===0?'input':l===L?(cls?'scores → q':'output ŷ'):(narrow?'L'+l:'layer '+l), t2=l===0?'a'+tsup(0):ACTN[NET.acts[l]];
    ctx.font='700 '+(narrow?9.5:10.5)+'px '+C.ui; ctx.fillStyle=C.ink2; ctx.fillText(t1.toUpperCase(),x,top);
    ctx.font='600 '+(narrow?9:10)+'px '+C.ui; ctx.fillStyle=l===0?C.s1:NET.acts[l]==='relu'?C.s4:NET.acts[l]==='none'?C.mut:NET.acts[l]==='softmax'?C.s6:C.s7; ctx.fillText(t2,x,top+12);
    if(l>0&&GR.gap>=112){ ctx.font='500 10px '+C.ui; ctx.fillStyle=C.mut; ctx.fillText('W'+tsup(l)+' '+NET.sizes[l]+'×'+NET.sizes[l-1],(pos[l][0][0]+pos[l-1][0][0])/2,top+6); } }
  { const x=GR.lossP[0]; ctx.font='700 '+(narrow?9.5:10.5)+'px '+C.ui; ctx.fillStyle=C.ink2; ctx.fillText('LOSS',x,GR.top-(narrow?24:26)); ctx.font='600 '+(narrow?9:10)+'px '+C.ui; ctx.fillStyle=C.crit; ctx.fillText(cls?'−ln q_y':'½(ŷ−y)²',x,GR.top-(narrow?12:14)); }
  /* wires */
  for(let l=1;l<=L;l++){ const W=NET.W[l]; let mx=1e-12; W.forEach(rw=>rw.forEach(v=>{ if(Math.abs(v)>mx) mx=Math.abs(v); }));
    let gm=1e-12; if(g.gW[l]) g.gW[l].forEach(rw=>rw.forEach(v=>{ if(Math.abs(v)>gm) gm=Math.abs(v); }));
    for(let j=0;j<W.length;j++) for(let k=0;k<W[j].length;k++){ const p=pos[l-1][k], q=pos[l][j], w=W[j][k], t=Math.sqrt(Math.abs(w)/mx);
      const known=l===1||R.has('a'+(l-1)+'.'+k), carried=known?c.a[l-1][k]!==0:true;
      const sel=S.sel&&S.sel.e&&S.sel.l===l&&S.sel.j===j&&S.sel.k===k, hov=S.hover&&S.hover.e&&S.hover.l===l&&S.hover.j===j&&S.hover.k===k;
      let al=(.18+.62*t)*(carried?1:.35)*(bw?.42:1); if(sel||hov) al=1;
      const col=w>=0?C.s3:C.s2;
      if(!LIGHT&&t>.5&&!bw){ ctx.beginPath(); bzPath(ctx,p,q); ctx.strokeStyle=A(col,al*.18); ctx.lineWidth=(.7+4.6*t)*3; ctx.stroke(); }
      ctx.beginPath(); bzPath(ctx,p,q); ctx.strokeStyle=A(col,al); ctx.lineWidth=(sel?1.6:0)+.6+4.4*t; ctx.stroke();
      if(redW&&R.has('gw'+l+'.'+j)){ const gv=g.gW[l][j][k], gt=Math.sqrt(Math.abs(gv)/gm);
        if(gv!==0){ ctx.beginPath(); bzPath(ctx,p,q); ctx.strokeStyle=A(C.crit,LIGHT?.16:.22); ctx.lineWidth=2+7*gt; ctx.stroke();
          ctx.beginPath(); bzPath(ctx,p,q); ctx.strokeStyle=A(C.crit,.95); ctx.lineWidth=.8+2.2*gt; ctx.stroke(); } }
      if(S.running&&!RMo&&carried){ ctx.save(); ctx.setLineDash([2,11]); ctx.lineDashOffset=-(tm||0)*.035; ctx.beginPath(); bzPath(ctx,p,q); ctx.strokeStyle=A(C.s1,.75); ctx.lineWidth=1.6; ctx.stroke(); ctx.restore(); } } }
  /* loss wires */
  pos[L].forEach(q=>{ ctx.save(); ctx.setLineDash([3,4]); ctx.beginPath(); bzPath(ctx,q,GR.lossP); ctx.strokeStyle=A(C.crit,.45); ctx.lineWidth=1.2; ctx.stroke(); ctx.restore(); });
  /* wire labels */
  if(S.wlab&&GR.gap>=74){ ctx.font='600 '+(narrow?9:10)+'px '+C.mono; ctx.textAlign='center'; ctx.textBaseline='middle';
    for(let l=1;l<=L;l++){ const W=NET.W[l]; const nE=W.length*W[0].length; if(nE>24) continue;
      for(let j=0;j<W.length;j++) for(let k=0;k<W[j].length;k++){ const p=pos[l-1][k], q=pos[l][j]; const mm=W[0].length, t=mm===1?.5:.3+.4*k/(mm-1); const m=bz(p,q,t);
        const gl=redW&&R.has('gw'+l+'.'+j), s=gl?fs(g.gW[l][j][k]):fs(W[j][k]); const tw=ctx.measureText(s).width+8;
        ctx.fillStyle=A(C.surf,LIGHT?.92:.86); rr(ctx,m[0]-tw/2,m[1]-7.5,tw,15,7); ctx.fill(); ctx.strokeStyle=A(gl?C.crit:(W[j][k]>=0?C.s3:C.s2),.55); ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle=gl?C.crit:(W[j][k]>=0?C.s3:C.s2); ctx.fillText(s,m[0],m[1]+.5); } } }
  /* neurons */
  const pics=S.pics&&D.dim===2&&PIC.ok;
  for(let l=0;l<=L;l++){ const n=NET.sizes[l]; let vm=1e-12; for(let j=0;j<n;j++) vm=Math.max(vm,Math.abs(c.a[l][j]));
    for(let j=0;j<n;j++){ const [x,y]=pos[l][j]; const shownA=l===0||R.has('a'+l+'.'+j), shownZ=l>0&&R.has('z'+l+'.'+j), va=c.a[l][j];
      const sl=l>0?slopeOf(l,j,c):null, slp=NET.acts[l]==='sigmoid'?sl/.25:sl, dead=l>0&&shownZ&&asleep(l,j,c);
      const isCur=cur&&((cur.k==='F'||cur.k==='A'||cur.k==='BW')&&cur.l===l&&cur.j===j||cur.k==='BA'&&cur.l-1===l&&cur.j===j||cur.k==='SM'&&l===L||cur.k==='S'&&l===L);
      const isSel=S.sel&&!S.sel.e&&S.sel.l===l&&S.sel.j===j, isHov=S.hover&&!S.hover.e&&S.hover.l===l&&S.hover.j===j;
      /* halo */
      if(shownA&&!dead&&!LIGHT){ const hg=ctx.createRadialGradient(x,y,r*.6,x,y,r*2.1); const k=Math.min(1,Math.abs(va)/vm); hg.addColorStop(0,A(C.s1,.28*k+.05)); hg.addColorStop(1,A(C.s1,0)); ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(x,y,r*2.1,0,7); ctx.fill(); }
      if(isCur){ const cc=phs(cur)==='bwd'?C.crit:C.s1; const hg=ctx.createRadialGradient(x,y,r*.8,x,y,r*2.4); hg.addColorStop(0,A(cc,.45)); hg.addColorStop(1,A(cc,0)); ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(x,y,r*2.4,0,7); ctx.fill(); }
      /* body */
      ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fillStyle=LIGHT?'#fff':C.surf2; ctx.fill();
      if(pics&&PIC.img[l]&&PIC.img[l][j]){ ctx.save(); ctx.beginPath(); ctx.arc(x,y,r-1,0,7); ctx.clip(); ctx.imageSmoothingEnabled=true; ctx.drawImage(PIC.img[l][j],x-r,y-r,2*r,2*r); ctx.restore(); }
      else if(shownA){ const k=Math.min(1,Math.abs(va)/vm); ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fillStyle=dead?A(C.mut,LIGHT?.14:.18):A(C.s1,(LIGHT?.1:.16)+(LIGHT?.32:.5)*k); ctx.fill(); }
      /* ring: gold = how open the gate is (ReLU awake 1, asleep 0; sigmoid ≤ 0.25) */
      let ring=l===0?C.s1:C.axis, rw=1.6;
      if(l>0&&shownZ){ if(NET.acts[l]==='relu') ring=dead?C.mut:C.s4; else if(NET.acts[l]==='sigmoid'||NET.acts[l]==='tanh') ring=A(C.s4,.25+.75*Math.min(1,slp)); else if(NET.acts[l]==='softmax') ring=C.cls[j%3]; else ring=C.ink2; rw=2.2; }
      if(l===L&&cls&&shownZ) ring=C.cls[j%3];
      ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.strokeStyle=ring; ctx.lineWidth=rw; if(dead) ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
      if(isSel||isHov){ ctx.beginPath(); ctx.arc(x,y,r+4,0,7); ctx.strokeStyle=A(C.ink,isSel?.9:.45); ctx.lineWidth=1.5; ctx.stroke(); }
      if(l===L&&cls&&j===D.Y[S.probe]){ ctx.beginPath(); ctx.arc(x,y,r+7,0,7); ctx.strokeStyle=A(C.cls[j%3],.7); ctx.setLineDash([2,3]); ctx.lineWidth=1.3; ctx.stroke(); ctx.setLineDash([]); }
      /* numbers */
      if(!pics&&r>=11.5){ ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 '+Math.min(13,r*.56)+'px '+C.mono;
        ctx.fillStyle=shownA?(dead?C.mut:(LIGHT?C.ink:'#fff')):C.mut; ctx.fillText(shownA?fs(va):(shownZ?'?':'·'),x,y+.5); }
      if(l===0){ ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.font='600 '+(narrow?9.5:11)+'px '+C.ui; ctx.fillStyle=C.s1; ctx.fillText(D.inNames[j]||'x'+(j+1),x-r-5,y); }
      if(l>0&&shownZ&&r>=11.5&&(va!==c.z[l][j]||NET.acts[l]==='softmax')&&!pics){ ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.font='600 '+(narrow?8.5:9.5)+'px '+C.mono; ctx.fillStyle=C.mut; ctx.fillText('z '+fs(c.z[l][j]),x,y-r-4); }
      if(dead&&r>=11&&!narrow){ ctx.textAlign='left'; ctx.font='italic 600 9px '+C.ui; ctx.fillStyle=C.mut; ctx.fillText('asleep',x+r+3,y-r*.55); }
      /* red: blame at this node */
      const gzS=l>0&&R.has('gz'+l+'.'+j), gaS=R.has('ga'+l+'.'+j);
      if((gzS||gaS)&&r>=10&&(redN||(cur&&isCur)||GR.gap>=64)){ const lines=[]; const cmp=GR.gap<100; if(gaS&&l<L&&l>0&&!narrow) lines.push(['∂a',g.ga[l][j]]); if(gzS) lines.push([l===L&&!cls?'∂z':'∂z',g.gz[l][j]]); if(l===L&&!cls&&gaS&&!narrow) lines.unshift(['∂ŷ',g.ga[L][0]]); if(l===L&&!cls&&gaS&&narrow&&!gzS) lines.push(['∂ŷ',g.ga[L][0]]); if(narrow&&!gzS&&gaS&&l>0&&l<L) lines.push(['∂a',g.ga[l][j]]); if(l===0&&gaS) lines.push(['∂x',g.ga[0][j]]);
        ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='700 '+(narrow||cmp?8.5:10)+'px '+C.mono; let yy=y+r+4; const fit=Math.max(isCur||isSel?1:0,Math.floor((NET.sizes[l]>1?GR.sp-2*r-4:99)/14)); const LN=(cmp?lines.slice(-1):lines).slice(-Math.max(0,fit)).slice(0,fit||0);
        LN.forEach(([nm,v])=>{ const s=(narrow||cmp?'':nm+' ')+fs(v); const tw=ctx.measureText(s).width+8; ctx.fillStyle=A(C.crit,LIGHT?.1:.16); rr(ctx,x-tw/2,yy-1,tw,13,6); ctx.fill(); ctx.fillStyle=C.crit; ctx.fillText(s,x,yy+.5); yy+=14; }); } } }
  /* loss node */
  { const [x,y]=GR.lossP, shown=R.has('L'); ctx.font='700 11px '+C.mono; const rL=Math.max(14,r*.95,ctx.measureText(shown?fs(dc.loss):'L').width*.62+8); ctx.beginPath(); ctx.moveTo(x,y-rL); ctx.lineTo(x+rL,y); ctx.lineTo(x,y+rL); ctx.lineTo(x-rL,y); ctx.closePath();
    ctx.fillStyle=shown?A(C.crit,LIGHT?.14:.22):(LIGHT?'#fff':C.surf2); ctx.fill(); ctx.strokeStyle=C.crit; ctx.lineWidth=1.8; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 11px '+C.mono; ctx.fillStyle=shown?C.crit:C.mut; ctx.fillText(shown?fs(dc.loss):'L',x,y+.5);
    ctx.font='600 '+(narrow?9:10)+'px '+C.ui; ctx.textBaseline='top'; ctx.fillStyle=C.ink2; ctx.fillText(cls?'truth: class '+(D.Y[S.probe]+1):'truth y = '+fs(D.Y[S.probe]),x,y+rL+6);
    if(S.upd&&S.idx===S.iR){ ctx.fillStyle=C.mut; ctx.fillText('was '+fs(S.pc.loss),x,y+rL+19); } }
  /* animations on top */
  drawAnims(ctx,tm); }
function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

/* ---------- step animations (particles along the wires) ---------- */
function now(){ return performance.now(); }
function addAnim(a){ if(RMo) return; a.t0=now(); S.anims.push(a); kick(); }
function stepAnim(s){ if(!s||RMo||S.view!=='graph') return; const pos=GR.pos; if(!pos.length) return; const L=NET.L;
  if(s.k==='F'){ const segs=pos[s.l-1].map((p,k)=>[p,pos[s.l][s.j]]); addAnim({segs,col:'s1',dur:650}); }
  else if(s.k==='SM'||s.k==='R'){ const segs=[]; for(let l=1;l<=L;l++) pos[l].forEach(q=>pos[l-1].forEach(p=>segs.push([p,q]))); addAnim({segs,col:'s1',dur:s.k==='R'?1100:500}); }
  else if(s.k==='L'){ addAnim({segs:pos[L].map(p=>[p,GR.lossP]),col:'s1',dur:600}); }
  else if(s.k==='S'){ addAnim({segs:pos[L].map(p=>[GR.lossP,p]),col:'crit',dur:600}); }
  else if(s.k==='A'){ addAnim({ring:pos[s.l][s.j],col:(S.dc.g.gz[s.l][s.j]===0?'mut':'crit'),dur:700}); }
  else if(s.k==='BW'){ addAnim({segs:pos[s.l-1].map(p=>[pos[s.l][s.j],p]),col:'crit',dur:650,glow:true}); }
  else if(s.k==='BA'){ addAnim({segs:pos[s.l].map(q=>[q,pos[s.l-1][s.j]]),col:'crit',dur:650}); }
  else if(s.k==='U'){ const segs=[]; for(let l=1;l<=L;l++) pos[l].forEach(q=>pos[l-1].forEach(p=>segs.push([p,q]))); addAnim({segs,col:'s4',dur:800,glow:true,still:true}); } }
function flashGroup(g){ if(RMo||S.view!=='graph') return; const pos=GR.pos, L=NET.L; if(!pos.length) return; const segs=[];
  const layerSegs=(l,back)=>pos[l].forEach(q=>pos[l-1].forEach(p=>segs.push(back?[q,p]:[p,q])));
  if(g==='ALLF'){ for(let l=1;l<=L;l++) layerSegs(l); addAnim({segs,col:'s1',dur:900}); }
  else if(g==='ALLB'){ for(let l=1;l<=L;l++) layerSegs(l,true); addAnim({segs,col:'crit',dur:900}); }
  else if(g[0]==='F'&&g.length>1){ layerSegs(+g.slice(1)); addAnim({segs,col:'s1',dur:650}); }
  else if(g[0]==='B'&&g.length>1){ layerSegs(+g.slice(1),true); addAnim({segs,col:'crit',dur:650}); }
  else stepAnim({k:g}); }
function drawAnims(ctx,tm){ if(!S.anims.length) return; const t0=now(); S.anims=S.anims.filter(a=>t0-a.t0<a.dur);
  S.anims.forEach(a=>{ const t=Math.min(1,(t0-a.t0)/a.dur), e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2, col=C[a.col]||C.s1;
    if(a.ring){ const [x,y]=a.ring; ctx.beginPath(); ctx.arc(x,y,GR.r+3+14*e,0,7); ctx.strokeStyle=A(col,1-t); ctx.lineWidth=2.5; ctx.stroke(); return; }
    if(a.glow||a.still){ a.segs.forEach(([p,q])=>{ ctx.beginPath(); bzPath(ctx,p,q); ctx.strokeStyle=A(col,.5*(1-t)); ctx.lineWidth=5; ctx.stroke(); }); if(a.still) return; }
    a.segs.forEach(([p,q])=>{ const m=bz(p,q,e); const hg=ctx.createRadialGradient(m[0],m[1],0,m[0],m[1],9); hg.addColorStop(0,A(col,.95)); hg.addColorStop(.35,A(col,.55)); hg.addColorStop(1,A(col,0)); ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(m[0],m[1],9,0,7); ctx.fill();
      ctx.fillStyle=LIGHT?col:'#fff'; ctx.beginPath(); ctx.arc(m[0],m[1],2,0,7); ctx.fill(); }); }); }
let RAF=0; function kick(){ if(!RAF) RAF=requestAnimationFrame(loop); }
function loop(tm){ RAF=0; let more=false;
  if(S.running){ const t0=now(); let n=0; const cap=S.batch==='one'?400:S.batch==='mini'?120:40;
    while(now()-t0<9&&n<cap){ const l=trainIter(); n++; if(!isFinite(l)||l>1e12){ S.diverged=true; break; } }
    record(); if(S.diverged) pause(); S.fresh=true; S.pc=probeCache(); buildSteps(); S.idx=S.iBack; S.upd=false; setDisplay();
    const tn=now(); if(tn-(S.lastSlow||0)>140){ S.lastSlow=tn; computePics(); drawSpace(); drawMatrix(); drawInsp(); drawNote(); drawHUD(); }
    drawTrain(); more=S.running; }
  if(S.anims.length) more=true;
  drawGraph(tm); if(more) kick(); }

/* ---------- neuron pictures (what each neuron responds to over the input plane) ---------- */
const PIC={ok:false,img:[]};
function computePics(){ PIC.ok=false; if(!(S.pics&&D.dim===2)) return; const G=22, L=NET.L, [x0,x1,y0,y1]=D.dom; const vals=[];
  for(let l=0;l<=L;l++) vals.push(Array.from({length:NET.sizes[l]},()=>new Float64Array(G*G)));
  for(let iy=0;iy<G;iy++) for(let ix=0;ix<G;ix++){ const p=[x0+(x1-x0)*(ix+.5)/G,y1-(y1-y0)*(iy+.5)/G], c=fwd(NET,D.fx(p)); for(let l=0;l<=L;l++) for(let j=0;j<NET.sizes[l];j++) vals[l][j][iy*G+ix]=c.a[l][j]; }
  const pos=rgb(C.s1), neg=rgb(C.s2), bg=rgb(LIGHT?'#ffffff':C.surf2);
  PIC.img=vals.map((layer,l)=>layer.map((v,j)=>{ let m=1e-12; for(let i=0;i<v.length;i++) m=Math.max(m,Math.abs(v[i])); const cv=document.createElement('canvas'); cv.width=G; cv.height=G; const cx=cv.getContext('2d'), im=cx.createImageData(G,G);
    const soft=l===L&&NET.head==='cls', cc=soft?rgb(C.cls[j%3]):null;
    for(let i=0;i<v.length;i++){ const t=soft?v[i]:v[i]/m, tt=Math.min(1,Math.abs(t)), c=soft?cc:(t>=0?pos:neg), k=Math.pow(tt,.8)*.92; im.data[i*4]=bg[0]+(c[0]-bg[0])*k; im.data[i*4+1]=bg[1]+(c[1]-bg[1])*k; im.data[i*4+2]=bg[2]+(c[2]-bg[2])*k; im.data[i*4+3]=255; }
    cx.putImageData(im,0,0); return cv; }));
  PIC.ok=true; }

/* ---------- drawing: space ---------- */
const SP={pad:[34,12,12,28]};
function spaceFrame(w,h,X0,X1,Y0,Y1){ const [l,r,t,b]=[w<380?30:36,10,10,w<380?26:30]; return {l,r,t,b,px:x=>l+(x-X0)/(X1-X0)*(w-l-r),py:y=>h-b-(y-Y0)/(Y1-Y0)*(h-t-b),ix:X=>X0+(X-l)/(w-l-r)*(X1-X0),iy:Y=>Y0+(h-b-Y)/(h-t-b)*(Y1-Y0),X0,X1,Y0,Y1,w,h}; }
function nice(span,n){ const raw=span/n, p=Math.pow(10,Math.floor(Math.log10(raw))), m=raw/p; return (m<1.5?1:m<3?2:m<7?5:10)*p; }
function axes(ctx,F,xl,yl){ ctx.save(); ctx.font='500 9.5px '+C.ui; ctx.fillStyle=C.mut; ctx.strokeStyle=A(C.ink,LIGHT?.07:.06); ctx.lineWidth=1;
  const sx=nice(F.X1-F.X0,5), sy=nice(F.Y1-F.Y0,5);
  for(let v=Math.ceil(F.X0/sx)*sx;v<=F.X1+1e-9;v+=sx){ const X=F.px(v); ctx.beginPath(); ctx.moveTo(X,F.t); ctx.lineTo(X,F.h-F.b); ctx.stroke(); ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(fs(+v.toFixed(6)),X,F.h-F.b+4); }
  for(let v=Math.ceil(F.Y0/sy)*sy;v<=F.Y1+1e-9;v+=sy){ const Y=F.py(v); ctx.beginPath(); ctx.moveTo(F.l,Y); ctx.lineTo(F.w-F.r,Y); ctx.stroke(); ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText(fs(+v.toFixed(6)),F.l-4,Y); }
  ctx.strokeStyle=A(C.ink,.16); ctx.strokeRect(F.l+.5,F.t+.5,F.w-F.l-F.r-1,F.h-F.t-F.b-1);
  ctx.font='600 10px '+C.ui; ctx.fillStyle=C.ink2; ctx.textAlign='right'; ctx.textBaseline='bottom'; if(xl) ctx.fillText(xl,F.w-F.r-4,F.h-F.b-3); ctx.save(); ctx.translate(F.l+12,F.t+4); ctx.rotate(-Math.PI/2); ctx.textAlign='right'; ctx.textBaseline='middle'; if(yl) ctx.fillText(yl,0,0); ctx.restore(); ctx.restore(); }
function march(vals,G,level,F,x0,x1,y0,y1,ctx){ /* marching squares on a G×G grid of cell centres */
  const X=i=>F.px(x0+(x1-x0)*(i+.5)/G), Y=j=>F.py(y1-(y1-y0)*(j+.5)/G); ctx.beginPath();
  for(let j=0;j<G-1;j++) for(let i=0;i<G-1;i++){ const a=vals[j*G+i]-level,b=vals[j*G+i+1]-level,c=vals[(j+1)*G+i+1]-level,d=vals[(j+1)*G+i]-level; const pts=[];
    const e=(p,q,P0,P1)=>{ if((p>0)!==(q>0)){ const t=p/(p-q); pts.push([P0[0]+(P1[0]-P0[0])*t,P0[1]+(P1[1]-P0[1])*t]); } };
    e(a,b,[X(i),Y(j)],[X(i+1),Y(j)]); e(b,c,[X(i+1),Y(j)],[X(i+1),Y(j+1)]); e(c,d,[X(i+1),Y(j+1)],[X(i),Y(j+1)]); e(d,a,[X(i),Y(j+1)],[X(i),Y(j)]);
    if(pts.length>=2){ ctx.moveTo(pts[0][0],pts[0][1]); ctx.lineTo(pts[1][0],pts[1][1]); } if(pts.length===4){ ctx.moveTo(pts[2][0],pts[2][1]); ctx.lineTo(pts[3][0],pts[3][1]); } }
  ctx.stroke(); }
function spaceKMax(){ return NET.L; }
function drawSpace(){ const cv=$('pl-space'); if(!cv) return; const wrapW=cv.parentElement.clientWidth; const f=fitCanvas(cv,Math.min(480,Math.max(260,wrapW))); const ctx=f.ctx, w=f.w, h=f.h; ctx.clearRect(0,0,w,h);
  const L=NET.L; let K=S.spaceK==null?L:Math.min(S.spaceK,L); const sl=$('pl-lay'); if(sl){ sl.max=L; sl.value=K; }
  const lab=K===L?'output':K===0?'the inputs':'layer '+K; $('pl-lay-o').textContent=lab;
  if(D.dim===2&&K===L) spaceOut2(ctx,w,h); else if(D.dim===2) spaceLayer2(ctx,w,h,K); else if(K===L||K===0) spaceOut1(ctx,w,h,K===0); else spaceLayer1(ctx,w,h,K); }
function dataPts(ctx,F,map,colFn){ const r=D.X.length>80?3.2:4.2; D.P.forEach((p,i)=>{ const q=map?map(i):p; const X=F.px(q[0]),Y=F.py(q[1]); if(X<F.l-4||X>F.w-F.r+4||Y<F.t-4||Y>F.h-F.b+4) return;
    ctx.beginPath(); ctx.arc(X,Y,r,0,7); ctx.fillStyle=colFn?colFn(i):D.kind==='cls'?C.cls[D.Y[i]%3]:C.s1; ctx.fill(); ctx.strokeStyle=colFn?A(C.ink,LIGHT?.45:.6):(LIGHT?'#fff':A('#000',.55)); ctx.lineWidth=1.1; ctx.stroke(); });
  const q=map?map(S.probe):D.P[S.probe]; const X=F.px(q[0]),Y=F.py(q[1]); ctx.beginPath(); ctx.arc(X,Y,9,0,7); ctx.strokeStyle=C.s4; ctx.lineWidth=2.2; ctx.stroke();
  ctx.beginPath(); ctx.arc(X,Y,13,0,7); ctx.strokeStyle=A(C.s4,.35); ctx.lineWidth=1; ctx.stroke(); }
function spaceOut2(ctx,w,h){ const [x0,x1,y0,y1]=D.dom, F=spaceFrame(w,h,x0,x1,y0,y1), G=Math.min(60,Math.max(36,Math.round((w-F.l-F.r)/7))), L=NET.L, cls=NET.head==='cls';
  const K=cls?D.K:1, probs=Array.from({length:K},()=>new Float64Array(G*G)); const bg=rgb(LIGHT?'#ffffff':C.surf);
  for(let j=0;j<G;j++) for(let i=0;i<G;i++){ const p=[x0+(x1-x0)*(i+.5)/G,y1-(y1-y0)*(j+.5)/G], o=fwd(NET,D.fx(p)).a[L]; for(let k=0;k<K;k++) probs[k][j*G+i]=o[k]; }
  const cv=document.createElement('canvas'); cv.width=G; cv.height=G; const cx=cv.getContext('2d'), im=cx.createImageData(G,G);
  let lo=Infinity,hi=-Infinity; if(!cls){ probs[0].forEach(v=>{ if(v<lo) lo=v; if(v>hi) hi=v; }); lo=Math.min(lo,D.ylo); hi=Math.max(hi,D.yhi); if(hi-lo<1e-9) hi=lo+1; }
  const ramp=[rgb(LIGHT?'#ffffff':C.surf),rgb(C.s7),rgb(C.s1),rgb(C.s6)];
  for(let i=0;i<G*G;i++){ let c;
    if(cls){ let am=0; for(let k=1;k<K;k++) if(probs[k][i]>probs[am][i]) am=k; const conf=(probs[am][i]-1/K)/(1-1/K), kk=.1+.55*Math.pow(Math.max(0,conf),.7), cc=rgb(C.cls[am]); c=[bg[0]+(cc[0]-bg[0])*kk,bg[1]+(cc[1]-bg[1])*kk,bg[2]+(cc[2]-bg[2])*kk]; }
    else { const t=Math.max(0,Math.min(1,(probs[0][i]-lo)/(hi-lo)))*2.999, s=Math.floor(t), u=t-s, A0=ramp[s], B0=ramp[s+1], kk=LIGHT?.62:.72; c=[0,1,2].map(q=>bg[q]+((A0[q]+(B0[q]-A0[q])*u)-bg[q])*kk); }
    im.data[i*4]=c[0]; im.data[i*4+1]=c[1]; im.data[i*4+2]=c[2]; im.data[i*4+3]=255; }
  cx.putImageData(im,0,0); ctx.save(); ctx.imageSmoothingEnabled=true; ctx.drawImage(cv,F.l,F.t,w-F.l-F.r,h-F.t-F.b); ctx.restore();
  axes(ctx,F,D.long[0],D.long[1]);
  ctx.save(); ctx.beginPath(); ctx.rect(F.l,F.t,w-F.l-F.r,h-F.t-F.b); ctx.clip();
  if(cls){ ctx.lineWidth=2; ctx.strokeStyle=A(C.ink,LIGHT?.75:.85); if(!LIGHT){ ctx.shadowColor=A(C.ink,.6); ctx.shadowBlur=6; }
    if(K===2) march(probs[1],G,.5,F,x0,x1,y0,y1,ctx); else for(let k=0;k<K;k++){ const v=new Float64Array(G*G); for(let i=0;i<G*G;i++){ let m=0; for(let q=0;q<K;q++) if(q!==k) m=Math.max(m,probs[q][i]); v[i]=probs[k][i]-m; } march(v,G,0,F,x0,x1,y0,y1,ctx); } }
  else { const st=nice(hi-lo,6); ctx.lineWidth=1; ctx.strokeStyle=A(C.ink,LIGHT?.28:.3); for(let v=Math.ceil(lo/st)*st;v<hi;v+=st) march(probs[0],G,v,F,x0,x1,y0,y1,ctx); }
  ctx.restore();
  const rampAt=v=>{ const t=Math.max(0,Math.min(1,(v-lo)/(hi-lo)))*2.999, s0=Math.floor(t), u=t-s0, a0=ramp[s0], b0=ramp[s0+1]; return 'rgb('+[0,1,2].map(q=>Math.round(a0[q]+(b0[q]-a0[q])*u)).join(',')+')'; };
  dataPts(ctx,F,null,cls?null:(D.X.length>1?i=>rampAt(D.Y[i]):null));
  if(!cls){ const q=D.P[S.probe]; ctx.font='700 11px '+C.mono; ctx.textAlign='left'; ctx.textBaseline='bottom'; const s='ŷ '+fs(S.pc.c.a[L][0])+' · y '+fs(D.Y[S.probe]); const tw=ctx.measureText(s).width+10; let X=F.px(q[0])+12,Y=F.py(q[1])-10; if(X+tw>w-F.r-2) X=F.px(q[0])-12-tw+5; if(Y-15<F.t) Y=F.py(q[1])+26; ctx.fillStyle=A(C.surf,.9); rr(ctx,X-5,Y-15,tw,18,8); ctx.fill(); ctx.fillStyle=C.ink; ctx.fillText(s,X,Y); }
  let cap; if(cls){ const col=NET.acts.slice(1,L).every(a=>a==='none'); cap='Colour = the class the network would say, fading where it is unsure. The bright line is where it changes its mind.'+(col&&L>1?' No bends anywhere, so that line can only be straight.':''); }
  else cap='Colour = the network’s ŷ over the whole '+D.long[0]+'–'+D.long[1]+' plane; thin lines join equal ŷ. Each ReLU puts a crease into this sheet.';
  $('pl-scap').textContent=cap; }
function pca2(vs){ const n=vs.length, d=vs[0].length, mu=new Float64Array(d); vs.forEach(v=>{ for(let i=0;i<d;i++) mu[i]+=v[i]/n; });
  const Cm=Array.from({length:d},()=>new Float64Array(d)); vs.forEach(v=>{ for(let i=0;i<d;i++) for(let j=0;j<d;j++) Cm[i][j]+=(v[i]-mu[i])*(v[j]-mu[j]); });
  const comps=[]; const mul=u=>{ const o=new Float64Array(d); for(let i=0;i<d;i++) for(let j=0;j<d;j++) o[i]+=Cm[i][j]*u[j]; return o; };
  for(let c=0;c<2;c++){ let u=new Float64Array(d).map((_,i)=>1+i*.37+c); for(let it=0;it<80;it++){ let o=mul(u); comps.forEach(q=>{ const dd=o.reduce((s,x,i)=>s+x*q[i],0); for(let i=0;i<d;i++) o[i]-=dd*q[i]; }); const nr=Math.hypot(...o)||1; u=o.map(x=>x/nr); } comps.push(u); }
  return v=>[comps[0].reduce((s,x,i)=>s+x*(v[i]-mu[i]),0),comps[1].reduce((s,x,i)=>s+x*(v[i]-mu[i]),0)]; }
function spaceLayer2(ctx,w,h,K){ const [x0,x1,y0,y1]=D.dom, n=NET.sizes[K], NL=13, NS=36, L=NET.L;
  const map=p=>fwd(NET,D.fx(p)).a[K];
  const lines=[]; for(let a=0;a<NL;a++){ const u=x0+(x1-x0)*a/(NL-1), v=y0+(y1-y0)*a/(NL-1); const A1=[],B1=[]; for(let s=0;s<NS;s++){ A1.push(map([u,y0+(y1-y0)*s/(NS-1)])); B1.push(map([x0+(x1-x0)*s/(NS-1),v])); } lines.push(A1,B1); }
  const cells=[]; const NC=12; for(let j=0;j<NC;j++) for(let i=0;i<NC;i++){ const cs=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>[x0+(x1-x0)*a/NC,y0+(y1-y0)*b/NC]); const mid=[x0+(x1-x0)*(i+.5)/NC,y0+(y1-y0)*(j+.5)/NC]; cells.push({cs:cs.map(map),oy:cs.map(q=>q[1]),o:fwd(NET,D.fx(mid)).a[L]}); }
  const pts=D.P.map(map); let proj, xl, yl;
  if(K===0){ proj=v=>[v[0],v[1]]; xl=D.inNames[0]; yl=D.inNames[1]; }
  else if(n===1){ proj=null; xl='a'+tsup(K)+'₁'; yl='(height: original '+D.names[1]+')'; }
  else if(n===2){ proj=v=>[v[0],v[1]]; xl='a'+tsup(K)+'₁'; yl='a'+tsup(K)+'₂'; }
  else { proj=pca2(pts); xl='main direction 1'; yl='main direction 2'; }
  const P2=(v,src)=>proj?proj(v):[v[0],src[1]];
  const pp=pts.map((v,i)=>P2(v,D.P[i]));
  let X0=Infinity,X1=-Infinity,Y0=Infinity,Y1=-Infinity; pp.forEach(q=>{ X0=Math.min(X0,q[0]); X1=Math.max(X1,q[0]); Y0=Math.min(Y0,q[1]); Y1=Math.max(Y1,q[1]); });
  const px=(X1-X0)||1, py=(Y1-Y0)||1; X0-=px*.12; X1+=px*.12; Y0-=py*.12; Y1+=py*.12; if(X1-X0<1e-6){ X0-=1; X1+=1; } if(Y1-Y0<1e-6){ Y0-=1; Y1+=1; }
  const F=spaceFrame(w,h,X0,X1,Y0,Y1); axes(ctx,F,xl,yl); ctx.save(); ctx.beginPath(); ctx.rect(F.l,F.t,w-F.l-F.r,h-F.t-F.b); ctx.clip();
  const cls=NET.head==='cls';
  cells.forEach(c=>{ const q=c.cs.map((v,i)=>proj?proj(v):[v[0],c.oy[i]]); let col; if(cls){ let am=0; for(let k=1;k<c.o.length;k++) if(c.o[k]>c.o[am]) am=k; col=C.cls[am%3]; } else col=C.s1;
    ctx.beginPath(); q.forEach((v,i)=>{ const X=F.px(v[0]),Y=F.py(v[1]); if(i) ctx.lineTo(X,Y); else ctx.moveTo(X,Y); }); ctx.closePath(); ctx.fillStyle=A(col,LIGHT?.1:.12); ctx.fill(); });
  lines.forEach((ln,i)=>{ ctx.beginPath(); ln.forEach((v,s)=>{ const src=i%2===0?null:null; const q=proj?proj(v):[v[0],i%2===0?y0+(y1-y0)*s/(NS-1):y0+(y1-y0)*Math.floor(i/2)/(NL-1)]; const X=F.px(q[0]),Y=F.py(q[1]); if(s) ctx.lineTo(X,Y); else ctx.moveTo(X,Y); });
    ctx.strokeStyle=A(i%2?C.s6:C.s7,LIGHT?.55:.5); ctx.lineWidth=1; ctx.stroke(); });
  ctx.restore(); dataPts(ctx,F,i=>pp[i]);
  $('pl-scap').textContent=K===0?'The input plane with a straight grid. Slide right to see how each layer bends, folds and stretches this grid.':'The same grid and the same points after layer '+K+(n>2?' (seen along its two main directions, since it has '+n+' numbers per point)':n===1?' (only one number per point: everything is squashed onto a line)':'')+'. '+(NET.acts[K]==='relu'?'ReLU folds whole regions flat against the axes.':NET.acts[K]==='none'?'No bend: straight lines stay straight and parallel.':'The bend curves the grid smoothly.'); }
function spaceOut1(ctx,w,h,dataOnly){ const [x0,x1]=D.dom, L=NET.L, N=160; const xs=[],ys=[]; for(let i=0;i<N;i++){ const x=x0+(x1-x0)*i/(N-1); xs.push(x); ys.push(fwd(NET,D.fx([x])).a[L][0]); }
  let lo=D.ylo,hi=D.yhi; if(!dataOnly) ys.forEach(v=>{ if(isFinite(v)){ lo=Math.min(lo,v); hi=Math.max(hi,v); } }); const sp=(hi-lo)||1; lo-=sp*.15; hi+=sp*.15; lo=Math.max(lo,D.ylo-2*sp); hi=Math.min(hi,D.yhi+2*sp);
  const F=spaceFrame(w,h,x0,x1,lo,hi); axes(ctx,F,'x','y'); ctx.save(); ctx.beginPath(); ctx.rect(F.l,F.t,w-F.l-F.r,h-F.t-F.b); ctx.clip();
  let nh=0;
  if(!dataOnly&&L>=2){ const Lh=L-1, n=NET.sizes[Lh], wo=NET.W[L][0];
    for(let j=0;j<n;j++){ ctx.beginPath(); for(let i=0;i<N;i++){ const a=fwd(NET,D.fx([xs[i]])).a[Lh][j]*wo[j]; const X=F.px(xs[i]),Y=F.py(a); if(i) ctx.lineTo(X,Y); else ctx.moveTo(X,Y); } ctx.strokeStyle=A(C.s4,LIGHT?.5:.42); ctx.lineWidth=1.2; ctx.stroke(); }
    if(L===2&&NET.acts[1]==='relu'){ for(let j=0;j<n;j++){ const wv=NET.W[1][j][0], b=NET.b[1][j]; if(Math.abs(wv)<1e-9) continue; const xc=-b/wv; if(xc<x0||xc>x1) continue; nh++; const X=F.px(xc);
      ctx.save(); ctx.setLineDash([2,4]); ctx.beginPath(); ctx.moveTo(X,F.t); ctx.lineTo(X,h-F.b); ctx.strokeStyle=A(C.s4,.35); ctx.lineWidth=1; ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(X,h-F.b); ctx.lineTo(X-5,h-F.b-8); ctx.lineTo(X+5,h-F.b-8); ctx.closePath(); ctx.fillStyle=C.s4; ctx.fill(); } } }
  if(!dataOnly){ ctx.beginPath(); xs.forEach((x,i)=>{ const X=F.px(x),Y=F.py(ys[i]); if(i) ctx.lineTo(X,Y); else ctx.moveTo(X,Y); }); if(!LIGHT){ ctx.strokeStyle=A(C.s1,.25); ctx.lineWidth=7; ctx.stroke(); } ctx.strokeStyle=C.s1; ctx.lineWidth=2.6; ctx.stroke(); }
  ctx.restore();
  D.P.forEach((p,i)=>{ const X=F.px(p[0]),Y=F.py(D.Y[i]); ctx.beginPath(); ctx.arc(X,Y,3.4,0,7); ctx.fillStyle=A(C.ink,LIGHT?.55:.7); ctx.fill(); });
  const p=D.P[S.probe]; ctx.beginPath(); ctx.arc(F.px(p[0]),F.py(D.Y[S.probe]),8,0,7); ctx.strokeStyle=C.s4; ctx.lineWidth=2.2; ctx.stroke();
  $('pl-scap').textContent=dataOnly?'The data alone: one input x, one target y.':'Blue: the network’s curve. Faint gold: what each neuron of the last hidden layer adds'+(nh?'; the gold ticks are its '+nh+' creases (hinges).':'.')+' The curve is their sum plus a shift.'; }
function spaceLayer1(ctx,w,h,K){ const [x0,x1]=D.dom, N=140, n=NET.sizes[K]; const cur=[]; let lo=Infinity,hi=-Infinity;
  for(let j=0;j<n;j++){ const ys=[]; for(let i=0;i<N;i++){ const v=fwd(NET,D.fx([x0+(x1-x0)*i/(N-1)])).a[K][j]; ys.push(v); if(isFinite(v)){ lo=Math.min(lo,v); hi=Math.max(hi,v); } } cur.push(ys); }
  const sp=(hi-lo)||1; lo-=sp*.1; hi+=sp*.1; const F=spaceFrame(w,h,x0,x1,lo,hi); axes(ctx,F,'x','a'+tsup(K)); ctx.save(); ctx.beginPath(); ctx.rect(F.l,F.t,w-F.l-F.r,h-F.t-F.b); ctx.clip();
  const pal=[C.s1,C.s2,C.s3,C.s4,C.s5,C.s6,C.s7,C.ink2];
  cur.forEach((ys,j)=>{ ctx.beginPath(); ys.forEach((v,i)=>{ const X=F.px(x0+(x1-x0)*i/(N-1)),Y=F.py(v); if(i) ctx.lineTo(X,Y); else ctx.moveTo(X,Y); }); ctx.strokeStyle=pal[j%8]; ctx.lineWidth=2; ctx.stroke(); });
  ctx.restore(); $('pl-scap').textContent='Each coloured line is one neuron of layer '+K+' as x sweeps across: its output a'+tsup(K)+'ⱼ(x). The next layer can only mix these shapes.'; }

/* ---------- drawing: matrices ---------- */
function cellsHTML(M,kind,o){ o=o||{}; const rows=M.length, cols=M[0].length; let h='<span class="pl-mx '+kind+'" style="--c:'+cols+'"><i class="br"></i><span class="g">';
  let mx=1e-12; M.forEach(r=>r.forEach(v=>{ if(v!=null&&isFinite(v)) mx=Math.max(mx,Math.abs(v)); }));
  for(let i=0;i<rows;i++) for(let j=0;j<cols;j++){ const v=M[i][j]; const hid=v==null; const t=hid?0:Math.sqrt(Math.min(1,Math.abs(v)/mx));
    const hl=(o.row===i)||(o.cell&&o.cell[0]===i&&o.cell[1]===j), cls=hid?'u':(kind==='w'?(v>=0?'p':'n'):kind);
    h+='<span class="c '+cls+(hl?' hl':'')+(o.dead&&o.dead[i]?' dz':'')+'" style="--t:'+t.toFixed(3)+'">'+(hid?'·':fs(v))+'</span>'; }
  return h+'</span><i class="br r"></i><span class="sh">'+rows+'×'+cols+'</span></span>'; }
function drawMatrix(){ const box=$('pl-mwrap'); if(!box||S.view!=='matrix') return; const L=NET.L, dc=S.dc, c=dc.c, g=dc.g, R=S.rev, cls=NET.head==='cls';
  const cur=S.idx>=0&&S.idx<=S.iBack&&!S.fresh?S.steps[S.idx]:null; let h='';
  const col=v=>Array.from(v).map(x=>[x]);
  for(let l=1;l<=L;l++){ const n=NET.sizes[l], m=NET.sizes[l-1];
    const aPrev=col(c.a[l-1]).map((r,k)=>[l===1||R.has('a'+(l-1)+'.'+k)?r[0]:null]);
    const z=col(c.z[l]).map((r,j)=>[R.has('z'+l+'.'+j)?r[0]:null]), a=col(c.a[l]).map((r,j)=>[R.has('a'+l+'.'+j)?r[0]:null]);
    const row=cur&&(cur.k==='F'||cur.k==='A'||cur.k==='BW')&&cur.l===l?cur.j:null, dead=Array.from(c.z[l]).map((v,j)=>NET.acts[l]==='relu'&&v<=0&&R.has('z'+l+'.'+j));
    const sel=S.sel&&S.sel.l===l?S.sel:null;
    h+='<div class="pl-mb'+(row!=null?' on':'')+'"><div class="pl-mt"><b>Layer '+l+'</b> · W'+usup(l)+' is '+n+'×'+m+' · then '+(ACTN[NET.acts[l]])+(l===L?(cls?' (the class scores become probabilities)':' (this is ŷ)'):'')+'</div>';
    h+='<div class="pl-eq"><span class="pl-lab">forward</span>'+cellsHTML(NET.W[l],'w',{row,cell:sel&&sel.e?[sel.j,sel.k]:null})+'<span class="op">·</span>'+cellsHTML(aPrev,'v')+'<span class="op">+</span>'+cellsHTML(col(NET.b[l]),'w',{row})+'<span class="op">=</span>'+cellsHTML(z,'v',{row,dead})+'<span class="op">→</span>'+cellsHTML(a,'v',{row,dead})+'<span class="nm">z'+usup(l)+' → a'+usup(l)+'</span></div>';
    const gzv=col(g.gz[l]).map((r,j)=>[R.has('gz'+l+'.'+j)?r[0]:null]), gwv=g.gW[l].map((rw,j)=>Array.from(rw).map(v=>R.has('gw'+l+'.'+j)?v:null)), gbv=col(g.gb[l]).map((r,j)=>[R.has('gw'+l+'.'+j)?r[0]:null]);
    const gav=col(g.ga[l-1]).map((r,k)=>[R.has('ga'+(l-1)+'.'+k)?r[0]:null]);
    const brow=cur&&cur.k==='BW'&&cur.l===l?cur.j:null;
    h+='<div class="pl-eq back"><span class="pl-lab">backward</span><span class="nm2">∂L/∂W'+usup(l)+' =</span>'+cellsHTML(gzv,'g',{row:brow})+'<span class="op">·</span>'+cellsHTML([Array.from(c.a[l-1]).map((v,k)=>l===1||R.has('a'+(l-1)+'.'+k)?v:null)],'v')+'<span class="op">=</span>'+cellsHTML(gwv,'g',{row:brow})
      +'<span class="gap"></span><span class="nm2">∂L/∂b'+usup(l)+' =</span>'+cellsHTML(gbv,'g',{row:brow})
      +(l>1?'<span class="gap"></span><span class="nm2">∂L/∂a'+usup(l-1)+' = W'+usup(l)+'ᵀ·∂L/∂z'+usup(l)+' =</span>'+cellsHTML(gav,'g',{row:cur&&cur.k==='BA'&&cur.l===l?cur.j:null}):'')+'</div></div>'; }
  /* the collapse: no bends anywhere → the stack is one matrix */
  if(L>1&&NET.acts.slice(1,L).every(a=>a==='none')){ let M=NET.W[1].map(r=>r.slice()), b=NET.b[1].slice();
    for(let l=2;l<=L;l++){ const W=NET.W[l]; M=W.map(r=>M[0].map((_,k)=>r.reduce((s,w,j)=>s+w*M[j][k],0))); b=W.map((r,i)=>r.reduce((s,w,j)=>s+w*b[j],0)+NET.b[l][i]); }
    h+='<div class="pl-mb col"><div class="pl-mt"><b>No bends anywhere → one matrix.</b> Multiply the layers out: the whole stack is exactly one layer.</div><div class="pl-eq"><span class="nm2">W = W'+usup(L)+'···W'+usup(1)+' =</span>'+cellsHTML(M,'w')+'<span class="gap"></span><span class="nm2">b =</span>'+cellsHTML(b.map(x=>[x]),'w')+'</div></div>'; }
  box.innerHTML=h; }

/* ---------- HUD: the step being taken, with the numbers plugged in ---------- */
function termList(ws,as,b){ const t=ws.map((w,k)=>P(w)+P(as[k])); let s=t.length>4?t.slice(0,3).join(' + ')+' + … + '+t[t.length-1]:t.join(' + '); return s+' + '+P(b); }
function stepHTML(s){ const L=NET.L, dc=S.dc, c=dc.c, g=dc.g, cls=NET.head==='cls', lj=j=>j+1;
  if(S.fresh&&S.idx===S.iBack){ const np=params(NET).length;
    return {b:'BOTH PASSES DONE · for the gold-ringed example',cls:'s',f:(cls?'q'+usub(D.Y[S.probe]+1)+' = <b class="v">'+fm(c.a[L][D.Y[S.probe]],3)+'</b>':'ŷ = <b class="v">'+fm(c.a[L][0])+'</b>')+' &nbsp;·&nbsp; L = <b class="g">'+fm(dc.loss)+'</b> &nbsp;·&nbsp; '+(cls?'∂L/∂z'+usup(L)+' = q − y':'∂L/∂ŷ = ŷ − y = <b class="g">'+fm(g.ga[L][0])+'</b>')+' &nbsp;·&nbsp; '+np+' gradients ready',
      w:'Blue: every value on the way forward. Red: every node\u2019s blame on the way back. Press ↺ start over to walk both passes one node at a time — or ▶ one node to take one step downhill with η = '+sci(S.eta,0)+'.'}; }
  if(!s) return {b:'READY',cls:'rd',f:'The inputs are in: '+D.inNames.map((nm,k)=>nm+' = '+fm(c.a[0][k])).join(', ')+'. Nothing else is computed yet.',w:'Press ▶ one node to compute the first neuron.'};
  if(s.k==='F'){ const l=s.l,j=s.j, z=c.z[l][j], a=c.a[l][j], f=NET.acts[l];
    const lin=V('z',l,lj(j))+' = '+termList(Array.from(NET.W[l][j]),Array.from(c.a[l-1]),NET.b[l][j])+' = <b class="v">'+fm(z)+'</b>';
    if(cls&&l===L) return {b:'FORWARD · linear arrow',cls:'f',f:lin,w:'Row '+lj(j)+' of W'+usup(l)+' dotted with the column a'+usup(l-1)+', plus the bias: the score for class '+lj(j)+'.'};
    const bend=f==='relu'?'ReLU('+fm(z)+')':f==='sigmoid'?'σ('+fm(z)+')':f==='tanh'?'tanh('+fm(z)+')':fm(z);
    const w=f==='relu'?(z>0?'Row '+lj(j)+' of W'+usup(l)+' dotted with the column below, plus the bias. Positive, so the neuron is <b class="aw">awake</b> and passes it on.':'Negative, so ReLU switches this neuron <b class="as">off</b> — it outputs 0. Keep an eye on it on the way back.'):f==='none'?'No bend: the value passes on unchanged.':'The '+f+' squashes the value; its slope here is '+fm(dact(f,z,a),3)+'.';
    return {b:'FORWARD · linear arrow, then the bend',cls:'f',f:lin+' &nbsp;→&nbsp; '+V('a',l,lj(j))+' = '+bend+' = <b class="v">'+fm(a)+'</b>',w}; }
  if(s.k==='SM'){ const q=Array.from(c.a[L]); return {b:'FORWARD · softmax',cls:'f',f:'q = softmax(z'+usup(L)+') = ('+q.map(v=>fm(v,3)).join(', ')+')',w:'Scores become probabilities: exponentiate, then divide by the total (Unit 14).'}; }
  if(s.k==='L'){ if(cls){ const y=D.Y[S.probe]; return {b:'LOSS',cls:'l',f:'L = −ln q'+usub(y+1)+' = −ln '+fm(c.a[L][y],4)+' = <b class="g">'+fm(dc.loss)+'</b>',w:'Cross-entropy: how surprised the network is by the true class.'}; }
    const yh=c.a[L][0], y=D.Y[S.probe]; return {b:'LOSS',cls:'l',f:'L = ½(ŷ − y)² = ½'+'('+fm(yh)+' − '+fm(y)+')² = <b class="g">'+fm(dc.loss)+'</b>',w:'The network says '+fm(yh)+'; the truth is '+fm(y)+'. The error is ŷ − y = '+fm(yh-y)+'.'}; }
  if(s.k==='S'){ if(cls){ const y=D.Y[S.probe]; return {b:'START · prediction − truth',cls:'s',f:'∂L/∂z'+usup(L)+' = q − y = ('+Array.from(c.a[L]).map(v=>fm(v,3)).join(', ')+') − ('+Array.from(c.a[L]).map((_,j)=>j===y?1:0).join(', ')+') = <b class="g">('+Array.from(g.gz[L]).map(v=>fm(v,3)).join(', ')+')</b>',w:'Softmax and cross-entropy together give the simplest possible start: prediction minus truth.'}; }
    return {b:'START · prediction − truth',cls:'s',f:'∂L/∂ŷ = ŷ − y = '+fm(c.a[L][0])+' − '+fm(D.Y[S.probe])+' = <b class="g">'+fm(g.ga[L][0])+'</b>',w:'The ½ in the loss was there only to cancel the 2. The blame starts as the plain error.'}; }
  if(s.k==='A'){ const l=s.l,j=s.j, f=NET.acts[l], z=c.z[l][j], sl=dact(f,z,c.a[l][j]), ga=g.ga[l][j], gz=g.gz[l][j];
    const nm=f==='relu'?'ReLU′':f==='sigmoid'?'σ′':f==='tanh'?'tanh′':'1';
    const f1='∂L/∂'+V('z',l,lj(j))+' = ∂L/∂'+V('a',l,lj(j))+' × '+(f==='none'?'1':nm+'('+fs(z)+')')+' = '+P(ga)+' × '+P(sl)+' = <b class="g">'+fm(gz)+'</b>';
    const w=f==='relu'?(z>0?'The switch was on (z was positive), so the blame passes straight through.':'This neuron slept on the way forward, so the switch is off and the blame is <b class="as">blocked</b>. It learns nothing this step.'):f==='none'?'No bend, so nothing changes.':'Only '+Math.round(sl*100)+'% of the blame gets through this '+f+(f==='sigmoid'?' (never more than 25%).':'.');
    return {b:'RULE A · crossing a bend backwards',cls:'a',f:f1,w}; }
  if(s.k==='BW'){ const l=s.l,j=s.j, gz=g.gz[l][j], ap=Array.from(c.a[l-1]); const gw=Array.from(g.gW[l][j]);
    const lst=v=>v.length>5?v.slice(0,4).map(x=>fm(x)).join(', ')+', …':v.map(x=>fm(x)).join(', ');
    const zeros=ap.some(v=>v===0)&&gz!==0;
    return {b:'RULE B · the wires’ blame',cls:'b',f:'∂L/∂W'+usup(l)+'<sub>'+lj(j)+',:</sub> = ∂L/∂'+V('z',l,lj(j))+' × a'+usup(l-1)+'ᵀ = '+P(gz)+' × ('+lst(ap)+') = <b class="g">('+lst(gw)+')</b> &nbsp;·&nbsp; ∂L/∂'+V('b',l,lj(j))+' = <b class="g">'+fm(gz)+'</b>',
      w:gz===0?'No blame arrived at this neuron, so none of its wires gets any.':'Each wire’s blame = the blame at its end × what flowed in through it.'+(zeros?' A wire that carried 0 gets 0 blame.':'')}; }
  if(s.k==='BA'){ const l=s.l,k=s.j, W=NET.W[l], gz=Array.from(g.gz[l]); const t=W.map((r,j)=>P(r[k])+P(gz[j])); const str=t.length>4?t.slice(0,3).join(' + ')+' + … + '+t[t.length-1]:t.join(' + ');
    return {b:'RULE B · blame for the layer below',cls:'b',f:'∂L/∂'+V('a',l-1,k+1)+' = Σ<sub>j</sub> W'+usup(l)+'<sub>j'+(k+1)+'</sub> ∂L/∂z'+usup(l)+'<sub>j</sub> = '+str+' = <b class="g">'+fm(g.ga[l-1][k])+'</b>',w:'Column '+(k+1)+' of W'+usup(l)+' — a row of W'+usup(l)+'ᵀ. Forward you multiply by W; backward by Wᵀ: same wires, opposite direction.'}; }
  if(s.k==='U'){ const g0=S.pc.g, b0=S.snap; const ex=[]; for(let l=1;l<=L&&ex.length<2;l++){ const r=b0.W[l][0]; if(g0.gW[l][0][0]!==0) ex.push('W'+usup(l)+'₁₁: '+fm(r[0])+' − '+sci(S.eta,0)+' × '+P(g0.gW[l][0][0])+' = '+fm(NET.W[l][0][0],6)); }
    return {b:'UPDATE · one step downhill',cls:'u',f:'θ ← θ − η ∂L/∂θ with η = '+sci(S.eta,1)+(ex.length?' &nbsp;·&nbsp; '+ex.join(' &nbsp;·&nbsp; '):''),w:'Every weight and bias takes a small step against its own blame. (A hand step: plain gradient descent on this one example.)'}; }
  if(s.k==='R'){ const L0=S.pc.loss, L1=S.pcNew.loss; const up=L1>L0;
    return {b:'RE-RUN · same input, new weights',cls:up?'x':'r',f:(cls?'L':'ŷ = <b class="v">'+fm(S.pcNew.c.a[L][0])+'</b>, L')+' = '+fm(L0)+' → <b class="g">'+fm(L1)+'</b>',w:up?'The loss went <b class="as">up</b>: the step was too big and overshot. Try a smaller η.':'The loss fell. Press ▶ again to walk the next round with the new weights.'}; }
  return {b:'',cls:'',f:'',w:''}; }
function drawHUD(){ const hud=$('pl-hud'); if(!hud) return; const s=S.idx>=0?S.steps[S.idx]:null; const o=S.running?{b:'TRAINING',cls:'t',f:'The network is learning. Pause to step through one example by hand.',w:''}:stepHTML(s);
  const n=S.steps.length; hud.innerHTML='<div class="pl-bdg '+o.cls+'">'+o.b+'<span>'+(S.running?'':'step '+(S.idx+1)+' / '+n)+'</span></div><div class="pl-f">'+o.f+'</div>'+(o.w?'<div class="pl-w">'+o.w+'</div>':'');
  /* the rail */
  const rail=$('pl-rail'); let h=''; S.steps.forEach((st,i)=>{ const p=phs(st); h+='<i class="'+(p==='fwd'?'f':p==='bwd'?'b':'u')+(i<=S.idx?' on':'')+(i===S.idx?' cur':'')+'" data-i="'+i+'"></i>'; }); rail.innerHTML=h;
  $('pl-s-back').disabled=S.idx<0; }

/* ---------- inspector ---------- */
function drawInsp(){ const box=$('pl-insp'); if(!box) return; const sel=S.sel, dc=S.dc, c=dc.c, g=dc.g, L=NET.L;
  if(!sel){ box.innerHTML='<div class="pl-ih">Inspect</div><p class="pl-fine">Click any neuron or wire in the graph. You will see its value, its slope, the blame it gets — and for a wire, backprop’s number next to a finite-difference check.</p>'; return; }
  const row=(k,v,cl)=>'<tr><th>'+k+'</th><td'+(cl?' class="'+cl+'"':'')+'>'+v+'</td></tr>';
  if(sel.e){ const {l,j,k}=sel, w=NET.W[l][j][k], gw=g.gW[l][j][k]; const [x,y]=probeXY(); const d1={X:[x],Y:[y],kind:D.kind}; const fd=fdiff(NET,d1,[0],{l,j,k});
    box.innerHTML='<div class="pl-ih">Wire W'+usup(l)+usub(j+1)+usub(k+1)+' <span>from '+(l===1?D.inNames[k]:'neuron '+(k+1)+' of layer '+(l-1))+' to neuron '+(j+1)+' of '+(l===L?'the output':'layer '+l)+'</span></div><table class="pl-kv">'
      +row('weight w',fm(w,4),w>=0?'p':'n')+row('what flowed in, a'+usup(l-1)+usub(k+1),fm(c.a[l-1][k]),'v')+row('blame at its end, ∂L/∂z'+usup(l)+usub(j+1),fm(g.gz[l][j]),'g')
      +row('backprop ∂L/∂w = (∂L/∂z)(a)','<b>'+fm(gw)+'</b>','g')+row('finite difference [L(w+h) − L(w−h)] / 2h',fm(fd),'g')+row('relative error',sci(relErr(gw,fd),1)+(relErr(gw,fd)<1e-6?' ✓':''),'ok')+'</table><p class="pl-fine">For the chosen example (ringed in gold in the Space panel).</p>'; return; }
  const {l,j}=sel;
  if(l===0){ box.innerHTML='<div class="pl-ih">Input '+(D.inNames[j]||'x'+(j+1))+'</div><table class="pl-kv">'+row('value a'+usup(0)+usub(j+1),fm(c.a[0][j]),'v')+row('∂L/∂x (how the loss would move if this input moved)',fm(g.ga[0][j]),'g')+'</table>'; return; }
  const f=NET.acts[l], z=c.z[l][j], a=c.a[l][j], sl=f==='softmax'?null:dact(f,z,a), dead=f==='relu'&&z<=0;
  let deadAll=''; if(f==='relu'){ let on=0; D.X.forEach(x=>{ if(fwd(NET,x).z[l][j]>0) on++; }); deadAll=on===0?'asleep for every one of the '+D.X.length+' points — a dead neuron':'awake for '+on+' of '+D.X.length+' points'; }
  box.innerHTML='<div class="pl-ih">Neuron '+(j+1)+' of '+(l===L?'the output':'layer '+l)+' <span>'+ACTN[f]+(f==='relu'?(dead?' · asleep':' · awake'):'')+'</span></div><table class="pl-kv">'
    +row('z = row '+(j+1)+' of W · a + b',fm(z),'v')+row('a = '+ACTN[f]+'(z)',fm(a),'v')+(sl!=null?row('local slope '+ACTN[f]+'′(z)',fm(sl,4),'s'):'')
    +(g.ga[l]&&g.ga[l][j]!=null?row('∂L/∂a',fm(g.ga[l][j]),'g'):'')+row('∂L/∂z',fm(g.gz[l][j]),'g')+row('bias b',fm(NET.b[l][j]),NET.b[l][j]>=0?'p':'n')+row('∂L/∂b = ∂L/∂z',fm(g.gb[l][j]),'g')+'</table>'
    +(deadAll?'<p class="pl-fine">Over the whole data set: '+deadAll+'.</p>':''); }

/* ---------- training panel ---------- */
function drawTrain(){ const cv=$('pl-loss'); if(!cv) return; const f=fitCanvas(cv,150), ctx=f.ctx, w=f.w, h=f.h; ctx.clearRect(0,0,w,h);
  const H=S.hist, G=S.full||record(); const l=26, r=10, t=10, b=20;
  ctx.font='500 9.5px '+C.ui; ctx.fillStyle=C.mut;
  if(H.length<2){ ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('press ▶ train or +1 step — the loss curve draws here',w/2,h/2); }
  else { let lo=Infinity,hi=-Infinity; H.forEach(q=>{ const v=Math.log10(Math.max(1e-12,q[1])); if(isFinite(v)){ lo=Math.min(lo,v); hi=Math.max(hi,v); } }); if(hi-lo<.3){ const m=(hi+lo)/2; lo=m-.15; hi=m+.15; } lo=Math.floor(lo*2)/2; hi=Math.ceil(hi*2)/2;
    const x0=H[0][0], x1=Math.max(H[H.length-1][0],x0+1), X=v=>l+(v-x0)/(x1-x0)*(w-l-r), Y=v=>h-b-(Math.log10(Math.max(1e-12,v))-lo)/(hi-lo)*(h-t-b);
    ctx.strokeStyle=A(C.ink,.07); ctx.lineWidth=1; ctx.textAlign='right'; ctx.textBaseline='middle';
    for(let e=Math.ceil(lo);e<=hi;e++){ const yy=h-b-(e-lo)/(hi-lo)*(h-t-b); ctx.beginPath(); ctx.moveTo(l,yy); ctx.lineTo(w-r,yy); ctx.stroke(); ctx.fillText(e===0?'1':'10'+(e<0?'⁻':'')+String(Math.abs(e)).split('').map(q=>SUPD[q]).join(''),l-3,yy); }
    ctx.beginPath(); H.forEach((q,i)=>{ const xx=X(q[0]),yy=Y(q[1]); if(i) ctx.lineTo(xx,yy); else ctx.moveTo(xx,yy); }); const grd=ctx.createLinearGradient(0,t,0,h-b); grd.addColorStop(0,A(C.crit,.22)); grd.addColorStop(1,A(C.crit,0));
    ctx.save(); ctx.lineTo(X(H[H.length-1][0]),h-b); ctx.lineTo(X(H[0][0]),h-b); ctx.closePath(); ctx.fillStyle=grd; ctx.fill(); ctx.restore();
    ctx.beginPath(); H.forEach((q,i)=>{ const xx=X(q[0]),yy=Y(q[1]); if(i) ctx.lineTo(xx,yy); else ctx.moveTo(xx,yy); }); ctx.strokeStyle=C.crit; ctx.lineWidth=2; if(!LIGHT){ ctx.shadowColor=A(C.crit,.6); ctx.shadowBlur=8; } ctx.stroke(); ctx.shadowBlur=0;
    const lq=H[H.length-1]; ctx.beginPath(); ctx.arc(X(lq[0]),Y(lq[1]),3.5,0,7); ctx.fillStyle=C.crit; ctx.fill();
    ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillStyle=C.mut; ctx.fillText('steps →',l+2,h-b+5); ctx.textAlign='right'; ctx.fillText(String(x1),w-r,h-b+5); }
  const acc=D.kind==='cls'?' · accuracy <b>'+Math.round(G.acc*100)+'%</b>':'';
  $('pl-stats').innerHTML='<span>step <b>'+S.it+'</b></span><span>epoch <b>'+(S.seen/D.X.length).toFixed(S.seen/D.X.length<10?2:1)+'</b></span><span>loss <b class="g">'+fm(G.loss)+'</b></span>'+(acc?'<span>'+acc.slice(3)+'</span>':'')+(S.diverged?'<span class="bad">diverged — lower η</span>':'');
  /* blame per layer */
  const L=NET.L, rms=[]; for(let l=1;l<=L;l++) rms.push(G.bl[l]);
  const top=Math.max(...rms.map(v=>v>0?Math.log10(v):-99)); let hb='';
  rms.forEach((v,i)=>{ const lg=v>0?Math.log10(v):-99, frac=Math.max(.015,Math.min(1,(lg-(top-6))/6)); const rel=rms[L-1]>0?v/rms[L-1]:0;
    hb+='<div class="pl-bar"><span class="nm">'+(i+1===L?'output':'layer '+(i+1))+'</span><span class="tr"><i style="width:'+(frac*100).toFixed(1)+'%;opacity:'+(.35+.65*frac).toFixed(2)+'"></i></span><span class="v">'+(v>0?sci(v,1):'0')+'</span><span class="rl">'+(i+1===L?'':rel>0?(rel>=1?'×'+fs(rel):'×1/'+fs(1/rel)):'dead')+'</span></div>'; });
  $('pl-bars').innerHTML=hb; }

/* ---------- gradient check ---------- */
function gradCheck(){ const idx=ALL(), G=batchGrad(NET,D,idx), ps=params(NET); let maxRel=0, worst=null; const rows=[];
  ps.forEach(p=>{ const gv=gget(G,p), fd=fdiff(NET,D,idx,p), re=relErr(gv,fd); if(!(re<=maxRel)){ maxRel=re; worst=p; } rows.push({p,gv,fd,re}); });
  if(!isFinite(maxRel)) maxRel=Infinity;
  return {maxRel,n:ps.length,rows,worst,ok:maxRel<1e-6}; }
function drawGC(){ const box=$('pl-gcr'); if(!box) return; const r=S.gcr; if(!r){ box.innerHTML=''; return; }
  const z=r.rows.filter(q=>q.gv===0&&q.fd===0).length;
  let h='<div class="pl-gcv '+(r.ok?'ok':'bad')+'">'+(r.ok?'✓ backprop agrees':'✗ mismatch')+'<span>max relative error <b>'+(r.maxRel===0?'0':sci(r.maxRel,1))+'</b> over '+r.n+' parameters'+(z?' · '+z+' are exactly 0':'')+'</span></div>';
  h+='<details class="pl-gcd"><summary>see every parameter</summary><div class="pl-gct"><table><thead><tr><th>param</th><th>backprop</th><th>finite diff.</th><th>rel. error</th></tr></thead><tbody>';
  r.rows.slice(0,120).forEach(q=>{ h+='<tr><td>'+pname(q.p)+'</td><td>'+fm(q.gv)+'</td><td>'+fm(q.fd)+'</td><td>'+(q.re===0?'0':sci(q.re,1))+'</td></tr>'; });
  if(r.rows.length>120) h+='<tr><td colspan="4">… and '+(r.rows.length-120)+' more</td></tr>'; h+='</tbody></table></div></details>'; box.innerHTML=h; }

/* ---------- builder, notes, example chooser ---------- */
function drawBuilder(){ const box=$('pl-layers'); if(!box) return; const L=NET.L; let h='';
  const dots=n=>'<span class="pl-dots">'+Array.from({length:n},()=>'<i></i>').join('')+'</span>';
  h+='<div class="pl-lc in"><div class="t">Input</div><div class="n">'+NET.sizes[0]+'</div>'+dots(NET.sizes[0])+'<div class="s">'+D.inNames.join(', ')+'</div></div><span class="pl-arr">→</span>';
  for(let l=1;l<L;l++){ h+='<div class="pl-lc hid" data-l="'+l+'"><div class="t">Hidden '+l+'<button class="x" data-act="rml" data-l="'+l+'" title="Remove this layer" aria-label="Remove hidden layer '+l+'">×</button></div>'
    +'<div class="n"><button data-act="rmn" data-l="'+l+'" aria-label="One neuron fewer in layer '+l+'"'+(NET.sizes[l]<=1?' disabled':'')+'>−</button><b>'+NET.sizes[l]+'</b><button data-act="addn" data-l="'+l+'" aria-label="One more neuron in layer '+l+'"'+(NET.sizes[l]>=MAXN?' disabled':'')+'>+</button></div>'+dots(NET.sizes[l])
    +'<select class="pl-sel sm" data-act="act" data-l="'+l+'" aria-label="Bend for layer '+l+'">'+['relu','sigmoid','tanh','none'].map(a=>'<option value="'+a+'"'+(NET.acts[l]===a?' selected':'')+'>'+ACTN[a]+'</option>').join('')+'</select></div><span class="pl-arr">→</span>'; }
  h+='<button class="pl-addl" data-act="addl"'+(L-1>=MAXH?' disabled':'')+' title="Add a hidden layer">+ layer</button><span class="pl-arr">→</span>';
  h+='<div class="pl-lc out"><div class="t">Output</div><div class="n">'+NET.sizes[L]+'</div>'+dots(NET.sizes[L])
    +(D.kind==='cls'?'<div class="s">softmax + cross-entropy · '+D.K+' classes</div>':'<select class="pl-sel sm" data-act="head" aria-label="Output head"><option value="lin"'+(NET.head==='lin'?' selected':'')+'>linear · ½(ŷ−y)²</option><option value="relu"'+(NET.head==='relu'?' selected':'')+'>ReLU · ½(ŷ−y)²</option></select>')+'</div>';
  if(L>1) h+='<div class="pl-all"><span class="pl-mini">every bend</span><span class="pl-seg" id="pl-allact">'+['relu','sigmoid','tanh','none'].map(a=>'<button data-v="'+a+'" aria-pressed="'+(NET.acts.slice(1,L).every(x=>x===a))+'">'+ACTN[a]+'</button>').join('')+'</span><span class="pl-pc">'+params(NET).length+' parameters</span></div>';
  box.innerHTML=h; }
function liveNote(){ const p=S.preset, L=NET.L;
  if(p==='salary') return 'Now: ŷ = <b>'+fm(S.pc.c.a[L][0])+'</b>, L = <b>'+fm(S.pc.loss)+'</b>.';
  if(p==='collapse'){ if(!NET.acts.slice(1,L).every(a=>a==='none')) return 'Bends are on: the boundary can now curve. Train and watch it wrap around the moons.';
    let M=NET.W[1].map(r=>r.slice()); for(let l=2;l<=L;l++){ const W=NET.W[l]; M=W.map(r=>M[0].map((_,k)=>r.reduce((s,w,j)=>s+w*M[j][k],0))); }
    return 'Right now the whole stack is one '+M.length+'×'+M[0].length+' matrix: ['+M.map(r=>r.map(v=>fs(v)).join(', ')).join(' ; ')+'] — open <b>Matrices</b> to see it.'; }
  if(p==='dead'){ let dead=0,tot=0; for(let l=1;l<L;l++) for(let j=0;j<NET.sizes[l];j++){ if(NET.acts[l]!=='relu') continue; tot++; if(D.X.every(x=>fwd(NET,x).z[l][j]<=0)) dead++; }
    return 'Asleep for every point: <b>'+dead+' of '+tot+'</b> hidden neurons.'; }
  if(p==='vanish'){ const G=S.full||record(); const a=G.bl[1], b=G.bl[L];
    return 'Blame reaching layer 1 is <b>'+(a>0?'1/'+fs(b/a):'0')+'</b> of the blame at the output.'; }
  if(p==='folds'){ const G=S.full||record(); return '<b>'+NET.sizes[1]+'</b> neurons = up to '+NET.sizes[1]+' creases · loss <b>'+fm(G.loss)+'</b>.'; }
  return ''; }
function drawNote(){ const n=NOTES[S.preset]||NOTES.free, box=$('pl-note'); if(!box) return;
  box.innerHTML='<div class="pl-nt"><b>'+n.t+'</b> '+n.b+'</div><div class="pl-nl">'+liveNote()+(n.a?' <button class="pl-act" id="pl-act">'+n.a+'</button>':'')+'</div>';
  const b=$('pl-act'); if(b) b.onclick=noteAction; }
function noteAction(){ const p=S.preset;
  if(p==='salary'){ goTo(-1,true); drawAll(); }
  else if(p==='collapse'){ setAllActs('relu'); }
  else if(p==='dead'){ S.bias=0.1; syncControls(); reinit(); }
  else if(p==='vanish'){ setAllActs('relu'); }
  else if(p==='folds'){ addNeuron(1); } }
function drawEx(){ const box=$('pl-ex'); if(!box) return; const i=S.probe, p=D.P[i];
  if(D.name==='salary1'){ box.innerHTML='<span class="pl-mini">example</span><label>age <input type="number" id="pl-in0" value="'+p[0]+'" step="1"></label><label>exp <input type="number" id="pl-in1" value="'+p[1]+'" step="1"></label><label>truth y <input type="number" id="pl-in2" value="'+D.Y[0]+'" step="1"></label>';
    ['pl-in0','pl-in1','pl-in2'].forEach((id,k)=>{ $(id).addEventListener('change',e=>{ const v=parseFloat(e.target.value); if(!isFinite(v)) return; if(k<2) D.P[0][k]=v; else D.Y[0]=v; D.X=D.P.map(D.fx); D.ylo=D.yhi=D.Y[0]; resetOpt(); rebuild(); }); }); return; }
  box.innerHTML='<span class="pl-mini">example</span><button id="pl-exp-p" aria-label="Previous example">◀</button><span class="pl-exv">#'+(i+1)+' <em>'+(D.dim===1?'x = '+fm(p[0],2):'('+fm(p[0],2)+', '+fm(p[1],2)+')')+' · '+(D.kind==='cls'?'class '+(D.Y[i]+1):'y = '+fm(D.Y[i],2))+'</em></span><button id="pl-exp-n" aria-label="Next example">▶</button><span class="pl-mini hint">or click a point in Space</span>';
  $('pl-exp-p').onclick=()=>setProbe((i-1+D.X.length)%D.X.length); $('pl-exp-n').onclick=()=>setProbe((i+1)%D.X.length); }
function setProbe(i){ pause(); S.probe=i; S.pc=probeCache(); buildSteps(); S.upd=false; S.idx=S.iBack; setDisplay(); drawAll(); }

/* ---------- controls ---------- */
function press(bar,v){ if(!bar) return; bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===String(v)?'true':'false')); }
function etaTxt(e){ return sci(e,e>=0.1||Math.abs(Math.log10(e)-Math.round(Math.log10(e)))<.01?0:1); }
function syncControls(){ $('pl-ds').value=S.ds; press($('pl-noise'),S.noise); $('pl-sq').checked=S.sq; $('pl-sc').checked=S.sc;
  $('pl-eta').value=Math.log10(S.eta); $('pl-eta-o').textContent=etaTxt(S.eta); press($('pl-opt'),S.opt); press($('pl-batch'),S.batch);
  $('pl-init').value=S.init; $('pl-init-o').textContent=fs(S.init)+'×'; $('pl-bias').value=S.bias; $('pl-bias-o').textContent=fs(S.bias); $('pl-seed-v').textContent=S.seed;
  $('pl-pics').checked=S.pics; $('pl-wlab').checked=S.wlab;
  ROOT.querySelectorAll('.pl-exp').forEach(b=>b.setAttribute('aria-pressed',b.dataset.preset===S.preset?'true':'false')); }
function pause(){ if(!S.running) return; S.running=false; const b=$('pl-run'); if(b){ b.textContent='▶ train'; b.classList.remove('on'); } drawAllSoon(); }
function run(){ if(S.running){ pause(); return; } if(S.upd&&S.idx>=S.iU){ commitHand(); } S.running=true; S.diverged=false; S.sel=S.sel&&S.sel.e?S.sel:S.sel; $('pl-run').textContent='❚❚ pause'; $('pl-run').classList.add('on'); kick(); }
let soonT=0; function drawAllSoon(){ clearTimeout(soonT); soonT=setTimeout(drawAll,0); }
function rebuild(keepIdx){ S.fresh=true; S.pc=probeCache(); buildSteps(); S.upd=false; S.idx=S.iBack; setDisplay(); if(!S.hist.length) record(); else S.full=batchGrad(NET,D,ALL()); computePics(); drawAll(); }
function drawAll(){ readPalOnce(); S.full=S.full||batchGrad(NET,D,ALL()); if(!S.running) S.full=batchGrad(NET,D,ALL());
  drawBuilder(); syncVis(); drawGraph(now()); drawMatrix(); drawSpace(); drawHUD(); drawInsp(); drawTrain(); drawNote(); drawEx(); drawGC(); }
let palT=0; function readPalOnce(){ if(!C.s1) readPal(); }
function syncVis(){ $('pl-sq-w').style.display=D.canSq?'':'none'; $('pl-sc-w').style.display=D.canSc?'':'none';
  $('pl-t-graph').setAttribute('aria-selected',S.view==='graph'); $('pl-t-matrix').setAttribute('aria-selected',S.view==='matrix');
  $('pl-gwrap').hidden=S.view!=='graph'; $('pl-mwrap').hidden=S.view!=='matrix'; $('pl-pics').parentElement.style.display=D.dim===2?'':'none'; }

function wire(){
  ROOT.querySelectorAll('.pl-exp').forEach(b=>b.addEventListener('click',()=>loadPreset(b.dataset.preset)));
  $('pl-ds').addEventListener('change',e=>{ S.ds=e.target.value; S.sq=false; S.sc=false; toFree(); dataChanged(); syncControls(); });
  $('pl-noise').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; S.noise=+b.dataset.v; press($('pl-noise'),S.noise); dataChanged(); });
  $('pl-sq').addEventListener('change',e=>{ S.sq=e.target.checked; dataChanged(); });
  $('pl-sc').addEventListener('change',e=>{ S.sc=e.target.checked; dataChanged(); });
  $('pl-layers').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; const act=b.dataset.act, l=+b.dataset.l;
    if(b.closest('#pl-allact')){ setAllActs(b.dataset.v); return; }
    if(act==='addn') addNeuron(l); else if(act==='rmn') removeNeuron(l); else if(act==='addl') addLayer(); else if(act==='rml') removeLayer(l); });
  $('pl-layers').addEventListener('change',e=>{ const s=e.target; if(s.dataset.act==='act') setAct(+s.dataset.l,s.value); else if(s.dataset.act==='head') setHead(s.value); });
  ROOT.querySelectorAll('.pl-tabs [role=tab]').forEach(b=>b.addEventListener('click',()=>{ S.view=b.dataset.view; syncVis(); drawAll(); }));
  $('pl-pics').addEventListener('change',e=>{ S.pics=e.target.checked; computePics(); drawGraph(now()); });
  $('pl-wlab').addEventListener('change',e=>{ S.wlab=e.target.checked; drawGraph(now()); });
  $('pl-s-reset').addEventListener('click',()=>{ if(S.upd){ restore(NET,S.snap); S.upd=false; } goTo(-1,true); });
  $('pl-s-back').addEventListener('click',()=>goTo(S.idx-1,true));
  $('pl-s-node').addEventListener('click',stepNode); $('pl-s-layer').addEventListener('click',stepLayer); $('pl-s-pass').addEventListener('click',stepPass);
  $('pl-rail').addEventListener('click',e=>{ const i=e.target.dataset&&e.target.dataset.i; if(i!=null) goTo(+i,true); });
  $('pl-gwrap').addEventListener('keydown',e=>{ if(e.key==='ArrowRight'){ e.preventDefault(); stepNode(); } else if(e.key==='ArrowLeft'){ e.preventDefault(); goTo(S.idx-1,true); } });
  $('pl-run').addEventListener('click',run);
  $('pl-one').addEventListener('click',()=>{ pause(); if(S.upd) commitHand(); trainIter(); record(); rebuild(); });
  $('pl-reinit').addEventListener('click',reinit);
  $('pl-seed').addEventListener('click',()=>{ S.seed=S.seed%99+1; $('pl-seed-v').textContent=S.seed; reinit(); });
  $('pl-eta').addEventListener('input',e=>{ S.eta=Math.pow(10,+e.target.value); if(Math.abs(Math.log10(S.eta)-Math.round(Math.log10(S.eta)))<.026) S.eta=Math.pow(10,Math.round(Math.log10(S.eta))); $('pl-eta-o').textContent=etaTxt(S.eta); if(S.upd){ restore(NET,S.snap); S.upd=false; if(S.idx>=S.iU) goTo(S.idx,true); } drawHUD(); });
  $('pl-opt').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; S.opt=b.dataset.v; press($('pl-opt'),S.opt); OPT={t:0,m:zeroG(NET),v:zeroG(NET)}; });
  $('pl-batch').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; S.batch=b.dataset.v; press($('pl-batch'),S.batch); });
  $('pl-init').addEventListener('input',e=>{ S.init=+e.target.value; $('pl-init-o').textContent=fs(S.init)+'×'; });
  $('pl-init').addEventListener('change',reinit);
  $('pl-bias').addEventListener('input',e=>{ S.bias=+e.target.value; $('pl-bias-o').textContent=fs(S.bias); });
  $('pl-bias').addEventListener('change',reinit);
  $('pl-gcb').addEventListener('click',()=>{ pause(); const b=$('pl-gcb'); b.disabled=true; b.textContent='checking…'; setTimeout(()=>{ S.gcr=gradCheck(); drawGC(); b.disabled=false; b.textContent='✓ check every gradient'; },30); });
  $('pl-lay').addEventListener('input',e=>{ S.spaceK=+e.target.value; drawSpace(); });
  /* graph: hover + click */
  const gc=$('pl-graph'); const pt=e=>{ const r=gc.getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top]; };
  const hit=(x,y)=>{ const pos=GR.pos, r=GR.r; for(let l=0;l<pos.length;l++) for(let j=0;j<pos[l].length;j++){ const q=pos[l][j]; if(Math.hypot(x-q[0],y-q[1])<=r+4) return {l,j}; }
    let best=null,bd=7; for(let l=1;l<pos.length;l++) for(let j=0;j<pos[l].length;j++) for(let k=0;k<pos[l-1].length;k++){ const p=pos[l-1][k], q=pos[l][j]; let prev=p; for(let s=1;s<=18;s++){ const m=bz(p,q,s/18); const d=segD(x,y,prev,m); if(d<bd){ bd=d; best={e:true,l,j,k}; } prev=m; } } return best; };
  gc.addEventListener('pointermove',e=>{ const [x,y]=pt(e), h=hit(x,y); const key=JSON.stringify(h), old=JSON.stringify(S.hover); gc.style.cursor=h?'pointer':'default'; if(key!==old){ S.hover=h; if(!S.running) drawGraph(now()); } });
  gc.addEventListener('pointerleave',()=>{ S.hover=null; if(!S.running) drawGraph(now()); });
  gc.addEventListener('click',e=>{ const [x,y]=pt(e); S.sel=hit(x,y); drawGraph(now()); drawInsp(); drawMatrix(); });
  const sc=$('pl-space'); sc.addEventListener('click',e=>{ const r=sc.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top; const K=S.spaceK==null?NET.L:S.spaceK; if(K!==NET.L&&K!==0&&D.dim===2) return;
    const w=r.width,h=r.height; let F; if(D.dim===2){ const [x0,x1,y0,y1]=D.dom; F=spaceFrame(w,h,x0,x1,y0,y1); } else return pick1(x,y,w,h);
    let bi=-1,bd=14; D.P.forEach((p,i)=>{ const d=Math.hypot(F.px(p[0])-x,F.py(p[1])-y); if(d<bd){ bd=d; bi=i; } }); if(bi>=0) setProbe(bi); });
  function pick1(x,y,w,h){ let bi=-1,bd=1e9; D.P.forEach((p,i)=>{ const [x0,x1]=D.dom; const F=spaceFrame(w,h,x0,x1,0,1); const d=Math.abs(F.px(p[0])-x); if(d<bd){ bd=d; bi=i; } }); if(bi>=0&&bd<12) setProbe(bi); }
  /* theme + size */
  const re=()=>{ readPal(); computePics(); drawAll(); };
  new MutationObserver(re).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if(window.matchMedia){ const mq=matchMedia('(prefers-color-scheme: dark)'); if(mq.addEventListener) mq.addEventListener('change',re); }
  let lw=0; const ro=new ResizeObserver(()=>{ const w=ROOT.clientWidth; if(Math.abs(w-lw)>2){ lw=w; drawAll(); } }); ro.observe(ROOT); }
function segD(x,y,p,q){ const dx=q[0]-p[0],dy=q[1]-p[1], L2=dx*dx+dy*dy||1; let t=((x-p[0])*dx+(y-p[1])*dy)/L2; t=Math.max(0,Math.min(1,t)); return Math.hypot(x-p[0]-t*dx,y-p[1]-t*dy); }
function toFree(){ S.preset='free'; ROOT.querySelectorAll('.pl-exp').forEach(b=>b.setAttribute('aria-pressed',b.dataset.preset==='free'?'true':'false')); }

/* ---------- go ---------- */
readPal(); wire(); loadPreset('salary');

/* ---------- test hooks ---------- */
window.U15Play={
  get net(){ return NET; }, get data(){ return D; }, get state(){ return S; },
  forward:x=>fwd(NET,x), backward:(x,y)=>{ const c=fwd(NET,x); return Object.assign(bwd(NET,c,y),{loss:lossOf(NET,c,y),cache:c}); },
  grads:()=>batchGrad(NET,D,ALL()), loss:()=>meanLoss(NET,D,ALL()), gradCheck:()=>{ const r=gradCheck(); S.gcr=r; drawGC(); return {maxRel:r.maxRel,n:r.n,ok:r.ok}; },
  loadPreset, step:n=>{ pause(); if(S.upd) commitHand(); for(let i=0;i<(n||1);i++) trainIter(); record(); rebuild(); return meanLoss(NET,D,ALL()); },
  goTo:i=>goTo(i,true), stepNode, stepLayer, stepPass, get steps(){ return S.steps.map(s=>s.k+(s.l!=null?s.l:'')+(s.j!=null?'.'+s.j:'')); },
  get idx(){ return S.idx; }, get graphPos(){ return GR.pos.map(c=>c.map(q=>q.slice())); }, get display(){ return S.dc; }, get iBack(){ return S.iBack; }
};
})();
