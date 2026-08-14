/* ================= MBM-UX-V2 · navigation, resume, revision, print ================= */
(function(){
  var U = 5;
  var UNITS = [{"n":1,"t":"Systems of Linear Equations"},{"n":2,"t":"Vector Spaces"},{"n":3,"t":"Analytic Geometry"},{"n":4,"t":"Determinants & Eigenvalues"},{"n":5,"t":"Decompositions & SVD"}];
  var st = {get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},
            set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var secs = [].slice.call(document.querySelectorAll('section.unit'));

  /* publish this unit's real check total so the hub never hardcodes a denominator */
  st.set('mfml-u'+U+'-total', document.querySelectorAll('.check').length);

  /* ---- contents drawer (below 1420px) + unit switcher ---- */
  var toc = document.getElementById('toc'),
      btn = document.getElementById('toc-btn'),
      back = document.getElementById('toc-backdrop');
  if (toc && btn && back) {
    var prev = UNITS.filter(function(u){return u.n===U-1})[0],
        next = UNITS.filter(function(u){return u.n===U+1})[0];
    var nav = document.createElement('div');
    nav.className = 'toc-nav';
    nav.innerHTML = (prev ? '<a href="unit-0'+prev.n+'.html" title="'+prev.t+'">\u2190 Unit '+prev.n+'</a>' : '<span></span>')
                  + '<a class="hub" href="index.html">All units</a>'
                  + (next ? '<a href="unit-0'+next.n+'.html" title="'+next.t+'">Unit '+next.n+' \u2192</a>' : '<span></span>');
    toc.appendChild(nav);

    var close = document.createElement('button');
    close.className = 'toc-close'; close.type = 'button';
    close.setAttribute('aria-label','Close contents'); close.innerHTML = '\u00d7';
    toc.insertBefore(close, toc.firstChild);

    var open = false;
    function setOpen(v){
      open = v;
      toc.classList.toggle('open', v);
      back.classList.toggle('on', v);
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
      document.body.style.overflow = (v && innerWidth < 1420) ? 'hidden' : '';
      try { (v ? close : btn).focus(); } catch(e){}
    }
    btn.addEventListener('click', function(){ setOpen(!open); });
    close.addEventListener('click', function(){ setOpen(false); });
    back.addEventListener('click', function(){ setOpen(false); });
    addEventListener('keydown', function(e){ if (e.key === 'Escape' && open) setOpen(false); });
    toc.addEventListener('click', function(e){
      if (e.target.tagName === 'A' && innerWidth < 1420) setOpen(false);
    });
    addEventListener('resize', function(){ if (open && innerWidth >= 1420) setOpen(false); });
  }

  /* ---- remember the reading position (this unit + across the site) ---- */
  function currentIndex(){
    var i = 0;
    secs.forEach(function(s,j){ if (s.getBoundingClientRect().top < 150) i = j; });
    return i;
  }
  var tick = null;
  addEventListener('scroll', function(){
    if (tick) return;
    tick = setTimeout(function(){
      tick = null;
      var s = secs[currentIndex()];
      if (!s) return;
      st.set('mfml-u'+U+'-pos', s.id);
      st.set('mfml-last', U + '|' + s.id);
    }, 700);
  }, {passive:true});

  /* ---- offer to resume (never jump without asking) ---- */
  var savedId = st.get('mfml-u'+U+'-pos');
  if (!location.hash && savedId && secs.length && savedId !== secs[0].id) {
    var target = document.getElementById(savedId);
    if (target && scrollY < 200) {
      var h2 = target.querySelector('h2'), num = target.querySelector('.sec-num');
      var label = (h2 ? h2.textContent.replace(/\s+\u2014.*$/,'') : 'where you left off');
      if (label.length > 34) label = label.slice(0,33) + '\u2026';
      var pill = document.createElement('div');
      pill.className = 'resume';
      pill.innerHTML = '<span class="rl">Pick up where you left off</span>'
        + '<button class="rgo" type="button">' + (num ? '\u00a7' + num.textContent + ' ' : '') + label + ' \u2192</button>'
        + '<button class="rx" type="button" aria-label="Dismiss">\u00d7</button>';
      document.body.appendChild(pill);
      requestAnimationFrame(function(){ pill.classList.add('on'); });
      var hide = function(){ pill.classList.remove('on'); setTimeout(function(){ pill.remove(); }, 320); };
      pill.querySelector('.rgo').addEventListener('click', function(){
        target.scrollIntoView({behavior:'smooth', block:'start'});
        hide();
      });
      pill.querySelector('.rx').addEventListener('click', hide);
      setTimeout(hide, 14000);
    }
  }

  /* ---- practice arena: open / close every solution at once ---- */
  var arena = document.getElementById('spractice');
  if (arena) {
    var sols = [].slice.call(arena.querySelectorAll('details.sol'));
    var prose = arena.querySelector('.prose');
    if (sols.length && prose) {
      var bar = document.createElement('div');
      bar.className = 'sol-bulk';
      bar.innerHTML = '<span class="sb-l">' + sols.length + ' problems \u00b7 solutions stay hidden until you ask</span>'
        + '<span class="sb-b"><button class="ghost" type="button" data-a="open">Open all solutions</button>'
        + '<button class="ghost" type="button" data-a="close">Close all</button></span>';
      prose.parentNode.insertBefore(bar, prose.nextSibling);
      bar.addEventListener('click', function(e){
        var b = e.target.closest('button');
        if (!b) return;
        var want = b.dataset.a === 'open';
        sols.forEach(function(d){ d.open = want; });
      });
    }
  }

  /* ---- screen readers hear the verdict ---- */
  document.querySelectorAll('.check .why').forEach(function(w){
    w.setAttribute('role','status'); w.setAttribute('aria-live','polite');
  });

  /* ---- printing a unit prints the solutions too ---- */
  var reopened = [];
  addEventListener('beforeprint', function(){
    reopened = [].slice.call(document.querySelectorAll('details:not([open])'));
    reopened.forEach(function(d){ d.open = true; });
  });
  addEventListener('afterprint', function(){
    reopened.forEach(function(d){ d.open = false; });
    reopened = [];
  });
})();
</script>
</body>
</html>
<!-- BRAND-V1 -->
