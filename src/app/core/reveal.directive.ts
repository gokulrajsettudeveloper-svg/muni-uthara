import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPreferenceService } from './motion-preference.service';

export type RevealEffect = 'fade' | 'zoom' | 'rotate' | 'parallax';

/**
 * Scroll-triggered entrance reveal — replaces the site's previous AOS
 * `data-aos` attributes with GSAP ScrollTrigger, giving finer control
 * (scrub-ready, killable, respects reduced motion).
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  @Input('appReveal') effect: RevealEffect = 'fade';
  @Input() revealDelay = 0;
  @Input() revealDuration = 0.9;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionPreferenceService);
  private trigger?: ScrollTrigger;

  ngAfterViewInit(): void {
    const target = this.el.nativeElement;

    if (this.motion.prefersReducedMotion()) {
      return;
    }

    const fromVars: gsap.TweenVars = {
      opacity: 0,
      duration: this.revealDuration,
      delay: this.revealDelay,
      ease: 'power3.out',
    };

    switch (this.effect) {
      case 'zoom':
        fromVars['scale'] = 0.85;
        break;
      case 'rotate':
        fromVars['rotateX'] = 12;
        fromVars['y'] = 40;
        break;
      case 'parallax':
        fromVars['y'] = 80;
        break;
      default:
        fromVars['y'] = 30;
    }

    const tween = gsap.from(target, {
      ...fromVars,
      scrollTrigger: {
        trigger: target,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    this.trigger = tween.scrollTrigger ?? undefined;
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
  }
}
