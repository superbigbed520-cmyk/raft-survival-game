// 玩家系统模块（侧视角）
import { CELL_SIZE, clamp } from './utils.js';

export class Player {
    constructor(raft) {
        this.raft = raft;
        
        // 位置
        this.x = 400; // 像素位置
        this.y = 300;
        this.width = 24;
        this.height = 32;
        
        // 速度
        this.vx = 0;
        this.vy = 0;
        this.speed = 200; // 水平速度
        this.jumpForce = -350; // 跳跃力度
        this.gravity = 800; // 重力
        
        // 状态
        this.isGrounded = false;
        this.isJumping = false;
        this.isInWater = false;
        this.swimSpeed = 150;
        
        // 属性
        this.hunger = 100;
        this.thirst = 100;
        this.health = 100;
        
        // 背包
        this.inventory = {
            plank: 0,
            plastic: 0,
            rope: 0,
            food: 0,
            metal: 0,
        };
        
        // 动画
        this.facing = 'right'; // left, right
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    update(deltaTime, keys) {
        // 水平移动
        this.vx = 0;
        if (keys['a'] || keys['arrowleft']) {
            this.vx = this.isInWater ? -this.swimSpeed : -this.speed;
            this.facing = 'left';
        }
        if (keys['d'] || keys['arrowright']) {
            this.vx = this.isInWater ? this.swimSpeed : this.speed;
            this.facing = 'right';
        }
        
        // 跳跃/游泳
        if (keys['w'] || keys['arrowup'] || keys[' ']) {
            if (this.isGrounded) {
                // 陆地跳跃
                this.vy = this.jumpForce;
                this.isGrounded = false;
                this.isJumping = true;
            } else if (this.isInWater) {
                // 水中上浮
                this.vy = -this.swimSpeed;
            }
        }
        
        // 应用重力/浮力
        if (this.isInWater) {
            // 水中：轻微浮力 + 减速
            this.vy += this.gravity * 0.3 * deltaTime; // 较小的重力
            this.vy *= 0.95; // 水阻尼
            this.vx *= 0.98;
            
            // 限制水中速度
            this.vy = clamp(this.vy, -this.swimSpeed, this.swimSpeed * 0.5);
        } else if (!this.isGrounded) {
            // 空中：正常重力
            this.vy += this.gravity * deltaTime;
        }
        
        // 更新位置
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // 水面检测（420是水面位置）
        const waterLevel = 420;
        this.isInWater = this.y + this.height > waterLevel;
        
        // 碰撞检测（与木筏平台）
        this.isGrounded = false;
        const platforms = this.raft.getPlatforms();
        
        for (const platform of platforms) {
            // 检查是否站在平台上
            if (this.x + this.width > platform.x && 
                this.x < platform.x + platform.width &&
                this.y + this.height >= platform.y &&
                this.y + this.height <= platform.y + 20 &&
                this.vy >= 0) {
                
                this.y = platform.y - this.height;
                this.vy = 0;
                this.isGrounded = true;
                this.isJumping = false;
                this.isInWater = false;
            }
        }
        
        // 边界限制
        this.x = clamp(this.x, 0, 800 - this.width);
        this.y = clamp(this.y, 0, 600);
        
        // 更新饥饿和口渴
        this.hunger = clamp(this.hunger - deltaTime * 0.3, 0, 100);
        this.thirst = clamp(this.thirst - deltaTime * 0.4, 0, 100);
        
        // 饥饿或口渴为0时掉血
        if (this.hunger === 0 || this.thirst === 0) {
            this.health = clamp(this.health - deltaTime * 2, 0, 100);
        }
        
        // 动画计时
        this.animTimer += deltaTime;
        if (this.animTimer > 0.15) {
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
        ctx.save();
        
        // 翻转方向
        if (this.facing === 'left') {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(this.x, this.y);
        }
        
        // 如果在水中，绘制游泳效果
        if (this.isInWater) {
            // 水波效果
            ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            ctx.beginPath();
            ctx.ellipse(this.width / 2, this.height - 5, 15, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 身体
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(4, 8, 16, 18);
        
        // 头
        ctx.fillStyle = '#f5cba7';
        ctx.fillRect(6, 0, 12, 12);
        
        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.fillRect(14, 3, 5, 5);
        ctx.fillStyle = '#000';
        ctx.fillRect(16, 4, 2, 3);
        
        // 腿（游泳时有不同动画）
        ctx.fillStyle = '#2c3e50';
        if (this.isInWater) {
            // 游泳腿部动画
            const swimOffset = Math.sin(this.animTimer * 8) * 4;
            ctx.fillRect(6, 26, 5, 6 + swimOffset);
            ctx.fillRect(13, 26, 5, 6 - swimOffset);
        } else {
            const legOffset = this.isGrounded ? Math.sin(this.animFrame * Math.PI / 2) * 3 : 2;
            ctx.fillRect(6, 26, 5, 6 + legOffset);
            ctx.fillRect(13, 26, 5, 6 - legOffset);
        }
        
        // 手臂（游泳时划水）
        ctx.fillStyle = '#f5cba7';
        if (this.isInWater) {
            // 游泳手臂动画
            const armOffset = Math.sin(this.animTimer * 8) * 5;
            ctx.fillRect(0, 12 + armOffset, 6, 4);
            ctx.fillRect(18, 12 - armOffset, 6, 4);
        } else if (!this.isGrounded) {
            ctx.fillRect(0, 12, 6, 4);
            ctx.fillRect(18, 12, 6, 4);
        } else if (this.vx !== 0) {
            ctx.fillRect(0, 12 + Math.sin(this.animTimer * 10) * 3, 6, 4);
            ctx.fillRect(18, 12 - Math.sin(this.animTimer * 10) * 3, 6, 4);
        } else {
            ctx.fillRect(0, 12, 6, 4);
            ctx.fillRect(18, 12, 6, 4);
        }
        
        ctx.restore();
    }
}
