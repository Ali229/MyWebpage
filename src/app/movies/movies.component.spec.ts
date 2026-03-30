import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MoviesComponent} from './movies.component';
import {AuthService} from '../services/auth.service';
import {TitleService} from '../services/title.service';
import {createAuthServiceStub, createTitleServiceStub} from '../testing/test-stubs';

describe('MoviesComponent', () => {
    let component: MoviesComponent;
    let fixture: ComponentFixture<MoviesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MoviesComponent],
            providers: [
                {provide: AuthService, useValue: createAuthServiceStub()},
                {provide: TitleService, useValue: createTitleServiceStub()}
            ]
        })
            .overrideComponent(MoviesComponent, {
                set: {template: ''}
            })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MoviesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
