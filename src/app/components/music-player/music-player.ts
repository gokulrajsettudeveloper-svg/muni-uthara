import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, signal } from '@angular/core';

interface Track {
  title: string;
  url: string;
}

@Component({
  selector: 'app-music-player',
  standalone: true,
  templateUrl: './music-player.html',
  styleUrl: './music-player.scss'
})
export class MusicPlayer implements OnInit, AfterViewInit {
  /** Playlist — a random track is chosen each time the site is opened. */
  @Input({ required: true }) tracks: Track[] = [];

  @ViewChild('audioRef') audioRef!: ElementRef<HTMLAudioElement>;

  readonly current = signal<Track | null>(null);
  readonly isPlaying = signal(false);
  readonly isExpanded = signal(false);
  readonly progress = signal(0);
  readonly volume = signal(0.7);

  private currentIndex = -1;
  private autostarted = false;

  ngOnInit(): void {
    this.pickRandomTrack();
  }

  ngAfterViewInit(): void {
    const audio = this.audioRef.nativeElement;
    audio.volume = this.volume();
    this.loadCurrent();

    // Try to autoplay the random track. Browsers block autoplay-with-sound
    // until the user interacts, so if it's rejected we start on the first tap.
    audio.play()
      .then(() => this.isPlaying.set(true))
      .catch(() => this.armFirstInteractionAutoplay());
  }

  /** Start playback on the visitor's first interaction if autoplay was blocked. */
  private armFirstInteractionAutoplay(): void {
    const start = () => {
      if (this.autostarted) return;
      this.autostarted = true;
      this.audioRef.nativeElement.play()
        .then(() => this.isPlaying.set(true))
        .catch(() => {});
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
  }

  /** Choose a random track, avoiding an immediate repeat when possible. */
  private pickRandomTrack(): void {
    if (!this.tracks.length) return;
    let idx = Math.floor(Math.random() * this.tracks.length);
    if (this.tracks.length > 1 && idx === this.currentIndex) {
      idx = (idx + 1) % this.tracks.length;
    }
    this.currentIndex = idx;
    this.current.set(this.tracks[idx]);
  }

  private loadCurrent(): void {
    const track = this.current();
    if (!track) return;
    const audio = this.audioRef.nativeElement;
    audio.src = track.url;
    audio.load();
  }

  trackTitle(): string {
    return this.current()?.title ?? 'Wedding Theme';
  }

  toggleExpand(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  togglePlay(): void {
    const audio = this.audioRef.nativeElement;
    if (audio.paused) {
      audio.play().then(() => this.isPlaying.set(true)).catch(() => {});
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

  /** When a track finishes, roll another random one and keep playing. */
  onEnded(): void {
    this.progress.set(0);
    this.pickRandomTrack();
    this.loadCurrent();
    this.audioRef.nativeElement.play()
      .then(() => this.isPlaying.set(true))
      .catch(() => this.isPlaying.set(false));
  }
}
