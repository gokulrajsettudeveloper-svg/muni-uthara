import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import * as THREE from 'three';
import { ThreeSceneRuntime } from '../../../core/three-scene.base';
import { addSoftLighting, createHeartMesh } from '../../../core/three-models';

/**
 * Full-page 3D backdrop for the Digital Invitation: a luminous halo of
 * golden sparkles slowly orbiting behind the glass panel, soft pink hearts
 * floating at the edges of the frame (never behind the text), a warm bokeh
 * depth field, and gentle light rays from above. Everything glows via
 * additive blending — nothing solid ever sits behind the invitation copy.
 */
@Component({
  selector: 'app-invitation-scene',
  standalone: true,
  template: `<canvas #canvasRef class="invitation-scene-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
      .invitation-scene-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class InvitationScene implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly ngZone = inject(NgZone);
  private runtime?: ThreeSceneRuntime;
  private haloOuter?: THREE.Points;
  private haloInner?: THREE.Points;
  private hearts: THREE.Mesh[] = [];
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
    this.runtime!.camera.position.set(0, 0, 9);
    addSoftLighting(scene);

    // Luminous halo: two counter-rotating rings of golden sparkles, tilted
    // like a crown of light hovering behind the invitation panel.
    this.haloOuter = this.makeSparkleRing(6.2, 90, '#C9A86A');
    this.haloOuter.rotation.x = 1.15;
    this.haloOuter.position.set(0, 0.5, -5);
    scene.add(this.haloOuter);

    this.haloInner = this.makeSparkleRing(4.6, 70, '#F1E3CB');
    this.haloInner.rotation.x = 1.15;
    this.haloInner.position.set(0, 0.5, -5);
    scene.add(this.haloInner);

    // Soft pink hearts at the left/right edges of the frame — deliberately
    // kept clear of the centre so they never muddy the panel text.
    const heartSpots: Array<[number, number, number, number]> = [
      [-8.5, 3.2, -5, 0.9],
      [-7.6, -2.6, -4, 0.6],
      [8.4, 2.4, -5, 0.7],
      [7.8, -3.2, -4, 1.0],
      [-9.6, 0.4, -7, 0.5],
      [9.8, -0.2, -7, 0.55],
    ];
    for (const [x, y, z, size] of heartSpots) {
      const heart = createHeartMesh(0xf6a9bd, size);
      heart.position.set(x, y, z);
      const material = heart.material as THREE.MeshStandardMaterial;
      material.transparent = true;
      material.opacity = 0.8;
      this.hearts.push(heart);
      scene.add(heart);
    }

    // Warm bokeh depth field.
    const count = 70;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorA = new THREE.Color('#C9A86A');
    const colorB = new THREE.Color('#A93B5C');
    const colorC = new THREE.Color('#F1E3CB');
    for (let i = 0; i < count; i++) {
      positions[i * 3] = rand(-11, 11);
      positions[i * 3 + 1] = rand(-6, 6);
      positions[i * 3 + 2] = rand(-13, -3);
      const mixed = Math.random() < 0.5 ? colorA.clone().lerp(colorB, Math.random()) : colorA.clone().lerp(colorC, Math.random());
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }
    const bokehGeometry = new THREE.BufferGeometry();
    bokehGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bokehGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.bokeh = new THREE.Points(
      bokehGeometry,
      new THREE.PointsMaterial({
        size: 0.7,
        map: this.makeGlowTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(this.bokeh);

    // Soft light rays falling from the top corners.
    for (const side of [-1, 1]) {
      const ray = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.makeGlowTexture(),
          color: 0xfff0d0,
          transparent: true,
          opacity: 0.28,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      ray.scale.set(7, 16, 1);
      ray.position.set(side * 6.5, 5.5, -8);
      scene.add(ray);
    }
  }

  private onFrame(elapsed: number): void {
    if (this.haloOuter) this.haloOuter.rotation.z = elapsed * 0.12;
    if (this.haloInner) this.haloInner.rotation.z = -elapsed * 0.18;

    this.hearts.forEach((heart, i) => {
      heart.position.y += Math.sin(elapsed * 0.6 + i * 1.3) * 0.003;
      // Gentle sway rather than a full spin — an extruded heart viewed
      // edge-on reads as a featureless slab, so keep them mostly face-on.
      heart.rotation.y = Math.sin(elapsed * (0.5 + i * 0.08) + i * 2.1) * 0.55;
      heart.rotation.z = Math.sin(elapsed * 0.4 + i) * 0.08;
    });

    if (this.bokeh) {
      this.bokeh.rotation.y = Math.sin(elapsed * 0.05) * 0.08;
      this.bokeh.position.y = Math.sin(elapsed * 0.15) * 0.2;
    }
  }

  private makeSparkleRing(radius: number, count: number, color: string): THREE.Points {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const jitter = rand(-0.25, 0.25);
      positions[i * 3] = Math.cos(angle) * (radius + jitter);
      positions[i * 3 + 1] = Math.sin(angle) * (radius + jitter);
      positions[i * 3 + 2] = rand(-0.4, 0.4);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.22,
        map: this.makeGlowTexture(),
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
  }

  private makeGlowTexture(): THREE.CanvasTexture {
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
