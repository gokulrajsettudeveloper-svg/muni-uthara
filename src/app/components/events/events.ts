import { Component, Input, inject } from '@angular/core';
import { EventItem } from '../../models/wedding.model';
import { RevealDirective } from '../../core/reveal.directive';
import { Tilt3dDirective } from '../../core/tilt3d.directive';
import { MotionPreferenceService } from '../../core/motion-preference.service';
import { EventsScene } from './events-scene/events-scene';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [RevealDirective, Tilt3dDirective, EventsScene],
  templateUrl: './events.html',
  styleUrl: './events.scss'
})
export class Events {
  @Input({ required: true }) events: EventItem[] = [];

  private readonly motion = inject(MotionPreferenceService);
  readonly isConstrainedDevice = this.motion.isConstrainedDevice;

  /** Generic Google Maps search link built from the event's own venue/address text — works even before a dedicated map embed exists for that venue. */
  directionsUrl(event: EventItem): string {
    const query = [event.venue, event.address].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  /** Generates and downloads an .ics calendar file for the event — pure client side, no backend. */
  addToCalendar(event: EventItem): void {
    const day = new Date(event.date);
    if (isNaN(day.getTime())) return;

    // "05:00 PM" or "05:00 PM - 10:00 PM" → start (and optional end) times.
    const times = [...event.time.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MuniUthara//Wedding//EN', 'BEGIN:VEVENT'];
    const uid = `${event.title.replace(/\W+/g, '-').toLowerCase()}@muni-uthara`;

    if (times.length > 0) {
      const start = this.atTime(day, times[0]);
      // Explicit end time when given, otherwise a sensible 3-hour default.
      const end = times.length > 1 ? this.atTime(day, times[1]) : new Date(start.getTime() + 3 * 60 * 60 * 1000);
      lines.push(`UID:${uid}`, `DTSTAMP:${this.icsStamp(start)}`, `DTSTART:${this.icsStamp(start)}`, `DTEND:${this.icsStamp(end)}`);
    } else {
      const next = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      lines.push(`UID:${uid}`, `DTSTAMP:${this.icsDate(day)}T000000`, `DTSTART;VALUE=DATE:${this.icsDate(day)}`, `DTEND;VALUE=DATE:${this.icsDate(next)}`);
    }

    lines.push(
      `SUMMARY:${this.icsText(`${event.title} — Muniprakash & Uthara`)}`,
      `LOCATION:${this.icsText([event.venue, event.address].filter(Boolean).join(', '))}`,
      `DESCRIPTION:${this.icsText(event.description)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    );

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/\W+/g, '-')}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private atTime(day: Date, match: RegExpMatchArray): Date {
    let hour = parseInt(match[1], 10) % 12;
    if (match[3].toUpperCase() === 'PM') hour += 12;
    const result = new Date(day);
    result.setHours(hour, parseInt(match[2], 10), 0, 0);
    return result;
  }

  /** Local floating time — right for guests attending in person, no timezone conversion surprises. */
  private icsStamp(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  }

  private icsDate(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  }

  private icsText(value: string): string {
    return (value ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
}
