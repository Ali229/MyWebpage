import {Component, DoCheck} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {BackButtonComponent} from '../shared/back-button/back-button.component';
import {UserProfileComponent} from '../user-profile/user-profile.component';
import {PageLoaderComponent} from '../shared/page-loader/page-loader.component';

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
    imports: [CommonModule, FormsModule, RouterModule, BackButtonComponent, UserProfileComponent, PageLoaderComponent]
})
export class SettingsComponent implements DoCheck {
    private initialSelectionSnapshot = '';
    private initialSelectionCaptured = false;
    private readonly fallbackReturnUrl = '/movies';
    private readonly returnUrl: string;


    constructor(public auth: AuthService, private route: ActivatedRoute, private router: Router) {
        this.returnUrl = this.resolveReturnUrl();
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

    async updateSettings() {
        const saved = await this.auth.saveSettings();
        if (saved) {
            await this.router.navigateByUrl(this.returnUrl, {replaceUrl: true});
        }
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

    private resolveReturnUrl(): string {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (!returnUrl || !returnUrl.startsWith('/')) {
            return this.fallbackReturnUrl;
        }
        if (returnUrl.startsWith('/settings')) {
            return this.fallbackReturnUrl;
        }
        return returnUrl;
    }
}
