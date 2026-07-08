import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import gsap from 'gsap';
import { ParticleField } from '../../core/particle-field/particle-field';
import { MotionPreferenceService } from '../../core/motion-preference.service';

/**
 * Emotional loading sequence: two glowing rings rotate, petals drift, and an
 * SVG heart outline draws itself in — completing for real once
 * `WeddingDataService.load()` resolves (via the `ready` input), not on a
 * fake timer.
 */
@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [ParticleField],
  templateUrl: './loading-screen.html',
  styleUrl: './loading-screen.scss',
})
export class LoadingScreen implements AfterViewInit, OnDestroy {
  @Output() finished = new EventEmitter<void>();

  @ViewChild('heartPath', { static: true }) heartPathRef!: ElementRef<SVGPathElement>;
  @ViewChild('ringOuter', { static: true }) ringOuterRef!: ElementRef<SVGGElement>;
  @ViewChild('ringInner', { static: true }) ringInnerRef!: ElementRef<SVGGElement>;

  private readonly motion = inject(MotionPreferenceService);
  private indeterminate?: gsap.core.Tween;
  private isReady = false;

  @Input()
  set ready(value: boolean) {
    if (value && !this.isReady) {
      this.isReady = true;
      this.completeReveal();
    }
  }

  ngAfterViewInit(): void {
    const heart = this.heartPathRef.nativeElement;
    const length = heart.getTotalLength();
    gsap.set(heart, { strokeDasharray: length, strokeDashoffset: length });

    gsap.to(this.ringOuterRef.nativeElement, {
      rotate: 360,
      duration: 7,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%',
    });
    gsap.to(this.ringInnerRef.nativeElement, {
      rotate: -360,
      duration: 5,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%',
    });

    if (this.motion.prefersReducedMotion()) {
      gsap.set(heart, { strokeDashoffset: 0 });
      return;
    }

    this.indeterminate = gsap.to(heart, {
      strokeDashoffset: length * 0.35,
      duration: 1.6,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }

  private completeReveal(): void {
    const heart = this.heartPathRef?.nativeElement;
    this.indeterminate?.kill();

    if (!heart) {
      this.finished.emit();
      return;
    }

    const reduced = this.motion.prefersReducedMotion();
    gsap.to(heart, {
      strokeDashoffset: 0,
      duration: reduced ? 0 : 0.6,
      ease: 'power2.out',
      onComplete: () => gsap.delayedCall(reduced ? 0 : 0.4, () => this.finished.emit()),
    });
  }

  ngOnDestroy(): void {
    this.indeterminate?.kill();
  }
}
