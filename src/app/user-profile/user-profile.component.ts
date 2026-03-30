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

    onImageError() {
        this.showIcon = true;
    }
}
