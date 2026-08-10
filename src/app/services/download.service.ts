import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {take} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {Title} from '../models/title.model';

export interface DownloadResponse {
    ok: boolean;
    added?: boolean;
    updated?: boolean;
    alreadyExists?: boolean;
    title?: string;
    error?: string;
}

export interface DownloadRequestOptions {
    quality: '720p' | '1080p' | '4k';
    monitor: string;
    episodeRange?: {
        seasonNumber: number;
        startEpisode: number;
        endEpisode: number;
    };
}

interface DownloadStatusResponse {
    ok: boolean;
    statuses: Array<{
        tmdbId: number;
        mediaType: 'movie' | 'tv';
        tracked: boolean;
    }>;
    error?: string;
}

@Injectable({providedIn: 'root'})
export class DownloadService {
    private readonly apiBaseUrl = environment.downloadApiBaseUrl.replace(/\/$/, '');
    private readonly trackedTitleKeys = new Set<string>();

    constructor(private http: HttpClient) {
    }

    downloadTitle(title: Title, idToken: string, options: DownloadRequestOptions): Promise<DownloadResponse> {
        const mediaType = title?.media_type;
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        const headers = new HttpHeaders({
            Authorization: `Bearer ${idToken}`
        });

        return this.http.post<DownloadResponse>(
            `${this.apiBaseUrl}/download/${endpoint}`,
            {
                tmdbId: title.id,
                quality: options.quality,
                monitor: options.monitor,
                episodeRange: options.episodeRange
            },
            {headers}
        ).pipe(take(1)).toPromise();
    }

    async checkTrackingStatus(titles: Title[], idToken: string): Promise<DownloadStatusResponse> {
        const statusTitles = titles
            .filter(title => !!title?.id && (title.media_type === 'movie' || title.media_type === 'tv'))
            .map(title => ({tmdbId: title.id, mediaType: title.media_type}));

        if (statusTitles.length === 0) {
            return {ok: true, statuses: []};
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${idToken}`
        });

        const statuses: DownloadStatusResponse['statuses'] = [];
        for (let index = 0; index < statusTitles.length; index += 200) {
            const response = await this.http.post<DownloadStatusResponse>(
                `${this.apiBaseUrl}/download/status`,
                {titles: statusTitles.slice(index, index + 200)},
                {headers}
            ).pipe(take(1)).toPromise();

            for (const status of response.statuses || []) {
                const key = this.getTitleKey(status.tmdbId, status.mediaType);
                if (status.tracked) {
                    this.trackedTitleKeys.add(key);
                } else {
                    this.trackedTitleKeys.delete(key);
                }
            }
            statuses.push(...(response.statuses || []));
        }

        return {ok: true, statuses};
    }

    isTracked(title: Title): boolean {
        return this.trackedTitleKeys.has(this.getTitleKey(title?.id, title?.media_type));
    }

    markTracked(title: Title) {
        const key = this.getTitleKey(title?.id, title?.media_type);
        if (key) {
            this.trackedTitleKeys.add(key);
        }
    }

    private getTitleKey(id: number, mediaType: string): string {
        if (!id || (mediaType !== 'movie' && mediaType !== 'tv')) {
            return '';
        }
        return `${mediaType}:${id}`;
    }
}
