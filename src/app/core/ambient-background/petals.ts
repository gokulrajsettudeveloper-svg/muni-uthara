import * as THREE from 'three';

interface PetalState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  spin: THREE.Vector3;
  fallSpeed: number;
  sway: number;
  swayPhase: number;
  scale: number;
}

const AREA_X = 22;
const TOP_Y = 12;
const BOTTOM_Y = -12;

/**
 * Instanced falling rose petals — one teardrop geometry, one material, one
 * draw call for the whole flock. Each petal has its own size, spin, fall
 * speed and sway phase; petals leaving the bottom respawn above the frame.
 */
export class Petals {
  readonly mesh: THREE.InstancedMesh;
  private readonly states: PetalState[] = [];
  private readonly dummy = new THREE.Object3D();

  constructor(count: number) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.5);
    shape.bezierCurveTo(0.42, 0.3, 0.36, -0.32, 0, -0.5);
    shape.bezierCurveTo(-0.36, -0.32, -0.42, 0.3, 0, 0.5);
    const geometry = new THREE.ShapeGeometry(shape, 12);

    const material = new THREE.MeshLambertMaterial({
      color: 0xf6a9bd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < count; i++) {
      this.states.push({
        position: new THREE.Vector3(rand(-AREA_X, AREA_X), rand(BOTTOM_Y, TOP_Y), rand(-10, 2)),
        rotation: new THREE.Euler(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2)),
        spin: new THREE.Vector3(rand(0.3, 1.2), rand(0.3, 1.2), rand(0.3, 1.2)),
        fallSpeed: rand(0.35, 0.9),
        sway: rand(0.3, 0.9),
        swayPhase: rand(0, Math.PI * 2),
        scale: rand(0.16, 0.42),
      });
    }
  }

  update(dt: number, elapsed: number): void {
    for (let i = 0; i < this.states.length; i++) {
      const s = this.states[i];
      s.position.y -= s.fallSpeed * dt;
      s.position.x += Math.sin(elapsed * s.sway + s.swayPhase) * 0.35 * dt;
      s.rotation.x += s.spin.x * dt;
      s.rotation.y += s.spin.y * dt;
      s.rotation.z += s.spin.z * dt;

      if (s.position.y < BOTTOM_Y) {
        s.position.y = TOP_Y + rand(0, 3);
        s.position.x = rand(-AREA_X, AREA_X);
      }

      this.dummy.position.copy(s.position);
      this.dummy.rotation.copy(s.rotation);
      this.dummy.scale.setScalar(s.scale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
