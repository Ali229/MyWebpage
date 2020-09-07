import {Component, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import * as firebase from 'firebase/app';
import {Title} from '../models/title.model';
import {TitleService} from '../services/title.service';
import {HttpClient} from '@angular/common/http';
import {AngularFirestore} from '@angular/fire/firestore';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit {
  watchlist: Title[] = [];
  doc1: any;
  doc2: any;
  empty = false;

  constructor(public auth: AuthService, private afs: AngularFirestore, public ts: TitleService) {
  }

  ngOnInit() {
    this.getWatchlist();
  }


  async getWatchlist() {
    this.watchlist = [];
    const snapshot: any = await firebase.firestore().collection('/users/' + this.auth.uid + '/watchlist')
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

  async removeFromWatchlist(id) {
    await this.afs.collection('/users/' + this.auth.uid + '/watchlist').doc(id).delete();
    return this.getWatchlist();
  }
}
