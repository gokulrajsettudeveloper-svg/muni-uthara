import { Component, signal } from '@angular/core';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-share',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './share.html',
  styleUrl: './share.scss'
})
export class Share {
  readonly copied = signal(false);
  readonly pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  get whatsappLink(): string {
    return `https://wa.me/?text=${encodeURIComponent("You're invited to our wedding! " + this.pageUrl)}`;
  }

  get facebookLink(): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.pageUrl)}`;
  }

  get telegramLink(): string {
    return `https://t.me/share/url?url=${encodeURIComponent(this.pageUrl)}&text=${encodeURIComponent("You're invited to our wedding!")}`;
  }

  get instagramLink(): string {
    // Instagram has no direct web share-with-prefill; deep link to app
    return 'https://www.instagram.com/';
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.pageUrl);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copied.set(false);
    }
  }
}