import {Component, OnInit} from '@angular/core';
import {HttpService} from '../services/http.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss']
})

export class MoviesComponent implements OnInit {
  moviename = '';
  movieyear = '';
  data = null;
  metaColor = null;
  imdbColor = null;
  rottenColor = null;
  tmdbColor = null;
  rottenScore = null;
  rottenImage = null;
  totalScore = 0;
  scoreCount = 0;
  overallScore = 0;
  tmdbScore = 0;
  totalColor = null;
  loading = false;
  selectedOption = '';
  type = '';
  searchedTitle = '';
  posterURL = '';
  currentYear = new Date().getFullYear();
  popularYears: Map<string, boolean> = new Map([['0' + this.currentYear.toString(), true],
    ['1' + (this.currentYear - 1).toString(), false], ['2' + (this.currentYear - 2).toString(), false],
    ['3' + (this.currentYear - 3).toString(), false], ['4' + (this.currentYear - 4).toString(), false],
  ]);
  popularMovies = [];

  constructor(private httpService: HttpService, private afs: AngularFirestore, public auth: AuthService) {
    this.mostPopular(this.currentYear);
  }

  ngOnInit() {
  }

  mostPopular(year) {
    this.httpService.getData('https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc' + '' +
      '&api_key=e84ac8af3c49ad3253e0369ec64dfbff&primary_release_year=' + year.toString())
      .subscribe((response) => {
        this.popularMovies.push(response);
        if (year.toString() !== (this.currentYear - 4).toString()) {
          this.mostPopular(year - 1);
        }
      });
  }

  search(title, year, type) {
    this.loading = true;
    this.httpService.getData('https://www.omdbapi.com/?t=' + title + '&y=' + year + '&type=' + type + '&apikey=faec32e6')
      .subscribe((info) => {
        this.data = null, this.rottenScore = null;
        this.totalScore = 0, this.scoreCount = 0, this.overallScore = 0;
        this.data = info;
        this.posterURL = null;
        if (this.data.Response !== 'False') {
          if (this.data.Metascore !== 'N/A') {
            this.metaColor = this.getRatingColor(this.data.Metascore);
            this.totalScore += Number(this.data.Metascore);
            this.scoreCount++;
          }
          if (this.data.imdbRating !== 'N/A') {
            this.data.imdbRating = this.data.imdbRating * 10;
            this.imdbColor = this.getRatingColor(this.data.imdbRating);
            this.totalScore += Number(this.data.imdbRating);
            this.scoreCount++;
          }
          if (this.data.Ratings.length > 0) {
            for (const rating of this.data.Ratings) {
              if (rating.Source === 'Rotten Tomatoes') {
                this.rottenScore = Number(rating.Value.replace('%', ''));
                this.rottenColor = this.getRatingColor(this.rottenScore);
                if (this.rottenScore > 70) {
                  this.rottenImage = 'tomato_full.png';
                } else if (this.rottenScore >= 50) {
                  this.rottenImage = 'tomato_full.png';
                } else if (this.rottenScore < 50) {
                  this.rottenImage = 'tomato_rotten.png';
                }
                this.totalScore += Number(this.rottenScore);
                this.scoreCount++;
              }
            }
          }
          this.loadTMDBID(this.data.imdbID);
        } else {
          this.searchedTitle = title;
        }
      });
  }

  loadTMDBID(imdbID) {
    let url;
    this.httpService.getData('https://api.themoviedb.org/3/find/' +
      imdbID + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&external_source=imdb_id')

      .subscribe(response => {
        console.log(imdbID);
        let data: any;
        data = response;
        if (data.movie_results.length > 0) {
          url = 'https://api.themoviedb.org/3/movie/' + data.movie_results[0].id + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&append_to_response=videos';
          this.LoadTMDBDetails(url);
        } else if (data.tv_results.length > 0) {
          url = 'https://api.themoviedb.org/3/tv/' + data.tv_results[0].id + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&append_to_response=videos';
          this.LoadTMDBDetails(url);
        } else {
          if (this.data.Poster !== 'N/A') {
            this.posterURL = this.data.Poster;
          } else {
            this.posterURL = 'assets/404PosterNotFound.jpg';
          }
          this.loading = false;
          this.calculateOverallScore();
        }
      });
  }

  LoadTMDBDetails(url) {
    this.httpService.getData(url)
      .subscribe(response => {
        let data: any;
        data = response;

        this.posterURL = 'https://image.tmdb.org/t/p/w500/' + data.poster_path;

        this.tmdbScore = data.vote_average * 10;
        if (this.tmdbScore > 0) {
          this.tmdbColor = this.getRatingColor(this.tmdbScore);
          this.totalScore += Number(this.tmdbScore);
          this.scoreCount++;
        }
        this.calculateOverallScore();
        this.loading = false;
      });
  }

  calculateOverallScore() {
    this.overallScore = Math.round(this.totalScore / this.scoreCount);
    this.totalColor = this.getRatingColor(this.overallScore);
    this.data.overallScore = this.overallScore;
  }


  toggleYear(Key) {
    this.popularYears.forEach((value: boolean, key: string) => {
      if (key === Key) {
        this.popularYears.set(key, true);
      } else {
        this.popularYears.set(key, false);
      }
    });
  }

  scrollToElement(): void {
    const x = document.getElementById('target');
    x.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'end'});
  }

  addToWatchlist() {
    return this.afs.collection('/users/' + this.auth.uid + '/watchlist').add(this.data);
  }

  getRatingColor(rating) {
    if (rating > 70) {
      return 'success';
    } else if (rating >= 50) {
      return 'warning';
    } else if (rating < 50) {
      return 'danger';
    }
  }
}
