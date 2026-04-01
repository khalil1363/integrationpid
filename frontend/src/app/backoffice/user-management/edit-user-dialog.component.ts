import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService, User, Role } from '../../services/user.service';

@Component({
  selector: 'app-edit-user-dialog',
  template: `
    <h2 mat-dialog-title>Edit User</h2>
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
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field full-width">
          <mat-label>Password</mat-label>
          <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Leave empty to keep current password">
          <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
            <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-hint>Leave empty to keep current password</mat-hint>
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
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="isFormInvalid() || isSubmitting">
        <span *ngIf="!isSubmitting">Update User</span>
        <span *ngIf="isSubmitting">Updating...</span>
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
export class EditUserDialogComponent implements OnInit {
  userForm: FormGroup;
  hidePassword = true;
  isSubmitting = false;
  userId: number;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    private userService: UserService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: User
  ) {
    this.userId = data.id!;
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // Pas de validators pour permettre vide
      role: ['STUDENT', Validators.required]
    });
  }

  ngOnInit(): void {
    // Pre-fill form with existing user data
    this.userForm.patchValue({
      firstName: this.data.firstName,
      lastName: this.data.lastName,
      email: this.data.email,
      role: this.data.role
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  isFormInvalid(): boolean {
    const firstName = this.userForm.get('firstName');
    const lastName = this.userForm.get('lastName');
    const email = this.userForm.get('email');
    const role = this.userForm.get('role');
    const password = this.userForm.get('password');

    // Vérifier les champs requis
    const firstNameValue = firstName?.value || '';
    const lastNameValue = lastName?.value || '';
    const emailValue = email?.value || '';
    const roleValue = role?.value || '';

    const firstNameInvalid = firstName?.invalid || !firstNameValue || firstNameValue.trim().length < 2;
    const lastNameInvalid = lastName?.invalid || !lastNameValue || lastNameValue.trim().length < 2;
    const emailInvalid = email?.invalid || !emailValue;
    const roleInvalid = role?.invalid || !roleValue;

    if (firstNameInvalid || lastNameInvalid || emailInvalid || roleInvalid) {
      return true;
    }

    // Vérifier le password seulement s'il est rempli
    const passwordValue = password?.value || '';
    if (passwordValue && passwordValue.trim() !== '' && passwordValue.trim().length < 8) {
      return true;
    }

    return false;
  }

  onSubmit(): void {
    console.log('onSubmit called');
    console.log('Form valid:', this.userForm.valid);
    console.log('isFormInvalid:', this.isFormInvalid());
    console.log('isSubmitting:', this.isSubmitting);

    if (this.isFormInvalid() || this.isSubmitting) {
      if (this.isFormInvalid()) {
        console.log('Form is invalid');
        this.snackBar.open('Please fill all required fields correctly', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
      return;
    }

    this.isSubmitting = true;
    const formValue = this.userForm.value;
    const passwordValue = formValue.password;

    const updateData: User = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      role: formValue.role as Role
    };

    // Only include password if it was provided and valid
    if (passwordValue && passwordValue.trim() !== '' && passwordValue.trim().length >= 8) {
      updateData.password = passwordValue.trim();
    }

    console.log('Sending update request:', updateData);
    console.log('User ID:', this.userId);

    this.userService.update(this.userId, updateData).subscribe({
      next: (user) => {
        console.log('Update successful:', user);
        this.isSubmitting = false;
        this.snackBar.open('User updated successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.dialogRef.close(user);
      },
      error: (err) => {
        console.error('Failed to update user - Full error:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error body:', err.error);
        this.isSubmitting = false;
        const errorMsg = err.error?.message || err.error?.error || err.message || 'Failed to update user. Please try again.';
        this.snackBar.open(errorMsg, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
