import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import gsap from 'gsap';
import { MotionPreferenceService } from './motion-preference.service';

/** Pointer-driven 3D tilt for glass cards / gallery photos. No-ops on touch and under reduced motion. */
@Directive({
  selector: '[appTilt3d]',
  standalone: true,
  host: { style: 'display: block; transform-style: preserve-3d; will-change: transform;' },
})
export class Tilt3dDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionPreferenceService);

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    if (this.motion.prefersReducedMotion() || this.motion.isConstrainedDevice()) return;

    const rect = this.el.nativeElement.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    gsap.to(this.el.nativeElement, {
      rotateY: px * 14,
      rotateX: -py * 14,
      transformPerspective: 800,
      duration: 0.4,
      ease: 'power2.out',
    });
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    gsap.to(this.el.nativeElement, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
  }
}
