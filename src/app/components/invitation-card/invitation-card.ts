import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Couple, EventItem, Venue } from '../../models/wedding.model';
import { ParticleField } from '../../core/particle-field/particle-field';
import { RevealDirective } from '../../core/reveal.directive';
import { MotionPreferenceService } from '../../core/motion-preference.service';
import { InvitationScene } from './invitation-scene/invitation-scene';

@Component({
  selector: 'app-invitation-card',
  standalone: true,
  imports: [ParticleField, RevealDirective, InvitationScene],
  templateUrl: './invitation-card.html',
  styleUrl: './invitation-card.scss'
})
export class InvitationCard implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) couple!: Couple;
  @Input({ required: true }) venue!: Venue;
  /** All events from wedding.json — the card renders entirely from these. */
  @Input({ required: true }) events: EventItem[] = [];

  @ViewChild('cardRef') cardRef!: ElementRef<HTMLElement>;
  @ViewChild('sceneRef') sceneRef!: ElementRef<HTMLElement>;
  @ViewChild('sparkleField') sparkleField?: ParticleField;

  readonly selectedIndex = signal(0);
  /** Drives the royal box-open reveal sequence (see invitation-card.scss `.opened`/`.revealed`). */
  readonly revealed = signal(false);
  isDownloading = false;

  private readonly motion = inject(MotionPreferenceService);
  readonly isConstrainedDevice = this.motion.isConstrainedDevice;
  private trigger?: ScrollTrigger;

  /** The currently selected event (everything on the card derives from this). */
  readonly event = computed<EventItem | undefined>(
    () => this.events[this.selectedIndex()] ?? this.events[0]
  );

  ngOnInit(): void {
    // Default to the Reception event when one exists, otherwise the first event.
    const reception = this.events.findIndex(e => this.name(e).toLowerCase().includes('reception'));
    this.selectedIndex.set(reception >= 0 ? reception : 0);
  }

  ngAfterViewInit(): void {
    this.trigger = ScrollTrigger.create({
      trigger: this.sceneRef.nativeElement,
      start: 'top 70%',
      once: true,
      onEnter: () => this.openBox(),
    });
  }

  /** Plays the royal box-open sequence — golden lid lifts, ribbon unties, wax seal breaks. */
  openBox(): void {
    if (this.revealed()) return;
    this.revealed.set(true);
    if (!this.motion.prefersReducedMotion()) {
      this.sparkleField?.burstAt(0.5, 0.35, 24);
    }
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

  /** Weekday name for a display date like "25 Aug 2026" — empty if it can't be parsed. */
  weekday(dateStr: string): string {
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-US', { weekday: 'long' });
  }

  /** Morning/Afternoon/Evening tag derived from the event's start time. */
  period(timeStr: string): string {
    const match = timeStr.match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)/i);
    if (!match) return '';
    let hour = parseInt(match[1], 10) % 12;
    if (match[2].toUpperCase() === 'PM') hour += 12;
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
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

  ngOnDestroy(): void {
    this.trigger?.kill();
  }
}
