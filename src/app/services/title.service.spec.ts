import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {TitleService} from './title.service';

describe('MovieServiceService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        providers: [provideHttpClient()]
    }));

    it('should be created', () => {
        const service: TitleService = TestBed.inject(TitleService);
        expect(service).toBeTruthy();
    });
});
