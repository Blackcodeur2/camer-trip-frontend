import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gerants } from './gerants';

describe('Gerants', () => {
  let component: Gerants;
  let fixture: ComponentFixture<Gerants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gerants],
    }).compileComponents();

    fixture = TestBed.createComponent(Gerants);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
