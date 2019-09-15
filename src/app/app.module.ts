import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {MDBBootstrapModule} from 'angular-bootstrap-md';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {NavbarComponent} from './navbar/navbar.component';
import {HomeComponent} from './home/home.component';
import {ProjectsComponent} from './projects/projects.component';
import {EducationComponent} from './education/education.component';
import {EmploymentComponent} from './employment/employment.component';
import {ContactComponent} from './contact/contact.component';
import {SkillbarComponent} from './skillbar/skillbar.component';
import {MoviesComponent} from './movies/movies.component';
import {HttpClientModule} from '@angular/common/http';
import {HttpService} from './services/http.service';
import {FormsModule} from '@angular/forms';
import { PopularComponent } from './popular/popular.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    ProjectsComponent,
    EducationComponent,
    EmploymentComponent,
    ContactComponent,
    SkillbarComponent,
    MoviesComponent,
    PopularComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MDBBootstrapModule.forRoot(),
    FormsModule
  ],
  providers: [
    HttpService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
