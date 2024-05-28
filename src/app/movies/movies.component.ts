import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {TitleService} from '../services/title.service';

@Component({
    selector: 'app-movies',
    templateUrl: './movies.component.html',
    styleUrls: ['./movies.component.scss']
})

export class MoviesComponent implements OnInit, AfterViewInit {
    @ViewChild('searchInput', {static: false}) searchInput: ElementRef;
    isPhone: boolean = window.innerWidth <= 767.98; // Check if the screen width is less than or equal to your breakpoint

    constructor(public ts: TitleService) {
    }

    ngOnInit() {
        // Subscribe to window resize events to update the isPhone value
        window.addEventListener('resize', this.onResize.bind(this));
    }


    ngAfterViewInit() {
        this.searchInput.nativeElement.focus();
    }

    onResize() {
        // Update the isPhone value when the window is resized
        this.isPhone = window.innerWidth <= 767.98;
    }
}
