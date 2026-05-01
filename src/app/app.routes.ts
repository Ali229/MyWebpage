import {Routes} from '@angular/router';
import {AuthGuard} from './services/auth.guard';

export const routes: Routes = [
    {path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)},
    {path: 'projects', loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent)},
    {path: 'employment', loadComponent: () => import('./employment/employment.component').then(m => m.EmploymentComponent)},
    {path: 'education', loadComponent: () => import('./education/education.component').then(m => m.EducationComponent)},
    {path: 'contact', loadComponent: () => import('./contact/contact.component').then(m => m.ContactComponent)},
    {path: 'movies', loadComponent: () => import('./movies/movies.component').then(m => m.MoviesComponent)},
    {
        path: 'watchlist',
        loadComponent: () => import('./watchlist/watchlist.component').then(m => m.WatchlistComponent),
        canActivate: [AuthGuard]
    },
    {path: 'privacy', loadComponent: () => import('./privacy/privacy.component').then(m => m.PrivacyComponent)},
    {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'lovelist',
        loadComponent: () => import('./lovelist/lovelist.component').then(m => m.LovelistComponent),
        canActivate: [AuthGuard]
    },
    {path: '**', redirectTo: 'home'}
];
