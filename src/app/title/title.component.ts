import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from '../services/auth.service';
import {HttpClient} from '@angular/common/http';
import {Title} from '../models/title.model';
import {TitleService} from '../services/title.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ToastrService} from 'ngx-toastr';


@Component({
  selector: 'app-title',
  templateUrl: './title.component.html',
  styleUrls: ['./title.component.scss']
})
export class TitleComponent implements OnInit, OnDestroy {

  title: Title;
  private terminate$: Subject<Title> = new Subject();

  constructor(private http: HttpClient, private afs: AngularFirestore, public auth: AuthService,
              public ts: TitleService, private toastr: ToastrService) {
  }

  ngOnInit() {
    this.ts.title$.pipe(takeUntil(this.terminate$)).subscribe(data => this.title = data);
  }


  ngOnDestroy() {
    this.terminate$.next();
    this.terminate$.complete();
  }
}
