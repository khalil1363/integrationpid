import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../services/user.service';

@Component({
  selector: 'app-view-user-dialog',
  template: `
    <h2 mat-dialog-title>User details</h2>
    <mat-dialog-content class="view-user-content">
      <div class="user-header">
        <img [src]="avatar" [alt]="data.firstName" class="avatar" />
        <div>
          <h3>{{ data.firstName }} {{ data.lastName }}</h3>
          <p class="email">{{ data.email }}</p>
          <p class="meta">
            <span class="badge role">{{ data.role }}</span>
            <span class="badge status">{{ data.status || 'ACTIVE' }}</span>
          </p>
        </div>
      </div>

      <div class="user-info-grid">
        <div class="info-item">
          <span class="label">Phone</span>
          <span class="value">{{ data.phone || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Address</span>
          <span class="value">{{ data.address || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Join date</span>
          <span class="value">{{ data.joinDate || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Last active</span>
          <span class="value">{{ data.lastActive || '—' }}</span>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .view-user-content {
      min-width: 420px;
    }
    .user-header {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
    }
    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
    }
    .email {
      margin: 0;
      color: #666;
      font-size: 13px;
    }
    .meta {
      margin-top: 4px;
      display: flex;
      gap: 8px;
      font-size: 12px;
    }
    .badge {
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid rgba(0,0,0,0.1);
    }
    .user-info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px 16px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .04em;
      color: #888;
    }
    .value {
      font-size: 13px;
      color: #222;
    }
  `]
})
export class ViewUserDialogComponent {
  avatar: string;

  constructor(
    private dialogRef: MatDialogRef<ViewUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User
  ) {
    this.avatar = data.photoBase64?.startsWith('http')
      ? data.photoBase64
      : data.photoBase64
        ? `data:image/jpeg;base64,${data.photoBase64}`
        : `https://via.placeholder.com/56x56/667eea/ffffff?text=${(data.firstName || '').charAt(0)}${(data.lastName || '').charAt(0)}`;
  }

  close(): void {
    this.dialogRef.close();
  }
}

