import { Component, OnInit } from '@angular/core';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss']
})
export class MoviesComponent {
  constructor(public ts: TitleService) { }
}
