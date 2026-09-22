// 工具函数
export const CELL = 40;
export const WATER_Y = 420;
export const W = 800;
export const H = 600;

export const rand = (a, b) => Math.random() * (b - a) + a;
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
export const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
