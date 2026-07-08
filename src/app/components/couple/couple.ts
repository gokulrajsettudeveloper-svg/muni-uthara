import { Component, Input } from '@angular/core';
import { Couple } from '../../models/wedding.model';
import { ParticleField } from '../../core/particle-field/particle-field';
import { Tilt3dDirective } from '../../core/tilt3d.directive';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-couple',
  standalone: true,
  imports: [ParticleField, Tilt3dDirective, RevealDirective],
  templateUrl: './couple.html',
  styleUrl: './couple.scss'
})
export class CoupleSection {
  @Input({ required: true }) couple!: Couple;
}
