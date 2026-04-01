import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubsManagementComponent } from './clubs-management.component';

describe('ClubsManagementComponent', () => {
  let component: ClubsManagementComponent;
  let fixture: ComponentFixture<ClubsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClubsManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
