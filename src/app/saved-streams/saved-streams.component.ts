import {Component, Input, OnInit} from '@angular/core';
import {Title} from '../models/title.model';

@Component({
  selector: 'app-saved-streams',
  templateUrl: './saved-streams.component.html',
  styleUrls: ['./saved-streams.component.scss']
})
export class SavedStreamsComponent implements OnInit {
  @Input() public title: Title;

  constructor() {
  }

  ngOnInit() {
  }

}
