import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../../models/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  getNotifications(): Observable<Notification[]> {
    return this.http.get<{ statut: boolean; data: Notification[] }>(`${this.API}/notifications`)
      .pipe(
        map(response => response.data),
        tap(notifs => {
          this.notifications.set(notifs);
          this.unreadCount.set(notifs.filter(n => !n.read_at).length);
        })
      );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.patch(`${this.API}/notifications/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        this.updateUnreadCount();
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.API}/notifications/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => ({ ...n, read_at: new Date().toISOString() })));
        this.unreadCount.set(0);
      })
    );
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.API}/notifications/${id}`).pipe(
      tap(() => {
        this.notifications.update(list => list.filter(n => n.id !== id));
        this.updateUnreadCount();
      })
    );
  }

  private updateUnreadCount() {
    this.unreadCount.set(this.notifications().filter(n => !n.read_at).length);
  }
}
