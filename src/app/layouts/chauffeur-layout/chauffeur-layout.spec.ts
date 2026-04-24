import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChauffeurLayout } from './chauffeur-layout';

describe('ChauffeurLayout', () => {
  let component: ChauffeurLayout;
  let fixture: ComponentFixture<ChauffeurLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChauffeurLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(ChauffeurLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
