import { Injectable, NgZone, inject } from '@angular/core';
import { MotionPreferenceService } from './motion-preference.service';

export type ParticlePreset =
  | 'petals'
  | 'fireflies'
  | 'butterflies'
  | 'hearts'
  | 'sparkles'
  | 'stars'
  | 'lanterns'
  | 'fireworks';

export type ParticleDensity = 'low' | 'medium' | 'high';

interface Particle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  phase: number;
  color: string;
  life: number;
  maxLife: number; // Infinity for ambient (looping) particles
}

interface Field {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  preset: ParticlePreset;
  density: ParticleDensity;
  particles: Particle[];
  width: number;
  height: number;
  dpr: number;
  /** Gated by IntersectionObserver — offscreen fields skip stepping/drawing entirely. */
  visible: boolean;
  observer?: IntersectionObserver;
}

const AMBIENT_COUNTS: Record<ParticleDensity, number> = { low: 8, medium: 16, high: 28 };

const PRESET_COLORS: Record<ParticlePreset, string[]> = {
  petals: ['#F6C9D6', '#F2A9C2', '#FBE4E4'],
  fireflies: ['#FFE9A8', '#FFF3C4', '#FFD98E'],
  butterflies: ['#D6536D', '#B33951', '#F7E7CE'],
  hearts: ['#D6536D', '#B76E79', '#F6C9D6'],
  sparkles: ['#D4AF37', '#F7E7CE', '#FFFFFF'],
  stars: ['#FFFFFF', '#F0EAE2', '#F7E7CE'],
  lanterns: ['#FFB347', '#FFD27A', '#FFE9A8'],
  // One coordinated colour is picked per burst (not per-particle) so each
  // firework reads as a single elegant gold/rose bloom rather than a
  // scattershot of random hues.
  fireworks: ['#D4AF37', '#D6536D', '#B76E79', '#F7E7CE'],
};

const FIREWORK_GLITTER_COLOR = '#FFFDF8';

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * One shared canvas particle system backing every `<app-particle-field>`
 * instance across the site (petals, fireflies, butterflies, hearts,
 * sparkles, stars, lanterns, fireworks). A single requestAnimationFrame loop
 * drives all registered fields instead of one loop per component instance.
 */
@Injectable({ providedIn: 'root' })
export class ParticleEngineService {
  private readonly ngZone = inject(NgZone);
  private readonly motion = inject(MotionPreferenceService);

  private fields = new Map<number, Field>();
  private nextId = 1;
  private rafId: number | null = null;
  private running = false;
  private lastTime = 0;

  register(canvas: HTMLCanvasElement, preset: ParticlePreset, density: ParticleDensity): number {
    const id = this.nextId++;
    const ctx = canvas.getContext('2d');
    if (!ctx) return id;

    const field: Field = {
      canvas,
      ctx,
      preset,
      density,
      particles: [],
      width: 0,
      height: 0,
      dpr: 1,
      visible: false,
    };
    this.resizeField(field);
    this.seedAmbient(field);
    this.fields.set(id, field);

    // Only step/draw a field's particles while its canvas is actually
    // onscreen — with 8+ ambient fields across the page, this is the
    // difference between one active canvas and all of them redrawing every
    // frame regardless of scroll position.
    this.ngZone.runOutsideAngular(() => {
      field.observer = new IntersectionObserver(
        (entries) => {
          field.visible = entries[0]?.isIntersecting ?? false;
        },
        { threshold: 0.01 },
      );
      field.observer!.observe(canvas);
    });

    this.ensureLoop();
    return id;
  }

  unregister(id: number): void {
    this.fields.get(id)?.observer?.disconnect();
    this.fields.delete(id);
    if (this.fields.size === 0) this.stopLoop();
  }

  resize(id: number): void {
    const field = this.fields.get(id);
    if (field) this.resizeField(field);
  }

  /** One-shot burst of particles at a point given in CSS pixels relative to the field's canvas. */
  burst(id: number, xCss: number, yCss: number, count = 20): void {
    const field = this.fields.get(id);
    if (!field || this.motion.prefersReducedMotion()) return;

    if (field.preset === 'fireworks') {
      this.burstFirework(field, xCss, yCss);
      return;
    }

    const colors = PRESET_COLORS[field.preset];
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(0.6, 2.4);
      field.particles.push({
        x: xCss,
        y: yCss,
        prevX: xCss,
        prevY: yCss,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        size: rand(3, 8),
        rotation: rand(0, Math.PI * 2),
        rotationSpeed: rand(-0.05, 0.05),
        phase: rand(0, Math.PI * 2),
        color: pick(colors),
        life: 0,
        maxLife: rand(50, 90),
      });
    }
  }

  /**
   * A proper firework burst: one coordinated colour (plus a little ivory
   * glitter mixed in), radiating outward with fading trails and air drag so
   * it decelerates into a gentle gravity fall rather than a flat symmetric
   * pop — call this a few times with slight delays/offsets for a real "show".
   */
  private burstFirework(field: Field, xCss: number, yCss: number): void {
    const mainColor = pick(PRESET_COLORS.fireworks);
    const count = 46;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand(-0.12, 0.12);
      const speed = rand(1.8, 4.2);
      const isGlitter = Math.random() < 0.22;
      field.particles.push({
        x: xCss,
        y: yCss,
        prevX: xCss,
        prevY: yCss,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isGlitter ? rand(1.5, 2.5) : rand(2.5, 4.5),
        rotation: 0,
        rotationSpeed: 0,
        phase: rand(0, Math.PI * 2),
        color: isGlitter ? FIREWORK_GLITTER_COLOR : mainColor,
        life: 0,
        maxLife: rand(55, 95),
      });
    }
  }

  private resizeField(field: Field): void {
    const rect = field.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    field.width = rect.width;
    field.height = rect.height;
    field.dpr = dpr;
    field.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    field.canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }

  private seedAmbient(field: Field): void {
    if (this.motion.prefersReducedMotion()) return;
    if (field.preset === 'fireworks') return; // burst-only preset, never ambient-seeded
    let count = AMBIENT_COUNTS[field.density];
    if (this.motion.isConstrainedDevice()) count = Math.ceil(count * 0.45);

    for (let i = 0; i < count; i++) {
      field.particles.push(this.makeAmbientParticle(field, true));
    }
  }

  private makeAmbientParticle(field: Field, initial: boolean): Particle {
    const w = field.width || 1;
    const h = field.height || 1;
    const x = rand(0, w);
    let y = initial ? rand(0, h) : -20;
    let vx = 0;
    let vy = 0;

    switch (field.preset) {
      case 'petals':
        vx = rand(-0.25, 0.25);
        vy = rand(0.25, 0.7);
        break;
      case 'lanterns':
      case 'hearts':
        vx = rand(-0.2, 0.2);
        vy = rand(-0.45, -0.15);
        if (!initial) y = h + 20;
        break;
      case 'fireflies':
      case 'butterflies':
        vx = rand(-0.4, 0.4);
        vy = rand(-0.3, 0.3);
        break;
      case 'stars':
      case 'sparkles':
        vx = 0;
        vy = 0;
        break;
    }

    return {
      x,
      y,
      prevX: x,
      prevY: y,
      vx,
      vy,
      size: field.preset === 'stars' ? rand(1, 2.4) : rand(4, 10),
      rotation: rand(0, Math.PI * 2),
      rotationSpeed: rand(-0.01, 0.01),
      phase: rand(0, Math.PI * 2),
      color: pick(PRESET_COLORS[field.preset]),
      life: 0,
      maxLife: Infinity,
    };
  }

  private ensureLoop(): void {
    if (this.running) return;
    this.running = true;
    this.ngZone.runOutsideAngular(() => {
      this.lastTime = performance.now();
      const loop = (time: number) => {
        if (!this.running) return;
        const dt = Math.min(2, (time - this.lastTime) / 16.67);
        this.lastTime = time;
        this.tick(dt);
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    });
  }

  private stopLoop(): void {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private tick(dt: number): void {
    const reduced = this.motion.prefersReducedMotion();
    for (const field of this.fields.values()) {
      if (!field.visible) continue; // offscreen — skip clearing/stepping/drawing entirely
      field.ctx.setTransform(field.dpr, 0, 0, field.dpr, 0, 0);
      field.ctx.clearRect(0, 0, field.width, field.height);
      if (!reduced) this.stepField(field, dt);
    }
  }

  private stepField(field: Field, dt: number): void {
    const w = field.width;
    const h = field.height;
    const next: Particle[] = [];

    for (const p of field.particles) {
      p.phase += 0.03 * dt;
      p.rotation += p.rotationSpeed * dt;

      if (field.preset === 'fireflies' || field.preset === 'butterflies') {
        p.vx = Math.max(-0.6, Math.min(0.6, p.vx + Math.sin(p.phase) * 0.01));
        p.vy = Math.max(-0.6, Math.min(0.6, p.vy + Math.cos(p.phase * 0.8) * 0.01));
      }

      p.prevX = p.x;
      p.prevY = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.maxLife !== Infinity) {
        p.life += dt;
        if (p.life >= p.maxLife) continue; // burst particle expired — drop it

        if (field.preset === 'fireworks') {
          // Air drag decelerates the outward burst, gravity takes over as it
          // slows — the classic "explode, hang, then fall" firework arc.
          const drag = Math.pow(0.985, dt);
          p.vx *= drag;
          p.vy *= drag;
          p.vy += 0.03 * dt;
        } else {
          p.vy += 0.015 * dt; // gentle gravity on burst particles
        }
      } else {
        if (field.preset === 'petals' && p.y > h + 20) {
          p.y = -20;
          p.x = rand(0, w);
        }
        if ((field.preset === 'lanterns' || field.preset === 'hearts') && p.y < -20) {
          p.y = h + 20;
          p.x = rand(0, w);
        }
        if (field.preset === 'fireflies' || field.preset === 'butterflies') {
          if (p.x < -20) p.x = w + 20;
          if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20;
          if (p.y > h + 20) p.y = -20;
        }
      }

      this.draw(field, p);
      next.push(p);
    }

    field.particles = next;
  }

  private draw(field: Field, p: Particle): void {
    const ctx = field.ctx;
    const fade = p.maxLife === Infinity ? 1 : Math.max(0, 1 - p.life / p.maxLife);
    const twinkle =
      field.preset === 'stars' || field.preset === 'sparkles' || field.preset === 'fireflies' || field.preset === 'fireworks'
        ? 0.5 + 0.5 * Math.sin(p.phase * 3)
        : 1;
    const opacity = Math.max(0, Math.min(1, fade * twinkle));

    if (field.preset === 'fireworks') {
      this.drawFirework(ctx, p, opacity);
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = opacity;

    if (field.preset === 'butterflies') {
      const flap = Math.sin(p.phase * 4) * 0.5 + 0.5;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(-p.size * 0.5, 0, p.size * 0.6 * (0.4 + flap * 0.6), p.size * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(p.size * 0.5, 0, p.size * 0.6 * (0.4 + (1 - flap) * 0.6), p.size * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (field.preset === 'hearts') {
      const s = p.size / 10;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, 3 * s);
      ctx.bezierCurveTo(-6 * s, -4 * s, -3 * s, -7 * s, 0, -3 * s);
      ctx.bezierCurveTo(3 * s, -7 * s, 6 * s, -4 * s, 0, 3 * s);
      ctx.fill();
    } else {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /** Fading trail streak + soft glow halo + bright ivory core — reads as a real spark, not a flat fading dot. */
  private drawFirework(ctx: CanvasRenderingContext2D, p: Particle, opacity: number): void {
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(0.6, p.size * 0.35);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.prevX, p.prevY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = opacity;

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 3);
    glow.addColorStop(0, p.color);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = FIREWORK_GLITTER_COLOR;
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
