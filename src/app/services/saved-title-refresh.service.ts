import {Injectable} from '@angular/core';
import {doc, runTransaction, Timestamp} from 'firebase/firestore';
import {Title} from '../models/title.model';
import {firestore} from '../firebase.config';
import {AuthService} from './auth.service';
import {TitleService} from './title.service';

type RefreshableMediaType = 'movie' | 'tv';

interface QueueItem {
    key: string;
    id: number;
    mediaType: RefreshableMediaType;
    sourceList: 'watchlist' | 'lovelist';
    priority: number;
}

interface RuntimeThrottleState {
    activeLeaseOwner?: string;
    activeLeaseExpiresAt?: Timestamp;
    lastBackgroundRefreshAt?: Timestamp;
    dailyWindowKey?: string;
    dailyRefreshCount?: number;
}

@Injectable({providedIn: 'root'})
export class SavedTitleRefreshService {
    private readonly globalThrottleRef = doc(firestore, 'runtime', 'savedTitleRefresh');
    private readonly ownerId = this.createOwnerId();
    private readonly minDelayBetweenCallsMs = 30 * 1000;
    private readonly leaseDurationMs = 2 * 60 * 1000;
    private readonly maxBackgroundCallsPerDay = 500;
    private readonly idleQueueRecheckMs = 5 * 60 * 1000;
    private active = false;
    private processing = false;
    private waitHandle: number | null = null;

    constructor(private auth: AuthService, private titleService: TitleService) {}

    start() {
        if (this.active) {
            return;
        }

        this.active = true;
        this.scheduleQueueRun(0);
    }

    stop() {
        this.active = false;
        this.clearWaitHandle();
    }

    private scheduleQueueRun(delayMs: number) {
        if (!this.active || this.waitHandle !== null) {
            return;
        }

        this.waitHandle = window.setTimeout(() => {
            this.waitHandle = null;
            void this.runQueue();
        }, delayMs);
    }

    private async runQueue() {
        if (!this.active || this.processing) {
            return;
        }

        if (!this.auth.user.uid) {
            this.scheduleQueueRun(2000);
            return;
        }

        if (!this.auth.watchlistLoaded || !this.auth.lovelistLoaded) {
            this.scheduleQueueRun(1000);
            return;
        }

        this.processing = true;
        try {
            const queue = this.buildQueue();
            this.logNextQueueItem(queue, 0);
            for (let index = 0; index < queue.length; index++) {
                const item = queue[index];
                if (!this.active || !this.isStillSaved(item)) {
                    this.logNextQueueItem(queue, index + 1);
                    continue;
                }

                const reserved = await this.reserveGlobalRefreshSlot();
                if (!reserved) {
                    this.scheduleQueueRun(this.minDelayBetweenCallsMs);
                    return;
                }

                try {
                    if (!this.isStillSaved(item)) {
                        this.logNextQueueItem(queue, index + 1);
                        continue;
                    }

                    const currentTitle = [...this.auth.watchlist, ...this.auth.lovelist].find(title =>
                        title.id === item.id && title.media_type === item.mediaType
                    ) || null;
                    const titleName = this.getLogTitleName(currentTitle, item);

                    const freshTitle = await this.titleService.fetchTmdbTitleDetails(item.id, item.mediaType);
                    if (this.active && this.isStillSaved(item)) {
                        const saved = await this.auth.updateSavedTitleFromTmdb(freshTitle);
                        if (saved) {
                            console.log(`Updated ${titleName}. Changed fields:`, this.getChangedFieldsForLog(currentTitle, freshTitle));
                        } else {
                            console.log(`Could not save ${titleName}; it may refresh again next run.`);
                        }
                    }
                } catch {
                    // Background refresh should never interrupt the page.
                } finally {
                    await this.releaseGlobalRefreshSlot();
                }

                this.logNextQueueItem(queue, index + 1);
                if (this.active) {
                    await this.wait(this.minDelayBetweenCallsMs);
                }
            }
        } finally {
            this.processing = false;
            if (this.active && this.waitHandle === null) {
                this.scheduleQueueRun(this.idleQueueRecheckMs);
            }
        }
    }

    private buildQueue(): QueueItem[] {
        const seen = new Set<string>();
        const queue: QueueItem[] = [];
        const savedGroups: Array<{sourceList: 'watchlist' | 'lovelist'; titles: Title[]}> = [
            {sourceList: 'watchlist', titles: this.auth.watchlist},
            {sourceList: 'lovelist', titles: this.auth.lovelist}
        ];

        for (const group of savedGroups) {
            for (const title of group.titles) {
                if (!this.isRefreshableTitle(title) || !this.shouldRefresh(title)) {
                    continue;
                }

                const key = this.getTitleKey(title);
                if (seen.has(key)) {
                    continue;
                }

                seen.add(key);
                queue.push({
                    key,
                    id: title.id,
                    mediaType: title.media_type,
                    sourceList: group.sourceList,
                    priority: this.getRefreshPriority(title)
                });
            }
        }

        return queue.sort((first, second) => first.priority - second.priority);
    }

    private shouldRefresh(title: Title): boolean {
        const lastUpdatedAt = this.toMillis(title.tmdbDataUpdatedAt);
        if (!lastUpdatedAt) {
            return true;
        }

        return Date.now() - lastUpdatedAt >= this.getRefreshIntervalMs(title);
    }

    private getRefreshIntervalMs(title: Title): number {
        const oneDay = 24 * 60 * 60 * 1000;
        const sevenDays = 7 * oneDay;
        const thirtyDays = 30 * oneDay;

        if (title.media_type === 'movie') {
            const releaseAt = this.toDateMillis(title.release_date);
            if (!releaseAt) {
                return sevenDays;
            }

            const ageMs = Date.now() - releaseAt;
            if (ageMs < 0) {
                return sevenDays;
            }

            return ageMs <= thirtyDays ? oneDay : thirtyDays;
        }

        const nextEpisodeAt = this.toDateMillis(title.next_episode_to_air?.air_date);
        if (nextEpisodeAt) {
            const daysUntilNextEpisode = (nextEpisodeAt - Date.now()) / (24 * 60 * 60 * 1000);
            if (daysUntilNextEpisode >= 0 && daysUntilNextEpisode <= 30) {
                return oneDay;
            }

            if (daysUntilNextEpisode > 30) {
                return sevenDays;
            }
        }

        return thirtyDays;
    }

    private getRefreshPriority(title: Title): number {
        if (title.media_type === 'tv') {
            const nextEpisodeAt = this.toDateMillis(title.next_episode_to_air?.air_date);
            if (nextEpisodeAt) {
                const daysUntilNextEpisode = (nextEpisodeAt - Date.now()) / (24 * 60 * 60 * 1000);
                if (daysUntilNextEpisode >= 0 && daysUntilNextEpisode <= 30) {
                    return 10;
                }
            }

            return 30;
        }

        const releaseAt = this.toDateMillis(title.release_date);
        if (!releaseAt) {
            return 40;
        }

        const ageMs = Date.now() - releaseAt;
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (ageMs >= 0 && ageMs <= thirtyDays) {
            return 20;
        }

        return 50;
    }

    private async reserveGlobalRefreshSlot(): Promise<boolean> {
        try {
            return await runTransaction(firestore, async transaction => {
                const snapshot = await transaction.get(this.globalThrottleRef);
                const state = snapshot.exists() ? snapshot.data() as RuntimeThrottleState : {};
                const now = Date.now();
                const dailyWindowKey = this.getDailyWindowKey();
                const leaseExpiresAt = this.toMillis(state.activeLeaseExpiresAt);
                const lastRefreshAt = this.toMillis(state.lastBackgroundRefreshAt);
                const currentDailyCount = state.dailyWindowKey === dailyWindowKey
                    ? Number(state.dailyRefreshCount || 0)
                    : 0;

                if (leaseExpiresAt && leaseExpiresAt > now && state.activeLeaseOwner !== this.ownerId) {
                    return false;
                }

                if (lastRefreshAt && now - lastRefreshAt < this.minDelayBetweenCallsMs) {
                    return false;
                }

                if (currentDailyCount >= this.maxBackgroundCallsPerDay) {
                    return false;
                }

                transaction.set(this.globalThrottleRef, {
                    activeLeaseOwner: this.ownerId,
                    activeLeaseExpiresAt: Timestamp.fromMillis(now + this.leaseDurationMs),
                    lastBackgroundRefreshAt: Timestamp.fromMillis(now),
                    dailyWindowKey,
                    dailyRefreshCount: currentDailyCount + 1
                }, {merge: true});

                return true;
            });
        } catch {
            return false;
        }
    }

    private async releaseGlobalRefreshSlot(): Promise<void> {
        try {
            await runTransaction(firestore, async transaction => {
                const snapshot = await transaction.get(this.globalThrottleRef);
                if (!snapshot.exists()) {
                    return;
                }

                const state = snapshot.data() as RuntimeThrottleState;
                if (state.activeLeaseOwner !== this.ownerId) {
                    return;
                }

                transaction.set(this.globalThrottleRef, {
                    activeLeaseOwner: '',
                    activeLeaseExpiresAt: Timestamp.fromMillis(0)
                }, {merge: true});
            });
        } catch {
            // A stale lease expires naturally.
        }
    }

    private isStillSaved(item: QueueItem): boolean {
        return this.auth.isTitleSaved({
            id: item.id,
            media_type: item.mediaType
        } as Title);
    }

    private logNextQueueItem(queue: QueueItem[], nextIndex: number) {
        const nextItem = queue.slice(nextIndex).find(item => this.isStillSaved(item));
        if (!nextItem) {
            return;
        }

        const nextTitle = [...this.auth.watchlist, ...this.auth.lovelist].find(title =>
            title.id === nextItem.id && title.media_type === nextItem.mediaType
        ) || null;

        console.log(`Next update: ${this.getLogTitleName(nextTitle, nextItem)} from ${nextItem.sourceList}.`);
    }

    private getLogTitleName(title: Title | null, item: QueueItem): string {
        return title?.title || title?.name || `${item.mediaType}:${item.id}`;
    }

    private getChangedFieldsForLog(previousTitle: Title | null, updatedTitle: Title): Record<string, {before: any; after: any}> | string {
        if (!previousTitle) {
            return 'Previous saved title data was unavailable in memory.';
        }

        const changedFields: Record<string, {before: any; after: any}> = {};
        const watchedFields = [
            'poster_path',
            'vote_average',
            'averageScore',
            'certification',
            'runtimeText',
            'release_date',
            'first_air_date',
            'number_of_seasons',
            'next_episode_to_air',
            'status',
            'trailer',
            'streams'
        ];

        for (const field of watchedFields) {
            const beforeValue = previousTitle[field];
            const afterValue = updatedTitle[field];
            if (JSON.stringify(beforeValue || null) !== JSON.stringify(afterValue || null)) {
                changedFields[field] = {
                    before: beforeValue,
                    after: afterValue
                };
            }
        }

        return Object.keys(changedFields).length > 0 ? changedFields : 'No watched fields changed.';
    }

    private isRefreshableTitle(title: Title): title is Title & {media_type: RefreshableMediaType} {
        return Number.isInteger(Number(title?.id)) && (title?.media_type === 'movie' || title?.media_type === 'tv');
    }

    private getTitleKey(title: Title): string {
        return `${title.media_type}:${title.id}`;
    }

    private toMillis(value: any): number {
        if (!value) {
            return 0;
        }

        if (value instanceof Timestamp) {
            return value.toMillis();
        }

        if (typeof value.toMillis === 'function') {
            return value.toMillis();
        }

        const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private toDateMillis(value: any): number {
        if (!value) {
            return 0;
        }

        const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private getDailyWindowKey(): string {
        return new Date().toISOString().slice(0, 10);
    }

    private wait(delayMs: number): Promise<void> {
        return new Promise(resolve => {
            window.setTimeout(resolve, delayMs);
        });
    }

    private clearWaitHandle() {
        if (this.waitHandle === null) {
            return;
        }

        window.clearTimeout(this.waitHandle);
        this.waitHandle = null;
    }

    private createOwnerId(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
}
