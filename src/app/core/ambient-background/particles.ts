import * as THREE from 'three';
import { makeSoftGradientTexture } from './lights';

/**
 * The three lightweight particle systems: golden sparkles (twinkling via a
 * per-vertex colour buffer), fine golden dust (slow drift), and glass
 * bubbles (instanced spheres rising slowly). Points systems are one draw
 * call each; bubbles are a single instanced draw.
 */
export class AmbientParticles {
  readonly sparkles: THREE.Points;
  readonly dust: THREE.Points;
  readonly bubbles: THREE.InstancedMesh;

  private readonly sparklePhases: number[] = [];
  private readonly sparkleBase: THREE.Color;
  private readonly bubbleStates: { position: THREE.Vector3; speed: number; wobble: number; scale: number }[] = [];
  private readonly dummy = new THREE.Object3D();

  constructor(sparkleCount: number, dustCount: number, bubbleCount: number) {
    this.sparkleBase = new THREE.Color('#D4AF37');

    // ── Sparkles ──
    {
      const positions = new Float32Array(sparkleCount * 3);
      const colors = new Float32Array(sparkleCount * 3);
      for (let i = 0; i < sparkleCount; i++) {
        positions[i * 3] = rand(-20, 20);
        positions[i * 3 + 1] = rand(-11, 11);
        positions[i * 3 + 2] = rand(-12, 0);
        this.sparklePhases.push(rand(0, Math.PI * 2));
        colors[i * 3] = this.sparkleBase.r;
        colors[i * 3 + 1] = this.sparkleBase.g;
        colors[i * 3 + 2] = this.sparkleBase.b;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      this.sparkles = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          size: 0.09,
          map: makeSoftGradientTexture('rgba(255, 240, 200, 1)'),
          vertexColors: true,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
    }

    // ── Dust ──
    {
      const positions = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        positions[i * 3] = rand(-20, 20);
        positions[i * 3 + 1] = rand(-11, 11);
        positions[i * 3 + 2] = rand(-12, 0);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.dust = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          size: 0.035,
          color: 0xf0d9a0,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
    }

    // ── Bubbles ──
    {
      const geometry = new THREE.SphereGeometry(0.5, 14, 10);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        clearcoat: 1,
        transparent: true,
        opacity: 0.16,
      });
      this.bubbles = new THREE.InstancedMesh(geometry, material, bubbleCount);
      this.bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i < bubbleCount; i++) {
        this.bubbleStates.push({
          position: new THREE.Vector3(rand(-18, 18), rand(-11, 11), rand(-10, -2)),
          speed: rand(0.15, 0.5),
          wobble: rand(0, Math.PI * 2),
          scale: rand(0.2, 0.85),
        });
      }
    }
  }

  addTo(scene: THREE.Scene): void {
    scene.add(this.sparkles, this.dust, this.bubbles);
  }

  update(dt: number, elapsed: number): void {
    // Sparkle twinkle: modulate per-vertex colour brightness.
    const colors = this.sparkles.geometry.getAttribute('color') as THREE.BufferAttribute;
    for (let i = 0; i < this.sparklePhases.length; i++) {
      const twinkle = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(elapsed * 2.2 + this.sparklePhases[i]));
      colors.setXYZ(i, this.sparkleBase.r * twinkle, this.sparkleBase.g * twinkle, this.sparkleBase.b * twinkle);
    }
    colors.needsUpdate = true;

    this.dust.rotation.y = elapsed * 0.008;
    this.dust.position.y = Math.sin(elapsed * 0.1) * 0.4;

    for (let i = 0; i < this.bubbleStates.length; i++) {
      const b = this.bubbleStates[i];
      b.position.y += b.speed * dt;
      b.position.x += Math.sin(elapsed * 0.6 + b.wobble) * 0.15 * dt;
      if (b.position.y > 12) {
        b.position.y = -12;
        b.position.x = rand(-18, 18);
      }
      this.dummy.position.copy(b.position);
      this.dummy.scale.setScalar(b.scale);
      this.dummy.updateMatrix();
      this.bubbles.setMatrixAt(i, this.dummy.matrix);
    }
    this.bubbles.instanceMatrix.needsUpdate = true;
  }
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
