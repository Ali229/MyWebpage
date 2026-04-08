import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TitleService} from '../services/title.service';
import { HttpClient } from '@angular/common/http';
import {Title} from '../models/title.model';
import {AuthService} from '../services/auth.service';
import {Subscription} from 'rxjs';
import {take} from 'rxjs/operators';
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

    async fetchMostPopular() {
        this.popService.loadingPopular = true;
        console.log('Fetching Most Popular...');
        const apiKey = 'e84ac8af3c49ad3253e0369ec64dfbff';
        const selectedType: 'movie' | 'tv' = this.popService.selectedType === 'tv' ? 'tv' : 'movie';
        const currentYear = new Date().getFullYear();
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

        try {
            if (selectedType === 'movie') {
                const movieUrl = this.buildDiscoverUrl(selectedType, apiKey, watchProvidersParam);
                const response: any = await this.http.get(movieUrl).pipe(take(1)).toPromise();
                this.popService.popularMovies.length = 0;
                this.popService.popularMovies.push(...(response.results || []));
            } else {
                const tvCurrentYearUrl = this.buildDiscoverUrl(selectedType, apiKey, watchProvidersParam, currentYear);
                const currentYearResponse: any = await this.http.get(tvCurrentYearUrl).pipe(take(1)).toPromise();
                const currentYearResults: Title[] = currentYearResponse.results || [];

                let mergedTvResults = [...currentYearResults];
                if (mergedTvResults.length < 20) {
                    const tvFallbackUrl = this.buildDiscoverUrl(selectedType, apiKey, watchProvidersParam);
                    const fallbackResponse: any = await this.http.get(tvFallbackUrl).pipe(take(1)).toPromise();
                    const fallbackResults: Title[] = fallbackResponse.results || [];
                    mergedTvResults = this.mergeById(currentYearResults, fallbackResults, 20);
                }

                this.popService.popularTVShows.length = 0;
                this.popService.popularTVShows.push(...mergedTvResults);
            }

            this.popService.popularList = selectedType === 'movie' ? this.popService.popularMovies : this.popService.popularTVShows;
            this.getProviders();
        } catch (error) {
            console.error('Failed to fetch popular titles', error);
        } finally {
            this.popService.loadingPopular = false;
        }
    }

    getProviders() {
        const apiKey = 'e84ac8af3c49ad3253e0369ec64dfbff';
        const titles = this.popService.selectedType === 'movie' ? this.popService.popularMovies : this.popService.popularTVShows;

        titles.forEach((title: Title) => {
            const watchProvidersUrl = `https://api.themoviedb.org/3/${this.popService.selectedType}/${title.id}/watch/providers?api_key=${apiKey}`;
            this.http.get(watchProvidersUrl).subscribe((response: any) => {
                title = this.searchStreams(response, title);
            });
        });
    }

    searchStreams(response: any, title: Title): Title {
        // Supports both TMDB details responses (append_to_response) and dedicated watch/providers responses.
        const providers = response['watch/providers'] || response;
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

    private buildDiscoverUrl(type: 'movie' | 'tv', apiKey: string, watchProvidersParam: string, year?: number) {
        const params = new URLSearchParams();
        if (watchProvidersParam) {
            const [key, value] = watchProvidersParam.split('=');
            if (key && value) {
                params.set(key, value);
            }
        }
        params.set('watch_region', 'US');
        params.set('sort_by', 'popularity.desc');
        params.set('api_key', apiKey);

        if (type === 'movie') {
            params.set('region', 'us');
        } else {
            params.set('with_original_language', 'en');
            if (year) {
                params.set('first_air_date_year', year.toString());
            }
        }

        return `https://api.themoviedb.org/3/discover/${type}?${params.toString()}`;
    }

    private mergeById(primary: Title[], fallback: Title[], limit: number): Title[] {
        const seen = new Set(primary.map(title => title.id));
        const merged = [...primary];
        for (const title of fallback) {
            if (merged.length >= limit) {
                break;
            }
            if (!seen.has(title.id)) {
                seen.add(title.id);
                merged.push(title);
            }
        }
        return merged;
    }
}
