import { Component, ElementRef, Input, OnInit, ViewChild, computed, signal } from '@angular/core';
import { Couple, EventItem, Venue } from '../../models/wedding.model';

@Component({
  selector: 'app-invitation-card',
  standalone: true,
  imports: [],
  templateUrl: './invitation-card.html',
  styleUrl: './invitation-card.scss'
})
export class InvitationCard implements OnInit {
  @Input({ required: true }) couple!: Couple;
  @Input({ required: true }) venue!: Venue;
  /** All events from wedding.json — the card renders entirely from these. */
  @Input({ required: true }) events: EventItem[] = [];

  @ViewChild('cardRef') cardRef!: ElementRef<HTMLElement>;

  readonly selectedIndex = signal(0);
  isDownloading = false;

  /** The currently selected event (everything on the card derives from this). */
  readonly event = computed<EventItem | undefined>(
    () => this.events[this.selectedIndex()] ?? this.events[0]
  );

  ngOnInit(): void {
    // Default to the Reception event when one exists, otherwise the first event.
    const reception = this.events.findIndex(e => this.name(e).toLowerCase().includes('reception'));
    this.selectedIndex.set(reception >= 0 ? reception : 0);
  }

  select(i: number): void {
    this.selectedIndex.set(i);
  }

  /** Event display name — `type` if provided, else `title`. */
  name(e?: EventItem): string {
    return e?.type ?? e?.title ?? '';
  }

  /** Venue/address fall back to the shared venue when not set on the event. */
  venueName(): string {
    return this.event()?.venue ?? this.venue?.name ?? '';
  }

  venueAddress(): string {
    return this.event()?.address ?? this.venue?.address ?? '';
  }

  async download(): Promise<void> {
    if (!this.cardRef) return;
    this.isDownloading = true;
    try {
      const mod: any = await import('html2canvas');
      const html2canvas = mod?.default ?? mod;
      const canvas = await html2canvas(this.cardRef.nativeElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFDF9'
      });
      const link = document.createElement('a');
      link.download = 'wedding-invitation.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      this.isDownloading = false;
    }
  }
}
