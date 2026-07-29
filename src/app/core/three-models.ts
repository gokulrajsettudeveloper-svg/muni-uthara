import * as THREE from 'three';

/**
 * Small procedural 3D "models" for the Hero/Countdown WebGL backdrops — a
 * heart and a wedding ring, both built directly from Three.js primitives
 * rather than loaded from external model files. Keeps the site fully
 * self-contained (no model-hosting dependency, no licensing questions) while
 * giving the background actual dimensional objects instead of only flat
 * particles/sprites.
 */

/** Classic heart outline (traced in the shape's local XY plane) extruded into a soft 3D shape. */
export function createHeartMesh(color = 0xa93b5c, size = 1): THREE.Mesh {
  const x = 0;
  const y = 0;
  const heartShape = new THREE.Shape();
  heartShape.moveTo(x + 0.25, y + 0.25);
  heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
  heartShape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
  heartShape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
  heartShape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
  heartShape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
  heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

  const geometry = new THREE.ExtrudeGeometry(heartShape, {
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3,
    curveSegments: 20,
  });
  geometry.center();
  geometry.rotateZ(Math.PI); // the shape above traces point-up; flip to the conventional point-down heart

  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.4,
    emissive: new THREE.Color(color).multiplyScalar(0.3),
    emissiveIntensity: 0.5,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(size);
  return mesh;
}

/** A simple wedding ring — a gold band with a small faceted gem, grouped so both move as one. */
export function createRingMesh(goldColor = 0xc9a86a, gemColor = 0xffffff, size = 1): THREE.Group {
  const group = new THREE.Group();

  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.11, 20, 48),
    new THREE.MeshStandardMaterial({ color: goldColor, metalness: 0.85, roughness: 0.2 }),
  );
  group.add(band);

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.17, 0),
    new THREE.MeshStandardMaterial({
      color: gemColor,
      metalness: 0.1,
      roughness: 0.05,
      emissive: 0x99aaff,
      emissiveIntensity: 0.4,
    }),
  );
  gem.position.y = 0.55;
  group.add(gem);

  group.scale.setScalar(size);
  return group;
}

/** Cheap ambient + single directional light — enough to shade the standard-material models above. */
export function addSoftLighting(scene: THREE.Scene): void {
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  const key = new THREE.DirectionalLight(0xfff2d8, 0.9);
  key.position.set(5, 6, 6);
  scene.add(ambient, key);
}
