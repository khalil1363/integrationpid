import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { CoursesManagementComponent } from './courses-management/courses-management.component';
import { ClubsManagementComponent } from './clubs-management/clubs-management.component';
import { BackofficeProfileComponent } from './profile/backoffice-profile.component';
import { EvaluationsManagementComponent } from './evaluations-management/evaluations-management.component';
import { EvaluationFormComponent } from './evaluation-form/evaluation-form.component';
import { EvaluationQuestionsComponent } from './evaluation-questions/evaluation-questions.component';
import { EvaluationAttemptsComponent } from './evaluation-attempts/evaluation-attempts.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'courses', component: CoursesManagementComponent },
      { path: 'clubs', component: ClubsManagementComponent },
      { path: 'evaluations', component: EvaluationsManagementComponent },
      { path: 'evaluations/new', component: EvaluationFormComponent },
      { path: 'evaluations/:id', component: EvaluationFormComponent },
      { path: 'evaluations/:id/questions', component: EvaluationQuestionsComponent },
      { path: 'evaluations/:id/attempts', component: EvaluationAttemptsComponent },
      { path: 'profile', component: BackofficeProfileComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackofficeRoutingModule { }
