import {Component, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
    providers = [
        {id: 'netflix', name: 'Netflix', icon: 'assets/netflix.svg', selected: false},
        {id: 'disney', name: 'Disney+', icon: 'assets/disney.webp', selected: false},
        {id: 'hulu', name: 'Hulu', icon: 'assets/hulu.png', selected: false},
        {id: 'amazon', name: 'Amazon Prime Video', icon: 'assets/prime.jpg', selected: false},
        {id: 'youtube', name: 'Youtube', icon: 'assets/youtube.png', selected: false},
        {id: 'apple', name: 'Apple', icon: 'assets/apple.png', selected: false},
        {id: 'sling', name: 'Sling', icon: 'assets/sling.png', selected: false},
        {id: 'peacock', name: 'Peacock', icon: 'assets/peacock.svg', selected: false},
    ];

    constructor(public auth: AuthService) {
    }

    ngOnInit() {
        this.auth.loadSettings(this.providers);
    }

    updateSettings() {
        this.auth.saveSettings(this.providers);
    }
}
