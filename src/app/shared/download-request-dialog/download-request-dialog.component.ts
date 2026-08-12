import {CommonModule} from '@angular/common';
import {Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ToastrService} from 'ngx-toastr';
import {Title} from '../../models/title.model';
import {AuthService} from '../../services/auth.service';
import {DownloadService} from '../../services/download.service';

@Component({
    selector: 'app-download-request-dialog',
    templateUrl: './download-request-dialog.component.html',
    standalone: true,
    imports: [CommonModule, FormsModule]
})
export class DownloadRequestDialogComponent implements OnChanges {
    @Input() title: Title;
    @Input() open = false;
    @Output() openChange = new EventEmitter<boolean>();
    @Output() tracked = new EventEmitter<Title>();

    requestActive = false;
    selectedQuality: '720p' | '1080p' | '4k' = '4k';
    selectedMovieMonitor = 'movieOnly';
    selectedTvMonitor = 'all';
    selectedTvSeason = 1;
    selectedTvStartEpisode = 1;
    selectedTvEndEpisode = 1;
    readonly qualityOptions = [
        {value: '4k', label: '4K'},
        {value: '1080p', label: '1080p'},
        {value: '720p', label: '720p'}
    ];
    readonly movieMonitorOptions = [
        {value: 'movieOnly', label: 'Movie Only'},
        {value: 'movieAndCollection', label: 'Movie & Collection'}
    ];
    readonly tvMonitorOptions = [
        {value: 'all', label: 'All Episodes'},
        {value: 'future', label: 'Future Episodes'},
        {value: 'pilot', label: 'Pilot Episode'},
        {value: 'firstSeason', label: 'First Season'},
        {value: 'lastSeason', label: 'Last Season'},
        {value: 'customRange', label: 'Custom Episode Range'}
    ];

    constructor(
        private auth: AuthService,
        private downloadService: DownloadService,
        private toastr: ToastrService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        const openChange = changes.open;
        if (openChange?.currentValue && !openChange.previousValue) {
            this.resetOptions();
        }
    }

    @HostListener('document:keydown.escape')
    onEscapeKey() {
        this.close();
    }

    private resetOptions() {
        this.selectedQuality = '4k';
        this.selectedMovieMonitor = 'movieOnly';
        this.selectedTvMonitor = 'all';
        this.selectedTvSeason = 1;
        this.selectedTvStartEpisode = 1;
        this.selectedTvEndEpisode = 1;
    }

    close() {
        if (!this.requestActive && this.open) {
            this.openChange.emit(false);
        }
    }

    async submit() {
        if (!this.title?.id || this.requestActive) {
            return;
        }

        this.requestActive = true;
        const titleName = this.title.title || this.title.name || 'Title';

        try {
            const idToken = await this.auth.getCurrentUserIdToken();
            if (!idToken) {
                this.toastr.info('Please login with the download-enabled account');
                return;
            }

            const response = await this.downloadService.downloadTitle(this.title, idToken, {
                quality: this.selectedQuality,
                monitor: this.isMovie() ? this.selectedMovieMonitor : this.selectedTvMonitor,
                episodeRange: this.getSelectedEpisodeRange()
            });
            this.downloadService.markTracked(this.title);
            this.tracked.emit(this.title);

            if (response.alreadyExists && !response.updated) {
                this.toastr.info(`${response.title || titleName} is already in your download app`);
            } else if (this.isMovie() && response.added && response.searchNow === false) {
                this.toastr.success('Added and monitored. Automatic searching will begin when Radarr considers the movie released.');
            } else {
                this.toastr.success(`${response.title || titleName} sent to download app`);
            }
            this.openChange.emit(false);
        } catch (error) {
            this.toastr.error(this.resolveDownloadError(error), 'Download request failed');
        } finally {
            this.requestActive = false;
        }
    }

    isMovie(): boolean {
        return this.title?.media_type === 'movie';
    }

    isCustomEpisodeRangeSelected(): boolean {
        return !this.isMovie() && this.selectedTvMonitor === 'customRange';
    }

    getDialogTitle(): string {
        return this.title?.title || this.title?.name || 'Download request';
    }

    private getSelectedEpisodeRange() {
        if (!this.isCustomEpisodeRangeSelected()) {
            return undefined;
        }

        return {
            seasonNumber: this.selectedTvSeason,
            startEpisode: this.selectedTvStartEpisode,
            endEpisode: this.selectedTvEndEpisode
        };
    }

    private resolveDownloadError(error: any): string {
        const serverError = error?.error?.error;
        if (typeof serverError === 'string' && serverError.trim()) {
            return serverError;
        }
        if (typeof error?.message === 'string' && error.message.trim()) {
            return error.message;
        }
        return 'Could not reach the download server.';
    }
}
