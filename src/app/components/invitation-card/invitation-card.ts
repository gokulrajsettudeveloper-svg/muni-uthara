import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Couple, Venue } from '../../models/wedding.model';

@Component({
  selector: 'app-invitation-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './invitation-card.html',
  styleUrl: './invitation-card.scss'
})
export class InvitationCard {
  @Input({ required: true }) couple!: Couple;
  @Input({ required: true }) venue!: Venue;

  @ViewChild('cardRef') cardRef!: ElementRef<HTMLElement>;

  isDownloading = false;

  async download(): Promise<void> {
    if (!this.cardRef) return;
    this.isDownloading = true;
    try {
      const html2canvas = (await import('html2canvas')).default;
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
}