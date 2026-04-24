import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProprietaireLayout } from './proprietaire-layout';

describe('ProprietaireLayout', () => {
  let component: ProprietaireLayout;
  let fixture: ComponentFixture<ProprietaireLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProprietaireLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(ProprietaireLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
