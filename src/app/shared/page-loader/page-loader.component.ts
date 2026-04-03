import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'app-page-loader',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './page-loader.component.html',
    styleUrls: ['./page-loader.component.scss']
})
export class PageLoaderComponent {
    @Input() minHeight = '320px';
    @Input() spinnerSize = '4.25rem';
}
