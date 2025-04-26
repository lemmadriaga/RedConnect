import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackModalPage } from './feedback-modal.page';

describe('FeedbackModalPage', () => {
  let component: FeedbackModalPage;
  let fixture: ComponentFixture<FeedbackModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
