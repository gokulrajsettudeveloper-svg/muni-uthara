import { Component, inject } from '@angular/core';
import { MotionPreferenceService } from '../motion-preference.service';
import { AmbientBackgroundScene } from './ambient-background-scene';

/**
 * Gate + lazy-load wrapper for the ambient background. The WebGL scene (and
 * the Three.js chunk with it) only loads once the browser is idle, and is
 * skipped entirely on constrained devices and under reduced motion — those
 * visitors keep the pure-CSS gradient backdrop.
 */
@Component({
  selector: 'app-ambient-background',
  standalone: true,
  imports: [AmbientBackgroundScene],
  template: `
    @if (!isConstrainedDevice() && !prefersReducedMotion()) {
      @defer (on idle) {
        <app-ambient-background-scene></app-ambient-background-scene>
      } @placeholder {
        <span></span>
      }
    }
  `,
})
export class AmbientBackground {
  private readonly motion = inject(MotionPreferenceService);
  readonly isConstrainedDevice = this.motion.isConstrainedDevice;
  readonly prefersReducedMotion = this.motion.prefersReducedMotion;
}
