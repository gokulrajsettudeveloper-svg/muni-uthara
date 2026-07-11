import { Component, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { SmoothScrollService } from '../../core/smooth-scroll.service';

interface NavLink {
  label: string;
  target: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit, OnDestroy {
  readonly isOpen = signal(false);
  /** Hides the glass navbar on scroll-down past the hero, reveals it on scroll-up. */
  readonly hidden = signal(false);

  readonly links: NavLink[] = [
    { label: 'Home', target: 'hero' },
    { label: 'Couple', target: 'couple' },
    { label: 'Story', target: 'story' },
    { label: 'Events', target: 'events' },
    { label: 'RSVP', target: 'rsvp' }
  ];

  private readonly ngZone = inject(NgZone);
  private lastScrollY = 0;
  private readonly scrollHandler = () => this.onScroll();

  constructor(private smoothScroll: SmoothScrollService) {}

  ngOnInit(): void {
    this.lastScrollY = window.scrollY;
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
  }

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  scrollTo(target: string): void {
    this.smoothScroll.scrollToEl(target);
    this.isOpen.set(false);
  }

  private onScroll(): void {
    const y = window.scrollY;
    const shouldHide = y > this.lastScrollY && y > 120 && !this.isOpen();
    if (shouldHide !== this.hidden()) {
      this.ngZone.run(() => this.hidden.set(shouldHide));
    }
    this.lastScrollY = y;
  }
}
