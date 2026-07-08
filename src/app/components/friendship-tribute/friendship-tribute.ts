import { Component, Input } from '@angular/core';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-friendship-tribute',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './friendship-tribute.html',
  styleUrl: './friendship-tribute.scss'
})
export class FriendshipTribute {
  @Input({ required: true }) friendName = '';
  @Input({ required: true }) photo = '';
  @Input({ required: true }) message = '';
}
