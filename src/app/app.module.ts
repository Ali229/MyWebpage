import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
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
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {PopularComponent} from './popular/popular.component';
import {UserProfileComponent} from './user-profile/user-profile.component';
import {WatchlistComponent} from './watchlist/watchlist.component';
import {AuthService} from './services/auth.service';
import {StreamComponent} from './stream/stream.component';
import {PrivacyComponent} from './privacy/privacy.component';
import {TitleComponent} from './title/title.component';
import {TitleService} from './services/title.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ToastrModule} from 'ngx-toastr';
import {CommonModule} from '@angular/common';
import {SettingsComponent} from './settings/settings.component';
import {LovelistComponent} from './lovelist/lovelist.component';

@NgModule({ declarations: [
        AppComponent,
        NavbarComponent,
        HomeComponent,
        ProjectsComponent,
        EducationComponent,
        EmploymentComponent,
        ContactComponent,
        SkillbarComponent,
        MoviesComponent,
        PopularComponent,
        UserProfileComponent,
        WatchlistComponent,
        StreamComponent,
        PrivacyComponent,
        TitleComponent,
        SettingsComponent,
        LovelistComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        FormsModule,
        CommonModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot()], providers: [
        AuthService,
        TitleService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule {
}
