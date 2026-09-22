// 合成配方
export const RECIPES = [
  { id:'rope',      name:'绳子',    icon:'🧵', cat:'基础',  out:{rope:2},         need:{plank:5},                          desc:'基础合成材料' },
  { id:'rod',       name:'钓竿',    icon:'🎣', cat:'工具',  out:{rod:1},          need:{plank:4, rope:2},                  desc:'钓鱼速度+50%' },
  { id:'spear',     name:'鱼叉',    icon:'🔱', cat:'工具',  out:{spear:1},        need:{plank:3, metal:1},                 desc:'钓鱼获得双倍' },
  { id:'hammer',    name:'建造锤',  icon:'🔨', cat:'工具',  out:{hammer:1},       need:{plank:5, metal:1},                 desc:'扩建消耗减半' },
  { id:'shelter',   name:'庇护所',  icon:'🏕️', cat:'设施',  out:{shelter:1},      need:{plank:15, rope:5},                 desc:'夜晚保暖+1' },
  { id:'campfire',  name:'篝火',    icon:'🔥', cat:'设施',  out:{campfire:1},     need:{plank:10, metal:2},                desc:'烤鱼效果翻倍' },
  { id:'box',       name:'木箱',    icon:'📦', cat:'设施',  out:{box:1},          need:{plank:8},                          desc:'存储+10格' },
  { id:'purifier',  name:'净水器',  icon:'💧', cat:'设施',  out:{purifier:1},     need:{plastic:5, rope:2, metal:1},       desc:'自动产淡水' },
  { id:'water',     name:'淡水',    icon:'💧', cat:'消耗品', out:{water:2},        need:{plastic:2},                        desc:'恢复25口渴' },
  { id:'bandage',   name:'急救包',  icon:'🩹', cat:'消耗品', out:{bandage:1},      need:{rope:3, plastic:2},                desc:'恢复30生命' },
  { id:'cooked',    name:'烤鱼',    icon:'🐟', cat:'消耗品', out:{cooked:1},       need:{food:2, plank:1},                  desc:'恢复40饱食' },
];

export const CATS = ['全部','基础','工具','设施','消耗品'];

// 物品定义
export const ITEMS = {
  plank:    { name:'木板',   icon:'🪵', usable:false },
  plastic:  { name:'塑料',   icon:'📦', usable:false },
  rope:     { name:'绳子',   icon:'🧵', usable:false },
  food:     { name:'食物',   icon:'🍖', usable:true, effect:'hunger', value:25 },
  metal:    { name:'金属',   icon:'⚙️', usable:false },
  chest:    { name:'宝箱',   icon:'🎁', usable:false },
  water:    { name:'淡水',   icon:'💧', usable:true, effect:'thirst', value:25 },
  bandage:  { name:'急救包', icon:'🩹', usable:true, effect:'health', value:30 },
  cooked:   { name:'烤鱼',   icon:'🐟', usable:true, effect:'hunger', value:40 },
  rod:      { name:'钓竿',   icon:'🎣', usable:false },
  spear:    { name:'鱼叉',   icon:'🔱', usable:false },
  hammer:   { name:'建造锤', icon:'🔨', usable:false },
  shelter:  { name:'庇护所', icon:'🏕️', usable:false },
  campfire: { name:'篝火',   icon:'🔥', usable:false },
  box:      { name:'木箱',   icon:'📦', usable:false },
  purifier: { name:'净水器', icon:'💧', usable:false },
};

// 快捷栏显示顺序（前6个）
export const HOTBAR = ['plank','rope','food','water','bandage','cooked'];

export function canCraft(recipe, inv) {
  return Object.entries(recipe.need).every(([k, v]) => (inv[k] || 0) >= v);
}

export function craft(recipe, inv) {
  if (!canCraft(recipe, inv)) return null;
  for (const [k, v] of Object.entries(recipe.need)) inv[k] -= v;
  for (const [k, v] of Object.entries(recipe.out)) inv[k] = (inv[k] || 0) + v;
  return recipe;
}
