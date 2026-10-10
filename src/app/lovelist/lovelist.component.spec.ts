import {ComponentFixture, TestBed} from '@angular/core/testing';

import {LovelistComponent} from './lovelist.component';
import {AuthService} from '../services/auth.service';
import {SavedTitleRefreshService} from '../services/saved-title-refresh.service';
import {createAuthServiceStub} from '../testing/test-stubs';

describe('LovelistComponent', () => {
    let component: LovelistComponent;
    let fixture: ComponentFixture<LovelistComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LovelistComponent],
            providers: [
                {provide: AuthService, useValue: createAuthServiceStub()},
                {provide: SavedTitleRefreshService, useValue: {start: jasmine.createSpy(), stop: jasmine.createSpy()}}
            ]
        })
            .overrideComponent(LovelistComponent, {
                set: {template: ''}
            })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LovelistComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
