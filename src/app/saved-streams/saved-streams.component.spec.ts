import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedStreamsComponent } from './saved-streams.component';

describe('SavedStreamsComponent', () => {
  let component: SavedStreamsComponent;
  let fixture: ComponentFixture<SavedStreamsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SavedStreamsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SavedStreamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
