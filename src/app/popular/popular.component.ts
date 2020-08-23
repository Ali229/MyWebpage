import {Component, Input} from '@angular/core';
import {TitleService} from '../services/title.service';

@Component({
  selector: 'app-popular',
  templateUrl: './popular.component.html',
  styleUrls: ['./popular.component.scss']
})
export class PopularComponent {
  @Input() public popList: any;

  constructor(public ts: TitleService) {
  }
}
