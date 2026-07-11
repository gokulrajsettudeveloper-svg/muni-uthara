import { AfterViewInit, Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import gsap from 'gsap';
import { ParticleField } from '../../core/particle-field/particle-field';
import { RevealDirective } from '../../core/reveal.directive';
import { MotionPreferenceService } from '../../core/motion-preference.service';

type RsvpChoice = 'yes' | 'maybe' | 'no' | null;

@Component({
  selector: 'app-rsvp',
  standalone: true,
  imports: [ParticleField, RevealDirective],
  templateUrl: './Rsvp.html',
  styleUrl: './Rsvp.scss'
})
export class Rsvp implements AfterViewInit {
  readonly choice = signal<RsvpChoice>(null);
  readonly submitted = signal(false);

  @ViewChild('heartField') heartField?: ParticleField;
  @ViewChild('fireworkField') fireworkField?: ParticleField;
  @ViewChild('checkPath') checkPathRef?: ElementRef<SVGPathElement>;

  private readonly motion = inject(MotionPreferenceService);
  private viewReady = false;

  constructor() {
    // Heart-burst + gold checkmark draw whenever a response is submitted —
    // skipped until the view is ready so it never fires on initial state.
    effect(() => {
      const submitted = this.submitted();
      if (this.viewReady) this.playSuccess(submitted);
    });
  }

  ngAfterViewInit(): void {
    const path = this.checkPathRef?.nativeElement;
    if (path) {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    }
    this.viewReady = true;
  }

  select(value: RsvpChoice): void {
    this.choice.set(value);
    this.submitted.set(true);
  }

  reset(): void {
    this.choice.set(null);
    this.submitted.set(false);
  }

  private playSuccess(submitted: boolean): void {
    const path = this.checkPathRef?.nativeElement;

    if (!submitted) {
      if (path) gsap.set(path, { strokeDashoffset: path.getTotalLength() });
      return;
    }

    this.heartField?.burstAt(0.5, 0.5, 18);

    if (this.choice() === 'yes') {
      this.launchFireworksShow();
    }

    if (!path) return;
    if (this.motion.prefersReducedMotion()) {
      gsap.set(path, { strokeDashoffset: 0 });
    } else {
      gsap.to(path, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out', delay: 0.1 });
    }
  }

  /** A little celebratory fireworks show for an enthusiastic "Yes" — three staggered bursts, not one flat symmetric pop. */
  private launchFireworksShow(): void {
    if (this.motion.prefersReducedMotion()) return;

    const bursts: Array<[number, number, number]> = [
      [0.3, 0.4, 0],
      [0.62, 0.32, 0.28],
      [0.46, 0.55, 0.52],
    ];
    bursts.forEach(([x, y, delay]) => {
      gsap.delayedCall(delay, () => this.fireworkField?.burstAt(x, y));
    });
  }
}
