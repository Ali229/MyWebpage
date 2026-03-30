import {TestBed} from '@angular/core/testing';
import {ToastrService} from 'ngx-toastr';

import {AuthService} from './auth.service';
import {createToastrServiceStub} from '../testing/test-stubs';

describe('AuthService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        providers: [
            {provide: ToastrService, useValue: createToastrServiceStub()}
        ]
    }));

    it('should be created', () => {
        const service: AuthService = TestBed.inject(AuthService);
        expect(service).toBeTruthy();
    });
});
