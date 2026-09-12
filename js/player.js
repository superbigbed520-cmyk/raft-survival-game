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
        
        // 移动状态
        this.isMoving = false;
        this.moveProgress = 0;
        this.startX = 0;
        this.startY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.targetGridX = 0;
        this.targetGridY = 0;
        
        this.updatePixelPosition();
    }
    
    updatePixelPosition() {
        this.x = this.raft.offsetX + this.gridX * CELL_SIZE + CELL_SIZE / 2;
        this.y = this.raft.offsetY + this.gridY * CELL_SIZE + CELL_SIZE / 2;
    }
    
    update(deltaTime, keys) {
        // 格子移动（每次移动一格）
        if (!this.isMoving) {
            let dx = 0;
            let dy = 0;
            
            if (keys['w'] || keys['arrowup']) {
                dy = -1;
                this.facing = 'up';
            } else if (keys['s'] || keys['arrowdown']) {
                dy = 1;
                this.facing = 'down';
            } else if (keys['a'] || keys['arrowleft']) {
                dx = -1;
                this.facing = 'left';
            } else if (keys['d'] || keys['arrowright']) {
                dx = 1;
                this.facing = 'right';
            }
            
            if (dx !== 0 || dy !== 0) {
                const newGridX = this.gridX + dx;
                const newGridY = this.gridY + dy;
                
                if (this.raft.hasCell(newGridX, newGridY)) {
                    this.targetGridX = newGridX;
                    this.targetGridY = newGridY;
                    this.isMoving = true;
                    this.moveProgress = 0;
                    this.startX = this.x;
                    this.startY = this.y;
                    this.targetX = this.raft.offsetX + newGridX * CELL_SIZE + CELL_SIZE / 2;
                    this.targetY = this.raft.offsetY + newGridY * CELL_SIZE + CELL_SIZE / 2;
                }
            }
        }
        
        // 移动动画
        if (this.isMoving) {
            this.moveProgress += deltaTime * 10; // 移动速度
            
            if (this.moveProgress >= 1) {
                this.moveProgress = 1;
                this.gridX = this.targetGridX;
                this.gridY = this.targetGridY;
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
            } else {
                // 线性插值
                this.x = this.startX + (this.targetX - this.startX) * this.moveProgress;
                this.y = this.startY + (this.targetY - this.startY) * this.moveProgress;
            }
        }
        
        // 更新饥饿和口渴（降低消耗速度）
        this.hunger = clamp(this.hunger - deltaTime * 0.5, 0, 100);
        this.thirst = clamp(this.thirst - deltaTime * 0.7, 0, 100);
        
        // 饥饿或口渴为0时掉血（降低掉血速度）
        if (this.hunger === 0 || this.thirst === 0) {
            this.health = clamp(this.health - deltaTime * 3, 0, 100);
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
