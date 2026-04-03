import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TitleService} from '../services/title.service';
import {AuthService} from '../services/auth.service';
import {Subscription} from 'rxjs';
import {PopularComponent} from '../popular/popular.component';
import {TitleComponent} from '../title/title.component';
import {UserProfileComponent} from '../user-profile/user-profile.component';

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
    public showStreamableCheckBox = false;

    constructor(public ts: TitleService, public auth: AuthService) {
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
    }

    ngOnDestroy(): void {
        if (this.showStreamableCheckBoxSub) {
            this.showStreamableCheckBoxSub.unsubscribe();
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
