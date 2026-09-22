// 玩家系统
import { CELL, WATER_Y, W, H, clamp } from './utils.js';

export class Player {
  constructor(raft) {
    this.raft = raft;
    this.x = 380; this.y = 340;
    this.w = 24; this.h = 32;
    this.vx = 0; this.vy = 0;
    this.speed = 180; this.jumpV = -360; this.gravity = 750;
    this.grounded = false; this.inWater = false;
    this.face = 1; // 1=right, -1=left
    this.hp = 100; this.hunger = 100; this.thirst = 100;
    this.inv = { plank:0, plastic:0, rope:0, food:0, metal:0, chest:0,
                 water:0, bandage:0, cooked:0, rod:0, spear:0, hammer:0,
                 shelter:0, campfire:0, box:0, purifier:0 };
    this.anim = 0;
  }

  update(dt, input) {
    // 水平
    const spd = this.inWater ? 130 : this.speed;
    this.vx = 0;
    if (input.left)  { this.vx = -spd; this.face = -1; }
    if (input.right) { this.vx =  spd; this.face =  1; }

    // 跳跃 / 游泳上浮
    if (input.jump) {
      if (this.grounded) { this.vy = this.jumpV; this.grounded = false; }
      else if (this.inWater) { this.vy = -140; }
    }

    // 重力 / 浮力
    if (this.inWater) {
      this.vy += this.gravity * 0.3 * dt;
      this.vy *= 0.94; this.vx *= 0.97;
      this.vy = clamp(this.vy, -150, 70);
    } else if (!this.grounded) {
      this.vy += this.gravity * dt;
    }

    // 位移
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 水面
    this.inWater = (this.y + this.h) > WATER_Y;

    // 平台碰撞
    this.grounded = false;
    for (const p of this.raft.platforms) {
      if (this.x + this.w > p.x && this.x < p.x + p.w &&
          this.y + this.h >= p.y && this.y + this.h <= p.y + 18 && this.vy >= 0) {
        this.y = p.y - this.h;
        this.vy = 0;
        this.grounded = true;
        this.inWater = false;
      }
    }

    // 边界
    this.x = clamp(this.x, 0, W - this.w);
    if (this.y > H) this.y = H;

    // 生存属性
    this.hunger = clamp(this.hunger - dt * 0.4, 0, 100);
    this.thirst = clamp(this.thirst - dt * 0.5, 0, 100);
    if (this.hunger <= 0 || this.thirst <= 0) this.hp = clamp(this.hp - dt * 3, 0, 100);

    this.anim += dt;
  }

  useItem(id) {
    const def = { food:{s:'hunger',v:25}, water:{s:'thirst',v:25},
                  bandage:{s:'hp',v:30}, cooked:{s:'hunger',v:40} };
    const d = def[id];
    if (!d || (this.inv[id]||0) <= 0) return null;
    this.inv[id]--;
    if (d.s==='hunger') this.hunger = clamp(this.hunger + d.v, 0, 100);
    if (d.s==='thirst') this.thirst = clamp(this.thirst + d.v, 0, 100);
    if (d.s==='hp')     this.hp     = clamp(this.hp + d.v, 0, 100);
    return d.s;
  }

  render(ctx) {
    ctx.save();
    const cx = this.x + this.w/2;
    if (this.face < 0) { ctx.translate(this.x + this.w, this.y); ctx.scale(-1,1); }
    else ctx.translate(this.x, this.y);

    // 水花
    if (this.inWater) {
      ctx.fillStyle = 'rgba(52,152,219,0.35)';
      ctx.beginPath(); ctx.ellipse(12, 28, 16, 8, 0, 0, Math.PI*2); ctx.fill();
    }

    // 身体
    ctx.fillStyle = '#e74c3c'; ctx.fillRect(4, 10, 16, 16);
    // 头
    ctx.fillStyle = '#f5cba7'; ctx.fillRect(6, 0, 12, 13);
    // 眼
    ctx.fillStyle = '#fff'; ctx.fillRect(14, 3, 5, 5);
    ctx.fillStyle = '#000'; ctx.fillRect(16, 4, 2, 3);
    // 腿
    ctx.fillStyle = '#2c3e50';
    const lo = (this.grounded && this.vx) ? Math.sin(this.anim*10)*3 : 0;
    const swim = this.inWater ? Math.sin(this.anim*7)*4 : 0;
    ctx.fillRect(6, 26, 5, 6 + lo + swim);
    ctx.fillRect(13, 26, 5, 6 - lo - swim);
    // 手
    ctx.fillStyle = '#f5cba7';
    const ao = this.inWater ? Math.sin(this.anim*7)*5 : (this.vx ? Math.sin(this.anim*10)*3 : 0);
    ctx.fillRect(0, 13+ao, 5, 4);
    ctx.fillRect(19, 13-ao, 5, 4);

    ctx.restore();
  }
}
