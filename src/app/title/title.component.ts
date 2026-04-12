import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthService} from '../services/auth.service';
import {Title} from '../models/title.model';
import {SimilarTitle, TitleService} from '../services/title.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {StreamComponent} from '../stream/stream.component';
import {PageLoaderComponent} from '../shared/page-loader/page-loader.component';


@Component({
    selector: 'app-title',
    templateUrl: './title.component.html',
    styleUrls: ['./title.component.scss'],
    standalone: true,
    imports: [CommonModule, StreamComponent, PageLoaderComponent]
})
export class TitleComponent implements OnInit, OnDestroy {

    title: Title;
    private terminate$: Subject<Title> = new Subject();

    constructor(public auth: AuthService, public ts: TitleService) {
    }

    ngOnInit() {
        this.ts.title$.pipe(takeUntil(this.terminate$)).subscribe(data => {
            this.title = data;
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
}
