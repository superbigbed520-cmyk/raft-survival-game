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
                    const dist = (this.charge / 100) * maxDistance;
                    const angle = Math.atan2(player.y - canvasHeight / 2, 
                                           player.x - canvasWidth / 2);
                    this.hookTargetX = player.x - Math.cos(angle) * dist;
                    this.hookTargetY = player.y - Math.sin(angle) * dist;
                }
                break;
                
            case FishingState.CASTING:
                // 鱼钩飞向目标
                const dx = this.hookTargetX - this.hookX;
                const dy = this.hookTargetY - this.hookY;
                const castDist = Math.sqrt(dx * dx + dy * dy);
                
                if (castDist < 5) {
                    this.hookX = this.hookTargetX;
                    this.hookY = this.hookTargetY;
                    this.state = FishingState.WAITING;
                    this.waitTimer = randomRange(1, 5);
                } else {
                    this.hookX += (dx / castDist) * 300 * deltaTime;
                    this.hookY += (dy / castDist) * 300 * deltaTime;
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
