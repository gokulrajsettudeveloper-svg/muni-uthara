import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../core/reveal.directive';

interface Wish {
  name: string;
  message: string;
  date: string;
}

@Component({
  selector: 'app-guest-wishes',
  standalone: true,
  imports: [FormsModule, RevealDirective],
  templateUrl: './guest-wishes.html',
  styleUrl: './guest-wishes.scss'
})
export class GuestWishes {
  readonly name = signal('');
  readonly message = signal('');

  readonly wishes = signal<Wish[]>([
    {
      name: 'Ramesh & Family',
      message: 'Wishing you both a lifetime of love, happiness and endless togetherness!',
      date: 'May 18, 2026'
    },
    {
      name: 'Divya',
      message: "Two of the kindest people I know, finally together. So happy for you both!",
      date: 'May 22, 2026'
    }
  ]);

  get canSubmit(): boolean {
    return this.name().trim().length > 0 && this.message().trim().length > 0;
  }

  submit(): void {
    if (!this.canSubmit) return;
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    this.wishes.set([
      { name: this.name().trim(), message: this.message().trim(), date: today },
      ...this.wishes()
    ]);
    this.name.set('');
    this.message.set('');
  }
}