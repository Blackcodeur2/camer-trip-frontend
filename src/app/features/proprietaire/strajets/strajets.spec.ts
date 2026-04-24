import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Strajets } from './strajets';

describe('Strajets', () => {
  let component: Strajets;
  let fixture: ComponentFixture<Strajets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Strajets],
    }).compileComponents();

    fixture = TestBed.createComponent(Strajets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
