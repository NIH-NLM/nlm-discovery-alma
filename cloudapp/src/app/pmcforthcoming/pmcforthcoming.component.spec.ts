import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PmcforthcomingComponent } from './pmcforthcoming.component';

describe('PmcforthcomingComponent', () => {
  let component: PmcforthcomingComponent;
  let fixture: ComponentFixture<PmcforthcomingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PmcforthcomingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PmcforthcomingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
