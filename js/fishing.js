// 3D 钓鱼
import { rand, clamp, WATER_Y } from './utils.js';
import * as THREE from 'three';

export class Fishing3D {
  constructor(scene) {
    this.scene = scene;
    this.state = 'idle';
    this.charge = 0;
    this.timer = 0;
    this.cooldown = 0;
    this.reward = null;
    this.hookDist = 0;

    // 3D 鱼线 + 鱼钩
    this.lineGeo = new THREE.BufferGeometry();
    this.lineMat = new THREE.LineBasicMaterial({ color: 0xcccccc });
    this.line = new THREE.Line(this.lineGeo, this.lineMat);
    scene.add(this.line);
    this.hook = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }));
    scene.add(this.hook);
    this.line.visible = false;
    this.hook.visible = false;
  }

  update(dt, input, player) {
    if (this.cooldown>0) { this.cooldown-=dt; this._hide(); return; }

    switch (this.state) {
      case 'idle':
        this._hide();
        if (input.fish) this.state='charge', this.charge=0;
        break;
      case 'charge':
        this.charge = clamp(this.charge+dt*110, 0, 100);
        if (!input.fish) { this.state='cast'; this.hookDist=0; }
        break;
      case 'cast':
        this.hookDist += 8*dt;
        this._updateLine(player);
        if (this.hookDist >= (this.charge/100)*6+2) { this.state='wait'; this.timer=rand(1.5,5); }
        break;
      case 'wait':
        this.timer -= dt;
        this._updateLine(player);
        if (this.timer<=0) { this.state='bite'; this.timer=0.8; }
        break;
      case 'bite':
        this.timer -= dt;
        this._updateLine(player);
        if (this.timer<=0) { this.state='idle'; this.cooldown=1.5; this._hide(); }
        else if (input.fish) {
          this.state='reel';
          this.reward = { rarity: this.charge>80?'rare':this.charge>50?'uncommon':'common' };
        }
        break;
      case 'reel':
        this.hookDist -= 12*dt;
        this._updateLine(player);
        if (this.hookDist<=0) { this.state='idle'; this.cooldown=1.5; this.charge=0; this._hide(); }
        break;
    }
  }

  _updateLine(player) {
    this.line.visible = true;
    this.hook.visible = true;
    const hx = player.x + player.faceX * this.hookDist;
    const hz = player.z + player.faceZ * this.hookDist;
    const hy = WATER_Y - 0.5;
    this.hook.position.set(hx, hy, hz);
    // 鱼线
    const pts = new Float32Array([player.x, player.y+1.5, player.z, hx, hy, hz]);
    this.lineGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  }

  _hide() { this.line.visible=false; this.hook.visible=false; }

  getReward() { const r=this.reward; this.reward=null; return r; }
}
