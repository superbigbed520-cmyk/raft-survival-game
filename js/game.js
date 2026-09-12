// 游戏主循环模块
import { CELL_SIZE } from './utils.js';
import { Player } from './player.js';
import { Raft } from './raft.js';
import { ItemManager } from './items.js';
import { FishingSystem } from './fishing.js';

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
        
        // 建造模式
        this.buildMode = false;
        
        this.itemManager = null;
        this.fishing = null;
        
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
            if (this.itemManager) {
                this.itemManager.checkClick(this.mouse.x, this.mouse.y);
            }
        });
    }
    
    start() {
        this.raft = new Raft();
        this.player = new Player(this.raft);
        this.itemManager = new ItemManager();
        this.fishing = new FishingSystem();
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
    
    render() {
        // 清空画布
        this.ctx.fillStyle = '#4a90a4';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.raft.render(this.ctx);
        this.itemManager.render(this.ctx);
        this.fishing.render(this.ctx, this.player);
        this.player.render(this.ctx);
    }
}
