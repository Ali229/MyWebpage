import {Component, OnInit} from '@angular/core';
import {SkillbarComponent} from '../skillbar/skillbar.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [SkillbarComponent]
})
export class HomeComponent implements OnInit {

    constructor() {
    }

    ngOnInit() {
    }

}
