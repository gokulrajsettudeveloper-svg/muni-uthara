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

    // Arm a first-interaction starter up front, then optimistically try to
    // autoplay. Browsers block autoplay-with-sound until the visitor interacts,
    // so on a fresh visit playback begins on the first tap/scroll/key anywhere.
    this.armFirstInteractionAutoplay();
    audio.play()
      .then(() => {
        this.autostarted = true;
        this.isPlaying.set(true);
      })
      .catch(() => { /* blocked — the interaction starter will kick in */ });
  }

  /** Start playback on the visitor's first interaction anywhere on the page. */
  private armFirstInteractionAutoplay(): void {
    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
    const start = (ev: Event) => {
      if (this.autostarted) return;
      this.autostarted = true;
      events.forEach(e => window.removeEventListener(e, start, true));

      // If the gesture landed on the player's own controls, let those handle
      // playback so we don't immediately toggle it back off.
      const target = ev.target as HTMLElement | null;
      if (target?.closest?.('.music-player')) return;

      this.audioRef.nativeElement.play()
        .then(() => this.isPlaying.set(true))
        .catch(() => {});
    };
    // Capture phase + passive so we catch the earliest gesture cleanly.
    events.forEach(e => window.addEventListener(e, start, { capture: true, passive: true }));
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
