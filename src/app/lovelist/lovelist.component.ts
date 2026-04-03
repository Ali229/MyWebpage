import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {BackButtonComponent} from '../shared/back-button/back-button.component';
import {UserProfileComponent} from '../user-profile/user-profile.component';
import {PageLoaderComponent} from '../shared/page-loader/page-loader.component';
import {AuthService} from '../services/auth.service';

@Component({
    selector: 'app-lovelist',
    templateUrl: './lovelist.component.html',
    styleUrls: ['./lovelist.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule, BackButtonComponent, UserProfileComponent, PageLoaderComponent]
})
export class LovelistComponent implements OnInit {

    constructor(public auth: AuthService) {
    }

    ngOnInit() {
    }

}
