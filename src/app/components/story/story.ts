import { Component, Input } from '@angular/core';
import { StoryMilestone } from '../../models/wedding.model';

@Component({
  selector: 'app-story',
  standalone: true,
  templateUrl: './story.html',
  styleUrl: './story.scss'
})
export class Story {
  @Input({ required: true }) milestones: StoryMilestone[] = [];
}
