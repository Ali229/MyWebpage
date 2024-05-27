import {Component, OnInit} from '@angular/core';
import {TitleService} from '../services/title.service';
import {HttpClient} from '@angular/common/http';
import {Title} from '../models/title.model';

@Component({
    selector: 'app-popular',
    templateUrl: './popular.component.html',
    styleUrls: ['./popular.component.scss']
})
export class PopularComponent implements OnInit {
    selectedType = 'movie';
    popularMovies: Title[] = [];
    popularTVShows: Title[] = [];
    popularList: Title[] = [];
    protected readonly Math = Math;

    constructor(private http: HttpClient, public ts: TitleService) {
    }

    ngOnInit() {
        this.toggleMediaType('movie');
    }

    toggleMediaType(type: string) {
        this.selectedType = type;
        const selectedList = this.selectedType === 'movie' ? this.popularMovies : this.popularTVShows;
        if (selectedList.length === 0) {
            this.fetchMostPopular();
        }
        this.popularList = selectedList;
    }

    fetchMostPopular() {
        const apiKey = 'e84ac8af3c49ad3253e0369ec64dfbff';
        const regionOrLang = this.selectedType === 'movie' ? 'region=us' :
            'with_original_language=en&first_air_date_year=' + new Date().getFullYear();
        const apiUrl = `https://api.themoviedb.org/3/discover/${this.selectedType}?sort_by=popularity.desc` +
            `&api_key=${apiKey}&${regionOrLang}`;
        this.http.get(apiUrl).subscribe((response: any) => {
            response.results.forEach((title: Title) => {
                if (this.selectedType === 'movie') {
                    this.popularMovies.push(title);
                } else {
                    this.popularTVShows.push(title);
                }
            });
            this.getProviders();
        });
    }

    getProviders() {
        const apiKey = 'e84ac8af3c49ad3253e0369ec64dfbff';
        const titles = this.selectedType === 'movie' ? this.popularMovies : this.popularTVShows;

        titles.forEach((title: Title) => {
            const watchProvidersUrl = `https://api.themoviedb.org/3/${this.selectedType}/${title.id}?api_key=${apiKey}&append_to_response=watch/providers`;
            this.http.get(watchProvidersUrl).subscribe((response: any) => {
                if (this.selectedType === 'movie') {
                    title.release_date = response.release_date;
                }
                title = this.searchStreams(response, title);
            });
        });
    }

    searchStreams(response: any, title: Title): Title {
        const providers = response['watch/providers'];
        if (providers && providers.results && providers.results.US && providers.results.US.flatrate) {
            title.streams = providers.results.US.flatrate;
            for (const stream of title.streams) {
                if (stream.provider_id === 8) {
                    title.onNetflix = true;
                } else if (stream.provider_id === 337) {
                    title.onDisney = true;
                } else if (stream.provider_id === 15) {
                    title.onHulu = true;
                } else if (stream.provider_id === 9) {
                    title.onAmazon = true;
                } else if (stream.provider_id === 188) {
                    title.onYoutube = true;
                } else if (stream.provider_id === 350) {
                    title.onApple = true;
                } else if (stream.provider_id === 299) {
                    title.onSling = true;
                } else if (stream.provider_id === 387) {
                    title.onPeacock = true;
                }
            }
            return title;
        }
    }

    scrollToElement() {
        const target = document.getElementById('target');
        if (target) {
            target.scrollIntoView({behavior: 'smooth'});
        }
    }
}
