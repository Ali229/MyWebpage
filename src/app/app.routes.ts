import {Routes} from '@angular/router';
import {ContactComponent} from './contact/contact.component';
import {EducationComponent} from './education/education.component';
import {EmploymentComponent} from './employment/employment.component';
import {HomeComponent} from './home/home.component';
import {LovelistComponent} from './lovelist/lovelist.component';
import {MoviesComponent} from './movies/movies.component';
import {PrivacyComponent} from './privacy/privacy.component';
import {ProjectsComponent} from './projects/projects.component';
import {SettingsComponent} from './settings/settings.component';
import {AuthGuard} from './services/auth.guard';
import {WatchlistComponent} from './watchlist/watchlist.component';

export const routes: Routes = [
    {path: 'home', component: HomeComponent},
    {path: 'projects', component: ProjectsComponent},
    {path: 'employment', component: EmploymentComponent},
    {path: 'education', component: EducationComponent},
    {path: 'contact', component: ContactComponent},
    {path: 'movies', component: MoviesComponent},
    {path: 'watchlist', component: WatchlistComponent, canActivate: [AuthGuard]},
    {path: 'privacy', component: PrivacyComponent},
    {path: 'settings', component: SettingsComponent, canActivate: [AuthGuard]},
    {path: 'lovelist', component: LovelistComponent},
    {path: '**', redirectTo: 'home'}
];
