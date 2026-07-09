import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TitleService} from '../services/title.service';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Title} from '../models/title.model';
import {AuthService} from '../services/auth.service';
import {Subscription} from 'rxjs';
import {take} from 'rxjs/operators';
import {PopularRatingSnapshot, PopularService} from '../services/popular.service';
import {StreamComponent} from '../stream/stream.component';
import {PageLoaderComponent} from '../shared/page-loader/page-loader.component';
import {apiConfig} from '../config/api.config';

@Component({
    selector: 'app-popular',
    templateUrl: './popular.component.html',
    styleUrls: ['./popular.component.scss'],
    standalone: true,
    imports: [CommonModule, StreamComponent, PageLoaderComponent]
})
export class PopularComponent implements OnInit, OnDestroy {
    protected readonly Math = Math;
    showStreamableCheckBoxSub: Subscription;
    genreChangedSub: Subscription;
    private readonly tmdbApiKey = apiConfig.tmdbApiKey;
    private readonly rapidApiKey = apiConfig.rapidApiKey;
    private readonly moviesDatabaseHost = apiConfig.rapidApiHosts.moviesDatabase;
    private readonly moviesDatabaseRatingsUnavailableKey = 'moviesDatabaseRatingsUnavailable';
    private readonly popularDisplayLimit = 20;
    private moviesDatabaseRatingsUnavailable = this.getMoviesDatabaseRatingsUnavailable();
    private popularFetchRequestId = 0;
    private streamableSettingsReady = false;

    constructor(private http: HttpClient, public ts: TitleService, private auth: AuthService, public popService: PopularService) {
    }

    ngOnInit() {
        this.showStreamableCheckBoxSub = this.auth.bShowStreamableCheckbox$.subscribe(value => {
            if (!value) {
                return;
            }

            // BehaviorSubject replays its current value whenever this route is recreated.
            // Only invalidate the cached lists after a real settings update, not on route return.
            if (this.streamableSettingsReady) {
                this.clearPopularLists();
            }
            this.streamableSettingsReady = true;
            this.toggleMediaType(this.popService.selectedType);
        });
        this.genreChangedSub = this.popService.genreChanged$.subscribe(() => {
            this.toggleMediaType(this.popService.selectedType);
        });
    }

    toggleMediaType(type: 'movie' | 'tv') {
        this.popService.selectedType = type;
        this.popService.ensureSelectedGenreAvailable();
        const selectedList = this.popService.selectedType === 'movie' ? this.popService.popularMovies : this.popService.popularTVShows;
        if (selectedList.length < this.popularDisplayLimit) {
            this.fetchMostPopular();
        } else {
            this.popService.loadingPopular = false;
        }
        this.popService.popularList = selectedList;
    }

    async fetchMostPopular() {
        this.popService.loadingPopular = true;
        const requestId = ++this.popularFetchRequestId;
        const selectedType: 'movie' | 'tv' = this.popService.selectedType === 'tv' ? 'tv' : 'movie';
        const currentYear = new Date().getFullYear();
        let watchProvidersParam = '';
        if (this.auth.user.uid && this.auth.bShowStreamableOnly) {
            const selectedProviders = Array.from(new Set(
                this.auth.providers
                    .filter(provider => provider.selected)
                    .map(provider => provider.id)
            ));

            if (selectedProviders.length > 0) {
                watchProvidersParam = 'with_watch_providers=' + selectedProviders.join('|');
            }
        }

        try {
            let popularTitles: Title[] = [];
            const targetList = selectedType === 'movie' ? this.popService.popularMovies : this.popService.popularTVShows;
            targetList.length = 0;
            this.popService.popularList = targetList;

            if (selectedType === 'movie') {
                const movieUrl = this.buildDiscoverUrl(selectedType, watchProvidersParam);
                const response: any = await this.http.get(movieUrl).pipe(take(1)).toPromise();
                popularTitles = response.results || [];
            } else {
                const tvCurrentYearUrl = this.buildDiscoverUrl(selectedType, watchProvidersParam, currentYear);
                const currentYearResponse: any = await this.http.get(tvCurrentYearUrl).pipe(take(1)).toPromise();
                const currentYearResults: Title[] = currentYearResponse.results || [];

                let mergedTvResults = [...currentYearResults];
                if (mergedTvResults.length < 20) {
                    const tvFallbackUrl = this.buildDiscoverUrl(selectedType, watchProvidersParam);
                    const fallbackResponse: any = await this.http.get(tvFallbackUrl).pipe(take(1)).toPromise();
                    const fallbackResults: Title[] = fallbackResponse.results || [];
                    mergedTvResults = this.mergeById(currentYearResults, fallbackResults, 20);
                }

                popularTitles = mergedTvResults;
            }

            if (!this.isCurrentPopularFetch(requestId, selectedType)) {
                return;
            }

            this.popService.loadingPopular = false;
            await this.addPopularTitlesAsRatingsLoad(
                requestId,
                selectedType,
                popularTitles.slice(0, this.popularDisplayLimit),
                targetList
            );
        } catch (error) {
            console.error('Failed to fetch popular titles', error);
        } finally {
            if (this.isCurrentPopularFetch(requestId, selectedType)) {
                this.popService.loadingPopular = false;
            }
        }
    }

    private async addPopularTitlesAsRatingsLoad(
        requestId: number,
        selectedType: 'movie' | 'tv',
        titles: Title[],
        targetList: Title[]
    ) {
        this.popService.pruneRatingCache();
        this.popService.pruneProviderCache();

        for (const title of titles) {
            if (!this.isCurrentPopularFetch(requestId, selectedType)) {
                return;
            }

            await this.populateRatingsForTitle(title, selectedType);

            if (!this.isCurrentPopularFetch(requestId, selectedType)) {
                return;
            }

            targetList.push(title);
            this.popService.popularList = targetList;
            void this.populateProvidersForTitle(title, selectedType);
        }
    }

    private isCurrentPopularFetch(requestId: number, selectedType: 'movie' | 'tv'): boolean {
        return requestId === this.popularFetchRequestId && selectedType === this.popService.selectedType;
    }

    private async populateProvidersForTitle(title: Title, providerType: 'movie' | 'tv') {
        const cacheKey = `${providerType}:${title.id}`;
        const cachedProviders = this.popService.getCachedProviders(cacheKey);
        if (cachedProviders) {
            this.applyProviders(title, cachedProviders);
            return;
        }

        const watchProvidersUrl = this.buildTmdbUrl(`/${providerType}/${title.id}/watch/providers`);
        try {
            const response: any = await this.http.get(watchProvidersUrl).pipe(take(1)).toPromise();
            this.popService.cacheProviders(cacheKey, response);
            this.applyProviders(title, response);
        } catch (error) {
            this.resetStreamFlags(title);
        }
    }

    private applyProviders(title: Title, response: any) {
        this.resetStreamFlags(title);
        this.searchStreams(response, title);
    }

    private resetStreamFlags(title: Title) {
        title.streams = [];
        title.onNetflix = false;
        title.onDisney = false;
        title.onHulu = false;
        title.onAmazon = false;
        title.onYoutube = false;
        title.onApple = false;
        title.onPeacock = false;
        title.onMax = false;
        title.onParamount = false;
        title.onStarz = false;
        title.onAmc = false;
        title.onMgm = false;
    }

    searchStreams(response: any, title: Title): Title {
        // Supports both TMDB details responses (append_to_response) and dedicated watch/providers responses.
        const providers = response['watch/providers'] || response;
        if (providers && providers.results && providers.results.US && providers.results.US.flatrate) {
            title.streams = providers.results.US.flatrate;
            for (const stream of title.streams) {
                if (stream.provider_id === 8) {
                    title.onNetflix = true;
                } else if (stream.provider_id === 337) {
                    title.onDisney = true;
                } else if (stream.provider_id === 15) {
                    title.onHulu = true;
                } else if (stream.provider_id === 9) {
                    title.onAmazon = true;
                } else if (stream.provider_id === 188) {
                    title.onYoutube = true;
                } else if (stream.provider_id === 350) {
                    title.onApple = true;
                } else if (stream.provider_id === 386) {
                    title.onPeacock = true;
                } else if (stream.provider_id === 1899) {
                    title.onMax = true;
                } else if (stream.provider_id === 2303) {
                    title.onParamount = true;
                } else if (stream.provider_id === 43) {
                    title.onStarz = true;
                } else if (stream.provider_id === 526) {
                    title.onAmc = true;
                } else if (stream.provider_id === 34) {
                    title.onMgm = true;
                }
            }
            return title;
        }
    }

    getPopularDisplayScore(title: Title): number {
        const combinedScore = this.normalizeScore(title?.popularCombinedScore);
        if (combinedScore > 0) {
            return combinedScore;
        }
        return this.getTmdbDisplayScore(title);
    }

    getTmdbDisplayScore(title: Title): number {
        const cachedTmdbScore = this.normalizeScore(title?.popularTmdbScore);
        if (cachedTmdbScore > 0) {
            return cachedTmdbScore;
        }
        return this.toPercentScore(title?.vote_average);
    }

    ngOnDestroy() {
        // Prevent a request started by a previous visit from changing shared list state.
        this.popularFetchRequestId++;
        if (this.showStreamableCheckBoxSub) {
            this.showStreamableCheckBoxSub.unsubscribe();
        }
        if (this.genreChangedSub) {
            this.genreChangedSub.unsubscribe();
        }
    }

    private async populateRatingsForTitle(title: Title, type: 'movie' | 'tv') {
        const tmdbScore = this.toPercentScore(title.vote_average);
        title.popularTmdbScore = tmdbScore;
        title.popularMoviesDatabaseScore = null;
        title.popularCombinedScore = tmdbScore;

        if (!this.rapidApiKey) {
            return;
        }

        const cacheKey = `${type}:${title.id}`;
        const cachedRating = this.popService.getCachedRating(cacheKey);
        if (cachedRating) {
            this.applyRatingSnapshot(title, cachedRating, tmdbScore);
            return;
        }

        const imdbId = await this.fetchImdbId(type, title.id);
        if (!imdbId) {
            return;
        }

        const moviesDatabaseScore = await this.fetchMoviesDatabaseScore(imdbId);
        const combinedScore = this.calculateCombinedScore(tmdbScore, moviesDatabaseScore);
        const snapshot: PopularRatingSnapshot = {
            imdbId,
            moviesDatabaseScore,
            combinedScore,
            tmdbScore
        };

        this.popService.cacheRating(cacheKey, snapshot);
        this.applyRatingSnapshot(title, snapshot, tmdbScore);
    }

    private clearPopularLists() {
        this.popService.popularMovies = [];
        this.popService.popularTVShows = [];
        this.popService.popularList = [];
    }

    private applyRatingSnapshot(title: Title, snapshot: PopularRatingSnapshot, fallbackTmdbScore: number) {
        const tmdbScore = this.normalizeScore(snapshot?.tmdbScore) || fallbackTmdbScore;
        const moviesDatabaseScore = this.normalizeScore(snapshot?.moviesDatabaseScore);
        const combinedScore = this.normalizeScore(snapshot?.combinedScore);

        title.popularTmdbScore = tmdbScore;
        title.popularMoviesDatabaseScore = moviesDatabaseScore > 0 ? moviesDatabaseScore : null;
        title.popularCombinedScore = combinedScore > 0 ? combinedScore : tmdbScore;
    }

    private async fetchImdbId(type: 'movie' | 'tv', id: number): Promise<string> {
        const externalIdsUrl = this.buildTmdbUrl(`/${type}/${id}/external_ids`);
        try {
            const response: any = await this.http.get(externalIdsUrl).pipe(take(1)).toPromise();
            const imdbId = response?.imdb_id;
            if (typeof imdbId === 'string' && imdbId.startsWith('tt')) {
                return imdbId;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    private async fetchMoviesDatabaseScore(imdbId: string): Promise<number> {
        if (this.moviesDatabaseRatingsUnavailable) {
            return null;
        }

        const url = `https://${this.moviesDatabaseHost}/titles/${imdbId}/ratings`;
        try {
            const response: any = await this.http.get(url, {
                headers: {
                    'x-rapidapi-key': this.rapidApiKey,
                    'x-rapidapi-host': this.moviesDatabaseHost
                }
            }).pipe(take(1)).toPromise();

            const rawRating = Number(response?.results?.averageRating);
            if (!Number.isFinite(rawRating) || rawRating <= 0) {
                return null;
            }
            return Math.round(rawRating * 10);
        } catch (error) {
            if (this.isMoviesDatabaseAvailabilityError(error)) {
                this.setMoviesDatabaseRatingsUnavailable();
            }
            return null;
        }
    }

    private isMoviesDatabaseAvailabilityError(error: unknown): boolean {
        if (!(error instanceof HttpErrorResponse)) {
            return false;
        }
        return [403, 429, 500, 502, 503, 504].includes(error.status);
    }

    private getMoviesDatabaseRatingsUnavailable(): boolean {
        try {
            return sessionStorage.getItem(this.moviesDatabaseRatingsUnavailableKey) === 'true';
        } catch (error) {
            return false;
        }
    }

    private setMoviesDatabaseRatingsUnavailable() {
        this.moviesDatabaseRatingsUnavailable = true;
        try {
            sessionStorage.setItem(this.moviesDatabaseRatingsUnavailableKey, 'true');
        } catch (error) {
            // Ignore storage failures; the in-memory flag still protects this component instance.
        }
    }

    private calculateCombinedScore(tmdbScore: number, moviesDatabaseScore: number): number {
        const scoreSources = [tmdbScore, moviesDatabaseScore].filter(score => this.normalizeScore(score) > 0);
        if (scoreSources.length === 0) {
            return 0;
        }
        const total = scoreSources.reduce((sum, score) => sum + score, 0);
        return Math.round(total / scoreSources.length);
    }

    private toPercentScore(value: number): number {
        if (!Number.isFinite(value) || value <= 0) {
            return 0;
        }
        return Math.round(value * 10);
    }

    private normalizeScore(value: number): number {
        if (!Number.isFinite(value) || value <= 0) {
            return 0;
        }
        return Math.round(value);
    }

    private buildTmdbUrl(path: string, params: Record<string, string> = {}) {
        const queryParams = new URLSearchParams({
            api_key: this.tmdbApiKey,
            ...params
        });
        return `https://api.themoviedb.org/3${path}?${queryParams.toString()}`;
    }

    private buildDiscoverUrl(type: 'movie' | 'tv', watchProvidersParam: string, year?: number) {
        const params = new URLSearchParams();
        if (watchProvidersParam) {
            const [key, value] = watchProvidersParam.split('=');
            if (key && value) {
                params.set(key, value);
            }
        }
        params.set('watch_region', 'US');
        params.set('sort_by', 'popularity.desc');
        const genreId = this.popService.getSelectedGenreId(type);
        if (genreId) {
            params.set('with_genres', genreId.toString());
        }

        if (type === 'movie') {
            params.set('region', 'us');
        } else {
            params.set('with_original_language', 'en');
            if (year) {
                params.set('first_air_date_year', year.toString());
            }
        }

        return this.buildTmdbUrl(`/discover/${type}`, Object.fromEntries(params.entries()));
    }

    private mergeById(primary: Title[], fallback: Title[], limit: number): Title[] {
        const seen = new Set(primary.map(title => title.id));
        const merged = [...primary];
        for (const title of fallback) {
            if (merged.length >= limit) {
                break;
            }
            if (!seen.has(title.id)) {
                seen.add(title.id);
                merged.push(title);
            }
        }
        return merged;
    }
}
