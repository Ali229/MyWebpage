import {Component, Input, OnInit} from '@angular/core';
import {TitleService} from '../services/title.service';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-popular',
  templateUrl: './popular.component.html',
  styleUrls: ['./popular.component.scss']
})
export class PopularComponent implements OnInit {
  currentYear = new Date().getFullYear().toString();
  popularYears: any[] = [];
  popularMovies: any = {};

  constructor(private http: HttpClient, public ts: TitleService) {
  }

  ngOnInit() {
    this.initializeYears();
    this.fetchMostPopular(this.currentYear);
  }

  initializeYears() {
    for (let i = 0; i < 5; i++) {
      const year = (parseInt(this.currentYear, 10) - i).toString();
      this.popularYears.push({year, index: i, isSelected: i === 0});
      this.popularMovies[year] = []; // Initialize movies array for each year
    }
  }

  toggleYear(selectedYear: string) {
    this.popularYears.forEach((yearData) => {
      yearData.isSelected = yearData.year === selectedYear;
    });

    if (this.popularMovies[selectedYear].length === 0) {
      this.fetchMostPopular(selectedYear);
    }
  }

  fetchMostPopular(year: string) {
    const apiKey = 'e84ac8af3c49ad3253e0369ec64dfbff';
    const apiUrl = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc` +
      `&api_key=${apiKey}&primary_release_year=${year}`;

    this.http.get(apiUrl).subscribe((response: any) => {
      this.popularMovies[year] = response;
    });
  }
  scrollToElement() {
    const target = document.getElementById('target');
    if (target) {
      target.scrollIntoView({behavior: 'smooth'});
    }
  }
}
