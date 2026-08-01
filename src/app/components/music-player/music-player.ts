import { Component, inject, signal } from '@angular/core';
import { MusicService } from '../../core/music.service';

const POS_KEY = 'music-player-pos'; // remembered drag position {x, y}

/**
 * Floating corner control — a thin view over {@link MusicService}. It can be
 * dragged anywhere on screen (mouse or touch); the control buttons stay
 * clickable, and the drop position is remembered across visits.
 */
@Component({
  selector: 'app-music-player',
  standalone: true,
  templateUrl: './music-player.html',
  styleUrl: './music-player.scss'
})
export class MusicPlayer {
  protected readonly music = inject(MusicService);

  /** Dragged position (viewport px). `null` → use the default CSS anchor (top-right). */
  readonly pos = signal<{ x: number; y: number } | null>(this.loadPos());
  readonly dragging = signal(false);

  private startX = 0;
  private startY = 0;
  private originX = 0;
  private originY = 0;
  private pointerId = -1;

  protected onPointerDown(ev: PointerEvent): void {
    // Let taps on the transport buttons through — never start a drag on them.
    if ((ev.target as HTMLElement)?.closest('.hm-btn')) return;

    const card = ev.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    this.originX = rect.left;
    this.originY = rect.top;
    this.startX = ev.clientX;
    this.startY = ev.clientY;
    this.pointerId = ev.pointerId;
    try {
      card.setPointerCapture(ev.pointerId);
    } catch { /* capture unsupported — moves still track via the bound handler */ }
    this.dragging.set(true);
    ev.preventDefault();
  }

  protected onPointerMove(ev: PointerEvent): void {
    if (!this.dragging() || ev.pointerId !== this.pointerId) return;
    const card = ev.currentTarget as HTMLElement;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const M = 6; // keep a small margin from the viewport edges
    const x = clamp(this.originX + (ev.clientX - this.startX), M, window.innerWidth - w - M);
    const y = clamp(this.originY + (ev.clientY - this.startY), M, window.innerHeight - h - M);
    this.pos.set({ x, y });
  }

  protected onPointerUp(ev: PointerEvent): void {
    if (!this.dragging()) return;
    this.dragging.set(false);
    try {
      (ev.currentTarget as HTMLElement).releasePointerCapture(ev.pointerId);
    } catch { /* nothing captured — ignore */ }
    const p = this.pos();
    if (p) this.savePos(p);
  }

  private loadPos(): { x: number; y: number } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (typeof p?.x === 'number' && typeof p?.y === 'number') {
        // Rough clamp now (exact clamp happens on the first drag with real size).
        return {
          x: clamp(p.x, 4, (window.innerWidth || 1280) - 120),
          y: clamp(p.y, 4, (window.innerHeight || 800) - 80),
        };
      }
    } catch { /* corrupt/unavailable storage — fall back to the default anchor */ }
    return null;
  }

  private savePos(p: { x: number; y: number }): void {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(p));
    } catch { /* storage unavailable (private mode) — ignore */ }
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
