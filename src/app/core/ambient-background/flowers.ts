import * as THREE from 'three';

/**
 * Procedural 3D roses anchored to the bottom corners of the frame, with a
 * slow breathing animation and gently swaying leaves. Built from flattened
 * sphere "petals" in two tilted rings around a core — no external models.
 */
export class CornerRoses {
  readonly group = new THREE.Group();
  private readonly roses: THREE.Group[] = [];
  private readonly leaves: THREE.Mesh[] = [];

  constructor() {
    const left = this.makeRose(0xe58ba4);
    left.position.set(-9.5, -6.5, -3);
    left.rotation.z = 0.2;
    this.roses.push(left);
    this.group.add(left);

    const right = this.makeRose(0xf6a9bd);
    right.position.set(9.5, -6.8, -3);
    right.rotation.z = -0.25;
    right.scale.setScalar(0.85);
    this.roses.push(right);
    this.group.add(right);
  }

  /** Reposition the roses to the visible bottom corners for the current viewport. */
  layout(camera: THREE.PerspectiveCamera): void {
    const depth = 3; // roses sit at z = -3
    const distance = camera.position.z + depth;
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    const halfW = halfH * camera.aspect;
    this.roses[0].position.set(-halfW * 0.86, -halfH * 0.82, -depth);
    this.roses[1].position.set(halfW * 0.86, -halfH * 0.86, -depth);
  }

  update(elapsed: number): void {
    this.roses.forEach((rose, i) => {
      const breathe = 1 + Math.sin(elapsed * 0.6 + i * 1.7) * 0.03;
      rose.scale.setScalar((i === 0 ? 1 : 0.85) * breathe);
    });
    this.leaves.forEach((leaf, i) => {
      leaf.rotation.z = leaf.userData['baseZ'] + Math.sin(elapsed * 0.8 + i) * 0.08;
    });
  }

  private makeRose(color: number): THREE.Group {
    const rose = new THREE.Group();
    const petalGeometry = new THREE.SphereGeometry(1, 10, 8);
    const petalMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.85),
      roughness: 0.6,
    });

    // Outer ring of tilted petals.
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeometry, petalMaterial);
      petal.scale.set(1.1, 0.4, 0.8);
      petal.position.set(Math.cos(angle) * 1.15, 0.1, Math.sin(angle) * 1.15);
      petal.rotation.set(Math.sin(angle) * 0.5, -angle, Math.cos(angle) * 0.5);
      rose.add(petal);
    }
    // Inner ring, tighter and higher.
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.4;
      const petal = new THREE.Mesh(petalGeometry, innerMaterial);
      petal.scale.set(0.75, 0.35, 0.6);
      petal.position.set(Math.cos(angle) * 0.55, 0.45, Math.sin(angle) * 0.55);
      petal.rotation.set(Math.sin(angle) * 0.7, -angle, Math.cos(angle) * 0.7);
      rose.add(petal);
    }
    // Bud core.
    const core = new THREE.Mesh(petalGeometry, innerMaterial);
    core.scale.set(0.45, 0.5, 0.45);
    core.position.y = 0.55;
    rose.add(core);

    // Leaves.
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x7a9b6e, roughness: 0.7 });
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(petalGeometry, leafMaterial);
      leaf.scale.set(1.2, 0.12, 0.5);
      leaf.position.set(side * 1.5, -0.5, 0.2);
      leaf.rotation.z = side * 0.4;
      leaf.userData['baseZ'] = leaf.rotation.z;
      this.leaves.push(leaf);
      rose.add(leaf);
    }

    rose.scale.setScalar(1);
    return rose;
  }
}
