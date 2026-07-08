import { Injectable, signal } from '@angular/core';

/**
 * Central gate for every heavy visual effect in the cinematic redesign.
 * Reduced-motion visitors get instant/static content; constrained devices
 * (touch + narrow viewport, or low core count) get lighter particle density
 * and no WebGL scenes.
 */
@Injectable({ providedIn: 'root' })
export class MotionPreferenceService {
  readonly prefersReducedMotion = signal(this.readReducedMotion());
  readonly isConstrainedDevice = signal(this.readConstrainedDevice());

  constructor() {
    if (typeof window === 'undefined') return;

    window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', (e) => this.prefersReducedMotion.set(e.matches));

    const recompute = () => this.isConstrainedDevice.set(this.readConstrainedDevice());
    window.matchMedia('(pointer: coarse)').addEventListener('change', recompute);
    window.matchMedia('(max-width: 820px)').addEventListener('change', recompute);
  }

  private readReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private readConstrainedDevice(): boolean {
    if (typeof window === 'undefined') return false;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const narrowViewport = window.matchMedia('(max-width: 820px)').matches;
    const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
    return coarsePointer || narrowViewport || lowCores;
  }
}
