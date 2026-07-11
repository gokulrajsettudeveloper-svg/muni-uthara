import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, effect, inject, signal } from '@angular/core';
import gsap from 'gsap';
import { MotionPreferenceService } from '../../core/motion-preference.service';
import { ParticleField } from '../../core/particle-field/particle-field';

/**
 * Compact countdown widget embedded directly inside the Hero section (no
 * longer a standalone page section, and no longer owns its own WebGL scene —
 * Hero's own night-sky backdrop already covers that).
 */
@Component({
  selector: 'app-countdown',
  standalone: true,
  imports: [ParticleField],
  templateUrl: './countdown.html',
  styleUrl: './countdown.scss'
})
export class Countdown implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) targetDate!: string;

  readonly days = signal('00');
  readonly hours = signal('00');
  readonly minutes = signal('00');
  readonly seconds = signal('00');
  readonly isPast = signal(false);

  @ViewChild('daysEl') daysEl?: ElementRef<HTMLElement>;
  @ViewChild('hoursEl') hoursEl?: ElementRef<HTMLElement>;
  @ViewChild('minutesEl') minutesEl?: ElementRef<HTMLElement>;
  @ViewChild('secondsEl') secondsEl?: ElementRef<HTMLElement>;
  @ViewChild('fireworkField') fireworkField?: ParticleField;

  private readonly motion = inject(MotionPreferenceService);

  private timerId?: ReturnType<typeof setInterval>;
  private viewReady = false;
  private hasCelebrated = false;

  constructor() {
    // Flip/scale each digit card whenever its value changes — skipped until
    // the view is ready (ViewChild refs exist) so it never fires on the
    // signals' initial '00' value.
    effect(() => {
      this.days();
      if (this.viewReady) this.flipDigit(this.daysEl);
    });
    effect(() => {
      this.hours();
      if (this.viewReady) this.flipDigit(this.hoursEl);
    });
    effect(() => {
      this.minutes();
      if (this.viewReady) this.flipDigit(this.minutesEl);
    });
    effect(() => {
      this.seconds();
      if (this.viewReady) this.flipDigit(this.secondsEl);
    });
  }

  ngOnInit(): void {
    this.tick();
    this.timerId = setInterval(() => this.tick(), 1000);
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private flipDigit(ref?: ElementRef<HTMLElement>): void {
    const el = ref?.nativeElement;
    if (!el || this.motion.prefersReducedMotion()) return;
    gsap.fromTo(el, { rotateX: -90, opacity: 0.4 }, { rotateX: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
  }

  private tick(): void {
    const target = new Date(this.targetDate).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      this.isPast.set(true);
      this.days.set('00');
      this.hours.set('00');
      this.minutes.set('00');
      this.seconds.set('00');
      if (!this.hasCelebrated) {
        this.hasCelebrated = true;
        this.launchFireworksShow();
      }
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    this.days.set(this.pad(d));
    this.hours.set(this.pad(h));
    this.minutes.set(this.pad(m));
    this.seconds.set(this.pad(s));
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  /** Fires once, the moment the countdown flips to "We're Married!" — three staggered bursts across the widget. */
  private launchFireworksShow(): void {
    if (this.motion.prefersReducedMotion()) return;

    const bursts: Array<[number, number, number]> = [
      [0.25, 0.4, 0],
      [0.75, 0.35, 0.28],
      [0.5, 0.55, 0.52],
    ];
    bursts.forEach(([x, y, delay]) => {
      gsap.delayedCall(delay, () => this.fireworkField?.burstAt(x, y));
    });
  }
}
