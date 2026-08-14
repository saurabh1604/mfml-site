/* ---------- checks ---------- */
const solved=new Set((store.get('mfml-u5-checks')||'').split(',').filter(Boolean));
const scoreEl=document.getElementById('score');
function updScore(){ scoreEl.textContent=solved.size;
  var _c=document.getElementById('score-chip');
  if(_c) _c.classList.toggle('done', solved.size >= document.querySelectorAll('.check').length); }
document.querySelectorAll('.check').forEach(chk=>{
  const id=chk.dataset.check,why=chk.querySelector('.why');
  chk.querySelectorAll('.opts button').forEach(btn=>btn.addEventListener('click',()=>{
    chk.querySelectorAll('.opts button').forEach(b=>b.classList.remove('picked-good','picked-bad'));
    const ok=btn.hasAttribute('data-correct');
    btn.classList.add(ok?'picked-good':'picked-bad');
    why.className='why on '+(ok?'good':'bad');
    why.innerHTML=(ok?'<b class="st-good">✓ Correct.</b> ':'<b class="st-bad">✗ Not quite.</b> ')+btn.dataset.why;
    if(ok){solved.add(id);store.set('mfml-u5-checks',[...solved].join(','));updScore();}
  }));});
updScore();
/* ---------- toc ---------- */
(function(){
  const toc=document.getElementById('toc');if(!toc)return;
  const secs=[...document.querySelectorAll('section.unit')];
  secs.forEach(s=>{const h=s.querySelector('h2'),n=s.querySelector('.sec-num');if(!h)return;
    const a=document.createElement('a');a.href='#'+s.id;
    let t=h.textContent.replace(/\s+—.*$/,'');if(t.length>36)t=t.slice(0,35)+'…';
    a.textContent=(n?n.textContent+' · ':'')+t;toc.appendChild(a);});
  const links=[...toc.querySelectorAll('a')];
  function spy(){let i=0;secs.forEach((s,j)=>{if(s.getBoundingClientRect().top<150)i=j;});
    links.forEach((l,j)=>l.classList.toggle('on',j===i));}
  addEventListener('scroll',spy,{passive:true});spy();
})();
const mul2=(M,v)=>[M[0][0]*v[0]+M[0][1]*v[1],M[1][0]*v[0]+M[1][1]*v[1]];
