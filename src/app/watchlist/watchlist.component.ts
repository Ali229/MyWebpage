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
    readonly removingIds = new Set<number>();
    private readonly removeAnimationMs = 280;

    constructor(public auth: AuthService, public ts: TitleService) {}

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
    }

    get displayedList(): Title[] {
        if (this.selectedType === 'All') {
            return this.auth.watchlist;
        }
        return this.auth.watchlist.filter(title => title.media_type === this.selectedType);
    }
}
