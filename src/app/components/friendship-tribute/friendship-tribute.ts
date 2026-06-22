import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-friendship-tribute',
  standalone: true,
  templateUrl: './friendship-tribute.html',
  styleUrl: './friendship-tribute.scss'
})
export class FriendshipTribute {
  @Input({ required: true }) friendName = '';
  @Input({ required: true }) photo = '';
  @Input({ required: true }) message = '';
}
