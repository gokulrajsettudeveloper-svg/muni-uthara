import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-countdown',
  standalone: true,
  templateUrl: './countdown.html',
  styleUrl: './countdown.scss'
})
export class Countdown implements OnInit, OnDestroy {
  @Input({ required: true }) targetDate!: string;

  readonly days = signal('00');
  readonly hours = signal('00');
  readonly minutes = signal('00');
  readonly seconds = signal('00');
  readonly isPast = signal(false);

  private timerId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.tick();
    this.timerId = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
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
}
