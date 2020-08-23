import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from '../services/auth.service';
import {HttpClient} from '@angular/common/http';
import {Title} from '../models/title.model';
import {TitleService} from '../services/title.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import languagesData from '../../assets/languages.json';

interface Language {
  'iso_639_1': string;
  'english_name': string;
  'name': string;
}

@Component({
  selector: 'app-title',
  templateUrl: './title.component.html',
  styleUrls: ['./title.component.scss']
})
export class TitleComponent implements OnInit, OnDestroy {

  title: Title;
  private terminate$: Subject<Title> = new Subject();
  languages: Language[];

  constructor(private http: HttpClient, private afs: AngularFirestore, public auth: AuthService, public ts: TitleService) {
  }

  ngOnInit() {
    this.ts.title$.pipe(takeUntil(this.terminate$)).subscribe(data => this.title = data);
    this.languages = languagesData;
  }


  ngOnDestroy() {
    this.terminate$.next();
    this.terminate$.complete();
  }

  addToWatchlist() {
    return this.afs.collection('/users/' + this.auth.uid + '/watchlist').add(this.title);
  }

  getRuntime() {
    if (this.title.runtime > 60) {
      return (this.title.runtime - this.title.runtime % 60) / 60 + 'h ' + this.title.runtime % 60 + 'min';
    } else {
      return this.title.runtime + 'min';
    }
  }


  getLanguage() {
    for (const language of this.languages) {
      if (language.iso_639_1 === this.title.original_language) {
        return language.english_name;
      }
    }
  }
}
