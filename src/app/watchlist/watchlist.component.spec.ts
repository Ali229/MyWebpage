import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WatchlistComponent} from './watchlist.component';
import {AuthService} from '../services/auth.service';
import {TitleService} from '../services/title.service';
import {createAuthServiceStub, createTitleServiceStub} from '../testing/test-stubs';

describe('WatchlistComponent', () => {
    let component: WatchlistComponent;
    let fixture: ComponentFixture<WatchlistComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WatchlistComponent],
            providers: [
                {provide: AuthService, useValue: createAuthServiceStub()},
                {provide: TitleService, useValue: createTitleServiceStub()}
            ]
        })
            .overrideComponent(WatchlistComponent, {
                set: {template: ''}
            })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WatchlistComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
