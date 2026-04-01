import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BackofficeRoutingModule } from './backoffice-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { AddUserDialogComponent } from './user-management/add-user-dialog.component';
import { EditUserDialogComponent } from './user-management/edit-user-dialog.component';
import { ViewUserDialogComponent } from './user-management/view-user-dialog.component';
import { CoursesManagementComponent } from './courses-management/courses-management.component';
import { ClubsManagementComponent } from './clubs-management/clubs-management.component';
import { LayoutComponent } from './layout/layout.component';
import { BackofficeProfileComponent } from './profile/backoffice-profile.component';
import { EvaluationsManagementComponent } from './evaluations-management/evaluations-management.component';
import { EvaluationFormComponent } from './evaluation-form/evaluation-form.component';
import { EvaluationQuestionsComponent } from './evaluation-questions/evaluation-questions.component';
import { EvaluationAttemptsComponent } from './evaluation-attempts/evaluation-attempts.component';
import { SharedModule } from '../shared/shared.module';

// Angular Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';

@NgModule({
  declarations: [
    DashboardComponent,
    UserManagementComponent,
    AddUserDialogComponent,
    EditUserDialogComponent,
    ViewUserDialogComponent,
    CoursesManagementComponent,
    ClubsManagementComponent,
    EvaluationsManagementComponent,
    EvaluationFormComponent,
    EvaluationQuestionsComponent,
    EvaluationAttemptsComponent,
    LayoutComponent,
    BackofficeProfileComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BackofficeRoutingModule,
    SharedModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatTabsModule,
    MatSelectModule
  ]
})
export class BackofficeModule { }
