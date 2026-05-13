import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {Subject} from 'rxjs';

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
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        const authServiceStub: any = createAuthServiceStub();
        authServiceStub.bShowStreamableCheckbox$ = new Subject<boolean>().asObservable();

        await TestBed.configureTestingModule({
            imports: [PopularComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                {provide: AuthService, useValue: authServiceStub},
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
        httpMock = TestBed.inject(HttpTestingController);
        fixture.detectChanges();
    });

    afterEach(() => {
        httpMock.verify();
        sessionStorage.removeItem('moviesDatabaseRatingsUnavailable');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should skip later MoviesDatabase rating requests after service errors', async () => {
        (component as any).rapidApiKey = 'rapid-api-key';
        (component as any).moviesDatabaseHost = 'moviesdatabase.p.rapidapi.com';

        const firstScorePromise = (component as any).fetchMoviesDatabaseScore('tt31589922');
        const firstRequest = httpMock.expectOne('https://moviesdatabase.p.rapidapi.com/titles/tt31589922/ratings');
        firstRequest.flush({message: 'Bad Gateway'}, {status: 502, statusText: 'Bad Gateway'});

        await expectAsync(firstScorePromise).toBeResolvedTo(null);

        await expectAsync((component as any).fetchMoviesDatabaseScore('tt1234567')).toBeResolvedTo(null);
        httpMock.expectNone('https://moviesdatabase.p.rapidapi.com/titles/tt1234567/ratings');
        expect(sessionStorage.getItem('moviesDatabaseRatingsUnavailable')).toBe('true');
    });
});
