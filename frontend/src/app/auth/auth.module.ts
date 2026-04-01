import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing.module';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { TermsOfServiceComponent } from './terms-of-service/terms-of-service.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { SharedModule } from '../shared/shared.module';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
  declarations: [
    SigninComponent,
    SignupComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    TermsOfServiceComponent,
    PrivacyPolicyComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    SharedModule,
    MatRadioModule
  ]
})
export class AuthModule { }
