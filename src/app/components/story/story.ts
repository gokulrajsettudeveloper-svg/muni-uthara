import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StoryMilestone } from '../../models/wedding.model';
import { ParticleField } from '../../core/particle-field/particle-field';
import { RevealDirective } from '../../core/reveal.directive';
import { MotionPreferenceService } from '../../core/motion-preference.service';

interface PositionedMilestone {
  milestone: StoryMilestone;
  x: number;
  y: number;
  index: number;
  /** foreignObject x offset (relative to the orb) for the unfold card — clamped so the card never renders outside the viewBox, regardless of how narrow the container is. */
  cardOffsetX: number;
  /** foreignObject y offset — below the orb by default, flipped above it when there's no room underneath (e.g. the milestone at the heart's bottom tip). */
  cardOffsetY: number;
}

const VIEW_SIZE = 340;
const CURVE_SCALE = 10;
const CARD_WIDTH = 144;
const CARD_HEIGHT = 72;
const CARD_MARGIN = 16;
const CARD_EDGE_PADDING = 6;

/**
 * The "Our Story" timeline as a magical heart-shaped path: each milestone is
 * a glowing memory orb positioned along a parametric heart curve, connected
 * by a golden gradient line that draws in as the section scrolls past.
 * Scrolling an orb into view (or clicking it) triggers a gentle "camera
 * zoom" + heartbeat pulse + a small particle burst at that memory.
 */
@Component({
  selector: 'app-story',
  standalone: true,
  imports: [ParticleField, RevealDirective],
  templateUrl: './story.html',
  styleUrl: './story.scss',
})
export class Story implements AfterViewInit, OnDestroy {
  @Input({ required: true })
  set milestones(value: StoryMilestone[]) {
    this._milestones = value;
    this.positioned = value.map((milestone, index) => {
      const t = (index / Math.max(value.length, 1)) * Math.PI * 2;
      const { x, y } = this.heartPoint(t);

      // Centre the card on the orb by default, but clamp so it never
      // extends past the viewBox edges — otherwise milestones near the
      // left/right tips of the heart push their card off the page on
      // narrow viewports, no matter how the SVG itself is scaled down.
      const minOffsetX = CARD_EDGE_PADDING - x;
      const maxOffsetX = VIEW_SIZE - CARD_EDGE_PADDING - x - CARD_WIDTH;
      const cardOffsetX = Math.min(maxOffsetX, Math.max(minOffsetX, -CARD_WIDTH / 2));

      // Below the orb by default; flip above it when the card would spill
      // past the bottom of the viewBox (the milestone at the heart's bottom
      // tip) — otherwise the section's overflow clipping cuts the card off.
      const spillsBottom = y + CARD_MARGIN + CARD_HEIGHT > VIEW_SIZE - CARD_EDGE_PADDING;
      const cardOffsetY = spillsBottom ? -(CARD_MARGIN + CARD_HEIGHT) : CARD_MARGIN;

      return { milestone, x, y, index, cardOffsetX, cardOffsetY };
    });
  }
  get milestones(): StoryMilestone[] {
    return this._milestones;
  }
  private _milestones: StoryMilestone[] = [];

  positioned: PositionedMilestone[] = [];
  readonly pathD = this.buildPathD();
  readonly activeIndex = signal<number | null>(null);

  @ViewChild('svgWrap', { static: true }) svgWrapRef!: ElementRef<HTMLElement>;
  @ViewChild('particleField') particleField?: ParticleField;
  @ViewChildren('orbGroup') orbGroups!: QueryList<ElementRef<SVGGElement>>;

  private readonly motion = inject(MotionPreferenceService);
  private triggers: ScrollTrigger[] = [];

  ngAfterViewInit(): void {
    if (this.motion.prefersReducedMotion()) return;

    const line = this.svgWrapRef.nativeElement.querySelector<SVGPathElement>('.heart-line');
    if (line) {
      const length = line.getTotalLength();
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
      const tween = gsap.to(line, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: this.svgWrapRef.nativeElement,
          start: 'top 80%',
          end: 'bottom 60%',
          scrub: true,
        },
      });
      if (tween.scrollTrigger) this.triggers.push(tween.scrollTrigger);
    }

    this.orbGroups.forEach((ref, i) => {
      this.triggers.push(
        ScrollTrigger.create({
          trigger: ref.nativeElement,
          start: 'top 75%',
          onEnter: () => this.selectMilestone(i),
        }),
      );
    });
  }

  selectMilestone(index: number): void {
    const point = this.positioned[index];
    if (!point) return;

    const isReplay = this.activeIndex() === index;
    this.activeIndex.set(index);

    if (!this.motion.prefersReducedMotion()) {
      const svg = this.svgWrapRef.nativeElement.querySelector('svg');
      if (svg) {
        gsap.fromTo(
          svg,
          { transformOrigin: `${(point.x / VIEW_SIZE) * 100}% ${(point.y / VIEW_SIZE) * 100}%` },
          { scale: 1.04, duration: 0.35, ease: 'power2.out', yoyo: true, repeat: 1 },
        );
      }

      const orbEl = this.orbGroups.get(index)?.nativeElement;
      if (orbEl) {
        gsap.fromTo(
          orbEl,
          { scale: 1, transformOrigin: '50% 50%' },
          { scale: 1.18, duration: 0.3, ease: 'power2.out', yoyo: true, repeat: 1 },
        );
      }
    }

    if (!isReplay) {
      this.particleField?.burstAt(point.x / VIEW_SIZE, point.y / VIEW_SIZE, 16);
    }
  }

  private heartPoint(t: number): { x: number; y: number } {
    const xMath = 16 * Math.pow(Math.sin(t), 3);
    const yMath = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    // yMath spans roughly [-17, +12], so the curve's vertical midpoint is
    // -2.5 — offset by VIEW_SIZE/2 - 25 to centre it, keeping the bottom
    // tip (and its orb glow) inside the viewBox instead of hanging past it.
    return { x: xMath * CURVE_SCALE + VIEW_SIZE / 2, y: -yMath * CURVE_SCALE + VIEW_SIZE / 2 - 25 };
  }

  private buildPathD(): string {
    const steps = 120;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const { x, y } = this.heartPoint(t);
      d += i === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
    }
    return d + 'Z';
  }

  ngOnDestroy(): void {
    this.triggers.forEach((t) => t.kill());
  }
}
