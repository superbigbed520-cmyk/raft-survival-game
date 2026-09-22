// UI 系统：HUD、快捷栏、背包、合成、暂停
import { ITEMS, HOTBAR, RECIPES, CATS, canCraft, craft } from './crafting.js';
import { W, H, clamp } from './utils.js';

export class UI {
  constructor() {
    this.notifs = [];
    this.selSlot = 0;
  }

  toast(text) { this.notifs.push({ text, t: 3, a: 1 }); }

  update(dt) {
    this.notifs = this.notifs.filter(n => {
      n.t -= dt;
      if (n.t < 1) n.a = n.t;
      return n.t > 0;
    });
  }

  // ===== HUD =====
  renderHUD(ctx, player, dayNight) {
    ctx.save();
    // 状态
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(10,10,195,78);
    this._bar(ctx, 18, 18, player.hp,  '#e74c3c', `❤️ ${Math.floor(player.hp)}`);
    this._bar(ctx, 18, 38, player.hunger, '#e67e22', `🍖 ${Math.floor(player.hunger)}`);
    this._bar(ctx, 18, 58, player.thirst, '#3498db', `💧 ${Math.floor(player.thirst)}`);

    // 时间
    const ph = dayNight.phase();
    const icon = ph==='day'?'☀️ 白天':ph==='dusk'?'🌅 黄昏':'🌙 夜晚';
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(W/2-48,10,96,28);
    ctx.fillStyle='#fff'; ctx.font='14px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(icon, W/2, 24);

    // 提示
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(10,H-52,360,42);
    ctx.fillStyle='#ddd'; ctx.font='11px Arial'; ctx.textAlign='left';
    ctx.fillText('AD 移动 | W 跳跃/游泳 | F 钓鱼 | Q 使用 | TAB 背包', 18, H-38);
    ctx.fillText('B 建造 | E 工作台 | ESC 暂停 | 1-6 切换 | 点击拾取', 18, H-22);

    // 通知
    this.notifs.forEach((n,i) => {
      ctx.globalAlpha = n.a;
      ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(W/2-110, H-110-i*36, 220, 30);
      ctx.fillStyle='#fff'; ctx.font='13px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(n.text, W/2, H-95-i*36);
      ctx.globalAlpha = 1;
    });

    // 快捷栏
    this._hotbar(ctx, player);
    ctx.restore();
  }

  _bar(ctx, x, y, val, color, label) {
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(x,y,145,14);
    ctx.fillStyle=color; ctx.fillRect(x,y,val*1.45,14);
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1; ctx.strokeRect(x,y,145,14);
    ctx.fillStyle='#fff'; ctx.font='11px Arial'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(label, x+4, y+7);
  }

  _hotbar(ctx, player) {
    const sz=46, pad=4, n=6;
    const tw = n*(sz+pad)-pad, sx=(W-tw)/2, sy=H-sz-12;
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(sx-8,sy-8,tw+16,sz+16);
    for (let i=0;i<n;i++) {
      const x=sx+i*(sz+pad);
      ctx.fillStyle = i===this.selSlot ? '#2980b9' : '#2c3e50';
      ctx.fillRect(x,sy,sz,sz);
      ctx.strokeStyle = i===this.selSlot ? '#fff' : '#555';
      ctx.lineWidth = i===this.selSlot ? 2 : 1;
      ctx.strokeRect(x,sy,sz,sz);
      // 数字
      ctx.fillStyle='#777'; ctx.font='9px Arial'; ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText(String(i+1), x+2, sy+2);
      // 物品
      const id = HOTBAR[i];
      const amt = player.inv[id]||0;
      if (amt>0) {
        ctx.font='22px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(ITEMS[id].icon, x+sz/2, sy+sz/2+4);
        ctx.fillStyle='#fff'; ctx.font='bold 11px Arial'; ctx.textAlign='right'; ctx.textBaseline='bottom';
        ctx.fillText(String(amt), x+sz-3, sy+sz-3);
      }
    }
  }

  // ===== 背包 =====
  renderBag(ctx, player) {
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(0,0,W,H);
    const bx=W/2-200, by=H/2-180, bw=400, bh=360;
    ctx.fillStyle='#2c3e50'; ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle='#34495e'; ctx.lineWidth=3; ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle='#ecf0f1'; ctx.font='bold 22px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🎒 背包', W/2, by+30);

    // 格子
    const cols=5, rows=4, cs=58, cp=8;
    const gsx = bx+(bw-cols*(cs+cp))/2, gsy=by+55;
    const entries = Object.entries(player.inv).filter(([_,v])=>v>0);
    let idx=0;
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
      const x=gsx+c*(cs+cp), y=gsy+r*(cs+cp);
      ctx.fillStyle='#34495e'; ctx.fillRect(x,y,cs,cs);
      ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.strokeRect(x,y,cs,cs);
      if (idx<entries.length) {
        const [id, amt] = entries[idx];
        const def = ITEMS[id];
        if (def) {
          ctx.font='24px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(def.icon, x+cs/2, y+cs/2-4);
          ctx.fillStyle='#fff'; ctx.font='bold 11px Arial'; ctx.textAlign='right'; ctx.textBaseline='bottom';
          ctx.fillText(String(amt), x+cs-3, y+cs-3);
          ctx.fillStyle='#aaa'; ctx.font='9px Arial'; ctx.textAlign='center'; ctx.textBaseline='bottom';
          ctx.fillText(def.name, x+cs/2, y+cs-1);
        }
        idx++;
      }
    }
    ctx.fillStyle='#777'; ctx.font='12px Arial'; ctx.textAlign='center';
    ctx.fillText('TAB / ESC 关闭', W/2, by+bh-18);
    ctx.restore();
  }

  // ===== 合成 =====
  renderCraft(ctx, player, cat, recipeOffset) {
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(0,0,W,H);
    const ux=W/2-290, uy=H/2-210, uw=580, uh=420;
    ctx.fillStyle='#2c3e50'; ctx.fillRect(ux,uy,uw,uh);
    ctx.strokeStyle='#34495e'; ctx.lineWidth=3; ctx.strokeRect(ux,uy,uw,uh);
    ctx.fillStyle='#ecf0f1'; ctx.font='bold 22px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🔨 合成', W/2, uy+30);

    // 分类
    CATS.forEach((c,i) => {
      const tx=ux+20+i*75, ty=uy+50;
      ctx.fillStyle = c===cat ? '#2980b9' : '#555';
      ctx.fillRect(tx,ty,68,24);
      ctx.fillStyle='#fff'; ctx.font='12px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(c, tx+34, ty+12);
    });

    // 材料概览
    ctx.font='12px Arial'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle='#aaa';
    const mats = ['plank','plastic','rope','food','metal'];
    mats.forEach((m,i) => {
      ctx.fillText(`${ITEMS[m].icon}${player.inv[m]||0}`, ux+20+i*80, uy+92);
    });

    // 配方
    const filtered = cat==='全部' ? RECIPES : RECIPES.filter(r=>r.cat===cat);
    const startY = uy+115, ih=52, maxV=5;
    filtered.slice(recipeOffset, recipeOffset+maxV).forEach((r,i) => {
      const y = startY+i*ih;
      const ok = canCraft(r, player.inv);
      ctx.fillStyle = ok ? '#27ae60' : '#3a3f47';
      ctx.fillRect(ux+15, y, uw-30, ih-4);
      // 图标
      ctx.font='22px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(r.icon, ux+45, y+24);
      // 名称+描述
      ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.font='bold 13px Arial';
      ctx.fillText(r.name, ux+70, y+16);
      ctx.fillStyle='#aaa'; ctx.font='11px Arial';
      ctx.fillText(r.desc, ux+70, y+34);
      // 材料
      ctx.fillStyle = ok ? '#ddd' : '#e74c3c'; ctx.font='11px Arial';
      const need = Object.entries(r.need).map(([k,v])=>`${ITEMS[k].icon}${player.inv[k]||0}/${v}`).join('  ');
      ctx.fillText(need, ux+220, y+16);
      // 产出
      ctx.fillStyle='#2ecc71';
      const out = Object.entries(r.out).map(([k,v])=>`${ITEMS[k].icon}x${v}`).join(' ');
      ctx.fillText('→ '+out, ux+220, y+34);
      // 按钮
      if (ok) {
        ctx.fillStyle='#2ecc71'; ctx.fillRect(ux+uw-75,y+10,55,30);
        ctx.fillStyle='#fff'; ctx.font='13px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('合成', ux+uw-48, y+25);
      }
    });

    ctx.fillStyle='#777'; ctx.font='12px Arial'; ctx.textAlign='center';
    ctx.fillText('E / ESC 关闭 | A/D 切换分类 | W/S 滚动', W/2, uy+uh-16);
    ctx.restore();

    return { filtered, startY, ih, ux, uw };
  }

  handleCraftClick(mx, my, player, cat, recipeOffset) {
    const ux=W/2-290, uy=H/2-210, uw=580;
    // 分类
    if (my>=uy+50 && my<=uy+74) {
      for (let i=0;i<CATS.length;i++) {
        const tx=ux+20+i*75;
        if (mx>=tx && mx<=tx+68) return { action:'cat', value:CATS[i] };
      }
    }
    // 配方按钮
    const filtered = cat==='全部' ? RECIPES : RECIPES.filter(r=>r.cat===cat);
    const startY=uy+115, ih=52;
    for (let i=0;i<Math.min(filtered.length-recipeOffset, 5);i++) {
      const r = filtered[recipeOffset+i], y=startY+i*ih;
      if (mx>=ux+uw-75 && mx<=ux+uw-20 && my>=y+10 && my<=y+40) {
        if (canCraft(r, player.inv)) {
          craft(r, player.inv);
          return { action:'craft', value:r };
        }
      }
    }
    return null;
  }

  // ===== 暂停菜单 =====
  renderPause(ctx, sel) {
    const opts = ['▶️ 继续游戏','📖 合成图纸','🎮 操作说明','🚪 重新开始'];
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(0,0,W,H);
    const mx=W/2-140, my=H/2-130, mw=280, mh=260;
    ctx.fillStyle='#2c3e50'; ctx.fillRect(mx,my,mw,mh);
    ctx.strokeStyle='#34495e'; ctx.lineWidth=3; ctx.strokeRect(mx,my,mw,mh);
    ctx.fillStyle='#ecf0f1'; ctx.font='bold 26px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('⏸️ 暂停', W/2, my+35);
    opts.forEach((o,i) => {
      const y=my+80+i*42;
      if (i===sel) { ctx.fillStyle='#2980b9'; ctx.fillRect(mx+20,y-16,mw-40,34); }
      ctx.fillStyle = i===sel ? '#fff' : '#aaa';
      ctx.font='17px Arial'; ctx.textAlign='center';
      ctx.fillText(o, W/2, y);
    });
    ctx.fillStyle='#666'; ctx.font='11px Arial';
    ctx.fillText('W/S 选择 | Enter 确认', W/2, my+mh-18);
    ctx.restore();
    return opts;
  }
}
