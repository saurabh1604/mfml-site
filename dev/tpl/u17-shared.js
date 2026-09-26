/* ================= UNIT 17 · the unit's shared maths and colour language ================= */
/* one colour language for Part V: words = blue, memory / hidden state = green, probability = violet,
   loss and exploding things = red, gates = gold */
const K17={word:'s1',mem:'s3',prob:'s6',loss:'critical',gate:'s4',alt:'s2',edge:'s7'};
const cv=k=>k==='critical'?'var(--critical)':'var(--'+k+')';
/* numbers: integers print bare, others trimmed; always a real minus sign */
const N=(v,d)=>{ if(!isFinite(v)) return v>0?'∞':'−∞'; if(Math.abs(v)<5e-13) return '0'; const r=Math.round(v); if(Math.abs(v-r)<1e-9) return nm(String(r)); return trim(F(v,d==null?4:d)); };
const vecN=(v,d)=>'('+v.map(x=>N(x,d)).join(', ')+')';
const sig=z=>1/(1+Math.exp(-z));
const tanh=Math.tanh;
/* a number that can be tiny or huge: 0.000977, 57.67, 3.2 × 10⁻⁵ */
function E(v,d){ if(!isFinite(v)) return v>0?'∞':'−∞'; const a=Math.abs(v); if(a===0) return '0'; if(a>=1e5||a<1e-4){ const e=Math.floor(Math.log10(a)), m=v/10**e; return nm(trim(m.toFixed(d==null?2:d)))+' × 10'+SUP(e); } return N(v,a<0.01?6:a<1?4:(d==null?2:d)); }

/* ---- the scalar recurrent cell  h_t = tanh(w h_{t−1} + u x_t + b) ---- */
function rnn1(w,u,b,xs,h0){ const h=[h0||0], z=[null]; xs.forEach(x=>{ z.push(w*h[h.length-1]+u*x+b); h.push(tanh(z[z.length-1])); }); return {h,z}; }
/* backprop through time for L = ½(h_T − y)²: Rule A across tanh, Rule B across w·h + u·x + b, weight blame summed over steps */
function bptt1(w,u,b,xs,y){ const {h,z}=rnn1(w,u,b,xs,0), T=xs.length; const dh=new Array(T+1).fill(0), dz=new Array(T+1).fill(0), cw=new Array(T+1).fill(0), cu=new Array(T+1).fill(0);
  dh[T]=h[T]-y; let dw=0,du=0,db=0;
  for(let t=T;t>=1;t--){ dz[t]=dh[t]*(1-h[t]*h[t]); cw[t]=dz[t]*h[t-1]; cu[t]=dz[t]*xs[t-1]; dw+=cw[t]; du+=cu[t]; db+=dz[t]; dh[t-1]=w*dz[t]; }
  return {h,z,dh,dz,cw,cu,dw,du,db,L:.5*(h[T]-y)**2,T}; }
const EX={w:.5,u:1,b:0,x:[1,0,0]};                      /* §2's worked example */
const BP={w:.5,u:1,b:0,x:[1,0,0,0],y:1};                 /* §6's step machine */

/* ---- 2 × 2 matrices: eigenvalues (real or a complex pair) and powers ---- */
function eig2(M){ const a=M[0][0],b=M[0][1],c=M[1][0],d=M[1][1], tr=a+d, det=a*d-b*c, disc=tr*tr/4-det;
  if(disc>=-1e-12){ const s=Math.sqrt(Math.max(0,disc)), l1=tr/2+s, l2=tr/2-s;
    const vec=l=>{ let v=Math.abs(b)>1e-12?[b,l-a]:Math.abs(c)>1e-12?[l-d,c]:(Math.abs(l-a)<1e-12?[1,0]:[0,1]); const n=Math.hypot(v[0],v[1]); v=[v[0]/n,v[1]/n]; if(v[0]<0||(Math.abs(v[0])<1e-12&&v[1]<0)) v=[-v[0],-v[1]]; return v; };
    const L=Math.abs(l1)>=Math.abs(l2)?[l1,l2]:[l2,l1]; return {real:true,l:L,v:L.map(vec),rho:Math.abs(L[0]),tr,det}; }
  const re=tr/2, im=Math.sqrt(-disc); return {real:false,re,im,rho:Math.hypot(re,im),tr,det,angle:Math.atan2(im,re)}; }
const mv2=(M,v)=>[M[0][0]*v[0]+M[0][1]*v[1],M[1][0]*v[0]+M[1][1]*v[1]];
function orbit2(M,v,T){ const P=[v.slice()]; for(let t=0;t<T;t++) P.push(mv2(M,P[P.length-1])); return P; }
const EIGW=[[.9,.4],[.1,.6]];                            /* §7's worked matrix: eigenvalues 1 and 0.5 */

/* ---- gradient clipping ---- */
function clipVec(g,c){ const n=Math.hypot(...g); return n>c?g.map(x=>x*c/n):g.slice(); }

/* ---- the LSTM cell and the GRU cell, scalar versions ---- */
const lstmStep=(cPrev,f,i,g,o)=>{ const c=f*cPrev+i*g; return {c,h:o*tanh(c)}; };
const gruStep=(hPrev,z,hc)=>(1-z)*hPrev+z*hc;
const PARAMS=(h,d)=>{ const one=h*(h+d)+h; return {rnn:one,gru:3*one,lstm:4*one,one}; };

/* ---- THE MEMORY LAB: "remember the first word" with hand-set cells ----
   A sentence is T words. Word 1 is chai (+1) or coffee (−1). Words 2…T are fillers: each nudges the note by a random amount in [−A, A].
   A marker m is 1 on word 1 and 0 afterwards.
   plain cell :  h = tanh(w·h + s)                               (no gates)
   LSTM       :  i = σ(10m − 5), g = tanh(s), c = f·c + i·g      (forget gate held at f; the candidate and gates look only at the word)
   GRU        :  z = σ(10m − 5), h̃ = tanh(s), h = (1 − z)·h + z·h̃
   Because the gates and candidates never look at the note, the blame from the end back to step t is exact and simple:
   plain Π w(1 − h²), LSTM Π f, GRU Π (1 − z). */
const LAB={w:.9,f:.99,A:.5,T:20,trials:400,lengths:[5,10,15,20,25,30,35,40,45,50]};
function labSentence(T,A,rnd){ const first=rnd()<.5?1:-1, s=[first]; for(let t=1;t<T;t++) s.push(A*(2*rnd()-1)); return s; }
function labCells(s,o){ const T=s.length, R={rnn:[0],lstm:[0],gru:[0],iG:[0],zG:[0]};
  let h=0,c=0,g2=0;
  for(let t=0;t<T;t++){ const m=t===0?1:0;
    h=tanh(o.w*h+s[t]); R.rnn.push(h);
    const i=sig(10*m-5); c=o.f*c+i*tanh(s[t]); R.lstm.push(c); R.iG.push(i);
    const z=sig(10*m-5); g2=(1-z)*g2+z*tanh(s[t]); R.gru.push(g2); R.zG.push(z); }
  /* blame from the end back to each step t = 1…T (index t) */
  const bl={rnn:new Array(T+1).fill(0),lstm:new Array(T+1).fill(0),gru:new Array(T+1).fill(0)};
  bl.rnn[T]=bl.lstm[T]=bl.gru[T]=1;
  for(let t=T;t>=2;t--){ bl.rnn[t-1]=bl.rnn[t]*o.w*(1-R.rnn[t]*R.rnn[t]); bl.lstm[t-1]=bl.lstm[t]*o.f; bl.gru[t-1]=bl.gru[t]*(1-R.zG[t]); }
  R.bl=bl; R.first=s[0]; R.ok={rnn:Math.sign(R.rnn[T])===s[0],lstm:Math.sign(R.lstm[T])===s[0],gru:Math.sign(R.gru[T])===s[0]}; return R; }
/* accuracy over many random sentences of each length (same sentences for all three cells: a fair race) */
function labAccuracy(o){ return o.lengths.map(T=>{ const rnd=seeded(1000+T); let a={rnn:0,lstm:0,gru:0};
  for(let k=0;k<o.trials;k++){ const R=labCells(labSentence(T,o.A,rnd),o); ['rnn','lstm','gru'].forEach(c=>{ if(R.ok[c]) a[c]++; }); }
  return {T,rnn:a.rnn/o.trials,lstm:a.lstm/o.trials,gru:a.gru/o.trials}; }); }

/* ---- the beam-search tree of §13 (a decoder writing an English sentence) ---- */
const BEAM={root:[['the',.5],['our',.4],['a',.1]],
  next:{the:[['train',.4],['bus',.3],['rain',.3]],our:[['train',.9],['bus',.1]],a:[['train',.6],['bus',.4]]}};
function beamSearch(k){ let beams=[{w:[],p:1}]; const log=[];
  const kids=b=>b.w.length===0?BEAM.root:(BEAM.next[b.w[0]]||[]);
  for(let step=0;step<2;step++){ const cand=[]; beams.forEach(b=>kids(b).forEach(([w,p])=>cand.push({w:b.w.concat(w),p:b.p*p})));
    cand.sort((x,y)=>y.p-x.p); log.push({cand:cand.map(c=>({w:c.w.slice(),p:c.p})),kept:cand.slice(0,k).map(c=>c.w.join(' '))}); beams=cand.slice(0,k); }
  return {best:beams[0],log}; }

/* self-check: the page's key numbers are computed, never typed — and they must match the text */
(function(){ const r=rnn1(EX.w,EX.u,EX.b,EX.x), g=bptt1(BP.w,BP.u,BP.b,BP.x,BP.y), e=eig2(EIGW), p=PARAMS(128,64), bs=beamSearch(2), gs=beamSearch(1);
  const got=[r.h.slice(1).map(v=>v.toFixed(4)).join(),((1-r.h[3]**2)*.5).toFixed(4),((1-r.h[2]**2)*.5).toFixed(4),(.5**10).toFixed(6),(1.5**10).toFixed(2),e.l.map(v=>v.toFixed(3)).join(),
    clipVec([30,40],5).join(),lstmStep(1,.9,.2,.5,1).c.toFixed(3),(.9**10).toFixed(3),(.9**50).toFixed(5),[p.rnn,p.gru,p.lstm].join(),bs.best.w.join(' ')+' '+bs.best.p.toFixed(2),gs.best.w.join(' ')+' '+gs.best.p.toFixed(2),g.dw.toFixed(4)].join(' ; ');
  const want='0.7616,0.3634,0.1797 ; 0.4838 ; 0.4340 ; 0.000977 ; 57.67 ; 1.000,0.500 ; 3,4 ; 1.000 ; 0.349 ; 0.00515 ; 24704,74112,98816 ; our train 0.36 ; the train 0.20 ; -0.4655';
  if(got!==want) console.warn('U17: worked numbers drifted: '+got); })();

/* ---- phones: every SVG label must render at 11 px or more ----
   After a widget draws, mfont() finds each <text>, works out its size on screen, and grows it (never shrinks) to 11.5 px.
   narrowSVG() lets a widget pick a narrower viewBox on phones, so the grown labels still have room. */
const PHONE=()=>innerWidth<640;
function narrowSVG(svg,W,H,Wn,Hn){ const n=PHONE()&&Wn; svg.setAttribute('viewBox','0 0 '+(n?Wn:W)+' '+(n?Hn:H)); return {W:n?Wn:W,H:n?Hn:H,n:!!n}; }
/* a glow filter on a group would put a soft halo behind its text too; keep the glow on the shapes and the text crisp */
function unglowText(root){ const fix=(g,f)=>{ [...g.children].forEach(c=>{ if(c.tagName==='text') return; if(c.querySelector&&c.querySelector('text')) fix(c,f); else if(!c.getAttribute('filter')) c.setAttribute('filter',f); }); };
  root.querySelectorAll('[filter]').forEach(g=>{ if(g.tagName==='text'){ g.removeAttribute('filter'); return; } if(!g.querySelector('text')) return; const f=g.getAttribute('filter'); g.removeAttribute('filter'); fix(g,f); }); }
function mfont(svg,min){ unglowText(svg); const r=svg.getBoundingClientRect().width, W=svg.viewBox.baseVal.width; if(!r||!W) return; const k=W/r, lo=(min||11.5)*k; if(k<=1.02) return;
  svg.querySelectorAll('text').forEach(t=>{ const s=t.getAttribute('style')||''; const m=s.match(/font:\s*(\d+)\s+([\d.]+)px/); if(!m) return; const f=+m[2]; if(f<lo) t.setAttribute('style',s.replace(m[0],'font:'+m[1]+' '+lo.toFixed(1)+'px')); }); }
/* redraw a 2-D widget when the phone/desktop layout flips or the width changes a lot */
function onResize(fn){ let w0=innerWidth; addEventListener('resize',()=>{ if(Math.abs(innerWidth-w0)>40||(innerWidth<640)!==(w0<640)){ w0=innerWidth; fn(); } }); }
/* 3-D stages on phones: a camera further back and more from the side, so a long chain of cells fits a narrow stage */
const cam3=(desk,phone)=>PHONE()&&phone?phone:desk;
function flipRemount(S){ let p=PHONE(); addEventListener('resize',()=>{ if(PHONE()!==p){ p=PHONE(); if(S&&S.handle) remount(S); } }); }
