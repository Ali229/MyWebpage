import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Title} from '../models/title.model';
import {TitleService} from '../services/title.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';


@Component({
  selector: 'app-title',
  templateUrl: './title.component.html',
  styleUrls: ['./title.component.scss']
})
export class TitleComponent implements OnInit, OnDestroy {

  title: Title;
  private terminate$: Subject<Title> = new Subject();

  constructor(public auth: AuthService, public ts: TitleService) {
  }

  ngOnInit() {
    this.ts.title$.pipe(takeUntil(this.terminate$)).subscribe(data => this.title = data);
  }


  ngOnDestroy() {
    this.terminate$.next();
    this.terminate$.complete();
  }
}
