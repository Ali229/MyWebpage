import {Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from '../services/auth.service';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule]
})
export class UserProfileComponent {
    @ViewChild('menu') menuRef: ElementRef<HTMLDetailsElement>;
    showIcon = false;

    constructor(public auth: AuthService, private router: Router) {
    }

    get currentUrl(): string {
        return this.router.url || '/movies';
    }

    get displayName(): string {
        return this.auth.user.displayName || this.auth.user.email || 'Profile';
    }

    get avatarInitial(): string {
        return this.displayName.charAt(0).toUpperCase();
    }

    onImageError() {
        this.showIcon = true;
    }

    closeMenu(menu: HTMLDetailsElement) {
        menu.open = false;
    }

    signOut(menu: HTMLDetailsElement) {
        this.closeMenu(menu);
        this.auth.signOut();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const menu = this.menuRef?.nativeElement;
        if (!menu || !menu.open) {
            return;
        }

        const target = event.target as Node | null;
        if (target && !menu.contains(target)) {
            menu.open = false;
        }
    }
}
