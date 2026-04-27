import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Personnels } from './personnels';

describe('Personnels', () => {
  let component: Personnels;
  let fixture: ComponentFixture<Personnels>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Personnels],
    }).compileComponents();

    fixture = TestBed.createComponent(Personnels);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
