import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut} from 'firebase/auth';
import {collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc} from 'firebase/firestore';
import {User} from '../models/user.model';
import {Title} from '../models/title.model';
import {firebaseAuth, firestore} from '../firebase.config';

@Injectable({providedIn: 'root'})
export class AuthService {
    private readonly downloadAdminEmail = 'mairaandali@gmail.com';
    watchlist: Title[] = [];
    lovelist: Title[] = [];
    empty = false;
    lovelistEmpty = false;
    watchlistLoaded = false;
    lovelistLoaded = false;
    moviesCount = 0;
    tvCount = 0;
    lovelistMoviesCount = 0;
    lovelistTvCount = 0;
    settingsLoaded = false;
    public providers = [
        {id: 8, name: 'Netflix', icon: 'assets/netflix.svg', selected: false},
        {id: 337, name: 'Disney+', icon: 'assets/disney.webp', selected: false},
        {id: 15, name: 'Hulu', icon: 'assets/hulu.svg', selected: false},
        {id: 9, name: 'Amazon Prime Video', icon: 'assets/prime.svg', selected: false},
        {id: 188, name: 'YouTube Premium', icon: 'assets/youtube.svg', selected: false},
        {id: 350, name: 'Apple', icon: 'assets/apple.svg', selected: false},
        {id: 386, name: 'Peacock', icon: 'assets/peacock.svg', selected: false},
        {id: 1899, name: 'Max', icon: 'assets/max.webp', selected: false},
        {id: 2303, name: 'Paramount+', icon: 'assets/paramount-plus.svg', selected: false},
        {id: 43, name: 'STARZ', icon: 'assets/starz.svg', selected: false},
        {id: 526, name: 'AMC+', icon: 'assets/amc-plus.png', selected: false},
        {id: 34, name: 'MGM+', icon: 'assets/mgm-plus.svg', selected: false},
    ];
    public user: User = {
        uid: null,
        displayName: '', email: '', myCustomData: '', photoURL: ''
    };
    public bShowStreamableOnly = false;
    private authStateReadySubject = new BehaviorSubject<boolean>(false);
    public authStateReady$ = this.authStateReadySubject.asObservable();
    private _bShowStreamableCheckBox = new BehaviorSubject<boolean>(false);
    public bShowStreamableCheckbox$ = this._bShowStreamableCheckBox.asObservable();
    private watchlistChangedSubject = new BehaviorSubject<number>(0);
    public watchlistChanged$ = this.watchlistChangedSubject.asObservable();

    constructor(private toastr: ToastrService) {
        onAuthStateChanged(firebaseAuth, user => {
            if (user) {
                this.user = {
                    uid: user.uid,
                    displayName: user.displayName || '',
                    email: user.email || '',
                    myCustomData: '',
                    photoURL: user.photoURL || ''
                };
                this.getWatchlist();
                this.getLovelist();
                Promise.all([
                    this.loadSettings(),
                    this.loadStreamableOnlySetting()
                ]).finally(() => {
                    this._bShowStreamableCheckBox.next(true);
                });
            } else {
                this.user = {
                    uid: null,
                    displayName: '',
                    email: '',
                    myCustomData: '',
                    photoURL: ''
                };
                this.watchlist = [];
                this.lovelist = [];
                this.watchlistLoaded = true;
                this.lovelistLoaded = true;
                this.moviesCount = 0;
                this.tvCount = 0;
                this.lovelistMoviesCount = 0;
                this.lovelistTvCount = 0;
                this.empty = false;
                this.lovelistEmpty = false;
                this.emitWatchlistChanged();
                this._bShowStreamableCheckBox.next(true);
            }
            this.authStateReadySubject.next(true);
        });
    }

    async googleSignin() {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        const credential = await signInWithPopup(firebaseAuth, provider);
        await this.updateUserData(credential.user);
        location.reload();
        return credential;
    }

    private updateUserData(user) {
        const data = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        };
        return setDoc(doc(firestore, 'users', user.uid), data, {merge: true});
    }

    async signOutUser() {
        await signOut(firebaseAuth);
    }

    async signOut() {
        await this.signOutUser();
        this.user = {
            uid: null,
            displayName: '',
            email: '',
            myCustomData: '',
            photoURL: ''
        };
        location.reload();
    }

    async getWatchlist() {
        this.watchlistLoaded = false;
        if (this.user.uid) {
            try {
                this.watchlist = [];
                this.empty = false;
                const watchlistQuery = query(
                    collection(firestore, 'users', this.user.uid, 'watchlist'),
                    orderBy('watchlistAddDate')
                );
                const snapshot = await getDocs(watchlistQuery);
                let x = 0;
                this.moviesCount = 0;
                this.tvCount = 0;
                for (const item of snapshot.docs) {
                    this.watchlist.push(item.data() as Title);
                    this.watchlist[x].watchlistDocId = item.id;
                    if (this.watchlist[x].media_type === 'movie') {
                        this.moviesCount++;
                    } else if (this.watchlist[x].media_type === 'tv') {
                        this.tvCount++;
                    }
                    x++;
                }
                if (this.watchlist.length === 0) {
                    this.empty = true;
                }
            } finally {
                this.watchlistLoaded = true;
                this.emitWatchlistChanged();
            }
        } else {
            this.watchlist = [];
            this.moviesCount = 0;
            this.tvCount = 0;
            this.empty = false;
            this.watchlistLoaded = true;
            this.emitWatchlistChanged();
        }
    }

    async addToWatchlist(title) {
        if (this.user.uid) {
            const titleName = this.getTitleName(title);
            const added = await this.addToWatchlistQuiet(title);
            this.toastr[added ? 'success' : 'info'](
                added ? titleName + ' added to watchlist' : titleName + ' is already in your watchlist'
            );
        } else {
            this.toastr.info('Please login to use the watchlist feature');
        }
    }

    async removeFromWatchlist(id) {
        if (this.user.uid) {
            const title = this.watchlist.find(item => item.id === id);
            if (!title) {
                return;
            }

            const titleName = this.getTitleName(title);
            const removed = await this.removeFromWatchlistQuiet(id);
            this.toastr[removed ? 'success' : 'info'](
                removed ? titleName + ' removed from watchlist' : titleName + ' was already removed from your watchlist'
            );
        } else {
            this.toastr.info('Please login to use the watchlist feature');
        }
    }

    async moveToWatchlist(title: Title) {
        if (!this.user.uid) {
            this.toastr.info('Please login to use saved title features');
            return;
        }

        const titleName = this.getTitleName(title);
        await this.removeFromLovelistQuiet(title.id);
        await this.addToWatchlistQuiet(title);
        this.toastr.success(titleName + ' moved to watchlist');
    }

    async getLovelist() {
        this.lovelistLoaded = false;
        if (this.user.uid) {
            try {
                this.lovelist = [];
                this.lovelistEmpty = false;
                const lovelistQuery = query(
                    collection(firestore, 'users', this.user.uid, 'lovelist'),
                    orderBy('lovelistAddDate')
                );
                const snapshot = await getDocs(lovelistQuery);
                let x = 0;
                this.lovelistMoviesCount = 0;
                this.lovelistTvCount = 0;
                for (const item of snapshot.docs) {
                    this.lovelist.push(item.data() as Title);
                    this.lovelist[x].lovelistDocId = item.id;
                    if (this.lovelist[x].media_type === 'movie') {
                        this.lovelistMoviesCount++;
                    } else if (this.lovelist[x].media_type === 'tv') {
                        this.lovelistTvCount++;
                    }
                    x++;
                }
                if (this.lovelist.length === 0) {
                    this.lovelistEmpty = true;
                }
            } finally {
                this.lovelistLoaded = true;
            }
        } else {
            this.lovelist = [];
            this.lovelistMoviesCount = 0;
            this.lovelistTvCount = 0;
            this.lovelistEmpty = false;
            this.lovelistLoaded = true;
        }
    }

    async addToLovelist(title) {
        if (this.user.uid) {
            const titleName = this.getTitleName(title);
            const added = await this.addToLovelistQuiet(title);
            this.toastr[added ? 'success' : 'info'](
                added ? titleName + ' added to lovelist' : titleName + ' is already in your lovelist'
            );
        } else {
            this.toastr.info('Please login to use the lovelist feature');
        }
    }

    async moveToLovelist(title: Title) {
        if (!this.user.uid) {
            this.toastr.info('Please login to use saved title features');
            return;
        }

        const titleName = this.getTitleName(title);
        await this.removeFromWatchlistQuiet(title.id);
        await this.addToLovelistQuiet(title);
        this.toastr.success(titleName + ' moved to lovelist');
    }

    async removeFromLovelist(id) {
        if (this.user.uid) {
            const title = this.lovelist.find(item => item.id === id);
            if (!title) {
                return;
            }

            const titleName = this.getTitleName(title);
            const removed = await this.removeFromLovelistQuiet(id);
            this.toastr[removed ? 'success' : 'info'](
                removed ? titleName + ' removed from lovelist' : titleName + ' was already removed from your lovelist'
            );
        } else {
            this.toastr.info('Please login to use the lovelist feature');
        }
    }

    public getLoved(id) {
        if (this.user.uid && this.lovelist) {
            for (const item of this.lovelist) {
                if (item.id === id) {
                    return true;
                }
            }
        }
        return false;
    }

    get lovelistIds(): Set<number> {
        return new Set(this.lovelist.map(title => title.id));
    }

    get watchlistIds(): Set<number> {
        return new Set(this.watchlist.map(title => title.id));
    }

    canUseDownloadButton(): boolean {
        return this.user.email?.toLowerCase() === this.downloadAdminEmail;
    }

    async getCurrentUserIdToken(): Promise<string | null> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser || currentUser.email?.toLowerCase() !== this.downloadAdminEmail) {
            return null;
        }

        return currentUser.getIdToken();
    }

    public getWatchlisted(id) {
        if (this.user.uid && this.watchlist) {
            for (const item of this.watchlist) {
                if (item.id === id) {
                    return true;
                }
            }
        }
        return false;
    }

    async saveSettings(): Promise<boolean> {
        if (this.user.uid) {
            try {
                const selectedProviderIds = Array.from(new Set(
                    this.providers
                        .filter(provider => provider.selected)
                        .flatMap(provider => this.getProviderIds(provider))
                ));
                const data = {
                    providerIds: selectedProviderIds
                };

                await setDoc(doc(firestore, 'users', this.user.uid, 'settings', 'providerIds'), data);
                this.toastr.success('Providers updated');
                return true;
            } catch (error) {
                this.toastr.error(String(error), 'Error saving providers list');
                return false;
            }
        } else {
            this.toastr.info('Please login to use settings feature');
            return false;
        }
    }

    async loadSettings() {
        if (this.user.uid) {
            this.settingsLoaded = false;
            try {
                const settingsDoc = await getDoc(doc(firestore, 'users', this.user.uid, 'settings', 'providerIds'));

                if (settingsDoc.exists()) {
                    const data = settingsDoc.data();
                    const selectedProviderIds = data ? data.providerIds || [] : [];
                    this.providers.forEach(provider => {
                        provider.selected = this.getProviderIds(provider).some(providerId => selectedProviderIds.includes(providerId));
                    });
                } else {
                    this.providers.forEach(provider => provider.selected = false);
                }
            } catch (error) {
                this.toastr.error(String(error), 'Error loading providers list');
            } finally {
                this.settingsLoaded = true;
            }
        } else {
            this.toastr.info('Please login to use the settings feature');
        }
    }

    async saveStreamableOnlySetting(StreamableOnly: boolean) {
        if (this.user.uid) {
            try {
                const data = {
                    showStreamableOnly: StreamableOnly
                };
                await setDoc(doc(firestore, 'users', this.user.uid, 'settings', 'showStreamableOnly'), data);
                this.bShowStreamableOnly = StreamableOnly;
                this._bShowStreamableCheckBox.next(true);
            } catch (error) {
                this.toastr.error(String(error), 'Error saving streamable only settings');
            }
        } else {
            this.toastr.info('Please login to use streamable only settings');
        }
    }

    async loadStreamableOnlySetting() {
        if (this.user.uid) {
            try {
                const streamableDoc = await getDoc(doc(firestore, 'users', this.user.uid, 'settings', 'showStreamableOnly'));

                if (streamableDoc.exists()) {
                    const data = streamableDoc.data();
                    this.bShowStreamableOnly = data ? data.showStreamableOnly : false;
                }
            } catch (error) {
                this.toastr.error(String(error), 'Error loading providers list');
            }
        } else {
            this.toastr.info('Please login to use steamable only settings');
        }
    }

    private getWatchlistDocId(title: Title) {
        return this.getSavedTitleDocId(title);
    }

    private async addToWatchlistQuiet(title: Title): Promise<boolean> {
        const watchlistDocId = this.getWatchlistDocId(title);
        const watchlistRef = doc(firestore, 'users', this.user.uid, 'watchlist', watchlistDocId);
        const existing = await getDoc(watchlistRef);
        if (existing.exists()) {
            return false;
        }

        title.watchlistAddDate = new Date();
        title.watchlistDocId = watchlistDocId;
        await setDoc(watchlistRef, title);
        if (!this.watchlist.some(item => item.id === title.id)) {
            this.watchlist.push(title);
        }
        this.recalculateWatchlistMeta();
        this.emitWatchlistChanged();
        return true;
    }

    private async removeFromWatchlistQuiet(id: number): Promise<boolean> {
        const title = this.watchlist.find(item => item.id === id);
        if (!title) {
            return false;
        }

        const watchlistRef = doc(
            firestore,
            'users',
            this.user.uid,
            'watchlist',
            title.watchlistDocId || this.getWatchlistDocId(title)
        );
        const existing = await getDoc(watchlistRef);
        await deleteDoc(watchlistRef);

        this.watchlist = this.watchlist.filter(item => item.id !== id);
        this.recalculateWatchlistMeta();
        this.emitWatchlistChanged();
        return existing.exists();
    }

    private async addToLovelistQuiet(title: Title): Promise<boolean> {
        const lovelistDocId = this.getSavedTitleDocId(title);
        const lovelistRef = doc(firestore, 'users', this.user.uid, 'lovelist', lovelistDocId);
        const existing = await getDoc(lovelistRef);
        if (existing.exists()) {
            return false;
        }

        title.lovelistAddDate = new Date();
        title.lovelistDocId = lovelistDocId;
        await setDoc(lovelistRef, title);
        if (!this.lovelist.some(item => item.id === title.id)) {
            this.lovelist.push(title);
        }
        this.recalculateLovelistMeta();
        return true;
    }

    private async removeFromLovelistQuiet(id: number): Promise<boolean> {
        const title = this.lovelist.find(item => item.id === id);
        if (!title) {
            return false;
        }

        const lovelistRef = doc(
            firestore,
            'users',
            this.user.uid,
            'lovelist',
            title.lovelistDocId || this.getSavedTitleDocId(title)
        );
        const existing = await getDoc(lovelistRef);
        await deleteDoc(lovelistRef);

        this.lovelist = this.lovelist.filter(item => item.id !== id);
        this.recalculateLovelistMeta();
        return existing.exists();
    }

    private getTitleName(title: Title): string {
        return title.title || title.name || 'Title';
    }

    private getSavedTitleDocId(title: Title) {
        return `${title.media_type || 'title'}_${title.id}`;
    }

    private recalculateWatchlistMeta() {
        this.moviesCount = 0;
        this.tvCount = 0;
        for (const item of this.watchlist) {
            if (item.media_type === 'movie') {
                this.moviesCount++;
            } else if (item.media_type === 'tv') {
                this.tvCount++;
            }
        }
        this.empty = this.watchlist.length === 0;
    }

    private recalculateLovelistMeta() {
        this.lovelistMoviesCount = 0;
        this.lovelistTvCount = 0;
        for (const item of this.lovelist) {
            if (item.media_type === 'movie') {
                this.lovelistMoviesCount++;
            } else if (item.media_type === 'tv') {
                this.lovelistTvCount++;
            }
        }
        this.lovelistEmpty = this.lovelist.length === 0;
    }

    private emitWatchlistChanged() {
        this.watchlistChangedSubject.next(this.watchlistChangedSubject.value + 1);
    }

    private getProviderIds(provider: { id: number; ids?: number[] }): number[] {
        return provider.ids && provider.ids.length ? provider.ids : [provider.id];
    }
}
