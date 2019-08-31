import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ProjectsComponent} from './projects/projects.component';
import {EmploymentComponent} from './employment/employment.component';
import {EducationComponent} from './education/education.component';
import {ContactComponent} from './contact/contact.component';
import {MoviesComponent} from './movies/movies.component';

const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'projects', component: ProjectsComponent},
  {path: 'employment', component: EmploymentComponent},
  {path: 'education', component: EducationComponent},
  {path: 'contact', component: ContactComponent},
  {path: 'movies', component: MoviesComponent},
  {path: '**', redirectTo: 'home'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
