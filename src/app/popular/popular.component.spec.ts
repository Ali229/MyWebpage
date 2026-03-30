import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';

import {PopularComponent} from './popular.component';
import {AuthService} from '../services/auth.service';
import {PopularService} from '../services/popular.service';
import {TitleService} from '../services/title.service';
import {
    createAuthServiceStub,
    createPopularServiceStub,
    createTitleServiceStub
} from '../testing/test-stubs';

describe('PopularComponent', () => {
    let component: PopularComponent;
    let fixture: ComponentFixture<PopularComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PopularComponent],
            providers: [
                provideHttpClient(),
                {provide: AuthService, useValue: createAuthServiceStub()},
                {provide: TitleService, useValue: createTitleServiceStub()},
                {provide: PopularService, useValue: createPopularServiceStub()}
            ]
        })
            .overrideComponent(PopularComponent, {
                set: {template: ''}
            })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PopularComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
