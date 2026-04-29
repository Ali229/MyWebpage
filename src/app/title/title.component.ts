import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../services/auth.service';
import {Title, TitleEpisode, TitleSeason} from '../models/title.model';
import {SimilarTitle, TitleService} from '../services/title.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {StreamComponent} from '../stream/stream.component';
import {PageLoaderComponent} from '../shared/page-loader/page-loader.component';
import {DownloadService} from '../services/download.service';
import {ToastrService} from 'ngx-toastr';

interface TitleMetaSegment {
    kind: 'certification' | 'text';
    value: string;
}

interface SeasonGuideSeason {
    seasonNumber: number;
    label: string;
    year: string;
    episodeCount: number | null;
    episodes: TitleEpisode[];
}


@Component({
    selector: 'app-title',
    templateUrl: './title.component.html',
    styleUrls: ['./title.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, StreamComponent, PageLoaderComponent]
})
export class TitleComponent implements OnInit, OnDestroy {
    @ViewChild('seasonGuideMenu') seasonGuideMenuRef?: ElementRef<HTMLDetailsElement>;

    title: Title;
    displayYear = '';
    metaSegments: TitleMetaSegment[] = [];
    seasonGuideSummary = '';
    seasonGuideLabel = '';
    seasonGuideSeasons: SeasonGuideSeason[] = [];
    nextEpisodeText = '';
    downloadRequestActive = false;
    downloadMenuOpen = false;
    selectedDownloadQuality: '720p' | '1080p' | '4k' = '4k';
    selectedMovieMonitor = 'movieOnly';
    selectedTvMonitor = 'all';
    readonly downloadQualityOptions = [
        {value: '4k', label: '4K'},
        {value: '1080p', label: '1080p'},
        {value: '720p', label: '720p'}
    ];
    readonly movieMonitorOptions = [
        {value: 'movieOnly', label: 'Movie Only'},
        {value: 'movieAndCollection', label: 'Movie & Collection'}
    ];
    readonly tvMonitorOptions = [
        {value: 'all', label: 'All Episodes'},
        {value: 'future', label: 'Future Episodes'},
        {value: 'pilot', label: 'Pilot Episode'},
        {value: 'firstSeason', label: 'First Season'},
        {value: 'lastSeason', label: 'Last Season'}
    ];
    private terminate$: Subject<Title> = new Subject();
    private readonly monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    constructor(
        public auth: AuthService,
        public ts: TitleService,
        private downloadService: DownloadService,
        private toastr: ToastrService
    ) {
    }

    ngOnInit() {
        this.ts.title$.pipe(takeUntil(this.terminate$)).subscribe(data => {
            this.title = data;
            this.displayYear = this.extractDisplayYear(data);
            this.metaSegments = this.buildMetaSegments(data);
            this.seasonGuideSummary = this.extractSeasonsText(data);
            this.seasonGuideLabel = this.buildSeasonGuideLabel(data);
            this.seasonGuideSeasons = this.buildSeasonGuide(data);
            this.nextEpisodeText = this.extractNextEpisodeText(data);
            if (data?.id && this.ts.shouldScrollToTitleTarget()) {
                requestAnimationFrame(() => this.ts.scrollToTitleTarget());
            }
        });
    }


    ngOnDestroy() {
        this.terminate$.next();
        this.terminate$.complete();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const menu = this.seasonGuideMenuRef?.nativeElement;
        if (!menu || !menu.open) {
            return;
        }

        const target = event.target as Node | null;
        if (target && !menu.contains(target)) {
            menu.open = false;
        }
    }

    @HostListener('document:keydown.escape')
    onEscapeKey() {
        this.closeDownloadMenu();
    }

    onToggleWatchlist() {
        if (!this.title?.id) {
            return;
        }

        // Avoid false-state flicker actions while the saved watchlist is still loading.
        if (this.auth.user.uid && !this.auth.watchlistLoaded) {
            return;
        }

        if (this.auth.getWatchlisted(this.title.id)) {
            this.auth.removeFromWatchlist(this.title.id);
        } else {
            this.auth.addToWatchlist(this.title);
        }
    }

    isWatchlistLoading(): boolean {
        return !!this.auth.user.uid && !this.auth.watchlistLoaded;
    }

    isWatchlisted(): boolean {
        return !!this.title?.id && this.auth.watchlistLoaded && this.auth.getWatchlisted(this.title.id);
    }

    canShowDownloadButton(): boolean {
        return !!this.title?.id
            && (this.title.media_type === 'movie' || this.title.media_type === 'tv')
            && this.auth.canUseDownloadButton();
    }

    openDownloadMenu() {
        if (!this.canShowDownloadButton()) {
            return;
        }

        this.selectedDownloadQuality = '4k';
        this.selectedMovieMonitor = 'movieOnly';
        this.selectedTvMonitor = 'all';
        this.downloadMenuOpen = true;
    }

    closeDownloadMenu() {
        if (this.downloadRequestActive) {
            return;
        }

        this.downloadMenuOpen = false;
    }

    async onDownloadTitle() {
        if (!this.canShowDownloadButton() || this.downloadRequestActive) {
            return;
        }

        this.downloadRequestActive = true;
        const titleName = this.title.title || this.title.name || 'Title';

        try {
            const idToken = await this.auth.getCurrentUserIdToken();
            if (!idToken) {
                this.toastr.info('Please login with the download-enabled account');
                return;
            }

            const response = await this.downloadService.downloadTitle(this.title, idToken, {
                quality: this.selectedDownloadQuality,
                monitor: this.getSelectedDownloadMonitor()
            });
            if (response.alreadyExists) {
                this.toastr.info(`${response.title || titleName} is already in your download app`);
                this.downloadMenuOpen = false;
                return;
            }

            this.toastr.success(`${response.title || titleName} sent to download app`);
            this.downloadMenuOpen = false;
        } catch (error) {
            this.toastr.error(this.resolveDownloadError(error), 'Download request failed');
        } finally {
            this.downloadRequestActive = false;
        }
    }

    isMovieTitle(): boolean {
        return this.title?.media_type === 'movie';
    }

    getDownloadDialogTitle(): string {
        return this.title?.title || this.title?.name || 'Download request';
    }

    private getSelectedDownloadMonitor(): string {
        return this.isMovieTitle() ? this.selectedMovieMonitor : this.selectedTvMonitor;
    }

    openMoreLikeThis(similarTitle: SimilarTitle) {
        const mediaType = similarTitle?.media_type || this.title?.media_type;
        if (!similarTitle?.id || !mediaType) {
            return;
        }
        this.ts.search(similarTitle.id, mediaType);
    }

    hasAnyRatings(): boolean {
        if (!this.title) {
            return false;
        }

        const hasTmdb = Number(this.title.vote_average) > 0;
        const hasImdb = this.title.ratingsHydrated
            && (Number(this.title.imdbScore) > 0 || Number(this.title.imdb232Score) > 0);
        const hasRotten = this.title.ratingsHydrated && Number(this.title.rottenScore) > 0;
        const hasMeta = this.title.ratingsHydrated && Number(this.title.metaScore) > 0;
        const hasAverage = this.title.ratingsHydrated
            && Number(this.title.averageScore) > 0
            && Number(this.title.scoreCount) > 1;

        return hasTmdb || hasImdb || hasRotten || hasMeta || hasAverage;
    }

    shouldShowMetaSeparator(index: number): boolean {
        if (index <= 0) {
            return false;
        }

        const previousSegment = this.metaSegments[index - 1];
        return previousSegment?.kind !== 'certification';
    }

    private buildMetaSegments(title: Title): TitleMetaSegment[] {
        if (!title) {
            return [];
        }

        const segments: TitleMetaSegment[] = [];
        const certification = this.normalizeDisplayValue(title.certification);
        const displayDate = this.extractDisplayDate(title);
        const genresText = this.extractGenresText(title);
        const runtimeText = this.normalizeDisplayValue(title.runtimeText);
        const language = this.normalizeDisplayValue(title.language);

        if (certification) {
            segments.push({kind: 'certification', value: certification});
        }
        if (displayDate) {
            segments.push({kind: 'text', value: displayDate});
        }
        if (genresText) {
            segments.push({kind: 'text', value: genresText});
        }
        if (runtimeText) {
            segments.push({kind: 'text', value: runtimeText});
        }
        if (language) {
            segments.push({kind: 'text', value: language});
        }

        return segments;
    }

    private extractDisplayYear(title: Title): string {
        const primaryDate = this.getPrimaryDateValue(title);
        if (!primaryDate) {
            return '';
        }

        const isoYearMatch = /^(\d{4})/.exec(primaryDate);
        if (isoYearMatch?.[1]) {
            return isoYearMatch[1];
        }

        const parsedDate = new Date(primaryDate);
        if (Number.isNaN(parsedDate.getTime())) {
            return '';
        }
        return `${parsedDate.getFullYear()}`;
    }

    private extractDisplayDate(title: Title): string {
        const primaryDate = this.getPrimaryDateValue(title);
        if (!primaryDate) {
            return '';
        }

        const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(primaryDate);
        if (isoDateMatch) {
            const monthIndex = Number(isoDateMatch[2]) - 1;
            const day = Number(isoDateMatch[3]);
            if (monthIndex >= 0 && monthIndex < this.monthNames.length && day > 0) {
                return `${day} ${this.monthNames[monthIndex]}`;
            }
        }

        const parsedDate = new Date(primaryDate);
        if (Number.isNaN(parsedDate.getTime())) {
            return '';
        }

        return `${parsedDate.getDate()} ${this.monthNames[parsedDate.getMonth()]}`;
    }

    private extractGenresText(title: Title): string {
        if (!Array.isArray(title?.genres) || title.genres.length === 0) {
            return '';
        }

        return title.genres
            .map((genre: any) => this.normalizeDisplayValue(genre?.name))
            .filter(genreName => !!genreName)
            .join(', ');
    }

    private extractSeasonsText(title: Title): string {
        const seasons = this.resolveSeasonCount(title);
        if (!Number.isFinite(seasons) || seasons <= 0) {
            return '';
        }

        return `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'}`;
    }

    private buildSeasonGuideLabel(title: Title): string {
        const seasons = this.resolveSeasonCount(title);
        if (!Number.isFinite(seasons) || seasons <= 0) {
            return '';
        }

        return `${seasons === 1 ? 'Season' : 'Seasons'} • ${seasons}`;
    }

    private extractNextEpisodeText(title: Title): string {
        const nextAirDate = this.normalizeDisplayValue(title?.next_episode_to_air?.air_date);
        if (!nextAirDate) {
            return '';
        }

        const formattedDate = this.formatLongDate(nextAirDate);
        if (!formattedDate) {
            return '';
        }

        return `Next episode ${formattedDate}`;
    }

    private buildSeasonGuide(title: Title): SeasonGuideSeason[] {
        const seasons = Array.isArray(title?.seasons) ? title.seasons : [];
        if (!seasons.length) {
            return [];
        }

        const mapped = seasons
            .map((season: TitleSeason) => this.mapSeasonGuideSeason(season))
            .filter(season => season.seasonNumber >= 0);

        const regularSeasons = mapped.filter(season => season.seasonNumber > 0);
        return regularSeasons.length > 0 ? regularSeasons : mapped;
    }

    private mapSeasonGuideSeason(season: TitleSeason): SeasonGuideSeason {
        const seasonNumber = Number(season?.season_number);
        const safeSeasonNumber = Number.isFinite(seasonNumber) ? seasonNumber : 0;
        const seasonName = this.normalizeDisplayValue(season?.name);
        const fallbackLabel = safeSeasonNumber > 0 ? `Season ${safeSeasonNumber}` : 'Specials';
        const year = this.extractYearFromDate(season?.air_date);
        const episodeCount = Number(season?.episode_count);
        const episodes = this.mapSeasonEpisodes(season?.episodes);

        return {
            seasonNumber: safeSeasonNumber,
            label: seasonName || fallbackLabel,
            year,
            episodeCount: Number.isFinite(episodeCount) && episodeCount > 0 ? episodeCount : null,
            episodes
        };
    }

    private resolveDownloadError(error: any): string {
        const serverError = error?.error?.error;
        if (typeof serverError === 'string' && serverError.trim()) {
            return serverError;
        }

        if (typeof error?.message === 'string' && error.message.trim()) {
            return error.message;
        }

        return 'Could not reach the download server.';
    }

    private mapSeasonEpisodes(episodes: TitleEpisode[] | undefined): TitleEpisode[] {
        if (!Array.isArray(episodes)) {
            return [];
        }

        return episodes
            .map(episode => {
                const episodeNumber = Number(episode?.episode_number);
                return {
                    episode_number: Number.isFinite(episodeNumber) && episodeNumber > 0 ? episodeNumber : 0,
                    name: this.normalizeDisplayValue(episode?.name),
                    air_date: this.normalizeDisplayValue(episode?.air_date)
                };
            })
            .filter(episode => !!episode.name)
            .sort((a, b) => a.episode_number - b.episode_number);
    }

    private resolveSeasonCount(title: Title): number {
        const seasonCount = Number(title?.number_of_seasons);
        if (Number.isFinite(seasonCount) && seasonCount > 0) {
            return seasonCount;
        }

        if (Array.isArray(title?.seasons)) {
            const regularSeasons = title.seasons.filter((season: TitleSeason) => Number(season?.season_number) > 0);
            if (regularSeasons.length > 0) {
                return regularSeasons.length;
            }
            return title.seasons.length;
        }

        return 0;
    }

    private getPrimaryDateValue(title: Title): string {
        const releaseDate = this.normalizeDisplayValue(title?.release_date);
        if (releaseDate) {
            return releaseDate;
        }

        return this.normalizeDisplayValue(title?.first_air_date);
    }

    private normalizeDisplayValue(value: any): string {
        if (typeof value === 'string') {
            return value.trim();
        }
        return '';
    }

    private extractYearFromDate(value: any): string {
        const dateValue = this.normalizeDisplayValue(value);
        const yearMatch = /^(\d{4})/.exec(dateValue);
        return yearMatch?.[1] || '';
    }

    private formatLongDate(value: string): string {
        const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
        if (isoDateMatch) {
            const year = Number(isoDateMatch[1]);
            const monthIndex = Number(isoDateMatch[2]) - 1;
            const day = Number(isoDateMatch[3]);
            if (
                Number.isFinite(year) &&
                monthIndex >= 0 &&
                monthIndex < this.monthNames.length &&
                Number.isFinite(day) &&
                day > 0
            ) {
                return `${this.monthNames[monthIndex]} ${day}, ${year}`;
            }
        }

        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) {
            return '';
        }
        return `${this.monthNames[parsedDate.getMonth()]} ${parsedDate.getDate()}, ${parsedDate.getFullYear()}`;
    }
}
