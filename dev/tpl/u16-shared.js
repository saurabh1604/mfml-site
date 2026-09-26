/* ================= UNIT 16 · the unit's shared maths, data and colour language ================= */
/* colour language (shared with Units 17–18): words s1 · context s3 · probability s6 · loss critical · weights/gold s4.
   The word groups get their own hues: tea s2 · cricket s3 · people s7 · animals s4 · places s6 · travel s7 · the two-faced "bat" s5 */
const K16={word:'s1',ctx:'s3',prob:'s6',loss:'critical',gold:'s4',tea:'s2',cricket:'s3',people:'s7',animal:'s4',place:'s6',bat:'s5',sport:'s3',travel:'s7'};
const cv=k=>k==='critical'?'var(--critical)':'var(--'+k+')';
/* numbers: integers print bare, others trimmed; always a real minus sign */
const N=(v,d)=>{ if(!isFinite(v)) return v>0?'∞':'−∞'; if(Math.abs(v)<5e-13) return '0'; const r=Math.round(v); if(Math.abs(v-r)<1e-9) return nm(String(r)); return trim(F(v,d==null?4:d)); };
const vecN=(v,d)=>'('+v.map(x=>N(x,d)).join(', ')+')';
const tone=(k,t)=>`<b style="color:${cv(k)}">${t}</b>`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const commas=n=>nm(Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,','));

/* ---- small linear algebra ---- */
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>Math.sqrt(dot(a,a));
const cosSim=(a,b)=>{ const na=norm(a), nb=norm(b); return na<1e-12||nb<1e-12?0:dot(a,b)/(na*nb); };
const vadd=(a,b)=>a.map((x,i)=>x+b[i]), vsub=(a,b)=>a.map((x,i)=>x-b[i]), vscale=(a,k)=>a.map(x=>x*k);
const sigm=z=>1/(1+Math.exp(-z));
function softmax(z){ const m=Math.max(...z), e=z.map(v=>Math.exp(v-m)), s=e.reduce((a,b)=>a+b,0); return e.map(v=>v/s); }
/* symmetric eigen-decomposition by cyclic Jacobi rotations: returns {vals (descending), vecs (columns)} */
function symEig(A0){ const n=A0.length, A=A0.map(r=>r.slice()), V=A.map((_,i)=>A.map((_,j)=>i===j?1:0));
  for(let sweep=0;sweep<80;sweep++){ let off=0; for(let p=0;p<n;p++) for(let q=p+1;q<n;q++) off+=A[p][q]*A[p][q]; if(off<1e-22) break;
    for(let p=0;p<n;p++) for(let q=p+1;q<n;q++){ if(Math.abs(A[p][q])<1e-300) continue;
      const th=(A[q][q]-A[p][p])/(2*A[p][q]), t=Math.sign(th||1)/(Math.abs(th)+Math.sqrt(th*th+1)), c=1/Math.sqrt(t*t+1), s=t*c;
      for(let k=0;k<n;k++){ const akp=A[k][p], akq=A[k][q]; A[k][p]=c*akp-s*akq; A[k][q]=s*akp+c*akq; }
      for(let k=0;k<n;k++){ const apk=A[p][k], aqk=A[q][k]; A[p][k]=c*apk-s*aqk; A[q][k]=s*apk+c*aqk; }
      for(let k=0;k<n;k++){ const vkp=V[k][p], vkq=V[k][q]; V[k][p]=c*vkp-s*vkq; V[k][q]=s*vkp+c*vkq; } } }
  const idx=A.map((_,i)=>i).sort((i,j)=>A[j][j]-A[i][i]);
  return {vals:idx.map(i=>A[i][i]), vecs:V.map(r=>idx.map(i=>r[i]))}; }
/* SVD of a (rows × cols) matrix through the eigenvectors of MᵀM. coords[k] = the rows' first k coordinates, U_k Σ_k = M V_k.
   Signs are a free choice: we flip each direction so that its biggest coordinate is positive. */
function svdRows(M){ const r=M.length, c=M[0].length, MtM=Array.from({length:c},(_,i)=>Array.from({length:c},(_,j)=>{ let s=0; for(let k=0;k<r;k++) s+=M[k][i]*M[k][j]; return s; }));
  const {vals,vecs}=symEig(MtM), S=vals.map(v=>Math.sqrt(Math.max(0,v)));
  const Vc=Array.from({length:c},(_,j)=>vecs.map(row=>row[j]));
  const P=Vc.map(v=>M.map(row=>dot(row,v)));                     /* P[j][i] = coordinate of row i on direction j */
  P.forEach((col,j)=>{ let big=0; col.forEach(x=>{ if(Math.abs(x)>Math.abs(big)) big=x; }); if(big<0){ P[j]=col.map(x=>-x); Vc[j]=Vc[j].map(x=>-x); } });
  const energy=S.map((_,k)=>S.slice(0,k+1).reduce((a,s)=>a+s*s,0)/S.reduce((a,s)=>a+s*s,0));
  return {S, V:Vc, coord:i=>P.map(col=>col[i]), energy}; }
/* positive pointwise mutual information: how much more often than chance, in bits, kept only when positive */
function ppmi(M){ const tot=M.flat().reduce((a,b)=>a+b,0), rs=M.map(r=>r.reduce((a,b)=>a+b,0)), cs=M[0].map((_,j)=>M.reduce((a,r)=>a+r[j],0));
  return M.map((r,i)=>r.map((x,j)=>x>0?Math.max(0,Math.log2(x*tot/(rs[i]*cs[j]))):0)); }
function rng16(seed){ let s=(seed>>>0)||1; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }

/* ================= the unit's small worlds (all hand-made, and the page says so) ================= */
/* every widget registers itself here: window.U16['w-…'] = {state(), …} — the verify suite reads the numbers the picture was drawn from */
const U16=window.U16=window.U16||{};
const BOS='<s>', EOS='</s>';
/* §2 · the bigram corpus (the markers are added to every line by the widget) */
const BIGRAM_DEFAULT='I drink chai\nI drink coffee\nI drink chai\nI play cricket';
/* §3 · the row for "drink" and the unigram adviser (16 tokens after the <s> markers) */
const SM_WORDS=['I','drink','chai','coffee','play','cricket',EOS];
const SM_ROW={chai:2,coffee:1}, SM_N=3;
const SM_UNI={I:4,drink:3,chai:2,coffee:1,play:1,cricket:1,[EOS]:4}, SM_UNI_N=16;
function smoothRow(mode,V,k,lam){ const p={}; let kept=0;
  SM_WORDS.forEach(w=>{ const c=SM_ROW[w]||0; let x;
    if(mode==='mle') x=c/SM_N; else if(mode==='add1') x=(c+1)/(SM_N+V); else if(mode==='addk') x=(c+k)/(SM_N+k*V); else x=lam*c/SM_N+(1-lam)*SM_UNI[w]/SM_UNI_N;
    p[w]=x; if(c>0) kept+=x; });
  const nOther=mode==='interp'?0:Math.max(0,V-SM_WORDS.length), each=mode==='mle'||mode==='interp'?0:(mode==='add1'?1/(SM_N+V):k/(SM_N+k*V));
  const sum=SM_WORDS.reduce((a,w)=>a+p[w],0)+nOther*each;
  return {p,others:{n:nOther,each,total:nOther*each},sum,kept,moved:1-kept}; }
/* §4 · the co-occurrence corpus: with a window of 2 it gives exactly the 4 × 4 table worked by hand */
const CO_TARGETS=['chai','coffee','cricket','football'], CO_CTX=['drink','hot','play','match'];
const CO_SENT=['we drink hot chai','we drink hot chai','they drink hot chai','I drink hot chai','drink your chai','match day chai','chai before every match',
  'we drink hot coffee','they drink hot coffee','we drink hot coffee','I drink hot coffee','hot coffee please',
  'we play cricket match','they play cricket match','we play cricket match','kids play cricket match','play cricket daily',
  'we play football match','they play football match','kids play football match','we play football match','a big football match','a hot football day'];
function coCounts(win){ const M=CO_TARGETS.map(()=>CO_CTX.map(()=>0));
  CO_SENT.forEach(s=>{ const w=s.split(' '); w.forEach((a,i)=>{ const r=CO_TARGETS.indexOf(a); if(r<0) return;
    for(let j=Math.max(0,i-win);j<=Math.min(w.length-1,i+win);j++){ const c=CO_CTX.indexOf(w[j]); if(j!==i&&c>=0) M[r][c]++; } }); }); return M; }
const CO4=[[5,4,0,1],[4,5,0,0],[0,0,5,4],[0,1,4,5]];

/* §5 · four tiny documents (hand-written): by neighbours chai is like coffee, by documents it is like kettle */
const CD_DOCS=[['at home','we put the kettle on the stove . the kettle boils . we drink hot chai with milk'],['the tea stall','the kettle sings at the stall . a cup of hot chai . we drink hot chai'],
  ['the café','we drink hot coffee . a cup of hot coffee with milk'],['the match','we play cricket at the park . the cricket match is on']];
const CD_T=['chai','coffee','kettle','cricket'];
function cdTables(win){ const docs=CD_DOCS.map(d=>d[1].split(' ').filter(w=>w!=='.')), sents=CD_DOCS.flatMap(d=>d[1].split(' . ').map(x=>x.split(' ')));
  const TD=CD_T.map(w=>docs.map(d=>d.filter(x=>x===w).length));
  const vocab=[...new Set(sents.flat())].sort(), NB=CD_T.map(()=>vocab.map(()=>0));
  sents.forEach(s=>s.forEach((w,i)=>{ const r=CD_T.indexOf(w); if(r<0) return; for(let j=Math.max(0,i-win);j<=Math.min(s.length-1,i+win);j++) if(j!==i) NB[r][vocab.indexOf(s[j])]++; }));
  return {TD,NB,vocab}; }
/* §6 · the PMI table (40 counted pairs) and the three TF-IDF documents */
const PM_R=['chai','cricket'], PM_C=['hot','the','match'], PM_M0=[[8,10,2],[2,10,8]];
function pmiSteps(M){ const N=M.flat().reduce((a,b)=>a+b,0), rs=M.map(r=>r.reduce((a,b)=>a+b,0)), cs=M[0].map((_,j)=>M.reduce((a,r)=>a+r[j],0));
  const E=M.map((r,i)=>r.map((_,j)=>N?rs[i]*cs[j]/N:0)), R=M.map((r,i)=>r.map((x,j)=>E[i][j]>0?x/E[i][j]:NaN));
  const P=R.map(r=>r.map(x=>x>0?Math.log2(x):(x===0?-Infinity:NaN))), PP=P.map(r=>r.map(x=>isFinite(x)?Math.max(0,x):(x===-Infinity?0:NaN)));
  return {N,rs,cs,E,R,P,PP}; }
const TF_DOCS=[{n:'D1',w:{the:3,chai:2,hot:1}},{n:'D2',w:{the:2,cricket:3}},{n:'D3',w:{the:1,chai:1,cricket:1}}], TF_W=['the','chai','hot','cricket'];
function tfidf(){ const N=TF_DOCS.length, tf=TF_W.map(w=>TF_DOCS.map(d=>d.w[w]||0)), df=tf.map(r=>r.filter(x=>x>0).length), idf=df.map(d=>d?Math.log10(N/d):0);
  return {N,tf,df,idf,W:tf.map((r,i)=>r.map(x=>x*idf[i]))}; }
/* §7 · friends of friends: chai and tea never meet, coffee meets both */
const FR_W=['chai','tea','coffee','cricket','football'], FR_C=['drink','hot','cup','kettle','play','match','bat'];
const FR_M=[[4,4,0,0,0,0,0],[0,0,4,4,0,0,0],[3,3,3,3,0,0,0],[0,0,0,0,4,4,0],[0,0,0,0,0,4,4]];
const FR=(function(){ const c=FR_C.length, MtM=Array.from({length:c},(_,i)=>Array.from({length:c},(_,j)=>FR_M.reduce((s,r)=>s+r[i]*r[j],0)));
  const {vals,vecs}=symEig(MtM), S=vals.map(v=>Math.sqrt(Math.max(0,v))), V=Array.from({length:c},(_,j)=>vecs.map(r=>r[j]));
  /* fix the free signs: direction 1 gives coffee +, direction 2 cricket +, direction 3 tea +, direction 4 football + */
  const anchor=[2,3,1,4]; for(let j=0;j<4;j++){ if(dot(FR_M[anchor[j]],V[j])<0) V[j]=V[j].map(x=>-x); }
  const coord=(i,k)=>V.slice(0,k).map(v=>dot(FR_M[i],v));
  const rebuilt=k=>FR_M.map((row,i)=>FR_C.map((_,j)=>V.slice(0,k).reduce((s,v)=>s+dot(row,v)*v[j],0)));
  const energy=k=>S.slice(0,k).reduce((a,x)=>a+x*x,0)/S.reduce((a,x)=>a+x*x,0);
  return {S,V,coord,rebuilt,energy}; })();

/* §5 · a bigger toy table: 16 words × 12 neighbour words (made up, like a tiny newspaper) */
const SV_W=['chai','coffee','milk','sugar','cup','cricket','football','bat','ball','goal','wicket','train','bus','ticket','station','platform'];
const SV_G=['tea','tea','tea','tea','tea','sport','sport','sport','sport','sport','sport','travel','travel','travel','travel','travel'];
const SV_C=['the','drink','hot','sweet','morning','play','match','team','score','ride','late','fare'];
const SV_M=[[9,6,5,3,4,0,1,0,0,0,0,0],[8,5,6,1,4,0,0,0,0,0,1,0],[7,5,3,2,2,0,0,0,0,0,0,0],[6,2,1,6,1,0,0,0,0,0,0,0],[9,4,4,1,2,0,1,0,0,0,0,0],
  [9,0,0,0,1,6,5,4,4,0,0,0],[8,0,1,0,0,6,6,5,3,0,0,0],[7,0,0,0,0,4,2,1,2,0,0,0],[8,0,0,0,0,5,3,2,1,0,0,0],[6,0,0,0,0,2,3,3,5,0,0,0],[7,0,0,0,0,3,4,1,3,0,0,0],
  [9,0,0,0,4,0,0,0,0,5,6,3],[8,0,0,0,3,0,0,0,0,6,4,4],[7,0,0,0,0,0,2,0,0,3,1,5],[6,1,1,0,2,0,0,0,0,2,3,1],[6,0,0,0,1,0,0,0,0,2,4,1]];

/* §8 · the toy network of §9–§10 (hand-made numbers; the word2vec widgets use the same ones) */
const TOY_V=['we','drink','chai','daily','cricket'], TOY_IN=[[0,1],[1,0],[1,1],[0,1],[-1,0]], TOY_OUT=[[0,0],[1,0],[1,1],[0,1],[-1,-1]];
/* §12 · the four-leaf tree: each fork sends σ(θ·h) of its share to the left */
const HS={h:[1,1],nodes:[{q:'drink or sport?',th:[.5,.5]},{q:'chai or coffee?',th:[-.5,0]},{q:'cricket or football?',th:[1,-2]}],
  leaves:[{w:'chai',path:[[0,1],[1,1]]},{w:'coffee',path:[[0,1],[1,0]]},{w:'cricket',path:[[0,0],[2,1]]},{w:'football',path:[[0,0],[2,0]]}]};
function hsLeaf(i){ return HS.leaves[i].path.reduce((p,[n,left])=>{ const z=dot(HS.nodes[n].th,HS.h); return p*(left?sigm(z):sigm(-z)); },1); }
/* §12 · subsampling: one sentence with made-up but typical word frequencies f (share of all words); keep each copy with √(t/f) */
const SS_T=1e-5;
const SS_TEXT=[['the',.05],['kettle',2e-5],['is',.01],['on',.008],['the',.05],['stove',1e-5],['and',.03],['the',.05],['chai',4e-5],['is',.01],['kadak',5e-6],['and',.03],['hot',1.2e-4]];
const ssKeep=f=>Math.min(1,Math.sqrt(SS_T/f));
/* §13 · the convergence demo: chai and coffee never share a sentence but share their company; wicket keeps cricket company */
const WV_TOP={tea:['drink','hot','cup','morning','sweet','kettle','milk'],cricket:['bowler','over','pitch','six','bat','umpire','ball'],travel:['train','ticket','station','platform','seat','bus','late']}, WV_SH=['the','a','we','is'];
function wvCorpus(seed,n){ const r=rng16(seed), out=[];
  for(let i=0;i<n;i++){ const t=['tea','cricket','tea','travel'][i%4], W=WV_TOP[t], len=4+Math.floor(r()*3), s=[];
    for(let j=0;j<len;j++) s.push(r()<.2?WV_SH[Math.floor(r()*WV_SH.length)]:W[Math.floor(r()*W.length)]);
    const ins=w=>s.splice(Math.floor(r()*(s.length+1)),0,w);
    if(t==='tea') ins(i%8===0?'chai':i%8===2?'coffee':(r()<.5?'chai':'coffee'));   /* exactly one of chai / coffee: they never meet */
    if(t==='cricket'&&r()<.7) ins('wicket');
    out.push(s); } return out; }
/* §13 · GloVe: two targets, four probes (1 000 context words counted around each); hand-made 2-D vectors that satisfy (w_chai − w_lassi)·w̃_k = ln ratio */
const GR_P=['hot','cold','drink','cricket'], GR_CHAI={hot:40,cold:2,drink:60,cricket:4}, GR_LASSI={hot:2,cold:40,drink:60,cricket:4}, GR_N=1000;
const GR_DIFF=[Math.log(20),0], GR_VEC={hot:[1,.55],cold:[-1,.45],drink:[0,1],cricket:[0,-.8]};
const gloveF=x=>x<100?Math.pow(x/100,.75):1;

/* §6 · the skip-gram worked example */
const SG0={v:[1,0], up:[0.5,0.5], un:[-0.5,1]};
function sgLoss(s){ return -Math.log(sigm(dot(s.up,s.v)))-Math.log(sigm(-dot(s.un,s.v))); }
function sgStep(s,eta){ const gp=1-sigm(dot(s.up,s.v)), gn=sigm(dot(s.un,s.v));   /* how wrong each guess is */
  return {v:vadd(s.v,vscale(vsub(vscale(s.up,gp),vscale(s.un,gn)),eta)), up:vadd(s.up,vscale(s.v,eta*gp)), un:vsub(s.un,vscale(s.v,eta*gn))}; }

/* §8 · a tiny neural language model, trained by us (numpy, 20 000 Adam steps, weight decay 0.03) on seven sentences; weights rounded to 2 decimals */
const NLM_V=['I','we','drink','play','hot','chai','coffee','cricket','football','.'];
const NLM_SENT=['I drink hot chai .','we drink hot chai .','I drink hot coffee .','we drink hot coffee .','I play cricket .','we play cricket .','we play football .'];
const NLM=/*@NLM*/{"E":[[0.53,0.37],[0.59,0.41],[0.23,-1.77],[-1.13,0.56],[-0.9,0.09],[0.23,0.12],[0.23,0.12],[0.14,0.07],[0.08,0.04],[0.0,-0.0]],"W":[[-0.4,0.32,0.55,-0.4],[0.4,-0.32,-0.55,0.4],[-0.32,0.58,-0.04,0.59],[-0.32,0.58,-0.04,0.59],[-0.4,0.32,0.55,-0.4],[-0.32,0.58,-0.04,0.59],[-0.73,-0.64,0.26,0.25],[0.73,0.64,-0.26,-0.25]],"b":[0.22,-0.22,0.27,0.27,0.22,0.27,0.12,-0.12],"U":[[0.0,-0.0,-0.0,-0.0,0.0,0.0,0.0,0.0],[-0.0,-0.0,-0.0,-0.0,0.0,-0.0,-0.0,-0.0],[-0.0,0.0,-0.0,0.0,-0.0,0.0,-0.0,-0.0],[0.0,-0.0,0.0,0.0,-0.0,-0.0,-0.0,0.0],[0.58,-0.58,-0.5,-0.5,0.58,-0.5,-0.61,0.61],[-0.32,0.32,-0.39,-0.39,-0.32,-0.39,0.42,-0.42],[-0.32,0.32,-0.39,-0.39,-0.32,-0.39,0.42,-0.42],[-0.33,0.33,0.41,0.41,-0.33,0.41,-0.5,0.5],[-0.25,0.25,0.32,0.32,-0.25,0.32,-0.41,0.41],[0.64,-0.64,0.55,0.55,0.64,0.55,0.67,-0.67]],"c":[-9.86,-9.29,-9.32,-9.5,4.94,4.44,4.44,4.6,4.21,5.22]}/*@END*/;
function nlmForward(i,j){ const x=NLM.E[i].concat(NLM.E[j]); const h=NLM.W.map((r,k)=>Math.tanh(dot(r,x)+NLM.b[k])); const s=NLM.U.map((r,k)=>dot(r,h)+NLM.c[k]); return {x,h,s,q:softmax(s)}; }

/* §9 · the embedding explorer: 60 hand-made word vectors with 13 numbers each.
   Numbers 1–9 are meanings we chose (person, royal, female(+)/male(−), young, drink, cricket, animal, place, capital city);
   numbers 10–13 are a random "fingerprint" shared by a word family (king/queen/prince/princess, dog/puppy, chai/coffee …), plus a smaller personal one for the tea and cricket words, so that no two words coincide;
   then a little random noise (±0.06) on every number. Rounded to 2 decimals. */
const EX=/*@EX*/{"w":["king","queen","prince","princess","man","woman","boy","girl","father","mother","son","daughter","brother","sister","husband","wife","uncle","aunt","actor","actress","chai","coffee","milk","sugar","cup","kettle","lassi","juice","ball","wicket","stumps","over","six","run","bowler","batsman","dog","puppy","cat","kitten","cow","calf","lion","cub","horse","foal","tiger","India","Delhi","France","Paris","Japan","Tokyo","Italy","Rome","Nepal","Kathmandu","England","London","bat"],"v":[[1.0,1.01,-0.69,0.07,-0.13,-0.0,0.03,-0.01,-0.1,-0.34,0.3,0.55,0.35],[0.97,1.02,0.72,0.03,0.07,0.05,-0.09,-0.02,-0.06,-0.27,0.38,0.53,0.61],[1.09,1.07,-0.64,0.96,-0.01,0.04,0.05,0.04,-0.05,-0.33,0.22,0.58,0.46],[1.05,1.0,0.69,0.99,-0.02,0.01,0.05,-0.07,0.01,-0.28,0.26,0.51,0.56],[0.92,0.01,-0.63,0.05,-0.09,0.03,-0.02,-0.02,0.05,0.76,-0.16,0.3,-0.2],[0.94,0.13,0.64,0.08,-0.04,0.01,-0.03,0.01,0.01,0.76,-0.18,0.3,-0.21],[0.87,0.02,-0.75,1.02,-0.02,-0.05,-0.01,0.02,0.02,0.74,-0.26,0.17,-0.1],[1.01,-0.06,0.68,1.08,-0.07,-0.03,0.04,0.04,0.04,0.76,-0.17,0.1,-0.19],[0.96,-0.04,-0.63,-0.01,-0.01,0.04,0.11,-0.05,0.04,-0.66,-0.41,0.03,-0.39],[0.98,-0.03,0.7,-0.02,-0.02,-0.06,0.03,-0.14,0.01,-0.69,-0.27,-0.01,-0.55],[1.03,0.06,-0.81,1.02,0.02,-0.06,0.04,-0.05,0.06,-0.57,-0.34,0.04,-0.41],[0.88,-0.04,0.7,1.13,0.07,0.01,-0.05,0.02,0.0,-0.72,-0.33,-0.02,-0.44],[0.8,0.08,-0.73,-0.07,-0.04,-0.1,-0.01,0.08,0.02,-0.11,0.49,0.26,0.23],[0.96,-0.0,0.71,-0.04,0.02,-0.07,-0.11,-0.12,0.02,-0.13,0.5,0.21,0.23],[1.01,-0.09,-0.74,0.08,0.11,0.01,0.01,-0.04,-0.07,0.2,-0.01,-0.81,0.48],[0.95,0.07,0.72,-0.04,0.06,-0.05,-0.06,0.01,-0.06,0.09,-0.04,-0.83,0.42],[1.04,0.01,-0.65,0.05,0.05,-0.07,0.05,0.0,0.03,-0.68,0.14,-0.06,0.03],[1.03,-0.02,0.63,-0.01,-0.02,-0.02,-0.01,-0.04,-0.05,-0.51,0.04,-0.03,0.07],[0.96,-0.04,-0.77,-0.08,0.09,-0.07,-0.06,0.05,-0.09,0.19,-0.16,0.48,-0.64],[0.95,0.04,0.67,-0.05,0.05,-0.01,-0.06,-0.01,0.02,0.09,-0.02,0.43,-0.59],[0.0,0.05,-0.04,-0.03,1.29,-0.03,-0.03,-0.18,-0.05,0.31,-0.28,-0.0,-0.23],[-0.03,-0.0,0.1,0.08,1.39,-0.07,-0.06,0.03,-0.07,0.4,-0.24,0.54,-0.02],[0.0,0.02,-0.02,-0.11,1.26,-0.06,-0.09,-0.01,0.01,0.27,0.09,0.2,0.3],[0.02,-0.04,0.14,0.03,1.35,-0.02,-0.0,0.05,-0.05,0.37,0.07,0.06,0.15],[-0.07,0.01,0.02,-0.0,1.33,-0.02,-0.01,0.07,0.05,-0.23,-0.57,-0.23,0.01],[0.04,0.14,-0.02,-0.01,1.29,-0.03,-0.07,0.04,0.06,0.17,-0.59,-0.42,0.54],[0.02,-0.04,0.01,-0.06,1.28,-0.05,0.04,-0.04,0.03,-0.5,-0.06,0.04,-0.34],[-0.05,-0.04,0.01,-0.0,1.27,-0.08,-0.09,-0.03,-0.05,-0.2,0.17,0.22,-0.69],[-0.02,0.03,-0.1,0.04,0.04,1.26,-0.0,-0.0,0.07,0.42,0.18,-0.27,-0.02],[0.05,-0.03,-0.1,-0.04,-0.07,1.38,0.04,-0.11,0.03,0.37,0.18,-0.43,0.71],[-0.1,-0.01,0.04,0.08,0.08,1.29,0.01,0.03,-0.01,0.35,0.27,-0.62,0.51],[0.02,0.09,0.02,0.04,0.02,1.31,0.08,-0.03,-0.0,-0.14,-0.94,-0.4,-0.37],[-0.08,0.01,-0.03,0.06,0.03,1.17,0.02,0.04,-0.01,0.12,-0.79,-0.32,-0.55],[0.02,0.08,-0.08,0.03,-0.13,1.33,0.07,0.06,-0.08,0.41,-0.89,-0.15,-0.56],[-0.05,-0.03,0.01,0.03,-0.08,1.32,0.05,0.06,-0.02,0.26,0.35,0.39,-0.04],[0.0,-0.02,0.01,-0.02,0.01,1.29,-0.03,-0.05,-0.01,0.22,0.46,0.08,0.28],[0.12,-0.08,0.01,-0.07,0.04,0.03,1.23,-0.02,-0.03,0.04,-0.58,-0.79,-0.81],[-0.04,0.09,-0.02,0.96,-0.12,-0.0,1.13,0.07,-0.06,0.09,-0.57,-0.83,-0.74],[0.05,0.06,0.02,-0.03,0.1,0.14,1.25,-0.1,0.02,-0.48,0.16,0.15,0.61],[-0.05,0.02,-0.06,1.01,0.1,0.0,1.19,0.08,-0.01,-0.52,0.16,0.05,0.55],[-0.03,-0.07,0.12,-0.03,0.07,-0.02,1.24,0.05,0.12,1.01,-0.25,-0.9,-0.68],[-0.09,0.05,-0.02,0.97,-0.04,0.04,1.09,0.01,-0.05,1.05,-0.29,-0.79,-0.71],[-0.03,-0.07,0.05,-0.01,-0.1,0.0,1.19,-0.08,0.02,-0.94,-0.32,-0.22,0.52],[0.03,-0.07,-0.11,0.95,0.02,-0.01,1.12,0.07,0.09,-0.96,-0.23,-0.25,0.6],[0.1,0.05,-0.14,0.01,-0.1,-0.01,1.18,-0.01,0.05,-0.68,-0.13,-0.13,-0.03],[0.07,0.17,-0.02,1.0,-0.02,-0.04,1.23,-0.03,-0.07,-0.63,-0.02,-0.11,-0.01],[0.02,-0.05,0.03,0.01,-0.04,0.07,1.21,0.06,0.03,-0.29,0.93,-0.06,0.02],[-0.03,0.03,-0.05,0.02,0.03,-0.14,-0.08,1.21,0.01,0.38,0.11,0.77,-0.53],[-0.06,0.05,0.09,0.05,-0.04,0.15,-0.05,1.15,1.06,0.36,0.07,0.76,-0.52],[-0.0,0.01,-0.05,-0.07,0.07,0.05,-0.03,1.28,-0.05,-0.19,-0.11,0.02,0.36],[-0.03,-0.05,-0.05,-0.1,-0.03,0.07,0.05,1.21,0.95,-0.08,-0.24,0.03,0.52],[0.0,-0.05,0.09,-0.08,-0.11,0.04,-0.05,1.23,-0.12,-0.3,-0.98,-0.01,-0.41],[0.03,0.05,0.06,0.01,-0.06,-0.07,0.04,1.1,1.08,-0.19,-0.81,0.08,-0.33],[-0.03,0.04,0.03,-0.05,-0.06,-0.04,-0.07,1.13,-0.13,0.29,0.15,0.95,0.25],[0.06,-0.02,0.07,-0.03,-0.06,-0.01,-0.15,1.17,1.04,0.35,0.06,0.88,0.33],[0.05,0.11,0.07,0.05,0.02,-0.06,-0.06,1.17,0.0,-0.42,0.06,0.59,-0.07],[-0.0,-0.08,-0.02,0.14,0.05,-0.03,0.09,1.16,1.1,-0.36,0.14,0.49,-0.02],[-0.08,-0.02,-0.02,-0.01,0.03,0.02,0.02,1.19,-0.04,0.02,-0.16,-0.18,-0.46],[-0.01,-0.04,0.0,0.08,-0.02,-0.02,-0.05,1.18,1.0,-0.08,-0.11,-0.22,-0.44],[0.06,-0.04,-0.01,0.01,0.05,0.78,0.67,0.05,0.06,0.62,0.25,-0.67,0.51]]}/*@END*/;
const EX_FEAT=['person','royal','female','young','drink','cricket','animal','place','capital'];
EX.idx={}; EX.w.forEach((w,i)=>{ EX.idx[w]=i; });
EX.group=EX.v.map((v,i)=>{ if(EX.w[i]==='bat') return 'bat'; const f=[v[0],v[4],v[5],v[6],v[7]], k=f.indexOf(Math.max(...f)); return ['people','tea','cricket','animal','place'][k]; });
/* the fixed 3-D window we look through (a projection: each number pushes the point a fixed amount in a fixed direction) */
const EX_P=[[-2.4,0,1.45,.6,2.0,1.46,-.5,-.08,.7, .65,-.35,.3,.2],[.2,1.3,-.3,-.6,.77,-1.46,-2.17,2.17,.5, .2,.42,-.35,.3],[-.2,0,.85,0,-.31,.46,-.83,-1.17,.3, -.3,.2,.42,-.5]];
const exPos=v=>EX_P.map(r=>dot(r,v));
function exNearest(q,skip,n){ return EX.v.map((v,i)=>({w:EX.w[i],i,c:cosSim(q,v)})).filter(o=>!skip||!skip.includes(o.w)).sort((a,b)=>b.c-a.c).slice(0,n||5); }
