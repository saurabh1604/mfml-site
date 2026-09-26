/* ================= UNIT 18 · the unit's shared maths and colour language ================= */
/* one colour language for the whole unit: queries orange, keys blue, values green, weights gold, probability cyan */
const K18={q:'s2',k:'s1',v:'s3',w:'s4',tok:'s1',prob:'s6',loss:'critical',h1:'s5',h2:'s6'};
/* every widget registers here: window.U18.<name> = {st, draw, state()} — state() returns the numbers the picture was drawn from */
const U18=window.U18=window.U18||{};
/* a text halo so labels stay readable over beams, bars and glows */
const HALO=';paint-order:stroke;stroke:var(--surface);stroke-width:3.5px;stroke-linejoin:round';
const cv=k=>k==='critical'?'var(--critical)':'var(--'+k+')';
/* numbers: integers print bare, others trimmed; always a real minus sign */
const N=(v,d)=>{ if(!isFinite(v)) return v>0?'∞':'−∞'; if(Math.abs(v)<5e-13) return '0'; const r=Math.round(v); if(Math.abs(v-r)<1e-9) return nm(String(r)); return trim(F(v,d==null?3:d)); };
const vecN=(v,d)=>'('+v.map(x=>N(x,d)).join(', ')+')';
const grp=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');  /* 1 048 576, with no-break spaces so a number never splits across lines */
/* ---- linear algebra on plain arrays ---- */
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const matMul=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,x,k)=>s+x*B[k][j],0)));
const T_=A=>A[0].map((_,j)=>A.map(r=>r[j]));
const zeros=(r,c)=>Array.from({length:r},()=>Array(c).fill(0));
/* softmax of one row; −∞ entries get exactly 0 */
function softmax(row){ const m=Math.max(...row.filter(isFinite)); const e=row.map(s=>isFinite(s)?Math.exp(s-m):0); const z=e.reduce((a,b)=>a+b,0); return e.map(x=>x/z); }
/* attention: Q, K, V are row-per-word; returns {S (scaled, masked), A, O} */
function attend(Q,K,V,o){ o=o||{}; const d=Q[0].length, sc=o.scale===false?1:Math.sqrt(d), T=o.T||1;
  const S=Q.map((q,i)=>K.map((k,j)=>(o.causal&&j>i)?-Infinity:dot(q,k)/sc/T));
  const A=S.map(softmax), O=A.map(r=>V[0].map((_,c)=>r.reduce((s,w,j)=>s+w*V[j][c],0))); return {S,A,O}; }
const layerNorm=(x,g,b)=>{ const m=x.reduce((a,c)=>a+c,0)/x.length, v=x.reduce((a,c)=>a+(c-m)**2,0)/x.length, s=Math.sqrt(v); return x.map((c,i)=>(s>0?(c-m)/s:0)*(g==null?1:g)+(b==null?0:b)); };

/* ---- §1 · the interpreter's notes (hand-made): one-hot notes, one decoder state per Hindi word ---- */
const ALIGN={EN:['I','drink','tea'],HI:['मैं','चाय','पीता','हूँ'],TR:['main','chai','peeta','hoon'],GL:['I','tea','drink','am'],
  H:[[1,0,0],[0,1,0],[0,0,1]],Q:[[2,0,0],[0,.5,2],[0,2,.5],[1,1,0]]};
(function(){ const w=softmax(ALIGN.Q[1].map((v,i)=>v)), got=w.map(x=>x.toFixed(3)).join();
  if(got!=='0.100,0.164,0.736') console.warn('U18: alignment example drifted: '+got); })();

/* ---- §5 · a chameleon word (hand-made 2-D vectors: nature, money); Q = K = V = X ---- */
const CTX={BANK:[1,1],NB:{river:[2,0],stream:[3,0],the:[.3,.3],money:[0,2],loan:[.5,2.5]},ORDER:['river','stream','the','money','loan']};
CTX.run=nb=>{ const X=[CTX.NB[nb],CTX.BANK], r=attend([CTX.BANK],X,X); return {s:r.S[0],w:r.A[0],out:r.O[0]}; };
CTX.cos=(u,v)=>dot(u,v)/Math.hypot(...u)/Math.hypot(...v);

/* ---- THE worked example of §3 and §10 ---- */
const EX={K:[[1,0],[0,1],[1,1]], V:[[2,0],[0,2],[1,1]], Q:[[2,0],[0,2],[1,1]]};
(function(){ const r=attend(EX.Q,EX.K,EX.V), m=attend(EX.Q,EX.K,EX.V,{causal:true});
  const want=[r.A[0].map(x=>x.toFixed(3)).join(),r.O[0].map(x=>x.toFixed(3)).join(),m.A[1].map(x=>x.toFixed(3)).join(),m.O[1].map(x=>x.toFixed(3)).join()].join(' ; ');
  if(want!=='0.446,0.108,0.446 ; 1.337,0.663 ; 0.196,0.804,0.000 ; 0.391,1.609') console.warn('U18: worked example drifted: '+want); })();

/* ================= THE ATTENTION LAB's toy model =================
   Every word is 12 numbers: 8 hand-labelled meaning features + 4 position numbers (two clocks).
   Hand-set, honest toy — not a trained model. d = 12, h = 2 heads, d_k = 6. */
const LAB=(function(){
  const FEAT=['thing','someone','action','it-word','he/she-word','describing','place','linking'];
  const FS=['thing','someone','action','“it”','he/she','describes','place','linking'];
  const I=k=>FEAT.indexOf(k), one=k=>{ const v=Array(8).fill(0); v[I(k)]=1; return v; };
  const LEX={};
  const put=(ws,k)=>ws.split(' ').forEach(w=>{ LEX[w]=one(k); });
  put('the a an my his their our your and because was is are were to of at in on but so then with for very too after when while as by','linking');
  put('ball bat chai coffee tea cup train ticket phone message book bus bread milk match wicket rain door window food letter bag car kite glass box','thing');
  put('batsman bowler boy girl mother father teacher driver friend sister brother dog cat child man woman doctor farmer','someone');
  put('hit made poured broke caught threw drank bought sent read ran took gave saw ate crossed wrote played dropped cooked kept found lost missed opened','action');
  put('it this','it-word');
  put('he she him her they them','he/she-word');
  put('loose late hot cold fast tired full empty broken sweet heavy old new happy wet late slow strong','describing');
  put('delhi mumbai station ground market school home road street city river','place');
  const d=12, h=2, dk=6, TH=[1.2,0.4], a=8, s=7;
  const pos=p=>[Math.cos(p*TH[0]),Math.sin(p*TH[0]),Math.cos(p*TH[1]),Math.sin(p*TH[1])];
  /* head 1 · meaning: key dims = [thing, someone, action, place, linking, –] */
  const WK1=zeros(d,dk), WQ1=zeros(d,dk), WV=zeros(d,dk), WQ2=zeros(d,dk), WK2=zeros(d,dk), WO=zeros(2*dk,d);
  [['thing',0],['someone',1],['action',2],['place',3],['linking',4]].forEach(([k,j])=>{ WK1[I(k)][j]=1; });
  WQ1[I('it-word')][0]=a; WQ1[I('he/she-word')][1]=a;
  WQ1[I('describing')][0]=a/2; WQ1[I('describing')][1]=a/2;
  WQ1[I('action')][0]=a/2; WQ1[I('action')][1]=a/2;
  WQ1[I('someone')][2]=a/2; WQ1[I('thing')][2]=a/2; WQ1[I('place')][2]=a/2;
  WQ1[I('linking')][4]=1;
  /* values (both heads): hand over the meaning */
  [['thing',0],['someone',1],['action',2],['place',3],['describing',4]].forEach(([k,j])=>{ WV[I(k)][j]=1; WO[j][I(k)]=1; WO[dk+j][I(k)]=0.5; });
  /* head 2 · the word before: the query is the position turned back by one step (§7), times s */
  [0,1].forEach(c=>{ const t=-TH[c], R=[[Math.cos(t),-Math.sin(t)],[Math.sin(t),Math.cos(t)]];
    for(let r=0;r<2;r++) for(let q=0;q<2;q++) WQ2[8+2*c+q][2*c+r]=s*R[r][q]; });
  for(let k=0;k<4;k++) WK2[8+k][k]=1;
  function tokens(text){ return String(text).toLowerCase().replace(/[^a-z\s']/g,' ').split(/\s+/).filter(Boolean).slice(0,12)
    .map((w,p)=>{ const known=!!LEX[w]; const m=(LEX[w]||one('thing')).slice(); return {w,known,m,x:m.concat(pos(p))}; }); }
  function run(toks,o){ o=o||{}; const X=toks.map(t=>t.x), heads=[[WQ1,WK1],[WQ2,WK2]].map(([WQ,WK])=>attend(matMul(X,WQ),matMul(X,WK),matMul(X,WV),{causal:o.causal,T:o.T||1}));
    const H=X.map((_,i)=>heads[0].O[i].concat(heads[1].O[i])), add=matMul(H,WO), Y=X.map((x,i)=>x.map((v,c)=>v+add[i][c]));
    return {X,heads,A:heads.map(r=>r.A),Y,add}; }
  return {FEAT,FS,LEX,d,h,dk,TH,tokens,run,W:{WQ1,WK1,WQ2,WK2,WV,WO}};
})();
/* self-check against the page's words */
(function(){ const r=LAB.run(LAB.tokens('the batsman hit the ball because it was loose'));
  const got=[r.A[0][6][4].toFixed(3),r.A[0][6][0].toFixed(3),r.Y[6][0].toFixed(3)].join(' ');
  if(got!=='0.766 0.029 0.816') console.warn('U18: lab drifted: '+got); })();

/* ================= THE TINY TRANSFORMER (§11) =================
   vocabulary 5, d = 4, two heads of size 2, causal, one block, hand-set weights. Rows = positions. */
const TINY=(function(){
  const VOC=['I','drink','play','chai','cricket'];
  const E={I:[1,0,0,0],drink:[0,1,0,0],play:[0,0,1,0],chai:[0,0,0,0],cricket:[0,0,0,0]};
  const P=[[0,0,0,1],[0,0,0,-1]];
  const Z=()=>zeros(4,2);
  const WQ1=Z(), WK1=Z(), WV1=Z(), WQ2=Z(), WK2=Z(), WV2=Z();
  WQ1[3][0]=-2; WK1[3][0]=1; WV1[0][0]=1; WV1[1][1]=1;
  WQ2[1][0]=2; WQ2[2][0]=2; WK2[1][0]=1; WK2[2][0]=1; WV2[1][0]=1; WV2[2][1]=1;
  const WO=zeros(4,4); WO[0][0]=1; WO[1][1]=1; WO[2][1]=1; WO[3][2]=1;
  const W1=zeros(4,4); W1[1][0]=1; W1[2][0]=-1; W1[1][1]=-1; W1[2][1]=1; W1[0][2]=1;
  const W2=zeros(4,4); W2[0][1]=1; W2[1][2]=1;
  const WU=zeros(4,5); WU[0][1]=1.5; WU[0][2]=1.5; WU[1][3]=2; WU[2][4]=2;
  function run(words){ const X=words.map((w,p)=>E[w].map((v,c)=>v+P[p][c]));
    const h1=attend(matMul(X,WQ1),matMul(X,WK1),matMul(X,WV1),{causal:true}), h2=attend(matMul(X,WQ2),matMul(X,WK2),matMul(X,WV2),{causal:true});
    const H=X.map((_,i)=>h1.O[i].concat(h2.O[i])), att=matMul(H,WO), R1=X.map((x,i)=>x.map((v,c)=>v+att[i][c])), L1=R1.map(r=>layerNorm(r));
    const hid=matMul(L1,W1).map(r=>r.map(v=>Math.max(0,v))), F=matMul(hid,W2), R2=L1.map((x,i)=>x.map((v,c)=>v+F[i][c])), L2=R2.map(r=>layerNorm(r));
    const logits=matMul(L2,WU), probs=logits.map(softmax);
    return {words,X,E:words.map(w=>E[w]),P:P.slice(0,words.length),q1:matMul(X,WQ1),k1:matMul(X,WK1),v1:matMul(X,WV1),q2:matMul(X,WQ2),k2:matMul(X,WK2),v2:matMul(X,WV2),h1,h2,H,att,R1,L1,hid,F,R2,L2,logits,probs}; }
  return {VOC,E,P,W:{WQ1,WK1,WV1,WQ2,WK2,WV2,WO,W1,W2,WU},run};
})();
(function(){ const r=TINY.run(['I','drink']); const got=[r.probs[1][3].toFixed(3),r.probs[0][1].toFixed(3),r.h1.A[1][0].toFixed(3)].join(' ');
  if(got!=='0.877 0.468 0.944') console.warn('U18: tiny transformer drifted: '+got); })();

/* ---- HTML matrix: a bracketed grid; opts.tone = q|k|v|gold|par, cells may carry data-r/data-c ---- */
function matHTML(rows,o){ o=o||{}; const cols=rows[0].length; let cells='';
  rows.forEach((r,i)=>r.forEach((v,j)=>{ const cls=o.cell?o.cell(i,j,v):''; cells+=`<span class="mc${cls?' '+cls:''}" data-r="${i}" data-c="${j}">${typeof v==='number'?N(v,o.d):v}</span>`; }));
  return `<span class="mtx ${o.tone||''}"${o.id?` id="${o.id}"`:''}><span class="mg" style="--c:${cols}">${cells}</span></span>`+(o.shape?`<span class="mshape">${o.shape}</span>`:''); }
const tone=(k,t)=>`<b style="color:${cv(k)}">${t}</b>`;
/* gold for a share in [0, 1]: used by every heat map */
const goldA=w=>Math.max(0,Math.min(1,w));
/* ---- SVG text that never renders below ~11.5 px on a phone: font size in viewBox units ---- */
const svgScale=svg=>{ const w=svg.getBoundingClientRect().width, W=svg.viewBox.baseVal.width; return w>0&&W>0?w/W:1; };
const fz=(svg,b)=>Math.max(b,11.5/svgScale(svg));
/* narrow = the stage is phone-sized: widgets switch to a portrait layout */
const narrowOf=el=>{ const w=(el.parentNode||el).getBoundingClientRect().width; return w>0&&w<560; };
/* redraw an SVG widget when its layout class (narrow/wide) or the theme changes */
function relayout(svg,draw){ let was=null, lw=0; const go=()=>{ const n=narrowOf(svg), w=(svg.parentNode||svg).getBoundingClientRect().width; if(n!==was||(lw&&Math.abs(w-lw)/lw>.025)){ was=n; lw=w; draw(true); } else if(!lw) lw=w; };
  addEventListener('resize',go); if('ResizeObserver' in window) new ResizeObserver(()=>go()).observe(svg.parentNode||svg); new MutationObserver(()=>draw(true)).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); go(); return go; }
