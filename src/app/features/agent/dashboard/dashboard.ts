import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AgentService } from '../../../services/agent/agent-service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
 private agentService = inject(AgentService);
  private router = inject(Router);

  isLoading = signal(true);
  stats = signal({ salesToday: 0, activeReservations: 0, revenueToday: 0, pendingValidations: 0 });

  ngOnInit() {
    this.loadStats();
  }

  navigateTo(path: string) {
    void this.router.navigate([path]);
  }

  private loadStats() {
    this.agentService.getDashboardStats()
      .pipe(catchError((err: any) => {
        console.error('Error loading dashboard stats:', err);
        return of({ sales_today: 0, active_reservations: 0, revenue_today: 0, pending_validations: 0 });
      }))
      .subscribe((data: any) => {
        this.stats.set({
          salesToday: data.sales_today || 0,
          activeReservations: data.active_reservations || 0,
          revenueToday: data.revenue_today || 0,
          pendingValidations: data.pending_validations || 0
        });
        this.isLoading.set(false);
      });
  }
}
