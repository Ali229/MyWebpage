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

    it('prefers a real trailer over game crossover videos', () => {
        const service: TitleService = TestBed.inject(TitleService);
        const trailerUrl = service.getTrailer({
            title: 'Shelter',
            videos: {
                results: [
                    {
                        name: 'Become The Shelter Fortnite Gameplay Trailer',
                        key: 'game123',
                        site: 'YouTube',
                        type: 'Featurette',
                        official: true
                    },
                    {
                        name: 'Official Trailer',
                        key: 'movie456',
                        site: 'YouTube',
                        type: 'Trailer',
                        official: true
                    }
                ]
            }
        }, 'movie');

        expect(trailerUrl).toBe('https://www.youtube.com/watch?v=movie456');
    });

    it('falls back to a media-specific YouTube search when no videos are available', () => {
        const service: TitleService = TestBed.inject(TitleService);
        const trailerUrl = service.getTrailer({
            title: 'Some Title',
            videos: {
                results: []
            }
        }, 'movie');

        expect(trailerUrl).toBe('https://www.youtube.com/results?search_query=Some%20Title%20movie%20official%20trailer');
    });
});
