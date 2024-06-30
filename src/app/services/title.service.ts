import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Title} from '../models/title.model';
import {BehaviorSubject, Subscription} from 'rxjs';
import {take} from 'rxjs/operators';
import languagesData from '../../assets/languages.json';

interface Language {
    'iso_639_1': string;
    'english_name': string;
    'name': string;
}

@Injectable({
    providedIn: 'root'
})
export class TitleService {
    loading = false;
    selectedOption = '';
    type = '';
    title: string;
    year: string;
    error: boolean;
    errorTitle: string;
    languages: Language[];

    constructor(private http: HttpClient) {
        this.languages = languagesData;
    }

    private titleSubject$: BehaviorSubject<Title> = new BehaviorSubject(null);
    title$ = this.titleSubject$.asObservable();
    currentSearchSubscription: Subscription;

    multiSearch() {
        this.loading = true;
        this.error = false;
        this.http.get('https://api.themoviedb.org/3/search/multi?api_key=e84ac8af3c49ad3253e0369ec64dfbff&query=' + this.title)
            .subscribe((response: any) => {
                for (const result of response.results) {
                    if (result.media_type !== 'person' &&
                        (this.selectedOption ? result.media_type === this.selectedOption : true) &&
                        (this.year ? (this.year === new Date(result.release_date).getFullYear().toString()) ||
                            (this.year === new Date(result.first_air_date).getFullYear().toString()) : true)) {
                        return this.search(result.id, result.media_type);
                    }
                }
                this.loading = false;
                this.error = true;
                return this.errorTitle = this.title;
            });
    }

    search(id, type) {
        this.loading = true;
        this.error = false;

        // Cancel the previous HTTP request when a new one is initiated
        if (this.currentSearchSubscription) {
            this.currentSearchSubscription.unsubscribe();
        }

        this.currentSearchSubscription = this.http.get<Title>('https://api.themoviedb.org/3/' + type + '/' + id + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&append_to_response=videos,external_ids,release_dates,content_ratings,watch/providers')
            .pipe(take(1)).subscribe(data => {
                data.vote_average = Math.round(data.vote_average * 10);
                data.certification = this.getCertification(data, type);
                data.trailer = this.getTrailer(data);
                data.language = this.getLanguage(data);
                data.runtimeText = this.getRuntime(data);
                data.media_type = type;
                data.year = data.first_air_date ? new Date(data.first_air_date).getFullYear() : new Date(data.release_date).getFullYear();
                this.titleSubject$.next(data);
                this.searchOMDBRatings(data);
                this.searchStreams(data);
                this.loading = false;
            });
    }

    searchOMDBRatings(data) {
        if (data.external_ids.imdb_id) {
            this.http.get('https://www.omdbapi.com/?apikey=faec32e6&type=&i=' + data.external_ids.imdb_id)
                .subscribe((response: any) => {
                    data.totalScore = 0;
                    data.averageScore = 0;
                    data.scoreCount = 0;
                    for (const rating of response.Ratings) {
                        if (rating.Source === 'Internet Movie Database') {
                            data.imdbScore = parseFloat(rating.Value) * 10;
                            if (data.imdbScore) {
                                data.totalScore += data.imdbScore;
                                data.scoreCount++;
                            }
                        } else if (rating.Source === 'Rotten Tomatoes') {
                            data.rottenScore = parseFloat(rating.Value.replace('%', ''));
                            if (data.imdbScore) {
                                data.totalScore += data.rottenScore;
                                data.scoreCount++;
                                if (data.rottenScore >= 50) {
                                    data.rottenImage = 'tomato_full.png';
                                } else if (data.rottenScore < 50) {
                                    data.rottenImage = 'tomato_rotten.png';
                                }
                            }
                        } else if (rating.Source === 'Metacritic') {
                            if (data.imdbScore) {
                                data.metaScore = parseFloat(rating.Value);
                                data.totalScore += data.metaScore;
                                data.scoreCount++;
                            }
                        }
                    }
                    if (data.vote_average) {
                        data.totalScore += data.vote_average;
                        data.scoreCount++;
                    }
                    data.averageScore = Math.round(data.totalScore / data.scoreCount);
                    if (response.Poster !== 'N/A') {
                        data.omdbPoster = response.Poster;
                    }
                    if (response.Awards !== 'N/A') {
                        data.awards = response.Awards;
                    }
                    this.titleSubject$.next(data);
                });
        }
    }

    searchStreams(data: Title) {
        const providers = data['watch/providers'];
        if (providers && providers.results && providers.results.US && providers.results.US.flatrate) {
            data.streams = providers.results.US.flatrate;
            for (const stream of data.streams) {
                if (stream.provider_id === 8) {
                    data.onNetflix = true;
                } else if (stream.provider_id === 337) {
                    data.onDisney = true;
                } else if (stream.provider_id === 15) {
                    data.onHulu = true;
                } else if (stream.provider_id === 9) {
                    data.onAmazon = true;
                } else if (stream.provider_id === 188) {
                    data.onYoutube = true;
                } else if (stream.provider_id === 350) {
                    data.onApple = true;
                } else if (stream.provider_id === 299) {
                    data.onSling = true;
                } else if (stream.provider_id === 386) {
                    data.onPeacock = true;
                } else if (stream.provider_id === 1899) {
                    data.onMax = true;
                }
            }
            this.titleSubject$.next(data);
        }
    }

    getRatingColor(rating) {
        if (rating > 70) {
            return 'success';
        } else if (rating >= 50) {
            return 'warning';
        } else if (rating < 50) {
            return 'danger';
        }
    }

    getCertification(data, type) {
        if (type === 'movie') {
            for (const certification of data.release_dates.results) {
                if (certification.iso_3166_1 === 'US') {
                    return certification.release_dates[0].certification;
                }
            }
        } else {
            for (const certification of data.content_ratings.results) {
                if (certification.iso_3166_1 === 'US') {
                    return certification.rating;
                }
            }
        }
        return '';
    }

    getTrailer(data) {
        let secondaryVideo;
        for (const video of data.videos.results) {
            secondaryVideo = 'https://www.youtube.com/watch?v=' + video.key;
            if (video.name.toLowerCase().includes('trailer')) {
                return 'https://www.youtube.com/watch?v=' + video.key;
            }
        }
        if (secondaryVideo) {
            return secondaryVideo;
        }
        return 'https://www.youtube.com/results?search_query=' + (data.title ? data.title : data.name) + ' Trailer';
    }

    getLanguage(data) {
        for (const language of this.languages) {
            if (language.iso_639_1 === data.original_language) {
                return language.english_name;
            }
        }
    }

    getRuntime(data) {
        if (data.runtime > 60) {
            return (data.runtime - data.runtime % 60) / 60 + 'h ' + data.runtime % 60 + 'min';
        } else {
            return data.runtime + 'min';
        }
    }
}
