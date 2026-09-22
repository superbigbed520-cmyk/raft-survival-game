// 主游戏类（3D版）
import * as THREE from 'three';
import { CELL, WATER_Y, dist, clamp } from './utils.js';
import { Scene3D } from './scene3d.js';
import { Player3D, Raft3D, DropManager } from './entities.js';
import { Fishing3D } from './fishing.js';
import { UI } from './ui.js';
import { ITEMS, HOTBAR, RECIPES, CATS, canCraft, craft } from './crafting.js';

class DayNight {
  constructor() { this.t = 30; }
  update(dt) { this.t = (this.t+dt) % 120; }
  phase() { return this.t<60?'day':this.t<80?'dusk':'night'; }
}

export class Game {
  constructor() {
    this.s3d = new Scene3D();
    this.raft = new Raft3D(this.s3d.scene);
    this.player = new Player3D(this.raft);
    this.s3d.scene.add(this.player.mesh);
    this.drops = new DropManager(this.s3d.scene);
    this.fish = new Fishing3D(this.s3d.scene);
    this.dayNight = new DayNight();
    this.ui = new UI();

    this.state = 'playing';
    this.buildSub = null;
    this.craftCat = '全部';
    this.keys = {};
    this.input = { left:0, right:0, fwd:0, back:0, jump:0, fish:0 };

    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      if (k==='tab') e.preventDefault();
      this._key(k);
    });
    window.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });

    // 鼠标（3D拾取）
    this.s3d.renderer.domElement.addEventListener('click', () => {
      if (this.state==='playing') {
        const got = this.drops.click(this.player);
        if (got==='chest') this.ui.toast('🎁 宝箱开出资源!');
        else if (got) this.ui.toast(`+1 ${ITEMS[got]?.name||got}`);
      }
      if (this.state==='building' && this.buildSub==='workbench') {
        if ((this.player.inv.plank||0)>=10 && (this.player.inv.metal||0)>=2) {
          this.player.inv.plank-=10; this.player.inv.metal-=2;
          this.raft.addWorkbench(this.player.x+this.player.faceX*3, 0.25, this.player.z+this.player.faceZ*3);
          this.ui.toast('✅ 工作台放置成功');
          this.buildSub = null; this.state = 'playing';
        } else { this.ui.toast('❌ 需要木板x10+金属x2'); }
      }
    });

    // UI 按钮（事件委托）
    document.getElementById('ui').addEventListener('click', e => {
      const t = e.target;
      if (t.classList.contains('cat-tab')) { this.craftCat = t.dataset.cat; this.ui.showCraft(this.player, this.craftCat); }
      if (t.classList.contains('recipe-btn') && !t.disabled) {
        const r = RECIPES.find(x=>x.id===t.dataset.id);
        if (r && craft(r, this.player.inv)) {
          this.ui.toast(`✅ 合成 ${r.name}`);
          this.ui.showCraft(this.player, this.craftCat);
        }
      }
      if (t.classList.contains('row')) {
        const act = +t.dataset.act;
        this.ui.closeAll();
        if (act===0) this.state='playing';
        if (act===1) { this.state='craft'; this.ui.showCraft(this.player, this.craftCat); }
        if (act===2) location.reload();
      }
    });
  }

  _key(k) {
    switch (this.state) {
      case 'playing':
        if (k==='escape') { this.state='paused'; this.ui.showPause(); }
        if (k==='tab')    { this.state='bag'; this.ui.showBag(this.player); }
        if (k==='b')      { this.state='building'; this.buildSub=null; this.ui.toast('🔨 建造模式: R扩建 W放工作台 ESC退出'); }
        if (k==='e') {
          for (const wb of this.raft.workbenches) {
            if (dist(this.player.x, this.player.z, wb.x, wb.z) < 4) {
              this.state='craft'; this.ui.showCraft(this.player, this.craftCat); return;
            }
          }
          this.ui.toast('附近没有工作台');
        }
        if (k>='1'&&k<='6') this.ui.selSlot = +k-1;
        if (k==='q') {
          const id = HOTBAR[this.ui.selSlot];
          if (ITEMS[id]?.usable) {
            const r = this.player.useItem(id);
            if (r==='hunger') this.ui.toast('🍖 饱食度提升!');
            if (r==='thirst') this.ui.toast('💧 口渴度提升!');
            if (r==='hp')     this.ui.toast('❤️ 生命恢复!');
          }
        }
        break;

      case 'paused':
        if (k==='escape') { this.state='playing'; this.ui.closeAll(); }
        break;

      case 'craft':
        if (k==='escape'||k==='e') { this.state='playing'; this.ui.closeAll(); }
        break;

      case 'bag':
        if (k==='escape'||k==='tab') { this.state='playing'; this.ui.closeAll(); }
        break;

      case 'building':
        if (k==='escape'||k==='b') { this.state='playing'; this.buildSub=null; }
        if (k==='w') { this.buildSub='workbench'; this.ui.toast('点击放置工作台(木板10+金属2)'); }
        if (k==='r') {
          const slots = this.raft.expandSlots(this.player.x, this.player.z);
          if (this.player.inv.plank>0 && slots.length) {
            const cost = this.player.inv.hammer>0 ? 1 : 1;
            if (this.player.inv.plank>=cost) {
              this.player.inv.plank-=cost;
              this.raft.expand(slots[0].dir);
              this.ui.toast('✅ 扩建成功!');
            } else this.ui.toast('❌ 木板不足');
          } else this.ui.toast('❌ 无法扩建');
        }
        break;
    }
  }

  loop() {
    const now = performance.now();
    const dt = Math.min((now-(this._last||now))/1000, 0.05);
    this._last = now;

    if (this.state==='playing') this._update(dt);

    // 3D 渲染
    this.s3d.followPlayer(this.player.x, this.player.y, this.player.z,
                          this.player.faceX, this.player.faceZ, dt);
    this.s3d.updateSky(this.dayNight.phase(), this.dayNight.t);
    this.s3d.wave(now/1000);
    this.s3d.render();

    requestAnimationFrame(() => this.loop());
  }

  _update(dt) {
    this.input.left  = (this.keys['a']||this.keys['arrowleft'])  ?1:0;
    this.input.right = (this.keys['d']||this.keys['arrowright']) ?1:0;
    this.input.fwd   = (this.keys['w']||this.keys['arrowup'])    ?1:0;
    this.input.back  = (this.keys['s']||this.keys['arrowdown'])  ?1:0;
    this.input.jump  = (this.keys[' ']||this.keys['w'])          ?1:0;
    this.input.fish  = this.keys['f'] ? 1:0;

    this.player.update(dt, this.input);
    this.fish.update(dt, this.input, this.player);
    this.drops.update(dt, this.player);
    this.dayNight.update(dt);
    this.ui.update(this.player, this.dayNight);

    // 钓鱼奖励
    const r = this.fish.getReward();
    if (r) {
      const m = (this.player.inv.spear||0)>0 ? 2 : 1;
      if (r.rarity==='rare')      { this.player.inv.metal=(this.player.inv.metal||0)+2*m; this.ui.toast(`🎣 获得金属x${2*m}!`); }
      else if (r.rarity==='uncommon') { this.player.inv.food=(this.player.inv.food||0)+2*m; this.ui.toast(`🎣 获得食物x${2*m}!`); }
      else { this.player.inv.food=(this.player.inv.food||0)+1*m; this.ui.toast(`🎣 获得食物x${m}`); }
    }
  }
}
