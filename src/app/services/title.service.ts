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

  private movieSubject$: BehaviorSubject<Title> = new BehaviorSubject(null);
  movie$ = this.movieSubject$.asObservable();


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
    this.error = false;
    this.loading = true;
    this.http.get<Title>('https://api.themoviedb.org/3/' + type + '/' + id + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&language=en-US')
      .pipe(take(1)).subscribe(data => {
      this.movieSubject$.next(data);
      this.loading = false;
    });
  }

  // search(id) {
  //   this.movie = this.http
  //     .get<Movie>('https://api.themoviedb.org/3/movie/' + id + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&language=en-US')
  //     .map(res => this.movie = res);
  //   console.log(this.movie);
  // }

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
