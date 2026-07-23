import * as THREE from 'three';
import { makeSoftGradientTexture } from './lights';

/**
 * Soft animated fog hugging the bottom of the frame — three large blurred
 * sprites drifting horizontally at slightly different speeds. Far cheaper
 * than volumetric fog and visually equivalent at this opacity.
 */
export class BottomFog {
  readonly group = new THREE.Group();
  private readonly sprites: THREE.Sprite[] = [];

  constructor() {
    const texture = makeSoftGradientTexture('rgba(255, 235, 240, 0.85)');
    for (let i = 0; i < 3; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
        }),
      );
      sprite.scale.set(20 + i * 6, 8, 1);
      sprite.position.set((i - 1) * 9, -8.5 - i * 0.6, -6 - i);
      this.sprites.push(sprite);
      this.group.add(sprite);
    }
  }

  update(elapsed: number): void {
    this.sprites.forEach((sprite, i) => {
      sprite.position.x = (i - 1) * 9 + Math.sin(elapsed * (0.05 + i * 0.02) + i * 2) * 4;
    });
  }
}
