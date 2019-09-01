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

  constructor(private httpService: HttpService) {
  }

  ngOnInit() {
  }

  search() {
    this.loading = true;
    this.httpService.getData('http://www.omdbapi.com/?t=' + this.moviename + '&y=' + this.movieyear + '&apikey=faec32e6')
      .subscribe((info) => {
        this.rottenScore = null;
        this.totalScore = 0;
        this.scoreCount = 0;
        this.overallScore = 0;
        this.data = info;
        if (this.data.Metascore !== 'N/A') {
          if (this.data.Metascore > 79) {
            this.metaColor = 'success';
          } else if (this.data.Metascore > 49) {
            this.metaColor = 'warning';
          } else if (this.data.Metascore <= 49) {
            this.metaColor = 'danger';
          }
          this.totalScore += Number(this.data.Metascore);
          this.scoreCount++;
        }
        if (this.data.imdbRating !== 'N/A') {
          this.data.imdbRating = this.data.imdbRating * 10;
          if (this.data.imdbRating > 79) {
            this.imdbColor = 'success';
          } else if (this.data.imdbRating > 49) {
            this.imdbColor = 'warning';
          } else if (this.data.imdbRating <= 49) {
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
              if (this.rottenScore > 79) {
                this.rottenImage = 'tomato_full.png';
                this.rottenColor = 'success';
              } else if (this.rottenScore > 49) {
                this.rottenImage = 'tomato_full.png';
                this.rottenColor = 'warning';
              } else if (this.rottenScore <= 49) {
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
        if (this.overallScore > 79) {
          this.totalColor = 'success';
        } else if (this.overallScore > 49) {
          this.totalColor = 'warning';
        } else if (this.overallScore <= 49) {
          this.totalColor = 'danger';
        }
        this.loading = false;
      });
  }
}
