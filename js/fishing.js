// 钓鱼系统模块（侧视角）
import { randomRange } from './utils.js';

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
        this.lineLength = 0; // 鱼线长度
        this.hookX = 0;
        this.hookY = 0;
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
                if (keys['f'] || keys['enter']) {
                    this.state = FishingState.CHARGING;
                    this.charge = 0;
                }
                break;
                
            case FishingState.CHARGING:
                this.charge = Math.min(this.charge + deltaTime * 120, 100);
                if (!keys['f'] && !keys['enter']) {
                    // 松开按键，抛竿
                    this.state = FishingState.CASTING;
                    this.hookX = player.x + player.width / 2;
                    this.hookY = player.y + player.height;
                    this.lineLength = 0;
                }
                break;
                
            case FishingState.CASTING:
                // 鱼钩向下延伸
                this.lineLength += 200 * deltaTime;
                this.hookY = player.y + player.height + this.lineLength;
                
                if (this.lineLength >= (this.charge / 100) * 200 + 50) {
                    this.state = FishingState.WAITING;
                    this.waitTimer = randomRange(2, 6);
                }
                break;
                
            case FishingState.WAITING:
                this.waitTimer -= deltaTime;
                // 鱼钩轻微晃动
                this.hookX = player.x + player.width / 2 + Math.sin(Date.now() / 300) * 5;
                
                if (this.waitTimer <= 0) {
                    this.state = FishingState.HOOKED;
                    this.hookedTimer = 0.8; // 0.8秒内点击
                }
                break;
                
            case FishingState.HOOKED:
                this.hookedTimer -= deltaTime;
                // 鱼钩剧烈晃动
                this.hookX = player.x + player.width / 2 + Math.sin(Date.now() / 100) * 10;
                
                if (this.hookedTimer <= 0) {
                    // 超时，跑鱼
                    this.reset();
                } else if (keys['f'] || keys['enter']) {
                    // 成功钓到！
                    this.state = FishingState.REELING;
                    this.catchSuccess = true;
                }
                break;
                
            case FishingState.REELING:
                // 收杆动画
                this.lineLength -= 300 * deltaTime;
                this.hookY = player.y + player.height + this.lineLength;
                
                if (this.lineLength <= 0) {
                    // 收杆完成
                    this.reset();
                }
                break;
        }
    }
    
    reset() {
        this.state = FishingState.IDLE;
        this.lineLength = 0;
        this.cooldown = 2; // 2秒冷却
        this.catchSuccess = false;
    }
    
    getCatch() {
        if (this.catchSuccess) {
            // 根据蓄力值决定稀有度
            const rarity = this.charge > 80 ? 'rare' : this.charge > 50 ? 'uncommon' : 'common';
            this.catchSuccess = false; // 消耗结果，防止重复触发
            this.charge = 0;
            return { rarity };
        }
        return null;
    }
    
    render(ctx, player) {
        if (this.state === FishingState.IDLE) return;
        
        ctx.save();
        
        const hookX = this.hookX;
        const hookY = this.hookY;
        const playerX = player.x + player.width / 2;
        const playerY = player.y + player.height;
        
        // 绘制鱼竿
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(playerX, playerY - 10);
        ctx.lineTo(playerX + 20, playerY - 20);
        ctx.stroke();
        
        // 绘制鱼线
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(playerX + 20, playerY - 20);
        ctx.lineTo(hookX, hookY);
        ctx.stroke();
        
        // 绘制鱼钩
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.arc(hookX, hookY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制鱼钩倒刺
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hookX, hookY + 4);
        ctx.lineTo(hookX - 3, hookY + 8);
        ctx.moveTo(hookX, hookY + 4);
        ctx.lineTo(hookX + 3, hookY + 8);
        ctx.stroke();
        
        // 绘制蓄力条
        if (this.state === FishingState.CHARGING) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(playerX - 30, playerY - 50, 60, 12);
            
            const chargeWidth = (this.charge / 100) * 56;
            ctx.fillStyle = this.charge > 80 ? '#2ecc71' : this.charge > 50 ? '#f39c12' : '#e74c3c';
            ctx.fillRect(playerX - 28, playerY - 48, chargeWidth, 8);
        }
        
        // 绘制上钩提示
        if (this.state === FishingState.HOOKED) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', hookX, hookY - 20);
            
            // 绘制提示文字
            ctx.font = '14px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText('按 F 收杆!', hookX, hookY - 40);
        }
        
        // 绘制操作提示
        if (this.state === FishingState.IDLE) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(playerX - 40, playerY - 70, 80, 20);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('按 F 钓鱼', playerX, playerY - 56);
        }
        
        ctx.restore();
    }
}
