import {Component} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {SavedTitleListComponent} from '../shared/saved-title-list/saved-title-list.component';
import {Title} from '../models/title.model';

@Component({
    selector: 'app-lovelist',
    templateUrl: './lovelist.component.html',
    styleUrls: ['./lovelist.component.scss'],
    standalone: true,
    imports: [SavedTitleListComponent]
})
export class LovelistComponent {
    constructor(public auth: AuthService) {}

    remove(id: number) {
        void this.auth.removeFromLovelist(id);
    }

    moveToWatchlist(title: Title) {
        void this.auth.moveToWatchlist(title);
    }
}
