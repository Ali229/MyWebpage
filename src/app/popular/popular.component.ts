import {Component, OnInit, Input} from '@angular/core';
import {HttpService} from '../services/http.service';

@Component({
  selector: 'app-popular',
  templateUrl: './popular.component.html',
  styleUrls: ['./popular.component.scss']
})
export class PopularComponent implements OnInit {
  popList = null;
  @Input() url: string;
  constructor(private httpService: HttpService) {
  }

  ngOnInit() {
    this.mostPopular();
  }

  mostPopular() {
    this.httpService.getData(this.url)
      .subscribe((response) => {
        this.popList = response;
      });
  }
}
