import { Component, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { SmoothScrollService } from '../../core/smooth-scroll.service';

interface NavLink {
  label: string;
  target: string;
  /** Rendered as a filled call-to-action pill instead of a plain link. */
  cta?: boolean;
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

  // Labels intentionally mirror the section headings they scroll to, so a
  // guest tapping "Timeline" lands on a section actually titled "Our Timeline".
  readonly links: NavLink[] = [
    { label: 'Home', target: 'hero' },
    { label: 'Our Story', target: 'couple' },
    { label: 'Timeline', target: 'story' },
    { label: 'Invitation', target: 'invitation' },
    { label: 'Events', target: 'events' },
    { label: 'Venue', target: 'venue' },
    { label: 'RSVP', target: 'rsvp', cta: true }
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

  /** Anchors keep a real href for keyboard/screen-reader access; we intercept
   *  activation so Lenis drives the scroll instead of a native jump. */
  scrollTo(event: Event, target: string): void {
    event.preventDefault();
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
