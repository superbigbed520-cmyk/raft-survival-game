// 漂浮物系统模块（侧视角）
import { randomRange, randomInt, distance } from './utils.js';

export const ItemType = {
    PLANK: { name: '木板', color: '#8B4513', rarity: 'common', shape: 'rect', icon: '🪵' },
    PLASTIC: { name: '塑料', color: '#3498db', rarity: 'common', shape: 'triangle', icon: '📦' },
    ROPE: { name: '绳子', color: '#f39c12', rarity: 'common', shape: 'circle', icon: '🧵' },
    FOOD: { name: '食物', color: '#e74c3c', rarity: 'common', shape: 'star', icon: '🍖' },
    METAL: { name: '金属', color: '#95a5a6', rarity: 'rare', shape: 'diamond', icon: '⚙️' },
    CHEST: { name: '宝箱', color: '#f1c40f', rarity: 'rare', shape: 'chest', icon: '🎁' },
};

class FloatingItem {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.size = type.rarity === 'rare' ? 24 : 18;
        this.lifetime = 45; // 45秒后消失
        this.collected = false;
        this.collectAnim = 0;
        this.bobOffset = Math.random() * Math.PI * 2; // 漂浮动画偏移
    }
    
    update(deltaTime, player) {
        if (this.collected) {
            // 收集动画：飞向玩家
            this.collectAnim += deltaTime * 5;
            if (this.collectAnim >= 1) {
                const inventoryType = this.type.name === '木板' ? 'plank' : 
                                    this.type.name === '塑料' ? 'plastic' :
                                    this.type.name === '绳子' ? 'rope' :
                                    this.type.name === '食物' ? 'food' :
                                    this.type.name === '金属' ? 'metal' : 'plank';
                player.addToInventory(inventoryType);
                return false;
            }
            // 插值到玩家位置
            const targetX = player.x + player.width / 2;
            const targetY = player.y + player.height / 2;
            this.x += (targetX - this.x) * this.collectAnim * 0.1;
            this.y += (targetY - this.y) * this.collectAnim * 0.1;
            return true;
        }
        
        // 漂流
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // 漂浮动画
        this.y += Math.sin(Date.now() / 500 + this.bobOffset) * 0.5;
        
        // 减速
        this.vx *= 0.995;
        
        // 消失计时
        this.lifetime -= deltaTime;
        return this.lifetime > 0 && this.x > -50 && this.x < 850;
    }
    
    checkClick(mouseX, mouseY) {
        if (this.collected) return false;
        return distance(mouseX, mouseY, this.x + this.size / 2, this.y + this.size / 2) < this.size + 15;
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
        
        // 绘制不同形状的物品
        ctx.fillStyle = this.type.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;
        
        switch (this.type.shape) {
            case 'rect': // 木板 - 方形
                ctx.fillRect(this.x, this.y, this.size * 1.5, this.size * 0.8);
                ctx.strokeRect(this.x, this.y, this.size * 1.5, this.size * 0.8);
                break;
            case 'triangle': // 塑料 - 三角形
                ctx.beginPath();
                ctx.moveTo(centerX, this.y);
                ctx.lineTo(this.x + this.size, this.y + this.size);
                ctx.lineTo(this.x, this.y + this.size);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'circle': // 绳子 - 圆环
                ctx.beginPath();
                ctx.arc(centerX, centerY, this.size / 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(centerX, centerY, this.size / 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'star': // 食物 - 星形
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const x = centerX + Math.cos(angle) * this.size / 2;
                    const y = centerY + Math.sin(angle) * this.size / 2;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'diamond': // 金属 - 菱形
                ctx.beginPath();
                ctx.moveTo(centerX, this.y);
                ctx.lineTo(this.x + this.size, centerY);
                ctx.lineTo(centerX, this.y + this.size);
                ctx.lineTo(this.x, centerY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'chest': // 宝箱 - 方形带装饰
                ctx.fillRect(this.x, this.y, this.size, this.size * 0.8);
                ctx.strokeRect(this.x, this.y, this.size, this.size * 0.8);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(centerX - 2, this.y, 4, this.size * 0.8);
                break;
        }
        
        // 绘制图标
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.type.icon, centerX, centerY);
        
        // 稀有物品闪烁边框
        if (this.type.rarity === 'rare') {
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

export class ItemManager {
    constructor() {
        this.items = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2.5; // 每2.5秒生成一个
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
            item.update(deltaTime, player)
        );
    }
    
    spawnItem(canvasWidth, canvasHeight) {
        // 随机选择类型
        const types = Object.values(ItemType);
        const type = Math.random() < 0.8 
            ? types[randomInt(0, 3)]  // 80%普通
            : types[randomInt(4, 5)]; // 20%稀有
        
        // 从海面漂来（420是水面位置）
        const waterLevel = 425;
        const fromLeft = Math.random() > 0.5;
        
        const x = fromLeft ? -30 : canvasWidth + 30;
        const y = waterLevel + randomRange(-10, 20); // 在水面附近漂浮
        
        const item = new FloatingItem(type, x, y);
        
        // 海流方向（从左到右或从右到左）
        const direction = fromLeft ? 1 : -1;
        item.vx = direction * randomRange(30, 60);
        item.vy = 0; // 水平漂浮
        
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
