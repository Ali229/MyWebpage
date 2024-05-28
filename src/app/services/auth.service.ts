import {Injectable} from '@angular/core';
import {User} from '../models/user.model';
import {auth} from 'firebase/app';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Observable, of} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {Title} from '../models/title.model';
import * as firebase from 'firebase';
import {ToastrService} from 'ngx-toastr';

@Injectable({providedIn: 'root'})
export class AuthService {

    user$: Observable<User>;
    uid: string;
    watchlist: Title[] = null;
    empty = false;
    moviesCount: number;
    tvCount: number;

    constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private toastr: ToastrService) {
        this.user$ = this.afAuth.authState.pipe(
            switchMap(user => {
                // Logged in
                if (user) {
                    this.uid = user.uid;
                    this.getWatchlist();
                    return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
                } else {
                    // Logged out
                    this.uid = 'nothing';
                    return of(null);
                }
            })
        );
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
        this.uid = 'nothing';
    }


    async getWatchlist() {
        this.watchlist = [];
        const snapshot: any = await firebase.firestore().collection('/users/' + this.uid + '/watchlist')
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

    async addToWatchlist(title) {
        if (this.uid !== 'nothing') {
            const titleName = title.title ? title.title : title.name;
            // First, check if the title already exists in the user's watchlist
            const watchlistRef = await firebase.firestore().collection('/users/' + this.uid + '/watchlist');
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
        if (this.uid !== 'nothing') {
            for (const title of this.watchlist) {
                const titleName = title.title ? title.title : title.name;
                if (title.id === id) {
                    // Check if the item exists in the watchlist
                    const watchlistRef = await firebase.firestore().collection('/users/' + this.uid + '/watchlist');
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
        if (this.uid !== 'nothing') {
            for (const item of this.watchlist) {
                if (item.id === id) {
                    return true;
                }
            }
        }
        return false;
    }

    async saveSettings(providers) {
        if (this.uid) {
            try {
                const streamsCollection = await firebase.firestore().collection(`/users/${this.uid}/streams`);

                // Iterate through each provider
                for (const provider of providers) {
                    const providerDoc = streamsCollection.doc(provider.id);

                    // Check if the provider is selected
                    if (provider.selected) {
                        // If selected, set the document with provider's name
                        await providerDoc.set({name: provider.name});
                    } else {
                        // If not selected, delete the document
                        await providerDoc.delete();
                    }
                }

                // Alert after all operations are done
                this.toastr.success('Settings saved successfully!');
            } catch (error) {
                this.toastr.error('Error saving settings: ', error);
            }
        } else {
            this.toastr.info('Please login to use the watchlist feature');
        }
    }

    async loadSettings(providers) {
        if (this.uid) {
            try {
                const streamsCollection = await firebase.firestore().collection(`/users/${this.uid}/streams`);
                const snapshot = await streamsCollection.get();

                // Iterate through each document in the collection
                snapshot.forEach(doc => {
                    const providerId = doc.id;
                    // Find the corresponding provider in the providers list
                    const providerIndex = providers.findIndex(provider => provider.id === providerId);

                    // If provider exists in the providers list
                    if (providerIndex !== -1) {
                        // Update the selected property based on the data retrieved from Firestore
                        providers[providerIndex].selected = true;
                    }
                });
            } catch (error) {
                this.toastr.error('Error saving settings: ', error);
            }
        } else {
            this.toastr.info('Please login to use the watchlist feature');
        }
    }
}
