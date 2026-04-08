import { Injectable } from '@angular/core';
import {Title} from '../models/title.model';

interface ProviderCacheEntry {
  expiresAt: number;
  payload: any;
}

@Injectable({
  providedIn: 'root'
})
export class PopularService {
  public popularList: Title[] = [];
  public popularMovies: Title[] = [];
  public popularTVShows: Title[] = [];
  public loadingPopular = false;
  selectedType = 'movie';
  private readonly providerCacheTtlMs = 10 * 60 * 1000;
  private readonly providerCache = new Map<string, ProviderCacheEntry>();

  getCachedProviders(cacheKey: string) {
    const cached = this.providerCache.get(cacheKey);
    if (!cached) {
      return null;
    }
    if (cached.expiresAt <= Date.now()) {
      this.providerCache.delete(cacheKey);
      return null;
    }
    return cached.payload;
  }

  cacheProviders(cacheKey: string, payload: any) {
    this.providerCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + this.providerCacheTtlMs
    });
  }

  pruneProviderCache() {
    const now = Date.now();
    for (const [cacheKey, entry] of this.providerCache.entries()) {
      if (entry.expiresAt <= now) {
        this.providerCache.delete(cacheKey);
      }
    }
  }

  constructor() { }
}
