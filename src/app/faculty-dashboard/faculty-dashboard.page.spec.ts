import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FacultyDashboardPage } from './faculty-dashboard.page';

describe('FacultyDashboardPage', () => {
  let component: FacultyDashboardPage;
  let fixture: ComponentFixture<FacultyDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FacultyDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
