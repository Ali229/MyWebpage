import {Component} from '@angular/core';
import {TitleService} from '../services/title.service';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss']
})

export class MoviesComponent {

  currentYear = new Date().getFullYear();
  popularYears: any = new Map([['0' + this.currentYear.toString(), true],
    ['1' + (this.currentYear - 1).toString(), false], ['2' + (this.currentYear - 2).toString(), false],
    ['3' + (this.currentYear - 3).toString(), false], ['4' + (this.currentYear - 4).toString(), false],
  ]);
  popularMovies = [];

  constructor(private http: HttpClient, public ts: TitleService) {
    this.mostPopular(this.currentYear);
  }

  mostPopular(year) {
    this.http.get('https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc' + '' +
      '&api_key=e84ac8af3c49ad3253e0369ec64dfbff&primary_release_year=' + year.toString())
      .subscribe((response) => {
        this.popularMovies.push(response);
        if (year.toString() !== (this.currentYear - 4).toString()) {
          this.mostPopular(year - 1);
        }
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

  scrollToElement() {
    const x = document.getElementById('target');
    x.scrollIntoView({behavior: 'smooth'});
  }
}
