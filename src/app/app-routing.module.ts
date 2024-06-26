import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ProjectsComponent} from './projects/projects.component';
import {EmploymentComponent} from './employment/employment.component';
import {EducationComponent} from './education/education.component';
import {ContactComponent} from './contact/contact.component';
import {MoviesComponent} from './movies/movies.component';
import {WatchlistComponent} from './watchlist/watchlist.component';
import {AuthGuard} from './services/auth.guard';
import {PrivacyComponent} from './privacy/privacy.component';
import {SettingsComponent} from './settings/settings.component';
import {LovelistComponent} from './lovelist/lovelist.component';

const routes: Routes = [
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

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
