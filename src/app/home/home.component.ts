import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SkillbarComponent} from '../skillbar/skillbar.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [CommonModule, SkillbarComponent]
})
export class HomeComponent {
    highlights = [
        'Angular + TypeScript',
        'Workflow-heavy product development',
        'Full-stack feature delivery',
        'Technical mentoring'
    ];
}
