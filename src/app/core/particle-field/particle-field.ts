import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { ParticleDensity, ParticleEngineService, ParticlePreset } from '../particle-engine.service';

/**
 * Drop-in decorative particle layer. Place inside a `position: relative`
 * ancestor; it fills that box. Use `burstAt()` for one-shot effects (RSVP
 * heart burst, invitation sparkles, story-orb burst).
 */
@Component({
  selector: 'app-particle-field',
  standalone: true,
  template: `<canvas #canvasRef class="particle-field" aria-hidden="true"></canvas>`,
  styles: [
    `
      .particle-field {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        display: block;
      }
    `,
  ],
})
export class ParticleField implements AfterViewInit, OnDestroy {
  @Input({ required: true }) preset!: ParticlePreset;
  @Input() density: ParticleDensity = 'medium';

  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly engine = inject(ParticleEngineService);
  private fieldId?: number;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.fieldId = this.engine.register(canvas, this.preset, this.density);

    this.resizeObserver = new ResizeObserver(() => {
      if (this.fieldId !== undefined) this.engine.resize(this.fieldId);
    });
    this.resizeObserver.observe(canvas);
  }

  /** Fires a one-shot particle burst at a point given as fractions (0-1) of the field's box. */
  burstAt(xFraction: number, yFraction: number, count = 20): void {
    if (this.fieldId === undefined) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.engine.burst(this.fieldId, xFraction * rect.width, yFraction * rect.height, count);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.fieldId !== undefined) this.engine.unregister(this.fieldId);
  }
}
