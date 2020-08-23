import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Title} from '../models/title.model';
import {BehaviorSubject} from 'rxjs';
import {take} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  loading = false;
  selectedOption = '';
  type = '';
  title: string;
  year: number;
  error: boolean;
  errorTitle: string;

  constructor(private http: HttpClient) {
  }

  private titleSubject$: BehaviorSubject<Title> = new BehaviorSubject(null);
  title$ = this.titleSubject$.asObservable();

  multiSearch() {
    this.loading = true;
    this.error = false;
    this.http.get('https://api.themoviedb.org/3/search/multi?api_key=e84ac8af3c49ad3253e0369ec64dfbff&query=' + this.title + '&page=1')
      .subscribe((response: any) => {
        if (response.total_results > 0) {
          for (const result of response.results) {
            if (result.media_type !== 'person') {
              return this.search(result.id, result.media_type);
            }
          }
        } else {
          this.loading = false;
          this.error = true;
          this.errorTitle = this.title;
        }
      });
    return;
  }

  search(id, type) {
    this.loading = true;
    this.error = false;
    this.http.get<Title>('https://api.themoviedb.org/3/' + type + '/' + id + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&append_to_response=videos,external_ids')
      .pipe(take(1)).subscribe(data => {
      this.titleSubject$.next(data);
      this.searchOMDBRatings(data);
      this.loading = false;
    });
  }

  searchOMDBRatings(data) {
    this.http.get('http://www.omdbapi.com/?apikey=faec32e6&type=&i=' + data.external_ids.imdb_id)
      .subscribe((response: any) => {
        data.totalScore = 0;
        data.averageScore = 0;
        data.scoreCount = 0;
        for (const rating of response.Ratings) {
          if (rating.Source === 'Internet Movie Database') {
            data.imdbScore = parseFloat(rating.Value) * 10;
            data.totalScore += data.imdbScore;
            data.scoreCount++;
          } else if (rating.Source === 'Rotten Tomatoes') {
            data.rottenScore = parseFloat(rating.Value.replace('%', ''));
            data.totalScore += data.rottenScore;
            data.scoreCount++;
            if (data.rottenScore >= 50) {
              data.rottenImage = 'tomato_full.png';
            } else if (data.rottenScore < 50) {
              data.rottenImage = 'tomato_rotten.png';
            }
          } else if (rating.Source === 'Metacritic') {
            data.metaScore = parseFloat(rating.Value);
            data.totalScore += data.metaScore;
            data.scoreCount++;
          }
        }
        if (data.vote_average) {
          data.totalScore += data.vote_average * 10;
          data.scoreCount++;
        }
        data.averageScore = Math.round(data.totalScore / data.scoreCount);
        if (response.Poster !== 'N/A') {
          data.omdbPoster = response.Poster;
        }
        this.titleSubject$.next(data);
      });
  }

  getRatingColor(rating) {
    if (rating > 70) {
      return 'success';
    } else if (rating >= 50) {
      return 'warning';
    } else if (rating < 50) {
      return 'danger';
    }
  }
}
