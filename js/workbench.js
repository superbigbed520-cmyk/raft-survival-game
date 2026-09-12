// 工作台和合成系统模块

export const Recipes = [
    {
        id: 'rope',
        name: '绳子',
        result: { type: 'rope', amount: 2 },
        ingredients: [
            { type: 'plank', amount: 5 },
        ],
        icon: '🧵',
    },
    {
        id: 'plastic',
        name: '塑料',
        result: { type: 'plastic', amount: 1 },
        ingredients: [
            { type: 'plank', amount: 3 },
            { type: 'rope', amount: 2 },
        ],
        icon: '📦',
    },
    {
        id: 'food',
        name: '食物',
        result: { type: 'food', amount: 3 },
        ingredients: [
            { type: 'plank', amount: 8 },
            { type: 'rope', amount: 4 },
        ],
        icon: '🍖',
    },
    {
        id: 'metal',
        name: '金属',
        result: { type: 'metal', amount: 1 },
        ingredients: [
            { type: 'plank', amount: 10 },
            { type: 'rope', amount: 5 },
            { type: 'plastic', amount: 3 },
        ],
        icon: '⚙️',
    },
    {
        id: 'water_purifier',
        name: '海水过滤器',
        result: { type: 'special', amount: 1 },
        ingredients: [
            { type: 'metal', amount: 5 },
            { type: 'plastic', amount: 3 },
            { type: 'rope', amount: 2 },
        ],
        icon: '💧',
        special: true,
    },
    {
        id: 'water',
        name: '淡水',
        result: { type: 'water', amount: 2 },
        ingredients: [
            { type: 'plastic', amount: 2 },
        ],
        icon: '💧',
    },
];

export class Workbench {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.isOpen = false;
        this.selectedRecipe = null;
    }
    
    isPlayerNear(player) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const workbenchCenterX = this.x + this.width / 2;
        const workbenchCenterY = this.y + this.height / 2;
        
        const distance = Math.sqrt(
            (playerCenterX - workbenchCenterX) ** 2 + 
            (playerCenterY - workbenchCenterY) ** 2
        );
        
        return distance < 60;
    }
    
    canCraft(recipe, inventory) {
        for (const ingredient of recipe.ingredients) {
            if ((inventory[ingredient.type] || 0) < ingredient.amount) {
                return false;
            }
        }
        return true;
    }
    
    craft(recipe, inventory) {
        if (!this.canCraft(recipe, inventory)) {
            return false;
        }
        
        // 消耗材料
        for (const ingredient of recipe.ingredients) {
            inventory[ingredient.type] -= ingredient.amount;
        }
        
        // 获得产物
        if (recipe.result.type === 'special') {
            // 特殊道具处理
            return { type: 'special', name: recipe.name };
        } else {
            inventory[recipe.result.type] = (inventory[recipe.result.type] || 0) + recipe.result.amount;
            return { type: recipe.result.type, amount: recipe.result.amount };
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // 工作台主体
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 工作台边框
        ctx.strokeStyle = '#5D3A1A';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // 工作台纹理
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width - 5, this.y + this.height / 2);
        ctx.stroke();
        
        // 工具图标
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔨', this.x + this.width / 2, this.y + this.height / 2);
        
        ctx.restore();
    }
    
    renderUI(ctx, inventory, canvasWidth, canvasHeight) {
        if (!this.isOpen) return;
        
        ctx.save();
        
        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 合成界面背景
        const uiX = canvasWidth / 2 - 250;
        const uiY = canvasHeight / 2 - 200;
        const uiWidth = 500;
        const uiHeight = 400;
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(uiX, uiY, uiWidth, uiHeight);
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 4;
        ctx.strokeRect(uiX, uiY, uiWidth, uiHeight);
        
        // 标题
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨 工作台 - 合成', canvasWidth / 2, uiY + 35);
        
        // 当前材料
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#bdc3c7';
        ctx.fillText('当前材料:', uiX + 20, uiY + 70);
        
        const materials = [
            { type: 'plank', name: '木板', icon: '🪵' },
            { type: 'plastic', name: '塑料', icon: '📦' },
            { type: 'rope', name: '绳子', icon: '🧵' },
            { type: 'food', name: '食物', icon: '🍖' },
            { type: 'metal', name: '金属', icon: '⚙️' },
        ];
        
        materials.forEach((mat, i) => {
            const x = uiX + 20 + (i % 3) * 160;
            const y = uiY + 90 + Math.floor(i / 3) * 25;
            ctx.fillText(`${mat.icon} ${mat.name}: ${inventory[mat.type] || 0}`, x, y);
        });
        
        // 合成配方列表
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('合成配方:', uiX + 20, uiY + 150);
        
        Recipes.forEach((recipe, i) => {
            const y = uiY + 180 + i * 50;
            const canCraft = this.canCraft(recipe, inventory);
            
            // 配方背景
            ctx.fillStyle = canCraft ? '#27ae60' : '#7f8c8d';
            ctx.fillRect(uiX + 20, y, uiWidth - 40, 40);
            
            // 配方名称和图标
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${recipe.icon} ${recipe.name}`, uiX + 30, y + 25);
            
            // 需要的材料
            ctx.font = '12px Arial';
            ctx.fillStyle = '#ecf0f1';
            const ingredientsText = recipe.ingredients.map(ing => {
                const mat = materials.find(m => m.type === ing.type);
                return `${mat.icon}${ing.amount}`;
            }).join(' + ');
            ctx.fillText(`需要: ${ingredientsText}`, uiX + 150, y + 25);
            
            // 产出
            ctx.fillText(`→ ${recipe.icon}x${recipe.result.amount}`, uiX + 350, y + 25);
            
            // 合成按钮
            if (canCraft) {
                ctx.fillStyle = '#2ecc71';
                ctx.fillRect(uiX + uiWidth - 80, y + 5, 60, 30);
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('合成', uiX + uiWidth - 50, y + 24);
            }
        });
        
        // 关闭提示
        ctx.fillStyle = '#95a5a6';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按 E 或 ESC 关闭', canvasWidth / 2, uiY + uiHeight - 20);
        
        ctx.restore();
    }
    
    handleClick(mouseX, mouseY, inventory) {
        if (!this.isOpen) return null;
        
        const uiX = 800 / 2 - 250;
        const uiY = 600 / 2 - 200;
        const uiWidth = 500;
        
        // 检查点击的配方
        for (let i = 0; i < Recipes.length; i++) {
            const recipe = Recipes[i];
            const y = uiY + 180 + i * 50;
            
            if (mouseX >= uiX + 20 && mouseX <= uiX + uiWidth - 20 &&
                mouseY >= y && mouseY <= y + 40) {
                
                if (this.canCraft(recipe, inventory)) {
                    return this.craft(recipe, inventory);
                }
            }
        }
        
        return null;
    }
}
