import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TitleService} from '../services/title.service';
import { HttpClient } from '@angular/common/http';
import {Title} from '../models/title.model';
import {AuthService} from '../services/auth.service';
import {Subscription} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {PopularService} from '../services/popular.service';
import {StreamComponent} from '../stream/stream.component';
import {PageLoaderComponent} from '../shared/page-loader/page-loader.component';

@Component({
    selector: 'app-popular',
    templateUrl: './popular.component.html',
    styleUrls: ['./popular.component.scss'],
    standalone: true,
    imports: [CommonModule, StreamComponent, PageLoaderComponent]
})
export class PopularComponent implements OnInit, OnDestroy {
    protected readonly Math = Math;
    showStreamableCheckBoxSub: Subscription;

    constructor(private http: HttpClient, public ts: TitleService, private auth: AuthService, public popService: PopularService) {
    }

    ngOnInit() {
        this.showStreamableCheckBoxSub = this.auth.bShowStreamableCheckbox$.subscribe(value => {
            if (!value) {
                return;
            }
            this.popService.popularMovies = [];
            this.popService.popularTVShows = [];
            this.popService.popularList = [];
            this.toggleMediaType(this.popService.selectedType);
        });
    }

    toggleMediaType(type: string) {
        this.popService.selectedType = type;
        const selectedList = this.popService.selectedType === 'movie' ? this.popService.popularMovies : this.popService.popularTVShows;
        if (selectedList.length === 0) {
            this.fetchMostPopular();
        } else {
            this.popService.loadingPopular = false;
        }
        this.popService.popularList = selectedList;
    }

    fetchMostPopular() {
        this.popService.loadingPopular = true;
        console.log('Fetching Most Popular...');
        const apiKey = 'e84ac8af3c49ad3253e0369ec64dfbff';
        const regionOrLang = this.popService.selectedType === 'movie' ? 'region=us' : 'with_original_language=en';
        let watchProvidersParam = '';
        if (this.auth.user.uid && this.auth.bShowStreamableOnly) {
            const selectedProviders = Array.from(new Set(
                this.auth.providers
                    .filter(provider => provider.selected)
                    .map(provider => provider.id)
            ));

            if (selectedProviders.length > 0) {
                watchProvidersParam = 'with_watch_providers=' + selectedProviders.join('|');
            }
        }
        const apiUrl = `https://api.themoviedb.org/3/discover/${this.popService.selectedType}?` + watchProvidersParam + `&watch_region=US&sort_by=popularity.desc` +
            `&api_key=${apiKey}&${regionOrLang}`;
        this.http.get(apiUrl).pipe(
            finalize(() => {
                this.popService.loadingPopular = false;
            })
        ).subscribe((response: any) => {
            response.results.forEach((title: Title) => {
                if (this.popService.selectedType === 'movie') {
                    this.popService.popularMovies.push(title);
                } else {
                    this.popService.popularTVShows.push(title);
                }
            });
            this.getProviders();
        });
    }

    getProviders() {
        const apiKey = 'e84ac8af3c49ad3253e0369ec64dfbff';
        const titles = this.popService.selectedType === 'movie' ? this.popService.popularMovies : this.popService.popularTVShows;

        titles.forEach((title: Title) => {
            const watchProvidersUrl = `https://api.themoviedb.org/3/${this.popService.selectedType}/${title.id}?api_key=${apiKey}&append_to_response=watch/providers`;
            this.http.get(watchProvidersUrl).subscribe((response: any) => {
                if (this.popService.selectedType === 'movie') {
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
                } else if (stream.provider_id === 386) {
                    title.onPeacock = true;
                } else if (stream.provider_id === 1899) {
                    title.onMax = true;
                } else if (stream.provider_id === 2303) {
                    title.onParamount = true;
                } else if (stream.provider_id === 43) {
                    title.onStarz = true;
                } else if (stream.provider_id === 526) {
                    title.onAmc = true;
                } else if (stream.provider_id === 34) {
                    title.onMgm = true;
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

    ngOnDestroy() {
        if (this.showStreamableCheckBoxSub) {
            this.showStreamableCheckBoxSub.unsubscribe();
        }
    }
}
