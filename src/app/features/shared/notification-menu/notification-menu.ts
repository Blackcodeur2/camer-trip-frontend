import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../services/notification/notification-service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notification-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="notification-container">
      <button class="notification-trigger" (click)="toggleMenu()">
        <mat-icon>notifications</mat-icon>
        @if (unreadCount() > 0) {
          <span class="badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
        }
      </button>

      @if (isOpen()) {
        <div class="notification-dropdown">
          <div class="dropdown-header">
            <h3>Notifications</h3>
            @if (unreadCount() > 0) {
              <button (click)="markAllAsRead()">Tout marquer comme lu</button>
            }
          </div>

          <div class="notification-list">
            @for (notif of notifications(); track notif.id) {
              <div class="notification-item" [class.unread]="!notif.read_at">
                <div class="item-icon" [ngClass]="notif.type">
                  <mat-icon>{{ getIcon(notif.type) }}</mat-icon>
                </div>
                <div class="item-content">
                  <p class="title">{{ notif.title }}</p>
                  <p class="message">{{ notif.message }}</p>
                  <span class="time">{{ notif.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="item-actions">
                  @if (!notif.read_at) {
                    <button class="btn-read" (click)="markAsRead(notif.id)" title="Marquer comme lu">
                      <mat-icon>done</mat-icon>
                    </button>
                  }
                  <button class="btn-delete" (click)="deleteNotif(notif.id)" title="Supprimer">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <mat-icon>notifications_none</mat-icon>
                <p>Aucune notification</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: relative;
    }
    .notification-trigger {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
      padding: 0.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: background 0.2s;
    }
    .notification-trigger:hover {
      background: #f1f5f9;
      color: var(--color-primary);
    }
    .badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #ef4444;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      min-width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }
    .notification-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: 350px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      overflow: hidden;
      animation: slideIn 0.2s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dropdown-header {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dropdown-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
    }
    .dropdown-header button {
      background: none;
      border: none;
      color: var(--color-primary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
    .notification-list {
      max-height: 400px;
      overflow-y: auto;
    }
    .notification-item {
      padding: 1rem;
      display: flex;
      gap: 0.75rem;
      border-bottom: 1px solid #f8fafc;
      transition: background 0.2s;
    }
    .notification-item:hover {
      background: #f8fafc;
    }
    .notification-item.unread {
      background: rgba(37, 99, 235, 0.03);
    }
    .item-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .item-icon.profile_update { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
    .item-icon.info { background: rgba(100, 116, 139, 0.1); color: #64748b; }
    .item-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .item-content { flex: 1; min-width: 0; }
    .title { margin: 0; font-size: 0.85rem; font-weight: 700; color: #1e293b; }
    .message { margin: 0.1rem 0; font-size: 0.75rem; color: #64748b; line-height: 1.4; }
    .time { font-size: 0.65rem; color: #94a3b8; }
    .item-actions { display: flex; flex-direction: column; gap: 0.25rem; opacity: 0; transition: opacity 0.2s; }
    .notification-item:hover .item-actions { opacity: 1; }
    .item-actions button { background: none; border: none; padding: 0.2rem; cursor: pointer; color: #94a3b8; border-radius: 4px; }
    .item-actions button:hover { background: #e2e8f0; color: #1e293b; }
    .item-actions .btn-read:hover { color: #10b981; }
    .item-actions .btn-delete:hover { color: #ef4444; }
    .empty-state { padding: 3rem 1rem; text-align: center; color: #94a3b8; }
    .empty-state mat-icon { font-size: 3rem; width: 3rem; height: 3rem; margin-bottom: 0.5rem; opacity: 0.5; }
    .empty-state p { margin: 0; font-size: 0.9rem; }
  `]
})
export class NotificationMenuComponent implements OnInit {
  private notifService = inject(NotificationService);

  notifications = this.notifService.notifications;
  unreadCount = this.notifService.unreadCount;
  isOpen = signal(false);

  ngOnInit() {
    this.notifService.getNotifications().subscribe();
  }

  toggleMenu() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.notifService.getNotifications().subscribe();
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'profile_update': return 'person_outline';
      case 'reservation': return 'confirmation_number';
      default: return 'info_outline';
    }
  }

  markAsRead(id: number) {
    this.notifService.markAsRead(id).subscribe();
  }

  markAllAsRead() {
    this.notifService.markAllAsRead().subscribe();
  }

  deleteNotif(id: number) {
    this.notifService.deleteNotification(id).subscribe();
  }
}
