import { Injectable, computed, signal } from '@angular/core';

export interface Track {
  title: string;
  url: string;
  /** Optional performing artist, shown under the title in the player. */
  artist?: string;
}

const STORAGE_KEY = 'wedding-music'; // remembered preference: 'on' | 'off'
const DEFAULT_VOLUME = 0.25; // pleasant background level (25%)

/**
 * Single owner of the wedding's background audio.
 *
 * Both the floating corner player and the full "Feel the Vibes" section are
 * thin views over this service, so a play/pause/skip from either surface stays
 * perfectly in sync with the other. The `<audio>` element is created
 * programmatically (rather than living in a component template) so playback
 * survives regardless of which view is mounted.
 */
@Injectable({ providedIn: 'root' })
export class MusicService {
  /** Music is on and audible. */
  readonly isOn = signal(false);
  /** Autoplay-with-sound was blocked — surfaces the "Tap to Enable" prompt. */
  readonly needsEnable = signal(false);
  /** The track currently loaded into the audio element. */
  readonly current = signal<Track | null>(null);
  /** The full playlist. */
  readonly tracks = signal<Track[]>([]);
  /** 0..1 playback position of the current track (drives the vinyl ring). */
  readonly progress = signal(0);
  /** Index of the current track within `tracks()`. */
  readonly currentIndex = signal(-1);
  /** Audio muted (independent of play/pause) — drives the volume icon. */
  readonly muted = signal(false);

  readonly trackTitle = computed(() => this.current()?.title ?? 'Wedding Theme');
  readonly trackArtist = computed(() => this.current()?.artist ?? 'Our Wedding Playlist');

  private audio: HTMLAudioElement | null = null;
  private interactionArmed = false;
  private initialized = false;

  /** Call once, after the wedding data resolves. Subsequent calls are no-ops. */
  init(tracks: Track[]): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    this.tracks.set(tracks);

    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = DEFAULT_VOLUME;
    audio.addEventListener('ended', () => this.next());
    audio.addEventListener('timeupdate', () => {
      this.progress.set(audio.duration ? audio.currentTime / audio.duration : 0);
    });
    this.audio = audio;

    this.pickRandomTrack();
    this.loadCurrent();
    this.attemptAutoplay();
  }

  /** Turn sound on: unmute, play, remember the choice, hide the prompt. */
  enableSound(): void {
    const audio = this.audio;
    if (!audio) return;
    audio.muted = false;
    audio.volume = DEFAULT_VOLUME;
    audio.play().then(() => this.isOn.set(true)).catch(() => {});
    this.isOn.set(true);
    this.muted.set(false);
    this.needsEnable.set(false);
    this.writePref('on');
  }

  /** Mute/unmute without pausing — drives the volume icon in the player. */
  toggleMute(): void {
    const audio = this.audio;
    if (!audio) return;
    const next = !this.muted();
    audio.muted = next;
    this.muted.set(next);
  }

  /** Manual transport: step forward through the playlist in order. */
  nextTrack(): void {
    const list = this.tracks();
    if (!list.length) return;
    this.playIndex((this.currentIndex() + 1) % list.length);
  }

  /** Manual transport: step back through the playlist in order. */
  prevTrack(): void {
    const list = this.tracks();
    if (!list.length) return;
    this.playIndex((this.currentIndex() - 1 + list.length) % list.length);
  }

  /** Floating/section play-pause toggle. */
  toggle(): void {
    if (this.isOn()) {
      this.disableSound();
    } else {
      this.enableSound();
    }
  }

  /** Advance to the next random track and keep the current on/off state. */
  next(): void {
    this.pickRandomTrack();
    this.playCurrentPreservingState();
  }

  /** Jump to a specific track and start it audibly. */
  playIndex(index: number): void {
    const list = this.tracks();
    if (index < 0 || index >= list.length) return;
    this.currentIndex.set(index);
    this.current.set(list[index]);
    this.loadCurrent();
    this.enableSound();
  }

  private disableSound(): void {
    this.audio?.pause();
    this.isOn.set(false);
    this.needsEnable.set(false);
    this.writePref('off');
  }

  private attemptAutoplay(): void {
    const audio = this.audio;
    if (!audio) return;

    // Respect a remembered "off" choice — stay silent, just show the toggle.
    if (this.readPref() === 'off') {
      this.isOn.set(false);
      this.needsEnable.set(false);
      return;
    }

    // OPTIMISTICALLY try real (un-muted) autoplay. Browsers grant this once the
    // visitor has "media engagement" with the site (return visits) — so for
    // them, music just plays.
    audio.muted = false;
    audio.play()
      .then(() => {
        this.isOn.set(true);
        this.needsEnable.set(false);
        this.writePref('on');
      })
      .catch(() => {
        // Blocked (typical first visit). Start MUTED so the track is already
        // rolling, show the prompt, and unmute on the first real interaction
        // anywhere on the page.
        audio.muted = true;
        audio.play().catch(() => { /* even muted autoplay blocked — wait for gesture */ });
        this.needsEnable.set(true);
        this.armFirstInteraction();
      });
  }

  /** Start sound on the visitor's first interaction anywhere on the page. */
  private armFirstInteraction(): void {
    if (this.interactionArmed) return;
    this.interactionArmed = true;

    // NOTE: a mouse-wheel `scroll` is NOT a user-activation gesture, so play()
    // may still be blocked on it — that's why we only disarm once playback
    // actually starts, leaving the next tap/click to work.
    const events = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown', 'scroll'];
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, start, true));

    const start = (ev: Event) => {
      if (this.readPref() === 'off' || this.isOn()) { cleanup(); return; }
      // Gestures on the player's own controls are handled by those buttons.
      const target = ev.target as HTMLElement | null;
      if (target?.closest?.('.music-player')) return;

      const audio = this.audio;
      if (!audio) return;
      audio.muted = false;
      audio.volume = DEFAULT_VOLUME;
      audio.play()
        .then(() => {
          this.isOn.set(true);
          this.needsEnable.set(false);
          this.writePref('on');
          cleanup();
        })
        .catch(() => { /* gesture wasn't enough (e.g. wheel scroll) — stay armed */ });
    };
    events.forEach((e) => window.addEventListener(e, start, { capture: true, passive: true }));
  }

  /** Choose a random track, avoiding an immediate repeat when possible. */
  private pickRandomTrack(): void {
    const list = this.tracks();
    if (!list.length) return;
    let idx = Math.floor(Math.random() * list.length);
    if (list.length > 1 && idx === this.currentIndex()) {
      idx = (idx + 1) % list.length;
    }
    this.currentIndex.set(idx);
    this.current.set(list[idx]);
  }

  private loadCurrent(): void {
    const track = this.current();
    const audio = this.audio;
    if (!track || !audio) return;
    audio.src = track.url;
    audio.load();
    this.progress.set(0);
  }

  /** Load the current track and resume playback with the prior mute state. */
  private playCurrentPreservingState(): void {
    const audio = this.audio;
    if (!audio) return;
    const wasMuted = audio.muted;
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
