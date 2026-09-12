// 物品栏和背包系统模块

export class InventoryUI {
    constructor() {
        // 快捷栏（底部）
        this.quickSlots = 6;
        this.selectedSlot = 0;
        
        // 背包界面
        this.isBagOpen = false;
        
        // 物品类型定义
        this.itemTypes = {
            plank: { name: '木板', icon: '🪵', color: '#8B4513', usable: false },
            plastic: { name: '塑料', icon: '📦', color: '#3498db', usable: false },
            rope: { name: '绳子', icon: '🧵', color: '#f39c12', usable: false },
            food: { name: '食物', icon: '🍖', color: '#e74c3c', usable: true, effect: 'hunger', value: 30 },
            metal: { name: '金属', icon: '⚙️', color: '#95a5a6', usable: false },
            water: { name: '淡水', icon: '💧', color: '#3498db', usable: true, effect: 'thirst', value: 30 },
        };
    }
    
    update(keys, player) {
        // 数字键切换快捷栏
        for (let i = 1; i <= this.quickSlots; i++) {
            if (keys[i.toString()]) {
                this.selectedSlot = i - 1;
            }
        }
        
        // Tab键打开/关闭背包
        if (keys['tab']) {
            this.isBagOpen = !this.isBagOpen;
            keys['tab'] = false; // 防止连续触发
        }
        
        // Q键使用选中的物品
        if (keys['q']) {
            this.useItem(player);
            keys['q'] = false;
        }
    }
    
    useItem(player) {
        const itemTypes = Object.keys(this.itemTypes);
        if (this.selectedSlot >= itemTypes.length) return false;
        
        const itemType = itemTypes[this.selectedSlot];
        const itemDef = this.itemTypes[itemType];
        
        // 检查是否可以使用
        if (!itemDef.usable) {
            return false;
        }
        
        // 检查数量
        if ((player.inventory[itemType] || 0) <= 0) {
            return false;
        }
        
        // 使用物品
        player.inventory[itemType]--;
        
        // 应用效果
        switch (itemDef.effect) {
            case 'hunger':
                player.hunger = Math.min(100, player.hunger + itemDef.value);
                return { success: true, message: `🍖 饱食度 +${itemDef.value}` };
            case 'thirst':
                player.thirst = Math.min(100, player.thirst + itemDef.value);
                return { success: true, message: `💧 口渴度 +${itemDef.value}` };
            case 'health':
                player.health = Math.min(100, player.health + itemDef.value);
                return { success: true, message: `❤️ 生命值 +${itemDef.value}` };
        }
        
        return false;
    }
    
    getSelectedItem() {
        const itemTypes = Object.keys(this.itemTypes);
        if (this.selectedSlot >= itemTypes.length) return null;
        const itemType = itemTypes[this.selectedSlot];
        return { type: itemType, ...this.itemTypes[itemType] };
    }
    
    render(ctx, player, canvasWidth, canvasHeight) {
        // 绘制快捷栏
        this.renderQuickSlots(ctx, player, canvasWidth, canvasHeight);
        
        // 绘制背包界面
        if (this.isBagOpen) {
            this.renderBag(ctx, player, canvasWidth, canvasHeight);
        }
    }
    
    renderQuickSlots(ctx, player, canvasWidth, canvasHeight) {
        const slotSize = 50;
        const slotPadding = 5;
        const totalWidth = this.quickSlots * (slotSize + slotPadding) - slotPadding;
        const startX = (canvasWidth - totalWidth) / 2;
        const startY = canvasHeight - slotSize - 15;
        
        ctx.save();
        
        // 快捷栏背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(startX - 10, startY - 10, totalWidth + 20, slotSize + 20);
        
        // 绘制每个格子
        for (let i = 0; i < this.quickSlots; i++) {
            const x = startX + i * (slotSize + slotPadding);
            const y = startY;
            
            // 格子背景
            ctx.fillStyle = i === this.selectedSlot ? '#3498db' : '#2c3e50';
            ctx.fillRect(x, y, slotSize, slotSize);
            
            // 格子边框
            ctx.strokeStyle = i === this.selectedSlot ? '#fff' : '#7f8c8d';
            ctx.lineWidth = i === this.selectedSlot ? 3 : 1;
            ctx.strokeRect(x, y, slotSize, slotSize);
            
            // 快捷键提示
            ctx.fillStyle = '#95a5a6';
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText((i + 1).toString(), x + 3, y + 12);
            
            // 物品图标（显示对应类型的数量）
            const itemTypes = Object.keys(this.itemTypes);
            if (i < itemTypes.length) {
                const itemType = itemTypes[i];
                const amount = player.inventory[itemType] || 0;
                
                if (amount > 0) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(this.itemTypes[itemType].icon, x + slotSize / 2, y + slotSize / 2 + 8);
                    
                    // 数量
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'right';
                    ctx.fillText(amount.toString(), x + slotSize - 3, y + slotSize - 5);
                }
            }
        }
        
        // 选中格子的物品名称
        const itemTypes = Object.keys(this.itemTypes);
        if (this.selectedSlot < itemTypes.length) {
            const selectedType = itemTypes[this.selectedSlot];
            const amount = player.inventory[selectedType] || 0;
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${this.itemTypes[selectedType].icon} ${this.itemTypes[selectedType].name}: ${amount}`,
                canvasWidth / 2,
                startY - 15
            );
        }
        
        ctx.restore();
    }
    
    renderBag(ctx, player, canvasWidth, canvasHeight) {
        ctx.save();
        
        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 背包界面
        const bagX = canvasWidth / 2 - 200;
        const bagY = canvasHeight / 2 - 180;
        const bagWidth = 400;
        const bagHeight = 360;
        
        // 背包背景
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(bagX, bagY, bagWidth, bagHeight);
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 4;
        ctx.strokeRect(bagX, bagY, bagWidth, bagHeight);
        
        // 标题
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎒 背包', canvasWidth / 2, bagY + 35);
        
        // 物品网格
        const gridCols = 5;
        const gridRows = 4;
        const cellSize = 60;
        const cellPadding = 10;
        const gridStartX = bagX + (bagWidth - gridCols * (cellSize + cellPadding)) / 2;
        const gridStartY = bagY + 60;
        
        const itemTypes = Object.keys(this.itemTypes);
        let itemIndex = 0;
        
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const x = gridStartX + col * (cellSize + cellPadding);
                const y = gridStartY + row * (cellSize + cellPadding);
                
                // 格子背景
                ctx.fillStyle = '#34495e';
                ctx.fillRect(x, y, cellSize, cellSize);
                ctx.strokeStyle = '#7f8c8d';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);
                
                // 物品
                if (itemIndex < itemTypes.length) {
                    const itemType = itemTypes[itemIndex];
                    const amount = player.inventory[itemType] || 0;
                    
                    if (amount > 0) {
                        // 物品图标
                        ctx.fillStyle = '#fff';
                        ctx.font = '28px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(this.itemTypes[itemType].icon, x + cellSize / 2, y + cellSize / 2 + 5);
                        
                        // 数量
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 14px Arial';
                        ctx.textAlign = 'right';
                        ctx.fillText(amount.toString(), x + cellSize - 5, y + cellSize - 8);
                        
                        // 物品名称
                        ctx.fillStyle = '#bdc3c7';
                        ctx.font = '10px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(this.itemTypes[itemType].name, x + cellSize / 2, y + cellSize - 20);
                    }
                    
                    itemIndex++;
                }
            }
        }
        
        // 统计信息
        ctx.fillStyle = '#bdc3c7';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        const totalItems = Object.values(player.inventory).reduce((a, b) => a + b, 0);
        ctx.fillText(`总物品数: ${totalItems}`, bagX + 20, bagY + bagHeight - 50);
        
        // 关闭提示
        ctx.fillStyle = '#95a5a6';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按 TAB 或 ESC 关闭', canvasWidth / 2, bagY + bagHeight - 20);
        
        ctx.restore();
    }
}
