import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import * as THREE from 'three';
import { ThreeSceneRuntime } from '../../../core/three-scene.base';
import { addSoftLighting, createRingMesh } from '../../../core/three-models';

/**
 * Ambient galaxy/starfield WebGL backdrop for the Countdown section — an
 * additive-blended point swirl plus a few soft golden glow sprites stand in
 * for real bloom postprocessing (far cheaper on mobile GPUs).
 */
@Component({
  selector: 'app-countdown-scene',
  standalone: true,
  template: `<canvas #canvasRef class="countdown-scene-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
      .countdown-scene-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class CountdownScene implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly ngZone = inject(NgZone);
  private runtime?: ThreeSceneRuntime;
  private galaxy?: THREE.Points;
  private ring?: THREE.Group;

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const canvas = this.canvasRef.nativeElement;
      this.runtime = new ThreeSceneRuntime(canvas, {
        onFrame: (elapsed) => this.onFrame(elapsed),
        onResize: () => {},
      });
      this.buildScene();
    });
  }

  private buildScene(): void {
    const scene = this.runtime!.scene;
    this.runtime!.camera.position.set(0, 0, 9);
    addSoftLighting(scene);

    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorA = new THREE.Color('#D4AF37');
    const colorB = new THREE.Color('#B76E79');

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 9;
      const angle = Math.random() * Math.PI * 2 + radius * 0.6;
      const y = (Math.random() - 0.5) * 1.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 4;

      const mixed = colorA.clone().lerp(colorB, Math.random());
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.galaxy = new THREE.Points(geometry, material);
    scene.add(this.galaxy);

    const glowTexture = this.makeGlowTexture();
    for (let i = 0; i < 3; i++) {
      const material = new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xd4af37,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(6, 6, 1);
      sprite.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 3, -3 - Math.random() * 4);
      scene.add(sprite);
    }

    // A wedding ring drifting at the centre of the galaxy — ties the
    // "counting down to forever" copy to an actual dimensional object
    // rather than only particles.
    this.ring = createRingMesh(0xd4af37, 0xffffff, 2.6);
    this.ring.position.set(0, 0.4, -5);
    this.ring.rotation.x = Math.PI / 2.4;
    scene.add(this.ring);
  }

  private onFrame(elapsed: number): void {
    if (this.galaxy) this.galaxy.rotation.y = elapsed * 0.03;
    if (this.ring) {
      this.ring.rotation.z = elapsed * 0.4;
      this.ring.position.y = 0.4 + Math.sin(elapsed * 0.5) * 0.25;
    }
  }

  private makeGlowTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 240, 200, 0.9)');
    gradient.addColorStop(0.5, 'rgba(255, 220, 160, 0.25)');
    gradient.addColorStop(1, 'rgba(255, 220, 160, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }

  ngOnDestroy(): void {
    this.runtime?.dispose();
  }
}
