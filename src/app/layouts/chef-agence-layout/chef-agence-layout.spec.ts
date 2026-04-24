import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefAgenceLayout } from './chef-agence-layout';

describe('ChefAgenceLayout', () => {
  let component: ChefAgenceLayout;
  let fixture: ComponentFixture<ChefAgenceLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefAgenceLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(ChefAgenceLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
