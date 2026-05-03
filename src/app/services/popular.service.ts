import { Injectable } from '@angular/core';
import {Subject} from 'rxjs';
import {Title} from '../models/title.model';

interface ProviderCacheEntry {
  expiresAt: number;
  payload: any;
}

interface RatingCacheEntry {
  expiresAt: number;
  payload: PopularRatingSnapshot;
}

export interface PopularRatingSnapshot {
  imdbId: string;
  moviesDatabaseScore: number;
  combinedScore: number;
  tmdbScore: number;
}

export interface PopularGenreOption {
  key: string;
  label: string;
  movieId?: number;
  tvId?: number;
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
  selectedGenreKey = 'all';
  readonly genreOptions: PopularGenreOption[] = [
    {key: 'all', label: 'All'},
    {key: 'action', label: 'Action', movieId: 28, tvId: 10759},
    {key: 'adventure', label: 'Adventure', movieId: 12, tvId: 10759},
    {key: 'animation', label: 'Animation', movieId: 16, tvId: 16},
    {key: 'comedy', label: 'Comedy', movieId: 35, tvId: 35},
    {key: 'crime', label: 'Crime', movieId: 80, tvId: 80},
    {key: 'documentary', label: 'Documentary', movieId: 99, tvId: 99},
    {key: 'drama', label: 'Drama', movieId: 18, tvId: 18},
    {key: 'family', label: 'Family', movieId: 10751, tvId: 10751},
    {key: 'fantasy', label: 'Fantasy', movieId: 14, tvId: 10765},
    {key: 'horror', label: 'Horror', movieId: 27},
    {key: 'mystery', label: 'Mystery', movieId: 9648, tvId: 9648},
    {key: 'romance', label: 'Romance', movieId: 10749, tvId: 10749},
    {key: 'sci-fi', label: 'Sci-Fi', movieId: 878, tvId: 10765},
    {key: 'thriller', label: 'Thriller', movieId: 53},
    {key: 'western', label: 'Western', movieId: 37, tvId: 37}
  ];
  private readonly genreChangedSubject = new Subject<void>();
  readonly genreChanged$ = this.genreChangedSubject.asObservable();
  private readonly providerCacheTtlMs = 10 * 60 * 1000;
  private readonly ratingCacheTtlMs = 2 * 60 * 60 * 1000;
  private readonly providerCache = new Map<string, ProviderCacheEntry>();
  private readonly ratingCache = new Map<string, RatingCacheEntry>();

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

  getCachedRating(cacheKey: string): PopularRatingSnapshot {
    const cached = this.ratingCache.get(cacheKey);
    if (!cached) {
      return null;
    }
    if (cached.expiresAt <= Date.now()) {
      this.ratingCache.delete(cacheKey);
      return null;
    }
    return cached.payload;
  }

  cacheRating(cacheKey: string, payload: PopularRatingSnapshot) {
    this.ratingCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + this.ratingCacheTtlMs
    });
  }

  pruneRatingCache() {
    const now = Date.now();
    for (const [cacheKey, entry] of this.ratingCache.entries()) {
      if (entry.expiresAt <= now) {
        this.ratingCache.delete(cacheKey);
      }
    }
  }

  get selectedGenreLabel(): string {
    return this.genreOptions.find(option => option.key === this.selectedGenreKey)?.label || 'All';
  }

  get availableGenreOptions(): PopularGenreOption[] {
    return this.genreOptions.filter(option => this.isGenreAvailableForSelectedType(option));
  }

  selectGenre(key: string) {
    if (this.selectedGenreKey === key) {
      return;
    }

    this.selectedGenreKey = this.genreOptions.some(option => option.key === key) ? key : 'all';
    this.popularMovies = [];
    this.popularTVShows = [];
    this.popularList = [];
    this.genreChangedSubject.next();
  }

  getSelectedGenreId(type: 'movie' | 'tv'): number | null {
    const selectedGenre = this.genreOptions.find(option => option.key === this.selectedGenreKey);
    if (!selectedGenre || selectedGenre.key === 'all') {
      return null;
    }

    const genreId = type === 'tv' ? selectedGenre.tvId : selectedGenre.movieId;
    return Number.isFinite(genreId) ? genreId : null;
  }

  isGenreAvailableForSelectedType(option: PopularGenreOption): boolean {
    if (option.key === 'all') {
      return true;
    }

    return this.selectedType === 'tv'
      ? Number.isFinite(option.tvId)
      : Number.isFinite(option.movieId);
  }

  ensureSelectedGenreAvailable() {
    const selectedGenre = this.genreOptions.find(option => option.key === this.selectedGenreKey);
    if (selectedGenre && this.isGenreAvailableForSelectedType(selectedGenre)) {
      return;
    }

    this.selectedGenreKey = 'all';
  }

  constructor() { }
}
