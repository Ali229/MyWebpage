import {Component, OnInit} from '@angular/core';
import {TitleService} from '../services/title.service';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit {

  constructor(public auth: AuthService, public ts: TitleService) {
  }

  ngOnInit() {
  }
}
