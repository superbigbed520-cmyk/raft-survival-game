// 昼夜循环系统模块

export const TimeOfDay = {
    DAY: 'day',
    DUSK: 'dusk',
    NIGHT: 'night',
};

export class DayNightCycle {
    constructor() {
        this.time = 0; // 0-120秒
        this.cycleDuration = 120; // 完整周期2分钟
        this.currentTimeOfDay = TimeOfDay.DAY;
        
        // 颜色配置
        this.colors = {
            day: { sky: '#87CEEB', overlay: 'rgba(0, 0, 0, 0)' },
            dusk: { sky: '#FF7F50', overlay: 'rgba(255, 100, 0, 0.2)' },
            night: { sky: '#191970', overlay: 'rgba(0, 0, 50, 0.5)' },
        };
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        if (this.time >= this.cycleDuration) {
            this.time = 0;
        }
        
        // 判断时间段
        if (this.time < 60) {
            this.currentTimeOfDay = TimeOfDay.DAY;
        } else if (this.time < 80) {
            this.currentTimeOfDay = TimeOfDay.DUSK;
        } else {
            this.currentTimeOfDay = TimeOfDay.NIGHT;
        }
    }
    
    getDayProgress() {
        return this.time / this.cycleDuration;
    }
    
    getSunPosition() {
        // 太阳位置（0-1）
        if (this.currentTimeOfDay === TimeOfDay.NIGHT) {
            return -1; // 没有太阳
        }
        return (this.time % 60) / 60;
    }
    
    render(ctx, canvasWidth, canvasHeight) {
        ctx.save();
        
        // 绘制天空渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        
        switch (this.currentTimeOfDay) {
            case TimeOfDay.DAY:
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#4a90a4');
                break;
            case TimeOfDay.DUSK:
                gradient.addColorStop(0, '#FF7F50');
                gradient.addColorStop(1, '#c0392b');
                break;
            case TimeOfDay.NIGHT:
                gradient.addColorStop(0, '#0c1445');
                gradient.addColorStop(1, '#191970');
                break;
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 绘制太阳/月亮
        if (this.currentTimeOfDay !== TimeOfDay.NIGHT) {
            // 太阳
            const sunX = canvasWidth * (1 - this.getDayProgress() * 2);
            const sunY = 50 + Math.sin(this.getDayProgress() * Math.PI) * 30;
            
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // 太阳光晕
            ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 月亮
            const moonX = canvasWidth * (1 - (this.time - 80) / 40);
            const moonY = 60;
            
            ctx.fillStyle = '#ecf0f1';
            ctx.beginPath();
            ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // 月牙效果
            ctx.fillStyle = '#0c1445';
            ctx.beginPath();
            ctx.arc(moonX + 8, moonY - 5, 22, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制星星（夜晚）
        if (this.currentTimeOfDay === TimeOfDay.NIGHT) {
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 50; i++) {
                const starX = (i * 137 + 50) % canvasWidth;
                const starY = (i * 97 + 30) % (canvasHeight / 2);
                const starSize = 1 + Math.sin(Date.now() / 500 + i) * 0.5;
                ctx.beginPath();
                ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 叠加层
        ctx.fillStyle = this.colors[this.currentTimeOfDay].overlay;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        ctx.restore();
    }
}
