import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import * as THREE from 'three';
import { ThreeSceneRuntime } from '../three-scene.base';
import { addAmbientLights } from './lights';
import { Petals } from './petals';
import { GlassHearts } from './hearts';
import { AmbientParticles } from './particles';
import { CornerRoses } from './flowers';
import { SilkCloth } from './cloth';
import { BottomFog } from './fog';

/**
 * The site-wide cinematic backdrop: a fixed, full-viewport WebGL scene that
 * continuously animates behind all content — falling rose petals, floating
 * glass hearts, golden sparkles and dust, glass bubbles, corner roses,
 * flowing silk and bottom fog — with mouse-parallax camera drift and a
 * small heart burst on click. Everything is instanced/pooled: the whole
 * scene is ~10 draw calls.
 */
@Component({
  selector: 'app-ambient-background-scene',
  standalone: true,
  template: `<canvas #canvasRef class="ambient-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
      .ambient-canvas {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        display: block;
        z-index: -1;
        pointer-events: none;
      }
    `,
  ],
})
export class AmbientBackgroundScene implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly ngZone = inject(NgZone);
  private runtime?: ThreeSceneRuntime;

  private petals?: Petals;
  private hearts?: GlassHearts;
  private particles?: AmbientParticles;
  private roses?: CornerRoses;
  private cloth?: SilkCloth;
  private fog?: BottomFog;

  private lastElapsed = 0;
  private readonly mouseTarget = new THREE.Vector2(0, 0);
  private readonly raycaster = new THREE.Raycaster();
  private readonly clickPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  private readonly onPointerMove = (event: PointerEvent) => {
    this.mouseTarget.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -((event.clientY / window.innerHeight) * 2 - 1),
    );
  };

  private readonly onClick = (event: MouseEvent) => {
    const camera = this.runtime?.camera;
    if (!camera || !this.hearts) return;
    const ndc = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -((event.clientY / window.innerHeight) * 2 - 1),
    );
    this.raycaster.setFromCamera(ndc, camera);
    const point = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.clickPlane, point)) {
      this.hearts.spawnBurst(point);
    }
  };

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const canvas = this.canvasRef.nativeElement;

      this.runtime = new ThreeSceneRuntime(canvas, {
        onFrame: (elapsed) => this.onFrame(elapsed),
        onResize: () => {
          if (this.runtime && this.roses) this.roses.layout(this.runtime.camera);
        },
      });

      // Cinematic colour response without a postprocessing pass.
      this.runtime.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.runtime.renderer.toneMappingExposure = 1.05;

      this.buildScene();

      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
      window.addEventListener('click', this.onClick, { passive: true });
    });
  }

  private buildScene(): void {
    const scene = this.runtime!.scene;
    const camera = this.runtime!.camera;
    camera.position.set(0, 0, 10);

    addAmbientLights(scene);

    this.petals = new Petals(150);
    scene.add(this.petals.mesh);

    this.hearts = new GlassHearts(40);
    scene.add(this.hearts.mesh, this.hearts.burstMesh);

    this.particles = new AmbientParticles(200, 150, 40);
    this.particles.addTo(scene);

    this.roses = new CornerRoses();
    this.roses.layout(camera);
    scene.add(this.roses.group);

    this.cloth = new SilkCloth();
    scene.add(this.cloth.mesh);

    this.fog = new BottomFog();
    scene.add(this.fog.group);
  }

  private onFrame(elapsed: number): void {
    const dt = Math.min(0.05, elapsed - this.lastElapsed);
    this.lastElapsed = elapsed;

    this.petals?.update(dt, elapsed);
    this.hearts?.update(dt, elapsed);
    this.particles?.update(dt, elapsed);
    this.roses?.update(elapsed);
    this.cloth?.update(elapsed);
    this.fog?.update(elapsed);

    // Elegant camera drift: slow autonomous float plus gentle mouse parallax,
    // eased so movement never feels twitchy. Position only — no big rotations.
    const camera = this.runtime?.camera;
    if (camera) {
      const driftX = Math.sin(elapsed * 0.1) * 0.35;
      const driftY = Math.cos(elapsed * 0.13) * 0.25;
      const targetX = driftX + this.mouseTarget.x * 0.6;
      const targetY = driftY + this.mouseTarget.y * 0.4;
      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (targetY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, -4);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('click', this.onClick);
    this.runtime?.dispose();
  }
}
