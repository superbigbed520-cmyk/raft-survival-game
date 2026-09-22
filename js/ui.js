// HTML UI 系统
import { ITEMS, HOTBAR, RECIPES, CATS, canCraft } from './crafting.js';

export class UI {
  constructor() {
    this.root = document.getElementById('ui');
    this.toasts = [];
    this._buildHUD();
  }

  _buildHUD() {
    this.root.innerHTML = `
      <div class="hud-bar">
        <div class="stat"><span class="stat-icon">❤️</span><div class="bar-bg"><div class="bar-fill" id="hp" style="background:#e74c3c;width:100%"></div></div><span class="bar-label" id="hp-v">100</span></div>
        <div class="stat"><span class="stat-icon">🍖</span><div class="bar-bg"><div class="bar-fill" id="hg" style="background:#e67e22;width:100%"></div></div><span class="bar-label" id="hg-v">100</span></div>
        <div class="stat"><span class="stat-icon">💧</span><div class="bar-bg"><div class="bar-fill" id="th" style="background:#3498db;width:100%"></div></div><span class="bar-label" id="th-v">100</span></div>
      </div>
      <div class="time-display" id="time">☀️ 白天</div>
      <div class="controls">AD 移动 | W 跳跃/游泳 | F 钓鱼 | Q 使用<br>B 建造 | E 工作台 | TAB 背包 | ESC 暂停</div>
      <div class="toast-box" id="toasts"></div>
      <div class="hotbar" id="hotbar"></div>
    `;
    this._buildHotbar();
  }

  _buildHotbar() {
    const el = document.getElementById('hotbar');
    el.innerHTML = HOTBAR.map((id, i) => `
      <div class="slot${i===0?' selected':''}" data-idx="${i}">
        <span class="slot-key">${i+1}</span>
        <span class="slot-icon">${ITEMS[id].icon}</span>
        <span class="slot-count" id="sc-${id}">0</span>
      </div>
    `).join('');
    el.querySelectorAll('.slot').forEach(s => {
      s.addEventListener('click', () => this.selSlot = +s.dataset.idx);
    });
    this.selSlot = 0;
  }

  toast(text) {
    this.toasts.push({ text, t: 3 });
    this._renderToasts();
    setTimeout(() => { this.toasts.shift(); this._renderToasts(); }, 3000);
  }

  _renderToasts() {
    document.getElementById('toasts').innerHTML =
      this.toasts.map(t => `<div class="toast">${t.text}</div>`).join('');
  }

  update(player, dayNight) {
    // 状态条
    document.getElementById('hp').style.width = player.hp+'%';
    document.getElementById('hg').style.width = player.hunger+'%';
    document.getElementById('th').style.width = player.thirst+'%';
    document.getElementById('hp-v').textContent = Math.floor(player.hp);
    document.getElementById('hg-v').textContent = Math.floor(player.hunger);
    document.getElementById('th-v').textContent = Math.floor(player.thirst);

    // 时间
    const ph = dayNight.phase();
    document.getElementById('time').textContent = ph==='day'?'☀️ 白天':ph==='dusk'?'🌅 黄昏':'🌙 夜晚';

    // 快捷栏
    HOTBAR.forEach(id => {
      const el = document.getElementById('sc-'+id);
      if (el) el.textContent = player.inv[id]||0;
    });
    document.querySelectorAll('.slot').forEach((s,i) => {
      s.className = 'slot' + (i===this.selSlot ? ' selected' : '');
    });
  }

  // ===== 背包 =====
  showBag(player) {
    const entries = Object.entries(player.inv).filter(([_,v])=>v>0);
    const slots = [];
    for (let i=0; i<20; i++) {
      if (i<entries.length) {
        const [id, amt] = entries[i];
        const def = ITEMS[id];
        slots.push(`<div style="background:#34495e;border:1px solid #555;border-radius:8px;width:58px;height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative">
          <span style="font-size:24px">${def?.icon||'?'}</span>
          <span style="position:absolute;bottom:2px;right:4px;font-size:11px;font-weight:bold;color:#fff">${amt}</span>
          <span style="font-size:9px;color:#aaa">${def?.name||id}</span>
        </div>`);
      } else {
        slots.push('<div style="background:#34495e;border:1px solid #555;border-radius:8px;width:58px;height:58px"></div>');
      }
    }
    this._overlay(`<h2>🎒 背包</h2><div style="display:grid;grid-template-columns:repeat(5,58px);gap:8px;justify-content:center">${slots.join('')}</div><div class="hint">TAB / ESC 关闭</div>`);
  }

  // ===== 合成 =====
  showCraft(player, cat) {
    const filtered = cat==='全部' ? RECIPES : RECIPES.filter(r=>r.cat===cat);
    const tabs = CATS.map(c => `<div class="cat-tab${c===cat?' active':''}" data-cat="${c}">${c}</div>`).join('');
    const rows = filtered.map(r => {
      const ok = canCraft(r, player.inv);
      const need = Object.entries(r.need).map(([k,v]) => `${ITEMS[k].icon}${player.inv[k]||0}/${v}`).join(' ');
      const out = Object.entries(r.out).map(([k,v]) => `${ITEMS[k].icon}x${v}`).join(' ');
      return `<div class="recipe${ok?' can':''}">
        <div class="recipe-icon">${r.icon}</div>
        <div class="recipe-info">
          <div class="recipe-name">${r.name}</div>
          <div class="recipe-desc">${r.desc}</div>
          <div class="recipe-need">${need} → ${out}</div>
        </div>
        <button class="recipe-btn" data-id="${r.id}" ${ok?'':'disabled'}>合成</button>
      </div>`;
    }).join('');
    this._overlay(`<h2>🔨 合成</h2><div class="cat-tabs">${tabs}</div>${rows}<div class="hint">E / ESC 关闭</div>`);
  }

  // ===== 暂停 =====
  showPause() {
    const opts = ['▶️ 继续游戏','📖 合成图纸','🚪 重新开始'];
    this._overlay(`<h2>⏸️ 暂停</h2>${opts.map((o,i) => `<div class="row" data-act="${i}">${o}</div>`).join('')}<div class="hint">ESC 继续</div>`);
  }

  _overlay(html) {
    this._closeOverlay();
    const div = document.createElement('div');
    div.className = 'overlay';
    div.id = 'game-overlay';
    div.innerHTML = `<div class="panel">${html}</div>`;
    this.root.appendChild(div);
  }

  _closeOverlay() {
    const el = document.getElementById('game-overlay');
    if (el) el.remove();
  }

  closeAll() { this._closeOverlay(); }
}
