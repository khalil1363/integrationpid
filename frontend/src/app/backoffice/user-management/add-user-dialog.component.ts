import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService, Role, User } from '../../services/user.service';

@Component({
  selector: 'app-add-user-dialog',
  template: `
    <h2 mat-dialog-title>Add New User</h2>
    <mat-dialog-content>
      <form [formGroup]="userForm" class="user-form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" required>
            <mat-error *ngIf="userForm.get('firstName')?.hasError('required')">
              First name is required
            </mat-error>
            <mat-error *ngIf="userForm.get('firstName')?.hasError('minlength')">
              First name must be at least 2 characters
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" required>
            <mat-error *ngIf="userForm.get('lastName')?.hasError('required')">
              Last name is required
            </mat-error>
            <mat-error *ngIf="userForm.get('lastName')?.hasError('minlength')">
              Last name must be at least 2 characters
            </mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="form-field full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" required>
          <mat-error *ngIf="userForm.get('email')?.hasError('required')">
            Email is required
          </mat-error>
          <mat-error *ngIf="userForm.get('email')?.hasError('email')">
            Please enter a valid email
          </mat-error>
          <mat-error *ngIf="userForm.get('email')?.hasError('forbiddenDomain')">
            Please use a real email domain (e.g. nom.prenom&#64;gmail.com).
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field full-width">
          <mat-label>Password</mat-label>
          <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
          <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
            <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-error *ngIf="userForm.get('password')?.hasError('required')">
            Password is required
          </mat-error>
          <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">
            Password must be at least 8 characters
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role" required>
            <mat-option value="STUDENT">Student</mat-option>
            <mat-option value="TUTOR">Tutor</mat-option>
            <mat-option value="ADMIN">Admin</mat-option>
            <mat-option value="CLUB_MANAGER">Club Manager</mat-option>
            <mat-option value="EMPLOYEE">Employee</mat-option>
          </mat-select>
          <mat-error *ngIf="userForm.get('role')?.hasError('required')">
            Role is required
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!userForm.valid || isSubmitting">
        <span *ngIf="!isSubmitting">Add User</span>
        <span *ngIf="isSubmitting">Adding...</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 500px;
      padding: 16px 0;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .form-field {
      flex: 1;
    }
    .full-width {
      width: 100%;
    }
    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }
  `]
})
export class AddUserDialogComponent {
  userForm: FormGroup;
  hidePassword = true;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddUserDialogComponent>,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email, this.forbiddenDomainValidator()]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['STUDENT', Validators.required]
    });
  }

  /** Refuse certains domaines d'email de test (example.com, test.com, etc.) */
  private forbiddenDomainValidator(): ValidatorFn {
    const blockedDomains = [
      'example.com',
      'exemple.com',
      'test.com',
      'test.fr',
      'mailinator.com',
      'tempmail.com',
      'yopmail.com'
    ];
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').toString();
      if (!value) {
        return null;
      }
      const atIndex = value.indexOf('@');
      if (atIndex === -1) {
        return null;
      }
      const domain = value.substring(atIndex + 1).toLowerCase();
      if (blockedDomains.includes(domain)) {
        return { forbiddenDomain: true };
      }
      return null;
    };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.userForm.value;

    this.userService.create({
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      password: formValue.password,
      role: formValue.role as Role
    } as User).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        this.snackBar.open('User added successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.dialogRef.close(user);
      },
      error: (err) => {
        console.error('Failed to create user', err);
        this.isSubmitting = false;
        const errorMessage = err.error?.message || err.error?.error || 'Failed to create user. Please try again.';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
