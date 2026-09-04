import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MoviesComponent} from './movies.component';
import {AuthService} from '../services/auth.service';
import {TitleService} from '../services/title.service';
import {createAuthServiceStub, createTitleServiceStub} from '../testing/test-stubs';
import {ActivatedRoute, Router} from '@angular/router';

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

    it('replaces the search URL with the canonical title URL when a result is opened', () => {
        const router = TestBed.inject(Router);
        const route = TestBed.inject(ActivatedRoute);
        spyOn(router, 'navigate').and.resolveTo(true);

        component.openSearchResult({
            id: 969681,
            media_type: 'movie',
            poster_path: '',
            title: 'Sisu',
            name: '',
            release_date: '',
            first_air_date: '',
            overview: '',
            searchScore: 0,
            vote_count: 0
        });

        expect(router.navigate).toHaveBeenCalledWith([], {
            relativeTo: route,
            queryParams: {id: 969681, type: 'movie', q: null, searchType: null},
            replaceUrl: true
        });
        expect(TestBed.inject(TitleService).search).not.toHaveBeenCalled();
    });
});
