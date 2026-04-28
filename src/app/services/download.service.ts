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

@Injectable({providedIn: 'root'})
export class DownloadService {
    private readonly apiBaseUrl = environment.downloadApiBaseUrl.replace(/\/$/, '');

    constructor(private http: HttpClient) {
    }

    downloadTitle(title: Title, idToken: string): Promise<DownloadResponse> {
        const mediaType = title?.media_type;
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        const headers = new HttpHeaders({
            Authorization: `Bearer ${idToken}`
        });

        return this.http.post<DownloadResponse>(
            `${this.apiBaseUrl}/download/${endpoint}`,
            {
                tmdbId: title.id,
                quality: '1080p',
                searchNow: true
            },
            {headers}
        ).pipe(take(1)).toPromise();
    }
}
