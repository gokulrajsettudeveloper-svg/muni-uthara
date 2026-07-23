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
}
