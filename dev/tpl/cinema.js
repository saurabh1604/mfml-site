/* ================= CINEMA runtime · round 8 =================
   window.Cinema = { reveal, stage3d, glowFilter, colors, lerpColor, ramp, ease, reduced }
   - stage3d needs window.THREE (vendor/three.min.js, r160). Everything else is plain DOM.
   - Every animation honours prefers-reduced-motion. Renderers pause when off-screen. */
(function(){
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const colors = () => ({ s1:css('--s1'), s2:css('--s2'), s3:css('--s3'), s4:css('--s4'), s5:css('--s5'), s6:css('--s6'), s7:css('--s7'),
                          ink:css('--ink'), ink2:css('--ink-2'), muted:css('--ink-muted'), grid:css('--grid'), axis:css('--axis'), page:css('--page') });
  const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

  /* ---- scroll reveal ---- */
  function reveal(sel){
    const els = document.querySelectorAll(sel || '.reveal,.reveal-stagger');
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin:'0px 0px -8% 0px', threshold:.08 });
    els.forEach(e => io.observe(e));
  }

  /* ---- SVG glow filter, injected once ---- */
  function glowFilter(svg, id, blur){
    id = id || 'glow'; const NS = 'http://www.w3.org/2000/svg';
    let defs = svg.querySelector('defs'); if (!defs) { defs = document.createElementNS(NS,'defs'); svg.insertBefore(defs, svg.firstChild); }
    if (defs.querySelector('#'+id)) return 'url(#'+id+')';
    const f = document.createElementNS(NS,'filter'); f.setAttribute('id', id); f.setAttribute('x','-40%'); f.setAttribute('y','-40%'); f.setAttribute('width','180%'); f.setAttribute('height','180%');
    f.innerHTML = `<feGaussianBlur stdDeviation="${blur||2.6}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>`;
    defs.appendChild(f); return 'url(#'+id+')';
  }

  /* ---- colour helpers ---- */
  const hex = c => { const m = c.match(/#?([0-9a-f]{6})/i); if (m) return parseInt(m[1],16);
    const r = c.match(/rgba?\(([^)]+)\)/); if (r) { const [a,b,d] = r[1].split(',').map(Number); return (a<<16)|(b<<8)|d; } return 0xffffff; };
  const lerpColor = (a, b, t) => { const A = hex(a), B = hex(b); const ch = s => ((A>>s)&255) + (((B>>s)&255) - ((A>>s)&255))*t; return (Math.round(ch(16))<<16)|(Math.round(ch(8))<<8)|Math.round(ch(0)); };
  /* smooth 3-stop ramp cold→warm for surfaces */
  function ramp(t, a, b, c){ t = Math.max(0, Math.min(1, t)); return t < .5 ? lerpColor(a, b, t*2) : lerpColor(b, c, (t-.5)*2); }
  const ease = { out:t=>1-Math.pow(1-t,3), inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2 };

  /* ---- three.js stage ----
     stage3d(container, { camera:{pos:[x,y,z], look:[x,y,z], fov}, orbit:true, autoRotate:0.15,
                          build(ctx){...}, update(ctx, t, dt){...} })
     ctx = { THREE, scene, camera, renderer, root (a THREE.Group you add to), size, colors, isLight, requestRender }
     Returns { ctx, dispose, setAutoRotate, resize, render } */
  function stage3d(container, opts){
    if (!window.THREE) { container.innerHTML = '<div class="hint" style="position:static;padding:1rem">3D needs WebGL (three.js not loaded)</div>'; return null; }
    const THREE = window.THREE; opts = opts || {}; let dirty = true;
    container.classList.add('stage-canvas');
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'default', failIfMajorPerformanceCaveat:false }); }
    catch(e){ console.warn('stage3d: WebGL unavailable', e); container.innerHTML = '<div class="hint" style="position:static;padding:1rem;font-size:.9rem">This 3-D picture needs WebGL. Your browser blocked or lost the graphics context — try reloading, or enable hardware acceleration.</div>'; return null; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    /* if the browser kills this context (too many stages, GPU reset), say so and try to come back */
    renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); if (!container.contains(renderer.domElement)) return; /* a deliberate loss on an old, replaced canvas */ console.warn('stage3d: context lost'); if (!container.querySelector('.ctx-lost')) { const d = document.createElement('div'); d.className = 'hint ctx-lost'; d.style.cssText = 'left:.7rem;right:auto;top:.6rem;bottom:auto'; d.textContent = 'graphics paused — reload to restore'; container.appendChild(d); } });
    renderer.domElement.addEventListener('webglcontextrestored', () => { const d = container.querySelector('.ctx-lost'); if (d) d.remove(); dirty = true; });
    const scene = new THREE.Scene();
    const cam = opts.camera || {};
    const camera = new THREE.PerspectiveCamera(cam.fov || 38, 1, .05, 200);
    const p = cam.pos || [4.2, 3.2, 5.4]; camera.position.set(p[0], p[1], p[2]);
    const look = new THREE.Vector3(...(cam.look || [0,0,0]));
    camera.lookAt(look);
    const root = new THREE.Group(); scene.add(root);
    /* lights: key + fill + rim — the "cinema" look */
    const c = colors();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x223355, isLight() ? .9 : .5));
    const key = new THREE.DirectionalLight(0xffffff, isLight() ? 1.2 : 1.0); key.position.set(4, 7, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(hex(c.s6), .8); rim.position.set(-5, 2, -4); scene.add(rim);
    const fill = new THREE.PointLight(hex(c.s7), .6, 40); fill.position.set(-3, -2, 4); scene.add(fill);

    const ctx = { THREE, scene, camera, renderer, root, colors:c, isLight:isLight(), size:{w:1,h:1}, lights:{key,rim,fill}, hex, lerpColor, ramp, look };

    /* orbit: spherical coords around look */
    const sph = new THREE.Spherical().setFromVector3(camera.position.clone().sub(look));
    let auto = (opts.autoRotate == null ? 0 : opts.autoRotate) * (reduced ? 0 : 1);
    let dragging = false, lx = 0, ly = 0, running = true, lastT = performance.now(), userMoved = false;
    function place(){ camera.position.setFromSpherical(sph).add(look); camera.lookAt(look); dirty = true; }
    if (opts.orbit !== false){
      const el = renderer.domElement; el.style.touchAction = 'none'; el.style.cursor = 'grab';
      el.addEventListener('pointerdown', e => { dragging = true; userMoved = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); el.style.cursor='grabbing'; });
      el.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
        sph.theta -= dx * .008; sph.phi = Math.max(.15, Math.min(Math.PI - .15, sph.phi - dy * .008)); place(); });
      const up = e => { dragging = false; el.style.cursor='grab'; }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      el.addEventListener('wheel', e => { if (!opts.zoom) return; e.preventDefault(); sph.radius = Math.max(1.5, Math.min(40, sph.radius * (1 + Math.sign(e.deltaY) * .08))); place(); }, { passive:false });
    }
    function resize(){
      const w = container.clientWidth || 600, h = container.clientHeight || Math.round(w * (opts.aspect || .62));
      if (!container.style.height && !opts.fill) container.style.height = h + 'px';
      const H = container.clientHeight || h;
      renderer.setSize(w, H, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camera.aspect = w / H; camera.updateProjectionMatrix(); ctx.size = { w, h:H }; dirty = true;
    }
    new ResizeObserver(resize).observe(container); resize();
    if (opts.build) opts.build(ctx);
    function render(){ renderer.render(scene, camera); dirty = false; }
    function loop(now){
      if (!running) return;
      const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
      if (auto && !dragging && !(opts.autoRotateStopsOnUser && userMoved)) { sph.theta += auto * dt; place(); }
      if (opts.update) { const r = opts.update(ctx, now / 1000, dt); if (r !== false) dirty = true; }
      if (dirty) render();
      requestAnimationFrame(loop);
    }
    /* pause when off-screen */
    if ('IntersectionObserver' in window){
      new IntersectionObserver(es => es.forEach(e => { const on = e.isIntersecting; if (on && !running) { running = true; lastT = performance.now(); requestAnimationFrame(loop); } if (!on) running = false; }), { threshold:.02 }).observe(container);
    }
    requestAnimationFrame(loop);
    ctx.requestRender = () => { dirty = true; };
    ctx.orbit = { sph, place, setAuto:v => { auto = reduced ? 0 : v; } };
    return { ctx, render, resize, requestRender:ctx.requestRender, setAutoRotate:v => { auto = reduced ? 0 : v; },
      dispose(){ running = false; renderer.dispose(); container.innerHTML = ''; } };
  }

  /* ---- three.js primitives that carry the look ---- */
  const prim = {
    /* glowing arrow from a to b (THREE.Vector3 or arrays) */
    arrow(ctx, a, b, color, opts){
      const T = ctx.THREE; opts = opts || {}; a = a.isVector3 ? a : new T.Vector3(...a); b = b.isVector3 ? b : new T.Vector3(...b);
      const g = new T.Group(); const dir = b.clone().sub(a); const len = dir.length(); if (len < 1e-6) return g;
      const r = opts.radius || .035, hl = Math.min(opts.head || .28, len * .5), hr = r * 3.2;
      const shaft = new T.Mesh(new T.CylinderGeometry(r, r, len - hl, 14), new T.MeshStandardMaterial({ color, emissive:color, emissiveIntensity:ctx.isLight ? .15 : .55, roughness:.35, metalness:.1 }));
      const head = new T.Mesh(new T.ConeGeometry(hr, hl, 20), shaft.material);
      shaft.position.y = (len - hl) / 2; head.position.y = len - hl / 2; g.add(shaft, head);
      g.position.copy(a); g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), dir.clone().normalize());
      g.userData.set = (na, nb) => { const G = prim.arrow(ctx, na, nb, color, opts); g.position.copy(G.position); g.quaternion.copy(G.quaternion); const L = na.distanceTo ? na.distanceTo(nb) : new T.Vector3(...na).distanceTo(new T.Vector3(...nb)); const HL = Math.min(opts.head || .28, L*.5); shaft.scale.y = Math.max(1e-4,(L - HL)) / (len - hl); shaft.position.y = (L - HL)/2; head.position.y = L - HL/2; };
      return g;
    },
    /* floor/plane grid with soft fade */
    grid(ctx, size, div, color, opts){
      const T = ctx.THREE; opts = opts || {}; const g = new T.GridHelper(size, div, color, color);
      g.material.transparent = true; g.material.opacity = opts.opacity == null ? (ctx.isLight ? .5 : .35) : opts.opacity; g.material.depthWrite = false;
      if (opts.vertical) g.rotation.x = Math.PI / 2; return g;
    },
    /* axes triad */
    axes(ctx, L, opts){
      const T = ctx.THREE; const c = ctx.colors; const g = new T.Group(); L = L || 3;
      const mk = (v, col) => { const m = new T.LineBasicMaterial({ color:col, transparent:true, opacity:.9 }); const geo = new T.BufferGeometry().setFromPoints([new T.Vector3(-L,0,0).applyAxisAngle(new T.Vector3(0,0,1),0), new T.Vector3(L,0,0)]); const line = new T.Line(geo, m); return line; };
      const x = mk(null, hex(c.axis)); const y = mk(null, hex(c.axis)); y.rotation.z = Math.PI/2; const z = mk(null, hex(c.axis)); z.rotation.y = Math.PI/2;
      g.add(x, y, z); return g;
    },
    /* height-field surface z=f(x,y) with colour ramp and wireframe overlay */
    surface(ctx, f, opts){
      const T = ctx.THREE; opts = opts || {}; const n = opts.res || 90; const [x0,x1] = opts.x || [-2,2], [y0,y1] = opts.y || [-2,2];
      const geo = new T.PlaneGeometry(x1-x0, y1-y0, n, n); geo.rotateX(-Math.PI/2);
      const pos = geo.attributes.position; const col = new Float32Array(pos.count * 3); let zmin = Infinity, zmax = -Infinity; const zs = new Float32Array(pos.count);
      for (let i = 0; i < pos.count; i++){ const x = pos.getX(i) + (x0+x1)/2, y = -pos.getZ(i) + (y0+y1)/2; const z = f(x, y); zs[i] = z; zmin = Math.min(zmin, z); zmax = Math.max(zmax, z); }
      const zs2 = opts.zscale || 1; const c = ctx.colors; const a = opts.ramp || [c.s1, c.s7, c.s2];
      for (let i = 0; i < pos.count; i++){ pos.setY(i, zs[i] * zs2); const t = (zs[i] - zmin) / ((zmax - zmin) || 1); const k = new T.Color(ramp(t, a[0], a[1], a[2])).convertSRGBToLinear(); col[3*i] = k.r; col[3*i+1] = k.g; col[3*i+2] = k.b; }
      geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
      const mesh = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors:true, roughness:.6, metalness:.0, side:T.DoubleSide, transparent:true, opacity:opts.opacity == null ? .96 : opts.opacity }));
      const g = new T.Group(); g.add(mesh);
      if (opts.wire !== false){ const w = new T.Mesh(geo, new T.MeshBasicMaterial({ color:ctx.isLight ? 0x0d1020 : 0xffffff, wireframe:true, transparent:true, opacity:ctx.isLight ? .08 : .07 })); g.add(w); }
      g.userData = { zmin, zmax, geo, mesh, f }; return g;
    },
    /* glowing point/sphere */
    dot(ctx, pos, color, r){
      const T = ctx.THREE; const m = new T.Mesh(new T.SphereGeometry(r || .07, 20, 16), new T.MeshStandardMaterial({ color, emissive:color, emissiveIntensity:ctx.isLight ? .2 : .9, roughness:.3 }));
      m.position.set(...(pos.isVector3 ? [pos.x,pos.y,pos.z] : pos)); return m;
    },
    /* thin line path */
    path(ctx, pts, color, opts){
      const T = ctx.THREE; opts = opts || {}; const geo = new T.BufferGeometry().setFromPoints(pts.map(p => p.isVector3 ? p : new T.Vector3(...p)));
      return new T.Line(geo, new T.LineBasicMaterial({ color, transparent:true, opacity:opts.opacity == null ? .95 : opts.opacity }));
    },
    /* translucent glass plane */
    glass(ctx, w, h, color, opacity){
      const T = ctx.THREE; return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ color, transparent:true, opacity:opacity == null ? .18 : opacity, side:T.DoubleSide, roughness:.2, metalness:.1, emissive:color, emissiveIntensity:.15, depthWrite:false }));
    },
    /* sprite text label */
    label(ctx, text, pos, opts){
      const T = ctx.THREE; opts = opts || {}; const c = document.createElement('canvas'); const s = 4; const font = `${opts.weight || 600} ${(opts.size || 26) * s}px Inter, system-ui, sans-serif`;
      const g2 = c.getContext('2d'); g2.font = font; const w = Math.ceil(g2.measureText(text).width) + 16*s, h = Math.ceil((opts.size || 26) * 1.5) * s; c.width = w; c.height = h;
      g2.font = font; g2.textBaseline = 'middle'; g2.textAlign = 'center';
      if (opts.bg !== false){ g2.fillStyle = ctx.isLight ? 'rgba(255,255,255,.75)' : 'rgba(7,10,18,.65)'; const r = 10*s; g2.beginPath(); g2.roundRect(0, 0, w, h, r); g2.fill(); }
      g2.fillStyle = opts.color || (ctx.isLight ? '#0d1020' : '#eef1f8'); g2.fillText(text, w/2, h/2);
      const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
      const sp = new T.Sprite(new T.SpriteMaterial({ map:tex, transparent:true, depthTest:opts.depthTest !== false })); const k = (opts.scale || .0062); sp.scale.set(w/s*k, h/s*k, 1); sp.position.set(...(pos.isVector3 ? [pos.x,pos.y,pos.z] : pos)); return sp;
    }
  };

  window.Cinema = { reduced, colors, isLight, reveal, glowFilter, stage3d, prim, hex, lerpColor, ramp, ease };
  document.addEventListener('DOMContentLoaded', () => reveal());
})();
