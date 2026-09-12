// 工作台和合成系统模块

export const Recipes = [
    // === 基础材料 ===
    {
        id: 'rope',
        name: '绳子',
        result: { type: 'rope', amount: 2 },
        ingredients: [
            { type: 'plank', amount: 5 },
        ],
        icon: '🧵',
        category: '基础',
        description: '基础合成材料',
    },
    
    // === 工具 ===
    {
        id: 'fishing_rod',
        name: '钓竿',
        result: { type: 'fishing_rod', amount: 1 },
        ingredients: [
            { type: 'plank', amount: 4 },
            { type: 'rope', amount: 2 },
        ],
        icon: '🎣',
        category: '工具',
        description: '钓鱼速度提升50%',
        effect: { type: 'tool', value: 'fishing_speed_up' },
    },
    {
        id: 'spear',
        name: '鱼叉',
        result: { type: 'spear', amount: 1 },
        ingredients: [
            { type: 'plank', amount: 3 },
            { type: 'metal', amount: 1 },
        ],
        icon: '🔱',
        category: '工具',
        description: '可以叉鱼，一次获得2条',
        effect: { type: 'tool', value: 'spear_fishing' },
    },
    {
        id: 'building_tool',
        name: '扩建工具',
        result: { type: 'building_tool', amount: 1 },
        ingredients: [
            { type: 'plank', amount: 5 },
            { type: 'metal', amount: 1 },
        ],
        icon: '🔧',
        category: '工具',
        description: '扩建木筏消耗减半',
        effect: { type: 'tool', value: 'build_discount' },
    },
    
    // === 生存设施 ===
    {
        id: 'shelter',
        name: '简易庇护所',
        result: { type: 'shelter', amount: 1 },
        ingredients: [
            { type: 'plank', amount: 15 },
            { type: 'rope', amount: 5 },
        ],
        icon: '🏕️',
        category: '设施',
        description: '夜晚保暖，减少饥饿消耗',
        effect: { type: 'facility', value: 'warmth' },
    },
    {
        id: 'campfire',
        name: '篝火',
        result: { type: 'campfire', amount: 1 },
        ingredients: [
            { type: 'plank', amount: 10 },
            { type: 'metal', amount: 2 },
        ],
        icon: '🔥',
        category: '设施',
        description: '可以烹饪食物，效果翻倍',
        effect: { type: 'facility', value: 'cook_food' },
    },
    {
        id: 'storage',
        name: '木箱',
        result: { type: 'storage', amount: 1 },
        ingredients: [
            { type: 'plank', amount: 8 },
        ],
        icon: '📦',
        category: '设施',
        description: '存储10个额外物品',
        effect: { type: 'facility', value: 'extra_storage' },
    },
    {
        id: 'purifier',
        name: '净水器',
        result: { type: 'purifier', amount: 1 },
        ingredients: [
            { type: 'plastic', amount: 5 },
            { type: 'rope', amount: 2 },
            { type: 'metal', amount: 1 },
        ],
        icon: '💧',
        category: '设施',
        description: '自动过滤海水获得淡水',
        effect: { type: 'facility', value: 'auto_water' },
    },
    
    // === 消耗品 ===
    {
        id: 'first_aid',
        name: '急救包',
        result: { type: 'first_aid', amount: 1 },
        ingredients: [
            { type: 'rope', amount: 3 },
            { type: 'plastic', amount: 2 },
        ],
        icon: '🩹',
        category: '消耗品',
        description: '恢复30点生命值',
        effect: { type: 'consumable', value: 'health', amount: 30 },
    },
    {
        id: 'water',
        name: '淡水',
        result: { type: 'water', amount: 2 },
        ingredients: [
            { type: 'plastic', amount: 2 },
        ],
        icon: '💧',
        category: '消耗品',
        description: '恢复25点口渴度',
        effect: { type: 'consumable', value: 'thirst', amount: 25 },
    },
    {
        id: 'cooked_food',
        name: '烤鱼',
        result: { type: 'cooked_food', amount: 1 },
        ingredients: [
            { type: 'food', amount: 2 },
            { type: 'plank', amount: 1 },
        ],
        icon: '🐟',
        category: '消耗品',
        description: '恢复40点饱食度',
        effect: { type: 'consumable', value: 'hunger', amount: 40 },
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
        this.currentCategory = '全部';
        this.categories = ['全部', '基础', '工具', '设施', '消耗品'];
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
        
        return distance < 80;
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
        inventory[recipe.result.type] = (inventory[recipe.result.type] || 0) + recipe.result.amount;
        
        return { 
            type: recipe.result.type, 
            amount: recipe.result.amount,
            name: recipe.name,
            effect: recipe.effect,
        };
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 合成界面背景
        const uiX = canvasWidth / 2 - 300;
        const uiY = canvasHeight / 2 - 220;
        const uiWidth = 600;
        const uiHeight = 440;
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(uiX, uiY, uiWidth, uiHeight);
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 4;
        ctx.strokeRect(uiX, uiY, uiWidth, uiHeight);
        
        // 标题
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨 工作台 - 合成图纸', canvasWidth / 2, uiY + 35);
        
        // 分类标签
        const tagStartX = uiX + 20;
        const tagY = uiY + 55;
        this.categories.forEach((cat, i) => {
            const tagX = tagStartX + i * 80;
            ctx.fillStyle = this.currentCategory === cat ? '#3498db' : '#7f8c8d';
            ctx.fillRect(tagX, tagY, 70, 25);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(cat, tagX + 35, tagY + 17);
        });
        
        // 当前材料
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#bdc3c7';
        const materials = [
            { type: 'plank', name: '木板', icon: '🪵' },
            { type: 'plastic', name: '塑料', icon: '📦' },
            { type: 'rope', name: '绳子', icon: '🧵' },
            { type: 'food', name: '食物', icon: '🍖' },
            { type: 'metal', name: '金属', icon: '⚙️' },
        ];
        
        materials.forEach((mat, i) => {
            const x = uiX + 20 + (i % 5) * 115;
            ctx.fillText(`${mat.icon}${inventory[mat.type] || 0}`, x, uiY + 100);
        });
        
        // 合成配方列表
        const filteredRecipes = this.currentCategory === '全部' 
            ? Recipes 
            : Recipes.filter(r => r.category === this.currentCategory);
        
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('合成配方:', uiX + 20, uiY + 125);
        
        const startY = uiY + 140;
        const itemHeight = 55;
        const maxVisible = 5;
        
        filteredRecipes.slice(0, maxVisible).forEach((recipe, i) => {
            const y = startY + i * itemHeight;
            const canCraft = this.canCraft(recipe, inventory);
            
            // 配方背景
            ctx.fillStyle = canCraft ? '#27ae60' : '#34495e';
            ctx.fillRect(uiX + 20, y, uiWidth - 40, itemHeight - 5);
            
            // 配方图标
            ctx.font = '24px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(recipe.icon, uiX + 45, y + 22);
            
            // 配方名称和描述
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(recipe.name, uiX + 70, y + 18);
            
            ctx.font = '11px Arial';
            ctx.fillStyle = '#bdc3c7';
            ctx.fillText(recipe.description, uiX + 70, y + 35);
            
            // 需要的材料
            ctx.font = '11px Arial';
            ctx.fillStyle = canCraft ? '#fff' : '#e74c3c';
            const ingredientsText = recipe.ingredients.map(ing => {
                const mat = materials.find(m => m.type === ing.type);
                const has = inventory[ing.type] || 0;
                return `${mat.icon}${has}/${ing.amount}`;
            }).join(' ');
            ctx.fillText(ingredientsText, uiX + 250, y + 18);
            
            // 合成按钮
            if (canCraft) {
                ctx.fillStyle = '#2ecc71';
                ctx.fillRect(uiX + uiWidth - 80, y + 10, 55, 30);
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('合成', uiX + uiWidth - 52, y + 30);
            }
        });
        
        // 关闭提示
        ctx.fillStyle = '#95a5a6';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按 E 或 ESC 关闭 | A/D 切换分类', canvasWidth / 2, uiY + uiHeight - 15);
        
        ctx.restore();
    }
    
    handleClick(mouseX, mouseY, inventory) {
        if (!this.isOpen) return null;
        
        const uiX = 800 / 2 - 300;
        const uiY = 600 / 2 - 220;
        const uiWidth = 600;
        
        // 检查分类标签点击
        const tagY = uiY + 55;
        if (mouseY >= tagY && mouseY <= tagY + 25) {
            for (let i = 0; i < this.categories.length; i++) {
                const tagX = uiX + 20 + i * 80;
                if (mouseX >= tagX && mouseX <= tagX + 70) {
                    this.currentCategory = this.categories[i];
                    return null;
                }
            }
        }
        
        // 检查配方点击
        const filteredRecipes = this.currentCategory === '全部' 
            ? Recipes 
            : Recipes.filter(r => r.category === this.currentCategory);
        
        const startY = uiY + 140;
        const itemHeight = 55;
        
        for (let i = 0; i < Math.min(filteredRecipes.length, 5); i++) {
            const recipe = filteredRecipes[i];
            const y = startY + i * itemHeight;
            
            if (mouseX >= uiX + uiWidth - 80 && mouseX <= uiX + uiWidth - 25 &&
                mouseY >= y + 10 && mouseY <= y + 40) {
                
                if (this.canCraft(recipe, inventory)) {
                    return this.craft(recipe, inventory);
                }
            }
        }
        
        return null;
    }
}
