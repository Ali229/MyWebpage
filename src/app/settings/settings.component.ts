import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {AuthService} from '../services/auth.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule]
})
export class SettingsComponent {


    constructor(public auth: AuthService) {
    }

    updateSettings() {
        this.auth.saveSettings();
    }
}
