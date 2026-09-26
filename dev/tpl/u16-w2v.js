/* ================= UNIT 16 · the word2vec widgets: w-window, w-cbow, w-skipgram, w-lab — one engine =================
   Self-contained (needs nothing from the house runtime). The ENGINE block below is pure maths with no DOM, so the
   Node checks can load exactly the code the page runs. Exposes window.U16W2V = {engine, window, cbow, skipgram, lab}. */
(function(){
'use strict';
/*@ENGINE*/
const W2VE=(function(){
/* ---------- small maths ---------- */
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const sig=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
const dot=(a,b)=>{ let s=0; for(let i=0;i<a.length;i++) s+=a[i]*b[i]; return s; };
function softmax(z){ let m=-Infinity; for(const v of z) if(v>m) m=v; const e=z.map(v=>Math.exp(v-m)); let s=0; for(const v of e) s+=v; return e.map(v=>v/s); }
function cos(a,b){ let s=0,na=0,nb=0; for(let i=0;i<a.length;i++){ s+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; } return (na<1e-30||nb<1e-30)?0:s/Math.sqrt(na*nb); }

/* ---------- the toy machines of s9 (CBOW) and s10 (skip-gram): full softmax, d = 2, every number exact ---------- */
/* V = 5 words, the unit's hand-made vectors (input table W_in = rows v, output table W_out = rows u) */
const TOY={vocab:['we','drink','chai','daily','cricket'],
  vin:[[0,1],[1,0],[1,1],[0,1],[-1,0]],
  vout:[[0,0],[1,0],[1,1],[0,1],[-1,-1]],
  sentence:['we','drink','chai','daily'], centre:2};
/* the "window 2" committee: a longer sentence brings two more neighbours (and two more words into the vocabulary).
   all = (2, −1) and after = (−1, 2) are chosen so that the average of the four is still h = (0.5, 0.5). */
const TOY2={vocab:['we','all','drink','chai','daily','after','cricket'],
  vin:[[0,1],[2,-1],[1,0],[1,1],[0,1],[-1,2],[-1,0]],
  vout:[[0,0],[-1,0],[1,0],[1,1],[0,1],[0,-1],[-1,-1]],
  sentence:['we','all','drink','chai','daily','after','cricket'], centre:3};
const cloneM=M=>({vocab:M.vocab.slice(),vin:M.vin.map(v=>v.slice()),vout:M.vout.map(u=>u.slice())});
/* one CBOW round: the committee ctx (word indices) fills in the blank `target`; step size eta */
function cbowRound(M,ctx,target,eta){ const n=ctx.length, d=M.vin[0].length;
  const h=new Array(d).fill(0); ctx.forEach(i=>{ for(let j=0;j<d;j++) h[j]+=M.vin[i][j]/n; });
  const scores=M.vout.map(u=>dot(u,h)), p=softmax(scores), loss=-Math.log(p[target]);
  const e=p.map((x,i)=>x-(i===target?1:0));
  const EH=new Array(d).fill(0); e.forEach((ew,i)=>{ for(let j=0;j<d;j++) EH[j]+=ew*M.vout[i][j]; });   /* blame reaching h (old output vectors) */
  const share=1/n, dv=EH.map(x=>-eta*x*share);                                                  /* each member's move */
  const next=cloneM(M); next.vout=M.vout.map((u,i)=>u.map((x,j)=>x-eta*e[i]*h[j]));
  ctx.forEach(i=>{ for(let j=0;j<d;j++) next.vin[i][j]+=dv[j]; });
  const h2=new Array(d).fill(0); ctx.forEach(i=>{ for(let j=0;j<d;j++) h2[j]+=next.vin[i][j]/n; });
  const s2=next.vout.map(u=>dot(u,h2)), p2=softmax(s2);
  return {kind:'cbow',ctx:ctx.slice(),target,eta,h,scores,p,loss,e,EH,share,dv,next,after:{h:h2,scores:s2,p:p2,loss:-Math.log(p2[target])}}; }
/* one skip-gram round: the centre word guesses every word in `targets`; the same softmax serves every slot */
function sgRound(M,centre,targets,eta){ const d=M.vin[0].length, h=M.vin[centre].slice();
  const scores=M.vout.map(u=>dot(u,h)), p=softmax(scores);
  const slotLoss=targets.map(t=>-Math.log(p[t])), loss=slotLoss.reduce((a,b)=>a+b,0);
  const slotErr=targets.map(t=>p.map((x,i)=>x-(i===t?1:0)));
  const E=p.map((_,i)=>slotErr.reduce((a,er)=>a+er[i],0));                                       /* errors of all slots, summed */
  const EH=new Array(d).fill(0); E.forEach((ew,i)=>{ for(let j=0;j<d;j++) EH[j]+=ew*M.vout[i][j]; });
  const next=cloneM(M); next.vout=M.vout.map((u,i)=>u.map((x,j)=>x-eta*E[i]*h[j]));
  next.vin[centre]=h.map((x,j)=>x-eta*EH[j]);
  const h2=next.vin[centre], s2=next.vout.map(u=>dot(u,h2)), p2=softmax(s2);
  return {kind:'sg',centre,targets:targets.slice(),eta,h,scores,p,slotLoss,loss,slotErr,E,EH,next,
    after:{h:h2.slice(),scores:s2,p:p2,slotLoss:targets.map(t=>-Math.log(p2[t])),loss:targets.reduce((a,t)=>a-Math.log(p2[t]),0)}}; }

/* ---------- the sliding window of s8: which examples each position makes ---------- */
function windowStops(tokens,C){ return tokens.map((w,i)=>{ const left=[], right=[];
  for(let j=Math.max(0,i-C);j<i;j++) left.push(j); for(let j=i+1;j<=Math.min(tokens.length-1,i+C);j++) right.push(j);
  return {i,centre:w,left,right,n:left.length+right.length}; }); }

/* ---------- the lab: a small made-up text (Indian everyday life; four topics + the little words) ---------- */
const TEXT=`i drink hot chai every morning
we drink sweet chai at the stall
a cup of hot chai
my mother makes chai with milk
we drink chai in the evening
the chai is hot and sweet
a cup of chai at the stall
i drink chai with milk
we share a cup of chai
the chai at the stall is sweet
i drink hot coffee every morning
a cup of coffee with milk
we drink cold coffee in summer
the coffee is hot and strong
i drink coffee in the evening
a glass of sweet lassi
we drink cold lassi in summer
the lassi is cold and sweet
i drink lassi with lunch
a cup of hot tea
we drink tea in the evening
the tea is hot and sweet
i drink tea with milk
a glass of cold milk
i drink milk every morning
we boil milk for chai
the milk is hot
i drink kadak chai every morning
a cup of kadak chai at the stall
we drink kadak tea in the evening
he hits the ball for six
he bowls a fast ball
we play cricket with a new bat
the ball hits the wicket
he takes a wicket in the last over
the last over is tense
she hits a six in the last over
my bat is heavy
i hit the ball with my bat
he loses his wicket
he hits a big six
we need a six in this over
he bowls a good over
the ball goes for six
the wicket falls in the first over
i hold the bat
we play cricket in the park
a new ball for the match
the bat hits the ball
she bowls the last over
he takes a wicket with the new ball
we need a wicket in this over
he hits a six with his new bat
he bowls a googly
the googly hits the wicket
she bowls a googly in the last over
we wait for the train at the station
the train is late
i buy a ticket at the station
the bus is full in the morning
we take the bus to the city
my ticket is in my bag
the train leaves from platform one
we wait on the platform
the station is crowded
i take the train to work
the bus stops at the station
show your ticket on the bus
the platform is crowded
we run to the platform
the train is on platform two
i buy a train ticket
the bus ticket is cheap
we reach the station early
the train reaches the station
we take the train to the city
i wait for the bus
a ticket for the bus
the bus is late in the evening
we buy a ticket for the train
the train leaves the platform
my mother makes hot roti
we eat roti with dal
dal and rice for lunch
the sabzi is spicy
i eat rice with dal
we eat sabzi with roti
the dal is hot and tasty
i cook rice for dinner
a plate of rice and dal
my mother makes sabzi for lunch
we eat roti at dinner
the rice is soft
fresh sabzi for dinner
i eat dal with rice
a plate of roti and sabzi
we cook dal for lunch
the roti is soft and hot
i eat sabzi at lunch
we eat rice and sabzi at night
a plate of hot roti
the dal is ready for lunch`;
/* our labels — the models never see them; they only colour the map and score the result */
const TOPICS={drinks:['chai','coffee','lassi','tea','milk'],cricket:['bat','ball','wicket','over','six'],travel:['train','bus','ticket','station','platform'],food:['roti','dal','rice','sabzi']};
const RARE={kadak:'drinks',googly:'cricket'};
const LITTLE=['the','a','is','we','i','in','at'];
function buildCorpus(){ const sents=TEXT.split('\n').map(s=>s.trim().split(/\s+/)); const first={}, cnt={};
  sents.forEach(s=>s.forEach(w=>{ if(!(w in cnt)){ cnt[w]=0; first[w]=Object.keys(first).length; } cnt[w]++; }));
  const vocab=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]||first[a]-first[b]), idx={}; vocab.forEach((w,i)=>idx[w]=i);
  const count=vocab.map(w=>cnt[w]), N=count.reduce((a,b)=>a+b,0);
  const pw=count.map(c=>Math.pow(c,0.75)), Z=pw.reduce((a,b)=>a+b,0), cdf=new Float64Array(vocab.length); let acc=0; pw.forEach((p,i)=>{ acc+=p/Z; cdf[i]=acc; }); cdf[cdf.length-1]=1;
  const topicOf={}; Object.keys(TOPICS).forEach(t=>TOPICS[t].forEach(w=>topicOf[w]=t)); Object.keys(RARE).forEach(w=>topicOf[w]=RARE[w]); LITTLE.forEach(w=>topicOf[w]='little');
  const labelled=[].concat(...Object.values(TOPICS),Object.keys(RARE),LITTLE);
  return {sents,S:sents.map(s=>Int32Array.from(s.map(w=>idx[w]))),vocab,idx,count,N,cdf,noise:pw.map(p=>p/Z),topicOf,labelled,tokens:N}; }
const CORP=buildCorpus();
function sampleNoise(r){ const cdf=CORP.cdf, x=r(); let lo=0,hi=cdf.length-1; while(lo<hi){ const m=(lo+hi)>>1; if(cdf[m]<x) lo=m+1; else hi=m; } return lo; }
/* subsampling (s12): keep each copy of a word with frequency f with probability √(t/f) (always, when f ≤ t).
   The paper's t = 10⁻⁵ is for billions of words; for our 582-word text we use t = 0.02, so only the little words thin out. */
const SUB_T=0.02;
const keepProb=w=>{ const f=CORP.count[w]/CORP.N; return f<=SUB_T?1:Math.sqrt(SUB_T/f); };

const LAB_DEFAULTS={seed:1,C:2,k:5,d:8,eta:0.1,sub:false,passes:40};
function makeLab(opts){ const o=Object.assign({},LAB_DEFAULTS,opts||{}), V=CORP.vocab.length, d=o.d;
  const rI=mulberry(o.seed*9973+11), init=new Float64Array(V*d); for(let i=0;i<V*d;i++) init[i]=(rI()-0.5)/d;
  const model=kind=>({kind,vin:Float64Array.from(init),vout:new Float64Array(V*d),r:mulberry(o.seed*7919+(kind==='cbow'?1:2)),
    preds:0,dots:0,lossSum:0,lossN:0,passLoss:0,passN:0,ema:null});
  const L={o,V,d,cbow:model('cbow'),sg:model('sg'),dataR:mulberry(o.seed*104729+3),pass:0,q:-1,order:null,cur:null,pos:0,sentences:0,positions:0,done:false,hist:[]};
  newOrder(L); L.hist.push(snap(L)); return L; }
function newOrder(L){ const n=CORP.S.length, a=new Int32Array(n); for(let i=0;i<n;i++) a[i]=i;
  for(let i=n-1;i>0;i--){ const j=Math.floor(L.dataR()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } L.order=a; L.q=-1; }
function progress(L){ return Math.min(1,(L.pass+Math.max(0,L.q)/CORP.S.length)/L.o.passes); }
function alphaNow(L){ return L.o.eta*Math.max(1e-4,1-progress(L)); }
/* move to the next sentence (reshuffling at the end of a pass); applies subsampling once per visit */
function nextSentence(L){ if(L.done) return false; L.q++;
  if(L.q>=CORP.S.length){ L.pass++; L.cbow.passLoss=0; L.cbow.passN=0; L.sg.passLoss=0; L.sg.passN=0; if(L.pass>=L.o.passes){ L.done=true; L.cur=null; return false; } newOrder(L); L.q=0; }
  const si=L.order[L.q], s=CORP.S[si], keep=[];
  for(let j=0;j<s.length;j++){ if(!L.o.sub||L.dataR()<keepProb(s[j])) keep.push(j); }
  L.cur={si,tokens:Array.from(keep,j=>s[j]),orig:keep,full:Array.from(s),alpha:alphaNow(L)}; L.pos=0; return true; }
/* one prediction with negative sampling: input h, true output t, k noise words. Updates the output vectors,
   adds the blame for h into eh, returns the loss. Records what happened when `rec` is given. */
function nsPredict(m,h,t,k,alpha,d,eh,rec){ const vout=m.vout; let loss=0;
  for(let n=0;n<=k;n++){ let w,label; if(n===0){ w=t; label=1; } else { w=sampleNoise(m.r); if(w===t){ if(rec) rec.skipped++; continue; } label=0; }
    const o=w*d; let f=0; for(let j=0;j<d;j++) f+=h[j]*vout[o+j]; m.dots++;
    const s=sig(f); loss+=label?-Math.log(Math.max(s,1e-300)):-Math.log(Math.max(1-s,1e-300));
    const g=alpha*(label-s); for(let j=0;j<d;j++){ eh[j]+=g*vout[o+j]; vout[o+j]+=g*h[j]; }
    if(rec) (label?rec.pos=w:rec.negs.push(w)); }
  m.preds++; m.lossSum+=loss; m.lossN++; m.passLoss+=loss; m.passN++; m.ema=m.ema==null?loss:m.ema*0.995+loss*0.005; return loss; }
/* train ONE position of the current sentence in both models (the same text for both). Returns a record when asked. */
function stepPosition(L,record){ if(L.done) return null; while(!L.cur||L.pos>=L.cur.tokens.length){ if(!nextSentence(L)) return null; }
  const s=L.cur.tokens, i=L.pos, C=L.o.C, k=L.o.k, d=L.d, a=L.cur.alpha; L.pos++; L.positions++;
  const ctx=[]; for(let j=Math.max(0,i-C);j<=Math.min(s.length-1,i+C);j++) if(j!==i) ctx.push(j);
  const rec=record?{sentence:s.slice(),i,centre:s[i],ctx:ctx.map(j=>s[j]),ctxPos:ctx.slice(),alpha:a,cbow:null,sg:[]}:null;
  if(ctx.length){ const h=new Float64Array(d), eh=new Float64Array(d);
    /* CBOW: the committee's average predicts the centre; the blame is split equally among the members */
    { const m=L.cbow, n=ctx.length; for(const j of ctx){ const o=s[j]*d; for(let q=0;q<d;q++) h[q]+=m.vin[o+q]/n; }
      const r=rec?{pos:-1,negs:[],skipped:0}:null; const loss=nsPredict(m,h,s[i],k,a,d,eh,r);
      for(const j of ctx){ const o=s[j]*d; for(let q=0;q<d;q++) m.vin[o+q]+=eh[q]/n; }
      if(rec){ r.loss=loss; rec.cbow=r; } }
    /* skip-gram: the centre alone predicts every neighbour, one at a time, and keeps each blame in full */
    { const m=L.sg, o=s[i]*d; for(const j of ctx){ for(let q=0;q<d;q++){ h[q]=m.vin[o+q]; eh[q]=0; }
        const r=rec?{pos:-1,negs:[],skipped:0,target:s[j]}:null; const loss=nsPredict(m,h,s[j],k,a,d,eh,r);
        for(let q=0;q<d;q++) m.vin[o+q]+=eh[q]; if(rec){ r.loss=loss; rec.sg.push(r); } } } }
  if(L.pos>=L.cur.tokens.length){ L.sentences++; if(L.sentences%26===0) L.hist.push(snap(L)); }
  return rec||true; }
function stepSentence(L){ if(L.done) return false; if(!L.cur||L.pos>=L.cur.tokens.length){ if(!nextSentence(L)) return false; }
  while(L.cur&&L.pos<L.cur.tokens.length) stepPosition(L,false); return true; }
/* train whole sentences until `budget` positions are done (the frame loop uses this) */
function runPositions(L,budget){ let n=0; while(n<budget&&!L.done){ if(!stepPosition(L,false)) break; n++; } if(L.done&&(!L.hist.length||L.hist[L.hist.length-1].x<L.o.passes)) L.hist.push(snap(L)); return n; }
function finish(L){ while(!L.done) runPositions(L,1e6); return L; }
const vecOf=(m,w,d)=>Array.from(m.vin.subarray(w*d,w*d+d));
function topicScore(L,m){ const words=[]; Object.keys(TOPICS).forEach(t=>TOPICS[t].forEach(w=>words.push([t,vecOf(m,CORP.idx[w],L.d)])));
  let a=0,na=0,b=0,nb=0; for(let i=0;i<words.length;i++) for(let j=i+1;j<words.length;j++){ const c=cos(words[i][1],words[j][1]); if(words[i][0]===words[j][0]){ a+=c; na++; } else { b+=c; nb++; } }
  return {score:a/na-b/nb,within:a/na,between:b/nb}; }
/* how firmly one word sits in its topic: mean cosine to its topic's words − mean cosine to the other topics' words */
function wordFit(L,m,w){ const t=CORP.topicOf[w], v=vecOf(m,CORP.idx[w],L.d); let a=0,na=0,b=0,nb=0;
  Object.keys(TOPICS).forEach(tt=>TOPICS[tt].forEach(x=>{ if(x===w) return; const c=cos(v,vecOf(m,CORP.idx[x],L.d)); if(tt===t){ a+=c; na++; } else { b+=c; nb++; } }));
  return {fit:a/na-b/nb,own:a/na,other:b/nb}; }
function neighbours(L,m,w,n){ const v=vecOf(m,CORP.idx[w],L.d);
  return CORP.labelled.filter(x=>x!==w).map(x=>[x,cos(v,vecOf(m,CORP.idx[x],L.d))]).sort((p,q)=>q[1]-p[1]).slice(0,n); }
function snap(L){ const f=m=>({score:topicScore(L,m).score,loss:m.passN?m.passLoss/m.passN:(m.lossN?m.lossSum/m.lossN:null),dots:m.dots,preds:m.preds});
  return {x:L.pass+(L.done?0:Math.max(0,L.q+1)/CORP.S.length),cbow:f(L.cbow),sg:f(L.sg)}; }
/* symmetric eigen-decomposition by cyclic Jacobi rotations (exact for our 8 × 8 covariance): eigenvalues descending, vectors as columns */
function symEig(A0){ const n=A0.length, A=A0.map(r=>r.slice()), V=A.map((_,i)=>A.map((_,j)=>i===j?1:0));
  for(let sweep=0;sweep<60;sweep++){ let off=0; for(let p=0;p<n;p++) for(let q=p+1;q<n;q++) off+=A[p][q]*A[p][q]; if(off<1e-26) break;
    for(let p=0;p<n;p++) for(let q=p+1;q<n;q++){ if(Math.abs(A[p][q])<1e-300) continue;
      const th=(A[q][q]-A[p][p])/(2*A[p][q]), t=(th>=0?1:-1)/(Math.abs(th)+Math.sqrt(th*th+1)), c=1/Math.sqrt(t*t+1), s=t*c;
      for(let k=0;k<n;k++){ const akp=A[k][p], akq=A[k][q]; A[k][p]=c*akp-s*akq; A[k][q]=s*akp+c*akq; }
      for(let k=0;k<n;k++){ const apk=A[p][k], aqk=A[q][k]; A[p][k]=c*apk-s*aqk; A[q][k]=s*apk+c*aqk; }
      for(let k=0;k<n;k++){ const vkp=V[k][p], vkq=V[k][q]; V[k][p]=c*vkp-s*vkq; V[k][q]=s*vkp+c*vkq; } } }
  const idx=A.map((_,i)=>i).sort((i,j)=>A[j][j]-A[i][i]); return {vals:idx.map(i=>A[i][i]),vecs:idx.map(i=>V.map(r=>r[i]))}; }
/* the flat shadow for the map: PCA of the length-1 vectors of the labelled words (the top two directions).
   `kept` = the share of the spread (variance) that the two directions keep. */
function shadowAxes(L,m){ const d=L.d, rows=CORP.labelled.map(w=>{ const v=vecOf(m,CORP.idx[w],d), n=Math.hypot(...v)||1; return v.map(x=>x/n); });
  const mu=new Array(d).fill(0); rows.forEach(r=>r.forEach((x,j)=>mu[j]+=x/rows.length));
  const Cv=Array.from({length:d},()=>new Array(d).fill(0)); rows.forEach(r=>{ for(let i=0;i<d;i++) for(let j=0;j<d;j++) Cv[i][j]+=(r[i]-mu[i])*(r[j]-mu[j])/rows.length; });
  const {vals,vecs}=symEig(Cv), tot=vals.reduce((a,b)=>a+Math.max(0,b),0);
  return {mu,e1:vecs[0],e2:vecs[1],vals,kept:tot>0?(Math.max(0,vals[0])+Math.max(0,vals[1]))/tot:1}; }
function project(L,m,ax){ const d=L.d; return CORP.vocab.map((w,i)=>{ const v=vecOf(m,i,d), n=Math.hypot(...v)||1, u=v.map((x,j)=>x/n-ax.mu[j]); return [dot(u,ax.e1),dot(u,ax.e2)]; }); }

return {mulberry,sig,dot,softmax,cos,TOY,TOY2,cloneM,cbowRound,sgRound,windowStops,
  TEXT,TOPICS,RARE,LITTLE,CORP,SUB_T,keepProb,sampleNoise,LAB_DEFAULTS,makeLab,nextSentence,stepPosition,stepSentence,runPositions,finish,alphaNow,progress,
  vecOf,topicScore,wordFit,neighbours,snap,symEig,shadowAxes,project};
})();
/*@END-ENGINE*/
if(typeof document==='undefined') return;
/*@UI*/
/* ================= shared UI helpers (DOM) ================= */
const E=W2VE;
const RMo=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const r2=v=>Math.round(v*100)/100;
function S(tag,a,p){ const n=document.createElementNS(NS,tag); if(a) for(const k in a) if(a[k]!=null) n.setAttribute(k,a[k]); if(p) p.appendChild(n); return n; }
function Tx(p,x,y,s,a){ const t=S('text',Object.assign({x:r2(x),y:r2(y)},a||{}),p); t.textContent=s; return t; }
const MI='−', nm=s=>String(s).replace(/-/g,MI);
/* numbers: integers bare, otherwise 4 decimals with trailing zeros trimmed; always a real minus sign */
function N(v,d){ if(v==null||isNaN(v)) return '—'; if(!isFinite(v)) return v>0?'∞':MI+'∞'; d=d==null?4:d; if(Math.abs(v)<0.5*Math.pow(10,-d)) return '0';
  let s=v.toFixed(d); if(s.indexOf('.')>=0) s=s.replace(/0+$/,'').replace(/\.$/,''); if(s==='-0') s='0'; return nm(s); }
const NF=(v,d)=>nm((+v).toFixed(d));                         /* fixed decimals (bars, tables) */
const V2=(v,d)=>'('+v.map(x=>N(x,d)).join(', ')+')';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const commas=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const now=()=>(window.performance&&performance.now)?performance.now():Date.now();
/* one tween at a time per owner; reduced motion jumps to the end */
function tween(owner,dur,step,done){ if(owner._tw) owner._tw.stop(); if(RMo||dur<=0){ step(1); done&&done(); return {stop(){}}; }
  let raf=0, dead=false; const t0=now(); const tick=()=>{ if(dead) return; const t=Math.min(1,(now()-t0)/dur), e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2; step(e); if(t<1) raf=requestAnimationFrame(tick); else { owner._tw=null; done&&done(); } };
  raf=requestAnimationFrame(tick); const h={stop(){ dead=true; cancelAnimationFrame(raf); owner._tw=null; }}; owner._tw=h; return h; }
/* colours for canvas drawing (SVG uses the CSS variables directly) */
let PAL={};
function readPal(){ const cs=getComputedStyle(document.documentElement), g=(n,f)=>(cs.getPropertyValue('--'+n).trim()||f);
  PAL={s1:g('s1','#5b93ff'),s2:g('s2','#ff7b4a'),s3:g('s3','#35d9a4'),s4:g('s4','#ffc857'),s5:g('s5','#ff6cb0'),s6:g('s6','#3fd8f6'),s7:g('s7','#a493ff'),crit:g('critical','#ff6470'),
    ink:g('ink','#eef1f8'),ink2:g('ink-2','#b4bdd2'),mut:g('ink-muted','#7d879d'),grid:g('grid','#1c2438'),axis:g('axis','#2b3550'),surf:g('surface','#0e1320'),surf2:g('surface-2','#141b2d'),page:g('page','#070a12'),
    ui:(g('ui','system-ui,sans-serif')),mono:(g('mono','ui-monospace,monospace'))}; PAL.light=document.documentElement.getAttribute('data-theme')==='light'; }
const RGB={};
function rgb(c){ if(RGB[c]) return RGB[c]; let s=(c||'').trim(), out=[128,128,128]; if(s[0]==='#'){ if(s.length===4) s='#'+s[1]+s[1]+s[2]+s[2]+s[3]+s[3]; const n=parseInt(s.slice(1,7),16); out=[n>>16&255,n>>8&255,n&255]; } else { const m=s.match(/[\d.]+/g); if(m) out=[+m[0],+m[1],+m[2]]; } return RGB[c]=out; }
const RGBA=(c,a)=>{ const r=rgb(c); return 'rgba('+r[0]+','+r[1]+','+r[2]+','+a+')'; };
function fitCanvas(cv,h){ const pe=cv.parentElement, cs=getComputedStyle(pe), w=Math.max(160,Math.floor(pe.clientWidth-parseFloat(cs.paddingLeft||0)-parseFloat(cs.paddingRight||0))); const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.style.height=h+'px'; const W=Math.round(w*dpr), H=Math.round(h*dpr); if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
  const ctx=cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); return {ctx,w,h}; }
function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
/* re-render hooks for theme flips and resizes */
const REDRAW=[];
function onRedraw(fn){ REDRAW.push(fn); }
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>setTimeout(()=>{ readPal(); REDRAW.forEach(f=>f('fonts')); },30));
new MutationObserver(()=>{ readPal(); REDRAW.forEach(f=>f('theme')); }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
if(window.matchMedia){ const mq=matchMedia('(prefers-color-scheme: dark)'); if(mq.addEventListener) mq.addEventListener('change',()=>{ readPal(); REDRAW.forEach(f=>f('theme')); }); }
function watchWidth(root,fn){ let lw=0; const go=()=>{ const w=root.clientWidth; if(Math.abs(w-lw)>2){ lw=w; fn(w); } };
  if(window.ResizeObserver) new ResizeObserver(go).observe(root); else addEventListener('resize',go); }
function pressSeg(host,v){ host.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===String(v)?'true':'false')); }
function fillRange(r){ if(!r) return; const lo=+r.min, hi=+r.max, v=+r.value; r.style.setProperty('--fill',((v-lo)/(hi-lo)*100).toFixed(1)+'%'); }
/* an arrow in SVG: shaft + head, with an optional soft halo underneath */
function arrow(p,x1,y1,x2,y2,col,w,o){ o=o||{}; const g=S('g',{class:o.cls||null,opacity:o.op==null?null:o.op},p); const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy);
  if(L<1){ S('circle',{cx:r2(x2),cy:r2(y2),r:Math.max(2.5,w*1.2),fill:col},g); return g; }
  const hl=Math.min(o.head||10,L*.5), hw=hl*.52, ux=dx/L, uy=dy/L, bx=x2-ux*hl*.85, by=y2-uy*hl*.85;
  if(o.halo!==false) S('line',{x1:r2(x1),y1:r2(y1),x2:r2(bx),y2:r2(by),stroke:col,'stroke-width':w*3.4,'stroke-linecap':'round',class:'w2-halo'},g);
  S('line',{x1:r2(x1),y1:r2(y1),x2:r2(bx),y2:r2(by),stroke:col,'stroke-width':w,'stroke-linecap':'round','stroke-dasharray':o.dash||null},g);
  const hx=x2-ux*hl, hy=y2-uy*hl; S('path',{d:`M${r2(x2)},${r2(y2)}L${r2(hx-uy*hw)},${r2(hy+ux*hw)}L${r2(hx+uy*hw)},${r2(hy-ux*hw)}Z`,fill:col},g); return g; }

readPal();
/* ================= w-window · the sliding window (s8) ================= */
const WIN=(function(){
  const root=$('w-window'); if(!root) return null;
  const svg=$('w2w-svg'), nowBox=$('w2w-now');
  const SENTS=['we drink hot chai every morning','he bowls a googly in the last over','we wait for the train at the station every morning'];
  const st={si:0,C:2,mode:'cbow',cur:0,at:0,done:[],playing:false,timer:0,geo:null};
  const toks=()=>SENTS[st.si].split(' ');
  const stops=()=>E.windowStops(toks(),st.C);
  function restStop(){ const t=toks(), i=t.indexOf('chai'); if(i>=0) return i; const S0=stops(); let b=0; S0.forEach((s,k)=>{ if(s.n>S0[b].n) b=k; }); return b; }
  function rest(){ st.done=toks().map(()=>true); st.at=toks().length; st.cur=restStop(); }
  function counts(){ const S0=stops(); let cb=0, sg=0; S0.forEach((s,i)=>{ if(st.done[i]&&s.n>0){ cb++; sg+=s.n; } }); return {cbow:cb,sg}; }

  /* ---------- the picture ---------- */
  function render(){ const W=Math.max(280,Math.round(svg.parentElement.clientWidth)), t=toks(), n=t.length, S0=stops(), C=st.C, cur=S0[st.cur];
    svg.innerHTML=''; const geo={tiles:[],arcs:[],frame:null,squares:[],layout:'',labels:[]};
    const padL=W>=560?96:78, padR=10, sw=(W-padL-padR)/n, rowLayout=sw>=64;
    const lo=Math.max(0,st.cur-C), hi=Math.min(n-1,st.cur+C), isCtx=j=>j!==st.cur&&j>=lo&&j<=hi, cb=st.mode==='cbow';
    const cCol=cb?'var(--s3)':'var(--s4)';
    const defs=S('defs',{},svg); const gid='w2w-glow'; const f=S('filter',{id:gid,x:'-30%',y:'-30%',width:'160%',height:'160%'},defs); S('feGaussianBlur',{stdDeviation:3.2},f);
    let H;
    if(rowLayout){ geo.layout='row';
      const arcH=16+14*C, top=12, ty=top+arcH, th=40, fs=sw<84?12:13.5, per=Math.max(2,Math.floor((sw-12)/13)), sgRows=Math.ceil(2*C/per);
      const yNum=ty+th+15, yCb=yNum+14, ySg=yCb+22; H=ySg+sgRows*13+12;
      const X=i=>padL+i*sw+4, TW=sw-8;
      /* row labels with running totals */
      const cnt=counts();
      Tx(svg,padL-12,yCb+10,'CBOW '+cnt.cbow,{'text-anchor':'end','font-size':12,'font-weight':750,fill:'var(--s6)',class:'w2w-lab'});
      Tx(svg,padL-12,ySg+10,'skip-gram '+cnt.sg,{'text-anchor':'end','font-size':12,'font-weight':750,fill:'var(--s5)',class:'w2w-lab'});
      Tx(svg,padL-12,yNum,'stop',{'text-anchor':'end','font-size':11,'font-weight':600,fill:'var(--ink-muted)'});
      /* the window frame (drawn under the tiles) */
      const fx=X(lo)-5, fw=X(hi)+TW+5-fx; geo.frame={x:fx,y:ty-6,w:fw,h:th+12,lo,hi};
      S('rect',{x:r2(fx),y:ty-6,width:r2(fw),height:th+12,rx:13,fill:'var(--s4)','fill-opacity':.07,stroke:'var(--s4)','stroke-width':2,class:'w2w-frame'},svg);
      if(st.cur-C<0) S('path',{d:`M${r2(fx-2)},${ty-6} q-10,${(th+12)/2} 0,${th+12}`,fill:'none',stroke:'var(--s4)','stroke-width':1.6,'stroke-dasharray':'3 4',opacity:.8},svg);
      if(st.cur+C>n-1) S('path',{d:`M${r2(fx+fw+2)},${ty-6} q10,${(th+12)/2} 0,${th+12}`,fill:'none',stroke:'var(--s4)','stroke-width':1.6,'stroke-dasharray':'3 4',opacity:.8},svg);
      /* arcs: neighbours → middle (CBOW) or middle → neighbours (skip-gram) */
      const ag=S('g',{},svg);
      const ctxJ=[]; for(let j=lo;j<=hi;j++) if(j!==st.cur) ctxJ.push(j);
      const spc=Math.min(13,(TW/2-10)/C);
      ctxJ.forEach(j=>{ const d=Math.abs(j-st.cur), side=j<st.cur?-1:1, hA=12+13*d;
        const xc=X(st.cur)+TW/2+side*(5+spc*(d-.5)), xj=X(j)+TW/2, y0=ty-2;
        const [xa,xb]=cb?[xj,xc]:[xc,xj];
        const path=`M${r2(xa)},${y0} C${r2(xa)},${y0-hA} ${r2(xb)},${y0-hA} ${r2(xb)},${y0-3}`;
        S('path',{d:path,fill:'none',stroke:cCol,'stroke-width':5,class:'w2-halo'},ag);
        S('path',{d:path,fill:'none',stroke:cCol,'stroke-width':1.9},ag);
        S('path',{d:path,fill:'none',stroke:'var(--ink)','stroke-width':1.6,'stroke-dasharray':'2 12','stroke-linecap':'round',class:'w2-flow'},ag);
        S('path',{d:`M${r2(xb)},${y0} l-4.5,-8 l9,0 z`,fill:cCol},ag);
        geo.arcs.push({from:cb?j:st.cur,to:cb?st.cur:j,x1:xa,x2:xb,top:y0-hA*0.75}); });
      /* tiles */
      t.forEach((w,i)=>{ const x=X(i), m=i===st.cur, c=isCtx(i);
        const g=S('g',{class:'w2w-tile','data-i':i,style:'cursor:pointer'},svg);
        S('rect',{x:r2(x),y:ty,width:r2(TW),height:th,rx:9,fill:m?'var(--s4)':c?'var(--s3)':'var(--surface-2)','fill-opacity':m?.22:c?.16:.9,stroke:m?'var(--s4)':c?'var(--s3)':'var(--line)','stroke-width':m||c?1.6:1},g);
        const tt=Tx(g,x+TW/2,ty+th/2+fs*.36,w,{'text-anchor':'middle','font-size':fs,'font-weight':m?800:650,fill:m||c?'var(--ink)':'var(--ink-2)',class:'w2w-word'});
        if((cb&&m)||(!cb&&c)) { const bx=x+TW-7, by=ty+1; S('circle',{cx:r2(bx),cy:by,r:8,fill:cb?'var(--s4)':'var(--s3)'},g); Tx(g,bx,by+4,'?',{'text-anchor':'middle','font-size':11,'font-weight':900,fill:'var(--page)'}); }
        Tx(svg,x+TW/2,yNum,String(i+1),{'text-anchor':'middle','font-size':11,'font-weight':m?800:600,fill:m?'var(--s4)':'var(--ink-muted)'});
        geo.tiles.push({i,w,x,y:ty,w_:TW,h:th});
        /* the tally under the word: one CBOW square, one skip-gram square per pair */
        const s=S0[i], on=st.done[i], cx=x+TW/2;
        if(s.n>0){ S('rect',{x:r2(cx-6),y:yCb,width:12,height:12,rx:3,fill:on?'var(--s6)':'none',stroke:'var(--s6)','stroke-width':1.2,opacity:on?1:.35},svg); geo.squares.push({i,k:'cbow',on}); }
        for(let q=0;q<s.n;q++){ const row=Math.floor(q/per), col=q%per, inRow=Math.min(per,s.n-row*per), x0=cx-(inRow*13-3)/2;
          S('rect',{x:r2(x0+col*13),y:ySg+row*13,width:10,height:10,rx:2.5,fill:on?'var(--s5)':'none',stroke:'var(--s5)','stroke-width':1.1,opacity:on?1:.35},svg); geo.squares.push({i,k:'sg',on}); } });
    } else { geo.layout='col';
      const rowH=31, arcW=18+11*C, top=44, tw=Math.min(128,Math.max(84,W*.34)), xT=24+arcW, xCb=xT+tw+22, xSg=xCb+26;
      const per=Math.max(4,Math.floor((W-xSg-6)/13)); H=top+n*rowH+10;
      const Y=i=>top+i*rowH, th=rowH-7;
      const cnt=counts();
      Tx(svg,xCb-2,top-24,'CBOW '+cnt.cbow,{'text-anchor':'start','font-size':11,'font-weight':750,fill:'var(--s6)',class:'w2w-lab'});
      Tx(svg,xSg,top-9,'skip-gram '+cnt.sg,{'text-anchor':'start','font-size':11,'font-weight':750,fill:'var(--s5)',class:'w2w-lab'});
      const fy=Y(lo)-4, fh=Y(hi)+th+4-fy; geo.frame={x:xT-5,y:fy,w:tw+10,h:fh,lo,hi};
      S('rect',{x:xT-5,y:r2(fy),width:tw+10,height:r2(fh),rx:11,fill:'var(--s4)','fill-opacity':.07,stroke:'var(--s4)','stroke-width':2,class:'w2w-frame'},svg);
      const ag=S('g',{},svg);
      for(let j=lo;j<=hi;j++){ if(j===st.cur) continue; const d=Math.abs(j-st.cur), side=j<st.cur?-1:1, wA=10+11*d, x0=xT-2;
        const yc=Y(st.cur)+th/2+side*(2+Math.min(3.2,(th/2-4)/C)*(d-.5)), yj=Y(j)+th/2, [ya,yb]=cb?[yj,yc]:[yc,yj];
        const path=`M${x0},${r2(ya)} C${x0-wA},${r2(ya)} ${x0-wA},${r2(yb)} ${x0-3},${r2(yb)}`;
        S('path',{d:path,fill:'none',stroke:cCol,'stroke-width':5,class:'w2-halo'},ag);
        S('path',{d:path,fill:'none',stroke:cCol,'stroke-width':1.8},ag);
        S('path',{d:path,fill:'none',stroke:'var(--ink)','stroke-width':1.5,'stroke-dasharray':'2 11','stroke-linecap':'round',class:'w2-flow'},ag);
        S('path',{d:`M${x0},${r2(yb)} l-8,-4.5 l0,9 z`,fill:cCol},ag); geo.arcs.push({from:cb?j:st.cur,to:cb?st.cur:j}); }
      t.forEach((w,i)=>{ const y=Y(i), m=i===st.cur, c=isCtx(i);
        const g=S('g',{class:'w2w-tile','data-i':i,style:'cursor:pointer'},svg);
        S('rect',{x:xT,y,width:r2(tw),height:th,rx:8,fill:m?'var(--s4)':c?'var(--s3)':'var(--surface-2)','fill-opacity':m?.22:c?.16:.9,stroke:m?'var(--s4)':c?'var(--s3)':'var(--line)','stroke-width':m||c?1.5:1},g);
        Tx(g,xT+tw/2,y+th/2+4.4,w,{'text-anchor':'middle','font-size':12.5,'font-weight':m?800:650,fill:m||c?'var(--ink)':'var(--ink-2)',class:'w2w-word'});
        if((cb&&m)||(!cb&&c)){ const bx=xT+tw-9, by=y+th/2; S('circle',{cx:r2(bx),cy:r2(by),r:7.6,fill:cb?'var(--s4)':'var(--s3)'},g); Tx(g,bx,by+3.9,'?',{'text-anchor':'middle','font-size':11,'font-weight':900,fill:'var(--page)'}); }
        Tx(svg,11,y+th/2+4,String(i+1),{'text-anchor':'middle','font-size':11,'font-weight':m?800:600,fill:m?'var(--s4)':'var(--ink-muted)'});
        geo.tiles.push({i,w,x:xT,y,w_:tw,h:th});
        const s=S0[i], on=st.done[i];
        if(s.n>0){ S('rect',{x:xCb,y:r2(y+th/2-6),width:12,height:12,rx:3,fill:on?'var(--s6)':'none',stroke:'var(--s6)','stroke-width':1.2,opacity:on?1:.35},svg); geo.squares.push({i,k:'cbow',on}); }
        for(let q=0;q<s.n;q++){ const row=Math.floor(q/per), col=q%per; S('rect',{x:r2(xSg+col*13),y:r2(y+th/2-5+row*12),width:10,height:10,rx:2.5,fill:on?'var(--s5)':'none',stroke:'var(--s5)','stroke-width':1.1,opacity:on?1:.35},svg); geo.squares.push({i,k:'sg',on}); } });
    }
    svg.setAttribute('viewBox','0 0 '+W+' '+Math.round(H)); svg.setAttribute('width',W); svg.setAttribute('height',Math.round(H)); svg.style.maxWidth='100%'; svg.style.height='auto';
    geo.W=W; geo.H=H; st.geo=geo;
    renderNow(S0,cur); renderTrays(S0); }

  /* ---------- the examples made at this stop, and all the examples so far ---------- */
  const tok=(w,c)=>'<span class="w2-tok'+(c?' '+c:'')+'">'+esc(w)+'</span>';
  function renderNow(S0,s){ const t=toks(), C=st.C, cb=st.mode==='cbow';
    const slotsL=[], slotsR=[]; for(let d=C;d>=1;d--){ const j=s.i-d; slotsL.push(j>=0?tok(t[j],'c'):tok('·','gap')); } for(let d=1;d<=C;d++){ const j=s.i+d; slotsR.push(j<t.length?tok(t[j],'c'):tok('·','gap')); }
    const ex=slotsL.join('')+tok('?','m q')+slotsR.join('')+'<span class="w2-arr">→</span>'+tok(s.centre,'m');
    const pairs=[]; for(let d=C;d>=1;d--){ const j=s.i-d; pairs.push(j>=0?tok(s.centre+' → '+t[j],'c'):tok('·','gap')); } for(let d=1;d<=C;d++){ const j=s.i+d; pairs.push(j<t.length?tok(s.centre+' → '+t[j],'c'):tok('·','gap')); }
    const edge=s.n<2*C?' · '+(2*C-s.n)+' missing at the edge':'';
    nowBox.innerHTML='<div class="w2w-lane'+(cb?' on':' dim')+'" data-k="cbow"><div class="t"><span>stop '+(s.i+1)+' · CBOW: fill in the blank</span><b>'+(s.n>0?1:0)+' example</b></div><div class="w2w-ex">'+ex+'</div></div>'+
      '<div class="w2w-lane'+(cb?' dim':' on')+'" data-k="sg"><div class="t"><span>stop '+(s.i+1)+' · skip-gram: guess each neighbour'+edge+'</span><b>'+s.n+' pair'+(s.n===1?'':'s')+'</b></div><div class="w2w-ex">'+pairs.join('')+'</div></div>'; }
  function renderTrays(S0){ const t=toks(); let hc='', hs='', ac=[], as=[];
    S0.forEach((s,i)=>{ if(!st.done[i]||s.n===0) return; const nw=i===st.cur?' new':'';
      const ctx=s.left.map(j=>t[j]).concat(['_'],s.right.map(j=>t[j])).join(' ');
      hc+='<span class="w2w-card'+nw+'">'+esc(ctx)+' → <b>'+esc(s.centre)+'</b></span>'; ac.push(1);
      s.left.concat(s.right).forEach(j=>{ hs+='<span class="w2w-card'+nw+'"><b>'+esc(s.centre)+'</b>→'+esc(t[j])+'</span>'; }); as.push(s.n); });
    $('w2w-tcb').innerHTML=hc||'<span class="w2-lbl">none yet</span>'; $('w2w-tsg').innerHTML=hs||'<span class="w2-lbl">none yet</span>';
    const sum=a=>a.reduce((x,y)=>x+y,0);
    $('w2w-ncb').textContent=sum(ac); $('w2w-nsg').textContent=sum(as);
    $('w2w-scb').innerHTML=ac.length?ac.join(' + ')+' = <b>'+sum(ac)+'</b>':'';
    $('w2w-ssg').innerHTML=as.length?as.join(' + ')+' = <b>'+sum(as)+'</b>':''; }

  /* ---------- controls ---------- */
  const playBtn=$('w2w-play');
  function stopPlay(){ st.playing=false; clearTimeout(st.timer); playBtn.textContent='▶ slide'; playBtn.classList.remove('on'); }
  /* st.at = how many stops the current slide has counted; st.cur = where the window is drawn (clicking a word moves only the view) */
  function advance(){ const n=toks().length; if(st.at>=n){ st.done=toks().map(()=>false); st.at=0; } st.done[st.at]=true; st.cur=st.at; st.at++; return st.at<n; }
  function tick(){ if(!st.playing) return; const more=advance(); render(); if(!more){ stopPlay(); return; } st.timer=setTimeout(tick,1000); }
  function play(){ if(st.playing){ stopPlay(); return; }
    if(RMo){ st.done=toks().map(()=>true); st.at=toks().length; st.cur=st.at-1; render(); return; }
    st.at=toks().length; advance(); st.playing=true; playBtn.textContent='❚❚ pause'; playBtn.classList.add('on'); render(); st.timer=setTimeout(tick,1000); }
  playBtn.addEventListener('click',play);
  $('w2w-step').addEventListener('click',()=>{ stopPlay(); advance(); render(); });
  $('w2w-reset').addEventListener('click',()=>{ stopPlay(); st.si=0; st.C=2; st.mode='cbow'; syncCtl(); rest(); render(); });
  const cIn=$('w2w-c'); cIn.addEventListener('input',()=>{ stopPlay(); st.C=+cIn.value; $('w2w-c-o').textContent=st.C; fillRange(cIn); rest(); render(); });
  const modeHost=$('w2w-mode'); modeHost.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; st.mode=b.dataset.v; pressSeg(modeHost,st.mode); render(); });
  const sHost=$('w2w-sents'); sHost.innerHTML=SENTS.map((s,i)=>'<button data-v="'+i+'" aria-pressed="'+(i===0)+'">'+esc(s)+'</button>').join('');
  sHost.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; stopPlay(); st.si=+b.dataset.v; pressSeg(sHost,st.si); rest(); render(); });
  svg.addEventListener('click',e=>{ const g=e.target.closest('.w2w-tile'); if(!g) return; st.cur=+g.dataset.i; render(); });
  function syncCtl(){ cIn.value=st.C; $('w2w-c-o').textContent=st.C; fillRange(cIn); pressSeg(modeHost,st.mode); pressSeg(sHost,st.si); }
  rest(); syncCtl(); render();
  watchWidth(root,()=>render());
  return {state:()=>{ const S0=stops(), c=counts(); return {sentence:SENTS[st.si],tokens:toks(),C:st.C,mode:st.mode,cur:st.cur,done:st.done.slice(),perStop:S0.map(s=>s.n),counts:c,playing:st.playing,geo:st.geo}; },
    sentences:SENTS,render,setSentence(i){ st.si=i; pressSeg(sHost,i); rest(); render(); }};
})();

/* ================= w-cbow and w-skipgram · the two toy machines (s9, s10), one renderer ================= */
/* a plane with equal scales on both axes that contains every point in pts (and the origin); W is the real pixel width */
function planeFrame(svg,pts,W,H,labs){ const L=32, Rm=10, Tm=10, B=26, pw=W-L-Rm, ph=H-Tm-B;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  /* fit the points; then, so that every label has room outside its tip, fit each tip pushed outward by its label's size (twice, as the scale settles) */
  const fit=P=>{ let x0=0,x1=0,y0=0,y1=0; P.forEach(p=>{ if(!p||!isFinite(p[0])||!isFinite(p[1])) return; x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); y0=Math.min(y0,p[1]); y1=Math.max(y1,p[1]); });
    x0-=.4; x1+=.4; y0-=.4; y1+=.4; return {x0,x1,y0,y1,sc:Math.min(pw/(x1-x0),ph/(y1-y0))}; };
  let f=fit(pts);
  if(labs&&labs.length) for(let it=0;it<2;it++){ const ext=pts.slice(); labs.forEach(l=>{ const n=Math.hypot(l.p[0],l.p[1]), d=n<1e-9?[.7071,-.7071]:[l.p[0]/n,l.p[1]/n], ox=(l.w/2+14)/f.sc, oy=(l.h/2+12)/f.sc;
      ext.push([l.p[0]+d[0]*ox+Math.sign(d[0]||1)*0,l.p[1]+d[1]*oy]); ext.push([l.p[0]+Math.sign(d[0]||1)*ox,l.p[1]]); }); f=fit(ext); }
  const {x0,x1,y0,y1,sc}=f, cx=(x0+x1)/2, cy=(y0+y1)/2, X0=cx-pw/sc/2, X1=cx+pw/sc/2, Y0=cy-ph/sc/2, Y1=cy+ph/sc/2;
  const px=x=>L+(x-X0)*sc, py=y=>Tm+(Y1-y)*sc;
  const span=Math.max(X1-X0,Y1-Y0), step=span<=3.2?0.5:span<=7?1:span<=14?2:5, lab=Math.max(1,step);
  const g=S('g',{class:'w2-grid'},svg), on=v=>Math.abs(v/lab-Math.round(v/lab))<1e-9;
  for(let v=Math.ceil(X0/step)*step;v<=X1+1e-9;v+=step){ const X=px(v); S('line',{x1:r2(X),y1:Tm,x2:r2(X),y2:Tm+ph,stroke:'var(--grid)','stroke-width':1,opacity:on(v)?1:.5},g); if(on(v)) Tx(g,X,Tm+ph+15,N(v,1),{'text-anchor':'middle','font-size':11,fill:'var(--ink-muted)'}); }
  for(let v=Math.ceil(Y0/step)*step;v<=Y1+1e-9;v+=step){ const Y=py(v); S('line',{x1:L,y1:r2(Y),x2:L+pw,y2:r2(Y),stroke:'var(--grid)','stroke-width':1,opacity:on(v)?1:.5},g); if(on(v)) Tx(g,L-6,Y+3.8,N(v,1),{'text-anchor':'end','font-size':11,fill:'var(--ink-muted)'}); }
  if(Y0<0&&Y1>0) S('line',{x1:L,y1:r2(py(0)),x2:L+pw,y2:r2(py(0)),stroke:'var(--axis)','stroke-width':1.5},g);
  if(X0<0&&X1>0) S('line',{x1:r2(px(0)),y1:Tm,x2:r2(px(0)),y2:Tm+ph,stroke:'var(--axis)','stroke-width':1.5},g);
  S('rect',{x:L,y:Tm,width:pw,height:ph,rx:6,fill:'none',stroke:'var(--line)'},g);
  Tx(g,L+pw-5,Tm+ph-6,'1st number →',{'text-anchor':'end','font-size':11,fill:'var(--ink-muted)',opacity:.85,class:'w2-axn'});
  Tx(g,L+5,Tm+14,'↑ 2nd number',{'font-size':11,fill:'var(--ink-muted)',opacity:.85,class:'w2-axn'});
  return {px,py,sc,X0,X1,Y0,Y1,L,T:Tm,pw,ph,W,H}; }
/* place short labels near points without overlapping each other, the arrows, or the edge of the plot */
function Placer(F){ const W=F.W, out=[]; const boxes=[{x:F.L+F.pw-5-tw('1st number →',11,400),y:F.T+F.ph-19,w:tw('1st number →',11,400)+4,h:17},{x:F.L+1,y:F.T+1,w:tw('↑ 2nd number',11,400)+8,h:17}];
  const hit=(b)=>b.x<F.L+1||b.x+b.w>W-3||b.y<F.T+1||b.y+b.h>F.T+F.ph-1||boxes.some(o=>b.x<o.x+o.w&&b.x+b.w>o.x&&b.y<o.y+o.h&&b.y+b.h>o.y);
  return {labels:out,block(x,y,w,h){ boxes.push({x,y,w,h}); },
    seg(x1,y1,x2,y2,r){ r=r||3; const L=Math.hypot(x2-x1,y2-y1), n=Math.max(1,Math.ceil(L/7)); for(let k=0;k<=n;k++){ const x=x1+(x2-x1)*k/n, y=y1+(y2-y1)*k/n; boxes.push({x:x-r,y:y-r,w:2*r,h:2*r}); } },
    place(ax,ay,w,h,dir,name){ const d0=Math.atan2(dir[1],dir[0]); const tries=[0]; for(let k=1;k<=8;k++) tries.push(k*Math.PI/8,-k*Math.PI/8);
      let best=null, bestA=Infinity;
      for(const rad of [9,15,22,30,40,52,66]) for(const t of tries){ const a=d0+t, cx=ax+Math.cos(a)*(rad+w/2*Math.abs(Math.cos(a))), cy=ay+Math.sin(a)*(rad+h/2*Math.abs(Math.sin(a)));
        const b={x:cx-w/2,y:cy-h/2,w,h}; if(!hit(b)){ boxes.push(b); out.push(Object.assign({name,far:rad>30},b)); return b; }
        if(b.x>=F.L+1&&b.x+b.w<=W-3&&b.y>=F.T+1&&b.y+b.h<=F.T+F.ph-1){ const A=boxes.reduce((s0,o)=>s0+Math.max(0,Math.min(b.x+b.w,o.x+o.w)-Math.max(b.x,o.x))*Math.max(0,Math.min(b.y+b.h,o.y+o.h)-Math.max(b.y,o.y)),0)+rad*.01; if(A<bestA){ bestA=A; best=b; } } }
      const b=best||{x:Math.min(W-3-w,Math.max(F.L+1,ax+8)),y:Math.max(F.T+1,ay-h-4),w,h}; b.forced=true; boxes.push(b); out.push(Object.assign({name},b)); return b; }}; }
const MC=document.createElement('canvas').getContext('2d');
function tw(s,fs,wt,mono){ MC.font=(wt||700)+' '+fs+'px '+(mono?PAL.mono:PAL.ui); return MC.measureText(s).width+3; }
const pxW=svg=>Math.max(250,Math.round(svg.parentElement.clientWidth));

function Machine(kind){ const P=kind==='cbow'?'w2c':'w2s', root=$(kind==='cbow'?'w-cbow':'w-skipgram'); if(!root) return null;
  const svIn=$(P+'-in'), svOut=$(P+'-out'), svProb=$(P+'-prob'), hud=$(P+'-hud'), rail=$(P+'-rail'), sentBox=$(P+'-sent'), histBox=$(P+'-hist');
  /* the two tables under the planes: every row of W_in and W_out, exactly */
  const mkTab=(svg,cls)=>{ const d=document.createElement('div'); d.className='w2-tab '+cls; svg.parentElement.appendChild(d); return d; };
  const tabIn=mkTab(svIn,'tin'), tabOut=mkTab(svOut,'tout');
  const MOVES=kind==='cbow'?['look up','average','score','softmax + loss','error','update','re-score']:['look up','score','softmax','every slot, one loss','errors, summed','update','re-score'];
  const HP=300, HC=kind==='cbow'?316:394;
  const st={eta:1,win2:false,rounds:[],ri:0,move:0,a:1,geo:{}};
  const base=()=>kind==='cbow'&&st.win2?E.TOY2:E.TOY;
  function task(M){ const B=base(), V=M.vocab, ci=B.sentence.indexOf('chai'), c=V.indexOf('chai');
    if(kind==='cbow'){ const C=st.win2?2:1, ctx=[]; for(let j=ci-C;j<=ci+C;j++) if(j!==ci&&j>=0&&j<B.sentence.length) ctx.push(V.indexOf(B.sentence[j])); return {ctx,target:c}; }
    return {centre:c,targets:[V.indexOf('drink'),V.indexOf('daily')]}; }
  const compute=M=>{ const t=task(M); return kind==='cbow'?E.cbowRound(M,t.ctx,t.target,st.eta):E.sgRound(M,t.centre,t.targets,st.eta); };
  const cur=()=>st.rounds[st.ri];
  function start(){ const M=E.cloneM(base()); st.rounds=[{M,R:compute(M)}]; st.ri=0; st.move=0; st.a=1; }
  const W_=i=>cur().M.vocab[i];
  const leader=(svg,X,Y,b,col)=>{ const cx=Math.max(b.x,Math.min(X,b.x+b.w)), cy=Math.max(b.y,Math.min(Y,b.y+b.h)); if(Math.hypot(cx-X,cy-Y)>24) S('line',{x1:r2(X),y1:r2(Y),x2:r2(cx),y2:r2(cy),stroke:col,'stroke-width':1,opacity:.55,'stroke-dasharray':'2 3'},svg); };
  const lbl=(pl,svg,X,Y,s,fs,wt,col,dir,name)=>{ const w=tw(s,fs,wt), b=pl.place(X,Y,w,fs+4,dir,name); leader(svg,X,Y,b,col); Tx(svg,b.x+b.w/2,b.y+fs*.84+1.5,s,{'text-anchor':'middle','font-size':fs,'font-weight':wt,fill:col,class:'w2-lbl-t'}); return b; };

  /* ---------- 1 · the committee (CBOW) / the middle word (skip-gram): input vectors ---------- */
  function drawIn(){ const {M,R}=cur(), mv=st.move, a=mv>=6?(mv===6?st.a:1):0; svIn.innerHTML='';
    const mem=kind==='cbow'?R.ctx:[R.centre], old=mem.map(i=>M.vin[i]), neu=mem.map(i=>R.next.vin[i]);
    const hOld=R.h, hNew=kind==='cbow'?R.after.h:R.next.vin[R.centre], EHtip=[R.h[0]+R.EH[0],R.h[1]+R.EH[1]];
    const labsIn=old.concat(neu).map((v,k)=>({p:v,w:tw(W_(mem[k%mem.length]),12,750),h:16}));
    const F=planeFrame(svIn,old.concat(neu,[hOld,hNew,EHtip]),pxW(svIn),HP,labsIn); const pl=Placer(F); const geo={F:{X0:F.X0,Y1:F.Y1,sc:F.sc,L:F.L,T:F.T,W:F.W,H:F.H},arrows:[],h:null,labels:pl.labels};
    const lerp=(p,q)=>[p[0]+(q[0]-p[0])*a,p[1]+(q[1]-p[1])*a];
    if(mv<1){ Tx(svIn,F.L+F.pw/2,F.T+F.ph/2,kind==='cbow'?'the neighbours’ vectors appear at move ①':'the middle word’s vector appears at move ①',{'text-anchor':'middle','font-size':11.5,fill:'var(--ink-muted)'}); st.geo.in=geo; return; }
    const O=[F.px(0),F.py(0)];
    if(mv>=6) old.forEach(v=>arrow(svIn,O[0],O[1],F.px(v[0]),F.py(v[1]),'var(--s1)',1.6,{op:.3,halo:false,dash:'4 4'}));
    const cur2=old.map((v,k)=>lerp(v,neu[k])), hNow=lerp(hOld,hNew);
    if(kind==='cbow'&&mv>=2) cur2.forEach(v=>S('line',{x1:r2(F.px(v[0])),y1:r2(F.py(v[1])),x2:r2(F.px(hNow[0])),y2:r2(F.py(hNow[1])),stroke:'var(--s4)','stroke-width':1.3,'stroke-dasharray':'2 4',opacity:.85},svIn));
    cur2.forEach((v,k)=>{ const X=F.px(v[0]), Y=F.py(v[1]); arrow(svIn,O[0],O[1],X,Y,'var(--s1)',2.6,{cls:'w2-vin'}); pl.seg(O[0],O[1],X,Y); geo.arrows.push({w:W_(mem[k]),vec:v.slice(),x2:X,y2:Y}); });
    const showH=kind==='cbow'?mv>=2:mv>=1;
    if(showH){ const X=F.px(hNow[0]), Y=F.py(hNow[1]); pl.block(X-8,Y-8,16,16); if(kind==='cbow') cur2.forEach(v=>pl.seg(F.px(v[0]),F.py(v[1]),X,Y,2)); }
    if(mv===5) pl.seg(F.px(hOld[0]),F.py(hOld[1]),F.px(EHtip[0]),F.py(EHtip[1]));
    if(mv>=6) old.forEach((v,k)=>pl.seg(F.px(v[0]),F.py(v[1]),F.px(neu[k][0]),F.py(neu[k][1])));
    cur2.forEach((v,k)=>{ lbl(pl,svIn,F.px(v[0]),F.py(v[1]),W_(mem[k]),12,750,'var(--s1)',[v[0],-v[1]],W_(mem[k])); });
    if(showH){ const X=F.px(hNow[0]), Y=F.py(hNow[1]);
      if(mv>=6&&kind==='cbow') S('circle',{cx:r2(F.px(hOld[0])),cy:r2(F.py(hOld[1])),r:4.2,fill:'none',stroke:'var(--s4)','stroke-width':1.3,opacity:.55},svIn);
      S('circle',{cx:r2(X),cy:r2(Y),r:9,fill:'var(--s4)',class:'w2-halo'},svIn); S('circle',{cx:r2(X),cy:r2(Y),r:5.2,fill:'var(--s4)',stroke:'var(--page)','stroke-width':1.2},svIn);
      lbl(pl,svIn,X,Y,kind==='cbow'?'h':'h = v(chai)',12,800,'var(--s4)',[1,1],'h'); geo.h={vec:hNow.slice(),x:X,y:Y}; }
    if(mv===5){ const X=F.px(hOld[0]), Y=F.py(hOld[1]), X2=F.px(EHtip[0]), Y2=F.py(EHtip[1]); arrow(svIn,X,Y,X2,Y2,'var(--critical)',2.2,{cls:'w2-eh'});
      lbl(pl,svIn,X2,Y2,'blame EH',11,700,'var(--critical)',[R.EH[0],-R.EH[1]],'EH'); geo.eh={from:[X,Y],to:[X2,Y2],vec:R.EH.slice()}; }
    if(mv>=6){ geo.moves=[]; old.forEach((v,k)=>{ const n2=neu[k], X1=F.px(v[0]), Y1=F.py(v[1]), X2=F.px(n2[0]), Y2=F.py(n2[1]); geo.moves.push({from:[X1,Y1],to:[X2,Y2],d:[n2[0]-v[0],n2[1]-v[1]]}); if(Math.hypot(X2-X1,Y2-Y1)>3) arrow(svIn,X1,Y1,X1+(X2-X1)*a,Y1+(Y2-Y1)*a,'var(--s4)',2.1,{head:7}); });
      const v=old[0], n2=neu[0]; if(Math.hypot(F.px(n2[0])-F.px(v[0]),F.py(n2[1])-F.py(v[1]))>3) lbl(pl,svIn,F.px((v[0]+n2[0])/2),F.py((v[1]+n2[1])/2),kind==='cbow'?'each moves −η·EH/'+mem.length:'moves −η·EH',11,700,'var(--s4)',[n2[0]-v[0]+.001,-(n2[1]-v[1])],'move'); }
    st.geo.in=geo; }

  /* ---------- 2 · score every word: output vectors ---------- */
  function drawOut(){ const {M,R}=cur(), mv=st.move, a=mv>=6?(mv===6?st.a:1):0; svOut.innerHTML=''; const V=M.vocab;
    const old=M.vout, neu=R.next.vout, h=R.h, showH=kind==='cbow'?mv>=2:mv>=1, showS=kind==='cbow'?mv>=3:mv>=2;
    const labW=i=>tw(V[i],12,750)+(showS?5+tw(N(Math.min(R.scores[i],R.after.scores[i])),11.5,700,true):0);
    const labsOut=old.map((u,i)=>({p:u,w:labW(i),h:16})).concat(neu.map((u,i)=>({p:u,w:labW(i),h:16})));
    const F=planeFrame(svOut,old.concat(neu,[h]),pxW(svOut),HP,labsOut); const pl=Placer(F); const geo={F:{X0:F.X0,Y1:F.Y1,sc:F.sc,L:F.L,T:F.T,W:F.W,H:F.H},arrows:[],labels:pl.labels};
    const O=[F.px(0),F.py(0)], tgt=kind==='cbow'?[R.target]:R.targets, cIdx=V.indexOf('chai');
    if(showH){ const far=50/Math.max(1e-9,Math.hypot(h[0],h[1])); S('line',{x1:r2(O[0]),y1:r2(O[1]),x2:r2(F.px(h[0]*far)),y2:r2(F.py(h[1]*far)),stroke:'var(--s4)','stroke-width':1,opacity:.3,'stroke-dasharray':'1 5'},svOut);
      arrow(svOut,O[0],O[1],F.px(h[0]),F.py(h[1]),'var(--s4)',2,{dash:'5 4',halo:false,head:8}); }
    if(mv>=6) old.forEach(u=>{ if(Math.hypot(u[0],u[1])>1e-9) arrow(svOut,O[0],O[1],F.px(u[0]),F.py(u[1]),'var(--s3)',1.4,{op:.3,halo:false,dash:'4 4'}); });
    const curU=old.map((u,i)=>[u[0]+(neu[i][0]-u[0])*a,u[1]+(neu[i][1]-u[1])*a]);
    curU.forEach((u,i)=>{ const X=F.px(u[0]), Y=F.py(u[1]), hot=tgt.includes(i); arrow(svOut,O[0],O[1],X,Y,'var(--s3)',hot?2.8:2,{cls:'w2-vout'}); pl.seg(O[0],O[1],X,Y); geo.arrows.push({w:V[i],vec:u.slice(),x2:X,y2:Y}); });
    if(showH){ pl.seg(O[0],O[1],F.px(h[0]),F.py(h[1])); pl.block(F.px(h[0])-5,F.py(h[1])-5,10,10); }
    if(mv>=6){ geo.moves=[]; old.forEach((u,i)=>{ const n2=neu[i], X1=F.px(u[0]), Y1=F.py(u[1]), X2=F.px(n2[0]), Y2=F.py(n2[1]); pl.seg(X1,Y1,X2,Y2);
      const pull=kind==='cbow'?i===cIdx:tgt.includes(i); geo.moves.push({w:V[i],d:[n2[0]-u[0],n2[1]-u[1]],pull});
      if(Math.hypot(X2-X1,Y2-Y1)>3) arrow(svOut,X1,Y1,X1+(X2-X1)*a,Y1+(Y2-Y1)*a,pull?'var(--s4)':'var(--critical)',2,{head:7}); }); }
    const sc2=R.after.scores;
    curU.forEach((u,i)=>{ const X=F.px(u[0]), Y=F.py(u[1]), s=V[i], score=showS&&mv!==6?(mv>=7?N(sc2[i]):N(R.scores[i])):null;
      const w=tw(s,12,750)+(score!=null?5+tw(score,11.5,700,true):0), dir=Math.hypot(u[0],u[1])<1e-6?[1,1]:[u[0],-u[1]], b=pl.place(X,Y,w,16,dir,s); leader(svOut,X,Y,b,'var(--s3)');
      const t=Tx(svOut,b.x+1.5,b.y+12.6,'',{'font-size':12,class:'w2-lbl-t'}); const t1=S('tspan',{'font-weight':750,fill:tgt.includes(i)?'var(--ink)':'var(--s3)'},t); t1.textContent=s;
      if(score!=null){ const t2=S('tspan',{'font-weight':700,'font-size':11.5,fill:'var(--s4)',class:'w2-mono',dx:5},t); t2.textContent=score; } });
    if(showH) lbl(pl,svOut,F.px(h[0]),F.py(h[1]),'h',12,800,'var(--s4)',[-1,-1],'h');
    st.geo.out=geo; }

  /* ---------- 3 · the guess (softmax) and the error ---------- */
  function bars(g,x0,w,yTop,yBase,vals,o){ o=o||{}; const n=vals.length, slot=w/n, bw=Math.min(30,slot*.56), out=[];
    vals.forEach((v,i)=>{ const cx=x0+slot*(i+.5), hgt=Math.max(0,Math.min(1,v))*(yBase-yTop), y=yBase-hgt;
      if(o.ghost&&o.ghost[i]!=null){ const gh=o.ghost[i]*(yBase-yTop); S('rect',{x:r2(cx-bw/2),y:r2(yBase-gh),width:r2(bw),height:r2(Math.max(.5,gh)),rx:3,fill:'none',stroke:'var(--s6)','stroke-width':1.2,'stroke-dasharray':'3 3',opacity:.75},g); }
      S('rect',{x:r2(cx-bw/2),y:r2(y),width:r2(bw),height:r2(Math.max(.6,hgt)),rx:3,fill:'var(--s6)',opacity:o.op?o.op(i):.9,class:'w2-bar'},g); out.push({i,cx,y,h:hgt,v,bw}); }); return out; }
  function errBars(g,x0,w,yE0,eS,vals,op,geo){ const n=vals.length, slot=w/n, bw=Math.min(30,slot*.56);
    vals.forEach((v,i)=>{ const cx=x0+slot*(i+.5), hgt=Math.min(Math.abs(v),1.25)*eS, y=v>=0?yE0-hgt:yE0, col=v<0?'var(--s4)':'var(--critical)';
      S('rect',{x:r2(cx-bw/2),y:r2(y),width:r2(bw),height:r2(Math.max(.6,hgt)),rx:3,fill:col,opacity:op*.9,class:'w2-ebar'},g);
      Tx(g,cx,v>=0?y-5:y+hgt+13,N(v,n>5?3:4),{'text-anchor':'middle','font-size':11,'font-weight':700,fill:v<0?'var(--s4)':'var(--critical)',opacity:op,class:'w2-mono'}); geo.err.push({i,v,cx,y,h:hgt}); }); }
  function drawProb(){ const {M,R}=cur(), mv=st.move, V=M.vocab; svProb.innerHTML=''; const g=svProb, W=pxW(svProb), H=HC, L=12, pw=W-2*L, geo={bars:[],err:[],slots:[],W,H};
    svProb.setAttribute('viewBox','0 0 '+W+' '+H);
    const tgt=kind==='cbow'?[R.target]:R.targets, showP=kind==='cbow'?mv>=4:mv>=3, n=V.length, slot=pw/n, dp=n>5?3:4;
    const lossTxt=kind==='cbow'?(mv>=7?'loss '+N(R.loss)+' → '+N(R.after.loss):mv>=4?'loss −ln '+N(R.p[R.target])+' = '+N(R.loss):''):(mv>=7?'loss '+N(R.loss)+' → '+N(R.after.loss):mv>=4?'loss '+R.slotLoss.map(x=>N(x)).join(' + ')+' = '+N(R.loss):'');
    Tx(g,L,17,kind==='cbow'?'probability p':'one guess p',{'font-size':11.5,'font-weight':750,fill:'var(--s6)'});
    if(lossTxt){ Tx(g,L+pw,17,lossTxt,{'text-anchor':'end','font-size':11.5,'font-weight':800,fill:'var(--critical)',class:'w2-mono'}); geo.loss=lossTxt; }
    const yTop=42, yBase=kind==='cbow'?150:126, yWord=yBase+16;
    S('line',{x1:L,y1:yBase,x2:L+pw,y2:yBase,stroke:'var(--axis)','stroke-width':1.2},g);
    S('line',{x1:L,y1:yTop,x2:L+pw,y2:yTop,stroke:'var(--grid)','stroke-width':1,'stroke-dasharray':'2 4'},g);
    V.forEach((w,i)=>{ const cx=L+slot*(i+.5), t=tgt.includes(i); Tx(g,cx,yWord,w,{'text-anchor':'middle','font-size':11,'font-weight':t?800:600,fill:t?(kind==='cbow'?'var(--s4)':'var(--s3)'):(kind==='sg'&&i===R.centre?'var(--s4)':'var(--ink-2)')}); });
    if(!showP) Tx(g,L+pw/2,(yTop+yBase)/2+4,'the guess appears at move '+(kind==='cbow'?'④':'③'),{'text-anchor':'middle','font-size':11.5,fill:'var(--ink-muted)'});
    else { const p=mv>=7?R.after.p:R.p, ghost=mv>=7?R.p:null, pa=mv===7?p.map((v,i)=>R.p[i]+(v-R.p[i])*st.a):p;
      if(kind==='cbow'&&mv>=4) tgt.forEach(i=>{ const cx=L+slot*(i+.5), bw=Math.min(30,slot*.56)+8; S('rect',{x:r2(cx-bw/2),y:yTop,width:r2(bw),height:yBase-yTop,rx:4,fill:'none',stroke:'var(--s4)','stroke-width':1.4,'stroke-dasharray':'4 3'},g); Tx(g,Math.min(L+pw-20,cx),yTop-6,'truth = 1',{'text-anchor':'middle','font-size':11,'font-weight':700,fill:'var(--s4)'}); geo.truth={i,x:cx,y:yTop}; });
      geo.bars=bars(g,L,pw,yTop,yBase,pa,{ghost,op:i=>tgt.includes(i)?1:.72}); geo.scale={yTop,yBase};
      geo.bars.forEach(b=>{ const t=tgt.includes(b.i)&&kind==='cbow'; const top=Math.min(b.y,ghost?yBase-ghost[b.i]*(yBase-yTop):b.y);
        if(t){ const s=mv>=7?N(R.p[b.i])+' → '+N(R.after.p[b.i]):N(R.p[b.i]), w=tw(s,11.5,800,true);
          if(top-6-12>=yTop+2){ const X=Math.min(Math.max(b.cx,L+w/2),L+pw-w/2); Tx(g,X,top-6,s,{'text-anchor':'middle','font-size':11.5,'font-weight':800,fill:'var(--ink)',class:'w2-mono'}); }
          else { const right=b.cx+b.bw/2+10+w<=L+pw, X=right?b.cx+b.bw/2+10:b.cx-b.bw/2-10; Tx(g,X,yTop+16,s,{'text-anchor':right?'start':'end','font-size':11.5,'font-weight':800,fill:'var(--ink)',class:'w2-mono'}); } }
        else Tx(g,b.cx,top-5,NF(b.v,dp),{'text-anchor':'middle','font-size':11,'font-weight':tgt.includes(b.i)?800:600,fill:tgt.includes(b.i)?'var(--ink)':'var(--ink-2)',class:'w2-mono'}); }); }
    if(kind==='cbow'){ const yE0=252, eS=50;
      Tx(g,L,190,'error e = p − y',{'font-size':11.5,'font-weight':750,fill:'var(--critical)'});
      if(mv>=5) Tx(g,L+pw,190,'gold: pull · red: push',{'text-anchor':'end','font-size':11,fill:'var(--ink-muted)'});
      S('line',{x1:L,y1:yE0,x2:L+pw,y2:yE0,stroke:'var(--axis)','stroke-width':1.2},g);
      if(mv>=5) errBars(g,L,pw,yE0,eS,R.e,mv>=7?.45:1,geo);
      else Tx(g,L+pw/2,yE0+20,'the error appears at move ⑤',{'text-anchor':'middle','font-size':11.5,fill:'var(--ink-muted)'});
      geo.scale=Object.assign(geo.scale||{},{yE0,eS}); }
    else { const ySl=172, slH=58, sw=(pw-10)/2, yE0=348, eS=40;
      R.targets.forEach((t,k)=>{ const x0=L+k*(sw+10), on=mv>=4; const box=S('g',{opacity:on?1:.4},g);
        S('rect',{x:r2(x0),y:ySl-16,width:r2(sw),height:slH+50,rx:8,fill:'var(--surface-2)','fill-opacity':.45,stroke:on?'var(--s3)':'var(--line)','stroke-width':1},box);
        Tx(box,x0+8,ySl,'slot '+(k+1)+' → '+V[t],{'font-size':11.5,'font-weight':750,fill:'var(--s3)'}); if(on) Tx(box,x0+sw-7,ySl,'0.5 line',{'text-anchor':'end','font-size':11,fill:'var(--s4)',opacity:.85});
        if(on){ const yH=ySl+8+(slH-12)*.5; S('line',{x1:r2(x0+4),y1:r2(yH),x2:r2(x0+sw-4),y2:r2(yH),stroke:'var(--s4)','stroke-width':1,'stroke-dasharray':'2 3',opacity:.6},box);
          const p=mv>=7?R.after.p:R.p, bb=bars(box,x0+4,sw-8,ySl+8,ySl+slH-4,p,{op:i=>i===t?1:.4}); const b=bb[t];
          S('rect',{x:r2(b.cx-b.bw/2-4),y:ySl+6,width:r2(b.bw+8),height:slH-8,rx:3,fill:'none',stroke:'var(--s4)','stroke-width':1.2,'stroke-dasharray':'3 3'},box);
          const sl=mv>=7?R.after.slotLoss[k]:R.slotLoss[k], pv=mv>=7?R.after.p[t]:R.p[t];
          Tx(box,x0+sw/2,ySl+slH+13,'p = '+N(pv),{'text-anchor':'middle','font-size':11,'font-weight':700,fill:'var(--ink)',class:'w2-mono'});
          Tx(box,x0+sw/2,ySl+slH+27,'−ln p = '+N(sl),{'text-anchor':'middle','font-size':11,'font-weight':700,fill:'var(--critical)',class:'w2-mono'}); geo.slots.push({k,t,p:pv,loss:sl}); }
        else Tx(box,x0+sw/2,ySl+slH/2+6,'at move ④',{'text-anchor':'middle','font-size':11,fill:'var(--ink-muted)'}); });
      Tx(g,L,yE0-eS*1.25-18,'errors of both slots, added: E',{'font-size':11.5,'font-weight':750,fill:'var(--critical)'});
      S('line',{x1:L,y1:yE0,x2:L+pw,y2:yE0,stroke:'var(--axis)','stroke-width':1.2},g);
      if(mv>=5) errBars(g,L,pw,yE0,eS,R.E,mv>=7?.45:1,geo);
      else Tx(g,L+pw/2,yE0+20,'the summed error appears at move ⑤',{'text-anchor':'middle','font-size':11.5,fill:'var(--ink-muted)'});
      geo.scale=Object.assign(geo.scale||{},{yE0,eS}); }
    st.geo.prob=geo; }

  /* ---------- the narration ---------- */
  const ni=s=>'<span class="ni">'+s+'</span>', no=s=>'<span class="no">'+s+'</span>', ng=s=>'<span class="ng">'+s+'</span>', np=s=>'<span class="np">'+s+'</span>', ne=s=>'<span class="ne">'+s+'</span>', nn=s=>'<span class="n">'+s+'</span>';
  function hudText(){ const {M,R}=cur(), mv=st.move, V=M.vocab, eta=N(st.eta), list=(arr,f)=>V.map((w,i)=>w+' '+f(arr[i])).join(' · ');
    if(kind==='cbow'){ const mem=R.ctx.map(i=>V[i]), n=mem.length, t=V[R.target];
      switch(mv){
        case 0: return ['ready','The blank is <b>chai</b>. The committee is its neighbours: '+mem.map(w=>'<b>'+w+'</b>').join(', ')+'. Press <b>▶ next move</b>.'];
        case 1: return ['① look up','Each neighbour fetches its own row of the input table: '+R.ctx.map(i=>'<b>'+V[i]+'</b> → '+ni(V2(M.vin[i]))).join(', ')+'. The blank’s own vector is not used at all.'];
        case 2: return ['② average','h = ('+R.ctx.map(i=>V2(M.vin[i])).join(' + ')+') / '+n+' = '+ng(V2(R.h))+'. One point speaks for the whole committee. Swap the neighbours and h does not change: the order is thrown away — that is the “bag”.'];
        case 3: return ['③ score','Every word’s output vector is scored against h with a dot product (Unit 3): '+no(list(R.scores,x=>N(x)))+'.'];
        case 4: return ['④ softmax + loss','Softmax (Unit 14) turns the scores into a guess that adds up to 1: '+np(list(R.p,x=>N(x)))+'. The true word is chai, so the loss is −ln '+N(R.p[R.target])+' = '+ne(N(R.loss))+'.'];
        case 5: return ['⑤ error','Error = guess − truth (Unit 15): e = '+ne(V2(R.e))+'. Chai got too little (negative): it will be <b>pulled</b> toward h. Every other word took probability it should not have (positive): it will be <b>pushed</b> away. The blame reaching h is EH = Σ e·u = '+ne(V2(R.EH))+'.'];
        case 6: return ['⑥ update','Output vectors move by −η·e·h (η = '+eta+'): chai '+no(V2(M.vout[R.target]))+' → '+no(V2(R.next.vout[R.target]))+', pulled along h; every other word is pushed away from h, each in proportion to the probability it wrongly took. The blame for h is <b>shared equally</b> by the '+n+' neighbours: each moves by −η·EH/'+n+' = '+ng(V2(R.dv))+' — '+R.ctx.map(i=>'<b>'+V[i]+'</b> → '+ni(V2(R.next.vin[i]))).join(', ')+'.'];
        default: return ['⑦ re-score','The same moves with the new vectors: h = '+ng(V2(R.after.h))+', chai’s share rises '+np(N(R.p[R.target]))+' → '+np(N(R.after.p[R.target]))+' and the loss falls '+ne(N(R.loss))+' → '+ne(N(R.after.loss))+'.'+(st.ri>0?' One blank has one right answer, so round after round the loss heads toward 0.':' Press <b>↻ another round</b> to keep training.')]; } }
    const tg=R.targets.map(i=>V[i]);
    switch(mv){
      case 0: return ['ready','The middle word is <b>chai</b>. It must guess each of its neighbours: '+tg.map(w=>'<b>'+w+'</b>').join(' and ')+'. Press <b>▶ next move</b>.'];
      case 1: return ['① look up','The middle word fetches its own row of the input table: h = v(chai) = '+ng(V2(R.h))+'. No averaging — one word speaks for itself.'];
      case 2: return ['② score','Every word’s output vector against h: '+no(list(R.scores,x=>N(x)))+'.'];
      case 3: return ['③ softmax','One guess for “which word sits next to chai?”: '+np(list(R.p,x=>N(x)))+'.'];
      case 4: return ['④ every slot, one loss','The <b>same</b> guess serves every neighbour slot. '+R.targets.map((t,k)=>'Slot '+(k+1)+' should be '+V[t]+': −ln '+N(R.p[t])+' = '+N(R.slotLoss[k])).join('. ')+'. Total loss '+ne(N(R.loss))+'. One softmax can never give 1 to both — it has to share itself out among all of chai’s usual neighbours.'];
      case 5: return ['⑤ errors, summed','Each slot’s error is guess − its own truth; added up, E = '+R.targets.length+'p − y(drink) − y(daily) = '+ne(V2(R.E))+'. The blame reaching h is EH = Σ E·u = '+ne(V2(R.EH))+'.'];
      case 6: return ['⑥ update','Output vectors move by −η·E·h (η = '+eta+'): '+R.targets.map(t=>'<b>'+V[t]+'</b> → '+no(V2(R.next.vout[t]))).join(', ')+' are pulled toward h; chai’s own output → '+no(V2(R.next.vout[R.centre]))+' is pushed away, right through the origin. The middle word takes the <b>whole</b> blame, not a share: v(chai) → '+ni(V2(R.next.vin[R.centre]))+'. Chai stops pointing at itself.'];
      default: return ['⑦ re-score','With the new vectors each neighbour slot gets '+np(N(R.after.p[R.targets[0]]))+' instead of '+np(N(R.p[R.targets[0]]))+', and the loss falls '+ne(N(R.loss))+' → '+ne(N(R.after.loss))+'. '+(st.ri>0?'It creeps toward <b>2 ln 2 ≈ 1.386</b> and can never go below it: one list of chances must be shared by drink and daily, 0.5 each at best.':'Press <b>↻ another round</b> again and again: the loss creeps toward 2 ln 2 ≈ 1.386, never lower.')]; } }
  function drawHud(){ const [h,b]=hudText(); hud.innerHTML='<div class="hd">'+h+'<span>round '+(st.ri+1)+' · η = '+N(st.eta)+'</span></div><div>'+b+'</div>'; }
  function drawRail(){ rail.innerHTML=MOVES.map((m,i)=>'<li class="'+(i+1<st.move?'done':i+1===st.move?'cur':'')+'" data-m="'+(i+1)+'" role="button" tabindex="0" aria-current="'+(i+1===st.move?'step':'false')+'"><i>'+(i+1)+'</i>'+m+'</li>').join(''); }
  function drawSent(){ const B=base(), V=B.sentence, ci=V.indexOf('chai');
    if(kind==='cbow'){ const C=st.win2?2:1; sentBox.innerHTML=V.map((w,j)=>j===ci?'<span class="w2-tok m q" title="the blank">?</span>':Math.abs(j-ci)<=C?'<span class="w2-tok c">'+esc(w)+'</span>':'<span class="w2-tok far">'+esc(w)+'</span>').join('')+'<span class="w2-note">'+(C*2)+' neighbours fill the blank</span>'; }
    else sentBox.innerHTML=V.map((w,j)=>j===ci?'<span class="w2-tok m">'+esc(w)+'</span>':Math.abs(j-ci)===1?'<span class="w2-tok c q" title="to be guessed">'+esc(w)+' ?</span>':'<span class="w2-tok far">'+esc(w)+'</span>').join('')+'<span class="w2-note">chai guesses both neighbours</span>'; }
  function drawHist(){ const L=[st.rounds[0].R.loss]; st.rounds.forEach((r,k)=>{ if(k<st.ri||(k===st.ri&&st.move>=7)) L.push(r.R.after.loss); });
    histBox.innerHTML='<span class="lb">loss by round</span>'+L.map((v,i)=>'<b'+(i===L.length-1?' class="last"':'')+'>'+N(v)+'</b>').join('<span>→</span>')+(kind==='sg'?'<span class="fl">floor 2 ln 2 ≈ 1.386</span>':''); }
  function drawTabs(){ const {M,R}=cur(), mv=st.move, V=M.vocab, mem=kind==='cbow'?R.ctx:[R.centre], tgt=kind==='cbow'?[R.target]:R.targets, showS=kind==='cbow'?mv>=3:mv>=2, upd=mv>=6;
    const cell=v=>'<td>'+N(v)+'</td>';
    tabIn.innerHTML='<div class="tt">input table W<sub>in</sub> · one row per word</div><table><tbody>'+V.map((w,i)=>{ const on=mv>=1&&mem.includes(i), v=upd&&on?R.next.vin[i]:M.vin[i];
      return '<tr class="'+(on?'on':'')+(upd&&on?' upd':'')+'"><th>'+esc(w)+'</th>'+cell(v[0])+cell(v[1])+'</tr>'; }).join('')+'</tbody></table>';
    tabOut.innerHTML='<div class="tt">output table W<sub>out</sub>'+(showS?' · score u·h'+(mv===6?' (before the update)':mv>=7?' (new)':''):'')+'</div><table><tbody>'+V.map((w,i)=>{ const u=upd?R.next.vout[i]:M.vout[i], sc=mv>=7?R.after.scores[i]:R.scores[i];
      const pull=kind==='cbow'?i===R.target:tgt.includes(i);
      return '<tr class="'+(tgt.includes(i)?'tg':'')+(upd?(pull?' pull':' push'):'')+'"><th>'+esc(w)+'</th>'+cell(u[0])+cell(u[1])+(showS?'<td class="sc'+(mv===6?' stale':'')+'">'+N(sc)+'</td>':'')+'</tr>'; }).join('')+'</tbody></table>'; }
  function drawAll(){ drawRail(); drawIn(); drawOut(); drawProb(); drawTabs(); drawHud(); drawHist();
    $(P+'-back').disabled=st.ri===0&&st.move===0; }

  /* ---------- moving between moves and rounds ---------- */
  function go(mv,anim){ if(st._tw) st._tw.stop();
    if(mv>7){ nextRound(); mv=1; }
    if(mv<0){ if(st.ri>0){ st.ri--; mv=7; } else mv=0; }
    const prev=st.move; st.move=mv;
    if(anim&&(mv===6||mv===7)&&mv===prev+1&&!RMo){ st.a=0; tween(st,mv===6?950:650,a=>{ st.a=a; drawIn(); drawOut(); drawProb(); },()=>{ st.a=1; drawAll(); }); drawRail(); drawTabs(); drawHud(); drawHist(); }
    else { st.a=1; drawAll(); } }
  function nextRound(){ const R=cur().R; st.rounds=st.rounds.slice(0,st.ri+1); st.rounds.push({M:R.next,R:compute(R.next)}); st.ri++; }
  function another(){ if(st._tw) st._tw.stop(); if(st.move<6){ go(6,false); go(7,true); return; } nextRound(); st.move=5; go(6,true); clearTimeout(playT); playT=setTimeout(()=>{ playT=0; if(st.move===6) go(7,true); },RMo?0:1000); }
  let playT=0;
  function playAll(){ clearTimeout(playT); if(st.move>=7) { nextRound(); st.move=0; drawAll(); } const stepF=()=>{ playT=0; if(st.move>=7) return; go(st.move+1,true); if(st.move<7) playT=setTimeout(stepF,st.move===6?1150:650); }; stepF(); }
  $(P+'-next').addEventListener('click',()=>{ clearTimeout(playT); go(st.move+1,true); });
  $(P+'-back').addEventListener('click',()=>{ clearTimeout(playT); go(st.move-1,false); });
  $(P+'-all').addEventListener('click',playAll);
  $(P+'-more').addEventListener('click',()=>{ clearTimeout(playT); another(); });
  $(P+'-reset').addEventListener('click',()=>{ clearTimeout(playT); st.eta=1; st.win2=false; syncCtl(); start(); drawSent(); drawAll(); });
  rail.addEventListener('click',e=>{ const li=e.target.closest('li'); if(!li) return; clearTimeout(playT); const m=+li.dataset.m; go(m,m===st.move+1); });
  rail.addEventListener('keydown',e=>{ if(e.key!=='Enter'&&e.key!==' ') return; const li=e.target.closest('li'); if(!li) return; e.preventDefault(); const m=+li.dataset.m; go(m,m===st.move+1); });
  const etaIn=$(P+'-eta');
  etaIn.addEventListener('input',()=>{ st.eta=+etaIn.value; $(P+'-eta-o').textContent=N(st.eta); fillRange(etaIn); const r=cur(); r.R=compute(r.M); st.rounds=st.rounds.slice(0,st.ri+1); drawAll(); });
  const w2=$(P+'-win2'); if(w2) w2.addEventListener('change',()=>{ clearTimeout(playT); st.win2=w2.checked; start(); drawSent(); drawAll(); });
  function syncCtl(){ etaIn.value=st.eta; $(P+'-eta-o').textContent=N(st.eta); fillRange(etaIn); if(w2) w2.checked=st.win2; }
  start(); syncCtl(); drawSent(); drawAll();
  onRedraw(()=>drawAll()); watchWidth(root,()=>drawAll());
  return {state:()=>{ const {M,R}=cur(); return {kind,move:st.move,round:st.ri+1,eta:st.eta,win2:st.win2,model:E.cloneM(M),R,geo:st.geo,hud:hud.textContent,hist:histBox.textContent,animating:!!st._tw||!!playT}; },
    go:m=>go(m,false),next:()=>go(st.move+1,false),another:()=>{ if(st.move<6) go(7,false); else { nextRound(); go(7,false); } },
    reset:()=>{ st.eta=1; st.win2=false; syncCtl(); start(); drawSent(); drawAll(); },setEta(v){ etaIn.value=v; etaIn.dispatchEvent(new Event('input')); },
    setWin2(on){ if(!w2) return; w2.checked=on; w2.dispatchEvent(new Event('change')); }}; }
const CB=Machine('cbow'), SGW=Machine('sg');

/* ================= w-lab · CBOW vs skip-gram, raced (s11) ================= */
const LAB=(function(){ const root=$('w-lab'); if(!root) return null;
  const CORP=E.CORP, TOP=E.TOPICS, KINDS=['cbow','sg'];
  const TCOL={drinks:'s2',cricket:'s3',travel:'s7',food:'s4',little:'mut'};
  const TNAME={drinks:'drinks',cricket:'cricket',travel:'travel',food:'food',little:'little words'};
  const st={seed:1,C:2,k:5,eta:0.1,sub:false,speed:2,slow:false,rare:'kadak',playing:false,visible:true,L:null,maps:{},rec:null,msg:'',acc:0,lastT:0,lastSlow:0,lastDom:0};
  const colOf=w=>{ const t=CORP.topicOf[w]; return t?PAL[TCOL[t]]:PAL.mut; };
  const labIdx=CORP.labelled.map(w=>CORP.idx[w]);
  function newRace(msg){ st.L=E.makeLab({seed:st.seed,C:st.C,k:st.k,eta:st.eta,sub:st.sub}); st.maps={cbow:{},sg:{}}; st.rec=null; st.msg=msg||''; st.acc=0; drawAll(); }

  /* ---------- the map: a flat shadow (PCA) of the length-1 vectors, turned to follow the previous frame ---------- */
  function align(P,prev){ let sxx=0,sxy=0,fxx=0,fxy=0; labIdx.forEach((i,k)=>{ const a=prev[k], b=P[i]; sxx+=a[0]*b[0]+a[1]*b[1]; sxy+=a[1]*b[0]-a[0]*b[1]; fxx+=a[0]*b[0]-a[1]*b[1]; fxy+=a[1]*b[0]+a[0]*b[1]; });
    const r1=Math.hypot(sxx,sxy), r2_=Math.hypot(fxx,fxy); const flip=r2_>r1; const th=flip?Math.atan2(fxy,fxx):Math.atan2(sxy,sxx); return {c:Math.cos(th),s:Math.sin(th),flip}; }
  const applyRot=(p,R)=>{ const y=R.flip?-p[1]:p[1]; return [p[0]*R.c-y*R.s,p[0]*R.s+y*R.c]; };
  function drawMap(kind){ const cv=$('w2l-map-'+kind), ms=st.maps[kind], m=st.L[kind], L=st.L; if(!cv) return;
    const w=cv.parentElement.clientWidth, H=Math.round(Math.max(270,Math.min(440,w*.78))), {ctx}=fitCanvas(cv,H), W=w;
    const ax=E.shadowAxes(L,m); ms.ax=ax; const P0=E.project(L,m,ax);
    const R=ms.prev?align(P0,ms.prev):{c:1,s:0,flip:false}; const P=P0.map(p=>applyRot(p,R)); ms.rot=R; ms.prev=labIdx.map(i=>P[i]);
    let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity; labIdx.forEach(i=>{ const p=P[i]; x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); y0=Math.min(y0,p[1]); y1=Math.max(y1,p[1]); });
    const pad=34, tsc=Math.min((W-2*pad)/Math.max(1e-6,x1-x0),(H-2*pad)/Math.max(1e-6,y1-y0)), tcx=(x0+x1)/2, tcy=(y0+y1)/2;
    if(ms.sc==null||ms.snap){ ms.sc=tsc; ms.cx=tcx; ms.cy=tcy; ms.snap=false; } else { const k=.18; ms.sc+=(tsc-ms.sc)*k; ms.cx+=(tcx-ms.cx)*k; ms.cy+=(tcy-ms.cy)*k; }
    const px=p=>W/2+(p[0]-ms.cx)*ms.sc, py=p=>H/2-(p[1]-ms.cy)*ms.sc;
    const pts=P.map(p=>[px(p),py(p)]); ms.pts=pts; ms.W=W; ms.H=H; ms.kept=ax.kept;
    ctx.clearRect(0,0,W,H); const dark=!PAL.light;
    /* topic clouds: centred on each topic's words, as wide as their spread */
    Object.keys(TOP).forEach(t=>{ const ids=TOP[t].map(x=>CORP.idx[x]); let cx=0,cy=0; ids.forEach(i=>{ cx+=pts[i][0]/ids.length; cy+=pts[i][1]/ids.length; });
      let r=0; ids.forEach(i=>{ r+=((pts[i][0]-cx)**2+(pts[i][1]-cy)**2)/ids.length; }); r=Math.sqrt(r); const tight=Math.max(.1,Math.min(1,1.3-r/(.3*Math.min(W,H)))); r=Math.min(r+16,Math.max(W,H)*.45);
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.25); const c=PAL[TCOL[t]]; g.addColorStop(0,RGBA(c,(dark?.24:.18)*tight)); g.addColorStop(.6,RGBA(c,(dark?.09:.07)*tight)); g.addColorStop(1,RGBA(c,0));
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r*1.25,0,7); ctx.fill(); });
    /* the other words: faint dots */
    const isLab=new Set(labIdx); ctx.fillStyle=RGBA(PAL.mut,dark?.42:.5);
    pts.forEach((p,i)=>{ if(isLab.has(i)) return; ctx.beginPath(); ctx.arc(p[0],p[1],2,0,7); ctx.fill(); });
    /* highlight the words of the last slow-motion step */
    const rec=st.slow?st.rec:null, hiC=new Set(), hiM=new Set(); if(rec&&rec!==true){ rec.ctx.forEach(w=>hiC.add(w)); hiM.add(rec.centre); }
    hiC.forEach(i=>{ const p=pts[i]; ctx.beginPath(); ctx.arc(p[0],p[1],9,0,7); ctx.strokeStyle=RGBA(PAL.s3,.95); ctx.lineWidth=2; ctx.stroke(); });
    hiM.forEach(i=>{ const p=pts[i]; ctx.beginPath(); ctx.arc(p[0],p[1],11,0,7); ctx.strokeStyle=RGBA(PAL.s4,1); ctx.lineWidth=2.4; ctx.stroke(); });
    /* the labelled words */
    const order=CORP.labelled.slice().sort((a,b)=>prio(b)-prio(a));
    order.slice().reverse().forEach(w=>{ const i=CORP.idx[w], p=pts[i], t=CORP.topicOf[w], rare=w in E.RARE, little=t==='little', c=colOf(w), r=rare?5.4:little?3.4:4.8;
      if(dark&&!little){ ctx.save(); ctx.shadowColor=c; ctx.shadowBlur=9; }
      ctx.beginPath(); ctx.arc(p[0],p[1],r,0,7); ctx.fillStyle=little?RGBA(PAL.ink2,.85):c; ctx.fill(); if(dark&&!little) ctx.restore();
      if(rare){ ctx.beginPath(); ctx.arc(p[0],p[1],r+3.2,0,7); ctx.strokeStyle=w===st.rare?PAL.ink:RGBA(PAL.ink,.55); ctx.lineWidth=w===st.rare?1.8:1.2; ctx.stroke(); } });
    /* labels, most important first, never on top of each other */
    const Lr=st.L, pill=Lr.positions===0?'same random start for both':Lr.done?'after '+Lr.o.passes+' passes':'pass '+N(Math.min(Lr.o.passes,Lr.pass+Math.max(0,Lr.q+1)/CORP.S.length),1);
    ctx.font='700 11px '+PAL.ui; const pw_=ctx.measureText(pill).width+16;
    const boxes=[{x:6,y:6,w:pw_+4,h:24,dot:-1}], placed=[], slowPlaced=[]; labIdx.forEach(i=>{ const p=pts[i], q=CORP.vocab[i] in E.RARE?10:4.5; boxes.push({x:p[0]-q,y:p[1]-q,w:2*q,h:2*q,dot:i}); });
    ctx.textBaseline='middle';
    /* in slow motion the ringed words are named first (they may be words we do not label otherwise) */
    const ringed=[...hiM,...hiC].filter((i,k,a)=>a.indexOf(i)===k);
    ringed.forEach(i=>{ const p=pts[i], w=CORP.vocab[i], m=hiM.has(i); boxes.push({x:p[0]-(m?11:9),y:p[1]-(m?11:9),w:m?22:18,h:m?22:18,dot:i}); });
    ringed.forEach(i=>{ const p=pts[i], w=CORP.vocab[i], m=hiM.has(i), fs=12; ctx.font='800 '+fs+'px '+PAL.ui; const tw_=ctx.measureText(w).width, th=fs+2;
      for(const [dx,dy,al] of [[14,0,'l'],[-14,0,'r'],[0,-16,'c'],[0,16,'c'],[12,-12,'l'],[-12,-12,'r'],[12,12,'l'],[-12,12,'r'],[20,0,'l'],[-20,0,'r']]){ const bx=al==='l'?p[0]+dx:al==='r'?p[0]+dx-tw_:p[0]+dx-tw_/2, by=p[1]+dy-th/2, b={x:bx,y:by,w:tw_,h:th};
        if(b.x<2||b.y<2||b.x+b.w>W-2||b.y+b.h>H-2) continue; if(boxes.some(o=>o.dot!==i&&b.x<o.x+o.w&&b.x+b.w>o.x&&b.y<o.y+o.h&&b.y+b.h>o.y)) continue;
        boxes.push(b); slowPlaced.push({w,x:b.x,y:b.y,w_:b.w,h:b.h}); ctx.lineWidth=3.2; ctx.strokeStyle=RGBA(PAL.page,.9); ctx.lineJoin='round'; ctx.strokeText(w,b.x,b.y+th/2); ctx.fillStyle=m?PAL.s4:PAL.s3; ctx.fillText(w,b.x,b.y+th/2); break; } });
    const ringedSet=new Set(ringed);
    order.forEach(w=>{ const i=CORP.idx[w], p=pts[i], t=CORP.topicOf[w], rare=w in E.RARE, little=t==='little'; if(ringedSet.has(i)) return;
      const fs=rare?12.5:little?11:11.5; ctx.font=(rare?'800 ':little?'500 ':'650 ')+fs+'px '+PAL.ui; const tw_=ctx.measureText(w).width, th=fs+2;
      const cands=[[8,0,'l'],[-8,0,'r'],[0,-11,'c'],[0,11,'c'],[7,-9,'l'],[-7,-9,'r'],[7,9,'l'],[-7,9,'r'],[12,0,'l'],[-12,0,'r'],[0,-16,'c'],[0,16,'c']];
      for(const [dx,dy,al] of cands){ const bx=al==='l'?p[0]+dx:al==='r'?p[0]+dx-tw_:p[0]+dx-tw_/2, by=p[1]+dy-th/2, b={x:bx,y:by,w:tw_,h:th};
        if(b.x<2||b.y<2||b.x+b.w>W-2||b.y+b.h>H-2) continue;
        /* keep a small gap (3 px across, 1 px down) so two names never run into each other ("sabzi"+"train") */
        if(boxes.some(o=>o.dot!==i&&b.x<o.x+o.w+3&&b.x+b.w+3>o.x&&b.y<o.y+o.h+1&&b.y+b.h+1>o.y)) continue;
        boxes.push(b); placed.push({w,x:b.x,y:b.y,w_:b.w,h:b.h});
        ctx.lineWidth=3; ctx.strokeStyle=RGBA(PAL.page,dark?.85:.9); ctx.lineJoin='round'; ctx.strokeText(w,b.x,b.y+th/2);
        ctx.fillStyle=little?PAL.mut:rare?PAL.ink:colOf(w); ctx.fillText(w,b.x,b.y+th/2); break; } });
    ms.labels=placed; ms.hidden=CORP.labelled.filter(w=>!placed.some(q=>q.w===w)); ms.slowLabels=slowPlaced;
    /* where the race is, at a glance */
    ctx.font='700 11px '+PAL.ui; ctx.fillStyle=RGBA(PAL.page,PAL.light?.8:.72); rr(ctx,8,8,pw_,20,10); ctx.fill(); ctx.strokeStyle=RGBA(kind==='cbow'?PAL.s6:PAL.s5,.6); ctx.lineWidth=1; rr(ctx,8.5,8.5,pw_-1,19,9.5); ctx.stroke();
    ctx.fillStyle=kind==='cbow'?PAL.s6:PAL.s5; ctx.textBaseline='middle'; ctx.fillText(pill,16,18.5); ms.pill={x:8,y:8,w:pw_,h:20,text:pill};
    /* the corner note: how much of the spread this shadow keeps */
    ctx.font='500 11px '+PAL.ui; ctx.fillStyle=PAL.mut; ctx.textBaseline='alphabetic'; ctx.textAlign='right'; ctx.fillText('shadow keeps '+Math.round(ax.kept*100)+'% of the spread',W-8,H-7); ctx.textAlign='left'; }
  const prio=w=>{ if(w in E.RARE) return 100+(w===st.rare?5:0); if(w==='chai') return 90; const t=CORP.topicOf[w]; if(t==='little') return 10+CORP.count[CORP.idx[w]]/100; return 50+CORP.count[CORP.idx[w]]/100; };

  /* ---------- numbers under each map ---------- */
  function statHTML(kind){ const m=st.L[kind], sc=E.topicScore(st.L,m).score, loss=m.passN?m.passLoss/m.passN:(m.lossN?m.lossSum/m.lossN:null);
    const cell=(k,v,t)=>'<div class="w2l-stat" title="'+t+'"><span class="k">'+k+'</span><span class="v">'+v+'</span></div>';
    return cell('guesses',commas(m.preds),'predictions made (one per CBOW position, one per skip-gram pair)')+cell('dot products',commas(m.dots),'the work: k + 1 per guess')+cell('loss',loss==null?'—':N(loss,3),'average surprise per guess in this pass')+cell('topic score',N(sc,3),'mean cosine inside a topic minus mean cosine across topics'); }
  function nbHTML(kind,w){ const m=st.L[kind], t=CORP.topicOf[w], f=E.wordFit(st.L,m,w), nb=E.neighbours(st.L,m,w,5);
    const fitS=(f.fit>=0?'+':'')+NF(f.fit,2);
    return '<div class="w2l-nb" data-w="'+w+'"><div class="t"><span><b>'+w+'</b> seen '+CORP.count[CORP.idx[w]]+'×'+(w in E.RARE?' (rare)':'')+'</span></div><div class="fit" style="color:var(--'+(TCOL[t]==='mut'?'ink-muted':TCOL[t])+')" title="mean cosine to the other '+t+' words − mean cosine to the other topics’ words">fits '+t+' '+fitS+'</div><ol>'+
      nb.map(([x,c])=>{ const tt=CORP.topicOf[x]; return '<li class="'+(tt===t?'':'off')+'"><i style="background:'+colOf(x)+'"></i><span>'+esc(x)+'</span><em>'+N(c,2)+'</em></li>'; }).join('')+'</ol></div>'; }
  function drawSide(kind){ $('w2l-st-'+kind).innerHTML=statHTML(kind); $('w2l-nb-'+kind).innerHTML=nbHTML(kind,'chai')+nbHTML(kind,st.rare); }
  function drawProg(){ const L=st.L, x=Math.min(L.o.passes,L.pass+(L.done?0:Math.max(0,L.q+1)/CORP.S.length)), pct=x/L.o.passes*100;
    const words=L.positions;
    $('w2l-prog').innerHTML='<span>pass <b>'+N(x,1)+'</b> of '+L.o.passes+'</span><span class="bar"><i style="width:'+pct.toFixed(1)+'%"></i></span><span>step size now <b>'+N(E.alphaNow(L),3)+'</b></span>'+
      '<span>ratio of work <b>'+(L.cbow.dots?N(L.sg.dots/L.cbow.dots,2)+'×':'—')+'</b></span>'+(L.done?'<span class="msg">finished — '+commas(words)+' words read by each model</span>':st.msg?'<span class="msg">'+esc(st.msg)+'</span>':''); }

  /* ---------- the three charts ---------- */
  function chart(id,get,o,snapNow){ const cv=$(id); if(!cv) return; const {ctx,w,h}=fitCanvas(cv,o.h||150), L=st.L, H=L.hist.concat([snapNow]);
    const l=42,r=o.r||104,t=8,b=32, pw=w-l-r, ph=h-t-b, X1=L.o.passes; let Y0=o.y0!=null?o.y0:Infinity, Y1=-Infinity;
    H.forEach(p=>KINDS.forEach(k=>{ const v=get(p[k]); if(v==null||!isFinite(v)) return; Y0=Math.min(Y0,v); Y1=Math.max(Y1,v); })); if(o.y1!=null) Y1=Math.max(Y1,o.y1); if(!(Y1>Y0)) Y1=Y0+1;
    const nice=sp=>{ const raw=sp/4, p=Math.pow(10,Math.floor(Math.log10(raw))), m=raw/p; return (m<1.5?1:m<3?2:m<7?5:10)*p; }, stp=nice(Y1-Y0); Y0=Math.floor(Y0/stp)*stp; Y1=Math.ceil(Y1/stp)*stp;
    const X=x=>l+x/X1*pw, Y=v=>t+ph-(v-Y0)/(Y1-Y0)*ph;
    ctx.clearRect(0,0,w,h); ctx.font='500 11px '+PAL.ui; ctx.fillStyle=PAL.mut; ctx.strokeStyle=RGBA(PAL.ink,PAL.light?.08:.07); ctx.lineWidth=1;
    for(let v=Y0;v<=Y1+1e-9;v+=stp){ const y=Y(v); ctx.beginPath(); ctx.moveTo(l,y); ctx.lineTo(l+pw,y); ctx.stroke(); ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText(o.fmt?o.fmt(v):N(v,2),l-5,y); }
    for(let x=0;x<=X1;x+=10){ const xx=X(x); ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(String(x),xx,t+ph+5); }
    ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.fillText('passes over the text',l+pw,h-2);
    const ends=[];
    KINDS.forEach(k=>{ const c=k==='cbow'?PAL.s6:PAL.s5; ctx.beginPath(); let started=false, last=null; H.forEach(p=>{ const v=get(p[k]); if(v==null||!isFinite(v)) return; const xx=X(p.x), yy=Y(v); if(!started){ ctx.moveTo(xx,yy); started=true; } else ctx.lineTo(xx,yy); last=[xx,yy,v]; });
      ctx.strokeStyle=c; ctx.lineWidth=2.2; if(!PAL.light){ ctx.save(); ctx.shadowColor=c; ctx.shadowBlur=6; ctx.stroke(); ctx.restore(); } else ctx.stroke(); if(last){ ctx.beginPath(); ctx.arc(last[0],last[1],3,0,7); ctx.fillStyle=c; ctx.fill(); ends.push({k,c,x:last[0],y:last[1],v:last[2]}); } });
    /* end labels, pushed apart if they collide */
    /* clamp into the plot first, then separate (so two labels that both sit on the floor, e.g. at 0, still get 13 px apart) */
    const lyLo=t+5, lyHi=t+ph-2; ends.forEach(e=>{ e.ly=Math.max(lyLo,Math.min(lyHi,e.y)); });
    ends.sort((a,b)=>a.ly-b.ly); if(ends.length===2&&ends[1].ly-ends[0].ly<13){ const m=Math.max(lyLo+6.5,Math.min(lyHi-6.5,(ends[0].ly+ends[1].ly)/2)); ends[0].ly=m-6.5; ends[1].ly=m+6.5; }
    ctx.font='700 11px '+PAL.ui; ctx.textAlign='left'; ctx.textBaseline='middle';
    ends.forEach(e=>{ ctx.fillStyle=e.c; ctx.fillText((e.k==='cbow'?'CBOW ':'skip-gram ')+(o.fmt?o.fmt(e.v):N(e.v,2)),Math.min(e.x+6,l+pw+4),e.ly); });
    st['ch_'+id]={Y0,Y1,X1,l,t,pw,ph,ends:ends.map(e=>({k:e.k,v:e.v}))}; }
  const kfmt=v=>v>=1000?N(v/1000,v>=10000?0:1)+'k':N(v,0);
  function drawCharts(){ const sn=E.snap(st.L); chart('w2l-ch-score',s=>s.score,{y0:0,y1:.5},sn); chart('w2l-ch-work',s=>s.dots,{y0:0,y1:4000,fmt:kfmt,r:112},sn); chart('w2l-ch-loss',s=>s.loss,{y0:0,y1:1},sn); }

  /* ---------- slow motion: the examples each model makes from one sentence ---------- */
  function drawSlow(){ const box=$('w2l-slowbox'); if(!st.slow){ box.hidden=true; return; } box.hidden=false; const rec=st.rec&&st.rec!==true?st.rec:null, L=st.L, V=CORP.vocab;
    if(!rec){ box.innerHTML='<div class="srow"><span class="w2-lbl">slow motion</span><span>Press <b>▶ race</b> or <b>step ▸</b>: the models read one word at a time, and you see every guess each one makes.</span></div>'; return; }
    const t=rec.sentence, dropped=L.cur&&L.cur.full.length>t.length?L.cur.full.filter((_,j)=>!L.cur.orig.includes(j)).map(i=>V[i]):[];
    const sent=t.map((w,j)=>'<span class="w2-tok'+(j===rec.i?' m':rec.ctxPos.includes(j)?' c':'')+'">'+esc(V[w])+'</span>').join('');
    const negs=r=>'<span class="neg">noise: '+r.negs.map(x=>'<s>'+esc(V[x])+'</s>').join(' ')+(r.skipped?' <i>('+r.skipped+' skipped: drew the true word)</i>':'')+'</span>';
    const cbL=rec.cbow?'<div class="ex">'+rec.ctx.map(x=>'<span class="w2-tok c">'+esc(V[x])+'</span>').join('')+'<span class="w2-arr">→</span><span class="w2-tok m">'+esc(V[rec.centre])+'</span></div>'+negs(rec.cbow):'<div class="fine">no neighbours — no guess</div>';
    const sgL=rec.sg.length?rec.sg.map(r=>'<div class="ex"><span class="w2-tok m">'+esc(V[rec.centre])+'</span><span class="w2-arr">→</span><span class="w2-tok c">'+esc(V[r.target])+'</span> '+negs(r)+'</div>').join(''):'<div class="fine">no neighbours — no guess</div>';
    const dcb=rec.cbow?rec.cbow.negs.length+1:0, dsg=rec.sg.reduce((a,r)=>a+r.negs.length+1,0);
    box.innerHTML='<div class="srow"><span class="w2-lbl">now reading</span>'+sent+(dropped.length?'<span class="fine">subsampling dropped: '+dropped.map(esc).join(', ')+'</span>':'')+'</div>'+
      '<div class="lanes"><div class="lane" data-k="cbow"><div class="t"><span>CBOW · 1 guess</span><b>'+dcb+' dot products</b></div>'+cbL+'</div>'+
      '<div class="lane" data-k="sg"><div class="t"><span>skip-gram · '+rec.sg.length+' guess'+(rec.sg.length===1?'':'es')+'</span><b>'+dsg+' dot products</b></div>'+sgL+'</div></div>'+
      '<div class="fine">On the maps: the middle word is ringed in gold, its neighbours in green. CBOW nudges the neighbours’ vectors (a share each); skip-gram nudges the middle word’s vector (in full, once per neighbour). Each guess also asks k = '+L.o.k+' random “noise” words to score low.</div>'; }
  function drawLegend(){ const d=t=>'<span><i class="ld" style="background:var(--'+(TCOL[t]==='mut'?'ink-2':TCOL[t])+')"></i>'+TNAME[t]+'</span>';
    $('w2l-legend').innerHTML=['drinks','cricket','travel','food','little'].map(d).join('')+'<span><i class="ld" style="background:none;border:1.5px solid var(--ink)"></i>ring: a rare word (kadak, googly — 3 sightings each)</span><span><i class="ld" style="background:var(--ink-muted);width:.35rem;height:.35rem"></i>the other 80 words</span><span><i class="lp" style="background:var(--s6)"></i>CBOW</span><span><i class="lp" style="background:var(--s5)"></i>skip-gram</span>'; }
  function drawAll(){ KINDS.forEach(k=>{ drawMap(k); drawSide(k); }); drawProg(); drawCharts(); drawSlow(); syncBtns(); }
  function drawLive(){ KINDS.forEach(drawMap); const t=now(); if(t-st.lastDom>180){ st.lastDom=t; KINDS.forEach(drawSide); drawProg(); drawCharts(); drawSlow(); } }

  /* ---------- the race loop: time-sliced (≤ 8 ms of training per frame), paused while off-screen ---------- */
  let raf=0; const kick=()=>{ if(!raf) raf=requestAnimationFrame(loop); };
  const SLOW_MS={1:1800,2:1150,4:650,8:320};
  function loop(){ raf=0; if(!st.playing||!st.visible) return; const t=now(), dt=Math.min(60,st.lastT?t-st.lastT:16); st.lastT=t; const L=st.L; st.frames=st.frames||[];
    if(st.slow){ if(t-st.lastSlow>=SLOW_MS[st.speed]){ st.lastSlow=t; st.rec=E.stepPosition(L,true)||st.rec; KINDS.forEach(drawMap); KINDS.forEach(drawSide); drawProg(); drawCharts(); drawSlow(); } }
    else { st.acc+=st.speed*CORP.N*dt/1000; const t0=now(); while(st.acc>=1&&!L.done&&now()-t0<8){ const n=Math.min(Math.floor(st.acc),40); E.runPositions(L,n); st.acc-=n; } if(st.acc>40) st.acc=40; drawLive(); }
    st.frames.push(now()-t); if(st.frames.length>240) st.frames.shift();
    if(L.done){ st.playing=false; st.acc=0; drawAll(); return; } kick(); }
  const playBtn=$('w2l-play');
  function syncBtns(){ const L=st.L; playBtn.textContent=st.playing?'❚❚ pause':L&&L.done?'↺ race again':L&&L.positions>0?'▶ go on':'▶ race'; playBtn.classList.toggle('on',st.playing); $('w2l-seed-v').textContent=st.seed; }
  function play(){ if(st.playing){ st.playing=false; syncBtns(); return; }
    if(st.L.done) newRace('');
    if(RMo&&!st.slow){ E.finish(st.L); KINDS.forEach(k=>st.maps[k].snap=true); drawAll(); return; }
    st.playing=true; st.lastT=0; st.lastSlow=0; syncBtns(); kick(); }
  playBtn.addEventListener('click',play);
  $('w2l-step').addEventListener('click',()=>{ st.playing=false; const L=st.L; if(L.done) return; if(st.slow) st.rec=E.stepPosition(L,true)||st.rec; else { E.stepSentence(L); } drawAll(); });
  $('w2l-reset').addEventListener('click',()=>{ st.playing=false; newRace(''); });
  $('w2l-seed').addEventListener('click',()=>{ st.playing=false; st.seed=st.seed%99+1; newRace('new random start: seed '+st.seed); });
  const slowIn=$('w2l-slow'); slowIn.addEventListener('change',()=>{ st.slow=slowIn.checked; st.lastSlow=0; drawAll(); });
  const spHost=$('w2l-speed'); spHost.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; st.speed=+b.dataset.v; pressSeg(spHost,st.speed); });
  const rareHost=$('w2l-rare'); rareHost.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; st.rare=b.dataset.v; pressSeg(rareHost,st.rare); drawAll(); });
  function setting(id,key,fmt,label){ const r=$(id); r.addEventListener('input',()=>{ st[key]=+r.value; $(id+'-o').textContent=fmt(st[key]); fillRange(r); st.playing=false; newRace('new race: '+label+' '+fmt(st[key])); }); }
  setting('w2l-c','C',v=>String(v),'window'); setting('w2l-k','k',v=>String(v),'k ='); setting('w2l-eta','eta',v=>N(v,2),'step size');
  const subIn=$('w2l-sub'); subIn.addEventListener('change',()=>{ st.sub=subIn.checked; st.playing=false; newRace(st.sub?'new race: subsampling on (the little words thin out)':'new race: subsampling off'); });
  /* hover: name any dot */
  KINDS.forEach(k=>{ const cv=$('w2l-map-'+k), tip=document.createElement('div'); tip.className='w2l-tip'; tip.hidden=true; cv.parentElement.appendChild(tip);
    cv.addEventListener('pointermove',e=>{ const ms=st.maps[k]; if(!ms.pts) return; const r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top; let bi=-1,bd=11;
      ms.pts.forEach((p,i)=>{ const d=Math.hypot(p[0]-x,p[1]-y); if(d<bd){ bd=d; bi=i; } }); if(bi<0){ tip.hidden=true; return; }
      const w=CORP.vocab[bi], t=CORP.topicOf[w]; tip.textContent=w+(t&&t!=='little'?' · '+t:'')+' · seen '+CORP.count[bi]+'×'; tip.style.left=ms.pts[bi][0]+'px'; tip.style.top=ms.pts[bi][1]+'px'; tip.hidden=false; });
    cv.addEventListener('pointerleave',()=>{ tip.hidden=true; }); });
  if('IntersectionObserver' in window) new IntersectionObserver(es=>es.forEach(e=>{ st.visible=e.isIntersecting; if(st.visible&&st.playing){ st.lastT=0; kick(); } }),{rootMargin:'200px 0px'}).observe(root);
  onRedraw(()=>{ KINDS.forEach(k=>st.maps[k].snap=true); drawAll(); });
  watchWidth(root,()=>{ KINDS.forEach(k=>st.maps[k].snap=true); drawAll(); });
  [ 'w2l-c','w2l-k','w2l-eta' ].forEach(id=>fillRange($(id)));
  newRace(''); drawLegend();
  return {get L(){ return st.L; }, st, get looping(){ return raf!==0; },
    state:()=>{ const L=st.L, f=k=>{ const m=L[k]; return {preds:m.preds,dots:m.dots,loss:m.passN?m.passLoss/m.passN:null,score:E.topicScore(L,m).score,
        fit:{chai:E.wordFit(L,m,'chai').fit,kadak:E.wordFit(L,m,'kadak').fit,googly:E.wordFit(L,m,'googly').fit},nb:{chai:E.neighbours(L,m,'chai',5),rare:E.neighbours(L,m,st.rare,5)},
        map:{ax:st.maps[k].ax,rot:st.maps[k].rot,sc:st.maps[k].sc,cx:st.maps[k].cx,cy:st.maps[k].cy,W:st.maps[k].W,H:st.maps[k].H,pts:st.maps[k].pts,labels:st.maps[k].labels,hidden:st.maps[k].hidden}}; };
      return {seed:st.seed,C:st.C,k:st.k,eta:st.eta,sub:st.sub,speed:st.speed,slow:st.slow,rare:st.rare,playing:st.playing,pass:L.pass,positions:L.positions,done:L.done,cbow:f('cbow'),sg:f('sg'),rec:st.rec&&st.rec!==true?st.rec:null,hist:L.hist.length,charts:{score:st['ch_w2l-ch-score'],work:st['ch_w2l-ch-work'],loss:st['ch_w2l-ch-loss']}}; },
    finish(){ st.playing=false; E.finish(st.L); KINDS.forEach(k=>st.maps[k].snap=true); drawAll(); },
    runPasses(n){ st.playing=false; const L=st.L, target=Math.min(L.o.passes,L.pass+n); while(!L.done&&L.pass<target) E.runPositions(L,100); drawAll(); },
    redraw:drawAll}; })();

/* ================= test hooks ================= */
window.U16W2V={engine:E,window:WIN,cbow:CB,skipgram:SGW,lab:LAB};

})();
