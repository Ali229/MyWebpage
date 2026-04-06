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
    watchlist: Title[] = [];
    empty = false;
    watchlistLoaded = false;
    moviesCount = 0;
    tvCount = 0;
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
                this.watchlistLoaded = true;
                this.moviesCount = 0;
                this.tvCount = 0;
                this.empty = false;
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
            }
        } else {
            this.watchlist = [];
            this.moviesCount = 0;
            this.tvCount = 0;
            this.empty = false;
            this.watchlistLoaded = true;
        }
    }

    async addToWatchlist(title) {
        if (this.user.uid) {
            const titleName = title.title ? title.title : title.name;
            const watchlistDocId = this.getWatchlistDocId(title);
            const watchlistRef = doc(firestore, 'users', this.user.uid, 'watchlist', watchlistDocId);
            const existing = await getDoc(watchlistRef);
            if (!existing.exists()) {
                title.watchlistAddDate = new Date();
                title.watchlistDocId = watchlistDocId;
                await setDoc(watchlistRef, title);
                this.toastr.success(titleName + ' added to watchlist');
                return this.getWatchlist();
            } else {
                this.toastr.info(titleName + ' is already in your watchlist');
            }
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

            const watchlistRef = doc(
                firestore,
                'users',
                this.user.uid,
                'watchlist',
                title.watchlistDocId || this.getWatchlistDocId(title)
            );
            const existing = await getDoc(watchlistRef);

            if (existing.exists()) {
                await deleteDoc(watchlistRef);
                this.watchlist = this.watchlist.filter(item => item.id !== id);
                this.recalculateWatchlistMeta();
                this.toastr.success((title.title ? title.title : title.name) + ' removed from watchlist');
            } else {
                this.toastr.info((title.title ? title.title : title.name) + ' is not in your watchlist');
            }
        } else {
            this.toastr.info('Please login to use the watchlist feature');
        }
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
                this.toastr.success('Providers list saved successfully!');
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

    private getProviderIds(provider: { id: number; ids?: number[] }): number[] {
        return provider.ids && provider.ids.length ? provider.ids : [provider.id];
    }
}
