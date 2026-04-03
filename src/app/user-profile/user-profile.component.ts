import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {AuthService} from '../services/auth.service';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule]
})
export class UserProfileComponent {
    showIcon = false;

    constructor(public auth: AuthService) {
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
}
