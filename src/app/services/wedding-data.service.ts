import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WeddingData } from '../models/wedding.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WeddingDataService {
  readonly data = signal<WeddingData | null>(null);
  readonly loaded = signal(false);

  constructor(private http: HttpClient) {}

  async load(): Promise<WeddingData> {
    if (this.data()) {
      return this.data()!;
    }
    const result = await firstValueFrom(
      this.http.get<WeddingData>('assets/data/wedding.json')
    );
    this.data.set(result);
    this.loaded.set(true);
    return result;
  }
}
