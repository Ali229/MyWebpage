import {Component} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {NavbarComponent} from './navbar/navbar.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [NavbarComponent, RouterOutlet]
})
export class AppComponent {
    title = 'MyWebpage';

    constructor(private router: Router) {
    }

    get hasTightBottomPadding(): boolean {
        const path = this.router.url.split('?')[0];
        return path === '/movies' || path === '/lovelist';
    }

    get hasWatchlistBottomPadding(): boolean {
        const path = this.router.url.split('?')[0];
        return path === '/watchlist';
    }

    get hasSettingsBottomPadding(): boolean {
        const path = this.router.url.split('?')[0];
        return path === '/settings';
    }
}
