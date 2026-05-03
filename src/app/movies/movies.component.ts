import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SearchResultItem, TitleService} from '../services/title.service';
import {AuthService} from '../services/auth.service';
import {Subscription} from 'rxjs';
import {PopularComponent} from '../popular/popular.component';
import {TitleComponent} from '../title/title.component';
import {UserProfileComponent} from '../user-profile/user-profile.component';
import {ActivatedRoute, Router} from '@angular/router';
import {PageLoaderComponent} from '../shared/page-loader/page-loader.component';
import {PopularGenreOption, PopularService} from '../services/popular.service';

@Component({
    selector: 'app-movies',
    templateUrl: './movies.component.html',
    styleUrls: ['./movies.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, UserProfileComponent, TitleComponent, PopularComponent, PageLoaderComponent]
})

export class MoviesComponent implements OnInit, AfterViewInit, OnDestroy  {
    @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;
    @ViewChild('popularGenreMenu') popularGenreMenu: ElementRef<HTMLDetailsElement>;
    isPhone: boolean = window.innerWidth <= 767.98; // Check if the screen width is less than or equal to your breakpoint
    private showStreamableCheckBoxSub: Subscription;
    private queryParamsSub: Subscription;
    private titleSyncSub: Subscription;
    private currentTitleKey = '';
    private currentSearchRouteKey = '';
    public showStreamableCheckBox = false;

    constructor(
        public ts: TitleService,
        public auth: AuthService,
        public popService: PopularService,
        private route: ActivatedRoute,
        private router: Router
    ) {
    }

    ngOnInit() {
        this.showStreamableCheckBoxSub = this.auth.bShowStreamableCheckbox$.subscribe(value => {
            this.showStreamableCheckBox = value;
        });
        this.queryParamsSub = this.route.queryParamMap.subscribe(params => {
            const id = Number(params.get('id'));
            const type = params.get('type');
            const queryKey = `${id}:${type}`;
            const routeSearchQuery = (params.get('q') || '').trim();
            const searchTypeParam = params.get('searchType');
            const routeSearchType: 'movie' | 'tv' | null =
                searchTypeParam === 'movie' || searchTypeParam === 'tv' ? searchTypeParam : null;

            if (Number.isInteger(id) && id > 0 && (type === 'movie' || type === 'tv') && queryKey !== this.currentTitleKey) {
                this.currentSearchRouteKey = '';
                this.ts.search(id, type);
                return;
            }

            if (routeSearchQuery) {
                const searchRouteKey = `${routeSearchQuery}:${routeSearchType || 'auto'}`;
                if (routeSearchType) {
                    this.ts.searchResultsType = routeSearchType;
                }
                this.ts.title = routeSearchQuery;

                if (this.currentSearchRouteKey === searchRouteKey && this.ts.searchResultsActive) {
                    return;
                }

                this.currentSearchRouteKey = searchRouteKey;
                void this.ts.multiSearch().then(() => {
                    if (routeSearchType) {
                        this.ts.searchResultsType = routeSearchType;
                    }
                });
                return;
            }

            this.currentSearchRouteKey = '';
            this.ts.clearSearchResults();
        });
        this.titleSyncSub = this.ts.title$.subscribe(title => {
            if (!title?.id || (title.media_type !== 'movie' && title.media_type !== 'tv')) {
                return;
            }

            // Preserve search routes like ?q=... on refresh/back navigation.
            const activeRouteQuery = (this.route.snapshot.queryParamMap.get('q') || '').trim();
            if (activeRouteQuery || this.ts.searchResultsActive) {
                return;
            }

            const titleKey = `${title.id}:${title.media_type}`;
            this.currentTitleKey = titleKey;

            const routeId = Number(this.route.snapshot.queryParamMap.get('id'));
            const routeType = this.route.snapshot.queryParamMap.get('type');
            if (routeId === title.id && routeType === title.media_type) {
                return;
            }

            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {id: title.id, type: title.media_type, q: null, searchType: null},
                replaceUrl: true
            });
        });
    }

    ngOnDestroy(): void {
        if (this.showStreamableCheckBoxSub) {
            this.showStreamableCheckBoxSub.unsubscribe();
        }
        if (this.queryParamsSub) {
            this.queryParamsSub.unsubscribe();
        }
        if (this.titleSyncSub) {
            this.titleSyncSub.unsubscribe();
        }
    }


    ngAfterViewInit() {
        if (this.searchInput?.nativeElement) {
            this.searchInput.nativeElement.focus();
        }
    }

    async onSearchSubmit() {
        if (!this.hasSearchQuery) {
            return;
        }

        await this.ts.multiSearch();
        this.updateSearchRoute();
    }

    setSearchResultsType(type: 'movie' | 'tv') {
        this.ts.searchResultsType = type;
        if (this.ts.searchResultsActive && this.hasSearchQuery) {
            this.updateSearchRoute();
        }
    }

    openSearchResult(result: SearchResultItem) {
        if (!result?.id || (result.media_type !== 'movie' && result.media_type !== 'tv')) {
            return;
        }

        this.ts.search(result.id, result.media_type);
    }

    get activeSearchResults(): SearchResultItem[] {
        return this.ts.searchResultsType === 'movie' ? this.ts.searchMovieResults : this.ts.searchTvResults;
    }

    get movieResultCount(): number {
        return this.ts.searchMovieResults.length;
    }

    get tvResultCount(): number {
        return this.ts.searchTvResults.length;
    }

    get hasSearchResultsView(): boolean {
        return this.ts.searchResultsActive;
    }

    get hasSearchQuery(): boolean {
        return typeof this.ts.title === 'string' && this.ts.title.trim().length > 0;
    }

    trackSearchResult(_index: number, result: SearchResultItem): string {
        return `${result.media_type}:${result.id}`;
    }

    getSearchResultDate(result: SearchResultItem): string {
        return result?.release_date || result?.first_air_date || '';
    }

    getSearchResultScore(result: SearchResultItem): number {
        return Number(result?.searchScore) > 0 ? result.searchScore : 0;
    }

    getSearchResultName(result: SearchResultItem): string {
        return result?.title || result?.name || 'Untitled';
    }

    selectPopularGenre(option: PopularGenreOption, menu: HTMLDetailsElement) {
        if (!this.popService.isGenreAvailableForSelectedType(option)) {
            return;
        }

        this.popService.selectGenre(option.key);
        menu.open = false;
    }

    isPopularGenreDisabled(option: PopularGenreOption): boolean {
        return !this.popService.isGenreAvailableForSelectedType(option);
    }

    @HostListener('window:resize')
    onResize() {
        this.isPhone = window.innerWidth <= 767.98;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const menu = this.popularGenreMenu?.nativeElement;
        const target = event.target as Node | null;
        if (menu && menu.open && target && !menu.contains(target)) {
            menu.open = false;
        }
    }

    @HostListener('document:keydown.escape')
    onEscapeKey() {
        const menu = this.popularGenreMenu?.nativeElement;
        if (menu && menu.open) {
            menu.open = false;
        }
    }

    private updateSearchRoute() {
        const query = (this.ts.title || '').trim();
        if (!query) {
            return;
        }

        const searchType = this.ts.searchResultsType === 'tv' ? 'tv' : 'movie';
        this.currentSearchRouteKey = `${query}:${searchType}`;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {q: query, searchType, id: null, type: null},
            replaceUrl: true
        });
    }
}
