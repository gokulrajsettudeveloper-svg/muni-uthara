import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Couple } from '../../models/wedding.model';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero {
  @Input({ required: true }) couple!: Couple;

  scrollToInvite(): void {
    document.getElementById('countdown')?.scrollIntoView({ behavior: 'smooth' });
  }
}
