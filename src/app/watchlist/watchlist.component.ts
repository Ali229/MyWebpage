import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from '../services/auth.service';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit {
  watchlist = [];
  uid: string;

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, public auth: AuthService) {
  }

  ngOnInit() {
    this.getWatchlist().then(result => {
      this.watchlist = result;
      console.log(this.watchlist);
    });
  }

  async getWatchlist() {
    const snapshot = await firebase.firestore().collection('/users/' + this.auth.uid + '/watchlist').get();
    return snapshot.docs.map(doc => doc.data());
  }
}
