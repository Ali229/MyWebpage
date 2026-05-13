import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {SavedTitleListComponent} from '../shared/saved-title-list/saved-title-list.component';
import {Title} from '../models/title.model';
import {SavedTitleRefreshService} from '../services/saved-title-refresh.service';

@Component({
    selector: 'app-watchlist',
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.scss'],
    standalone: true,
    imports: [SavedTitleListComponent]
})
export class WatchlistComponent implements OnInit, OnDestroy {
    constructor(public auth: AuthService, private savedTitleRefresh: SavedTitleRefreshService) {}

    ngOnInit() {
        this.savedTitleRefresh.start();
    }

    ngOnDestroy() {
        this.savedTitleRefresh.stop();
    }

    remove(id: number) {
        void this.auth.removeFromWatchlist(id);
    }

    moveToLovelist(title: Title) {
        void this.auth.moveToLovelist(title);
    }
}
