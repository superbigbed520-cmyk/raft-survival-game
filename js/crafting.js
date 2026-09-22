// 合成 & 物品定义
export const ITEMS = {
  plank:    { name:'木板',   icon:'🪵', usable:false },
  plastic:  { name:'塑料',   icon:'📦', usable:false },
  rope:     { name:'绳子',   icon:'🧵', usable:false },
  food:     { name:'食物',   icon:'🍖', usable:true,  effect:'hunger', value:25 },
  metal:    { name:'金属',   icon:'⚙️', usable:false },
  chest:    { name:'宝箱',   icon:'🎁', usable:false },
  water:    { name:'淡水',   icon:'💧', usable:true,  effect:'thirst', value:25 },
  bandage:  { name:'急救包', icon:'🩹', usable:true,  effect:'health', value:30 },
  cooked:   { name:'烤鱼',   icon:'🐟', usable:true,  effect:'hunger', value:40 },
  rod:      { name:'钓竿',   icon:'🎣', usable:false },
  spear:    { name:'鱼叉',   icon:'🔱', usable:false },
  hammer:   { name:'建造锤', icon:'🔨', usable:false },
};

export const HOTBAR = ['plank','rope','food','water','bandage','cooked'];

export const RECIPES = [
  { id:'rope',     name:'绳子',   icon:'🧵', cat:'基础',  out:{rope:2},     need:{plank:5},                    desc:'基础材料' },
  { id:'rod',      name:'钓竿',   icon:'🎣', cat:'工具',  out:{rod:1},      need:{plank:4,rope:2},             desc:'钓鱼+50%' },
  { id:'spear',    name:'鱼叉',   icon:'🔱', cat:'工具',  out:{spear:1},    need:{plank:3,metal:1},            desc:'钓鱼双倍' },
  { id:'hammer',   name:'建造锤', icon:'🔨', cat:'工具',  out:{hammer:1},   need:{plank:5,metal:1},            desc:'扩建省料' },
  { id:'water',    name:'淡水',   icon:'💧', cat:'消耗品', out:{water:2},    need:{plastic:2},                  desc:'+25 口渴' },
  { id:'bandage',  name:'急救包', icon:'🩹', cat:'消耗品', out:{bandage:1},  need:{rope:3,plastic:2},           desc:'+30 生命' },
  { id:'cooked',   name:'烤鱼',   icon:'🐟', cat:'消耗品', out:{cooked:1},   need:{food:2,plank:1},             desc:'+40 饱食' },
];

export const CATS = ['全部','基础','工具','消耗品'];

export function canCraft(r, inv) { return Object.entries(r.need).every(([k,v])=>(inv[k]||0)>=v); }
export function craft(r, inv) {
  if (!canCraft(r,inv)) return false;
  for (const [k,v] of Object.entries(r.need)) inv[k]-=v;
  for (const [k,v] of Object.entries(r.out))  inv[k]=(inv[k]||0)+v;
  return true;
}
