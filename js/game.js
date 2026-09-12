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
