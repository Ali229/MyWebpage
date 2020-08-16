import {Component, OnInit} from '@angular/core';
import {HttpService} from '../services/http.service';

@Component({
  selector: 'app-stream',
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.scss']
})
export class StreamComponent implements OnInit {

  constructor(private httpService: HttpService) {
  }

  ngOnInit() {
    const body = {
      content_types: null,
      presentation_types: null,
      providers: null,
      genres: null,
      languages: null,
      release_year_from: 2016,
      release_year_until: 2019,
      monetization_types: ['flatrate'],
      min_price: null,
      max_price: null,
      scoring_filter_types: null,
      cinema_release: null,
      query: 'scary stories to tell in the dark',
      page: null,
      page_size: 1
    };
    //
    // this.httpService.postData('https://apis.justwatch.com/content/titles/en_US/popular', body)
    //   .subscribe((response) => {
    //     console.log(response);
    //   });
  }
}
