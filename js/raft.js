// 木筏系统模块（侧视角）
import { CELL_SIZE } from './utils.js';
import { Workbench } from './workbench.js';

export const CellType = {
    PLANK: 'plank',
    STORAGE: 'storage',
    WORKBENCH: 'workbench',
    WATER_PURIFIER: 'water_purifier',
};

export class Raft {
    constructor() {
        // 木筏平台
        this.platforms = [];
        this.width = 5; // 格子数
        this.height = 1;
        
        // 工作台
        this.workbenches = [];
        
        // 初始化平台（底部一排）
        const startX = 800 / 2 - (this.width * CELL_SIZE) / 2;
        const platformY = 400; // 平台Y位置
        
        for (let i = 0; i < this.width; i++) {
            this.platforms.push({
                x: startX + i * CELL_SIZE,
                y: platformY,
                width: CELL_SIZE,
                height: CELL_SIZE,
                type: CellType.PLANK,
            });
        }
        
        // 偏移量
        this.offsetX = 0;
        this.offsetY = 0;
    }
    
    getPlatforms() {
        return this.platforms;
    }
    
    canExpand(direction) {
        // 检查是否可以向某个方向扩展
        return true; // 暂时总是可以扩展
    }
    
    expand(direction, cellType = CellType.PLANK) {
        // 向某个方向扩展木筏
        const lastPlatform = this.platforms[this.platforms.length - 1];
        const firstPlatform = this.platforms[0];
        
        let newPlatform;
        
        switch (direction) {
            case 'right':
                newPlatform = {
                    x: lastPlatform.x + CELL_SIZE,
                    y: lastPlatform.y,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    type: cellType,
                };
                this.platforms.push(newPlatform);
                break;
            case 'left':
                newPlatform = {
                    x: firstPlatform.x - CELL_SIZE,
                    y: firstPlatform.y,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    type: cellType,
                };
                this.platforms.unshift(newPlatform);
                break;
            case 'up':
                // 向上扩展（添加新一层）
                for (const platform of this.platforms) {
                    this.platforms.push({
                        x: platform.x,
                        y: platform.y - CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        type: cellType,
                    });
                }
                break;
        }
        
        this.width++;
        return true;
    }
    
    addWorkbench(x, y) {
        // 在指定位置添加工作台
        const workbench = new Workbench(x, y);
        this.workbenches.push(workbench);
        return workbench;
    }
    
    getWorkbenches() {
        return this.workbenches;
    }
    
    getExpandablePositions(playerX, playerY) {
        const positions = [];
        
        // 左侧
        if (playerX < this.platforms[0].x + CELL_SIZE * 2) {
            positions.push({
                x: this.platforms[0].x - CELL_SIZE,
                y: this.platforms[0].y,
                direction: 'left',
            });
        }
        
        // 右侧
        if (playerX > this.platforms[this.platforms.length - 1].x - CELL_SIZE * 2) {
            positions.push({
                x: this.platforms[this.platforms.length - 1].x + CELL_SIZE,
                y: this.platforms[0].y,
                direction: 'right',
            });
        }
        
        return positions;
    }
    
    render(ctx) {
        // 绘制海水背景
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(0, 420, 800, 180);
        
        // 绘制波浪
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < 800; x += 20) {
            const y = 420 + Math.sin((x + Date.now() / 500) / 30) * 5;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // 绘制木筏平台
        for (const platform of this.platforms) {
            // 平台主体
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // 平台边框
            ctx.strokeStyle = '#5D3A1A';
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            
            // 木板纹理
            ctx.strokeStyle = '#6B3410';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(platform.x + 5, platform.y + platform.height / 3);
            ctx.lineTo(platform.x + platform.width - 5, platform.y + platform.height / 3);
            ctx.moveTo(platform.x + 5, platform.y + (platform.height * 2) / 3);
            ctx.lineTo(platform.x + platform.width - 5, platform.y + (platform.height * 2) / 3);
            ctx.stroke();
            
            // 根据类型添加装饰
            if (platform.type === CellType.STORAGE) {
                ctx.fillStyle = '#654321';
                ctx.fillRect(platform.x + 5, platform.y + 5, platform.width - 10, platform.height - 10);
            } else if (platform.type === CellType.WATER_PURIFIER) {
                ctx.fillStyle = '#4682B4';
                ctx.fillRect(platform.x + 5, platform.y + 5, platform.width - 10, platform.height - 10);
            }
        }
        
        // 绘制工作台
        for (const workbench of this.workbenches) {
            workbench.render(ctx);
        }
        
        // 绘制扩建提示
        const expandable = this.getExpandablePositions(400, 300);
        for (const pos of expandable) {
            ctx.fillStyle = 'rgba(46, 204, 113, 0.5)';
            ctx.fillRect(pos.x, pos.y, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 2;
            ctx.strokeRect(pos.x, pos.y, CELL_SIZE, CELL_SIZE);
            
            // 箭头指示
            ctx.fillStyle = '#2ecc71';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(pos.direction === 'left' ? '←' : '→', pos.x + CELL_SIZE / 2, pos.y + CELL_SIZE / 2 + 7);
        }
    }
}
