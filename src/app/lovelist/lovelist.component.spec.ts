import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LovelistComponent} from './lovelist.component';

describe('LovelistComponent', () => {
    let component: LovelistComponent;
    let fixture: ComponentFixture<LovelistComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LovelistComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LovelistComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
