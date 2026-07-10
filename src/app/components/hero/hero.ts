import { Component, Input, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Couple } from '../../models/wedding.model';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { MotionPreferenceService } from '../../core/motion-preference.service';
import { ParticleField } from '../../core/particle-field/particle-field';
import { Tilt3dDirective } from '../../core/tilt3d.directive';
import { RevealDirective } from '../../core/reveal.directive';
import { HeroScene } from './hero-scene/hero-scene';
import { Countdown } from '../countdown/countdown';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [DatePipe, ParticleField, Tilt3dDirective, RevealDirective, HeroScene, Countdown],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero {
  @Input({ required: true }) couple!: Couple;

  private readonly motion = inject(MotionPreferenceService);
  readonly isConstrainedDevice = this.motion.isConstrainedDevice;

  constructor(private smoothScroll: SmoothScrollService) {}

  scrollToInvite(): void {
    this.smoothScroll.scrollToEl('invitation');
  }
}
