import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TitleService} from '../services/title.service';
import {AuthService} from '../services/auth.service';
import {Subscription} from 'rxjs';
import {PopularComponent} from '../popular/popular.component';
import {TitleComponent} from '../title/title.component';
import {UserProfileComponent} from '../user-profile/user-profile.component';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
    selector: 'app-movies',
    templateUrl: './movies.component.html',
    styleUrls: ['./movies.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, UserProfileComponent, TitleComponent, PopularComponent]
})

export class MoviesComponent implements OnInit, AfterViewInit, OnDestroy  {
    @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;
    @ViewChild('moviesTypeMenu') moviesTypeMenuRef: ElementRef<HTMLDetailsElement>;
    isPhone: boolean = window.innerWidth <= 767.98; // Check if the screen width is less than or equal to your breakpoint
    private showStreamableCheckBoxSub: Subscription;
    private queryParamsSub: Subscription;
    private titleSyncSub: Subscription;
    private currentTitleKey = '';
    public showStreamableCheckBox = false;

    constructor(
        public ts: TitleService,
        public auth: AuthService,
        private route: ActivatedRoute,
        private router: Router
    ) {
    }

    get mediaTypeLabel(): string {
        if (this.ts.selectedOption === 'movie') {
            return 'Movie';
        }
        if (this.ts.selectedOption === 'tv') {
            return 'TV';
        }

        return 'All';
    }

    setMediaType(type: '' | 'movie' | 'tv', menu: HTMLDetailsElement) {
        this.ts.selectedOption = type;
        menu.open = false;
    }

    ngOnInit() {
        // Subscribe to window resize events to update the isPhone value
        window.addEventListener('resize', this.onResize.bind(this));
        this.showStreamableCheckBoxSub = this.auth.bShowStreamableCheckbox$.subscribe(value => {
            this.showStreamableCheckBox = value;
        });
        this.queryParamsSub = this.route.queryParamMap.subscribe(params => {
            const id = Number(params.get('id'));
            const type = params.get('type');
            const queryKey = `${id}:${type}`;

            if (Number.isInteger(id) && id > 0 && (type === 'movie' || type === 'tv') && queryKey !== this.currentTitleKey) {
                this.ts.search(id, type);
            }
        });
        this.titleSyncSub = this.ts.title$.subscribe(title => {
            if (!title?.id || (title.media_type !== 'movie' && title.media_type !== 'tv')) {
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
                queryParams: {id: title.id, type: title.media_type},
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

    onResize() {
        // Update the isPhone value when the window is resized
        this.isPhone = window.innerWidth <= 767.98;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const menu = this.moviesTypeMenuRef?.nativeElement;
        if (!menu || !menu.open) {
            return;
        }

        const target = event.target as Node | null;
        if (target && !menu.contains(target)) {
            menu.open = false;
        }
    }
}
