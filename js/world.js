// 世界系统：木筏、漂浮物、昼夜
import { CELL, WATER_Y, W, H, rand, randInt, dist, clamp } from './utils.js';

// ===== 木筏 =====
export class Raft {
  constructor() {
    this.platforms = [];
    this.workbenches = [];
    // 初始 5 格
    const sx = W/2 - 2.5*CELL;
    for (let i=0; i<5; i++)
      this.platforms.push({ x: sx+i*CELL, y: 400, w: CELL, h: CELL });
  }

  addWorkbench(x, y) {
    this.workbenches.push({ x, y, w: 40, h: 40, open: false });
  }

  expand(dir) {
    const L = Math.min(...this.platforms.map(p=>p.x));
    const R = Math.max(...this.platforms.map(p=>p.x+p.w));
    const T = Math.min(...this.platforms.map(p=>p.y));
    const B = Math.max(...this.platforms.map(p=>p.y));

    if (dir==='left') {
      const bottom = this.platforms.filter(p=>p.y===B);
      bottom.forEach(p => this.platforms.push({x:p.x-CELL, y:p.y, w:CELL, h:CELL}));
      return true;
    }
    if (dir==='right') {
      const bottom = this.platforms.filter(p=>p.y===B);
      bottom.forEach(p => this.platforms.push({x:p.x+CELL, y:p.y, w:CELL, h:CELL}));
      return true;
    }
    if (dir==='up') {
      // 在有支撑的位置上方添加一层
      const minX = Math.min(...this.platforms.map(p=>p.x));
      const maxX = Math.max(...this.platforms.map(p=>p.x+p.w));
      for (let x=minX; x<maxX; x+=CELL) {
        const has = this.platforms.some(p=>p.x===x && p.y===T);
        if (has) this.platforms.push({x, y:T-CELL, w:CELL, h:CELL});
      }
      return true;
    }
    return false;
  }

  expandSlots(px, py) {
    const L = Math.min(...this.platforms.map(p=>p.x));
    const R = Math.max(...this.platforms.map(p=>p.x+p.w));
    const T = Math.min(...this.platforms.map(p=>p.y));
    const B = Math.max(...this.platforms.map(p=>p.y));
    const slots = [];
    if (px < L + CELL*3)  slots.push({ x:L-CELL, y:B, dir:'left' });
    if (px > R - CELL*3)  slots.push({ x:R,     y:B, dir:'right' });
    if (py < T + CELL*3)  slots.push({ x:px-CELL/2, y:T-CELL, dir:'up' });
    return slots;
  }

  render(ctx) {
    // 海水
    ctx.fillStyle = '#2980b9'; ctx.fillRect(0, WATER_Y, W, H-WATER_Y);
    // 波浪
    ctx.strokeStyle = 'rgba(52,152,219,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x=0; x<=W; x+=15) {
      const y = WATER_Y + Math.sin((x+Date.now()/600)/25)*4;
      x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();

    // 平台
    for (const p of this.platforms) {
      ctx.fillStyle = '#8B4513'; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#5D3A1A'; ctx.lineWidth = 2; ctx.strokeRect(p.x+1, p.y+1, p.w-2, p.h-2);
      ctx.strokeStyle = '#6B3410'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x+4, p.y+p.h/3); ctx.lineTo(p.x+p.w-4, p.y+p.h/3);
      ctx.moveTo(p.x+4, p.y+p.h*2/3); ctx.lineTo(p.x+p.w-4, p.y+p.h*2/3);
      ctx.stroke();
    }

    // 工作台
    for (const wb of this.workbenches) {
      ctx.fillStyle = '#A0522D'; ctx.fillRect(wb.x, wb.y, wb.w, wb.h);
      ctx.strokeStyle = '#5D3A1A'; ctx.lineWidth = 2; ctx.strokeRect(wb.x, wb.y, wb.w, wb.h);
      ctx.font = '22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🔨', wb.x+wb.w/2, wb.y+wb.h/2);
    }
  }
}

// ===== 漂浮物 =====
const DROP_TYPES = [
  { type:'plank',   name:'木板', color:'#8B4513', shape:'rect',    icon:'🪵', weight:35 },
  { type:'plastic', name:'塑料', color:'#3498db', shape:'tri',     icon:'📦', weight:25 },
  { type:'rope',    name:'绳子', color:'#f39c12', shape:'ring',    icon:'🧵', weight:15 },
  { type:'food',    name:'食物', color:'#e74c3c', shape:'star',    icon:'🍖', weight:15 },
  { type:'metal',   name:'金属', color:'#95a5a6', shape:'diamond', icon:'⚙️', weight:7  },
  { type:'chest',   name:'宝箱', color:'#f1c40f', shape:'box',     icon:'🎁', weight:3  },
];

function pickType() {
  const total = DROP_TYPES.reduce((s,d)=>s+d.weight, 0);
  let r = Math.random() * total;
  for (const d of DROP_TYPES) { r -= d.weight; if (r<=0) return d; }
  return DROP_TYPES[0];
}

class Drop {
  constructor(def) {
    this.def = def;
    this.size = def.type==='chest' ? 22 : 16;
    this.bob = rand(0, Math.PI*2);
    this.life = 40;
    this.collected = false;
    this.collectT = 0;
  }

  update(dt, player) {
    if (this.collected) {
      this.collectT += dt*4;
      const tx = player.x+player.w/2, ty = player.y+player.h/2;
      this.x += (tx-this.x)*this.collectT*0.15;
      this.y += (ty-this.y)*this.collectT*0.15;
      return this.collectT < 1;
    }
    this.x += this.vx * dt;
    this.y += Math.sin(Date.now()/600 + this.bob) * 0.3;
    this.life -= dt;
    return this.life > 0 && this.x > -40 && this.x < W+40;
  }

  hit(mx, my) {
    return !this.collected && dist(mx,my,this.x,this.y) < this.size+12;
  }

  collect(player) {
    this.collected = true; this.collectT = 0;
    // 宝箱特殊处理
    if (this.def.type === 'chest') {
      player.inv.plank += randInt(3,5);
      player.inv.rope  += randInt(1,2);
      if (Math.random()>0.5) player.inv.metal += 1;
      return 'chest';
    }
    player.inv[this.def.type] = (player.inv[this.def.type]||0) + 1;
    return this.def.type;
  }

  render(ctx) {
    if (this.collected) ctx.globalAlpha = 1 - this.collectT;
    else if (this.life < 5) ctx.globalAlpha = (Math.sin(Date.now()/100)+1)/2;

    const d = this.def, cx=this.x, cy=this.y, s=this.size;
    ctx.fillStyle = d.color; ctx.strokeStyle='#fff'; ctx.lineWidth=2;
    switch(d.shape) {
      case 'rect': ctx.fillRect(cx-s, cy-s/2, s*2, s); ctx.strokeRect(cx-s, cy-s/2, s*2, s); break;
      case 'tri': ctx.beginPath(); ctx.moveTo(cx,cy-s); ctx.lineTo(cx+s,cy+s); ctx.lineTo(cx-s,cy+s); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'ring': ctx.beginPath(); ctx.arc(cx,cy,s/2,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx,cy,s/3,0,Math.PI*2); ctx.fill(); break;
      case 'star': ctx.beginPath(); for(let i=0;i<5;i++){const a=i*4*Math.PI/5-Math.PI/2; const px=cx+Math.cos(a)*s/2, py=cy+Math.sin(a)*s/2; i?ctx.lineTo(px,py):ctx.moveTo(px,py);} ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'diamond': ctx.beginPath(); ctx.moveTo(cx,cy-s); ctx.lineTo(cx+s,cy); ctx.lineTo(cx,cy+s); ctx.lineTo(cx-s,cy); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'box': ctx.fillRect(cx-s,cy-s*0.7,s*2,s*1.4); ctx.strokeRect(cx-s,cy-s*0.7,s*2,s*1.4); ctx.fillStyle='#8B4513'; ctx.fillRect(cx-2,cy-s*0.7,4,s*1.4); break;
    }
    ctx.font='14px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff';
    ctx.fillText(d.icon, cx, cy);
    ctx.globalAlpha = 1;
  }
}

export class ItemSpawner {
  constructor() { this.drops = []; this.timer = 0; }

  update(dt, player) {
    this.timer += dt;
    if (this.timer > 2) { this.timer = 0; this.spawn(); }
    this.drops = this.drops.filter(d => d.update(dt, player));
  }

  spawn() {
    const def = pickType();
    const d = new Drop(def);
    const fromLeft = Math.random()>0.5;
    d.x = fromLeft ? -30 : W+30;
    d.y = WATER_Y + rand(-8, 18);
    d.vx = (fromLeft?1:-1) * rand(25, 55);
    this.drops.push(d);
  }

  click(mx, my, player) {
    for (const d of this.drops) {
      if (d.hit(mx, my)) return d.collect(player);
    }
    return null;
  }

  render(ctx) { this.drops.forEach(d => d.render(ctx)); }
}

// ===== 昼夜 =====
export class DayNight {
  constructor() { this.t = 0; this.period = 120; }
  update(dt) { this.t = (this.t + dt) % this.period; }
  phase() { return this.t<60 ? 'day' : this.t<80 ? 'dusk' : 'night'; }

  render(ctx) {
    const ph = this.phase();
    const g = ctx.createLinearGradient(0,0,0,H);
    if (ph==='day')  { g.addColorStop(0,'#87CEEB'); g.addColorStop(1,'#4a90a4'); }
    if (ph==='dusk') { g.addColorStop(0,'#FF7F50'); g.addColorStop(1,'#c0392b'); }
    if (ph==='night'){ g.addColorStop(0,'#0c1445'); g.addColorStop(1,'#191970'); }
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // 太阳/月亮
    if (ph !== 'night') {
      const sx = W*(1-this.t/this.period*2), sy = 50+Math.sin(this.t/this.period*Math.PI)*25;
      ctx.fillStyle='#f1c40f'; ctx.beginPath(); ctx.arc(sx,sy,28,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(241,196,15,0.25)'; ctx.beginPath(); ctx.arc(sx,sy,45,0,Math.PI*2); ctx.fill();
    } else {
      const mx = W*(1-(this.t-80)/40), my=55;
      ctx.fillStyle='#ecf0f1'; ctx.beginPath(); ctx.arc(mx,my,22,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#0c1445'; ctx.beginPath(); ctx.arc(mx+7,my-4,19,0,Math.PI*2); ctx.fill();
    }
    // 星星
    if (ph==='night') {
      ctx.fillStyle='#fff';
      for (let i=0;i<40;i++) {
        const sx=(i*137+50)%W, sy=(i*97+30)%(H/2);
        ctx.beginPath(); ctx.arc(sx,sy,1+Math.sin(Date.now()/500+i)*0.5,0,Math.PI*2); ctx.fill();
      }
    }
    // 叠加
    if (ph==='dusk')  { ctx.fillStyle='rgba(255,100,0,0.15)'; ctx.fillRect(0,0,W,H); }
    if (ph==='night') { ctx.fillStyle='rgba(0,0,50,0.4)';  ctx.fillRect(0,0,W,H); }
  }
}
