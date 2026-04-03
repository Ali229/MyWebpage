import {Component, OnInit} from '@angular/core';
import {BackButtonComponent} from '../shared/back-button/back-button.component';

@Component({
    selector: 'app-lovelist',
    templateUrl: './lovelist.component.html',
    styleUrls: ['./lovelist.component.scss'],
    standalone: true,
    imports: [BackButtonComponent]
})
export class LovelistComponent implements OnInit {

    constructor() {
    }

    ngOnInit() {
    }

}
