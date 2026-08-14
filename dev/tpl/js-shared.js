
<script>
(function(){
"use strict";
/* ---------- shared helpers (house runtime) ---------- */
const store={mem:{},get(k){try{return localStorage.getItem(k)??this.mem[k]??null}catch(e){return this.mem[k]??null}},set(k,v){this.mem[k]=v;try{localStorage.setItem(k,v)}catch(e){}}};
const themeBtn=document.getElementById('theme-btn');const modes=['auto','light','dark'];let mode=store.get('mfml-theme')||'auto';
function applyTheme(){if(mode==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',mode);themeBtn.innerHTML = '<span class="tw">Theme: </span>' + mode;}
themeBtn.addEventListener('click',()=>{mode=modes[(modes.indexOf(mode)+1)%3];store.set('mfml-theme',mode);applyTheme();});applyTheme();
const rail=document.getElementById('read-progress');
addEventListener('scroll',()=>{const h=document.documentElement;rail.style.width=((h.scrollTop/(h.scrollHeight-h.clientHeight))*100).toFixed(2)+'%';},{passive:true});
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);if(parent)parent.appendChild(n);return n;}
function txt(parent,x,y,s,style,anchor){const t=el('text',{x,y,'text-anchor':anchor||'start'},parent);t.setAttribute('style',style||'font:600 11px system-ui;fill:var(--ink-muted)');t.textContent=s;return t;}
function plane(svg,X0,X1,Y0,Y1,opts){opts=opts||{};svg.innerHTML='';
  const W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height,pad=opts.pad||26;
  const s=Math.min((W-2*pad)/(X1-X0),(H-2*pad)/(Y1-Y0));
  const cx=pad+((W-2*pad)-s*(X1-X0))/2,cy=pad+((H-2*pad)-s*(Y1-Y0))/2;
  const px=x=>cx+(x-X0)*s,py=y=>H-cy-(y-Y0)*s,g=el('g',{},svg),step=opts.step||1;
  for(let x=Math.ceil(X0);x<=X1;x+=step)el('line',{x1:px(x),y1:py(Y0),x2:px(x),y2:py(Y1),stroke:'var(--grid)','stroke-width':x===0?0:1},g);
  for(let y=Math.ceil(Y0);y<=Y1;y+=step)el('line',{x1:px(X0),y1:py(y),x2:px(X1),y2:py(y),stroke:'var(--grid)','stroke-width':y===0?0:1},g);
  el('line',{x1:px(X0),y1:py(0),x2:px(X1),y2:py(0),stroke:'var(--axis)','stroke-width':1.5},g);
  el('line',{x1:px(0),y1:py(Y0),x2:px(0),y2:py(Y1),stroke:'var(--axis)','stroke-width':1.5},g);
  if(!opts.noticks){const te=opts.tickEvery||1;
    for(let x=Math.ceil(X0);x<=X1;x+=step)if(x!==0&&Math.abs(x)%te===0)txt(svg,px(x),py(0)+15,x,'font:500 10px system-ui;fill:var(--ink-muted)','middle');
    for(let y=Math.ceil(Y0);y<=Y1;y+=step)if(y!==0&&Math.abs(y)%te===0)txt(svg,px(0)-7,py(y)+3.5,y,'font:500 10px system-ui;fill:var(--ink-muted)','end');}
  return {px,py,svg};}
function arrow(p,x0,y0,x1,y1,color,w,label,lblStyle){const g=el('g',{},p.svg);
  const X0=p.px(x0),Y0=p.py(y0),X1=p.px(x1),Y1=p.py(y1),dx=X1-X0,dy=Y1-Y0,L=Math.hypot(dx,dy)||1;
  const hx=X1-dx/L*10,hy=Y1-dy/L*10;
  el('line',{x1:X0,y1:Y0,x2:hx,y2:hy,stroke:color,'stroke-width':w||2.5,'stroke-linecap':'round'},g);
  const nx=-dy/L*4.5,ny=dx/L*4.5;
  el('polygon',{points:`${X1},${Y1} ${hx+nx},${hy+ny} ${hx-nx},${hy-ny}`,fill:color},g);
  if(label)txt(p.svg,X1+dx/L*8+(dx>=0?2:-2),Y1+dy/L*8,label,lblStyle||`font:700 12px system-ui;fill:${color}`,dx>=0?'start':'end');
  return g;}
const fmt=(v,d=2)=>(+v).toFixed(d).replace(/\.?0+$/,'').replace(/^-0$/,'0');
function engine3d(svg,opts){opts=opts||{};
  const W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height;
  let yaw=opts.yaw??-0.62,pitch=opts.pitch??0.40,scale=opts.scale||70;
  const cx=W/2+(opts.cx||0),cy=H/2+(opts.cy||0),origin=opts.origin||[0,0,0];
  function proj(v){const x=v[0]-origin[0],y=v[1]-origin[1],z=v[2]-origin[2];
    const c=Math.cos(yaw),s=Math.sin(yaw),X=x*c+y*s,Y=-x*s+y*c;
    const cp=Math.cos(pitch),sp=Math.sin(pitch);
    return {x:cx+X*scale,y:cy-(Y*sp+z*cp)*scale,d:Y*cp-z*sp};}
  function drag(redraw){let last=null;
    svg.addEventListener('pointerdown',e=>{last=[e.clientX,e.clientY];try{svg.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault();});
    svg.addEventListener('pointermove',e=>{if(!last)return;yaw+=(e.clientX-last[0])*0.008;pitch=Math.max(-1.45,Math.min(1.45,pitch+(e.clientY-last[1])*0.008));last=[e.clientX,e.clientY];redraw();});
    ['pointerup','pointercancel'].forEach(ev=>svg.addEventListener(ev,()=>last=null));}
  return {proj,drag};}
function planePt(svg,p,e){const r=svg.getBoundingClientRect(),W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height;
  const sx=(e.clientX-r.left)/r.width*W,sy=(e.clientY-r.top)/r.height*H;
  const x0=p.px(0),y0=p.py(0),ux=p.px(1)-x0,uy=p.py(1)-y0;
  return [(sx-x0)/ux,(sy-y0)/uy];}
