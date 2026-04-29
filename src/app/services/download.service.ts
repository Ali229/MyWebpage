import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {take} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {Title} from '../models/title.model';

export interface DownloadResponse {
    ok: boolean;
    added?: boolean;
    alreadyExists?: boolean;
    title?: string;
    error?: string;
}

export interface DownloadRequestOptions {
    quality: '720p' | '1080p' | '4k';
    monitor: string;
}

@Injectable({providedIn: 'root'})
export class DownloadService {
    private readonly apiBaseUrl = environment.downloadApiBaseUrl.replace(/\/$/, '');

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
                monitor: options.monitor
            },
            {headers}
        ).pipe(take(1)).toPromise();
    }
}
