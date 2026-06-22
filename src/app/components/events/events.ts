import { Component, Input } from '@angular/core';
import { EventItem } from '../../models/wedding.model';

@Component({
  selector: 'app-events',
  standalone: true,
  templateUrl: './events.html',
  styleUrl: './events.scss'
})
export class Events {
  @Input({ required: true }) events: EventItem[] = [];
}
