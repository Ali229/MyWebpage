import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Title} from '../models/title.model';
import {BehaviorSubject} from 'rxjs';
import {take} from 'rxjs/operators';
import languagesData from '../../assets/languages.json';

interface Language {
  'iso_639_1': string;
  'english_name': string;
  'name': string;
}

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  loading = false;
  selectedOption = '';
  type = '';
  title: string;
  year: string;
  error: boolean;
  errorTitle: string;
  languages: Language[];

  constructor(private http: HttpClient) {
    this.languages = languagesData;
  }

  private titleSubject$: BehaviorSubject<Title> = new BehaviorSubject(null);
  title$ = this.titleSubject$.asObservable();

  multiSearch() {
    this.loading = true;
    this.error = false;
    this.http.get('https://api.themoviedb.org/3/search/multi?api_key=e84ac8af3c49ad3253e0369ec64dfbff&query=' + this.title)
      .subscribe((response: any) => {
        for (const result of response.results) {
          if (result.media_type !== 'person' &&
            (this.selectedOption ? result.media_type === this.selectedOption : true) &&
            (this.year ? this.year === new Date(result.release_date).getFullYear().toString() : true)
          ) {
            console.log(typeof this.year, typeof new Date(result.release_date).getFullYear());
            return this.search(result.id, result.media_type);
          }
        }
        this.loading = false;
        this.error = true;
        return this.errorTitle = this.title;
      });
  }

  search(id, type) {
    this.loading = true;
    this.error = false;
    this.http.get<Title>('https://api.themoviedb.org/3/' + type + '/' + id + '?api_key=e84ac8af3c49ad3253e0369ec64dfbff&append_to_response=videos,external_ids,release_dates,content_ratings')
      .pipe(take(1)).subscribe(data => {
      data.certification = this.getCertification(data, type);
      data.trailer = this.getTrailer(data);
      data.language = this.getLanguage(data);
      data.runtimeText = this.getRuntime(data);
      this.titleSubject$.next(data);
      this.searchOMDBRatings(data);
      this.loading = false;
    });
  }

  searchOMDBRatings(data) {
    if (data.external_ids.imdb_id) {
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
          if (response.Awards !== 'N/A') {
            data.awards = response.Awards;
          }
          this.titleSubject$.next(data);
        });
    }
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

  getCertification(data, type) {
    if (type === 'movie') {
      for (const certification of data.release_dates.results) {
        if (certification.iso_3166_1 === 'US') {
          return certification.release_dates[0].certification;
        }
      }
    } else {
      for (const certification of data.content_ratings.results) {
        if (certification.iso_3166_1 === 'US') {
          return certification.rating;
        }
      }
    }
  }

  getTrailer(data) {
    let secondaryVideo;
    for (const video of data.videos.results) {
      secondaryVideo = 'https://www.youtube.com/watch?v=' + video.key;
      if (video.name.toLowerCase().includes('trailer')) {
        return 'https://www.youtube.com/watch?v=' + video.key;
      }
    }
    if (secondaryVideo) {
      return secondaryVideo;
    }
    return 'https://www.youtube.com/results?search_query=' + (data.title ? data.title : data.name) + ' Trailer';
  }

  getLanguage(data) {
    for (const language of this.languages) {
      if (language.iso_639_1 === data.original_language) {
        return language.english_name;
      }
    }
  }

  getRuntime(data) {
    if (data.runtime > 60) {
      return (data.runtime - data.runtime % 60) / 60 + 'h ' + data.runtime % 60 + 'min';
    } else {
      return data.runtime + 'min';
    }
  }
}
