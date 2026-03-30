import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';

interface SkillItem {
    name: string;
    level: number;
    label: string;
}

interface SkillGroup {
    title: string;
    skills: SkillItem[];
}

@Component({
    selector: 'app-skillbar',
    templateUrl: './skillbar.component.html',
    styleUrls: ['./skillbar.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class SkillbarComponent {
    skillGroups: SkillGroup[] = [
        {
            title: 'Frontend Engineering',
            skills: [
                {name: 'Angular', level: 92, label: 'Advanced'},
                {name: 'TypeScript', level: 92, label: 'Advanced'},
                {name: 'JavaScript', level: 88, label: 'Advanced'},
                {name: 'HTML/CSS/SCSS', level: 87, label: 'Strong'},
                {name: 'RxJS', level: 82, label: 'Strong'}
            ]
        },
        {
            title: 'Application & Data',
            skills: [
                {name: 'C# / .NET', level: 85, label: 'Strong'},
                {name: 'SQL', level: 84, label: 'Strong'},
                {name: 'Java', level: 82, label: 'Strong'},
                {name: 'API Integrations', level: 89, label: 'Advanced'},
                {name: 'Workflow Design', level: 91, label: 'Advanced'}
            ]
        },
        {
            title: 'Delivery & Leadership',
            skills: [
                {name: 'Feature Ownership', level: 90, label: 'Advanced'},
                {name: 'Technical Mentoring', level: 82, label: 'Strong'},
                {name: 'CI/CD Support', level: 76, label: 'Working'},
                {name: 'Cross-team Collaboration', level: 88, label: 'Advanced'},
                {name: 'Product Problem Solving', level: 90, label: 'Advanced'}
            ]
        }
    ];
}
