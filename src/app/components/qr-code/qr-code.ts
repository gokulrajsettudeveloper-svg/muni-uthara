import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  templateUrl: './qr-code.html',
  styleUrl: './qr-code.scss'
})
export class QrCode implements OnInit {
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  readonly qrDataUrl = signal<string>('');

  async ngOnInit(): Promise<void> {
    const QRCode = await import('qrcode');
    const dataUrl = await QRCode.toDataURL(this.pageUrl || 'https://example.com', {
      width: 320,
      margin: 2,
      color: {
        dark: '#2C2C2C',
        light: '#FFFDF9'
      }
    });
    this.qrDataUrl.set(dataUrl);
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