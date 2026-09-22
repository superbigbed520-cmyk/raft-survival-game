// 3D 实体：玩家、木筏、漂浮物
import * as THREE from 'three';
import { CELL, WATER_Y, rand, randInt, clamp, dist } from './utils.js';

// ===== 3D 玩家（低多边形小人） =====
export class Player3D {
  constructor(raft) {
    this.raft = raft;
    this.x = 0; this.y = 1; this.z = 0;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.speed = 5; this.jumpV = 7; this.gravity = 18;
    this.grounded = false; this.inWater = false;
    this.faceX = 0; this.faceZ = 1;
    this.hp = 100; this.hunger = 100; this.thirst = 100;
    this.inv = {};
    this.anim = 0;

    // 3D 模型
    this.group = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const shirt = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
    const pants = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });

    // 身体
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.4), shirt);
    this.body.position.y = 0.9;
    this.body.castShadow = true;
    this.group.add(this.body);

    // 头
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.5), skin);
    this.head.position.y = 1.55;
    this.head.castShadow = true;
    this.group.add(this.head);

    // 眼睛
    const eyeW = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const eyeB = new THREE.MeshLambertMaterial({ color: 0x111111 });
    for (const side of [-1, 1]) {
      const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), eyeW);
      e1.position.set(side*0.14, 1.6, 0.26);
      this.group.add(e1);
      const e2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.03), eyeB);
      e2.position.set(side*0.14, 1.58, 0.28);
      this.group.add(e2);
    }

    // 手臂
    this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), skin);
    this.armL.position.set(-0.5, 0.95, 0);
    this.armL.castShadow = true;
    this.group.add(this.armL);
    this.armR = this.armL.clone();
    this.armR.position.x = 0.5;
    this.group.add(this.armR);

    // 腿
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), pants);
    this.legL.position.set(-0.18, 0.25, 0);
    this.legL.castShadow = true;
    this.group.add(this.legL);
    this.legR = this.legL.clone();
    this.legR.position.x = 0.18;
    this.group.add(this.legR);
  }

  get mesh() { return this.group; }

  update(dt, input) {
    // 方向（相对于相机）
    let dx = 0, dz = 0;
    if (input.left)  dx = -1;
    if (input.right) dx =  1;
    if (input.fwd)   dz = -1;
    if (input.back)  dz =  1;
    if (dx && dz) { dx *= 0.707; dz *= 0.707; }

    const spd = this.inWater ? 3.5 : this.speed;
    this.vx = dx * spd;
    this.vz = dz * spd;

    // 朝向
    if (dx || dz) {
      this.faceX = dx; this.faceZ = dz;
      this.group.rotation.y = Math.atan2(dx, dz);
    }

    // 跳跃 / 游泳
    if (input.jump) {
      if (this.grounded) { this.vy = this.jumpV; this.grounded = false; }
      else if (this.inWater) this.vy = 3;
    }

    // 重力 / 浮力
    if (this.inWater) {
      this.vy += this.gravity * 0.15 * dt;
      this.vy *= 0.95;
      this.vy = clamp(this.vy, -3, 3);
    } else if (!this.grounded) {
      this.vy -= this.gravity * dt;
    }

    // 位移
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;

    // 水面
    this.inWater = this.y < WATER_Y + 0.3;

    // 碰撞（AABB vs 木筏方块）
    this.grounded = false;
    for (const b of this.raft.blocks) {
      const top = b.y + CELL/2;
      if (Math.abs(this.x-b.x) < CELL/2+0.3 && Math.abs(this.z-b.z) < CELL/2+0.3) {
        if (this.y >= top - 0.3 && this.y <= top + 0.5 && this.vy <= 0) {
          this.y = top;
          this.vy = 0;
          this.grounded = true;
          this.inWater = false;
        }
      }
    }

    if (this.y < -2) { this.y = -2; this.vy = 0; }

    // 生存
    this.hunger = clamp(this.hunger - dt*0.4, 0, 100);
    this.thirst = clamp(this.thirst - dt*0.5, 0, 100);
    if (this.hunger<=0 || this.thirst<=0) this.hp = clamp(this.hp - dt*3, 0, 100);

    // 动画
    this.anim += dt;
    const swing = (this.vx||this.vz) ? Math.sin(this.anim*8)*0.4 : 0;
    const swim = this.inWater ? Math.sin(this.anim*6)*0.5 : 0;
    this.armL.rotation.x =  swing + swim;
    this.armR.rotation.x = -swing - swim;
    this.legL.rotation.x = -swing + swim;
    this.legR.rotation.x =  swing - swim;

    // 同步模型位置
    this.group.position.set(this.x, this.y, this.z);
  }

  useItem(id) {
    const eff = { food:{s:'hunger',v:25}, water:{s:'thirst',v:25},
                  bandage:{s:'hp',v:30}, cooked:{s:'hunger',v:40} };
    const d = eff[id];
    if (!d || (this.inv[id]||0)<=0) return null;
    this.inv[id]--;
    if (d.s==='hunger') this.hunger = clamp(this.hunger+d.v,0,100);
    if (d.s==='thirst') this.thirst = clamp(this.thirst+d.v,0,100);
    if (d.s==='hp')     this.hp     = clamp(this.hp+d.v,0,100);
    return d.s;
  }
}

// ===== 3D 木筏 =====
export class Raft3D {
  constructor(scene) {
    this.scene = scene;
    this.blocks = [];   // { x, z, y, mesh }
    this.workbenches = [];
    this.group = new THREE.Group();
    scene.add(this.group);

    // 初始 5x3
    for (let ix=-2; ix<=2; ix++) for (let iz=-1; iz<=1; iz++) {
      this.addBlock(ix*CELL, 0.25, iz*CELL);
    }
  }

  addBlock(x, y, z) {
    const geo = new THREE.BoxGeometry(CELL, 0.5, CELL);
    const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.5+Math.random()*0.1, 0.32+Math.random()*0.05, 0.12) });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.blocks.push({ x, y, z, mesh });
  }

  addWorkbench(x, y, z) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), new THREE.MeshLambertMaterial({ color: 0xA0522D }));
    base.position.y = 0.4;
    base.castShadow = true;
    group.add(base);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 1.4), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    top.position.y = 0.85;
    group.add(top);
    // 锤子图标（小方块）
    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), new THREE.MeshLambertMaterial({ color: 0x666666 }));
    hammer.position.set(0, 1.1, 0);
    hammer.rotation.z = 0.5;
    group.add(hammer);
    group.position.set(x, y, z);
    this.scene.add(group);
    const wb = { x, y, z, mesh: group };
    this.workbenches.push(wb);
    return wb;
  }

  expand(dir) {
    const xs = this.blocks.map(b=>b.x);
    const zs = this.blocks.map(b=>b.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const y = 0.25;

    if (dir==='right') { for (let z=minZ; z<=maxZ; z+=CELL) this.addBlock(maxX+CELL, y, z); }
    if (dir==='left')  { for (let z=minZ; z<=maxZ; z+=CELL) this.addBlock(minX-CELL, y, z); }
    if (dir==='fwd')   { for (let x=minX; x<=maxX; x+=CELL) this.addBlock(x, y, maxZ+CELL); }
    if (dir==='back')  { for (let x=minX; x<=maxX; x+=CELL) this.addBlock(x, y, minZ-CELL); }
    return true;
  }

  expandSlots(px, pz) {
    const xs = this.blocks.map(b=>b.x);
    const zs = this.blocks.map(b=>b.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const y = 0.25;
    const slots = [];
    if (px > maxX - CELL*1.5) slots.push({ x:maxX+CELL, y, z:pz, dir:'right' });
    if (px < minX + CELL*1.5) slots.push({ x:minX-CELL, y, z:pz, dir:'left'  });
    if (pz > maxZ - CELL*1.5) slots.push({ x:px, y, z:maxZ+CELL, dir:'fwd'   });
    if (pz < minZ + CELL*1.5) slots.push({ x:px, y, z:minZ-CELL, dir:'back'  });
    return slots;
  }
}

// ===== 3D 漂浮物 =====
const DROP_DEFS = [
  { type:'plank',   color:0x8B4513, shape:'box',    weight:35 },
  { type:'plastic', color:0x3498db, shape:'tri',    weight:25 },
  { type:'rope',    color:0xf39c12, shape:'cyl',    weight:15 },
  { type:'food',    color:0xe74c3c, shape:'sphere', weight:15 },
  { type:'metal',   color:0x95a5a6, shape:'oct',    weight:7  },
  { type:'chest',   color:0xf1c40f, shape:'box2',   weight:3  },
];

function pickDrop() {
  const t = DROP_DEFS.reduce((s,d)=>s+d.weight,0);
  let r = Math.random()*t;
  for (const d of DROP_DEFS) { r-=d.weight; if(r<=0) return d; }
  return DROP_DEFS[0];
}

export class DropManager {
  constructor(scene) {
    this.scene = scene;
    this.drops = [];
    this.timer = 0;
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  update(dt, player) {
    this.timer += dt;
    if (this.timer > 2.2) { this.timer = 0; this.spawn(); }

    for (const d of this.drops) {
      if (d.collected) {
        d.collectT += dt*4;
        d.mesh.position.x += (player.x - d.mesh.position.x) * d.collectT * 0.15;
        d.mesh.position.y += (player.y+1 - d.mesh.position.y) * d.collectT * 0.15;
        d.mesh.position.z += (player.z - d.mesh.position.z) * d.collectT * 0.15;
      } else {
        d.mesh.position.x += d.vx * dt;
        d.mesh.position.y = WATER_Y + 0.3 + Math.sin(Date.now()/600 + d.bob)*0.1;
        d.life -= dt;
      }
      d.mesh.rotation.y += dt*2;
    }
    // 清理
    this.drops = this.drops.filter(d => {
      const dead = (d.collected && d.collectT>=1) || d.life<=0;
      if (dead) this.group.remove(d.mesh);
      return !dead;
    });
  }

  spawn() {
    const def = pickDrop();
    let mesh;
    const mat = new THREE.MeshLambertMaterial({ color: def.color });
    switch (def.shape) {
      case 'box':  mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.3), mat); break;
      case 'tri':  mesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 4), mat); break;
      case 'cyl':  mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 6), mat); break;
      case 'sphere': mesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), mat); break;
      case 'oct':  mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), mat); break;
      case 'box2': mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), mat); break;
      default:     mesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), mat);
    }
    mesh.castShadow = true;
    const fromLeft = Math.random()>0.5;
    mesh.position.set(fromLeft?-15:15, WATER_Y+0.3, rand(-5,5));
    const d = { def, mesh, vx:(fromLeft?1:-1)*rand(1.5,3.5), bob:rand(0,6.28), life:35, collected:false, collectT:0 };
    this.drops.push(d);
    this.group.add(mesh);
  }

  click(player) {
    for (const d of this.drops) {
      if (d.collected) continue;
      const dd = dist(player.x, player.z, d.mesh.position.x, d.mesh.position.z);
      if (dd < 2.5) {
        d.collected = true; d.collectT = 0;
        if (d.def.type==='chest') {
          player.inv.plank = (player.inv.plank||0) + randInt(3,5);
          player.inv.rope  = (player.inv.rope||0)  + randInt(1,2);
          if (Math.random()>0.5) player.inv.metal = (player.inv.metal||0)+1;
          return 'chest';
        }
        player.inv[d.def.type] = (player.inv[d.def.type]||0) + 1;
        return d.def.type;
      }
    }
    return null;
  }
}
