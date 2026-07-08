import { Component, Input, computed, signal } from '@angular/core';
import { GalleryImage } from '../../models/wedding.model';
import { Tilt3dDirective } from '../../core/tilt3d.directive';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [Tilt3dDirective, RevealDirective],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss'
})
export class Gallery {
  private _images: GalleryImage[] = [];

  @Input({ required: true })
  set images(value: GalleryImage[]) {
    this._images = value;
  }
  get images(): GalleryImage[] {
    return this._images;
  }

  readonly activeCategory = signal('All');
  readonly lightboxImage = signal<GalleryImage | null>(null);

  get categories(): string[] {
    return ['All', ...new Set(this.images.map(i => i.category))];
  }

  get filtered(): GalleryImage[] {
    if (this.activeCategory() === 'All') {
      return this.images;
    }
    return this.images.filter(i => i.category === this.activeCategory());
  }

  setCategory(category: string): void {
    this.activeCategory.set(category);
  }

  open(image: GalleryImage): void {
    this.lightboxImage.set(image);
  }

  close(): void {
    this.lightboxImage.set(null);
  }
}
