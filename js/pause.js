// 暂停菜单模块

export class PauseMenu {
    constructor() {
        this.isPaused = false;
        this.selectedOption = 0;
        this.options = [
            { id: 'resume', name: '继续游戏', icon: '▶️' },
            { id: 'recipes', name: '合成图纸', icon: '📖' },
            { id: 'controls', name: '操作说明', icon: '🎮' },
            { id: 'quit', name: '退出游戏', icon: '🚪' },
        ];
    }
    
    toggle() {
        this.isPaused = !this.isPaused;
        this.selectedOption = 0;
    }
    
    handleInput(keys) {
        if (!this.isPaused) return null;
        
        // 上下选择
        if (keys['w'] || keys['arrowup']) {
            this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
            keys['w'] = false;
            keys['arrowup'] = false;
        }
        if (keys['s'] || keys['arrowdown']) {
            this.selectedOption = (this.selectedOption + 1) % this.options.length;
            keys['s'] = false;
            keys['arrowdown'] = false;
        }
        
        // 确认选择
        if (keys['enter'] || keys[' ']) {
            keys['enter'] = false;
            keys[' '] = false;
            return this.options[this.selectedOption].id;
        }
        
        return null;
    }
    
    render(ctx, canvasWidth, canvasHeight) {
        if (!this.isPaused) return;
        
        ctx.save();
        
        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 菜单背景
        const menuX = canvasWidth / 2 - 150;
        const menuY = canvasHeight / 2 - 150;
        const menuWidth = 300;
        const menuHeight = 300;
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 4;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
        
        // 标题
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⏸️ 暂停', canvasWidth / 2, menuY + 45);
        
        // 菜单选项
        this.options.forEach((option, i) => {
            const y = menuY + 90 + i * 45;
            const isSelected = i === this.selectedOption;
            
            // 选中背景
            if (isSelected) {
                ctx.fillStyle = '#3498db';
                ctx.fillRect(menuX + 20, y - 15, menuWidth - 40, 35);
            }
            
            // 选项文字
            ctx.fillStyle = isSelected ? '#fff' : '#bdc3c7';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${option.icon} ${option.name}`, canvasWidth / 2, y + 5);
        });
        
        // 提示
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '12px Arial';
        ctx.fillText('W/S 选择 | Enter 确认', canvasWidth / 2, menuY + menuHeight - 20);
        
        ctx.restore();
    }
}
