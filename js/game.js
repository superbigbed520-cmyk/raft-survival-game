// 游戏主类
import { W, H, CELL, WATER_Y, clamp, dist } from './utils.js';
import { Player } from './player.js';
import { Raft, ItemSpawner, DayNight } from './world.js';
import { Fishing } from './fishing.js';
import { UI } from './ui.js';
import { ITEMS, HOTBAR, RECIPES, CATS, canCraft, craft } from './crafting.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'playing'; // playing | paused | craft | bag | building
    this.buildSub = null;   // null | 'raft' | 'workbench'
    this.buildDir = null;

    // 子系统
    this.raft = new Raft();
    this.player = new Player(this.raft);
    this.spawner = new ItemSpawner();
    this.dayNight = new DayNight();
    this.fishing = new Fishing();
    this.ui = new UI();

    // 输入
    this.keys = {};
    this.mouse = { x: 0, y: 0, clicked: false };
    this._input = { left:0, right:0, jump:0, fish:0 };
    this._prevKeys = {};

    // 合成UI状态
    this.craftCat = '全部';
    this.craftOffset = 0;
    this.pauseSel = 0;

    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      if (k === 'tab') e.preventDefault();
      this._keyPressed(k);
    });
    window.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
    this.canvas.addEventListener('mousemove', e => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top;
    });
    this.canvas.addEventListener('click', () => this._click());
  }

  _keyPressed(k) {
    switch (this.state) {
      case 'playing':
        if (k==='escape') { this.state='paused'; this.pauseSel=0; }
        if (k==='tab')    { this.state='bag'; }
        if (k==='b')      { this.state='building'; this.buildSub=null; this.ui.toast('🔨 建造模式'); }
        if (k==='e') {
          for (const wb of this.raft.workbenches) {
            if (dist(this.player.x+12, this.player.y+16, wb.x+20, wb.y+20) < 70) {
              this.state='craft'; this.craftCat='全部'; this.craftOffset=0;
              return;
            }
          }
          this.ui.toast('附近没有工作台');
        }
        if (k>='1' && k<='6') this.ui.selSlot = +k - 1;
        if (k==='q') {
          const id = HOTBAR[this.ui.selSlot];
          const def = ITEMS[id];
          if (def && def.usable) {
            const r = this.player.useItem(id);
            if (r==='hunger') this.ui.toast('🍖 饱食度提升!');
            if (r==='thirst') this.ui.toast('💧 口渴度提升!');
            if (r==='hp')     this.ui.toast('❤️ 生命恢复!');
          }
        }
        break;

      case 'paused':
        if (k==='escape') this.state='playing';
        if (k==='w') this.pauseSel = (this.pauseSel+3)%4;
        if (k==='s') this.pauseSel = (this.pauseSel+1)%4;
        if (k==='enter'||k===' ') {
          const acts = ['resume','recipes','help','restart'];
          const a = acts[this.pauseSel];
          if (a==='resume') this.state='playing';
          if (a==='recipes') { this.state='craft'; this.craftCat='全部'; this.craftOffset=0; }
          if (a==='help') { this.ui.toast('看底部操作提示'); this.state='playing'; }
          if (a==='restart') location.reload();
        }
        break;

      case 'craft':
        if (k==='escape'||k==='e') this.state='playing';
        if (k==='a') { const i=CATS.indexOf(this.craftCat); this.craftCat=CATS[(i-1+CATS.length)%CATS.length]; this.craftOffset=0; }
        if (k==='d') { const i=CATS.indexOf(this.craftCat); this.craftCat=CATS[(i+1)%CATS.length]; this.craftOffset=0; }
        if (k==='w') this.craftOffset = Math.max(0, this.craftOffset-1);
        if (k==='s') this.craftOffset += 1;
        break;

      case 'bag':
        if (k==='escape'||k==='tab') this.state='playing';
        break;

      case 'building':
        if (k==='escape'||k==='b') { this.state='playing'; this.buildSub=null; }
        if (k==='w') { this.buildSub='workbench'; this.ui.toast('点击放置工作台(木板10+金属2)'); }
        if (k==='r') { this.buildSub='raft'; this.ui.toast('点击绿色区域扩建(木板1)'); }
        break;
    }
  }

  _click() {
    const mx=this.mouse.x, my=this.mouse.y;

    if (this.state==='playing') {
      // 尝试拾取
      const got = this.spawner.click(mx, my, this.player);
      if (got==='chest') this.ui.toast('🎁 宝箱开出资源!');
      else if (got) this.ui.toast(`+1 ${ITEMS[got]?.name||got}`);
    }

    if (this.state==='craft') {
      const r = this.ui.handleCraftClick(mx, my, this.player, this.craftCat, this.craftOffset);
      if (r?.action==='cat') { this.craftCat=r.value; this.craftOffset=0; }
      if (r?.action==='craft') this.ui.toast(`✅ 合成 ${r.value.name}`);
    }

    if (this.state==='building') {
      if (this.buildSub==='workbench') {
        if (this.player.inv.plank>=10 && this.player.inv.metal>=2) {
          this.player.inv.plank-=10; this.player.inv.metal-=2;
          this.raft.addWorkbench(mx-20, my-20);
          this.ui.toast('✅ 工作台放置成功');
          this.buildSub=null;
        } else { this.ui.toast('❌ 需要木板x10+金属x2'); }
      }
      if (this.buildSub==='raft') {
        const slots = this.raft.expandSlots(this.player.x+12, this.player.y+16);
        for (const s of slots) {
          const cx = s.x+CELL/2, cy = s.y+CELL/2;
          if (dist(mx,my,cx,cy) < CELL/2+10) {
            const cost = this.player.inv.hammer>0 ? 1 : 1;
            if (this.player.inv.plank >= cost) {
              this.player.inv.plank -= cost;
              this.raft.expand(s.dir);
              this.ui.toast('✅ 扩建成功');
            } else { this.ui.toast('❌ 木板不足'); }
            break;
          }
        }
      }
    }
  }

  // ===== 主循环 =====
  loop() {
    const now = performance.now();
    const dt = Math.min((now - (this._last||now)) / 1000, 0.05);
    this._last = now;

    if (this.state === 'playing') this._update(dt);
    this._render();

    this.mouse.clicked = false;
    requestAnimationFrame(() => this.loop());
  }

  _update(dt) {
    // 聚合输入
    this._input.left  = this.keys['a']||this.keys['arrowleft']  ? 1:0;
    this._input.right = this.keys['d']||this.keys['arrowright'] ? 1:0;
    this._input.jump  = this.keys['w']||this.keys['arrowup']||this.keys[' '] ? 1:0;
    this._input.fish  = this.keys['f'] ? 1:0;

    this.player.update(dt, this._input);
    this.fishing.update(dt, this._input, this.player);
    this.spawner.update(dt, this.player);
    this.dayNight.update(dt);
    this.ui.update(dt);

    // 钓鱼奖励
    const r = this.fishing.getReward();
    if (r) {
      const mult = this.player.inv.spear>0 ? 2 : 1;
      if (r.rarity==='rare') {
        this.player.inv.metal += 2*mult;
        this.ui.toast(`🎣 获得金属x${2*mult}!`);
      } else if (r.rarity==='uncommon') {
        this.player.inv.food += 2*mult;
        this.ui.toast(`🎣 获得食物x${2*mult}!`);
      } else {
        this.player.inv.food += 1*mult;
        this.ui.toast(`🎣 获得食物x${1*mult}`);
      }
    }
  }

  _render() {
    const ctx = this.ctx;
    this.dayNight.render(ctx);
    this.raft.render(ctx);
    this.spawner.render(ctx);
    this.fishing.render(ctx, this.player);
    this.player.render(ctx);

    // 建造模式叠加
    if (this.state === 'building') {
      if (this.buildSub==='raft') {
        const slots = this.raft.expandSlots(this.player.x+12, this.player.y+16);
        for (const s of slots) {
          ctx.fillStyle='rgba(46,204,113,0.45)';
          ctx.fillRect(s.x, s.y, CELL, CELL);
          ctx.strokeStyle='#2ecc71'; ctx.lineWidth=2;
          ctx.strokeRect(s.x, s.y, CELL, CELL);
          ctx.fillStyle='#fff'; ctx.font='18px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
          const arrow = s.dir==='left'?'←':s.dir==='right'?'→':'↑';
          ctx.fillText(arrow, s.x+CELL/2, s.y+CELL/2);
        }
      }
      if (this.buildSub==='workbench') {
        ctx.fillStyle='rgba(46,204,113,0.5)';
        ctx.fillRect(this.mouse.x-20, this.mouse.y-20, 40, 40);
        ctx.strokeStyle='#2ecc71'; ctx.lineWidth=2;
        ctx.strokeRect(this.mouse.x-20, this.mouse.y-20, 40, 40);
        ctx.font='22px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('🔨', this.mouse.x, this.mouse.y);
      }
    }

    // HUD（始终显示）
    this.ui.renderHUD(ctx, this.player, this.dayNight);

    // 浮层
    if (this.state==='bag')    this.ui.renderBag(ctx, this.player);
    if (this.state==='craft')  this.ui.renderCraft(ctx, this.player, this.craftCat, this.craftOffset);
    if (this.state==='paused') this.ui.renderPause(ctx, this.pauseSel);
  }
}
