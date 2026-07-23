import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import * as THREE from 'three';
import { ThreeSceneRuntime } from '../../../core/three-scene.base';

/**
 * A soft, out-of-focus bokeh field behind Event Details — warm gold/rose
 * points at varying depths, additive-blended so they glow rather than
 * flatly fade, drifting almost imperceptibly slowly. Deliberately kept
 * atmospheric (no moon/heart/ring "subjects" like Hero's scene) so it never
 * competes with the event cards and venue map for attention.
 */
@Component({
  selector: 'app-events-scene',
  standalone: true,
  template: `<canvas #canvasRef class="events-scene-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
      .events-scene-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class EventsScene implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly ngZone = inject(NgZone);
  private runtime?: ThreeSceneRuntime;
  private bokeh?: THREE.Points;

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
    this.runtime!.camera.position.set(0, 0, 8);

    const count = 90;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorA = new THREE.Color('#D4AF37'); // warm gold
    const colorB = new THREE.Color('#B76E79'); // rose gold
    const colorC = new THREE.Color('#F7E7CE'); // champagne

    for (let i = 0; i < count; i++) {
      positions[i * 3] = rand(-9, 9);
      positions[i * 3 + 1] = rand(-5, 5);
      positions[i * 3 + 2] = rand(-11, -1);

      const mixed = Math.random() < 0.5 ? colorA.clone().lerp(colorB, Math.random()) : colorA.clone().lerp(colorC, Math.random());
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // sizeAttenuation (default true) already scales each point by perspective
    // distance, so farther points read smaller/softer for free — no need for
    // a custom per-vertex size attribute to fake depth-of-field.
    const material = new THREE.PointsMaterial({
      size: 0.9,
      map: this.makeBokehTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.bokeh = new THREE.Points(geometry, material);
    scene.add(this.bokeh);
  }

  private onFrame(elapsed: number): void {
    if (!this.bokeh) return;
    // Barely-there drift — enough to feel alive, never enough to distract
    // from the content in front of it.
    this.bokeh.rotation.y = Math.sin(elapsed * 0.05) * 0.08;
    this.bokeh.position.y = Math.sin(elapsed * 0.15) * 0.15;
  }

  private makeBokehTexture(): THREE.CanvasTexture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }

  ngOnDestroy(): void {
    this.runtime?.dispose();
  }
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
