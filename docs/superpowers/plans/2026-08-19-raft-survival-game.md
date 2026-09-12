# 木筏生存游戏 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个俯视角2D海上生存游戏，包含木筏扩建和钓鱼/收集漂浮物的核心玩法。

**Architecture:** 纯Canvas + 原生JS，模块化ES6架构，10个核心模块各司其职，通过game.js统一调度。

**Tech Stack:** HTML5 Canvas, ES6 Modules, 无构建工具

---

## 文件结构

```
木筏生存/
├── index.html              # 游戏入口
├── css/
│   └── style.css           # 页面样式
├── js/
│   ├── main.js             # 入口，初始化游戏
│   ├── game.js             # 游戏主循环，状态管理
│   ├── player.js           # 玩家控制
│   ├── raft.js             # 木筏网格系统
│   ├── items.js            # 漂浮物系统
│   ├── fishing.js          # 钓鱼系统
│   ├── daynight.js         # 昼夜循环
│   ├── missions.js         # 任务系统
│   ├── world.js            # 世界探索
│   ├── ui.js               # UI系统
│   └── utils.js            # 工具函数
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-08-19-raft-survival-game.md
```

---

## Task 1: 基础项目结构

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/utils.js`
- Create: `js/main.js`

- [ ] **Step 1: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>木筏生存</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
        <div id="ui-layer"></div>
    </div>
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 css/style.css**

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background-color: #1a1a2e;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    overflow: hidden;
}

#game-container {
    position: relative;
    width: 800px;
    height: 600px;
}

#game-canvas {
    display: block;
    background-color: #4a90a4;
    border: 3px solid #2c3e50;
    border-radius: 8px;
}

#ui-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
```

- [ ] **Step 3: 创建 js/utils.js**

```javascript
// 工具函数模块

export const CELL_SIZE = 40;

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}
```

- [ ] **Step 4: 创建 js/main.js**

```javascript
// 游戏入口
import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const game = new Game(canvas);
    game.start();
});
```

- [ ] **Step 5: 提交**

```bash
git add index.html css/ js/utils.js js/main.js
git commit -m "feat: 创建基础项目结构"
git push
```

---

## Task 2: 游戏主循环 (game.js)

**Files:**
- Create: `js/game.js`

- [ ] **Step 1: 创建 js/game.js - 基础框架**

```javascript
// 游戏主循环模块
import { CELL_SIZE } from './utils.js';

export const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    FISHING: 'fishing',
    EXPLORING: 'exploring',
    DIALOG: 'dialog',
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = GameState.MENU;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // 游戏对象（后续任务初始化）
        this.player = null;
        this.raft = null;
        this.items = [];
        this.fishing = null;
        this.dayNight = null;
        this.missions = null;
        this.world = null;
        this.ui = null;
        
        // 输入状态
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        this.setupInput();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.mouse.clicked = true;
        });
    }
    
    start() {
        this.state = GameState.PLAYING;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop() {
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update();
        this.render();
        
        this.mouse.clicked = false;
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.state !== GameState.PLAYING) return;
        
        // 后续任务：更新各个模块
        // this.player.update(this.deltaTime, this.keys);
        // this.raft.update(this.deltaTime);
        // this.items = this.items.filter(item => item.update(this.deltaTime));
        // this.fishing.update(this.deltaTime);
        // this.dayNight.update(this.deltaTime);
    }
    
    render() {
        // 清空画布
        this.ctx.fillStyle = '#4a90a4';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 后续任务：渲染各个模块
        // this.raft.render(this.ctx);
        // this.items.forEach(item => item.render(this.ctx));
        // this.player.render(this.ctx);
        // this.fishing.render(this.ctx);
        // this.dayNight.render(this.ctx);
        // this.ui.render(this.ctx);
    }
}
```

- [ ] **Step 2: 测试运行**

在浏览器中打开 index.html，应该能看到蓝色画布。

- [ ] **Step 3: 提交**

```bash
git add js/game.js
git commit -m "feat: 实现游戏主循环框架"
git push
```

---

## Task 3: 玩家系统 (player.js)

**Files:**
- Create: `js/player.js`
- Modify: `js/game.js`

- [ ] **Step 1: 创建 js/player.js**

```javascript
// 玩家系统模块
import { CELL_SIZE, clamp } from './utils.js';

export class Player {
    constructor(raft) {
        this.raft = raft;
        
        // 木筏网格位置
        this.gridX = 1;
        this.gridY = 1;
        
        // 像素位置（相对于画布）
        this.x = 0;
        this.y = 0;
        
        // 属性
        this.hunger = 100;
        this.thirst = 100;
        this.health = 100;
        this.speed = 150; // 像素/秒
        
        // 背包
        this.inventory = {
            plank: 0,
            plastic: 0,
            rope: 0,
            food: 0,
            metal: 0,
        };
        
        // 动画
        this.facing = 'down'; // up, down, left, right
        this.animFrame = 0;
        this.animTimer = 0;
        
        this.updatePixelPosition();
    }
    
    updatePixelPosition() {
        this.x = this.gridX * CELL_SIZE + CELL_SIZE / 2;
        this.y = this.gridY * CELL_SIZE + CELL_SIZE / 2;
    }
    
    update(deltaTime, keys) {
        // 移动
        let dx = 0;
        let dy = 0;
        
        if (keys['w'] || keys['arrowup']) {
            dy = -1;
            this.facing = 'up';
        }
        if (keys['s'] || keys['arrowdown']) {
            dy = 1;
            this.facing = 'down';
        }
        if (keys['a'] || keys['arrowleft']) {
            dx = -1;
            this.facing = 'left';
        }
        if (keys['d'] || keys['arrowright']) {
            dx = 1;
            this.facing = 'right';
        }
        
        // 归一化对角线移动
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        // 计算目标网格位置
        const newGridX = this.gridX + Math.round(dx);
        const newGridY = this.gridY + Math.round(dy);
        
        // 检查是否可以移动到目标位置
        if (this.raft.hasCell(newGridX, newGridY)) {
            this.gridX = newGridX;
            this.gridY = newGridY;
            this.updatePixelPosition();
        }
        
        // 更新饥饿和口渴
        this.hunger = clamp(this.hunger - deltaTime * 2, 0, 100);
        this.thirst = clamp(this.thirst - deltaTime * 3, 0, 100);
        
        // 饥饿或口渴为0时掉血
        if (this.hunger === 0 || this.thirst === 0) {
            this.health = clamp(this.health - deltaTime * 10, 0, 100);
        }
        
        // 动画计时
        this.animTimer += deltaTime;
        if (this.animTimer > 0.2) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }
    
    addToInventory(type, amount = 1) {
        if (this.inventory[type] !== undefined) {
            this.inventory[type] += amount;
            return true;
        }
        return false;
    }
    
    removeFromInventory(type, amount = 1) {
        if (this.inventory[type] >= amount) {
            this.inventory[type] -= amount;
            return true;
        }
        return false;
    }
    
    render(ctx) {
        // 绘制玩家（简单的圆形角色）
        ctx.save();
        
        // 身体
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛（根据朝向）
        ctx.fillStyle = '#fff';
        const eyeOffset = { x: 0, y: 0 };
        switch (this.facing) {
            case 'up': eyeOffset.y = -4; break;
            case 'down': eyeOffset.y = 4; break;
            case 'left': eyeOffset.x = -4; break;
            case 'right': eyeOffset.x = 4; break;
        }
        ctx.beginPath();
        ctx.arc(this.x + eyeOffset.x - 3, this.y + eyeOffset.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(this.x + eyeOffset.x + 3, this.y + eyeOffset.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 瞳孔
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + eyeOffset.x - 3, this.y + eyeOffset.y - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(this.x + eyeOffset.x + 3, this.y + eyeOffset.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
```

- [ ] **Step 2: 修改 js/game.js - 集成玩家系统**

在 Game 类的 constructor 中添加：
```javascript
import { Player } from './player.js';

// 在 constructor 中：
this.player = null;
```

在 start() 方法中添加初始化：
```javascript
start() {
    // 初始化木筏（暂时用简单的3x3）
    this.raft = {
        grid: [
            [true, true, true],
            [true, true, true],
            [true, true, true],
        ],
        hasCell: (x, y) => {
            if (x < 0 || x >= 3 || y < 0 || y >= 3) return false;
            return this.raft.grid[y][x];
        }
    };
    
    this.player = new Player(this.raft);
    this.state = GameState.PLAYING;
    this.lastTime = performance.now();
    this.gameLoop();
}
```

在 update() 方法中启用玩家更新：
```javascript
update() {
    if (this.state !== GameState.PLAYING) return;
    
    this.player.update(this.deltaTime, this.keys);
}
```

在 render() 方法中启用玩家渲染：
```javascript
render() {
    this.ctx.fillStyle = '#4a90a4';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.player.render(this.ctx);
}
```

- [ ] **Step 3: 测试运行**

按 WASD 键，玩家应该在3x3区域内移动。

- [ ] **Step 4: 提交**

```bash
git add js/player.js js/game.js
git commit -m "feat: 实现玩家移动和属性系统"
git push
```

---

## Task 4: 木筏系统 (raft.js)

**Files:**
- Create: `js/raft.js`
- Modify: `js/game.js`

- [ ] **Step 1: 创建 js/raft.js**

```javascript
// 木筏网格系统模块
import { CELL_SIZE } from './utils.js';

export const CellType = {
    PLANK: 'plank',
    STORAGE: 'storage',
    WORKBENCH: 'workbench',
    WATER_PURIFIER: 'water_purifier',
};

export class Raft {
    constructor() {
        // 木筏网格，初始3x3
        this.grid = [];
        this.width = 3;
        this.height = 3;
        
        // 初始化网格
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = CellType.PLANK;
            }
        }
        
        // 木筏在画布上的偏移（居中）
        this.offsetX = 0;
        this.offsetY = 0;
    }
    
    hasCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.grid[y][x] !== null;
    }
    
    getCell(x, y) {
        if (!this.hasCell(x, y)) return null;
        return this.grid[y][x];
    }
    
    canExpand(x, y) {
        // 检查是否与现有木筏相邻
        const neighbors = [
            [x - 1, y], [x + 1, y],
            [x, y - 1], [x, y + 1]
        ];
        
        for (const [nx, ny] of neighbors) {
            if (this.hasCell(nx, ny)) return true;
        }
        return false;
    }
    
    expand(x, y, cellType = CellType.PLANK) {
        if (!this.canExpand(x, y)) return false;
        
        // 扩展网格数组
        if (y < 0) {
            // 向上扩展
            this.grid.unshift(new Array(this.width).fill(null));
            this.height++;
            y = 0;
        } else if (y >= this.height) {
            // 向下扩展
            this.grid.push(new Array(this.width).fill(null));
            this.height++;
        }
        
        if (x < 0) {
            // 向左扩展
            for (let row of this.grid) {
                row.unshift(null);
            }
            this.width++;
            x = 0;
        } else if (x >= this.width) {
            // 向右扩展
            for (let row of this.grid) {
                row.push(null);
            }
            this.width++;
        }
        
        this.grid[y][x] = cellType;
        return true;
    }
    
    render(ctx) {
        // 计算居中偏移
        const raftPixelWidth = this.width * CELL_SIZE;
        const raftPixelHeight = this.height * CELL_SIZE;
        this.offsetX = (800 - raftPixelWidth) / 2;
        this.offsetY = (600 - raftPixelHeight) / 2;
        
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        
        // 绘制每个格子
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.grid[y][x];
                if (cell === null) continue;
                
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;
                
                // 根据类型绘制不同颜色
                switch (cell) {
                    case CellType.PLANK:
                        ctx.fillStyle = '#8B4513';
                        break;
                    case CellType.STORAGE:
                        ctx.fillStyle = '#654321';
                        break;
                    case CellType.WORKBENCH:
                        ctx.fillStyle = '#A0522D';
                        break;
                    case CellType.WATER_PURIFIER:
                        ctx.fillStyle = '#4682B4';
                        break;
                    default:
                        ctx.fillStyle = '#8B4513';
                }
                
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                
                // 绘制边框
                ctx.strokeStyle = '#5D3A1A';
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                
                // 绘制木板纹理
                if (cell === CellType.PLANK) {
                    ctx.strokeStyle = '#6B3410';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(px + 5, py + CELL_SIZE / 3);
                    ctx.lineTo(px + CELL_SIZE - 5, py + CELL_SIZE / 3);
                    ctx.moveTo(px + 5, py + (CELL_SIZE * 2) / 3);
                    ctx.lineTo(px + CELL_SIZE - 5, py + (CELL_SIZE * 2) / 3);
                    ctx.stroke();
                }
            }
        }
        
        ctx.restore();
    }
}
```

- [ ] **Step 2: 修改 js/game.js - 集成木筏系统**

更新 import：
```javascript
import { Raft } from './raft.js';
```

更新 start() 方法：
```javascript
start() {
    this.raft = new Raft();
    this.player = new Player(this.raft);
    this.state = GameState.PLAYING;
    this.lastTime = performance.now();
    this.gameLoop();
}
```

更新 render() 方法：
```javascript
render() {
    this.ctx.fillStyle = '#4a90a4';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.raft.render(this.ctx);
    this.player.render(this.ctx);
}
```

- [ ] **Step 3: 测试运行**

应该能看到3x3的木筏，玩家可以在上面移动。

- [ ] **Step 4: 提交**

```bash
git add js/raft.js js/game.js
git commit -m "feat: 实现木筏网格系统"
git push
```

---

## Task 5: 漂浮物系统 (items.js)

**Files:**
- Create: `js/items.js`
- Modify: `js/game.js`

- [ ] **Step 1: 创建 js/items.js**

```javascript
// 漂浮物系统模块
import { randomRange, randomInt, distance } from './utils.js';

export const ItemType = {
    PLANK: { name: '木板', color: '#8B4513', rarity: 'common' },
    PLASTIC: { name: '塑料', color: '#3498db', rarity: 'common' },
    ROPE: { name: '绳子', color: '#f39c12', rarity: 'common' },
    FOOD: { name: '食物', color: '#e74c3c', rarity: 'common' },
    METAL: { name: '金属', color: '#95a5a6', rarity: 'rare' },
    CHEST: { name: '宝箱', color: '#f1c40f', rarity: 'rare' },
};

class FloatingItem {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.size = type.rarity === 'rare' ? 20 : 15;
        this.lifetime = 30; // 30秒后消失
        this.collected = false;
        this.collectAnim = 0;
    }
    
    update(deltaTime, raft, player) {
        if (this.collected) {
            // 收集动画：飞向玩家
            this.collectAnim += deltaTime * 5;
            if (this.collectAnim >= 1) {
                player.addToInventory(this.type.name === '木板' ? 'plank' : 
                                     this.type.name === '塑料' ? 'plastic' :
                                     this.type.name === '绳子' ? 'rope' :
                                     this.type.name === '食物' ? 'food' :
                                     this.type.name === '金属' ? 'metal' : 'plank');
                return false; // 移除物品
            }
            // 插值到玩家位置
            this.x += (player.x - this.x) * this.collectAnim;
            this.y += (player.y - this.y) * this.collectAnim;
            return true;
        }
        
        // 漂流
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // 减速
        this.vx *= 0.99;
        this.vy *= 0.99;
        
        // 消失计时
        this.lifetime -= deltaTime;
        return this.lifetime > 0;
    }
    
    checkClick(mouseX, mouseY) {
        if (this.collected) return false;
        return distance(mouseX, mouseY, this.x, this.y) < this.size + 10;
    }
    
    collect() {
        this.collected = true;
        this.collectAnim = 0;
    }
    
    render(ctx) {
        ctx.save();
        
        // 透明度（快消失时闪烁）
        const alpha = this.lifetime < 5 ? (Math.sin(Date.now() / 100) + 1) / 2 : 1;
        ctx.globalAlpha = alpha;
        
        // 绘制物品
        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x - this.size / 3, this.y - this.size / 3, this.size / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 稀有物品闪烁边框
        if (this.type.rarity === 'rare') {
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

export class ItemManager {
    constructor() {
        this.items = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2; // 每2秒生成一个
    }
    
    update(deltaTime, canvasWidth, canvasHeight, player) {
        // 生成新物品
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnItem(canvasWidth, canvasHeight);
        }
        
        // 更新现有物品
        this.items = this.items.filter(item => 
            item.update(deltaTime, null, player)
        );
    }
    
    spawnItem(canvasWidth, canvasHeight) {
        // 随机选择类型
        const types = Object.values(ItemType);
        const type = Math.random() < 0.8 
            ? types[randomInt(0, 3)]  // 80%普通
            : types[randomInt(4, 5)]; // 20%稀有
        
        // 随机位置（屏幕边缘）
        const side = randomInt(0, 3);
        let x, y;
        switch (side) {
            case 0: // 上
                x = randomRange(0, canvasWidth);
                y = -20;
                break;
            case 1: // 右
                x = canvasWidth + 20;
                y = randomRange(0, canvasHeight);
                break;
            case 2: // 下
                x = randomRange(0, canvasWidth);
                y = canvasHeight + 20;
                break;
            case 3: // 左
                x = -20;
                y = randomRange(0, canvasHeight);
                break;
        }
        
        const item = new FloatingItem(type, x, y);
        
        // 朝向画布中心漂移
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const angle = Math.atan2(centerY - y, centerX - x);
        item.vx = Math.cos(angle) * randomRange(20, 50);
        item.vy = Math.sin(angle) * randomRange(20, 50);
        
        this.items.push(item);
    }
    
    checkClick(mouseX, mouseY) {
        for (const item of this.items) {
            if (item.checkClick(mouseX, mouseY)) {
                item.collect();
                return true;
            }
        }
        return false;
    }
    
    render(ctx) {
        for (const item of this.items) {
            item.render(ctx);
        }
    }
}
```

- [ ] **Step 2: 修改 js/game.js - 集成漂浮物系统**

更新 import：
```javascript
import { ItemManager } from './items.js';
```

在 constructor 中添加：
```javascript
this.itemManager = null;
```

更新 start() 方法：
```javascript
start() {
    this.raft = new Raft();
    this.player = new Player(this.raft);
    this.itemManager = new ItemManager();
    this.state = GameState.PLAYING;
    this.lastTime = performance.now();
    this.gameLoop();
}
```

更新 update() 方法：
```javascript
update() {
    if (this.state !== GameState.PLAYING) return;
    
    this.player.update(this.deltaTime, this.keys);
    this.itemManager.update(this.deltaTime, this.canvas.width, this.canvas.height, this.player);
}
```

更新 render() 方法：
```javascript
render() {
    this.ctx.fillStyle = '#4a90a4';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.raft.render(this.ctx);
    this.itemManager.render(this.ctx);
    this.player.render(this.ctx);
}
```

在 setupInput() 中添加点击处理：
```javascript
this.canvas.addEventListener('click', (e) => {
    this.mouse.clicked = true;
    if (this.itemManager) {
        this.itemManager.checkClick(this.mouse.x, this.mouse.y);
    }
});
```

- [ ] **Step 3: 测试运行**

应该能看到漂浮物从屏幕边缘漂来，点击可以收集。

- [ ] **Step 4: 提交**

```bash
git add js/items.js js/game.js
git commit -m "feat: 实现漂浮物生成和收集系统"
git push
```

---

## Task 6: 钓鱼系统 (fishing.js)

**Files:**
- Create: `js/fishing.js`
- Modify: `js/game.js`

- [ ] **Step 1: 创建 js/fishing.js**

```javascript
// 钓鱼系统模块
import { randomRange, distance } from './utils.js';

export const FishingState = {
    IDLE: 'idle',
    CHARGING: 'charging',
    CASTING: 'casting',
    WAITING: 'waiting',
    HOOKED: 'hooked',
    REELING: 'reeling',
};

export class FishingSystem {
    constructor() {
        this.state = FishingState.IDLE;
        this.charge = 0; // 0-100
        this.hookX = 0;
        this.hookY = 0;
        this.hookTargetX = 0;
        this.hookTargetY = 0;
        this.waitTimer = 0;
        this.hookedTimer = 0;
        this.cooldown = 0;
        this.catchSuccess = false;
    }
    
    update(deltaTime, keys, player, canvasWidth, canvasHeight) {
        // 冷却时间
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
            return;
        }
        
        switch (this.state) {
            case FishingState.IDLE:
                if (keys[' ']) {
                    this.state = FishingState.CHARGING;
                    this.charge = 0;
                }
                break;
                
            case FishingState.CHARGING:
                this.charge = Math.min(this.charge + deltaTime * 100, 100);
                if (!keys[' ']) {
                    // 松开空格，抛竿
                    this.state = FishingState.CASTING;
                    this.hookX = player.x;
                    this.hookY = player.y;
                    
                    // 计算目标位置（根据蓄力值）
                    const maxDistance = 150;
                    const distance = (this.charge / 100) * maxDistance;
                    const angle = Math.atan2(player.y - canvasHeight / 2, 
                                           player.x - canvasWidth / 2);
                    this.hookTargetX = player.x - Math.cos(angle) * distance;
                    this.hookTargetY = player.y - Math.sin(angle) * distance;
                }
                break;
                
            case FishingState.CASTING:
                // 鱼钩飞向目标
                const dx = this.hookTargetX - this.hookX;
                const dy = this.hookTargetY - this.hookY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 5) {
                    this.hookX = this.hookTargetX;
                    this.hookY = this.hookTargetY;
                    this.state = FishingState.WAITING;
                    this.waitTimer = randomRange(1, 5);
                } else {
                    this.hookX += (dx / dist) * 300 * deltaTime;
                    this.hookY += (dy / dist) * 300 * deltaTime;
                }
                break;
                
            case FishingState.WAITING:
                this.waitTimer -= deltaTime;
                if (this.waitTimer <= 0) {
                    this.state = FishingState.HOOKED;
                    this.hookedTimer = 0.5; // 0.5秒内点击
                }
                break;
                
            case FishingState.HOOKED:
                this.hookedTimer -= deltaTime;
                if (this.hookedTimer <= 0) {
                    // 超时，跑鱼
                    this.reset();
                } else if (keys[' ']) {
                    // 成功钓到！
                    this.state = FishingState.REELING;
                    this.catchSuccess = true;
                }
                break;
                
            case FishingState.REELING:
                // 收杆动画
                const rdx = player.x - this.hookX;
                const rdy = player.y - this.hookY;
                const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
                
                if (rdist < 10) {
                    // 收杆完成
                    this.reset();
                } else {
                    this.hookX += (rdx / rdist) * 400 * deltaTime;
                    this.hookY += (rdy / rdist) * 400 * deltaTime;
                }
                break;
        }
    }
    
    reset() {
        this.state = FishingState.IDLE;
        this.charge = 0;
        this.cooldown = 3; // 3秒冷却
        this.catchSuccess = false;
    }
    
    getCatch() {
        if (this.catchSuccess) {
            // 根据蓄力值决定稀有度
            const rarity = this.charge > 80 ? 'rare' : this.charge > 50 ? 'uncommon' : 'common';
            return { rarity };
        }
        return null;
    }
    
    render(ctx, player) {
        if (this.state === FishingState.IDLE) return;
        
        ctx.save();
        
        // 绘制鱼线
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(this.hookX, this.hookY);
        ctx.stroke();
        
        // 绘制鱼钩
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.arc(this.hookX, this.hookY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制蓄力条
        if (this.state === FishingState.CHARGING) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(player.x - 25, player.y - 40, 50, 10);
            
            const chargeWidth = (this.charge / 100) * 46;
            ctx.fillStyle = this.charge > 80 ? '#2ecc71' : this.charge > 50 ? '#f39c12' : '#e74c3c';
            ctx.fillRect(player.x - 23, player.y - 38, chargeWidth, 6);
        }
        
        // 绘制上钩提示
        if (this.state === FishingState.HOOKED) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.hookX, this.hookY - 15);
        }
        
        ctx.restore();
    }
}
```

- [ ] **Step 2: 修改 js/game.js - 集成钓鱼系统**

更新 import：
```javascript
import { FishingSystem } from './fishing.js';
```

在 constructor 中添加：
```javascript
this.fishing = null;
```

更新 start() 方法：
```javascript
start() {
    this.raft = new Raft();
    this.player = new Player(this.raft);
    this.itemManager = new ItemManager();
    this.fishing = new FishingSystem();
    this.state = GameState.PLAYING;
    this.lastTime = performance.now();
    this.gameLoop();
}
```

更新 update() 方法：
```javascript
update() {
    if (this.state !== GameState.PLAYING) return;
    
    this.player.update(this.deltaTime, this.keys);
    this.itemManager.update(this.deltaTime, this.canvas.width, this.canvas.height, this.player);
    this.fishing.update(this.deltaTime, this.keys, this.player, this.canvas.width, this.canvas.height);
    
    // 处理钓鱼收获
    const catchResult = this.fishing.getCatch();
    if (catchResult) {
        // 根据稀有度给予奖励
        if (catchResult.rarity === 'rare') {
            this.player.addToInventory('metal', 2);
        } else {
            this.player.addToInventory('food', 1);
        }
    }
}
```

更新 render() 方法：
```javascript
render() {
    this.ctx.fillStyle = '#4a90a4';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.raft.render(this.ctx);
    this.itemManager.render(this.ctx);
    this.fishing.render(this.ctx, this.player);
    this.player.render(this.ctx);
}
```

- [ ] **Step 3: 测试运行**

按空格键蓄力，松开抛竿，等待鱼上钩后快速按空格收杆。

- [ ] **Step 4: 提交**

```bash
git add js/fishing.js js/game.js
git commit -m "feat: 实现钓鱼系统"
git push
```

---

## Task 7: 昼夜循环 (daynight.js)

**Files:**
- Create: `js/daynight.js`
- Modify: `js/game.js`

- [ ] **Step 1: 创建 js/daynight.js**

```javascript
// 昼夜循环系统模块

export const TimeOfDay = {
    DAY: 'day',
    DUSK: 'dusk',
    NIGHT: 'night',
};

export class DayNightCycle {
    constructor() {
        this.time = 0; // 0-120秒
        this.cycleDuration = 120; // 完整周期2分钟
        this.currentTimeOfDay = TimeOfDay.DAY;
        
        // 颜色配置
        this.colors = {
            day: { sky: '#87CEEB', overlay: 'rgba(0, 0, 0, 0)' },
            dusk: { sky: '#FF7F50', overlay: 'rgba(255, 100, 0, 0.2)' },
            night: { sky: '#191970', overlay: 'rgba(0, 0, 50, 0.5)' },
        };
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        if (this.time >= this.cycleDuration) {
            this.time = 0;
        }
        
        // 判断时间段
        if (this.time < 60) {
            this.currentTimeOfDay = TimeOfDay.DAY;
        } else if (this.time < 80) {
            this.currentTimeOfDay = TimeOfDay.DUSK;
        } else {
            this.currentTimeOfDay = TimeOfDay.NIGHT;
        }
    }
    
    getDayProgress() {
        return this.time / this.cycleDuration;
    }
    
    getSunPosition() {
        // 太阳位置（0-1）
        if (this.currentTimeOfDay === TimeOfDay.NIGHT) {
            return -1; // 没有太阳
        }
        return (this.time % 60) / 60;
    }
    
    render(ctx, canvasWidth, canvasHeight) {
        ctx.save();
        
        // 绘制天空渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        
        switch (this.currentTimeOfDay) {
            case TimeOfDay.DAY:
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#4a90a4');
                break;
            case TimeOfDay.DUSK:
                gradient.addColorStop(0, '#FF7F50');
                gradient.addColorStop(1, '#c0392b');
                break;
            case TimeOfDay.NIGHT:
                gradient.addColorStop(0, '#0c1445');
                gradient.addColorStop(1, '#191970');
                break;
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 绘制太阳/月亮
        if (this.currentTimeOfDay !== TimeOfDay.NIGHT) {
            // 太阳
            const sunX = canvasWidth * (1 - this.getDayProgress() * 2);
            const sunY = 50 + Math.sin(this.getDayProgress() * Math.PI) * 30;
            
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // 太阳光晕
            ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 月亮
            const moonX = canvasWidth * (1 - (this.time - 80) / 40);
            const moonY = 60;
            
            ctx.fillStyle = '#ecf0f1';
            ctx.beginPath();
            ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // 月牙效果
            ctx.fillStyle = '#0c1445';
            ctx.beginPath();
            ctx.arc(moonX + 8, moonY - 5, 22, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制星星（夜晚）
        if (this.currentTimeOfDay === TimeOfDay.NIGHT) {
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 50; i++) {
                const starX = (i * 137 + 50) % canvasWidth;
                const starY = (i * 97 + 30) % (canvasHeight / 2);
                const starSize = 1 + Math.sin(Date.now() / 500 + i) * 0.5;
                ctx.beginPath();
                ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 叠加层
        ctx.fillStyle = this.colors[this.currentTimeOfDay].overlay;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        ctx.restore();
    }
}
```

- [ ] **Step 2: 修改 js/game.js - 集成昼夜循环**

更新 import：
```javascript
import { DayNightCycle } from './daynight.js';
```

在 constructor 中添加：
```javascript
this.dayNight = null;
```

更新 start() 方法：
```javascript
start() {
    this.raft = new Raft();
    this.player = new Player(this.raft);
    this.itemManager = new ItemManager();
    this.fishing = new FishingSystem();
    this.dayNight = new DayNightCycle();
    this.state = GameState.PLAYING;
    this.lastTime = performance.now();
    this.gameLoop();
}
```

更新 update() 方法：
```javascript
update() {
    if (this.state !== GameState.PLAYING) return;
    
    this.player.update(this.deltaTime, this.keys);
    this.itemManager.update(this.deltaTime, this.canvas.width, this.canvas.height, this.player);
    this.fishing.update(this.deltaTime, this.keys, this.player, this.canvas.width, this.canvas.height);
    this.dayNight.update(this.deltaTime);
    
    const catchResult = this.fishing.getCatch();
    if (catchResult) {
        if (catchResult.rarity === 'rare') {
            this.player.addToInventory('metal', 2);
        } else {
            this.player.addToInventory('food', 1);
        }
    }
}
```

更新 render() 方法：
```javascript
render() {
    this.dayNight.render(this.ctx, this.canvas.width, this.canvas.height);
    
    this.raft.render(this.ctx);
    this.itemManager.render(this.ctx);
    this.fishing.render(this.ctx, this.player);
    this.player.render(this.ctx);
}
```

- [ ] **Step 3: 测试运行**

应该能看到天空颜色随时间变化，有太阳、月亮和星星。

- [ ] **Step 4: 提交**

```bash
git add js/daynight.js js/game.js
git commit -m "feat: 实现昼夜循环系统"
git push
```

---

## Task 8: UI系统 (ui.js)

**Files:**
- Create: `js/ui.js`
- Modify: `js/game.js`

- [ ] **Step 1: 创建 js/ui.js**

```javascript
// UI系统模块

export class UIManager {
    constructor() {
        this.notifications = [];
    }
    
    addNotification(text, duration = 3) {
        this.notifications.push({
            text,
            timer: duration,
            alpha: 1,
        });
    }
    
    update(deltaTime) {
        // 更新通知
        this.notifications = this.notifications.filter(n => {
            n.timer -= deltaTime;
            if (n.timer < 1) {
                n.alpha = n.timer;
            }
            return n.timer > 0;
        });
    }
    
    render(ctx, player, dayNight, canvasWidth, canvasHeight) {
        ctx.save();
        
        // 状态栏背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 80);
        
        // 生命值
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20, 20, player.health * 1.5, 15);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(20, 20, 150, 15);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`❤️ ${Math.floor(player.health)}`, 25, 32);
        
        // 饥饿值
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(20, 40, player.hunger * 1.5, 15);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(20, 40, 150, 15);
        ctx.fillStyle = '#fff';
        ctx.fillText(`🍖 ${Math.floor(player.hunger)}`, 25, 52);
        
        // 口渴值
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 60, player.thirst * 1.5, 15);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(20, 60, 150, 15);
        ctx.fillStyle = '#fff';
        ctx.fillText(`💧 ${Math.floor(player.thirst)}`, 25, 72);
        
        // 资源栏背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvasWidth - 180, 10, 170, 100);
        
        // 资源数量
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        const resources = [
            { icon: '🪵', name: '木板', count: player.inventory.plank },
            { icon: '📦', name: '塑料', count: player.inventory.plastic },
            { icon: '🧵', name: '绳子', count: player.inventory.rope },
            { icon: '🍖', name: '食物', count: player.inventory.food },
            { icon: '⚙️', name: '金属', count: player.inventory.metal },
        ];
        
        resources.forEach((res, i) => {
            const y = 30 + i * 18;
            ctx.fillText(`${res.icon} ${res.name}: ${res.count}`, canvasWidth - 170, y);
        });
        
        // 时间显示
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvasWidth / 2 - 50, 10, 100, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        const timeText = dayNight.currentTimeOfDay === 'day' ? '☀️ 白天' :
                        dayNight.currentTimeOfDay === 'dusk' ? '🌅 黄昏' : '🌙 夜晚';
        ctx.fillText(timeText, canvasWidth / 2, 30);
        
        // 操作提示
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, canvasHeight - 50, 250, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('WASD: 移动 | 空格: 钓鱼 | 点击: 拾取', 20, canvasHeight - 25);
        
        // 通知
        this.notifications.forEach((n, i) => {
            ctx.globalAlpha = n.alpha;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(canvasWidth / 2 - 100, canvasHeight - 100 - i * 40, 200, 35);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(n.text, canvasWidth / 2, canvasHeight - 77 - i * 40);
        });
        
        ctx.restore();
    }
}
```

- [ ] **Step 2: 修改 js/game.js - 集成UI系统**

更新 import：
```javascript
import { UIManager } from './ui.js';
```

在 constructor 中添加：
```javascript
this.ui = null;
```

更新 start() 方法：
```javascript
start() {
    this.raft = new Raft();
    this.player = new Player(this.raft);
    this.itemManager = new ItemManager();
    this.fishing = new FishingSystem();
    this.dayNight = new DayNightCycle();
    this.ui = new UIManager();
    this.state = GameState.PLAYING;
    this.lastTime = performance.now();
    this.gameLoop();
}
```

更新 update() 方法：
```javascript
update() {
    if (this.state !== GameState.PLAYING) return;
    
    this.player.update(this.deltaTime, this.keys);
    this.itemManager.update(this.deltaTime, this.canvas.width, this.canvas.height, this.player);
    this.fishing.update(this.deltaTime, this.keys, this.player, this.canvas.width, this.canvas.height);
    this.dayNight.update(this.deltaTime);
    this.ui.update(this.deltaTime);
    
    const catchResult = this.fishing.getCatch();
    if (catchResult) {
        if (catchResult.rarity === 'rare') {
            this.player.addToInventory('metal', 2);
            this.ui.addNotification('🎣 获得稀有金属 x2!');
        } else {
            this.player.addToInventory('food', 1);
            this.ui.addNotification('🎣 获得食物 x1');
        }
    }
}
```

更新 render() 方法：
```javascript
render() {
    this.dayNight.render(this.ctx, this.canvas.width, this.canvas.height);
    
    this.raft.render(this.ctx);
    this.itemManager.render(this.ctx);
    this.fishing.render(this.ctx, this.player);
    this.player.render(this.ctx);
    
    this.ui.render(this.ctx, this.player, this.dayNight, this.canvas.width, this.canvas.height);
}
```

- [ ] **Step 3: 测试运行**

应该能看到状态栏、资源栏、时间显示和操作提示。

- [ ] **Step 4: 提交**

```bash
git add js/ui.js js/game.js
git commit -m "feat: 实现UI界面系统"
git push
```

---

## Task 9: 木筏扩建功能

**Files:**
- Modify: `js/game.js`
- Modify: `js/raft.js`

- [ ] **Step 1: 修改 js/raft.js - 添加扩建交互**

在 Raft 类中添加：
```javascript
getExpandableCells(playerX, playerY, offsetX, offsetY) {
    const expandable = [];
    
    for (let y = -1; y <= this.height; y++) {
        for (let x = -1; x <= this.width; x++) {
            if (this.hasCell(x, y)) continue;
            if (this.canExpand(x, y)) {
                const px = offsetX + x * CELL_SIZE + CELL_SIZE / 2;
                const py = offsetY + y * CELL_SIZE + CELL_SIZE / 2;
                const dist = Math.sqrt((px - playerX) ** 2 + (py - playerY) ** 2);
                
                if (dist < CELL_SIZE * 2) { // 只显示附近的可扩建位置
                    expandable.push({ x, y, px, py });
                }
            }
        }
    }
    
    return expandable;
}
```

- [ ] **Step 2: 修改 js/game.js - 添加扩建逻辑**

在 constructor 中添加：
```javascript
this.buildMode = false;
```

在 setupInput() 中添加按键监听：
```javascript
window.addEventListener('keydown', (e) => {
    this.keys[e.key.toLowerCase()] = true;
    
    // 按B进入/退出建造模式
    if (e.key.toLowerCase() === 'b') {
        this.buildMode = !this.buildMode;
        if (this.ui) {
            this.ui.addNotification(this.buildMode ? '🔨 建造模式开启' : '🔨 建造模式关闭');
        }
    }
});

this.canvas.addEventListener('click', (e) => {
    this.mouse.clicked = true;
    
    // 建造模式下点击扩建
    if (this.buildMode && this.itemManager && this.player) {
        const hasPlank = this.player.inventory.plank > 0;
        if (!hasPlank) {
            this.ui.addNotification('❌ 木板不足!');
            return;
        }
        
        const expandable = this.raft.getExpandableCells(
            this.player.x, this.player.y,
            this.raft.offsetX, this.raft.offsetY
        );
        
        for (const cell of expandable) {
            const dist = Math.sqrt(
                (this.mouse.x - cell.px) ** 2 + 
                (this.mouse.y - cell.py) ** 2
            );
            if (dist < CELL_SIZE / 2) {
                if (this.raft.expand(cell.x, cell.y)) {
                    this.player.removeFromInventory('plank');
                    this.ui.addNotification('✅ 木筏扩建成功!');
                }
                break;
            }
        }
    } else if (this.itemManager) {
        this.itemManager.checkClick(this.mouse.x, this.mouse.y);
    }
});
```

- [ ] **Step 3: 修改 render() 显示可扩建位置**

```javascript
render() {
    this.dayNight.render(this.ctx, this.canvas.width, this.canvas.height);
    
    this.raft.render(this.ctx);
    
    // 建造模式下显示可扩建位置
    if (this.buildMode && this.player) {
        const expandable = this.raft.getExpandableCells(
            this.player.x, this.player.y,
            this.raft.offsetX, this.raft.offsetY
        );
        
        this.ctx.save();
        expandable.forEach(cell => {
            this.ctx.fillStyle = 'rgba(46, 204, 113, 0.5)';
            this.ctx.fillRect(cell.px - CELL_SIZE / 2, cell.py - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
            this.ctx.strokeStyle = '#2ecc71';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(cell.px - CELL_SIZE / 2, cell.py - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
        });
        this.ctx.restore();
    }
    
    this.itemManager.render(this.ctx);
    this.fishing.render(this.ctx, this.player);
    this.player.render(this.ctx);
    
    this.ui.render(this.ctx, this.player, this.dayNight, this.canvas.width, this.canvas.height);
}
```

- [ ] **Step 4: 测试运行**

按B进入建造模式，收集木板后点击绿色区域可以扩建木筏。

- [ ] **Step 5: 提交**

```bash
git add js/raft.js js/game.js
git commit -m "feat: 实现木筏扩建功能"
git push
```

---

## Task 10: 任务系统 (missions.js)

**Files:**
- Create: `js/missions.js`
- Modify: `js/game.js`

- [ ] **Step 1: 创建 js/missions.js**

```javascript
// 任务系统模块

export const MissionType = {
    MAIN: 'main',
    DAILY: 'daily',
    ACHIEVEMENT: 'achievement',
};

const MAIN_MISSIONS = [
    {
        id: 'collect_planks',
        title: '收集木板',
        description: '收集10个木板',
        type: MissionType.MAIN,
        target: { type: 'plank', count: 10 },
        reward: { type: 'plank', count: 5 },
        completed: false,
    },
    {
        id: 'expand_raft',
        title: '扩建木筏',
        description: '将木筏扩建到5x5',
        type: MissionType.MAIN,
        target: { type: 'raft_size', count: 25 },
        reward: { type: 'rope', count: 5 },
        completed: false,
    },
    {
        id: 'first_catch',
        title: '初次钓鱼',
        description: '成功钓到一条鱼',
        type: MissionType.MAIN,
        target: { type: 'fish', count: 1 },
        reward: { type: 'food', count: 3 },
        completed: false,
    },
    {
        id: 'survive_night',
        title: '度过夜晚',
        description: '存活到下一个白天',
        type: MissionType.MAIN,
        target: { type: 'survive', count: 1 },
        reward: { type: 'metal', count: 2 },
        completed: false,
    },
];

export class MissionManager {
    constructor() {
        this.missions = [...MAIN_MISSIONS];
        this.completedCount = {
            plank: 0,
            raft_size: 9, // 初始3x3
            fish: 0,
            survive: 0,
        };
        this.lastTimeOfDay = 'day';
    }
    
    update(player, dayNight) {
        // 检查任务进度
        this.completedCount.plank = player.inventory.plank;
        this.completedCount.raft_size = this.raftSize || 9;
        
        // 检查是否经历了昼夜变化
        if (this.lastTimeOfDay === 'night' && dayNight.currentTimeOfDay === 'day') {
            this.completedCount.survive++;
        }
        this.lastTimeOfDay = dayNight.currentTimeOfDay;
        
        // 检查任务完成
        this.missions.forEach(mission => {
            if (mission.completed) return;
            
            const progress = this.completedCount[mission.target.type] || 0;
            if (progress >= mission.target.count) {
                mission.completed = true;
                return { type: 'mission_complete', mission };
            }
        });
        
        return null;
    }
    
    setRaftSize(size) {
        this.raftSize = size;
    }
    
    getActiveMissions() {
        return this.missions.filter(m => !m.completed);
    }
    
    getCompletedMissions() {
        return this.missions.filter(m => m.completed);
    }
}
```

- [ ] **Step 2: 修改 js/game.js - 集成任务系统**

更新 import：
```javascript
import { MissionManager } from './missions.js';
```

在 constructor 中添加：
```javascript
this.missions = null;
```

更新 start() 方法：
```javascript
start() {
    this.raft = new Raft();
    this.player = new Player(this.raft);
    this.itemManager = new ItemManager();
    this.fishing = new FishingSystem();
    this.dayNight = new DayNightCycle();
    this.ui = new UIManager();
    this.missions = new MissionManager();
    this.state = GameState.PLAYING;
    this.lastTime = performance.now();
    this.gameLoop();
}
```

更新 update() 方法：
```javascript
update() {
    if (this.state !== GameState.PLAYING) return;
    
    this.player.update(this.deltaTime, this.keys);
    this.itemManager.update(this.deltaTime, this.canvas.width, this.canvas.height, this.player);
    this.fishing.update(this.deltaTime, this.keys, this.player, this.canvas.width, this.canvas.height);
    this.dayNight.update(this.deltaTime);
    this.ui.update(this.deltaTime);
    
    // 更新任务
    this.missions.setRaftSize(this.raft.width * this.raft.height);
    const missionEvent = this.missions.update(this.player, this.dayNight);
    if (missionEvent && missionEvent.type === 'mission_complete') {
        this.ui.addNotification(`🎉 任务完成: ${missionEvent.mission.title}`);
        // 发放奖励
        if (missionEvent.mission.reward) {
            this.player.addToInventory(
                missionEvent.mission.reward.type,
                missionEvent.mission.reward.count
            );
        }
    }
    
    // 处理钓鱼收获
    const catchResult = this.fishing.getCatch();
    if (catchResult) {
        if (catchResult.rarity === 'rare') {
            this.player.addToInventory('metal', 2);
            this.ui.addNotification('🎣 获得稀有金属 x2!');
        } else {
            this.player.addToInventory('food', 1);
            this.ui.addNotification('🎣 获得食物 x1');
            this.missions.completedCount.fish++;
        }
    }
}
```

- [ ] **Step 3: 测试运行**

应该能看到任务进度更新和完成通知。

- [ ] **Step 4: 提交**

```bash
git add js/missions.js js/game.js
git commit -m "feat: 实现任务系统"
git push
```

---

## Task 11: 完善与优化

- [ ] **Step 1: 修复已知问题**
- [ ] **Step 2: 添加音效提示（可选）**
- [ ] **Step 3: 优化性能**
- [ ] **Step 4: 最终测试**
- [ ] **Step 5: 提交最终版本**

```bash
git add -A
git commit -m "feat: 完成MVP版本"
git push
```

---

## 验收清单

- [ ] 俯视角渲染正常
- [ ] 玩家可以WASD移动
- [ ] 漂浮物从边缘漂来
- [ ] 点击可以收集物品
- [ ] 木筏扩建功能正常（按B进入建造模式）
- [ ] 钓鱼系统正常（空格蓄力抛竿）
- [ ] 昼夜循环视觉效果
- [ ] UI显示状态和资源
- [ ] 任务系统正常
- [ ] 游戏流畅运行（60fps）
