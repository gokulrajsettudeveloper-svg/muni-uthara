import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, signal } from '@angular/core';

interface Track {
  title: string;
  url: string;
}

const STORAGE_KEY = 'wedding-music';   // remembered preference: 'on' | 'off'
const DEFAULT_VOLUME = 0.25;           // pleasant background level (25%)

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

  /** Music is on and audible. */
  readonly isOn = signal(false);
  /** Autoplay-with-sound was blocked — show the "Tap to Enable Music" prompt. */
  readonly needsEnable = signal(false);
  readonly current = signal<Track | null>(null);

  private currentIndex = -1;
  private interactionArmed = false;

  ngOnInit(): void {
    this.pickRandomTrack();
  }

  ngAfterViewInit(): void {
    const audio = this.audioRef.nativeElement;
    audio.volume = DEFAULT_VOLUME;
    this.loadCurrent();

    // Respect a remembered "off" choice — stay silent, just show the toggle.
    if (this.readPref() === 'off') {
      this.isOn.set(false);
      this.needsEnable.set(false);
      return;
    }

    // Show the "Tap to Enable Music" prompt until the visitor turns sound on,
    // and try autoplay MUTED (browsers allow this) so the track is already
    // rolling. Sound is unmuted on the first interaction or prompt tap.
    this.needsEnable.set(true);
    audio.muted = true;
    audio.play().catch(() => { /* even muted autoplay blocked — wait for gesture */ });
    this.armFirstInteraction();
  }

  /** Turn sound on: unmute, play, remember the choice, hide the prompt. */
  enableSound(): void {
    const audio = this.audioRef.nativeElement;
    audio.muted = false;
    audio.volume = DEFAULT_VOLUME;
    audio.play().then(() => this.isOn.set(true)).catch(() => {});
    this.isOn.set(true);
    this.needsEnable.set(false);
    this.writePref('on');
  }

  /** Turn sound off: pause and remember the choice. */
  private disableSound(): void {
    this.audioRef.nativeElement.pause();
    this.isOn.set(false);
    this.needsEnable.set(false);
    this.writePref('off');
  }

  /** Floating ON/OFF toggle. */
  toggle(): void {
    if (this.isOn()) {
      this.disableSound();
    } else {
      this.enableSound();
    }
  }

  /** Start sound on the visitor's first interaction anywhere on the page. */
  private armFirstInteraction(): void {
    if (this.interactionArmed) return;
    this.interactionArmed = true;

    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
    const start = (ev: Event) => {
      events.forEach(e => window.removeEventListener(e, start, true));
      // honour a meanwhile-chosen "off"; let the player's own buttons self-handle
      if (this.readPref() === 'off' || this.isOn()) return;
      const target = ev.target as HTMLElement | null;
      if (target?.closest?.('.music-player')) return;
      this.enableSound();
    };
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

  /** When a track ends, roll another random one so the music plays continuously. */
  onEnded(): void {
    const audio = this.audioRef.nativeElement;
    const wasMuted = audio.muted;
    this.pickRandomTrack();
    this.loadCurrent();
    audio.muted = wasMuted;
    audio.volume = DEFAULT_VOLUME;
    audio.play().catch(() => {});
  }

  private readPref(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private writePref(value: 'on' | 'off'): void {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch { /* storage unavailable (private mode) — ignore */ }
  }
}
