import { Component, Input } from '@angular/core';
import { ParentSide } from '../../models/wedding.model';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-parents',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './parents.html',
  styleUrl: './parents.scss'
})
export class Parents {
  @Input({ required: true }) parents: ParentSide[] = [];
}
