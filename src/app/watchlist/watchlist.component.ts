import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from '../services/auth.service';
import * as firebase from 'firebase/app';
import {MdbTableDirective, MdbTablePaginationComponent} from 'angular-bootstrap-md';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit, AfterViewInit {
  @ViewChild(MdbTablePaginationComponent, { static: true }) mdbTablePagination: MdbTablePaginationComponent;
  @ViewChild(MdbTableDirective, { static: true }) mdbTable: MdbTableDirective;
  previous: any = [];
  headElements = ['Poster', 'Title', 'Type', 'Released', 'Rating', 'Comments'];
  watchlist = [];
  uid: string;

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, public auth: AuthService, private cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.getWatchlist().then(result => {
      this.watchlist = result;
      this.mdbTable.setDataSource(this.watchlist);
      this.watchlist = this.mdbTable.getDataSource();
      this.previous = this.mdbTable.getDataSource();
    });
  }

  ngAfterViewInit() {
    this.mdbTablePagination.setMaxVisibleItemsNumberTo(10);
    this.mdbTablePagination.calculateFirstItemIndex();
    this.mdbTablePagination.calculateLastItemIndex();
    this.cdRef.detectChanges();
  }

  async getWatchlist() {
    const snapshot = await firebase.firestore().collection('/users/' + this.auth.uid + '/watchlist').get();
    return snapshot.docs.map(doc => doc.data());
  }
}
