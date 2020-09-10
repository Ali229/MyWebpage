import {Component, OnDestroy, OnInit} from '@angular/core';
import {Title} from '../models/title.model';
import {Subject} from 'rxjs';
import {TitleService} from '../services/title.service';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-stream',
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.scss']
})
export class StreamComponent implements OnInit, OnDestroy {
  title: Title;
  private terminate$: Subject<Title> = new Subject();

  constructor(public ts: TitleService) {
  }

  ngOnInit() {
    this.ts.title$.pipe(takeUntil(this.terminate$)).subscribe(data => this.title = data);
  }

  ngOnDestroy() {
    this.terminate$.next();
    this.terminate$.complete();
  }
}
