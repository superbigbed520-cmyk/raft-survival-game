// Three.js 3D 场景：天空、海水、光照、相机
import * as THREE from 'three';
import { WATER_Y, lerp } from './utils.js';

export class Scene3D {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.prepend(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = innerWidth/innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });

    // 光照
    this.sun = new THREE.DirectionalLight(0xffffff, 1.5);
    this.sun.position.set(10, 20, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -20; this.sun.shadow.camera.right = 20;
    this.sun.shadow.camera.top = 20;   this.sun.shadow.camera.bottom = -20;
    this.scene.add(this.sun);
    this.ambient = new THREE.AmbientLight(0x8899bb, 0.6);
    this.scene.add(this.ambient);

    // 海水（大平面 + 顶点波动）
    const waterGeo = new THREE.PlaneGeometry(120, 120, 40, 40);
    waterGeo.rotateX(-Math.PI/2);
    this.waterMat = new THREE.MeshPhongMaterial({
      color: 0x2980b9, transparent: true, opacity: 0.85, shininess: 80,
    });
    this.water = new THREE.Mesh(waterGeo, this.waterMat);
    this.water.position.y = WATER_Y;
    this.water.receiveShadow = true;
    this.scene.add(this.water);
    this._waterBase = waterGeo.attributes.position.array.slice();

    // 海底（深色）
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    floorGeo.rotateX(-Math.PI/2);
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshLambertMaterial({ color: 0x1a5276 }));
    floor.position.y = -3;
    this.scene.add(floor);
  }

  // 相机跟随（第三人称）
  followPlayer(px, py, pz, faceX, faceZ, dt) {
    const camDist = 8, camHeight = 5;
    const tx = px - faceX * camDist;
    const tz = pz - faceZ * camDist;
    const ty = py + camHeight;
    this.camera.position.x = lerp(this.camera.position.x, tx, dt*3);
    this.camera.position.y = lerp(this.camera.position.y, ty, dt*3);
    this.camera.position.z = lerp(this.camera.position.z, tz, dt*3);
    this.camera.lookAt(px, py+1.5, pz);
  }

  // 昼夜更新
  updateSky(phase, time) {
    if (phase === 'day') {
      this.scene.background = new THREE.Color(0x87ceeb);
      this.sun.intensity = 1.5;
      this.ambient.intensity = 0.6;
      this.sun.color.set(0xffffff);
      this.waterMat.color.set(0x2980b9);
    } else if (phase === 'dusk') {
      this.scene.background = new THREE.Color(0xe67e22);
      this.sun.intensity = 0.8;
      this.ambient.intensity = 0.35;
      this.sun.color.set(0xffaa44);
      this.waterMat.color.set(0x1a6fa0);
    } else {
      this.scene.background = new THREE.Color(0x0a0e2a);
      this.sun.intensity = 0.15;
      this.ambient.intensity = 0.12;
      this.sun.color.set(0x4466aa);
      this.waterMat.color.set(0x0d3d5c);
    }
    // 太阳位置
    const a = (time/120) * Math.PI;
    this.sun.position.set(Math.cos(a)*20, 15+Math.sin(a)*10, 10);
  }

  // 波浪动画
  wave(time) {
    const pos = this.water.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = this._waterBase[i*3];
      const z = this._waterBase[i*3+2];
      pos.array[i*3+1] = Math.sin(x*0.5+time)*0.15 + Math.cos(z*0.4+time*0.7)*0.1;
    }
    pos.needsUpdate = true;
    this.water.geometry.computeVertexNormals();
  }

  render() { this.renderer.render(this.scene, this.camera); }
}
