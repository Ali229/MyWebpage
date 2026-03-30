import {inject, TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';

import {AuthGuard} from './auth.guard';
import {AuthService} from './auth.service';

describe('AuthGuard', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AuthGuard,
                {provide: AuthService, useValue: {user: {uid: null}}},
                {provide: Router, useValue: {navigate: jasmine.createSpy('navigate')}}
            ]
        });
    });

    it('should ...', inject([AuthGuard], (guard: AuthGuard) => {
        expect(guard).toBeTruthy();
    }));
});
