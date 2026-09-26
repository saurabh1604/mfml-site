/* ================= UNIT 17 · Act II widget: w-talk — a tiny character-level language model (weights in u17-talk-model.js) ================= */
(function(){
  const root=document.getElementById('w-talk'); if(!root||typeof TALK==='undefined') return;
  const C=TALK.chars, H=TALK.H, NV=C.length, IX={}; for(let i=0;i<NV;i++) IX[C[i]]=i;
  /* ---- the model: exactly §2's cell and §4's read-out, in the same order of operations as dev/train-u17-talk.py ---- */
  function step(h,ch){ const x=IX[ch], out=new Array(H); for(let i=0;i<H;i++){ let z=TALK.b[i]+TALK.U[i][x]; for(let j=0;j<H;j++) z+=TALK.W[i][j]*h[j]; out[i]=Math.tanh(z); } return out; }
  function scores(h){ const s=new Array(NV); for(let i=0;i<NV;i++){ let z=TALK.c[i]; for(let j=0;j<H;j++) z+=TALK.V[i][j]*h[j]; s[i]=z; } return s; }
  function softT(s,T){ let m=-Infinity; for(let i=0;i<s.length;i++) if(s[i]>m) m=s[i]; const e=s.map(v=>Math.exp((v-m)/T)); let tot=0; for(let i=0;i<e.length;i++) tot+=e[i]; return e.map(v=>v/tot); }
  /* the dice: mulberry32, started from a hash of the dice number. (A plain Park–Miller start made the first roll of dice #1–#5 almost 0,
     so every sampled line began with the first letter in the alphabet that the model allows — "agra" — at every temperature, even at T = 0.2,
     where "a" has a 3.6 % chance and "p" 55 %.) */
  function park(seed){ let a=(Math.imul(seed,0x9E3779B1)+4)>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
  const argmax=p=>{ let k=0; for(let i=1;i<p.length;i++) if(p[i]>p[k]) k=i; return k; };
  function pickFrom(p,how,rnd){ if(how==='greedy') return {k:argmax(p),r:null}; const r=rnd(); let acc=0; for(let i=0;i<p.length;i++){ acc+=p[i]; if(r<acc) return {k:i,r}; } return {k:p.length-1,r}; }
  const clean=s=>String(s).toLowerCase().replace(/[^a-z .]/g,'');
  const show=ch=>ch===' '?'␣':ch;
  const fp=v=>v<0.001?'<0.001':v>0.9995&&v<1?N(v,4):N(v,3);          /* never print a tiny chance as "0" */

  const D0={mode:'talk',seed:'the train to ',truth:'the train to pune is late.',T:1,dice:1,how:'sample'};
  const st=Object.assign({},D0);
  let run=null;        /* the current text: {fed:[chars fed so far], hs:[h after each], gen:[{ch,how,p,r}], rnd} */
  let tf=null;         /* teacher forcing: {k, rows:[{ch,guess,p,loss}], total} */
  let timer=null;
  const tape=document.getElementById('tk-tape'), noteSvg=document.getElementById('tk-note'), barSvg=document.getElementById('tk-bars'), read=document.getElementById('tk-read'), inp=document.getElementById('tk-seed');
  const B={sample:document.getElementById('tk-sample'),greedy:document.getElementById('tk-greedy'),step:document.getElementById('tk-step'),dice:document.getElementById('tk-dice'),reset:document.getElementById('tk-reset')};

  function startTalk(){ const seed=clean(st.seed); let h=new Array(H).fill(0); const hs=[]; const fed=(' '+seed).split('');
    fed.forEach(ch=>{ h=step(h,ch); hs.push(h); }); run={seed,fed,hs,gen:[],rnd:park(st.dice)}; }
  function curH(){ return run.hs[run.hs.length-1]; }
  function talkOne(how){ const p=softT(scores(curH()),how==='greedy'?1:st.T); const {k,r}=pickFrom(p,how,run.rnd); const ch=C[k]; run.gen.push({ch,how,p,r}); run.fed.push(ch); run.hs.push(step(curH(),ch)); return ch; }
  const done=()=>run.gen.filter(g=>g.ch==='.').length>=2||run.gen.length>=110;
  function startTrain(){ const s=clean(st.truth); tf={s,k:0,rows:[],total:0,hs:[step(new Array(H).fill(0),' ')]}; }
  function trainOne(){ if(tf.k>=tf.s.length) return false; const h=tf.hs[tf.hs.length-1], p=softT(scores(h),1), ch=tf.s[tf.k], g=C[argmax(p)], loss=-Math.log(p[IX[ch]]);
    tf.rows.push({ch,guess:g,p:p[IX[ch]],loss,dist:p}); tf.total+=loss; tf.hs.push(step(h,ch)); tf.k++; return true; }

  let S={};
  function top(p,n){ return p.map((v,i)=>({ch:C[i],p:v})).sort((a,b)=>b.p-a.p||C.indexOf(a.ch)-C.indexOf(b.ch)).slice(0,n); }
  function drawNote(h){ noteSvg.innerHTML=''; const cw=29, ch=26, gx=6, gy=4, per=12; const cells=[];
    h.forEach((v,i)=>{ const x=gx+(i%per)*cw, y=gy+Math.floor(i/per)*(ch+3), a=Math.min(1,Math.abs(v));
      const r=el('rect',{x:x+1,y,width:cw-2,height:ch,rx:3,fill:v>=0?cv(K17.mem):cv(K17.edge),'fill-opacity':(.1+.85*a).toFixed(3)},noteSvg); r.dataset.v=v; cells.push(+(.1+.85*a).toFixed(3)); });
    return cells; }
  function drawBars(p,picked){ barSvg.innerHTML=''; const L=36, R=62, W=360, bw=W-L-R, glow=glo(barSvg), out=[];
    let rows=top(p,6); if(picked!=null&&!rows.some(o=>o.ch===picked)) rows=top(p,5).concat([{ch:picked,p:p[IX[picked]]}]);   /* a long shot that was picked is always shown */
    [0,.25,.5,.75,1].forEach(v=>{ const x=L+v*bw; el('line',{x1:x,y1:6,x2:x,y2:146,stroke:'var(--grid)','stroke-width':1},barSvg); if(v===0||v===.5||v===1) txt(barSvg,x,162,v===0?'0':v===1?'1':'0.5','font:500 10px system-ui;fill:var(--ink-muted)','middle').classList.add('tick'); });
    rows.forEach((o,j)=>{ const y=10+j*23, w=Math.max(1.5,o.p*bw), isP=picked!=null&&o.ch===picked;
      txt(barSvg,L-8,y+13,show(o.ch),'font:700 13px system-ui;fill:'+(isP?cv(K17.gate):'var(--ink)'),'end');
      const g=el('g',glow&&isP?{filter:glow}:{},barSvg); const r=el('rect',{x:L,y,width:w,height:17,rx:4,fill:isP?cv(K17.gate):cv(K17.prob),opacity:isP?1:.75},g); r.dataset.ch=o.ch; r.dataset.p=o.p;
      txt(barSvg,L+w+6,y+13,fp(o.p),'font:700 11px system-ui;fill:'+(isP?cv(K17.gate):cv(K17.prob))); out.push({ch:o.ch,p:o.p,w}); });
    return {rows:out,scale:bw,x0:L}; }
  function tile(ch,cls){ return `<span class="tk-c ${cls}${ch===' '?' sp':''}">${show(ch)}</span>`; }
  function render(){ const talk=st.mode==='talk';
    B.greedy.style.display=talk?'':'none'; B.dice.style.display=talk?'':'none';
    B.sample.textContent=talk?'▶ talk (sample)':'▶ read the true sentence';
    document.getElementById('tk-T').closest('.controls').style.display=talk?'':'none';
    document.getElementById('tk-seed-lab').textContent=talk?'seed':'true text';
    document.getElementById('tk-tape-lab').innerHTML=talk?'the text so far — <i class="tk-k seed">seed</i> <i class="tk-k gen">written by the model</i>':'fed in: the <i class="tk-k seed">true text</i> · under each character, the model\'s top guess for it — <i class="tk-k gen" style="color:var(--s3)">right</i> <i class="tk-k bad">wrong</i>';
    B.dice.textContent='new dice · #'+st.dice;
    if(talk){ const seed=run.seed, gen=run.gen, n=gen.length;
      tape.innerHTML=tile(' ','seed')+seed.split('').map(c=>tile(c,'seed')).join('')+gen.map((g,i)=>tile(g.ch,'gen'+(i===n-1?' last':''))).join('');
      const h=curH(), pNext=softT(scores(h),st.T), lastPick=n?gen[n-1]:null, hShown=lastPick?run.hs[run.hs.length-2]:h;
      const cells=drawNote(hShown), bars=drawBars(lastPick?lastPick.p:pNext,lastPick?lastPick.ch:null);
      document.getElementById('tk-note-lab').textContent='the note after "'+(run.fed.length>1?show(run.fed[run.fed.length-(lastPick?2:1)]):'␣')+'"'+(lastPick?' — used to pick "'+show(lastPick.ch)+'"':'')+' · 48 numbers, green +, violet −';
      document.getElementById('tk-bars-lab').textContent=lastPick?('its guess for that character'+(lastPick.how==='greedy'?' — greedy takes the top':' — sampled at T = '+N(st.T,1)+(lastPick.r!=null?', dice roll '+N(lastPick.r,3):''))):'guess for the next character, at T = '+N(st.T,1);
      const text=seed+gen.map(g=>g.ch).join('');
      read.innerHTML=n?('<b class="w">'+seed+'</b><b class="p">'+gen.map(g=>g.ch).join('')+'</b><br>'+n+' character'+(n===1?'':'s')+' written, '+(gen[0].how==='greedy'?'<b>greedily</b> (always the top guess)':'by <b>sampling</b> at T = '+N(st.T,1)+', dice #'+st.dice)+'. Each one was fed back in as the next input.'):
        ('Seed "<b class="w">'+seed+'</b>". The model has read it one character at a time (starting from a space). Its guess for the next character: '+top(pNext,3).map(o=>'"'+show(o.ch)+'" '+N(o.p,3)).join(', ')+'.');
      S={mode:'talk',seed,T:st.T,dice:st.dice,how:n?gen[0].how:st.how,text,gen:gen.map(g=>g.ch).join(''),h:hShown.slice(),dist:(lastPick?lastPick.p:pNext).slice(),picked:lastPick?lastPick.ch:null,rolls:gen.map(g=>g.r),bars,cells};
    } else {
      const k=tf.k, rows=tf.rows;
      tape.innerHTML=rows.map(o=>`<span class="tk-pair"><span class="tk-c${o.ch===' '?' sp':''}">${show(o.ch)}</span><span class="tk-g${o.guess===o.ch?'':' bad'}">${show(o.guess)}</span></span>`).join('')+(k<tf.s.length?`<span class="tk-pair next"><span class="tk-c${tf.s[k]===' '?' sp':''}">${show(tf.s[k])}</span><span class="tk-g"></span></span>`:'');
      const h=tf.hs[tf.hs.length-1], p=softT(scores(h),1), last=rows[rows.length-1];
      const cells=drawNote(last?tf.hs[tf.hs.length-2]:h), bars=drawBars(last?last.dist:p,last?last.ch:null);
      document.getElementById('tk-note-lab').textContent=(last?'the note just before "'+show(last.ch)+'"':'the note after the starting space')+' · 48 numbers, green +, violet −';
      document.getElementById('tk-bars-lab').textContent=last?'its guess for "'+show(last.ch)+'" — gold is the true character':'guess for the first character';
      const right=rows.filter(o=>o.guess===o.ch).length, worst=rows.reduce((m,o,i)=>o.loss>(rows[m]?rows[m].loss:-1)?i:m,0);
      read.innerHTML=rows.length?('After '+rows.length+' of '+tf.s.length+' characters: top guess right <b>'+right+'</b> times · total surprise <b class="r">'+N(tf.total,3)+'</b>'+(last?' · this step: −ln '+fp(last.p)+' = <b>'+(last.loss<0.001?N(last.loss,4):N(last.loss,3))+'</b>':'')+
        (k>=tf.s.length?'<br>Whole sentence: loss <b class="r">'+N(tf.total,3)+'</b> = '+N(tf.total/tf.s.length,3)+' per character. The hardest character was "'+show(rows[worst].ch)+'" (surprise '+N(rows[worst].loss,3)+').':'')+(k<tf.s.length?'<br>Fed in next: the <b>true</b> character "'+show(tf.s[k])+'", whatever the model guessed.':'<br>At every step the <b>true</b> character was fed in, whatever the model had guessed.')):
        'Teacher forcing: the true sentence is fed in one character at a time, and the model guesses each next character. Press <em>one step</em> or <em>▶ read the true sentence</em>.';
      S={mode:'train',truth:tf.s,k,rows:rows.map(o=>({ch:o.ch,guess:o.guess,p:o.p,loss:o.loss})),total:tf.total,h:(last?tf.hs[tf.hs.length-2]:h).slice(),dist:(last?last.dist:p).slice(),bars,cells}; }
    mfont(noteSvg); mfont(barSvg); declutter(barSvg); }
  function stop(){ clearInterval(timer); timer=null; }
  function animate(tick,fin){ stop(); if(RM){ while(tick()); fin&&fin(); render(); return; } timer=setInterval(()=>{ const more=tick(); render(); if(!more){ stop(); fin&&fin(); } },RM?0:55); }
  function talk(how){ st.how=how; st.mode='talk'; startTalk(); render(); animate(()=>{ if(done()) return false; talkOne(how); return !done(); }); }
  B.sample.addEventListener('click',()=>{ if(st.mode==='talk') talk('sample'); else { startTrain(); render(); animate(()=>trainOne()&&tf.k<tf.s.length); } });
  B.greedy.addEventListener('click',()=>talk('greedy'));
  B.step.addEventListener('click',()=>{ stop(); if(st.mode==='talk'){ if(!done()) talkOne(run.gen.length?run.gen[0].how:st.how); } else trainOne(); render(); });
  B.dice.addEventListener('click',()=>{ st.dice++; talk('sample'); });
  B.reset.addEventListener('click',()=>{ stop(); Object.assign(st,D0); inp.value=st.mode==='talk'?st.seed:st.truth; setCtl('tk-T',st.T,v=>N(v,1));
    document.getElementById('tk-mode').querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t==='talk'?'true':'false')); startTalk(); startTrain(); render(); });
  inp.addEventListener('input',()=>{ stop(); if(st.mode==='talk'){ st.seed=inp.value; startTalk(); } else { st.truth=inp.value; startTrain(); } render(); });
  bindCtl('tk-T',v=>{ st.T=v; render(); },v=>N(v,1));
  tabs(document.getElementById('tk-mode'),t=>{ stop(); st.mode=t; inp.value=t==='talk'?st.seed:st.truth; if(t==='talk') startTalk(); else startTrain(); render(); });
  startTalk(); startTrain(); render();
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); onResize(render);
  reg('w-talk',{state:()=>JSON.parse(JSON.stringify(S)),st,model:TALK,talk,step,scores,softT});
})();
