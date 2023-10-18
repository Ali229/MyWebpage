import { Component, OnInit } from '@angular/core';
import { TitleService } from '../services/title.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss']
})
export class MoviesComponent implements OnInit {
  currentYear = new Date().getFullYear();
  popularYears: any[] = [];
  popularMovies: any[] = [];

  constructor(private http: HttpClient, public ts: TitleService) { }

  ngOnInit() {
    this.initializeYears();
    this.fetchMostPopular(this.currentYear);
  }

  initializeYears() {
    for (let i = 0; i < 5; i++) {
      const year = (this.currentYear - i).toString();
      this.popularYears.push({ year, index: i, isSelected: i === 0 });
    }
  }


  fetchMostPopular(year: number) {
    const apiKey = 'e84ac8af3c49ad3253e0369ec64dfbff';
    const apiUrl = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc` +
      `&api_key=${apiKey}&primary_release_year=${year}`;

    this.http.get(apiUrl).subscribe((response: any) => {
      this.popularMovies.push(response);
      if (year > this.currentYear - 4) {
        this.fetchMostPopular(year - 1);
      }
    });
  }

  toggleYear(selectedYear: string) {
    this.popularYears.forEach(yearData => {
      yearData.isSelected = yearData.year === selectedYear;
    });
  }

  scrollToElement() {
    const target = document.getElementById('target');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
