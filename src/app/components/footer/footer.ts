import { Component, Input } from '@angular/core';
import { WeddingData } from '../../models/wedding.model';
import { ParticleField } from '../../core/particle-field/particle-field';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [ParticleField],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  @Input() createdBy = '';
  @Input() social?: WeddingData['social'];
  year = new Date().getFullYear();

  get instagramLink(): string {
    return this.social?.instagram ?? '#';
  }

  get facebookLink(): string {
    return this.social?.facebook ?? '#';
  }

  /** wedding.json's whatsapp field is a share-intent template (`https://wa.me/?text=`) — complete it with the page URL, same pattern the Share section already uses. */
  get whatsappLink(): string {
    const base = this.social?.whatsapp ?? 'https://wa.me/?text=';
    const url = typeof window !== 'undefined' ? window.location.href : '';
    return base + encodeURIComponent("You're invited to our wedding! " + url);
  }
}
