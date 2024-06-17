import { TestBed } from '@angular/core/testing';

import { PopularService } from './popular.service';

describe('PopularService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PopularService = TestBed.get(PopularService);
    expect(service).toBeTruthy();
  });
});
