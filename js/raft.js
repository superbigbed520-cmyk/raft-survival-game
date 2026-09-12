// 木筏网格系统模块
import { CELL_SIZE } from './utils.js';

export const CellType = {
    PLANK: 'plank',
    STORAGE: 'storage',
    WORKBENCH: 'workbench',
    WATER_PURIFIER: 'water_purifier',
};

export class Raft {
    constructor() {
        // 木筏网格，初始3x3
        this.grid = [];
        this.width = 3;
        this.height = 3;
        
        // 初始化网格
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = CellType.PLANK;
            }
        }
        
        // 木筏在画布上的偏移（居中）
        this.offsetX = 0;
        this.offsetY = 0;
    }
    
    hasCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.grid[y][x] !== null;
    }
    
    getCell(x, y) {
        if (!this.hasCell(x, y)) return null;
        return this.grid[y][x];
    }
    
    canExpand(x, y) {
        // 检查是否与现有木筏相邻
        const neighbors = [
            [x - 1, y], [x + 1, y],
            [x, y - 1], [x, y + 1]
        ];
        
        for (const [nx, ny] of neighbors) {
            if (this.hasCell(nx, ny)) return true;
        }
        return false;
    }
    
    expand(x, y, cellType = CellType.PLANK) {
        if (!this.canExpand(x, y)) return false;
        
        // 扩展网格数组
        if (y < 0) {
            // 向上扩展
            this.grid.unshift(new Array(this.width).fill(null));
            this.height++;
            y = 0;
        } else if (y >= this.height) {
            // 向下扩展
            this.grid.push(new Array(this.width).fill(null));
            this.height++;
        }
        
        if (x < 0) {
            // 向左扩展
            for (let row of this.grid) {
                row.unshift(null);
            }
            this.width++;
            x = 0;
        } else if (x >= this.width) {
            // 向右扩展
            for (let row of this.grid) {
                row.push(null);
            }
            this.width++;
        }
        
        this.grid[y][x] = cellType;
        return true;
    }
    
    getExpandableCells(playerX, playerY, offsetX, offsetY) {
        const expandable = [];
        
        for (let y = -1; y <= this.height; y++) {
            for (let x = -1; x <= this.width; x++) {
                if (this.hasCell(x, y)) continue;
                if (this.canExpand(x, y)) {
                    const px = offsetX + x * CELL_SIZE + CELL_SIZE / 2;
                    const py = offsetY + y * CELL_SIZE + CELL_SIZE / 2;
                    const dist = Math.sqrt((px - playerX) ** 2 + (py - playerY) ** 2);
                    
                    if (dist < CELL_SIZE * 2) { // 只显示附近的可扩建位置
                        expandable.push({ x, y, px, py });
                    }
                }
            }
        }
        
        return expandable;
    }
    
    render(ctx) {
        // 计算居中偏移
        const raftPixelWidth = this.width * CELL_SIZE;
        const raftPixelHeight = this.height * CELL_SIZE;
        this.offsetX = (800 - raftPixelWidth) / 2;
        this.offsetY = (600 - raftPixelHeight) / 2;
        
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        
        // 绘制每个格子
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.grid[y][x];
                if (cell === null) continue;
                
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;
                
                // 根据类型绘制不同颜色
                switch (cell) {
                    case CellType.PLANK:
                        ctx.fillStyle = '#8B4513';
                        break;
                    case CellType.STORAGE:
                        ctx.fillStyle = '#654321';
                        break;
                    case CellType.WORKBENCH:
                        ctx.fillStyle = '#A0522D';
                        break;
                    case CellType.WATER_PURIFIER:
                        ctx.fillStyle = '#4682B4';
                        break;
                    default:
                        ctx.fillStyle = '#8B4513';
                }
                
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                
                // 绘制边框
                ctx.strokeStyle = '#5D3A1A';
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                
                // 绘制木板纹理
                if (cell === CellType.PLANK) {
                    ctx.strokeStyle = '#6B3410';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(px + 5, py + CELL_SIZE / 3);
                    ctx.lineTo(px + CELL_SIZE - 5, py + CELL_SIZE / 3);
                    ctx.moveTo(px + 5, py + (CELL_SIZE * 2) / 3);
                    ctx.lineTo(px + CELL_SIZE - 5, py + (CELL_SIZE * 2) / 3);
                    ctx.stroke();
                }
            }
        }
        
        ctx.restore();
    }
}
