import { Component, OnInit, signal } from '@angular/core';
import { RevealDirective } from '../../core/reveal.directive';

/**
 * One combined "share" surface: social share buttons, copy-link, and the
 * scannable QR code side by side — they all do the same job (spread the
 * invitation), so they live in one section instead of two.
 */
@Component({
  selector: 'app-share',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './share.html',
  styleUrl: './share.scss'
})
export class Share implements OnInit {
  readonly copied = signal(false);
  readonly qrDataUrl = signal<string>('');
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

  async ngOnInit(): Promise<void> {
    const target = this.pageUrl || 'https://muni-uthara.vercel.app/';

    try {
      // qrcode is a CommonJS module. In the optimized production bundle the
      // ESM interop nests the API under `.default`, while the dev build exposes
      // it directly — so resolve whichever object actually has `toDataURL`.
      const mod: any = await import('qrcode');
      const QRCode = typeof mod?.toDataURL === 'function' ? mod : (mod?.default ?? mod);

      const dataUrl = await QRCode.toDataURL(target, {
        width: 320,
        margin: 2,
        color: {
          dark: '#2C2C2C',
          light: '#FFFDF9'
        }
      });
      this.qrDataUrl.set(dataUrl);
    } catch (err) {
      console.error('QR generation failed', err);
      // Fallback so the code is never blank: a lightweight hosted generator.
      this.qrDataUrl.set(
        `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(target)}`
      );
    }
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

  downloadQr(): void {
    if (!this.qrDataUrl()) return;
    const link = document.createElement('a');
    link.download = 'wedding-invite-qr.png';
    link.href = this.qrDataUrl();
    link.click();
  }

  printQr(): void {
    if (!this.qrDataUrl()) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Wedding QR Code</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <img src="${this.qrDataUrl()}" style="width:320px;" />
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }
}
