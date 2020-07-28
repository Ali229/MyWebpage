import {Component, OnInit} from '@angular/core';
import {WatchList} from '../services/watchlist.model';
import {Observable, of} from 'rxjs';
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
  watchlist: Observable<WatchList>;
  uid: string;

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, public auth: AuthService) {
  }

  ngOnInit() {
    console.log(this.getMarkers());
  }

  async getMarkers() {
    const markers = [];
    await firebase.firestore().collection('/users/' + this.auth.uid + '/watchlist').get()
      .then(querySnapshot => {
        querySnapshot.docs.forEach(doc => {
          markers.push(doc.data());
        });
      });
    return markers;
  }

}
