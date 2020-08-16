import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient) {
  }

  getData(url) {
    return this.http.get(url);
  }

  postData(url, body) {
   return this.http.post(url, body);
  }
}
