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
        this.x = this.raft.offsetX + this.gridX * CELL_SIZE + CELL_SIZE / 2;
        this.y = this.raft.offsetY + this.gridY * CELL_SIZE + CELL_SIZE / 2;
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
