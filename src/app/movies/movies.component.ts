import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {TitleService} from '../services/title.service';
import {AuthService} from '../services/auth.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'app-movies',
    templateUrl: './movies.component.html',
    styleUrls: ['./movies.component.scss']
})

export class MoviesComponent implements OnInit, AfterViewInit, OnDestroy  {
    @ViewChild('searchInput', {static: false}) searchInput: ElementRef;
    isPhone: boolean = window.innerWidth <= 767.98; // Check if the screen width is less than or equal to your breakpoint
    private showStreamableCheckBoxSub: Subscription;
    protected showStreamableCheckBox = false;

    constructor(public ts: TitleService, public auth: AuthService) {
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
        this.searchInput.nativeElement.focus();
    }

    onResize() {
        // Update the isPhone value when the window is resized
        this.isPhone = window.innerWidth <= 767.98;
    }
}
