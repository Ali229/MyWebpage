import {inject, TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {BehaviorSubject} from 'rxjs';

import {AuthGuard} from './auth.guard';
import {AuthService} from './auth.service';

describe('AuthGuard', () => {
    let authStateReadySubject: BehaviorSubject<boolean>;
    let authServiceStub: { user: { uid: string | null }, authStateReady$: ReturnType<BehaviorSubject<boolean>['asObservable']> };
    let routerStub: { navigate: jasmine.Spy, createUrlTree: jasmine.Spy };

    beforeEach(() => {
        authStateReadySubject = new BehaviorSubject<boolean>(false);
        authServiceStub = {
            user: {uid: null},
            authStateReady$: authStateReadySubject.asObservable()
        };
        routerStub = {
            navigate: jasmine.createSpy('navigate'),
            createUrlTree: jasmine.createSpy('createUrlTree').and.callFake((commands: any[]) => ({commands}) as any)
        };

        TestBed.configureTestingModule({
            providers: [
                AuthGuard,
                {provide: AuthService, useValue: authServiceStub},
                {provide: Router, useValue: routerStub}
            ]
        });
    });

    it('should ...', inject([AuthGuard], (guard: AuthGuard) => {
        expect(guard).toBeTruthy();
    }));

    it('allows activation after auth state is restored with an authenticated user',
        inject([AuthGuard], (guard: AuthGuard) => {
            authServiceStub.user.uid = 'abc123';
            let result: boolean | object | undefined;
            (guard.canActivate({} as any, {} as any) as any).subscribe(value => result = value);
            authStateReadySubject.next(true);

            expect(result).toBeTrue();
        }));

    it('redirects to /movies after auth state is restored with no user',
        inject([AuthGuard, Router], (guard: AuthGuard, router: Router) => {
            let result: unknown;
            (guard.canActivate({} as any, {} as any) as any).subscribe(value => result = value);
            authStateReadySubject.next(true);

            expect(routerStub.createUrlTree).toHaveBeenCalledWith(['/movies']);
            expect(result).toEqual({commands: ['/movies']});
        }));
});
