/* ===== SITE-X · round 15 cross-unit layer: search palette, shortcuts, thread links =====
   Injected into every page by build.js together with window.MBM_INDEX (from gen-site.js). */
(function () {
  'use strict';
  var IDX = window.MBM_INDEX; if (!IDX) return;
  var d = document, pad = function (n) { return String(n).padStart(2, '0'); };
  var m = location.pathname.match(/unit-(\d+)\.html$/), HERE = m ? +m[1] : 0;
  var PAGE = HERE ? 'unit' : /ideas\.html$/.test(location.pathname) ? 'ideas' : 'hub';
  var unitTitle = {}; IDX.units.forEach(function (u) { unitTitle[u.n] = u.t; });
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } } };
  var el = function (t, cls, html) { var e = d.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var typing = function (t) { t = t || d.activeElement; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); };
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  /* ---------------- the search index ---------------- */
  var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[–—−]/g, '-'); };
  var ITEMS = [];
  IDX.units.forEach(function (u) {
    ITEMS.push({ k: 'unit', u: u.n, soon: !!u.soon, t: u.t, sub: u.soon ? 'Upcoming' : 'Unit ' + u.n, href: u.soon ? 'index.html#journey' : 'unit-' + pad(u.n) + '.html', x: '' });
  });
  IDX.secs.forEach(function (s) { ITEMS.push({ k: 'sec', u: s[0], id: s[1], t: s[2], sub: 'Unit ' + s[0] + ' · ' + unitTitle[s[0]], href: 'unit-' + pad(s[0]) + '.html#' + s[1], x: s[3] }); });
  IDX.wids.forEach(function (w) { ITEMS.push({ k: 'wid', u: w[0], id: w[2], s: w[1], t: w[3], sub: 'Widget · Unit ' + w[0] + ' · ' + unitTitle[w[0]], href: 'unit-' + pad(w[0]) + '.html#' + w[2], x: '' }); });
  IDX.threads.forEach(function (th) { ITEMS.push({ k: 'thr', t: 'Thread: ' + th.name, sub: th.stops.length + ' stops across the course', href: 'ideas.html#thread-' + th.id, x: th.stops.map(function (s) { return s[2]; }).join(' · ') }); });
  ITEMS.push({ k: 'page', t: 'Big ideas — the whole course on one page', sub: 'Every realization, every thread', href: 'ideas.html', x: 'summary revision cheat sheet overview' });
  ITEMS.push({ k: 'page', t: 'All units — home', sub: 'The route and every unit', href: 'index.html', x: 'home hub route map' });
  ITEMS.forEach(function (it) { it.nt = norm(it.t); it.nh = norm(it.t + ' ' + it.sub + ' ' + it.x); });
  var KIND = { unit: 'Unit', sec: 'Section', wid: 'Widget', thr: 'Thread', page: 'Page' };

  function search(q) {
    var toks = norm(q).trim().split(/\s+/).filter(Boolean);
    if (!toks.length) return null;
    var out = [];
    for (var i = 0; i < ITEMS.length; i++) {
      var it = ITEMS[i], sc = 0, ok = true;
      for (var j = 0; j < toks.length; j++) {
        var t = toks[j], p = it.nt.indexOf(t);
        if (p === 0) sc += 12; else if (p > 0) sc += (/\W/.test(it.nt[p - 1]) ? 9 : 5);
        else if (it.nh.indexOf(t) >= 0) sc += 2; else { ok = false; break; }
      }
      if (!ok) continue;
      if (it.k === 'unit') sc += 4; if (it.k === 'thr' || it.k === 'page') sc += 1; if (it.soon) sc -= 3;
      if (HERE && it.u === HERE) sc += 1.5;
      out.push([sc, it]);
    }
    out.sort(function (a, b) { return b[0] - a[0]; });
    return out.slice(0, 40).map(function (r) { return r[1]; });
  }
  function hl(text, q) {
    var h = esc(text), toks = norm(q).trim().split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!toks.length) return h;
    var n = norm(text), marks = [];
    toks.forEach(function (t) { var p = n.indexOf(t); if (p >= 0) marks.push([p, p + t.length]); });
    if (!marks.length) return h;
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var res = '', pos = 0; marks.forEach(function (mk) { if (mk[0] < pos) return; res += esc(text.slice(pos, mk[0])) + '<mark>' + esc(text.slice(mk[0], mk[1])) + '</mark>'; pos = mk[1]; });
    return res + esc(text.slice(pos));
  }

  /* ---------------- palette UI ---------------- */
  var ov = el('div', 'sx-ov'); ov.hidden = true;
  ov.innerHTML = '<div class="sx-box" role="dialog" aria-modal="true" aria-label="Search the course">' +
    '<div class="sx-in"><span class="sx-ic" aria-hidden="true">⌕</span><input id="sx-q" type="search" autocomplete="off" spellcheck="false" placeholder="Search every unit — try “eigen”, “chain rule”, “Adam”…" aria-controls="sx-list" aria-autocomplete="list"><kbd class="sx-esc">esc</kbd></div>' +
    '<ul class="sx-list" id="sx-list" role="listbox"></ul>' +
    '<div class="sx-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>' + (isMac ? '⌘' : 'Ctrl') + '</kbd><kbd>K</kbd> or <kbd>/</kbd> search</span><span><kbd>?</kbd> shortcuts</span></div></div>';
  var q, list, sel = 0, cur = [], lastFocus = null;
  function mountOnce() { if (ov.parentNode) return; d.body.appendChild(ov); q = ov.querySelector('#sx-q'); list = ov.querySelector('#sx-list');
    q.addEventListener('input', function () { render(q.value); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (cur[sel]) go(cur[sel]); } else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); move(e.shiftKey ? -1 : 1); } });
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    list.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) go(cur[+li.dataset.i]); });
    list.addEventListener('mousemove', function (e) { var li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; paintSel(); } });
  }
  function defaults() {
    var arr = [], last = (store.get('mfml-last') || '').split('|');
    if (last.length === 2 && unitTitle[+last[0]]) arr.push({ k: 'resume', t: 'Continue where you left off', sub: 'Unit ' + last[0] + ' · ' + unitTitle[+last[0]], href: 'unit-' + pad(+last[0]) + '.html#' + last[1] });
    if (HERE) IDX.secs.filter(function (s) { return s[0] === HERE; }).forEach(function (s) { arr.push({ k: 'sec', u: HERE, id: s[1], t: s[2], sub: 'This unit', href: 'unit-' + pad(HERE) + '.html#' + s[1] }); });
    ITEMS.filter(function (it) { return it.k === 'unit' || it.k === 'page'; }).forEach(function (it) { if (!(HERE && it.u === HERE)) arr.push(it); });
    return arr;
  }
  function render(v) {
    var res = search(v); cur = res || defaults(); sel = 0;
    if (!cur.length) { list.innerHTML = '<li class="sx-none">Nothing matches “' + esc(v) + '”. Try a shorter word.</li>'; return; }
    var head = res ? '' : '<li class="sx-hd" role="presentation">' + (HERE ? 'This unit, then everything else' : 'Jump to') + '</li>';
    list.innerHTML = head + cur.map(function (it, i) {
      var kind = it.k === 'resume' ? 'Resume' : KIND[it.k];
      return '<li role="option" id="sx-o' + i + '" data-i="' + i + '" class="sx-it k-' + it.k + (it.soon ? ' soon' : '') + '">' +
        '<span class="sx-k">' + kind + '</span><span class="sx-m"><span class="sx-t">' + hl(it.t, v || '') + '</span>' +
        '<span class="sx-s">' + esc(it.sub) + (res && it.x ? ' — ' + hl(it.x.length > 120 ? it.x.slice(0, 118) + '…' : it.x, v) : '') + '</span></span><span class="sx-go" aria-hidden="true">↵</span></li>';
    }).join('');
    paintSel();
  }
  function paintSel() { list.querySelectorAll('li[data-i]').forEach(function (li) { var on = +li.dataset.i === sel; li.classList.toggle('on', on); li.setAttribute('aria-selected', on); if (on) { q.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); } }); }
  function move(k) { if (!cur.length) return; sel = (sel + k + cur.length) % cur.length; paintSel(); }
  function open(prefill) { mountOnce(); lastFocus = d.activeElement; ov.hidden = false; d.documentElement.classList.add('sx-open'); q.value = prefill || ''; render(q.value); setTimeout(function () { q.focus(); q.select(); }, 20); }
  function close() { ov.hidden = true; d.documentElement.classList.remove('sx-open'); if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { } }
  function go(it) {
    close(); if (!it) return;
    var same = HERE && it.u === HERE && it.id && (it.k === 'sec' || it.k === 'wid' || it.k === 'resume');
    if (same) { var t = d.getElementById(it.id); if (t) { history.pushState(null, '', '#' + it.id); t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); flash(t); return; } }
    location.href = it.href;
  }
  function flash(t) { t.classList.remove('sx-flash'); void t.offsetWidth; t.classList.add('sx-flash'); setTimeout(function () { t.classList.remove('sx-flash'); }, 1800); }

  /* ---------------- shortcuts sheet ---------------- */
  var help = el('div', 'sx-ov sx-help-ov'); help.hidden = true;
  function openHelp() {
    if (!help.parentNode) { d.body.appendChild(help); help.addEventListener('mousedown', function (e) { if (e.target === help) help.hidden = true; }); }
    var rows = [['/', 'Search the whole course'], [(isMac ? '⌘' : 'Ctrl') + ' K', 'Search (works while typing too)'], ['t', 'Switch light / dark theme']];
    if (PAGE === 'unit') rows.push(['n', 'Next section'], ['p', 'Previous section'], ['[', 'Previous unit'], [']', 'Next unit']);
    rows.push(['h', 'All units (home)'], ['i', 'Big ideas page'], ['?', 'This sheet'], ['esc', 'Close']);
    help.innerHTML = '<div class="sx-box sx-help" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"><h2>Keyboard shortcuts</h2><dl>' +
      rows.map(function (r) { return '<div><dt><kbd>' + esc(r[0]) + '</kbd></dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl><button type="button" class="sx-close">Close</button></div>';
    help.querySelector('.sx-close').addEventListener('click', function () { help.hidden = true; });
    help.hidden = false; help.querySelector('.sx-close').focus();
  }

  /* ---------------- section stepping (unit pages) ---------------- */
  function sections() { return Array.prototype.slice.call(d.querySelectorAll('section.unit[id]')); }
  function stepSection(k) {
    var S = sections(); if (!S.length) return; var y = 90, idx = -1;
    for (var i = 0; i < S.length; i++) { if (S[i].getBoundingClientRect().top <= y + 2) idx = i; }
    var t = S[Math.max(0, Math.min(S.length - 1, idx + k))]; if (k < 0 && idx >= 0 && S[idx].getBoundingClientRect().top < y - 40) t = S[idx];
    if (t) { history.replaceState(null, '', '#' + t.id); t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
  }
  var LIVE = IDX.units.filter(function (u) { return !u.soon; }).map(function (u) { return u.n; });

  d.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); ov.hidden === false ? close() : open(); return; }
    if (e.key === 'Escape' && !help.hidden) { help.hidden = true; return; }
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || (ov.parentNode && !ov.hidden)) return;
    var k = e.key;
    if (k === '/') { e.preventDefault(); open(); }
    else if (k === '?') { e.preventDefault(); openHelp(); }
    else if (k === 't') { var tb = d.getElementById('theme-btn'); if (tb) tb.click(); }
    else if (k === 'h') location.href = 'index.html';
    else if (k === 'i') location.href = 'ideas.html';
    else if (PAGE === 'unit' && (k === 'n' || k === 'p')) { e.preventDefault(); stepSection(k === 'n' ? 1 : -1); }
    else if (PAGE === 'unit' && (k === ']' || k === '[')) { var j = LIVE.indexOf(HERE) + (k === ']' ? 1 : -1); if (j >= 0 && j < LIVE.length) location.href = 'unit-' + pad(LIVE[j]) + '.html'; }
  });

  /* ---------------- the search button in every top bar ---------------- */
  function addButton() {
    var tb = d.getElementById('theme-btn'); if (!tb || d.getElementById('sx-btn')) return;
    var b = el('button', 'ghost sx-btn', '<span aria-hidden="true">⌕</span><span class="sx-bt">Search</span><kbd class="sx-kb">' + (isMac ? '⌘K' : 'Ctrl K') + '</kbd>');
    b.id = 'sx-btn'; b.type = 'button'; b.title = 'Search every unit (' + (isMac ? '⌘K' : 'Ctrl+K') + ' or /)'; b.setAttribute('aria-label', 'Search the course');
    b.addEventListener('click', function () { open(); });
    var before = tb.previousElementSibling && tb.previousElementSibling.classList.contains('navlink') ? tb.previousElementSibling : tb;
    before.parentNode.insertBefore(b, before);
  }

  /* ---------------- thread links at the end of a section (unit pages) ---------------- */
  function threads() {
    if (PAGE !== 'unit') return;
    IDX.threads.forEach(function (th) {
      th.stops.forEach(function (s, i) {
        if (s[0] !== HERE || !s[1]) return;
        var sec = d.getElementById(s[1]); if (!sec) return;
        var prev = th.stops[i - 1], next = th.stops[i + 1];
        var link = function (st, dir) {
          if (!st) return '';
          var lbl = (dir < 0 ? '← ' : '') + 'Unit ' + st[0] + ' · ' + esc(st[2]) + (dir > 0 ? ' →' : '');
          if (!st[1]) return '<span class="sx-tl soon">' + (dir > 0 ? 'Next: ' : '') + 'Unit ' + st[0] + ' · ' + esc(st[2]) + ' <em>(upcoming)</em></span>';
          return '<a class="sx-tl" href="unit-' + pad(st[0]) + '.html#' + st[1] + '">' + (dir > 0 ? 'Next: ' : 'Before: ') + lbl + '</a>';
        };
        var box = el('aside', 'sx-thread');
        box.setAttribute('aria-label', 'Thread: ' + th.name);
        box.innerHTML = '<span class="sx-tk">Thread</span><a class="sx-tn" href="ideas.html#thread-' + th.id + '">' + esc(th.name) + '</a>' +
          '<span class="sx-tp">stop ' + (i + 1) + ' of ' + th.stops.length + '</span>' +
          '<span class="sx-dots" aria-hidden="true">' + th.stops.map(function (x, k) { return '<i class="' + (k === i ? 'on' : x[1] ? '' : 'soon') + '"></i>'; }).join('') + '</span>' +
          '<span class="sx-tls">' + link(prev, -1) + link(next, 1) + '</span>';
        sec.appendChild(box);
      });
    });
  }

  function init() { addButton(); threads(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
  window.MBMSearch = { open: open, close: close, search: search };
})();
