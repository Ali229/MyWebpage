import {Injectable} from '@angular/core';
import {User} from '../models/user.model';
import {auth} from 'firebase/app';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Title} from '../models/title.model';
import * as firebase from 'firebase';
import {ToastrService} from 'ngx-toastr';

@Injectable({providedIn: 'root'})
export class AuthService {
    watchlist: Title[] = null;
    empty = false;
    moviesCount: number;
    tvCount: number;
    settingsLoaded = false;
    public providers = [
        {id: 8, name: 'Netflix', icon: 'assets/netflix.svg', selected: false},
        {id: 337, name: 'Disney+', icon: 'assets/disney.webp', selected: false},
        {id: 15, name: 'Hulu', icon: 'assets/hulu.png', selected: false},
        {id: 9, name: 'Amazon Prime Video', icon: 'assets/prime.jpg', selected: false},
        {id: 188, name: 'Youtube', icon: 'assets/youtube.png', selected: false},
        {id: 350, name: 'Apple', icon: 'assets/apple.png', selected: false},
        {id: 299, name: 'Sling', icon: 'assets/sling.png', selected: false},
        {id: 387, name: 'Peacock', icon: 'assets/peacock.svg', selected: false},
    ];
    public user: User = {
        uid: null,
        displayName: '', email: '', myCustomData: '', photoURL: ''
    };
    public bShowStreamableCheckBox = false;
    public bShowStreamableOnly = false;

    constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private toastr: ToastrService) {
        console.log('auth cons ran');
        // Subscribe to authState once
        this.afAuth.authState.subscribe(user => {
            // Logged in
            if (user) {
                this.user = user;
                this.getWatchlist();
                this.loadSettings();
                this.loadStreamableOnlySetting();
                this.afs.doc<User>(`users/${user.uid}`).valueChanges().subscribe(userData => {
                    // handle user data changes if needed
                    console.log('User data:', userData);
                });
            } else {
                // Logged out
                this.user.uid = null;
            }
        });
    }

    async googleSignin() {
        const provider = new auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        const credential = await this.afAuth.signInWithPopup(provider);
        return this.updateUserData(credential.user);
    }

    private updateUserData(user) {
        // Sets user data to firestore on login
        const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);

        const data = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        };
        return userRef.set(data, {merge: true});

    }

    async signOut() {
        await this.afAuth.signOut();
        this.user.uid = null;
    }


    async getWatchlist() {
        if (this.user.uid) {
            console.log('getting watchlist');
            this.watchlist = [];
            const snapshot: any = await firebase.firestore().collection('/users/' + this.user.uid + '/watchlist')
                .orderBy('watchlistAddDate').get();
            let x = 0;
            this.moviesCount = 0;
            this.tvCount = 0;
            for (const i of snapshot.docs) {
                this.watchlist.push(i.data());
                this.watchlist[x].watchlistDocId = i.id;
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
        }
    }

    async addToWatchlist(title) {
        if (this.user.uid) {
            const titleName = title.title ? title.title : title.name;
            // First, check if the title already exists in the user's watchlist
            const watchlistRef = await firebase.firestore().collection('/users/' + this.user.uid + '/watchlist');
            const query = await watchlistRef.where('id', '==', title.id).get();
            if (query.empty) {
                // If the query result is empty, the title is not in the watchlist, so add it
                title.watchlistAddDate = new Date();
                await watchlistRef.add(title);
                this.toastr.success((titleName) + ' added to watchlist');
                return this.getWatchlist();
            } else {
                this.toastr.info((titleName) + ' is already in your watchlist');
            }
        } else {
            this.toastr.info('Please login to use the watchlist feature');
        }
    }


    async removeFromWatchlist(id) {
        if (this.user.uid) {
            for (const title of this.watchlist) {
                const titleName = title.title ? title.title : title.name;
                if (title.id === id) {
                    // Check if the item exists in the watchlist
                    const watchlistRef = await firebase.firestore().collection('/users/' + this.user.uid + '/watchlist');
                    const query = await watchlistRef.where('id', '==', title.id).get();

                    if (!query.empty) {
                        // If the query result is not empty, the item is in the watchlist, so remove it
                        await watchlistRef.doc(title.watchlistDocId).delete();
                        this.toastr.success((title.title ? title.title : title.name) + ' removed from watchlist');
                        return this.getWatchlist();
                    } else {
                        // If the query result is empty, show a message indicating that the item is not in the watchlist
                        this.toastr.info((title.title ? title.title : title.name) + ' is not in your watchlist');
                    }
                }
            }
        } else {
            this.toastr.info('Please login to use the watchlist feature');
        }
    }

    public getWatchlisted(id) {
        if (this.user.uid) {
            for (const item of this.watchlist) {
                if (item.id === id) {
                    return true;
                }
            }
        }
        return false;
    }

    async saveSettings() {
        if (this.user.uid) {
            try {
                const selectedProvidersCollectionRef = firebase.firestore().collection(`/users/${this.user.uid}/settings`);

                // Create an object containing providerIds
                const data = {
                    providerIds: this.providers
                        .filter(provider => provider.selected)
                        .map(provider => provider.id)
                };

                // Directly set the data in a document within the collection
                await selectedProvidersCollectionRef.doc('providerIds').set(data);

                // Alert after the operation is done
                this.toastr.success('Providers list saved successfully!');
            } catch (error) {
                this.toastr.error('Error saving providers list: ', error);
            }
        } else {
            this.toastr.info('Please login to use settings feature');
        }
    }

    async loadSettings() {
        if (this.user.uid) {
            this.settingsLoaded = false;
            try {
                const selectedProvidersCollectionRef = firebase.firestore().collection(`/users/${this.user.uid}/settings`);
                const doc = await selectedProvidersCollectionRef.doc('providerIds').get();

                if (doc.exists) {
                    const data = doc.data();
                    const selectedProviderIds = data ? data.providerIds || [] : [];
                    // Update the providers' selected status based on the retrieved data
                    this.providers.forEach(provider => {
                        provider.selected = selectedProviderIds.includes(provider.id);
                    });
                } else {
                    // If no document exists, make sure all providers are unselected
                    this.providers.forEach(provider => provider.selected = false);
                }
                this.settingsLoaded = true;
            } catch (error) {
                this.toastr.error('Error loading providers list: ', error);
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

                const settingsRef = firebase.firestore().collection(`/users/${this.user.uid}/settings`);
                const data = {
                    showStreamableOnly: StreamableOnly
                };
                await settingsRef.doc('showStreamableOnly').set(data);
            } catch (error) {
                this.toastr.error('Error saving streamable only settings', error);
            }
        } else {
            this.toastr.info('Please login to use streamable only settings');
        }
    }

    async loadStreamableOnlySetting() {
        if (this.user.uid) {
            try {
                const settingsRef = firebase.firestore().collection(`/users/${this.user.uid}/settings`);
                const doc = await settingsRef.doc('showStreamableOnly').get();

                if (doc.exists) {
                    this.bShowStreamableOnly = doc.data() ? doc.data().showStreamableOnly : false;
                }
                this.bShowStreamableCheckBox = true;
            } catch (error) {
                this.toastr.error('Error loading providers list: ', error);
            }
        } else {
            this.toastr.info('Please login to use steamable only settings');
        }
    }
}
