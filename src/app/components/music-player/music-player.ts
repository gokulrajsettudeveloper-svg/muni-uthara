import { Component, ElementRef, Input, ViewChild, signal } from '@angular/core';

@Component({
  selector: 'app-music-player',
  standalone: true,
  templateUrl: './music-player.html',
  styleUrl: './music-player.scss'
})
export class MusicPlayer {
  @Input({ required: true }) trackUrl!: string;
  @Input() trackTitle = 'Wedding Theme';

  @ViewChild('audioRef') audioRef!: ElementRef<HTMLAudioElement>;

  readonly isPlaying = signal(false);
  readonly isExpanded = signal(false);
  readonly progress = signal(0);
  readonly volume = signal(0.7);

  toggleExpand(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  togglePlay(): void {
    const audio = this.audioRef.nativeElement;
    if (audio.paused) {
      audio.play().catch(() => {});
      this.isPlaying.set(true);
    } else {
      audio.pause();
      this.isPlaying.set(false);
    }
  }

  onTimeUpdate(): void {
    const audio = this.audioRef.nativeElement;
    if (audio.duration) {
      this.progress.set((audio.currentTime / audio.duration) * 100);
    }
  }

  seek(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const audio = this.audioRef.nativeElement;
    if (audio.duration) {
      audio.currentTime = (value / 100) * audio.duration;
    }
  }

  setVolume(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.volume.set(value);
    this.audioRef.nativeElement.volume = value;
  }

  onEnded(): void {
    this.isPlaying.set(false);
    this.progress.set(0);
  }
}