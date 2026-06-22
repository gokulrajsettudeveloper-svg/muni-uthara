import { Component, Input } from '@angular/core';
import { Couple } from '../../models/wedding.model';

@Component({
  selector: 'app-couple',
  standalone: true,
  templateUrl: './couple.html',
  styleUrl: './couple.scss'
})
export class CoupleSection {
  @Input({ required: true }) couple!: Couple;
}
