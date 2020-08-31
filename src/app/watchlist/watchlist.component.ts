import {Component, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import * as firebase from 'firebase/app';
import {Title} from '../models/title.model';
import {TitleService} from '../services/title.service';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit {
  watchlist: Title[] = [];

  constructor(public auth: AuthService, public ts: TitleService) {
  }

  ngOnInit() {
    this.getWatchlist().then(result => {
      result.forEach((index: Title) => {
        this.watchlist.push(index);
      });
    });
  }

  async getWatchlist() {
    const snapshot = await firebase.firestore().collection('/users/' + this.auth.uid + '/watchlist')
      .orderBy('watchlistAddDate').get();
    return snapshot.docs.map(doc => doc.data());
  }
}
