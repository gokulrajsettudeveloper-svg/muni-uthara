import * as THREE from 'three';

export interface ThreeSceneHooks {
  onFrame(elapsedSeconds: number, scrollProgress: number): void;
  onResize(width: number, height: number): void;
}

/**
 * Shared Three.js renderer/scene/camera boilerplate for the two WebGL
 * scenes in the redesign (hero, countdown). Not an Angular abstraction —
 * just render-loop plumbing: resize handling, IntersectionObserver-gated
 * start/stop (an offscreen canvas never renders), and disposal.
 *
 * IMPORTANT: construct this from inside `NgZone.runOutsideAngular(...)` in
 * the consuming component so its rAF loop never triggers Angular change
 * detection (this app uses zone.js, not zoneless).
 */
export class ThreeSceneRuntime {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  private rafId: number | null = null;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private running = false;
  private readonly startTime = performance.now();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly hooks: ThreeSceneHooks,
    private readonly getScrollProgress: () => number = () => 0,
  ) {
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) this.start();
        else this.stop();
      },
      { threshold: 0.01 },
    );
    this.intersectionObserver.observe(canvas);
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.hooks.onResize(width, height);
  }

  private start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      const elapsed = (performance.now() - this.startTime) / 1000;
      this.hooks.onFrame(elapsed, this.getScrollProgress());
      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stop(): void {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  dispose(): void {
    this.stop();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose();
    });
    this.renderer.dispose();
  }
}
