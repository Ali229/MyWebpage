import { Injectable } from '@angular/core';
import {Title} from '../models/title.model';

@Injectable({
  providedIn: 'root'
})
export class PopularService {
  public popularList: Title[] = [];
  public popularMovies: Title[] = [];
  public popularTVShows: Title[] = [];
  selectedType = 'movie';
  constructor() { }
}
