import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-back-button',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './back-button.component.html',
    styleUrls: ['./back-button.component.scss']
})
export class BackButtonComponent {
    @Input() to: string | readonly (string | number)[] = '/movies';
    @Input() label = 'Back';
    @Input() ariaLabel = 'Go back';
}
