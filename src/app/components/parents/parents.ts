import { Component, Input } from '@angular/core';
import { ParentSide } from '../../models/wedding.model';

@Component({
  selector: 'app-parents',
  standalone: true,
  templateUrl: './parents.html',
  styleUrl: './parents.scss'
})
export class Parents {
  @Input({ required: true }) parents: ParentSide[] = [];
}
