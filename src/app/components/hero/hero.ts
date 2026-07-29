import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Couple } from '../../models/wedding.model';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { ParticleField } from '../../core/particle-field/particle-field';
import { Tilt3dDirective } from '../../core/tilt3d.directive';
import { RevealDirective } from '../../core/reveal.directive';
import { Countdown } from '../countdown/countdown';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [DatePipe, ParticleField, Tilt3dDirective, RevealDirective, Countdown],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero {
  @Input({ required: true }) couple!: Couple;

  constructor(private smoothScroll: SmoothScrollService) {}

  scrollToInvite(): void {
    this.smoothScroll.scrollToEl('invitation');
  }
}
