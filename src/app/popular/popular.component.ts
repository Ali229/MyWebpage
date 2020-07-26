import {Component, Input} from '@angular/core';
import {MoviesComponent} from '../movies/movies.component';

@Component({
  selector: 'app-popular',
  templateUrl: './popular.component.html',
  styleUrls: ['./popular.component.scss']
})
export class PopularComponent {
  @Input() popList: string;

  constructor(
    private mc: MoviesComponent
  ) {}

  pSearch(title, year, tmdbScore) {
    this.mc.search(title, year, tmdbScore, 'movie');
  }
}
