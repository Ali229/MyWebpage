import {Component, DoCheck} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {AuthService} from '../services/auth.service';

interface ProviderOption {
    id: number;
    name: string;
    icon: string;
    selected: boolean;
}

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule]
})
export class SettingsComponent implements DoCheck {
    private initialSelectionSnapshot = '';
    private initialSelectionCaptured = false;


    constructor(public auth: AuthService) {
    }

    get selectedProviders(): ProviderOption[] {
        return this.auth.providers.filter((provider): provider is ProviderOption => provider.selected);
    }

    get selectedProvidersCount(): number {
        return this.selectedProviders.length;
    }

    get hasChanges(): boolean {
        return this.initialSelectionCaptured && this.getSelectionSnapshot() !== this.initialSelectionSnapshot;
    }

    ngDoCheck() {
        if (!this.auth.settingsLoaded) {
            this.initialSelectionSnapshot = '';
            this.initialSelectionCaptured = false;
            return;
        }

        if (!this.initialSelectionCaptured) {
            this.initialSelectionSnapshot = this.getSelectionSnapshot();
            this.initialSelectionCaptured = true;
        }
    }

    updateSettings() {
        this.auth.saveSettings();
    }

    selectAllProviders() {
        this.auth.providers.forEach(provider => provider.selected = true);
    }

    clearProviders() {
        this.auth.providers.forEach(provider => provider.selected = false);
    }

    private getSelectionSnapshot() {
        return this.auth.providers
            .filter(provider => provider.selected)
            .map(provider => provider.id)
            .sort((first, second) => first - second)
            .join(',');
    }
}
