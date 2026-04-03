import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {TitleService} from '../services/title.service';
import {AuthService} from '../services/auth.service';
import {Title} from '../models/title.model';
import {StreamComponent} from '../stream/stream.component';
import {BackButtonComponent} from '../shared/back-button/back-button.component';
import {UserProfileComponent} from '../user-profile/user-profile.component';
import {PageLoaderComponent} from '../shared/page-loader/page-loader.component';

type WatchlistType = 'All' | 'movie' | 'tv';

@Component({
    selector: 'app-watchlist',
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule, StreamComponent, BackButtonComponent, UserProfileComponent, PageLoaderComponent]
})
export class WatchlistComponent {
    selectedType: WatchlistType = 'All';
    filteredList: Title[] = [];

    constructor(public auth: AuthService, public ts: TitleService) {
        this.changeMediaType(this.selectedType);
    }

    async remove(id) {
        await this.auth.removeFromWatchlist(id);
        this.changeMediaType(this.selectedType);
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
        this.changeMediaType(selectedType);
        menu.open = false;
    }

    changeMediaType(selectedType: WatchlistType) {
        if (selectedType === 'All') {
            return this.filteredList = this.auth.watchlist;
        }
        this.filteredList = [];
        for (const title of this.auth.watchlist) {
            if (title.media_type === selectedType) {
                this.filteredList.push(title);
            }
        }
    }
}
