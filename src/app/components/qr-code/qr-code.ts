import { Component, OnInit, signal } from '@angular/core';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './qr-code.html',
  styleUrl: './qr-code.scss'
})
export class QrCode implements OnInit {
  readonly pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  readonly qrDataUrl = signal<string>('');

  async ngOnInit(): Promise<void> {
    const target = (typeof window !== 'undefined' && window.location.href) || this.pageUrl || 'https://example.com';

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

  download(): void {
    if (!this.qrDataUrl()) return;
    const link = document.createElement('a');
    link.download = 'wedding-invite-qr.png';
    link.href = this.qrDataUrl();
    link.click();
  }

  print(): void {
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
