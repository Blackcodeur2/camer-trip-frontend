import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Agences } from './agences';

describe('Agences', () => {
  let component: Agences;
  let fixture: ComponentFixture<Agences>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Agences],
    }).compileComponents();

    fixture = TestBed.createComponent(Agences);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
