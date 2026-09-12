// 游戏主循环模块
import { CELL_SIZE } from './utils.js';
import { Player } from './player.js';
import { Raft } from './raft.js';
import { ItemManager } from './items.js';
import { FishingSystem } from './fishing.js';
import { DayNightCycle } from './daynight.js';
import { UIManager } from './ui.js';
import { MissionManager } from './missions.js';
import { Workbench } from './workbench.js';
import { InventoryUI } from './inventory.js';
import { PauseMenu } from './pause.js';

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
        this.activeWorkbench = null;
        this.inventoryUI = null;
        this.pauseMenu = null;
        
        // 输入状态
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        // 建造模式
        this.buildMode = false;
        this.placingWorkbench = false;
        
        // 背包
        this.showBag = false;
        
        this.setupInput();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // ESC键 - 暂停菜单
            if (e.key === 'Escape') {
                if (this.pauseMenu && this.pauseMenu.isPaused) {
                    this.pauseMenu.toggle();
                    this.state = GameState.PLAYING;
                } else if (this.activeWorkbench && this.activeWorkbench.isOpen) {
                    this.activeWorkbench.isOpen = false;
                    this.activeWorkbench = null;
                } else if (this.showBag) {
                    this.showBag = false;
                } else if (this.state === GameState.PLAYING) {
                    this.pauseMenu.toggle();
                    this.state = GameState.PAUSED;
                }
            }
            
            // 只有在游戏未暂停时才处理其他按键
            if (this.state !== GameState.PLAYING && this.state !== GameState.PAUSED) {
                return;
            }
            
            // 暂停菜单处理
            if (this.pauseMenu && this.pauseMenu.isPaused) {
                const action = this.pauseMenu.handleInput(this.keys);
                if (action) {
                    this.handlePauseAction(action);
                }
                return;
            }
            
            // 按B进入/退出建造模式
            if (e.key.toLowerCase() === 'b' && this.state === GameState.PLAYING) {
                this.buildMode = !this.buildMode;
                this.placingWorkbench = false;
                if (this.ui) {
                    this.ui.addNotification(this.buildMode ? '🔨 建造模式开启 (按W放置工作台)' : '🔨 建造模式关闭');
                }
            }
            
            // 建造模式下按W放置工作台
            if (this.buildMode && e.key.toLowerCase() === 'w' && this.state === GameState.PLAYING) {
                this.placingWorkbench = !this.placingWorkbench;
                if (this.placingWorkbench) {
                    this.ui.addNotification('🔨 点击放置工作台 (需要: 木板x10 + 金属x2)');
                }
            }
            
            // 按E打开/关闭工作台
            if (e.key.toLowerCase() === 'e' && this.state === GameState.PLAYING) {
                if (this.activeWorkbench) {
                    this.activeWorkbench.isOpen = !this.activeWorkbench.isOpen;
                    if (!this.activeWorkbench.isOpen) {
                        this.activeWorkbench = null;
                    }
                } else {
                    // 检查附近的工作台
                    for (const workbench of this.raft.getWorkbenches()) {
                        if (workbench.isPlayerNear(this.player)) {
                            this.activeWorkbench = workbench;
                            this.activeWorkbench.isOpen = true;
                            break;
                        }
                    }
                }
            }
            
            // TAB打开/关闭背包
            if (e.key === 'Tab' && this.state === GameState.PLAYING) {
                this.showBag = !this.showBag;
                e.preventDefault();
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
            if (this.state !== GameState.PLAYING) return;
            
            this.mouse.clicked = true;
            
            // 工作台UI点击
            if (this.activeWorkbench && this.activeWorkbench.isOpen) {
                const result = this.activeWorkbench.handleClick(
                    this.mouse.x, this.mouse.y, this.player.inventory
                );
                if (result) {
                    this.ui.addNotification(`✅ 合成成功: ${result.name} x${result.amount}`);
                    
                    // 应用消耗品效果
                    if (result.effect && result.effect.type === 'consumable') {
                        switch (result.effect.value) {
                            case 'health':
                                this.player.health = Math.min(100, this.player.health + result.effect.amount);
                                break;
                            case 'hunger':
                                this.player.hunger = Math.min(100, this.player.hunger + result.effect.amount);
                                break;
                            case 'thirst':
                                this.player.thirst = Math.min(100, this.player.thirst + result.effect.amount);
                                break;
                        }
                    }
                    
                    // 应用工具效果
                    if (result.effect && result.effect.type === 'tool') {
                        this.player.hasTool = result.effect.value;
                    }
                }
                return;
            }
            
            // 建造模式下点击扩建
            if (this.buildMode && this.itemManager && this.player) {
                if (this.placingWorkbench) {
                    // 放置工作台
                    if (this.player.inventory.plank >= 10 && this.player.inventory.metal >= 2) {
                        this.player.removeFromInventory('plank', 10);
                        this.player.removeFromInventory('metal', 2);
                        this.raft.addWorkbench(this.mouse.x - 20, this.mouse.y - 20);
                        this.ui.addNotification('✅ 工作台放置成功!');
                        this.placingWorkbench = false;
                    } else {
                        this.ui.addNotification('❌ 材料不足! 需要: 木板x10 + 金属x2');
                    }
                    return;
                }
                
                const hasPlank = this.player.inventory.plank > 0;
                if (!hasPlank) {
                    this.ui.addNotification('❌ 木板不足!');
                    return;
                }
                
                const expandable = this.raft.getExpandablePositions(
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height / 2
                );
                
                for (const pos of expandable) {
                    const dist = Math.sqrt(
                        (this.mouse.x - pos.x - CELL_SIZE / 2) ** 2 + 
                        (this.mouse.y - pos.y - CELL_SIZE / 2) ** 2
                    );
                    if (dist < CELL_SIZE) {
                        if (this.raft.expand(pos.direction)) {
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
    
    handlePauseAction(action) {
        switch (action) {
            case 'resume':
                this.pauseMenu.toggle();
                this.state = GameState.PLAYING;
                break;
            case 'recipes':
                // 打开工作台界面（如果有）
                this.pauseMenu.toggle();
                this.state = GameState.PLAYING;
                this.ui.addNotification('📖 靠近工作台按E查看合成图纸');
                break;
            case 'controls':
                this.pauseMenu.toggle();
                this.state = GameState.PLAYING;
                this.ui.addNotification('🎮 操作说明已显示在底部');
                break;
            case 'quit':
                // 重新开始游戏
                this.pauseMenu.toggle();
                this.state = GameState.PLAYING;
                this.start();
                break;
        }
    }
    
    start() {
        this.raft = new Raft();
        this.player = new Player(this.raft);
        this.itemManager = new ItemManager();
        this.fishing = new FishingSystem();
        this.dayNight = new DayNightCycle();
        this.ui = new UIManager();
        this.missions = new MissionManager();
        this.inventoryUI = new InventoryUI();
        this.pauseMenu = new PauseMenu();
        this.state = GameState.PLAYING;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop() {
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 只在游戏运行时更新
        if (this.state === GameState.PLAYING) {
            this.update();
        }
        
        this.render();
        
        this.mouse.clicked = false;
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // 暂停时不更新
        if (this.pauseMenu && this.pauseMenu.isPaused) return;
        
        // 只有在工作台和背包未打开时才更新玩家
        if ((!this.activeWorkbench || !this.activeWorkbench.isOpen) && !this.showBag) {
            this.player.update(this.deltaTime, this.keys);
            
            // 更新物品栏
            this.inventoryUI.update(this.keys, this.player);
            
            // 检查是否使用了物品
            if (this.keys['q']) {
                const result = this.inventoryUI.useItem(this.player);
                if (result && result.success) {
                    this.ui.addNotification(result.message);
                }
                this.keys['q'] = false;
            }
        }
        
        this.itemManager.update(this.deltaTime, this.canvas.width, this.canvas.height, this.player);
        this.fishing.update(this.deltaTime, this.keys, this.player, this.canvas.width, this.canvas.height);
        this.dayNight.update(this.deltaTime);
        this.ui.update(this.deltaTime);
        
        // 更新任务
        this.missions.setRaftSize(this.raft.width * this.raft.height);
        const completedMission = this.missions.update(this.player, this.dayNight);
        if (completedMission) {
            this.ui.addNotification(`🎉 任务完成: ${completedMission.title}`);
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
        // 背景
        this.dayNight.render(this.ctx, this.canvas.width, this.canvas.height);
        
        // 木筏
        this.raft.render(this.ctx);
        
        // 物品
        this.itemManager.render(this.ctx);
        
        // 钓鱼
        this.fishing.render(this.ctx, this.player);
        
        // 玩家
        this.player.render(this.ctx);
        
        // 工作台放置提示
        if (this.placingWorkbench) {
            this.ctx.fillStyle = 'rgba(46, 204, 113, 0.5)';
            this.ctx.fillRect(this.mouse.x - 20, this.mouse.y - 20, 40, 40);
            this.ctx.strokeStyle = '#2ecc71';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.mouse.x - 20, this.mouse.y - 20, 40, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🔨', this.mouse.x, this.mouse.y + 7);
        }
        
        // 工作台UI
        if (this.activeWorkbench && this.activeWorkbench.isOpen) {
            this.activeWorkbench.renderUI(
                this.ctx, 
                this.player.inventory, 
                this.canvas.width, 
                this.canvas.height
            );
        }
        
        // 背包UI
        if (this.showBag) {
            this.inventoryUI.renderBag(this.ctx, this.player, this.canvas.width, this.canvas.height);
        }
        
        // 快捷栏（最上层）
        this.inventoryUI.renderQuickSlots(this.ctx, this.player, this.canvas.width, this.canvas.height);
        
        // UI
        this.ui.render(this.ctx, this.player, this.dayNight, this.canvas.width, this.canvas.height);
        
        // 暂停菜单（最最上层）
        if (this.pauseMenu) {
            this.pauseMenu.render(this.ctx, this.canvas.width, this.canvas.height);
        }
    }
}
