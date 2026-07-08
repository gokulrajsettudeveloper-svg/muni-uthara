import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import * as THREE from 'three';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThreeSceneRuntime } from '../../../core/three-scene.base';
import { addSoftLighting, createHeartMesh, createRingMesh } from '../../../core/three-models';

/**
 * Night-sky WebGL backdrop for the Hero section: starfield, a procedurally
 * textured moon with a cheap additive-blend glow (no real bloom
 * postprocessing — keeps this section fast on mobile), and drifting cloud
 * sprites. A GSAP ScrollTrigger scrub on the Hero section drives a slow
 * camera dolly-in + moon parallax as the visitor scrolls past.
 */
@Component({
  selector: 'app-hero-scene',
  standalone: true,
  template: `<canvas #canvasRef class="hero-scene-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
      .hero-scene-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class HeroScene implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly ngZone = inject(NgZone);
  private runtime?: ThreeSceneRuntime;
  private scrollTrigger?: ScrollTrigger;
  private moon?: THREE.Mesh;
  private clouds: THREE.Sprite[] = [];
  private stars?: THREE.Points;
  private heart?: THREE.Mesh;
  private ring?: THREE.Group;
  private scrollProgress = 0;

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const canvas = this.canvasRef.nativeElement;

      this.runtime = new ThreeSceneRuntime(
        canvas,
        {
          onFrame: (elapsed) => this.onFrame(elapsed),
          onResize: () => {},
        },
        () => this.scrollProgress,
      );

      this.buildScene();

      const hostSection = canvas.closest('.hero') as HTMLElement | null;
      if (hostSection) {
        this.scrollTrigger = ScrollTrigger.create({
          trigger: hostSection,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            this.scrollProgress = self.progress;
          },
        });
      }
    });
  }

  private buildScene(): void {
    const scene = this.runtime!.scene;
    this.runtime!.camera.position.set(0, 0, 12);
    addSoftLighting(scene);

    // Starfield
    const starCount = 240;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 16 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xfff6e0,
      size: 0.06,
      transparent: true,
      opacity: 0.85,
    });
    this.stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(this.stars);

    // Moon: sphere with a procedurally generated canvas texture (no external art needed)
    const moonGeometry = new THREE.SphereGeometry(2.1, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({ map: this.makeMoonTexture() });
    this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
    this.moon.position.set(4.5, 5, -8);
    scene.add(this.moon);

    // Soft halo behind the moon — a sprite with additive blending fakes bloom
    // far more cheaply than a real UnrealBloomPass postprocessing pass.
    const glowMaterial = new THREE.SpriteMaterial({
      map: this.makeGlowTexture(),
      color: 0xffe9a8,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(9, 9, 1);
    glow.position.copy(this.moon.position);
    scene.add(glow);

    // Drifting cloud sprites
    const cloudTexture = this.makeCloudTexture();
    for (let i = 0; i < 4; i++) {
      const cloudMaterial = new THREE.SpriteMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.15,
        depthWrite: false,
      });
      const cloud = new THREE.Sprite(cloudMaterial);
      const scale = 6 + Math.random() * 4;
      cloud.scale.set(scale * 1.8, scale, 1);
      cloud.position.set((Math.random() - 0.5) * 22, Math.random() * 5 - 1, -4 - Math.random() * 6);
      this.clouds.push(cloud);
      scene.add(cloud);
    }

    // Floating 3D heart + wedding ring — real dimensional objects (not just
    // flat sprites/particles), tucked into the background depth off to
    // either side so they never compete with the couple photo/text.
    this.heart = createHeartMesh(0xd6536d, 1.7);
    this.heart.position.set(-6.5, -2.5, -9);
    this.heart.rotation.x = 0.15;
    scene.add(this.heart);

    this.ring = createRingMesh(0xd4af37, 0xffffff, 2.1);
    this.ring.position.set(6.5, -1.5, -7);
    this.ring.rotation.x = Math.PI / 2.6;
    scene.add(this.ring);
  }

  private onFrame(elapsed: number): void {
    if (this.stars) this.stars.rotation.y = elapsed * 0.004;
    if (this.moon) this.moon.rotation.y = elapsed * 0.02;

    this.clouds.forEach((cloud, i) => {
      cloud.position.x += 0.003 + i * 0.0008;
      if (cloud.position.x > 14) cloud.position.x = -14;
    });

    if (this.heart) {
      this.heart.rotation.y = elapsed * 0.35;
      this.heart.position.y = -2.5 + Math.sin(elapsed * 0.6) * 0.3;
    }
    if (this.ring) {
      this.ring.rotation.z = elapsed * 0.5;
      this.ring.position.y = -1.5 + Math.sin(elapsed * 0.5 + 1.2) * 0.3;
    }

    const camera = this.runtime?.camera;
    if (camera) {
      camera.position.z = 12 - this.scrollProgress * 3.5;
      camera.position.y = this.scrollProgress * 1.2;
    }
    if (this.moon) {
      this.moon.position.y = 5 - this.scrollProgress * 2;
    }
  }

  private makeMoonTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(
      size * 0.38,
      size * 0.36,
      size * 0.05,
      size * 0.5,
      size * 0.5,
      size * 0.55,
    );
    gradient.addColorStop(0, '#fffdf2');
    gradient.addColorStop(0.55, '#fbe9c4');
    gradient.addColorStop(1, '#e8c98a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#c9a866';
    for (let i = 0; i < 10; i++) {
      const r = 6 + Math.random() * 14;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
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

  private makeCloudTexture(): THREE.CanvasTexture {
    const w = 256;
    const h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = 'blur(2px)';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 5; i++) {
      const r = 24 + Math.random() * 30;
      const x = w * 0.2 + i * (w * 0.15);
      const y = h / 2 + (Math.random() - 0.5) * 20;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  ngOnDestroy(): void {
    this.scrollTrigger?.kill();
    this.runtime?.dispose();
  }
}
