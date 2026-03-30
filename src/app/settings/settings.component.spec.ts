import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SettingsComponent} from './settings.component';
import {AuthService} from '../services/auth.service';
import {createAuthServiceStub} from '../testing/test-stubs';

describe('SettingsComponent', () => {
    let component: SettingsComponent;
    let fixture: ComponentFixture<SettingsComponent>;
    let authService: ReturnType<typeof createAuthServiceStub>;

    beforeEach(async () => {
        authService = createAuthServiceStub();
        authService.providers = [
            {id: 8, name: 'Netflix', icon: 'assets/netflix.svg', selected: true},
            {id: 337, name: 'Disney+', icon: 'assets/disney.webp', selected: false},
            {id: 15, name: 'Hulu', icon: 'assets/hulu.png', selected: false}
        ];

        await TestBed.configureTestingModule({
            imports: [SettingsComponent],
            providers: [
                {provide: AuthService, useValue: authService}
            ]
        })
            .overrideComponent(SettingsComponent, {
                set: {template: ''}
            })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('tracks the selected provider count', () => {
        expect(component.selectedProvidersCount).toBe(1);
    });

    it('detects unsaved selection changes after settings are loaded', () => {
        component.ngDoCheck();

        expect(component.hasChanges).toBeFalse();

        authService.providers[1].selected = true;

        expect(component.hasChanges).toBeTrue();
    });

    it('selects every provider', () => {
        component.selectAllProviders();

        expect(authService.providers.every(provider => provider.selected)).toBeTrue();
    });

    it('clears every provider', () => {
        component.clearProviders();

        expect(authService.providers.every(provider => !provider.selected)).toBeTrue();
    });

    it('saves settings through the auth service', () => {
        component.updateSettings();

        expect(authService.saveSettings).toHaveBeenCalled();
    });
});
