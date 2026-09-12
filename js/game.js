// 游戏主循环模块
import { CELL_SIZE } from './utils.js';
import { Player } from './player.js';
import { Raft } from './raft.js';
import { ItemManager } from './items.js';
import { FishingSystem } from './fishing.js';
import { DayNightCycle } from './daynight.js';
import { UIManager } from './ui.js';
import { MissionManager } from './missions.js';

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
        
        // 游戏对象
        this.player = null;
        this.raft = null;
        this.itemManager = null;
        this.fishing = null;
        this.dayNight = null;
        this.missions = null;
        this.ui = null;
        
        // 输入状态
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        // 建造模式
        this.buildMode = false;
        
        this.setupInput();
    }
    
    setupInput() {
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
    }
    
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
        
        this.player.update(this.deltaTime, this.keys);
        this.itemManager.update(this.deltaTime, this.canvas.width, this.canvas.height, this.player);
        this.fishing.update(this.deltaTime, this.keys, this.player, this.canvas.width, this.canvas.height);
        this.dayNight.update(this.deltaTime);
        this.ui.update(this.deltaTime);
        
        // 更新任务
        this.missions.setRaftSize(this.raft.width * this.raft.height);
        const completedMission = this.missions.update(this.player, this.dayNight);
        if (completedMission) {
            this.ui.addNotification(`🎉 任务完成: ${completedMission.title}`);
            // 发放奖励
            if (completedMission.reward) {
                this.player.addToInventory(
                    completedMission.reward.type,
                    completedMission.reward.count
                );
            }
        }
        
        // 处理钓鱼收获
        const catchResult = this.fishing.getCatch();
        if (catchResult) {
            // 根据稀有度给予奖励
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
}
