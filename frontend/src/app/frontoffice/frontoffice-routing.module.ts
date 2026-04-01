import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { CoursesComponent } from './courses/courses.component';
import { ChatComponent } from './chat/chat.component';
import { EvaluationsListComponent } from './evaluations-list/evaluations-list.component';
import { TakeEvaluationComponent } from './take-evaluation/take-evaluation.component';
import { EvaluationResultsComponent } from './evaluation-results/evaluation-results.component';
import { CertificateComponent } from './certificate/certificate.component';
import { CertificateVerifyComponent } from './certificate/certificate-verify.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'courses', component: CoursesComponent },
      { path: 'chat', component: ChatComponent }
      ,{ path: 'evaluations', component: EvaluationsListComponent }
      ,{ path: 'evaluations/:id/take', component: TakeEvaluationComponent }
      ,{ path: 'evaluations/:id/results', component: EvaluationResultsComponent }
      ,{ path: 'certificate', component: CertificateComponent }
    ]
  },
  { path: 'certificate/verify', component: CertificateVerifyComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrontofficeRoutingModule { }
