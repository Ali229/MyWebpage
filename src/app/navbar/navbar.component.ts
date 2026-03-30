import {Component, HostListener, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    standalone: true,
    imports: [RouterModule]
})
export class NavbarComponent implements OnInit {
    private readonly desktopMenuMinWidth = 1200;
    menuOpen = false;

    constructor() {
    }

    ngOnInit() {
        this.closeMenuForDesktop();
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    closeMenu() {
        this.menuOpen = false;
    }

    @HostListener('window:resize')
    onResize() {
        this.closeMenuForDesktop();
    }

    private closeMenuForDesktop() {
        if (window.innerWidth >= this.desktopMenuMinWidth) {
            this.menuOpen = false;
        }
    }

}
