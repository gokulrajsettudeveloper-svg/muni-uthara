import { Component, inject } from '@angular/core';
import { MusicService } from '../../core/music.service';

/**
 * Floating corner control — a thin view over {@link MusicService}. All playback
 * state and autoplay handling live in the service so this stays perfectly in
 * sync with the full "Feel the Vibes" section.
 */
@Component({
  selector: 'app-music-player',
  standalone: true,
  templateUrl: './music-player.html',
  styleUrl: './music-player.scss'
})
export class MusicPlayer {
  protected readonly music = inject(MusicService);
}
