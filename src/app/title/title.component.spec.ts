import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TitleComponent} from './title.component';
import {AuthService} from '../services/auth.service';
import {TitleService} from '../services/title.service';
import {createAuthServiceStub, createTitleServiceStub} from '../testing/test-stubs';

describe('TitleComponent', () => {
    let component: TitleComponent;
    let fixture: ComponentFixture<TitleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TitleComponent],
            providers: [
                {provide: AuthService, useValue: createAuthServiceStub()},
                {provide: TitleService, useValue: createTitleServiceStub()}
            ]
        })
            .overrideComponent(TitleComponent, {
                set: {template: ''}
            })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TitleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
