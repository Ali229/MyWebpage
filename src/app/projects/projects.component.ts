import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';

interface ProjectItem {
    title: string;
    stack: string;
    description: string;
    image?: string;
    imageAlt?: string;
    imageFit?: 'cover' | 'contain';
    link?: string;
    linkLabel?: string;
}

@Component({
    selector: 'app-projects',
    templateUrl: './projects.component.html',
    styleUrls: ['./projects.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class ProjectsComponent {
    projects: ProjectItem[] = [
        {
            title: 'Postit',
            stack: 'Angular, TypeScript, SCSS, HTML5',
            description: 'Designed and implemented a web platform for tax and accounting professionals to automate financial workflows including journalizing, posting, adjusting entries, and producing income statements.',
            image: './assets/postit.jpg',
            imageAlt: 'Postit project preview'
        },
        {
            title: 'WeTile',
            stack: 'Android, C#',
            description: 'Developed a weather app that uses OpenWeatherMap data and device GPS to surface current conditions, with widget functionality for both Android and Windows OS.',
            image: './assets/wetile.jpg',
            imageAlt: 'WeTile project preview',
            imageFit: 'contain',
            link: 'https://github.com/Ali229/WeTile',
            linkLabel: 'GitHub'
        },
        {
            title: 'ABDebatePRO',
            stack: 'Java',
            description: 'Implemented a Round Robin based debate scheduler for a school group project, helping automate event planning and assignment flow.',
            image: './assets/abdebatepro.jpg',
            imageAlt: 'ABDebatePRO project preview',
            link: 'https://github.com/Ali229/ABDebatePro',
            linkLabel: 'GitHub'
        },
        {
            title: 'Appetite',
            stack: 'Unity',
            description: 'Built a 2D mobile game using gyroscope-driven controls and gameplay interactions tuned for handheld devices.',
            image: './assets/appetite.jpg',
            imageAlt: 'Appetite project preview'
        },
        {
            title: 'ChatWare',
            stack: 'Java',
            description: 'Developed a social communication application using socket programming and JavaFX for the desktop client experience.',
            image: './assets/chatware.jpg',
            imageAlt: 'ChatWare project preview',
            imageFit: 'contain',
            link: 'https://github.com/Ali229/ChatWare',
            linkLabel: 'GitHub'
        },
        {
            title: 'Simple Flashlight',
            stack: 'Android',
            description: 'Developed and launched an Android flashlight application with widget support for faster device access.'
        }
    ];
}
