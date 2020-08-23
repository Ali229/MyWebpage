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

  movie: Title;
  private terminate$: Subject<Title> = new Subject();

  constructor(private http: HttpClient, private afs: AngularFirestore, public auth: AuthService, public ts: TitleService) {
  }

  ngOnInit() {
    this.ts.movie$.pipe(takeUntil(this.terminate$)).subscribe(data => this.movie = data);
  }


  ngOnDestroy() {
    this.terminate$.next();
    this.terminate$.complete();
  }

  addToWatchlist() {
    return this.afs.collection('/users/' + this.auth.uid + '/watchlist').add(this.movie);
  }

  getRuntime() {
    if (this.movie.runtime > 60) {
      return (this.movie.runtime - this.movie.runtime % 60) / 60 + 'h ' + this.movie.runtime % 60 + 'min';
    } else {
      return this.movie.runtime + 'min';
    }
  }


  getLanguage() {
    const languages: Language[] = languagesData;
    for (const language of languages) {
      if (language.iso_639_1 === this.movie.original_language) {
        return language.english_name;
      }
    }
  }

  //
  // search(title, year, type) {
  //   this.loading = true;
  //   this.httpService.getData('https://www.omdbapi.com/?t=' + title + '&y=' + year + '&type=' + type + '&apikey=faec32e6')
  //     .subscribe((info) => {
  //       this.data = null, this.rottenScore = null;
  //       this.totalScore = 0, this.scoreCount = 0, this.overallScore = 0;
  //       this.data = info;
  //       this.posterURL = null;
  //       if (this.data.Response !== 'False') {
  //         if (this.data.Metascore !== 'N/A') {
  //           this.metaColor = this.getRatingColor(this.data.Metascore);
  //           this.totalScore += Number(this.data.Metascore);
  //           this.scoreCount++;
  //         }
  //         if (this.data.imdbRating !== 'N/A') {
  //           this.data.imdbRating = this.data.imdbRating * 10;
  //           this.imdbColor = this.getRatingColor(this.data.imdbRating);
  //           this.totalScore += Number(this.data.imdbRating);
  //           this.scoreCount++;
  //         }
  //         if (this.data.Ratings.length > 0) {
  //           for (const rating of this.data.Ratings) {
  //             if (rating.Source === 'Rotten Tomatoes') {
  //               this.rottenScore = Number(rating.Value.replace('%', ''));
  //               this.rottenColor = this.getRatingColor(this.rottenScore);
  //               if (this.rottenScore > 70) {
  //                 this.rottenImage = 'tomato_full.png';
  //               } else if (this.rottenScore >= 50) {
  //                 this.rottenImage = 'tomato_full.png';
  //               } else if (this.rottenScore < 50) {
  //                 this.rottenImage = 'tomato_rotten.png';
  //               }
  //               this.totalScore += Number(this.rottenScore);
  //               this.scoreCount++;
  //             }
  //           }
  //         }
  //         this.loadTMDBID(this.data.imdbID);
  //       } else {
  //         this.searchedTitle = title;
  //         this.loading = false;
  //       }
  //
  //     });
  // }
  //
  // loadTMDBID(imdbID) {
  //   let url;
  //   this.httpService.getData('https://api.themoviedb.org/3/find/' +
  //     imdbID + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&external_source=imdb_id')
  //     .subscribe(response => {
  //       let data: any;
  //       data = response;
  //       if (data.movie_results.length > 0 && data.movie_results[0].poster_path !== undefined) {
  //         url = 'https://api.themoviedb.org/3/movie/' + data.movie_results[0].id + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&append_to_response=videos';
  //         this.LoadTMDBDetails(url);
  //       } else if (data.tv_results.length > 0 && data.tv_results[0].poster_path !== undefined) {
  //         url = 'https://api.themoviedb.org/3/tv/' + data.tv_results[0].id + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&append_to_response=videos';
  //         this.LoadTMDBDetails(url);
  //       } else {
  //         if (this.data.Poster !== 'N/A') {
  //           this.posterURL = this.data.Poster;
  //         } else {
  //           this.posterURL = 'assets/404PosterNotFound.jpg';
  //         }
  //         this.calculateOverallScore();
  //       }
  //     });
  // }
  //
  // LoadTMDBDetails(url) {
  //   this.httpService.getData(url)
  //     .subscribe(response => {
  //       let data: any;
  //       data = response;
  //
  //       this.posterURL = 'https://image.tmdb.org/t/p/w500/' + data.poster_path;
  //
  //       this.tmdbScore = data.vote_average * 10;
  //       if (this.tmdbScore > 0) {
  //         this.tmdbColor = this.getRatingColor(this.tmdbScore);
  //         this.totalScore += Number(this.tmdbScore);
  //         this.scoreCount++;
  //       }
  //       this.calculateOverallScore();
  //     });
  // }
  //
  // calculateOverallScore() {
  //   this.overallScore = Math.round(this.totalScore / this.scoreCount);
  //   this.totalColor = this.getRatingColor(this.overallScore);
  //   this.data.overallScore = this.overallScore;
  //   this.loading = false;
  // }
}
