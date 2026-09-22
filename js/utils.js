export const CELL = 2;      // 一个方块的尺寸（世界单位）
export const WATER_Y = 0;   // 水面高度
export const rand = (a,b) => Math.random()*(b-a)+a;
export const randInt = (a,b) => Math.floor(rand(a,b+1));
export const clamp = (v,lo,hi) => Math.min(Math.max(v,lo),hi);
export const dist = (x1,z1,x2,z2) => Math.hypot(x2-x1, z2-z1);
export const lerp = (a,b,t) => a+(b-a)*clamp(t,0,1);
