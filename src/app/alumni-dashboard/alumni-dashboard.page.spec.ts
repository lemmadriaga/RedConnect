import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlumniDashboardPage } from './alumni-dashboard.page';

describe('AlumniDashboardPage', () => {
  let component: AlumniDashboardPage;
  let fixture: ComponentFixture<AlumniDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AlumniDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
