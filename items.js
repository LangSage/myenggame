// items.js
// Basic vector sprites + registry

export function drawPlant(ctx,x,y,t){
  const sway = Math.sin(t/500 + (x+y)*0.02) * 6;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = '#1e6f4f';
  ctx.beginPath(); ctx.moveTo(0, 12);
  ctx.quadraticCurveTo(sway*0.3, -8, sway, -22);
  ctx.lineTo(sway+2, -22); ctx.quadraticCurveTo(sway*0.3+3, -8, 3, 12); ctx.fill();
  ctx.fillStyle = '#2aa36b';
  for(let i=0;i<3;i++){
    const ly = -8 - i*6, lx = sway*0.5 + (i%2? -10:10);
    ctx.beginPath(); ctx.ellipse(lx, ly, 12, 6, (i%2? -0.6:0.6), 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

export function drawChest(ctx,x,y,t,opened){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = '#7a4a24'; ctx.fillRect(-14,-10,28,18);
  const openA = opened ? 0.9 : 0.12 + 0.04*Math.sin(t/300);
  ctx.fillStyle = '#84552e'; ctx.save(); ctx.translate(0,-10); ctx.rotate(-openA); ctx.fillRect(-14,-6,28,6); ctx.restore();
  ctx.fillStyle = '#c9a86a'; ctx.fillRect(-2,-10,4,18);
  ctx.fillStyle = '#d9c27a'; ctx.fillRect(-2,2,4,6);
  ctx.fillStyle = '#a48a54'; ctx.fillRect(-1,6,2,4);
  ctx.restore();
}

export function drawBarrel(ctx,x,y,t){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = '#6b3b22'; ctx.beginPath(); ctx.ellipse(0,0,12,10,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#b08e5a'; ctx.fillRect(-12,-2,24,4);
  ctx.restore();
}

export function drawLamp(ctx,x,y,t){
  ctx.save(); ctx.translate(x,y);
  const pulse = 0.6 + 0.4*Math.abs(Math.sin(t/400));
  const g = ctx.createRadialGradient(0,0,2,0,0,24);
  g.addColorStop(0, `rgba(255,236,150,${0.35*pulse})`);
  g.addColorStop(1, 'rgba(255,236,150,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffea94'; ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

export function drawRock(ctx,x,y,t){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = '#7c7f8a'; ctx.beginPath(); ctx.ellipse(0,2,14,10,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(-6,-2,12,3); ctx.restore();
}

export function drawBookshelf(ctx,x,y,t){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = '#584031'; ctx.fillRect(-14,-14,28,28);
  ctx.fillStyle = '#d27f63'; ctx.fillRect(-12,-10,10,4);
  ctx.fillStyle = '#6bb1d6'; ctx.fillRect(0,-10,10,4);
  ctx.fillStyle = '#c7cf75'; ctx.fillRect(-12,-2,10,4);
  ctx.fillStyle = '#b47bd1'; ctx.fillRect(0,-2,10,4);
  ctx.restore();
}

export function drawStatue(ctx,x,y,t){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = '#b9b9c6'; ctx.fillRect(-6,0,12,10);
  ctx.beginPath(); ctx.arc(0,-6,8,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

export function drawSign(ctx,x,y,t){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-2,0,4,14);
  ctx.fillStyle = '#b38b5a'; ctx.fillRect(-14,-10,28,10);
  ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-8,-6,16,4);
  ctx.restore();
}


export function drawSignColor(ctx,x,y,t,color='#b38b5a'){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-2,0,4,14);
  ctx.fillStyle = color; ctx.fillRect(-14,-10,28,10);
  ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-8,-6,16,4);
  ctx.restore();
}
export function drawLever(ctx,x,y,t,on=false){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = '#555b6e'; ctx.fillRect(-12,-4,24,8); // base
  ctx.fillStyle = '#9aa0b3';
  ctx.save(); ctx.rotate(on ? -0.8 : 0.8);
  ctx.fillRect(-2,-16,4,18); // handle
  ctx.restore();
  ctx.fillStyle = on? '#4ade80' : '#ef4444'; ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

export const ItemRegistry = {
  Sign:      { draw:(c,x,y,t)=>drawSign(c,x,y,t) },
  Lamp:      { draw:(c,x,y,t)=>drawLamp(c,x,y,t) },
  Plant:     { draw:(c,x,y,t)=>drawPlant(c,x,y,t) },
  Barrel:    { draw:(c,x,y,t)=>drawBarrel(c,x,y,t) },
  Chest:     { draw:(c,x,y,t,open)=>drawChest(c,x,y,t,open) },
  Rock:      { draw:(c,x,y,t)=>drawRock(c,x,y,t) },
  Bookshelf: { draw:(c,x,y,t)=>drawBookshelf(c,x,y,t) },
  Statue:    { draw:(c,x,y,t)=>drawStatue(c,x,y,t) },
  SignStart: { draw:(c,x,y,t)=>drawSignColor(c,x,y,t,'#b38b5a') },
  SignRed:   { draw:(c,x,y,t)=>drawSignColor(c,x,y,t,'#ef4444') },
  SignGreen: { draw:(c,x,y,t)=>drawSignColor(c,x,y,t,'#22c55e') },
  Lever:     { draw:(c,x,y,t)=>drawLever(c,x,y,t) },
};
