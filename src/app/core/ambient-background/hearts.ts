import * as THREE from 'three';

interface HeartState {
  position: THREE.Vector3;
  rotSpeed: number;
  floatPhase: number;
  floatSpeed: number;
  scale: number;
}

interface BurstSlot {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
}

const BURST_POOL = 48;

/**
 * Glass hearts: one extruded heart geometry instanced across the flock with
 * a clearcoat physical material — reads as glass without the per-object
 * render cost of real `transmission`. Also owns the click heart-burst pool.
 */
export class GlassHearts {
  readonly mesh: THREE.InstancedMesh;
  readonly burstMesh: THREE.InstancedMesh;
  private readonly states: HeartState[] = [];
  private readonly burst: BurstSlot[] = [];
  private readonly dummy = new THREE.Object3D();

  constructor(count: number) {
    const geometry = makeHeartGeometry();

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xf8b7c5,
      metalness: 0.05,
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: 0.38,
      envMapIntensity: 1.2,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < count; i++) {
      this.states.push({
        position: new THREE.Vector3(rand(-18, 18), rand(-9, 10), rand(-11, -2)),
        rotSpeed: rand(0.15, 0.5) * (Math.random() < 0.5 ? -1 : 1),
        floatPhase: rand(0, Math.PI * 2),
        floatSpeed: rand(0.3, 0.7),
        scale: rand(0.28, 0.75),
      });
    }

    // Click-burst pool: small solid hearts, spawned on demand.
    const burstMaterial = new THREE.MeshBasicMaterial({
      color: 0xe58ba4,
      transparent: true,
      opacity: 0.9,
    });
    this.burstMesh = new THREE.InstancedMesh(geometry, burstMaterial, BURST_POOL);
    this.burstMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < BURST_POOL; i++) {
      this.burst.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        scale: 0.1,
      });
    }
    this.hideAllBurst();
  }

  /** Spawns a gentle heart burst at a world-space point (from a click). */
  spawnBurst(point: THREE.Vector3, count = 10): void {
    let spawned = 0;
    for (const slot of this.burst) {
      if (spawned >= count) break;
      if (slot.active) continue;
      slot.active = true;
      slot.position.copy(point);
      const angle = rand(0, Math.PI * 2);
      slot.velocity.set(Math.cos(angle) * rand(0.8, 2), rand(1, 2.6), rand(-0.3, 0.3));
      slot.life = 0;
      slot.maxLife = rand(0.9, 1.5);
      slot.scale = rand(0.08, 0.2);
      spawned++;
    }
  }

  update(dt: number, elapsed: number): void {
    for (let i = 0; i < this.states.length; i++) {
      const s = this.states[i];
      this.dummy.position.set(
        s.position.x,
        s.position.y + Math.sin(elapsed * s.floatSpeed + s.floatPhase) * 0.6,
        s.position.z,
      );
      this.dummy.rotation.set(0, elapsed * s.rotSpeed, Math.sin(elapsed * 0.4 + s.floatPhase) * 0.15);
      this.dummy.scale.setScalar(s.scale * (1 + Math.sin(elapsed * 0.8 + s.floatPhase) * 0.05));
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.burst.length; i++) {
      const slot = this.burst[i];
      if (!slot.active) continue;
      slot.life += dt;
      if (slot.life >= slot.maxLife) {
        slot.active = false;
        this.dummy.scale.setScalar(0.0001);
        this.dummy.updateMatrix();
        this.burstMesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }
      slot.velocity.y -= 2.2 * dt;
      slot.position.addScaledVector(slot.velocity, dt);
      const fade = 1 - slot.life / slot.maxLife;
      this.dummy.position.copy(slot.position);
      this.dummy.rotation.set(0, slot.life * 4, 0);
      this.dummy.scale.setScalar(slot.scale * fade);
      this.dummy.updateMatrix();
      this.burstMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.burstMesh.instanceMatrix.needsUpdate = true;
  }

  private hideAllBurst(): void {
    this.dummy.scale.setScalar(0.0001);
    this.dummy.updateMatrix();
    for (let i = 0; i < BURST_POOL; i++) this.burstMesh.setMatrixAt(i, this.dummy.matrix);
    this.burstMesh.instanceMatrix.needsUpdate = true;
  }
}

/** Classic heart outline extruded into a soft 3D shape (shared with core/three-models). */
function makeHeartGeometry(): THREE.ExtrudeGeometry {
  const x = 0;
  const y = 0;
  const shape = new THREE.Shape();
  shape.moveTo(x + 0.25, y + 0.25);
  shape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
  shape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
  shape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
  shape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
  shape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
  shape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
    curveSegments: 14,
  });
  geometry.center();
  geometry.rotateZ(Math.PI);
  return geometry;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
