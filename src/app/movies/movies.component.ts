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

  constructor(private httpService: HttpService) {
  }

  ngOnInit() {
  }

  search() {
    console.log(this.moviename);
    this.httpService.getData('http://www.omdbapi.com/?t=' + this.moviename + '&y=' + this.movieyear + '&apikey=faec32e6')
      .subscribe((info) => {
        console.log(info);
      });
  }
}
