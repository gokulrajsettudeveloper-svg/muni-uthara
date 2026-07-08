import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Venue } from '../../models/wedding.model';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-venue',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './venue.html',
  styleUrl: './venue.scss'
})
export class VenueSection {
  private _venue!: Venue;
  safeMapUrl!: SafeResourceUrl;

  @Input({ required: true })
  set venue(value: Venue) {
    this._venue = value;
    this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(value.mapEmbedUrl);
  }
  get venue(): Venue {
    return this._venue;
  }

  constructor(private sanitizer: DomSanitizer) {}
}
