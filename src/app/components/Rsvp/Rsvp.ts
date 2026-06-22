import { Component, signal } from '@angular/core';

type RsvpChoice = 'yes' | 'maybe' | 'no' | null;

@Component({
  selector: 'app-rsvp',
  standalone: true,
  templateUrl: './Rsvp.html',
  styleUrl: './Rsvp.scss'
})
export class Rsvp {
  readonly choice = signal<RsvpChoice>(null);
  readonly submitted = signal(false);

  select(value: RsvpChoice): void {
    this.choice.set(value);
    this.submitted.set(true);
  }

  reset(): void {
    this.choice.set(null);
    this.submitted.set(false);
  }
}