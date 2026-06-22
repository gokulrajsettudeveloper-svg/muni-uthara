import { Component, signal } from '@angular/core';

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
export class Navbar {
  readonly isOpen = signal(false);

  readonly links: NavLink[] = [
    { label: 'Home', target: 'hero' },
    { label: 'Couple', target: 'couple' },
    { label: 'Story', target: 'story' },
    { label: 'Events', target: 'events' },
    { label: 'Gallery', target: 'gallery' },
    { label: 'RSVP', target: 'rsvp' }
  ];

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  scrollTo(target: string): void {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
    this.isOpen.set(false);
  }
}