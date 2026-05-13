import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {SavedTitleListComponent} from '../shared/saved-title-list/saved-title-list.component';
import {Title} from '../models/title.model';
import {SavedTitleRefreshService} from '../services/saved-title-refresh.service';

@Component({
    selector: 'app-lovelist',
    templateUrl: './lovelist.component.html',
    styleUrls: ['./lovelist.component.scss'],
    standalone: true,
    imports: [SavedTitleListComponent]
})
export class LovelistComponent implements OnInit, OnDestroy {
    constructor(public auth: AuthService, private savedTitleRefresh: SavedTitleRefreshService) {}

    ngOnInit() {
        this.savedTitleRefresh.start();
    }

    ngOnDestroy() {
        this.savedTitleRefresh.stop();
    }

    remove(id: number) {
        void this.auth.removeFromLovelist(id);
    }

    moveToWatchlist(title: Title) {
        void this.auth.moveToWatchlist(title);
    }
}
