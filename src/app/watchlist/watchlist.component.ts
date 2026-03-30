import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {TitleService} from '../services/title.service';
import {AuthService} from '../services/auth.service';
import {Title} from '../models/title.model';
import {StreamComponent} from '../stream/stream.component';

@Component({
    selector: 'app-watchlist',
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, StreamComponent]
})
export class WatchlistComponent {
    selectedType = 'All';
    filteredList: Title[] = [];

    constructor(public auth: AuthService, public ts: TitleService) {
        this.changeMediaType(this.selectedType);
    }

    async remove(id) {
        await this.auth.removeFromWatchlist(id);
        this.changeMediaType(this.selectedType);
    }

    changeMediaType(selectedType) {
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
