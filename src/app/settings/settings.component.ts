import {Component, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {


    constructor(public auth: AuthService) {
    }

    updateSettings() {
        this.auth.saveSettings();
    }
}
