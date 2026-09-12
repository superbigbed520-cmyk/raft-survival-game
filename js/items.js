// 漂浮物系统模块
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
        this.size = type.rarity === 'rare' ? 20 : 15;
        this.lifetime = 30; // 30秒后消失
        this.collected = false;
        this.collectAnim = 0;
    }
    
    update(deltaTime, raft, player) {
        if (this.collected) {
            // 收集动画：飞向玩家
            this.collectAnim += deltaTime * 5;
            if (this.collectAnim >= 1) {
                player.addToInventory(this.type.name === '木板' ? 'plank' : 
                                     this.type.name === '塑料' ? 'plastic' :
                                     this.type.name === '绳子' ? 'rope' :
                                     this.type.name === '食物' ? 'food' :
                                     this.type.name === '金属' ? 'metal' : 'plank');
                return false; // 移除物品
            }
            // 插值到玩家位置
            this.x += (player.x - this.x) * this.collectAnim;
            this.y += (player.y - this.y) * this.collectAnim;
            return true;
        }
        
        // 漂流
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // 减速
        this.vx *= 0.99;
        this.vy *= 0.99;
        
        // 消失计时
        this.lifetime -= deltaTime;
        return this.lifetime > 0;
    }
    
    checkClick(mouseX, mouseY) {
        if (this.collected) return false;
        return distance(mouseX, mouseY, this.x, this.y) < this.size + 10;
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
        
        switch (this.type.shape) {
            case 'rect': // 木板 - 方形
                ctx.fillRect(this.x - this.size, this.y - this.size / 2, this.size * 2, this.size);
                ctx.strokeRect(this.x - this.size, this.y - this.size / 2, this.size * 2, this.size);
                break;
            case 'triangle': // 塑料 - 三角形
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x + this.size, this.y + this.size);
                ctx.lineTo(this.x - this.size, this.y + this.size);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'circle': // 绳子 - 圆环
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'star': // 食物 - 星形
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const x = this.x + Math.cos(angle) * this.size;
                    const y = this.y + Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'diamond': // 金属 - 菱形
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x + this.size, this.y);
                ctx.lineTo(this.x, this.y + this.size);
                ctx.lineTo(this.x - this.size, this.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'chest': // 宝箱 - 方形带装饰
                ctx.fillRect(this.x - this.size, this.y - this.size * 0.7, this.size * 2, this.size * 1.4);
                ctx.strokeRect(this.x - this.size, this.y - this.size * 0.7, this.size * 2, this.size * 1.4);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x - 3, this.y - this.size * 0.7, 6, this.size * 1.4);
                break;
        }
        
        // 绘制图标
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.type.icon, this.x, this.y);
        
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
        this.spawnInterval = 2; // 每2秒生成一个
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
            item.update(deltaTime, null, player)
        );
    }
    
    spawnItem(canvasWidth, canvasHeight) {
        // 随机选择类型
        const types = Object.values(ItemType);
        const type = Math.random() < 0.8 
            ? types[randomInt(0, 3)]  // 80%普通
            : types[randomInt(4, 5)]; // 20%稀有
        
        // 随机位置（屏幕边缘）
        const side = randomInt(0, 3);
        let x, y;
        switch (side) {
            case 0: // 上
                x = randomRange(0, canvasWidth);
                y = -20;
                break;
            case 1: // 右
                x = canvasWidth + 20;
                y = randomRange(0, canvasHeight);
                break;
            case 2: // 下
                x = randomRange(0, canvasWidth);
                y = canvasHeight + 20;
                break;
            case 3: // 左
                x = -20;
                y = randomRange(0, canvasHeight);
                break;
        }
        
        const item = new FloatingItem(type, x, y);
        
        // 朝向画布中心漂移
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const angle = Math.atan2(centerY - y, centerX - x);
        item.vx = Math.cos(angle) * randomRange(20, 50);
        item.vy = Math.sin(angle) * randomRange(20, 50);
        
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
