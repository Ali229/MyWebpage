import {Component, OnInit, Input, AfterViewInit} from '@angular/core';
import {HttpService} from '../services/http.service';

@Component({
  selector: 'app-popular',
  templateUrl: './popular.component.html',
  styleUrls: ['./popular.component.scss']
})
export class PopularComponent  {
  @Input() popList: string;
}
