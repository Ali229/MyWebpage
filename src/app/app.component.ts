import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router, RouterOutlet, NavigationEnd} from '@angular/router';
import {Title as BrowserTitle} from '@angular/platform-browser';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {NavbarComponent} from './navbar/navbar.component';
import {TitleService} from './services/title.service';
import {Title} from './models/title.model';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [NavbarComponent, RouterOutlet]
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'MyWebpage';

    private readonly defaultTitle = 'Muhammad Ali - Portfolio';
    private selectedMovieTitle: Title | null = null;
    private routerEventsSub?: Subscription;
    private titleSub?: Subscription;

    constructor(
        private router: Router,
        private browserTitle: BrowserTitle,
        private ts: TitleService
    ) {
    }

    ngOnInit() {
        this.titleSub = this.ts.title$.subscribe(title => {
            this.selectedMovieTitle = title;
            this.updateDocumentTitle();
        });

        this.routerEventsSub = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => this.updateDocumentTitle());

        this.updateDocumentTitle();
    }

    ngOnDestroy() {
        if (this.routerEventsSub) {
            this.routerEventsSub.unsubscribe();
        }
        if (this.titleSub) {
            this.titleSub.unsubscribe();
        }
    }

    get hasTightBottomPadding(): boolean {
        const path = this.router.url.split('?')[0];
        return path === '/movies';
    }

    get hasWatchlistBottomPadding(): boolean {
        const path = this.router.url.split('?')[0];
        return path === '/watchlist' || path === '/lovelist';
    }

    get hasSettingsBottomPadding(): boolean {
        const path = this.router.url.split('?')[0];
        return path === '/settings';
    }

    private updateDocumentTitle() {
        const path = this.router.url.split('?')[0];

        if (path === '/movies') {
            this.browserTitle.setTitle(this.buildMoviesTitle());
            return;
        }

        if (path === '/watchlist') {
            this.browserTitle.setTitle('Watchlist - Movies');
            return;
        }

        if (path === '/lovelist') {
            this.browserTitle.setTitle('Lovelist - Movies');
            return;
        }

        if (path === '/settings') {
            this.browserTitle.setTitle('Settings - Movies');
            return;
        }

        this.browserTitle.setTitle(this.defaultTitle);
    }

    private buildMoviesTitle(): string {
        if (!this.hasRouteSelectedTitle()) {
            return 'Movies';
        }

        const titleName = this.selectedMovieTitle?.title || this.selectedMovieTitle?.name;
        if (!titleName) {
            return 'Movies';
        }

        const year = this.getReleaseYear(this.selectedMovieTitle);
        if (year) {
            return `${titleName} (${year}) - Movies`;
        }

        return `${titleName} - Movies`;
    }

    private hasRouteSelectedTitle(): boolean {
        const queryParams = this.router.parseUrl(this.router.url).queryParams;
        const id = Number(queryParams?.id);
        const type = queryParams?.type;
        return Number.isInteger(id) && id > 0 && (type === 'movie' || type === 'tv');
    }

    private getReleaseYear(title: Title | null): number | null {
        if (!title) {
            return null;
        }

        const sourceDate = title.release_date || title.first_air_date;
        if (!sourceDate) {
            return null;
        }

        const parsedDate = new Date(sourceDate);
        const year = parsedDate.getFullYear();
        return Number.isNaN(year) ? null : year;
    }
}
