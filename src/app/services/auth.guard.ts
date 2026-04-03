import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthService} from './auth.service';
import {filter, map, take} from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard  {
    constructor(private auth: AuthService, private router: Router) {
    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        return this.auth.authStateReady$.pipe(
            filter(isReady => isReady),
            take(1),
            map(() => this.auth.user && this.auth.user.uid ? true : this.router.createUrlTree(['/movies']))
        );
    }
}
