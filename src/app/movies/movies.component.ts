import {Component, OnInit} from '@angular/core';
import {HttpService} from '../services/http.service';

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
  rottenScore = null;
  rottenImage = null;
  totalScore = 0;
  scoreCount = 0;
  overallScore = 0;
  totalColor = null;
  loading = false;
  selectedOption = '';
  currentYear = new Date().getFullYear();
  popularYears: Map<string, boolean> = new Map([['0' + this.currentYear.toString(), true],
    ['1' + (this.currentYear - 1).toString(), false], ['2' + (this.currentYear - 2).toString(), false],
    ['3' + (this.currentYear - 3).toString(), false], ['4' + (this.currentYear - 4).toString(), false],
  ]);
  popularMovies = [];

  constructor(private httpService: HttpService) {
  }

  ngOnInit() {
    this.mostPopular(this.currentYear);
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

  search() {
    this.loading = true;
    this.httpService.getData('https://www.omdbapi.com/?t=' + this.moviename + '&y=' + this.movieyear + '&type=' + this.selectedOption + '&apikey=faec32e6')
      .subscribe((info) => {
        this.data = null;
        this.rottenScore = null;
        this.totalScore = 0;
        this.scoreCount = 0;
        this.overallScore = 0;
        this.data = info;
        if (this.data.Response !== 'False') {
          if (this.data.Metascore !== 'N/A') {
            if (this.data.Metascore > 70) {
              this.metaColor = 'success';
            } else if (this.data.Metascore >= 50) {
              this.metaColor = 'warning';
            } else if (this.data.Metascore < 50) {
              this.metaColor = 'danger';
            }
            this.totalScore += Number(this.data.Metascore);
            this.scoreCount++;
          }
          if (this.data.imdbRating !== 'N/A') {
            this.data.imdbRating = this.data.imdbRating * 10;
            if (this.data.imdbRating > 70) {
              this.imdbColor = 'success';
            } else if (this.data.imdbRating >= 50) {
              this.imdbColor = 'warning';
            } else if (this.data.imdbRating < 50) {
              this.imdbColor = 'danger';
            }
            this.totalScore += Number(this.data.imdbRating);
            this.scoreCount++;
          }
          if (this.data.Ratings.length > 0) {
            // tslint:disable-next-line:prefer-for-of
            for (let x = 0; x < this.data.Ratings.length; x++) {
              if (this.data.Ratings[x].Source === 'Rotten Tomatoes') {
                this.rottenScore = Number(this.data.Ratings[x].Value.replace('%', ''));
                if (this.rottenScore > 70) {
                  this.rottenImage = 'tomato_full.png';
                  this.rottenColor = 'success';
                } else if (this.rottenScore >= 50) {
                  this.rottenImage = 'tomato_full.png';
                  this.rottenColor = 'warning';
                } else if (this.rottenScore < 50) {
                  this.rottenImage = 'tomato_rotten.png';
                  this.rottenColor = 'danger';
                }
                this.totalScore += Number(this.rottenScore);
                this.scoreCount++;
              }
            }
          }
          // tslint:disable-next-line:radix
          this.overallScore = parseInt((this.totalScore / this.scoreCount).toFixed(2));
          if (this.overallScore > 70) {
            this.totalColor = 'success';
          } else if (this.overallScore >= 50) {
            this.totalColor = 'warning';
          } else if (this.overallScore < 50) {
            this.totalColor = 'danger';
          }
        }
        this.loading = false;
      });
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
}
