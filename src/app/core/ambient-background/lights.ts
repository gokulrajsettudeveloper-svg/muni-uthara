import * as THREE from 'three';

/**
 * Lighting rig for the ambient background: soft ambient base, a warm key
 * from above, a pink rim from behind-left, and two warm gold point lights
 * that give the glass hearts and bubbles their sparkle. A large additive
 * "light shaft" sprite from the top stands in for volumetric lighting at a
 * tiny fraction of the cost.
 */
export function addAmbientLights(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xfff4f0, 0.75));

  const key = new THREE.DirectionalLight(0xfff2e0, 0.7);
  key.position.set(2, 8, 5);
  scene.add(key);

  const pinkRim = new THREE.DirectionalLight(0xf8b7c5, 0.55);
  pinkRim.position.set(-6, 2, -4);
  scene.add(pinkRim);

  const goldA = new THREE.PointLight(0xd4af37, 0.5, 25);
  goldA.position.set(-5, 3, 2);
  scene.add(goldA);

  const goldB = new THREE.PointLight(0xffd98e, 0.4, 25);
  goldB.position.set(6, -2, 3);
  scene.add(goldB);

  // Faux volumetric shaft from the top of frame.
  const shaft = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeSoftGradientTexture('rgba(255, 240, 220, 0.55)'),
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  shaft.scale.set(26, 18, 1);
  shaft.position.set(0, 9, -8);
  scene.add(shaft);
}

export function makeSoftGradientTexture(inner: string): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
