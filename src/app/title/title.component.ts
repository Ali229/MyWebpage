import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthService} from '../services/auth.service';
import {Title} from '../models/title.model';
import {SimilarTitle, TitleService} from '../services/title.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {StreamComponent} from '../stream/stream.component';
import {PageLoaderComponent} from '../shared/page-loader/page-loader.component';

interface TitleMetaSegment {
    kind: 'certification' | 'text';
    value: string;
}


@Component({
    selector: 'app-title',
    templateUrl: './title.component.html',
    styleUrls: ['./title.component.scss'],
    standalone: true,
    imports: [CommonModule, StreamComponent, PageLoaderComponent]
})
export class TitleComponent implements OnInit, OnDestroy {

    title: Title;
    displayYear = '';
    metaSegments: TitleMetaSegment[] = [];
    private terminate$: Subject<Title> = new Subject();
    private readonly monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    constructor(public auth: AuthService, public ts: TitleService) {
    }

    ngOnInit() {
        this.ts.title$.pipe(takeUntil(this.terminate$)).subscribe(data => {
            this.title = data;
            this.displayYear = this.extractDisplayYear(data);
            this.metaSegments = this.buildMetaSegments(data);
            if (data?.id && this.ts.shouldScrollToTitleTarget()) {
                requestAnimationFrame(() => this.ts.scrollToTitleTarget());
            }
        });
    }


    ngOnDestroy() {
        this.terminate$.next();
        this.terminate$.complete();
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

    private buildMetaSegments(title: Title): TitleMetaSegment[] {
        if (!title) {
            return [];
        }

        const segments: TitleMetaSegment[] = [];
        const certification = this.normalizeDisplayValue(title.certification);
        const displayDate = this.extractDisplayDate(title);
        const genresText = this.extractGenresText(title);
        const runtimeText = this.normalizeDisplayValue(title.runtimeText);
        const seasonsText = this.extractSeasonsText(title);
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
        if (seasonsText) {
            segments.push({kind: 'text', value: seasonsText});
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
        const seasons = Number(title?.number_of_seasons);
        if (!Number.isFinite(seasons) || seasons <= 0) {
            return '';
        }

        return `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'}`;
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
}
