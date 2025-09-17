// engine.js
import { ItemRegistry, drawLamp, drawPlant, drawBarrel, drawChest, drawRock, drawBookshelf, drawStatue, drawSign } from './items.js';
import { setupPuzzles, handlePropInteraction } from './puzzles.js';

const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const msg = document.getElementById('msg');

let TILE = 48;
let COLS=0, ROWS=0;

const door = {tx:0, ty:0, closed:true};
const doorFront = {tx:0, ty:0};
const key = {tx:2,ty:2,found:false, visible:false};

const player = {x: 2.5, y: 2.5, r: 11, speed: 0.9}; // x,y in px after init
const held = {up:false,down:false,left:false,right:false};

let map = [];
let props = [];
let generic = ["Nope.", "Just dust.", "Try somewhere else."];
let hints = { Door: ["Locked tight. You'll need a key."] };

// ---- helpers ----
function say(s){ msg.textContent = s; }
function randInt(a,b){ return Math.floor(a+Math.random()*(b-a+1)); }
function sayRand(arr){ say(arr[randInt(0,arr.length-1)]); }

// public context for items/puzzles
const ctxAPI = {
  say, sayRand, generic, hints,
  state: { seqActive:false, seqIndex:0 },
  puzzle: null,
};

ctxAPI.setDoorClosed = (b)=>{ door.closed = !!b; };

// ---- sizing ----
function fit(){
  const vw = window.innerWidth, vh = window.innerHeight;
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  canvas.width = Math.round(vw * DPR);
  canvas.height = Math.round(vh * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  COLS = Math.max(9, Math.floor(canvas.width / DPR / TILE));
  ROWS = Math.max(13, Math.floor(canvas.height / DPR / TILE));
}
window.addEventListener('resize', fit, {passive:true});

// ---- map ----
function buildMap(density=1){
  map = Array.from({length:ROWS}, (_,y)=>
    Array.from({length:COLS}, (_,x)=> (x===0||y===0||x===COLS-1||y===ROWS-1)?1:0)
  );
  for(let y=2;y<ROWS-2;y+=2){
    for(let x=2;x<COLS-2;x+=randInt(4,6)){
      const len = randInt(2,4)*density;
      for(let k=0;k<len;k++) map[y][Math.min(COLS-2, x+k)] = 1;
    }
  }
}

function setupDoor(side="east", ty="mid", locked=true){
  let row = (ty==="mid") ? Math.floor(ROWS/2) : Math.max(1, Math.min(ROWS-2, parseInt(ty||Math.floor(ROWS/2))));
  if(side==="east"){ door.tx = COLS-1; door.ty = row; }
  else if(side==="west"){ door.tx = 0; door.ty = row; }
  else if(side==="north"){ door.tx = Math.floor(COLS/2); door.ty = 0; }
  else { door.tx = Math.floor(COLS/2); door.ty = ROWS-1; }
  door.closed = locked;
  // front tile (where player stands to interact); handle only east for simplicity
  if(side==="east"){ doorFront.tx = COLS-2; doorFront.ty = door.ty; }
  else if(side==="west"){ doorFront.tx = 1; doorFront.ty = door.ty; }
  else if(side==="north"){ doorFront.tx = door.tx; doorFront.ty = 1; }
  else { doorFront.tx = door.tx; doorFront.ty = ROWS-2; }
}

function tileAt(x,y){
  const tx = Math.floor(x/TILE), ty = Math.floor(y/TILE);
  const isDoor = (tx===door.tx && ty===door.ty && door.closed);
  return {tx,ty,solid: map[ty]?.[tx]===1 || isDoor};
}

function collideAndMove(px,py,vx,vy){
  let nx=px+vx, ny=py+vy;
  const samples = [[0,0],[player.r,0],[-player.r,0],[0,player.r],[0,-player.r]];
  for(const [sx,sy] of samples){
    const t = tileAt(nx+sx,ny+sy);
    if(t.solid){
      const tL=t.tx*TILE, tR=(t.tx+1)*TILE, tT=t.ty*TILE, tB=(t.ty+1)*TILE;
      if(px < tL) nx = tL - player.r; else if(px > tR) nx = tR + player.r;
      if(py < tT) ny = tT - player.r; else if(py > tB) ny = tB + player.r;
    }
  }
  return {x:nx,y:ny};
}

// ---- props ----
function canPlace(tx,ty){
  return map[ty] && map[ty][tx]===0 && !props.some(p=>p.tx===tx&&p.ty===ty) && !(tx===doorFront.tx && ty===doorFront.ty);
}

function populateProps({autoCountFactor=0.12, ensure=[]}={}){
  props.length=0;
  const count = Math.floor((COLS*ROWS)*autoCountFactor);
  for(let i=0;i<count;i++){
    let tries=0, tx,ty;
    do{ tx=randInt(2,COLS-3); ty=randInt(2,ROWS-3); tries++; } while(!canPlace(tx,ty) && tries<300);
    if(tries<300){
      const keys = Object.keys(ItemRegistry);
      const type = keys[randInt(0, keys.length-1)];
      props.push({tx,ty,name:type});
    }
  }
  ensure.forEach(name=>{
    if(!props.some(p=>p.name===name)){
      let tx,ty; do{ tx=randInt(2,COLS-3); ty=randInt(2,ROWS-3);} while(!canPlace(tx,ty));
      props.push({tx,ty,name:name});
    }
  });
}

function placeKey(spawnLogic="far"){
  do { key.tx=randInt(2,COLS-3); key.ty=randInt(2,ROWS-3); }
  while(!canPlace(key.tx,key.ty) || (spawnLogic==="far" && (key.tx+key.ty)<Math.floor((COLS+ROWS)/2)));
}

// ---- draw ----
function drawTilemap(){
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      if(map[y][x]===1){
        ctx.fillStyle = '#152041';
        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
      } else {
        ctx.fillStyle = ( (x+y)%2===0 ? '#0d1732' : '#0f1b3a');
        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
      }
    }
  }
  // door
  const dx = door.tx*TILE, dy = door.ty*TILE;
  ctx.fillStyle = door.closed ? '#6b4b2a' : '#2f6b3a';
  ctx.fillRect(dx-8, dy+4, 16, TILE-8);
  ctx.fillStyle = '#d2b879'; ctx.fillRect(dx-1, dy+TILE/2, 2, 4);
}

function drawKey(t){
  if(!key.visible || key.found) return;
  const kx = key.tx*TILE + TILE/2, ky = key.ty*TILE + TILE/2;
  ctx.save(); ctx.translate(kx,ky);
  const bob = Math.sin(t/300)*2; ctx.translate(0,bob);
  ctx.rotate((t/600)% (Math.PI*2));
  const g = ctx.createRadialGradient(0,0,2,0,0,26);
  g.addColorStop(0,'rgba(255,215,90,0.5)'); g.addColorStop(1,'rgba(255,215,90,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,26,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(-2,-8,4,16); ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPlayer(t){
  ctx.save(); ctx.translate(player.x, player.y);
  const bob = Math.sin(t/200)*1.0; ctx.translate(0,bob);
  ctx.fillStyle = '#90cdf4'; ctx.beginPath(); ctx.arc(0,0,player.r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(5,-2,2.5,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

// ---- interactions ----
function tryInteract(){
  const px = player.x, py = player.y;
  // key
  if(key.visible && !key.found){
    const kx = key.tx*TILE + TILE/2, ky = key.ty*TILE + TILE/2;
    if(Math.hypot(px-kx,py-ky) < TILE*0.8){ key.found=true; say('🔑 Got the key! The door might open now.'); return; }
  }
  // door
  if(Math.floor(px/TILE)===doorFront.tx && Math.floor(py/TILE)===doorFront.ty){
    if(!key.found){ sayRand(hints.Door); return; }
    door.closed=false; say('🚪 The door swings open! Walk through to escape.'); return;
  }
  // nearest prop
  let nearest=null,best=Infinity;
  for(const p of props){
    const x = p.tx*TILE+TILE/2, y=p.ty*TILE+TILE/2; const d=Math.hypot(px-x,py-y);
    if(d<best){ best=d; nearest=p; }
  }
  if(nearest && best < TILE*1.2){
    handlePropInteraction({ctx:ctxAPI, prop:nearest, key, placeKey, setDoorClosed: ctxAPI.setDoorClosed});
  } else { sayRand(generic); }
}

function interactAt(mx,my){
  const tx = Math.floor(mx/TILE), ty = Math.floor(my/TILE);
  if(tx===doorFront.tx && ty===doorFront.ty){
    if(!key.found){ sayRand(hints.Door); return; }
    door.closed=false; say('🚪 The door swings open! Walk through to escape.'); return;
  }
  const p = props.find(o=>o.tx===tx && o.ty===ty);
  if(p){ return handlePropInteraction({ctx:ctxAPI, prop:p, key, placeKey, setDoorClosed: ctxAPI.setDoorClosed}); }
  if(key.visible && !key.found && tx===key.tx && ty===key.ty){ key.found=true; say('🔑 Got the key! The door might open now.'); return; }
  sayRand(generic);
}

// ---- input ----
document.querySelectorAll('.pad button').forEach(btn=>{
  const handlePad=(on)=>{
    const dx = parseInt(btn.dataset.dx||'0',10);
    const dy = parseInt(btn.dataset.dy||'0',10);
    if(dx<0) held.left=on; if(dx>0) held.right=on;
    if(dy<0) held.up=on; if(dy>0) held.down=on;
  };
  btn.addEventListener('pointerdown', e=>{ e.preventDefault(); handlePad(true); btn.setPointerCapture(e.pointerId); });
  btn.addEventListener('pointerup',   ()=> handlePad(false));
  btn.addEventListener('pointercancel',()=> handlePad(false));
  btn.addEventListener('pointerout', ()=> handlePad(false));
});
document.getElementById('btnE').addEventListener('click',()=>tryInteract());
document.getElementById('btnR').addEventListener('click',()=>restart());
canvas.addEventListener('pointerdown', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
  interactAt(mx,my);
});

// ---- loop ----
function step(t=0){
  let vx=0,vy=0;
  if(held.left) vx-=player.speed;
  if(held.right) vx+=player.speed;
  if(held.up) vy-=player.speed;
  if(held.down) vy+=player.speed;
  if(vx&&vy){ vx*=Math.SQRT1_2; vy*=Math.SQRT1_2; }
  const m = collideAndMove(player.x,player.y,vx,vy);
  player.x=m.x; player.y=m.y;
  // auto pick key
  if(key.visible && !key.found){
    const kx = key.tx*TILE + TILE/2, ky = key.ty*TILE + TILE/2;
    if(Math.hypot(player.x-kx, player.y-ky) < TILE*0.6){ key.found=true; say('🔑 Got the key! The door might open now.'); }
  }
  // draw
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawTilemap();
  // props
  for(const p of props){
    const cx = p.tx*TILE + TILE/2, cy = p.ty*TILE + TILE/2;
    const item = ItemRegistry[p.name];
    if(p.name==='Chest') item.draw(ctx, cx,cy,t, Math.hypot(player.x-cx,player.y-cy)<TILE);
    else item.draw(ctx, cx,cy,t);
  }
  drawKey(t);
  // player
  drawPlayer(t);

  // win
  if(!door.closed){
    const atExit = Math.floor(player.x/TILE)===door.tx && Math.floor(player.y/TILE)===door.ty;
    if(atExit){
      ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#e6f3ff'; ctx.font='700 22px system-ui,Segoe UI,Roboto,Arial';
      ctx.fillText('🎉 Escaped! Tap R to play again.', 18, 48);
    }
  }

  requestAnimationFrame(step);
}

// ---- level loading ----
async function loadLevel(url='./levels/level1.json'){
  const data = await fetch(url).then(r=>r.json());
  TILE = data.tile ?? TILE;
  fit();
  buildMap(data.maze?.density ?? 1);
  setupDoor(data.door?.side ?? 'east', data.door?.ty ?? 'mid', data.door?.locked ?? true);

  player.speed = data.player?.speed ?? player.speed;
  const sx = (data.player?.start?.[0] ?? 2.5), sy = (data.player?.start?.[1] ?? 2.5);
  player.x = sx * TILE; player.y = sy * TILE;

  // phrases
  const lang = await fetch('./phrases/en.json').then(r=>r.json()).catch(()=>({}));
  generic = lang.generic ?? generic;
  hints   = lang.hints   ?? hints;
  // level overrides
  generic = data.phrases?.generic ?? generic;
  hints   = data.phrases?.hints   ?? hints;
  // update ctxAPI pointers
  ctxAPI.generic = generic; ctxAPI.hints = hints;

  // puzzle
  ctxAPI.puzzle = data.puzzle || null;
  ctxAPI.state.seqActive=false; ctxAPI.state.seqIndex=0;
  setupPuzzles(ctxAPI); // allow puzzle module to init if needed

  // props
  populateProps({
    autoCountFactor: data.props?.autoCountFactor ?? 0.12,
    ensure: data.props?.ensure ?? []
  });

  // key
  key.visible = data.key?.visible ?? false;
  key.found=false;
  placeKey(data.puzzle?.onComplete?.spawnKey ?? 'far');

  say(data.startMessage ?? 'Read the sign for instructions.');
}

function restart(){
  loadLevel('./levels/level1.json');
}

window.restart = restart; // for button
fit();
loadLevel().then(()=> step());
