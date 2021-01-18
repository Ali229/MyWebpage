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
          return of(null);
        }
      })
    );
  }

  async googleSignin() {
    const provider = new auth.GoogleAuthProvider();
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
    this.uid = null;
  }


  async getWatchlist() {
    this.watchlist = [];
    const snapshot: any = await firebase.firestore().collection('/users/' + this.uid + '/watchlist')
      .orderBy('watchlistAddDate').get();
    let x = 0;
    for (const i of snapshot.docs) {
      this.watchlist.push(i.data());
      this.watchlist[x].watchlistDocId = i.id;
      x++;
    }
    if (this.watchlist.length === 0) {
      this.empty = true;
    }
  }

  async addToWatchlist(title) {
    if (this.uid) {
      title.watchlistAddDate = new Date();
      await this.afs.collection('/users/' + this.uid + '/watchlist').add(title);
      this.toastr.success((title.title ? title.title : title.name) + ' added to watchlist');
      return this.getWatchlist();
    } else {
      this.toastr.info('Please login to use watchlist feature');
    }
  }

  async removeFromWatchlist(id) {
    for (const item of this.watchlist) {
      if (item.id === id) {
        await this.afs.collection('/users/' + this.uid + '/watchlist').doc(item.watchlistDocId).delete();
        this.toastr.success((item.title ? item.title : item.name) + ' removed from watchlist');
        return this.getWatchlist();
      }
    }
  }

  public getWatchlisted(id) {
    if (this.uid) {
      for (const item of this.watchlist) {
        if (item.id === id) {
          return true;
        }
      }
    }
    return false;
  }
}
