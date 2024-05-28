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
import {FormsModule} from '@angular/forms';
import {PopularComponent} from './popular/popular.component';
import {AngularFireModule} from '@angular/fire';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AngularFireAuthModule} from '@angular/fire/auth';
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

const config = {
    apiKey: 'AIzaSyD2Rtw1qMew1Tua80ZYBMilrUVSzypcJ6E',
    authDomain: 'movies-ec8a3.firebaseapp.com',
    databaseURL: 'https://movies-ec8a3.firebaseio.com',
    projectId: 'movies-ec8a3',
    storageBucket: 'movies-ec8a3.appspot.com',
    messagingSenderId: '932511714350',
    appId: '1:932511714350:web:7de03d075c18d6ad6923bf',
    measurementId: 'G-E9R6114SYD'
};

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
        PopularComponent,
        UserProfileComponent,
        WatchlistComponent,
        StreamComponent,
        PrivacyComponent,
        TitleComponent,
        SettingsComponent,
        LovelistComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        MDBBootstrapModule.forRoot(),
        FormsModule,
        AngularFireModule.initializeApp(config),
        AngularFirestoreModule,
        AngularFireAuthModule,
        CommonModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot()
    ],
    providers: [
        AuthService,
        TitleService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
