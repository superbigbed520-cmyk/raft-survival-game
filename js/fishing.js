// 钓鱼系统
import { WATER_Y, W, H, rand, clamp } from './utils.js';

export class Fishing {
  constructor() {
    this.state = 'idle'; // idle | charge | cast | wait | bite | reel
    this.charge = 0;
    this.line = 0;
    this.hx = 0; this.hy = 0;
    this.timer = 0;
    this.cooldown = 0;
    this.reward = null; // 暂存奖励
  }

  update(dt, input, player) {
    if (this.cooldown > 0) { this.cooldown -= dt; return; }

    switch (this.state) {
      case 'idle':
        if (input.fish) { this.state='charge'; this.charge=0; }
        break;

      case 'charge':
        this.charge = clamp(this.charge + dt*110, 0, 100);
        if (!input.fish) {
          this.state='cast';
          this.hx = player.x + player.w/2;
          this.hy = player.y + player.h;
          this.line = 0;
        }
        break;

      case 'cast':
        this.line += 220*dt;
        this.hy = player.y + player.h + this.line;
        if (this.line >= (this.charge/100)*180 + 40) {
          this.state='wait';
          this.timer = rand(1.5, 5);
        }
        break;

      case 'wait':
        this.timer -= dt;
        this.hx = player.x + player.w/2 + Math.sin(Date.now()/300)*4;
        if (this.timer <= 0) { this.state='bite'; this.timer = 0.8; }
        break;

      case 'bite':
        this.timer -= dt;
        this.hx = player.x + player.w/2 + Math.sin(Date.now()/80)*10;
        if (this.timer <= 0) {
          this.state='idle'; this.cooldown = 1.5;
        } else if (input.fish) {
          this.state='reel';
          // 计算奖励
          const rarity = this.charge>80?'rare':this.charge>50?'uncommon':'common';
          this.reward = { rarity, charge: this.charge };
        }
        break;

      case 'reel':
        this.line -= 350*dt;
        this.hy = player.y + player.h + Math.max(0, this.line);
        if (this.line <= 0) {
          this.state='idle';
          this.cooldown = 1.5;
          this.charge = 0;
          // reward 由 game.js 读取后清除
        }
        break;
    }
  }

  // 读取奖励（读一次就清空，防止重复）
  getReward() {
    const r = this.reward;
    this.reward = null;
    return r;
  }

  render(ctx, player) {
    if (this.state==='idle') return;
    ctx.save();
    const px = player.x+player.w/2, py = player.y+player.h;

    // 鱼竿
    ctx.strokeStyle='#8B4513'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(px, py-12); ctx.lineTo(px+22, py-25); ctx.stroke();
    // 鱼线
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(px+22, py-25); ctx.lineTo(this.hx, this.hy); ctx.stroke();
    // 鱼钩
    ctx.fillStyle='#ccc'; ctx.beginPath(); ctx.arc(this.hx, this.hy, 4, 0, Math.PI*2); ctx.fill();

    // 蓄力条
    if (this.state==='charge') {
      ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(px-28, py-55, 56, 10);
      ctx.fillStyle = this.charge>80?'#2ecc71':this.charge>50?'#f1c40f':'#e74c3c';
      ctx.fillRect(px-26, py-53, (this.charge/100)*52, 6);
    }
    // 咬钩提示
    if (this.state==='bite') {
      ctx.fillStyle='#f1c40f'; ctx.font='bold 26px Arial'; ctx.textAlign='center';
      ctx.fillText('!', this.hx, this.hy-20);
      ctx.font='13px Arial'; ctx.fillStyle='#fff';
      ctx.fillText('按 F 收杆!', this.hx, this.hy-42);
    }
    ctx.restore();
  }
}
