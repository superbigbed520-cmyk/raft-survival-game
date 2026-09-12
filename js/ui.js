// UI系统模块

export class UIManager {
    constructor() {
        this.notifications = [];
    }
    
    addNotification(text, duration = 3) {
        this.notifications.push({
            text,
            timer: duration,
            alpha: 1,
        });
    }
    
    update(deltaTime) {
        // 更新通知
        this.notifications = this.notifications.filter(n => {
            n.timer -= deltaTime;
            if (n.timer < 1) {
                n.alpha = n.timer;
            }
            return n.timer > 0;
        });
    }
    
    render(ctx, player, dayNight, canvasWidth, canvasHeight) {
        ctx.save();
        
        // 状态栏背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 80);
        
        // 生命值
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20, 20, player.health * 1.5, 15);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(20, 20, 150, 15);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`❤️ ${Math.floor(player.health)}`, 25, 32);
        
        // 饥饿值
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(20, 40, player.hunger * 1.5, 15);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(20, 40, 150, 15);
        ctx.fillStyle = '#fff';
        ctx.fillText(`🍖 ${Math.floor(player.hunger)}`, 25, 52);
        
        // 口渴值
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 60, player.thirst * 1.5, 15);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(20, 60, 150, 15);
        ctx.fillStyle = '#fff';
        ctx.fillText(`💧 ${Math.floor(player.thirst)}`, 25, 72);
        
        // 资源栏背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvasWidth - 180, 10, 170, 100);
        
        // 资源数量
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        const resources = [
            { icon: '🪵', name: '木板', count: player.inventory.plank },
            { icon: '📦', name: '塑料', count: player.inventory.plastic },
            { icon: '🧵', name: '绳子', count: player.inventory.rope },
            { icon: '🍖', name: '食物', count: player.inventory.food },
            { icon: '⚙️', name: '金属', count: player.inventory.metal },
        ];
        
        resources.forEach((res, i) => {
            const y = 30 + i * 18;
            ctx.fillText(`${res.icon} ${res.name}: ${res.count}`, canvasWidth - 170, y);
        });
        
        // 时间显示
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvasWidth / 2 - 50, 10, 100, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        const timeText = dayNight.currentTimeOfDay === 'day' ? '☀️ 白天' :\n                        dayNight.currentTimeOfDay === 'dusk' ? '🌅 黄昏' : '🌙 夜晚';
        ctx.fillText(timeText, canvasWidth / 2, 30);
        
        // 操作提示
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, canvasHeight - 50, 250, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('WASD: 移动 | 空格: 钓鱼 | 点击: 拾取', 20, canvasHeight - 25);
        
        // 通知
        this.notifications.forEach((n, i) => {
            ctx.globalAlpha = n.alpha;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(canvasWidth / 2 - 100, canvasHeight - 100 - i * 40, 200, 35);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(n.text, canvasWidth / 2, canvasHeight - 77 - i * 40);
        });
        
        ctx.restore();
    }
}
