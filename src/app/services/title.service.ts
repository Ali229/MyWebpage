import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Title} from '../models/title.model';
import {BehaviorSubject, Subscription} from 'rxjs';
import {take} from 'rxjs/operators';
import languagesData from '../../assets/languages.json';
import {apiConfig} from '../config/api.config';

interface Language {
    'iso_639_1': string;
    'english_name': string;
    'name': string;
}

interface OmdbRatingPayload {
    imdbScore: number;
    rottenScore: number;
    metaScore: number;
    rottenImage: string;
    omdbPoster: string;
    awards: string;
}

interface Imdb232RatingPayload {
    imdb232Score: number;
    imdb232Votes: number;
}

export interface SimilarTitle {
    id: number;
    media_type: string;
    poster_path: string;
    vote_average: number;
    release_date: string;
    first_air_date: string;
    title: string;
    name: string;
}

export interface SearchResultItem {
    id: number;
    media_type: 'movie' | 'tv';
    poster_path: string;
    title: string;
    name: string;
    release_date: string;
    first_air_date: string;
    overview: string;
    searchScore: number;
    vote_count: number;
}

@Injectable({
    providedIn: 'root'
})
export class TitleService {
    private readonly tmdbApiKey = apiConfig.tmdbApiKey;
    private readonly omdbApiKey = apiConfig.omdbApiKey;
    private readonly rapidApiKey = apiConfig.rapidApiKey;
    private readonly imdb232Host = apiConfig.rapidApiHosts.imdb232;
    private readonly certificationFallbackCountryOrder = ['CA', 'GB', 'AU', 'NZ', 'IE'];

    loading = false;
    loadingMoreLikeThis = false;
    searchResultsLoading = false;
    searchResultsActive = false;
    searchResultsError = false;
    searchResultsQuery = '';
    searchResultsType: 'movie' | 'tv' = 'movie';
    searchMovieResults: SearchResultItem[] = [];
    searchTvResults: SearchResultItem[] = [];
    selectedOption = '';
    type = '';
    title: string;
    year: string;
    error: boolean;
    errorTitle: string;
    languages: Language[];
    moreLikeThis: SimilarTitle[] = [];

    constructor(private http: HttpClient) {
        this.languages = languagesData;
    }

    private titleSubject$: BehaviorSubject<Title> = new BehaviorSubject(null);
    title$ = this.titleSubject$.asObservable();
    currentSearchSubscription: Subscription;
    private scrollRequestVersion = 0;
    private handledScrollRequestVersion = 0;

    async multiSearch() {
        const query = typeof this.title === 'string' ? this.title.trim() : '';
        this.title = query;

        if (!query) {
            this.clearSearchResults();
            return;
        }

        this.loading = false;
        this.error = false;
        this.errorTitle = '';
        this.searchResultsQuery = query;
        this.searchResultsActive = true;
        this.searchResultsLoading = true;
        this.searchResultsError = false;

        const [movieResults, tvResults, topTypeResult] = await Promise.allSettled([
            this.fetchSearchResults('movie', query),
            this.fetchSearchResults('tv', query),
            this.fetchTopSearchResultType(query)
        ]);

        this.searchMovieResults = movieResults.status === 'fulfilled' ? movieResults.value : [];
        this.searchTvResults = tvResults.status === 'fulfilled' ? tvResults.value : [];
        const rankedType = topTypeResult.status === 'fulfilled' ? topTypeResult.value : null;
        this.searchResultsType = this.resolveDefaultSearchType(
            this.searchMovieResults,
            this.searchTvResults,
            rankedType
        );
        this.searchResultsError = this.searchMovieResults.length === 0 && this.searchTvResults.length === 0;
        this.searchResultsLoading = false;
    }

    search(id, type) {
        this.clearSearchResults();
        this.loading = true;
        this.error = false;
        this.loadingMoreLikeThis = true;
        this.moreLikeThis = [];
        this.requestScrollToTitle();

        // Cancel the previous HTTP request when a new one is initiated
        if (this.currentSearchSubscription) {
            this.currentSearchSubscription.unsubscribe();
        }

        const detailsUrl = this.buildTmdbUrl(`/${type}/${id}`, {
            append_to_response: 'videos,external_ids,release_dates,content_ratings,watch/providers'
        });
        this.currentSearchSubscription = this.http.get<Title>(detailsUrl)
            .pipe(take(1)).subscribe(data => {
                data.vote_average = Math.round(data.vote_average * 10);
                data.certification = this.getCertification(data, type);
                data.trailer = this.getTrailer(data, type);
                data.language = this.getLanguage(data);
                data.runtimeText = this.getRuntime(data);
                data.media_type = type;
                data.year = data.first_air_date ? new Date(data.first_air_date).getFullYear() : new Date(data.release_date).getFullYear();
                data.ratingsHydrated = false;
                data.imdbScore = null;
                data.imdb232Score = null;
                data.imdb232Votes = null;
                data.rottenScore = null;
                data.metaScore = null;
                data.rottenImage = null;
                this.updateAggregateScore(data);
                this.titleSubject$.next(data);
                this.searchStreams(data);
                this.searchMoreLikeThis(data);
                void this.hydrateRatings(data);
                this.loading = false;
            });
    }

    private async fetchSearchResults(type: 'movie' | 'tv', query: string): Promise<SearchResultItem[]> {
        const searchUrl = this.buildTmdbUrl(`/search/${type}`, {
            query,
            include_adult: 'false',
            language: 'en-US',
            page: '1'
        });

        try {
            const response: any = await this.http.get(searchUrl).pipe(take(1)).toPromise();
            const results = Array.isArray(response?.results) ? response.results : [];
            return results
                .filter(item => item && Number.isInteger(item.id))
                .slice(0, 10)
                .map(item => this.mapSearchResult(item, type));
        } catch (error) {
            return [];
        }
    }

    private async fetchTopSearchResultType(query: string): Promise<'movie' | 'tv' | null> {
        const searchUrl = this.buildTmdbUrl('/search/multi', {
            query,
            include_adult: 'false',
            language: 'en-US',
            page: '1'
        });

        try {
            const response: any = await this.http.get(searchUrl).pipe(take(1)).toPromise();
            const results = Array.isArray(response?.results) ? response.results : [];
            const topTitleResult = results.find(item =>
                item &&
                Number.isInteger(item.id) &&
                (item.media_type === 'movie' || item.media_type === 'tv')
            );
            return topTitleResult?.media_type === 'tv' ? 'tv' : topTitleResult?.media_type === 'movie' ? 'movie' : null;
        } catch {
            return null;
        }
    }

    private resolveDefaultSearchType(
        movieResults: SearchResultItem[],
        tvResults: SearchResultItem[],
        rankedType: 'movie' | 'tv' | null
    ): 'movie' | 'tv' {
        if (rankedType === 'movie' && movieResults.length > 0) {
            return 'movie';
        }
        if (rankedType === 'tv' && tvResults.length > 0) {
            return 'tv';
        }
        if (movieResults.length === 0 && tvResults.length > 0) {
            return 'tv';
        }
        if (tvResults.length === 0 && movieResults.length > 0) {
            return 'movie';
        }
        if (movieResults.length > 0 && tvResults.length > 0) {
            const movieTop = movieResults[0];
            const tvTop = tvResults[0];
            return this.getSearchRankScore(tvTop) > this.getSearchRankScore(movieTop) ? 'tv' : 'movie';
        }
        return 'movie';
    }

    private getSearchRankScore(result: SearchResultItem): number {
        const score = Number(result?.searchScore) || 0;
        const votes = Number(result?.vote_count) || 0;
        return score * 100000 + votes;
    }

    private mapSearchResult(item: any, mediaType: 'movie' | 'tv'): SearchResultItem {
        const rawScore = Number(item?.vote_average);
        const searchScore = Number.isFinite(rawScore) && rawScore > 0 ? Math.round(rawScore * 10) : 0;

        return {
            id: Number(item.id),
            media_type: mediaType,
            poster_path: item?.poster_path || '',
            title: item?.title || '',
            name: item?.name || '',
            release_date: item?.release_date || '',
            first_air_date: item?.first_air_date || '',
            overview: item?.overview || '',
            searchScore,
            vote_count: Number(item?.vote_count) || 0
        };
    }

    clearSearchResults() {
        this.searchResultsLoading = false;
        this.searchResultsActive = false;
        this.searchResultsError = false;
        this.searchResultsQuery = '';
        this.searchResultsType = 'movie';
        this.searchMovieResults = [];
        this.searchTvResults = [];
    }

    searchMoreLikeThis(data: Title) {
        const mediaType = data.media_type;
        const currentTitleId = data.id;
        const recommendationsUrl = this.buildTmdbUrl(`/${mediaType}/${currentTitleId}/recommendations`, {
            language: 'en-US',
            page: '1'
        });
        this.http.get(recommendationsUrl)
            .pipe(take(1))
            .subscribe((response: any) => {
                if (this.titleSubject$.value?.id !== currentTitleId) {
                    return;
                }
                const results = Array.isArray(response.results) ? response.results : [];
                this.moreLikeThis = results
                    .filter(item => item && item.id !== currentTitleId)
                    .slice(0, 3)
                    .map(item => ({
                        ...item,
                        media_type: mediaType,
                        vote_average: item.vote_average ? Math.round(item.vote_average * 10) : 0
                    }));
                this.loadingMoreLikeThis = false;
            }, () => {
                if (this.titleSubject$.value?.id === currentTitleId) {
                    this.moreLikeThis = [];
                    this.loadingMoreLikeThis = false;
                }
            });
    }

    private async hydrateRatings(data: Title): Promise<void> {
        const [omdbResult, imdb232Result] = await Promise.allSettled([
            this.fetchOMDBRatings(data),
            this.fetchIMDb232Ratings(data)
        ]);

        const emptyOmdbPayload: OmdbRatingPayload = {
            imdbScore: null,
            rottenScore: null,
            metaScore: null,
            rottenImage: null,
            omdbPoster: null,
            awards: null
        };
        const emptyImdb232Payload: Imdb232RatingPayload = {
            imdb232Score: null,
            imdb232Votes: null
        };

        const omdbPayload = omdbResult.status === 'fulfilled' ? omdbResult.value : emptyOmdbPayload;
        const imdb232Payload = imdb232Result.status === 'fulfilled' ? imdb232Result.value : emptyImdb232Payload;

        this.applyOMDBRatings(data, omdbPayload);
        this.applyIMDb232Ratings(data, imdb232Payload);

        data.ratingsHydrated = true;
        this.updateAggregateScore(data);

        // Ignore stale async responses after switching to a new title.
        if (this.titleSubject$.value?.id !== data.id || this.titleSubject$.value?.media_type !== data.media_type) {
            return;
        }
        this.titleSubject$.next(data);
    }

    private async fetchOMDBRatings(data: Title): Promise<OmdbRatingPayload> {
        const emptyPayload: OmdbRatingPayload = {
            imdbScore: null,
            rottenScore: null,
            metaScore: null,
            rottenImage: null,
            omdbPoster: null,
            awards: null
        };
        if (!data?.external_ids?.imdb_id) {
            return emptyPayload;
        }

        const omdbUrl = `https://www.omdbapi.com/?apikey=${this.omdbApiKey}&type=&i=${data.external_ids.imdb_id}`;
        try {
            const response: any = await this.http.get(omdbUrl).pipe(take(1)).toPromise();
            const payload: OmdbRatingPayload = {
                ...emptyPayload
            };
            const ratings = Array.isArray(response?.Ratings) ? response.Ratings : [];
            for (const rating of ratings) {
                if (rating.Source === 'Internet Movie Database') {
                    payload.imdbScore = parseFloat(rating.Value) * 10;
                } else if (rating.Source === 'Rotten Tomatoes') {
                    payload.rottenScore = parseFloat(rating.Value.replace('%', ''));
                    if (payload.rottenScore) {
                        if (payload.rottenScore >= 50) {
                            payload.rottenImage = 'tomato_full.png';
                        } else if (payload.rottenScore < 50) {
                            payload.rottenImage = 'tomato_rotten.png';
                        }
                    }
                } else if (rating.Source === 'Metacritic') {
                    payload.metaScore = parseFloat(rating.Value);
                }
            }

            if (response.Poster !== 'N/A') {
                payload.omdbPoster = response.Poster;
            }
            if (response.Awards !== 'N/A') {
                payload.awards = response.Awards;
            }
            return payload;
        } catch (error) {
            // Keep TMDb data when OMDb is unavailable.
            return emptyPayload;
        }
    }

    private async fetchIMDb232Ratings(data: Title): Promise<Imdb232RatingPayload> {
        const emptyPayload: Imdb232RatingPayload = {
            imdb232Score: null,
            imdb232Votes: null
        };
        const imdbId = data?.external_ids?.imdb_id;
        if (!imdbId || !this.rapidApiKey) {
            return emptyPayload;
        }

        const imdb232Url = `https://${this.imdb232Host}/api/title/get-ratings?tt=${imdbId}`;
        try {
            const response: any = await this.http.get(imdb232Url, {
                headers: {
                    'x-rapidapi-key': this.rapidApiKey,
                    'x-rapidapi-host': this.imdb232Host
                }
            }).pipe(take(1)).toPromise();

            const summary = response?.data?.title?.ratingsSummary;
            const aggregateRating = Number(summary?.aggregateRating);
            const voteCount = Number(summary?.voteCount);
            if (!Number.isFinite(aggregateRating) || aggregateRating <= 0) {
                return emptyPayload;
            }

            return {
                imdb232Score: Math.round(aggregateRating * 10),
                imdb232Votes: Number.isFinite(voteCount) ? voteCount : null
            };
        } catch (error) {
            // Keep OMDb/TMDb ratings even when RapidAPI data is unavailable.
            return emptyPayload;
        }
    }

    private applyOMDBRatings(data: Title, payload: OmdbRatingPayload) {
        data.imdbScore = Number.isFinite(payload?.imdbScore) && payload.imdbScore > 0 ? payload.imdbScore : null;
        data.rottenScore = Number.isFinite(payload?.rottenScore) && payload.rottenScore > 0 ? payload.rottenScore : null;
        data.metaScore = Number.isFinite(payload?.metaScore) && payload.metaScore > 0 ? payload.metaScore : null;
        data.rottenImage = payload?.rottenImage || null;
        data.omdbPoster = payload?.omdbPoster || data.omdbPoster || null;
        data.awards = payload?.awards || data.awards || null;
    }

    private applyIMDb232Ratings(data: Title, payload: Imdb232RatingPayload) {
        data.imdb232Score = Number.isFinite(payload?.imdb232Score) && payload.imdb232Score > 0 ? payload.imdb232Score : null;
        data.imdb232Votes = Number.isFinite(payload?.imdb232Votes) ? payload.imdb232Votes : null;
    }

    searchStreams(data: Title) {
        const providers = data['watch/providers'];
        if (providers && providers.results && providers.results.US && providers.results.US.flatrate) {
            data.streams = providers.results.US.flatrate;
            for (const stream of data.streams) {
                if (stream.provider_id === 8) {
                    data.onNetflix = true;
                } else if (stream.provider_id === 337) {
                    data.onDisney = true;
                } else if (stream.provider_id === 15) {
                    data.onHulu = true;
                } else if (stream.provider_id === 9) {
                    data.onAmazon = true;
                } else if (stream.provider_id === 188) {
                    data.onYoutube = true;
                } else if (stream.provider_id === 350) {
                    data.onApple = true;
                } else if (stream.provider_id === 386) {
                    data.onPeacock = true;
                } else if (stream.provider_id === 1899) {
                    data.onMax = true;
                } else if (stream.provider_id === 2303) {
                    data.onParamount = true;
                } else if (stream.provider_id === 43) {
                    data.onStarz = true;
                } else if (stream.provider_id === 526) {
                    data.onAmc = true;
                } else if (stream.provider_id === 34) {
                    data.onMgm = true;
                }
            }
            this.titleSubject$.next(data);
        }
    }

    private buildTmdbUrl(path: string, params: Record<string, string> = {}) {
        const queryParams = new URLSearchParams({
            api_key: this.tmdbApiKey,
            ...params
        });
        return `https://api.themoviedb.org/3${path}?${queryParams.toString()}`;
    }

    private updateAggregateScore(data: Title) {
        data.totalScore = 0;
        data.averageScore = 0;
        data.scoreCount = 0;

        const addScore = (value: number) => {
            const parsed = Number(value);
            if (Number.isFinite(parsed) && parsed > 0) {
                data.totalScore += parsed;
                data.scoreCount++;
            }
        };

        // Keep IMDb as a single source in the average: prefer OMDb IMDb, fallback to IMDb232.
        const imdbScoreForAverage = Number(data.imdbScore) > 0 ? data.imdbScore : data.imdb232Score;

        addScore(data.vote_average);
        addScore(imdbScoreForAverage);
        addScore(data.rottenScore);
        addScore(data.metaScore);

        if (data.scoreCount > 0) {
            data.averageScore = Math.round(data.totalScore / data.scoreCount);
        }
    }

    getRatingColor(rating) {
        if (rating > 70) {
            return 'success';
        } else if (rating >= 50) {
            return 'warning';
        } else if (rating < 50) {
            return 'danger';
        }
    }

    getCertification(data, type) {
        if (type === 'movie') {
            const releaseDateGroups = Array.isArray(data?.release_dates?.results) ? data.release_dates.results : [];
            const usReleaseGroup = releaseDateGroups.find(group => group?.iso_3166_1 === 'US');
            const usCertification = this.pickBestMovieCertification(usReleaseGroup?.release_dates);
            if (usCertification) {
                return usCertification;
            }

            return this.pickFallbackMovieCertification(releaseDateGroups);
        } else {
            const contentRatings = Array.isArray(data?.content_ratings?.results) ? data.content_ratings.results : [];
            const usContentRating = contentRatings.find(ratingEntry =>
                ratingEntry?.iso_3166_1 === 'US' &&
                this.normalizeCertificationValue(ratingEntry?.rating)
            );
            if (usContentRating) {
                return this.normalizeCertificationValue(usContentRating.rating);
            }

            return this.pickFallbackTvCertification(contentRatings);
        }
        return '';
    }

    private pickBestMovieCertification(releaseDates: any[]): string {
        const releaseDateEntries = Array.isArray(releaseDates) ? releaseDates : [];
        // Prefer theatrical/digital/physical entries before premiere-style entries.
        const preferredReleaseTypeOrder = [3, 4, 5, 2, 1, 6];
        for (const preferredType of preferredReleaseTypeOrder) {
            const matchingRelease = releaseDateEntries.find(releaseDate =>
                Number(releaseDate?.type) === preferredType &&
                this.normalizeCertificationValue(releaseDate?.certification)
            );
            if (matchingRelease) {
                return this.normalizeCertificationValue(matchingRelease.certification);
            }
        }

        const firstNonEmptyCertification = releaseDateEntries
            .map(releaseDate => this.normalizeCertificationValue(releaseDate?.certification))
            .find(value => !!value);
        return firstNonEmptyCertification || '';
    }

    private pickFallbackMovieCertification(releaseDateGroups: any[]): string {
        const groups = Array.isArray(releaseDateGroups) ? releaseDateGroups : [];

        for (const countryCode of this.certificationFallbackCountryOrder) {
            const countryGroup = groups.find(group => group?.iso_3166_1 === countryCode);
            const certification = this.pickBestMovieCertification(countryGroup?.release_dates);
            if (certification) {
                return `${certification} (${countryCode})`;
            }
        }

        for (const group of groups) {
            const countryCode = this.normalizeCertificationValue(group?.iso_3166_1);
            if (!countryCode || countryCode === 'US') {
                continue;
            }
            const certification = this.pickBestMovieCertification(group?.release_dates);
            if (certification) {
                return `${certification} (${countryCode})`;
            }
        }

        return '';
    }

    private pickFallbackTvCertification(contentRatings: any[]): string {
        const ratings = Array.isArray(contentRatings) ? contentRatings : [];

        for (const countryCode of this.certificationFallbackCountryOrder) {
            const matchingRating = ratings.find(ratingEntry =>
                ratingEntry?.iso_3166_1 === countryCode &&
                this.normalizeCertificationValue(ratingEntry?.rating)
            );
            if (matchingRating) {
                return `${this.normalizeCertificationValue(matchingRating.rating)} (${countryCode})`;
            }
        }

        for (const ratingEntry of ratings) {
            const countryCode = this.normalizeCertificationValue(ratingEntry?.iso_3166_1);
            const rating = this.normalizeCertificationValue(ratingEntry?.rating);
            if (countryCode && countryCode !== 'US' && rating) {
                return `${rating} (${countryCode})`;
            }
        }

        return '';
    }

    private normalizeCertificationValue(value: any): string {
        if (typeof value !== 'string') {
            return '';
        }
        return value.trim();
    }

    getTrailer(data, mediaType?: 'movie' | 'tv') {
        const videos = Array.isArray(data?.videos?.results) ? data.videos.results : [];
        const youtubeVideos = videos.filter(video => video?.site === 'YouTube' && !!video?.key);
        const nonGameVideos = youtubeVideos.filter(video => !this.isLikelyGameVideo(video));
        const trailerCandidates = nonGameVideos.length ? nonGameVideos : youtubeVideos;

        const selectedVideo = this.pickBestTrailerVideo(trailerCandidates);
        if (selectedVideo) {
            return `https://www.youtube.com/watch?v=${selectedVideo.key}`;
        }

        const title = data?.title || data?.name || '';
        const mediaHint = mediaType === 'tv' ? 'tv show' : 'movie';
        const query = `${title} ${mediaHint} official trailer`;
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    }

    private pickBestTrailerVideo(videos: any[]) {
        if (!videos.length) {
            return null;
        }

        const rankVideo = (video: any): number => {
            const name = (video?.name || '').toLowerCase();
            const type = (video?.type || '').toLowerCase();

            let score = 0;
            if (type === 'trailer') {
                score += 100;
            } else if (type === 'teaser') {
                score += 60;
            } else if (type === 'clip') {
                score += 30;
            } else if (type === 'featurette') {
                score += 20;
            }

            if (name.includes('trailer')) {
                score += 40;
            }
            if (name.includes('official')) {
                score += 15;
            }
            if (video?.official) {
                score += 20;
            }
            if (video?.iso_639_1 === 'en') {
                score += 8;
            }
            if (video?.iso_3166_1 === 'US') {
                score += 6;
            }

            return score;
        };

        const publishedAt = (video: any): number => {
            const timestamp = Date.parse(video?.published_at || '');
            return Number.isNaN(timestamp) ? 0 : timestamp;
        };

        const [bestVideo] = [...videos].sort((a, b) => {
            const scoreDiff = rankVideo(b) - rankVideo(a);
            if (scoreDiff !== 0) {
                return scoreDiff;
            }
            return publishedAt(b) - publishedAt(a);
        });

        return bestVideo || null;
    }

    private isLikelyGameVideo(video: any): boolean {
        const value = `${video?.name || ''} ${video?.type || ''}`.toLowerCase();
        const gameKeywords = [
            'gameplay',
            'fortnite',
            'xbox',
            'playstation',
            'ps5',
            'nintendo',
            'switch',
            'steam'
        ];

        return gameKeywords.some(keyword => value.includes(keyword));
    }

    getLanguage(data) {
        for (const language of this.languages) {
            if (language.iso_639_1 === data.original_language) {
                return language.english_name;
            }
        }
    }

    getRuntime(data) {
        const runtimeMinutes = this.resolveRuntimeMinutes(data);
        if (!runtimeMinutes) {
            return '';
        }

        if (runtimeMinutes > 60) {
            return (runtimeMinutes - runtimeMinutes % 60) / 60 + 'h ' + runtimeMinutes % 60 + 'min';
        }

        return runtimeMinutes + 'min';
    }

    private resolveRuntimeMinutes(data: any): number | null {
        const runtime = Number(data?.runtime);
        if (Number.isFinite(runtime) && runtime > 0) {
            return runtime;
        }

        const episodeRunTimes = Array.isArray(data?.episode_run_time) ? data.episode_run_time : [];
        const firstEpisodeRuntime = Number(episodeRunTimes.find((value: any) => Number.isFinite(Number(value)) && Number(value) > 0));
        if (Number.isFinite(firstEpisodeRuntime) && firstEpisodeRuntime > 0) {
            return firstEpisodeRuntime;
        }

        return null;
    }

    scrollToTitleTarget() {
        const maxAttempts = 12;
        const tryScroll = (attempt: number) => {
            const stableAnchor = document.getElementById('title-scroll-anchor');
            const posterTarget = document.getElementById('title-poster-target');
            const titleTarget = document.getElementById('title-target');
            const fallbackTarget = document.getElementById('target');
            const target = stableAnchor || posterTarget || titleTarget || fallbackTarget;

            if (target) {
                const offset = this.getScrollOffsetTop();
                const targetTop = window.scrollY + target.getBoundingClientRect().top - offset;
                window.scrollTo({
                    top: Math.max(0, targetTop),
                    behavior: 'smooth'
                });
                return;
            }

            if (attempt < maxAttempts) {
                requestAnimationFrame(() => tryScroll(attempt + 1));
            }
        };

        requestAnimationFrame(() => tryScroll(0));
    }

    shouldScrollToTitleTarget(): boolean {
        if (this.handledScrollRequestVersion < this.scrollRequestVersion) {
            this.handledScrollRequestVersion = this.scrollRequestVersion;
            return true;
        }
        return false;
    }

    private requestScrollToTitle() {
        this.scrollRequestVersion++;
    }

    private getScrollOffsetTop(): number {
        const defaultOffset = 8;
        const navbar = document.querySelector('.app-navbar') as HTMLElement | null;
        if (!navbar) {
            return defaultOffset;
        }

        const styles = window.getComputedStyle(navbar);
        const position = styles.position;
        const hasOverlayingNavbar = position === 'fixed' || position === 'sticky';
        if (!hasOverlayingNavbar) {
            return defaultOffset;
        }

        const navbarHeight = Math.ceil(navbar.getBoundingClientRect().height);
        return navbarHeight + defaultOffset;
    }

}
