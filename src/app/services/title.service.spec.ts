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

    it('picks a non-empty US movie certification when early US entries are blank', () => {
        const service: TitleService = TestBed.inject(TitleService);
        const certification = service.getCertification({
            release_dates: {
                results: [
                    {
                        iso_3166_1: 'US',
                        release_dates: [
                            {certification: '', type: 1},
                            {certification: 'PG-13', type: 3}
                        ]
                    }
                ]
            }
        }, 'movie');

        expect(certification).toBe('PG-13');
    });

    it('picks a non-empty US TV rating when US entry has whitespace or empty values', () => {
        const service: TitleService = TestBed.inject(TitleService);
        const certification = service.getCertification({
            content_ratings: {
                results: [
                    {iso_3166_1: 'US', rating: '   '},
                    {iso_3166_1: 'US', rating: 'TV-MA'}
                ]
            }
        }, 'tv');

        expect(certification).toBe('TV-MA');
    });

    it('falls back to preferred non-US movie certification and marks country when US is unavailable', () => {
        const service: TitleService = TestBed.inject(TitleService);
        const certification = service.getCertification({
            release_dates: {
                results: [
                    {
                        iso_3166_1: 'GB',
                        release_dates: [
                            {certification: '15', type: 3}
                        ]
                    },
                    {
                        iso_3166_1: 'CA',
                        release_dates: [
                            {certification: '14A', type: 3}
                        ]
                    }
                ]
            }
        }, 'movie');

        expect(certification).toBe('14A (CA)');
    });

    it('falls back to non-US TV rating and marks country when US is unavailable', () => {
        const service: TitleService = TestBed.inject(TitleService);
        const certification = service.getCertification({
            content_ratings: {
                results: [
                    {iso_3166_1: 'GB', rating: '15'},
                    {iso_3166_1: 'KR', rating: '18'}
                ]
            }
        }, 'tv');

        expect(certification).toBe('15 (GB)');
    });
});
