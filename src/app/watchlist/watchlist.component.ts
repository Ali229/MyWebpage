import {Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {TitleService} from '../services/title.service';
import {AuthService} from '../services/auth.service';
import {Title, TitleEpisode, TitleSeason} from '../models/title.model';
import {Subscription} from 'rxjs';
import {StreamComponent} from '../stream/stream.component';
import {BackButtonComponent} from '../shared/back-button/back-button.component';
import {UserProfileComponent} from '../user-profile/user-profile.component';
import {PageLoaderComponent} from '../shared/page-loader/page-loader.component';

type WatchlistType = 'All' | 'movie' | 'tv';

interface WatchlistMetaSegment {
    kind: 'certification' | 'text';
    value: string;
}

interface SeasonGuideSeason {
    seasonNumber: number;
    label: string;
    episodeCount: number | null;
    episodes: TitleEpisode[];
}

@Component({
    selector: 'app-watchlist',
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule, StreamComponent, BackButtonComponent, UserProfileComponent, PageLoaderComponent]
})
export class WatchlistComponent implements OnInit, OnDestroy {
    @ViewChild('typeMenu') typeMenuRef: ElementRef<HTMLDetailsElement>;
    @ViewChildren('seasonGuideMenu') seasonGuideMenuRefs?: QueryList<ElementRef<HTMLDetailsElement>>;
    selectedType: WatchlistType = 'All';
    displayedList: Title[] = [];
    readonly removingIds = new Set<number>();
    private readonly removeAnimationMs = 280;
    private readonly monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    private watchlistChangedSub?: Subscription;

    constructor(public auth: AuthService, public ts: TitleService) {}

    ngOnInit() {
        this.updateDisplayedList();
        this.watchlistChangedSub = this.auth.watchlistChanged$.subscribe(() => {
            this.updateDisplayedList();
        });
    }

    ngOnDestroy() {
        if (this.watchlistChangedSub) {
            this.watchlistChangedSub.unsubscribe();
        }
    }

    async remove(id: number) {
        if (this.removingIds.has(id)) {
            return;
        }

        const scrollY = window.scrollY;
        this.removingIds.add(id);

        try {
            await new Promise(resolve => setTimeout(resolve, this.removeAnimationMs));
            await this.auth.removeFromWatchlist(id);
        } finally {
            this.removingIds.delete(id);
            requestAnimationFrame(() => window.scrollTo({top: scrollY}));
        }
    }

    get selectedTypeLabel(): string {
        if (this.selectedType === 'movie') {
            return `Movies (${this.auth.moviesCount})`;
        }
        if (this.selectedType === 'tv') {
            return `TV (${this.auth.tvCount})`;
        }

        return `All (${this.auth.watchlist.length})`;
    }

    setSelectedType(selectedType: WatchlistType, menu: HTMLDetailsElement) {
        this.selectedType = selectedType;
        menu.open = false;
        this.updateDisplayedList();
    }

    getMetaSegments(title: Title): WatchlistMetaSegment[] {
        const segments: WatchlistMetaSegment[] = [];
        const certification = this.normalizeDisplayValue(title?.certification);
        const displayDate = this.extractDisplayDate(title);
        const genresText = this.extractGenresText(title);
        const runtimeText = this.normalizeDisplayValue(title?.runtimeText);
        const language = this.normalizeDisplayValue(title?.language);

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

    shouldShowMetaSeparator(segments: WatchlistMetaSegment[], index: number): boolean {
        if (index <= 0) {
            return false;
        }

        const previousSegment = segments[index - 1];
        return previousSegment?.kind !== 'certification';
    }

    getSeasonGuideSummary(title: Title): string {
        const seasons = this.resolveSeasonCount(title);
        if (!Number.isFinite(seasons) || seasons <= 0) {
            return '';
        }

        return `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'}`;
    }

    getSeasonGuideLabel(title: Title): string {
        const seasons = this.resolveSeasonCount(title);
        if (!Number.isFinite(seasons) || seasons <= 0) {
            return '';
        }

        return `${seasons === 1 ? 'Season' : 'Seasons'} • ${seasons}`;
    }

    getSeasonGuideSeasons(title: Title): SeasonGuideSeason[] {
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

    getNextEpisodeText(title: Title): string {
        return this.extractNextEpisodeText(title);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as Node | null;

        const menu = this.typeMenuRef?.nativeElement;
        if (menu && menu.open && target && !menu.contains(target)) {
            menu.open = false;
        }

        const seasonMenus = this.seasonGuideMenuRefs?.toArray() || [];
        for (const seasonMenuRef of seasonMenus) {
            const seasonMenu = seasonMenuRef.nativeElement;
            if (seasonMenu.open && target && !seasonMenu.contains(target)) {
                seasonMenu.open = false;
            }
        }
    }

    private updateDisplayedList() {
        if (this.selectedType === 'All') {
            this.displayedList = this.auth.watchlist;
            return;
        }
        this.displayedList = this.auth.watchlist.filter(title => title.media_type === this.selectedType);
    }

    private extractDisplayDate(title: Title): string {
        const primaryDate = this.getPrimaryDateValue(title);
        if (!primaryDate) {
            return '';
        }

        const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(primaryDate);
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
                return `${day} ${this.monthNames[monthIndex]} ${year}`;
            }
        }

        return '';
    }

    private extractGenresText(title: Title): string {
        if (!Array.isArray(title?.genres) || title.genres.length === 0) {
            return '';
        }

        return title.genres
            .map((genre: any) => this.normalizeDisplayValue(genre?.name))
            .filter(name => !!name)
            .join(', ');
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

    private getPrimaryDateValue(title: Title): string {
        const releaseDate = this.normalizeDisplayValue(title?.release_date);
        if (releaseDate) {
            return releaseDate;
        }

        return this.normalizeDisplayValue(title?.first_air_date);
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

    private mapSeasonGuideSeason(season: TitleSeason): SeasonGuideSeason {
        const seasonNumber = Number(season?.season_number);
        const safeSeasonNumber = Number.isFinite(seasonNumber) ? seasonNumber : 0;
        const seasonName = this.normalizeDisplayValue(season?.name);
        const fallbackLabel = safeSeasonNumber > 0 ? `Season ${safeSeasonNumber}` : 'Specials';
        const episodeCount = Number(season?.episode_count);
        const episodes = this.mapSeasonEpisodes(season?.episodes);

        return {
            seasonNumber: safeSeasonNumber,
            label: seasonName || fallbackLabel,
            episodeCount: Number.isFinite(episodeCount) && episodeCount > 0 ? episodeCount : null,
            episodes
        };
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

    private normalizeDisplayValue(value: any): string {
        if (typeof value === 'string') {
            return value.trim();
        }
        return '';
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

        return '';
    }
}
