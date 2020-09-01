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
    // this.getWatchlist().then(result => {
    //   // console.log(result);
    //   //   result.forEach((index: Title) => {
    //   //     this.watchlist.push(index);
    //   //   });
    //   // });
    // });
    this.getWatchlist();
    console.log('hello');
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
    console.log(this.watchlist);

    // snapshot.docs.forEach((index: any) => {
    //   this.watchlist.push(index.data());
    //   console.log(index.data());
    // });


    // console.log(snapshot);
    // snapshot.docs.map(doc => this.doc1 = doc.id);
    // snapshot.docs.map(doc => this.doc2 = doc.data());
    // console.log(1, this.doc1);
    // console.log(2, this.doc2);

  }

  async removeFromWatchlist(id) {
    await this.afs.collection('/users/' + this.auth.uid + '/watchlist').doc(id).delete();
    return this.getWatchlist();
  }
}
