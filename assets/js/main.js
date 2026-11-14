(() => {
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const clamp = (v,a=0,b=1) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t) => a + (b-a)*t;
const ease = t => t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
const rnd = (a,b) => a + Math.random()*(b-a);
const store = { get(k){try{return sessionStorage.getItem(k)}catch(e){return null}}, set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}} };
const TAU = Math.PI*2;
let lenis = null;
try { if (window.Lenis && !RM) { lenis = new Lenis({ lerp: .08, smoothWheel: true }); lenis.stop(); } } catch(e) { lenis = null; }

/* ---------- split text ---------- */
$$('[data-split]').forEach(el => {
  let i = 0; const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span style="white-space:nowrap;display:inline-block">${[...w].map(ch => `<span class="ch"><i style="--i:${i++}">${ch}</i></span>`).join('')}</span>`).join(' ');
});
const aboutBig = $('#aboutBig');
aboutBig.innerHTML = aboutBig.textContent.trim().split(/\s+/).map(w => `<span class="wd">${w}</span>`).join(' ');
const aboutWords = $$('.wd', aboutBig);

/* ---------- helpers ---------- */
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function lg(c,x0,y0,x1,y1,stops){ const g=c.createLinearGradient(x0,y0,x1,y1); stops.forEach(([o,col])=>g.addColorStop(o,col)); return g; }
const COPPER = [[0,'#6E3612'],[.18,'#B9682C'],[.32,'#F7C48C'],[.42,'#DB8C4C'],[.7,'#9C5A23'],[1,'#5E2C0E']];
const STEEL = [[0,'#8E9AA0'],[.2,'#D9E1E4'],[.32,'#FFFFFF'],[.45,'#C3CDD1'],[.75,'#9AA6AC'],[1,'#6F7B81']];
function hexC(a,b,t){ const pa=[1,3,5].map(i=>parseInt(a.substr(i,2),16)), pb=[1,3,5].map(i=>parseInt(b.substr(i,2),16)); return `rgb(${pa.map((v,i)=>Math.round(lerp(v,pb[i],t))).join(',')})`; }
function sprite(rgb, size=64){ const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'); const r=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2); r.addColorStop(0,`rgba(${rgb},1)`); r.addColorStop(.35,`rgba(${rgb},.5)`); r.addColorStop(1,`rgba(${rgb},0)`); g.fillStyle=r; g.fillRect(0,0,size,size); return c; }
const SP = { gold: sprite('255,240,190'), white: sprite('255,255,255'), dust: sprite('190,160,120'), warm: sprite('255,200,120') };
function makeCloud(w, warm){
  w = Math.max(40, w|0); const h = (w*.5)|0, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.filter = 'blur(' + Math.max(2, Math.round(w/40)) + 'px)';
  for (let i=0;i<14;i++){ const x = rnd(w*.15,w*.85), y = rnd(h*.45,h*.7), r = rnd(w*.07,w*.16);
    const gr = g.createRadialGradient(x,y-r*.3,0,x,y,r); gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(.7,warm?'rgba(255,236,220,.75)':'rgba(255,250,240,.75)'); gr.addColorStop(1,'rgba(255,245,230,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
  g.filter = 'none'; g.globalCompositeOperation = 'source-atop';
  g.fillStyle = lg(g,0,h*.4,0,h*.8,[[0,'rgba(255,255,255,0)'],[1,warm?'rgba(220,150,130,.4)':'rgba(200,170,150,.35)']]); g.fillRect(0,0,w,h);
  return c;
}

/* ================= SCENES ================= */
let nmx = .5, nmy = .5;
addEventListener('pointermove', e => { nmx = e.clientX/innerWidth; nmy = e.clientY/innerHeight; }, {passive:true});

/* ---- FIELD (hero, farm, grower) ---- */
const FIELD = {
  init(s){
    const {w,h,o} = s, st = s.st, close = !!o.close;
    st.stalks = [];
    const base = close ? w/30 : w/(w<700?14:10);
    const layers = close ? [[.7,.55],[.6,.8],[.4,1.05]] : [[.9,.15],[.75,.25],[.45,.38]];
    layers.forEach(([dens,hf],L) => { for (let i=0;i<base*dens;i++){ const hh = h*hf*rnd(.75,1.15), leaves = [], nl = (L===0 && !close) ? 1 : 2+(Math.random()*2|0);
      for (let k=0;k<nl;k++) leaves.push({u:rnd(.4,.95), dir:Math.random()>.5?1:-1, len:hh*rnd(.22,.4), w:rnd(.6,1.2)});
      st.stalks.push({x:rnd(-20,w+20), h:hh, L, ph:rnd(0,TAU), sp:rnd(.7,1.2), leaves, tone:Math.random()}); } });
    const ev = !!o.evening;
    st.hills = [0,1,2].map(i => ({ph:[rnd(0,6),rnd(0,6),rnd(0,6)], amp:[h*.03,h*.018,h*.01], base:h*((close?.52:.57)+i*.05), col: ev ? ['#C7B2BC','#B9A486','#8F9A5A'][i] : ['#B8C7CF','#A8B79E','#8EA36B'][i]}));
    st.clouds = []; const nc = close ? 3 : (w<700?4:7);
    for (let i=0;i<nc;i++){ const cw = rnd(w*.2,w*.38); st.clouds.push({img:makeCloud(cw, ev), x:rnd(-cw,w), y:rnd(h*.03,h*.3), sp:rnd(.05,.15), d:rnd(.3,1)}); }
    st.birds = []; for (let i=0;i<(close?3:6);i++) st.birds.push({x:rnd(0,w), y:rnd(h*.1,h*.36), s:rnd(5,11)*(close?.8:1), sp:rnd(.35,.8), ph:rnd(0,6)});
    st.motes = []; for (let i=0;i<(close?50:(w<700?90:170));i++) st.motes.push({x:rnd(0,w), y:rnd(h*.3,h), z:rnd(.25,1), vx:rnd(-.2,.2), vy:rnd(.12,.45), ph:rnd(0,TAU)});
    st.wind = 0;
  },
  draw(s, t){
    const {ctx:c, w, h, o, st} = s, close = !!o.close, ev = !!o.evening;
    const drift = Math.sin(t*.00012)*.35 + (o.mouse ? (nmx-.5)*.6 : 0);
    // sky
    c.fillStyle = ev ? lg(c,0,0,0,h,[[0,'#7E9FC4'],[.4,'#E9C3B0'],[.62,'#F6B37A'],[1,'#F09A5C']]) : lg(c,0,0,0,h,[[0,'#8EC3DD'],[.38,'#CFE4EA'],[.6,'#FBE0B0'],[1,'#F7C987']]);
    c.fillRect(0,0,w,h);
    const sx = w*(o.sun?o.sun[0]:.7) - drift*30, sy = h*(o.sun?o.sun[1]:.5);
    let g = c.createRadialGradient(sx,sy,0,sx,sy,Math.max(w,h)*.6);
    g.addColorStop(0,'rgba(255,250,225,1)'); g.addColorStop(.05, ev?'rgba(255,210,140,.95)':'rgba(255,236,170,.9)'); g.addColorStop(.25, ev?'rgba(255,170,100,.4)':'rgba(255,214,140,.35)'); g.addColorStop(1,'rgba(255,214,140,0)');
    c.fillStyle = g; c.fillRect(0,0,w,h);
    if (!RM) { c.save(); c.translate(sx,sy); c.rotate(t*.00003);
      for (let i=0;i<14;i++){ const a = i/14*TAU, ww = .05 + .03*Math.sin(t*.0007+i*1.7), L = Math.max(w,h)*1.2;
        const rg = c.createRadialGradient(0,0,0,0,0,L); rg.addColorStop(0,`rgba(255,248,220,${.12+.05*Math.sin(t*.001+i)})`); rg.addColorStop(1,'rgba(255,248,220,0)');
        c.fillStyle = rg; c.beginPath(); c.moveTo(0,0); c.arc(0,0,L,a-ww,a+ww); c.closePath(); c.fill(); }
      c.restore(); }
    c.beginPath(); c.arc(sx, sy, Math.min(w,h)*.055, 0, TAU); c.fillStyle = ev ? 'rgba(255,236,200,.98)' : 'rgba(255,253,240,.98)'; c.fill();
    for (const cl of st.clouds){ if (!RM) cl.x += cl.sp*cl.d; if (cl.x > w + 50) cl.x = -cl.img.width; c.globalAlpha = .92; c.drawImage(cl.img, cl.x - drift*40*cl.d, cl.y); }
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(43,29,19,.6)'; c.lineWidth = 1.5; c.lineCap = 'round';
    for (const b of st.birds){ if (!RM){ b.x += b.sp; if (b.x > w+30) { b.x = -30; b.y = rnd(h*.1,h*.36); } }
      const f = Math.sin(t*.012*b.sp*1.4 + b.ph), y = b.y + Math.sin(t*.001+b.ph)*6;
      c.beginPath(); c.moveTo(b.x - b.s, y - f*b.s*.5); c.quadraticCurveTo(b.x - b.s*.4, y - b.s*.35 - f*b.s*.2, b.x, y); c.quadraticCurveTo(b.x + b.s*.4, y - b.s*.35 - f*b.s*.2, b.x + b.s, y - f*b.s*.5); c.stroke(); }
    st.hills.forEach((hl,i) => { const off = -drift*(10+i*14);
      c.beginPath(); c.moveTo(0,h); for (let x=0;x<=w+16;x+=16) c.lineTo(x, hl.base + Math.sin((x+off*3)*.0021*(close?1.6:1) + hl.ph[0])*hl.amp[0] + Math.sin((x+off*3)*.0057 + hl.ph[1])*hl.amp[1] + Math.sin((x+off*3)*.013 + hl.ph[2])*hl.amp[2]); c.lineTo(w,h); c.closePath();
      c.fillStyle = lg(c,0,hl.base-hl.amp[0],0,hl.base+h*.2,[[0,hl.col],[1,hexC(hl.col, ev?'#F2C7A0':'#F3E1BE',.35)]]); c.fill(); });
    c.fillStyle = lg(c,0,h*.48,0,h*.75,[[0,'rgba(255,236,200,0)'],[.5, ev?'rgba(255,200,150,.35)':'rgba(255,236,200,.35)'],[1,'rgba(255,236,200,0)']]); c.fillRect(0,h*.45,w,h*.3);
    st.wind = lerp(st.wind, o.mouse ? (nmx-.5)*36 : 0, .03);
    const STK = ev ? [['#9A9A70','#B9B08A'],['#61772C','#D2C060'],['#3E521A','#C2A848']] : [['#8FA07A','#A9B892'],['#5C7E2E','#B7CF62'],['#3D5A1C','#9DBB4E']];
    const wid = close ? [2.6,4.5,7] : [1.8,3,5];
    let lastL = -1;
    for (const sk of st.stalks){
      const lf = [.5,.78,1][sk.L];
      if (sk.L !== lastL && sk.L > 0) { const y0 = h*(close?.5:.62) + sk.L*h*.08; c.fillStyle = lg(c,0,y0,0,h,[[0,'rgba(120,140,60,0)'],[1, sk.L===1?'rgba(86,116,40,.5)':'rgba(48,70,22,.55)']]); c.fillRect(0,y0,w,h); }
      lastL = sk.L;
      const gu = RM ? 0 : Math.sin(sk.x*.0035 - t*.0013)*.65 + Math.sin(sk.x*.011 - t*.0027 + 1.3)*.3 + Math.sin(sk.x*.0007 - t*.0004)*.4;
      const sway = (gu*18 + Math.sin(t*.0016*sk.sp + sk.ph)*4 + st.wind) * lf * (sk.h/(h*.4)) * (close?.6:1);
      const bx = sk.x - drift*26*lf, by = h + 12, tx = bx + sway, ty = by - sk.h + Math.abs(sway)*.15;
      const [c0, c1] = STK[sk.L], col = sk.tone > .5 ? c0 : hexC(c0, '#6E8A36', .3);
      c.strokeStyle = col; c.lineWidth = wid[sk.L];
      c.beginPath(); c.moveTo(bx,by); c.quadraticCurveTo(bx + sway*.15, by - sk.h*.55, tx, ty); c.stroke();
      if (sk.L > 0) { c.strokeStyle = c1; c.globalAlpha = .55; c.lineWidth = wid[sk.L]*.33; c.beginPath(); c.moveTo(bx+wid[sk.L]*.3,by); c.quadraticCurveTo(bx + sway*.15 + wid[sk.L]*.3, by - sk.h*.55, tx+1, ty); c.stroke(); c.globalAlpha = 1; }
      c.strokeStyle = 'rgba(40,50,20,.45)'; c.lineWidth = wid[sk.L]*.45;
      for (let k=1;k<5;k++){ const u = k/5.2, nx = bx + (tx-bx)*u*u, ny = by - (by-ty)*u; c.beginPath(); c.moveTo(nx-wid[sk.L],ny); c.lineTo(nx+wid[sk.L],ny); c.stroke(); }
      for (const lv of sk.leaves){
        const u = lv.u, px = bx + (tx-bx)*u*u, py = by - (by-ty)*u, L2 = lv.len, d = lv.dir, bw = (2.2+lv.w*2.4)*lf*(close?1.8:1);
        const tipx = px + d*L2*.95 + sway*.9, tipy = py + L2*.18 - Math.abs(sway)*.1, cxp = px + d*L2*.45 + sway*.4, cyp = py - L2*.42;
        c.fillStyle = lg(c,px,py,tipx,tipy,[[0,col],[.55,c1],[1,col]]);
        c.beginPath(); c.moveTo(px,py); c.quadraticCurveTo(cxp, cyp - bw, tipx, tipy); c.quadraticCurveTo(cxp, cyp + bw, px, py+2); c.fill();
      }
    }
    for (const q of st.motes){
      if (!RM){ q.y -= q.vy*q.z; q.x += q.vx + Math.sin(t*.0009+q.ph)*.35*q.z + st.wind*.004; }
      if (q.y < -20) { q.y = h + 20; q.x = Math.random()*w; }
      const sz = (3 + q.z*9) * (close?1.3:1); c.globalAlpha = (.25 + .6*(.5+.5*Math.sin(t*.003 + q.ph)))*q.z;
      c.drawImage(SP.gold, q.x - drift*30*q.z - sz/2, q.y - sz/2, sz, sz);
    }
    c.globalAlpha = 1;
  }
};

/* ---- STILL (distillery) ---- */
const STILL = {
  init(s){ s.st.bub = Array.from({length:22}, () => ({x:rnd(-1,1), k:Math.random(), sp:rnd(.4,1), r:rnd(.02,.06)})); s.st.steam = Array.from({length:14}, () => ({k:Math.random(), dx:rnd(-1,1), sp:rnd(.6,1.2)})); s.st.dust = Array.from({length:40}, () => ({x:Math.random(), y:Math.random(), z:rnd(.3,1), ph:rnd(0,6)})); },
  draw(s, t){
    const {ctx:c, w, h, st, o} = s, night = !!o.night;
    // room
    c.fillStyle = night ? lg(c,0,0,0,h,[[0,'#2F3346'],[1,'#4A4250']]) : lg(c,0,0,0,h,[[0,'#F1E4CC'],[.7,'#E0CBA6'],[1,'#CDB592']]); c.fillRect(0,0,w,h);
    // window + light shafts
    const wx = w*.06, wy = h*.08, ww = w*.2, wh = h*.32;
    c.fillStyle = night ? lg(c,0,wy,0,wy+wh,[[0,'#1E2A48'],[1,'#3A3E66']]) : lg(c,0,wy,0,wy+wh,[[0,'#CFE8F2'],[1,'#FFF5DC']]);
    rr(c,wx,wy,ww,wh,6); c.fill(); c.strokeStyle = night?'#5C566A':'#B59A74'; c.lineWidth = 5; c.stroke(); c.beginPath(); c.moveTo(wx+ww/2,wy); c.lineTo(wx+ww/2,wy+wh); c.moveTo(wx,wy+wh/2); c.lineTo(wx+ww,wy+wh/2); c.stroke();
    if (night) { c.fillStyle = 'rgba(255,255,255,.8)'; for (let i=0;i<6;i++){ c.globalAlpha = .4+.6*Math.abs(Math.sin(t*.001+i)); c.fillRect(wx+ww*((i*37)%100)/100, wy+wh*((i*53)%90)/100, 2, 2);} c.globalAlpha = 1; }
    else { c.save(); c.globalAlpha = .16 + .04*Math.sin(t*.0008);
      c.fillStyle = lg(c,wx,wy,wx+w*.5,h,[[0,'rgba(255,250,225,1)'],[1,'rgba(255,250,225,0)']]);
      c.beginPath(); c.moveTo(wx,wy); c.lineTo(wx+ww,wy); c.lineTo(wx+ww+w*.42,h*.95); c.lineTo(wx+w*.28,h*.95); c.closePath(); c.fill(); c.restore();
      for (const d of st.dust){ const x = (wx + ww*.2 + (d.x*w*.45) + Math.sin(t*.0004+d.ph)*20), y = (wy + d.y*h*.8 + Math.cos(t*.0003+d.ph)*14); const sz = 2 + d.z*4; c.globalAlpha = .5*d.z*(.5+.5*Math.sin(t*.002+d.ph)); c.drawImage(SP.white, x-sz/2, y-sz/2, sz, sz); } c.globalAlpha = 1; }
    // floor
    const fy = h*.84; c.fillStyle = night ? lg(c,0,fy,0,h,[[0,'#3B3237'],[1,'#2A2428']]) : lg(c,0,fy,0,h,[[0,'#A98760'],[1,'#7F6142']]); c.fillRect(0,fy,w,h-fy);
    const R = Math.min(w*.17, h*.22), cx = w*.38, by = fy;
    // fire glow
    const fl = .8 + .2*Math.sin(t*.02) + .1*Math.sin(t*.051);
    let g = c.createRadialGradient(cx,by,0,cx,by,R*1.6); g.addColorStop(0,`rgba(255,140,40,${.5*fl})`); g.addColorStop(1,'rgba(255,140,40,0)'); c.fillStyle = g; c.fillRect(cx-R*2,by-R*1.5,R*4,R*2);
    // still pot (onion)
    const pot = new Path2D(); pot.moveTo(cx-R*.9, by); pot.bezierCurveTo(cx-R*1.35, by-R*.9, cx-R*.6, by-R*1.75, cx-R*.18, by-R*1.95); pot.lineTo(cx+R*.18, by-R*1.95); pot.bezierCurveTo(cx+R*.6, by-R*1.75, cx+R*1.35, by-R*.9, cx+R*.9, by); pot.closePath();
    c.fillStyle = lg(c,cx-R*1.2,0,cx+R*1.2,0,COPPER); c.fill(pot);
    c.save(); c.clip(pot); const hx = cx - R*.45 + Math.sin(t*.0005)*R*.08; c.fillStyle = lg(c,hx-R*.12,0,hx+R*.12,0,[[0,'rgba(255,240,220,0)'],[.5,'rgba(255,240,220,.6)'],[1,'rgba(255,240,220,0)']]); c.fillRect(hx-R*.12, by-R*2, R*.24, R*2);
    c.fillStyle = 'rgba(60,25,5,.25)'; c.fillRect(cx-R*1.4, by-R*.25, R*2.8, R*.25); c.restore();
    // rivets band
    c.fillStyle = 'rgba(80,35,10,.6)'; for (let i=-4;i<=4;i++){ c.beginPath(); c.arc(cx + i*R*.2, by-R*1.05 + Math.abs(i)*R*.035, R*.025, 0, TAU); c.fill(); }
    // sight glass
    const gx = cx, gy = by - R*.6, gr = R*.3;
    c.save(); c.beginPath(); c.arc(gx,gy,gr,0,TAU); c.clip();
    c.fillStyle = '#F4E8D6'; c.fillRect(gx-gr,gy-gr,gr*2,gr*2);
    const lvl = gy - gr*.1; c.beginPath(); c.moveTo(gx-gr,lvl); for (let x=-gr;x<=gr;x+=3) c.lineTo(gx+x, lvl + Math.sin(x*.15 + t*.008)*gr*.06 + Math.sin(x*.3 - t*.013)*gr*.03); c.lineTo(gx+gr,gy+gr); c.lineTo(gx-gr,gy+gr); c.closePath();
    c.fillStyle = lg(c,0,lvl,0,gy+gr,[[0,'#F2C36E'],[1,'#B3700F']]); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)';
    for (const b of st.bub){ if (!RM) b.k += .006*b.sp; if (b.k > 1) { b.k = 0; b.x = rnd(-.9,.9); } const y = gy + gr - b.k*(gr*1.1), x = gx + b.x*gr*.8 + Math.sin(t*.005+b.k*9)*2; if (y > lvl) { c.beginPath(); c.arc(x, y, gr*b.r*(.6+b.k), 0, TAU); c.fill(); } }
    c.restore();
    c.beginPath(); c.arc(gx,gy,gr,0,TAU); c.lineWidth = R*.07; c.strokeStyle = lg(c,gx-gr,0,gx+gr,0,[[0,'#8A6A2A'],[.4,'#F3D58A'],[1,'#7A5A1A']]); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(gx-gr*.4, gy-gr*.4, gr*.18, gr*.08, -.7, 0, TAU); c.fill();
    // neck + lyne arm
    const nx = cx, ny = by - R*1.95;
    c.fillStyle = lg(c,nx-R*.18,0,nx+R*.18,0,COPPER); c.fillRect(nx-R*.16, ny-R*.55, R*.32, R*.56);
    c.beginPath(); c.arc(nx, ny-R*.55, R*.24, Math.PI, 0); c.fill();
    const cdX = w*.78, cdTop = by - R*1.9, cdW = R*.62, cdH = R*1.55;
    c.lineCap = 'round'; c.lineWidth = R*.13; c.strokeStyle = lg(c,0,ny-R*.9,0,ny-R*.5,[[0,'#F0B271'],[.5,'#C97A3A'],[1,'#7E4519']]);
    c.beginPath(); c.moveTo(nx, ny-R*.7); c.bezierCurveTo(nx+R*.6, ny-R*1.1, cdX-cdW*.3, cdTop-R*.4, cdX, cdTop+R*.05); c.stroke();
    // condenser
    rr(c, cdX-cdW/2, cdTop, cdW, cdH, cdW*.15); c.fillStyle = lg(c,cdX-cdW/2,0,cdX+cdW/2,0,STEEL); c.fill();
    c.fillStyle = 'rgba(0,0,0,.08)'; for (let i=1;i<5;i++) c.fillRect(cdX-cdW/2, cdTop + cdH*i/5, cdW, 2);
    // spout + drip
    const sx = cdX + cdW*.15, syy = cdTop + cdH + R*.04;
    c.fillStyle = lg(c,sx-6,0,sx+6,0,COPPER); c.fillRect(sx-R*.05, cdTop+cdH-2, R*.1, R*.14);
    const jarW = R*.7, jarH = R*.75, jarX = sx - jarW/2, jarY = fy - jarH;
    const cyc = 1500, ph = (t % cyc)/cyc;
    const fill = ((t % 24000)/24000)*.75 + .1;
    const surf = jarY + jarH*(1-fill);
    // jar glass back
    rr(c, jarX, jarY, jarW, jarH, jarW*.12); c.fillStyle = 'rgba(230,240,238,.45)'; c.fill();
    c.save(); rr(c, jarX, jarY, jarW, jarH, jarW*.12); c.clip();
    c.beginPath(); c.moveTo(jarX, surf); for (let x=0;x<=jarW;x+=3) c.lineTo(jarX+x, surf + Math.sin(x*.2 + t*.006)*1.2 + (ph>.85 ? Math.sin(x*.5)*2*(1-(ph-.85)/.15) : 0)); c.lineTo(jarX+jarW, jarY+jarH); c.lineTo(jarX, jarY+jarH); c.closePath();
    c.fillStyle = lg(c,0,surf,0,jarY+jarH,[[0,'#EEF6F4'],[1,'#C9DDD8']]); c.fill(); c.restore();
    rr(c, jarX, jarY, jarW, jarH, jarW*.12); c.strokeStyle = 'rgba(80,90,90,.35)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = lg(c,jarX,0,jarX+jarW,0,[[0,'rgba(255,255,255,.6)'],[.2,'rgba(255,255,255,0)'],[.85,'rgba(255,255,255,0)'],[1,'rgba(255,255,255,.35)']]); rr(c, jarX, jarY, jarW, jarH, jarW*.12); c.fill();
    // drop
    const dr = R*.045;
    if (ph < .6) { const k = ph/.6; c.fillStyle = 'rgba(230,245,250,.95)'; c.beginPath(); c.ellipse(sx, syy + dr*k, dr*k*.9, dr*k*1.15, 0, 0, TAU); c.fill(); }
    else if (ph < .85) { const k = (ph-.6)/.25, yy = syy + dr + (surf - syy - dr)*k*k; c.fillStyle = 'rgba(230,245,250,.95)'; c.beginPath(); c.ellipse(sx, yy, dr*.8, dr*1.3, 0, 0, TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(sx-dr*.3, yy-dr*.3, dr*.25, 0, TAU); c.fill(); }
    else { const k = (ph-.85)/.15; c.strokeStyle = `rgba(255,255,255,${1-k})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(sx, surf, jarW*.4*k, 3*k, 0, 0, TAU); c.stroke(); }
    // steam
    for (const sm of st.steam){ if (!RM) sm.k += .003*sm.sp; if (sm.k > 1) { sm.k = 0; sm.dx = rnd(-1,1); }
      const x = nx + sm.dx*R*.2 + sm.k*R*.6, y = ny - R*.7 - sm.k*R*1.2, sz = R*(.2 + sm.k*.9); c.globalAlpha = (night?.25:.5)*Math.sin(sm.k*Math.PI); c.drawImage(SP.white, x-sz/2, y-sz/2, sz, sz); }
    c.globalAlpha = 1;
    if (night) { c.fillStyle = 'rgba(255,190,110,.12)'; c.fillRect(0,0,w,h); }
  }
};

/* ---- TANK (store & split) ---- */
const TANK = {
  init(s){ s.st.b = Array.from({length:30}, () => ({x:Math.random(), k:Math.random(), sp:rnd(.4,1)})); },
  draw(s, t){
    const {ctx:c, w, h, st} = s;
    c.fillStyle = lg(c,0,0,0,h,[[0,'#BFE0EE'],[.7,'#EAF2EF'],[1,'#F4EEE2']]); c.fillRect(0,0,w,h);
    const gy = h*.86; c.fillStyle = lg(c,0,gy,0,h,[[0,'#CFC4B2'],[1,'#B4A792']]); c.fillRect(0,gy,w,h-gy);
    // tank
    const tw = Math.min(w*.36, h*.5), tx = w*.12, th = h*.62, ty = gy - th;
    rr(c, tx, ty, tw, th, tw*.06); c.fillStyle = lg(c,tx,0,tx+tw,0,STEEL); c.fill();
    c.beginPath(); c.ellipse(tx+tw/2, ty+2, tw/2, tw*.08, 0, Math.PI, 0); c.fillStyle = lg(c,tx,0,tx+tw,0,STEEL); c.fill();
    c.fillStyle = 'rgba(0,0,0,.06)'; for (let i=1;i<5;i++) c.fillRect(tx, ty + th*i/5, tw, 2);
    // ladder
    c.strokeStyle = 'rgba(70,80,85,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx+tw*.86, ty-4); c.lineTo(tx+tw*.86, gy); c.moveTo(tx+tw*.96, ty-4); c.lineTo(tx+tw*.96, gy); for (let y=ty; y<gy; y+=10){ c.moveTo(tx+tw*.86,y); c.lineTo(tx+tw*.96,y);} c.stroke();
    // window
    const wx = tx + tw*.18, wy = ty + th*.18, ww = tw*.5, wh = th*.68;
    rr(c,wx,wy,ww,wh,ww*.2); c.fillStyle = 'rgba(240,248,248,.9)'; c.fill();
    c.save(); rr(c,wx,wy,ww,wh,ww*.2); c.clip();
    const lvl = wy + wh*(.32 + .03*Math.sin(t*.0007));
    c.beginPath(); c.moveTo(wx, lvl); for (let x=0;x<=ww;x+=3) c.lineTo(wx+x, lvl + Math.sin(x*.1 + t*.004)*2.2 + Math.sin(x*.23 - t*.003)*1.1); c.lineTo(wx+ww, wy+wh); c.lineTo(wx, wy+wh); c.closePath();
    c.fillStyle = lg(c,0,lvl,0,wy+wh,[[0,'#DDF0F2'],[1,'#9FCAD3']]); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)'; for (const b of st.b){ if (!RM) b.k += .004*b.sp; if (b.k > 1) { b.k = 0; b.x = Math.random(); } const y = wy+wh - b.k*(wy+wh-lvl); c.beginPath(); c.arc(wx + b.x*ww + Math.sin(t*.004 + b.k*10)*2, y, 1 + b.k*1.6, 0, TAU); c.fill(); }
    c.restore();
    rr(c,wx,wy,ww,wh,ww*.2); c.strokeStyle = '#7C878C'; c.lineWidth = 4; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(wx+ww*.12, wy+wh*.08, ww*.07, wh*.84);
    // gauge
    const gx = tx + tw*.5, gyy = ty + th*.09, grr = tw*.07;
    c.beginPath(); c.arc(gx, gyy, grr, 0, TAU); c.fillStyle = '#FFFDF8'; c.fill(); c.strokeStyle = '#6F7B81'; c.lineWidth = 3; c.stroke();
    const na = -2.2 + 1.2 + Math.sin(t*.0011)*.25 + Math.sin(t*.0047)*.05; c.strokeStyle = '#B23A1A'; c.lineWidth = 2; c.beginPath(); c.moveTo(gx,gyy); c.lineTo(gx + Math.cos(na)*grr*.8, gyy + Math.sin(na)*grr*.8); c.stroke();
    // pipes out
    const px = tx + tw, py = gy - th*.12, pr = Math.max(8, tw*.07);
    const up = new Path2D(), dn = new Path2D();
    const ex = w*.92, uy = h*.3, dy = h*.66, mx = (px + ex)/2;
    up.moveTo(px, py); up.bezierCurveTo(mx, py, mx, uy, ex, uy);
    dn.moveTo(px, py); dn.bezierCurveTo(mx, py, mx, dy, ex, dy);
    c.lineCap = 'round';
    [[up,'#E3A136','#FFE1A0'],[dn,'#5DB3D6','#D6F1FB']].forEach(([p,col,hi],i) => {
      c.lineWidth = pr*1.5; c.strokeStyle = '#B9C3C7'; c.stroke(p); c.lineWidth = pr; c.strokeStyle = col; c.stroke(p);
      c.lineWidth = pr*.28; c.strokeStyle = hi; c.setLineDash([pr*.8, pr*2.2]); c.lineDashOffset = RM ? 0 : -t*.06*(i?1.1:1); c.stroke(p); c.setLineDash([]);
    });
    // end markers
    const em = (x,y,col,label) => { c.beginPath(); c.arc(x,y,pr*1.5,0,TAU); c.fillStyle = '#FFFDF8'; c.fill(); c.lineWidth = 3; c.strokeStyle = col; c.stroke(); c.fillStyle = '#2B1D13'; c.font = `600 ${Math.max(12, w*.03)|0}px Hanken Grotesk, sans-serif`; c.textAlign = 'right'; c.fillText(label, x - pr*2.2, y + 5); };
    em(ex, uy, '#E3A136', 'Spirits'); em(ex, dy, '#5DB3D6', 'Fuel ethanol');
  }
};

/* ---- BOTTLING LINE ---- */
const BOT = new Path2D('M52 14 h16 v56 c22 8 30 18 30 38 v170 a10 10 0 0 1 -10 10 h-56 a10 10 0 0 1 -10 -10 v-170 c0 -20 8 -30 30 -38 Z');
const BOTTLING = {
  init(s){},
  draw(s, t){
    const {ctx:c, w, h} = s;
    c.fillStyle = lg(c,0,0,0,h,[[0,'#E4ECEA'],[1,'#CFD8D5']]); c.fillRect(0,0,w,h);
    // back windows with soft light
    for (let i=0;i<4;i++){ const x = w*(.05 + i*.25), y = h*.08; rr(c,x,y,w*.18,h*.3,6); c.fillStyle = lg(c,0,y,0,y+h*.3,[[0,'#F8FBF6'],[1,'#DCE8E4']]); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(w*.05,h*.38); c.lineTo(w*.23,h*.38); c.lineTo(w*.45,h); c.lineTo(w*.15,h); c.fill();
    const beltY = h*.78, bh = h*.42, sc = bh/300, bw = 120*sc, sp = Math.max(bw*1.55, w*.14);
    const T = 2600, cyc = t/T, n = Math.floor(cyc), f = cyc - n, mv = RM ? 1 : ease(clamp(f/.38));
    const nozX = w*.5, jn = 0;
    // machinery frame
    c.fillStyle = lg(c,nozX-w*.09,0,nozX+w*.09,0,STEEL); rr(c, nozX - w*.09, 0, w*.18, beltY - bh - h*.1, 8); c.fill();
    const capX = nozX + sp; c.fillStyle = lg(c,capX-w*.05,0,capX+w*.05,0,STEEL); rr(c, capX-w*.05, 0, w*.1, beltY - bh - h*.2, 6); c.fill();
    // conveyor
    c.fillStyle = lg(c,0,beltY,0,beltY+h*.05,[[0,'#5A5F62'],[1,'#2F3335']]); c.fillRect(0, beltY, w, h*.05);
    c.fillStyle = lg(c,0,beltY+h*.05,0,h,[[0,'#9AA3A6'],[1,'#7C8588']]); c.fillRect(0, beltY + h*.05, w, h);
    const off = (n + mv)*sp;
    c.fillStyle = 'rgba(255,255,255,.12)'; for (let x = -(off % 24); x < w; x += 24) c.fillRect(x, beltY+2, 2, h*.04);
    for (let x = -(off % (h*.06)) ; x < w; x += h*.06) { c.beginPath(); c.arc(x, beltY + h*.075, h*.018, 0, TAU); c.fillStyle = '#C3CBCE'; c.fill(); c.strokeStyle = '#6C7477'; c.lineWidth = 1; c.stroke(); }
    // bottles
    const firstJ = Math.floor((-nozX)/sp) - 2, lastJ = Math.ceil((w - nozX)/sp) + 1;
    for (let j = firstJ; j <= lastJ; j++){
      const x = nozX + (j - 1 + mv)*sp; // j=0 arrives at nozzle when mv=1? adjust so slot jn=0 under nozzle after move
      const slot = j - 1 + 1; // bottle index relative to nozzle after move
      const xx = nozX + (slot - 1 + mv)*sp;
      let fill = 0, cap = false;
      if (slot - 1 >= 1) { fill = 1; } // moved past nozzle earlier
      if (slot === 1) { fill = mv < 1 ? 1 : 1; }
      if (slot === 0) { fill = f < .38 ? 0 : clamp((f-.42)/.42); }
      if (slot >= 1) fill = 1;
      if (slot >= 2) cap = true;
      if (slot === 1) cap = f > .62;
      drawBottle(c, xx, beltY, sc, fill, cap, t + j*400);
      if (slot === 0 && f > .38 && f < .88) { // stream
        const topY = beltY - bh*.97, surfY = beltY + 2*sc - 230*fill*sc;
        const k1 = clamp((f-.38)/.05), k2 = clamp((f-.84)/.04), y0 = lerp(topY, surfY, k2), y1 = lerp(topY, surfY, k1);
        if (y1 > y0) { c.beginPath(); for (let y=y0; y<=y1; y+=3) c.lineTo(nozX - 2.4 + Math.sin(y*.08 + t*.03)*.8, y); for (let y=y1; y>=y0; y-=3) c.lineTo(nozX + 2.4 + Math.sin(y*.08 + t*.03)*.8, y); c.closePath();
          c.fillStyle = lg(c,nozX-3,0,nozX+3,0,[[0,'#B97514'],[.5,'#FFD58A'],[1,'#B97514']]); c.fill(); }
      }
    }
    // nozzle
    c.fillStyle = lg(c,nozX-8,0,nozX+8,0,STEEL); const ntop = beltY - bh - h*.1; c.fillRect(nozX - w*.012, ntop, w*.024, beltY - bh*.97 - ntop);
    // capper head
    const press = (f > .5 && f < .78) ? Math.sin((f-.5)/.28*Math.PI) : 0; const chY = beltY - bh - h*.2 + press*h*.1;
    c.fillStyle = lg(c,capX-14,0,capX+14,0,STEEL); rr(c, capX - w*.025, beltY - bh - h*.2, w*.05, chY - (beltY - bh - h*.2) + h*.06, 4); c.fill();
  }
};
function drawBottle(c, x, baseY, sc, fill, cap, t){
  c.save(); c.translate(x - 60*sc, baseY - 300*sc + 12*sc); c.scale(sc, sc);
  c.fillStyle = 'rgba(40,50,50,.18)'; c.beginPath(); c.ellipse(60, 290, 46, 6, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(215,232,228,.45)'; c.fill(BOT);
  c.save(); c.clip(BOT);
  if (fill > 0) { const lvl = 290 - fill*230; c.beginPath(); c.moveTo(0, lvl); for (let xx=0; xx<=120; xx+=6) c.lineTo(xx, lvl + Math.sin(xx*.12 + t*.006)*1.6); c.lineTo(120, 300); c.lineTo(0,300); c.closePath(); c.fillStyle = lg(c,0,lvl,0,290,[[0,'#F3B85A'],[1,'#A9650F']]); c.fill(); }
  c.fillStyle = lg(c,0,0,120,0,[[0,'rgba(43,29,19,.18)'],[.3,'rgba(43,29,19,0)'],[.75,'rgba(43,29,19,0)'],[1,'rgba(43,29,19,.22)']]); c.fillRect(0,0,120,300);
  c.restore();
  c.fillStyle = lg(c,0,0,120,0,[[0,'rgba(255,255,255,.1)'],[.12,'rgba(255,255,255,.75)'],[.22,'rgba(255,255,255,.06)'],[.72,'rgba(255,255,255,0)'],[.86,'rgba(255,255,255,.45)'],[1,'rgba(255,255,255,.05)']]); c.fill(BOT);
  c.strokeStyle = 'rgba(43,29,19,.3)'; c.lineWidth = 1.6; c.stroke(BOT);
  if (cap) { c.fillStyle = '#2B1D13'; rr(c, 49, 2, 22, 20, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(49, 6, 22, 2); }
  c.restore();
}

/* ---- TANKER (fuel / army) ---- */
const TANKER = {
  init(s){ const {w,h} = s, st = s.st; st.trees = Array.from({length:14}, () => ({x:rnd(0,w*1.4), r:rnd(h*.04,h*.08)})); st.poles = Array.from({length:5}, (_,i) => ({x:i*w*.32})); st.dust = Array.from({length:24}, () => ({k:Math.random(), y:Math.random(), s:rnd(.5,1)})); st.cloud = [makeCloud(w*.3, true), makeCloud(w*.22, true)]; st.cx = [rnd(0,w), rnd(0,w)]; st.dist = 0; },
  draw(s, t){
    const {ctx:c, w, h, st, o} = s, army = !!o.army;
    const v = RM ? 0 : (army ? 2.2 : 3.2); st.dist += v;
    c.fillStyle = lg(c,0,0,0,h,[[0,'#9CC6DE'],[.45,'#F4D6B0'],[.7,'#F7B97A'],[1,'#E9A060']]); c.fillRect(0,0,w,h);
    const sx = w*.2, sy = h*.5; let g = c.createRadialGradient(sx,sy,0,sx,sy,w*.5); g.addColorStop(0,'rgba(255,248,220,1)'); g.addColorStop(.08,'rgba(255,220,150,.9)'); g.addColorStop(1,'rgba(255,200,120,0)'); c.fillStyle = g; c.fillRect(0,0,w,h);
    st.cloud.forEach((im,i) => { st.cx[i] -= v*.04; if (st.cx[i] < -im.width) st.cx[i] = w; c.globalAlpha = .85; c.drawImage(im, st.cx[i], h*(.06 + i*.12)); }); c.globalAlpha = 1;
    const hor = h*.6;
    c.fillStyle = '#C9A98C'; c.beginPath(); c.moveTo(0,hor); for (let x=0;x<=w;x+=12) c.lineTo(x, hor - h*.05 - Math.sin((x + st.dist*.1)*.006)*h*.03 - Math.sin((x + st.dist*.1)*.017)*h*.012); c.lineTo(w,hor); c.fill();
    c.fillStyle = '#B9B27A'; c.fillRect(0, hor, w, h*.12);
    // trees
    for (const tr of st.trees){ tr.x -= v*.35; if (tr.x < -tr.r*2) { tr.x = w + rnd(0, w*.3); tr.r = rnd(h*.04,h*.08); }
      const y = hor + h*.02; c.fillStyle = '#6F6A3C'; c.fillRect(tr.x - 2, y - tr.r*.4, 4, tr.r*.5);
      c.fillStyle = lg(c,0,y - tr.r*1.8,0,y,[[0,'#8E9A52'],[1,'#5E6A33']]); c.beginPath(); c.arc(tr.x, y - tr.r*1.1, tr.r, 0, TAU); c.arc(tr.x + tr.r*.6, y - tr.r*.8, tr.r*.7, 0, TAU); c.arc(tr.x - tr.r*.6, y - tr.r*.8, tr.r*.7, 0, TAU); c.fill(); }
    // poles + wires
    const pw = w*.32; c.strokeStyle = '#5B4A3A'; c.lineWidth = 3;
    const po = st.dist*.7 % pw;
    for (let i=-1;i<5;i++){ const x = i*pw - po; c.beginPath(); c.moveTo(x, hor + h*.06); c.lineTo(x, hor - h*.3); c.moveTo(x - 12, hor - h*.28); c.lineTo(x + 12, hor - h*.28); c.stroke();
      c.lineWidth = 1; c.strokeStyle = 'rgba(60,45,35,.6)'; c.beginPath(); c.moveTo(x, hor - h*.28); c.quadraticCurveTo(x + pw/2, hor - h*.22, x + pw, hor - h*.28); c.stroke(); c.lineWidth = 3; c.strokeStyle = '#5B4A3A'; }
    // road
    const ry = hor + h*.1, rh = h*.2; c.fillStyle = lg(c,0,ry,0,ry+rh,[[0,'#8A847C'],[1,'#5E5952']]); c.fillRect(0, ry, w, rh);
    c.fillStyle = '#F4EEDF'; const dl = w*.08, dg = w*.06, doff = st.dist % (dl+dg); for (let x = -doff; x < w; x += dl+dg) c.fillRect(x, ry + rh*.55, dl, 4);
    c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(0, ry + 2, w, 2);
    c.fillStyle = lg(c,0,ry+rh,0,h,[[0,'#A2A05E'],[1,'#7E7E44']]); c.fillRect(0, ry+rh, w, h);
    // truck
    const bob = Math.sin(t*.025)*1.2, L = Math.min(w*.62, h*1.1), tx = w*.2, wheelY = ry + rh*.48, wr = L*.065, top = wheelY - L*.3 + bob;
    c.fillStyle = 'rgba(30,20,10,.35)'; c.beginPath(); c.ellipse(tx + L*.5, wheelY + wr*.95, L*.55, wr*.3, 0, 0, TAU); c.fill();
    // cab
    const cabX = tx + L*.76, cabW = L*.22;
    c.fillStyle = army ? lg(c,0,top,0,wheelY,[[0,'#7D8A55'],[1,'#56613A']]) : lg(c,0,top,0,wheelY,[[0,'#FFFFFF'],[1,'#D7E3E8']]);
    c.beginPath(); c.moveTo(cabX, wheelY - wr*.3); c.lineTo(cabX, top + L*.04); c.lineTo(cabX + cabW*.6, top + L*.04); c.lineTo(cabX + cabW, top + L*.14); c.lineTo(cabX + cabW, wheelY - wr*.3); c.closePath(); c.fill();
    c.fillStyle = lg(c,cabX + cabW*.5,top,cabX+cabW,top+L*.12,[[0,'#BFE3F2'],[.5,'#F7FBFF'],[1,'#8DBFD6']]); c.beginPath(); c.moveTo(cabX + cabW*.5, top + L*.06); c.lineTo(cabX + cabW*.62, top + L*.06); c.lineTo(cabX + cabW*.93, top + L*.145); c.lineTo(cabX + cabW*.5, top + L*.145); c.closePath(); c.fill();
    c.fillStyle = '#FFE29A'; c.fillRect(cabX + cabW - 6, wheelY - wr*1.2, 6, wr*.4);
    // tank or cargo
    const tkX = tx, tkW = L*.74, tkY = top + L*.03, tkH = L*.17;
    if (army) { c.fillStyle = lg(c,0,tkY-L*.04,0,tkY+tkH,[[0,'#8D9A63'],[1,'#5F6B3E']]); rr(c, tkX, tkY - L*.04, tkW, tkH + L*.04, L*.05); c.fill(); c.strokeStyle = 'rgba(40,45,20,.35)'; c.lineWidth = 2; for (let i=1;i<6;i++){ c.beginPath(); c.moveTo(tkX + tkW*i/6, tkY - L*.03); c.lineTo(tkX + tkW*i/6, tkY + tkH); c.stroke(); }
      c.fillStyle = '#E3A136'; c.save(); c.translate(tkX + tkW*.5, tkY + tkH*.42); c.beginPath(); for (let i=0;i<10;i++){ const a = -Math.PI/2 + i*Math.PI/5, rr2 = i%2 ? L*.018 : L*.042; c.lineTo(Math.cos(a)*rr2, Math.sin(a)*rr2); } c.closePath(); c.fill(); c.restore(); }
    else { rr(c, tkX, tkY, tkW, tkH, tkH/2); c.fillStyle = lg(c,0,tkY,0,tkY+tkH,[[0,'#7FC2DE'],[.22,'#E9F7FC'],[.4,'#A8DAEE'],[.8,'#3E94BB'],[1,'#2A6F90']]); c.fill();
      c.fillStyle = '#FFFDF8'; c.beginPath(); c.arc(tkX + tkW*.5, tkY + tkH*.5, tkH*.3, 0, TAU); c.fill();
      c.save(); c.translate(tkX + tkW*.5 - tkH*.18, tkY + tkH*.24); c.scale(tkH*.0036, tkH*.0036); c.fill(new Path2D('M50 4 C44 14 12 50 12 78 A38 38 0 0 0 88 78 C88 50 56 14 50 4 Z')); c.fillStyle = '#5DB3D6'; c.fill(new Path2D('M50 4 C44 14 12 50 12 78 A38 38 0 0 0 88 78 C88 50 56 14 50 4 Z')); c.restore();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(tkX + tkH*.4, tkY + tkH*.18, tkW - tkH*.8, tkH*.06); }
    c.fillStyle = '#3A3A3A'; c.fillRect(tx, wheelY - wr*.9, L*.98, wr*.45);
    // wheels
    const ang = st.dist / wr;
    [tx + L*.1, tx + L*.24, tx + L*.6, tx + L*.88].forEach(x => { c.save(); c.translate(x, wheelY); c.beginPath(); c.arc(0,0,wr,0,TAU); c.fillStyle = '#211D1A'; c.fill(); c.beginPath(); c.arc(0,0,wr*.55,0,TAU); c.fillStyle = lg(c,-wr,0,wr,0,STEEL); c.fill(); c.rotate(ang); c.strokeStyle = '#5E666A'; c.lineWidth = 2; for (let i=0;i<5;i++){ c.rotate(TAU/5); c.beginPath(); c.moveTo(0,0); c.lineTo(wr*.5,0); c.stroke(); } c.restore(); });
    // dust
    for (const d of st.dust){ if (!RM) d.k += .012*d.s; if (d.k > 1) { d.k = 0; d.y = Math.random(); } const x = tx + L*.06 - d.k*w*.3, y = wheelY + wr*.6 - d.k*h*.08 - d.y*h*.03, sz = 6 + d.k*28; c.globalAlpha = .35*(1-d.k); c.drawImage(SP.dust, x - sz/2, y - sz/2, sz, sz); }
    c.globalAlpha = 1;
    c.fillStyle = lg(c,0,0,w,0,[[0,'rgba(255,200,130,.18)'],[.5,'rgba(255,200,130,0)']]); c.fillRect(0,0,w,h);
  }
};

/* ---- PUMP (commuter) ---- */
const PUMP = {
  init(s){ s.st.l = 0; },
  draw(s, t){
    const {ctx:c, w, h, st} = s;
    c.fillStyle = lg(c,0,0,0,h,[[0,'#CFE6F0'],[1,'#F4EEE2']]); c.fillRect(0,0,w,h);
    // canopy
    c.fillStyle = lg(c,0,0,0,h*.14,[[0,'#FFFFFF'],[1,'#DDE6E8']]); c.fillRect(0,0,w,h*.14); c.fillStyle = '#5DB3D6'; c.fillRect(0,h*.14,w,h*.025);
    for (let i=0;i<5;i++){ const x = w*(.1 + i*.2); c.fillStyle = 'rgba(255,253,230,.95)'; c.fillRect(x, h*.11, w*.08, h*.02); const g = c.createRadialGradient(x+w*.04,h*.13,0,x+w*.04,h*.13,h*.25); g.addColorStop(0,'rgba(255,250,220,.35)'); g.addColorStop(1,'rgba(255,250,220,0)'); c.fillStyle = g; c.fillRect(x-w*.1,h*.12,w*.28,h*.3); }
    const gy = h*.86; c.fillStyle = lg(c,0,gy,0,h,[[0,'#BDB6AA'],[1,'#A39B8E']]); c.fillRect(0,gy,w,h-gy);
    // pump unit
    const px = w*.66, pw = w*.2, py = h*.26, ph = gy - py;
    rr(c, px, py, pw, ph, 12); c.fillStyle = lg(c,px,0,px+pw,0,[[0,'#F4F7F7'],[.5,'#FFFFFF'],[1,'#D6DEE0']]); c.fill();
    c.fillStyle = '#5DB3D6'; rr(c, px, py, pw, ph*.12, 12); c.fill(); c.fillRect(px, py + ph*.06, pw, ph*.06);
    // display
    const dx = px + pw*.12, dy = py + ph*.2, dw = pw*.76, dh = ph*.22;
    rr(c, dx, dy, dw, dh, 6); c.fillStyle = '#1E2A2E'; c.fill();
    if (!RM) st.l += .016; if (st.l > 42) st.l = 0;
    c.fillStyle = '#8EF0B4'; c.font = `600 ${Math.max(12, dh*.42)|0}px ui-monospace, Menlo, monospace`; c.textAlign = 'right'; c.fillText(st.l.toFixed(2), dx + dw - 10, dy + dh*.62);
    c.fillStyle = '#9FB8BF'; c.font = `600 ${Math.max(9, dh*.18)|0}px Hanken Grotesk, sans-serif`; c.textAlign = 'left'; c.fillText('LITRES', dx + 10, dy + dh*.86);
    // drop logo
    c.save(); c.translate(px + pw*.5 - pw*.08, py + ph*.5); c.scale(pw*.0016, pw*.0016); c.fillStyle = '#5DB3D6'; c.fill(new Path2D('M50 4 C44 14 12 50 12 78 A38 38 0 0 0 88 78 C88 50 56 14 50 4 Z')); c.restore();
    // car side
    const cx0 = -w*.08, cy0 = gy - h*.06, cw = w*.62, ch = h*.34;
    c.fillStyle = 'rgba(30,20,10,.25)'; c.beginPath(); c.ellipse(cx0 + cw*.5, gy, cw*.5, h*.02, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(cx0, cy0); c.lineTo(cx0, cy0 - ch*.55); c.quadraticCurveTo(cx0 + cw*.2, cy0 - ch*.62, cx0 + cw*.32, cy0 - ch); c.lineTo(cx0 + cw*.72, cy0 - ch); c.quadraticCurveTo(cx0 + cw*.86, cy0 - ch*.7, cx0 + cw, cy0 - ch*.58); c.lineTo(cx0 + cw, cy0); c.closePath();
    c.fillStyle = lg(c,0,cy0-ch,0,cy0,[[0,'#7CC7E6'],[.35,'#E8F7FD'],[.45,'#5DB3D6'],[1,'#2A7396']]); c.fill();
    c.fillStyle = lg(c,0,cy0-ch,0,cy0-ch*.6,[[0,'#DDF0F7'],[1,'#7FA9BA']]); c.beginPath(); c.moveTo(cx0 + cw*.36, cy0 - ch*.93); c.lineTo(cx0 + cw*.7, cy0 - ch*.93); c.lineTo(cx0 + cw*.8, cy0 - ch*.62); c.lineTo(cx0 + cw*.3, cy0 - ch*.62); c.closePath(); c.fill();
    const refl = ((t*.00006) % 1.4) - .2; c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(cx0 + cw*refl, cy0-ch); c.lineTo(cx0 + cw*(refl+.06), cy0-ch); c.lineTo(cx0 + cw*(refl-.06), cy0); c.lineTo(cx0 + cw*(refl-.12), cy0); c.fill(); c.restore();
    [.2,.8].forEach(k => { c.beginPath(); c.arc(cx0 + cw*k, cy0, ch*.2, 0, TAU); c.fillStyle = '#211D1A'; c.fill(); c.beginPath(); c.arc(cx0 + cw*k, cy0, ch*.1, 0, TAU); c.fillStyle = lg(c,0,cy0-ch*.1,0,cy0+ch*.1,STEEL); c.fill(); });
    // filler + hose + nozzle
    const fx = cx0 + cw*.9, fy = cy0 - ch*.45;
    c.fillStyle = '#2A6F90'; c.beginPath(); c.arc(fx, fy, ch*.06, 0, TAU); c.fill();
    c.strokeStyle = '#2B2826'; c.lineWidth = Math.max(5, w*.012); c.lineCap = 'round';
    c.beginPath(); c.moveTo(px + pw*.1, py + ph*.6); c.bezierCurveTo(px - w*.02, gy + h*.05, fx + w*.1, gy - h*.02, fx + w*.05, fy + h*.02); c.stroke();
    c.fillStyle = lg(c,0,fy-10,0,fy+10,[[0,'#5DB3D6'],[1,'#2A7396']]); rr(c, fx + w*.005, fy - h*.025, w*.07, h*.05, 6); c.fill();
    c.strokeStyle = '#DCE6E8'; c.lineWidth = 4; c.beginPath(); c.moveTo(fx + w*.01, fy); c.lineTo(fx - w*.005, fy + 2); c.stroke();
    // flowing liquid in hose window
    c.fillStyle = 'rgba(255,255,255,.9)'; for (let i=0;i<5;i++){ const k = ((t*.0012) + i/5) % 1; c.beginPath(); c.arc(fx + w*.065 - k*w*.05, fy + Math.sin(k*9)*1.5, 1.6, 0, TAU); c.fill(); }
  }
};

/* ---- DATA (shareholder) ---- */
const DATA = {
  init(s){},
  draw(s, t){
    const {ctx:c, w, h} = s;
    c.fillStyle = lg(c,0,0,0,h,[[0,'#FFFDF8'],[1,'#F4E9D5']]); c.fillRect(0,0,w,h);
    c.strokeStyle = 'rgba(43,29,19,.07)'; c.lineWidth = 1; for (let x=0;x<w;x+=40){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,h); c.stroke(); } for (let y=0;y<h;y+=40){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); }
    const cyc = 7000, k = RM ? 1 : ((t % cyc)/cyc), grow = ease(clamp(k/.5)), fade = k > .9 ? 1 - (k-.9)/.1 : 1;
    const data = [['Spirits revenue',1331,'#E3A136'],['Biofuels revenue',1470,'#5DB3D6'],['EBITDA',492,'#7FA046'],['Profit after tax',244,'#8E550B']];
    const pad = w*.1, base = h*.82, maxH = h*.58, bw = (w - pad*2)/data.length*.56, gap = (w - pad*2)/data.length;
    c.globalAlpha = fade;
    data.forEach(([lab,v,col],i) => { const x = pad + i*gap + (gap-bw)/2, bh = maxH*(v/1470)*clamp(grow*1.2 - i*.08);
      rr(c, x, base - bh, bw, Math.max(bh,1), 8); c.fillStyle = lg(c,x,0,x+bw,0,[[0,col],[.4,hexC(col,'#FFFFFF',.35)],[1,col]]); c.fill();
      c.fillStyle = '#2B1D13'; c.font = `600 ${Math.max(13,w*.028)|0}px Hanken Grotesk, sans-serif`; c.textAlign = 'center';
      c.fillText('Rs ' + Math.round(v*clamp(grow*1.2 - i*.08)).toLocaleString('en-IN'), x + bw/2, base - bh - 10);
      c.fillStyle = '#5E4A3A'; c.font = `500 ${Math.max(11,w*.022)|0}px Hanken Grotesk, sans-serif`; c.fillText(lab, x + bw/2, base + 24); });
    c.fillStyle = '#2B1D13'; c.font = `500 ${Math.max(16,w*.04)|0}px Bodoni Moda, serif`; c.textAlign = 'left'; c.fillText('FY26, Rs crore', pad, h*.13);
    c.strokeStyle = 'rgba(43,29,19,.3)'; c.lineWidth = 2; c.beginPath(); c.moveTo(pad*.6, base); c.lineTo(w - pad*.6, base); c.stroke();
    c.globalAlpha = 1;
  }
};

const SCENES = {
  hero: [FIELD, {mouse:true, sun:[.72,.5]}], farm: [FIELD, {close:true, sun:[.75,.42]}], grower: [FIELD, {close:true, evening:true, sun:[.3,.5]}],
  still: [STILL, {}], night: [STILL, {night:true}], tank: [TANK, {}], bottling: [BOTTLING, {}],
  tanker: [TANKER, {}], army: [TANKER, {army:true}], pump: [PUMP, {}], data: [DATA, {}]
};
const scenes = [];
function sizeScene(s){ const r = {width:s.cv.clientWidth, height:s.cv.clientHeight}, d = Math.min(devicePixelRatio||1, 2.5); s.w = Math.max(10, r.width); s.h = Math.max(10, r.height); s.cv.width = s.w*d; s.cv.height = s.h*d; s.ctx.setTransform(d,0,0,d,0,0); s.st = {}; s.def.init(s); }
const sio = new IntersectionObserver(es => es.forEach(e => { const s = scenes.find(x => x.cv === e.target); if (s) s.vis = e.isIntersecting; }), {rootMargin:'100px'});
function addScene(cv, key){ const [def, o] = SCENES[key]; const s = {cv, ctx: cv.getContext('2d'), def, o, vis:false, on:true}; sizeScene(s); scenes.push(s); sio.observe(cv); return s; }
$$('canvas[data-scene]').forEach(cv => addScene(cv, cv.dataset.scene));
/* ================= REAL-TIME 3D HERO (WebGL raymarcher) ================= */
const glc = $('#gl'); let gl = null, glU = {}, glScale = innerWidth < 700 ? .6 : .85, glAvg = 16, glFrames = 0;
const GL_VS = 'attribute vec2 a;varying vec2 vUv;void main(){vUv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
const GL_FS = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uSplit;uniform vec2 uShift;uniform float uDist;
varying vec2 vUv;
const vec3 SUN=vec3(-.5246,.6884,.5016);
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float sdRoundCone(vec3 p,float r1,float r2,float h){vec2 q=vec2(length(p.xz),p.y);float b=(r1-r2)/h;float a=sqrt(1.-b*b);float k=dot(q,vec2(-b,a));
 if(k<0.)return length(q)-r1;if(k>a*h)return length(q-vec2(0.,h))-r2;return dot(q,vec2(a,b))-r1;}
vec3 pA,pB;float sc;
float dropSdf(vec3 p,float ph){p/=sc;p.xy*=rot(uMouse.x*.16+sin(uTime*.5+ph)*.04);p.yz*=rot(-uMouse.y*.12);
 float w=sin(p.y*5.+uTime*2.1+ph)*.016+sin(p.x*6.-uTime*1.6+ph)*.011+sin(p.z*7.+uTime*1.3)*.008;
 return (sdRoundCone(p+vec3(0.,.38,0.),.5,.035,.98)+w)*sc;}
float sats(vec3 p){float d=1e3;for(int i=0;i<3;i++){float fi=float(i);float a=uTime*.45+fi*2.094;
 vec3 c=vec3(uShift.x,uShift.y,0.)+vec3(cos(a)*1.05,sin(uTime*.7+fi*1.7)*.42+.08,sin(a)*.7)*(1.+uSplit*.7);
 d=min(d,length(p-c)-(.055+.025*fi));}return d;}
float bridgeK(){return .015+.5*(1.-smoothstep(.42,.72,uSplit))*smoothstep(.0,.25,uSplit);}
float map(vec3 p){float d=smin(dropSdf(p-pA,0.),dropSdf(p-pB,1.7),bridgeK());return smin(d,sats(p),.2);}
float matX(vec3 p){return smoothstep(-.03,.03,p.x-(pA.x+pB.x)*.5);}
vec3 nor(vec3 p){vec2 e=vec2(.0015,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
vec3 backdrop(vec2 uv){return mix(vec3(.957,.894,.79),vec3(.988,.975,.945),smoothstep(-.55,.75,uv.y));}
vec3 env(vec3 d){vec3 c=mix(vec3(.93,.84,.70),vec3(1.,.985,.96),smoothstep(-.25,.5,d.y));c*=mix(.45,1.,smoothstep(-.35,0.,d.y));
 c+=vec3(1.)*smoothstep(.86,.92,dot(d,normalize(vec3(-.65,.6,.45))))*2.4;
 c+=vec3(1.,.93,.82)*smoothstep(.93,.97,dot(d,normalize(vec3(.75,.25,.6))))*1.5;
 c+=vec3(.85,.93,1.)*smoothstep(.95,.99,dot(d,normalize(vec3(.1,.95,-.3))));return c;}
void main(){
 vec2 fc=vUv*uRes;vec2 uv=(fc-.5*uRes)/uRes.y;
 sc=mix(1.,.72,smoothstep(0.,.85,uSplit));
 float sx=uSplit*.82,base=uShift.y-.88*(1.-sc);
 pA=vec3(uShift.x-sx,base+sin(uTime*.8)*.03,0.);pB=vec3(uShift.x+sx,base+sin(uTime*.8+1.)*.03,0.);
 vec3 ro=vec3(uMouse.x*.18,.14+uMouse.y*.1,uDist),ta=vec3(0.,-.1,0.);
 vec3 f=normalize(ta-ro),r=normalize(cross(f,vec3(0.,1.,0.))),u=cross(r,f);
 vec3 rd=normalize(uv.x*r+uv.y*u+1.9*f);
 vec3 col=backdrop(uv);
 float floorY=uShift.y-.88;float tf=(floorY-ro.y)/rd.y;
 float t=0.;bool hit=false;
 for(int i=0;i<110;i++){float d=map(ro+rd*t);if(d<.0006*t){hit=true;break;}t+=d;if(t>22.)break;}
 vec3 amber=vec3(.95,.62,.18),blue=vec3(.36,.72,.88);
 if(tf>0.&&(!hit||tf<t)){
  vec3 fp=ro+rd*tf;vec3 fcol=backdrop(uv)*.985;
  float sh=1.,ts=.03;for(int i=0;i<26;i++){float h=map(fp+SUN*ts);sh=min(sh,9.*h/ts);ts+=clamp(h,.03,.25);if(ts>3.)break;}
  sh=clamp(sh,0.,1.);float ao=clamp(map(fp+vec3(0.,.3,0.))/.3,0.,1.);
  fcol*=mix(vec3(.80,.70,.57),vec3(1.),.55*sh+.45*ao);
  vec2 cA=pA.xz+vec2(.42,-.32)*sc,cB=pB.xz+vec2(.42,-.32)*sc;vec2 s2=vec2(1.4,2.3)/sc;
  float ca=exp(-dot((fp.xz-cA)*s2,(fp.xz-cA)*s2)*2.4),cb=exp(-dot((fp.xz-cB)*s2,(fp.xz-cB)*s2)*2.4);
  float shim=.65+.35*sin(fp.x*30.+uTime*2.2)*sin(fp.z*26.-uTime*1.8);
  vec3 cc=mix(amber,blue,smoothstep(-.06,.06,fp.x-(pA.x+pB.x)*.5+.42*sc));
  fcol+=cc*max(ca,cb)*.55*shim;
  col=mix(fcol,backdrop(uv),smoothstep(uDist-1.,uDist+4.,tf));
 }else if(hit){
  vec3 p=ro+rd*t;vec3 n=nor(p);float m=matX(p);
  vec3 lt=mix(vec3(.99,.72,.27),vec3(.58,.85,.95),m),dk=mix(vec3(.52,.25,.03),vec3(.06,.36,.56),m);
  float ndv=max(dot(n,-rd),0.);float fr=.04+.96*pow(1.-ndv,5.);
  vec3 rf=env(reflect(rd,n));vec3 rr=refract(rd,n,.75);
  float th=0.;vec3 q=p-n*.03;for(int i=0;i<18;i++){float dd=-map(q+rr*th);if(dd<.003)break;th+=max(dd,.015);}
  vec3 body=mix(lt*env(rr)*1.1,dk,1.-exp(-th*1.35));
  body+=lt*pow(clamp(dot(rr,SUN)*.5+.5,0.,1.),4.)*.45;
  vec3 ctr=mix(pA,pB,m);body+=lt*.55*exp(-length(p.xy-vec2(ctr.x+.1*sc,ctr.y-.5*sc))*4.5/sc);
  col=mix(body,rf,fr);
  col+=vec3(1.)*pow(max(dot(reflect(rd,n),SUN),0.),220.)*3.;
  col+=vec3(1.)*pow(1.-ndv,3.)*.1;
 }
 vec2 q2=vUv-.5;col*=1.-dot(q2,q2)*.3;
 col+=(fract(sin(dot(fc+fract(uTime)*91.,vec2(12.9898,78.233)))*43758.5453)-.5)*.018;
 gl_FragColor=vec4(col,1.);
}`;
function glSh(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; } return s; }
try { gl = glc.getContext('webgl', {antialias:false, alpha:false, powerPreference:'high-performance'}); } catch(e) { gl = null; }
if (gl) { const v = glSh(gl.VERTEX_SHADER, GL_VS), f = glSh(gl.FRAGMENT_SHADER, GL_FS);
  if (!v || !f) gl = null; else { const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) gl = null; else { gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['uRes','uTime','uMouse','uSplit','uShift','uDist'].forEach(k => glU[k] = gl.getUniformLocation(pr, k)); } } }
let heroScene = null;
if (!gl) { glc.hidden = true; $('#heroCv').hidden = false; heroScene = addScene($('#heroCv'), 'hero'); }
let glW = 0, glH = 0, gmx = 0, gmy = 0, gSplit = 0;
function glSize(){ const d = Math.min(devicePixelRatio||1, 2.5)*glScale; glW = Math.max(2, glc.clientWidth*d|0); glH = Math.max(2, glc.clientHeight*d|0); glc.width = glW; glc.height = glH; }
if (gl) { glSize(); addEventListener('resize', glSize, {passive:true}); glc.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; glc.hidden = true; $('#heroCv').hidden = false; heroScene = addScene($('#heroCv'), 'hero'); }); }
function glDraw(t, split){
  if (!gl) return;
  gmx = lerp(gmx, (mx/innerWidth - .5)*2, .05); gmy = lerp(gmy, (my/innerHeight - .5)*-2, .05); gSplit = lerp(gSplit, split, .12);
  const mob = innerWidth < 860, aspect = glc.clientWidth/Math.max(1, glc.clientHeight);
  gl.viewport(0, 0, glW, glH);
  gl.uniform2f(glU.uRes, glW, glH); gl.uniform1f(glU.uTime, RM ? 2 : t/1000); gl.uniform2f(glU.uMouse, RM ? 0 : gmx, RM ? 0 : gmy); gl.uniform1f(glU.uSplit, gSplit);
  gl.uniform2f(glU.uShift, mob ? 0 : lerp(Math.min(1.1, aspect*.55), 0, ease(clamp(gSplit*1.4))), mob ? -.75 : -.12); gl.uniform1f(glU.uDist, mob ? (gSplit > .02 ? lerp(6.2, 11.5, gSplit) : 6.2) : 3.9);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => scenes.forEach(sizeScene), 200); }, {passive:true});



const CATS = [
  {k:'Whisky', liq:['#F3B85A','#A9650F'], items:[['MaQintosh',''],['Amazing Craft Whisky',''],['Soulmate',''],['Single Reserve',''],['Amrut','Licensed for north India']]},
  {k:'Rum', liq:['#D07A38','#5E2A0E'], items:[['Zumba',''],['Bunty Rum',''],['Beach House',''],['Amrut Old Port','Licensed for north India']]},
  {k:'Vodka', liq:['#F4FBFD','#BFE2EF'], items:[['Amazing Vodka',''],['V2O',''],['Bunty Vodka','']]},
  {k:'Country liquor', liq:['#D8E59C','#839F3E'], items:[['Bunty Babli','Leading brand in UP and Uttarakhand'],['Dabang Gold',''],['Red Apple',''],['Baaz Tejas','']]}
];
const SHAPES = [
  'M50 14 h20 v40 c0 10 30 18 30 46 v176 a12 12 0 0 1 -12 12 h-56 a12 12 0 0 1 -12 -12 v-176 c0 -28 30 -36 30 -46 Z',
  'M52 14 h16 v56 c22 8 30 18 30 38 v170 a10 10 0 0 1 -10 10 h-56 a10 10 0 0 1 -10 -10 v-170 c0 -20 8 -30 30 -38 Z',
  'M51 14 h18 v34 l18 34 c8 14 11 28 11 46 v130 a10 10 0 0 1 -10 10 h-56 a10 10 0 0 1 -10 -10 v-130 c0 -18 3 -32 11 -46 l18 -34 Z'
];
const tabsEl = $('#tabs'), shelf = $('#shelf');
let cat = 0, auto = false, t0 = performance.now(), bottles = [], bPaused = false;
CATS.forEach((c,i) => { const b = document.createElement('button'); b.className='tab'; b.setAttribute('role','tab'); b.id='tab'+i; b.innerHTML = c.k + '<span class="prog"></span>';
  b.addEventListener('click', () => { auto = false; show(i); }); tabsEl.appendChild(b); });
function bottleSVG(c, si, uid){
  let bubs = ''; for (let k=0;k<6;k++) bubs += `<circle class="bub" style="--d:${rnd(2.4,4.2).toFixed(2)}s;--dl:${(-rnd(0,4)).toFixed(2)}s" cx="${rnd(32,88).toFixed(1)}" cy="${rnd(270,284).toFixed(1)}" r="${rnd(1,2.4).toFixed(1)}"/>`;
  return `<svg viewBox="0 0 120 310" aria-hidden="true"><defs>
    <clipPath id="bc${uid}"><path d="${SHAPES[si]}"/></clipPath>
    <linearGradient id="lg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.liq[0]}"/><stop offset="1" stop-color="${c.liq[1]}"/></linearGradient>
    <linearGradient id="gg${uid}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".12" stop-color="#fff" stop-opacity=".75"/><stop offset=".22" stop-color="#fff" stop-opacity=".08"/><stop offset=".72" stop-color="#fff" stop-opacity="0"/><stop offset=".86" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient>
    <linearGradient id="dk${uid}" x1="0" x2="1"><stop offset="0" stop-color="#2B1D13" stop-opacity=".22"/><stop offset=".3" stop-color="#2B1D13" stop-opacity="0"/><stop offset=".75" stop-color="#2B1D13" stop-opacity="0"/><stop offset="1" stop-color="#2B1D13" stop-opacity=".25"/></linearGradient>
  </defs>
  <ellipse cx="60" cy="302" rx="46" ry="6" fill="rgba(60,40,20,.28)" filter="url(#soft2)"/>
  <path d="${SHAPES[si]}" fill="rgba(215,232,228,.35)"/>
  <g clip-path="url(#bc${uid})"><path class="surf" fill="url(#lg${uid})"/><g fill="#fff" opacity=".75">${bubs}</g>
    <rect x="0" y="0" width="120" height="310" fill="url(#dk${uid})"/>
    <rect x="28" y="170" width="64" height="76" rx="4" fill="#FFFDF8" stroke="rgba(43,29,19,.2)"/>
    <use href="#mark" x="49" y="180" width="22" height="27"/>
    <rect x="38" y="214" width="44" height="4" rx="2" fill="#2B1D13" opacity=".7"/><rect x="44" y="224" width="32" height="3" rx="1.5" fill="#2B1D13" opacity=".35"/><rect x="40" y="234" width="40" height="2" rx="1" fill="#C7821C"/>
  </g>
  <path d="${SHAPES[si]}" fill="url(#gg${uid})" stroke="rgba(43,29,19,.28)" stroke-width="1.4"/>
  <rect x="${si===2?49:si===1?50:48}" y="2" width="${si===2?22:si===1?20:24}" height="20" rx="3" fill="${si===1?'#8E550B':'#2B1D13'}"/>
  </svg>`;
}


/* ---------- map ---------- */
const map = $('#map');
const pj = (lon,lat) => [ (lon-73.6)/(85.4-73.6)*1000, (31.6-lat)/(31.6-23.9)*640 ];
const poly = [[77.1,30.4],[77.8,31.1],[79.2,31.3],[80.3,30.4],[81.0,30.1],[80.1,28.8],[81.6,27.9],[83.0,27.4],[84.6,27.3],[84.2,26.0],[83.4,25.2],[82.3,24.4],[81.0,24.7],[80.3,25.3],[79.0,24.5],[78.3,24.4],[78.4,25.6],[77.5,26.7],[77.2,27.8],[77.0,28.9],[76.3,29.8],[76.4,30.9],[77.0,31.0]].map(([a,b])=>pj(a,b));
function inPoly(x,y){ let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const [xi,yi]=poly[i],[xj,yj]=poly[j]; if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; }
let mh = '';
for (let x=10;x<1000;x+=16) for (let y=10;y<640;y+=16) if (inPoly(x,y)) mh += `<circle class="dot" cx="${x}" cy="${y}" r="2.6"/>`;
const P = { kashipur:pj(78.96,29.21), gorakhpur:pj(83.37,26.76), noida:pj(77.39,28.54), delhi:pj(77.10,28.70), chd:pj(76.78,30.73), up:pj(80.95,26.85), uk:pj(78.4,30.2) };
const curve = (a,b,bend=-.25) => { const mx2=(a[0]+b[0])/2, my2=(a[1]+b[1])/2, dx=b[0]-a[0], dy=b[1]-a[1]; return `M${a[0]} ${a[1]} Q${mx2-dy*bend} ${my2+dx*bend} ${b[0]} ${b[1]}`; };
[['kashipur','delhi','s'],['kashipur','chd','s'],['kashipur','uk','s'],['gorakhpur','up','s'],['gorakhpur','noida','f'],['kashipur','noida','f']].forEach(([a,b,c]) => mh += `<path class="route ${c}" d="${curve(P[a],P[b])}"/>`);
const mk = (k,col,label,dx=14,dy=5) => { const [x,y]=P[k]; return `<circle class="ping" cx="${x}" cy="${y}" r="10" fill="${col}"/><circle cx="${x}" cy="${y}" r="8" fill="${col}" stroke="#fff" stroke-width="2"/><text class="lbl" x="${x+dx}" y="${y+dy}">${label}</text>`; };
const ringM = (k,label,dx=16,dy=5) => { const [x,y]=P[k]; return `<circle cx="${x}" cy="${y}" r="9" fill="#FFFDF8" stroke="#2B1D13" stroke-width="2"/><text class="lbl m" x="${x+dx}" y="${y+dy}">${label}</text>`; };
mh += ringM('delhi','Delhi',-66,-12) + ringM('chd','Chandigarh',-122,6) + ringM('up','Uttar Pradesh') + ringM('uk','Uttarakhand',-44,-18);
mh += mk('kashipur','#E3A136','Kashipur plant') + mk('gorakhpur','#E3A136','Gorakhpur plant',-170,34) + mk('noida','#5DB3D6','Noida head office',14,26);
map.innerHTML = mh;



/* ---------- loader -> gate -> intro ---------- */
const loader = $('#loader'), ldN = $('#ldN'), ldFill = $('#ldFill'), gate = $('#gate'), form = $('#gateForm'), yob = $('#yob'), err = $('#gateErr');
let enteredAt = null;
const curtains = $$('.curtain');
function playCurtain(){ if (RM) return; curtains.forEach(c => { c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); }); }
function start(){ document.body.classList.remove('locked'); if (lenis) lenis.start(); enteredAt = performance.now();
  setTimeout(() => { document.body.classList.add('ready'); $('#heroH').classList.add('in'); }, RM ? 0 : 700); }
(function load(){ const t0 = performance.now(), dur = RM ? 10 : 700;
  (function step(t){ const k = clamp((t - t0)/dur), v = Math.round(ease(k)*100); ldN.textContent = v; ldFill.setAttribute('y', 120 - ease(k)*120);
    if (k < 1) return requestAnimationFrame(step);
    setTimeout(() => { loader.classList.add('done');
      if (store.get('igl-age') === 'ok') { gate.hidden = true; start(); }
      else setTimeout(() => yob.focus(), 900);
      setTimeout(() => loader.hidden = true, 1300); }, 250);
  })(t0); })();
yob.addEventListener('input', () => { yob.value = yob.value.replace(/\D/g,'').slice(0,4); err.textContent=''; });
form.addEventListener('submit', e => {
  e.preventDefault();
  const y = parseInt(yob.value,10), now = new Date().getFullYear();
  if (!/^\d{4}$/.test(yob.value) || y < now-120 || y > now) { err.textContent = 'Enter your year of birth as four digits, for example 1990.'; return; }
  if (now - y < 25) { err.textContent = 'This site is only for people aged 25 and over. Please come back when you are.'; return; }
  store.set('igl-age','ok'); playCurtain(); setTimeout(() => { gate.hidden = true; start(); }, RM ? 0 : 700);
});

/* ---------- cursor + magnetic ---------- */
let mx = innerWidth/2, my = innerHeight/2;
addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, {passive:true});
$$('[data-mag], .nav .btn').forEach(b => {
  b.addEventListener('pointermove', e => { if (RM) return; const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.3}px,${(e.clientY-r.top-r.height/2)*.4}px)`; });
  b.addEventListener('pointerleave', () => { b.style.transition = 'transform .6s var(--ease), color .5s var(--ease)'; b.style.transform = ''; setTimeout(() => b.style.transition = '', 600); });
});

/* ---------- nav: pill, wipe, hide ---------- */
const nav = $('#nav'), navLinks = $$('#navUl a'), pill = $('#pill'), secs = navLinks.map(a => $(a.getAttribute('href')));
function movePill(a){ if (!a) { pill.style.opacity = 0; return; } pill.style.opacity = 1; pill.style.width = a.offsetWidth + 'px'; pill.style.transform = `translateX(${a.offsetLeft}px)`; }
const wipe = $('#wipe');
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault();
  if (RM) { t.scrollIntoView(); return; }
  if (lenis) lenis.scrollTo(t, {duration:1.4, force:true}); else t.scrollIntoView({behavior:'smooth'}); }));

/* ---------- background morph ---------- */
const bgio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.target.dataset.bg) document.body.style.backgroundColor = e.target.dataset.bg; }), {rootMargin:'-50% 0px -50% 0px'});
$$('[data-bg]').forEach(s => bgio.observe(s));

/* ---------- people stage: circular wipe ---------- */
const pitems = $$('.pitem'), stageCvs = $$('#stage canvas'), stageLab = $('#stageLab');
const stageScenes = stageCvs.map(cv => scenes.find(s => s.cv === cv));
let pIdx = -1, pAuto = false, pT0 = performance.now(), pPaused = false, zTop = 1;
function pShow(i, ox, oy){
  if (i === pIdx) return; const prev = pIdx; pIdx = i; pT0 = performance.now();
  pitems.forEach((b,j) => { b.classList.toggle('on', j===i); b.setAttribute('aria-expanded', j===i); b.querySelector('.bar').style.width = '0'; });
  const cv = stageCvs[i], at = `${ox ?? 50}% ${oy ?? 50}%`;
  stageScenes[i].on = true; cv.classList.remove('anim','full'); cv.classList.add('vis'); cv.style.zIndex = ++zTop;
  cv.style.clipPath = `circle(0% at ${at})`; void cv.offsetWidth;
  cv.classList.add('anim'); cv.style.clipPath = `circle(150% at ${at})`;
  setTimeout(() => { stageCvs.forEach((c,j) => { if (j !== pIdx) { c.classList.remove('vis'); stageScenes[j].on = false; } }); }, 1250);
  stageLab.style.transform = 'translateY(-110%)';
  setTimeout(() => { stageLab.textContent = pitems[i].querySelector('h3').textContent; stageLab.style.transition = 'none'; stageLab.style.transform = 'translateY(110%)'; void stageLab.offsetWidth; stageLab.style.transition = ''; stageLab.style.transform = 'none'; }, 300);
}
pitems.forEach((b,i) => b.addEventListener('click', () => { pAuto = false; pShow(i, 0, 50); }));
$('#people').addEventListener('pointerenter', () => pPaused = true); $('#people').addEventListener('pointerleave', () => pPaused = false);
stageScenes.forEach(s => s.on = false);
stageCvs[0].classList.add('vis','full'); stageCvs[0].style.clipPath = 'circle(150% at 50% 50%)'; stageScenes[0].on = true; pIdx = 0;
pitems[0].classList.add('on'); pitems[0].setAttribute('aria-expanded', true);

/* ---------- brands: show with exit ---------- */
const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function show(i){
  cat = i; t0 = performance.now();
  $$('.tab').forEach((b,j) => { b.setAttribute('aria-selected', j===i); b.tabIndex = j===i ? 0 : -1; b.querySelector('.prog').style.width = '0'; });
  $('#shelfPanel').setAttribute('aria-labelledby','tab'+i);
  const old = $$('.bitem', shelf); old.forEach(b => { b.classList.remove('in'); b.classList.add('out'); });
  setTimeout(() => {
    const c = CATS[i];
    shelf.innerHTML = c.items.map(([n,tag],j) => `<div class="bitem" style="--j:${j}"><div class="bottle"><img class="bimg" src="assets/images/brands/${slug(n)}.png" alt="${n} bottle" loading="lazy" onerror="this.parentNode.classList.add('noimg');this.remove()">${bottleSVG(c, j%3, i+'_'+j+'_'+(Date.now()%100000))}</div><div class="pl" aria-hidden="true"></div><div class="nm"><span>${n}</span></div><div class="tag">${tag}</div></div>`).join('');
    bottles = $$('.bottle', shelf).map((el,j) => ({el, svg: el.querySelector('svg'), surf: el.querySelector('.surf'), level: rnd(118,140), th: (j%2?-1:1)*.18, v: 0, ph: rnd(0,6)}));
    requestAnimationFrame(() => $$('.bitem', shelf).forEach(b => b.classList.add('in')));
  }, old.length ? 600 : 0);
}
tabsEl.addEventListener('keydown', e => { if (e.key==='ArrowRight'||e.key==='ArrowLeft'){ auto=false; const n=(cat+(e.key==='ArrowRight'?1:-1)+CATS.length)%CATS.length; show(n); $('#tab'+n).focus(); } });
$('#brands').addEventListener('pointerenter', () => bPaused = true); $('#brands').addEventListener('pointerleave', () => bPaused = false);
let brandsStarted = false;
new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting && !brandsStarted) { brandsStarted = true; show(0); o.disconnect(); } }), {threshold:.25}).observe($('#brands'));
$$('#map .dot').forEach(d => d.style.setProperty('--d', d.getAttribute('cx')));

/* ---------- odometers ---------- */
function buildOdo(el){ const str = (+el.dataset.odo).toLocaleString('en-IN'); el.setAttribute('aria-label', str); el.innerHTML = [...str].map(ch => /\d/.test(ch) ? `<span class="col" data-d="${ch}">${'0123456789'.split('').map(n=>`<span>${n}</span>`).join('')}</span>` : `<span class="st">${ch}</span>`).join(''); }
$$('.odo').forEach(buildOdo);
function runOdo(el){ $$('.col', el).forEach((c,i) => { c.style.transitionDelay = (i*120)+'ms'; c.style.transform = `translateY(-${+c.dataset.d*10}%)`; }); }

/* ---------- reveals ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; el.classList.add('in'); io.unobserve(el);
  $$('.odo', el).forEach(runOdo);
  if (el.classList.contains('t-rev')) setTimeout(() => $$('#split div').forEach(d => d.style.width = d.dataset.w + '%'), 300);
  if (el.classList.contains('t-gm')) setTimeout(() => $$('#gm i').forEach(d => d.style.width = d.dataset.w + '%'), 300);
  if (el.classList.contains('t-ebitda')) setTimeout(() => $('#ringFg').style.strokeDashoffset = 377*(1-.176), 300);
}), {threshold:.18});
$$('[data-r], [data-split]:not(#heroH .ln):not(.big-wm), #map').forEach(el => io.observe(el));
$$('.film-r').forEach(el => new IntersectionObserver((es,o) => es.forEach(e => { if (e.isIntersecting) { el.classList.add('in'); o.disconnect(); } }), {threshold:.15}).observe(el.parentElement));
$$('#heroH .ln').forEach(l => l.classList.add('pending'));
new IntersectionObserver((es,o) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } }), {threshold:.3}).observe($('#bigWm'));
$$('.odo-s').forEach(el => { const v = el.dataset.odo; el.innerHTML = ''; el.classList.add('odo'); el.dataset.odo = v; buildOdo(el); });

/* ---------- footer wave ---------- */
const wcv = $('#waveCv'), wctx = wcv.getContext('2d'); let WW, WH;
function wsize(){ const d = Math.min(devicePixelRatio||1,2); WW = wcv.clientWidth; WH = wcv.clientHeight; wcv.width = WW*d; wcv.height = WH*d; wctx.setTransform(d,0,0,d,0,0); }
wsize(); addEventListener('resize', wsize, {passive:true});
function drawWave(t){
  wctx.clearRect(0,0,WW,WH);
  const mxr = mx/innerWidth;
  [['rgba(227,161,54,.9)', 0, 1],['rgba(93,179,214,.9)', 2, -1],['#1C130C', 4, .5]].forEach(([col, ph, dir], k) => {
    wctx.beginPath(); wctx.moveTo(0, WH);
    for (let x=0; x<=WW; x+=8){ const bump = Math.exp(-Math.pow((x/WW - mxr)*4, 2))*18*(k<2?1:.4);
      wctx.lineTo(x, WH*(.32 + k*.2) + Math.sin(x*.006*(1+k*.3) + t*.0012*dir + ph)*12 + Math.sin(x*.017 - t*.002 + ph)*5 - bump); }
    wctx.lineTo(WW, WH); wctx.closePath(); wctx.fillStyle = col; wctx.fill(); });
}

/* ---------- kinetic weight ---------- */
const kinChars = () => $$('.kin .ch>i');
let kc = [];
function kinWeights(){ if (RM) return; if (!kc.length) kc = kinChars();
  kc.forEach(ch => { const r = ch.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const d = Math.hypot(r.left + r.width/2 - mx, r.top + r.height/2 - my);
    const w = 400 + 500*Math.max(0, 1 - d/260); ch.style.setProperty('--w', w.toFixed(0)); }); }

/* ================= SHARED GLOW SPRITES ================= */
function glowSprite(rgb, size=96){ const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'); const r=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2); r.addColorStop(0,`rgba(${rgb},1)`); r.addColorStop(.2,`rgba(${rgb},.6)`); r.addColorStop(1,`rgba(${rgb},0)`); g.fillStyle=r; g.fillRect(0,0,size,size); return c; }
const GLA = glowSprite('255,186,80'), GLB = glowSprite('110,205,245'), GLW = glowSprite('255,248,232');
const extraDraw = [];
const dprHi = () => Math.min(devicePixelRatio||1, 3);

/* ================= 3D MOLECULE ================= */
function makeMolecule(cv, opt){
  const ctx = cv.getContext('2d');
  const raw = [[-1.27,.25,0,'C'],[0,-.55,0,'C'],[1.15,.28,0,'O'],[1.95,-.25,0,'H'],[-2.2,-.3,0,'H'],[-1.25,.88,.88,'H'],[-1.25,.88,-.88,'H'],[0,-1.2,.88,'H'],[0,-1.2,-.88,'H']];
  const cxm = raw.reduce((a,p)=>a+p[0],0)/raw.length, cym = raw.reduce((a,p)=>a+p[1],0)/raw.length;
  const atoms = raw.map((p,i)=>({x:p[0]-cxm, y:p[1]-cym, z:p[2], t:p[3], ph:i*1.3}));
  const bonds = [[0,1],[1,2],[2,3],[0,4],[0,5],[0,6],[1,7],[1,8]];
  const TY = {C:{r:.44,c:['#8A7563','#2B1D13','#080503'],lab:'#F4EEE2'}, O:{r:.47,c:['#FFE7B5','#E3A136','#6E3E06'],lab:'#2B1D13'}, H:{r:.29,c:['#FFFFFF','#D6ECF5','#6FA6BD'],lab:'#1D6787'}};
  const orbits = [0,1,2].map(i=>({tilt:i*1.05+.35, rot:i*.95, r:2.6+i*.2, sp:.0045+i*.0015, e:[0, Math.PI]}));
  let W=1, H=1, yaw=.6, pitch=.2, vyaw=.004, drag=null, sc=1;
  function size(){ const d=dprHi(); W=cv.clientWidth||1; H=cv.clientHeight||1; cv.width=Math.max(2,W*d|0); cv.height=Math.max(2,H*d|0); ctx.setTransform(d,0,0,d,0,0); sc=Math.min(W,H)*(opt.zoom||.155); }
  size(); addEventListener('resize', size, {passive:true});
  cv.addEventListener('pointerdown', e => { drag={x:e.clientX,y:e.clientY}; try{cv.setPointerCapture(e.pointerId)}catch(_){} });
  cv.addEventListener('pointermove', e => { if(!drag) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag={x:e.clientX,y:e.clientY}; vyaw=dx*.008; yaw+=vyaw; pitch=clamp(pitch+dy*.006,-1.2,1.2); });
  const end=()=>drag=null; cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
  function orbitPt(o,a){ const x=Math.cos(a)*o.r, y=Math.sin(a)*o.r*.4; const y2=y*Math.cos(o.tilt), z2=y*Math.sin(o.tilt); return [x*Math.cos(o.rot)+z2*Math.sin(o.rot), y2, -x*Math.sin(o.rot)+z2*Math.cos(o.rot)]; }
  function P(x,y,z){ const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
    let X=x*cy+z*sy, Z=-x*sy+z*cy; const Y=y*cp-Z*sp; Z=y*sp+Z*cp; const cam=7, s=sc*cam/(cam+Z); return {X:W/2+X*s, Y:H*.48-Y*s, s, z:Z}; }
  function draw(t){
    if(!drag && !RM){ yaw+=vyaw; vyaw=lerp(vyaw,.0035,.02); pitch=lerp(pitch,.22+Math.sin(t*.0004)*.12,.01); }
    ctx.clearRect(0,0,W,H);
    // floor shadow
    ctx.save(); ctx.translate(W/2,H*.86); ctx.scale(1,.16); const sh=ctx.createRadialGradient(0,0,0,0,0,sc*2.5); sh.addColorStop(0,opt.dark?'rgba(0,0,0,.45)':'rgba(60,40,20,.25)'); sh.addColorStop(1,'rgba(60,40,20,0)'); ctx.fillStyle=sh; ctx.beginPath(); ctx.arc(0,0,sc*2.5,0,TAU); ctx.fill(); ctx.restore();
    const eps=[];
    orbits.forEach((o,oi)=>{ ctx.beginPath(); for(let k=0;k<=72;k++){ const p=orbitPt(o,k/72*TAU), q=P(p[0],p[1],p[2]); k?ctx.lineTo(q.X,q.Y):ctx.moveTo(q.X,q.Y);} ctx.strokeStyle=opt.dark?'rgba(242,233,216,.18)':'rgba(43,29,19,.13)'; ctx.lineWidth=1; ctx.stroke();
      o.e.forEach((e0,ei)=>{ const a=e0+(RM?0:t*o.sp*.25); const p=orbitPt(o,a), q=P(p[0],p[1],p[2]); const tr=[]; for(let k=1;k<=10;k++){ const pp=orbitPt(o,a-k*.05); tr.push(P(pp[0],pp[1],pp[2])); } eps.push({...q, tr, col:(oi+ei)%2?'b':'a'}); }); });
    const pts = atoms.map(a=>{ const v=RM?0:Math.sin(t*.006+a.ph)*.025; return {...P(a.x+v,a.y+v*.6,a.z)}; });
    const items=[];
    bonds.forEach(([i,j])=>items.push({k:'b',i,j,z:(pts[i].z+pts[j].z)/2+.06}));
    pts.forEach((p,i)=>items.push({k:'a',i,z:p.z}));
    eps.forEach(e=>items.push({k:'e',e,z:e.z}));
    items.sort((a,b)=>b.z-a.z);
    for(const it of items){
      if(it.k==='b'){ const A=pts[it.i], B=pts[it.j], mxp=(A.X+B.X)/2, myp=(A.Y+B.Y)/2, w=.15*(A.s+B.s)/2;
        [[A,TY[atoms[it.i].t]],[B,TY[atoms[it.j].t]]].forEach(([Q,ty])=>{ ctx.lineCap='round';
          ctx.strokeStyle=ty.c[2]; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(Q.X,Q.Y); ctx.lineTo(mxp,myp); ctx.stroke();
          ctx.strokeStyle=ty.c[1]; ctx.lineWidth=w*.6; ctx.beginPath(); ctx.moveTo(Q.X-w*.12,Q.Y-w*.12); ctx.lineTo(mxp-w*.12,myp-w*.12); ctx.stroke();
          ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=w*.14; ctx.beginPath(); ctx.moveTo(Q.X-w*.26,Q.Y-w*.26); ctx.lineTo(mxp-w*.26,myp-w*.26); ctx.stroke(); }); }
      else if(it.k==='a'){ const p=pts[it.i], ty=TY[atoms[it.i].t], r=ty.r*p.s;
        let g=ctx.createRadialGradient(p.X-r*.38,p.Y-r*.42,r*.04,p.X,p.Y,r); g.addColorStop(0,ty.c[0]); g.addColorStop(.48,ty.c[1]); g.addColorStop(1,ty.c[2]);
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.X,p.Y,r,0,TAU); ctx.fill();
        g=ctx.createRadialGradient(p.X+r*.55,p.Y+r*.6,0,p.X+r*.55,p.Y+r*.6,r*.95); g.addColorStop(0,'rgba(150,210,240,.4)'); g.addColorStop(1,'rgba(150,210,240,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.X,p.Y,r,0,TAU); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(p.X-r*.36,p.Y-r*.44,r*.2,r*.11,-.6,0,TAU); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.lineWidth=Math.max(1,r*.05); ctx.beginPath(); ctx.arc(p.X,p.Y,r*.94,.2,1.4); ctx.stroke();
        if(opt.labels){ ctx.fillStyle=ty.lab; ctx.globalAlpha=.9; ctx.font=`600 ${Math.max(10,r*.62)|0}px Hanken Grotesk, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(atoms[it.i].t,p.X+r*.05,p.Y+r*.1); ctx.globalAlpha=1; } }
      else { const e=it.e, img=e.col==='b'?GLB:GLA;
        e.tr.forEach((q,k)=>{ const sz=q.s*.16*(1-k/11); ctx.globalAlpha=.5*(1-k/10); ctx.drawImage(img,q.X-sz/2,q.Y-sz/2,sz,sz); });
        const sz=e.s*.55; ctx.globalAlpha=.95; ctx.drawImage(img,e.X-sz/2,e.Y-sz/2,sz,sz); ctx.globalAlpha=1; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(e.X,e.Y,Math.max(1.5,e.s*.04),0,TAU); ctx.fill(); }
    }
  }
  return {draw, size, cv};
}
const molA = makeMolecule($('#molCv'), {labels:true, zoom:.15});
extraDraw.push(t => { if (vis($('#molecule'))) molA.draw(t); });

/* ================= NEURAL NETWORK ================= */
function makeNetwork(cv){
  const ctx = cv.getContext('2d'); let W=1, H=1, sc=1;
  const small = innerWidth < 700, N = small ? 130 : 260, nodes = [];
  const HUBS=[['Farms',-1.25,-.35,.35,'c'],['Kashipur plant',-.5,.35,.45,'a'],['Gorakhpur plant',.65,.25,-.3,'a'],['Noida head office',0,.72,.05,'p'],['Uttar Pradesh',1.15,-.3,.4,'p'],['Uttarakhand',-.95,.55,-.45,'p'],['Delhi',.35,-.62,.6,'p'],['Chandigarh',-.25,-.72,-.5,'p'],['Oil companies',1.35,.42,-.2,'b'],['Defence canteens',.9,-.72,-.42,'p']];
  HUBS.forEach(h=>nodes.push({x:h[1],y:h[2],z:h[3],hub:h[0],kind:h[4],act:0}));
  while(nodes.length<N){ const x=rnd(-1.8,1.8), y=rnd(-1.05,1.05), z=rnd(-1.15,1.15); if((x/1.8)**2+(y/1.05)**2+(z/1.15)**2<1 && !(Math.abs(x)<.07&&y>.2)) nodes.push({x,y,z,act:0}); }
  const adj = nodes.map(()=>[]), edges = [];
  nodes.forEach((n,i)=>{ nodes.map((m,j)=>[j,(n.x-m.x)**2+(n.y-m.y)**2+(n.z-m.z)**2]).filter(v=>v[0]!==i).sort((a,b)=>a[1]-b[1]).slice(0,n.hub?6:3)
    .forEach(([j])=>{ if(!adj[i].includes(j)){ adj[i].push(j); adj[j].push(i); edges.push([i,j]); } }); });
  const pulses = []; let tmx=0, tmy=0, lastFire=0;
  function size(){ const d=Math.min(dprHi(),2.5); W=cv.clientWidth||1; H=cv.clientHeight||1; cv.width=W*d|0; cv.height=H*d|0; ctx.setTransform(d,0,0,d,0,0); sc=Math.min(W*(small?.42:.28), H*.4); }
  size(); addEventListener('resize', size, {passive:true});
  function fire(i,col){ adj[i].forEach(j=>{ if(pulses.length<340 && Math.random()<.75) pulses.push({a:i,b:j,k:0,sp:rnd(.012,.028),col}); }); }
  function draw(t){
    if(t-lastFire>550 && !RM){ lastFire=t; const h=Math.floor(Math.random()*HUBS.length); nodes[h].act=1; fire(h, nodes[h].kind==='b' ? 'b' : nodes[h].kind==='a' ? 'a' : (Math.random()<.5?'a':'b')); }
    const rc = cv.getBoundingClientRect(), lx = mx - rc.left, ly = my - rc.top;
    tmx=lerp(tmx,(mx/innerWidth-.5),.04); tmy=lerp(tmy,(my/innerHeight-.5),.04);
    const yaw=(RM?0:t*.00007)+tmx*.9, pitch=.12+tmy*.45, cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch), cam=4.2;
    const ox = small ? W/2 : W*.64, oy = small ? H*.7 : H/2;
    const pr = nodes.map(n=>{ let X=n.x*cy+n.z*sy, Z=-n.x*sy+n.z*cy; const Y=n.y*cp-Z*sp; Z=n.y*sp+Z*cp; const s=cam/(cam+Z); return {X:ox+X*sc*s, Y:oy-Y*sc*s, s, z:Z}; });
    ctx.clearRect(0,0,W,H);
    const bg=ctx.createRadialGradient(ox,oy,0,ox,oy,sc*2.2); bg.addColorStop(0,'rgba(227,161,54,.10)'); bg.addColorStop(.5,'rgba(93,179,214,.05)'); bg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    ctx.lineWidth=1;
    for(const [i,j] of edges){ const a=pr[i], b=pr[j], depth=clamp((2-(a.z+b.z)/2)/3), hot=Math.max(nodes[i].act,nodes[j].act);
      const near=Math.max(0,1-Math.hypot((a.X+b.X)/2-lx,(a.Y+b.Y)/2-ly)/140);
      ctx.strokeStyle=`rgba(242,233,216,${(.04+.12*depth+hot*.3+near*.35).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(a.X,a.Y); ctx.lineTo(b.X,b.Y); ctx.stroke(); }
    ctx.globalCompositeOperation='lighter';
    for(let q=pulses.length-1;q>=0;q--){ const p=pulses[q]; if(!RM) p.k+=p.sp;
      if(p.k>=1){ pulses.splice(q,1); nodes[p.b].act=1; if(Math.random()<.5) fire(p.b,p.col); continue; }
      const a=pr[p.a], b=pr[p.b], x=lerp(a.X,b.X,p.k), y=lerp(a.Y,b.Y,p.k), s=lerp(a.s,b.s,p.k), k0=Math.max(0,p.k-.22), x0=lerp(a.X,b.X,k0), y0=lerp(a.Y,b.Y,k0);
      const col=p.col==='a'?'255,190,90':'110,205,245'; const gr=ctx.createLinearGradient(x0,y0,x,y); gr.addColorStop(0,`rgba(${col},0)`); gr.addColorStop(1,`rgba(${col},.95)`);
      ctx.strokeStyle=gr; ctx.lineWidth=2.2*s; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x,y); ctx.stroke();
      const sz=20*s; ctx.drawImage(p.col==='a'?GLA:GLB,x-sz/2,y-sz/2,sz,sz); }
    nodes.forEach((n,i)=>{ const p=pr[i]; n.act*=.95; const near=Math.max(0,1-Math.hypot(p.X-lx,p.Y-ly)/110), glow=n.act+near;
      if(glow>.04||n.hub){ const sz=(n.hub?44:22)*p.s*(.55+glow); ctx.globalAlpha=Math.min(1,(n.hub?.45:0)+glow); ctx.drawImage(n.kind==='b'?GLB:n.kind==='a'?GLA:GLW,p.X-sz/2,p.Y-sz/2,sz,sz); ctx.globalAlpha=1; }
      const r=(n.hub?3.4:1.3)*p.s*(1+glow*.9);
      ctx.fillStyle=n.hub?(n.kind==='b'?'#A8DDF1':n.kind==='a'?'#F7C877':'#F4EEE2'):`rgba(242,233,216,${(.3+.45*clamp((2-p.z)/3)).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(p.X,p.Y,r,0,TAU); ctx.fill(); });
    ctx.globalCompositeOperation='source-over';
    ctx.font=`500 ${small?11:13}px Hanken Grotesk, sans-serif`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.lineWidth=1;
    nodes.forEach((n,i)=>{ if(!n.hub) return; const p=pr[i]; ctx.globalAlpha=.35+.65*clamp(1.2-(p.z+1)/2.2);
      ctx.strokeStyle='rgba(242,233,216,.45)'; ctx.beginPath(); ctx.moveTo(p.X+6,p.Y-3); ctx.lineTo(p.X+20,p.Y-14); ctx.stroke();
      ctx.fillStyle='#F4EEE2'; ctx.fillText(n.hub,p.X+24,p.Y-15); }); ctx.globalAlpha=1;
  }
  return {draw, size};
}
const net = makeNetwork($('#netCv'));
extraDraw.push(t => { if (vis($('#network'))) net.draw(t); });

/* ================= CHARTS ================= */
const chSvg = $('#chSvg'), chNote = $('#chNote'), chTip = $('#chTip'), ctabs = $$('.ctab'), chStage = $('#chStage');
const fmt = n => n.toLocaleString('en-IN');
const DEFS = `<defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4C06A"/><stop offset="1" stop-color="#C98322"/></linearGradient><linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A6DCEF"/><stop offset="1" stop-color="#3D93BA"/></linearGradient><linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B7CF62"/><stop offset="1" stop-color="#6E8E32"/></linearGradient><linearGradient id="gAB" x1="0" x2="1"><stop offset="0" stop-color="#E3A136"/><stop offset="1" stop-color="#5DB3D6"/></linearGradient><linearGradient id="gN" x1="0" x2="1"><stop offset="0" stop-color="#D9C7AC"/><stop offset="1" stop-color="#C4AE8E"/></linearGradient><filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#5a3a1a" flood-opacity=".18"/></filter></defs>`;
const CHARTS = [
  { aria:'Donut chart of FY26 revenue: spirits Rs 1,331 crore (47.5 percent), biofuels Rs 1,470 crore (52.5 percent), total Rs 2,801 crore.',
    note:'Source: IGL Spirits investor presentation, FY26.',
    svg(){ const C=2*Math.PI*150;
      return `<circle cx="250" cy="230" r="150" fill="none" stroke="#F1E8D8" stroke-width="58"/>
      <circle class="seg" data-tip="Spirits: Rs 1,331 crore (47.5%)" cx="250" cy="230" r="150" fill="none" stroke="url(#gA)" stroke-width="58" pathLength="100" stroke-dasharray="0 100" data-final="47 53" stroke-dashoffset="25" filter="url(#sh)"/>
      <circle class="seg" style="--d:.15s" data-tip="Biofuels: Rs 1,470 crore (52.5%)" cx="250" cy="230" r="150" fill="none" stroke="url(#gB)" stroke-width="58" pathLength="100" stroke-dasharray="0 100" data-final="52 48" stroke-dashoffset="-22.5" filter="url(#sh)"/>
      <text class="ct fade" x="250" y="205" text-anchor="middle">FY26 revenue</text><text class="cv fade" x="250" y="250" text-anchor="middle">Rs 2,801 cr</text>
      <g class="fade" style="--d:.9s"><rect x="500" y="120" width="18" height="18" rx="5" fill="#E3A136"/><text class="ctd" x="530" y="135">Spirits</text><text class="cvl" x="500" y="205">47.5%</text><text class="ct" x="500" y="232">Rs 1,331 crore</text>
      <rect x="500" y="280" width="18" height="18" rx="5" fill="#5DB3D6"/><text class="ctd" x="530" y="295">Biofuels</text><text class="cvl" x="500" y="365">52.5%</text><text class="ct" x="500" y="392">Rs 1,470 crore</text></g>`; } },
  { aria:'Bar chart of margins: gross margin 36 percent before and 45.9 percent in FY26; EBITDA margin 17.6 percent in FY26.',
    note:'Gross margin as shown in the investor presentation; EBITDA margin for FY26.',
    svg(){ const base=390, top=70, sc=v=>(v/50)*(base-top); let g='';
      for(let v=0;v<=50;v+=10){ const y=base-sc(v); g+=`<line class="grid" x1="90" x2="860" y1="${y}" y2="${y}"/><text class="ct" x="76" y="${y+5}" text-anchor="end">${v}%</text>`; }
      const bars=[['Gross margin, before',36,'#gN'],['Gross margin, FY26',45.9,'#gC'],['EBITDA margin, FY26',17.6,'#gA']];
      bars.forEach(([l,v,f],i)=>{ const x=170+i*230, h=sc(v); g+=`<rect class="bar" style="--d:${i*.15}s" data-tip="${l}: ${v}%" x="${x}" y="${base-h}" width="130" height="${h}" rx="14" fill="url(${f})" filter="url(#sh)"/>
        <text class="cv fade" style="--d:${.8+i*.15}s" x="${x+65}" y="${base-h-16}" text-anchor="middle">${v}%</text><text class="ct" x="${x+65}" y="${base+30}" text-anchor="middle">${l}</text>`; });
      g+=`<path class="ln" pathLength="1" d="M235 ${base-sc(36)-40} C 330 ${base-sc(36)-80}, 380 ${base-sc(45.9)-90}, 465 ${base-sc(45.9)-50}" fill="none" stroke="#7FA046" stroke-width="2.5" stroke-dasharray="1" marker-end="url(#ar)"/>
        <text class="ctd fade" style="--d:1.4s" x="350" y="${base-sc(45.9)-100}" text-anchor="middle" fill="#4D6A20">+9.9 points</text>`;
      return `<defs><marker id="ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#7FA046"/></marker></defs>`+g; } },
  { aria:'Chart of the company plan: EBITDA Rs 492 crore in FY26, a target above Rs 550 crore in FY27, and a target to be debt-free in FY28.',
    note:'FY27 and FY28 are company targets from the investor presentation, not results.',
    svg(){ const base=380, sc=v=>v/700*280; let g='';
      for(let v=0;v<=700;v+=100){ const y=base-sc(v); g+=`<line class="grid" x1="90" x2="860" y1="${y}" y2="${y}"/><text class="ct" x="76" y="${y+5}" text-anchor="end">${v}</text>`; }
      g+=`<text class="ct" x="90" y="40">Rs crore</text>`;
      g+=`<rect class="bar" data-tip="FY26 EBITDA: Rs 492 crore" x="180" y="${base-sc(492)}" width="110" height="${sc(492)}" rx="12" fill="url(#gA)" filter="url(#sh)"/>
        <rect class="bar" style="--d:.12s" data-tip="FY26 profit after tax: Rs 244 crore" x="300" y="${base-sc(244)}" width="60" height="${sc(244)}" rx="10" fill="url(#gN)"/>
        <text class="cv fade" x="235" y="${base-sc(492)-16}" text-anchor="middle">492</text><text class="ctd fade" x="330" y="${base-sc(244)-12}" text-anchor="middle">244</text>
        <rect class="bar" style="--d:.3s" data-tip="FY27 target: EBITDA above Rs 550 crore" x="470" y="${base-sc(550)}" width="110" height="${sc(550)}" rx="12" fill="rgba(227,161,54,.12)" stroke="#E3A136" stroke-width="2.5" stroke-dasharray="8 7"/>
        <text class="cv fade" style="--d:1s" x="525" y="${base-sc(550)-16}" text-anchor="middle">550+</text>
        <path class="ln" pathLength="1" d="M235 ${base-sc(492)-48} Q 380 ${base-sc(560)-70} 515 ${base-sc(550)-50}" fill="none" stroke="#8E550B" stroke-width="2" stroke-dasharray="1"/>
        <g class="fade" style="--d:1.3s" data-tip="FY28 target: debt-free"><line x1="760" x2="760" y1="${base}" y2="150" stroke="#2B1D13" stroke-width="2.5"/><path d="M760 150 h70 l-14 20 l14 20 h-70z" fill="url(#gAB)"/><text class="ctd" x="772" y="214">Debt-free</text></g>
        <text class="ct" x="270" y="${base+30}" text-anchor="middle">FY26 (EBITDA, PAT)</text><text class="ct" x="525" y="${base+30}" text-anchor="middle">FY27 target</text><text class="ct" x="760" y="${base+30}" text-anchor="middle">FY28 target</text>`;
      return g; } },
  { aria:'Horizontal bar chart of FY26 scale: United Spirits net sales Rs 12,467 crore, Radico Khaitan net revenue Rs 6,050 crore, IGL Spirits revenue Rs 2,801 crore, Piccadily Agro revenue Rs 1,143 crore.',
    note:'Each company reports a slightly different measure (net sales, net revenue or revenue), so treat this as a rough comparison of scale.',
    svg(){ const rows=[['United Spirits',12467,'net sales'],['Radico Khaitan',6050,'net revenue'],['IGL Spirits',2801,'revenue'],['Piccadily Agro',1143,'revenue']]; let g='';
      rows.forEach(([n,v,m],i)=>{ const y=60+i*95, w=v/12467*560, igl=n==='IGL Spirits';
        g+=`<text class="${igl?'ctd':'ct'}" x="20" y="${y+30}" style="font-size:17px">${n}</text>
        <rect x="230" y="${y+4}" width="560" height="44" rx="12" fill="#F4EEE2"/>
        <rect class="hbar" style="--d:${i*.12}s" data-tip="${n}: Rs ${fmt(v)} crore ${m}" x="230" y="${y+4}" width="${w}" height="44" rx="12" fill="${igl?'url(#gAB)':'url(#gN)'}" filter="url(#sh)"/>
        <text class="ctd fade" style="--d:${.9+i*.12}s" x="${230+w+12}" y="${y+33}">Rs ${fmt(v)} cr</text>`; });
      return g; } },
  { aria:'Waffle chart of India spirits volume in 2025: about 416 million cases, roughly two thirds whisky. IGL Spirits makes about 30 million cases a year, around 7 percent of that volume.',
    note:'Industry volume is for calendar 2025; IGL Spirits figure is its yearly scale. A rough comparison only.',
    svg(){ let g=''; const cs=30, gap=6, x0=40, y0=40;
      for(let i=0;i<100;i++){ const r=Math.floor(i/10), c=i%10, wh=i<67; g+=`<rect class="cell" style="--d:${(r+c)*35}ms" data-tip="${wh?'Whisky':'Other spirits'}: about 4.2 million cases per square" x="${x0+c*(cs+gap)}" y="${y0+r*(cs+gap)}" width="${cs}" height="${cs}" rx="7" fill="${wh?'#D2B48A':'#EFE5D3'}"/>`; }
      g+=`<g class="fade" style="--d:1.2s"><text class="ct" x="460" y="70">India sold about</text><text class="cvl" x="460" y="135">416M</text><text class="ct" x="460" y="162">cases of spirits in 2025</text>
        <rect x="460" y="190" width="16" height="16" rx="4" fill="#D2B48A"/><text class="ct" x="484" y="203">Whisky, about two-thirds</text>
        <rect x="460" y="218" width="16" height="16" rx="4" fill="#EFE5D3" stroke="#D8CBB4"/><text class="ct" x="484" y="231">Everything else</text></g>
        <text class="ctd fade" style="--d:1.4s" x="460" y="290">IGL Spirits: about 30 million cases a year</text>
        <rect x="460" y="306" width="380" height="30" rx="10" fill="#F4EEE2"/>
        <rect class="hbar" style="--d:1.5s" data-tip="IGL Spirits: about 30 million cases a year, roughly 7% of 416 million" x="460" y="306" width="${380*30/416}" height="30" rx="10" fill="url(#gAB)"/>
        <text class="cv fade" style="--d:2s" x="${460+380*30/416+14}" y="333">~7%</text>`;
      return g; } }
];
let chIdx = -1, chAuto = false, chT0 = performance.now(), chPaused = false;
function chShow(i){
  chIdx = i; chT0 = performance.now();
  ctabs.forEach((b,j) => { b.setAttribute('aria-selected', j===i); b.tabIndex = j===i ? 0 : -1; b.querySelector('.prog').style.width = '0'; });
  chStage.setAttribute('aria-labelledby','ct'+i);
  const c = CHARTS[i];
  chSvg.innerHTML = `<svg viewBox="0 0 900 460" role="img" aria-label="${c.aria}">${DEFS}${c.svg()}</svg>`; chNote.textContent = c.note;
  const svg = chSvg.firstElementChild;
  requestAnimationFrame(() => requestAnimationFrame(() => { svg.classList.add('go'); $$('.seg', svg).forEach(s => s.setAttribute('stroke-dasharray', s.dataset.final)); }));
}
ctabs.forEach((b,i) => b.addEventListener('click', () => { chAuto = false; chShow(i); }));
$('#ctabs').addEventListener('keydown', e => { if (['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(e.key)) { e.preventDefault(); chAuto = false; const n = (chIdx + (e.key==='ArrowDown'||e.key==='ArrowRight' ? 1 : -1) + 5) % 5; chShow(n); ctabs[n].focus(); } });
chStage.addEventListener('pointermove', e => { const el = e.target.closest('[data-tip]'); if (!el) { chTip.style.opacity = 0; return; } const r = chStage.getBoundingClientRect(); chTip.textContent = el.dataset.tip; chTip.style.left = (e.clientX - r.left)+'px'; chTip.style.top = (e.clientY - r.top)+'px'; chTip.style.opacity = 1; });
chStage.addEventListener('pointerleave', () => chTip.style.opacity = 0);
$('#charts').addEventListener('pointerenter', () => chPaused = true); $('#charts').addEventListener('pointerleave', () => chPaused = false);
let chStarted = false;
new IntersectionObserver((es,o) => es.forEach(e => { if (e.isIntersecting && !chStarted) { chStarted = true; chShow(0); o.disconnect(); } }), {threshold:.3}).observe(chStage);
extraDraw.push((t, dt) => { if (!chStarted) return; if (chAuto && !chPaused && vis($('#charts'))) { const k = clamp((t - chT0)/7500); ctabs[chIdx].querySelector('.prog').style.width = (k*100)+'%'; if (k >= 1) chShow((chIdx+1)%5); } else chT0 += dt; });

/* ================= MENU + RAIL ================= */
const menu = $('#menu'), menuBtn = $('#menuBtn'), menuDesc = $('#menuDesc'); let menuMol = null;
function openMenu(){ menu.hidden = false; void menu.offsetWidth; menu.classList.add('open'); menuBtn.setAttribute('aria-expanded','true'); menuBtn.querySelector('.mbl').textContent = 'Close'; document.body.classList.add('menu-open'); if (lenis) lenis.stop();
  if (!menuMol) menuMol = makeMolecule($('#menuCv'), {zoom:.13, dark:true}); else menuMol.size(); setTimeout(() => { const a = $('.menu-list a'); if (a) a.focus({preventScroll:true}); }, 500); }
function closeMenu(){ if (!menu.classList.contains('open')) return; menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); menuBtn.querySelector('.mbl').textContent = 'Menu'; document.body.classList.remove('menu-open'); if (lenis) lenis.start(); setTimeout(() => { if (!menu.classList.contains('open')) menu.hidden = true; }, 1000); }
menuBtn.addEventListener('click', () => menu.classList.contains('open') ? closeMenu() : openMenu());
addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); menuBtn.focus(); } });
$$('.menu-list a').forEach(a => { const set = () => menuDesc.textContent = a.dataset.desc; a.addEventListener('mouseenter', set); a.addEventListener('focus', set); a.addEventListener('click', closeMenu); });
extraDraw.push(t => { if (menu.classList.contains('open') && menuMol) menuMol.draw(t); });
const railA = $$('#rail a'), railS = railA.map(a => $(a.getAttribute('href')));
extraDraw.push(() => { let on = -1; railS.forEach((s,i) => { if (!s) return; const r = s.getBoundingClientRect(); if (r.top < innerHeight*.5 && r.bottom > innerHeight*.5) on = i; }); railA.forEach((a,i) => a.classList.toggle('on', i===on)); });


/* ================= REAL MEDIA SLOTS ================= */
// EDIT HERE: put a YouTube video ID, or set youtube to '' to use assets/video/showreel.mp4 instead.
const SHOWREEL = { youtube: 'plR2EIlaCZo', vertical: true, file: 'assets/video/showreel.mp4' };
// Process films: if assets/video/0X-*.mp4 exists, it replaces the animation.
$$('.film-vid').forEach(v => {
  const film = v.parentElement, cv = film.querySelector('canvas');
  const load = () => { if (v.src) return; v.src = v.dataset.src; };
  v.addEventListener('loadeddata', () => { film.classList.add('has-video'); const sc = scenes.find(s => s.cv === cv); if (sc) sc.on = false; if (!RM) v.play().catch(() => {}); });
  v.addEventListener('error', () => v.remove());
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { load(); o.disconnect(); } }), {rootMargin:'600px'}).observe(film);
  new IntersectionObserver(es => es.forEach(e => { if (!film.classList.contains('has-video') || RM) return; e.isIntersecting ? v.play().catch(() => {}) : v.pause(); })).observe(film);
});
// Background film: a YouTube video (SHOWREEL.youtube) or your own file (assets/video/showreel.mp4).
(() => { const box = $('#reelBox'), sec = $('#film'), bP = $('#filmPause'), bS = $('#filmSound'); if (!box) return;
  let playing = !RM, muted = true, yt = null, vid = null;
  const label = (b, t) => b.querySelectorAll('.lbl span').forEach(x => x.textContent = t);
  const cmd = f => { if (yt && yt.contentWindow) yt.contentWindow.postMessage(JSON.stringify({event:'command', func:f, args:[]}), '*'); };
  if (SHOWREEL.youtube) {
    const id = SHOWREEL.youtube;
    box.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;
    const mount = () => { if (yt) return; yt = document.createElement('iframe');
      yt.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=${RM?0:1}&mute=1&loop=1&playlist=${id}&controls=0&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3&enablejsapi=1`;
      yt.title = 'Background video'; yt.tabIndex = -1; yt.allow = 'autoplay; encrypted-media'; yt.className = SHOWREEL.vertical ? 'tall' : ''; box.appendChild(yt); };
    new IntersectionObserver((es,o) => es.forEach(e => { if (e.isIntersecting) { mount(); o.disconnect(); } }), {rootMargin:'400px'}).observe(sec);
  } else {
    vid = document.createElement('video'); vid.muted = true; vid.loop = true; vid.playsInline = true; vid.autoplay = !RM; vid.preload = 'metadata';
    vid.addEventListener('error', () => { sec.hidden = true; }); vid.src = SHOWREEL.file; box.appendChild(vid);
  }
  if (RM) label(bP, 'Play video');
  bP.addEventListener('click', () => { playing = !playing; if (vid) playing ? vid.play() : vid.pause(); cmd(playing ? 'playVideo' : 'pauseVideo'); bP.setAttribute('aria-pressed', !playing); label(bP, playing ? 'Pause video' : 'Play video'); });
  bS.addEventListener('click', () => { muted = !muted; if (vid) vid.muted = muted; cmd(muted ? 'mute' : 'unMute'); bS.setAttribute('aria-pressed', !muted); label(bS, muted ? 'Turn sound on' : 'Turn sound off'); });
  new IntersectionObserver(es => es.forEach(e => { if (!playing) return; if (vid) e.isIntersecting ? vid.play().catch(()=>{}) : vid.pause(); cmd(e.isIntersecting ? 'playVideo' : 'pauseVideo'); })).observe(sec);
})();

/* ---------- main loop ---------- */
const hero = $('#hero'), heroFrame = $('#heroFrame'), heroCopy = $('#heroCopy'), hero2 = $('#hero2'), badgeRot = $('#badgeRot');
const progBar = $('#progBar'), mq1 = $('#mq1'), mq2 = $('#mq2'), scs = $$('.sc'), scIns = $$('.sc-in'), about = $('#about'), road = $('#road');
const wave1 = $('#wave1'), wave2 = $('#wave2'), liveC = $('#liveCases'), liveL = $('#liveLitres'), brandsEl = $('#brands'), numEl = $('#numbers'), footer = $('footer');
const vis = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
function wavePath(level, t, ph, tilt){ const top = 212 - level*196; let d = `M0 ${top}`; for (let x=0;x<=110;x+=5) d += ` L${x} ${(top + Math.sin(x*.07 + t*.003 + ph)*3 + Math.sin(x*.13 - t*.0021)*1.6 + tilt*(x-55)).toFixed(2)}`; return d + ' L110 230 L0 230 Z'; }
let lastY = scrollY, sv = 0, lastT = 0, m1 = 0, m2 = 0, rot = 0, lastOn = null;
function frame(t){
  const dt = Math.min(64, t - lastT || 16); lastT = t;
  if (lenis) lenis.raf(t);
  const y = scrollY, dy = y - lastY; sv = lerp(sv, dy, .2); lastY = y;
  for (const s of scenes) if (s.vis && s.on) s.def.draw(s, t);
  for (const f of extraDraw) f(t, dt);
  // hero: 3D drop splits on scroll
  if (vis(hero)) { const p = RM ? 0 : prog(hero), e = ease(clamp(p/.9));
    if (!RM) heroFrame.style.clipPath = `inset(${e*5}vh ${e*4}vw ${e*5}vh ${e*4}vw round ${e*40}px)`;
    heroCopy.style.opacity = 1 - clamp(p/.3); heroCopy.style.transform = `translateY(${-p*200}px)`;
    glFrames++; glAvg = lerp(glAvg, dt, .05); if (gl && glFrames > 60 && glAvg > 26 && glScale > .36) { glScale -= .08; glSize(); glFrames = 0; } else if (gl && glFrames > 120 && glAvg < 15 && glScale < 1) { glScale = Math.min(1, glScale + .06); glSize(); glFrames = 0; }
    const split = ease(clamp((p-.08)/.55)); glDraw(t, split);
    const k2 = clamp((p-.45)/.2); hero2.style.opacity = k2; hero2.style.transform = `translateY(${(1-k2)*30}px)`; }
  rot += (.15 + Math.abs(sv)*.4) * (dt/16); badgeRot.setAttribute('transform', `rotate(${rot} 80 80)`);
  // nav
  nav.classList.toggle('solid', y > 40);
  const docP = y / Math.max(1, document.documentElement.scrollHeight - innerHeight); progBar.style.transform = `scaleX(${docP})`;
  let on = null; secs.forEach((s,i) => { const r = s.getBoundingClientRect(); if (r.top < innerHeight*.45 && r.bottom > innerHeight*.45) on = navLinks[i]; });
  if (on !== lastOn) { navLinks.forEach(a => a.classList.toggle('on', a === on)); movePill(on); lastOn = on; }
  // about word highlight
  if (vis(about)) { const r = aboutBig.getBoundingClientRect(), p = clamp((innerHeight*.85 - r.top)/(r.height + innerHeight*.35)); const n = aboutWords.length;
    aboutWords.forEach((w,i) => w.style.opacity = (.14 + .86*clamp(p*n*1.1 - i)).toFixed(3)); }
  // stacking cards
  scs.forEach((sc,i) => { const nx = scs[i+1]; if (!nx) return; const top = 96 + i*18, r = nx.getBoundingClientRect(); const k = clamp(1 - (r.top - top - 18)/(innerHeight*.75));
    scIns[i].style.transform = `scale(${1 - k*.07})`; scIns[i].style.filter = `brightness(${1 - k*.22})`; });
  // velocity marquee
  if (!RM) { const v = 1 + Math.abs(sv)*.35, dir = sv < -0.5 ? -1 : 1;
    const w1 = mq1.firstElementChild.offsetWidth, w2 = mq2.firstElementChild.offsetWidth;
    m1 -= v*dir*(dt/16); m2 += v*dir*(dt/16); if (m1 < -w1) m1 += w1; if (m1 > 0) m1 -= w1; if (m2 > 0) m2 -= w2; if (m2 < -w2) m2 += w2;
    const sk = clamp(sv*.4, -12, 12);
    mq1.style.transform = `translate3d(${m1}px,0,0) skewX(${-sk}deg)`; mq2.style.transform = `translate3d(${m2}px,0,0) skewX(${sk}deg)`; }
  // people autoplay
  if (pAuto && !pPaused && vis($('#people'))) { const k = clamp((t - pT0)/6500); pitems[pIdx].querySelector('.bar').style.width = (k*100)+'%'; if (k >= 1) pShow((pIdx+1) % pitems.length, rnd(20,80), rnd(20,80)); } else pT0 += dt;
  // live tanks
  if (enteredAt !== null && vis(numEl)) { const s = (performance.now() - enteredAt)/1000, cases = s*30e6/31536000, litres = s*379e6/31536000;
    liveC.textContent = Math.floor(cases).toLocaleString('en-IN'); liveL.textContent = Math.floor(litres).toLocaleString('en-IN');
    const tilt = clamp(sv*.004, -.15, .15); wave1.setAttribute('d', wavePath((cases%100)/100*.85+.08, t, 0, tilt)); wave2.setAttribute('d', wavePath((litres%1000)/1000*.85+.08, t, 2, -tilt)); }
  // brands
  if (vis(brandsEl)) {
    const imp = clamp(sv*.0012, -.06, .06);
    bottles.forEach(b => { const r = b.el.getBoundingClientRect(), dx = (mx - (r.left + r.width/2))/innerWidth;
      b.v += -.035*b.th - .07*b.v + imp + (RM ? 0 : -dx*.002); b.th = clamp(b.th + b.v, -.45, .45);
      let d = `M0 ${b.level}`; for (let x=0;x<=120;x+=6) d += ` L${x} ${(b.level + Math.tan(b.th)*(x-60) + Math.sin(x*.12 + t*.004 + b.ph)*1.6).toFixed(2)}`;
      b.surf.setAttribute('d', d + ' L120 320 L0 320 Z');
      if (!RM) b.el.style.rotate = `${clamp(dx*4, -3, 3) - b.th*3}deg`; });
    if (brandsStarted && auto && !bPaused) { const k = clamp((t - t0)/6500); const pr = $('#tab'+cat+' .prog'); if (pr) pr.style.width = (k*100)+'%'; if (k>=1) show((cat+1)%CATS.length); }
    else t0 += dt;
  }
  // roadmap fill
  if (vis(road)) { const r = road.getBoundingClientRect(); road.style.setProperty('--f', clamp((innerHeight*.75 - r.top)/r.height).toFixed(3)); }
  // footer
  if (vis(footer)) drawWave(t);
  kinWeights();
  requestAnimationFrame(frame);
}
addEventListener('resize', () => { kc = []; if (lastOn) movePill(lastOn); }, {passive:true});
requestAnimationFrame(frame);
})();
