import {Component, Input, OnDestroy, OnInit} from '@angular/core';
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
    @Input() public incomingTitle: Title;
    @Input() imgWidth = '55px';
    @Input() imgHeight = '55px';

    title: Title;
    private terminate$: Subject<Title> = new Subject();

    constructor(public ts: TitleService) {
    }

    ngOnInit() {
        if (this.incomingTitle) {
            this.title = this.incomingTitle;
        } else {
            this.ts.title$.pipe(takeUntil(this.terminate$)).subscribe(data => this.title = data);
        }
    }

    ngOnDestroy() {
        this.terminate$.next();
        this.terminate$.complete();
    }
}
