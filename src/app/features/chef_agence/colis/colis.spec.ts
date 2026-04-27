import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Colis } from './colis';

describe('Colis', () => {
  let component: Colis;
  let fixture: ComponentFixture<Colis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Colis],
    }).compileComponents();

    fixture = TestBed.createComponent(Colis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
