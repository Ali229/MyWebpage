import {Component} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {SavedTitleListComponent} from '../shared/saved-title-list/saved-title-list.component';
import {Title} from '../models/title.model';

@Component({
    selector: 'app-watchlist',
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.scss'],
    standalone: true,
    imports: [SavedTitleListComponent]
})
export class WatchlistComponent {
    constructor(public auth: AuthService) {}

    remove(id: number) {
        void this.auth.removeFromWatchlist(id);
    }

    moveToLovelist(title: Title) {
        void this.auth.moveToLovelist(title);
    }
}
