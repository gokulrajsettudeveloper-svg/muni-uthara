import { Injectable, NgZone, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { MotionPreferenceService } from './motion-preference.service';

gsap.registerPlugin(ScrollTrigger);

/**
 * Owns the single Lenis smooth-scroll instance and keeps GSAP's ScrollTrigger
 * in sync with it. All anchor navigation (navbar links, hero's "Open
 * Invitation" button) should route through `scrollToEl` instead of calling
 * `scrollIntoView` directly, so it doesn't fight Lenis's virtualized scroll.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private readonly ngZone = inject(NgZone);
  private readonly motion = inject(MotionPreferenceService);

  private lenis?: Lenis;
  private tickerFn?: (time: number) => void;

  init(): void {
    if (typeof window === 'undefined' || this.lenis) return;
    if (this.motion.prefersReducedMotion()) return;

    this.ngZone.runOutsideAngular(() => {
      this.lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      this.lenis.on('scroll', ScrollTrigger.update);

      this.tickerFn = (time: number) => this.lenis?.raf(time * 1000);
      gsap.ticker.add(this.tickerFn);
      gsap.ticker.lagSmoothing(0);
    });
  }

  /** Smooth-scrolls to a section by element id; falls back to native scroll if Lenis isn't active. */
  scrollToEl(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;

    if (this.lenis) {
      this.lenis.scrollTo(el, { offset: -70 });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  destroy(): void {
    if (this.tickerFn) gsap.ticker.remove(this.tickerFn);
    this.lenis?.destroy();
    this.lenis = undefined;
  }
}
