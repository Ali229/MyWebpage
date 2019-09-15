import {Component, OnInit} from '@angular/core';
import {HttpService} from '../services/http.service';

@Component({
  selector: 'app-popular',
  templateUrl: './popular.component.html',
  styleUrls: ['./popular.component.scss']
})
export class PopularComponent implements OnInit {
  popList = null;

  constructor(private httpService: HttpService) {
  }

  ngOnInit() {
    this.mostPopular();
  }

  mostPopular() {
    this.httpService.getData('https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=e84ac8af3c49ad3253e0369ec64dfbff')
      .subscribe((response) => {
        this.popList = response;
      });
  }
}
